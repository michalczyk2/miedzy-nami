(function(){
'use strict';

const V071_VERSION='0.7.1';
const runtime=window.MN_CLOUD_RUNTIME||null;
const creator='Michał Czerwiński';

function esc(value){
  if(typeof window.escapeHtml==='function')return window.escapeHtml(String(value??''));
  return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
function currentMember(){return runtime?.members?.find(member=>member.user_id===runtime?.user?.id)||null}
function otherMember(){return runtime?.members?.find(member=>member.user_id!==runtime?.user?.id)||null}
function displayName(){return currentMember()?.display_name||runtime?.profile?.display_name||runtime?.user?.email?.split('@')[0]||'Konto'}
function initials(name=displayName()){
  const parts=String(name).trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return'♡';
  return(parts.length===1?parts[0].slice(0,2):parts[0][0]+parts.at(-1)[0]).toUpperCase();
}
function syncLabel(){
  if(!runtime?.user)return'Tryb lokalny';
  if(runtime.loading)return'Synchronizowanie…';
  if(runtime.error)return'Wymaga uwagi';
  if(!runtime.couple)return'Konto online';
  if(runtime.members?.length<2)return'Czeka na partnera';
  return'Synchronizacja aktywna';
}
function formatSyncTime(){
  if(!runtime?.lastSyncAt)return'jeszcze nie wykonano';
  const seconds=Math.max(0,Math.round((Date.now()-runtime.lastSyncAt)/1000));
  if(seconds<10)return'teraz';
  if(seconds<60)return`${seconds} s temu`;
  const minutes=Math.round(seconds/60);
  if(minutes<60)return`${minutes} min temu`;
  return new Date(runtime.lastSyncAt).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
}
function cleanAuthUrl(){
  const clean=`${location.pathname}${location.hash&&location.hash.startsWith('#/')?location.hash:''}`;
  history.replaceState(history.state||{},document.title,clean||'/');
}
function authErrorMessage(code,description){
  const messages={
    otp_expired:'Link logowania wygasł albo został już użyty. Wyślij nowy link i otwórz najnowszą wiadomość.',
    access_denied:'Nie udało się potwierdzić logowania. Wyślij nowy link i spróbuj ponownie.',
  };
  return messages[code]||description||'Nie udało się zakończyć logowania.';
}
function consumeAuthReturn(){
  if(!runtime)return;
  const search=new URLSearchParams(location.search);
  const hash=new URLSearchParams((location.hash||'').replace(/^#/,''));
  const code=search.get('error_code')||hash.get('error_code');
  const description=search.get('error_description')||hash.get('error_description');
  if(code){
    runtime.error=authErrorMessage(code,description);
    if(typeof ui!=='undefined')ui.view='cloud';
    cleanAuthUrl();
    queueMicrotask(()=>window.render?.());
    return;
  }
  if(search.has('code')||String(location.hash||'').includes('access_token=')){
    let checks=0;
    const timer=setInterval(()=>{
      checks++;
      if(runtime.user){
        clearInterval(timer);cleanAuthUrl();window.toast?.('Zalogowano pomyślnie.');window.render?.();
      }else if(checks>40){clearInterval(timer)}
    },150);
  }
}
function ensureAccountButton(){
  const actions=document.querySelector('.header-actions');
  if(!actions)return null;
  let button=document.querySelector('#account-button');
  if(!button){
    button=document.createElement('button');
    button.id='account-button';button.type='button';button.className='account-button';
    button.setAttribute('aria-label','Otwórz konto i synchronizację');
    button.addEventListener('click',()=>openAccountMenu());
    const menu=document.querySelector('#menu-button');
    actions.insertBefore(button,menu||null);
  }
  return button;
}
function updateHeaderAccount(){
  const button=ensureAccountButton();if(!button)return;
  const online=Boolean(runtime?.user);
  const paired=Boolean(runtime?.couple&&runtime?.members?.length===2);
  button.classList.toggle('online',online);
  button.classList.toggle('paired',paired);
  button.innerHTML=`<span class="account-avatar">${esc(online?initials():'♡')}</span><span class="account-copy"><strong>${esc(online?displayName():'Konto')}</strong><small>${esc(syncLabel())}</small></span><span class="account-chevron">⌄</span>`;
  button.title=online?`${displayName()} · ${runtime.user?.email||''}`:'Zaloguj się i połącz drugi telefon';
}
function accountSummaryMarkup(){
  if(!runtime?.configured)return`<div class="account-modal-hero"><span class="account-avatar large">☁</span><div><small>CHMURA NIEPODŁĄCZONA</small><h2>Tryb jednego telefonu</h2><p>Uzupełnij konfigurację Supabase, aby połączyć dwa telefony.</p></div></div>`;
  if(!runtime.user)return`<div class="account-modal-hero"><span class="account-avatar large">♡</span><div><small>TRYB LOKALNY</small><h2>Nie jesteś zalogowany</h2><p>Gry działają lokalnie. Konto umożliwia wspólne wyniki na dwóch telefonach.</p></div></div>`;
  const partner=otherMember();
  return`<div class="account-modal-hero"><span class="account-avatar large">${esc(initials())}</span><div><small>ZALOGOWANO</small><h2>${esc(displayName())}</h2><p>${esc(runtime.user.email||'Konto Supabase')}</p></div><span class="online-dot" title="Online"></span></div>
  <div class="account-status-grid">
    <div><small>PARA</small><strong>${partner?`${esc(displayName())} + ${esc(partner.display_name)}`:runtime.couple?'Czeka na drugą osobę':'Jeszcze niepołączona'}</strong></div>
    <div><small>SYNCHRONIZACJA</small><strong>${esc(syncLabel())}</strong></div>
    <div><small>OSTATNI ZAPIS</small><strong>${esc(formatSyncTime())}</strong></div>
    <div><small>DZISIAJ</small><strong>${runtime.daily?.result?`${runtime.daily.result.score}%`:runtime.daily?.own?'Odpowiedziano':'Do zrobienia'}</strong></div>
  </div>`;
}
function renderAccountMenu(){
  const logged=Boolean(runtime?.user);
  const paired=Boolean(runtime?.couple);
  const syncButton=logged&&paired?`<button class="menu-action" onclick="syncLocalSessions().then(()=>{toast('Synchronizacja zakończona.');closeModal();render()})"><span>↻</span><div><strong>Synchronizuj teraz</strong><small>Wyślij lokalną historię do wspólnego konta</small></div></button>`:'';
  const signOut=logged?`<button class="menu-action danger-row" onclick="cloudSignOut();closeModal()"><span>↪</span><div><strong>Wyloguj to urządzenie</strong><small>Dane online pozostaną na koncie pary</small></div></button>`:'';
  modalRoot.innerHTML=`<div class="modal-backdrop" onclick="backdropClose(event)"><section class="modal account-modal" role="dialog" aria-modal="true" aria-label="Konto"><button class="close" onclick="closeModal()">×</button>${accountSummaryMarkup()}<div class="account-menu-actions"><button class="menu-action primary-row" onclick="showCloudHub()"><span>${logged?'⚙':'→'}</span><div><strong>${logged?'Konto pary i dwa telefony':'Zaloguj się'}</strong><small>${logged?'Zarządzaj parą, kodem i wspólnymi wynikami':'Uruchom bezpieczną synchronizację'}</small></div></button>${syncButton}${signOut}</div><p class="account-privacy">🔒 Odpowiedzi partnera pozostają ukryte do ukończenia dziennego zestawu przez obie osoby.</p></section></div>`;
}
function menuItem(icon,title,description,action,extra=''){
  return`<button class="menu-item menu-item-v071 ${extra}" onclick="${action}"><span class="menu-item-icon">${icon}</span><span class="menu-item-copy"><strong>${title}</strong><small>${description}</small></span><span class="menu-item-arrow">›</span></button>`;
}
function groupedMenuMarkup(){
  const accountTitle=runtime?.user?displayName():'Konto i synchronizacja';
  const accountSubtitle=runtime?.user?`${syncLabel()} · ${runtime.user.email||''}`:'Zaloguj się lub korzystaj lokalnie';
  return`<button class="close" onclick="closeModal()">×</button><div class="menu-heading"><div><small>MIĘDZY NAMI</small><h2>Menu</h2></div><span class="version-chip">v${V071_VERSION}</span></div>
  <button class="menu-account-card ${runtime?.user?'online':''}" onclick="openAccountMenu()"><span class="account-avatar">${esc(runtime?.user?initials():'♡')}</span><span><strong>${esc(accountTitle)}</strong><small>${esc(accountSubtitle)}</small></span><i>›</i></button>
  <div class="menu-sections">
    <section class="menu-section"><h3>Dla was</h3>${menuItem('↗','Codzienne Dopasowanie','5 pytań, osobne odpowiedzi i wspólny wynik','openDailyMatch()')}${menuItem('▥','Historia dopasowania','Wyniki z 7, 14 i 30 dni','showDailyStats()')}${menuItem('◫','Statystyki gier','Historia sesji i zgodność','showStats()')}</section>
    <section class="menu-section"><h3>Gry i zawartość</h3>${menuItem('▦','Pakiety tematyczne','Gotowe zestawy na różne okazje','showPackHub()')}${menuItem('♡','Ulubione','Zapisane pytania i wyzwania','showFavorites()')}${menuItem('+','Własne karty','Dodaj prywatne pytania','showCustom()')}${menuItem('✦','Pomysł na randkę','Losowy plan na wspólny czas','openDateGenerator()')}</section>
    <section class="menu-section"><h3>Profil i aplikacja</h3>${menuItem('🏆','Osiągnięcia','Kamienie milowe i seria dni','showAchievements()')}${menuItem('⚙','Ustawienia','Imiona, dostępność i dane lokalne','showSettings()')}${ui.installPrompt?menuItem('⇩','Zainstaluj aplikację','Dodaj ikonę do ekranu głównego','installApp()'):menuItem('⌂','Instalacja aplikacji','Instrukcja dla iPhone i Androida','showInstallGuide()')}${menuItem('i','O aplikacji',`Stworzona przez ${creator}`,'showAboutApp()')}</section>
  </div>`;
}
function enhanceCloudScreen(){
  if(typeof ui==='undefined'||ui.view!=='cloud'||!runtime?.user)return;
  const panel=document.querySelector('.cloud-panel');if(!panel||panel.querySelector('.cloud-user-strip'))return;
  const top=panel.querySelector('.top-row');if(!top)return;
  const strip=document.createElement('div');strip.className='cloud-user-strip';
  strip.innerHTML=`<span class="account-avatar">${esc(initials())}</span><span><small>ZALOGOWANO JAKO</small><strong>${esc(displayName())}</strong><em>${esc(runtime.user.email||'')}</em></span><i><b></b>${esc(syncLabel())}</i>`;
  top.insertAdjacentElement('afterend',strip);
  panel.querySelector('.eyebrow')?.remove();
}
function updateStaticVersion(){
  document.documentElement.dataset.version=V071_VERSION;
  document.querySelectorAll('.version-badge').forEach(node=>node.textContent=`v${V071_VERSION}`);
  document.querySelectorAll('.version-chip').forEach(node=>node.textContent=`v${V071_VERSION}`);
  const footer=document.querySelector('.site-footer');
  if(footer)footer.innerHTML=`Między Nami · stworzone przez <strong>${creator}</strong>`;
}
function openAccountMenu(){ui.modal='account-menu';renderModal()}

const previousRender=window.render;
window.render=function(){
  previousRender();
  updateHeaderAccount();enhanceCloudScreen();updateStaticVersion();
};
const previousRenderModal=window.renderModal;
window.renderModal=function(){
  if(ui.modal==='account-menu'){renderAccountMenu();return}
  previousRenderModal();
  if(ui.modal==='main-menu'){
    const modal=document.querySelector('.modal');if(modal)modal.innerHTML=groupedMenuMarkup();
  }
};

Object.assign(window,{openAccountMenu});
ensureAccountButton();updateHeaderAccount();consumeAuthReturn();updateStaticVersion();
})();
