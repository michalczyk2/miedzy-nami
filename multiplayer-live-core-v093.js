(function(root){
'use strict';

const VERSION=String(root.MN_RELEASE?.version||'0.9.3');
const base=root.MN_MULTIPLAYER_CORE;

function client(){return base?.client?.()||root.MN_CLOUD_RUNTIME?.client||null}
function currentUser(){return base?.currentUser?.()||root.MN_CLOUD_RUNTIME?.user||null}
function currentCouple(){return base?.currentCouple?.()||root.MN_CLOUD_RUNTIME?.couple||null}
function members(){return base?.members?.()||root.MN_CLOUD_RUNTIME?.members||[]}
function ownMember(){return base?.ownMember?.()||members().find(item=>item.user_id===currentUser()?.id)||null}
function partnerMember(){return base?.partnerMember?.()||members().find(item=>item.user_id!==currentUser()?.id)||null}
function ready(){return Boolean(client()&&currentUser()&&currentCouple()&&ownMember()&&members().length===2)}
function memberName(userId){return members().find(item=>item.user_id===userId)?.display_name||'Osoba'}
function orderedMembers(){return [...members()].sort((a,b)=>Number(a.role_index)-Number(b.role_index))}

function friendlyError(error,migration='005_v093_live_who_more.sql'){
  const raw=String(error?.message||error||'Nieznany błąd');
  const lower=raw.toLowerCase();
  if(lower.includes('create_live_game_session')||lower.includes('get_live_game_state')||lower.includes('submit_live_game_answer')||lower.includes('multiplayer_live_answers')||lower.includes('schema cache'))return`Gra na żywo wymaga aktualizacji bazy. Uruchom migrację ${migration} w Supabase.`;
  if(lower.includes('partner_required'))return'Druga osoba musi najpierw dołączyć do waszej pary.';
  if(lower.includes('couple_required'))return'Najpierw połączcie konta kodem pary.';
  if(lower.includes('question_locked'))return'Ta odpowiedź jest już odsłonięta i nie można jej zmienić.';
  if(lower.includes('question_not_ready'))return'Najpierw dokończcie poprzednią kartę.';
  if(lower.includes('invalid_question_index')||lower.includes('invalid_answer'))return'Nie udało się zapisać tej odpowiedzi. Otwórz kartę ponownie.';
  if(lower.includes('session_expired'))return'Ta rozgrywka wygasła. Rozpocznijcie nową.';
  if(lower.includes('session_not_found'))return'Ta rozgrywka nie jest już dostępna.';
  if(lower.includes('session_not_active'))return'Ta rozgrywka została już zakończona albo zastąpiona nową.';
  if(lower.includes('load failed')||lower.includes('failed to fetch')||lower.includes('network'))return'Nie udało się połączyć z drugim telefonem. Sprawdź internet i spróbuj ponownie.';
  return base?.friendlyError?.(error,migration)||raw;
}

async function fetchActiveSession(gameKey){
  if(!ready())return null;
  const{data,error}=await client().from('multiplayer_sessions')
    .select('id,couple_id,game_key,question_ids,status,created_by,created_at,updated_at,completed_at,expires_at')
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

async function fetchLatestSession(gameKey){
  if(!ready())return null;
  const{data,error}=await client().from('multiplayer_sessions')
    .select('id,couple_id,game_key,question_ids,status,created_by,created_at,updated_at,completed_at,expires_at')
    .eq('couple_id',currentCouple().id)
    .eq('game_key',gameKey)
    .gt('expires_at',new Date().toISOString())
    .order('created_at',{ascending:false})
    .limit(1)
    .maybeSingle();
  if(error)throw error;
  return data||null;
}

async function createSession(gameKey,questionIds){
  const{data,error}=await client().rpc('create_live_game_session',{p_game_key:gameKey,p_question_ids:questionIds});
  if(error)throw error;
  const row=Array.isArray(data)?data[0]:data;
  if(!row?.session_id)throw new Error('SESSION_NOT_FOUND');
  const session={...row,id:row.session_id};
  delete session.session_id;
  return session;
}

async function getState(sessionId){
  const{data,error}=await client().rpc('get_live_game_state',{p_session_id:sessionId});
  if(error)throw error;
  if(!data?.session?.id)throw new Error('SESSION_NOT_FOUND');
  return data;
}

async function submitAnswer(sessionId,questionIndex,answer){
  const{data,error}=await client().rpc('submit_live_game_answer',{
    p_session_id:sessionId,
    p_question_index:questionIndex,
    p_answer:answer,
  });
  if(error)throw error;
  return data;
}

async function cancelSession(sessionId){
  const{error}=await client().rpc('cancel_live_game_session',{p_session_id:sessionId});
  if(error)throw error;
}

function subscribe(scope,sessionId,onChange){
  const api=client();
  if(!api||!sessionId)return null;
  return api.channel(`mn-live-${scope}-${sessionId}-${currentUser()?.id||'user'}`)
    .on('postgres_changes',{event:'*',schema:'public',table:'multiplayer_sessions',filter:`id=eq.${sessionId}`},onChange)
    .on('postgres_changes',{event:'*',schema:'public',table:'multiplayer_live_answers',filter:`session_id=eq.${sessionId}`},onChange)
    .subscribe();
}

function unsubscribe(channel){
  const api=client();
  if(api&&channel)api.removeChannel(channel).catch(()=>{});
}

function storage(gameKey){
  const scope=()=>`${currentCouple()?.id||'none'}:${currentUser()?.id||'none'}`;
  return{
    sessionKey:()=>`mn-live-v093:session:${gameKey}:${scope()}`,
    indexKey:sessionId=>`mn-live-v093:index:${gameKey}:${sessionId}:${currentUser()?.id||'none'}`,
    getSession(){return localStorage.getItem(this.sessionKey())||''},
    setSession(id){if(id)localStorage.setItem(this.sessionKey(),id);else localStorage.removeItem(this.sessionKey())},
    getIndex(sessionId){return Math.max(0,Number(localStorage.getItem(this.indexKey(sessionId)))||0)},
    setIndex(sessionId,index){localStorage.setItem(this.indexKey(sessionId),String(Math.max(0,Number(index)||0)))},
    clearIndex(sessionId){localStorage.removeItem(this.indexKey(sessionId))},
  };
}

root.MN_LIVE_MULTIPLAYER_CORE=Object.freeze({
  version:VERSION,client,currentUser,currentCouple,members,ownMember,partnerMember,ready,
  memberName,orderedMembers,friendlyError,fetchActiveSession,fetchLatestSession,
  createSession,getState,submitAnswer,cancelSession,subscribe,unsubscribe,storage,
});
})(globalThis);
