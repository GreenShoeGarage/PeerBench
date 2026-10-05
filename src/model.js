import * as Y from 'yjs';
export { Y };
export const VERSION='1.0.0';
export const uid=()=>crypto.randomUUID();
export const b64=bytes=>{let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s);};
export const unb64=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
export const randomKey=()=>b64(crypto.getRandomValues(new Uint8Array(32))).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
export const decodeKey=s=>unb64(s.replaceAll('-','+').replaceAll('_','/'));
export async function sha(bytes){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');}
export async function roomCrypto(room,key){
 const raw=decodeKey(key);if(raw.length!==32)throw Error('The invitation key is invalid.');
 const aes=await crypto.subtle.importKey('raw',raw,'AES-GCM',false,['encrypt','decrypt']);
 const aad=new TextEncoder().encode('peerbench-v1:'+room);
 const auth=await sha(new TextEncoder().encode('peerbench-auth-v1:'+room+':'+key));
 return {auth,async seal(value){const iv=crypto.getRandomValues(new Uint8Array(12));const data=new TextEncoder().encode(JSON.stringify(value));return {iv:b64(iv),data:b64(new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad},aes,data)))};},async open(box){if(typeof box?.data!=='string'||box.data.length>12e6)throw Error('Invalid encrypted message.');return JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:unb64(box.iv),additionalData:aad},aes,unb64(box.data))));}};
}
export const isRoomId=s=>typeof s==='string'&&/^[a-f0-9-]{36}$/.test(s);
export function inviteParse(text){
 const url=new URL(text);const p=new URLSearchParams(url.hash.slice(1));const room=p.get('room'),key=p.get('key');
 if(!isRoomId(room)||!key||!/^[A-Za-z0-9_-]{43}$/.test(key))throw Error('Use a complete PEERBENCH invitation, including everything after #.');
 const server=p.get('server')||'';if(server){const u=new URL(server);if(!['ws:','wss:'].includes(u.protocol)||u.username||u.password)throw Error('Invalid connection server.');}
 return {id:room,key,server,name:'Shared room',persist:p.get('store')==='1'};
}
export function roomData(doc){return Object.fromEntries(['meta','tasks','notes','messages','files'].map(k=>[k,doc.getMap(k).toJSON()]));}
export function addTask(doc,fields={}){const id=uid(),m=new Y.Map();doc.transact(()=>{doc.getMap('tasks').set(id,m);for(const [k,v]of Object.entries({title:'Untitled task',description:'',status:'todo',assignee:'',priority:'normal',due:'',tags:'',created:Date.now(),deleted:false,...fields}))m.set(k,v);},'ui');return id;}
export function addNote(doc,title='Untitled note',body=''){const id=uid(),m=new Y.Map();doc.transact(()=>{doc.getMap('notes').set(id,m);m.set('title',title);m.set('deleted',false);const t=new Y.Text();m.set('body',t);t.insert(0,body);},'ui');return id;}
export function editText(t,next){const old=t.toString();if(old===next)return;let start=0;while(start<old.length&&start<next.length&&old[start]===next[start])start++;let end=0;while(end<old.length-start&&end<next.length-start&&old[old.length-1-end]===next[next.length-1-end])end++;t.doc.transact(()=>{if(old.length-start-end)t.delete(start,old.length-start-end);if(next.length-start-end)t.insert(start,next.slice(start,next.length-end));},'ui');}
export function seed(doc,name,sample=false){doc.transact(()=>{doc.getMap('meta').set('name',name);doc.getMap('meta').set('schema',1);doc.getMap('meta').set('created',Date.now());},'ui');if(sample){addTask(doc,{title:'Collect materials for the community build',description:'List what we already have. Reuse and repair first.',tags:'materials',priority:'high'});addTask(doc,{title:'Try the first cardboard prototype',description:'Make it tangible. Photograph what worked and what surprised us.',status:'doing',assignee:'You',tags:'experiment'});addTask(doc,{title:'Choose a question worth making',status:'done',tags:'planning'});addNote(doc,'Build notebook','# A little room for big ideas\n\nWhat are we making?\nA shared project that brings people, materials, and unexpected ideas together.\n\n## Next experiment\n- Make a quick prototype.\n- Compare what we expected with what happened.\n- Share what we learned.\n\nEveryone in this room can edit this notebook together.');}}
export function validateBackup(x){if(x?.format!=='peerbench'||x.schema!==1||typeof x.update!=='string'||x.update.length>32e6)throw Error('This is not a supported PEERBENCH backup (schema 1).');const d=new Y.Doc();try{Y.applyUpdate(d,unb64(x.update));if(d.getMap('meta').get('schema')!==1)throw Error();}catch{d.destroy();throw Error('The backup contains invalid workspace data.');}if(x.assets&&!Array.isArray(x.assets)){d.destroy();throw Error('The backup file list is invalid.');}return d;}
