import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.8 dodaje Skalę na dwóch telefonach',()=>{
  const source=read('v098.js');
  assert.match(source,/GAME_KEY='scale_live'/);
  assert.match(source,/QUESTION_COUNT=10/);
  assert.match(source,/v098StartOnlineScale/);
  assert.match(source,/v098ConfirmAnswer/);
  assert.match(source,/SKALA 1–10/);
});

test('Skala zaznacza wartość przed jej zatwierdzeniem',()=>{
  const source=read('v098.js');
  assert.match(source,/pendingAnswer/);
  assert.match(source,/v098ChooseAnswer/);
  assert.match(source,/aria-pressed/);
  assert.match(source,/Zatwierdź wartość/);
  assert.match(source,/selected===index\?'✓':''/);
});

test('wynik Skali pokazuje różnicę i podsumowanie',()=>{
  const source=read('v098.js');
  assert.match(source,/answerDifference/);
  assert.match(source,/średnia różnica|Średnia różnica/i);
  assert.match(source,/Różnica: \$\{diff\}/);
  assert.match(source,/v098ShowSummary/);
});

test('pulpit rozróżnia gry online i na jednym telefonie',()=>{
  const source=read('v098.js');
  const css=read('styles.css');
  assert.match(source,/annotateDeviceModes/);
  assert.match(source,/1–2 TEL\./);
  assert.match(source,/1 TEL\./);
  assert.match(source,/v098-mode-legend/);
  assert.match(css,/\.v098-device-badge/);
  assert.match(css,/\.v098-mode-legend/);
});

test('pakiet Pikantne także pokazuje tryb urządzeń',()=>{
  const source=read('v098.js');
  assert.match(source,/annotateSpicyHub/);
  assert.match(source,/Dopasowanie 18\\\+\|Ochota na dziś/);
  assert.match(source,/v098-spicy-badge/);
});

test('migracja 009 zachowuje stare gry i dodaje zakres Skali',()=>{
  const sql=read('009_v098_live_scale_and_device_labels.sql');
  for(const key of ['spicy_match','spicy_desire','who_live','know_live','dilemma_live','scale_live'])assert.match(sql,new RegExp(key));
  assert.match(sql,/answer between 0 and 9/);
  assert.match(sql,/when target\.game_key = 'scale_live' then 9/);
  assert.match(sql,/cardinality\(question_ids\) = 10/);
});
