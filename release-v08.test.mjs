import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.5 ładuje aplikację przez jeden moduł TypeScript',()=>{
  const html=read('index.html');
  const main=read('main.ts');
  assert.match(html,/Między Nami 0\.9\.5/);
  assert.match(html,/type="module" src="\/main\.ts"/);
  assert.match(main,/\/spicy-v082-data\.js/);
  assert.match(main,/\/v082\.js/);
  assert.match(main,/\/v083\.js/);
  assert.match(main,/\/v091\.js/);
  assert.match(main,/\/multiplayer-core-v092\.js/);
  assert.match(main,/\/v092\.js/);
  assert.match(main,/\/multiplayer-live-core-v093\.js/);
  assert.match(main,/\/v093\.js/);
  assert.match(main,/\/v094\.js/);
  assert.match(read('sw.js'),/miedzy-nami-v090|MN_RELEASE\?\.cache/);
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


test('v0.8.3 pokazuje bezpieczną aktualizację PWA',()=>{
  const source=read('v083.js');
  const sw=read('sw.js');
  assert.match(source,/Nowa wersja jest gotowa/);
  assert.match(source,/SKIP_WAITING/);
  assert.match(source,/controllerchange/);
  assert.match(sw,/event\.data\?\.type==='SKIP_WAITING'/);
  assert.doesNotMatch(sw,/install[\s\S]{0,180}skipWaiting\(\)/);
});

test('v0.8.3 tłumaczy błędy sieci i zapisuje migrację kodu pary',()=>{
  const cloud=read('v07.js');
  const stability=read('v083.js');
  const migration=read('supabase/migrations/002_fix_invite_code.sql');
  assert.match(cloud,/Nie udało się połączyć z chmurą/);
  assert.match(stability,/MN_FRIENDLY_ERROR/);
  assert.match(stability,/Tryb offline/);
  assert.match(migration,/gen_random_uuid/);
  assert.match(migration,/generate_invite_code/);
});


test('v0.9.5 ustawia wersję w buildzie i ładuje cztery tryby multiplayer',()=>{
  const main=read('main.ts');
  const appIndex=main.indexOf("'/app.js'");
  const v082Index=main.indexOf("'/v082.js'");
  const v083Index=main.indexOf("'/v083.js'");
  const v091Index=main.indexOf("'/v091.js'");
  const coreIndex=main.indexOf("'/multiplayer-core-v092.js'");
  const v092Index=main.indexOf("'/v092.js'");
  const liveCoreIndex=main.indexOf("'/multiplayer-live-core-v093.js'");
  const v093Index=main.indexOf("'/v093.js'");
  const v094Index=main.indexOf("'/v094.js'");
  assert.ok(appIndex>=0);
  assert.ok(v082Index>=0&&v083Index>v082Index&&v091Index>v083Index&&coreIndex>v091Index&&v092Index>coreIndex&&liveCoreIndex>v092Index&&v093Index>liveCoreIndex&&v094Index>v093Index);
  assert.match(main,/__APP_VERSION__/);
  assert.match(read('check-release.mjs'),/const packageJson=.*const versionJson=.*const release=/s);
});
