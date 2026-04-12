"""
scraper_ig.py — Extrae acordionistas de Instagram y los vuelca al CSV de casting.

Estrategia:
  1. Busca hashtags definidos en HASHTAGS y extrae posts recientes.
  2. Extrae seguidores/seguidos de cuentas semilla definidas en SEED_ACCOUNTS.
  3. Filtra perfiles cuya bio o nombre contiene palabras clave de KEYWORDS.
  4. Escribe los nuevos contactos en acordionistas_contactos.csv (sin duplicar).

Uso:
  python scraper_ig.py

Requiere variables de entorno (o editar directamente aquí):
  IG_TOXI_USERNAME
  IG_TOXI_PASSWORD
"""

import csv
import os
import time
import random
import uuid
from instagrapi import Client
from instagrapi.exceptions import LoginRequired, UserNotFound, ClientError

# ------ CONFIGURACIÓN ------------------------------------------------------------------------------------------------------------------------

IG_USERNAME = os.getenv("IG_TOXI_USERNAME", "toxi.media")
IG_PASSWORD = os.getenv("IG_TOXI_PASSWORD", "chisteinterno113!")
# sessionid extraída del navegador (sin URL-encoding)
IG_SESSIONID = "54344379129:IWaEVmenIBDsy9:24:AYiAN083t29rnFgU5sq6TjiTny3LqIFiBopzfqZy4I8"
IG_USER_ID = IG_SESSIONID.split(":")[0]  # "54344379129"

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(BASE_DIR, "acordionistas_contactos.csv")
SESSION_FILE = os.path.join(BASE_DIR, "ig_session.json")

# Cuentas cuya lista de seguidos/seguidores se va a explorar
SEED_ACCOUNTS = [
    "acordeoneslatinos",
    "acordeon_arg",
    "festivalcosquin",
    "festivaljm",        # Festival Jesús María
    "folkloredelmundo",
]

# Hashtags a rastrear (sin #)
HASHTAGS = [
    "acordeon",
    "acordeonista",
    "bandoneon",
    "folkloroargentino",
    "tangomusico",
    "acordeoncito",
    "musica_folklorica",
]

# Palabras clave en bio/nombre para considerar el perfil relevante
KEYWORDS = [
    "acorde",   # cubre acordeon/acordeonista
    "bandone",
    "folklo",
    "tango",
    "musico",
    "música",
    "instrumentista",
    "profesor de acorde",
]

# Límite de perfiles a extraer por fuente (conservador para evitar ban)
MAX_PER_HASHTAG = 15   # máx posts por hashtag
MAX_PER_SEED = 30      # máx seguidos por cuenta semilla
MAX_TOTAL = 40         # tope duro de perfiles nuevos por sesión (IG detecta >50 acciones/hora)

# ------ HELPERS ------------------------------------------------------------------------------------------------------------------------------------

def pausa(larga=False):
    """
    Pausa aleatoria para simular comportamiento humano.
    - Normal (entre acciones): 20–45 seg
    - Larga (entre fuentes):   3–6 min
    """
    if larga:
        t = random.uniform(180, 360)
        print(f"    [pausa larga {int(t//60)}m {int(t%60)}s — simulando humano...]")
    else:
        t = random.uniform(20, 45)
    time.sleep(t)


def cargar_existentes():
    """Carga los handles ya presentes en el CSV para no duplicar."""
    existentes = set()
    if not os.path.exists(CSV_FILE):
        return existentes
    with open(CSV_FILE, mode="r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            ig = row.get("Instagram", "").strip().lstrip("@").lower()
            if ig:
                existentes.add(ig)
    return existentes


def guardar_contacto(row_dict):
    """Agrega una fila al CSV. Crea cabeceras si el archivo está vacío."""
    fieldnames = ["Nombre", "Categoria", "Pais", "Mail_Contacto", "Instagram", "Estado_Casting"]
    file_exists = os.path.exists(CSV_FILE) and os.path.getsize(CSV_FILE) > 0
    with open(CSV_FILE, mode="a", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        if not file_exists:
            writer.writeheader()
        writer.writerow(row_dict)


def es_relevante(user_info):
    """Devuelve True si la bio o nombre del usuario contiene palabras clave."""
    texto = (
        (user_info.full_name or "").lower()
        + " "
        + (user_info.biography or "").lower()
    )
    return any(kw.lower() in texto for kw in KEYWORDS)


def perfil_a_row(user_info):
    """Convierte un objeto UserShort/UserInfo a dict para el CSV."""
    nombre = user_info.full_name or user_info.username
    ig_handle = f"@{user_info.username}"
    # Intentar extraer mail de la bio
    import re
    email_match = re.search(
        r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+",
        user_info.biography or "",
    )
    mail = email_match.group(0) if email_match else ""
    return {
        "Nombre": nombre,
        "Categoria": "artista",
        "Pais": "",
        "Mail_Contacto": mail,
        "Instagram": ig_handle,
        "Estado_Casting": "A contactar",
    }


# ------ SCRAPING ----------------------------------------------------------------------------------------------------------------------------------

def scrape_hashtag(cl, tag, existentes, contador):
    nuevos = 0
    print(f"  [#] Hashtag #{tag} ...")
    try:
        medias = cl.hashtag_medias_v1(tag, amount=MAX_PER_HASHTAG, tab_key="recent")
        for media in medias:
            if contador[0] >= MAX_TOTAL:
                print(f"  [!] Tope de {MAX_TOTAL} contactos alcanzado. Deteniendo.")
                return nuevos
            username = media.user.username.lower()
            if username in existentes:
                continue
            pausa()
            try:
                info = cl.user_info(media.user.pk)
                if es_relevante(info):
                    guardar_contacto(perfil_a_row(info))
                    existentes.add(username)
                    nuevos += 1
                    contador[0] += 1
                    print(f"      + {username} ({info.full_name}) [{contador[0]}/{MAX_TOTAL}]")
            except (UserNotFound, ClientError) as e:
                print(f"      [!] Error info {username}: {e}")
                pausa()  # pausa extra en errores para no insistir rápido
    except ClientError as e:
        print(f"  [!] Error en hashtag {tag}: {e}")
    return nuevos


def scrape_seed(cl, seed_username, existentes, contador):
    nuevos = 0
    print(f"  [@] Seguidos de @{seed_username} ...")
    try:
        seed_id = cl.user_id_from_username(seed_username)
        pausa()
        followings = cl.user_following(seed_id, amount=MAX_PER_SEED)
        for uid, user in followings.items():
            if contador[0] >= MAX_TOTAL:
                print(f"  [!] Tope de {MAX_TOTAL} contactos alcanzado. Deteniendo.")
                return nuevos
            username = user.username.lower()
            if username in existentes:
                continue
            pausa()
            try:
                info = cl.user_info(uid)
                if es_relevante(info):
                    guardar_contacto(perfil_a_row(info))
                    existentes.add(username)
                    nuevos += 1
                    contador[0] += 1
                    print(f"      + {username} ({info.full_name}) [{contador[0]}/{MAX_TOTAL}]")
            except (UserNotFound, ClientError) as e:
                print(f"      [!] Error info {username}: {e}")
                pausa()  # pausa extra en errores
    except (UserNotFound, ClientError) as e:
        print(f"  [!] Error en seed @{seed_username}: {e}")
    return nuevos


# ------ MAIN ------------------------------------------------------------------------------------------------------------------------------------------

def main():
    print("=== SCRAPER IG CASTING ACORDEONISTAS — @toxi.media ===\n")

    cl = Client()

    # Inyectar sessionid sin llamar al endpoint /login/ (evita bloqueo por IP)
    print(f"Autenticando como @{IG_USERNAME} via sessionid (sin login)...")
    settings = {
        "cookies": {
            "sessionid": IG_SESSIONID,
            "ds_user_id": IG_USER_ID,
        },
        "uuids": {
            "phone_id": str(uuid.uuid4()),
            "uuid": str(uuid.uuid4()),
            "client_session_id": str(uuid.uuid4()),
            "advertising_id": str(uuid.uuid4()),
            "android_device_id": "android-" + uuid.uuid4().hex[:16],
            "request_id": str(uuid.uuid4()),
            "tray_session_id": str(uuid.uuid4()),
        },
        "device_settings": {
            "app_version": "269.0.0.18.75",
            "android_version": 26,
            "android_release": "8.0.0",
            "dpi": "480dpi",
            "resolution": "1080x1920",
            "manufacturer": "OnePlus",
            "device": "devitron",
            "model": "6T Dev",
            "cpu": "qcom",
            "version_code": "291880914",
        },
        "user_agent": "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; OnePlus; 6T Dev; devitron; qcom; en_US; 291880914)",
        "last_login": time.time(),
        "authorization_data": {
            "ds_user_id": IG_USER_ID,
            "sessionid": IG_SESSIONID,
        },
    }
    cl.set_settings(settings)
    cl._user_id = int(IG_USER_ID)
    cl._username = IG_USERNAME
    # inyectar en sesión privada
    cl.private.cookies.set("sessionid", IG_SESSIONID, domain=".instagram.com", path="/")
    cl.private.cookies.set("ds_user_id", IG_USER_ID, domain=".instagram.com", path="/")
    print("Sesión inyectada. Sin llamadas a /login/.\n")

    existentes = cargar_existentes()
    print(f"\nContactos ya en CSV: {len(existentes)}\n")

    total = 0
    contador = [0]  # contador compartido por referencia

    print("---- Fase 1: Hashtags ----")
    for tag in HASHTAGS:
        if contador[0] >= MAX_TOTAL:
            break
        n = scrape_hashtag(cl, tag, existentes, contador)
        total += n
        pausa(larga=True)  # 3–6 min entre hashtags

    print("\n---- Fase 2: Cuentas semilla ----")
    for seed in SEED_ACCOUNTS:
        if contador[0] >= MAX_TOTAL:
            break
        n = scrape_seed(cl, seed, existentes, contador)
        total += n
        pausa(larga=True)  # 3–6 min entre seeds

    print(f"\nOK Scraping finalizado. Nuevos contactos agregados: {total}")
    print(f"  CSV: {CSV_FILE}")
    print(f"\n  Recomendación: esperá al menos 24hs antes de volver a correr.")


if __name__ == "__main__":
    main()

