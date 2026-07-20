import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.3 rozszerza sesje o Kto bardziej na żywo i 10 pytań',()=>{
  const sql=read('005_v093_live_who_more.sql');
  assert.match(sql,/who_live/);
  assert.match(sql,/cardinality\(question_ids\) = 10/);
  assert.match(sql,/when 'who_live' then 10/);
  assert.match(sql,/create_live_game_session/);
});

test('odpowiedzi każdej karty są przechowywane osobno i ujawniane dopiero po odpowiedzi obojga',()=>{
  const sql=read('005_v093_live_who_more.sql');
  assert.match(sql,/create table if not exists public\.multiplayer_live_answers/);
  assert.match(sql,/primary key \(session_id, user_id, question_index\)/);
  assert.match(sql,/multiplayer_live_both_answers_present/);
  assert.match(sql,/partner_answer.*case[\s\S]*own_answer\.answer is not null[\s\S]*partner_answer\.answer is not null/i);
});

test('serwer blokuje przeskakiwanie kart i zmianę ujawnionej odpowiedzi',()=>{
  const sql=read('005_v093_live_who_more.sql');
  assert.match(sql,/QUESTION_LOCKED/);
  assert.match(sql,/QUESTION_NOT_READY/);
  assert.match(sql,/generate_series\(0, p_question_index - 1\)/);
  assert.match(sql,/p_answer < 0 or p_answer > 2/);
});

test('wspólny klient live obsługuje RPC, Realtime, wznowienie i błędy po polsku',()=>{
  const source=read('multiplayer-live-core-v093.js');
  assert.match(source,/MN_LIVE_MULTIPLAYER_CORE/);
  assert.match(source,/create_live_game_session/);
  assert.match(source,/get_live_game_state/);
  assert.match(source,/submit_live_game_answer/);
  assert.match(source,/multiplayer_live_answers/);
  assert.match(source,/Gra na żywo wymaga aktualizacji bazy/);
});

test('Kto bardziej ma tryb jednego lub dwóch telefonów i odsłonięcie po każdej karcie',()=>{
  const source=read('v093.js');
  assert.match(source,/QUESTION_COUNT=10/);
  assert.match(source,/Jedna karta na obu telefonach/);
  assert.match(source,/Dwa telefony/);
  assert.match(source,/Jeden telefon/);
  assert.match(source,/wspólne odsłonięcie/i);
  assert.match(source,/v093NextQuestion/);
});

test('ekran główny pokazuje aktywną grę i podsumowanie liczy zgodność',()=>{
  const source=read('v093.js');
  assert.match(source,/AKTYWNA GRA NA DWÓCH TELEFONACH/);
  assert.match(source,/v093-home-session/);
  assert.match(source,/matchCount/);
  assert.match(source,/KTO BARDZIEJ\? · NA ŻYWO/);
  assert.match(source,/Nowa gra/);
});
