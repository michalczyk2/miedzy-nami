import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.9 dodaje jedno centrum sesji online',()=>{
  const source=read('v099.js');
  assert.match(source,/VIEW='v099-online-center'/);
  assert.match(source,/Wasze wspólne sesje/);
  assert.match(source,/Aktywne gry/);
  assert.match(source,/Wyniki gotowe/);
});

test('centrum obejmuje wszystkie dotychczasowe gry online',()=>{
  const source=read('v099.js');
  for(const key of ['spicy_match','spicy_desire','who_live','know_live','dilemma_live','scale_live'])assert.match(source,new RegExp(key));
  for(const handler of ['v091JoinSession','v092JoinSession','v093JoinSession','v094JoinSession','v097JoinSession','v098JoinSession'])assert.match(source,new RegExp(handler));
});

test('pulpit usuwa osobne banery i pokazuje jedną kartę centrum',()=>{
  const source=read('v099.js');
  const css=read('styles.css');
  assert.match(source,/cleanupLegacyHomeBanners/);
  assert.match(source,/\.v093-home-session,\.v094-home-session,\.v097-home-session,\.v098-home-session/);
  assert.match(source,/v099-home-center/);
  assert.match(source,/MutationObserver/);
  assert.match(css,/\.v099-home-center/);
});

test('centrum pobiera aktywne i ukończone sesje jednym zapytaniem',()=>{
  const source=read('v099.js');
  assert.match(source,/from\('multiplayer_sessions'\)/);
  assert.match(source,/\.in\('status',\['active','completed'\]\)/);
  assert.match(source,/\.gt\('expires_at'/);
  assert.match(source,/REQUEST_TIMEOUT_MS=12000/);
});

test('centrum uwzględnia oczekujące Codzienne Dopasowanie',()=>{
  const source=read('v099.js');
  assert.match(source,/function dailyEntry/);
  assert.match(source,/game_key:'daily_match'/);
  assert.match(source,/Partner odpowiedział — teraz twoja kolej/);
  assert.match(source,/openCloudDaily/);
});

test('sesje można bezpiecznie otworzyć i usunąć z obu telefonów',()=>{
  const source=read('v099.js');
  assert.match(source,/v099OpenSession/);
  assert.match(source,/v099RemoveSession/);
  assert.match(source,/cancel_spicy_match_session/);
  assert.match(source,/cancel_multiplayer_choice_session/);
  assert.match(source,/cancel_live_game_session/);
  assert.match(source,/Usunąć tę wspólną sesję z obu telefonów/);
});
