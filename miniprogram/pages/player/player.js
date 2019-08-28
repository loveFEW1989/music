// miniprogram/pages/player/player.js
let musiclist = []
// 当前正在播放的歌曲id
let playingIndex = 0

let backgroundAM = wx.getBackgroundAudioManager();
  
const app = getApp()

Page({

  /**
   * 页面的初始数据
   */
  data: {
   picUrl: '',
   isplaying: false,  //当前是否正在播放,
   islyricShow: false,  //是否显示歌词
   lyric: '', //歌词文件
   isSame : false //是否是同一首歌
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
 
  playingIndex = options.index
  musiclist = wx.getStorageSync('musiclist')
  this._loadMusicDetail(options.musicId)
  },
  onPlay() {
    this.setData({isplaying:true})
  },
  onPause() {
   this.setData({isplaying: false})
  },

  onTimeUpdate(event) {
this.selectComponent('.lyric').update(event.detail.currentTime)
  },
  changeLyricShow() {
    this.setData({
      islyricShow: !this.data.islyricShow
    })
  },
_loadMusicDetail(musicId) {
  if(musicId == app.getPlayingMusicId()) {
    this.setData({
      isSame:true
    })
  } else {
    this.setData({isSame:false})
  }
  if(!this.data.isSame){ backgroundAM.stop()}
 
  let music = musiclist[playingIndex]
 
  wx.setNavigationBarTitle({
    title: music.name
  })
  this.setData({
    picUrl:music.al.picUrl
  })
  app.setPlayingMusicId(musicId)
  wx.showLoading({title:'数据加载中...'})
  wx.cloud.callFunction({
    name:'music',
    data: {
      $url:'musicUrl',
      musicId

    }
  }).then((res) => {
    
    let result = JSON.parse(res.result)
    if(result.data[0].url == null) {
      wx.showToast({
        title:'VIP歌曲，无播放权限'
      })
      return
    }
    if(!this.data.isSame){
      backgroundAM.src= result.data[0].url
      backgroundAM.title=music.name,
      backgroundAM.coverImgUrl = music.al.picUrl
      backgroundAM.singer = music.ar[0].name
      backgroundAM.epname = music.al.name
  
    }
   
    wx.hideLoading()
    this.setData({
      isplaying: true
    })
    wx.cloud.callFunction({
      name:'music',
      data: {
        musicId,
        $url:'lyric'
      }
    }).then((res)=> {
      
      let lyric = '暂无歌词'
      const lrc = JSON.parse(res.result).lrc
      if(lrc) {
        lyric = lrc.lyric
      }
      this.setData({lyric})
    })

  })

},

togglePlaying() {
 
  
  if(this.data.isplaying) {
    backgroundAM.pause()
  } else {
    backgroundAM.play()
  }

  this.setData({
    isplaying: !this.data.isplaying
  })
 
},
prevChange() {
  playingIndex--
  if(playingIndex <0) {
    playingIndex  = musiclist.length - 1
 }
 this._loadMusicDetail(musiclist[playingIndex].id)
  
},
nextChange() {
  playingIndex ++
  if(playingIndex === musiclist.length) {
    playingIndex  = 0
  }
  this._loadMusicDetail(musiclist[playingIndex ].id)
}
  
})