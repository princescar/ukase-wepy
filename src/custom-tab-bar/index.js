const Scan = require('../services/scan').default

Component({
  data: {
    selected: 0,
    color: '#728391',
    selectedColor: '#1CAF9F',
    backgroundColor: '#F6F6F6',
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
        onlyFromCamera: true,
        success(res) {
          Scan.handle(res.result).catch(function(e) {
            wx.showModal({ title: '错误', content: e.message, showCancel: false })
          })
        }
      })
    }
  }
})
