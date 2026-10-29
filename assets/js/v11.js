/* Shared progressive navigation; no third-party requests or personal-data storage. */
document.addEventListener('DOMContentLoaded',()=>{
 const toggle=document.querySelector('[data-v11-menu]'),nav=document.querySelector('#ampa-main-navigation');
 if(toggle&&nav){
  document.documentElement.classList.add('ampa-menu-enhanced');
  const close=()=>{toggle.setAttribute('aria-expanded','false');nav.classList.remove('is-open');nav.querySelectorAll('details[open]').forEach(d=>d.open=false);};
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));nav.classList.toggle('is-open',open);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){const expanded=nav.querySelector('details[open]');const returnTo=nav.classList.contains('is-open')?toggle:expanded?.querySelector('summary');close();returnTo?.focus();}});
  document.addEventListener('click',e=>{if(!nav.contains(e.target)&&!toggle.contains(e.target))close();});
  nav.querySelectorAll('details').forEach(d=>d.addEventListener('toggle',()=>{if(d.open)nav.querySelectorAll('details').forEach(other=>{if(other!==d)other.open=false;});}));
  nav.querySelectorAll('a').forEach(a=>{if(new URL(a.href,location.href).pathname===location.pathname)a.setAttribute('aria-current','page');a.addEventListener('click',close);});
 }
 if(document.documentElement.hasAttribute('data-static-preview')){
  document.querySelectorAll('.ampa-filter').forEach(form=>{
   const list=form.nextElementSibling?.matches('.ampa-card-grid')?form.nextElementSibling:null;if(!list)return;
   const select=form.querySelector('select[name="curso"]');if(!select)return;
   const status=document.createElement('p');status.className='ampa-filter-status';status.setAttribute('role','status');list.after(status);
   const apply=()=>{let count=0;list.querySelectorAll(':scope>.ampa-card').forEach(card=>{card.hidden=!!select.value&&card.dataset.course!==select.value;if(!card.hidden)count++;});status.textContent=`${count} publicaciones disponibles`;};
   form.addEventListener('submit',e=>{e.preventDefault();apply();});select.addEventListener('change',apply);apply();
  });
  const restoreLegacy=()=>{if(location.hash.startsWith('#/')){
   const requestedHash=location.hash;
   const prefix=document.documentElement.dataset.previewPrefix||'';
   fetch(prefix+'/legacy-routes.json').then(r=>r.ok?r.json():{}).then(map=>{const target=map[requestedHash.slice(1)];if(location.hash===requestedHash&&typeof target==='string'&&target.startsWith(prefix+'/')&&!target.startsWith('//'))location.replace(target);}).catch(()=>{});
  }};
  window.addEventListener('hashchange',restoreLegacy);restoreLegacy();
 }
});
/* V13 public discovery uses the same approved index in WordPress and Pages. */
document.addEventListener('DOMContentLoaded',()=>{
 const types={pagina:'Páginas',noticia:'Noticias',actividad:'Actividades',beca:'Becas',documento:'Documentos',pregunta:'Preguntas frecuentes',colaborador:'Colaboradores',mercadillo:'Mercadillo',historia:'Historia'};
 const states={historico:'Histórico',vigente_verificado:'Vigencia confirmada',pendiente_validacion:'Pendiente de validar'};
 const rawPrefix=document.documentElement.dataset.previewPrefix||'';
 const prefix=rawPrefix===''?'':(/^\/[A-Za-z0-9_-]+(?:\/[A-Za-z0-9_-]+)*$/.test(rawPrefix)?rawPrefix:null);
 const safeURL=value=>{
  if(prefix===null||typeof value!=='string'||value.length>1000)return null;
  try{const u=new URL(value,location.href);if(!['http:','https:'].includes(u.protocol)||u.origin!==location.origin||u.username||u.password||u.search||u.hash||u.pathname.includes('..')||!u.pathname.startsWith(prefix+'/')||u.pathname.startsWith('//'))return null;return u.href;}catch{return null;}
 };
 const normalize=value=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 document.querySelectorAll('[data-v13-search]').forEach(component=>{
  const script=component.querySelector('#ampa-search-index[data-search-index]'),form=component.querySelector('.ampa-public-search-form[data-v13-search-form]'),results=component.querySelector('[data-v13-search-results]'),status=component.querySelector('[data-v13-search-status]');
  if(!script||!form||!results||!status)return;let index;
  try{index=JSON.parse(script.textContent);}catch{return;}
  if(!Array.isArray(index)||index.length>500)return;
  const seen=new Set();index=index.filter(row=>{
   if(!row||Object.keys(row).sort().join(',')!=='excerpt,state,title,type,url,year'||!['url','title','excerpt','type','year','state'].every(k=>typeof row[k]==='string')||!types[row.type]||!(row.state===''||states[row.state])||!(row.year===''||/^(19|20)\d{2}$/.test(row.year))||row.title.length>180||row.excerpt.length>240)return false;
   const url=safeURL(row.url);if(!url||seen.has(url))return false;row.url=url;seen.add(url);return true;
  });
  const q=form.elements.namedItem('q'),type=form.elements.namedItem('type'),year=form.elements.namedItem('year'),state=form.elements.namedItem('state');if(!q||!type||!year||!state)return;
  const params=new URLSearchParams(location.search);
  if(params.has('q'))q.value=params.get('q').slice(0,100);
  [type,year,state].forEach(field=>{const value=params.get(field.name);if(value!==null&&Array.from(field.options).some(o=>o.value===value))field.value=value;});
  const apply=()=>{
   const words=normalize(q.value.slice(0,100).trim()).split(/\s+/).filter(Boolean);
   const matches=index.filter(row=>(!type.value||row.type===type.value)&&(!year.value||row.year===year.value)&&(!state.value||row.state===state.value)&&words.every(word=>normalize(row.title+' '+row.excerpt).includes(word)));
   const fragment=document.createDocumentFragment();
   matches.forEach(row=>{const item=document.createElement('li'),heading=document.createElement('h3'),link=document.createElement('a'),excerpt=document.createElement('p'),meta=document.createElement('small');link.href=row.url;link.textContent=row.title;heading.append(link);excerpt.textContent=row.excerpt;meta.textContent=types[row.type]+(row.year?' · '+row.year:'')+(row.state?' · '+states[row.state]:'');item.append(heading,excerpt,meta);fragment.append(item);});
   results.replaceChildren(fragment);status.textContent=matches.length?`${matches.length} resultados`:'No hay resultados para esta búsqueda. Prueba otras palabras o filtros.';
  };
  form.addEventListener('submit',event=>{event.preventDefault();apply();});[type,year,state].forEach(field=>field.addEventListener('change',apply));q.addEventListener('input',apply);apply();
 });
 document.querySelectorAll('[data-v13-document-filters]').forEach(controls=>{
  const category=controls.querySelector('[data-v13-filter-category]'),course=controls.querySelector('[data-v13-filter-course]'),scope=controls.parentElement;
  const cards=Array.from(scope.querySelectorAll('[data-v13-document-card]')),groups=Array.from(scope.querySelectorAll('[data-v13-document-group]')),status=scope.querySelector('[data-v13-document-status]');if(!category||!course||!status)return;controls.hidden=false;
  const apply=()=>{let count=0;cards.forEach(card=>{card.hidden=!!((category.value&&card.dataset.v13Category!==category.value)||(course.value&&card.dataset.v13Course!==course.value));if(!card.hidden)count++;});groups.forEach(group=>{group.hidden=!Array.from(group.querySelectorAll('[data-v13-document-card]')).some(card=>!card.hidden);});status.textContent=count?`${count} documentos disponibles`:'No hay documentos para estos filtros. Selecciona otra categoría o curso.';};category.addEventListener('change',apply);course.addEventListener('change',apply);apply();
 });
});

