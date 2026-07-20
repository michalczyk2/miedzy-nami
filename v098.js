(function(root){
'use strict';

const RELEASE=root.MN_RELEASE||{version:'0.9.8'};
const VERSION=String(RELEASE.version||'0.9.8');
const core=root.MN_LIVE_MULTIPLAYER_CORE;
const base=root.MN_MULTIPLAYER_CORE;
const GAME_KEY='scale_live';
const QUESTION_COUNT=10;
const VIEW_LOBBY='v098-scale-lobby';
const VIEW_GAME='v098-scale-live';
const store=core?.storage?.(GAME_KEY);
const previousRender=root.render;
const previousOpenGameInfo=root.openGameInfo;

const live={
  session:null,state:null,activeSession:null,latestSession:null,viewIndex:null,
  loading:false,error:'',subscription:null,pollTimer:null,refreshing:false,
  homeChecking:false,homeCheckedAt:0,showSummary:false,pendingAnswer:null,
};
root.MN_V098_LIVE_SCALE=live;

function esc(value){return base?.esc?.(value)||String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]))}
function ready(){return Boolean(core?.ready?.())}
function ownMember(){return core?.ownMember?.()||null}
function partnerMember(){return core?.partnerMember?.()||null}
function memberName(userId){return core?.memberName?.(userId)||'Osoba'}
function setVersion(){base?.setVersion?.();document.documentElement.dataset.version=VERSION}
function setError(error){live.error=core?.friendlyError?.(error,'009_v098_live_scale_and_device_labels.sql')||String(error?.message||error||'Nieznany błąd');live.loading=false;console.error('[Między Nami v0.9.8]',error);root.render()}
function clearError(){live.error=''}
function errorHtml(){return live.error?`<div class="v083-friendly-error"><span>!</span><div><strong>Nie udało się wykonać tej czynności</strong><p>${esc(live.error)}</p></div><button onclick="v098Retry()">Spróbuj ponownie</button></div>`:''}
function loadingHtml(){return live.loading?'<div class="v091-loading"><i></i><span>Synchronizujemy dwa telefony…</span></div>':''}
function creatorName(session){return memberName(session?.created_by)}

function allCards(){try{if(typeof root.getAllCards==='function')return root.getAllCards();if(typeof getAllCards==='function')return getAllCards()}catch{}return[]}
function scaleQuestions(){return allCards().filter(card=>card?.mode==='scale'&&card?.type==='scale'&&card?.id&&card?.prompt&&card?.low&&card?.high)}
function questionMap(){return new Map(scaleQuestions().map(card=>[card.id,card]))}
function shuffled(items){return base?.shuffled?.(items)||[...(items||[])].sort(()=>Math.random()-.5)}
function answerRows(){return Array.isArray(live.state?.answers)?live.state.answers:[]}
function rowAt(index=live.viewIndex){return answerRows().find(item=>Number(item.question_index)===Number(index))||null}
function currentQuestion(){const id=live.session?.question_ids?.[Number(live.viewIndex)||0];return questionMap().get(id)||null}
function displayAnswer(value){const number=Number(value);return Number.isFinite(number)?number+1:'—'}
function revealedRows(){return answerRows().filter(item=>item.revealed)}
function answerDifference(row){return Math.abs(Number(row?.own_answer)-Number(row?.partner_answer))}
function exactCount(){return revealedRows().filter(row=>answerDifference(row)===0).length}
function closeCount(){return revealedRows().filter(row=>answerDifference(row)<=2).length}
function compatibility(row){return Math.max(0,100-answerDifference(row)*12)}
function progressPercent(){return Math.round((Math.min(QUESTION_COUNT,Number(live.viewIndex||0)+1)/QUESTION_COUNT)*100)}
function resultMeta(diff){if(diff===0)return{title:'Dokładnie tak samo!',className:'result-success',text:'Macie identyczne odczucie na tej skali.'};if(diff<=2)return{title:'Bardzo blisko',className:'result-success',text:'Różnica jest mała — rozumiecie tę sytuację podobnie.'};if(diff<=4)return{title:'Inna intensywność',className:'result-different',text:'Kierunek może być podobny, ale siła odczucia jest inna.'};return{title:'Dwa różne spojrzenia',className:'result-different',text:'Porównajcie, co sprawiło, że wybraliście tak odległe wartości.'}}

function cleanupSubscription(){core?.unsubscribe?.(live.subscription);live.subscription=null}
function stopPolling(){if(live.pollTimer)clearInterval(live.pollTimer);live.pollTimer=null}
function startPolling(){stopPolling();live.pollTimer=setInterval(()=>{if(root.ui?.view===VIEW_GAME&&document.visibilityState==='visible'&&navigator.onLine!==false)void refreshState({quiet:true})},3000)}
function subscribe(sessionId){cleanupSubscription();live.subscription=core?.subscribe?.('scale',sessionId,()=>void refreshState({quiet:true}))||null;startPolling()}

async function refreshLobby({quiet=false}={}){
  if(!ready()){live.activeSession=null;live.latestSession=null;live.homeCheckedAt=Date.now();if(!quiet)root.render();return}
  if(!quiet){live.loading=true;clearError();root.render()}
  try{
    const latest=await core.fetchLatestSession(GAME_KEY);
    live.latestSession=latest;live.activeSession=latest?.status==='active'?latest:null;live.homeCheckedAt=Date.now();live.loading=false;
    if(root.ui?.view===VIEW_LOBBY||!quiet)root.render();else if(root.ui?.view==='home')enhanceHome();
  }catch(error){live.homeCheckedAt=Date.now();if(!quiet)setError(error);else console.warn('[Między Nami v0.9.8 lobby]',error)}
}

async function refreshState({quiet=false}={}){
  if(live.refreshing||!live.session?.id)return;
  live.refreshing=true;if(!quiet){live.loading=true;clearError();root.render()}
  try{
    const state=await core.getState(live.session.id);
    live.state=state;live.session=state.session;live.latestSession=live.session;live.activeSession=live.session.status==='active'?live.session:null;
    if(live.viewIndex===null)live.viewIndex=Math.min(QUESTION_COUNT-1,store?.getIndex?.(live.session.id)||0);
    live.loading=false;live.refreshing=false;if(root.ui?.view===VIEW_GAME)root.render();
  }catch(error){live.refreshing=false;if(!quiet)setError(error);else console.warn('[Między Nami v0.9.8 state]',error)}
}

async function openSession(session,{showSummary=false}={}){
  if(!session?.id)return;
  live.loading=true;clearError();live.session=session;live.state=null;live.viewIndex=null;live.showSummary=Boolean(showSummary);live.pendingAnswer=null;
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

function v098OpenScale(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;live.pendingAnswer=null;clearError();root.ui.view=VIEW_LOBBY;root.render();void refreshLobby({quiet:true})}
async function v098StartOnlineScale(){
  if(!ready()){v098OpenScale();return}
  if(live.activeSession){await openSession(live.activeSession);return}
  const pool=scaleQuestions();if(pool.length<QUESTION_COUNT){setError(new Error('Brakuje pytań do rozpoczęcia gry.'));return}
  live.loading=true;clearError();root.render();
  try{const ids=shuffled(pool).slice(0,QUESTION_COUNT).map(card=>card.id);const session=await core.createSession(GAME_KEY,ids);live.activeSession=session;live.latestSession=session;live.viewIndex=0;store?.setIndex?.(session.id,0);await openSession(session)}catch(error){setError(error)}
}
function v098StartLocalScale(){cleanupSubscription();stopPolling();if(typeof previousOpenGameInfo==='function')previousOpenGameInfo('scale')}
async function v098JoinSession(sessionId){
  live.loading=true;clearError();root.ui.view=VIEW_GAME;root.render();
  try{let session=live.latestSession?.id===sessionId?live.latestSession:null;if(!session){const latest=await core.fetchLatestSession(GAME_KEY);session=latest?.id===sessionId?latest:null}if(!session)throw new Error('SESSION_NOT_FOUND');await openSession(session,{showSummary:session.status==='completed'})}catch(error){setError(error)}
}
function v098ChooseAnswer(answer){if(live.loading||!live.session?.id)return;live.pendingAnswer=Math.max(0,Math.min(9,Number(answer)));root.render()}
async function v098ConfirmAnswer(){
  if(live.loading||!live.session?.id||live.pendingAnswer===null)return;
  const index=Number(live.viewIndex)||0;const answer=Number(live.pendingAnswer);live.loading=true;clearError();root.render();
  try{const state=await core.submitAnswer(live.session.id,index,answer);live.state=state;live.session=state.session;live.latestSession=live.session;live.activeSession=live.session.status==='active'?live.session:null;live.loading=false;store?.setIndex?.(live.session.id,index);live.pendingAnswer=null;root.render()}catch(error){setError(error)}
}
function v098NextQuestion(){if(!live.session?.id)return;if(Number(live.viewIndex)>=QUESTION_COUNT-1){root.render();return}live.viewIndex=Number(live.viewIndex)+1;live.pendingAnswer=null;store?.setIndex?.(live.session.id,live.viewIndex);root.render()}
async function v098CancelSession(){
  if(!live.session?.id&&!live.latestSession?.id)return;const sessionId=live.session?.id||live.latestSession?.id;live.loading=true;clearError();root.render();
  try{await core.cancelSession(sessionId);cleanupSubscription();stopPolling();store?.setSession?.('');store?.clearIndex?.(sessionId);live.session=null;live.state=null;live.activeSession=null;live.latestSession=null;live.viewIndex=null;live.showSummary=false;live.pendingAnswer=null;live.loading=false;root.ui.view=VIEW_LOBBY;root.render()}catch(error){setError(error)}
}
function v098BackToLobby(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;live.pendingAnswer=null;root.ui.view=VIEW_LOBBY;root.render();void refreshLobby({quiet:true})}
function v098BackHome(){cleanupSubscription();stopPolling();live.session=null;live.state=null;live.viewIndex=null;live.showSummary=false;live.pendingAnswer=null;root.ui.view='home';root.render()}
function v098Retry(){clearError();if(root.ui?.view===VIEW_GAME&&live.session?.id)void refreshState();else void refreshLobby()}

function pairHtml(){
  if(ready())return`<div class="v091-pair-ready"><span>✓</span><div><strong>${esc(ownMember()?.display_name||'Ty')} + ${esc(partnerMember()?.display_name||'Partner')}</strong><small>Oboje oceniacie tę samą kartę niezależnie.</small></div></div>`;
  return`<div class="v091-pair-needed"><span>2</span><div><strong>Połączcie dwa konta</strong><small>Zalogujcie się na osobnych telefonach i użyjcie wspólnego kodu pary.</small></div><button class="button secondary" onclick="${typeof root.v08OpenAccount==='function'?'v08OpenAccount()':'showCloudModal()'}">Konto i synchronizacja</button></div>`;
}

function renderLobby(){
  const active=live.activeSession;const recent=live.latestSession?.status==='completed'?live.latestSession:null;
  root.app.innerHTML=`<section class="panel wide v091-lobby v093-lobby v098-lobby"><div class="top-row"><button class="back-button" onclick="v098BackHome()">← Wszystkie gry</button><span class="chip ${ready()?'connected-chip':''}">${ready()?'● gra na żywo':'jeden lub dwa telefony'}</span></div><div class="v091-lobby-hero v093-lobby-hero v098-lobby-hero"><span>10</span><div><small>SKALA 1–10</small><h1>Jak mocno to czujecie?</h1><p>Każde wybiera wartość od 1 do 10 na swoim telefonie. Wyniki pokażą się dopiero po odpowiedzi obojga.</p></div></div>${errorHtml()}${loadingHtml()}${pairHtml()}${active?`<button class="v091-active-session v093-active-session" onclick="v098JoinSession('${esc(active.id)}')"><span>▶</span><div><small>AKTYWNA GRA</small><strong>Rundę rozpoczęła osoba: ${esc(creatorName(active))}</strong><p>Wróćcie do tej samej skali i kontynuujcie.</p></div><i>Kontynuuj →</i></button>`:recent?`<button class="v091-active-session completed v093-active-session" onclick="v098JoinSession('${esc(recent.id)}')"><span>✓</span><div><small>GRA UKOŃCZONA</small><strong>Wasze porównanie jest gotowe</strong><p>Zobaczcie wartości, różnice i średnie dopasowanie.</p></div><i>Pokaż wynik →</i></button>`:''}<div class="v091-mode-grid"><article class="v091-mode-card online v093-mode-card"><span>📱📱</span><small>TRYB ONLINE</small><h2>Dwa telefony</h2><p>Każde ocenia tę samą sytuację prywatnie. Potem wspólnie odkrywacie obie liczby.</p><button class="button primary full" onclick="v098StartOnlineScale()" ${ready()&&!active?'':'disabled'}>${active?'Najpierw dokończcie grę':'Rozpocznij 10 skal'}</button></article><article class="v091-mode-card local"><span>↔</span><small>TRYB KLASYCZNY</small><h2>Jeden telefon</h2><p>Jedna osoba odpowiada z zadaną intensywnością, a partner zgaduje liczbę.</p><button class="button secondary full" onclick="v098StartLocalScale()">Graj na jednym telefonie</button></article></div><div class="v093-live-rules"><article><span>1</span><div><strong>Wybór od 1 do 10</strong><small>Zaznaczenie jest widoczne tylko na twoim telefonie.</small></div></article><article><span>2</span><div><strong>Odpowiedzi ukryte</strong><small>Partner widzi wyłącznie informację, że ruch został wykonany.</small></div></article><article><span>3</span><div><strong>Porównanie różnicy</strong><small>Po obu odpowiedziach zobaczycie liczby i odległość między nimi.</small></div></article></div></section>`;
}

function renderAnswering(row,question){
  const partnerDone=Boolean(row?.partner_done);const selected=live.pendingAnswer;
  root.app.innerHTML=`<section class="panel v093-live-game v098-scale-game"><div class="top-row"><button class="back-button" onclick="v098BackToLobby()">← Skala</button><span class="chip connected-chip">● na żywo · ${Number(live.viewIndex)+1}/${QUESTION_COUNT}</span></div>${errorHtml()}${loadingHtml()}<div class="v093-live-head"><div><small>${esc(ownMember()?.display_name||'Ty')} · oceń bez konsultowania</small><h1>Wybierz wartość</h1></div><span>${partnerDone?'✓':'…'}</span></div><div class="v082-progress"><i style="width:${progressPercent()}%"></i></div><article class="v093-live-card v098-scale-card"><small>SKALA ${Number(live.viewIndex)+1}</small><h2>${esc(question.prompt)}</h2><div class="v098-scale-ends"><span><b>1</b><small>${esc(question.low)}</small></span><i></i><span><b>10</b><small>${esc(question.high)}</small></span></div><div class="v098-number-grid">${Array.from({length:10},(_,index)=>`<button class="${selected===index?'selected':''}" onclick="v098ChooseAnswer(${index})" aria-pressed="${selected===index}" ${live.loading?'disabled':''}><strong>${index+1}</strong><i>${selected===index?'✓':''}</i></button>`).join('')}</div><div class="v098-selected-value">${selected===null?'Wybierz liczbę od 1 do 10':`Twój wybór: <strong>${selected+1}</strong>`}</div><button class="button primary full" onclick="v098ConfirmAnswer()" ${selected===null||live.loading?'disabled':''}>Zatwierdź wartość</button></article><div class="v093-partner-signal ${partnerDone?'done':''}"><span>${partnerDone?'✓':'🔒'}</span><p>${partnerDone?`${esc(partnerMember()?.display_name||'Druga osoba')} już odpowiedziała. Zatwierdź swoją liczbę, aby odsłonić wynik.`:`Wartość ${esc(partnerMember()?.display_name||'drugiej osoby')} pozostaje ukryta.`}</p></div></section>`;
}

function renderWaiting(row,question){
  root.app.innerHTML=`<section class="panel v093-live-game"><div class="top-row"><button class="back-button" onclick="v098BackToLobby()">← Skala</button><span class="chip connected-chip">● odpowiedź zapisana</span></div>${errorHtml()}${loadingHtml()}<div class="v091-waiting v093-card-waiting"><span class="v091-wait-icon">✓</span><small>SKALA ${Number(live.viewIndex)+1}/${QUESTION_COUNT}</small><h1>Czekamy na drugą ocenę</h1><p>${esc(question.prompt)}</p><div class="v091-wait-status"><div class="done"><span>✓</span><strong>${esc(ownMember()?.display_name||'Ty')}</strong><small>${displayAnswer(row.own_answer)}/10</small></div><div class="pending"><span>…</span><strong>${esc(partnerMember()?.display_name||'Druga osoba')}</strong><small>wartość ukryta</small></div></div><button class="button primary full" onclick="v098Retry()">Sprawdź ponownie</button><button class="button tertiary full" onclick="v098BackToLobby()">Wróć — gra poczeka</button></div></section>`;
}

function renderReveal(row,question){
  const diff=answerDifference(row);const meta=resultMeta(diff);const revealed=revealedRows().length;const exact=exactCount();const last=Number(live.viewIndex)>=QUESTION_COUNT-1;const completed=live.session?.status==='completed';
  root.app.innerHTML=`<section class="panel v093-live-game v093-reveal v098-reveal"><div class="top-row"><button class="back-button" onclick="v098BackToLobby()">← Skala</button><span class="chip connected-chip">● wspólne odsłonięcie</span></div>${errorHtml()}<div class="${meta.className}"><div class="result-title">${meta.title}</div></div><article class="v093-live-card revealed"><small>SKALA ${Number(live.viewIndex)+1}</small><h2>${esc(question.prompt)}</h2><div class="v098-reveal-numbers"><div><span>${esc(ownMember()?.display_name||'Ty')}</span><strong>${displayAnswer(row.own_answer)}</strong><small>/10</small></div><i>różnica <b>${diff}</b></i><div><span>${esc(partnerMember()?.display_name||'Druga osoba')}</span><strong>${displayAnswer(row.partner_answer)}</strong><small>/10</small></div></div><div class="v098-scale-ends compact"><span><b>1</b><small>${esc(question.low)}</small></span><i></i><span><b>10</b><small>${esc(question.high)}</small></span></div><p>${meta.text}</p></article><div class="v093-round-score"><span><b>${exact}</b> identycznych</span><span><b>${revealed}</b> odsłoniętych</span></div><button class="button primary full" onclick="${last&&completed?'v098ShowSummary()':'v098NextQuestion()'}">${last&&completed?'Zobacz podsumowanie':'Następna skala →'}</button></section>`;
}

function renderSummary(){
  const rows=revealedRows();const ids=live.session?.question_ids||[];const questions=questionMap();const exact=rows.filter(row=>answerDifference(row)===0).length;const close=rows.filter(row=>answerDifference(row)<=2).length;const averageGap=rows.length?(rows.reduce((sum,row)=>sum+answerDifference(row),0)/rows.length):0;const score=Math.round(rows.reduce((sum,row)=>sum+compatibility(row),0)/Math.max(1,rows.length));const title=score>=88?'Macie bardzo podobne wyczucie skali':score>=70?'Najczęściej czujecie podobną intensywność':score>=50?'Część ocen jest bliska, część wyraźnie inna':'Wasze skale często działają inaczej';
  root.app.innerHTML=`<section class="panel wide v091-online-summary v093-summary v098-summary"><div class="top-row"><button class="back-button" onclick="v098BackHome()">← Wszystkie gry</button><span class="chip connected-chip">● ukończona gra</span></div>${errorHtml()}<div class="v082-result-hero"><div class="v082-result-ring" style="--score:${score}"><strong>${score}%</strong><small>bliskości</small></div><div><span class="eyebrow">SKALA 1–10 · ONLINE</span><h1>${title}</h1><p>Identyczna wartość pojawiła się ${exact} razy. W ${close} z ${rows.length} kart różnica nie przekroczyła dwóch punktów. Średnia różnica: ${averageGap.toFixed(1)}.</p></div></div><div class="v082-result-list v093-result-list">${rows.map(item=>{const question=questions.get(ids[Number(item.question_index)]);const diff=answerDifference(item);return`<article class="${diff<=2?'same':'different'}"><div><small>${Number(item.question_index)+1}</small><h3>${esc(question?.prompt||'Pytanie')}</h3></div><div class="v082-result-answers"><span><b>${esc(ownMember()?.display_name||'Ty')}</b>${displayAnswer(item.own_answer)}/10</span><span><b>${esc(partnerMember()?.display_name||'Druga osoba')}</b>${displayAnswer(item.partner_answer)}/10</span></div><em>Różnica: ${diff}</em></article>`}).join('')}</div><div class="v091-summary-actions"><button class="button primary" onclick="v098StartOnlineScale()">Nowa gra</button><button class="button secondary" onclick="v098BackHome()">Wszystkie gry</button><button class="button tertiary" onclick="v098CancelSession()">Usuń wynik z chmury</button></div><p class="v091-private-summary">Szczegółowe wartości pozostają tylko w tej tymczasowej rozgrywce. Nowa gra zastępuje poprzedni wynik.</p></section>`;
}
function v098ShowSummary(){live.showSummary=true;root.render()}

function renderGame(){
  if(live.loading&&!live.state){root.app.innerHTML=`<section class="panel v091-lobby">${loadingHtml()}</section>`;return}
  if(!live.session||!live.state){renderLobby();return}
  if(live.session.status==='completed'&&live.showSummary){renderSummary();return}
  const row=rowAt();const question=currentQuestion();if(!row||!question){root.app.innerHTML=`<section class="panel"><h1>Nie znaleziono tej skali</h1><button class="button primary" onclick="v098Retry()">Odśwież grę</button></section>`;return}
  if(row.revealed){renderReveal(row,question);return}if(row.own_done){renderWaiting(row,question);return}renderAnswering(row,question)
}

function annotateDeviceModes(){
  const modes={
    'Fala':'local','Znasz mnie':'online','Kto bardziej':'online','Wybór':'online','Skala':'online',
    'Plan':'local','Słowa':'local','Historia':'local','Rozmowa':'local','Wyzwania':'local','Pikantne':'online',
  };
  document.querySelectorAll('.desktop-app').forEach(tile=>{
    const name=tile.querySelector('.desktop-app-name')?.textContent?.trim();const mode=modes[name];if(!mode)return;
    tile.dataset.deviceMode=mode;tile.querySelector('.v098-device-badge')?.remove();
    const icon=tile.querySelector('.desktop-app-icon');icon?.insertAdjacentHTML('beforeend',`<span class="v098-device-badge ${mode}">${mode==='online'?'1–2 TEL.':'1 TEL.'}</span>`);
  });
  const title=[...document.querySelectorAll('.desktop-section-title')].find(item=>item.querySelector('h2')?.textContent?.trim()==='Gry');
  if(title&&!document.querySelector('.v098-mode-legend'))title.insertAdjacentHTML('afterend','<div class="v098-mode-legend"><span class="online"><i></i><b>1–2 telefony</b> — dostępny tryb online</span><span class="local"><i></i><b>1 telefon</b> — wspólna gra na jednym urządzeniu</span></div>');
  const daily=document.querySelector('.daily-launch-card');if(daily&&!daily.querySelector('.v098-daily-badge'))daily.insertAdjacentHTML('beforeend','<span class="v098-daily-badge">2 TELEFONY</span>');
}

function annotateSpicyHub(){
  const hub=document.querySelector('.v082-spicy-hub');if(!hub)return;
  if(!hub.querySelector('.v098-spicy-legend'))hub.querySelector('.v082-safety-strip')?.insertAdjacentHTML('afterend','<div class="v098-spicy-legend"><b>Tryby:</b><span>📱📱 Dopasowanie i Ochota na dziś</span><span>📱 Bez tabu i Tylko we dwoje</span></div>');
  hub.querySelectorAll('.v082-game-grid button').forEach(tile=>{
    const online=/Dopasowanie 18\+|Ochota na dziś/.test(tile.textContent||'');tile.querySelector('.v098-spicy-badge')?.remove();tile.insertAdjacentHTML('beforeend',`<span class="v098-spicy-badge ${online?'online':'local'}">${online?'1–2 TEL.':'1 TEL.'}</span>`);
  });
}

function enhanceHome(){
  annotateDeviceModes();annotateSpicyHub();
  if(root.ui?.view!=='home')return;
  document.querySelector('.v098-home-session')?.remove();
  if(live.activeSession){const title=[...document.querySelectorAll('.desktop-section-title')].find(item=>item.querySelector('h2')?.textContent?.trim()==='Gry');title?.insertAdjacentHTML('beforebegin',`<button class="v093-home-session v098-home-session" onclick="v098JoinSession('${esc(live.activeSession.id)}')"><span>10</span><div><small>AKTYWNA GRA NA DWÓCH TELEFONACH</small><strong>Skala — kontynuujcie wspólne oceny</strong><p>Rundę rozpoczęła osoba: ${esc(creatorName(live.activeSession))}</p></div><i>Otwórz →</i></button>`)}
  if(!live.homeChecking&&Date.now()-live.homeCheckedAt>4000){live.homeChecking=true;queueMicrotask(async()=>{try{await refreshLobby({quiet:true})}finally{live.homeChecking=false}})}
}

root.render=function(){
  if(root.ui?.view===VIEW_LOBBY){renderLobby();window.scrollTo({top:0,behavior:'smooth'});return}
  if(root.ui?.view===VIEW_GAME){renderGame();setVersion();window.scrollTo({top:0,behavior:'smooth'});return}
  previousRender();enhanceHome();setVersion();
};
root.openGameInfo=function(id){return id==='scale'?v098OpenScale():previousOpenGameInfo?.(id)};
Object.assign(root,{v098OpenScale,v098StartOnlineScale,v098StartLocalScale,v098JoinSession,v098ChooseAnswer,v098ConfirmAnswer,v098NextQuestion,v098ShowSummary,v098CancelSession,v098BackToLobby,v098BackHome,v098Retry});
window.addEventListener('online',()=>{if(root.ui?.view===VIEW_GAME)void refreshState({quiet:true});if([VIEW_LOBBY,'home'].includes(root.ui?.view))void refreshLobby({quiet:true})});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState!=='visible')return;if(root.ui?.view===VIEW_GAME)void refreshState({quiet:true});if([VIEW_LOBBY,'home'].includes(root.ui?.view))void refreshLobby({quiet:true})});
setVersion();
})(globalThis);
