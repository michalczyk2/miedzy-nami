(function(root){
'use strict';

const VERSION=String(root.MN_RELEASE?.version||'0.9.9');
const VIEW='v099-online-center';
const REQUEST_TIMEOUT_MS=12000;
const LIVE_GAME_KEYS=new Set(['who_live','know_live','dilemma_live','scale_live']);
const GAME_META=Object.freeze({
  spicy_match:{label:'Dopasowanie 18+',short:'Dopasowanie 18+',icon:'♡',group:'Pikantne',questions:8,join:'v091JoinSession',open:'v091OpenMatch',state:'MN_V091_MULTIPLAYER'},
  spicy_desire:{label:'Ochota na dziś',short:'Ochota na dziś',icon:'🔥',group:'Pikantne',questions:5,join:'v092JoinSession',open:'v092OpenDesire',state:'MN_V092_DESIRE_MULTIPLAYER'},
  who_live:{label:'Kto bardziej?',short:'Kto bardziej',icon:'↔',group:'Gry',questions:10,join:'v093JoinSession',open:'v093OpenWho',state:'MN_V093_LIVE_WHO'},
  know_live:{label:'Znasz mnie?',short:'Znasz mnie',icon:'?',group:'Gry',questions:10,join:'v094JoinSession',open:'v094OpenKnow',state:'MN_V094_LIVE_KNOW'},
  dilemma_live:{label:'Co wybierasz?',short:'Wybór',icon:'◇',group:'Gry',questions:10,join:'v097JoinSession',open:'v097OpenDilemma',state:'MN_V097_LIVE_DILEMMA'},
  scale_live:{label:'Skala 1–10',short:'Skala',icon:'10',group:'Gry',questions:10,join:'v098JoinSession',open:'v098OpenScale',state:'MN_V098_LIVE_SCALE'},
});

const center={
  sessions:[],loading:false,error:'',checkedAt:0,checking:false,subscription:null,
};
root.MN_V099_ONLINE_CENTER=center;

const previousRender=root.render;
const previousRenderModal=root.renderModal;

function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function cloud(){return root.MN_CLOUD_RUNTIME||null}
function liveCore(){return root.MN_LIVE_MULTIPLAYER_CORE||null}
function client(){return cloud()?.client||liveCore()?.client?.()||null}
function currentCouple(){return cloud()?.couple||liveCore()?.currentCouple?.()||null}
function currentUser(){return cloud()?.user||liveCore()?.currentUser?.()||null}
function members(){return cloud()?.members||liveCore()?.members?.()||[]}
function partner(){return members().find(item=>item.user_id!==currentUser()?.id)||null}
function ready(){return Boolean(client()&&currentCouple()&&currentUser()&&partner())}
function memberName(userId){return members().find(item=>item.user_id===userId)?.display_name||'Osoba'}
function metaFor(gameKey){return GAME_META[gameKey]||{label:'Gra online',short:'Gra online',icon:'▶',group:'Online',questions:0}}
function activeSessions(){return center.sessions.filter(item=>item.status==='active')}
function completedSessions(){return center.sessions.filter(item=>item.status==='completed')}
function setVersion(){document.documentElement.dataset.version=VERSION}
function timeout(promise,label='Synchronizacja centrum online'){
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out`)),REQUEST_TIMEOUT_MS)}),
  ]).finally(()=>clearTimeout(timer));
}
function friendlyError(error){
  const raw=String(error?.message||error||'Nieznany błąd');
  const lower=raw.toLowerCase();
  if(lower.includes('timeout')||lower.includes('timed out'))return'Połączenie trwało zbyt długo. Sprawdź internet i spróbuj ponownie.';
  if(lower.includes('failed to fetch')||lower.includes('load failed')||lower.includes('network'))return'Nie udało się połączyć z centrum gier online. Sprawdź internet.';
  return liveCore()?.friendlyError?.(error)||raw;
}
function dailyEntry(){
  const runtime=cloud();
  if(!runtime?.daily||runtime.daily.result)return null;
  const submissions=Array.isArray(runtime.daily.submissions)?runtime.daily.submissions:[];
  if(!submissions.length)return null;
  const own=Boolean(runtime.daily.own);
  const other=Boolean(runtime.daily.partner);
  return{
    id:`daily:${runtime.daily.date||'today'}`,
    game_key:'daily_match',status:'active',created_by:submissions[0]?.user_id||'',
    created_at:submissions[0]?.completed_at||new Date().toISOString(),
    updated_at:submissions.at(-1)?.completed_at||new Date().toISOString(),
    expires_at:new Date(Date.now()+86400000).toISOString(),question_ids:Array(5).fill('daily'),
    dailyState:own&&!other?'waiting':!own&&other?'your-turn':'active',
  };
}
function allDisplaySessions(){
  const daily=dailyEntry();
  return daily?[daily,...center.sessions]:[...center.sessions];
}
function displayActive(){return allDisplaySessions().filter(item=>item.status==='active')}
function displayCompleted(){return center.sessions.filter(item=>item.status==='completed')}
function syncLegacyState(sessionId,gameKey){
  const key=GAME_META[gameKey]?.state;
  const state=key?root[key]:null;
  if(!state)return;
  for(const field of ['session','activeSession','latestSession','recentSession'])if(state[field]?.id===sessionId)state[field]=null;
  if('state' in state)state.state=null;
}
function cleanupLegacyHomeBanners(){
  document.querySelectorAll('.v093-home-session,.v094-home-session,.v097-home-session,.v098-home-session').forEach(node=>node.remove());
}
function relativeStatus(session){
  if(session.game_key==='daily_match'){
    if(session.dailyState==='waiting')return'Czekamy na odpowiedź partnera';
    if(session.dailyState==='your-turn')return'Partner odpowiedział — teraz twoja kolej';
    return'Dzisiejszy zestaw jest rozpoczęty';
  }
  if(session.status==='completed')return'Wspólny wynik jest gotowy';
  const creator=session.created_by===currentUser()?.id?'Rozpoczęto na tym telefonie':`Rozpoczęła osoba: ${memberName(session.created_by)}`;
  return creator;
}
function questionLabel(session){
  const count=Array.isArray(session.question_ids)?session.question_ids.length:Number(metaFor(session.game_key).questions||0);
  return count?`${count} ${count===1?'karta':count<5?'karty':'kart'}`:'Wspólna sesja';
}
function sessionCard(session){
  const meta=session.game_key==='daily_match'?{label:'5 pytań dla was obojga',short:'Codzienne Dopasowanie',icon:'5',group:'Codzienne'}:metaFor(session.game_key);
  const completed=session.status==='completed';
  const open=`v099OpenSession('${esc(session.id)}','${esc(session.game_key)}')`;
  const remove=session.game_key==='daily_match'?'':`<button class="v099-session-remove" type="button" onclick="event.stopPropagation();v099RemoveSession('${esc(session.id)}','${esc(session.game_key)}')" aria-label="Usuń sesję">Usuń</button>`;
  return`<article class="v099-session-card ${completed?'completed':'active'}"><button class="v099-session-main" type="button" onclick="${open}"><span class="v099-session-icon">${esc(meta.icon)}</span><span class="v099-session-copy"><small>${esc(meta.group)} · ${completed?'WYNIK GOTOWY':'AKTYWNA ONLINE'}</small><strong>${esc(meta.label)}</strong><em>${esc(questionLabel(session))} · ${esc(relativeStatus(session))}</em></span><i>${completed?'Wynik →':'Kontynuuj →'}</i></button>${remove}</article>`;
}
function launchCard(gameKey){
  const meta=metaFor(gameKey);
  return`<button type="button" class="v099-launch-card" onclick="v099StartGame('${gameKey}')"><span>${esc(meta.icon)}</span><strong>${esc(meta.short)}</strong><small>${meta.questions} ${meta.questions===1?'karta':'kart'} · 1–2 tel.</small></button>`;
}
function errorHtml(){return center.error?`<div class="v083-friendly-error"><span>!</span><div><strong>Nie udało się odświeżyć centrum</strong><p>${esc(center.error)}</p></div><button onclick="v099Refresh()">Spróbuj ponownie</button></div>`:''}
function loadingHtml(){return center.loading?'<div class="v091-loading"><i></i><span>Sprawdzamy wspólne gry…</span></div>':''}

async function fetchSessions(){
  if(!ready()){center.sessions=[];center.checkedAt=Date.now();return[]}
  const api=client();const couple=currentCouple();
  const{data,error}=await timeout(api.from('multiplayer_sessions')
    .select('id,couple_id,game_key,question_ids,status,created_by,created_at,updated_at,completed_at,expires_at')
    .eq('couple_id',couple.id)
    .in('status',['active','completed'])
    .gt('expires_at',new Date().toISOString())
    .order('updated_at',{ascending:false})
    .limit(20));
  if(error)throw error;
  center.sessions=(data||[]).filter(item=>GAME_META[item.game_key]);
  center.checkedAt=Date.now();
  return center.sessions;
}
async function refreshCenter({quiet=false}={}){
  if(center.checking)return;
  center.checking=true;if(!quiet){center.loading=true;center.error='';root.render()}
  try{await fetchSessions();center.error=''}catch(error){center.error=friendlyError(error);console.error('[Między Nami v0.9.9 center]',error)}finally{
    center.loading=false;center.checking=false;
    if(root.ui?.view===VIEW)root.render();else if(root.ui?.view==='home')enhanceHome();
  }
}
function subscribeCenter(){
  const api=client();const couple=currentCouple();
  if(center.subscription&&api){api.removeChannel(center.subscription).catch(()=>{});center.subscription=null}
  if(!ready())return;
  center.subscription=api.channel(`mn-online-center-${couple.id}-${currentUser().id}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'multiplayer_sessions',filter:`couple_id=eq.${couple.id}`},()=>void refreshCenter({quiet:true}))
    .subscribe();
}
function ensureFresh(){
  if(!ready())return;
  if(!center.subscription)subscribeCenter();
  if(!center.checking&&Date.now()-center.checkedAt>4000)queueMicrotask(()=>void refreshCenter({quiet:true}));
}

function renderCenter(){
  const active=displayActive();const completed=displayCompleted();
  root.app.innerHTML=`<section class="panel wide v099-center"><div class="top-row"><button class="back-button" onclick="v099BackHome()">← Pulpit</button><button class="button tertiary small-button" onclick="v099Refresh()">Odśwież</button></div><div class="v099-center-hero"><span>⇄</span><div><small>CENTRUM GIER ONLINE</small><h1>Wasze wspólne sesje</h1><p>W jednym miejscu zobaczycie rozpoczęte gry i wyniki gotowe na obu telefonach.</p></div><b>${active.length}</b></div>${errorHtml()}${loadingHtml()}<section class="v099-center-section"><div class="v099-center-heading"><div><h2>Aktywne gry</h2><p>Kontynuujcie dokładnie od miejsca, w którym skończyliście.</p></div><span>${active.length}</span></div>${active.length?`<div class="v099-session-list">${active.map(sessionCard).join('')}</div>`:'<div class="v099-empty"><span>✓</span><strong>Nie macie niedokończonej gry online</strong><p>Rozpocznijcie nową rozgrywkę poniżej.</p></div>'}</section>${completed.length?`<section class="v099-center-section"><div class="v099-center-heading"><div><h2>Wyniki gotowe</h2><p>Otwórzcie ostatnie wspólne podsumowania.</p></div><span>${completed.length}</span></div><div class="v099-session-list">${completed.map(sessionCard).join('')}</div></section>`:''}<section class="v099-center-section"><div class="v099-center-heading"><div><h2>Rozpocznij online</h2><p>Każde odpowiada na swoim telefonie.</p></div></div><div class="v099-launch-grid">${Object.keys(GAME_META).map(launchCard).join('')}<button type="button" class="v099-launch-card daily" onclick="openCloudDaily()"><span>5</span><strong>Codzienne</strong><small>5 pytań · 2 tel.</small></button></div></section><p class="v099-privacy">🔒 Centrum pokazuje tylko nazwę i stan sesji. Prywatne odpowiedzi nie są tu wyświetlane.</p></section>`;
  setVersion();
}
function homeMarkup(){
  const active=displayActive();const completed=displayCompleted();
  const names=active.slice(0,3).map(item=>item.game_key==='daily_match'?'Codzienne':metaFor(item.game_key).short).join(' · ');
  const summary=active.length?`${active.length} ${active.length===1?'aktywna gra':'aktywne gry'}${names?' — '+names:''}`:completed.length?`${completed.length} ${completed.length===1?'wynik gotowy':'wyniki gotowe'} do obejrzenia`:'Rozpocznijcie wspólną grę na dwóch telefonach';
  return`<button class="v099-home-center ${active.length?'has-active':''}" type="button" onclick="v099OpenCenter()"><span class="v099-home-icon">⇄${active.length?`<i>${active.length}</i>`:''}</span><span><small>CENTRUM ONLINE · 2 TELEFONY</small><strong>${active.length?'Kontynuujcie wspólne gry':'Wszystkie gry online w jednym miejscu'}</strong><em>${esc(summary)}</em></span><b>Otwórz →</b></button>`;
}
function enhanceHome(){
  if(root.ui?.view!=='home')return;
  cleanupLegacyHomeBanners();
  document.querySelector('.v099-home-center')?.remove();
  if(!ready())return;
  const gamesTitle=[...document.querySelectorAll('.desktop-section-title')].find(item=>item.querySelector('h2')?.textContent?.trim()==='Gry');
  gamesTitle?.insertAdjacentHTML('beforebegin',homeMarkup());
  ensureFresh();
}
function enhanceMenu(){
  if(root.ui?.modal!=='main-menu')return;
  const list=document.querySelector('.menu-list');
  if(list&&!list.querySelector('[data-v099-center]'))list.insertAdjacentHTML('afterbegin','<button class="menu-item" data-v099-center onclick="v099OpenCenter()">Centrum gier online<span>Aktywne sesje i wspólne wyniki</span></button>');
}

function v099OpenCenter(){root.ui.view=VIEW;root.ui.modal=null;root.render();void refreshCenter({quiet:true})}
function v099BackHome(){root.ui.view='home';root.render()}
function v099Refresh(){center.error='';void refreshCenter()}
function v099OpenSession(sessionId,gameKey){
  if(gameKey==='daily_match'){root.openCloudDaily?.();return}
  const handler=GAME_META[gameKey]?.join;
  if(handler&&typeof root[handler]==='function')root[handler](sessionId);
}
function v099StartGame(gameKey){
  const handler=GAME_META[gameKey]?.open;
  if(handler&&typeof root[handler]==='function')root[handler]();
}
async function v099RemoveSession(sessionId,gameKey){
  if(!root.confirm('Usunąć tę wspólną sesję z obu telefonów?'))return;
  center.loading=true;center.error='';root.render();
  try{
    const api=client();
    const rpc=gameKey==='spicy_match'?'cancel_spicy_match_session':gameKey==='spicy_desire'?'cancel_multiplayer_choice_session':'cancel_live_game_session';
    const{error}=await timeout(api.rpc(rpc,{p_session_id:sessionId}),'Usuwanie sesji');
    if(error)throw error;
    syncLegacyState(sessionId,gameKey);
    center.sessions=center.sessions.filter(item=>item.id!==sessionId);
    center.loading=false;root.render();
  }catch(error){center.loading=false;center.error=friendlyError(error);root.render()}
}

root.render=function(){
  if(root.ui?.view===VIEW){renderCenter();window.scrollTo({top:0,behavior:'smooth'});return}
  previousRender();enhanceHome();enhanceMenu();setVersion();
};
root.renderModal=function(){previousRenderModal?.();enhanceMenu()};
Object.assign(root,{v099OpenCenter,v099BackHome,v099Refresh,v099OpenSession,v099StartGame,v099RemoveSession});
const homeObserver=new MutationObserver(()=>{
  if(root.ui?.view!=='home')return;
  const legacy=document.querySelector('.v093-home-session,.v094-home-session,.v097-home-session,.v098-home-session');
  if(legacy)cleanupLegacyHomeBanners();
  if(ready()&&!document.querySelector('.v099-home-center')){
    const gamesTitle=[...document.querySelectorAll('.desktop-section-title')].find(item=>item.querySelector('h2')?.textContent?.trim()==='Gry');
    gamesTitle?.insertAdjacentHTML('beforebegin',homeMarkup());
  }
});
queueMicrotask(()=>{if(root.app)homeObserver.observe(root.app,{childList:true,subtree:true})});
window.addEventListener('online',()=>{if([VIEW,'home'].includes(root.ui?.view))void refreshCenter({quiet:true})});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&[VIEW,'home'].includes(root.ui?.view))void refreshCenter({quiet:true})});
setVersion();
})(globalThis);
