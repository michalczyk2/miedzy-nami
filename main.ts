import { createClient } from '@supabase/supabase-js';

declare const __APP_VERSION__: string;

type ReleaseInfo = Readonly<{
  name: string;
  version: string;
  cache: string;
  channel: 'stable' | 'preview';
  foundation: 'vite-typescript';
}>;

type BootState = {
  version: string;
  startedAt: number;
  completedAt: number | null;
  loadedScripts: string[];
  failedScript: string | null;
};

declare global {
  interface Window {
    MN_RELEASE?: ReleaseInfo;
    MN_BOOT?: BootState;
    supabase?: { createClient: typeof createClient };
    render?: () => void;
    toast?: (message: string) => void;
  }
}

const VERSION = __APP_VERSION__;
const RELEASE: ReleaseInfo = Object.freeze({
  name: 'Między Nami',
  version: VERSION,
  cache: `miedzy-nami-v${VERSION.replace(/\D/g, '')}`,
  channel: 'stable',
  foundation: 'vite-typescript',
});

const LEGACY_SCRIPTS = [
  '/cloud-config.js',
  '/app.js',
  '/enhancements.js',
  '/content/cards-v05.js',
  '/v05.js',
  '/content/daily-match.js',
  '/v06.js',
  '/v07.js',
  '/v071.js',
  '/v08.js',
  '/spicy-v081-data.js',
  '/v081.js',
  '/spicy-v082-data.js',
  '/v082.js',
  '/v083.js',
  '/v091.js',
  '/multiplayer-core-v092.js',
  '/v092.js',
] as const;

const boot: BootState = {
  version: VERSION,
  startedAt: Date.now(),
  completedAt: null,
  loadedScripts: [],
  failedScript: null,
};

window.MN_RELEASE = RELEASE;
window.MN_BOOT = boot;
window.supabase = { createClient };
document.documentElement.dataset.version = VERSION;
document.documentElement.dataset.foundation = 'vite-typescript';

function loadClassicScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = false;
    script.dataset.mnLegacy = 'true';
    script.addEventListener('load', () => {
      boot.loadedScripts.push(src);
      resolve();
    }, { once: true });
    script.addEventListener('error', () => {
      boot.failedScript = src;
      reject(new Error(`Nie udało się załadować ${src}`));
    }, { once: true });
    document.head.appendChild(script);
  });
}

function showBootError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  console.error('[Między Nami boot]', error);
  const app = document.querySelector<HTMLElement>('#app');
  if (!app) return;
  app.innerHTML = `
    <section class="panel wide boot-failure" role="alert">
      <span class="chip">Błąd uruchamiania</span>
      <h1>Nie udało się uruchomić aplikacji</h1>
      <p class="muted">Twoje zapisane dane nie zostały usunięte. Sprawdź internet i spróbuj ponownie.</p>
      <p class="boot-failure-detail"></p>
      <button class="button primary" type="button" id="boot-retry">Spróbuj ponownie</button>
    </section>`;
  const detail = app.querySelector<HTMLElement>('.boot-failure-detail');
  if (detail) detail.textContent = message;
  app.querySelector('#boot-retry')?.addEventListener('click', () => location.reload());
}

async function ensureServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.warn('[Między Nami SW]', error);
  }
}

async function bootApplication(): Promise<void> {
  for (const script of LEGACY_SCRIPTS) {
    await loadClassicScript(script);
  }
  boot.completedAt = Date.now();
  document.documentElement.dataset.boot = 'ready';
  await ensureServiceWorker();
}

void bootApplication().catch(showBootError);
