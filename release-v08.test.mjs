import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.8.2 ładuje moduł interfejsu i odświeża cache PWA',()=>{
  assert.match(read('index.html'),/\/v08\.js/);
  assert.match(read('index.html'),/0\.8\.2/);
  assert.match(read('sw.js'),/miedzy-nami-v082/);
  assert.match(read('sw.js'),/\/v08\.js/);
  assert.match(read('sw.js'),/\/v081\.js/);
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


test('pakiet Pikantne 18+ jest opcjonalny i ma zabezpieczenia',()=>{
  const data=read('spicy-v081-data.js');
  const ui=read('v081.js');
  assert.match(data,/MN_V081_SPICY_CARDS/);
  assert.match(ui,/Oboje mamy 18\+ i chcemy grać/);
  assert.match(ui,/Każdą kartę możecie pominąć/);
  assert.match(ui,/categories:\[SPICY_CATEGORY\]/);
  assert.match(ui,/112 kart/);
});


test('v0.8.2 pokazuje Pikantne jako ikonę w siatce gier',()=>{
  const source=read('v082.js');
  const css=read('styles.css');
  assert.match(source,/v082-spicy-app/);
  assert.match(source,/desktop-app-name">Pikantne/);
  assert.match(css,/desktop-app\[data-tone="spicy"\]/);
  assert.match(css,/\.v081-spicy-launch\{display:none!important\}/);
});

test('v0.8.2 ma cztery jasne gry erotyczne dla par',()=>{
  const source=read('v082.js');
  const data=read('spicy-v082-data.js');
  assert.match(source,/Dopasowanie 18\+/);
  assert.match(source,/Ochota na dziś/);
  assert.match(source,/Bez tabu/);
  assert.match(source,/Tylko we dwoje/);
  assert.match(data,/Jaka pozycja jest twoją ulubioną\?/);
  assert.match(data,/seks oralny/);
  assert.match(data,/wspólnej zgody|oboje/);
});
