# Rückwand24 — Setup and usage instructions

## 1. Requirements

- Node.js 24 and npm.
- A terminal and a modern web browser.
- Internet access for the first dependency installation.

Check your installation:

```sh
node --version
npm --version
```

No database or backend is required. The default motif is included locally, and no environment variables are required to run the app.

## 2. Open the correct project folder

On this computer:

```sh
cd /Users/faiqahmed/Documents/code_challenge/Rueckwand24
```

On another computer, extract the submission ZIP and open the folder containing `package.json`. Run the following commands from that folder, not from its parent directory.

## 3. Install dependencies

Run this after downloading or extracting the project:

```sh
npm ci
```

This installs the dependency versions recorded in `package-lock.json`. Do not copy `node_modules` from another computer.

## 4. Start the application

```sh
npm run dev
```

Keep this terminal open. Open the local URL printed by Vite, normally:

[http://127.0.0.1:5173/](http://127.0.0.1:5173/)

If port 5173 is already occupied, Vite may choose another port. Use the URL shown in the terminal. To stop the server, press **Ctrl+C** in that terminal.

For subsequent runs, you normally only need:

```sh
npm run dev
```

## 5. Configure plates

1. The first visit starts with one plate measuring **250 × 128 cm**.
2. Click a dimension field to edit it. Its plate becomes highlighted.
3. Enter the width and height within these limits:

   | Dimension | Allowed range |
   | --- | --- |
   | Breite / width | 20–300 cm |
   | Höhe / height | 30–128 cm |

4. Both decimal commas and points are accepted, for example `125,5` or `125.5`. Centimetre inputs support up to two decimal places.
5. Invalid text stays visible while you edit. A red banner explains the error. Leaving an invalid field restores its most recent valid value.
6. Select **Rückwand hinzufügen** to add another plate, up to ten. New plates are highlighted automatically.
7. Select the **−** button to remove a plate. At least one plate must remain. Removing the active plate clears selection without selecting a replacement.

Valid dimensions and plate order are saved automatically in this browser. The motif is shared across all plates; layouts wider than 300 cm continue through alternating mirrored segments.

## 6. Use the additional options

Open **Weitere Optionen** below the add button.

| Control | What to do |
| --- | --- |
| Einheit | Choose centimetres or inches. Stored geometry remains in centimetres. |
| Zahlenformat | Choose German commas or English decimal points for display. |
| Motiv hochladen | Select a JPG, PNG or WebP, up to 10 MB and 40 megapixels. |
| Standardmotiv | Restore the included herb motif. |
| PNG exportieren | Download the current composition as a PNG. |
| Reihenfolge ändern | Enable sorting. Drag the grip, use the row arrows, or focus the grip and press ↑/↓. Select **Fertig** when finished. |

Inch inputs support up to four decimal places and convert to centimetres rounded to 0.01 cm. Units and number-format preferences survive reloads. Uploaded images do **not** survive a reload; select the file again when needed.

PNG exports use two pixels per centimetre. Areas above shorter plates remain transparent. External motif URLs require a server that permits CORS. The default local motif and uploaded images support export without an external image service.

Animations follow the device's reduced-motion preference.

## 7. Run tests

### Unit and component tests

```sh
npm test
```

### Browser tests

On a system supported by Playwright's Chromium installer:

```sh
npx playwright install chromium
npm run test:e2e
```

On this macOS 13 computer, use the installed Google Chrome instead:

```sh
PLAYWRIGHT_CHANNEL=chrome npm run test:e2e
```

PowerShell equivalent, when using installed Chrome on Windows:

```powershell
$env:PLAYWRIGHT_CHANNEL = "chrome"
npm run test:e2e
```

Browser tests start the development server automatically if needed and expect port **5173**. They also refresh screenshots in `screenshots/`.

## 8. Create and preview a production build

```sh
npm run build
npx vite preview --host 127.0.0.1
```

The build command runs TypeScript checks and creates `dist/`. Open the preview URL printed in the terminal, normally [http://127.0.0.1:4173/](http://127.0.0.1:4173/).

Serve `dist/` through a web server; do not open `dist/index.html` directly using a `file://` URL.

## 9. Deploy to the existing Vercel project

The configured project is `rueckwand24` in the team `faiqahmedabbasi1-3680s-projects`.

First verify the application locally:

```sh
npm test
npm run build
```

If the Vercel CLI requires authentication, sign in:

```sh
npx vercel login
```

Link the intended project and verify the target:

```sh
npx vercel link --project rueckwand24 --scope faiqahmedabbasi1-3680s-projects
npx vercel project inspect --non-interactive --scope faiqahmedabbasi1-3680s-projects
```

Confirm that the inspection shows `rueckwand24` and the correct team before deploying:

```sh
npx vercel deploy --prod --scope faiqahmedabbasi1-3680s-projects
```

Wait for **READY**. The production address is:

[https://rueckwand24-iota.vercel.app/](https://rueckwand24-iota.vercel.app/)

Vercel uses `npm ci`, builds with `npm run build`, and publishes `dist/`, as configured in `vercel.json`.

## 10. Troubleshooting

| Problem | Solution |
| --- | --- |
| `vite: command not found` | Run `npm ci` from the folder containing `package.json`, then retry `npm run dev`. |
| Browser cannot connect | Keep the development server running and use the exact URL printed in its terminal. |
| Vite uses port 5174 or another port | Another process occupies 5173. Use the printed port for manual viewing; free 5173 before running the configured browser tests. |
| Playwright reports a missing browser | Run `npx playwright install chromium`, or use the installed Chrome command above. |
| Chromium installer rejects macOS 13 | Use installed Google Chrome with `PLAYWRIGHT_CHANNEL=chrome`. |
| An input returns to its previous value | The entry was invalid. Check the displayed range and supported decimal precision. |
| Uploaded image disappears after reload | This is expected: custom images are session-only. Upload the image again. |
| PNG export fails for a configured remote image | Use the local default/upload option, or configure an image URL whose server permits CORS. |

To deliberately reset this app's saved configuration and preferences, run these commands in the browser's developer console on the app's page:

```js
localStorage.removeItem('r24-plates');
localStorage.removeItem('r24-preferences');
location.reload();
```

This discards the app's saved dimensions, plate order, unit and locale preferences for that origin.

## 11. Important files

- `src/`: application source code.
- `public/motif.jpg`: included default motif.
- `tests/`: browser tests.
- `screenshots/`: actual application screenshots.
- `README.md`: architecture, assumptions and rendering details.
- `VERIFICATION.md`: checks performed and their limitations.
- `CHECKLIST.md`: assessment requirement status.
- `ANTWORTENTWURF.md`: unsent German reply draft.

Git is initialized locally. No GitHub remote is configured. Keep `node_modules/`, `dist/`, `.vercel/` and `.env*` files out of commits; the project ignore rules cover these generated or local files.
