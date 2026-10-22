// api/signup.js
import nodemailer from 'nodemailer';
import { Redis } from '@upstash/redis';

const ADMIN_RECIPIENTS = ['jmcafferata@gmail.com', 'fabro.san@gmail.com'];
const EMAIL_RE = /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/;
const ALLOWED_HOSTS = ['toxi.media', 'www.toxi.media', 'localhost', '127.0.0.1'];

const IP_LIMIT = 5;
const IP_WINDOW_SECONDS = 60 * 60;
const GLOBAL_DAILY_LIMIT = 300;

function isAllowedOrigin(req) {
  const source = req.headers.origin || req.headers.referer;
  if (!source) return false;
  try {
    return ALLOWED_HOSTS.includes(new URL(source).hostname);
  } catch {
    return false;
  }
}

function getIp(req) {
  const fwd = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || '';
  return String(fwd).split(',')[0].trim() || req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!isAllowedOrigin(req)) {
    return res.status(403).json({ error: 'Origen no permitido' });
  }

  const body = req.body || {};

  // Honeypot: los bots completan este campo oculto; respondemos OK sin enviar nada.
  if (body.website) {
    return res.status(200).json({ success: true });
  }

  const email = String(body.email || '').trim();
  const isUniversity = req.query?.kind === 'university';
  const courseName = (String(body.course || '').trim() || 'Clases de Historia').replace(/[\r\n]/g, ' ').slice(0, 100);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return res.status(400).json({ error: 'Dirección de email inválida' });
  }

  const { ZOHO_EMAIL, ZOHO_PASSWORD, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  if (!ZOHO_EMAIL || !ZOHO_PASSWORD || !UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    console.error('Missing ZOHO or UPSTASH environment variables');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  const redis = new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN });
  const emailKey = `signup:${isUniversity ? 'uni:' + courseName.toLowerCase() : 'email'}:${email.toLowerCase()}`;
  let emailReserved = false;

  try {
    const ipKey = `signup:ip:${getIp(req)}`;
    const ipCount = await redis.incr(ipKey);
    if (ipCount === 1) await redis.expire(ipKey, IP_WINDOW_SECONDS);
    if (ipCount > IP_LIMIT) {
      return res.status(429).json({ error: 'Demasiados intentos. Probá más tarde.' });
    }

    const dayKey = `signup:global:${new Date().toISOString().slice(0, 10)}`;
    const dayCount = await redis.incr(dayKey);
    if (dayCount === 1) await redis.expire(dayKey, 60 * 60 * 24);
    if (dayCount > GLOBAL_DAILY_LIMIT) {
      return res.status(429).json({ error: 'Servicio saturado. Probá más tarde.' });
    }

    // Una sola bienvenida por dirección; no revelamos si ya existía.
    const reserved = await redis.set(emailKey, Date.now(), { nx: true });
    if (!reserved) {
      return res.status(200).json({ success: true });
    }
    emailReserved = true;

    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true,
      auth: { user: ZOHO_EMAIL, pass: ZOHO_PASSWORD },
    });
    const from = `"TOXI Media" <${ZOHO_EMAIL}>`;

    if (isUniversity) {
      const when = new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' });
      await transporter.sendMail({
        from: `"Toxi University Bot" <${ZOHO_EMAIL}>`,
        to: ZOHO_EMAIL,
        subject: `Nueva Inscripción - ${courseName}: ${email}`,
        text: `Nueva persona interesada en el curso "${courseName}":\n\nEmail: ${email}\nFecha: ${when}`,
      });
      return res.status(200).json({ success: true, message: 'Email enviado correctamente' });
    }

    await transporter.sendMail({
      from,
      to: ADMIN_RECIPIENTS,
      subject: `Nuevo registro en TOXI Media: ${email}`,
      text: `Nueva persona registrada.\n\nEmail: ${email}\nFecha: ${new Date().toLocaleString('es-AR', { timeZone: 'America/Argentina/Buenos_Aires' })}`,
    });

    await transporter.sendMail({
      from,
      to: email,
      subject: '¡Bienvenido/a a TOXI Media!',
      text: 'Bienvenido/a a TOXI Media.\n\nYa podés explorar todo nuestro contenido: https://toxi.media/content\n\nEl equipo de TOXI Media',
      html: `
        <div style="font-family: Helvetica, Arial, sans-serif; color: #111; max-width: 480px; margin: 0 auto; padding: 24px;">
          <h1 style="margin: 0 0 16px;">¡Bienvenido/a a TOXI Media!</h1>
          <p>Gracias por sumarte. Ya podés explorar todo nuestro contenido.</p>
          <p style="margin: 28px 0;">
            <a href="https://toxi.media/content" style="background: #000; color: #fff; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ir al contenido</a>
          </p>
          <p style="color: #666; font-size: 0.9rem;">El equipo de TOXI Media</p>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in signup:', error);
    if (emailReserved) await redis.del(emailKey).catch(() => {});
    return res.status(500).json({ error: 'Error al enviar el email' });
  }
}
