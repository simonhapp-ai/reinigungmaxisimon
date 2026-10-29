import { defineConfig, type Plugin } from 'vite'
import { htmlTokens } from './src/config.ts'

/** Ersetzt {{name}}, {{phone}} usw. in allen HTML-Seiten durch die Werte aus src/config.ts. */
function siteTokens(): Plugin {
  return {
    name: 'site-tokens',
    // 'pre': vor Vites HTML-Verarbeitung ersetzen, damit Bilder außerhalb von public/ (z. B. flyer/team.jpg) mitgebaut werden.
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const tokens = htmlTokens()
        return html.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => {
          if (!(key in tokens)) throw new Error(`Unbekannter Platzhalter {{${key}}} in ${ctx.path}`)
          return tokens[key]
        })
      },
    },
  }
}

export default defineConfig({
  plugins: [siteTokens()],
  build: {
    rollupOptions: {
      // Der Flyer (flyer/index.html) ist bewusst nicht Teil der veröffentlichten Website.
      input: { main: 'index.html', impressum: 'impressum.html', datenschutz: 'datenschutz.html' },
    },
  },
})
