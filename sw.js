const V="gsb-v6";
const ARQ=["./","index.html","Atendimento.html","Gestao_de_Stock.html","manifest.webmanifest","icon-192.png","icon-512.png","inter-400.woff","inter-600.woff"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(ARQ)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
// Abre logo a partir da cache e atualiza em segundo plano; avisa quando há versão nova.
self.addEventListener("fetch",e=>{
  const r=e.request;
  if(r.method!=="GET"||new URL(r.url).origin!==location.origin)return;
  if(new URL(r.url).pathname.endsWith("versao.json")){
    e.respondWith(fetch(r,{cache:"no-cache"}).then(async res=>{if(res.ok)(await caches.open(V)).put(r,res.clone());return res}).catch(async()=>(await caches.match(r))||new Response("{}",{headers:{"Content-Type":"application/json"}})));
    return;
  }
  e.respondWith((async()=>{
    const c=await caches.open(V),cached=await c.match(r),copia=cached?cached.clone():null;
    const rede=fetch(r,{cache:"no-cache"}).then(async res=>{
      if(res&&res.ok){
        let nova=false;
        if(cached&&/(\.html|\/)$/.test(new URL(r.url).pathname)){
          const [a,b]=await Promise.all([copia.text(),res.clone().text()]);
          nova=a!==b;
        }
        await c.put(r,res.clone());
        if(nova){
          const ids=new Set();
          const av=p=>self.clients.matchAll().then(l=>l.forEach(k=>{if(p)ids.add(k.id);if(ids.has(k.id))k.postMessage("nova-versao")}));
          await new Promise(r=>setTimeout(r,1500));await av(true);
          await new Promise(r=>setTimeout(r,3500));await av(false);
        }
      }
      return res;
    }).catch(()=>null);
    e.waitUntil(rede);
    return cached||(await rede)||(await c.match("index.html"))||new Response("Sem ligação",{status:503});
  })());
});
