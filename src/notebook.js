import Quill from 'quill';
import {QuillBinding} from 'y-quill';
import QuillCursors from 'quill-cursors';
import DOMPurify from 'dompurify';
import {marked} from 'marked';
import {Y} from './model.js';
Quill.register('modules/cursors',QuillCursors);
export const escapeHTML=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function cleanHTML(html){return DOMPurify.sanitize(html,{ALLOWED_TAGS:['p','br','strong','em','u','s','del','code','pre','blockquote','h1','h2','h3','h4','ul','ol','li','a','table','thead','tbody','tr','th','td','hr','span'],ALLOWED_ATTR:['href','title','class'],ALLOW_DATA_ATTR:false});}
export function noteHTML(text){
 if(!text.toDelta().some(d=>d.attributes))return cleanHTML(marked.parse(text.toString(),{async:false,gfm:true}));
 const host=document.createElement('div'),q=new Quill(host,{modules:{toolbar:false},formats:['bold','italic','underline','strike','header','list','blockquote','code-block','link'],readOnly:true});q.setContents(text.toDelta(),'silent');return cleanHTML(q.getSemanticHTML());
}
export function richEditor(host,text,awareness){
 const q=new Quill(host,{theme:'snow',formats:['bold','italic','underline','strike','header','list','blockquote','code-block','link'],modules:{cursors:{hideDelayMs:5000},toolbar:[[{header:[1,2,3,false]}],['bold','italic','underline','strike'],[{list:'ordered'},{list:'bullet'}],['blockquote','code-block','link','clean']],history:{userOnly:true}},placeholder:'Put an idea on the page.'});
 q.root.setAttribute('aria-label','Formatted shared note');q.root.setAttribute('role','textbox');q.root.setAttribute('aria-multiline','true');
 const binding=new QuillBinding(text,q,awareness),undo=new Y.UndoManager(text,{trackedOrigins:new Set([binding])});
 q.keyboard.bindings[90]=[];q.root.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();e.stopPropagation();e.shiftKey?undo.redo():undo.undo();}},true);
 host.parentElement.querySelectorAll('.ql-toolbar button').forEach(b=>{const label=[...b.classList].find(x=>x.startsWith('ql-'))?.slice(3)||'Format';b.setAttribute('aria-label',label+(b.value?' '+b.value:''));b.title=b.getAttribute('aria-label');});
 return {quill:q,undo,destroy(){awareness.setLocalStateField('cursor',null);binding.destroy();undo.destroy();q.disable();}};
}
