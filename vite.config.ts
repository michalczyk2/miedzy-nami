import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';
import packageJson from './package.json';

const ROOT = process.cwd();
const OUT = resolve(ROOT, 'dist');

const LEGACY_ASSETS = [
  '404.html',
  'release.js',
  'cloud-config.js',
  'app.js',
  'enhancements.js',
  'styles.css',
  'v05.js',
  'v06.js',
  'v07.js',
  'v071.js',
  'v08.js',
  'v081.js',
  'v082.js',
  'v083.js',
  'v091.js',
  'multiplayer-core-v092.js',
  'v092.js',
  'spicy-v081-data.js',
  'spicy-v082-data.js',
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

function copyLegacyAssets(): Plugin {
  return {
    name: 'miedzy-nami-copy-legacy-assets',
    closeBundle() {
      for (const item of LEGACY_ASSETS) {
        const source = resolve(ROOT, item);
        const target = resolve(OUT, item);
        if (!existsSync(source)) throw new Error(`Brak zasobu wdrożeniowego: ${item}`);
        mkdirSync(dirname(target), { recursive: true });
        cpSync(source, target, { recursive: true });
      }

      const assetPaths = listFiles(resolve(OUT, 'assets'))
        .map((path) => `/${relative(OUT, path).replace(/\\/g, '/')}`)
        .sort();
      const swPath = resolve(OUT, 'sw.js');
      const sw = readFileSync(swPath, 'utf8');
      const marker = '/*__MN_VITE_ASSETS__*/[]';
      if (!sw.includes(marker)) throw new Error('Service worker nie zawiera znacznika zasobów Vite.');
      writeFileSync(swPath, sw.replace(marker, JSON.stringify(assetPaths)), 'utf8');
    },
  };
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [copyLegacyAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    sourcemap: false,
  },
});
