const API = require('../api').default

Component({
  data: {
    selected: 0,
    color: '#7C7C7C',
    selectedColor: '#32A971',
    backgroundColor: '#FAFAFA',
    list: [
      {
        pagePath: '/pages/tab-gyms',
        text: '健身中心',
        iconPath: '/images/tab-gym.png',
        selectedIconPath: '/images/tab-gym-d.png'
      },
      {
        pagePath: 'scan',
        text: '扫码',
        iconPath: '/images/tab-scan.png',
        selectedIconPath: '/images/tab-scan-d.png'
      },
      {
        pagePath: '/pages/tab-mine',
        text: '我的',
        iconPath: '/images/tab-mine.png',
        selectedIconPath: '/images/tab-mine-d.png'
      }
    ]
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

          if (!res.result) {
            wx.showToast({ title: '未扫瞄到二维码', icon: 'none' })
            return
          }

          const [action, gymCode, codeNo] = res.result.split(',')

          if (action !== 'enter' && action !== 'leave' || !gymCode) {
            wx.showToast({ title: '无法识别的二维码', icon: 'none' })
            return
          }

          if (action === 'leave' && !codeNo) {
            wx.showToast({ title: '无法识别的二维码', icon: 'none' })
            return
          }

          API.preEntranceCheck(gymCode).then(function(res) {
            if (res.canEnterInto) {
              wx.navigateTo({ url: `/pages/enter?id=${gymCode}` })
            } else {
              wx.navigateTo({ url: `/pages/leave?id=${gymCode}&code=${codeNo}` })
            }
          })
        }
      })
    }
  }
})
