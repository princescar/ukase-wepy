import wepy from 'wepy'
import querystring from 'querystring'
import Leancloud from 'leancloud-storage'

const BASE_URL = 'https://api.hmc000.com'

export default {
  login() {
    return Leancloud.User.loginWithWeapp()
  },
  searchGyms({ location, distance, sortBy, filters, pagination } = {}) {
    const query = new Leancloud.Query('Gym')
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
    const query = new Leancloud.Query('Gym')
    query.include('region')
    const gym = await query.get(id)
    return Object.assign(gym.toJSON(), {
      id
    })
  },
  async getGymImages(id) {
    const query = new Leancloud.Query('GymImage')
    const gym = Leancloud.Object.createWithoutData('Gym', id)
    query.equalTo('gym', gym)
    const images = await query.find()
    return images.map(x => x.get('image'))
  },
  async getGymSports(id) {
    const query = new Leancloud.Query('GymService')
    const gym = Leancloud.Object.createWithoutData('Gym', id)
    query.equalTo('gym', gym)
    const sports = await query.find()
    return sports.map(x => {
      const id = x.get('objectId')
      return Object.assign(x.toJSON(), {
        id
      })
    })
  },
  getFood(id) {
    return get(`/foods/${id}`)
  },
  newBooking(serviceId, bookingDateTime, mobile) {
    const booking = new Leancloud.Object('GymServiceBooking')
    const service = Leancloud.Object.createWithoutData('GymService', serviceId)
    booking.set('gymService', service)

    return post('/bookings', { serviceId, bookingDateTime, mobile })
  },
  getBookings() {
    return get('/bookings')
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
  }
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
