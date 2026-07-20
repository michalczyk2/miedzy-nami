import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.11 udostępnia stan starszego runtime modułom globalThis',()=>{
  const source=read('v0911.js');
  for(const name of ['ui','app','profile','settings','currentSession']){
    assert.match(source,new RegExp(`${name}:\\{get:`));
  }
  assert.match(source,/Object\.defineProperty\(root,name/);
});

test('router v0.9.11 otwiera gry online i ma lokalny fallback',()=>{
  const source=read('v0911.js');
  assert.match(source,/know:root\.v094OpenKnow/);
  assert.match(source,/who:root\.v093OpenWho/);
  assert.match(source,/dilemma:root\.v097OpenDilemma/);
  assert.match(source,/scale:root\.v098OpenScale/);
  assert.match(source,/spicy:root\.showSpicyHub/);
  assert.match(source,/ui\.selectedMode=id/);
  assert.match(source,/root\.openGameInfo=openGame/);
  assert.match(source,/root\.v0910OpenGame=openGame/);
});

test('zwykłe sesje lokalne są wysyłane do wspólnej tabeli pary',()=>{
  const source=read('v0911.js');
  assert.match(source,/function uploadLocalSessions/);
  assert.match(source,/from\('game_sessions'\)\.upsert/);
  assert.match(source,/onConflict:'couple_id,client_session_id'/);
  assert.match(source,/syncFinishedLocalSession/);
  assert.match(source,/Zapisywanie wyników gry/);
});

test('statystyki pobierają wspólne sesje i Codzienne Dopasowanie z Supabase',()=>{
  const source=read('v0911.js');
  assert.match(source,/from\('game_sessions'\)\.select/);
  assert.match(source,/from\('daily_results'\)\.select/);
  assert.match(source,/Wspólne dane na obu telefonach/);
  assert.match(source,/Wynik gry na jednym telefonie pojawi się także u partnera/);
  assert.match(source,/showCloudHistory\(\)/);
});

test('Pikantne usuwa stare wielkie plakietki i używa małych etykiet w treści',()=>{
  const source=read('v0911.js');
  const css=read('styles.css');
  assert.match(source,/v091-online-badge/);
  assert.match(source,/v0910-spicy-badge/);
  assert.match(source,/v0911-spicy-mode/);
  assert.match(css,/v0911-spicy-mode/);
  assert.match(css,/v0910-spicy-badge\{display:none!important/);
});

test('moduł stabilizacyjny jest ładowany i buforowany jako ostatni',()=>{
  const main=read('main.ts');
  const config=read('vite.config.ts');
  const sw=read('sw.js');
  assert.ok(main.indexOf("'/v0911.js'")>main.indexOf("'/v0910.js'"));
  assert.match(config,/'v0911\.js'/);
  assert.match(sw,/\/v0911\.js/);
});
