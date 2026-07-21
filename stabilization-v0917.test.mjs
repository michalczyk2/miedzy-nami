import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=(file)=>readFileSync(resolve(root,file),'utf8');

test('Vite automatycznie kopiuje wszystkie moduły wersji i zatrzymuje build przy brakującym pliku',()=>{
  const source=read('vite.config.ts');
  assert.match(source,/ROOT_RUNTIME_PATTERN/);
  assert.match(source,/discoverRuntimeAssets/);
  assert.match(source,/bootScriptPaths/);
  assert.match(source,/linkedStylesheets/);
  assert.match(source,/assertOutputFile/);
  assert.match(source,/miedzy-nami-copy-and-verify-runtime/);
});

test('main ładuje moduły z numerem wydania i v0917 jako ostatni',()=>{
  const source=read('main.ts');
  assert.match(source,/script\.src = `\$\{src\}\?v=\$\{encodeURIComponent\(VERSION\)\}`/);
  assert.ok(source.indexOf("'/v0916.js'")<source.indexOf("'/v0917.js'"));
});

test('Service Worker usuwa stare cache i pobiera zmienne pliki najpierw z sieci',()=>{
  const source=read('sw.js');
  assert.match(source,/CACHE = 'miedzy-nami-v0917'/);
  assert.match(source,/STATIC_ASSETS = \/\*__MN_STATIC_ASSETS__\*\/\[\]/);
  assert.match(source,/await self\.skipWaiting\(\)/);
  assert.match(source,/key\.startsWith\('miedzy-nami-'\)/);
  assert.match(source,/networkFirst\(event\.request, url\.pathname\)/);
  assert.match(source,/cache: 'no-store'/);
});

test('aktualizacja kontrolera przeładowuje stronę maksymalnie raz dla wydania',()=>{
  const source=read('main.ts');
  assert.match(source,/mn-sw-controller-reload-\$\{VERSION\}/);
  assert.match(source,/sessionStorage\.getItem\(reloadKey\)/);
  assert.match(source,/sessionStorage\.setItem\(reloadKey, 'done'\)/);
  assert.match(source,/updateViaCache: 'none'/);
});

test('nowa Skala jest oddzielona od starej i nie usuwa danych automatycznie',()=>{
  const source=read('v0917.js');
  assert.match(source,/v0917OpenNewScale/);
  assert.match(source,/Stara sesja Skali 1–10/);
  assert.match(source,/Usuń starą sesję online/);
  assert.match(source,/root\.confirm/);
  assert.doesNotMatch(source,/localStorage\.clear/);
});

test('UI ma jedno źródło wersji z MN_RELEASE',()=>{
  const source=read('v0917.js');
  assert.match(source,/const VERSION=String\(root\.MN_RELEASE\?\.version\|\|'0\.9\.17'\)/);
  assert.match(source,/MIĘDZY NAMI • v\$\{VERSION\}/);
  assert.match(source,/\.v08-menu-header>span/);
});

test('metadane i publiczny rejestr npm są spójne z v0.9.17',()=>{
  const pkg=JSON.parse(read('package.json'));
  const lock=JSON.parse(read('package-lock.json'));
  const version=JSON.parse(read('version.json'));
  const manifest=JSON.parse(read('manifest.webmanifest'));

  assert.equal(pkg.version,'0.9.17');
  assert.equal(lock.version,'0.9.17');
  assert.equal(lock.packages[''].version,'0.9.17');
  assert.equal(version.version,'0.9.17');
  assert.equal(manifest.name,'Między Nami 0.9.17');
  assert.match(read('release.js'),/version:'0\.9\.17'/);
  assert.doesNotMatch(read('package-lock.json'),/internal\.api\.openai|applied-caas-gateway/);
});
