const CACHE_NAME = 'habitflow-cache-v1';
const APP_SHELL = [
  './',
  './index.html',
  './splash.html',
  './login.html',
  './onboarding-1.html',
  './onboarding-2.html',
  './onboarding-3.html',
  './habit-categories.html',
  './dashboard.html',
  './health-metrics.html',
  './progress.html',
  './customize.html',
  './ai-coach.html',
  './mood-tracker.html',
  './settings.html',
  './offline.html',
  './style.css',
  './app.js',
  './habits-data.js',
  './manifest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request).then(response => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request).then(cached => cached || caches.match('./offline.html'))));
});
