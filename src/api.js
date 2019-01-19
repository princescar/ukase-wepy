import wepy from 'wepy'
import querystring from 'querystring'

const BASE_URL = 'https://api.hmc000.com'

export default {
  login(code) {
    return post('/auth', { code })
  },
  searchGyms({ location, distance, sortBy, filters, pagination } = {}) {
    let query = {}
    if (location) {
      query.ulon = location.longitude
      query.ulat = location.latitude
    }
    if (distance) {
      query.distn = toRangeString(distance)
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
    return get('/searchGyms', query)
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
  getGym(id) {
    return get(`/gyms/${id}`)
  },
  getFood(id) {
    return get(`/foods/${id}`)
  },
  newBooking(serviceId, bookingDateTime, mobile) {
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
