# 小程序云开发 -- 仿网易云音乐

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




```


# 云开发 quickstart

这是云开发的快速启动指引，其中演示了如何上手使用云开发的三大基础能力：

- 数据库：一个既可在小程序前端操作，也能在云函数中读写的 JSON 文档型数据库
- 文件存储：在小程序前端直接上传/下载云端文件，在云开发控制台可视化管理
- 云函数：在云端运行的代码，微信私有协议天然鉴权，开发者只需编写业务逻辑代码

## 参考文档

- [云开发文档](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html)

