/* AMPA V6: progressive presentation, no framework or third-party requests. */
document.addEventListener('DOMContentLoaded', () => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const fine = matchMedia('(min-width: 1024px) and (pointer: fine)');
  const animate = (node, frames, options = {}) => {
    if (!reduced.matches && node?.animate) node.animate(frames, { duration: 450, easing: 'cubic-bezier(.2,.7,.2,1)', ...options });
  };
  const esc = value => String(value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
  document.documentElement.classList.add('ampa-enhanced');
  document.querySelectorAll('.ampa-navigation a[href]').forEach(a => {
    if (new URL(a.href, location.origin).pathname === location.pathname) a.setAttribute('aria-current', 'page');
  });
  if ('IntersectionObserver' in window) {
    const reveal = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      animate(entry.target, [{ opacity: .35, transform: 'translateY(22px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 650 });
      reveal.unobserve(entry.target);
    }), { threshold: .12 });
    document.querySelectorAll('.ampa-path-content,.ampa-section-heading,.ampa-story-copy,.ampa-gallery-tile figcaption').forEach(el => reveal.observe(el));
  }
  const scenes = [...document.querySelectorAll('[data-scene]')];
  const timeline = document.querySelector('.ampa-timeline');
  const bar = document.createElement('div'); bar.className = 'ampa-reading-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.append(bar);
  let frame = 0;
  function updateScenes() {
    frame = 0;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    scenes.forEach(scene => {
      const rect = scene.getBoundingClientRect();
      if (rect.bottom < -150 || rect.top > innerHeight + 150) return;
      const p = Math.max(-1, Math.min(1, (innerHeight / 2 - rect.top - rect.height / 2) / innerHeight));
      scene.style.setProperty('--scene-progress', String(reduced.matches ? 0 : p));
      scene.querySelectorAll('[data-depth]').forEach(layer => {
        const shift = !reduced.matches && fine.matches ? p * Number(layer.dataset.depth) * 160 : 0;
        layer.style.setProperty('--scene-shift', `${shift.toFixed(2)}px`);
      });
    });
    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      timeline.style.setProperty('--timeline-progress', String(Math.max(0, Math.min(1, (innerHeight * .7 - rect.top) / rect.height))));
      timeline.querySelectorAll('li').forEach(li => li.classList.toggle('is-reached', li.getBoundingClientRect().top < innerHeight * .72));
    }
  }
  const schedule = () => { if (!frame) frame = requestAnimationFrame(updateScenes); };
  addEventListener('scroll', schedule, { passive: true }); addEventListener('resize', schedule, { passive: true });
  reduced.addEventListener('change', schedule); fine.addEventListener('change', schedule); schedule();

  document.querySelectorAll('[data-gallery]').forEach(root => {
    const form = root.querySelector('[data-gallery-filters]');
    const tiles = [...root.querySelectorAll('.ampa-gallery-tile')];
    const status = root.querySelector('[data-gallery-status]');
    const empty = root.querySelector('[data-gallery-empty]');
    const selects = [...form.querySelectorAll('[data-filter]')];
    const reset = root.querySelector('[data-gallery-reset]');
    const limit = Math.max(1, Number.parseInt(root.dataset.galleryLimit, 10) || 120);
    function filter(updateURL = true) {
      const previous = new Map(tiles.filter(t => !t.hidden).map(t => [t, t.getBoundingClientRect()]));
      let shown = 0;
      tiles.forEach(tile => { const matches = selects.every(s => !s.value || tile.dataset[s.dataset.filter] === s.value); tile.hidden = !matches || shown >= limit; if (!tile.hidden) shown++; });
      const visible = tiles.filter(t => !t.hidden); empty.hidden = visible.length > 0;
      status.textContent = `${visible.length} ${visible.length === 1 ? 'imagen disponible' : 'imágenes disponibles'}`;
      visible.forEach(tile => {
        const before = previous.get(tile), after = tile.getBoundingClientRect();
        animate(tile, before ? [{ transform:`translate(${before.x-after.x}px,${before.y-after.y}px)`, opacity:.6 }, { transform:'translate(0,0)', opacity:1 }] : [{ opacity:.25, transform:'translateY(14px)' }, { opacity:1, transform:'translateY(0)' }]);
      });
      if (updateURL) {
        const url = new URL(location.href); selects.forEach(s => { if (s.value) url.searchParams.set(s.name, s.value); else url.searchParams.delete(s.name); });
        history.replaceState({}, '', url);
      }
    }
    form.addEventListener('submit', e => { e.preventDefault(); filter(); });
    selects.forEach(s => s.addEventListener('change', () => filter()));
    reset.addEventListener('click', e => { e.preventDefault(); selects.forEach(s => { s.value = ''; }); filter(); });
    // Initial server filtering remains valid without JavaScript; do not animate first paint.
    status.textContent = `${tiles.filter(t => !t.hidden).length} imágenes disponibles`;
    const dialog = root.querySelector('[data-gallery-dialog]');
    if (!dialog?.showModal) return; // Original anchors remain functional in older browsers.
    let current = 0, opener = null;
    const visibleTiles = () => tiles.filter(t => !t.hidden);
    function show(index) {
      const items = visibleTiles(); if (!items.length) return;
      current = (index + items.length) % items.length;
      const link = items[current].querySelector('[data-gallery-open]');
      const img = dialog.querySelector('[data-dialog-image]'); img.src = link.href; img.alt = link.querySelector('img').alt || link.dataset.caption;
      dialog.querySelector('[data-dialog-caption]').textContent = [link.dataset.caption, link.dataset.credit].filter(Boolean).join(' · ');
      dialog.querySelector('[data-dialog-count]').textContent = `${current + 1} de ${items.length}`;
      dialog.querySelectorAll('[data-dialog-prev],[data-dialog-next]').forEach(b => { b.disabled = items.length < 2; });
      animate(img, [{ opacity:.35 }, { opacity:1 }], { duration:220 });
    }
    tiles.forEach(tile => tile.querySelector('[data-gallery-open]').addEventListener('click', e => {
      e.preventDefault(); opener = e.currentTarget; show(visibleTiles().indexOf(tile));
      dialog.showModal(); document.body.classList.add('ampa-modal-open'); dialog.querySelector('[data-dialog-close]').focus();
    }));
    dialog.querySelector('[data-dialog-close]').addEventListener('click', () => dialog.close());
    dialog.querySelector('[data-dialog-prev]').addEventListener('click', () => show(current - 1));
    dialog.querySelector('[data-dialog-next]').addEventListener('click', () => show(current + 1));
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
    dialog.addEventListener('keydown', e => {
      if (['ArrowLeft','ArrowRight','Home','End'].includes(e.key)) {
        e.preventDefault(); show(e.key==='Home'?0:e.key==='End'?visibleTiles().length-1:current+(e.key==='ArrowLeft'?-1:1));
      }
    });
    dialog.addEventListener('close', () => { dialog.querySelector('[data-dialog-image]').removeAttribute('src'); document.body.classList.remove('ampa-modal-open'); opener?.focus(); });
  });

  document.querySelectorAll('[data-calendar]').forEach(root => {
    let month = root.dataset.month, view = 'month';
    let events; try { events = JSON.parse(root.querySelector('[data-calendar-events]').textContent); } catch { return; }
    const grid = root.querySelector('[data-calendar-month]'), list = root.querySelector('[data-calendar-list]');
    const title = root.querySelector('[data-calendar-title]');
    const fmt = new Intl.DateTimeFormat('es-ES', { month:'long', year:'numeric', timeZone:'UTC' });
    const dateISO = d => d.toISOString().slice(0,10);
    const now = new Date(); const today = root.dataset.today || [now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-');
    const inMonth = () => events.filter(e => e.date.slice(0,7)<=month && e.end.slice(0,7)>=month);
    function render(announce = true) {
      const [year,m] = month.split('-').map(Number); const first = new Date(Date.UTC(year,m-1,1,12));
      title.textContent = fmt.format(first);
      const start = new Date(first); start.setUTCDate(1 - ((first.getUTCDay()+6)%7));
      const names = ['Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'];
      let html = `<table class="ampa-month-table"><caption class="screen-reader-text">${esc(title.textContent)}</caption><thead><tr>${names.map(n=>`<th scope="col"><abbr title="${n}">${n.slice(0,3)}</abbr></th>`).join('')}</tr></thead><tbody>`;
      for(let i=0;i<42;i++) {
        if(i%7===0)html+='<tr>';
        const d=new Date(start);d.setUTCDate(start.getUTCDate()+i);const iso=dateISO(d);const items=events.filter(e=>e.date<=iso&&e.end>=iso);
        html+=`<td class="${iso.slice(0,7)!==month?'ampa-other-month ':''}${iso===today?'ampa-today':''}"><div class="ampa-day-inner"><time datetime="${iso}">${d.getUTCDate()}</time>${items.slice(0,2).map(e=>`<a class="ampa-calendar-event" href="${esc(e.url)}"><span aria-hidden="true">•</span><span>${esc(e.title)}</span></a>`).join('')}${items.length>2?`<a href="#${esc(list.id)}" class="ampa-more-events">+${items.length-2} más</a>`:''}</div></td>`;
        if(i%7===6)html+='</tr>';
      }
      grid.innerHTML=html+'</tbody></table>';
      const current=inMonth();list.innerHTML='<h3>Actividades del mes</h3>'+current.map(e=>`<article><time datetime="${esc(e.date)}">${esc(e.date)}</time><h4><a href="${esc(e.url)}">${esc(e.title)}</a></h4><span>${e.state==='historico'?'Archivo de convocatoria':'Convocatoria confirmada'}</span></article>`).join('');
      root.querySelector('[data-calendar-empty]').hidden=current.length>0;
      grid.hidden=view!=='month';list.hidden=view!=='list';
      root.querySelectorAll('[data-calendar-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.calendarView===view)));
      root.querySelectorAll('[data-month-step]').forEach(a=>{const next=new Date(first);next.setUTCMonth(first.getUTCMonth()+Number(a.dataset.monthStep));const url=new URL(location.href);url.searchParams.set('cal_month',dateISO(next).slice(0,7));a.href=url.href;});
      if(announce)animate(view==='month'?grid:list,[{opacity:.25,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:250});
    }
    root.querySelectorAll('[data-month-step]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();const value=new URL(a.href).searchParams.get('cal_month');if(!/^(19|20)\d{2}-\d{2}$/.test(value))return;month=value;const url=new URL(location.href);url.searchParams.set('cal_month',month);history.replaceState({},'',url);render();}));
    root.querySelectorAll('[data-calendar-view]').forEach(b=>b.addEventListener('click',()=>{view=b.dataset.calendarView;render();}));
    grid.addEventListener('click',e=>{const a=e.target.closest('.ampa-more-events');if(a){e.preventDefault();view='list';render();list.setAttribute('tabindex','-1');list.focus();}});
    render(false);
  });
  document.querySelectorAll('[data-video-card]').forEach(card => {
    const button=card.querySelector('[data-load-video]'),unload=card.querySelector('[data-unload-video]');
    if(!button||!unload)return;
    button.addEventListener('click',()=>{
      const id=button.dataset.loadVideo;if(!/^[A-Za-z0-9_-]{11}$/.test(id))return;
      const iframe=document.createElement('iframe');iframe.src=`https://www.youtube.com/embed/${id}?autoplay=0&rel=0`;
      iframe.title=card.querySelector('h3').textContent;iframe.allow='encrypted-media; fullscreen; picture-in-picture';iframe.allowFullscreen=true;iframe.referrerPolicy='strict-origin-when-cross-origin';
      card.querySelector('[data-video-screen]').replaceChildren(iframe);button.hidden=true;unload.hidden=false;
      card.querySelector('[data-video-status]').textContent='Se ha autorizado la conexión con YouTube. Si el vídeo no está disponible, utiliza el enlace original.';unload.focus();
    });
    unload.addEventListener('click',()=>{const span=document.createElement('span');span.textContent='▷';span.setAttribute('aria-hidden','true');card.querySelector('[data-video-screen]').replaceChildren(span);button.hidden=false;unload.hidden=true;card.querySelector('[data-video-status]').textContent='Reproductor cerrado. No se volverá a cargar sin tu acción.';button.focus();});
  });
});
