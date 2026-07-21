import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname);
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('Pikantne nie uruchamia obserwatora modyfikującego własne zmiany DOM', () => {
  const runtime = read('v0911.js');
  assert.doesNotMatch(runtime, /const spicyObserver\s*=\s*new MutationObserver/);
  assert.match(runtime, /if\(pill\.className!==nextClass\)pill\.className=nextClass/);
  assert.match(runtime, /if\(pill\.textContent!==nextLabel\)pill\.textContent=nextLabel/);
});

test('gry online mają jawny kontrast na jasnych kartach', () => {
  const css = read('v0912.css');
  assert.match(css, /\.v093-live-card[\s\S]*color:\s*#24182f/i);
  assert.match(css, /\.v093-live-options button[\s\S]*color:\s*#24182f/i);
  assert.match(css, /\.v098-number-grid button[\s\S]*color:\s*#30253a/i);
  assert.match(css, /\.v093-live-rules article[\s\S]*color:\s*#24182f/i);
});

test('arkusz v0.9.12 jest ładowany i dostępny offline', () => {
  assert.match(read('index.html'), /href="\/v0912\.css"/);
  assert.match(read('sw.js'), /'\/v0912\.css'/);
});

test('wydanie ma spójną wersję 0.9.12', () => {
  const packageJson = JSON.parse(read('package.json'));
  const versionJson = JSON.parse(read('version.json'));
  assert.equal(packageJson.version, '0.9.12');
  assert.equal(versionJson.version, '0.9.12');
  assert.match(read('release.js'), /version:'0\.9\.12'/);
  assert.match(read('index.html'), /Między Nami 0\.9\.12/);
});
