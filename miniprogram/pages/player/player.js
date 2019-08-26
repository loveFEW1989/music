// miniprogram/pages/player/player.js
let musiclist = []
// 当前正在播放的歌曲id
let playingIndex = 0

let backgroundAM = wx.getBackgroundAudioManager();
  

Page({

  /**
   * 页面的初始数据
   */
  data: {
   picUrl: '',
   isplaying: false  //当前是否正在播放
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
  console.log(options)
  playingIndex = options.index
  musiclist = wx.getStorageSync('musiclist')
  this._loadMusicDetail(options.musicId)
  },

_loadMusicDetail(musicId) {
  backgroundAM.stop()
  let music = musiclist[playingIndex]
  console.log(music)
  wx.setNavigationBarTitle({
    title: music.name
  })
  this.setData({
    picUrl:music.al.picUrl
  })
  wx.showLoading({title:'数据加载中...'})
  wx.cloud.callFunction({
    name:'music',
    data: {
      $url:'musicUrl',
      musicId

    }
  }).then((res) => {
    console.log(JSON.parse(res.result))

    let result = JSON.parse(res.result)
    backgroundAM.src= result.data[0].url
    backgroundAM.title=music.name,
    backgroundAM.coverImgUrl = music.al.picUrl
    backgroundAM.singer = music.ar[0].name
    backgroundAM.epname = music.al.name

    wx.hideLoading()
    this.setData({
      isplaying: true
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