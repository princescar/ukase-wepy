import wepy from 'wepy'
import API from '../api'

const NORMAL_QRCODE_PREFIXS = [
  'http://www.hmc000.com/',
  'https://www.hmc000.com/'
]

export default {
  async handle(content, init) {
    console.log('scan', content)

    try {
      await _handle()
    } catch (e) {
      console.error(e)
      !init && wepy.showModal({ title: '错误', content: e.message, showCancel: false })
      return false
    }

    async function _handle() {
      if (!content) throw new Error('二维码内容为空')

      const prefix = NORMAL_QRCODE_PREFIXS.find(x => content.startsWith(x))
      const [action, gymCode, codeNo] = content.substring(prefix.length).split('/')

      if ((action !== 'enter' && action !== 'leave') || !gymCode) throw new Error('无法识别的二维码')
      if (action === 'leave' && !codeNo) throw new Error('无法识别的二维码')

      const { canEnterInto } = await API.preEntranceCheck(gymCode)
      if (canEnterInto && action === 'leave') throw new Error('无法出场，您不在场内')
      if (!canEnterInto && action === 'enter') throw new Error('无法入场，您已在场内')

      const url = canEnterInto ? `/pages/enter?id=${gymCode}` : `/pages/leave?id=${gymCode}&code=${codeNo}`
      init ? wepy.redirectTo({ url }) : wepy.navigateTo({ url })
    }
  }
}
