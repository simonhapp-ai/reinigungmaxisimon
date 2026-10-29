/**
 * Erzeugt flyer/flyer-a5.pdf und flyer/flyer-a5-einseitig.pdf (154 × 216 mm inkl. 3 mm Beschnitt) – druckfertig für Online-Druckereien.
 * Aufruf: npm run flyer:pdf   (optional: CHROME_PATH=/pfad/zu/chrome)
 */
import { execFile } from 'node:child_process'
import { existsSync, readdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { promisify } from 'node:util'
import { build, preview } from 'vite'
import { placeholders } from '../src/config.ts'

function findChrome(): string {
  const playwrightCache = join(homedir(), 'Library/Caches/ms-playwright')
  const fromPlaywright = existsSync(playwrightCache)
    ? readdirSync(playwrightCache)
        .filter((d) => d.startsWith('chromium_headless_shell-'))
        .map((d) => join(playwrightCache, d, 'chrome-headless-shell-mac-arm64/chrome-headless-shell'))
    : []
  const candidates = [
    process.env.CHROME_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    ...fromPlaywright,
  ]
  const found = candidates.find((p): p is string => !!p && existsSync(p))
  if (!found) throw new Error('Kein Chrome/Chromium gefunden. Bitte CHROME_PATH setzen.')
  return found
}

const missing = placeholders()
if (missing.length) console.warn(`⚠️  Noch Platzhalter in src/config.ts: ${missing.join(', ')}\n`)

const flyers = [
  { page: 'flyer/index.html', pdf: 'flyer/flyer-a5.pdf' }, // Vorder- und Rückseite
  { page: 'flyer/einseitig.html', pdf: 'flyer/flyer-a5-einseitig.pdf' },
]
const outDir = '.flyer-build'
const port = 5199

// Statischer Build statt Dev-Server: ohne Live-Reload-Verbindung druckt Chrome zuverlässig.
// Als Objekt, weil Vite es mit den Website-Seiten aus vite.config.ts zusammenführt (die werden einfach mitgebaut).
const input = Object.fromEntries(flyers.map((f) => [f.pdf, f.page]))
await build({ logLevel: 'error', build: { outDir, emptyOutDir: true, rollupOptions: { input } } })
const server = await preview({ logLevel: 'error', build: { outDir }, preview: { port, strictPort: true } })

try {
  const chrome = findChrome()
  for (const { page, pdf } of flyers) {
    const out = resolve(pdf)
    // Asynchron starten – der Vorschau-Server läuft im selben Prozess und muss währenddessen antworten können.
    await promisify(execFile)(
      chrome,
      [
        '--headless',
        '--disable-gpu',
        '--no-pdf-header-footer',
        '--virtual-time-budget=5000',
        `--print-to-pdf=${out}`,
        `http://localhost:${port}/${page}`,
      ],
      { timeout: 60_000 },
    )
    console.log(`✅ Flyer gespeichert: ${out}`)
  }
} finally {
  await server.close()
}
