
function isRunningAsPWA() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         window.navigator.standalone === true;
}

export function initPaywall({ musicFile, onEnter }) {
  // If running as installed PWA, skip paywall entirely
  if (isRunningAsPWA()) {
    console.log('[TOXI] PWA detectada - saltando paywall');
    // Show enter button directly without paywall
    setTimeout(() => {
      const enterHtml = `
        <div id="enter-overlay" class="enter-overlay">
          <button id="enter-button" class="enter-button">ENTRAR</button>
        </div>
      `;
      document.body.insertAdjacentHTML('afterbegin', enterHtml);
      
      const enterOverlay = document.getElementById('enter-overlay');
      const enterBtn = document.getElementById('enter-button');
      
      enterOverlay.style.cssText = 'opacity: 1; visibility: visible; background-color: #000; display: flex;';
      
      enterBtn.addEventListener('click', () => {
        enterOverlay.style.transition = 'opacity 3s ease, visibility 3s ease';
        enterBtn.style.transition = 'opacity 1s ease';
        enterBtn.style.opacity = '0';
        enterBtn.style.pointerEvents = 'none';
        
        setTimeout(() => {
          if (onEnter) onEnter();
          if (musicFile) {
            const audio = new Audio(musicFile);
            audio.loop = true;
            audio.volume = 0.5;
            audio.play().catch(e => console.log("Play error", e));
            window.currentAudio = audio;
          }
          enterOverlay.style.opacity = '0';
          setTimeout(() => {
            enterOverlay.style.visibility = 'hidden';
          }, 3000);
        }, 1100);
      });
    }, 0);
    return;
  }

  // Inject HTML if not present
  if (!document.getElementById('paywall')) {
    const html = `
    <div id="paywall" class="paywall-overlay" role="dialog" aria-modal="true">
      <div class="paywall-cards-container">
        <div class="paywall-card">
          <h1>Pase diario</h1>
          <div class="paywall-price">$100 ARS · 24h</div>
          <p>Accedé a la experiencia completa de TOXI por un día.</p>
          <div class="paywall-actions">
            <button id="paywall-cta" class="paywall-button">Entrar con Mercado Pago</button>
            <div class="paywall-note">Pagos procesados de forma segura por Mercado Pago.</div>
          </div>
        </div>
        <div class="paywall-card">
          <h1>Instalar la App</h1>
          <div class="paywall-price">$1000 ARS</div>
          <p>Descargá la aplicación de TOXI para tenerla siempre disponible.</p>
          <div class="paywall-actions">
            <button id="paywall-app-cta" class="paywall-button paywall-button-app">Comprar con Mercado Pago</button>
            <div class="paywall-note">Acceso permanente a la app.</div>
          </div>
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
        <div class="keypad-grid" id="keypad-grid">
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
  // Determine correct base path for sounds
  // Strategy: Try to resolve relative to module first (works for file://), 
  // then fallback to root-relative 'sounds/' (works for Vite serve)
  let soundBase = '../public/sounds/'; 
  
  // If we are likely in a server environment (http/https), Vite serves public at root
  if (window.location.protocol.startsWith('http')) {
    // In Vite dev or preview, 'sounds/' is at root. 
    // But if we are in a subfolder deployment, it might vary.
    // Let's test the root Sound path first as it's the standard for Vite.
    soundBase = 'sounds/';
  }

  function createSound(filename) {
    const s = new Audio(soundBase + filename);
    s.onerror = (e) => {
      // If the first attempt fails, try the alternative
      console.warn(`Sound ${filename} failed at ${soundBase}, trying alternative.`);
      if (soundBase === 'sounds/') {
        soundBase = '../public/sounds/'; // Switch to relative-to-src structure
      } else {
        soundBase = 'sounds/'; // Switch to root-relative structure
      }
      s.src = soundBase + filename;
    };
    return s;
  }

  const soundBass = createSound('bass_key.mp3');
  const soundCello = createSound('cello_key.mp3');
  const soundViola = createSound('viola_key.mp3');
  const soundViolin = createSound('violin_key.mp3');
  const soundWrong = createSound('wrong.mp3');
  const soundCorrect = createSound('correct.mp3');

  // Preload sounds
  [soundBass, soundCello, soundViola, soundViolin, soundWrong, soundCorrect].forEach(s => s.load());

  function playKeySound(key) {
      let baseSound;
      let rate = 1.0;
      const n = parseInt(key);

      if (key === 'clear' || key === 'enter') {
        // Use a generic click (e.g. high pitch bass) to feedback action
        baseSound = soundBass;
        rate = 1.5;
      } else if (key === '0') {
        baseSound = soundViolin;
        rate = 1.0;
      } else if (n >= 1 && n <= 3) {
        baseSound = soundBass;
        // 1->0.8, 2->1.0, 3->1.2
        rate = 0.8 + ((n - 1) * 0.2);
      } else if (n >= 4 && n <= 6) {
        baseSound = soundCello;
        // 4->0.8, 5->1.0, 6->1.2
        rate = 0.8 + ((n - 4) * 0.2);
      } else if (n >= 7 && n <= 9) {
        baseSound = soundViola;
        // 7->0.8, 8->1.0, 9->1.2
        rate = 0.8 + ((n - 7) * 0.2);
      } else {
        // Fallback
        baseSound = soundBass;
      }

      console.log('Playing key:', key, 'Rate:', rate);
      
      const s = baseSound.cloneNode(); 
      s.volume = 0.5;
      s.playbackRate = rate;
      // Force preserve pitch = false if we want chipmunk effect? 
      // Usually playbackRate changes pitch by default on Audio elements unless preservesPitch is set (which is true by default usually).
      s.preservesPitch = false; 
      
      s.play().catch(err => console.warn('Audio play failed:', err));
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
    // Skip create enter button and directly enter
    if (onEnter) onEnter();
    playMusic();
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
  
  // Allow resetting via URL parameter for testing
  if (params.get('reset')) {
    localStorage.removeItem(ENTRY_STORAGE_KEY);
    console.log('[TOXI] Session reset via URL parameter');
  }

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

  // App purchase button reference (needed for long press setup)
  const appCta = document.getElementById('paywall-app-cta');

  // Long press para abrir keypad
  let pressTimer = null;
  let touchHandled = false;
  let keypadMode = 'daily'; // 'daily' or 'app'

  function setupLongPress(button, mode) {
    button?.addEventListener('mousedown', () => {
      pressTimer = setTimeout(() => {
        openKeypad(mode);
      }, 3000);
    });

    button?.addEventListener('mouseup', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });

    button?.addEventListener('mouseleave', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
    });

    button?.addEventListener('touchstart', (e) => {
      touchHandled = false;
      pressTimer = setTimeout(() => {
        touchHandled = true;
        openKeypad(mode);
        e.preventDefault();
      }, 3000);
    }, { passive: false });

    button?.addEventListener('touchend', (e) => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      if (touchHandled) {
        e.preventDefault();
        touchHandled = false;
      }
    }, { passive: false });

    button?.addEventListener('touchcancel', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      touchHandled = false;
    });

    button?.addEventListener('touchmove', () => {
      if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
      }
      touchHandled = false;
    });
  }

  setupLongPress(cta, 'daily');
  setupLongPress(appCta, 'app');

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

  // App purchase button handler
  appCta?.addEventListener('click', async () => {
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
        successUrl: `${window.location.origin}/app.html`,
        failUrl: `${window.location.origin}${window.location.pathname}`,
        title: 'Instalar App TOXI',
        price: 1000
      };

      console.info('[TOXI][MP] Creando preferencia para App...', payload);
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
  const keypadModal = document.getElementById('keypad-modal') || document.getElementById('keypad-modal-main');
  const keypadClose = document.getElementById('keypad-close');
  const keypadDots = document.getElementById('keypad-dots');
  const keypadCard = document.querySelector('.keypad-card');
  const keypadBtns = document.querySelectorAll('.keypad-btn');
  const SECRET_CODE = '2058';
  let currentCode = '';
  let successUnlocked = false;

  function openKeypad(mode = 'daily') {
    keypadMode = mode;
    console.log('Opening keypad, playing popup sound');
    const s = soundPopup.cloneNode();
    s.volume = 0.5;
    s.play().catch(e => console.warn('Popup sound failed', e));
    
    successUnlocked = false;
    keypadCard?.classList.remove('success');
    keypadDots.classList.remove('success');
    keypadBtns.forEach(btn => {
      btn.disabled = false;
      btn.classList.remove('success');
    });
    keypadModal?.classList.remove('hidden');
    currentCode = '';
    updateDots();
  }

  function closeKeypad(force = false) {
    if (successUnlocked && !force) return;
    keypadModal?.classList.add('hidden');
    currentCode = '';
    updateDots();
  }

  function updateDots() {
    if (!keypadDots) return;
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
    console.log('Code correct! Playing success sound');
    const s = soundCorrect.cloneNode();
    s.volume = 0.6;
    s.play().catch(e => console.warn('Success sound failed', e));
    
    persistEntry(); // Save the entry so main.html doesn't redirect back to index
    successUnlocked = true;
    keypadCard?.classList.add('success');
    keypadDots?.classList.add('success');
    keypadBtns.forEach(btn => {
      btn.disabled = true;
      btn.classList.add('success');
    });
  }

  function checkCode() {
    if (currentCode === SECRET_CODE) {
      markSuccess();
      setTimeout(() => {
        closeKeypad(true);
        if (keypadMode === 'app') {
          window.location.href = '/app.html';
        } else {
          // Take to main as requested
          window.location.href = '/main.html';
        }
      }, 1200);
    } else {
      console.log('Code wrong! Playing error sound');
      const s = soundWrong.cloneNode();
      s.volume = 0.5;
      s.play().catch(e => console.warn('Wrong sound failed', e));
      
      // Shake animation on error
      if (keypadDots) keypadDots.style.animation = 'shake 0.5s';
      setTimeout(() => {
        if (keypadDots) keypadDots.style.animation = '';
        currentCode = '';
        updateDots();
      }, 500);
    }
  }

  keypadClose?.addEventListener('click', closeKeypad);

  function handleInput(key) {
    if (successUnlocked) return;
    
    // Validate key is valid or return early for invalid input if called directly
    if (key !== 'clear' && key !== 'enter' && !(key.length === 1 && key >= '0' && key <= '9')) {
      return; 
    }

    playKeySound(key);
    
    if (key === 'clear') {
      currentCode = currentCode.slice(0, -1);
      updateDots();
    } else if (key === 'enter') {
      if (currentCode.length === 4) {
        checkCode();
      }
    } else {
      // Digit handling
      if (currentCode.length < 4) {
        currentCode += key;
        updateDots();
        if (currentCode.length === 4) {
          setTimeout(() => checkCode(), 300);
        }
      }
    }
  }

  keypadBtns.forEach(btn => {
    // Stop propagation of pointer events to prevent clicks from reaching the canvas behind
    btn.addEventListener('pointerdown', (e) => e.stopPropagation());
    btn.addEventListener('pointerup', (e) => e.stopPropagation());
    btn.addEventListener('mousedown', (e) => e.stopPropagation());
    btn.addEventListener('mouseup', (e) => e.stopPropagation());

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const key = btn.dataset.key;
      handleInput(key);
    });
  });

  // Support for keyboard/remote control
  document.addEventListener('keydown', (e) => {
    if (successUnlocked) return;
    // Don't interfere with inputs if any exist
    if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;

    // Check if keypad represents the main interaction or if it is currently visible
    // In index.html keypad-modal-main is usually visible. 
    // If it's the popup version (keypad-modal), we check if it has 'hidden' class removed?
    // The variable keeping track of open/close is implied by CSS classes.
    // However, since handleInput checks successUnlocked, and we can check visibility if needed.
    // Let's check visibility of the active modal.
    const activeModal = document.querySelector('.keypad-card:not(.hidden)');
    // If keypad is hidden (e.g. by css display none, or parent hidden), we might want to skip.
    // But currently logical visibility is primarily controlled via class 'hidden' on parent wrapper OR handled by layout in index.html.
    // index.html keypad doesn't use 'hidden' class on container by default.
    // So we assume it's always ready to accept input unless the paywall is gone?
    // But paywall goes away when `paid` is true. `initPaywall` logic inside `paid` check -> `showEnterButton`.
    // If user has paid, keypad might still be in DOM but maybe obscured?
    // In index.html: <div id="main-container" class="entry-container"> ... <div class="entry-hero"> ... keypad ...
    // If paid, `showEnterButton` is called. `paywall` element (with price cards) is part of `entry-paywall` div which is separate from `entry-hero`.
    // The keypad is always on screen in index.html.
    
    const key = e.key;
    if (key >= '0' && key <= '9') {
        handleInput(key);
    } else if (key === 'Backspace' || key === 'Delete') {
        handleInput('clear');
    } else if (key === 'Enter') {
        handleInput('enter');
    }
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
