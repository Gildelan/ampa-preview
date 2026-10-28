/* V9: native scrolling, local authorized previews, per-card external consent. */
(() => {
  const initialize = () => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
    let activePreview = null;
    const stopPreview = () => {
      if (!activePreview) return;
      const video = activePreview;
      activePreview = null;
      video.pause();
      video.classList.remove('is-playing');
      const toggle = video.closest('[data-social-card]').querySelector('[data-social-preview-toggle]');
      toggle?.setAttribute('aria-pressed', 'false');
    };
    const inViewport = card => {
      const rect = card.getBoundingClientRect();
      return rect.bottom > 0 && rect.top < innerHeight && rect.right > 0 && rect.left < innerWidth;
    };
    const startPreview = card => {
      const video = card.querySelector('[data-social-preview]');
      if (!video || reduced.matches || document.hidden || !inViewport(card) || card.querySelector('iframe') || video.dataset.unavailable) return;
      if (activePreview === video && !video.paused) return;
      stopPreview();
      activePreview = video;
      video.muted = true;
      video.playsInline = true;
      if (!video.hasAttribute('src')) video.src = video.dataset.previewSrc;
      const playing = video.play();
      card.querySelector('[data-social-preview-toggle]')?.setAttribute('aria-pressed', 'true');
      if (playing?.then) playing.then(() => { if (activePreview === video) video.classList.add('is-playing'); else video.pause(); }).catch(() => { if (activePreview === video) stopPreview(); });
    };
    document.querySelectorAll('[data-social-videos]').forEach(root => {
      if (root.dataset.socialReady) return;
      root.dataset.socialReady = 'true';
      const track = root.querySelector('[data-social-track]');
      const cards = [...root.querySelectorAll('[data-social-card]')];
      if (!track || !cards.length) return;
      const controls = root.querySelector('[data-social-controls]');
      const prev = root.querySelector('[data-social-prev]');
      const next = root.querySelector('[data-social-next]');
      const count = root.querySelector('[data-social-count]');
      const step = () => cards[0].getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 0);
      const update = () => {
        const maximum = Math.max(0, track.scrollWidth - track.clientWidth);
        if (controls) controls.hidden = maximum <= 2;
        if (prev) prev.disabled = track.scrollLeft < 2;
        if (next) next.disabled = track.scrollLeft >= maximum - 2;
        if (count) count.textContent = `${Math.min(cards.length, Math.round(track.scrollLeft / step()) + 1)} de ${cards.length} publicaciones`;
      };
      const move = left => {
        stopPreview();
        track.scrollTo({ left, behavior: reduced.matches ? 'instant' : 'smooth' });
      };
      prev?.addEventListener('click', () => move(track.scrollLeft - step()));
      next?.addEventListener('click', () => move(track.scrollLeft + step()));
      track.addEventListener('keydown', event => {
        if (event.target !== track || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
        event.preventDefault();
        move(event.key === 'Home' ? 0 : event.key === 'End' ? track.scrollWidth : track.scrollLeft + step() * (event.key === 'ArrowLeft' ? -1 : 1));
      });
      track.addEventListener('scroll', () => { if (activePreview && !inViewport(activePreview.closest('[data-social-card]'))) stopPreview(); update(); }, { passive: true });
      window.addEventListener('resize', update, { passive: true });
      cards.forEach(card => {
        const play = card.querySelector('[data-social-play]');
        const allow = card.querySelector('[data-social-allow]');
        const cancel = card.querySelector('[data-social-cancel]');
        const consent = card.querySelector('[data-social-consent]');
        const withdraw = card.querySelector('[data-social-withdraw]');
        const screen = card.querySelector('[data-social-screen]');
        const status = card.querySelector('[data-social-status]');
        const preview = card.querySelector('[data-social-preview]');
        const previewToggle = card.querySelector('[data-social-preview-toggle]');
        const actions = card.querySelector('[data-social-actions]');
        if (!play || !allow || !cancel || !consent || !withdraw || !screen || !status || !actions) return;
        actions.hidden = false;
        let loadTimeout = null;
        const closeExplanation = (returnFocus = true) => {
          consent.hidden = true;
          play.setAttribute('aria-expanded', 'false');
          if (returnFocus) play.focus();
        };
        const closeEmbed = () => {
          window.clearTimeout(loadTimeout);
          screen.replaceChildren();
          screen.hidden = true;
          withdraw.hidden = true;
          play.hidden = false;
          if (previewToggle) previewToggle.hidden = false;
          closeExplanation();
          status.textContent = 'Permiso retirado. El reproductor se ha cerrado; puedes abrir el original o volver a permitir su carga.';
        };
        play.addEventListener('click', () => {
          stopPreview();
          consent.hidden = !consent.hidden;
          play.setAttribute('aria-expanded', String(!consent.hidden));
          if (!consent.hidden) allow.focus();
        });
        cancel.addEventListener('click', () => closeExplanation());
        consent.addEventListener('keydown', event => { if (event.key === 'Escape') { event.preventDefault(); closeExplanation(); } });
        allow.addEventListener('click', () => {
          let url;
          try { url = new URL(card.dataset.socialEmbed); } catch { return; }
          const valid = url.protocol === 'https:' && !url.username && !url.password && !url.port && ((url.hostname === 'www.instagram.com' && /^\/(p|reel)\/[A-Za-z0-9_-]{5,64}\/embed\/$/.test(url.pathname)) || (url.hostname === 'www.facebook.com' && url.pathname === '/plugins/video.php'));
          if (!valid) { status.textContent = 'No se puede preparar este reproductor. Abre la publicación original.'; closeExplanation(); return; }
          stopPreview();
          closeExplanation(false);
          const iframe = document.createElement('iframe');
          iframe.title = `${card.querySelector('h3').textContent} · ${card.dataset.socialProvider}`;
          iframe.allow = 'encrypted-media; fullscreen; picture-in-picture';
          iframe.allowFullscreen = true;
          iframe.referrerPolicy = 'strict-origin-when-cross-origin';
          const fail = () => {
            window.clearTimeout(loadTimeout);
            if (!screen.contains(iframe)) return;
            screen.replaceChildren();
            screen.hidden = true;
            status.textContent = 'El proveedor no ha podido cargar el reproductor. Abre la publicación original para comprobar su disponibilidad.';
          };
          iframe.addEventListener('error', fail, { once: true });
          iframe.addEventListener('load', () => {
            window.clearTimeout(loadTimeout);
            if (!screen.contains(iframe)) return;
            status.textContent = 'Conexión con el proveedor permitida. Si no aparece o no se reproduce, abre la publicación original. Su disponibilidad depende del proveedor.';
          }, { once: true });
          iframe.src = url.href;
          screen.replaceChildren(iframe);
          screen.hidden = false;
          play.hidden = true;
          if (previewToggle) previewToggle.hidden = true;
          withdraw.hidden = false;
          status.textContent = 'Cargando el proveedor con tu permiso. Si no está disponible, el enlace original sigue accesible.';
          loadTimeout = window.setTimeout(fail, 12000);
          withdraw.focus();
        });
        withdraw.addEventListener('click', closeEmbed);
        if (!preview) return;
        const syncMotion = () => {
          if (previewToggle) { previewToggle.disabled = reduced.matches; previewToggle.title = reduced.matches ? 'Vista previa pausada por tu preferencia de movimiento reducido.' : ''; }
        };
        syncMotion();
        reduced.addEventListener('change', syncMotion);
        card.addEventListener('pointerenter', () => { if (fine.matches) startPreview(card); });
        card.addEventListener('pointerleave', event => { if (event.pointerType !== 'touch' && activePreview === preview) stopPreview(); });
        card.addEventListener('focusin', () => { if (fine.matches && consent.hidden) startPreview(card); });
        card.addEventListener('focusout', event => { if (!card.contains(event.relatedTarget) && activePreview === preview) stopPreview(); });
        previewToggle?.addEventListener('click', () => { if (activePreview === preview) stopPreview(); else startPreview(card); });
        preview.addEventListener('error', () => {
          if (activePreview === preview) stopPreview();
          preview.dataset.unavailable = 'true';
          if (previewToggle) previewToggle.disabled = true;
          status.textContent = 'La vista previa local no está disponible. Puedes abrir la publicación original.';
        });
      });
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.intersectionRatio < .15 && activePreview?.closest('[data-social-card]') === entry.target) stopPreview();
        }), { threshold: [0, .15] });
        cards.forEach(card => observer.observe(card));
      }
      update();
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopPreview(); });
    window.addEventListener('pagehide', stopPreview);
    window.addEventListener('scroll', () => { if (activePreview && !inViewport(activePreview.closest('[data-social-card]'))) stopPreview(); }, { passive: true });
    reduced.addEventListener('change', () => { if (reduced.matches) stopPreview(); });
    fine.addEventListener('change', stopPreview);
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
  else initialize();
})();
