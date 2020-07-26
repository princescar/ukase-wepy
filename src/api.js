import wepy from 'wepy'
import querystring from 'querystring'

const BASE_URL = 'https://api.hmc000.com/gate'

export default {
  login(code) {
    return get('/user/wechatLogin', { code })
  },
  getBanners() {
    return get('/banner/list')
  },
  searchGyms({ location, distance, sortBy, filter, pagination } = {}) {
    const params = {}
    if (location) {
      params.longitude = location.longitude
      params.latitude = location.latitude
    }
    if (distance) {
      params.maxDistance = distance
    }
    if (sortBy) {
      params.sortType = sortBy
    }
    if (filter && filter) {
      params.category = filter
    }
    if (pagination) {
      params.pageIndex = pagination.pageIndex
      params.pageSize = pagination.pageSize
    } else {
      params.pageIndex = 1
      params.pageSize = 999
    }
    return get('/gym/page', params)
  },
  async getGym(gymCode) {
    return get('/gym/detail', { gymCode })
  },
  async getGymItem(itemChargeCode) {
    return get('/gymItem/detail', { itemChargeCode })
  },
  newBooking(gymCode, itemCode, itemChargeCode, reserveTime) {
    return post('/userOrder/createPreOrder', {
      gymCode,
      itemCode,
      itemChargeCode,
      reserveTime
    })
  },
  setGymFavor(gymCode, favor) {
    if (favor) {
      return post('/userFav/add', { gymCode })
    } else {
      return post('/userFav/delete', { gymCode })
    }
  },
  favorGyms() {
    return get('/gym/myFavGymPage', { pageIndex: 1, pageSize: 99 })
  },
  calendar(gmtTimeStart, gmtTimeEnd) {
    return get('/userTrack/myTrack', { gmtTimeStart, gmtTimeEnd, trackType: 3 })
  },
  myOrders(type) {
    return get('/userOrder/myOrders', {
      pageIndex: 1,
      pageSize: 99,
      chargeType: {
        course: 1,
        free: 2
      }[type],
      orderType: 'inTime'
    })
  },
  preEntranceCheck(gymCode) {
    return get('/userOrder/preEntranceCheck', { gymCode })
  },
  enter(gymCode) {
    return post('/userOrder/intoGym', { gymCode })
  },
  leave(gymCode, codeNo) {
    return post('/userOrder/outOfGym', { gymCode, codeNo })
  },
  pay(orderNo) {
    return post('/userOrderPayFlow/createPayOrder', { orderNo, payMethod: 'wechat_mp' })
  },
  zeroPay(orderNo) {
    return post('/userOrderPayFlow/createZeroPayOrder', { orderNo })
  },
  setUserInfo(iv, encryptedData) {
    return post('/user/uploadUserInfo', { iv, encryptedData })
  },
  getUserInfo() {
    return get('/user/userInfo')
  },
  currentActivity() {
    return get('/userTrack/currentTrack')
  },
  moneyFlow() {
    return get('/userOrderPayFlow/myPayFlow', { pageIndex: 1, pageSize: 999 })
  }
}

function get(url, query) {
  return request('GET', url, query)
}

function post(url, data, query) {
  return request('POST', url, query, data)
}

function request(method, url, query, body) {
  let fullUrl = BASE_URL + url
  const token = wepy.getStorageSync('token')

  if (query) {
    const qs = querystring.stringify(query)
    fullUrl += `?${qs}`
  }

  console.debug(method, fullUrl)
  body && console.debug(body)

  return wepy
    .request({
      header: { token },
      method: method,
      url: fullUrl,
      data: body
    })
    .then(resp => {
      console.debug(resp.statusCode, method, fullUrl)
      console.debug(resp.data)
      if (!resp || !resp.data) {
        throw new Error('服务端未返回数据')
      } else if (resp.data && resp.data.code !== '200') {
        const error = new Error(resp.data.msg)
        error.code = resp.data.code
        throw error
      } else {
        return resp.data.data
      }
    })
    .catch(error => {
      showError(error)
      throw error
    })
}

function showError(error) {
  wepy.showModal({
    title: '错误',
    content: error.message || '发生了未知错误',
    showCancel: false
  })
}
