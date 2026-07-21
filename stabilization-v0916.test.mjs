import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.16 poprawia główną plakietkę wersji zamiast tylko menu',()=>{
  const source=read('v0916.js');
  assert.match(source,/\.desktop-welcome \.eyebrow/);
  assert.match(source,/MIĘDZY NAMI • v\$\{VERSION\}/);
  assert.match(source,/\.v08-menu-header>span/);
});

test('stara i nowa Skala są rozpoznawane po identyfikatorach pytań',()=>{
  const source=read('v0916.js');
  assert.match(source,/V2_PREFIX='scale-v2-'/);
  assert.match(source,/function isScaleV2/);
  assert.match(source,/Klasyczna Skala 1–10/);
  assert.match(source,/Skala 1–5/);
});

test('hotfix nie usuwa starych sesji ani danych użytkownika',()=>{
  const source=read('v0916.js');
  assert.doesNotMatch(source,/localStorage\.removeItem/);
  assert.doesNotMatch(source,/cancel_live_game_session/);
  assert.doesNotMatch(source,/resetAll/);
});

test('kafelek Skali zawsze prowadzi do nowego lobby',()=>{
  const source=read('v0916.js');
  assert.match(source,/setAttribute\('onclick','v0915OpenScale\(\)'\)/);
  assert.match(source,/20 pytań testowych/);
});

test('MutationObserver wykonuje wyłącznie idempotentne poprawki',()=>{
  const source=read('v0916.js');
  assert.match(source,/function setText\(node,value\)/);
  assert.match(source,/node&&node\.textContent!==value/);
  assert.match(source,/if\(patchScheduled\)return/);
});

test('wersja, cache i pliki wydania są spójne',()=>{
  const packageJson=JSON.parse(read('package.json'));
  const versionJson=JSON.parse(read('version.json'));
  const manifest=JSON.parse(read('manifest.webmanifest'));
  const lock=JSON.parse(read('package-lock.json'));

  assert.equal(packageJson.version,'0.9.16');
  assert.equal(versionJson.version,'0.9.16');
  assert.equal(manifest.name,'Między Nami 0.9.16');
  assert.equal(lock.version,'0.9.16');
  assert.equal(lock.packages[''].version,'0.9.16');
  assert.match(read('release.js'),/version:'0\.9\.16'/);
  assert.match(read('release.js'),/cache:'miedzy-nami-v0916'/);
  assert.match(read('sw.js'),/'\/v0916\.js'/);
  assert.match(read('sw.js'),/'\/v0916\.css'/);
});

test('package-lock używa wyłącznie publicznego rejestru npm',()=>{
  const lock=read('package-lock.json');
  assert.doesNotMatch(lock,/applied-caas-gateway|internal\.api\.openai\.org/);
  assert.match(lock,/https:\/\/registry\.npmjs\.org\//);
});
