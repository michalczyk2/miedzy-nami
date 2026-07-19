import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeFeedback,setCardRating,feedbackSummary} from '../src/core/card-feedback.mjs';

test('normalizacja usuwa nieznane oceny',()=>{
  const result=normalizeFeedback({a:{rating:'like'},b:{rating:'unknown'},c:'dislike'});
  assert.deepEqual(Object.keys(result).sort(),['a','c']);
});

test('ponowne kliknięcie tej samej oceny ją usuwa',()=>{
  const first=setCardRating({},'a','like');
  const second=setCardRating(first,'a','like');
  assert.equal(second.a,undefined);
});

test('podsumowanie liczy oceny',()=>{
  assert.deepEqual(feedbackSummary({a:'like',b:{rating:'flag'},c:{rating:'dislike'}}),{like:1,dislike:1,flag:1});
});
