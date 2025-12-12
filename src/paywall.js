
export function initPaywall({ musicFile, onEnter }) {
  // Inject HTML if not present
  if (!document.getElementById('paywall')) {
    const html = `
    <div id="paywall" class="paywall-overlay" role="dialog" aria-modal="true">
      <div class="paywall-card">
        <h1>Pase diario</h1>
        <div class="paywall-price">$100 ARS · 24h</div>
        <p>Accedé a la experiencia completa de TOXI por un día.</p>
        <div class="paywall-actions">
          <button id="paywall-cta" class="paywall-button">Entrar con Mercado Pago</button>
          <div class="paywall-note">Pagos procesados de forma segura por Mercado Pago.</div>
        </div>
      </div>
    </div>

    <div id="enter-overlay" class="enter-overlay hidden">
      <button id="enter-button" class="enter-button">ENTRAR</button>
    </div>

    <div id="keypad-modal" class="keypad-overlay hidden">
      <div class="keypad-card">
        <button id="keypad-close" class="keypad-close">&times;</button>
        <div class="keypad-display">
          <div id="keypad-dots"></div>
        </div>
        <div class="keypad-grid">
          <button class="keypad-btn" data-key="1">1</button>
          <button class="keypad-btn" data-key="2">2</button>
          <button class="keypad-btn" data-key="3">3</button>
          <button class="keypad-btn" data-key="4">4</button>
          <button class="keypad-btn" data-key="5">5</button>
          <button class="keypad-btn" data-key="6">6</button>
          <button class="keypad-btn" data-key="7">7</button>
          <button class="keypad-btn" data-key="8">8</button>
          <button class="keypad-btn" data-key="9">9</button>
          <button class="keypad-btn keypad-clear" data-key="clear">←</button>
          <button class="keypad-btn" data-key="0">0</button>
          <button class="keypad-btn keypad-enter" data-key="enter">✓</button>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('afterbegin', html);
  }

  const ENTRY_STORAGE_KEY = 'toxi_entry_pass';
  const ENTRY_DURATION_MS = 24 * 60 * 60 * 1000; // 24 horas
  const paywall = document.getElementById('paywall');
  const cta = document.getElementById('paywall-cta');

  // Sounds
  const soundPopup = new Audio('public/sounds/popup.mp3');
  const soundKey = new Audio('public/sounds/key.mp3');
  const soundWrong = new Audio('public/sounds/wrong.mp3');
  const soundCorrect = new Audio('public/sounds/correct.mp3');

  // Preload sounds
  [soundPopup, soundKey, soundWrong, soundCorrect].forEach(s => s.load());

  function playKeySound(key) {
      const s = soundKey.cloneNode();
      if (key >= '0' && key <= '9') {
          const n = parseInt(key);
          s.playbackRate = 0.8 + (n * 0.1); 
      } else {
          s.playbackRate = 1.0;
      }
      s.volume = 0.4;
      s.play().catch(() => {});
  }

  function playMusic() {
    if (!musicFile) return;
    const audio = new Audio(musicFile);
    audio.loop = true;
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Play error", e));
    window.currentAudio = audio;
  }

  function showEnterButton() {
    const enterOverlay = document.getElementById('enter-overlay');
    const enterBtn = document.getElementById('enter-button');
    
    // 1. Kill any existing transition immediately
    enterOverlay.style.cssText = 'transition: none !important; opacity: 1 !important; visibility: visible !important; background-color: #000 !important; display: flex !important;';
    enterOverlay.classList.remove('hidden');
    
    // 2. Force reflow to apply the "no transition" state
    void enterOverlay.offsetWidth;

    // 3. Hide paywall only after we are sure the overlay is opaque
    // We use a double rAF to ensure the browser has painted the black overlay
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            paywall.classList.remove('visible');
            paywall.style.display = 'none';
        });
    });
    
    // Remove any existing listeners to avoid duplicates
    const newBtn = enterBtn.cloneNode(true);
    enterBtn.parentNode.replaceChild(newBtn, enterBtn);
    
    newBtn.addEventListener('click', () => {
      // 4. Restore transition for the fade-out effect
      // We need to remove the inline cssText that was forcing !important
      enterOverlay.style.cssText = ''; 
      enterOverlay.style.backgroundColor = '#000'; // Keep background black
      // Re-apply the transition explicitly (or let CSS handle it, but inline ensures it overrides any residual state)
      enterOverlay.style.transition = 'opacity 3s ease, visibility 3s ease';
      enterOverlay.style.opacity = '1';
      enterOverlay.style.visibility = 'visible';
      
      // Force reflow again before starting the fade out sequence
      void enterOverlay.offsetWidth;

      // 1. Fade out button
      newBtn.style.transition = 'opacity 1s ease';
      newBtn.style.opacity = '0';
      newBtn.style.pointerEvents = 'none';
      
      // 2. Wait for button fade (1000ms) + 100ms pause, then fade out overlay
      setTimeout(() => {
          if (onEnter) onEnter();
          playMusic();
          enterOverlay.classList.add('hidden');
          enterOverlay.style.opacity = '0';
          setTimeout(() => {
              enterOverlay.style.visibility = 'hidden';
          }, 3000);
      }, 1100);
    });
  }

  function showPaywall() {
    paywall.classList.add('visible');
    paywall.style.display = 'flex';
  }

  function persistEntry() {
    const now = Date.now();
    const payload = { paidAt: now, expiresAt: now + ENTRY_DURATION_MS };
    localStorage.setItem(ENTRY_STORAGE_KEY, JSON.stringify(payload));
  }

  function hasValidEntry() {
    try {
      const raw = localStorage.getItem(ENTRY_STORAGE_KEY);
      if (!raw) return false;
      const data = JSON.parse(raw);
      if (!data || typeof data.expiresAt !== 'number') return false;
      if (Date.now() > data.expiresAt) {
        localStorage.removeItem(ENTRY_STORAGE_KEY);
        return false;
      }
      return true;
    } catch (err) {
      localStorage.removeItem(ENTRY_STORAGE_KEY);
      return false;
    }
  }

  const params = new URLSearchParams(window.location.search);
  const status = (params.get('collection_status') || params.get('status') || '').toLowerCase();
  const paymentApproved = status === 'approved' || status === 'success';

  if (paymentApproved) {
    persistEntry();
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, document.title, cleanUrl);
  }

  const paid = hasValidEntry();
  if (!paid) {
    showPaywall();
  } else {
    showEnterButton();
  }

  // Long press para abrir keypad
  let pressTimer = null;
  let touchHandled = false;

  cta?.addEventListener('mousedown', () => {
    pressTimer = setTimeout(() => {
      openKeypad();
    }, 3000);
  });

  cta?.addEventListener('mouseup', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

  cta?.addEventListener('mouseleave', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  });

  cta?.addEventListener('touchstart', (e) => {
    touchHandled = false;
    pressTimer = setTimeout(() => {
      touchHandled = true;
      openKeypad();
      e.preventDefault();
    }, 3000);
  }, { passive: false });

  cta?.addEventListener('touchend', (e) => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    if (touchHandled) {
      e.preventDefault();
      touchHandled = false;
    }
  }, { passive: false });

  cta?.addEventListener('touchcancel', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    touchHandled = false;
  });

  cta?.addEventListener('touchmove', () => {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    touchHandled = false;
  });

  cta?.addEventListener('click', async () => {
    const MP_PUBLIC_KEY = window.ENV_MP_PUBLIC_KEY || 'pk_test_replace_me';
    if (!window.MercadoPago) {
      alert('Mercado Pago no está disponible. Intenta de nuevo.');
      return;
    }

    if (!MP_PUBLIC_KEY || MP_PUBLIC_KEY.includes('replace_me')) {
      alert('Configura la clave pública de Mercado Pago.');
      return;
    }

    try {
      const payload = {
        successUrl: `${window.location.origin}${window.location.pathname}`,
        failUrl: `${window.location.origin}${window.location.pathname}`,
        title: 'Pase diario TOXI',
        price: 100
      };

      console.info('[TOXI][MP] Creando preferencia...', payload);
      const resp = await fetch('/api/create-preference', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      let data = null;
      try {
        data = await resp.json();
      } catch (e) {
        console.warn('[TOXI][MP] No se pudo parsear JSON', e);
      }

      if (!resp.ok) {
        console.error('[TOXI][MP] Respuesta no OK', resp.status, resp.statusText, data);
        alert(`No se pudo iniciar el pago. Detalle: ${data?.detail || data?.error || resp.statusText || 'sin detalle'}`);
        return;
      }

      console.info('[TOXI][MP] Preferencia creada', data);
      if (!data.preferenceId) {
        console.error('[TOXI][MP] preferenceId faltante', data);
        alert(`Respuesta inválida del servidor: ${data.error || 'sin preferenceId'}`);
        return;
      }

      const mp = new MercadoPago(MP_PUBLIC_KEY, { locale: 'es-AR' });
      console.info('[TOXI][MP] Abriendo checkout con', data.preferenceId);
      mp.checkout({
        preference: { id: data.preferenceId },
        autoOpen: true
      });
    } catch (err) {
      console.error('[TOXI][MP] Error al iniciar pago', err);
      alert(`Error al iniciar el pago: ${err?.message || err}`);
    }
  });

  // Keypad functionality
  const keypadModal = document.getElementById('keypad-modal');
  const keypadClose = document.getElementById('keypad-close');
  const keypadDots = document.getElementById('keypad-dots');
  const keypadCard = document.querySelector('.keypad-card');
  const keypadBtns = document.querySelectorAll('.keypad-btn');
  const SECRET_CODE = '2058';
  let currentCode = '';
  let successUnlocked = false;

  function openKeypad() {
    soundPopup.currentTime = 0;
    soundPopup.volume = 0.5;
    soundPopup.play().catch(() => {});
    
    successUnlocked = false;
    keypadCard?.classList.remove('success');
    keypadDots.classList.remove('success');
    keypadBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('success');
    });
    keypadModal.classList.remove('hidden');
    currentCode = '';
    updateDots();
  }

  function closeKeypad(force = false) {
    if (successUnlocked && !force) return;
    keypadModal.classList.add('hidden');
    currentCode = '';
    updateDots();
  }

  function updateDots() {
    keypadDots.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const dot = document.createElement('div');
      dot.className = 'keypad-dot';
      if (i < currentCode.length) {
        dot.classList.add('filled');
      }
      keypadDots.appendChild(dot);
    }
  }

  function markSuccess() {
    soundCorrect.currentTime = 0;
    soundCorrect.volume = 0.6;
    soundCorrect.play().catch(() => {});
    
    successUnlocked = true;
    keypadCard?.classList.add('success');
    keypadDots.classList.add('success');
    keypadBtns.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('success');
    });
  }

  function checkCode() {
    if (currentCode === SECRET_CODE) {
      // No persistimos en localStorage para el código, solo para pagos.
      markSuccess();
      // Espera breve con el keypad en verde y luego muestra el botón de entrar
      setTimeout(() => {
        closeKeypad(true);
        showEnterButton();
      }, 1200);
    } else {
      soundWrong.currentTime = 0;
      soundWrong.volume = 0.5;
      soundWrong.play().catch(() => {});
      
      // Shake animation on error
      keypadDots.style.animation = 'shake 0.5s';
      setTimeout(() => {
        keypadDots.style.animation = '';
        currentCode = '';
        updateDots();
      }, 500);
    }
  }

  keypadClose?.addEventListener('click', closeKeypad);

  keypadBtns.forEach(btn => {
    // Stop propagation of pointer events to prevent clicks from reaching the canvas behind
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('pointerup', (e) => e.stopPropagation());
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('mouseup', (e) => e.stopPropagation());

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.key;
      playKeySound(key);
      
      if (key === 'clear') {
        currentCode = currentCode.slice(0, -1);
        updateDots();
      } else if (key === 'enter') {
        if (currentCode.length === 4) {
          checkCode();
        }
      } else if (currentCode.length < 4) {
        currentCode += key;
        updateDots();
        if (currentCode.length === 4) {
          setTimeout(() => checkCode(), 300);
        }
      }
    });
  });

  // Close keypad on outside click
  keypadModal?.addEventListener('click', (e) => {
    if (e.target === keypadModal) {
      closeKeypad();
    }
    e.stopPropagation();
  });
  
  // Also stop propagation on the keypad card itself
  keypadCard?.addEventListener('pointerdown', (e) => e.stopPropagation());
  keypadCard?.addEventListener('pointerup', (e) => e.stopPropagation());
  keypadCard?.addEventListener('click', (e) => e.stopPropagation());
}
