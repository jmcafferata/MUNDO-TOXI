import smtplib
import imaplib
import email
import email.utils
import csv
import time
import re
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.header import decode_header
from email.mime.image import MIMEImage

# Configuración de Zoho Mail
SMTP_SERVER = "smtp.zoho.com"
SMTP_PORT = 465  # SSL
IMAP_SERVER = "imap.zoho.com"
IMAP_PORT = 993  # SSL

EMAIL_ACCOUNT = "admin@toxi.media"
EMAIL_PASSWORD = "FQmR8ZPd7Rvq"
NOTIFICATION_EMAIL = "fabro.san@gmail.com"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "acordionistas_contactos.csv")
LOGO_PATH = os.path.join(BASE_DIR, "toxi-logomark.jpg")  # colocar logo aquí

# --- PLANTILLAS DE CORREO EN HTML ---

SUBJECT_ARTISTA = "Casting de acordeón — convocatoria audiovisual TOXI Media"
BODY_ARTISTA_HTML = """
<html>
<body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
    <p>Hola, <b>{0}</b>.</p>

    <p>Te escribimos desde <b>TOXI Media</b> (
    <a href="https://instagram.com/toxi.media" style="color: #0088cc;">@toxi.media</a>),
    un sello de producción audiovisual independiente.</p>

    <p>Estamos convocando <b>acordionistas</b> para participar de una producción de video.
    El proceso es simple: solo necesitamos que nos mandes un <b>video tuyo tocando</b> de
    1 a 3 minutos (puede ser grabado con el celular, en cualquier lugar). Ese video funciona
    como tu casting.</p>

    <p><b>¿Cómo participar?</b></p>
    <ul>
        <li>Grabá un video tocando el acordeón (1–3 minutos, estilo libre).</li>
        <li>Subilo a Google Drive o WeTransfer y respondé este mail con el link.</li>
        <li>Incluí tu nombre, país y si tenés Instagram o web.</li>
    </ul>

    <p>Los seleccionados serán contactados en los próximos días para coordinar los siguientes
    pasos. No se requiere experiencia profesional formal, solo ganas y buen toque.</p>

    <p>¡Esperamos tu video!</p>

    <p><b>Equipo TOXI Media</b><br>
    <a href="https://instagram.com/toxi.media" style="color: #0088cc;">@toxi.media</a></p>

    <br>
    <img src="cid:logo_toxi" alt="TOXI Media" width="150" style="display: block; margin-top: 10px;">
</body>
</html>
"""

SUBJECT_ESCUELA = "Convocatoria de acordeonistas — difusión para alumnos/egresados"
BODY_ESCUELA_HTML = """
<html>
<body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
    <p>Hola, equipo de <b>{0}</b>.</p>

    <p>Les escribimos desde <b>TOXI Media</b> (
    <a href="https://instagram.com/toxi.media" style="color: #0088cc;">@toxi.media</a>),
    un sello de producción audiovisual independiente.</p>

    <p>Estamos realizando una <b>convocatoria abierta para acordionistas</b> para participar
    en una producción de video. La participación consiste en enviarnos un video de 1 a 3
    minutos tocando el instrumento a modo de casting.</p>

    <p>¿Podrían compartir esta convocatoria con sus <b>alumnos o egresados</b> que toquen
    el acordeón? Sería de gran ayuda. Para participar, solo tienen que respondernos con un
    link al video (Google Drive, WeTransfer o similar).</p>

    <p>Quedo a disposición para cualquier consulta.</p>

    <p><b>Equipo TOXI Media</b><br>
    <a href="https://instagram.com/toxi.media" style="color: #0088cc;">@toxi.media</a></p>

    <br>
    <img src="cid:logo_toxi" alt="TOXI Media" width="150" style="display: block; margin-top: 10px;">
</body>
</html>
"""

SUBJECT_BANDA = "Casting de acordeón — ¿el/la acordionista de su banda quiere participar?"
BODY_BANDA_HTML = """
<html>
<body style="font-family: Arial, sans-serif; color: #333333; line-height: 1.6;">
    <p>Hola, equipo de <b>{0}</b>.</p>

    <p>Les escribimos desde <b>TOXI Media</b> (
    <a href="https://instagram.com/toxi.media" style="color: #0088cc;">@toxi.media</a>),
    un sello de producción audiovisual independiente.</p>

    <p>Estamos armando una producción de video y necesitamos <b>acordionistas</b> para
    participar. El proceso de selección consiste en enviarnos un video de 1 a 3 minutos
    tocando (grabado con celular está perfecto, no hace falta producción especial).</p>

    <p>¿El/la acordionista de su banda estaría interesado/a? Si es así, solo tienen que
    respondernos este mail con un link al video (Google Drive o WeTransfer).</p>

    <p>¡Gracias y saludos!</p>

    <p><b>Equipo TOXI Media</b><br>
    <a href="https://instagram.com/toxi.media" style="color: #0088cc;">@toxi.media</a></p>

    <br>
    <img src="cid:logo_toxi" alt="TOXI Media" width="150" style="display: block; margin-top: 10px;">
</body>
</html>
"""


def get_template(categoria, nombre):
    cat_lower = categoria.lower()
    if any(k in cat_lower for k in ["escuela", "academia", "conservatorio", "instituto"]):
        return SUBJECT_ESCUELA, BODY_ESCUELA_HTML.format(nombre)
    elif any(k in cat_lower for k in ["banda", "grupo", "orquesta"]):
        return SUBJECT_BANDA, BODY_BANDA_HTML.format(nombre)
    else:
        return SUBJECT_ARTISTA, BODY_ARTISTA_HTML.format(nombre)


def send_email(to_email, subject, body_html):
    try:
        msg = MIMEMultipart("related")
        msg["From"] = f"TOXI Media <{EMAIL_ACCOUNT}>"
        msg["To"] = to_email
        msg["Subject"] = subject

        msg_body = MIMEText(body_html, "html", "utf-8")
        msg.attach(msg_body)

        if os.path.exists(LOGO_PATH):
            with open(LOGO_PATH, "rb") as img_file:
                img_data = img_file.read()
                image = MIMEImage(img_data, name=os.path.basename(LOGO_PATH))
                image.add_header("Content-ID", "<logo_toxi>")
                msg.attach(image)

        server = smtplib.SMTP_SSL(SMTP_SERVER, SMTP_PORT)
        server.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
        server.send_message(msg)
        server.quit()
        return True
    except Exception as e:
        print(f"Error enviando correo a {to_email}: {e}")
        return False


def send_notification(sender, original_subject):
    subject = f"NUEVA RESPUESTA Casting Acordeón — de: {sender}"
    body = (
        f"Recibiste una respuesta en admin@toxi.media de {sender}.\n"
        f"Asunto original: {original_subject}\n\n"
        f"Revisá tu bandeja de entrada de Zoho."
    )
    send_email(NOTIFICATION_EMAIL, subject, body)


def check_incoming_emails():
    print("Iniciando monitor de bandeja de entrada...")

    while True:
        try:
            mail = imaplib.IMAP4_SSL(IMAP_SERVER, IMAP_PORT)
            mail.login(EMAIL_ACCOUNT, EMAIL_PASSWORD)
            mail.select("inbox")

            status, messages = mail.search(None, "UNSEEN")
            if status == "OK":
                for num in messages[0].split():
                    typ, data = mail.fetch(num, "(RFC822)")
                    for response_part in data:
                        if isinstance(response_part, tuple):
                            msg = email.message_from_bytes(response_part[1])

                            date_tuple = email.utils.parsedate_tz(msg.get("Date"))
                            if date_tuple:
                                mail_time = email.utils.mktime_tz(date_tuple)
                                if mail_time < (time.time() - 43200):  # ignorar mails +12hs
                                    mail.store(num, "+FLAGS", "\\Seen")
                                    continue

                            sender = msg.get("From", "")
                            subject_raw = msg.get("Subject", "")
                            subject_decoded = decode_header(subject_raw)[0][0]
                            if isinstance(subject_decoded, bytes):
                                subject_str = subject_decoded.decode("utf-8", errors="ignore")
                            else:
                                subject_str = subject_decoded or ""

                            sender_lower = sender.lower()

                            # Detectar rebotes
                            if (
                                "mailer-daemon" in sender_lower
                                or "failure" in subject_str.lower()
                                or "undelivered" in subject_str.lower()
                            ):
                                print(f"[!] Rebote detectado: {subject_str}")

                                body_text = ""
                                if msg.is_multipart():
                                    for part in msg.walk():
                                        if part.get_content_type() == "text/plain":
                                            body_text += part.get_payload(decode=True).decode(
                                                "utf-8", errors="ignore"
                                            )
                                else:
                                    body_text = msg.get_payload(decode=True).decode(
                                        "utf-8", errors="ignore"
                                    )

                                email_pattern = re.compile(
                                    r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+"
                                )
                                found_emails = email_pattern.findall(body_text)
                                bounced_email = "No_detectado"
                                for e in found_emails:
                                    if e.lower() != EMAIL_ACCOUNT.lower():
                                        bounced_email = e.lower()
                                        break

                                file_rebotes = os.path.join(BASE_DIR, "rebotes.csv")
                                file_exists = os.path.exists(file_rebotes)
                                with open(file_rebotes, "a", encoding="utf-8", newline="") as f:
                                    writer = csv.writer(f)
                                    if not file_exists:
                                        writer.writerow(["Fecha", "Email_Rebotado", "Subject_Error"])
                                    writer.writerow(
                                        [time.strftime("%Y-%m-%d %H:%M:%S"), bounced_email, subject_str]
                                    )
                                print(f"[!] Guardado en rebotes.csv: {bounced_email}")
                                mail.store(num, "+FLAGS", "\\Seen")
                                continue

                            print(
                                f"[*] ¡Nuevo correo de {sender}! "
                                f"Enviando notificación a {NOTIFICATION_EMAIL}"
                            )
                            send_notification(sender, subject_str)
                            mail.store(num, "+FLAGS", "\\Seen")

                            print("[!] Pausa de 30 segundos luego de enviar alerta...")
                            time.sleep(30)

            mail.logout()
        except Exception as e:
            print(f"Error revisando correos: {e}")

        time.sleep(60)


def actualizar_csv_estado(mail_objetivo, nuevo_estado):
    try:
        filas = []
        cabeceras = []
        with open(CSV_FILE, mode="r", encoding="utf-8") as f:
            reader = csv.DictReader(f)
            cabeceras = reader.fieldnames
            for row in reader:
                if row.get("Mail_Contacto", "").strip() == mail_objetivo:
                    row["Estado_Casting"] = nuevo_estado
                filas.append(row)

        with open(CSV_FILE, mode="w", encoding="utf-8", newline="") as f:
            writer = csv.DictWriter(f, fieldnames=cabeceras)
            writer.writeheader()
            writer.writerows(filas)
    except Exception as e:
        print(f"[!] No se pudo actualizar el CSV para {mail_objetivo}. Detalle: {e}")


def mass_mailer():
    print("Iniciando envío masivo de mails (1 cada 2 minutos)...")
    enviados_file = os.path.join(BASE_DIR, "enviados.txt")

    if os.path.exists(enviados_file):
        with open(enviados_file, "r") as f:
            enviados = set(f.read().splitlines())
    else:
        enviados = set()

    with open(CSV_FILE, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            nombre = row.get("Nombre", "").strip()
            categoria = row.get("Categoria", "").strip()
            mail_contacto = row.get("Mail_Contacto", "").strip()

            if mail_contacto and "@" in mail_contacto:
                if mail_contacto in enviados:
                    print(f"[-] Saltando {nombre}, ya se le envió correo.")
                    continue

                subject, body_html = get_template(categoria, nombre)
                print(f"[>] Enviando a {nombre} ({mail_contacto})...")
                success = send_email(mail_contacto, subject, body_html)

                if success:
                    print(f"    Enviado. Esperando 2 minutos...")
                    with open(enviados_file, "a") as f:
                        f.write(mail_contacto + "\n")
                    actualizar_csv_estado(mail_contacto, "Enviado")
                    time.sleep(120)
                else:
                    print(f"    Fallo al enviar. Saltando al siguiente.")
                    actualizar_csv_estado(mail_contacto, "Error")


if __name__ == "__main__":
    import threading

    print("=== BOT DE MAIL CASTING ACORDEONISTAS — admin@toxi.media ===")
    monitor = threading.Thread(target=check_incoming_emails, daemon=True)
    monitor.start()
    mass_mailer()
    print("Envío masivo finalizado. Monitor de bandeja activo. Ctrl+C para salir.")
    monitor.join()
