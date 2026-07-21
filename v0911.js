(function(root){
'use strict';

const VERSION='0.9.12';
const REQUEST_TIMEOUT_MS=12000;
const previousRender=root.render;

const shared={
  gameSessions:[],
  dailyResults:[],
  loading:false,
  loaded:false,
  error:'',
  lastFetch:0,
  lastUploadedLocalId:'',
};
root.MN_V0911_SHARED_STATS=shared;

function exposeState(){
  const definitions={
    ui:{get:()=>ui,set:value=>{ui=value}},
    app:{get:()=>app},
    profile:{get:()=>profile,set:value=>{profile=value}},
    settings:{get:()=>settings,set:value=>{settings=value}},
    currentSession:{get:()=>currentSession,set:value=>{currentSession=value}},
  };
  for(const[name,descriptor]of Object.entries(definitions)){
    try{Object.defineProperty(root,name,{configurable:true,enumerable:false,...descriptor})}
    catch(error){console.warn(`[Między Nami v0.9.12] Nie udało się udostępnić ${name}`,error)}
  }
}
exposeState();

function esc(value){
  return typeof root.escapeHtml==='function'?root.escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
}
function cloud(){return root.MN_CLOUD_RUNTIME||null}
function client(){return cloud()?.client||null}
function couple(){return cloud()?.couple||null}
function user(){return cloud()?.user||null}
function members(){return Array.isArray(cloud()?.members)?cloud().members:[]}
function paired(){return Boolean(client()&&couple()&&user()&&members().length===2)}
function timeout(promise,label='Synchronizacja statystyk'){
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error(`${label} timed out`)),REQUEST_TIMEOUT_MS)}),
  ]).finally(()=>clearTimeout(timer));
}
function friendly(error){
  const raw=String(error?.message||error||'Nieznany błąd');
  const lower=raw.toLowerCase();
  if(lower.includes('timeout')||lower.includes('timed out'))return'Połączenie trwało zbyt długo. Spróbuj ponownie.';
  if(lower.includes('fetch')||lower.includes('network')||lower.includes('load failed'))return'Nie udało się pobrać wspólnych statystyk. Sprawdź internet.';
  return raw;
}

function openLocalGame(id){
  ui.selectedMode=id;
  ui.view='info';
  root.render();
}
function openGame(id){
  exposeState();
  try{
    const openers={
      know:root.v094OpenKnow,
      who:root.v093OpenWho,
      dilemma:root.v097OpenDilemma,
      scale:root.v098OpenScale,
      spicy:root.showSpicyHub,
    };
    const opener=openers[id];
    if(typeof opener==='function')return opener();
    return openLocalGame(id);
  }catch(error){
    console.error('[Między Nami v0.9.12 game router]',error);
    try{return openLocalGame(id)}catch(fallbackError){
      console.error('[Między Nami v0.9.12 fallback]',fallbackError);
      root.toast?.('Nie udało się otworzyć gry. Zamknij aplikację i uruchom ją ponownie.');
    }
  }
}
root.openGameInfo=openGame;
root.v0910OpenGame=openGame;
root.v0911OpenGame=openGame;

function cleanupSpicyTiles(){
  if(ui?.view!=='v082-spicy-hub')return;
  const hub=document.querySelector('.v082-spicy-hub');
  if(!hub)return;
  hub.querySelectorAll('.v098-spicy-legend,.v0910-spicy-explainer').forEach(node=>node.remove());
  if(!hub.querySelector('.v0911-spicy-explainer')){
    hub.querySelector('.v082-safety-strip')?.insertAdjacentHTML('afterend','<div class="v0911-spicy-explainer"><strong>Wybierzcie sposób gry</strong><span><i class="online"></i> 1–2 telefony: każde odpowiada na swoim urządzeniu</span><span><i></i> 1 telefon: rozmowa albo zadania wykonywane razem</span></div>');
  }
  for(const tile of hub.querySelectorAll('.v082-game-tile')){
    const text=tile.textContent||'';
    const online=/Dopasowanie 18\+|Ochota na dziś/.test(text);
    tile.querySelectorAll(':scope > .v091-online-badge,:scope > .v092-online-badge,:scope > .v098-spicy-badge,:scope > .v0910-spicy-badge').forEach(node=>node.remove());
    const copy=tile.querySelector(':scope > div');
    if(!copy)continue;
    let pill=copy.querySelector('.v0911-spicy-mode');
    if(!pill){
      pill=document.createElement('span');
      pill.className='v0911-spicy-mode';
      const meta=copy.querySelector('small');
      if(meta)copy.insertBefore(pill,meta);else copy.appendChild(pill);
    }
    const nextClass=`v0911-spicy-mode ${online?'online':'local'}`;
    const nextLabel=online?'1–2 telefony':'1 telefon';
    if(pill.className!==nextClass)pill.className=nextClass;
    if(pill.textContent!==nextLabel)pill.textContent=nextLabel;
    const meta=copy.querySelector('small');
    if(meta){
      if(text.includes('Dopasowanie 18+')&&meta.textContent!=='8 pytań · wybór trybu')meta.textContent='8 pytań · wybór trybu';
      else if(text.includes('Ochota na dziś')&&meta.textContent!=='5 pytań · wybór trybu')meta.textContent='5 pytań · wybór trybu';
      else if(text.includes('Bez tabu')&&meta.textContent!=='rozmowa bez punktów')meta.textContent='rozmowa bez punktów';
      else if(text.includes('Tylko we dwoje')&&meta.textContent!=='zadania za wspólną zgodą')meta.textContent='zadania za wspólną zgodą';
    }
  }
}

function localKey(session){
  return String(session.cloudId||`${session.finishedAt||session.startedAt||0}-${session.mode||'mix'}-${session.rounds||session.results?.length||0}`);
}
function localRows(){
  return (profile.sessions||[]).map(session=>({
    key:localKey(session),
    mode:session.mode||'mix',
    rounds:Number(session.rounds||session.results?.length||0),
    matchRate:Number(session.matchRate||0),
    shared:Number(session.shared||0),
    categories:[...new Set(session.categories||session.results?.map(item=>item.category).filter(Boolean)||[])],
    finishedAt:Number(session.finishedAt||session.startedAt||Date.now()),
    source:'local',
  }));
}
function remoteRows(){
  return shared.gameSessions.map(session=>({
    key:String(session.client_session_id||session.id),
    mode:session.mode||'mix',
    rounds:Number(session.rounds||0),
    matchRate:Number(session.match_rate||0),
    shared:Number(session.shared_points||0),
    categories:Array.isArray(session.categories)?session.categories:[],
    finishedAt:new Date(session.finished_at||session.created_at||Date.now()).getTime(),
    source:'cloud',
  }));
}
function mergedRows(){
  const rows=new Map();
  for(const item of remoteRows())rows.set(item.key,item);
  for(const item of localRows())if(!rows.has(item.key))rows.set(item.key,item);
  return[...rows.values()].sort((a,b)=>b.finishedAt-a.finishedAt);
}
function aggregate(rows){
  const rounds=rows.reduce((sum,item)=>sum+item.rounds,0);
  const sharedPoints=rows.reduce((sum,item)=>sum+item.shared,0);
  const matchRate=rows.length?Math.round(rows.reduce((sum,item)=>sum+item.matchRate,0)/rows.length):0;
  return{sessions:rows.length,rounds,sharedPoints,matchRate};
}
function dailySummary(){
  const rows=[...shared.dailyResults].sort((a,b)=>String(b.quiz_date).localeCompare(String(a.quiz_date)));
  const recent=rows.slice(0,14);
  const average=recent.length?Math.round(recent.reduce((sum,item)=>sum+Number(item.score||0),0)/recent.length):0;
  return{rows,recent,average,last:rows[0]?.score??null};
}
function categoryMarkup(rows){
  const counts={};
  for(const row of rows)for(const category of row.categories||[])counts[category]=(counts[category]||0)+1;
  const entries=Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,8);
  if(!entries.length)return'<div class="empty">Statystyki tematów pojawią się po pierwszej wspólnej sesji.</div>';
  const max=Math.max(...entries.map(([,count])=>count),1);
  return`<div class="bar-list">${entries.map(([category,count])=>`<div class="bar-row"><span>${esc(CATEGORY_LABELS[category]||category)}</span><div><i style="width:${Math.round(count/max*100)}%"></i></div><b>${count}</b></div>`).join('')}</div>`;
}
function sessionsMarkup(rows){
  if(!rows.length)return'<div class="empty">Nie macie jeszcze ukończonej wspólnej sesji.</div>';
  return`<div class="list">${rows.slice(0,10).map(session=>`<div class="list-item"><div><strong>${esc(modeMeta(session.mode).title)}</strong><p>${esc(formatDate(session.finishedAt))} · ${session.rounds} kart · ${session.matchRate}% zgodności</p></div><span class="chip">${session.shared} wsp.</span></div>`).join('')}</div>`;
}

async function uploadLocalSessions(){
  if(!paired())return;
  const api=client();const pair=couple();const account=user();
  const payload=(profile.sessions||[]).slice(-100).map(session=>({
    couple_id:pair.id,
    client_session_id:localKey(session),
    uploaded_by:account.id,
    mode:session.mode||'mix',
    rounds:Number(session.rounds||session.results?.length||0),
    match_rate:Number(session.matchRate||0),
    shared_points:Number(session.shared||0),
    categories:[...new Set(session.categories||session.results?.map(item=>item.category).filter(Boolean)||[])],
    finished_at:new Date(session.finishedAt||session.startedAt||Date.now()).toISOString(),
    summary:{scores:session.scores||[],names:session.names||settings.names},
  }));
  if(!payload.length)return;
  const result=await timeout(api.from('game_sessions').upsert(payload,{onConflict:'couple_id,client_session_id'}),'Zapisywanie wyników gry');
  if(result.error)throw result.error;
}

async function refreshSharedStats({force=false,renderAfter=true}={}){
  if(!paired())return;
  if(shared.loading)return;
  if(!force&&shared.loaded&&Date.now()-shared.lastFetch<15000)return;
  shared.loading=true;shared.error='';
  if(renderAfter&&ui?.view==='stats')root.render();
  try{
    await uploadLocalSessions();
    const api=client();const pair=couple();
    const[games,daily]=await timeout(Promise.all([
      api.from('game_sessions').select('id,client_session_id,uploaded_by,mode,rounds,match_rate,shared_points,categories,finished_at,summary,created_at').eq('couple_id',pair.id).order('finished_at',{ascending:false}).limit(100),
      api.from('daily_results').select('id,quiz_date,category,score,details,question_ids,created_at').eq('couple_id',pair.id).order('quiz_date',{ascending:false}).limit(90),
    ]),'Pobieranie wspólnych statystyk');
    if(games.error)throw games.error;
    if(daily.error)throw daily.error;
    shared.gameSessions=games.data||[];
    shared.dailyResults=daily.data||[];
    const runtime=cloud();
    if(runtime&&Array.isArray(runtime.history))runtime.history=[...shared.dailyResults];
    shared.loaded=true;shared.lastFetch=Date.now();
  }catch(error){
    shared.error=friendly(error);
    console.error('[Między Nami v0.9.12 shared stats]',error);
  }finally{
    shared.loading=false;
    if(renderAfter&&['stats','home'].includes(ui?.view))root.render();
  }
}
function v0911RefreshStats(){void refreshSharedStats({force:true})}
root.v0911RefreshStats=v0911RefreshStats;

function enhanceStats(){
  if(ui?.view!=='stats'||!paired())return;
  const panel=document.querySelector('.panel.wide');
  if(!panel)return;
  const rows=mergedRows();
  const stats=aggregate(rows);
  const daily=dailySummary();
  const chip=panel.querySelector('.top-row .chip');
  if(chip)chip.textContent='Wspólne dane na obu telefonach';
  const description=panel.querySelector(':scope > p.muted');
  if(description)description.textContent='Codzienne Dopasowanie i zwykłe sesje są zapisane we wspólnej historii pary. Wynik gry na jednym telefonie pojawi się także u partnera.';
  const split=panel.querySelector('.stats-split');
  if(split){
    const dailyCard=split.querySelector('.daily-feature');
    if(dailyCard){
      dailyCard.setAttribute('onclick','showCloudHistory()');
      dailyCard.querySelector('small')?.replaceChildren(document.createTextNode('CODZIENNE DOPASOWANIE ONLINE · 14 DNI'));
      dailyCard.querySelector('strong')?.replaceChildren(document.createTextNode(daily.recent.length?`${daily.average}%`:'—'));
      dailyCard.querySelector('span')?.replaceChildren(document.createTextNode(`${daily.rows.length} ukończonych ${daily.rows.length===1?'dzień':'dni'} · wspólne na obu telefonach`));
      const action=dailyCard.querySelector('i');if(action)action.textContent='Otwórz historię online →';
    }
    const gameCard=[...split.querySelectorAll('.stats-feature')].find(node=>!node.classList.contains('daily-feature'));
    if(gameCard){
      gameCard.classList.add('v0911-shared-game-stats');
      gameCard.querySelector('small')?.replaceChildren(document.createTextNode('ZWYKŁE GRY · WSPÓLNA HISTORIA'));
      gameCard.querySelector('strong')?.replaceChildren(document.createTextNode(`${stats.matchRate}%`));
      gameCard.querySelector('span')?.replaceChildren(document.createTextNode(`${stats.sessions} ${stats.sessions===1?'sesja':'sesji'} · ${stats.rounds} kart · ${stats.sharedPoints} wspólnych punktów`));
    }
    let node=split.nextSibling;
    while(node){const next=node.nextSibling;node.remove();node=next}
    split.insertAdjacentHTML('afterend',`${shared.error?`<div class="v083-friendly-error v0911-stats-error"><span>!</span><div><strong>Nie udało się odświeżyć wspólnych statystyk</strong><p>${esc(shared.error)}</p></div><button onclick="v0911RefreshStats()">Spróbuj ponownie</button></div>`:''}<div class="v0911-stats-sync"><span>${shared.loading?'◌':'☁'}</span><div><strong>${shared.loading?'Synchronizujemy oba telefony…':'Statystyki pary są wspólne'}</strong><p>${shared.loaded?`Ostatnie odświeżenie: ${new Intl.DateTimeFormat('pl-PL',{hour:'2-digit',minute:'2-digit'}).format(new Date(shared.lastFetch))}.`:'Pobieramy historię zapisaną przez oba urządzenia.'}</p></div><button type="button" onclick="v0911RefreshStats()" ${shared.loading?'disabled':''}>Odśwież</button></div><h2>Najczęściej grane tematy</h2>${categoryMarkup(rows)}<h2>Ostatnie sesje gier</h2>${sessionsMarkup(rows)}`);
  }
  if(!shared.loading&&!shared.loaded)queueMicrotask(()=>void refreshSharedStats());
}

function enhanceHomeStats(){
  if(ui?.view!=='home'||!paired())return;
  const tile=[...document.querySelectorAll('.utility-app')].find(node=>node.querySelector('strong')?.textContent?.trim()==='Statystyki');
  if(tile&&shared.loaded){
    const rows=mergedRows();const daily=dailySummary();const small=tile.querySelector('small');
    if(small)small.textContent=`${rows.length} ${rows.length===1?'wspólna sesja':'wspólnych sesji'} · ${daily.rows.length} ${daily.rows.length===1?'test':'testów'}`;
  }
  if(!shared.loading&&!shared.loaded)queueMicrotask(()=>void refreshSharedStats({renderAfter:false}));
}

function syncFinishedLocalSession(){
  if(ui?.view!=='summary'||!paired())return;
  const sessions=profile.sessions||[];const latest=sessions[sessions.length-1];
  if(!latest||latest.id===shared.lastUploadedLocalId)return;
  shared.lastUploadedLocalId=latest.id;
  queueMicrotask(async()=>{
    try{
      await uploadLocalSessions();
      shared.loaded=false;
      await refreshSharedStats({force:true,renderAfter:false});
    }catch(error){console.warn('[Między Nami v0.9.12 session upload]',error)}
  });
}

root.render=function(){
  exposeState();
  previousRender();
  cleanupSpicyTiles();
  enhanceStats();
  enhanceHomeStats();
  syncFinishedLocalSession();
  document.documentElement.dataset.version=VERSION;
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>node.textContent=`v${VERSION}`);
};

window.addEventListener('online',()=>{if(paired())void refreshSharedStats({force:true,renderAfter:['stats','home'].includes(ui?.view)})});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&paired()&&['stats','home'].includes(ui?.view))void refreshSharedStats({force:true})});

root.render();
})(globalThis);
