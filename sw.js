/* Pépètes : service worker. Met l'app en cache pour qu'elle marche hors ligne.
   Le numéro de version change à chaque nouvelle livraison : l'app propose alors « Mettre à jour ». */
const VERSION='pepetes-e60b8cd17a';
const FILES=['./','index.html','app.css','app.js','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES))); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('message',e=>{ if(e.data==='skip') self.skipWaiting(); });
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const url=new URL(r.url); if(url.origin!==location.origin) return;
  if(r.mode==='navigate'){ e.respondWith(caches.match('index.html').then(c=>c||fetch(r))); return; }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(c=>c||fetch(r).then(res=>{ if(res.ok){ const cp=res.clone(); caches.open(VERSION).then(ca=>ca.put(r,cp)); } return res; })));
});
