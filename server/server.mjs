// PEERBENCH v1.2.0 — GPL-3.0-only
import http from 'node:http';
import {readFile,stat,mkdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {timingSafeEqual} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {WebSocketServer,WebSocket} from 'ws';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const dataDir=process.env.DATA_DIR||path.join(root,'data');await mkdir(dataDir,{recursive:true});
const db=new DatabaseSync(path.join(dataDir,'peerbench.sqlite'));db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS rooms (room TEXT PRIMARY KEY, auth TEXT NOT NULL, bytes INTEGER NOT NULL DEFAULT 0); CREATE TABLE IF NOT EXISTS updates (seq INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT NOT NULL, payload TEXT NOT NULL, uid TEXT NOT NULL, UNIQUE(room,uid));');
db.exec('CREATE TABLE IF NOT EXISTS assets (room TEXT NOT NULL,file TEXT NOT NULL,chunk INTEGER NOT NULL,payload TEXT NOT NULL,bytes INTEGER NOT NULL,PRIMARY KEY(room,file,chunk));');
const ASSET_ENABLED=process.env.ENABLE_ATTACHMENT_ARCHIVE==='1',MAX_ASSETS=Number(process.env.MAX_ATTACHMENT_MB||256)*1024*1024;
const assetUsage=room=>({enabled:ASSET_ENABLED,bytes:db.prepare('SELECT COALESCE(SUM(bytes),0) AS n FROM assets WHERE room=?').get(room).n,limit:MAX_ASSETS});
const MAX_ROOM=Number(process.env.MAX_ROOM_MB||64)*1024*1024;const MAX_ROOMS=Number(process.env.MAX_ROOMS||200);const MAX_PEERS=10;
const allowedOrigins=(process.env.ALLOWED_ORIGINS||'').split(',').filter(Boolean);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json','.ico':'image/x-icon'};
const publicFiles=new Set(['index.html','app.js','app.css','notebook.css','sw.js','manifest.webmanifest','icon.svg','config.json']);
const server=http.createServer(async(req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,app:'peerbench',version:'1.2.0'}));return;}const name=url.pathname==='/'?'index.html':url.pathname.slice(1);if(!publicFiles.has(name)){res.writeHead(404);res.end('Not found');return;}try{const bytes=await readFile(path.join(root,name));res.writeHead(200,{'Content-Type':types[path.extname(name)]||'application/octet-stream','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-cache','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' blob: data:; connect-src 'self' ws: wss:; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"});res.end(bytes);}catch{res.writeHead(404);res.end('Not found');}});
const wss=new WebSocketServer({noServer:true,maxPayload:9*1024*1024});const live=new Map();const connections=new Map();
server.on('upgrade',(req,socket,head)=>{const origin=req.headers.origin;let sameOrigin=false;try{sameOrigin=!!origin&&new URL(origin).host===req.headers.host;}catch{}const allowed=allowedOrigins.length?allowedOrigins.includes(origin):sameOrigin;if(req.url!=='/connect'||!allowed){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}const ip=req.socket.remoteAddress;const count=connections.get(ip)||0;if(count>=40){socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>{ws.ip=ip;connections.set(ip,count+1);wss.emit('connection',ws,req);});});
const send=(ws,m)=>{if(ws.readyState===WebSocket.OPEN){if(ws.bufferedAmount>20*1024*1024){ws.close(1013,'Receiver too slow');return;}ws.send(JSON.stringify(m));}};
const usage=room=>({attachments:assetUsage(room),bytes:db.prepare('SELECT bytes FROM rooms WHERE room=?').get(room)?.bytes||0,limit:MAX_ROOM,updates:db.prepare('SELECT count(*) AS n FROM updates WHERE room=?').get(room).n});
const archiveRows=room=>db.prepare('SELECT seq,payload FROM updates WHERE room=? ORDER BY seq').all(room);
async function replay(ws,rows){for(const row of rows){const deadline=Date.now()+15000;while(ws.bufferedAmount>512000){if(ws.readyState!==WebSocket.OPEN||Date.now()>deadline)throw Error('Archive transfer interrupted. Reconnect to retry.');await new Promise(r=>setTimeout(r,10));}send(ws,{t:'replay',box:JSON.parse(row.payload)});}}
const validId=s=>typeof s==='string'&&/^[a-f0-9-]{36}$/.test(s);const validBox=b=>b&&typeof b.iv==='string'&&/^[A-Za-z0-9+/]{16}$/.test(b.iv)&&typeof b.data==='string'&&b.data.length<=8*1024*1024&&/^[A-Za-z0-9+/=]+$/.test(b.data);
wss.on('connection',ws=>{ws.alive=true;ws.rate=0;ws.window=Date.now();const timeout=setTimeout(()=>{if(!ws.room)ws.close(1008,'Join timeout');},10000);ws.on('pong',()=>ws.alive=true);ws.on('message',buffer=>{ws.incoming=(ws.incoming||Promise.resolve()).then(async()=>{let m;try{if(Date.now()-ws.window>1000){ws.window=Date.now();ws.rate=0;}if(++ws.rate>150)throw Error('Too many messages.');m=JSON.parse(buffer.toString());if(!ws.room){if(m.t!=='join'||!validId(m.room)||!validId(m.peer)||typeof m.auth!=='string'||!/^[a-f0-9]{64}$/.test(m.auth))throw Error('Invalid invitation.');let r=db.prepare('SELECT auth FROM rooms WHERE room=?').get(m.room);if(!r){if(db.prepare('SELECT count(*) AS n FROM rooms').get().n>=MAX_ROOMS)throw Error('Server room limit reached.');db.prepare('INSERT INTO rooms(room,auth) VALUES (?,?)').run(m.room,m.auth);r={auth:m.auth};}if(!timingSafeEqual(Buffer.from(r.auth),Buffer.from(m.auth)))throw Error('Invitation was not accepted. Check the complete link.');const peers=live.get(m.room)||new Map();if(peers.size>=MAX_PEERS)throw Error('This server allows 10 active devices per room.');if(peers.has(m.peer))throw Error('Duplicate device session.');ws.room=m.room;ws.peer=m.peer;clearTimeout(timeout);send(ws,{t:'welcome',protocol:2,peers:[...peers.keys()]});for(const p of peers.values())send(p,{t:'peer',peer:m.peer});peers.set(m.peer,ws);live.set(m.room,peers);await replay(ws,archiveRows(m.room));send(ws,{t:'ready',archive:usage(m.room)});return;}
 const peers=live.get(ws.room);if(m.t==='signal'){if(!validBox(m.box))throw Error('Invalid signaling packet.');const to=peers.get(m.to);if(to)send(to,{t:'signal',from:ws.peer,box:m.box});}
 else if(m.t==='relay'){if(!validBox(m.box))throw Error('Invalid encrypted packet.');if(m.to){const to=peers.get(m.to);if(to)send(to,{t:'relay',from:ws.peer,box:m.box});}else{const exclude=Array.isArray(m.exclude)?m.exclude.slice(0,10):[];for(const [id,p]of peers)if(id!==ws.peer&&!exclude.includes(id))send(p,{t:'relay',from:ws.peer,box:m.box});}}
 else if(m.t==='store'){if(!validBox(m.box)||!validId(m.id))throw Error('Invalid storage packet.');const payload=JSON.stringify(m.box),bytes=Buffer.byteLength(payload);const existing=db.prepare('SELECT seq FROM updates WHERE room=? AND uid=?').get(ws.room,m.id);if(existing){send(ws,{t:'stored',id:m.id,archive:usage(ws.room)});return;}if(db.prepare('SELECT bytes FROM rooms WHERE room=?').get(ws.room).bytes+bytes>MAX_ROOM)throw Error('Encrypted archive is full. Local work is safe; export a backup and ask the server operator to archive this room.');db.exec('BEGIN IMMEDIATE');try{db.prepare('INSERT INTO updates(room,payload,uid) VALUES (?,?,?)').run(ws.room,payload,m.id);db.prepare('UPDATE rooms SET bytes=bytes+? WHERE room=?').run(bytes,ws.room);db.exec('COMMIT');}catch(e){db.exec('ROLLBACK');throw e;}send(ws,{t:'stored',id:m.id,archive:usage(ws.room)});}
 else if(['asset-info','asset-put','asset-get','asset-delete'].includes(m.t)){
  if(!validId(m.id))throw Error('Invalid attachment.');
  if(m.t==='asset-info'){const chunks=db.prepare('SELECT chunk FROM assets WHERE room=? AND file=? ORDER BY chunk').all(ws.room,m.id);let next=0;for(const c of chunks){if(c.chunk!==next)break;next++;}send(ws,{t:'rpc',request:m.request,enabled:ASSET_ENABLED,next,archive:usage(ws.room)});}
  else if(m.t==='asset-get'){if(!Number.isInteger(m.index)||m.index<0||m.index>=1600)throw Error('Invalid chunk index.');const row=db.prepare('SELECT payload FROM assets WHERE room=? AND file=? AND chunk=?').get(ws.room,m.id,m.index);send(ws,{t:'rpc',request:m.request,box:row?JSON.parse(row.payload):null});}
  else if(m.t==='asset-delete'){db.prepare('DELETE FROM assets WHERE room=? AND file=?').run(ws.room,m.id);send(ws,{t:'rpc',request:m.request,archive:usage(ws.room)});}
  else{
   if(!ASSET_ENABLED)throw Error('Attachment hosting is disabled on this server.');if(!Number.isInteger(m.index)||m.index<0||m.index>=1600||!validBox(m.box)||m.box.data.length>60000)throw Error('Invalid encrypted attachment chunk.');
   const payload=JSON.stringify(m.box),bytes=Buffer.byteLength(payload),old=db.prepare('SELECT bytes FROM assets WHERE room=? AND file=? AND chunk=?').get(ws.room,m.id,m.index)?.bytes||0;
   if(assetUsage(ws.room).bytes-old+bytes>MAX_ASSETS)throw Error('Encrypted attachment quota reached. Local files are preserved.');
   db.prepare('INSERT INTO assets(room,file,chunk,payload,bytes) VALUES (?,?,?,?,?) ON CONFLICT(room,file,chunk) DO UPDATE SET payload=excluded.payload,bytes=excluded.bytes').run(ws.room,m.id,m.index,payload,bytes);
   send(ws,{t:'rpc',request:m.request,archive:usage(ws.room)});
  }
 }

 else if(m.t==='ping')send(ws,{t:'pong',time:m.time});
 else if(m.t==='archive-status')send(ws,{t:'archive-status',archive:usage(ws.room)});
 else if(m.t==='checkpoint-start'){
  if(typeof m.request!=='string'||m.request.length>40)throw Error('Invalid checkpoint request.');
  const rows=archiveRows(ws.room);const token=crypto.randomUUID();ws.checkpoint={token,cutoff:rows.at(-1)?.seq||0,expires:Date.now()+60000};
  await replay(ws,rows);send(ws,{t:'checkpoint-ready',request:m.request,token});
 }
 else if(m.t==='checkpoint-commit'){
  const c=ws.checkpoint;if(!c||c.token!==m.token||c.expires<Date.now()||!validBox(m.box)||!validId(m.id))throw Error('Checkpoint expired. Retry; the previous archive is intact.');
  const payload=JSON.stringify(m.box),bytes=Buffer.byteLength(payload);
  db.exec('BEGIN IMMEDIATE');try{
   const removed=db.prepare('SELECT COALESCE(SUM(length(CAST(payload AS BLOB))),0) AS n FROM updates WHERE room=? AND seq<=?').get(ws.room,c.cutoff).n;
   const remaining=usage(ws.room).bytes-removed;if(remaining+bytes>MAX_ROOM)throw Error('Room state exceeds archive quota. Export a backup before starting a new room.');
   db.prepare('DELETE FROM updates WHERE room=? AND seq<=?').run(ws.room,c.cutoff);
   db.prepare('INSERT INTO updates(room,payload,uid) VALUES (?,?,?)').run(ws.room,payload,m.id);
   db.prepare('UPDATE rooms SET bytes=? WHERE room=?').run(remaining+bytes,ws.room);db.exec('COMMIT');ws.checkpoint=null;
  }catch(e){db.exec('ROLLBACK');throw e;}
  send(ws,{t:'checkpoint-done',request:m.request,archive:usage(ws.room)});
 }

 }catch(e){send(ws,{t:'error',request:m?.request,message:e.message});if(!ws.room)ws.close(1008,'Join rejected');}}).catch(()=>ws.close(1011,'Processing error'));});ws.on('close',()=>{clearTimeout(timeout);connections.set(ws.ip,Math.max(0,(connections.get(ws.ip)||1)-1));if(ws.room){const peers=live.get(ws.room);peers?.delete(ws.peer);for(const p of peers?.values()||[])send(p,{t:'left',peer:ws.peer});if(!peers?.size)live.delete(ws.room);}});ws.on('error',()=>{});});
const heartbeat=setInterval(()=>{for(const ws of wss.clients){if(!ws.alive){ws.terminate();continue;}ws.alive=false;ws.ping();}},25000);
const port=Number(process.env.PORT||8787);server.listen(port,process.env.HOST||'0.0.0.0',()=>console.log(`PEERBENCH v1.2.0 listening on http://localhost:${port}`));
function shutdown(){clearInterval(heartbeat);for(const ws of wss.clients)ws.close();server.close(()=>{db.close();process.exit(0);});setTimeout(()=>process.exit(0),3000).unref();}process.on('SIGTERM',shutdown);process.on('SIGINT',shutdown);
