// api/casting-venado-tuerto.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { nombre, rol, link, mensaje } = req.body || {};

  if (!nombre || !rol || !mensaje) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const { ZOHO_EMAIL, ZOHO_PASSWORD } = process.env;
  if (!ZOHO_EMAIL || !ZOHO_PASSWORD) {
    console.error('Missing ZOHO_EMAIL or ZOHO_PASSWORD');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.zoho.com',
    port: 465,
    secure: true,
    auth: { user: ZOHO_EMAIL, pass: ZOHO_PASSWORD },
  });

  const subject = `[Casting VT Musical] ${rol} — ${nombre}`;

  const html = `
    <div style="font-family:sans-serif;color:#222;max-width:560px;">
      <h2 style="margin-bottom:4px;">Propuesta de casting recibida</h2>
      <p style="color:#666;font-size:13px;margin-top:0;">Venado Tuerto — El Musical</p>
      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tr><td style="padding:6px 0;color:#999;width:120px;">Nombre</td><td style="padding:6px 0;font-weight:600;">${escHtml(nombre)}</td></tr>
        <tr><td style="padding:6px 0;color:#999;">Rol / instrumento</td><td style="padding:6px 0;">${escHtml(rol)}</td></tr>
        ${link ? `<tr><td style="padding:6px 0;color:#999;">Portfolio / redes</td><td style="padding:6px 0;"><a href="${escHtml(link)}">${escHtml(link)}</a></td></tr>` : ''}
      </table>
      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;">
      <p style="font-size:14px;white-space:pre-wrap;">${escHtml(mensaje)}</p>
      <hr style="border:none;border-top:1px solid #e0e0e0;margin:20px 0;">
      <p style="font-size:11px;color:#aaa;">Enviado desde toxi.media/venado-tuerto-el-musical · ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}</p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Casting TOXI" <${ZOHO_EMAIL}>`,
    to: ZOHO_EMAIL,
    subject,
    html,
    replyTo: undefined, // no tenemos el mail del candidato
  });

  return res.status(200).json({ ok: true });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
