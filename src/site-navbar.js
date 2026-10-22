// Barra superior compartida: logo + saldo de créditos.
// Se incluye con <script type="module" src="./src/site-navbar.js"></script>.
// Solo muestra el saldo; los créditos se consumen y se compran en /content.
import { createWallet } from './credits.js';

const SESSION_KEY = 'toxi.session';

const css = `
.site-navbar {
  position: fixed; top: 0; left: 0; right: 0; z-index: 90; height: 52px;
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 20px; box-sizing: border-box;
  background: rgba(15, 15, 15, 0.88); backdrop-filter: blur(8px);
  border-bottom: 1px solid #303030;
  font-family: 'Roboto', 'Helvetica Neue', Helvetica, Arial, sans-serif;
}
.site-navbar-logo { display: flex; align-items: center; }
.site-navbar-logo img { height: 20px; width: auto; display: block; }
.site-navbar-credits {
  display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
  border: 1px solid #303030; border-radius: 18px; background: #181818; color: #f1f1f1;
  font-size: 0.82rem; font-weight: 500; white-space: nowrap; text-decoration: none;
}
.site-navbar-credits:hover { background: #2a2a2a; }
.site-navbar-credits.low { border-color: #f5a524; }
.site-navbar-credits.empty { border-color: #ff4e45; color: #ff8a84; }
.back-link { display: none !important; }
@media (max-width: 600px) {
  .site-navbar { padding: 0 14px; }
  .site-navbar-credits { padding: 6px 10px; }
  .site-navbar-credits-label { display: none; }
}
`;

function mount() {
  if (document.querySelector('.site-navbar')) return;

  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const nav = document.createElement('nav');
  nav.className = 'site-navbar';
  nav.innerHTML = `
    <a class="site-navbar-logo" href="/" aria-label="TOXI Media"><img src="/toxi-logo-white.png" alt="TOXI Media"></a>
    <a class="site-navbar-credits" href="/content">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>
      <span><span class="site-navbar-credits-count">–</span><span class="site-navbar-credits-label"> créditos</span></span>
    </a>`;
  document.body.prepend(nav);

  const wallet = createWallet();
  const pill = nav.querySelector('.site-navbar-credits');
  const count = nav.querySelector('.site-navbar-credits-count');

  function render(balance = wallet.getBalance()) {
    count.textContent = balance.credits;
    pill.classList.toggle('empty', !balance.canWatch);
    pill.classList.toggle('low', balance.canWatch && balance.credits < 3);
    pill.title = `${balance.credits} créditos (${balance.free} gratis de hoy, ${balance.paid} comprados)`;
  }

  wallet.subscribe(render);
  window.addEventListener('storage', event => wallet.handleStorageEvent(event));
  setInterval(() => render(), 30000);
  render();

  // Con sesión, el saldo real está en la cuenta (servidor).
  const token = localStorage.getItem(SESSION_KEY);
  if (token) {
    fetch('/api/create-preference', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purpose: 'creditos-saldo', token }),
    })
      .then(async response => {
        if (response.status === 401) { localStorage.removeItem(SESSION_KEY); return; }
        if (!response.ok) return;
        wallet.applyRemote((await response.json()).wallet);
      })
      .catch(() => {});
  }
}

if (document.body) mount();
else document.addEventListener('DOMContentLoaded', mount);
