<div align="center">

# Pokémon Bytes

**RPG en el navegador** · Mecánicas **Gen II** (Oro / Plata) · **Phaser** + **React** · **Spring Boot** + **MySQL**

[![Gen II](https://img.shields.io/badge/mecánicas-Gen_II-3B7F78?style=for-the-badge&labelColor=1a3c34)](#)
[![Java](https://img.shields.io/badge/Java-21-ED8B00?style=for-the-badge&logo=openjdk&logoColor=white)](https://openjdk.org/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.5-6DB33F?style=for-the-badge&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![MySQL](https://img.shields.io/badge/MySQL-8-4479A1?style=for-the-badge&logo=mysql&logoColor=white)](https://www.mysql.com/)

[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vite.dev/)
[![Phaser](https://img.shields.io/badge/Phaser-3.90-8B5CF6?style=for-the-badge)](https://phaser.io/)
[![Tailwind](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Zustand](https://img.shields.io/badge/Zustand-5-FF9C00?style=for-the-badge)](https://github.com/pmndrs/zustand)
[![JWT](https://img.shields.io/badge/API-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

<br />

![Vista del proyecto](https://github.com/user-attachments/assets/1b762be8-007d-4b03-a254-1519428a8862)

<br />

[**Demo visual**](#galería-del-proyecto) · [**Arranque local**](#inicio-rápido) · [**Qué hay hecho**](#estado-actual-del-proyecto) · [**Arquitectura**](#arquitectura) · [**Docs**](#documentación) · [**Notas**](./docs/desarrollo/NOTAS.md) · [**Swagger**](./docs/referencia/backend/README.md) · [**Plan FP**](./PLAN_TRABAJO_FP.md)

</div>

---

<p align="center">
  <b>Overworld en tilemaps</b> &nbsp;·&nbsp; <b>Combate por turnos en servidor</b> &nbsp;·&nbsp; <b>Menús React sobre el canvas</b> &nbsp;·&nbsp; <b>API REST con JWT</b>
</p>

---

## Tabla de contenidos

<details>
<summary><b>Desplegar índice</b></summary>

- [Galería](#galería-del-proyecto)
- [Destacados](#destacados)
- [Visión](#visión)
- [Inicio rápido](#inicio-rápido)
- [Documentación](#documentación)
- [Estado actual del proyecto](#estado-actual-del-proyecto)
- [Arquitectura](#arquitectura)
- [Stack tecnológico](#stack-tecnológico)
- [Estructura del repositorio](#estructura-del-repositorio)
- [Nota personal](#nota-personal)

</details>

---

## Galería del proyecto

### Capturas

| Landing Page & Portada | Pantalla de Título Original |
|:---:|:---:|
| ![Landing](docs/screenshots/landing.png) | ![Título](docs/screenshots/titulo.png) |
| *Página de inicio con la "carcasa" de GBC.* | *Recreación pixel de la intro de Oro.* |

| Cinemática de Introducción | Sistema de Entrada de Nombre |
|:---:|:---:|
| ![Profesor Oak](docs/screenshots/oak.png) | ![Name Input](docs/screenshots/nombre.png) |
| *Diálogo narrativo con el Profesor Oak.* | *Teclado en pantalla y sprite del jugador.* |

| Habitación del jugador | Ejemplo de combate |
|:---:|:---:|
| ![Habitación](docs/screenshots/player_room.png) | ![Combate](docs/screenshots/ejemplo_combate.png) |
| *Interior Tiled: capas, movimiento por grid y colisiones.* | *`EscenaBatalla` y turnos resueltos vía API (ejemplo visual).* |

| Diálogo en casa | Diálogo en el laboratorio |
|:---:|:---:|
| ![Diálogo con mamá](docs/screenshots/captura-dialogo-mama.png) | ![Diálogo Prof. Elm](docs/screenshots/captura-dialogo-profesor-elm.png) |
| *Secuencia narrativa en interiores (NPC / familia).* | *Diálogo con el Prof. Elm y seguimiento de la aventura.* |

| Menú in-game | Equipo Pokémon |
|:---:|:---:|
| ![Menú principal](docs/screenshots/captura-menu-principal.png) | ![Equipo Pokémon](docs/screenshots/captura-equipo-pokemon.png) |
| *Menú pausado sobre el mapa (UI en React).* | *Lista del equipo: nivel, PS y navegación estilo clásico.* |

| Ficha de Pokémon | Mochila |
|:---:|:---:|
| ![Ficha Totodile](docs/screenshots/captura-ficha-totodile.png) | ![Mochila](docs/screenshots/captura-mochila.png) |
| *Detalle de stats, tipo y datos de combate / Pokédex.* | *Inventario de objetos y cantidades.* |

| Opciones | Guardado |
|:---:|:---:|
| ![Opciones](docs/screenshots/captura-opciones.png) | ![Guardado](docs/screenshots/captura-guardado.png) |
| *Música, sonidos y ritmo del texto.* | *Confirmación de partida guardada (local y servidor).* |

---

## Destacados

| | |
|:---|:---|
| **Mundo** | Varios mapas **Tiled** (habitación, casa, Pueblo Origen, laboratorio Elm, **Ruta 29** con encuentros, **sala debugger** para pruebas de combate y flujos). |
| **Navegación** | **`WarpSystem`**: puertas y rutas con `destino`, spawn y offsets; sincronización de zonas para no activar warps al aparecer encima de una salida. |
| **Combate** | Turnos resueltos en **Spring Boot** (daño Gen II, STAB, crítico, estados, PP, captura); Phaser como **vista** y cliente del contrato REST. |
| **Estado** | **Zustand**: hidrata desde `GET /api/v1/juego/estado`, guarda en servidor y en **localStorage**; Axios con **JWT** y manejo de **401**. |
| **UI** | **React**: menú in-game (equipo, mochila, opciones, guardado), texto estático (`PanelTextoEstaticoReact`); **Phaser**: overworld, batalla, diálogo retro con hablante. |

---

## Visión

Simular un **RPG clásico** con sensación de **Game Boy Color**: rejilla, tilesets, diálogos y combate por turnos, corriendo en el **navegador** y hablando con una **API REST** que concentra datos, economía, capturas y el motor de batalla.

---

## Inicio rápido

> [!TIP]
> Necesitas **JDK 21**, **Node.js** reciente, **MySQL 8** y la configuración de `application.properties` / variables de entorno del backend ([guía](docs/referencia/backend/README.md)).

<table>
<tr>
<td width="50%" valign="top">

### Backend

Puerto por defecto **8081**

```bash
cd pokemon-backend
.\mvnw.cmd spring-boot:run
```

**Swagger** (perfil `dev`): [http://localhost:8081/swagger-ui.html](http://localhost:8081/swagger-ui.html)

</td>
<td width="50%" valign="top">

### Frontend

Vite (suele ser **5173**)

```bash
cd pokemon-frontend
npm install
npm run dev
```

Opcional: copia `pokemon-frontend/.env.example` → `.env` y ajusta **`VITE_API_BASE_URL`**. Si no existe, el cliente usa el mismo host que la página en el puerto **8081**.

</td>
</tr>
</table>

---

## Documentación

| Recurso | Para qué sirve |
|--------|----------------|
| [docs/README.md](docs/README.md) | Índice de toda la carpeta `docs/`. |
| [docs/desarrollo/NOTAS.md](docs/desarrollo/NOTAS.md) | Bugs, prioridades y registro por fecha. |
| [docs/referencia/backend/README.md](docs/referencia/backend/README.md) | API, Maven, puertos. |
| [docs/referencia/diagramas/README.md](docs/referencia/diagramas/README.md) | Diagramas **Mermaid**. |

---

## Estado actual del proyecto

> **Última revisión de este resumen: 2026-04-12.** El detalle día a día está en [docs/desarrollo/NOTAS.md](docs/desarrollo/NOTAS.md). Estado general: **frontend en evolución**, **backend operativo**.

### Frontend

#### Listo o usable hoy

- **Overworld**: mapas Tiled (JSON), capas, colisiones (tilemap + tiles de NPC), movimiento a grid, cámara sigue al jugador.
- **Mapas en juego**: habitación, casa, Pueblo Origen (`new-bark-town`), laboratorio Elm, **Ruta 29** (`ruta-29` + `encuentros-ruta-29` en preload; warps desde el pueblo). La ruta puede crecer en narrativa y balance, pero **ya está integrada** en `johtoOverworld.js` y `EscenaPreload`.
- **Sala debugger** (`debugger-room`, `phaser/mapas/debuggerRoom.js`): combates de prueba (estados, captura debug), warps y utilidades para validar el motor sin recorrer Johto entero.
- **`WarpSystem`**: capa `eventos` (`destino`, `posX`/`posY`, `spawnAt`, offsets); sincronización de presencia al crear la escena y en `worldstep`.
- **`SistemaEncuentros`**: hierba + JSON por mapa exterior configurado.
- **Módulos por mapa** en `pokemon-frontend/src/phaser/mapas/` (`casaJugador`, `labElm`, `johtoOverworld`, `debuggerRoom`, `dialogosPostStarter`, …).
- **Diálogo overworld**: `SistemaDialogo` + marco GBC (`marcoDialogoRetro.js`) y nombre de hablante.
- **Texto estático React** (`PanelTextoEstaticoReact` en `PaginaJuego.jsx`): lectura con Z/Enter fuera del canvas cuando toca.
- **Bienvenidas al paso**: objetos `bienvenida_*` o prop `dispararAlPaso` en Tiled.
- **Menú in-game** (`MenuIngameReact.jsx`): equipo (retratos, PokéAPI auxiliar, stats del DTO), mochila, opciones (`opcionesCliente.js`), guardado local + servidor con JWT. Tecla **X**: si hay callback registrado, menú React; si no, **`EscenaMenu`** en Phaser.
- **Starter**: `UIConfirmacionStarter.js` + `dialogosPostStarter.js`.
- **`EscenaBatalla`**: `prepararSalvajePokemon` / `liberarSalvajePokemon`, equipo y movimientos por API, turnos con `PuenteApi.ejecutarTurno`.
- **`usarJuegoStore`**: hidrata desde `GET /api/v1/juego/estado`, normaliza equipo/inventario, payload de `POST .../guardar`, caché local, tiempo de juego en overworld.
- **`services/api.js`**: JWT en requests; **401** → logout (excepto ruta de login).

#### En marcha

- **Post-batalla**: HP y estado en store/servidor en todos los casos; pantalla de fin de combate.
- **Tienda en overworld**: backend de compra listo; falta UI enlazada a NPC.
- **Centro Pokémon**, **Pokédex** ampliada, **tirar/usar ítems** vía API según fases del plan.
- **Más mundo**; pulido de colisiones y eventos ([NOTAS](docs/desarrollo/NOTAS.md)).

#### Problemas conocidos

Los bugs concretos viven en [NOTAS.md](docs/desarrollo/NOTAS.md). Ejemplos: ajustes de colisión; placeholder visual en un momento del diálogo de la madre (PokeGear).

### Backend

- **Auth**: JWT, BCrypt, Spring Security stateless (`ConfiguracionSeguridad`, filtro JWT); Swagger y auth públicos en dev.
- **Batalla Gen II**: daño (STAB, crítico, efectividad), estados, PP persistido, learnsets PokéAPI (`gold-silver`); salvajes en usuario técnico (`preparar` / `liberar`).
- **Economía e inventario**, **captura** con consumo de Ball, **seeding** PokéAPI (`WebClient`).
- **API juego** (`/api/v1/juego`): `estado`, `equipo`, `starter`, `guardar` (posición, mapa, `estadoCliente`; **no** pisa dinero ni filas de inventario en ese endpoint), `reiniciar`, `inventario/anadir`.
- DTO de equipo con **`tipo1` / `tipo2`** y **stats de combate** para el cliente.
- **OpenAPI / Swagger**: [docs/referencia/backend/README.md](docs/referencia/backend/README.md).

---

## Arquitectura

SPA **React + Phaser** en el cliente; **Spring Boot** como núcleo de reglas y datos; **MySQL** como almacén. Comunicación **HTTP** con **JWT** en rutas protegidas.

```mermaid
flowchart LR
  subgraph Navegador["Navegador"]
    R[React UI]
    P[Phaser escenas]
  end
  API[Spring Boot API]
  DB[(MySQL)]

  R --> API
  P --> API
  API --> DB
```

Más diagramas (seguridad, dominio, captura, daño): [docs/referencia/diagramas/README.md](docs/referencia/diagramas/README.md).

### Backend (cinco bloques)

1. **Seguridad:** JWT, BCrypt, `FiltroAutenticacionJwt`
2. **Batalla:** daño Gen II, tipos (×4.0 a ×0.0), estados persistentes
3. **Economía:** tienda e inventario con `@Transactional`
4. **Captura:** fórmula estilo Oro, stock de Balls, persistencia
5. **Seeding:** PokéAPI con `WebClient`

### Frontend

- Pixel art con **escala entera** (menos blur en HD)
- Estética **GBC** (Tailwind + CSS propio)
- Estado con **Zustand**
- Intro y transiciones con **Framer Motion**
- Controles: WASD / flechas → A / B / Start (mapeo lógico)

---

## Stack tecnológico

| Capa | Tecnologías |
|------|-------------|
| **Backend** | Java 21, Spring Boot 3.5.x, MySQL 8, Spring Security 6 + JJWT, Maven, Lombok |
| **Frontend** | React 19, Vite 7, Phaser 3.90, Tailwind CSS 3.4, Zustand 5, Axios, Framer Motion 12, Tiled (export JSON) |

---

## Estructura del repositorio

Monorepo en carpetas raíz:

```text
root/
├── docs/                    # Documentación y assets
│   ├── referencia/          # Backend + diagramas Mermaid
│   ├── desarrollo/          # NOTAS, defensa FP, mejoras
│   ├── proyecto/            # Memoria / documentación integral
│   ├── planning/
│   ├── screenshots/
│   ├── tiled/               # Fuente .tmx (Tiled Editor)
│   └── api-tests.http
│
├── pokemon-backend/         # Spring Boot (REST)
│   ├── src/main/java/.../
│   └── pom.xml
│
└── pokemon-frontend/        # React + Vite + Phaser
    ├── src/
    │   ├── assets/
    │   ├── components/
    │   ├── config/
    │   ├── pages/
    │   ├── phaser/
    │   ├── services/
    │   └── store/
    ├── package.json
    └── vite.config.js
```

---

## Nota personal

No me apetecía plantear **el típico CRUD** y cerrar el curso con eso. He crecido con *Pokémon*, así que monté **este proyecto de FP** alrededor de un RPG en el navegador: suena divertido, pero detrás hay **API, base de datos, seguridad**, etc.

Lo que más me gusta es el **backend**: API ordenada, datos, reglas en servidor. En **seguridad** este proyecto toca sobre todo **auth con JWT y API protegida** (no es red team ni pentesting; eso me interesa **aparte** como posible salida, pero **no está en el código** de este repo). La parte **visual** la llevo peor: me peleo un montón con estilos y pixel hasta que “encajan”, y sigo sin sentirme cómodo ahí.

**React + Phaser** me han hecho plantearme **mil veces** dejar el proyecto. Sigo con él porque, aunque me frustre, **al final me gusta lo complicado**: cuando algo encaja después de darle vueltas, compensa.
