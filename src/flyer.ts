import '@fontsource-variable/manrope'
import './styles/flyer.css'
import QRCode from 'qrcode'
import { hideEmptySocials, siteUrl } from './config.ts'

hideEmptySocials()

const targets: Record<string, string> = {
  website: siteUrl,
}

document.querySelectorAll<HTMLElement>('[data-qr]').forEach(async (el) => {
  const url = targets[el.dataset.qr ?? '']
  if (!url) return
  el.innerHTML = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'M', color: { dark: '#0d2230' } })
})
