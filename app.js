/* Pépètes : application. Les données restent sur l'appareil (IndexedDB + copie localStorage). */
"use strict";
/* ---------- Outils ---------- */
const $=(s,el=document)=>el.querySelector(s), $$=(s,el=document)=>[...el.querySelectorAll(s)];
const FMT=new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR'});
const eur=c=>FMT.format(c/100);
const eur0=c=>new Intl.NumberFormat('fr-FR',{style:'currency',currency:'EUR',maximumFractionDigits:0}).format(Math.round(c/100));
const sgn=(c,type)=>(type==='income'?'+':'−')+eur(c);
const pad=n=>String(n).padStart(2,'0');
const ymd=d=>`${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
const parseD=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d)};
const ymOf=s=>s.slice(0,7);
const TODAY=ymd(new Date()), CUR=TODAY.slice(0,7);
const uid=()=>Math.random().toString(36).slice(2,9)+Date.now().toString(36).slice(-4);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const MONTHS=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const MS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
const DOW=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
const monthLabel=ym=>{const[y,m]=ym.split('-').map(Number);return MONTHS[m-1]+' '+y};
const addMonths=(ym,n)=>{const[y,m]=ym.split('-').map(Number);const d=new Date(y,m-1+n,1);return `${d.getFullYear()}-${pad(d.getMonth()+1)}`};
const dim=(y,m)=>new Date(y,m+1,0).getDate();
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dayLabel=s=>{ if(s===TODAY) return "Aujourd'hui"; const d=parseD(s), t=parseD(TODAY); const diff=Math.round((t-d)/864e5); if(diff===1) return 'Hier'; return `${DOW[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
const cap=s=>s.charAt(0).toUpperCase()+s.slice(1);
/* Jeu d'icônes maison (24×24, trait 1,8) : il remplace les emojis partout */
const ICONS={
 cart:'<path d="M3 4h2l2.1 10.1a1.6 1.6 0 0 0 1.6 1.3h8.5a1.6 1.6 0 0 0 1.5-1.2L20.4 8H6.1"/><circle cx="9.5" cy="19.4" r="1.3"/><circle cx="17" cy="19.4" r="1.3"/>',
 cup:'<path d="M4.5 9.5h11v4.5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5z"/><path d="M15.5 10.5H17a2.5 2.5 0 0 1 0 5h-1.6"/><path d="M8 3.8c-.6.8-.6 1.6 0 2.4M12 3.8c-.6.8-.6 1.6 0 2.4"/>',
 bowl:'<path d="M3.5 11h17a8.5 8.5 0 0 1-17 0z"/><path d="M8 20h8M13 7l5-3.5M10 7.5l7-5"/>',
 tram:'<rect x="5.5" y="3.5" width="13" height="13" rx="3"/><path d="M5.5 10.5h13M9 3.5v7M15 3.5v7"/><circle cx="9" cy="13.6" r=".8"/><circle cx="15" cy="13.6" r=".8"/><path d="M8.5 16.5 6.5 20.5M15.5 16.5l2 4"/>',
 home:'<path d="M4 10.5 12 4l8 6.5V19a1.5 1.5 0 0 1-1.5 1.5H15v-5.5H9v5.5H5.5A1.5 1.5 0 0 1 4 19z"/>',
 bolt:'<path d="M13 3 5.5 13.5H11L10 21l7.5-10.5H12z"/>',
 health:'<rect x="4" y="4" width="16" height="16" rx="5"/><path d="M12 8.5v7M8.5 12h7"/>',
 bag:'<path d="M5.5 8h13l-1 11.4a1.6 1.6 0 0 1-1.6 1.4H8.1a1.6 1.6 0 0 1-1.6-1.4z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>',
 ticket:'<path d="M3.5 7.5A1.5 1.5 0 0 1 5 6h14a1.5 1.5 0 0 1 1.5 1.5V10a2 2 0 0 0 0 4v2.5A1.5 1.5 0 0 1 19 18H5a1.5 1.5 0 0 1-1.5-1.5V14a2 2 0 0 0 0-4z"/><path d="M14.5 6.5v2M14.5 11v2M14.5 15.5v2"/>',
 suitcase:'<rect x="4" y="7.5" width="16" height="12.5" rx="2.5"/><path d="M9 7.5V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6v1.9M9 11v5.5M15 11v5.5"/>',
 play:'<rect x="3.5" y="4.5" width="17" height="12.5" rx="2.5"/><path d="m10.5 8.4 4 2.35-4 2.35z"/><path d="M8 20.5h8"/>',
 gift:'<rect x="4.5" y="10" width="15" height="10" rx="1.8"/><path d="M3.5 7.5h17V10h-17zM12 7.5V20"/><path d="M12 7.5C10.5 4.5 7 4.3 7 6.2 7 7.5 9 7.5 12 7.5c3 0 5 0 5-1.3 0-1.9-3.5-1.7-5 1.3z"/>',
 box:'<path d="M4 8 12 4l8 4v8l-8 4-8-4z"/><path d="m4 8 8 4 8-4M12 12v8"/>',
 briefcase:'<rect x="3.5" y="7" width="17" height="12.5" rx="2.5"/><path d="M9 7V5.6A1.6 1.6 0 0 1 10.6 4h2.8A1.6 1.6 0 0 1 15 5.6V7M3.5 12.5h17M12 11.5v2"/>',
 back:'<path d="M9 6.5 4.5 11 9 15.5"/><path d="M4.5 11H15a4.5 4.5 0 0 1 0 9h-2.5"/>',
 star:'<path d="m12 3.8 2.4 5 5.4.7-4 3.7 1.1 5.3L12 15.9l-4.9 2.6 1.1-5.3-4-3.7 5.4-.7z"/>',
 tag:'<path d="M4 12.6V5a1 1 0 0 1 1-1h7.6l7.6 7.6-7.6 7.6z"/><circle cx="8.6" cy="8.6" r="1.4"/>',
 coins:'<ellipse cx="9.5" cy="7.5" rx="5.5" ry="2.6"/><path d="M4 7.5v4c0 1.4 2.5 2.6 5.5 2.6s5.5-1.2 5.5-2.6v-4"/><path d="M9.2 16.6c.6 1.1 2.8 1.9 5.3 1.9 3 0 5.5-1.2 5.5-2.6v-4c0-1.2-1.7-2.2-4.1-2.5"/>',
 card:'<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18M7 15h3"/>',
 cash:'<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><circle cx="12" cy="12" r="2.6"/><path d="M6 9.5v5M18 9.5v5"/>',
 transfer:'<path d="M4 8.5h14M14.5 5 18 8.5 14.5 12M20 15.5H6M9.5 12 6 15.5 9.5 19"/>',
 bank:'<path d="M3.5 9.5 12 4.5l8.5 5M5.5 10v7.5M9.8 10v7.5M14.2 10v7.5M18.5 10v7.5M3.5 20.5h17"/>',
 heart:'<path d="M12 19.5s-7.5-4.4-7.5-9.6A4.1 4.1 0 0 1 12 7.6a4.1 4.1 0 0 1 7.5 2.3c0 5.2-7.5 9.6-7.5 9.6z"/>',
 paw:'<circle cx="7" cy="10.5" r="1.6"/><circle cx="10.5" cy="6.8" r="1.6"/><circle cx="15" cy="7" r="1.6"/><circle cx="18" cy="10.8" r="1.6"/><path d="M8.8 17.2c0-2.6 1.9-5.2 4.2-5.2s3.8 2.2 3.8 4.4c0 2-1.8 2.8-3.8 2.3-1.9-.5-4.2.9-4.2-1.5z"/>',
 book:'<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v15.5H5.5A1.5 1.5 0 0 1 4 18zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v15.5h5.5A1.5 1.5 0 0 0 20 18z"/>',
 dumbbell:'<path d="M6.5 7.5v9M17.5 7.5v9M3.8 10v4M20.2 10v4M6.5 12h11"/>',
 car:'<path d="M4.5 16.5h15V12l-2-4.8H6.5L4.5 12z"/><path d="M4.5 12h15M7 19.5v-3M17 19.5v-3"/><circle cx="8" cy="14.2" r=".9"/><circle cx="16" cy="14.2" r=".9"/>',
 fuel:'<path d="M5 20V5.5A1.5 1.5 0 0 1 6.5 4h6A1.5 1.5 0 0 1 14 5.5V20M3.5 20h12M5 10h9"/><path d="M14 8.5h1.8a1.7 1.7 0 0 1 1.7 1.7v6a1.3 1.3 0 0 0 2.6 0V9l-2.4-2.6"/>',
 phone:'<rect x="7" y="3" width="10" height="18" rx="2.5"/><path d="M11 18h2"/>',
 shirt:'<path d="M9 4 4.2 6.4l1.6 4.1L8 9.6V20h8V9.6l2.2.9 1.6-4.1L15 4a3 3 0 0 1-6 0z"/>',
 music:'<path d="M9 17.5V6l10-2v11.5"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="15.5" r="2"/>',
 film:'<rect x="3.5" y="5" width="17" height="14" rx="2.5"/><path d="M7.5 5v14M16.5 5v14M3.5 9.5h4M3.5 14.5h4M16.5 9.5h4M16.5 14.5h4"/>',
 glass:'<path d="M5.5 4h13L12 12z"/><path d="M12 12v7.5M8.5 20h7M7.6 6.5h8.8"/>',
 leaf:'<path d="M5 19c0-8 5-14 14-14 0 9-6 14-14 14z"/><path d="M5 19 12.5 11.5"/>',
 school:'<path d="m3 9.5 9-4.5 9 4.5-9 4.5z"/><path d="M7 11.5v4c0 1.5 2.2 3 5 3s5-1.5 5-3v-4M21 9.5V14"/>',
 bike:'<circle cx="6" cy="16" r="3.5"/><circle cx="18" cy="16" r="3.5"/><path d="M6 16l3.8-7h5.2l3 7M9.8 9 8.4 6H6.8M13.8 6.2h2.2"/>',
 wrench:'<path d="M14.6 6.4a4 4 0 0 0-5.2 5.2L4 17l3 3 5.4-5.4a4 4 0 0 0 5.2-5.2l-2.5 2.5-2.4-.5-.5-2.4z"/>',
 baby:'<circle cx="12" cy="13" r="7"/><path d="M12 6c-1 0-1.5-.8-1.2-1.6M9.5 12.5h.01M14.5 12.5h.01M10 16c1.2.8 2.8.8 4 0"/>',
 sparkle:'<path d="M12 3.5 13.8 10l6.2 2-6.2 2L12 20.5 10.2 14 4 12l6.2-2z"/>',
 repeat:'<path d="M17 3.5 20 6.5 17 9.5"/><path d="M4 11V9.5a3 3 0 0 1 3-3h13M7 20.5l-3-3 3-3"/><path d="M20 13v1.5a3 3 0 0 1-3 3H4"/>',
 grid:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><rect x="13" y="13" width="7" height="7" rx="2"/>',
 hash:'<path d="M9.5 4 8 20M16 4l-1.5 16M4.5 9h15.5M4 15h15.5"/>',
 mic:'<rect x="9" y="3.5" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v2.5"/>',
 calendar:'<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
 pencil:'<path d="M15.5 4.5l4 4L9 19H5v-4z"/><path d="M13 7l4 4"/>',
 people:'<circle cx="9" cy="8.5" r="3"/><circle cx="16.5" cy="9.5" r="2.4"/><path d="M3.5 19c.6-3 2.8-4.8 5.5-4.8S13.9 16 14.5 19M14.8 14.6c2.6-.4 4.8 1.2 5.5 4"/>',
 check:'<circle cx="12" cy="12" r="8.5"/><path d="m8.3 12.3 2.6 2.6 5-5.4"/>',
 chart:'<path d="M4 19.5V5M4 19.5h16M8 15l3-4 3 2.5 5-6.5"/>',
 download:'<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>',
 share:'<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5.5 12v7a1.5 1.5 0 0 0 1.5 1.5h10a1.5 1.5 0 0 0 1.5-1.5v-7"/>',
 info:'<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
 flame:'<path d="M12 20.5c-3.6 0-6-2.4-6-5.6 0-3.5 2.6-5.3 3.5-8.4.4 1.6 1.4 2.6 2.4 3.1.4-2.6 1.6-4.7 3.4-6.1-.3 3.3 2.7 5.4 2.7 9.4 0 4.8-2.6 7.6-6 7.6z"/><path d="M12 20.5c-1.5 0-2.5-1-2.5-2.5s1.4-2.5 2.3-4c.9 1.3 2.7 2.4 2.7 4 0 1.5-1 2.5-2.5 2.5z"/>',
 out:'<path d="M7 17 17 7M9 7h8v8"/>',
 in:'<path d="M17 7 7 17M15 17H7V9"/>',
 piggy:'<path d="M5 11.5c0-3.3 3-5.5 7-5.5 1.3 0 2.5.2 3.5.6L18 5v3.2c1 .8 1.6 1.8 1.9 2.8h1.6v3.5h-1.8c-.5 1-1.3 1.9-2.2 2.5v2.5h-3v-1.6c-.8.2-1.6.2-2.5.2s-1.7 0-2.5-.2v1.6h-3V17C5.9 15.8 5 14 5 11.5z"/><path d="M10 8.6c1-.3 2.2-.3 3.2 0M16 10.5h.01"/>'
};
const ICON_PICK=['cart','cup','bowl','glass','tram','car','fuel','bike','home','bolt','phone','health','dumbbell','bag','shirt','ticket','film','music','book','school','suitcase','play','gift','paw','baby','heart','wrench','leaf','sparkle','box','briefcase','coins','tag','star','piggy','back'];
const icon=(n,cls='')=>`<svg class="ci ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]||ICONS.tag}</svg>`;
const ico=(c,cls='')=>c&&c.i?icon(c.i,cls):(c&&c.e?`<span class="ci-emo">${ico(c)}</span>`:icon('tag',cls));
const pmIco=p=>icon((p&&p.i)||'card');
const EMOJI_TO_ICON={'🛒':'cart','🍜':'bowl','☕':'cup','🍺':'glass','🥐':'cup','🚇':'tram','🚗':'car','⛽':'fuel','🏠':'home','💡':'bolt','📱':'phone','💊':'health','🏋️':'dumbbell','💇':'sparkle','🛍️':'bag','👕':'shirt','🎮':'ticket','🎬':'film','📚':'book','✈️':'suitcase','🏖️':'suitcase','📺':'play','🎁':'gift','🐶':'paw','👶':'baby','🎓':'school','🔧':'wrench','📦':'box','💼':'briefcase','💶':'coins','⭐':'star','🏷️':'tag','↩️':'back'};
const shortDate=s=>{ if(s===TODAY) return "Aujourd'hui"; const d=parseD(s); return `${d.getDate()} ${MS[d.getMonth()]}`; };

/* ---------- Référentiels ---------- */
const DEFAULT_CATS=[
 {id:'courses',name:'Courses',i:'cart',c:'#2E9C74',k:'expense'},
 {id:'resto',name:'Restos & cafés',i:'cup',c:'#E07A4F',k:'expense'},
 {id:'transport',name:'Transport',i:'tram',c:'#3B82D6',k:'expense'},
 {id:'logement',name:'Logement',i:'home',c:'#6D5FD9',k:'expense'},
 {id:'factures',name:'Factures',i:'bolt',c:'#E0A43A',k:'expense'},
 {id:'sante',name:'Santé',i:'health',c:'#D65F8C',k:'expense'},
 {id:'shopping',name:'Shopping',i:'bag',c:'#1FA3A8',k:'expense'},
 {id:'loisirs',name:'Loisirs',i:'ticket',c:'#9A6BE0',k:'expense'},
 {id:'voyages',name:'Voyages',i:'suitcase',c:'#2BA3D9',k:'expense'},
 {id:'abos',name:'Abonnements',i:'play',c:'#B85CC7',k:'expense'},
 {id:'cadeaux',name:'Cadeaux',i:'gift',c:'#E0565B',k:'expense'},
 {id:'divers',name:'Divers',i:'box',c:'#8C8FA8',k:'expense',sys:true},
 {id:'salaire',name:'Salaire',i:'briefcase',c:'#2F9D62',k:'income'},
 {id:'rembt',name:'Remboursement',i:'back',c:'#5FB386',k:'income',sys:true},
 {id:'prime',name:'Prime',i:'star',c:'#E0A43A',k:'income'},
 {id:'vente',name:'Vente',i:'tag',c:'#1FA3A8',k:'income'},
 {id:'autre',name:'Autre revenu',i:'coins',c:'#8FA33A',k:'income',sys:true},
];
// Les catégories vivent dans S.cats (modifiables). CAT renvoie une catégorie de secours si un id n'existe plus.
const CAT_FALLBACK={id:'?',name:'Sans catégorie',i:'tag',c:'#8C8FA8',k:'expense'};
let CATS=DEFAULT_CATS, CAT={};
function syncCats(){ CATS=(S&&S.cats)||DEFAULT_CATS; const m=Object.fromEntries(CATS.map(c=>[c.id,c])); CAT=new Proxy(m,{get:(t,k)=>(k in t)?t[k]:(typeof k==='string'?CAT_FALLBACK:undefined)}); }
const CAT_COLORS=['#2E9C74','#E07A4F','#3B82D6','#6D5FD9','#E0A43A','#D65F8C','#1FA3A8','#9A6BE0','#2BA3D9','#B85CC7','#E0565B','#8C8FA8','#8FA33A','#D9843A'];
const EMOJIS_OLD=['🛒','🍜','☕','🍺','🥐','🚇','🚗','⛽','🏠','💡','📱','💊','🏋️','💇','🛍️','👕','🎮','🎬','📚','✈️','🏖️','📺','🎁','🐶','👶','🎓','🔧','📦','💼','💶','⭐','🏷️'];
const PMS=[{id:'cb',name:'Carte',i:'card'},{id:'esp',name:'Espèces',i:'cash'},{id:'vir',name:'Virement',i:'transfer'},{id:'prel',name:'Prélèvement',i:'bank'}];
const PM=Object.fromEntries(PMS.map(p=>[p.id,p]));
const TAG_COLORS=['#2BA3D9','#E0565B','#E0A43A','#2E9C74','#9A6BE0','#D65F8C'];

/* ---------- Données de démo ---------- */
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function buildDemo(){
  const st={ops:[],reimb:[],tags:[{id:'t1',name:'Vacances Italie',c:TAG_COLORS[0]},{id:'t2',name:'Anniv Léa',c:TAG_COLORS[1]}],
    budgets:{auto:true,global:150000,byCat:{courses:40000,resto:18000,transport:12000,logement:80000,factures:12000,loisirs:10000,shopping:12000,abos:3000}},
    recurring:[], checkins:[], pointages:[], v:5, cats:DEFAULT_CATS.map(c=>({...c})), settings:{calm:false,sound:false,haptics:true}, lastPm:'cb', demo:true};
  const t=parseD(TODAY); const start=new Date(t.getFullYear(),t.getMonth()-5,1); const S0=ymd(start);
  const R=(name,type,amt,cat,day,pm)=>st.recurring.push({id:uid(),name,type,amount:amt,cat,day,pm,start:S0,last:null});
  R('Salaire','income',245000,'salaire',1,'vir'); R('Navigo','expense',8640,'transport',2,'prel'); R('Loyer','expense',75000,'logement',5,'prel');
  R('Forfait mobile','expense',1999,'factures',8,'prel'); R('Netflix','expense',1349,'abos',12,'cb'); R('Électricité','expense',6200,'factures',15,'prel');
  R('Spotify','expense',1199,'abos',20,'cb'); R('Assurance habitation','expense',2450,'factures',25,'prel');
  const r=rng(7); const pick=a=>a[Math.floor(r()*a.length)];
  const add=(d,cat,euros,note,pm='cb',tags=[])=>st.ops.push({id:uid(),type:'expense',amount:Math.round(euros*100),date:ymd(d),ca:ymd(d),cat,pm,tags,note});
  for(let d=new Date(start); d<t; d.setDate(d.getDate()+1)){
    if(r()<.22) add(d,'courses',22+r()*68,pick(['Monoprix','Carrefour City','Marché','Picard','Biocoop']));
    if(r()<.3) add(d,'resto',3+r()*24,pick(['Café','Boulangerie','Déj boulot','Sushi','Pizza','Brunch']),r()<.2?'esp':'cb');
    if(r()<.07) add(d,'transport',7+r()*22,pick(['Uber','Vélib','Billet de train']));
    if(r()<.06) add(d,'loisirs',9+r()*35,pick(['Ciné','Bowling','Livre','Expo']));
    if(r()<.05) add(d,'shopping',18+r()*70,pick(['Vêtements','Fnac','Decathlon','Déco']));
    if(r()<.03) add(d,'sante',8+r()*28,pick(['Pharmacie','Médecin']));
    if(r()<.02) add(d,'divers',5+r()*25,pick(['Pressing','Cordonnier','Papeterie']));
  }
  // Vacances d'été taguées
  const vm=new Date(t.getFullYear(),t.getMonth()-3,12);
  if(vm>=start){ const v=n=>new Date(vm.getFullYear(),vm.getMonth(),vm.getDate()+n);
    add(v(0),'voyages',184,'Train Paris–Rome','cb',['t1']); add(v(0),'voyages',420,'Hôtel Trastevere','cb',['t1']);
    add(v(1),'resto',46.5,'Trattoria','cb',['t1']); add(v(2),'loisirs',32,'Musées du Vatican','cb',['t1']); add(v(3),'resto',38,'Pizzeria','esp',['t1']); add(v(4),'shopping',58,'Souvenirs','cb',['t1']); }
  const am=new Date(t.getFullYear(),t.getMonth()-2,18);
  if(am>=start){ add(am,'cadeaux',45,'Cadeau Léa','cb',['t2']); add(new Date(am.getFullYear(),am.getMonth(),am.getDate()+1),'resto',62,'Soirée anniversaire','cb',['t2']); }
  // Avances en attente
  const d3=new Date(t); d3.setDate(t.getDate()-2); const d9=new Date(t); d9.setDate(t.getDate()-8); const d4=new Date(t); d4.setDate(t.getDate()-3);
  const e1={id:uid(),type:'expense',amount:6400,date:ymd(d3),ca:ymd(d3),cat:'resto',pm:'cb',tags:[],note:'Resto avec Léa'};
  const r1={id:uid(),expenseId:e1.id,person:'Léa',due:3200,payments:[]}; e1.reimb=r1.id;
  const e2={id:uid(),type:'expense',amount:9000,date:ymd(d9),ca:ymd(d9),cat:'loisirs',pm:'cb',tags:[],note:'Places de concert'};
  const r2={id:uid(),expenseId:e2.id,person:'Tom',due:4500,payments:[]}; e2.reimb=r2.id;
  const p2={id:uid(),type:'income',amount:2000,date:ymd(d4),ca:ymd(d4),cat:'rembt',pm:'vir',tags:[],note:'Remboursement Tom',linkCat:'loisirs',reimbPay:r2.id};
  r2.payments.push({id:uid(),amount:2000,date:p2.date,opId:p2.id});
  st.ops.push(e1,e2,p2); st.reimb.push(r1,r2);
  genRecurring(st);
  addDemoGame(st);
  return st;
}
// Démo : journées pointées et pointages bancaires des mois passés
function addDemoGame(st){
  const r=rng(11), t=parseD(TODAY), dates=st.ops.map(o=>o.date).filter(d=>d<=TODAY).sort(); if(!dates.length) return;
  const manual=new Set(st.ops.filter(o=>o.ca).map(o=>o.ca)), recent=new Date(t); recent.setDate(t.getDate()-12);
  for(const d=parseD(dates[0]); d<t; d.setDate(d.getDate()+1)){ const k=ymd(d); if(manual.has(k)||st.checkins.includes(k)) continue; if(d>=recent||r()<.82) st.checkins.push(k); }
  const p0=parseD(dates[0]); p0.setDate(p0.getDate()-1); let bal=318540, prev=ymd(p0), i=0;
  st.pointages.push({id:uid(),date:prev,balance:bal,expected:null});
  for(let ym=ymOf(dates[0]); ym<CUR; ym=addMonths(ym,1), i++){ const[y,m]=ym.split('-').map(Number), end=ymd(new Date(y,m,0));
    const exp=bal+st.ops.filter(o=>!o.adj&&o.date>prev&&o.date<=end).reduce((a,o)=>a+(o.type==='income'?o.amount:-o.amount),0);
    const ecart=i===2?-2340:Math.round((r()-.5)*900); st.pointages.push({id:uid(),date:end,balance:exp+ecart,expected:exp}); bal=exp+ecart; prev=end; }
}
function occIn(r,y,m){ return new Date(y,m,Math.min(r.day,dim(y,m))); }
function genRecurring(st){
  const t=parseD(TODAY);
  for(const r of st.recurring){
    let base=r.last?parseD(r.last):parseD(r.start);
    let y=base.getFullYear(), m=base.getMonth();
    let d=occIn(r,y,m);
    if(r.last || d<parseD(r.start)){ m++; d=occIn(r,y,m); }
    while(d<=t && (!r.end || ymd(d)<=r.end)){
      st.ops.push({id:uid(),type:r.type,amount:r.amount,date:ymd(d),cat:r.cat,pm:r.pm,tags:[...(r.tags||[])],note:r.name,rec:r.id});
      r.last=ymd(d); m++; d=occIn(r,y,m);
    }
  }
}
function upcomingIn(ym){
  const[y,m]=ym.split('-').map(Number); const out=[];
  for(const r of S.recurring){ const d=ymd(occIn(r,y,m-1)); if(d>TODAY && d>=r.start && (!r.end||d<=r.end)) out.push({...r,date:d}); }
  return out;
}

/* ---------- État + sauvegarde automatique ---------- */
const KEY='pepetes-state', OLD_KEY='pepetes-proto-v1', APP_VERSION='2.0.0'; let S, firstRun=false, lastUndo=null;
const IOS=/iPhone|iPad|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const STANDALONE=navigator.standalone===true||(window.matchMedia&&matchMedia('(display-mode: standalone)').matches);
const IN_FRAME=(()=>{ try{ return window.top!==window; }catch(e){ return true; } })();
function migrate(st){ if((st.v||1)<2){ st.ops.forEach(o=>{ if(!o.rec&&!o.ca&&o.date<=TODAY) o.ca=o.date; }); st.checkins=st.checkins||[]; st.pointages=st.pointages||[];
  if(st.budgets.auto===undefined) st.budgets.auto=true; if(st.demo) addDemoGame(st); st.v=2; }
  if(st.v<3){ st.cats=st.cats||DEFAULT_CATS.map(c=>({...c})); st.v=3; }
  if(st.v<4){ const D=Object.fromEntries(DEFAULT_CATS.map(c=>[c.id,c.i])); (st.cats||[]).forEach(c=>{ if(!c.i){ c.i=D[c.id]||EMOJI_TO_ICON[c.e]||'tag'; } delete c.e; }); st.v=4; }
  if(st.v<5){ const M={"#6B8F71": "#2E9C74", "#B86B4B": "#E07A4F", "#5B7A99": "#3B82D6", "#8A7356": "#6D5FD9", "#B0914F": "#E0A43A", "#A86B7E": "#D65F8C", "#5E8C8A": "#1FA3A8", "#7A6C9A": "#9A6BE0", "#4F7F9E": "#2BA3D9", "#8E6A8F": "#B85CC7", "#A95B5B": "#E0565B", "#8A8680": "#8C8FA8", "#5F8A63": "#2F9D62", "#6E9A72": "#5FB386", "#7F8F5E": "#8FA33A", "#C07A3E": "#D9843A"}; (st.cats||[]).forEach(c=>{ const k=(c.c||'').toUpperCase(); if(M[k]) c.c=M[k]; }); (st.tags||[]).forEach(t=>{ const k=(t.c||'').toUpperCase(); if(M[k]) t.c=M[k]; }); st.v=5; } }
/* Stockage : IndexedDB (principal) + copie dans localStorage (secours). Chaque action est enregistrée aussitôt. */
const DB={db:null,
  open(){ return new Promise(res=>{ try{ const r=indexedDB.open('pepetes',1); r.onupgradeneeded=()=>r.result.createObjectStore('kv'); r.onsuccess=()=>{ this.db=r.result; res(true); }; r.onerror=()=>res(false); r.onblocked=()=>res(false); }catch(e){ res(false); } }); },
  get(k){ return new Promise(res=>{ if(!this.db) return res(undefined); try{ const q=this.db.transaction('kv','readonly').objectStore('kv').get(k); q.onsuccess=()=>res(q.result); q.onerror=()=>res(undefined); }catch(e){ res(undefined); } }); },
  set(k,v){ if(!this.db) return; try{ this.db.transaction('kv','readwrite').objectStore('kv').put(v,k); }catch(e){} }
};
function emptyState(settings){ return {ops:[],reimb:[],tags:[],budgets:{auto:true,global:150000,byCat:{}},recurring:[],checkins:[],pointages:[],v:5,cats:DEFAULT_CATS.map(c=>({...c})),settings:settings||{calm:false,sound:false},lastPm:'cb',demo:false}; }
async function load(){
  await Promise.race([DB.open(), new Promise(r=>setTimeout(()=>r(false),1500))]);
  let raw=await DB.get('state');
  if(!raw){ try{ raw=localStorage.getItem(KEY)||localStorage.getItem(OLD_KEY); }catch(e){} }
  if(raw){ try{ S=JSON.parse(raw); migrate(S); genRecurring(S); save(); return; }catch(e){} }
  firstRun=true; S=emptyState(); save();
}
let REV=0, mirrorT=0, mirrorJson=null;
function save(){ REV++; const json=JSON.stringify(S); DB.set('state',json);
  if(!DB.db){ try{ localStorage.setItem(KEY,json); }catch(e){} return; }   // sans IndexedDB, la copie locale est la seule : écrite tout de suite
  mirrorJson=json; if(!mirrorT) mirrorT=setTimeout(flushMirror,4000); }      // sinon la copie de secours est regroupée (au plus une écriture toutes les 4 s)
function flushMirror(){ clearTimeout(mirrorT); mirrorT=0; if(mirrorJson==null) return; try{ localStorage.setItem(KEY,mirrorJson); }catch(e){} mirrorJson=null; }
addEventListener('pagehide',flushMirror); document.addEventListener('visibilitychange',()=>{ if(document.hidden){ flushMirror(); Ambient.sleep(); } else Ambient.wake(); });
let MIDX=null;
function opsOfMonth(ym){ if(!MIDX||MIDX.rev!==REV||MIDX.ops!==S.ops||MIDX.n!==S.ops.length){ const m={}; for(const o of S.ops){ const k=o.date.slice(0,7); (m[k]||(m[k]=[])).push(o); } MIDX={rev:REV,ops:S.ops,n:S.ops.length,m}; } return MIDX.m[ym]||[]; }
const ui={tab:'home',ym:CUR,q:'',ftype:'all',ftag:null,calMode:'month',calSel:TODAY,statsN:6,opsView:'list'};
let lastLevel=null;

/* Toute modification passe ici : sauvegarde immédiate + toast « Annuler » */
function mutate(label,fn){ const snap=JSON.stringify(S), g0=computeGame(); fn(); lastUndo={label,snap}; save(); render(false); const g1=computeGame(), d=g1.total-g0.total;
  toast(d>0?`${label}, +${fmtN(d)} XP`:label,()=>{S=JSON.parse(snap); lastUndo=null; save(); render(false); toast('Action annulée');});
  if(d>0) floatXP(d); if(g1.level>g0.level) setTimeout(()=>levelUp(g1.level),350); }

/* ---------- Calculs ---------- */
/* Épargne du mois. Gagné = rentrées hors remboursements, dépensé = dépenses moins remboursements encaissés.
   Fin de mois estimée = épargne actuelle + revenus et frais mensuels encore à venir. Les mois « habituels »
   sont les 3 derniers mois complets suivis dans l'app (le premier mois, souvent partiel, est ignoré). */
function monthProj(ym){ const m=monthStats(ym); if(ym<CUR) return m.solde; let v=m.solde; for(const r of upcomingIn(ym)) v+=r.type==='income'?r.amount:-r.amount; return v; }
function firstYm(){ let f=null; for(const o of S.ops) if(!f||o.date<f) f=o.date; return f?ymOf(f):null; }
function usualMonths(ym,n=3){ const f=firstYm(), out=[]; if(!f) return out; for(let i=1;i<=24&&out.length<n;i++){ const k=addMonths(ym,-i); if(k<=f) break; if(opsOfMonth(k).length) out.push(k); } return out; }
function spentToDay(ym,day){ let v=0; for(const o of opsOfMonth(ym)){ if(o.rec||+o.date.slice(8)>day) continue; if(o.type==='expense') v+=o.amount; else if(o.linkCat) v-=o.amount; } return v; }
function paceVsUsual(){ const ms=usualMonths(CUR); if(!ms.length) return null; const d=+TODAY.slice(8), cur=spentToDay(CUR,d), avg=ms.reduce((a,k)=>a+spentToDay(k,d),0)/ms.length; return {cur,avg,diff:avg-cur}; }
function savedBonus(ym,solde){ if(solde<=0) return 0; const ms=usualMonths(ym); if(!ms.length) return 150; const avg=ms.reduce((a,k)=>a+monthStats(k).solde,0)/ms.length; return solde>avg?250:150; }
const signed=v=>`${v<0?'−':v>0?'+':''}${eur0(Math.abs(v))}`;
/* Revenus et frais mensuels prévus d'un mois */
function planIn(ym){ const[y,m]=ym.split('-').map(Number); let inc=0,fix=0;
  for(const r of S.recurring){ const d=ymd(occIn(r,y,m-1)); if(d<r.start||(r.end&&d>r.end)) continue; if(r.type==='income') inc+=r.amount; else fix+=r.amount; }
  return {inc,fix}; }
function monthStats(ym){
  let inc=0,exp=0,back=0,recExp=0,extraInc=0; const byCat={};
  for(const o of opsOfMonth(ym)){
    if(o.type==='expense'){exp+=o.amount; byCat[o.cat]=(byCat[o.cat]||0)+o.amount; if(o.rec) recExp+=o.amount;}
    else{inc+=o.amount; if(o.linkCat){back+=o.amount; byCat[o.linkCat]=(byCat[o.linkCat]||0)-o.amount;} else if(!o.rec) extraInc+=o.amount;}
  }
  const net=exp-back, plan=planIn(ym), auto=S.budgets.auto!==false;
  const budget=auto?Math.max(0,plan.inc-plan.fix):S.budgets.global, varNet=net-recExp;
  return {inc,exp,net,byCat,recExp,back,extraInc,gain:inc-back,solde:inc-exp,varNet,budget,reste:budget-varNet,incPlan:plan.inc,fixed:plan.fix,auto};
}

/* Progression : XP, séries avec joker hebdo, paliers. Tout est recalculé à partir des données, donc « Annuler » reste juste. */
const LEVELS=['Tirelire','Bas de laine','Bourse','Cassette','Coffret','Coffre','Coffre-fort','Lingot','Trésor','Fortune'];
const lvlMin=n=>400*n*(n-1);
const levelOf=xp=>{ let n=1; while(n<LEVELS.length&&xp>=lvlMin(n+1)) n++; return n; };
const fmtN=n=>Math.round(n).toLocaleString('fr-FR');
const weekKey=d=>{ const x=new Date(d); x.setDate(x.getDate()-((x.getDay()+6)%7)); return ymd(x); };
const TOL=1000; // écart toléré au pointage : 10 €
const XPZ=()=>({end:0,saisie:0,jours:0,series:0,epargne:0,budget:0,pointage:0,total:0,pointed:0,best:0});
let GMEMO=null;
function computeGame(){ if(GMEMO&&GMEMO.rev===REV&&GMEMO.s===S&&GMEMO.n===S.ops.length&&GMEMO.day===TODAY) return GMEMO.v; const v=computeGameRaw(); GMEMO={rev:REV,s:S,n:S.ops.length,day:TODAY,v}; return v; }
function computeGameRaw(){
  const months={}, M=ym=>months[ym]||(months[ym]=XPZ()), byCa={};
  for(const o of S.ops){ if(!o.ca||o.adj||o.ca>TODAY) continue; (byCa[o.ca]=byCa[o.ca]||[]).push(o); }
  for(const d in byCa) byCa[d].sort((a,b)=>(b.ca===b.date)-(a.ca===a.date)).slice(0,5).forEach(o=>{ M(ymOf(d)).saisie+=o.ca===o.date?3:1; });
  const P=new Set([...Object.keys(byCa),...(S.checkins||[])]), days=[...P].filter(d=>d<=TODAY).sort();
  let streak=0,best=0,joker=null; const dayState={};
  if(days.length){ const end=parseD(TODAY);
    for(const c=parseD(days[0]); c<=end; c.setDate(c.getDate()+1)){ const d=ymd(c), mm=M(ymOf(d));
      if(P.has(d)){ streak++; mm.jours+=5; mm.pointed++; if(streak%7===0) mm.series+=30; dayState[d]='p'; }
      else if(d===TODAY) dayState[d]='t';
      else if(streak>0&&joker!==weekKey(c)){ joker=weekKey(c); dayState[d]='j'; }
      else { streak=0; dayState[d]='x'; }
      best=Math.max(best,streak); mm.best=Math.max(mm.best,streak); mm.end=streak; } }
  const dates=S.ops.map(o=>o.date).filter(d=>d<=TODAY).sort();
  if(dates.length) for(let ym=ymOf(dates[0]); ym<CUR; ym=addMonths(ym,1)){ const st=monthStats(ym), mm=M(ym);
    if(st.solde>0) mm.epargne=Math.floor(st.solde/100)*2; mm.budget=savedBonus(ym,st.solde); }
  for(const p of S.pointages||[]) if(p.expected!=null&&Math.abs(p.balance-p.expected)<=TOL) M(ymOf(p.date)).pointage=50;
  let total=0; for(const k in months){ const m=months[k]; m.total=m.saisie+m.jours+m.series+m.epargne+m.budget+m.pointage; total+=m.total; }
  const ps=monthProj(CUR), proj={solde:ps, epargne:ps>0?Math.floor(ps/100)*2:0, budget:savedBonus(CUR,ps)};
  return {months,total,level:levelOf(total),streak,best,jokerFree:joker!==weekKey(parseD(TODAY)),dayState,pointedToday:P.has(TODAY),proj};
}
function floatXP(n){ if(reduce()) return; const f=document.createElement('div'); f.className='xpf'; f.textContent=`+${fmtN(n)} XP`; $('#app').appendChild(f); setTimeout(()=>f.remove(),1400); }
function levelUp(lv){ $('#lvlup')?.remove(); const b=document.createElement('div'); b.id='lvlup'; b.setAttribute('role','status');
  b.innerHTML=`<span class="lvl-coin sm">${lv}</span><span><small>Nouveau niveau</small><b>${LEVELS[lv-1]}</b></span>`; $('#app').appendChild(b); confetti(null); sound('register',false); setTimeout(()=>Haptic.play(3,true),380); setTimeout(()=>b.remove(),3400); }

const paid=r=>r.payments.reduce((a,p)=>a+p.amount,0);
const restDue=r=>r.due-paid(r);

/* ---------- Rendu ---------- */
const scr=$('#screen');
function render(anim=true){
  syncCats();
  $$('.tab').forEach(b=>b.classList.toggle('on',b.dataset.tab===ui.tab));
  scr.innerHTML = ui.tab==='home'?homeHTML() : ui.tab==='ops'?(ui.opsView==='cal'?calHTML():opsHTML()) : ui.tab==='prog'?progHTML() : statsHTML();
  if(anim){ scr.classList.remove('enter'); void scr.offsetWidth; scr.classList.add('enter'); }
  if(ui.tab==='home') mountHome();
  if(ui.tab==='ops'&&ui.opsView!=='cal') mountOps();
  if(ui.tab==='ops'&&ui.opsView==='cal') mountCal();
  if(ui.tab==='prog') mountProg();
  $('#tbt').textContent=(scr.querySelector('h1')?.textContent||'').trim(); $('#topbar').classList.toggle('on',scr.scrollTop>56);
  Ambient.wake(); Sensors.syncOri();
}
const gear=`<button class="icon-btn" data-act="settings" aria-label="Réglages"><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3.2"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.5l2.1 1.2M17.7 15.3l2.1 1.2M4.2 16.5l2.1-1.2M17.7 8.7l2.1-1.2"/></svg></button>`;
const monthNav=(eyebrow)=>`<button class="icon-btn" data-act="prev" aria-label="Mois précédent"><svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg></button>
  <div class="grow"><div class="eyebrow">${eyebrow}</div><h1>${monthLabel(ui.ym)}</h1></div>
  <button class="icon-btn" data-act="next" aria-label="Mois suivant"><svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg></button>`;

function wavePath(){ let d='M-140 0'; for(let x=-140;x<=280;x+=5){ d+=` L${x} ${(Math.sin(x/70*2*Math.PI)*4.5).toFixed(2)}`; } return d+' L280 200 L-140 200 Z'; }
const WAVE=wavePath();
function jarSVG(level){
  const top=46,bot=178, ly=bot-level*(bot-top);
  return `<svg viewBox="0 0 140 190" class="jar" role="img" aria-label="Bocal rempli à ${Math.round(level*100)} %">
  <defs><clipPath id="jc"><path d="M34 48 Q24 48 24 60 L24 160 Q24 177 41 177 L99 177 Q116 177 116 160 L116 60 Q116 48 106 48 Z"/></clipPath>
   <linearGradient id="jl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--liq);stop-opacity:.7"/><stop offset="1" style="stop-color:var(--liq)"/></linearGradient>
   <linearGradient id="jlid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD7AE"/><stop offset="1" stop-color="#EE9A4E"/></linearGradient></defs>
  <ellipse cx="70" cy="181" rx="44" ry="4" fill="var(--ink)" opacity=".08"/>
  <g clip-path="url(#jc)"><rect x="0" y="0" width="140" height="190" fill="var(--glass)"/>
    <g class="liq-tilt"><g class="liq" data-ly="${ly}" style="transform:translateY(${lastLevel==null?bot:bot-lastLevel*(bot-top)}px)">
      <path class="w2" d="${WAVE}" fill="var(--liq)" opacity=".35"/><path class="w1" d="${WAVE}" fill="url(#jl)"/>
      <circle cx="50" cy="38" r="2.6" fill="var(--shine)"/><circle cx="86" cy="66" r="2" fill="var(--shine)"/><circle cx="64" cy="96" r="2.3" fill="var(--shine)"/>
    </g></g></g>
  <path d="M34 48 Q24 48 24 60 L24 160 Q24 177 41 177 L99 177 Q116 177 116 160 L116 60 Q116 48 106 48" fill="none" stroke="var(--ink)" stroke-opacity=".8" stroke-width="2.6" stroke-linejoin="round"/>
  <path d="M35 70 Q32 112 36 150" stroke="var(--shine)" stroke-width="5" stroke-linecap="round" fill="none"/>
  <rect x="31" y="28" width="78" height="20" rx="6" fill="url(#jlid)" stroke="#D9803A" stroke-width="1.5"/>
  <path d="M39 33v10M47 33v10M55 33v10M63 33v10M71 33v10M79 33v10M87 33v10M95 33v10M103 33v10" stroke="#8A4A12" stroke-opacity=".3" stroke-width="1.4" stroke-linecap="round"/>
</svg>`;
}
function plantSVG(stage){
  const dead=stage<0;
  const h=dead?30:[6,16,28,38,46][stage];
  const leaf=dead?'var(--ink-2)':'var(--mint)';
  let leaves='';
  const L=(y,side,s)=>`<path d="M50 ${y} q${side*14*s} ${-10*s} ${side*22*s} ${-2*s} q${-side*10*s} ${10*s} ${-side*22*s} ${2*s}Z" fill="${leaf}" ${dead?'opacity=".6"':''}/>`;
  if(stage>=1||dead) leaves+=L(80-h*.35,-1,dead?.8:1);
  if(stage>=2||dead) leaves+=L(80-h*.6,1,dead?.7:1);
  if(stage>=3) leaves+=L(80-h*.82,-1,.8);
  const stem=dead?`<path d="M50 80 Q50 ${80-h} ${62} ${80-h+12}" stroke="${leaf}" stroke-width="3.5" fill="none" stroke-linecap="round"/>`
    :`<path d="M50 80 L50 ${80-h}" stroke="var(--mint)" stroke-width="3.5" stroke-linecap="round"/>`;
  let flower='';
  if(stage===4){ const cy=80-h; for(let i=0;i<6;i++){const a=i*Math.PI/3; flower+=`<circle cx="${50+Math.cos(a)*7}" cy="${cy+Math.sin(a)*7}" r="5.5" fill="var(--coral)"/>`;} flower+=`<circle cx="50" cy="${cy}" r="5" fill="var(--sun)"/>`; }
  if(stage===0) flower=`<ellipse cx="50" cy="76" rx="4" ry="3" fill="var(--sun-edge)"/>`;
  return `<svg viewBox="0 0 100 110" class="plant" aria-hidden="true"><g class="${dead?'':'sway'}">${stem}${leaves}${flower}</g>
    <path d="M30 82 H70 L65 106 Q64 108 61 108 H39 Q36 108 35 106 Z" fill="var(--accent)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/>
    <rect x="27" y="78" width="46" height="9" rx="4" fill="var(--accent)" stroke="var(--ink)" stroke-width="3"/></svg>`;
}
function plantStage(m){ if(m.solde<0) return -1; if(m.inc<=0) return 0; const r=m.solde/m.inc; return r<.05?1:r<.15?2:r<.25?3:4; }
const STAGE_TXT={'-1':'Fanée','0':'Graine','1':'Pousse','2':'Jeune plante','3':'Belle plante','4':'En fleur'};

const ICO_L='<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>', ICO_R='<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>';
function levelBtn(g){ const lv=g.level, lo=lvlMin(lv), hi=lv<LEVELS.length?lvlMin(lv+1):null, p=hi?(g.total-lo)/(hi-lo):1, C=2*Math.PI*18;
  return `<button class="lvl-btn" data-act="goprog" aria-label="Niveau ${lv}, ${LEVELS[lv-1]}"><svg viewBox="0 0 40 40"><circle cx="20" cy="20" r="18" class="trk"/><circle cx="20" cy="20" r="18" class="prg" stroke-dasharray="${(clamp(p,0,1)*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 20 20)"/></svg><span class="lvl-coin xs">${lv}</span></button>`; }
const secHead=(t,act,lbl)=>`<div class="sh2"><h2>${t}</h2>${act?`<button class="link" data-act="${act}">${lbl}</button>`:''}</div>`;
const pageHead=(t,sub,right='')=>`<header class="lt"><div class="lt-row"><h1>${t}</h1><div class="lt-act">${right}</div></div>${sub?`<div class="lt-sub">${sub}</div>`:''}</header>`;
const moneyBig=(c,plus)=>`${c<0?'−':plus&&c>0?'+':''}${Math.round(Math.abs(c)/100).toLocaleString('fr-FR')}<span class="cur">€</span>`;
const todoRow=t=>{ const tag=t.act?'button':'div'; return `<${tag} class="todo-row" ${t.act?`data-act="${t.act}"`:''} ${t.ym?`data-ym="${t.ym}"`:''}><span class="todo-ic">${icon(t.ic)}</span><span class="todo-tx"><b>${t.t}</b><small>${t.s}</small></span>${t.btn?`<span class="todo-btn">${t.btn}</span>`:t.act?CHEV:''}</${tag}>`; };
const backupDue=()=>!S.demo&&S.ops.filter(o=>o.ca).length>=15&&daysSince(S.settings.lastExport)>=30;
let lastHero=null;
function tweenMoney(el,from,to){ const pl=el.dataset.plus==='1'; if(reduce()||from===to){ el.innerHTML=moneyBig(to,pl); return; } const t0=performance.now(), D=700;
  const step=t=>{ if(!el.isConnected) return; const k=Math.min(1,(t-t0)/D), e=1-Math.pow(1-k,4); el.innerHTML=moneyBig(Math.round(from+(to-from)*e),pl); if(k<1) requestAnimationFrame(step); }; requestAnimationFrame(step); }
function homeHTML(){
  const m=monthStats(ui.ym), g=computeGame(), [y,mo]=ui.ym.split('-').map(Number), isCur=ui.ym===CUR, nd=dim(y,mo-1), td=parseD(TODAY).getDate();
  const fut=ui.ym>CUR, io=m.inc+m.exp>0, pl=fut?planIn(ui.ym):null, proj=ui.ym>=CUR?monthProj(ui.ym):m.solde;
  const state=!io&&!fut?'none':(fut?proj:m.solde)<0?'over':'ok', heroVal=fut?proj:m.solde;
  const spentP=fut?(pl.inc?clamp(pl.fix/pl.inc,0,1):0):m.gain>0?clamp(m.net/m.gain,0,1):(m.net>0?1:0), level=io||fut?1-spentP:0;
  const allInc=S.ops.reduce((a,o)=>a+(o.type==='income'&&!o.linkCat?o.amount:0),0), all=S.ops.reduce((a,o)=>a+(o.type==='income'?o.amount:-o.amount),0);
  const st=plantStage({solde:all,inc:allInc}), daysLeft=isCur?nd-td+1:0;
  let pace='',paceCls='';
  if(isCur&&io){ const pv=paceVsUsual(); if(pv){ const thr=Math.max(1000,pv.avg*.05);
    if(pv.diff>thr){ pace=`${eur0(pv.diff)} dépensés de moins que d'habitude à cette date`; paceCls='good'; }
    else if(pv.diff<-thr){ pace=`${eur0(-pv.diff)} dépensés de plus que d'habitude à cette date`; paceCls='warn'; }
    else { pace="Tu dépenses comme d'habitude"; paceCls='good'; } } }
  else if(ui.ym<CUR&&io){ const ms=usualMonths(ui.ym); if(ms.length){ const d=m.solde-ms.reduce((a,k)=>a+monthStats(k).solde,0)/ms.length;
    if(Math.abs(d)<1000){ pace="Épargne habituelle"; paceCls='good'; } else { pace=`${eur0(Math.abs(d))} épargnés de ${d>0?'plus':'moins'} que d'habitude`; paceCls=d>0?'good':'warn'; } } }
  const mo0=MONTHS[mo-1], lbl=isCur?'Épargné ce mois-ci':fut?`Épargne prévue en ${mo0}`:`Épargné en ${mo0}`;
  const dayTx=isCur?(io?`Fin de mois estimée : <b>${signed(proj)}</b>`:'Note une dépense ou un revenu avec +'):fut?'Avec tes revenus et frais mensuels prévus':
    m.gain>0?(m.solde>=0?`soit <b>${Math.round(m.solde/m.gain*100)} %</b> de tes rentrées`:'Les dépenses ont dépassé les rentrées'):(io?'':'Aucune opération ce mois-là');
  const sub=isCur?(daysLeft===1?'Dernier jour du mois':`Encore ${daysLeft} jours`):(ui.ym<CUR?'Mois terminé':'Mois à venir');
  const yr=y!==parseD(TODAY).getFullYear()?` <span class="yr">${y}</span>`:'';
  const prev=addMonths(CUR,-1), showBilan=S.seenBilan!==prev&&S.ops.some(o=>ymOf(o.date)===prev);
  const todos=[];
  if(IOS&&!STANDALONE&&!IN_FRAME) todos.push({ic:'share',t:'Installe Pépètes',s:"Partager, puis « Sur l'écran d'accueil ». Tes données vivront dans l'app."});
  if(isCur&&!g.pointedToday) todos.push({ic:'check',t:'Pointe ta journée',s:"Rien dépensé aujourd'hui ? Un tap suffit.",act:'checkin',btn:'+5 XP'});
  if(isCur&&showBilan) todos.push({ic:'chart',t:`Ton bilan ${deMois(prev)}`,s:'Épargne, catégories et XP du mois.',act:'bilan',ym:prev});
  if(isCur&&backupDue()) todos.push({ic:'download',t:'Sauvegarde tes données',s:S.settings.lastExport?`Dernière sauvegarde il y a ${daysSince(S.settings.lastExport)} jours.`:"Aucune sauvegarde pour l'instant.",act:'backup'});
  if(S.demo) todos.push({ic:'info',t:'Données de démo',s:'Efface-les dans les réglages pour démarrer.',act:'settings'});
  const cats=Object.entries(m.byCat).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]), maxV=cats.length?cats[0][1]:1;
  const bub=cats.slice(0,9).map(([id,v])=>{ const c=CAT[id], b=S.budgets.byCat[id], p=b?clamp(v/b*100,0,100):100, sz=Math.round(52+32*Math.sqrt(v/maxV));
    return `<button class="hb ${b&&v>b?'over':''} ${b?'has-b':''}" data-act="cat" data-id="${id}" style="--s:${sz}px;--c:${c.c};--p:${p}" aria-label="${esc(c.name)} : ${eur(v)}${b?' sur '+eur(b):''}"><span class="ring"></span><span class="core">${ico(c)}<span class="am">${eur0(v)}</span></span></button>`; }).join('');
  const pend=S.reimb.filter(r=>restDue(r)>0);
  const pendHTML=pend.map(r=>{const e=S.ops.find(o=>o.id===r.expenseId); const pct=Math.round(paid(r)/r.due*100);
    return `<div class="pend" data-rid="${r.id}" role="button" tabindex="0" aria-label="${esc(r.person)} te doit ${eur(restDue(r))}. Touche pour le détail, maintiens pour encaisser.">
      <div class="who">${esc(r.person)} te doit</div><div class="due">${eur(restDue(r))}</div>
      <div class="meta">${e?esc(e.note||CAT[e.cat].name)+', '+shortDate(e.date).toLowerCase():''}${paid(r)?`. Déjà ${eur(paid(r))} reçus`:''}</div>
      ${paid(r)?`<div class="bar"><span style="width:${pct}%"></span></div>`:''}
      <div class="pull"><i></i>Maintiens pour encaisser</div></div>`}).join('');
  const ups=isCur?upcomingIn(CUR).sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0).slice(0,3):[];
  const recent=S.ops.filter(o=>ymOf(o.date)===ui.ym).sort(sortOps).slice(0,5);
  return `<header class="lt"><div class="lt-row">
      <div class="mswitch"><button class="mbtn" data-act="prev" aria-label="Mois précédent">${ICO_L}</button><h1>${cap(MONTHS[mo-1])}${yr}</h1><button class="mbtn" data-act="next" aria-label="Mois suivant">${ICO_R}</button></div>
      <div class="lt-act">${levelBtn(g)}${gear}</div></div>
    <div class="lt-sub">${sub}</div></header>
  <section class="hero ${state}">
    <div class="hero-tx">
      <div class="hero-lbl">${lbl}</div>
      <div class="hero-amt num" id="heroAmt" data-v="${heroVal}" data-plus="1">${moneyBig(heroVal,true)}</div>
      <div class="hero-day">${dayTx}</div>
    </div>
    <button class="hero-jar" data-act="slosh" aria-label="Bocal du mois, touche pour le secouer">${jarSVG(level)}</button>
    <div class="hero-meter" role="img" aria-label="${Math.round(spentP*100)} % des rentrées dépensées"><span class="fill" style="width:${(spentP*100).toFixed(1)}%"></span></div>
    <div class="hero-io">
      ${fut?`<div><span>Revenus prévus</span><b class="num">+${eur0(pl.inc)}</b></div><div><span>Frais mensuels</span><b class="num neg">−${eur0(pl.fix)}</b></div>`
      :`<div><span>Gagné</span><b class="num">+${eur0(m.gain)}</b>${m.extraInc?`<small>dont ${eur0(m.extraInc)} imprévus</small>`:''}</div>
      <div><span>Dépensé</span><b class="num neg">${signed(-m.net)}</b>${m.recExp?`<small>dont ${eur0(m.recExp)} de frais mensuels</small>`:''}</div>`}
    </div>
    <div class="hero-foot"><span class="pace ${paceCls}">${pace}</span><button class="link" data-act="budinfo">Détail</button></div>
  </section>
  <div class="tiles two">
    <button class="tile" data-act="plant"><span class="tile-pic">${plantSVG(st)}</span><span class="tile-l">Épargne totale</span><span class="tile-v ${all<0?'neg':''}">${signed(all)}</span></button>
    <button class="tile" data-act="goprog"><span class="tile-pic ic gold">${icon('flame')}</span><span class="tile-l">Série</span><span class="tile-v">${g.streak} j</span></button>
  </div>
  ${todos.length?secHead('À faire')+`<div class="list todo">${todos.map(todoRow).join('')}</div>`:''}
  ${pend.length?secHead('À encaisser')+`<div class="float-row">${pendHTML}</div>`:''}
  ${secHead('Où part ton argent',cats.length?'gostats':'',cats.length?'Stats':'')}
  ${cats.length?`<div class="bubbles">${bub}</div>`:'<div class="list"><div class="empty">Aucune dépense ce mois-ci. Touche + pour en ajouter une.</div></div>'}
  ${isCur&&S.recurring.some(r=>!r.end)?secHead('À venir','recs','Frais mensuels')+`<div class="list">${ups.length?ups.map(r=>{ const c=CAT[r.cat]; return `<button class="op-fg planned" data-act="rec" data-id="${r.id}"><span class="op-ic" style="--c:${c.c}">${ico(c)}</span><span class="op-main"><span class="op-t">${esc(r.name)}</span><span class="op-s">${cap(dayLabel(r.date))}</span></span><span class="op-amt ${r.type==='income'?'pos':''}">${sgn(r.amount,r.type)}</span></button>`; }).join(''):'<div class="empty">Plus rien de prévu ce mois-ci.</div>'}</div>`:''}
  ${secHead('Dernières opérations',recent.length?'goops':'','Tout voir')}
  <div class="list">${recent.length?recent.map(o=>opRow(o,false)).join(''):'<div class="empty">Rien pour l\'instant.</div>'}</div>`;
}
function openBudgetInfo(){ const m=monthStats(ui.ym), fut=ui.ym>CUR, ups=ui.ym>=CUR?upcomingIn(ui.ym):[];
  const upI=ups.filter(r=>r.type==='income').reduce((a,r)=>a+r.amount,0), upE=ups.filter(r=>r.type!=='income').reduce((a,r)=>a+r.amount,0);
  const row=(l,v,cls='')=>`<div class="xrow ${cls}"><span>${l}</span><b class="${v<0?'neg':''}">${v<0?'−':v>0?'+':''}${eur(Math.abs(v))}</b></div>`;
  openSheet(`<div class="sh-h"><span class="op-ic rec-ic">${icon('coins')}</span><div><h3>Ton mois ${deMois(ui.ym)}</h3><div class="sub">${ui.ym<CUR?'Mois terminé':fut?'Prévisions':"Jusqu'à aujourd'hui"}</div></div></div>
   ${fut?'':`<div class="card"><div class="xrows" style="margin:0">
     ${row('Revenus mensuels',m.gain-m.extraInc)}${row('Rentrées imprévues',m.extraInc)}${row('Gagné',m.gain,'tot')}
     <div style="height:8px"></div>${row('Frais mensuels',-m.recExp)}${row('Dépenses courantes',-(m.net-m.recExp))}${row('Dépensé',-m.net,'tot')}
     <div style="height:8px"></div>${row('Épargné',m.solde,'tot')}</div></div>`}
   ${ups.length?`<div class="card"><div class="xrows" style="margin:0">${upI?row('Revenus mensuels à venir',upI):''}${upE?row('Frais mensuels à venir',-upE):''}${row('Fin de mois estimée',monthProj(ui.ym),'tot')}</div></div>`:''}
   <div class="sub" style="padding:0 4px">Un remboursement encaissé réduit la dépense d'origine au lieu de compter comme un gain.</div>
   <div class="stack"><button class="btn" data-bi="recs">Gérer les frais mensuels</button><button class="btn" data-bi="stats">Voir les stats</button></div>`,
   sh=>sh.addEventListener('click',ev=>{ const b=ev.target.closest('[data-bi]'); if(!b) return; if(b.dataset.bi==='recs') openRecList(); else { closeSheet(true); $('nav [data-tab="stats"]')?.click(); } }));
}
function mountHome(){
  const liq=$('.liq');
  if(liq){ const ly=+liq.dataset.ly; requestAnimationFrame(()=>requestAnimationFrame(()=>{liq.style.transform=`translateY(${ly}px)`;})); lastLevel=(178-ly)/(178-46); }
  const ha=$('#heroAmt'); if(ha&&ha.dataset.v){ const v=+ha.dataset.v; if(ha.textContent!=='—') tweenMoney(ha,lastHero==null?Math.round(v*.6):lastHero,v); lastHero=v; }
  $$('.pend').forEach(bindPend);
}
const sortOps=(a,b)=>a.date<b.date?1:a.date>b.date?-1:0;

function opRow(o,swipe=true){
  const c=CAT[o.cat]||CAT.divers; const pm=PM[o.pm];
  const tags=(o.tags||[]).map(t=>S.tags.find(x=>x.id===t)).filter(Boolean).map(t=>'#'+t.name).join(' ');
  const r=o.reimb&&S.reimb.find(x=>x.id===o.reimb);
  const sub=[c.name,pm?pm.name.toLowerCase():'',tags].filter(Boolean).join(', ');
  return `<div class="op" data-id="${o.id}">${swipe?'<div class="op-bg"><span>Dupliquer</span><span>Supprimer</span></div>':''}
   <div class="op-fg" data-act="edit" data-id="${o.id}">
    <span class="op-ic" style="--c:${c.c}">${ico(c)}</span>
    <span class="op-main"><span class="op-t">${esc(o.note||c.name)}${o.rec?'<span class="badge" title="Récurrent">↻</span>':''}${r&&restDue(r)>0?`<span class="badge r">${esc(r.person)} doit ${eur0(restDue(r))}</span>`:''}</span><span class="op-s">${esc(sub)}</span></span>
    <span class="op-amt ${o.type==='income'?'pos':''}">${sgn(o.amount,o.type)}</span>
   </div></div>`;
}

function filteredOps(){
  const q=ui.q.trim().toLowerCase();
  return opsOfMonth(ui.ym).filter(o=>(ui.ftype==='all'||o.type===ui.ftype) && (!ui.ftag||(o.tags||[]).includes(ui.ftag)) &&
    (!q || [o.note, CAT[o.cat]?.name, PM[o.pm]?.name, ...(o.tags||[]).map(t=>S.tags.find(x=>x.id===t)?.name), o.reimb&&S.reimb.find(r=>r.id===o.reimb)?.person].join(' ').toLowerCase().includes(q))).sort(sortOps);
}
const monthPill=(label=cap(monthLabel(ui.ym)),prev='prev',next='next')=>`<div class="mpill"><button class="mbtn" data-act="${prev}" aria-label="Précédent">${ICO_L}</button><span class="num">${label}</span><button class="mbtn" data-act="${next}" aria-label="Suivant">${ICO_R}</button></div>`;
const viewHead=(t,right='',pill=monthPill())=>`<header class="lt"><div class="lt-row"><h1>${t}</h1><div class="lt-act">${right}</div></div>${pill}</header>`;
const ICO_YEAR='<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/></svg>';
const ICO_MONTH='<svg viewBox="0 0 24 24"><rect x="3.5" y="5" width="17" height="15" rx="3"/><path d="M3.5 10h17"/></svg>';
function opsHTML(){
  return `${viewHead('Opérations')}
  ${viewSeg()}
  <label class="search"><svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/></svg><input id="q" type="search" placeholder="Rechercher une opération" value="${esc(ui.q)}" autocomplete="off"></label>
  <div class="chips" role="group" aria-label="Filtres">
    ${[['all','Tout'],['expense','Dépenses'],['income','Revenus']].map(([v,l])=>`<button class="chip ${ui.ftype===v?'on':''}" data-act="ftype" data-v="${v}">${l}</button>`).join('')}
    ${S.tags.map(t=>`<button class="chip ${ui.ftag===t.id?'on':''}" data-act="ftag" data-v="${t.id}" style="--c:${t.c}"><span class="dot"></span>${esc(t.name)}</button>`).join('')}
  </div>
  <div id="opsList">${opsListHTML()}</div>
  <div class="hint">Glisse une ligne vers la gauche pour supprimer, vers la droite pour dupliquer.</div>`;
}
function opsListHTML(){
  const list=filteredOps(); if(!list.length) return `<div class="empty">${ui.q||ui.ftype!=='all'||ui.ftag?'Aucune opération ne correspond.':'Aucune opération ce mois-ci. Touche + pour en ajouter une.'}</div>`;
  const inc=list.filter(o=>o.type==='income').reduce((a,o)=>a+o.amount,0), exp=list.filter(o=>o.type==='expense').reduce((a,o)=>a+o.amount,0);
  const bal=inc-exp; let html=`<div class="sumcard"><div><span>Dépensé</span><b class="num">−${eur0(exp)}</b></div><div><span>Reçu</span><b class="num pos">+${eur0(inc)}</b></div><div><span>Solde</span><b class="num ${bal>=0?'pos':'neg'}">${bal>=0?'+':'−'}${eur0(Math.abs(bal))}</b></div></div>`;
  let cur=null;
  for(const o of list){ if(o.date!==cur){ if(cur) html+='</div>'; cur=o.date; const dt=list.filter(x=>x.date===cur).reduce((a,x)=>a+(x.type==='expense'?-x.amount:x.amount),0);
      html+=`<div class="day-h"><span>${cap(dayLabel(cur))}</span><span class="num">${dt>=0?'+':'−'}${eur(Math.abs(dt))}</span></div><div class="list">`; }
    html+=opRow(o,true); }
  return html+'</div>';
}
function mountOps(){
  const q=$('#q'); q.addEventListener('input',()=>{ui.q=q.value; $('#opsList').innerHTML=opsListHTML(); bindSwipes();});
  bindSwipes();
}

/* Calendrier */
function calHTML(){
  if(ui.calMode==='year') return yearHTML();
  const[y,m]=ui.ym.split('-').map(Number); const first=new Date(y,m-1,1); const off=(first.getDay()+6)%7; const n=dim(y,m-1);
  const ex={},inc={}; for(const o of S.ops){ if(ymOf(o.date)!==ui.ym) continue; (o.type==='expense'?ex:inc)[o.date]=((o.type==='expense'?ex:inc)[o.date]||0)+o.amount; }
  const up={}; upcomingIn(ui.ym).forEach(r=>{(up[r.date]=up[r.date]||[]).push(r)});
  const max=Math.max(1,...Object.values(ex));
  let cells=''; for(let i=0;i<off;i++) cells+='<div class="dc blank"></div>';
  for(let d=1;d<=n;d++){ const ds=`${ui.ym}-${pad(d)}`; const v=ex[ds]||0; const lvl=v?Math.ceil(v/max*5):0; const pct=[0,16,32,50,70,88][lvl];
    cells+=`<button class="dc ${ds===TODAY?'today':''} ${ds===ui.calSel?'sel':''} ${lvl>=4?'hot':''}" data-act="day" data-d="${ds}" style="${lvl?`background:color-mix(in srgb, var(--coral) ${pct}%, var(--surface))`:''}" aria-label="${dayLabel(ds)}${v?', '+eur(v)+' dépensés':''}${inc[ds]?', revenu':''}${up[ds]?', prélèvement prévu':''}">
      ${d}<span class="marks">${inc[ds]?'<span class="mi"></span>':''}${up[ds]?'<span class="mu"></span>':''}</span></button>`; }
  const sel=ui.calSel&&ymOf(ui.calSel)===ui.ym?ui.calSel:null;
  let det='';
  if(sel){ const ops=S.ops.filter(o=>o.date===sel); const ups=up[sel]||[];
    det=`${secHead(cap(dayLabel(sel)))}<div class="list">
      ${ops.map(o=>opRow(o,false)).join('')}
      ${ups.map(r=>{const c=CAT[r.cat]; return `<div class="op"><div class="op-fg planned" data-act="rec" data-id="${r.id}"><span class="op-ic" style="--c:${c.c}">${ico(c)}</span><span class="op-main"><span class="op-t">${esc(r.name)}<span class="badge">prévu</span></span><span class="op-s">${c.name}, ${PM[r.pm].name.toLowerCase()}</span></span><span class="op-amt ${r.type==='income'?'pos':''}">${sgn(r.amount,r.type)}</span></div></div>`}).join('')}
      ${!ops.length&&!ups.length?'<div class="empty">Rien ce jour-là.</div>':''}</div>`; }
  return `${viewHead('Opérations',`<button class="icon-btn" data-act="year" aria-label="Vue année">${ICO_YEAR}</button>`)}
  ${viewSeg()}
  <section class="card cal-wrap cal-month" id="calw"><div class="dow">${['L','M','M','J','V','S','D'].map(x=>`<span>${x}</span>`).join('')}</div><div class="grid">${cells}</div>
  <div class="legend"><span class="heat">Moins ${[16,32,50,70,88].map(p=>`<i style="background:color-mix(in srgb, var(--coral) ${p}%, var(--surface-2))"></i>`).join('')} Plus</span><span><span class="mi"></span>Revenu</span><span><span class="mu"></span>Prélèvement prévu</span></div></section>
  <div class="hint">Pince l'écran pour voir l'année entière.</div>${det}`;
}
function yearHTML(){
  const y=+ui.ym.slice(0,4); const ex={}; for(const o of S.ops) if(o.type==='expense'&&o.date.startsWith(y+'-')) ex[o.date]=(ex[o.date]||0)+o.amount;
  const max=Math.max(1,...Object.values(ex));
  let html='';
  for(let m=0;m<12;m++){ const ym=`${y}-${pad(m+1)}`; const off=(new Date(y,m,1).getDay()+6)%7; let g=''; for(let i=0;i<off;i++) g+='<i></i>';
    let tot=0; for(let d=1;d<=dim(y,m);d++){ const v=ex[`${ym}-${pad(d)}`]||0; tot+=v; const lvl=v?Math.ceil(v/max*5):0; g+=`<i style="background:${lvl?`color-mix(in srgb, var(--coral) ${[0,20,38,56,74,92][lvl]}%, var(--surface-2))`:'var(--surface-2)'}"></i>`; }
    html+=`<button class="ym ${ym===CUR?'cur':''}" data-act="pickm" data-ym="${ym}"><span class="n">${MONTHS[m]}</span><span class="g">${g}</span><span class="t">${tot?eur0(tot):'—'}</span></button>`; }
  return `${viewHead('Opérations',`<button class="icon-btn" data-act="month" aria-label="Vue mois">${ICO_MONTH}</button>`,monthPill(String(y),'yprev','ynext'))}
   ${viewSeg()}<div class="year cal-wrap zin" id="calw">${html}</div><div class="hint">Touche un mois ou écarte deux doigts pour revenir au détail.</div>`;
}
function mountCal(){
  const w=$('#calw'); if(!w) return; const pts=new Map(); let d0=0;
  w.addEventListener('pointerdown',e=>{pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size===2){const[a,b]=[...pts.values()]; d0=Math.hypot(a[0]-b[0],a[1]-b[1]);}});
  w.addEventListener('pointermove',e=>{ if(!pts.has(e.pointerId)) return; pts.set(e.pointerId,[e.clientX,e.clientY]); if(pts.size!==2||!d0) return;
    const[a,b]=[...pts.values()]; const d=Math.hypot(a[0]-b[0],a[1]-b[1]);
    if(ui.calMode==='month'&&d<d0*.7){ui.calMode='year';d0=0;pts.clear();render(false);}
    else if(ui.calMode==='year'&&d>d0*1.35){ui.calMode='month';d0=0;pts.clear();render(false);$('#calw')?.classList.add('zin');} });
  const end=e=>{pts.delete(e.pointerId); if(pts.size<2) d0=0;};
  w.addEventListener('pointerup',end); w.addEventListener('pointercancel',end);
  // Pincement natif d'iOS
  w.addEventListener('gesturestart',e=>e.preventDefault());
  w.addEventListener('gestureend',e=>{ e.preventDefault(); if(e.scale<.8&&ui.calMode==='month'){ui.calMode='year';render(false);} else if(e.scale>1.25&&ui.calMode==='year'){ui.calMode='month';render(false);} });
}

/* Stats */
function niceMax(v){ if(v<=0) return 100; const p=Math.pow(10,Math.floor(Math.log10(v))); const n=v/p; return (n<=1?1:n<=2?2:n<=2.5?2.5:n<=5?5:10)*p; }
function statsHTML(){
  const m=monthStats(ui.ym), mName=MONTHS[+ui.ym.slice(5)-1];
  const cats=Object.entries(m.byCat).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]);
  const tot=cats.reduce((a,[,v])=>a+v,0), top=cats.slice(0,8), rest=cats.slice(8).reduce((a,[,v])=>a+v,0), maxV=cats.length?cats[0][1]:1;
  const Rd=54, C=2*Math.PI*Rd; let acc=0;
  const segs=cats.map(([id,v])=>{ const len=v/tot*C, g=Math.min(2.5,len/3); const s=`<circle r="${Rd}" cx="70" cy="70" fill="none" stroke="${CAT[id].c}" stroke-width="16" stroke-dasharray="${Math.max(.1,len-g).toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-acc).toFixed(2)}" transform="rotate(-90 70 70)"/>`; acc+=len; return s; }).join('');
  const N=ui.statsN, months=[]; for(let i=N-1;i>=0;i--) months.push(addMonths(ui.ym,-i));
  const data=months.map(ym=>{ const st=monthStats(ym); return {ym,inc:st.inc,exp:st.exp,sav:st.solde}; });
  const mx=niceMax(Math.max(1,...data.map(d=>Math.max(d.inc,d.exp)))/100)*100;
  const X0=34,X1=334,Y0=10,Y1=148,gw=(X1-X0)/N,bw=Math.min(14,gw*.3), yS=v=>Y1-(v/mx)*(Y1-Y0);
  let bars=''; [0,.5,1].forEach(f=>{ const y=yS(mx*f); bars+=`<line class="gl" x1="${X0}" x2="${X1}" y1="${y}" y2="${y}"/><text x="${X0-6}" y="${y+3}" text-anchor="end">${fmtN(mx*f/100)}</text>`; });
  data.forEach((d,i)=>{ const cx=X0+gw*i+gw/2, mi=+d.ym.slice(5)-1, cur=d.ym===ui.ym;
    bars+=`<g ${cur?'':'opacity=".62"'}><rect x="${cx-bw-1.5}" y="${yS(d.inc)}" width="${bw}" height="${Math.max(0,Y1-yS(d.inc))}" rx="3.5" fill="var(--mint)"><title>Revenus ${MS[mi]} : ${eur0(d.inc)}</title></rect>
     <rect x="${cx+1.5}" y="${yS(d.exp)}" width="${bw}" height="${Math.max(0,Y1-yS(d.exp))}" rx="3.5" fill="var(--coral)"><title>Dépenses ${MS[mi]} : ${eur0(d.exp)}</title></rect></g>
     <text x="${cx}" y="${Y1+15}" text-anchor="middle" class="${cur?'cur':''}">${N>6?MS[mi].slice(0,3):MS[mi]}</text>
     <text x="${cx}" y="${Y1+29}" text-anchor="middle" class="sav ${d.sav>=0?'p':'n'}">${d.sav>=0?'+':'−'}${fmtN(Math.abs(d.sav)/100)}</text>`; });
  const sumInc=data.reduce((a,d)=>a+d.inc,0), sumSav=data.reduce((a,d)=>a+d.sav,0), rate=sumInc?Math.round(sumSav/sumInc*100):0;
  const all=S.ops.reduce((a,o)=>a+(o.type==='income'?o.amount:-o.amount),0);
  const tagT=S.tags.map(t=>({t,v:S.ops.filter(o=>o.type==='expense'&&(o.tags||[]).includes(t.id)).reduce((a,o)=>a+o.amount,0)})).sort((a,b)=>b.v-a.v), tmax=Math.max(1,...tagT.map(x=>x.v));
  return `${viewHead('Stats')}
  <section class="card donut-card">
    ${cats.length?`<div class="dn-top"><svg viewBox="0 0 140 140" class="donut" role="img" aria-label="Répartition des dépenses de ${mName}">${segs}</svg><div class="dn-tx"><span>Dépenses nettes</span><b class="num">${eur0(tot)}</b>${m.recExp?`<small>dont ${eur0(m.recExp)} de frais mensuels</small>`:''}</div></div>`:'<div class="empty">Pas encore de dépenses ce mois-ci.</div>'}
  </section>
  ${cats.length?`<div class="list">${top.map(([id,v])=>{ const c=CAT[id]; return `<button class="op-fg catrow" data-act="catd" data-id="${id}"><span class="op-ic" style="--c:${c.c}">${ico(c)}</span><span class="op-main"><span class="op-t">${esc(c.name)}</span><span class="cbar"><span style="width:${(v/maxV*100).toFixed(1)}%;background:${c.c}"></span></span></span><span class="op-amt">${eur0(v)}<small>${Math.round(v/tot*100)} %</small></span></button>`; }).join('')}${rest?`<div class="op-fg catrow"><span class="op-ic" style="--c:var(--ink-3)">${icon('grid')}</span><span class="op-main"><span class="op-t">Autres catégories</span></span><span class="op-amt">${eur0(rest)}<small>${Math.round(rest/tot*100)} %</small></span></div>`:''}</div>`:''}
  ${secHead('Évolution')}
  <section class="card evo-card">
    <div class="evo-top"><div class="legend" style="margin:0"><span><span class="mi"></span>Revenus</span><span><span class="mi" style="background:var(--coral)"></span>Dépenses</span></div><div class="seg"><button class="${N===6?'on':''}" data-act="sn" data-v="6">6 mois</button><button class="${N===12?'on':''}" data-act="sn" data-v="12">12 mois</button></div></div>
    <svg viewBox="0 0 340 182" class="chart" role="img" aria-label="Revenus et dépenses des ${N} derniers mois">${bars}</svg>
    <div class="sub">Sous chaque mois : son épargne en euros.</div>
  </section>
  <div class="tiles two">
    <div class="tile"><span class="tile-pic ic gold">${icon('piggy')}</span><span class="tile-l">Épargne cumulée</span><span class="tile-v ${all<0?'neg':''}">${all<0?'−':'+'}${eur0(Math.abs(all))}</span></div>
    <div class="tile"><span class="tile-pic ic">${icon('chart')}</span><span class="tile-l">Taux d'épargne, ${N} mois</span><span class="tile-v ${rate<0?'neg':''}">${rate} %</span></div>
  </div>
  ${tagT.length?secHead('Par étiquette')+`<div class="list">${tagT.map(({t,v})=>`<div class="op-fg catrow"><span class="op-ic tag-ic" style="--c:${t.c}">${icon('hash')}</span><span class="op-main"><span class="op-t">${esc(t.name)}</span><span class="cbar"><span style="width:${(v/tmax*100).toFixed(1)}%;background:${t.c}"></span></span></span><span class="op-amt">${eur0(v)}</span></div>`).join('')}</div>`:''}`;
}

/* ---------- Progrès, pointage, bilan ---------- */
const CHEV='<svg class="chev" viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>';
const ICO_CHART='<svg viewBox="0 0 24 24"><path d="M4 19V5M4 19h16M8 15l3-4 3 2 5-6"/></svg>';
const ICO_BANK='<svg viewBox="0 0 24 24"><path d="M3 10h18M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 20h18M12 3l9 5H3z"/></svg>';
const leJour=d=>d===TODAY?"aujourd'hui":'le '+shortDate(d);
const deMois=ym=>{ const n=MONTHS[+ym.slice(5)-1]; return /^[aeiouyh]/.test(n)?"d'"+n:'de '+n; };
const viewSeg=()=>`<div class="seg view-seg" role="tablist"><button class="${ui.opsView!=='cal'?'on':''}" data-act="view" data-v="list">Liste</button><button class="${ui.opsView==='cal'?'on':''}" data-act="view" data-v="cal">Calendrier</button></div>`;
const checkinHTML=()=>`<button class="checkin" data-act="checkin"><span>Rien dépensé aujourd'hui ?</span><b>Pointer <small>+5 XP</small></b></button>`;
function bilanMonths(){ const out=[]; for(let i=1;i<=6;i++){ const ym=addMonths(CUR,-i); if(S.ops.some(o=>ymOf(o.date)===ym)) out.push(ym); } return out; }
function homeGameHTML(g){
  const lv=g.level, lo=lvlMin(lv), hi=lv<LEVELS.length?lvlMin(lv+1):null, p=hi?(g.total-lo)/(hi-lo)*100:100;
  const prev=addMonths(CUR,-1), showBilan=S.seenBilan!==prev&&S.ops.some(o=>ymOf(o.date)===prev);
  return `<button class="card xp-strip" data-act="goprog" aria-label="Niveau ${lv}, ${LEVELS[lv-1]}, ${fmtN(g.total)} XP, série de ${g.streak} jours">
    <span class="lvl-coin sm">${lv}</span>
    <span class="xp-main"><span class="xp-top"><b>${LEVELS[lv-1]}</b><span class="num">${fmtN(g.total)} XP</span></span><span class="xpbar"><span style="width:${clamp(p,0,100)}%"></span></span></span>
    <span class="streak"><b class="num">${g.streak}</b><small>${g.streak>1?'jours':'jour'}</small></span></button>
  ${ui.ym===CUR&&!g.pointedToday?checkinHTML():''}
  ${showBilan?`<button class="bilan-card" data-act="bilan" data-ym="${prev}"><span><small>Bilan du mois</small><b>Ton bilan ${deMois(prev)} est prêt</b></span>${CHEV}</button>`:''}`;
}
function progHTML(){
  const g=computeGame(), lv=g.level, lo=lvlMin(lv), hi=lv<LEVELS.length?lvlMin(lv+1):null, p=hi?(g.total-lo)/(hi-lo):1;
  const cm=g.months[CUR]||XPZ(), mName=MONTHS[+CUR.slice(5)-1];
  const parts=[['Saisies',cm.saisie,'var(--ink-3)'],['Journées pointées',cm.jours,'var(--mint)'],['Séries',cm.series,'var(--sun)'],['Pointage',cm.pointage,'var(--accent)']], done=parts.reduce((a,x)=>a+x[1],0);
  const dots=[]; for(let i=13;i>=0;i--){ const d=parseD(TODAY); d.setDate(d.getDate()-i); const k=ymd(d); dots.push({s:g.dayState[k]||'n',n:d.getDate()}); }
  const SL={p:'pointé',j:'joker utilisé',x:'manqué',t:"aujourd'hui, pas encore pointé",n:'avant tes débuts'};
  const lastP=(S.pointages||[]).slice(-1)[0], bil=bilanMonths(), Rr=62, C=2*Math.PI*Rr;
  return `${pageHead('Progrès',`Niveau ${lv} sur ${LEVELS.length}`)}
  <section class="medal-hero">
    <div class="medal"><svg viewBox="0 0 140 140" class="medal-ring" aria-hidden="true"><circle cx="70" cy="70" r="${Rr}" class="trk"/><circle cx="70" cy="70" r="${Rr}" class="prg" stroke-dasharray="${(clamp(p,0,1)*C).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 70 70)"/></svg><span class="lvl-coin xl">${lv}</span></div>
    <div class="mh-name">${LEVELS[lv-1]}</div>
    <div class="mh-xp num"><b>${fmtN(g.total)}</b> XP</div>
    <div class="mh-next">${hi?`Encore ${fmtN(hi-g.total)} XP avant ${LEVELS[lv]}`:'Tu as atteint le dernier palier'}</div>
  </section>
  <div class="list todo">${g.pointedToday?`<div class="todo-row done"><span class="todo-ic">${icon('check')}</span><span class="todo-tx"><b>Journée pointée</b><small>Reviens demain pour prolonger ta série.</small></span></div>`:todoRow({ic:'check',t:'Pointe ta journée',s:"Rien dépensé aujourd'hui ? Un tap suffit.",act:'checkin',btn:'+5 XP'})}</div>
  ${secHead('Série')}
  <section class="card streak-card">
    <div class="sk-top"><div class="sk-n num">${g.streak}</div><div class="sk-tx"><b>${g.streak>1?'jours d\'affilée':'jour'}</b><small>Record : ${g.best} jours. Joker ${g.jokerFree?'disponible':'déjà utilisé'} cette semaine.</small></div></div>
    <div class="dots" role="list" aria-label="Les 14 derniers jours">${dots.map(x=>`<span class="dot2 ${x.s}" role="listitem" aria-label="Le ${x.n} : ${SL[x.s]}">${x.s==='j'?'J':x.n}</span>`).join('')}</div>
    <div class="legend" style="margin-top:0"><span><i class="lg-d p"></i>Pointé</span><span><i class="lg-d j"></i>Joker</span><span><i class="lg-d x"></i>Manqué</span></div>
  </section>
  ${secHead(`XP de ${mName}`)}
  <section class="card xp-card">
    <div class="xp-top"><span><b class="num">${fmtN(done)}</b> XP gagnés</span><span class="xp-play">+${fmtN(g.proj.epargne+g.proj.budget)} en jeu</span></div>
    <div class="xbar" aria-hidden="true">${done?parts.filter(x=>x[1]>0).map(x=>`<span style="flex:${x[1]};background:${x[2]}"></span>`).join(''):'<span style="flex:1;background:var(--surface-2)"></span>'}</div>
    <div class="xleg">${parts.map(x=>`<div><i style="background:${x[2]}"></i><span>${x[0]}</span><b class="num">+${fmtN(x[1])}</b></div>`).join('')}</div>
    <div class="xp-close"><span>À la clôture du mois, avec les frais mensuels à venir</span><div class="xleg"><div><i style="background:var(--sun)"></i><span>Épargne : ${g.proj.solde>0?eur0(g.proj.solde):'0 €'} × 2</span><b class="num">+${fmtN(g.proj.epargne)}</b></div><div><i style="background:var(--sun)"></i><span>Mois épargné${g.proj.budget>150?", mieux que d'habitude":''}</span><b class="num">${g.proj.budget?'+'+g.proj.budget:'0'}</b></div></div></div>
  </section>
  ${secHead('Pointage bancaire')}
  <section class="card stack" id="pointage">
    <div class="sub">${lastP?`Dernier pointage ${leJour(lastP.date)} : <b class="num" style="color:var(--ink)">${eur(lastP.balance)}</b>.`:'Le premier pointage sert de point de départ.'} Entre le solde affiché par ta banque : l'app le compare à tes saisies.</div>
    <div class="row2"><input class="inp" id="pt" inputmode="decimal" placeholder="Solde du compte" autocomplete="off"><button class="btn pri" data-act="point">Pointer</button></div>
    <div class="sub">+50 XP si l'écart est de 10 € ou moins, une fois par mois${cm.pointage?`. Déjà gagné en ${mName}`:''}.</div>
  </section>
  ${secHead('Paliers')}
  <div class="medals" role="list">${LEVELS.map((n,i)=>`<div class="md ${i+1===lv?'cur':''} ${i+1>lv?'lock':''}" role="listitem"><span class="lvl-coin ${i+1>lv?'off':''}">${i+1}</span><b>${n}</b><small class="num">${fmtN(lvlMin(i+1))} XP</small></div>`).join('')}</div>
  ${bil.length?secHead('Bilans')+`<div class="list">${bil.map(ym=>{ const st=monthStats(ym), mm=g.months[ym]||XPZ();
    return `<button class="op-fg bil-row" data-act="bilan" data-ym="${ym}"><span class="op-ic rec-ic">${icon('chart')}</span><span class="op-main"><span class="op-t">${cap(monthLabel(ym))}</span><span class="op-s">${st.solde>=0?eur0(st.solde)+' épargnés':'Déficit de '+eur0(-st.solde)}, +${fmtN(mm.total)} XP</span></span>${CHEV}</button>`;}).join('')}</div>`:''}
  <details class="card how"><summary>Comment gagner des XP ${CHEV}</summary><table><tbody>
    <tr><td>Chaque euro épargné à la fin du mois</td><td>+2</td></tr><tr><td>Mois terminé avec de l'épargne</td><td>+150</td></tr><tr><td>Et plus que la moyenne de tes 3 derniers mois</td><td>+100</td></tr>
    <tr><td>Pointage bancaire juste (une fois par mois)</td><td>+50</td></tr><tr><td>Série de 7 jours pointés</td><td>+30</td></tr>
    <tr><td>Journée pointée (saisie ou « Rien dépensé »)</td><td>+5</td></tr><tr><td>Saisie le jour même (5 par jour au maximum)</td><td>+3</td></tr><tr><td>Saisie en retard</td><td>+1</td></tr>
  </tbody></table><p class="sub" style="margin:10px 0 0">Tu ne perds jamais d'XP. Un mois difficile en rapporte simplement moins.</p></details>`;
}
function mountProg(){ $('#pt')?.addEventListener('keydown',e=>{ if(e.key==='Enter'){ e.preventDefault(); doPointage(); } });
  const md=$('.medals'), cur=$('.md.cur'); if(md&&cur) md.scrollLeft=cur.offsetLeft-(md.clientWidth-cur.clientWidth)/2; }
function parseBal(v){ const t=String(v||'').replace(/\s/g,'').replace(/[−–]/,'-').replace('€','').replace(',','.'); if(!t||t==='-') return null; const n=parseFloat(t); return isFinite(n)?Math.round(n*100):null; }
function doPointage(){
  const inp=$('#pt'), v=parseBal(inp?.value); if(v==null){ inp?.focus(); return; }
  const prev=(S.pointages||[]).filter(p=>p.date!==TODAY), ref=prev[prev.length-1];   // un 2e pointage le même jour remplace le 1er
  const expected=ref?ref.balance+S.ops.filter(o=>!o.adj&&o.date>ref.date&&o.date<=TODAY).reduce((a,o)=>a+(o.type==='income'?o.amount:-o.amount),0):null;
  const rec={id:uid(),date:TODAY,balance:v,expected};
  openPointResult(rec);
  mutate(ref?'Pointage enregistré':'Point de départ enregistré',()=>{ S.pointages=[...prev,rec]; });
}
function openPointResult(rec){
  if(rec.expected==null){ openSheet(`<div class="sh-h"><span class="op-ic rec-ic">${ICO_BANK}</span><div><h3>Point de départ enregistré</h3><div class="sub">${eur(rec.balance)}, ${leJour(rec.date)}</div></div></div>
    <div class="note-box">Au prochain pointage, l'app comparera le solde de ta banque avec tout ce que tu as saisi entre-temps. Le bon rythme : une fois par semaine, ou à la fin du mois.</div><button class="btn pri" data-sh="close">Compris</button>`); return; }
  const diff=rec.balance-rec.expected, ok=Math.abs(diff)<=TOL;
  openSheet(`<div class="sh-h"><span class="op-ic rec-ic">${ICO_BANK}</span><div><h3>${ok?'Tes comptes sont justes':'Il y a un écart'}</h3><div class="sub">Pointage ${rec.date===TODAY?"d'aujourd'hui":'du '+shortDate(rec.date)}</div></div></div>
   <div class="card"><div class="xrows" style="margin:0"><div class="xrow"><span>Selon tes saisies</span><b>${eur(rec.expected)}</b></div><div class="xrow"><span>Selon ta banque</span><b>${eur(rec.balance)}</b></div><div class="xrow tot"><span>Écart</span><b class="${ok?'pos':'neg'}">${diff>=0?'+':'−'}${eur(Math.abs(diff))}</b></div></div></div>
   ${ok?`<div class="note-box">Écart de 10 € ou moins : le bonus de pointage est validé pour ce mois.</div><button class="btn pri" data-sh="close">Super</button>`
   :`<div class="note-box">${diff<0?'Ta banque affiche moins que prévu : il manque sans doute des dépenses.':'Ta banque affiche plus que prévu : il manque sans doute des revenus.'} Ajoute les opérations oubliées à leur vraie date, puis pointe à nouveau aujourd'hui pour viser le bonus. Sinon, un ajustement corrige tes chiffres, sans bonus.</div>
     <button class="btn" data-pt="adj">Ajouter un ajustement de ${eur(Math.abs(diff))}</button><button class="btn pri" data-sh="close">Je vérifie mes saisies</button>`}`, sh=>{
    sh.addEventListener('click',ev=>{ if(!ev.target.closest('[data-pt="adj"]')) return; closeSheet();
      mutate(`Ajustement de ${eur(Math.abs(diff))} ajouté`,()=>{ S.ops.push({id:uid(),type:diff<0?'expense':'income',amount:Math.abs(diff),date:TODAY,cat:diff<0?'divers':'autre',pm:'cb',tags:[],note:'Ajustement pointage',adj:true}); }); });
  });
}
function openBilan(ym){
  const g=computeGame(), st=monthStats(ym), mm=g.months[ym]||XPZ(), [y,m]=ym.split('-').map(Number), nd=dim(y,m-1);
  let cum=0,cumPrev=0; for(const k in g.months){ if(k<=ym) cum+=g.months[k].total; if(k<ym) cumPrev+=g.months[k].total; }
  const lv=levelOf(cum), newLv=lv>levelOf(cumPrev);
  const vc={}; S.ops.filter(o=>ymOf(o.date)===ym&&o.type==='expense'&&!o.rec).forEach(o=>vc[o.cat]=(vc[o.cat]||0)+o.amount);
  const cats=Object.entries(vc).filter(([,v])=>v>0).sort((a,b)=>b[1]-a[1]), totC=cats.reduce((a,[,v])=>a+v,0);
  const dayT={}; S.ops.filter(o=>ymOf(o.date)===ym&&o.type==='expense'&&!o.rec).forEach(o=>dayT[o.date]=(dayT[o.date]||0)+o.amount);
  const topDay=Object.entries(dayT).sort((a,b)=>b[1]-a[1])[0];
  const pt=(S.pointages||[]).filter(q=>ymOf(q.date)===ym&&q.expected!=null).slice(-1)[0];
  const name=cap(monthLabel(ym)), sl=[];
  sl.push(st.solde>=0?`<div class="st-eye">${cap(name)}</div><div class="st-txt">Tu as mis de côté</div><div class="st-big gold">+${eur0(st.solde)}</div><div class="st-sub">${st.inc?`soit ${Math.round(st.solde/st.inc*100)} % de tes revenus du mois.`:''}</div><span class="lvl-coin lg st-coin">€</span>`
    :`<div class="st-eye">${cap(name)}</div><div class="st-txt">Ce mois-ci, un déficit de</div><div class="st-big">−${eur0(-st.solde)}</div><div class="st-sub">Les dépenses ont dépassé les revenus.</div>`);
  const used=st.gain>0?clamp(st.net/st.gain*100,0,100):100, bonus=savedBonus(ym,st.solde);
  sl.push(`<div class="st-eye">Rentrées et dépenses</div><div class="st-big">${eur0(st.gain)}</div><div class="st-sub">gagnés, pour ${eur0(Math.max(0,st.net))} dépensés${st.recExp?`, dont ${eur0(st.recExp)} de frais mensuels`:''}.</div>
    <div class="st-meter ${st.solde>=0?'':'over'}"><span style="width:${used}%"></span></div><span class="st-pill">${bonus>150?`Plus que d'habitude, +${bonus} XP`:bonus?'Mois épargné, +150 XP':'Pas d\'épargne ce mois-ci'}</span>`);
  if(cats.length){ const [cid,cv]=cats[0], c=CAT[cid];
    sl.push(`<div class="st-eye">Ta plus grosse catégorie</div><div class="st-emoji">${ico(c)}</div><div class="st-big" style="font-size:clamp(34px, 10vw, 52px)">${c.name}</div><div class="st-sub">${eur0(cv)}, soit ${Math.round(cv/totC*100)} % de tes dépenses courantes, hors frais mensuels.</div>
      ${topDay?`<div class="st-txt" style="font-size:16px;margin-top:10px">Jour le plus dépensier : <b style="color:var(--st-gold)">${dayLabel(topDay[0])}</b>, ${eur0(topDay[1])} hors frais mensuels.</div>`:''}`); }
  sl.push(`<div class="st-eye">Régularité</div><div class="st-big">${mm.pointed}<span style="font-size:.45em;color:var(--st-ink2)"> / ${nd}</span></div><div class="st-txt">jours pointés</div>
    <div class="st-sub">Ta série à la fin du mois : ${mm.end} jour${mm.end>1?'s':''}.</div>
    <span class="st-pill">${pt?(Math.abs(pt.balance-pt.expected)<=TOL?`Pointage juste, écart de ${eur(Math.abs(pt.balance-pt.expected))}`:`Pointage : écart de ${eur(Math.abs(pt.balance-pt.expected))}`):'Pas de pointage ce mois-ci'}</span>`);
  const parts=[['Épargne',mm.epargne],['Mois épargné',mm.budget],['Pointage',mm.pointage],['Séries',mm.series],['Journées pointées',mm.jours],['Saisies',mm.saisie]].filter(x=>x[1]>0), mx=Math.max(1,...parts.map(x=>x[1]));
  sl.push(`<div class="st-eye">XP du mois</div><div class="st-big gold">+${fmtN(mm.total)} XP</div>
    <div class="st-rows">${parts.map(([l,v])=>`<div class="st-row"><span>${l}</span><b>+${fmtN(v)}</b><i><span style="width:${v/mx*100}%"></span></i></div>`).join('')}</div>
    <div class="st-lv"><span class="lvl-coin sm">${lv}</span><span>${newLv?'Nouveau niveau :':'Niveau '+lv+' :'} <b>${LEVELS[lv-1]}</b></span></div>`);
  $('#story')?.remove();
  const el=document.createElement('div'); el.id='story'; el.setAttribute('role','dialog'); el.setAttribute('aria-label',`Bilan de ${monthLabel(ym)}`);
  el.innerHTML=`<div class="st-top"><div class="segs">${sl.map(()=>'<i><b></b></i>').join('')}</div><button class="st-x" aria-label="Fermer le bilan"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div><div class="st-body" aria-live="polite"></div><div class="st-hint">Touche à droite pour avancer, à gauche pour revenir</div>`;
  $('#app').appendChild(el); let i=0;
  const show=k=>{ i=k; $('.st-body',el).innerHTML=sl[i]; $$('.segs i',el).forEach((q,j)=>q.classList.toggle('on',j<=i)); if(i===sl.length-1&&mm.total>0) setTimeout(()=>confetti(null),250); sound('key'); };
  const kd=e=>{ if(e.key==='Escape') close(); else if(e.key==='ArrowRight') i<sl.length-1?show(i+1):close(); else if(e.key==='ArrowLeft'&&i>0) show(i-1); };
  const close=()=>{ el.remove(); document.removeEventListener('keydown',kd); render(false); };
  el.addEventListener('click',e=>{ if(e.target.closest('.st-x')){ close(); return; } const r=el.getBoundingClientRect(); if(e.clientX-r.left<r.width*.3){ if(i>0) show(i-1); } else if(i<sl.length-1) show(i+1); else close(); });
  document.addEventListener('keydown',kd);
  if(ym===addMonths(CUR,-1)&&S.seenBilan!==ym){ S.seenBilan=ym; save(); }
  show(0);
}

/* ---------- Glisser pour supprimer / dupliquer ---------- */
let justDragged=false;
function bindSwipes(){
  $$('#opsList .op-fg').forEach(fg=>{
    let x0,y0,dx=0,on=false,dir=null,pid=null;
    fg.addEventListener('pointerdown',e=>{x0=e.clientX;y0=e.clientY;dx=0;on=true;dir=null;pid=e.pointerId;});
    fg.addEventListener('pointermove',e=>{ if(!on||e.pointerId!==pid) return; const mx=e.clientX-x0,my=e.clientY-y0;
      if(!dir){ if(Math.abs(mx)>10&&Math.abs(mx)>Math.abs(my)*1.2){dir='h';fg.setPointerCapture(pid);fg.classList.add('drag');} else if(Math.abs(my)>10){on=false;return;} }
      if(dir==='h'){ dx=mx; fg.style.transform=`translateX(${dx}px) rotate(${dx/60}deg)`; fg.previousElementSibling.classList.toggle('del',dx<0); } });
    const up=()=>{ if(!on) return; on=false; fg.classList.remove('drag');
      if(dir==='h'){ justDragged=true; setTimeout(()=>justDragged=false,60); const id=fg.dataset.id;
        if(dx<-90){ delOp(id,fg.closest('.op')); }
        else if(dx>90){ fg.style.transform=''; dupOp(id); }
        else fg.style.transform=''; } };
    fg.addEventListener('pointerup',up); fg.addEventListener('pointercancel',up);
  });
}
function delOp(id,el){
  const o=S.ops.find(x=>x.id===id); if(!o) return;
  sound('crumple');
  const go=()=>mutate(`Supprimé : ${o.note||CAT[o.cat].name}`,()=>{
    S.ops=S.ops.filter(x=>x.id!==id);
    if(o.reimb){ S.ops.forEach(x=>{ if(x.reimbPay===o.reimb){ delete x.reimbPay; x.linkCat=null; } }); S.reimb=S.reimb.filter(r=>r.id!==o.reimb); }
    if(o.reimbPay){ const r=S.reimb.find(r=>r.id===o.reimbPay); if(r) r.payments=r.payments.filter(p=>p.opId!==id); }
  });
  if(el&&!S.settings.calm){ el.classList.add('crumple'); setTimeout(go,430); } else go();
}
function dupOp(id){
  const o=S.ops.find(x=>x.id===id); if(!o) return; const n={...o,id:uid(),date:TODAY,ca:TODAY,tags:[...(o.tags||[])]}; delete n.adj; delete n.rec; delete n.reimb; delete n.reimbPay; delete n.linkCat;
  if(n.type==='income'&&o.reimbPay) n.cat='autre';
  mutate(`Dupliqué : ${n.note||CAT[n.cat].name}, daté d'aujourd'hui`,()=>{S.ops.push(n);});
  if(ui.ym!==CUR){ui.ym=CUR;render(false);} const el=$(`.op[data-id="${n.id}"]`); el?.classList.add('fresh'); el?.scrollIntoView({block:'nearest',behavior:'smooth'});
  sound('coin');
}

/* ---------- Remboursements : maintenir pour encaisser (un tap ouvre le détail) ---------- */
function bindPend(card){
  let t=0,x0=0,y0=0,pid=null,fired=false;
  const cancel=()=>{ clearTimeout(t); t=0; card.classList.remove('holding'); };
  card.addEventListener('pointerdown',e=>{ x0=e.clientX; y0=e.clientY; pid=e.pointerId; fired=false; card.classList.add('holding');
    t=setTimeout(()=>{ t=0; fired=true; justDragged=true; setTimeout(()=>justDragged=false,400); cashIn(card.dataset.rid,null,card); },700); });
  card.addEventListener('pointermove',e=>{ if(e.pointerId===pid&&t&&Math.hypot(e.clientX-x0,e.clientY-y0)>10) cancel(); });
  card.addEventListener('pointerup',()=>{ const quick=!!t; cancel(); if(quick&&!fired) openReimbSheet(card.dataset.rid); });
  card.addEventListener('pointercancel',cancel);
  card.addEventListener('contextmenu',e=>e.preventDefault());
  card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openReimbSheet(card.dataset.rid);}});
}
function cashIn(rid,amount,card){
  const r=S.reimb.find(x=>x.id===rid); if(!r) return; const a=amount==null?restDue(r):clamp(amount,1,restDue(r));
  const e=S.ops.find(o=>o.id===r.expenseId);
  if(card){ card.style.transition='transform .3s ease-in, opacity .3s'; card.style.transform='translateY(140px) scale(.6)'; card.style.opacity='0'; }
  sound('register'); confetti(card);
  setTimeout(()=>mutate(`${eur(a)} encaissés de ${r.person}`,()=>{
    const op={id:uid(),type:'income',amount:a,date:TODAY,ca:TODAY,cat:'rembt',pm:'vir',tags:[],note:`Remboursement ${r.person}`,linkCat:e?e.cat:null,reimbPay:r.id};
    S.ops.push(op); const rr=S.reimb.find(x=>x.id===rid); rr.payments.push({id:uid(),amount:a,date:TODAY,opId:op.id});
  }), card?260:0);
}

/* ---------- Feuilles ---------- */
function bindDragClose(s){
  const pnl=$('.panel',s); let y0=null, dy=0;
  pnl.addEventListener('pointerdown',e=>{ if(!e.target.closest('.grab,.sh-h')||e.target.closest('button,input')||pnl.scrollTop>2) return; y0=e.clientY; dy=0; pnl.style.transition='none'; pnl.setPointerCapture?.(e.pointerId); });
  pnl.addEventListener('pointermove',e=>{ if(y0==null) return; dy=Math.max(0,e.clientY-y0); pnl.style.transform=`translateY(${dy}px)`; $('.scrim',s).style.opacity=String(Math.max(.2,1-dy/400)); });
  const up=()=>{ if(y0==null) return; y0=null; pnl.style.transition='transform .24s cubic-bezier(.2,.9,.3,1)';
    if(dy>110){ pnl.style.transform='translateY(110%)'; $('.scrim',s).style.opacity='0'; setTimeout(()=>{ if(s.isConnected) s.remove(); },230); }
    else { pnl.style.transform=''; $('.scrim',s).style.opacity=''; } };
  pnl.addEventListener('pointerup',up); pnl.addEventListener('pointercancel',up);
}
function openSheet(html,mount){
  closeSheet(true);
  const s=document.createElement('div'); s.id='sheet';
  s.innerHTML=`<div class="scrim" data-sh="close"></div><div class="panel" role="dialog" aria-modal="true"><div class="grab"></div>${html}</div>`;
  $('#app').appendChild(s);
  bindDragClose(s);
  s.addEventListener('click',e=>{ if(e.target.closest('[data-sh="close"]')) closeSheet();
    const ed=e.target.closest('[data-act="edit"]'); if(ed){ const o=S.ops.find(x=>x.id===ed.dataset.id); if(o){ closeSheet(true); openEntry({op:o}); } } });
  mount&&mount(s); Ambient.sleep();
}
/* Animations d'ambiance (vagues du bocal, plante, cartes « À encaisser ») : elles tournent quelques secondes
   après chaque interaction, puis se mettent en pause. Sinon l'écran se redessine en continu et vide la batterie. */
const Ambient={t:0,
  wake(){ clearTimeout(this.t); if(document.hidden||$('#entry:not(.closing),#sheet,#story,#onb')) return this.sleep(); $('#app').classList.remove('still'); this.t=setTimeout(()=>this.sleep(),6000); },
  sleep(){ clearTimeout(this.t); $('#app').classList.add('still'); } };
function closeSheet(now){ const s=$('#sheet'); if(!s) return; if(now){s.remove();return;} s.classList.add('closing'); Chrome.sync(); setTimeout(()=>{ s.remove(); Ambient.wake(); },220); }

function openCatSheet(id){
  const c=CAT[id]; const m=monthStats(ui.ym); const v=m.byCat[id]||0; const b=S.budgets.byCat[id]||0;
  const ops=S.ops.filter(o=>ymOf(o.date)===ui.ym&&(o.cat===id||o.linkCat===id)).sort(sortOps);
  openSheet(`<div class="sh-h"><span class="op-ic" style="--c:${c.c}">${ico(c)}</span><div><h3>${c.name}</h3><div class="sub">${monthLabel(ui.ym)}</div></div></div>
   <div class="card" style="display:flex;flex-direction:column;gap:8px"><div class="kv"><span>Dépense nette</span><b>${eur(v)}</b></div>
    ${b?`<div class="meter" style="--c:${v>b?'var(--coral)':c.c}"><span style="width:${clamp(v/b*100,0,100)}%"></span></div><div class="kv"><span>${v>b?'Dépassement':'Reste'}</span><b class="${v>b?'neg':''}">${eur(Math.abs(b-v))}</b></div>`:''}
    <label class="field"><span>Budget mensuel</span><input class="inp" id="cb" inputmode="decimal" placeholder="Aucun budget" value="${b?String(b/100).replace('.',','):''}"></label></div>
   <div class="list">${ops.map(o=>opRow(o,false)).join('')||'<div class="empty">Aucune opération.</div>'}</div>
   <button class="btn" data-ce-open="${id}">Modifier la catégorie</button>`, s=>{
    s.addEventListener('click',ev=>{ if(ev.target.closest('[data-ce-open]')) openCatEdit(id); });
    const i=$('#cb',s); i.addEventListener('change',()=>{ const val=parseAmt(i.value); mutate(val?`Budget ${c.name} : ${eur(val)}`:`Budget ${c.name} retiré`,()=>{ if(val) S.budgets.byCat[id]=val; else delete S.budgets.byCat[id]; }); });
  });
}
function openReimbSheet(rid){
  const r=S.reimb.find(x=>x.id===rid); if(!r) return; const e=S.ops.find(o=>o.id===r.expenseId); const rest=restDue(r);
  openSheet(`<div class="sh-h"><span class="op-ic" style="--c:var(--mint)">${icon('back')}</span><div><h3>${esc(r.person)} te doit ${eur(rest)}</h3><div class="sub">${e?esc(e.note||CAT[e.cat].name)+', '+eur(e.amount)+' payés le '+shortDate(e.date):''}</div></div></div>
   ${r.payments.length?`<div class="note-box">Déjà reçu : ${r.payments.map(p=>`${eur(p.amount)} le ${shortDate(p.date)}`).join(', ')}</div>`:''}
   <div class="stack"><button class="btn ok" data-r="all">Encaisser ${eur(rest)}</button>
   <label class="field"><span>Ou une partie seulement</span><div class="row2"><input class="inp" id="part" inputmode="decimal" placeholder="Ex. 10"><button class="btn" data-r="part">Encaisser</button></div></label></div>
   <div class="note-box">Tant que ce n'est pas encaissé, la dépense compte entièrement dans tes dépenses du mois. À l'encaissement, le montant devient un revenu « Remboursement » et réduit la dépense nette de la catégorie.</div>`, s=>{
    s.addEventListener('click',ev=>{ const k=ev.target.closest('[data-r]')?.dataset.r; if(!k) return;
      if(k==='all'){ closeSheet(); cashIn(rid,null,$(`.pend[data-rid="${rid}"]`)); }
      if(k==='part'){ const a=parseAmt($('#part',s).value); if(!a){ $('#part',s).focus(); return;} closeSheet(); cashIn(rid,a,null); } });
  });
}
function nextOcc(r){
  if(r.end&&r.end<TODAY) return null; const t=parseD(TODAY);
  for(let i=0;i<14;i++){ const d=ymd(occIn(r,t.getFullYear(),t.getMonth()+i));
    if(d<TODAY||d<r.start) continue; if(r.last&&ymOf(r.last)===ymOf(d)) continue; if(r.end&&d>r.end) return null; return d; }
  return null;
}
function recRow(r){
  const c=CAT[r.cat]||CAT.divers, nx=nextOcc(r);
  return `<div class="op"><div class="op-fg" data-rec="${r.id}"><span class="op-ic" style="--c:${c.c}">${ico(c)}</span>
    <span class="op-main"><span class="op-t">${esc(r.name)}</span><span class="op-s">${r.end?'Arrêté':nx?'Prochain le '+shortDate(nx):'Le '+r.day+(r.day===1?'er':'')+' du mois'}</span></span>
    <span class="op-amt ${r.type==='income'?'pos':''}">${sgn(r.amount,r.type)}</span></div></div>`;
}
function openRecList(){
  const act=S.recurring.filter(r=>!r.end).sort((a,b)=>a.day-b.day), off=S.recurring.filter(r=>r.end);
  const out=act.filter(r=>r.type==='expense').reduce((a,r)=>a+r.amount,0), inn=act.filter(r=>r.type==='income').reduce((a,r)=>a+r.amount,0);
  openSheet(`<div class="sh-h"><span class="op-ic rec-ic"><svg viewBox="0 0 24 24"><path d="M17 3l3 3-3 3"/><path d="M4 11V9a3 3 0 0 1 3-3h13"/><path d="M7 21l-3-3 3-3"/><path d="M20 13v2a3 3 0 0 1-3 3H4"/></svg></span><div><h3>Frais mensuels</h3><div class="sub">Ajoutés automatiquement chaque mois</div></div></div>
   <div class="totals"><div><div class="label">Sorties par mois</div><b class="neg">−${eur(out)}</b></div><div><div class="label">Entrées par mois</div><b class="pos">+${eur(inn)}</b></div></div>
   <div class="list">${act.map(recRow).join('')||'<div class="empty">Aucun frais mensuel pour l\'instant.</div>'}</div>
   ${off.length?`<div class="sec-t"><h2>Arrêtés</h2><span></span></div><div class="list">${off.map(recRow).join('')}</div>`:''}
   <button class="btn pri" data-r="new">Ajouter un frais mensuel</button>
   <div class="note-box">Tu peux aussi activer « Chaque mois » au moment d'une saisie dans le « + ».</div>`, s=>{
    s.addEventListener('click',ev=>{ const row=ev.target.closest('[data-rec]'); if(row){ openRecSheet(row.dataset.rec); return; }
      if(ev.target.closest('[data-r="new"]')) openEntry({monthly:true}); });
  });
}
function openRecSheet(id){
  const r=S.recurring.find(x=>x.id===id); if(!r) return;
  const curOp=S.ops.find(o=>o.rec===id&&ymOf(o.date)===CUR); const nOps=S.ops.filter(o=>o.rec===id).length;
  let selCat=r.cat, selPm=r.pm;
  openSheet(`<div class="sh-h"><span class="op-ic" id="ric" style="--c:${CAT[r.cat].c}">${ico(CAT[r.cat])}</span><div><h3>${esc(r.name)}</h3><div class="sub">${r.end?'Arrêté le '+shortDate(r.end):(r.type==='income'?'Revenu mensuel':'Dépense mensuelle')}</div></div></div>
   <div class="card stack">
    <label class="field"><span>Nom</span><input class="inp" id="rn" value="${esc(r.name)}"></label>
    <div class="row2"><label class="field"><span>Montant</span><input class="inp" id="ra" inputmode="decimal" value="${String(r.amount/100).replace('.',',')}"></label>
     <label class="field"><span>Jour du mois</span><input class="inp" id="rd" type="number" inputmode="numeric" min="1" max="31" value="${r.day}"></label></div>
    <div class="field"><span>Catégorie</span><div class="chips">${CATS.filter(c=>c.k===r.type).map(c=>`<button class="chip ${c.id===r.cat?'on':''}" data-rc="${c.id}">${ico(c)}${c.name}</button>`).join('')}</div></div>
    <div class="field"><span>Moyen de paiement</span><div class="chips">${PMS.map(p=>`<button class="chip ${p.id===r.pm?'on':''}" data-rp="${p.id}">${pmIco(p)}${p.name}</button>`).join('')}</div></div>
    ${curOp?`<div class="switch"><span>Corriger aussi ${MONTHS[+CUR.slice(5)-1]}<br><small>Déjà ajouté le ${shortDate(curOp.date)}</small></span><button class="sw on" id="rcur" role="switch" aria-checked="true" aria-label="Corriger aussi ce mois-ci"></button></div>`:''}
   </div>
   <button class="btn pri" data-r="save">Enregistrer</button>
   <div class="stack">${r.end?'<button class="btn" data-r="resume">Reprendre ce frais</button>':'<button class="btn" data-r="stop">Arrêter ce frais</button>'}<button class="btn danger" data-r="del">Supprimer avec son historique</button></div>
   <div class="note-box">Les mois passés ne bougent pas. « Arrêter » garde l'historique. « Supprimer » retire aussi les ${nOps} opération${nOps>1?'s':''} déjà ajoutée${nOps>1?'s':''}.</div>`, s=>{
    s.addEventListener('click',ev=>{
      const rc=ev.target.closest('[data-rc]'); if(rc){ selCat=rc.dataset.rc; $$('[data-rc]',s).forEach(x=>x.classList.toggle('on',x===rc)); const ic=$('#ric',s); ic.innerHTML=ico(CAT[selCat]); ic.style.setProperty('--c',CAT[selCat].c); return; }
      const rp=ev.target.closest('[data-rp]'); if(rp){ selPm=rp.dataset.rp; $$('[data-rp]',s).forEach(x=>x.classList.toggle('on',x===rp)); return; }
      const sw=ev.target.closest('#rcur'); if(sw){ sw.classList.toggle('on'); sw.setAttribute('aria-checked',sw.classList.contains('on')); return; }
      const b=ev.target.closest('[data-r]'); if(!b) return; const k=b.dataset.r;
      if(k==='save'){ const amt=parseAmt($('#ra',s).value); if(!amt){ $('#ra',s).focus(); return; }
        const day=clamp(parseInt($('#rd',s).value,10)||r.day,1,31), name=$('#rn',s).value.trim()||CAT[selCat].name, fix=!!curOp&&!!$('#rcur.on',s);
        closeSheet(); mutate(`${name} : ${eur(amt)} chaque mois, le ${day}`,()=>{ const rr=S.recurring.find(x=>x.id===id); Object.assign(rr,{name,amount:amt,day,cat:selCat,pm:selPm});
          if(fix){ const o=S.ops.find(x=>x.id===curOp.id); if(o) Object.assign(o,{amount:amt,cat:selCat,pm:selPm,note:name}); } }); }
      if(k==='stop'||k==='del'){ if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent=k==='stop'?'Confirmer : arrêter dès aujourd\'hui':'Confirmer la suppression'; b.classList.add('danger'); return; }
        closeSheet(); if(k==='stop') mutate(`${r.name} arrêté`,()=>{ S.recurring.find(x=>x.id===id).end=TODAY; });
        else mutate(`${r.name} supprimé`,()=>{ S.recurring=S.recurring.filter(x=>x.id!==id); S.ops=S.ops.filter(o=>o.rec!==id); }); }
      if(k==='resume'){ closeSheet(); mutate(`${r.name} repris`,()=>{ const rr=S.recurring.find(x=>x.id===id); delete rr.end;
        rr.start=(rr.last&&ymOf(rr.last)===CUR)?addMonths(CUR,1)+'-01':TODAY; rr.last=null; genRecurring(S); }); }
    });
  });
}
/* ---------- Gestion des catégories et des étiquettes ---------- */
const ICO_LEFT='<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>';
const backBtn=(to,label)=>`<button class="icon-btn" data-nav="${to}" aria-label="${label}">${ICO_LEFT}</button>`;
function firstGrapheme(v){ v=String(v||'').trim(); if(!v) return ''; try{ return [...new Intl.Segmenter('fr',{granularity:'grapheme'}).segment(v)][0].segment; }catch(e){ return Array.from(v)[0]; } }
function catUsage(id){ return {ops:S.ops.filter(o=>o.cat===id||o.linkCat===id).length, rec:S.recurring.filter(r=>r.cat===id).length}; }
function navHandler(sh){ sh.addEventListener('click',ev=>{ const n=ev.target.closest('[data-nav]')?.dataset.nav; if(n==='settings') openSettings(); if(n==='cats') openCatList(); if(n==='tags') openTagList(); }); }
function openCatList(){
  const row=c=>{ const u=catUsage(c.id), b=S.budgets.byCat[c.id]; return `<button class="op-fg bil-row" data-cat="${c.id}"><span class="op-ic" style="--c:${c.c}">${ico(c)}</span><span class="op-main"><span class="op-t">${esc(c.name)}</span><span class="op-s">${u.ops} opération${u.ops>1?'s':''}${b?', budget '+eur0(b):''}</span></span>${CHEV}</button>`; };
  const ex=S.cats.filter(c=>c.k==='expense'), inc=S.cats.filter(c=>c.k==='income');
  openSheet(`<div class="sh-h">${backBtn('settings','Retour aux réglages')}<div><h3>Catégories</h3><div class="sub">Touche une catégorie pour la modifier</div></div></div>
   <div class="sec-t"><h2>Dépenses</h2><span>${ex.length}</span></div><div class="list">${ex.map(row).join('')}</div>
   <button class="btn" data-newcat="expense">+ Nouvelle catégorie de dépense</button>
   <div class="sec-t"><h2>Revenus</h2><span>${inc.length}</span></div><div class="list">${inc.map(row).join('')}</div>
   <button class="btn" data-newcat="income">+ Nouvelle catégorie de revenu</button>`, sh=>{
    navHandler(sh);
    sh.addEventListener('click',ev=>{ const r=ev.target.closest('[data-cat]'); if(r){ openCatEdit(r.dataset.cat); return; } const n=ev.target.closest('[data-newcat]'); if(n) openCatEdit(null,n.dataset.newcat); });
  });
}
function openCatEdit(id,kind){
  const c=id?S.cats.find(x=>x.id===id):null, isNew=!c; kind=c?c.k:kind;
  let col=c?c.c:CAT_COLORS[S.cats.length%CAT_COLORS.length], em=c?(c.i||'tag'):(kind==='income'?'coins':'tag'), target=null;
  const u=c?catUsage(id):{ops:0,rec:0}, used=u.ops+u.rec>0, others=S.cats.filter(x=>x.k===kind&&x.id!==id);
  const budVal=c&&S.budgets.byCat[id]?String(S.budgets.byCat[id]/100).replace('.',','):'';
  openSheet(`<div class="sh-h">${backBtn('cats','Retour aux catégories')}<span class="op-ic" id="ce-ic" style="--c:${col}">${icon(em)}</span><div><h3>${isNew?'Nouvelle catégorie':esc(c.name)}</h3><div class="sub">${kind==='income'?'Revenu':'Dépense'}${c?`, ${u.ops} opération${u.ops>1?'s':''}`:''}</div></div></div>
   <div class="card stack">
     <label class="field"><span>Nom</span><input class="inp" id="ce-name" value="${c?esc(c.name):''}" placeholder="${kind==='income'?'Ex. Loyer perçu':'Ex. Sport'}" autocomplete="off"></label>
     <div class="field"><span>Icône</span><div class="emo-grid">${ICON_PICK.map(x=>`<button class="emo ${x===em?'on':''}" data-emo="${x}" aria-label="Icône ${x}" style="--c:${col}">${icon(x)}</button>`).join('')}</div></div>
     <div class="field"><span>Couleur</span><div class="swatches">${CAT_COLORS.map(x=>`<button class="swatch ${x===col?'on':''}" data-col="${x}" style="--c:${x}" aria-label="Couleur ${x}"></button>`).join('')}</div></div>
     ${kind==='expense'?`<label class="field"><span>Budget mensuel (facultatif)</span><input class="inp" id="ce-bud" inputmode="decimal" placeholder="Aucun" value="${budVal}"></label>`:''}
   </div>
   <button class="btn pri" data-ce="save">${isNew?'Créer la catégorie':'Enregistrer'}</button>
   ${!c?'':c.sys?`<div class="note-box">L'app se sert de cette catégorie (${c.id==='rembt'?'remboursements reçus':'ajustements de pointage'}) : tu peux la renommer ou changer son icône, mais pas la supprimer.</div>`
     :`<div class="card stack"><div class="label">Supprimer cette catégorie</div>
       ${used?`<div class="sub">Ses ${u.ops} opération${u.ops>1?'s':''}${u.rec?` et ${u.rec} frais mensuel${u.rec>1?'s':''}`:''} iront dans :</div><div class="chips wrap">${others.map(x=>`<button class="chip" data-tgt="${x.id}">${ico(x)}${esc(x.name)}</button>`).join('')}</div>`:'<div class="sub">Elle n\'est utilisée nulle part.</div>'}
       <button class="btn danger" data-ce="del">Supprimer</button></div>`}`, sh=>{
    navHandler(sh);
    const ic=$('#ce-ic',sh);
    sh.addEventListener('click',ev=>{
      const e1=ev.target.closest('[data-emo]'); if(e1){ em=e1.dataset.emo; ic.innerHTML=icon(em); $$('.emo',sh).forEach(x=>x.classList.toggle('on',x===e1)); return; }
      const sw=ev.target.closest('[data-col]'); if(sw){ col=sw.dataset.col; ic.style.setProperty('--c',col); $$('.emo',sh).forEach(x=>x.style.setProperty('--c',col)); $$('.swatch',sh).forEach(x=>x.classList.toggle('on',x===sw)); return; }
      const tg=ev.target.closest('[data-tgt]'); if(tg){ target=tg.dataset.tgt; $$('[data-tgt]',sh).forEach(x=>x.classList.toggle('on',x===tg)); return; }
      const b=ev.target.closest('[data-ce]'); if(!b) return;
      if(b.dataset.ce==='save'){ const name=$('#ce-name',sh).value.trim(); if(!name){ $('#ce-name',sh).focus(); return; }
        const bud=kind==='expense'?parseAmt($('#ce-bud',sh).value):0, cid=c?c.id:uid();
        mutate(isNew?`Catégorie ${name} créée`:`Catégorie ${name} enregistrée`,()=>{
          if(isNew) S.cats.push({id:cid,name,i:em,c:col,k:kind}); else { const cc=S.cats.find(x=>x.id===cid); Object.assign(cc,{name,i:em,c:col}); delete cc.e; }
          if(kind==='expense'){ if(bud) S.budgets.byCat[cid]=bud; else delete S.budgets.byCat[cid]; } });
        openCatList(); }
      if(b.dataset.ce==='del'){ if(used&&!target){ toast('Choisis où déplacer ses opérations'); return; }
        if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent=used?`Confirmer : supprimer et déplacer vers ${CAT[target].name}`:'Confirmer la suppression'; return; }
        mutate(`Catégorie ${c.name} supprimée`,()=>{
          S.ops.forEach(o=>{ if(o.cat===id) o.cat=target; if(o.linkCat===id) o.linkCat=target; });
          S.recurring.forEach(r=>{ if(r.cat===id) r.cat=target; });
          delete S.budgets.byCat[id]; S.cats=S.cats.filter(x=>x.id!==id); });
        openCatList(); }
    });
  });
}
function tagStats(id){ const ops=S.ops.filter(o=>(o.tags||[]).includes(id)); return {ops, exp:ops.filter(o=>o.type==='expense').reduce((a,o)=>a+o.amount,0)}; }
function openTagList(){
  openSheet(`<div class="sh-h">${backBtn('settings','Retour aux réglages')}<div><h3>Étiquettes</h3><div class="sub">Pour suivre un projet à travers les catégories</div></div></div>
   <div class="list">${S.tags.map(t=>{ const st=tagStats(t.id); return `<button class="op-fg bil-row" data-tag="${t.id}"><span class="op-ic tag-ic" style="--c:${t.c}">${icon('hash')}</span><span class="op-main"><span class="op-t">${esc(t.name)}</span><span class="op-s">${st.ops.length} opération${st.ops.length>1?'s':''}, ${eur0(st.exp)} dépensés</span></span>${CHEV}</button>`; }).join('')||'<div class="empty">Aucune étiquette pour l\'instant.</div>'}</div>
   <button class="btn pri" data-newtag="1">+ Nouvelle étiquette</button>
   <div class="note-box">Tu peux aussi créer une étiquette pendant une saisie, dans « Plus d'options ».</div>`, sh=>{
    navHandler(sh);
    sh.addEventListener('click',ev=>{ const r=ev.target.closest('[data-tag]'); if(r){ openTagEdit(r.dataset.tag); return; } if(ev.target.closest('[data-newtag]')) openTagEdit(null); });
  });
}
function openTagEdit(id){
  const t=id?S.tags.find(x=>x.id===id):null, palette=[...TAG_COLORS,...CAT_COLORS.filter(x=>!TAG_COLORS.includes(x))];
  let col=t?t.c:TAG_COLORS[S.tags.length%TAG_COLORS.length];
  const st=t?tagStats(id):{ops:[],exp:0}, byCat={}; st.ops.filter(o=>o.type==='expense').forEach(o=>byCat[o.cat]=(byCat[o.cat]||0)+o.amount);
  const cats=Object.entries(byCat).sort((a,b)=>b[1]-a[1]);
  openSheet(`<div class="sh-h">${backBtn('tags','Retour aux étiquettes')}<span class="op-ic tag-ic" id="te-ic" style="--c:${col}">#</span><div><h3>${t?esc(t.name):'Nouvelle étiquette'}</h3><div class="sub">${t?`${st.ops.length} opération${st.ops.length>1?'s':''}`:'Ex. Vacances Italie, Mariage Léa, Travaux'}</div></div></div>
   ${t&&st.exp?`<div class="card"><div class="label">Total dépensé</div><div class="mid num">${eur(st.exp)}</div>${cats.slice(0,4).map(([cid,v])=>`<div class="tagrow" style="--c:${CAT[cid].c}"><div class="top"><span>${ico(CAT[cid])}${esc(CAT[cid].name)}</span><b>${eur0(v)}</b></div><div class="meter"><span style="width:${v/st.exp*100}%"></span></div></div>`).join('')}</div>`:''}
   <div class="card stack"><label class="field"><span>Nom</span><input class="inp" id="te-name" value="${t?esc(t.name):''}" placeholder="Nom de l'étiquette" autocomplete="off"></label>
     <div class="field"><span>Couleur</span><div class="swatches">${palette.map(x=>`<button class="swatch ${x===col?'on':''}" data-col="${x}" style="--c:${x}" aria-label="Couleur ${x}"></button>`).join('')}</div></div></div>
   <button class="btn pri" data-te="save">${t?'Enregistrer':'Créer l\'étiquette'}</button>
   ${st.ops.length?`<div class="sec-t"><h2>Opérations</h2><span>${st.ops.length>20?'20 dernières':st.ops.length}</span></div><div class="list">${st.ops.slice().sort(sortOps).slice(0,20).map(o=>opRow(o,false)).join('')}</div>`:''}
   ${t?`<button class="btn danger" data-te="del">Supprimer l'étiquette</button><div class="sub" style="text-align:center">Les opérations restent : seule l'étiquette leur est retirée.</div>`:''}`, sh=>{
    navHandler(sh);
    sh.addEventListener('click',ev=>{
      const sw=ev.target.closest('[data-col]'); if(sw){ col=sw.dataset.col; $('#te-ic',sh).style.setProperty('--c',col); $$('.swatch',sh).forEach(x=>x.classList.toggle('on',x===sw)); return; }
      const b=ev.target.closest('[data-te]'); if(!b) return;
      if(b.dataset.te==='save'){ const name=$('#te-name',sh).value.trim(); if(!name){ $('#te-name',sh).focus(); return; }
        mutate(t?`Étiquette ${name} enregistrée`:`Étiquette ${name} créée`,()=>{ if(t) Object.assign(S.tags.find(x=>x.id===id),{name,c:col}); else S.tags.push({id:uid(),name,c:col}); });
        openTagList(); }
      if(b.dataset.te==='del'){ if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent='Confirmer la suppression'; return; }
        mutate(`Étiquette ${t.name} supprimée`,()=>{ S.tags=S.tags.filter(x=>x.id!==id); S.ops.forEach(o=>{ if(o.tags) o.tags=o.tags.filter(x=>x!==id); }); S.recurring.forEach(r=>{ if(r.tags) r.tags=r.tags.filter(x=>x!==id); }); if(ui.ftag===id) ui.ftag=null; });
        openTagList(); }
    });
  });
}
const ICO_SAVE='<svg viewBox="0 0 24 24"><path d="M12 4v11M7 10l5 5 5-5M5 20h14"/></svg>';
const ICO_SHARE='<svg viewBox="0 0 24 24"><path d="M12 15V3M7 8l5-5 5 5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/></svg>';
const daysSince=d=>d?Math.round((parseD(TODAY)-parseD(d))/864e5):Infinity;
function openSettings(){
  const st=S.settings;
  openSheet(`<div class="sh-h"><div><h3>Réglages</h3><div class="sub">Tout est enregistré automatiquement.</div></div></div>
   <div class="card stack">
    <div class="switch"><span>Mode calme<br><small>Coupe animations, physique, capteurs et confettis</small></span><button class="sw ${st.calm?'on':''}" data-s="calm" role="switch" aria-checked="${!!st.calm}" aria-label="Mode calme"></button></div>
    <div class="switch"><span>Sons</span><button class="sw ${st.sound?'on':''}" data-s="sound" role="switch" aria-checked="${!!st.sound}" aria-label="Sons"></button></div>
    ${Haptic.can()?`<div class="switch"><span>Retours haptiques<br><small>Une petite vibration quand tu valides, encaisses ou passes un palier</small></span><button class="sw ${st.haptics!==false?'on':''}" data-s="haptics" role="switch" aria-checked="${st.haptics!==false}" aria-label="Retours haptiques"></button></div>`:''}
    ${Sensors.avail()?`<div class="switch"><span>Inclinaison et secousse<br><small>Le bocal suit ton iPhone, secouer annule la dernière action</small></span><button class="sw ${st.sensors?'on':''}" data-s="sens" role="switch" aria-checked="${!!st.sensors}" aria-label="Inclinaison et secousse"></button></div>`:''}
   </div>
   <div class="card mg">
     <button class="mg-row" data-s="recs"><span class="ic">${icon('repeat')}</span><b>Frais mensuels</b><small>${S.recurring.filter(r=>!r.end).length} actifs</small>${CHEV}</button>
     <button class="mg-row" data-s="cats"><span class="ic">${icon('grid')}</span><b>Catégories</b><small>${S.cats.length}</small>${CHEV}</button>
     <button class="mg-row" data-s="tags"><span class="ic">${icon('hash')}</span><b>Étiquettes</b><small>${S.tags.length}</small>${CHEV}</button>
     <button class="mg-row" data-s="siri"><span class="ic">${icon('mic')}</span><b>Raccourci Siri</b><small></small>${CHEV}</button>
   </div>
   <div class="field"><span>Apparence</span><div class="seg">${[['auto','Auto'],['light','Clair'],['dark','Sombre']].map(([v,l])=>`<button class="${(st.look||'auto')===v?'on':''}" data-s="look" data-v="${v}">${l}</button>`).join('')}</div></div>
   <div class="sec-t"><h2>Tes données</h2><span></span></div>
   <div class="card stack">
     <div class="sub">Elles sont enregistrées sur cet iPhone uniquement${st.persisted?', dans un stockage protégé':''}. Si tu supprimes l'app, elles disparaissent : garde une sauvegarde.</div>
     <div class="kv"><span>Dernière sauvegarde</span><b>${st.lastExport?(daysSince(st.lastExport)===0?"aujourd'hui":'il y a '+daysSince(st.lastExport)+' j'):'jamais'}</b></div>
     <button class="btn pri" data-s="exjson">Sauvegarder mes données</button>
     <div class="row2" style="grid-template-columns:1fr 1fr"><button class="btn" data-s="excsv">Export Excel (CSV)</button><button class="btn" data-s="import">Restaurer</button></div>
   </div>
   ${S.demo?`<div class="note-box">Tu explores les <b>données de démo</b>. Quand tu veux démarrer pour de vrai, touche « Tout effacer » : l'app te redemandera ton salaire et ton loyer.</div>`:''}
   <div class="stack"><button class="btn" data-s="demo">Charger les données de démo</button><button class="btn danger" data-s="wipe">Tout effacer et partir de zéro</button></div>
   <div class="sub" style="text-align:center">Pépètes ${APP_VERSION}${STANDALONE?', installée sur cet iPhone':''}</div>`, s=>{
    s.addEventListener('click',ev=>{ const b=ev.target.closest('[data-s]'); if(!b) return; const k=b.dataset.s;
      if(k==='recs'){ openRecList(); return; }
      if(k==='cats'){ openCatList(); return; }
      if(k==='tags'){ openTagList(); return; }
      if(k==='siri'){ openSiri(); return; }
      if(k==='exjson'){ exportJSON(); return; }
      if(k==='excsv'){ exportCSV(); return; }
      if(k==='import'){ importBackup(); return; }
      if(k==='sens'){ if(st.sensors){ st.sensors=false; Sensors.stop(); save(); b.classList.remove('on'); b.setAttribute('aria-checked','false'); }
        else Sensors.request().then(ok=>{ st.sensors=ok; save(); b.classList.toggle('on',ok); b.setAttribute('aria-checked',ok); if(!ok) toast('Accès refusé : autorise « Mouvement et orientation » pour Pépètes'); });
        return; }
      if(k==='bauto'){ const on=S.budgets.auto===false; mutate(on?'Budget calculé automatiquement':'Budget fixé à la main',()=>{ S.budgets.auto=on; }); b.classList.toggle('on',on); b.setAttribute('aria-checked',on); $('#bgf',s).hidden=on; return; }
      if(k==='look'){ st.look=b.dataset.v; save(); applyCalm(); $$('[data-s="look"]',s).forEach(x=>x.classList.toggle('on',x===b)); render(false); return; }
      if(k==='calm'||k==='sound'){ st[k]=!st[k]; b.classList.toggle('on',st[k]); b.setAttribute('aria-checked',st[k]); save(); applyCalm(); if(k==='sound'&&st.sound) sound('coin',false); Haptic.play(1); }
      if(k==='haptics'){ st.haptics=st.haptics===false; b.classList.toggle('on',st.haptics); b.setAttribute('aria-checked',st.haptics); save(); Haptic.play(2); return; }
      if(k==='demo'||k==='wipe'){ if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent=k==='demo'?'Confirmer : remplacer par la démo':'Confirmer : tout effacer'; b.classList.add('danger'); return; }
        const keep=S.settings; S=k==='demo'?buildDemo():emptyState(keep); S.settings=keep; lastUndo=null; save(); lastLevel=null; closeSheet(); ui.ym=CUR; ui.tab='home'; render();
        if(k==='demo') toast('Démo chargée'); else openOnboarding(4); } });
  });
}
/* ---------- Sauvegarde, export, import ---------- */
function shareOrDownload(name,mime,text){
  const blob=new Blob([text],{type:mime}); let file=null; try{ file=new File([blob],name,{type:mime}); }catch(e){}
  const mark=()=>{ S.settings.lastExport=TODAY; save(); render(false); };
  const dl=()=>{ const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{ URL.revokeObjectURL(a.href); a.remove(); },1500); mark(); toast(`Fichier ${name} créé`); };
  if(file&&navigator.canShare&&navigator.canShare({files:[file]})) navigator.share({files:[file],title:name}).then(()=>{ mark(); toast('Sauvegarde enregistrée'); }).catch(e=>{ if(e&&e.name==='AbortError') return; dl(); });
  else dl();
}
function exportJSON(){ shareOrDownload(`pepetes-sauvegarde-${TODAY}.json`,'application/json',JSON.stringify({app:'pepetes',format:1,exportedAt:new Date().toISOString(),state:S})); }
function exportCSV(){ const q=v=>{ v=String(v??''); return /[;"\r\n]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v; };
  const rows=[['Date','Type','Montant (€)','Catégorie','Moyen de paiement','Étiquettes','Note','Frais mensuel','Avance pour']];
  S.ops.slice().sort((a,b)=>a.date<b.date?-1:a.date>b.date?1:0).forEach(o=>{ const r=o.reimb&&S.reimb.find(x=>x.id===o.reimb);
    rows.push([o.date,o.type==='income'?'Revenu':'Dépense',((o.type==='income'?1:-1)*o.amount/100).toFixed(2).replace('.',','),CAT[o.cat].name,PM[o.pm]?.name||'',(o.tags||[]).map(t=>S.tags.find(x=>x.id===t)?.name).filter(Boolean).join(', '),o.note||'',o.rec?'oui':'',r?r.person:'']); });
  shareOrDownload(`pepetes-operations-${TODAY}.csv`,'text/csv;charset=utf-8','﻿'+rows.map(r=>r.map(q).join(';')).join('\r\n')); }
function importBackup(){ const i=document.createElement('input'); i.type='file'; i.accept='application/json,.json'; i.style.display='none'; document.body.appendChild(i);
  i.onchange=()=>{ const f=i.files[0]; i.remove(); if(!f) return; const r=new FileReader();
    r.onload=()=>{ let d=null; try{ d=JSON.parse(r.result); }catch(e){} const st=d&&d.state; if(!st||!Array.isArray(st.ops)){ toast("Ce fichier n'est pas une sauvegarde Pépètes"); return; } openImport(st,d.exportedAt); };
    r.readAsText(f); };
  i.click(); }
function openImport(st,at){
  const row=(l,v)=>`<div class="xrow"><span>${l}</span><b>${v}</b></div>`;
  openSheet(`<div class="sh-h">${backBtn('settings','Retour aux réglages')}<span class="op-ic rec-ic">${ICO_SAVE}</span><div><h3>Restaurer une sauvegarde</h3><div class="sub">${at?'Faite le '+new Date(at).toLocaleDateString('fr-FR',{day:'numeric',month:'long',year:'numeric'}):'Date inconnue'}</div></div></div>
   <div class="card"><div class="xrows" style="margin:0">${row('Opérations',st.ops.length)}${row('Frais mensuels',(st.recurring||[]).length)}${row('Étiquettes',(st.tags||[]).length)}${row('Catégories',(st.cats||DEFAULT_CATS).length)}</div></div>
   <div class="note-box"><b>Fusionner</b> ajoute seulement ce qui manque sur cet iPhone. <b>Remplacer</b> efface tes données actuelles (${S.ops.length} opérations) et met celles de la sauvegarde.</div>
   <div class="stack"><button class="btn pri" data-im="merge">Fusionner</button><button class="btn danger" data-im="replace">Remplacer mes données</button></div>`, sh=>{
    navHandler(sh);
    sh.addEventListener('click',ev=>{ const b=ev.target.closest('[data-im]'); if(!b) return;
      if(b.dataset.im==='merge'){ closeSheet(); mutate('Sauvegarde fusionnée',()=>{
          ['ops','reimb','tags','recurring','cats','pointages'].forEach(k=>{ S[k]=S[k]||[]; const have=new Set(S[k].map(x=>x.id)); (st[k]||[]).forEach(x=>{ if(!have.has(x.id)) S[k].push(x); }); });
          S.checkins=[...new Set([...(S.checkins||[]),...(st.checkins||[])])];
          for(const [k,v] of Object.entries(st.budgets?.byCat||{})) if(!(k in S.budgets.byCat)) S.budgets.byCat[k]=v;
          S.demo=false; genRecurring(S); }); }
      if(b.dataset.im==='replace'){ if(!b.dataset.armed){ b.dataset.armed='1'; b.textContent='Confirmer : remplacer mes données'; return; }
        closeSheet(); const copy=JSON.parse(JSON.stringify(st));
        mutate('Sauvegarde restaurée',()=>{ const look=S.settings.look; S=copy; migrate(S); genRecurring(S); S.settings=Object.assign({calm:false,sound:false},S.settings,{onboarded:true,look}); }); }
    });
  });
}
/* ---------- Raccourci Siri ---------- */
function openSiri(){
  const live=/^https:/.test(location.protocol)&&!IN_FRAME, base=live?location.origin+location.pathname.replace(/index\.html$/,''):'https://ton-pseudo.github.io/pepetes/', url=base+'?add=1&amount=';
  openSheet(`<div class="sh-h">${backBtn('settings','Retour aux réglages')}<div><h3>Raccourci Siri</h3><div class="sub">Dis « Dépense », donne le montant, touche la catégorie</div></div></div>
   <div class="card stack"><div class="label">Dans l'app Raccourcis</div>
    <ol class="steps"><li>Touche <b>+</b> pour créer un raccourci et nomme-le <b>Dépense</b>.</li>
     <li>Ajoute l'action <b>Demander une entrée</b> : type <b>Nombre</b>, question « Combien ? ».</li>
     <li>Ajoute l'action <b>URL</b>, colle l'adresse ci-dessous, puis insère la variable <b>Entrée fournie</b> juste après le signe =.</li>
     <li>Ajoute l'action <b>Ouvrir les URL</b>.</li>
     <li>Dis « Dis Siri, Dépense ». Pépètes s'ouvre avec le montant : touche une catégorie, c'est enregistré.</li></ol>
    <div class="copybox"><code id="siri-url">${esc(url)}</code><button class="btn" data-sr="copy">Copier</button></div>
    ${live?'':'<div class="sub">L\'adresse exacte apparaîtra ici une fois l\'app installée depuis GitHub Pages.</div>'}
    <div class="sub">Pour un revenu, ajoute <code>&amp;type=income</code> à la fin. Pour une catégorie fixe, ajoute par exemple <code>&amp;cat=courses</code> : il ne restera qu'à toucher « Enregistrer ».</div>
   </div>
   <div class="card stack"><div class="label">Si c'est Safari qui s'ouvre</div><div class="sub">Sur certains iPhone, le lien s'ouvre dans Safari au lieu de l'app installée, et Safari n'a pas accès à tes données. Dans ce cas, remplace les étapes 3 et 4 par l'action <b>Copier dans le presse-papiers</b> (Entrée fournie). Ouvre ensuite Pépètes, touche <b>+</b> puis l'icône <b>Coller</b> en haut à droite.</div></div>
   <button class="btn" data-sr="test">Tester avec 12,50 €</button>`, sh=>{
    navHandler(sh);
    sh.addEventListener('click',ev=>{ const b=ev.target.closest('[data-sr]'); if(!b) return;
      if(b.dataset.sr==='copy'){ const done=()=>toast('Adresse copiée'); try{ navigator.clipboard.writeText(url).then(done).catch(()=>selectText($('#siri-url',sh))); }catch(e){ selectText($('#siri-url',sh)); } }
      if(b.dataset.sr==='test'){ closeSheet(true); openEntry({siri:{amount:12.5}}); } });
  });
}
function selectText(el){ const r=document.createRange(); r.selectNodeContents(el); const sel=getSelection(); sel.removeAllRanges(); sel.addRange(r); toast('Adresse sélectionnée : copie-la'); }
function handleLaunch(){
  let q; try{ q=new URLSearchParams(location.search); }catch(e){ return; }
  if(!q.has('add')&&!q.has('amount')) return;
  try{ history.replaceState(null,'',location.pathname); }catch(e){}
  const amount=parseFloat(String(q.get('amount')||'').replace(/\s/g,'').replace(',','.')), type=q.get('type')==='income'?'income':'expense', cq=(q.get('cat')||'').trim().toLowerCase();
  const c=CATS.find(x=>x.k===type&&(x.id===cq||x.name.toLowerCase()===cq));
  openEntry({type,siri:{amount:isFinite(amount)?amount:0,cat:c?c.id:null,note:q.get('note')||''}});
}
/* ---------- Capteurs : inclinaison du bocal, secouer pour annuler ---------- */
const Sensors={on:false,gamma:0,tilt:0,peaks:[],last:0,prev:null,
  avail(){ return typeof DeviceMotionEvent!=='undefined'; },
  async request(){ try{ if(typeof DeviceMotionEvent.requestPermission==='function'){ if(await DeviceMotionEvent.requestPermission()!=='granted') return false;
      if(typeof DeviceOrientationEvent!=='undefined'&&typeof DeviceOrientationEvent.requestPermission==='function'&&await DeviceOrientationEvent.requestPermission()!=='granted') return false; }
    this.start(); return true; }catch(e){ return false; } },
  oriOn:false, raf:0, lastG:0,
  start(){ if(this.on) return; this.on=true; addEventListener('devicemotion',this.mot); this.syncOri(); },
  syncOri(){ const want=this.on&&ui.tab==='home'&&!S.settings.calm; if(want&&!this.oriOn){ addEventListener('deviceorientation',this.ori); this.oriOn=true; } else if(!want&&this.oriOn){ removeEventListener('deviceorientation',this.ori); this.oriOn=false; this.gamma=0; if(!this.raf) this.raf=requestAnimationFrame(tiltLoop); } },
  stop(){ this.on=false; this.oriOn=false; removeEventListener('deviceorientation',this.ori); removeEventListener('devicemotion',this.mot); cancelAnimationFrame(this.raf); this.raf=0; const g=$('.liq-tilt'); if(g) g.style.transform=''; },
  ori(e){ if(e.gamma==null) return; Sensors.gamma=e.gamma; if(Math.abs(e.gamma-Sensors.lastG)<.6&&Math.abs(Sensors.tilt-clamp(e.gamma,-40,40)*.6)<.1) return; Sensors.lastG=e.gamma; if(!Sensors.raf) Sensors.raf=requestAnimationFrame(tiltLoop); },
  mot(e){ if(S.settings.calm) return; const a=e.accelerationIncludingGravity; if(!a||a.x==null) return; const now=performance.now(), p=Sensors.prev; Sensors.prev={x:a.x,y:a.y,z:a.z}; if(!p) return;
    const d=Math.abs(a.x-p.x)+Math.abs(a.y-p.y)+Math.abs(a.z-p.z);
    if(d>28){ Sensors.peaks=Sensors.peaks.filter(t=>now-t<900); Sensors.peaks.push(now); if(Sensors.peaks.length>=3&&now-Sensors.last>2500){ Sensors.last=now; Sensors.peaks=[]; onShake(); } } }
};
function tiltLoop(){ Sensors.raf=0; if(!Sensors.on) return; const target=Sensors.oriOn?clamp(Sensors.gamma,-40,40)*.6:0;
  Sensors.tilt+=(target-Sensors.tilt)*.08; const g=$('.liq-tilt');
  if(g&&!(g.getAnimations&&g.getAnimations().some(x=>x.playState==='running'))) g.style.transform=`rotate(${(-Sensors.tilt).toFixed(2)}deg)`;
  if(Math.abs(target-Sensors.tilt)>.08) Sensors.raf=requestAnimationFrame(tiltLoop); }
function onShake(){ if($('#entry:not(.closing)')||$('#story')||$('#onb')||$('#sheet')) return; if(!lastUndo){ toast('Rien à annuler'); return; }
  const u=lastUndo;
  openSheet(`<div class="sh-h"><span class="op-ic rec-ic"><svg viewBox="0 0 24 24"><path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/></svg></span><div><h3>Annuler la dernière action ?</h3><div class="sub">${esc(u.label)}</div></div></div>
    <div class="stack"><button class="btn pri" data-un="1">Annuler cette action</button><button class="btn" data-sh="close">Garder</button></div>`, sh=>{
    sh.addEventListener('click',ev=>{ if(!ev.target.closest('[data-un]')) return; closeSheet(); S=JSON.parse(u.snap); lastUndo=null; save(); render(false); toast('Action annulée'); }); }); }
/* ---------- Premier lancement ---------- */
function openOnboarding(startAt=0){
  $('#onb')?.remove();
  const slides=[
    `<div class="st-eye">Bienvenue</div><div class="onb-t">Ton budget, trois secondes par dépense</div><div class="st-sub">Note chaque dépense et chaque revenu. Tout reste sur ton iPhone : rien n'est envoyé nulle part.</div><span class="lvl-coin lg st-coin">€</span>`,
    `<div class="st-eye">La saisie</div><div class="onb-t">Lance la pièce</div><div class="st-sub">Tape le montant, puis glisse la pièce dans une catégorie, ou touche-la. Secoue ton iPhone pour annuler la dernière action.</div><div class="onb-row"><span class="onb-bub">${icon('cart')}</span><span class="lvl-coin sm">12</span><span class="onb-bub">${icon('cup')}</span></div>`,
    `<div class="st-eye">Ton mois</div><div class="onb-t">Le bocal se remplit quand tu gagnes, se vide quand tu dépenses</div><div class="st-sub">Ce qui reste au fond à la fin du mois, c'est ton épargne. Pépètes l'additionne mois après mois.</div><div class="onb-jar">${jarSVG(.62)}</div>`,
    `<div class="st-eye">La progression</div><div class="onb-t">Gagne des XP</div><div class="st-sub">Chaque euro épargné rapporte 2 XP. Note tes dépenses chaque jour pour garder ta série, et pointe ton compte une fois par mois.</div><span class="lvl-coin lg st-coin">1</span>`,
    `<div class="st-eye">Pour commencer</div><div class="onb-t">Ton salaire et ton loyer</div><div class="st-sub">Ils servent à estimer ton épargne de fin de mois. Tu pourras tout changer plus tard.</div>
     <div class="onb-form">
      <div class="row2"><label class="field"><span>Salaire net par mois</span><input class="inp" id="ob-sal" inputmode="decimal" placeholder="Ex. 2 100" autocomplete="off"></label><label class="field"><span>Versé le</span><input class="inp" id="ob-sald" type="number" inputmode="numeric" min="1" max="31" value="1"></label></div>
      <div class="row2"><label class="field"><span>Loyer (facultatif)</span><input class="inp" id="ob-loy" inputmode="decimal" placeholder="Ex. 750" autocomplete="off"></label><label class="field"><span>Prélevé le</span><input class="inp" id="ob-loyd" type="number" inputmode="numeric" min="1" max="31" value="5"></label></div>
      ${Sensors.avail()&&typeof DeviceMotionEvent.requestPermission==='function'?'<button class="btn onb-ghost" id="ob-sens">Activer l\'inclinaison et la secousse</button>':''}
     </div>`];
  const el=document.createElement('div'); el.id='onb'; el.setAttribute('role','dialog'); el.setAttribute('aria-label','Bienvenue dans Pépètes');
  el.innerHTML=`<div class="st-top"><div class="segs">${slides.map(()=>'<i><b></b></i>').join('')}</div><button class="onb-skip" id="ob-skip">Passer</button></div><div class="onb-body" id="ob-body"></div>
    <div class="onb-foot"><button class="btn pri" id="ob-next">Suivant</button><button class="onb-link" id="ob-demo">Explorer d'abord avec des données de démo</button></div>`;
  $('#app').appendChild(el); let i=startAt;
  const show=k=>{ i=k; const body=$('#ob-body',el); body.innerHTML=slides[i]; $$('.segs i',el).forEach((q,j)=>q.classList.toggle('on',j<=i));
    const last=i===slides.length-1; $('#ob-next',el).textContent=last?"C'est parti":'Suivant'; $('#ob-skip',el).hidden=last; $('#ob-demo',el).hidden=!last;
    const liq=$('.liq',body); if(liq) requestAnimationFrame(()=>requestAnimationFrame(()=>{ liq.style.transform=`translateY(${liq.dataset.ly}px)`; }));
    $('#ob-sens',body)?.addEventListener('click',e=>{ Sensors.request().then(ok=>{ S.settings.sensors=ok; save(); e.target.textContent=ok?'Capteurs activés ✓':'Accès refusé'; e.target.disabled=true; }); }); };
  el.addEventListener('click',e=>{ const t=e.target.closest('button'); if(!t) return;
    if(t.id==='ob-skip') show(slides.length-1);
    if(t.id==='ob-next'){ if(i<slides.length-1) show(i+1); else finishOnboarding('real'); }
    if(t.id==='ob-demo') finishOnboarding('demo'); });
  show(i);
}
function finishOnboarding(mode){
  if(mode==='demo'){ const keep=S.settings; S=buildDemo(); S.settings=keep; }
  else{ const sal=parseAmt($('#ob-sal')?.value), sd=clamp(parseInt($('#ob-sald')?.value,10)||1,1,31), loy=parseAmt($('#ob-loy')?.value), ld=clamp(parseInt($('#ob-loyd')?.value,10)||5,1,31), start=CUR+'-01';
    if(sal) S.recurring.push({id:uid(),name:'Salaire',type:'income',amount:sal,cat:'salaire',day:sd,pm:'vir',tags:[],start,last:null});
    if(loy) S.recurring.push({id:uid(),name:'Loyer',type:'expense',amount:loy,cat:'logement',day:ld,pm:'prel',tags:[],start,last:null});
    genRecurring(S); }
  S.settings.onboarded=true; save(); $('#onb')?.remove(); lastLevel=null; ui.tab='home'; ui.ym=CUR; render();
  toast(mode==='demo'?'Démo chargée. Tu pourras tout effacer dans les réglages.':'C\'est parti ! Touche + pour ta première dépense.');
}
/* ---------- Installation, sauvegarde, mises à jour ---------- */
function installHTML(){ return `<div class="install-card"><span class="op-ic rec-ic">${ICO_SHARE}</span><div><b>Installe Pépètes sur ton iPhone</b><br>Touche <b>Partager</b>, puis <b>Sur l'écran d'accueil</b>. Ouvre ensuite l'app depuis son icône : c'est là que tes données seront enregistrées, pas dans Safari.</div></div>`; }
function backupHTML(){ if(S.demo||ui.ym!==CUR||S.ops.filter(o=>o.ca).length<15||daysSince(S.settings.lastExport)<30) return '';
  return `<button class="card rec-card" data-act="backup"><span class="op-ic rec-ic">${ICO_SAVE}</span><span class="op-main"><span class="op-t">Pense à sauvegarder</span><span class="op-s">${S.settings.lastExport?'Dernière sauvegarde il y a '+daysSince(S.settings.lastExport)+' jours':'Aucune sauvegarde pour l\'instant'}. Un fichier, rangé où tu veux.</span></span>${CHEV}</button>`; }
function registerSW(){
  if(!('serviceWorker' in navigator)||IN_FRAME||(location.protocol!=='https:'&&location.hostname!=='localhost')) return;
  const had=!!navigator.serviceWorker.controller; let reloading=false;
  navigator.serviceWorker.addEventListener('controllerchange',()=>{ if(!had||reloading) return; reloading=true; location.reload(); });
  navigator.serviceWorker.register('sw.js').then(reg=>{
    const ask=w=>{ if(!w||$('#upd')) return; const b=document.createElement('div'); b.id='upd'; b.setAttribute('role','status'); b.innerHTML='<span>Nouvelle version de Pépètes disponible</span><button>Mettre à jour</button>'; $('#app').appendChild(b); $('button',b).onclick=()=>{ b.remove(); w.postMessage('skip'); }; };
    if(reg.waiting&&had) ask(reg.waiting);
    reg.addEventListener('updatefound',()=>{ const w=reg.installing; if(w) w.addEventListener('statechange',()=>{ if(w.state==='installed'&&navigator.serviceWorker.controller) ask(w); }); });
    document.addEventListener('visibilitychange',()=>{ if(!document.hidden) reg.update().catch(()=>{}); });
  }).catch(()=>{});
}
function bootExtras(){
  try{ if(navigator.storage&&navigator.storage.persist) navigator.storage.persist().then(p=>{ S.settings.persisted=!!p; save(); }).catch(()=>{}); }catch(e){}
  if(S.settings.sensors&&Sensors.avail()){ if(typeof DeviceMotionEvent.requestPermission==='function') document.addEventListener('click',()=>{ Sensors.request(); },{once:true,capture:true}); else Sensors.start(); }
  registerSW();
}
function parseAmt(s){ const v=parseFloat(String(s||'').replace(/\s/g,'').replace(',','.')); return isFinite(v)&&v>0?Math.round(v*100):0; }
function applyCalm(){ const r=document.documentElement, st=S.settings; r.classList.toggle('calm',!!st.calm);
  delete r.dataset.pal;
  if(st.look==='light'||st.look==='dark') r.dataset.theme=st.look; else if(st.look==='auto') delete r.dataset.theme;
  Chrome.sync(); }
/* La barre d'état de l'iPhone prend la couleur du haut de l'écran : fond de l'app, voile d'une fiche ouverte,
   fond sombre du bilan. Elle suit aussi le thème choisi dans Réglages, même s'il diffère de celui de l'iPhone. */
const Chrome={last:'',
  rgb(v){ v=(v||'').trim(); if(v[0]==='#'){ if(v.length===4) v='#'+[...v.slice(1)].map(c=>c+c).join(''); return [1,3,5].map(i=>parseInt(v.slice(i,i+2),16)).concat(1); }
    const m=v.match(/rgba?\(([^)]+)\)/); if(!m) return null; const q=m[1].split(',').map(parseFloat); return [q[0],q[1],q[2],q.length>3?q[3]:1]; },
  sync(){ const metas=document.querySelectorAll('meta[name="theme-color"]'); if(!metas.length) return;
    const cs=getComputedStyle(document.documentElement), g=n=>this.rgb(cs.getPropertyValue(n));
    let c=g('--bg'); if(!c) return;
    if($('#story')||$('#onb')) c=g('--st-glow')||c;
    else if($('#sheet:not(.closing)')||$('#eopt:not([hidden])')){ const k=g('--scrim'); if(k) c=c.map((x,i)=>i<3?x*(1-k[3])+k[i]*k[3]:1); }
    const hex='#'+c.slice(0,3).map(x=>Math.round(x).toString(16).padStart(2,'0')).join('');
    if(hex===this.last) return; this.last=hex; metas.forEach(m=>m.setAttribute('content',hex)); } };


/* ---------- Saisie rapide : 1) le montant, 2) la catégorie ---------- */
let E=null, raf=0, B=[], coin=null, AR={el:null,W:0,H:0};
const reduce=()=>S.settings.calm||matchMedia('(prefers-reduced-motion: reduce)').matches;
const ICO_BACK='<svg viewBox="0 0 24 24"><path d="M9 6h11v12H9l-6-6z"/><path d="m12 10 4 4M16 10l-4 4"/></svg>';
const ICO_PASTE='<svg viewBox="0 0 24 24"><rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4V3h6v1M9 10h6M9 14h4"/></svg>';
function parseShared(t){ t=String(t||'').trim(); if(!t) return null; let type=null,amount=null,cat=null,note='';
  if(/^PEPETES\|/i.test(t)){ const p=t.split('|'); type=p[1]==='income'?'income':p[1]==='expense'?'expense':null; amount=parseFloat(String(p[2]||'').replace(/\s/g,'').replace(',','.')); const cq=(p[3]||'').trim().toLowerCase(); note=(p[4]||'').trim();
    const c=CATS.find(x=>x.id===cq||x.name.toLowerCase()===cq); if(c) cat=c.id; }
  else { const m=t.replace(/\s/g,'').match(/\d+(?:[.,]\d{1,2})?/); if(m) amount=parseFloat(m[0].replace(',','.')); }
  return amount>0?{type,amount,cat,note}:null; }
function pasteAmount(){ navigator.clipboard.readText().then(t=>{ const d=parseShared(t); if(!d||!E){ toast('Aucun montant à coller'); return; }
    E.digits=centsToDigits(Math.round(d.amount*100)); if(d.type&&!E.locked) E.type=d.type; if(d.note) E.note=d.note; if(d.cat){ E.cat=d.cat; E.preCat=true; }
    sound('coin'); refreshEntry(); if(E.step==='cat') buildArena(); else setStep('cat'); }).catch(()=>toast('Collage refusé par iOS')); }
const ICO_NEXT='<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
function openEntry(opts={}){
  if($('#entry:not(.closing)')) return; $$('#entry.closing').forEach(n=>n.remove()); closeSheet(true);
  const o=opts.op, reimb=opts.type==='reimb';
  E={editId:o?.id||null,type:o?o.type:(opts.type==='income'?'income':'expense'),adv:reimb,digits:o?centsToDigits(o.amount):'',cat:o?.cat||null,date:o?.date||TODAY,pm:o?.pm||S.lastPm||'cb',
     tags:o?[...(o.tags||[])]:[],note:o?.note||'',person:'',advAmt:'',opt:false,monthly:!!opts.monthly,recId:o?.rec||null,locked:!!(o&&(o.reimb||o.reimbPay||o.rec)),step:o?'cat':'amt',preCat:false};
  if(opts.siri){ const c0=Math.round((+opts.siri.amount||0)*100); if(c0>0){ E.digits=centsToDigits(c0); E.step='cat'; } if(opts.siri.note) E.note=opts.siri.note; if(opts.siri.cat){ E.cat=opts.siri.cat; E.preCat=true; } }
  B=[];
  const el=document.createElement('div'); el.id='entry'; el.setAttribute('role','dialog'); el.setAttribute('aria-label',E.editId?'Modifier une opération':'Nouvelle opération');
  el.innerHTML=`<div class="e-top"><button class="icon-btn" data-e="close" aria-label="Fermer"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button>
     <div class="seg" id="eseg">${[['expense','Dépense'],['income','Revenu']].map(([v,l])=>`<button data-e="type" data-v="${v}">${l}</button>`).join('')}</div>
     ${E.editId?`<button class="icon-btn" data-e="del" aria-label="Supprimer l'opération"><svg viewBox="0 0 24 24" style="stroke:var(--coral)"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg></button>`:(navigator.clipboard&&navigator.clipboard.readText?`<button class="icon-btn" data-e="paste" aria-label="Coller un montant">${ICO_PASTE}</button>`:'<span></span>')}</div>
   <div class="amt" id="amt"><div class="amt-eye" id="amte"></div><span class="amt-v" id="amtv">0 €</span><div class="chips e-chips" id="echips"></div><div class="amt-hint" id="ahint"></div></div>
   <div class="arena" id="arena"><div class="coin" id="coin" hidden aria-hidden="true"></div></div>
   <div class="e-save" id="esave" hidden><button class="btn pri" data-e="save" id="esaveb"></button></div>
   <div class="pad" id="pad">${['1','2','3','back','4','5','6',',','7','8','9','ok','0'].map(k=>`<button class="key${k==='ok'?' ok':k==='0'?' zero':''}" data-k="${k}" aria-label="${k==='back'?'Effacer':k==='ok'?'Choisir la catégorie':k}">${k==='back'?ICO_BACK:k==='ok'?ICO_NEXT+'<span>Catégorie</span>':k}</button>`).join('')}</div>
   <div class="eopt" id="eopt" hidden><div class="scrim" data-e="opt"></div><div class="panel" role="dialog" aria-label="Options de l'opération"><div class="grab" style="margin-bottom:10px"></div><div id="eoptc"></div></div></div>`;
  $('#app').appendChild(el); Ambient.sleep();
  el.addEventListener('click',entryClick); el.addEventListener('input',entryInput);
  bindAmtSwipe(); bindCoin(); refreshEntry();
  requestAnimationFrame(()=>{ if(!E) return; if(E.step==='cat') buildArena(); loop(); if(reimb) openOpts('person'); });
}
function closeEntry(){ cancelAnimationFrame(raf); raf=0; B=[]; const el=$('#entry:not(.closing)'); if(!el) return; E=null; el.classList.add('closing'); setTimeout(()=>{ el.remove(); Ambient.wake(); },240); }
function centsToDigits(c){ const s=(c/100).toFixed(2).replace('.',','); return s.replace(/,00$/,'').replace(/(,\d)0$/,'$1'); }
const cents=()=>{ if(!E||!E.digits) return 0; return Math.round(parseFloat(E.digits.replace(',','.'))*100)||0; };
function amtHTML(){ const t=amtText().replace(/\s?€$/,''); return `${t}<span class="cur">€</span>${E.step==='amt'?'<i class="caret"></i>':''}`; }
function amtText(){ if(!E.digits) return '0 €'; const [i,d]=E.digits.split(','); const ii=Number(i||0).toLocaleString('fr-FR'); return ii+(d!==undefined?','+d:'')+' €'; }
function setStep(st){ if(!E||E.step===st) return; E.step=st; refreshEntry(); if(st==='cat') requestAnimationFrame(()=>{ if(E) buildArena(); }); else B=[]; }
function openOpts(focus){ E.opt=true; refreshEntry(); if(focus) setTimeout(()=>$(`#eopt [data-f="${focus}"]`)?.focus(),320); }
function refreshEntry(){
  const el=$('#entry:not(.closing)'); if(!el||!E) return;
  el.classList.toggle('s-cat',E.step==='cat');
  $$('#eseg button',el).forEach(b=>{ b.classList.toggle('on',b.dataset.v===E.type); b.disabled=E.locked&&b.dataset.v!==E.type; b.style.opacity=b.disabled?'.4':''; });
  const a=$('#amt',el); a.classList.toggle('income',E.type==='income'); a.classList.toggle('expense',E.type!=='income');
  $('#amte',el).textContent=E.editId?'Modifier':E.monthly?(E.type==='income'?'Revenu mensuel':'Frais mensuel'):E.adv?"Payé pour quelqu'un":E.type==='income'?'Revenu':'Dépense';
  $('#amtv',el).innerHTML=amtHTML();
  renderChips();
  const c=cents();
  const showSave=!!E.cat&&!!(E.editId||E.preCat); $('#esave',el).hidden=!showSave; if(showSave) $('#esaveb',el).textContent=E.editId?'Enregistrer sans changer de catégorie':`Enregistrer en ${CAT[E.cat].name}`;
  $('#ahint',el).textContent=E.step==='cat'?(E.editId?'Touche le montant pour le corriger, ou une catégorie pour la changer':'Glisse la pièce dans une catégorie, ou touche-la'):'';
  $('.key.ok',el).classList.toggle('dis',!c);
  const co=$('#coin',el); co.hidden=!c; const ct=c?(c>=100000?eur0(c):(c/100).toLocaleString('fr-FR',{minimumFractionDigits:c%100?2:0})+' €'):''; co.textContent=ct; co.style.fontSize=ct.length>=10?'10px':ct.length>=8?'11.5px':'13px';
  $('#eopt',el).hidden=!E.opt; if(E.opt) renderOpts(); Chrome.sync();
}
function renderChips(){
  const el=$('#entry:not(.closing)'); if(!el||!E) return; const mday=parseD(E.date||TODAY).getDate();
  const tg=E.tags.map(t=>S.tags.find(x=>x.id===t)?.name).filter(Boolean);
  $('#echips',el).innerHTML=`<button class="chip" data-e="opt">${icon('calendar')}${shortDate(E.date||TODAY)}</button><button class="chip" data-e="opt">${pmIco(PM[E.pm])}${PM[E.pm].name}</button>
    ${E.monthly?`<button class="chip on" data-e="opt">${icon('repeat')}Le ${mday} de chaque mois</button>`:''}
    ${E.adv?`<button class="chip on" data-e="opt">${icon('people')}${E.person.trim()?esc(E.person.trim())+' te doit':'Qui te doit ?'}</button>`:''}
    ${tg.length?`<button class="chip on" data-e="opt"># ${esc(tg.join(', '))}</button>`:''}
    ${E.note?`<button class="chip on" data-e="opt">${icon('pencil')}${esc(E.note.slice(0,20))}</button>`:''}
    ${E.recId?`<button class="chip on" data-e="rec" data-v="${E.recId}">${icon('repeat')}Gérer le frais mensuel</button>`:''}
    <button class="chip ghost" data-e="opt">Plus d'options</button>`;
}
function renderOpts(){
  const box=$('#eoptc'); if(!box||!E) return; const mday=parseD(E.date||TODAY).getDate(), canMonthly=!E.editId, canAdv=E.type==='expense'&&!E.editId;
  box.innerHTML=`<div class="sh-h"><div><h3>Options</h3><div class="sub">${amtText()} en ${E.type==='income'?'revenu':'dépense'}</div></div></div>
   <div class="card stack">
    <label class="field"><span>Date</span><input class="inp" id="o-date" type="date" data-f="date" value="${E.date}"></label>
    <div class="field"><span>Payé avec</span><div class="chips wrap">${PMS.map(p=>`<button class="chip ${E.pm===p.id?'on':''}" data-e="pm" data-v="${p.id}">${pmIco(p)}${p.name}</button>`).join('')}</div></div>
    <div class="field"><span>Étiquettes</span><div class="chips wrap">${S.tags.map(t=>`<button class="chip ${E.tags.includes(t.id)?'on':''}" data-e="tag" data-v="${t.id}" style="--c:${t.c}"><span class="dot"></span>${esc(t.name)}</button>`).join('')}</div>
      <div class="row2"><input class="inp" id="newtag" placeholder="Nouvelle étiquette" autocomplete="off"><button class="btn" data-e="addtag" style="padding:9px">Ajouter</button></div></div>
    <label class="field"><span>Note</span><input class="inp" id="o-note" data-f="note" value="${esc(E.note)}" placeholder="Ex. Déj avec Paul" autocomplete="off"></label>
   </div>
   ${canMonthly?`<div class="card stack opt-card"><div class="switch"><span><b class="opt-t">${icon('repeat')}Tous les mois</b><small>${E.monthly?`Ajouté tout seul le ${mday} de chaque mois${mday>28?' (ou le dernier jour)':''}.`:'Pour le loyer, les abonnements, le salaire…'}</small></span><button class="sw ${E.monthly?'on':''}" data-e="monthly" role="switch" aria-checked="${E.monthly}" aria-label="Tous les mois"></button></div></div>`:''}
   ${canAdv?`<div class="card stack opt-card"><div class="switch"><span><b class="opt-t">${icon('people')}J'ai payé pour quelqu'un</b><small>Cette personne va te rembourser. Tu la retrouveras dans « À encaisser » sur l'Accueil.</small></span><button class="sw ${E.adv?'on':''}" data-e="adv" role="switch" aria-checked="${E.adv}" aria-label="J'ai payé pour quelqu'un"></button></div>
     ${E.adv?`<div class="row2"><label class="field"><span>Qui te doit ?</span><input class="inp" id="o-person" data-f="person" value="${esc(E.person)}" placeholder="Prénom" list="people" autocomplete="off"></label><label class="field"><span>Combien ?</span><input class="inp" id="o-adv" data-f="advAmt" inputmode="decimal" value="${esc(E.advAmt)}" placeholder="Tout"></label></div>
     <datalist id="people">${[...new Set(S.reimb.map(r=>r.person))].map(x=>`<option value="${esc(x)}">`).join('')}</datalist>
     <div class="sub">En attendant le remboursement, la dépense compte dans tes dépenses du mois.</div>`:''}</div>`:''}
   ${E.recId?`<div class="note-box">Cette opération vient d'un frais mensuel : la modifier ici ne change que ce mois-ci. <button class="chip" data-e="rec" data-v="${E.recId}" style="margin-top:8px">Modifier le frais mensuel</button></div>`:''}
   <button class="btn pri" data-e="opt">Terminé</button>`;
}
function entryClick(ev){
  const k=ev.target.closest('[data-k]')?.dataset.k; if(k){ key(k); return; }
  const b=ev.target.closest('[data-e]'); if(!b||!E) return; const a=b.dataset.e;
  if(a==='close') closeEntry();
  if(a==='paste') pasteAmount();
  if(a==='type'){ if(E.locked||b.dataset.v===E.type) return; setType(b.dataset.v); }
  if(a==='opt'){ E.opt=!E.opt; refreshEntry(); }
  if(a==='pm'){ E.pm=b.dataset.v; refreshEntry(); }
  if(a==='tag'){ const v=b.dataset.v; E.tags=E.tags.includes(v)?E.tags.filter(x=>x!==v):[...E.tags,v]; refreshEntry(); }
  if(a==='addtag'){ const i=$('#newtag'); const n=i.value.trim(); if(!n) return; let t=S.tags.find(x=>x.name.toLowerCase()===n.toLowerCase()); if(!t){ t={id:uid(),name:n,c:TAG_COLORS[S.tags.length%TAG_COLORS.length]}; S.tags.push(t); save(); } if(!E.tags.includes(t.id)) E.tags.push(t.id); refreshEntry(); }
  if(a==='adv'){ E.adv=!E.adv; if(E.adv) E.monthly=false; refreshEntry(); if(E.adv) setTimeout(()=>$('#o-person')?.focus(),60); }
  if(a==='monthly'){ E.monthly=!E.monthly; if(E.monthly) E.adv=false; refreshEntry(); }
  if(a==='rec'){ const id=b.dataset.v; closeEntry(); setTimeout(()=>openRecSheet(id),260); }
  if(a==='save'){ if(E.cat) commit(E.cat); }
  if(a==='del'){ const id=E.editId; closeEntry(); delOp(id,null); }
}
function entryInput(ev){ const f=ev.target.dataset.f; if(!f||!E) return; E[f]=ev.target.value; if(f==='date'&&!E.date) E.date=TODAY; renderChips(); $('#amte').textContent=E.editId?'Modifier':E.monthly?(E.type==='income'?'Revenu mensuel':'Frais mensuel'):E.adv?"Payé pour quelqu'un":E.type==='income'?'Revenu':'Dépense'; }
function setType(t){ E.type=t; if(t==='income') E.adv=false; const v=$('#amtv'); v.style.setProperty('--fy',t==='income'?'-16px':'16px'); v.classList.remove('flip'); void v.offsetWidth; v.classList.add('flip'); sound('key'); refreshEntry(); if(E.step==='cat') buildArena(); }
function key(k){
  if(k==='ok'){ if(!cents()){ shakeAmt(); return; } sound('coin'); setStep('cat'); return; }
  let d=E.digits;
  if(k==='back') d=d.slice(0,-1);
  else if(k===','){ if(!d.includes(',')) d=(d||'0')+','; }
  else { const [i,dec]=d.split(','); if(dec!==undefined){ if(dec.length>=2) return; d+=k; } else { if((i||'').length>=6) return; d=(d==='0'?'':d)+k; } }
  E.digits=d; sound('key'); refreshEntry();
  const v=$('#amtv'); v.classList.remove('bump'); void v.offsetWidth; v.classList.add('bump');
}
function bindAmtSwipe(){
  const a=$('#amt'); let y0=null;
  a.addEventListener('pointerdown',e=>{ if(e.target.closest('.chip')) return; y0=e.clientY; });
  a.addEventListener('pointerup',e=>{ if(y0==null||!E) return; const dy=e.clientY-y0; y0=null;
    if(Math.abs(dy)<12){ if(E.step==='cat') setStep('amt'); return; }
    if(E.locked) return; const t=dy<-35?'income':dy>35?'expense':null; if(t&&t!==E.type) setType(t); });
}
function shakeAmt(){ Haptic.play(3,true); const v=$('#amtv'); if(!v) return; v.classList.remove('shake'); void v.offsetWidth; v.classList.add('shake'); }

/* Arène : bulles flottantes + pièce */
function buildArena(){
  const ar=$('#entry:not(.closing) #arena'); if(!ar||!E) return; $$('.bub',ar).forEach(n=>n.remove()); AR={el:null,W:0,H:0};
  const W=ar.clientWidth,H=ar.clientHeight; if(!W||!H) return; const kind=E.type==='income'?'income':'expense';
  const cnt={}; S.ops.forEach(o=>cnt[o.cat]=(cnt[o.cat]||0)+1);
  const list=CATS.filter(c=>c.k===kind).sort((a,b)=>(cnt[b.id]||0)-(cnt[a.id]||0));
  const sc=clamp(Math.min(W/360,H/330),.7,1.2), vf=clamp(H/W*1.05,.95,1.7);
  coin={x:W/2,y:H-44,r:30,drag:false};
  const cx=W/2, cy=(H-84)/2+6;
  B=list.map((c,i)=>{ const r=(i<6?38:29)*sc; const ang=i*2.39996+.6; const rad=Math.sqrt(i+.5)*32*sc;
    return {c,r,hx:cx+Math.cos(ang)*rad*1.45,hy:cy+Math.sin(ang)*rad*vf,x:0,y:0,vx:0,vy:0,ph:Math.random()*6,s:1}; });
  relax(W,H,220);
  B.forEach((b,i)=>{ b.x=b.hx; b.y=b.hy;
    const el=document.createElement('button'); el.className='bub'+(E.cat===b.c.id&&(E.editId||E.preCat)?' cur':''); el.style.cssText=`--c:${b.c.c};width:${b.r*2}px;height:${b.r*2}px;animation-delay:${i*25}ms`;
    el.setAttribute('aria-label',b.c.name); el.innerHTML=`<span class="in"><span class="em" style="font-size:${b.r*.72}px">${ico(b.c)}</span>${b.r>30?`<span class="nm">${b.c.name}</span>`:''}</span>`;
    el.addEventListener('click',()=>{ if(!coin.drag) choose(b); });
    ar.appendChild(el); b.el=el; });
  AR={el:ar,W,H}; placeCoinRest(false); draw(); kick();
}
function relax(W,H,it){
  for(let k=0;k<it;k++){
    for(let i=0;i<B.length;i++){ const a=B[i];
      for(let j=i+1;j<B.length;j++){ const b=B[j]; const dx=b.hx-a.hx,dy=b.hy-a.hy,d=Math.hypot(dx,dy)||.01,min=a.r+b.r+10; if(d<min){const f=(min-d)/2; a.hx-=dx/d*f;a.hy-=dy/d*f;b.hx+=dx/d*f;b.hy+=dy/d*f;} }
      const dx=a.hx-coin.x,dy=a.hy-coin.y,d=Math.hypot(dx,dy)||.01,min=a.r+coin.r+18; if(d<min){a.hx+=dx/d*(min-d);a.hy+=dy/d*(min-d);}
      a.hx=clamp(a.hx,a.r+4,W-a.r-4); a.hy=clamp(a.hy,a.r+4,H-a.r-4); }
  }
}
function placeCoinRest(anim){ const ar=$('#entry:not(.closing) #arena'); if(!ar||!coin) return; coin.x=ar.clientWidth/2; coin.y=ar.clientHeight-44; const co=$('#coin',ar); if(!co) return;
  co.classList.remove('fly'); co.classList.toggle('ret',!!anim); co.style.opacity=''; co.style.transform=`translate(${coin.x-coin.r}px,${coin.y-coin.r}px)`; }
function bindCoin(){
  const co=$('#entry:not(.closing) #coin'); if(!co||co.dataset.b) return; co.dataset.b='1'; let off=[0,0];
  co.addEventListener('pointerdown',e=>{ if(!cents()||!coin) return; kick(); co.setPointerCapture(e.pointerId); const r=$('#arena').getBoundingClientRect(); coin.drag=true; co.classList.remove('ret'); off=[e.clientX-r.left-coin.x,e.clientY-r.top-coin.y]; sound('key'); });
  co.addEventListener('pointermove',e=>{ if(!coin?.drag) return; const r=$('#arena').getBoundingClientRect(); coin.x=clamp(e.clientX-r.left-off[0],coin.r,r.width-coin.r); coin.y=clamp(e.clientY-r.top-off[1],coin.r,r.height-coin.r);
    co.style.transform=`translate(${coin.x-coin.r}px,${coin.y-coin.r}px) scale(1.08)`; const t=target(); B.forEach(b=>b.el.classList.toggle('tgt',b===t)); if(reduce()) draw(); });
  const up=()=>{ if(!coin?.drag) return; const t=target(); B.forEach(b=>b.el.classList.remove('tgt')); setTimeout(()=>{ if(coin) coin.drag=false; },30); if(t) choose(t); else placeCoinRest(true); };
  co.addEventListener('pointerup',up); co.addEventListener('pointercancel',up);
}
function target(){ let best=null,bd=1e9; for(const b of B){ const d=Math.hypot(b.x-coin.x,b.y-coin.y); if(d<b.r+26&&d<bd){bd=d;best=b;} } return best; }
function choose(b){
  if(!E) return; if(!cents()){ setStep('amt'); shakeAmt(); return; }
  if(E.adv&&!E.person.trim()){ placeCoinRest(true); openOpts('person'); toast('Indique qui doit te rembourser'); return; }
  const co=$('#coin'); co.classList.remove('ret'); co.classList.add('fly'); co.style.transform=`translate(${b.x-coin.r}px,${b.y-coin.r}px) scale(.2)`; co.style.opacity='0';
  b.el.classList.remove('gulp'); void b.el.offsetWidth; b.el.classList.add('gulp'); sound('coin');
  const id=b.c.id; setTimeout(()=>commit(id),reduce()?0:300);
}
function loop(){ if(raf) return; const step=t=>{ raf=0; if(!E||!B.length) return; const moving=reduce()?!!(coin&&coin.drag):tick(t); draw(); if(moving) raf=requestAnimationFrame(step); }; raf=requestAnimationFrame(step); }
function kick(){ if(E) E.t0=performance.now(); loop(); }
function tick(t){
  const W=AR.W,H=AR.H; if(!W||!coin) return false; const tg=coin.drag?target():null;
  const amp=Math.max(0,1-(t-(E.t0||t))/3000)*.12;   // la dérive s'éteint en 3 s, puis les bulles se posent
  let maxV=0,maxS=0;
  for(const b of B){ let fx=(b.hx-b.x)*.035, fy=(b.hy-b.y)*.035;
    if(amp){ fx+=Math.sin(t/950+b.ph)*amp; fy+=Math.cos(t/1150+b.ph*1.3)*amp; }
    const dx=b.x-coin.x,dy=b.y-coin.y,d=Math.hypot(dx,dy)||.01;
    if(coin.drag){ if(b===tg){ fx-=dx*.05; fy-=dy*.05; } else if(d<b.r+coin.r+40){ const f=(b.r+coin.r+40-d)*.12; fx+=dx/d*f; fy+=dy/d*f; } }
    for(const o of B){ if(o===b) continue; const ex=b.x-o.x,ey=b.y-o.y,ed=Math.hypot(ex,ey)||.01,mn=b.r+o.r+4; if(ed<mn){ const f=(mn-ed)*.08; fx+=ex/ed*f; fy+=ey/ed*f; } }
    b.vx=(b.vx+fx)*.86; b.vy=(b.vy+fy)*.86; b.x=clamp(b.x+b.vx,b.r,W-b.r); b.y=clamp(b.y+b.vy,b.r,H-b.r);
    const ts=b===tg?1.18:1; b.s+=(ts-b.s)*.2; maxV=Math.max(maxV,Math.abs(b.vx)+Math.abs(b.vy)); maxS=Math.max(maxS,Math.abs(ts-b.s)); }
  return coin.drag||amp>0||maxV>.03||maxS>.002;
}
function draw(){ for(const b of B){ if(!b.el) continue; const tf=`translate(${(b.x-b.r).toFixed(1)}px,${(b.y-b.r).toFixed(1)}px) scale(${b.s.toFixed(3)})`; if(tf!==b.tf){ b.tf=tf; b.el.style.transform=tf; } } }
function resizeArena(){}

function commit(cat){
  if(!E) return; const c=cents(); if(!c) return; if(E.adv&&!E.person.trim()){ openOpts('person'); return; } const cname=CAT[cat].name;
  const mname=E.note.trim()||cname, mday=parseD(E.date||TODAY).getDate();
  const label=E.editId?`Modifié : ${eur(c)} en ${cname}`:E.monthly?`${mname} : ${eur(c)} chaque mois, le ${mday}`:`${E.type==='income'?'+':'−'}${eur(c)} en ${cname}`;
  const snapE={...E,tags:[...E.tags]};
  mutate(label,()=>{
    if(snapE.editId){ const o=S.ops.find(x=>x.id===snapE.editId); if(o) Object.assign(o,{type:snapE.type,amount:c,cat,date:snapE.date||TODAY,pm:snapE.pm,tags:snapE.tags,note:snapE.note.trim()}); }
    else if(snapE.monthly){ const date=snapE.date||TODAY;
      const r={id:uid(),name:mname,type:snapE.type,amount:c,cat,day:mday,pm:snapE.pm,tags:[...snapE.tags],start:date,last:null}; S.recurring.push(r);
      if(date<=TODAY){ S.ops.push({id:uid(),type:r.type,amount:c,cat,date,ca:TODAY,pm:r.pm,tags:[...r.tags],note:r.name,rec:r.id}); r.last=date; } }
    else{ const o={id:uid(),type:snapE.type,amount:c,cat,date:snapE.date||TODAY,ca:TODAY,pm:snapE.pm,tags:snapE.tags,note:snapE.note.trim()}; S.ops.push(o);
      if(snapE.type==='expense'&&snapE.adv&&snapE.person.trim()){ const due=Math.min(parseAmt(snapE.advAmt)||c,c); const r={id:uid(),expenseId:o.id,person:snapE.person.trim(),due,payments:[]}; S.reimb.push(r); o.reimb=r.id; } }
    S.lastPm=snapE.pm;
  });
  closeEntry();
  if(ui.tab==='home'&&snapE.type==='expense'&&ymOf(snapE.date||TODAY)===ui.ym) drip();
  if(snapE.type==='income') sound('register');
}
function drip(){ const w=$('.jar-wrap'); if(!w||reduce()) return; const d=document.createElement('span'); d.className='drip'; w.appendChild(d);
  setTimeout(()=>{ d.remove(); const g=$('.liq-tilt'); if(g){ g.classList.remove('slosh'); void g.getBoundingClientRect(); g.classList.add('slosh'); } sound('drop'); },520); }

/* ---------- Toast ---------- */
let toastT=0;
function toast(msg,undo){ $('#toast')?.remove(); clearTimeout(toastT);
  const t=document.createElement('div'); t.id='toast'; t.setAttribute('role','status'); t.innerHTML=`<span>${esc(msg)}</span>${undo?'<button>Annuler</button>':''}`;
  $('#app').appendChild(t); if(undo) $('button',t).onclick=()=>{t.remove(); undo();}; toastT=setTimeout(()=>t.remove(),undo?5000:2200); }

/* ---------- Confettis ---------- */
function confetti(fromEl){
  if(reduce()) return; const cv=$('#fx'), app=$('#app'); const r=app.getBoundingClientRect(); const dpr=devicePixelRatio||1;
  cv.width=r.width*dpr; cv.height=r.height*dpr; cv.style.width=r.width+'px'; cv.style.height=r.height+'px'; let ctx=null; try{ctx=cv.getContext('2d');}catch(e){} if(!ctx) return; ctx.scale(dpr,dpr);
  let ox=r.width/2, oy=r.height*.35; if(fromEl){ const b=fromEl.getBoundingClientRect(); ox=b.left-r.left+b.width/2; oy=b.top-r.top+b.height/2; }
  const cols=['#FFB86B','#FFD9AE','#8F89FF','#4B44D6','#6FD3A6','#ECECF8'];
  const P=Array.from({length:110},()=>({x:ox,y:oy,vx:(Math.random()-.5)*11,vy:-Math.random()*11-3,w:5+Math.random()*6,h:8+Math.random()*8,a:Math.random()*6,va:(Math.random()-.5)*.4,c:cols[Math.random()*cols.length|0]}));
  const t0=performance.now();
  (function f(t){ const k=(t-t0)/1600; ctx.clearRect(0,0,r.width,r.height); if(k>1) return;
    for(const p of P){ p.vy+=.32; p.vx*=.99; p.x+=p.vx; p.y+=p.vy; p.a+=p.va; ctx.save(); ctx.globalAlpha=1-k*k; ctx.translate(p.x,p.y); ctx.rotate(p.a); ctx.fillStyle=p.c; ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h); ctx.restore(); }
    requestAnimationFrame(f); })(t0);
}

/* ---------- Sons (Web Audio, coupés par défaut) ---------- */
let AC=null;
function ac(){ if(!AC){ try{AC=new (window.AudioContext||window.webkitAudioContext)();}catch(e){} } if(AC&&AC.state==='suspended') AC.resume(); return AC; }
function tone(f,t,d,type='sine',v=.12,f2){ const a=AC,o=a.createOscillator(),g=a.createGain(); o.type=type; o.frequency.setValueAtTime(f,t); if(f2) o.frequency.exponentialRampToValueAtTime(f2,t+d); g.gain.setValueAtTime(v,t); g.gain.exponentialRampToValueAtTime(.0001,t+d); o.connect(g).connect(a.destination); o.start(t); o.stop(t+d+.02); }
function noise(t,d,v=.15,fq=1800){ const a=AC,b=a.createBuffer(1,a.sampleRate*d,a.sampleRate),ch=b.getChannelData(0); for(let i=0;i<ch.length;i++) ch[i]=(Math.random()*2-1)*(1-i/ch.length); const s=a.createBufferSource(); s.buffer=b; const fl=a.createBiquadFilter(); fl.type='bandpass'; fl.frequency.value=fq; const g=a.createGain(); g.gain.value=v; s.connect(fl).connect(g).connect(a.destination); s.start(t); }
/* Retours haptiques. Safari sur iPhone n'a pas d'API de vibration, mais depuis iOS 18 un interrupteur
   <input type=checkbox switch> déclenche le Taptic Engine quand on le bascule. On en bascule un, invisible,
   pendant un geste de l'utilisateur (iOS l'exige). Ailleurs : navigator.vibrate quand il existe. */
const PHONE=/iPhone|iPod/.test(navigator.userAgent);
const Haptic={t:0,
  can(){ return PHONE||typeof navigator.vibrate==='function'; },
  one(){ if(!PHONE){ try{ navigator.vibrate(10); }catch(e){} return; }
    const l=document.createElement('label'), i=document.createElement('input'); i.type='checkbox'; i.setAttribute('switch',''); i.tabIndex=-1;
    l.setAttribute('aria-hidden','true'); l.style.display='none'; l.appendChild(i); l.addEventListener('click',e=>e.stopPropagation());
    document.head.appendChild(l); l.click(); l.remove(); },
  play(n=1,force){ if(!S||S.settings.haptics===false||!this.can()) return; const now=performance.now(); if(!force&&now<this.t) return;
    this.t=now+n*80+60; this.one(); for(let k=1;k<n;k++) setTimeout(()=>this.one(),k*80); } };
const HAPTIC_N={key:1,drop:1,crumple:1,coin:2,register:2};
function sound(k,h=true){ if(h) Haptic.play(HAPTIC_N[k]||1); if(!S.settings.sound) return; const a=ac(); if(!a) return; const t=a.currentTime;
  if(k==='key') tone(660,t,.04,'sine',.05);
  if(k==='coin'){ tone(988,t,.07,'square',.05); tone(1319,t+.07,.22,'square',.05); }
  if(k==='drop') tone(700,t,.18,'sine',.12,180);
  if(k==='register'){ noise(t,.08,.2,3000); tone(1568,t+.06,.12,'triangle',.12); tone(2093,t+.14,.4,'triangle',.12); }
  if(k==='crumple'){ noise(t,.25,.25,1200); noise(t+.08,.2,.2,2400); } }

/* ---------- Navigation et actions ---------- */
const nav=$('#nav');
$('#topbar').addEventListener('click',()=>scr.scrollTo({top:0,behavior:'smooth'}));
new MutationObserver(()=>Chrome.sync()).observe($('#app'),{childList:true});
matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change',()=>Chrome.sync());
if(window.visualViewport){ const vv=window.visualViewport;
  vv.addEventListener('resize',()=>{ const h=Math.round(innerHeight-vv.height-vv.offsetTop); document.documentElement.style.setProperty('--kb',h>80?h+'px':'0px'); }); }
document.addEventListener('focusin',e=>{ const t=e.target; if(!t.matches||!t.matches('input,textarea')||!t.closest('#sheet,#eopt')) return;
  setTimeout(()=>{ if(document.activeElement===t) t.scrollIntoView({block:'center',behavior:reduce()?'auto':'smooth'}); },350); });
document.addEventListener('focusout',()=>setTimeout(()=>{ const a=document.activeElement; if(!(a&&a.matches&&a.matches('input,textarea'))&&(window.scrollY||document.documentElement.scrollTop)) window.scrollTo(0,0); },150));
nav.addEventListener('click',e=>{ const b=e.target.closest('[data-tab]'); if(!b) return; const t=b.dataset.tab; nav.classList.remove('hide');
  if(t===ui.tab){ scr.scrollTo({top:0,behavior:'smooth'}); return; } ui.tab=t; ui.calMode='month'; render(); scr.scrollTop=0; });
// La pilule se cache quand on descend, revient quand on remonte, en haut ou en bas de page
let sDir=0, sStart=0, sLast=0;
scr.addEventListener('scroll',()=>{ $('#topbar').classList.toggle('on',scr.scrollTop>56); },{passive:true});
scr.addEventListener('scroll',()=>{ const y=scr.scrollTop, nd=Math.sign(y-sLast); if(nd&&nd!==sDir){ sDir=nd; sStart=y; } sLast=y;
  const atEnd=scr.scrollHeight-y-scr.clientHeight<6;
  if(y<40||atEnd) nav.classList.remove('hide'); else if(sDir>0&&y-sStart>24) nav.classList.add('hide'); else if(sDir<0&&sStart-y>24) nav.classList.remove('hide'); },{passive:true});
scr.addEventListener('click',e=>{
  if(justDragged) return; const b=e.target.closest('[data-act]'); if(!b) return; const a=b.dataset.act;
  if(a==='prev'||a==='next'){ ui.ym=addMonths(ui.ym,a==='prev'?-1:1); if(ui.tab==='ops'&&ui.opsView==='cal') ui.calSel=ui.ym===CUR?TODAY:`${ui.ym}-01`; render(false); }
  if(a==='settings') openSettings();
  if(a==='budinfo') openBudgetInfo();
  if(a==='catd') openCatSheet(b.dataset.id);
  if(a==='gostats'){ ui.tab='stats'; render(); scr.scrollTop=0; }
  if(a==='backup') exportJSON();
  if(a==='recs') openRecList();
  if(a==='rec') openRecSheet(b.dataset.id);
  if(a==='slosh'){ const g=$('.liq-tilt'); if(g&&!reduce()){ g.classList.remove('slosh'); void g.getBoundingClientRect(); g.classList.add('slosh'); sound('drop'); } }
  if(a==='plant'){ const f=firstYm(), all=S.ops.reduce((x,o)=>x+(o.type==='income'?o.amount:-o.amount),0); toast(f?`${all>=0?'Mis de côté':'Déficit'} depuis ${monthLabel(f)} : ${eur0(Math.abs(all))}`:'Ton épargne totale apparaîtra ici'); }
  if(a==='cat'){ if(reduce()) openCatSheet(b.dataset.id); else { b.classList.add('pop'); sound('key'); setTimeout(()=>{openCatSheet(b.dataset.id); b.classList.remove('pop');},300); } }
  if(a==='edit'){ const o=S.ops.find(x=>x.id===b.dataset.id); if(o) openEntry({op:o}); }
  if(a==='goops'){ ui.tab='ops'; ui.opsView='list'; render(); }
  if(a==='view'){ ui.opsView=b.dataset.v; ui.calMode='month'; if(ymOf(ui.calSel||'')!==ui.ym) ui.calSel=ui.ym===CUR?TODAY:`${ui.ym}-01`; render(false); }
  if(a==='goprog'){ ui.tab='prog'; render(); scr.scrollTop=0; }
  if(a==='checkin'){ sound('coin'); mutate('Journée pointée : rien dépensé',()=>{ (S.checkins=S.checkins||[]).push(TODAY); }); }
  if(a==='bilan') openBilan(b.dataset.ym);
  if(a==='point') doPointage();
  if(a==='addsal') openEntry({monthly:true,type:'income'});
  if(a==='ftype'){ ui.ftype=b.dataset.v; render(false); }
  if(a==='ftag'){ ui.ftag=ui.ftag===b.dataset.v?null:b.dataset.v; render(false); }
  if(a==='day'){ ui.calSel=b.dataset.d; render(false); }
  if(a==='year'){ ui.calMode='year'; render(false); }
  if(a==='month'){ ui.calMode='month'; render(false); $('#calw')?.classList.add('zin'); }
  if(a==='yprev'||a==='ynext'){ ui.ym=addMonths(ui.ym,a==='yprev'?-12:12); render(false); }
  if(a==='pickm'){ ui.ym=b.dataset.ym; ui.calMode='month'; ui.calSel=ui.ym===CUR?TODAY:`${ui.ym}-01`; render(false); $('#calw')?.classList.add('zin'); }
  if(a==='sn'){ ui.statsN=+b.dataset.v; render(false); }
});
// Appui long sur « + » : ouvre directement une avance à un proche
let lp=0; const plusBtn=$('.plus');
plusBtn.addEventListener('pointerdown',()=>{ lp=setTimeout(()=>{ lp=-1; openEntry({type:'reimb'}); },550); });
['pointerup','pointercancel','pointerleave'].forEach(ev=>plusBtn.addEventListener(ev,()=>{ if(lp!==-1){ clearTimeout(lp); lp=0; } }));
plusBtn.addEventListener('click',e=>{ if(lp===-1){ e.stopImmediatePropagation(); lp=0; } },true);
plusBtn.addEventListener('contextmenu',e=>e.preventDefault());
plusBtn.addEventListener('click',()=>openEntry());

// Nouveau jour alors que l'app est restée ouverte : on recharge pour recalculer « aujourd'hui »
document.addEventListener('visibilitychange',()=>{ if(!document.hidden&&ymd(new Date())!==TODAY) location.reload(); });
// Clavier (pratique sur ordinateur) : Échap ferme, chiffres / virgule / Entrée dans la saisie
document.addEventListener('keydown',e=>{
  if(e.target.closest&&e.target.closest('input,textarea,select')){ if(e.key==='Escape') e.target.blur(); return; }
  if($('#story')) return;
  if(e.key==='Escape'){ if(E&&E.opt){ E.opt=false; refreshEntry(); } else if($('#entry:not(.closing)')) closeEntry(); else if($('#sheet')) closeSheet(); return; }
  if(E&&!E.opt&&E.step==='amt'){ if(/^[0-9]$/.test(e.key)) key(e.key); else if(e.key===','||e.key==='.') key(','); else if(e.key==='Backspace') key('back'); else if(e.key==='Enter') key('ok'); }
});
(async()=>{ await load(); applyCalm(); render(); if(firstRun){ if(IN_FRAME){ S=buildDemo(); S.settings.onboarded=true; save(); render(); } else openOnboarding(); } else handleLaunch(); bootExtras(); })();
