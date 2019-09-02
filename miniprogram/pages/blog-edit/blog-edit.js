// 可以输入文字的最大个数
const MAX_WORDS_NUM = 140
// 最大可上传图片数量
const MAX_IMG_NUM = 9

// 输入的文字内容
let content = ''

// 用户信息
let userInfo = {}

// 底部提示文字
let footerWord = ''

// 初始化云数据库
const db =wx.cloud.database()

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
userInfo = options
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

  // 图片文字内容上传到云数据库
   send() {
    if (content.trim() === '') {
     wx.showModal({
       title: '请输入内容',
       content: ''
     })
     return 
    }
      
    wx.showLoading({
      title: '发布中...',
      mask: true
    })
    let promiseArr = []

    let fileIds = []

    // 图片上传
    for(let i =0; i< this.data.imageslist.length;i++) {
      let p = new Promise((resolve, reject)=> {
        let item = this.data.imageslist[i]
        // 扩展名
        let suffix = /\.\w+$/.exec(item)[0]
        wx.cloud.uploadFile({
          cloudPath: 'blog/'+ Date.now()+ Math.random()*10000+suffix,
          filePath: item,
          success: (res) => {
            console.log(res)
            
            fileIds = fileIds.concat(res.fileID)
            resolve()
          },
          fail: (error) => {
            
            reject()
          }
        })

      })
      promiseArr.push(p)
    }
    //  存入云数据库
Promise.all(promiseArr).then((res) => {
  db.collection('blog').add({
    data: {
      ...userInfo,
      content,
      img: fileIds,
      createTime: db.serverDate()
    }
  }).then((res) => {
    wx.hideLoading()
    wx.showToast({
      title: '发布成功'
    })
    wx.navigateBack()
    // 获取当前页面栈
    const pages =  getCurrentPages();
    // 取得上一个页面
    const prevPage =pages[pages.length-2]
    prevPage.onPullDownRefresh()
    
  })
}).catch((error) => {
   wx.hideLoading()
   wx.showToast({
     title:' 发布失败'
   })
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