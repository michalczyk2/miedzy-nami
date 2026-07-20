import {execFileSync} from 'node:child_process';
import {readFileSync,existsSync,statSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname);
const required=['index.html','main.ts','vite.config.ts','tsconfig.json','release.js','styles.css','cloud-config.js','app.js','enhancements.js','v05.js','v06.js','v07.js','v071.js','v08.js','spicy-v081-data.js','v081.js','spicy-v082-data.js','v082.js','v083.js','v091.js','multiplayer-core-v092.js','v092.js','manifest.webmanifest','sw.js','vercel.json','version.json','content/library.json','content/daily-match.json','002_fix_invite_code.sql','003_v091_spicy_match_two_phones.sql','004_v092_multiplayer_choice_engine.sql','005_v093_live_who_more.sql','006_v094_live_know_me.sql','007_v096_pairing_ux.sql','008_v097_live_choice.sql','009_v098_live_scale_and_device_labels.sql','v099.js','v0910.js'];
const errors=[];
for(const file of required){const path=resolve(root,file);if(!existsSync(path)||statSync(path).size===0)errors.push(`Brak lub pusty plik: ${file}`)}
for(const file of ['release.js','cloud-config.js','app.js','enhancements.js','v05.js','v06.js','v07.js','v071.js','v08.js','spicy-v081-data.js','v081.js','spicy-v082-data.js','v082.js','v083.js','v091.js','multiplayer-core-v092.js','v092.js','multiplayer-live-core-v093.js','v093.js','v094.js','v097.js','v098.js','v099.js','v0910.js','sw.js']){
  try{execFileSync(process.execPath,['--check',resolve(root,file)],{stdio:'pipe'})}catch(error){errors.push(`Błąd składni JavaScript: ${file}\n${error.stderr?.toString()||error.message}`)}
}
for(const file of ['manifest.webmanifest','vercel.json','version.json','content/library.json','content/daily-match.json','tsconfig.json']){
  try{JSON.parse(readFileSync(resolve(root,file),'utf8'))}catch(error){errors.push(`Błędny JSON: ${file}: ${error.message}`)}
}
const html=readFileSync(resolve(root,'index.html'),'utf8');
if(!html.includes('type="module" src="/main.ts"'))errors.push('index.html nie uruchamia /main.ts');
if(html.includes('cdn.jsdelivr.net/npm/@supabase'))errors.push('index.html nadal ładuje Supabase z CDN');
const main=readFileSync(resolve(root,'main.ts'),'utf8');
for(const asset of ['/cloud-config.js','/app.js','/enhancements.js','/v05.js','/v06.js','/v07.js','/v071.js','/v08.js','/spicy-v081-data.js','/v081.js','/spicy-v082-data.js','/v082.js','/v083.js','/v091.js','/multiplayer-core-v092.js','/v092.js','/multiplayer-live-core-v093.js','/v093.js','/v094.js','/v097.js','/v098.js','/v099.js','/v0910.js'])if(!main.includes(`'${asset}'`))errors.push(`main.ts nie ładuje ${asset}`);
const version=JSON.parse(readFileSync(resolve(root,'version.json'),'utf8'));
const library=JSON.parse(readFileSync(resolve(root,'content/library.json'),'utf8'));
const daily=JSON.parse(readFileSync(resolve(root,'content/daily-match.json'),'utf8'));
if(version.version!=='0.9.10')errors.push(`Nieprawidłowa wersja: ${version.version}`);
if(version.creator!=='Michał Czerwiński')errors.push('Nieprawidłowy autor');
const libraryHasAdult=library.some(card=>card.category==='pikantne');
const runtimeCards=library.length+(libraryHasAdult?0:Number(version.adult_pack_cards||0));
if(version.cards!==runtimeCards)errors.push(`Niezgodna liczba kart runtime: ${version.cards}/${runtimeCards}`);
if(version.daily_match_questions!==daily.questions.length)errors.push(`Niezgodna liczba pytań: ${version.daily_match_questions}/${daily.questions.length}`);
const auth=readFileSync(resolve(root,'v07.js'),'utf8');
for(const fragment of ['signInWithOtp','verifyOtp','persistSession:true','autoRefreshToken:true'])if(!auth.includes(fragment))errors.push(`Brak mechanizmu logowania: ${fragment}`);
const ux=readFileSync(resolve(root,'v08.js'),'utf8');
for(const fragment of ['v08-onboarding','Razem na jednym telefonie','Na dwóch telefonach','Logowanie zapamiętane','auth.getSession','Jak zacząć'])if(!ux.includes(fragment))errors.push(`Brak elementu v0.8: ${fragment}`);
const sw=readFileSync(resolve(root,'sw.js'),'utf8');
for(const asset of ['/release.js','/v07.js','/v071.js','/v08.js','/spicy-v081-data.js','/v081.js','/spicy-v082-data.js','/v082.js','/v083.js','/v091.js','/multiplayer-core-v092.js','/v092.js','/multiplayer-live-core-v093.js','/v093.js','/v094.js','/v097.js','/v098.js','/v099.js','/v0910.js','/styles.css'])if(!sw.includes(asset))errors.push(`Service worker nie buforuje ${asset}`);
if(!sw.includes('__MN_VITE_ASSETS__'))errors.push('Service worker nie ma znacznika zasobów Vite');
const spicy082=readFileSync(resolve(root,'v082.js'),'utf8');
const spicy082Data=readFileSync(resolve(root,'spicy-v082-data.js'),'utf8');
for(const fragment of ['Dopasowanie 18+','Ochota na dziś','Bez tabu','Tylko we dwoje','v082-spicy-app'])if(!spicy082.includes(fragment))errors.push(`Brak elementu v0.8.2: ${fragment}`);
for(const fragment of ['Jaka pozycja jest twoją ulubioną?','seks oralny','MN_V082_SPICY_ACTIONS'])if(!spicy082Data.includes(fragment))errors.push(`Brak danych v0.8.2: ${fragment}`);
const stability=readFileSync(resolve(root,'v083.js'),'utf8');
for(const fragment of ['MN_FRIENDLY_ERROR','SKIP_WAITING','Nowa wersja jest gotowa','Tryb offline'])if(!stability.includes(fragment))errors.push(`Brak elementu stabilizacji v0.8.3: ${fragment}`);
const migrationFix=readFileSync(resolve(root,'002_fix_invite_code.sql'),'utf8');
for(const fragment of ['gen_random_uuid','generate_invite_code','security definer'])if(!migrationFix.toLowerCase().includes(fragment.toLowerCase()))errors.push(`Migracja 002 nie zawiera: ${fragment}`);
if(errors.length){console.error(`\nKontrola nieudana (${errors.length}):\n- ${errors.join('\n- ')}\n`);process.exit(1)}
console.log(`Kontrola v0.9.10 OK: ${library.length} kart, ${daily.questions.length} pytań, Vite, TypeScript i pojedynczy punkt wejścia.`);
