(function(root){'use strict';
const $=id=>document.getElementById(id);function esc(s){return String(s||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function documentTargets(){
 const out=[{value:'trip|',label:'Trip-wide'}],seen=new Set(['trip|']);
 const bookings=root.BOOKING_AUTHORITY?.all?.(root.PRODUCTION_BOOKINGS?.byId)||Object.values(root.PRODUCTION_BOOKINGS?.byId||{});
 bookings.forEach(b=>{if(!b?.id)return;const v='booking|'+b.id;if(!seen.has(v)){seen.add(v);out.push({value:v,label:'Booking · '+(b.title||b.id)})}});
 const days=root.ITINERARY_DATA||root.TRAVEL_DATASETS?.ITINERARY_DATA||{};
 Object.entries(days).forEach(([day,d])=>(d?.items||[]).forEach(it=>{if(!it?.id)return;const v='timeline|'+day+'::'+it.id;if(!seen.has(v)){seen.add(v);out.push({value:v,label:'Timeline · '+(it.title||it.id)})}}));
 return out;
}
function fillLinkSelect(sel,value){if(!sel)return;sel.innerHTML=documentTargets().map(x=>`<option value="${esc(x.value)}">${esc(x.label)}</option>`).join('');sel.value=value||'trip|';if(sel.selectedIndex<0)sel.value='trip|'}
function renderTargets(){fillLinkSelect($('docLink'),'trip|')}
function routeForDocument(d){if(d.linkType==='booking'&&d.linkId)return `trip.html?bookingId=${encodeURIComponent(d.linkId)}`;if(d.linkType==='timeline'&&d.linkId){const [day,item]=String(d.linkId).split('::');return `day.html?day=${encodeURIComponent(day)}#${encodeURIComponent(item||'')}`}return ''}
function render(){
 const list=root.TRIP_DOCUMENTS.read(),box=$('documentsList');
 $('docCount').textContent=`${list.length} ${list.length===1?'document':'documents'}`;
 const card=d=>`<article class="expense-card document-history-card">
   <div class="document-history-title"><span aria-hidden="true">${d.mimeType?.startsWith('image/')?'🖼️':d.mimeType?.includes('pdf')?'📄':'📎'}</span><strong>${esc(d.title)}</strong>${d.pinned?'<span class="document-pin" title="Pinned">📌</span>':''}</div>
   <p class="timestamp">${esc(d.category||'Other')}${d.uploadPending?' · Not synced':''}</p>
   ${d.note?`<p>${esc(d.note)}</p>`:''}
   ${d.fileName?`<p class="document-file-name">${esc(d.fileName)}</p>`:''}
   ${d.linkType&&d.linkType!=='trip'&&d.linkLabel?`<p class="document-link-row">🔗 <a href="${esc(routeForDocument(d))}">${esc(d.linkLabel)}</a></p>`:''}
   <div class="entry-actions document-entry-actions">
     <button class="mini-btn" onclick="openDocumentViewer('${esc(d.id)}')">📄 Open</button>
     <button class="mini-btn" onclick="openEditDocument('${esc(d.id)}')">✏️ Edit</button>
     ${d.uploadPending?`<button class="mini-btn" onclick="repairDocument('${esc(d.id)}')">☁️ Sync file</button>`:''}
     ${d.seeded?'':`<button class="mini-btn" onclick="deleteDoc('${esc(d.id)}')">🗑 Delete</button>`}
   </div>
 </article>`;
 box.innerHTML=list.map(card).join('')||'<div class="empty-state">No documents yet.</div>';
}

root.openEditDocument=id=>{
 const d=root.TRIP_DOCUMENTS.read().find(x=>x.id===id);if(!d)return;
 $('editDocId').value=d.id;$('editDocTitle').value=d.title||'';$('editDocCategory').value=d.category||'Other';$('editDocPin').checked=!!d.pinned;fillLinkSelect($('editDocLink'),(d.linkType||'trip')+'|'+(d.linkId||''));
 $('editDocModal').classList.add('show');$('editDocModal').setAttribute('aria-hidden','false');
};
root.closeEditDocument=()=>{$('editDocModal').classList.remove('show');$('editDocModal').setAttribute('aria-hidden','true')};
root.saveDocumentEdit=async()=>{
 const id=$('editDocId').value;if(!id)return;const sel=$('editDocLink'),parts=sel.value.split('|'),linkType=parts[0]||'trip',linkId=parts.slice(1).join('|'),linkLabel=sel.selectedOptions[0]?.textContent?.replace(/^(Booking|Timeline) · /,'')||'Trip-wide';
 await root.TRIP_DOCUMENTS.update(id,{title:$('editDocTitle').value.trim()||'Document',category:$('editDocCategory').value,pinned:$('editDocPin').checked,linkType,linkId,linkLabel});root.closeEditDocument();render();
};

root.repairDocument=id=>{
 const doc=root.TRIP_DOCUMENTS.read().find(d=>d.id===id);if(!doc)return;
 const input=document.createElement('input');input.type='file';input.accept='image/*,.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document';
 input.onchange=async()=>{const file=input.files&&input.files[0];if(!file)return;try{await root.TRIP_DOCUMENTS.repair(id,file);render();await root.TRIP_DOCUMENTS.sync();render()}catch(e){alert('Could not sync this document yet. Please try again when online.')}};
 input.click();
};

root.togglePin=async id=>{const d=root.TRIP_DOCUMENTS.read().find(x=>x.id===id);if(d)await root.TRIP_DOCUMENTS.update(id,{pinned:!d.pinned});render()};root.deleteDoc=async id=>{if(confirm('Delete this document?')){await root.TRIP_DOCUMENTS.remove(id);render()}};

async function renderPdfInto(url,wrap){wrap.innerHTML='<div class="doc-viewer-message">Loading document…</div>';try{if(!root.pdfjsLib)throw new Error('PDF viewer unavailable');root.pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';const pdf=await root.pdfjsLib.getDocument(url).promise;wrap.innerHTML='';for(let n=1;n<=pdf.numPages;n++){const page=await pdf.getPage(n);const base=page.getViewport({scale:1});const max=Math.min(900,Math.max(280,wrap.clientWidth-24));const scale=Math.min(2,max/base.width);const vp=page.getViewport({scale});const canvas=document.createElement('canvas');canvas.className='pdf-page';canvas.width=Math.ceil(vp.width);canvas.height=Math.ceil(vp.height);wrap.appendChild(canvas);await page.render({canvasContext:canvas.getContext('2d'),viewport:vp}).promise}}catch(e){wrap.innerHTML='<div class="doc-viewer-message"><strong>Could not preview this document.</strong><p>Try again while online.</p></div>'}}
root.openDocumentViewer=id=>{const d=root.TRIP_DOCUMENTS.read().find(x=>x.id===id);if(!d)return;let url=d.fileUrl||d.localObjectUrl||'';if(d.embeddedBase64){try{const raw=atob(d.embeddedBase64),bytes=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)bytes[i]=raw.charCodeAt(i);url=URL.createObjectURL(new Blob([bytes],{type:d.mimeType||'application/pdf'}));}catch(e){}}$('docViewerTitle').textContent=d.title||'Document';const body=$('docViewerBody');body.innerHTML='';if(!url){body.innerHTML='<div class="doc-viewer-message">This document is not available on this device yet.</div>'}else if((d.mimeType||'').startsWith('image/')){const img=document.createElement('img');img.src=url;img.alt=d.title||'Document';body.appendChild(img)}else if((d.mimeType||'').includes('pdf')||/\.pdf(?:$|\?)/i.test(url)){const wrap=document.createElement('div');wrap.className='pdf-pages';body.appendChild(wrap);renderPdfInto(url,wrap)}else{const wrap=document.createElement('div');wrap.className='doc-viewer-message';wrap.innerHTML='<strong>'+esc(d.fileName||d.title||'Document')+'</strong><p>This file type opens in its native viewer.</p><a class="pill" target="_blank" rel="noopener">Open original file</a>';wrap.querySelector('a').href=url;body.appendChild(wrap)}$('docViewer').classList.add('show');$('docViewer').setAttribute('aria-hidden','false');document.body.style.overflow='hidden'};
root.closeDocumentViewer=()=>{$('docViewer').classList.remove('show');$('docViewer').setAttribute('aria-hidden','true');$('docViewerBody').innerHTML='';document.body.style.overflow=''};
root.resetDocumentsView=()=>{try{root.closeDocumentViewer()}catch(e){};try{root.closeAddDocument()}catch(e){};const f=$('docForm');if(f)f.reset();const save=$('docSave');if(save){save.disabled=false;save.textContent='Save Document'};document.body.style.overflow=''};

root.openAddDocument=()=>{$('docModal').classList.add('show')};
root.closeAddDocument=()=>{$('docModal').classList.remove('show');const f=$('docForm');if(f)f.reset();const save=$('docSave');if(save){save.disabled=false;save.textContent='Save Document'}};
root.saveDocument=async()=>{const file=$('docFile').files[0];if(!file){alert('Choose a photo, PDF or Word document.');return}const title=$('docTitle').value.trim()||file.name;const [linkType,linkId]=$('docLink').value.split('|');const label=$('docLink').selectedOptions[0]?.textContent||'Trip-wide';$('docSave').disabled=true;$('docSave').textContent='Saving…';await root.TRIP_DOCUMENTS.add({title,category:$('docCategory').value,note:'',pinned:$('docPin').checked,linkType,linkId,linkLabel:label},file);$('docSave').disabled=false;$('docSave').textContent='Save Document';$('docForm').reset();closeAddDocument();render()};
document.addEventListener('DOMContentLoaded',()=>{renderTargets();render();root.TRIP_DOCUMENTS.sync().then(render);const id=new URLSearchParams(location.search).get('document')||sessionStorage.getItem('travel_engine_open_document_v1');if(id){sessionStorage.removeItem('travel_engine_open_document_v1');setTimeout(()=>root.openDocumentViewer(id),120)}});document.addEventListener('travelengine:documentschanged',render);
window.addEventListener('pageshow',()=>{ if(document.visibilityState==='visible') root.resetDocumentsView?.(); });
})(globalThis);
