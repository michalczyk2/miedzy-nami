(function(){
'use strict';

const RELEASE=globalThis.MN_RELEASE||{version:'0.8.3',cache:'miedzy-nami-v083'};
const VERSION=String(RELEASE.version||'0.8.3');
let updateRegistration=null;
let reloadAfterUpdate=false;
let connectionTimer=null;
let wasOffline=navigator.onLine===false;

function v083Esc(value){
  if(typeof globalThis.escapeHtml==='function')return globalThis.escapeHtml(String(value??''));
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}

function v083EnsureLayer(){
  let layer=document.querySelector('#v083-global-layer');
  if(layer)return layer;
  layer=document.createElement('div');
  layer.id='v083-global-layer';
  layer.innerHTML=`<div id="v083-connection" class="v083-connection" role="status" aria-live="polite" hidden><span class="v083-connection-dot"></span><div><strong></strong><small></small></div><button type="button" onclick="v083RetryConnection()">Spróbuj ponownie</button></div><div id="v083-update" class="v083-update" role="status" aria-live="polite" hidden><span>↻</span><div><strong>Nowa wersja jest gotowa</strong><small>Zaktualizuj aplikację bez utraty konta ani rozpoczętej gry.</small></div><button type="button" onclick="v083ApplyUpdate()">Zaktualizuj</button><button class="v083-update-later" type="button" onclick="v083DismissUpdate()" aria-label="Zamknij">×</button></div>`;
  document.body.appendChild(layer);
  return layer;
}

function v083SetVersion(){
  document.documentElement.dataset.version=VERSION;
  document.title=`Między Nami ${VERSION} — gry dla par`;
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>{node.textContent=`v${VERSION}`});
  const hero=document.querySelector('.desktop-welcome .eyebrow');
  if(hero)hero.textContent=hero.textContent.replace(/v0\.\d+\.\d+|v0\.6\.0/g,`v${VERSION}`);
  const aboutChip=document.querySelector('.about-panel .chip');
  if(aboutChip)aboutChip.textContent=`v${VERSION}`;
}

function v083FriendlyError(error){
  const raw=String(error?.message||error||'Nieznany błąd');
  const normalized=raw.toLowerCase();
  if(normalized.includes('load failed')||normalized.includes('failed to fetch')||normalized.includes('network request failed')||normalized.includes('networkerror')||normalized.includes('network error'))return'Nie udało się połączyć z chmurą. Sprawdź internet i spróbuj ponownie. Twoje dane lokalne nie zostały utracone.';
  if(normalized.includes('timeout')||normalized.includes('timed out'))return'Połączenie trwało zbyt długo. Spróbuj ponownie za chwilę.';
  if(normalized.includes('gen_random_bytes'))return'Baza danych wymaga aktualizacji generatora kodu pary. Uruchom migrację 002_fix_invite_code.sql.';
  if(normalized.includes('jwt')&&normalized.includes('expired'))return'Sesja wygasła. Zamknij i otwórz aplikację; konto powinno odświeżyć się automatycznie.';
  return raw;
}

globalThis.MN_FRIENDLY_ERROR=v083FriendlyError;

function v083ShowCloudFailure(error){
  const message=v083FriendlyError(error);
  const runtime=globalThis.MN_CLOUD_RUNTIME;
  if(runtime){runtime.loading=false;runtime.error=message}
  if(typeof globalThis.render==='function'){
    try{globalThis.render()}catch{}
  }
  if(typeof globalThis.toast==='function')globalThis.toast(message);
  console.error('[Między Nami]',error);
}

function v083WrapCloudAction(name){
  const original=globalThis[name];
  if(typeof original!=='function'||original.__mnV083Wrapped)return;
  const wrapped=async function(...args){
    if(navigator.onLine===false){v083ShowCloudFailure(new TypeError('Network request failed'));return}
    try{return await original.apply(this,args)}catch(error){v083ShowCloudFailure(error)}
  };
  wrapped.__mnV083Wrapped=true;
  wrapped.__mnV083Original=original;
  globalThis[name]=wrapped;
}

function v083WrapCloudActions(){
  ['cloudSendOtp','cloudVerifyOtp','cloudGoogleSignIn','cloudCreatePair','cloudJoinPair','cloudLeavePair','syncLocalSessions'].forEach(v083WrapCloudAction);
}

function v083RenderConnection(online,{restored=false}={}){
  v083EnsureLayer();
  const banner=document.querySelector('#v083-connection');
  if(!banner)return;
  const title=banner.querySelector('strong');
  const detail=banner.querySelector('small');
  const retry=banner.querySelector('button');
  if(!title||!detail||!retry)return;
  document.documentElement.dataset.network=online?'online':'offline';
  clearTimeout(connectionTimer);
  if(!online){
    banner.hidden=false;banner.classList.add('offline');banner.classList.remove('restored');
    title.textContent='Tryb offline';detail.textContent='Możesz grać lokalnie. Synchronizacja wróci po odzyskaniu internetu.';retry.hidden=false;
    return;
  }
  if(restored){
    banner.hidden=false;banner.classList.remove('offline');banner.classList.add('restored');
    title.textContent='Połączenie przywrócone';detail.textContent='Dane online zostaną ponownie zsynchronizowane.';retry.hidden=true;
    connectionTimer=setTimeout(()=>{banner.hidden=true},3500);
  }else banner.hidden=true;
}

function v083RetryConnection(){
  if(navigator.onLine===false){v083RenderConnection(false);return}
  location.reload();
}

function v083ShowUpdate(registration){
  updateRegistration=registration||updateRegistration;
  v083EnsureLayer();
  const banner=document.querySelector('#v083-update');
  if(banner)banner.hidden=false;
}
function v083DismissUpdate(){
  const banner=document.querySelector('#v083-update');
  if(banner)banner.hidden=true;
}
function v083ApplyUpdate(){
  const worker=updateRegistration?.waiting;
  if(!worker){location.reload();return}
  reloadAfterUpdate=true;
  const button=document.querySelector('#v083-update button');
  if(button){button.disabled=true;button.textContent='Aktualizuję…'}
  worker.postMessage({type:'SKIP_WAITING'});
}

async function v083CheckRemoteVersion(registration){
  try{
    const response=await fetch(`/version.json?check=${Date.now()}`,{cache:'no-store'});
    if(!response.ok)return;
    const remote=await response.json();
    if(remote?.version&&String(remote.version)!==VERSION){
      await registration?.update?.();
      if(registration?.waiting)v083ShowUpdate(registration);
    }
  }catch{}
}

async function v083MonitorServiceWorker(){
  if(!navigator.serviceWorker?.getRegistration)return;
  try{
    const registration=await navigator.serviceWorker.getRegistration()||await navigator.serviceWorker.ready;
    updateRegistration=registration;
    if(registration.waiting)v083ShowUpdate(registration);
    registration.addEventListener('updatefound',()=>{
      const worker=registration.installing;
      if(!worker)return;
      worker.addEventListener('statechange',()=>{
        if(worker.state==='installed'&&navigator.serviceWorker.controller)v083ShowUpdate(registration);
      });
    });
    navigator.serviceWorker.addEventListener('controllerchange',()=>{
      if(!reloadAfterUpdate)return;
      reloadAfterUpdate=false;
      location.reload();
    });
    await registration.update().catch(()=>{});
    await v083CheckRemoteVersion(registration);
  }catch(error){console.warn('[Między Nami SW]',error)}
}

function v083OnOnline(){const restored=wasOffline;wasOffline=false;v083RenderConnection(true,{restored});if(updateRegistration)v083CheckRemoteVersion(updateRegistration)}
function v083OnOffline(){wasOffline=true;v083RenderConnection(false)}

const previousRender=globalThis.render;
if(typeof previousRender==='function'){
  globalThis.render=function(){
    previousRender();
    v083SetVersion();
    v083WrapCloudActions();
  };
}
const previousRenderModal=globalThis.renderModal;
if(typeof previousRenderModal==='function'){
  globalThis.renderModal=function(){previousRenderModal();v083SetVersion()};
}

window.addEventListener('online',v083OnOnline);
window.addEventListener('offline',v083OnOffline);
window.addEventListener('unhandledrejection',event=>{
  const reason=event.reason;
  const message=String(reason?.message||reason||'').toLowerCase();
  if(message.includes('load failed')||message.includes('failed to fetch')||message.includes('network')){
    event.preventDefault();v083ShowCloudFailure(reason);
  }
});
window.addEventListener('focus',()=>{if(updateRegistration)v083CheckRemoteVersion(updateRegistration)});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&updateRegistration)v083CheckRemoteVersion(updateRegistration)});

Object.assign(globalThis,{v083RetryConnection,v083ApplyUpdate,v083DismissUpdate});
v083EnsureLayer();
v083SetVersion();
v083WrapCloudActions();
v083RenderConnection(navigator.onLine!==false);
window.addEventListener('load',v083MonitorServiceWorker,{once:true});
if(document.readyState==='complete')v083MonitorServiceWorker();
})();
