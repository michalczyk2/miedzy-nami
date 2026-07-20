(function(root){
'use strict';

const VERSION=String(root.MN_RELEASE?.version||'0.9.2');

function esc(value){
  if(typeof root.escapeHtml==='function')return root.escapeHtml(String(value??''));
  return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[char]));
}
function cloud(){return root.MN_CLOUD_RUNTIME||null}
function client(){return cloud()?.client||null}
function currentUser(){return cloud()?.user||null}
function currentCouple(){return cloud()?.couple||null}
function members(){return Array.isArray(cloud()?.members)?cloud().members:[]}
function ownMember(){return members().find(item=>item.user_id===currentUser()?.id)||null}
function partnerMember(){return members().find(item=>item.user_id!==currentUser()?.id)||null}
function ready(){return Boolean(client()&&currentUser()&&currentCouple()&&ownMember()&&members().length===2)}
function memberName(userId){return members().find(item=>item.user_id===userId)?.display_name||'Osoba'}
function orderedMembers(){return [...members()].sort((a,b)=>Number(a.role_index)-Number(b.role_index))}
function orderedSubmissions(submissions){
  const byUser=new Map((submissions||[]).map(item=>[item.user_id,item]));
  return orderedMembers().map(member=>byUser.get(member.user_id)).filter(Boolean);
}
function shuffled(items){
  const copy=[...(items||[])];
  for(let index=copy.length-1;index>0;index--){
    const target=Math.floor(Math.random()*(index+1));
    [copy[index],copy[target]]=[copy[target],copy[index]];
  }
  return copy;
}
function friendlyError(error,migration='004_v092_multiplayer_choice_engine.sql'){
  const raw=String(error?.message||error||'Nieznany błąd');
  const lower=raw.toLowerCase();
  if(lower.includes('create_multiplayer_choice_session')||lower.includes('submit_multiplayer_choice_session')||lower.includes('multiplayer_sessions')||lower.includes('schema cache'))return`Tryb dwóch telefonów wymaga aktualizacji bazy. Uruchom migrację ${migration} w Supabase.`;
  if(lower.includes('partner_required'))return'Druga osoba musi najpierw dołączyć do waszej pary.';
  if(lower.includes('couple_required'))return'Najpierw połączcie konta kodem pary.';
  if(lower.includes('invalid_game_key'))return'Ten tryb nie jest jeszcze dostępny online.';
  if(lower.includes('invalid_question_count'))return'Nie udało się przygotować prawidłowego zestawu pytań.';
  if(lower.includes('invalid_answer_count')||lower.includes('invalid_answers'))return'Odpowiedz na wszystkie pytania przed wysłaniem.';
  if(lower.includes('session_expired'))return'Ta runda wygasła. Rozpocznijcie nową.';
  if(lower.includes('session_not_found'))return'Ta runda nie jest już dostępna. Rozpocznijcie nową.';
  if(lower.includes('session_not_active'))return'Ta runda została już zakończona albo zastąpiona nową.';
  if(lower.includes('load failed')||lower.includes('failed to fetch')||lower.includes('network'))return'Nie udało się połączyć z drugim telefonem. Sprawdź internet i spróbuj ponownie.';
  if(typeof root.MN_FRIENDLY_ERROR==='function')return root.MN_FRIENDLY_ERROR(error);
  return raw;
}
function storage(prefix,gameKey){
  const scope=()=>`${currentCouple()?.id||'none'}:${currentUser()?.id||'none'}`;
  return{
    sessionKey:()=>`${prefix}:session:${gameKey}:${scope()}`,
    draftKey:sessionId=>`${prefix}:draft:${gameKey}:${sessionId||'none'}:${currentUser()?.id||'none'}`,
    getLastSession(){return localStorage.getItem(this.sessionKey())||''},
    setLastSession(id){if(id)localStorage.setItem(this.sessionKey(),id);else localStorage.removeItem(this.sessionKey())},
    loadDraft(sessionId,count){
      try{
        const parsed=JSON.parse(localStorage.getItem(this.draftKey(sessionId))||'null');
        if(parsed&&Array.isArray(parsed.answers))return parsed;
      }catch{}
      return{index:0,answers:Array(count).fill(null),submitted:false};
    },
    saveDraft(sessionId,draft){
      if(!sessionId)return;
      if(draft)localStorage.setItem(this.draftKey(sessionId),JSON.stringify(draft));
      else localStorage.removeItem(this.draftKey(sessionId));
    },
  };
}
async function fetchActiveSession(gameKey){
  if(!ready())return null;
  const{data,error}=await client().from('multiplayer_sessions')
    .select('id,couple_id,game_key,question_ids,status,created_by,created_at,completed_at,expires_at')
    .eq('couple_id',currentCouple().id)
    .eq('game_key',gameKey)
    .eq('status','active')
    .gt('expires_at',new Date().toISOString())
    .order('created_at',{ascending:false})
    .limit(1)
    .maybeSingle();
  if(error)throw error;
  return data||null;
}
async function fetchSessionById(sessionId){
  if(!ready()||!sessionId)return null;
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
async function createSession(gameKey,questionIds){
  const{data,error}=await client().rpc('create_multiplayer_choice_session',{p_game_key:gameKey,p_question_ids:questionIds});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  if(!row?.session_id)throw new Error('SESSION_NOT_FOUND');
  const session={...row,id:row.session_id};
  delete session.session_id;
  return session;
}
async function submitSession(sessionId,answers){
  const{data,error}=await client().rpc('submit_multiplayer_choice_session',{p_session_id:sessionId,p_answers:answers});
  if(error)throw error;
  return Array.isArray(data)?data[0]:data;
}
async function cancelSession(sessionId){
  const{error}=await client().rpc('cancel_multiplayer_choice_session',{p_session_id:sessionId});
  if(error)throw error;
}
function subscribe(scope,sessionId,onChange){
  const api=client();
  if(!api||!sessionId)return null;
  return api.channel(`mn-${scope}-${sessionId}-${currentUser()?.id||'user'}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'multiplayer_sessions',filter:`id=eq.${sessionId}`},onChange)
    .on('postgres_changes',{event:'*',schema:'public',table:'multiplayer_submissions',filter:`session_id=eq.${sessionId}`},onChange)
    .subscribe();
}
function unsubscribe(channel){
  const api=client();
  if(api&&channel)api.removeChannel(channel).catch(()=>{});
}
function setVersion(){
  document.documentElement.dataset.version=VERSION;
  document.title=`Między Nami ${VERSION} — gry dla par`;
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>{node.textContent=`v${VERSION}`});
}

root.MN_MULTIPLAYER_CORE=Object.freeze({
  version:VERSION,esc,cloud,client,currentUser,currentCouple,members,ownMember,partnerMember,ready,
  memberName,orderedMembers,orderedSubmissions,shuffled,friendlyError,storage,
  fetchActiveSession,fetchSessionById,fetchSubmissions,createSession,submitSession,cancelSession,
  subscribe,unsubscribe,setVersion,
});
})(globalThis);
