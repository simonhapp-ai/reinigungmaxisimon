/**
 * Alle Firmendaten an EINER Stelle.
 * Website, Formular, WhatsApp-Links und Flyer lesen von hier.
 * Werte mit "XXX" sind Platzhalter – die Seite zeigt im Dev-Modus an, welche noch fehlen.
 */

export const config = {
  name: 'Reinigung Maxi Simon',
  legalName: 'Reinigung Maxi Simon GbR',
  tagline: 'Fenster- & Außenflächenreinigung in Hamburg',
  founders: ['Maxi', 'Simon'],
  foundersFull: 'Maxi XXX und Simon XXX', // vollständige Vor- und Nachnamen fürs Impressum

  phone: { display: '0176 35629220', e164: '+4917635629220' },
  whatsapp: '4917635629220', // internationale Schreibweise ohne + und ohne führende 0
  email: 'reinigungmaxisimon@gmail.com',
  domain: 'reinigungmaxisimon.de',
  instagram: '', // Handle ohne @ – solange leer, werden alle Instagram-Links ausgeblendet
  googleSiteVerification: '', // Code aus der Google Search Console (Methode „HTML-Tag“, nur der content-Wert)

  address: { street: 'XXX-Straße 1', zip: '22XXX', city: 'Hamburg' }, // Geschäftsadresse wie in der Gewerbeanmeldung, kein Postfach

  // Fürs Impressum – nur eintragen, falls vorhanden. Leere Felder erscheinen dort nicht.
  taxIds: {
    vatId: '', // Umsatzsteuer-Identifikationsnummer, z. B. DE123456789
    economicId: '', // Wirtschafts-Identifikationsnummer, z. B. DE123456789-00001
  },

  responseTime: '24 Stunden',

  prices: {
    perWindow: 4, // € pro Standardfenster – alles andere nach Absprache
  },

  areas: [
    { region: 'Elbvororte', districts: ['Othmarschen', 'Nienstedten', 'Blankenese', 'Rissen'] },
    { region: 'Flottbek & Umgebung', districts: ['Groß Flottbek', 'Klein Flottbek', 'Hochkamp', 'Iserbrook', 'Sülldorf'] },
  ],

  images: {
    hero: '/img/arbeit.jpg', // Foto beim Arbeiten ganz oben – quadratisch, Köpfe knapp unter dem oberen Rand
    pavingBefore: '/img/pflaster-vorher.jpg', // Flyer-Vorderseite
    pavingAfter: '/img/pflaster-nachher.jpg',
    windowBefore: '/img/fenster-vorher.jpg',
    windowAfter: '/img/fenster-nachher.jpg',
    terraceBefore: '/img/terrasse-vorher.jpg',
    terraceAfter: '/img/terrasse-nachher.jpg',
    team: '/img/team.jpg', // Über uns – Querformat 4:3
    flyerPhoto: '/flyer/foto-haupt.jpg', // einseitiger Flyer – liegt bewusst in flyer/, damit es nicht mit der Website online geht
  },

  flyer: {
    offerTitle: 'Neu in Ihrer Nachbarschaft',
    offerText: 'Besichtigung und Angebot sind kostenlos und unverbindlich. Den Preis sprechen wir immer vorher mit Ihnen ab.',
  },
} as const

export type Config = typeof config

export const euro = (n: number) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n)

export const siteUrl = `https://${config.domain}`
/** Hauptadresse der Website (reinigungmaxisimon.de leitet auf www weiter) – für Google: Canonical, Sitemap, strukturierte Daten. */
export const canonicalUrl = `https://www.${config.domain}/`

export function whatsappUrl(text?: string): string {
  const base = `https://wa.me/${config.whatsapp}`
  return text ? `${base}?text=${encodeURIComponent(text)}` : base
}

export const defaultWhatsappText = `Hallo ${config.name}, ich hätte gern ein Angebot. Fotos schicke ich direkt hier mit.`

/** Pfade aller Werte, die noch "XXX" enthalten. */
export function placeholders(value: unknown = config, path = ''): string[] {
  if (typeof value === 'string') return value.includes('XXX') ? [path] : []
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, v]) => placeholders(v, path ? `${path}.${key}` : key))
  }
  return []
}

/** Platzhalter für die HTML-Seiten, z. B. {{name}} – werden beim Build ersetzt. */
export function htmlTokens(): Record<string, string> {
  const igHandle = config.instagram
  return {
    name: config.name,
    legalName: config.legalName,
    tagline: config.tagline,
    founders: config.founders.join(' und '),
    foundersFull: config.foundersFull,
    phone: config.phone.display,
    tel: `tel:${config.phone.e164}`,
    email: config.email,
    mailto: `mailto:${config.email}`,
    domain: config.domain,
    url: siteUrl,
    canonical: canonicalUrl,
    ogImage: new URL(config.images.hero, canonicalUrl).href,
    googleVerificationMeta: config.googleSiteVerification
      ? `<meta name="google-site-verification" content="${config.googleSiteVerification}">`
      : '',
    jsonLd: jsonLd(),
    instagram: `@${igHandle}`,
    instagramUrl: `https://www.instagram.com/${igHandle}/`,
    whatsappUrl: whatsappUrl(defaultWhatsappText),
    street: config.address.street,
    zip: config.address.zip,
    city: config.address.city,
    responseTime: config.responseTime,
    windowPrice: euro(config.prices.perWindow),
    districts: config.areas.flatMap((a) => a.districts).join(', '),
    regions: config.areas.map((a) => a.region).join(', '),
    areasHtml: config.areas
      .map(
        (a) =>
          `<div class="area"><h3>${a.region}</h3><ul class="chips">${a.districts.map((d) => `<li>${d}</li>`).join('')}</ul></div>`,
      )
      .join(''),
    taxIdsHtml: taxIdsHtml(),
    offerTitle: config.flyer.offerTitle,
    offerText: config.flyer.offerText,
    year: String(new Date().getFullYear()),
    ...Object.fromEntries(Object.entries(config.images).map(([k, v]) => [`img_${k}`, v])),
  }
}

/** Strukturierte Daten für Google (Firmenname, Kontakt, Einsatzgebiet). Die Straße kommt erst rein, wenn sie keine Platzhalter mehr hat. */
function jsonLd(): string {
  const { street, zip, city } = config.address
  const hasAddress = placeholders(config.address).length === 0
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'HomeAndConstructionBusiness',
    name: config.name,
    description: config.tagline,
    url: canonicalUrl,
    image: new URL(config.images.hero, canonicalUrl).href,
    telephone: config.phone.e164,
    email: config.email,
    address: {
      '@type': 'PostalAddress',
      ...(hasAddress && { streetAddress: street, postalCode: zip }),
      addressLocality: city,
      addressCountry: 'DE',
    },
    areaServed: config.areas.flatMap((a) => a.districts).map((name) => ({ '@type': 'Place', name: `${name}, Hamburg` })),
  })
}

/** Abschnitt „Steuerliche Angaben“ fürs Impressum – entfällt, solange keine Nummer eingetragen ist. */
function taxIdsHtml(): string {
  const { vatId, economicId } = config.taxIds
  const lines = [
    vatId && `Umsatzsteuer-Identifikationsnummer gemäß § 27a UStG: ${vatId}`,
    economicId && `Wirtschafts-Identifikationsnummer gemäß § 139c AO: ${economicId}`,
  ].filter(Boolean)
  return lines.length ? `<h2>Steuerliche Angaben</h2>\n    <p>${lines.join('<br>')}</p>` : ''
}

/** Blendet alles mit [data-instagram] aus, solange kein Instagram-Handle eingetragen ist. */
export function hideEmptySocials(root: ParentNode = document) {
  if (!config.instagram) root.querySelectorAll('[data-instagram]').forEach((el) => el.remove())
}
