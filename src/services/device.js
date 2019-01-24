let systemInfo
let menuButtonRect

export default {
  set systemInfo(value) {
    console.log('system info', value)
    systemInfo = value
  },
  get systemInfo() {
    return systemInfo
  },
  set menuButtonRect(value) {
    console.log('menu button rect', value)
    menuButtonRect = value
  },
  get menuButtonRect() {
    return menuButtonRect
  }
}
