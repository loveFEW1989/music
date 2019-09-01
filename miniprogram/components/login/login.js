// components/login/login.js
Component({
  /**
   * 组件的属性列表
   */
  properties: {
    showModal: Boolean
  },

  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
    getUser(event) {
      console.log(event)
      const userInfo = event.detail.userInfo
      if(userInfo) {
         this.setData({
           showModal: false
         })
         this.triggerEvent('loginsuccess',userInfo)
      }
      else {
        this.triggerEvent('loginfail')
      }
    }
  }
})
