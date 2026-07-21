import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');

test('arkusz v0.9.14 ładuje się po v0.9.13',()=>{
  const html=read('index.html');
  const oldIndex=html.indexOf('href="/v0913.css"');
  const newIndex=html.indexOf('href="/v0914.css"');
  assert.ok(oldIndex>=0&&newIndex>oldIndex);
});

test('karty pulpitu mają jawny odstęp bez zmiany ich logiki',()=>{
  const css=read('v0914.css');
  assert.match(css,/\.daily-launch-card\s*\{[\s\S]*margin-bottom:\s*20px\s*!important/i);
  assert.match(css,/\.v099-home-center\s*\{[\s\S]*margin-top:\s*0\s*!important/i);
});

test('dekoracja karty dziennej jest przycinana na iOS',()=>{
  const css=read('v0914.css');
  assert.match(css,/-webkit-clip-path:\s*inset\(0 round 28px\)/i);
  assert.match(css,/clip-path:\s*inset\(0 round 28px\)/i);
  assert.match(css,/contain:\s*paint/i);
  assert.match(css,/\.daily-launch-card::after[\s\S]*pointer-events:\s*none/i);
});

test('wersja i cache v0.9.14 są spójne',()=>{
  const packageJson=JSON.parse(read('package.json'));
  const versionJson=JSON.parse(read('version.json'));
  const manifest=JSON.parse(read('manifest.webmanifest'));
  assert.equal(packageJson.version,'0.9.14');
  assert.equal(versionJson.version,'0.9.14');
  assert.equal(manifest.name,'Między Nami 0.9.14');
  assert.match(read('release.js'),/version:'0\.9\.14'/);
  assert.match(read('release.js'),/cache:'miedzy-nami-v0914'/);
  assert.match(read('sw.js'),/'\/v0914\.css'/);
});
