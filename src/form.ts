import { config, whatsappUrl } from './config.ts'
import { windowsPrice, type Service } from './estimate.ts'

/** Vercel-Funktion in api/anfrage.ts – schickt die Anfrage per E-Mail an euer Postfach. */
const ENDPOINT = '/api/anfrage'

const serviceLabels: Record<Service, string> = {
  fenster: 'Fenster & Glas',
  pflaster: 'Pflaster & Einfahrt',
  terrasse: 'Terrasse',
  kombi: 'Kombi: Glas & Einfahrt',
}

interface Request {
  services: Service[]
  object: string
  windows?: number
  area?: number
  name: string
  location: string
  email: string
  phone: string
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
    email: text('email'),
    phone: text('phone'),
    timing: text('timing'),
    message: text('message'),
  }
}

// Die Kombi umfasst beides – dann fragen wir Fensteranzahl und Fläche ab.
const needsArea = (r: Pick<Request, 'services'>) => ['pflaster', 'terrasse', 'kombi'].some((s) => r.services.includes(s as Service))
const needsWindows = (r: Pick<Request, 'services'>) => r.services.includes('fenster') || r.services.includes('kombi')
const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

/** Fertige Nachricht für den WhatsApp-Notfall-Link, falls der Versand scheitert. */
export function buildMessage(r: Request): string {
  const lines = [
    `Hallo ${config.name}, ich hätte gern ein Angebot.\n`,
    `Leistung: ${r.services.map((s) => serviceLabels[s]).join(', ')}`,
    `Objekt: ${r.object}`,
    needsWindows(r) && r.windows ? `Fenster: ca. ${r.windows} Stück` : '',
    needsArea(r) && r.area ? `Fläche: ca. ${r.area} m²` : '',
    `Ort: ${r.location}`,
    `Zeitraum: ${r.timing}`,
    `Name: ${r.name}`,
    `E-Mail: ${r.email}`,
    r.phone ? `Telefon: ${r.phone}` : '',
    r.message ? `\nNachricht: ${r.message}` : '',
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
  const submit = form.querySelector<HTMLButtonElement>('button[type="submit"]')

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
    const r = read(form)
    if (!validate(r)) return

    setStatus('')
    setSending(true)
    try {
      const res = await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...r,
          services: r.services.map((s) => serviceLabels[s]),
          windows: needsWindows(r) ? r.windows : undefined,
          area: needsArea(r) ? r.area : undefined,
          website: (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '',
        }),
      })
      if (!res.ok) throw new Error(String(res.status))
      form.reset()
      update()
      setStatus(`Danke! Ihre Anfrage ist bei uns angekommen. Wir melden uns innerhalb von ${config.responseTime}.`)
    } catch {
      showFallback(r)
    } finally {
      setSending(false)
    }
  })

  function setSending(sending: boolean) {
    if (!submit) return
    submit.disabled = sending
    submit.lastChild!.textContent = sending ? ' Wird gesendet …' : ' Anfrage absenden'
  }

  function setStatus(message: string, isError = false) {
    if (!status) return
    status.textContent = message
    status.classList.toggle('is-error', isError)
  }

  /** Versand gescheitert: Anfrage nicht verlieren, sondern als fertige WhatsApp-Nachricht anbieten. */
  function showFallback(r: Request) {
    if (!status) return
    setStatus('Das hat leider nicht geklappt. Sie können uns Ihre Anfrage stattdessen ', true)
    const wa = Object.assign(document.createElement('a'), {
      href: whatsappUrl(buildMessage(r)),
      target: '_blank',
      rel: 'noopener',
      textContent: 'per WhatsApp schicken',
    })
    const mail = Object.assign(document.createElement('a'), { href: `mailto:${config.email}`, textContent: config.email })
    status.append(wa, ' oder an ', mail, ' schreiben.')
  }

  function validate(r: Request): boolean {
    const invalid: HTMLElement[] = []

    if (serviceError) serviceError.hidden = r.services.length > 0
    if (!r.services.length) invalid.push(form.querySelector<HTMLInputElement>('[name="service"]')!)

    const checks: [keyof Request, boolean][] = [
      ['name', !!r.name],
      ['location', !!r.location],
      ['email', isEmail(r.email)],
    ]
    for (const [key, ok] of checks) {
      const input = form.elements.namedItem(key) as HTMLInputElement
      input.classList.toggle('is-invalid', !ok)
      if (!ok) invalid.push(input)
    }

    invalid[0]?.focus()
    if (invalid.length) setStatus('Bitte füllen Sie die markierten Felder aus (E-Mail im Format name@beispiel.de).', true)
    return invalid.length === 0
  }

  form.addEventListener('input', (e) => {
    const target = e.target as HTMLElement
    if (target.classList.contains('is-invalid')) target.classList.remove('is-invalid')
  })
}
