import test from 'node:test';
import assert from 'node:assert/strict';
import {createSmartDeck,dedupeCards,jaccardSimilarity} from '../src/core/deck-engine.mjs';

const cards=Array.from({length:24},(_,index)=>({
  id:`c-${index}`,mode:index%2?'know':'story',type:'conversation',prompt:`Unikalne pytanie numer ${index} o temat ${index%6}`,category:`cat-${index%4}`,level:index<8?1:index<16?2:3
}));

test('dedupeCards usuwa powtórzone id i treść',()=>{
  const input=[cards[0],{...cards[0],id:'inne-id'},cards[1],cards[1]];
  assert.equal(dedupeCards(input).length,2);
});

test('smart deck nie powtarza kart, gdy pula jest wystarczająca',()=>{
  const deck=createSmartDeck(cards,12,{rng:()=>0.5,intensity:3});
  assert.equal(deck.length,12);
  assert.equal(new Set(deck.map(card=>card.id)).size,12);
});

test('smart deck omija zgłoszone i nielubiane karty, gdy ma alternatywy',()=>{
  const deck=createSmartDeck(cards,10,{rng:()=>0.5,feedback:{'c-0':{rating:'flag'},'c-1':{rating:'dislike'}}});
  assert.ok(!deck.some(card=>card.id==='c-0'));
  assert.ok(!deck.some(card=>card.id==='c-1'));
});

test('smart deck preferuje nowe i polubione karty',()=>{
  const deck=createSmartDeck(cards,5,{rng:()=>0.1,seen:cards.slice(0,20).map(card=>card.id),feedback:{'c-23':{rating:'like'}}});
  assert.ok(deck.slice(0,3).some(card=>card.id==='c-23'));
});

test('podobieństwo wykrywa bardzo podobne pytania',()=>{
  const a={prompt:'Jaki jest nasz idealny wspólny weekend?'};
  const b={prompt:'Jak wygląda idealny wspólny weekend?'};
  assert.ok(jaccardSimilarity(a,b)>.45);
});
