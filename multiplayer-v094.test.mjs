import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.4 rozszerza wspólne sesje o know_live i 10 pytań',()=>{
  const sql=read('006_v094_live_know_me.sql');
  assert.match(sql,/know_live/);
  assert.match(sql,/cardinality\(question_ids\) = 10/);
  assert.match(sql,/when 'know_live' then 10/);
  assert.match(sql,/p_game_key not in \('who_live', 'know_live'\)/);
});

test('serwer zachowuje blokady live i dopuszcza cztery odpowiedzi w Znasz mnie',()=>{
  const sql=read('006_v094_live_know_me.sql');
  assert.match(sql,/QUESTION_LOCKED/);
  assert.match(sql,/QUESTION_NOT_READY/);
  assert.match(sql,/when target\.game_key = 'know_live' then 3/);
  assert.match(sql,/public\.multiplayer_live_both_answers_present/);
});

test('Znasz mnie wybiera wyłącznie karty choice z dwiema do czterech opcji',()=>{
  const source=read('v094.js');
  assert.match(source,/card\?\.mode==='know'/);
  assert.match(source,/card\?\.type==='choice'/);
  assert.match(source,/card\.options\.length>=2&&card\.options\.length<=4/);
  assert.match(source,/QUESTION_COUNT=10/);
});

test('role prawdy i zgadywania zmieniają się deterministycznie co kartę',()=>{
  const source=read('v094.js');
  assert.match(source,/Math\.abs\(Number\(index\)\|\|0\)%2/);
  assert.match(source,/ownIsSubject/);
  assert.match(source,/truthAnswer/);
  assert.match(source,/guessAnswer/);
  assert.match(source,/Zmiana ról/);
});

test('odpowiedzi są odsłaniane jako prawda kontra przewidywanie',()=>{
  const source=read('v094.js');
  assert.match(source,/Prawdziwa odpowiedź/);
  assert.match(source,/Przewidywanie/);
  assert.match(source,/Trafione!/);
  assert.match(source,/Nie tym razem/);
  assert.match(source,/correctCount/);
});

test('v0.9.4 ma lobby dwóch telefonów, wznowienie i aktywną grę na pulpicie',()=>{
  const source=read('v094.js');
  assert.match(source,/Dwa telefony|TRYB NA DWÓCH TELEFONACH/);
  assert.match(source,/Jeden telefon/);
  assert.match(source,/AKTYWNA GRA NA DWÓCH TELEFONACH/);
  assert.match(source,/v094-home-session/);
  assert.match(source,/v094JoinSession/);
  assert.match(source,/v094StartLocalKnow/);
});
