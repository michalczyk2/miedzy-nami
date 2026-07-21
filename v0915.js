(function(root){
'use strict';

const VERSION=String(root.MN_RELEASE?.version||'0.9.15');
const core=root.MN_LIVE_MULTIPLAYER_CORE;
const base=root.MN_MULTIPLAYER_CORE;
const GAME_KEY='scale_live';
const QUESTION_COUNT=10;
const V2_PREFIX='scale-v2-';
const VIEW_LOBBY='v0915-scale-lobby';
const VIEW_ONLINE='v0915-scale-online';
const VIEW_LOCAL='v0915-scale-local';
const LOCAL_STORAGE_KEY='mn-scale-v2-local-v1';

const legacyOpenScale=root.v098OpenScale;
const legacyJoinSession=root.v098JoinSession;
const previousRender=root.render;
const previousOpenGameInfo=root.openGameInfo;
const store=core?.storage?.(GAME_KEY);

const SCALE_LABELS=Object.freeze({
  agreement:{name:'ZGODA',left:'Zupełnie się nie zgadzam',middle:'Trudno powiedzieć',right:'Zdecydowanie się zgadzam'},
  likelihood:{name:'PRAWDOPODOBIEŃSTWO',left:'Na pewno nie',middle:'Możliwe',right:'Na pewno tak'},
  frequency:{name:'CZĘSTOTLIWOŚĆ',left:'Nigdy',middle:'Czasami',right:'Bardzo często'},
  intensity:{name:'INTENSYWNOŚĆ',left:'Wcale',middle:'Średnio',right:'Bardzo'},
  comfort:{name:'KOMFORT',left:'Bardzo niekomfortowo',middle:'Neutralnie',right:'Bardzo komfortowo'},
});

const online={
  latest:null,session:null,state:null,index:null,pending:null,loading:false,error:'',
  subscription:null,pollTimer:null,refreshing:false,showSummary:false,
};

let local=loadLocalState();

function esc(value){return base?.esc?.(value)||String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function cards(){return Array.isArray(root.MN_SCALE_V2_CARDS)?root.MN_SCALE_V2_CARDS:[]}
function cardMap(){return new Map(cards().map(card=>[card.id,card]))}
function shuffled(items){return base?.shuffled?.(items)||[...(items||[])].sort(()=>Math.random()-.5)}
function ready(){return Boolean(core?.ready?.())}
function ownMember(){return core?.ownMember?.()||null}
function partnerMember(){return core?.partnerMember?.()||null}
function memberName(userId){return core?.memberName?.(userId)||'Osoba'}
function labels(card){return SCALE_LABELS[card?.scaleKind]||SCALE_LABELS.intensity}
function isV2Session(session){return Array.isArray(session?.question_ids)&&session.question_ids.length===QUESTION_COUNT&&session.question_ids.every(id=>String(id).startsWith(V2_PREFIX))}
function activeLatest(){return online.latest?.status==='active'?online.latest:null}
function displayAnswer(value){const number=Number(value);return Number.isFinite(number)?number+1:'—'}
function answerRows(){return Array.isArray(online.state?.answers)?online.state.answers:[]}
function rowAt(index=online.index){return answerRows().find(item=>Number(item.question_index)===Number(index))||null}
function currentOnlineCard(){const id=online.session?.question_ids?.[Number(online.index)||0];return cardMap().get(id)||null}
function revealedRows(){return answerRows().filter(item=>item.revealed)}
function difference(row){return Math.abs(Number(row?.own_answer)-Number(row?.partner_answer))}
function compatibility(row){return Math.max(0,100-difference(row)*25)}
function progress(){return Math.round(((Math.min(QUESTION_COUNT,Number(online.index||0)+1))/QUESTION_COUNT)*100)}
function resultMeta(diff){
  if(diff===0)return{title:'Bardzo podobnie',className:'result-success',text:'Wybraliście dokładnie ten sam poziom.'};
  if(diff===1)return{title:'Blisko siebie',className:'result-success',text:'Wasze odpowiedzi różnią się tylko o jeden poziom.'};
  if(diff===2)return{title:'Warto porozmawiać',className:'result-near',text:'Patrzycie na to trochę inaczej. Sprawdźcie, z czego wynika różnica.'};
  return{title:'Wyraźnie inaczej',className:'result-different',text:'Wasze odpowiedzi są odległe. To dobry punkt wyjścia do spokojnej rozmowy.'};
}
function setVersion(){
  document.documentElement.dataset.version=VERSION;
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>{node.textContent=`v${VERSION}`});
}
function setError(error){
  online.error=core?.friendlyError?.(error,'009_v098_live_scale_and_device_labels.sql')||String(error?.message||error||'Nieznany błąd');
  online.loading=false;
  online.refreshing=false;
  console.error('[Między Nami v0.9.15 Scale]',error);
  root.render();
}
function errorHtml(){return online.error?`<div class="v083-friendly-error"><span>!</span><div><strong>Nie udało się wykonać tej czynności</strong><p>${esc(online.error)}</p></div><button onclick="v0915Retry()">Spróbuj ponownie</button></div>`:''}
function loadingHtml(){return online.loading?'<div class="v091-loading"><i></i><span>Synchronizujemy dwa telefony…</span></div>':''}

function configuredNames(){
  try{
    if(typeof settings!=='undefined'&&Array.isArray(settings.names)&&settings.names.length===2)return[...settings.names];
  }catch{}
  return['Osoba 1','Osoba 2'];
}
function legacyLocalPending(){
  try{return Boolean(typeof currentSession!=='undefined'&&currentSession&&currentSession.mode==='scale'&&!currentSession.saved)}
  catch{return false}
}
function resumeLegacyLocal(){
  try{if(typeof resumeSession==='function'){resumeSession();return}}catch{}
  legacyOpenScale?.();
}
function genericLocalPending(){
  try{return Boolean(typeof currentSession!=='undefined'&&currentSession&&!currentSession.saved)}
  catch{return false}
}

function loadLocalState(){
  try{
    const parsed=JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY)||'null');
    if(parsed?.version===1&&Array.isArray(parsed.questionIds)&&Array.isArray(parsed.answers))return parsed;
  }catch{}
  return null;
}
function saveLocalState(){
  if(local)localStorage.setItem(LOCAL_STORAGE_KEY,JSON.stringify(local));
  else localStorage.removeItem(LOCAL_STORAGE_KEY);
}
function localCard(){
  const id=local?.questionIds?.[Number(local?.index)||0];
  return cardMap().get(id)||null;
}
function localRoleIndexes(){const first=(Number(local?.index)||0)%2;return[first,first===0?1:0]}
function localAnswerRow(){return local?.answers?.[Number(local?.index)||0]||null}
function localCompletedRows(){return(local?.answers||[]).filter(row=>!row.skipped&&Number.isInteger(row.first)&&Number.isInteger(row.second))}
function localDiff(row){return Math.abs(Number(row.first)-Number(row.second))}
function saveLocalStats(){
  if(!local||local.saved)return;
  const rows=localCompletedRows();
  const exact=rows.filter(row=>localDiff(row)===0).length;
  try{
    if(typeof profile!=='undefined'&&Array.isArray(profile.sessions)){
      profile.sessions.push({
        id:`scale-v2-${local.startedAt}`,
        mode:'scale',
        finishedAt:Date.now(),
        startedAt:local.startedAt,
        rounds:rows.length,
        scores:[0,0],
        shared:exact,
        matchRate:rows.length?Math.round(exact/rows.length*100):0,
        categories:local.questionIds.map(id=>cardMap().get(id)?.category).filter(Boolean),
      });
      profile.sessions=profile.sessions.slice(-100);
      if(typeof saveProfile==='function')saveProfile();
    }
  }catch(error){console.warn('[Między Nami v0.9.15 local stats]',error)}
  local.saved=true;saveLocalState();
}

function cleanupOnline(){
  if(online.subscription)core?.unsubscribe?.(online.subscription);
  online.subscription=null;
  if(online.pollTimer)clearInterval(online.pollTimer);
  online.pollTimer=null;
}
function subscribeOnline(sessionId){
  cleanupOnline();
  online.subscription=core?.subscribe?.('scale-v2',sessionId,()=>void refreshOnline({quiet:true}))||null;
  online.pollTimer=setInterval(()=>{
    if(root.ui?.view===VIEW_ONLINE&&document.visibilityState==='visible'&&navigator.onLine!==false)void refreshOnline({quiet:true});
  },3000);
}
async function refreshLobby({quiet=false}={}){
  if(!ready()){online.latest=null;if(!quiet)root.render();return}
  if(!quiet){online.loading=true;online.error='';root.render()}
  try{
    online.latest=await core.fetchLatestSession(GAME_KEY);
    online.loading=false;
    if(root.ui?.view===VIEW_LOBBY||!quiet)root.render();
  }catch(error){if(!quiet)setError(error);else console.warn('[Między Nami v0.9.15 lobby]',error)}
}
async function refreshOnline({quiet=false}={}){
  if(online.refreshing||!online.session?.id)return;
  online.refreshing=true;
  if(!quiet){online.loading=true;online.error='';root.render()}
  try{
    const state=await core.getState(online.session.id);
    if(!isV2Session(state.session)){online.refreshing=false;cleanupOnline();legacyJoinSession?.(state.session.id);return}
    online.state=state;online.session=state.session;online.latest=state.session;
    if(online.index===null)online.index=Math.min(QUESTION_COUNT-1,store?.getIndex?.(state.session.id)||0);
    online.loading=false;online.refreshing=false;
    if(root.ui?.view===VIEW_ONLINE)root.render();
  }catch(error){online.refreshing=false;if(!quiet)setError(error);else console.warn('[Między Nami v0.9.15 state]',error)}
}
async function openOnlineState(state,{showSummary=false}={}){
  cleanupOnline();
  online.state=state;
  online.session=state.session;
  online.latest=state.session;
  online.pending=null;
  online.showSummary=Boolean(showSummary);
  const stored=Math.min(QUESTION_COUNT-1,store?.getIndex?.(state.session.id)||0);
  const unresolved=state.answers?.findIndex(item=>!item.revealed);
  const fallback=unresolved>=0?unresolved:QUESTION_COUNT-1;
  online.index=Math.max(0,Math.min(QUESTION_COUNT-1,stored||fallback));
  store?.setSession?.(state.session.id);
  store?.setIndex?.(state.session.id,online.index);
  online.loading=false;
  root.ui.view=VIEW_ONLINE;
  subscribeOnline(state.session.id);
  root.render();
}
async function v0915JoinSession(sessionId){
  if(!sessionId)return;
  online.loading=true;online.error='';
  try{
    const state=await core.getState(sessionId);
    if(!isV2Session(state.session)){online.loading=false;cleanupOnline();legacyJoinSession?.(sessionId);return}
    await openOnlineState(state,{showSummary:state.session.status==='completed'});
  }catch(error){setError(error)}
}
async function v0915StartOnline(){
  if(!ready()){v0915OpenScale();return}
  online.loading=true;online.error='';root.render();
  try{
    const latest=await core.fetchLatestSession(GAME_KEY);
    online.latest=latest;
    if(latest?.status==='active'){
      online.loading=false;
      if(isV2Session(latest)){await v0915JoinSession(latest.id);return}
      legacyJoinSession?.(latest.id);return;
    }
    if(cards().length<QUESTION_COUNT)throw new Error('Brakuje pytań prototypu Skali 1–5.');
    const ids=shuffled(cards()).slice(0,QUESTION_COUNT).map(card=>card.id);
    const session=await core.createSession(GAME_KEY,ids);
    const state=await core.getState(session.id);
    await openOnlineState(state);
  }catch(error){setError(error)}
}
function v0915ChooseOnline(answer){
  if(online.loading||!online.session?.id)return;
  online.pending=Math.max(0,Math.min(4,Number(answer)));
  root.render();
}
async function v0915ConfirmOnline(){
  if(online.loading||!online.session?.id||online.pending===null)return;
  const index=Number(online.index)||0;
  const answer=Number(online.pending);
  online.loading=true;online.error='';root.render();
  try{
    const state=await core.submitAnswer(online.session.id,index,answer);
    online.state=state;online.session=state.session;online.latest=state.session;
    online.pending=null;online.loading=false;
    store?.setIndex?.(online.session.id,index);
    root.render();
  }catch(error){setError(error)}
}
function v0915NextOnline(){
  if(Number(online.index)>=QUESTION_COUNT-1){online.showSummary=true;root.render();return}
  online.index=Number(online.index)+1;
  online.pending=null;
  store?.setIndex?.(online.session.id,online.index);
  root.render();
}
function v0915ShowOnlineSummary(){online.showSummary=true;root.render()}
async function v0915CancelOnline(){
  const sessionId=online.session?.id||online.latest?.id;
  if(!sessionId)return;
  if(!root.confirm('Usunąć tę sesję Skali z obu telefonów?'))return;
  online.loading=true;root.render();
  try{
    await core.cancelSession(sessionId);
    cleanupOnline();
    store?.setSession?.('');
    store?.clearIndex?.(sessionId);
    Object.assign(online,{latest:null,session:null,state:null,index:null,pending:null,loading:false,error:'',showSummary:false});
    root.ui.view=VIEW_LOBBY;
    root.render();
  }catch(error){setError(error)}
}
function v0915BackLobby(){
  cleanupOnline();
  online.session=null;online.state=null;online.index=null;online.pending=null;online.showSummary=false;
  root.ui.view=VIEW_LOBBY;root.render();void refreshLobby({quiet:true});
}
function v0915BackHome(){cleanupOnline();root.ui.view='home';root.render()}
function v0915Retry(){online.error='';if(root.ui?.view===VIEW_ONLINE&&online.session?.id)void refreshOnline();else void refreshLobby()}

function v0915StartLocal(){
  if(cards().length<QUESTION_COUNT){root.toast?.('Brakuje pytań prototypu Skali 1–5.');return}
  local={
    version:1,
    id:`scale-v2-local-${Date.now()}`,
    questionIds:shuffled(cards()).slice(0,QUESTION_COUNT).map(card=>card.id),
    index:0,
    phase:'first',
    pending:null,
    answers:Array.from({length:QUESTION_COUNT},()=>({first:null,second:null,skipped:false})),
    names:configuredNames(),
    startedAt:Date.now(),
    saved:false,
  };
  saveLocalState();
  root.ui.view=VIEW_LOCAL;
  root.render();
}
function v0915ResumeLocal(){if(!local)return;root.ui.view=VIEW_LOCAL;root.render()}
function v0915LocalChoose(answer){if(!local||local.phase==='handoff'||local.phase==='reveal'||local.phase==='summary')return;local.pending=Math.max(0,Math.min(4,Number(answer)));saveLocalState();root.render()}
function v0915LocalConfirm(){
  if(!local||local.pending===null)return;
  const row=localAnswerRow();if(!row)return;
  if(local.phase==='first'){row.first=Number(local.pending);local.pending=null;local.phase='handoff'}
  else if(local.phase==='second'){row.second=Number(local.pending);local.pending=null;local.phase='reveal'}
  saveLocalState();root.render();
}
function v0915LocalAccept(){if(!local||local.phase!=='handoff')return;local.phase='second';local.pending=null;saveLocalState();root.render()}
function v0915LocalNext(){
  if(!local)return;
  if(Number(local.index)>=QUESTION_COUNT-1){local.phase='summary';saveLocalStats();saveLocalState();root.render();return}
  local.index=Number(local.index)+1;local.phase='first';local.pending=null;saveLocalState();root.render();
}
function v0915LocalSkip(){
  if(!local||!root.confirm('Pominąć to pytanie? Odpowiedzi z tej rundy nie zostaną zapisane.'))return;
  const row=localAnswerRow();if(row){row.first=null;row.second=null;row.skipped=true}
  v0915LocalNext();
}
function v0915LocalBackLobby(){if(local)saveLocalState();root.ui.view=VIEW_LOBBY;root.render()}
function v0915LocalCancel(){
  if(!local||!root.confirm('Zakończyć i usunąć lokalną sesję Skali?'))return;
  local=null;saveLocalState();root.ui.view=VIEW_LOBBY;root.render();
}
function v0915LocalNew(){local=null;saveLocalState();v0915StartLocal()}

function scaleAnchors(card){
  const meta=labels(card);
  return`<div class="v0915-scale-anchors"><span><b>1</b><small>${esc(meta.left)}</small></span><span><b>3</b><small>${esc(meta.middle)}</small></span><span><b>5</b><small>${esc(meta.right)}</small></span></div>`;
}
function numberButtons(selected,handler,disabled=false){
  return`<div class="v0915-number-grid">${Array.from({length:5},(_,index)=>`<button type="button" class="${selected===index?'selected':''}" onclick="${handler}(${index})" aria-pressed="${selected===index}" ${disabled?'disabled':''}><strong>${index+1}</strong><i>${selected===index?'✓':''}</i></button>`).join('')}</div>`;
}
function pairHtml(){
  if(ready())return`<div class="v091-pair-ready"><span>✓</span><div><strong>${esc(ownMember()?.display_name||'Ty')} + ${esc(partnerMember()?.display_name||'Partner')}</strong><small>Każde odpowiada prywatnie na swoim telefonie.</small></div></div>`;
  return`<div class="v091-pair-needed"><span>2</span><div><strong>Połączcie dwa konta</strong><small>Tryb jednego telefonu działa od razu. Online wymaga połączonej pary.</small></div><button class="button secondary" onclick="${typeof root.v08OpenAccount==='function'?'v08OpenAccount()':'showCloudHub()'}">Konto i synchronizacja</button></div>`;
}
function renderLobby(){
  const latest=online.latest;
  const active=latest?.status==='active'?latest:null;
  const activeV2=active&&isV2Session(active);
  const activeLegacy=active&&!activeV2;
  const recent=latest?.status==='completed'?latest:null;
  const localActive=local&&local.phase!=='summary';
  const oldLocal=legacyLocalPending();
  root.app.innerHTML=`<section class="panel wide v0915-scale-lobby">
    <div class="top-row"><button class="back-button" onclick="v0915BackHome()">← Wszystkie gry</button><span class="chip ${ready()?'connected-chip':''}">${ready()?'● jeden lub dwa telefony':'działa także bez konta'}</span></div>
    <div class="v0915-scale-hero"><span>5</span><div><small>NOWA SKALA 1–5 · PROTOTYP</small><h1>Szybko porównajcie odpowiedzi</h1><p>Oboje wybieracie poziom od 1 do 5. Bez wpisywania tekstu i bez zgadywania tajnej liczby.</p></div></div>
    ${errorHtml()}${loadingHtml()}${pairHtml()}
    ${activeLegacy?`<button class="v0915-compat-card" onclick="v0915JoinSession('${esc(activeLegacy.id)}')"><span>10</span><div><small>ZGODNOŚĆ ZE STARĄ WERSJĄ</small><strong>Dokończcie rozpoczętą Skalę 1–10</strong><p>Stara sesja zachowuje dotychczasowe zasady i wyniki.</p></div><i>Kontynuuj →</i></button>`:''}
    ${activeV2?`<button class="v0915-resume-card" onclick="v0915JoinSession('${esc(activeV2.id)}')"><span>▶</span><div><small>AKTYWNA ONLINE</small><strong>Kontynuujcie Skalę 1–5</strong><p>Rundę rozpoczęła osoba: ${esc(memberName(activeV2.created_by))}</p></div><i>Otwórz →</i></button>`:''}
    ${recent&&!active?`<button class="v0915-resume-card completed" onclick="v0915JoinSession('${esc(recent.id)}')"><span>✓</span><div><small>OSTATNI WYNIK</small><strong>${isV2Session(recent)?'Podsumowanie Skali 1–5':'Podsumowanie klasycznej Skali 1–10'}</strong><p>Otwórzcie ostatnie wspólne porównanie.</p></div><i>Wynik →</i></button>`:''}
    <div class="v091-mode-grid v0915-mode-grid">
      <article class="v091-mode-card online">
        <span>📱📱</span><small>TRYB ONLINE</small><h2>Dwa telefony</h2>
        <p>Każde wybiera prywatnie. Odpowiedzi odsłaniają się dopiero, gdy oboje zatwierdzicie.</p>
        <button class="button primary full" onclick="v0915StartOnline()" ${ready()&&!active?'':'disabled'}>${active?'Najpierw dokończcie grę':'Rozpocznij 10 pytań'}</button>
      </article>
      <article class="v091-mode-card local">
        <span>▣</span><small>TRYB LOKALNY</small><h2>Jeden telefon</h2>
        <p>Odpowiadacie po kolei, przekazując sobie urządzenie. Pierwszy wybór pozostaje ukryty.</p>
        ${oldLocal?'<button class="button secondary full" onclick="resumeLegacyLocal()">Dokończ Skalę 1–10</button>':localActive?'<button class="button secondary full" onclick="v0915ResumeLocal()">Kontynuuj Skalę 1–5</button>':'<button class="button secondary full" onclick="v0915StartLocal()">Graj na jednym telefonie</button>'}
      </article>
    </div>
    <div class="v093-live-rules v0915-rules">
      <article><span>1</span><div><strong>Tylko pięć poziomów</strong><small>Szybszy wybór bez pozornej precyzji skali 1–10.</small></div></article>
      <article><span>2</span><div><strong>Różne rodzaje pytań</strong><small>Zgoda, częstotliwość, komfort, intensywność i prawdopodobieństwo.</small></div></article>
      <article><span>3</span><div><strong>Najpierw test jakości</strong><small>20 pytań prototypowych. Bibliotekę zwiększymy dopiero po wspólnym teście.</small></div></article>
    </div>
    ${genericLocalPending()&&!oldLocal?'<p class="v0915-note">Masz też niedokończoną sesję innej gry lokalnej. Nadal możesz wrócić do niej z pulpitu.</p>':''}
  </section>`;
  setVersion();
}
function renderOnlineAnswer(row,card){
  const selected=online.pending;
  const meta=labels(card);
  root.app.innerHTML=`<section class="panel v093-live-game v0915-scale-game">
    <div class="top-row"><button class="back-button" onclick="v0915BackLobby()">← Skala</button><span class="chip connected-chip">● na żywo · ${Number(online.index)+1}/${QUESTION_COUNT}</span></div>
    ${errorHtml()}${loadingHtml()}
    <div class="v093-live-head"><div><small>${esc(ownMember()?.display_name||'Ty')} · odpowiedz bez konsultowania</small><h1>Wybierz poziom</h1></div><span>${row?.partner_done?'✓':'…'}</span></div>
    <div class="v082-progress"><i style="width:${progress()}%"></i></div>
    <article class="v093-live-card v0915-question-card">
      <small>${esc(meta.name)} · PYTANIE ${Number(online.index)+1}</small><h2>${esc(card.prompt)}</h2>
      ${scaleAnchors(card)}
      ${numberButtons(selected,'v0915ChooseOnline',online.loading)}
      <div class="v0915-selected">${selected===null?'Wybierz wartość od 1 do 5':`Twój wybór: <strong>${selected+1}</strong>`}</div>
      <button class="button primary full" onclick="v0915ConfirmOnline()" ${selected===null||online.loading?'disabled':''}>Zatwierdź odpowiedź</button>
    </article>
    <div class="v093-partner-signal ${row?.partner_done?'done':''}"><span>${row?.partner_done?'✓':'🔒'}</span><p>${row?.partner_done?`${esc(partnerMember()?.display_name||'Druga osoba')} już odpowiedziała. Zatwierdź swój wybór, aby odsłonić wynik.`:`Odpowiedź ${esc(partnerMember()?.display_name||'drugiej osoby')} pozostaje ukryta.`}</p></div>
  </section>`;
}
function renderOnlineWaiting(row,card){
  root.app.innerHTML=`<section class="panel v093-live-game">
    <div class="top-row"><button class="back-button" onclick="v0915BackLobby()">← Skala</button><span class="chip connected-chip">● odpowiedź zapisana</span></div>
    ${errorHtml()}${loadingHtml()}
    <div class="v091-waiting v093-card-waiting"><span class="v091-wait-icon">✓</span><small>PYTANIE ${Number(online.index)+1}/${QUESTION_COUNT}</small><h1>Czekamy na drugą odpowiedź</h1><p>${esc(card.prompt)}</p>
      <div class="v091-wait-status"><div class="done"><span>✓</span><strong>${esc(ownMember()?.display_name||'Ty')}</strong><small>${displayAnswer(row.own_answer)}/5</small></div><div class="pending"><span>…</span><strong>${esc(partnerMember()?.display_name||'Druga osoba')}</strong><small>odpowiedź ukryta</small></div></div>
      <button class="button primary full" onclick="v0915Retry()">Sprawdź ponownie</button><button class="button tertiary full" onclick="v0915BackLobby()">Wróć — gra poczeka</button>
    </div>
  </section>`;
}
function renderOnlineReveal(row,card){
  const diff=difference(row);const meta=resultMeta(diff);const last=Number(online.index)>=QUESTION_COUNT-1;const completed=online.session?.status==='completed';
  root.app.innerHTML=`<section class="panel v093-live-game v093-reveal v0915-reveal">
    <div class="top-row"><button class="back-button" onclick="v0915BackLobby()">← Skala</button><span class="chip connected-chip">● wspólne odsłonięcie</span></div>
    <div class="${meta.className}"><div class="result-title">${meta.title}</div></div>
    <article class="v093-live-card v0915-question-card revealed"><small>PYTANIE ${Number(online.index)+1}</small><h2>${esc(card.prompt)}</h2>
      <div class="v0915-reveal-values"><div><span>${esc(ownMember()?.display_name||'Ty')}</span><strong>${displayAnswer(row.own_answer)}</strong><small>/5</small></div><i>różnica <b>${diff}</b></i><div><span>${esc(partnerMember()?.display_name||'Druga osoba')}</span><strong>${displayAnswer(row.partner_answer)}</strong><small>/5</small></div></div>
      ${scaleAnchors(card)}<p>${meta.text}</p>
    </article>
    <button class="button primary full" onclick="${last&&completed?'v0915ShowOnlineSummary()':'v0915NextOnline()'}">${last&&completed?'Zobacz podsumowanie':'Następne pytanie →'}</button>
  </section>`;
}
function renderOnlineSummary(){
  const rows=revealedRows();const map=cardMap();const ids=online.session?.question_ids||[];
  const exact=rows.filter(row=>difference(row)===0).length;
  const close=rows.filter(row=>difference(row)<=1).length;
  const average=rows.length?rows.reduce((sum,row)=>sum+difference(row),0)/rows.length:0;
  const score=Math.round(rows.reduce((sum,row)=>sum+compatibility(row),0)/Math.max(1,rows.length));
  const title=score>=85?'Bardzo podobnie patrzycie na te tematy':score>=65?'Najczęściej jesteście blisko':score>=40?'Macie kilka ważnych różnic':'Wasze odpowiedzi często się różnią';
  root.app.innerHTML=`<section class="panel wide v091-online-summary v093-summary v0915-summary">
    <div class="top-row"><button class="back-button" onclick="v0915BackHome()">← Wszystkie gry</button><span class="chip connected-chip">● ukończona gra</span></div>
    <div class="v082-result-hero"><div class="v082-result-ring" style="--score:${score}"><strong>${score}%</strong><small>podobieństwa</small></div><div><span class="eyebrow">SKALA 1–5 · ONLINE</span><h1>${title}</h1><p>Identyczna odpowiedź pojawiła się ${exact} razy. W ${close} z ${rows.length} pytań różnica nie przekroczyła jednego poziomu. Średnia różnica: ${average.toFixed(1)}.</p></div></div>
    <div class="v082-result-list v093-result-list">${rows.map(row=>{const card=map.get(ids[Number(row.question_index)]);const diff=difference(row);return`<article class="${diff<=1?'same':'different'}"><div><small>${Number(row.question_index)+1}</small><h3>${esc(card?.prompt||'Pytanie')}</h3></div><div class="v082-result-answers"><span><b>${esc(ownMember()?.display_name||'Ty')}</b>${displayAnswer(row.own_answer)}/5</span><span><b>${esc(partnerMember()?.display_name||'Druga osoba')}</b>${displayAnswer(row.partner_answer)}/5</span></div><em>Różnica: ${diff}</em></article>`}).join('')}</div>
    <div class="v091-summary-actions"><button class="button primary" onclick="v0915StartOnline()">Nowa gra</button><button class="button secondary" onclick="v0915BackHome()">Wszystkie gry</button><button class="button tertiary" onclick="v0915CancelOnline()">Usuń wynik z chmury</button></div>
    <p class="v091-private-summary">Szczegółowe odpowiedzi pozostają w tej tymczasowej sesji. Nowa gra zastępuje poprzedni wynik Skali.</p>
  </section>`;
}
function renderOnline(){
  if(online.loading&&!online.state){root.app.innerHTML=`<section class="panel">${loadingHtml()}</section>`;return}
  if(!online.session||!online.state){renderLobby();return}
  if(online.session.status==='completed'&&online.showSummary){renderOnlineSummary();return}
  const row=rowAt();const card=currentOnlineCard();
  if(!row||!card){root.app.innerHTML='<section class="panel"><h1>Nie znaleziono pytania Skali</h1><button class="button primary" onclick="v0915Retry()">Odśwież grę</button></section>';return}
  if(row.revealed){renderOnlineReveal(row,card);return}
  if(row.own_done){renderOnlineWaiting(row,card);return}
  renderOnlineAnswer(row,card);
}
function renderLocal(){
  if(!local||local.phase==='summary'){renderLocalSummary();return}
  const card=localCard();const row=localAnswerRow();const[first,second]=localRoleIndexes();const meta=labels(card);
  if(!card||!row){local=null;saveLocalState();renderLobby();return}
  if(local.phase==='handoff'){
    root.app.innerHTML=`<section class="panel v0915-local"><div class="top-row"><button class="back-button" onclick="v0915LocalBackLobby()">← Skala</button><span class="chip">${Number(local.index)+1}/${QUESTION_COUNT}</span></div><div class="handoff"><div class="handoff-icon">📱</div><h2>Przekaż telefon</h2><p class="muted">Teraz odpowiada <strong>${esc(local.names[second])}</strong>. Pierwsza odpowiedź jest ukryta.</p><button class="button primary" onclick="v0915LocalAccept()">Mam telefon</button></div></section>`;
    return;
  }
  if(local.phase==='reveal'){
    const diff=localDiff(row);const result=resultMeta(diff);
    root.app.innerHTML=`<section class="panel v0915-local"><div class="top-row"><button class="back-button" onclick="v0915LocalBackLobby()">← Skala</button><span class="chip">${Number(local.index)+1}/${QUESTION_COUNT}</span></div><div class="${result.className}"><div class="result-title">${result.title}</div></div><article class="v093-live-card v0915-question-card revealed"><small>${esc(meta.name)}</small><h2>${esc(card.prompt)}</h2><div class="v0915-reveal-values"><div><span>${esc(local.names[first])}</span><strong>${Number(row.first)+1}</strong><small>/5</small></div><i>różnica <b>${diff}</b></i><div><span>${esc(local.names[second])}</span><strong>${Number(row.second)+1}</strong><small>/5</small></div></div>${scaleAnchors(card)}<p>${result.text}</p></article><button class="button primary full" onclick="v0915LocalNext()">${Number(local.index)>=QUESTION_COUNT-1?'Zobacz podsumowanie':'Następne pytanie →'}</button></section>`;
    return;
  }
  const answering=local.phase==='first'?first:second;
  root.app.innerHTML=`<section class="panel v0915-local"><div class="top-row"><button class="back-button" onclick="v0915LocalBackLobby()">← Skala</button><span class="chip">${Number(local.index)+1}/${QUESTION_COUNT}</span></div><div class="v093-live-head"><div><small>${esc(local.names[answering])} · odpowiedz samodzielnie</small><h1>Wybierz poziom</h1></div><span>…</span></div><div class="v082-progress"><i style="width:${((Number(local.index)+1)/QUESTION_COUNT)*100}%"></i></div><article class="v093-live-card v0915-question-card"><small>${esc(meta.name)} · PYTANIE ${Number(local.index)+1}</small><h2>${esc(card.prompt)}</h2>${scaleAnchors(card)}${numberButtons(local.pending,'v0915LocalChoose')}<div class="v0915-selected">${local.pending===null?'Wybierz wartość od 1 do 5':`Twój wybór: <strong>${Number(local.pending)+1}</strong>`}</div><button class="button primary full" onclick="v0915LocalConfirm()" ${local.pending===null?'disabled':''}>${local.phase==='first'?'Zatwierdź i przekaż telefon':'Zatwierdź i odsłoń wynik'}</button></article><button class="text-button v0915-skip" onclick="v0915LocalSkip()">Pomiń pytanie</button></section>`;
}
function renderLocalSummary(){
  if(!local){renderLobby();return}
  saveLocalStats();
  const rows=localCompletedRows();const exact=rows.filter(row=>localDiff(row)===0).length;const close=rows.filter(row=>localDiff(row)<=1).length;const average=rows.length?rows.reduce((sum,row)=>sum+localDiff(row),0)/rows.length:0;
  root.app.innerHTML=`<section class="panel wide v0915-summary"><div class="top-row"><button class="back-button" onclick="v0915BackHome()">← Wszystkie gry</button><span class="chip">▣ jeden telefon</span></div><div class="v082-result-hero"><div class="v082-result-ring" style="--score:${rows.length?Math.round(rows.reduce((sum,row)=>sum+Math.max(0,100-localDiff(row)*25),0)/rows.length):0}"><strong>${exact}/${rows.length}</strong><small>identycznych</small></div><div><span class="eyebrow">SKALA 1–5 · LOKALNIE</span><h1>Porównaliście swoje odpowiedzi</h1><p>W ${close} z ${rows.length} ukończonych pytań różnica nie przekroczyła jednego poziomu. Średnia różnica: ${average.toFixed(1)}.</p></div></div><div class="button-row"><button class="button primary" onclick="v0915LocalNew()">Nowa gra</button><button class="button secondary" onclick="v0915BackHome()">Wróć na pulpit</button><button class="button tertiary" onclick="v0915LocalCancel()">Usuń lokalny wynik</button></div></section>`;
}
function patchRenderedUi(){
  if(root.ui?.view==='home'){
    document.querySelectorAll('.desktop-app').forEach(tile=>{
      if(tile.querySelector('.desktop-app-name')?.textContent?.trim()!=='Skala')return;
      const strong=tile.querySelector('.desktop-app-icon strong');if(strong)strong.textContent='5';
      const mini=tile.querySelector('.desktop-app-mini');if(mini)mini.textContent='1–5';
      const count=tile.querySelector(':scope > small');if(count)count.textContent='20 pytań testowych';
    });
  }
  document.querySelectorAll('.v099-center strong').forEach(node=>{if(node.textContent?.trim()==='Skala 1–10')node.textContent='Skala 1–5'});
}
function v0915OpenScale(){
  cleanupOnline();
  online.session=null;online.state=null;online.index=null;online.pending=null;online.error='';online.showSummary=false;
  root.ui.view=VIEW_LOBBY;root.ui.modal=null;root.render();void refreshLobby({quiet:true});
}

root.render=function(){
  if(root.ui?.view===VIEW_LOBBY){renderLobby();window.scrollTo({top:0,behavior:'smooth'});return}
  if(root.ui?.view===VIEW_ONLINE){renderOnline();setVersion();window.scrollTo({top:0,behavior:'smooth'});return}
  if(root.ui?.view===VIEW_LOCAL){renderLocal();setVersion();window.scrollTo({top:0,behavior:'smooth'});return}
  previousRender();patchRenderedUi();setVersion();
};
root.openGameInfo=function(id){return id==='scale'?v0915OpenScale():previousOpenGameInfo?.(id)};

Object.assign(root,{
  v098OpenScale:v0915OpenScale,
  v098JoinSession:v0915JoinSession,
  v098StartOnlineScale:v0915StartOnline,
  v098StartLocalScale:v0915StartLocal,
  v0915OpenScale,v0915JoinSession,v0915StartOnline,v0915ChooseOnline,v0915ConfirmOnline,
  v0915NextOnline,v0915ShowOnlineSummary,v0915CancelOnline,v0915BackLobby,v0915BackHome,v0915Retry,
  v0915StartLocal,v0915ResumeLocal,v0915LocalChoose,v0915LocalConfirm,v0915LocalAccept,
  v0915LocalNext,v0915LocalSkip,v0915LocalBackLobby,v0915LocalCancel,v0915LocalNew,
  resumeLegacyLocal,
});

window.addEventListener('online',()=>{if(root.ui?.view===VIEW_ONLINE)void refreshOnline({quiet:true});if(root.ui?.view===VIEW_LOBBY)void refreshLobby({quiet:true})});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')return;if(root.ui?.view===VIEW_ONLINE)void refreshOnline({quiet:true});if(root.ui?.view===VIEW_LOBBY)void refreshLobby({quiet:true})});
setVersion();
})(globalThis);
