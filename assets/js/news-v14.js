/* Fase 03A: progressively enhance the native news archive; no external requests. */
document.addEventListener('DOMContentLoaded',()=>{
 const root=document.querySelector('[data-news-section]');if(!root)return;
 const form=root.querySelector('[data-news-filters]'),cards=[...root.querySelectorAll('[data-news-card]')],status=root.querySelector('[data-news-status]'),empty=root.querySelector('[data-news-empty]'),featured=root.querySelector('[data-news-featured]');
 const fields=['news_q','news_year','news_category'].map(name=>form.elements.namedItem(name));
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('es');
 const readURL=()=>{const params=new URL(location.href).searchParams;fields.forEach(field=>{const value=params.get(field.name)||'';field.value=field.tagName==='SELECT'&&![...field.options].some(o=>o.value===value)?'':value.slice(0,100);});};
 const apply=(updateURL=true)=>{
  const [q,year,category]=fields.map(f=>f.value),words=normalize(q.trim()).split(/\s+/).filter(Boolean);let count=0;
  cards.forEach(card=>{const text=normalize(card.querySelector('h3').textContent+' '+card.querySelector('.ampa-news-card-summary').textContent);const show=(!year||card.dataset.newsYear===year)&&(!category||card.dataset.newsCategory.split(' ').includes(category))&&words.every(word=>text.includes(word));card.hidden=!show;if(show)count++;});
  const active=!!(words.length||year||category);featured.hidden=active;empty.hidden=count>0;status.textContent=`${count} ${count===1?'noticia':'noticias'} ${active?'encontradas':'disponibles'}`;
  if(updateURL){const url=new URL(location.href);fields.forEach(f=>{if(f.value.trim())url.searchParams.set(f.name,f.value);else url.searchParams.delete(f.name);});history.replaceState(null,'',url);}
 };
 form.addEventListener('submit',event=>{event.preventDefault();apply();});fields.forEach(field=>field.addEventListener(field.tagName==='SELECT'?'change':'input',()=>apply()));
 root.querySelector('[data-news-clear]').addEventListener('click',event=>{event.preventDefault();fields.forEach(f=>f.value='');apply();fields[0].focus();});
 window.addEventListener('popstate',()=>{readURL();apply(false);});readURL();apply(false);
});
