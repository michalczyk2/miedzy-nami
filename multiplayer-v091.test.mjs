import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.1 dodaje bezpieczny model sesji na dwóch telefonach',()=>{
  const sql=read('003_v091_spicy_match_two_phones.sql');
  assert.match(sql,/create table if not exists public\.multiplayer_sessions/);
  assert.match(sql,/create table if not exists public\.multiplayer_submissions/);
  assert.match(sql,/cardinality\(question_ids\) = 8/);
  assert.match(sql,/cardinality\(answers\) = 8/);
  assert.match(sql,/multiplayer_both_submissions_present/);
});

test('odpowiedzi partnera są ukryte do ukończenia przez oboje',()=>{
  const sql=read('003_v091_spicy_match_two_phones.sql');
  assert.match(sql,/user_id = auth\.uid\(\)/);
  assert.match(sql,/multiplayer_both_submissions_present\(session_id\)/);
  assert.match(sql,/refresh_multiplayer_session_status/);
  assert.match(sql,/status = 'completed'/);
});

test('Dopasowanie 18+ ma wybór jednego lub dwóch telefonów i Realtime',()=>{
  const source=read('v091.js');
  assert.match(source,/Każde odpowiada u siebie/);
  assert.match(source,/Dwa telefony/);
  assert.match(source,/Jeden telefon/);
  assert.match(source,/multiplayer_sessions/);
  assert.match(source,/multiplayer_submissions/);
  assert.match(source,/postgres_changes/);
  assert.match(source,/odpowiedzi pozostają ukryte/i);
});

test('prywatne odpowiedzi 18+ nie są dopisywane do ogólnej historii',()=>{
  const source=read('v091.js');
  const sql=read('003_v091_spicy_match_two_phones.sql');
  assert.doesNotMatch(source,/from\('game_sessions'\)/);
  assert.match(source,/nie są dodawane do ogólnej historii/i);
  assert.match(sql,/rozpoczęcie nowej rundy usuwa poprzedni wynik/i);
  assert.match(sql,/delete from public\.multiplayer_sessions/);
});
