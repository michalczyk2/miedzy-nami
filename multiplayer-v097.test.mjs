import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.7 rozszerza wspólne sesje o dilemma_live i 10 pytań',()=>{
  const sql=read('008_v097_live_choice.sql');
  assert.match(sql,/dilemma_live/);
  assert.match(sql,/cardinality\(question_ids\) = 10/);
  assert.match(sql,/when 'dilemma_live' then 10/);
  assert.match(sql,/p_game_key not in \('who_live', 'know_live', 'dilemma_live'\)/);
});

test('serwer ogranicza Co wybierasz do dwóch odpowiedzi i zachowuje blokady live',()=>{
  const sql=read('008_v097_live_choice.sql');
  assert.match(sql,/when target\.game_key = 'dilemma_live' then 1/);
  assert.match(sql,/QUESTION_LOCKED/);
  assert.match(sql,/QUESTION_NOT_READY/);
  assert.match(sql,/multiplayer_live_both_answers_present/);
});

test('gra wybiera tylko dylematy z dokładnie dwiema opcjami',()=>{
  const source=read('v097.js');
  assert.match(source,/card\?\.mode==='dilemma'/);
  assert.match(source,/card\?\.type==='choice'/);
  assert.match(source,/card\.options\.length===2/);
  assert.match(source,/QUESTION_COUNT=10/);
});

test('wybór A lub B jest widoczny i wymaga osobnego zatwierdzenia',()=>{
  const source=read('v097.js');
  const styles=read('styles.css');
  assert.match(source,/pendingAnswer/);
  assert.match(source,/v097ConfirmAnswer/);
  assert.match(source,/Zatwierdź wybór/);
  assert.match(source,/aria-pressed/);
  assert.match(styles,/v097-choice-options button\.selected/);
});

test('odpowiedzi są prywatne do wspólnego odsłonięcia i podsumowanie liczy zgodność',()=>{
  const source=read('v097.js');
  assert.match(source,/Odpowiedź .* pozostaje ukryta/);
  assert.match(source,/wspólne odsłonięcie/i);
  assert.match(source,/matchCount/);
  assert.match(source,/CO WYBIERASZ\? · NA ŻYWO/);
  assert.match(source,/optionLabel\(item\.own_answer,question\)/);
});

test('v0.9.7 ma tryb jednego i dwóch telefonów, wznowienie i baner na pulpicie',()=>{
  const source=read('v097.js');
  assert.match(source,/Dwa telefony/);
  assert.match(source,/Jeden telefon/);
  assert.match(source,/v097JoinSession/);
  assert.match(source,/v097-home-session/);
  assert.match(source,/AKTYWNA GRA NA DWÓCH TELEFONACH/);
  assert.match(source,/v097StartLocalDilemma/);
});
