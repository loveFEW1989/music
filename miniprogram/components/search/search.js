// components/search/search.js
let keyword = ''
Component({
  /**
   * 组件的属性列表
   */
  properties: {
 placeholder: {
   type: String,
   value: '请输入关键字'
 }
  },

  // 从外部传进来的样式

  externalClasses: [
    'iconfont',
    'iconsousuo'
  ],


  /**
   * 组件的初始数据
   */
  data: {

  },

  /**
   * 组件的方法列表
   */
  methods: {
   onInput(event) {
    keyword = event.detail.value
   },
   onSearch() {
     this.triggerEvent('search', {keyword})
     console.log('111')
   }
  }
})
