import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');

test('v0.7.1 dodaje stale widoczny przycisk konta i nowy moduł UX',()=>{
  const html=readFileSync(resolve(root,'index.html'),'utf8');
  assert.match(html,/id="account-button"/);
  assert.match(html,/\/v071\.js/);
  assert.match(html,/Michał Czerwiński/);
});

test('v0.7.1 porządkuje menu i obsługuje wygasły link logowania',()=>{
  const source=readFileSync(resolve(root,'v071.js'),'utf8');
  assert.match(source,/Dla was/);
  assert.match(source,/Gry i zawartość/);
  assert.match(source,/Profil i aplikacja/);
  assert.match(source,/otp_expired/);
  assert.match(source,/Synchronizacja aktywna/);
});
