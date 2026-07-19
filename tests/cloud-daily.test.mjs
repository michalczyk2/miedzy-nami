import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeInviteCode,isValidInviteCode,compatibilityForQuestion,buildCloudDailyResult,chooseSubmissionsForMembers,cloudDailyStatus} from '../src/core/cloud-daily-engine.mjs';

test('kod pary jest normalizowany do sześciu znaków',()=>{
  assert.equal(normalizeInviteCode(' ab-12 cd '),'AB12CD');
  assert.equal(isValidInviteCode('ab12cd'),true);
  assert.equal(isValidInviteCode('abc'),false);
});

test('punktacja online zachowuje zgodność z grą lokalną',()=>{
  assert.equal(compatibilityForQuestion({kind:'exact'},1,1),100);
  assert.equal(compatibilityForQuestion({kind:'groups',groups:[0,0,1,1]},0,1),60);
  assert.equal(compatibilityForQuestion({kind:'scale'},0,1),66);
  assert.equal(compatibilityForQuestion({kind:'exact'},0,3),0);
});

test('wynik pary powstaje dopiero z dwóch kompletnych odpowiedzi',()=>{
  const questions=[
    {id:'q1',kind:'exact'},
    {id:'q2',kind:'groups',groups:[0,0,1,1]},
    {id:'q3',kind:'scale'},
    {id:'q4',kind:'exact'},
    {id:'q5',kind:'exact'},
  ];
  const result=buildCloudDailyResult({questions,leftSubmission:{answers:[0,0,0,2,3]},rightSubmission:{answers:[0,1,1,2,0]}});
  assert.equal(result.details.length,5);
  assert.equal(result.score,65);
  assert.throws(()=>buildCloudDailyResult({questions,leftSubmission:{answers:[0]},rightSubmission:{answers:[0]}}),/DAILY_ANSWERS_INCOMPLETE/);
});

test('odpowiedzi są układane według ról w parze',()=>{
  const members=[{user_id:'b',role_index:1},{user_id:'a',role_index:0}];
  const submissions=[{user_id:'b',answers:[1]},{user_id:'a',answers:[0]}];
  const [left,right]=chooseSubmissionsForMembers(submissions,members);
  assert.equal(left.user_id,'a');
  assert.equal(right.user_id,'b');
});

test('stan ekranu rozróżnia odpowiadanie, oczekiwanie i wynik',()=>{
  assert.equal(cloudDailyStatus({}),'answering');
  assert.equal(cloudDailyStatus({ownSubmission:{}}),'waiting');
  assert.equal(cloudDailyStatus({ownSubmission:{},partnerSubmission:{}}),'finalizing');
  assert.equal(cloudDailyStatus({result:{}}),'result');
});
