import vm from 'node:vm';
import {readFileSync, writeFileSync} from 'node:fs';
import {resolve} from 'node:path';

const root=resolve(import.meta.dirname,'..');
const noop=()=>{};
const element=()=>({
  innerHTML:'',textContent:'',hidden:true,value:'',checked:false,dataset:{},style:{},
  classList:{add:noop,remove:noop,toggle:noop,contains:()=>false},
  addEventListener:noop,querySelector:()=>null,querySelectorAll:()=>[],insertAdjacentHTML:noop,append:noop,click:noop
});
const elements=new Map();
const document={
  querySelector(selector){if(!elements.has(selector))elements.set(selector,element());return elements.get(selector)},
  querySelectorAll:()=>[],createElement:()=>element(),body:element(),title:''
};
const storage={getItem:()=>null,setItem:noop,removeItem:noop};
const context=vm.createContext({
  console,document,localStorage:storage,navigator:{vibrate:noop,serviceWorker:undefined,userAgent:'',platform:'',maxTouchPoints:0,onLine:true},
  window:null,matchMedia:()=>({matches:false}),setTimeout:()=>0,clearTimeout:noop,setInterval:()=>0,clearInterval:noop,
  Intl,Date,Math,Map,Set,URL,URLSearchParams,Blob,File:class{},location:{search:'',href:'http://localhost/'},history:{state:null,pushState:noop,replaceState:noop},structuredClone,JSON
});
context.window=context;
context.window.addEventListener=noop;
context.window.scrollTo=noop;
for(const file of ['app.js','enhancements.js','content/cards-v05.js']){
  vm.runInContext(readFileSync(resolve(root,file),'utf8'),context,{filename:file});
}
const cards=vm.runInContext(`(()=>{
  const removed=new Set(['v03-wave-10','v03-wave-11','v03-wave-15','v03-wave-17','v03-dilemma-37','v03-plan-15','v03-words-10']);
  const base=LIBRARY.filter(card=>!removed.has(card.id));
  const ids=new Set(base.map(card=>card.id));
  for(const card of globalThis.MN_V05_EXTRA_CARDS||[])if(!ids.has(card.id)){base.push(card);ids.add(card.id)}
  return base.map(card=>({...card}));
})()`,context);
writeFileSync(resolve(root,'content/library.json'),JSON.stringify(cards,null,2)+'\n');
console.log(`Wyeksportowano ${cards.length} kart do content/library.json.`);
