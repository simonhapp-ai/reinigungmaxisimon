import '@fontsource-variable/manrope'
import './styles/site.css'
import { hideEmptySocials, placeholders } from './config.ts'
import { windowsPrice } from './estimate.ts'
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

// Fenster-Rechner im Preisbereich
const calc = document.querySelector<HTMLElement>('[data-calc]')
if (calc) {
  const input = calc.querySelector<HTMLInputElement>('input[type="range"]')!
  const countOut = calc.querySelector<HTMLElement>('[data-calc-count]')!
  const result = calc.querySelector<HTMLElement>('[data-calc-result]')!
  const cta = calc.querySelector<HTMLAnchorElement>('[data-calc-cta]')
  const update = () => {
    const count = input.valueAsNumber
    countOut.textContent = `${count} Fenster`
    result.textContent = windowsPrice(count)
  }
  input.addEventListener('input', update)
  update()

  // Fensteranzahl aus dem Rechner ins Formular übernehmen
  cta?.addEventListener('click', () => {
    if (!form) return
    const fenster = form.querySelector<HTMLInputElement>('[name="service"][value="fenster"]')
    const windowsInput = form.querySelector<HTMLInputElement>('[name="windows"]')
    if (fenster && !fenster.checked) fenster.checked = true
    if (windowsInput) windowsInput.value = String(input.valueAsNumber)
    form.dispatchEvent(new Event('change'))
  })
}

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
