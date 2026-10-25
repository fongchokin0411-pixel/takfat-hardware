// Keeps every file of the app on this computer, so the installed app opens and reads delivery notes with no internet.
// Bump VERSION with each release: the new files are fetched in the background and used from the next opening.
const VERSION = 'tf-1.9.0';
const FILES = [
  './', 'index.html', 'manifest.webmanifest',
  'icons/pig-128.png', 'icons/pig-192.png', 'icons/pig-512.png', 'icons/pig-maskable-512.png',
  'fonts/geist-latin-wght-normal.woff2', 'fonts/geist-mono-latin-wght-normal.woff2',
  'ocr/tesseract.min.js', 'ocr/worker.min.js', 'ocr/core/tesseract-core-simd-lstm.wasm.js',
  'ocr/lang/chi_tra.traineddata.gz', 'ocr/lang/eng.traineddata.gz',
];
// 'reload' skips the browser's own 10-minute cache, so a new version never keeps a stale file from the old one
self.addEventListener('install', e => { e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin) return;   // fonts, Claude and other sites go to the network
  e.respondWith(caches.open(VERSION).then(c => c.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && e.request.mode !== 'navigate') c.put(e.request, res.clone());
    return res;
  }).catch(() => e.request.mode === 'navigate' ? c.match('index.html') : Promise.reject(new Error('offline'))))));
});
