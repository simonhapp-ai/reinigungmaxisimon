# Reinigung Maxi Simon – Website & Flyer

Website für [reinigungmaxisimon.de](https://reinigungmaxisimon.de) (Vite + TypeScript, ohne Framework) und druckfertiger A5-Flyer für die Fenster- und Außenflächenreinigung in Hamburg.

## Loslegen

```bash
npm install
npm run dev          # Website lokal: http://localhost:5173  ·  Flyer: http://localhost:5173/flyer/
npm run build        # fertige Website in dist/
npm run flyer:pdf    # Druck-PDF in flyer/flyer-a5.pdf
```

## Alles Wichtige steht in `src/config.ts`

Name, Telefon, WhatsApp-Nummer, E-Mail, Domain, Instagram, Adresse, Preis pro Fenster, Stadtteile, Bilder und der Angebotstext für den Flyer.
Website **und** Flyer lesen von dort. Werte mit `XXX` sind Platzhalter – solange welche fehlen, zeigt die lokale Vorschau unten links einen gelben Hinweis.

- **WhatsApp-Nummer**: international ohne `+` und ohne führende 0 (`0176 35629220` → `4917635629220`)
- **Instagram**: solange `instagram` leer ist, sind alle Instagram-Links ausgeblendet. Handle eintragen → sie erscheinen automatisch.
- **Preise**: Nur Standardfenster haben einen festen Preis (`perWindow`, steht bei den Leistungen und in den FAQ). Alles andere ist „nach Absprache“. Der Flyer enthält bewusst keine Preise.

## Bilder austauschen

Fotos in `public/img/` ablegen und in `src/config.ts` unter `images` den Dateinamen eintragen. Vorher- und Nachher-Foto eines Paares müssen **dasselbe Seitenverhältnis** haben (am besten 3:2 quer, vom selben Standpunkt).

Der Vorher/Nachher-Bereich der Website ist vorübergehend ausgeblendet, bis echte Fotos da sind – wie er wieder reinkommt, steht in `FRAGEN-UND-FOTOS.md`.

## Formular

Das Anfrageformular schickt die Anfrage direkt per E-Mail an euer Gmail-Postfach – über die Vercel-Funktion `api/anfrage.ts` (das Gegenstück zu einem PHP-Formular). In Gmail auf „Antworten“ klicken schreibt direkt an den Kunden.
Falls der Versand einmal scheitert, bekommt der Kunde einen fertigen WhatsApp-Link mit seiner Anfrage angezeigt.

**Einmalig einrichten:**
1. Im Google-Konto von `reinigungmaxisimon@gmail.com` die **Bestätigung in zwei Schritten** aktivieren.
2. Unter [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) ein **App-Passwort** erstellen (Name z. B. „Website“). Google zeigt ein 16-stelliges Passwort an.
3. In Vercel unter *Settings → Environment Variables* zwei Variablen anlegen:
   - `GMAIL_USER` = `reinigungmaxisimon@gmail.com`
   - `GMAIL_APP_PASSWORD` = das 16-stellige App-Passwort
4. Unter *Deployments* das neueste Deployment **Redeploy** klicken, damit die Variablen greifen.

## Flyer drucken

Es gibt zwei Flyer, beide 154 × 216 mm = DIN A5 plus 3 mm Beschnitt rundum, wie es Online-Druckereien verlangen:
- `flyer/flyer-a5.pdf` – Vorder- und Rückseite (Vorschau: `/flyer/`)
- `flyer/flyer-a5-einseitig.pdf` – nur eine Seite mit großem Foto und vier Leistungs-Kreisen (Vorschau: `/flyer/einseitig.html`). Das große Foto ist `images.flyerPhoto` in `src/config.ts`, die Kreisbilder sind `flyer/kreis-*.jpg`.

Zum Selbstdrucken: `flyer/flyer-a4-2x-einseitig.pdf` – A4 quer mit dem einseitigen Flyer zweimal nebeneinander (ohne Beschnitt). Mit „Tatsächliche Größe“ bzw. 100 % drucken und in der Mitte schneiden.

Alle QR-Codes führen zur Website. Die gestrichelte Linie in der Browser-Vorschau zeigt die Schnittkante und erscheint nicht im PDF.
**Vor dem Druck:** QR-Code mit dem Handy testen – erst sinnvoll, wenn die Website unter der Domain erreichbar ist.

## Hosting bei Vercel

1. Auf [vercel.com/new](https://vercel.com/new) mit GitHub anmelden und das Repo `simonhapp-ai/reinigungmaxisimon` importieren.
2. Vercel erkennt Vite automatisch (Build: `npm run build`, Output: `dist`) → **Deploy**.
3. Unter *Settings → Domains* `reinigungmaxisimon.de` und `www.reinigungmaxisimon.de` hinzufügen und die angezeigten DNS-Einträge bei eurem Domain-Anbieter eintragen.

Jeder Push auf `main` veröffentlicht die Seite danach automatisch neu.

## Bei Google

Hauptadresse ist `https://www.reinigungmaxisimon.de/` (ohne www leitet Vercel dorthin weiter). Darauf zeigen Canonical-Tag, `public/sitemap.xml` und `public/robots.txt`.
Firmendaten für Google (strukturierte Daten) entstehen beim Build aus `src/config.ts`.

1. [Google Search Console](https://search.google.com/search-console): Property „URL-Präfix“ `https://www.reinigungmaxisimon.de/`. Bestätigt über die Datei `public/googlef4137e1165b22c32.html` – **nicht löschen**, sonst verliert ihr den Zugriff.
2. Dort unter *Sitemaps* `sitemap.xml` einreichen und unter *URL-Prüfung* die Startseite eingeben → „Indexierung beantragen“.
3. [Google-Unternehmensprofil](https://business.google.com) anlegen, damit ihr in Google Maps und bei „Fensterreinigung Blankenese“ auftaucht.

**Vor dem Livegang:** Im Impressum fehlen noch Namen und Adresse (siehe `FRAGEN-UND-FOTOS.md`). Die Datenschutzerklärung ist ein Muster und sollte geprüft werden.
