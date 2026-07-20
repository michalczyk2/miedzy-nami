import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const source=readFileSync(resolve(root,'v07.js'),'utf8');

test('v0.9.5 ma timeout zapytań i watchdog loadera',()=>{
  assert.match(source,/CLOUD_REQUEST_TIMEOUT_MS=12000/);
  assert.match(source,/CLOUD_LOADING_WATCHDOG_MS=15000/);
  assert.match(source,/function cloudWithTimeout/);
  assert.match(source,/function cloudBeginLoading/);
});

test('inicjalizacja auth nie wykonuje zapytań bezpośrednio w callbacku',()=>{
  assert.match(source,/onAuthStateChange\(\(_event,session\)=>\{/);
  assert.match(source,/setTimeout\(\(\)=>\{loadCloudState\(\)\.finally\(\(\)=>render\(\)\)\},0\)/);
  assert.doesNotMatch(source,/onAuthStateChange\(async/);
});

test('równoległe ładowania stanu konta są deduplikowane',()=>{
  assert.match(source,/let cloudStatePromise=null/);
  assert.match(source,/if\(cloudStatePromise\)return cloudStatePromise/);
});

test('synchronizacja historii nie blokuje ekranu konta',()=>{
  assert.match(source,/setTimeout\(\(\)=>\{cloudWithTimeout\(syncLocalSessions\(\)/);
  assert.doesNotMatch(source,/Promise\.all\(\[refreshCloudDaily\(false\),loadCloudHistory\(\),syncLocalSessions\(\)\]\)/);
});

test('ekran błędu oferuje ponowienie synchronizacji',()=>{
  assert.match(source,/cloudRetrySync/);
  assert.match(source,/Spróbuj ponownie/);
  assert.match(source,/Synchronizacja trwała zbyt długo/);
});
