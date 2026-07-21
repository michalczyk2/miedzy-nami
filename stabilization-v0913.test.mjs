import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('v0.9.13 ładuje nowy runtime po v0911',()=>{
  const main=read('main.ts');
  const oldIndex=main.indexOf("'/v0911.js'");
  const newIndex=main.indexOf("'/v0913.js'");
  assert.ok(oldIndex>=0&&newIndex>oldIndex);
});

test('Pikantne przekierowują stary widok do bezpiecznego huba',()=>{
  const runtime=read('v0913.js');
  assert.match(runtime,/SAFE_SPICY_VIEW='v0913-spicy-hub'/);
  assert.match(runtime,/LEGACY_SPICY_VIEW='v082-spicy-hub'/);
  assert.match(runtime,/root\.ui\.view=SAFE_SPICY_VIEW/);
  assert.match(runtime,/if\(root\.ui\?\.view===SAFE_SPICY_VIEW\|\|root\.ui\?\.view===LEGACY_SPICY_VIEW\)/);
});

test('gry online mają ciemne karty i odpowiedzi',()=>{
  const css=read('v0913.css');
  assert.match(css,/\.v093-live-card[\s\S]*background:linear-gradient/i);
  assert.match(css,/\.v093-live-options button[\s\S]*background:rgba\(255,255,255,\.055\)!important/i);
  assert.match(css,/\.v093-live-rules article[\s\S]*background:rgba\(255,255,255,\.045\)!important/i);
  assert.match(css,/\.v098-number-grid button[\s\S]*color:var\(--text\)!important/i);
});

test('nowe pliki są ładowane, cache-bustowane i wersja jest spójna',()=>{
  const index=read('index.html');
  const sw=read('sw.js');
  const packageJson=JSON.parse(read('package.json'));
  const versionJson=JSON.parse(read('version.json'));
  assert.match(index,/href="\/v0913\.css"/);
  assert.match(sw,/'\/v0913\.js'/);
  assert.match(sw,/'\/v0913\.css'/);
  assert.match(sw,/fetch\(request,\{cache:'no-store'\}\)/);
  assert.equal(packageJson.version,'0.9.13');
  assert.equal(versionJson.version,'0.9.13');
  assert.match(read('release.js'),/version:'0\.9\.13'/);
});
