const CACHE='miedzy-nami-v081';
const CORE=['/','/index.html','/styles.css','/cloud-config.js','/app.js','/enhancements.js','/content/cards-v05.js','/v05.js','/content/daily-match.js','/v06.js','/v07.js','/v071.js','/v08.js','/spicy-v081-data.js','/v081.js','/manifest.webmanifest','/icon.svg','/icon-180.png','/icon-192.png','/icon-512.png','/version.json'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(fetch(event.request).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('/index.html',copy));return response}).catch(()=>caches.match('/index.html')));
    return;
  }
  if(url.pathname==='/cloud-config.js'||url.pathname==='/version.json'){
    event.respondWith(fetch(event.request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response}).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(response=>{
    if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(event.request,copy))}
    return response;
  })));
});
