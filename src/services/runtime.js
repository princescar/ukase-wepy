import wepy from 'wepy'
import API from '../api'

let userInfo

export default {
  set userInfo(value) {
    console.log('user info', value)
    userInfo = value
  },
  get userInfo() {
    return userInfo
  },
  async keepSession() {
    try {
      await wepy.checkSession()
    } catch (e) {
      console.log('refresh session', value)
      const { code } = await wepy.login()
      const token = await API.login(code)
      wepy.setStorageSync('token', token)
    }
  }
}
