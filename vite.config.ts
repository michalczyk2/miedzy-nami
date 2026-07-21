import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import packageJson from './package.json';

const ROOT = process.cwd();
const OUT = resolve(ROOT, 'dist');

const REQUIRED_STATIC_ASSETS = [
  '404.html',
  'release.js',
  'cloud-config.js',
  'app.js',
  'enhancements.js',
  'styles.css',
  'content',
  'manifest.webmanifest',
  'sw.js',
  'version.json',
  'robots.txt',
  'icon.svg',
  'icon-180.png',
  'icon-192.png',
  'icon-512.png',
] as const;

const ROOT_RUNTIME_PATTERN =
  /^(?:v\d+|multiplayer-[a-z0-9-]+|spicy-[a-z0-9-]+)\.(?:js|css)$/i;

function listFiles(directory: string): string[] {
  if (!existsSync(directory)) return [];

  const result: string[] = [];

  for (const entry of readdirSync(directory)) {
    const path = join(directory, entry);

    if (statSync(path).isDirectory()) result.push(...listFiles(path));
    else result.push(path);
  }

  return result;
}

function discoverRuntimeAssets(): string[] {
  return readdirSync(ROOT)
    .filter((entry) => ROOT_RUNTIME_PATTERN.test(entry))
    .sort();
}

function deploymentAssets(): string[] {
  return [...new Set([...REQUIRED_STATIC_ASSETS, ...discoverRuntimeAssets()])];
}

function copyAsset(item: string): void {
  const source = resolve(ROOT, item);
  const target = resolve(OUT, item);

  if (!existsSync(source)) {
    throw new Error(`Brak zasobu wdrożeniowego: ${item}`);
  }

  mkdirSync(dirname(target), { recursive: true });
  cpSync(source, target, { recursive: true });
}

function publicPath(path: string): string {
  return `/${relative(OUT, path).replace(/\\/g, '/')}`;
}

function bootScriptPaths(): string[] {
  const source = readFileSync(resolve(ROOT, 'main.ts'), 'utf8');
  const block = source.match(/const LEGACY_SCRIPTS = \[([\s\S]*?)\] as const;/)?.[1];

  if (!block) {
    throw new Error('Nie znaleziono listy LEGACY_SCRIPTS w main.ts.');
  }

  return [...block.matchAll(/'([^']+\.js)'/g)].map((match) => match[1]);
}

function linkedStylesheets(): string[] {
  const html = readFileSync(resolve(OUT, 'index.html'), 'utf8');

  return [...html.matchAll(/href="(\/[^"]+\.css)"/g)].map((match) => match[1]);
}

function assertOutputFile(pathname: string, source: string): void {
  const path = resolve(OUT, pathname.replace(/^\//, ''));

  if (!existsSync(path)) {
    throw new Error(
      `${source} odwołuje się do brakującego pliku wdrożeniowego: ${pathname}`,
    );
  }
}

function copyAndVerifyRuntime(): Plugin {
  return {
    name: 'miedzy-nami-copy-and-verify-runtime',
    closeBundle() {
      const copied = deploymentAssets();

      for (const item of copied) copyAsset(item);

      for (const pathname of bootScriptPaths()) {
        assertOutputFile(pathname, 'main.ts');
      }

      for (const pathname of linkedStylesheets()) {
        assertOutputFile(pathname, 'index.html');
      }

      const viteAssets = listFiles(resolve(OUT, 'assets'))
        .map(publicPath)
        .sort();

      const staticAssets = copied
        .flatMap((item) => {
          const path = resolve(OUT, item);
          return statSync(path).isDirectory() ? listFiles(path) : [path];
        })
        .map(publicPath)
        .filter((path) => path !== '/404.html')
        .sort();

      const swPath = resolve(OUT, 'sw.js');
      let sw = readFileSync(swPath, 'utf8');

      const viteMarker = '/*__MN_VITE_ASSETS__*/[]';
      const staticMarker = '/*__MN_STATIC_ASSETS__*/[]';

      if (!sw.includes(viteMarker)) {
        throw new Error('Service worker nie zawiera znacznika zasobów Vite.');
      }

      if (!sw.includes(staticMarker)) {
        throw new Error('Service worker nie zawiera znacznika zasobów statycznych.');
      }

      sw = sw
        .replace(viteMarker, JSON.stringify(viteAssets))
        .replace(staticMarker, JSON.stringify(staticAssets));

      writeFileSync(swPath, sw, 'utf8');
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [copyAndVerifyRuntime()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
  },
});
