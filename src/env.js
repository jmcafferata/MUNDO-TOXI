// Expose Mercado Pago public key from Vite env to the window for inline scripts.
const pubKey = import.meta.env.VITE_MP_PUBLIC_KEY;
if (pubKey) {
  window.ENV_MP_PUBLIC_KEY = pubKey;
} else if (!window.ENV_MP_PUBLIC_KEY) {
  console.warn('VITE_MP_PUBLIC_KEY is not defined. Mercado Pago will fail.');
}

export {}; // keep module scope
