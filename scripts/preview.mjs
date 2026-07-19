import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {extname,join,normalize,resolve} from 'node:path';
const root=resolve(import.meta.dirname,'..');
const port=Number(process.env.PORT||3000);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.webmanifest':'application/manifest+json','.svg':'image/svg+xml','.png':'image/png','.txt':'text/plain; charset=utf-8'};
http.createServer(async(req,res)=>{
 try{
  const raw=decodeURIComponent((req.url||'/').split('?')[0]);
  const relative=raw==='/'?'index.html':normalize(raw).replace(/^([.][.][/\\])+/, '').replace(/^[/\\]+/,'');
  let path=join(root,relative);
  try{const info=await stat(path);if(info.isDirectory())path=join(path,'index.html')}catch{path=join(root,'index.html')}
  const data=await readFile(path);res.writeHead(200,{'Content-Type':types[extname(path)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
 }catch(error){res.writeHead(500,{'Content-Type':'text/plain; charset=utf-8'});res.end(`Błąd: ${error.message}`)}
}).listen(port,'127.0.0.1',()=>console.log(`Między Nami działa lokalnie: http://localhost:${port}`));
