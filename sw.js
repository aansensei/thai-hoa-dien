const CACHE = "aan_thai_hoa_9550486c932e0802";
const CORE = ["index.html", "assets/app.56ab0fb9ab6b0934.js", "assets/three.min.9274bbcec8d96168.js", "assets/OrbitControls.02bb4ade710f3e60.js", "sw.js", "assets/co_diem_anh_that_low.ec17242a95ac6a22.webp", "assets/cot_rong_anh_that_low.b4ec0d532c0e4863.webp", "assets/cua_tron_anh_that_low.88325c467bd22d48.webp", "assets/lien_ba_anh_that_low.97bcdf0255ff3f18.webp", "assets/stone_thanh_slate_diff_low.776c50633d9ec71b.webp", "assets/stone_thanh_slate_nor_low.2298a9955e64a8bf.webp", "assets/stone_thanh_slate_rough_low.2840cb935aaf40c3.webp", "assets/tile_hoang_luu_ly_diff_low.d2a951d58724dc78.webp", "assets/tile_hoang_luu_ly_nor_low.766ef96ce8a32ea9.webp", "assets/tile_hoang_luu_ly_rough_low.a8afd703a9f93e05.webp"];
self.addEventListener('install', event => {event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(CORE)).then(() => self.skipWaiting()));});
self.addEventListener('activate', event => {event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('aan_thai_hoa_') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));});
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {if(response.ok)caches.open(CACHE).then(cache => cache.put('index.html',response.clone()));return response;}).catch(() => caches.match('index.html')));
  } else event.respondWith(caches.match(event.request).then(hit => hit || fetch(event.request).then(response => {if(response.ok)caches.open(CACHE).then(cache => cache.put(event.request,response.clone()));return response;})));
});
