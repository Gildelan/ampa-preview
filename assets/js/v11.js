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
