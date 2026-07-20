(function(){
'use strict';
const V081_VERSION='0.8.1';
const SPICY_CATEGORY='pikantne';
const SPICY_CONSENT_KEY='mn-spicy-consent-v1';
const SPICY_CARDS=Array.isArray(globalThis.MN_V081_SPICY_CARDS)?globalThis.MN_V081_SPICY_CARDS:[];

if(!CATEGORIES.includes(SPICY_CATEGORY))CATEGORIES.push(SPICY_CATEGORY);
CATEGORY_LABELS[SPICY_CATEGORY]='Pikantne 18+';
for(const card of SPICY_CARDS){
  if(!LIBRARY_BY_ID.has(card.id)){LIBRARY.push(card);LIBRARY_BY_ID.set(card.id,card)}
}

function spicyEsc(value){return typeof escapeHtml==='function'?escapeHtml(value):String(value??'')}
function spicyConfirmed(){return localStorage.getItem(SPICY_CONSENT_KEY)==='yes'}
function startSpicyPack(){
  ui.modal=spicyConfirmed()?'v081-spicy-setup':'v081-spicy-consent';
  renderModal();
}
function v081ConfirmAdult(){localStorage.setItem(SPICY_CONSENT_KEY,'yes');ui.modal='v081-spicy-setup';renderModal()}
function v081ForgetConsent(){localStorage.removeItem(SPICY_CONSENT_KEY);ui.modal=null;render();toast('Pakiet 18+ został ponownie zablokowany.')}
function v081LaunchSpicy(level=2){
  const rounds=Number(document.querySelector('#v081-spicy-rounds')?.value||12);
  settings.intensity=Math.max(1,Math.min(3,Number(level)||2));
  saveSettings();
  ui.modal=null;
  startSession('mix',rounds,{modes:['wave','know','who','dilemma','scale','plan','words','story','tell','challenge'],categories:[SPICY_CATEGORY],intensity:settings.intensity,pack:'spicy18'});
}
function spicyModalConsent(){
  modalRoot.innerHTML=`<div class="modal-backdrop v081-spicy-backdrop" onclick="backdropClose(event)"><section class="modal v081-spicy-modal" role="dialog" aria-modal="true" aria-label="Pakiet Pikantne 18+"><button class="close" onclick="closeModal()">×</button><span class="v081-spicy-icon">🔥</span><span class="v081-kicker">OPCJONALNY PAKIET</span><h2>Pikantne 18+</h2><p>Flirt, bliskość, fantazje i lekkie wyzwania dla pełnoletniej pary.</p><div class="v081-consent-rules"><div><b>18+</b><span>Obie osoby muszą być pełnoletnie.</span></div><div><b>✓</b><span>Każdy pomysł wymaga dobrowolnej zgody.</span></div><div><b>→</b><span>Każdą kartę można pominąć bez tłumaczenia.</span></div><div><b>■</b><span>„Stop” albo „pauza” kończy zadanie natychmiast.</span></div></div><button class="button primary full v081-spicy-primary" onclick="v081ConfirmAdult()">Oboje mamy 18+ i chcemy grać</button><button class="button tertiary full" onclick="closeModal()">Nie teraz</button></section></div>`;
}
function spicyModalSetup(){
  const counts={1:SPICY_CARDS.filter(c=>c.level<=1).length,2:SPICY_CARDS.filter(c=>c.level<=2).length,3:SPICY_CARDS.length};
  modalRoot.innerHTML=`<div class="modal-backdrop v081-spicy-backdrop" onclick="backdropClose(event)"><section class="modal v081-spicy-modal setup" role="dialog" aria-modal="true" aria-label="Ustawienia pakietu Pikantne 18+"><button class="close" onclick="closeModal()">×</button><span class="v081-spicy-icon">🔥</span><span class="v081-kicker">PIKANTNE 18+</span><h2>Wybierzcie temperaturę</h2><p class="muted">Poziom można zmienić przy każdej sesji. Odważniejsze karty nadal koncentrują się na zgodzie, rozmowie i komforcie.</p><label class="field"><span>Długość sesji</span><select class="select" id="v081-spicy-rounds"><option value="8">8 kart · około 10 min</option><option value="12" selected>12 kart · około 20 min</option><option value="18">18 kart · dłuższy wieczór</option></select></label><div class="v081-level-grid"><button onclick="v081LaunchSpicy(1)"><span>🌶</span><strong>Flirt</strong><small>Pocałunki, komplementy i romantyczne napięcie.</small><i>${counts[1]} kart</i></button><button class="featured" onclick="v081LaunchSpicy(2)"><span>🔥</span><strong>Pikantnie</strong><small>Dotyk, atmosfera, potrzeby i odważniejsze pytania.</small><i>${counts[2]} kart</i></button><button onclick="v081LaunchSpicy(3)"><span>🔥🔥</span><strong>Odważnie</strong><small>Fantazje, granice i szczera rozmowa bez presji.</small><i>${counts[3]} kart</i></button></div><button class="v081-reset-consent" onclick="v081ForgetConsent()">Zablokuj ponownie pakiet 18+</button></section></div>`;
}
function injectSpicyHome(){
  if(typeof ui==='undefined'||ui.view!=='home'||document.querySelector('.v081-spicy-launch'))return;
  const grid=document.querySelector('.desktop-app-grid');
  if(!grid)return;
  grid.insertAdjacentHTML('afterend',`<button class="v081-spicy-launch" onclick="startSpicyPack()"><span class="v081-spicy-badge">18+</span><span class="v081-spicy-flame">🔥</span><span><small>OPCJONALNY PAKIET DLA DOROSŁYCH</small><strong>Pikantne</strong><p>112 kart: flirt, bliskość, fantazje, granice i wyzwania.</p></span><i>Otwórz →</i></button>`);
}
function injectSpicyPackHub(){
  if(typeof ui==='undefined'||ui.view!=='pack-hub'||document.querySelector('.v081-spicy-pack'))return;
  const grid=document.querySelector('.pack-hub-grid');if(!grid)return;
  grid.insertAdjacentHTML('beforeend',`<button class="v081-spicy-pack" onclick="startSpicyPack()" data-index="18+"><span>🔥</span><div><strong>Pikantne 18+</strong><p>Flirt, bliskość i odważniejsze rozmowy z trzema poziomami.</p></div><i>Otwórz →</i></button>`);
  const chip=document.querySelector('.pack-hub .chip');if(chip)chip.textContent='11 gotowych zestawów';
}
function injectSpicyMenu(){
  if(ui.modal!=='main-menu'||document.querySelector('.v081-spicy-menu-item'))return;
  const firstSection=modalRoot.querySelector('.v08-menu-section');if(!firstSection)return;
  firstSection.insertAdjacentHTML('afterbegin',`<button class="v08-menu-item v081-spicy-menu-item" onclick="startSpicyPack()"><span class="v08-menu-icon">🔥</span><span class="v08-menu-copy"><strong>Pikantne 18+</strong><small>Opcjonalny pakiet dla pełnoletniej pary</small></span><span class="v08-menu-arrow">›</span></button>`);
}
function injectSpicySafety(){
  if(typeof ui==='undefined'||ui.view!=='play'||!currentSession||currentCard()?.category!==SPICY_CATEGORY)return;
  const panel=document.querySelector('#app .panel');if(!panel||panel.querySelector('.v081-safety-note'))return;
  const score=panel.querySelector('.score-strip');
  const note=document.createElement('div');note.className='v081-safety-note';note.innerHTML='<b>18+</b><span>Każdą kartę możecie pominąć bez tłumaczenia. Zgoda może zostać wycofana w dowolnym momencie.</span>';
  score?.insertAdjacentElement('afterend',note);
}
function updateV081Version(){
  document.documentElement.dataset.version=V081_VERSION;
  document.title=document.title.replace(/0\.8\.0/g,V081_VERSION);
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>node.textContent=`v${V081_VERSION}`);
  const hero=document.querySelector('.desktop-welcome .eyebrow');if(hero)hero.textContent=hero.textContent.replace(/v0\.8\.0|v0\.6\.0/g,`v${V081_VERSION}`);
}

const previousRender=window.render;
window.render=function(){previousRender();injectSpicyHome();injectSpicyPackHub();injectSpicySafety();updateV081Version()};
const previousRenderModal=window.renderModal;
window.renderModal=function(){
  if(ui.modal==='v081-spicy-consent'){spicyModalConsent();return}
  if(ui.modal==='v081-spicy-setup'){spicyModalSetup();return}
  previousRenderModal();injectSpicyMenu();updateV081Version();
};
Object.assign(window,{startSpicyPack,v081ConfirmAdult,v081ForgetConsent,v081LaunchSpicy});
render();
})();
