// api/subscribe-university.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { email, course = 'Clases de Historia' } = req.body || {};
  const courseName = String(course).trim() || 'Clases de Historia';

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Dirección de email inválida' });
  }

  // Check for environment variables
  const { ZOHO_EMAIL, ZOHO_PASSWORD } = process.env;

  if (!ZOHO_EMAIL || !ZOHO_PASSWORD) {
    console.error('Missing ZOHO_EMAIL or ZOHO_PASSWORD environment variables');
    return res.status(500).json({ error: 'Error de configuración del servidor' });
  }

  try {
    // Create reusable transporter object using Zoho's SMTP transport
    const transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: ZOHO_EMAIL,
        pass: ZOHO_PASSWORD,
      },
    });

    // Send mail to yourself (admin) or the user? 
    // Usually "Inscribite" implies notifying the admin.
    // We can also send a confirmation to the user.
    
    // 1. Email to Admin (YOU/FABRICIO)
    await transporter.sendMail({
      from: `"Toxi University Bot" <${ZOHO_EMAIL}>`, // must be the authenticated user
      to: ZOHO_EMAIL, // Send to yourself to know someone subscribed. Or a different admin email.
      subject: `Nueva Inscripción - ${courseName}: ${email}`,
      text: `Hola,\n\nUna nueva persona se ha interesado en el curso "${courseName}":\n\nEmail: ${email}\n\nFecha: ${new Date().toLocaleString()}`,
      html: `
        <div style="font-family: sans-serif; color: #333;">
            <h2>Nueva Inscripción Recibida</h2>
        <p><strong>Curso:</strong> ${courseName}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
            <hr>
            <p>Este es un mensaje automático de Toxi University Web.</p>
        </div>
      `,
    });

    // Optional: Email to User (Confirmation)
    // Uncomment if desired, but check spam rates first.
    /*
    await transporter.sendMail({
      from: `"Toxi University" <${ZOHO_EMAIL}>`,
      to: email,
      subject: '¡Gracias por tu interés en Toxi University!',
      text: 'Hola,\n\nHemos recibido tu solicitud de inscripción. Pronto te contactaremos con más información sobre los horarios y aranceles.\n\nSaludos,\nEl equipo de Toxi University',
      html: '<p>Gracias por tu interés...</p>'
    });
    */

    return res.status(200).json({ success: true, message: 'Email enviado correctamente' });
  } catch (error) {
    console.error('Error sending email via Zoho:', error);
    return res.status(500).json({ error: 'Error al enviar el email' });
  }
}
