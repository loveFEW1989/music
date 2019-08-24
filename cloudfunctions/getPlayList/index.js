// 云函数入口文件
const cloud = require('wx-server-sdk')
// 初始化云函数
cloud.init({
  env: 'small-5azp9'
})
// 初始化数据库
const db = cloud.database()
// 引入request-promise/
const rp = require('request-promise')
// 从服务器获取歌单列表
const URL = 'http://musicapi.xiecheng.live/personalized'

// 获取playlist数据库
const playlistCollection = db.collection('playlist')

// 每次从云数据库中获取的数据条数

const MAX_LIMIT = 100

// 云函数入口函数
exports.main = async(event, context) => {
  // const list = await playlistCollection.get()
  // 获取云函数中数据总条数 -- 返回的是对象
  const countResult = await playlistCollection.count()
  // 转换成数字格式
  const total = countResult.total
  // 总共需要从云函数调用的次数
  const batchTimes = Math.ceil(total / MAX_LIMIT)
  // promise列表集合
  const tasks = []
  for (let i = 0; i < batchTimes; i++) {
    // 0-->100  100->200  200->300
    let promise = playlistCollection.skip(i * MAX_LIMIT).limit(MAX_LIMIT).get()
    tasks.push(promise)
  }
  let list = {
    data: []
  }
  // 如果需要多次调用云数据库...
  if (tasks.length > 0) {
    // 把多次调用的数组合并成一个新数组
    list = (await Promise.all(tasks)).reduce((acc, cur) => {
      return {
        data: acc.data.concat(cur.data)
      }
    })
  }
  // 从服务器中获取的歌单列表
  const playlist = await rp(URL).then((res) => {
    return JSON.parse(res).result
  })
// 数组去重 每次从服务器获取的歌单 要与 云数据库中的歌单列表比较，
// 如果id相同 就不把响应的数据推到云数据库中 反之则要把新数据推到云数据库中

  const newData = []
  for (let i = 0, len1 = playlist.length; i < len1; i++) {
    let flag = true
    for (let j = 0, len2 = list.data.length; j < len2; j++) {
      if (playlist[i].id === list.data[j].id) {
        flag = false
        break
      }
    }
    if (flag) {
      newData.push(playlist[i])
    } 
  }
  
  for (let i = 0, len = newData.length; i < len; i++) {
    await playlistCollection.add({
      data: {
        ...newData[i],
        createTime: db.serverDate(),
      }
    }).then((res) => {
      console.log('插入成功')
    }).catch((err) => {
      console.error('插入失败')
    })
  }

  return newData.length
}