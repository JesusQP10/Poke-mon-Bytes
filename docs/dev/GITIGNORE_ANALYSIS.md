# Análisis de .gitignore

## Archivos Sin Trackear Actualmente

### ✅ COMMITEAR (Necesarios para el proyecto)

#### Documentación
```
docs/.gitignore                    ✅ Commitear
docs/README.md                     ✅ Commitear
docs/api-tests.http                ✅ Commitear
docs/backend/                      ✅ Commitear (4.97 MB - PDFs y diagramas)
docs/dev/                          ✅ Commitear
docs/tiled/                        ✅ Commitear
```

#### Assets del Juego (Necesarios)
```
pokemon-frontend/public/assets/game/audio/              ✅ Commitear (6 MB total)
pokemon-frontend/public/assets/game/battle/             ✅ Commitear
pokemon-frontend/public/assets/game/overworld/sprites/  ✅ Commitear
pokemon-frontend/public/assets/game/overworld/tiles/    ✅ Commitear
```

#### Código Funcional
```
pokemon-frontend/scripts/                               ✅ Commitear
pokemon-frontend/src/phaser/sistemas/SistemaSecuencias.js  ✅ Commitear
pokemon-frontend/src/phaser/ui/UISeleccionStarter.js    ✅ Commitear
```

---

### ⚠️ OPCIONAL (Refactorización - No se usa todavía)

```
pokemon-frontend/src/phaser/config/         ⚠️ Opcional
pokemon-frontend/src/phaser/managers/       ⚠️ Opcional
pokemon-frontend/src/phaser/data/           ⚠️ Opcional
pokemon-frontend/src/phaser/utils/          ⚠️ Opcional
pokemon-frontend/src/store/slices/          ⚠️ Opcional
pokemon-frontend/src/store/usarJuegoStoreRefactorizado.js  ⚠️ Opcional
pokemon-frontend/src/utils/                 ⚠️ Opcional
```

**Decisión:** Puedes commitearlos (no hacen daño) o ignorarlos por ahora.

---

### ❌ NO COMMITEAR (Añadir al .gitignore)

#### Archivos Generados
```
pokemon-frontend/public/assets/game/overworld/tiles/exports/  ❌ Generados por script
```

**Razón:** Se generan automáticamente desde los `.tmx` con el script `generarMapas.js`

#### Archivos de Tiled (Opcionales)
```
pokemon-frontend/public/assets/game/overworld/tiles/sheets/*.tsx  ❌ Opcional
```

**Razón:** Archivos de configuración de Tiled, pueden regenerarse

---

## Recomendaciones para .gitignore

### 1. Archivos Generados

```gitignore
# ========== Generated Files ==========
# Mapas generados automáticamente desde Tiled
pokemon-frontend/public/assets/game/overworld/tiles/exports/
```

### 2. Archivos de Tiled (Opcional)

```gitignore
# ========== Tiled Map Editor ==========
# Archivos de configuración de tilesets (se regeneran)
*.tsx
```

### 3. Assets Grandes (Si usas Git LFS)

Si los assets son muy pesados, considera usar Git LFS:

```gitignore
# ========== Large Assets (usar Git LFS) ==========
# Archivos de audio grandes
*.mp3
*.ogg
*.wav

# Archivos de imagen grandes
*.png
*.jpg
*.gif
```

**PERO:** Solo si instalas Git LFS. Si no, commitea los assets normalmente.

---

## Análisis de Tamaño

### Assets del Frontend
- **Total:** 6.22 MB
- **Audio:** ~6 MB (3 archivos MP3)
- **Sprites/Tilesets:** ~0.22 MB

### Documentación del Backend
- **Total:** 4.97 MB
- **PDFs:** 5 archivos
- **Diagramas:** 8 imágenes PNG

### Total a Commitear
- **~11 MB** (sin refactorización)
- **~11.5 MB** (con refactorización)

**Conclusión:** Tamaño razonable para Git normal (sin LFS).

---

## Recomendación Final

### .gitignore Actualizado

Añadir estas líneas al final del `.gitignore`:

```gitignore
# ========== Generated Files ==========
# Mapas JSON generados automáticamente desde Tiled
pokemon-frontend/public/assets/game/overworld/tiles/exports/*.json

# ========== Tiled Map Editor ==========
# Archivos de configuración de tilesets (se regeneran desde Tiled)
*.tsx

# ========== Refactorización (Opcional) ==========
# Descomentar si NO quieres commitear la refactorización
# pokemon-frontend/src/phaser/config/
# pokemon-frontend/src/phaser/managers/
# pokemon-frontend/src/phaser/data/
# pokemon-frontend/src/phaser/utils/
# pokemon-frontend/src/store/slices/
# pokemon-frontend/src/store/usarJuegoStoreRefactorizado.js
# pokemon-frontend/src/utils/
```

---

## Checklist de Commit

### ✅ Commitear
- [x] Documentación (docs/)
- [x] Assets del juego (audio, sprites, tilesets)
- [x] Código funcional (escenas, sistemas, UI)
- [x] Scripts útiles (generarMapas.js)
- [ ] Refactorización (opcional)

### ❌ NO Commitear
- [x] Archivos generados (exports/*.json)
- [x] Archivos de configuración de Tiled (*.tsx)
- [x] node_modules/ (ya en .gitignore)
- [x] dist/ (ya en .gitignore)

---

## Comandos Útiles

### Ver tamaño de archivos
```bash
# Ver tamaño de assets
du -sh pokemon-frontend/public/assets/

# Ver tamaño de docs
du -sh docs/

# Ver archivos grandes
find . -type f -size +1M -not -path "*/node_modules/*" -not -path "*/.git/*"
```

### Limpiar archivos generados
```bash
# Eliminar exports generados
rm -rf pokemon-frontend/public/assets/game/overworld/tiles/exports/*.json

# Regenerar desde Tiled
cd pokemon-frontend
npm run generate-maps
```

---

## Git LFS (Opcional)

Si los assets crecen mucho (>50 MB), considera Git LFS:

```bash
# Instalar Git LFS
git lfs install

# Trackear archivos grandes
git lfs track "*.mp3"
git lfs track "*.ogg"
git lfs track "*.png"

# Commitear .gitattributes
git add .gitattributes
git commit -m "chore: configurar Git LFS para assets"
```

**NOTA:** Solo necesario si el proyecto crece mucho.
