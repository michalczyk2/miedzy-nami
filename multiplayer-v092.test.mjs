import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.2 rozszerza silnik sesji o Ochotę na dziś i zachowuje Dopasowanie 18+',()=>{
  const sql=read('004_v092_multiplayer_choice_engine.sql');
  assert.match(sql,/spicy_match/);
  assert.match(sql,/spicy_desire/);
  assert.match(sql,/game_key = 'spicy_match' and cardinality\(question_ids\) = 8/);
  assert.match(sql,/game_key = 'spicy_desire' and cardinality\(question_ids\) = 5/);
  assert.match(sql,/create_multiplayer_choice_session/);
  assert.match(sql,/submit_multiplayer_choice_session/);
});

test('stare RPC Dopasowania 18+ pozostają zgodnymi wrapperami',()=>{
  const sql=read('004_v092_multiplayer_choice_engine.sql');
  assert.match(sql,/create or replace function public\.create_spicy_match_session/);
  assert.match(sql,/create_multiplayer_choice_session\('spicy_match'/);
  assert.match(sql,/create or replace function public\.submit_spicy_match_session/);
  assert.match(sql,/submit_multiplayer_choice_session\(p_session_id, p_answers\)/);
});

test('wspólny klient multiplayer obsługuje Realtime, drafty i polskie błędy',()=>{
  const source=read('multiplayer-core-v092.js');
  assert.match(source,/MN_MULTIPLAYER_CORE/);
  assert.match(source,/multiplayer_sessions/);
  assert.match(source,/multiplayer_submissions/);
  assert.match(source,/postgres_changes/);
  assert.match(source,/loadDraft/);
  assert.match(source,/Nie udało się połączyć z drugim telefonem/);
});

test('Ochota na dziś działa lokalnie lub na dwóch telefonach i ma pięć pytań',()=>{
  const source=read('v092.js');
  assert.match(source,/QUESTION_COUNT=5/);
  assert.match(source,/Sprawdźcie, czego oboje chcecie/);
  assert.match(source,/Dwa telefony/);
  assert.match(source,/Jeden telefon/);
  assert.match(source,/createSession\(GAME_KEY,ids\)/);
  assert.match(source,/submitSession\(session\.id,answers\)/);
  assert.match(source,/Odpowiedz na wszystkie 5 pytań/);
});

test('podsumowanie pokazuje wspólne wybory i rozumie uzupełniający podział prowadzenia',()=>{
  const source=read('v092.js');
  assert.match(source,/WSPÓLNE WYBORY/);
  assert.match(source,/Wasz kierunek na najbliższą okazję/);
  assert.match(source,/v082-desire-06/);
  assert.match(source,/complementary/);
  assert.match(source,/Pasuje do siebie/);
  assert.match(source,/nie trafia do zwykłej historii/i);
});
