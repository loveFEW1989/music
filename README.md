# 小程序云开发 -- 仿网易云音乐

# 需要解决的问题

1,获取的歌曲url存入缓存？
2，首页获取的歌单数据能不能缓存


observers 数据监听器
['playlist.playCount'] 监听对象的属性，
最后赋值的时候 赋值给data 中的值，而不是原值，不然会造成死循环

data: {_count:0}

wx:key="*this"  >>  指向元素本身

# promise简介

```
// 三种状态
// pending 初始状态 fulfulled 成功状态 rejected 失败状态
new Promise((resolve,reject) => {
 
})
Promise.all([... ... ...]).then((res) => {})
Promise.race()
```

#async await 

```




```

# request-promise 第三方请求库


# 云数据库中的数据去重

```
<!-- 每次读取歌单云函数，有可能获取的是重复的歌单，如果不去重的话 数据库中就会有重复的歌单数据 -->

<!-- 通过判断id -->

```

# 突破获取云数据库中数据的条数限制
```
云函数中一次只能获取100条数据
小程序端一次只能获取20条

一次获取100条 多次获取互拼接成新数组 就是全部的数据

count() 获取条数对象
.total  转成数字
reduce
```
# 获取歌单列表以及 把新的歌单数据上传到云数据库

```
// 云函数入口文件
const cloud = require('wx-server-sdk')
// 初始化云函数
cloud.init({
  env: ''
})
// 初始化数据库
const db = cloud.database()
// 引入request-promise/
const rp = require('request-promise')
// 从服务器获取歌单列表
const URL = 'http://musicapi.xiecheng.live/personalized'

// 获取playlist数据库
const playlistCollection = db.collection('playlist')

// 每次从云数据库中获取的数据条数

const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async(event, context) => {
  // const list = await playlistCollection.get()
  // 获取云函数中数据总条数 -- 返回的是对象
  const countResult = await playlistCollection.count()
  // 转换成数字格式
  const total = countResult.total
  // 总共需要从云函数调用的次数
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  // promise列表集合
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    // 0-->100  100->200  200->300
    let promise = playlistCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  let list = {
    data: []
  }
  // 如果需要多次调用云数据库...
  if (tasks.length > 0) {
    // 把多次调用的数组合并成一个新数组
    list = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data)
      }
    })
  }
  // 从服务器中获取的歌单列表
  const playlist = await rp(URL).then((res) => {
    return JSON.parse(res).result
  })
// 数组去重 每次从服务器获取的歌单 要与 云数据库中的歌单列表比较，
// 如果id相同 就不把响应的数据推到云数据库中 反之则要把新数据推到云数据库中

  const newData = []
  for (let i = 0, len1 = playlist.length; i < len1; i++) {
    let flag = true
    for (let j = 0, len2 = list.data.length; j < len2; j++) {
      if (playlist[i].id === list.data[j].id) {
        flag = false
        break
      }
    }
    if (flag) {
      newData.push(playlist[i])
    } 
  }
  
  for (let i = 0, len = newData.length; i < len; i++) {
    await playlistCollection.add({
      data: {
        ...newData[i],
        createTime: db.serverDate(),
      }
    }).then((res) => {
      console.log('插入成功')
    }).catch((err) => {
      console.error('插入失败')
    })
  }

  return newData.length
}
```



# 定时触发器
云函数文件夹下 新建config.json
每天的10点 14点 16点 23点 自动执行云函数
```
{
  "triggers": [
    {
      "name": "myTrigger",
      "type": "timer",
      "config": "0 0 10 14 16 23 * * * *"
    }
  ]
}

```
# 首页开发 从云数据库中取 歌单数据
```
1，新建云函数 music 

2, playlist页面中 在onLoad钩子函数中调用云函数 获取云数据库中的数据

3, onLoad() 取15条数据  ，滚动触底时继续取剩下的数据， 
this.setData({playList:this.data.playList.concat(res.result.data)})

4,下拉刷新 

json中设置 允许下拉刷新
"enablePullDownRefresh":  true
先把数组清空 在重新请求数据

下拉刷新 已经重新获取到数据了 但是 是哪个小点还是存在???

wx.stopPullDownRefresh() 停止下拉刷新这个动作

5 加锁 解锁    8月25 未解决
所有数据都获取到以后 触底时会继续向服务器发送请求，这个问题怎么解决


```
# 首页开发  点击歌单图片 跳转到歌单详情页面

```
1,wx.navigationTo() 把歌单id 当参数传入   在详情页通过 options获取到
传过来的id ，然后通过id从云数据库中获取到 当条歌单的详细信息

2，获取该条歌单详细信息云函数  music   -- 通过tcb-router分配路由

pages/musiclist/musiclist.js  :

onLoad: function (options) {
  wx.showLoading({title:'数据加载中...'})
  wx.cloud.callFunction({
    name: 'music',
    data: {
      playlistId: options.playlistId,
      $url: 'musiclist'
    }
  }).then((res)=> {
    const pl = res.result.playlist
    this.setData({
      musiclist: pl.tracks,
      listInfo: {
        coverImgUrl: pl.coverImgUrl,
        name: pl.name
      }
    })

  })
}


云函数  'music' :

const cloud = require('wx-server-sdk')

const TcbRouter = require('tcb-router')

const rp = require('request-promise')

const BASE_URL = 'http://musicapi.xiecheng.live'

cloud.init()

const db = cloud.database()

<!-- 云函数入口 -->

exports.main = async (event, context) => {
  const app = new TcbRouter({event})

  app.router('playlist', async(ctx,next) => {
    ctx.body = await db.collection('playlist)
    .skip(event.start)
    .limit(event.count)
    .orderBy('createTime','desc')
    .get()
    .then((res) => {
      return res
    })
  })


  app.router('musiclist', async (ctx,next) => {
    ctx.body = await rp(BASE_URL+ '/playlist/detail?id='+ parseInt(event.playlistId))
    .then((res) => {
      return JSON.parse(res)
    })
  })
  

  return app.serve()
}







```

#播放页面

```
1,点击首页歌单图片请求当前歌单详情时，通过wx.setStorageSyc() 把详情存入缓存

2，从歌单详情页 跳转到 歌曲详情页  我们要把cid 也就是点击的是歌单中的哪首歌曲 传过去


3， 通过cid从缓存中取出歌曲数据



4，引入iconfont  制作控制面板

<!-- 控制面板 -->
<view class="control">
  <text class="prev iconfont iconshangyishou"></text>
  <text class="play iconfont iconbofang" > </text>
  <text class="next iconfont iconxiayigexiayishou"></text>
</view>

5,实现控制面板的功能

"requiredBackgroundModes": ["audio"], 允许后台播放音乐
// 获取全局唯一的背景音频管理器
const backgroundAM = wx.getBackgroundAudioManager()

<!-- 设置播放音乐控制面板信息 -->
<!-- 播放链接 -->
backgroundAM.src= result.data[0].url
<!-- title -->
backgroundAM.title=music.name,
<!-- 封面图片 -->
backgroundAM.coverImgUrl = music.al.picUrl
<!-- 歌手名 -->
backgroundAM.singer = music.ar[0].name
<!-- 专辑名 -->
backgroundAM.epname = music.al.name


player.js : 

以下是player.js中的代码

<!-- 存储的是歌曲信息列表 -->
let musiclist = [ ]

当前正在播放的歌曲id 默认为0
let playingIndex = 0

获取全局唯一的背景音频管理器
const backgroundAM = wx.getBackgroundAudioManager()

data: {
  picUrl: '' //播放背景图片地址
  isplaying: false  //是否正在播放歌曲

}
onLoad: function(options) {
  获取当前歌曲是歌单中的哪一首
  playingIndex = options.index
  从缓存中获取当前歌曲,歌手,专辑等相关信息（不包括播放地址等信息）
  musiclist = wx.getStogrageSyc('musiclist)
  通过从options中获取到的musicId 向服务器请求数据
  this._loadMusicDetail(options.musicId)


},

_loadMusicDetail(musicId) {
  当前正在播放的歌曲信息
  let music = musiclist[playingIndex]
  设置播放页标题栏文字
  wx.setNavigationBarTitle({
    title:music.name
  })
  获取播放背景图片
  this.setData({
    picUrl:music.al.picUrl
  })

通过云函数获取当前歌曲播放链接
wx.cloud.callFunction({
    name:'music',
    data: {
      $url:'musicUrl',
      musicId

    }
  }).then((res) => {
  
    let result = JSON.parse(res.result)
    播放链接
    backgroundAM.src= result.data[0].url
    标题
    backgroundAM.title=music.name,
    封面图
    backgroundAM.coverImgUrl = music.al.picUrl
    歌手名
    backgroundAM.singer = music.ar[0].name
    封面名称
    backgroundAM.epname = music.al.name

    wx.hideLoading()
    将状态设置成正在播放
    this.setData({
      isplaying: true
    })
  })

}

中间播放暂停按钮点击事件
togglePlaying() {
  if(this.data.isplaying) {
    backgroundAM.pause()
  }else {
    backgroundAM.play()
  }
  this.setData({
    isplaying: !this.data.isplaying
  })
}


上一首按钮点击事件
prevChange() {
  playingIndex--
  如果当前已经是第一首 就跳转到最后一首 获取最后一首的url
  if(playinfIndex < 0) {
    playingIndex = musiclist.length-1
  }
  this._loadMusicDetail(musiclist[palyingIndex].id)
}


下一首按钮点击事件
nextChange() {
  playingIndex++
  如果当前是最后一首就跳转到第一首 获取第一首的Url
  if(playingIndex === musiclist.length) {
    playingIndex = 0
  }
  this._loadMusicDetail(musiclist[playingIndex].id)
}


ps: 播放页面中间的图片以及唱片指针都由状态isplaying来控制
播放状态，isplaying为true 中间唱片图片旋转 唱片指针移动到唱片上
暂停状态，isplaying为false 中间唱片停止旋转 唱片指针移开

<view class="player-disc {{isPlaying?'play': ''}}" >
    <image class="player-img rotation {{isPlaying?'':'rotation-paused'}}" src="{{picUrl}}"></image>
</view>
isplaying控制两个class属性  'play' ->唱片指针移开移入切换
'rotation-paused'   控制图片旋转
.player-disc::after {
  content: '';
  width: 192rpx;
  height: 274rpx;
  position: absolute;
  top: -150rpx;
  left: 266rpx;
  background: url('https://s3.music.126.net/m/s/img/needle.png?702cf6d95f29e2e594f53a3caab50e12') no-repeat center/contain;
  transform: rotate(-15deg);
  transform-origin: 24rpx 10rpx;
  transition: transform 0.5s ease;
}

.play.player-disc::after {
  transform: rotate(0deg);
}



.rotation {
  animation: rotation 12s linear infinite;
  -moz-animation: rotation 12s linear infinite;
  -webkit-animation: rotation 12s linear infinite;
  -o-animation: rotation 12s linear infinite;
}

.rotation-paused {
  animation-play-state: paused;
}








```
#进度条组件progress-bar
数据：
showTime :{ currentTime当前播放时间  totalTime歌曲总时间}
可移动区域
<movable-area>
<movable-view></movable-view>
</movable-area> 
进度控制
<progress></progress>


小程序自定义组件生命周期 =>
```
lifetimes: {
    attached: function() {
      // 在组件实例进入页面节点树时执行
    },
    detached: function() {
      // 在组件实例被从页面节点树移除时执行
    },
  },
  // 以下是旧式的定义方式，可以保持对 <2.2.3 版本基础库的兼容
  attached: function() {
    // 在组件实例进入页面节点树时执行
  },
  detached: function() {
    // 在组件实例被从页面节点树移除时执行
  },
  // 
```

**************************************
```
progress-bar.js  =>

1,获取进度条可移动区域的实际宽度 
默认进度条宽度
let movableAreaWidth = 0
默认圆圈宽度
let movableViewWidth = 0

背景音乐播放器
const backgroundAudioManager = wx.getBackgroundAudioManager()

data:{
  showTime:{
   currentTime:'00:00', // 歌曲播放时间
   totalTime: '00:00' // 歌曲总时间

  },
  movableDis: 0,  //x轴偏移距离
}
lifetimes: {
  ready() {
     获取进度条宽度和中间圆的宽度
     this._getMovableDis()
     监听背景音乐播放
    this._bindBGMEvent()
  }
},
methods: {
   //  获取进度条宽度和中间圆的宽度
  _getMovableDis() {
    const query = wx.createSelectorQuery()
    query.select('.movable-area').boundingClientRect()
    query.select('.movable-view').boundingClientRect()
    query.exec((rect) => {
      movableAreaWidth = rect[0].width
      movableViewWidth = rect[1].width
    })
  },
  _bindBGMEvent() {
    backgroundAudioManager.onCanplay(() => {
      <!-- backgroundAudioManager.duration可以获取到音乐播放时间
      但是因为程序的bug 有时候获取的是undefined 所以如果得到的值不是Undefined
      就把获取到的时间赋值给totalTime  反之则延迟1s 继续通过
      backgroundAudioManager.duration获取到音乐播放时间，再赋值给totalTime -->
      if(typeof backgroundAudioManager.duration !== 'undefined') {
        this._setTime()
      } else {
        setTimeOut(()=> {
        this._setTime()  
        },1000)
      }
    })
  },
  设置真实的歌曲播放总时间
  _setTime() {
    duration = backgroundAudioManager.duration
    coant durationFram = this._dateFram(duration)
    this.setData({
      ['showTime.totalTime']: `${durationFram(min)}:${durationFram(sec)}`
    })
  },
  <!-- 格式化时间   把获取到的毫秒 => ? 分 ？秒的形式   -->
  _dateFram(time){
    const min = Math.floor(time/60)
    const sec = Math.floor(time%60) 
    return {
      'min': this._parse0(min),
      'sec': this._parse0(sec)
    }
  },
  <!-- 补零 -->
  _parse0(time){
    return time < 10 ? '0'+time : time
  }
}




```

# 云开发 quickstart

这是云开发的快速启动指引，其中演示了如何上手使用云开发的三大基础能力：

- 数据库：一个既可在小程序前端操作，也能在云函数中读写的 JSON 文档型数据库
- 文件存储：在小程序前端直接上传/下载云端文件，在云开发控制台可视化管理
- 云函数：在云端运行的代码，微信私有协议天然鉴权，开发者只需编写业务逻辑代码

## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

