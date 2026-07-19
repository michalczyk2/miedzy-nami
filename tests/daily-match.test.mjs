import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {
  buildDailyDefinition,
  calculateDailyStreak,
  dailyStats,
  questionCompatibility,
  scoreDailyMatch,
} from '../src/core/daily-match-engine.mjs';

const root=resolve(import.meta.dirname,'..');
const payload=JSON.parse(readFileSync(resolve(root,'content/daily-match.json'),'utf8'));

test('biblioteka Codziennego Dopasowania ma 180 poprawnych pytań',()=>{
  assert.equal(payload.questions.length,180);
  assert.equal(new Set(payload.questions.map(question=>question.id)).size,180);
  assert.equal(Object.keys(payload.categories).length,12);
  for(const question of payload.questions){
    assert.equal(question.answers.length,4);
    assert.equal(new Set(question.answers).size,4);
  }
});

test('ten sam dzień zawsze otrzymuje ten sam zestaw pięciu pytań',()=>{
  const first=buildDailyDefinition(payload,'2026-07-19');
  const second=buildDailyDefinition(payload,'2026-07-19');
  assert.deepEqual(first,second);
  assert.equal(first.questionIds.length,5);
  assert.equal(new Set(first.questionIds).size,5);
  for(const id of first.questionIds){
    const question=payload.questions.find(item=>item.id===id);
    assert.equal(question.category,first.category);
  }
});

test('kolejne wystąpienia kategorii wykorzystują nowe pytania',()=>{
  const categoryCount=Object.keys(payload.categories).length;
  const start=new Date('2026-07-19T12:00:00');
  const key=(date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
  const sets=[];
  for(let occurrence=0;occurrence<3;occurrence++){
    const date=new Date(start);date.setDate(date.getDate()+occurrence*categoryCount);
    sets.push(buildDailyDefinition(payload,key(date)));
  }
  assert.equal(new Set(sets.map(item=>item.category)).size,1);
  assert.equal(new Set(sets.flatMap(item=>item.questionIds)).size,15);
});

test('punktacja rozróżnia zgodność, podobieństwo i różnicę',()=>{
  const scale={kind:'scale'};
  const grouped={kind:'groups',groups:[0,0,1,1]};
  const exact={kind:'exact'};
  assert.equal(questionCompatibility(scale,1,1),100);
  assert.equal(questionCompatibility(scale,1,2),66);
  assert.equal(questionCompatibility(scale,0,3),0);
  assert.equal(questionCompatibility(grouped,0,1),60);
  assert.equal(questionCompatibility(grouped,0,2),0);
  assert.equal(questionCompatibility(exact,0,1),0);
});

test('wynik dzienny jest średnią pięciu odpowiedzi',()=>{
  const questions=[
    {id:'1',kind:'scale'},
    {id:'2',kind:'scale'},
    {id:'3',kind:'groups',groups:[0,0,1,1]},
    {id:'4',kind:'exact'},
    {id:'5',kind:'exact'},
  ];
  const scored=scoreDailyMatch(questions,[[0,1,0,2,3],[0,2,1,1,3]]);
  assert.equal(scored.results.length,5);
  assert.equal(scored.score,65);
});

test('statystyki i seria korzystają tylko z ukończonych dni',()=>{
  const days={
    '2026-07-16':{date:'2026-07-16',category:'dom',score:60,finishedAt:1},
    '2026-07-17':{date:'2026-07-17',category:'dom',score:80,finishedAt:1},
    '2026-07-18':{date:'2026-07-18',category:'relacja',score:100,finishedAt:1},
    '2026-07-19':{date:'2026-07-19',category:'praca',score:null,finishedAt:null},
  };
  const stats=dailyStats(days,'14',new Date('2026-07-19T12:00:00'));
  assert.equal(stats.entries.length,3);
  assert.equal(stats.average,80);
  assert.equal(stats.categoryAverages.dom,70);
  assert.deepEqual(calculateDailyStreak(days,'2026-07-19'),{current:3,best:3});
});
