"""
Convierte los tilesets en escala de grises del decompilado pokegold
a PNGs en color listos para usar en Tiled / Phaser.

Uso: python colorizar_tilesets.py
"""
import re
import os
import numpy as np
from PIL import Image

SRC = r"c:\Users\jesus\OneDrive\Documentos\Escritorio\Pokémon Bytes\JesusQP10 pokegold master gfx-tilesets"
DST_INT = r"c:\Users\jesus\OneDrive\Documentos\Escritorio\Pokémon Bytes\pokemon-frontend\public\assets\game\overworld\tiles\sheets\interiors"
DST_EXT = r"c:\Users\jesus\OneDrive\Documentos\Escritorio\Pokémon Bytes\pokemon-frontend\public\assets\game\overworld\tiles\sheets\overworld"

os.makedirs(DST_INT, exist_ok=True)
os.makedirs(DST_EXT, exist_ok=True)

# ── 1. Parsear bg_tiles.pal ───────────────────────────────────────────────────
# Formato: RGB r0,g0,b0, r1,g1,b1, r2,g2,b2, r3,g3,b3 ; nombre_color
# Valores GBC: 0-31 → multiplicar ×8 para obtener 0-255
def parsear_paleta(ruta):
    paletas = {}  # { "day": { "gray": [(r,g,b), ...×4], ... }, ... }
    tod = None
    with open(ruta, encoding="utf-8") as f:
        for linea in f:
            s = linea.strip()
            if s.startswith("; "):
                tod = s[2:].strip().lower()
                paletas.setdefault(tod, {})
            elif s.startswith("RGB") and tod:
                m = re.match(r"RGB\s+([\d,\s]+)\s*;\s*(\w+)", s)
                if m:
                    nums = [int(x.strip()) for x in m.group(1).strip().split(",")]
                    nombre = m.group(2).lower()
                    colores = [(nums[i*3]*8, nums[i*3+1]*8, nums[i*3+2]*8) for i in range(4)]
                    paletas[tod][nombre] = colores
    return paletas

# ── 2. Parsear *_palette_map.asm ──────────────────────────────────────────────
# Formato: \ttilepal 0, PAL, PAL, ..., PAL  (8 paletas por línea)
def parsear_mapa_paleta(ruta):
    tiles = []
    with open(ruta, encoding="utf-8") as f:
        for linea in f:
            m = re.match(r"\s*tilepal\s+\d+,\s*(.*)", linea)
            if m:
                nombres = [n.strip().lower() for n in m.group(1).split(",")]
                tiles.extend(nombres)
    return tiles

# ── 3. Colorizar tileset ──────────────────────────────────────────────────────
# Valores de gris → índice de color en la paleta
# 255 (blanco)   → color 0 (más claro)
# 170            → color 1
#  85            → color 2
#   0 (negro)    → color 3 (más oscuro)
GRIS_A_IDX = {255: 0, 170: 1, 85: 2, 0: 3}

def colorizar(ruta_png, ruta_pal_map, set_paleta, escala=2):
    img = Image.open(ruta_png)
    arr = np.array(img)       # (H, W) uint8 con valores 0/85/170/255
    H, W = arr.shape
    tiles_x = W // 8

    mapa = parsear_mapa_paleta(ruta_pal_map)

    out = np.zeros((H, W, 4), dtype=np.uint8)  # RGBA

    for idx, nombre_pal in enumerate(mapa):
        tx = (idx % tiles_x) * 8
        ty = (idx // tiles_x) * 8
        if ty + 8 > H:
            break

        colores = set_paleta.get(nombre_pal) or set_paleta.get("gray")
        if colores is None:
            continue

        tile = arr[ty:ty+8, tx:tx+8]
        for py in range(8):
            for px in range(8):
                cidx = GRIS_A_IDX.get(int(tile[py, px]), 3)
                r, g, b = colores[cidx]
                # Color 0 (lightest background) → transparente para permitir capas
                a = 0 if cidx == 0 else 255
                out[ty+py, tx+px] = (r, g, b, a)

    resultado = Image.fromarray(out, "RGBA")
    if escala != 1:
        resultado = resultado.resize((W * escala, H * escala), Image.NEAREST)
    return resultado

# ── 4. Lista de tilesets a procesar ──────────────────────────────────────────
# (archivo.png, archivo_palette_map.asm, tiempo_del_dia, carpeta_destino, nombre_salida)
TILESETS = [
    # Interiores
    ("players_room.png",    "players_room_palette_map.asm",    "indoor", DST_INT, "players_room.png"),
    ("players_house.png",   "players_house_palette_map.asm",   "indoor", DST_INT, "players_house.png"),
    ("house.png",           "house_palette_map.asm",           "indoor", DST_INT, "house.png"),
    ("lab.png",             "lab_palette_map.asm",             "indoor", DST_INT, "lab.png"),
    ("pokecenter.png",      "pokecenter_palette_map.asm",      "indoor", DST_INT, "pokecenter.png"),
    ("mart.png",            "mart_palette_map.asm",            "indoor", DST_INT, "mart.png"),
    ("traditional_house.png","traditional_house_palette_map.asm","indoor",DST_INT,"traditional_house.png"),
    ("gate.png",            "gate_palette_map.asm",            "indoor", DST_INT, "gate.png"),
    ("game_corner.png",     "game_corner_palette_map.asm",     "indoor", DST_INT, "game_corner.png"),
    ("underground.png",     "underground_palette_map.asm",     "indoor", DST_INT, "underground.png"),
    ("tower.png",           "tower_palette_map.asm",           "indoor", DST_INT, "tower.png"),
    ("lighthouse.png",      "lighthouse_palette_map.asm",      "indoor", DST_INT, "lighthouse.png"),
    ("radio_tower.png",     "radio_tower_palette_map.asm",     "indoor", DST_INT, "radio_tower.png"),
    # Exteriores
    ("johto.png",           "johto_palette_map.asm",           "day",    DST_EXT, "johto.png"),
    ("johto_modern.png",    "johto_modern_palette_map.asm",    "day",    DST_EXT, "johto_modern.png"),
    ("kanto.png",           "kanto_palette_map.asm",           "day",    DST_EXT, "kanto.png"),
    ("forest.png",          "forest_palette_map.asm",          "day",    DST_EXT, "forest.png"),
    ("cave.png",            "cave_palette_map.asm",            "nite",   DST_EXT, "cave.png"),
    ("park.png",            "park_palette_map.asm",            "day",    DST_EXT, "park.png"),
    ("port.png",            "port_palette_map.asm",            "day",    DST_EXT, "port.png"),
    ("ruins_of_alph.png",   "ruins_of_alph_palette_map.asm",  "day",    DST_EXT, "ruins_of_alph.png"),
    ("mansion.png",         "mansion_palette_map.asm",         "nite",   DST_EXT, "mansion.png"),
    ("ice_path.png",        "ice_path_palette_map.asm",        "nite",   DST_EXT, "ice_path.png"),
]

# ── 5. Ejecutar ───────────────────────────────────────────────────────────────
def main():
    pal_ruta = os.path.join(SRC, "bg_tiles.pal")
    todas_paletas = parsear_paleta(pal_ruta)
    print(f"Paletas cargadas: {list(todas_paletas.keys())}\n")

    ok = 0
    for png, pal_map, tod, destino, nombre_salida in TILESETS:
        ruta_png = os.path.join(SRC, png)
        ruta_pal = os.path.join(SRC, pal_map)

        if not os.path.exists(ruta_png):
            print(f"  [SKIP] {png} — no encontrado")
            continue
        if not os.path.exists(ruta_pal):
            print(f"  [SKIP] {png} — falta {pal_map}")
            continue

        set_pal = todas_paletas.get(tod) or todas_paletas.get("day")
        try:
            img = colorizar(ruta_png, ruta_pal, set_pal, escala=2)
            out_path = os.path.join(destino, nombre_salida)
            img.save(out_path)
            print(f"  [OK] {nombre_salida} → {img.width}×{img.height}px ({tod})")
            ok += 1
        except Exception as e:
            print(f"  [ERR] {png}: {e}")

    print(f"\n✓ {ok}/{len(TILESETS)} tilesets procesados.")
    print(f"\nInteriores → {DST_INT}")
    print(f"Exteriores → {DST_EXT}")

if __name__ == "__main__":
    main()
