const API = require('../api').default

Component({
  data: {
    selected: 0,
    color: '#7C7C7C',
    selectedColor: '#32A971',
    backgroundColor: '#FAFAFA',
    list: []
  },
  ready: function() {
    // 可以在这里 增加权限的判断
    this.setData({
      list: [
        {
          pagePath: '../pages/tab-gyms',
          text: '健身中心',
          iconPath: '../images/tab-gym.png',
          selectedIconPath: '../images/tab-gym-d.png'
        },
        {
          pagePath: 'scan',
          text: '出入扫码',
          iconPath: '../images/tab-scan.png',
          selectedIconPath: '../images/tab-scan-d.png'
        },
        {
          pagePath: '../pages/tab-mine',
          text: '我的',
          iconPath: '../images/tab-mine.png',
          selectedIconPath: '../images/tab-mine-d.png'
        }
      ]
    })
  },
  methods: {
    switchTab(e) {
      const data = e.currentTarget.dataset
      const url = data.path
      if (url === 'scan') {
        this.scanCode()
      } else {
        wx.switchTab({ url })
      }
    },
    scanCode() {
      wx.scanCode({
        scanType: 'qrCode',
        success(res) {
          console.log(res.result)
          // DEBUG
          const gymCode = 'GYM00001'

          API.preEntranceCheck(gymCode).then(function(res) {
            if (res.canEnterInto) {
              wx.navigateTo({ url: `/pages/enter?id=${gymCode}` })
            } else {
              wx.navigateTo({ url: `/pages/leave?id=${gymCode}` })
            }
          })
        }
      })
    }
  }
})
