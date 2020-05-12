import wepy from 'wepy'
import querystring from 'querystring'
import LeanCloud from 'leancloud-storage'

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
  searchFoods({ heat, price, sortBy, filters, pagination } = {}) {
    let query = {}
    if (heat) {
      query.heat = toRangeString(heat)
    }
    if (price) {
      query.price = toRangeString(price)
    }
    if (filters) {
      Object.assign(query, filters)
    }
    if (sortBy) {
      const sign = {
        asc: '+',
        desc: '-'
      }[sortBy.direction]
      query.sort = `${sign}${sortBy.key}`
    }
    if (pagination) {
      Object.assign(query, pagination)
    }
    return get('/searchFoods', query)
  },
  async getGym(gymCode) {
    return get('/gym/detail', { gymCode })
  },
  async getGymImages(id) {
    const query = new LeanCloud.Query('GymImage')
    const gym = LeanCloud.Object.createWithoutData('Gym', id)
    query.equalTo('gym', gym)
    const gymImages = await query.find()
    return gymImages.map(x => x.get('image').toJSON())
  },
  async getGymSports(id) {
    const query = new LeanCloud.Query('GymService')
    const gym = LeanCloud.Object.createWithoutData('Gym', id)
    query.equalTo('gym', gym)
    const sports = await query.find()
    return sports.map(parseId)
  },
  getFood(id) {
    return get(`/foods/${id}`)
  },
  newBooking(serviceId, bookingDateTime, mobile) {
    const booking = new LeanCloud.Object('GymServiceBooking')
    const service = LeanCloud.Object.createWithoutData('GymService', serviceId)
    booking.set('gymService', service)
    booking.set('user', LeanCloud.User.current())
    booking.set('time', bookingDateTime)
    booking.set('mobile', mobile)
    return booking.save()
  },
  async getBookings() {
    const query = new LeanCloud.Query('GymServiceBooking')
    query.equalTo('user', LeanCloud.User.current())
    query.include('gymService.gym')
    const bookings = await query.find()
    return bookings.map(parseId)
  },
  newDiet(foods, supplierId, arriveDate) {
    return put('/checkout', { foods, supplierId, arriveDate })
  },
  getDiet(from, to) {
    return get('/diet', { from, to })
  },
  getFoodOrders() {
    return get('/orders?page=1&size=9999')
  },
  setFoodFavor(foodId, favor) {
    return put(`/foods/${foodId}/favor`, favor)
  },
  setGymFavor(gymId, favor) {
    return put(`/gyms/${gymId}/favor`, favor)
  },
  setSupplierFavor(supplierId, favor) {
    return put(`/suppliers/${supplierId}/favor`, favor)
  },
  getFavorFoods() {
    return get('/foods/favor')
  },
  getFavorGyms() {
    return get('/gyms/favor')
  },
  getFavorSuppliers() {
    return get('/suppliers/favor')
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

function parseId(x) {
  const id = x.get('objectId')
  return Object.assign(x.toJSON(), { id })
}

function get(url, query) {
  return request('GET', url, query)
}

function put(url, data, query) {
  return request('PUT', url, query, data)
}

function request(method, url, query, body) {
  let fullUrl = BASE_URL + url
  if (query) {
    const qs = querystring.stringify(query)
    fullUrl += `?${qs}`
  }
  const token = wx.getStorageSync('token')
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
    title: '发生错误',
    content: error,
    showCancel: false
  })
}

function toRangeString(range) {
  return `lt:${range.max},gt:${range.min}`
}
