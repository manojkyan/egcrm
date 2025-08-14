
const CACHE_NAME = "evergreen-cache-v1";
const ASSETS = ["/","/index.html","/manifest.webmanifest"];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(ASSETS)));
});

self.addEventListener("activate", (e)=>{
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))));
});

self.addEventListener("fetch", (event)=>{
  event.respondWith((async ()=>{
    const cached = await caches.match(event.request);
    try {
      const fresh = await fetch(event.request);
      const cache = await caches.open(CACHE_NAME);
      cache.put(event.request, fresh.clone());
      return fresh;
    } catch {
      return cached || Response.error();
    }
  })());
});
