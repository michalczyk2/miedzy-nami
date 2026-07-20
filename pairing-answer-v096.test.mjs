import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');
const cloud=read('v07.js');
const styles=read('styles.css');
const sql=read('007_v096_pairing_ux.sql');

test('ekran pary stawia wpisanie kodu przed tworzeniem nowej pary',()=>{
  const join=cloud.indexOf('Mam kod partnera');
  const create=cloud.indexOf('Nie mamy jeszcze kodu');
  assert.ok(join>=0&&create>join);
  assert.match(cloud,/id="cloud-invite-code"/);
  assert.match(cloud,/Połącz konta/);
});

test('kod można wkleić i udostępnić jako link z automatycznym uzupełnieniem',()=>{
  assert.match(cloud,/function cloudPasteInviteCode/);
  assert.match(cloud,/searchParams\.set\('join',code\)/);
  assert.match(cloud,/INITIAL_INVITE_CODE/);
  assert.match(cloud,/Udostępnij link/);
});

test('dwie puste pary można bezpiecznie scalić przez atomową funkcję SQL',()=>{
  assert.match(cloud,/switch_waiting_couple/);
  assert.match(sql,/CURRENT_COUPLE_NOT_EMPTY/);
  assert.match(sql,/delete from public\.couples/);
  assert.match(sql,/grant execute/);
});

test('po połączeniu aplikacja wyjaśnia, że kod jest wspólny dla pary',()=>{
  assert.match(cloud,/wspólny kod tej pary/);
  assert.match(cloud,/Pokaż kod pary/);
});

test('odpowiedzi online używają właściwych klas i czytelnego zaznaczenia',()=>{
  assert.match(cloud,/daily-answer-list cloud-daily-answers/);
  assert.match(cloud,/class="daily-answer \$\{selected===index\?'selected':''\}"/);
  assert.match(cloud,/aria-pressed/);
  assert.match(cloud,/Zatwierdź 5 odpowiedzi/);
  assert.match(styles,/cloud-daily-answers \.daily-answer\.selected/);
});

test('wybór odpowiedzi nie przeskakuje sam i wymaga jawnego przycisku Dalej',()=>{
  const choose=cloud.slice(cloud.indexOf('function cloudDailyChoose'),cloud.indexOf('function cloudDailyPrevious'));
  assert.doesNotMatch(choose,/draft\.index\+\+/);
  assert.match(cloud,/function cloudDailyNext/);
  assert.match(cloud,/Dalej →/);
  assert.match(cloud,/<div class="daily-progress"><i/);
});
