import test from 'node:test';
import assert from 'node:assert/strict';
import {scoreChoice,scoreScale,scoreWords} from '../src/core/scoring.mjs';

test('Jak dobrze mnie znasz przyznaje 2 punkty zgadującemu',()=>{
  assert.deepEqual(scoreChoice({mode:'know',same:true,firstIndex:0,secondIndex:1}),{awarded:[0,2],shared:1,match:true});
});

test('zwykła zgodność przyznaje punkt obu osobom',()=>{
  assert.deepEqual(scoreChoice({mode:'who',same:true,firstIndex:1,secondIndex:0}),{awarded:[1,1],shared:1,match:true});
});

test('skala przyznaje 3, 2, 1 lub 0 punktów',()=>{
  assert.equal(scoreScale(5,5).points,3);
  assert.equal(scoreScale(5,6).points,2);
  assert.equal(scoreScale(5,3).points,1);
  assert.equal(scoreScale(5,9).points,0);
});

test('Między słowami liczy trafione słowa bez duplikacji',()=>{
  assert.deepEqual(scoreWords(['a','b','c'],['c','x','a']),{hits:2,points:2,shared:2,match:false});
});
