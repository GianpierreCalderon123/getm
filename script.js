/* GETM — interacciones progresivas, accesibles y sin dependencias externas */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');

  // Menú móvil: mantiene aria-expanded sincronizado.
  const navToggle = $('#navToggle');
  const mainNav = $('#mainNav');
  const closeMenu = () => {
    if (!navToggle || !mainNav) return;
    mainNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.setAttribute('aria-label', 'Abrir menú');
  };
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', () => {
      const open = !mainNav.classList.contains('open');
      mainNav.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    $$('#mainNav a').forEach(link => link.addEventListener('click', closeMenu));
    document.addEventListener('click', e => {
      if (mainNav.classList.contains('open') &&
          !mainNav.contains(e.target) && !navToggle.contains(e.target)) closeMenu();
    });
    window.addEventListener('resize', () => { if (innerWidth > 960) closeMenu(); }, { passive: true });
  }

  // Barra superior de progreso: un solo cálculo por frame.
  const progressBar = $('#scrollProgress');
  let progressScheduled = false;
  const updateProgress = () => {
    progressScheduled = false;
    if (!progressBar) return;
    const scrollable = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    const percent = Math.max(0, Math.min(100, scrollY / scrollable * 100));
    progressBar.style.width = percent + '%';
  };
  window.addEventListener('scroll', () => {
    if (progressScheduled) return;
    progressScheduled = true;
    requestAnimationFrame(updateProgress);
  }, { passive: true });
  window.addEventListener('resize', updateProgress, { passive: true });
  updateProgress();

  // Revelados sólo con JavaScript e IntersectionObserver; sin JS todo queda visible.
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    document.documentElement.classList.add('motion-ready');
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -40px 0px', threshold: 0.06 });
    $$('.reveal').forEach((element, index) => {
      if (index % 3 !== 0) element.style.transitionDelay = Math.min((index % 3) * 90, 180) + 'ms';
      revealObserver.observe(element);
    });
  }

  // Ancla activa en el menú.
  if ('IntersectionObserver' in window) {
    const links = $$('#mainNav a[href^="#"]');
    const sections = links.map(link => $(link.getAttribute('href'))).filter(Boolean);
    const navObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        links.forEach(link => {
          const active = link.getAttribute('href') === '#' + entry.target.id;
          link.classList.toggle('active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-20% 0px -65% 0px' });
    sections.forEach(section => navObserver.observe(section));
  }

  // Filtros de programas: muestran sólo actividades de la categoría elegida.
  const filterButtons = $$('.filter-chip[data-filter]');
  const programCards = $$('.program-card[data-category]');
  filterButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selected = button.dataset.filter;
      filterButtons.forEach(other => {
        const active = other === button;
        other.classList.toggle('active', active);
        other.setAttribute('aria-pressed', String(active));
      });
      programCards.forEach(card => {
        card.hidden = selected !== 'all' && card.dataset.category !== selected;
      });
    });
  });

  // Tilt 3D suave usando CSS custom properties; no se activa en pantallas táctiles.
  // Los objetos y modelos permanecen visibles cuando la persona reduce movimiento.
  const tiltable = $$('[data-tilt]');
  const clearTilt = el => {
    el.style.setProperty('--rx', '0deg');
    el.style.setProperty('--ry', '0deg');
  };
  tiltable.forEach(el => {
    let tiltFrame = 0;
    let pointer = { x: 0, y: 0 };
    el.addEventListener('pointermove', e => {
      if (!finePointer.matches || reduceMotion.matches) return;
      const rect = el.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      pointer.x = ((e.clientX - rect.left) / rect.width - .5) * 2;
      pointer.y = ((e.clientY - rect.top) / rect.height - .5) * 2;
      if (tiltFrame) return;
      tiltFrame = requestAnimationFrame(() => {
        tiltFrame = 0;
        const strength = el.classList.contains('tilt-card') ? 5 : 7;
        el.style.setProperty('--rx', (-pointer.y * strength).toFixed(2) + 'deg');
        el.style.setProperty('--ry', (pointer.x * strength).toFixed(2) + 'deg');
      });
    }, { passive: true });
    el.addEventListener('pointerleave', () => { if (tiltFrame) cancelAnimationFrame(tiltFrame); tiltFrame = 0; clearTilt(el); });
    el.addEventListener('pointercancel', () => { if (tiltFrame) cancelAnimationFrame(tiltFrame); tiltFrame = 0; clearTilt(el); });
  });

  // Preguntas frecuentes: evitar que queden múltiples paneles abiertos.
  const faqDetails = $$('.faq-list details');
  faqDetails.forEach(item => item.addEventListener('toggle', () => {
    if (!item.open) return;
    faqDetails.forEach(other => { if (other !== item) other.open = false; });
  }));

  // Popup de Sebastián Checa: fecha fija en horario de Lima, independientemente
  // de la zona horaria configurada en el dispositivo del visitante.
  const overlay = $('#getmCountdownOverlay');
  const closeButton = $('#getmCountdownClose');
  const acceptButton = $('#getmCountdownAccept');
  const target = Date.parse('2026-11-26T00:00:00-05:00');
  const celebrationEnd = Date.parse('2026-11-27T00:00:00-05:00');
  let countdownTimer = null;
  let previousFocus = null;

  if (overlay && closeButton && acceptButton && Date.now() < celebrationEnd) {
    const title = $('#getmCountdownTitle');
    const note = $('#getmCountdownNote');
    const countdownGrid = $('#getmCountdownGrid');
    const fields = {
      days: $('#getmDays'),
      hours: $('#getmHours'),
      minutes: $('#getmMinutes'),
      seconds: $('#getmSeconds')
    };
    const pad = number => String(number).padStart(2, '0');

    const updateCountdown = () => {
      const remaining = Math.max(0, target - Date.now());
      const seconds = Math.floor(remaining / 1000);
      fields.days.textContent = pad(Math.floor(seconds / 86400));
      fields.hours.textContent = pad(Math.floor((seconds % 86400) / 3600));
      fields.minutes.textContent = pad(Math.floor((seconds % 3600) / 60));
      fields.seconds.textContent = pad(seconds % 60);

      if (remaining <= 0) {
        title.innerHTML = '¡Llegó el <span>26 de noviembre!</span>';
        note.textContent = '¡Un saludo especial a Sebastián Checa, fundador de GETM!';
        countdownGrid.setAttribute('aria-label', '¡Llegó el día especial!');
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    };

    const closeCountdown = () => {
      overlay.hidden = true;
      document.body.classList.remove('modal-open');
      if (countdownTimer !== null) clearInterval(countdownTimer);
      countdownTimer = null;
      if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
    };

    previousFocus = document.activeElement;
    overlay.hidden = false;
    document.body.classList.add('modal-open');
    updateCountdown();
    if (Date.now() < target) countdownTimer = setInterval(updateCountdown, 1000);
    closeButton.addEventListener('click', closeCountdown);
    acceptButton.addEventListener('click', closeCountdown);
    overlay.addEventListener('click', e => { if (e.target === overlay) closeCountdown(); });
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        closeMenu();
        if (!overlay.hidden) { event.preventDefault(); closeCountdown(); }
        return;
      }
      if (overlay.hidden || event.key !== 'Tab') return;
      // Todos los controles de foco del diálogo están explícitamente declarados.
      const focusables = [closeButton, acceptButton];
      const current = focusables.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) { event.preventDefault(); focusables[1].focus(); }
      else if (!event.shiftKey && current === focusables.length - 1) { event.preventDefault(); focusables[0].focus(); }
    });
    closeButton.focus();
  } else {
    // Si la fecha ya pasó, no mostrar un contador obsoleto.
    if (overlay) overlay.hidden = true;
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
  }
})();
