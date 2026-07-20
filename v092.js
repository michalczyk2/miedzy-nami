(function(root){
'use strict';

const core=root.MN_MULTIPLAYER_CORE;
if(!core){console.error('[Między Nami v0.9.2] Brak MN_MULTIPLAYER_CORE');return}

const VERSION=String(root.MN_RELEASE?.version||'0.9.2');
const GAME_KEY='spicy_desire';
const VIEW_LOBBY='v092-desire-lobby';
const VIEW_GAME='v092-desire-online';
const QUESTION_COUNT=5;
const QUESTIONS=Array.isArray(root.MN_V082_SPICY_MATCH)
  ? root.MN_V082_SPICY_MATCH.filter(item=>item.kind==='desire')
  : [];
const QUESTION_BY_ID=new Map(QUESTIONS.map(item=>[item.id,item]));
const store=core.storage('mn-v092',GAME_KEY);
const previousStartMatch=root.v082StartMatch;
const previousShowSpicyHub=root.showSpicyHub;
const previousRender=root.render;

const online={
  session:null,
  submissions:[],
  activeSession:null,
  recentSession:null,
  loading:false,
  error:'',
  subscription:null,
  hubChecking:false,
  hubCheckedAt:0,
};
root.MN_V092_DESIRE_MULTIPLAYER=online;

function esc(value){return core.esc(value)}
function currentUser(){return core.currentUser()}
function ownMember(){return core.ownMember()}
function partnerMember(){return core.partnerMember()}
function members(){return core.members()}
function ready(){return core.ready()}
function creatorName(session){return core.memberName(session?.created_by)}
function setError(error){
  online.error=core.friendlyError(error,'004_v092_multiplayer_choice_engine.sql');
  online.loading=false;
  console.error('[Między Nami Ochota na dziś]',error);
  render();
}
function clearError(){online.error=''}
function cleanupSubscription(){core.unsubscribe(online.subscription);online.subscription=null}
function subscribeToSession(sessionId){
  cleanupSubscription();
  online.subscription=core.subscribe('spicy-desire',sessionId,()=>refreshOnlineSession({quiet:true}));
}
function loadDraft(sessionId=online.session?.id){return store.loadDraft(sessionId,QUESTION_COUNT)}
function saveDraft(draft,sessionId=online.session?.id){store.saveDraft(sessionId,draft)}
function answerCount(draft){return draft.answers.filter(value=>value!==null&&value!==undefined&&Number.isInteger(Number(value))).length}
function memberName(userId){return core.memberName(userId)}
function orderedSubmissions(){return core.orderedSubmissions(online.submissions)}

async function fetchActiveSession(){return core.fetchActiveSession(GAME_KEY)}
async function fetchSessionById(sessionId){
  const session=await core.fetchSessionById(sessionId);
  return session?.game_key===GAME_KEY?session:null;
}

async function refreshLobby({force=false}={}){
  if(!ready()){
    online.activeSession=null;
    online.recentSession=null;
    online.hubCheckedAt=Date.now();
    if([VIEW_LOBBY,'v082-spicy-hub'].includes(root.ui?.view))render();
    return;
  }
  if(online.hubChecking)return;
  if(!force&&Date.now()-online.hubCheckedAt<3500)return;
  online.hubChecking=true;
  try{
    online.activeSession=await fetchActiveSession();
    online.recentSession=null;
    const lastId=store.getLastSession();
    if(!online.activeSession&&lastId){
      const recent=await fetchSessionById(lastId);
      if(recent?.status==='completed')online.recentSession=recent;
      else if(!recent)store.setLastSession('');
    }
    online.hubCheckedAt=Date.now();
  }catch(error){online.error=core.friendlyError(error,'004_v092_multiplayer_choice_engine.sql')}
  finally{
    online.hubChecking=false;
    if([VIEW_LOBBY,'v082-spicy-hub'].includes(root.ui?.view))render();
  }
}

function v092OpenDesire(){
  clearError();
  root.ui.view=VIEW_LOBBY;
  render();
  void refreshLobby({force:true});
}
function v092StartLocalDesire(){
  cleanupSubscription();
  online.session=null;online.submissions=[];online.error='';
  if(typeof previousStartMatch==='function')previousStartMatch('desire');
}
async function v092StartOnlineDesire(){
  if(!ready()){
    online.error='Aby grać na dwóch telefonach, zalogujcie się i połączcie konta kodem pary.';
    render();return;
  }
  if(QUESTIONS.length<QUESTION_COUNT){online.error='Brakuje pytań do utworzenia rundy.';render();return}
  online.loading=true;clearError();render();
  try{
    const ids=core.shuffled(QUESTIONS).slice(0,QUESTION_COUNT).map(item=>item.id);
    const session=await core.createSession(GAME_KEY,ids);
    online.session=session;
    online.activeSession=session;
    online.recentSession=null;
    online.submissions=[];
    store.setLastSession(session.id);
    saveDraft({index:0,answers:Array(QUESTION_COUNT).fill(null),submitted:false},session.id);
    subscribeToSession(session.id);
    root.ui.view=VIEW_GAME;
  }catch(error){setError(error);return}
  finally{online.loading=false}
  render();
}
async function v092JoinSession(sessionId){
  if(!ready()){online.error='Najpierw zaloguj się i połącz konto z partnerem.';render();return}
  online.loading=true;clearError();render();
  try{
    const session=await fetchSessionById(sessionId||online.activeSession?.id||store.getLastSession());
    if(!session)throw new Error('SESSION_NOT_FOUND');
    online.session=session;
    store.setLastSession(session.id);
    subscribeToSession(session.id);
    online.submissions=await core.fetchSubmissions(session.id);
    root.ui.view=VIEW_GAME;
  }catch(error){setError(error);return}
  finally{online.loading=false}
  render();
}
async function refreshOnlineSession({quiet=false}={}){
  if(!online.session?.id||!ready())return;
  if(!quiet){online.loading=true;render()}
  try{
    const session=await fetchSessionById(online.session.id);
    if(!session){
      online.session=null;online.submissions=[];store.setLastSession('');
      if(root.ui?.view===VIEW_GAME){root.ui.view=VIEW_LOBBY;online.error='Ta runda została zakończona. Możecie rozpocząć nową.'}
      return;
    }
    online.session=session;
    online.submissions=await core.fetchSubmissions(session.id);
    online.activeSession=session.status==='active'?session:null;
    online.recentSession=session.status==='completed'?session:null;
  }catch(error){online.error=core.friendlyError(error,'004_v092_multiplayer_choice_engine.sql')}
  finally{
    online.loading=false;
    if([VIEW_GAME,VIEW_LOBBY].includes(root.ui?.view))render();
  }
}
function currentQuestion(){
  const draft=loadDraft();
  return QUESTION_BY_ID.get(online.session?.question_ids?.[draft.index]);
}
async function v092ChooseAnswer(answer){
  const session=online.session;if(!session)return;
  const draft=loadDraft(session.id);
  if(draft.submitted||session.status==='completed')return;
  draft.answers[draft.index]=Number(answer);
  if(draft.index<session.question_ids.length-1){
    draft.index++;
    saveDraft(draft,session.id);
    render();return;
  }
  saveDraft(draft,session.id);
  await v092SubmitAnswers();
}
function v092PreviousQuestion(){
  const draft=loadDraft();
  if(draft.submitted||draft.index<=0)return;
  draft.index--;
  saveDraft(draft);
  render();
}
async function v092SubmitAnswers(){
  const session=online.session;if(!session)return;
  const draft=loadDraft(session.id);
  if(answerCount(draft)!==QUESTION_COUNT){online.error='Odpowiedz na wszystkie 5 pytań.';render();return}
  online.loading=true;clearError();render();
  try{
    const answers=draft.answers.map(Number);
    await core.submitSession(session.id,answers);
    draft.submitted=true;
    saveDraft(draft,session.id);
    await refreshOnlineSession({quiet:true});
  }catch(error){setError(error);return}
  finally{online.loading=false}
  render();
}
async function v092CancelSession(){
  const session=online.session||online.activeSession||online.recentSession;if(!session)return;
  if(!confirm('Usunąć tę rundę na obu telefonach? Odpowiedzi zostaną skasowane.'))return;
  online.loading=true;render();
  try{
    await core.cancelSession(session.id);
    cleanupSubscription();
    saveDraft(null,session.id);
    store.setLastSession('');
    online.session=null;online.activeSession=null;online.recentSession=null;online.submissions=[];
    root.ui.view=VIEW_LOBBY;
    if(typeof root.toast==='function')root.toast('Runda została usunięta.');
  }catch(error){setError(error);return}
  finally{online.loading=false}
  render();
}
function v092BackToLobby(){cleanupSubscription();root.ui.view=VIEW_LOBBY;render();void refreshLobby({force:true})}
function v092BackToHub(){cleanupSubscription();online.session=null;online.submissions=[];root.ui.view='v082-spicy-hub';render();void refreshLobby({force:true})}

function errorHtml(){return online.error?`<div class="v091-error" role="alert">${esc(online.error)}</div>`:''}
function loadingHtml(){return online.loading?'<div class="v091-loading"><span></span><span></span><span></span><small>Synchronizuję oba telefony…</small></div>':''}
function renderLobby(){
  const isReady=ready();
  const active=online.activeSession;
  const recent=online.recentSession;
  const own=ownMember(),partner=partnerMember();
  const accountAction=typeof root.showCloudHub==='function'?'showCloudHub()':'goHome()';
  root.app.innerHTML=`<section class="panel wide v091-lobby v092-lobby"><div class="top-row"><button class="back-button" onclick="v092BackToHub()">← Pikantne</button><span class="chip ${isReady?'connected-chip':''}">${isReady?'● dwa telefony':'tryb wyboru'}</span></div><div class="v091-lobby-hero v092-lobby-hero"><span>🔥</span><div><small>OCHOTA NA DZIŚ</small><h1>Sprawdźcie, czego oboje chcecie</h1><p>Każde odpowiada osobno na 5 szybkich pytań. Aplikacja pokaże wspólne wybory dopiero po ukończeniu przez oboje.</p></div></div>${errorHtml()}${loadingHtml()}${isReady?`<div class="v091-pair-ready"><span>✓</span><div><strong>${esc(own?.display_name)} + ${esc(partner?.display_name)}</strong><small>Odpowiedzi są prywatne do wspólnego końca rundy.</small></div></div>`:`<div class="v091-pair-needed"><span>2</span><div><strong>Połączcie dwa konta</strong><small>Zalogujcie się na osobnych telefonach i wpiszcie wspólny kod pary.</small></div><button class="button secondary" onclick="${accountAction}">Konto i synchronizacja</button></div>`}${active?`<button class="v091-active-session v092-active-session" onclick="v092JoinSession('${esc(active.id)}')"><span>▶</span><div><small>AKTYWNA RUNDA</small><strong>${esc(creatorName(active))} rozpoczął lub rozpoczęła Ochotę na dziś</strong><p>Dołącz i odpowiedz na pięć pytań na swoim telefonie.</p></div><i>Kontynuuj →</i></button>`:recent?`<button class="v091-active-session completed v092-active-session" onclick="v092JoinSession('${esc(recent.id)}')"><span>✓</span><div><small>WSPÓLNY PLAN GOTOWY</small><strong>Oboje ukończyliście Ochotę na dziś</strong><p>Otwórzcie wspólne wybory i rzeczy do ustalenia.</p></div><i>Pokaż wynik →</i></button>`:''}<div class="v091-mode-grid"><article class="v091-mode-card online v092-mode-card"><span>📱📱</span><small>REKOMENDOWANE</small><h2>Dwa telefony</h2><p>Każde wybiera u siebie. Na końcu zobaczycie wspólne pomysły na najbliższą okazję.</p><button class="button primary full" onclick="v092StartOnlineDesire()" ${isReady&&!active?'':'disabled'}>${active?'Najpierw dokończcie rundę':'Rozpocznij nową rundę'}</button></article><article class="v091-mode-card local"><span>↔</span><small>TRYB LOKALNY</small><h2>Jeden telefon</h2><p>Odpowiadacie kolejno, przekazując sobie jedno urządzenie.</p><button class="button secondary full" onclick="v092StartLocalDesire()">Graj na jednym telefonie</button></article></div><div class="v091-privacy-note"><span>🔒</span><div><strong>Bez szczegółowej historii</strong><p>Wynik nie trafia do ogólnej historii. Nowa runda usuwa poprzednie odpowiedzi tej gry z chmury.</p></div></div></section>`;
}
function renderAnswering(session,draft){
  const question=currentQuestion();
  if(!question){online.error='Nie udało się odczytać pytania tej rundy.';renderLobby();return}
  const progress=Math.round((draft.index/session.question_ids.length)*100);
  root.app.innerHTML=`<section class="panel v082-match-panel v091-online-game v092-online-game"><div class="top-row"><button class="back-button" onclick="v092BackToLobby()">← Ochota na dziś</button><span class="chip connected-chip">● online · ${draft.index+1}/${session.question_ids.length}</span></div>${errorHtml()}${loadingHtml()}<div class="v082-match-head"><span>🔥</span><div><small>${esc(ownMember()?.display_name||'Ty')} · odpowiedz tylko dla siebie</small><h1>Ochota na dziś</h1></div></div><div class="v082-progress"><i style="width:${progress}%"></i></div><article class="v082-question-card"><small>PYTANIE ${draft.index+1}</small><h2>${esc(question.prompt)}</h2><div class="v082-answer-grid">${question.options.map((option,index)=>`<button onclick="v092ChooseAnswer(${index})"><b>${String.fromCharCode(65+index)}</b><span>${esc(option)}</span></button>`).join('')}</div></article><div class="v091-question-footer"><button class="button tertiary" onclick="v092PreviousQuestion()" ${draft.index===0?'disabled':''}>← Poprzednie</button><p>🔒 ${esc(partnerMember()?.display_name||'Druga osoba')} nie zobaczy odpowiedzi przed wspólnym końcem.</p></div></section>`;
}
function renderWaiting(session){
  const partnerDone=online.submissions.some(item=>item.user_id===partnerMember()?.user_id);
  root.app.innerHTML=`<section class="panel v082-match-panel v091-online-game v092-online-game"><div class="top-row"><button class="back-button" onclick="v092BackToLobby()">← Ochota na dziś</button><span class="chip connected-chip">● odpowiedzi wysłane</span></div>${errorHtml()}${loadingHtml()}<div class="v091-waiting"><span class="v091-wait-icon v092-wait-icon">✓</span><small>TWOJE WYBORY SĄ ZAPISANE</small><h1>${partnerDone?'Oboje skończyliście':'Czekamy na drugą osobę'}</h1><p>${partnerDone?'Układamy wasz wspólny plan.':`${esc(partnerMember()?.display_name||'Partner lub partnerka')} może odpowiedzieć teraz albo wrócić później. Twoje wybory nadal są ukryte.`}</p><div class="v091-wait-status"><div class="done"><span>✓</span><strong>${esc(ownMember()?.display_name||'Ty')}</strong><small>gotowe</small></div><div class="${partnerDone?'done':'pending'}"><span>${partnerDone?'✓':'…'}</span><strong>${esc(partnerMember()?.display_name||'Druga osoba')}</strong><small>${partnerDone?'gotowe':'jeszcze odpowiada'}</small></div></div><button class="button primary full" onclick="refreshDesireSession()">Sprawdź wynik</button><button class="button tertiary full" onclick="v092BackToLobby()">Wróć — wynik poczeka</button>${session.created_by===currentUser()?.id?'<button class="link-button danger-text" onclick="v092CancelSession()">Anuluj rundę i usuń odpowiedzi</button>':''}</div></section>`;
}
function formatChoice(question,answerIndex,member,other){
  if(question.id==='v082-desire-06'){
    if(answerIndex===0)return member?.display_name||'Ja';
    if(answerIndex===1)return other?.display_name||'Partner lub partnerka';
  }
  return question.options?.[answerIndex]||'—';
}
function evaluate(question,left,right){
  if(question.id==='v082-desire-06'){
    const complementary=(left===0&&right===1)||(left===1&&right===0);
    const shared=[2,3].includes(left)&&left===right;
    return{aligned:complementary||shared,kind:complementary?'complementary':shared?'same':'different'};
  }
  return{aligned:left===right,kind:left===right?'same':'different'};
}
function alignedLabel(row){
  if(row.kind==='complementary')return'Pasuje do siebie ✓';
  if(row.kind==='same')return'Ten sam wybór ✓';
  return'Do ustalenia';
}
function renderSummary(session){
  const submissions=orderedSubmissions();
  if(submissions.length<2){renderWaiting(session);return}
  const orderedMembers=core.orderedMembers();
  const rows=session.question_ids.map((id,index)=>{
    const question=QUESTION_BY_ID.get(id);
    const left=Number(submissions[0]?.answers?.[index]);
    const right=Number(submissions[1]?.answers?.[index]);
    if(!question)return null;
    return{question,left,right,...evaluate(question,left,right)};
  }).filter(Boolean);
  const aligned=rows.filter(row=>row.aligned);
  const score=Math.round(aligned.length/Math.max(1,rows.length)*100);
  const title=aligned.length===5?'Macie gotowy wspólny plan':aligned.length>=3?'Dużo rzeczy wam się zgadza':aligned.length>=1?'Jest od czego zacząć':'Dziś macie różne pomysły';
  const planHtml=aligned.length?aligned.map(row=>{
    const leftChoice=formatChoice(row.question,row.left,orderedMembers[0],orderedMembers[1]);
    const rightChoice=formatChoice(row.question,row.right,orderedMembers[1],orderedMembers[0]);
    const leader=row.kind==='complementary'?(row.left===0?orderedMembers[0]:orderedMembers[1]):null;
    const choice=row.kind==='complementary'?`${leader?.display_name||'Jedna osoba'} prowadzi — oboje wybraliście ten układ`:leftChoice;
    return`<article><span>✓</span><div><small>${esc(row.question.prompt)}</small><strong>${esc(choice)}</strong></div></article>`;
  }).join(''):'<article class="empty"><span>↔</span><div><strong>Wybierzcie jedną bezpieczną opcję wspólnie</strong><small>Różne odpowiedzi to zaproszenie do rozmowy, nie obowiązek kompromisu.</small></div></article>';
  root.app.innerHTML=`<section class="panel wide v082-match-panel v091-online-summary v092-online-summary"><div class="top-row"><button class="back-button" onclick="v092BackToHub()">← Pikantne</button><span class="chip connected-chip">● wspólny wynik</span></div>${errorHtml()}<div class="v082-result-hero v092-result-hero"><div class="v082-result-ring" style="--score:${score}"><strong>${aligned.length}/5</strong><small>wspólnych</small></div><div><span class="eyebrow">OCHOTA NA DZIŚ · ONLINE</span><h1>${title}</h1><p>Najpierw zobaczcie rzeczy, które pasują do obojga. Pozostałe odpowiedzi służą tylko do spokojnego ustalenia granic i nastroju.</p></div></div><section class="v092-common-plan"><div class="v092-section-title"><span>🔥</span><div><small>WSPÓLNE WYBORY</small><h2>Wasz kierunek na najbliższą okazję</h2></div></div>${planHtml}</section><div class="v082-result-list v092-result-list">${rows.map((row,index)=>`<article class="${row.aligned?'same':'different'}"><div><small>${index+1}</small><h3>${esc(row.question.prompt)}</h3></div><div class="v082-result-answers"><span><b>${esc(orderedMembers[0]?.display_name||'Osoba 1')}</b>${esc(formatChoice(row.question,row.left,orderedMembers[0],orderedMembers[1]))}</span><span><b>${esc(orderedMembers[1]?.display_name||'Osoba 2')}</b>${esc(formatChoice(row.question,row.right,orderedMembers[1],orderedMembers[0]))}</span></div><em>${alignedLabel(row)}</em></article>`).join('')}</div><div class="v091-summary-actions"><button class="button primary" onclick="v092StartOnlineDesire()">Nowa runda</button><button class="button secondary" onclick="v092BackToHub()">Inna gra</button><button class="button tertiary" onclick="v092CancelSession()">Usuń wynik z chmury</button></div><p class="v091-private-summary">Nic z tej rundy nie trafia do zwykłej historii. Realizujecie wyłącznie te pomysły, na które oboje nadal świadomie się zgadzacie.</p></section>`;
}
function renderOnlineGame(){
  const session=online.session;
  if(online.loading&&!session){root.app.innerHTML=`<section class="panel v091-lobby">${loadingHtml()}</section>`;return}
  if(!session){root.ui.view=VIEW_LOBBY;renderLobby();return}
  const draft=loadDraft(session.id);
  const ownSubmission=online.submissions.find(item=>item.user_id===currentUser()?.id);
  if(session.status==='completed'){renderSummary(session);return}
  if(draft.submitted||ownSubmission){
    if(!draft.submitted){draft.submitted=true;saveDraft(draft,session.id)}
    renderWaiting(session);return;
  }
  renderAnswering(session,draft);
}
function enhanceSpicyHub(){
  if(root.ui?.view!=='v082-spicy-hub')return;
  const tile=[...document.querySelectorAll('.v082-game-tile')].find(node=>node.textContent?.includes('Ochota na dziś'));
  if(tile){
    tile.setAttribute('onclick','v092OpenDesire()');
    const meta=tile.querySelector('small');if(meta)meta.textContent=ready()?'5 pytań · dwa telefony':'5 pytań · jeden lub dwa telefony';
    if(ready()&&!tile.querySelector('.v091-online-badge'))tile.insertAdjacentHTML('beforeend','<span class="v091-online-badge v092-online-badge">ONLINE</span>');
  }
  document.querySelector('.v092-hub-session')?.remove();
  const hubSession=online.activeSession||online.recentSession;
  if(hubSession){
    const completed=hubSession.status==='completed';
    const grid=document.querySelector('.v082-game-grid');
    grid?.insertAdjacentHTML('beforebegin',`<button class="v091-hub-session v092-hub-session ${completed?'completed':''}" onclick="v092JoinSession('${esc(hubSession.id)}')"><span>${completed?'✓':'🔥'}</span><div><small>${completed?'WSPÓLNY PLAN GOTOWY':'AKTYWNA OCHOTA NA DZIŚ'}</small><strong>${completed?'Zobaczcie, co wybraliście wspólnie':'Dokończcie 5 szybkich pytań'}</strong><p>${completed?'Oboje odpowiedzieliście.':`${esc(creatorName(hubSession))} rozpoczął lub rozpoczęła rundę.`}</p></div><i>${completed?'Wynik →':'Otwórz →'}</i></button>`);
  }
  if(!online.hubChecking&&Date.now()-online.hubCheckedAt>3500)queueMicrotask(()=>void refreshLobby());
}

root.render=function(){
  if(root.ui?.view===VIEW_LOBBY){renderLobby();core.setVersion();return}
  if(root.ui?.view===VIEW_GAME){renderOnlineGame();core.setVersion();return}
  previousRender();
  enhanceSpicyHub();
  core.setVersion();
};
function wrappedShowSpicyHub(){
  if(typeof previousShowSpicyHub==='function')previousShowSpicyHub();
  void refreshLobby({force:true});
}
root.v082StartMatch=function(kind){return kind==='desire'?v092OpenDesire():previousStartMatch?.(kind)};
root.showSpicyHub=wrappedShowSpicyHub;
root.startSpicyPack=wrappedShowSpicyHub;
Object.assign(root,{
  v092OpenDesire,v092StartLocalDesire,v092StartOnlineDesire,v092JoinSession,
  v092ChooseAnswer,v092PreviousQuestion,v092SubmitAnswers,v092CancelSession,
  v092BackToLobby,v092BackToHub,refreshDesireSession:refreshOnlineSession,
});
window.addEventListener('online',()=>{
  if(root.ui?.view===VIEW_GAME)void refreshOnlineSession({quiet:true});
  if([VIEW_LOBBY,'v082-spicy-hub'].includes(root.ui?.view))void refreshLobby({force:true});
});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible')return;
  if(root.ui?.view===VIEW_GAME)void refreshOnlineSession({quiet:true});
  if([VIEW_LOBBY,'v082-spicy-hub'].includes(root.ui?.view))void refreshLobby({force:true});
});
core.setVersion();
})(globalThis);
