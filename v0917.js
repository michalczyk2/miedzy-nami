(function(root){
'use strict';

const VERSION=String(root.MN_RELEASE?.version||'0.9.17');
const V2_PREFIX='scale-v2-';
const previousRender=root.render;
const previousRenderModal=root.renderModal;
const previousOpenGameInfo=root.openGameInfo;

let scheduled=false;

function setText(node,value){
  if(node&&node.textContent!==value)node.textContent=value;
}

function activeSessions(){
  return Array.isArray(root.MN_V099_ONLINE_CENTER?.sessions)
    ? root.MN_V099_ONLINE_CENTER.sessions
    : [];
}

function isScaleV2(session){
  return Array.isArray(session?.question_ids)
    && session.question_ids.length===10
    && session.question_ids.every((id)=>String(id).startsWith(V2_PREFIX));
}

function currentLegacyLocal(){
  const session=root.currentSession;
  return session&&session.mode==='scale'&&!session.saved?session:null;
}

function patchVersion(){
  document.documentElement.dataset.version=VERSION;

  document
    .querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span')
    .forEach((node)=>setText(node,`v${VERSION}`));

  setText(
    document.querySelector('.desktop-welcome .eyebrow'),
    `MIĘDZY NAMI • v${VERSION}`,
  );
}

function openNewScale(){
  if(typeof root.v0915OpenScale==='function')return root.v0915OpenScale();
  if(typeof root.v098OpenScale==='function')return root.v098OpenScale();
}

function patchScaleTile(){
  const tile=[...document.querySelectorAll('.desktop-app')]
    .find((node)=>node.querySelector('.desktop-app-name')?.textContent?.trim()==='Skala');

  if(!tile)return;

  tile.type='button';
  tile.setAttribute('onclick','v0917OpenNewScale()');
  tile.setAttribute(
    'aria-label',
    'Nowa Skala 1–5. Wybierz grę na jednym lub dwóch telefonach.',
  );

  setText(tile.querySelector('.desktop-app-icon strong'),'5');
  setText(tile.querySelector('.desktop-app-mini'),'1–5');
  setText(tile.querySelector(':scope > small'),'20 pytań testowych');
}

function patchLegacyLocalHome(){
  const session=currentLegacyLocal();
  if(!session)return;

  const banner=document.querySelector('.resume-banner');
  if(!banner)return;

  const copy=banner.querySelector(':scope > div');
  const title=copy?.querySelector('strong');
  const description=copy?.querySelector('p');
  const resume=banner.querySelector('button');

  setText(title,'Stara sesja Skali 1–10');
  setText(
    description,
    `Runda ${Number(session.index||0)+1}/${session.deck?.length||10} · możesz ją dokończyć albo usunąć`,
  );
  setText(resume,'Dokończ starą');

  banner.classList.add('v0917-legacy-banner');

  if(!banner.querySelector('.v0917-discard-local')){
    banner.insertAdjacentHTML(
      'beforeend',
      '<button class="button tertiary small-button v0917-discard-local" type="button" onclick="v0917DiscardLegacyLocal()">Usuń starą</button>',
    );
  }
}

function patchLegacyLocalPlay(){
  if(!currentLegacyLocal()||root.ui?.view!=='play')return;

  const panel=document.querySelector('.panel');
  if(!panel)return;

  const modePill=[...panel.querySelectorAll('.score-pill')]
    .find((node)=>node.textContent?.includes('Od jednego do dziesięciu'));

  if(modePill)setText(modePill,'10 Klasyczna Skala 1–10');

  if(!panel.querySelector('.v0917-legacy-notice')){
    panel.querySelector('.session-head')?.insertAdjacentHTML(
      'afterend',
      '<div class="v0917-legacy-notice"><strong>To jest stara rozpoczęta sesja 1–10.</strong><span>Nowa Skala 1–5 jest dostępna z głównego kafelka „Skala”.</span></div>',
    );
  }
}

function sessionForCard(card){
  const onclick=card
    .querySelector('.v099-session-main')
    ?.getAttribute('onclick')||'';

  const match=onclick.match(/v099OpenSession\('([^']+)','scale_live'\)/);

  return match
    ? activeSessions().find((session)=>session.id===match[1])||null
    : null;
}

function patchCenter(){
  document.querySelectorAll('.v099-session-card').forEach((card)=>{
    const session=sessionForCard(card);
    if(!session)return;

    const modern=isScaleV2(session);
    card.classList.toggle('v0917-scale-modern',modern);
    card.classList.toggle('v0917-scale-legacy',!modern);

    setText(card.querySelector('.v099-session-icon'),modern?'5':'10');
    setText(
      card.querySelector('.v099-session-copy strong'),
      modern?'Skala 1–5':'Stara Skala 1–10',
    );

    const status=session.status==='completed'?'WYNIK GOTOWY':'AKTYWNA ONLINE';

    setText(
      card.querySelector('.v099-session-copy small'),
      modern
        ? `GRY · SKALA 1–5 · ${status}`
        : `GRY · STARA SKALA 1–10 · ${status}`,
    );
  });

  document.querySelectorAll('.v099-launch-card').forEach((card)=>{
    const title=card.querySelector('strong');

    if(title?.textContent?.trim()!=='Skala')return;

    setText(card.querySelector(':scope > span'),'5');
    setText(title,'Skala 1–5');
    setText(card.querySelector('small'),'10 pytań · 1–2 tel.');
    card.setAttribute('onclick','v0917OpenNewScale()');
  });
}

function patchScaleLobby(){
  const legacy=document.querySelector('.v0915-compat-card');

  if(!legacy)return;

  legacy.classList.add('v0917-legacy-online-card');
  setText(
    legacy.querySelector('small'),
    'STARA SESJA ONLINE 1–10 · ZACHOWANA',
  );

  if(!document.querySelector('.v0917-remove-legacy-online')){
    legacy.insertAdjacentHTML(
      'afterend',
      '<button class="button tertiary full v0917-remove-legacy-online" type="button" onclick="v0915CancelOnline()">Usuń starą sesję online</button>',
    );
  }
}

function patchHomeCenter(){
  const session=activeSessions()
    .find((item)=>item.game_key==='scale_live'&&item.status==='active');

  if(!session)return;

  const summary=document.querySelector('.v099-home-center em');

  if(!summary)return;

  const label=isScaleV2(session)?'Skala 1–5':'Stara Skala 1–10';

  setText(
    summary,
    (summary.textContent||'').replace(/(^| · )Skala(?= · |$)/,`$1${label}`),
  );
}

function patchAll(){
  patchVersion();
  patchScaleTile();
  patchLegacyLocalHome();
  patchLegacyLocalPlay();
  patchCenter();
  patchScaleLobby();
  patchHomeCenter();
}

function schedulePatch(){
  if(scheduled)return;

  scheduled=true;

  queueMicrotask(()=>{
    scheduled=false;
    patchAll();
  });
}

function discardLegacyLocal(){
  if(!currentLegacyLocal())return;

  if(!root.confirm(
    'Usunąć tylko starą lokalną sesję Skali 1–10? Konta, para, statystyki i inne gry pozostaną bez zmian.',
  ))return;

  if(typeof root.finishToHome==='function'){
    root.finishToHome();
    return;
  }

  root.currentSession=null;
  localStorage.removeItem('mn-v02-session');
  root.ui.view='home';
  root.render();
}

root.render=function(){
  const result=previousRender?.();
  schedulePatch();
  return result;
};

root.renderModal=function(){
  const result=previousRenderModal?.();
  schedulePatch();
  return result;
};

root.openGameInfo=function(id){
  if(id==='scale')return openNewScale();
  return previousOpenGameInfo?.(id);
};

Object.assign(root,{
  v0917OpenNewScale:openNewScale,
  v0917DiscardLegacyLocal:discardLegacyLocal,
});

const observer=new MutationObserver(schedulePatch);
const app=document.querySelector('#app');
const modal=document.querySelector('#modal-root');

if(app)observer.observe(app,{childList:true,subtree:true});
if(modal)observer.observe(modal,{childList:true,subtree:true});

window.addEventListener('pageshow',schedulePatch);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')schedulePatch();
});

root.MN_RUNTIME_DIAGNOSTICS={
  version:VERSION,
  bootVersion:root.MN_BOOT?.version||null,
  loadedScripts:root.MN_BOOT?.loadedScripts||[],
  serviceWorkerControlled:Boolean(navigator.serviceWorker?.controller),
};

schedulePatch();
})(globalThis);
