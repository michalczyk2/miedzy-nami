(function(){
'use strict';

const RELEASE=globalThis.MN_RELEASE||{version:'0.9.1'};
const VERSION=String(RELEASE.version||'0.9.1');
const GAME_KEY='spicy_match';
const VIEW_LOBBY='v091-spicy-lobby';
const VIEW_GAME='v091-spicy-online';
const LAST_SESSION_PREFIX='mn-v091-spicy-session';
const DRAFT_PREFIX='mn-v091-spicy-draft';
const QUESTIONS=Array.isArray(globalThis.MN_V082_SPICY_MATCH)
  ? globalThis.MN_V082_SPICY_MATCH.filter(item=>item.kind==='match')
  : [];
const QUESTION_BY_ID=new Map(QUESTIONS.map(item=>[item.id,item]));
const legacyStartMatch=globalThis.v082StartMatch;
const legacyShowSpicyHub=globalThis.showSpicyHub;

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
  archiving:false,
};

globalThis.MN_V091_MULTIPLAYER=online;

function esc(value){
  if(typeof globalThis.escapeHtml==='function')return globalThis.escapeHtml(String(value??''));
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}
function cloud(){return globalThis.MN_CLOUD_RUNTIME||null}
function client(){return cloud()?.client||null}
function currentUser(){return cloud()?.user||null}
function currentCouple(){return cloud()?.couple||null}
function members(){return Array.isArray(cloud()?.members)?cloud().members:[]}
function ownMember(){return members().find(item=>item.user_id===currentUser()?.id)||null}
function partnerMember(){return members().find(item=>item.user_id!==currentUser()?.id)||null}
function onlineReady(){return Boolean(client()&&currentUser()&&currentCouple()&&ownMember()&&members().length===2)}
function shuffled(items){
  const copy=[...items];
  for(let index=copy.length-1;index>0;index--){
    const target=Math.floor(Math.random()*(index+1));
    [copy[index],copy[target]]=[copy[target],copy[index]];
  }
  return copy;
}
function setVersion(){
  document.documentElement.dataset.version=VERSION;
  document.title=`Między Nami ${VERSION} — gry dla par`;
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>{node.textContent=`v${VERSION}`});
  const hero=document.querySelector('.desktop-welcome .eyebrow');
  if(hero)hero.textContent=hero.textContent.replace(/v0\.\d+\.\d+|v0\.6\.0/g,`v${VERSION}`);
}
function friendlyError(error){
  const raw=String(error?.message||error||'Nieznany błąd');
  const lower=raw.toLowerCase();
  if(lower.includes('create_spicy_match_session')||lower.includes('multiplayer_sessions')||lower.includes('multiplayer_submissions')||lower.includes('schema cache'))return'Tryb dwóch telefonów wymaga aktualizacji bazy. Uruchom migrację 003_v091_spicy_match_two_phones.sql w Supabase.';
  if(lower.includes('partner_required'))return'Druga osoba musi najpierw dołączyć do waszej pary.';
  if(lower.includes('couple_required'))return'Najpierw połączcie konta kodem pary.';
  if(lower.includes('session_expired'))return'Ta runda wygasła. Rozpocznijcie nową.';
  if(lower.includes('session_not_found'))return'Ta runda nie jest już dostępna. Rozpocznijcie nową.';
  if(lower.includes('session_not_active'))return'Ta runda została już zakończona albo zastąpiona nową.';
  if(lower.includes('load failed')||lower.includes('failed to fetch')||lower.includes('network'))return'Nie udało się połączyć z drugim telefonem. Sprawdź internet i spróbuj ponownie.';
  if(typeof globalThis.MN_FRIENDLY_ERROR==='function')return globalThis.MN_FRIENDLY_ERROR(error);
  return raw;
}
function setError(error){online.error=friendlyError(error);online.loading=false;console.error('[Między Nami multiplayer]',error);render()}
function clearError(){online.error=''}
function sessionKey(){return`${LAST_SESSION_PREFIX}:${currentCouple()?.id||'none'}:${currentUser()?.id||'none'}`}
function lastSessionId(){return localStorage.getItem(sessionKey())||''}
function saveLastSession(id){if(id)localStorage.setItem(sessionKey(),id);else localStorage.removeItem(sessionKey())}
function draftKey(sessionId=online.session?.id){return`${DRAFT_PREFIX}:${sessionId||'none'}:${currentUser()?.id||'none'}`}
function loadDraft(sessionId=online.session?.id){
  try{
    const parsed=JSON.parse(localStorage.getItem(draftKey(sessionId))||'null');
    if(parsed&&Array.isArray(parsed.answers))return parsed;
  }catch{}
  return{index:0,answers:[],submitted:false};
}
function saveDraft(draft,sessionId=online.session?.id){
  if(!sessionId)return;
  if(draft)localStorage.setItem(draftKey(sessionId),JSON.stringify(draft));
  else localStorage.removeItem(draftKey(sessionId));
}
function cleanupSubscription(){
  const api=client();
  if(api&&online.subscription)api.removeChannel(online.subscription).catch(()=>{});
  online.subscription=null;
}
function subscribeToSession(sessionId){
  cleanupSubscription();
  const api=client();
  if(!api||!sessionId)return;
  online.subscription=api.channel(`mn-spicy-match-${sessionId}-${currentUser()?.id||'user'}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'multiplayer_sessions',filter:`id=eq.${sessionId}`},()=>refreshOnlineSession({quiet:true}))
    .on('postgres_changes',{event:'*',schema:'public',table:'multiplayer_submissions',filter:`session_id=eq.${sessionId}`},()=>refreshOnlineSession({quiet:true}))
    .subscribe();
}
function memberName(userId){return members().find(item=>item.user_id===userId)?.display_name||'Osoba'}
function creatorName(session){return memberName(session?.created_by)}
function orderedSubmissions(){
  const byUser=new Map(online.submissions.map(item=>[item.user_id,item]));
  return [...members()].sort((a,b)=>Number(a.role_index)-Number(b.role_index)).map(member=>byUser.get(member.user_id)).filter(Boolean);
}

async function fetchActiveSession(){
  if(!onlineReady())return null;
  const{data,error}=await client().from('multiplayer_sessions')
    .select('id,couple_id,game_key,question_ids,status,created_by,created_at,completed_at,expires_at')
    .eq('couple_id',currentCouple().id)
    .eq('game_key',GAME_KEY)
    .eq('status','active')
    .gt('expires_at',new Date().toISOString())
    .order('created_at',{ascending:false})
    .limit(1)
    .maybeSingle();
  if(error)throw error;
  return data||null;
}
async function fetchSessionById(sessionId){
  if(!onlineReady()||!sessionId)return null;
  const{data,error}=await client().from('multiplayer_sessions')
    .select('id,couple_id,game_key,question_ids,status,created_by,created_at,completed_at,expires_at')
    .eq('id',sessionId)
    .maybeSingle();
  if(error)throw error;
  return data||null;
}
async function fetchSubmissions(sessionId){
  const{data,error}=await client().from('multiplayer_submissions')
    .select('session_id,user_id,answers,completed_at')
    .eq('session_id',sessionId)
    .order('completed_at');
  if(error)throw error;
  return data||[];
}

async function refreshLobby({force=false}={}){
  if(!onlineReady()){
    online.activeSession=null;
    online.hubCheckedAt=Date.now();
    if(globalThis.ui?.view===VIEW_LOBBY||globalThis.ui?.view==='v082-spicy-hub')render();
    return;
  }
  if(online.hubChecking)return;
  if(!force&&Date.now()-online.hubCheckedAt<3500)return;
  online.hubChecking=true;
  try{
    online.activeSession=await fetchActiveSession();
    online.recentSession=null;
    if(!online.activeSession&&lastSessionId()){
      const recent=await fetchSessionById(lastSessionId());
      if(recent?.status==='completed')online.recentSession=recent;
    }
    online.hubCheckedAt=Date.now();
  }catch(error){online.error=friendlyError(error)}
  finally{
    online.hubChecking=false;
    if(globalThis.ui?.view===VIEW_LOBBY||globalThis.ui?.view==='v082-spicy-hub')render();
  }
}

function v091OpenMatch(){
  clearError();
  globalThis.ui.view=VIEW_LOBBY;
  render();
  void refreshLobby({force:true});
}
function v091StartLocalMatch(){
  cleanupSubscription();
  online.session=null;online.submissions=[];online.error='';
  if(typeof legacyStartMatch==='function')legacyStartMatch('match');
}
async function v091StartOnlineMatch(){
  if(!onlineReady()){
    online.error='Aby grać na dwóch telefonach, zalogujcie się i połączcie konta kodem pary.';
    render();return;
  }
  if(QUESTIONS.length<8){online.error='Brakuje pytań do utworzenia rundy.';render();return}
  online.loading=true;clearError();render();
  try{
    const ids=shuffled(QUESTIONS).slice(0,8).map(item=>item.id);
    const{data,error}=await client().rpc('create_spicy_match_session',{p_question_ids:ids});
    if(error)throw error;
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.session_id)throw new Error('SESSION_NOT_FOUND');
    const session={...row,id:row.session_id};
    delete session.session_id;
    online.session=session;online.activeSession=session;online.recentSession=null;online.submissions=[];
    saveLastSession(session.id);saveDraft({index:0,answers:[],submitted:false},session.id);
    subscribeToSession(session.id);
    globalThis.ui.view=VIEW_GAME;
  }catch(error){setError(error);return}
  finally{online.loading=false}
  render();
}
async function v091JoinSession(sessionId){
  if(!onlineReady()){online.error='Najpierw zaloguj się i połącz konto z partnerem.';render();return}
  online.loading=true;clearError();render();
  try{
    const session=await fetchSessionById(sessionId||online.activeSession?.id||lastSessionId());
    if(!session)throw new Error('SESSION_NOT_FOUND');
    online.session=session;saveLastSession(session.id);subscribeToSession(session.id);
    online.submissions=await fetchSubmissions(session.id);
    globalThis.ui.view=VIEW_GAME;
  }catch(error){setError(error);return}
  finally{online.loading=false}
  render();
}
async function refreshOnlineSession({quiet=false}={}){
  if(!online.session?.id||!onlineReady())return;
  if(!quiet){online.loading=true;render()}
  try{
    const session=await fetchSessionById(online.session.id);
    if(!session){
      online.session=null;online.submissions=[];saveLastSession('');
      if(globalThis.ui?.view===VIEW_GAME){globalThis.ui.view=VIEW_LOBBY;online.error='Ta runda została zakończona. Możecie rozpocząć nową.'}
      return;
    }
    online.session=session;
    online.submissions=await fetchSubmissions(session.id);
    online.activeSession=session.status==='active'?session:null;
    online.recentSession=session.status==='completed'?session:null;
  }catch(error){online.error=friendlyError(error)}
  finally{
    online.loading=false;
    if(globalThis.ui?.view===VIEW_GAME||globalThis.ui?.view===VIEW_LOBBY)render();
  }
}
function currentQuestion(){
  const draft=loadDraft();
  return QUESTION_BY_ID.get(online.session?.question_ids?.[draft.index]);
}
async function v091ChooseAnswer(answer){
  const session=online.session;if(!session)return;
  const draft=loadDraft(session.id);
  if(draft.submitted||session.status==='completed')return;
  draft.answers[draft.index]=Number(answer);
  if(draft.index<session.question_ids.length-1){draft.index++;saveDraft(draft,session.id);render();return}
  saveDraft(draft,session.id);
  await v091SubmitAnswers();
}
async function v091PreviousQuestion(){
  const draft=loadDraft();
  if(draft.submitted||draft.index<=0)return;
  draft.index--;saveDraft(draft);render();
}
async function v091SubmitAnswers(){
  const session=online.session;if(!session)return;
  const draft=loadDraft(session.id);
  if(draft.answers.length!==8||draft.answers.some(value=>!Number.isInteger(Number(value)))){
    online.error='Odpowiedz na wszystkie 8 pytań.';render();return;
  }
  online.loading=true;clearError();render();
  try{
    const answers=draft.answers.map(Number);
    const{error}=await client().rpc('submit_spicy_match_session',{p_session_id:session.id,p_answers:answers});
    if(error)throw error;
    draft.submitted=true;saveDraft(draft,session.id);
    await refreshOnlineSession({quiet:true});
  }catch(error){setError(error);return}
  finally{online.loading=false}
  render();
}
async function v091CancelSession(){
  const session=online.session||online.activeSession;if(!session)return;
  if(!confirm('Anulować tę rundę na obu telefonach? Odpowiedzi zostaną usunięte.'))return;
  online.loading=true;render();
  try{
    const{error}=await client().rpc('cancel_spicy_match_session',{p_session_id:session.id});
    if(error)throw error;
    cleanupSubscription();saveDraft(null,session.id);saveLastSession('');
    online.session=null;online.activeSession=null;online.recentSession=null;online.submissions=[];
    globalThis.ui.view=VIEW_LOBBY;
    if(typeof globalThis.toast==='function')globalThis.toast('Runda została anulowana.');
  }catch(error){setError(error);return}
  finally{online.loading=false}
  render();
}
function v091BackToLobby(){cleanupSubscription();globalThis.ui.view=VIEW_LOBBY;render();void refreshLobby({force:true})}
function v091BackToHub(){cleanupSubscription();online.session=null;online.submissions=[];globalThis.ui.view='v082-spicy-hub';render();void refreshLobby({force:true})}

function errorHtml(){return online.error?`<div class="v091-error" role="alert">${esc(online.error)}</div>`:''}
function loadingHtml(){return online.loading?'<div class="v091-loading"><span></span><span></span><span></span><small>Synchronizuję oba telefony…</small></div>':''}
function renderLobby(){
  const ready=onlineReady();
  const active=online.activeSession;
  const recent=online.recentSession;
  const own=ownMember(),partner=partnerMember();
  const accountAction=typeof globalThis.showCloudHub==='function'?'showCloudHub()':'goHome()';
  globalThis.app.innerHTML=`<section class="panel wide v091-lobby"><div class="top-row"><button class="back-button" onclick="v091BackToHub()">← Pikantne</button><span class="chip ${ready?'connected-chip':''}">${ready?'● dwa telefony':'tryb wyboru'}</span></div><div class="v091-lobby-hero"><span>💞</span><div><small>DOPASOWANIE 18+</small><h1>Każde odpowiada u siebie</h1><p>Odpowiedzi pozostają ukryte. Wspólny wynik pokaże się dopiero wtedy, gdy oboje ukończycie 8 pytań.</p></div></div>${errorHtml()}${loadingHtml()}${ready?`<div class="v091-pair-ready"><span>✓</span><div><strong>${esc(own?.display_name)} + ${esc(partner?.display_name)}</strong><small>Połączenie gotowe. Możecie odpowiadać równocześnie albo w różnym czasie.</small></div></div>`:`<div class="v091-pair-needed"><span>2</span><div><strong>Połączcie dwa konta</strong><small>Zalogujcie się na osobnych telefonach i wpiszcie wspólny kod pary.</small></div><button class="button secondary" onclick="${accountAction}">Konto i synchronizacja</button></div>`}${active?`<button class="v091-active-session" onclick="v091JoinSession('${esc(active.id)}')"><span>▶</span><div><small>AKTYWNA RUNDA</small><strong>${esc(creatorName(active))} rozpoczął lub rozpoczęła grę</strong><p>Dołącz, odpowiedz na swoim telefonie i poczekaj na wspólny wynik.</p></div><i>Kontynuuj →</i></button>`:recent?`<button class="v091-active-session completed" onclick="v091JoinSession('${esc(recent.id)}')"><span>✓</span><div><small>WYNIK JEST GOTOWY</small><strong>Oboje ukończyliście Dopasowanie 18+</strong><p>Otwórz wspólne odpowiedzi i procent zgodności.</p></div><i>Pokaż wynik →</i></button>`:''}<div class="v091-mode-grid"><article class="v091-mode-card online"><span>📱📱</span><small>REKOMENDOWANE</small><h2>Dwa telefony</h2><p>Każde widzi wyłącznie swoje pytania i odpowiedzi. Wynik odkrywa się jednocześnie.</p><button class="button primary full" onclick="v091StartOnlineMatch()" ${ready&&!active?'':'disabled'}>${active?'Najpierw dokończcie rundę':'Rozpocznij nową rundę'}</button></article><article class="v091-mode-card local"><span>↔</span><small>TRYB LOKALNY</small><h2>Jeden telefon</h2><p>Odpowiadacie kolejno i przekazujecie sobie urządzenie tak jak wcześniej.</p><button class="button secondary full" onclick="v091StartLocalMatch()">Graj na jednym telefonie</button></article></div><div class="v091-privacy-note"><span>🔒</span><div><strong>Prywatność odpowiedzi</strong><p>Partner nie może zobaczyć twoich wyborów przed zakończeniem przez oboje. Rozpoczęcie nowej rundy usuwa poprzednie odpowiedzi tej gry z chmury.</p></div></div></section>`;
}
function renderAnswering(session,draft){
  const question=currentQuestion();
  if(!question){online.error='Nie udało się odczytać pytania tej rundy.';renderLobby();return}
  const progress=Math.round((draft.index/session.question_ids.length)*100);
  globalThis.app.innerHTML=`<section class="panel v082-match-panel v091-online-game"><div class="top-row"><button class="back-button" onclick="v091BackToLobby()">← Dopasowanie</button><span class="chip connected-chip">● online · ${draft.index+1}/${session.question_ids.length}</span></div>${errorHtml()}${loadingHtml()}<div class="v082-match-head"><span>💞</span><div><small>${esc(ownMember()?.display_name||'Ty')} · odpowiedz tylko dla siebie</small><h1>Dopasowanie 18+</h1></div></div><div class="v082-progress"><i style="width:${progress}%"></i></div><article class="v082-question-card"><small>PYTANIE ${draft.index+1}</small><h2>${esc(question.prompt)}</h2><div class="v082-answer-grid">${question.options.map((option,index)=>`<button onclick="v091ChooseAnswer(${index})"><b>${String.fromCharCode(65+index)}</b><span>${esc(option)}</span></button>`).join('')}</div></article><div class="v091-question-footer"><button class="button tertiary" onclick="v091PreviousQuestion()" ${draft.index===0?'disabled':''}>← Poprzednie</button><p>🔒 ${esc(partnerMember()?.display_name||'Druga osoba')} nie zobaczy odpowiedzi przed wspólnym końcem.</p></div></section>`;
}
function renderWaiting(session){
  const partnerDone=online.submissions.some(item=>item.user_id===partnerMember()?.user_id);
  globalThis.app.innerHTML=`<section class="panel v082-match-panel v091-online-game"><div class="top-row"><button class="back-button" onclick="v091BackToLobby()">← Dopasowanie</button><span class="chip connected-chip">● odpowiedzi wysłane</span></div>${errorHtml()}${loadingHtml()}<div class="v091-waiting"><span class="v091-wait-icon">✓</span><small>TWOJE ODPOWIEDZI SĄ ZAPISANE</small><h1>${partnerDone?'Oboje skończyliście':'Czekamy na drugą osobę'}</h1><p>${partnerDone?'Przygotowujemy wspólny wynik.':`${esc(partnerMember()?.display_name||'Partner lub partnerka')} może odpowiedzieć teraz albo wrócić do gry później. Twoje wybory pozostają ukryte.`}</p><div class="v091-wait-status"><div class="done"><span>✓</span><strong>${esc(ownMember()?.display_name||'Ty')}</strong><small>gotowe</small></div><div class="${partnerDone?'done':'pending'}"><span>${partnerDone?'✓':'…'}</span><strong>${esc(partnerMember()?.display_name||'Druga osoba')}</strong><small>${partnerDone?'gotowe':'odpowiada lub jeszcze nie zaczęła'}</small></div></div><button class="button primary full" onclick="refreshOnlineSession()">Sprawdź wynik</button><button class="button tertiary full" onclick="v091BackToLobby()">Wróć — powiadomienie pojawi się po ukończeniu</button>${session.created_by===currentUser()?.id?'<button class="link-button danger-text" onclick="v091CancelSession()">Anuluj rundę i usuń odpowiedzi</button>':''}</div></section>`;
}
function renderSummary(session){
  const submissions=orderedSubmissions();
  if(submissions.length<2){renderWaiting(session);return}
  const orderedMembers=[...members()].sort((a,b)=>Number(a.role_index)-Number(b.role_index));
  const rows=session.question_ids.map((id,index)=>{
    const question=QUESTION_BY_ID.get(id);
    const left=Number(submissions[0]?.answers?.[index]);
    const right=Number(submissions[1]?.answers?.[index]);
    return{question,left,right,same:left===right};
  }).filter(row=>row.question);
  const matches=rows.filter(row=>row.same).length;
  const score=Math.round(matches/Math.max(1,rows.length)*100);
  const title=score>=75?'Bardzo podobne wybory':score>=45?'Macie sporo wspólnego':'Macie dziś różne preferencje';
  globalThis.app.innerHTML=`<section class="panel wide v082-match-panel v091-online-summary"><div class="top-row"><button class="back-button" onclick="v091BackToHub()">← Pikantne</button><span class="chip connected-chip">● wynik na dwóch telefonach</span></div>${errorHtml()}<div class="v082-result-hero"><div class="v082-result-ring" style="--score:${score}"><strong>${score}%</strong><small>zgodności</small></div><div><span class="eyebrow">DOPASOWANIE 18+ · ONLINE</span><h1>${title}</h1><p>Zgodne odpowiedzi: ${matches}/${rows.length}. Różne wybory nie są porażką — pokazują, o czym warto spokojnie porozmawiać.</p></div></div><div class="v082-result-list">${rows.map((row,index)=>`<article class="${row.same?'same':'different'}"><div><small>${index+1}</small><h3>${esc(row.question.prompt)}</h3></div><div class="v082-result-answers"><span><b>${esc(orderedMembers[0]?.display_name||'Osoba 1')}</b>${esc(row.question.options[row.left]||'—')}</span><span><b>${esc(orderedMembers[1]?.display_name||'Osoba 2')}</b>${esc(row.question.options[row.right]||'—')}</span></div><em>${row.same?'To samo ✓':'Inaczej'}</em></article>`).join('')}</div><div class="v091-summary-actions"><button class="button primary" onclick="v091StartOnlineMatch()">Nowa runda</button><button class="button secondary" onclick="v091BackToHub()">Inna gra</button><button class="button tertiary" onclick="v091CancelSession()">Usuń wynik z chmury</button></div><p class="v091-private-summary">Odpowiedzi nie są dodawane do ogólnej historii gier. Nowa runda lub przycisk „Usuń wynik” kasuje je z chmury.</p></section>`;
}
function renderOnlineGame(){
  const session=online.session;
  if(online.loading&&!session){globalThis.app.innerHTML=`<section class="panel v091-lobby">${loadingHtml()}</section>`;return}
  if(!session){globalThis.ui.view=VIEW_LOBBY;renderLobby();return}
  const draft=loadDraft(session.id);
  const ownSubmission=online.submissions.find(item=>item.user_id===currentUser()?.id);
  if(session.status==='completed'){renderSummary(session);return}
  if(draft.submitted||ownSubmission){if(!draft.submitted){draft.submitted=true;saveDraft(draft,session.id)}renderWaiting(session);return}
  renderAnswering(session,draft);
}
function enhanceSpicyHub(){
  if(globalThis.ui?.view!=='v082-spicy-hub')return;
  const tile=[...document.querySelectorAll('.v082-game-tile')].find(node=>node.textContent?.includes('Dopasowanie 18+'));
  if(tile){
    tile.setAttribute('onclick','v091OpenMatch()');
    const meta=tile.querySelector('small');if(meta)meta.textContent=onlineReady()?'8 pytań · dwa telefony':'8 pytań · jeden lub dwa telefony';
    if(onlineReady()&&!tile.querySelector('.v091-online-badge'))tile.insertAdjacentHTML('beforeend','<span class="v091-online-badge">ONLINE</span>');
  }
  document.querySelector('.v091-hub-session')?.remove();
  const hubSession=online.activeSession||online.recentSession;
  if(hubSession){
    const completed=hubSession.status==='completed';
    const grid=document.querySelector('.v082-game-grid');
    grid?.insertAdjacentHTML('beforebegin',`<button class="v091-hub-session ${completed?'completed':''}" onclick="v091JoinSession('${esc(hubSession.id)}')"><span>${completed?'✓':'▶'}</span><div><small>${completed?'WYNIK GOTOWY':'AKTYWNA RUNDA NA DWÓCH TELEFONACH'}</small><strong>${completed?'Zobaczcie wspólne Dopasowanie 18+':'Kontynuujcie Dopasowanie 18+'}</strong><p>${completed?'Oboje odpowiedzieliście na 8 pytań.':`${esc(creatorName(hubSession))} rozpoczął lub rozpoczęła zestaw 8 pytań.`}</p></div><i>${completed?'Wynik →':'Otwórz →'}</i></button>`);
  }
  if(!online.hubChecking&&Date.now()-online.hubCheckedAt>3500)queueMicrotask(()=>void refreshLobby());
}

const previousRender=globalThis.render;
globalThis.render=function(){
  if(globalThis.ui?.view===VIEW_LOBBY){renderLobby();setVersion();return}
  if(globalThis.ui?.view===VIEW_GAME){renderOnlineGame();setVersion();return}
  previousRender();
  enhanceSpicyHub();
  setVersion();
};

function wrappedShowSpicyHub(){
  if(typeof legacyShowSpicyHub==='function')legacyShowSpicyHub();
  void refreshLobby({force:true});
}

Object.assign(globalThis,{
  v082StartMatch:function(kind){return kind==='match'?v091OpenMatch():legacyStartMatch?.(kind)},
  showSpicyHub:wrappedShowSpicyHub,
  v091OpenMatch,
  v091StartLocalMatch,
  v091StartOnlineMatch,
  v091JoinSession,
  v091ChooseAnswer,
  v091PreviousQuestion,
  v091SubmitAnswers,
  v091CancelSession,
  v091BackToLobby,
  v091BackToHub,
  refreshOnlineSession,
});
globalThis.startSpicyPack=wrappedShowSpicyHub;

window.addEventListener('online',()=>{
  if(globalThis.ui?.view===VIEW_GAME)void refreshOnlineSession({quiet:true});
  if(globalThis.ui?.view===VIEW_LOBBY||globalThis.ui?.view==='v082-spicy-hub')void refreshLobby({force:true});
});
document.addEventListener('visibilitychange',()=>{
  if(document.visibilityState!=='visible')return;
  if(globalThis.ui?.view===VIEW_GAME)void refreshOnlineSession({quiet:true});
  if(globalThis.ui?.view===VIEW_LOBBY||globalThis.ui?.view==='v082-spicy-hub')void refreshLobby({force:true});
});

setVersion();
})();
