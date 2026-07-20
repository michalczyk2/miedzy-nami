import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const read=file=>readFileSync(resolve(root,file),'utf8');
const packageJson=JSON.parse(read('package.json'));
const versionJson=JSON.parse(read('version.json'));
const release=read('release.js');
const index=read('index.html');
const sw=read('sw.js');
const main=read('main.ts');
const expected=packageJson.version;
const errors=[];
if(versionJson.version!==expected)errors.push(`version.json: ${versionJson.version}, oczekiwano ${expected}`);
if(!release.includes(`version:'${expected}'`))errors.push('release.js ma inną wersję');
if(!index.includes(`Między Nami ${expected}`))errors.push('index.html ma inną wersję');
if(!index.includes('/main.ts'))errors.push('index.html nie uruchamia main.ts');
if(!main.includes('__APP_VERSION__'))errors.push('main.ts nie pobiera wersji z procesu budowania');
if(!sw.includes('MN_RELEASE?.cache'))errors.push('sw.js nie korzysta z release.js');
if(!sw.includes('__MN_VITE_ASSETS__'))errors.push('sw.js nie przyjmuje zasobów z Vite');
if(errors.length){console.error(errors.join('\n'));process.exit(1)}
console.log(`Wersja ${expected} jest spójna w package.json, version.json, release.js, index.html, main.ts i sw.js.`);
