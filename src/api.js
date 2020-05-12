import wepy from 'wepy'
import querystring from 'querystring'

const BASE_URL = 'http://121.196.32.76:9001'

export default {
  login(code) {
    return get('/user/code', { code })
  },
  getBanners() {
    return get('/banner/list')
  },
  searchGyms({ location, distance, sortBy, filters, pagination } = {}) {
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
      reservePhone
    })
  },
  async getBookings() {
    const query = new LeanCloud.Query('GymServiceBooking')
    query.equalTo('user', LeanCloud.User.current())
    query.include('gymService.gym')
    const bookings = await query.find()
    return bookings.map(parseId)
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
  async getOrderByTicket(ticket) {
    const inQuery = new LeanCloud.Query('GymInstrumentOrder')
    inQuery.equalTo('inTicket', ticket)

    const outQuery = new LeanCloud.Query('GymInstrumentOrder')
    outQuery.equalTo('outTicket', ticket)

    const query = LeanCloud.Query.or(inQuery, outQuery)
    const order = await query.first()

    if (!order) {
      return null
    }

    return parseId(order)
  },
  async getUnfinishedOrder() {
    const query = new LeanCloud.Query('GymInstrumentOrder')
    query.equalTo('status', 'new')
    query.descending('createdAt')
    const order = await query.first()
    if (!order) {
      return null
    }
    return parseId(order)
  },
  async getUnfinishedPayment(orderId) {
    const order = LeanCloud.Object.createWithoutData('GymInstrumentOrder', orderId)
    const query = new LeanCloud.Query('GymInstrumentOrderPayment')
    query.equalTo('order', order)
    query.equalTo('paid', false)
    query.equalTo('type', 'wechat')
    query.descending('createdAt')
    const payment = await query.first()
    if (!payment) {
      return null
    }
    return parseId(payment)
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
  const token = wx.getStorageSync('token')

  if (query) {
    query.userId = token
    const qs = querystring.stringify(query)
    fullUrl += `?${qs}`
  }
  if (body) {
    body.userId = token
  }

  console.debug(method)
  console.debug(fullUrl)
  console.debug(token)
  console.debug(body)

  return wepy
    .request({
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

function showError(error) {
  wepy.showModal({
    title: '错误',
    content: error,
    showCancel: false
  })
}
