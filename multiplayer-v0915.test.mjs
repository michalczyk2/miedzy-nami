import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('prototyp Skali ma dokładnie 20 unikalnych pytań TypeScript',()=>{
  const source=read('scale-v2-content.ts');
  const ids=[...source.matchAll(/id:\s*'scale-v2-(\d{3})'/g)].map(match=>match[0]);
  assert.equal(ids.length,20);
  assert.equal(new Set(ids).size,20);
  for(const kind of ['agreement','likelihood','frequency','intensity','comfort'])assert.match(source,new RegExp(`scaleKind: '${kind}'`));
});

test('nowa Skala używa obecnego game_key bez nowej migracji SQL',()=>{
  const source=read('v0915.js');
  assert.match(source,/GAME_KEY='scale_live'/);
  assert.match(source,/core\.createSession\(GAME_KEY,ids\)/);
  assert.doesNotMatch(source,/scale_v2_live/);
});

test('stare sesje 1–10 są rozpoznawane po identyfikatorach i delegowane do v098',()=>{
  const source=read('v0915.js');
  assert.match(source,/V2_PREFIX='scale-v2-'/);
  assert.match(source,/function isV2Session/);
  assert.match(source,/legacyJoinSession/);
  assert.match(source,/Dokończcie rozpoczętą Skalę 1–10/);
});

test('online zapisuje wyłącznie odpowiedzi 0–4 i pokazuje skalę 1–5',()=>{
  const source=read('v0915.js');
  assert.match(source,/Math\.min\(4,Number\(answer\)\)/);
  assert.match(source,/Array\.from\(\{length:5\}/);
  assert.match(source,/\/5/);
  assert.doesNotMatch(source,/Math\.min\(9,Number\(answer\)\)/);
});

test('tryb jednego telefonu ma osobny bezpieczny zapis i ukryty etap przekazania',()=>{
  const source=read('v0915.js');
  assert.match(source,/LOCAL_STORAGE_KEY='mn-scale-v2-local-v1'/);
  assert.match(source,/phase:'first'/);
  assert.match(source,/local\.phase='handoff'/);
  assert.match(source,/Pierwsza odpowiedź jest ukryta/);
  assert.match(source,/local\.phase='second'/);
});

test('odpowiedź partnera online nie jest wyświetlana przed revealed',()=>{
  const source=read('v0915.js');
  assert.match(source,/if\(row\.revealed\)\{renderOnlineReveal/);
  assert.match(source,/if\(row\.own_done\)\{renderOnlineWaiting/);
  assert.match(source,/odpowiedź ukryta/);
});

test('nowe moduły są ładowane po dotychczasowych poprawkach',()=>{
  const main=read('main.ts');
  const index=read('index.html');
  assert.match(main,/import '\.\/scale-v2-content'/);
  assert.ok(main.indexOf("'/v0913.js'")<main.indexOf("'/v0915.js'"));
  assert.ok(index.indexOf('href="/v0914.css"')<index.indexOf('href="/v0915.css"'));
});

test('wersja, cache i Service Worker są spójne z v0.9.15',()=>{
  const packageJson=JSON.parse(read('package.json'));
  const versionJson=JSON.parse(read('version.json'));
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(packageJson.version,'0.9.15');
  assert.equal(versionJson.version,'0.9.15');
  assert.equal(manifest.name,'Między Nami 0.9.15');
  assert.match(read('release.js'),/version:'0\.9\.15'/);
  assert.match(read('release.js'),/cache:'miedzy-nami-v0915'/);
  assert.match(read('sw.js'),/'\/v0915\.js'/);
  assert.match(read('sw.js'),/'\/v0915\.css'/);
});
