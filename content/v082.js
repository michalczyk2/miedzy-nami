(function(){
'use strict';

const V082_VERSION='0.8.2';
const CONSENT_KEY='mn-spicy-consent-v1';
const MATCH_KEY='mn-v082-spicy-match-v1';
const CARD_KEY='mn-v082-spicy-card-v1';
const MATCH_QUESTIONS=Array.isArray(globalThis.MN_V082_SPICY_MATCH)?globalThis.MN_V082_SPICY_MATCH:[];
const EXTRA_TALK_CARDS=[
  {id:'spicy-v2-talk-01',level:2,prompt:'Jakiego rodzaju dotyk najszybciej buduje u ciebie podniecenie?'},
  {id:'spicy-v2-talk-02',level:2,prompt:'Czy jest miejsce na ciele, któremu chciałbyś albo chciałabyś poświęcać więcej uwagi podczas bliskości?'},
  {id:'spicy-v2-talk-03',level:3,prompt:'Która fantazja wraca do ciebie najczęściej, nawet jeśli na razie ma zostać tylko fantazją?'},
  {id:'spicy-v2-talk-04',level:3,prompt:'Jakie słowa podczas seksu działają na ciebie najmocniej, a jakich zdecydowanie nie chcesz słyszeć?'},
  {id:'spicy-v2-talk-05',level:2,prompt:'Czy wolisz, kiedy druga osoba przejmuje kontrolę, czy kiedy prowadzenie zmienia się między wami?'},
  {id:'spicy-v2-talk-06',level:2,prompt:'Jaki element gry wstępnej chciałbyś albo chciałabyś częściej powtarzać?'},
  {id:'spicy-v2-talk-07',level:3,prompt:'Co musi się wydarzyć, żeby bardziej odważny pomysł nadal był dla ciebie bezpieczny i przyjemny?'},
  {id:'spicy-v2-talk-08',level:3,prompt:'Czy jest pozycja albo forma bliskości, którą chcesz lepiej dopasować do swojego komfortu i przyjemności?'},
  {id:'spicy-v2-talk-09',level:2,prompt:'Co chciałbyś albo chciałabyś zmienić w tempie lub długości naszych zbliżeń?'},
  {id:'spicy-v2-talk-10',level:2,prompt:'Jak najłatwiej powiedzieć ci podczas bliskości: wolniej, mocniej, więcej albo stop?'},
  {id:'spicy-v2-talk-11',level:2,prompt:'Jaka rzecz z naszego ostatniego seksu podobała ci się najbardziej i co dokładnie w niej zadziałało?'},
  {id:'spicy-v2-talk-12',level:3,prompt:'Co od dawna chcesz zaproponować, ale dotąd brakowało odpowiedniego momentu?'},
];
const EXTRA_ACTION_CARDS=[
  {id:'spicy-v2-action-01',level:2,prompt:'Osoba całowana wskazuje trzy miejsca na swoim ciele. Całuj każde przez około 20 sekund i po każdym zapytaj, czy kontynuować.'},
  {id:'spicy-v2-action-02',level:2,prompt:'Każde zapisuje jedną rzecz, na którą ma teraz ochotę. Odsłońcie kartki razem i wybierzcie tylko to, na co oboje mówicie „tak”.'},
  {id:'spicy-v2-action-03',level:1,prompt:'Zróbcie sobie nawzajem po trzy minuty masażu. Przed startem każda osoba wskazuje miejsca, które są dziś mile widziane.'},
  {id:'spicy-v2-action-04',level:2,prompt:'Całujcie się przez minutę bez używania dłoni. Po minucie każde mówi: kontynuujemy, zmieniamy coś albo kończymy.'},
  {id:'spicy-v2-action-05',level:2,prompt:'Powiedzcie sobie po jednej rzeczy, która podobała wam się podczas ostatniego seksu i którą chcecie kiedyś powtórzyć.'},
  {id:'spicy-v2-action-06',level:3,prompt:'Po wspólnym „tak” jedna osoba zakłada opaskę na oczy. Druga przez minutę dotyka wyłącznie wcześniej uzgodnionych miejsc. Ustalcie słowo „stop”.'},
  {id:'spicy-v2-action-07',level:2,prompt:'Każde może zdjąć jedną część ubrania drugiej osoby, ale dopiero po wyraźnym pytaniu i odpowiedzi „tak”.'},
  {id:'spicy-v2-action-08',level:2,prompt:'Przez dwie minuty jedna osoba prowadzi dotyk, a druga używa tylko słów: wolniej, mocniej, więcej albo stop. Potem zamiana.'},
  {id:'spicy-v2-action-09',level:3,prompt:'Każde proponuje jedną pozycję albo formę bliskości. Wybierzcie jedną tylko wtedy, gdy obie propozycje zostały spokojnie omówione i jest wspólna zgoda.'},
  {id:'spicy-v2-action-10',level:2,prompt:'Osoba całowana wybiera pięć miejsc na ciele. Drugie z was całuje każde przez dziesięć sekund i pyta, gdzie ma wrócić.'},
  {id:'spicy-v2-action-11',level:2,prompt:'Siedząc obok siebie, wyślijcie sobie po jednej pikantnej wiadomości. Przeczytajcie je razem, bez obowiązku realizowania propozycji.'},
  {id:'spicy-v2-action-12',level:3,prompt:'Ustawcie timer na pięć minut. Jedna osoba prowadzi w ustalonych granicach, druga może w każdej chwili zmieniać tempo lub powiedzieć „pauza”. Potem zamiana.'},
];
const TALK_CARDS=[...(Array.isArray(globalThis.MN_V082_SPICY_TALKS)?globalThis.MN_V082_SPICY_TALKS:[]),...EXTRA_TALK_CARDS];
const ACTION_CARDS=[...(Array.isArray(globalThis.MN_V082_SPICY_ACTIONS)?globalThis.MN_V082_SPICY_ACTIONS:[]),...EXTRA_ACTION_CARDS];
const MATCH_BY_ID=new Map(MATCH_QUESTIONS.map(item=>[item.id,item]));
const TALK_BY_ID=new Map(TALK_CARDS.map(item=>[item.id,item]));
const ACTION_BY_ID=new Map(ACTION_CARDS.map(item=>[item.id,item]));
const legacySpicySetup=window.startSpicyPack;

function v082Esc(value){return typeof escapeHtml==='function'?escapeHtml(value):String(value??'')}
function v082Shuffle(items){
  const copy=[...items];
  for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]]}
  return copy;
}
function v082Names(){
  const names=Array.isArray(settings?.names)?settings.names:[];
  return[names[0]||'Osoba 1',names[1]||'Osoba 2'];
}
function v082Consent(){return localStorage.getItem(CONSENT_KEY)==='yes'}
function v082RequireConsent(next){
  if(v082Consent()){next();return}
  localStorage.setItem('mn-v082-next',next.name||'showSpicyHub');
  ui.modal='v081-spicy-consent';
  renderModal();
}
function v082ConfirmAdult(){
  localStorage.setItem(CONSENT_KEY,'yes');
  ui.modal=null;
  showSpicyHub();
}
function showSpicyHub(){
  if(!v082Consent()){ui.modal='v081-spicy-consent';renderModal();return}
  ui.modal=null;
  ui.view='v082-spicy-hub';
  render();
}
function v082BackToHub(){ui.view='v082-spicy-hub';ui.modal=null;render()}
function v082LegacyMix(){
  if(typeof legacySpicySetup==='function')legacySpicySetup();
}

function v082UpdateVersion(){
  document.documentElement.dataset.version=V082_VERSION;
  document.title=document.title.replace(/0\.8\.1|0\.8\.0/g,V082_VERSION);
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>node.textContent=`v${V082_VERSION}`);
  const hero=document.querySelector('.desktop-welcome .eyebrow');
  if(hero)hero.textContent=hero.textContent.replace(/v0\.\d+\.\d+|v0\.6\.0/g,`v${V082_VERSION}`);
}
function v082InjectHomeIcon(){
  document.querySelectorAll('.v081-spicy-launch').forEach(node=>node.remove());
  if(typeof ui==='undefined'||ui.view!=='home'||document.querySelector('.v082-spicy-app'))return;
  const grid=document.querySelector('.desktop-app-grid');
  if(!grid)return;
  grid.insertAdjacentHTML('beforeend',`<button class="desktop-app v082-spicy-app" data-tone="spicy" onclick="showSpicyHub()" aria-label="Otwórz gry Pikantne 18+"><span class="desktop-app-icon"><span class="desktop-app-mini">18+</span><strong>♥</strong><em>🔥</em><i></i><b></b></span><span class="desktop-app-name">Pikantne</span><small>3 gry</small></button>`);
}
function v082InjectMenu(){
  if(ui.modal!=='main-menu')return;
  const old=document.querySelector('.v081-spicy-menu-item');
  if(old){
    old.setAttribute('onclick','showSpicyHub()');
    const title=old.querySelector('strong');if(title)title.textContent='Pikantne 18+';
    const desc=old.querySelector('small');if(desc)desc.textContent='3 różne gry dla pełnoletniej pary';
  }
}
function v082InjectPackHub(){
  const old=document.querySelector('.v081-spicy-pack');
  if(old){
    old.setAttribute('onclick','showSpicyHub()');
    const p=old.querySelector('p');if(p)p.textContent='Delikatne dopasowanie, odważniejsze pytania bez tabu i konkretne zadania.';
  }
}

function renderSpicyHub(){
  app.innerHTML=`<section class="panel wide v082-spicy-hub"><div class="top-row"><button class="back-button" onclick="goHome()">← Pulpit</button><span class="chip">TEST · PIKANTNE V2</span></div><div class="v082-spicy-hero"><span class="v082-hub-icon">♥<i>🔥</i></span><div><span class="eyebrow">PIKANTNE 18+</span><h1>Wybierzcie grę</h1><p>Trzy wyraźnie różne tryby: delikatne dopasowanie, szczera rozmowa i wspólnie zaakceptowane działania.</p></div></div><div class="v082-safety-strip"><b>Najważniejsza zasada</b><span>Gracie tylko w to, na co oboje macie ochotę. „Nie”, „pauza” i „pomiń” zawsze kończą kartę bez tłumaczenia.</span></div><div class="v082-game-grid">${v082HubTile('💞','Dopasowanie 18+','Delikatniejsze pytania o preferencje i komfort. Każde odpowiada osobno, a odpowiedzi odsłaniają się razem.',"v082StartMatch('match')",'8 pytań · jeden telefon')}${v082HubTile('💬','Bez tabu','Bardziej intymne i konkretne pytania o seks, potrzeby, fantazje, granice i pożądanie.','v082StartCards("talk")','30 pytań · bez punktów')}${v082HubTile('✦','Tylko we dwoje','Konkretne zadania do wykonania razem. Każde zaczyna się dopiero po wspólnym, wyraźnym „tak”.','v082StartCards("action")','30 zadań · zgoda i pauza')}</div><button class="v082-legacy-button" onclick="v082LegacyMix()"><span>🌶</span><span><strong>Klasyczny miks 112 kart</strong><small>Flirt, skale, wybory, rozmowy i wyzwania w jednej sesji.</small></span><i>Otwórz →</i></button></section>`;
}
function v082HubTile(icon,title,text,action,meta){
  return`<button class="v082-game-tile" onclick="${String(action).replace(/\"/g,'&quot;')}"><span>${icon}</span><div><strong>${title}</strong><p>${text}</p><small>${meta}</small></div><i>›</i></button>`;
}

function loadMatch(){
  try{return JSON.parse(localStorage.getItem(MATCH_KEY)||'null')}catch{return null}
}
function saveMatch(state){
  if(state)localStorage.setItem(MATCH_KEY,JSON.stringify(state));else localStorage.removeItem(MATCH_KEY);
}
function v082StartMatch(kind){
  const pool=MATCH_QUESTIONS.filter(item=>item.kind===kind);
  const count=kind==='desire'?5:8;
  const state={version:1,kind,ids:v082Shuffle(pool).slice(0,count).map(item=>item.id),answers:[[],[]],player:0,index:0,phase:'answer',startedAt:Date.now()};
  saveMatch(state);ui.view='v082-spicy-match';render();
}
function matchQuestion(state){return MATCH_BY_ID.get(state.ids[state.index])}
function v082ChooseMatch(answer){
  const state=loadMatch();if(!state)return v082BackToHub();
  state.answers[state.player][state.index]=Number(answer);
  if(state.index<state.ids.length-1){state.index++;saveMatch(state);render();return}
  if(state.player===0){state.phase='handoff';state.index=0;saveMatch(state);render();return}
  state.phase='summary';state.finishedAt=Date.now();saveMatch(state);render();
}
function v082BeginSecond(){
  const state=loadMatch();if(!state)return;
  state.player=1;state.index=0;state.phase='answer';saveMatch(state);render();
}
function v082RestartMatch(){
  const state=loadMatch();v082StartMatch(state?.kind||'match');
}
function renderSpicyMatch(){
  const state=loadMatch();if(!state){v082BackToHub();return}
  const names=v082Names();
  if(state.phase==='handoff'){
    app.innerHTML=`<section class="panel v082-match-panel"><div class="top-row"><button class="back-button" onclick="v082BackToHub()">← Pikantne</button><span class="chip">odpowiedzi ukryte</span></div><div class="v082-handoff"><span>⇄</span><h1>Przekaż telefon</h1><p><strong>${v082Esc(names[0])}</strong> odpowiedział(a). Teraz kolej na <strong>${v082Esc(names[1])}</strong>. Pierwsze odpowiedzi pozostają ukryte.</p><button class="button primary full" onclick="v082BeginSecond()">Zaczynam odpowiadać jako ${v082Esc(names[1])}</button></div></section>`;
    return;
  }
  if(state.phase==='summary'){renderSpicyMatchSummary(state);return}
  const question=matchQuestion(state);if(!question){v082BackToHub();return}
  const title=state.kind==='desire'?'Ochota na dziś':'Dopasowanie 18+';
  app.innerHTML=`<section class="panel v082-match-panel"><div class="top-row"><button class="back-button" onclick="v082BackToHub()">← Pikantne</button><span class="chip">${state.index+1}/${state.ids.length}</span></div><div class="v082-match-head"><span>${state.kind==='desire'?'🔥':'💞'}</span><div><small>${v082Esc(names[state.player])} · odpowiedz dla siebie</small><h1>${title}</h1></div></div><div class="v082-progress"><i style="width:${Math.round((state.index/state.ids.length)*100)}%"></i></div><article class="v082-question-card"><small>PYTANIE ${state.index+1}</small><h2>${v082Esc(question.prompt)}</h2><div class="v082-answer-grid">${question.options.map((option,index)=>`<button onclick="v082ChooseMatch(${index})"><b>${String.fromCharCode(65+index)}</b><span>${v082Esc(option)}</span></button>`).join('')}</div></article><p class="v082-private-note">🔒 Wybór drugiej osoby zobaczysz dopiero na końcu.</p></section>`;
}
function renderSpicyMatchSummary(state){
  const names=v082Names();
  const rows=state.ids.map((id,index)=>{
    const question=MATCH_BY_ID.get(id),left=Number(state.answers[0][index]),right=Number(state.answers[1][index]),same=left===right;
    return{question,left,right,same};
  });
  const matches=rows.filter(row=>row.same).length;
  const score=Math.round(matches/Math.max(1,rows.length)*100);
  const title=score>=75?'Bardzo podobne wybory':score>=45?'Macie sporo wspólnego':'Dzisiaj macie różne ochoty';
  app.innerHTML=`<section class="panel wide v082-match-panel"><div class="top-row"><button class="back-button" onclick="v082BackToHub()">← Pikantne</button><span class="chip">wynik</span></div><div class="v082-result-hero"><div class="v082-result-ring" style="--score:${score}"><strong>${score}%</strong><small>zgodności</small></div><div><span class="eyebrow">${state.kind==='desire'?'OCHOTA NA DZIŚ':'DOPASOWANIE 18+'}</span><h1>${title}</h1><p>Zgodne odpowiedzi: ${matches}/${rows.length}. Różne wybory nie są błędem — to gotowe tematy do rozmowy.</p></div></div><div class="v082-result-list">${rows.map((row,index)=>`<article class="${row.same?'same':'different'}"><div><small>${index+1}</small><h3>${v082Esc(row.question.prompt)}</h3></div><div class="v082-result-answers"><span><b>${v082Esc(names[0])}</b>${v082Esc(row.question.options[row.left])}</span><span><b>${v082Esc(names[1])}</b>${v082Esc(row.question.options[row.right])}</span></div><em>${row.same?'To samo ✓':'Inaczej'}</em></article>`).join('')}</div><div class="button-row"><button class="button primary" onclick="v082RestartMatch()">Zagraj ponownie</button><button class="button secondary" onclick="v082BackToHub()">Inna gra</button></div></section>`;
}

function loadCards(){
  try{return JSON.parse(localStorage.getItem(CARD_KEY)||'null')}catch{return null}
}
function saveCards(state){
  if(state)localStorage.setItem(CARD_KEY,JSON.stringify(state));else localStorage.removeItem(CARD_KEY);
}
function v082StartCards(kind){
  const pool=kind==='action'?ACTION_CARDS:TALK_CARDS;
  const count=Math.min(kind==='action'?10:12,pool.length);
  const state={version:1,kind,ids:v082Shuffle(pool).slice(0,count).map(item=>item.id),index:0,completed:0,startedAt:Date.now()};
  saveCards(state);ui.view='v082-spicy-cards';render();
}
function v082NextCard(done=false){
  const state=loadCards();if(!state)return v082BackToHub();
  if(done)state.completed++;
  state.index++;
  if(state.index>=state.ids.length){state.finished=true}
  saveCards(state);render();
}
function v082PauseCard(){toast('Pauza. Wróćcie do gry tylko wtedy, gdy oboje chcecie.')}
function renderSpicyCards(){
  const state=loadCards();if(!state){v082BackToHub();return}
  const map=state.kind==='action'?ACTION_BY_ID:TALK_BY_ID;
  const icon=state.kind==='action'?'✦':'💬';
  const title=state.kind==='action'?'Tylko we dwoje':'Bez tabu';
  if(state.finished){
    app.innerHTML=`<section class="panel v082-card-panel"><div class="top-row"><button class="back-button" onclick="v082BackToHub()">← Pikantne</button><span class="chip">gotowe</span></div><div class="v082-finish-card"><span>${icon}</span><h1>Koniec sesji</h1><p>${state.kind==='action'?`Wykonane wspólnie: ${state.completed}/${state.ids.length}.`:'Macie za sobą intymną rozmowę. Warto wrócić do pytań, które były najciekawsze.'}</p><button class="button primary full" onclick='v082StartCards("${state.kind}")'>Nowa sesja</button><button class="button secondary full" onclick="v082BackToHub()">Wróć do gier</button></div></section>`;
    return;
  }
  const item=map.get(state.ids[state.index]);if(!item){v082BackToHub();return}
  app.innerHTML=`<section class="panel v082-card-panel"><div class="top-row"><button class="back-button" onclick="v082BackToHub()">← Pikantne</button><span class="chip">${state.index+1}/${state.ids.length}</span></div><div class="v082-card-head"><span>${icon}</span><div><small>${state.kind==='action'?'ZADANIE ZA WSPÓLNĄ ZGODĄ':'PYTANIE DO ROZMOWY'}</small><h1>${title}</h1></div></div><article class="v082-intimate-card ${state.kind}"><small>${state.kind==='action'?'NAJPIERW OBOJE POWIEDZCIE „TAK”':'ODPOWIADAJCIE SZCZERZE, ALE TYLKO TYLE, ILE CHCECIE'}</small><h2>${v082Esc(item.prompt)}</h2></article>${state.kind==='action'?`<div class="v082-action-controls"><button class="button primary" onclick="v082NextCard(true)">Oboje: robimy ✓</button><button class="button secondary" onclick="v082NextCard(false)">Pomiń →</button><button class="button tertiary" onclick="v082PauseCard()">Pauza ■</button></div>`:`<div class="button-row"><button class="button primary" onclick="v082NextCard(true)">Omówione · następne</button><button class="button secondary" onclick="v082NextCard(false)">Pomiń</button></div>`}<p class="v082-private-note">Każda osoba może przerwać albo pominąć kartę bez uzasadnienia.</p></section>`;
}

const previousRender=window.render;
window.render=function(){
  if(ui.view==='v082-spicy-hub'){renderSpicyHub();v082UpdateVersion();return}
  if(ui.view==='v082-spicy-match'){renderSpicyMatch();v082UpdateVersion();return}
  if(ui.view==='v082-spicy-cards'){renderSpicyCards();v082UpdateVersion();return}
  previousRender();
  v082InjectHomeIcon();
  v082InjectPackHub();
  v082UpdateVersion();
};
const previousRenderModal=window.renderModal;
window.renderModal=function(){previousRenderModal();v082InjectMenu();v082UpdateVersion()};

Object.assign(window,{showSpicyHub,v082ConfirmAdult,v082BackToHub,v082LegacyMix,v082StartMatch,v082ChooseMatch,v082BeginSecond,v082RestartMatch,v082StartCards,v082NextCard,v082PauseCard});
window.startSpicyPack=showSpicyHub;
window.v081ConfirmAdult=v082ConfirmAdult;
render();
})();
