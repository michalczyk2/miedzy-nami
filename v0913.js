(function(root){
'use strict';

const VERSION='0.9.13';
const SAFE_SPICY_VIEW='v0913-spicy-hub';
const LEGACY_SPICY_VIEW='v082-spicy-hub';
const CONSENT_KEY='mn-spicy-consent-v1';
const previousRender=root.render;

function setVersion(){
  document.documentElement.dataset.version=VERSION;
  document.querySelectorAll('.version-badge,.version-chip,.v08-menu-header>span').forEach(node=>{node.textContent=`v${VERSION}`});
}

function safeCall(name,...args){
  const fn=root[name];
  if(typeof fn==='function')return fn(...args);
  root.toast?.('Nie udało się otworzyć tej gry. Odśwież aplikację i spróbuj ponownie.');
}

function renderSafeSpicyHub(){
  if(!root.app)return;
  root.app.innerHTML=`<section class="panel wide v082-spicy-hub v0913-spicy-hub">
    <div class="top-row">
      <button class="back-button" type="button" onclick="goHome()">← Pulpit</button>
      <span class="chip">18+ · dobrowolnie</span>
    </div>
    <div class="v082-spicy-hero">
      <span class="v082-hub-icon">♥<i>🔥</i></span>
      <div>
        <span class="eyebrow">PIKANTNE 18+</span>
        <h1>Wybierzcie grę</h1>
        <p>Każdą kartę można pominąć, zatrzymać albo odłożyć. Gracie wyłącznie za wspólną zgodą.</p>
      </div>
    </div>
    <div class="v082-safety-strip">
      <b>Najważniejsza zasada</b>
      <span>„Nie”, „pauza” i „pomiń” zawsze kończą kartę bez tłumaczenia.</span>
    </div>
    <div class="v0913-spicy-mode-note">
      <span><i class="online"></i><b>1–2 telefony</b> · odpowiedzi prywatne i wspólne odsłonięcie</span>
      <span><i></i><b>1 telefon</b> · rozmowa albo zadania wykonywane razem</span>
    </div>
    <div class="v082-game-grid v0913-spicy-grid">
      <button class="v082-game-tile" type="button" onclick="v0913OpenMatch()">
        <span>💞</span><div><strong>Dopasowanie 18+</strong><p>Każde odpowiada osobno na 8 pytań. Potem zobaczycie zgodność i odpowiedzi.</p><em class="v0913-mode-pill online">1–2 telefony</em><small>8 pytań · wybór trybu</small></div><i>›</i>
      </button>
      <button class="v082-game-tile" type="button" onclick="v0913OpenDesire()">
        <span>🔥</span><div><strong>Ochota na dziś</strong><p>Pięć szybkich wyborów o tym, na co oboje macie ochotę.</p><em class="v0913-mode-pill online">1–2 telefony</em><small>5 pytań · wybór trybu</small></div><i>›</i>
      </button>
      <button class="v082-game-tile" type="button" onclick='v082StartCards("talk")'>
        <span>💬</span><div><strong>Bez tabu</strong><p>Intymne pytania o potrzeby, fantazje, granice i to, co działa między wami.</p><em class="v0913-mode-pill">1 telefon</em><small>rozmowa bez punktów</small></div><i>›</i>
      </button>
      <button class="v082-game-tile" type="button" onclick='v082StartCards("action")'>
        <span>✦</span><div><strong>Tylko we dwoje</strong><p>Zadania wykonywane wyłącznie wtedy, gdy oboje świadomie mówicie „tak”.</p><em class="v0913-mode-pill">1 telefon</em><small>zadania za wspólną zgodą</small></div><i>›</i>
      </button>
    </div>
    <button class="v082-legacy-button" type="button" onclick="v082LegacyMix()">
      <span>🌶</span><span><strong>Klasyczny miks 112 kart</strong><small>Flirt, skale, wybory, rozmowy i wyzwania na jednym telefonie.</small></span><i>Otwórz →</i>
    </button>
    <p class="v0913-spicy-footnote">Aktywne rozgrywki na dwóch telefonach znajdziesz również w Centrum online.</p>
  </section>`;
  setVersion();
  window.scrollTo({top:0,behavior:'auto'});
}

function showSafeSpicyHub(){
  if(localStorage.getItem(CONSENT_KEY)!=='yes'){
    root.ui.modal='v081-spicy-consent';
    root.renderModal?.();
    return;
  }
  root.ui.modal=null;
  root.ui.view=SAFE_SPICY_VIEW;
  root.render();
}

function v0913OpenMatch(){
  if(typeof root.v091OpenMatch==='function')return root.v091OpenMatch();
  return safeCall('v082StartMatch','match');
}

function v0913OpenDesire(){
  if(typeof root.v092OpenDesire==='function')return root.v092OpenDesire();
  return safeCall('v082StartMatch','desire');
}

root.render=function(){
  if(root.ui?.view===SAFE_SPICY_VIEW||root.ui?.view===LEGACY_SPICY_VIEW){
    root.ui.view=SAFE_SPICY_VIEW;
    renderSafeSpicyHub();
    return;
  }
  previousRender();
  setVersion();
};

Object.assign(root,{
  showSpicyHub:showSafeSpicyHub,
  startSpicyPack:showSafeSpicyHub,
  v0913OpenMatch,
  v0913OpenDesire,
});

setVersion();
})(globalThis);
