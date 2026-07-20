(function(root){
'use strict';

const RELEASE=root.MN_RELEASE||{version:'0.9.7'};
const VERSION=String(RELEASE.version||'0.9.7');
const core=root.MN_LIVE_MULTIPLAYER_CORE;
const base=root.MN_MULTIPLAYER_CORE;
const GAME_KEY='dilemma_live';
const QUESTION_COUNT=10;
const VIEW_LOBBY='v097-dilemma-lobby';
const VIEW_GAME='v097-dilemma-live';
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
  pendingAnswer:null,
};

root.MN_V097_LIVE_DILEMMA=live;

function esc(value){return base?.esc?.(value)||String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function ready(){return Boolean(core?.ready?.())}
function currentUser(){return core?.currentUser?.()||null}
function ownMember(){return core?.ownMember?.()||null}
function partnerMember(){return core?.partnerMember?.()||null}
function members(){return core?.orderedMembers?.()||[]}
function memberName(userId){return core?.memberName?.(userId)||'Osoba'}
function setVersion(){base?.setVersion?.();document.documentElement.dataset.version=VERSION}
function setError(error){live.error=core?.friendlyError?.(error,'008_v097_live_choice.sql')||String(error?.message||error||'Nieznany błąd');live.loading=false;console.error('[Między Nami v0.9.7]',error);root.render()}
function clearError(){live.error=''}
function errorHtml(){return live.error?`<div class="v083-friendly-error"><span>!</span><div><strong>Nie udało się wykonać tej czynności</strong><p>${esc(live.error)}</p></div><button onclick="v097Retry()">Spróbuj ponownie</button></div>`:''}
function loadingHtml(){return live.loading?'<div class="v091-loading"><i></i><span>Synchronizujemy dwa telefony…</span></div>':''}
function creatorName(session){return memberName(session?.created_by)}

function allCards(){
  try{
    if(typeof root.getAllCards==='function')return root.getAllCards();
    if(typeof getAllCards==='function')return getAllCards();
  }catch{}
  return[];
}
function dilemmaQuestions(){return allCards().filter(card=>card?.mode==='dilemma'&&card?.type==='choice'&&card?.id&&card?.prompt&&Array.isArray(card.options)&&card.options.length===2)}
function questionMap(){return new Map(dilemmaQuestions().map(card=>[card.id,card]))}
function shuffled(items){return base?.shuffled?.(items)||[...(items||[])].sort(()=>Math.random()-.5)}
function optionLabels(question=currentQuestion()){return Array.isArray(question?.options)?question.options.slice(0,2):['Opcja A','Opcja B']}
function optionLabel(index,question=currentQuestion()){return optionLabels(question)[Number(index)]||'—'}
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
  live.subscription=core?.subscribe?.('dilemma',sessionId,()=>void refreshState({quiet:true}))||null;
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
    else console.warn('[Między Nami v0.9.7 lobby]',error);
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
    else console.warn('[Między Nami v0.9.7 state]',error);
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

function v097OpenDilemma(){
  cleanupSubscription();stopPolling();
  live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;live.pendingAnswer=null;clearError();
  root.ui.view=VIEW_LOBBY;root.render();
  void refreshLobby({quiet:true});
}

async function v097StartOnlineDilemma(){
  if(!ready()){v097OpenDilemma();return}
  if(live.activeSession){await openSession(live.activeSession);return}
  const pool=dilemmaQuestions();
  if(pool.length<QUESTION_COUNT){setError(new Error('Brakuje pytań do rozpoczęcia gry.'));return}
  live.loading=true;clearError();root.render();
  try{
    const ids=shuffled(pool).slice(0,QUESTION_COUNT).map(card=>card.id);
    const session=await core.createSession(GAME_KEY,ids);
    live.activeSession=session;live.latestSession=session;live.viewIndex=0;live.pendingAnswer=null;
    store?.setIndex?.(session.id,0);
    await openSession(session);
  }catch(error){setError(error)}
}

function v097StartLocalDilemma(){
  cleanupSubscription();stopPolling();
  if(typeof previousOpenGameInfo==='function')previousOpenGameInfo('dilemma');
}

async function v097JoinSession(sessionId){
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

function v097ChooseAnswer(answer){
  if(live.loading||!live.session?.id)return;
  live.pendingAnswer=Number(answer);
  root.render();
}

async function v097ConfirmAnswer(){
  if(live.loading||!live.session?.id||live.pendingAnswer===null)return;
  const index=Number(live.viewIndex)||0;
  const answer=Number(live.pendingAnswer);
  live.loading=true;clearError();root.render();
  try{
    const state=await core.submitAnswer(live.session.id,index,answer);
    live.state=state;live.session=state.session;live.latestSession=live.session;live.activeSession=live.session.status==='active'?live.session:null;live.loading=false;
    store?.setIndex?.(live.session.id,index);live.pendingAnswer=null;
    root.render();
  }catch(error){setError(error)}
}

function v097NextQuestion(){
  if(!live.session?.id)return;
  if(Number(live.viewIndex)>=QUESTION_COUNT-1){root.render();return}
  live.viewIndex=Number(live.viewIndex)+1;live.pendingAnswer=null;
  store?.setIndex?.(live.session.id,live.viewIndex);
  root.render();
}

async function v097CancelSession(){
  if(!live.session?.id&& !live.latestSession?.id)return;
  const sessionId=live.session?.id||live.latestSession?.id;
  live.loading=true;clearError();root.render();
  try{
    await core.cancelSession(sessionId);
    cleanupSubscription();stopPolling();store?.setSession?.('');store?.clearIndex?.(sessionId);
    live.session=null;live.state=null;live.activeSession=null;live.latestSession=null;live.viewIndex=null;live.showSummary=false;live.pendingAnswer=null;live.loading=false;
    root.ui.view=VIEW_LOBBY;root.render();
  }catch(error){setError(error)}
}

function v097BackToLobby(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;live.pendingAnswer=null;root.ui.view=VIEW_LOBBY;root.render();void refreshLobby({quiet:true})}
function v097BackHome(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;live.pendingAnswer=null;root.ui.view='home';root.render()}
function v097Retry(){if(root.ui?.view===VIEW_GAME)void refreshState();else void refreshLobby()}

function pairHtml(){
  if(ready())return`<div class="v091-pair-ready"><span>✓</span><div><strong>${esc(ownMember()?.display_name)} + ${esc(partnerMember()?.display_name)}</strong><small>Połączenie gotowe. Każde odpowiada na swoim telefonie.</small></div></div>`;
  return`<div class="v091-pair-needed"><span>2</span><div><strong>Połączcie dwa konta</strong><small>Zalogujcie się na osobnych telefonach i wpiszcie wspólny kod pary.</small></div><button class="button secondary" onclick="showCloudHub()">Konto i synchronizacja</button></div>`;
}

function renderLobby(){
  const active=live.activeSession;
  const recent=!active&&live.latestSession?.status==='completed'?live.latestSession:null;
  root.app.innerHTML=`<section class="panel wide v091-lobby v093-lobby"><div class="top-row"><button class="back-button" onclick="v097BackHome()">← Wszystkie gry</button><span class="chip ${ready()?'connected-chip':''}">${ready()?'● gra na żywo':'jeden lub dwa telefony'}</span></div><div class="v091-lobby-hero v093-lobby-hero"><span>↔</span><div><small>CO WYBIERASZ?</small><h1>Jedna karta na obu telefonach</h1><p>Każde wybiera prywatnie jedną z dwóch możliwości. Odpowiedzi odsłaniają się dopiero wtedy, gdy oboje zakończą wybór.</p></div></div>${errorHtml()}${loadingHtml()}${pairHtml()}${active?`<button class="v091-active-session v093-active-session" onclick="v097JoinSession('${esc(active.id)}')"><span>▶</span><div><small>AKTYWNA GRA</small><strong>Rundę rozpoczęła osoba: ${esc(creatorName(active))}</strong><p>Wróćcie do tego samego dylematu i kontynuujcie na osobnych telefonach.</p></div><i>Kontynuuj →</i></button>`:recent?`<button class="v091-active-session completed v093-active-session" onclick="v097JoinSession('${esc(recent.id)}')"><span>✓</span><div><small>GRA UKOŃCZONA</small><strong>Wasze podsumowanie jest gotowe</strong><p>Zobaczcie wspólne wybory i różnice ze wszystkich 10 dylematów.</p></div><i>Pokaż wynik →</i></button>`:''}<div class="v091-mode-grid"><article class="v091-mode-card online v093-mode-card"><span>📱📱</span><small>NOWY TRYB NA ŻYWO</small><h2>Dwa telefony</h2><p>Oboje widzicie ten sam dylemat i dwie opcje. Po dwóch odpowiedziach następuje wspólne odsłonięcie.</p><button class="button primary full" onclick="v097StartOnlineDilemma()" ${ready()&&!active?'':'disabled'}>${active?'Najpierw dokończcie grę':'Rozpocznij 10 kart'}</button></article><article class="v091-mode-card local"><span>↔</span><small>TRYB KLASYCZNY</small><h2>Jeden telefon</h2><p>Odpowiadacie kolejno i przekazujecie sobie urządzenie tak jak dotychczas.</p><button class="button secondary full" onclick="v097StartLocalDilemma()">Graj na jednym telefonie</button></article></div><div class="v093-live-rules"><article><span>1</span><div><strong>Prywatny wybór</strong><small>Druga osoba widzi tylko informację, że odpowiedź została oddana.</small></div></article><article><span>2</span><div><strong>Wspólne odsłonięcie</strong><small>Po odpowiedzi obojga pojawia się wynik bieżącej karty.</small></div></article><article><span>3</span><div><strong>Automatyczne wznowienie</strong><small>Gra pamięta bieżącą kartę przez 48 godzin.</small></div></article></div></section>`;
  setVersion();
}

function renderAnswering(row,question){
  const partnerDone=Boolean(row?.partner_done);
  const options=optionLabels(question);
  const selected=live.pendingAnswer;
  root.app.innerHTML=`<section class="panel v093-live-game v097-choice-game"><div class="top-row"><button class="back-button" onclick="v097BackToLobby()">← Co wybierasz?</button><span class="chip connected-chip">● na żywo · ${Number(live.viewIndex)+1}/${QUESTION_COUNT}</span></div>${errorHtml()}${loadingHtml()}<div class="v093-live-head"><div><small>${esc(ownMember()?.display_name||'Ty')} · wybierz bez konsultowania</small><h1>Co wybierasz?</h1></div><span>${partnerDone?'✓':'…'}</span></div><div class="v082-progress"><i style="width:${progressPercent()}%"></i></div><article class="v093-live-card"><small>DYLEMAT ${Number(live.viewIndex)+1}</small><h2>${esc(question.prompt)}</h2><div class="v093-live-options v097-choice-options">${options.map((option,index)=>`<button class="${selected===index?'selected':''}" onclick="v097ChooseAnswer(${index})" aria-pressed="${selected===index}" ${live.loading?'disabled':''}><b>${index===0?'A':'B'}</b><span>${esc(option)}</span><i>${selected===index?'✓':''}</i></button>`).join('')}</div><button class="button primary full v097-confirm-choice" onclick="v097ConfirmAnswer()" ${selected===null||live.loading?'disabled':''}>Zatwierdź wybór</button></article><div class="v093-partner-signal ${partnerDone?'done':''}"><span>${partnerDone?'✓':'🔒'}</span><p>${partnerDone?`${esc(partnerMember()?.display_name||'Druga osoba')} już odpowiedziała. Zatwierdź swój wybór, aby odsłonić wynik.`:`Odpowiedź ${esc(partnerMember()?.display_name||'drugiej osoby')} pozostaje ukryta.`}</p></div></section>`;
}

function renderWaiting(row,question){
  root.app.innerHTML=`<section class="panel v093-live-game"><div class="top-row"><button class="back-button" onclick="v097BackToLobby()">← Co wybierasz?</button><span class="chip connected-chip">● odpowiedź zapisana</span></div>${errorHtml()}${loadingHtml()}<div class="v091-waiting v093-card-waiting"><span class="v091-wait-icon">✓</span><small>KARTA ${Number(live.viewIndex)+1}/${QUESTION_COUNT}</small><h1>Czekamy na drugą odpowiedź</h1><p>${esc(question.prompt)}</p><div class="v091-wait-status"><div class="done"><span>✓</span><strong>${esc(ownMember()?.display_name||'Ty')}</strong><small>${esc(optionLabel(row.own_answer))}</small></div><div class="pending"><span>…</span><strong>${esc(partnerMember()?.display_name||'Druga osoba')}</strong><small>odpowiedź ukryta</small></div></div><button class="button primary full" onclick="v097Retry()">Sprawdź ponownie</button><button class="button tertiary full" onclick="v097BackToLobby()">Wróć — gra poczeka</button></div></section>`;
}

function renderReveal(row,question){
  const same=Number(row.own_answer)===Number(row.partner_answer);
  const revealed=revealedRows().length;
  const matches=matchCount();
  const last=Number(live.viewIndex)>=QUESTION_COUNT-1;
  const completed=live.session?.status==='completed';
  root.app.innerHTML=`<section class="panel v093-live-game v093-reveal"><div class="top-row"><button class="back-button" onclick="v097BackToLobby()">← Co wybierasz?</button><span class="chip connected-chip">● wspólne odsłonięcie</span></div>${errorHtml()}<div class="${same?'result-success':'result-different'}"><div class="result-title">${same?'Tak samo!':'Inne spojrzenie'}</div></div><article class="v093-live-card revealed"><small>KARTA ${Number(live.viewIndex)+1}</small><h2>${esc(question.prompt)}</h2><div class="result-answers"><div class="result-answer"><span>${esc(ownMember()?.display_name||'Ty')}</span><strong>${esc(optionLabel(row.own_answer))}</strong></div><div class="result-answer"><span>${esc(partnerMember()?.display_name||'Druga osoba')}</span><strong>${esc(optionLabel(row.partner_answer))}</strong></div></div><p>${same?'Wybraliście tę samą opcję. Powiedzcie krótko, co najbardziej zdecydowało.':'Wybraliście inaczej. Porównajcie powody bez szukania jednej poprawnej odpowiedzi.'}</p></article><div class="v093-round-score"><span><b>${matches}</b> zgodnych</span><span><b>${revealed}</b> odsłoniętych</span></div><button class="button primary full" onclick="${last&&completed?'v097ShowSummary()':'v097NextQuestion()'}">${last&&completed?'Zobacz podsumowanie':'Następna karta →'}</button></section>`;
}

function renderSummary(){
  const rows=answerRows().filter(item=>item.revealed);
  const ids=live.session?.question_ids||[];
  const questions=questionMap();
  const matches=rows.filter(item=>Number(item.own_answer)===Number(item.partner_answer)).length;
  const score=Math.round(matches/Math.max(1,rows.length)*100);
  const title=matches>=9?'Prawie zawsze wybieracie tak samo':matches>=7?'Macie bardzo podobne priorytety':matches>=4?'Trochę wspólnych wyborów, trochę zaskoczeń':'Wasze wybory często prowadzą różnymi drogami';
  root.app.innerHTML=`<section class="panel wide v091-online-summary v093-summary"><div class="top-row"><button class="back-button" onclick="v097BackHome()">← Wszystkie gry</button><span class="chip connected-chip">● ukończona gra</span></div>${errorHtml()}<div class="v082-result-hero"><div class="v082-result-ring" style="--score:${score}"><strong>${score}%</strong><small>zgodności</small></div><div><span class="eyebrow">CO WYBIERASZ? · NA ŻYWO</span><h1>${title}</h1><p>Tak samo odpowiedzieliście na ${matches} z ${rows.length} kart. Każda różnica może być początkiem krótkiej rozmowy o tym, co jest dla was ważne.</p></div></div><div class="v082-result-list v093-result-list">${rows.map(item=>{const question=questions.get(ids[Number(item.question_index)]);const same=Number(item.own_answer)===Number(item.partner_answer);return`<article class="${same?'same':'different'}"><div><small>${Number(item.question_index)+1}</small><h3>${esc(question?.prompt||'Pytanie')}</h3></div><div class="v082-result-answers"><span><b>${esc(ownMember()?.display_name||'Ty')}</b>${esc(optionLabel(item.own_answer,question))}</span><span><b>${esc(partnerMember()?.display_name||'Druga osoba')}</b>${esc(optionLabel(item.partner_answer,question))}</span></div><em>${same?'To samo ✓':'Inaczej'}</em></article>`}).join('')}</div><div class="v091-summary-actions"><button class="button primary" onclick="v097StartOnlineDilemma()">Nowa gra</button><button class="button secondary" onclick="v097BackHome()">Wszystkie gry</button><button class="button tertiary" onclick="v097CancelSession()">Usuń wynik z chmury</button></div><p class="v091-private-summary">Szczegółowe odpowiedzi pozostają tylko w tej tymczasowej rozgrywce. Nowa gra zastępuje poprzedni wynik.</p></section>`;
}

function v097ShowSummary(){live.showSummary=true;root.render()}

function renderGame(){
  if(live.loading&&!live.state){root.app.innerHTML=`<section class="panel v091-lobby">${loadingHtml()}</section>`;return}
  if(!live.session||!live.state){renderLobby();return}
  if(live.session.status==='completed'&&live.showSummary){renderSummary();return}
  const row=rowAt();
  const question=currentQuestion();
  if(!row||!question){root.app.innerHTML=`<section class="panel"><h1>Nie znaleziono tej karty</h1><button class="button primary" onclick="v097Retry()">Odśwież grę</button></section>`;return}
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
  const card=[...document.querySelectorAll('.game-card')].find(node=>node.textContent?.includes('Co wybierasz'));
  if(card){
    card.classList.add('v093-online-game-card');
    const badge=card.querySelector('.game-badge');if(badge)badge.textContent='ONLINE · 2 telefony';
    const meta=card.querySelector('.game-meta span:last-child');if(meta)meta.textContent='Graj razem →';
  }
  document.querySelector('.v097-home-session')?.remove();
  if(live.activeSession){
    const target=document.querySelector('.quick-actions')||document.querySelector('.daily-card');
    target?.insertAdjacentHTML('beforebegin',`<button class="v093-home-session v097-home-session" onclick="v097JoinSession('${esc(live.activeSession.id)}')"><span>↔</span><div><small>AKTYWNA GRA NA DWÓCH TELEFONACH</small><strong>Co wybierasz? — kontynuujcie wspólną kartę</strong><p>Rundę rozpoczęła osoba: ${esc(creatorName(live.activeSession))}</p></div><i>Otwórz →</i></button>`);
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

root.openGameInfo=function(id){return id==='dilemma'?v097OpenDilemma():previousOpenGameInfo?.(id)};
Object.assign(root,{
  v097OpenDilemma,v097StartOnlineDilemma,v097StartLocalDilemma,v097JoinSession,v097ChooseAnswer,v097ConfirmAnswer,
  v097NextQuestion,v097ShowSummary,v097CancelSession,v097BackToLobby,v097BackHome,v097Retry,
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
