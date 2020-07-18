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
      params.sortType = sortBy.key
    }
    if (filter && filter.key) {
      params.category = filter.key
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
  newBooking(gymCode, itemCode, itemChargeCode, reserveTime, reservePhone) {
    return post('/userOrder/createPreOrder', {
      gymCode,
      itemCode,
      itemChargeCode,
      reserveTime,
      reservePhone,
      reserveName: '张三'
    })
  },
  setGymFavor(gymCode, favor) {
    if (favor) {
      return post('/userFav/add', { gymCode })
    } else {
      return post('/userFav/delete', { gymCode })
    }
  },
  getFavorGyms() {
    return get('/gyms/favor')
  },
  getMyTrack(gmtTimeStart, gmtTimeEnd) {
    return get('/userTrack/myTrack', { gmtTimeStart, gmtTimeEnd })
  },
  getMyOrders() {
    return get('/userOrder/myOrders', { pageIndex: 1, pageSize: 99 })
  },
  preEntranceCheck(gymCode) {
    return get('/userOrder/preEntranceCheck', { gymCode })
  },
  enter(gymCode) {
    return post('/userOrder/intoGym', { gymCode })
  },
  leave(gymCode) {
    return post('/userOrder/outOfGym', { gymCode })
  },
  pay(orderNo) {
    return post('/userOrderPayFlow/createPayOrder', { orderNo, payMethod: 'wechat_mp' })
  },
  zeroPay(orderNo) {
    return post('/userOrderPayFlow/createZeroPayOrder', { orderNo })
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

  console.debug(method)
  console.debug(fullUrl)
  console.debug(token)
  console.debug(body)

  return wepy
    .request({
      header: { token },
      method: method,
      url: fullUrl,
      data: body
    })
    .catch(error => {
      showError(error.errMsg)
      throw new Error(error.errMsg)
    })
    .then(resp => {
      if (resp.data && resp.data.code !== '200') {
        showError(resp.data.msg)
        throw new Error(resp.data.code)
      } else {
        return resp.data.data
      }
    })
}

function showError(msg) {
  wepy.showModal({
    title: '错误',
    content: msg || '发生了未知错误',
    showCancel: false
  })
}
