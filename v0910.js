(function(root){
'use strict';

const VERSION='0.9.10';
const previousRender=root.render;
const previousOpenGameInfo=root.openGameInfo;
const previousShowDailyStats=root.showDailyStats;

const GAME_IDS={
  'Znasz mnie':'know',
  'Kto bardziej':'who',
  'Wybór':'dilemma',
  'Skala':'scale',
  'Pikantne':'spicy',
  'Fala':'wave',
  'Plan':'plan',
  'Słowa':'words',
  'Historia':'story',
  'Rozmowa':'tell',
  'Wyzwania':'challenge',
};
const ONLINE_ORDER=['Znasz mnie','Kto bardziej','Wybór','Skala','Pikantne'];
const LOCAL_ORDER=['Fala','Plan','Słowa','Historia','Rozmowa','Wyzwania'];

function esc(value){
  return typeof root.escapeHtml==='function'?root.escapeHtml(String(value??'')):String(value??'').replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"})[char]);
}
function cloud(){return root.MN_CLOUD_RUNTIME||null}
function paired(){const runtime=cloud();return Boolean(runtime?.couple&&runtime?.members?.length===2)}
function onlineDailyEntries(){
  const runtime=cloud();
  const rows=Array.isArray(runtime?.history)?[...runtime.history]:[];
  const today=runtime?.daily?.result;
  if(today){
    const key=today.quiz_date||today.date;
    if(key&&!rows.some(item=>(item.quiz_date||item.date)===key))rows.unshift(today);
  }
  rows.sort((a,b)=>String(b.quiz_date||b.date||'').localeCompare(String(a.quiz_date||a.date||'')));
  if(runtime&&Array.isArray(runtime.history))runtime.history=[...rows];
  return rows;
}
function onlineDailySummary(){
  const rows=onlineDailyEntries();
  const recent=rows.slice(0,14);
  const average=recent.length?Math.round(recent.reduce((sum,item)=>sum+Number(item.score||0),0)/recent.length):0;
  return{rows,recent,average,last:rows[0]?.score??null};
}

function v0910OpenGame(id){
  try{
    const direct={
      know:root.v094OpenKnow,
      who:root.v093OpenWho,
      dilemma:root.v097OpenDilemma,
      scale:root.v098OpenScale,
      spicy:root.showSpicyHub,
    }[id];
    if(typeof direct==='function')return direct();
    if(typeof previousOpenGameInfo==='function')return previousOpenGameInfo(id);
    throw new Error(`Brak ekranu gry: ${id}`);
  }catch(error){
    console.error('[Między Nami game router]',error);
    root.toast?.('Nie udało się otworzyć gry. Odśwież aplikację i spróbuj ponownie.');
  }
}

function appByName(grid,name){
  return[...grid.querySelectorAll(':scope > .desktop-app')].find(button=>button.querySelector('.desktop-app-name')?.textContent?.trim()===name)||null;
}
function groupMarkup(title,text,type){
  const section=document.createElement('section');
  section.className=`v0910-game-group ${type}`;
  section.innerHTML=`<div class="v0910-game-group-head"><span>${type==='online'?'⇄':'▣'}</span><div><h3>${esc(title)}</h3><p>${esc(text)}</p></div></div><div class="desktop-app-grid v0910-app-grid"></div>`;
  return section;
}
function enhanceHomeGames(){
  if(root.ui?.view!=='home')return;
  const grid=document.querySelector('.desktop-app-grid');
  if(!grid||grid.closest('.v0910-game-group'))return;
  const title=[...document.querySelectorAll('.desktop-section-title')].find(node=>node.querySelector('h2')?.textContent?.trim()==='Gry');
  const buttons=[...grid.querySelectorAll(':scope > .desktop-app')];
  for(const button of buttons){
    const name=button.querySelector('.desktop-app-name')?.textContent?.trim();
    const id=GAME_IDS[name];
    if(!id)continue;
    button.type='button';
    button.dataset.gameId=id;
    button.setAttribute('onclick',`v0910OpenGame('${id}')`);
    button.setAttribute('aria-label',`${name}. ${ONLINE_ORDER.includes(name)?'Wybierz grę na jednym lub dwóch telefonach.':'Gra wspólna na jednym telefonie.'}`);
  }
  document.querySelector('.v098-mode-legend')?.remove();
  if(title){
    const p=title.querySelector('p');if(p)p.textContent='Wybierz grę. Przy trybach online najpierw wybierzesz: jeden czy dwa telefony.';
    if(!document.querySelector('.v0910-home-explainer'))title.insertAdjacentHTML('afterend','<div class="v0910-home-explainer"><span>⇄ <b>1–2 telefony</b> — każde może odpowiadać u siebie</span><span>▣ <b>1 telefon</b> — gracie razem na jednym urządzeniu</span></div>');
  }
  const wrapper=document.createElement('div');wrapper.className='v0910-game-groups';
  const online=groupMarkup('Online lub na jednym telefonie','Kliknij grę, a potem wybierz sposób rozgrywki. Partner nie musi być w tej chwili w aplikacji.','online');
  const local=groupMarkup('Razem na jednym telefonie','Te gry są rozmową, historią albo wspólnym zadaniem — jedno urządzenie jest tu wygodniejsze.','local');
  const onlineGrid=online.querySelector('.desktop-app-grid');const localGrid=local.querySelector('.desktop-app-grid');
  for(const name of ONLINE_ORDER){const button=appByName(grid,name);if(button)onlineGrid.appendChild(button)}
  for(const name of LOCAL_ORDER){const button=appByName(grid,name);if(button)localGrid.appendChild(button)}
  for(const button of [...grid.querySelectorAll(':scope > .desktop-app')])localGrid.appendChild(button);
  wrapper.append(online,local);grid.replaceWith(wrapper);
  const statsTile=[...document.querySelectorAll('.utility-app')].find(node=>node.querySelector('strong')?.textContent?.trim()==='Statystyki');
  const onlineStats=onlineDailySummary();
  if(statsTile){const small=statsTile.querySelector('small');if(small&&onlineStats.rows.length)small.textContent=`${onlineStats.rows.length} wynik online · statystyki lokalne`}
}

function enhanceOnlineLobby(){
  const panel=document.querySelector('.v091-lobby');
  if(!panel||panel.querySelector('.v0910-async-note'))return;
  const modes=panel.querySelector('.v091-mode-grid');
  if(!modes)return;
  modes.insertAdjacentHTML('beforebegin','<div class="v0910-async-note"><span>☁</span><div><strong>Nie musicie być aktywni jednocześnie</strong><p>Jedna osoba może rozpocząć i odpowiedzieć teraz. Sesja pojawi się partnerowi po otwarciu aplikacji.</p></div></div>');
}

function enhancePackHub(){
  if(root.ui?.view!=='pack-hub')return;
  const hub=document.querySelector('.pack-hub');if(!hub)return;
  const intro=hub.querySelector(':scope > p.muted');
  if(intro)intro.textContent='Pakiet to gotowa sesja z kartami z kilku gier. Nie wybierasz zasad ani kategorii — zaczynacie od razu.';
  const chip=hub.querySelector('.top-row .chip');
  const buttons=[...hub.querySelectorAll('.pack-hub-grid>button')];
  if(chip)chip.textContent=`${buttons.length} gotowych zestawów · 1 telefon`;
  if(!hub.querySelector('.v0910-pack-explainer'))intro?.insertAdjacentHTML('afterend','<div class="v0910-pack-explainer"><article><span>▣</span><div><strong>Zawsze na jednym telefonie</strong><p>Pakiety mieszają rozmowy, wybory i zadania wykonywane wspólnie przy jednym urządzeniu.</p></div></article><article><span>✦</span><div><strong>Czym różnią się od gier?</strong><p>Gra ma jedną mechanikę. Pakiet jest gotowym wieczorem z kilkoma różnymi mechanikami.</p></div></article></div>');
  for(const button of buttons){
    button.type='button';button.classList.add('v0910-pack-card');
    if(!button.querySelector('.v0910-pack-badge'))button.insertAdjacentHTML('beforeend','<em class="v0910-pack-badge">1 TEL.</em>');
    const action=button.querySelector(':scope > i');if(action)action.textContent='Start na tym telefonie →';
  }
}

function enhanceSpicyHub(){
  if(root.ui?.view!=='v082-spicy-hub')return;
  const hub=document.querySelector('.v082-spicy-hub');if(!hub)return;
  hub.querySelector('.v098-spicy-legend')?.remove();
  if(!hub.querySelector('.v0910-spicy-explainer'))hub.querySelector('.v082-safety-strip')?.insertAdjacentHTML('afterend','<div class="v0910-spicy-explainer"><span><b>1–2 telefony</b> Dopasowanie 18+ i Ochota na dziś</span><span><b>1 telefon</b> Bez tabu i Tylko we dwoje</span></div>');
  const tiles=[...hub.querySelectorAll('.v082-game-tile')];
  for(const tile of tiles){
    const text=tile.textContent||'';const online=/Dopasowanie 18\+|Ochota na dziś/.test(text);
    tile.classList.toggle('v0910-spicy-online',online);tile.classList.toggle('v0910-spicy-local',!online);
    tile.querySelectorAll('.v098-spicy-badge,.v091-online-badge,.v0910-spicy-badge').forEach(node=>node.remove());
    tile.insertAdjacentHTML('beforeend',`<em class="v0910-spicy-badge ${online?'online':'local'}">${online?'1–2 TEL.':'1 TEL.'}</em>`);
    const meta=tile.querySelector('small');
    if(meta){
      if(text.includes('Dopasowanie 18+'))meta.textContent='8 pytań · wybór 1 lub 2 telefonów';
      else if(text.includes('Ochota na dziś'))meta.textContent='5 pytań · wybór 1 lub 2 telefonów';
      else if(text.includes('Bez tabu'))meta.textContent='rozmowa · jeden telefon';
      else if(text.includes('Tylko we dwoje'))meta.textContent='zadania · jeden telefon';
    }
  }
}

function enhanceStats(){
  const summary=onlineDailySummary();
  if(root.ui?.view==='stats'){
    const panel=document.querySelector('.panel.wide');if(!panel)return;
    const description=panel.querySelector(':scope > p.muted');
    if(description)description.textContent=paired()?'Codzienne Dopasowanie korzysta ze wspólnej historii online. Zwykłe sesje nadal mają osobne statystyki lokalne.':'Wyniki zapisane na tym urządzeniu.';
    const daily=panel.querySelector('.stats-feature.daily-feature');
    if(daily&&paired()){
      daily.setAttribute('onclick','showCloudHistory()');
      const small=daily.querySelector('small');const strong=daily.querySelector('strong');const span=daily.querySelector('span');const action=daily.querySelector('i');
      if(small)small.textContent='CODZIENNE DOPASOWANIE ONLINE · OSTATNIE 14';
      if(strong)strong.textContent=summary.recent.length?`${summary.average}%`:'—';
      if(span)span.textContent=`${summary.rows.length} ukończonych ${summary.rows.length===1?'dzień':'dni'} · wspólne na obu telefonach`;
      if(action)action.textContent='Otwórz historię online →';
      daily.classList.add('v0910-online-stats');
    }
    if(paired()&&!panel.querySelector('.v0910-stats-note')){
      const split=panel.querySelector('.stats-split');
      split?.insertAdjacentHTML('afterend',`<div class="v0910-stats-note"><span>☁</span><div><strong>${summary.rows.length?'Wynik online jest zapisany':'Historia online jest gotowa'}</strong><p>${summary.rows.length?`Ostatni wynik: ${esc(summary.last)}%. Zobaczysz go na obu telefonach.`:'Pierwszy wpis pojawi się po ukończeniu 5 pytań przez obie osoby.'}</p></div><button type="button" onclick="showCloudHistory()">Historia online →</button></div>`);
    }
  }
  if(root.ui?.view==='daily-stats'&&paired()&&summary.rows.length){
    const panel=document.querySelector('.daily-stats-panel');
    if(panel&&!panel.querySelector('.v0910-online-history-banner'))panel.querySelector('.top-row')?.insertAdjacentHTML('afterend',`<button class="v0910-online-history-banner" type="button" onclick="showCloudHistory()"><span>☁</span><div><strong>Macie ${summary.rows.length} ${summary.rows.length===1?'wynik':'wyników'} online</strong><small>Ten ekran pokazuje wyłącznie starszą historię lokalną. Otwórz wspólne wyniki z obu telefonów.</small></div><i>Otwórz →</i></button>`);
  }
}

function updateVersion(){
  document.documentElement.dataset.version=VERSION;
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>node.textContent=`v${VERSION}`);
  const hero=document.querySelector('.desktop-welcome .eyebrow');
  if(hero)hero.textContent=hero.textContent.replace(/v\d+\.\d+\.\d+/,`v${VERSION}`);
}

root.showDailyStats=function(period){
  if(paired()&&onlineDailyEntries().length&&typeof root.showCloudHistory==='function')return root.showCloudHistory();
  return previousShowDailyStats?.(period);
};
root.openGameInfo=v0910OpenGame;
root.v0910OpenGame=v0910OpenGame;

root.render=function(){
  previousRender();
  enhanceHomeGames();
  enhanceOnlineLobby();
  enhancePackHub();
  enhanceSpicyHub();
  enhanceStats();
  updateVersion();
};

updateVersion();
})(globalThis);
