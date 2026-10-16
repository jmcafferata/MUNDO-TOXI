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
