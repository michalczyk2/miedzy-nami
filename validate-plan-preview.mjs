import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync('plan-preview-v1-data.js','utf8');
const context={globalThis:{}};
vm.createContext(context);
vm.runInContext(source,context);
const cards=context.globalThis.MN_PLAN_PREVIEW_CARDS;

assert.equal(cards.length,40);
assert.equal(new Set(cards.map(card=>card.id)).size,40);
for(const card of cards){
  assert.equal(card.mode,'plan');
  assert.equal(card.type,'plan');
  assert.equal(card.positives.length,2);
  assert.ok([1,2,3].includes(card.level));
  assert.ok(card.title.length<=85);
  assert.ok(card.twist.length<=145);
}
console.log(`Plan Preview: ${cards.length}/40 kart poprawnych, ID unikalne.`);
