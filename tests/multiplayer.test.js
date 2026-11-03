import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { BUILD_VERSION, bayNames, classes, weapons, weaponNotes, enemyIntel, enemyStats, upgrades, stages, talents, grafts, encounterOrders, workOrders, floorHeightAt } from '../public/shared.js';
import { dealDamage, chooseOptions, rerollAugments, selectEncounterOrder, selectOvertimeProtocol, selectWorkOrder, findSafeCrewSpawns, advanceProjectile, startWave, spawnEnemy, expireDisconnectedPlayers, configureIntermission, configureRunSeed, applyWeapon, applyTalent, applyUpgrade, applyGraft, activateDash, activateMachine, requestMachineHold, requestRecoveryHold, startMachineSession, machineInput, settleWorkOrder, buildEncounterReport, fire, reload, useSkill, placePing, requestRevive, castOvertimeVote, resolveOvertimeVote, updateRoom } from '../server.js';

test('pulse bolts pierce two targets and a ricochet reverses a wall impact', () => {
  const player={id:'p',ws:{send(){}},classId:'medic',upgrades:{},damageDealt:0,damageHistory:[],hits:0,kills:0,leech:0};
  const enemies=[{id:1,type:'mite',x:14.5,y:12.5,hp:100},{id:2,type:'mite',x:16.5,y:12.5,hp:100}];
  const room={clock:1,players:new Map([['p',player]]),enemies,projectiles:[],drops:[],seq:3,phase:'combat'};
  const pulse={id:4,side:'player',kind:'pulse',ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,
    vx:21,vy:0,vh:0,radius:.17,damage:33,rangeLeft:26,crit:false,pierce:1,bounces:0,hitIds:new Set()};
  const batches=new Map();
  let alive=true;
  for(let i=0;i<20&&alive;i++)alive=advanceProjectile(room,pulse,1/60,batches);
  assert.equal(alive,false);
  assert.equal(player.damageDealt,66);
  assert.equal(player.hits,1);
  assert.equal(batches.get('p').size,2);
  const carbine={...pulse,id:5,kind:'carbine',shot:{hit:false},x:14.2,y:15.5,h:1.58,
    vx:38,vy:0,rangeLeft:22,pierce:0,bounces:1,hitIds:new Set()};
  assert.equal(advanceProjectile(room,carbine,1/60,new Map()),true);
  assert.equal(advanceProjectile(room,carbine,1/60,new Map()),true);
  assert.ok(carbine.vx<0);
  assert.equal(carbine.bounces,0);
});

test('needle hits carry poison, burn, and slow upgrades', () => {
  const player={id:'p',ws:{send(){}},classId:'runner',upgrades:{ember:1,frost:1},damageDealt:0,damageHistory:[],hits:0,kills:0,leech:0};
  const enemy={id:1,type:'mite',x:14.5,y:12.5,hp:100};
  const room={clock:1,players:new Map([['p',player]]),enemies:[enemy],drops:[],seq:2,phase:'combat'};
  const needle={id:2,side:'player',kind:'smg',ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,
    vx:30,vy:0,vh:0,radius:.075,damage:11,rangeLeft:16,crit:false,pierce:0,bounces:0,hitIds:new Set()};
  for(let i=0;i<10;i++)if(!advanceProjectile(room,needle,1/60,new Map()))break;
  assert.equal(enemy.hp,67,'poison and fire now react without requiring a separate augment');
  assert.ok(enemy.toxinUntil>room.clock&&enemy.burnUntil>room.clock&&enemy.slowUntil>room.clock);
  assert.equal(enemy.slowFactor,.62);
});

test('shock on a frozen target conducts a slow to nearby hostiles', () => {
  const p={id:'p',ws:{send(){}},classId:'medic',upgrades:{},damageDealt:0,damageHistory:[],hits:0,kills:0,leech:0};
  const frozen={id:1,type:'brute',x:14.5,y:12.5,hp:200,maxHp:200,slowUntil:4,slowFactor:.5};
  const other={id:2,type:'brute',x:16,y:12.5,hp:200,maxHp:200};
  const room={clock:1,players:new Map([['p',p]]),enemies:[frozen,other],projectiles:[],drops:[],seq:3,phase:'combat'};
  const bolt={id:3,side:'player',kind:'arcgun',ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,
    vx:28,vy:0,vh:0,radius:.12,damage:15,rangeLeft:18,crit:false,pierce:0,bounces:0,hitIds:new Set()};
  for(let i=0;i<10;i++)if(!advanceProjectile(room,bolt,1/60,new Map()))break;
  assert.ok(other.hp<200);
  assert.ok(other.slowUntil>room.clock,'conduction transfers cold to the second target');
});

test('salvage quota earns a personal reroll that rejects stale tokens and old cards', () => {
  const p={id:'p',ws:{send(){}},classId:'vanguard',upgrades:{},talents:{},grafts:[],loadout:['carbine',null],
    damageDealt:0,damageHistory:[],kills:0,leech:0,hp:100,maxHp:100};
  const room={phase:'combat',clock:1,wave:2,salvage:0,salvageTarget:2,salvageEarned:false,
    players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],seq:1};p.room=room;
  for(let i=0;i<2;i++){
    const enemy={id:room.seq++,type:'mite',x:14+i,y:12.5,hp:10,maxHp:10};
    room.enemies.push(enemy);dealDamage(room,p,enemy,10,false,new Map());
  }
  assert.equal(room.salvageEarned,true);
  room.phase='intermission';chooseOptions(room,p);
  const before=[...p.choices],token=p.draftToken;
  assert.equal(p.rerolls,1);
  assert.equal(rerollAugments(room,p,token-1),false);
  assert.equal(rerollAugments(room,p,token),true);
  assert.equal(p.rerolls,0);
  assert.ok(p.choices.every(id=>!before.includes(id)));
  assert.equal(rerollAugments(room,p,p.draftToken),false);
});

test('Siphon Halo turns a precision reload into a nearby pulse and skill recovery', () => {
  const events=[];
  const p={id:'p',ws:{send:data=>events.push(JSON.parse(data))},x:12.5,y:12.5,classId:'vanguard',
    hp:100,maxHp:100,dead:false,upgrades:{},grafts:['siphonHalo'],damageDealt:0,damageHistory:[],kills:0,leech:0,
    reloadEnd:6,reloadWindowStart:4.9,reloadWindowEnd:5.2,reloadAttempted:false,reloadBoostSlot:-1,
    skillReadyAt:10,slot:0};
  const enemy={id:1,type:'brute',x:14,y:12.5,hp:100,maxHp:100};
  const room={phase:'combat',clock:5,players:new Map([['p',p]]),enemies:[enemy],drops:[],feed:[],seq:2};
  assert.equal(reload(room,p),true);
  assert.equal(enemy.hp,78);
  assert.equal(p.skillReadyAt,7);
  assert.equal(p.reloadBoostSlot,-1);
  assert.ok(events.some(event=>event.type==='perfect_reload'&&event.siphon));
});

test('class signatures create guard, breach, and squad reload actions', () => {
  const ws={send(){}};
  const v={id:'v',ws,classId:'vanguard',x:12.5,y:12.5,hp:100,maxHp:100,
    dead:false,downed:false,skillReadyAt:0,upgrades:{bulwarkPlus:1},talents:{},grafts:[]};
  const b={id:'b',ws,classId:'breacher',x:12.5,y:12.5,hp:100,maxHp:100,
    dead:false,downed:false,skillReadyAt:0,upgrades:{shockPlus:1},talents:{},grafts:[],damage:1,
    damageDealt:0,damageHistory:[],kills:0,leech:0};
  const m={id:'m',ws,classId:'medic',x:12.5,y:12.5,hp:100,maxHp:100,
    dead:false,downed:false,skillReadyAt:0,upgrades:{rallyPlus:1},talents:{},grafts:[]};
  const ally={id:'a',ws,classId:'runner',x:13,y:12.5,hp:50,maxHp:100,dead:false,downed:false,
    weapon:'smg',slot:0,slotAmmo:[0,0],mag:1,ammo:0,reloadEnd:8};
  const enemy={id:1,type:'brute',x:15,y:12.5,hp:300,maxHp:300,attack:0};
  const room={phase:'combat',clock:1,players:new Map([['v',v],['b',b],['m',m],['a',ally]]),
    enemies:[enemy],projectiles:[],drops:[],feed:[],seq:2};
  useSkill(room,v);assert.ok(v.tauntUntil>room.clock);
  useSkill(room,b);assert.ok(enemy.attack>=1.2);
  useSkill(room,m);assert.equal(ally.reloadEnd,0);assert.equal(ally.ammo,weapons.smg.mag);
});

test('timed reload and class skill can quench nearby hostiles', () => {
  const ws={send(){}};
  const p={id:'p',ws,classId:'vanguard',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,
    upgrades:{snapfreeze:1,quench:1},talents:{},grafts:[],skillReadyAt:0,
    reloadEnd:6,reloadWindowStart:4.9,reloadWindowEnd:5.2,reloadAttempted:false,reloadBoostSlot:-1,slot:0};
  const enemy={id:1,type:'brute',x:14,y:12.5,hp:200,maxHp:200,attack:0};
  const room={phase:'combat',clock:5,players:new Map([['p',p]]),enemies:[enemy],drops:[],feed:[],seq:2};
  assert.equal(reload(room,p),true);assert.equal(enemy.slowFactor,.5);assert.equal(enemy.slowUntil,7);
  enemy.slowUntil=0;enemy.slowFactor=1;
  useSkill(room,p);assert.equal(enemy.slowFactor,.5);assert.equal(enemy.slowUntil,7);
  assert.equal(p.skillReadyAt,33);
});

test('encounter pressure takes two bounded steps and order choice is seed stable', () => {
  assert.equal(selectEncounterOrder(2345,2,0),selectEncounterOrder(2345,2,0));
  assert.ok(encounterOrders[1].includes(selectEncounterOrder(2345,5,1)));
  const p={id:'p',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,ws:{send(){}}};
  const room={clock:29.9,encounterStart:0,pressureBand:0,phase:'combat',wave:2,stageIndex:0,
    hazardStart:0,hazardCycle:-1,spawnLeft:1,spawnTimer:99,snapshotTimer:99,
    players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],seq:1};
  updateRoom(room,.2);assert.equal(room.pressureBand,1);assert.equal(room.spawnLeft,2);
  room.clock=59.9;updateRoom(room,.2);assert.equal(room.pressureBand,2);assert.equal(room.spawnLeft,3);
  room.clock=90;updateRoom(room,.2);assert.equal(room.spawnLeft,3,'pressure cannot add endless enemies');
});

test('host can replay a prior seed and other crew cannot change it', () => {
  const host={id:'h',disconnected:false},guest={id:'g',disconnected:false};
  const room={phase:'lobby',players:new Map([['h',host],['g',guest]]),hostId:'h',feed:[],seedOverride:null};
  assert.equal(configureRunSeed(room,guest,'12345'),false);
  assert.equal(configureRunSeed(room,host,'4294967296'),false);
  assert.equal(configureRunSeed(room,host,'12345'),true);
  assert.equal(room.seedOverride,12345);
  assert.equal(configureRunSeed(room,host,''),true);
  assert.equal(room.seedOverride,null);
});

test('mortar shells explode on impact and ignite nearby targets', () => {
  const player={id:'p',ws:{send(){}},classId:'breacher',upgrades:{},damage:1,damageDealt:0,damageHistory:[],hits:0,kills:0,leech:0};
  const enemies=[{id:1,type:'brute',x:14.5,y:12.5,hp:200,maxHp:200},{id:2,type:'mite',x:15.4,y:12.5,hp:100,maxHp:100}];
  const room={clock:1,players:new Map([['p',player]]),enemies,projectiles:[],drops:[],seq:3,phase:'combat'};
  const shell={id:3,side:'player',kind:'launcher',ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,
    vx:16,vy:0,vh:0,radius:.22,damage:54,rangeLeft:20,crit:false,pierce:0,bounces:0,hitIds:new Set()};
  const batches=new Map();for(let i=0;i<20;i++)if(!advanceProjectile(room,shell,1/60,batches))break;
  assert.ok(enemies[0].hp<200);
  assert.ok(enemies[1].hp<100);
  assert.ok(enemies[1].burnUntil>room.clock);
  assert.ok(Number.isFinite(enemies[1].burnPower));
  assert.equal(enemies[1].burnPower,4);
});

test('harpoon moves a victim through clear space and primes one team damage event', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  const shooter={id:'p',ws:{send(){}},classId:'vanguard',x:12.5,y:12.5,upgrades:{},damage:1,damageDealt:0,damageHistory:[],hits:0,kills:0};
  const ally={id:'a',ws:{send(){}},x:12.5,y:13,upgrades:{},damageDealt:0,damageHistory:[],kills:0};
  const enemy={id:1,type:'brute',x:15.5,y:12.5,hp:300,maxHp:300};
  const room={clock:1,grid,players:new Map([['p',shooter],['a',ally]]),enemies:[enemy],projectiles:[],drops:[],seq:2,phase:'combat'};
  const bolt={id:2,side:'player',kind:'harpoon',ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,
    vx:34,vy:0,vh:0,radius:.14,damage:68,rangeLeft:21,crit:false,pierce:0,bounces:0,hitIds:new Set()};
  for(let i=0;i<15;i++)if(!advanceProjectile(room,bolt,1/60,new Map()))break;
  assert.equal(enemy.hp,232);
  assert.ok(enemy.x<15.5&&enemy.x>13.7,'harpoon pulls without overlapping shooter');
  assert.equal(enemy.markedUntil,4);
  const markedHit=new Map();
  assert.equal(dealDamage(room,ally,enemy,20,false,markedHit),26,'teammate consumes the mark');
  assert.equal(markedHit.get(enemy.id).marked,true,'the damage report identifies a consumed mark');
  assert.equal(dealDamage(room,ally,enemy,20,false,new Map()),20,'mark is spent once');
  enemy.markedUntil=room.clock+3;room.clock=5;
  assert.equal(dealDamage(room,ally,enemy,20,false,new Map()),20,'expired mark has no effect');
  shooter.upgrades.tetherline=1;
  const second={...bolt,id:3,shot:{hit:false},x:12.5,y:12.5,rangeLeft:21,hitIds:new Set()};
  for(let i=0;i<12;i++)if(!advanceProjectile(room,second,1/60,new Map()))break;
  assert.equal(enemy.markCharges,2);
  assert.equal(enemy.markedUntil,9);
  assert.equal(dealDamage(room,ally,enemy,10,false,new Map()),13);
  assert.equal(dealDamage(room,ally,enemy,10,false,new Map()),13);
  assert.equal(dealDamage(room,ally,enemy,10,false,new Map()),10);
});

test('gravity canister clusters and slows enemies while cover blocks its blast', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24||x===17&&y===12?1:0));
  const p={id:'p',ws:{send(){}},classId:'breacher',x:12.5,y:12.5,upgrades:{},damage:1,damageDealt:0,damageHistory:[],hits:0,kills:0};
  const direct={id:1,type:'brute',x:14.5,y:12.5,hp:300,maxHp:300};
  const nearby={id:2,type:'mite',x:15.1,y:14.8,hp:100,maxHp:100};
  const room={clock:1,grid,players:new Map([['p',p]]),enemies:[direct,nearby],projectiles:[],drops:[],seq:3,phase:'combat'};
  const shell={id:3,side:'player',kind:'gravity',ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,
    vx:17,vy:0,vh:0,radius:.2,damage:24,rangeLeft:19,crit:false,pierce:0,bounces:0,hitIds:new Set()};
  const oldX=nearby.x,oldY=nearby.y;
  for(let i=0;i<20;i++)if(!advanceProjectile(room,shell,1/60,new Map()))break;
  assert.equal(direct.hp,264,'direct hit plus half blast');
  assert.ok(direct.x<14.5,'direct target is drawn into the blast center');
  assert.ok(nearby.hp<100&&Math.hypot(nearby.x-shell.x,nearby.y-shell.y)<Math.hypot(oldX-shell.x,oldY-shell.y));
  assert.equal(nearby.slowFactor,.65);
  assert.ok(nearby.slowUntil>room.clock);
  for(const e of [direct,nearby])assert.ok(e.x<17-enemyStats[e.type].radius,'pull stops at the wall');
  p.upgrades.singularity=1;
  const second={...shell,id:4,shot:{hit:false},x:12.5,y:12.5,rangeLeft:19,hitIds:new Set()};
  for(let i=0;i<20;i++)if(!advanceProjectile(room,second,1/60,new Map()))break;
  assert.ok(direct.attack>=1.2&&nearby.attack>=1.2,'singularity holds enemy attacks');
  const wallGrid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24||x===14&&y===12?1:0));
  const behind={id:5,type:'brute',x:15.5,y:12.5,hp:300,maxHp:300};
  room.grid=wallGrid;room.enemies=[behind];p.upgrades.singularity=0;
  const blocked={...shell,id:6,shot:{hit:false},x:12.5,y:12.5,rangeLeft:19,hitIds:new Set()};
  for(let i=0;i<20;i++)if(!advanceProjectile(room,blocked,1/60,new Map()))break;
  assert.equal(behind.hp,300,'solid wall blocks splash damage and displacement');
});

test('shielded sentinels resist frontal fire and expose the rear', () => {
  const p={id:'p',ws:{send(){}},x:13.5,y:12.5,hp:100,maxHp:100,upgrades:{},damageDealt:0,damageHistory:[],kills:0,leech:0};
  const enemy={id:1,type:'sentinel',x:12.5,y:12.5,hp:300,maxHp:300,shielded:true,faceX:1,faceY:0};
  const room={clock:1,players:new Map([['p',p]]),enemies:[enemy],drops:[],feed:[],seq:2,phase:'combat'};
  const plateHit=new Map();
  assert.equal(dealDamage(room,p,enemy,100,false,plateHit),40);
  assert.equal(plateHit.get(enemy.id).armored,true,'the damage report identifies a plate hit');
  p.x=11.5;
  assert.equal(dealDamage(room,p,enemy,100,false,new Map()),100);
  enemy.shielded=false;p.x=13.5;
  assert.equal(dealDamage(room,p,enemy,100,false,new Map()),100);
});

test('security gunners strafe within firing range without entering walls', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  const p={id:'p',ws:{send(){}},x:16.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,
    hurtAt:-100,invulnerableUntil:100,damageHistory:[]};
  const e={id:1,type:'gunner',x:12.5,y:12.5,hp:78,maxHp:78,attack:10,flash:0,spawnedAt:0};
  const room={clock:1,phase:'combat',wave:1,stageIndex:0,grid,players:new Map([['p',p]]),enemies:[e],projectiles:[],drops:[],feed:[],seq:2,
    hazardStart:1,hazardCycle:-1,spawnLeft:0,spawnTimer:99,snapshotTimer:99,encounterStart:1,pressureBand:0,overtimeActive:false};
  for(let i=0;i<20;i++)updateRoom(room,.05);
  assert.ok(Math.abs(e.y-12.5)>.2,'gunner changes firing angle during its cooldown');
  assert.ok(e.x>1&&e.x<24&&e.y>1&&e.y<24);
});

test('sapper marks a dodgeable blast zone before dealing damage', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  const p={id:'p',ws:{send(){}},name:'CREW',x:14.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,armor:0,hurtAt:-100,invulnerableUntil:0};
  const enemy={id:1,type:'sapper',x:12.5,y:12.5,hp:88,maxHp:88,attack:0,flash:0,spawnedAt:0};
  const room={clock:1,phase:'combat',wave:1,stageIndex:0,grid,players:new Map([['p',p]]),enemies:[enemy],projectiles:[],drops:[],feed:[],seq:2,
    hazardStart:1,hazardCycle:-1,spawnLeft:0,spawnTimer:99,snapshotTimer:99,encounterStart:1,pressureBand:0,overtimeActive:false};
  updateRoom(room,.02);
  assert.equal(enemy.telegraph.kind,'blast');
  assert.equal(enemy.telegraph.radius,2.1);
  const marked={x:enemy.telegraph.x,y:enemy.telegraph.y};
  p.x=18.5;updateRoom(room,1.26);assert.equal(p.hp,100,'leaving the mark avoids the blast');
  enemy.attack=0;p.x=marked.x;p.y=marked.y;updateRoom(room,.02);
  assert.equal(enemy.telegraph.kind,'blast');
  updateRoom(room,1.26);assert.equal(p.hp,82,'standing in the mark takes sapper damage');
});

test('welder announces a cutting strip and purger announces a frost ring before damage', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  for(const [type,stageIndex,expected,damage,moveAway] of [
    ['welder',0,'beam',15,p=>{p.y=15.5;}],
    ['purger',1,'coldPulse',8,p=>{p.x=17.5;}]
  ]){
    const p={id:'p',ws:{send(){}},name:'CREW',x:14.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,
      armor:0,hurtAt:-100,invulnerableUntil:0,damageHistory:[]};
    const e={id:1,type,x:12.5,y:12.5,hp:enemyStats[type].hp,maxHp:enemyStats[type].hp,attack:0,flash:0,spawnedAt:0};
    const room={clock:1,phase:'combat',wave:1,stageIndex,grid,players:new Map([['p',p]]),enemies:[e],projectiles:[],drops:[],feed:[],seq:2,
      hazardStart:1,hazardCycle:-1,spawnLeft:0,spawnTimer:99,snapshotTimer:99,encounterStart:1,pressureBand:0,overtimeActive:false};
    updateRoom(room,.02);assert.equal(e.telegraph.kind,expected);
    moveAway(p);updateRoom(room,1.02);assert.equal(p.hp,100,`${type} can be dodged during the tell`);
    p.x=14.5;p.y=12.5;e.attack=0;updateRoom(room,.02);assert.equal(e.telegraph.kind,expected);
    updateRoom(room,1.02);assert.equal(p.hp,100-damage,`${type} hits a crew member left in its warning`);
    if(type==='purger')assert.ok(p.slowUntil>room.clock,'coolant pulse applies slow');
  }
});

test('press brute warns before its slam and a crew member can leave the ring', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  const p={id:'p',ws:{send(){}},name:'CREW',x:14.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,
    armor:0,hurtAt:-100,invulnerableUntil:0,damageHistory:[]};
  const e={id:1,type:'brute',x:12.5,y:12.5,hp:200,maxHp:200,attack:0,flash:0,spawnedAt:0};
  const room={clock:1,phase:'combat',wave:1,stageIndex:0,grid,players:new Map([['p',p]]),enemies:[e],projectiles:[],drops:[],feed:[],seq:2,
    hazardStart:1,hazardCycle:-1,spawnLeft:0,spawnTimer:99,snapshotTimer:99,encounterStart:1,pressureBand:0,overtimeActive:false};
  updateRoom(room,.02);assert.equal(e.telegraph.kind,'slam');assert.equal(e.telegraph.radius,2.45);
  p.x=17.5;updateRoom(room,.91);assert.equal(p.hp,100);
  p.x=14.5;e.attack=0;updateRoom(room,.02);assert.equal(e.telegraph.kind,'slam');
  updateRoom(room,.91);assert.equal(p.hp,78);
});

test('ram charge deals contact damage and a wall crash stuns the charger', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  const p={id:'p',ws:{send(){}},name:'CREW',x:16.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,
    armor:0,hurtAt:-100,invulnerableUntil:0,damageHistory:[]};
  const e={id:1,type:'charger',x:12.5,y:12.5,hp:95,maxHp:95,attack:0,flash:0,spawnedAt:0};
  const room={clock:1,phase:'combat',wave:1,stageIndex:0,grid,players:new Map([['p',p]]),enemies:[e],projectiles:[],drops:[],feed:[],seq:2,
    hazardStart:1,hazardCycle:-1,spawnLeft:0,spawnTimer:99,snapshotTimer:99,encounterStart:1,pressureBand:0,overtimeActive:false};
  updateRoom(room,.02);assert.equal(e.telegraph.kind,'charge');
  updateRoom(room,.51);
  for(let i=0;i<13&&p.hp===100;i++)updateRoom(room,.05);
  assert.equal(p.hp,88,`ram contact causes its published 12 damage; ram=${e.x.toFixed(2)},${e.y.toFixed(2)} clock=${room.clock.toFixed(2)} until=${e.chargeUntil}`);
  e.x=12.5;e.y=12.5;e.attack=0;e.chargeUntil=0;p.x=17.5;
  updateRoom(room,.02);assert.equal(e.telegraph.kind,'charge');
  updateRoom(room,.51);
  room.grid[12][15]=1;
  for(let i=0;i<13&&!e.stunnedUntil;i++)updateRoom(room,.05);
  assert.ok(e.stunnedUntil>room.clock,'running into cover gives the squad a punish window');
  assert.equal(e.chargeUntil,0);
});

test('each sector boss cycles three warned attacks and enters one overdrive phase', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  for(const [type,stageIndex,kind,third,damage] of [['warden',0,'press','beam',24],['matriarch',1,'coldPulse','beam',20],['overseer',2,'beam','press',25]]){
    const p={id:'p',ws:{send(){}},name:'CREW',x:14.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,
      armor:0,hurtAt:-100,invulnerableUntil:0,damageHistory:[]};
    const e={id:1,type,x:12.5,y:12.5,hp:enemyStats[type].hp,maxHp:enemyStats[type].hp,attack:0,flash:0,spawnedAt:0,boss:true,summon:100};
    const room={clock:1,phase:'combat',wave:3+stageIndex*3,stageIndex,grid,players:new Map([['p',p]]),enemies:[e],projectiles:[],drops:[],feed:[],seq:2,
      hazardStart:1,hazardCycle:-1,spawnLeft:0,spawnTimer:99,snapshotTimer:99,encounterStart:1,pressureBand:0,overtimeActive:false};
    updateRoom(room,.02);assert.equal(e.telegraph.kind,'volley',`${type} opens with its fan`);
    e.telegraph=null;e.attack=0;
    updateRoom(room,.02);assert.equal(e.telegraph.kind,kind,`${type} follows with its sector attack`);
    updateRoom(room,1.13);assert.equal(p.hp,100-damage,`${type} attack resolves after its warning`);
    room.clock=e.attackWindowUntil+.01;e.attack=0;updateRoom(room,.02);assert.equal(e.telegraph.kind,third,`${type} has a third attack shape`);
    e.telegraph=null;e.attack=100;e.hp=Math.floor(e.maxHp*.45);
    updateRoom(room,.02);assert.equal(e.overdrive,true,`${type} escalates at 45% health`);
    const warnings=room.feed.filter(item=>String(item.text||item).includes('EMERGENCY CYCLE')).length;
    updateRoom(room,.02);assert.equal(room.feed.filter(item=>String(item.text||item).includes('EMERGENCY CYCLE')).length,warnings,'phase is announced once');
  }
});

test('heavy projectile impacts interrupt ordinary enemies with a recovery lock', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  const p={id:'p',ws:{send(){}},x:12.5,y:12.5,hp:100,maxHp:100,classId:'vanguard',upgrades:{},talents:{},damageDealt:0,damageHistory:[],hits:0,kills:0,leech:0};
  const enemy={id:1,type:'brute',x:14.5,y:12.5,hp:200,maxHp:200,attack:0,telegraph:{kind:'slam',x:14.5,y:12.5,radius:2.45,fireAt:4}};
  const room={clock:1,phase:'combat',grid,players:new Map([['p',p]]),enemies:[enemy],projectiles:[],drops:[],feed:[],seq:2};
  const bolt=id=>({id,side:'player',kind:'scatter',ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,vx:26,vy:0,vh:0,
    radius:.11,damage:9,rangeLeft:11,crit:false,pierce:0,bounces:0,hitIds:new Set()});
  const first=new Map(),firstBolt=bolt(2);for(let i=0;i<8;i++)if(!advanceProjectile(room,firstBolt,.01,first))break;
  assert.ok(enemy.stunnedUntil>room.clock);
  assert.equal(enemy.telegraph,null);
  assert.equal(first.get('p').get(enemy.id).staggered,true);
  const lockedUntil=enemy.staggerReadyAt;
  const second=bolt(11);for(let i=0;i<8;i++)if(!advanceProjectile(room,second,.01,new Map()))break;
  assert.equal(enemy.staggerReadyAt,lockedUntil,'a second pellet cannot renew the stagger');
});

test('enemies route around a cover wall instead of remaining hidden behind it', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24||x===12&&y>=11&&y<=13?1:0));
  const p={id:'p',ws:{send(){}},x:15.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,
    hurtAt:-100,invulnerableUntil:100,damageHistory:[]};
  const e={id:1,type:'mite',x:9.5,y:12.5,hp:48,maxHp:48,attack:100,flash:0,spawnedAt:0};
  const room={clock:1,phase:'combat',wave:1,stageIndex:0,grid,players:new Map([['p',p]]),enemies:[e],projectiles:[],drops:[],pings:[],feed:[],seq:2,
    hazardStart:1,hazardCycle:-1,spawnLeft:0,spawnTimer:99,snapshotTimer:99,encounterStart:1,pressureBand:0,overtimeActive:false};
  for(let i=0;i<240;i++)updateRoom(room,.05);
  assert.ok(e.x>12.5,`mite should reach the far side of cover, got ${e.x.toFixed(2)},${e.y.toFixed(2)}`);
  assert.equal(grid[Math.floor(e.y)][Math.floor(e.x)],0);
});

test('field manual has coverage for every weapon, class, and encounter enemy', () => {
  assert.ok(Object.keys(weapons).length>=10);
  for(const [id,w] of Object.entries(weapons)){
    assert.ok(weaponNotes[id]?.length>60,id);
    assert.ok(w.trait.length>45,id);
    assert.ok(w.damage>0&&w.interval>0&&w.mag>0&&w.reload>0,id);
  }
  for(const c of Object.values(classes))assert.ok(c.skillDetail.length>65&&c.cooldown>=20,c.name);
  for(const stage of stages)for(const id of [...stage.enemies,stage.boss])assert.ok(enemyIntel[id]?.detail,id);
});

test('weapon-specific augments enter the draft only after the matching gun is carried', () => {
  const p={classId:'vanguard',loadout:['carbine',null],upgrades:{},talents:{},grafts:[]};
  const room={wave:2,salvageEarned:false,rngState:987654321};p.room=room;
  for(let i=0;i<50;i++){
    chooseOptions(room,p);
    assert.ok(!p.choices.includes('tetherline')&&!p.choices.includes('singularity'));
  }
  p.loadout=['harpoon','gravity'];
  const seen=new Set();
  for(let i=0;i<150;i++){chooseOptions(room,p);for(const id of p.choices)seen.add(id);}
  assert.ok(seen.has('tetherline')&&seen.has('singularity'));
});

test('poison followed by fire triggers Volatile Mix on grouped enemies', () => {
  const player={id:'p',ws:{send(){}},classId:'runner',upgrades:{combustion:1},damageDealt:0,damageHistory:[],hits:0,kills:0,leech:0};
  const first={id:1,type:'brute',x:14.5,y:12.5,hp:200,maxHp:200};
  const second={id:2,type:'mite',x:16,y:12.5,hp:100,maxHp:100};
  const room={clock:1,players:new Map([['p',player]]),enemies:[first,second],projectiles:[],drops:[],seq:3,phase:'combat'};
  const bolt=kind=>({id:room.seq++,side:'player',kind,ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,
    vx:30,vy:0,vh:0,radius:.075,damage:11,rangeLeft:16,crit:false,pierce:0,bounces:0,hitIds:new Set()});
  for(let i=0,b=bolt('smg');i<10;i++)if(!advanceProjectile(room,b,1/60,new Map()))break;
  player.upgrades.ember=1;
  for(let i=0,b=bolt('carbine');i<10;i++)if(!advanceProjectile(room,b,1/60,new Map()))break;
  assert.equal(second.hp,60);
  assert.ok(first.burnUntil>room.clock&&first.toxinUntil>room.clock);
});

test('frag protocol turns a kill into nearby splash damage', () => {
  const player={classId:'vanguard',upgrades:{shrapnel:1},damageDealt:0,damageHistory:[],kills:0,leech:0};
  const first={id:1,type:'mite',x:12.5,y:12.5,hp:10};
  const second={id:2,type:'mite',x:14,y:12.5,hp:100};
  const room={clock:1,players:new Map(),enemies:[first,second],drops:[],seq:3};
  const entries=new Map();
  dealDamage(room,player,first,18,false,entries);
  assert.equal(second.hp,72);
  assert.equal(player.damageDealt,38);
  assert.equal(entries.get(2).amount,28);
});

test('first-wave choices mix a class signature, a build modifier, and a basic upgrade', () => {
  for(const classId of Object.keys(classes)){
    const player={classId,choices:[],ready:true};
    chooseOptions({wave:1},player);
    assert.equal(player.ready,false);
    assert.deepEqual(player.choices.map(id=>upgrades.find(u=>u.id===id).rarity),['SIGNATURE','RARE','COMMON']);
    assert.equal(upgrades.find(u=>u.id===player.choices[0]).classId,classId);
  }
});

test('overtime vote needs a living majority and resolves ties to the stable route', () => {
  const players=[{overtimeVote:'overtime',dead:false},{overtimeVote:'stable',dead:false},
    {overtimeVote:null,dead:false},{overtimeVote:'overtime',dead:true}];
  const room={phase:'intermission',players:new Map(players.map((p,i)=>[String(i),p]))};
  assert.equal(resolveOvertimeVote(room),false);
  players[1].overtimeVote=null;
  assert.equal(resolveOvertimeVote(room),false,'one yes vote cannot activate Overtime for three living players');
  players[1].overtimeVote='stable';
  players[2].overtimeVote='overtime';
  assert.equal(resolveOvertimeVote(room),true);
  room.phase='combat';
  assert.equal(resolveOvertimeVote(room),false);
});

test('overtime vote locks a ready solo squad countdown and ignores duplicate messages', () => {
  const p={id:'p',name:'OPERATOR',dead:false,ready:true,overtimeVote:null};
  const room={phase:'intermission',timer:32,players:new Map([['p',p]]),feed:[]};
  assert.equal(castOvertimeVote(room,p,'overtime'),true);
  assert.equal(room.timer,2);
  assert.equal(room.feed.length,1);
  assert.equal(castOvertimeVote(room,p,'overtime'),false);
  assert.equal(room.feed.length,1);
  assert.equal(castOvertimeVote(room,p,'invalid'),false);
});

test('the host chooses a bounded service window and a connected crew member can take over after departure', () => {
  const host={id:'a',name:'HOST',disconnected:false},crew={id:'b',name:'CREW',disconnected:false};
  const room={phase:'lobby',hostId:'a',intermissionSeconds:60,players:new Map([['a',host],['b',crew]]),feed:[]};
  assert.equal(configureIntermission(room,crew,120),false);
  assert.equal(configureIntermission(room,host,120),true);
  assert.equal(room.intermissionSeconds,120);
  assert.equal(configureIntermission(room,host,999),false);
  host.disconnected=true;
  assert.equal(configureIntermission(room,crew,30),true);
  assert.equal(room.intermissionSeconds,30);
  room.phase='combat';
  assert.equal(configureIntermission(room,crew,60),false);
});

test('squad pings reject walls, distant targets, duplicates, and rapid spam', () => {
  const p={id:'p',name:'OPERATOR',x:12.5,y:12.5,dead:false,lastPing:-100};
  const room={phase:'combat',clock:1,players:new Map([['p',p]]),pings:[],seq:1,feed:[]};
  assert.equal(placePing(room,p,{x:14.5,y:12.5,kind:'route'}),true);
  assert.equal(room.pings[0].byId,'p');
  assert.equal(room.pings[0].expiresAt,7);
  assert.equal(placePing(room,p,{x:14.5,y:12.5,kind:'danger'}),false);
  room.clock+=1;
  assert.equal(placePing(room,p,{x:9.5,y:9.5,kind:'danger'}),false,'wall coordinates are invalid');
  assert.equal(placePing(room,p,{x:8.5,y:8.5,kind:'danger'}),false,'pings cannot pass through walls');
  assert.equal(placePing(room,p,{x:23.5,y:23.5,kind:'danger'}),false,'pings cannot exceed range');
  assert.equal(placePing(room,p,{x:13.5,y:12.5,kind:'danger'}),true);
  assert.equal(room.pings.length,2);
  room.phase='intermission';room.clock+=1;
  assert.equal(placePing(room,p,{x:13.5,y:12.5,kind:'route'}),false);
});

test('host-owned recovery needs a nearby sustained hold and restores a downed teammate', () => {
  const ws={send(){}};
  const helper={id:'h',name:'HELPER',ws,x:12.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,
    reviveIntentAt:-100,damageHistory:[],upgrades:{},talents:{},grafts:[]};
  const target={id:'t',name:'TARGET',ws,x:13.1,y:12.5,hp:0,maxHp:100,dead:false,downed:true,downedUntil:18,
    reviveProgress:0,damageHistory:[],upgrades:{},talents:{},grafts:[]};
  const room={clock:0,phase:'combat',wave:1,stageIndex:0,hazardStart:0,hazardCycle:-1,
    players:new Map([['h',helper],['t',target]]),enemies:[],projectiles:[],drops:[],feed:[],pings:[],
    seq:1,spawnLeft:1,spawnTimer:100,snapshotTimer:100};helper.room=target.room=room;
  assert.equal(requestRevive(room,helper,'t'),true);
  updateRoom(room,.1);
  assert.ok(target.reviveProgress>0);
  updateRoom(room,.4);
  assert.equal(target.reviveProgress,0,'letting go resets progress');
  helper.x=20.5;
  assert.equal(requestRevive(room,helper,'t'),false,'revives cannot be done at range');
  helper.x=12.5;
  for(let i=0;i<30&&target.downed;i++){assert.equal(requestRevive(room,helper,'t'),true);updateRoom(room,.1);}
  assert.equal(target.downed,false);
  assert.equal(target.hp,35);
  assert.ok(target.invulnerableUntil>room.clock);
});

test('last standing casualty can reboot once, then bleedout ends the run', () => {
  const p={id:'p',name:'SOLO',ws:{send(){}},x:12.5,y:12.5,hp:0,maxHp:100,dead:false,downed:true,
    downedUntil:18,reviveProgress:0,reviveIntentAt:-100,selfRevives:0,damageHistory:[],upgrades:{},talents:{},grafts:[]};
  const room={clock:0,phase:'combat',wave:1,stageIndex:0,hazardStart:0,hazardCycle:-1,
    players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],pings:[],
    seq:1,spawnLeft:1,spawnTimer:100,snapshotTimer:100};p.room=room;
  for(let i=0;i<45&&p.downed;i++){assert.equal(requestRevive(room,p,'p'),true);updateRoom(room,.1);}
  assert.equal(p.downed,false);assert.equal(p.selfRevives,1);
  p.hp=0;p.downed=true;p.downedUntil=room.clock+18;
  assert.equal(requestRevive(room,p,'p'),false);
  updateRoom(room,18.1);
  assert.equal(p.dead,true);assert.equal(room.phase,'gameover');
});

test('director limits solo active enemies and simultaneous sniper windups', () => {
  const p={id:'p',name:'SOLO',ws:{send(){}},x:12.5,y:12.5,hp:100,maxHp:100,dead:false,
    damageHistory:[],upgrades:{},talents:{},grafts:[]};
  const room={clock:1,phase:'combat',wave:2,stageIndex:0,hazardStart:1,hazardCycle:-1,
    players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],pings:[],
    seq:1,spawnLeft:1,spawnTimer:100,snapshotTimer:100};p.room=room;
  for(let i=0;i<9;i++)assert.equal(spawnEnemy(room),true);
  assert.equal(spawnEnemy(room),false,'solo active-enemy cap is nine');
  assert.ok(room.enemies.every(e=>Math.hypot(e.x-p.x,e.y-p.y)>4.5));
  room.enemies=Array.from({length:6},(_,i)=>({id:i+100,type:'sniper',x:15+i*.3,y:12.5,hp:72,maxHp:72,attack:0,flash:0,phase:0}));
  updateRoom(room,.016);
  assert.equal(room.enemies.filter(e=>e.telegraph).length,2,'solo has two major attack slots');
  for(let i=1;i<4;i++)room.players.set(String(i),{...p,id:String(i),x:12.5,y:12.5,damageHistory:[],room});
  room.enemies.forEach(e=>{e.telegraph=null;e.attack=0;});
  updateRoom(room,.016);
  assert.equal(room.enemies.filter(e=>e.telegraph).length,4,'four-player squad has four major attack slots');
});

test('precision reload rewards the timed second press while an early miss finishes normally', () => {
  const events=[],p={id:'p',name:'OPERATOR',ws:{send(raw){events.push(JSON.parse(raw));}},classId:'vanguard',
    x:12.5,y:12.5,a:0,hp:100,maxHp:100,dead:false,weapon:'carbine',ammo:5,mag:1,slot:0,slotAmmo:[5,0],
    loadout:['carbine',null],reloadEnd:0,reloadBoostSlot:-1,damage:1,fireRate:1,crit:0,lastShot:-100,
    damageHistory:[],upgrades:{},talents:{},grafts:[],shots:0};
  const room={clock:0,phase:'combat',wave:1,stageIndex:0,hazardStart:0,hazardCycle:-1,
    players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],pings:[],
    seq:1,spawnLeft:1,spawnTimer:100,snapshotTimer:100};p.room=room;
  assert.equal(reload(room,p),true);
  const normalEnd=p.reloadEnd;
  room.clock=p.reloadWindowStart-.05;
  assert.equal(reload(room,p),false,'early press misses without penalizing the ordinary reload');
  room.clock=p.reloadWindowStart+.01;
  assert.equal(reload(room,p),false,'one attempt per magazine');
  assert.equal(p.reloadEnd,normalEnd);
  room.clock=normalEnd;updateRoom(room,.016);
  assert.equal(p.ammo,weapons.carbine.mag);
  assert.equal(p.reloadBoostSlot,-1);
  p.ammo=5;room.clock=5;
  assert.equal(reload(room,p),true);
  room.clock=(p.reloadWindowStart+p.reloadWindowEnd)/2;
  assert.equal(reload(room,p),true);
  assert.ok(p.reloadEnd<5+weapons.carbine.reload);
  assert.ok(events.some(e=>e.type==='perfect_reload'));
  room.clock=p.reloadEnd;updateRoom(room,.016);
  fire(room,p,0);
  assert.equal(room.projectiles[0].damage,weapons.carbine.damage*1.2);
  assert.equal(p.reloadBoostSlot,-1,'charged shot is consumed once per trigger pull');
});

test('Hotline Feed turns a dash into three tighter, faster volleys at a reload cost', () => {
  const p={id:'p',name:'RUNNER',ws:{send(){}},classId:'runner',x:12.5,y:12.5,a:0,hp:100,maxHp:100,dead:false,downed:false,
    weapon:'scatter',ammo:weapons.scatter.mag,mag:1,slot:0,slotAmmo:[weapons.scatter.mag,0],loadout:['scatter',null],
    reloadEnd:0,reloadBoostSlot:-1,damage:1,fireRate:1,crit:0,lastShot:-100,lastDash:-100,shots:0,
    damageHistory:[],upgrades:{hotline:1},talents:{},grafts:[],hotlineCharges:0};
  const room={clock:0,phase:'combat',wave:1,stageIndex:0,players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],pings:[],seq:1,rngState:123};p.room=room;
  assert.equal(activateDash(room,p),true);
  assert.equal(p.hotlineCharges,3);
  p.hotlineCharges=0;fire(room,p,0);
  const ordinary=room.projectiles[0],ordinaryAngle=Math.atan2(ordinary.vy,ordinary.vx),ordinarySpeed=Math.hypot(ordinary.vx,ordinary.vy,ordinary.vh);
  room.projectiles=[];room.rngState=123;p.lastShot=-100;p.ammo=weapons.scatter.mag;p.hotlineCharges=3;
  fire(room,p,0);
  const primed=room.projectiles[0],primedAngle=Math.atan2(primed.vy,primed.vx),primedSpeed=Math.hypot(primed.vx,primed.vy,primed.vh);
  assert.ok(Math.abs(primedSpeed/ordinarySpeed-1.15)<.001);
  assert.ok(Math.abs(primedAngle/ordinaryAngle-.7)<.001);
  assert.equal(p.hotlineCharges,2,'one charge is consumed per trigger, not per pellet');
  p.ammo=0;room.clock=4;
  assert.equal(reload(room,p),true);
  assert.ok(Math.abs(p.reloadDuration-weapons.scatter.reload*1.2)<.001);
  assert.ok(Math.abs(p.reloadWindowStart-room.clock-p.reloadDuration*.55)<.001);
  assert.ok(Math.abs(p.reloadWindowEnd-room.clock-p.reloadDuration*.75)<.001);
});

test('expired reconnect reservations release their squad slots', () => {
  const p={id:'p',name:'OFFLINE',disconnected:true,reconnectUntil:60};
  const room={code:'FAKE',clock:59,players:new Map([['p',p]]),feed:[]};
  assert.equal(expireDisconnectedPlayers(room),0);
  room.clock=60;
  assert.equal(expireDisconnectedPlayers(room),1);
  assert.equal(room.players.size,0);
  assert.match(room.feed[0].text,/WINDOW EXPIRED/);
});

test('cleared overtime grants two independent augment drafts and rejects a stale pick', () => {
  const p={id:'p',classId:'vanguard',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,
    overtimeVote:'overtime',upgrades:{},talents:{},loadout:['carbine',null],
    fireRate:1,damage:1,speed:1,leech:0,mag:1,armor:0,crit:0};
  const room={phase:'intermission',wave:1,stageIndex:0,clock:10,players:new Map([['p',p]]),
    enemies:[],projectiles:[],drops:[],feed:[],seq:1,snapshotTimer:99};p.room=room;
  startWave(room);
  assert.equal(room.overtimeActive,true);
  assert.equal(room.spawnTimer,.45);
  room.spawnLeft=0;
  updateRoom(room,.016);
  assert.equal(room.phase,'intermission');
  const firstToken=p.draftToken,firstChoice=p.choices[0];
  assert.equal(p.augmentPicksRemaining,2);
  assert.equal(applyUpgrade(p,firstChoice,firstToken),true);
  assert.equal(p.augmentPicksRemaining,1);
  assert.equal(p.augmentReady,false);
  assert.notEqual(p.draftToken,firstToken);
  assert.equal(applyUpgrade(p,firstChoice,firstToken),false);
  assert.equal(applyUpgrade(p,p.choices[0],p.draftToken),true);
  assert.equal(p.augmentPicksRemaining,0);
  assert.equal(p.augmentReady,true);
});

test('boss graft drafts are unique, mandatory, and reject stale or duplicate picks', () => {
  const p={classId:'vanguard',grafts:[],upgrades:{},talents:{},loadout:['carbine',null]};
  const room={wave:3};p.room=room;
  chooseOptions(room,p);
  assert.deepEqual(p.graftChoices,grafts.map(g=>g.id));
  p.augmentReady=p.armoryReady=p.talentReady=true;
  assert.equal(applyGraft(p,'arcSpine',p.graftToken-1),false);
  assert.equal(applyGraft(p,'arcSpine',p.graftToken),true);
  assert.equal(p.ready,true);
  assert.deepEqual(p.grafts,['arcSpine']);
  assert.equal(applyGraft(p,'arcSpine',p.graftToken),false);
  room.wave=6;
  chooseOptions(room,p);
  assert.deepEqual(p.graftChoices,['kineticRig','reclaimerCore','phaseCoupler','siphonHalo']);
  assert.equal(applyGraft(p,'kineticRig',p.graftToken-1),false);
});

test('Arc Spine charged projectiles arc once per trigger, including piercing shots', () => {
  const p={id:'p',ws:{send(){}},classId:'vanguard',upgrades:{},grafts:['arcSpine'],hp:100,maxHp:100,
    damageDealt:0,damageHistory:[],hits:0,kills:0,leech:0};
  const first={id:1,type:'brute',x:14.5,y:12.5,hp:200,maxHp:200};
  const second={id:2,type:'brute',x:16.5,y:12.5,hp:200,maxHp:200};
  const room={clock:1,players:new Map([['p',p]]),enemies:[first,second],projectiles:[],drops:[],seq:3,phase:'combat'};
  const shot={hit:false,graftProc:false};
  const bolt={id:3,side:'player',kind:'pulse',ownerId:'p',shot,arcCharged:true,x:12.5,y:12.5,h:1.58,
    vx:21,vy:0,vh:0,radius:.17,damage:33,rangeLeft:26,crit:false,pierce:1,bounces:0,hitIds:new Set()};
  for(let i=0;i<20;i++)if(!advanceProjectile(room,bolt,1/60,new Map()))break;
  assert.equal(shot.graftProc,true);
  assert.equal(first.hp,167);
  assert.equal(second.hp,149,'second hostile takes one 18 damage arc plus the piercing hit');
});

test('Arc Spine arms from a class skill and spends one charge per trigger pull', () => {
  const p={id:'p',ws:{send(){}},name:'OPERATOR',classId:'vanguard',weapon:'carbine',x:12.5,y:12.5,a:0,
    hp:100,maxHp:100,dead:false,upgrades:{},talents:{},grafts:['arcSpine'],arcCharges:0,
    skillReadyAt:0,skillUntil:0,ammo:24,slot:0,slotAmmo:[24,0],lastShot:-100,fireRate:1,damage:1,crit:0,shots:0};
  const room={clock:1,phase:'combat',players:new Map([['p',p]]),enemies:[],projectiles:[],feed:[],seq:1};
  useSkill(room,p);
  assert.equal(p.arcCharges,4);
  fire(room,p,0);
  assert.equal(p.arcCharges,3);
  assert.equal(p.ammo,23);
  assert.equal(room.projectiles.length,1);
  assert.equal(room.projectiles[0].arcCharged,true);
  fire(room,p,0);
  assert.equal(p.arcCharges,3,'rate-limited fire cannot consume a graft charge');
});

test('Kinetic Rig obeys dash cooldown and Reclaimer Core heals only nearby crew on a timer', () => {
  const events=[];
  const ws={send(message){events.push(JSON.parse(message));}};
  const p={id:'p',ws,classId:'vanguard',x:12.5,y:12.5,hp:60,maxHp:100,dead:false,
    upgrades:{},grafts:['kineticRig','reclaimerCore'],damage:1,damageDealt:0,damageHistory:[],kills:0,leech:0,lastDash:-100,reclaimerReadyAt:0};
  const near={id:'near',ws,x:13,y:12.5,hp:40,maxHp:100,dead:false};
  const far={id:'far',ws,x:20.5,y:20.5,hp:40,maxHp:100,dead:false};
  const target={id:1,type:'brute',x:14,y:12.5,hp:100,maxHp:100};
  const room={clock:1,phase:'combat',players:new Map([['p',p],['near',near],['far',far]]),enemies:[target],drops:[],feed:[],seq:2};
  assert.equal(activateDash(room,p),true);
  assert.equal(target.hp,52);
  assert.ok(target.x>14);
  assert.equal(activateDash(room,p),false);
  assert.equal(target.hp,52);
  assert.ok(events.some(e=>e.type==='fx'&&e.kind==='kinetic'));
  dealDamage(room,p,target,60,false,new Map());
  assert.equal(p.hp,72);
  assert.equal(near.hp,52);
  assert.equal(far.hp,40);
  const next={id:2,type:'mite',x:14,y:12.5,hp:10,maxHp:10};room.enemies.push(next);
  dealDamage(room,p,next,10,false,new Map());
  assert.equal(near.hp,52,'repair pulse cannot trigger again immediately');
  room.clock+=4;const later={id:3,type:'mite',x:14,y:12.5,hp:10,maxHp:10};room.enemies.push(later);
  dealDamage(room,p,later,10,false,new Map());
  assert.equal(near.hp,64);
});

test('Phase Coupler converts a dash into three lower-damage angle-control shots', () => {
  const p={id:'p',ws:{send(){}},classId:'vanguard',weapon:'carbine',x:12.5,y:12.5,a:0,
    hp:100,maxHp:100,dead:false,upgrades:{},talents:{},grafts:['phaseCoupler'],phaseCharges:0,
    ammo:24,slot:0,slotAmmo:[24,0],lastDash:-100,lastShot:-100,fireRate:1,damage:1,crit:0,shots:0};
  const room={clock:1,phase:'combat',players:new Map([['p',p]]),enemies:[],projectiles:[],feed:[],seq:1};
  assert.equal(activateDash(room,p),true);
  assert.equal(p.phaseCharges,3);
  for(let i=0;i<3;i++){
    room.clock+=.2;fire(room,p,0);
    const shot=room.projectiles.at(-1);
    assert.equal(shot.phaseCharged,true);
    assert.equal(shot.pierce,1);
    assert.equal(shot.bounces,2,'carbine keeps its innate ricochet');
    assert.equal(shot.damage,14.4);
  }
  assert.equal(p.phaseCharges,0);
  room.clock+=.2;fire(room,p,0);
  assert.equal(room.projectiles.at(-1).damage,18);
});

test('overtime floor hazard activates sooner and deals more damage', () => {
  const hit=(overtimeActive,clock)=>{
    const p={id:'p',name:'OPERATOR',classId:'runner',x:6.5,y:12.5,hp:100,maxHp:100,dead:false,
      armor:0,upgrades:{},hurtAt:-100,invulnerableUntil:0,ws:{send(){}}};
    const room={phase:'combat',clock,hazardStart:0,hazardCycle:-1,overtimeActive,stageIndex:0,wave:2,
      players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],spawnLeft:1,spawnTimer:99,snapshotTimer:99,feed:[]};
    p.room=room;updateRoom(room,.016);return p.hp;
  };
  assert.equal(hit(false,3.5),100);
  assert.equal(hit(true,3.5),85);
  assert.equal(hit(false,5),90);
  assert.equal(hit(true,5.5),100,'the accelerated hazard still has a safe interval');
});

test('processing machine needs nearby authorization, warns, hits the center, then cools down', () => {
  const messages=[];
  const p={id:'p',name:'OPERATOR',classId:'vanguard',x:12.5,y:8.5,hp:100,maxHp:100,
    dead:false,downed:false,disconnected:false,upgrades:{},talents:{},damageDealt:0,damageHistory:[],kills:0,
    hurtAt:-100,invulnerableUntil:0,ws:{send(data){messages.push(JSON.parse(data));}}};
  const enemy={id:1,type:'brute',x:12.5,y:12.5,hp:200,maxHp:200,attack:100,flash:0};
  const room={phase:'combat',clock:1,hazardStart:0,hazardCycle:-1,overtimeActive:false,stageIndex:0,wave:2,
    players:new Map([['p',p]]),enemies:[enemy],projectiles:[],drops:[],spawnLeft:1,spawnTimer:99,
    snapshotTimer:99,feed:[],machine:{state:'ready',fireAt:0,readyAt:0,triggeredBy:null},
    workOrder:{kind:'machine',target:2,progress:0,failed:false,result:null,processedIds:new Set()}};
  p.room=room;
  p.x=2;p.y=2;assert.equal(activateMachine(room,p),false,'remote operation is rejected');
  p.x=12.5;p.y=8.5;assert.equal(activateMachine(room,p),true);
  assert.equal(room.machine.state,'warning');
  assert.equal(activateMachine(room,p),false,'the warning cannot be restarted');
  room.clock=2.3;updateRoom(room,0);
  assert.equal(enemy.hp,124);
  assert.equal(p.damageDealt,76);
  assert.equal(room.machine.state,'cooldown');
  assert.equal(room.workOrder.progress,1);
  assert.ok(messages.some(m=>m.type==='fx'&&m.kind==='machineShear'));
  assert.equal(activateMachine(room,p),false,'shared machine cooldown is authoritative');
  room.clock=18.1;updateRoom(room,0);
  assert.equal(room.machine.state,'ready');
  assert.equal(activateMachine(room,p),true);
  room.clock=19.4;updateRoom(room,0);
  assert.equal(room.workOrder.progress,1,'the same hostile cannot pay twice');
});

test('held machine control cancels on release or departure and cannot be stolen', () => {
  const p={id:'p',name:'OPERATOR',classId:'vanguard',x:12.5,y:8.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,ws:{send(){}}};
  const q={...p,id:'q',name:'SECOND',ws:{send(){}}};
  const room={phase:'combat',clock:1,hazardStart:0,hazardCycle:-1,overtimeActive:false,stageIndex:0,wave:2,
    players:new Map([['p',p],['q',q]]),enemies:[],projectiles:[],drops:[],spawnLeft:1,spawnTimer:99,
    snapshotTimer:99,feed:[],machine:{state:'ready',fireAt:0,readyAt:0,triggeredBy:null,holderId:null}};
  assert.equal(requestMachineHold(room,p,true),true);
  assert.equal(requestMachineHold(room,q,true),false);
  room.clock=1.4;updateRoom(room,0);
  assert.equal(room.machine.state,'ready');
  assert.equal(requestMachineHold(room,p,false),true);
  room.clock=2;updateRoom(room,0);
  assert.equal(room.machine.state,'ready','release must cancel accumulated hold');
  assert.equal(requestMachineHold(room,p,true),true);
  p.x=2;p.y=2;room.clock=2.7;updateRoom(room,0);
  assert.equal(room.machine.state,'ready','leaving reach cancels authorization');
  p.x=12.5;p.y=8.5;assert.equal(requestMachineHold(room,p,true),true);
  room.clock=3.36;updateRoom(room,0);
  assert.equal(room.machine.state,'warning');
  assert.equal(room.machine.triggeredBy,'p');
});

function encounterWithVariant(wanted){
  for(let seed=1;seed<500;seed++){
    const p={id:'p',name:'OPERATOR',classId:'vanguard',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,upgrades:{},talents:{},ws:{send(){}}};
    const room={phase:'intermission',clock:1,wave:1,runSeed:seed,players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],seq:1};
    startWave(room);
    if(room.layoutId===wanted){room.spawnTimer=999;p.room=room;return {room,p};}
  }
  throw new Error(`No seed selected variant ${wanted}`);
}

test('authored bays offer three easy stations, two circuit stations, or one hard pressure station', () => {
  assert.equal(bayNames.length,7);
  for(const [variant,count,mode] of [[0,3,'valves'],[1,2,'circuit'],[2,1,'pressure'],[3,3,'valves'],[4,2,'circuit'],[5,1,'pressure'],[6,3,'valves']]){
    const {room}=encounterWithVariant(variant);
    assert.equal(room.machines.length,count);
    assert.ok(room.machines.every(m=>m.mode===mode));
    for(const m of room.machines){
      assert.equal(room.grid[Math.floor(m.y)][Math.floor(m.x)],0,'a control must stand on clear floor');
      assert.ok(Math.hypot(m.x-m.targetX,m.y-m.targetY)>m.radius+.35,'operators should stand outside their own strike');
      assert.ok(m.sequence.every(target=>target>=0&&target<({valves:3,circuit:4,pressure:5}[mode])));
    }
    assert.ok(room.grid.flat().includes(2),'the bay has low cover');
    assert.ok(room.grid.flat().includes(3),'the bay has a raised deck');
  }
});

test('recovery docket is seeded, reachable, and clear of worksite hazards in each sector', () => {
  for(const wave of [2,5,8])for(let seed=1;seed<=28;seed++){
    const run=()=>{
      const p={id:'p',name:'OPERATOR',classId:'vanguard',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,
        upgrades:{},talents:{},ws:{send(){}}};
      const room={phase:'intermission',clock:1,wave:wave-1,runSeed:seed,players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],seq:1};
      startWave(room);return room;
    };
    const room=run(),d=room.docket;
    assert.ok(d,`wave ${wave} seed ${seed} must have a docket`);
    assert.deepEqual([d.x,d.y],[run().docket.x,run().docket.y],'same seed must reproduce the site');
    assert.ok(room.grid[Math.floor(d.y)][Math.floor(d.x)]!==1&&room.grid[Math.floor(d.y)][Math.floor(d.x)]!==2);
    assert.ok(room.machines.every(m=>Math.hypot(d.x-m.targetX,d.y-m.targetY)>=m.radius+.85));
    assert.ok(Math.hypot(d.x-room.players.get('p').x,d.y-room.players.get('p').y)>=5);
  }
});

test('recovery requires a continuous exposed hold and pays one shared reroll backstop', () => {
  const {room,p}=encounterWithVariant(0),d=room.docket;
  assert.ok(d);
  room.spawnLeft=1;room.spawnTimer=999;room.snapshotTimer=999;
  assert.equal(requestRecoveryHold(room,p,true),false,'remote pickup is refused');
  p.x=d.x-.2;p.y=d.y;p.a=0;
  const guard={...p,id:'guard',name:'GUARD',x:d.x-.25,encounterMetrics:{dockets:0}};
  room.players.set(guard.id,guard);
  assert.equal(requestRecoveryHold(room,p,true),true);
  assert.equal(requestRecoveryHold(room,guard,true),false,'another crew member cannot steal the hold');
  const shots=room.projectiles.length;fire(room,p,0);assert.equal(room.projectiles.length,shots,'operator cannot fire');
  assert.equal(activateDash(room,p),false,'operator cannot dash');
  updateRoom(room,1.1);assert.equal(d.state,'available');
  assert.equal(requestRecoveryHold(room,p,false),true);
  updateRoom(room,1.5);assert.equal(d.state,'available','release must erase progress');
  assert.equal(requestRecoveryHold(room,p,true),true);
  p.a=Math.PI;updateRoom(room,.1);
  assert.equal(d.holderId,null,'turning away interrupts recovery');
  p.a=0;
  assert.equal(requestRecoveryHold(room,p,true),true);
  updateRoom(room,2.55);
  assert.equal(d.state,'secured');assert.equal(d.securedBy,p.name);
  assert.equal(requestRecoveryHold(room,p,true),false,'docket can only pay once');
  room.salvageEarned=false;room.phase='intermission';chooseOptions(room,p);
  chooseOptions(room,guard);
  assert.equal(p.rerolls,1,'secured docket pays a reroll when kill quota misses');
  assert.equal(guard.rerolls,1,'the entire surviving crew receives the backstop');
  room.salvageEarned=true;chooseOptions(room,p);
  assert.equal(p.rerolls,1,'salvage and recovery never stack above one reroll');
  const late={...guard,id:'late',name:'LATE ARRIVAL',encounterWave:room.wave+1};
  chooseOptions(room,late,true);
  assert.equal(late.rerolls,0,'an intermission arrival cannot claim the previous crew recovery');
  assert.equal(late.augmentPicksRemaining,1,'an intermission arrival receives no prior-encounter bonus');
  const report=buildEncounterReport(room);
  assert.equal(report.docket.secured,true);assert.equal(report.crew[0].dockets,1);
});

test('every named bay admits four separated crew and reachable clear-floor controls', () => {
  for(let variant=0;variant<bayNames.length;variant++){
    const seed=encounterWithVariant(variant).room.runSeed;
    const players=new Map(Array.from({length:4},(_,i)=>[String(i),{id:String(i),name:`CREW ${i}`,classId:'vanguard',
      x:12.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,disconnected:false,
      upgrades:{},talents:{},loadout:['carbine',null],ws:{send(){}}}]));
    const room={phase:'intermission',clock:1,wave:1,runSeed:seed,players,
      enemies:[],projectiles:[],drops:[],feed:[],seq:1};
    startWave(room);
    assert.equal(room.layoutId,variant);
    const crew=[...players.values()];
    for(const p of crew){
      assert.equal(room.grid[Math.floor(p.y)][Math.floor(p.x)],0,`${bayNames[variant]} entry must be open`);
      for(const m of room.machines)assert.ok(Math.hypot(p.x-m.x,p.y-m.y)>.8,'crew entry must clear controls');
    }
    for(let i=0;i<crew.length;i++)for(let j=i+1;j<crew.length;j++)
      assert.ok(Math.hypot(crew[i].x-crew[j].x,crew[i].y-crew[j].y)>=1.35);
  }
});

test('overtime exposes two seeded conditions per sector with declared mechanical costs', () => {
  for(const wave of [2,4,7]){
    const selected=new Set();
    for(let seed=1;seed<=24;seed++){
      const protocol=selectOvertimeProtocol(seed,wave);
      assert.equal(protocol.stage,Math.floor((wave-1)/3));
      assert.equal(selectOvertimeProtocol(seed,wave).id,protocol.id);
      assert.ok(protocol.hazard.length>60&&protocol.reward.includes('extra augment'));
      assert.ok(protocol.cycle>=6&&protocol.warnAt<protocol.activeAt&&protocol.activeAt<protocol.activeEnd);
      selected.add(protocol.id);
    }
    assert.equal(selected.size,2,'each sector must offer distinct vote conditions across seeds');
  }
});

test('Thermal Borer vents after sustained fire and a precision reload removes heat', () => {
  const p={id:'p',name:'CREW',ws:{send(){}},classId:'vanguard',x:12.5,y:12.5,a:0,hp:100,maxHp:100,dead:false,downed:false,
    weapon:'borer',ammo:24,mag:1,slot:0,slotAmmo:[24,0],slotHeat:[0,0],slotVentUntil:[0,0],fireRate:1,damage:1,crit:0,
    upgrades:{},talents:{},grafts:[],lastShot:-100,shots:0,hits:0,kills:0,damageDealt:0,damageHistory:[],leech:0};
  const room={phase:'combat',clock:1,wave:1,stageIndex:0,players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],seq:1,
    hazardStart:1,hazardCycle:-1,spawnLeft:1,spawnTimer:999,snapshotTimer:999};p.room=room;
  for(let i=0;i<9;i++){room.clock=1+i*.13;fire(room,p,0);}
  assert.equal(room.projectiles.length,9);
  assert.equal(p.slotHeat[0],100);
  assert.ok(p.slotVentUntil[0]>room.clock);
  assert.equal(room.projectiles.at(-1).heatHigh,true);
  room.clock+=.13;fire(room,p,0);assert.equal(room.projectiles.length,9,'vent blocks the next trigger');
  room.clock=p.slotVentUntil[0];updateRoom(room,0);
  assert.equal(p.slotHeat[0],35);
  room.clock+=.13;fire(room,p,0);assert.equal(room.projectiles.length,10);
  room.clock+=.2;assert.equal(reload(room,p),true);
  room.clock=p.reloadWindowStart+.01;assert.equal(reload(room,p),true);
  assert.ok(p.slotHeat[0]<=17,'precision reload vents 30 heat');
});

test('machine augments prime three tradeoff shots and protect nearby crew', () => {
  const ws={send(){}},p={id:'p',name:'TECH',ws,classId:'vanguard',x:12.5,y:8.5,a:0,hp:100,maxHp:100,dead:false,downed:false,
    weapon:'carbine',ammo:24,mag:1,slot:0,slotAmmo:[24,0],fireRate:1,damage:1,crit:0,lastShot:-100,shots:0,
    upgrades:{controlSplice:1,serviceWard:1},talents:{},grafts:[],damageDealt:0,damageHistory:[],kills:0,hits:0};
  const q={id:'q',name:'ALLY',ws,classId:'medic',x:13.5,y:8.5,hp:100,maxHp:100,dead:false,downed:false};
  const machine={id:0,state:'ready',x:12.5,y:7.5,targetX:12.5,targetY:12.5,radius:3.2};
  const room={phase:'combat',clock:1,wave:2,stageIndex:0,players:new Map([['p',p],['q',q]]),enemies:[],projectiles:[],drops:[],feed:[],seq:1,
    machine,machines:[machine]};p.room=q.room=room;
  assert.equal(activateMachine(room,p,machine),true);
  assert.equal(p.controlCharges,3);
  assert.equal(q.wardStrength,.75);
  assert.equal(q.wardUntil,5);
  fire(room,p,0);
  assert.equal(p.controlCharges,2);
  assert.equal(room.projectiles[0].pierce,1);
  assert.equal(room.projectiles[0].damage,weapons.carbine.damage*.8);
});

test('banked hit marks a target for a teammate and incident report retains credited actions', () => {
  const p={id:'p',name:'SCOUT',ws:{send(){}},classId:'vanguard',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,downed:false,
    upgrades:{bankSignal:1},talents:{},grafts:[],damageDealt:0,damageHistory:[],kills:0,hits:0,crit:0,
    encounterMetrics:{damage:0,kills:0,skillUses:1,revives:0,healing:0,guardedDamage:0,overclockKills:0,machineCycles:1,staggered:0,bankHits:0,reactions:0,precisionReloads:0}};
  const enemy={id:1,type:'brute',x:13.5,y:12.5,hp:200,maxHp:200};
  const room={phase:'combat',clock:1,encounterStart:0,wave:2,stageIndex:0,players:new Map([['p',p]]),enemies:[enemy],projectiles:[],drops:[],feed:[],seq:2,
    workOrder:{result:'paid'},salvageEarned:true,overtimeActive:false};p.room=room;
  const bolt={side:'player',kind:'carbine',ownerId:'p',shot:{hit:false},x:12.5,y:12.5,h:1.58,vx:38,vy:0,vh:0,
    radius:.09,damage:18,rangeLeft:22,crit:false,pierce:0,bounces:0,bounceCount:1,hitIds:new Set()};
  assert.equal(advanceProjectile(room,bolt,1/60,new Map()),false);
  assert.equal(enemy.markCharges,1);
  assert.ok(enemy.markedUntil>room.clock);
  const report=buildEncounterReport(room);
  assert.equal(report.crew[0].bankHits,1);
  assert.equal(report.crew[0].machineCycles,1);
  assert.equal(report.crew[0].damage,18);
  assert.equal(report.workOrder,'paid');
});

test('valve cascade requires several deliberate inputs and circuit and pressure rejects blind commits', () => {
  const {room,p}=encounterWithVariant(0),m=room.machines[0];
  p.x=m.x;p.y=m.y;
  assert.equal(startMachineSession(room,p),true);
  assert.equal(machineInput(room,p,'commit'),false,'the first contactor must recover');
  for(let step=0;step<3;step++){
    while(m.session.selector!==m.sequence[step]){room.clock+=.11;assert.equal(machineInput(room,p,'select',1),true);}
    room.clock=Math.max(room.clock,m.session.lockAt+.01);
    assert.equal(machineInput(room,p,'commit'),true);
  }
  assert.equal(m.state,'warning');
  assert.ok(room.clock>4.5,'even perfect operation takes several seconds');
  const circuit=encounterWithVariant(1);const c=circuit.room.machines[0];circuit.p.x=c.x;circuit.p.y=c.y;
  assert.equal(startMachineSession(circuit.room,circuit.p),true);
  circuit.room.clock=c.session.lockAt+.01;
  assert.equal(machineInput(circuit.room,circuit.p,'commit'),false,'a circuit requires the correct channel and scan timing');
  const pressure=encounterWithVariant(2);const h=pressure.room.machines[0];pressure.p.x=h.x;pressure.p.y=h.y;
  assert.equal(startMachineSession(pressure.room,pressure.p),true);
  pressure.room.clock=h.session.lockAt+.01;
  assert.equal(machineInput(pressure.room,pressure.p,'commit'),false,'a pressure seal requires a sustained stable match');
  assert.equal(machineInput(pressure.room,pressure.p,'abort'),true);
  assert.equal(h.session,null);
});

test('low walls block low bolts but allow aimed shots above them, while raised decks have a climbable profile', () => {
  const grid=Array.from({length:25},(_,y)=>Array.from({length:25},(_,x)=>x===0||y===0||x===24||y===24?1:0));
  grid[12][13]=2;
  for(let y=15;y<=17;y++)for(let x=10;x<=12;x++)grid[y][x]=3;
  assert.equal(floorHeightAt(grid,10,16),0);
  assert.equal(floorHeightAt(grid,11.5,16.5),.62);
  const player={id:'p',ws:{send(){}},classId:'vanguard',upgrades:{},damageDealt:0,damageHistory:[],hits:0,kills:0,leech:0};
  const room={clock:1,grid,phase:'combat',players:new Map([['p',player]]),enemies:[],projectiles:[],drops:[],seq:1};
  const bolt=h=>({id:1,side:'player',kind:'carbine',ownerId:'p',shot:{hit:false},x:12.6,y:12.5,h,vx:15,vy:0,vh:0,radius:.08,damage:18,rangeLeft:5,crit:false,pierce:0,bounces:0,hitIds:new Set()});
  assert.equal(advanceProjectile(room,bolt(.65),.06,new Map()),false);
  assert.equal(advanceProjectile(room,bolt(1.6),.06,new Map()),true);
});

test('work orders are seeded, pay sector credit, and cap future reinforcement strain', () => {
  assert.equal(selectWorkOrder(42,1),'machine');
  for(let wave=2;wave<=9;wave++){
    assert.equal(selectWorkOrder(42,wave),selectWorkOrder(42,wave));
    assert.ok(workOrders[selectWorkOrder(42,wave)]);
  }
  for(const start of [1,4,7])assert.equal(new Set([start,start+1,start+2].map(w=>selectWorkOrder(42,w))).size,3,'each sector should exercise all three combat decisions');
  const room={clock:60,encounterStart:0,wave:2,players:new Map(),feed:[],workOrder:{kind:'speed',target:55,progress:0,failed:false,result:null},contractCredits:0,contractStrain:1};
  assert.equal(settleWorkOrder(room),false);
  assert.equal(room.contractStrain,2);
  room.workOrder={kind:'intact',target:1,progress:0,failed:true,result:null};
  assert.equal(settleWorkOrder(room),false);
  assert.equal(room.contractStrain,2,'missed orders cannot increase strain beyond two');
  room.workOrder={kind:'machine',target:2,progress:2,failed:false,result:null};
  assert.equal(settleWorkOrder(room),true);
  assert.equal(room.contractCredits,1);assert.equal(room.contractStrain,1);
  room.wave=3;room.workOrder={kind:'speed',target:100,progress:0,failed:false,result:null};
  room.encounterStart=room.clock-99;
  assert.equal(settleWorkOrder(room),true);
  assert.equal(room.contractBonus,true,'two credits at a sector boss pay an extra draft');
  assert.equal(room.contractStrain,0);
});

test('three sectors rotate, each third wave spawns a distinct boss, and stage maps change', () => {
  const clear=(room,e)=>{
    const r=1.15;
    for(let y=Math.floor(e.y-r);y<=Math.floor(e.y+r);y++)for(let x=Math.floor(e.x-r);x<=Math.floor(e.x+r);x++){
      if(room.grid[y]?.[x]!==1&&room.grid[y]?.[x]!==2)continue;
      const nx=Math.max(x,Math.min(x+1,e.x)),ny=Math.max(y,Math.min(y+1,e.y));
      assert.ok(Math.hypot(e.x-nx,e.y-ny)>=r-.001,`${e.type} spawned inside ${x},${y}`);
    }
  };
  const p={id:'p',classId:'vanguard',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,upgrades:{},talents:{},loadout:['carbine',null]};
  const room={wave:2,stageIndex:0,grid:null,phase:'intermission',clock:10,players:new Map([['p',p]]),enemies:[],projectiles:[],drops:[],feed:[],seq:1};
  startWave(room);
  assert.equal(room.wave,3);
  assert.equal(room.enemies[0].type,stages[0].boss);
  assert.equal(room.enemies[0].boss,true);
  clear(room,room.enemies[0]);
  const firstGrid=room.grid;
  startWave(room);
  assert.equal(room.wave,4);
  assert.equal(room.stageIndex,1);
  assert.notEqual(room.grid,firstGrid);
  assert.equal(room.enemies.length,0);
  room.wave=5;startWave(room);
  assert.equal(room.enemies[0].type,stages[1].boss);
  clear(room,room.enemies[0]);
  room.wave=8;startWave(room);
  assert.equal(room.enemies[0].type,stages[2].boss);
  clear(room,room.enemies[0]);
});

test('every wave entry for four crew clears every wall and stays separated', () => {
  const clear=(grid,x,y,r)=>{
    for(let ty=Math.floor(y-r);ty<=Math.floor(y+r);ty++)for(let tx=Math.floor(x-r);tx<=Math.floor(x+r);tx++){
      if(grid[ty]?.[tx]!==1&&grid[ty]?.[tx]!==2)continue;
      const nx=Math.max(tx,Math.min(tx+1,x)),ny=Math.max(ty,Math.min(ty+1,y));
      assert.ok(Math.hypot(x-nx,y-ny)>=r,`entry ${x},${y} intersects wall ${tx},${ty}`);
    }
  };
  for(const seed of [1,2,0xdeadbeef]){
    const players=new Map(Array.from({length:4},(_,i)=>[String(i),{id:String(i),classId:'vanguard',
      x:12.5,y:12.5,hp:100,maxHp:100,dead:false,upgrades:{},talents:{},loadout:['carbine',null]}]));
    const room={wave:0,stageIndex:0,runSeed:seed,phase:'lobby',clock:1,players,
      enemies:[],projectiles:[],drops:[],feed:[],seq:1};
    for(let wave=1;wave<=9;wave++){
      startWave(room);
      assert.equal(room.wave,wave);
      const crew=[...players.values()];
      assert.equal(findSafeCrewSpawns(room.grid,4,room.stageIndex).length,4);
      for(const p of crew){clear(room.grid,p.x,p.y,.43);assert.ok(p.x>1&&p.y>1);}
      for(let i=0;i<crew.length;i++)for(let j=i+1;j<crew.length;j++)
        assert.ok(Math.hypot(crew[i].x-crew[j].x,crew[i].y-crew[j].y)>=1.35);
      room.phase='intermission';
    }
  }
});

test('authored cover variants are reproducible from a run seed while boss layouts stay fixed', () => {
  const make=seed=>{
    const p={id:'p',classId:'vanguard',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,
      upgrades:{},talents:{},loadout:['carbine',null]};
    const room={wave:1,stageIndex:0,runSeed:seed,phase:'intermission',clock:1,players:new Map([['p',p]]),
      enemies:[],projectiles:[],drops:[],feed:[],seq:1};
    startWave(room);return room;
  };
  const first=make(1),repeat=make(1),other=make(2);
  assert.equal(first.layoutId,repeat.layoutId);
  assert.deepEqual(first.grid,repeat.grid);
  assert.equal(first.order.id,repeat.order.id);
  assert.equal(spawnEnemy(first),true);
  assert.equal(spawnEnemy(repeat),true);
  assert.deepEqual(first.enemies.map(e=>[e.type,e.x,e.y]),repeat.enemies.map(e=>[e.type,e.x,e.y]));
  const firstPlayer=[...first.players.values()][0],repeatPlayer=[...repeat.players.values()][0];
  firstPlayer.room=first;repeatPlayer.room=repeat;
  chooseOptions(first,firstPlayer);chooseOptions(repeat,repeatPlayer);
  assert.deepEqual(firstPlayer.choices,repeatPlayer.choices);
  assert.deepEqual(firstPlayer.weaponChoices,repeatPlayer.weaponChoices);
  assert.notEqual(first.layoutId,other.layoutId);
  first.wave=2;startWave(first);
  assert.equal(first.layoutId,0,'boss arenas retain their authored sight lines');
});

test('the ninth-wave clear pays its final Overtime draft before ending the contract', () => {
  const p={id:'p',name:'CREW',ws:{send(){}},classId:'vanguard',weapon:'carbine',x:12.5,y:12.5,
    hp:100,maxHp:100,dead:false,downed:false,disconnected:false,upgrades:{},talents:{},grafts:[],
    loadout:['carbine',null],slot:0,slotAmmo:[24,0],ammo:24,mag:1,damage:1,fireRate:1,speed:1,
    damageHistory:[],reloadEnd:0};
  const room={phase:'combat',clock:1,wave:9,stageIndex:2,runSeed:42,intermissionSeconds:60,
    hazardStart:0,hazardCycle:-1,overtimeActive:true,contractBonus:true,players:new Map([['p',p]]),enemies:[],
    projectiles:[],drops:[],spawnLeft:0,spawnTimer:99,snapshotTimer:99,feed:[],seq:1};
  p.room=room;
  updateRoom(room,0);
  assert.equal(room.phase,'intermission');
  assert.equal(p.augmentPicksRemaining,3,'sector account and Overtime rewards stack');
  assert.equal(p.overtimeVote,'stable','no vote is solicited for a nonexistent tenth encounter');
  room.timer=.1;updateRoom(room,.2);
  assert.equal(room.phase,'victory');
  assert.equal(room.wave,9);
  assert.equal(p.augmentReady,true);
});

test('armory equips a second gun and talent tiers require the prior node', () => {
  const p={classId:'runner',weapon:'smg',slot:0,loadout:['smg',null],slotAmmo:[38,0],mag:1,
    weaponChoices:['rail','launcher','cryo'],armoryReady:false,augmentReady:true,talentReady:false,talents:{},ready:false};
  assert.equal(applyWeapon(p,'rail'),true);
  assert.deepEqual(p.loadout,['smg','rail']);
  assert.equal(p.slotAmmo[1],weapons.rail.mag);
  assert.equal(applyTalent(p,'r_surge'),false);
  assert.equal(applyTalent(p,'r_stride'),true);
  assert.equal(p.talents.r_stride,1);
  assert.equal(p.ready,true);
  p.talentReady=false;
  assert.equal(applyTalent(p,'r_surge'),true);
  assert.ok(talents.runner.some(branch=>branch.nodes[1].id==='r_surge'));
});

test('snipers show a locked windup before their projectile is released', () => {
  const player={id:'p',x:12.5,y:12.5,hp:100,maxHp:100,dead:false,hurtAt:-100,invulnerableUntil:0,ws:{send(){}}};
  const enemy={id:1,type:'sniper',x:12.5,y:7.5,hp:72,maxHp:72,attack:0,flash:0};
  const room={clock:0,phase:'combat',wave:4,stageIndex:1,hazardStart:0,hazardCycle:-1,spawnLeft:1,spawnTimer:99,
    snapshotTimer:99,players:new Map([['p',player]]),enemies:[enemy],projectiles:[],drops:[],feed:[],seq:2};
  updateRoom(room,.1);
  assert.equal(enemy.telegraph.kind,'snipe');
  assert.equal(enemy.telegraph.y,12.5);
  assert.equal(room.projectiles.length,0);
  for(let i=0;i<10;i++)updateRoom(room,.1);
  assert.equal(enemy.telegraph,null);
  assert.ok(room.projectiles.some(b=>b.kind==='sniper'));
});

test('damage reports actual health removed and aggregates critical pellets', () => {
  const enemy={id:1,type:'mite',x:4,y:5,hp:30};
  const room={clock:2,enemies:[enemy],drops:[],seq:2};
  const player={damageDealt:0,damageHistory:[],kills:0,leech:0};
  const entries=new Map();
  dealDamage(room,player,enemy,18,false,entries);
  dealDamage(room,player,enemy,22,true,entries);
  assert.equal(player.damageDealt,30);
  assert.equal(player.kills,1);
  assert.equal(room.enemies.length,0);
  assert.equal(entries.get(1).amount,30);
  assert.equal(entries.get(1).crit,true);
  assert.deepEqual(player.damageHistory.map(hit=>hit.amount),[18,12]);
});

test('four classes share combat, report damage, reload indefinitely, and spawn clear of walls', { timeout: 45000 }, async () => {
  const port = 31000 + Math.floor(Math.random() * 1000);
  const server = spawn(process.execPath, ['server.js'], {
    env: { ...process.env, PORT: String(port) },
    cwd: new URL('..', import.meta.url),
    stdio: ['ignore', 'pipe', 'pipe']
  });
  let serverOutput = '';
  server.stderr.on('data', b => { serverOutput += b.toString(); });
  const clients = [];
  try {
    await Promise.race([
      new Promise((resolve, reject) => {
        server.stdout.on('data', b => { if (b.toString().includes('ready')) resolve(); });
        server.on('exit', code => reject(new Error(`server exited ${code}: ${serverOutput}`)));
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('server did not start')), 5000))
    ]);
    const connect = async () => {
      const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`);
      const messages = [];
      ws.addEventListener('message', e => messages.push(JSON.parse(e.data)));
      await Promise.race([
        new Promise((resolve, reject) => {
          ws.addEventListener('open', resolve, { once: true });
          ws.addEventListener('error', reject, { once: true });
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error(`WebSocket did not connect: ${serverOutput}`)), 5000))
      ]);
      clients.push(ws);
      return { ws, messages, async until(predicate, after = 0, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
          const found = messages.slice(after).find(predicate);
          if (found) return found;
          await new Promise(resolve => setTimeout(resolve, 20));
        }
        const latest=[...messages].reverse().find(m=>m.type==='state');
        const expected=weapons[classes[this.classId]?.weapon]?.mag;
        const full=messages.findIndex((m,i)=>i>=after&&m.type==='state'&&m.players.find(p=>p.id===this.id)?.ammo===expected);
        throw new Error(`message not received for ${this.id}; after ${after}/${messages.length}, full ${full}, expected ${expected}; server exit ${server.exitCode}, stderr ${serverOutput}; latest player: ${JSON.stringify(latest?.players.find(p=>p.id===this.id))}`);
      }};
    };
    const obsolete=await connect();
    obsolete.ws.send(JSON.stringify({type:'join',name:'OLD BUILD',version:'0.9.0'}));
    const mismatch=await obsolete.until(m=>m.type==='error');
    assert.match(mismatch.message,/BUILD MISMATCH/);
    obsolete.ws.close();
    const players = [];
    let roomCode = '';
    for (const [i,classId] of Object.keys(classes).entries()) {
      const client = await connect();
      client.ws.send(JSON.stringify({ type:'join', code:roomCode, name:`OPERATIVE${i+1}`, classId, version:BUILD_VERSION }));
      const welcome = await client.until(m => m.type === 'welcome');
      roomCode = welcome.code;
      players.push({ ...client, id:welcome.id, classId, map:welcome.map, reconnectToken:welcome.reconnectToken });
    }
    const a=players[0];
    const lobby = await a.until(m => m.type === 'state' && m.players.length === 4);
    assert.equal(lobby.phase,'lobby');
    assert.deepEqual(lobby.players.map(p=>p.classId),Object.keys(classes));
    assert.deepEqual(lobby.players.map(p=>p.weapon),Object.values(classes).map(c=>c.weapon));
    assert.ok(lobby.players.every(p=>p.damageDealt===0&&p.dps===0&&p.shots===0&&p.hits===0));
    a.ws.send(JSON.stringify({type:'seed',seed:'24681357'}));
    await a.until(m=>m.type==='state'&&m.seedOverride===24681357);
    a.ws.send(JSON.stringify({type:'start'}));
    const combat = await a.until(m => m.type === 'state' && m.phase === 'combat');
    assert.equal(combat.wave,1);
    const pingStart=players[1].messages.length;
    a.ws.send(JSON.stringify({type:'ping',kind:'danger',x:12.5,y:12.5}));
    const sharedPing=await players[1].until(m=>m.type==='state'&&m.pings?.some(ping=>ping.byId===a.id&&ping.kind==='danger'),pingStart);
    assert.ok(sharedPing.pings.some(ping=>ping.name==='OPERATIVE1'&&ping.remaining>0));
    for (const player of players) {
      const index = player.messages.length;
      player.ws.send(JSON.stringify({type:'skill'}));
      const skill = await player.until(m => m.type === 'skill' && m.id === player.id,index);
      assert.equal(skill.classId,player.classId);
      const active = await player.until(m => m.type === 'state' && m.players.find(p=>p.id===player.id)?.skillCooldown>0,index);
      assert.ok(active.players.find(p=>p.id===player.id).skillCooldown>0);
      const beforeShot = player.messages.length;
      player.ws.send(JSON.stringify({type:'fire',a:combat.players.find(p=>p.id===player.id).a}));
      const fired=await player.until(m => m.type === 'state' && m.players.find(p=>p.id===player.id)?.ammo===weapons[classes[player.classId].weapon].mag-1,beforeShot);
      assert.equal(fired.players.find(p=>p.id===player.id).shots,1);
      const beforeReload = player.messages.length;
      player.ws.send(JSON.stringify({type:'reload'}));
      await player.until(m => m.type === 'state' && m.players.find(p=>p.id===player.id)?.ammo===weapons[classes[player.classId].weapon].mag,beforeReload,6500);
      assert.equal(Object.hasOwn(active.players.find(p=>p.id===player.id),'reserve'),false);
    }
    const reconnecting=players[1];
    const preserved=[...a.messages].reverse().find(m=>m.type==='state').players.find(p=>p.id===reconnecting.id);
    const lostAt=a.messages.length;
    reconnecting.ws.close();
    await a.until(m=>m.type==='state'&&m.players.find(p=>p.id===reconnecting.id)?.disconnected,lostAt);
    const stranger=await connect();
    stranger.ws.send(JSON.stringify({type:'join',code:roomCode,name:'STRANGER',version:BUILD_VERSION}));
    const full=await stranger.until(m=>m.type==='error');
    assert.match(full.message,/ROOM IS FULL/);
    stranger.ws.close();
    const invalid=await connect();
    invalid.ws.send(JSON.stringify({type:'join',code:roomCode,reconnectToken:'wrong-token',version:BUILD_VERSION}));
    const denied=await invalid.until(m=>m.type==='error');
    assert.match(denied.message,/TOKEN INVALID/);
    invalid.ws.close();
    const resumed=await connect();
    resumed.ws.send(JSON.stringify({type:'join',code:roomCode,reconnectToken:reconnecting.reconnectToken,version:BUILD_VERSION}));
    const resumedWelcome=await resumed.until(m=>m.type==='welcome');
    assert.equal(resumedWelcome.id,reconnecting.id);
    assert.equal(resumedWelcome.resumed,true);
    assert.notEqual(resumedWelcome.reconnectToken,reconnecting.reconnectToken);
    const recovered=await resumed.until(m=>m.type==='state'&&m.players.find(p=>p.id===reconnecting.id)?.disconnected===false);
    const restoredPlayer=recovered.players.find(p=>p.id===reconnecting.id);
    assert.equal(restoredPlayer.classId,preserved.classId);
    assert.equal(restoredPlayer.weapon,preserved.weapon);
    assert.equal(restoredPlayer.shots,preserved.shots);
    assert.deepEqual(restoredPlayer.upgrades,preserved.upgrades);
    Object.assign(reconnecting,{ws:resumed.ws,messages:resumed.messages,until:resumed.until,reconnectToken:resumedWelcome.reconnectToken});
    const medic=players.find(p=>p.classId==='medic');
    let damageReport=null,lastShooter=null,lastTarget=null;
    for(let attempt=0;attempt<20&&!damageReport;attempt++){
      const latest=[...medic.messages].reverse().find(m=>m.type==='state'&&m.phase==='combat'&&m.enemies.length);
      if(!latest){await new Promise(resolve=>setTimeout(resolve,150));continue;}
      const shooter=latest.players.find(p=>p.id===medic.id);
      lastShooter=shooter;
      if(shooter.dead)break;
      const target=latest.enemies.filter(e=>{
        const dist=Math.hypot(e.x-shooter.x,e.y-shooter.y);
        if(dist>14)return false;
        for(let step=.15;step<dist;step+=.15){
          const x=shooter.x+(e.x-shooter.x)*step/dist,y=shooter.y+(e.y-shooter.y)*step/dist;
          for(let gy=Math.floor(y-.24);gy<=Math.floor(y+.24);gy++)for(let gx=Math.floor(x-.24);gx<=Math.floor(x+.24);gx++){
            if(!latest.grid[gy]?.[gx])continue;
            const nearX=Math.max(gx,Math.min(gx+1,x)),nearY=Math.max(gy,Math.min(gy+1,y));
            if(Math.hypot(x-nearX,y-nearY)<.24)return false;
          }
        }
        return true;
      }).sort((one,two)=>{
        const slow=e=>['brute','sentinel','gunner','healer','sniper','sapper'].includes(e.type)?0:5;
        return Math.hypot(one.x-shooter.x,one.y-shooter.y)+slow(one)-Math.hypot(two.x-shooter.x,two.y-shooter.y)-slow(two);
      })[0];
      lastTarget=target;
      if(!target){await new Promise(resolve=>setTimeout(resolve,150));continue;}
      const angle=Math.atan2(target.y-shooter.y,target.x-shooter.x),index=medic.messages.length;
      medic.ws.send(JSON.stringify({type:'move',x:shooter.x,y:shooter.y,a:angle}));
      medic.ws.send(JSON.stringify({type:'fire',a:angle,pitch:0}));
      try{damageReport=await medic.until(m=>m.type==='damage'&&m.hits.length>0,index,1150);}catch{}
    }
    assert.ok(damageReport,`expected authoritative damage; shooter=${JSON.stringify(lastShooter)} target=${JSON.stringify(lastTarget)} enemies=${JSON.stringify([...medic.messages].reverse().find(m=>m.type==='state')?.enemies.map(e=>({type:e.type,x:e.x,y:e.y})))} latest=${JSON.stringify([...medic.messages].reverse().find(m=>m.type==='state')?.phase)}`);
    assert.ok(damageReport.hits.every(hit=>hit.amount>0&&Number.isFinite(hit.x)&&Number.isFinite(hit.y)));
    const tracked=await medic.until(m=>m.type==='state'&&m.players.find(p=>p.id===medic.id)?.damageDealt>=damageReport.hits.reduce((sum,hit)=>sum+hit.amount,0));
    assert.ok(tracked.players.find(p=>p.id===medic.id).hits>0);
    await new Promise(resolve=>setTimeout(resolve,3500));
    const states = a.messages.filter(m=>m.type==='state'&&m.phase==='combat');
    assert.ok(states.some(s=>s.enemies.length>=3),'expected several enemy spawns');
    assert.ok(states.some(s=>s.projectiles.some(b=>b.side==='player'&&Number.isFinite(b.h)&&Math.hypot(b.vx,b.vy)>0)),'expected visible player projectiles in shared state');
    for (const s of states) for (const e of s.enemies) {
      const r=enemyStats[e.type].radius;
      for(let ty=Math.floor(e.y-r);ty<=Math.floor(e.y+r);ty++)for(let tx=Math.floor(e.x-r);tx<=Math.floor(e.x+r);tx++){
        if(!s.grid[ty]?.[tx])continue;
        const nx=Math.max(tx,Math.min(tx+1,e.x)),ny=Math.max(ty,Math.min(ty+1,e.y));
        assert.ok(Math.hypot(e.x-nx,e.y-ny)>=r-.001,`${e.type} ${e.id} overlapped wall at ${tx},${ty}`);
      }
    }
  } finally {
    for (const ws of clients) ws.close();
    server.kill();
  }
});
