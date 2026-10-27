import { config, whatsappUrl } from './config.ts'
import { windowsPrice, type Service } from './estimate.ts'

const serviceLabels: Record<Service, string> = {
  fenster: 'Fenster & Glas',
  pflaster: 'Pflaster & Einfahrt',
  terrasse: 'Terrasse',
}

interface Request {
  services: Service[]
  object: string
  windows?: number
  area?: number
  name: string
  location: string
  contact: string
  timing: string
  message: string
}

function read(form: HTMLFormElement): Request {
  const data = new FormData(form)
  const text = (key: string) => String(data.get(key) ?? '').trim()
  const positive = (key: string) => (Number(text(key)) > 0 ? Number(text(key)) : undefined)
  return {
    services: data.getAll('service') as Service[],
    object: text('object'),
    windows: positive('windows'),
    area: positive('area'),
    name: text('name'),
    location: text('location'),
    contact: text('contact'),
    timing: text('timing'),
    message: text('message'),
  }
}

const needsArea = (r: Pick<Request, 'services'>) => r.services.includes('pflaster') || r.services.includes('terrasse')
const needsWindows = (r: Pick<Request, 'services'>) => r.services.includes('fenster')

export function buildMessage(r: Request, via: 'whatsapp' | 'email'): string {
  const lines = [
    `Hallo ${config.name}, ich hätte gern ein Angebot.\n`,
    `Leistung: ${r.services.map((s) => serviceLabels[s]).join(', ')}`,
    `Objekt: ${r.object}`,
    needsWindows(r) && r.windows ? `Fenster: ca. ${r.windows} Stück` : '',
    needsArea(r) && r.area ? `Fläche: ca. ${r.area} m²` : '',
    `Ort: ${r.location}`,
    `Zeitraum: ${r.timing}`,
    `Name: ${r.name}`,
    r.contact ? `Kontakt: ${r.contact}` : '',
    r.message ? `\nNachricht: ${r.message}` : '',
    via === 'whatsapp' ? '\nFotos schicke ich gleich hier im Chat.' : '',
  ]
  return lines.filter(Boolean).join('\n')
}

export function initForm(form: HTMLFormElement) {
  const areaField = form.querySelector<HTMLElement>('[data-needs-area]')
  const windowsField = form.querySelector<HTMLElement>('[data-needs-windows]')
  const estimateBox = form.querySelector<HTMLElement>('[data-estimate]')
  const estimateValue = form.querySelector<HTMLElement>('[data-estimate-value]')
  const estimateNote = form.querySelector<HTMLElement>('[data-estimate-note]')
  const serviceError = form.querySelector<HTMLElement>('[data-error-for="service"]')
  const status = form.querySelector<HTMLElement>('.form-status')
  const mailButton = form.querySelector<HTMLButtonElement>('[data-submit-mail]')
  const useEndpoint = config.formEndpoint !== ''

  if (useEndpoint && mailButton) mailButton.lastChild!.textContent = ' Anfrage absenden'

  const update = () => {
    const r = read(form)
    if (areaField) areaField.hidden = !needsArea(r)
    if (windowsField) windowsField.hidden = !needsWindows(r)
    if (r.services.length && serviceError) serviceError.hidden = true
    if (!estimateBox || !estimateValue || !estimateNote) return

    // Nur Standardfenster haben einen festen Preis – Außenflächen werden immer vorher abgesprochen.
    const windows = needsWindows(r) && r.windows
    estimateBox.hidden = !windows && !needsArea(r)
    if (windows) {
      estimateValue.textContent = `Fenster: ca. ${windowsPrice(windows)}`
      estimateNote.textContent = needsArea(r)
        ? 'Außenflächen: Preis nach Absprache – immer vorher fest vereinbart'
        : `${windows} Standardfenster à ${windowsPrice(1)} – Sonderformen nach Absprache`
    } else {
      estimateValue.textContent = 'Preis nach Absprache'
      estimateNote.textContent = 'Den Festpreis sprechen wir vorher mit Ihnen ab – nach Fotos oder Besichtigung.'
    }
  }
  form.addEventListener('input', update)
  form.addEventListener('change', update)
  update()

  form.addEventListener('submit', async (event) => {
    event.preventDefault()
    const via = (event.submitter as HTMLButtonElement | null)?.value === 'email' ? 'email' : 'whatsapp'
    const r = read(form)
    if (!validate(form, r, via === 'email' && useEndpoint)) return

    const text = buildMessage(r, via)
    setStatus('')

    if (via === 'whatsapp') {
      const url = whatsappUrl(text)
      if (!window.open(url, '_blank', 'noopener')) window.location.href = url
      setStatus('WhatsApp wurde geöffnet – bitte dort noch auf Senden tippen.')
      return
    }

    if (!useEndpoint) {
      const subject = `Angebotsanfrage – ${r.location}`
      window.location.href = `mailto:${config.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`
      setStatus('Ihr E-Mail-Programm wurde geöffnet – bitte dort noch auf Senden klicken.')
      return
    }

    try {
      const res = await fetch(config.formEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ ...r, services: r.services.map((s) => serviceLabels[s]).join(', '), text }),
      })
      if (!res.ok) throw new Error(String(res.status))
      form.reset()
      update()
      setStatus(`Danke! Wir melden uns innerhalb von ${config.responseTime}.`)
    } catch {
      setStatus('Das hat leider nicht geklappt. Bitte schreiben Sie uns direkt per WhatsApp oder E-Mail.', true)
    }
  })

  function setStatus(message: string, isError = false) {
    if (!status) return
    status.textContent = message
    status.classList.toggle('is-error', isError)
  }

  function validate(form: HTMLFormElement, r: Request, contactRequired: boolean): boolean {
    const invalid: HTMLElement[] = []

    if (serviceError) serviceError.hidden = r.services.length > 0
    if (!r.services.length) invalid.push(form.querySelector<HTMLInputElement>('[name="service"]')!)

    const required: [keyof Request, boolean][] = [
      ['name', true],
      ['location', true],
      ['contact', contactRequired],
    ]
    for (const [key, isRequired] of required) {
      const input = form.elements.namedItem(key) as HTMLInputElement
      const bad = isRequired && !r[key]
      input.classList.toggle('is-invalid', bad)
      if (bad) invalid.push(input)
    }

    invalid[0]?.focus()
    if (invalid.length) setStatus('Bitte füllen Sie die markierten Felder aus.', true)
    return invalid.length === 0
  }

  form.addEventListener('input', (e) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('is-invalid')) target.classList.remove('is-invalid')
  })
}
