import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { BUILD_VERSION, bayNames, classes, weapons, upgrades, stages, talents, grafts, overtimeProtocols, encounterOrders, enemyStats, workOrders, floorHeightAt } from './public/shared.js';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 3000);
const TICK = 1 / 60;
const rooms = new Map();
let nextId = 1;

const map = Array.from({ length: 25 }, (_, y) =>
  Array.from({ length: 25 }, (_, x) => (x === 0 || y === 0 || x === 24 || y === 24 ? 1 : 0))
);
for (const [x, y] of [
  [5, 5], [6, 5], [5, 6], [19, 5], [18, 5], [19, 6],
  [5, 19], [6, 19], [5, 18], [19, 19], [18, 19], [19, 18],
  [9, 9], [15, 9], [9, 15], [15, 15], [3, 12], [21, 12],
  [12, 3], [12, 21], [8, 4], [16, 4], [8, 20], [16, 20]
]) map[y][x] = 1;
map[6][12]=1; // A common wall-mount for the contractor's machinery control.
const stageMaps=[map];
for(const blocks of [
  [[4,8],[4,16],[20,8],[20,16],[8,4],[16,4],[8,20],[16,20],[10,12],[14,12]],
  [[3,8],[3,16],[21,8],[21,16],[8,3],[16,3],[8,21],[16,21],[6,12],[18,12],[12,6],[12,18]]
]){
  const grid=map.map(row=>[...row]);
  for(const [x,y] of blocks)grid[y][x]=1;
  stageMaps.push(grid);
}
const variantCover=[
  [[4,9],[4,15],[20,9],[20,15],[7,11],[17,13]],
  [[6,10],[6,14],[18,10],[18,14],[9,18],[15,18]],
  [[7,7],[17,7],[7,17],[17,17],[9,12],[15,12]]
];
const crossCover=[
  [[8,8],[16,8],[8,16],[16,16],[11,11],[13,13]],
  [[7,9],[17,9],[7,15],[17,15],[10,10],[14,14]],
  [[6,7],[18,7],[6,17],[18,17],[10,15],[14,9]]
];
const roomLayouts=stageMaps.map((base,stage)=>{
  const alternate=base.map(row=>[...row]);
  for(const [x,y] of variantCover[stage])alternate[y][x]=1;
  const cross=base.map(row=>[...row]);
  for(const [x,y] of crossCover[stage])cross[y][x]=1;
  const diagonal=base.map(row=>[...row]);
  const gantry=base.map(row=>[...row]);
  const filterStack=base.map(row=>[...row]);
  const rejectedGoods=base.map(row=>[...row]);
  for(const [x,y] of [[6,9],[18,9],[6,15],[18,15],[10,5],[14,19]])if(!diagonal[y][x])diagonal[y][x]=1;
  for(const [x,y] of [[4,10],[20,14],[8,8],[16,16],[8,16],[16,8]])if(!gantry[y][x])gantry[y][x]=1;
  // Long half-wall runs create height-aware firing lanes; paired decks give
  // operators a route choice without splitting the navmesh into islands.
  for(const [x,y] of [[6,11],[7,11],[8,11],[16,13],[17,13],[18,13],[10,16],[11,16],[13,8],[14,8]])if(filterStack[y][x]===0)filterStack[y][x]=2;
  for(const [x,y] of [[5,9],[6,9],[18,15],[19,15],[9,14],[10,14],[14,10],[15,10],[8,18],[16,6]])if(rejectedGoods[y][x]===0)rejectedGoods[y][x]=2;
  const variants=[base.map(row=>[...row]),alternate,cross,diagonal,gantry,filterStack,rejectedGoods];
  const lowPatterns=[[[9,8],[10,8],[14,8],[15,8],[9,17],[10,17],[14,17],[15,17]],
    [[7,9],[8,9],[16,9],[17,9],[7,16],[8,16],[16,16],[17,16]],
    [[9,6],[10,6],[14,6],[15,6],[9,18],[10,18],[14,18],[15,18]],
    [[5,11],[6,11],[18,13],[19,13],[10,16],[14,8]],
    [[7,6],[8,6],[16,18],[17,18],[10,11],[14,13]]];
  const deckCenters=[[[4,12],[20,12]],[[5,15],[19,9]],[[4,9],[20,16]],[[5,18],[19,6]],[[4,15],[20,9]]];
  for(let v=0;v<variants.length;v++){
    const grid=variants[v];
    for(const [cx,cy] of deckCenters[(v+stage)%5])for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(grid[cy+dy]?.[cx+dx]===0)grid[cy+dy][cx+dx]=3;
    for(const [x,y] of lowPatterns[(v+stage)%5])if(grid[y]?.[x]===0)grid[y][x]=2;
    if(v===5||v===6){
      const extra=v===5?[[8,17],[16,7]]:[[7,14],[17,10]];
      for(const [cx,cy] of extra)for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(grid[cy+dy]?.[cx+dx]===0)grid[cy+dy][cx+dx]=3;
    }
  }
  return variants;
});
function selectLayout(seed,wave){
  if(wave===1)return 0; // Teach three forgiving controls before harder bays.
  if(wave%3===0)return 0; // boss sight lines are authored and stable
  let value=(seed||0)^Math.imul(wave,0x9e3779b9);
  value=Math.imul(value^(value>>>16),0x85ebca6b);
  return (value>>>0)%bayNames.length;
}
export function selectEncounterOrder(seed,wave,stageIndex){
  const orders=encounterOrders[stageIndex]||encounterOrders[0];
  const value=Math.imul((seed||0)^Math.imul(wave,0x27d4eb2d),0x85ebca6b);
  return orders[((value^(value>>>16))>>>0)%orders.length];
}
const hazardLayouts=[
  [{x:6.5,y:12.5,r:2.1},{x:18.5,y:12.5,r:2.1}],
  [{x:12.5,y:6.5,r:2.2},{x:12.5,y:18.5,r:2.2}],
  [{x:6.5,y:6.5,r:2.3},{x:18.5,y:18.5,r:2.3}]
];
const machineSite={x:12.5,y:7.5,targetX:12.5,targetY:12.5,radius:3.2};
const MACHINE_HOLD_SECONDS=.65;
const MACHINE_MODES={valves:{name:'VALVE CASCADE',steps:3,channels:3,lockout:1.5},circuit:{name:'CIRCUIT BRIDGE',steps:3,channels:4,lockout:1.1},pressure:{name:'PRESSURE BALANCE',steps:4,channels:5,lockout:.65}};
function machineStations(grid,variant,wave,seed){
  const difficulty=wave%3===0?'pressure':['valves','circuit','pressure','valves','circuit','pressure','valves'][variant];
  const count=difficulty==='valves'?3:difficulty==='circuit'?2:1;
  const anchors=[{...machineSite},{x:6.5,y:17.5,targetX:8.5,targetY:14.5,radius:2.75},{x:18.5,y:17.5,targetX:16.5,targetY:14.5,radius:2.75}];
  return anchors.slice(0,count).map((anchor,index)=>{
    let site=anchor;
    if(!free(site.x,site.y,.55,grid)||grid[Math.floor(site.y)]?.[Math.floor(site.x)]!==0){
      const candidates=[];
      for(let y=3.5;y<22;y++)for(let x=3.5;x<22;x++)if(grid[Math.floor(y)]?.[Math.floor(x)]===0&&free(x,y,.55,grid)&&Math.hypot(x-anchor.x,y-anchor.y)<4&&Math.hypot(x-anchor.targetX,y-anchor.targetY)>anchor.radius+.4)candidates.push({x,y,d:Math.hypot(x-anchor.x,y-anchor.y)});
      candidates.sort((a,b)=>a.d-b.d);site={...anchor,x:candidates[0]?.x??anchor.x,y:candidates[0]?.y??anchor.y};
    }
    let hash=((seed||0)^Math.imul(wave*7+index+1,0x9e3779b9))>>>0;
    const sequence=[];
    for(let step=0;step<MACHINE_MODES[difficulty].steps;step++){
      hash=Math.imul(hash^(hash>>>13),0x85ebca6b)>>>0;
      let target=(hash+step)%MACHINE_MODES[difficulty].channels;
      if(difficulty==='pressure'&&target===2)target=step%2?1:3;
      if(step&&target===sequence[step-1])target=(target+1)%MACHINE_MODES[difficulty].channels;
      if(difficulty==='pressure'&&target===2)target=4;
      sequence.push(target);
    }
    return {...site,id:index,mode:difficulty,sequence,state:'ready',readyAt:0,fireAt:0,triggeredBy:null,session:null};
  });
}
export function selectWorkOrder(seed,wave){
  const sector=Math.floor((wave-1)/3),slot=(wave-1)%3;
  let value=(seed||0)^Math.imul(sector+1,0x6d2b79f5);
  value=Math.imul(value^(value>>>15),0x85ebca6b);
  const first=sector===0?0:(value>>>0)%3; // Teach the control in the first bay.
  const step=(value&0x10000)?2:1;
  return ['machine','speed','intact'][(first+slot*step)%3];
}
export function selectOvertimeProtocol(seed,wave){
  const stage=Math.floor((wave-1)/3)%stages.length;
  const choices=overtimeProtocols.filter(p=>p.stage===stage);
  const value=Math.imul((seed||0)^Math.imul(wave,0x9e3779b9),0x85ebca6b);
  return choices[((value^(value>>>16))>>>0)%choices.length];
}
const nextProtocol=room=>selectOvertimeProtocol(room.runSeed||room.seedOverride||0,Math.min(9,room.wave+1));
const activeProtocol=room=>room.protocol||overtimeProtocols.find(p=>p.stage===room.stageIndex)||overtimeProtocols[0];

const wall = (x, y, grid=map) => !Number.isFinite(x) || !Number.isFinite(y) || (grid[Math.floor(y)]?.[Math.floor(x)] ?? 1) === 1;
function free(x, y, r = .24, grid=map) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
  for (let ty = Math.floor(y-r); ty <= Math.floor(y+r); ty++) {
    for (let tx = Math.floor(x-r); tx <= Math.floor(x+r); tx++) {
      if(grid[ty]?.[tx]!==1&&grid[ty]?.[tx]!==2)continue;
      const nearestX = clamp(x, tx, tx+1), nearestY = clamp(y, ty, ty+1);
      if (Math.hypot(x-nearestX,y-nearestY) < r) return false;
    }
  }
  return x-r >= 0 && y-r >= 0 && x+r < 25 && y+r < 25;
}
function projectileFree(x,y,r,h,grid=map){
  if(!Number.isFinite(x)||!Number.isFinite(y))return false;
  for(let ty=Math.floor(y-r);ty<=Math.floor(y+r);ty++)for(let tx=Math.floor(x-r);tx<=Math.floor(x+r);tx++){
    const tile=grid[ty]?.[tx]??1;
    if(tile!==1&&!(tile===2&&h<1.08))continue;
    const nx=clamp(x,tx,tx+1),ny=clamp(y,ty,ty+1);
    if(Math.hypot(x-nx,y-ny)<r)return false;
  }
  return h>=floorHeightAt(grid,x,y)+.05;
}
function routeEnemy(e,target,grid){
  const radius=enemyStats[e.type].radius,startX=Math.floor(e.x),startY=Math.floor(e.y);
  const candidates=[];
  for(let y=startY-1;y<=startY+1;y++)for(let x=startX-1;x<=startX+1;x++)if(x>0&&x<24&&y>0&&y<24&&free(x+.5,y+.5,radius,grid))
    candidates.push({x,y,d:Math.hypot(e.x-(x+.5),e.y-(y+.5))});
  if(!candidates.length)return null;
  candidates.sort((a,b)=>a.d-b.d);
  const start=candidates[0].y*25+candidates[0].x,queue=[start],parent=new Int16Array(625).fill(-1),seen=new Uint8Array(625);
  seen[start]=1;let head=0,best=start,bestDistance=Infinity;
  while(head<queue.length){
    const index=queue[head++],x=index%25,y=Math.floor(index/25),distance=Math.hypot(target.x-(x+.5),target.y-(y+.5));
    if(distance<bestDistance){bestDistance=distance;best=index;}
    if(distance<.6)break;
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]){
      if(nx<=0||ny<=0||nx>=24||ny>=24)continue;
      const next=ny*25+nx;
      if(seen[next]||!free(nx+.5,ny+.5,radius,grid))continue;
      seen[next]=1;parent[next]=index;queue.push(next);
    }
  }
  if(best===start)return {x:target.x,y:target.y};
  while(parent[best]!==start&&parent[best]!==-1)best=parent[best];
  return {x:best%25+.5,y:Math.floor(best/25)+.5};
}
export function findSafeCrewSpawns(grid,count,stageIndex=0){
  const anchor=[[12.5,17.5],[12.5,12.5],[12.5,16.5]][stageIndex]||[12.5,17.5];
  const hazards=hazardLayouts[stageIndex]||[];
  const candidates=[];
  for(let ty=2;ty<23;ty++)for(let tx=2;tx<23;tx++){
    const x=tx+.5,y=ty+.5;
    if(!free(x,y,.43,grid))continue;
    if(hazards.some(h=>Math.hypot(x-h.x,y-h.y)<h.r+.5))continue;
    candidates.push({x,y,score:Math.hypot(x-anchor[0],y-anchor[1])+.001*Math.abs(x-anchor[0])});
  }
  candidates.sort((a,b)=>a.score-b.score||a.y-b.y||a.x-b.x);
  const selected=[];
  for(const candidate of candidates){
    if(selected.every(p=>Math.hypot(p.x-candidate.x,p.y-candidate.y)>=1.35))selected.push({x:candidate.x,y:candidate.y});
    if(selected.length>=count)break;
  }
  if(selected.length<count)throw new Error(`No safe crew entry for ${count} players in stage ${stageIndex}`);
  return selected;
}
function visible(x1, y1, x2, y2, grid=map) {
  const d = Math.hypot(x2-x1, y2-y1);
  for (let s = .15; s < d; s += .15) if (wall(x1 + (x2-x1)*s/d, y1 + (y2-y1)*s/d,grid)) return false;
  return true;
}
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
function roomRandom(room){
  let value=(room.rngState??room.runSeed??1)>>>0;
  if(!value)value=0x6d2b79f5;
  value^=value<<13;value^=value>>>17;value^=value<<5;
  room.rngState=value>>>0;
  return room.rngState/0x100000000;
}
function shuffled(room,list){
  const result=[...list];
  for(let i=result.length-1;i>0;i--){
    const j=Math.floor(roomRandom(room)*(i+1));
    [result[i],result[j]]=[result[j],result[i]];
  }
  return result;
}
const safeName = v => String(v || 'OPERATIVE').replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 16) || 'OPERATIVE';
const newEncounterMetrics=()=>({damage:0,kills:0,skillUses:0,revives:0,healing:0,guardedDamage:0,overclockKills:0,machineCycles:0,staggered:0,bankHits:0,reactions:0,precisionReloads:0});

function code() {
  let c;
  do { c = crypto.randomBytes(3).toString('hex').toUpperCase(); } while (rooms.has(c));
  return c;
}
function makeRoom(c) {
  const room = { code: c, players: new Map(), enemies: [], projectiles: [], drops: [], pings:[], phase: 'lobby', wave: 0,
    timer: 0, spawnLeft: 0, spawnTimer: 0, seq: 1, clock: 0, feed: [], snapshotTimer: 0,grid:map,stageIndex:0,hazardStart:0,hazardCycle:-1,
    overtimeActive:false,protocol:null,machine:null,runSeed:0,seedOverride:null,layoutId:0,hostId:null,intermissionSeconds:60,
    encounterStart:0,pressureBand:0,order:null,salvage:0,salvageTarget:0,salvageEarned:false,
    workOrder:null,contractCredits:0,contractStrain:0,contractBonus:false,lastReport:null };
  rooms.set(c, room);
  return room;
}
function createPlayer(ws, name, room, requestedClass) {
  const id = String(nextId++);
  const angle = Math.random() * Math.PI * 2;
  const classId = Object.hasOwn(classes, requestedClass) ? requestedClass : 'vanguard';
  const weapon = classes[classId].weapon;
  const p = { id, ws, room, name: safeName(name), x: 12.5 + Math.cos(angle)*1.6, y: 12.5 + Math.sin(angle)*1.6,
    a: angle, hp: 100, maxHp: 100, dead: false, classId, weapon, ammo: weapons[weapon].mag,
    reloadEnd: 0, reloadWindowStart:0, reloadWindowEnd:0, reloadAttempted:false, reloadBoostSlot:-1,
    lastShot: -100, lastMove: 0, lastPing:-100, kills: 0, damageDealt: 0, damageHistory: [], shots: 0, hits: 0,
    upgrades: {}, talents:{}, grafts:[], choices: [], weaponChoices:[], graftChoices:[], ready: false, augmentReady:false, armoryReady:true, talentReady:true,graftReady:true,graftToken:0,
    overtimeVote:null,augmentPicksRemaining:1,draftToken:0,rerolls:0,
    loadout:[weapon,null], slot:0, slotAmmo:[weapons[weapon].mag,0], damage: 1, fireRate: 1, speed: 1, armor: 0, crit: 0,
    slotHeat:[0,0],slotVentUntil:[0,0],controlCharges:0,
    leech: 0, mag: 1, hurtAt: -100, invulnerableUntil: 0, lastDash: -100, dashUntil: 0,
    downed:false, downedUntil:0, reviveProgress:0, reviveTargetId:null, reviveIntentAt:-100, selfRevives:0,
    reconnectToken:crypto.randomBytes(24).toString('hex'),disconnected:false,reconnectUntil:0,
    skillReadyAt: 0, skillUntil: 0, wardUntil:0, momentumUntil:0, momentumStacks:0,arcCharges:0,phaseCharges:0,reclaimerReadyAt:0,
    encounterMetrics:newEncounterMetrics() };
  room.players.set(id, p);
  room.hostId ||= id;
  return p;
}
function publicPlayer(p) {
  const recentDamage=p.damageHistory.reduce((sum,hit)=>sum+hit.amount,0);
  return { id: p.id, name: p.name, x: p.x, y: p.y, a: p.a, hp: Math.round(p.hp), maxHp: p.maxHp,
    dead: p.dead, downed:!!p.downed, disconnected:!!p.disconnected,
    reconnectRemaining:p.disconnected?Math.max(0,p.reconnectUntil-p.room.clock):0,
    bleedout:Math.max(0,(p.downedUntil||0)-p.room.clock),
    reviveProgress:p.reviveProgress||0, selfRevives:p.selfRevives||0,
    classId: p.classId, weapon: p.weapon, ammo: p.ammo, kills: p.kills,
    damageDealt: p.damageDealt, dps: Math.round(recentDamage/5), shots: p.shots, hits: p.hits,
    upgrades: p.upgrades, talents:p.talents, grafts:p.grafts, choices: p.choices, weaponChoices:p.weaponChoices,graftChoices:p.graftChoices,
    loadout:p.loadout,slot:p.slot, momentumActive:p.momentumUntil>p.room.clock,momentumStacks:p.momentumStacks,
    ready: p.ready, augmentReady:p.augmentReady,armoryReady:p.armoryReady,talentReady:p.talentReady,graftReady:p.graftReady,graftToken:p.graftToken,
    overtimeVote:p.overtimeVote,augmentPicksRemaining:p.augmentPicksRemaining,draftToken:p.draftToken,rerolls:p.rerolls||0,
    reloading: p.reloadEnd > 0,
    reloadWindowIn:p.reloadEnd>0?Math.max(0,p.reloadWindowStart-p.room.clock):0,
    reloadWindowLeft:p.reloadEnd>0?Math.max(0,p.reloadWindowEnd-p.room.clock):0,
    reloadAttempted:!!p.reloadAttempted,
    reloadBoosted:p.reloadBoostSlot>=0&&p.reloadBoostSlot===p.slot,
    skillCooldown: Math.max(0,p.skillReadyAt-p.room.clock), skillActive: p.room.clock < p.skillUntil,
    arcCharges:p.arcCharges,phaseCharges:p.phaseCharges,reclaimerCooldown:Math.max(0,p.reclaimerReadyAt-p.room.clock),
    heat:p.weapon==='borer'?Math.round(p.slotHeat?.[p.slot]||0):0,
    ventRemaining:p.weapon==='borer'?Math.max(0,(p.slotVentUntil?.[p.slot]||0)-p.room.clock):0,controlCharges:p.controlCharges||0,
    slowed:p.room.clock<(p.slowUntil||0) };
}
function send(ws, data) { if (ws && !ws.closed) ws.send(JSON.stringify(data)); }
function updateReady(p){p.ready=p.augmentReady&&p.armoryReady&&p.talentReady&&p.graftReady!==false;}
function announce(room, text) {
  room.feed.unshift({ text, at: Date.now() });
  room.feed.length = Math.min(room.feed.length, 5);
}
export function expireDisconnectedPlayers(room){
  let removed=0;
  for(const p of [...room.players.values()])if(p.disconnected&&room.clock>=p.reconnectUntil){
    room.players.delete(p.id);removed++;
    announce(room,`${p.name} // RECONNECT WINDOW EXPIRED`);
  }
  if(!room.players.size&&room.code)rooms.delete(room.code);
  if(room.hostId&&!room.players.has(room.hostId))room.hostId=[...room.players.keys()][0]||null;
  return removed;
}
function currentHostId(room){
  const host=room.players.get(room.hostId);
  return host&&!host.disconnected?host.id:[...room.players.values()].find(q=>!q.disconnected)?.id||room.hostId;
}
function isRoomHost(room,p){return currentHostId(room)===p.id;}
export function configureIntermission(room,p,seconds){
  if(room.phase!=='lobby'||!isRoomHost(room,p)||![30,60,120].includes(seconds))return false;
  room.intermissionSeconds=seconds;
  announce(room,`SERVICE WINDOW // ${seconds} SECONDS · ${p.name}`);
  return true;
}
export function configureRunSeed(room,p,value){
  if(room.phase!=='lobby'||!isRoomHost(room,p))return false;
  if(value===null||value==='')room.seedOverride=null;
  else if(typeof value==='string'&&/^\d{1,10}$/.test(value)&&Number(value)<=0xffffffff)room.seedOverride=Number(value);
  else return false;
  announce(room,`RUN SEED // ${room.seedOverride===null?'RANDOMIZED':String(room.seedOverride).padStart(10,'0')}`);
  return true;
}
const hazardProfile=room=>room.overtimeActive?activeProtocol(room):{cycle:8,warnAt:4,activeAt:5,activeEnd:7,damageScale:1,slowDuration:1.2,spawnScale:1.1};
const hazardCycleLength=room=>hazardProfile(room).cycle;
function overtimeTally(room){
  const living=[...room.players.values()].filter(p=>!p.dead&&!p.disconnected);
  return {yes:living.filter(p=>p.overtimeVote==='overtime').length,no:living.filter(p=>p.overtimeVote==='stable').length,eligible:living.length};
}
export function resolveOvertimeVote(room){
  const {yes,eligible}=overtimeTally(room);
  return room.phase==='intermission'&&yes>eligible/2;
}
function advanceIfReady(room){
  if([...room.players.values()].every(p=>p.dead||p.disconnected||(p.ready&&p.overtimeVote!==null)))room.timer=Math.min(room.timer,2);
}
export function castOvertimeVote(room,p,vote){
  if(room.phase!=='intermission'||room.wave>=9||p.dead||!['stable','overtime'].includes(vote)||p.overtimeVote===vote||room.players.get(p.id)!==p)return false;
  p.overtimeVote=vote;
  const tally=overtimeTally(room);
  announce(room,`${p.name} // ${vote==='overtime'?'OVERTIME':'STABLE ROUTE'} VOTE (${tally.yes}/${tally.eligible})`);
  advanceIfReady(room);
  return true;
}
export function placePing(room,p,{x,y,kind}){
  x=Number(x);y=Number(y);
  if(room.phase!=='combat'||p.dead||room.players.get(p.id)!==p||!['route','danger'].includes(kind)||
     !Number.isFinite(x)||!Number.isFinite(y)||room.clock-(p.lastPing??-100)<.9||
     Math.hypot(x-p.x,y-p.y)>15||!free(x,y,.15,room.grid)||!visible(p.x,p.y,x,y,room.grid))return false;
  p.lastPing=room.clock;
  room.pings||=[];
  room.pings.push({id:room.seq++,x,y,kind,byId:p.id,name:p.name,expiresAt:room.clock+6});
  if(room.pings.length>6)room.pings.splice(0,room.pings.length-6);
  announce(room,`${p.name} // ${kind==='danger'?'DANGER':'MOVE HERE'} PING`);
  return true;
}
export function requestRevive(room,p,targetId){
  if(room.phase!=='combat'||p.dead||room.players.get(p.id)!==p)return false;
  const target=room.players.get(String(targetId));
  if(!target?.downed||target.dead||target.downedUntil<=room.clock)return false;
  const self=target===p;
  if(self){
    if(p.selfRevives>=1||[...room.players.values()].some(q=>q!==p&&!q.dead&&!q.downed&&!q.disconnected))return false;
  }else if(p.downed||Math.hypot(p.x-target.x,p.y-target.y)>1.8||!visible(p.x,p.y,target.x,target.y,room.grid))return false;
  p.reviveTargetId=target.id;p.reviveIntentAt=room.clock;
  return true;
}
function updateRevives(room,dt){
  for(const target of room.players.values()){
    if(!target.downed)continue;
    if(target.disconnected){target.downedUntil+=dt;continue;}
    if(room.clock>=target.downedUntil){
      target.downed=false;target.dead=true;target.reviveProgress=0;
      announce(room,`${target.name} // SIGNAL LOST`);
      continue;
    }
    const helpers=[...room.players.values()].filter(p=>p.reviveTargetId===target.id&&room.clock-p.reviveIntentAt<.3&&
      !p.dead&&!p.disconnected&&(p===target?(p.selfRevives<1&&![...room.players.values()].some(q=>q!==p&&!q.dead&&!q.downed&&!q.disconnected)):
      (!p.downed&&Math.hypot(p.x-target.x,p.y-target.y)<=1.8&&visible(p.x,p.y,target.x,target.y,room.grid))));
    if(!helpers.length){target.reviveProgress=0;continue;}
    const self=helpers.includes(target);
    target.reviveProgress+=dt/(self?4:2.5);
    if(target.reviveProgress<1)continue;
    target.downed=false;target.hp=Math.max(30,Math.ceil(target.maxHp*.35));
    target.reviveProgress=0;target.downedUntil=0;target.invulnerableUntil=room.clock+2;
    if(self)target.selfRevives++;
    for(const p of helpers){p.reviveTargetId=null;p.reviveIntentAt=-100;if(!self&&p.encounterMetrics)p.encounterMetrics.revives++;}
    announce(room,`${target.name} // SIGNAL RESTORED${self?' (EMERGENCY REBOOT)':''}`);
    broadcastFx(room,'heal',target.x,target.y);
  }
}
function snapshot(room) {
  for(const p of room.players.values())while(p.damageHistory.length&&p.damageHistory[0].at<room.clock-5)p.damageHistory.shift();
  const hazardTime=(room.clock-room.hazardStart)%hazardCycleLength(room),overtime=overtimeTally(room);
  const profile=hazardProfile(room);
  const hazardWarning=room.phase==='combat'&&hazardTime>=profile.warnAt&&hazardTime<profile.activeAt;
  const hazardActive=room.phase==='combat'&&hazardTime>=profile.activeAt&&hazardTime<profile.activeEnd;
  const data = { type: 'state', phase: room.phase, wave: room.wave, stageIndex:room.stageIndex, grid:room.grid, timer: Math.max(0, room.timer),
    layoutId:room.layoutId,runSeed:room.runSeed,seedOverride:room.seedOverride??null,hostId:currentHostId(room),intermissionSeconds:room.intermissionSeconds,
    order:room.order?{id:room.order.id,name:room.order.name,detail:room.order.detail}:null,
    pressureBand:room.pressureBand||0,encounterSeconds:room.phase==='combat'?Math.floor(room.clock-(room.encounterStart??room.clock)):0,
    salvage:{count:room.salvage||0,target:room.salvageTarget||0,earned:!!room.salvageEarned},
    contract:{credits:room.contractCredits||0,strain:room.contractStrain||0,bonus:!!room.contractBonus},
    report:room.phase==='intermission'||room.phase==='victory'?room.lastReport:null,
    workOrder:room.workOrder?{
      kind:room.workOrder.kind,name:workOrders[room.workOrder.kind].name,short:workOrders[room.workOrder.kind].short,
      detail:workOrders[room.workOrder.kind].detail,target:room.workOrder.target,
      progress:room.workOrder.kind==='speed'?Math.floor(room.workOrder.elapsed??(room.clock-room.encounterStart)):room.workOrder.kind==='intact'?(room.workOrder.failed?0:1):room.workOrder.progress,
      remaining:room.workOrder.kind==='speed'?Math.max(0,Math.ceil(room.workOrder.target-(room.workOrder.elapsed??(room.clock-room.encounterStart)))):null,
      failed:!!room.workOrder.failed,result:room.workOrder.result||null}:null,
    overtime:{...overtime,active:!!room.overtimeActive,protocol:room.phase==='intermission'?nextProtocol(room):activeProtocol(room)},
    machines:(room.machines||[]).map(m=>({id:m.id,x:m.x,y:m.y,targetX:m.targetX,targetY:m.targetY,radius:m.radius,
      mode:m.mode,modeName:MACHINE_MODES[m.mode].name,state:m.state,operatorId:m.session?.holderId||null,
      step:m.session?.step||0,steps:MACHINE_MODES[m.mode].steps,selector:m.session?.selector??0,
      target:m.session?m.sequence[m.session.step]:null,channels:MACHINE_MODES[m.mode].channels,
      sweep:m.session?.sweep??0,zone:m.session?.zone??0,lockProgress:m.session?.lockProgress??0,
      lockWait:m.session?Math.max(0,m.session.lockAt-room.clock):0,
      mistakes:m.session?.mistakes||0,readyIn:Math.max(0,m.readyAt-room.clock),warningRemaining:Math.max(0,m.fireAt-room.clock)})),
    machine:room.machine?{...machineSite,kind:activeProtocol(room).id,name:activeProtocol(room).machine,
      state:room.machine.state,cooldown:Math.max(0,room.machine.readyAt-room.clock),
      warningRemaining:Math.max(0,room.machine.fireAt-room.clock),triggeredBy:room.machine.triggeredBy,
      holderId:room.machine.holderId||null,holdProgress:room.machine.holderId?Math.min(1,Math.max(0,(room.clock-room.machine.holdStartedAt)/MACHINE_HOLD_SECONDS)):0}:null,
    players: [...room.players.values()].map(publicPlayer), enemies: room.enemies.map(e => ({ id: e.id, type: e.type, x: e.x, y: e.y, hp: e.hp, maxHp: e.maxHp, flash: e.flash,
      burning:room.clock<e.burnUntil, frozen:room.clock<e.slowUntil, poisoned:room.clock<e.toxinUntil,
      marked:room.clock<(e.markedUntil||0), stunned:room.clock<(e.stunnedUntil||0), charging:room.clock<(e.chargeUntil||0), boss:!!e.boss, overdrive:!!e.overdrive,
      shielded:!!e.shielded, faceX:e.faceX||0, faceY:e.faceY||1,
      telegraph:e.telegraph?{kind:e.telegraph.kind,x:e.telegraph.x,y:e.telegraph.y,radius:e.telegraph.radius||0,remaining:Math.max(0,e.telegraph.fireAt-room.clock)}:null })),
    projectiles: room.projectiles.map(b => ({ id:b.id, kind:b.kind, side:b.side, ownerId:b.ownerId, x:b.x, y:b.y, h:b.h, vx:b.vx, vy:b.vy, vh:b.vh, arcCharged:!!b.arcCharged,phaseCharged:!!b.phaseCharged,heatHigh:!!b.heatHigh })), drops: room.drops,
    feed: room.feed, pings:(room.pings||[]).map(({id,x,y,kind,byId,name,expiresAt})=>({id,x,y,kind,byId,name,remaining:Math.max(0,expiresAt-room.clock)})), spawnLeft: room.spawnLeft,
    hazards:hazardLayouts[room.stageIndex].map((h,i)=>({...h,id:i,kind:stages[room.stageIndex].id,
      warning:hazardWarning,active:hazardActive})) };
  for (const p of room.players.values()) send(p.ws, data);
}
function dealAugments(room,p,exclude=[]){
  const eligible=upgrades.filter(u=>(!u.classId||u.classId===p.classId)&&
    (!u.requiresWeapon||p.loadout?.includes(u.requiresWeapon))&&
    (!u.requiresBounce||p.upgrades?.ricochet||p.loadout?.some(id=>weapons[id]?.bounces)));
  const available=eligible.filter(u=>!exclude.includes(u.id));
  const pick=list=>list[Math.floor(roomRandom(room)*list.length)];
  if(room.wave===1&&!exclude.length){
    p.choices=[pick(available.filter(u=>u.rarity==='SIGNATURE')).id,
      pick(available.filter(u=>u.rarity==='RARE')).id,
      pick(available.filter(u=>u.rarity==='COMMON')).id];
  }else{
    const pool=shuffled(room,available);
    p.choices=pool.slice(0,3).map(u=>u.id);
    if(!p.choices.some(id=>available.find(u=>u.id===id).rarity!=='COMMON'))p.choices[2]=pick(available.filter(u=>u.rarity==='RARE')).id;
  }
  p.draftToken=(p.draftToken||0)+1;
}
export function rerollAugments(room,p,token){
  if(room.phase!=='intermission'||p.augmentReady||!p.rerolls||token!==p.draftToken||room.players.get(p.id)!==p)return false;
  const old=[...p.choices];p.rerolls--;
  dealAugments(room,p,old);
  return true;
}
export function chooseOptions(room, p, bonus=false, bossReward=room.wave%3===0) {
  dealAugments(room,p);
  p.augmentPicksRemaining=1+Number(!!bonus)+Number(!!room.contractBonus);
  p.rerolls=room.salvageEarned?1:0;
  p.augmentReady = false; p.ready = false;
  p.overtimeVote=room.wave>=9?'stable':null;
  p.weaponChoices = room.wave % 3 === 0 || room.wave === 1
    ? shuffled(room,Object.keys(weapons).filter(id=>!p.loadout?.includes(id))).slice(0,3) : [];
  p.armoryReady = p.weaponChoices.length===0;
  p.talentReady = room.wave%3!==0 || talents[p.classId].every(branch=>branch.nodes.every(node=>p.talents?.[node.id]));
  p.graftChoices=bossReward?grafts.filter(g=>!p.grafts?.includes(g.id)).map(g=>g.id):[];
  p.graftReady=p.graftChoices.length===0;
  if(!p.graftReady)p.graftToken=(p.graftToken||0)+1;
}
export function startWave(room) {
  room.overtimeActive=resolveOvertimeVote(room);
  room.wave++;
  room.stageIndex=Math.floor((room.wave-1)/3)%stages.length;
  room.protocol=selectOvertimeProtocol(room.runSeed,room.wave);
  if(room.wave%3===1)room.contractCredits=0;
  room.contractBonus=false;
  const variant=selectLayout(room.runSeed,room.wave);
  room.layoutId=room.stageIndex*bayNames.length+variant;
  room.grid=roomLayouts[room.stageIndex][variant];
  room.order=room.wave%3===0?null:selectEncounterOrder(room.runSeed,room.wave,room.stageIndex);
  room.phase = 'combat';
  room.lastReport=null;
  room.timer = 0;
  room.encounterStart=room.clock;room.pressureBand=0;room.spawnCount=0;
  const workKind=selectWorkOrder(room.runSeed,room.wave);
  room.workOrder={kind:workKind,target:workKind==='machine'?(room.wave%3===0?1:2):workKind==='speed'?(room.wave%3===0?100:55):1,
    progress:0,failed:false,result:null,processedIds:new Set()};
  room.salvage=0;room.salvageEarned=false;room.salvageTarget=Math.max(7,5+2*room.players.size);
  room.hazardStart=room.clock;room.hazardCycle=-1;
  room.machines=machineStations(room.grid,variant,room.wave,room.runSeed);
  room.machine=room.machines[0];
  room.spawnLeft = (room.wave%3===0 ? 0 : Math.min(20,3 + room.wave * 2 + room.players.size))+(room.contractStrain||0)+(room.overtimeActive?(room.protocol.extraEnemies||0):0);
  room.spawnTimer = room.overtimeActive?.45:.7;
  room.enemies.length = 0;
  room.projectiles.length = 0;
  room.drops.length = 0;
  room.pings = [];
  const crewEntries=findSafeCrewSpawns(room.grid,room.players.size,room.stageIndex);
  for (const [index,p] of [...room.players.values()].entries()) {
    p.ready = false; p.choices = [];p.weaponChoices=[];p.graftChoices=[];p.overtimeVote=null;
    p.encounterMetrics=newEncounterMetrics();
    p.slotHeat=[0,0];p.slotVentUntil=[0,0];p.controlCharges=0;
    if (room.wave === 1) { p.hp = p.maxHp; p.dead = false; p.kills = 0; }
    else if (p.dead||p.downed) { p.dead = false; p.hp = Math.ceil(p.maxHp * .4); }
    else p.hp = Math.min(p.maxHp, p.hp + 12);
    p.downed=false;p.downedUntil=0;p.reviveProgress=0;p.reviveTargetId=null;p.reviveIntentAt=-100;
    p.x=crewEntries[index].x;p.y=crewEntries[index].y;
    p.invulnerableUntil = room.clock + 2.5;
  }
  if(room.wave%3===0)spawnBoss(room);
  announce(room, `${stages[room.stageIndex].name} // ${room.wave%3===0?'BOSS SIGNAL':'WAVE '+String(room.wave).padStart(2,'0')}`);
  announce(room,`WORK ORDER // ${workOrders[workKind].name} · ${room.workOrder.target}${workKind==='speed'?'S':workKind==='machine'?' TARGETS':''}`);
  if(room.overtimeActive)announce(room,`${activeProtocol(room).name} // ${activeProtocol(room).notice}`);
}
function beginRun(room) {
  room.wave = 0;
  room.contractCredits=0;room.contractStrain=0;room.contractBonus=false;room.workOrder=null;
  room.runSeed=room.seedOverride??crypto.randomBytes(4).readUInt32LE(0);
  room.rngState=room.runSeed;
  room.overtimeActive=false;
  room.protocol=null;
  room.lastReport=null;
  for (const [crewIndex,p] of [...room.players.values()].entries()) {
    p.hp = 100; p.maxHp = 100; p.dead = false; p.downed=false;p.downedUntil=0;p.reviveProgress=0;p.reviveTargetId=null;p.reviveIntentAt=-100;p.selfRevives=0;
    p.weapon = classes[p.classId].weapon; p.ammo = weapons[p.weapon].mag;
    p.loadout=[p.weapon,null];p.slot=0;p.slotAmmo=[p.ammo,0];p.talents={};p.upgrades = {};p.grafts=[];p.graftChoices=[];p.graftReady=true;p.graftToken=0;p.arcCharges=0;p.phaseCharges=0;p.reclaimerReadyAt=0;p.damage = 1; p.fireRate = 1;
    p.slotHeat=[0,0];p.slotVentUntil=[0,0];p.controlCharges=0;
    p.speed = 1; p.armor = 0; p.crit = 0; p.leech = 0; p.mag = 1;
    p.reloadEnd = 0;p.reloadWindowStart=0;p.reloadWindowEnd=0;p.reloadAttempted=false;p.reloadBoostSlot=-1;
    p.lastShot = -100; p.skillReadyAt = 0; p.skillUntil = 0;p.tauntUntil=0;p.wardUntil=0;p.momentumUntil=0;p.momentumStacks=0;
    p.kills = 0; p.damageDealt = 0; p.damageHistory = []; p.shots = 0; p.hits = 0;
    p.overtimeVote=null;p.augmentPicksRemaining=1;p.draftToken=0;p.rerolls=0;p.lastPing=-100;
    p.x = 12.5+(crewIndex-(room.players.size-1)/2)*1.25; p.y = 17.5; p.a=-Math.PI/2;
  }
  startWave(room);
}
const connectedCount=room=>[...room.players.values()].filter(p=>!p.disconnected).length;
const maxActiveEnemies=room=>Math.min(18,6+connectedCount(room)*3);
const majorAttackCost=e=>e.boss?2:1;
const majorAttackBudget=room=>Math.min(4,1+connectedCount(room));
const activeMajorAttacks=room=>room.enemies.reduce((sum,e)=>sum+(e.telegraph||e.attackWindowUntil>room.clock?majorAttackCost(e):0),0);
export function spawnEnemy(room) {
  const living = [...room.players.values()].filter(p => !p.dead&&!p.downed&&!p.disconnected);
  if (!living.length||room.enemies.length>=maxActiveEnemies(room)) return false;
  const pool=room.order?.roles||stages[room.stageIndex].enemies;
  const type=room.order?pool[((room.spawnCount||0)+(room.pressureBand||0))%pool.length]:pool[Math.floor(roomRandom(room)*pool.length)];
  const stats = enemyStats[type];
  const concealed=[],candidates=[],fallback=[];
  for(let ty=1;ty<24;ty++)for(let tx=1;tx<24;tx++){
    const x=tx+.5,y=ty+.5;
    if(!free(x,y,stats.radius+.12,room.grid))continue;
    if(room.enemies.some(e=>Math.hypot(e.x-x,e.y-y)<stats.radius+enemyStats[e.type].radius+.3))continue;
    const nearest=Math.min(...living.map(p=>Math.hypot(p.x-x,p.y-y)));
    if(nearest>8){
      if(living.every(p=>!visible(p.x,p.y,x,y,room.grid)))concealed.push([x,y]);
      else candidates.push([x,y]);
    }
    else if(nearest>4.5)fallback.push([x,y]);
  }
  const options=concealed.length?concealed:candidates.length?candidates:fallback;
  if(!options.length)return false;
  const [x,y]=options[Math.floor(roomRandom(room)*options.length)];
  const hp = Math.round(stats.hp * (1 + (room.wave-1)*.21) * (1 + (Math.max(1,connectedCount(room))-1)*.25));
  room.enemies.push({ id: room.seq++, type, x, y, hp, maxHp: hp, attack: 0, flash: 0, phase: roomRandom(room)*6,
    spawnedAt:room.clock,shielded:type==='sentinel',faceX:0,faceY:1 });
  room.spawnCount=(room.spawnCount||0)+1;
  broadcastFx(room,'spawn',x,y);
  return true;
}
function spawnBoss(room){
  const type=stages[room.stageIndex].boss,stats=enemyStats[type];
  const hp=Math.round(stats.hp*(1+Math.floor((room.wave-1)/9)*.45)*(1+(room.players.size-1)*.5));
  const [x,y]=[[12.5,5.5],[12.5,8.5],[4.5,12.5],[20.5,12.5]].find(([bx,by])=>free(bx,by,stats.radius+.12,room.grid))||[12.5,12.5];
  room.enemies.push({id:room.seq++,type,x,y,hp,maxHp:hp,attack:1.5,flash:0,phase:0,boss:true,summon:6});
}
function hurt(room, p, amount) {
  if (p.dead || p.downed || p.disconnected || room.phase !== 'combat') return;
  if (room.clock < p.invulnerableUntil || room.clock-p.hurtAt < .45) return;
  const bulwark = p.classId==='vanguard' && room.clock < p.skillUntil ? .25 : 1;
  const ward=room.clock<p.wardUntil ? (p.wardStrength||.8) : 1;
  const cover=[...room.players.values()].filter(q=>q!==p&&q.classId==='vanguard'&&room.clock<q.skillUntil&&Math.hypot(q.x-p.x,q.y-p.y)<5)
    .map(q=>({player:q,factor:q.talents?.v_bastion?.65:q.upgrades?.bulwarkPlus?.75:.85})).sort((a,b)=>a.factor-b.factor)[0];
  const unguarded=Math.max(1,amount*(1-p.armor)*ward);
  const actual=Math.max(1,amount*(1-p.armor)*bulwark*ward*(cover?.factor||1));
  if(cover?.player.encounterMetrics)cover.player.encounterMetrics.guardedDamage+=Math.round(Math.max(0,unguarded*bulwark-actual));
  if(bulwark<1&&p.encounterMetrics)p.encounterMetrics.guardedDamage+=Math.round(Math.max(0,unguarded-unguarded*bulwark));
  p.hp = Math.max(0, p.hp - actual);
  if(p.upgrades?.ward){p.wardUntil=room.clock+2;p.wardStrength=.8;}
  p.hurtAt = room.clock;
  const operated=room.machines?.find(m=>m.session?.holderId===p.id);
  if(operated){operated.session.lockProgress=0;operated.session.lockAt=Math.max(operated.session.lockAt,room.clock+.6);broadcastFx(room,'machineError',operated.x,operated.y);}
  if(p.reviveTargetId){const target=room.players.get(p.reviveTargetId);if(target)target.reviveProgress=0;p.reviveTargetId=null;p.reviveIntentAt=-100;}
  send(p.ws, { type: 'hurt', hp: p.hp });
  if (p.hp <= 0) {
    p.downed=true;p.downedUntil=room.clock+18;p.reviveProgress=0;
    if(room.workOrder?.kind==='intact')room.workOrder.failed=true;
    if(room.machine?.holderId===p.id){room.machine.holderId=null;broadcastFx(room,'machineAbort',machineSite.x,machineSite.y);}
    if(operated){operated.session=null;broadcastFx(room,'machineAbort',operated.x,operated.y);}
    announce(room, `${p.name} // DOWNED · 18S TO RESTORE`);
  }
}
function broadcastFx(room,kind,x,y){for(const q of room.players.values())send(q.ws,{type:'fx',kind,x,y});}
function killEnemy(room, enemy, player, entries) {
  const index=room.enemies.indexOf(enemy);
  if(index<0)return;
  room.enemies.splice(index,1);
  player.kills++;
  if(player.encounterMetrics)player.encounterMetrics.kills++;
  if(player.encounterMetrics&&player.classId==='runner'&&room.clock<player.skillUntil)player.encounterMetrics.overclockKills++;
  if(room.phase==='combat'&&!room.salvageEarned){
    room.salvage=(room.salvage||0)+1;
    if(room.salvage>=room.salvageTarget){
      room.salvageEarned=true;
      announce(room,'SALVAGE QUOTA MET // PERSONAL AUGMENT REROLL FOR EVERY CREW MEMBER');
      broadcastFx(room,'salvage',enemy.x,enemy.y);
    }
  }
  if (player.leech) player.hp = Math.min(player.maxHp, player.hp + player.leech);
  if(player.grafts?.includes('reclaimerCore')&&room.clock>=player.reclaimerReadyAt){
    player.reclaimerReadyAt=room.clock+4;
    for(const q of room.players.values())if(!q.dead&&!q.downed&&Math.hypot(q.x-player.x,q.y-player.y)<=5)q.hp=Math.min(q.maxHp,q.hp+12);
    broadcastFx(room,'heal',player.x,player.y);
  }
  if (roomRandom(room) < .19+.08*(player.upgrades?.scavenger||0)) room.drops.push({ id: room.seq++, x: enemy.x, y: enemy.y, kind: 'med' });
  if(player.upgrades?.momentum){player.momentumStacks=Math.min(3,(player.momentumStacks||0)+1);player.momentumUntil=room.clock+4;}
  if(player.talents?.r_recycle&&player.classId==='runner'&&room.clock<player.skillUntil)player.skillReadyAt=Math.max(room.clock,player.skillReadyAt-1);
  if(player.talents?.r_cloud&&enemy.toxinUntil>room.clock){
    for(const other of room.enemies)if(Math.hypot(other.x-enemy.x,other.y-enemy.y)<2.5){other.toxinUntil=room.clock+2.4;other.toxinAt=room.clock+.6;other.toxinPower=enemy.toxinPower||5;other.toxinOwnerId=player.id;}
    broadcastFx(room,'toxin',enemy.x,enemy.y);
  }
  if(player.classId==='runner'&&room.clock<player.skillUntil&&player.upgrades?.overclockPlus){
    player.skillUntil=Math.min(room.clock+7,player.skillUntil+player.upgrades.overclockPlus);
  }
  if(player.upgrades?.shrapnel){
    broadcastFx(room,'shrapnel',enemy.x,enemy.y);
    for(const other of [...room.enemies]){
      if(Math.hypot(other.x-enemy.x,other.y-enemy.y)<2.4&&visible(enemy.x,enemy.y,other.x,other.y,room.grid)){
        dealDamage(room,player,other,28+18*(player.upgrades.shrapnel-1),false,entries);
      }
    }
    if(player.upgrades.fragment)for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;
      room.projectiles.push({id:room.seq++,side:'player',kind:'fragment',ownerId:player.id,shot:{hit:false},x:enemy.x,y:enemy.y,h:1.1,
        vx:Math.cos(a)*19,vy:Math.sin(a)*19,vh:0,radius:.08,damage:16*player.damage,rangeLeft:4,crit:false,pierce:0,bounces:0,hitIds:new Set()});
    }
  }
}
export function dealDamage(room,p,enemy,raw,crit,entries){
  if(enemy.hp<=0)return 0;
  const marked=room.clock<(enemy.markedUntil||0);
  let armored=false;
  if(marked){
    raw*=1.3;
    enemy.markCharges=(enemy.markCharges||1)-1;
    if(enemy.markCharges<=0)enemy.markedUntil=0;
    broadcastFx(room,'markBreak',enemy.x,enemy.y);
  }
  if(enemy.type==='sentinel'&&enemy.shielded&&Number.isFinite(p.x)&&Number.isFinite(p.y)){
    const dx=p.x-enemy.x,dy=p.y-enemy.y,dist=Math.hypot(dx,dy)||1;
    if((dx*(enemy.faceX||0)+dy*(enemy.faceY||0))/dist>.2){
      raw*=.4;armored=true;
      if(room.clock>=(enemy.shieldFxAt||0)){broadcastFx(room,'shield',enemy.x,enemy.y);enemy.shieldFxAt=room.clock+.25;}
    }
  }
  if(p.upgrades?.execution&&enemy.hp/enemy.maxHp<.35)raw*=1+.3*p.upgrades.execution;
  if(p.talents?.v_resolve&&p.hp/p.maxHp<.35)raw*=1.35;
  if(p.talents?.m_vigor&&p.hp/p.maxHp>.8)raw*=1.25;
  if(p.talents?.b_rush&&Math.hypot(p.x-enemy.x,p.y-enemy.y)<3)raw*=1.3;
  if(p.talents?.r_surge&&((p.moveSpeed||0)>5||room.clock<(p.dashUntil||0)))raw*=1.25;
  const amount=Math.min(enemy.hp,Math.max(0,Math.round(raw)));
  if(amount<=0)return;
  enemy.hp-=amount;enemy.flash=.13;
  p.damageDealt+=amount;p.damageHistory.push({at:room.clock,amount});
  if(p.encounterMetrics)p.encounterMetrics.damage+=amount;
  const entry=entries.get(enemy.id)||{id:enemy.id,x:enemy.x,y:enemy.y,amount:0,crit:false,armored:false,marked:false,staggered:false,height:enemy.type==='mite'?1.2:enemy.boss?2.8:enemy.type==='brute'?2.3:2};
  entry.amount+=amount;entry.crit ||= crit;entry.armored ||= armored;entry.marked ||= marked;entries.set(enemy.id,entry);
  if(enemy.hp<=0)killEnemy(room,enemy,p,entries);
  return amount;
}
function sendDamage(p,entries){if(entries.size)send(p.ws,{type:'damage',hits:[...entries.values()]});}
export function activateMachine(room,p,m=room.machine){
  if(room.phase!=='combat'||!m||m.state!=='ready'||p.dead||p.downed||p.disconnected||
     room.players.get(p.id)!==p||Math.hypot(p.x-(m.x??machineSite.x),p.y-(m.y??machineSite.y))>2.2||
     !visible(p.x,p.y,m.x??machineSite.x,m.y??machineSite.y,room.grid))return false;
  m.state='warning';m.fireAt=room.clock+1.25;m.readyAt=room.clock+(room.overtimeActive?(activeProtocol(room).machineCooldown||17):17);m.triggeredBy=p.id;m.holderId=null;m.session=null;
  if(p.encounterMetrics)p.encounterMetrics.machineCycles++;
  if(p.upgrades?.controlSplice)p.controlCharges=3;
  if(p.upgrades?.serviceWard)for(const q of room.players.values())if(!q.dead&&!q.downed&&!q.disconnected&&Math.hypot(q.x-p.x,q.y-p.y)<=5){
    q.wardStrength=q.wardUntil>room.clock?Math.min(q.wardStrength||1,.75):.75;
    q.wardUntil=room.clock+4;
  }
  announce(room,`${p.name} // ${activeProtocol(room).machine} ARMED · CLEAR MARKED ZONE`);
  broadcastFx(room,'machineArm',m.targetX??machineSite.targetX,m.targetY??machineSite.targetY);
  return true;
}
export function requestMachineHold(room,p,holding){
  const m=room.machine;
  if(!holding){
    if(m?.holderId!==p.id)return false;
    m.holderId=null;broadcastFx(room,'machineAbort',machineSite.x,machineSite.y);return true;
  }
  if(room.phase!=='combat'||!m||m.state!=='ready'||m.holderId||p.dead||p.downed||p.disconnected||
     room.players.get(p.id)!==p||Math.hypot(p.x-machineSite.x,p.y-machineSite.y)>2.2||
     !visible(p.x,p.y,machineSite.x,machineSite.y,room.grid))return false;
  m.holderId=p.id;m.holdStartedAt=room.clock;
  broadcastFx(room,'machineHandle',machineSite.x,machineSite.y);
  return true;
}
export function startMachineSession(room,p){
  if(room.phase!=='combat'||p.dead||p.downed||p.disconnected||room.players.get(p.id)!==p)return false;
  if(room.machines?.some(m=>m.session?.holderId===p.id))return false;
  const station=(room.machines||[]).filter(m=>m.state==='ready'&&!m.session&&Math.hypot(p.x-m.x,p.y-m.y)<=2.2&&visible(p.x,p.y,m.x,m.y,room.grid))
    .sort((a,b)=>Math.hypot(p.x-a.x,p.y-a.y)-Math.hypot(p.x-b.x,p.y-b.y))[0];
  if(!station)return false;
  station.session={holderId:p.id,step:0,selector:station.mode==='pressure'?2:0,startedAt:room.clock,lockAt:room.clock+.7,
    sweep:0,zone:.24,pressure:2,lockProgress:0,driftAt:room.clock+1.3,mistakes:0};
  broadcastFx(room,'machineHandle',station.x,station.y);
  announce(room,`${p.name} // ${MACHINE_MODES[station.mode].name} CONNECTED · COVER THE OPERATOR`);
  return true;
}
export function machineInput(room,p,action,delta=0){
  const m=room.machines?.find(m=>m.session?.holderId===p.id),s=m?.session;
  if(!s)return false;
  if(action==='abort'){m.session=null;broadcastFx(room,'machineAbort',m.x,m.y);return true;}
  if(room.phase!=='combat'||p.dead||p.downed||p.disconnected||Math.hypot(p.x-m.x,p.y-m.y)>2.2)return false;
  if(action==='select'){
    if(delta!==-1&&delta!==1)return false;
    if(room.clock-(s.lastSelectAt??-100)<.09)return false;
    s.lastSelectAt=room.clock;
    s.selector=(s.selector+delta+MACHINE_MODES[m.mode].channels)%MACHINE_MODES[m.mode].channels;
    broadcastFx(room,'machineTick',m.x,m.y);return true;
  }
  if(action!=='commit'||room.clock<s.lockAt)return false;
  const matched=s.selector===m.sequence[s.step];
  const timed=m.mode!=='circuit'||Math.abs(s.sweep-s.zone)<.145;
  const balanced=m.mode!=='pressure'||s.lockProgress>=1.7;
  if(!matched||!timed||!balanced){s.mistakes++;s.lockAt=room.clock+(room.overtimeActive?(activeProtocol(room).faultLockout||.65):.65);s.lockProgress=0;broadcastFx(room,'machineError',m.x,m.y);return false;}
  s.step++;broadcastFx(room,'machineStep',m.x,m.y);
  if(s.step>=MACHINE_MODES[m.mode].steps){m.session=null;return activateMachine(room,p,m);}
  s.selector=m.mode==='pressure'?2:0;s.startedAt=room.clock;s.lockAt=room.clock+MACHINE_MODES[m.mode].lockout;
  s.lockProgress=0;s.driftAt=room.clock+1.3;
  return true;
}
function updateMachine(room,dt){
  for(const m of room.machines?.length?room.machines:room.machine?[room.machine]:[]){
  if(m.state==='cooldown'&&room.clock>=m.readyAt){m.state='ready';announce(room,`${activeProtocol(room).machine} // READY`);}
  if(m.session){
    const s=m.session,p=room.players.get(s.holderId);
    if(m.state!=='ready'||!p||p.dead||p.downed||p.disconnected||Math.hypot(p.x-m.x,p.y-m.y)>2.2||!visible(p.x,p.y,m.x,m.y,room.grid)){
      m.session=null;broadcastFx(room,'machineAbort',m.x,m.y);
    }else if(m.mode==='circuit'){
      const phase=((room.clock-s.startedAt)*.72)%2;s.sweep=phase<=1?phase:2-phase;s.zone=[.23,.5,.77][s.step%3];
    }else if(m.mode==='pressure'){
      if(room.clock>=s.driftAt){s.driftAt+=2.4;s.selector=Math.max(0,Math.min(4,s.selector+((s.step+s.mistakes)%2?1:-1)));s.lockProgress=0;broadcastFx(room,'machineTick',m.x,m.y);}
      if(s.selector===m.sequence[s.step])s.lockProgress=Math.min(1.7,s.lockProgress+dt);
      else s.lockProgress=0;
    }
  }
  if(m.holderId){
    const p=room.players.get(m.holderId);
    if(m.state!=='ready'||!p||p.dead||p.downed||p.disconnected||
       Math.hypot(p.x-(m.x??machineSite.x),p.y-(m.y??machineSite.y))>2.2||!visible(p.x,p.y,m.x??machineSite.x,m.y??machineSite.y,room.grid)){
      m.holderId=null;broadcastFx(room,'machineAbort',m.x??machineSite.x,m.y??machineSite.y);
    }else if(room.clock-m.holdStartedAt>=MACHINE_HOLD_SECONDS){
      m.holderId=null;activateMachine(room,p,m);
    }
  }
  if(m.state!=='warning'||room.clock<m.fireAt)continue;
  m.state='cooldown';
  const stage=room.stageIndex,owner=room.players.get(m.triggeredBy)||[...room.players.values()].find(p=>!p.dead);
  const entries=new Map();
  for(const enemy of [...room.enemies])if(Math.hypot(enemy.x-(m.targetX??machineSite.targetX),enemy.y-(m.targetY??machineSite.targetY))<(m.radius??machineSite.radius)){
    const order=room.workOrder;
    if(order?.kind==='machine'&&(room.wave%3!==0||enemy.boss)&&!order.processedIds.has(enemy.id)){
      order.processedIds.add(enemy.id);order.progress=Math.min(order.target,order.progress+1);
      if(order.progress===order.target)announce(room,'WORK ORDER // MACHINE TARGET VERIFIED');
    }
    if(stage===1){enemy.slowUntil=room.clock+4;enemy.slowFactor=.35;}
    if(owner)dealDamage(room,owner,enemy,stage===0?76:stage===1?34:94,false,entries);
    else enemy.hp=Math.max(0,enemy.hp-(stage===0?76:stage===1?34:94));
  }
  if(owner)sendDamage(owner,entries);
  for(const p of room.players.values())if(Math.hypot(p.x-(m.targetX??machineSite.targetX),p.y-(m.targetY??machineSite.targetY))<(m.radius??machineSite.radius)){
    if(stage===1)p.slowUntil=room.clock+2;
    else hurt(room,p,stage===0?16:20);
  }
  broadcastFx(room,stage===0?'machineShear':stage===1?'machinePurge':'machineArc',m.targetX??machineSite.targetX,m.targetY??machineSite.targetY);
  announce(room,`${activeProtocol(room).machine} // CYCLE COMPLETE`);
  }
}
export function settleWorkOrder(room){
  const order=room.workOrder;
  if(!order||order.result)return false;
  order.elapsed=room.clock-(room.encounterStart??room.clock);
  const met=order.kind==='speed'?order.elapsed<=order.target:
    order.kind==='intact'?!order.failed:order.progress>=order.target;
  order.result=met?'paid':'missed';
  if(met){
    room.contractCredits=Math.min(3,(room.contractCredits||0)+1);
    room.contractStrain=Math.max(0,(room.contractStrain||0)-1);
    announce(room,`WORK ORDER VERIFIED // ${room.contractCredits}/3 CREDIT · STRAIN ${room.contractStrain}/2`);
  }else{
    room.contractStrain=Math.min(2,(room.contractStrain||0)+1);
    announce(room,`WORK ORDER MISSED // STRAIN ${room.contractStrain}/2${room.wave>=9?' · FINAL RECORD':` · +${room.contractStrain} NEXT WAVE`}`);
  }
  room.contractBonus=room.wave%3===0&&room.contractCredits>=2;
  if(room.contractBonus)announce(room,'SECTOR ACCOUNT SETTLED // BONUS AUGMENT DRAFT FOR THE CREW');
  return met;
}
export function buildEncounterReport(room){
  const report={wave:room.wave,duration:Math.round(room.clock-(room.encounterStart??room.clock)),
    workOrder:room.workOrder?.result||'unresolved',overtime:room.overtimeActive?activeProtocol(room).name:null,
    salvage:!!room.salvageEarned,crew:[...room.players.values()].map(p=>({id:p.id,name:p.name,classId:p.classId,
      ...newEncounterMetrics(),...p.encounterMetrics}))};
  room.lastReport=report;
  return report;
}
function spawnPlayerProjectile(room,p,w,angle,pitch,shot){
  const speed=w.speed*(1+.18*(p.upgrades.velocity||0)),horizontal=Math.cos(pitch)*speed;
  const talentDamage=(p.talents?.v_rounds&&['carbine','rail'].includes(p.weapon)?1.2:1)*(p.talents?.m_focus&&['pulse','arcgun'].includes(p.weapon)?1.2:1);
  const b={id:room.seq++,side:'player',kind:p.weapon,ownerId:p.id,shot,
    x:p.x,y:p.y,h:shot.originHeight,vx:Math.cos(angle)*horizontal,vy:Math.sin(angle)*horizontal,vh:Math.sin(pitch)*speed,
    radius:shot.heatHigh?.16:w.radius,damage:w.damage*p.damage*(1+.1*(p.upgrades.velocity||0))*talentDamage*(shot.boosted?1.2:1)*(shot.phaseCharged?.8:1)*(shot.controlCharged?.8:1),rangeLeft:w.range,crit:roomRandom(room)<p.crit,
    pierce:(w.pierce||0)+(p.upgrades.pierce||0)+(shot.phaseCharged?1:0)+(shot.controlCharged?1:0),bounces:(w.bounces||0)+(p.upgrades.ricochet||0)+(shot.phaseCharged?1:0),bounceCount:0,hitIds:new Set(),arcCharged:!!shot.arcCharged,phaseCharged:!!shot.phaseCharged,heatHigh:!!shot.heatHigh};
  room.projectiles.push(b);return b;
}
export function fire(room, p, aim, verticalAim = 0, height = 1.58) {
  if (room.phase !== 'combat' || p.dead || p.downed || p.reloadEnd > 0 ||(p.slotVentUntil?.[p.slot]||0)>room.clock ||
      room.machines?.some(m=>m.session?.holderId===p.id)||
      (p.reviveTargetId&&room.clock-p.reviveIntentAt<.3)) return;
  const w = weapons[p.weapon];
  const overclock = p.classId==='runner' && room.clock < p.skillUntil ? 1.75 : 1;
  if (room.clock - p.lastShot < w.interval / (p.fireRate*overclock) - .015) return;
  if (p.ammo <= 0) { reload(room,p); return; }
  p.lastShot = room.clock;
  p.ammo--;
  p.shots++;
  const pellets = w.pellets || 1;
  const count=pellets+(p.weapon==='scatter'&&p.talents?.b_pellets?2:0);
  const pitch = clamp(Number(verticalAim) || 0, -1.3, 1.3);
  const requested=Number(aim),baseAngle=clamp(Number.isFinite(requested)?requested:p.a,p.a-.22,p.a+.22);
  const shot={hit:false,originHeight:clamp(Number(height)||1.58,.9,2.85),arcCharged:p.arcCharges>0,phaseCharged:p.phaseCharges>0,graftProc:false,
    boosted:p.reloadBoostSlot>=0&&p.reloadBoostSlot===p.slot,controlCharged:p.controlCharges>0,heatHigh:false};
  if(shot.arcCharged)p.arcCharges--;
  if(shot.phaseCharged)p.phaseCharges--;
  if(shot.controlCharged)p.controlCharges--;
  if(p.weapon==='borer'){
    p.slotHeat||=[0,0];p.slotVentUntil||=[0,0];
    p.slotHeat[p.slot]=Math.min(100,(p.slotHeat[p.slot]||0)+12);
    shot.heatHigh=p.slotHeat[p.slot]>=80;
    if(p.slotHeat[p.slot]>=100){p.slotVentUntil[p.slot]=room.clock+1.2;broadcastFx(room,'vent',p.x,p.y);}
  }
  if(shot.boosted)p.reloadBoostSlot=-1;
  for (let i=0; i<count; i++) {
    const angle=baseAngle+(count===1?0:(i-(count-1)/2)*w.spread+(roomRandom(room)-.5)*.018);
    const pelletPitch=pitch+(pellets===1?0:(roomRandom(room)-.5)*.035);
    const bolt=spawnPlayerProjectile(room,p,w,angle,pelletPitch,shot);
    if(p.weapon==='burst'&&i===Math.floor(count/2))bolt.crit=true;
  }
  if(p.talents?.v_barrage&&p.shots%5===0)spawnPlayerProjectile(room,p,w,baseAngle,pitch,shot);
  if(p.upgrades.mirror&&p.shots%Math.max(2,5-p.upgrades.mirror)===0){
    spawnPlayerProjectile(room,p,w,baseAngle-.11,pitch,shot);
    spawnPlayerProjectile(room,p,w,baseAngle+.11,pitch,shot);
  }
  for (const q of room.players.values()) send(q.ws, { type: 'shot', id: p.id, x: p.x, y: p.y, a: p.a, weapon: p.weapon });
}
function damageBatch(batches,p){
  if(!batches.has(p.id))batches.set(p.id,new Map());
  return batches.get(p.id);
}
function applyProjectileHit(room,b,p,enemy,amount,entries){
  // Heavy impacts buy a short opening. The recovery lock prevents pellet spam
  // and four players from holding a threat permanently in stun.
  const impact=b.kind==='scatter'&&Math.hypot(enemy.x-p.x,enemy.y-p.y)<=5.5?.48:b.kind==='rail'?.68:0;
  if(amount>0&&impact&&!enemy.boss&&enemy.hp>0&&room.clock>=(enemy.staggerReadyAt||0)){
    if(p.encounterMetrics)p.encounterMetrics.staggered++;
    enemy.stunnedUntil=Math.max(enemy.stunnedUntil||0,room.clock+impact);
    enemy.staggerReadyAt=room.clock+2.8;
    enemy.attack=Math.max(enemy.attack||0,impact);
    enemy.telegraph=null;
    const entry=entries.get(enemy.id);if(entry)entry.staggered=true;
    broadcastFx(room,'stagger',enemy.x,enemy.y);
  }
  const element=weapons[b.kind]?.element;
  if(b.kind==='borer'&&b.heatHigh&&enemy.hp>0){enemy.slowUntil=Math.max(enemy.slowUntil||0,room.clock+1.2);enemy.slowFactor=Math.min(enemy.slowFactor||1,.85);}
  if(b.arcCharged&&b.shot&&!b.shot.graftProc&&amount>0){
    b.shot.graftProc=true;
    const other=room.enemies.filter(e=>e.id!==enemy.id&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<3.5&&visible(enemy.x,enemy.y,e.x,e.y,room.grid))
      .sort((a,c)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(c.x-enemy.x,c.y-enemy.y))[0];
    if(other){dealDamage(room,p,other,amount*.55,false,entries);broadcastFx(room,'arc',other.x,other.y);}
    else broadcastFx(room,'arc',enemy.x,enemy.y);
  }
  if(element==='toxin'&&enemy.hp>0){
    enemy.toxinAt=room.clock>=enemy.toxinUntil?room.clock+.6:Math.min(enemy.toxinAt||Infinity,room.clock+.6);
    enemy.toxinUntil=room.clock+2.4;
    enemy.toxinOwnerId=p.id;enemy.toxinPower=Math.max(3,Math.round(3*p.damage*(p.talents?.r_toxin?1.6:1)));
  }
  if((p.upgrades.ember||element==='fire')&&enemy.hp>0){
    enemy.burnAt=room.clock>=enemy.burnUntil?room.clock+.6:Math.min(enemy.burnAt||Infinity,room.clock+.6);
    enemy.burnUntil=room.clock+3;
    enemy.burnOwnerId=p.id;enemy.burnPower=Math.round((4+3*((p.upgrades.ember||1)-1))*p.damage);
  }
  if((p.upgrades.frost||element==='frost')&&enemy.hp>0){
    enemy.slowUntil=room.clock+2;enemy.slowFactor=Math.max(.25,.62-.12*((p.upgrades.frost||1)-1));
  }
  if((p.upgrades.arc||element==='shock')&&roomRandom(room)<(element==='shock'?1:Math.min(.75,.22*p.upgrades.arc))){
    const others=room.enemies.filter(e=>e.id!==enemy.id&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<3.5&&visible(enemy.x,enemy.y,e.x,e.y,room.grid))
      .sort((a,c)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(c.x-enemy.x,c.y-enemy.y)).slice(0,1+(p.upgrades.conductor||0));
    for(const other of others){dealDamage(room,p,other,amount*.55*(enemy.burnUntil>room.clock?1.4:1),false,entries);broadcastFx(room,'arc',other.x,other.y);}
  }
  if(enemy.burnUntil>room.clock&&enemy.toxinUntil>room.clock&&room.clock>(enemy.reactionAt||0)){
    if(p.encounterMetrics)p.encounterMetrics.reactions++;
    enemy.reactionAt=room.clock+1.5;
    broadcastFx(room,'combustion',enemy.x,enemy.y);
    for(const other of [...room.enemies])if(Math.hypot(other.x-enemy.x,other.y-enemy.y)<2.2)
      dealDamage(room,p,other,22+18*(p.upgrades.combustion||0),false,entries);
  }
  if((element==='shock'||p.upgrades.arc)&&enemy.slowUntil>room.clock&&room.clock>(enemy.conductionAt||0)){
    enemy.conductionAt=room.clock+2;
    const nearby=room.enemies.filter(e=>e!==enemy&&Math.hypot(e.x-enemy.x,e.y-enemy.y)<3.3)
      .sort((a,b)=>Math.hypot(a.x-enemy.x,a.y-enemy.y)-Math.hypot(b.x-enemy.x,b.y-enemy.y)).slice(0,2);
    for(const other of nearby){
      other.slowUntil=Math.max(other.slowUntil||0,room.clock+1.6);
      other.slowFactor=Math.min(other.slowFactor||1,.7);
      dealDamage(room,p,other,13,false,entries);
      broadcastFx(room,'conduction',other.x,other.y);
    }
  }
}
function pullEnemyToward(room,enemy,x,y,distance,stop=enemyStats[enemy.type].radius+.45){
  if(enemy.boss||enemy.hp<=0)return;
  const dx=x-enemy.x,dy=y-enemy.y,length=Math.hypot(dx,dy)||1;
  for(let moved=0;moved<Math.min(distance,length-stop);moved+=.12){
    const step=Math.min(.12,distance-moved,length-stop-moved);
    if(step<=0)break;
    const nx=enemy.x+dx/length*step,ny=enemy.y+dy/length*step;
    if(!free(nx,ny,enemyStats[enemy.type].radius,room.grid)||
       room.enemies.some(other=>other!==enemy&&other.hp>0&&Math.hypot(nx-other.x,ny-other.y)<enemyStats[enemy.type].radius+enemyStats[other.type].radius+.08)||
       [...room.players.values()].some(q=>!q.dead&&!q.downed&&!q.disconnected&&Math.hypot(nx-q.x,ny-q.y)<enemyStats[enemy.type].radius+.28))break;
    enemy.x=nx;enemy.y=ny;
  }
  enemy.navAt=0;
}
function blastProjectile(room,b,p,batches){
  const w=weapons[b.kind];if(!w?.blast||!p)return;
  const entries=damageBatch(batches,p),radius=w.blast*(1+.3*(p.upgrades.blast||0))*(p.talents?.b_charge?1.35:1);
  broadcastFx(room,b.kind==='gravity'?'gravityBlast':'explosion',b.x,b.y);
  for(const enemy of [...room.enemies])if(Math.hypot(enemy.x-b.x,enemy.y-b.y)<radius&&visible(b.x,b.y,enemy.x,enemy.y,room.grid)){
    const amount=dealDamage(room,p,enemy,b.damage*(1+.3*(p.upgrades.blast||0))*(b.hitIds?.has(enemy.id) ? .5 : 1),false,entries);
    applyProjectileHit(room,b,p,enemy,amount,entries);
    if(b.kind==='gravity'&&enemy.hp>0){
      pullEnemyToward(room,enemy,b.x,b.y,p.upgrades.singularity?2.1:1.4,.25);
      enemy.slowUntil=Math.max(enemy.slowUntil||0,room.clock+2);
      enemy.slowFactor=Math.min(enemy.slowFactor||1,.65);
      if(p.upgrades.singularity){enemy.telegraph=null;enemy.attack=Math.max(enemy.attack||0,1.2);}
    }
  }
  if(p.upgrades.fragment)for(let i=0;i<3;i++){
    const a=i*Math.PI*2/3+roomRandom(room)*.4;
    room.projectiles.push({id:room.seq++,side:'player',kind:'fragment',ownerId:p.id,shot:{hit:false},x:b.x,y:b.y,h:1.1,
      vx:Math.cos(a)*19,vy:Math.sin(a)*19,vh:0,radius:.08,damage:16*p.damage,rangeLeft:4,crit:false,pierce:0,bounces:0,hitIds:new Set()});
  }
}
export function advanceProjectile(room,b,dt,batches){
  const distance=Math.hypot(b.vx,b.vy,b.vh||0)*dt;
  const steps=Math.max(1,Math.ceil(distance/.12)),stepTime=dt/steps;
  for(let i=0;i<steps;i++){
    const nx=b.x+b.vx*stepTime,ny=b.y+b.vy*stepTime,nh=b.h+(b.vh||0)*stepTime;
    b.rangeLeft-=Math.hypot(b.vx,b.vy,b.vh||0)*stepTime;
    if(b.rangeLeft<=0||nh<.06||nh>3.06){if(b.side==='player'&&weapons[b.kind]?.blast)blastProjectile(room,b,room.players.get(b.ownerId),batches);return false;}
    if(!projectileFree(nx,ny,b.radius,nh,room.grid)){
      if(b.side==='player'&&b.bounces>0){
        const blockX=!projectileFree(nx,b.y,b.radius,nh,room.grid),blockY=!projectileFree(b.x,ny,b.radius,nh,room.grid);
        if(blockX||!blockY)b.vx=-b.vx;
        if(blockY||!blockX)b.vy=-b.vy;
        b.bounces--;b.bounceCount=(b.bounceCount||0)+1;broadcastFx(room,'bounce',b.x,b.y);continue;
      }
      if(b.side==='player'&&weapons[b.kind]?.blast)blastProjectile(room,b,room.players.get(b.ownerId),batches);
      return false;
    }
    b.x=nx;b.y=ny;b.h=nh;
    if(b.side==='enemy'){
      const target=[...room.players.values()].find(p=>!p.dead&&!p.downed&&!p.disconnected&&Math.hypot(p.x-b.x,p.y-b.y)<.28+b.radius&&b.h>floorHeightAt(room.grid,p.x,p.y)+.2&&b.h<floorHeightAt(room.grid,p.x,p.y)+2.25);
      if(target){hurt(room,target,b.damage);return false;}
      continue;
    }
    const p=room.players.get(b.ownerId);
    if(!p)return false;
    const enemy=room.enemies.find(e=>!b.hitIds.has(e.id)&&Math.hypot(e.x-b.x,e.y-b.y)<enemyStats[e.type].radius+b.radius&&
      b.h>floorHeightAt(room.grid,e.x,e.y)-.1&&b.h<floorHeightAt(room.grid,e.x,e.y)+(e.type==='mite'?1.55:e.boss?3.05:e.type==='brute'?2.35:2.05)+.18);
    if(enemy){
      b.hitIds.add(enemy.id);
      if(!b.shot.hit){b.shot.hit=true;p.hits++;}
      const entries=damageBatch(batches,p);
      const frozen=enemy.slowUntil>room.clock;
      const bankBonus=1+.3*(p.upgrades.glancing||0)*Math.min(3,b.bounceCount||0);
      const amount=dealDamage(room,p,enemy,b.damage*bankBonus*(b.crit?1.8:1)*(frozen&&p.upgrades.shatter?1+.25*p.upgrades.shatter:1),b.crit,entries);
      if(amount>0&&b.bounceCount&&p.encounterMetrics)p.encounterMetrics.bankHits++;
      applyProjectileHit(room,b,p,enemy,amount,entries);
      if(amount>0&&b.bounceCount&&p.upgrades.bankSignal&&enemy.hp>0){
        enemy.markedUntil=Math.max(enemy.markedUntil||0,room.clock+Math.min(6,2+p.upgrades.bankSignal));
        enemy.markCharges=Math.max(enemy.markCharges||0,1);
        broadcastFx(room,'tether',enemy.x,enemy.y);
      }
      if(b.kind==='harpoon'&&enemy.hp>0){
        pullEnemyToward(room,enemy,p.x,p.y,2.2);
        enemy.markedUntil=room.clock+(p.upgrades.tetherline?4:3);
        enemy.markCharges=p.upgrades.tetherline?2:1;
        broadcastFx(room,'tether',enemy.x,enemy.y);
      }
      if(p.talents?.m_leech)p.hp=Math.min(p.maxHp,p.hp+2);
      if(weapons[b.kind]?.blast){blastProjectile(room,b,p,batches);return false;}
      if(b.kind==='rail')b.damage*=1.12;
      if(b.pierce>0){b.pierce--;continue;}
      return false;
    }
  }
  return true;
}
function tickEnemyEffects(room,e,batches){
  for(const effect of [['burn','burnOwnerId','burnPower'],['toxin','toxinOwnerId','toxinPower']]){
    const [key,ownerKey,powerKey]=effect;
    if(!Number.isFinite(e[`${key}At`])||room.clock>=e[`${key}Until`]||room.clock<e[`${key}At`])continue;
    const p=room.players.get(e[ownerKey]);
    e[`${key}At`]+=.6;
    if(p)dealDamage(room,p,e,e[powerKey],false,damageBatch(batches,p));
    if(e.hp<=0)break;
  }
}
export function reload(room,p) {
  if (p.dead || p.downed || room.phase!=='combat') return false;
  if(p.reloadEnd>0){
    if(p.reloadAttempted)return false;
    p.reloadAttempted=true;
    if(room.clock<p.reloadWindowStart||room.clock>p.reloadWindowEnd)return false;
    p.reloadEnd=Math.min(p.reloadEnd,room.clock+.12);
    if(p.encounterMetrics)p.encounterMetrics.precisionReloads++;
    if(p.weapon==='borer'&&p.slotHeat){p.slotHeat[p.slot]=Math.max(0,(p.slotHeat[p.slot]||0)-30);if(p.slotVentUntil)p.slotVentUntil[p.slot]=0;}
    if(p.upgrades?.snapfreeze){
      for(const enemy of room.enemies)if(Math.hypot(enemy.x-p.x,enemy.y-p.y)<2.8+.5*(p.upgrades.snapfreeze-1)&&visible(p.x,p.y,enemy.x,enemy.y,room.grid)){
        enemy.slowUntil=Math.max(enemy.slowUntil||0,room.clock+2);enemy.slowFactor=Math.min(enemy.slowFactor||1,.5);
        broadcastFx(room,'frost',enemy.x,enemy.y);
      }
    }
    if(p.grafts?.includes('siphonHalo')){
      p.reloadBoostSlot=-1;
      p.skillReadyAt=Math.max(room.clock,p.skillReadyAt-3);
      const entries=new Map();
      for(const enemy of [...room.enemies])if(Math.hypot(enemy.x-p.x,enemy.y-p.y)<2.8&&visible(p.x,p.y,enemy.x,enemy.y,room.grid))
        dealDamage(room,p,enemy,22,false,entries);
      sendDamage(p,entries);broadcastFx(room,'siphon',p.x,p.y);
      send(p.ws,{type:'perfect_reload',siphon:true});
    }else{
      p.reloadBoostSlot=p.slot;
      send(p.ws,{type:'perfect_reload'});
    }
    return true;
  }
  const w = weapons[p.weapon], cap = Math.ceil(w.mag * p.mag);
  if (p.ammo >= cap) return false;
  const duration=w.reload*Math.pow(.7,p.upgrades.quickhands||0);
  p.reloadEnd = room.clock + duration;
  p.reloadWindowStart=room.clock+duration*.55;
  p.reloadWindowEnd=room.clock+duration*.75;
  p.reloadAttempted=false;
  if(p.reloadBoostSlot===p.slot)p.reloadBoostSlot=-1;
  send(p.ws, { type: 'reload', seconds: p.reloadEnd-room.clock });
  return true;
}
export function useSkill(room,p) {
  if(room.phase!=='combat'||p.dead||p.downed||room.clock<p.skillReadyAt)return;
  if(p.encounterMetrics)p.encounterMetrics.skillUses++;
  const skill=classes[p.classId];
  p.skillReadyAt=room.clock+skill.cooldown*Math.pow(.82,p.upgrades.capacitor||0);
  if(p.grafts?.includes('arcSpine'))p.arcCharges=4;
  if(p.classId==='vanguard'){
    p.skillUntil=room.clock+6+2*(p.upgrades.bulwarkPlus||0)+2*(p.talents?.v_guard||0);
    p.tauntUntil=p.skillUntil;
    if(p.talents?.v_guard)p.hp=Math.min(p.maxHp,p.hp+12);
  }
  if(p.classId==='runner'){
    p.skillUntil=room.clock+6+2*(p.talents?.r_duration||0);
    p.lastDash=-100;
    p.reloadEnd=0;p.reloadWindowStart=0;p.reloadWindowEnd=0;p.reloadAttempted=false;
    p.ammo=Math.ceil(weapons[p.weapon].mag*p.mag);p.slotAmmo[p.slot]=p.ammo;
  }
  if(p.classId==='breacher'){
    const damageEntries=new Map();
    for(const e of [...room.enemies]){
      const dx=e.x-p.x,dy=e.y-p.y,dist=Math.hypot(dx,dy);
      if(dist>5.5+1.5*(p.upgrades.shockPlus||0)||!visible(p.x,p.y,e.x,e.y,room.grid))continue;
      if(e.telegraph&&p.encounterMetrics)p.encounterMetrics.staggered++;
      dealDamage(room,p,e,(110+25*(p.upgrades.shockPlus||0))*p.damage*(p.talents?.b_impact?1.35:1),false,damageEntries);
      if(e.hp<=0)continue;
      e.telegraph=null;e.attack=Math.max(e.attack,p.upgrades.shockPlus?2.2:1.5);
      const push=2*(1-dist/7),nx=e.x+dx/(dist||1)*push,ny=e.y+dy/(dist||1)*push;
      if(free(nx,ny,enemyStats[e.type].radius,room.grid)) {e.x=nx;e.y=ny;}
      if(p.talents?.b_aftershock){e.burnAt=room.clock+.6;e.burnUntil=room.clock+3;e.burnOwnerId=p.id;e.burnPower=10;}
    }
    if(p.talents?.b_reset&&damageEntries.size)p.skillReadyAt=Math.max(room.clock,p.skillReadyAt-2*[...damageEntries].filter(([id])=>!room.enemies.some(e=>e.id===id)).length);
    sendDamage(p,damageEntries);
  }
  if(p.classId==='medic')for(const q of room.players.values()){
    const distance=Math.hypot(q.x-p.x,q.y-p.y);
    if(!q.dead&&!q.disconnected&&distance<7.5){
      if(q.downed){
        if(distance>4.5)continue;
        q.downed=false;q.downedUntil=0;q.reviveProgress=0;q.hp=Math.max(30,Math.ceil(q.maxHp*.35));
        if(p.encounterMetrics)p.encounterMetrics.revives++;
        q.invulnerableUntil=room.clock+2;
        announce(room,`${q.name||'CREW'} // RALLY REBOOT`);
      }else{const before=q.hp;q.hp=Math.min(q.maxHp,q.hp+45+20*(p.upgrades.rallyPlus||0)+20*(p.talents?.m_heal||0));if(p.encounterMetrics)p.encounterMetrics.healing+=Math.round(q.hp-before);}
      q.wardUntil=room.clock+3;q.wardStrength=p.talents?.m_barrier?.75:.85;
      if(p.upgrades.rallyPlus&&q.reloadEnd>0){
        q.reloadEnd=0;q.reloadWindowStart=0;q.reloadWindowEnd=0;q.reloadAttempted=false;
        q.ammo=Math.ceil(weapons[q.weapon].mag*q.mag);q.slotAmmo[q.slot]=q.ammo;
        send(q.ws,{type:'rally_reload'});
      }
    }
  }
  if(p.classId==='medic'&&p.talents?.m_chain){
    const entries=new Map();for(const e of [...room.enemies])if(Math.hypot(e.x-p.x,e.y-p.y)<7.5)dealDamage(room,p,e,45,false,entries);
    sendDamage(p,entries);broadcastFx(room,'arc',p.x,p.y);
  }
  if(p.upgrades?.quench){
    for(const enemy of room.enemies)if(Math.hypot(enemy.x-p.x,enemy.y-p.y)<4+p.upgrades.quench-1&&visible(p.x,p.y,enemy.x,enemy.y,room.grid)){
      enemy.slowUntil=Math.max(enemy.slowUntil||0,room.clock+2);enemy.slowFactor=Math.min(enemy.slowFactor||1,.5);
      broadcastFx(room,'frost',enemy.x,enemy.y);
    }
  }
  announce(room,`${p.name} // ${skill.skill}`);
  for(const q of room.players.values())send(q.ws,{type:'skill',id:p.id,classId:p.classId,x:p.x,y:p.y});
}
export function activateDash(room,p){
  if(room.phase!=='combat'||p.dead||p.downed||room.clock-p.lastDash<2.7)return false;
  p.lastDash=room.clock;p.dashUntil=room.clock+.25;
  if(p.grafts?.includes('phaseCoupler'))p.phaseCharges=3;
  if(p.grafts?.includes('kineticRig')){
    const entries=new Map();
    for(const e of [...room.enemies]){
      const dx=e.x-p.x,dy=e.y-p.y,dist=Math.hypot(dx,dy);
      if(dist>2.5||!visible(p.x,p.y,e.x,e.y,room.grid))continue;
      dealDamage(room,p,e,48*p.damage,false,entries);
      if(e.hp<=0)continue;
      const radius=enemyStats[e.type]?.radius||.7;
      const nx=e.x+dx/(dist||1)*.9,ny=e.y+dy/(dist||1)*.9;
      if(free(nx,ny,radius,room.grid)){e.x=nx;e.y=ny;}
    }
    sendDamage(p,entries);broadcastFx(room,'kinetic',p.x,p.y);
  }
  return true;
}
export function applyUpgrade(p, id, token) {
  if (token!==p.draftToken||!p.choices.includes(id) || p.augmentReady) return false;
  p.upgrades[id] = (p.upgrades[id] || 0) + 1;
  if (id === 'hotload') p.fireRate *= 1.22;
  if (id === 'hollow') p.damage *= 1.25;
  if (id === 'plating') { p.maxHp += 25; p.hp = Math.min(p.maxHp,p.hp+25); }
  if (id === 'sprint') p.speed *= 1.12;
  if (id === 'leech') p.leech += 4;
  if (id === 'mag') p.mag *= 1.3;
  if (id === 'shield') p.armor = 1-(1-p.armor)*.88;
  if (id === 'crit') p.crit += .12;
  p.augmentPicksRemaining=Math.max(0,(p.augmentPicksRemaining||1)-1);
  p.augmentReady=p.augmentPicksRemaining===0;
  if(!p.augmentReady)dealAugments(p.room,p);
  updateReady(p);
  return true;
}
export function applyWeapon(p,id){
  if(!p.weaponChoices.includes(id)||p.armoryReady||!weapons[id])return false;
  const target=p.slot===0?1:0;
  p.loadout[target]=id;p.slotAmmo[target]=Math.ceil(weapons[id].mag*p.mag);
  p.slotHeat||=[0,0];p.slotVentUntil||=[0,0];p.slotHeat[target]=0;p.slotVentUntil[target]=0;
  p.armoryReady=true;updateReady(p);
  return true;
}
export function applyTalent(p,id){
  if(p.talentReady)return false;
  const branch=talents[p.classId].find(b=>b.nodes.some(n=>n.id===id));
  if(!branch||p.talents[id]||branch.nodes.findIndex(n=>n.id===id)!==(p.talents[branch.nodes[0].id]?1:0))return false;
  p.talents[id]=1;
  if(id==='v_plating'){p.maxHp+=30;p.hp=Math.min(p.maxHp,p.hp+30);}
  if(id==='r_stride')p.speed*=1.15;
  p.talentReady=true;updateReady(p);
  return true;
}
export function applyGraft(p,id,token){
  if(p.graftReady||token!==p.graftToken||!p.graftChoices?.includes(id)||p.grafts?.includes(id))return false;
  p.grafts.push(id);
  p.graftChoices=[];p.graftReady=true;
  updateReady(p);
  return true;
}
function switchWeapon(p,slot){
  if(!Number.isInteger(slot)||slot<0||slot>1||slot===p.slot||!p.loadout[slot])return;
  p.slotAmmo[p.slot]=p.ammo;p.slot=slot;p.weapon=p.loadout[slot];p.ammo=p.slotAmmo[slot];
  p.reloadEnd=0;p.reloadAttempted=false;p.reloadWindowStart=0;p.reloadWindowEnd=0;p.lastShot=-100;
}
function handleMessage(ws, raw) {
  let msg; try { msg = JSON.parse(raw); } catch { return; }
  if (!msg || typeof msg !== 'object') return;
  if (msg.type === 'join') {
    if (ws.player) return;
    if(msg.version!==BUILD_VERSION)return send(ws,{type:'error',message:`BUILD MISMATCH // HOST ${BUILD_VERSION}. INSTALL THE SAME BUILD ON EVERY PC.`});
    const requested = String(msg.code || '').replace(/[^a-zA-Z0-9]/g,'').toUpperCase().slice(0,6);
    if(msg.reconnectToken&&!requested)return send(ws,{type:'error',message:'RECONNECT REQUIRES THE ORIGINAL ROOM CODE'});
    const room = requested ? rooms.get(requested) : makeRoom(code());
    if (!room) return send(ws,{ type:'error', message:'ROOM CODE NOT FOUND' });
    if(msg.reconnectToken){
      const token=String(msg.reconnectToken);
      const p=[...room.players.values()].find(q=>q.reconnectToken===token&&(!q.disconnected||room.clock<q.reconnectUntil));
      if(!p)return send(ws,{type:'error',message:'RECONNECT WINDOW EXPIRED OR TOKEN INVALID'});
      const previous=p.ws;
      p.ws=ws;p.disconnected=false;p.reconnectUntil=0;p.lastMove=room.clock;
      p.invulnerableUntil=Math.max(p.invulnerableUntil||0,room.clock+1.5);
      p.reconnectToken=crypto.randomBytes(24).toString('hex');
      ws.player=p;ws.room=room;
      if(previous&&!previous.closed)previous.socket.destroy();
      send(ws,{type:'welcome',id:p.id,code:room.code,map:room.grid,version:BUILD_VERSION,
        reconnectToken:p.reconnectToken,resumed:true});
      announce(room,`${p.name} // SIGNAL RESTORED`);
      snapshot(room);
      return;
    }
    if (room.players.size >= 4) return send(ws,{ type:'error', message:'ROOM IS FULL' });
    if (room.phase === 'combat') return send(ws,{ type:'error', message:'RUN IN PROGRESS' });
    const p = createPlayer(ws,msg.name,room,msg.classId);
    if(room.phase==='intermission')chooseOptions(room,p,false,false);
    ws.player=p; ws.room=room;
    send(ws,{ type:'welcome', id:p.id, code:room.code, map:room.grid, version:BUILD_VERSION,
      reconnectToken:p.reconnectToken,resumed:false });
    announce(room,`${p.name} // CONNECTED`);
    snapshot(room);
    return;
  }
  const p=ws.player, room=ws.room;
  if (!p || !room || p.ws!==ws) return;
  if(msg.type==='class'&&room.phase==='lobby'&&Object.hasOwn(classes,msg.classId)){
    p.classId=msg.classId;p.weapon=classes[p.classId].weapon;p.ammo=weapons[p.weapon].mag;p.loadout=[p.weapon,null];p.slotAmmo=[p.ammo,0];p.slot=0;
    announce(room,`${p.name} // ${classes[p.classId].name}`);snapshot(room);
  }
  if (msg.type === 'move') {
    const x=Number(msg.x), y=Number(msg.y), a=Number(msg.a);
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(a)) return;
    const elapsed = clamp(room.clock-p.lastMove,.02,.25);
    const maxStep = (p.speed * (room.clock < p.dashUntil ? 15 : 5.8) * elapsed + .35);
    if (!p.dead&&!p.downed&&Math.hypot(x-p.x,y-p.y) <= maxStep && free(x,y,.24,room.grid)) { p.moveSpeed=Math.hypot(x-p.x,y-p.y)/elapsed;p.x=x; p.y=y; }
    p.a=a; p.lastMove=room.clock;
  }
  if (msg.type === 'fire') fire(room,p,msg.a,msg.pitch,msg.height);
  if (msg.type === 'ping') placePing(room,p,msg);
  if (msg.type === 'revive') requestRevive(room,p,msg.targetId);
  if (msg.type === 'dash') activateDash(room,p);
  if (msg.type === 'reload') reload(room,p);
  if (msg.type === 'switch') switchWeapon(p,Number(msg.slot));
  if (msg.type === 'skill') useSkill(room,p);
  if (msg.type === 'config')configureIntermission(room,p,Number(msg.intermissionSeconds));
  if (msg.type === 'seed'&&configureRunSeed(room,p,msg.seed))snapshot(room);
  if (msg.type === 'start' && (room.phase==='lobby'||room.phase==='gameover'||room.phase==='victory')&&isRoomHost(room,p)) beginRun(room);
  if (msg.type === 'upgrade' && room.phase==='intermission') {
    if (applyUpgrade(p,msg.id,msg.draftToken)) {
      announce(room,`${p.name} // ${upgrades.find(u=>u.id===msg.id)?.name}`);
      advanceIfReady(room);
    }
  }
  if(msg.type==='weapon'&&room.phase==='intermission'&&applyWeapon(p,msg.id)){
    announce(room,`${p.name} // ${weapons[msg.id].name}`);
    advanceIfReady(room);
  }
  if(msg.type==='talent'&&room.phase==='intermission'&&applyTalent(p,msg.id)){
    announce(room,`${p.name} // TALENT ONLINE`);
    advanceIfReady(room);
  }
  if(msg.type==='graft'&&room.phase==='intermission'&&applyGraft(p,msg.id,msg.graftToken)){
    announce(room,`${p.name} // ${grafts.find(g=>g.id===msg.id).name} INSTALLED`);
    advanceIfReady(room);
  }
  if(msg.type==='reroll'&&rerollAugments(room,p,Number(msg.draftToken))){
    announce(room,`${p.name} // AUGMENT OFFER REROLLED`);
    snapshot(room);
  }
  if(msg.type==='overtime')castOvertimeVote(room,p,msg.vote);
  if(msg.type==='machineStart')startMachineSession(room,p);
  if(msg.type==='machineInput')machineInput(room,p,msg.action,Number(msg.delta));
}
function enemyVolley(room,e,targetX,targetY){
  const stats=enemyStats[e.type],dx=targetX-e.x,dy=targetY-e.y,dist=Math.hypot(dx,dy)||1;
  const speed=e.type==='sniper'?12:e.boss?8:5.4;
  const count=e.type==='warden'?5:e.type==='matriarch'?3:e.type==='overseer'?7:1;
  for(let i=0;i<count;i++){
    const angle=Math.atan2(dy,dx)+(i-(count-1)/2)*(e.boss?.18:0);
    room.projectiles.push({id:room.seq++,side:'enemy',kind:e.type==='sniper'?'sniper':e.boss?'boss':'enemy',x:e.x,y:e.y,h:floorHeightAt(room.grid,e.x,e.y)+(e.boss?1.65:1.1),
      vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,vh:0,radius:e.boss?.18:.12,rangeLeft:18,damage:stats.damage});
  }
  broadcastFx(room,'muzzle',e.x,e.y);
}
export function updateRoom(room,dt) {
  room.clock += dt;
  expireDisconnectedPlayers(room);
  if(!room.players.size)return;
  if (room.phase === 'combat') {
    const damageBatches=new Map();
    for(const p of room.players.values())if(p.slotHeat){
      p.slotVentUntil||=[0,0];
      for(let slot=0;slot<2;slot++){
        if(p.slotVentUntil[slot]&&room.clock>=p.slotVentUntil[slot]){p.slotVentUntil[slot]=0;p.slotHeat[slot]=Math.min(p.slotHeat[slot]||0,35);}
        else if(!p.slotVentUntil[slot]&&(slot!==p.slot||room.clock-p.lastShot>.18))p.slotHeat[slot]=Math.max(0,(p.slotHeat[slot]||0)-24*dt);
      }
    }
    updateMachine(room,dt);
    const elapsed=room.clock-(room.encounterStart??room.clock);
    const nextBand=elapsed>=60?2:elapsed>=30?1:0;
    if(nextBand>(room.pressureBand||0)){
      room.spawnLeft+=(nextBand-(room.pressureBand||0));
      room.pressureBand=nextBand;
      announce(room,`PRESSURE ${nextBand}/2 // REINFORCEMENT AUTHORIZED`);
    }
    const profile=hazardProfile(room),hazardLength=profile.cycle,cycle=Math.floor((room.clock-room.hazardStart)/hazardLength),hazardTime=(room.clock-room.hazardStart)%hazardLength;
    if(hazardTime>=profile.warnAt&&room.hazardCycle!==cycle){room.hazardCycle=cycle;announce(room,`${stages[room.stageIndex].subtitle} // HAZARD CHARGING`);}
    if(hazardTime>=profile.activeAt&&hazardTime<profile.activeEnd){
      for(const p of room.players.values())if(!p.dead&&!p.downed&&!p.disconnected&&hazardLayouts[room.stageIndex].some(h=>Math.hypot(p.x-h.x,p.y-h.y)<h.r)){
        if(room.stageIndex===1)p.slowUntil=room.clock+(profile.slowDuration||1.2);
        if(room.clock>=(p.hazardHitAt||0)){hurt(room,p,(room.stageIndex===2?14:room.stageIndex===0?10:5)*(profile.damageScale||1));p.hazardHitAt=room.clock+.8;}
      }
    }
    room.spawnTimer -= dt;
    if (room.spawnLeft > 0 && room.spawnTimer <= 0) {
      if(spawnEnemy(room))room.spawnLeft--;
      room.spawnTimer=(profile.spawnScale||1.1) / ((1+room.wave*.06)*(1+.16*(room.pressureBand||0)));
    }
    for (const e of [...room.enemies]) {
      tickEnemyEffects(room,e,damageBatches);
      if(e.hp<=0)continue;
      e.shielded=e.type==='sentinel'&&((room.clock-(e.spawnedAt??room.clock)+7)%7)<4.5;
      e.flash=Math.max(0,e.flash-dt);
      e.attack-=dt;
      const stunned=room.clock<(e.stunnedUntil||0);
      const target=[...room.players.values()].filter(p=>!p.dead&&!p.downed&&!p.disconnected)
        .sort((a,b)=>{
          const score=p=>Math.hypot(p.x-e.x,p.y-e.y)-(p.tauntUntil>room.clock&&Math.hypot(p.x-e.x,p.y-e.y)<9?5:0);
          return score(a)-score(b);
        })[0];
      if (!target) continue;
      const dx=target.x-e.x, dy=target.y-e.y, dist=Math.hypot(dx,dy)||1;
      e.faceX=dx/dist;e.faceY=dy/dist;
      const stats=enemyStats[e.type];
      if(e.boss&&!e.overdrive&&e.hp<=e.maxHp*.45){
        e.overdrive=true;
        announce(room,`${stages[room.stageIndex].bossName} // EMERGENCY CYCLE ENGAGED`);
        broadcastFx(room,'bossOverdrive',e.x,e.y);
      }
      const desired=e.type==='gunner'?4.3:e.type==='sniper'?8:e.type==='healer'?5:e.type==='sapper'?6.2:e.type==='welder'?5.4:e.type==='purger'?2.8:e.type==='sentinel'?2.2:stats.radius+.36;
      const lineClear=visible(e.x,e.y,target.x,target.y,room.grid);
      const startX=e.x,startY=e.y;
      if ((dist>desired||!lineClear)&&!e.telegraph&&!stunned) {
        const step=stats.speed*(room.clock<e.slowUntil?(e.slowFactor||.62):1)*(room.clock<e.chargeUntil?4:1)*dt;
        const rushing=room.clock<e.chargeUntil&&Number.isFinite(e.chargeX);
        if(!rushing&&!lineClear&&(!e.navPoint||room.clock>=(e.navAt||0)||Math.hypot(e.x-e.navPoint.x,e.y-e.navPoint.y)<.22)){
          e.navPoint=routeEnemy(e,target,room.grid);e.navAt=room.clock+.6;
        }
        const waypoint=!rushing&&!lineClear?e.navPoint:null;
        const mx=rushing?e.chargeX-e.x:waypoint?waypoint.x-e.x:dx,my=rushing?e.chargeY-e.y:waypoint?waypoint.y-e.y:dy,ml=Math.hypot(mx,my)||1;
        const travel=rushing?Math.min(step,ml):step;
        const nx=e.x+mx/ml*travel, ny=e.y+my/ml*travel;
        if (free(nx,ny,stats.radius,room.grid)) { e.x=nx; e.y=ny; }
        else if(rushing){
          e.chargeUntil=0;e.stunnedUntil=room.clock+1.35;e.attack=Math.max(e.attack,1.35);
          e.attackWindowUntil=room.clock+.25;broadcastFx(room,'ramCrash',e.x,e.y);
        }
        else if (free(nx,e.y,stats.radius,room.grid)) e.x=nx;
        else if (free(e.x,ny,stats.radius,room.grid)) e.y=ny;
        else e.navAt=0;
      }
      if(e.type==='gunner'&&!e.telegraph&&!stunned&&lineClear&&dist>2.5&&dist<7){
        const side=e.strafeDir||((e.id%2)*2-1),stride=stats.speed*.55*dt;
        const sx=e.x-side*dy/dist*stride,sy=e.y+side*dx/dist*stride;
        if(free(sx,sy,stats.radius,room.grid)){e.x=sx;e.y=sy;}
        else e.strafeDir=-side;
      }
      if(e.type==='charger'&&room.clock<(e.chargeUntil||0)&&!stunned){
        const vx=e.x-startX,vy=e.y-startY,denom=vx*vx+vy*vy||1;
        const struck=[...room.players.values()].find(p=>{
          if(p.dead||p.downed||p.disconnected)return false;
          const t=clamp(((p.x-startX)*vx+(p.y-startY)*vy)/denom,0,1);
          return Math.hypot(p.x-startX-vx*t,p.y-startY-vy*t)<stats.radius+.4;
        });
        if(struck){hurt(room,struck,stats.damage);e.chargeUntil=0;e.attackWindowUntil=room.clock+.35;broadcastFx(room,'ramHit',e.x,e.y);}
      }
      if(stunned)continue;
      if(e.telegraph){
        if(room.clock>=e.telegraph.fireAt){
          if(e.telegraph.kind==='charge'){
            e.chargeX=e.telegraph.x;e.chargeY=e.telegraph.y;e.chargeUntil=room.clock+.65;broadcastFx(room,'charge',e.x,e.y);
            e.attackWindowUntil=e.chargeUntil;
          }else if(e.telegraph.kind==='blast'||e.telegraph.kind==='press'){
            const {x,y,radius}=e.telegraph;
            for(const p of room.players.values())if(Math.hypot(p.x-x,p.y-y)<radius&&visible(x,y,p.x,p.y,room.grid))hurt(room,p,stats.damage);
            broadcastFx(room,e.telegraph.kind==='press'?(e.type==='overseer'?'reactorPress':'wardenPress'):'sapperBlast',x,y);e.attackWindowUntil=room.clock+.4;
          }else if(e.telegraph.kind==='beam'){
            const {x,y,radius}=e.telegraph,ax=e.x,ay=e.y,vx=x-ax,vy=y-ay,denom=vx*vx+vy*vy||1;
            for(const p of room.players.values()){
              const t=clamp(((p.x-ax)*vx+(p.y-ay)*vy)/denom,0,1);
              if(Math.hypot(p.x-(ax+vx*t),p.y-(ay+vy*t))<radius+.28&&visible(ax,ay,p.x,p.y,room.grid)){
                hurt(room,p,stats.damage);
                if(e.type==='matriarch')p.slowUntil=Math.max(p.slowUntil||0,room.clock+2.4);
              }
            }
            broadcastFx(room,e.type==='warden'?'bossShear':e.type==='matriarch'?'coolantLance':'weldBeam',x,y);e.attackWindowUntil=room.clock+.5;
          }else if(e.telegraph.kind==='coldPulse'){
            const {radius}=e.telegraph;
            for(const p of room.players.values())if(!p.dead&&!p.downed&&!p.disconnected&&Math.hypot(p.x-e.x,p.y-e.y)<radius&&visible(e.x,e.y,p.x,p.y,room.grid)){
              hurt(room,p,stats.damage);p.slowUntil=Math.max(p.slowUntil||0,room.clock+2.4);
            }
            broadcastFx(room,e.boss?'bossPurge':'coldPulse',e.x,e.y);e.attackWindowUntil=room.clock+.5;
          }else if(e.telegraph.kind==='slam'){
            const {radius}=e.telegraph;
            for(const p of room.players.values())if(!p.dead&&!p.downed&&!p.disconnected&&Math.hypot(p.x-e.x,p.y-e.y)<radius&&visible(e.x,e.y,p.x,p.y,room.grid))hurt(room,p,22);
            broadcastFx(room,'bruteSlam',e.x,e.y);e.attackWindowUntil=room.clock+.45;
          }else {enemyVolley(room,e,e.telegraph.x,e.telegraph.y);e.attackWindowUntil=room.clock+1.1;}
          e.telegraph=null;
        }
      }else if (e.attack <= 0) {
        if(e.type==='healer'){
          const ally=room.enemies.filter(q=>q!==e&&q.hp<q.maxHp&&Math.hypot(q.x-e.x,q.y-e.y)<5).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
          if(ally){ally.hp=Math.min(ally.maxHp,ally.hp+Math.round(22+room.wave*2));broadcastFx(room,'heal',ally.x,ally.y);e.attack=2.4;}
        }
        if(e.type==='brute'&&dist<2.9&&lineClear&&activeMajorAttacks(room)+majorAttackCost(e)<=majorAttackBudget(room)){
          e.telegraph={kind:'slam',x:e.x,y:e.y,radius:2.45,fireAt:room.clock+.9};e.attack=4.1;
        }else if(e.type==='sapper'&&dist<9&&visible(e.x,e.y,target.x,target.y,room.grid)&&
           activeMajorAttacks(room)+majorAttackCost(e)<=majorAttackBudget(room)){
          e.telegraph={kind:'blast',x:target.x,y:target.y,radius:2.1,fireAt:room.clock+1.25};e.attack=4.6;
        }else if(e.type==='welder'&&dist<9&&visible(e.x,e.y,target.x,target.y,room.grid)&&
           activeMajorAttacks(room)+majorAttackCost(e)<=majorAttackBudget(room)){
          const length=Math.min(9,dist+1),nx=dx/dist,ny=dy/dist;
          e.telegraph={kind:'beam',x:e.x+nx*length,y:e.y+ny*length,radius:.6,fireAt:room.clock+.9};e.attack=3.7;
        }else if(e.type==='purger'&&dist<3.9&&visible(e.x,e.y,target.x,target.y,room.grid)&&
           activeMajorAttacks(room)+majorAttackCost(e)<=majorAttackBudget(room)){
          e.telegraph={kind:'coldPulse',x:e.x,y:e.y,radius:3.1,fireAt:room.clock+1};e.attack=4.2;
        }else if(e.type==='charger'&&dist>2&&dist<9&&visible(e.x,e.y,target.x,target.y,room.grid)&&
           activeMajorAttacks(room)+majorAttackCost(e)<=majorAttackBudget(room)){
          e.telegraph={kind:'charge',x:target.x,y:target.y,fireAt:room.clock+.5};e.attack=3.4;
        }else if((e.type==='sniper'||e.boss)&&dist<16&&visible(e.x,e.y,target.x,target.y,room.grid)&&
                 activeMajorAttacks(room)+majorAttackCost(e)<=majorAttackBudget(room)){
          const pattern=e.boss?(e.attackCycle||0)%3:0;
          if(pattern===1&&e.type==='warden')e.telegraph={kind:'press',x:target.x,y:target.y,radius:2.7,fireAt:room.clock+1.1};
          else if(pattern===1&&e.type==='matriarch')e.telegraph={kind:'coldPulse',x:e.x,y:e.y,radius:4.1,fireAt:room.clock+1.05};
          else if(pattern===1&&e.type==='overseer')e.telegraph={kind:'beam',x:e.x+dx/dist*Math.min(11,dist+1),y:e.y+dy/dist*Math.min(11,dist+1),radius:.85,fireAt:room.clock+1};
          else if(pattern===2&&e.type==='overseer')e.telegraph={kind:'press',x:target.x,y:target.y,radius:2.25,fireAt:room.clock+1.1};
          else if(pattern===2&&e.boss)e.telegraph={kind:'beam',x:e.x+dx/dist*Math.min(11,dist+1),y:e.y+dy/dist*Math.min(11,dist+1),radius:e.type==='warden'?.95:.68,fireAt:room.clock+1};
          else e.telegraph={kind:e.type==='sniper'?'snipe':'volley',x:target.x,y:target.y,fireAt:room.clock+(e.boss?.8:.95)};
          if(e.boss)e.attackCycle=(e.attackCycle||0)+1;
          e.attack=e.boss?(e.overdrive?2.45:3):e.type==='sniper'?3.4:2.6;
        }else if(e.type==='gunner'&&dist<11&&visible(e.x,e.y,target.x,target.y,room.grid)){
          enemyVolley(room,e,target.x,target.y);e.attack=2.6;
        } else if (dist<stats.radius+.7) {
          hurt(room,target,stats.damage); e.attack=e.type==='brute'||e.boss?1.35:.85;
        }
      }
      if(e.boss){
        e.summon-=dt;
        if(e.summon<=0){
          const count=Number(spawnEnemy(room))+Number(spawnEnemy(room));
          e.summon=count?(e.overdrive?6:8):2;
          if(count)announce(room,`${stages[room.stageIndex].bossName} // REINFORCEMENTS`);
        }
      }
    }
    const remaining=[];
    for(const b of room.projectiles)if(advanceProjectile(room,b,dt,damageBatches))remaining.push(b);
    room.projectiles=remaining;
    for(const [id,entries] of damageBatches)sendDamage(room.players.get(id),entries);
    for (const drop of [...room.drops]) {
      const p=[...room.players.values()].find(p=>!p.dead&&!p.downed&&!p.disconnected && Math.hypot(p.x-drop.x,p.y-drop.y)<.65);
      if (p) {
        if (drop.kind==='med') p.hp=Math.min(p.maxHp,p.hp+24+20*(p.upgrades.medkit||0));
        send(p.ws,{type:'pickup',kind:drop.kind});
        room.drops.splice(room.drops.indexOf(drop),1);
      }
    }
    for (const p of room.players.values()) if (p.reloadEnd>0 && room.clock>=p.reloadEnd) {
      p.ammo=Math.ceil(weapons[p.weapon].mag*p.mag);p.slotAmmo[p.slot]=p.ammo;p.reloadEnd=0;
      p.reloadWindowStart=0;p.reloadWindowEnd=0;p.reloadAttempted=false;
    }
    updateRevives(room,dt);
    if ([...room.players.values()].every(p=>p.dead)) {
      room.projectiles.length=0;
      for(const m of room.machines||[])m.session=null;
      room.phase='gameover'; announce(room,'ALL SIGNALS LOST // RUN TERMINATED');
    } else if (room.spawnLeft<=0 && room.enemies.length===0) {
      room.projectiles.length=0;
      for(const m of room.machines||[])m.session=null;
      settleWorkOrder(room);
      buildEncounterReport(room);
      room.phase='intermission'; room.timer=room.intermissionSeconds||60;
      for (const p of room.players.values()) if (!p.dead){
        if(p.downed){p.downed=false;p.downedUntil=0;p.reviveProgress=0;p.hp=Math.ceil(p.maxHp*.4);announce(room,`${p.name} // RESTORED AT CLEAR`);}
        chooseOptions(room,p,room.overtimeActive);
      }
      announce(room,room.overtimeActive?`OVERTIME CLEARED // BONUS AUGMENT DRAFT`:`WAVE ${room.wave} CLEARED // ARMORY ONLINE`);
    }
  } else if (room.phase==='intermission') {
    room.timer-=dt;
    if (room.timer<=0) {
      for (const p of room.players.values()) if (!p.dead){
        for(let i=0;i<3&&!p.augmentReady;i++)applyUpgrade(p,p.choices[0],p.draftToken);
        if(!p.armoryReady)applyWeapon(p,p.weaponChoices[0]);
        if(!p.talentReady){const node=talents[p.classId].flatMap(b=>b.nodes).find(n=>!p.talents[n.id]);if(node)applyTalent(p,node.id);}
        if(!p.graftReady)applyGraft(p,p.graftChoices[0],p.graftToken);
      }
      if(room.wave>=9){
        room.phase='victory';room.timer=0;room.machine=null;
        announce(room,'CONTRACT COMPLETE // EQUIPMENT RECOVERED');
        announce(room,'INCIDENT REPORT // AUTOMATION REMAINS ACTIVE');
      }else startWave(room);
    }
  }
  if(room.pings?.length)room.pings=room.pings.filter(q=>q.expiresAt>room.clock&&room.phase==='combat');
  room.snapshotTimer-=dt;
  if (room.snapshotTimer<=0) { snapshot(room); room.snapshotTimer=.1; }
}

const mime={ '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.ttf':'font/ttf','.txt':'text/plain; charset=utf-8' };
const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost');
  const file=path.join(ROOT,'public',url.pathname==='/'?'index.html':url.pathname);
  if (!file.startsWith(path.join(ROOT,'public'))) { res.writeHead(403).end(); return; }
  fs.readFile(file,(err,data)=>{
    if (err) { res.writeHead(404).end('Not found'); return; }
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(data);
  });
});
server.on('upgrade',(req,socket)=>{
  if (req.url!=='/ws' || req.headers.upgrade?.toLowerCase()!=='websocket' || !req.headers['sec-websocket-key']) { socket.destroy(); return; }
  const accept=crypto.createHash('sha1').update(req.headers['sec-websocket-key']+'258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: '+accept+'\r\n\r\n');
  const ws={ socket, buffer:Buffer.alloc(0), closed:false, player:null, room:null,
    send(data){
      if (this.closed) return;
      const payload=Buffer.from(data);
      const head=payload.length<126?Buffer.from([0x81,payload.length]):Buffer.from([0x81,126,payload.length>>8,payload.length&255]);
      socket.write(Buffer.concat([head,payload]));
    }
  };
  socket.on('data',chunk=>{
    ws.buffer=Buffer.concat([ws.buffer,chunk]);
    while (ws.buffer.length>=2) {
      const b=ws.buffer, opcode=b[0]&15, masked=!!(b[1]&128);
      let len=b[1]&127, offset=2;
      if (len===126) { if (b.length<4) return; len=b.readUInt16BE(2); offset=4; }
      if (len===127) { socket.destroy(); return; }
      if (!masked || len>65535) { socket.destroy(); return; }
      if (b.length<offset+4+len) return;
      const mask=b.subarray(offset,offset+4), body=Buffer.from(b.subarray(offset+4,offset+4+len));
      for (let i=0;i<len;i++) body[i]^=mask[i%4];
      ws.buffer=b.subarray(offset+4+len);
      if (opcode===8) { socket.end(); return; }
      if (opcode===1) handleMessage(ws,body.toString('utf8'));
    }
  });
  const close=()=>{
    if (ws.closed) return;
    ws.closed=true;
    if (ws.player && ws.room && ws.player.ws===ws) {
      const p=ws.player,room=ws.room;
      p.ws=null;p.disconnected=true;p.reconnectUntil=room.clock+60;
      p.reviveTargetId=null;p.reviveIntentAt=-100;
      announce(room,`${p.name} // SIGNAL LOST · 60S RECONNECT WINDOW`);
      snapshot(room);
    }
  };
  socket.on('close',close); socket.on('error',close);
});
let timer = null;
export function startServer({ port = PORT, host = '0.0.0.0' } = {}) {
  return new Promise((resolve, reject) => {
    const onError = error => reject(error);
    server.once('error', onError);
    server.listen(port, host, () => {
      server.off('error', onError);
      timer ||= setInterval(() => { for (const room of rooms.values()) updateRoom(room,TICK); }, 1000*TICK);
      resolve(server.address().port);
    });
  });
}
export function stopServer() {
  if (timer) clearInterval(timer);
  timer = null;
  server.close();
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  startServer().then(port => console.log(`BLACKSITE SHIFT ready at http://localhost:${port}`))
    .catch(error => { console.error(error); process.exitCode = 1; });
}
