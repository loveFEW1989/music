// miniprogram/pages/blog/blog.js
let keyword = ''
Page({

  /**
   * 页面的初始数据
   */
  data: {
   showModal: false,
   blogList: [], // 博客列表
  },

  // 查询事件
  onSearch(event) {
    this.setData({
      blogList: []
    })
    keyword = event.detail.keyword
    this._loadBlogList()
  },
  // 跳转到评价页面
  goToComment(event) {
   wx.navigateTo({
     url: `/pages/blog-comment/blog-comment?id=${event.target.dataset.blogid}`
   })
  },
  // 发布功能
  onPublish() {
    
    wx.getSetting({
      success: (res)=> {
        console.log(res)
        if(res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: (res) => {
              this.onLoginSuccess({
                detail: res.userInfo
              })
            }
          })
        } else {
          this.setData({
            showModal: true
          })
        }
      }
    })
  },  
  onLoginSuccess(event) {
    console.log(event)
    const detail = event.detail
    wx.navigateTo({
    url: `../blog-edit/blog-edit?nickName=${detail.nickName}&avatarUrl=${detail.avatarUrl}`
      
    })
  },
  onLoginFail() {
    wx.showModal({
      title:'授权用户才能发布',
      content: ''
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this._loadBlogList()
  },

   _loadBlogList(start=0) {
     wx.showLoading({
       title:"拼命加载中..."
     })
    wx.cloud.callFunction({
      name: 'blog',
      data: {
        $url: 'list',
        keyword,
        start,
        count:3
      }
    }).then((res) => {
       this.setData({
         blogList: this.data.blogList.concat(res.result)
       })
       wx.hideLoading()
       wx.stopPullDownRefresh()
       console.log(res.result)
    })
   },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setData({
      blogList: []
    })
this._loadBlogList()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {
this._loadBlogList(this.data.blogList.length)
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})