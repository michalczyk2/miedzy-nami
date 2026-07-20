(function(root){
'use strict';

const RELEASE=root.MN_RELEASE||{version:'0.9.4'};
const VERSION=String(RELEASE.version||'0.9.4');
const core=root.MN_LIVE_MULTIPLAYER_CORE;
const base=root.MN_MULTIPLAYER_CORE;
const GAME_KEY='know_live';
const QUESTION_COUNT=10;
const VIEW_LOBBY='v094-know-lobby';
const VIEW_GAME='v094-know-live';
const MIGRATION='006_v094_live_know_me.sql';
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

root.MN_V094_LIVE_KNOW=live;

function esc(value){return base?.esc?.(value)||String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function ready(){return Boolean(core?.ready?.())}
function currentUser(){return core?.currentUser?.()||null}
function ownMember(){return core?.ownMember?.()||null}
function partnerMember(){return core?.partnerMember?.()||null}
function members(){return core?.orderedMembers?.()||[]}
function memberName(userId){return core?.memberName?.(userId)||'Osoba'}
function setVersion(){base?.setVersion?.();document.documentElement.dataset.version=VERSION}
function setError(error){live.error=core?.friendlyError?.(error,MIGRATION)||String(error?.message||error||'Nieznany błąd');live.loading=false;console.error('[Między Nami v0.9.4]',error);root.render()}
function clearError(){live.error=''}
function errorHtml(){return live.error?`<div class="v083-friendly-error"><span>!</span><div><strong>Nie udało się wykonać tej czynności</strong><p>${esc(live.error)}</p></div><button onclick="v094Retry()">Spróbuj ponownie</button></div>`:''}
function loadingHtml(){return live.loading?'<div class="v091-loading"><i></i><span>Synchronizujemy dwa telefony…</span></div>':''}
function creatorName(session){return memberName(session?.created_by)}

function allCards(){
  try{
    if(typeof root.getAllCards==='function')return root.getAllCards();
    if(typeof getAllCards==='function')return getAllCards();
  }catch{}
  return[];
}
function knowQuestions(){return allCards().filter(card=>card?.mode==='know'&&card?.type==='choice'&&card?.id&&card?.prompt&&Array.isArray(card.options)&&card.options.length>=2&&card.options.length<=4)}
function questionMap(){return new Map(knowQuestions().map(card=>[card.id,card]))}
function shuffled(items){return base?.shuffled?.(items)||[...(items||[])].sort(()=>Math.random()-.5)}
function answerRows(){return Array.isArray(live.state?.answers)?live.state.answers:[]}
function rowAt(index=live.viewIndex){return answerRows().find(item=>Number(item.question_index)===Number(index))||null}
function currentQuestion(){const id=live.session?.question_ids?.[Number(live.viewIndex)||0];return questionMap().get(id)||null}
function subjectMember(index=live.viewIndex){const ordered=members();return ordered[Math.abs(Number(index)||0)%2]||ordered[0]||null}
function guesserMember(index=live.viewIndex){const subject=subjectMember(index);return members().find(item=>item.user_id!==subject?.user_id)||null}
function ownIsSubject(index=live.viewIndex){return subjectMember(index)?.user_id===currentUser()?.id}
function truthAnswer(row,index=row?.question_index){return ownIsSubject(index)?row?.own_answer:row?.partner_answer}
function guessAnswer(row,index=row?.question_index){return ownIsSubject(index)?row?.partner_answer:row?.own_answer}
function isCorrect(row){return Boolean(row?.revealed)&&Number(truthAnswer(row))===Number(guessAnswer(row))}
function revealedRows(){return answerRows().filter(item=>item.revealed)}
function correctCount(){return revealedRows().filter(isCorrect).length}
function optionLabel(question,index){return question?.options?.[Number(index)]||'—'}
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
  live.subscription=core?.subscribe?.('know',sessionId,()=>void refreshState({quiet:true}))||null;
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
    else console.warn('[Między Nami v0.9.4 lobby]',error);
  }
}

async function refreshState({quiet=false}={}){
  if(live.refreshing||!live.session?.id)return;
  live.refreshing=true;
  if(!quiet){live.loading=true;clearError();root.render()}
  try{
    const state=await core.getState(live.session.id);
    live.state=state;live.session=state.session;live.latestSession=live.session;
    live.activeSession=live.session.status==='active'?live.session:null;
    if(live.viewIndex===null)live.viewIndex=Math.min(QUESTION_COUNT-1,store?.getIndex?.(live.session.id)||0);
    live.loading=false;live.refreshing=false;
    if(root.ui?.view===VIEW_GAME)root.render();
  }catch(error){
    live.refreshing=false;
    if(!quiet)setError(error);
    else console.warn('[Między Nami v0.9.4 state]',error);
  }
}

async function openSession(session,{showSummary=false}={}){
  if(!session?.id)return;
  live.loading=true;clearError();live.session=session;live.state=null;live.viewIndex=null;live.showSummary=Boolean(showSummary);
  root.ui.view=VIEW_GAME;root.render();
  try{
    const state=await core.getState(session.id);
    live.state=state;live.session=state.session;live.latestSession=live.session;
    live.activeSession=live.session.status==='active'?live.session:null;
    const stored=Math.min(QUESTION_COUNT-1,store?.getIndex?.(session.id)||0);
    const firstUnresolved=state.answers?.findIndex(item=>!item.revealed)??0;
    live.viewIndex=Math.max(0,Math.min(QUESTION_COUNT-1,stored||Math.max(0,firstUnresolved)));
    store?.setSession?.(session.id);store?.setIndex?.(session.id,live.viewIndex);
    live.loading=false;subscribe(session.id);root.render();
  }catch(error){setError(error)}
}

function v094OpenKnow(){
  cleanupSubscription();stopPolling();
  live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;clearError();
  root.ui.view=VIEW_LOBBY;root.render();
  void refreshLobby({quiet:true});
}

async function v094StartOnlineKnow(){
  if(!ready()){v094OpenKnow();return}
  if(live.activeSession){await openSession(live.activeSession);return}
  const pool=knowQuestions();
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

function v094StartLocalKnow(){cleanupSubscription();stopPolling();previousOpenGameInfo?.('know')}

async function v094JoinSession(sessionId){
  live.loading=true;clearError();root.ui.view=VIEW_GAME;root.render();
  try{
    let session=live.latestSession?.id===sessionId?live.latestSession:null;
    if(!session){const latest=await core.fetchLatestSession(GAME_KEY);session=latest?.id===sessionId?latest:null}
    if(!session)throw new Error('SESSION_NOT_FOUND');
    await openSession(session,{showSummary:session.status==='completed'});
  }catch(error){setError(error)}
}

async function v094ChooseAnswer(answer){
  if(live.loading||!live.session?.id)return;
  const index=Number(live.viewIndex)||0;
  const question=currentQuestion();
  if(Number(answer)<0||Number(answer)>=Number(question?.options?.length||0))return;
  live.loading=true;clearError();root.render();
  try{
    const state=await core.submitAnswer(live.session.id,index,Number(answer));
    live.state=state;live.session=state.session;live.latestSession=live.session;
    live.activeSession=live.session.status==='active'?live.session:null;live.loading=false;
    store?.setIndex?.(live.session.id,index);root.render();
  }catch(error){setError(error)}
}

function v094NextQuestion(){
  if(!live.session?.id)return;
  if(Number(live.viewIndex)>=QUESTION_COUNT-1){root.render();return}
  live.viewIndex=Number(live.viewIndex)+1;
  store?.setIndex?.(live.session.id,live.viewIndex);root.render();
}

async function v094CancelSession(){
  if(!live.session?.id&&!live.latestSession?.id)return;
  const sessionId=live.session?.id||live.latestSession?.id;
  live.loading=true;clearError();root.render();
  try{
    await core.cancelSession(sessionId);
    cleanupSubscription();stopPolling();store?.setSession?.('');store?.clearIndex?.(sessionId);
    live.session=null;live.state=null;live.activeSession=null;live.latestSession=null;live.viewIndex=null;live.showSummary=false;live.loading=false;
    root.ui.view=VIEW_LOBBY;root.render();
  }catch(error){setError(error)}
}

function v094BackToLobby(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;root.ui.view=VIEW_LOBBY;root.render();void refreshLobby({quiet:true})}
function v094BackHome(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;root.ui.view='home';root.render()}
function v094Retry(){if(root.ui?.view===VIEW_GAME)void refreshState();else void refreshLobby()}
function v094ShowSummary(){live.showSummary=true;root.render()}

function pairHtml(){
  if(ready())return`<div class="v091-pair-ready"><span>✓</span><div><strong>${esc(ownMember()?.display_name)} + ${esc(partnerMember()?.display_name)}</strong><small>Połączenie gotowe. Role zmieniają się automatycznie co kartę.</small></div></div>`;
  return`<div class="v091-pair-needed"><span>2</span><div><strong>Połączcie dwa konta</strong><small>Zalogujcie się na osobnych telefonach i wpiszcie wspólny kod pary.</small></div><button class="button secondary" onclick="showCloudHub()">Konto i synchronizacja</button></div>`;
}

function renderLobby(){
  const active=live.activeSession;
  const recent=!active&&live.latestSession?.status==='completed'?live.latestSession:null;
  const first=members()[0]?.display_name||'Osoba 1';
  root.app.innerHTML=`<section class="panel wide v091-lobby v094-lobby"><div class="top-row"><button class="back-button" onclick="v094BackHome()">← Wszystkie gry</button><span class="chip ${ready()?'connected-chip':''}">${ready()?'● gra na żywo':'jeden lub dwa telefony'}</span></div><div class="v091-lobby-hero v094-lobby-hero"><span>?</span><div><small>JAK DOBRZE MNIE ZNASZ?</small><h1>Prawdziwa odpowiedź kontra przewidywanie</h1><p>Na każdej karcie jedna osoba odpowiada o sobie, a druga próbuje ją przewidzieć. Po odsłonięciu zamieniacie się rolami.</p></div></div>${errorHtml()}${loadingHtml()}${pairHtml()}${active?`<button class="v091-active-session v094-active-session" onclick="v094JoinSession('${esc(active.id)}')"><span>▶</span><div><small>AKTYWNA GRA</small><strong>Rundę rozpoczęła osoba: ${esc(creatorName(active))}</strong><p>Wróćcie do bieżącej karty. Odpowiedzi pozostają ukryte do ruchu obojga.</p></div><i>Kontynuuj →</i></button>`:recent?`<button class="v091-active-session completed v094-active-session" onclick="v094JoinSession('${esc(recent.id)}')"><span>✓</span><div><small>GRA UKOŃCZONA</small><strong>Wasz wynik wiedzy o sobie jest gotowy</strong><p>Zobaczcie trafienia i odpowiedzi ze wszystkich 10 kart.</p></div><i>Pokaż wynik →</i></button>`:''}<div class="v091-mode-grid"><article class="v091-mode-card online v094-mode-card"><span>🎯</span><small>TRYB NA DWÓCH TELEFONACH</small><h2>Prawda i zgadywanie</h2><p>${esc(first)} odpowiada o sobie na pierwszej karcie. Później role zmieniają się automatycznie.</p><button class="button primary full" onclick="v094StartOnlineKnow()" ${ready()&&!active?'':'disabled'}>${active?'Najpierw dokończcie grę':'Rozpocznij 10 kart'}</button></article><article class="v091-mode-card local"><span>?</span><small>TRYB KLASYCZNY</small><h2>Jeden telefon</h2><p>Przekazujecie urządzenie i odsłaniacie odpowiedzi tak jak dotychczas.</p><button class="button secondary full" onclick="v094StartLocalKnow()">Graj na jednym telefonie</button></article></div><div class="v093-live-rules v094-rules"><article><span>1</span><div><strong>Jedna prawda</strong><small>Wyznaczona osoba wybiera odpowiedź, która naprawdę do niej pasuje.</small></div></article><article><span>2</span><div><strong>Jedno przewidywanie</strong><small>Partner na swoim telefonie próbuje wskazać tę samą opcję.</small></div></article><article><span>3</span><div><strong>Zmiana ról</strong><small>Po każdej karcie osoba odpowiadająca i zgadująca zamieniają się rolami.</small></div></article></div></section>`;
  setVersion();
}

function renderAnswering(row,question){
  const index=Number(live.viewIndex)||0;
  const subject=subjectMember(index);const guesser=guesserMember(index);
  const subjectTurn=ownIsSubject(index);const partnerDone=Boolean(row?.partner_done);
  const roleTitle=subjectTurn?'Odpowiedz szczerze o sobie':`Zgadnij odpowiedź: ${subject?.display_name||'partnera'}`;
  const roleText=subjectTurn?`${guesser?.display_name||'Partner'} próbuje przewidzieć Twój wybór.`:`Nie konsultuj wyboru z osobą: ${subject?.display_name||'partner'}.`;
  root.app.innerHTML=`<section class="panel v093-live-game v094-live-game"><div class="top-row"><button class="back-button" onclick="v094BackToLobby()">← Znasz mnie?</button><span class="chip connected-chip">● na żywo · ${index+1}/${QUESTION_COUNT}</span></div>${errorHtml()}${loadingHtml()}<div class="v093-live-head v094-live-head"><div><small>${esc(ownMember()?.display_name||'Ty')} · ${subjectTurn?'prawdziwa odpowiedź':'przewidywanie'}</small><h1>${esc(roleTitle)}</h1></div><span>${subjectTurn?'✓':'?'}</span></div><div class="v082-progress"><i style="width:${progressPercent()}%"></i></div><article class="v093-live-card v094-live-card"><div class="v094-subject-chip"><span>${subjectTurn?'O TOBIE':'O OSOBIE'}</span><strong>${esc(subject?.display_name||'Osoba')}</strong></div><small>KARTA ${index+1}</small><h2>${esc(question.prompt)}</h2><div class="v094-live-options">${question.options.map((option,optionIndex)=>`<button onclick="v094ChooseAnswer(${optionIndex})" ${live.loading?'disabled':''}><b>${String.fromCharCode(65+optionIndex)}</b><span>${esc(option)}</span></button>`).join('')}</div><p>${esc(roleText)}</p></article><div class="v093-partner-signal ${partnerDone?'done':''}"><span>${partnerDone?'✓':'🔒'}</span><p>${partnerDone?`${esc(partnerMember()?.display_name||'Druga osoba')} już wybrała. Twoja odpowiedź odsłoni wynik.`:`Odpowiedź ${esc(partnerMember()?.display_name||'drugiej osoby')} pozostaje ukryta.`}</p></div></section>`;
}

function renderWaiting(row,question){
  const index=Number(live.viewIndex)||0;const subjectTurn=ownIsSubject(index);
  root.app.innerHTML=`<section class="panel v093-live-game v094-live-game"><div class="top-row"><button class="back-button" onclick="v094BackToLobby()">← Znasz mnie?</button><span class="chip connected-chip">● odpowiedź zapisana</span></div>${errorHtml()}${loadingHtml()}<div class="v091-waiting v093-card-waiting"><span class="v091-wait-icon v094-wait-icon">${subjectTurn?'✓':'?'}</span><small>KARTA ${index+1}/${QUESTION_COUNT} · ${subjectTurn?'PRAWDA':'PRZEWIDYWANIE'}</small><h1>Czekamy na drugą odpowiedź</h1><p>${esc(question.prompt)}</p><div class="v091-wait-status"><div class="done"><span>✓</span><strong>${esc(ownMember()?.display_name||'Ty')}</strong><small>${esc(optionLabel(question,row.own_answer))}</small></div><div class="pending"><span>…</span><strong>${esc(partnerMember()?.display_name||'Druga osoba')}</strong><small>odpowiedź ukryta</small></div></div><button class="button primary full" onclick="v094Retry()">Sprawdź ponownie</button><button class="button tertiary full" onclick="v094BackToLobby()">Wróć — gra poczeka</button></div></section>`;
}

function renderReveal(row,question){
  const index=Number(live.viewIndex)||0;const subject=subjectMember(index);const guesser=guesserMember(index);
  const truth=truthAnswer(row,index);const guess=guessAnswer(row,index);const correct=Number(truth)===Number(guess);
  const revealed=revealedRows().length;const hits=correctCount();const last=index>=QUESTION_COUNT-1;const completed=live.session?.status==='completed';
  root.app.innerHTML=`<section class="panel v093-live-game v093-reveal v094-live-game"><div class="top-row"><button class="back-button" onclick="v094BackToLobby()">← Znasz mnie?</button><span class="chip connected-chip">● wspólne odsłonięcie</span></div>${errorHtml()}<div class="${correct?'result-success':'result-different'}"><div class="result-title">${correct?'Trafione!':'Nie tym razem'}</div></div><article class="v093-live-card revealed v094-live-card"><div class="v094-subject-chip"><span>PYTANIE O</span><strong>${esc(subject?.display_name||'Osobę')}</strong></div><small>KARTA ${index+1}</small><h2>${esc(question.prompt)}</h2><div class="result-answers v094-result-answers"><div class="result-answer truth"><span>Prawdziwa odpowiedź · ${esc(subject?.display_name||'Osoba')}</span><strong>${esc(optionLabel(question,truth))}</strong></div><div class="result-answer guess"><span>Przewidywanie · ${esc(guesser?.display_name||'Partner')}</span><strong>${esc(optionLabel(question,guess))}</strong></div></div><p>${correct?'Dobra znajomość! Osoba odpowiadająca może teraz dodać krótki przykład.':'To świetna okazja, żeby wyjaśnić prawdziwy wybór — bez oceniania przewidywania.'}</p></article><div class="v093-round-score v094-round-score"><span><b>${hits}</b> trafień</span><span><b>${revealed}</b> odsłoniętych</span></div><button class="button primary full" onclick="${last&&completed?'v094ShowSummary()':'v094NextQuestion()'}">${last&&completed?'Zobacz podsumowanie':'Zamiana ról · następna karta →'}</button></section>`;
}

function renderSummary(){
  const rows=revealedRows();const ids=live.session?.question_ids||[];const questions=questionMap();
  const hits=rows.filter(isCorrect).length;const score=Math.round(hits/Math.max(1,rows.length)*100);
  const title=hits>=9?'Czytacie sobie w myślach':hits>=7?'Naprawdę dobrze się znacie':hits>=4?'Sporo trafień i kilka niespodzianek':'Czas odkryć się trochę na nowo';
  root.app.innerHTML=`<section class="panel wide v091-online-summary v093-summary v094-summary"><div class="top-row"><button class="back-button" onclick="v094BackHome()">← Wszystkie gry</button><span class="chip connected-chip">● ukończona gra</span></div>${errorHtml()}<div class="v082-result-hero"><div class="v082-result-ring" style="--score:${score}"><strong>${score}%</strong><small>trafień</small></div><div><span class="eyebrow">JAK DOBRZE MNIE ZNASZ? · NA ŻYWO</span><h1>${title}</h1><p>Poprawnie przewidzieliście ${hits} z ${rows.length} odpowiedzi. Na każdej karcie role zmieniały się automatycznie.</p></div></div><div class="v082-result-list v093-result-list v094-result-list">${rows.map(item=>{const index=Number(item.question_index);const question=questions.get(ids[index]);const subject=subjectMember(index);const guesser=guesserMember(index);const truth=truthAnswer(item,index);const guess=guessAnswer(item,index);const correct=Number(truth)===Number(guess);return`<article class="${correct?'same':'different'}"><div><small>${index+1} · O ${esc(subject?.display_name||'osobie')}</small><h3>${esc(question?.prompt||'Pytanie')}</h3></div><div class="v082-result-answers"><span><b>Prawda · ${esc(subject?.display_name||'Osoba')}</b>${esc(optionLabel(question,truth))}</span><span><b>Typ · ${esc(guesser?.display_name||'Partner')}</b>${esc(optionLabel(question,guess))}</span></div><em>${correct?'Trafione ✓':'Pudło'}</em></article>`}).join('')}</div><div class="v091-summary-actions"><button class="button primary" onclick="v094StartOnlineKnow()">Nowa gra</button><button class="button secondary" onclick="v094BackHome()">Wszystkie gry</button><button class="button tertiary" onclick="v094CancelSession()">Usuń wynik z chmury</button></div><p class="v091-private-summary">Szczegółowe odpowiedzi pozostają wyłącznie w tej tymczasowej rozgrywce. Nowa gra zastępuje poprzedni wynik.</p></section>`;
}

function renderGame(){
  if(live.loading&&!live.state){root.app.innerHTML=`<section class="panel v091-lobby">${loadingHtml()}</section>`;return}
  if(!live.session||!live.state){renderLobby();return}
  if(live.session.status==='completed'&&live.showSummary){renderSummary();return}
  const row=rowAt();const question=currentQuestion();
  if(!row||!question){root.app.innerHTML=`<section class="panel"><h1>Nie znaleziono tej karty</h1><button class="button primary" onclick="v094Retry()">Odśwież grę</button></section>`;return}
  if(row.revealed){renderReveal(row,question);return}
  if(row.own_done){renderWaiting(row,question);return}
  renderAnswering(row,question);
}

function enhanceHome(){
  if(root.ui?.view!=='home')return;
  const card=[...document.querySelectorAll('.game-card')].find(node=>node.textContent?.includes('Jak dobrze mnie znasz')||node.textContent?.includes('Znasz mnie'));
  if(card){
    card.classList.add('v094-online-game-card');
    const badge=card.querySelector('.game-badge');if(badge)badge.textContent='ONLINE · 2 telefony';
    const meta=card.querySelector('.game-meta span:last-child');if(meta)meta.textContent='Prawda i zgadywanie →';
  }
  document.querySelector('.v094-home-session')?.remove();
  if(live.activeSession){
    const target=document.querySelector('.quick-actions')||document.querySelector('.daily-card');
    target?.insertAdjacentHTML('beforebegin',`<button class="v094-home-session" onclick="v094JoinSession('${esc(live.activeSession.id)}')"><span>?</span><div><small>AKTYWNA GRA NA DWÓCH TELEFONACH</small><strong>Znasz mnie? — prawda kontra przewidywanie</strong><p>Rundę rozpoczęła osoba: ${esc(creatorName(live.activeSession))}</p></div><i>Otwórz →</i></button>`);
  }
  if(!live.homeChecking&&Date.now()-live.homeCheckedAt>4000){
    live.homeChecking=true;
    queueMicrotask(async()=>{try{await refreshLobby({quiet:true})}finally{live.homeChecking=false}});
  }
}

root.render=function(){
  if(root.ui?.view===VIEW_LOBBY){renderLobby();window.scrollTo({top:0,behavior:'smooth'});return}
  if(root.ui?.view===VIEW_GAME){renderGame();setVersion();window.scrollTo({top:0,behavior:'smooth'});return}
  previousRender();enhanceHome();setVersion();
};

root.openGameInfo=function(id){return id==='know'?v094OpenKnow():previousOpenGameInfo?.(id)};
Object.assign(root,{
  v094OpenKnow,v094StartOnlineKnow,v094StartLocalKnow,v094JoinSession,v094ChooseAnswer,
  v094NextQuestion,v094ShowSummary,v094CancelSession,v094BackToLobby,v094BackHome,v094Retry,
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
