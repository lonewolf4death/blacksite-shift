import * as T from './vendor/three.module.js';
import { floorHeightAt } from './shared.js';

const mat = (color, extra = {}) => new T.MeshStandardMaterial({ color, roughness: .88, metalness: .22, flatShading: true, ...extra });
function box(group, size, position, material) {
  const mesh = new T.Mesh(new T.BoxGeometry(...size), material);
  mesh.position.set(...position); group.add(mesh); return mesh;
}
function eye(group, x, y, z, color = 0xd6ee55) {
  return box(group,[.12,.08,.025],[x,y,z],mat(color,{emissive:color,emissiveIntensity:2.8,roughness:.3}));
}
function makeLabel(text, color = '#d6ec53') {
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 64;
  const c = canvas.getContext('2d'); c.clearRect(0,0,512,64);
  let labelSize=32;
  c.font = `bold ${labelSize}px "DM Mono", monospace`;
  while(c.measureText(text.toUpperCase()).width>478&&labelSize>18){labelSize-=1;c.font=`bold ${labelSize}px "DM Mono", monospace`;}
  c.textAlign = 'center'; c.fillStyle = color;
  c.shadowColor = '#000'; c.shadowBlur = 8; c.fillText(text.toUpperCase(),256,43);
  const texture = new T.CanvasTexture(canvas);
  const sprite = new T.Sprite(new T.SpriteMaterial({map:texture,transparent:true,depthTest:true}));
  sprite.scale.set(2.6,.33,1); return sprite;
}
function makeDamageNumber(amount,crit,armored=false,marked=false,staggered=false){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=128;
  const c=canvas.getContext('2d');c.clearRect(0,0,256,128);
  c.textAlign='center';c.shadowColor='#000';c.shadowBlur=12;c.lineWidth=7;c.strokeStyle='#111511';
  if(crit||armored||marked||staggered){c.font='bold 26px "DM Mono",monospace';c.fillStyle=staggered?'#ffc98b':crit?'#f4924f':marked?'#f2d58f':'#9ddbe5';c.fillText(staggered?'STAGGER':crit?'CRITICAL':marked?'MARKED':'PLATE',128,30);}
  c.font='900 88px "Barlow Condensed",Impact,sans-serif';c.fillStyle=staggered?'#ffd394':crit?'#ffc16b':marked?'#f8d79b':armored?'#a6dce5':'#e9f67e';
  const label=String(amount);c.strokeText(label,128,105);c.fillText(label,128,105);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;
  const material=new T.SpriteMaterial({map:texture,transparent:true,depthTest:false,depthWrite:false});
  const sprite=new T.Sprite(material);sprite.scale.set(1.25,.625,1);sprite.renderOrder=20;
  return sprite;
}
function healthBar(width = .95) {
  const group = new T.Group();
  box(group,[width,.065,.015],[0,0,0],new T.MeshBasicMaterial({color:0x0a0d0a}));
  const fill = box(group,[width-.04,.035,.025],[0,0,.012],new T.MeshBasicMaterial({color:0xd6ec53}));
  group.userData.fill = fill; group.userData.width = width-.04;
  return group;
}
function makeEnemy(type) {
  const g = new T.Group();
  const boss=['warden','matriarch','overseer'].includes(type);
  const palette={brute:0x79574d,charger:0xb0784b,sniper:0x5b7c90,healer:0x6c9f80,sentinel:0x536265,sapper:0x806050,welder:0x826650,purger:0x527687,warden:0x9a6954,matriarch:0x779ec2,overseer:0x9e6f95};
  const steel = mat(palette[type]||0x566457);
  const dark = mat(0x252d28);
  const armor = mat(type==='brute'?0x966b57:boss?0xb5a69e:0x7d8a72);
  if(type==='mite') {
    const body = new T.Mesh(new T.DodecahedronGeometry(.38,0),steel); body.position.y=.6; body.scale.set(1.15,.75,1.2); g.add(body);
    box(g,[.56,.16,.45],[0,.46,.03],dark);
    for(const side of [-1,1])for(const z of [-.26,.18]){
      const leg=box(g,[.12,.48,.12],[side*.46,.25,z],dark);leg.rotation.z=side*.42;
      box(g,[.12,.12,.2],[side*.58,.045,z+.04],steel);
    }
    box(g,[.53,.13,.09],[0,.64,.39],dark);
    eye(g,-.16,.64,.45);eye(g,.16,.64,.45);
    g.userData.height=1.15;
  } else if(['gunner','sniper','healer','sapper','welder','purger'].includes(type)) {
    box(g,[.2,.55,.2],[-.19,.33,0],dark);box(g,[.2,.55,.2],[.19,.33,0],dark);
    box(g,[.7,.75,.45],[0,1.05,0],steel);
    box(g,[.78,.18,.52],[0,1.36,0],armor);
    box(g,[.42,.35,.37],[0,1.66,.05],dark);
    const visor=type==='sniper'||type==='purger'?0x83d8f5:type==='healer'?0x75d9bd:type==='sapper'||type==='welder'?0xffa777:0xd6ec53;
    box(g,[.43,.095,.035],[0,1.7,.25],mat(visor,{emissive:visor,emissiveIntensity:2.4}));
    box(g,[.18,.56,.18],[-.48,1.02,0],dark);box(g,[.18,.56,.18],[.48,1.02,0],dark);
    const barrel=box(g,[.16,.15,.55],[.48,.82,.35],steel);barrel.rotation.x=-.15;
    eye(g,.48,.82,.65,0xf4a25c);
    if(type==='gunner'){
      box(g,[.31,.12,.52],[.49,1.25,.05],armor);
      box(g,[.22,.16,.13],[.48,.82,.7],mat(0xd9b17a,{emissive:0x7f5638,emissiveIntensity:.5}));
      for(const side of [-1,1])box(g,[.08,.46,.13],[side*.38,1.01,-.27],armor);
    }
    if(type==='sniper'){box(g,[.08,.08,.9],[.48,.82,.85],armor);box(g,[.28,.09,.25],[0,1.92,.13],visor===0x83d8f5?mat(visor,{emissive:visor,emissiveIntensity:1.5}):armor);}
    if(type==='healer'){const halo=new T.Mesh(new T.TorusGeometry(.43,.06,6,16),mat(0x75d9bd,{emissive:0x75d9bd,emissiveIntensity:1.5}));halo.rotation.x=Math.PI/2;halo.position.y=2.01;g.add(halo);}
    if(type==='sapper'){
      box(g,[.48,.53,.27],[0,1.06,-.36],mat(0x3d4240,{metalness:.66}));
      for(const side of [-1,1]){
        const tank=new T.Mesh(new T.CylinderGeometry(.11,.11,.48,8),mat(0x9b644f,{metalness:.57}));tank.position.set(side*.16,1.08,-.59);g.add(tank);
        box(g,[.09,.15,.08],[side*.16,1.23,-.59],mat(0xffa777,{emissive:0xffa777,emissiveIntensity:1.1}));
      }
      box(g,[.3,.18,.37],[.48,.68,.45],mat(0xb88962,{metalness:.5}));
    }
    if(type==='welder'){
      box(g,[.82,.38,.07],[0,.83,.27],mat(0x534634,{metalness:.5}));
      box(g,[.52,.28,.08],[0,1.69,.28],mat(0x191f1d,{metalness:.38}));
      box(g,[.11,.11,.72],[.49,.83,.78],mat(0x343b39,{metalness:.8}));
      const tip=box(g,[.11,.11,.12],[.49,.83,1.16],mat(0xffa266,{emissive:0xff6d40,emissiveIntensity:2.2}));
      g.userData.toolTip=tip;
    }
    if(type==='purger'){
      for(const side of [-1,1]){
        const tank=new T.Mesh(new T.CylinderGeometry(.16,.18,.72,10),mat(0x729aaa,{metalness:.65,roughness:.34}));
        tank.position.set(side*.22,1.02,-.4);g.add(tank);
        box(g,[.19,.08,.19],[side*.22,1.43,-.4],mat(0xb4ecff,{emissive:0x7cd8ff,emissiveIntensity:1.7}));
      }
      const collar=new T.Mesh(new T.TorusGeometry(.52,.065,6,24),mat(0x9fe4ff,{emissive:0x7acdea,emissiveIntensity:1.4}));
      collar.rotation.x=-Math.PI/2;collar.position.y=.84;g.add(collar);
    }
    g.userData.height=2;
  } else if(type==='charger'){
    box(g,[.32,.65,.35],[-.32,.35,0],dark);box(g,[.32,.65,.35],[.32,.35,0],dark);
    box(g,[1.12,.73,.78],[0,1.08,0],steel);box(g,[.56,.33,.47],[0,1.58,.16],armor);
    for(const side of [-1,1]){const horn=box(g,[.18,.18,.6],[side*.53,1.49,.46],armor);horn.rotation.y=side*.3;}
    box(g,[.9,.32,.32],[0,.96,.51],mat(0xb88855,{metalness:.75,roughness:.41}));
    for(const side of [-1,1]){
      const piston=box(g,[.12,.42,.12],[side*.52,.62,-.35],armor);piston.rotation.x=-.3;
      box(g,[.18,.17,.16],[side*.54,.6,-.47],mat(0xef8a54,{emissive:0xab4c31,emissiveIntensity:.7}));
    }
    eye(g,-.18,1.63,.4,0xffaa66);eye(g,.18,1.63,.4,0xffaa66);g.userData.height=2.05;
  } else {
    box(g,[.26,.61,.27],[-.28,.32,0],dark);box(g,[.26,.61,.27],[.28,.32,0],dark);
    box(g,[1.02,1.02,.65],[0,1.22,0],steel);
    box(g,[1.27,.28,.75],[0,1.62,0],armor);
    box(g,[.55,.44,.44],[0,2.01,.07],dark);
    box(g,[.54,.11,.04],[0,2.03,.31],mat(0xf17b4b,{emissive:0xf17b4b,emissiveIntensity:2.5}));
    box(g,[.29,.78,.3],[-.66,1.17,0],armor);box(g,[.29,.78,.3],[.66,1.17,0],armor);
    if(type==='brute'){
      for(const side of [-1,1]){
        box(g,[.4,.35,.43],[side*.66,.62,.24],mat(0x66544a,{metalness:.76,roughness:.49}));
        box(g,[.14,.54,.14],[side*.82,1.33,-.13],dark);
        box(g,[.18,.17,.18],[side*.82,1.6,-.13],mat(0xc3825a,{emissive:0x79452c,emissiveIntensity:.5}));
      }
      box(g,[.72,.15,.16],[0,1.16,.42],mat(0xaf7650,{metalness:.7}));
    }
    if(type==='sentinel'){
      const plate=box(g,[1.3,1.42,.18],[0,1.16,.58],mat(0x577783,{metalness:.8,roughness:.4,emissive:0x4c93a4,emissiveIntensity:.8}));
      box(g,[.92,.08,.2],[0,1.52,.7],mat(0xb5d4d9,{emissive:0x75bac6,emissiveIntensity:1.1}));
      for(const side of [-1,1])box(g,[.1,1.35,.18],[side*.58,1.16,.7],armor);
      g.userData.shieldPlate=plate;
    }
    g.userData.height=2.35;
    if(boss){
      const crown=new T.Mesh(new T.TorusGeometry(.55,.1,5,12),mat(type==='matriarch'?0x83d8f5:0xffae79,{emissive:type==='matriarch'?0x83d8f5:0xffae79,emissiveIntensity:1.5}));
      crown.rotation.x=Math.PI/2;crown.position.y=2.56;g.add(crown);
      const overdriveRing=new T.Mesh(new T.TorusGeometry(.75,.045,5,18),new T.MeshBasicMaterial({color:0xff6b57,transparent:true,opacity:.85,depthWrite:false}));
      overdriveRing.rotation.x=Math.PI/2;overdriveRing.position.y=2.72;overdriveRing.visible=false;g.add(overdriveRing);g.userData.overdriveRing=overdriveRing;
      for(const side of [-1,1])box(g,[.22,.6,.26],[side*.9,1.68,0],armor);
      if(type==='warden')for(const side of [-1,1]){
        box(g,[.26,.84,.34],[side*1.03,1.22,.27],mat(0x8d6648,{metalness:.8}));
        box(g,[.39,.21,.54],[side*1.04,.77,.54],mat(0xd39055,{emissive:0x76361d,emissiveIntensity:.55}));
      }
      if(type==='matriarch')for(const side of [-1,1]){
        box(g,[.19,.9,.36],[side*.83,1.28,-.29],mat(0x81c8dd,{transparent:true,opacity:.72,emissive:0x56a6c2,emissiveIntensity:.7}));
        box(g,[.12,.13,.39],[side*.84,1.85,-.25],mat(0xb3ecf7,{emissive:0x79b9d9,emissiveIntensity:1.3}));
      }
      if(type==='overseer')for(const side of [-1,0,1]){
        const antenna=box(g,[.1,.53,.13],[side*.4,2.55,-.22],mat(0x674f5c,{metalness:.78}));antenna.rotation.z=side*.21;
        box(g,[.15,.1,.16],[side*.45,2.83,-.22],mat(0xe28c91,{emissive:0xca6b80,emissiveIntensity:1.9}));
      }
      g.scale.setScalar(1.18);g.userData.height=2.35;
    }
  }
  const bar=healthBar(boss?1.8:type==='brute'||type==='sentinel'?1.35:.85);
  bar.position.y=g.userData.height+.32;g.add(bar);g.userData.bar=bar;
  const statusRadius=boss?1.2:type==='brute'||type==='sentinel'?.92:.68;
  g.userData.statusRings={};
  for(const [name,index,color] of [['burning',0,0xff9256],['frozen',1,0x8cdbff],['poisoned',2,0x78ddad],['marked',3,0xf8d18d],['stunned',4,0xffc467]]){
    const ring=new T.Mesh(new T.TorusGeometry(statusRadius+index*.105,.027,4,24),new T.MeshBasicMaterial({color,transparent:true,opacity:.72,depthWrite:false}));
    ring.rotation.x=-Math.PI/2;ring.position.y=.047+index*.006;ring.visible=false;g.add(ring);g.userData.statusRings[name]=ring;
  }
  g.traverse(part=>{if(part.isMesh&&part.material?.emissive)part.material.userData.baseGlow=part.material.emissiveIntensity;});
  return g;
}
function makePlayer(name,classId) {
  const colors={vanguard:0x9ca88f,breacher:0xbc855e,runner:0x66ae9d,medic:0x9695ba};
  const g = new T.Group(), suit=mat(colors[classId]||0x9ca88f),dark=mat(0x28342d);
  const hardware=mat(0x56645b,{metalness:.62,roughness:.5}),reflector=mat(0xd9bd70,{emissive:0x8a6d30,emissiveIntensity:.28}),lens=mat(0xb8e1c9,{emissive:0x88b7a4,emissiveIntensity:.65});
  box(g,[.22,.62,.23],[-.19,.35,0],dark);box(g,[.22,.62,.23],[.19,.35,0],dark);
  box(g,[.73,.77,.42],[0,1.12,0],suit);
  box(g,[.44,.41,.4],[0,1.7,.03],dark);
  box(g,[.38,.08,.04],[0,1.74,.25],mat(0xd6ec53,{emissive:0xd6ec53,emissiveIntensity:2}));
  box(g,[.16,.65,.17],[-.44,1.06,0],dark);box(g,[.16,.65,.17],[.44,1.06,0],dark);
  // Every suit carries the same maintenance kit; class silhouettes remain readable through the armor.
  for(const side of [-1,1]){
    box(g,[.1,.56,.055],[side*.26,1.13,.245],dark);
    box(g,[.13,.07,.075],[side*.4,1.28,.09],reflector);
    box(g,[.2,.21,.15],[side*.29,.78,-.04],hardware);
    box(g,[.23,.13,.29],[side*.19,.11,.005],hardware);
  }
  box(g,[.57,.1,.08],[0,.85,.235],dark);
  box(g,[.24,.13,.04],[0,1.28,.245],reflector);
  box(g,[.56,.6,.18],[0,1.13,-.35],hardware); // air filter and tool battery
  box(g,[.44,.08,.2],[0,1.47,-.36],dark);
  for(const side of [-1,1]){
    const cartridge=new T.Mesh(new T.CylinderGeometry(.09,.09,.42,8),hardware);
    cartridge.position.set(side*.19,1.08,-.49);g.add(cartridge);
  }
  box(g,[.15,.22,.1],[.39,1.64,-.12],hardware); // shoulder radio
  box(g,[.025,.34,.025],[.39,1.93,-.12],dark);
  box(g,[.08,.045,.04],[-.19,1.83,.23],lens); // helmet task lamp
  if(classId==='vanguard'){
    for(const side of [-1,1])box(g,[.28,.2,.3],[side*.43,1.42,-.01],hardware);
  }else if(classId==='breacher'){
    box(g,[.36,.18,.13],[0,1.12,.28],hardware);
    box(g,[.1,.31,.1],[-.51,.95,.02],reflector);
  }else if(classId==='runner'){
    for(const side of [-1,1])box(g,[.09,.35,.1],[side*.4,.81,-.13],suit);
  }else if(classId==='medic'){
    for(const side of [-1,1])box(g,[.11,.28,.08],[side*.4,1.05,-.15],lens);
  }
  const arc=new T.Group(),kinetic=new T.Group(),reclaimer=new T.Group(),phase=new T.Group(),siphon=new T.Group();
  const arcMat=mat(0x83d8f5,{emissive:0x49aee6,emissiveIntensity:2});
  for(const side of [-1,1]){box(arc,[.09,.72,.11],[side*.29,1.16,-.28],arcMat);box(arc,[.14,.12,.2],[side*.29,1.55,-.28],arcMat);}
  const kineticMat=mat(0xffad72,{emissive:0xf07535,emissiveIntensity:1.5});
  for(const side of [-1,1]){const cuff=new T.Mesh(new T.TorusGeometry(.19,.055,5,16),kineticMat);cuff.rotation.x=Math.PI/2;cuff.position.set(side*.19,.42,0);kinetic.add(cuff);}
  const core=new T.Mesh(new T.OctahedronGeometry(.21,0),mat(0xa7ef9b,{emissive:0x6bda83,emissiveIntensity:2}));core.position.set(0,1.22,.27);reclaimer.add(core);
  const phaseMat=mat(0xc9a8ff,{emissive:0x9067dd,emissiveIntensity:1.9});
  for(const side of [-1,1]){box(phase,[.13,.35,.18],[side*.52,1.2,-.03],phaseMat);box(phase,[.13,.13,.4],[side*.52,1.34,.15],phaseMat);}
  const siphonMat=mat(0xf4d68a,{emissive:0xf4b957,emissiveIntensity:1.8});
  for(const y of [1.48,1.6]){const halo=new T.Mesh(new T.TorusGeometry(.4,.045,5,20),siphonMat);halo.rotation.x=Math.PI/2;halo.position.set(0,y,-.17);siphon.add(halo);}
  for(const [id,part] of [['arcSpine',arc],['kineticRig',kinetic],['reclaimerCore',reclaimer],['phaseCoupler',phase],['siphonHalo',siphon]]){part.visible=false;g.add(part);(g.userData.graftMeshes||={})[id]=part;}
  const label=makeLabel(name);label.position.y=2.3;g.add(label);
  const rescueRing=new T.Mesh(new T.TorusGeometry(.77,.05,4,32),new T.MeshBasicMaterial({color:0xff6a58,transparent:true,opacity:.85,depthWrite:false}));
  rescueRing.rotation.x=-Math.PI/2;rescueRing.position.y=.09;rescueRing.visible=false;g.add(rescueRing);g.userData.rescueRing=rescueRing;
  return g;
}
function makePickup(kind) {
  const g=new T.Group(), color=kind==='med'?0xd6ec53:0xf4924f;
  const mesh=new T.Mesh(new T.OctahedronGeometry(.28),mat(color,{emissive:color,emissiveIntensity:1.5,metalness:.35}));
  mesh.position.y=.48;g.add(mesh);
  const ring=new T.Mesh(new T.TorusGeometry(.4,.018,4,20),new T.MeshBasicMaterial({color,transparent:true,opacity:.5}));
  ring.rotation.x=Math.PI/2;ring.position.y=.05;g.add(ring);
  g.userData.mesh=mesh;return g;
}
function makeDocket(){
  const g=new T.Group(),steel=mat(0x343b32,{metalness:.78,roughness:.58}),tag=mat(0xd3a958,{metalness:.35,roughness:.5}),lamp=mat(0xf5ce76,{emissive:0xe8aa46,emissiveIntensity:1.35});
  box(g,[.86,.42,.54],[0,.29,0],steel);
  box(g,[.73,.045,.44],[0,.53,0],tag);
  box(g,[.47,.1,.04],[0,.38,-.29],tag);
  for(const x of [-.34,.34])box(g,[.06,.12,.6],[x,.49,0],steel);
  const beacon=new T.Mesh(new T.CylinderGeometry(.075,.095,.16,8),lamp);beacon.position.set(0,.67,0);g.add(beacon);
  const ring=new T.Mesh(new T.TorusGeometry(.64,.027,5,32),new T.MeshBasicMaterial({color:0xeac26f,transparent:true,opacity:.72,depthWrite:false}));
  ring.rotation.x=Math.PI/2;ring.position.y=.045;g.add(ring);
  g.userData.beacon=beacon;g.userData.ring=ring;return g;
}
function weaponModel(kind) {
  const metals={pulse:0x7775a4,smg:0x416e62,rail:0x78766e,launcher:0x8a5543,arcgun:0x3e7183,cryo:0x547e95,saw:0x777253,burst:0x596742,harpoon:0x75654c,gravity:0x425f79,borer:0x74634b};
  const accents={pulse:0xb9aef1,smg:0x75d9bd,rail:0xffe4a6,launcher:0xff9359,arcgun:0x83d8f5,cryo:0xa5ecff,saw:0xe8d599,burst:0xe0f17b,harpoon:0xf0c58c,gravity:0x91c7ff,borer:0xffaa63};
  const g=new T.Group(), metal=mat(metals[kind]||0x536357,{metalness:.7,roughness:.4}),dark=mat(0x202a23),accent=mat(accents[kind]||0xb9c5a1,{metalness:.55,roughness:.3,emissive:accents[kind]||0x000000,emissiveIntensity:accents[kind]?.45:0});
  if(kind==='scatter'){
    box(g,[.28,.2,.72],[0,-.04,-.2],metal);
    box(g,[.18,.14,.48],[0,.08,-.63],dark);
    box(g,[.18,.08,.47],[0,.16,-.6],accent);
    box(g,[.23,.31,.22],[0,-.25,.06],dark);
    box(g,[.48,.16,.27],[0,-.02,.1],dark);
    box(g,[.07,.1,.08],[0,.21,-.38],accent);
  } else if(kind==='smg'){
    box(g,[.25,.2,.52],[0,-.03,-.13],metal);
    box(g,[.11,.13,.48],[0,.02,-.54],dark);
    box(g,[.095,.07,.15],[0,.02,-.83],accent);
    box(g,[.17,.42,.13],[0,-.34,-.03],dark);
    box(g,[.38,.14,.22],[0,-.06,.13],dark);
    box(g,[.08,.06,.34],[0,.15,-.32],accent);
  } else if(kind==='pulse'){
    box(g,[.31,.24,.82],[0,-.02,-.18],metal);
    box(g,[.17,.16,.68],[0,.04,-.68],dark);
    box(g,[.19,.19,.19],[0,.04,-1.04],accent);
    box(g,[.22,.37,.18],[0,-.33,.04],dark);
    box(g,[.47,.14,.3],[0,-.06,.17],dark);
    for(const side of [-1,1])box(g,[.06,.07,.5],[side*.17,.12,-.49],accent);
    box(g,[.15,.1,.16],[0,.22,-.2],accent);
  } else if(kind==='borer'){
    box(g,[.34,.29,.82],[0,-.03,-.2],metal);box(g,[.22,.2,.7],[0,.03,-.69],dark);
    box(g,[.2,.19,.14],[0,.04,-1.1],accent);box(g,[.19,.39,.2],[0,-.34,.04],dark);
    for(const side of [-1,1]){box(g,[.07,.16,.62],[side*.22,.11,-.48],metal);box(g,[.035,.08,.48],[side*.27,.17,-.48],accent);}
    box(g,[.25,.07,.21],[0,.26,-.17],accent);
  } else if(kind==='launcher'){
    box(g,[.42,.37,.68],[0,-.03,-.23],metal);box(g,[.31,.3,.65],[0,.01,-.76],dark);box(g,[.3,.29,.09],[0,.01,-1.13],accent);
    box(g,[.2,.37,.18],[0,-.39,.05],dark);box(g,[.44,.12,.31],[0,.2,-.1],accent);
  } else if(kind==='rail'){
    box(g,[.26,.21,1.03],[0,-.02,-.28],metal);box(g,[.1,.13,.9],[0,.08,-.9],accent);box(g,[.2,.33,.2],[0,-.33,.03],dark);
    for(const side of [-1,1])box(g,[.09,.09,.95],[side*.19,.09,-.57],dark);
    box(g,[.12,.12,.32],[0,.24,-.26],accent);
  } else if(kind==='arcgun'||kind==='cryo'){
    box(g,[.28,.24,.81],[0,-.02,-.2],metal);box(g,[.18,.18,.6],[0,.03,-.66],dark);box(g,[.25,.16,.19],[0,.04,-1.03],accent);
    box(g,[.17,.37,.18],[0,-.34,.04],dark);for(const side of [-1,1])box(g,[.055,.1,.64],[side*.18,.13,-.48],accent);
  } else if(kind==='saw'){
    box(g,[.32,.22,.68],[0,-.02,-.23],metal);box(g,[.23,.2,.36],[0,.03,-.71],dark);box(g,[.18,.11,.14],[0,.05,-1.01],accent);
    box(g,[.18,.35,.16],[0,-.33,.05],dark);box(g,[.4,.08,.37],[0,.2,-.45],accent);
  } else if(kind==='harpoon'){
    box(g,[.39,.26,.76],[0,-.04,-.19],metal);box(g,[.14,.13,.78],[0,.05,-.72],dark);
    box(g,[.09,.09,.68],[0,.08,-.86],accent);box(g,[.23,.33,.18],[0,-.32,.07],dark);
    for(const side of [-1,1])box(g,[.1,.14,.74],[side*.24,.06,-.48],metal);
    box(g,[.26,.13,.24],[0,.23,-.22],accent);
  } else if(kind==='gravity'){
    box(g,[.44,.35,.64],[0,-.05,-.19],metal);box(g,[.34,.31,.53],[0,.03,-.66],dark);
    box(g,[.3,.16,.14],[0,.05,-1],accent);box(g,[.21,.36,.2],[0,-.36,.08],dark);
    for(const side of [-1,1])box(g,[.08,.29,.49],[side*.25,.07,-.51],accent);
    const core=new T.Mesh(new T.IcosahedronGeometry(.16,0),accent);core.position.set(0,.25,-.3);g.add(core);
  } else {
    box(g,[.24,.24,.85],[0,-.03,-.15],metal);
    box(g,[.1,.12,.66],[0,.04,-.72],dark);
    box(g,[.08,.08,.22],[0,.04,-1.06],accent);
    box(g,[.2,.35,.19],[0,-.31,.1],dark);
    box(g,[.4,.14,.28],[0,-.06,.18],dark);
    box(g,[.065,.1,.06],[0,.19,-.56],accent);
    box(g,[.1,.045,.06],[0,.21,.02],accent);
  }
  // The operating part makes each receiver visibly cycle with its own recoil.
  const actions={scatter:[.27,.12,.37,0,-.16,-.58],smg:[.16,.055,.27,0,.14,-.27],
    carbine:[.2,.07,.31,0,.16,-.39],burst:[.2,.07,.3,0,.17,-.36],pulse:[.15,.095,.32,0,.15,-.5],
    rail:[.13,.09,.66,0,.16,-.58],launcher:[.26,.11,.28,0,.2,-.21],arcgun:[.17,.09,.39,0,.17,-.44],
    cryo:[.17,.09,.39,0,.17,-.44],saw:[.19,.08,.25,0,.2,-.45],harpoon:[.17,.1,.46,0,.2,-.48],gravity:[.25,.1,.28,0,.22,-.25],borer:[.2,.11,.4,0,.2,-.5]};
  const [aw,ah,al,ax,ay,az]=actions[kind]||actions.carbine;
  const litAction=['pulse','arcgun','cryo','gravity'].includes(kind);
  const action=box(g,[aw,ah,al],[ax,ay,az],litAction?accent:metal);
  g.userData.action=action;g.userData.actionRest=az;g.userData.actionTravel=kind==='scatter'?.27:kind==='rail'||kind==='harpoon'?.2:kind==='smg'?.1:.15;
  if(['launcher','gravity','harpoon','saw'].includes(kind)){
    const rotor=new T.Mesh(new T.TorusGeometry(kind==='saw'?.21:.16,.055,5,12),kind==='gravity'||kind==='saw'?accent:metal);
    rotor.position.set(kind==='saw'?0:.27,kind==='saw'?.09:.05,kind==='saw'?-1.04:-.3);
    rotor.rotation.y=kind==='saw'?0:Math.PI/2;g.add(rotor);g.userData.rotor=rotor;
  }
  if(['arcgun','cryo','pulse','gravity','borer'].includes(kind))g.userData.coil=accent;
  // Give each chassis an immediate shot signature without persistent lights or particles.
  const flashColors={scatter:0xffb77a,smg:0x9af3cf,pulse:0xc5baff,rail:0xfff0cc,launcher:0xffa06b,arcgun:0x9eeaff,cryo:0xc4f5ff,saw:0xf2dfac,harpoon:0xffd49c,gravity:0xb0cfff,borer:0xffb677};
  const heavyFlash=kind==='launcher'||kind==='gravity',wideFlash=kind==='scatter',slimFlash=kind==='rail'||kind==='harpoon';
  const flash=new T.Mesh(new T.ConeGeometry(wideFlash?.23:slimFlash?.09:heavyFlash?.19:.14,slimFlash?.64:heavyFlash?.38:.48,6),new T.MeshBasicMaterial({color:flashColors[kind]||0xffe39a,transparent:true,opacity:.86,depthWrite:false}));
  flash.rotation.x=-Math.PI/2;flash.position.set(0,.04,kind==='scatter'?-1.03:kind==='smg'?-1.01:-1.24);flash.visible=false;g.add(flash);
  g.userData.flash=flash;g.userData.spin=0;return g;
}
function makeProjectile(kind,charged=false,phase=false,heatHigh=false){
  const colors={carbine:0xd6ec53,scatter:0xffbd77,smg:0x73ddba,pulse:0xbbacff,rail:0xfff0ae,launcher:0xff8c56,arcgun:0x83d8f5,cryo:0x9de9ff,saw:0xe7d89c,burst:0xddf06e,harpoon:0xf0c58c,gravity:0x91c7ff,borer:0xffa66c,fragment:0xffbb79,enemy:0xff855f,sniper:0xff5570,boss:0xff5374};
  const size=kind==='pulse'||kind==='launcher'||kind==='gravity'?.18:kind==='boss'?.2:kind==='saw'||kind==='harpoon'?.16:kind==='enemy'||kind==='sniper'?.12:kind==='scatter'?.10:kind==='smg'?.08:.095;
  const color=phase?0xd8b9ff:charged?0xa5efff:heatHigh?0xffd082:colors[kind]||0xffffff,g=new T.Group();
  const solid=new T.MeshBasicMaterial({color}),glow=new T.MeshBasicMaterial({color,transparent:true,opacity:.42,depthWrite:false});
  if(kind==='saw'){
    const disc=new T.Mesh(new T.CylinderGeometry(.22,.22,.045,12),solid);disc.rotation.x=Math.PI/2;g.add(disc);
    const rim=new T.Mesh(new T.TorusGeometry(.23,.035,4,12),glow);g.add(rim);
  }else if(kind==='harpoon'){
    const shaft=new T.Mesh(new T.BoxGeometry(.075,.075,.52),solid);shaft.position.z=.08;g.add(shaft);
    const tip=new T.Mesh(new T.ConeGeometry(.13,.3,4),solid);tip.rotation.x=-Math.PI/2;tip.position.z=-.29;g.add(tip);
  }else if(kind==='rail'){
    const slug=new T.Mesh(new T.BoxGeometry(.1,.1,.62),solid);g.add(slug);
    const sheath=new T.Mesh(new T.BoxGeometry(.17,.17,.72),glow);g.add(sheath);
  }else if(kind==='gravity'){
    const core=new T.Mesh(new T.IcosahedronGeometry(size,1),solid);g.add(core);
    for(const y of [-.13,.13]){const ring=new T.Mesh(new T.TorusGeometry(.2,.025,4,16),glow);ring.rotation.x=Math.PI/2;ring.position.y=y;g.add(ring);}
  }else if(kind==='launcher'){
    const shell=new T.Mesh(new T.CylinderGeometry(.11,.14,.36,8),solid);shell.rotation.x=Math.PI/2;g.add(shell);
    const cap=new T.Mesh(new T.ConeGeometry(.11,.18,8),glow);cap.rotation.x=-Math.PI/2;cap.position.z=-.23;g.add(cap);
  }else{
    const core=new T.Mesh(new T.IcosahedronGeometry(size,1),solid);g.add(core);
  }
  const trailLength=kind==='rail'?.9:kind==='pulse'?.64:kind==='smg'||kind==='scatter'?.22:kind==='enemy'||kind==='sniper'?.42:.38;
  const tail=new T.Mesh(new T.ConeGeometry(size*.7,trailLength,6),glow);
  tail.rotation.x=Math.PI/2;tail.position.z=trailLength*.47;g.add(tail);
  return g;
}
function setProjectileVisibility(obj,scale){
  if(obj.userData.visibilityScale===scale)return;
  obj.userData.visibilityScale=scale;
  obj.traverse(part=>{
    if(!part.isMesh)return;
    const material=part.material;
    material.userData.baseOpacity??=material.opacity;
    material.transparent=scale<1||material.userData.baseOpacity<1;
    material.opacity=material.userData.baseOpacity*scale;
    material.needsUpdate=true;
  });
}
function floorTexture(stageIndex=0) {
  const canvas=document.createElement('canvas');canvas.width=128;canvas.height=128;
  const c=canvas.getContext('2d'),bases=['#45443d','#374a50','#493e42'];
  c.fillStyle=bases[stageIndex]||bases[0];c.fillRect(0,0,128,128);
  let seed=0x9e3779b9+stageIndex*1741;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  for(let i=0;i<600;i++){
    const v=Math.floor(47+random()*45),alpha=random()*.19;
    c.fillStyle=stageIndex===1?`rgba(${v},${v+18},${v+27},${alpha})`:stageIndex===2?`rgba(${v+18},${v+3},${v+4},${alpha})`:`rgba(${v+7},${v+5},${v},${alpha})`;
    c.fillRect(random()*128,random()*128,random()*7+1,random()*3+1);
  }
  c.strokeStyle=stageIndex===1?'#253a43':stageIndex===2?'#342a2e':'#2e3029';c.lineWidth=3;c.strokeRect(2,2,124,124);
  c.strokeStyle=stageIndex===1?'#668a94':stageIndex===2?'#8b6668':'#7a796b';c.lineWidth=1;c.strokeRect(7,7,114,114);
  for(const [x,y] of [[10,10],[118,10],[10,118],[118,118]]){c.fillStyle='#171b1b';c.fillRect(x-2,y-2,4,4);}
  if(stageIndex===0){
    c.strokeStyle='#6e5640';c.lineWidth=2;
    for(const x of [25,64,103]){c.beginPath();c.moveTo(x-10,0);c.lineTo(x+18,128);c.stroke();}
    c.fillStyle='#8d643d';for(const x of [35,93]){c.fillRect(x,34,5,5);c.fillRect(x,91,5,5);}
  }else if(stageIndex===1){
    c.strokeStyle='rgba(178,217,226,.35)';c.lineWidth=1;
    for(let i=0;i<7;i++){const x=random()*128,y=random()*128;c.beginPath();c.moveTo(x,y);c.lineTo(x+11,y-13);c.lineTo(x+19,y-9);c.stroke();}
    c.fillStyle='rgba(191,228,239,.08)';for(let i=0;i<9;i++){const x=random()*128,y=random()*128;c.fillRect(x,y,random()*22+5,2);}
  }else{
    c.strokeStyle='rgba(195,121,101,.36)';c.lineWidth=2;
    for(const y of [30,64,98]){c.beginPath();c.moveTo(8,y);c.lineTo(35,y);c.lineTo(43,y+8);c.lineTo(84,y+8);c.lineTo(93,y);c.lineTo(120,y);c.stroke();}
    for(const x of [42,85]){c.fillStyle='#aa665c';c.fillRect(x-3,66,6,6);}
  }
  const t=new T.CanvasTexture(canvas);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(25,25);t.colorSpace=T.SRGBColorSpace;return t;
}

export class GameScene {
  constructor(canvas,settings){
    this.canvas=canvas;this.settings=settings;
    this.renderer=new T.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});
    this.renderer.outputColorSpace=T.SRGBColorSpace;
    this.renderer.toneMapping=T.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure=1.28;
    this.scene=new T.Scene();this.scene.background=new T.Color(0x0b1410);this.scene.fog=new T.FogExp2(0x0c1711,.042);
    this.camera=new T.PerspectiveCamera(settings.fov,1,.05,65);
    this.camera.rotation.order='YXZ';this.scene.add(this.camera);
    const gunLight=new T.PointLight(0xe9f2d3,.85,2.2);gunLight.position.set(.3,.15,-.45);this.camera.add(gunLight);
    this.scene.add(new T.HemisphereLight(0xb5c2b0,0x141b17,1.25));
    const sun=new T.DirectionalLight(0xb8c8a1,.9);sun.position.set(4,9,8);this.scene.add(sun);
    this.world=new T.Group();this.scene.add(this.world);
    this.entities=new Map();this.drops=new Map();this.projectiles=new Map();this.hazards=new Map();this.telegraphs=new Map();this.pings=new Map();this.docketObj=null;this.predicted=[];this.skillRings=[];this.damageNumbers=[];this.impacts=[];
    this.machineZone=new T.Group();
    const machineRing=new T.Mesh(new T.TorusGeometry(3.2,.085,5,64),new T.MeshBasicMaterial({color:0xff785b,transparent:true,opacity:.8,depthWrite:false,depthTest:false}));
    machineRing.rotation.x=-Math.PI/2;machineRing.position.y=.1;this.machineZone.add(machineRing);
    const machineDisc=new T.Mesh(new T.CircleGeometry(3.2,64),new T.MeshBasicMaterial({color:0xff785b,transparent:true,opacity:.12,depthWrite:false,depthTest:false,side:T.DoubleSide}));
    machineDisc.rotation.x=-Math.PI/2;machineDisc.position.y=.065;this.machineZone.add(machineDisc);
    this.machineZone.userData.ring=machineRing;this.machineZone.userData.disc=machineDisc;
    this.machineZone.position.set(12.5,0,12.5);this.machineZone.visible=false;this.scene.add(this.machineZone);
    this.gun=null;this.weapon='';this.setWeapon('carbine');this.resize();
  }
  resize(){
    const scale=Math.min(window.devicePixelRatio||1,1.5)*this.settings.quality/100;
    this.renderer.setPixelRatio(Math.max(.5,scale));this.renderer.setSize(window.innerWidth,window.innerHeight,false);
    this.camera.aspect=window.innerWidth/window.innerHeight;this.camera.updateProjectionMatrix();
  }
  buildWorld(map,stageIndex=0,stations=[]){
    this.gridMap=map;
    this.disposeGroup(this.world);
    for(const zone of this.extraMachineZones||[]){this.scene.remove(zone);this.disposeGroup(zone);}this.extraMachineZones=[];
    this.stageLights=[];this.ventLamps=[];this.sectorPulseMaterials=[];
    for(const h of this.hazards.values()){this.scene.remove(h);this.disposeGroup(h);}this.hazards.clear();
    for(const h of this.telegraphs.values()){this.scene.remove(h);this.disposeGroup(h);}this.telegraphs.clear();
    const themes=[{floor:0x858f7e,wall:[0x59665b,0x495b50,0x665e51,0x394f43],accent:0xd6ec53,light:0xc58b52,fog:0x0b1410},
      {floor:0x637c85,wall:[0x526c77,0x3d5362,0x657a83,0x345765],accent:0x83d8f5,light:0x71acd1,fog:0x0b1720},
      {floor:0x806e66,wall:[0x695250,0x60444a,0x775f57,0x49363d],accent:0xef8d6a,light:0xd26b53,fog:0x1f1114}];
    const theme=themes[stageIndex]||themes[0];
    this.scene.background=new T.Color(theme.fog);this.scene.fog=new T.FogExp2(theme.fog,.042);
    const floor=new T.Mesh(new T.PlaneGeometry(25,25),mat(theme.floor,{map:floorTexture(stageIndex),metalness:.18,roughness:1}));
    floor.rotation.x=-Math.PI/2;floor.position.set(12.5,0,12.5);this.world.add(floor);
    const ceiling=new T.Mesh(new T.PlaneGeometry(25,25),mat(stageIndex===1?0x142530:stageIndex===2?0x2b1b1d:0x1a261f,{side:T.DoubleSide}));
    ceiling.rotation.x=Math.PI/2;ceiling.position.set(12.5,3.18,12.5);this.world.add(ceiling);
    const grid=new T.GridHelper(25,25,0x778974,0x4c5c4c);grid.position.set(12.5,.012,12.5);grid.material.transparent=true;grid.material.opacity=.28;this.world.add(grid);
    const wallGeom=new T.BoxGeometry(1,3.18,1),lowGeom=new T.BoxGeometry(1,1.08,1),trimGeom=new T.BoxGeometry(1.02,.08,1.02);
    const variants=theme.wall.map(color=>mat(color)),panelMat=mat(0x202a27,{metalness:.72,roughness:.65}),rustMat=mat(stageIndex===1?0x51707a:0x674738,{metalness:.48,roughness:.96});
    for(let z=0;z<map.length;z++)for(let x=0;x<map[z].length;x++)if(map[z][x]===1||map[z][x]===2){
      if(map[z][x]===2){
        const low=new T.Mesh(lowGeom,mat(stageIndex===1?0x566c6e:stageIndex===2?0x695452:0x625d4b,{metalness:.58,roughness:.66}));low.position.set(x+.5,.54,z+.5);this.world.add(low);
        box(this.world,[1.03,.09,1.03],[x+.5,1.08,z+.5],mat(0xb59769,{metalness:.65}));
        for(const edge of [-.34,.34])box(this.world,[.1,.48,.025],[x+.5+edge,.58,z+1.013],rustMat);
        continue;
      }
      const wall=new T.Mesh(wallGeom,variants[(x*13+z*7)%variants.length]);wall.position.set(x+.5,1.59,z+.5);this.world.add(wall);
      const trim=new T.Mesh(trimGeom,mat(0x29372e));trim.position.set(x+.5,.18,z+.5);this.world.add(trim);
      if((x*5+z*7)%11===0){
        const stripe=box(this.world,[.78,.05,.014],[x+.5,2.45,z+1.01],mat(theme.accent,{emissive:theme.accent,emissiveIntensity:.55}));
        stripe.renderOrder=1;
      }
      if((x*7+z*11)%19===0&&map[z+1]?.[x]===0){
        box(this.world,[.72,1.7,.028],[x+.5,1.55,z+1.015],panelMat);
        box(this.world,[.56,.09,.035],[x+.5,2.18,z+1.034],rustMat);
        for(const side of [-1,1])box(this.world,[.065,1.52,.038],[x+.5+side*.3,1.55,z+1.038],rustMat);
      }
      if((x*13+z*3)%23===0&&map[z]?.[x+1]===0){
        box(this.world,[.025,1.3,.62],[x+1.014,1.54,z+.5],panelMat);
        box(this.world,[.035,.08,.52],[x+1.033,1.96,z+.5],mat(theme.accent,{emissive:theme.accent,emissiveIntensity:.3}));
      }
    }
    const deckMat=mat(stageIndex===1?0x7396a0:stageIndex===2?0x947d73:0x8d846b,{metalness:.45,roughness:.72,side:T.DoubleSide});
    for(let z=1;z<24;z++)for(let x=1;x<24;x++)if(map[z][x]===3){
      const geometry=new T.PlaneGeometry(1,1,4,4),positions=geometry.attributes.position;
      for(let i=0;i<positions.count;i++){
        const wx=x+.5+positions.getX(i),wz=z+.5-positions.getY(i);
        positions.setZ(i,floorHeightAt(map,wx,wz)+.018);
      }
      geometry.computeVertexNormals();
      const deck=new T.Mesh(geometry,deckMat);deck.rotation.x=-Math.PI/2;deck.position.set(x+.5,0,z+.5);this.world.add(deck);
      const stripe=box(this.world,[.72,.012,.08],[x+.5,floorHeightAt(map,x+.5,z+.5)+.028,z+.5],mat(0xd3b26f,{metalness:.35,roughness:.8}));stripe.rotation.y=(x+z)%2?.55:-.55;
    }
    const pipeMat=mat(0x384b40,{metalness:.68});
    for(const z of [3.5,12.5,21.5]){
      const pipe=new T.Mesh(new T.CylinderGeometry(.07,.07,22,6),pipeMat);pipe.rotation.z=Math.PI/2;pipe.position.set(12.5,2.96,z);this.world.add(pipe);
    }
    for(const x of [3.5,12.5,21.5]){
      const pipe=new T.Mesh(new T.CylinderGeometry(.06,.06,22,6),pipeMat);pipe.rotation.x=Math.PI/2;pipe.position.set(x,2.93,12.5);this.world.add(pipe);
    }
    for(const [x,z,color,power] of [[12.5,12.5,theme.accent,7],[4.5,4.5,theme.light,5],[20.5,4.5,theme.light,5],[4.5,20.5,theme.light,5],[20.5,20.5,theme.light,5]]){
      const light=new T.PointLight(color,power,11,2);light.position.set(x,2.78,z);this.world.add(light);this.stageLights.push({light,power});
      box(this.world,[.8,.08,.8],[x,3.05,z],panelMat);
      box(this.world,[.55,.025,.55],[x,2.995,z],new T.MeshBasicMaterial({color}));
      for(const side of [-1,1])box(this.world,[.07,.14,.78],[x+side*.38,2.99,z],panelMat);
    }
    const stainMat=new T.MeshBasicMaterial({color:stageIndex===1?0x203540:0x241f19,transparent:true,opacity:.18,depthWrite:false,side:T.DoubleSide});
    for(let z=2;z<23;z++)for(let x=2;x<23;x++)if(map[z][x]===0&&(x*31+z*17)%47===0){
      const stain=new T.Mesh(new T.CircleGeometry(.36+((x+z)%3)*.13,9),stainMat);
      stain.rotation.x=-Math.PI/2;stain.scale.set(1.6,.7,1);stain.position.set(x+.5,.016,z+.5);this.world.add(stain);
    }
    for(const x of [8.45,16.55]){
      for(const z of [9.6,10.2,14.8,15.4]){
        const stripe=box(this.world,[.12,.01,.75],[x,.025,z],mat(0x9e774a,{metalness:.2,roughness:1}));stripe.rotation.y=.54;
      }
    }
    for(const [x,z] of [[12.5,5.5],[12.5,19.5],[5.5,12.5],[19.5,12.5]]){
      const grate=box(this.world,[1.9,.018,.45],[x,.025,z],mat(0x171e18,{metalness:.8}));
      for(let i=-3;i<=3;i++)box(this.world,[.03,.02,.43],[x+i*.23,.04,z],mat(0x728071,{metalness:.8}));
    }
    const sectorNames=['MOLTEN PROCESSING','DEEP FREEZE FAILURE','REACTOR BREACH'];
    for(const z of [1.15,23.85]){
      const sign=makeLabel(sectorNames[stageIndex]||sectorNames[0],`#${theme.accent.toString(16).padStart(6,'0')}`);
      sign.position.set(12.5,2.38,z);sign.scale.set(4.8,.52,1);this.world.add(sign);
    }
    // The same service interface anchors each sector. Its output changes with
    // the processing line, so players can learn one interaction and use it well.
    const consoleDark=mat(0x202922,{metalness:.72,roughness:.48});
    const consoleSteel=mat(stageIndex===1?0x74858a:stageIndex===2?0x806e6d:0x747767,{metalness:.6,roughness:.5});
    box(this.world,[1.1,1.5,.16],[12.5,1.28,7.075],consoleSteel);
    box(this.world,[.85,.55,.045],[12.5,1.43,7.18],consoleDark);
    box(this.world,[.62,.12,.055],[12.5,1.53,7.22],mat(theme.accent,{emissive:theme.accent,emissiveIntensity:1.4,roughness:.2}));
    for(const x of [12.16,12.5,12.84])box(this.world,[.12,.12,.07],[x,1.22,7.24],mat(0xc2a56e,{metalness:.7}));
    this.machineLamp=box(this.world,[.25,.13,.1],[12.5,1.91,7.2],mat(0xa7e879,{emissive:0xa7e879,emissiveIntensity:2.2}));
    this.stationLamps=[this.machineLamp];
    const dial=new T.Mesh(new T.TorusGeometry(.18,.022,6,24),mat(0xaaa68b,{metalness:.8}));dial.position.set(12.85,1.47,7.245);this.world.add(dial);
    const dialFace=new T.Mesh(new T.CircleGeometry(.155,24),mat(0x18201b,{metalness:.25}));dialFace.position.set(12.85,1.47,7.247);this.world.add(dialFace);
    this.machineNeedle=box(this.world,[.026,.12,.025],[12.85,1.52,7.27],mat(0xf2bd75,{emissive:0x9e5031,emissiveIntensity:.45}));
    this.machineNeedle.geometry.translate(0,-.045,0);
    this.machineLever=new T.Group();this.machineLever.position.set(12.17,1.38,7.28);this.world.add(this.machineLever);
    box(this.machineLever,[.15,.15,.11],[0,0,0],mat(0xa19f89,{metalness:.75}));
    box(this.machineLever,[.055,.32,.055],[0,.19,.045],mat(0x8b9188,{metalness:.8}));
    const grip=new T.Mesh(new T.SphereGeometry(.075,8,6),mat(0xb84b38,{metalness:.45,roughness:.38}));grip.position.set(0,.37,.045);this.machineLever.add(grip);
    this.machineSteps=[];
    for(let i=0;i<3;i++)this.machineSteps.push(box(this.world,[.11,.07,.035],[12.13+i*.13,1.08,7.245],mat(0x566553,{emissive:0x344129,emissiveIntensity:.3})));
    const controlLabel=makeLabel(['SHEAR CONTROL / HOLD F','PURGE CONTROL / HOLD F','GRID CONTROL / HOLD F'][stageIndex],'#e3edaf');
    controlLabel.position.set(12.5,2.28,7.26);controlLabel.scale.set(2.5,.32,1);this.world.add(controlLabel);
    this.contractPlacard=makeLabel('CONTRACT / AWAIT ORDER','#edb28c');
    this.contractPlacard.position.set(12.5,2.7,7.26);this.contractPlacard.scale.set(2.9,.34,1);this.world.add(this.contractPlacard);
    this.contractPlacardKey='';
    for(const station of stations.slice(1)){
      const x=station.x,z=station.y,steel=mat(stageIndex===1?0x5e7780:0x695f52,{metalness:.7,roughness:.45});
      box(this.world,[.7,.13,.57],[x,.1,z],mat(0x26312b,{metalness:.7}));
      box(this.world,[.46,1.3,.32],[x,.78,z],steel);
      box(this.world,[.38,.42,.035],[x,1.02,z+.18],mat(0x18251e,{metalness:.4}));
      box(this.world,[.31,.09,.04],[x,1.15,z+.205],mat(theme.accent,{emissive:theme.accent,emissiveIntensity:1.25}));
      for(let i=0;i<3;i++)box(this.world,[.055,.055,.045],[x-.1+i*.1,.87,z+.21],mat(0xbda16d,{metalness:.5}));
      const lamp=box(this.world,[.28,.1,.18],[x,1.48,z],mat(0xa7e879,{emissive:0xa7e879,emissiveIntensity:1.5}));this.stationLamps[station.id]=lamp;
      const tag=makeLabel(`0${station.id+1} / ${station.modeName}`,'#e8c58c');tag.position.set(x,1.78,z);tag.scale.set(2.5,.29,1);this.world.add(tag);
      const ring=new T.Mesh(new T.TorusGeometry(station.radius,.055,5,48),new T.MeshBasicMaterial({color:0xff9b68,transparent:true,opacity:.7,depthWrite:false,depthTest:false}));
      ring.rotation.x=-Math.PI/2;ring.position.y=.085;
      const disc=new T.Mesh(new T.CircleGeometry(station.radius,48),new T.MeshBasicMaterial({color:0xff785b,transparent:true,opacity:.12,depthWrite:false,depthTest:false,side:T.DoubleSide}));
      disc.rotation.x=-Math.PI/2;disc.position.y=.055;
      const zone=new T.Group();zone.add(ring,disc);zone.position.set(station.targetX,0,station.targetY);zone.visible=false;zone.userData.ring=ring;zone.userData.disc=disc;this.scene.add(zone);this.extraMachineZones[station.id-1]=zone;
    }
    const notice=makeLabel(['PERSONNEL ARE NOT FEEDSTOCK','COOLANT LOOP / EMPLOYEES EXCLUDED','AUTOMATION HAS PRIORITY'][stageIndex],'#edb28c');
    notice.position.set(12.5,2.55,23.72);notice.scale.set(4.8,.38,1);this.world.add(notice);
    const rigMetal=mat(stageIndex===1?0x6b8a98:stageIndex===2?0x725661:0x745c45,{metalness:.78,roughness:.38});
    for(const x of [9.3,15.7]){
      box(this.world,[.22,.34,6.7],[x,2.88,12.5],rigMetal);
      for(const z of [9.3,15.7])box(this.world,[.25,.5,.25],[x,2.72,z],consoleDark);
    }
    this.machinePress=box(this.world,[5.9,.28,1.25],[12.5,2.64,12.5],rigMetal);
    for(const x of [10,11.25,12.5,13.75,15])box(this.world,[.06,.03,1.3],[x,2.47,12.5],mat(theme.accent,{emissive:theme.accent,emissiveIntensity:.35}));
    if(stageIndex===0){
      const furnace=mat(0x342b25,{metalness:.8,roughness:.56}),heat=mat(0xdc6535,{emissive:0xb83d20,emissiveIntensity:1.8});
      this.sectorPulseMaterials.push(heat);
      for(const z of [5.5,12.5,19.5])for(const side of [-1,1]){
        const x=side<0?1.1:23.9;
        box(this.world,[.16,1.36,1.45],[x,1.34,z],furnace);
        for(let i=-1;i<=1;i++)box(this.world,[.035,.12,.32],[x+(side<0?.09:-.09),1.28,z+i*.42],heat);
        box(this.world,[.21,.12,1.65],[x,2.06,z],rigMetal);
      }
      for(const x of [10.45,12.5,14.55]){
        box(this.world,[.14,.62,.23],[x,2.17,12.5],furnace);
        box(this.world,[.32,.26,.41],[x,1.74,12.5],rigMetal);
        box(this.world,[.18,.05,.3],[x,1.58,12.5],heat);
      }
      for(const z of [8.25,16.75]){
        const rail=box(this.world,[21.5,.18,.28],[12.5,2.73,z],furnace);
        rail.material.metalness=.87;
        for(const x of [4,8,17,21])box(this.world,[.22,.42,.25],[x,2.46,z],rigMetal);
      }
    }else if(stageIndex===1){
      const tank=mat(0x7a9aa8,{metalness:.65,roughness:.33}),glass=mat(0x84cae1,{transparent:true,opacity:.37,metalness:.08,roughness:.18}),coolant=mat(0x80e0f8,{emissive:0x54aec9,emissiveIntensity:1.7});
      this.sectorPulseMaterials.push(coolant);
      for(const z of [5.5,12.5,19.5])for(const side of [-1,1]){
        const x=side<0?1.08:23.92;
        const body=new T.Mesh(new T.CylinderGeometry(.38,.38,1.52,12),glass);body.position.set(x,1.39,z);this.world.add(body);
        for(const y of [.62,2.17]){
          const rim=new T.Mesh(new T.CylinderGeometry(.43,.43,.12,12),tank);rim.position.set(x,y,z);this.world.add(rim);
        }
        box(this.world,[.12,.9,.12],[x,1.39,z],coolant);
        box(this.world,[.2,.14,.83],[x,2.28,z],tank);
      }
      for(const x of [10.8,14.2])for(const z of [11.7,13.3]){
        const vent=box(this.world,[.52,.045,.4],[x,3.06,z],tank);
        for(const offset of [-.12,0,.12])box(this.world,[.035,.02,.32],[x+offset,3.025,z],coolant);
      }
    }else{
      const conductor=mat(0x735b61,{metalness:.83,roughness:.32}),charge=mat(0xe57a68,{emissive:0xc94d50,emissiveIntensity:2.2});
      this.sectorPulseMaterials.push(charge);
      for(const z of [5.5,12.5,19.5])for(const side of [-1,1]){
        const x=side<0?1.08:23.92;
        box(this.world,[.2,1.55,.96],[x,1.47,z],conductor);
        for(const y of [.94,1.45,1.96])box(this.world,[.035,.09,.78],[x+(side<0?.11:-.11),y,z],charge);
        box(this.world,[.34,.2,1.18],[x,2.35,z],rigMetal);
      }
      for(const radius of [1.2,2.35,3.5]){
        const ring=new T.Mesh(new T.TorusGeometry(radius,.08,6,44),conductor);ring.rotation.x=Math.PI/2;ring.position.set(12.5,2.95,12.5);this.world.add(ring);
        for(let i=0;i<8;i++){
          const angle=i*Math.PI/4,x=12.5+Math.cos(angle)*radius,z=12.5+Math.sin(angle)*radius;
          const terminal=new T.Mesh(new T.OctahedronGeometry(.09),charge);terminal.position.set(x,2.88,z);this.world.add(terminal);
        }
      }
    }
    const ventSites=[[[6.5,12.5],[18.5,12.5]],[[12.5,6.5],[12.5,18.5]],[[6.5,6.5],[18.5,18.5]]][stageIndex];
    const ventSteel=mat(stageIndex===1?0x48626b:stageIndex===2?0x574044:0x4f493b,{metalness:.78,roughness:.52});
    for(const [x,z] of ventSites){
      const socket=new T.Mesh(new T.CylinderGeometry(.69,.72,.055,20),ventSteel);socket.position.set(x,.035,z);this.world.add(socket);
      const inner=new T.Mesh(new T.CylinderGeometry(.53,.53,.057,20),mat(0x121b1a,{metalness:.45}));inner.position.set(x,.07,z);this.world.add(inner);
      for(let i=-2;i<=2;i++)box(this.world,[.045,.025,.92],[x+i*.2,.105,z],ventSteel);
      const lamp=new T.Mesh(new T.TorusGeometry(.65,.036,5,32),new T.MeshBasicMaterial({color:theme.accent,transparent:true,opacity:.2,depthWrite:false}));
      lamp.rotation.x=-Math.PI/2;lamp.position.set(x,.105,z);this.world.add(lamp);this.ventLamps.push(lamp);
    }
  }
  disposeGroup(group){
    const geometries=new Set(),materials=new Set();
    group.traverse(obj=>{if(obj.geometry)geometries.add(obj.geometry);if(obj.material){for(const m of Array.isArray(obj.material)?obj.material:[obj.material])materials.add(m);}});
    group.clear();for(const geometry of geometries)geometry.dispose();
    for(const material of materials){material.map?.dispose();material.dispose();}
  }
  setWeapon(kind){
    if(this.weapon===kind)return;
    if(this.gun){this.camera.remove(this.gun);this.disposeGroup(this.gun);}
    this.weapon=kind;this.gun=weaponModel(kind);this.gun.scale.setScalar(.62);
    this.gun.position.set(.32,-.9,-.83);this.equipAmount=1;this.camera.add(this.gun);
  }
  setCamera(x,z,yaw,pitch,height,lean){
    this.camera.position.set(x,height,z);
    this.camera.rotation.set(pitch,-yaw-Math.PI/2,lean,'YXZ');
  }
  setWeaponPose(bob,recoil,ads,muzzle,reloading,dt){
    this.equipAmount=Math.max(0,(this.equipAmount||0)-dt*3.7);
    const k=1-Math.exp(-dt*18),dip=(reloading?.26:0)+this.equipAmount*.31;
    const targetX=ads?.015:.32,targetY=(ads?-.42:-.55)-dip,targetZ=ads?-.67:-.83;
    this.gun.position.x+=(targetX+Math.sin(bob)*.012-this.gun.position.x)*k;
    this.gun.position.y+=(targetY+Math.abs(Math.cos(bob))*.012-recoil*.085-this.gun.position.y)*k;
    this.gun.position.z+=(targetZ+recoil*.18-this.gun.position.z)*k;
    this.gun.rotation.z+=(Math.sin(bob)*.012+(reloading?.2:0)-this.gun.rotation.z)*k;
    this.gun.rotation.x+=((reloading?-.24:0)+this.equipAmount*.18-this.gun.rotation.x)*k;
    this.gun.userData.flash.visible=muzzle>0&&!reloading;
    const action=this.gun.userData.action;
    if(action)action.position.z=this.gun.userData.actionRest+recoil*this.gun.userData.actionTravel+(reloading?.12:0);
    if(this.gun.userData.coil)this.gun.userData.coil.emissiveIntensity=.45+Math.max(0,muzzle)*9+(reloading?.15:0);
    this.gun.userData.spin=Math.max(0,(this.gun.userData.spin||0)-dt*11);
    if(this.gun.userData.rotor)this.gun.userData.rotor.rotation.z+=this.gun.userData.spin*dt*16;
    this.gun.userData.flash.scale.setScalar(1+recoil*.55);
  }
  sync(state,myId,dt,time){
    const machine=state.machine;
    const reduced=!!this.settings.reducedFlashes;
    const order=state.workOrder;
    const placardKey=order?`${order.kind}:${order.result||''}`:'none';
    if(this.contractPlacard&&placardKey!==this.contractPlacardKey){
      this.world.remove(this.contractPlacard);this.contractPlacard.material.map?.dispose();this.contractPlacard.material.dispose();
      const label=order?.result?`CONTRACT / ${order.result.toUpperCase()}`:order?.kind==='machine'?'ORDER / PROCESS TWO TARGETS':order?.kind==='speed'?`ORDER / CLEAR IN ${order.target}S`:order?.kind==='intact'?'ORDER / KEEP CREW STANDING':'CONTRACT / AWAIT ORDER';
      this.contractPlacard=makeLabel(label,order?.result==='missed'?'#ff9277':order?.result==='paid'?'#d6ec53':'#edb28c');
      this.contractPlacard.position.set(12.5,2.7,7.26);this.contractPlacard.scale.set(2.9,.34,1);this.world.add(this.contractPlacard);
      this.contractPlacardKey=placardKey;
    }
    this.machineZone.visible=state.phase==='combat'&&machine?.state==='warning';
    if(this.machineZone.visible){
      this.machineZone.position.set(machine.targetX,0,machine.targetY);
      this.machineZone.userData.ring.material.opacity=reduced?.78:.65+.25*Math.sin(time*13);
      this.machineZone.userData.disc.material.opacity=reduced?.14:.1+.055*Math.sin(time*13);
    }
    for(const m of state.machines?.slice(1)||[]){
      const zone=this.extraMachineZones?.[m.id-1];if(!zone)continue;
      zone.visible=state.phase==='combat'&&m.state==='warning';
      if(zone.visible){zone.position.set(m.targetX,0,m.targetY);zone.userData.ring.material.opacity=reduced?.78:.65+.25*Math.sin(time*13);zone.userData.disc.material.opacity=reduced?.14:.1+.055*Math.sin(time*13);}
    }
    if(this.machineLamp){
      const color=machine?.state==='warning'?0xff735b:machine?.state==='cooldown'?0xb38f5b:0xa7e879;
      this.machineLamp.material.color.setHex(color);this.machineLamp.material.emissive.setHex(color);
      this.machineLamp.material.emissiveIntensity=machine?.state==='warning'?2.8:1.4;
    }
    for(const m of state.machines?.slice(1)||[]){const lamp=this.stationLamps?.[m.id];if(!lamp)continue;const color=m.state==='warning'?0xff735b:m.state==='cooldown'?0xb38f5b:m.operatorId?0xf1d681:0xa7e879;lamp.material.color.setHex(color);lamp.material.emissive.setHex(color);lamp.material.emissiveIntensity=m.operatorId?2.5:1.4;}
    if(this.machinePress)this.machinePress.position.y=machine?.state==='warning'?2.64-Math.min(.22,1.25-machine.warningRemaining)*.55:2.64;
    const hold=machine?.holdProgress||0;
    if(this.machineLever)this.machineLever.rotation.x=-hold*.68;
    if(this.machineNeedle)this.machineNeedle.rotation.z=-1.15+hold*2.3;
    for(let i=0;i<(this.machineSteps?.length||0);i++){
      const lit=machine?.state==='warning'||hold>(i+.3)/3;
      this.machineSteps[i].material.color.setHex(lit?0xffb05e:0x566553);
      this.machineSteps[i].material.emissive.setHex(lit?0xc6552b:0x344129);
    }
    const activeFloor=state.hazards?.some(h=>h.active);
    for(let i=0;i<(this.stageLights?.length||0);i++){
      const {light,power}=this.stageLights[i],pulse=Math.sin(time*(i%2?2.1:1.45)+i*1.9);
      light.intensity=power*(.9+(reduced?0:.08*pulse)+(activeFloor?.12:0));
    }
    for(const material of this.sectorPulseMaterials||[])material.emissiveIntensity=1.55+(reduced?0:.28*Math.sin(time*2.3))+(activeFloor?.4:0);
    for(let i=0;i<(this.ventLamps?.length||0);i++){
      const hazard=state.hazards?.[i],lamp=this.ventLamps[i];
      lamp.material.opacity=hazard?.active?.96:hazard?.warning?.68:.16;
      lamp.scale.setScalar(hazard?.warning&&!reduced?1+Math.sin(time*9)*.05:1);
    }
    const activePings=new Set();
    for(const ping of state.pings||[]){
      activePings.add(ping.id);
      let obj=this.pings.get(ping.id);
      if(!obj){
        const color=ping.kind==='danger'?0xff805e:0xd6ec53,group=new T.Group();
        const material=new T.MeshBasicMaterial({color,transparent:true,opacity:.85,depthTest:false,depthWrite:false});
        const ring=new T.Mesh(new T.TorusGeometry(.45,.045,5,32),material.clone());ring.rotation.x=-Math.PI/2;ring.position.y=.08;group.add(ring);
        const stem=new T.Mesh(new T.CylinderGeometry(.018,.018,1.45,6),material.clone());stem.position.y=.8;stem.material.opacity=.32;group.add(stem);
        const marker=new T.Mesh(new T.OctahedronGeometry(.2,0),material);marker.position.y=1.6;group.add(marker);
        const label=makeLabel(`${ping.kind==='danger'?'DANGER':'MOVE'} / ${ping.name}`,ping.kind==='danger'?'#ffb59b':'#e2f6a0');label.position.y=2.02;label.material.depthTest=false;group.add(label);
        group.userData.ring=ring;group.userData.marker=marker;this.scene.add(group);this.pings.set(ping.id,group);obj=group;
      }
      obj.position.set(ping.x,0,ping.y);
      obj.userData.marker.rotation.y+=dt*2.5;
      obj.userData.ring.scale.setScalar(1+Math.sin(time*6)*.08);
      obj.userData.ring.material.opacity=.85*Math.min(1,ping.remaining/.8);
    }
    for(const [id,obj] of this.pings)if(!activePings.has(id)){this.scene.remove(obj);this.disposeGroup(obj);this.pings.delete(id);}
    const liveHazards=new Set();
    for(const h of state.hazards||[]){
      liveHazards.add(h.id);
      let obj=this.hazards.get(h.id);
      if(!obj){
        const color=h.kind==='cryolab'?0x83d8f5:h.kind==='core'?0xef8d6a:0xffb35e;
        obj=new T.Group();
        const ring=new T.Mesh(new T.TorusGeometry(h.r,.055,5,48),new T.MeshBasicMaterial({color,transparent:true,opacity:.3,depthWrite:false}));
        ring.rotation.x=-Math.PI/2;ring.position.y=.055;obj.add(ring);
        const disc=new T.Mesh(new T.CircleGeometry(h.r,48),new T.MeshBasicMaterial({color,transparent:true,opacity:.04,depthWrite:false,side:T.DoubleSide}));
        disc.rotation.x=-Math.PI/2;disc.position.y=.028;obj.add(disc);
        obj.userData.ring=ring;obj.userData.disc=disc;this.scene.add(obj);this.hazards.set(h.id,obj);
      }
      obj.position.set(h.x,0,h.y);
      obj.userData.ring.material.opacity=h.active?.95:h.warning?.58:.16;
      obj.userData.disc.material.opacity=h.active?.2:h.warning?.1:.025;
      obj.userData.ring.scale.setScalar(h.warning?1+Math.sin(time*10)*.025:1);
    }
    for(const [id,obj] of this.hazards)if(!liveHazards.has(id)){this.scene.remove(obj);this.hazards.delete(id);}
    const active=new Set(),activeTelegraphs=new Set();
    for(const e of state.enemies){
      const id='e'+e.id;active.add(id);
      let obj=this.entities.get(id);
      if(!obj){obj=makeEnemy(e.type);obj.position.set(e.x,0,e.y);this.scene.add(obj);this.entities.set(id,obj);}
      const k=Math.min(1,dt*13);obj.position.x+=(e.x-obj.position.x)*k;obj.position.z+=(e.y-obj.position.z)*k;
      obj.position.y=floorHeightAt(this.gridMap,e.x,e.y)+(e.stunned?-.055:Math.sin(time*(e.type==='mite'?7:e.charging?10:4)+e.id)*(e.telegraph?.015:.025));
      obj.rotation.y=Math.atan2(e.faceX,e.faceY);
      obj.rotation.z=e.flash*(e.id%2?1:-1)*.22;
      obj.scale.z+=( (e.boss?e.overdrive?1.24:1.18:e.charging?1.14:1)-obj.scale.z)*Math.min(1,dt*14);
      obj.scale.y+=( (e.boss?e.overdrive?1.24:1.18:e.stunned?.92:e.telegraph?1.035:1)-obj.scale.y)*Math.min(1,dt*12);
      const bar=obj.userData.bar,fill=bar.userData.fill,ratio=Math.max(0,e.hp/e.maxHp);
      fill.scale.x=ratio;fill.position.x=-(bar.userData.width*(1-ratio))/2;
      bar.rotation.y=0;
      for(const [status,ring] of Object.entries(obj.userData.statusRings))ring.visible=!!e[status];
      obj.traverse(part=>{if(part.isMesh&&part.material?.emissive)part.material.emissiveIntensity=(part.material.userData.baseGlow||0)+Math.max(0,e.flash)*9+(e.telegraph?.55:0)+(e.overdrive?.4:0);});
      if(obj.userData.overdriveRing){obj.userData.overdriveRing.visible=!!e.overdrive;obj.userData.overdriveRing.rotation.z+=dt*1.4;obj.userData.overdriveRing.material.opacity=reduced?.78:.55+.3*Math.sin(time*8);}
      if(obj.userData.shieldPlate){
        obj.userData.shieldPlate.material.emissiveIntensity=e.shielded?1.4:.03;
        obj.userData.shieldPlate.material.opacity=e.shielded?1:.58;
      }
      if(e.telegraph){
        activeTelegraphs.add(e.id);
        let warning=this.telegraphs.get(e.id);
        if(!warning){
          const color=e.telegraph.kind==='snipe'?0xff5570:e.telegraph.kind==='coldPulse'||(e.telegraph.kind==='beam'&&e.type==='matriarch')?0x8de6ff:e.telegraph.kind==='beam'?0xffb456:e.telegraph.kind==='slam'?0xffc06d:e.telegraph.kind==='charge'?0xffa268:e.telegraph.kind==='blast'||e.telegraph.kind==='press'?0xffa46b:0xff6985;
          warning=new T.Group();
          const geometry=new T.BufferGeometry().setFromPoints([new T.Vector3(),new T.Vector3()]);
          const line=new T.Line(geometry,new T.LineBasicMaterial({color,transparent:true,opacity:.7,depthWrite:false}));warning.add(line);
          const area=['blast','press','coldPulse','slam'].includes(e.telegraph.kind);
          const ring=new T.Mesh(new T.TorusGeometry(area?e.telegraph.radius:e.boss?1.65:1.02,.055,4,32),new T.MeshBasicMaterial({color,transparent:true,opacity:.7,depthWrite:false}));
          ring.rotation.x=-Math.PI/2;ring.position.y=.08;warning.add(ring);
          const disc=new T.Mesh(new T.CircleGeometry(area?e.telegraph.radius:1,32),new T.MeshBasicMaterial({color,transparent:true,opacity:.09,depthWrite:false,side:T.DoubleSide}));
          disc.rotation.x=-Math.PI/2;disc.position.y=.032;warning.add(disc);
          const lane=new T.Mesh(new T.BoxGeometry(1,.018,1),new T.MeshBasicMaterial({color,transparent:true,opacity:.11,depthWrite:false,depthTest:false}));
          lane.position.y=.04;warning.add(lane);
          warning.userData.line=line;warning.userData.ring=ring;warning.userData.disc=disc;warning.userData.lane=lane;this.scene.add(warning);this.telegraphs.set(e.id,warning);
        }
        const position=warning.userData.line.geometry.attributes.position;
        position.setXYZ(0,e.x,e.boss?1.8:1.55,e.y);position.setXYZ(1,e.telegraph.x,1.3,e.telegraph.y);position.needsUpdate=true;
        const urgency=1-Math.min(1,e.telegraph.remaining/(e.telegraph.kind==='snipe'?.95:e.telegraph.kind==='charge'?.5:e.telegraph.kind==='coldPulse'?1:e.telegraph.kind==='beam'?.9:.8));
        warning.userData.line.material.opacity=.35+urgency*.6;
        warning.userData.line.visible=!['blast','press','coldPulse','slam'].includes(e.telegraph.kind);
        warning.userData.ring.visible=!['snipe','beam'].includes(e.telegraph.kind);
        warning.userData.ring.position.x=['blast','press'].includes(e.telegraph.kind)?e.telegraph.x:e.x;warning.userData.ring.position.z=['blast','press'].includes(e.telegraph.kind)?e.telegraph.y:e.y;
        warning.userData.ring.material.opacity=.35+urgency*.55;
        warning.userData.ring.scale.setScalar(1+Math.sin(time*18)*.04);
        warning.userData.disc.visible=['blast','press','coldPulse','slam'].includes(e.telegraph.kind);
        warning.userData.disc.position.x=e.telegraph.x;warning.userData.disc.position.z=e.telegraph.y;
        const lane=warning.userData.lane,lx=e.telegraph.x-e.x,lz=e.telegraph.y-e.y;
        lane.visible=e.telegraph.kind==='beam';lane.position.x=(e.x+e.telegraph.x)/2;lane.position.z=(e.y+e.telegraph.y)/2;
        lane.scale.set(Math.hypot(lx,lz),1,e.telegraph.radius*2);lane.rotation.y=-Math.atan2(lz,lx);
        lane.material.opacity=.09+urgency*.13;
      }
    }
    for(const [id,obj] of this.telegraphs)if(!activeTelegraphs.has(id)){this.scene.remove(obj);this.disposeGroup(obj);this.telegraphs.delete(id);}
    for(const p of state.players)if(p.id!==myId&&!p.dead){
      const id='p'+p.id;active.add(id);
      let obj=this.entities.get(id);
      if(!obj){obj=makePlayer(p.name,p.classId);obj.position.set(p.x,0,p.y);this.scene.add(obj);this.entities.set(id,obj);}
      const k=Math.min(1,dt*13);obj.position.x+=(p.x-obj.position.x)*k;obj.position.z+=(p.y-obj.position.z)*k;obj.position.y=floorHeightAt(this.gridMap,p.x,p.y);
      obj.rotation.y=Math.PI/2-p.a;
      obj.scale.y+=( (p.downed?.42:1)-obj.scale.y)*k;
      obj.userData.rescueRing.visible=!!p.downed;
      if(p.downed)obj.userData.rescueRing.material.opacity=.55+.3*Math.sin(time*8);
      for(const [graft,part] of Object.entries(obj.userData.graftMeshes))part.visible=p.grafts?.includes(graft)||false;
    }
    for(const [id,obj] of this.entities)if(!active.has(id)){this.scene.remove(obj);this.disposeGroup(obj);this.entities.delete(id);}
    const docket=state.phase==='combat'&&state.docket?.state==='available'?state.docket:null;
    if(docket){
      if(!this.docketObj){this.docketObj=makeDocket();this.scene.add(this.docketObj);}
      this.docketObj.position.set(docket.x,floorHeightAt(this.gridMap,docket.x,docket.y),docket.y);
      this.docketObj.userData.beacon.material.emissiveIntensity=this.settings.reducedFlashes?1.1:1.15+.3*Math.sin(time*4);
      this.docketObj.userData.ring.material.opacity=this.settings.reducedFlashes ? .72 : .55+.18*Math.sin(time*3);
    }else if(this.docketObj){this.scene.remove(this.docketObj);this.disposeGroup(this.docketObj);this.docketObj=null;}
    const activeDrops=new Set();
    for(const d of state.drops){
      activeDrops.add(d.id);let obj=this.drops.get(d.id);
      if(!obj){obj=makePickup(d.kind);this.scene.add(obj);this.drops.set(d.id,obj);}
      obj.position.set(d.x,Math.sin(time*3+d.id)*.07,d.y);obj.userData.mesh.rotation.y+=dt*2;
    }
    for(const [id,obj] of this.drops)if(!activeDrops.has(id)){this.scene.remove(obj);this.disposeGroup(obj);this.drops.delete(id);}
    const activeProjectiles=new Set(),age=Math.min(.12,Math.max(0,time-(state.receivedAt||time)));
    for(const b of state.projectiles){
      activeProjectiles.add(b.id);
      let obj=this.projectiles.get(b.id);
      if(!obj){obj=makeProjectile(b.kind,b.arcCharged,b.phaseCharged,b.heatHigh);this.scene.add(obj);this.projectiles.set(b.id,obj);}
      setProjectileVisibility(obj,b.side==='player'&&b.ownerId!==myId?Math.max(.25,Math.min(1,Number(this.settings.allyProjectiles)/100||1)):1);
      obj.position.set(b.x+b.vx*age,b.h+b.vh*age,b.y+b.vy*age);
      const dir=new T.Vector3(b.vx,b.vh,b.vy).normalize();
      obj.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),dir);
    }
    for(const [id,obj] of this.projectiles)if(!activeProjectiles.has(id)){this.disposeProjectile(obj);this.projectiles.delete(id);}
    for(const fx of [...this.predicted]){
      fx.ttl-=dt;fx.obj.position.addScaledVector(fx.velocity,dt);
      if(fx.ttl<=0){this.disposeProjectile(fx.obj);this.predicted.splice(this.predicted.indexOf(fx),1);}
    }
    for(const fx of [...this.skillRings]){
      fx.ttl-=dt;
      fx.mesh.scale.setScalar(1+(1-fx.ttl/fx.life)*(fx.radius/.6-1));
      fx.mesh.material.opacity=Math.max(0,fx.ttl/fx.life*.8);
      if(fx.ttl<=0){this.scene.remove(fx.mesh);fx.mesh.geometry.dispose();fx.mesh.material.dispose();this.skillRings.splice(this.skillRings.indexOf(fx),1);}
    }
    for(const fx of [...this.damageNumbers]){
      fx.ttl-=dt;fx.sprite.position.y+=dt*.8;fx.sprite.material.opacity=Math.min(1,Math.max(0,fx.ttl/.35));
      if(fx.ttl<=0){this.scene.remove(fx.sprite);fx.sprite.material.map.dispose();fx.sprite.material.dispose();this.damageNumbers.splice(this.damageNumbers.indexOf(fx),1);}
    }
    for(const fx of [...this.impacts]){
      fx.ttl-=dt;fx.velocity.y-=dt*4;fx.mesh.position.addScaledVector(fx.velocity,dt);fx.mesh.material.opacity=Math.max(0,fx.ttl/.42);
      if(fx.ttl<=0){this.scene.remove(fx.mesh);fx.mesh.geometry.dispose();fx.mesh.material.dispose();this.impacts.splice(this.impacts.indexOf(fx),1);}
    }
  }
  damageNumber(hit){
    const sprite=makeDamageNumber(hit.amount,hit.crit,hit.armored,hit.marked,hit.staggered);
    sprite.position.set(hit.x+(Math.random()-.5)*.25,hit.height+.3,hit.y);
    this.scene.add(sprite);this.damageNumbers.push({sprite,ttl:.95});
    while(this.damageNumbers.length>24){
      const old=this.damageNumbers.shift();this.scene.remove(old.sprite);old.sprite.material.map.dispose();old.sprite.material.dispose();
    }
    for(let i=0;i<(hit.crit||hit.staggered?7:4);i++){
      const color=hit.staggered?0xffc98b:hit.crit?0xffb675:hit.marked?0xf8d79b:hit.armored?0xa6dce5:0xd6ec53;
      const mesh=new T.Mesh(new T.OctahedronGeometry(hit.crit?.055:.035),new T.MeshBasicMaterial({color,transparent:true,opacity:1,depthWrite:false}));
      mesh.position.set(hit.x,hit.height*.75,hit.y);this.scene.add(mesh);
      const angle=Math.random()*Math.PI*2,speed=1+Math.random()*2;
      this.impacts.push({mesh,velocity:new T.Vector3(Math.cos(angle)*speed,Math.random()*2.3,Math.sin(angle)*speed),ttl:.42});
    }
    while(this.impacts.length>100){const fx=this.impacts.shift();this.scene.remove(fx.mesh);fx.mesh.geometry.dispose();fx.mesh.material.dispose();}
  }
  disposeProjectile(obj){
    this.scene.remove(obj);const geometries=new Set(),materials=new Set();
    obj.traverse(mesh=>{if(mesh.isMesh){geometries.add(mesh.geometry);materials.add(mesh.material);}});
    for(const geometry of geometries)geometry.dispose();for(const material of materials)material.dispose();
  }
  remoteShot(x,z){
    const mesh=new T.Mesh(new T.IcosahedronGeometry(.16,0),new T.MeshBasicMaterial({color:0xffdfa0,transparent:true,opacity:.9,depthWrite:false}));
    mesh.position.set(x,1.35,z);this.scene.add(mesh);
    this.impacts.push({mesh,velocity:new T.Vector3(0,.2,0),ttl:.14});
  }
  skillEffect(classId,x,z){
    const colors={vanguard:0xd6ec53,breacher:0xf4924f,runner:0x75d9bd,medic:0xb5b0f3,shrapnel:0xffa267,arc:0x8fdcff,conduction:0x8cdbff,siphon:0xf4d68a,salvage:0xd6ec53,bounce:0xd6ec53,explosion:0xff8c56,gravityBlast:0x91c7ff,tether:0xf0c58c,markBreak:0xffdc92,weldBeam:0xffad61,bossShear:0xffad61,coolantLance:0x8de6ff,reactorPress:0xff7d6c,bossOverdrive:0xff6b57,stagger:0xffc98b,wardenPress:0xffa36b,coldPulse:0x8de6ff,bossPurge:0x8de6ff,bruteSlam:0xffc06d,ramCrash:0xffad72,ramHit:0xff7d60,combustion:0xffb35e,toxin:0x75d9bd,frost:0x9de9ff,heal:0x8de9aa,kinetic:0xffad72,charge:0xff8c56,muzzle:0xff556c,spawn:0xffcf69,sapperBlast:0xffa36b,shield:0x8ed5e8,vent:0xffaa63};
    const radius=classId==='breacher'?5.5:classId==='medic'?7.5:classId==='heal'?5:classId==='siphon'?2.8:classId==='kinetic'?2.5:classId==='sapperBlast'?2.1:classId==='wardenPress'?2.7:classId==='reactorPress'?2.25:classId==='bruteSlam'?2.45:classId==='gravityBlast'?2.9:classId==='bossPurge'?4.1:classId==='coldPulse'?3.1:classId==='shrapnel'||classId==='explosion'?2.4:classId==='bossOverdrive'?2.2:classId==='ramCrash'||classId==='ramHit'?1.2:classId==='stagger'?.9:classId==='bounce'||classId==='tether'||classId==='markBreak'?.6:classId==='muzzle'?.9:classId==='spawn'||classId==='conduction'?1.1:2;
    const mesh=new T.Mesh(new T.TorusGeometry(.6,.045,4,48),new T.MeshBasicMaterial({color:colors[classId]||0xffffff,transparent:true,opacity:.8,depthWrite:false,side:T.DoubleSide}));
    mesh.rotation.x=-Math.PI/2;mesh.position.set(x,.08,z);this.scene.add(mesh);
    this.skillRings.push({mesh,ttl:.65,life:.65,radius});
  }
  shoot(kind,heatHigh=false){
    const dir=new T.Vector3();this.camera.getWorldDirection(dir);
    this.gun.userData.spin=Math.min(4,(this.gun.userData.spin||0)+1.5);
    const obj=makeProjectile(kind,false,false,heatHigh);obj.position.copy(this.camera.position).addScaledVector(dir,.4);
    obj.quaternion.setFromUnitVectors(new T.Vector3(0,0,-1),dir);
    const speeds={carbine:38,scatter:26,smg:30,pulse:21,rail:72,launcher:16,arcgun:28,cryo:28,saw:24,burst:40,harpoon:34,gravity:17,borer:30};
    this.scene.add(obj);this.predicted.push({obj,velocity:dir.multiplyScalar(speeds[kind]||30),ttl:.12});
    if(['carbine','scatter','smg','rail','saw','burst','harpoon'].includes(kind)){
      const offset=new T.Vector3(.34,-.24,-.5).applyQuaternion(this.camera.quaternion);
      const shell=new T.Mesh(new T.BoxGeometry(.035,.065,.035),new T.MeshBasicMaterial({color:0xbca174,transparent:true,opacity:.9,depthWrite:false}));
      shell.position.copy(this.camera.position).add(offset);this.scene.add(shell);
      const velocity=new T.Vector3(2.2,1.2,.4).applyQuaternion(this.camera.quaternion);
      this.impacts.push({mesh:shell,velocity,ttl:.42});
      while(this.impacts.length>100){const old=this.impacts.shift();this.scene.remove(old.mesh);old.mesh.geometry.dispose();old.mesh.material.dispose();}
    }
  }
  render(){this.renderer.render(this.scene,this.camera);}
}
