WORKOUT TRACKER PWA — SETUP

What is included:
- index.html, app.js, workouts.json
- manifest.webmanifest, sw.js, icon.svg

Important:
A Progressive Web App must be served from HTTPS (or localhost) to install and use its service worker. Opening index.html directly from a file manager will not enable PWA installation/offline caching.

Easiest setup:
1. Create a private GitHub repository.
2. Upload all six app files (index.html, app.js, workouts.json, manifest.webmanifest, sw.js, icon.svg).
3. In repository Settings > Pages, deploy from the main branch / root.
4. Open the published HTTPS URL on your phone.
5. On Android Chrome: browser menu > Install app or Add to Home screen.
   On iPhone Safari: Share > Add to Home Screen.
6. Open the installed app once while online. It will then cache the app shell for offline use.

Data:
- Workout logs and body-weight entries are stored locally in IndexedDB on that browser/device.
- There is no account, cloud sync, or server-side workout database.
- Use Backup & restore > Export backup regularly. Keep the JSON backup outside the browser.
- Import the JSON backup on the same or another device to restore records.

Privacy:
The static hosting provider serves the app files, but workout entries are not uploaded to that host. They remain in the browser's local IndexedDB unless you manually export/share a backup.

Clinical caution:
The exercise plan is a tracker, not medical clearance. Follow clinician restrictions and do not log through pain.
