# Guía de Commit

## Resumen Rápido

### ✅ SÍ Commitear (11 MB)
- Documentación completa
- Assets del juego (audio, sprites, tilesets)
- Código funcional
- Scripts útiles

### ❌ NO Commitear (Ignorados)
- Archivos generados (exports/*.json)
- Archivos de Tiled (*.tsx)
- node_modules/, dist/ (ya ignorados)

### ⚠️ Opcional (Tú decides)
- Archivos de refactorización (no se usan todavía)

---

## Opción 1: Commit Conservador (RECOMENDADO)

Solo lo esencial, sin refactorización:

```bash
# 1. Añadir código funcional
git add pokemon-frontend/src/phaser/escenas/
git add pokemon-frontend/src/phaser/entidades/
git add pokemon-frontend/src/phaser/sistemas/
git add pokemon-frontend/src/phaser/ui/
git add pokemon-frontend/src/store/usarJuegoStore.js

# 2. Añadir assets
git add pokemon-frontend/public/assets/
git add pokemon-frontend/scripts/

# 3. Añadir documentación
git add docs/
git add README.md
git add .gitignore

# 4. Añadir eliminaciones
git add -u

# 5. Commit
git commit -m "feat: implementar intro y sistema de mapas

- Añadir pantalla de intro con Profesor Oak
- Implementar sistema de entrada de nombre
- Crear mapas iniciales (habitación, casa, laboratorio)
- Añadir sistema de diálogo
- Implementar movimiento del jugador
- Añadir assets (audio, sprites, tilesets)
- Reorganizar documentación en docs/
- Limpiar assets no utilizados"
```

---

## Opción 2: Commit Completo

Todo incluyendo refactorización:

```bash
# Añadir todo
git add .

# Commit
git commit -m "feat: implementar intro + propuesta de refactorización

- Implementar sistema de intro completo
- Añadir assets del juego
- Reorganizar documentación
- Añadir propuesta de refactorización modular"
```

---

## Opción 3: Commits Separados (MÁS LIMPIO)

```bash
# Commit 1: Funcionalidad del juego
git add pokemon-frontend/src/phaser/escenas/
git add pokemon-frontend/src/phaser/entidades/
git add pokemon-frontend/src/phaser/sistemas/
git add pokemon-frontend/src/phaser/ui/
git add pokemon-frontend/src/store/usarJuegoStore.js
git commit -m "feat: implementar sistema de intro y mapas

- Pantalla de intro con Profesor Oak
- Sistema de entrada de nombre
- Mapas iniciales (habitación, casa, lab)
- Sistema de diálogo
- Movimiento del jugador"

# Commit 2: Assets
git add pokemon-frontend/public/assets/
git add pokemon-frontend/scripts/
git commit -m "feat: añadir assets del juego

- Audio (BGM de mapas, SFX)
- Sprites del jugador y NPCs
- Tilesets de mapas
- Script de generación de mapas"

# Commit 3: Documentación
git add docs/
git add README.md
git commit -m "docs: reorganizar documentación

- Crear estructura docs/ organizada
- Añadir documentación del backend
- Añadir notas de desarrollo
- Actualizar README principal"

# Commit 4: Limpieza
git add .gitignore
git add -u
git commit -m "chore: limpiar proyecto

- Actualizar .gitignore
- Eliminar assets no utilizados
- Mover archivos a ubicaciones correctas"
```

---

## Verificación Pre-Commit

### 1. Ver qué se va a commitear
```bash
git status
```

### 2. Verificar archivos eliminados
```bash
# Ver archivos eliminados del índice
git status --short | grep "^D"

# Archivos esperados:
# D .vscode/launch.json                    ✅ Correcto (IDE)
# D .vscode/settings.json                  ✅ Correcto (IDE)
# D pokemon-backend/Documentación-fases/   ✅ Correcto (movido a docs/)
# D test-api.http                          ✅ Correcto (movido a docs/)
# D TilesetColorizer.java                  ✅ Correcto (temporal)
# D pokemon-frontend/public/assets/...     ✅ Correcto (limpieza)
```

### 3. Ver diferencias
```bash
git diff --cached
```

### 3. Ver tamaño del commit
```bash
git diff --cached --stat
```

### 4. Verificar que no hay secretos
```bash
# Buscar posibles secretos
git diff --cached | grep -i "password\|secret\|key\|token"
```

---

## Después del Commit

### 1. Verificar el commit
```bash
git log -1 --stat
```

### 2. Ver el tamaño
```bash
git show --stat
```

### 3. Si algo salió mal
```bash
# Deshacer último commit (mantener cambios)
git reset --soft HEAD~1

# Deshacer último commit (eliminar cambios)
git reset --hard HEAD~1
```

---

## Archivos Ignorados Automáticamente

Gracias al `.gitignore` actualizado, estos archivos NO se commitearán:

```
❌ pokemon-frontend/public/assets/game/overworld/tiles/exports/*.json
❌ *.tsx
❌ node_modules/
❌ dist/
❌ *.log
❌ .env
```

---

## Checklist Final

Antes de commitear, verifica:

- [ ] La app funciona correctamente
- [ ] No hay archivos con secretos/contraseñas
- [ ] Los assets son necesarios
- [ ] La documentación está actualizada
- [ ] El .gitignore está correcto
- [ ] Has leído el mensaje de commit

---

## Comandos Útiles

### Ver archivos sin trackear
```bash
git status --short | grep "^??"
```

### Ver archivos modificados
```bash
git status --short | grep "^ M"
```

### Ver archivos eliminados
```bash
git status --short | grep "^ D"
```

### Ver tamaño del repositorio
```bash
git count-objects -vH
```

---

## Recomendación Final

**Usa la Opción 3 (Commits Separados)** para tener un historial limpio y profesional.

Si tienes prisa, usa la **Opción 1 (Conservador)** que es segura y rápida.
