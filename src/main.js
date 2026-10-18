import {source,metrics,timeline,hierarchy,gallery} from './data.js';
const $=(s)=>document.querySelector(s);
const $$=(s)=>[...document.querySelectorAll(s)];
$$('[data-file]').forEach(a=>{a.href=source(a.dataset.file);a.target='_blank';a.rel='noopener'});
const menu=$('#menu-toggle'),nav=$('#navigation');
function closeMenu(){nav.classList.remove('open');menu.setAttribute('aria-expanded','false')}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));nav.classList.toggle('open',open)});
nav.addEventListener('click',e=>{if(e.target.closest('a'))closeMenu()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&nav.classList.contains('open')){closeMenu();menu.focus()}});
const observer=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){$$('nav a').forEach(a=>a.classList.toggle('active',a.hash==='#'+entry.target.id))}},{rootMargin:'-15% 0px -65% 0px'});
$$('section[id]').forEach(s=>observer.observe(s));
function keyboardTabs(container){container.addEventListener('keydown',e=>{const vertical=container.getAttribute('aria-orientation')==='vertical';const keys=vertical?['ArrowUp','ArrowDown']:['ArrowLeft','ArrowRight'];if(![...keys,'Home','End'].includes(e.key))return;const tabs=[...container.querySelectorAll('[role=tab]')];const current=tabs.indexOf(document.activeElement);if(current<0)return;e.preventDefault();let next=e.key==='Home'?0:e.key==='End'?tabs.length-1:(current+(e.key===keys[1]?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click()})}
function selectTab(container,tab){container.querySelectorAll('[role=tab]').forEach(b=>{const selected=b===tab;b.setAttribute('aria-selected',String(selected));b.tabIndex=selected?0:-1})}

// Explicitly conceptual visual: no numerical RTL claim is made by this animation.
let step=0,playing=false,arrayTimer=null;
function drawArray(){let markup='<defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="#a4b19a"/></marker></defs>';
 for(let row=0;row<4;row++)for(let col=0;col<4;col++){const x=115+col*88,y=55+row*76,on=step>0&&(row+col)===(step-1)%7;markup+=`<path class="wire" marker-end="url(#arrow)" d="M${x-27} ${y+23}h24"/><path class="wire" marker-end="url(#arrow)" d="M${x+27} ${y-26}v23"/><rect class="pe-tile ${on?'active':''}" x="${x}" y="${y}" width="56" height="48" rx="3"/><text class="${on?'active':''}" x="${x+28}" y="${y+20}" text-anchor="middle">PE</text><text class="${on?'active':''}" x="${x+28}" y="${y+35}" text-anchor="middle">${row},${col}</text>`}
 for(let row=0;row<4;row++)markup+=`<text x="20" y="${83+row*76}">A →</text>`;
 markup+='<text x="250" y="392">↓ C / PARTIAL SUMS</text>';
 $('#systolic').innerHTML=markup;$('#array-step').textContent=`Illustration step ${String(step).padStart(2,'0')}`;
}
function pauseArray(){playing=false;clearInterval(arrayTimer);$('#array-play').textContent='Play dataflow';$('#array-play').setAttribute('aria-pressed','false')}
$('#array-play').addEventListener('click',()=>{if(playing){pauseArray();return}playing=true;$('#array-play').textContent='Pause dataflow';$('#array-play').setAttribute('aria-pressed','true');step++;drawArray();arrayTimer=setInterval(()=>{step=step%28+1;drawArray()},650)});
$('#array-reset').addEventListener('click',()=>{pauseArray();step=0;drawArray()});
document.addEventListener('visibilitychange',()=>{if(document.hidden)pauseArray()});drawArray();

function hierarchySvg(type){let s='<svg viewBox="0 0 520 320" role="img" aria-label="Conceptual '+type+' hierarchy diagram"><rect x="5" y="5" width="510" height="310" fill="#eeeee5"/>';
 if(type==='row'){for(let i=0;i<8;i++)s+=`<rect x="${25+i*61}" y="110" width="48" height="70" fill="#dce3ce" stroke="#a8b79b"/><text x="${49+i*61}" y="150" text-anchor="middle" fill="#455c43" font-size="13">PE ${i===7?'31':i}</text>`;s+='<text x="260" y="75" text-anchor="middle" font-size="13" fill="#455c43">32 Processing Elements → one hardened row</text><text x="260" y="220" text-anchor="middle" font-size="11" fill="#6c7068">Schematic · intermediate PEs omitted</text>'}
 else{const core=type==='core';s+='<rect x="'+(core?110:65)+'" y="28" width="'+(core?300:390)+'" height="260" fill="#e1e7d4" stroke="#9cab8e"/>';for(let i=0;i<32;i++)s+=`<rect x="${core?126:80}" y="${40+i*7.3}" width="${core?268:360}" height="4.5" fill="${i%4===0?'#73886a':'#a3b696'}"/>`;if(core){for(let i=0;i<40;i++){const side=i%2;const y=25+Math.floor(i/2)*14;s+=`<rect x="${side?422:30}" y="${y}" width="65" height="10" fill="#9eaf86"/>`};s+='<text x="260" y="308" text-anchor="middle" font-size="11" fill="#455c43">32 rows + SRAM groups · conceptual, not placement</text>'}else s+='<text x="260" y="308" text-anchor="middle" font-size="11" fill="#455c43">32 rows · FeatureSkew → Array → OutputDeskew</text>'}
 return s+'</svg>'}
function showHierarchy(i){const h=hierarchy[i];const tab=$(`[data-level="${i}"]`);selectTab($('.hierarchy-tabs'),tab);$('#hier-panel').setAttribute('aria-labelledby',tab.id);$('#hier-kind').textContent=h.kind;$('#hier-title').textContent=h.label;$('#hier-description').textContent=h.text;$('#hier-detail').textContent=h.detail;$('#hier-visual').innerHTML=h.type==='pe'?'<img src="./images/pe-3d.png" alt="Actual supplied Processing Element model preview">':hierarchySvg(h.type)}
$$('[data-level]').forEach(b=>b.addEventListener('click',()=>showHierarchy(Number(b.dataset.level))));keyboardTabs($('.hierarchy-tabs'));showHierarchy(0);

$('#timeline').innerHTML=timeline.map((t,i)=>`<button role="tab" id="experiment-${i}" aria-selected="${i===0}" tabindex="${i===0?0:-1}" aria-controls="experiment" data-experiment="${i}">${t.run}<small>${t.title}</small></button>`).join('');
function showExperiment(i){const t=timeline[i];const tab=$(`[data-experiment="${i}"]`);selectTab($('#timeline'),tab);$('#experiment').setAttribute('aria-labelledby',tab.id);$('#experiment').innerHTML=`<p class="eyebrow">${t.status.toUpperCase()} / ${t.run.toUpperCase()}</p><span class="experiment-stat">${t.stat}</span><h3>${t.title}</h3><dl><div><dt>THE PROBLEM</dt><dd>${t.issue}</dd></div><div><dt>THE CHANGE</dt><dd>${t.change}</dd></div><div><dt>WHAT THE RUN SHOWED</dt><dd>${t.result}</dd></div></dl>`}
$$('[data-experiment]').forEach(b=>b.addEventListener('click',()=>showExperiment(Number(b.dataset.experiment))));keyboardTabs($('#timeline'));showExperiment(0);

let visibleGallery=[...gallery.keys()];let currentImage=0;let zoom=1,pan={x:0,y:0};let returnFocus;
function renderGallery(filter='All'){visibleGallery=gallery.flatMap((g,i)=>filter==='All'||g.group===filter?[i]:[]);$('#gallery').innerHTML=visibleGallery.map(i=>{const g=gallery[i];return `<figure><button class="image-button" data-image="${i}" aria-label="Enlarge: ${g.title}"><img src="${g.src}" alt="${g.title}" loading="lazy" width="1405" height="945"></button><figcaption><p class="eyebrow">${g.group.toUpperCase()} / ORIGINAL PROJECT ASSET</p><h3>${g.title}</h3><p>${g.caption}</p><small>${g.origin}</small></figcaption></figure>`}).join('');$('#figure-count').textContent=String(visibleGallery.length).padStart(2,'0')+' FIGURES';$$('[data-image]').forEach(b=>b.addEventListener('click',()=>openImage(Number(b.dataset.image),b)))}
$$('[data-filter]').forEach(b=>b.addEventListener('click',()=>{$$('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b))});renderGallery(b.dataset.filter)}));renderGallery();
function updateTransform(){ $('#lightbox-image').style.transform=`translate(${pan.x}px,${pan.y}px) scale(${zoom})`}
function resetZoom(){zoom=1;pan={x:0,y:0};updateTransform()}
function showImage(i){currentImage=i;const g=gallery[i];$('#lightbox-image').src=g.src;$('#lightbox-image').alt=g.title;$('#lightbox-title').textContent=g.title;$('#lightbox-caption').textContent=g.caption+' Source: '+g.origin;$('#lightbox-counter').textContent=`${visibleGallery.indexOf(i)+1} / ${visibleGallery.length}`;$('#lightbox-prev').disabled=visibleGallery.length<2;$('#lightbox-next').disabled=visibleGallery.length<2;resetZoom()}
function openImage(i,b){returnFocus=b;showImage(i);$('#lightbox').showModal();document.body.classList.add('scroll-lock');$('#lightbox-close').focus()}
function closeImage(){$('#lightbox').close()}
$('#lightbox').addEventListener('close',()=>{document.body.classList.remove('scroll-lock');returnFocus?.focus()});$('#lightbox-close').addEventListener('click',closeImage);
function nextImage(direction){const current=visibleGallery.indexOf(currentImage);showImage(visibleGallery[(current+direction+visibleGallery.length)%visibleGallery.length])}
$('#lightbox-prev').addEventListener('click',()=>nextImage(-1));$('#lightbox-next').addEventListener('click',()=>nextImage(1));
$('#lightbox').addEventListener('keydown',e=>{if(e.key==='ArrowRight'){e.preventDefault();nextImage(1)}if(e.key==='ArrowLeft'){e.preventDefault();nextImage(-1)}});
$('#zoom-in').addEventListener('click',()=>{zoom=Math.min(5,zoom+.5);updateTransform()});$('#zoom-out').addEventListener('click',()=>{zoom=Math.max(1,zoom-.5);if(zoom===1)pan={x:0,y:0};updateTransform()});$('#zoom-reset').addEventListener('click',resetZoom);
const stage=$('#lightbox-stage');let pointerStart=null;
stage.addEventListener('pointerdown',e=>{pointerStart={x:e.clientX,y:e.clientY,pan:{...pan}};stage.setPointerCapture(e.pointerId);e.preventDefault()});stage.addEventListener('pointermove',e=>{if(!pointerStart||zoom<=1)return;pan={x:pointerStart.pan.x+e.clientX-pointerStart.x,y:pointerStart.pan.y+e.clientY-pointerStart.y};updateTransform()});stage.addEventListener('pointerup',e=>{if(pointerStart&&zoom===1&&Math.abs(e.clientX-pointerStart.x)>70)nextImage(e.clientX<pointerStart.x?1:-1);pointerStart=null});stage.addEventListener('pointercancel',()=>pointerStart=null);stage.addEventListener('wheel',e=>{e.preventDefault();zoom=Math.max(1,Math.min(5,zoom-e.deltaY*.002));if(zoom===1)pan={x:0,y:0};updateTransform()},{passive:false});

let a=0,b=1;function logic(){const before=(1-a)&b,after=(1-b)&a;$('#input-a').innerHTML=`A_N <b>${a}</b>`;$('#input-b').innerHTML=`B <b>${b}</b>`;$('#input-a').setAttribute('aria-pressed',String(Boolean(a)));$('#input-b').setAttribute('aria-pressed',String(Boolean(b)));$('#logic-original').value=String(before);$('#logic-swapped').value=String(after);$('#logic-verdict').textContent=before===after?'This input pair agrees. Other pairs expose the functional change.':'Mismatch: the inputs are not interchangeable.'}$('#input-a').addEventListener('click',()=>{a=1-a;logic()});$('#input-b').addEventListener('click',()=>{b=1-b;logic()});logic();
function showResults(key){const tab=$(`[data-result="${key}"]`);selectTab($('.result-tabs'),tab);$('#result-panel').setAttribute('aria-labelledby',tab.id);$('#result-body').innerHTML=metrics[key].map(m=>`<tr><td>${m.name}</td><td>${m.value}</td><td>${m.note}</td><td><span class="evidence-class ${m.status==='Work in progress'?'open':''}">${m.status}</span><a href="${m.source}" target="_blank" rel="noopener" aria-label="Source for ${m.name}">Source ↗</a></td></tr>`).join('')}
$$('[data-result]').forEach(b=>b.addEventListener('click',()=>showResults(b.dataset.result)));keyboardTabs($('.result-tabs'));showResults('physical');

const iframe=$('#pe-model');
function modelLoaded(){try{const doc=iframe.contentDocument;if(!doc?.getElementById('stage'))return;const failed=Boolean(doc.querySelector('.err'));$('#model-status').hidden=true;$('#model-fallback').hidden=!failed;iframe.hidden=failed;if(!failed){const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;const signal=doc.getElementById('sigBtn');if(signal?.getAttribute('aria-pressed')==='true')signal.click();if(reduced){const play=doc.getElementById('playBtn');if(play?.getAttribute('aria-pressed')==='true')play.click();const spin=doc.getElementById('optSpin');if(spin?.checked)spin.click()}}}catch{$('#model-status').textContent='Open the standalone viewer if the embedded model is unavailable.'}}
iframe.addEventListener('load',modelLoaded);if(iframe.contentDocument?.readyState==='complete')modelLoaded();
$('#model-fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await $('#model-shell').requestFullscreen()}catch{$('#model-status').hidden=false;$('#model-status').textContent='Fullscreen unavailable here. Use the standalone viewer link below.'}});
document.addEventListener('fullscreenchange',()=>{$('#model-fullscreen').textContent=document.fullscreenElement?'Exit fullscreen ↙':'Fullscreen ↗'});
$('#viewer-exit').addEventListener('click',()=>document.exitFullscreen());
iframe.addEventListener('load',()=>{iframe.contentDocument?.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.fullscreenElement)document.exitFullscreen()})});
