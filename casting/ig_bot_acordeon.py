import time
import csv
import random
import os
from instagrapi import Client

# Credenciales de Instagram (@toxi.media)
IG_USERNAME = os.getenv("IG_TOXI_USERNAME", "toxi.media")  # completar o setear variable de entorno
IG_PASSWORD = os.getenv("IG_TOXI_PASSWORD", "chisteinterno113!")  # actualizar si cambia

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "acordionistas_contactos.csv")
HISTORIAL_FILE = os.path.join(BASE_DIR, "dms_enviados.txt")

# --- PLANTILLAS PARA MENSAJES DIRECTOS (DMs) ---

MSG_ARTISTA = (
    "¡Hola! 👋 Te escribimos desde @toxi.media — somos productores de contenido y "
    "estamos armando un casting de acordionistas para una producción audiovisual. "
    "¿Te animás a mandarnos un video tuyo tocando? Puede ser de 1 a 3 minutos, algo "
    "sencillo que muestre tu estilo. Si te interesa, respondé este mensaje y te "
    "pasamos los detalles. ¡Gracias!"
)

MSG_ESCUELA = (
    "¡Hola equipo! 🎵 Escribimos desde @toxi.media. Estamos convocando acordionistas "
    "de todo el país para un proyecto audiovisual. ¿Tienen alumnos o egresados que "
    "quieran participar de un casting? La propuesta es simple: grabar un video de 1 a "
    "3 minutos tocando y mandárnoslo. ¿Nos ayudarían a difundir la convocatoria? "
    "¡Muchísimas gracias!"
)

MSG_BANDA = (
    "¡Hola! 🎶 Les escribimos desde @toxi.media — estamos haciendo una convocatoria "
    "para acordionistas para un proyecto audiovisual. ¿El/la acordionista de su banda "
    "estaría interesado/a en mandarnos un video casting tocando? Solo un video de 1 a "
    "3 minutos grabado con el celular está perfecto. Respondan este mensaje si les "
    "interesa. ¡Gracias!"
)


def get_ig_template(categoria):
    cat_lower = categoria.lower()
    if any(k in cat_lower for k in ["escuela", "academia", "conservatorio", "instituto"]):
        return MSG_ESCUELA
    elif any(k in cat_lower for k in ["banda", "grupo", "orquesta"]):
        return MSG_BANDA
    else:
        return MSG_ARTISTA


def run_ig_bot():
    print("Iniciando sesión en Instagram como @toxi.media...")
    cl = Client()

    try:
        cl.login(IG_USERNAME, IG_PASSWORD)
        print("¡Sesión iniciada con éxito!")
    except Exception as e:
        print(f"Error al iniciar sesión: {e}")
        return

    # Historial de DMs enviados
    if os.path.exists(HISTORIAL_FILE):
        with open(HISTORIAL_FILE, "r") as f:
            enviados = set(f.read().splitlines())
    else:
        enviados = set()

    with open(CSV_FILE, mode="r", encoding="utf-8") as file:
        reader = csv.DictReader(file)

        for row in reader:
            ig_handle = row.get("Instagram", "").strip()
            nombre = row.get("Nombre", "").strip()
            categoria = row.get("Categoria", "").strip()

            if ig_handle and ig_handle.startswith("@"):
                username = ig_handle.replace("@", "")

                if username in enviados:
                    print(f"[-] Saltando a {nombre} ({username}), ya se le intentó enviar mensaje.")
                    continue

                mensaje = get_ig_template(categoria)

                print(f"[>] Buscando la cuenta de {nombre} ({username})...")
                try:
                    user_id = cl.user_id_from_username(username)

                    print(f"    Enviando mensaje a {username}...")
                    cl.direct_send(mensaje, user_ids=[user_id])
                    print(f"    ¡Mensaje enviado a {username} exitosamente!")

                    with open(HISTORIAL_FILE, "a") as f:
                        f.write(username + "\n")
                    enviados.add(username)

                    # PAUSA FUNDAMENTAL (5 a 8 minutos) para evitar ban
                    pausa = random.randint(300, 480)
                    print(
                        f"[!] Pausa de seguridad de {pausa} segundos "
                        f"({pausa // 60} minutos) para no parecer spam..."
                    )
                    time.sleep(pausa)

                except Exception as e:
                    print(f"    [Error] No se pudo enviar mensaje a {username}. Detalle: {e}")
                    with open(HISTORIAL_FILE, "a") as f:
                        f.write(username + "\n")
                    enviados.add(username)
            else:
                pass  # No tiene Instagram anotado


print("=== BOT DE INSTAGRAM CASTING ACORDEONISTAS — @toxi.media ===")
run_ig_bot()
