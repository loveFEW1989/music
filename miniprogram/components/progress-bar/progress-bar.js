// components/progress-bar/progress-bar.js
let movableAreaWidth = 0
let movableViewWidth = 0
let backgroundAudioManager = wx.getBackgroundAudioManager()

Component({
  /**
   * 组件的属性列表
   */
  properties: {

  },

  /**
   * 组件的初始数据
   */
  data: {
   showTime:{
     currentTime: '00:00',
     totalTime: '00:00'
   },
   movableDis:0,
   progress: 0
  },
  // 组件生命周期
 lifetimes: {
   ready() {
    this._getMovableDis()
    this._bindBGMEvent()
   }
 },


  /**
   * 组件的方法列表
   */
  methods: {
  //  获取可移动区域宽度
  _getMovableDis() {
    const query = this.createSelectorQuery()
    query.select('.movable-area').boundingClientRect()
    query.select('.movable-view').boundingClientRect()

    query.exec((rect) => {
      console.log(rect)
    })
      
  },
  // 监听音乐播放
  _bindBGMEvent() {
    // 监听背景音乐播放事件
    backgroundAudioManager.onPlay(() => {
      console.log('onPlay')
    })
    // 监听背景音乐停止事件
    backgroundAudioManager.onStop(() => {
      console.log('onStop')
    })
    // 监听背景音乐暂停事件
    backgroundAudioManager.onPause(() => {
      console.log('Pause')
      
    })
  //  当音频因为数据不够，需要停下来加载
    backgroundAudioManager.onWaiting(() => {
      console.log('onWaiting')
    })
  // 音频进入可播放状态 但不保证后面可以继续流畅播放
    backgroundAudioManager.onCanplay(() => {
      console.log('onCanplay')
      if(typeof backgroundAudioManager.duration !== 'undefined') {
        this._setTime()
      } else {
        setTimeout(()=> {
         this._setTime()
        },1000)
      }
    })
  //  播放进度更新事件，只有小程序前台回调
    backgroundAudioManager.onTimeUpdate(() => {
     console.log('time update。。。')
    })
  // 监听背景音乐自然播放结束
    backgroundAudioManager.onEnded(() => {
    console.log('onEnded')
    })
  // 监听背景音乐错误事件
    backgroundAudioManager.onError((res) => {
      console.error(res.errMsg)
      console.error(res.errCode)
   
    })
  },
  // 获取音乐总的播放时间
  _setTime() {
    const duration = backgroundAudioManager.duration
    const durationFmt = this._dateFormat(duration)
    console.log(durationFmt)
    this.setData({
      ['showTime.totalTime']: `${durationFmt.min}:${durationFmt.sec}`
    })
  },
  // 把毫秒的音乐总时长换算成 * 分 * 秒的形式
  _dateFormat(time) {
    const min = Math.floor(time/60)
    const sec = Math.floor(time%60)
    return {
      'min':this._parse0(min),
      'sec':this._parse0(sec)
    }
  },
  // 实现时间补零的功能
  _parse0(time) {
    return time < 10 ? '0'+time :time
  }


  }
})
