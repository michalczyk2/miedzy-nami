(function(){
'use strict';

const V07_VERSION='0.9.6';
const CREATOR='Michał Czerwiński';
const CLOUD_DRAFT_PREFIX='mn-v07-cloud-daily-draft';
const OTP_EMAIL_KEY='mn-v072-otp-email';
const OTP_SENT_AT_KEY='mn-v072-otp-sent-at';
const OTP_RESEND_SECONDS=60;
const CLOUD_REQUEST_TIMEOUT_MS=12000;
const CLOUD_LOADING_WATCHDOG_MS=15000;
const INITIAL_INVITE_CODE=(new URLSearchParams(location.search).get('join')||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6);
const ENGINE=window.MN_DAILY_ENGINE;
const config=window.MN_CLOUD_CONFIG||{};
const cloud={
  configured:Boolean(config.supabaseUrl&&config.supabasePublishableKey&&window.supabase?.createClient),
  client:null,session:null,user:null,profile:null,couple:null,members:[],subscription:null,
  loading:false,error:'',notice:'',daily:null,history:[],syncing:false,lastSyncAt:null,
  otpEmail:localStorage.getItem(OTP_EMAIL_KEY)||'',otpSentAt:Number(localStorage.getItem(OTP_SENT_AT_KEY)||0),
  loadingStartedAt:null,pendingInviteCode:INITIAL_INVITE_CODE,
};
let cloudLoadingWatchdog=null;
let cloudStatePromise=null;
window.MN_CLOUD_RUNTIME=cloud;

function cloudEscape(value){return escapeHtml(String(value??''))}
function normalizeInviteCode(value){return String(value||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)}
function clearInviteQuery(){
  cloud.pendingInviteCode='';
  const url=new URL(location.href);
  if(url.searchParams.has('join')){url.searchParams.delete('join');history.replaceState({},'',url.pathname+url.search+url.hash)}
}
function inviteUrl(code){const url=new URL(location.origin+location.pathname);url.searchParams.set('join',code);return url.toString()}
function ownMember(){return cloud.members.find(member=>member.user_id===cloud.user?.id)||null}
function partnerMember(){return cloud.members.find(member=>member.user_id!==cloud.user?.id)||null}
function cloudReady(){return Boolean(cloud.configured&&cloud.user&&cloud.couple&&ownMember())}
function cloudDateKey(){return ENGINE?.localDateKey?.()||new Date().toISOString().slice(0,10)}
function cloudQuestionDefinition(date=cloudDateKey()){return ENGINE?.dailyDefinition?.(date)||{date,category:'',questionIds:[]}}
function cloudQuestions(ids){return(ids||[]).map(id=>ENGINE?.DAILY_BY_ID?.get(id)).filter(Boolean)}
function configMessage(){return cloud.configured?'Połączenie z Supabase jest skonfigurowane.':'Tryb dwóch telefonów wymaga jednorazowego podłączenia dedykowanego projektu Supabase.'}
function formatCloudError(error){
  const raw=String(error?.message||error||'Nieznany błąd');
  const normalized=raw.toLowerCase();
  if(normalized.includes('rate limit')||normalized.includes('over_email_send_rate_limit')||normalized.includes('email rate limit exceeded'))return'Za dużo wiadomości w krótkim czasie. Poczekaj chwilę i spróbuj ponownie. Po zalogowaniu sesja zostaje zapisana na tym urządzeniu.';
  if(normalized.includes('otp_expired')||normalized.includes('token has expired')||normalized.includes('invalid or has expired'))return'Kod wygasł albo został już wykorzystany. Wyślij nowy kod i wpisz go z najnowszej wiadomości.';
  if(normalized.includes('invalid token')||normalized.includes('token is invalid'))return'Kod jest nieprawidłowy. Sprawdź cyfry albo wyślij nowy kod.';
  if(normalized.includes('load failed')||normalized.includes('failed to fetch')||normalized.includes('network request failed')||normalized.includes('networkerror')||normalized.includes('network error'))return'Nie udało się połączyć z chmurą. Sprawdź internet i spróbuj ponownie. Twoje dane lokalne nie zostały utracone.';
  if(normalized.includes('timeout')||normalized.includes('timed out'))return'Połączenie trwało zbyt długo. Spróbuj ponownie za chwilę.';
  if(normalized.includes('gen_random_bytes'))return'Baza wymaga poprawki generatora kodu pary. Uruchom migrację 002_fix_invite_code.sql.';
  const map={AUTH_REQUIRED:'Najpierw zaloguj się.',DISPLAY_NAME_REQUIRED:'Wpisz imię.',ALREADY_IN_COUPLE:'To konto jest już połączone z parą.',INVALID_INVITE_CODE:'Nie znaleziono pary o takim kodzie.',COUPLE_FULL:'Do tej pary należą już dwie osoby.',CURRENT_COUPLE_NOT_EMPTY:'Nie można zmienić kodu, ponieważ konto jest już połączone z partnerem.',SAME_COUPLE_CODE:'To jest kod pary, w której już jesteś.'};
  return Object.entries(map).find(([key])=>raw.includes(key))?.[1]||raw;
}
function cloudToast(message){cloud.notice=message;toast(message)}
function setCloudError(error){cloud.error=formatCloudError(error);console.error('[Między Nami cloud]',error);render()}
function clearCloudError(){cloud.error=''}
function cloudWithTimeout(promise,label='Połączenie z chmurą',timeout=CLOUD_REQUEST_TIMEOUT_MS){
  let timer;
  return Promise.race([
    Promise.resolve(promise),
    new Promise((_,reject)=>{timer=setTimeout(()=>{const error=new Error(`${label} timed out`);error.code='CLOUD_TIMEOUT';reject(error)},timeout)}),
  ]).finally(()=>clearTimeout(timer));
}
function cloudBeginLoading(){
  cloud.loading=true;cloud.loadingStartedAt=Date.now();clearTimeout(cloudLoadingWatchdog);
  cloudLoadingWatchdog=setTimeout(()=>{
    if(!cloud.loading)return;
    cloudEndLoading();cloud.loadingStartedAt=null;
    cloud.error='Synchronizacja trwała zbyt długo. Sprawdź internet i spróbuj ponownie.';
    try{render()}catch{}
  },CLOUD_LOADING_WATCHDOG_MS);
}
function cloudEndLoading(){cloud.loading=false;cloud.loadingStartedAt=null;clearTimeout(cloudLoadingWatchdog);cloudLoadingWatchdog=null}
async function cloudRetrySync(){clearCloudError();cloudBeginLoading();render();await loadCloudState();render()}

async function initCloud(){
  if(!cloud.configured)return;
  cloud.client=window.supabase.createClient(config.supabaseUrl,config.supabasePublishableKey,{
    auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'pkce'},
  });
  try{
    const{data}=await cloudWithTimeout(cloud.client.auth.getSession(),'Odczyt zapisanej sesji');
    cloud.session=data.session||null;cloud.user=data.session?.user||null;
    cloud.client.auth.onAuthStateChange((_event,session)=>{
      cloud.session=session||null;cloud.user=session?.user||null;cloud.error='';
      setTimeout(()=>{loadCloudState().finally(()=>render())},0);
    });
    await loadCloudState();
  }catch(error){cloudEndLoading();cloud.error=formatCloudError(error);console.error('[Między Nami cloud init]',error)}
}

async function loadCloudState(){
  if(cloudStatePromise)return cloudStatePromise;
  const task=(async()=>{
    unsubscribeCloud();cloud.profile=null;cloud.couple=null;cloud.members=[];cloud.daily=null;cloud.history=[];
    if(!cloud.user||!cloud.client){cloudEndLoading();return}
    cloudBeginLoading();
    try{
      const[{data:profileData,error:profileError},{data:membership,error:membershipError}]=await cloudWithTimeout(Promise.all([
        cloud.client.from('profiles').select('id,display_name').eq('id',cloud.user.id).maybeSingle(),
        cloud.client.from('couple_members').select('couple_id,user_id,display_name,role_index,joined_at').eq('user_id',cloud.user.id).maybeSingle(),
      ]),'Ładowanie konta pary');
      if(profileError)throw profileError;if(membershipError)throw membershipError;
      cloud.profile=profileData||{id:cloud.user.id,display_name:cloud.user.email?.split('@')[0]||'Gracz'};
      if(membership){
        const[{data:couple,error:coupleError},{data:members,error:membersError}]=await cloudWithTimeout(Promise.all([
          cloud.client.from('couples').select('id,invite_code,created_at').eq('id',membership.couple_id).single(),
          cloud.client.from('couple_members').select('couple_id,user_id,display_name,role_index,joined_at').eq('couple_id',membership.couple_id).order('role_index'),
        ]),'Ładowanie danych pary');
        if(coupleError)throw coupleError;if(membersError)throw membersError;
        cloud.couple=couple;cloud.members=members||[];
        if(cloud.members.length===2){settings.names=cloud.members.map(member=>member.display_name);saveSettings()}
        subscribeCloud();
        const supplemental=await Promise.allSettled([
          cloudWithTimeout(refreshCloudDaily(false),'Odświeżanie dzisiejszych pytań'),
          cloudWithTimeout(loadCloudHistory(),'Ładowanie historii online'),
        ]);
        const failed=supplemental.find(item=>item.status==='rejected');
        if(failed&&!cloud.error)cloud.error=formatCloudError(failed.reason);
        setTimeout(()=>{cloudWithTimeout(syncLocalSessions(),'Synchronizacja historii').catch(error=>console.warn('Nie udało się zsynchronizować sesji',error))},0);
      }
      cloud.lastSyncAt=Date.now();
    }catch(error){cloud.error=formatCloudError(error);console.error('[Między Nami cloud state]',error)}finally{cloudEndLoading()}
  })();
  cloudStatePromise=task;
  try{return await task}finally{if(cloudStatePromise===task)cloudStatePromise=null}
}

function subscribeCloud(){
  if(!cloud.client||!cloud.couple)return;
  cloud.subscription=cloud.client.channel(`mn-couple-${cloud.couple.id}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'daily_submissions',filter:`couple_id=eq.${cloud.couple.id}`},()=>refreshCloudDaily(true))
    .on('postgres_changes',{event:'*',schema:'public',table:'daily_results',filter:`couple_id=eq.${cloud.couple.id}`},()=>refreshCloudDaily(true))
    .subscribe();
}
function unsubscribeCloud(){if(cloud.client&&cloud.subscription)cloud.client.removeChannel(cloud.subscription);cloud.subscription=null}

function otpCooldownRemaining(){return Math.max(0,OTP_RESEND_SECONDS-Math.floor((Date.now()-Number(cloud.otpSentAt||0))/1000))}
function saveOtpState(email){cloud.otpEmail=email;cloud.otpSentAt=Date.now();localStorage.setItem(OTP_EMAIL_KEY,email);localStorage.setItem(OTP_SENT_AT_KEY,String(cloud.otpSentAt))}
function clearOtpState(){cloud.otpEmail='';cloud.otpSentAt=0;localStorage.removeItem(OTP_EMAIL_KEY);localStorage.removeItem(OTP_SENT_AT_KEY)}
async function cloudSendOtp(){
  clearCloudError();
  const email=(document.querySelector('#cloud-email')?.value||cloud.otpEmail||'').trim().toLowerCase();
  if(!email){cloudToast('Wpisz adres e-mail.');return}
  const remaining=otpCooldownRemaining();
  if(cloud.otpEmail===email&&remaining>0){cloud.error=`Kod został już wysłany. Spróbuj ponownie za ${remaining} s.`;render();return}
  cloudBeginLoading();render();
  const{error}=await cloudWithTimeout(cloud.client.auth.signInWithOtp({email,options:{shouldCreateUser:true,data:{display_name:email.split('@')[0]}}}),'Wysyłanie kodu logowania');
  cloudEndLoading();
  if(error){setCloudError(error);return}
  saveOtpState(email);
  cloudToast('Kod logowania został wysłany. Wpisz go w tej aplikacji.');
  setTimeout(()=>{if(!cloud.user&&cloud.otpEmail===email)render()},(OTP_RESEND_SECONDS+1)*1000);
  render();
}
async function cloudVerifyOtp(){
  clearCloudError();
  const email=(cloud.otpEmail||document.querySelector('#cloud-email')?.value||'').trim().toLowerCase();
  const token=(document.querySelector('#cloud-otp')?.value||'').replace(/\D/g,'').slice(0,8);
  if(!email){cloudToast('Najpierw wyślij kod na e-mail.');return}
  if(token.length<6){cloudToast('Wpisz pełny kod z wiadomości.');return}
  cloudBeginLoading();render();
  const{error}=await cloudWithTimeout(cloud.client.auth.verifyOtp({email,token,type:'email'}),'Weryfikacja kodu logowania');
  cloudEndLoading();
  if(error){setCloudError(error);return}
  clearOtpState();cloudToast('Zalogowano na tym urządzeniu.');render();
}
function cloudChangeOtpEmail(){clearOtpState();clearCloudError();render()}
async function cloudGoogleSignIn(){
  clearCloudError();
  const{error}=await cloudWithTimeout(cloud.client.auth.signInWithOAuth({provider:'google',options:{redirectTo:location.origin+location.pathname}}),'Logowanie Google');
  if(error)setCloudError(error);
}
async function cloudSignOut(){unsubscribeCloud();await cloudWithTimeout(cloud.client?.auth.signOut(),'Wylogowanie').catch(()=>{});cloud.session=null;cloud.user=null;cloud.couple=null;cloud.members=[];ui.view='cloud';render()}

async function cloudCreatePair(){
  const name=document.querySelector('#cloud-create-name')?.value.trim()||cloud.profile?.display_name||settings.names[0];
  cloudBeginLoading();clearCloudError();render();
  try{
    const{error}=await cloudWithTimeout(cloud.client.rpc('create_couple',{p_display_name:name}),'Tworzenie pary');
    if(error)throw error;
    await loadCloudState();cloudToast('Para utworzona. Wyślij partnerowi kod zaproszenia.');
  }catch(error){cloud.error=formatCloudError(error);console.error('[Między Nami cloud]',error)}
  finally{cloudEndLoading();render()}
}
async function cloudJoinPair(){
  const name=document.querySelector('#cloud-join-name')?.value.trim()||cloud.profile?.display_name||settings.names[1];
  const code=normalizeInviteCode(document.querySelector('#cloud-invite-code')?.value||cloud.pendingInviteCode);
  if(code.length!==6){cloudToast('Wpisz pełny, 6-znakowy kod partnera.');return}
  cloudBeginLoading();clearCloudError();render();
  try{
    const{error}=await cloudWithTimeout(cloud.client.rpc('join_couple',{p_invite_code:code,p_display_name:name}),'Dołączanie do pary');
    if(error)throw error;
    clearInviteQuery();await loadCloudState();cloudToast('Telefony zostały połączone.');
  }catch(error){cloud.error=formatCloudError(error);console.error('[Między Nami cloud]',error)}
  finally{cloudEndLoading();render()}
}
async function cloudSwitchWaitingPair(){
  const name=ownMember()?.display_name||cloud.profile?.display_name||settings.names[1];
  const code=normalizeInviteCode(document.querySelector('#cloud-switch-code')?.value||'');
  if(code.length!==6){cloudToast('Wpisz pełny, 6-znakowy kod partnera.');return}
  if(code===cloud.couple?.invite_code){cloudToast('To jest kod pary, w której już jesteś.');return}
  cloudBeginLoading();clearCloudError();render();
  try{
    const{error}=await cloudWithTimeout(cloud.client.rpc('switch_waiting_couple',{p_invite_code:code,p_display_name:name}),'Zmiana kodu pary');
    if(error)throw error;
    clearInviteQuery();await loadCloudState();cloudToast('Dołączono do pary partnera.');
  }catch(error){cloud.error=formatCloudError(error);console.error('[Między Nami cloud switch]',error)}
  finally{cloudEndLoading();render()}
}
async function cloudPasteInviteCode(inputId){
  try{
    const text=normalizeInviteCode(await navigator.clipboard.readText());
    const input=document.getElementById(inputId);
    if(!input||text.length!==6)throw new Error('NO_CODE');
    input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();cloudToast('Kod został wklejony.');
  }catch{cloudToast('Przytrzymaj pole kodu i wybierz „Wklej”.')}
}
async function cloudLeavePair(){
  if(!confirm('Rozwiązać parę online? Usunie to wspólne dane z chmury i odłączy oba konta. Dane lokalne na telefonach pozostaną.'))return;
  cloudBeginLoading();render();const{error}=await cloudWithTimeout(cloud.client.rpc('leave_couple'),'Rozwiązywanie pary');cloudEndLoading();
  if(error){setCloudError(error);return}await loadCloudState();ui.view='cloud';render();
}
async function copyInviteCode(){
  const code=cloud.couple?.invite_code;if(!code)return;
  try{await navigator.clipboard.writeText(code);cloudToast('Kod pary skopiowany.')}catch{cloudToast(`Kod pary: ${code}`)}
}
async function shareInviteCode(){
  const code=cloud.couple?.invite_code;if(!code)return;
  const url=inviteUrl(code);
  const text=`Dołącz do naszej pary w aplikacji Między Nami. Wspólny kod pary: ${code}`;
  try{if(navigator.share)await navigator.share({title:'Między Nami — zaproszenie',text,url});else{await navigator.clipboard.writeText(`${text} ${url}`);cloudToast('Zaproszenie skopiowane.')}}catch{}
}

function cloudDraftKey(date=cloudDateKey()){return`${CLOUD_DRAFT_PREFIX}:${cloud.couple?.id}:${date}:${cloud.user?.id}`}
function loadCloudDraft(definition){
  try{const parsed=JSON.parse(localStorage.getItem(cloudDraftKey(definition.date))||'null');if(parsed?.questionIds?.join('|')===definition.questionIds.join('|'))return parsed}catch{}
  return{date:definition.date,category:definition.category,questionIds:definition.questionIds,answers:[],index:0};
}
function saveCloudDraft(draft){localStorage.setItem(cloudDraftKey(draft.date),JSON.stringify(draft))}
function clearCloudDraft(date=cloudDateKey()){localStorage.removeItem(cloudDraftKey(date))}

async function refreshCloudDaily(shouldRender=true){
  if(!cloudReady())return;
  const date=cloudDateKey();
  const[{data:submissions,error:subError},{data:result,error:resultError}]=await Promise.all([
    cloud.client.from('daily_submissions').select('id,couple_id,quiz_date,user_id,category,question_ids,answers,completed_at').eq('couple_id',cloud.couple.id).eq('quiz_date',date).order('completed_at'),
    cloud.client.from('daily_results').select('*').eq('couple_id',cloud.couple.id).eq('quiz_date',date).maybeSingle(),
  ]);
  if(subError){cloud.error=formatCloudError(subError);return}if(resultError){cloud.error=formatCloudError(resultError);return}
  const own=submissions?.find(item=>item.user_id===cloud.user.id)||null;
  const partner=submissions?.find(item=>item.user_id!==cloud.user.id)||null;
  cloud.daily={date,submissions:submissions||[],own,partner,result:result||null};
  if(own&&partner&&!result)await finalizeCloudDaily(submissions);
  if(shouldRender&&['cloud-daily','cloud-daily-wait','cloud-daily-summary','home'].includes(ui.view))render();
}

async function finalizeCloudDaily(submissions){
  const ordered=[...cloud.members].sort((a,b)=>a.role_index-b.role_index).map(member=>submissions.find(item=>item.user_id===member.user_id)).filter(Boolean);
  if(ordered.length!==2)return;
  const questionIds=ordered[0].question_ids;
  if(questionIds.join('|')!==ordered[1].question_ids.join('|')){cloud.error='Zestawy pytań nie są zgodne. Odśwież aplikację.';return}
  const questions=cloudQuestions(questionIds);if(questions.length!==5)return;
  const details=questions.map((question,index)=>({questionId:question.id,leftAnswer:Number(ordered[0].answers[index]),rightAnswer:Number(ordered[1].answers[index]),compatibility:ENGINE.questionCompatibility(question,ordered[0].answers[index],ordered[1].answers[index])}));
  const score=Math.round(details.reduce((sum,item)=>sum+item.compatibility,0)/details.length);
  const{error}=await cloud.client.from('daily_results').upsert({couple_id:cloud.couple.id,quiz_date:cloudDateKey(),category:ordered[0].category,question_ids:questionIds,score,details,created_by:cloud.user.id},{onConflict:'couple_id,quiz_date'});
  if(error&&error.code!=='23505'){cloud.error=formatCloudError(error);return}
  const{data}=await cloud.client.from('daily_results').select('*').eq('couple_id',cloud.couple.id).eq('quiz_date',cloudDateKey()).maybeSingle();
  cloud.daily.result=data||{score,details,category:ordered[0].category,question_ids:questionIds};
  await loadCloudHistory();
}

function openCloudDaily(){
  if(!cloudReady()){showCloudHub();return}
  ui.modal=null;ui.view=cloud.daily?.result?'cloud-daily-summary':cloud.daily?.own?'cloud-daily-wait':'cloud-daily';render();
}
function cloudDailyChoose(answer){
  const definition=cloudQuestionDefinition();const draft=loadCloudDraft(definition);draft.answers[draft.index]=Number(answer);saveCloudDraft(draft);render();
}
function cloudDailyNext(){
  const definition=cloudQuestionDefinition();const draft=loadCloudDraft(definition);
  if(!Number.isInteger(draft.answers[draft.index])){cloudToast('Najpierw wybierz odpowiedź.');return}
  draft.index=Math.min(4,draft.index+1);saveCloudDraft(draft);render();
}
function cloudDailyPrevious(){const definition=cloudQuestionDefinition();const draft=loadCloudDraft(definition);draft.index=Math.max(0,draft.index-1);saveCloudDraft(draft);render()}
async function submitCloudDaily(){
  const definition=cloudQuestionDefinition(),draft=loadCloudDraft(definition);
  if(draft.answers.length!==5||draft.answers.some(answer=>!Number.isInteger(answer))){cloudToast('Odpowiedz na wszystkie 5 pytań.');return}
  cloudBeginLoading();render();
  const{error}=await cloud.client.from('daily_submissions').upsert({couple_id:cloud.couple.id,quiz_date:definition.date,user_id:cloud.user.id,category:definition.category,question_ids:definition.questionIds,answers:draft.answers,completed_at:new Date().toISOString()},{onConflict:'couple_id,quiz_date,user_id'});
  cloudEndLoading();if(error){setCloudError(error);return}clearCloudDraft(definition.date);await refreshCloudDaily(false);ui.view=cloud.daily?.result?'cloud-daily-summary':'cloud-daily-wait';render();
}
async function refreshCloudWait(){cloudBeginLoading();render();await refreshCloudDaily(false);cloudEndLoading();if(cloud.daily?.result)ui.view='cloud-daily-summary';render()}

async function loadCloudHistory(){
  if(!cloudReady())return;
  const{data,error}=await cloud.client.from('daily_results').select('*').eq('couple_id',cloud.couple.id).order('quiz_date',{ascending:false}).limit(90);
  if(error){cloud.error=formatCloudError(error);return}cloud.history=data||[];
}
function showCloudHistory(){ui.view='cloud-history';render()}
function openCloudHistoryDay(date){cloud.selectedHistory=date;ui.view='cloud-history-day';render()}

async function syncLocalSessions(){
  if(!cloudReady()||cloud.syncing)return;cloud.syncing=true;
  try{
    const payload=(profile.sessions||[]).slice(-100).map(session=>({
      couple_id:cloud.couple.id,
      client_session_id:String(session.cloudId||`${session.finishedAt||session.startedAt}-${session.mode}-${session.rounds||session.results?.length||0}`),
      uploaded_by:cloud.user.id,
      mode:session.mode||'mix',rounds:Number(session.rounds||session.results?.length||0),match_rate:Number(session.matchRate||0),shared_points:Number(session.shared||0),categories:[...new Set(session.categories||session.results?.map(item=>item.category).filter(Boolean)||[])],
      finished_at:new Date(session.finishedAt||session.startedAt||Date.now()).toISOString(),summary:{scores:session.scores||[],names:session.names||settings.names},
    }));
    if(payload.length){const{error}=await cloud.client.from('game_sessions').upsert(payload,{onConflict:'couple_id,client_session_id'});if(error)throw error}
    cloud.lastSyncAt=Date.now();
  }catch(error){console.warn('Nie udało się zsynchronizować sesji',error)}finally{cloud.syncing=false}
}

function cloudStatusMarkup(){
  if(!cloud.configured)return`<button class="cloud-home-status setup" onclick="showCloudHub()"><span>☁</span><div><strong>Włącz dwa telefony</strong><small>Podłącz bezpieczną synchronizację Supabase</small></div><i>Skonfiguruj →</i></button>`;
  if(!cloud.user)return`<button class="cloud-home-status" onclick="showCloudHub()"><span>☁</span><div><strong>Tryb jednego telefonu</strong><small>Zalogujcie się, aby odpowiadać osobno</small></div><i>Zaloguj →</i></button>`;
  if(!cloud.couple)return`<button class="cloud-home-status" onclick="showCloudHub()"><span>◌</span><div><strong>${cloudEscape(cloud.profile?.display_name||'Konto gotowe')}</strong><small>Utwórz parę albo wpisz kod partnera</small></div><i>Połącz →</i></button>`;
  const partner=partnerMember();return`<button class="cloud-home-status connected" onclick="showCloudHub()"><span>✓</span><div><strong>${partner?`${cloudEscape(ownMember()?.display_name)} + ${cloudEscape(partner.display_name)}`:'Czekamy na drugą osobę'}</strong><small>${partner?'Dwa telefony są zsynchronizowane':`Kod pary: ${cloudEscape(cloud.couple.invite_code)}`}</small></div><i>Konto →</i></button>`;
}

function renderCloudHub(){
  const error=cloud.error?`<div class="cloud-alert error">${cloudEscape(cloud.error)}</div><button class="button tertiary full" onclick="cloudRetrySync()">Spróbuj ponownie</button>`:'';
  if(!cloud.configured){app.innerHTML=`<section class="panel cloud-panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">v${V07_VERSION}</span></div><span class="cloud-big">☁</span><h1>Dwa telefony</h1><p class="muted">Frontend jest gotowy. Aby uruchomić synchronizację, trzeba utworzyć dedykowany projekt Supabase, wykonać migrację SQL i wkleić dwa publiczne parametry do <code>cloud-config.js</code>.</p><div class="cloud-steps"><div><b>1</b><span><strong>Oddzielny Supabase</strong><small>Bez mieszania danych z Typerzy 2026.</small></span></div><div><b>2</b><span><strong>Konta i kod pary</strong><small>Każda osoba loguje się na swoim telefonie.</small></span></div><div><b>3</b><span><strong>Odpowiedzi osobno</strong><small>Wynik odsłania się dopiero, gdy oboje skończą.</small></span></div></div><div class="cloud-alert">${cloudEscape(configMessage())}</div></section>`;return}
  if(cloud.loading){app.innerHTML=`<section class="panel cloud-panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">Połączenie online</span></div><div class="app-loader"><span></span><span></span><span></span></div><p class="muted center">Synchronizuję dane…</p><p class="small center">Jeśli połączenie nie odpowie, ekran automatycznie pokaże możliwość ponowienia.</p></section>`;return}
  if(!cloud.user){
    const pending=cloud.otpEmail;
    const remaining=otpCooldownRemaining();
    if(pending){app.innerHTML=`<section class="panel cloud-panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">Kod jednorazowy</span></div><span class="cloud-big">✉</span><h1>Wpisz kod z e-maila</h1><p class="muted">Kod został wysłany na <strong>${cloudEscape(pending)}</strong>. Wpisz go tutaj, aby zalogować dokładnie tę aplikację z ekranu głównego.</p>${error}<label class="field"><span>Kod logowania</span><input class="input cloud-code-input otp-code-input" id="cloud-otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="8" placeholder="123456" oninput="this.value=this.value.replace(/[^0-9]/g,'').slice(0,8)"></label><button class="button primary full" onclick="cloudVerifyOtp()">Zaloguj się kodem</button><div class="button-row auth-secondary-row"><button class="button secondary" onclick="cloudSendOtp()">${remaining>0?`Wyślij ponownie za ${remaining} s`:'Wyślij kod ponownie'}</button><button class="button tertiary" onclick="cloudChangeOtpEmail()">Zmień e-mail</button></div><p class="small center">Nie otwieraj linku w Safari. Kod wpisany tutaj zapisze sesję bezpośrednio w skrócie na ekranie głównym.</p></section>`;return}
    app.innerHTML=`<section class="panel cloud-panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">Bezpieczne logowanie</span></div><span class="cloud-big">♡</span><h1>Twoje konto</h1><p class="muted">Każda osoba loguje się na swoim telefonie. Na iPhonie najpewniej działa kod jednorazowy wpisywany bezpośrednio w aplikacji.</p>${error}<label class="field"><span>Adres e-mail</span><input class="input" id="cloud-email" type="email" autocomplete="email" placeholder="twoj@email.pl"></label><button class="button primary full" onclick="cloudSendOtp()">Wyślij kod logowania</button><div class="cloud-alert auth-info">📱 Otwórz skrót Między Nami z ekranu głównego, wyślij kod i wpisz go tutaj. Dzięki temu logowanie zostanie zapisane w aplikacji, a nie tylko w Safari.</div><p class="small center">Po zalogowaniu sesja pozostaje zapisana na tym urządzeniu. Nie trzeba logować się codziennie.</p></section>`;return}
  
  if(!cloud.couple){
    const defaultName=cloud.profile?.display_name||cloud.user.email?.split('@')[0]||settings.names[0];
    const invite=cloudEscape(cloud.pendingInviteCode||'');
    app.innerHTML=`<section class="panel wide cloud-panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><button class="link-button" onclick="cloudSignOut()">Wyloguj</button></div><span class="eyebrow">ZALOGOWANO · ${cloudEscape(cloud.user.email||'konto')}</span><h1>Połączcie telefony</h1><p class="muted center">Kod nie jest przypisany do osoby. Jedna para ma jeden wspólny, unikalny kod.</p>${error}<div class="cloud-pair-grid cloud-pair-grid-v096"><article class="cloud-join-primary"><span>1</span><h2>Mam kod partnera</h2><p class="small">Wklej kod, który partner skopiował lub udostępnił.</p><label class="field"><span>Twoje imię</span><input class="input" id="cloud-join-name" value="${cloudEscape(defaultName)}" maxlength="40"></label><label class="field"><span>Wspólny kod pary</span><div class="cloud-code-row"><input class="input cloud-code-input" id="cloud-invite-code" maxlength="6" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="A1B2C3" value="${invite}" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)"><button class="button tertiary" type="button" onclick="cloudPasteInviteCode('cloud-invite-code')">Wklej</button></div></label><button class="button primary full" onclick="cloudJoinPair()">Połącz konta</button></article><article><span>2</span><h2>Nie mamy jeszcze kodu</h2><p class="small">Tylko jedna osoba tworzy nową parę. Druga wpisuje otrzymany kod w polu obok.</p><label class="field"><span>Twoje imię</span><input class="input" id="cloud-create-name" value="${cloudEscape(defaultName)}" maxlength="40"></label><button class="button secondary full" onclick="cloudCreatePair()">Utwórz nową parę</button></article></div></section>`;return
  }
  const partner=partnerMember(),own=ownMember();
  const inviteBlock=partner?`<div class="cloud-connected-explainer"><span>✓</span><div><strong>Połączenie gotowe</strong><p>Oboje widzicie ten sam kod, ponieważ jest to wspólny kod tej pary — nie osobny kod konta.</p><details><summary>Pokaż kod pary</summary><code>${cloudEscape(cloud.couple.invite_code)}</code></details></div></div>`:`<div class="invite-card"><small>WSPÓLNY KOD ZAPROSZENIA</small><strong>${cloudEscape(cloud.couple.invite_code)}</strong><p>Wyślij kod partnerowi. Na drugim telefonie należy wybrać „Mam kod partnera” i wkleić go.</p><div class="button-row"><button class="button primary" onclick="copyInviteCode()">Kopiuj kod</button><button class="button secondary" onclick="shareInviteCode()">Udostępnij link</button></div></div><div class="cloud-switch-card"><h3>Partner też utworzył własny kod?</h3><p class="small">Nie musicie rozwiązywać tego ręcznie. Wpisz kod partnera, a pusta para zostanie bezpiecznie zamieniona.</p><div class="cloud-code-row"><input class="input cloud-code-input" id="cloud-switch-code" maxlength="6" autocomplete="one-time-code" autocapitalize="characters" spellcheck="false" placeholder="KOD PARTNERA" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,6)"><button class="button tertiary" type="button" onclick="cloudPasteInviteCode('cloud-switch-code')">Wklej</button></div><button class="button secondary full" onclick="cloudSwitchWaitingPair()">Dołącz do kodu partnera</button></div>`;
  app.innerHTML=`<section class="panel wide cloud-panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip connected-chip">● online</span></div><div class="cloud-account-head"><span>✓</span><div><small>PARA ONLINE</small><h1>${cloudEscape(own?.display_name||'Ty')} ${partner?'& '+cloudEscape(partner.display_name):''}</h1><p>${partner?'Oba telefony są połączone i mają wspólną historię.':'Czekamy, aż druga osoba wpisze wasz wspólny kod.'}</p></div></div>${error}${inviteBlock}<div class="member-list">${cloud.members.map(member=>`<div><span>${member.user_id===cloud.user.id?'TY':'♡'}</span><strong>${cloudEscape(member.display_name)}</strong><small>${member.user_id===cloud.user.id?'To urządzenie':'Partner/partnerka'}</small></div>`).join('')}${cloud.members.length<2?'<div class="waiting-member"><span>…</span><strong>Oczekiwanie</strong><small>na drugą osobę</small></div>':''}</div><div class="cloud-actions"><button class="button primary" onclick="openCloudDaily()" ${partner?'':'disabled'}>Dzisiejsze pytania</button><button class="button secondary" onclick="showCloudHistory()">Historia online</button><button class="button tertiary" onclick="syncLocalSessions().then(()=>toast('Synchronizacja zakończona.'))">Synchronizuj teraz</button></div><div class="cloud-danger-zone"><button class="link-button" onclick="cloudSignOut()">Wyloguj to urządzenie</button><button class="link-button danger-text" onclick="cloudLeavePair()">Rozwiąż parę online</button></div></section>`;
}

function renderCloudDaily(){
  const definition=cloudQuestionDefinition(),questions=cloudQuestions(definition.questionIds),draft=loadCloudDraft(definition),question=questions[draft.index],meta=ENGINE.categoryMeta(definition.category);
  if(!question){app.innerHTML='<section class="panel"><h1>Brak pytań</h1><button class="button" onclick="goHome()">Wróć</button></section>';return}
  const selected=draft.answers[draft.index];
  app.innerHTML=`<section class="panel daily-panel cloud-daily-panel" style="--daily-accent:${meta.accent}"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">Telefon: ${cloudEscape(ownMember()?.display_name)}</span></div><div class="cloud-private-badge">🔒 Odpowiadasz samodzielnie. Partner nie zobaczy odpowiedzi przed ukończeniem.</div><div class="daily-progress"><i style="width:${(draft.index+1)/5*100}%"></i></div><div class="daily-question-head"><small>${meta.icon} ${cloudEscape(meta.label)} · PYTANIE ${draft.index+1}/5</small><h1>${cloudEscape(question.prompt)}</h1></div><div class="daily-answer-list cloud-daily-answers">${question.answers.map((answer,index)=>`<button type="button" class="daily-answer ${selected===index?'selected':''}" aria-pressed="${selected===index}" onclick="cloudDailyChoose(${index})"><b>${String.fromCharCode(65+index)}</b><span>${cloudEscape(answer)}</span>${selected===index?'<i aria-hidden="true">✓</i>':''}</button>`).join('')}</div><div class="cloud-daily-nav"><button class="button tertiary" onclick="cloudDailyPrevious()" ${draft.index===0?'disabled':''}>← Poprzednie</button>${draft.index===4?`<button class="button primary" onclick="submitCloudDaily()" ${Number.isInteger(selected)?'':'disabled'}>Zatwierdź 5 odpowiedzi</button>`:`<button class="button primary" onclick="cloudDailyNext()" ${Number.isInteger(selected)?'':'disabled'}>Dalej →</button>`}</div><p class="daily-secret-note">Wybrana odpowiedź jest podświetlona i oznaczona ✓.</p></section>`;
}
function renderCloudWait(){
  const partner=partnerMember();app.innerHTML=`<section class="panel cloud-panel cloud-wait"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">Odpowiedzi zapisane</span></div><div class="waiting-orbit"><span>✓</span><i></i><b></b></div><h1>Teraz kolej ${cloudEscape(partner?.display_name||'drugiej osoby')}</h1><p class="muted">Twoje odpowiedzi są bezpiecznie zapisane. Wynik pojawi się automatycznie po ukończeniu testu na drugim telefonie.</p><div class="cloud-alert">Możesz zamknąć aplikację. Historia zsynchronizuje się po ponownym uruchomieniu.</div><button class="button primary full" onclick="refreshCloudWait()">Sprawdź, czy wynik jest gotowy</button></section>`;
}
function cloudResultRows(result){
  const questions=cloudQuestions(result.question_ids),details=Array.isArray(result.details)?result.details:[];const members=[...cloud.members].sort((a,b)=>a.role_index-b.role_index);
  return questions.map((question,index)=>{const item=details[index]||{},compat=Number(item.compatibility||0);return`<article class="daily-result-item ${ENGINE.compatibilityClass(compat)}"><div class="daily-result-number">${index+1}</div><div class="daily-result-content"><h3>${cloudEscape(question.prompt)}</h3><div class="daily-pair-answers"><div><small>${cloudEscape(members[0]?.display_name||'Osoba 1')}</small><strong><b>${String.fromCharCode(65+Number(item.leftAnswer||0))}</b>${cloudEscape(question.answers?.[item.leftAnswer]||'')}</strong></div><div><small>${cloudEscape(members[1]?.display_name||'Osoba 2')}</small><strong><b>${String.fromCharCode(65+Number(item.rightAnswer||0))}</b>${cloudEscape(question.answers?.[item.rightAnswer]||'')}</strong></div></div><span class="daily-match-label">${ENGINE.compatibilityLabel(compat)} · ${compat}%</span></div></article>`}).join('');
}
function renderCloudSummary(){
  const result=cloud.daily?.result;if(!result){ui.view='cloud-daily-wait';render();return}const meta=ENGINE.categoryMeta(result.category),labels=ENGINE.scoreLabel(result.score);
  app.innerHTML=`<section class="panel wide daily-panel cloud-summary" style="--daily-accent:${meta.accent}"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">☁ zapis online</span></div><div class="daily-result-hero"><div class="compatibility-ring" style="--score:${result.score}"><span><strong>${result.score}%</strong><small>dopasowania</small></span></div><div><span class="eyebrow">${meta.icon} ${cloudEscape(meta.label)}</span><h1>${cloudEscape(labels[0])}</h1><p>${cloudEscape(labels[1])}</p><div class="daily-result-chips"><span>✓ 2 telefony</span><span>🔒 odpowiedzi odkryte razem</span><span>☁ wspólna historia</span></div></div></div><h2>Porównanie odpowiedzi</h2><div class="daily-result-list">${cloudResultRows(result)}</div><div class="button-row"><button class="button primary" onclick="showCloudHistory()">Historia online</button><button class="button secondary" onclick="goHome()">Wróć na pulpit</button></div></section>`;
}
function renderCloudHistory(){
  const entries=cloud.history||[];const avg=entries.length?Math.round(entries.reduce((sum,item)=>sum+item.score,0)/entries.length):0;
  app.innerHTML=`<section class="panel wide cloud-panel"><div class="top-row"><button class="back-button" onclick="showCloudHub()">← Konto pary</button><span class="chip">☁ wspólne dane</span></div><h1>Historia online</h1><p class="muted">Wyniki są dostępne na obu telefonach po zalogowaniu.</p><div class="daily-stat-grid"><div><strong>${entries.length?avg+'%':'—'}</strong><span>średnia całości</span></div><div><strong>${entries.length}</strong><span>ukończonych dni</span></div><div><strong>${entries[0]?.score??'—'}${entries.length?'%':''}</strong><span>ostatni wynik</span></div><div><strong>${entries.length?Math.max(...entries.map(item=>item.score))+'%':'—'}</strong><span>najlepszy wynik</span></div></div>${entries.length?`<div class="daily-history-list">${entries.map(entry=>{const meta=ENGINE.categoryMeta(entry.category);return`<button onclick="openCloudHistoryDay('${entry.quiz_date}')"><span class="history-icon" style="--daily-accent:${meta.accent}">${meta.icon}</span><span><strong>${cloudEscape(meta.label)}</strong><small>${cloudEscape(ENGINE.formatDailyDate(entry.quiz_date))}</small></span><b>${entry.score}%</b></button>`}).join('')}</div>`:'<div class="empty">Pierwszy wynik pojawi się po ukończeniu testu na obu telefonach.</div>'}</section>`;
}
function renderCloudHistoryDay(){const result=cloud.history.find(item=>item.quiz_date===cloud.selectedHistory);if(!result){showCloudHistory();return}const meta=ENGINE.categoryMeta(result.category);app.innerHTML=`<section class="panel wide daily-panel" style="--daily-accent:${meta.accent}"><div class="top-row"><button class="back-button" onclick="showCloudHistory()">← Historia</button><span class="chip">${cloudEscape(ENGINE.formatDailyDate(result.quiz_date))}</span></div><h1>${result.score}% · ${cloudEscape(meta.label)}</h1><div class="daily-result-list">${cloudResultRows(result)}</div></section>`}

function showCloudHub(){ui.view='cloud';ui.modal=null;render()}
function showAboutApp(){ui.view='about';ui.modal=null;render()}
function renderAboutApp(){app.innerHTML=`<section class="panel about-panel"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">v${V07_VERSION}</span></div><span class="about-logo">♡</span><h1>Między Nami</h1><p class="muted">Prywatna aplikacja z grami, pytaniami, wyzwaniami i codziennym testem dopasowania dla par.</p><div class="creator-card"><small>APLIKACJA STWORZONA PRZEZ</small><strong>${CREATOR}</strong><span>Pomysł, kierunek produktu i rozwój projektu.</span></div><div class="about-features"><div>11 aplikacji i gier</div><div>754 karty</div><div>180 pytań dziennych</div><div>Tryb jednego i dwóch telefonów</div></div><p class="small center">© ${new Date().getFullYear()} ${CREATOR}. Między Nami.</p></section>`}

const baseRenderHomeV07=renderHome;
renderHome=function(){
  baseRenderHomeV07();
  const privacy=document.querySelector('.desktop-privacy');if(privacy)privacy.insertAdjacentHTML('beforebegin',cloudStatusMarkup());
  if(privacy)privacy.innerHTML=cloudReady()?'☁ Historia pary jest synchronizowana między dwoma telefonami. Prywatne odpowiedzi pozostają ukryte do ukończenia testu.':'🔒 Bez logowania aplikacja nadal działa prywatnie na jednym urządzeniu.';
  const dailyCard=document.querySelector('.daily-launch-card');if(dailyCard&&cloudReady()){
    dailyCard.setAttribute('onclick','openCloudDaily()');
    const small=dailyCard.querySelector('.daily-launch-copy small');if(small)small.textContent=`DWA TELEFONY · ${ENGINE.categoryMeta(cloudQuestionDefinition().category).label}`;
    const text=dailyCard.querySelector('.daily-launch-copy span');if(text)text.textContent=cloud.daily?.result?'Wspólny wynik jest zapisany online.':cloud.daily?.own?'Czekamy na odpowiedzi drugiej osoby.':'Każde odpowiada na swoim telefonie. Wynik pokaże się po obu odpowiedziach.';
  }
};

const baseOpenDailyMatchV07=window.openDailyMatch;
window.openDailyMatch=function(){if(cloudReady())openCloudDaily();else baseOpenDailyMatchV07()};

const baseRenderV07=render;
render=function(){
  if(ui.view==='cloud')renderCloudHub();
  else if(ui.view==='cloud-daily')renderCloudDaily();
  else if(ui.view==='cloud-daily-wait')renderCloudWait();
  else if(ui.view==='cloud-daily-summary')renderCloudSummary();
  else if(ui.view==='cloud-history')renderCloudHistory();
  else if(ui.view==='cloud-history-day')renderCloudHistoryDay();
  else if(ui.view==='about')renderAboutApp();
  else baseRenderV07();
  if(['cloud','cloud-daily','cloud-daily-wait','cloud-daily-summary','cloud-history','cloud-history-day','about'].includes(ui.view)){renderModal();window.scrollTo({top:0,behavior:'smooth'})}
  const footer=document.querySelector('.site-footer');if(footer)footer.innerHTML=`Między Nami · stworzone przez <strong>${CREATOR}</strong>`;
  const badge=document.querySelector('.version-badge');if(badge)badge.textContent=`v${V07_VERSION}`;
};

const baseRenderModalV07=renderModal;
renderModal=function(){
  baseRenderModalV07();
  if(ui.modal==='main-menu'){
    const list=document.querySelector('.menu-list');
    if(list&&!list.querySelector('[data-v07-cloud]'))list.insertAdjacentHTML('afterbegin',`<button class="menu-item" data-v07-cloud onclick="showCloudHub()">Konto pary i dwa telefony<span>Logowanie, kod pary i synchronizacja</span></button>`);
    if(list&&!list.querySelector('[data-v07-about]'))list.insertAdjacentHTML('beforeend',`<button class="menu-item" data-v07-about onclick="showAboutApp()">O aplikacji<span>Wersja, autor i informacje o projekcie</span></button>`);
  }
};

Object.assign(window,{showCloudHub,showAboutApp,cloudRetrySync,cloudSendOtp,cloudVerifyOtp,cloudChangeOtpEmail,cloudGoogleSignIn,cloudSignOut,cloudCreatePair,cloudJoinPair,cloudSwitchWaitingPair,cloudPasteInviteCode,cloudLeavePair,copyInviteCode,shareInviteCode,openCloudDaily,cloudDailyChoose,cloudDailyNext,cloudDailyPrevious,submitCloudDaily,refreshCloudWait,showCloudHistory,openCloudHistoryDay,syncLocalSessions});

document.documentElement.dataset.version=V07_VERSION;
initCloud().finally(()=>render());
})();
