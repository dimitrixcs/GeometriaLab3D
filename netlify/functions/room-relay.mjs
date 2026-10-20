import { getStore } from "@netlify/blobs";

const store = getStore({ name: "geometria-lab-rooms", consistency: "strong" });
const ROOM_TTL = 2 * 60 * 60 * 1000;
const PLAYER_TTL = 8_000;
const MAX_PLAYERS = 12;

const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  }
});

function cleanRoom(room) {
  return String(room || "").trim().toLowerCase();
}
function validRoom(room) {
  return /^[a-z0-9][a-z0-9_-]{2,11}$/.test(room);
}
function cleanId(id) {
  return String(id || "").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 80);
}
function roomKey(room){ return `rooms/${room}/meta`; }
function playerKey(room,id){ return `rooms/${room}/players/${id}`; }
function objectKey(room,id){ return `rooms/${room}/objects/${id}`; }
function enemyKey(room){ return `rooms/${room}/world/enemies`; }

async function getJSON(key){
  return await store.get(key, { type: "json", consistency: "strong" });
}
async function listJSON(prefix){
  const { blobs = [] } = await store.list({ prefix });
  return Promise.all(blobs.map(x => getJSON(x.key)));
}
async function cleanupRoom(room){
  const keys = [roomKey(room), enemyKey(room)];
  const playerEntries = await store.list({prefix:`rooms/${room}/players/`});
  const objectEntries = await store.list({prefix:`rooms/${room}/objects/`});
  for(const e of playerEntries.blobs || []) keys.push(e.key);
  for(const e of objectEntries.blobs || []) keys.push(e.key);
  await Promise.all(keys.map(k=>store.delete(k).catch(()=>{})));
}

async function snapshot(room){
  const meta = await getJSON(roomKey(room));
  if(!meta) return null;
  const now = Date.now();
  if(now - meta.createdAt > ROOM_TTL){
    await cleanupRoom(room);
    return null;
  }

  const playersRaw = await listJSON(`rooms/${room}/players/`);
  const players = playersRaw.filter(Boolean).filter(p => now - (p.lastSeen || 0) <= PLAYER_TTL);
  const stale = playersRaw.filter(p => p && now - (p.lastSeen || 0) > PLAYER_TTL);
  await Promise.all(stale.map(p => p.id ? store.delete(playerKey(room, p.id)).catch(()=>{}) : null));

  const objects = (await listJSON(`rooms/${room}/objects/`)).filter(Boolean);
  const enemies = (await getJSON(enemyKey(room))) || [];
  return { room, hostId:meta.hostId, players, objects, enemies, now };
}

function samePassword(a,b){ return String(a ?? "") === String(b ?? ""); }
function normalizePlayer(p){
  const id=cleanId(p?.id);
  const pos=Array.isArray(p?.pos)&&p.pos.length===3?p.pos.map(Number):[0,0,25];
  return {
    id,
    color:Number(p?.color)||0x4c8dff,
    pos:[Number(pos[0])||0,Number(pos[1])||0,Number(pos[2])||0],
    rot:Number(p?.rot)||0,
    mode:String(p?.mode||"combat"),
    character:{
      name:String(p?.character?.name||"Jogador").slice(0,14),
      outfit:String(p?.character?.outfit||"lab").slice(0,20),
      head:String(p?.character?.head||"none").slice(0,20),
      body:String(p?.character?.body||"normal").slice(0,20),
      skin:String(p?.character?.skin||"light").slice(0,20),
      hair:String(p?.character?.hair||"none").slice(0,20),
      hairColor:String(p?.character?.hairColor||"black").slice(0,20),
      face:String(p?.character?.face||"none").slice(0,20),
      back:String(p?.character?.back||"none").slice(0,20)
    },
    lastSeen:Date.now()
  };
}

async function updatePlayer(room,p){ await store.setJSON(playerKey(room,p.id),p); }

export default async (req) => {
  try{
    const method=req.method.toUpperCase();
    if(method==="GET"){
      const u=new URL(req.url);
      const room=cleanRoom(u.searchParams.get("room"));
      const password=u.searchParams.get("password")||"";
      const id=cleanId(u.searchParams.get("id"));
      if(!validRoom(room)||!id) return json({error:"Sala inválida."},400);
      const meta=await getJSON(roomKey(room));
      if(!meta) return json({error:"Sala não encontrada ou encerrada."},404);
      if(!samePassword(password,meta.password)) return json({error:"Senha incorreta."},403);
      const s=await snapshot(room);
      if(!s) return json({error:"Sala expirada."},404);
      const me=s.players.find(p=>p.id===id);
      if(!me) return json({error:"Jogador não está mais na sala."},410);
      return json(s);
    }

    if(method!=="POST") return json({error:"Método não permitido."},405);
    const body=await req.json().catch(()=>({}));
    const action=String(body.action||"");
    const room=cleanRoom(body.room);
    const password=String(body.password??"");
    if(!validRoom(room)) return json({error:"Código de sala inválido. Use 3–12 caracteres: letras, números, _ ou -."},400);

    if(action==="create"){
      const host=normalizePlayer(body.player);
      if(!host.id) return json({error:"ID de jogador inválido."},400);
      const existing=await getJSON(roomKey(room));
      if(existing && Date.now()-existing.createdAt < ROOM_TTL){
        const hostRecord=existing.hostId?await getJSON(playerKey(room,existing.hostId)):null;
        const hostFresh=!!hostRecord&&Date.now()-(hostRecord.lastSeen||0)<=PLAYER_TTL;
        if(hostFresh)return json({error:"Esse código de sala já está em uso."},409);
        // Free room codes after a crashed/disconnected host instead of reserving them for two hours.
        await cleanupRoom(room);
      }else if(existing){await cleanupRoom(room);}
      await store.setJSON(roomKey(room),{room,password,hostId:host.id,createdAt:Date.now()});
      await updatePlayer(room,host);
      await store.setJSON(enemyKey(room),Array.isArray(body.enemies)?body.enemies:[]);
      for(const o of (Array.isArray(body.objects)?body.objects:[])){
        if(o?.id) await store.setJSON(objectKey(room,cleanId(o.id)),o);
      }
      return json(await snapshot(room));
    }

    if(action==="join"){
      const meta=await getJSON(roomKey(room));
      if(!meta) return json({error:"Sala não encontrada. O host precisa criar a sala primeiro."},404);
      if(!samePassword(password,meta.password)) return json({error:"Senha incorreta para esta sala."},403);
      const s=await snapshot(room);
      if(!s) return json({error:"Sala expirada."},404);
      const now=Date.now();
      const active=s.players;
      const host=active.find(p=>p.id===meta.hostId);
      if(!host || now-host.lastSeen>PLAYER_TTL) return json({error:"O host não está conectado."},409);
      if(active.length>=MAX_PLAYERS && !active.some(p=>p.id===cleanId(body.player?.id))) return json({error:`Sala cheia (máximo ${MAX_PLAYERS}).`},409);
      const guest=normalizePlayer(body.player);
      if(!guest.id) return json({error:"ID de jogador inválido."},400);
      await updatePlayer(room,guest);
      return json(await snapshot(room));
    }

    if(action==="update"){
      const meta=await getJSON(roomKey(room));
      if(!meta) return json({error:"Sala encerrada."},404);
      if(!samePassword(password,meta.password)) return json({error:"Senha incorreta."},403);
      const p=normalizePlayer(body.player);
      if(!p.id) return json({error:"ID de jogador inválido."},400);
      const current=await getJSON(playerKey(room,p.id));
      if(!current) return json({error:"Jogador não registrado nesta sala."},410);
      await updatePlayer(room,p);

      for(const ev of (Array.isArray(body.events)?body.events:[])){
        const t=String(ev?.type||"");
        if(t==="place" && ev.id){
          const object={
            id:cleanId(ev.id),item:cleanId(ev.item),owner:p.id,
            pos:Array.isArray(ev.pos)?ev.pos.map(Number):[0,0,0],
            rot:Array.isArray(ev.rot)?ev.rot.map(Number):[0,0,0],
            vy:Number(ev.vy)||0
          };
          await store.setJSON(objectKey(room,object.id),object);
        }else if(t==="remove" && ev.id){
          await store.delete(objectKey(room,cleanId(ev.id))).catch(()=>{});
        }else if(t==="clearMine"){
          const all=await listJSON(`rooms/${room}/objects/`);
          await Promise.all(all.filter(o=>o&&o.owner===p.id).map(o=>store.delete(objectKey(room,o.id)).catch(()=>{})));
        }
      }

      if(p.id===meta.hostId && Array.isArray(body.enemies)){
        // Host controls enemy positions, but a stale host frame must not heal damage already accepted from a guest.
        const previous=(await getJSON(enemyKey(room)))||[];
        const previousById=new Map(previous.map(e=>[e.id,e]));
        const merged=body.enemies.map(incoming=>{
          const old=previousById.get(incoming?.id);if(!old)return incoming;
          const a=Math.max(0,Number(old.hp)||0),b=Math.max(0,Number(incoming.hp)||0),hp=Math.min(a,b);
          return {...incoming,hp,alive:!!incoming.alive&&!!old.alive&&hp>0};
        });
        await store.setJSON(enemyKey(room),merged);
      }
      // Apply a validated geometry-combat hit in the shared room state. The next host snapshot merges HP downward.
      for(const ev of (Array.isArray(body.events)?body.events:[])){
        if(String(ev?.type||"")==="damageEnemy" && p.id!==meta.hostId && ev.id){
          const all=(await getJSON(enemyKey(room)))||[];const target=all.find(e=>e&&e.id===cleanId(ev.id));
          if(target&&target.alive){const amount=Math.max(1,Math.min(50,Number(ev.amount)||50));target.hp=Math.max(0,(Number(target.hp)||0)-amount);if(target.hp<=0){target.hp=0;target.alive=false;}await store.setJSON(enemyKey(room),all);}
        }
      }
      return json(await snapshot(room));
    }

    if(action==="leave"){
      const meta=await getJSON(roomKey(room));
      if(!meta) return json({ok:true});
      const id=cleanId(body.id);
      if(id===meta.hostId){ await cleanupRoom(room); return json({ok:true,closed:true}); }
      if(id) await store.delete(playerKey(room,id)).catch(()=>{});
      return json({ok:true});
    }

    return json({error:"Ação desconhecida."},400);
  }catch(err){
    console.error("room-relay",err);
    return json({error:"Servidor de salas indisponível.",details:String(err?.message||err)},500);
  }
};
