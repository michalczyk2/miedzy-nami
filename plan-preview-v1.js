(function(root){
'use strict';

const VERSION='plan-preview-v1';
const cards=Array.isArray(root.MN_PLAN_PREVIEW_CARDS)?root.MN_PLAN_PREVIEW_CARDS:[];
const allowedCategories=new Set(['zabawne','codzienność','podróże','jedzenie','wspomnienia','przyszłość','relacja','romantyczne','głębsze','absurdalne']);

function validate(){
  if(cards.length!==40)throw new Error(`Plan Preview wymaga 40 kart, otrzymano ${cards.length}.`);
  const ids=new Set();
  for(const card of cards){
    if(!card||card.mode!=='plan'||card.type!=='plan')throw new Error('Nieprawidłowy typ karty Plan Preview.');
    if(!card.id||ids.has(card.id))throw new Error(`Powtórzone albo puste ID: ${card.id||'brak'}`);
    ids.add(card.id);
    if(!Array.isArray(card.positives)||card.positives.length!==2)throw new Error(`Karta ${card.id} nie ma dwóch korzyści.`);
    if(!card.title||!card.twist||card.positives.some(value=>!value))throw new Error(`Karta ${card.id} ma puste pole.`);
    if(!allowedCategories.has(card.category))throw new Error(`Karta ${card.id} ma nieznaną kategorię.`);
    if(![1,2,3].includes(Number(card.level)))throw new Error(`Karta ${card.id} ma nieprawidłowy poziom.`);
    if(card.title.length>85||card.twist.length>145||card.positives.some(value=>value.length>75))throw new Error(`Karta ${card.id} jest za długa na ekran mobilny.`);
  }
}

validate();

const previousPlanCards=LIBRARY.filter(card=>card.mode==='plan');
const previousIds=new Set(previousPlanCards.map(card=>card.id));

for(let index=LIBRARY.length-1;index>=0;index--){
  if(LIBRARY[index]?.mode==='plan')LIBRARY.splice(index,1);
}
for(const id of previousIds)LIBRARY_BY_ID.delete(id);
for(const card of cards){
  const copy={...card,positives:[...card.positives]};
  LIBRARY.push(copy);
  LIBRARY_BY_ID.set(copy.id,copy);
}

MODES.plan.title='Plan — trudniejsze scenariusze';
MODES.plan.tagline='Oferta kusi, ale haczyk naprawdę zmienia decyzję.';
MODES.plan.description='Testowa paczka 40 trudniejszych scenariuszy. Każda oferta ma realny koszt, który może podzielić wasze odpowiedzi.';
MODES.plan.difficulty='Średnia';

root.MN_PLAN_PREVIEW=Object.freeze({
  version:VERSION,
  previousPlanCount:previousPlanCards.length,
  previewPlanCount:cards.length,
  previousPlanIds:Object.freeze([...previousIds]),
});

const previousRender=root.render;
root.render=function(){
  previousRender();
  if(ui?.view==='home'){
    const tile=[...document.querySelectorAll('.desktop-app,.game-card')].find(node=>/Plan/.test(node.textContent||''));
    if(tile&&!tile.querySelector('.plan-preview-badge'))tile.insertAdjacentHTML('afterbegin','<span class="plan-preview-badge">PREVIEW V1</span>');
  }
  if(['info','setup','play'].includes(ui?.view)&&(ui.selectedMode==='plan'||ui.setupMode==='plan'||currentSession?.mode==='plan')){
    const panel=document.querySelector('.panel');
    if(panel&&!panel.querySelector('.plan-preview-note'))panel.querySelector('.top-row,.session-head')?.insertAdjacentHTML('afterend',`<div class="plan-preview-note"><strong>Testowa biblioteka: 40 trudniejszych kart</strong><span>W stabilnej wersji wykryto ${previousPlanCards.length} kart Plan. Ta wersja Preview nie zmienia produkcji ani danych Supabase.</span></div>`);
  }
};

try{root.render()}catch(error){console.error('[Plan Preview V1 render]',error)}
})(globalThis);
