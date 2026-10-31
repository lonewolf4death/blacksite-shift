import { GameScene } from './scene3d.js';
import { BUILD_VERSION, classes, weapons, weaponNotes, enemyIntel, enemyStats, upgrades, stages, talents, grafts, workOrders, floorHeightAt } from './shared.js';

const $=id=>document.getElementById(id);
const canvas=$('game');
const defaults={sensitivity:.8,adsSensitivity:65,fov:82,volume:70,quality:85,shake:70,bob:70,invert:false,reducedFlashes:false};
let settings={...defaults};
try{settings={...settings,...JSON.parse(localStorage.getItem('blacksite-settings')||'{}')};}catch{}
document.documentElement.classList.toggle('reduce-flashes',!!settings.reducedFlashes);
const view=new GameScene(canvas,settings);
window.addEventListener('resize',()=>view.resize());

let ws=null,state=null,map=null,myId=null,roomCode='',autoStart=false,lastPhase='',activeCards='',selectionTab='augment',lastStage=-1,lastLayout=-1,lastWave=-1,lastStationSignature='';
let seenPingIds=new Set(),seenThreats=new Set();
let reconnectToken='',reconnectUrl='',reconnectDeadline=0,reconnectAttempts=0,reconnectTimer=0,reconnecting=false;
let position={x:12.5,y:12.5,a:-Math.PI/2,pitch:0,initialized:false};
let keys={},mouseDown=false,mouseRight=false,fallbackAim=false,settingsOpen=false,manualOpen=false;
let velocity={x:0,y:0},jumpHeight=0,jumpVelocity=0,grounded=true,eyeHeight=1.65;
let dashUntil=0,lastDash=-100,slideUntil=0,lastSlide=-100,landingKick=0;
let recoil=0,aimKick=0,muzzle=0,bob=0,shake=0,lastMove=0,lastFire=0,lastFrame=performance.now();
let lastReloadWindow=false;
const recoilProfiles={carbine:[.022,.16],scatter:[.115,.38],smg:[.017,.11],pulse:[.062,.3],rail:[.12,.4],launcher:[.09,.34],arcgun:[.024,.14],cryo:[.033,.2],saw:[.055,.26],burst:[.046,.28],harpoon:[.105,.37],gravity:[.08,.32]};
const visualRecoil={carbine:.32,scatter:.72,smg:.22,pulse:.48,rail:.68,launcher:.56,arcgun:.3,cryo:.34,saw:.46,burst:.38,harpoon:.62,gravity:.55};
let lastReviveSend=0;
let toastTimer=0,hitTimer=0,introTimer=0,audioCtx=null,noiseBuffer=null;
let ambienceGain=null,ambienceDrone=null,ambienceUndertone=null,ambienceFilter=null,lastAmbienceAccent=0;
let selectedClass=localStorage.getItem('blacksite-class') in classes ? localStorage.getItem('blacksite-class') : 'vanguard';
const upgradeById=Object.fromEntries(upgrades.map(u=>[u.id,u]));
const graftById=Object.fromEntries(grafts.map(g=>[g.id,g]));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function telegraphGap(e,p){
  const t=e.telegraph;if(!t)return Infinity;
  if(['beam','charge','snipe'].includes(t.kind)){
    const vx=t.x-e.x,vy=t.y-e.y,denom=vx*vx+vy*vy||1;
    const u=clamp(((p.x-e.x)*vx+(p.y-e.y)*vy)/denom,0,1);
    return Math.hypot(p.x-e.x-u*vx,p.y-e.y-u*vy)-(t.kind==='beam'?(t.radius||.6)+.28:.85);
  }
  return Math.hypot(t.x-p.x,t.y-p.y)-(['blast','press','coldPulse','slam'].includes(t.kind)?t.radius+.25:1.4);
}
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const me=()=>state?.players?.find(p=>p.id===myId);
const operating=()=>state?.phase==='combat'?state.machines?.find(m=>m.operatorId===myId)||null:null;
function send(data){if(ws?.readyState===WebSocket.OPEN)ws.send(JSON.stringify(data));}
function toast(message){const e=$('toast');e.textContent=message;e.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>e.classList.remove('show'),2000);}
function sound(freq=120,duration=.12,volume=.05,type='sawtooth'){
  if(settings.volume<=0)return;
  try{
    audioCtx||=new(window.AudioContext||window.webkitAudioContext)();
    const osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),t=audioCtx.currentTime;
    osc.type=type;osc.frequency.setValueAtTime(freq,t);osc.frequency.exponentialRampToValueAtTime(Math.max(25,freq*.35),t+duration);
    gain.gain.setValueAtTime(volume*settings.volume/100,t);gain.gain.exponentialRampToValueAtTime(.001,t+duration);
    osc.connect(gain).connect(audioCtx.destination);osc.start();osc.stop(t+duration);
  }catch{}
}
function updateAmbience(){
  if(!audioCtx||audioCtx.state!=='running')return;
  if(!ambienceGain){
    const drone=audioCtx.createOscillator(),undertone=audioCtx.createOscillator(),filter=audioCtx.createBiquadFilter();
    ambienceGain=audioCtx.createGain();ambienceGain.gain.value=0;
    drone.type='sawtooth';drone.frequency.value=49;undertone.type='triangle';undertone.frequency.value=49.4;filter.type='lowpass';filter.frequency.value=115;
    drone.connect(filter);undertone.connect(filter);filter.connect(ambienceGain).connect(audioCtx.destination);drone.start();undertone.start();
    ambienceDrone=drone;ambienceUndertone=undertone;ambienceFilter=filter;
  }
  const stage=state?.stageIndex||0,tones=[49,41.2,55],undertones=[49.4,41.8,55.8],cuts=[115,95,138];
  ambienceDrone.frequency.setTargetAtTime(tones[stage],audioCtx.currentTime,.8);
  ambienceUndertone.frequency.setTargetAtTime(undertones[stage],audioCtx.currentTime,.8);
  ambienceFilter.frequency.setTargetAtTime(cuts[stage],audioCtx.currentTime,.8);
  const target=state?.phase==='combat' ? .012*settings.volume/100 : 0;
  ambienceGain.gain.setTargetAtTime(target,audioCtx.currentTime,.6);
  if(state?.phase==='combat'&&performance.now()-lastAmbienceAccent>5700+((state.wave||0)%3)*650){
    lastAmbienceAccent=performance.now();industrialSound('machinery',.38);
  }
}
function industrialSound(kind='machinery',scale=1){
  if(settings.volume<=0)return;
  try{
    audioCtx||=new(window.AudioContext||window.webkitAudioContext)();
    if(!noiseBuffer){noiseBuffer=audioCtx.createBuffer(1,Math.ceil(audioCtx.sampleRate*.3),audioCtx.sampleRate);const samples=noiseBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;}
    const t=audioCtx.currentTime,duration=kind==='machinery'?.48:kind==='warning'?.36:.66,master=settings.volume/100*scale;
    const base=kind==='warning'?225:kind==='machinery'?87:62;
    const osc=audioCtx.createOscillator(),gain=audioCtx.createGain();osc.type='square';osc.frequency.setValueAtTime(base,t);osc.frequency.exponentialRampToValueAtTime(Math.max(32,base*.56),t+duration);
    gain.gain.setValueAtTime(.026*master,t);gain.gain.exponentialRampToValueAtTime(.0001,t+duration);osc.connect(gain).connect(audioCtx.destination);osc.start(t);osc.stop(t+duration);
    const noise=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),noiseGain=audioCtx.createGain();
    noise.buffer=noiseBuffer;filter.type='bandpass';filter.frequency.value=kind==='warning'?850:kind==='machinery'?330:450;filter.Q.value=.7;
    noiseGain.gain.setValueAtTime(.024*master,t);noiseGain.gain.exponentialRampToValueAtTime(.0001,t+duration*.8);
    noise.connect(filter).connect(noiseGain).connect(audioCtx.destination);noise.start(t);noise.stop(t+duration*.8);
  }catch{}
}
function weaponSound(kind,scale=1){
  if(settings.volume<=0)return;
  try{
    audioCtx||=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    if(!noiseBuffer){
      noiseBuffer=audioCtx.createBuffer(1,Math.ceil(audioCtx.sampleRate*.3),audioCtx.sampleRate);
      const samples=noiseBuffer.getChannelData(0);for(let i=0;i<samples.length;i++)samples[i]=Math.random()*2-1;
    }
    const profiles={carbine:[180,.095,.035,2200],scatter:[94,.25,.11,820],smg:[230,.07,.025,2600],pulse:[260,.19,.065,1300],
      rail:[390,.27,.12,3200],launcher:[72,.31,.14,650],arcgun:[510,.13,.04,3400],cryo:[300,.14,.055,1700],saw:[135,.19,.07,1100],burst:[210,.11,.055,2200],
      harpoon:[115,.27,.105,1150],gravity:[165,.34,.09,740]};
    const [freq,duration,body,cutoff]=profiles[kind]||profiles.carbine,t=audioCtx.currentTime,master=settings.volume/100*scale;
    const tone=audioCtx.createOscillator(),toneGain=audioCtx.createGain();
    tone.type=kind==='arcgun'||kind==='cryo'?'triangle':'sawtooth';tone.frequency.setValueAtTime(freq,t);
    tone.frequency.exponentialRampToValueAtTime(Math.max(35,freq*(kind==='rail'?1.7:.28)),t+duration);
    toneGain.gain.setValueAtTime(body*master,t);toneGain.gain.exponentialRampToValueAtTime(.001,t+duration);
    tone.connect(toneGain).connect(audioCtx.destination);tone.start(t);tone.stop(t+duration);
    const noise=audioCtx.createBufferSource(),filter=audioCtx.createBiquadFilter(),noiseGain=audioCtx.createGain();
    noise.buffer=noiseBuffer;filter.type='lowpass';filter.frequency.value=cutoff;
    noiseGain.gain.setValueAtTime(body*.55*master,t);noiseGain.gain.exponentialRampToValueAtTime(.001,t+duration*.75);
    noise.connect(filter).connect(noiseGain).connect(audioCtx.destination);noise.start(t);noise.stop(t+duration*.75);
    const mechanism=audioCtx.createOscillator(),mechanismGain=audioCtx.createGain();
    const energy=['pulse','arcgun','cryo','gravity'].includes(kind);
    mechanism.type=energy?'sine':'square';
    mechanism.frequency.setValueAtTime(energy?freq*.72:kind==='scatter'||kind==='harpoon'?690:1100,t);
    mechanism.frequency.exponentialRampToValueAtTime(energy?freq*1.6:180,t+(energy?.07:.025));
    mechanismGain.gain.setValueAtTime(body*(energy?.22:.18)*master,t);
    mechanismGain.gain.exponentialRampToValueAtTime(.0001,t+(energy?.07:.025));
    mechanism.connect(mechanismGain).connect(audioCtx.destination);mechanism.start(t);mechanism.stop(t+(energy?.07:.025));
    if(['scatter','rail','launcher','saw','harpoon','gravity'].includes(kind)){
      const sub=audioCtx.createOscillator(),subGain=audioCtx.createGain();sub.type='triangle';sub.frequency.setValueAtTime(kind==='rail'?110:kind==='scatter'?68:55,t);
      sub.frequency.exponentialRampToValueAtTime(34,t+duration*.8);subGain.gain.setValueAtTime(body*.38*master,t);subGain.gain.exponentialRampToValueAtTime(.0001,t+duration*.8);
      sub.connect(subGain).connect(audioCtx.destination);sub.start(t);sub.stop(t+duration*.8);
    }
  }catch{}
}
function waveIntro(kicker,title,detail){
  $('intro-kicker').textContent=kicker;$('intro-title').textContent=title;$('intro-detail').textContent=detail;
  const panel=$('wave-intro');panel.classList.add('show');clearTimeout(introTimer);introTimer=setTimeout(()=>panel.classList.remove('show'),2600);
}
function loadSettingsUI(){
  const fields=[['sensitivity',v=>Number(v).toFixed(2)],['adsSensitivity',v=>`${v}%`],['fov',v=>`${v}°`],['volume',v=>`${v}%`],['quality',v=>`${v}%`],['shake',v=>`${v}%`],['bob',v=>`${v}%`]];
  for(const [key,format] of fields){
    const input=$('setting-'+key),output=$('value-'+key);
    input.value=settings[key];output.value=format(settings[key]);
    input.addEventListener('input',()=>{
      settings[key]=Number(input.value);output.value=format(settings[key]);
      localStorage.setItem('blacksite-settings',JSON.stringify(settings));
      if(key==='quality')view.resize();
    });
  }
  $('setting-invert').checked=!!settings.invert;
  $('setting-invert').addEventListener('change',e=>{settings.invert=e.target.checked;localStorage.setItem('blacksite-settings',JSON.stringify(settings));});
  $('setting-reducedFlashes').checked=!!settings.reducedFlashes;
  $('setting-reducedFlashes').addEventListener('change',e=>{settings.reducedFlashes=e.target.checked;document.documentElement.classList.toggle('reduce-flashes',settings.reducedFlashes);localStorage.setItem('blacksite-settings',JSON.stringify(settings));});
}
loadSettingsUI();
function openSettings(){
  if(operating())send({type:'machineInput',action:'abort'});
  settingsOpen=true;keys={};mouseDown=false;mouseRight=false;
  $('settings').classList.remove('hidden');
  if(document.pointerLockElement)document.exitPointerLock();
}
function closeSettings(){settingsOpen=false;$('settings').classList.add('hidden');updateUI();}
$('settings-menu').onclick=openSettings;$('settings-hud').onclick=openSettings;$('settings-close').onclick=closeSettings;
function manualCard(title,meta,body){return `<article class="manual-card"><div><strong>${title}</strong><span>${meta}</span></div><p>${body}</p></article>`;}
function manualSection(section='weapons'){
  document.querySelectorAll('[data-manual]').forEach(button=>button.classList.toggle('active',button.dataset.manual===section));
  let html='';
  if(section==='weapons'){
    html='<h2>ARMORY <em>CATALOG.</em></h2><p class="manual-intro">Every shot is a simulated projectile. Magazines reload from unlimited reserve. Base values appear below; augments and talents modify them during a run.</p>';
    html+=Object.entries(weapons).map(([id,w])=>{
      const stats=[`${w.pellets?`${w.damage} × ${w.pellets}`:w.damage} DMG`,` ${(1/w.interval).toFixed(2)} TRIGGERS/S`,`${w.mag} MAG`,`${w.range} M RANGE`,`${w.speed} M/S BOLT`,`${w.reload.toFixed(2)} S RELOAD`];
      return manualCard(w.name,stats.join(' · '),`${w.trait} ${weaponNotes[id]}`);
    }).join('');
  }else if(section==='effects'){
    html='<h2>COMBAT <em>EFFECTS.</em></h2><p class="manual-intro">Timing and geometry matter. Lines of sight, projectile travel and target spacing can change the outcome of a shot.</p>';
    const effects=[
      ['FIRE / BURN','3 S · 0.6 S TICKS','Base burn deals 4 damage per tick. New hits refresh the 3 s timer. EMBER COIL adds 3 damage per tick per extra stack. Damage scales with weapon damage modifiers.'],
      ['TOXIN','2.4 S · 0.6 S TICKS','Needler poison deals 3 damage per tick. New hits refresh duration; they do not stack separate poison instances. CAUSTIC NEEDLES adds 60% poison damage.'],
      ['FROST / SLOW','2 S','Slowed enemies move at 62% speed. Additional CRYO JACKET stacks lower that speed by 12 percentage points, to a minimum of 25%. SHATTER ENGINE adds 25% direct hit damage per stack against slowed targets.'],
      ['SHOCK / CHAIN','3.5 M REACH','Tesla Spindle chains on every hit. ARC RELAY grants a 22% chain chance per stack, capped at 75%, to other weapons. Chains deal 55% of the source hit and need line of sight.'],
      ['FIRE + TOXIN','2.2 M REACTION · 1.5 S SOURCE COOLDOWN','When a target is both burning and poisoned, it detonates for 22 damage to nearby hostiles. VOLATILE MIX adds 18 reaction damage per stack.'],
      ['SHOCK + FROST','3.3 M CONDUCTION · 2 S SOURCE COOLDOWN','Shock striking a slowed source jumps to up to two nearby hostiles for 13 damage each, slowing them for 1.6 s to at most 70% speed.'],
      ['CRITICAL HITS','1.8× DIRECT DAMAGE','FAULT FINDER adds 12 percentage points of crit chance per stack. TRIAD BURST always critically hits with its center round.'],
      ['PRECISION RELOAD','55–75% OF RELOAD','Press R again in the highlighted middle window. Reload finishes in 0.12 s and your next shot deals 20% extra damage. SIPHON HALO exchanges that bonus for a 22-damage nearby pulse and 3 s skill cooldown reduction.'],
      ['OVERTIME','SQUAD VOTE','The terminal shows the hazard and reward before the next encounter. A tie stays on the stable route. The selected protocol lasts one encounter; Overtime grants an extra augment draft on clear.']
    ];
    html+=effects.map(x=>manualCard(...x)).join('');
    html+='<h3>CONTRACT WORK ORDERS</h3>';
    html+=Object.values(workOrders).map(order=>manualCard(order.name,'OPTIONAL / ONE PER ENCOUNTER',order.detail)).join('');
    html+=manualCard('SECTOR ACCOUNT','2 CREDITS / BOSS CLEAR','A completed work order earns one sector credit and removes one contract strain. Two credits by the sector boss clear pay one extra personal augment draft to every survivor. A missed order adds one contract strain, capped at two. Each point authorizes one extra reinforcement in the next encounter; succeeding later removes one. Contract strain persists between sectors, while credit resets at each new sector.');
    html+=manualCard('MACHINE CALIBRATION','F CONNECT / A-D SELECT / SPACE SEAL / F CANCEL','Bays can have three short Valve Cascade stations, two Circuit Bridge stations, or one difficult Pressure Balance station. The operator cannot shoot or move while connected, but combat continues. Valve Cascade routes three marked valves with a contactor recovery between seals. Circuit Bridge requires three channel selections timed to the moving amber window. Pressure Balance requires four targets held steady for 1.7 s each while the system drifts every 2.4 s. Damage interrupts the current hold; leaving reach or being downed cancels. Each station has its own 17 s cooldown and a 1.25 s marked warning before discharge.');
  }else if(section==='classes'){
    html='<h2>CREW <em>ROLES.</em></h2><p class="manual-intro">Skills have longer cooldowns and shape when the crew pushes, holds or rescues. Class talents are earned in order within their branch.</p>';
    html+=Object.values(classes).map(c=>manualCard(c.name,`${c.skill} · ${c.cooldown} S COOLDOWN`,c.skillDetail)).join('');
    html+='<h3>CLASS TALENTS</h3>';
    html+=Object.entries(talents).flatMap(([id,branches])=>branches.flatMap(b=>b.nodes.map((n,i)=>manualCard(n.name,`${classes[id].name} / ${b.branch} / TIER ${i+1}`,n.detail)))).join('');
    html+='<h3>BOSS GRAFTS</h3>'+grafts.map(g=>manualCard(g.name,g.kind,g.detail)).join('');
  }else if(section==='augments'){
    html='<h2>AUGMENT <em>INDEX.</em></h2><p class="manual-intro">A draft changes one system at a time. Multiple copies stack unless the description says otherwise.</p>';
    html+=upgrades.map(u=>manualCard(u.name,`${u.rarity} / ${u.kind}${u.classId?` / ${classes[u.classId].name}`:''}`,u.detail)).join('');
  }else{
    html='<h2>THREAT <em>REGISTER.</em></h2><p class="manual-intro">Base HP is for wave one with one crew member. Normal enemy HP grows 21% per wave and 25% per extra connected crew member. Boss HP grows 50% per extra crew member. Target the unit that controls space first.</p>';
    html+=Object.entries(enemyIntel).map(([id,e])=>manualCard(e.name,`${enemyStats[id].hp} BASE HP · ${enemyStats[id].damage} HIT · ${enemyStats[id].speed} M/S · ${stages.filter(s=>s.enemies.includes(id)||s.boss===id).map(s=>s.name).join(' / ')}`,e.detail)).join('');
  }
  $('manual-content').innerHTML=html;$('manual-content').scrollTop=0;
}
function openManual(section='weapons'){
  if(settingsOpen)closeSettings();
  if(operating())send({type:'machineInput',action:'abort'});
  manualOpen=true;keys={};mouseDown=false;mouseRight=false;
  manualSection(section);$('manual').classList.remove('hidden');
  if(document.pointerLockElement)document.exitPointerLock();
}
function closeManual(){manualOpen=false;$('manual').classList.add('hidden');updateUI();}
$('manual-menu').onclick=()=>openManual();$('manual-hud').onclick=()=>openManual();$('manual-upgrade').onclick=()=>openManual('augments');$('manual-close').onclick=closeManual;
document.querySelectorAll('[data-manual]').forEach(button=>button.onclick=()=>manualSection(button.dataset.manual));
function classDetail(classId){
  const c=classes[classId],w=weapons[c.weapon];
  const damage=w.pellets?`${w.damage} × ${w.pellets}`:String(w.damage);
  const stats=[['DAMAGE',damage],['FIRE RATE',`${(1/w.interval).toFixed(1)}/s`],['MAGAZINE',w.mag],['RANGE',`${w.range} m`],['RELOAD',`${w.reload.toFixed(2)} s`],['BOLT SPEED',`${w.speed} m/s`]];
  const crewUse={vanguard:'Hold a marked lane while allies cross; LONG WATCH can draw nearby attacks.',breacher:'Push enemies into a machine zone, then clear the warning area together.',runner:'Use speed to flank a sniper, spread poison, and return to the squad.',medic:'Group near a wounded ally before Rally; FIELD SURGE can finish nearby reloads.'};
  return `<div class="detail-head"><span>SELECTED LOADOUT</span><strong>${c.weaponName}</strong></div><div class="detail-stats">${stats.map(([label,value])=>`<div><small>${label}</small><b>${value}</b></div>`).join('')}</div><div class="detail-trait">${w.trait}</div><div class="detail-skill"><span>E · ${c.skill} <small>${c.cooldown}S COOLDOWN</small></span><p>${c.skillDetail}</p><small>CREW USE · ${crewUse[classId]}</small><small>TALENT PATHS · ${talents[classId].map(b=>b.branch).join(' / ')}</small></div>`;
}
function selectClass(classId){
  if(!classes[classId])return;
  selectedClass=classId;localStorage.setItem('blacksite-class',classId);
  document.querySelectorAll('[data-class]').forEach(button=>{
    const active=button.dataset.class===classId;
    button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));
  });
  $('class-detail-menu').innerHTML=classDetail(classId);
  $('class-detail-lobby').innerHTML=classDetail(classId);
  if(state?.phase==='lobby')send({type:'class',classId});
}
document.querySelectorAll('[data-class]').forEach(button=>button.onclick=()=>selectClass(button.dataset.class));
selectClass(selectedClass);

function returnToMenu(message){
  clearTimeout(reconnectTimer);reconnecting=false;reconnectDeadline=0;reconnectAttempts=0;reconnectToken='';reconnectUrl='';autoStart=false;
  $('menu').classList.remove('hidden');$('hud').classList.add('hidden');
  $('lobby').classList.add('hidden');$('upgrade').classList.add('hidden');$('gameover').classList.add('hidden');
  $('menu-error').textContent=message||'CONNECTION LOST';
  myId=null;state=null;map=null;lastStage=-1;lastLayout=-1;lastWave=-1;lastPhase='';activeCards='';seenPingIds.clear();seenThreats.clear();position.initialized=false;
  document.documentElement.style.setProperty('--acid','#d6ec53');
  if(document.pointerLockElement)document.exitPointerLock();
}
function connect(code='',startImmediately=false,resume=false){
  if(!resume){
    clearTimeout(reconnectTimer);reconnectDeadline=0;reconnectAttempts=0;reconnecting=false;reconnectToken='';
    $('menu-error').textContent='';autoStart=startImmediately;seenPingIds.clear();
  }
  if(ws&&ws.readyState<=1)ws.close();
  let protocol=location.protocol==='https:'?'wss':'ws',host=location.host;
  if(!resume&&code&&$('host-input').value.trim()){
    try{
      const raw=$('host-input').value.trim();
      const parsed=new URL(raw.includes('://')?raw:`http://${raw}`);
      if(!['http:','https:','ws:','wss:'].includes(parsed.protocol))throw new Error('invalid protocol');
      protocol=['https:','wss:'].includes(parsed.protocol)?'wss':'ws';
      host=`${parsed.hostname}:${parsed.port||3000}`;
    }catch{$('menu-error').textContent='ENTER A VALID HOST IP OR ADDRESS';return;}
  }
  const url=resume?reconnectUrl:`${protocol}://${host}/ws`;
  const socket=new WebSocket(url);ws=socket;
  socket.onopen=()=>socket.send(JSON.stringify({type:'join',code:resume?roomCode:code,name:$('name-input').value,
    classId:selectedClass,version:BUILD_VERSION,reconnectToken:resume?reconnectToken:undefined}));
  socket.onmessage=event=>{
    let data;try{data=JSON.parse(event.data);}catch{return;}
    if(data.type==='error'){
      $('menu-error').textContent=data.message;
      if(resume){reconnectToken='';reconnectDeadline=0;}
      socket.close();return;
    }
    if(data.type==='welcome'){
      reconnectToken=data.reconnectToken||'';reconnectUrl=url;reconnectDeadline=0;reconnectAttempts=0;reconnecting=false;clearTimeout(reconnectTimer);
      myId=data.id;roomCode=data.code;map=data.map;position.initialized=false;
      view.buildWorld(map,0,[]);lastStage=0;lastLayout=0;lastStationSignature='';lastWave=-1;velocity.x=0;velocity.y=0;jumpHeight=0;
      $('menu').classList.add('hidden');$('hud').classList.remove('hidden');
      $('room-code').textContent=roomCode;$('lobby-code').firstChild.textContent=roomCode+' ';
      if(data.resumed)toast('SIGNAL RESTORED · BUILD RECOVERED');
      if(autoStart){send({type:'start'});autoStart=false;}
      return;
    }
    if(data.type==='state'){
      data.receivedAt=performance.now()/1000;state=data;const p=me();
      const activePings=new Set((data.pings||[]).map(ping=>ping.id));
      for(const ping of data.pings||[])if(!seenPingIds.has(ping.id)&&ping.byId!==myId){
        sound(ping.kind==='danger'?870:590,.13,.035,'triangle');
        if(ping.kind==='danger')toast(`${ping.name} // DANGER PING`);
      }
      seenPingIds=activePings;
      const activeThreats=new Set(data.enemies.filter(e=>e.telegraph).map(e=>`${e.id}:${e.telegraph.kind}`));
      for(const e of data.enemies)if(e.telegraph){const key=`${e.id}:${e.telegraph.kind}`;if(!seenThreats.has(key)&&p&&telegraphGap(e,p)<4)industrialSound('warning',['blast','press','beam','coldPulse','slam'].includes(e.telegraph.kind)?.9:.5);}
      seenThreats=activeThreats;
      const stationSignature=(data.machines||[]).map(m=>`${m.id}:${m.x}:${m.y}:${m.mode}`).join('|');
      if(data.layoutId!==lastLayout||data.stageIndex!==lastStage||stationSignature!==lastStationSignature){map=data.grid;lastStage=data.stageIndex;lastLayout=data.layoutId;lastStationSignature=stationSignature;view.buildWorld(map,lastStage,data.machines||[]);document.documentElement.style.setProperty('--acid',stages[lastStage].color);}
      const newWave=data.phase==='combat'&&data.wave!==lastWave;
      if(p&&(newWave||!position.initialized||!free(position.x,position.y)||Math.hypot(position.x-p.x,position.y-p.y)>1.25)){
        position.x=p.x;position.y=p.y;position.a=p.a;position.initialized=true;velocity.x=velocity.y=0;
        if(newWave){position.pitch=0;aimKick=0;jumpHeight=0;jumpVelocity=0;grounded=true;}
      }
      if(newWave)lastWave=data.wave;
      updateUI();return;
    }
    if(data.type==='hurt'){
      $('hurt-flash').classList.add('active');setTimeout(()=>$('hurt-flash').classList.remove('active'),160);
      shake=.08;sound(68,.2,.08);return;
    }
    if(data.type==='damage'){
      for(const hit of data.hits)view.damageNumber(hit);
      $('hitmarker').classList.add('active');clearTimeout(hitTimer);
      $('hitmarker').classList.toggle('critical',data.hits.some(hit=>hit.crit));
      $('hitmarker').classList.toggle('marked',data.hits.some(hit=>hit.marked));
      $('hitmarker').classList.toggle('armored',data.hits.some(hit=>hit.armored));
      $('hitmarker').classList.toggle('staggered',data.hits.some(hit=>hit.staggered));
      hitTimer=setTimeout(()=>$('hitmarker').classList.remove('active','critical','marked','armored','staggered'),130);
      sound(data.hits.some(hit=>hit.staggered)?190:data.hits.some(hit=>hit.crit)?780:data.hits.some(hit=>hit.marked)?920:data.hits.some(hit=>hit.armored)?330:510,.085,data.hits.some(hit=>hit.staggered)?.052:data.hits.some(hit=>hit.crit)?.041:.027,'square');
      return;
    }
    if(data.type==='fx'){
      view.skillEffect(data.kind,data.x,data.y);
      if(['explosion','gravityBlast','weldBeam','wardenPress','coldPulse','bossPurge','bruteSlam','ramCrash','ramHit','tether','markBreak','combustion','shrapnel','kinetic','siphon','conduction','machineShear','machinePurge','machineArc','sapperBlast','bossShear','coolantLance','reactorPress','bossOverdrive','stagger'].includes(data.kind)){const distance=Math.hypot(position.x-data.x,position.y-data.y);sound(data.kind==='machinePurge'||data.kind==='coldPulse'||data.kind==='bossPurge'||data.kind==='coolantLance'||data.kind==='gravityBlast'?320:data.kind==='machineArc'||data.kind==='conduction'?520:data.kind==='kinetic'||data.kind==='tether'||data.kind==='ramCrash'||data.kind==='stagger'?115:74,.3,.075/(1+distance*.12));if(['sapperBlast','wardenPress','weldBeam','coldPulse','bossPurge','bruteSlam','ramCrash','ramHit','machineShear','machinePurge','machineArc','bossShear','coolantLance','reactorPress','bossOverdrive','stagger'].includes(data.kind))industrialSound('impact',1/(1+distance*.12));}
      if(data.kind==='salvage')sound(760,.24,.042,'triangle');
      if(data.kind==='machineArm'){sound(610,.45,.045,'square');industrialSound('warning',.75);}
      if(data.kind==='machineHandle'){sound(210,.16,.035,'square');industrialSound('impact',.22);}
      if(data.kind==='machineAbort')sound(130,.13,.018,'triangle');
      if(data.kind==='machineTick')sound(340,.055,.016,'square');
      if(data.kind==='machineStep')sound(710,.2,.033,'triangle');
      if(data.kind==='machineError')sound(120,.22,.035,'sawtooth');
      if(data.kind==='bossOverdrive'){sound(144,.6,.09,'sawtooth');setTimeout(()=>sound(108,.72,.085,'sawtooth'),180);}
      if(data.kind==='coolantLance')sound(490,.34,.045,'sine');
      if(data.kind==='bossShear'||data.kind==='reactorPress')sound(84,.45,.07,'sawtooth');
      if(data.kind==='spawn'&&Math.hypot(position.x-data.x,position.y-data.y)<10)sound(180,.24,.023,'triangle');
      if(data.kind==='heal'&&Math.hypot(position.x-data.x,position.y-data.y)<5)sound(740,.19,.035,'sine');
      return;
    }
    if(data.type==='shot'){
      if(data.id!==myId){view.remoteShot(data.x,data.y);weaponSound(data.weapon,.25/(1+Math.hypot(position.x-data.x,position.y-data.y)*.12));}
      return;
    }
    if(data.type==='skill'){
      if(data.id===myId){toast(classes[data.classId].skill);sound(data.classId==='breacher'?90:440,.28,.07);if(data.classId==='runner')lastDash=-100;}
      view.skillEffect(data.classId,data.x,data.y);
      return;
    }
    if(data.type==='reload'){toast('RELOADING...');sound(205,.11,.03,'square');return;}
    if(data.type==='perfect_reload'){toast(data.siphon?'SIPHON HALO · SKILL CHARGED':'PRECISION RELOAD · CHARGED ROUND');sound(840,.23,.065,'triangle');return;}
    if(data.type==='rally_reload'){toast('RALLY · MAGAZINE RESTORED');sound(640,.18,.04,'sine');return;}
    if(data.type==='pickup'){toast(`MEDICAL SUPPLY +${24+20*(me()?.upgrades?.medkit||0)}`);sound(760,.13,.03,'sine');}
  };
  socket.onerror=()=>{if(ws===socket&&!myId&&!$('menu-error').textContent)$('menu-error').textContent='COULD NOT REACH HOST';};
  socket.onclose=()=>{
    if(ws!==socket)return;
    if(!myId){if(!$('menu-error').textContent)$('menu-error').textContent='COULD NOT REACH HOST';return;}
    if(reconnectToken&&reconnectUrl){
      reconnectDeadline ||= Date.now()+60000;
      if(Date.now()<reconnectDeadline){
        reconnecting=true;reconnectAttempts++;keys={};mouseDown=false;mouseRight=false;
        $('lobby').classList.add('hidden');$('upgrade').classList.add('hidden');$('gameover').classList.add('hidden');
        $('center-hint').textContent='SIGNAL LOST · RECONNECTING TO SQUAD...';
        if(document.pointerLockElement)document.exitPointerLock();
        reconnectTimer=setTimeout(()=>connect(roomCode,false,true),Math.min(3500,1000+reconnectAttempts*250));
        return;
      }
    }
    returnToMenu($('menu-error').textContent||'RECONNECT WINDOW EXPIRED · REJOIN FROM THE MENU');
  };
}
function copyCode(){navigator.clipboard?.writeText(roomCode).then(()=>toast('ROOM CODE COPIED')).catch(()=>toast(roomCode));}
$('create-button').onclick=()=>{sound(120,.15,.018,'triangle');connect();};$('solo-button').onclick=()=>{sound(120,.15,.018,'triangle');connect('',true);};
$('join-button').onclick=()=>connect($('join-input').value);
$('join-input').addEventListener('keydown',e=>{if(e.key==='Enter')connect($('join-input').value);});
$('copy-code').onclick=copyCode;$('lobby-code').onclick=copyCode;
$('start-button').onclick=()=>{send({type:'start'});sound(140,.36,.08);};
$('retry-button').onclick=()=>send({type:'start'});
$('service-time').onchange=()=>send({type:'config',intermissionSeconds:Number($('service-time').value)});
$('seed-input').onchange=()=>send({type:'seed',seed:$('seed-input').value.trim()});
$('vote-stable').onclick=()=>{send({type:'overtime',vote:'stable'});sound(280,.1,.03,'triangle');};
$('vote-overtime').onclick=()=>{send({type:'overtime',vote:'overtime'});sound(610,.24,.045,'sawtooth');};
$('reroll-button').onclick=()=>{const p=me();if(p?.rerolls&&!p.augmentReady){send({type:'reroll',draftToken:p.draftToken});sound(430,.18,.04,'triangle');}};

function updateUI(){
  if(!state)return;const p=me();if(!p)return;
  if(state.phase==='lobby'){
    $('service-time').value=String(state.intermissionSeconds||60);
    $('service-time').disabled=state.hostId!==myId;
    $('seed-input').disabled=state.hostId!==myId;
    if(document.activeElement!==$('seed-input'))$('seed-input').value=state.seedOverride===null?'':String(state.seedOverride);
    $('start-button').disabled=state.hostId!==myId;
    $('start-button').innerHTML=state.hostId===myId?'BEGIN SHIFT <span>↗</span>':'WAITING FOR HOST';
  }
  $('retry-button').disabled=state.phase==='gameover'&&state.hostId!==myId;
  $('stage-label').textContent=`SECTOR ${state.stageIndex+1} / ${stages[state.stageIndex].name} / BAY ${'ABCDE'[state.layoutId%5]}${state.order?' · '+state.order.name:''}`;
  $('wave-label').textContent=`WAVE ${String(state.wave||1).padStart(2,'0')}`;
  $('threat-label').textContent=state.phase==='combat'?`${state.wave%3===0?'BOSS / ':'HOSTILES '}${String(state.enemies.length+state.spawnLeft).padStart(2,'0')}`:state.phase==='intermission'?'BREACH CONTAINED':'AWAITING ORDERS';
  $('pressure-hud').classList.toggle('hidden',state.phase!=='combat');
  $('pressure-hud').textContent=`PRESSURE ${state.pressureBand||0}/2 · ${state.encounterSeconds||0}S`;
  $('salvage-hud').classList.toggle('hidden',state.phase!=='combat');
  $('salvage-hud').textContent=state.salvage?.earned?'SALVAGE QUOTA MET · REROLL EARNED':`SALVAGE ${state.salvage?.count||0}/${state.salvage?.target||0}`;
  const order=state.workOrder,account=state.contract;
  $('contract-hud').classList.toggle('hidden',!order||state.phase==='lobby');
  $('contract-hud').classList.toggle('paid',order?.result==='paid');
  $('contract-hud').classList.toggle('missed',order?.result==='missed'||order?.failed);
  if(order){
    const measure=order.kind==='machine'?`${order.progress}/${order.target} TARGETS`:order.kind==='speed'?`${order.remaining}S LEFT`:order.failed?'CREW SIGNAL LOST':'CREW SIGNAL INTACT';
    $('contract-hud').textContent=`WORK ORDER · ${order.short} · ${order.result?order.result.toUpperCase():measure} · STRAIN ${account?.strain||0}/2`;
  }
  $('overtime-hud').classList.toggle('hidden',state.phase!=='combat'||!state.overtime?.active);
  $('health-number').textContent=p.hp;$('health-max').textContent=`/ ${p.maxHp}`;
  $('health-fill').style.width=`${Math.max(0,p.hp/p.maxHp*100)}%`;
  $('health-fill').style.background=p.hp/p.maxHp<.3?'#ef624b':'#d6ec53';
  $('class-name').textContent=classes[p.classId].name;
  $('weapon-name').textContent=weapons[p.weapon]?.name||classes[p.classId].weaponName;
  $('ammo-number').textContent=String(p.ammo??0).padStart(2,'0');
  $('reserve-number').textContent='/ ∞';
  $('secondary-weapon').textContent=`${p.slot===0?'1 ACTIVE':'1 '+(weapons[p.loadout[0]]?.name||'EMPTY')} · ${p.slot===1?'2 ACTIVE':'2 '+(weapons[p.loadout[1]]?.name||'EMPTY')}`;
  const reloadWindow=p.reloading&&!p.reloadAttempted&&p.reloadWindowIn<=0&&p.reloadWindowLeft>0;
  if(reloadWindow&&!lastReloadWindow&&state.phase==='combat')sound(980,.08,.035,'triangle');
  lastReloadWindow=reloadWindow;
  $('reload-label').textContent=reloadWindow?'R NOW · PRECISION RELOAD':p.reloading&&!p.reloadAttempted?`R AGAIN IN ${p.reloadWindowIn.toFixed(1)}S`:p.reloading?'RELOADING...':p.reloadBoosted?'CHARGED ROUND · +20% DAMAGE':'R RELOAD · UNLIMITED RESERVE';
  $('reload-label').classList.toggle('reload-window',reloadWindow);
  $('skill-label').textContent=`E ${classes[p.classId].skill} ${p.skillCooldown>0?`${p.skillCooldown.toFixed(1)}s`:p.skillActive?'ACTIVE':'READY'}`;
  $('skill-label').classList.toggle('cooling',p.skillCooldown>0&&!p.skillActive);
  const installed=(p.grafts||[]).map(id=>id==='arcSpine'?`ϟ ARC SPINE ${p.arcCharges||0} CHARGES`:id==='kineticRig'?'◇ KINETIC RIG':id==='phaseCoupler'?`⟐ PHASE ${p.phaseCharges||0} SHOTS`:id==='siphonHalo'?'◎ SIPHON · R RELOAD NEAR ENEMIES':`✚ RECLAIMER ${p.reclaimerCooldown>0?p.reclaimerCooldown.toFixed(1)+'s':'READY'}`);
  $('graft-hud').textContent=installed.join(' · ');
  $('graft-hud').classList.toggle('hidden',installed.length===0);
  $('track-damage').textContent=p.damageDealt.toLocaleString();
  $('track-kills').textContent=String(p.kills);
  $('track-dps').textContent=String(p.dps);
  $('track-accuracy').textContent=`${p.shots?Math.round(p.hits/p.shots*100):0}%`;
  $('squad').innerHTML=state.players.filter(q=>q.id!==myId).map(q=>`<div class="squad-member ${q.dead||q.downed||q.disconnected?'dead':''}"><span>${escapeHTML(q.name)} <small>${classes[q.classId]?.name||''}</small></span><span>${q.disconnected?`REJOIN ${Math.ceil(q.reconnectRemaining)}S`:state.phase==='intermission'?crewStatus(q):q.dead?'LOST':q.downed?`DOWN ${Math.ceil(q.bleedout)}S`:q.hp+' HP'}</span></div>`).join('');
  $('lobby-players').innerHTML=state.players.map(q=>`<div class="lobby-player"><span>◆ ${escapeHTML(q.name)}</span><span>${classes[q.classId]?.name||'CONNECTED'}</span></div>`).join('');
  $('feed').innerHTML=state.feed.slice(0,4).map(f=>`<div>› ${escapeHTML(f.text)}</div>`).join('');
  const boss=state.phase==='combat'?state.enemies.find(e=>e.boss):null;
  $('boss-bar').classList.toggle('hidden',!boss);
  if(boss){
    const health=Math.max(0,Math.round(boss.hp/boss.maxHp*100));
    $('boss-name').textContent=stages[state.stageIndex].bossName;
    $('boss-fill').style.width=`${health}%`;$('boss-value').textContent=`${health}%`;
  }
  const lock=state.phase==='combat'?state.enemies.find(e=>e.telegraph&&telegraphGap(e,p)<0):null;
  const hazard=state.phase==='combat'?state.hazards?.find(h=>(h.warning||h.active)&&Math.hypot(h.x-p.x,h.y-p.y)<h.r+.3):null;
  const machineDanger=state.phase==='combat'&&state.machines?.some(m=>m.state==='warning'&&Math.hypot(m.targetX-p.x,m.targetY-p.y)<m.radius+.5);
  $('danger-cue').classList.toggle('hidden',!lock&&!hazard&&!machineDanger);
  if(lock||hazard||machineDanger)$('danger-cue').textContent=lock?(lock.telegraph.kind==='charge'?'RAM CHARGE · LEAVE THE LINE':lock.telegraph.kind==='slam'?'BRUTE SLAM · CLEAR THE RING':lock.telegraph.kind==='blast'?'SAPPER BLAST · CLEAR MARKED ZONE':lock.telegraph.kind==='press'?lock.type==='overseer'?'REACTOR PRESS · CLEAR THE MARK':'WARDEN PRESS · CLEAR THE MARK':lock.telegraph.kind==='beam'?lock.type==='warden'?'WARDEN SHEAR · LEAVE THE STRIP':lock.type==='matriarch'?'COOLANT LANCE · LEAVE THE STRIP':lock.boss?'OVERSEER CUT · LEAVE THE STRIP':'WELDER CUT · LEAVE THE STRIP':lock.telegraph.kind==='coldPulse'?lock.boss?'MATRIARCH PURGE · CLEAR THE RING':'COOLANT PULSE · CLEAR THE RING':lock.telegraph.kind==='snipe'?'SNIPER LOCK':'BOSS VOLLEY'):machineDanger?'MACHINE CYCLE · CLEAR CENTER':(hazard.active?'MOVE OUT OF HAZARD':state.overtime?.active?'OVERTIME HAZARD CHARGING':'FLOOR HAZARD CHARGING');
  const session=operating();
  const nearbyMachine=state.phase==='combat'&&!p.dead&&!p.downed?(state.machines||[]).filter(m=>Math.hypot(p.x-m.x,p.y-m.y)<2.5).sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0]:null;
  $('machine-hint').classList.toggle('hidden',!nearbyMachine||!!session);
  if(nearbyMachine&&!session){
    const m=nearbyMachine;
    $('machine-hint-text').textContent=m.state==='ready'?m.operatorId?`${m.modeName} · CREWMATE OPERATING`:`F · CONNECT ${m.modeName} · ${m.steps} STAGES`:m.state==='warning'?`STATION ${m.id+1} · CYCLE IN ${m.warningRemaining.toFixed(1)}S`:`STATION ${m.id+1} · RECHARGE ${Math.ceil(m.readyIn)}S`;
    $('machine-progress-fill').style.width=`${m.operatorId?Math.round(m.step/m.steps*100):0}%`;
  }
  $('machine-console').classList.toggle('hidden',!session);
  $('crosshair').classList.toggle('hidden',!!session);
  if(session){
    $('console-station').textContent=`STATION 0${session.id+1} · ${state.machines.length} ONLINE`;
    $('console-mode').textContent=session.modeName;
    $('console-rule').textContent=session.mode==='valves'?'Route the selector to each lit valve, then seal it. Pressure needs a moment to recover between seals.':session.mode==='circuit'?'Select the marked circuit, then confirm while the moving needle crosses the amber window.':'Match the target pressure. Counter the automatic drift, hold it steady, then seal each stage.';
    $('console-step').textContent=`STAGE ${session.step+1} / ${session.steps}`;
    $('console-mistakes').textContent=`FAULTS ${session.mistakes}`;
    $('console-channels').style.gridTemplateColumns=`repeat(${session.channels},1fr)`;
    $('console-channels').innerHTML=Array.from({length:session.channels},(_,i)=>`<span class="${i===session.target?'target':''} ${i===session.selector?'selected':''}">${i+1}</span>`).join('');
    $('console-sweep').classList.toggle('hidden',session.mode!=='circuit');
    $('console-stability').classList.toggle('hidden',session.mode!=='pressure');
    $('console-zone').style.left=`${Math.round((session.zone-.145)*100)}%`;
    $('console-needle').style.left=`${Math.round(session.sweep*100)}%`;
    $('console-stability-fill').style.width=`${Math.round(session.lockProgress/1.7*100)}%`;
    $('console-status').textContent=session.lockWait>0?`CONTACTOR RESET · ${session.lockWait.toFixed(1)}S`:session.mode==='pressure'&&session.lockProgress<1.7?`HOLD TARGET PRESSURE · ${session.lockProgress.toFixed(1)} / 1.7S`:session.mode==='circuit'?'SPACE WHEN NEEDLE CROSSES AMBER':`SPACE TO SEAL ${session.mode==='pressure'?'PRESSURE':'VALVE'}`;
  }
  $('lobby').classList.toggle('hidden',state.phase!=='lobby');
  $('gameover').classList.toggle('hidden',!['gameover','victory'].includes(state.phase));
  if(state.phase==='gameover'||state.phase==='victory'){
    const win=state.phase==='victory';
    $('result-signal').textContent=win?'● CREW EXTRACTED':'● SIGNAL LOST';
    $('result-kicker').textContent=win?'CONTRACT COMPLETE // AUTOMATION ACTIVE':'RUN TERMINATED';
    $('result-title').innerHTML=win?'EQUIPMENT<br><em>RECOVERED.</em>':'END OF<br><em>SHIFT.</em>';
    $('gameover-stats').textContent=`${win?'Three sectors cleared. The facility remains sealed.':'Wave '+String(state.wave).padStart(2,'0')+' reached.'} ${p.kills} kills · ${p.damageDealt.toLocaleString()} damage · ${p.shots?Math.round(p.hits/p.shots*100):0}% accuracy. Seed ${String(state.runSeed).padStart(10,'0')}.`;
  }
  if(state.phase==='intermission'&&!p.dead){
    if(order){
      $('ledger-order').textContent=order.name;
      $('ledger-result').textContent=order.result==='paid'?'VERIFIED · +1 CREDIT · −1 STRAIN':`MISSED · +1 STRAIN${order.kind==='speed'?` · ${Math.floor(order.progress)}S ELAPSED`:''}`;
      $('ledger-credit').textContent=`${account?.credits||0} / 2`;
      $('ledger-strain').textContent=`${account?.strain||0} / 2`;
      $('ledger-strain-effect').textContent=account?.bonus?'SECTOR BONUS READY · EXTRA PERSONAL DRAFT':`NEXT WAVE · +${account?.strain||0} REINFORCEMENT${account?.strain===1?'':'S'}`;
    }
    document.querySelector('.overtime-terminal').classList.toggle('hidden',state.wave>=9);
    const protocol=state.overtime?.protocol;
    if(protocol){$('overtime-name').textContent=`OVERTIME // ${protocol.name}`;$('overtime-hazard').textContent=`HAZARD: ${protocol.hazard}`;$('overtime-reward').textContent=`REWARD ON CLEAR: ${protocol.reward}`;$('overtime-machine').textContent=`NEXT MACHINE: ${protocol.machine}`;}
    $('upgrade').classList.remove('hidden');$('upgrade-timer').textContent=Math.ceil(state.timer);
    $('ready-strip').innerHTML=state.players.map(q=>`<div class="ready-pill ${q.ready&&q.overtimeVote!==null?'complete':''} ${q.dead?'lost':''}"><strong>${escapeHTML(q.name)}</strong><span>${crewStatus(q)}</span></div>`).join('');
    $('choice-stage').textContent=state.wave>=9?'FINAL RECOVERY // CATALOG EQUIPMENT BEFORE EXTRACTION':state.wave%3===0?`${stages[state.stageIndex].bossName} CLEARED // GRAFT ACCESS${state.overtime?.active?' + OVERTIME BONUS':''}`:state.overtime?.active?`OVERTIME CLEARED // BONUS DRAFT`:`${stages[state.stageIndex].name} // WAVE ${state.wave} CLEARED`;
    $('overtime-tally').textContent=`${state.overtime?.yes||0} YES · ${state.overtime?.no||0} NO · ${state.overtime?.eligible||0} CREW`;
    $('overtime-my-vote').textContent=p.overtimeVote===null?'MAJORITY REQUIRED · TIES STAY STABLE':p.overtimeVote==='overtime'?'YOU VOTED FOR OVERTIME · CHANGE UNTIL DEPARTURE':'YOU VOTED FOR STABLE · CHANGE UNTIL DEPARTURE';
    $('vote-stable').classList.toggle('selected',p.overtimeVote==='stable');
    $('vote-overtime').classList.toggle('selected',p.overtimeVote==='overtime');
    $('tab-augment').textContent=p.augmentReady?'01 AUGMENT ✓':`01 AUGMENT · ${p.augmentPicksRemaining||1} PICK${p.augmentPicksRemaining===1?'':'S'}`;
    $('reroll-button').classList.toggle('hidden',selectionTab!=='augment'||p.augmentReady||!p.rerolls);
    const choiceKey=[state.wave,p.draftToken,p.choices.join(','),p.weaponChoices.join(','),p.graftToken,p.graftChoices?.join(','),p.augmentReady,p.armoryReady,p.talentReady,p.graftReady,Object.keys(p.talents||{}).join(',')].join('|');
    if(choiceKey!==activeCards){
      activeCards=choiceKey;
      $('upgrade-cards').innerHTML=p.choices.map((id,i)=>{
        const u=upgradeById[id];return `<button class="upgrade-card rarity-${u.rarity.toLowerCase()}" data-id="${id}" ${p.augmentReady?'disabled':''}><span class="card-number">0${i+1} / ${u.rarity}</span><span class="card-icon">${u.icon}</span><strong>${u.name}</strong><p>${u.detail}</p><span class="card-kind">${u.kind} SYSTEM</span></button>`;
      }).join('');
      $('upgrade-cards').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{send({type:'upgrade',id:btn.dataset.id,draftToken:p.draftToken});sound(480,.25,.05,'square');});
      $('weapon-cards').innerHTML=p.weaponChoices.length?p.weaponChoices.map((id,i)=>{
        const w=weapons[id],damage=w.pellets?`${w.damage} × ${w.pellets}`:w.damage;
        return `<button class="upgrade-card weapon-choice" data-id="${id}" ${p.armoryReady?'disabled':''}><span class="card-number">0${i+1} / ARMORY</span><span class="card-icon">${id==='launcher'?'✹':id==='rail'?'➤':id==='cryo'?'❄':id==='arcgun'?'ϟ':'◆'}</span><strong>${w.name}</strong><p>${w.trait}</p><span class="card-kind">${damage} DMG · ${(1/w.interval).toFixed(1)}/S · ${w.mag} MAG</span></button>`;
      }).join(''):'<div class="choice-empty">ARMORY OFFLINE THIS WAVE<br><small>New weapons appear after the first wave and every boss.</small></div>';
      $('weapon-cards').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{send({type:'weapon',id:btn.dataset.id});sound(620,.25,.05,'square');});
      const nodes=talents[p.classId].map(branch=>({branch,node:branch.nodes[p.talents?.[branch.nodes[0].id]?1:0]})).filter(v=>v.node&&!p.talents?.[v.node.id]);
      $('talent-cards').innerHTML=state.wave%3===0?nodes.map(({branch,node})=>`<button class="upgrade-card talent-choice" data-id="${node.id}" ${p.talentReady?'disabled':''}><span class="card-number">${branch.branch} / TIER ${branch.nodes.indexOf(node)+1}</span><span class="card-icon">◈</span><strong>${node.name}</strong><p>${node.detail}</p><span class="card-kind">CLASS TALENT · ${classes[p.classId].name}</span></button>`).join(''):'<div class="choice-empty">TALENT POINT AT THE NEXT BOSS<br><small>Clear every third wave to advance your class tree.</small></div>';
      $('talent-cards').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{send({type:'talent',id:btn.dataset.id});sound(720,.28,.05,'sine');});
      $('graft-cards').innerHTML=p.graftChoices?.length?p.graftChoices.map((id,i)=>{
        const g=graftById[id];return `<button class="upgrade-card graft-choice" style="--graft-color:${g.color}" data-id="${id}" ${p.graftReady?'disabled':''}><span class="card-number">0${i+1} / BOSS GRAFT</span><span class="card-icon">${g.icon}</span><strong>${g.name}</strong><p>${g.detail}</p><span class="card-kind">${g.kind}</span></button>`;
      }).join(''):state.wave%3===0?'<div class="choice-empty">GRAFT SYSTEM ONLINE<br><small>All available grafts have been installed.</small></div>':'<div class="choice-empty">BOSS GRAFT LOCKED<br><small>Clear every third wave to choose a major suit modification.</small></div>';
      $('graft-cards').querySelectorAll('button').forEach(btn=>btn.onclick=()=>{send({type:'graft',id:btn.dataset.id,graftToken:p.graftToken});sound(560,.32,.06,'triangle');});
      if((selectionTab==='augment'&&p.augmentReady)||(selectionTab==='weapon'&&p.armoryReady)||(selectionTab==='talent'&&p.talentReady)||(selectionTab==='graft'&&p.graftReady)){
        selectionTab=!p.augmentReady?'augment':!p.armoryReady?'weapon':!p.talentReady?'talent':!p.graftReady?'graft':selectionTab;
      }
    }
    for(const [tab,ready] of [['augment',p.augmentReady],['weapon',p.armoryReady],['talent',p.talentReady],['graft',p.graftReady]]){
      const button=$('tab-'+tab);button.classList.toggle('active',selectionTab===tab);button.classList.toggle('complete',ready);
      $(tab==='augment'?'upgrade-cards':tab+'-cards').classList.toggle('hidden',selectionTab!==tab);
    }
    $('reroll-button').classList.toggle('hidden',selectionTab!=='augment'||p.augmentReady||!p.rerolls);
    $('choice-status').textContent=p.ready?(p.overtimeVote===null?'LOADOUT LOCKED · VOTE ON OVERTIME':'LOADOUT LOCKED · WAITING FOR SQUAD'):`${!p.augmentReady?(p.augmentPicksRemaining>1?'BONUS AUGMENTS':'AUGMENT'):!p.armoryReady?'ARMORY WEAPON':!p.talentReady?'CLASS TALENT':'BOSS GRAFT'} SELECTION REQUIRED`;
    if(document.pointerLockElement)document.exitPointerLock();
  }else{$('upgrade').classList.add('hidden');$('reroll-button').classList.add('hidden');activeCards='';selectionTab='augment';}
  if(state.phase!==lastPhase){
    if(state.phase==='combat')waveIntro(state.wave%3===0?`BOSS SIGNAL // WAVE ${String(state.wave).padStart(2,'0')}`:`SECTOR 0${state.stageIndex+1} // WAVE ${String(state.wave).padStart(2,'0')}`,
      state.wave%3===0?stages[state.stageIndex].bossName:stages[state.stageIndex].name,state.overtime?.active?'OVERTIME ENGAGED // BONUS DRAFT ON CLEAR':state.order?`BAY ${'ABCDE'[state.layoutId%5]} · ${state.order.name} // ${state.order.detail}`:stages[state.stageIndex].subtitle);
    lastPhase=state.phase;
  }
  const nearby=state.phase==='combat'&&!p.dead&&!p.downed?state.players.find(q=>q.downed&&Math.hypot(q.x-p.x,q.y-p.y)<1.8):null;
  const soloRecovery=p.downed&&!state.players.some(q=>q.id!==p.id&&!q.dead&&!q.downed)&&!p.selfRevives;
  $('center-hint').textContent=reconnecting?'SIGNAL LOST · RECONNECTING TO SQUAD...':p.dead?'SIGNAL LOST — SPECTATING':p.downed?`DOWNED · ${Math.ceil(p.bleedout)}S · ${soloRecovery?`HOLD V TO REBOOT (${Math.round(p.reviveProgress*100)}%)`:'WAIT FOR A TEAMMATE'}`:
    nearby?`HOLD V TO RESTORE ${nearby.name} · ${Math.round(nearby.reviveProgress*100)}%`:settingsOpen?'SETTINGS OPEN':state.phase==='combat'&&document.pointerLockElement!==canvas?(fallbackAim?'ARROWS TURN / C FIRE / DRAG TO AIM':'CLICK TO LOCK CURSOR'):'';
}
document.querySelectorAll('[data-tab]').forEach(button=>button.onclick=()=>{selectionTab=button.dataset.tab;updateUI();});

function wall(x,y){return !map||(map[Math.floor(y)]?.[Math.floor(x)]??1)===1;}
function free(x,y,r=.28){
  if(!map||!Number.isFinite(x)||!Number.isFinite(y))return false;
  for(let ty=Math.floor(y-r);ty<=Math.floor(y+r);ty++)for(let tx=Math.floor(x-r);tx<=Math.floor(x+r);tx++){
    if(map[ty]?.[tx]!==1&&map[ty]?.[tx]!==2)continue;
    const nearestX=clamp(x,tx,tx+1),nearestY=clamp(y,ty,ty+1);
    if(Math.hypot(x-nearestX,y-nearestY)<r)return false;
  }
  return x-r>=0&&y-r>=0&&x+r<map[0].length&&y+r<map.length;
}
function crewStatus(q){
  if(q.disconnected)return 'RECONNECTING';
  if(q.dead)return 'SIGNAL LOST';
  if(!q.augmentReady)return 'AUGMENT';
  if(!q.armoryReady)return 'ARMORY';
  if(!q.talentReady)return 'TALENT';
  if(!q.graftReady)return 'GRAFT';
  return q.overtimeVote===null?'VOTE':'READY';
}
function pingAtAim(kind){
  if(!state||state.phase!=='combat'||reconnecting||me()?.dead||me()?.downed||!map)return;
  const dx=Math.cos(position.a),dy=Math.sin(position.a);
  let target={x:position.x,y:position.y};
  for(let d=.5;d<=15;d+=.18){
    const x=position.x+dx*d,y=position.y+dy*d;
    if(wall(x,y))break;
    if(free(x,y,.28))target={x,y};
    const enemy=state.enemies.find(e=>Math.hypot(e.x-x,e.y-y)<.65);
    if(enemy&&free(enemy.x,enemy.y,.28)){target={x:enemy.x,y:enemy.y};break;}
  }
  send({type:'ping',kind,x:Math.round(target.x*100)/100,y:Math.round(target.y*100)/100});
  sound(kind==='danger'?810:560,.12,.025,'triangle');
}
function aim(dx,dy){
  const factor=.0028*settings.sensitivity*(mouseRight?settings.adsSensitivity/100:1);
  position.a+=dx*factor;
  position.pitch=clamp(position.pitch+dy*factor*(settings.invert?1:-1),-1.22,1.22);
}
document.addEventListener('mousemove',e=>{if(!operating()&&(document.pointerLockElement===canvas||(fallbackAim&&mouseDown)))aim(e.movementX,e.movementY);});
document.addEventListener('pointerlockchange',updateUI);
canvas.addEventListener('mousedown',e=>{
  if(!state||state.phase!=='combat'||reconnecting||me()?.dead||me()?.downed||settingsOpen||manualOpen)return;
  if(e.button===0)mouseDown=true;if(e.button===2)mouseRight=true;
  if(document.pointerLockElement!==canvas&&!fallbackAim){
    try{Promise.resolve(canvas.requestPointerLock()).catch(()=>{fallbackAim=true;updateUI();});}
    catch{fallbackAim=true;updateUI();}
  }
});
canvas.addEventListener('contextmenu',e=>e.preventDefault());
document.addEventListener('mouseup',e=>{if(e.button===0)mouseDown=false;if(e.button===2)mouseRight=false;});
document.addEventListener('visibilitychange',()=>{if(document.hidden){mouseDown=false;mouseRight=false;keys={};}});
function dash(now){
  if(!state||state.phase!=='combat'||me()?.dead||me()?.downed||settingsOpen||manualOpen||now-lastDash<2.8)return;
  lastDash=now;dashUntil=now+.19;
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  let dx=Math.cos(position.a)*f-Math.sin(position.a)*s,dy=Math.sin(position.a)*f+Math.cos(position.a)*s;
  const len=Math.hypot(dx,dy);if(len){dx/=len;dy/=len;}else{dx=Math.cos(position.a);dy=Math.sin(position.a);}
  velocity.x=dx*13;velocity.y=dy*13;send({type:'dash'});sound(290,.18,.055);
}
function slide(now){
  if(!state||state.phase!=='combat'||me()?.dead||me()?.downed||settingsOpen||manualOpen||!grounded||now-lastSlide<1.35||Math.hypot(velocity.x,velocity.y)<3.8)return;
  lastSlide=now;slideUntil=now+.72;
  const speed=Math.hypot(velocity.x,velocity.y);velocity.x*=8.7/speed;velocity.y*=8.7/speed;
  sound(95,.22,.04,'square');
}
document.addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(operating()&&!e.repeat){
    if(['KeyA','ArrowLeft'].includes(e.code))send({type:'machineInput',action:'select',delta:-1});
    else if(['KeyD','ArrowRight'].includes(e.code))send({type:'machineInput',action:'select',delta:1});
    else if(['Space','Enter'].includes(e.code))send({type:'machineInput',action:'commit'});
    else if(['KeyF','Escape'].includes(e.code))send({type:'machineInput',action:'abort'});
    if(['KeyA','ArrowLeft','KeyD','ArrowRight','Space','Enter','KeyF','Escape'].includes(e.code))return;
  }
  if(e.code==='Escape'){
    if(manualOpen)closeManual();else if(settingsOpen)closeSettings();else if(state?.phase==='combat')openSettings();
    return;
  }
  if(e.code==='KeyH'&&!e.repeat){e.preventDefault();manualOpen?closeManual():openManual();return;}
  keys[e.code]=true;
  if(settingsOpen||manualOpen||reconnecting||!state||state.phase!=='combat')return;
  if(e.code==='KeyR'&&!e.repeat&&!me()?.downed)send({type:'reload'});
  if((e.code==='Digit1'||e.code==='Digit2')&&!e.repeat){send({type:'switch',slot:e.code==='Digit1'?0:1});lastFire=0;}
  if(e.code==='KeyE'&&!e.repeat)send({type:'skill'});
  if(e.code==='KeyF'&&!e.repeat)send({type:'machineStart'});
  if(e.code==='KeyG'&&!e.repeat)pingAtAim(e.shiftKey?'danger':'route');
  if(e.code==='KeyQ'&&!e.repeat)dash(performance.now()/1000);
  if((e.code==='ControlLeft'||e.code==='ControlRight')&&!e.repeat)slide(performance.now()/1000);
  if(e.code==='Space'&&!e.repeat&&grounded){jumpVelocity=5.7;grounded=false;sound(180,.12,.024,'sine');}
});
document.addEventListener('keyup',e=>{keys[e.code]=false;});
window.addEventListener('blur',()=>{if(operating())send({type:'machineInput',action:'abort'});keys={};mouseDown=false;mouseRight=false;});

function updateMovement(dt,now,p){
  if(fallbackAim){
    if(keys.ArrowLeft)position.a-=dt*2.1;
    if(keys.ArrowRight)position.a+=dt*2.1;
    if(keys.ArrowUp)position.pitch=clamp(position.pitch+dt*1.4,-1.22,1.22);
    if(keys.ArrowDown)position.pitch=clamp(position.pitch-dt*1.4,-1.22,1.22);
  }
  const f=(keys.KeyW?1:0)-(keys.KeyS?1:0),s=(keys.KeyD?1:0)-(keys.KeyA?1:0);
  let wishX=Math.cos(position.a)*f-Math.sin(position.a)*s,wishY=Math.sin(position.a)*f+Math.cos(position.a)*s;
  const length=Math.hypot(wishX,wishY);if(length){wishX/=length;wishY/=length;}
  const sprinting=!!(keys.ShiftLeft||keys.ShiftRight)&&f>0&&now>=slideUntil;
  const overclock=p.classId==='runner'&&p.skillActive?1.35:1;
  const momentum=p.upgrades.momentum&&p.momentumActive?1+.1*p.momentumStacks:1;
  const speed=(sprinting?6.15:4.25)*Math.pow(1.12,p.upgrades.sprint||0)*(p.talents?.r_stride?1.15:1)*overclock*momentum*(p.slowed?.65:1);
  if(now<dashUntil){/* preserve the dash impulse */}
  else if(now<slideUntil){
    const drag=Math.exp(-dt*2.35);velocity.x=velocity.x*drag+wishX*dt*1.8;velocity.y=velocity.y*drag+wishY*dt*1.8;
  }else{
    const response=grounded?(length?10.5:14):3.4;
    const alpha=1-Math.exp(-response*dt);
    velocity.x+=(wishX*speed-velocity.x)*alpha;velocity.y+=(wishY*speed-velocity.y)*alpha;
  }
  const dx=velocity.x*dt,dy=velocity.y*dt,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dy))/.18));
  for(let i=0;i<steps;i++){
    if(free(position.x+dx/steps,position.y))position.x+=dx/steps;else velocity.x=0;
    if(free(position.x,position.y+dy/steps))position.y+=dy/steps;else velocity.y=0;
  }
  if(!grounded){
    jumpVelocity-=14.8*dt;jumpHeight+=jumpVelocity*dt;
    if(jumpHeight<=0){jumpHeight=0;jumpVelocity=0;grounded=true;landingKick=.12;sound(90,.1,.02,'sine');}
  }
  const slideActive=now<slideUntil;
  eyeHeight+=((slideActive?1.15:1.65)-eyeHeight)*(1-Math.exp(-dt*12));
  const planarSpeed=Math.hypot(velocity.x,velocity.y);
  if(grounded&&planarSpeed>.4)bob+=dt*planarSpeed*2.05;
  landingKick=Math.max(0,landingKick-dt*.9);
  if(now-lastMove>.05){send({type:'move',x:position.x,y:position.y,a:position.a});lastMove=now;}
  if((mouseDown||keys.KeyC)&&!p.reloading){
    const interval=weapons[p.weapon].interval;
    if(now-lastFire>=interval/(Math.pow(1.22,p.upgrades.hotload||0)*(p.classId==='runner'&&p.skillActive?1.75:1))){
      send({type:'fire',a:position.a,pitch:position.pitch,height:eyeHeight+jumpHeight+floorHeightAt(map,position.x,position.y)});lastFire=now;
      if(p.ammo>0){
        const [kick]=recoilProfiles[p.weapon]||recoilProfiles.carbine;
        const applied=kick*(mouseRight?.7:1);
        position.pitch=clamp(position.pitch+applied,-1.22,1.22);aimKick=Math.min(.38,aimKick+applied);
        recoil=visualRecoil[p.weapon]||.32;muzzle=.12;shake=['scatter','rail','launcher','harpoon','gravity'].includes(p.weapon)?.034:.012;
        view.shoot(p.weapon);weaponSound(p.weapon);
      }
    }
  }
  $('dash-label').innerHTML=now-lastDash>2.8?'DASH READY <span>◆</span>':'DASH RECHARGING <span>◇</span>';
  return {sprinting,slideActive,planarSpeed};
}
function loop(time){
  const dt=Math.min(.05,(time-lastFrame)/1000);lastFrame=time;const now=time/1000,p=me();
  updateAmbience();
  recoil=Math.max(0,recoil-dt*4.5);muzzle=Math.max(0,muzzle-dt*8.5);shake=Math.max(0,shake-dt*.3);
  if(aimKick>0){const recovered=Math.min(aimKick,dt*(recoilProfiles[me()?.weapon]?.[1]||.16));position.pitch=clamp(position.pitch-recovered,-1.22,1.22);aimKick-=recovered;}
  let movement={sprinting:false,slideActive:false,planarSpeed:0};
  if(map&&p){
    if(state.phase==='combat'&&!reconnecting&&!settingsOpen&&!manualOpen&&keys.KeyV&&!p.dead&&now-lastReviveSend>.09){
      const target=p.downed?(!p.selfRevives&&!state.players.some(q=>q.id!==p.id&&!q.dead&&!q.downed)?p:null):
        state.players.filter(q=>q.downed&&Math.hypot(q.x-p.x,q.y-p.y)<=1.8).sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))[0];
      if(target){send({type:'revive',targetId:target.id});lastReviveSend=now;}
    }
    view.setWeapon(p.weapon);
    if(state.phase==='combat'&&!reconnecting&&!p.dead&&!p.downed&&!settingsOpen&&!manualOpen&&!operating()&&(document.pointerLockElement===canvas||fallbackAim))movement=updateMovement(dt,now,p)||movement;
    else{velocity.x*=Math.exp(-dt*12);velocity.y*=Math.exp(-dt*12);}
    const headBob=grounded?Math.sin(bob*2)*.027*Math.min(1,movement.planarSpeed/5)*settings.bob/100:0;
    const sway=grounded?Math.sin(bob)*.008*Math.min(1,movement.planarSpeed/5)*settings.bob/100:0;
    const height=(p.downed?.74:eyeHeight+jumpHeight+headBob-landingKick)+floorHeightAt(map,position.x,position.y);
    const lean=clamp(-velocity.x*Math.sin(position.a)+velocity.y*Math.cos(position.a),-7,7)*-.006+(movement.slideActive?.035:0);
    const spectator=p.dead?state.players.find(q=>!q.dead&&!q.downed):null;
    view.setCamera(spectator?.x??position.x+sway*Math.sin(position.a),spectator?.y??position.y-sway*Math.cos(position.a),spectator?.a??position.a,
      spectator?-.25:position.pitch+shake*(settings.shake/100)*(Math.random()-.5),spectator?2.45+floorHeightAt(map,spectator.x,spectator.y):height,lean);
    view.setWeaponPose(bob,recoil,mouseRight,muzzle,p.reloading,dt);
    $('crosshair').style.setProperty('--gap',`${(mouseRight?3:6+Math.min(9,movement.planarSpeed*.7)+recoil*8).toFixed(1)}px`);
    const targetFov=settings.fov+(movement.sprinting?6:0)+(movement.slideActive?4:0)-(mouseRight?15:0);
    view.camera.fov+=(targetFov-view.camera.fov)*(1-Math.exp(-dt*9));view.camera.updateProjectionMatrix();
    view.sync(state,myId,dt,now);
  }
  view.render();requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

