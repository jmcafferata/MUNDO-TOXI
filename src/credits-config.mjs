// Configuración del sistema de créditos.
// Lo importan tanto el navegador (content.html) como el servidor
// (api/create-preference.mjs), así el precio que se muestra y el que se cobra
// salen siempre del mismo lugar.

/** Créditos gratis que recibe cada usuario por día. */
export const DAILY_FREE_CREDITS = 10;

/** Segundos de reproducción que cubre cada crédito. */
export const SECONDS_PER_CREDIT = 60;

/** Paquetes de créditos a la venta (precio en ARS). */
export const CREDIT_PACKS = [
  { id: '10', credits: 10, price: 1000 },
  { id: '30', credits: 30, price: 2700 },
  { id: '60', credits: 60, price: 4800 },
];

export const findCreditPack = (id) => CREDIT_PACKS.find(pack => pack.id === String(id));

/**
 * Descuenta segundos reproducidos de `state` ({ free, paid, secondsLeft }) y lo
 * modifica en el lugar. Cada vez que se termina un minuto (o no había ninguno en
 * curso) se cobra el crédito del siguiente, primero de los gratis y después de
 * los comprados. `seconds = 0` solo asegura que haya un minuto en curso.
 * Devuelve false si se quedó sin saldo. Lo usan el navegador y el servidor.
 */
export function consumeFrom(state, seconds = 0) {
  let remaining = Math.max(0, Number(seconds) || 0);
  let ok = true;
  for (;;) {
    const used = Math.min(remaining, state.secondsLeft);
    state.secondsLeft -= used;
    remaining -= used;
    if (state.secondsLeft > 0) break;
    if (state.free > 0) state.free -= 1;
    else if (state.paid > 0) state.paid -= 1;
    else { ok = false; break; }
    state.secondsLeft = SECONDS_PER_CREDIT;
    if (remaining <= 0) break;
  }
  return ok;
}
