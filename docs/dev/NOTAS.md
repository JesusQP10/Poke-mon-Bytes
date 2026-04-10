# Notas de Desarrollo

## Cosas por hacer

- [ ] Terminar de implementar el sistema de batalla
- [ ] Añadir más mapas (Ruta 30, Ciudad Violeta) (Opcional)
- [ ] Sistema de guardado en backend
- [ ] Implementar encuentros aleatorios
- [ ] Añadir más Pokémon salvajes
- [ ] Sistema de experiencia y subida de nivel
- [ ] Implementar movimientos de Pokémon

## Mejorar

- Separar la lógica de mapas en un MapaManager -> HECHO
- Poner todos los diálogos en un JSON 
- Dividir el store en slices (jugador, mundo, inventario, narrativa)
- Implementar un logger para reemplazar console.log ->HECHO

## Assets pendientes

- Sprites de batalla de los starters
- Música de batalla
- Efectos de sonido (pasos, menú, etc.) (Opcional)
- Sprites de NPCs
- Tilesets de interiores (Pokécenter, Tienda)

## Bugs a arreglar

- A veces el jugador se queda atascado en las colisiones
- El diálogo no se cierra correctamente en algunas ocasiones


## Optimizaciones futuras

- Lazy loading de assets
- Comprimir sprites
- Implementar sprite atlas
- Cachear mapas cargados

## Referencias

- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- [Zustand Docs](https://docs.pmnd.rs/zustand/)
- [Pokémon Gen 2 Mechanics](https://bulbapedia.bulbagarden.net/wiki/Damage)
- [Tiled Map Editor](https://www.mapeditor.org/)

## Progreso actual

### Completado ✓
- Sistema de autenticación (JWT)
- Pantalla de título
- Intro del Profesor Oak
- Sistema de entrada de nombre
- Animación de intro (sprite encogimiento)
- Habitación del jugador (bugs)
- Movimiento del jugador(bugs)
- Sistema de diálogo
- Menú in-game(desarrollo temprano)

### En progreso
- Mapas de Tiled (habitación del jugador, planta baja casa del jugador, pueblo primavera[2 localizaciones accesibles], laboratorio)
- Sistema de NPCs(sin sprites)
- Transiciones entre mapas

### Pendiente
- Sistema de batalla completo (OBLIGATORIO)
- Captura de Pokémon(Opcional)
- Tienda funcional
- Inventario
- Pokédex
- Guardado en backend(OBLIGATORIO)
