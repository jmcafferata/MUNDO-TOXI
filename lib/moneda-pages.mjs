// Plantillas HTML compartidas por los endpoints de toximonedas.
const BASE_STYLE = `
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#000;color:#fff;min-height:100%;font-family:Helvetica,Arial,sans-serif;font-weight:300}
  main{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:32px}
  .brand{font-weight:bold;letter-spacing:0.2em;text-transform:uppercase;font-size:0.9rem;opacity:0.6;margin-bottom:32px}
  h1{font-weight:bold;letter-spacing:0.05em;text-transform:uppercase;font-size:1.6rem;margin-bottom:16px}
  p{max-width:420px;opacity:0.8;line-height:1.5}
`;

export function renderInvalidPage(reason) {
  const isInactive = reason === 'INACTIVA';
  const isError = reason === 'ERROR';
  const title = isInactive ? 'MONEDA DESACTIVADA' : isError ? 'ERROR TEMPORAL' : 'MONEDA NO RECONOCIDA';
  const body = isInactive
    ? 'Esta toximoneda fue desactivada y ya no es válida.'
    : isError
      ? 'No pudimos validar esta toximoneda en este momento. Probá de nuevo en unos segundos.'
      : 'No pudimos verificar esta toximoneda. Es posible que se trate de una falsificación.';

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} · TOXI MEDIA</title>
<style>${BASE_STYLE}</style>
</head>
<body>
<main>
  <div class="brand">TOXI MEDIA</div>
  <h1>${title}</h1>
  <p>${body}</p>
</main>
</body>
</html>`;
}

