import wepy from 'wepy'
import querystring from 'querystring'
import LeanCloud from 'leancloud-storage'

const BASE_URL = 'https://api.hmc000.com'

export default {
  login() {
    return LeanCloud.User.loginWithWeapp()
  },
  searchGyms({ location, distance, sortBy, filters, pagination } = {}) {
    const query = new LeanCloud.Query('Gym')
    if (location) {
      query.near('location', location)
      if (distance) {
        query.withinKilometers('location', location, distance.max / 1000)
      }
    }
    if (filters) {
      for (const key in filters) {
        query.equalTo(key, filters[key])
      }
    }
    if (sortBy) {
      if (sortBy.direction === 'asc') {
        query.ascending(sortBy.key)
      } else {
        query.descending(sortBy.key)
      }
    }
    if (pagination) {
      query.skip(pagination.pageNo * pagination.pageSize)
      query.limit(pagination.pageSize)
    }
    query.include('region')

    return query.find().then(gyms => {
      return gyms.map(x => {
        const id = x.get('objectId')
        const loc = x.get('location')
        let distance
        if (location) {
          distance = loc.kilometersTo(location) * 1000
        }
        return Object.assign(x.toJSON(), {
          id,
          distance
        })
      })
    })
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
  async getGym(id) {
    const query = new LeanCloud.Query('Gym')
    query.include('region')
    const gym = await query.get(id)
    return parseId(gym)
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
  async getInstrumentOrderByTicket(ticket) {
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
  }
}

function parseId(x) {
  const id = x.get('objectId')
  return Object.assign(x.toJSON(), { id })
}

function get(url, query) {
  return request('GET', url, query)
}

function post(url, data, query) {
  return request('POST', url, query, data)
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
  const header = token ? { Authorization: `Bearer ${token}` } : {}

  console.debug(method)
  console.debug(fullUrl)
  console.debug(token)
  console.debug(body)

  return wepy
    .request({
      method: method,
      url: fullUrl,
      header: header,
      data: body
    })
    .catch(error => {
      showError(error.errMsg)
      throw new Error(error.errMsg)
    })
    .then(resp => {
      if (resp.data && resp.data.error) {
        showError(resp.data.error)
        throw new Error(resp.data.error)
      } else {
        return resp.data
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
