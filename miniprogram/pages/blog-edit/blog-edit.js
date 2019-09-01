// 可以输入文字的最大个数
const MAX_WORDS_NUM = 140
// 最大可上传图片数量
const MAX_IMG_NUM = 9

// 输入的文字内容
let content = ''

// 底部提示文字
let footerWord = ''


Page({

  /**
   * 页面的初始数据
   */
  data: {
    // 已输入的文字个数
  wordsNum: 0,
  footerBottom: 0,
  imageslist: [],
  // 添加图片的元素是否显示
  selectPhoto: true,
  
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
console.log(options)
  },

  onInput(event) {
   console.log(event)
   let wordsNum = event.detail.value.length
   if(wordsNum>= MAX_WORDS_NUM) {
    wordsNum =  `最大可输入字数为${MAX_WORDS_NUM}`
   }
   
   this.setData({
     wordsNum
   })
   content = event.detail.value
  },
  // 获取焦点事件
  onFocus(event) {
  //  模拟器获取的键盘高度
  this.setData({
    footerBottom: event.detail.height
  })
  },
// 失去焦点事件
  onBlur() {
    this.setData({
      footerBottom: 0,
    })
  },
  // 选择照片
  chooseImage() {
  // 还能再选几张照片
    let max= MAX_IMG_NUM - this.data.imageslist.length
   wx.chooseImage({
     count: 9, // 最多可以选择的图片张数，默认9
     sizeType: ['original', 'compressed'], // original 原图，compressed 压缩图，默认二者都有
     sourceType: ['album', 'camera'], // album 从相册选图，camera 使用相机，默认二者都有
     success: (res) => {
    
       this.setData({
        imageslist: this.data.imageslist.concat(res.tempFilePaths)
       })

       max = MAX_IMG_NUM - this.data.  imageslist.length
       this.setData({
         selectPhoto: max<=0 ? false : true
       })
      
     }
   })

  }, 
  // 删除图片
  onDelImage(event) {
   
   this.data.imageslist.splice(event.target.dataset.idx,1)
   this.setData({
     imageslist: this.data.imageslist
   })
   if(this.data.imageslist.length< MAX_IMG_NUM) {
     this.setData({
       selectPhoto: true
     })
   }
  },
  // 预览照片
  onPreviewImage(event) {
   wx.previewImage({
      current: event.target.dataset.imgsrc, 
     urls: this.data.imageslist
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

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})