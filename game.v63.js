(() => {
"use strict";
try {

/* ==========================================================
   Geometria Lab 3D — V68 solid geometry and refined character models (renderer unchanged)
   No start-time dynamic imports: Three.js + data are already
   loaded before this script. The start button itself is a
   classic inline handler, independent of this engine.
========================================================== */

const THREE = window.THREE;
const FIGURES = window.GEOMETRY_FIGURES || [];
const DIFF = window.GEOMETRY_DIFFICULTIES || {};
const $ = id => document.getElementById(id);
const XP_PER_LEVEL = 250;
const XP_STORAGE_KEY = "gl_profile_xp_v52";
const CONTROL_DEFAULTS={forward:"KeyW",backward:"KeyS",left:"KeyA",right:"KeyD",run:"ShiftLeft",jump:"Space",attack:"KeyQ",study:"KeyE",build:"KeyB",catalog:"KeyP",remove:"KeyX",camera:"KeyV",grab:"KeyG",rotate:"KeyR",freeze:"KeyF",physics:"KeyT",inventory:"Tab"};
const CONTROL_LABELS={forward:["Mover para frente","Avançar na direção da câmera"],backward:["Mover para trás","Recuar"],left:["Mover para esquerda","Deslocamento lateral esquerdo"],right:["Mover para direita","Deslocamento lateral direito"],run:["Correr","Manter pressionado enquanto se move"],jump:["Pular","Pular ou alcançar plataformas"],attack:["Ataque / quiz","Iniciar questão de combate"],study:["Estudar figura","Inspecionar formas no modo Aprendizado"],build:["Construção","Ativar ou desativar construção"],catalog:["Catálogo","Abrir catálogo das 40 figuras"],remove:["Remover construção","Apagar a peça apontada"],camera:["Trocar câmera","Alternar perspectiva"],grab:["Segurar / soltar objeto","Mover construções com a ferramenta Garry's Mod"],rotate:["Girar peça","Girar horizontalmente a figura selecionada no Sandbox"],freeze:["Congelar / girar vertical","Congelar objeto segurado ou girar a peça no outro eixo"],physics:["Física das construções","Ligar/desligar gravidade dos objetos criados por você"],inventory:["Mostrar inventário","Alternar barra inferior"]};
const CONTROL_KEY_NAMES={KeyW:"W",KeyA:"A",KeyS:"S",KeyD:"D",KeyQ:"Q",KeyE:"E",KeyB:"B",KeyP:"P",KeyV:"V",KeyG:"G",KeyF:"F",KeyT:"T",KeyR:"R",KeyX:"X",Space:"ESPAÇO",Tab:"TAB",ShiftLeft:"SHIFT ESQ.",ShiftRight:"SHIFT DIR.",ControlLeft:"CTRL ESQ.",ControlRight:"CTRL DIR.",AltLeft:"ALT ESQ.",AltRight:"ALT DIR.",ArrowUp:"↑",ArrowDown:"↓",ArrowLeft:"←",ArrowRight:"→",Delete:"DELETE",Backspace:"BACKSPACE",Enter:"ENTER",Numpad0:"NUM 0",Numpad1:"NUM 1",Numpad2:"NUM 2",Numpad3:"NUM 3",Numpad4:"NUM 4",Numpad5:"NUM 5",Numpad6:"NUM 6",Numpad7:"NUM 7",Numpad8:"NUM 8",Numpad9:"NUM 9"};
function loadControls(){const fallback={...CONTROL_DEFAULTS};try{const saved=JSON.parse(localStorage.getItem("gl_controls_v61")||"null");if(!saved||typeof saved!=="object")return fallback;const out={...fallback},used=new Set();for(const action of Object.keys(fallback)){const candidate=typeof saved[action]==="string"?saved[action]:fallback[action];if(candidate!=="Escape"&&!used.has(candidate)){out[action]=candidate;used.add(candidate)}else{if(used.has(fallback[action]))return fallback;out[action]=fallback[action];used.add(out[action]);}}return out}catch{return fallback}}
function keyName(code){return CONTROL_KEY_NAMES[code]||(/^Key[A-Z]$/.test(code)?code.slice(3):/^Digit[0-9]$/.test(code)?code.slice(5):/^F([1-9]|1[0-2])$/.test(code)?code:code.replace(/^(Numpad|Arrow)/,""))}

function safeStorageRead(key){try{return localStorage.getItem(key)}catch{return null}}
function safeStorageWrite(key,value){try{localStorage.setItem(key,String(value));return true}catch{return false}}
function storedInteger(key,fallback=0){const raw=safeStorageRead(key);if(raw===null||raw==="")return fallback;const n=Number(raw);return Number.isFinite(n)?Math.max(0,Math.floor(n)):fallback}
function loadInitialXP(){
  try{
    const canonical=localStorage.getItem(XP_STORAGE_KEY);
    if(canonical!==null&&canonical.trim()!==""&&Number.isFinite(Number(canonical)))return Math.max(0,Math.floor(Number(canonical)));
    const keys=["gl_profile_xp_v51","gl_profile_xp_v50","gl_profile_xp_v49","gl_xp_v49_total","gl_xp_v48_total","gl_xp","gl_xp_total"];
    const vals=keys.map(k=>localStorage.getItem(k)).filter(v=>v!==null&&String(v).trim()!=="").map(Number).filter(Number.isFinite).map(v=>Math.max(0,Math.floor(v)));
    for(const profileKey of ["gl_profile_v51","gl_profile_v50","gl_profile_v49"]){
      const raw=localStorage.getItem(profileKey);if(!raw)continue;
      try{const obj=JSON.parse(raw);if(Number.isFinite(Number(obj?.xp)))vals.push(Math.max(0,Math.floor(Number(obj.xp))))}catch{}
    }
    const migrated=Math.max(0,...vals);localStorage.setItem(XP_STORAGE_KEY,String(migrated));return migrated;
  }catch{return 0}
}
function toast(message){const el=$("toast");if(!el)return;el.textContent=String(message);el.style.display="block";clearTimeout(window.__GL_TOAST_TIMER__);window.__GL_TOAST_TIMER__=setTimeout(()=>{el.style.display="none"},1700)}
function closeModals(){["menu","quiz","catalog","lesson","web","debug","palette","missions","characterModal","controlsModal","geometryHub"].forEach(id=>{const el=$(id);if(el)el.classList.add("hidden")});}

const state = {
  running:false, paused:true, mode:"combat", difficulty:"easy", online:false, mapMode:"new",
  hp:100, xp:loadInitialXP(), kills:storedInteger("gl_kills",0), controls:loadControls(), rebindingAction:null, buildPhysicsEnabled:safeStorageRead("gl_build_physics_v60")!=="off",
  questions:storedInteger("gl_questions",0),
  selected:0, build:false, firstPerson:false, cameraMode:"third", objectId:0, character:null, grabbedObject:null, grabDistance:5,
  yaw:0, pitch:.28, vy:0, grounded:true, walk:0, keys:{}, moveVelocity:null, exploreXPTime:0, exploreXPDistance:0, mazePlateCooldown:0,
  quiz:null, quizEnemy:null, quizKind:"combat", quizTime:60, quizTimer:null, quizCloseTimer:null, quizAnswered:false, trainingSession:null,
  missionSession:{kills:0,correct:0,resolved:0,studied:0,placed:0,unique:0,destroyed:0,found:0,parkour:0}, missionCompleted:new Set(), studiedFigures:new Set(), builtFigures:new Set(),
  peer:null, host:false, room:null, roomPassword:"", peerId:null, connections:new Map(), remotePlayers:new Map(),
  remoteObjects:new Map(), netAccumulator:0, roomAction:null, damageToastCooldown:0, errors:[],
  networkConnecting:false, relayActive:false, relayInFlight:false, relayAccumulator:0, relayEvents:[], relayInitialSnapshot:false, pendingPlacementSince:new Map(), waveCheckCooldown:0, relayErrorStreak:0, relayErrorNotified:false, myOwnerIds:new Set(["local"])
};
function canonicalControlCode(physicalCode){
  const aliases={run:"ShiftLeft"};
  for(const [action,bound] of Object.entries(state.controls||CONTROL_DEFAULTS))if(physicalCode===bound)return aliases[action]||CONTROL_DEFAULTS[action];
  if(physicalCode==="ShiftRight"&&!(["ShiftLeft","ShiftRight"].includes(state.controls?.run)))return "__UNBOUND__";
  if(physicalCode==="Delete"&&!(["KeyX","Delete"].includes(state.controls?.remove)))return "__UNBOUND__";
  // If a default key was reassigned, disable its old role instead of silently keeping both keys active.
  if(Object.values(CONTROL_DEFAULTS).includes(physicalCode))return "__UNBOUND__";
  return physicalCode;
}
function persistControls(){safeStorageWrite("gl_controls_v61",JSON.stringify(state.controls));}
function updateControlsHelp(){const el=$("gameHelp");if(!el)return;const k=a=>keyName(state.controls[a]||CONTROL_DEFAULTS[a]);el.innerHTML=`<kbd>${k("forward")}/${k("left")}/${k("backward")}/${k("right")}</kbd> mover · <kbd>${k("run")}</kbd> correr · <kbd>${k("jump")}</kbd> pular · <kbd>${k("attack")}/LMB</kbd> atacar · <kbd>${k("study")}</kbd> estudar · <kbd>${k("build")}</kbd> construir · <kbd>${k("catalog")}</kbd> catálogo · <kbd>RMB/${k("remove")}</kbd> remover · <kbd>${k("camera")}</kbd> câmera · <kbd>${k("physics")}</kbd> física · <kbd>ESC</kbd> menu`;}
function formatControlsUI(){const list=$("controlsList");if(list){list.innerHTML=Object.keys(CONTROL_DEFAULTS).map(action=>{const meta=CONTROL_LABELS[action],listening=state.rebindingAction===action;return `<div class="control-row"><div><strong>${meta[0]}</strong><small>${meta[1]}</small></div><button type="button" data-rebind-action="${action}" class="${listening?"listening":""}">${listening?"PRESSIONE UMA TECLA…":keyName(state.controls[action])}</button></div>`}).join("");list.querySelectorAll("[data-rebind-action]").forEach(btn=>btn.addEventListener("click",()=>{state.rebindingAction=btn.dataset.rebindAction;formatControlsUI();toast("Pressione a nova tecla; Esc cancela.")}));}updateControlsHelp();}
function openControlsSettings(){state.paused=true;state.keys={};state.rebindingAction=null;unlockMouse();$("menu")?.classList.add("hidden");formatControlsUI();$("controlsModal")?.classList.remove("hidden");}
function closeControlsSettings(){state.rebindingAction=null;state.keys={};$("controlsModal")?.classList.add("hidden");$("menu")?.classList.remove("hidden");state.paused=true;unlockMouse();}
function toggleBuildPhysics(){state.buildPhysicsEnabled=!state.buildPhysicsEnabled;safeStorageWrite("gl_build_physics_v60",state.buildPhysicsEnabled?"on":"off");const owners=state.myOwnerIds||new Set([state.peerId||"local"]);owners.add(state.peerId||"local");if(!state.buildPhysicsEnabled&&state.grabbedObject)state.grabbedObject=null;for(const o of placedObjects){if(!o||o.userData?.display||o.userData?.remote||!owners.has(o.userData?.owner))continue;o.userData.velocity ||= new THREE.Vector3();if(state.buildPhysicsEnabled){o.userData.frozen=false;o.userData.physics=true;o.userData.staticWorldBox=null;}else{o.userData.frozen=true;o.userData.physics=false;o.userData.velocity.set(0,0,0);o.userData.staticWorldBox=null;o.updateWorldMatrix(true,false);meshWorldBox(o);}}updateBuildPhysicsUI();toast(state.buildPhysicsEnabled?"⚙ Física ligada: suas construções podem cair, empilhar e se mover.":"🧊 Física desligada: suas construções ficam fixas, mas continuam sólidas.");if(state.online){for(const o of placedObjects){if(!o||o.userData?.display||o.userData?.remote||!owners.has(o.userData?.owner))continue;sendRoom({type:"place",id:o.userData.id,item:o.userData.itemId||o.userData.figure?.id,pos:[o.position.x,o.position.y,o.position.z],rot:[o.rotation.x,o.rotation.y,o.rotation.z],owner:o.userData.owner,physics:!!o.userData.physics});}}}
function updateBuildPhysicsUI(){for(const id of ["quickPhysicsBtn","buildPhysicsBtn"]){const b=$(id);if(!b)continue;b.textContent=state.buildPhysicsEnabled?"⚙ FÍSICA: LIGADA":"🧊 FÍSICA: DESLIGADA";b.setAttribute("aria-pressed",String(state.buildPhysicsEnabled));b.title=state.buildPhysicsEnabled?"Gravidade e movimento ativados para suas construções":"Suas construções ficam estáticas, mas continuam sólidas";}}
const savedCameraMode=safeStorageRead("gl_camera_mode");
if(["first","third","top","iso","side","fixed"].includes(savedCameraMode)){state.cameraMode=savedCameraMode;state.firstPerson=savedCameraMode==="first";}

// V52: XP usa uma única fonte de verdade; nível é sempre derivado do total acumulado.
// Motor Three.js / renderer não foi alterado.
function legacyXP(){
  try {
    const values=["gl_profile_xp_v51","gl_profile_xp_v50","gl_profile_xp_v49","gl_xp_v49_total","gl_xp_v48_total","gl_xp","gl_xp_total"]
      .map(k=>localStorage.getItem(k)).filter(v=>v!==null&&String(v).trim()!=="")
      .map(v=>Number(v)).filter(Number.isFinite).map(v=>Math.max(0,Math.floor(v)));
    for(const profileKey of ["gl_profile_v51","gl_profile_v50","gl_profile_v49"]){try{const obj=JSON.parse(localStorage.getItem(profileKey)||"null");if(Number.isFinite(Number(obj?.xp)))values.push(Math.max(0,Math.floor(Number(obj.xp))))}catch{}}
    return Math.max(0,...values);
  } catch { return Math.max(0,Math.floor(Number(state.xp)||0)); }
}
function safeReadXP(){
  try {
    const saved=localStorage.getItem(XP_STORAGE_KEY);
    if(saved!==null&&String(saved).trim()!==""){const value=Number(saved);if(Number.isFinite(value))return Math.max(0,Math.floor(value));}
    const migrated=legacyXP();localStorage.setItem(XP_STORAGE_KEY,String(migrated));return migrated;
  } catch { return Math.max(0,Math.floor(Number(state.xp)||0)); }
}
function persistStats(){safeStorageWrite("gl_kills",state.kills);safeStorageWrite("gl_questions",state.questions);safeStorageWrite("gl_profile_stats_v52",JSON.stringify({kills:state.kills,questions:state.questions,updatedAt:Date.now()}));}
function progressionFor(total){
  const xp=Math.max(0,Math.floor(Number.isFinite(Number(total))?Number(total):0));
  const level=Math.floor(xp/XP_PER_LEVEL)+1;
  const base=(level-1)*XP_PER_LEVEL,inside=xp-base,next=level*XP_PER_LEVEL;
  return {xp,level,base,inside,next,remaining:next-xp,pct:Math.max(0,Math.min(100,inside/XP_PER_LEVEL*100))};
}
function refreshProgressionUI(){
  // Não relê aliases antigos a cada frame; isso evitava que um valor atrasado reescrevesse a HUD.
  state.xp=Math.max(0,Math.floor(Number.isFinite(Number(state.xp))?Number(state.xp):0));
  const p=progressionFor(state.xp);
  const setText=(id,value)=>{const el=$(id);if(el)el.textContent=String(value)};
  const setBar=(id)=>{const el=$(id);if(el){el.style.width=p.pct+"%";el.setAttribute("aria-valuenow",String(p.inside));el.setAttribute("aria-valuemax",String(XP_PER_LEVEL));el.title=`${p.inside} de ${XP_PER_LEVEL} XP no nível ${p.level}; faltam ${p.remaining} XP para o nível ${p.level+1}`;}};
  setText("startLevel",p.level);setText("startXp",p.xp.toLocaleString("pt-BR"));
  setBar("startXpBar");setText("startXpNext",`${p.inside} / ${XP_PER_LEVEL} XP · faltam ${p.remaining} XP para o nível ${p.level+1}`);
  setText("levelHud",p.level);setText("xpText",p.xp.toLocaleString("pt-BR"));setBar("levelHudBar");
  setText("levelHudNext",`${p.inside} / ${XP_PER_LEVEL} XP · faltam ${p.remaining} XP para o nível ${p.level+1}`);
  document.documentElement.dataset.playerLevel=String(p.level);
  document.documentElement.dataset.playerXp=String(p.xp);
  return p;
}
function showLevelUp(level){
  const el=$("levelUpToast");
  if(!el){toast(`✨ NÍVEL ${level} ALCANÇADO!`);return;}
  el.textContent=`✦ NÍVEL ${level} ALCANÇADO ✦`;
  el.classList.remove("hidden");el.classList.remove("show");void el.offsetWidth;el.classList.add("show");
  clearTimeout(window.__GL_LEVELUP_TIMER__);
  window.__GL_LEVELUP_TIMER__=setTimeout(()=>{el.classList.remove("show");el.classList.add("hidden")},2800);
}
function awardXP(amount,reason=""){
  const add=Math.max(0,Math.floor(Number(amount)||0));
  if(!add)return progressionFor(state.xp);
  const current=Math.max(Math.max(0,Math.floor(Number(state.xp)||0)),safeReadXP());
  const before=progressionFor(current).level;
  state.xp=current+add;
  try{
    const total=String(state.xp);
    localStorage.setItem(XP_STORAGE_KEY,total);
    localStorage.setItem("gl_profile_v52",JSON.stringify({xp:state.xp,level:progressionFor(state.xp).level,updatedAt:Date.now()}));
  }catch{/* Progress still advances in this session if storage is blocked. */}
  const after=refreshProgressionUI();
  if(after.level>before)showLevelUp(after.level);
  toast(`+${add} XP${reason?" · "+reason:""}`);
  window.dispatchEvent(new CustomEvent("gl:xp-change",{detail:{...after,added:add,reason}}));
  return after;
}
window.__GL_AWARD_XP__=awardXP;
window.__GL_REFRESH_PROGRESS__=refreshProgressionUI;
window.__GL_GET_PROGRESS__=()=>progressionFor(state.xp);
window.addEventListener("storage",e=>{
  if(e.key===XP_STORAGE_KEY&&e.newValue!==null){const n=Number(e.newValue);if(Number.isFinite(n))state.xp=Math.max(state.xp,Math.max(0,Math.floor(n)));}
  refreshProgressionUI();
});
window.addEventListener("focus",()=>{const stored=safeReadXP();state.xp=Math.max(state.xp,stored);refreshProgressionUI();});
state.xp=Number.isFinite(state.xp)?Math.max(0,Math.floor(state.xp)):0;

function captureError(entry){state.errors.push({...entry,time:new Date().toISOString()});if(state.errors.length>80)state.errors.splice(0,state.errors.length-80);}
window.addEventListener("error", e => captureError({type:"error",message:e.message,source:e.filename,line:e.lineno,col:e.colno}));
window.addEventListener("unhandledrejection", e => captureError({type:"promise",message:String(e.reason)}));
window.__GL_GET_DIAGNOSTICS__=()=>({version:"64",mode:state.mode,map:state.mapMode,level:progressionFor(state.xp).level,xp:state.xp,kills:state.kills,questions:state.questions,online:state.online,relay:state.relayActive,errors:state.errors.slice(-20)});

/* ---------- THREE scene ---------- */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf3c9aa);
scene.fog = new THREE.Fog(0xf3c9aa, 42, 125);

const camera = new THREE.PerspectiveCamera(67, innerWidth/innerHeight, .05, 240);
camera.position.set(0, 4, 32);

const renderer = new THREE.WebGLRenderer({antialias:true, powerPreference:"high-performance", alpha:false, logarithmicDepthBuffer:true});
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.90;
$("game").appendChild(renderer.domElement);

// Cinematic lighting pass: same Three.js/WebGL renderer, with richer contrast and cooler fill.
scene.add(new THREE.HemisphereLight(0xd8eaff,0x263b35,1.22));
const sun = new THREE.DirectionalLight(0xffdfb4,2.35);
sun.position.set(18,38,12); sun.castShadow=true; sun.shadow.mapSize.set(3072,3072);
sun.shadow.camera.left=-55;sun.shadow.camera.right=55;sun.shadow.camera.top=55;sun.shadow.camera.bottom=-55;scene.add(sun);
const coolFill = new THREE.DirectionalLight(0x83baff,.52);coolFill.position.set(-30,18,-28);scene.add(coolFill);
const glow = new THREE.PointLight(0x61dcff,.92,85,2);glow.position.set(-16,8,-9);scene.add(glow);

const world = new THREE.Group(), statics=new THREE.Group(), actors=new THREE.Group(), objectG=new THREE.Group(), remoteG=new THREE.Group();
const classicMapG=new THREE.Group(), newMapG=new THREE.Group();
world.add(statics,actors,objectG,remoteG,classicMapG,newMapG);scene.add(world);

const colliders=[], hazards=[], enemies=[], placedObjects=[], particles=[];
// Broad-phase spatial indices: keep collision and floor queries local instead of
// scanning every map collider/platform on each movement sub-step.
const GL_SPATIAL_CELL_SIZE = 8;
const glColliderGrid = new Map();
const glFloorGrid = new Map();
let glFloorGridReady = false;
let glCollisionQueryStamp = 0;
function glCellKey(cx,cz){ return cx+","+cz; }
function glCellKeys(minX,maxX,minZ,maxZ){
  const keys=[];
  const x0=Math.floor(minX/GL_SPATIAL_CELL_SIZE),x1=Math.floor(maxX/GL_SPATIAL_CELL_SIZE);
  const z0=Math.floor(minZ/GL_SPATIAL_CELL_SIZE),z1=Math.floor(maxZ/GL_SPATIAL_CELL_SIZE);
  for(let cx=x0;cx<=x1;cx++)for(let cz=z0;cz<=z1;cz++)keys.push(glCellKey(cx,cz));
  return keys;
}
function glGridInsert(grid,key,item){let bucket=grid.get(key);if(!bucket){bucket=[];grid.set(key,bucket);}bucket.push(item);}
function glGridRemove(grid,key,item){const bucket=grid.get(key);if(!bucket)return;const i=bucket.indexOf(item);if(i>=0)bucket.splice(i,1);if(!bucket.length)grid.delete(key);}
function glUpdateGridEntry(grid,item,keysField,bounds){
  const next=glCellKeys(bounds.minX,bounds.maxX,bounds.minZ,bounds.maxZ),old=item[keysField]||[];
  if(old.length===next.length&&old.every((key,i)=>key===next[i]))return;
  for(const key of old)glGridRemove(grid,key,item);
  for(const key of next)glGridInsert(grid,key,item);
  item[keysField]=next;
}
function glRebuildColliderGrid(){
  glColliderGrid.clear();
  for(const c of colliders){c._glQueryStamp=0;c._glSpatialKeys=[];glUpdateGridEntry(glColliderGrid,c,"_glSpatialKeys",c);}
}
function glRebuildFloorGrid(){
  glFloorGrid.clear();
  glFloorGridReady = false;
  for(const reg of newFloorRegions){reg._glFloorKeys=[];let hx, hz;
    if(reg.type==='circle'){hx=hz=reg.r;}
    else if(reg.type==='rect'){
      const co=Math.abs(Math.cos(reg.rot||0)),si=Math.abs(Math.sin(reg.rot||0));
      hx=(reg.w*co+reg.d*si)/2;hz=(reg.w*si+reg.d*co)/2;
    }else{hx=(reg.w||0)/2;hz=(reg.d||0)/2;}
    glUpdateGridEntry(glFloorGrid,reg,"_glFloorKeys",{minX:reg.x-hx,maxX:reg.x+hx,minZ:reg.z-hz,maxZ:reg.z+hz});
  }
  glFloorGridReady = true;
}
function glUpdateMovingFloorRegion(reg){
  if(!reg)return;let hx,hz;
  if(reg.type==='circle'){hx=hz=reg.r;}
  else if(reg.type==='rect'){
    const co=Math.abs(Math.cos(reg.rot||0)),si=Math.abs(Math.sin(reg.rot||0));hx=(reg.w*co+reg.d*si)/2;hz=(reg.w*si+reg.d*co)/2;
  }else{hx=(reg.w||0)/2;hz=(reg.d||0)/2;}
  glUpdateGridEntry(glFloorGrid,reg,"_glFloorKeys",{minX:reg.x-hx,maxX:reg.x+hx,minZ:reg.z-hz,maxZ:reg.z+hz});
}
function glAnyNearbyCollider(x,z,r,test){
  const stamp=++glCollisionQueryStamp;
  const x0=Math.floor((x-r)/GL_SPATIAL_CELL_SIZE),x1=Math.floor((x+r)/GL_SPATIAL_CELL_SIZE);
  const z0=Math.floor((z-r)/GL_SPATIAL_CELL_SIZE),z1=Math.floor((z+r)/GL_SPATIAL_CELL_SIZE);
  for(let cx=x0;cx<=x1;cx++)for(let cz=z0;cz<=z1;cz++){
    const bucket=glColliderGrid.get(glCellKey(cx,cz));if(!bucket)continue;
    for(const c of bucket){if(c._glQueryStamp===stamp)continue;c._glQueryStamp=stamp;if(test(c))return true;}
  }
  return false;
}

// Coleções próprias da Cidade da Geometria. Elas precisam existir antes da construção
// do novo mundo; sem isso o construtor abortava e escondia todo o mapa novo.
const newFloorRegions=[], newColliderDefs=[], newHazards=[];
const explorationCollectibles=[];
// Atividades jogáveis das regiões V64+: ficam separadas da caça às formas do labirinto.
const islandPickups=[], islandHazards=[], islandIcePatches=[];
let islandRace={active:false,nextGate:1,startedAt:0,cooldownUntil:0,best:Number(safeStorageRead("gl_v64_island_race_best"))||Infinity};
let ruinsRuneCount=0, ruinsTreasure=null;
function loadClaimedFormRewards(){try{const list=JSON.parse(safeStorageRead("gl_form_xp_claimed_v61")||"[]");return new Set(Array.isArray(list)?list.filter(x=>typeof x==="string"):[])}catch{return new Set()}}
const formRewardsClaimed=loadClaimedFormRewards();
function claimFormRewardOnce(name){if(formRewardsClaimed.has(name))return false;formRewardsClaimed.add(name);safeStorageWrite("gl_form_xp_claimed_v61",JSON.stringify([...formRewardsClaimed]));return true;}
let parkourCourse=[];
let parkourState={active:false,next:0,startedAt:0,best:Infinity,checkpointPos:null,checkpointNext:0,completed:false,iceUntil:0};
const parkourVoidRects=[];
let parkourStartPosition=null;
let parkourFinishPosition=null;
let parkourFinishCooldown=0;
let mazePressurePlate=null;
let mazeReturnTarget=null;

function mat(c,r=.62,m=.03,flat=false){return new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m,flatShading:flat})}
// Procedural albedo/bump maps add tactile detail without downloads or a different graphics engine.
function makeSurfaceTexture(kind,repeat=0.12,seed=1){
  const size=256,canvas=document.createElement('canvas');canvas.width=canvas.height=size;
  const ctx=canvas.getContext('2d'),img=ctx.createImageData(size,size);let rnd=(seed>>>0)||1;
  const rand=()=>{rnd=(rnd*1664525+1013904223)>>>0;return rnd/4294967296};
  const base={grass:[218,226,202],rock:[174,178,177],stone:[218,211,194],concrete:[214,218,217],wood:[198,157,108],leaves:[214,229,201],metal:[184,198,205]}[kind]||[220,220,220];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){
    const i=(y*size+x)*4,grain=(rand()-.5)*(kind==='rock'?62:kind==='wood'?38:kind==='grass'?30:24);
    const broad=Math.sin(x*.055+Math.sin(y*.031)*2.4)*4+Math.cos(y*.071+x*.019)*5;
    const bands=kind==='wood'?(Math.sin(y*.37+Math.sin(x*.04)*2)*12):kind==='metal'?(Math.sin(y*.84+Math.sin(x*.055))*8):kind==='rock'?(Math.sin(y*.21+x*.035)*7):0;
    const n=grain+broad+bands;img.data[i]=Math.max(0,Math.min(255,base[0]+n));img.data[i+1]=Math.max(0,Math.min(255,base[1]+n*(kind==='grass'?.83:1)));img.data[i+2]=Math.max(0,Math.min(255,base[2]+n*(kind==='grass'?.72:1)));img.data[i+3]=255;
  }
  ctx.putImageData(img,0,0);
  // Macro mottling and tiny mineral flecks make the texture read at gameplay camera distances.
  for(let i=0;i<260;i++){
    const r=rand()*(kind==='grass'?8:kind==='rock'?11:kind==='wood'?2.3:4.2)+.25;
    const x=rand()*size,y=rand()*size;
    const color=kind==='grass'?(rand()>.5?'rgba(68,105,54,.12)':'rgba(220,201,143,.13)'):
      kind==='rock'?(rand()>.5?'rgba(48,57,60,.17)':'rgba(245,240,222,.20)'):
      kind==='wood'?'rgba(78,48,25,.18)':'rgba(88,99,101,.11)';
    ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,r,r*(kind==='wood'?3.4:.7),rand()*Math.PI,0,Math.PI*2);ctx.fill();
  }
  const map=new THREE.CanvasTexture(canvas);map.wrapS=map.wrapT=THREE.RepeatWrapping;map.repeat.set(repeat,repeat);map.colorSpace=THREE.SRGBColorSpace;map.anisotropy=Math.min(renderer.capabilities.getMaxAnisotropy(),8);map.needsUpdate=true;
  const bumpCanvas=document.createElement('canvas');bumpCanvas.width=bumpCanvas.height=size;bumpCanvas.getContext('2d').drawImage(canvas,0,0);
  const bump=new THREE.CanvasTexture(bumpCanvas);bump.wrapS=bump.wrapT=THREE.RepeatWrapping;bump.repeat.set(repeat,repeat);if('NoColorSpace' in THREE)bump.colorSpace=THREE.NoColorSpace;bump.needsUpdate=true;
  return {map,bump};
}
const surfaceTextures={
  grass:makeSurfaceTexture('grass',.105,17),rock:makeSurfaceTexture('rock',.16,43),stone:makeSurfaceTexture('stone',.22,59),
  concrete:makeSurfaceTexture('concrete',.24,71),wood:makeSurfaceTexture('wood',.30,83),leaves:makeSurfaceTexture('leaves',.24,97),metal:makeSurfaceTexture('metal',2.6,109),
  rockUnit:makeSurfaceTexture('rock',2.4,131),woodUnit:makeSurfaceTexture('wood',2.8,149),leavesUnit:makeSurfaceTexture('leaves',2.7,167)
};
function applySurfaceTexture(material,key){const t=surfaceTextures[key];if(!t)return material;material.map=t.map;material.bumpMap=t.bump;material.bumpScale=({grass:.055,rock:.18,rockUnit:.12,stone:.075,concrete:.045,wood:.095,woodUnit:.075,leaves:.025,leavesUnit:.025,metal:.035})[key]||.05;material.needsUpdate=true;return material;}
function add(g,geo,c,pos,opts={}){const material=mat(c,opts.rough??.62,opts.m??.03,opts.flat??false);if(opts.texture)applySurfaceTexture(material,opts.texture);const m=new THREE.Mesh(geo,material);m.position.copy(pos);m.castShadow=opts.castShadow!==false;m.receiveShadow=opts.receiveShadow!==false;g.add(m);return m}
// Geometrias suavizadas para acabamento de cenário. Não mudam o renderer nem a física global.
const softenedGeometryCache=new Map(),roundedSlabGeometryCache=new Map();
function softenedBoxGeometry(w,h,d,radius=.12,bevel=.045){
  const key=[w,h,d,radius,bevel].map(v=>Number(v).toFixed(3)).join('|');
  if(softenedGeometryCache.has(key))return softenedGeometryCache.get(key);
  const b=Math.max(.004,Math.min(bevel,w*.14,h*.14,d*.14));
  const iw=Math.max(.04,w-2*b),ih=Math.max(.04,h-2*b),id=Math.max(.025,d-2*b);
  const r=Math.max(.006,Math.min(radius,iw*.48,ih*.48));
  const x0=-iw/2,x1=iw/2,y0=-ih/2,y1=ih/2,sh=new THREE.Shape();
  sh.moveTo(x0+r,y0);sh.lineTo(x1-r,y0);sh.quadraticCurveTo(x1,y0,x1,y0+r);
  sh.lineTo(x1,y1-r);sh.quadraticCurveTo(x1,y1,x1-r,y1);sh.lineTo(x0+r,y1);
  sh.quadraticCurveTo(x0,y1,x0,y1-r);sh.lineTo(x0,y0+r);sh.quadraticCurveTo(x0,y0,x0+r,y0);sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth:id,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:b,bevelThickness:b,curveSegments:6});
  geo.translate(0,0,-id/2);geo.computeVertexNormals();softenedGeometryCache.set(key,geo);return geo;
}
function roundedSlabGeometry(w,d,thickness,radius=.34,bevel=.06){
  const key=[w,d,thickness,radius,bevel].map(v=>Number(v).toFixed(3)).join('|');
  if(roundedSlabGeometryCache.has(key))return roundedSlabGeometryCache.get(key);
  const b=Math.max(.004,Math.min(bevel,w*.12,d*.12,thickness*.28));
  const iw=Math.max(.06,w-2*b),id=Math.max(.06,d-2*b),coreH=Math.max(.025,thickness-2*b);
  const r=Math.max(.01,Math.min(radius,iw*.48,id*.48));
  const x0=-iw/2,x1=iw/2,z0=-id/2,z1=id/2,sh=new THREE.Shape();
  sh.moveTo(x0+r,z0);sh.lineTo(x1-r,z0);sh.quadraticCurveTo(x1,z0,x1,z0+r);
  sh.lineTo(x1,z1-r);sh.quadraticCurveTo(x1,z1,x1-r,z1);sh.lineTo(x0+r,z1);
  sh.quadraticCurveTo(x0,z1,x0,z1-r);sh.lineTo(x0,z0+r);sh.quadraticCurveTo(x0,z0,x0+r,z0);sh.closePath();
  const geo=new THREE.ExtrudeGeometry(sh,{depth:coreH,steps:1,bevelEnabled:true,bevelSegments:3,bevelSize:b,bevelThickness:b,curveSegments:6});
  geo.translate(0,0,-coreH/2);geo.rotateX(-Math.PI/2);geo.computeVertexNormals();roundedSlabGeometryCache.set(key,geo);return geo;
}
function collider(x,z,w,d,h){colliders.push({minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2,minY:0,maxY:h})}
// Store the true oriented rectangle as well as its AABB. The AABB is only a broad-phase
// filter; using it as the final test made diagonal bridge railings block the entire bridge.
function rotatedCollider(target,x,z,w,d,h,rot=0,baseY=0){
  const cs=Math.abs(Math.cos(rot)),sn=Math.abs(Math.sin(rot)),hx=(w*cs+d*sn)/2,hz=(w*sn+d*cs)/2;
  target.push({minX:x-hx,maxX:x+hx,minZ:z-hz,maxZ:z+hz,minY:baseY,maxY:baseY+h,obb:{x,z,w,d,rot}});
}
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Shape de costa usado por terreno, acabamento e corrimão para que tudo acompanhe a mesma ilha.
function islandEdgeOffset(angle,seed=0,amplitude=1){
  return amplitude*(.48*Math.sin(angle*3+seed)+.29*Math.sin(angle*7+seed*1.7)+.13*Math.cos(angle*11-seed*.9));
}
function circleOverlapsCollider(c,x,z,r){
  if(x+r<c.minX||x-r>c.maxX||z+r<c.minZ||z-r>c.maxZ)return false;
  if(c.obb){
    const o=c.obb,cs=Math.cos(o.rot),sn=Math.sin(o.rot),dx=x-o.x,dz=z-o.z;
    const lx=dx*cs-dz*sn,lz=dx*sn+dz*cs;
    const qx=clamp(lx,-o.w/2,o.w/2),qz=clamp(lz,-o.d/2,o.d/2);
    const ax=lx-qx,az=lz-qz;return ax*ax+az*az<r*r;
  }
  const qx=clamp(x,c.minX,c.maxX),qz=clamp(z,c.minZ,c.maxZ),dx=x-qx,dz=z-qz;
  return dx*dx+dz*dz<r*r;
}
function aabbOverlapsColliderXZ(c,box){
  if(box.max.x<c.minX||box.min.x>c.maxX||box.max.z<c.minZ||box.min.z>c.maxZ)return false;
  if(!c.obb)return box.max.x>c.minX&&box.min.x<c.maxX&&box.max.z>c.minZ&&box.min.z<c.maxZ;
  const o=c.obb,cs=Math.cos(o.rot),sn=Math.sin(o.rot),cx=(box.min.x+box.max.x)/2,cz=(box.min.z+box.max.z)/2;
  const hx=(box.max.x-box.min.x)/2,hz=(box.max.z-box.min.z)/2,dx=cx-o.x,dz=cz-o.z;
  if(Math.abs(dx)>hx+o.w/2*Math.abs(cs)+o.d/2*Math.abs(sn))return false;
  if(Math.abs(dz)>hz+o.w/2*Math.abs(sn)+o.d/2*Math.abs(cs))return false;
  if(Math.abs(dx*cs-dz*sn)>o.w/2+hx*Math.abs(cs)+hz*Math.abs(sn))return false;
  if(Math.abs(dx*sn+dz*cs)>o.d/2+hx*Math.abs(sn)+hz*Math.abs(cs))return false;
  return true;
}
function block(x,z,w,d,h,c,rot=0){const b=add(statics,new THREE.BoxGeometry(w,h,d),c,new THREE.Vector3(x,h/2,z),{flat:true,rough:.56});b.rotation.y=rot;collider(x,z,w,d,h)}
function hazard(x,z,w,d,rot=0){const h=add(statics,new THREE.BoxGeometry(w,.13,d),0xff658d,new THREE.Vector3(x,.1,z),{flat:true});h.rotation.y=rot;h.material.emissive=new THREE.Color(0x74153c);h.material.emissiveIntensity=.28;hazards.push({mesh:h,w,d})}

add(statics,new THREE.CylinderGeometry(35,38,1.05,96),0x43535a,new THREE.Vector3(0,-.52,0),{rough:.97,flat:true,texture:'rock'});
add(statics,new THREE.CylinderGeometry(34.1,34.6,.15,96),0x4c7560,new THREE.Vector3(0,.02,0),{rough:.92,texture:'grass'});
const rim = new THREE.Mesh(new THREE.TorusGeometry(36.5,.58,16,64),mat(0x183b75,.43,.08));rim.rotation.x=Math.PI/2;rim.position.y=.06;rim.castShadow=true;statics.add(rim);
const grid = new THREE.GridHelper(68,34,0x3c627e,0x87b5c6);grid.material.transparent=true;grid.material.opacity=.18;grid.position.y=.08;statics.add(grid);

[
[-23,-5,10,2.8,2.5,0x173d7d,-.08],[-11,-13,6,4,3.5,0x1f5098,.16],[10,-5,11,2.8,2.5,0x173c7d,.12],
[23,-12,5,8,3.5,0x1e4a92,-.23],[0,9,7,2.5,4.4,0x1b4688,.06],[-24,10,3.2,7,3.8,0x24539a,.16],
[25,8,5,3,2.4,0x21509a,-.18],[9,20,3.2,7,3.2,0x193f7f,0],[-8,22,7,2.5,3.2,0x2b5698,-.15]
].forEach(b=>block(...b));
hazard(-16,-15,14,4,-.07);hazard(15,14,15,4,.14);hazard(-20,17,8,10,.04);hazard(22,-12,7,10,-.18);

function tree(x,z,s=.95){
  add(statics,new THREE.CylinderGeometry(.35*s,.48*s,2.7*s,12),0x765039,new THREE.Vector3(x,1.35*s,z));
  add(statics,new THREE.SphereGeometry(1.65*s,18,12),0x4f9862,new THREE.Vector3(x,3.6*s,z));
  add(statics,new THREE.SphereGeometry(1.04*s,18,12),0x68b777,new THREE.Vector3(x+.7*s,3.8*s,z-.1*s));
}
[[-31,-27],[-30,27],[30,27],[31,-27],[-3,-30],[4,30]].forEach(p=>tree(p[0],p[1]));

function label(text,x,y,z,scale=.7){
  const c=document.createElement("canvas");c.width=560;c.height=100;const ctx=c.getContext("2d");ctx.fillStyle="rgba(3,10,17,.82)";ctx.fillRect(0,0,560,100);ctx.fillStyle="#eff7ff";ctx.font="bold 27px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(text,280,50);
  const s=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));s.position.set(x,y,z);s.scale.set(5.1*scale,.92*scale,1);statics.add(s)
}
label("ARENA DE DESAFIOS",0,4.0,27,.72);

// Preserva o mapa clássico exatamente como foi criado na base estável.
[...statics.children].forEach(ch=>classicMapG.add(ch));
const classicColliderDefs=colliders.map(c=>({...c}));
const classicHazards=hazards.map(h=>({...h}));
classicMapG.visible=false;
// Barreiras visuais também no mapa clássico; o limite circular da física evita a queda.
const classicRail=0x416f8e;
const cr1=add(classicMapG,new THREE.BoxGeometry(64,.32,.5),classicRail,new THREE.Vector3(0,.75,-33));
const cr2=add(classicMapG,new THREE.BoxGeometry(64,.32,.5),classicRail,new THREE.Vector3(0,.75,33));
const cr3=add(classicMapG,new THREE.BoxGeometry(.5,.32,64),classicRail,new THREE.Vector3(-33,.75,0));
const cr4=add(classicMapG,new THREE.BoxGeometry(.5,.32,64),classicRail,new THREE.Vector3(33,.75,0));

// ---------- NOVO MUNDO: CIDADE DA GEOMETRIA (layout inspirado na arte de referência) ----------
function floatIsland(x,z,r,topColor,rockColor,opts={}){
  const top=add(newMapG,new THREE.CylinderGeometry(r,r+.35,.28,48),topColor,new THREE.Vector3(x,.03,z),{rough:.62});
  top.receiveShadow=true;
  const rock=add(newMapG,new THREE.CylinderGeometry(r*.58,r*.98,4.8,12),rockColor,new THREE.Vector3(x,-2.45,z),{rough:.78,flat:true});
  const rock2=add(newMapG,new THREE.CylinderGeometry(r*.28,r*.65,2.7,9),opts.rock2||rockColor,new THREE.Vector3(x,-5.9,z),{rough:.82,flat:true});
  const rim=new THREE.Mesh(new THREE.TorusGeometry(r-.08,.10,8,56),mat(opts.rim||0xffffff,.55,.02));rim.rotation.x=Math.PI/2;rim.position.set(x,.18,z);newMapG.add(rim);
  // safe walk area used by the player physics
  newFloorRegions.push({type:'circle',x,z,r:r-.35,y:.12});
  if(opts.trees){opts.trees.forEach(p=>nTree(x+p[0],z+p[1],p[2]||.9))}
  return {x,z,r};
}
function nblock(x,z,w,d,h,c,rot=0){
  const b=add(newMapG,softenedBoxGeometry(w,h,d,Math.min(.18,w*.10,d*.10),.045),c,new THREE.Vector3(x,h/2,z),{rough:.62,flat:false,texture:'concrete'});
  b.rotation.y=rot;
  rotatedCollider(newColliderDefs,x,z,w+.08,d+.08,h,rot,0);
  return b;
}
function nPath(x,z,w,d,c=0xe9d5ad,rot=0){
  const p=add(newMapG,new THREE.BoxGeometry(w,.16,d),c,new THREE.Vector3(x,.19,z),{rough:.78,texture:'stone'});
  p.rotation.y=rot;
  newFloorRegions.push({type:'rect',x,z,w,d,rot,y:.28});
  return p;
}
function cloud(x,y,z,s=1){
  const g=new THREE.Group(); g.position.set(x,y,z); newMapG.add(g);
  [[0,0,0,1.8],[-1.8,.15,.25,1.25],[1.6,.05,.25,1.35],[.35,.55,-.1,1.15]].forEach(([dx,dy,dz,r])=>{
    add(g,new THREE.SphereGeometry(r*s,18,12),0xffffff,new THREE.Vector3(dx*s,dy*s,dz*s),{rough:.9,castShadow:false,receiveShadow:false});
  });
  return g;
}
function lamp(x,z,c=0xffd36d,s=1){
  nblock(x,z,.16,.16,2.1,0x5a4437);
  const l=add(newMapG,new THREE.SphereGeometry(.28*s,14,10),c,new THREE.Vector3(x,2.28*s,z),{rough:.25,m:.06});
  l.material.emissive=new THREE.Color(c); l.material.emissiveIntensity=.55;
}
function building(x,z,w,d,h,wall,roof){
  const base=nblock(x,z,w,d,h,wall);
  const cap=add(newMapG,softenedBoxGeometry(w*1.065,.28,d*1.065,.22,.045),roof,new THREE.Vector3(x,h+.14,z),{rough:.43,metal:.08,texture:'stone'});
  const plinth=add(newMapG,softenedBoxGeometry(w*1.02,.28,d*1.02,.12,.035),0x56636a,new THREE.Vector3(x,.20,z),{rough:.78,texture:'rock'});
  // Recessed service band and warm metallic roof edging add depth to the silhouette.
  const fascia=add(newMapG,new THREE.BoxGeometry(w*1.035,.105,d*1.035),0x354b57,new THREE.Vector3(x,h-.34,z),{rough:.58,metal:.08,texture:'concrete'});
  const roofLip=add(newMapG,new THREE.BoxGeometry(w*1.06,.07,.10),0xc6a976,new THREE.Vector3(x,h+.285,z+d*.51),{rough:.35,metal:.18});
  cap.rotation.y=base.rotation.y;
  // Fachada contemporânea: janelas individuais com moldura e entrada central.
  const cols=Math.max(2,Math.min(6,Math.floor(w/1.45))),rows=Math.max(1,Math.min(3,Math.floor((h-.65)/1.0)));
  const winW=Math.min(.76,(w-1.0)/cols*.60),winH=Math.min(.58,Math.max(.30,(h-.95)/Math.max(1,rows)*.52));
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
    const wx=x+(col-(cols-1)/2)*(w-.95)/cols,wy=.55+row*((h-.9)/Math.max(1,rows));
    const frame=add(newMapG,softenedBoxGeometry(winW+.16,winH+.16,.10,.035,.012),0x304854,new THREE.Vector3(wx,wy,z+d/2+.035),{rough:.48,metal:.12,castShadow:false,receiveShadow:false,texture:'metal'});
    const glass=add(newMapG,new THREE.BoxGeometry(winW,winH,.075),0x478fa5,new THREE.Vector3(wx,wy,z+d/2+.086),{rough:.19,metal:.28,castShadow:false,receiveShadow:false});
    glass.material.emissive=new THREE.Color(0x124d69);glass.material.emissiveIntensity=.16;
  }
  const door=add(newMapG,softenedBoxGeometry(Math.min(1.05,w*.20),Math.min(1.75,h*.48),.10,.045,.015),0x4a3428,new THREE.Vector3(x,.10+Math.min(1.75,h*.48)/2,z+d/2+.06),{rough:.72,texture:'wood',castShadow:false,receiveShadow:false});
  const lintel=add(newMapG,new THREE.BoxGeometry(Math.min(1.35,w*.27),.13,.16),roof,new THREE.Vector3(x,Math.min(1.75,h*.48)+.20,z+d/2+.08),{rough:.30,metal:.08,castShadow:false,receiveShadow:false});
  // Molduras verticais iluminadas fazem as fachadas parecerem complexos, não simples blocos.
  for(const side of [-1,1]){
    const fin=add(newMapG,new THREE.BoxGeometry(.13,h*.82,.18),0xf2f6f4,new THREE.Vector3(x+side*(w*.46),h*.48,z+d/2+.09),{rough:.35,castShadow:false,receiveShadow:false});
  }
  // Lateral windows and wall pilasters prevent buildings from reading as single solid boxes.
  for(const side of [-1,1]){
    const wxSide=x+side*(w/2+.035);
    const sideCols=Math.max(1,Math.min(3,Math.floor(d/2.6)));
    for(let col=0;col<sideCols;col++){
      const wz=z+(col-(sideCols-1)/2)*(d-.8)/Math.max(1,sideCols);
      add(newMapG,new THREE.BoxGeometry(.075,winH+.10,winW+.10),0x334a55,new THREE.Vector3(wxSide,.8,wz),{rough:.46,metal:.1,castShadow:false,receiveShadow:false,texture:'metal'});
      const sideGlass=add(newMapG,new THREE.BoxGeometry(.075,winH,winW),0x4e9db3,new THREE.Vector3(wxSide+side*.025,.8,wz),{rough:.2,metal:.22,castShadow:false,receiveShadow:false});sideGlass.material.emissive=new THREE.Color(0x123f55);sideGlass.material.emissiveIntensity=.12;
    }
  }
  if(w>8&&h<4.5){
    const roofUnit=add(newMapG,new THREE.CylinderGeometry(w*.17,w*.20,.32,28),0x4dbde2,new THREE.Vector3(x,h+.35,z),{rough:.28,metal:.14});
    const roofRing=add(newMapG,new THREE.TorusGeometry(w*.16,.065,8,32),0xbaf2ff,new THREE.Vector3(x,h+.54,z),{rough:.24,metal:.10});roofRing.rotation.x=Math.PI/2;
  }
  return {x,z,w,d,h};
}
function islandRail(cx,cz,r,skipAngles=[],seed=0){
  const segs=72,h=1.36,TAU=Math.PI*2;
  const gap=Math.min(.22,Math.max(.16,Math.asin(Math.min(.95,4.35/r))+.035));
  const coastR=a=>r+.18+islandEdgeOffset(a,seed,1.68);
  const angleDiff=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
  const inGap=a=>skipAngles.some(sa=>Math.abs(angleDiff(a,sa))<gap);
  // Postes de proteção nas bordas, com interrupções nas entradas das pontes.
  for(let i=0;i<segs;i++){
    const a=(i/segs)*TAU;
    if(inGap(a))continue;
    const rr=coastR(a),x=cx+Math.cos(a)*rr,z=cz+Math.sin(a)*rr;
    const post=add(newMapG,new THREE.CylinderGeometry(.11,.14,h,8),0xffe8b8,new THREE.Vector3(x,h/2,z),{rough:.52});
    post.castShadow=true;
  }
  // Corrimão curvo criado em arcos separados; não há anel visual atravessando uma ponte.
  const gaps=skipAngles.map(a=>((a%TAU)+TAU)%TAU).sort((a,b)=>a-b);
  if(!gaps.length){
    const fullPts=[];for(let i=0;i<=segs;i++){const a=i/segs*TAU,rr=coastR(a);fullPts.push(new THREE.Vector3(cx+Math.cos(a)*rr,.98,cz+Math.sin(a)*rr));}
    const curve=new THREE.CatmullRomCurve3(fullPts);const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,segs,.06,6,false),mat(0xffe8b8,.5,.02));newMapG.add(rail);
  }else{
    for(let i=0;i<gaps.length;i++){
      const start=gaps[i]+gap;
      let end=(i+1<gaps.length?gaps[i+1]:gaps[0]+TAU)-gap;
      if(end<=start)end+=TAU;
      const span=end-start;if(span<.08)continue;
      const steps=Math.max(8,Math.ceil(span*r/1.6)),pts=[];
      for(let j=0;j<=steps;j++){const a=start+span*j/steps,rr=coastR(a);pts.push(new THREE.Vector3(cx+Math.cos(a)*rr,.98,cz+Math.sin(a)*rr));}
      const curve=new THREE.CatmullRomCurve3(pts);
      const rail=new THREE.Mesh(new THREE.TubeGeometry(curve,steps,.06,6,false),mat(0xffe8b8,.5,.02));rail.castShadow=true;newMapG.add(rail);
    }
  }
}
function bridge(x,z,w,d,c=0xd5b27c,rot=0){
  const b=add(newMapG,new THREE.BoxGeometry(w,.24,d),c,new THREE.Vector3(x,.16,z),{rough:.66});b.rotation.y=rot;
  newFloorRegions.push({type:'rect',x,z,w,d,rot,y:.28});
  return b;
}
function nlabel(text,x,y,z,scale=.7,color='#ffffff'){
  const c=document.createElement('canvas');c.width=680;c.height=120;const ctx=c.getContext('2d');
  ctx.fillStyle='rgba(7,27,55,.88)';if(typeof ctx.roundRect==='function'){ctx.roundRect(8,8,664,104,26);ctx.fill();}else{const x=8,y=8,w=664,h=104,r=26;ctx.beginPath();ctx.moveTo(x+r,y);ctx.arcTo(x+w,y,x+w,y+h,r);ctx.arcTo(x+w,y+h,x,y+h,r);ctx.arcTo(x,y+h,x,y,r);ctx.arcTo(x,y,x+w,y,r);ctx.closePath();ctx.fill();}
  ctx.fillStyle=color;ctx.font='900 30px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,340,60);
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(c),transparent:true,depthWrite:false}));sp.position.set(x,y,z);sp.scale.set(5.7*scale,1.02*scale,1);newMapG.add(sp);
}
function nTree(x,z,s=1){
  // Irregular tapered trunk with bark texture, root flare and branch silhouettes.
  const trunk=add(newMapG,new THREE.CylinderGeometry(.20*s,.48*s,2.85*s,14),0x65452f,new THREE.Vector3(x,1.34*s,z),{rough:.96,texture:'woodUnit'});
  trunk.rotation.z=Math.sin(x*1.7+z)*.065;trunk.receiveShadow=true;
  add(newMapG,new THREE.CylinderGeometry(.56*s,.70*s,.16*s,14),0x514333,new THREE.Vector3(x,.13*s,z),{rough:.96,texture:'rockUnit',castShadow:false,receiveShadow:false});
  for(const side of [-1,1]){
    const branch=add(newMapG,new THREE.CylinderGeometry(.075*s,.16*s,1.12*s,9),0x6e4a31,new THREE.Vector3(x+side*.37*s,2.28*s,z+.04*s),{rough:.94,texture:'woodUnit',castShadow:false});
    branch.rotation.z=side*.62;branch.rotation.x=side*.10;
  }
  // Overlapping icosahedral leaf masses create a less spherical, denser canopy.
  const greens=[0x174832,0x205b39,0x2c6d42,0x3d7e49,0x57894d];
  const crowns=[[0,3.15,0,1.04],[-.70,2.92,.08,.78],[.66,2.96,-.10,.82],[.06,3.72,.02,.76],[-.18,2.84,-.62,.68],[.38,3.34,.50,.62],[-.47,3.42,.42,.58]];
  crowns.forEach((q,i)=>{
    const crown=add(newMapG,new THREE.IcosahedronGeometry(q[3]*s,1),greens[(i+Math.abs(Math.floor(x+z)))%greens.length],new THREE.Vector3(x+q[0]*s,q[1]*s,z+q[2]*s),{rough:.94,texture:'leavesUnit',castShadow:i<5,receiveShadow:true});
    crown.scale.set(1+Math.sin(i*2.1)*.12,1.06+(i%3)*.08,.88+Math.cos(i*1.4)*.12);
    crown.rotation.set(.13*i,.47*i,.09*i);
  });
  // Undergrowth at the trunk helps the canopy blend into the terrain.
  for(let i=0;i<4;i++){
    const a=i*Math.PI/2+((x-z)*.025),rr=.72*s;
    add(newMapG,new THREE.IcosahedronGeometry(.22*s,1),greens[(i+1)%greens.length],new THREE.Vector3(x+Math.cos(a)*rr,.24*s,z+Math.sin(a)*rr),{rough:.96,texture:'leavesUnit',castShadow:false,receiveShadow:false});
  }
  newColliderDefs.push({minX:x-1.22*s,maxX:x+1.22*s,minZ:z-1.22*s,maxZ:z+1.22*s,maxY:4.5*s});
}
function nPortal(x,z,c){add(newMapG,new THREE.CylinderGeometry(.85,1,.22,20),c,new THREE.Vector3(x,.3,z));const r=add(newMapG,new THREE.TorusGeometry(1.55,.20,14,36),c,new THREE.Vector3(x,1.8,z),{m:.2,rough:.33});r.rotation.y=Math.PI/2;add(newMapG,new THREE.SphereGeometry(.44,18,12),0xeafcff,new THREE.Vector3(x,1.8,z));}
function crane(x,z,scale=1){
  const c=0xd99635;add(newMapG,new THREE.BoxGeometry(.34,4.6*scale,.34),c,new THREE.Vector3(x,2.35*scale,z));
  add(newMapG,new THREE.BoxGeometry(4.6*scale,.24,.26),c,new THREE.Vector3(x+2.1*scale,4.55*scale,z));
  add(newMapG,new THREE.BoxGeometry(.18,1.8*scale,.18),0x6a5947,new THREE.Vector3(x+2.1*scale,3.7*scale,z));
  add(newMapG,new THREE.BoxGeometry(.22,.22,.22),0x444a54,new THREE.Vector3(x+2.7*scale,2.8*scale,z));
  newColliderDefs.push({minX:x-.35*scale,maxX:x+4.5*scale,minZ:z-.45*scale,maxZ:z+.45*scale,maxY:4.9*scale});
}

function createProfessorBetinho(){
  // Professor reposicionado em uma área livre e visível do hub principal.
  // Coordenadas fora do eixo central evitam que o cristal/monumento o esconda.
  const px=-8.2, pz=8.2;
  const mat=(color,roughness=.75,metalness=.02)=>new THREE.MeshStandardMaterial({color,roughness,metalness});

  // Pedestal colorido que torna o local do NPC fácil de localizar à distância.
  const pedestal=new THREE.Mesh(new THREE.CylinderGeometry(1.08,1.22,.20,32),mat(0x29465b,.48,.05));
  pedestal.position.set(px,.47,pz);pedestal.castShadow=true;pedestal.receiveShadow=true;newMapG.add(pedestal);
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(.88,.91,.055,32),mat(0x51cbd0,.36,.08));
  platform.position.set(px,.595,pz);platform.receiveShadow=true;newMapG.add(platform);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1.00,.065,10,48),new THREE.MeshStandardMaterial({color:0xffcf67,roughness:.34,metalness:.12,emissive:0x6f4300,emissiveIntensity:.25}));
  ring.rotation.x=Math.PI/2;ring.position.set(px,.63,pz);ring.castShadow=true;newMapG.add(ring);

  const g=new THREE.Group();
  const coat=mat(0xf4f5ef), skin=mat(0xc98d62), hair=mat(0x403027), pants=mat(0x263c59), shoe=mat(0x202630), shirt=mat(0x3aa6a0), gold=mat(0xf2c14e);
  function part(geo,m,x,y,z){const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;g.add(o);return o;}
  // Modelo 3D: jaleco, camisa, gravata, calça, sapatos, cabelo e óculos.
  part(new THREE.CylinderGeometry(.48,.62,1.25,12),coat,0,1.45,0);
  part(new THREE.BoxGeometry(.18,.82,.12),shirt,0,1.48,.34);
  part(new THREE.BoxGeometry(.10,.28,.08),gold,0,1.53,.415);
  part(new THREE.CylinderGeometry(.23,.27,.72,10),pants,-.22,.48,0);
  part(new THREE.CylinderGeometry(.23,.27,.72,10),pants,.22,.48,0);
  part(new THREE.BoxGeometry(.32,.16,.48),shoe,-.22,.12,.08);
  part(new THREE.BoxGeometry(.32,.16,.48),shoe,.22,.12,.08);
  part(new THREE.SphereGeometry(.43,20,16),skin,0,2.38,0);
  part(new THREE.SphereGeometry(.445,16,10,0,Math.PI*2,0,Math.PI*.58),hair,0,2.52,-.015);
  part(new THREE.BoxGeometry(.72,.10,.22),hair,0,2.70,.04);
  const glasses=mat(0x222a32,.25);
  part(new THREE.BoxGeometry(.30,.13,.055),glasses,-.19,2.40,.39);
  part(new THREE.BoxGeometry(.30,.13,.055),glasses,.19,2.40,.39);
  part(new THREE.BoxGeometry(.12,.045,.05),glasses,0,2.40,.40);
  const armL=part(new THREE.CylinderGeometry(.12,.15,.78,10),coat,-.60,1.48,0);armL.rotation.z=-.35;
  const armR=part(new THREE.CylinderGeometry(.12,.15,.78,10),coat,.60,1.48,0);armR.rotation.z=.35;
  part(new THREE.BoxGeometry(.48,.42,.12),mat(0x2769a8),.55,1.22,.30);
  part(new THREE.BoxGeometry(.42,.035,.10),gold,.55,1.43,.37);
  g.position.set(px,.59,pz);g.scale.setScalar(.82);g.name='Professor Betinho';g.userData={npc:true,npcId:'professor-betinho',displayName:'Professor Betinho'};
  newMapG.add(g);
  // Placas em alturas separadas para o nome não se misturar com a cabeça do NPC.
  nlabel('PROFESSOR BETINHO',px,3.55,pz,1.03,'#ffe28a');
  nlabel('AULAS DE GEOMETRIA',px,3.02,pz,.58,'#d6f8ff');
  return g;
}
function buildNewWorld(){
  if(newMapG.children.length)return;
  newFloorRegions.length=0;newColliderDefs.length=0;newHazards.length=0;
  islandPickups.length=0;islandHazards.length=0;islandIcePatches.length=0;
  islandRace={active:false,nextGate:1,startedAt:0,cooldownUntil:0,best:Number(safeStorageRead("gl_v64_island_race_best"))||Infinity};
  ruinsRuneCount=0;ruinsTreasure=null;

  scene.background.set(0x6098ba);
  scene.fog.color.set(0x86acb8); scene.fog.near=155; scene.fog.far=440;
  for(let i=0;i<25;i++){
    const px=-108+(i*37)%216, pz=-106+((i*53)%212), py=22+(i%7)*3.1;
    cloud(px,py,pz,.82+(i%4)*.14);
  }
  const decorIslands=[[-102,43,4.4],[102,43,4.1],[-96,-43,3.8],[96,-43,3.9],[-108,107,4.2],[108,-106,4.0],[-99,72,3.0],[99,72,3.3]];
  decorIslands.forEach(([x,z,r],i)=>{
    add(newMapG,new THREE.CylinderGeometry(r*.68,r*1.02,3.4,20),0x52616c,new THREE.Vector3(x,-1.7,z),{rough:.88,flat:true});
    add(newMapG,new THREE.CylinderGeometry(r*.92,r*1.00,.24,40),0x69c874,new THREE.Vector3(x,.02,z),{rough:.82});
    if(i%2===0)nTree(x,z,.67);
  });

  function islandShape(radius,seed,amplitude=.7,steps=72,hole=null){
    const sh=new THREE.Shape();
    for(let i=0;i<steps;i++){
      const a=i/steps*Math.PI*2,rr=radius+islandEdgeOffset(a,seed,amplitude);
      const px=Math.cos(a)*rr,pz=Math.sin(a)*rr;
      if(i===0)sh.moveTo(px,pz);else sh.lineTo(px,pz);
    }
    sh.closePath();
    if(hole&&hole.w>0&&hole.d>0){
      const hx=hole.w/2,hz=hole.d/2,path=new THREE.Path();
      // O contorno interno em sentido horário cria uma abertura real na geometria da ilha.
      path.moveTo(-hx,-hz);path.lineTo(-hx,hz);path.lineTo(hx,hz);path.lineTo(hx,-hz);path.closePath();sh.holes.push(path);
    }
    return sh;
  }
  function islandExtrude(shape,depth,y,x,z,sideColor,topColor,bevel=.18){
    const geo=new THREE.ExtrudeGeometry(shape,{depth,steps:1,bevelEnabled:true,bevelSegments:4,bevelSize:bevel,bevelThickness:Math.min(.18,bevel),curveSegments:6});
    geo.rotateX(Math.PI/2);geo.computeVertexNormals();
    const side=applySurfaceTexture(mat(sideColor,.94,.035,true),'rock'),top=applySurfaceTexture(mat(topColor,.94,.015,false),'grass');
    const mesh=new THREE.Mesh(geo,[side,top]);mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;newMapG.add(mesh);return mesh;
  }
  function cityIsland(x,z,r,topColor,rockColor,opts={}){
    const seed=opts.seed??(Math.abs(Math.round(x*2+z*3))%91);
    // Corpo profundo e orgânico: a face superior fica encoberta pelo tapete de terreno,
    // enquanto as faces laterais formam falésias facetadas em vez de um disco cilíndrico.
    islandExtrude(islandShape(r+.48,seed,2.00,128,opts.hole||null),8.1,.10,x,z,rockColor,rockColor,.28);
    const turfColor=new THREE.Color(topColor),turfEdge=turfColor.clone().multiplyScalar(.78).getHex();
    islandExtrude(islandShape(r-.12,seed,1.68,128,opts.hole||null),.46,.36,x,z,turfEdge,topColor,.13);
    // Anel de costa segue o contorno irregular da ilha, não um círculo perfeito.
    const edgePts=[];for(let i=0;i<192;i++){const a=i/192*Math.PI*2,rr=r-.12+islandEdgeOffset(a,seed,1.68);edgePts.push(new THREE.Vector3(x+Math.cos(a)*rr,.42,z+Math.sin(a)*rr));}
    const coastCurve=new THREE.CatmullRomCurve3(edgePts,true,'centripetal',.18);
    const rim=new THREE.Mesh(new THREE.TubeGeometry(coastCurve,240,.17,10,true),mat(opts.rim||0xfff1d0,.30,.08));rim.castShadow=true;newMapG.add(rim);
    // Erosion bands follow the irregular cliff perimeter for layered, less toy-like rock faces.
    for(let band=0;band<3;band++){
      const bandPts=[];for(let j=0;j<160;j++){const a=j/160*Math.PI*2,rr=r+.43+islandEdgeOffset(a,seed,1.88)-band*.10;bandPts.push(new THREE.Vector3(x+Math.cos(a)*rr,-1.55-band*2.05,z+Math.sin(a)*rr));}
      const curve=new THREE.CatmullRomCurve3(bandPts,true,'centripetal',.16);
      const rockBand=new THREE.Mesh(new THREE.TubeGeometry(curve,190,.105+(band===1?.035:0),7,true),mat([0x403f3a,0x827767,0x363f40][band],.96,.02,true));rockBand.castShadow=true;rockBand.receiveShadow=true;newMapG.add(rockBand);
    }
    // Cristas rochosas pontiagudas visíveis por baixo dão às ilhas a silhueta de arquipélago flutuante.
    for(let i=0;i<10;i++){
      const a=(i/10)*Math.PI*2+seed*.07,rr=r*(.38+(i%3)*.13),h=3.8+(i%4)*1.05;
      const spike=add(newMapG,new THREE.ConeGeometry(.95+(i%3)*.20,h,5),i%2?(opts.rock2||rockColor):rockColor,new THREE.Vector3(x+Math.cos(a)*rr,-7.9-h*.12,z+Math.sin(a)*rr),{rough:.92,flat:true});
      spike.rotation.z=Math.cos(a)*.14;spike.rotation.x=Math.sin(a)*.14;
    }
    // Cascatas ciano em pontos alternados da falésia, com material leve e emissivo.
    const falls=opts.waterfalls??3;
    for(let i=0;i<falls;i++){
      const a=(i/falls)*Math.PI*2+seed*.11,rr=r+.65+islandEdgeOffset(a,seed,1.68);
      const geo=new THREE.PlaneGeometry(.72+(i%2)*.22,4.8+(i%3)*.7);
      const material=new THREE.MeshStandardMaterial({color:i%2?0x3bbff3:0x63efff,emissive:0x087ea8,emissiveIntensity:.28,transparent:true,opacity:.58,roughness:.24,metalness:.08,side:THREE.DoubleSide,depthWrite:false});
      const fall=new THREE.Mesh(geo,material);fall.position.set(x+Math.cos(a)*rr,-2.0,z+Math.sin(a)*rr);fall.rotation.y=Math.PI/2-a;newMapG.add(fall);
      const pool=add(newMapG,new THREE.CylinderGeometry(.7,.9,.08,18),0x3fc8e8,new THREE.Vector3(x+Math.cos(a)*(rr-.1),-4.45,z+Math.sin(a)*(rr-.1)),{rough:.24,m:.08});pool.material.emissive=new THREE.Color(0x146f9b);pool.material.emissiveIntensity=.26;
    }
    // Área de caminhada fica dentro da menor possível variação da costa.
    newFloorRegions.push({type:'circle',x,z,r:r-1.55,y:.36,islandFloor:true});
    if(opts.trees)opts.trees.forEach(t=>nTree(x+t[0],z+t[1],t[2]||1));
    return {x,z,r,seed};
  }
  function scatterIslandNature(island,neighbors=[],seed=1){
    // Instancing keeps the islands rich in detail without creating hundreds of separate draw calls.
    let rnd=(seed>>>0)||1;const rand=()=>{rnd=(rnd*1664525+1013904223)>>>0;return rnd/4294967296;};
    const angleBlocked=a=>neighbors.some(n=>{const target=Math.atan2(n.z-island.z,n.x-island.x),d=Math.atan2(Math.sin(a-target),Math.cos(a-target));return Math.abs(d)<.31;});
    const bushCount=island.r>32?58:42,rockCount=island.r>32?26:20;
    const bushGeo=new THREE.IcosahedronGeometry(.48,1),bushMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.96});
    const bushes=new THREE.InstancedMesh(bushGeo,bushMat,bushCount);bushes.castShadow=false;bushes.receiveShadow=true;
    const rockGeo=new THREE.DodecahedronGeometry(.38,0),rockMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.97});
    const rocks=new THREE.InstancedMesh(rockGeo,rockMat,rockCount);rocks.castShadow=false;rocks.receiveShadow=true;
    const flowerGeo=new THREE.SphereGeometry(.115,8,6),flowerMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.02});
    const flowers=new THREE.InstancedMesh(flowerGeo,flowerMat,Math.max(8,Math.floor(bushCount*.32)));flowers.castShadow=false;flowers.receiveShadow=false;
    const dummy=new THREE.Object3D(),greenPalette=[0x183f2d,0x24583a,0x326d43,0x4b804b,0x718c54],rockPalette=[0x535a58,0x6b6d66,0x817b70,0x3d494b],flowerPalette=[0xf0cf71,0xf4e7d6,0xd88a95,0x9a9af1];
    let bi=0,ri=0,fi=0,tries=0;
    while(bi<bushCount&&tries<bushCount*12){tries++;const a=rand()*Math.PI*2;if(angleBlocked(a))continue;const rr=island.r*(.58+rand()*.27);if(rr>island.r-3.1)continue;const sc=.45+rand()*.55;dummy.position.set(island.x+Math.cos(a)*rr,.42+sc*.22,island.z+Math.sin(a)*rr);dummy.rotation.set(rand()*.25,rand()*Math.PI*2,rand()*.20);dummy.scale.set(sc*(.85+rand()*.35),sc*(.60+rand()*.25),sc*(.85+rand()*.35));dummy.updateMatrix();bushes.setMatrixAt(bi,dummy.matrix);bushes.setColorAt(bi,new THREE.Color(greenPalette[Math.floor(rand()*greenPalette.length)]));bi++;}
    tries=0;while(ri<rockCount&&tries<rockCount*12){tries++;const a=rand()*Math.PI*2;if(angleBlocked(a))continue;const rr=island.r*(.55+rand()*.31);if(rr>island.r-2.8)continue;const sc=.35+rand()*.75;dummy.position.set(island.x+Math.cos(a)*rr,.40+sc*.11,island.z+Math.sin(a)*rr);dummy.rotation.set(rand(),rand()*Math.PI*2,rand());dummy.scale.set(sc,sc*(.45+rand()*.6),sc*(.8+rand()*.5));dummy.updateMatrix();rocks.setMatrixAt(ri,dummy.matrix);rocks.setColorAt(ri,new THREE.Color(rockPalette[Math.floor(rand()*rockPalette.length)]));ri++;}
    while(fi<flowers.count){const a=rand()*Math.PI*2;if(angleBlocked(a))continue;const rr=island.r*(.57+rand()*.24);if(rr>island.r-3)continue;const sc=.55+rand()*.55;dummy.position.set(island.x+Math.cos(a)*rr,.48,island.z+Math.sin(a)*rr);dummy.rotation.set(0,rand()*Math.PI*2,0);dummy.scale.set(sc,sc,sc);dummy.updateMatrix();flowers.setMatrixAt(fi,dummy.matrix);flowers.setColorAt(fi,new THREE.Color(flowerPalette[Math.floor(rand()*flowerPalette.length)]));fi++;if(fi>=flowers.count)break;}
    bushes.count=bi;rocks.count=ri;bushes.instanceMatrix.needsUpdate=true;rocks.instanceMatrix.needsUpdate=true;flowers.instanceMatrix.needsUpdate=true;if(bushes.instanceColor)bushes.instanceColor.needsUpdate=true;if(rocks.instanceColor)rocks.instanceColor.needsUpdate=true;if(flowers.instanceColor)flowers.instanceColor.needsUpdate=true;
    newMapG.add(bushes,rocks,flowers);
  }

  function bridgeBetween(a,b,width=7.4,c=0xf1dfc5){
    const dx=b.x-a.x,dz=b.z-a.z,dist=Math.hypot(dx,dz);
    const ux=dx/dist,uz=dz/dist;
    // Three.js rotation Y inclina o eixo X local para (cos(rot), -sin(rot).
    // O ângulo convencional atan2(dz,dx) fazia a ponte virar para o lado errado.
    const rot=Math.atan2(-dz,dx);
    const startDist=Math.max(0,a.r-4.2),endDist=Math.max(0,b.r-4.2);
    const len=Math.max(8,dist-startDist-endDist);
    const midX=a.x+ux*(startDist+len/2),midZ=a.z+uz*(startDist+len/2);
    // Base estrutural escura e deck superior em pedra clara para dar profundidade à ponte.
    const under=add(newMapG,roundedSlabGeometry(len+.45,width+.50,.58,.34,.06),0x596b81,new THREE.Vector3(midX,-.22,midZ),{rough:.74,flat:false});under.rotation.y=rot;
    const g=add(newMapG,roundedSlabGeometry(len,width,.22,.32,.045),c,new THREE.Vector3(midX,.12,midZ),{rough:.62,flat:false,texture:'stone'});
    g.rotation.y=rot;
    newFloorRegions.push({type:'rect',x:midX,z:midZ,w:len,d:width,rot,y:.23});
    // Individual timber/stone deck slats add believable scale cues along every bridge.
    const plankCount=Math.max(8,Math.min(58,Math.floor(len/1.08)));
    for(let pi=0;pi<plankCount;pi++){
      const along=-len/2+(pi+.5)*len/plankCount,px=midX+ux*along,pz=midZ+uz*along;
      const plank=add(newMapG,roundedSlabGeometry(len/plankCount-.055,width-.48,.065,.10,.018),pi%4===0?0x927a5b:(pi%2?0xb4a080:0xa38d6d),new THREE.Vector3(px,.266,pz),{rough:.86,texture:pi%4===0?'wood':'stone',castShadow:false,receiveShadow:true});plank.rotation.y=rot;
      if(pi%5===0){const seam=add(newMapG,new THREE.BoxGeometry(.035,.018,width-.58),0x4e5961,new THREE.Vector3(px,.301,pz),{rough:.8,castShadow:false,receiveShadow:false});seam.rotation.y=rot;}
    }
    const nx=-uz,nz=ux;
    // Bordas coloridas orientam o jogador; são visuais, não relevos atravessáveis.
    for(const side of [-1,1]){
      const edge=add(newMapG,new THREE.BoxGeometry(len,.055,.24),side<0?0x65dffc:0xffdf93,new THREE.Vector3(midX+nx*side*(width*.39),.265,midZ+nz*side*(width*.39)),{rough:.28,m:.08});edge.rotation.y=rot;
    }
    // Faixa central discreta ajuda a ler a direção da ponte. É somente visual e não interfere na física.
    const lane=add(newMapG,new THREE.BoxGeometry(Math.max(1,len*.94),.026,.14),0xa7eaf0,new THREE.Vector3(midX,.252,midZ),{rough:.34,m:.04,castShadow:false,receiveShadow:false});
    lane.rotation.y=rot;lane.material.emissive=new THREE.Color(0x236f87);lane.material.emissiveIntensity=.12;
    for(const end of [-1,1])for(const side of [-1,1]){
      const along=end*(len/2-1.2),bx=midX+ux*along+nx*side*(width*.39),bz=midZ+uz*along+nz*side*(width*.39);
      const marker=add(newMapG,new THREE.SphereGeometry(.16,10,8),side<0?0x5fe7ff:0xffdf93,new THREE.Vector3(bx,.36,bz),{rough:.22,m:.10,castShadow:false,receiveShadow:false});
      marker.material.emissive=new THREE.Color(marker.material.color);marker.material.emissiveIntensity=.45;
    }
    // Arcos inferiores repetidos dão profundidade à estrutura sem interferir na faixa caminhável.
    const archCount=Math.max(2,Math.floor(len/8));
    for(let i=1;i<archCount;i++){
      const along=-len/2+len*i/archCount,ax=midX+ux*along,az=midZ+uz*along;
      const support=add(newMapG,new THREE.BoxGeometry(.22,1.35,width*.74),0x53657a,new THREE.Vector3(ax,-.62,az),{rough:.78,flat:true,castShadow:false,receiveShadow:false});support.rotation.y=rot;
      const brace=add(newMapG,new THREE.BoxGeometry(1.25,.13,.13),0x9caec0,new THREE.Vector3(ax,.02,az),{rough:.62,castShadow:false,receiveShadow:false});brace.rotation.y=rot;
    }
    // Corrimãos seguem a normal real da ponte e usam colisão OBB exata.
    for(const side of [-1,1]){
      const rail=add(newMapG,softenedBoxGeometry(len,.30,.14,.055,.022),0x7d6952,new THREE.Vector3(midX+nx*side*(width*.47),.48,midZ+nz*side*(width*.47)),{rough:.72,texture:'wood'});
      rail.rotation.y=rot;
      rotatedCollider(newColliderDefs,midX+nx*side*(width*.47),midZ+nz*side*(width*.47),len,.16,.34,rot,.31);
      const count=Math.max(2,Math.floor(len/3.8));
      for(let k=0;k<=count;k++){
        const along=-len/2+(len*k/count),px=midX+ux*along+nx*side*(width*.47),pz=midZ+uz*along+nz*side*(width*.47);
        const post=add(newMapG,new THREE.CylinderGeometry(.065,.10,.74,10),0x8c795d,new THREE.Vector3(px,.42,pz),{rough:.72,texture:'wood'});
        post.castShadow=true;
      }
    }
    // Slim arched suspension cables reinforce the bridge silhouette without affecting collisions.
    for(const side of [-1,1]){
      const sideOffset=side*(width*.47);
      const cablePts=[new THREE.Vector3(midX-ux*(len/2-1.1)+nx*sideOffset,.94,midZ-uz*(len/2-1.1)+nz*sideOffset),new THREE.Vector3(midX-ux*(len*.18)+nx*sideOffset,1.20,midZ-uz*(len*.18)+nz*sideOffset),new THREE.Vector3(midX+ux*(len*.18)+nx*sideOffset,1.20,midZ+uz*(len*.18)+nz*sideOffset),new THREE.Vector3(midX+ux*(len/2-1.1)+nx*sideOffset,.94,midZ+uz*(len/2-1.1)+nz*sideOffset)];
      const cableCurve=new THREE.CatmullRomCurve3(cablePts);const cable=new THREE.Mesh(new THREE.TubeGeometry(cableCurve,Math.max(24,Math.floor(len*2)),.035,7,false),mat(0x344a56,.48,.28));cable.castShadow=true;newMapG.add(cable);
    }
    // Rampas entram um pouco em cada ilha para evitar frestas entre as superfícies.
    const rampLen=4.8;
    for(const sign of [-1,1]){
      const px=sign<0?a.x+ux*startDist:b.x-ux*endDist;
      const pz=sign<0?a.z+uz*startDist:b.z-uz*endDist;
      const ramp=add(newMapG,roundedSlabGeometry(rampLen,width*.96,.22,.26,.04),0xe8dcc7,new THREE.Vector3(px,.12,pz),{rough:.58,flat:false});
      ramp.rotation.y=rot;
      newFloorRegions.push({type:'rect',x:px,z:pz,w:rampLen+1.0,d:width*1.04,rot,y:.23});
    }
    return g;
  }

  function pathDisc(x,z,r,c=0xf7f0df){
    add(newMapG,new THREE.CylinderGeometry(r,r+.05,.10,64),c,new THREE.Vector3(x,.29,z),{rough:.82,texture:'stone'});
    newFloorRegions.push({type:'circle',x,z,r:r-.04,y:.36});
  }
  function zoneTreeLine(cx,cz,r,amount=8){
    for(let i=0;i<amount;i++){
      const a=(i/amount)*Math.PI*2+.15, rr=r*.78;
      nTree(cx+Math.cos(a)*rr,cz+Math.sin(a)*rr,.9+(i%3)*.08);
    }
  }

  const center = cityIsland(0,0,34,0x347e4a,0x4c4e49,{seed:7,rim:0xffde73,rock2:0x3c474c,waterfalls:5,trees:[[-18,-10,1],[-9,-17,.9],[9,-17,.9],[18,-10,1],[-22,5,1],[22,5,.95],[-9,18,.85],[9,18,.85]]});
  createProfessorBetinho();
  const school = cityIsland(-58,36,29,0x378ca5,0x445866,{seed:18,rim:0xb4f4ff,rock2:0x3f6b8d,waterfalls:4,trees:[[-13,-10,1],[-10,12,.95],[13,11,.9],[13,-10,.92]]});
  const build = cityIsland(58,36,29,0xb77d38,0x55463a,{seed:29,rim:0xffe9a0,rock2:0x6b493c,waterfalls:3,trees:[[-14,11,.72],[14,11,.72]]});
  const park = cityIsland(-60,-20,29,0x38874a,0x405844,{seed:41,rim:0xdffff0,rock2:0x3b6549,waterfalls:5,trees:[[-13,-12,1.05],[13,-12,.95],[-13,12,.92],[13,11,.92],[-2,-15,.9]]});
  const combat = cityIsland(60,-20,29,0xa33d4b,0x4d3740,{seed:53,rim:0xffc0cf,rock2:0x543746,waterfalls:4});
  const maze = cityIsland(0,-70,29,0x6845a6,0x40384f,{seed:67,rim:0xe0c9ff,rock2:0x43365f,waterfalls:4,trees:[]});
  const challenge = cityIsland(0,82,34.5,0x328e9b,0x354b55,{seed:83,rim:0xbaf8ff,rock2:0x334d61,waterfalls:5,trees:[],hole:{w:32,d:52.0}});

  // NOVAS REGIÕES V64 — expansão do arquipélago mantendo o motor e os materiais originais.
  const snow = cityIsland(-118,96,27,0xb6e5f5,0x536a7a,{seed:97,rim:0xe6fbff,rock2:0x8bb8d0,waterfalls:2,trees:[]});
  const volcano = cityIsland(116,92,29,0x6f514a,0x423b43,{seed:109,rim:0xff704b,rock2:0x292d35,waterfalls:1,trees:[]});
  const desert = cityIsland(-116,-84,28,0xd9ad55,0x76513a,{seed:121,rim:0xffe0a0,rock2:0x98613a,waterfalls:1,trees:[]});
  const ruins = cityIsland(0,145,27,0x7e70b4,0x4d4968,{seed:133,rim:0xd9c5ff,rock2:0x62568d,waterfalls:3,trees:[]});
  const multiplayer = cityIsland(126,-28,27,0x3c9d91,0x3d555b,{seed:145,rim:0x9ffff0,rock2:0x426e72,waterfalls:3,trees:[]});

  // Identidade visual das regiões: gelo, vulcão, deserto, ruínas e arena.
  for(let i=0;i<11;i++){
    const a=i/11*Math.PI*2, rr=9+(i%3)*4;
    const peak=add(newMapG,new THREE.ConeGeometry(1.2+(i%3)*.42,2.5+(i%4)*1.15,6),i%2?0xe7f7ff:0x9ed5ec,
      new THREE.Vector3(snow.x+Math.cos(a)*rr,1.35+(i%4)*.38,snow.z+Math.sin(a)*rr),{rough:.82,flat:true});
    peak.rotation.z=Math.sin(a)*.10;
  }
  // VULCÃO V66: relevo facetado, cratera em caldeira e rios de lava. Não usa uma pirâmide lisa.
  const volcanoLayers=[
    {r:16.2,y:.55,c:0x3b3942},{r:14.7,y:1.75,c:0x474047},{r:12.8,y:3.55,c:0x51434a},
    {r:10.7,y:5.55,c:0x554149},{r:8.4,y:7.45,c:0x4a3a41},{r:6.45,y:9.15,c:0x45353d},
    {r:5.15,y:10.75,c:0x594047},{r:4.25,y:11.30,c:0x3b3039},{r:3.75,y:10.05,c:0x652d30},
    {r:3.08,y:8.25,c:0x5a292d},{r:2.72,y:7.78,c:0x4d282e}
  ];
  const volcanoPositions=[],volcanoColors=[];
  const volcanoPalette=[0x343741,0x414047,0x504149,0x5b454a,0x3e3944,0x67454a,0x49333b,0x76504a];
  function volcanoPoint(layerIndex,segment){
    const a=(segment%48)/48*Math.PI*2,layer=volcanoLayers[layerIndex];
    const ridge=1+.045*Math.sin(a*5+.8)+.026*Math.sin(a*11-layerIndex*.82)+.018*Math.cos(a*17+layerIndex);
    const r=layer.r*ridge;
    const y=layer.y+.19*Math.sin(a*4+layerIndex*1.55)*Math.min(1,layer.y/2.5);
    return new THREE.Vector3(Math.cos(a)*r,y,Math.sin(a)*r);
  }
  function volcanoFacet(a,b,c,layerIndex,segment,tri){
    const base=new THREE.Color(volcanoPalette[(layerIndex+Math.floor(segment/3)+tri)%volcanoPalette.length]);
    const shade=.78+.24*(.5+.5*Math.sin(segment*12.989+layerIndex*78.233+tri*2.17));
    base.multiplyScalar(shade);
    for(const v of [a,b,c]){volcanoPositions.push(v.x,v.y,v.z);volcanoColors.push(base.r,base.g,base.b);}
  }
  for(let li=0;li<volcanoLayers.length-1;li++)for(let seg=0;seg<48;seg++){
    const a=volcanoPoint(li,seg),b=volcanoPoint(li,seg+1),c=volcanoPoint(li+1,seg),d=volcanoPoint(li+1,seg+1);
    volcanoFacet(a,c,d,li,seg,0);volcanoFacet(a,d,b,li,seg,1);
  }
  const volcanoGeo=new THREE.BufferGeometry();
  volcanoGeo.setAttribute('position',new THREE.Float32BufferAttribute(volcanoPositions,3));
  volcanoGeo.setAttribute('color',new THREE.Float32BufferAttribute(volcanoColors,3));
  volcanoGeo.computeVertexNormals();
  const volcanoBody=new THREE.Mesh(volcanoGeo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.96,metalness:.015,flatShading:true,side:THREE.DoubleSide}));
  volcanoBody.position.set(volcano.x,0,volcano.z);volcanoBody.castShadow=true;volcanoBody.receiveShadow=true;newMapG.add(volcanoBody);
  // Lago de magma visível dentro da caldeira, com um centro mais quente.
  const craterLake=add(newMapG,new THREE.CircleGeometry(2.78,48),0xf04b24,new THREE.Vector3(volcano.x,7.82,volcano.z),{rough:.28,m:.07,castShadow:false,receiveShadow:false});
  craterLake.rotation.x=-Math.PI/2;craterLake.material.emissive=new THREE.Color(0xff3010);craterLake.material.emissiveIntensity=1.05;
  const craterCore=add(newMapG,new THREE.CircleGeometry(1.48,40),0xffa13b,new THREE.Vector3(volcano.x,7.845,volcano.z),{rough:.24,m:.08,castShadow:false,receiveShadow:false});
  craterCore.rotation.x=-Math.PI/2;craterCore.material.emissive=new THREE.Color(0xff671b);craterCore.material.emissiveIntensity=.9;
  // Aro de rocha partido em segmentos, sem o anel liso flutuando no topo.
  for(let i=0;i<8;i++){
    const rimRock=add(newMapG,new THREE.TorusGeometry(4.34,.20,8,18,Math.PI*.31),i%3===0?0x7e4947:0x40363f,new THREE.Vector3(volcano.x,11.28,volcano.z),{rough:.94,castShadow:true});
    rimRock.rotation.x=Math.PI/2;rimRock.rotation.y=i*Math.PI/4;
  }
  // Canais escuros com um núcleo incandescente acompanham as encostas em cinco direções.
  for(let i=0;i<5;i++){
    const angle=(i/5)*Math.PI*2+.20;
    const coords=[[4.0,10.45],[5.7,9.65],[7.8,8.15],[10.1,5.95],[12.2,4.0],[14.0,2.15],[15.55,.82]];
    const points=coords.map(([r,y],j)=>new THREE.Vector3(volcano.x+Math.cos(angle+.035*Math.sin(j*1.7))*r,y,volcano.z+Math.sin(angle+.035*Math.sin(j*1.7))*r));
    const flow=new THREE.CatmullRomCurve3(points);
    const channel=new THREE.Mesh(new THREE.TubeGeometry(flow,48,.47,8,false),new THREE.MeshStandardMaterial({color:0x672c2d,roughness:.78,emissive:0x3b100d,emissiveIntensity:.25}));newMapG.add(channel);
    const lava=new THREE.Mesh(new THREE.TubeGeometry(flow,48,.205,8,false),new THREE.MeshStandardMaterial({color:i%2?0xff5a23:0xff822d,roughness:.35,emissive:0xff3d12,emissiveIntensity:.82}));newMapG.add(lava);
  }
  // Fragmentos de basalto e espigões irregulares quebram a silhueta artificial do cone.
  for(let i=0;i<16;i++){
    const a=i/16*Math.PI*2+.12,rr=14.5+(i%3)*.62;
    const rock=add(newMapG,new THREE.DodecahedronGeometry(.82+(i%4)*.20,0),[0x383941,0x4b4148,0x5b4549][i%3],new THREE.Vector3(volcano.x+Math.cos(a)*rr,.78+(i%3)*.26,volcano.z+Math.sin(a)*rr),{rough:.98,flat:true});
    rock.scale.set(1.0+(i%2)*.45,.62+(i%3)*.28,.82+(i%4)*.16);rock.rotation.set(i*.27,a,i*.19);
  }
  for(let i=0;i<9;i++){
    const a=i/9*Math.PI*2,rr=5.35+(i%3)*.66,h=1.25+(i%4)*.48;
    const spike=add(newMapG,new THREE.ConeGeometry(.54+(i%2)*.20,h,5),i%2?0x3e343d:0x684047,new THREE.Vector3(volcano.x+Math.cos(a)*rr,9.25+(i%3)*.42,volcano.z+Math.sin(a)*rr),{rough:.98,flat:true});
    spike.rotation.z=Math.cos(a)*.16;spike.rotation.x=Math.sin(a)*.16;
  }
  // Fumaça facetada acima da cratera, mantida translúcida para não esconder o relevo.
  for(let i=0;i<6;i++){
    const puff=add(newMapG,new THREE.IcosahedronGeometry(1.0+(i%3)*.34,1),i%2?0x625c63:0x4b4a53,new THREE.Vector3(volcano.x+Math.sin(i*1.8)*(.55+i*.18),13.0+i*.78,volcano.z+Math.cos(i*1.45)*(.45+i*.15)),{rough:1,castShadow:false,receiveShadow:false});
    puff.material.transparent=true;puff.material.opacity=.24+(i%3)*.045;puff.material.depthWrite=false;puff.scale.set(1.0+(i%2)*.28,.72+(i%3)*.15,.86+(i%2)*.20);
  }
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2,rr=11+(i%3)*3;
    const cactus=add(newMapG,new THREE.CylinderGeometry(.38,.5,2.1+(i%3)*.45,7),0x4d9a54,new THREE.Vector3(desert.x+Math.cos(a)*rr,1.25,desert.z+Math.sin(a)*rr),{rough:.88,flat:true});
    if(i%2===0)add(newMapG,new THREE.BoxGeometry(.95,.28,.28),0x4d9a54,new THREE.Vector3(cactus.position.x+.48,1.55,cactus.position.z),{rough:.88,flat:true});
  }
  for(let i=0;i<7;i++){
    const a=i/7*Math.PI*2,rr=11+(i%2)*4;
    const pillar=add(newMapG,new THREE.BoxGeometry(1.3,3.2+(i%3)*.7,1.3),0x8f83bf,
      new THREE.Vector3(ruins.x+Math.cos(a)*rr,1.8+(i%3)*.35,ruins.z+Math.sin(a)*rr),{rough:.85,flat:true});
    pillar.rotation.y=a*.4;
    add(newMapG,new THREE.BoxGeometry(1.8,.35,1.8),0xb8a9ed,new THREE.Vector3(pillar.position.x,pillar.position.y+2.0,pillar.position.z),{rough:.65,flat:true});
  }
  // Arena central com anéis de corrida e quatro pontos de entrada.
  const arenaDisc=add(newMapG,new THREE.CylinderGeometry(13.5,14,.18,64),0x286b70,new THREE.Vector3(multiplayer.x,.48,multiplayer.z),{rough:.52});
  const arenaRing=add(newMapG,new THREE.TorusGeometry(10.5,.34,12,64),0xffd66d,new THREE.Vector3(multiplayer.x,.62,multiplayer.z),{rough:.3,m:.08});
  arenaRing.rotation.x=Math.PI/2;
  const arenaCore=add(newMapG,new THREE.CylinderGeometry(3.2,3.6,.35,32),0x75e9d3,new THREE.Vector3(multiplayer.x,.65,multiplayer.z),{rough:.25,m:.08});
  arenaCore.material.emissive=new THREE.Color(0x126e66);arenaCore.material.emissiveIntensity=.25;
  nlabel('ÁREA DE NEVE',snow.x,6.0,snow.z,.62,'#e8fbff');
  nlabel('CRATERA VULCÂNICA',volcano.x,14.6,volcano.z,.66,'#ffd4bd');
  nlabel('DESERTO',desert.x,6.0,desert.z,.68,'#fff0b8');
  nlabel('RUÍNAS FLUTUANTES',ruins.x,7.2,ruins.z,.60,'#eee4ff');
  nlabel('ARENA MULTIPLAYER',multiplayer.x,6.5,multiplayer.z,.58,'#d9fff8');

  // --- ATIVIDADES DAS NOVAS ILHAS: itens coletáveis, perigos legíveis e objetivos próprios. ---
  function addIslandPickup(x,z,color,name,geometry,kind='crystal',xp=20){
    const y=1.45;
    const mesh=add(newMapG,geometry,color,new THREE.Vector3(x,y,z),{rough:.24,m:.10,castShadow:false,receiveShadow:false});
    mesh.material.emissive=new THREE.Color(color);mesh.material.emissiveIntensity=.36;
    const halo=add(newMapG,new THREE.TorusGeometry(.72,.055,8,28),color,new THREE.Vector3(x,.51,z),{rough:.24,m:.08,castShadow:false,receiveShadow:false});
    halo.rotation.x=Math.PI/2;halo.material.emissive=new THREE.Color(color);halo.material.emissiveIntensity=.22;
    islandPickups.push({mesh,halo,x,z,name,kind,xp,found:false,phase:Math.random()*Math.PI*2,baseY:y});
    return islandPickups[islandPickups.length-1];
  }
  function addTimedVent(x,z,color,name,period=4.8,phase=0,activeFor=1.35){
    const pool=add(newMapG,new THREE.CircleGeometry(1.55,28),color,new THREE.Vector3(x,.48,z),{rough:.35,m:.08,castShadow:false,receiveShadow:false});
    pool.rotation.x=-Math.PI/2;pool.material.transparent=true;pool.material.opacity=.72;pool.material.emissive=new THREE.Color(color);pool.material.emissiveIntensity=.30;
    const ring=add(newMapG,new THREE.TorusGeometry(1.48,.14,10,32),color,new THREE.Vector3(x,.54,z),{rough:.25,m:.10,castShadow:false,receiveShadow:false});ring.rotation.x=Math.PI/2;ring.material.emissive=new THREE.Color(color);ring.material.emissiveIntensity=.42;
    const beam=add(newMapG,new THREE.CylinderGeometry(.26,.82,4.4,10),color,new THREE.Vector3(x,2.72,z),{rough:.28,m:.06,castShadow:false,receiveShadow:false});
    beam.material.transparent=true;beam.material.opacity=.82;beam.material.emissive=new THREE.Color(color);beam.material.emissiveIntensity=.62;beam.visible=false;
    const label=add(newMapG,new THREE.SphereGeometry(.20,12,10),0xffe8a5,new THREE.Vector3(x,.78,z),{rough:.18,m:.04,castShadow:false,receiveShadow:false});label.material.emissive=new THREE.Color(0xff8a38);label.material.emissiveIntensity=.55;
    islandHazards.push({x,z,radius:2.25,name,period,phase,activeFor,pool,ring,beam,label,cooldownUntil:0});
  }

  // NEVE: uma trilha de cinco cristais e gelo escorregadio para mudar o controlo do salto.
  for(let i=0;i<5;i++){
    const a=-Math.PI/2+i*(Math.PI*2/5),rr=9.7+(i%2)*2.0,x=snow.x+Math.cos(a)*rr,z=snow.z+Math.sin(a)*rr;
    const pedestal=add(newMapG,new THREE.CylinderGeometry(.65,.82,.30,8),0x8ecce2,new THREE.Vector3(x,.55,z),{rough:.35,m:.08,castShadow:false});
    pedestal.material.emissive=new THREE.Color(0x367fa3);pedestal.material.emissiveIntensity=.14;
    addIslandPickup(x,z,0xa9f5ff,'Cristal de Neve '+(i+1),new THREE.OctahedronGeometry(.52),'snow-crystal',25);
  }
  for(const [dx,dz,r] of [[-5,1,2.3],[5,4,2.0],[-1,-7,2.1]]){
    const ice=add(newMapG,new THREE.CircleGeometry(r,24),0x8ce9ff,new THREE.Vector3(snow.x+dx,.47,snow.z+dz),{rough:.18,m:.10,castShadow:false,receiveShadow:false});
    ice.rotation.x=-Math.PI/2;ice.material.transparent=true;ice.material.opacity=.48;ice.material.emissive=new THREE.Color(0x2da7d8);ice.material.emissiveIntensity=.20;
    islandIcePatches.push({x:snow.x+dx,z:snow.z+dz,r,cooldownUntil:0,mesh:ice});
  }
  nlabel('CAÇA AOS 5 CRISTAIS',snow.x,4.8,snow.z-13.5,.48,'#e4fbff');

  // VULCÃO: fragmentos de magma perto da cratera; as saídas de lava têm ciclo visível antes de explodir.
  for(let i=0;i<5;i++){
    const a=(i/5)*Math.PI*2+.22,rr=15.8,x=volcano.x+Math.cos(a)*rr,z=volcano.z+Math.sin(a)*rr;
    addIslandPickup(x,z,0xff8a42,'Fragmento de Magma '+(i+1),new THREE.DodecahedronGeometry(.48),'magma',30);
  }
  addTimedVent(volcano.x-5.8,volcano.z+2.0,0xff512f,'Jato de lava',5.2,.4,1.45);
  addTimedVent(volcano.x+5.2,volcano.z+4.0,0xff7438,'Jato de lava',5.7,2.1,1.5);
  addTimedVent(volcano.x+.4,volcano.z-7.8,0xff3d29,'Jato de lava',6.1,3.3,1.6);
  nlabel('COLETE MAGMA • EVITE OS JATOS',volcano.x,4.8,volcano.z+16.5,.46,'#ffd6c7');

  // DESERTO: oito moedas em uma trilha sinuosa e gêiseres de areia que lançam o jogador.
  for(let i=0;i<8;i++){
    const a=-Math.PI*.78+i*(Math.PI*1.56/7),rr=8.0+(i%3)*3.0,x=desert.x+Math.cos(a)*rr,z=desert.z+Math.sin(a)*rr;
    addIslandPickup(x,z,0xffd65c,'Moeda do Deserto '+(i+1),new THREE.TorusGeometry(.38,.115,10,22),'desert-coin',20).mesh.rotation.y=Math.PI/2;
  }
  addTimedVent(desert.x-3.6,desert.z+2.5,0xe9c06b,'Gêiser de areia',5.0,1.3,1.30);
  addTimedVent(desert.x+5.0,desert.z-3.0,0xffd47b,'Gêiser de areia',5.8,3.0,1.25);
  nlabel('TRILHA DE 8 MOEDAS',desert.x,4.8,desert.z-14.5,.50,'#fff0bc');

  // RUÍNAS: três runas abrem um baú e revelam uma recompensa de XP.
  const runeSpots=[[-8,-3],[8,-3],[0,9]];
  runeSpots.forEach(([dx,dz],i)=>{
    const x=ruins.x+dx,z=ruins.z+dz;
    const pedestal=add(newMapG,new THREE.CylinderGeometry(.82,.98,.34,6),0x524d82,new THREE.Vector3(x,.55,z),{rough:.68,m:.08});
    pedestal.material.emissive=new THREE.Color(0x30245e);pedestal.material.emissiveIntensity=.18;
    addIslandPickup(x,z,[0xbba0ff,0x72e8ff,0xf3a7ff][i],'Runa Antiga '+(i+1),new THREE.IcosahedronGeometry(.55),'ruin-rune',35);
  });
  const chestRoot=new THREE.Group();chestRoot.position.set(ruins.x,0,ruins.z-1.6);newMapG.add(chestRoot);
  add(chestRoot,new THREE.BoxGeometry(2.2,.92,1.45),0x75432d,new THREE.Vector3(0,.55,0),{rough:.68,m:.04});
  add(chestRoot,new THREE.BoxGeometry(2.32,.18,1.55),0xe6b84e,new THREE.Vector3(0,.86,0),{rough:.36,m:.12});
  const chestLid=new THREE.Group();chestLid.position.set(0,1.02,-.68);chestRoot.add(chestLid);
  const lidPiece=add(chestLid,new THREE.BoxGeometry(2.25,.55,1.48),0x97613a,new THREE.Vector3(0,.20,.68),{rough:.63,m:.04});lidPiece.rotation.x=-.08;
  add(chestLid,new THREE.BoxGeometry(2.34,.12,1.55),0xf2cd64,new THREE.Vector3(0,.22,.68),{rough:.32,m:.12});
  const chestOrb=add(newMapG,new THREE.IcosahedronGeometry(.76),0xffdf75,new THREE.Vector3(ruins.x,2.05,ruins.z-1.6),{rough:.18,m:.14,castShadow:false,receiveShadow:false});chestOrb.material.emissive=new THREE.Color(0xffae29);chestOrb.material.emissiveIntensity=.8;chestOrb.visible=false;
  const chestHalo=add(newMapG,new THREE.TorusGeometry(1.05,.07,8,28),0xffd977,new THREE.Vector3(ruins.x,.60,ruins.z-1.6),{rough:.22,m:.12,castShadow:false,receiveShadow:false});chestHalo.rotation.x=Math.PI/2;chestHalo.material.emissive=new THREE.Color(0xffaa2a);chestHalo.material.emissiveIntensity=.6;chestHalo.visible=false;
  ruinsTreasure={root:chestRoot,lid:chestLid,orb:chestOrb,halo:chestHalo,x:ruins.x,z:ruins.z-1.6,unlocked:false,claimed:false};
  nlabel('ENCONTRE 3 RUNAS • ABRA O BAÚ',ruins.x,4.8,ruins.z+14.0,.48,'#f0e4ff');

  // ARENA: circuito em sequência. É preciso passar pelos quatro portais e cruzar a linha inicial de novo.
  const raceOffsets=[ [0,-8.8],[8.8,0],[0,8.8],[-8.8,0] ];
  islandRace.gates=raceOffsets.map(([dx,dz],i)=>{
    const x=multiplayer.x+dx,z=multiplayer.z+dz;
    const gate=add(newMapG,new THREE.TorusGeometry(1.42,.12,10,32),[0x83f5ff,0xffd56c,0x86ffba,0xe3a0ff][i],new THREE.Vector3(x,2.1,z),{rough:.23,m:.10,castShadow:false,receiveShadow:false});
    gate.rotation.y=(i%2)?Math.PI/2:0;gate.material.emissive=new THREE.Color(gate.material.color);gate.material.emissiveIntensity=.46;
    add(newMapG,new THREE.CylinderGeometry(.16,.22,1.65,10),0xe3edf5,new THREE.Vector3(x, .9,z),{rough:.4,m:.06,castShadow:false});
    const orb=add(newMapG,new THREE.SphereGeometry(.24,12,10),gate.material.color,new THREE.Vector3(x,3.7,z),{rough:.2,m:.08,castShadow:false,receiveShadow:false});orb.material.emissive=new THREE.Color(gate.material.color);orb.material.emissiveIntensity=.72;
    return {x,z,gate,orb,index:i};
  });
  nlabel('CIRCUITO DAS ILHAS • PASSE PELOS 4 PORTAIS',multiplayer.x,4.8,multiplayer.z+14.5,.45,'#e3fff9');

  // Understory, boulders and wildflowers enrich the margins without obstructing routes.
  scatterIslandNature(center,[school,build,park,combat,maze,challenge],7);
  scatterIslandNature(school,[center],18);scatterIslandNature(build,[center],29);
  scatterIslandNature(park,[center],41);scatterIslandNature(combat,[center],53);
  scatterIslandNature(maze,[center],67);scatterIslandNature(challenge,[center],83);
  scatterIslandNature(snow,[school],97);scatterIslandNature(volcano,[build],109);
  scatterIslandNature(desert,[park],121);scatterIslandNature(ruins,[challenge],133);
  scatterIslandNature(multiplayer,[combat],145);

  pathDisc(0,0,14.2,0xc6b99c);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(13.4,.32,16,96),mat(0xe7bd52,.34,.10));ring.rotation.x=Math.PI/2;ring.position.y=.51;newMapG.add(ring);
  add(newMapG,new THREE.CylinderGeometry(5.0,5.5,.62,48),0xf8f3e7,new THREE.Vector3(0,.76,0),{rough:.70});
  const core=add(newMapG,new THREE.OctahedronGeometry(2.8),0x56ecff,new THREE.Vector3(0,3.7,0),{rough:.15,m:.25});core.material.emissive=new THREE.Color(0x0d78a6);core.material.emissiveIntensity=.9;
  for(let i=0;i<4;i++){const rr=new THREE.Mesh(new THREE.TorusGeometry(3.5+i*.62,.07,9,72),mat(i%2?0x69dff8:0xa2f4ff,.26,.04));rr.rotation.x=Math.PI/2;rr.position.y=.98+i*.12;newMapG.add(rr)}
  // Radial inlays on the central plaza make paths legible and visually frame the landmark.
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,r0=6.2,r1=12.0,mid=(r0+r1)/2,len=r1-r0,mx=Math.cos(a)*mid,mz=Math.sin(a)*mid;
    const tile=add(newMapG,new THREE.BoxGeometry(len,.035,.18),i%3===0?0xffd46d:0xb0e7ef,new THREE.Vector3(mx,.39,mz),{rough:.35,castShadow:false,receiveShadow:false});tile.rotation.y=-a;
  }
  // Fragmentos cristalinos orbitam o núcleo, como landmarks de um hub moderno.
  for(let i=0;i<6;i++){
    const a=i*Math.PI/3,rr=4.6+(i%2)*.42,h=.9+(i%3)*.42;
    const shard=add(newMapG,new THREE.OctahedronGeometry(.42+(i%2)*.10),[0x4bdcff,0x7eeeff,0x8f83ff,0xffd56a,0x57e5b3,0x5bb8ff][i],new THREE.Vector3(Math.cos(a)*rr,1.65+(i%3)*.32,Math.sin(a)*rr),{rough:.18,m:.18});
    shard.scale.set(.8,h,0.8);shard.rotation.set(.3*i,.5*i,.2*i);shard.material.emissive=new THREE.Color(shard.material.color);shard.material.emissiveIntensity=.26;
  }
  newColliderDefs.push({minX:-4.8,maxX:4.8,minZ:-4.8,maxZ:4.8,maxY:6.6}); // cristal central e base são sólidos
  const centerBuildings=[[-9,-9,5.8,4.7,3.2,0xbfc7c0,0x287c9e],[9,-9,5.8,4.7,3.2,0xbfc7c0,0x386b48],[-14,16,5.8,4.7,3.2,0xb9b9ad,0xb37c38],[14,16,5.8,4.7,3.2,0xc1c1b7,0x64558a]];
  centerBuildings.forEach(([x,z,w,d,h,wall,roof])=>building(x,z,w,d,h,wall,roof));
  [[-17,0],[17,0],[7,-17],[0,17],[-13,-13],[13,-13],[-10,13],[10,13]].forEach(([x,z])=>lamp(x,z,0xffd76b,1.1));
  nlabel('CENTRO',0,9.0,0,1.05,'#fff4c9');

  pathDisc(school.x,school.z,12.8,0xbdeff8);
  building(school.x,school.z,11.5,7.2,5.0,0xb9cece,0x205477);
  building(school.x-8.0,school.z+8.3,4.6,3.5,2.8,0xa7c4c9,0x397f9a);
  building(school.x+8.0,school.z+8.3,4.6,3.5,2.8,0xa7c4c9,0x397f9a);
  nblock(school.x,school.z-9.0,9.0,2.4,.5,0xd1eaf2);
  nblock(school.x,school.z+5.0,8.0,.22,2.8,0x243f5b);
  // Cúpula de vidro e torre escolar tornam o campus identificável à distância.
  const domeMat=new THREE.MeshStandardMaterial({color:0x5ce0ff,roughness:.24,metalness:.12,transparent:true,opacity:.74,emissive:0x0e82b8,emissiveIntensity:.19,side:THREE.DoubleSide});
  const dome=new THREE.Mesh(new THREE.SphereGeometry(4.0,32,20,0,Math.PI*2,0,Math.PI/2),domeMat);dome.position.set(school.x,5.15,school.z);dome.castShadow=true;newMapG.add(dome);
  const domeRim=new THREE.Mesh(new THREE.TorusGeometry(4.0,.16,12,64),mat(0xb7f4ff,.22,.12));domeRim.rotation.x=Math.PI/2;domeRim.position.set(school.x,5.12,school.z);newMapG.add(domeRim);
  const flagPole=add(newMapG,new THREE.CylinderGeometry(.08,.10,3.1,10),0xf7f4ea,new THREE.Vector3(school.x,8.45,school.z),{rough:.42});
  const flag=add(newMapG,new THREE.BoxGeometry(1.45,.76,.08),0x167bd1,new THREE.Vector3(school.x+.70,9.25,school.z),{rough:.35});
  add(newMapG,new THREE.TorusGeometry(1.65,.10,8,32),0x67dfff,new THREE.Vector3(school.x,5.4,school.z),{rough:.20,m:.08}).rotation.x=Math.PI/2;
  zoneTreeLine(school.x,school.z,18.0,10);
  nlabel('ESCOLA / APRENDIZADO',school.x,7.8,school.z-.2,.76,'#eaffff');

  pathDisc(build.x,build.z,12.8,0xffd28e);
  nblock(build.x,build.z,12.8,9.6,.9,0xd89f4c);
  [[-7,-7,3.4,2.8,2.0,0x98683c],[7,-7,3.4,2.8,2.6,0xc37a2b],[-8,7,3.4,2.8,1.8,0xb46f2a],[8,7,3.4,2.8,1.6,0x8d633d]].forEach(([ox,oz,w,d,h,c])=>nblock(build.x+ox,build.z+oz,w,d,h,c));
  crane(build.x-8.0,build.z+1.5,1.65); crane(build.x+7.8,build.z+1.5,1.35);
  add(newMapG,new THREE.BoxGeometry(2.3,2.3,2.3),0x4e86ff,new THREE.Vector3(build.x-2.8,1.35,build.z-8.0));
  newColliderDefs.push({minX:build.x-4.05,maxX:build.x-1.55,minZ:build.z-9.25,maxZ:build.z-6.75,maxY:2.55});
  add(newMapG,new THREE.CylinderGeometry(1.2,1.2,2.4,24),0x52dab4,new THREE.Vector3(build.x+3.0,1.45,build.z+7.5));
  newColliderDefs.push({minX:build.x+1.65,maxX:build.x+4.35,minZ:build.z+6.15,maxZ:build.z+8.85,maxY:2.75});
  add(newMapG,new THREE.ConeGeometry(1.3,2.7,4),0xef6f79,new THREE.Vector3(build.x+7.2,1.65,build.z+7.5));
  newColliderDefs.push({minX:build.x+5.75,maxX:build.x+8.65,minZ:build.z+6.05,maxZ:build.z+8.95,maxY:3.05});
  // Estruturas de andaime, plataformas de trabalho e materiais coloridos.
  for(let tier=0;tier<3;tier++){
    const yy=.55+tier*1.25;
    for(const sx of [-1,1]){
      const x=build.x+sx*(4.8+tier*.4);
      add(newMapG,new THREE.BoxGeometry(.16,2.8,.16),0xf5c56e,new THREE.Vector3(x,1.4,build.z-1.8),{rough:.5});
      add(newMapG,new THREE.BoxGeometry(.16,2.8,.16),0xf5c56e,new THREE.Vector3(x,1.4,build.z+3.8),{rough:.5});
      add(newMapG,new THREE.BoxGeometry(10.0,.13,.14),0xffdb88,new THREE.Vector3(build.x,yy,build.z+1.0),{rough:.48});
    }
  }
  for(let i=0;i<7;i++){
    const bx=build.x-7+(i%4)*1.45,bz=build.z-11+Math.floor(i/4)*1.5;
    const pallet=add(newMapG,new THREE.BoxGeometry(1.15,.18,1.0),0x795638,new THREE.Vector3(bx,.30,bz),{rough:.92,texture:'wood'});
    const material=add(newMapG,new THREE.BoxGeometry(.90,.48+(i%3)*.22,.75),[0x5b9df5,0x53d6bd,0xffcf55,0xff8f58][i%4],new THREE.Vector3(bx,.58+(i%3)*.11,bz),{rough:.56});
    newColliderDefs.push({minX:bx-.62,maxX:bx+.62,minZ:bz-.56,maxZ:bz+.56,maxY:1.6});
  }
  nlabel('ÁREA DE CONSTRUÇÃO',build.x,7.8,build.z-.2,.76,'#fff3c4');

  pathDisc(park.x,park.z,14.4,0xd9f5b5);
  add(newMapG,new THREE.BoxGeometry(3.8,3.8,3.8),0xff9d3e,new THREE.Vector3(park.x-9,1.9,park.z-6));
  newColliderDefs.push({minX:park.x-11.0,maxX:park.x-7.0,minZ:park.z-8.0,maxZ:park.z-4.0,maxY:3.9});
  const py=add(newMapG,new THREE.ConeGeometry(3.0,5.8,4),0xf0c541,new THREE.Vector3(park.x+9,2.95,park.z-6));py.rotation.y=Math.PI/4;
  newColliderDefs.push({minX:park.x+5.5,maxX:park.x+12.5,minZ:park.z-9.5,maxZ:park.z-2.5,maxY:5.9});
  add(newMapG,new THREE.CylinderGeometry(1.9,1.9,4.5,28),0x51c9de,new THREE.Vector3(park.x-10,2.35,park.z+6));
  newColliderDefs.push({minX:park.x-12.2,maxX:park.x-7.8,minZ:park.z+3.8,maxZ:park.z+8.2,maxY:4.7});
  add(newMapG,new THREE.SphereGeometry(2.5,28,18),0x5e91ff,new THREE.Vector3(park.x,2.7,park.z+8));
  newColliderDefs.push({minX:park.x-2.8,maxX:park.x+2.8,minZ:park.z+5.2,maxZ:park.z+10.8,maxY:5.5});
  const tor=add(newMapG,new THREE.TorusGeometry(2.2,.48,16,40),0x9a6ff0,new THREE.Vector3(park.x+10,2.3,park.z+6));tor.rotation.x=Math.PI/2;
  newColliderDefs.push({minX:park.x+7,maxX:park.x+13,minZ:park.z+3,maxZ:park.z+9,maxY:2.9});
  nPath(park.x,park.z-5,18,2.6,0xfff1cc);nPath(park.x,park.z+5,18,2.6,0xfff1cc);nPath(park.x-7,park.z,2.6,17,0xfff1cc);nPath(park.x+7,park.z,2.6,17,0xfff1cc);
  // Jardins baixos em anéis deixam as figuras gigantes separadas e o caminho fácil de ler.
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8,rr=18.1,x=park.x+Math.cos(a)*rr,z=park.z+Math.sin(a)*rr;
    const planter=add(newMapG,new THREE.CylinderGeometry(.72,.82,.26,12),i%2?0x67c878:0x37ae6c,new THREE.Vector3(x,.38,z),{rough:.82});
    for(let j=0;j<3;j++){
      const fa=a+j*2.094,fx=x+Math.cos(fa)*.3,fz=z+Math.sin(fa)*.3;
      add(newMapG,new THREE.SphereGeometry(.16,8,6),[0xff8ab6,0xffd55b,0x8b81ff][j],new THREE.Vector3(fx,.64,fz),{rough:.45});
    }
  }
  zoneTreeLine(park.x,park.z,19.0,10);
  nlabel('PARQUE DAS FIGURAS',park.x,8.0,park.z-.3,.80,'#edffdf');

  pathDisc(combat.x,combat.z,15.6,0x47212f);
  const ao=new THREE.Mesh(new THREE.TorusGeometry(14.2,.38,16,96),mat(0xff656e,.22,.15));ao.rotation.x=Math.PI/2;ao.position.set(combat.x,.96,combat.z);newMapG.add(ao);
  const ai=new THREE.Mesh(new THREE.TorusGeometry(8.8,.24,14,72),mat(0xff9a94,.28,.10));ai.rotation.x=Math.PI/2;ai.position.set(combat.x,.98,combat.z);newMapG.add(ai);
  add(newMapG,new THREE.CylinderGeometry(4.0,4.5,.64,40),0x742e3b,new THREE.Vector3(combat.x,.86,combat.z));
  const cc=add(newMapG,new THREE.OctahedronGeometry(2.15),0xff606b,new THREE.Vector3(combat.x,3.7,combat.z),{rough:.16,m:.25});cc.material.emissive=new THREE.Color(0x7b1420);cc.material.emissiveIntensity=.8;
  newColliderDefs.push({minX:combat.x-4.8,maxX:combat.x+4.8,minZ:combat.z-4.8,maxZ:combat.z+4.8,maxY:5.9});
  for(let i=0;i<16;i++){
    const a=i*Math.PI/8,rr=12.8,x=combat.x+Math.cos(a)*rr,z=combat.z+Math.sin(a)*rr;
    const seat=add(newMapG,new THREE.BoxGeometry(1.75,.42,1.05),i%2?0x792d43:0xa9364b,new THREE.Vector3(x,.62,z),{rough:.60});seat.rotation.y=-a;
    const pillar=add(newMapG,new THREE.CylinderGeometry(.22,.30,1.65,8),0x4d2437,new THREE.Vector3(combat.x+Math.cos(a)*14.0,1.05,combat.z+Math.sin(a)*14.0),{rough:.55});
    const beacon=add(newMapG,new THREE.SphereGeometry(.22,12,8),i%2?0xff646f:0xffc15a,new THREE.Vector3(combat.x+Math.cos(a)*14.0,2.0,combat.z+Math.sin(a)*14.0),{rough:.22,m:.08});beacon.material.emissive=new THREE.Color(beacon.material.color);beacon.material.emissiveIntensity=.5;
  }
  for(let i=0;i<12;i++){const a=i*Math.PI/6;lamp(combat.x+11.6*Math.cos(a),combat.z+11.6*Math.sin(a),0xff716d,.82)}
  nlabel('ARENA DE COMBATE',combat.x,8.2,combat.z-.3,.80,'#ffdeda');

  // Labirinto grande gerado em grade: caminhos conectados, múltiplos becos e uma praça central.
  // O tablado cobre o labirinto inteiro, mas mantém uma margem segura até a borda flutuante.
  pathDisc(maze.x,maze.z,24.2,0xd8c3ff);
  const mazeTrim=new THREE.Mesh(new THREE.TorusGeometry(23.55,.20,12,144),mat(0xb7a0ff,.36,.07));
  mazeTrim.rotation.x=Math.PI/2;mazeTrim.position.set(maze.x,.34,maze.z);newMapG.add(mazeTrim);
  const mazeRows=15, mazeCols=15, cell=2.42, wallT=.28, wallH=7.6, midCell=Math.floor(mazeCols/2);
  const mazeCells=Array.from({length:mazeRows},()=>Array.from({length:mazeCols},()=>({visited:false,walls:[true,true,true,true]})));
  const mazeDirs=[[-1,0,0,2],[0,1,1,3],[1,0,2,0],[0,-1,3,1]]; // norte, leste, sul, oeste
  let mazeSeed=43021;const mazeRandom=()=>{mazeSeed=(mazeSeed*1664525+1013904223)>>>0;return mazeSeed/4294967296};
  const mazeStack=[[0,midCell]];mazeCells[0][midCell].visited=true;
  while(mazeStack.length){
    const [rr,cc]=mazeStack[mazeStack.length-1],opts=[];
    for(const [dr,dc,wi,oi] of mazeDirs){const nr=rr+dr,nc=cc+dc;if(nr>=0&&nr<mazeRows&&nc>=0&&nc<mazeCols&&!mazeCells[nr][nc].visited)opts.push([nr,nc,wi,oi]);}
    if(!opts.length){mazeStack.pop();continue;}
    const [nr,nc,wi,oi]=opts[Math.floor(mazeRandom()*opts.length)];
    mazeCells[rr][cc].walls[wi]=false;mazeCells[nr][nc].walls[oi]=false;mazeCells[nr][nc].visited=true;mazeStack.push([nr,nc]);
  }
  // Entrada norte alinhada à ponte central e uma saída real na extremidade oposta.
  mazeCells[0][midCell].walls[0]=false;
  mazeCells[mazeRows-1][midCell].walls[2]=false;
  // Câmara central aberta 3x3 com a recompensa geométrica; o resto mantém corredores e becos.
  for(let rr=6;rr<=8;rr++)for(let cc=6;cc<=8;cc++){
    if(cc<8){mazeCells[rr][cc].walls[1]=false;mazeCells[rr][cc+1].walls[3]=false;}
    if(rr<8){mazeCells[rr][cc].walls[2]=false;mazeCells[rr+1][cc].walls[0]=false;}
  }
  const mazeHalf=(mazeCols*cell)/2;
  const mazePalette=[0x55478f,0x6253a5,0x4a4b8d,0x6e5ab7];
  function addMazeWall(wx,wz,w,d,rr,cc,axis){
    const color=mazePalette[(rr*3+cc*5+(axis==='v'?1:0))%mazePalette.length];
    add(newMapG,softenedBoxGeometry(w,wallH,d,Math.min(.16,w*.18,d*.18),.055),color,new THREE.Vector3(wx,wallH/2,wz),{rough:.48,metal:.045,flat:false});
    rotatedCollider(newColliderDefs,wx,wz,w+.08,d+.08,wallH,0,0);
    const cap=add(newMapG,roundedSlabGeometry(w+.10,d+.10,.18,.12,.035),0xb7a5f2,new THREE.Vector3(wx,wallH-.035,wz),{rough:.30,metal:.10,castShadow:true,receiveShadow:true});
    cap.material.emissive=new THREE.Color(0x5644a8);cap.material.emissiveIntensity=.14;
    if((rr*2+cc)%3===0){
      for(const yy of [2.65,5.55]){
        const strip=add(newMapG,softenedBoxGeometry(axis==='h'?w*.56:.065,.065,axis==='h'?.065:d*.56,.035,.018),0x72e7ff,new THREE.Vector3(wx,yy,wz),{rough:.24,m:.10,castShadow:false,receiveShadow:false});
        strip.material.emissive=new THREE.Color(0x3184c9);strip.material.emissiveIntensity=.48;
      }
    }
  }
  for(let rr=0;rr<mazeRows;rr++)for(let cc=0;cc<mazeCols;cc++){
    const c=mazeCells[rr][cc],cx=maze.x+(cc-(mazeCols-1)/2)*cell,cz=maze.z+((mazeRows-1)/2-rr)*cell;
    if(c.walls[0])addMazeWall(cx,cz+cell/2,cell,wallT,rr,cc,'h');
    if(c.walls[3])addMazeWall(cx-cell/2,cz,wallT,cell,rr,cc,'v');
    if(cc===mazeCols-1&&c.walls[1])addMazeWall(cx+cell/2,cz,wallT,cell,rr,cc,'v');
    if(rr===mazeRows-1&&c.walls[2])addMazeWall(cx,cz-cell/2,cell,wallT,rr,cc,'h');
  }
  // Cristais violeta/ciano sobre pedestais baixos como marcos de navegação, sempre fora do eixo principal.
  for(const [rr,cc,color] of [[2,2,0x79eeff],[3,12,0xd49cff],[10,3,0x9be7ff],[11,11,0xd1a1ff],[5,5,0x7deeff],[9,9,0xb78bff]]){
    const gx=maze.x+(cc-(mazeCols-1)/2)*cell,gz=maze.z+((mazeRows-1)/2-rr)*cell;
    add(newMapG,new THREE.CylinderGeometry(.48,.62,.22,8),0x46346e,new THREE.Vector3(gx,.40,gz),{rough:.55});
    const crystal=add(newMapG,new THREE.OctahedronGeometry(.48),color,new THREE.Vector3(gx,.95,gz),{rough:.18,m:.15});crystal.scale.set(.7,1.6,.7);crystal.material.emissive=new THREE.Color(color);crystal.material.emissiveIntensity=.38;
  }
  // Caminho destacado entre a ponte e a entrada do labirinto.
  nPath(maze.x,maze.z+19.5,6.6,8.2,0xd0c3ff);
  // Saída no lado sul: caminho colorido para fora da grade até à área livre da ilha.
  nPath(maze.x,maze.z-20.8,6.4,6.5,0xcfc0ff);
  const exitZ=maze.z-20.0;
  for(const side of [-1,1]){
    add(newMapG,new THREE.CylinderGeometry(.16,.22,2.5,12),0x78e8ff,new THREE.Vector3(maze.x+side*2.7,1.25,maze.z-18.9),{rough:.28,m:.10});
  }
  const exitBeam=add(newMapG,new THREE.BoxGeometry(5.6,.22,.28),0x78e8ff,new THREE.Vector3(maze.x,2.48,maze.z-18.9),{rough:.24,m:.10});
  exitBeam.material.emissive=new THREE.Color(0x1b8ead);exitBeam.material.emissiveIntensity=.55;
  nlabel('SAÍDA DO LABIRINTO',maze.x,3.45,exitZ,.54,'#d8ffff');
  const goalX=maze.x,goalZ=maze.z;
  add(newMapG,new THREE.CylinderGeometry(1.05,1.20,.30,32),0xe8dfff,new THREE.Vector3(goalX,.48,goalZ),{rough:.32,m:.10});
  const mc=add(newMapG,new THREE.OctahedronGeometry(.82),0xc9b2ff,new THREE.Vector3(goalX,2.05,goalZ),{rough:.18,m:.20});mc.material.emissive=new THREE.Color(0x6444aa);mc.material.emissiveIntensity=.72;
  newColliderDefs.push({minX:goalX-1.0,maxX:goalX+1.0,minZ:goalZ-1.0,maxZ:goalZ+1.0,maxY:2.95});
  const goalRing=add(newMapG,new THREE.TorusGeometry(1.35,.065,8,48),0x7beaff,new THREE.Vector3(goalX,.80,goalZ),{rough:.24,m:.08});goalRing.rotation.x=Math.PI/2;goalRing.material.emissive=new THREE.Color(0x219bca);goalRing.material.emissiveIntensity=.45;
  // Balizas suaves destacam entradas e a câmara central sem bloquear a passagem.
  [[maze.x,maze.z+20.8]].forEach(([lx,lz])=>{add(newMapG,new THREE.CylinderGeometry(.12,.20,2.2,10),0x7de9ff,new THREE.Vector3(lx,1.1,lz),{rough:.3,m:.06});const orb=add(newMapG,new THREE.SphereGeometry(.24,12,8),0x77f0ff,new THREE.Vector3(lx,2.35,lz),{rough:.18,m:.08});orb.material.emissive=new THREE.Color(0x1e9ac6);orb.material.emissiveIntensity=.7;});
  nlabel('LABIRINTO GEOMÉTRICO',maze.x,8.0,maze.z+1,.80,'#f2ebff');

  // Placa de pressão fica logo após a entrada, no primeiro corredor do labirinto.
  // Ao pisar nela, devolve o jogador à câmara central como rota de resgate.
  const plateRow=0,plateCol=midCell;
  const plateX=maze.x+(plateCol-(mazeCols-1)/2)*cell;
  const plateZ=maze.z+((mazeRows-1)/2-plateRow)*cell;
  const plateBase=add(newMapG,new THREE.BoxGeometry(2.05,.18,2.05),0x493765,new THREE.Vector3(plateX,.45,plateZ),{rough:.34,m:.10});
  const plateTop=add(newMapG,new THREE.BoxGeometry(1.78,.10,1.78),0xffa92f,new THREE.Vector3(plateX,.59,plateZ),{rough:.26,m:.08});
  plateTop.material.emissive=new THREE.Color(0xb9540d);plateTop.material.emissiveIntensity=.30;
  const plateInset=add(newMapG,new THREE.BoxGeometry(1.25,.035,1.25),0x75e6ff,new THREE.Vector3(plateX,.655,plateZ),{rough:.22,m:.12});
  plateInset.material.emissive=new THREE.Color(0x168eb0);plateInset.material.emissiveIntensity=.58;
  const plateRing=new THREE.Mesh(new THREE.BoxGeometry(2.16,.045,2.16),mat(0xffd778,.25,.10));
  plateRing.position.set(plateX,.535,plateZ);newMapG.add(plateRing);
  nlabel('PLACA DE RETORNO',plateX,2.45,plateZ,.38,'#ffe9a5');
  mazePressurePlate={x:plateX,z:plateZ,base:plateBase,top:plateTop,inset:plateInset,ring:plateRing,restTopY:plateTop.position.y,restInsetY:plateInset.position.y,pressedUntil:0};
  mazeReturnTarget=new THREE.Vector3(2.0,.36,maze.z); // célula central livre, fora da colisão do cristal e voltada para a saída norte

  bridgeBetween(center,school,7.8,0x83e7ff);
  bridgeBetween(center,build,7.8,0xffd071);
  bridgeBetween(center,park,7.8,0x8be37d);
  bridgeBetween(center,combat,7.8,0xff7b8d);
  bridgeBetween(center,maze,7.8,0xc1a2ff);
  bridgeBetween(center,challenge,8.8,0x61e7f2);
  // Pontes novas prolongam rotas já existentes, evitando transformar as novas regiões em ilhas isoladas.
  bridgeBetween(school,snow,7.6,0xc9f4ff);
  bridgeBetween(build,volcano,7.6,0xff9166);
  bridgeBetween(park,desert,7.6,0xf5cf78);
  bridgeBetween(challenge,ruins,7.6,0xc4a4ff);
  bridgeBetween(combat,multiplayer,8.2,0x76e8d6);

  // Entradas longas para cada ilha.
  // As estruturas são visuais; o corredor de passagem fica livre para a física.
  function gateOnIsland(island,angle,color){
    const x=island.x+Math.cos(angle)*(island.r-.18), z=island.z+Math.sin(angle)*(island.r-.18);
    const tx=-Math.sin(angle),tz=Math.cos(angle);
    for(const side of [-1,1]){
      const postX=x+tx*side*2.5,postZ=z+tz*side*2.5;
      const post=add(newMapG,new THREE.CylinderGeometry(.18,.22,3.1,12),color,new THREE.Vector3(postX,1.55,postZ),{rough:.34,metal:.06});
      post.castShadow=true;newColliderDefs.push({minX:postX-.25,maxX:postX+.25,minZ:postZ-.25,maxZ:postZ+.25,maxY:3.1});
    }
    const top=add(newMapG,new THREE.BoxGeometry(5.4,.32,.34),color,new THREE.Vector3(x,3.0,z),{rough:.34,metal:.06});
    top.rotation.y=-angle-Math.PI/2;
  }
  const links=[
    [center,school,0x50c9ef],[center,build,0xf2ab3b],[center,park,0x62cc6c],[center,combat,0xe45560],[center,maze,0x8d73ed],[center,challenge,0x4adce9],
    [school,snow,0xc9f4ff],[build,volcano,0xff9166],[park,desert,0xf5cf78],[challenge,ruins,0xc4a4ff],[combat,multiplayer,0x76e8d6]
  ];
  links.forEach(([a,b,c])=>{
    gateOnIsland(a,Math.atan2(b.z-a.z,b.x-a.x),c);
    gateOnIsland(b,Math.atan2(a.z-b.z,a.x-b.x),c);
  });

  // Barreiras físicas nas bordas, com aberturas exatas onde começam as pontes.
  const boundaryGaps=new Map();
  const addGap=(is,ang)=>{if(!boundaryGaps.has(is))boundaryGaps.set(is,[]);boundaryGaps.get(is).push(ang)};
  links.forEach(([a,b])=>{addGap(a,Math.atan2(b.z-a.z,b.x-a.x));addGap(b,Math.atan2(a.z-b.z,a.x-b.x));});
  // ATIVIDADES DE EXPLORAÇÃO — adicionadas ao mundo existente sem alterar o motor 3D.
  // Colecionáveis geométricos no Parque das Figuras: cada peça tem uma silhueta própria.
  // Caça às formas: os dez sólidos agora ficam dentro do labirinto, em centros de células caminháveis.
  const collectibleCellSpecs=[
    [1,7,0x37b8ff,"Cubo",new THREE.BoxGeometry(1.05,1.05,1.05)],
    [2,10,0xffc52f,"Esfera",new THREE.SphereGeometry(.62,18,14)],
    [3,3,0x43d58b,"Cone",new THREE.ConeGeometry(.68,1.25,20)],
    [4,10,0xf36f91,"Cilindro",new THREE.CylinderGeometry(.52,.52,1.15,20)],
    [5,12,0x9b6cff,"Toro",new THREE.TorusGeometry(.57,.20,12,28)],
    [7,3,0xff9d36,"Octaedro",new THREE.OctahedronGeometry(.75)],
    [8,9,0x32d3c7,"Prisma",new THREE.CylinderGeometry(.65,.65,1.1,5)],
    [10,6,0xffe45e,"Pirâmide",new THREE.ConeGeometry(.78,1.25,4)],
    [11,12,0x68a7ff,"Dodecaedro",new THREE.DodecahedronGeometry(.68)],
    [13,7,0xe18aff,"Icosaedro",new THREE.IcosahedronGeometry(.70)]
  ];
  const collectibleSpecs=collectibleCellSpecs.map(([rr,cc,color,name,geo])=>[
    maze.x+(cc-(mazeCols-1)/2)*cell,maze.z+((mazeRows-1)/2-rr)*cell,color,name,geo
  ]);
  explorationCollectibles.length=0;
  for(const [x,z,color,name,geo] of collectibleSpecs){
    const mesh=add(newMapG,geo,color,new THREE.Vector3(x,1.45,z),{rough:.28,m:.08});
    mesh.material.emissive=new THREE.Color(color);mesh.material.emissiveIntensity=.22;
    const halo=add(newMapG,new THREE.TorusGeometry(.88,.045,8,28),color,new THREE.Vector3(x,.55,z),{rough:.35,m:.06,castShadow:false,receiveShadow:false});halo.rotation.x=Math.PI/2;
    explorationCollectibles.push({mesh,halo,x,z,name,found:false,phase:Math.random()*Math.PI*2});
  }
  // ILHA DOS DESAFIOS — percurso físico inspirado em mapas de parkour: ensina, varia e recompensa.
  // O trecho central abaixo do circuito é um fosso visual; somente plataformas cadastradas sustentam o jogador.
  parkourCourse=[];parkourState={active:false,next:0,startedAt:0,best:Infinity,checkpointPos:null,checkpointNext:0,completed:false,iceUntil:0};
  parkourVoidRects.length=0;
  const pit={x:challenge.x,z:challenge.z+0.0,w:32,d:56.0};parkourVoidRects.push(pit);
  const pitFloor=add(newMapG,new THREE.BoxGeometry(pit.w,.18,pit.d),0x111725,new THREE.Vector3(pit.x,-3.55,pit.z),{rough:.9,flat:true,castShadow:false,receiveShadow:false});
  // Veios luminosos no fundo do fosso dão profundidade sem criar colisões adicionais.
  for(let i=0;i<9;i++){
    const px=pit.x-8.0+i*2.0;
    const seam=add(newMapG,new THREE.BoxGeometry(.07,.025,pit.d*.92),i%2?0x282f65:0x174a5b,new THREE.Vector3(px,-3.43,pit.z),{rough:.25,m:.08,castShadow:false,receiveShadow:false});
    seam.material.emissive=new THREE.Color(seam.material.color);seam.material.emissiveIntensity=.24;
  }
  // Aproximação segura a partir da ponte e plataforma de largada ampla.
  nPath(challenge.x,challenge.z-21.8,10.0,8.3,0x8deaf0);
  parkourStartPosition=new THREE.Vector3(challenge.x,.64,challenge.z-20.3);
  parkourFinishPosition=new THREE.Vector3(challenge.x,.36,challenge.z+23.0);
  const startDeck=add(newMapG,new THREE.CylinderGeometry(3.2,3.4,.28,48),0x174c70,new THREE.Vector3(challenge.x,.50,challenge.z-20.3),{rough:.36,m:.10});
  newFloorRegions.push({type:'circle',x:challenge.x,z:challenge.z-20.3,r:3.12,y:.64,enabled:true,parkourStart:true});
  const startGlow=add(newMapG,new THREE.TorusGeometry(2.8,.12,10,48),0x57e9ff,new THREE.Vector3(challenge.x,.67,challenge.z-20.3),{rough:.22,m:.10});startGlow.rotation.x=Math.PI/2;startGlow.material.emissive=new THREE.Color(0x168db0);startGlow.material.emissiveIntensity=.45;
  nlabel('PARKOUR • INÍCIO',challenge.x,3.6,challenge.z-22.4,.55,'#d8ffff');
  // Arco de partida, visual apenas; não bloqueia o personagem.
  for(const sx of [-1,1])add(newMapG,softenedBoxGeometry(.22,2.7,.22,.10,.035),0x55d9f0,new THREE.Vector3(challenge.x+sx*3.8,1.7,challenge.z-18.5),{rough:.3,m:.1});
  add(newMapG,softenedBoxGeometry(7.8,.24,.25,.11,.035),0xffd166,new THREE.Vector3(challenge.x,3.0,challenge.z-18.5),{rough:.3,m:.1});

  function makeParkourPlatform(spec,index){
    const x=challenge.x+spec.dx,z=challenge.z+spec.dz,w=spec.w,d=spec.d,h=spec.top,thick=spec.thick||.48;
    const root=new THREE.Group();root.position.set(x,0,z);newMapG.add(root);
    const base=add(root,roundedSlabGeometry(w,d,thick,Math.min(.46,w*.22,d*.22),.075),spec.sideColor||0x344a56,new THREE.Vector3(0,h-thick/2,0),{rough:.86,m:.045,flat:false,texture:'rock'});
    const top=add(root,roundedSlabGeometry(w-.08,d-.08,.12,Math.min(.38,w*.20,d*.20),.035),spec.color,new THREE.Vector3(0,h-.06,0),{rough:spec.kind==='ice'?.22:.68,m:spec.kind==='ice'?.12:.035,texture:spec.kind==='ice'?null:spec.kind==='slime'?'leaves':'stone'});
    if(spec.kind==='moving'){
      top.material.emissive=new THREE.Color(0x1ca3c9);top.material.emissiveIntensity=.28;
      for(const side of [-1,1]){
        const marker=add(root,new THREE.SphereGeometry(.13,14,10),0xf8e6a6,new THREE.Vector3(side*(w*.36),h+.13,0),{rough:.22,m:.1,castShadow:false,receiveShadow:false});
        marker.material.emissive=new THREE.Color(0xf4a42e);marker.material.emissiveIntensity=.42;
      }
      const arrow=add(root,new THREE.TorusGeometry(.34,.045,8,24),0xe8fbff,new THREE.Vector3(0,h+.045,0),{rough:.24,m:.1,castShadow:false,receiveShadow:false});arrow.rotation.x=Math.PI/2;
      arrow.material.emissive=new THREE.Color(0x2baecf);arrow.material.emissiveIntensity=.42;
    }else if(spec.kind==='ice'){
      for(let j=-1;j<=1;j++){
        const stripe=add(root,softenedBoxGeometry(.055,.025,d*.72,.012,.006),0xd4fbff,new THREE.Vector3(j*w*.22,h+.02,0),{rough:.2,m:.08,castShadow:false,receiveShadow:false});
      }
      top.material.emissive=new THREE.Color(0x3695c8);top.material.emissiveIntensity=.20;
    }else if(spec.kind==='slime'){
      top.material.emissive=new THREE.Color(0x1ab84c);top.material.emissiveIntensity=.36;
      for(let j=-1;j<=1;j++)add(root,softenedBoxGeometry(w*.68,.035,.12,.035,.008),0xa7ff9a,new THREE.Vector3(0,h+.028,j*d*.22),{rough:.25,castShadow:false,receiveShadow:false});
    }else if(spec.kind==='crumble'){
      top.material.emissive=new THREE.Color(0xc77a25);top.material.emissiveIntensity=.22;
      for(let j=0;j<3;j++){const crack=add(root,new THREE.BoxGeometry(.045,.025,d*.44),0x503b38,new THREE.Vector3((j-1)*w*.22,h+.026,0),{rough:.9,castShadow:false,receiveShadow:false});crack.rotation.y=(j-1)*.20;}
    }else if(spec.kind==='beam'){
      top.material.emissive=new THREE.Color(0x298fc0);top.material.emissiveIntensity=.18;
      for(const side of [-1,1])add(root,softenedBoxGeometry(.07,.07,d*.9,.025,.012),0xffd56f,new THREE.Vector3(side*(w*.44),h+.03,0),{rough:.3,m:.05,castShadow:false,receiveShadow:false});
    }else if(spec.kind==='ladder'){
      top.material.emissive=new THREE.Color(0x1b9eb6);top.material.emissiveIntensity=.22;
      for(const side of [-1,1])add(root,softenedBoxGeometry(.08,1.5,.08,.035,.012),0xf0dfb7,new THREE.Vector3(side*w*.30,h+.77,-d*.27),{rough:.52,castShadow:false,receiveShadow:false});
      for(let rung=0;rung<5;rung++)add(root,softenedBoxGeometry(w*.60,.07,.09,.03,.012),0xffd66d,new THREE.Vector3(0,h+.18+rung*.25,-d*.27),{rough:.45,castShadow:false,receiveShadow:false});
    }else if(spec.kind==='hurdle'){
      top.material.emissive=new THREE.Color(0xff8b39);top.material.emissiveIntensity=.22;
      const hurdleW=w*.82,hurdleH=.46;
      const hurdle=add(root,softenedBoxGeometry(hurdleW,hurdleH,.24,.12,.045),0xff943d,new THREE.Vector3(0,h+hurdleH/2-.025,0),{rough:.30,m:.08});
      hurdle.material.emissive=new THREE.Color(0xa84316);hurdle.material.emissiveIntensity=.16;
      const hurdleCollider={minX:x-hurdleW/2,maxX:x+hurdleW/2,minZ:z-.20,maxZ:z+.20,minY:h+.06,maxY:h+hurdleH,enabled:true,parkourObstacle:true};
      newColliderDefs.push(hurdleCollider);
      add(root,roundedSlabGeometry(hurdleW+.12,.12,.08,.08,.018),0xffd36b,new THREE.Vector3(0,h+hurdleH-.04,0),{rough:.25,m:.06,castShadow:false,receiveShadow:false});
    }else if(spec.kind==='headhit'){
      top.material.emissive=new THREE.Color(0x48bbde);top.material.emissiveIntensity=.18;
      const lowCeiling=add(newMapG,softenedBoxGeometry(w+1.1,.28,d+1.0,.11,.035),0x435a77,new THREE.Vector3(x,h+2.42,z),{rough:.44,castShadow:true});
      add(newMapG,softenedBoxGeometry(.12,.30,d+1.0,.04,.02),0xffc56a,new THREE.Vector3(x-(w+1.1)/2,h+2.42,z),{rough:.36,castShadow:false,receiveShadow:false});
      newColliderDefs.push({minX:x-(w+1.1)/2,maxX:x+(w+1.1)/2,minZ:z-(d+1.0)/2,maxZ:z+(d+1.0)/2,minY:h+2.28,maxY:h+2.56});
    }else{
      top.material.emissive=new THREE.Color(spec.color);top.material.emissiveIntensity=spec.checkpoint?.30:.08;
    }
    // Checkpoint posts provide a clear visual landmark, inspired by stage-based Minecraft courses.
    if(spec.checkpoint){
      for(const side of [-1,1]){
        const post=add(root,new THREE.CylinderGeometry(.075,.10,1.45,8),0xf4f4ed,new THREE.Vector3(side*(w*.42),h+.70,0),{rough:.42,castShadow:false});
        add(root,new THREE.SphereGeometry(.16,10,8),0x55e4fa,new THREE.Vector3(side*(w*.42),h+1.48,0),{rough:.22,m:.08,castShadow:false}).material.emissive=new THREE.Color(0x168caf);
      }
    }
    // Aros verticais funcionam como alvos de salto vistos de longe, sem colisão física.
    let guideRing=null;
    if(index%2===0||spec.checkpoint||spec.finish||spec.kind==='slime'){
      const ringColor=spec.finish?0xffd36a:(spec.checkpoint?0x86ffd0:(spec.kind==='slime'?0x7dff94:0x63e8ff));
      guideRing=add(root,new THREE.TorusGeometry(spec.finish?1.42:1.08,.085,10,32),ringColor,new THREE.Vector3(0,h+1.48,0),{rough:.24,m:.10,castShadow:false,receiveShadow:false});
      guideRing.material.emissive=new THREE.Color(ringColor);guideRing.material.emissiveIntensity=.42;
    }
    const floorRegion={type:'platform',x,z,w:w-.04,d:d-.04,rot:0,y:h,enabled:true,parkour:true,kind:spec.kind||'normal'};
    newFloorRegions.push(floorRegion);
    const colliderDef={minX:x-w/2+.02,maxX:x+w/2-.02,minZ:z-d/2+.02,maxZ:z+d/2-.02,minY:.36,maxY:h-thick*.18,enabled:true,parkour:true};
    newColliderDefs.push(colliderDef);
    const item={x,z,baseX:x,baseZ:z,w,d,topY:h,root,top,guideRing,index:index+1,kind:spec.kind||'normal',moveAxis:spec.moveAxis||'x',moveAmplitude:spec.moveAmplitude||0,moveSpeed:spec.moveSpeed||.8,movePhase:index*.73,checkpoint:!!spec.checkpoint,finish:!!spec.finish,region:floorRegion,colliderDef,done:false,collapseTimer:0,hiddenUntil:0,bounceUsed:false};
    parkourCourse.push(item);
    if(spec.label)nlabel(spec.label,x,h+2.55,z,.43,spec.checkpoint?'#c8fff3':'#fff2d2');
    return item;
  }
  const courseSpecs=[
    {dx:0,dz:-15.7,w:5.0,d:4.0,top:.78,color:0x36d7f0,kind:'normal',label:'PARTIDA • SALTO 1'},
    {dx:-3.3,dz:-11.9,w:4.0,d:3.8,top:.90,color:0x54bded,kind:'normal',label:'SALTO 2'},
    {dx:-5.3,dz:-8.1,w:3.25,d:4.0,top:1.02,color:0x2ba8db,kind:'beam',label:'VIGA DE EQUILÍBRIO'},
    {dx:-2.5,dz:-4.4,w:4.1,d:3.8,top:1.00,color:0x6be0d3,kind:'normal',checkpoint:true,label:'CHECKPOINT 1'},
    {dx:1.0,dz:-.7,w:3.8,d:3.7,top:1.32,color:0x5bc6f0,kind:'moving',moveAxis:'x',moveAmplitude:1.0,moveSpeed:.72,label:'PLATAFORMA MÓVEL'},
    {dx:4.5,dz:2.9,w:4.0,d:3.7,top:.82,color:0x58e46d,kind:'slime',checkpoint:true,label:'SALTO COM IMPULSO'},
    {dx:4.4,dz:6.8,w:3.8,d:3.7,top:1.08,color:0xffb34d,kind:'crumble',label:'PISO INSTÁVEL'},
    {dx:.8,dz:10.1,w:4.2,d:3.8,top:1.30,color:0x62dec6,kind:'normal',checkpoint:true,label:'CHECKPOINT 2'},
    {dx:-3.4,dz:13.4,w:3.4,d:4.1,top:1.48,color:0x47a9e6,kind:'beam',label:'VIGA ESTREITA'},
    {dx:-4.0,dz:16.8,w:3.8,d:3.8,top:1.48,color:0x5bd6ee,kind:'moving',moveAxis:'z',moveAmplitude:.78,moveSpeed:.70,label:'PLATAFORMA MÓVEL 2'},
    {dx:-.7,dz:19.5,w:3.8,d:3.7,top:1.70,color:0x56c8e8,kind:'ice',label:'PISO DE GELO'},
    {dx:2.8,dz:21.5,w:3.8,d:3.7,top:1.82,color:0x88d9f7,kind:'ladder',label:'ESCADA DE SALTOS'},
    {dx:4.8,dz:23.1,w:3.9,d:3.7,top:1.92,color:0xffa05a,kind:'hurdle',checkpoint:true,label:'SALTE A BARREIRA'},
    {dx:1.0,dz:24.9,w:8.4,d:5.0,top:2.00,color:0xffd36a,kind:'finish',checkpoint:false,finish:true,label:'CHEGADA • +XP'}
  ];  // Plataformas mais largas, dois trechos móveis, checkpoints claros e uma reta final mais legível.
  courseSpecs.forEach((spec,i)=>makeParkourPlatform(spec,i));
  // Marcador físico para iniciar: fica no início, não concede XP por ser pisado repetidamente.
  const startTrigger=add(newMapG,new THREE.BoxGeometry(5.8,.09,1.0),0x3bd8e8,new THREE.Vector3(challenge.x,.70,challenge.z-17.7),{rough:.28,m:.08,castShadow:false,receiveShadow:false});
  startTrigger.material.emissive=new THREE.Color(0x127b9b);startTrigger.material.emissiveIntensity=.48;
  // Guias baixas em vez de paredes sólidas: deixam a pista legível e não bloqueiam a câmera/saltos.
  for(const side of [-1,1]){
    const rx=challenge.x+side*8.35,rz=challenge.z,railLen=56.0;
    const rail=add(newMapG,softenedBoxGeometry(.105,.12,railLen,.045,.018),side<0?0x48d7e9:0x9c82ff,new THREE.Vector3(rx,.73,rz),{rough:.30,m:.10,castShadow:false,receiveShadow:false});
    rail.material.emissive=new THREE.Color(rail.material.color);rail.material.emissiveIntensity=.25;
    for(let k=0;k<=18;k++){
      const post=add(newMapG,new THREE.CylinderGeometry(.045,.07,.62,8),0xe5e8e5,new THREE.Vector3(rx,.39,rz-railLen/2+k*(railLen/18)),{rough:.42,castShadow:false,receiveShadow:false});
      add(newMapG,new THREE.SphereGeometry(.075,8,6),side<0?0x65eaff:0xc1a5ff,new THREE.Vector3(rx,.73,post.position.z),{rough:.28,m:.08,castShadow:false,receiveShadow:false});
    }
  }
  const finishArch=new THREE.Group();finishArch.position.set(challenge.x,0,challenge.z+23.2);newMapG.add(finishArch);
  for(const side of [-1,1])add(finishArch,new THREE.BoxGeometry(.22,3.0,.22),0xffd76b,new THREE.Vector3(side*4.0,2.1,0),{rough:.3,m:.08});
  const finTop=add(finishArch,new THREE.BoxGeometry(8.2,.30,.24),0x65e5ed,new THREE.Vector3(0,3.65,0),{rough:.25,m:.1});finTop.material.emissive=new THREE.Color(0x219db9);finTop.material.emissiveIntensity=.5;
  nlabel('🏁 CHEGADA • +10 XP',challenge.x,6.0,challenge.z+23.2,.52,'#fff0bd');
  nlabel('ILHA DOS DESAFIOS',challenge.x,8.0,challenge.z-4.8,.68,'#dfffff');

  [center,school,build,park,combat,maze,challenge,snow,volcano,desert,ruins,multiplayer].forEach(is=>{
    const gaps=boundaryGaps.get(is)||[];
    const segments=72;
    const guardRadius=is.r+.12;
    const gapAngle=Math.min(.22,Math.max(.16,Math.asin(Math.min(.95,4.35/is.r))+.035));
    for(let i=0;i<segments;i++){
      const a=(i/segments)*Math.PI*2;
      const open=gaps.some(g=>Math.abs(Math.atan2(Math.sin(a-g),Math.cos(a-g)))<gapAngle);
      if(open)continue;
      const rr=guardRadius+islandEdgeOffset(a,is.seed||0,1.68),xx=is.x+Math.cos(a)*rr,zz=is.z+Math.sin(a)*rr;
      newColliderDefs.push({minX:xx-.18,maxX:xx+.18,minZ:zz-.18,maxZ:zz+.18,maxY:1.38});
    }
    islandRail(is.x,is.z,is.r,gaps,is.seed||0);
  });
}
try{buildNewWorld();}catch(err){window.__GL_MAP_BUILD_ERROR__=String(err && (err.stack||err.message)||err);console.warn("Falha ao montar Cidade da Geometria:",err);newMapG.visible=true;}
function setMapColliders(mode){
  colliders.splice(0,colliders.length);hazards.splice(0,hazards.length);
  const definitions=mode==="classic"?classicColliderDefs:newColliderDefs;
  for(const def of definitions){
    const runtime={...def,source:def,_glSpatialKeys:[],_glQueryStamp:0};
    delete runtime._glRuntimeCollider;
    def._glRuntimeCollider=runtime;
    colliders.push(runtime);
  }
  (mode==="classic"?classicHazards:newHazards).forEach(h=>hazards.push({...h}));
  glRebuildColliderGrid();
  glRebuildFloorGrid();
}
function applyMap(mode="new"){
  state.mapMode=mode==="classic"?"classic":"new";
  classicMapG.visible=state.mapMode==="classic";newMapG.visible=state.mapMode==="new";
  // Os sólidos de demonstração do mapa clássico (o antigo "museu de formas") não devem aparecer na Cidade.
  for(const obj of objectG.children)if(obj.userData?.display)obj.visible=state.mapMode==="classic";
  if(state.mapMode==="new"&&newMapG.children.length===0){try{buildNewWorld()}catch(err){window.__GL_MAP_BUILD_ERROR__=String(err&&err.stack||err)}}
  setMapColliders(state.mapMode);state.mapBoundaryRadius=state.mapMode==="new"?185:32.4;
  if(state.mapMode==="new"){scene.background.set(0x6098ba);scene.fog.color.set(0x86acb8);scene.fog.near=125;scene.fog.far=430}
  else{scene.background.set(0xf3c9aa);scene.fog.color.set(0xf3c9aa);scene.fog.near=42;scene.fog.far=125}
  movePlayerToSafeSpawn(state.mapMode);
  if($('mapTitle'))$('mapTitle').textContent=state.mapMode==="classic"?"MAPA CLÁSSICO":"CIDADE DA GEOMETRIA";
  if($('mapSubtitle'))$('mapSubtitle').textContent=state.mapMode==="classic"?"Arena tradicional e direta.":"Cristais, magma, moedas, runas, tesouro e circuito cronometrado nas novas ilhas.";
  updateMapZones();
}
function nearestRegion(){const p=player.position;if(state.mapMode==="classic")return p.z>10?"ARENA DE DESAFIOS":"BASE CLÁSSICA";const zones=[["CENTRO",0,0],["ESCOLA / APRENDIZADO",-58,36],["ÁREA DE CONSTRUÇÃO",58,36],["PARQUE DAS FIGURAS",-60,-20],["ARENA DE COMBATE",60,-20],["LABIRINTO",0,-70],["ILHA DOS DESAFIOS",0,82],["ÁREA DE NEVE",-118,96],["ÁREA VULCÂNICA",116,92],["DESERTO",-116,-84],["RUÍNAS FLUTUANTES",0,145],["ARENA MULTIPLAYER",126,-28]];let best=zones[0],bd=Infinity;for(const z of zones){const d=Math.hypot(p.x-z[1],p.z-z[2]);if(d<bd){bd=d;best=z}}return best[0];}
function updateMapZones(){if($('currentRegion'))$('currentRegion').textContent=nearestRegion();if(!$('mapPlayerDot'))return;const r=state.mapMode==="new"?175:34;const px=Math.max(5,Math.min(95,50+(player.position.x/r)*44));const py=Math.max(5,Math.min(95,50+(player.position.z/r)*44));$('mapPlayerDot').style.left=px+"%";$('mapPlayerDot').style.top=py+"%";if($('mapPlayerLocation'))$('mapPlayerLocation').textContent="📍 Você está em "+nearestRegion();}

/* ---------- Player ---------- */
const player=new THREE.Group();actors.add(player);player.position.set(0,0,25);
function part(geo,c,pos,opts={}){return add(player,geo,c,pos,{...opts})}
const bodyCore=part(new THREE.CapsuleGeometry(.55,.9,6,12),0x24549e,new THREE.Vector3(0,1.35,0),{flat:true});
const ph=part(new THREE.SphereGeometry(.58,20,14),0x63d8e9,new THREE.Vector3(0,2.12,0),{rough:.43});ph.scale.set(1,.75,1);
const defaultVisor=part(new THREE.BoxGeometry(.62,.18,.5),0x0b213c,new THREE.Vector3(0,2.18,.46),{rough:.3,metal:.14});
const torso=part(new THREE.BoxGeometry(.68,.7,.25),0x183d74,new THREE.Vector3(0,1.55,-.48),{rough:.56});
const armL=part(new THREE.CapsuleGeometry(.17,.52,4,8),0x2d69bc,new THREE.Vector3(-.66,1.48,0),{flat:true});
const armR=part(new THREE.CapsuleGeometry(.17,.52,4,8),0x2d69bc,new THREE.Vector3(.66,1.48,0),{flat:true});
const legL=part(new THREE.CapsuleGeometry(.18,.5,4,8),0x1a3f75,new THREE.Vector3(-.22,.55,0),{flat:true});
const legR=part(new THREE.CapsuleGeometry(.18,.5,4,8),0x1a3f75,new THREE.Vector3(.22,.55,0),{flat:true});
const characterExtras=new THREE.Group();player.add(characterExtras);
let characterConfig={name:"Player",outfit:"lab",head:"none",body:"normal",skin:"light",hair:"none",hairColor:"black",face:"none",back:"none"};
const SKIN_COLORS={light:0xf1c7b0,medium:0xd79a7d,tan:0xb97858,brown:0x87533f,dark:0x57352e};
const HAIR_COLORS={black:0x1b1b22,brown:0x633d28,blond:0xe0b766,red:0x8e3f2c,blue:0x3c66d8};
const OUTFIT_COLORS={lab:0x24549e,astronaut:0xe8eef5,ninja:0x252a37,robot:0x7d8796,royal:0x7d36c9,explorer:0x8b6a43,pilot:0x3a5f86,crewmate:0xe7190a,bomberman:0xf5f4ef,mario:0xe62b24,luigi:0x22a452,yoshi:0x55c847,toad:0xf5f0e8,creeper:0x51ad3e,sonic:0x1671ed,kirby:0xf58fbd,pacman:0xffd52a,steve:0x3bb6a1,pikachu:0xffdf24};
const SPECIAL_CHARACTER_OUTFITS=new Set(["crewmate","bomberman","mario","luigi","yoshi","toad","creeper","sonic","kirby","pacman","steve","pikachu"]);
function extraMat(color,opts={}){return new THREE.MeshStandardMaterial({color,roughness:opts.rough??.5,metalness:opts.metal??.02,transparent:!!opts.transparent,opacity:opts.opacity??1,side:opts.side??THREE.FrontSide})}
function groupExtra(group,geo,color,pos,opts={}){const m=new THREE.Mesh(geo,extraMat(color,opts));m.position.copy(pos);m.castShadow=true;m.receiveShadow=true;group.add(m);return m}
function extra(geo,color,pos,opts={}){return groupExtra(characterExtras,geo,color,pos,opts)}
function disposeCharacterNode(node){
  node.traverse?.(child=>{
    if(child.geometry&&child.geometry!==undefined)child.geometry.dispose?.();
    if(Array.isArray(child.material))child.material.forEach(x=>x?.dispose?.());else child.material?.dispose?.();
  });
}
function clearCharacterExtras(){while(characterExtras.children.length){const m=characterExtras.children[characterExtras.children.length-1];characterExtras.remove(m);disposeCharacterNode(m)}characterExtras.position.set(0,0,0);delete characterExtras.userData.characterAnimation;}
function buildCrewmateModel(target=characterExtras){
  const put=(geo,color,pos,opts={})=>groupExtra(target,geo,color,pos,opts);
  const anim={root:null,body:null,head:null,arms:[],legs:[],hands:[],feet:[],ears:[],tail:null,mouth:null};
  const red=0xe7190a,redShade=0x92212d,glassEdge=0x294854,glass=0x83dff3,glint=0xe9fbff;
  // Rounded capsule shell with the familiar short-leg silhouette.
  const shell=put(new THREE.CapsuleGeometry(.59,.88,10,24),red,new THREE.Vector3(0,1.28,0),{rough:.38});shell.scale.set(1,.98,.82);anim.body=shell;
  // Raised, beveled backpack sits behind the shell instead of reading as a flat rectangle.
  const pack=put(softenedBoxGeometry(.40,.76,.56,.10,.035),redShade,new THREE.Vector3(-.55,1.30,-.10),{rough:.48});pack.rotation.y=-.04;
  put(softenedBoxGeometry(.29,.48,.10,.07,.025),0xb92732,new THREE.Vector3(-.57,1.28,-.405),{rough:.5});
  for(const side of [-1,1]){
    const arm=put(new THREE.CapsuleGeometry(.155,.40,7,14),red,new THREE.Vector3(side*.60,1.34,.015),{rough:.4});arm.rotation.z=-side*.08;anim.arms.push(arm);
    const boot=put(new THREE.CapsuleGeometry(.185,.33,7,14),redShade,new THREE.Vector3(side*.275,.38,.035),{rough:.48});boot.scale.set(1.08,1,.96);anim.legs.push(boot);
  }
  // Broad, rounded rectangular glass visor with a dark gasket and raised reflection.
  const rim=put(softenedBoxGeometry(.76,.43,.18,.18,.035),glassEdge,new THREE.Vector3(0,1.79,.445),{rough:.28,metal:.08});rim.rotation.x=-.035;
  const visor=put(softenedBoxGeometry(.65,.32,.15,.13,.03),glass,new THREE.Vector3(0,1.805,.525),{rough:.22,metal:.10});visor.rotation.x=-.035;
  const highlight=put(softenedBoxGeometry(.26,.055,.025,.025,.008),glint,new THREE.Vector3(-.105,1.895,.605),{rough:.18});highlight.rotation.z=-.10;highlight.rotation.x=-.03;
  const lowerGlint=put(softenedBoxGeometry(.12,.025,.018,.012,.005),0xc4f3ff,new THREE.Vector3(.18,1.73,.606),{rough:.2});lowerGlint.rotation.z=.08;
  target.userData.characterAnimation=anim;rememberCharacterRestPose(target);
}
function buildBombermanModel(target=characterExtras){
  const put=(geo,color,pos,opts={})=>groupExtra(target,geo,color,pos,opts);
  const anim={root:null,body:null,head:null,arms:[],legs:[],hands:[],feet:[],ears:[],tail:null,mouth:null};
  const white=0xf7f5ee,outline=0x262936,navy=0x29304b,pink=0xe96b9c,pinkDark=0xa93c68,grey=0xbfcbd2,yellow=0xf6d74d,shine=0xffffff;
  const head=put(new THREE.SphereGeometry(.53,32,22),white,new THREE.Vector3(0,2.02,0),{rough:.32});head.scale.set(1.02,.99,.90);anim.head=head;
  // The face is part of the white helmet, with distinct rounded eyes rather than a giant inset mask.
  for(const x of [-.145,.145]){
    const eye=put(new THREE.SphereGeometry(.060,16,12),outline,new THREE.Vector3(x,2.045,.448),{rough:.24});eye.scale.set(.72,1.60,.52);
    put(new THREE.SphereGeometry(.018,10,8),shine,new THREE.Vector3(x-.012,2.075,.477),{rough:.16});
  }
  const neck=put(new THREE.CylinderGeometry(.19,.21,.16,18),grey,new THREE.Vector3(0,1.64,0),{rough:.34,metal:.06});
  const torso=put(new THREE.CapsuleGeometry(.34,.46,8,16),white,new THREE.Vector3(0,1.29,0),{rough:.4});torso.scale.set(1.02,1,.88);anim.body=torso;
  // Belt and gold buckle echo the classic Bomberman suit.
  put(softenedBoxGeometry(.57,.14,.38,.045,.016),navy,new THREE.Vector3(0,1.28,.015),{rough:.38});
  put(softenedBoxGeometry(.16,.12,.055,.025,.012),yellow,new THREE.Vector3(0,1.29,.222),{rough:.26,metal:.10});
  for(const side of [-1,1]){
    const arm=put(new THREE.CapsuleGeometry(.145,.36,6,12),white,new THREE.Vector3(side*.44,1.40,.015),{rough:.4});arm.rotation.z=side*.16;anim.arms.push(arm);
    const glove=put(new THREE.SphereGeometry(.195,20,14),pink,new THREE.Vector3(side*.64,1.44,.045),{rough:.31});glove.scale.set(1.02,.98,.92);anim.hands.push(glove);
    const leg=put(new THREE.CapsuleGeometry(.125,.33,6,12),white,new THREE.Vector3(side*.19,.64,.005),{rough:.44});leg.rotation.z=side*.08;anim.legs.push(leg);
    const shoe=put(new THREE.SphereGeometry(.22,20,14),pinkDark,new THREE.Vector3(side*.245,.30,.12),{rough:.34});shoe.scale.set(1.06,.78,1.42);shoe.rotation.y=side*.10;anim.feet.push(shoe);
  }
  put(new THREE.CylinderGeometry(.035,.045,.19,12),grey,new THREE.Vector3(0,2.57,0),{rough:.32,metal:.08});
  const antennaBall=put(new THREE.SphereGeometry(.15,22,16),pink,new THREE.Vector3(0,2.70,0),{rough:.25});
  put(new THREE.SphereGeometry(.045,12,8),0xffd9e6,new THREE.Vector3(-.05,2.75,.10),{rough:.2});
  target.userData.characterAnimation=anim;rememberCharacterRestPose(target);
}
function rememberCharacterRestPose(target){
  const a=target?.userData?.characterAnimation;if(!a)return;
  target.userData.characterRestY=target.position.y;
  const objects=[a.root,a.body,a.head,a.tail,a.mouth,...(a.arms||[]),...(a.legs||[]),...(a.hands||[]),...(a.feet||[]),...(a.ears||[])].filter(Boolean);
  for(const o of new Set(objects))o.userData.animationRest={rotation:{x:o.rotation.x,y:o.rotation.y,z:o.rotation.z},position:{x:o.position.x,y:o.position.y,z:o.position.z},scale:{x:o.scale.x,y:o.scale.y,z:o.scale.z}};
}
function characterPart(group,geo,color,x,y,z,offsetY,opts={}){
  return groupExtra(group,geo,color,new THREE.Vector3(x,y-offsetY,z),opts);
}
function characterPivot(root,x,y,z,offsetY){
  const g=new THREE.Group();g.position.set(x,y-offsetY,z);root.add(g);return g;
}
function buildClassicCharacterModel(outfit,target=characterExtras){
  const offsetY=1.25, root=new THREE.Group();root.position.y=offsetY;target.add(root);
  const put=(geo,color,x,y,z,opts={})=>characterPart(root,geo,color,x,y,z,offsetY,opts);
  const head=new THREE.Group();head.position.set(0,2.0-offsetY,0);root.add(head);
  const headPut=(geo,color,x,y,z,opts={})=>groupExtra(head,geo,color,new THREE.Vector3(x,y,z),opts);
  const arm=(side,color,radius=.13,length=.40,opts={})=>{
    const pivot=characterPivot(root,side*.37,1.55,.015,offsetY);
    groupExtra(pivot,new THREE.CapsuleGeometry(radius,length,5,10),color,new THREE.Vector3(0,-length*.46,0),opts);
    return pivot;
  };
  const leg=(side,color,radius=.14,length=.42,shoeColor=color,shoeScale=[1,.72,1.38],opts={})=>{
    const pivot=characterPivot(root,side*.16,.84,.005,offsetY);
    groupExtra(pivot,new THREE.BoxGeometry(radius*1.9,length,.22),color,new THREE.Vector3(0,-length*.48,0),opts);
    const shoe=groupExtra(pivot,new THREE.SphereGeometry(radius*1.28,14,10),shoeColor,new THREE.Vector3(0,-length-.075,.08),{rough:.42});shoe.scale.set(...shoeScale);
    return pivot;
  };
  const refs={root,body:null,head,arms:[],legs:[],ears:[],tail:null,mouth:null};

  if(outfit==='mario'||outfit==='luigi'){
    const red=outfit==='luigi'?0x159447:0xe72c28,blue=0x2454c7,skin=0xf1b58d,brown=0x62341f,dark=0x2b2020,white=0xf8f7ef,gold=0xf5c543;
    refs.body=put(new THREE.CapsuleGeometry(.29,.52,6,12),blue,0,1.32,0,{rough:.52});
    put(new THREE.BoxGeometry(.55,.42,.29),blue,0,1.38,.015);
    put(new THREE.BoxGeometry(.43,.19,.08),blue,0,1.59,.17);
    for(const x of [-.13,.13])put(new THREE.SphereGeometry(.055,10,8),gold,x,1.58,.225);
    const h=headPut(new THREE.SphereGeometry(.385,20,16),skin,0,.03,0,{rough:.58});h.scale.set(1,.98,.9);
    headPut(new THREE.SphereGeometry(.425,20,12,0,Math.PI*2,0,Math.PI*.56),red,0,.30,0);
    const brim=headPut(new THREE.SphereGeometry(.30,18,10,0,Math.PI*2,0,Math.PI*.42),red,0,.18,.16);brim.scale.set(1,.35,.9);
    // Two dimensional eyeballs and irises are separate raised pieces, not a single painted strip.
    for(const side of [-1,1]){
      const eye=headPut(new THREE.SphereGeometry(.078,16,12),white,side*.115,.055,.318);eye.scale.set(.78,1.23,.48);
      const iris=headPut(new THREE.SphereGeometry(.043,12,10),outfit==='luigi'?0x315ca8:0x2d62cf,side*.112,.045,.357);iris.scale.set(.72,1.12,.48);
      headPut(new THREE.SphereGeometry(.021,10,8),dark,side*.112,.045,.374);
    }
    const nose=headPut(new THREE.SphereGeometry(.112,18,12),skin,0,-.065,.355);nose.scale.set(1.02,.86,1);
    for(const side of [-1,1]){const moust=headPut(new THREE.SphereGeometry(.17,16,12),brown,side*.13,-.17,.30);moust.scale.set(1.15,.58,.60);headPut(new THREE.SphereGeometry(.105,12,8),brown,side*.29,-.13,.26);}
    const badge=headPut(new THREE.SphereGeometry(.105,16,12),white,0,.30,.31);badge.scale.set(1,1.08,.4);
    if(outfit==='luigi'){
      // Raised green L on the white cap badge.
      headPut(new THREE.BoxGeometry(.030,.115,.028),red,0,.32,.354);
      headPut(new THREE.BoxGeometry(.072,.030,.028),red,.020,.272,.354);
    }else{
      // Raised red M on Mario's cap badge.
      headPut(new THREE.BoxGeometry(.027,.105,.026),0xe62b24,-.045,.30,.354);
      headPut(new THREE.BoxGeometry(.027,.105,.026),0xe62b24,.045,.30,.354);
      const mdiag=headPut(new THREE.BoxGeometry(.027,.078,.026),0xe62b24,0,.309,.354);mdiag.rotation.z=-.26;
    }
    // Colored sleeves and gloves are separate 3D pieces, so Mario and Luigi keep readable silhouettes.
    refs.arms=[arm(-1,red,.13,.40),arm(1,red,.13,.40)];
    for(const a of refs.arms)groupExtra(a,new THREE.SphereGeometry(.14,14,10),white,new THREE.Vector3(0,-.43,.015));
    refs.legs=[leg(-1,blue,.15,.38,0x5c351f,[1.1,.72,1.45]),leg(1,blue,.15,.38,0x5c351f,[1.1,.72,1.45])];
  }else if(outfit==='yoshi'){
    const green=0x55c847,light=0xf6f2df,red=0xe63f43,orange=0xf28b25,dark=0x25302a,white=0xffffff;
    refs.body=put(new THREE.SphereGeometry(.44,28,20),green,0,1.25,0,{rough:.46});refs.body.scale.set(1.02,1.09,.94);
    const belly=put(new THREE.SphereGeometry(.33,22,16),light,0,1.23,.30);belly.scale.set(.90,1.06,.37);
    const neck=put(new THREE.CapsuleGeometry(.20,.34,7,14),green,0,1.63,.015);neck.scale.set(.90,1.18,.86);
    const h=headPut(new THREE.SphereGeometry(.405,28,20),green,0,.08,.12);h.scale.set(1.04,1.02,.96);
    const muzzle=headPut(new THREE.SphereGeometry(.29,24,18),light,0,-.13,.405);muzzle.scale.set(1.20,.79,.88);
    // Large forward-facing eyes make the silhouette read as Yoshi instead of a generic lizard.
    for(const side of [-1,1]){
      const eye=headPut(new THREE.SphereGeometry(.135,18,14),white,side*.13,.185,.355);eye.scale.set(.84,1.24,.64);
      const iris=headPut(new THREE.SphereGeometry(.066,14,10),0x2c302b,side*.12,.166,.421);iris.scale.set(.82,1.18,.65);
      headPut(new THREE.SphereGeometry(.025,10,8),white,side*.105,.195,.454);
      const nostril=headPut(new THREE.SphereGeometry(.035,12,8),0x514b45,side*.105,-.105,.648);nostril.scale.set(1,.78,.55);
    }
    // Red saddle shell with a pale raised rim and three orange dorsal plates.
    const saddle=put(new THREE.SphereGeometry(.30,24,16),red,0,1.59,-.205);saddle.scale.set(1.08,.50,.88);
    const saddleRim=put(new THREE.TorusGeometry(.25,.035,8,28),0xf5e9d6,new THREE.Vector3(0,1.59,-.205),{rough:.4});saddleRim.rotation.x=Math.PI/2;saddleRim.scale.set(1.05,.82,1);
    for(let i=0;i<3;i++){const spike=put(new THREE.ConeGeometry(.115,.25,8),orange,-.18+i*.18,1.77,-.28-i*.015);spike.rotation.z=.10;}
    refs.arms=[characterPivot(root,-.40,1.39,.02,offsetY),characterPivot(root,.40,1.39,.02,offsetY)];
    refs.arms.forEach((a,i)=>{const limb=groupExtra(a,new THREE.CapsuleGeometry(.10,.28,6,12),green,new THREE.Vector3(i?.02:-.02,-.08,.03));limb.rotation.z=i?-.25:.25;groupExtra(a,new THREE.SphereGeometry(.11,14,10),light,new THREE.Vector3(i?.025:-.025,-.20,.05));});
    refs.legs=[characterPivot(root,-.20,.78,.025,offsetY),characterPivot(root,.20,.78,.025,offsetY)];
    refs.legs.forEach((l,i)=>{groupExtra(l,new THREE.CapsuleGeometry(.125,.24,6,12),green,new THREE.Vector3(0,-.11,0));const shoe=groupExtra(l,new THREE.SphereGeometry(.205,18,12),orange,new THREE.Vector3(i?.045:-.045,-.235,.12));shoe.scale.set(1.12,.72,1.42);});
    const tail=put(new THREE.ConeGeometry(.15,.40,10),green,0,1.18,-.48);tail.rotation.x=Math.PI/2;tail.rotation.z=Math.PI;refs.tail=tail;
  }else if(outfit==='toad'){
    const skin=0xf1d6b3,white=0xf9f7f0,red=0xe9434f,blue=0x2868bf,dark=0x2b2830,brown=0x6e4732;
    refs.body=put(new THREE.CapsuleGeometry(.24,.38,6,12),white,0,1.30,0,{rough:.54});
    const vest=put(new THREE.CapsuleGeometry(.275,.30,6,12),blue,0,1.31,.025,{rough:.48});vest.scale.set(1.04,1,.92);
    const h=headPut(new THREE.SphereGeometry(.39,24,18),skin,0,.02,.04);h.scale.set(1,.91,.88);
    // Domed mushroom cap and raised white spots are individual 3D meshes, not a face texture.
    const cap=headPut(new THREE.SphereGeometry(.60,30,18,0,Math.PI*2,0,Math.PI/2),red,0,.29,.015);cap.scale.set(1.12,.86,1.02);
    const spot=(x,y,z,r=.105)=>{const m=headPut(new THREE.SphereGeometry(r,14,10),white,x,y,z);m.scale.set(1,.8,.55);return m};
    spot(0,.57,.33,.14);spot(-.35,.38,.22,.11);spot(.35,.38,.22,.11);spot(0,.30,-.29,.105);
    for(const side of [-1,1]){const eye=headPut(new THREE.SphereGeometry(.055,12,10),dark,side*.14,-.015,.385);eye.scale.set(.75,1.4,.5);}
    refs.arms=[arm(-1,white,.105,.30),arm(1,white,.105,.30)];
    refs.legs=[leg(-1,brown,.13,.34,brown,[1.05,.7,1.4]),leg(1,brown,.13,.34,brown,[1.05,.7,1.4])];
  }else if(outfit==='creeper'){
    const green=0x56ad41,dark=0x1b2b20,mid=0x3b8737,light=0x8bd461;
    refs.body=put(new THREE.BoxGeometry(.70,.80,.48),mid,0,1.22,0,{rough:.88});
    const headMesh=put(new THREE.BoxGeometry(.72,.68,.66),green,0,1.94,.015,{rough:.84});headMesh.userData.characterFace=true;refs.head=headMesh;
    // Classic pixel face: square eyes plus the stepped mouth, all solid raised blocks.
    for(const side of [-1,1])put(new THREE.BoxGeometry(.17,.10,.055),dark,side*.17,2.035,.365,{rough:.94});
    put(new THREE.BoxGeometry(.115,.18,.055),dark,0,1.875,.365,{rough:.94});
    put(new THREE.BoxGeometry(.31,.10,.055),dark,0,1.785,.365,{rough:.94});
    for(const x of [-.105,.105])put(new THREE.BoxGeometry(.10,.105,.055),dark,x,1.685,.365,{rough:.94});
    // Sparse square pigment patches on the torso reinforce the low-resolution Minecraft look.
    const patches=[[ -.22,1.43,0x4a9d3c],[0,1.49,0x69b950],[.22,1.36,0x68b64d],[-.12,1.12,0x2d7733],[.14,1.03,0x5ba745],[-.24,1.01,0x72be50],[.02,.94,0x488f39]];
    for(const [x,y,c] of patches){const z=.245;put(new THREE.BoxGeometry(.105,.095,.025),c,x,y,z,{rough:.92});}
    // Creeper has no arms: its signature silhouette is a tall body and four short block legs.
    refs.arms=[];refs.legs=[];
    for(const [x,z] of [[-.20,.17],[.20,-.17],[.20,.17],[-.20,-.17]]){
      const legRoot=characterPivot(root,x,.77,z,offsetY);
      groupExtra(legRoot,new THREE.BoxGeometry(.235,.43,.235),mid,new THREE.Vector3(0,-.215,0),{rough:.86});
      groupExtra(legRoot,new THREE.BoxGeometry(.245,.12,.245),green,new THREE.Vector3(0,-.43,0),{rough:.88});
      refs.legs.push(legRoot);
    }
  }else if(outfit==='sonic'){
    const blue=0x0878e8,skin=0xf3c69b,white=0xf6f5ec,red=0xe82e39,dark=0x171c2c;
    refs.body=put(new THREE.SphereGeometry(.44,20,16),blue,0,1.36,0);refs.body.scale.set(.82,1.15,.76);
    const belly=put(new THREE.SphereGeometry(.30,16,12),skin,0,1.30,.28);belly.scale.set(.88,1.12,.30);
    const h=headPut(new THREE.SphereGeometry(.47,22,16),blue,0,.02,0);h.scale.set(1,.96,.9);
    const muzzle=headPut(new THREE.SphereGeometry(.27,16,12),skin,0,-.14,.32);muzzle.scale.set(1,.72,.70);
    headPut(new THREE.SphereGeometry(.075,12,8),dark,0,-.08,.51);
    for(const side of [-1,1]){
      const eye=headPut(new THREE.SphereGeometry(.12,12,10),white,side*.115,.10,.36);eye.scale.set(.78,1.3,.46);
      headPut(new THREE.SphereGeometry(.045,10,8),dark,side*.12,.085,.415);
      const quill=headPut(new THREE.ConeGeometry(.20,.56,9),blue,side*.19,.26,-.23);quill.rotation.x=-Math.PI/2;quill.rotation.z=side*.18;
    }
    const backQuill=put(new THREE.ConeGeometry(.23,.62,9),blue,0,1.78,-.31);backQuill.rotation.x=-Math.PI/2;
    refs.arms=[arm(-1,blue,.12,.40),arm(1,blue,.12,.40)];
    for(const a of refs.arms)groupExtra(a,new THREE.SphereGeometry(.17,14,10),white,new THREE.Vector3(0,-.43,.025));
    refs.legs=[leg(-1,blue,.14,.37,red,[1.2,.72,1.55]),leg(1,blue,.14,.37,red,[1.2,.72,1.55])];
    for(const l of refs.legs){groupExtra(l,new THREE.BoxGeometry(.22,.055,.06),white,new THREE.Vector3(0,-.67,.155));}
  }else if(outfit==='kirby'){
    const pink=0xf58fbd,red=0xc83c5c,eye=0x202a4c,blush=0xf06d91;
    refs.body=put(new THREE.SphereGeometry(.70,26,20),pink,0,1.23,0,{rough:.5});
    for(const side of [-1,1]){
      const eyes=put(new THREE.SphereGeometry(.075,12,10),eye,side*.19,1.47,.60);eyes.scale.set(.82,1.55,.50);
      put(new THREE.SphereGeometry(.095,12,10),blush,side*.37,1.25,.55).scale.set(1.25,.65,.35);
    }
    put(new THREE.SphereGeometry(.045,10,8),0xffffff,-.205,1.55,.635);
    refs.arms=[characterPivot(root,-.65,1.24,.0,offsetY),characterPivot(root,.65,1.24,.0,offsetY)];
    refs.arms.forEach((a,i)=>{const m=groupExtra(a,new THREE.SphereGeometry(.19,14,10),pink,new THREE.Vector3((i===0?-.05:.05),-.02,.02));m.scale.set(1.1,.80,.86)});
    refs.legs=[characterPivot(root,-.32,.66,.06,offsetY),characterPivot(root,.32,.66,.06,offsetY)];
    refs.legs.forEach((l,i)=>{const m=groupExtra(l,new THREE.SphereGeometry(.24,14,10),red,new THREE.Vector3(0,-.02,.07));m.scale.set(1.25,.70,1.45);m.rotation.y=i===0?-.12:.12});
  }else if(outfit==='pacman'){
    const yellow=0xffd329,dark=0x171719,white=0xffffff,blue=0x285dd7;
    refs.body=put(new THREE.SphereGeometry(.72,44,32),yellow,0,1.25,0,{rough:.38});
    // A spherical-projected, closed 3D mouth insert follows the ball surface instead of a flat triangle decal.
    const mouthShape=new THREE.Shape();mouthShape.moveTo(-.055,.035);mouthShape.lineTo(.62,.26);mouthShape.lineTo(.62,-.26);mouthShape.lineTo(-.055,-.035);mouthShape.closePath();
    const mouthSurface=new THREE.ShapeGeometry(mouthShape,1);const source=mouthSurface.attributes.position;const count=source.count;const front=[],back=[];const radius=.72,depth=.20;
    for(let i=0;i<count;i++){
      const x=source.getX(i),y=source.getY(i);const surf=Math.sqrt(Math.max(.015,radius*radius-x*x-y*y));front.push(x,y,surf+.009);back.push(x,y,Math.max(.02,surf-depth));
    }
    const mouthIndices=mouthSurface.index?Array.from(mouthSurface.index.array):Array.from({length:count},(_,i)=>i);const all=[...front,...back],allIndices=[];
    for(let i=0;i<mouthIndices.length;i+=3){const a=mouthIndices[i],b=mouthIndices[i+1],c=mouthIndices[i+2];allIndices.push(a,b,c,c+count,b+count,a+count);}
    // Close the wedge sidewalls as quads. The outline is the four-point closed polygon used above.
    const edgePts=[[-.055,.035],[.62,.26],[.62,-.26],[-.055,-.035]];
    for(let i=0;i<edgePts.length;i++){
      const j=(i+1)%edgePts.length;allIndices.push(i,j,j+count,i,j+count,i+count);
    }
    const mouthGeo=new THREE.BufferGeometry();mouthGeo.setAttribute('position',new THREE.Float32BufferAttribute(all,3));mouthGeo.setIndex(allIndices);mouthGeo.computeVertexNormals();
    const mouth=groupExtra(root,mouthGeo,dark,new THREE.Vector3(0,1.25-offsetY,0),{rough:.85});refs.mouth=mouth;mouthSurface.dispose();
    // Dimensional lip ridges blend the mouth insert into the curved yellow head.
    const topLip=groupExtra(root,new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.045,.035,.716),new THREE.Vector3(.30,.16,.638),new THREE.Vector3(.62,.26,.267)),20,.025,8,false),yellow,new THREE.Vector3(0,1.25-offsetY,0),{rough:.4});
    const bottomLip=groupExtra(root,new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.045,-.035,.716),new THREE.Vector3(.30,-.16,.638),new THREE.Vector3(.62,-.26,.267)),20,.025,8,false),yellow,new THREE.Vector3(0,1.25-offsetY,0),{rough:.4});
    const eye=put(new THREE.SphereGeometry(.092,18,14),white,-.275,1.585,.655);eye.scale.set(.92,1.13,.55);
    put(new THREE.SphereGeometry(.044,14,10),dark,-.268,1.58,.701).scale.set(.82,1.12,.50);
    // Pac-Man has no separate human-like arms or shoes; body squash supplies its classic bounce.
    refs.legs=[];refs.arms=[];
  }else if(outfit==='steve'){
    const skin=0xb9825d,hair=0x4b2d20,shirt=0x28a9a0,pants=0x293eaa,shoe=0x342b25,white=0xf6f4e9,iris=0x4a91d5;
    refs.body=put(new THREE.BoxGeometry(.58,.62,.31),shirt,0,1.34,0);
    put(new THREE.BoxGeometry(.42,.28,.08),shirt,0,1.53,.19);
    const face=headPut(new THREE.BoxGeometry(.49,.48,.46),skin,0,0,0);face.userData.characterFace=true;
    headPut(new THREE.BoxGeometry(.50,.10,.48),hair,0,.22,-.005);
    headPut(new THREE.BoxGeometry(.50,.21,.06),hair,0,.12,-.205);
    for(const side of [-1,1]){headPut(new THREE.BoxGeometry(.13,.07,.035),white,side*.12,.02,.237);headPut(new THREE.BoxGeometry(.045,.055,.025),iris,side*.12,.015,.26);}
    headPut(new THREE.BoxGeometry(.26,.12,.03),hair,0,-.16,.24);
    refs.arms=[characterPivot(root,-.39,1.55,0,offsetY),characterPivot(root,.39,1.55,0,offsetY)];
    refs.arms.forEach((a)=>{groupExtra(a,new THREE.BoxGeometry(.22,.40,.24),shirt,new THREE.Vector3(0,-.19,0));groupExtra(a,new THREE.BoxGeometry(.20,.18,.22),skin,new THREE.Vector3(0,-.46,.005));});
    refs.legs=[characterPivot(root,-.15,.88,0,offsetY),characterPivot(root,.15,.88,0,offsetY)];
    refs.legs.forEach((l)=>{groupExtra(l,new THREE.BoxGeometry(.24,.42,.26),pants,new THREE.Vector3(0,-.20,0));groupExtra(l,new THREE.BoxGeometry(.24,.13,.32),shoe,new THREE.Vector3(0,-.46,.045));});
  }else if(outfit==='pikachu'){
    const yellow=0xffdf24,earDark=0x342a28,cheek=0xe94d40,eye=0x24242a,white=0xffffff,brown=0x8c5a32;
    refs.body=put(new THREE.SphereGeometry(.43,20,16),yellow,0,1.24,0);refs.body.scale.set(1.02,1.14,.88);
    const h=headPut(new THREE.SphereGeometry(.42,22,16),yellow,0,.0,.02);h.scale.set(1.03,.98,.90);
    for(const side of [-1,1]){
      const ear=new THREE.Group();ear.position.set(side*.23,.30,-.01);head.add(ear);const e=groupExtra(ear,new THREE.ConeGeometry(.105,.58,8),yellow,new THREE.Vector3(side*.025,.24,0));e.rotation.z=-side*.16;const tip=groupExtra(ear,new THREE.ConeGeometry(.065,.18,8),earDark,new THREE.Vector3(side*.04,.55,0));tip.rotation.z=-side*.16;refs.ears.push(ear);
      headPut(new THREE.SphereGeometry(.055,12,10),eye,side*.19,-.015,.36);
      headPut(new THREE.SphereGeometry(.11,12,10),cheek,side*.32,-.15,.30);
    }
    headPut(new THREE.SphereGeometry(.03,8,6),eye,0,-.08,.40);
    refs.arms=[characterPivot(root,-.40,1.40,.02,offsetY),characterPivot(root,.40,1.40,.02,offsetY)];
    refs.arms.forEach((a,i)=>{const m=groupExtra(a,new THREE.CapsuleGeometry(.10,.25,4,8),yellow,new THREE.Vector3(i===0?-.015:.015,-.09,.01));m.rotation.z=i===0?-.22:.22});
    refs.legs=[characterPivot(root,-.20,.80,.02,offsetY),characterPivot(root,.20,.80,.02,offsetY)];
    refs.legs.forEach((l,i)=>{groupExtra(l,new THREE.CapsuleGeometry(.12,.22,4,8),yellow,new THREE.Vector3(0,-.10,.025));groupExtra(l,new THREE.SphereGeometry(.11,10,8),brown,new THREE.Vector3(0,-.20,.11)).scale.set(1,.65,1.35);});
    const tail=new THREE.Group();tail.position.copy(new THREE.Vector3(-.28,1.40-offsetY,-.34));root.add(tail);
    const bolt=new THREE.Shape();bolt.moveTo(0,0);bolt.lineTo(.19,.16);bolt.lineTo(.06,.35);bolt.lineTo(.34,.50);bolt.lineTo(.08,.52);bolt.lineTo(-.12,.28);bolt.lineTo(.03,.14);bolt.closePath();
    groupExtra(tail,new THREE.ShapeGeometry(bolt),yellow,new THREE.Vector3(-.06,0,0));refs.tail=tail;
  }
  target.userData.characterAnimation=refs;rememberCharacterRestPose(target);
}
function setAnimatedRotation(object,dx=0,dy=0,dz=0){
  if(!object)return;const r=object.userData.animationRest?.rotation||{x:0,y:0,z:0};object.rotation.set(r.x+dx,r.y+dy,r.z+dz);
}
function setAnimatedPositionY(object,offset=0){if(!object)return;const p=object.userData.animationRest?.position||{x:object.position.x,y:object.position.y,z:object.position.z};object.position.y=p.y+offset;}
function setAnimatedScale(object,sx=1,sy=1,sz=1){if(!object)return;const s=object.userData.animationRest?.scale||{x:object.scale.x,y:object.scale.y,z:object.scale.z};object.scale.set(s.x*sx,s.y*sy,s.z*sz);}
function animateCharacterVisual(target,outfit,moving,grounded,phase,time){
  const a=target?.userData?.characterAnimation;if(!a)return;
  const air=!grounded,sw=moving?Math.sin(phase):0,bob=moving&&grounded?Math.abs(Math.sin(phase*2))*.045:0;
  if(a.root){setAnimatedPositionY(a.root,bob);let rx=0,ry=0,rz=0;
    if(outfit==='mario'||outfit==='luigi'){rx=air?-.08:(moving?-.045:0);rz=air?(outfit==='luigi'?.08:-.10):Math.sin(time*2.2)*.015;}
    else if(outfit==='yoshi'){rx=air?-.12:(moving?-.055:0);rz=moving?Math.sin(phase)*.035:Math.sin(time*2)*.012;}
    else if(outfit==='toad'){rz=air?Math.sin(time*6)*.08:(moving?Math.sin(phase)*.03:0);}
    else if(outfit==='creeper'){rx=air?-.03:0;rz=moving?Math.sin(phase)*.025:0;}
    else if(outfit==='sonic'){rx=air?Math.sin(time*13)*.28:(moving?-.10:0);rz=air?Math.sin(time*9)*.22:Math.sin(phase)*.035;}
    else if(outfit==='kirby'){rz=air?Math.sin(time*6)*.08:(moving?Math.sin(phase)*.04:0);}
    else if(outfit==='pacman'){rz=air?-.12:(moving?Math.sin(phase*2)*.05:Math.sin(time*2)*.018);}
    else if(outfit==='steve'){rx=moving?-.025:0;rz=air?-.035:0;}
    else if(outfit==='pikachu'){rz=air?Math.sin(time*8)*.08:(moving?Math.sin(phase)*.035:0);}
    setAnimatedRotation(a.root,rx,ry,rz);
  }else{
    // These two legacy models are built from separately placed meshes rather than a rig.
    // Move the parent group as one piece so face details stay aligned with the body.
    const homeY=target.userData.characterRestY??0;
    target.position.y=homeY+(moving&&!air?bob:(!air?Math.sin(time*2.0)*.004:0));
  }
  const armAmp=outfit==='steve'?.95:outfit==='sonic'?1.05:outfit==='kirby'?.30:outfit==='pacman'?.1:.72;
  (a.arms||[]).forEach((limb,i)=>{
    const side=i%2===0?-1:1;
    const swing=moving?sw*armAmp*side:0;
    const jumpPose=air?((outfit==='mario'||outfit==='luigi')?-.48:outfit==='kirby'?-.85:outfit==='pikachu'?-.30:-.25):0;
    const zPose=air?((outfit==='mario'||outfit==='luigi')?side*-.58:outfit==='kirby'?side*-.18:0):0;
    setAnimatedRotation(limb,swing+(jumpPose),0,zPose);
  });
  (a.legs||[]).forEach((limb,i)=>{
    const side=i%2===0?-1:1;
    const swing=moving?Math.sin(phase+Math.PI*(i%2))*((outfit==='steve')?.78:.64):0;
    const jumpPose=air?((outfit==='mario'||outfit==='luigi')?side*.55:outfit==='yoshi'?side*.28:outfit==='creeper'?side*.08:outfit==='kirby'?.20:outfit==='sonic'?side*.55:outfit==='pikachu'?.35:0):0;
    setAnimatedRotation(limb,swing+jumpPose,0,air?side*.05:0);
  });
  (a.hands||[]).forEach((hand,i)=>setAnimatedRotation(hand,moving?sw*.62*(i%2===0?-1:1):0,0,air?((i%2===0?-1:1)*-.15):0));
  (a.feet||[]).forEach((foot,i)=>setAnimatedRotation(foot,moving?Math.sin(phase+Math.PI*(i%2))*.45:0,0,air?((i%2===0?-1:1)*.12):0));
  (a.ears||[]).forEach((ear,i)=>setAnimatedRotation(ear,Math.sin(time*7+i)*.08,0,Math.sin(time*5+i)*.06));
  if(a.tail)setAnimatedRotation(a.tail,Math.sin(time*5)*.05,Math.sin(time*4)*.08,Math.sin(time*7)*.19);
  if(a.mouth)setAnimatedScale(a.mouth,.88+Math.abs(Math.sin(time*9))*.22,1,1);
  if(outfit==='kirby'&&a.body)setAnimatedScale(a.body,1,air?1.06:(moving?1+Math.abs(sw)*.025:1),1);
  if(outfit==='sonic'&&a.body)setAnimatedScale(a.body,air?1.05:1,air?.92:1,air?1.05:1);
  if(outfit==='pacman'&&a.body)setAnimatedScale(a.body,1,1+Math.sin(time*9)*.018,1);
}
function updateCharacterAnimation(dt){
  const moving=!!state.moveVelocity&&state.moveVelocity.length()>.35,air=!state.grounded,time=performance.now()*.001;
  const stepRate=characterConfig.outfit==='sonic'?2.5:characterConfig.outfit==='steve'?1.25:1.7;
  const phase=(state.walk||0)*stepRate;
  const special=SPECIAL_CHARACTER_OUTFITS.has(characterConfig.outfit);
  if(!special){
    const sw=moving?Math.sin(phase):0;
    armL.rotation.set(air?-.15:sw*.68,0,air?.48:0);armR.rotation.set(air?-.15:-sw*.68,0,air?-.48:0);
    legL.rotation.set(moving?sw*.78:(air?-.35:0),0,air?-.12:0);legR.rotation.set(moving?-sw*.78:(air?-.35:0),0,air?.12:0);
    const bob=moving&&!air?Math.abs(Math.sin(phase*2))*.035:0;
    bodyCore.position.y=1.35+bob;torso.position.y=1.55+bob;ph.position.y=2.12+bob*.7;characterExtras.position.y=bob;
    bodyCore.rotation.z=air?-.055:(moving?-.025:0);torso.rotation.z=bodyCore.rotation.z;ph.rotation.z=air?-.035:0;
  }else{
    // Special characters keep their original materials and shapes; only pose transforms change.
    characterExtras.position.y=0;armL.rotation.set(0,0,0);armR.rotation.set(0,0,0);legL.rotation.set(0,0,0);legR.rotation.set(0,0,0);
  }
  animateCharacterVisual(characterExtras,characterConfig.outfit,moving,!air,phase,time);
}

function applyCharacterCustomization(cfg={},playerColor){
  characterConfig={...characterConfig,...cfg};
  const mainColor=Number(playerColor)||OUTFIT_COLORS[characterConfig.outfit]||0x24549e;
  const outfit=OUTFIT_COLORS[characterConfig.outfit]||mainColor;
  const skin=SKIN_COLORS[characterConfig.skin]||SKIN_COLORS.light;
  const hair=HAIR_COLORS[characterConfig.hairColor]||HAIR_COLORS.black;
  bodyCore.material.color.setHex(outfit); torso.material.color.setHex(outfit); armL.material.color.setHex(outfit); armR.material.color.setHex(outfit); legL.material.color.setHex(mainColor); legR.material.color.setHex(mainColor); ph.material.color.setHex(skin);
  bodyCore.scale.set(1,1,1); torso.scale.set(1,1,1); armL.scale.set(1,1,1); armR.scale.set(1,1,1); legL.scale.set(1,1,1); legR.scale.set(1,1,1);
  const specialModel=SPECIAL_CHARACTER_OUTFITS.has(characterConfig.outfit);
  [bodyCore,ph,defaultVisor,torso,armL,armR,legL,legR].forEach(mesh=>{mesh.visible=!specialModel});
  if(specialModel){player.scale.set(1,1,1)}
  else if(characterConfig.body==="small"){player.scale.set(.88,.88,.88)} else if(characterConfig.body==="tall"){player.scale.set(.98,1.16,.98)} else {player.scale.set(1,1,1); if(characterConfig.body==="strong"){bodyCore.scale.set(1.28,1,1.15);torso.scale.set(1.35,1.05,1.1);armL.scale.set(1.18,1.08,1.18);armR.scale.set(1.18,1.08,1.18)} else if(characterConfig.body==="slim"){bodyCore.scale.set(.82,1,.85);torso.scale.set(.82,.98,.86);armL.scale.set(.84,1,.84);armR.scale.set(.84,1,.84)}}
  clearCharacterExtras();
  if(characterConfig.outfit==="crewmate")buildCrewmateModel();
  if(characterConfig.outfit==="bomberman")buildBombermanModel();
  if(["mario","luigi","yoshi","toad","creeper","sonic","kirby","pacman","steve","pikachu"].includes(characterConfig.outfit))buildClassicCharacterModel(characterConfig.outfit);
  // The added classic characters remain visually faithful; generic customization stays on the game's own avatar.
  if(!specialModel){
  const dark=0x202936, metal=0xb8c4cf;
  if(characterConfig.head==="crown"){const ring=extra(new THREE.TorusGeometry(.62,.09,10,28),0xd4a52c,new THREE.Vector3(0,2.56,0));ring.rotation.x=Math.PI/2;for(let i=-2;i<=2;i++)extra(new THREE.ConeGeometry(.09,.38,8),0xffcf45,new THREE.Vector3(i*.22,2.85,0));extra(new THREE.SphereGeometry(.08,10,8),0xff5b74,new THREE.Vector3(0,2.62,.62))}
  if(characterConfig.head==="headphones"){const arc=extra(new THREE.TorusGeometry(.62,.075,8,28,Math.PI),dark,new THREE.Vector3(0,2.42,0));arc.rotation.x=Math.PI/2;for(const x of [-.67,.67]){const c=extra(new THREE.CylinderGeometry(.16,.16,.12,16),dark,new THREE.Vector3(x,2.08,0));c.rotation.z=Math.PI/2}}
  if(characterConfig.head==="antenna"){extra(new THREE.CylinderGeometry(.035,.035,.55,8),metal,new THREE.Vector3(0,2.67,0));extra(new THREE.SphereGeometry(.11,12,8),0xff536b,new THREE.Vector3(0,2.98,0))}
  if(characterConfig.head==="visor"){extra(new THREE.BoxGeometry(1.0,.28,.14),0x60d9ff,new THREE.Vector3(0,2.2,.48),{transparent:true,opacity:.55,metal:.25})}
  if(characterConfig.head==="cap"){extra(new THREE.SphereGeometry(.63,18,10,0,Math.PI*2,0,Math.PI*.55),0x2d63b6,new THREE.Vector3(0,2.48,0));extra(new THREE.BoxGeometry(.7,.08,.25),0x2d63b6,new THREE.Vector3(0,2.28,.42))}
  if(characterConfig.head==="goggles"){for(const x of [-.2,.2]){const g=extra(new THREE.TorusGeometry(.16,.045,8,20),dark,new THREE.Vector3(x,2.22,.54));g.rotation.y=Math.PI/2}extra(new THREE.BoxGeometry(.12,.05,.08),dark,new THREE.Vector3(0,2.22,.54))}
  if(characterConfig.head==="halo"){const h=extra(new THREE.TorusGeometry(.72,.055,8,32),0xffd84e,new THREE.Vector3(0,2.72,0));h.rotation.x=Math.PI/2}
  if(characterConfig.hair==="short")extra(new THREE.SphereGeometry(.57,18,10,0,Math.PI*2,0,Math.PI*.42),hair,new THREE.Vector3(0,2.42,0));
  if(characterConfig.hair==="curly")for(let i=-1;i<=1;i++)extra(new THREE.SphereGeometry(.22,12,8),hair,new THREE.Vector3(i*.28,2.48,.02));
  if(characterConfig.hair==="mohawk")for(let i=-2;i<=2;i++)extra(new THREE.ConeGeometry(.11,.32,8),hair,new THREE.Vector3(0,2.52+i*.0,i*.14));
  if(characterConfig.hair==="ponytail")extra(new THREE.SphereGeometry(.24,12,8),hair,new THREE.Vector3(0,2.42,-.56));
  if(characterConfig.face==="glasses"){for(const x of [-.2,.2]){const g=extra(new THREE.TorusGeometry(.14,.035,8,16),dark,new THREE.Vector3(x,2.15,.55));g.rotation.y=Math.PI/2}extra(new THREE.BoxGeometry(.16,.035,.04),dark,new THREE.Vector3(0,2.15,.55))}
  if(characterConfig.face==="mask")extra(new THREE.BoxGeometry(.6,.22,.12),0x394657,new THREE.Vector3(0,1.98,.55));
  if(characterConfig.face==="respirator"){extra(new THREE.BoxGeometry(.46,.24,.16),metal,new THREE.Vector3(0,1.98,.56));extra(new THREE.CylinderGeometry(.07,.07,.08,12),dark,new THREE.Vector3(0,1.98,.68)).rotation.x=Math.PI/2}
  if(characterConfig.back==="backpack"){
    // Mochila com compartimento, tampa, bolsos laterais e alças visíveis.
    extra(new THREE.BoxGeometry(.70,.76,.30),0x6a4f36,new THREE.Vector3(0,1.43,-.72));
    extra(new THREE.BoxGeometry(.48,.32,.08),0x9b744b,new THREE.Vector3(0,1.28,-.90));
    extra(new THREE.BoxGeometry(.74,.12,.32),0x48382c,new THREE.Vector3(0,1.83,-.72));
    for(const x of [-.29,.29]){const strap=extra(new THREE.BoxGeometry(.12,.66,.09),0xc6a678,new THREE.Vector3(x,1.50,-.53));strap.rotation.z=x<0?-.12:.12;}
  }
  if(characterConfig.back==="jetpack"){
    extra(new THREE.BoxGeometry(.68,.68,.26),0x526779,new THREE.Vector3(0,1.48,-.72));
    extra(new THREE.BoxGeometry(.42,.28,.08),0x9fbbc9,new THREE.Vector3(0,1.62,-.88));
    for(const x of [-.31,.31]){
      extra(new THREE.CylinderGeometry(.17,.20,.66,18),metal,new THREE.Vector3(x,1.43,-.76));
      extra(new THREE.CylinderGeometry(.125,.15,.10,18),0x374756,new THREE.Vector3(x,1.06,-.76));
      const flame=extra(new THREE.ConeGeometry(.12,.42,12),0xff8a3d,new THREE.Vector3(x,.78,-.76));flame.material.emissive=new THREE.Color(0xff5a22);flame.material.emissiveIntensity=.55;
    }
  }
  if(characterConfig.back==="cape"){
    const cs=new THREE.Shape();cs.moveTo(-.30,.52);cs.quadraticCurveTo(0,.62,.30,.52);cs.lineTo(.66,-.72);cs.quadraticCurveTo(0,-.95,-.66,-.72);cs.closePath();
    const c=extra(new THREE.ShapeGeometry(cs,12),0x9d334e,new THREE.Vector3(0,1.45,-.76),{side:THREE.DoubleSide,rough:.62});
    c.rotation.x=0;
    extra(new THREE.BoxGeometry(.72,.13,.12),0xe1b54b,new THREE.Vector3(0,1.86,-.73));
  }
  if(characterConfig.back==="wings"){
    // Asas com silhueta curvada, ponta de penas e camadas de penas individuais.
    const wingShape=new THREE.Shape();
    wingShape.moveTo(0,0.00);
    wingShape.bezierCurveTo(.20,.18,.26,.76,.64,1.08);
    wingShape.bezierCurveTo(.98,1.30,1.42,1.12,1.58,.83);
    wingShape.bezierCurveTo(1.37,.86,1.30,.72,1.43,.59);
    wingShape.bezierCurveTo(1.18,.66,1.08,.52,1.20,.39);
    wingShape.bezierCurveTo(.95,.49,.84,.32,.95,.19);
    wingShape.bezierCurveTo(.70,.33,.53,.16,.48,-.06);
    wingShape.bezierCurveTo(.31,.14,.15,.05,0,0);wingShape.closePath();
    const wingGeo=new THREE.ExtrudeGeometry(wingShape,{depth:.10,bevelEnabled:true,bevelSegments:3,steps:1,bevelSize:.045,bevelThickness:.035,curveSegments:12});
    for(const side of [-1,1]){
      const wing=extra(wingGeo,0xa8dcff,new THREE.Vector3(side*.34,1.32,-.78),{side:THREE.DoubleSide,rough:.42,metal:.03});
      wing.scale.x=side; wing.rotation.z=side*.035;
      // Five separate feathers per wing make the accessory clearly read as wings.
      for(let i=0;i<5;i++){
        const feather=extra(new THREE.SphereGeometry(1,14,10),i%2===0?0xf0f8ff:0x8fcfff,
          new THREE.Vector3(side*(.58+i*.18),1.48+i*.115,-.89),{side:THREE.DoubleSide,rough:.40});
        feather.scale.set(.14,.33-(i*.012),.065);
        feather.rotation.z=-side*(.28+i*.045);
      }
      // A small golden hinge anchors each wing to the back.
      extra(new THREE.SphereGeometry(.13,14,10),0xd7b35a,new THREE.Vector3(side*.33,1.55,-.74),{metal:.12,rough:.32});
    }
  }
  }
}
window.__APPLY_CHARACTER__=applyCharacterCustomization;

/* ---------- Enemies ---------- */
const colors=[0x4f81ff,0xff5d87,0x43cc9c,0xf0a44d];
function spawnEnemy(name,pos,color,qIdx){
  const g=new THREE.Group();g.position.copy(pos);
  g.userData={id:"e"+Math.random().toString(36).slice(2,8),name,hp:100,alive:true,qIdx,radius:.8,seed:Math.random()*Math.PI*2,roamT:Math.random()*4,attackCooldown:.35};
  add(g,new THREE.CapsuleGeometry(.72,1,6,10),color,new THREE.Vector3(0,1.25,0),{flat:true});
  const h=add(g,new THREE.SphereGeometry(.62,18,12),0xf0c7b1,new THREE.Vector3(0,2.12,0),{rough:.43});h.scale.set(1,.76,1);
  add(g,new THREE.BoxGeometry(.67,.2,.54),0x261a35,new THREE.Vector3(0,2.16,.48),{rough:.3,metal:.1});
  add(g,new THREE.BoxGeometry(.53,.5,.16),0xffd45a,new THREE.Vector3(0,1.23,.61),{rough:.4});
  const ring=new THREE.Mesh(new THREE.TorusGeometry(1,.045,8,24),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.82}));ring.rotation.x=Math.PI/2;ring.position.y=.05;g.add(ring);
  actors.add(g);enemies.push(g);return g;
}
function setupCombat(){
  enemies.forEach(e=>actors.remove(e)); enemies.length=0;
  // Cidade: todos os Geo-Beasts surgem dentro da ilha vermelha, não no centro da cidade.
  const pts=state.mapMode==="classic"?[[-20,5],[20,5],[-7,17],[15,20]]:[[-12,-8],[12,-8],[12,8],[-12,8]].map(([x,z])=>[60+x,-20+z]);
  pts.forEach((p,i)=>spawnEnemy("Geo-Beast "+(i+1),new THREE.Vector3(p[0],state.mapMode==="new"?Math.max(0,floorAt(p[0],p[1])):0,p[1]),colors[i],i));
}
function combatIsland(){return state.mapMode==="new"&&state.mode==="combat"?{x:60,z:-20,r:23.5}:null}
function withinCombatIsland(x,z,margin=0){const a=combatIsland();return !a||Math.hypot(x-a.x,z-a.z)<=a.r-margin}


/* ---------- Inventory / solid display ---------- */
const invIds=["cube","rect_prism","sphere","cylinder","cone","square_pyramid","torus","right_triangle"];
const icons=["⬛","▭","●","◉","△","◇","⭕","△"];
const colorsInv=[0x5b8fff,0x927aff,0x50ddb0,0xffb34c,0xff7093,0xed7398,0x57cce8,0xff965b];
const INV=invIds.map((id,i)=>({...FIGURES.find(f=>f.id===id)||{id,name:id,type:"Espacial"},icon:icons[i],color:colorsInv[i]}));

function centeredGeometry(geo){
  geo.computeBoundingBox();
  const center=geo.boundingBox.getCenter(new THREE.Vector3());
  geo.translate(-center.x,-center.y,-center.z);
  geo.computeBoundingBox();geo.computeBoundingSphere();
  return geo;
}
// Hemisphere closed by a real circular face, so the educational solid has no open underside.
function closedHemisphereGeometry(radius=1.15,radialSegments=32,heightSegments=20){
  const upper=new THREE.SphereGeometry(radius,radialSegments,heightSegments,0,Math.PI*2,0,Math.PI/2).toNonIndexed();
  const cap=new THREE.CircleGeometry(radius,radialSegments).toNonIndexed();cap.rotateX(Math.PI/2);cap.computeVertexNormals();
  const up=upper.attributes.position.array,un=upper.attributes.normal.array,cp=cap.attributes.position.array,cn=cap.attributes.normal.array;
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(Float32Array.from([...up,...cp]),3));
  geo.setAttribute('normal',new THREE.Float32BufferAttribute(Float32Array.from([...un,...cn]),3));
  geo.computeBoundingBox();geo.computeBoundingSphere();upper.dispose();cap.dispose();return geo;
}
function shapeFromPoints(points){
  const sh=new THREE.Shape();sh.moveTo(points[0][0],points[0][1]);
  for(let i=1;i<points.length;i++)sh.lineTo(points[i][0],points[i][1]);
  sh.closePath();return sh;
}
function extrudedPlate(points,depth=.18){
  const sh=shapeFromPoints(points);
  const geo=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.025,bevelThickness:.025,curveSegments:28});
  geo.translate(0,0,-depth/2);geo.rotateX(Math.PI/2);
  return centeredGeometry(geo);
}
function regularPoints(n,r=1.15,start=-Math.PI/2,ry=r){return Array.from({length:n},(_,i)=>[Math.cos(start+i*Math.PI*2/n)*r,Math.sin(start+i*Math.PI*2/n)*ry])}
function roundPlate(kind){
  const sh=new THREE.Shape();
  if(kind==='circle'){sh.absellipse(0,0,1.12,1.12,0,Math.PI*2,false,0)}
  else if(kind==='ellipse'){sh.absellipse(0,0,1.45,.82,0,Math.PI*2,false,0)}
  else if(kind==='annulus'){
    sh.absellipse(0,0,1.3,1.3,0,Math.PI*2,false,0);const hole=new THREE.Path();hole.absellipse(0,0,.60,.60,0,Math.PI*2,true,0);sh.holes.push(hole);
  }else if(kind==='semicircle'){
    sh.moveTo(-1.15,0);sh.absarc(0,0,1.15,Math.PI,0,true);sh.lineTo(-1.15,0);sh.closePath();
  }else if(kind==='sector'){
    sh.moveTo(0,0);sh.lineTo(1.25,0);sh.absarc(0,0,1.25,0,Math.PI*1.35,false);sh.lineTo(0,0);sh.closePath();
  }else if(kind==='segment'){
    sh.moveTo(-1.15,.15);sh.absarc(0,.15,1.15,Math.PI,0,true);sh.lineTo(-1.15,.15);sh.closePath();
  }
  const depth=.18;const geo=new THREE.ExtrudeGeometry(sh,{depth,bevelEnabled:true,bevelSegments:2,bevelSize:.02,bevelThickness:.02,curveSegments:32});
  geo.translate(0,0,-depth/2);geo.rotateX(Math.PI/2);return centeredGeometry(geo);
}
function verticalPrism(points,height=1.9){
  const sh=shapeFromPoints(points);const geo=new THREE.ExtrudeGeometry(sh,{depth:height,bevelEnabled:false,curveSegments:16});
  geo.translate(0,0,-height/2);geo.rotateX(-Math.PI/2);return centeredGeometry(geo);
}
function squareFrustumGeometry(){
  const v=[[-1.22,-.95,-1.22],[1.22,-.95,-1.22],[1.22,-.95,1.22],[-1.22,-.95,1.22],[-.62,.95,-.62],[.62,.95,-.62],[.62,.95,.62],[-.62,.95,.62]];
  const faces=[[0,1,2],[0,2,3],[4,6,5],[4,7,6],[0,4,5],[0,5,1],[1,5,6],[1,6,2],[3,2,6],[3,6,7],[0,3,7],[0,7,4]];
  const arr=[];faces.forEach(f=>f.forEach(i=>arr.push(...v[i])));
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(arr,3));g.computeVertexNormals();return centeredGeometry(g);
}
function solidGeo(id){
  // 2D figures use a thin extruded plate; spatial figures have their own 3D solid.
  const flat={
    square:[[-1.1,-1.1],[1.1,-1.1],[1.1,1.1],[-1.1,1.1]],
    rectangle:[[-1.4,-.82],[1.4,-.82],[1.4,.82],[-1.4,.82]],
    equilateral_triangle:regularPoints(3,1.28,-Math.PI/2),
    isosceles_triangle:[[-1.25,-.9],[1.25,-.9],[0,1.08]],
    right_triangle:[[-1.15,-.9],[-1.15,.9],[1.15,-.9]],
    scalene_triangle:[[-1.25,-.82],[-.30,1.10],[1.22,-.58]],
    parallelogram:[[-1.15,-.82],[1.18,-.82],[.76,.82],[-1.55,.82]],
    rhombus:[[0,1.2],[1.05,0],[0,-1.2],[-1.05,0]],
    right_trapezoid:[[-1.25,-.85],[1.25,-.85],[1.25,.85],[-.35,.85]],
    isosceles_trapezoid:[[-1.32,-.85],[1.32,-.85],[.78,.85],[-.78,.85]],
    scalene_trapezoid:[[-1.32,-.85],[1.32,-.85],[.75,.85],[-.12,.85]],
    regular_pentagon:regularPoints(5,1.18,-Math.PI/2),
    regular_hexagon:regularPoints(6,1.18,-Math.PI/6),
    regular_octagon:regularPoints(8,1.18,-Math.PI/8)
  };
  if(flat[id])return extrudedPlate(flat[id]);
  if(['circle','ellipse','semicircle','annulus','sector','segment'].includes(id))return roundPlate(id);
  switch(id){
    case 'cube':return centeredGeometry(new THREE.BoxGeometry(1.8,1.8,1.8));
    case 'rect_prism':return centeredGeometry(new THREE.BoxGeometry(2.5,1.7,2));
    case 'sphere':return centeredGeometry(new THREE.SphereGeometry(1.08,32,22));
    case 'cylinder':return centeredGeometry(new THREE.CylinderGeometry(.95,.95,1.9,32));
    case 'oblique_cylinder':{const g=new THREE.CylinderGeometry(.88,.88,1.9,28,1);const a=g.attributes.position;for(let i=0;i<a.count;i++)a.setX(i,a.getX(i)+a.getY(i)*.30);a.needsUpdate=true;g.computeVertexNormals();return centeredGeometry(g)}
    case 'cone':return centeredGeometry(new THREE.ConeGeometry(1.08,2.15,32));
    case 'square_pyramid':{const g=new THREE.ConeGeometry(1.25,2.25,4,1);g.rotateY(Math.PI/4);return centeredGeometry(g)}
    case 'triangular_prism':return verticalPrism([[0,1.15],[-1.05,-.78],[1.05,-.78]],1.9);
    case 'hex_prism':return verticalPrism(regularPoints(6,1.12,-Math.PI/6),2.0);
    case 'pentagonal_prism':return verticalPrism(regularPoints(5,1.12,-Math.PI/2),2.0);
    case 'hemisphere':return centeredGeometry(closedHemisphereGeometry(1.15,32,20));
    case 'tetrahedron':return centeredGeometry(new THREE.TetrahedronGeometry(1.35,0));
    case 'octahedron':return centeredGeometry(new THREE.OctahedronGeometry(1.35,0));
    case 'dodecahedron':return centeredGeometry(new THREE.DodecahedronGeometry(1.28,0));
    case 'icosahedron':return centeredGeometry(new THREE.IcosahedronGeometry(1.30,0));
    case 'cone_frustum':return centeredGeometry(new THREE.CylinderGeometry(.55,1.12,2.0,32,1,false));
    case 'pyramid_frustum':return squareFrustumGeometry();
    case 'torus':{const g=new THREE.TorusGeometry(1.0,.30,18,40);g.rotateX(Math.PI/2);return centeredGeometry(g)}
    case 'ellipsoid':{const g=new THREE.SphereGeometry(1,32,22);g.scale(1.45,1.0,.82);return centeredGeometry(g)}
    case 'spherical_cap':return centeredGeometry(new THREE.SphereGeometry(1.2,32,18,0,Math.PI*2,0,Math.PI*.62));
    default:
      // Unknown catalog IDs are rendered as a visibly labelled prism, never silently as a cube.
      return verticalPrism(regularPoints(5,1.12,-Math.PI/2),1.9);
  }
}
[[ -29,-3],[-20,-3],[-11,-3],[-2,-3],[7,-3],[16,-3],[25,-3],[29,10]].forEach((p,i)=>{
  const it=INV[i];add(statics,new THREE.CylinderGeometry(1.55,1.65,.34,28),0x214e8e,new THREE.Vector3(p[0],.28,p[1]));
  const s=add(objectG,solidGeo(it.id),it.color,new THREE.Vector3(p[0],1.45,p[1]),{rough:.49,flat:true});s.userData.figure=it;s.userData.display=true;s.visible=false;
  // Collision definitions are mapped only for the classic world; these displays stay hidden in the new city.
  classicColliderDefs.push({minX:p[0]-1.65,maxX:p[0]+1.65,minZ:p[1]-1.65,maxZ:p[1]+1.65,maxY:3.2});
});
INV.forEach((it,i)=>{const b=document.createElement("button");b.type="button";b.className="slot"+(i===0?" selected":"");b.setAttribute("aria-label",`${i+1}: ${it.name}`);b.title=`Tecla ${i+1} · ${it.name} · ${it.type||"Figura geométrica"}`;b.innerHTML=`<span class="key">${i+1}</span><div class="emo">${it.icon}</div><div class="name">${it.name}</div>`;b.onclick=()=>selectItem(i);$("slots").appendChild(b)});

let preview=new THREE.Mesh(solidGeo(INV[0].id),new THREE.MeshStandardMaterial({color:INV[0].color,transparent:true,opacity:.36,depthWrite:false}));preview.visible=false;world.add(preview);
function selectItem(i){if(!INV[i])return;window.__CUSTOM_BUILD_FIGURE__=null;state.selected=i;[...$("slots").children].forEach((e,n)=>{e.classList.toggle("selected",i===n);e.setAttribute("aria-pressed",String(i===n))});const it=INV[i];preview.geometry.dispose();preview.geometry=solidGeo(it.id);preview.rotation.set(0,0,0);preview.material.color.set(it.color);preview.userData.figure=it;preview.userData.itemId=it.id;const info=$("inventorySelectionInfo");if(info)info.textContent=`${it.icon} ${it.name} · ${it.type||"Figura geométrica"} · tecla ${i+1}`;$("buildFigureName")&&( $("buildFigureName").textContent=it.name.toUpperCase() )}
function clearMyBuilds(){
  const owners=state.myOwnerIds||new Set([state.peerId||"local"]);owners.add(state.peerId||"local");
  const doomed=placedObjects.filter(o=>owners.has(o.userData?.owner) && !o.userData?.display);
  doomed.forEach(o=>{objectG.remove(o);const i=placedObjects.indexOf(o);if(i>=0)placedObjects.splice(i,1);o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m?.dispose?.());else o.material?.dispose?.();if(state.online)sendRoom({type:"remove",id:o.userData.id});state.missionSession.destroyed++});
  if(doomed.length) checkMissions();
  toast(doomed.length?`🗑️ ${doomed.length} construção(ões) removida(s).`:"Nenhuma construção sua para remover.");
  updateHUD();
}
function setBuildUI(active){
  const hud=$("buildHud"); if(hud)hud.classList.toggle("hidden",!active);
  const quick=$("sandboxBuildQuick"); if(quick)quick.classList.toggle("hidden",state.mode!=="sandbox");
  const qb=$("quickBuildBtn"); if(qb)qb.textContent=active?"🔧 CONSTRUÇÃO ATIVA":"🔧 CONSTRUIR";
  const bn=$("buildFigureName");if(bn){const custom=window.__CUSTOM_BUILD_FIGURE__;bn.textContent=(custom?.name||INV[state.selected]?.name||"CUBO").toUpperCase()}updateBuildPhysicsUI();
}
function surfaceHeightAt(x,z){
  let floor=floorAt(x,z);
  if(state.mapMode==='new'&&floor<-2.5)return -10;
  // A large block/roof can support another object if the target point is over its top.
  for(const c of colliders){if(x>=c.minX&&x<=c.maxX&&z>=c.minZ&&z<=c.maxZ&&c.maxY>=floor-.08)floor=Math.max(floor,c.maxY);}
  for(const obj of objectG.children){if(!obj.visible||obj===preview||obj.userData?.display===false)continue;const b=meshWorldBox(obj);if(b&&x>=b.min.x&&x<=b.max.x&&z>=b.min.z&&z<=b.max.z&&b.max.y>=floor-.08)floor=Math.max(floor,b.max.y);}
  return floor;
}
function placementPoint(geometry=preview.geometry){
  const dir=camera.getWorldDirection(new THREE.Vector3());dir.y=0;if(dir.lengthSq()<.001)dir.set(Math.sin(state.yaw),0,Math.cos(state.yaw));dir.normalize();
  const bbox=geometry.boundingBox||geometry.computeBoundingBox()||geometry.boundingBox;
  const height=Math.max(.12,bbox?.max.y-(bbox?.min.y||0));
  const distances=[4.0,3.2,5.1,2.5,1.8];
  for(const dist of distances){
    const x=player.position.x+dir.x*dist,z=player.position.z+dir.z*dist;
    const floor=surfaceHeightAt(x,z);if(floor<-2.5)continue;
    return new THREE.Vector3(x,floor+height/2+.06,z);
  }
  const x=player.position.x+dir.x*1.8,z=player.position.z+dir.z*1.8,floor=Math.max(0,floorAt(player.position.x,player.position.z));
  return new THREE.Vector3(x,floor+height/2+.06,z);
}
function placementBoxFree(mesh){
  mesh.updateWorldMatrix(true,false);const box=new THREE.Box3().setFromObject(mesh);
  // Never place inside the player.
  const pb=new THREE.Box3(new THREE.Vector3(player.position.x-.55,player.position.y+.05,player.position.z-.55),new THREE.Vector3(player.position.x+.55,player.position.y+2.15,player.position.z+.55));
  if(box.intersectsBox(pb))return false;
  for(const c of colliders){
    const vertical=box.min.y<c.maxY-.015&&box.max.y>(c.minY??0)+.02;
    if(vertical&&aabbOverlapsColliderXZ(c,box))return false;
  }
  for(const obj of objectG.children){if(!obj.visible||obj===mesh||obj===preview||!obj.isMesh)continue;const other=meshWorldBox(obj);if(other&&box.intersectsBox(other))return false;}
  return true;
}
function updateBuiltObjectPhysics(dt){
  // Fast path: most objects are settled for nearly the entire session.
  if(!placedObjects.some(obj=>obj.visible&&!obj.userData?.display&&obj.userData?.physics))return;
  // Only moving/falling objects need per-frame simulation. Resting constructions remain
  // solid with cached bounds, reducing the previous O(all builds squared) frame cost.
  const dynamic=[];
  const records=[];
  for(const obj of placedObjects){
    if(!obj.visible||obj.userData?.display)continue;
    const box=meshWorldBox(obj);
    if(!box)continue;
    const record={obj,box};records.push(record);
    if(obj.userData?.physics)dynamic.push(record);
  }
  if(!dynamic.length)return;
  for(const record of dynamic){
    const o=record.obj,box=record.box;
    if(o===state.grabbedObject)continue;
    const vel=o.userData.velocity||(o.userData.velocity=new THREE.Vector3());
    // Simple rigid-body style motion: momentum, air drag and world collision, without replacing Three.js.
    if(Math.abs(vel.x)+Math.abs(vel.z)>.015){
      const oldX=o.position.x,oldZ=o.position.z;
      o.position.x+=vel.x*dt;o.position.z+=vel.z*dt;
      o.userData.staticWorldBox=null;
      const moved=meshWorldBox(o);
      let blocked=false;
      for(const c of colliders){if(c.enabled===false)continue;const vertical=moved.min.y<c.maxY-.02&&moved.max.y>(c.minY??0)+.02;if(vertical&&aabbOverlapsColliderXZ(c,moved)){blocked=true;break;}}
      if(blocked){o.position.x=oldX;o.position.z=oldZ;vel.x*=-.28;vel.z*=-.28;}
      vel.x*=Math.pow(.985,dt*60);vel.z*=Math.pow(.985,dt*60);
      record.box=meshWorldBox(o);
    }
    let support=state.mapMode==='new'?floorAt(o.position.x,o.position.z):0;
    for(const c of colliders){
      if(box.min.y>=c.maxY-.12 && o.position.x+.04>=c.minX&&o.position.x-.04<=c.maxX&&o.position.z+.04>=c.minZ&&o.position.z-.04<=c.maxZ && circleOverlapsCollider(c,o.position.x,o.position.z,.025)) support=Math.max(support,c.maxY);
    }
    for(const other of records){
      if(other.obj===o)continue;
      const ob=other.box;
      if(box.min.y<ob.max.y-.12)continue;
      if(box.max.x>ob.min.x&&box.min.x<ob.max.x&&box.max.z>ob.min.z&&box.min.z<ob.max.z) support=Math.max(support,ob.max.y);
    }
    const halfY=(box.max.y-box.min.y)/2,target=support+halfY+.035;
    if(support<-2.5){
      o.userData.velocity.y-=18*dt;o.position.y+=o.userData.velocity.y*dt;
      if(o.position.y<-18){const id=o.userData.id;removeById(id);if(state.online)sendRoom({type:"remove",id});toast('Uma construção caiu fora da ilha.');}
      continue;
    }
    if(o.position.y>target+.035){
      o.userData.velocity.y-=18*dt;o.position.y+=o.userData.velocity.y*dt;
      if(o.position.y-halfY<=support){o.position.y=target;o.userData.velocity.y=0;o.userData.physics=false;o.userData.staticWorldBox=null;record.box=meshWorldBox(o);}
    }else{
      o.position.y=target;o.userData.velocity.y=0;o.userData.physics=false;o.userData.staticWorldBox=null;record.box=meshWorldBox(o);
    }
  }
}
function toggleBuild(){
  if(state.mode==="combat"){toast("Construção é usada no Sandbox e Aprendizado.");return}
  state.build=!state.build;
  setBuildUI(state.build);
  preview.visible=state.build;
  if(!state.build) window.__CUSTOM_BUILD_FIGURE__=window.__CUSTOM_BUILD_FIGURE__||null;
  toast(state.build?"🔧 MODO CONSTRUÇÃO ATIVO — escolha uma figura e coloque no mapa":"Construção desligada.");
}
function placeObject(){
  if(!state.build)return;
  const liveBuilds=placedObjects.filter(o=>!o.userData?.display).length;
  const owners=state.myOwnerIds||new Set([state.peerId||"local"]);owners.add(state.peerId||"local");
  const ownBuilds=placedObjects.filter(o=>owners.has(o.userData?.owner)&&!o.userData?.display).length;
  if(ownBuilds>=120){toast("Você atingiu o limite de 120 construções. Remova algumas para continuar.");return;}
  if(liveBuilds>=240){toast("O mapa atingiu 240 construções para manter a partida fluida. Limpe algumas peças para continuar.");return;}
  const custom=window.__CUSTOM_BUILD_FIGURE__;
  const it=custom||INV[state.selected];if(!it)return;
  const geometry=solidGeo(it.id);geometry.computeBoundingBox();
  const o=new THREE.Mesh(geometry,mat(it.color||0x7d86ff,.48,.05,false));
  const p=placementPoint(geometry);o.position.copy(p);o.rotation.copy(preview.rotation);o.castShadow=true;o.receiveShadow=true;o.updateWorldMatrix(true,false);
  const supportY=surfaceHeightAt(p.x,p.z),initialBox=new THREE.Box3().setFromObject(o);if(supportY>-2.5&&Number.isFinite(initialBox.min.y))o.position.y+=supportY+.04-initialBox.min.y;
  o.userData={figure:it,id:(state.peerId||'local')+'-o'+(++state.objectId),owner:state.peerId||'local',itemId:it.id,velocity:new THREE.Vector3(),physics:state.buildPhysicsEnabled,frozen:!state.buildPhysicsEnabled};
  if(!placementBoxFree(o)){geometry.dispose();o.material.dispose();state.objectId--;toast('Esse local está ocupado. Afaste-se ou escolha outro ponto.');return;}
  objectG.add(o);placedObjects.push(o);
  if(state.relayActive||state.networkConnecting)state.pendingPlacementSince.set(o.userData.id,Date.now());
  if(o.userData.owner===(state.peerId||'local')){state.missionSession.placed++;state.builtFigures.add(it.id);state.missionSession.unique=state.builtFigures.size;awardXP(10,"Construção colocada");checkMissions();}
  if(state.online)sendRoom({type:'place',id:o.userData.id,item:it.id,pos:[o.position.x,o.position.y,o.position.z],rot:[o.rotation.x,o.rotation.y,o.rotation.z],owner:o.userData.owner,physics:!!o.userData.physics});
  updateHUD();
}
function grabOrDropObject(){
  if(state.paused||state.build)return;
  if(state.grabbedObject){dropGrabbedObject(false);return;}
  const rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2(0,0),camera);
  const candidates=placedObjects.filter(o=>o.visible&&!o.userData?.display&&!o.userData?.remote);
  const hit=rc.intersectObjects(candidates,false)[0];
  if(!hit){toast("Mire para uma construção sua e pressione G para segurá-la.");return;}
  const o=hit.object;if(hit.distance>13){toast("Chegue mais perto para pegar esse objeto.");return;}
  state.grabbedObject=o;o.userData.frozen=false;state.grabDistance=Math.max(2.5,Math.min(10,hit.distance));
  o.userData.physics=false;o.userData.staticWorldBox=null;
  toast("🧲 Objeto segurado! Role a roda do mouse para aproximar/afastar; clique para arremessar; G para soltar.");
}
function dropGrabbedObject(throwIt=false){
  const o=state.grabbedObject;if(!o)return;
  state.grabbedObject=null;o.userData.physics=state.buildPhysicsEnabled;o.userData.frozen=!state.buildPhysicsEnabled;o.userData.staticWorldBox=null;
  if(!o.userData.velocity)o.userData.velocity=new THREE.Vector3();else o.userData.velocity.set(0,0,0);
  if(throwIt){const dir=new THREE.Vector3();camera.getWorldDirection(dir);o.userData.velocity.copy(dir.multiplyScalar(10));o.userData.velocity.y+=2.8;toast("💥 Objeto arremessado!");}
  else toast("Objeto solto; a gravidade e as colisões continuam ativas.");
  if(state.online)sendRoom({type:"place",id:o.userData.id,item:o.userData.itemId||o.userData.figure?.id,pos:[o.position.x,o.position.y,o.position.z],rot:[o.rotation.x,o.rotation.y,o.rotation.z],owner:o.userData.owner,physics:!!o.userData.physics});
}
function updateGrabbedObject(){
  const o=state.grabbedObject;if(!o||state.paused)return;
  const dir=new THREE.Vector3();camera.getWorldDirection(dir);
  const origin=camera.position.clone();
  const target=origin.addScaledVector(dir,state.grabDistance);
  o.position.copy(target);o.userData.staticWorldBox=null;o.updateWorldMatrix(true,false);
}
window.addEventListener("wheel",e=>{if(!state.grabbedObject||state.paused)return;e.preventDefault();state.grabDistance=Math.max(2,Math.min(12,state.grabDistance+Math.sign(e.deltaY)*.6));},{passive:false});

function removeObject(){
  if(!state.build)return;
  const rc=new THREE.Raycaster();rc.setFromCamera(new THREE.Vector2(0,0),camera);
  const h=rc.intersectObjects(placedObjects.filter(o=>!o.userData?.display),false)[0];
  if(!h){toast("Aponte para uma construção para apagar.");return;}
  const o=h.object;if(o.userData?.display){toast("Esse sólido de demonstração não pode ser removido.");return;}const i=placedObjects.indexOf(o);if(i>=0)placedObjects.splice(i,1);objectG.remove(o);o.geometry?.dispose?.();o.material?.dispose?.();
  if((state.myOwnerIds||new Set([state.peerId||"local"])).has(o.userData?.owner)){state.missionSession.destroyed++;awardXP(5,"Construção removida");checkMissions();}
  if(state.online)sendRoom({type:"remove",id:o.userData.id});updateHUD();
}
function updatePreview(){
  if(!state.build){preview.visible=false;return}
  preview.visible=true;preview.position.copy(placementPoint(preview.geometry));preview.updateWorldMatrix(true,false);
  const box=new THREE.Box3().setFromObject(preview),floor=surfaceHeightAt(preview.position.x,preview.position.z);
  if(floor>-2.5&&Number.isFinite(box.min.y))preview.position.y+=floor+.06-box.min.y;
}

function onParkourPlatformAt(x,z,kind=null){
  return parkourCourse.find(p=>p.root.visible&&(!kind||p.kind===kind)&&Math.abs(x-p.x)<=p.w*.46&&Math.abs(z-p.z)<=p.d*.46)||null;
}
function respawnParkourCheckpoint(){
  const p=parkourState.checkpointPos||parkourStartPosition||new THREE.Vector3(0,.36,62);
  player.position.copy(p);state.vy=0;state.grounded=true;state.yaw=0;state.pitch=.18;
  if(state.moveVelocity)state.moveVelocity.set(0,0,0);
  player.rotation.y=0;
  parkourState.iceUntil=0;
  toast('↩ Você caiu! Voltou ao último checkpoint do parkour.');
  if(state.online)sendPosition();
}
function startParkourRun(){
  if(!state.running||state.mapMode!=='new'){toast('Escolha a Cidade da Geometria para acessar o parkour.');return;}
  if(!parkourStartPosition||!parkourCourse.length){toast('O percurso de parkour não foi carregado.');return;}
  closeModals();state.paused=false;state.build=false;setBuildUI(false);preview.visible=false;
  player.position.copy(parkourStartPosition);state.vy=0;state.grounded=true;state.yaw=0;state.pitch=.18;
  if(state.moveVelocity)state.moveVelocity.set(0,0,0);
  parkourState.active=true;parkourState.completed=false;parkourState.next=0;parkourState.startedAt=performance.now();parkourState.checkpointPos=parkourStartPosition.clone();parkourState.checkpointNext=0;parkourState.iceUntil=0;
  parkourCourse.forEach(p=>{p.done=false;p.root.visible=true;p.region.enabled=true;p.colliderDef.enabled=true;p.hiddenUntil=0;p.collapseTimer=0;p.bounceUsed=false;});
  toast('🏁 Parkour iniciado! Aprenda os saltos, use os checkpoints e chegue ao arco dourado.');
  if(state.online)sendPosition();
  lockMouse();
}
function startFormHunt(){
  if(!state.running||state.mapMode!=='new'){toast('Escolha a Cidade da Geometria para caçar as formas.');return;}
  closeModals();state.paused=false;state.build=false;setBuildUI(false);preview.visible=false;
  player.position.set(0,Math.max(.36,floorAt(0,-49.2)),-49.2);state.yaw=Math.PI;state.pitch=.18;state.vy=0;state.grounded=true;
  if(state.moveVelocity)state.moveVelocity.set(0,0,0);
  toast('🔷 Caça às Formas iniciada! Encontre os 10 sólidos dentro do Labirinto Geométrico.');
  if(state.online)sendPosition();lockMouse();
}
function finishParkour(){
  if(!parkourState.active||parkourState.completed)return;
  parkourState.completed=true;parkourState.active=false;
  const seconds=(performance.now()-parkourState.startedAt)/1000;
  parkourState.best=Math.min(parkourState.best,seconds);
  safeStorageWrite('gl_parkour_best_v56',String(parkourState.best));
  state.missionSession.parkour++;checkMissions();
  const today=new Date(),day=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0'),rewardKey='gl_parkour_reward_day_v56';
  if(safeStorageRead(rewardKey)!==day){awardXP(10,'Parkour concluído');safeStorageWrite(rewardKey,day);toast('🏆 Percurso concluído em '+seconds.toFixed(1)+' s! +10 XP. Voltando ao lobby...');}
  else toast('🏆 Percurso concluído em '+seconds.toFixed(1)+' s! Recompensa diária já recebida. Voltando ao lobby...');
  if($('parkourStatus'))$('parkourStatus').textContent='🏆 Concluído em '+seconds.toFixed(1)+' s · recorde '+parkourState.best.toFixed(1)+' s';
  parkourFinishCooldown=performance.now()+1800;
  setTimeout(()=>{
    if(!state.running)return;
    // Lobby central, fora do cristal e das fachadas.
    player.position.set(0,Math.max(.36,floorAt(0,12)),12);state.vy=0;state.grounded=true;state.yaw=Math.PI;state.pitch=.18;
    if(state.moveVelocity)state.moveVelocity.set(0,0,0);parkourState.next=0;parkourState.checkpointNext=0;parkourState.checkpointPos=null;parkourCourse.forEach(p=>{p.root.visible=true;p.region.enabled=true;p.colliderDef.enabled=true;p.done=false;p.hiddenUntil=0;p.collapseTimer=0;p.bounceUsed=false;});
    toast('🏙️ Você voltou ao lobby central.');if(state.online)sendPosition();
  },1400);
}

/* ---------- Player physics ---------- */
function floorAt(x,z,referenceY){
  if(state.mapMode!=="new")return 0;
  let highest=-3.2;
  const insideParkourPit=parkourVoidRects.some(v=>Math.abs(x-v.x)<=v.w/2&&Math.abs(z-v.z)<=v.d/2);
  const floorCell=glFloorGrid.get(glCellKey(Math.floor(x/GL_SPATIAL_CELL_SIZE),Math.floor(z/GL_SPATIAL_CELL_SIZE)));
  const floorCandidates=glFloorGridReady?(floorCell||[]):newFloorRegions;
  for(const reg of floorCandidates){
    if(reg.enabled===false)continue;
    if(insideParkourPit&&reg.islandFloor)continue;
    let hit=false;
    if(reg.type==='circle')hit=Math.hypot(x-reg.x,z-reg.z)<=reg.r;
    else if(reg.type==='rect'){
      // Inverso correto da rotação Y do Three.js para consultar o retângulo no plano X/Z.
      const dx=x-reg.x,dz=z-reg.z,c=Math.cos(reg.rot||0),s=Math.sin(reg.rot||0),rx=dx*c-dz*s,rz=dx*s+dz*c;
      hit=Math.abs(rx)<=reg.w/2&&Math.abs(rz)<=reg.d/2;
    }else if(reg.type==='platform'){
      // Uma plataforma elevada só vira piso depois que o jogador salta até sua altura.
      hit=Math.abs(x-reg.x)<=reg.w/2&&Math.abs(z-reg.z)<=reg.d/2&&(referenceY===undefined||referenceY>=reg.y-.28);
    }
    if(hit)highest=Math.max(highest,reg.y);
  }
  return highest;
}
function meshWorldBox(obj){
  if(!obj||!obj.isMesh||!obj.geometry)return null;
  // V59 performance: settled build meshes do not move again, so reuse their world AABB
  // during player collision and surface queries instead of rebuilding a Box3 every frame.
  if(obj.userData?.staticWorldBox && !obj.userData.physics) return obj.userData.staticWorldBox;
  obj.updateWorldMatrix(true,false);
  const box=new THREE.Box3().setFromObject(obj);
  if(obj.userData && !obj.userData.physics) obj.userData.staticWorldBox=box;
  return box;
}
function objectIntersectsPlayer(pos,r,obj){
  if(!obj||obj===preview||obj.visible===false||!obj.isMesh||!obj.geometry)return false;
  const b=meshWorldBox(obj);if(!b)return false;
  const overlapsXZ=pos.x+r>b.min.x&&pos.x-r<b.max.x&&pos.z+r>b.min.z&&pos.z-r<b.max.z;
  const overlapsY=pos.y+2.25>b.min.y+.015&&pos.y<b.max.y-.015;
  return overlapsXZ&&overlapsY;
}
function playerCollision(pos,r){
  if(Math.hypot(pos.x,pos.z)>(state.mapBoundaryRadius||33))return true;
  const playerBottom=pos.y+.02,playerTop=pos.y+2.22;
  if(glAnyNearbyCollider(pos.x,pos.z,r,c=>c.enabled!==false&&c.source?.enabled!==false&&playerTop>(c.minY??0)+.01&&playerBottom<c.maxY+.02&&circleOverlapsCollider(c,pos.x,pos.z,r)))return true;
  for(const e of enemies)if(e.userData.alive&&Math.hypot(pos.x-e.position.x,pos.z-e.position.z)<r+.72)return true;
  for(const p of state.remotePlayers.values())if(Math.hypot(pos.x-p.group.position.x,pos.z-p.group.position.z)<r+.68)return true;
  for(const obj of objectG.children)if(objectIntersectsPlayer(pos,r,obj))return true;
  return false;
}
function enemyCollision(pos,r,self){
  if(Math.hypot(pos.x,pos.z)>(state.mapBoundaryRadius||33)-r)return true;
  if(!withinCombatIsland(pos.x,pos.z,r+1.0))return true;
  if(glAnyNearbyCollider(pos.x,pos.z,r,c=>c.enabled!==false&&c.source?.enabled!==false&&pos.y+1.8>(c.minY??0)&&pos.y<c.maxY+.02&&circleOverlapsCollider(c,pos.x,pos.z,r)))return true;
  for(const e of enemies)if(e!==self&&e.userData.alive&&Math.hypot(pos.x-e.position.x,pos.z-e.position.z)<r+.7)return true;
  for(const obj of objectG.children)if(objectIntersectsPlayer(pos,r,obj))return true;
  return false;
}
function spawnSpotClear(pos){
  if(state.mapMode==="new"&&floorAt(pos.x,pos.z)<-2.5)return false;
  if(playerCollision(pos,.72))return false;
  // Considere construções do jogador e sólidos de demonstração já presentes no cenário.
  for(const obj of objectG.children){
    if(!obj.isMesh||obj===preview||obj.visible===false||!obj.geometry)continue;
    const geom=obj.geometry;
    if(!geom.boundingSphere)geom.computeBoundingSphere();
    const scale=Math.max(Math.abs(obj.scale.x),Math.abs(obj.scale.y),Math.abs(obj.scale.z));
    const radius=(geom.boundingSphere?.radius||.8)*scale;
    const verticalOverlap=pos.y<obj.position.y+radius+.8&&pos.y+2.3>obj.position.y-radius;
    if(verticalOverlap&&Math.hypot(pos.x-obj.position.x,pos.z-obj.position.z)<radius+.72)return false;
  }
  return true;
}
function safeSpawnPosition(mode=state.mapMode){
  const candidates=mode==="classic"
    ?[[0,25],[0,21],[-6,24],[6,24],[0,15],[-12,18],[12,18]]
    :state.mode==="combat"
      ?[[60,-34],[72,-20],[48,-20],[60,-7],[53,-31],[67,-31],[53,-9],[67,-9],[75,-28],[45,-12],[60,-39]]
      :[[0,20],[0,23],[-5,20],[5,20],[0,26],[-7,23],[7,23],[-15,0],[15,0],[0,-20]];
  for(const [x,z] of candidates){const y=mode==="new"?Math.max(0,floorAt(x,z)):0;const p=new THREE.Vector3(x,y,z);if(spawnSpotClear(p))return p;}
  // Fallback em anéis ao redor da região correta; combate nunca retorna ao centro da cidade.
  const combatAnchor=mode==="new"&&state.mode==="combat"?{x:60,z:-20}:null;
  const maxR=combatAnchor?19.5:28;
  for(let r=8;r<=maxR;r+=2.0)for(let i=0;i<40;i++){
    const a=i*Math.PI*2/40,x=(combatAnchor?.x||0)+Math.cos(a)*r,z=(combatAnchor?.z||0)+Math.sin(a)*r,y=mode==="new"?Math.max(0,floorAt(x,z)):0,p=new THREE.Vector3(x,y,z);
    if((!combatAnchor||withinCombatIsland(x,z,2))&&spawnSpotClear(p))return p;
  }
  const fx=combatAnchor?.x||0,fallbackZ=combatAnchor?.z??(mode==="classic"?25:20);return new THREE.Vector3(fx,mode==="new"?Math.max(0,floorAt(fx,fallbackZ)):0,fallbackZ);
}
function movePlayerToSafeSpawn(mode=state.mapMode){
  const p=safeSpawnPosition(mode);
  player.position.copy(p);state.vy=0;state.grounded=true;state.yaw=Math.PI;
  if(state.moveVelocity)state.moveVelocity.set(0,0,0);
  return p;
}
function movePlayer(dt){
  state.moveVelocity ||= new THREE.Vector3();
  if(state.paused){state.moveVelocity.set(0,0,0);return;}
  const inputX=(state.keys.KeyD?1:0)-(state.keys.KeyA?1:0); // A esquerda, D direita
  const inputZ=(state.keys.KeyW?1:0)-(state.keys.KeyS?1:0);
  const hasInput=inputX!==0||inputZ!==0;
  let desired=new THREE.Vector3();
  if(hasInput){
    const forward=new THREE.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw));
    const right=new THREE.Vector3(Math.cos(state.yaw),0,-Math.sin(state.yaw));
    desired.copy(forward).multiplyScalar(inputZ).addScaledVector(right,inputX).normalize();
    desired.multiplyScalar((state.keys.ShiftLeft||state.keys.ShiftRight)?10.5:6.4);
  }
  // Acceleration/braking smoothing makes starts/stops less abrupt while remaining responsive.
  const iceSurface=state.mapMode==='new'&&(!!onParkourPlatformAt(player.position.x,player.position.z,'ice')||performance.now()<(parkourState.iceUntil||0));
  if(iceSurface&&hasInput)desired.multiplyScalar(1.12);
  const response=hasInput?(iceSurface?6.5:18):(iceSurface?2.5:13);
  state.moveVelocity.lerp(desired,1-Math.exp(-response*dt));
  if(!hasInput&&state.moveVelocity.length()<.055)state.moveVelocity.set(0,0,0);

  const oldX=player.position.x,oldZ=player.position.z;
  const dx=state.moveVelocity.x*dt,dz=state.moveVelocity.z*dt;
  const walkable=(x,z)=>state.mapMode!=='new'||floorAt(x,z)>-2.5||(parkourState.active&&player.position.y>.65);
  const candidate=new THREE.Vector3();
  const canOccupy=(x,z)=>{if(!walkable(x,z))return false;candidate.set(x,player.position.y,z);return !playerCollision(candidate,.49)};
  // Integra X/Z juntos ao caminhar em diagonais (principalmente nas pontes inclinadas).
  // Só tenta deslizar por eixo se o passo combinado realmente encontrar uma parede.
  const maxStep=.14,steps=Math.max(1,Math.ceil(Math.max(Math.abs(dx),Math.abs(dz))/maxStep)),sx=dx/steps,sz=dz/steps;
  for(let i=0;i<steps;i++){
    const nx=player.position.x+sx,nz=player.position.z+sz;
    if(canOccupy(nx,nz)){player.position.x=nx;player.position.z=nz;continue;}
    let movedX=Math.abs(sx)<1e-7,movedZ=Math.abs(sz)<1e-7;
    const axes=Math.abs(sx)>=Math.abs(sz)?['x','z']:['z','x'];
    for(const axis of axes){
      if(axis==='x'&&Math.abs(sx)>=1e-7){const x=player.position.x+sx;if(canOccupy(x,player.position.z)){player.position.x=x;movedX=true;}}
      else if(axis==='z'&&Math.abs(sz)>=1e-7){const z=player.position.z+sz;if(canOccupy(player.position.x,z)){player.position.z=z;movedZ=true;}}
    }
    // Remova apenas a componente bloqueada; a componente tangencial continua deslizando.
    if(!movedX)state.moveVelocity.x=0;
    if(!movedZ)state.moveVelocity.z=0;
  }

  const travelled=Math.hypot(player.position.x-oldX,player.position.z-oldZ);
  if(travelled>.0001){
    state.walk+=dt*Math.max(2,state.moveVelocity.length());
    state.exploreXPTime=(state.exploreXPTime||0)+dt;
    state.exploreXPDistance=(state.exploreXPDistance||0)+travelled;
    // Reward active exploration so progress also advances during normal traversal.
    if(!parkourState.active&&state.exploreXPTime>=30&&state.exploreXPDistance>=14){awardXP(10,"Exploração ativa");state.exploreXPTime=0;state.exploreXPDistance=0;}
  }else{
    // Idle time does not count toward exploration rewards.
  }
  if(hasInput&&state.moveVelocity.length()>.12){
    const dir=desired.clone().normalize();player.rotation.y=Math.atan2(dir.x,dir.z);
  }
  if(state.keys.Space&&state.grounded){state.vy=8.3;state.grounded=false;state.keys.Space=false}
  const previousPlayerY=player.position.y;
  state.vy-=20*dt;player.position.y+=state.vy*dt;
  if(state.vy>0&&player.position.y>previousPlayerY){
    const oldHead=previousPlayerY+2.22,newHead=player.position.y+2.22;
    for(const c of colliders){
      if(c.enabled===false||c.source?.enabled===false)continue;
      const overlapsXZ=player.position.x+.49>c.minX&&player.position.x-.49<c.maxX&&player.position.z+.49>c.minZ&&player.position.z-.49<c.maxZ;
      if(overlapsXZ&&oldHead<=(c.minY??0)&&newHead>=(c.minY??0)&&player.position.y<(c.maxY??Infinity)){
        player.position.y=(c.minY??0)-2.22;state.vy=0;break;
      }
    }
  }
  const floor=floorAt(player.position.x,player.position.z,player.position.y);
  if(player.position.y<=floor){player.position.y=floor;state.vy=0;state.grounded=true;}
  else state.grounded=false;
  // No parkour, o piso ausente significa um vão: permita cair até abaixo da ilha antes do resgate.
  if(state.mapMode==="new"&&floor<-2.5&&player.position.y<-2.5){
    if(parkourState.active)respawnParkourCheckpoint();
    else{state.hp=Math.max(state.hp,50);movePlayerToSafeSpawn(state.mapMode);toast("🛟 Retorno à área segura.");}
  }
  for(const h of hazards)if(Math.abs(player.position.x-h.mesh.position.x)<h.w*.42&&Math.abs(player.position.z-h.mesh.position.z)<h.d*.42)state.hp-=12*dt;
  if(state.hp<=0){state.hp=100;movePlayerToSafeSpawn(state.mapMode);toast("Respawn em área segura.");}
}

function updateMazePressurePlate(dt){
  if(!mazePressurePlate||!mazeReturnTarget)return;
  state.mazePlateCooldown=Math.max(0,(state.mazePlateCooldown||0)-dt);
  const now=performance.now();
  const pressed=now<mazePressurePlate.pressedUntil;
  mazePressurePlate.top.position.y=mazePressurePlate.restTopY-(pressed?.075:0);
  mazePressurePlate.inset.position.y=mazePressurePlate.restInsetY-(pressed?.075:0);
  mazePressurePlate.top.material.emissiveIntensity=pressed?.75:.30;
  if(state.paused||!state.running||state.mapMode!=="new"||!state.grounded||state.mazePlateCooldown>0)return;
  const distance=Math.hypot(player.position.x-mazePressurePlate.x,player.position.z-mazePressurePlate.z);
  if(distance>1.05)return;
  // The player stands on the plate: press down, then teleport to the open central chamber.
  mazePressurePlate.pressedUntil=now+420;
  state.mazePlateCooldown=2.2;
  const floor=Math.max(0,floorAt(mazeReturnTarget.x,mazeReturnTarget.z));
  player.position.set(mazeReturnTarget.x,floor,mazeReturnTarget.z);
  state.yaw=0;state.pitch=.20;state.vy=0;state.grounded=true;
  if(state.moveVelocity)state.moveVelocity.set(0,0,0);
  player.rotation.y=0;
  if(state.online)sendPosition();
  toast("🟠 Placa de retorno ativada! Você voltou ao centro. A saída fica no lado oposto à entrada, seguindo o caminho ciano.");
}

/* ---------- Enemy AI ---------- */
function moveEnemies(dt){
  if(state.mode!=="combat"||state.paused||state.quiz)return;
  for(const e of enemies)if(e.userData.alive){
    const dx=player.position.x-e.position.x,dz=player.position.z-e.position.z,d=Math.hypot(dx,dz);
    e.userData.roamT=(e.userData.roamT||0)+dt;
    if(!e.userData.home)e.userData.home=e.position.clone();
    // Na Cidade, o alvo só é perseguido se o jogador estiver na ilha vermelha.
    // Fora dela, cada Geo-Beast patrulha perto do seu ponto de origem.
    const arena=combatIsland();
    const playerInArena=!arena||Math.hypot(player.position.x-arena.x,player.position.z-arena.z)<arena.r-1.5;
    const chasing=playerInArena&&d<=30;
    let tx=player.position.x,tz=player.position.z;
    if(!chasing){
      const a=e.userData.roamT*.7+(e.userData.seed||0);
      tx=e.userData.home.x+Math.cos(a)*4.5;
      tz=e.userData.home.z+Math.sin(a*1.13)*4.5;
    }
    if(arena){const dd=Math.hypot(tx-arena.x,tz-arena.z);if(dd>arena.r-4){const k=(arena.r-4)/dd;tx=arena.x+(tx-arena.x)*k;tz=arena.z+(tz-arena.z)*k;}}
    const vx=tx-e.position.x,vz=tz-e.position.z,vd=Math.hypot(vx,vz);
    if(vd>.25){
      const dir=new THREE.Vector3(vx/vd,0,vz/vd);
      const speed=chasing?2.65:1.85;
      let n=e.position.clone().addScaledVector(dir,speed*dt);
      const walkable=state.mapMode!=='new'||floorAt(n.x,n.z)>-2.5;
      if(walkable&&!enemyCollision(n,.76,e))e.position.copy(n);
      else{
        // Small steering correction around scenery/railings.
        const side=new THREE.Vector3(-dir.z,0,dir.x);
        for(const sign of [-1,1]){
          const alt=e.position.clone().addScaledVector(side,sign*speed*.75*dt);
          const ok=state.mapMode!=='new'||floorAt(alt.x,alt.z)>-2.5;
          if(ok&&!enemyCollision(alt,.76,e)){e.position.copy(alt);break;}
        }
      }
      e.rotation.y=Math.atan2(dir.x,dir.z);
    }
    e.position.y=(floorAt(e.position.x,e.position.z)>-2.5?floorAt(e.position.x,e.position.z):0)+Math.sin(state.walk*2+e.userData.seed)*.03;
    // Ataque com intervalo explícito: não depende de perder vários quadros e atualiza a barra de vida.
    e.userData.attackCooldown=Math.max(0,(e.userData.attackCooldown||0)-dt);
    const contactDistance=Math.hypot(player.position.x-e.position.x,player.position.z-e.position.z);
    if(contactDistance<=2.55&&e.userData.attackCooldown<=0){
      e.userData.attackCooldown=1.05;
      damagePlayer(9,e.userData.name||"Geo-Beast");
    }
    if(contactDistance<1.5&&contactDistance>0){const push=(1.5-contactDistance)*.55;const ddx=player.position.x-e.position.x,ddz=player.position.z-e.position.z;const n=player.position.clone();n.x+=(ddx/contactDistance)*push;n.z+=(ddz/contactDistance)*push;if(!playerCollision(n,.54))player.position.copy(n)}
  }
}

/* ---------- Camera / pointer lock ---------- */
const pointer={locked:false};
document.addEventListener("pointerlockchange",()=>pointer.locked=document.pointerLockElement===renderer.domElement);
function lockMouse(){try{if(state.running&&!state.paused)renderer.domElement.requestPointerLock()}catch{}}
function unlockMouse(){try{if(document.pointerLockElement===renderer.domElement)document.exitPointerLock()}catch{}}
renderer.domElement.addEventListener("click",()=>{if(state.running&&!state.paused)lockMouse()});
window.addEventListener("mousemove",e=>{if(pointer.locked&&!state.paused){state.yaw-=e.movementX*.0024;const p=state.pitch-e.movementY*.0018;state.pitch=THREE.MathUtils.clamp(p,state.cameraMode==="first"?-1.34:-.30,state.cameraMode==="first"?1.28:.72)}});

function updateCamera(dt=1/60){
  const mode=state.cameraMode||"third",dtSafe=Math.max(0,Math.min(.05,dt||1/60));
  const smooth=rate=>1-Math.exp(-rate*dtSafe);
  state.firstPerson=mode==="first";
  if(mode==="first"){
    player.visible=false;
    const target=player.position.clone().add(new THREE.Vector3(0,1.72,0));camera.position.lerp(target,smooth(22));
    const d=new THREE.Vector3(Math.sin(state.yaw),Math.sin(state.pitch),Math.cos(state.yaw));camera.lookAt(camera.position.clone().add(d));return;
  }
  player.visible=true;
  if(mode==="top"){camera.position.lerp(player.position.clone().add(new THREE.Vector3(0,22,0)),smooth(8));camera.lookAt(player.position.x,0,player.position.z);return;}
  if(mode==="iso"){camera.position.lerp(player.position.clone().add(new THREE.Vector3(10,11,10)),smooth(8));camera.lookAt(player.position.x,1,player.position.z);return;}
  if(mode==="side"){camera.position.lerp(player.position.clone().add(new THREE.Vector3(14,4,0)),smooth(8));camera.lookAt(player.position.x,1,player.position.z);return;}
  if(mode==="fixed"){camera.position.lerp(new THREE.Vector3(0,18,24),smooth(3));camera.lookAt(0,0,8);return;}
  const d=new THREE.Vector3(Math.sin(state.yaw),0,Math.cos(state.yaw)),off=d.multiplyScalar(-8.4);off.y=4.4+state.pitch*1.6;
  camera.position.lerp(player.position.clone().add(off),smooth(8));camera.lookAt(player.position.x,player.position.y+1.05,player.position.z);
}
function updateCameraUI(){const map={first:"PRIMEIRA PESSOA",third:"TERCEIRA PESSOA",top:"VISÃO SUPERIOR",iso:"ISOMÉTRICA",side:"VISÃO LATERAL",fixed:"CÂMERA FIXA"};const label=$("cameraModeLabel");if(label)label.textContent=map[state.cameraMode]||map.third;const sel=$("cameraMode");if(sel)sel.value=state.cameraMode}
function setCameraMode(m){if(!["first","third","top","iso","side","fixed"].includes(m))m="third";state.cameraMode=m;state.firstPerson=m==="first";if(m!=="first")player.visible=true;else player.visible=false;safeStorageWrite("gl_camera_mode",m);updateCameraUI();updateCamera();toast("🎥 Câmera: "+($("cameraModeLabel")?.textContent||m))}


/* ---------- Combat quiz ---------- */
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fmt(n){return Number(n.toFixed(2)).toString().replace(".",",")}
function numericQuestion(f,d){
  if(f.id==="square"){const l=[2,3,4,5,6][Math.floor(Math.random()*5)],a=l*l,dg=l*Math.SQRT2;if(d==="hard"||d==="master")return{type:"PLANA",text:`Quadrado de lado ${l} cm. Qual é a diagonal?`,answers:[fmt(dg)+" cm",fmt(dg/2)+" cm","10 cm",fmt(dg*2)+" cm"],correct:fmt(dg)+" cm",tip:"d = l√2"};return{type:"PLANA",text:`Quadrado de lado ${l} cm. Qual é a área?`,answers:[a+" cm²",(a/2)+" cm²",(a+5)+" cm²",(a*2)+" cm²"],correct:a+" cm²",tip:"A = l²"}}
  if(f.id==="rectangle"){const b=6,h=4;return{type:"PLANA",text:`Retângulo ${b}×${h} cm. Qual é a diagonal?`,answers:["7,21 cm","10 cm","24 cm","4 cm"],correct:"7,21 cm",tip:"d = √(b²+h²)"}}
  if(f.id==="circle"){const r=2+Math.floor(Math.random()*4),a=3.14*r*r,c=2*3.14*r;if(d==="hard")return{type:"PLANA",text:`Círculo de raio ${r} cm. Qual é o comprimento? Use π=3,14.`,answers:[fmt(c)+" cm",fmt(a)+" cm",fmt(c/2)+" cm",fmt(c*2)+" cm"],correct:fmt(c)+" cm",tip:"C = 2πr"};return{type:"PLANA",text:`Círculo de raio ${r} cm. Qual é a área? Use π=3,14.`,answers:[fmt(a)+" cm²",fmt(c)+" cm²",fmt(a/2)+" cm²",fmt(a*2)+" cm²"],correct:fmt(a)+" cm²",tip:"A = πr²"}}
  if(f.id==="right_triangle"){if(d==="master")return{type:"PLANA",text:"Triângulo retângulo com catetos 3 e 4 cm. Qual é a hipotenusa?",answers:["3 cm","4 cm","5 cm","7 cm"],correct:"5 cm",tip:"Teorema de Pitágoras"};return{type:"PLANA",text:"Triângulo retângulo com base 4 cm e altura 3 cm. Qual é a área?",answers:["6 cm²","7 cm²","12 cm²","24 cm²"],correct:"6 cm²",tip:"A = b·h/2"}}
  if(f.id==="rhombus")return{type:"PLANA",text:"Losango com diagonais 8 cm e 6 cm. Qual é a área?",answers:["14 cm²","24 cm²","48 cm²","96 cm²"],correct:"24 cm²",tip:"A = D·d/2"};
  if(f.id==="cube"){if(d==="hard"||d==="master"){const x=3*Math.sqrt(3);return{type:"ESPACIAL",text:"Cubo com aresta 3 cm. Qual é a diagonal espacial?",answers:[fmt(x)+" cm","6 cm","9 cm","3 cm"],correct:fmt(x)+" cm",tip:"D = a√3"}}return{type:"ESPACIAL",text:"Cubo com aresta 3 cm. Qual é o volume?",answers:["27 cm³","9 cm³","18 cm³","36 cm³"],correct:"27 cm³",tip:"V = a³"}}
  if(f.id==="rect_prism")return{type:"ESPACIAL",text:"Paralelepípedo 2×3×4 m. Qual é o volume?",answers:["12 m³","18 m³","24 m³","30 m³"],correct:"24 m³",tip:"V = abc"};
  if(f.id==="cylinder")return{type:"ESPACIAL",text:"Cilindro: r=2 cm e h=5 cm. Qual é o volume? Use π=3,14.",answers:["31,4 cm³","62,8 cm³","78,5 cm³","125,6 cm³"],correct:"62,8 cm³",tip:"V = πr²h"};
  if(f.id==="cone")return{type:"ESPACIAL",text:"Cone: r=2 cm e h=6 cm. Qual é o volume? Use π=3,14.",answers:["12,56 cm³","25,12 cm³","37,68 cm³","50,24 cm³"],correct:"25,12 cm³",tip:"V = πr²h/3"};
  if(f.id==="sphere")return{type:"ESPACIAL",text:"Esfera de raio 2 cm. Qual é o volume aproximado? Use π=3,14.",answers:["16,75 cm³","25,12 cm³","33,49 cm³","50,24 cm³"],correct:"33,49 cm³",tip:"V = 4πr³/3"};
  return null;
}
function formulaQuestion(f,pool=FIGURES,allowedKeys=null){
  const keys=(allowedKeys||["area","perimeter","volume","diagonal"]).filter(k=>f[k]);if(!keys.length)return null;
  const key=keys[Math.floor(Math.random()*keys.length)],correct=f[key];
  const candidates=[...new Set(pool.filter(x=>x!==f&&x.type===f.type&&x[key]).map(x=>x[key]).filter(v=>v!==correct))];
  let d=shuffle(candidates).slice(0,3);
  const fallback=["A = b·h","A = πr²","V = abc","d = l√2","P = 2(a+b)"] .filter(v=>v!==correct&&!d.includes(v));
  for(const option of shuffle(fallback)){if(d.length>=3)break;d.push(option)}
  while(d.length<3)d.push("Nenhuma das anteriores");
  return{type:f.type.toUpperCase(),text:`Qual é a fórmula de ${key==="area"?"área":key==="perimeter"?"perímetro":key==="volume"?"volume":"diagonal"} de ${f.name}?`,answers:shuffle([correct,...d]),correct,tip:"Identifique a grandeza pedida.",figureId:f.id,geometryClass:f.type};
}
function pick(pool){return pool[Math.floor(Math.random()*pool.length)]}
function makeQuestion(diff){
  const plane=FIGURES.filter(f=>f.type==="Plana");
  const spatial=FIGURES.filter(f=>f.type==="Espacial");
  let pool, f, q;

  // FÁCIL: somente geometria plana e perguntas introdutórias (principalmente área/perímetro).
  if(diff==="easy"){
    pool=plane; f=pick(pool);
    q=numericQuestion(f,"easy");
    if(q && (q.type==="PLANA")) return q;
    return formulaQuestion(f,pool,["area","perimeter"]) || formulaQuestion(pick(plane),plane,["area","perimeter"]);
  }

  // MÉDIO: qualquer conteúdo de geometria plana — área, perímetro, diagonais e fórmulas.
  if(diff==="medium"){
    pool=plane; f=pick(pool);
    q=numericQuestion(f,"medium");
    return q && q.type==="PLANA" ? q : (formulaQuestion(f,pool) || formulaQuestion(pick(plane),plane));
  }

  // DIFÍCIL: somente geometria espacial.
  if(diff==="hard"){
    pool=spatial; f=pick(pool);
    q=numericQuestion(f,"hard");
    return q && q.type==="ESPACIAL" ? q : (formulaQuestion(f,pool) || formulaQuestion(pick(spatial),spatial));
  }

  // MESTRE: mistura de figuras planas e espaciais.
  pool=[...plane,...spatial]; f=pick(pool);
  q=numericQuestion(f,"master");
  return q || formulaQuestion(f,pool) || formulaQuestion(pick(pool),pool);
}
function trainingQuestionFor(topic){
  if(topic==='plane')return makeQuestion('easy')||makeQuestion('medium');
  if(topic==='spatial')return makeQuestion('hard');
  if(topic==='mixed')return makeQuestion('master');
  const pool=FIGURES.filter(f=>f.area||f.perimeter||f.volume||f.diagonal);
  return formulaQuestion(pick(pool)||pick(FIGURES),pool)||makeQuestion('master');
}
function startGeometryTraining(topic){
  const names={plane:'GEOMETRIA PLANA',spatial:'GEOMETRIA ESPACIAL',mixed:'DESAFIO MISTO',formulas:'FÓRMULAS RELÂMPAGO'};
  if(!names[topic])return;
  clearInterval(state.quizTimer);clearTimeout(state.quizCloseTimer);state.trainingSession={topic,name:names[topic],asked:0,total:5,correct:0};
  state.quizKind='training';state.quizEnemy=null;state.quizAnswered=false;state.paused=true;state.keys={};unlockMouse();$('geometryHub')?.classList.add('hidden');loadTrainingQuestion();
}
function loadTrainingQuestion(){
  const session=state.trainingSession;if(!session)return finishGeometryTraining();
  if(session.asked>=session.total)return finishGeometryTraining();
  clearInterval(state.quizTimer);clearTimeout(state.quizCloseTimer);state.quizKind='training';state.quizEnemy=null;state.quiz=trainingQuestionFor(session.topic);state.quizTime=45;state.quizAnswered=false;
  if(!state.quiz){state.trainingSession=null;toast('Não foi possível montar essa pergunta.');return finishQuiz()}
  $('quizTitle').textContent=`${session.name} · ${session.asked+1}/${session.total}`;$('quizDiff').textContent='TRILHA DE APRENDIZADO';$('quizType').textContent=state.quiz.type;$('question').textContent=state.quiz.text;$('qFeedback').textContent='';$('qFeedback').className='';$('answers').innerHTML='';
  state.quiz.answers.forEach(a=>{const b=document.createElement('button');b.className='answer';b.type='button';b.textContent=a;b.onclick=()=>resolveAnswer(a);$('answers').appendChild(b)});
  $('quiz').classList.remove('hidden');renderTimer();state.quizTimer=setInterval(()=>{state.quizTime--;renderTimer();if(state.quizTime<=0){clearInterval(state.quizTimer);state.quizTimer=null;timeOut()}},1000);
}
function finishGeometryTraining(){
  const session=state.trainingSession;if(!session)return finishQuiz();
  clearInterval(state.quizTimer);state.quizTimer=null;clearTimeout(state.quizCloseTimer);state.quizCloseTimer=null;state.quiz=null;state.quizEnemy=null;state.quizKind='combat';state.quizAnswered=false;state.trainingSession=null;$('quiz')?.classList.add('hidden');
  const bonus= session.correct>=4?150:session.correct>=2?75:25;awardXP(bonus,'Trilha de geometria concluída');state.paused=false;lockMouse();toast(`Trilha concluída: ${session.correct}/${session.total} certas · +${bonus} XP`);updateHUD();
}
function targetEnemy(){
  const ray=new THREE.Raycaster();ray.setFromCamera(new THREE.Vector2(0,0),camera);
  const hits=ray.intersectObjects(enemies,true);
  for(const h of hits){let o=h.object;while(o.parent&&o.parent!==actors)o=o.parent;if(o.userData?.alive)return o}
  let best=null,bd=7;for(const e of enemies)if(e.userData.alive){const d=e.position.distanceTo(player.position);if(d<bd){bd=d;best=e}}return best;
}
function updateTargetHUD(){const e=targetEnemy();if(!e){$("enemyHud").classList.add("hidden");return} $("enemyHud").classList.remove("hidden");$("enemyName").textContent=e.userData.name;$("enemyHPBar").style.width=e.userData.hp+"%";$("enemyHPText").textContent=Math.round(e.userData.hp)}
function startQuiz(e){
  if(state.mode!=="combat"||!e||!e.userData?.alive)return;
  clearInterval(state.quizTimer);clearTimeout(state.quizCloseTimer);
  state.quizKind="combat";state.quizEnemy=e;state.quiz=makeQuestion(state.difficulty);state.quizTime=60;state.quizAnswered=false;state.paused=true;unlockMouse();
  $("quizTitle").textContent="ATAQUE: "+e.userData.name;$("quizDiff").textContent=DIFF[state.difficulty]?.label||state.difficulty.toUpperCase();$("quizType").textContent=state.quiz.type;$("question").textContent=state.quiz.text;$("qFeedback").textContent="";$("qFeedback").className="";$("answers").innerHTML="";
  state.quiz.answers.forEach(a=>{const b=document.createElement("button");b.className="answer";b.type="button";b.textContent=a;b.onclick=()=>resolveAnswer(a);$("answers").appendChild(b)});
  $("quiz").classList.remove("hidden");renderTimer();
  state.quizTimer=setInterval(()=>{state.quizTime--;renderTimer();if(state.quizTime<=0){clearInterval(state.quizTimer);state.quizTimer=null;timeOut()}},1000);
}
function closeQuiz(){
  const wasTraining=!!state.trainingSession;
  clearInterval(state.quizTimer);state.quizTimer=null;clearTimeout(state.quizCloseTimer);state.quizCloseTimer=null;state.trainingSession=null;
  state.quiz=null;state.quizEnemy=null;state.quizKind="combat";state.quizAnswered=false;$("quiz").classList.add("hidden");$("qFeedback").textContent="";$("answers").innerHTML="";
  state.paused=false;lockMouse();toast(wasTraining?"Trilha encerrada. Você pode retomá-la pelo menu de geometria.":"Quiz fechado. Você voltou para a batalha.");updateHUD();
}
function renderTimer(){$("timer").textContent=state.quizTime;$('timer').classList.toggle("urgent",state.quizTime<=10)}
function setAnswerButtonsDisabled(disabled){document.querySelectorAll("#answers .answer").forEach(b=>b.disabled=disabled)}
function resolveAnswer(a){
  const e=state.quizEnemy,q=state.quiz;if(!q||state.quizAnswered)return;state.quizAnswered=true;clearInterval(state.quizTimer);state.quizTimer=null;setAnswerButtonsDisabled(true);state.questions++;state.missionSession.resolved++;persistStats();
  awardXP(10,"Questão respondida");
  if(state.quizKind==="practice"||state.quizKind==="training"){
    const correct=a===q.correct;
    if(state.quizKind==="training"&&state.trainingSession){
      const session=state.trainingSession;session.asked++;if(correct){session.correct++;state.missionSession.correct++;awardXP(35,"Resposta correta na trilha");$("qFeedback").textContent=`✓ CORRETO! ${session.asked}/${session.total} · +35 XP`;$("qFeedback").className="good"}
      else{$("qFeedback").textContent=`✗ A resposta era: ${q.correct}. Dica: ${q.tip||"Revise a fórmula."}`;$("qFeedback").className="bad"}
      checkMissions();updateHUD();state.quizCloseTimer=setTimeout(()=>session.asked>=session.total?finishGeometryTraining():loadTrainingQuestion(),correct?850:1300);return;
    }
    if(correct){state.missionSession.correct++;awardXP(60,"Resposta correta");$("qFeedback").textContent="✓ CORRETO! +60 XP";$("qFeedback").className="good"}else{$("qFeedback").textContent="✗ ERRADO. Dica: "+(q.tip||"Revise a fórmula.");$("qFeedback").className="bad"}
    checkMissions();updateHUD();state.quizCloseTimer=setTimeout(finishQuiz,correct?700:1000);return;
  }
  if(!e)return;
  if(a===q.correct){
    state.missionSession.correct++;e.userData.hp-=50;
    if(state.online&&!state.host)sendRoom({type:"damageEnemy",id:e.userData.id,amount:50});
    awardXP(100,"Acerto no combate");$("qFeedback").textContent="✓ CORRETO! 50 de dano.";$("qFeedback").className="good";burst(e.position.clone().add(new THREE.Vector3(0,1.3,0)),0x8cf5ff,22);broadcastEnemy(e);
    if(e.userData.hp<=0){e.userData.alive=false;e.visible=false;state.kills++;state.missionSession.kills++;persistStats();awardXP(150,"Geo-Beast derrotado");$("qFeedback").textContent="✓ DERROTADO! +250 XP";if(state.online&&state.host)sendRoom({type:"enemy",id:e.userData.id,hp:0,alive:false});checkMissions();updateHUD();state.waveCheckCooldown=2.6;state.quizCloseTimer=setTimeout(()=>{finishQuiz();if(!state.online||state.host)spawnWave()},900)}
    else{checkMissions();updateHUD();state.quizCloseTimer=setTimeout(finishQuiz,700)}
  }else{damagePlayer(18,"Resposta incorreta");$("qFeedback").textContent="✗ ERRADO. Você sofreu dano. Dica: "+q.tip;$("qFeedback").className="bad";checkMissions();updateHUD();state.quizCloseTimer=setTimeout(finishQuiz,900)}
}
function timeOut(){
  if(!state.quiz||state.quizAnswered||!(state.quizKind==="combat"||state.quizKind==="practice"||state.quizKind==="training"))return;
  state.quizAnswered=true;setAnswerButtonsDisabled(true);state.missionSession.resolved++;state.questions++;persistStats();awardXP(5,"Desafio tentado");
  if(state.quizKind==="training"&&state.trainingSession){
    const session=state.trainingSession;session.asked++;$("qFeedback").textContent=`⌛ Tempo esgotado. ${session.asked}/${session.total}. Revise a fórmula e continue.`;$("qFeedback").className="bad";checkMissions();updateHUD();state.quizCloseTimer=setTimeout(()=>session.asked>=session.total?finishGeometryTraining():loadTrainingQuestion(),1100);return;
  }
  if(state.quizKind==="practice"){$("qFeedback").textContent="⌛ Tempo esgotado. Revise a fórmula e tente novamente.";$("qFeedback").className="bad";}
  else{damagePlayer(20,"Tempo esgotado");$("qFeedback").textContent="⌛ TEMPO ESGOTADO. Você sofreu dano.";$("qFeedback").className="bad";}
  checkMissions();updateHUD();state.quizCloseTimer=setTimeout(finishQuiz,850);
}
function finishQuiz(){clearInterval(state.quizTimer);state.quizTimer=null;clearTimeout(state.quizCloseTimer);state.quizCloseTimer=null;$("quiz").classList.add("hidden");state.quiz=null;state.quizEnemy=null;state.quizKind="combat";state.quizAnswered=false;state.paused=false;lockMouse();updateHUD()}
function spawnWave(){
  state.waveCheckCooldown=3.2;
  const cx=state.mapMode==="new"?60:0,cz=state.mapMode==="new"?-20:0;
  for(let tries=0;tries<36;tries++){
    const a=Math.random()*Math.PI*2,r=state.mapMode==="new"?9+Math.random()*9:14+Math.random()*8,x=cx+Math.cos(a)*r,z=cz+Math.sin(a)*r,y=state.mapMode==="new"?Math.max(0,floorAt(x,z)):0,p=new THREE.Vector3(x,y,z);
    if(state.mapMode==="new"&&floorAt(x,z)<-2.5)continue;
    if(!withinCombatIsland(x,z,2)||enemyCollision(p,.76,null))continue;
    const idx=Math.floor(Math.random()*FIGURES.length);spawnEnemy("Geo-Beast "+(enemies.length+1),p,colors[Math.floor(Math.random()*colors.length)],idx);return;
  }
  toast("A arena está cheia; não foi possível criar outro Geo-Beast agora.");
}

/* ---------- Learning ---------- */
let selectedFigure=null;
function escHtml(s){return String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function figureIllustrationSvg(f){
  const flat=new Set(['square','rectangle','equilateral_triangle','isosceles_triangle','right_triangle','scalene_triangle','parallelogram','rhombus','right_trapezoid','isosceles_trapezoid','scalene_trapezoid','circle','semicircle','annulus','sector','segment','regular_pentagon','regular_hexagon','regular_octagon','ellipse']);
  const drawings={
    square:'<polygon points="100,40 220,40 220,160 100,160"/>',
    rectangle:'<polygon points="72,55 248,55 248,145 72,145"/>',
    equilateral_triangle:'<polygon points="160,28 255,157 65,157"/>',
    isosceles_triangle:'<polygon points="160,28 258,158 62,158"/>',
    right_triangle:'<polygon points="74,35 74,158 250,158"/>',
    scalene_triangle:'<polygon points="70,145 135,35 260,135"/>',
    parallelogram:'<polygon points="105,45 260,45 215,155 60,155"/>',
    rhombus:'<polygon points="160,25 255,100 160,175 65,100"/>',
    right_trapezoid:'<polygon points="75,145 245,145 245,45 120,45"/>',
    isosceles_trapezoid:'<polygon points="60,150 260,150 215,45 105,45"/>',
    scalene_trapezoid:'<polygon points="55,150 260,150 218,45 125,45"/>',
    circle:'<circle cx="160" cy="100" r="67"/>',
    semicircle:'<path d="M75 110 A85 85 0 0 1 245 110 Z"/>',
    annulus:'<path fill-rule="evenodd" d="M160 25 A75 75 0 1 1 159.9 25 Z M160 67 A33 33 0 1 0 160.1 67 Z"/>',
    sector:'<path d="M160 100 L236 100 A76 76 0 0 1 136 173 Z"/>',
    segment:'<path d="M78 113 A82 82 0 0 1 242 113 Q160 180 78 113 Z"/>',
    regular_pentagon:'<polygon points="160,23 241,82 210,169 110,169 79,82"/>',
    regular_hexagon:'<polygon points="105,37 215,37 270,100 215,163 105,163 50,100"/>',
    regular_octagon:'<polygon points="122,28 198,28 249,79 249,121 198,172 122,172 71,121 71,79"/>',
    ellipse:'<ellipse cx="160" cy="100" rx="104" ry="61"/>'
  };
  const spatial={
    cube:'<polygon points="92,75 160,37 232,75 160,115"/><polygon points="92,75 160,115 160,165 92,126"/><polygon points="160,115 232,75 232,126 160,165"/>',
    rect_prism:'<polygon points="65,78 160,35 260,78 160,121"/><polygon points="65,78 160,121 160,165 65,122"/><polygon points="160,121 260,78 260,122 160,165"/>',
    triangular_prism:'<polygon points="70,130 125,35 180,130"/><polygon points="145,155 200,60 255,155"/><path d="M70 130 L145 155 M125 35 L200 60 M180 130 L255 155"/>',
    hex_prism:'<polygon points="90,62 160,38 230,62 230,125 160,151 90,125"/><path d="M90 62 L90 130 L160 160 L230 130 L230 62 M160 151 L160 160"/>',
    cylinder:'<ellipse cx="160" cy="52" rx="70" ry="25"/><path d="M90 52 V145 C90 178 230 178 230 145 V52"/><ellipse cx="160" cy="145" rx="70" ry="25"/>',
    oblique_cylinder:'<ellipse cx="145" cy="42" rx="68" ry="23"/><path d="M145 42 L190 150 M213 42 L258 150"/><ellipse cx="224" cy="150" rx="68" ry="23"/>',
    cone:'<path d="M160 27 L82 147 Q160 179 238 147 Z"/><ellipse cx="160" cy="147" rx="78" ry="26"/>',
    square_pyramid:'<polygon points="160,26 65,142 160,174 255,142"/><path d="M160 26 L160 174 M65 142 L160 91 L255 142"/>',
    sphere:'<circle cx="160" cy="100" r="70"/><ellipse cx="160" cy="100" rx="29" ry="70"/><ellipse cx="160" cy="100" rx="70" ry="25"/>',
    hemisphere:'<path d="M82 116 A78 72 0 0 1 238 116 Z"/><ellipse cx="160" cy="116" rx="78" ry="25"/>',
    tetrahedron:'<polygon points="160,28 62,158 258,158"/><path d="M160 28 L160 158 M62 158 L203 92"/>',
    octahedron:'<polygon points="160,22 250,100 160,178 70,100"/><path d="M70 100 L250 100 M160 22 L160 178"/>',
    dodecahedron:'<polygon points="125,28 195,28 245,72 230,132 160,170 90,132 75,72"/><polygon points="125,28 160,65 195,28 245,72 195,92 230,132 160,112 90,132 125,92 75,72 160,65"/>',
    icosahedron:'<polygon points="160,23 224,54 255,110 205,163 115,163 65,110 96,54"/><path d="M160 23 L115 163 M160 23 L205 163 M96 54 L224 54 M65 110 L255 110 M96 54 L205 163 M224 54 L115 163"/>',
    cone_frustum:'<ellipse cx="160" cy="55" rx="45" ry="18"/><path d="M115 55 L82 145 M205 55 L238 145"/><ellipse cx="160" cy="145" rx="78" ry="25"/>',
    pyramid_frustum:'<polygon points="118,48 202,48 245,85 160,118 75,85"/><path d="M75 85 V143 L160 176 L245 143 V85 M160 118 V176"/><path d="M118 48 L118 105 M202 48 L202 105"/>',
    torus:'<ellipse cx="160" cy="102" rx="92" ry="53"/><ellipse cx="160" cy="102" rx="43" ry="23"/><path d="M68 102 C77 36 242 36 252 102"/>',
    ellipsoid:'<ellipse cx="160" cy="100" rx="105" ry="58"/><ellipse cx="160" cy="100" rx="38" ry="58"/><path d="M57 100 Q160 37 263 100 Q160 163 57 100"/>',
    spherical_cap:'<path d="M80 127 A80 80 0 0 1 240 127 Z"/><ellipse cx="160" cy="127" rx="80" ry="24"/>',
    pentagonal_prism:'<polygon points="160,28 225,75 200,145 120,145 95,75"/><path d="M160 28 L160 72 L225 75 M225 75 L225 137 L200 174 L120 174 L95 137 L95 75 M120 145 L120 174 M200 145 L200 174 M160 72 L160 150"/>'
  };
  let shape=drawings[f.id]||spatial[f.id]||spatial.cube;
  const tag=flat.has(f.id)?'FIGURA PLANA':'SÓLIDO ESPACIAL';
  return `<svg viewBox="0 0 320 190" role="img" aria-label="Ilustração de ${escHtml(f.name)}"><defs><linearGradient id="geoFace" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8ce6ff"/><stop offset="1" stop-color="#4384fb"/></linearGradient><radialGradient id="geoBack"><stop offset="0" stop-color="#284e83"/><stop offset="1" stop-color="#122643"/></radialGradient></defs><rect x="2" y="2" width="316" height="186" rx="16" fill="url(#geoBack)"/><circle cx="260" cy="38" r="24" fill="#52d9ef" opacity=".12"/><circle cx="52" cy="150" r="29" fill="#9a7bff" opacity=".10"/><g fill="url(#geoFace)" stroke="#d7f5ff" stroke-width="2.8" stroke-linejoin="round" stroke-linecap="round">${shape}</g><g fill="none" stroke="#e4f7ff" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round">${shape}</g><text x="160" y="181" fill="#d8eafe" font-size="9" font-family="Arial" text-anchor="middle" letter-spacing="1.4">${tag}</text></svg>`;
}
function showFigure(f){
  selectedFigure=f;
  const formulas=['area','perimeter','volume','diagonal'].filter(k=>f[k]).map(k=>`<span class="formula">${escHtml(k==='area'?'Área':k==='perimeter'?'Perímetro':k==='volume'?'Volume':'Diagonal')}: ${escHtml(f[k])}</span>`).join('');
  $('catalogTitle').textContent=f.name;
  $('figureDetail').innerHTML=`<div class="figure-illustration">${figureIllustrationSvg(f)}<small>Ilustração esquemática da forma selecionada</small></div><div class="figure-meta"><b class="figure-type">${escHtml(f.type)}</b><div class="figure-formulas">${formulas}</div><p>Observe o formato antes de estudar as fórmulas.</p></div>`;
  if(state.mode==='learning'){
    const firstStudy=!state.studiedFigures.has(f.id);state.studiedFigures.add(f.id);state.missionSession.studied=state.studiedFigures.size;
    const now=Date.now();state.lastStudyXP=state.lastStudyXP||new Map();const last=state.lastStudyXP.get(f.id)||0;
    if(firstStudy){awardXP(20,"Nova figura estudada");state.lastStudyXP.set(f.id,now)}else if(now-last>=30000){awardXP(5,"Revisão de figura");state.lastStudyXP.set(f.id,now)}
    checkMissions();updateHUD();
  }
}
function renderCatalog(filter=""){$("figureList").innerHTML="";FIGURES.filter(f=>f.name.toLowerCase().includes(filter.toLowerCase())).forEach(f=>{const b=document.createElement("button");b.className="figure-btn";b.textContent=f.name;b.onclick=()=>showFigure(f);$("figureList").appendChild(b)})}
$("figureSearch").oninput=e=>renderCatalog(e.target.value);
$("catalogClose").onclick=()=>{$("catalog").classList.add("hidden");openMenu()};
$("practiceFigure").onclick=()=>{
  if(!selectedFigure){toast("Escolha uma figura.");return;}
  state.quizKind="practice";state.quizEnemy=null;state.quiz=formulaQuestion(selectedFigure);state.quizAnswered=false;if(!state.quiz){toast("Essa figura não possui fórmula cadastrada para prática.");return;}
  clearInterval(state.quizTimer);clearTimeout(state.quizCloseTimer);state.quizTime=60;$("catalog").classList.add("hidden");$("quizTitle").textContent="PRÁTICA: "+selectedFigure.name;$("quizDiff").textContent="APRENDIZADO";$("quizType").textContent=selectedFigure.type.toUpperCase();$("question").textContent=state.quiz.text;$("qFeedback").textContent="";$("qFeedback").className="";$("answers").innerHTML="";
  state.quiz.answers.forEach(a=>{const b=document.createElement("button");b.className="answer";b.type="button";b.textContent=a;b.onclick=()=>resolveAnswer(a);$("answers").appendChild(b)});
  $("quiz").classList.remove("hidden");state.paused=true;unlockMouse();renderTimer();
  state.quizTimer=setInterval(()=>{state.quizTime--;renderTimer();if(state.quizTime<=0){clearInterval(state.quizTimer);state.quizTimer=null;timeOut()}},1000);
};
/* ---------- Palette / 40 figures for building ---------- */
function renderPalette(filter=""){
  $("paletteGrid").innerHTML="";
  FIGURES.filter(f=>f.name.toLowerCase().includes(filter.toLowerCase())).forEach(f=>{
    const b=document.createElement("button");b.textContent=f.name;b.onclick=()=>{
      const match=INV.find(x=>x.id===f.id);
      if(match)selectItem(INV.indexOf(match)); else {
        // use a safe representative visual for advanced figures while keeping the
        // selected formula/figure as the educational metadata.
        const temp={...f,color:0x7d86ff,icon:"◇"};
        const idx=7;state.selected=idx;[...$("slots").children].forEach((x,n)=>x.classList.toggle("selected",n===idx));
        preview.geometry.dispose();preview.geometry=solidGeo(f.id);preview.rotation.set(0,0,0);preview.material.color.set(temp.color);preview.userData.figure=temp;preview.userData.itemId=f.id;window.__CUSTOM_BUILD_FIGURE__=temp;$('buildFigureName')&&($('buildFigureName').textContent=f.name.toUpperCase());
      }
      $("palette").classList.add("hidden");state.paused=false;lockMouse();
    };$("paletteGrid").appendChild(b)
  })
}
$("paletteSearch").oninput=e=>renderPalette(e.target.value);
$("paletteClose").onclick=()=>{$("palette").classList.add("hidden");openMenu()};

/* ---------- Web research ---------- */
async function webSearch(){
  const q=$("webQuery").value.trim();if(!q)return;$("webResults").textContent="Pesquisando...";
  try{const r=await fetch("/api/web-search?q="+encodeURIComponent(q));const d=await r.json();if(!r.ok)throw new Error(d.error||"Falha");$("webResults").innerHTML=(d.results||[]).map(x=>`<article><b>${esc(x.title)}</b><p>${esc(x.snippet||"")}</p><a href="${esc(x.url)}" target="_blank" rel="noreferrer">${esc(x.url)}</a></article>`).join("")||"Nenhum resultado."}
  catch(e){$("webResults").innerHTML=`<p>Pesquisa do jogo indisponível. <a target="_blank" rel="noreferrer" href="https://www.google.com/search?q=${encodeURIComponent(q)}">Abrir no Google</a></p>`}
}
function esc(s){return String(s).replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]))}
$("webGo").onclick=webSearch;

/* ---------- Gemini debug ---------- */
async function callAPI(url,payload){const r=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(payload)});const d=await r.json();if(!r.ok)throw new Error(d.error||"API");return d}
$("analyze").onclick=async()=>{ $("debugStatus").textContent="Gemini analisando...";try{const d=await callAPI("/api/gemini-debug",{errors:state.errors.slice(-20)});$("debugOut").textContent=d.text||JSON.stringify(d,null,2);$("debugStatus").textContent="Diagnóstico concluído."}catch(e){$("debugOut").textContent=String(e);$("debugStatus").textContent="Gemini indisponível."}};
$("autoFix").onclick=async()=>{ $("debugStatus").textContent="Gemini gerando sugestão...";try{const d=await callAPI("/api/gemini-fix",{errors:state.errors.slice(-20)});$("debugOut").textContent=JSON.stringify(d,null,2);$("debugStatus").textContent="Patch sugerido."}catch(e){$("debugOut").textContent=String(e);$("debugStatus").textContent="Gemini indisponível."}};

/* ---------- World Map ---------- */

/* ---------- Menus ---------- */
function openMenu(){state.paused=true;unlockMouse();$("menu").classList.remove("hidden")}
function closeMenu(){state.paused=false;$("menu").classList.add("hidden");lockMouse()}
$("resume").onclick=closeMenu;
$("returnToSpawn")?.addEventListener("click",()=>{movePlayerToSafeSpawn(state.mapMode);state.vy=0;state.grounded=true;if(state.online)sendPosition();closeMenu();toast("Você voltou ao spawn seguro.")});
$("mapClose")?.addEventListener("click",closeMap);
$("changeMode").onclick=()=>{leaveRelaySession(true);state.running=false;state.paused=true;closeModals();unlockMouse();$("hud").classList.add("hidden");$("startScreen").classList.remove("hidden");refreshProgressionUI()};
$("menuCatalog").onclick=()=>{$("menu").classList.add("hidden");renderCatalog();$("catalog").classList.remove("hidden")};
$("menuLesson").onclick=()=>{$("menu").classList.add("hidden");$("lesson").classList.remove("hidden")};
$("menuGeometryHub").onclick=()=>{$("menu").classList.add("hidden");$("geometryHub").classList.remove("hidden");state.paused=true;unlockMouse()};
$("geometryHubClose").onclick=()=>{$("geometryHub").classList.add("hidden");openMenu()};
$("geometryHubCatalog").onclick=()=>{$("geometryHub").classList.add("hidden");renderCatalog();$("catalog").classList.remove("hidden")};
document.querySelectorAll("[data-training-mode]").forEach(b=>b.addEventListener("click",()=>startGeometryTraining(b.dataset.trainingMode)));
$("menuWeb").onclick=()=>{$("menu").classList.add("hidden");$("web").classList.remove("hidden")};
$("menuDebug").onclick=()=>{$("menu").classList.add("hidden");$("debug").classList.remove("hidden")};
$("lessonClose").onclick=()=>{$("lesson").classList.add("hidden");openMenu()};
$("webClose").onclick=()=>{$("web").classList.add("hidden");openMenu()};
$("debugClose").onclick=()=>{$("debug").classList.add("hidden");openMenu()};

function openPalette(){state.paused=true;unlockMouse();renderPalette();$("palette").classList.remove("hidden")}
$("palette").onclick=e=>{if(e.target===e.currentTarget)openMenu()};

/* ---------- Multiplayer (PeerJS) ---------- */
function peerLoader(){
  return new Promise((resolve,reject)=>{
    if(window.Peer)return resolve();
    const s=document.createElement("script");s.src="https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js";s.onload=resolve;s.onerror=()=>reject(new Error("PeerJS não carregou"));document.head.appendChild(s)
  })
}
function roomCode(){return Math.random().toString(36).slice(2,8).toLowerCase()}
function relayPost(payload){
  return fetch("/api/room-relay",{method:"POST",headers:{"Content-Type":"application/json"},cache:"no-store",body:JSON.stringify(payload)})
    .then(async r=>{const d=await r.json().catch(()=>({error:"Resposta inválida do servidor de salas."}));if(!r.ok){const err=new Error(d.error||"Servidor de salas indisponível.");err.status=r.status;throw err;}return d;});
}
function relayPlayerPayload(){
  return {id:state.peerId,color:Number(window.__GL_START__?.color)||0x4c8dff,pos:[player.position.x,player.position.y,player.position.z],rot:player.rotation.y,mode:state.mode,character:{...(state.character||characterConfig)}};
}
function relayObjectPayload(){
  return placedObjects.filter(o=>!o.userData?.display).map(o=>({id:o.userData.id,item:o.userData.itemId||o.userData.figure?.id,pos:[o.position.x,o.position.y,o.position.z],rot:[o.rotation.x,o.rotation.y,o.rotation.z]}));
}
function relayEnemyPayload(){
  return enemies.map(e=>({id:e.userData.id,name:e.userData.name,hp:e.userData.hp,alive:!!e.userData.alive,pos:[e.position.x,e.position.y,e.position.z],rot:e.rotation.y,qIdx:e.userData.qIdx,color:e.userData.color||0x4f81ff}));
}
async function beginNetwork(){
  if(!state.online)return;
  const a=state.roomAction;
  if(!a||!(a.action==="create"||a.action==="join")){
    state.online=false;state.host=false;const status=$("roomStatus");if(status)status.textContent="Escolha CRIAR SALA ou ENTRAR COM CÓDIGO antes de iniciar.";updateHUD();return;
  }
  const code=String(a.code||"").trim().toLowerCase().replace(/[^a-z0-9_-]/g,"");
  const password=String(a.password||"");
  if(code.length<3||code.length>12||!password){
    state.online=false;state.host=false;const status=$("roomStatus");if(status)status.textContent="Código inválido ou senha ausente. Use 3–12 caracteres no código e uma senha.";updateHUD();return;
  }
  state.networkConnecting=true;state.host=a.action==="create";state.room=code;state.roomPassword=password;
  state.peerId="p"+Date.now().toString(36)+Math.random().toString(36).slice(2,9);
  state.myOwnerIds.add(state.peerId);
  state.relayActive=false;state.relayInFlight=false;state.relayAccumulator=0;state.relayEvents=[];state.relayInitialSnapshot=false;state.pendingPlacementSince=new Map();state.relayErrorStreak=0;state.relayErrorNotified=false;
  updateHUD();
  const payload={action:a.action,room:code,password,player:relayPlayerPayload()};
  if(a.action==="create"){payload.enemies=relayEnemyPayload();payload.objects=relayObjectPayload();}
  try{
    const snap=await relayPost(payload);
    state.relayActive=true;state.networkConnecting=false;state.online=true;
    processRelaySnapshot(snap);
    if(a.action==="create"){
      const status=$("roomStatus");if(status)status.textContent="SALA CRIADA: "+code.toUpperCase()+" — compartilhe o código e a senha.";
      window.__SHOW_ROOM_CODE__?.(code);toast("Sala "+code.toUpperCase()+" criada.");
    }else{const status=$("roomStatus");if(status)status.textContent="Conectado à sala "+code.toUpperCase()+".";toast("Você entrou na sala "+code.toUpperCase()+".");}
    updateHUD();
  }catch(err){
    state.networkConnecting=false;state.relayActive=false;state.online=false;state.host=false;state.peerId=null;
    const status=$("roomStatus");if(status)status.textContent="Falha no multiplayer: "+(err.message||"servidor indisponível")+". Publique no Netlify com Blobs habilitado.";
    toast("Não foi possível conectar à sala.");updateHUD();captureError({type:"multiplayer",message:String(err.message||err),status:err.status||0});
  }
}
function processRelaySnapshot(s){
  if(!s||!Array.isArray(s.players))return;
  const live=new Set();
  for(const p of s.players){
    if(!p?.id)continue;live.add(p.id);if(p.id===state.peerId)continue;
    const remote=remoteAvatar(p.id);const dest=new THREE.Vector3(Number(p.pos?.[0])||0,Number(p.pos?.[1])||0,Number(p.pos?.[2])||0);
    remote.group.position.lerp(dest,.62);remote.group.rotation.y=Number(p.rot)||0;remote.lastSeen=p.lastSeen||Date.now();
    const color=Number(p.color)||0xa47cff;applyRemoteAvatarAppearance(remote,p.character,color);
    const nextName=String(p.character?.name||"Player").slice(0,14);
    if(remote.name!==nextName&&remote.nameSprite?.material?.map){
      remote.name=nextName;
      const canvas=remote.nameCanvas||(remote.nameCanvas=document.createElement("canvas"));canvas.width=320;canvas.height=64;
      const ctx=canvas.getContext("2d");ctx.clearRect(0,0,320,64);ctx.fillStyle="rgba(8,24,43,.82)";ctx.beginPath();if(ctx.roundRect)ctx.roundRect(4,4,312,56,16);else ctx.rect(4,4,312,56);ctx.fill();ctx.fillStyle="#ffffff";ctx.font="bold 26px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText(remote.name,160,32);remote.nameSprite.material.map.needsUpdate=true;
    }
    remote.color=color;
  }
  for(const [id,remote] of [...state.remotePlayers.entries()])if(!live.has(id)){remoteG.remove(remote.group);remote.group.traverse?.(o=>{if(o.geometry)o.geometry.dispose?.();if(o.material){const mats=Array.isArray(o.material)?o.material:[o.material];for(const m of mats){if(m.map?.isTexture)m.map.dispose();if(m.alphaMap?.isTexture)m.alphaMap.dispose();m.dispose?.()}}});state.remotePlayers.delete(id);}

  const serverEnemies=Array.isArray(s.enemies)?s.enemies:[];const enemyIds=new Set(serverEnemies.map(e=>e.id));
  if(!state.host){for(let i=enemies.length-1;i>=0;i--){if(!enemyIds.has(enemies[i].userData.id)){actors.remove(enemies[i]);enemies.splice(i,1);}}}
  for(const d of serverEnemies){
    if(!d?.id||!Array.isArray(d.pos))continue;
    let e=enemies.find(x=>x.userData.id===d.id);
    if(!e){e=spawnEnemy(d.name||"Geo-Beast",new THREE.Vector3(Number(d.pos[0])||0,Number(d.pos[1])||0,Number(d.pos[2])||0),Number(d.color)||0x8b72ff,d.qIdx||0);e.userData.id=d.id;}
    e.userData.hp=Math.max(0,Math.min(100,Number(d.hp)||0));e.userData.alive=!!d.alive&&e.userData.hp>0;e.visible=e.userData.alive;
    // O host publica posições da IA; clientes mantêm simulação local suave entre snapshots para não tremer.
    if(state.host)e.position.set(...d.pos.map(v=>Number(v)||0));
    e.userData.home=e.userData.home||e.position.clone();
  }
  state.relayInitialSnapshot=true;

  const serverObjects=Array.isArray(s.objects)?s.objects:[];const ids=new Set(serverObjects.map(o=>o.id));
  for(const d of serverObjects){
    const existing=placedObjects.find(o=>o.userData?.id===d.id);
    if(existing){existing.userData.owner=d.owner||existing.userData.owner;state.pendingPlacementSince.delete(d.id);if(existing.userData.owner!==state.peerId&&Array.isArray(d.pos)){existing.position.lerp(new THREE.Vector3(...d.pos.map(v=>Number(v)||0)),.62);if(Array.isArray(d.rot))existing.rotation.set(...d.rot.map(v=>Number(v)||0));}}
    else addRemoteObject(d);
  }
  for(const o of [...placedObjects]){
    if(o.userData?.display||ids.has(o.userData?.id))continue;
    const pending=state.pendingPlacementSince.get(o.userData?.id);
    if(pending&&Date.now()-pending<5000)continue;
    removeById(o.userData.id);state.pendingPlacementSince.delete(o.userData.id);
  }
}
async function pollRelayRoom(){
  if(!state.relayActive||!state.online||state.relayInFlight)return;
  state.relayInFlight=true;
  const events=state.relayEvents.splice(0,60);
  const payload={action:"update",room:state.room,password:state.roomPassword,player:relayPlayerPayload(),events};
  if(state.host)payload.enemies=relayEnemyPayload();
  try{
    const snap=await relayPost(payload);state.relayErrorStreak=0;processRelaySnapshot(snap);
  }catch(err){
    if(events.length)state.relayEvents.unshift(...events);
    state.relayErrorStreak=(state.relayErrorStreak||0)+1;captureError({type:"multiplayer-poll",message:String(err.message||err),status:err.status||0});
    if(!state.relayErrorNotified&&state.relayErrorStreak>=3){state.relayErrorNotified=true;toast("Conexão instável; tentando sincronizar novamente.");}
    if([403,404,410].includes(err.status)){state.relayActive=false;state.online=false;state.host=false;const status=$("roomStatus");if(status)status.textContent="Sala desconectada: "+err.message;updateHUD();}
  }finally{state.relayInFlight=false;}
}
async function leaveRelaySession(silent=false){
  const active=state.relayActive,room=state.room,password=state.roomPassword,id=state.peerId,host=state.host;
  state.relayActive=false;state.networkConnecting=false;state.online=false;state.host=false;state.peerId=null;state.room=null;state.roomPassword="";state.relayEvents=[];
  if(active&&room&&id){try{await relayPost({action:"leave",room,password,id})}catch(err){if(!silent)captureError({type:"multiplayer-leave",message:String(err.message||err)})}}
  updateHUD();
}
window.addEventListener("pagehide",()=>{
  if(!state.relayActive||!state.room||!state.peerId)return;
  try{fetch("/api/room-relay",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({action:"leave",room:state.room,password:state.roomPassword,id:state.peerId}),keepalive:true}).catch(()=>{})}catch{}
});
function createRoom(){
  state.host=true;const id=roomCode();state.room=id;state.peerId=id;state.peer=new Peer(id,{debug:0});
  state.peer.on("open",()=>{window.__SHOW_ROOM_CODE__?.(id);$("onlineText").textContent="HOST";toast("Sala "+id.toUpperCase()+" criada.")});
  state.peer.on("connection",setupConnection);state.peer.on("error",e=>state.errors.push({message:"PeerJS: "+e.message}))
}
function joinRoom(code){
  state.host=false;state.room=code;state.peer=new Peer({debug:0});
  state.peer.on("open",()=>{const c=state.peer.connect(code,{reliable:true});setupConnection(c);toast("Conectando à sala "+code.toUpperCase()+"...")});
  state.peer.on("error",e=>state.errors.push({message:"PeerJS: "+e.message}))
}
function setupConnection(conn){
  conn.on("open",()=>{state.connections.set(conn.peer,conn);conn.send({type:"hello",id:state.peer?.id,pos:[player.position.x,player.position.y,player.position.z],rot:player.rotation.y,mode:state.mode,color:Number(window.__GL_START__?.color)||0x4c8dff,grounded:state.grounded,vy:state.vy,walk:state.walk,character:{...(state.character||characterConfig)}});if(state.host)syncRoom(conn)});
  conn.on("data",onRoomData);conn.on("close",()=>{const r=state.remotePlayers.get(conn.peer);if(r)remoteG.remove(r.group);state.remotePlayers.delete(conn.peer);state.connections.delete(conn.peer)})
}
function syncRoom(conn){conn.send({type:"snapshot",players:[...state.remotePlayers.keys()],enemies:enemies.map(e=>({id:e.userData.id,hp:e.userData.hp,alive:e.userData.alive,pos:[e.position.x,e.position.y,e.position.z],name:e.userData.name,qIdx:e.userData.qIdx})),objects:placedObjects.map(o=>({id:o.userData.id,item:o.userData.figure.id,pos:[o.position.x,o.position.y,o.position.z]}))})}
function sendRoom(msg){
  if(state.relayActive||state.networkConnecting){state.relayEvents.push(msg);if(state.relayEvents.length>240)state.relayEvents.splice(0,state.relayEvents.length-240);return;}
  for(const c of state.connections.values())try{c.send(msg)}catch{}
}
function sendPosition(){if(state.relayActive){pollRelayRoom();return;}if(state.online&&state.peer)sendRoom({type:"pos",id:state.peer.id,pos:[player.position.x,player.position.y,player.position.z],rot:player.rotation.y,color:Number(window.__GL_START__?.color)||0x4c8dff,grounded:state.grounded,vy:state.vy,walk:state.walk,character:{...(state.character||characterConfig)}})}
function broadcastEnemy(e){if(state.relayActive)return;if(state.online)sendRoom({type:"enemy",id:e.userData.id,hp:e.userData.hp,alive:e.userData.alive})}
function clearRemoteVisual(visual){while(visual.children.length){const m=visual.children[visual.children.length-1];visual.remove(m);disposeCharacterNode(m)}delete visual.userData.characterAnimation;}
function updateRemoteCharacterAnimations(dt){
  const now=performance.now()*.001;
  for(const r of state.remotePlayers.values()){
    const pos=r.group.position;
    if(!r._lastAnimPos)r._lastAnimPos=pos.clone();
    const moved=pos.distanceTo(r._lastAnimPos)>.012;
    r._lastAnimPos.copy(pos);
    if(moved)r._animPhase=(r._animPhase||0)+dt*(r.outfit==="sonic"?12:8);
    if(r.visual?.userData?.characterAnimation)animateCharacterVisual(r.visual,r.outfit||"lab",moved,r.grounded!==false,r.remoteWalk||r._animPhase||0,now);
    else if(r.body){const home=r.body.userData.remoteRestY??r.body.position.y;r.body.userData.remoteRestY=home;r.body.position.y=home+(moved?Math.abs(Math.sin((r._animPhase||0)*2))*.035:0);}
  }
}
function applyRemoteAvatarAppearance(r,character={},color=0xa47cff){
  const outfit=String(character?.outfit||"lab");
  if(r.outfit===outfit){if(!SPECIAL_CHARACTER_OUTFITS.has(outfit)&&r.body?.material?.color)r.body.material.color.setHex(Number(color)||0xa47cff);return;}
  clearRemoteVisual(r.visual);
  if(outfit==="crewmate"){
    buildCrewmateModel(r.visual);r.body=r.visual.children[0]||null;
  }else if(outfit==="bomberman"){
    buildBombermanModel(r.visual);r.body=r.visual.children[0]||null;
  }else if(["mario","luigi","yoshi","toad","creeper","sonic","kirby","pacman","steve","pikachu"].includes(outfit)){
    buildClassicCharacterModel(outfit,r.visual);r.body=r.visual.userData.characterAnimation?.body||null;
  }else{
    r.body=add(r.visual,new THREE.CapsuleGeometry(.5,.82,5,10),OUTFIT_COLORS[outfit]||Number(color)||0xa47cff,new THREE.Vector3(0,1.2,0),{flat:true});
    add(r.visual,new THREE.SphereGeometry(.53,18,12),SKIN_COLORS[character?.skin]||0xffcdb9,new THREE.Vector3(0,2,0),{rough:.44});
    add(r.visual,new THREE.BoxGeometry(.62,.18,.5),0x0b213c,new THREE.Vector3(0,2.08,.42),{rough:.3,metal:.14});
  }
  r.outfit=outfit;r.color=Number(color)||0xa47cff;
}
function remoteAvatar(id){
  let r=state.remotePlayers.get(id);if(r)return r;
  const g=new THREE.Group(),visual=new THREE.Group();g.add(visual);
  const c=document.createElement("canvas");c.width=320;c.height=64;const ctx=c.getContext("2d");ctx.fillStyle="rgba(8,24,43,.82)";ctx.fillRect(4,4,312,56);ctx.fillStyle="#fff";ctx.font="bold 26px Arial";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("Player",160,32);
  const tex=new THREE.CanvasTexture(c);const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false}));sp.position.set(0,3.0,0);sp.scale.set(2.8,.56,1);g.add(sp);remoteG.add(g);r={group:g,visual,body:null,nameCanvas:c,nameSprite:sp,color:0xa47cff,name:"Player",outfit:null,_animPhase:0,_lastAnimPos:null};state.remotePlayers.set(id,r);applyRemoteAvatarAppearance(r,{},0xa47cff);return r
}
function onRoomData(conn,d){
  if(!d)return;
  if(d.type==="hello"){if(state.host)syncRoom(conn);const r=remoteAvatar(d.id);r.group.position.set(...d.pos);r.group.rotation.y=d.rot||0;r.grounded=d.grounded!==false;r.remoteVy=Number(d.vy)||0;r.remoteWalk=Number(d.walk)||0;applyRemoteAvatarAppearance(r,d.character,d.color)}
  if(d.type==="pos"){const r=remoteAvatar(d.id);r.group.position.lerp(new THREE.Vector3(...d.pos),.45);r.group.rotation.y=d.rot||0;r.grounded=d.grounded!==false;r.remoteVy=Number(d.vy)||0;r.remoteWalk=Number(d.walk)||r.remoteWalk||0;if(d.character)applyRemoteAvatarAppearance(r,d.character,d.color)}
  if(d.type==="enemy"){const e=enemies.find(x=>x.userData.id===d.id);if(e){e.userData.hp=d.hp;e.userData.alive=d.alive;e.visible=d.alive}}
  if(d.type==="place"&&state.host){addRemoteObject(d);sendRoom(d)}
  if(d.type==="remove"&&state.host){removeById(d.id);sendRoom(d)}
  if(d.type==="snapshot"){(d.enemies||[]).forEach(x=>{let e=enemies.find(y=>y.userData.id===x.id);if(!e)e=spawnEnemy(x.name,new THREE.Vector3(...x.pos),0x8b72ff,x.qIdx);e.userData.hp=x.hp;e.userData.alive=x.alive;e.visible=x.alive});(d.objects||[]).forEach(addRemoteObject)}
}
function addRemoteObject(d){
  const existing=placedObjects.find(o=>o.userData.id===d.id);
  if(existing){if(Array.isArray(d.pos))existing.position.set(...d.pos);if(Array.isArray(d.rot))existing.rotation.set(...d.rot);existing.userData.physics=d.physics!==false;existing.userData.frozen=d.physics===false;existing.userData.velocity ||= new THREE.Vector3();existing.userData.velocity.set(0,0,0);existing.userData.staticWorldBox=null;existing.updateWorldMatrix(true,false);return;}
  const it=FIGURES.find(f=>f.id===d.item)||INV.find(f=>f.id===d.item);if(!it)return;const color=INV.find(f=>f.id===d.item)?.color||0x777fff;const o=new THREE.Mesh(solidGeo(d.item),mat(color,.48,.05,false));o.position.set(...d.pos);if(d.rot)o.rotation.set(...d.rot);o.userData={id:d.id,figure:it,itemId:d.item,owner:d.owner||'remote',remote:true,velocity:new THREE.Vector3(),physics:d.physics!==false,frozen:d.physics===false};objectG.add(o);placedObjects.push(o)}
function removeById(id){const o=placedObjects.find(x=>x.userData.id===id);if(!o)return;const i=placedObjects.indexOf(o);if(i>=0)placedObjects.splice(i,1);objectG.remove(o);o.geometry?.dispose?.();if(Array.isArray(o.material))o.material.forEach(m=>m?.dispose?.());else o.material?.dispose?.()}

window.__SHOW_ROOM_CODE__=code=>{const status=document.getElementById("roomStatus");if(status)status.textContent="SALA CRIADA: "+String(code).toUpperCase()+" — compartilhe o código.";};

/* V59: start the playable HUD in compact mode; all panels stay expandable by their own button. */
function setHudPanelCompact(panelId,buttonId,collapsed=true,openLabel="Expandir painel",closeLabel="Minimizar painel"){
  const panel=$(panelId),button=$(buttonId);if(!panel||!button)return;
  panel.classList.toggle("collapsed",!!collapsed);
  button.textContent=collapsed?"＋":"−";
  button.setAttribute("aria-expanded",String(!collapsed));
  button.setAttribute("aria-label",collapsed?openLabel:closeLabel);
  button.title=collapsed?openLabel:closeLabel;
}
function collapseHudPanelsOnStart(){
  setHudPanelCompact("objectivePanel","objectiveToggle",true,"Expandir objetivo atual","Minimizar objetivo atual");
  setHudPanelCompact("missionTracker","missionTrackerToggle",true,"Expandir missões","Minimizar missões");
  setHudPanelCompact("activityHud","activityHudToggle",true,"Expandir atividades","Minimizar atividades");
  setHudPanelCompact("navigationGuide","navigationGuideToggle",true,"Expandir guia de navegação","Minimizar guia de navegação");
}

/* ---------- Start bridge ---------- */
window.addEventListener("geometria-lab-start",e=>{
  const d=e.detail||{};
  if(state.relayActive)leaveRelaySession(true);
  state.online=false;state.host=false;state.peer=null;state.peerId=null;state.relayActive=false;state.networkConnecting=false;state.room=null;state.roomPassword="";
  clearInterval(state.quizTimer);state.quizTimer=null;clearTimeout(state.quizCloseTimer);state.quizCloseTimer=null;state.quiz=null;state.quizAnswered=false;
  state.mode=d.mode||"combat";state.difficulty=d.difficulty||"easy";state.online=!!d.online;state.roomAction=d.roomAction||null;state.keys={};state.running=true;state.paused=false;window.__GL_START__=d;applyMap(d.mapMode||safeStorageRead("gl_map")||"new");state.character={...(d.character||characterConfig)};if(!state.character.name||/^(dimitri( xisto)?|xisto|jogador)$/i.test(String(state.character.name).trim()))state.character.name="Player";applyCharacterCustomization(state.character,d.color||0x4c8dff);
  $("modeLabel").textContent=state.mode==="sandbox"?"SANDBOX":state.mode==="learning"?"APRENDIZADO":"COMBATE";
  $("objective").textContent=state.mode==="combat"?"Encontre um Geo-Beast e pressione Q. Explore as ilhas e complete o parkour de plataformas.":state.mode==="learning"?"Estude figuras, encontre os 10 sólidos no labirinto e complete o parkour de plataformas.":"Construa, explore o labirinto e tente vencer o parkour de plataformas.";
  state.missionSession={kills:0,correct:0,resolved:0,studied:0,placed:0,unique:0,destroyed:0,found:0,parkour:0};state.missionCompleted=new Set();state.studiedFigures=new Set();state.builtFigures=new Set();
  explorationCollectibles.forEach(item=>{item.found=false;item.mesh.visible=true;item.halo.visible=true;});
  parkourState={active:false,next:0,startedAt:0,best:(Number(safeStorageRead("gl_parkour_best_v56"))||Infinity),checkpointPos:null,checkpointNext:0,completed:false,iceUntil:0};parkourCourse.forEach(item=>{item.root.visible=true;item.region.enabled=true;item.colliderDef.enabled=true;item.done=false;item.hiddenUntil=0;item.collapseTimer=0;item.bounceUsed=false;});
  const activityHud=$("activityHud");if(activityHud)activityHud.style.display=state.mapMode==="new"?"block":"none";
  if(state.mode==="combat")setupCombat();
  else{enemies.forEach(e=>{e.visible=false;e.userData.alive=false});}
  // Recalcula o spawn após reposicionar os inimigos do modo escolhido.
  movePlayerToSafeSpawn(state.mapMode);
  if(state.online)beginNetwork();setBuildUI(false);updateBuildPhysicsUI();formatControlsUI();collapseHudPanelsOnStart();updateHUD();renderMissionTracker();lockMouse();
});

/* ---------- Interaction ---------- */
window.addEventListener("keydown",e=>{
  if(state.rebindingAction){
    e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();
    if(e.code==="Escape"){state.rebindingAction=null;formatControlsUI();toast("Alteração cancelada.");return;}
    if(["MetaLeft","MetaRight","CapsLock","NumLock","ScrollLock","Unidentified","F3","F6","F7"].includes(e.code)){toast("Essa tecla é reservada pelo jogo. Escolha outra.");return;}
    const action=state.rebindingAction;
    const conflict=Object.entries(state.controls).find(([other,key])=>other!==action&&key===e.code);
    const previous=state.controls[action];
    if(conflict){
      // Permite trocar duas funções diretamente sem exigir uma tecla temporária.
      state.controls[conflict[0]]=previous;
      state.controls[action]=e.code;
      state.rebindingAction=null;state.keys={};persistControls();formatControlsUI();
      toast("Teclas trocadas: "+CONTROL_LABELS[action][0]+" ↔ "+CONTROL_LABELS[conflict[0]][0]);return;
    }
    state.controls[action]=e.code;state.rebindingAction=null;state.keys={};persistControls();formatControlsUI();toast(CONTROL_LABELS[action][0]+": "+keyName(e.code));return;
  }
  const target=e.target;
  const typing=target instanceof HTMLElement && (target.matches("input,textarea,select,[contenteditable='true']")||target.isContentEditable);
  if(typing&&e.code!=="Escape")return;
  // Evita rolagem/atalhos do navegador quando uma tecla está sendo usada pelo jogo.
  if(Object.values(state.controls).includes(e.code))e.preventDefault();
  const code=canonicalControlCode(e.code);
  if(e.repeat&&["Tab","KeyB","KeyP","KeyV","KeyQ","KeyE","Delete","KeyX","KeyT"].includes(code))return;
  state.keys[code]=true;
  if(e.code==="Escape"){
    if(!$("quiz").classList.contains("hidden")){closeQuiz();return;}
    const visible=id=>$(id)&&!$(id).classList.contains("hidden");
    if(visible("controlsModal")){closeControlsSettings();return;}
    if(visible("palette")){ $("palette").classList.add("hidden");state.paused=false;lockMouse();return; }
    if(visible("catalog")||visible("lesson")||visible("web")||visible("debug")||visible("characterModal")||visible("geometryHub")){closeModals();openMenu();return;}
    if(visible("missions")){closeMissions();return;}
    visible("menu")?closeMenu():openMenu();return;
  }
  if(code==="Tab"&&state.running){e.preventDefault();$("inventory").classList.toggle("hidden");return;}
  if(e.code==="F3"&&state.running){e.preventDefault();$("perfPanel")?.classList.toggle("hidden");return;}
  if(e.code==="F6"&&state.running&&!typing){e.preventDefault();startFormHunt();return;}
  if(e.code==="F7"&&state.running&&!typing){e.preventDefault();startParkourRun();return;}
  if(/^Digit[1-8]$/.test(e.code)&&state.running&&!typing)selectItem(Number(e.code.slice(-1))-1);
  if(code==="KeyQ"&&!state.paused&&state.mode==="combat"){const t=targetEnemy();if(t)startQuiz(t);else toast("Aproxime-se de um Geo-Beast.");}
  if(code==="KeyE"&&!state.paused&&state.mode==="learning")inspectNearby();
  if(code==="KeyB"&&!state.paused)toggleBuild();
  if(code==="KeyG"&&!state.paused)grabOrDropObject();
  if(code==="KeyF"&&!state.paused&&!state.build&&state.grabbedObject){const o=state.grabbedObject;state.grabbedObject=null;o.userData.frozen=true;o.userData.physics=false;o.userData.velocity?.set(0,0,0);o.userData.staticWorldBox=null;toast("🧊 Objeto congelado. Mire nele e pressione G para pegar; depois F para liberar a física.");}
  if(code==="KeyP"&&!state.paused)openPalette();
  if(code==="KeyT"&&!state.paused&&state.mode==="sandbox")toggleBuildPhysics();
  if(code==="KeyV"&&!state.paused){const modes=["first","third","top","iso","side","fixed"];setCameraMode(modes[(modes.indexOf(state.cameraMode)+1)%modes.length]);}
  if(state.build&&code==="KeyR")preview.rotation.y+=Math.PI/8;
  if(state.build&&code==="KeyF")preview.rotation.x+=Math.PI/8;
  if(state.build&&(code==="KeyX"||code==="Delete"))removeObject();
},true);
window.addEventListener("keyup",e=>{state.keys[canonicalControlCode(e.code)]=false});
function clearHeldInput(){state.keys={};if(state.moveVelocity)state.moveVelocity.set(0,0,0)}
window.addEventListener("blur",clearHeldInput);
document.addEventListener("visibilitychange",()=>{if(document.hidden)clearHeldInput()});
window.addEventListener("mousedown",e=>{
  if(state.paused)return;
  if(state.mode==="combat"&&e.button===0){const t=targetEnemy();if(t){startQuiz(t);return}}
  if(state.grabbedObject&&e.button===0){dropGrabbedObject(true);return;}
  if(state.build&&e.button===0)placeObject();
  if(state.build&&e.button===2)removeObject();
});
renderer.domElement.addEventListener("contextmenu",e=>{if(state.build)e.preventDefault()});

function inspectNearby(){let b=null,bd=5;for(const s of objectG.children){if(!s.userData.figure)continue;const d=s.position.distanceTo(player.position);if(d<bd){bd=d;b=s}}if(!b){toast("Aproxime-se de um sólido.");return}showFigure(b.userData.figure);$("catalog").classList.remove("hidden");state.paused=true;unlockMouse()}

/* ---------- Current Game UI bridge ---------- */
function missionDefs(){
  if(state.mode==="combat")return [{key:"hunter",title:"CAÇADOR",desc:"Derrote 4 Geo-Beasts",value:state.missionSession.kills,max:4,xp:200},{key:"aim",title:"MIRA MATEMÁTICA",desc:"Acerte 3 ataques",value:state.missionSession.correct,max:3,xp:150},{key:"veteran",title:"VETERANO",desc:"Resolva 5 questões",value:state.missionSession.resolved,max:5,xp:250},{key:"explorer",title:"EXPLORADOR",desc:"Encontre 5 formas no parque",value:state.missionSession.found,max:5,xp:200},{key:"parkour",title:"CORREDOR GEOMÉTRICO",desc:"Conclua o parkour de plataformas",value:state.missionSession.parkour,max:1,xp:0}];
  if(state.mode==="learning")return [{key:"researcher",title:"PESQUISADOR",desc:"Estude 3 figuras diferentes",value:state.missionSession.studied,max:3,xp:150},{key:"calculator",title:"CALCULISTA",desc:"Acerte 3 questões",value:state.missionSession.correct,max:3,xp:150},{key:"training",title:"TREINAMENTO",desc:"Resolva 5 questões",value:state.missionSession.resolved,max:5,xp:250},{key:"explorer",title:"EXPLORADOR",desc:"Encontre 5 formas no parque",value:state.missionSession.found,max:5,xp:200},{key:"parkour",title:"CORREDOR GEOMÉTRICO",desc:"Conclua o parkour de plataformas",value:state.missionSession.parkour,max:1,xp:0}];
  return [{key:"engineer",title:"ENGENHEIRO",desc:"Coloque 5 construções",value:state.missionSession.placed,max:5,xp:150},{key:"geometer",title:"GEÔMETRA",desc:"Use 3 figuras diferentes",value:state.missionSession.unique,max:3,xp:150},{key:"organizer",title:"ORGANIZAÇÃO",desc:"Destrua 3 construções",value:state.missionSession.destroyed,max:3,xp:200},{key:"explorer",title:"EXPLORADOR",desc:"Encontre 5 formas no parque",value:state.missionSession.found,max:5,xp:200},{key:"parkour",title:"CORREDOR GEOMÉTRICO",desc:"Conclua o parkour de plataformas",value:state.missionSession.parkour,max:1,xp:0}];
}
function checkMissions(){
  for(const m of missionDefs())if(m.value>=m.max&&!state.missionCompleted.has(m.key)){state.missionCompleted.add(m.key);if(m.xp>0){awardXP(m.xp,"Missão concluída");toast(`🏆 MISSÃO CONCLUÍDA: ${m.title} +${m.xp} XP`)}else toast(`🏆 MISSÃO CONCLUÍDA: ${m.title}`)}
  renderMissionModal();renderMissionTracker();
}
function renderMissionTracker(){
  const box=$("missionTrackerList");if(!box)return;const defs=missionDefs();$("missionTrackerMode")&&($("missionTrackerMode").textContent=state.mode.toUpperCase());box.innerHTML=defs.map(m=>{const v=Math.min(m.value,m.max),pct=Math.min(100,v/m.max*100),done=v>=m.max;return `<div class="mission-line ${done?"complete":""}"><span class="m-dot"></span><div><b>${done?"✓ ":""}${m.title}</b><small>${m.desc} · ${v}/${m.max}</small><div class="m-mini-progress"><i style="width:${pct}%"></i></div></div></div>`}).join("");
}
function renderMissionModal(){
  const box=$("missionModalList");if(!box)return;box.innerHTML=missionDefs().map(m=>{const v=Math.min(m.value,m.max),pct=Math.min(100,v/m.max*100),done=v>=m.max;return `<article class="mission-modal-card ${done?"complete":""}"><div class="badge">${done?"✓":"★"}</div><div><b>${m.title}</b><p>${m.desc}</p><div class="m-progress"><i style="width:${pct}%"></i></div></div><div><small>${v} / ${m.max}</small>${done?"<em>CONCLUÍDA</em>":""}</div></article>`}).join("");renderMissionTracker();
}
function openMissions(){state.paused=true;unlockMouse();renderMissionModal();$("missions")?.classList.remove("hidden")}
function closeMissions(){$("missions")?.classList.add("hidden");state.paused=false;lockMouse()}
function toggleMissionTracker(){const el=$("missionTracker");if(!el)return;const collapsed=el.classList.toggle("collapsed");const b=$("missionTrackerToggle");if(b){b.textContent=collapsed?"＋":"−";b.setAttribute("aria-expanded",String(!collapsed));b.setAttribute("aria-label",collapsed?"Expandir missões":"Minimizar missões");b.title=collapsed?"Expandir missões":"Minimizar missões";}}
function updateEditorPresetCards(){document.querySelectorAll("[data-edit-preset]").forEach(b=>b.classList.toggle("active",b.dataset.editPreset===($("editOutfit")?.value||"")))}
function openCharacterEditor(){state.paused=true;unlockMouse();const c=characterConfig;[ ["editPlayerName",c.name],["editOutfit",c.outfit],["editHead",c.head],["editBody",c.body],["editSkin",c.skin],["editHair",c.hair],["editHairColor",c.hairColor],["editFace",c.face],["editBack",c.back] ].forEach(([id,v])=>{if($(id))$(id).value=v});updateEditorPresetCards();$("characterModal")?.classList.remove("hidden")}
function saveCharacterEditor(){const chosenName=($("editPlayerName")?.value||"Player").trim().slice(0,14);const c={name:(!chosenName||/^(dimitri( xisto)?|xisto|jogador)$/i.test(chosenName)?"Player":chosenName),outfit:$("editOutfit")?.value||"lab",head:$("editHead")?.value||"none",body:$("editBody")?.value||"normal",skin:$("editSkin")?.value||"light",hair:$("editHair")?.value||"none",hairColor:$("editHairColor")?.value||"black",face:$("editFace")?.value||"none",back:$("editBack")?.value||"none"};applyCharacterCustomization(c,window.__GL_START__?.color||0x4c8dff);state.character={...c};if(window.__GL_START__)window.__GL_START__.character={...c};safeStorageWrite("gl_character",JSON.stringify(c));if($("startCharacterName"))$("startCharacterName").textContent=c.name;$("characterModal")?.classList.add("hidden");state.paused=false;lockMouse();toast("👤 Personagem salvo.");}

function toggleChallengePanel(){const el=$("activityHud");if(!el)return;const collapsed=el.classList.toggle("collapsed");const b=$("activityHudToggle");if(b){b.textContent=collapsed?"＋":"−";b.setAttribute("aria-expanded",String(!collapsed));b.setAttribute("aria-label",collapsed?"Expandir atividades":"Minimizar atividades");b.title=collapsed?"Expandir atividades":"Minimizar atividades";}}
function toggleNavigationGuide(){const el=$("navigationGuide");if(!el)return;const collapsed=el.classList.toggle("collapsed");const b=$("navigationGuideToggle");if(b){b.textContent=collapsed?"＋":"−";b.setAttribute("aria-expanded",String(!collapsed));b.setAttribute("aria-label",collapsed?"Expandir guia de navegação":"Minimizar guia de navegação");b.title=collapsed?"Expandir guia":"Minimizar guia";}}
function toggleObjectivePanel(){const el=$("objectivePanel");if(!el)return;const collapsed=el.classList.toggle("collapsed");const b=$("objectiveToggle");if(b){b.textContent=collapsed?"＋":"−";b.setAttribute("aria-expanded",String(!collapsed));b.setAttribute("aria-label",collapsed?"Expandir objetivo atual":"Minimizar objetivo atual");b.title=collapsed?"Expandir objetivo":"Minimizar objetivo";}}

function wireCurrentUI(){
  $("quizClose")?.addEventListener("click",closeQuiz);
  $("missionsBtn")?.addEventListener("click",openMissions);$("missionTrackerToggle")?.addEventListener("click",toggleMissionTracker);$("menuMissions")?.addEventListener("click",()=>{$("menu")?.classList.add("hidden");openMissions()});$("missionsClose")?.addEventListener("click",closeMissions);
  $("navigationGuideToggle")?.addEventListener("click",toggleNavigationGuide);$("objectiveToggle")?.addEventListener("click",toggleObjectivePanel);
  $("activityHudToggle")?.addEventListener("click",toggleChallengePanel);$("startParkourBtn")?.addEventListener("click",startParkourRun);$("startFormHuntBtn")?.addEventListener("click",startFormHunt);
  $("customizeBtn")?.addEventListener("click",()=>{$("menu")?.classList.add("hidden");openCharacterEditor()});document.querySelectorAll("[data-edit-preset]").forEach(b=>b.addEventListener("click",()=>{if($("editOutfit"))$("editOutfit").value=b.dataset.editPreset;updateEditorPresetCards()}));$("editOutfit")?.addEventListener("change",updateEditorPresetCards);$("controlsSettings")?.addEventListener("click",openControlsSettings);$("closeControls")?.addEventListener("click",closeControlsSettings);$("resetControls")?.addEventListener("click",()=>{state.controls={...CONTROL_DEFAULTS};state.rebindingAction=null;persistControls();formatControlsUI();toast("Controles padrão restaurados.")});$("inventoryCatalogBtn")?.addEventListener("click",()=>{if(state.mode==="sandbox"&&!state.build)toggleBuild();openPalette()});$("quickPhysicsBtn")?.addEventListener("click",toggleBuildPhysics);$("buildPhysicsBtn")?.addEventListener("click",toggleBuildPhysics);$("saveCharacter")?.addEventListener("click",saveCharacterEditor);$("closeCharacter")?.addEventListener("click",()=>{$("characterModal")?.classList.add("hidden");openMenu()});
  $("cameraMode")?.addEventListener("change",e=>setCameraMode(e.target.value));$("cycleCamera")?.addEventListener("click",()=>{const ms=["first","third","top","iso","side","fixed"];setCameraMode(ms[(ms.indexOf(state.cameraMode)+1)%ms.length])});document.querySelectorAll("[data-camera]").forEach(b=>b.addEventListener("click",()=>{setCameraMode(b.dataset.camera)}));
  $("quickBuildBtn")?.addEventListener("click",()=>{if(!state.build)toggleBuild();openPalette()});$("clearBuildsBtn")?.addEventListener("click",clearMyBuilds);$("buildCatalogBtn")?.addEventListener("click",openPalette);$("buildPlaceBtn")?.addEventListener("click",placeObject);$("buildExitBtn")?.addEventListener("click",()=>{state.build=false;setBuildUI(false);preview.visible=false;toast("Construção desligada.")});$("buildClearBtn")?.addEventListener("click",clearMyBuilds);
  updateCameraUI();renderMissionModal();updateBuildPhysicsUI();selectItem(state.selected||0);
}

/* ---------- Exploração e parkour ---------- */
function updateParkourMovingPlatforms(dt){
  if(state.mapMode!=='new'||!state.running||state.paused)return;
  const t=performance.now()*.001;
  for(const item of parkourCourse){
    if(item.kind!=='moving'||!item.root.visible)continue;
    const oldX=item.x,oldZ=item.z;
    const standing=state.grounded&&Math.abs(player.position.y-item.topY)<.28&&Math.abs(player.position.x-oldX)<=item.w*.50&&Math.abs(player.position.z-oldZ)<=item.d*.50;
    const phase=Math.sin(t*(item.moveSpeed||.8)+(item.movePhase||0))*(item.moveAmplitude||1.0);
    const nx=(item.baseX??oldX)+(item.moveAxis==='z'?0:phase);
    const nz=(item.baseZ??oldZ)+(item.moveAxis==='z'?phase:0);
    item.root.position.set(nx,0,nz);item.x=nx;item.z=nz;
    item.region.x=nx;item.region.z=nz;glUpdateMovingFloorRegion(item.region);
    Object.assign(item.colliderDef,{minX:nx-item.w/2+.02,maxX:nx+item.w/2-.02,minZ:nz-item.d/2+.02,maxZ:nz+item.d/2-.02});
    const runtimeCollider=item.colliderDef._glRuntimeCollider;
    if(runtimeCollider){runtimeCollider.minX=item.colliderDef.minX;runtimeCollider.maxX=item.colliderDef.maxX;runtimeCollider.minZ=item.colliderDef.minZ;runtimeCollider.maxZ=item.colliderDef.maxZ;glUpdateGridEntry(glColliderGrid,runtimeCollider,"_glSpatialKeys",runtimeCollider);}
    if(standing){player.position.x+=nx-oldX;player.position.z+=nz-oldZ;}
  }
}

function updateIslandActivities(dt){
  if(state.paused||state.quiz||state.mapMode!=="new"||!state.running)return;
  const now=performance.now(),seconds=now*.001,px=player.position.x,pz=player.position.z;
  // Pickups float, rotate, give XP once per item and keep their own progress separate from the maze's forms.
  for(const item of islandPickups){
    if(item.found)continue;
    item.mesh.rotation.y+=dt*(item.kind==='desert-coin'?2.3:1.05);
    item.mesh.position.y=item.baseY+Math.sin(seconds*2.0+item.phase)*.16;
    item.halo.rotation.z+=dt*.45;
    if(Math.hypot(px-item.x,pz-item.z)<1.55&&Math.abs(player.position.y)<3.0){
      item.found=true;item.mesh.visible=false;item.halo.visible=false;
      burst(new THREE.Vector3(item.x,1.4,item.z),item.mesh.material.color,16);
      const firstClaim=claimFormRewardOnce('gl_v64_'+item.name.toLowerCase().replace(/[^a-z0-9]+/g,'_'));
      if(firstClaim)awardXP(item.xp,item.name);
      const typeItems=islandPickups.filter(v=>v.kind===item.kind),found=typeItems.filter(v=>v.found).length;
      const title=item.kind==='snow-crystal'?'Cristais de neve':item.kind==='magma'?'Fragmentos de magma':item.kind==='desert-coin'?'Moedas do deserto':'Runas antigas';
      toast((firstClaim?'✨ ':'✅ ')+title+': '+found+'/'+typeItems.length+(firstClaim?' · +'+item.xp+' XP':' · recompensa já obtida'));
      if(found===typeItems.length&&item.kind!=='ruin-rune'){
        const setBonus={'snow-crystal':60,magma:80,'desert-coin':75}[item.kind]||0;
        const setKey='gl_v64_set_complete_'+item.kind;
        if(setBonus&&claimFormRewardOnce(setKey)){awardXP(setBonus,'Conjunto completo: '+title);toast('🏆 '+title+' completos! Bônus de coleção: +'+setBonus+' XP.');}
      }
      if(item.kind==='ruin-rune'){
        ruinsRuneCount++;
        if(ruinsRuneCount>=3&&ruinsTreasure&&!ruinsTreasure.unlocked){
          ruinsTreasure.unlocked=true;ruinsTreasure.orb.visible=true;ruinsTreasure.halo.visible=true;ruinsTreasure.lid.rotation.x=-.88;
          toast('🔮 As três runas ressoam! O baú das Ruínas foi aberto.');
        }
      }
    }
  }
  // Ice patches briefly increase slide, so the snow region changes how jumps and stops feel.
  for(const patch of islandIcePatches){
    patch.mesh.material.emissiveIntensity=.15+Math.sin(seconds*2.4)*.10;
    if(Math.hypot(px-patch.x,pz-patch.z)<patch.r&&now>patch.cooldownUntil&&state.grounded){
      patch.cooldownUntil=now+2100;parkourState.iceUntil=now+1450;state.moveVelocity?.multiplyScalar(1.42);
      toast('🧊 Gelo escorregadio! Faça curvas com cuidado.');
    }
  }
  // Timed lava/sand vents visually charge before firing; entering an active vent is risky or launches you.
  for(const vent of islandHazards){
    const phase=(seconds+vent.phase)%vent.period,active=phase<vent.activeFor;
    vent.beam.visible=active;vent.pool.material.opacity=active?.92:.46;
    vent.pool.material.emissiveIntensity=active?.8:.24;vent.ring.material.emissiveIntensity=active?.95:.32;
    vent.label.material.emissiveIntensity=active?.9:.35;
    vent.beam.scale.y=active?1:.015;vent.beam.position.y=active?2.72:.57;
    if(active&&Math.hypot(px-vent.x,pz-vent.z)<vent.radius&&now>vent.cooldownUntil){
      vent.cooldownUntil=now+1800;burst(new THREE.Vector3(vent.x,1.1,vent.z),vent.pool.material.color,20);
      if(state.mode==='combat')damagePlayer(9,vent.name);
      else{state.vy=6.6;state.grounded=false;state.moveVelocity?.multiplyScalar(1.22);toast('💨 '+vent.name+'! O jato lançou você para cima.');}
    }
  }
  // Arena circuit: touch start, then east, south, west, and return to start before the timer expires.
  const gates=islandRace.gates||[];
  if(gates.length===4&&now>islandRace.cooldownUntil){
    const closeTo=i=>Math.hypot(px-gates[i].x,pz-gates[i].z)<2.05&&Math.abs(player.position.y)<3.2;
    for(let i=0;i<gates.length;i++){
      gates[i].gate.material.emissiveIntensity=(islandRace.active&&i===islandRace.nextGate)?.95:.30+Math.sin(seconds*2+i)*.10;
      gates[i].orb.position.y=3.55+Math.sin(seconds*2.8+i)*.17;
    }
    if(!islandRace.active&&closeTo(0)){
      islandRace.active=true;islandRace.nextGate=1;islandRace.startedAt=now;
      toast('🏁 Circuito iniciado! Passe pelos portais na ordem: dourado, verde, violeta e volte ao azul.');
    }else if(islandRace.active&&closeTo(islandRace.nextGate)){
      const passed=islandRace.nextGate;
      if(passed===0){
        const duration=(now-islandRace.startedAt)/1000;islandRace.active=false;islandRace.cooldownUntil=now+2600;
        islandRace.best=Math.min(islandRace.best,duration);safeStorageWrite('gl_v64_island_race_best',String(islandRace.best));
        const today=new Date(),day=today.getFullYear()+'-'+String(today.getMonth()+1).padStart(2,'0')+'-'+String(today.getDate()).padStart(2,'0'),key='gl_v64_island_race_reward_'+day;
        if(safeStorageRead(key)!=='done'){awardXP(60,'Circuito das Ilhas concluído');safeStorageWrite(key,'done');}
        toast('🏆 Circuito concluído em '+duration.toFixed(1)+' s! Recorde: '+islandRace.best.toFixed(1)+' s.');
      }else{
        islandRace.nextGate=passed===3?0:passed+1;
        toast('🏁 Portal '+passed+'/3 concluído. Siga o próximo brilho!');
      }
    }
  }
  // Once all runes are found, touch the revealed treasure to claim its one-time bonus.
  if(ruinsTreasure?.unlocked&&!ruinsTreasure.claimed){
    ruinsTreasure.orb.rotation.y+=dt*1.25;ruinsTreasure.orb.position.y=2.05+Math.sin(seconds*2.7)*.2;ruinsTreasure.halo.rotation.z+=dt*.65;
    if(Math.hypot(px-ruinsTreasure.x,pz-ruinsTreasure.z)<2.1){
      ruinsTreasure.claimed=true;ruinsTreasure.orb.visible=false;ruinsTreasure.halo.visible=false;
      const firstClaim=claimFormRewardOnce('gl_v64_ruins_treasure_chest');
      if(firstClaim){awardXP(120,'Tesouro das Ruínas');toast('💎 Tesouro encontrado! +120 XP.');}
      else toast('💎 O tesouro já foi resgatado neste perfil.');
    }
  }
}

function updateExplorationActivities(dt){
  if(state.paused||state.quiz||state.mapMode!=="new"||!state.running)return;
  const px=player.position.x,pz=player.position.z;
  const foundCount=explorationCollectibles.filter(v=>v.found).length;
  if($("formsFoundCount"))$("formsFoundCount").textContent=foundCount+" / "+explorationCollectibles.length;
  if($("formsFoundBar"))$("formsFoundBar").style.width=(foundCount/Math.max(1,explorationCollectibles.length)*100)+"%";
  if($("parkourStatus")){
    const target=parkourCourse[parkourState.next];
    if(parkourState.completed)$("parkourStatus").textContent="🏆 Parkour concluído! Voltando ao lobby...";
    else if(parkourState.active)$("parkourStatus").textContent=`🏁 Parkour ${Math.min(parkourState.next+1,parkourCourse.length)}/${parkourCourse.length} · ${target?.kind==='ice'?'piso de gelo':target?.kind==='slime'?'salto no slime':target?.kind==='crumble'?'piso instável':target?.kind==='moving'?'plataforma móvel':target?.kind==='hurdle'?'salte a barreira':'próxima plataforma'}`;
    else $("parkourStatus").textContent="🏁 Parkour: início na ilha ciano · aperte F7 ou use o botão abaixo.";
  }
  for(const item of explorationCollectibles){
    if(item.found)continue;
    item.mesh.rotation.y+=dt*.85;item.mesh.position.y=1.45+Math.sin(performance.now()*.0018+item.phase)*.13;
    item.halo.rotation.z+=dt*.55;
    if(Math.hypot(px-item.x,pz-item.z)<1.65){
      item.found=true;item.mesh.visible=false;item.halo.visible=false;
      burst(new THREE.Vector3(item.x,1.5,item.z),item.mesh.material.color,18);
      const firstClaim=claimFormRewardOnce(item.name);
      if(firstClaim)awardXP(35,"Forma encontrada: "+item.name);
      toast(firstClaim?"🔷 Forma encontrada: "+item.name+" · +35 XP":"🔷 Forma reencontrada: "+item.name+" · recompensa de XP já recebida");
      state.missionSession.found=explorationCollectibles.filter(v=>v.found).length;checkMissions();
      safeStorageWrite("gl_forms_found_v56",String(explorationCollectibles.filter(v=>v.found).length));
    }
  }
  const now=performance.now();
  // Restore collapsing blocks after a short recovery interval; their collision source is shared by the active map.
  for(const item of parkourCourse){
    if(item.kind==='crumble'&&item.hiddenUntil&&now>=item.hiddenUntil){
      item.root.visible=true;item.region.enabled=true;item.colliderDef.enabled=true;item.hiddenUntil=0;item.collapseTimer=0;
      item.top.material.emissiveIntensity=.22;
    }
  }
  if(!parkourCourse.length||!parkourState.active)return;
  const target=parkourCourse[parkourState.next];
  if(!target){finishParkour();return;}
  const onTarget=Math.abs(px-target.x)<=target.w*.43&&Math.abs(pz-target.z)<=target.d*.43&&state.grounded&&player.position.y>=target.topY-.22&&(target.kind!=='hurdle'||pz>target.z+.30);
  if(onTarget&&!target.done&&target.root.visible){
    target.done=true;target.top.material.emissiveIntensity=.65;
    burst(new THREE.Vector3(target.x,target.topY+.4,target.z),target.top.material.color,13);
    parkourState.next++;
    if(target.checkpoint){
      parkourState.checkpointPos=new THREE.Vector3(target.x,target.topY,target.z);parkourState.checkpointNext=parkourState.next;
      toast("🚩 Checkpoint salvo! Próximo trecho liberado.");
    }else if(target.kind==='slime'){
      // A slime-like pad gives a strong upward impulse, like a bounce block in Minecraft.
      state.vy=10.6;state.grounded=false;target.bounceUsed=true;
      toast("🟢 SLIME! Impulso ativado — alcance a plataforma seguinte.");
    }else if(target.kind==='ice'){
      state.moveVelocity?.multiplyScalar(1.25);parkourState.iceUntil=now+2800;
      toast("🧊 Gelo! Você ganha velocidade, mas precisa frear com cuidado.");
    }else if(target.kind==='crumble'){
      target.collapseTimer=now+750;
      toast("⚠️ O piso está cedendo! Pule para a próxima plataforma.");
    }
    if(target.kind==='crumble'){
      target.hiddenUntil=now+2700;
      setTimeout(()=>{
        if(!parkourState.active||target.done===false)return;
        target.root.visible=false;target.region.enabled=false;target.colliderDef.enabled=false;
      },750);
    }
    if(target.finish||parkourState.next>=parkourCourse.length){finishParkour();return;}
    if(!target.checkpoint&&target.kind!=='slime'&&target.kind!=='ice'&&target.kind!=='crumble')toast("✅ Plataforma "+parkourState.next+"/"+parkourCourse.length+"! Próximo salto destacado.");
  }
  // Subtle pulsing marks the next platform, without turning this into a ring-collection minigame.
  for(let i=0;i<parkourCourse.length;i++){
    const p=parkourCourse[i];if(!p.root.visible)continue;
    const active=i===parkourState.next;
    p.top.material.emissiveIntensity=active?.58:(p.done?.26:(p.kind==='slime'?.35:.08));
    if(p.guideRing){p.guideRing.material.emissiveIntensity=active?1.05:(p.done?.12:.34);p.guideRing.scale.setScalar(active?1+.07*Math.sin(now*.006):1);}
    if(p.kind==='crumble'&&!p.hiddenUntil){
      p.top.material.emissiveIntensity=.18+Math.sin(now*.009)*.10;
    }
  }
}

/* ---------- Frame ---------- */
function updateHUD(){
  const hpBar=$("hpBar"),hpText=$("hpText"),killsText=$("killsText"),onlineText=$("onlineText");
  if(hpBar)hpBar.style.width=Math.max(0,state.hp)+"%";if(hpText)hpText.textContent=Math.round(state.hp);if(killsText)killsText.textContent=state.kills;
  if(onlineText)onlineText.textContent=!state.online?"SOLO":state.networkConnecting?"CONECTANDO":(state.host?"HOST":"ONLINE");refreshProgressionUI();
  const defs=missionDefs(),primary=defs[0];$("objective").textContent=primary?primary.title+" — "+primary.desc:"";$("objectiveProgress").style.width=primary?Math.min(100,primary.value/primary.max*100)+"%":"0%";
  renderMissionTracker();renderMissionModal();
}
function damageFlash(){const f=document.createElement("div");f.style.cssText="position:fixed;inset:0;background:rgba(255,28,73,.24);z-index:9999;pointer-events:none";document.body.appendChild(f);setTimeout(()=>f.remove(),150)}
function damagePlayer(amount,source="Geo-Beast"){
  if(state.mode!=="combat"||!Number.isFinite(amount)||amount<=0)return;
  state.hp=Math.max(0,state.hp-amount);
  damageFlash();
  if(state.hp<=0){
    state.hp=100;state.vy=0;state.grounded=true;
    movePlayerToSafeSpawn(state.mapMode);
    toast("Você foi derrotado por "+source+". Retorno à área segura com vida cheia.");
  }else if(state.damageToastCooldown<=0){
    toast(source+" atacou! −"+amount+" de vida.");state.damageToastCooldown=1.1;
  }
  updateHUD();
}
const MAX_PARTICLES=260;
// Reuse particle geometry and per-color materials. This is a gameplay-side allocation
// optimization only: renderer settings, textures and scene materials remain unchanged.
const sharedParticleGeometry=new THREE.SphereGeometry(.06,7,6);
const sharedParticleMaterials=new Map();
function particleMaterial(color){
  const key=color?.isColor?color.getHex():typeof color==='string'?color:Number(color)||0xffffff;
  let m=sharedParticleMaterials.get(key);if(!m){m=new THREE.MeshBasicMaterial({color:key});sharedParticleMaterials.set(key,m);}return m;
}
function disposeParticle(p){world.remove(p);if(p.userData?.pooled)return;p.geometry?.dispose?.();if(Array.isArray(p.material))p.material.forEach(m=>m?.dispose?.());else p.material?.dispose?.()}
function burst(pos,color,count=18){
  const allowed=Math.min(count,MAX_PARTICLES);
  while(particles.length+allowed>MAX_PARTICLES){const old=particles.shift();if(old)disposeParticle(old)}
  const material=particleMaterial(color);
  for(let i=0;i<allowed;i++){const p=new THREE.Mesh(sharedParticleGeometry,material);p.position.copy(pos);p.userData.life=.45+Math.random()*.5;p.userData.v=new THREE.Vector3((Math.random()-.5)*5,Math.random()*5,(Math.random()-.5)*5);p.userData.pooled=true;world.add(p);particles.push(p)}
}
wireCurrentUI();
refreshProgressionUI();
let last=performance.now(),perfFrames=0,perfElapsed=0,lastPerfPaint=0,lastHudPaint=0;
let perfAliveEnemies=0;
function loop(now){
  requestAnimationFrame(loop);
  // A hidden browser tab and the start screen do not need a full 3D simulation/render pass.
  if(document.hidden||!state.running){last=now;return;}
  const dt=Math.min(.033,Math.max(0,(now-last)/1000));last=now;
  state.damageToastCooldown=Math.max(0,state.damageToastCooldown-dt);
  // Pause freezes physics, enemies, platforms and particles; only room networking and the static scene remain.
  if(!state.paused){
    updateParkourMovingPlatforms(dt);
    movePlayer(dt);
    updateCharacterAnimation(dt);
    updateRemoteCharacterAnimations(dt);
    updateMazePressurePlate(dt);
    moveEnemies(dt);
    updateBuiltObjectPhysics(dt);
    updateGrabbedObject();
    updatePreview();
    updateCamera(dt);
    updateExplorationActivities(dt);
    updateIslandActivities(dt);
    for(let i=particles.length-1;i>=0;i--){
      const p=particles[i];p.userData.life-=dt;p.userData.v.y-=8*dt;p.position.addScaledVector(p.userData.v,dt);
      if(p.userData.life<=0){particles.splice(i,1);disposeParticle(p)}
    }
  }
  // HUD labels and region calculations are updated at 10 Hz instead of every rendered frame.
  if(now-lastHudPaint>=100){updateTargetHUD();updateMapZones();lastHudPaint=now;}
  if(state.online){state.netAccumulator+=dt;const interval=state.relayActive?.22:.12;if(state.netAccumulator>interval){if(state.relayActive)pollRelayRoom();else sendPosition();state.netAccumulator=0}}
  if(state.relayActive&&state.host&&state.mode==="combat"&&!state.paused&&!state.quiz){
    state.waveCheckCooldown=Math.max(0,(state.waveCheckCooldown||0)-dt);
    if(state.waveCheckCooldown<=0&&enemies.length&&enemies.every(e=>!e.userData.alive))spawnWave();
  }
  perfFrames++;perfElapsed+=dt;
  if(now-lastPerfPaint>500){
    const panel=$("perfPanel");
    if(panel&&!panel.classList.contains("hidden")){
      const fps=perfElapsed>0?Math.round(perfFrames/perfElapsed):0;
      const put=(id,v)=>{const el=$(id);if(el)el.textContent=String(v)};
      put("perfFps",fps);put("perfBuilds",placedObjects.length);
      if(!perfAliveEnemies||now-lastPerfPaint>1000)perfAliveEnemies=enemies.reduce((n,e)=>n+(e.userData.alive?1:0),0);
      put("perfEnemies",perfAliveEnemies);put("perfMode",state.mapMode==="new"?"CIDADE":"CLÁSSICO");
    }
    perfFrames=0;perfElapsed=0;lastPerfPaint=now;
  }
  renderer.render(scene,camera)
}
window.addEventListener("visibilitychange",()=>{state.keys={};last=performance.now();});
requestAnimationFrame(loop);
window.addEventListener("resize",()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)});
renderCatalog();
updateHUD();

  window.__GL_ENGINE_READY__=true;
} catch(err) {
  window.__GL_ENGINE_READY__=false;
  window.__GL_ENGINE_ERROR__=String(err && (err.stack || err.message) || err);
  const el=document.getElementById("bootMessage");
  if(el){el.textContent="ERRO AO INICIAR O MOTOR 3D: "+window.__GL_ENGINE_ERROR__.split("\n")[0];el.className="boot-message error";}
}
})();