"""
Genera el feature graphic para Google Play Store: 1024x500px
"""
from PIL import Image, ImageDraw, ImageFont
from pathlib import Path

OUT = Path(__file__).parent / "feature-graphic.png"
W, H = 1024, 500

# Colores
BG = (0, 0, 0)
WHITE = (255, 255, 255)
GRAY = (90, 90, 90)

img = Image.new("RGB", (W, H), BG)
draw = ImageDraw.Draw(img)

# --- Logo TOXI Media (pegar imagen si existe) ---
logo_path = Path(__file__).parent / "public" / "toxi-logo-white.png"
if logo_path.exists():
    logo = Image.open(logo_path).convert("RGBA")
    # Escalar al 30% del ancho
    scale = (W * 0.30) / logo.width
    nw, nh = int(logo.width * scale), int(logo.height * scale)
    logo = logo.resize((nw, nh), Image.LANCZOS)
    x = (W - nw) // 2
    y = int(H * 0.22)
    img.paste(logo, (x, y), logo)
    text_y = y + nh + 38
else:
    text_y = H // 2 - 30

# --- Subtítulo "TV" ---
try:
    font_path = Path(__file__).parent / "public" / "HelveticaNowDisplay-Bold.otf"
    font_big   = ImageFont.truetype(str(font_path), 64)
    font_small = ImageFont.truetype(str(font_path), 22)
    font_tag   = ImageFont.truetype(str(font_path), 14)
except:
    font_big   = ImageFont.load_default()
    font_small = font_big
    font_tag   = font_big

# "TV" debajo del logo
label = "TV"
bb = draw.textbbox((0, 0), label, font=font_big)
lw = bb[2] - bb[0]
draw.text(((W - lw) // 2, text_y), label, font=font_big, fill=WHITE)

# Tagline
tag = "CONTENIDO ORIGINAL PARA ANDROID TV"
bb2 = draw.textbbox((0, 0), tag, font=font_tag)
tw = bb2[2] - bb2[0]
draw.text(((W - tw) // 2, text_y + 80), tag, font=font_tag, fill=GRAY)

# Línea decorativa
lx = W // 2
draw.line([(lx - 24, text_y + 68), (lx + 24, text_y + 68)], fill=GRAY, width=1)

img.save(OUT, "PNG", optimize=True)
print(f"Guardado: {OUT}  ({img.width}x{img.height})")
