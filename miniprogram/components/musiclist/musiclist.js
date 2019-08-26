// components/musiclist/musiclist.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
musiclist: Array
  },

  /**
   * 组件的初始数据
   */
  data: {
  playingId: 0
  },

  /**
   * 组件的方法列表
   */
  methods: {
  selectMusic(e) {
    console.log(e.currentTarget.dataset.musicid)
    const ds = e.currentTarget.dataset
    const musicid = ds.musicid
    this.setData({
      playingId: musicid
    })
    wx.navigateTo({
      url: `/pages/player/player?musicid=${musicid}&index=${ds.idx}`
      
    })
  }
  }
})
