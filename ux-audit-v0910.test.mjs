import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.10 dodaje bezpośredni router do wszystkich gier online',()=>{
  const source=read('v0910.js');
  assert.match(source,/function v0910OpenGame/);
  for(const handler of ['v094OpenKnow','v093OpenWho','v097OpenDilemma','v098OpenScale','showSpicyHub'])assert.match(source,new RegExp(handler));
  assert.match(source,/root\.openGameInfo=v0910OpenGame/);
});

test('pulpit układa najpierw gry online, a później lokalne',()=>{
  const source=read('v0910.js');
  assert.match(source,/ONLINE_ORDER=\['Znasz mnie','Kto bardziej','Wybór','Skala','Pikantne'\]/);
  assert.match(source,/LOCAL_ORDER=\['Fala','Plan','Słowa','Historia','Rozmowa','Wyzwania'\]/);
  assert.match(source,/Online lub na jednym telefonie/);
  assert.match(source,/Razem na jednym telefonie/);
});

test('ekrany online wyjaśniają że partner nie musi być aktywny jednocześnie',()=>{
  const source=read('v0910.js');
  assert.match(source,/Nie musicie być aktywni jednocześnie/);
  assert.match(source,/Sesja pojawi się partnerowi po otwarciu aplikacji/);
});

test('pakiety są wyjaśnione i jednoznacznie oznaczone jako jeden telefon',()=>{
  const source=read('v0910.js');
  assert.match(source,/Pakiet to gotowa sesja z kartami z kilku gier/);
  assert.match(source,/Zawsze na jednym telefonie/);
  assert.match(source,/Czym różnią się od gier/);
  assert.match(source,/v0910-pack-badge/);
});

test('plakietki Pikantnych nie dziedziczą wielkiego rozmiaru ikony',()=>{
  const source=read('v0910.js');
  const css=read('styles.css');
  assert.match(source,/<em class="v0910-spicy-badge/);
  assert.match(css,/\.v082-game-tile>\.v0910-spicy-badge/);
  assert.match(css,/width:auto!important/);
  assert.match(css,/height:auto!important/);
});

test('główne statystyki korzystają ze wspólnej historii Codziennego Dopasowania',()=>{
  const source=read('v0910.js');
  assert.match(source,/runtime\?\.history/);
  assert.match(source,/runtime\?\.daily\?\.result/);
  assert.match(source,/CODZIENNE DOPASOWANIE ONLINE/);
  assert.match(source,/showCloudHistory\(\)/);
});

test('lokalny ekran dziennych statystyk kieruje do historii online gdy istnieje wynik',()=>{
  const source=read('v0910.js');
  assert.match(source,/root\.showDailyStats=function/);
  assert.match(source,/paired\(\)&&onlineDailyEntries\(\)\.length/);
  assert.match(source,/v0910-online-history-banner/);
});

test('moduł audytu jest ostatnim krokiem startu i zasobem PWA',()=>{
  const main=read('main.ts');
  const vite=read('vite.config.ts');
  const sw=read('sw.js');
  assert.ok(main.indexOf("'/v0910.js'")>main.indexOf("'/v099.js'"));
  assert.match(vite,/'v0910\.js'/);
  assert.match(sw,/'\/v0910\.js'/);
});
