import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const required=['index.html','styles.css','cloud-config.js','app.js','enhancements.js','v05.js','v06.js','v07.js','v071.js','v08.js','manifest.webmanifest','sw.js','vercel.json','version.json','content/library.json','content/daily-match.json','supabase/migrations/001_v07_cloud.sql'];
const errors=[];
for(const file of required){const path=resolve(root,file);if(!existsSync(path)||statSync(path).size===0)errors.push(`Brak lub pusty plik: ${file}`)}
for(const file of ['cloud-config.js','app.js','enhancements.js','v05.js','v06.js','v07.js','v071.js','v08.js','sw.js']){
  try{execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'pipe'})}catch(error){errors.push(`Błąd składni JavaScript: ${file}\n${error.stderr?.toString()||error.message}`)}
}
for(const file of ['manifest.webmanifest','vercel.json','version.json','content/library.json','content/daily-match.json']){
  try{JSON.parse(readFileSync(resolve(root,file),'utf8'))}catch(error){errors.push(`Błędny JSON: ${file}: ${error.message}`)}
}
const html=readFileSync(resolve(root,'index.html'),'utf8');
for(const asset of ['styles.css','cloud-config.js','app.js','enhancements.js','v05.js','v06.js','v07.js','v071.js','v08.js','manifest.webmanifest'])if(!html.includes(`/${asset}`))errors.push(`index.html nie odwołuje się do /${asset}`);
const version=JSON.parse(readFileSync(resolve(root,'version.json'),'utf8'));
const library=JSON.parse(readFileSync(resolve(root,'content/library.json'),'utf8'));
const daily=JSON.parse(readFileSync(resolve(root,'content/daily-match.json'),'utf8'));
if(version.version!=='0.8.0')errors.push(`Nieprawidłowa wersja: ${version.version}`);
if(version.creator!=='Michał Czerwiński')errors.push('Nieprawidłowy autor');
if(version.cards!==library.length)errors.push(`Niezgodna liczba kart: ${version.cards}/${library.length}`);
if(version.daily_match_questions!==daily.questions.length)errors.push(`Niezgodna liczba pytań: ${version.daily_match_questions}/${daily.questions.length}`);
const auth=readFileSync(resolve(root,'v07.js'),'utf8');
for(const fragment of ['signInWithOtp','verifyOtp','persistSession:true','autoRefreshToken:true'])if(!auth.includes(fragment))errors.push(`Brak mechanizmu logowania: ${fragment}`);
const ux=readFileSync(resolve(root,'v08.js'),'utf8');
for(const fragment of ['v08-onboarding','Razem na jednym telefonie','Na dwóch telefonach','Logowanie zapamiętane','auth.getSession','Jak zacząć'])if(!ux.includes(fragment))errors.push(`Brak elementu v0.8: ${fragment}`);
const sw=readFileSync(resolve(root,'sw.js'),'utf8');
for(const asset of ['/v07.js','/v071.js','/v08.js','/styles.css'])if(!sw.includes(asset))errors.push(`Service worker nie buforuje ${asset}`);
if(errors.length){console.error(`\nKontrola nieudana (${errors.length}):\n- ${errors.join('\n- ')}\n`);process.exit(1)}
console.log(`Kontrola v0.8.0 OK: ${library.length} kart, ${daily.questions.length} pytań, OTP, onboarding i trwała sesja.`);
