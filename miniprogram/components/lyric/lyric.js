// components/lyric/lyric.js
 let lyricHeight = 0  //1rpx 对应px的大小
Component({
  /**
   * 组件的属性列表
   */
  properties: {
   islyricShow: {
     type:Boolean,
     value: false
   },
   lyric:String
  },
  observers: {
   lyric(lrc) {
    if(lrc == '暂无歌词') {
     lrcList= {
       lrc,
       time:0
     }
    } else {
      this._parseLyric(lrc)
    }
   }
  },
  /**
   * 组件的初始数据
   */
  lifetimes: {
    ready() {
      wx.getSystemInfo({
        success: function(res) {
          lyricHeight = res.screenWidth /750 * 64
        }
      })
    }
  },
  data: {
  lrcList: [], //歌词列表
  nowLyricIndex: 0, // 当前正在播放的歌词的索引
  scrollTop:0
  },

  /**
   * 组件的方法列表
   */
  methods: {
    update(currentTime) {
  
   let lrcList = this.data.lrcList
   if(lrcList.length ==0) {
     return 
   }
   if(currentTime> lrcList[lrcList.length-1].time) {
     if(this.data.nowLyricIndex !== -1) {
       this.setData({
         nowLyricIndex: -1,
         scrollTop: lrcList.length* lyricHeight
       })
     }
   }
 for(let i =0,len = lrcList.length;i< len;i++) {
   if(currentTime<= lrcList[i].time) {
    this.setData({
      nowLyricIndex: i-1,
      scrollTop:(i-1)* lyricHeight
    })
    break;
   }
 }


    },
    _parseLyric(linelrc) {
      let line = linelrc.split('\n')
      let _lrcList = []

      line.forEach((item)=> {
        let time = item.match(/\[(\d{2,}):(\d{2})(?:\.(\d{2,3}))?]/g)
        
        if(time !== null) {
          let lrc = item.split(time)[1]
          
          let timeReg = time[0].match(/(\d{2,}):(\d{2})(?:\.(\d{2,3}))?/)
         
          // 把事件转换为秒
          let time2sec = parseInt(timeReg[1]) * 60 +parseInt(timeReg[2])+
          parseInt(timeReg[3])/1000
          _lrcList.push({
            lrc,
            time:time2sec
          })
        }
      })
      this.setData({
        lrcList: _lrcList
      })
    }
  }
})
