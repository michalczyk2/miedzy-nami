importScripts('/release.js');
const CACHE=globalThis.MN_RELEASE?.cache||'miedzy-nami-v083';
const BUILD_ASSETS=/*__MN_VITE_ASSETS__*/[];
const CORE=['/','/index.html','/release.js','/styles.css','/cloud-config.js','/app.js','/enhancements.js','/content/cards-v05.js','/v05.js','/content/daily-match.js','/v06.js','/v07.js','/v071.js','/v08.js','/spicy-v081-data.js','/v081.js','/spicy-v082-data.js','/v082.js','/v083.js','/v091.js','/multiplayer-core-v092.js','/v092.js','/multiplayer-live-core-v093.js','/v093.js','/v094.js','/v097.js','/manifest.webmanifest','/icon.svg','/icon-180.png','/icon-192.png','/icon-512.png','/version.json',...BUILD_ASSETS];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
});

async function networkFirst(request,fallback){
  try{
    const response=await fetch(request);
    if(response.ok){const cache=await caches.open(CACHE);await cache.put(fallback||request,response.clone())}
    return response;
  }catch(error){
    const cached=await caches.match(fallback||request);
    if(cached)return cached;
    throw error;
  }
}

self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET')return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  if(event.request.mode==='navigate'){
    event.respondWith(networkFirst(event.request,'/index.html'));
    return;
  }
  if(['/cloud-config.js','/version.json','/release.js','/sw.js'].includes(url.pathname)){
    event.respondWith(networkFirst(event.request));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached=>cached||fetch(event.request).then(async response=>{
    if(response.ok){const cache=await caches.open(CACHE);await cache.put(event.request,response.clone())}
    return response;
  })));
});
