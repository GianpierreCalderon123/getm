const b=document.querySelector('.hamb'),n=document.querySelector('nav');b.onclick=()=>n.classList.toggle('open');document.querySelectorAll('nav a').forEach(a=>a.onclick=()=>n.classList.remove('open'));

// Popup GETM: cuenta regresiva al 26/11/2026 a las 00:00, hora de Lima (UTC-5).
(() => {
  const overlay = document.getElementById('getmCountdownOverlay');
  if (!overlay) return;
  const target = new Date('2026-11-26T00:00:00-05:00').getTime();
  const fields = {
    days: document.getElementById('getmDays'),
    hours: document.getElementById('getmHours'),
    minutes: document.getElementById('getmMinutes'),
    seconds: document.getElementById('getmSeconds')
  };
  const title = document.getElementById('getmCountdownTitle');
  const note = document.getElementById('getmCountdownNote');
  const closeButton = document.getElementById('getmCountdownClose');
  let timer;
  let previousFocus = null;
  const pad = value => String(value).padStart(2, '0');

  function updateCountdown() {
    const remaining = Math.max(0, target - Date.now());
    const totalSeconds = Math.floor(remaining / 1000);
    fields.days.textContent = pad(Math.floor(totalSeconds / 86400));
    fields.hours.textContent = pad(Math.floor((totalSeconds % 86400) / 3600));
    fields.minutes.textContent = pad(Math.floor((totalSeconds % 3600) / 60));
    fields.seconds.textContent = pad(totalSeconds % 60);
    if (remaining === 0) {
      title.innerHTML = '¡Llegó el <span>26 de noviembre!</span>';
      note.textContent = '¡Un saludo especial a Sebastián Checa, fundador de GETM!';
      clearInterval(timer);
    }
  }

  function closeCountdown() {
    overlay.hidden = true;
    document.body.classList.remove('getm-countdown-open');
    clearInterval(timer);
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  previousFocus = document.activeElement;
  overlay.hidden = false;
  document.body.classList.add('getm-countdown-open');
  updateCountdown();
  if (Date.now() < target) timer = setInterval(updateCountdown, 1000);
  closeButton.addEventListener('click', closeCountdown);
  document.getElementById('getmCountdownAccept').addEventListener('click', closeCountdown);
  overlay.addEventListener('click', event => { if (event.target === overlay) closeCountdown(); });
  document.addEventListener('keydown', event => {
    if (overlay.hidden) return;
    if (event.key === 'Escape') closeCountdown();
    if (event.key === 'Tab') {
      const focusables = [closeButton, document.getElementById('getmCountdownAccept')];
      const current = focusables.indexOf(document.activeElement);
      if (event.shiftKey && current <= 0) { event.preventDefault(); focusables[1].focus(); }
      else if (!event.shiftKey && current === focusables.length - 1) { event.preventDefault(); focusables[0].focus(); }
    }
  });
  closeButton.focus();
})();
