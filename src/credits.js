// Billetera de créditos de reproducción (guardada en localStorage).
//
// - Cada día el usuario tiene DAILY_FREE_CREDITS créditos gratis. No se
//   acumulan: al cambiar el día se vuelven a poner en 10.
// - Los créditos comprados no vencen y se usan después de los gratis.
// - 1 crédito = SECONDS_PER_CREDIT segundos de reproducción. El crédito se
//   descuenta apenas arranca el minuto, y ese minuto se puede usar en
//   cualquier video (si cambiás de video no se pierde lo que quedaba).
//
// Cada operación vuelve a leer localStorage antes de escribir, así varias
// pestañas abiertas comparten el mismo saldo.
import { DAILY_FREE_CREDITS, SECONDS_PER_CREDIT, consumeFrom } from './credits-config.mjs';

const STORAGE_KEY = 'toxi.credits.v1';
const MAX_REMEMBERED_PAYMENTS = 200;

/** Fecha local del usuario en formato YYYY-MM-DD. */
export function todayKey(date = new Date()) {
  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function memoryStorage() {
  const data = new Map();
  return {
    getItem: key => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, String(value)),
  };
}

function safeStorage() {
  try {
    const probe = '__toxi_credits_probe__';
    window.localStorage.setItem(probe, probe);
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    return memoryStorage();
  }
}

const toCount = (value, fallback = 0) => (Number.isFinite(value) && value >= 0 ? value : fallback);

export function createWallet({ storage = safeStorage(), now = () => new Date() } = {}) {
  const listeners = new Set();

  function read() {
    let saved = null;
    try { saved = JSON.parse(storage.getItem(STORAGE_KEY)); } catch { saved = null; }
    const today = todayKey(now());
    const sameDay = saved?.day === today;
    return {
      day: today,
      free: sameDay ? Math.min(DAILY_FREE_CREDITS, toCount(saved.free, DAILY_FREE_CREDITS)) : DAILY_FREE_CREDITS,
      paid: Math.floor(toCount(saved?.paid)),
      secondsLeft: Math.min(SECONDS_PER_CREDIT, toCount(saved?.secondsLeft)),
      redeemed: Array.isArray(saved?.redeemed) ? saved.redeemed.map(String) : [],
      pending: Array.isArray(saved?.pending) ? saved.pending.map(String) : [],
    };
  }

  function write(state) {
    state.redeemed = state.redeemed.slice(-MAX_REMEMBERED_PAYMENTS);
    try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* sin espacio: seguimos en memoria */ }
    listeners.forEach(fn => fn(snapshot(state)));
  }

  function snapshot(state = read()) {
    return {
      free: state.free,
      paid: state.paid,
      credits: state.free + state.paid,
      secondsLeft: state.secondsLeft,
      canWatch: state.secondsLeft > 0 || state.free + state.paid > 0,
    };
  }

  return {
    getBalance: () => snapshot(),

    /**
     * Descuenta segundos reproducidos. Cada vez que se termina un minuto (o si
     * no había ninguno en curso) se cobra el crédito del minuto siguiente,
     * primero de los gratis y después de los comprados.
     * `consume(0)` solo se asegura de que haya un minuto en curso.
     * Devuelve false si se quedó sin saldo.
     */
    consume(seconds = 0) {
      const state = read();
      const ok = consumeFrom(state, seconds);
      write(state);
      return ok;
    },

    /**
     * Reemplaza el saldo por el de la cuenta (servidor). `extraSeconds` son
     * segundos ya vistos que el servidor todavía no recibió.
     */
    applyRemote(remote, extraSeconds = 0) {
      const state = read();
      state.free = Math.min(DAILY_FREE_CREDITS, toCount(remote?.free));
      state.paid = Math.floor(toCount(remote?.paid));
      state.secondsLeft = Math.min(SECONDS_PER_CREDIT, toCount(remote?.secondsLeft));
      if (extraSeconds > 0) consumeFrom(state, extraSeconds);
      write(state);
    },

    markRedeemed(paymentId) {
      const id = String(paymentId);
      const state = read();
      state.pending = state.pending.filter(p => p !== id);
      if (!state.redeemed.includes(id)) state.redeemed.push(id);
      write(state);
    },

    /** Suma créditos comprados. Cada pago se acredita una sola vez. */
    addPurchasedCredits(paymentId, credits) {
      const id = String(paymentId);
      const state = read();
      state.pending = state.pending.filter(p => p !== id);
      if (state.redeemed.includes(id) || !(credits > 0)) {
        write(state);
        return false;
      }
      state.paid += Math.floor(credits);
      state.redeemed.push(id);
      write(state);
      return true;
    },

    isRedeemed: paymentId => read().redeemed.includes(String(paymentId)),

    /** Pagos pendientes (ej. efectivo) que hay que volver a consultar. */
    getPendingPayments: () => read().pending,
    addPendingPayment(paymentId) {
      const id = String(paymentId);
      const state = read();
      if (!state.pending.includes(id) && !state.redeemed.includes(id)) {
        state.pending.push(id);
        write(state);
      }
    },
    removePendingPayment(paymentId) {
      const id = String(paymentId);
      const state = read();
      state.pending = state.pending.filter(p => p !== id);
      write(state);
    },

    /** Avisa cada vez que cambia el saldo (en esta pestaña o en otra). */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    /** Llamar cuando otra pestaña modifica localStorage. */
    handleStorageEvent(event) {
      if (event.key === STORAGE_KEY) listeners.forEach(fn => fn(snapshot()));
    },
  };
}
