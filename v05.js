(function(){
'use strict';

const V05_VERSION='0.5.0';
const REMOVED_DUPLICATES=new Set(['v03-wave-10','v03-wave-11','v03-wave-15','v03-wave-17','v03-dilemma-37','v03-plan-15','v03-words-10']);
const EXTRA=Array.isArray(globalThis.MN_V05_EXTRA_CARDS)?globalThis.MN_V05_EXTRA_CARDS:[];

for(let index=LIBRARY.length-1;index>=0;index--){
  if(REMOVED_DUPLICATES.has(LIBRARY[index].id))LIBRARY.splice(index,1);
}
for(const id of REMOVED_DUPLICATES)LIBRARY_BY_ID.delete(id);
for(const card of EXTRA){
  if(!LIBRARY_BY_ID.has(card.id)){
    LIBRARY.push(card);
    LIBRARY_BY_ID.set(card.id,card);
  }
}

const PACKS={
  firstDate:{id:'firstDate',icon:'✦',title:'Pierwsza randka',description:'Lekko, ciekawie i bez zbyt osobistych pytań.',modes:['know','dilemma','who','wave','tell'],categories:['zabawne','codzienność','podróże','jedzenie','przyszłość'],intensity:1,rounds:10},
  longTogether:{id:'longTogether',icon:'∞',title:'Długo razem',description:'Rytuały, wspomnienia i rzeczy, które łatwo przestać zauważać.',modes:['know','story','tell','wave','challenge'],categories:['relacja','wspomnienia','romantyczne','codzienność','przyszłość'],intensity:2,rounds:12},
  laugh:{id:'laugh',icon:'☺',title:'Dużo śmiechu',description:'Absurdalne wybory, lekkie scenariusze i zabawne wyzwania.',modes:['who','dilemma','plan','words','challenge'],categories:['zabawne','absurdalne','jedzenie','podróże'],intensity:1,rounds:12},
  travel:{id:'travel',icon:'⌁',title:'Podróże',description:'Wyjazdy, kierunki, wspomnienia i wakacyjne dylematy.',modes:['wave','know','dilemma','story','challenge'],categories:['podróże','przyszłość','wspomnienia','zabawne'],intensity:2,rounds:12},
  future:{id:'future',icon:'→',title:'Plany na przyszłość',description:'Codzienność, większe decyzje i wspólne marzenia.',modes:['know','dilemma','scale','tell','challenge'],categories:['przyszłość','relacja','codzienność','głębsze'],intensity:2,rounds:12},
  romantic:{id:'romantic',icon:'♡',title:'Romantyczny wieczór',description:'Bliskość, docenianie i spokojny czas tylko we dwoje.',modes:['wave','know','story','tell','challenge'],categories:['romantyczne','relacja','wspomnienia'],intensity:2,rounds:10},
  deep:{id:'deep',icon:'◌',title:'Głębsza rozmowa',description:'Potrzeby, granice, wartości i to, co naprawdę ważne.',modes:['know','dilemma','story','tell'],categories:['głębsze','relacja','przyszłość','wspomnienia'],intensity:3,rounds:10},
  reconnect:{id:'reconnect',icon:'↻',title:'Spokojnie po spięciu',description:'Bez oceniania. Pytania o potrzeby, wsparcie i ponowne złapanie kontaktu.',modes:['scale','story','tell','challenge'],categories:['relacja','głębsze','romantyczne'],intensity:2,rounds:8},
  weekend:{id:'weekend',icon:'☼',title:'Weekendowy reset',description:'Pomysły na wspólny czas, odpoczynek i trochę spontaniczności.',modes:['wave','dilemma','plan','story','challenge'],categories:['codzienność','podróże','jedzenie','zabawne','romantyczne'],intensity:1,rounds:10},
  challenges:{id:'challenges',icon:'+',title:'Tylko wyzwania',description:'Mniej rozmowy, więcej małych rzeczy do zrobienia razem.',modes:['challenge'],categories:[...CATEGORIES],intensity:2,rounds:10}
};

function v05ApplyDisplaySettings(){document.body.classList.toggle('high-contrast',!!settings.highContrast);document.body.classList.toggle('large-text',!!settings.largeText);document.body.classList.toggle('reduce-motion',!!settings.reducedMotion)}
function v05IsStandalone(){return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true}

function normalizeV05(){
  profile.feedback=profile.feedback&&typeof profile.feedback==='object'?profile.feedback:{};
  profile.reports=Array.isArray(profile.reports)?profile.reports:[];
  profile.errors=Array.isArray(profile.errors)?profile.errors:[];
  profile.couple=profile.couple&&typeof profile.couple==='object'?profile.couple:{};
  profile.couple={
    relationshipLength:profile.couple.relationshipLength||'1-3y',
    preferredCategories:Array.isArray(profile.couple.preferredCategories)?profile.couple.preferredCategories:[],
    avoidedCategories:Array.isArray(profile.couple.avoidedCategories)?profile.couple.avoidedCategories:[],
    directness:Math.max(1,Math.min(3,Number(profile.couple.directness)||2)),
    favoriteStyle:PACKS[profile.couple.favoriteStyle]?profile.couple.favoriteStyle:'longTogether',
    defaultRounds:[5,8,10,12,15,20,30].includes(Number(profile.couple.defaultRounds))?Number(profile.couple.defaultRounds):10
  };
  settings.rounds=Number(settings.rounds)||profile.couple.defaultRounds;
  saveProfile();saveSettings();
}
normalizeV05();

function normalizeText(value=''){
  return String(value).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/ł/g,'l').replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
}
const V05_STOPWORDS=new Set(['jak','jaki','jaka','jakie','jest','sa','nasz','nasza','nasze','wasz','wasza','czy','ktory','ktora','ktore','wyglada','bardziej']);
function cardTokens(card){
  const source=card?.type==='plan'?`${card.title||''} ${card.twist||''}`:`${card?.prompt||''} ${(card?.options||[]).join(' ')}`;
  return new Set(normalizeText(source).split(' ').filter(token=>token.length>2&&!V05_STOPWORDS.has(token)));
}
function similarity(a,b){
  const left=cardTokens(a),right=cardTokens(b);if(!left.size||!right.size)return 0;let common=0;for(const token of left)if(right.has(token))common++;return common/(left.size+right.size-common);
}
function feedbackRating(id){const value=profile.feedback?.[id];return typeof value==='string'?value:value?.rating||null}
function targetLevel(position,count,intensity){const ratio=count<=1?1:position/(count-1);if(intensity<=1)return 1;if(intensity===2)return ratio<.35?1:2;return ratio<.25?1:ratio<.7?2:3}

const previousEligibleCards=eligibleCards;
eligibleCards=function(mode,options={}){
  let cards=previousEligibleCards(mode,options);
  const avoided=new Set(profile.couple?.avoidedCategories||[]);
  const withoutAvoided=cards.filter(card=>!avoided.has(card.category));
  if(withoutAvoided.length>=5)cards=withoutAvoided;
  const safe=cards.filter(card=>feedbackRating(card.id)!=='flag');
  return safe.length?safe:cards;
};

const fallbackBuildDeck=buildDeck;
buildDeck=function(mode,count,options={}){
  const desired=Math.max(1,Number(count)||10);
  let pool=eligibleCards(mode,options);
  if(!pool.length)return fallbackBuildDeck(mode,count,options);
  const uniquePool=[];const ids=new Set();
  for(const card of pool){if(card?.id&&!ids.has(card.id)){ids.add(card.id);uniquePool.push(card)}}
  pool=uniquePool;

  const dislikedFiltered=pool.filter(card=>feedbackRating(card.id)!=='dislike');
  if(dislikedFiltered.length>=Math.min(desired,5))pool=dislikedFiltered;

  const seen=new Set(profile.seen||[]),favorites=new Set(profile.favorites||[]),preferred=new Set(profile.couple?.preferredCategories||[]);
  const chosen=[],used=new Set(),categoryCounts=new Map(),modeCounts=new Map();
  const intensity=Math.max(1,Math.min(3,Number(options.intensity)||Number(profile.couple?.directness)||Number(settings.intensity)||2));

  for(let position=0;position<Math.min(desired,pool.length);position++){
    const levelTarget=targetLevel(position,desired,intensity);let best=null,bestScore=-Infinity;
    for(const card of pool){
      if(used.has(card.id))continue;
      const last=chosen.at(-1),recent=chosen.slice(-3),rating=feedbackRating(card.id);
      let score=Math.random()*8;
      score+=seen.has(card.id)?-16:35;
      score+=favorites.has(card.id)?18:0;
      score+=rating==='like'?28:rating==='dislike'?-60:0;
      score+=preferred.has(card.category)?13:0;
      score-=(categoryCounts.get(card.category)||0)*8;
      score-=(modeCounts.get(card.mode)||0)*4;
      score-=Math.abs((card.level||1)-levelTarget)*12;
      if(last?.category===card.category)score-=24;
      if(last?.mode===card.mode)score-=18;
      if((last?.level||1)>=3&&(card.level||1)>=3)score-=45;
      for(const previous of recent){const value=similarity(card,previous);if(value>=.72)score-=90;else if(value>=.5)score-=35}
      if(score>bestScore){bestScore=score;best=card}
    }
    if(!best)break;
    chosen.push(best);used.add(best.id);
    categoryCounts.set(best.category,(categoryCounts.get(best.category)||0)+1);
    modeCounts.set(best.mode,(modeCounts.get(best.mode)||0)+1);
  }
  if(chosen.length<desired){for(const card of pool){if(chosen.length>=desired)break;if(!used.has(card.id)){chosen.push(card);used.add(card.id)}}}
  if(chosen.length<desired&&chosen.length){let index=0;while(chosen.length<desired){chosen.push({...chosen[index%chosen.length]});index++}}
  return chosen.slice(0,desired).map(card=>({...card}));
};

function ratingButton(cardId,rating,label){
  const active=feedbackRating(cardId)===rating;
  return `<button class="feedback-button ${active?'active':''}" onclick="rateCard('${cardId}','${rating}')" aria-pressed="${active}">${label}</button>`;
}
function injectFeedback(){
  if(ui.view!=='play'||!currentSession||!currentCard())return;
  const card=currentCard();
  if(['choice','plan','scale','words'].includes(card.type)&&currentSession.phase!=='reveal')return;
  if(document.querySelector('.card-feedback'))return;
  const tools=document.querySelector('.card-tools');if(!tools)return;
  tools.insertAdjacentHTML('beforebegin',`<div class="card-feedback"><span>Jak oceniacie tę kartę?</span><div>${ratingButton(card.id,'like','👍 Dobra')}${ratingButton(card.id,'dislike','👎 Nie dla nas')}<button class="feedback-button ${feedbackRating(card.id)==='flag'?'active':''}" onclick="openCardReport('${card.id}')">⚑ Problem</button></div></div>`);
}
function rateCard(cardId,rating){
  const current=feedbackRating(cardId);
  if(current===rating)delete profile.feedback[cardId];
  else profile.feedback[cardId]={rating,updatedAt:Date.now()};
  saveProfile();injectOrRefresh();toast(rating==='like'?'Zapamiętano dobrą kartę.':rating==='dislike'?'Ta karta będzie pojawiać się rzadziej.':'Ocena zapisana.');
}
function injectOrRefresh(){render()}
function openCardReport(cardId){ui.reportCardId=cardId;ui.modal='report-card';renderModal()}
function saveCardReport(){
  const reason=document.querySelector('[name="report-reason"]:checked')?.value||'inne';
  const note=document.querySelector('#report-note')?.value.trim().slice(0,180)||'';
  const cardId=ui.reportCardId;profile.feedback[cardId]={rating:'flag',updatedAt:Date.now(),reason};
  profile.reports.push({id:`report-${Date.now()}`,cardId,reason,note,createdAt:Date.now(),version:V05_VERSION});
  profile.reports=profile.reports.slice(-100);saveProfile();ui.modal=null;render();toast('Zapisano lokalne zgłoszenie. Karta została ukryta.');
}

function startPack(id){const pack=PACKS[id];if(!pack)return;profile.couple.favoriteStyle=id;saveProfile();startSession('mix',pack.rounds,{modes:pack.modes,categories:pack.categories,intensity:pack.intensity,pack:id})}
function renderPackSection(){
  if(ui.view!=='home'||document.querySelector('.pack-section'))return;
  const firstSection=document.querySelector('.section-head');if(!firstSection)return;
  const html=`<section class="pack-section"><div class="section-head"><div><h2>Pakiety tematyczne</h2><p>Gotowe sesje z równą mieszanką kart i stopniowo rosnącą intensywnością.</p></div><button class="section-link" onclick="showCoupleProfile()">Dopasuj profil →</button></div><div class="pack-grid">${Object.values(PACKS).map(pack=>`<button class="pack-card" onclick="startPack('${pack.id}')"><span>${pack.icon}</span><strong>${escapeHtml(pack.title)}</strong><p>${escapeHtml(pack.description)}</p><small>${pack.rounds} kart</small></button>`).join('')}</div></section>`;
  firstSection.insertAdjacentHTML('beforebegin',html);
}

function showCoupleProfile(){ui.view='couple-profile';ui.modal=null;render()}
function renderCoupleProfile(){
  const data=profile.couple;
  app.innerHTML=`<section class="panel wide"><div class="top-row"><button class="back-button" onclick="goHome()">← Wróć</button><span class="chip">Tylko na tym urządzeniu</span></div><h1>Profil pary</h1><p class="muted">Te ustawienia pomagają dobierać pytania. Nic nie jest wysyłane do internetu.</p><div class="form-grid"><label class="field"><span>Długość relacji</span><select class="select" id="couple-length"><option value="under3m" ${data.relationshipLength==='under3m'?'selected':''}>Do 3 miesięcy</option><option value="3-12m" ${data.relationshipLength==='3-12m'?'selected':''}>3–12 miesięcy</option><option value="1-3y" ${data.relationshipLength==='1-3y'?'selected':''}>1–3 lata</option><option value="3-7y" ${data.relationshipLength==='3-7y'?'selected':''}>3–7 lat</option><option value="7y+" ${data.relationshipLength==='7y+'?'selected':''}>Ponad 7 lat</option></select></label><label class="field"><span>Domyślna długość</span><select class="select" id="couple-rounds">${[5,8,10,12,15,20,30].map(value=>`<option value="${value}" ${data.defaultRounds===value?'selected':''}>${value} kart</option>`).join('')}</select></label><label class="field"><span>Bezpośredniość pytań</span><select class="select" id="couple-directness"><option value="1" ${data.directness===1?'selected':''}>Lekka</option><option value="2" ${data.directness===2?'selected':''}>Normalna</option><option value="3" ${data.directness===3?'selected':''}>Głęboka</option></select></label><label class="field"><span>Ulubiony styl sesji</span><select class="select" id="couple-style">${Object.values(PACKS).map(pack=>`<option value="${pack.id}" ${data.favoriteStyle===pack.id?'selected':''}>${escapeHtml(pack.title)}</option>`).join('')}</select></label></div><h3>Tematy, których chcecie więcej</h3><div class="checkbox-grid">${CATEGORIES.map(category=>`<label class="check-option"><input type="checkbox" data-pref-category="${category}" ${data.preferredCategories.includes(category)?'checked':''}>${CATEGORY_LABELS[category]}</label>`).join('')}</div><h3>Tematy pomijane domyślnie</h3><div class="checkbox-grid">${CATEGORIES.map(category=>`<label class="check-option"><input type="checkbox" data-avoid-category="${category}" ${data.avoidedCategories.includes(category)?'checked':''}>${CATEGORY_LABELS[category]}</label>`).join('')}</div><div class="button-row"><button class="button primary" onclick="saveCoupleProfile()">Zapisz profil</button><button class="button secondary" onclick="startFavoritePack()">Zagraj ulubiony pakiet</button></div></section>`;
}
function saveCoupleProfile(){
  const preferred=[...document.querySelectorAll('[data-pref-category]:checked')].map(input=>input.dataset.prefCategory);
  const avoided=[...document.querySelectorAll('[data-avoid-category]:checked')].map(input=>input.dataset.avoidCategory);
  profile.couple={relationshipLength:document.querySelector('#couple-length')?.value||'1-3y',preferredCategories:preferred.filter(value=>!avoided.includes(value)),avoidedCategories:avoided,directness:+(document.querySelector('#couple-directness')?.value||2),favoriteStyle:document.querySelector('#couple-style')?.value||'longTogether',defaultRounds:+(document.querySelector('#couple-rounds')?.value||10)};
  settings.rounds=profile.couple.defaultRounds;settings.intensity=profile.couple.directness;saveProfile();saveSettings();render();toast('Profil pary zapisany.');
}
function startFavoritePack(){startPack(profile.couple.favoriteStyle||'longTogether')}

function logRuntimeError(kind,message,details=''){
  try{profile.errors.push({kind,message:String(message).slice(0,400),details:String(details).slice(0,700),at:Date.now(),view:ui.view,version:V05_VERSION});profile.errors=profile.errors.slice(-30);saveProfile()}catch{}
}
function diagnosticData(){
  const byMode={};const byCategory={};for(const card of LIBRARY){byMode[card.mode]=(byMode[card.mode]||0)+1;byCategory[card.category]=(byCategory[card.category]||0)+1}
  const feedbackCounts={like:0,dislike:0,flag:0};for(const value of Object.values(profile.feedback||{})){const rating=typeof value==='string'?value:value?.rating;if(feedbackCounts[rating]!==undefined)feedbackCounts[rating]++}
  const storageBytes=Object.values(STORAGE).reduce((sum,key)=>sum+new Blob([localStorage.getItem(key)||'']).size,0);
  return{version:V05_VERSION,generatedAt:new Date().toISOString(),cards:LIBRARY.length,byMode,byCategory,feedback:feedbackCounts,reports:profile.reports.length,errors:profile.errors.length,storageBytes,serviceWorker:Boolean(navigator.serviceWorker?.controller),online:navigator.onLine!==false,standalone:v05IsStandalone(),userAgent:navigator.userAgent,currentView:ui.view,currentSession:currentSession?{mode:currentSession.mode,index:currentSession.index,total:currentSession.deck?.length||0}:null};
}
function showDiagnostics(){ui.view='diagnostics';ui.modal=null;render()}
function renderDiagnostics(){
  const data=diagnosticData();
  app.innerHTML=`<section class="panel wide"><div class="top-row"><button class="back-button" onclick="goHome()">← Wróć</button><span class="chip">Tryb testera</span></div><h1>Diagnostyka</h1><p class="muted">Ta sekcja ułatwia sprawdzenie aplikacji przed publikacją i zgłoszenie konkretnego błędu.</p><div class="dashboard-grid"><div class="dashboard-card"><strong>${data.version}</strong><span>wersja aplikacji</span></div><div class="dashboard-card"><strong>${data.cards}</strong><span>unikalnych kart</span></div><div class="dashboard-card"><strong>${Math.round(data.storageBytes/1024)} KB</strong><span>danych lokalnych</span></div><div class="dashboard-card"><strong>${data.serviceWorker?'OK':'—'}</strong><span>service worker</span></div><div class="dashboard-card"><strong>${data.online?'online':'offline'}</strong><span>połączenie</span></div><div class="dashboard-card"><strong>${data.errors}</strong><span>zapisanych błędów</span></div></div><h3>Karty według trybu</h3><div class="diagnostic-table">${Object.entries(data.byMode).map(([mode,count])=>`<div><span>${escapeHtml(modeMeta(mode).title)}</span><strong>${count}</strong></div>`).join('')}</div><h3>Ostatnie błędy</h3>${profile.errors.length?`<div class="list">${profile.errors.slice(-8).reverse().map(error=>`<div class="list-item"><div><strong>${escapeHtml(error.kind)}: ${escapeHtml(error.message)}</strong><p>${formatDate(error.at)} • ${escapeHtml(error.view||'nieznany ekran')}</p></div></div>`).join('')}</div>`:'<div class="empty">Brak zapisanych błędów.</div>'}<div class="button-row"><button class="button primary" onclick="exportDiagnostics()">Pobierz raport JSON</button><button class="button secondary" onclick="copyDiagnostics()">Kopiuj skrót</button><button class="button danger" onclick="clearDiagnostics()">Wyczyść błędy</button></div></section>`;
}
function exportDiagnostics(){const blob=new Blob([JSON.stringify(diagnosticData(),null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`miedzy-nami-diagnostyka-${todayKey()}.json`;link.click();setTimeout(()=>URL.revokeObjectURL(link.href),1000)}
async function copyDiagnostics(){const data=diagnosticData();const text=`Między Nami v${data.version}; karty: ${data.cards}; SW: ${data.serviceWorker?'OK':'brak'}; online: ${data.online}; błędy: ${data.errors}`;try{await navigator.clipboard.writeText(text);toast('Skopiowano skrót diagnostyczny.')}catch{toast('Nie udało się skopiować.')};}
function clearDiagnostics(){profile.errors=[];saveProfile();render();toast('Dziennik błędów wyczyszczony.')}

const previousRender=render;
let lastHistoryView=ui.view;let handlingPopState=false;
render=function(){
  if(!handlingPopState&&ui.view!==lastHistoryView){history.pushState({mnView:ui.view},'',location.href);lastHistoryView=ui.view}
  if(ui.view==='couple-profile'){v05ApplyDisplaySettings();renderCoupleProfile();renderModal();window.scrollTo({top:0,behavior:'smooth'});}
  else if(ui.view==='diagnostics'){v05ApplyDisplaySettings();renderDiagnostics();renderModal();window.scrollTo({top:0,behavior:'smooth'});}
  else previousRender();
  document.title=ui.view==='couple-profile'?'Profil pary — Między Nami':ui.view==='diagnostics'?'Diagnostyka — Między Nami':document.title;
  const badge=document.querySelector('.version-badge');if(badge)badge.textContent=`v${V05_VERSION}`;
  const heroBadge=document.querySelector('.hero .eyebrow');if(heroBadge)heroBadge.textContent=`${LIBRARY.length} KART • 10 GIER • SMART TALIA`;
  renderPackSection();injectFeedback();
};

const previousRenderModal=renderModal;
renderModal=function(){
  if(ui.modal==='report-card'){
    const card=findCard(ui.reportCardId);
    modalRoot.innerHTML=`<div class="modal-backdrop" onclick="backdropClose(event)"><section class="modal" role="dialog" aria-modal="true"><button class="close" onclick="closeModal()">×</button><h2>Zgłoś problem z kartą</h2><p class="muted">Zgłoszenie zostanie zapisane tylko na tym urządzeniu.</p><div class="report-card-preview">${escapeHtml(cardPrompt(card))}</div><div class="radio-list">${[['duplikat','To duplikat'],['niejasna','Pytanie jest niejasne'],['zbyt-osobista','Zbyt osobiste dla nas'],['literowka','Literówka lub błąd'],['inne','Inny problem']].map(([value,label],index)=>`<label><input type="radio" name="report-reason" value="${value}" ${index===0?'checked':''}>${label}</label>`).join('')}</div><label class="field"><span>Notatka opcjonalna</span><textarea class="textarea" id="report-note" maxlength="180"></textarea></label><div class="button-row"><button class="button primary" onclick="saveCardReport()">Zapisz i ukryj kartę</button><button class="button secondary" onclick="closeModal()">Anuluj</button></div></section></div>`;
    return;
  }
  previousRenderModal();
  if(ui.modal==='main-menu'){
    const list=document.querySelector('.menu-list');
    if(list&&!list.querySelector('[data-v05-profile]'))list.insertAdjacentHTML('beforeend',`<button class="menu-item" data-v05-profile onclick="showCoupleProfile()">Profil pary<span>Preferowane i pomijane tematy</span></button><button class="menu-item" onclick="showDiagnostics()">Diagnostyka<span>Wersja, karty, offline i raport błędów</span></button>`);
  }
};

window.addEventListener('error',event=>logRuntimeError('error',event.message,event.error?.stack||`${event.filename||''}:${event.lineno||''}`));
window.addEventListener('unhandledrejection',event=>logRuntimeError('promise',event.reason?.message||event.reason,event.reason?.stack||''));
window.addEventListener('pagehide',()=>{try{saveSession();saveProfile()}catch{}});
window.addEventListener('beforeunload',event=>{try{saveSession();saveProfile()}catch{}if(currentSession&&ui.view==='play'&&currentSession.index>0){event.preventDefault();event.returnValue=''}});
window.addEventListener('popstate',event=>{
  handlingPopState=true;
  if(ui.modal){ui.modal=null;renderModal()}
  else if(ui.view==='play'&&currentSession){saveSession();ui.view='home';render()}
  else{const target=event.state?.mnView;if(['home','info','setup','stats','favorites','custom','settings','couple-profile','diagnostics'].includes(target))ui.view=target;else ui.view='home';render()}
  lastHistoryView=ui.view;handlingPopState=false;
});
if(!history.state?.mnView)history.replaceState({mnView:ui.view},'',location.href);

Object.assign(window,{startPack,rateCard,openCardReport,saveCardReport,showCoupleProfile,saveCoupleProfile,startFavoritePack,showDiagnostics,exportDiagnostics,copyDiagnostics,clearDiagnostics});
render();
})();
