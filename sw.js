const VER="91609f61";
const SHELL=["./","./index.html","./app.js?v="+VER,"./config.js?v="+VER,"./pdf.worker.min.js","./manifest.webmanifest","./icon-192.png","./icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open("shell-"+VER).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("shell-")&&k!=="shell-"+VER).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{
  const u=new URL(e.request.url);
  // Fatura ou mensagem compartilhada de outro app (Android)
  if(e.request.method==="POST"&&u.pathname.endsWith("/share-target")){
    e.respondWith((async()=>{
      try{const fd=await e.request.formData();const box=await caches.open("share-inbox");
        for(const k of await box.keys())await box.delete(k);
        let i=0;for(const f of fd.getAll("files")){if(f&&f.size){await box.put("./inbox/"+(i++),new Response(f,{headers:{"x-kind":"file"}}))}}
        const t=[fd.get("title"),fd.get("text")].filter(Boolean).join(" ");
        if(t&&!i)await box.put("./inbox/text",new Response(t,{headers:{"x-kind":"text"}}));
      }catch(err){}
      return Response.redirect("./?share",303)})());
    return}
  if(e.request.method!=="GET"||u.origin!==location.origin)return;
  // Páginas: rede primeiro (pega versão nova), cache se offline
  if(e.request.mode==="navigate"){
    e.respondWith(fetch(e.request).then(r=>{const c=r.clone();caches.open("shell-"+VER).then(x=>x.put("./index.html",c));return r}).catch(()=>caches.match("./index.html",{ignoreSearch:true})));return}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(res=>{if(res.ok&&res.type==="basic"){const c=res.clone();caches.open("shell-"+VER).then(x=>x.put(e.request,c))}return res})));
});
