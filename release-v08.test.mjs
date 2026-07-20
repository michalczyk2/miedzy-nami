import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.8 ładuje moduł interfejsu i odświeża cache PWA',()=>{
  assert.match(read('index.html'),/\/v08\.js/);
  assert.match(read('index.html'),/0\.8\.0/);
  assert.match(read('sw.js'),/miedzy-nami-v080/);
  assert.match(read('sw.js'),/\/v08\.js/);
});

test('logowanie iPhone PWA korzysta z kodu OTP',()=>{
  const source=read('v07.js');
  assert.match(source,/signInWithOtp/);
  assert.match(source,/verifyOtp\(\{email,token,type:'email'\}\)/);
  assert.match(source,/autocomplete="one-time-code"/);
  assert.match(source,/OTP_RESEND_SECONDS=60/);
});

test('v0.8 prowadzi przez jeden lub dwa telefony',()=>{
  const source=read('v08.js');
  assert.match(source,/Razem na jednym telefonie/);
  assert.match(source,/Na dwóch telefonach/);
  assert.match(source,/KROK 1 Z 2/);
  assert.match(source,/KROK 2 Z 2/);
});

test('v0.8 zapamiętuje i przywraca sesję PWA',()=>{
  const source=read('v08.js');
  assert.match(source,/Logowanie zapamiętane/);
  assert.match(source,/auth\.getSession/);
  assert.match(source,/pageshow/);
  assert.match(source,/navigator\.storage\?\.persist/);
});

test('v0.8 ma zwarte menu i pomoc pierwszego uruchomienia',()=>{
  const source=read('v08.js');
  const css=read('styles.css');
  assert.match(source,/Wasze rzeczy/);
  assert.match(source,/Pomoc i aplikacja/);
  assert.match(source,/Jak zacząć/);
  assert.match(css,/\.v08-menu-copy strong,\.v08-menu-copy small\{display:block/);
});
