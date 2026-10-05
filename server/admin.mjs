// Local operator tools. Run on the server; never exposed as an HTTP endpoint.
import {DatabaseSync,backup} from 'node:sqlite';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const dir=process.env.DATA_DIR||path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../data');
const db=new DatabaseSync(path.join(dir,'peerbench.sqlite'));
const [command,arg,confirm]=process.argv.slice(2);
try{
 if(command==='list'){for(const r of db.prepare('SELECT room,bytes FROM rooms ORDER BY room').all()){const has=db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='assets'").get();const assets=has?db.prepare('SELECT COALESCE(SUM(bytes),0) AS n FROM assets WHERE room=?').get(r.room).n:0;console.log(`${r.room}\trecords ${(r.bytes/1048576).toFixed(2)} MiB\tattachments ${(assets/1048576).toFixed(2)} MiB`);}}
 else if(command==='backup'&&arg){await backup(db,path.resolve(arg));console.log('Consistent database backup created.');}
 else if(command==='delete'&&/^[a-f0-9-]{36}$/.test(arg||'')&&confirm==='--confirm'){db.exec('BEGIN IMMEDIATE');try{if(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='assets'").get())db.prepare('DELETE FROM assets WHERE room=?').run(arg);db.prepare('DELETE FROM updates WHERE room=?').run(arg);db.prepare('DELETE FROM rooms WHERE room=?').run(arg);db.exec('COMMIT');console.log('Server room archive removed. Peers retain their copies.');}catch(e){db.exec('ROLLBACK');throw e;}}
 else{console.error('Usage: node server/admin.mjs list | backup FILE | delete ROOM_ID --confirm');process.exitCode=1;}
}finally{db.close();}
