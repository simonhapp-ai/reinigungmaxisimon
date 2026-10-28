/**
 * Vercel-Funktion für das Anfrageformular: schickt jede Anfrage per Gmail an euer Postfach.
 * Benötigt in Vercel unter Settings → Environment Variables:
 *   GMAIL_USER          – reinigungmaxisimon@gmail.com
 *   GMAIL_APP_PASSWORD  – 16-stelliges App-Passwort aus dem Google-Konto (nicht das normale Passwort)
 */
import nodemailer from 'nodemailer'

const text = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '')
const oneLine = (v: unknown, max?: number) => text(v, max).replace(/\s*[\r\n]+\s*/g, ' ')
const count = (v: unknown) => (Number(v) > 0 ? Math.round(Math.min(Number(v), 100_000)) : 0)
const json = (body: object, status = 200) => Response.json(body, { status })

export async function POST(request: Request): Promise<Response> {
  let data: Record<string, unknown>
  try {
    data = await request.json()
  } catch {
    return json({ error: 'Ungültige Anfrage.' }, 400)
  }

  // Spam-Schutz: Bots füllen das versteckte Feld aus – dann so tun, als hätte es geklappt.
  if (text(data.website)) return json({ ok: true })

  const name = oneLine(data.name)
  const email = oneLine(data.email)
  const location = oneLine(data.location)
  if (!name || !location || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ error: 'Bitte Name, Stadtteil und eine gültige E-Mail-Adresse angeben.' }, 422)
  }

  const user = process.env.GMAIL_USER
  const pass = process.env.GMAIL_APP_PASSWORD
  if (!user || !pass) return json({ error: 'Der Formularversand ist noch nicht eingerichtet.' }, 503)

  const services = Array.isArray(data.services) ? data.services.map((s) => oneLine(s, 60)).filter(Boolean).slice(0, 5) : []
  const windows = count(data.windows)
  const area = count(data.area)
  const phone = oneLine(data.phone, 40)
  const message = text(data.message, 3000)

  const body = [
    `Leistung: ${services.join(', ') || '–'}`,
    `Objekt: ${oneLine(data.object, 60) || '–'}`,
    windows ? `Fenster: ca. ${windows} Stück` : null,
    area ? `Fläche: ca. ${area} m²` : null,
    `Ort: ${location}`,
    `Zeitraum: ${oneLine(data.timing, 60) || '–'}`,
    '',
    `Name: ${name}`,
    `E-Mail: ${email}`,
    phone ? `Telefon: ${phone}` : null,
    message ? `\nNachricht:\n${message}` : null,
    '\n– Gesendet über das Anfrageformular der Website. „Antworten“ schreibt direkt an den Kunden.',
  ]

  try {
    await nodemailer.createTransport({ service: 'gmail', auth: { user, pass } }).sendMail({
      from: { name: 'Website-Anfrage', address: user },
      to: user,
      replyTo: { name, address: email },
      subject: `Neue Anfrage: ${services.join(', ') || 'Reinigung'} – ${location}`,
      text: body.filter((line) => line !== null).join('\n'),
    })
  } catch (err) {
    console.error('Mailversand fehlgeschlagen:', err)
    return json({ error: 'Die Anfrage konnte gerade nicht verschickt werden.' }, 502)
  }
  return json({ ok: true })
}
