(function(root){
'use strict';

const VERSION=String(root.MN_RELEASE?.version||'0.9.16');
const previousRender=root.render;
const previousRenderModal=root.renderModal;
const V2_PREFIX='scale-v2-';

let patchScheduled=false;

function setText(node,value){
  if(node&&node.textContent!==value)node.textContent=value;
}

function isScaleV2(session){
  return Array.isArray(session?.question_ids)
    && session.question_ids.length===10
    && session.question_ids.every(id=>String(id).startsWith(V2_PREFIX));
}

function currentScaleSession(){
  const sessions=Array.isArray(root.MN_V099_ONLINE_CENTER?.sessions)
    ? root.MN_V099_ONLINE_CENTER.sessions
    : [];
  return sessions.find(item=>item.game_key==='scale_live'&&item.status==='active')||null;
}

function patchVersion(){
  document.documentElement.dataset.version=VERSION;

  document
    .querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span')
    .forEach(node=>setText(node,`v${VERSION}`));

  const welcome=document.querySelector('.desktop-welcome .eyebrow');
  if(welcome)setText(welcome,`MIĘDZY NAMI • v${VERSION}`);

  document.title=document.title.replace(/0\.\d+\.\d+/g,VERSION);
}

function patchScaleTile(){
  const tile=[...document.querySelectorAll('.desktop-app')]
    .find(node=>node.querySelector('.desktop-app-name')?.textContent?.trim()==='Skala');

  if(!tile)return;

  tile.type='button';
  tile.setAttribute('onclick','v0915OpenScale()');
  tile.setAttribute('aria-label','Skala 1–5. Wybierz grę na jednym lub dwóch telefonach.');

  setText(tile.querySelector('.desktop-app-icon strong'),'5');
  setText(tile.querySelector('.desktop-app-mini'),'1–5');
  setText(tile.querySelector(':scope > small'),'20 pytań testowych');
}

function patchLegacyLocalBanner(){
  const headings=[...document.querySelectorAll('.resume-banner strong,h2,h3')]
    .filter(node=>node.textContent?.trim()==='Niedokończona sesja');

  for(const heading of headings){
    const card=heading.closest('.resume-banner,article,section,div');
    if(!card)continue;
    const description=[...card.querySelectorAll('p,small,span')]
      .find(node=>node.textContent?.includes('Od jednego do dziesięciu'));
    if(!description)continue;

    const updated=description.textContent.replace(
      'Od jednego do dziesięciu',
      'Klasyczna Skala 1–10'
    );
    setText(description,updated);
    card.classList.add('v0916-legacy-local');

    if(!card.querySelector('.v0916-legacy-label')){
      heading.insertAdjacentHTML(
        'beforebegin',
        '<span class="v0916-legacy-label">STARA SESJA · ZACHOWANA DLA ZGODNOŚCI</span>'
      );
    }
  }
}

function sessionFromCard(card){
  const main=card.querySelector('.v099-session-main');
  const onclick=main?.getAttribute('onclick')||'';
  const match=onclick.match(/v099OpenSession\('([^']+)','([^']+)'\)/);
  if(!match||match[2]!=='scale_live')return null;

  const sessions=Array.isArray(root.MN_V099_ONLINE_CENTER?.sessions)
    ? root.MN_V099_ONLINE_CENTER.sessions
    : [];

  return sessions.find(item=>item.id===match[1])||null;
}

function patchCenterScaleCards(){
  document.querySelectorAll('.v099-session-card').forEach(card=>{
    const session=sessionFromCard(card);
    if(!session)return;

    const modern=isScaleV2(session);
    card.classList.toggle('v0916-scale-modern',modern);
    card.classList.toggle('v0916-scale-legacy',!modern);

    setText(card.querySelector('.v099-session-icon'),modern?'5':'10');
    setText(
      card.querySelector('.v099-session-copy strong'),
      modern?'Skala 1–5':'Klasyczna Skala 1–10'
    );

    const small=card.querySelector('.v099-session-copy small');
    const status=session.status==='completed'?'WYNIK GOTOWY':'AKTYWNA ONLINE';
    setText(
      small,
      modern
        ? `GRY · SKALA 1–5 · ${status}`
        : `GRY · STARA SESJA 1–10 · ${status}`
    );

    const meta=card.querySelector('.v099-session-copy em');
    if(meta){
      let text=meta.textContent||'';
      text=text.replace(/^10 kart/,'10 pytań');
      if(!modern&&!text.includes('stare zasady'))text=`${text} · stare zasady`;
      setText(meta,text);
    }
  });

  document.querySelectorAll('.v099-launch-card').forEach(card=>{
    const title=card.querySelector('strong');
    if(title?.textContent?.trim()!=='Skala')return;

    setText(card.querySelector(':scope > span'),'5');
    setText(title,'Skala 1–5');
    setText(card.querySelector('small'),'10 pytań · 1–2 tel.');
    card.setAttribute('onclick','v0915OpenScale()');
  });
}

function patchHomeCenter(){
  const session=currentScaleSession();
  if(!session)return;

  const center=document.querySelector('.v099-home-center em');
  if(!center)return;

  const label=isScaleV2(session)?'Skala 1–5':'Skala 1–10';
  const current=center.textContent||'';
  const updated=current.replace(/(^| · )Skala(?= · |$)/,`$1${label}`);
  setText(center,updated);
}

function patchScaleLobby(){
  const legacy=document.querySelector('.v0915-compat-card');
  if(legacy){
    legacy.classList.add('v0916-legacy-scale-card');
    setText(
      legacy.querySelector('small'),
      'STARA SESJA ONLINE · NIE JEST NOWĄ SKALĄ'
    );
  }

  const oldLocal=[...document.querySelectorAll('.v0915-mode-card.local button')]
    .find(button=>button.textContent?.includes('Dokończ Skalę 1–10'));
  if(oldLocal){
    oldLocal.classList.add('v0916-legacy-button');
    oldLocal.setAttribute(
      'aria-label',
      'Dokończ starą lokalną sesję Skali 1–10'
    );
  }
}

function patchAll(){
  patchVersion();
  patchScaleTile();
  patchLegacyLocalBanner();
  patchCenterScaleCards();
  patchHomeCenter();
  patchScaleLobby();
}

function schedulePatch(){
  if(patchScheduled)return;
  patchScheduled=true;
  queueMicrotask(()=>{
    patchScheduled=false;
    patchAll();
  });
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

const observer=new MutationObserver(()=>schedulePatch());
const app=document.querySelector('#app');
const modal=document.querySelector('#modal-root');
if(app)observer.observe(app,{childList:true,subtree:true});
if(modal)observer.observe(modal,{childList:true,subtree:true});

window.addEventListener('pageshow',schedulePatch);
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState==='visible')schedulePatch();
});

schedulePatch();
})(globalThis);
