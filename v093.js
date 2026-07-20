(function(root){
'use strict';

const RELEASE=root.MN_RELEASE||{version:'0.9.3'};
const VERSION=String(RELEASE.version||'0.9.3');
const core=root.MN_LIVE_MULTIPLAYER_CORE;
const base=root.MN_MULTIPLAYER_CORE;
const GAME_KEY='who_live';
const QUESTION_COUNT=10;
const VIEW_LOBBY='v093-who-lobby';
const VIEW_GAME='v093-who-live';
const store=core?.storage?.(GAME_KEY);
const previousRender=root.render;
const previousOpenGameInfo=root.openGameInfo;

const live={
  session:null,
  state:null,
  activeSession:null,
  latestSession:null,
  viewIndex:null,
  loading:false,
  error:'',
  subscription:null,
  pollTimer:null,
  refreshing:false,
  homeChecking:false,
  homeCheckedAt:0,
  showSummary:false,
};

root.MN_V093_LIVE_WHO=live;

function esc(value){return base?.esc?.(value)||String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function ready(){return Boolean(core?.ready?.())}
function currentUser(){return core?.currentUser?.()||null}
function ownMember(){return core?.ownMember?.()||null}
function partnerMember(){return core?.partnerMember?.()||null}
function members(){return core?.orderedMembers?.()||[]}
function memberName(userId){return core?.memberName?.(userId)||'Osoba'}
function setVersion(){base?.setVersion?.();document.documentElement.dataset.version=VERSION}
function setError(error){live.error=core?.friendlyError?.(error)||String(error?.message||error||'Nieznany błąd');live.loading=false;console.error('[Między Nami v0.9.3]',error);root.render()}
function clearError(){live.error=''}
function errorHtml(){return live.error?`<div class="v083-friendly-error"><span>!</span><div><strong>Nie udało się wykonać tej czynności</strong><p>${esc(live.error)}</p></div><button onclick="v093Retry()">Spróbuj ponownie</button></div>`:''}
function loadingHtml(){return live.loading?'<div class="v091-loading"><i></i><span>Synchronizujemy dwa telefony…</span></div>':''}
function creatorName(session){return memberName(session?.created_by)}

function allCards(){
  try{
    if(typeof root.getAllCards==='function')return root.getAllCards();
    if(typeof getAllCards==='function')return getAllCards();
  }catch{}
  return[];
}
function whoQuestions(){return allCards().filter(card=>card?.mode==='who'&&card?.type==='choice'&&card?.id&&card?.prompt)}
function questionMap(){return new Map(whoQuestions().map(card=>[card.id,card]))}
function shuffled(items){return base?.shuffled?.(items)||[...(items||[])].sort(()=>Math.random()-.5)}
function optionLabels(){
  const ordered=members();
  return[ordered[0]?.display_name||'Osoba 1',ordered[1]?.display_name||'Osoba 2','Oboje'];
}
function optionLabel(index){return optionLabels()[Number(index)]||'—'}
function answerRows(){return Array.isArray(live.state?.answers)?live.state.answers:[]}
function rowAt(index=live.viewIndex){return answerRows().find(item=>Number(item.question_index)===Number(index))||null}
function currentQuestion(){
  const id=live.session?.question_ids?.[Number(live.viewIndex)||0];
  return questionMap().get(id)||null;
}
function revealedRows(){return answerRows().filter(item=>item.revealed)}
function matchCount(){return revealedRows().filter(item=>Number(item.own_answer)===Number(item.partner_answer)).length}
function progressPercent(){return Math.round((Math.min(QUESTION_COUNT,Number(live.viewIndex||0)+1)/QUESTION_COUNT)*100)}

function cleanupSubscription(){core?.unsubscribe?.(live.subscription);live.subscription=null}
function stopPolling(){if(live.pollTimer)clearInterval(live.pollTimer);live.pollTimer=null}
function startPolling(){
  stopPolling();
  live.pollTimer=setInterval(()=>{
    if(root.ui?.view===VIEW_GAME&&document.visibilityState==='visible'&&navigator.onLine!==false)void refreshState({quiet:true});
  },3000);
}
function subscribe(sessionId){
  cleanupSubscription();
  live.subscription=core?.subscribe?.('who',sessionId,()=>void refreshState({quiet:true}))||null;
  startPolling();
}

async function refreshLobby({quiet=false}={}){
  if(!ready()){
    live.activeSession=null;live.latestSession=null;live.homeCheckedAt=Date.now();
    if(!quiet)root.render();
    return;
  }
  if(!quiet){live.loading=true;clearError();root.render()}
  try{
    const latest=await core.fetchLatestSession(GAME_KEY);
    live.latestSession=latest;
    live.activeSession=latest?.status==='active'?latest:null;
    live.homeCheckedAt=Date.now();
    live.loading=false;
    if(root.ui?.view===VIEW_LOBBY||!quiet)root.render();
    else if(root.ui?.view==='home')enhanceHome();
  }catch(error){
    live.homeCheckedAt=Date.now();
    if(!quiet)setError(error);
    else console.warn('[Między Nami v0.9.3 lobby]',error);
  }
}

async function refreshState({quiet=false}={}){
  if(live.refreshing||!live.session?.id)return;
  live.refreshing=true;
  if(!quiet){live.loading=true;clearError();root.render()}
  try{
    const state=await core.getState(live.session.id);
    live.state=state;
    live.session=state.session;
    live.latestSession=live.session;
    live.activeSession=live.session.status==='active'?live.session:null;
    if(live.viewIndex===null){
      live.viewIndex=Math.min(QUESTION_COUNT-1,store?.getIndex?.(live.session.id)||0);
    }
    live.loading=false;
    live.refreshing=false;
    if(root.ui?.view===VIEW_GAME)root.render();
  }catch(error){
    live.refreshing=false;
    if(!quiet)setError(error);
    else console.warn('[Między Nami v0.9.3 state]',error);
  }
}

async function openSession(session,{showSummary=false}={}){
  if(!session?.id)return;
  live.loading=true;clearError();live.session=session;live.state=null;live.viewIndex=null;live.showSummary=Boolean(showSummary);
  root.ui.view=VIEW_GAME;root.render();
  try{
    const state=await core.getState(session.id);
    live.state=state;live.session=state.session;live.latestSession=live.session;live.activeSession=live.session.status==='active'?live.session:null;
    const stored=Math.min(QUESTION_COUNT-1,store?.getIndex?.(session.id)||0);
    const firstUnresolved=state.answers?.findIndex(item=>!item.revealed)??0;
    live.viewIndex=Math.max(0,Math.min(QUESTION_COUNT-1,stored||Math.max(0,firstUnresolved)));
    store?.setSession?.(session.id);store?.setIndex?.(session.id,live.viewIndex);
    live.loading=false;subscribe(session.id);root.render();
  }catch(error){setError(error)}
}

function v093OpenWho(){
  cleanupSubscription();stopPolling();
  live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;clearError();
  root.ui.view=VIEW_LOBBY;root.render();
  void refreshLobby({quiet:true});
}

async function v093StartOnlineWho(){
  if(!ready()){v093OpenWho();return}
  if(live.activeSession){await openSession(live.activeSession);return}
  const pool=whoQuestions();
  if(pool.length<QUESTION_COUNT){setError(new Error('Brakuje pytań do rozpoczęcia gry.'));return}
  live.loading=true;clearError();root.render();
  try{
    const ids=shuffled(pool).slice(0,QUESTION_COUNT).map(card=>card.id);
    const session=await core.createSession(GAME_KEY,ids);
    live.activeSession=session;live.latestSession=session;live.viewIndex=0;
    store?.setIndex?.(session.id,0);
    await openSession(session);
  }catch(error){setError(error)}
}

function v093StartLocalWho(){
  cleanupSubscription();stopPolling();
  if(typeof previousOpenGameInfo==='function')previousOpenGameInfo('who');
}

async function v093JoinSession(sessionId){
  live.loading=true;clearError();root.ui.view=VIEW_GAME;root.render();
  try{
    let session=live.latestSession?.id===sessionId?live.latestSession:null;
    if(!session){
      const latest=await core.fetchLatestSession(GAME_KEY);
      session=latest?.id===sessionId?latest:null;
    }
    if(!session)throw new Error('SESSION_NOT_FOUND');
    await openSession(session,{showSummary:session.status==='completed'});
  }catch(error){setError(error)}
}

async function v093ChooseAnswer(answer){
  if(live.loading||!live.session?.id)return;
  const index=Number(live.viewIndex)||0;
  live.loading=true;clearError();root.render();
  try{
    const state=await core.submitAnswer(live.session.id,index,Number(answer));
    live.state=state;live.session=state.session;live.latestSession=live.session;live.activeSession=live.session.status==='active'?live.session:null;live.loading=false;
    store?.setIndex?.(live.session.id,index);
    root.render();
  }catch(error){setError(error)}
}

function v093NextQuestion(){
  if(!live.session?.id)return;
  if(Number(live.viewIndex)>=QUESTION_COUNT-1){root.render();return}
  live.viewIndex=Number(live.viewIndex)+1;
  store?.setIndex?.(live.session.id,live.viewIndex);
  root.render();
}

async function v093CancelSession(){
  if(!live.session?.id&& !live.latestSession?.id)return;
  const sessionId=live.session?.id||live.latestSession?.id;
  live.loading=true;clearError();root.render();
  try{
    await core.cancelSession(sessionId);
    cleanupSubscription();stopPolling();store?.setSession?.('');store?.clearIndex?.(sessionId);
    live.session=null;live.state=null;live.activeSession=null;live.latestSession=null;live.viewIndex=null;live.showSummary=false;live.loading=false;
    root.ui.view=VIEW_LOBBY;root.render();
  }catch(error){setError(error)}
}

function v093BackToLobby(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;root.ui.view=VIEW_LOBBY;root.render();void refreshLobby({quiet:true})}
function v093BackHome(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;root.ui.view='home';root.render()}
function v093Retry(){if(root.ui?.view===VIEW_GAME)void refreshState();else void refreshLobby()}

function pairHtml(){
  if(ready())return`<div class="v091-pair-ready"><span>✓</span><div><strong>${esc(ownMember()?.display_name)} + ${esc(partnerMember()?.display_name)}</strong><small>Połączenie gotowe. Każde odpowiada na swoim telefonie.</small></div></div>`;
  return`<div class="v091-pair-needed"><span>2</span><div><strong>Połączcie dwa konta</strong><small>Zalogujcie się na osobnych telefonach i wpiszcie wspólny kod pary.</small></div><button class="button secondary" onclick="showCloudHub()">Konto i synchronizacja</button></div>`;
}

function renderLobby(){
  const active=live.activeSession;
  const recent=!active&&live.latestSession?.status==='completed'?live.latestSession:null;
  root.app.innerHTML=`<section class="panel wide v091-lobby v093-lobby"><div class="top-row"><button class="back-button" onclick="v093BackHome()">← Wszystkie gry</button><span class="chip ${ready()?'connected-chip':''}">${ready()?'● gra na żywo':'jeden lub dwa telefony'}</span></div><div class="v091-lobby-hero v093-lobby-hero"><span>↔</span><div><small>KTO BARDZIEJ?</small><h1>Jedna karta na obu telefonach</h1><p>Każde wybiera osobno: jedna osoba, druga osoba albo oboje. Odpowiedzi odsłaniają się dopiero wtedy, gdy oboje odpowiedzą.</p></div></div>${errorHtml()}${loadingHtml()}${pairHtml()}${active?`<button class="v091-active-session v093-active-session" onclick="v093JoinSession('${esc(active.id)}')"><span>▶</span><div><small>AKTYWNA GRA</small><strong>Rundę rozpoczęła osoba: ${esc(creatorName(active))}</strong><p>Wróćcie do tej samej karty i kontynuujcie bez przekazywania telefonu.</p></div><i>Kontynuuj →</i></button>`:recent?`<button class="v091-active-session completed v093-active-session" onclick="v093JoinSession('${esc(recent.id)}')"><span>✓</span><div><small>GRA UKOŃCZONA</small><strong>Wasze podsumowanie jest gotowe</strong><p>Zobaczcie zgodne odpowiedzi ze wszystkich 10 kart.</p></div><i>Pokaż wynik →</i></button>`:''}<div class="v091-mode-grid"><article class="v091-mode-card online v093-mode-card"><span>📱📱</span><small>NOWY TRYB NA ŻYWO</small><h2>Dwa telefony</h2><p>Oboje widzicie tę samą kartę. Po dwóch odpowiedziach następuje wspólne odsłonięcie.</p><button class="button primary full" onclick="v093StartOnlineWho()" ${ready()&&!active?'':'disabled'}>${active?'Najpierw dokończcie grę':'Rozpocznij 10 kart'}</button></article><article class="v091-mode-card local"><span>↔</span><small>TRYB KLASYCZNY</small><h2>Jeden telefon</h2><p>Odpowiadacie kolejno i przekazujecie sobie urządzenie tak jak dotychczas.</p><button class="button secondary full" onclick="v093StartLocalWho()">Graj na jednym telefonie</button></article></div><div class="v093-live-rules"><article><span>1</span><div><strong>Prywatny wybór</strong><small>Druga osoba widzi tylko informację, że odpowiedź została oddana.</small></div></article><article><span>2</span><div><strong>Wspólne odsłonięcie</strong><small>Po odpowiedzi obojga pojawia się wynik bieżącej karty.</small></div></article><article><span>3</span><div><strong>Automatyczne wznowienie</strong><small>Gra pamięta bieżącą kartę przez 48 godzin.</small></div></article></div></section>`;
  setVersion();
}

function renderAnswering(row,question){
  const partnerDone=Boolean(row?.partner_done);
  const options=optionLabels();
  root.app.innerHTML=`<section class="panel v093-live-game"><div class="top-row"><button class="back-button" onclick="v093BackToLobby()">← Kto bardziej?</button><span class="chip connected-chip">● na żywo · ${Number(live.viewIndex)+1}/${QUESTION_COUNT}</span></div>${errorHtml()}${loadingHtml()}<div class="v093-live-head"><div><small>${esc(ownMember()?.display_name||'Ty')} · wybierz bez konsultowania</small><h1>Kto bardziej?</h1></div><span>${partnerDone?'✓':'…'}</span></div><div class="v082-progress"><i style="width:${progressPercent()}%"></i></div><article class="v093-live-card"><small>KARTA ${Number(live.viewIndex)+1}</small><h2>${esc(question.prompt)}</h2><div class="v093-live-options">${options.map((option,index)=>`<button onclick="v093ChooseAnswer(${index})" ${live.loading?'disabled':''}><b>${index===2?'=':index+1}</b><span>${esc(option)}</span></button>`).join('')}</div></article><div class="v093-partner-signal ${partnerDone?'done':''}"><span>${partnerDone?'✓':'🔒'}</span><p>${partnerDone?`${esc(partnerMember()?.display_name||'Druga osoba')} już odpowiedziała. Wybierz swoją odpowiedź, aby odsłonić wynik.`:`Odpowiedź ${esc(partnerMember()?.display_name||'drugiej osoby')} pozostaje ukryta.`}</p></div></section>`;
}

function renderWaiting(row,question){
  root.app.innerHTML=`<section class="panel v093-live-game"><div class="top-row"><button class="back-button" onclick="v093BackToLobby()">← Kto bardziej?</button><span class="chip connected-chip">● odpowiedź zapisana</span></div>${errorHtml()}${loadingHtml()}<div class="v091-waiting v093-card-waiting"><span class="v091-wait-icon">✓</span><small>KARTA ${Number(live.viewIndex)+1}/${QUESTION_COUNT}</small><h1>Czekamy na drugą odpowiedź</h1><p>${esc(question.prompt)}</p><div class="v091-wait-status"><div class="done"><span>✓</span><strong>${esc(ownMember()?.display_name||'Ty')}</strong><small>${esc(optionLabel(row.own_answer))}</small></div><div class="pending"><span>…</span><strong>${esc(partnerMember()?.display_name||'Druga osoba')}</strong><small>odpowiedź ukryta</small></div></div><button class="button primary full" onclick="v093Retry()">Sprawdź ponownie</button><button class="button tertiary full" onclick="v093BackToLobby()">Wróć — gra poczeka</button></div></section>`;
}

function renderReveal(row,question){
  const same=Number(row.own_answer)===Number(row.partner_answer);
  const revealed=revealedRows().length;
  const matches=matchCount();
  const last=Number(live.viewIndex)>=QUESTION_COUNT-1;
  const completed=live.session?.status==='completed';
  root.app.innerHTML=`<section class="panel v093-live-game v093-reveal"><div class="top-row"><button class="back-button" onclick="v093BackToLobby()">← Kto bardziej?</button><span class="chip connected-chip">● wspólne odsłonięcie</span></div>${errorHtml()}<div class="${same?'result-success':'result-different'}"><div class="result-title">${same?'Tak samo!':'Inne spojrzenie'}</div></div><article class="v093-live-card revealed"><small>KARTA ${Number(live.viewIndex)+1}</small><h2>${esc(question.prompt)}</h2><div class="result-answers"><div class="result-answer"><span>${esc(ownMember()?.display_name||'Ty')}</span><strong>${esc(optionLabel(row.own_answer))}</strong></div><div class="result-answer"><span>${esc(partnerMember()?.display_name||'Druga osoba')}</span><strong>${esc(optionLabel(row.partner_answer))}</strong></div></div><p>${same?'Wskazaliście tę samą odpowiedź. Podajcie po jednym przykładzie.':'Porównajcie, skąd wzięły się wasze odpowiedzi — bez szukania jednej poprawnej wersji.'}</p></article><div class="v093-round-score"><span><b>${matches}</b> zgodnych</span><span><b>${revealed}</b> odsłoniętych</span></div><button class="button primary full" onclick="${last&&completed?'v093ShowSummary()':'v093NextQuestion()'}">${last&&completed?'Zobacz podsumowanie':'Następna karta →'}</button></section>`;
}

function renderSummary(){
  const rows=answerRows().filter(item=>item.revealed);
  const ids=live.session?.question_ids||[];
  const questions=questionMap();
  const matches=rows.filter(item=>Number(item.own_answer)===Number(item.partner_answer)).length;
  const score=Math.round(matches/Math.max(1,rows.length)*100);
  const title=matches>=9?'Nadajecie na tej samej fali':matches>=7?'Bardzo podobnie się widzicie':matches>=4?'Trochę zgodności, trochę zaskoczeń':'Dużo ciekawych różnic';
  root.app.innerHTML=`<section class="panel wide v091-online-summary v093-summary"><div class="top-row"><button class="back-button" onclick="v093BackHome()">← Wszystkie gry</button><span class="chip connected-chip">● ukończona gra</span></div>${errorHtml()}<div class="v082-result-hero"><div class="v082-result-ring" style="--score:${score}"><strong>${score}%</strong><small>zgodności</small></div><div><span class="eyebrow">KTO BARDZIEJ? · NA ŻYWO</span><h1>${title}</h1><p>Tak samo odpowiedzieliście na ${matches} z ${rows.length} kart. Różnice są dobrym początkiem krótkich historii i przykładów.</p></div></div><div class="v082-result-list v093-result-list">${rows.map(item=>{const question=questions.get(ids[Number(item.question_index)]);const same=Number(item.own_answer)===Number(item.partner_answer);return`<article class="${same?'same':'different'}"><div><small>${Number(item.question_index)+1}</small><h3>${esc(question?.prompt||'Pytanie')}</h3></div><div class="v082-result-answers"><span><b>${esc(ownMember()?.display_name||'Ty')}</b>${esc(optionLabel(item.own_answer))}</span><span><b>${esc(partnerMember()?.display_name||'Druga osoba')}</b>${esc(optionLabel(item.partner_answer))}</span></div><em>${same?'To samo ✓':'Inaczej'}</em></article>`}).join('')}</div><div class="v091-summary-actions"><button class="button primary" onclick="v093StartOnlineWho()">Nowa gra</button><button class="button secondary" onclick="v093BackHome()">Wszystkie gry</button><button class="button tertiary" onclick="v093CancelSession()">Usuń wynik z chmury</button></div><p class="v091-private-summary">Szczegółowe odpowiedzi pozostają tylko w tej tymczasowej rozgrywce. Nowa gra zastępuje poprzedni wynik.</p></section>`;
}

function v093ShowSummary(){live.showSummary=true;root.render()}

function renderGame(){
  if(live.loading&&!live.state){root.app.innerHTML=`<section class="panel v091-lobby">${loadingHtml()}</section>`;return}
  if(!live.session||!live.state){renderLobby();return}
  if(live.session.status==='completed'&&live.showSummary){renderSummary();return}
  const row=rowAt();
  const question=currentQuestion();
  if(!row||!question){root.app.innerHTML=`<section class="panel"><h1>Nie znaleziono tej karty</h1><button class="button primary" onclick="v093Retry()">Odśwież grę</button></section>`;return}
  if(row.revealed){renderReveal(row,question);return}
  if(row.own_done){renderWaiting(row,question);return}
  renderAnswering(row,question);
}

function enhanceHome(){
  if(root.ui?.view!=='home')return;
  const heroTitle=document.querySelector('.hero h1');
  if(heroTitle&&heroTitle.textContent?.includes('Jeden telefon'))heroTitle.innerHTML='Jeden lub dwa telefony. Dwie osoby. <span class="gradient-text">Dużo do odkrycia.</span>';
  const heroBadge=document.querySelector('.hero .eyebrow');
  if(heroBadge)heroBadge.textContent=heroBadge.textContent.replace('OFFLINE','OFFLINE + ONLINE');
  const card=[...document.querySelectorAll('.game-card')].find(node=>node.textContent?.includes('Kto bardziej'));
  if(card){
    card.classList.add('v093-online-game-card');
    const badge=card.querySelector('.game-badge');if(badge)badge.textContent='ONLINE · 2 telefony';
    const meta=card.querySelector('.game-meta span:last-child');if(meta)meta.textContent='Graj razem →';
  }
  document.querySelector('.v093-home-session')?.remove();
  if(live.activeSession){
    const target=document.querySelector('.quick-actions')||document.querySelector('.daily-card');
    target?.insertAdjacentHTML('beforebegin',`<button class="v093-home-session" onclick="v093JoinSession('${esc(live.activeSession.id)}')"><span>↔</span><div><small>AKTYWNA GRA NA DWÓCH TELEFONACH</small><strong>Kto bardziej? — kontynuujcie wspólną kartę</strong><p>Rundę rozpoczęła osoba: ${esc(creatorName(live.activeSession))}</p></div><i>Otwórz →</i></button>`);
  }
  if(!live.homeChecking&&Date.now()-live.homeCheckedAt>4000){
    live.homeChecking=true;
    queueMicrotask(async()=>{try{await refreshLobby({quiet:true})}finally{live.homeChecking=false}});
  }
}

root.render=function(){
  if(root.ui?.view===VIEW_LOBBY){renderLobby();window.scrollTo({top:0,behavior:'smooth'});return}
  if(root.ui?.view===VIEW_GAME){renderGame();setVersion();window.scrollTo({top:0,behavior:'smooth'});return}
  previousRender();
  enhanceHome();
  setVersion();
};

root.openGameInfo=function(id){return id==='who'?v093OpenWho():previousOpenGameInfo?.(id)};
Object.assign(root,{
  v093OpenWho,v093StartOnlineWho,v093StartLocalWho,v093JoinSession,v093ChooseAnswer,
  v093NextQuestion,v093ShowSummary,v093CancelSession,v093BackToLobby,v093BackHome,v093Retry,
});

window.addEventListener('online',()=>{
  if(root.ui?.view===VIEW_GAME)void refreshState({quiet:true});
  if([VIEW_LOBBY,'home'].includes(root.ui?.view))void refreshLobby({quiet:true});
});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible')return;
  if(root.ui?.view===VIEW_GAME)void refreshState({quiet:true});
  if([VIEW_LOBBY,'home'].includes(root.ui?.view))void refreshLobby({quiet:true});
});

setVersion();
})(globalThis);
