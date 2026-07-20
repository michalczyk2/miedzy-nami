import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname);
const read = (file) => readFileSync(resolve(root, file), 'utf8');

test('v0.9.11 ma jeden modułowy punkt wejścia', () => {
  const html = read('index.html');
  assert.match(html, /type="module" src="\/main\.ts"/);
  assert.doesNotMatch(html, /cdn\.jsdelivr\.net\/npm\/@supabase/);
  assert.doesNotMatch(html, /<script src="\/app\.js"/);
});

test('loader TypeScript uruchamia starsze moduły w kontrolowanej kolejności', () => {
  const source = read('main.ts');
  const app = source.indexOf("'/app.js'");
  const cloud = source.indexOf("'/v07.js'");
  const spicy = source.indexOf("'/v082.js'");
  const stability = source.indexOf("'/v083.js'");
  const multiplayer = source.indexOf("'/v091.js'");
  const core = source.indexOf("'/multiplayer-core-v092.js'");
  const desire = source.indexOf("'/v092.js'");
  const liveCore = source.indexOf("'/multiplayer-live-core-v093.js'");
  const whoLive = source.indexOf("'/v093.js'");
  const knowLive = source.indexOf("'/v094.js'");
  const dilemmaLive = source.indexOf("'/v097.js'");
  const scaleLive = source.indexOf("'/v098.js'");
  const onlineCenter = source.indexOf("'/v099.js'");
  const uxAudit = source.indexOf("'/v0910.js'");
  const stabilization = source.indexOf("'/v0911.js'");
  assert.ok(app >= 0 && cloud > app && spicy > cloud && stability > spicy && multiplayer > stability && core > multiplayer && desire > core && liveCore > desire && whoLive > liveCore && knowLive > whoLive && dilemmaLive > knowLive && scaleLive > dilemmaLive && onlineCenter > scaleLive && uxAudit > onlineCenter && stabilization > uxAudit);
  assert.match(source, /for \(const script of LEGACY_SCRIPTS\)/);
  assert.match(source, /await loadClassicScript\(script\)/);
});

test('Supabase jest przypięty jako zależność i wystawiony dla kompatybilności', () => {
  const pkg = JSON.parse(read('package.json'));
  const source = read('main.ts');
  assert.equal(pkg.dependencies['@supabase/supabase-js'], '2.57.4');
  assert.match(source, /import \{ createClient \} from '@supabase\/supabase-js'/);
  assert.match(source, /window\.supabase = \{ createClient \}/);
});

test('Vite kopiuje istniejący runtime i dopisuje hashowane zasoby do service workera', () => {
  const config = read('vite.config.ts');
  const sw = read('sw.js');
  assert.match(config, /copyLegacyAssets/);
  assert.match(config, /miedzy-nami-copy-legacy-assets/);
  assert.match(config, /__MN_VITE_ASSETS__/);
  assert.match(sw, /\/\*__MN_VITE_ASSETS__\*\/\[\]/);
  assert.match(sw, /\.\.\.BUILD_ASSETS/);
});
