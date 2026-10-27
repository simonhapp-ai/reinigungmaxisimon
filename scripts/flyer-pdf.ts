/**
 * Erzeugt flyer/flyer-a5.pdf (154 × 216 mm inkl. 3 mm Beschnitt) – druckfertig für Online-Druckereien.
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

const out = resolve('flyer/flyer-a5.pdf')
const outDir = '.flyer-build'
const port = 5199

// Statischer Build statt Dev-Server: ohne Live-Reload-Verbindung druckt Chrome zuverlässig.
await build({ logLevel: 'error', build: { outDir, emptyOutDir: true, rollupOptions: { input: 'flyer/index.html' } } })
const server = await preview({ logLevel: 'error', build: { outDir }, preview: { port, strictPort: true } })

try {
  // Asynchron starten – der Vorschau-Server läuft im selben Prozess und muss währenddessen antworten können.
  await promisify(execFile)(
    findChrome(),
    [
      '--headless',
      '--disable-gpu',
      '--no-pdf-header-footer',
      '--virtual-time-budget=5000',
      `--print-to-pdf=${out}`,
      `http://localhost:${port}/flyer/index.html`,
    ],
    { timeout: 60_000 },
  )
  console.log(`✅ Flyer gespeichert: ${out}`)
} finally {
  await server.close()
}
