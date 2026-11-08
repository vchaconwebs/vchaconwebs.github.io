(function () {
  var root = document.documentElement;

  function store(key, value) {
    try { value === null ? localStorage.removeItem(key) : localStorage.setItem(key, value); } catch (e) {}
  }

  /* ---- Tema claro / oscuro ---- */
  var themeBtn = document.getElementById('theme-toggle');
  function isDark() {
    if (root.dataset.theme) return root.dataset.theme === 'dark';
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  }
  themeBtn.addEventListener('click', function () {
    var next = isDark() ? 'light' : 'dark';
    root.dataset.theme = next;
    store('vc-theme', next);
  });

  /* ---- Modo plano ---- */
  var modeBtn = document.getElementById('mode-toggle');
  function syncMode() { modeBtn.setAttribute('aria-pressed', root.dataset.mode === 'plano' ? 'true' : 'false'); }
  syncMode();
  modeBtn.addEventListener('click', function () {
    if (root.dataset.mode === 'plano') { delete root.dataset.mode; store('vc-mode', null); }
    else { root.dataset.mode = 'plano'; store('vc-mode', 'plano'); }
    syncMode();
  });

  /* ---- Avance de obra (progreso de lectura) ---- */
  var fill = document.getElementById('progress-fill');
  var num = document.getElementById('progress-num');
  var ticking = false;
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    var p = max > 0 ? Math.min(100, Math.max(0, Math.round(window.scrollY / max * 100))) : 100;
    fill.style.width = p + '%';
    num.textContent = p + '%';
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { ticking = true; requestAnimationFrame(updateProgress); }
  }, { passive: true });
  updateProgress();

  /* ---- "Cintado" se rellena con la cinta al cargar ---- */
  var outline = document.querySelector('.name__line--outline');
  if (outline && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setTimeout(function () { outline.classList.add('is-built'); }, 900);
    setTimeout(function () { outline.classList.remove('is-built'); }, 2600);
  }

  /* ---- Copiar correo ---- */
  var copyBtn = document.getElementById('copy-email');
  var addr = document.getElementById('email-addr');
  var msg = document.getElementById('copy-msg');
  copyBtn.addEventListener('click', function () {
    var text = addr.textContent.trim();
    function selectFallback() {
      var r = document.createRange(); r.selectNodeContents(addr);
      var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      msg.textContent = 'Seleccionado. Pulsa Ctrl+C para copiarlo.';
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () {
        msg.textContent = 'Correo copiado al portapapeles.';
        copyBtn.textContent = 'Copiado';
        setTimeout(function () { copyBtn.textContent = 'Copiar'; }, 2000);
      }, selectFallback);
    } else { selectFallback(); }
  });

  /* ---- Año ---- */
  var y = document.getElementById('year');
  if (y) y.textContent = new Date().getFullYear();
})();
