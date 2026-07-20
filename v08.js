(function(){
'use strict';

const V08_VERSION='0.8.0';
const ONBOARDING_KEY='mn-v08-onboarding';
const MODE_KEY='mn-v08-use-mode';
const LAST_ACCOUNT_KEY='mn-v08-last-account';
const runtime=window.MN_CLOUD_RUNTIME||null;
let onboardingStep='welcome';
let onboardingMode=localStorage.getItem(MODE_KEY)||'';

function esc(value){
  if(typeof window.escapeHtml==='function')return window.escapeHtml(String(value??''));
  return String(value??'').replace(/[&<>'"]/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}
function ownMember(){return runtime?.members?.find(member=>member.user_id===runtime?.user?.id)||null}
function partnerMember(){return runtime?.members?.find(member=>member.user_id!==runtime?.user?.id)||null}
function accountName(){return ownMember()?.display_name||runtime?.profile?.display_name||runtime?.user?.email?.split('@')[0]||'Konto'}
function accountInitials(name=accountName()){
  const parts=String(name).trim().split(/\s+/).filter(Boolean);
  if(!parts.length)return'♡';
  return(parts.length===1?parts[0].slice(0,2):parts[0][0]+parts.at(-1)[0]).toUpperCase();
}
function isPaired(){return Boolean(runtime?.couple&&runtime?.members?.length===2)}
function setupState(){return localStorage.getItem(ONBOARDING_KEY)||''}
function setSetupState(value){localStorage.setItem(ONBOARDING_KEY,value)}
function useMode(){return localStorage.getItem(MODE_KEY)||onboardingMode||''}
function setUseMode(value){onboardingMode=value;localStorage.setItem(MODE_KEY,value);settings.v08UseMode=value;saveSettings?.()}
function syncLabel(){
  if(!runtime?.user)return'Tryb lokalny';
  if(runtime.loading)return'Synchronizowanie…';
  if(runtime.error)return'Wymaga uwagi';
  if(!runtime.couple)return'Konto zalogowane';
  if(runtime.members?.length<2)return'Czeka na partnera';
  return'Synchronizacja aktywna';
}
function formatSyncTime(){
  if(!runtime?.lastSyncAt)return'jeszcze nie wykonano';
  const seconds=Math.max(0,Math.round((Date.now()-runtime.lastSyncAt)/1000));
  if(seconds<15)return'teraz';
  if(seconds<60)return`${seconds} s temu`;
  const minutes=Math.round(seconds/60);
  if(minutes<60)return`${minutes} min temu`;
  return new Date(runtime.lastSyncAt).toLocaleTimeString('pl-PL',{hour:'2-digit',minute:'2-digit'});
}
function markSetupCompleteWhenReady(){
  if(isPaired()){
    setSetupState('done-online');
    setUseMode('online');
  }
  if(runtime?.user?.email)localStorage.setItem(LAST_ACCOUNT_KEY,runtime.user.email);
}
function isFirstRunPending(){
  const state=setupState();
  if(state==='done-local'||state==='done-online'||state==='started-online')return false;
  if(isPaired()){markSetupCompleteWhenReady();return false}
  return true;
}

function renderWelcome(){
  return`<div class="v08-welcome-mark">♡</div><span class="v08-kicker">MIĘDZY NAMI · v${V08_VERSION}</span><h2>Wasza przestrzeń do grania i rozmowy</h2><p>Grajcie razem na jednym telefonie albo odpowiadajcie osobno na dwóch urządzeniach. Aplikacja przeprowadzi was przez cały start.</p><div class="v08-benefits"><span>♡ 11 gier i aktywności</span><span>↗ 5 pytań dopasowania dziennie</span><span>☁ wspólna historia na dwóch telefonach</span></div><button class="button primary full" onclick="v08OnboardingNext()">Zaczynamy</button><button class="v08-text-button" onclick="v08FinishLocalQuick()">Pomiń i przejdź do pulpitu</button>`;
}
function renderModeChoice(){
  return`<button class="v08-back" onclick="v08OnboardingBack()">← Wróć</button><span class="v08-step">KROK 1 Z 2</span><h2>Jak chcecie korzystać?</h2><p>Możecie zmienić ten wybór później w ustawieniach.</p><div class="v08-mode-grid"><button onclick="v08ChooseMode('local')"><span class="v08-mode-icon">▣</span><strong>Razem na jednym telefonie</strong><small>Bez konta. Przekazujecie sobie telefon i gracie od razu.</small><i>Najprostszy start</i></button><button class="recommended" onclick="v08ChooseMode('online')"><span class="v08-mode-icon">⇄</span><strong>Na dwóch telefonach</strong><small>Każde odpowiada osobno. Wyniki i historia synchronizują się online.</small><i>Polecane do Dopasowania</i></button></div>`;
}
function renderLocalSetup(){
  return`<button class="v08-back" onclick="v08OnboardingBack()">← Wróć</button><span class="v08-step">KROK 2 Z 2</span><h2>Jak mamy was nazywać?</h2><p>Imiona pojawią się w grach, podsumowaniach i statystykach lokalnych.</p><div class="form-grid v08-name-grid"><label class="field"><span>Osoba 1</span><input class="input" id="v08-name-a" value="${esc(settings.names?.[0]||'Michał')}" maxlength="24"></label><label class="field"><span>Osoba 2</span><input class="input" id="v08-name-b" value="${esc(settings.names?.[1]||'Karolina')}" maxlength="24"></label></div><div class="v08-note">🔒 Dane pozostają wyłącznie na tym urządzeniu. Konto nie jest wymagane.</div><button class="button primary full" onclick="v08FinishLocal()">Przejdź do pulpitu</button>`;
}
function renderOnlineSetup(){
  const logged=Boolean(runtime?.user);
  const paired=isPaired();
  const partner=partnerMember();
  if(paired)return`<div class="v08-success-mark">✓</div><span class="v08-step">GOTOWE</span><h2>${esc(accountName())} + ${esc(partner?.display_name||'partner')}</h2><p>Oba telefony są połączone. Logowanie zostało zapamiętane na tym urządzeniu, a wspólne wyniki będą synchronizowane automatycznie.</p><div class="v08-success-list"><span>✓ konto zapamiętane</span><span>✓ para połączona</span><span>✓ synchronizacja aktywna</span></div><button class="button primary full" onclick="v08FinishOnline()">Przejdź do pulpitu</button>`;
  return`<button class="v08-back" onclick="v08OnboardingBack()">← Wróć</button><span class="v08-step">KROK 2 Z 2</span><h2>${logged?'Połączcie telefony':'Zaloguj się na tym telefonie'}</h2><p>${logged?'Utwórz nową parę albo wpisz 6-znakowy kod otrzymany od partnera.':'Wyślemy krótki kod na e-mail. Wpiszesz go bezpośrednio w aplikacji, dzięki czemu sesja zostanie zapamiętana w skrócie PWA.'}</p><div class="v08-online-flow"><div class="${logged?'done':'active'}"><b>${logged?'✓':'1'}</b><span><strong>Własne konto</strong><small>${logged?esc(runtime.user.email||'Zalogowano'):'Jednorazowy kod e-mail'}</small></span></div><div class="${logged?'active':''}"><b>2</b><span><strong>Połączenie pary</strong><small>Tworzysz albo wpisujesz kod</small></span></div><div><b>3</b><span><strong>Gotowe</strong><small>Wspólne wyniki na obu telefonach</small></span></div></div><div class="v08-note">🔐 Po jednorazowym zalogowaniu konto pozostanie aktywne, dopóki samodzielnie się nie wylogujesz lub nie usuniesz danych aplikacji.</div><button class="button primary full" onclick="v08ContinueOnline()">${logged?'Połącz telefony':'Przejdź do logowania'}</button><button class="v08-text-button" onclick="v08ChooseMode('local')">Na razie korzystaj lokalnie</button>`;
}
function renderOnboardingModal(){
  let body=renderWelcome();
  if(onboardingStep==='mode')body=renderModeChoice();
  else if(onboardingStep==='local')body=renderLocalSetup();
  else if(onboardingStep==='online')body=renderOnlineSetup();
  modalRoot.innerHTML=`<div class="modal-backdrop v08-onboarding-backdrop"><section class="modal v08-onboarding" role="dialog" aria-modal="true" aria-label="Pierwsze uruchomienie"><div class="v08-progress"><i class="${onboardingStep!=='welcome'?'active':''}"></i><i class="${['local','online'].includes(onboardingStep)?'active':''}"></i></div>${body}</section></div>`;
}
function v08OnboardingNext(){onboardingStep='mode';renderModal()}
function v08OnboardingBack(){onboardingStep=['local','online'].includes(onboardingStep)?'mode':'welcome';renderModal()}
function v08ChooseMode(mode){setUseMode(mode);onboardingStep=mode;renderModal()}
function v08FinishLocal(){
  settings.names=[document.querySelector('#v08-name-a')?.value.trim()||'Osoba 1',document.querySelector('#v08-name-b')?.value.trim()||'Osoba 2'];
  settings.onboardingDone=true;setUseMode('local');setSetupState('done-local');saveSettings();ui.modal=null;render();toast?.('Tryb jednego telefonu jest gotowy.');
}
function v08FinishLocalQuick(){settings.onboardingDone=true;setUseMode('local');setSetupState('done-local');saveSettings();ui.modal=null;render()}
function v08ContinueOnline(){setUseMode('online');setSetupState('started-online');ui.modal=null;showCloudHub()}
function v08FinishOnline(){setUseMode('online');setSetupState('done-online');ui.modal=null;goHome();toast?.('Wszystko gotowe. Telefony są połączone.')}
function openV08Onboarding(){onboardingStep='welcome';ui.modal='v08-onboarding';renderModal()}

function dailyProgressText(){
  if(!isPaired())return'';
  if(runtime.daily?.result)return`Dzisiejszy wynik: ${runtime.daily.result.score}%`;
  if(runtime.daily?.own&&runtime.daily?.partner)return'Oboje odpowiedzieliście — obliczamy wynik';
  if(runtime.daily?.own)return`Twoje odpowiedzi zapisane. Czekamy na ${esc(partnerMember()?.display_name||'partnera')}`;
  if(runtime.daily?.partner)return`${esc(partnerMember()?.display_name||'Partner')} już odpowiedział(a). Teraz twoja kolej`;
  return'5 nowych pytań czeka na was oboje';
}
function setupStatusMarkup(){
  const mode=useMode();
  if(runtime?.user&&isPaired()){
    const partner=partnerMember();
    const ready=runtime.daily?.result;
    return`<section class="v08-home-status paired"><div class="v08-status-avatar">${esc(accountInitials())}<i></i></div><div class="v08-status-copy"><small>WASZE KONTO</small><strong>${esc(accountName())} + ${esc(partner?.display_name||'partner')}</strong><span>${esc(dailyProgressText())}</span></div><div class="v08-status-actions"><button onclick="openCloudDaily()">${ready?'Zobacz wynik':'Odpowiedz'}</button><button class="secondary" onclick="openAccountMenu()">Konto</button></div></section>`;
  }
  if(runtime?.user&&runtime?.couple){
    return`<section class="v08-home-status waiting"><div class="v08-status-avatar">${esc(accountInitials())}</div><div class="v08-status-copy"><small>KROK 3 Z 3</small><strong>Czekamy na drugą osobę</strong><span>Niech partner zaloguje się i wpisze kod <b>${esc(runtime.couple.invite_code||'')}</b>.</span></div><div class="v08-status-actions"><button onclick="showCloudHub()">Pokaż kod</button></div></section>`;
  }
  if(runtime?.user){
    return`<section class="v08-home-status setup"><div class="v08-status-avatar">${esc(accountInitials())}</div><div class="v08-status-copy"><small>KROK 2 Z 3</small><strong>Konto jest zalogowane</strong><span>Połącz teraz telefon partnera, aby uruchomić wspólne wyniki.</span></div><div class="v08-status-actions"><button onclick="showCloudHub()">Połącz telefony</button></div></section>`;
  }
  if(mode==='online'||setupState()==='started-online'){
    return`<section class="v08-home-status setup"><div class="v08-status-avatar">1</div><div class="v08-status-copy"><small>DOKOŃCZ KONFIGURACJĘ</small><strong>Zaloguj się na tym telefonie</strong><span>Użyjesz jednorazowego kodu. Potem aplikacja zapamięta konto.</span></div><div class="v08-status-actions"><button onclick="showCloudHub()">Zaloguj się</button><button class="secondary" onclick="openV08Help()">Jak to działa?</button></div></section>`;
  }
  return`<section class="v08-home-status local"><div class="v08-status-avatar">▣</div><div class="v08-status-copy"><small>TRYB JEDNEGO TELEFONU</small><strong>Gracie lokalnie jako ${esc(settings.names?.[0]||'Osoba 1')} i ${esc(settings.names?.[1]||'Osoba 2')}</strong><span>Możecie zacząć dowolną grę albo w każdej chwili połączyć dwa telefony.</span></div><div class="v08-status-actions"><button onclick="startQuick('quick')">Szybka gra</button><button class="secondary" onclick="v08StartOnlineSetup()">Dwa telefony</button></div></section>`;
}
function enhanceHome(){
  if(typeof ui==='undefined'||ui.view!=='home')return;
  document.querySelector('.cloud-home-status')?.remove();
  document.querySelector('.v08-home-status')?.remove();
  const welcome=document.querySelector('.desktop-welcome');
  const daily=document.querySelector('.daily-launch-card');
  const target=welcome||daily;
  if(target)target.insertAdjacentHTML('afterend',setupStatusMarkup());
  const privacy=document.querySelector('.desktop-privacy');
  if(privacy){
    privacy.innerHTML=isPaired()?'☁ Konto jest zapamiętane na tym urządzeniu. Wspólna historia synchronizuje się automatycznie.':'🔒 W trybie lokalnym wszystkie dane pozostają na tym urządzeniu.';
  }
}

function menuItem(icon,title,description,action,extra=''){
  return`<button class="v08-menu-item ${extra}" onclick="${action}"><span class="v08-menu-icon">${icon}</span><span class="v08-menu-copy"><strong>${title}</strong><small>${description}</small></span><span class="v08-menu-arrow">›</span></button>`;
}
function renderMainMenuV08(){
  const logged=Boolean(runtime?.user);const paired=isPaired();
  const accountTitle=logged?accountName():'Konto i synchronizacja';
  const accountDescription=logged?`${syncLabel()}${runtime.user?.email?' · '+runtime.user.email:''}`:'Tryb lokalny · zaloguj się, aby połączyć dwa telefony';
  const dailyAction=paired?'openCloudDaily()':'openDailyMatch()';
  const historyAction=paired?'showCloudHistory()':'showDailyStats()';
  const signOut=logged?`<button class="v08-signout" onclick="cloudSignOut();closeModal()">Wyloguj to urządzenie</button>`:'';
  modalRoot.innerHTML=`<div class="modal-backdrop v08-menu-backdrop" onclick="backdropClose(event)"><section class="modal v08-menu" role="dialog" aria-modal="true" aria-label="Menu"><header class="v08-menu-header"><div><small>MIĘDZY NAMI</small><h2>Więcej</h2></div><span>v${V08_VERSION}</span><button class="close" onclick="closeModal()">×</button></header><div class="v08-menu-scroll"><button class="v08-account-card ${logged?'online':''}" onclick="openAccountMenu()"><span class="account-avatar">${esc(logged?accountInitials():'♡')}</span><span><strong>${esc(accountTitle)}</strong><small>${esc(accountDescription)}</small></span><i>›</i></button><div class="v08-menu-quick"><button onclick="${dailyAction}"><b>↗</b><span><strong>Dzisiaj</strong><small>${paired?esc(dailyProgressText()):'5 pytań dopasowania'}</small></span></button><button onclick="${historyAction}"><b>▥</b><span><strong>Historia</strong><small>Wyniki i postępy</small></span></button></div><section class="v08-menu-section"><h3>Wasze rzeczy</h3>${menuItem('♡','Ulubione','Zapisane pytania i wyzwania','showFavorites()')}${menuItem('+','Własne karty','Dodaj własne pytania','showCustom()')}${menuItem('🏆','Osiągnięcia','Seria dni i kamienie milowe','showAchievements()')}</section><section class="v08-menu-section"><h3>Pomoc i aplikacja</h3>${menuItem('?','Jak zacząć','Krótka instrukcja jednego i dwóch telefonów','openV08Help()','highlight')}${menuItem('⚙','Ustawienia','Imiona, dostępność i dane lokalne','showSettings()')}${ui.installPrompt?menuItem('⇩','Zainstaluj aplikację','Dodaj ikonę do ekranu głównego','installApp()'):menuItem('⌂','Instalacja aplikacji','Instrukcja dla iPhone i Androida','showInstallGuide()')}${menuItem('i','O aplikacji','Autor, wersja i informacje','showAboutApp()')}</section>${signOut}<p class="v08-menu-footer">Aplikacja stworzona przez <strong>Michała Czerwińskiego</strong></p></div></section></div>`;
}

function renderAccountMenuV08(){
  const logged=Boolean(runtime?.user);const paired=isPaired();const partner=partnerMember();
  let hero='';
  if(!logged){
    const last=localStorage.getItem(LAST_ACCOUNT_KEY)||'';
    hero=`<div class="v08-account-hero"><span class="account-avatar large">♡</span><div><small>TRYB LOKALNY</small><h2>Nie jesteś zalogowany</h2><p>${last?`Ostatnie konto: ${esc(last)}`:'Konto jest potrzebne tylko do korzystania na dwóch telefonach.'}</p></div></div><div class="v08-persist-note">🔐 Zalogujesz się raz kodem e-mail. Sesja zostanie zapamiętana w tej aplikacji.</div>`;
  }else{
    hero=`<div class="v08-account-hero"><span class="account-avatar large">${esc(accountInitials())}</span><div><small>ZALOGOWANO</small><h2>${esc(accountName())}</h2><p>${esc(runtime.user.email||'Konto')}</p></div><i class="v08-online-dot"></i></div><div class="v08-session-saved"><span>✓</span><div><strong>Logowanie zapamiętane</strong><small>Po ponownym otwarciu aplikacji konto zostanie przywrócone automatycznie.</small></div></div><div class="v08-account-grid"><div><small>PARA</small><strong>${paired?`${esc(accountName())} + ${esc(partner?.display_name||'partner')}`:runtime.couple?'Czeka na partnera':'Niepołączona'}</strong></div><div><small>STATUS</small><strong>${esc(syncLabel())}</strong></div><div><small>OSTATNIA SYNCHRONIZACJA</small><strong>${esc(formatSyncTime())}</strong></div><div><small>DZISIAJ</small><strong>${runtime.daily?.result?`${runtime.daily.result.score}%`:runtime.daily?.own?'Odpowiedziano':'Do zrobienia'}</strong></div></div>`;
  }
  const actions=logged?`<button class="menu-action primary-row" onclick="showCloudHub()"><span>⇄</span><div><strong>${runtime.couple?'Konto pary':'Połącz telefony'}</strong><small>Zarządzaj kodem i wspólnymi wynikami</small></div></button>${paired?'<button class="menu-action" onclick="syncLocalSessions().then(()=>{toast(\'Synchronizacja zakończona.\');closeModal();render()})"><span>↻</span><div><strong>Synchronizuj teraz</strong><small>Odśwież wspólną historię</small></div></button>':''}<button class="menu-action danger-row" onclick="cloudSignOut();closeModal()"><span>↪</span><div><strong>Wyloguj to urządzenie</strong><small>Pozostałe urządzenie pozostanie zalogowane</small></div></button>`:`<button class="menu-action primary-row" onclick="v08StartOnlineSetup()"><span>→</span><div><strong>Zaloguj się i połącz telefony</strong><small>Jednorazowy kod e-mail, bez hasła</small></div></button><button class="menu-action" onclick="openV08Help()"><span>?</span><div><strong>Jak to działa?</strong><small>Zobacz instrukcję krok po kroku</small></div></button>`;
  modalRoot.innerHTML=`<div class="modal-backdrop" onclick="backdropClose(event)"><section class="modal account-modal v08-account-modal" role="dialog" aria-modal="true" aria-label="Konto"><button class="close" onclick="closeModal()">×</button>${hero}<div class="account-menu-actions">${actions}</div></section></div>`;
}

function renderHelpModal(){
  modalRoot.innerHTML=`<div class="modal-backdrop" onclick="backdropClose(event)"><section class="modal v08-help" role="dialog" aria-modal="true" aria-label="Jak zacząć"><button class="close" onclick="closeModal()">×</button><span class="v08-kicker">POMOC</span><h2>Jak zacząć?</h2><p class="muted">Wybierz sposób, który pasuje do tego, jak chcecie grać.</p><div class="v08-help-columns"><article><span>▣</span><h3>Jeden telefon</h3><ol><li>Wybierzcie grę z pulpitu.</li><li>Przekazujcie sobie telefon zgodnie z instrukcją.</li><li>Wyniki zostają lokalnie na urządzeniu.</li></ol><button class="button secondary full" onclick="v08SwitchToLocal()">Używaj lokalnie</button></article><article><span>⇄</span><h3>Dwa telefony</h3><ol><li>Każda osoba loguje się kodem e-mail.</li><li>Jedna tworzy parę, druga wpisuje kod.</li><li>Odpowiedzi i historia synchronizują się automatycznie.</li></ol><button class="button primary full" onclick="v08StartOnlineSetup()">Skonfiguruj dwa telefony</button></article></div><div class="v08-note">💡 Logowanie jest zapamiętywane osobno w każdej zainstalowanej aplikacji. Ponowne logowanie będzie potrzebne dopiero po wylogowaniu, usunięciu skrótu z jego danymi albo wyczyszczeniu pamięci witryny.</div><button class="v08-text-button" onclick="openV08Onboarding()">Uruchom pełne wprowadzenie ponownie</button></section></div>`;
}
function openV08Help(){ui.modal='v08-help';renderModal()}
function v08StartOnlineSetup(){setUseMode('online');setSetupState('started-online');ui.modal=null;showCloudHub()}
function v08SwitchToLocal(){setUseMode('local');setSetupState('done-local');settings.onboardingDone=true;saveSettings();ui.modal=null;goHome();toast?.('Włączono tryb jednego telefonu.')}

function enhanceCloudScreen(){
  if(typeof ui==='undefined'||ui.view!=='cloud')return;
  const panel=document.querySelector('.cloud-panel');if(!panel)return;
  panel.querySelector('.v08-cloud-guide')?.remove();
  let step='1',title='Zaloguj się',text='Wyślij kod e-mail i wpisz go w tej aplikacji. Konto zostanie zapamiętane.';
  if(runtime?.user&&!runtime.couple){step='2';title='Połącz telefony';text='Utwórz parę albo wpisz kod otrzymany od partnera.'}
  else if(runtime?.couple&&runtime.members?.length<2){step='3';title='Czekamy na partnera';text=`Druga osoba powinna zalogować się i wpisać kod ${runtime.couple.invite_code||''}.`}
  else if(isPaired()){step='✓';title='Wszystko gotowe';text='Konto jest zapamiętane, a synchronizacja między telefonami jest aktywna.'}
  const guide=document.createElement('div');guide.className='v08-cloud-guide';
  guide.innerHTML=`<b>${esc(step)}</b><span><strong>${esc(title)}</strong><small>${esc(text)}</small></span>`;
  const top=panel.querySelector('.top-row');
  if(top)top.insertAdjacentElement('afterend',guide);else panel.prepend(guide);
}

function updateHeader(){
  const button=document.querySelector('#account-button');if(!button)return;
  const logged=Boolean(runtime?.user);const paired=isPaired();
  button.classList.toggle('online',logged);button.classList.toggle('paired',paired);
  button.innerHTML=`<span class="account-avatar">${esc(logged?accountInitials():'♡')}${logged?'<i class="v08-avatar-dot"></i>':''}</span><span class="account-copy"><strong>${esc(logged?accountName():'Konto')}</strong><small>${esc(syncLabel())}</small></span><span class="account-chevron">⌄</span>`;
  button.setAttribute('aria-label',logged?`Konto ${accountName()}, ${syncLabel()}`:'Otwórz konto i synchronizację');
}
function updateVersion(){
  document.documentElement.dataset.version=V08_VERSION;
  document.title=document.title.replace(/0\.7\.2|0\.7\.1/g,V08_VERSION);
  document.querySelectorAll('.version-badge,.version-chip').forEach(node=>node.textContent=`v${V08_VERSION}`);
  const aboutChip=document.querySelector('.about-panel .chip');if(aboutChip)aboutChip.textContent=`v${V08_VERSION}`;
}

async function restoreSessionOnResume(){
  if(!runtime?.client)return;
  try{
    const{data}=await runtime.client.auth.getSession();
    if(data?.session&&!runtime.user){location.reload();return}
    if(data?.session&&document.visibilityState==='visible')runtime.client.auth.refreshSession().catch(()=>{});
  }catch{}
}
function requestPersistentStorage(){
  if(navigator.storage?.persist)navigator.storage.persist().catch(()=>{});
}
function scheduleFirstRun(){
  setTimeout(()=>{
    markSetupCompleteWhenReady();
    if(isFirstRunPending()){
      onboardingStep='welcome';ui.modal='v08-onboarding';renderModal();
    }
  },650);
}

const previousRender=window.render;
window.render=function(){
  previousRender();
  markSetupCompleteWhenReady();enhanceHome();enhanceCloudScreen();updateHeader();updateVersion();
};
const previousRenderModal=window.renderModal;
window.renderModal=function(){
  if(ui.modal==='v08-onboarding'){renderOnboardingModal();return}
  if(ui.modal==='v08-help'){renderHelpModal();return}
  if(ui.modal==='main-menu'){renderMainMenuV08();return}
  if(ui.modal==='account-menu'){renderAccountMenuV08();return}
  previousRenderModal();
};

Object.assign(window,{v08OnboardingNext,v08OnboardingBack,v08ChooseMode,v08FinishLocal,v08FinishLocalQuick,v08ContinueOnline,v08FinishOnline,openV08Onboarding,openV08Help,v08StartOnlineSetup,v08SwitchToLocal});
window.addEventListener('pageshow',restoreSessionOnResume);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')restoreSessionOnResume()});
window.addEventListener('load',requestPersistentStorage,{once:true});
updateVersion();updateHeader();scheduleFirstRun();
})();
