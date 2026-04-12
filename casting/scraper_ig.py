"""
scraper_ig.py - Extrae acordionistas de Instagram usando requests + sessionid del browser.
NO usa instagrapi. NO llama a /accounts/login/.

Para obtener un sessionid fresco:
  1. Chrome logueado como @toxi.media en instagram.com
  2. F12 > Application > Cookies > instagram.com > copiar valor de 'sessionid'
  3. Pegarlo en IG_SESSIONID abajo
"""

import csv
import json
import os
import re
import time
import random
import requests

# --- CONFIGURACION -----------------------------------------------------------

# sessionid extraida del browser (URL-decoded)
IG_SESSIONID = "54344379129:sAsCpfIo3UQpWN:29:AYj9XAR1xwVRhpqujLyCvsdT62QCP13-Of38Bc4CcA"

HASHTAGS = [
    "acordeon",
    "acordeonista",
    "bandoneon",
    "folkloroargentino",
    "tangomusico",
    "acordeoncito",
]

SEED_ACCOUNTS = [
    "acordeoneslatinos",
    "acordeon_arg",
    "festivalcosquin",
    "folkloredelmundo",
]

KEYWORDS = ["acorde", "bandone", "folklo", "tango", "musico", "instrumentista"]

MAX_PER_HASHTAG = 12
MAX_PER_SEED    = 25
MAX_TOTAL       = 40

BASE_DIR  = os.path.dirname(os.path.abspath(__file__))
CSV_FILE  = os.path.join(BASE_DIR, "acordionistas_contactos.csv")

# --- SESION HTTP -------------------------------------------------------------

def make_session():
    s = requests.Session()
    s.cookies.set("sessionid", IG_SESSIONID, domain=".instagram.com")
    s.headers.update({
        "User-Agent":        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept":            "*/*",
        "Accept-Language":   "es-AR,es;q=0.9,en;q=0.8",
        "Referer":           "https://www.instagram.com/",
        "X-IG-App-ID":       "936619743392459",
        "X-Requested-With":  "XMLHttpRequest",
        "X-CSRFToken":       "missing",  # IG lo acepta en lecturas; se sobreescribe si hace falta
        "Content-Type":      "application/x-www-form-urlencoded",
    })
    return s

# --- HELPERS CSV -------------------------------------------------------------

def cargar_existentes():
    existentes = set()
    if not os.path.exists(CSV_FILE):
        return existentes
    with open(CSV_FILE, encoding="utf-8") as f:
        for row in csv.DictReader(f):
            ig = row.get("Instagram", "").strip().lstrip("@").lower()
            if ig:
                existentes.add(ig)
    return existentes

def guardar_contacto(row):
    fieldnames = ["Nombre", "Categoria", "Pais", "Mail_Contacto", "Instagram", "Estado_Casting"]
    nuevo = not (os.path.exists(CSV_FILE) and os.path.getsize(CSV_FILE) > 0)
    with open(CSV_FILE, "a", encoding="utf-8", newline="") as f:
        w = csv.DictWriter(f, fieldnames=fieldnames)
        if nuevo:
            w.writeheader()
        w.writerow(row)

def es_relevante(bio, nombre):
    texto = (bio or "").lower() + " " + (nombre or "").lower()
    return any(k in texto for k in KEYWORDS)

def extraer_mail(bio):
    m = re.search(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+", bio or "")
    return m.group(0) if m else ""

def pausa(larga=False):
    t = random.uniform(180, 360) if larga else random.uniform(18, 40)
    if larga:
        print(f"    [pausa {int(t//60)}m {int(t%60)}s entre fuentes...]")
    time.sleep(t)

# --- SCRAPING HASHTAG --------------------------------------------------------

def scrape_hashtag(s, tag, existentes, contador):
    nuevos = 0
    print(f"  [#] #{tag} ...")
    url = f"https://www.instagram.com/api/v1/tags/{tag}/sections/"
    payload = {"tab": "recent", "page": "1", "surface": "explore", "next_max_id": ""}
    try:
        r = s.post(url, data=payload, timeout=15)
        if r.status_code == 401:
            print("  [!] sessionid vencido o invalido. Actualizalo en el script.")
            return 0
        if r.status_code != 200:
            print(f"  [!] HTTP {r.status_code} en hashtag #{tag}")
            return 0
        data = r.json()
        medias = []
        for section in data.get("sections", []):
            layout = section.get("layout_content", {})
            medias += layout.get("medias", [])
        for item in medias[:MAX_PER_HASHTAG]:
            if contador[0] >= MAX_TOTAL:
                return nuevos
            media = item.get("media", {})
            user  = media.get("user", {})
            username = (user.get("username") or "").lower()
            if not username or username in existentes:
                continue
            nombre = user.get("full_name", "")
            bio    = user.get("biography", "")
            if not bio:
                # bio no siempre viene en el listado; fetch perfil
                pausa()
                uid = user.get("pk") or user.get("id")
                if uid:
                    rp = s.get(f"https://www.instagram.com/api/v1/users/{uid}/info/", timeout=15)
                    if rp.status_code == 200:
                        info = rp.json().get("user", {})
                        bio    = info.get("biography", "")
                        nombre = info.get("full_name", nombre)
            if es_relevante(bio, nombre):
                guardar_contacto({
                    "Nombre":         nombre or username,
                    "Categoria":      "artista",
                    "Pais":           "",
                    "Mail_Contacto":  extraer_mail(bio),
                    "Instagram":      f"@{username}",
                    "Estado_Casting": "A contactar",
                })
                existentes.add(username)
                nuevos += 1
                contador[0] += 1
                print(f"      + @{username} ({nombre}) [{contador[0]}/{MAX_TOTAL}]")
            pausa()
    except Exception as e:
        print(f"  [!] Error en #{tag}: {e}")
    return nuevos

# --- SCRAPING SEED -----------------------------------------------------------

def scrape_seed(s, seed_username, existentes, contador):
    nuevos = 0
    print(f"  [@] seguidos de @{seed_username} ...")
    # primero buscar el user_id
    try:
        r = s.get(f"https://www.instagram.com/api/v1/users/web_profile_info/?username={seed_username}",
                  timeout=15)
        if r.status_code != 200:
            print(f"  [!] No se pudo obtener perfil de @{seed_username}: HTTP {r.status_code}")
            return 0
        uid = r.json()["data"]["user"]["id"]
        pausa()
        r2 = s.get(f"https://www.instagram.com/api/v1/friendships/{uid}/following/?count={MAX_PER_SEED}",
                   timeout=15)
        if r2.status_code != 200:
            print(f"  [!] No se pudo obtener seguidos de @{seed_username}: HTTP {r2.status_code}")
            return 0
        for user in r2.json().get("users", []):
            if contador[0] >= MAX_TOTAL:
                return nuevos
            username = (user.get("username") or "").lower()
            if not username or username in existentes:
                continue
            nombre = user.get("full_name", "")
            bio    = user.get("biography", "")
            if es_relevante(bio, nombre):
                guardar_contacto({
                    "Nombre":         nombre or username,
                    "Categoria":      "artista",
                    "Pais":           "",
                    "Mail_Contacto":  extraer_mail(bio),
                    "Instagram":      f"@{username}",
                    "Estado_Casting": "A contactar",
                })
                existentes.add(username)
                nuevos += 1
                contador[0] += 1
                print(f"      + @{username} ({nombre}) [{contador[0]}/{MAX_TOTAL}]")
            pausa()
    except Exception as e:
        print(f"  [!] Error en seed @{seed_username}: {e}")
    return nuevos

# --- MAIN --------------------------------------------------------------------

def main():
    print("=== SCRAPER IG CASTING ACORDEONISTAS ===\n")
    s = make_session()

    # verificar sesion antes de arrancar
    r = s.get("https://www.instagram.com/api/v1/accounts/current_user/?edit=true", timeout=15)
    if r.status_code == 401 or (r.status_code == 200 and not r.json().get("user")):
        print("[!] sessionid invalido o vencido.")
        print("    Abri instagram.com en Chrome, F12 > Application > Cookies > copiar sessionid y pegalo en el script.")
        return
    nombre_cuenta = r.json().get("user", {}).get("username", "?")
    print(f"Sesion activa como @{nombre_cuenta}\n")

    existentes = cargar_existentes()
    print(f"Contactos ya en CSV: {len(existentes)}\n")

    total    = 0
    contador = [0]

    print("-- Fase 1: Hashtags --")
    for tag in HASHTAGS:
        if contador[0] >= MAX_TOTAL:
            break
        total += scrape_hashtag(s, tag, existentes, contador)
        pausa(larga=True)

    print("\n-- Fase 2: Cuentas semilla --")
    for seed in SEED_ACCOUNTS:
        if contador[0] >= MAX_TOTAL:
            break
        total += scrape_seed(s, seed, existentes, contador)
        pausa(larga=True)

    print(f"\nFinalizado. Nuevos contactos: {total}")
    print(f"CSV: {CSV_FILE}")
    print("Esperá al menos 24hs antes de volver a correr.")

if __name__ == "__main__":
    main()
