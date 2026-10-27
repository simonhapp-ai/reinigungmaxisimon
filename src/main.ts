import '@fontsource-variable/manrope'
import './styles/site.css'
import { hideEmptySocials, placeholders } from './config.ts'
import { initForm } from './form.ts'
import { initSliders } from './slider.ts'

hideEmptySocials()
initSliders()

const form = document.querySelector<HTMLFormElement>('#anfrage')
if (form) initForm(form)

// Header: Rand beim Scrollen + mobiles Menü
const header = document.querySelector<HTMLElement>('.header')
const nav = document.querySelector<HTMLElement>('#nav')
const toggle = document.querySelector<HTMLButtonElement>('.nav-toggle')

const onScroll = () => header?.classList.toggle('is-scrolled', window.scrollY > 8)
window.addEventListener('scroll', onScroll, { passive: true })
onScroll()

const setMenu = (open: boolean) => {
  nav?.classList.toggle('is-open', open)
  toggle?.setAttribute('aria-expanded', String(open))
  toggle?.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen')
}
toggle?.addEventListener('click', () => setMenu(!nav?.classList.contains('is-open')))
nav?.addEventListener('click', (e) => {
  if ((e.target as HTMLElement).closest('a')) setMenu(false)
})

// Nur lokal: Hinweis, welche Platzhalter in src/config.ts noch fehlen
if (import.meta.env.DEV) {
  const missing = placeholders()
  if (missing.length) {
    const banner = document.createElement('div')
    banner.className = 'dev-banner'
    banner.innerHTML = `<button type="button" aria-label="Schließen">×</button><strong>Noch Platzhalter in src/config.ts:</strong><br>${missing.join(', ')}`
    banner.querySelector('button')!.addEventListener('click', () => banner.remove())
    document.body.append(banner)
  }
}
