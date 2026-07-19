import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const noop=()=>{};
function makeElement(){return{innerHTML:'',textContent:'',hidden:true,value:'',checked:false,dataset:{},style:{},classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],insertAdjacentHTML:noop,append:noop,appendChild:noop,click:noop,setAttribute:noop}}
function runtime(){
  const elements=new Map();const document={querySelector:s=>{if(!elements.has(s))elements.set(s,makeElement());return elements.get(s)},querySelectorAll:()=>[],createElement:()=>makeElement(),body:makeElement(),documentElement:makeElement(),title:''};
  const store=new Map();const localStorage={getItem:key=>store.get(key)||null,setItem:(key,value)=>store.set(key,String(value)),removeItem:key=>store.delete(key)};
  const context=vm.createContext({console,document,localStorage,navigator:{vibrate:noop,serviceWorker:undefined,userAgent:'test',platform:'',maxTouchPoints:0,onLine:true,clipboard:{writeText:async()=>{}}},window:null,matchMedia:()=>({matches:false}),setTimeout:()=>0,clearTimeout:noop,setInterval:()=>0,clearInterval:noop,Intl,Date,Math,Map,Set,URL,URLSearchParams,Blob,File:class{},location:{search:'',href:'http://localhost/',origin:'http://localhost',pathname:'/'},history:{state:null,pushState:noop,replaceState:noop},structuredClone,JSON,confirm:()=>true});
  context.window=context;context.window.addEventListener=noop;context.window.scrollTo=noop;
  for(const file of ['cloud-config.js','app.js','enhancements.js','content/cards-v05.js','v05.js','content/daily-match.js','v06.js','v07.js','v071.js'])vm.runInContext(readFileSync(resolve(root,file),'utf8'),context,{filename:file});
  return context;
}

test('runtime uruchamia v0.7.1, tryb lokalny i ekrany chmury',()=>{
  const context=runtime();
  assert.equal(vm.runInContext('LIBRARY.length',context),754);
  const deck=vm.runInContext("buildDeck('mix',10,{modes:['know','story','challenge'],categories:CATEGORIES,intensity:2})",context);
  assert.equal(deck.length,10);
  assert.equal(new Set(deck.map(card=>card.id)).size,10);
  assert.doesNotThrow(()=>vm.runInContext('showCoupleProfile()',context));
  assert.doesNotThrow(()=>vm.runInContext('showDiagnostics()',context));
  assert.doesNotThrow(()=>vm.runInContext("rateCard(LIBRARY[0].id,'like')",context));
  assert.doesNotThrow(()=>vm.runInContext('openDailyMatch()',context));
  assert.equal(vm.runInContext('profile.dailyCompatibility.days[Object.keys(profile.dailyCompatibility.days)[0]].questionIds.length',context),5);
  assert.doesNotThrow(()=>vm.runInContext('showCloudHub()',context));
  assert.equal(vm.runInContext('ui.view',context),'cloud');
  assert.doesNotThrow(()=>vm.runInContext('showAboutApp()',context));
  assert.equal(vm.runInContext('ui.view',context),'about');
  assert.equal(vm.runInContext('document.documentElement.dataset.version',context),'0.7.1');
});
