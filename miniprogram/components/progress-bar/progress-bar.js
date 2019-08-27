// components/progress-bar/progress-bar.js
let movableAreaWidth = 0
let movableViewWidth = 0
let backgroundAudioManager = wx.getBackgroundAudioManager()

let currentSec = -1 //当前的秒数
let duration = 0 //当前歌曲总时长
let isMoving = false // 当前是否在拖拽

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

    onChange(event) {
      if(event.detail.source == 'touch') {
        this.data.progress = event.detail.x / (movableAreaWidth-movableViewWidth) *100
        this.data.movableDis  = event.detail.x
        isMoving = true
      }
     
     
    },
    onTouchEnd() {
   const currentTimeFmt = this._dateFormat(Math.floor(backgroundAudioManager.currentTime))
      this.setData({
        progress: this.data.progress,
       movableDis: this.data.movableDis,
       ['showTime.currentTime']: currentTimeFmt.min+ ':'+ currentTimeFmt.sec
      })
      backgroundAudioManager.seek(duration* this.data.progress / 100 )
      isMoving = false
    },
  //  获取可移动区域宽度
  _getMovableDis() {
    const query = this.createSelectorQuery()
    query.select('.movable-area').boundingClientRect()
    query.select('.movable-view').boundingClientRect()

    query.exec((rect) => {
      console.log(rect)
      movableAreaWidth = rect[0].width
      movableViewWidth = rect[1].width
    })
      
  },
  // 监听音乐播放
  _bindBGMEvent() {
    // 监听背景音乐播放事件
    backgroundAudioManager.onPlay(() => {
      console.log('onPlay')
      isMoving = false
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
     if(!isMoving) {

    //  当前歌曲正在播放的时间
    const currentTime = backgroundAudioManager.currentTime
    // 当前歌曲的总时间
    const duration = backgroundAudioManager.duration
    const sec = currentTime.toString().split('.')[0]
    if(sec !==currentSec) {
      // 正在播放的时间转换格式 -> ? 分 ？秒
      const currentTimeFmt = this._dateFormat(currentTime)
      this.setData({
        movableDis: (movableAreaWidth-movableViewWidth) * currentTime/ duration,
        progress: currentTime/duration *100,
        ['showTime.currentTime']:`${currentTimeFmt.min}:${currentTimeFmt.sec}`
      })
      currentSec = sec


    }
     }
    })
  // 监听背景音乐自然播放结束
    backgroundAudioManager.onEnded(() => {
    console.log('onEnded')
   this.triggerEvent('end')

    })
  // 监听背景音乐错误事件
    backgroundAudioManager.onError((res) => {
      console.error(res.errMsg)
      console.error(res.errCode)
   
    })
  },
  // 获取音乐总的播放时间
  _setTime() {
     duration = backgroundAudioManager.duration
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
