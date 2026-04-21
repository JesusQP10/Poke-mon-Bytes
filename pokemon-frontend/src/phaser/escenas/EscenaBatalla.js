import Phaser from 'phaser';
import BarraHp from '../ui/BarraHp';
import MenuMovimientos from '../ui/MenuMovimientos';
import PuenteApi from '../puentes/PuenteApi';
import { usarJuegoStore } from '../../store/usarJuegoStore';
import { usarAutenticacionStore } from '../../store/usarAutenticacionStore';
import { volumenBgmParaPhaser } from '../../config/opcionesCliente';
import { clasificarLineaInventarioBatalla } from '../../components/game/battleInventario';
import {
  battleCampoSpriteUrl,
  battleStatusClaveParaIlustracion,
} from '../../config/battleStatusArt';
import { urlEspaldaJugadorCampo } from '../../config/battlePlayerBackArt';
/**
 * EscenaBatalla — pantalla de combate fiel a Pokémon GBC.
 *
 * Layout (160×144):
 *   y:0–96   → área de sprites (fondo batalla + pokémon + info)
 *   y:96–144 → área de UI (caja de texto + menú de acciones)
 */
export default class EscenaBatalla extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaBatalla' });
  }

  /**
   * Misma fuente de PS que el menú Pokémon / mochila: `usarJuegoStore.team`.
   * `GET /equipo` puede traer filas de BD desalineadas con el último guardado mostrado al jugador.
   */
  _alinearHpJugadorConStore() {
    const p = this._pokemonJugador;
    if (!p || typeof p !== 'object') return;
    const team = usarJuegoStore.getState().team ?? [];
    if (!Array.isArray(team) || team.length === 0) return;
    const idPu = p.pokemonUsuarioId;
    const idDex = p.id ?? p.pokedexId;
    const snap =
      team.find(
        (t) =>
          t
          && idPu != null
          && t.pokemonUsuarioId != null
          && t.pokemonUsuarioId === idPu,
      )
      ?? team.find(
        (t) =>
          t && idDex != null && (t.id === idDex || t.pokedexId === idDex),
      )
      ?? team[0];
    if (!snap) return;
    const hpA = snap.hpActual ?? snap.hp;
    const hpM = snap.hpMax;
    if (Number.isFinite(Number(hpA))) {
      p.hpActual = Math.max(0, Math.floor(Number(hpA)));
    }
    if (Number.isFinite(Number(hpM))) {
      p.hpMax = Math.max(1, Math.floor(Number(hpM)));
    }
    if (p.hpActual != null && p.hpMax != null && p.hpActual > p.hpMax) {
      p.hpActual = p.hpMax;
    }
  }

  /** @param {object | null} p */
  static _numHp(p) {
    const n = Number(p?.hpActual ?? p?.hp);
    return Number.isFinite(n) ? n : null;
  }

  /** Entrada del store que corresponde al mismo Pokémon que devuelve GET /equipo. */
  static _snapEquipoStoreParaPokemon(apiMon) {
    const team = usarJuegoStore.getState().team ?? [];
    if (!apiMon || !Array.isArray(team) || team.length === 0) return null;
    const idPu = apiMon.pokemonUsuarioId;
    const idDex = apiMon.id ?? apiMon.pokedexId;
    return (
      team.find(
        (t) =>
          t && idPu != null && t.pokemonUsuarioId != null && t.pokemonUsuarioId === idPu,
      )
      ?? team.find(
        (t) => t && idDex != null && (t.id === idDex || t.pokedexId === idDex),
      )
      ?? team[0]
    );
  }

  /**
   * GET /juego/equipo devuelve la especie en `name` (JuegoService.toDto); el cliente
   * también usa `nombre` / `nombreApodo`. Sin esto el HUD muestra "???".
   * @param {object} p
   */
  /** lista en consola los movimientos cargados desde la API. */
  static _logMovimientosCargados(etiqueta, movs) {
    try {
      if (typeof import.meta === 'undefined' || !import.meta.env?.DEV) return;
    } catch {
      return;
    }
    const lista = Array.isArray(movs) ? movs : [];
    const lineas = lista.map((m) => {
      const id = m.movimientoId ?? m.id ?? '?';
      const pp = m.ppRestante ?? m.ppActual ?? m.pp;
      const ppM = m.ppMax ?? m.pp ?? '?';
      return `${m.nombre ?? '?'} (#${id}, PP ${pp}/${ppM})`;
    });
    // eslint-disable-next-line no-console
    console.info(`[Batalla] Movimientos ${etiqueta}:`, lineas.length ? lineas.join(' · ') : '(ninguno)');
  }

  static _normalizarPokemonEquipoApi(p) {
    if (!p || typeof p !== 'object') return p;
    const species = p.nombre ?? p.name;
    const display = p.nombreApodo ?? p.nombre ?? p.name;
    return {
      ...p,
      nombre: species ?? p.name ?? p.nombreApodo ?? null,
      nombreApodo: display ?? species ?? p.name,
    };
  }

  init(data) {
    this._pokemonSalvaje = data?.pokemonSalvaje ?? { id: 1, nombre: 'Bulbasaur', nivel: 5 };
    /** Si existe, se libera en BD al salir del combate. */
    this._salvajePokemonUsuarioId = null;
    /** Texto extra al inicio (sala debug) */
    this._estadoSalvajeDebug = this._pokemonSalvaje?.estadoSalvajeDebug ?? null;
    /** Estado de prueba mostrado sobre el Pokémon activo del jugador (por defecto en combates debug). */
    this._estadoJugadorDebug = this._pokemonSalvaje?.estadoJugadorDebug ?? null;
    this._esDebugCaptura = Boolean(this._pokemonSalvaje?.esDebugCaptura);
    /** Solo combates salvajes (hierba / pruebas): se puede huir. Entrenadores NPC: no. */
    this._permitirHuir = this._pokemonSalvaje?.esBatallaEntrenador !== true;
  }

  _textosOpcionesMenuBatalla() {
    return this._permitirHuir
      ? ['LUCHAR', 'MOCHILA', 'POKÉMON', 'HUIR']
      : ['LUCHAR', 'MOCHILA', 'POKÉMON', '—'];
  }

  async create() {
    this.game.registry.get('callbacks')?.onCombateActivo?.(true);
    this._enturno = false;
    /** Intentos de huida en este combate (Gen II: sube la probabilidad). */
    this._intentosHuir = 0;
    this._pokemonJugador = null;
    this._movimientosJugador = [];
    this._movimientosEnemigo = [];
    this._uiReact = this.game.registry.get('callbacks')?.onBatallaUi ?? null;

    this._crearFondo();
    if (this.textures.exists('batalla-fondo-hierba')) {
      this._crearSombrasPlataformaCampo();
    } else {
      this._crearPlataformas();
    }
    if (!this._uiReact) {
      this._crearIlustracionEstadoCampoPhaser();
    }
    if (!this._uiReact) this._crearInfoPaneles();
    if (!this._uiReact) {
      this._crearMenuAcciones();
      this._menuMov = new MenuMovimientos(this);
    }

    const sal = this._pokemonSalvaje;
    if (sal?.pokemonUsuarioId != null) {
      this._salvajePokemonUsuarioId = sal.pokemonUsuarioId;
    } else if (sal?.id != null) {
      try {
        const prep = await PuenteApi.prepararSalvajePokemon({
          pokedexId: sal.id,
          nivel: sal.nivel ?? 5,
          ataqueDemostracionId: sal.ataqueDemostracionId,
          ataqueDemostracionNombre: sal.ataqueDemostracionNombre,
        });
        this._pokemonSalvaje = {
          ...sal,
          pokemonUsuarioId: prep.pokemonUsuarioId,
          pokedexId: prep.pokedexId ?? sal.id,
          id: prep.pokedexId ?? sal.id,
          nombre: prep.nombre ?? sal.nombre,
          nivel: prep.nivel ?? sal.nivel,
          hpActual: prep.hpActual,
          hpMax: prep.hpMax,
          ataque: prep.ataque,
          defensa: prep.defensa,
        };
        this._salvajePokemonUsuarioId = prep.pokemonUsuarioId;
      } catch (e) {
        console.warn('[EscenaBatalla] preparar salvaje', e);
      }
    }

    // Equipo: API + mismo PS que el menú (store). Si BD y store difieren, POST /guardar aplica teamCliente a filas.
    try {
      let equipo = await PuenteApi.getEquipo();
      if (equipo?.length) {
        const a0 = equipo[0];
        const snap = EscenaBatalla._snapEquipoStoreParaPokemon(a0);
        const hpApi = EscenaBatalla._numHp(a0);
        const hpSt = snap ? EscenaBatalla._numHp(snap) : null;
        const desinc =
          usarAutenticacionStore.getState().token
          && snap
          && hpSt != null
          && hpApi != null
          && hpSt !== hpApi;
        if (desinc) {
          try {
            await PuenteApi.guardarJuegoEnServidor(
              usarJuegoStore.getState().construirPayloadGuardado(),
              { actualizarCacheLocal: false },
            );
            equipo = await PuenteApi.getEquipo();
          } catch (e) {
            console.warn('[EscenaBatalla] alinear PS BD con partida guardada', e);
          }
        }
        if (equipo?.length) {
          const primerVivo = equipo.find((p) => (p?.hpActual ?? p?.hp ?? 0) > 0) ?? equipo[0];
          this._pokemonJugador = EscenaBatalla._normalizarPokemonEquipoApi(primerVivo);
          this._alinearHpJugadorConStore();
        }
        const pid = this._pokemonJugador?.pokemonUsuarioId;
        if (pid != null) {
          await PuenteApi.resetearPpPokemon(pid);
          this._movimientosJugador = await PuenteApi.getMovimientos(pid);
          EscenaBatalla._logMovimientosCargados('jugador', this._movimientosJugador);
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar el equipo:', e);
    }

    if (this._pokemonSalvaje?.pokemonUsuarioId != null) {
      try {
        this._movimientosEnemigo = await PuenteApi.getMovimientos(this._pokemonSalvaje.pokemonUsuarioId);
        EscenaBatalla._logMovimientosCargados('rival', this._movimientosEnemigo);
      } catch (e) {
        console.warn('No se pudieron cargar movimientos del rival:', e);
        this._movimientosEnemigo = [];
      }
    }

    this._actualizarInfoPaneles();
    if (!this._uiReact) {
      this._crearEspaldaJugadorCampoPhaser();
    }

    // Música
    if (this.cache.audio.exists('bgm-batalla-salvaje')) {
      this._musica = this.sound.add('bgm-batalla-salvaje', {
        loop: true,
        volume: volumenBgmParaPhaser(),
      });
      this._musica.play();
    }

    this._aplicarVolumenBgmBatalla = () => {
      if (this._musica) this._musica.setVolume(volumenBgmParaPhaser());
    };
    this._onOpcionesAudioBatalla = () => this._aplicarVolumenBgmBatalla();
    window.addEventListener('bytes-opciones-audio', this._onOpcionesAudioBatalla);

    const lineaAdelante = `¡Adelante, ${
      this._pokemonJugador?.nombreApodo
      ?? this._pokemonJugador?.nombre
      ?? this._pokemonJugador?.name
      ?? 'Pokémon'
    }!`;

    const encadenarMensajes = (mensajes, i, alTerminar) => {
      if (i >= mensajes.length) {
        alTerminar();
        return;
      }
      this._mostrarTexto(mensajes[i], () => encadenarMensajes(mensajes, i + 1, alTerminar));
    };

    // En todos los combates: al entrar solo "¡Adelante, X!" (sin estados ni mensajes debug).
    const mensajesInicio = [lineaAdelante];

    encadenarMensajes(mensajesInicio, 0, () => this._mostrarMenuAcciones());

    // Entrada desde overworld con fade
    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  /** Mensaje si el estado de prueba va sobre el salvaje (`estadoAfectaA` = rival en Tiled). */
  _mensajeLineaEstadoRivalDebug(clave) {
    if (!clave) return null;
    const c = String(clave).toLowerCase();
    const mapa = {
      quemado: '(Debug) El salvaje viene\ncon QUEMADURA.',
      veneno: '(Debug) El salvaje viene\nENVENENADO.',
      paralisis: '(Debug) El salvaje viene\nPARALIZADO.',
      congelado: '(Debug) El salvaje viene\nCONGELADO.',
      dormido: '(Debug) El salvaje viene\nDORMIDO.',
      confuso: '(Debug) El salvaje viene\nCONFUSO.',
    };
    return mapa[c] ?? `(Debug) Estado rival: ${c}`;
  }

  /** Mensaje si el estado de prueba va sobre tu Pokémon activo (por defecto). Narrativa: el rival te lo aplica. */
  _mensajeLineaEstadoJugadorDebug(nombrePokemon, clave) {
    if (!clave) return null;
    const c = String(clave).toLowerCase();
    const n = String(nombrePokemon ?? 'Pokémon');
    const mapa = {
      quemado: `¡${n} fue quemado!\n(Prueba debug: quemadura)`,
      veneno: `¡${n} fue envenenado!\n(Prueba debug: veneno)`,
      paralisis: `¡${n} quedó paralizado.\nNo puede moverse…\n(Prueba debug)`,
      congelado: `¡${n} se congeló!\n(Prueba debug: congelación)`,
      dormido: `¡${n} se durmió!\n(Prueba debug: sueño)`,
      confuso: `¡${n} se volvió confuso!\n(Prueba debug: confusión)`,
    };
    return mapa[c] ?? `(Debug) Estado en tu Pokémon: ${c}`;
  }

  // ── Fondo y plataformas ───────────────────────────────────────────────

  _crearFondo() {
    if (this.textures.exists('batalla-fondo-hierba')) {
      this.add.image(0, 0, 'batalla-fondo-hierba').setOrigin(0);
    } else {
      // Placeholder si no existe el asset
      this.add.rectangle(0, 0, 160, 96, 0x78c850).setOrigin(0);
      // Línea del horizonte
      this.add.rectangle(0, 60, 160, 2, 0x5aaa3a).setOrigin(0);
    }
  }

  _crearPlataformas() {
    // Plataforma enemiga (elipse pequeña, parte superior derecha)
    const graficos = this.add.graphics();
    graficos.fillStyle(0x5aaa3a, 1);
    graficos.fillEllipse(110, 32, 40, 10);

    // Plataforma jugador (elipse más grande, parte inferior izquierda)
    graficos.fillStyle(0x5aaa3a, 1);
    graficos.fillEllipse(46, 88, 52, 12);
  }

  /** Sombras bajo los pies (mismo sitio que las elipses GBC, sin tapar el fondo). */
  _crearSombrasPlataformaCampo() {
    const g = this.add.graphics().setDepth(1);
    g.fillStyle(0x1a3010, 0.38);
    g.fillEllipse(110, 32, 42, 11);
    g.fillEllipse(46, 88, 54, 14);
  }

  /** Ilustración por estado (mismas URLs que React); solo sin HUD React. */
  _crearIlustracionEstadoCampoPhaser() {
    const clave = battleStatusClaveParaIlustracion(
      this._estadoJugadorDebug,
      this._estadoSalvajeDebug,
    );
    const url = battleCampoSpriteUrl(this._esDebugCaptura, clave);
    const texKey = this._esDebugCaptura ? 'battle-ilust-captura-porygon' : `battle-ilust-${clave}`;
    const colocar = () => {
      if (!this.textures.exists(texKey)) return;
      if (this._spriteIlustracionCampo) this._spriteIlustracionCampo.destroy();
      const spr = this.add.image(110, 58, texKey).setDepth(5).setOrigin(0.5, 1);
      const maxH = 58;
      if (spr.height > maxH) spr.setScale(maxH / spr.height);
      this._spriteIlustracionCampo = spr;
    };
    if (this.textures.exists(texKey)) {
      colocar();
      return;
    }
    this.load.image(texKey, url);
    this.load.once(`filecomplete-image-${texKey}`, colocar);
    this.load.start();
  }

  /** Espalda del Pokémon activo (starters); solo sin HUD React. Tras cargar equipo. */
  _crearEspaldaJugadorCampoPhaser() {
    const url = urlEspaldaJugadorCampo(this._pokemonJugador);
    const dex = Number(this._pokemonJugador?.id ?? this._pokemonJugador?.pokedexId) || 158;
    const texKey = `battle-player-back-${dex}`;
    const colocar = () => {
      if (!this.textures.exists(texKey)) return;
      if (this._spriteJugadorCampo) this._spriteJugadorCampo.destroy();
      const spr = this.add.image(46, 90, texKey).setDepth(6).setOrigin(0.5, 1);
      const maxH = 56;
      if (spr.height > maxH) spr.setScale(maxH / spr.height);
      this._spriteJugadorCampo = spr;
    };
    if (this.textures.exists(texKey)) {
      colocar();
      return;
    }
    this.load.image(texKey, url);
    this.load.once(`filecomplete-image-${texKey}`, colocar);
    this.load.start();
  }

  // ── Paneles de información ────────────────────────────────────────────

  _crearInfoPaneles() {
    // Panel enemigo (izquierda superior): x:2, y:2, 74×27
    const panelEnemigo = this.add.graphics();
    panelEnemigo.fillStyle(0xf8f8f8, 1);
    panelEnemigo.fillRect(2, 2, 74, 27);
    panelEnemigo.lineStyle(1, 0x000000);
    panelEnemigo.strokeRect(2, 2, 74, 27);

    this._textoNombreEnemigo = this.add.text(6, 5, '???', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#000',
    }).setOrigin(0);

    this._textoNivelEnemigo = this.add.text(62, 5, 'Nv?', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#000',
    }).setOrigin(0);

    this._textoHpLabelEnemigo = this.add.text(6, 15, 'HP:', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#000',
    }).setOrigin(0);

    this._barraHpEnemigo = new BarraHp(this, 26, 20, 46, 2);

    // Panel jugador (derecha inferior): x:84, y:60, 74×34
    const panelJugador = this.add.graphics();
    panelJugador.fillStyle(0xf8f8f8, 1);
    panelJugador.fillRect(84, 60, 74, 34);
    panelJugador.lineStyle(1, 0x000000);
    panelJugador.strokeRect(84, 60, 74, 34);

    this._textoNombreJugador = this.add.text(88, 63, '???', {
      fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#000',
    }).setOrigin(0);

    this._textoNivelJugador = this.add.text(144, 63, 'Nv?', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#000',
    }).setOrigin(0);

    this._textoHpLabelJugador = this.add.text(88, 75, 'HP:', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#000',
    }).setOrigin(0);

    this._barraHpJugador = new BarraHp(this, 108, 79, 46, 2);

    this._textoHpNumerico = this.add.text(88, 84, '??/??', {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#000',
    }).setOrigin(0);
  }

  _actualizarInfoPaneles() {
    const sal = this._pokemonSalvaje;
    const jug = this._pokemonJugador;

    if (this._uiReact) {
      this._emitirHudReact();
      return;
    }

    this._textoNombreEnemigo.setText(sal.nombre?.toUpperCase() ?? '???');
    this._textoNivelEnemigo.setText(`Nv${sal.nivel ?? '?'}`);
    this._barraHpEnemigo.setValores(sal.hpActual ?? 100, sal.hpMax ?? 100);

    if (jug) {
      this._textoNombreJugador.setText(
        (jug.nombreApodo ?? jug.nombre ?? jug.name ?? '???').toString().toUpperCase(),
      );
      this._textoNivelJugador.setText(`Nv${jug.nivel ?? '?'}`);
      this._barraHpJugador.setValores(jug.hpActual ?? jug.hpMax ?? 100, jug.hpMax ?? 100);
      this._textoHpNumerico.setText(`${jug.hpActual ?? '??'}/${jug.hpMax ?? '??'}`);
    }
  }

  _datosHudReact() {
    const sal = this._pokemonSalvaje ?? {};
    const jug = this._pokemonJugador ?? {};
    const spriteEstadoClave = battleStatusClaveParaIlustracion(
      this._estadoJugadorDebug,
      this._estadoSalvajeDebug,
    );
    return {
      spriteEstadoClave,
      esDebugCaptura: this._esDebugCaptura,
      spriteJugadorCampoUrl: urlEspaldaJugadorCampo(jug),
      jugador: {
        nombre: jug.nombreApodo ?? jug.nombre ?? jug.name ?? '???',
        nivel: jug.nivel ?? '?',
        hpActual: jug.hpActual ?? jug.hpMax ?? null,
        hpMax: jug.hpMax ?? null,
        estado: jug.estado ?? 'saludable',
      },
      enemigo: {
        nombre: sal.nombre ?? sal.name ?? '???',
        nivel: sal.nivel ?? '?',
        hpActual: sal.hpActual ?? sal.hpMax ?? null,
        hpMax: sal.hpMax ?? null,
        pokedexId: sal.pokedexId ?? sal.id ?? null,
        estado: sal.estado ?? 'saludable',
      },
    };
  }

  _emitirHudReact() {
    if (!this._uiReact) return;
    this._uiReact(this._datosHudReact());
  }

  /** 4 huecos para UI React: nombre + PP (cur/max). */
  _slotsMovimientosReact() {
    const movs = this._movimientosJugador ?? [];
    const out = [];
    for (let i = 0; i < 4; i++) {
      const m = movs[i];
      if (!m) {
        out.push({ nombre: '—', pp: '--/--', usable: false });
        continue;
      }
      const ppMax = m.ppMax ?? m.pp ?? 0;
      const ppCur = m.ppRestante ?? m.ppActual ?? m.pp ?? ppMax;
      out.push({
        nombre: m.nombre ?? '?',
        pp: `${ppCur}/${ppMax}`,
        usable: true,
      });
    }
    return out;
  }

  _mostrarPickerMovimientosReact() {
    if (!this._uiReact) return;
    this._uiReact({
      ...this._datosHudReact(),
      mensaje: 'Elige un\nmovimiento.',
      menuVisible: false,
      equipoPicker: null,
      mochilaPicker: null,
      movimientosPicker: {
        slots: this._slotsMovimientosReact(),
        onPick: (idx) => {
          void this._ejecutarTurno(idx);
        },
        onCancel: () => {
          this._mostrarMenuAcciones();
        },
      },
      opciones: this._textosOpcionesMenuBatalla(),
      seleccion: 0,
      onSeleccion: (i) => this._ejecutarAccion(i),
    });
  }

  _mostrarEquipoBattleReact() {
    if (!this._uiReact) return;
    const team = usarJuegoStore.getState().team ?? [];
    if (!team.length) {
      this._mostrarTexto('Sin Pokémon\nen el equipo.', () => this._mostrarMenuAcciones());
      return;
    }
    const starter = usarJuegoStore.getState().starter ?? null;
    this._uiReact({
      ...this._datosHudReact(),
      mensaje: '¿Qué Pokémon?',
      menuVisible: false,
      movimientosPicker: null,
      mochilaPicker: null,
      equipoPicker: {
        equipo: team,
        starter,
        onPick: (p) => {
          const activo = this._pokemonJugador;
          const idActivo = activo?.pokemonUsuarioId ?? activo?.id;
          const idPick = p?.pokemonUsuarioId ?? p?.id;
          if (idActivo != null && idPick != null && idActivo === idPick) {
            this._mostrarTexto('¡Ese Pokémon\nya está en combate!', () => this._mostrarEquipoBattleReact());
            return;
          }
          const hpA = p?.hpActual ?? 0;
          if (hpA <= 0) {
            this._mostrarTexto('¡Ese Pokémon\nno puede combatir!', () => this._mostrarEquipoBattleReact());
            return;
          }
          this._mostrarTexto(
            `${p?.nombreApodo ?? p?.nombre ?? p?.name ?? 'Pokémon'}\n(próximamente).`,
            () => this._mostrarMenuAcciones(),
          );
        },
        onCancel: () => this._mostrarMenuAcciones(),
      },
      opciones: this._textosOpcionesMenuBatalla(),
      seleccion: 0,
      onSeleccion: (i) => this._ejecutarAccion(i),
    });
  }

  _mostrarMochilaBattleReact() {
    if (!this._uiReact) return;
    const inv = usarJuegoStore.getState().inventario ?? [];
    const curativos = [];
    const balls = [];
    for (const linea of inv) {
      const t = clasificarLineaInventarioBatalla(linea);
      if (t === 'ball') balls.push(linea);
      else if (t === 'curativo') curativos.push(linea);
    }
    this._uiReact({
      ...this._datosHudReact(),
      mensaje: '¿Qué usas?',
      menuVisible: false,
      equipoPicker: null,
      movimientosPicker: null,
      mochilaPicker: {
        curativos,
        balls,
        onPick: (linea) => void this._usarItemEnBatalla(linea),
        onCancel: () => this._mostrarMenuAcciones(),
      },
      opciones: this._textosOpcionesMenuBatalla(),
      seleccion: 0,
      onSeleccion: (i) => this._ejecutarAccion(i),
    });
  }

  async _usarItemEnBatalla(linea) {
    const nombre = linea?.nombre ?? 'Objeto';
    const tipo = clasificarLineaInventarioBatalla(linea);

    if (tipo === 'ball') {
      const defensorId = this._pokemonSalvaje?.pokemonUsuarioId;
      if (defensorId == null) {
        this._mostrarTexto('No hay rival\npara capturar.', () => this._mostrarMenuAcciones());
        return;
      }
      try {
        const res = await PuenteApi.intentarCaptura(defensorId, nombre);
        const msg = res?.mensaje ?? '¡Falló la captura!';
        const capturado = typeof msg === 'string' && msg.toLowerCase().includes('fue capturado');
        this._salvajePokemonUsuarioId = capturado ? null : this._salvajePokemonUsuarioId;
        this._encolarMensajesBatalla([msg], () => {
          if (capturado) {
            void PuenteApi.sincronizarEstadoDesdeServidor();
            void this._terminarBatalla();
          } else {
            void this._turnoEnemigo();
          }
        });
      } catch (e) {
        console.warn('[EscenaBatalla] captura desde mochila', e);
        const apiMsg = e?.response?.data?.error ?? e?.response?.data?.mensaje ?? '¡Falló la captura!';
        this._encolarMensajesBatalla([apiMsg], () => this._turnoEnemigo());
      }
      return;
    }

    // curativo
    const jugador = this._pokemonJugador;
    const pokemonObjetivoId = jugador?.pokemonUsuarioId;
    if (pokemonObjetivoId == null) {
      this._mostrarTexto('Sin Pokémon\nactivo.', () => this._mostrarMenuAcciones());
      return;
    }
    try {
      const res = await PuenteApi.usarItemInventario({ nombreItem: nombre, pokemonObjetivoId });
      const msg = res?.mensaje ?? `¡${nombre} surtió\nefecto!`;
      if (res?.team) {
        usarJuegoStore.getState().patchEquipoLocal(res.team);
        const actualizado = res.team.find((p) => p?.pokemonUsuarioId === pokemonObjetivoId);
        if (actualizado) {
          jugador.hpActual = actualizado.hpActual ?? jugador.hpActual;
          jugador.estado = actualizado.estado ?? jugador.estado;
        }
      }
      if (res?.inventario) {
        usarJuegoStore.getState().setInventarioYMonto(res.inventario);
      }
      if (this._uiReact) this._emitirHudReact();
      this._encolarMensajesBatalla([msg], () => void this._turnoEnemigo());
    } catch (e) {
      console.warn('[EscenaBatalla] usar ítem en batalla', e);
      const apiMsg = e?.response?.data?.error ?? `No se pudo\nusar ${nombre}.`;
      this._mostrarTexto(apiMsg, () => this._mostrarMochilaBattleReact());
    }
  }

  // ── Caja de texto ─────────────────────────────────────────────────────

  _crearMenuAcciones() {
    // Marco exterior (estilo GBA: borde rojo + cajas internas)
    this._cajaTexto = this.add.graphics().setDepth(40);

    const UI_X = 0;
    const UI_Y = 96;
    const UI_W = 160;
    const UI_H = 48;

    const BORDE_ROJO = 0xcc3b3b;
    const BORDE_NEGRO = 0x000000;
    const TEAL = 0x5aa9a9;
    const GRIS = 0xf2f2f2;

    // Borde rojo exterior
    this._cajaTexto.fillStyle(BORDE_ROJO, 1);
    this._cajaTexto.fillRect(UI_X, UI_Y, UI_W, UI_H);

    // Área interior (1px de margen dentro del rojo)
    const IN_X = UI_X + 1;
    const IN_Y = UI_Y + 1;
    const IN_W = UI_W - 2;
    const IN_H = UI_H - 2;

    // Split izquierda/derecha (como la referencia)
    const LEFT_W = 96; // caja texto
    const RIGHT_W = IN_W - LEFT_W; // caja menú

    // Caja izquierda (texto) con borde negro
    this._cajaTexto.fillStyle(TEAL, 1);
    this._cajaTexto.fillRect(IN_X + 1, IN_Y + 1, LEFT_W - 3, IN_H - 3);
    this._cajaTexto.lineStyle(1, BORDE_NEGRO, 1);
    this._cajaTexto.strokeRect(IN_X, IN_Y, LEFT_W, IN_H);

    // Caja derecha (menú) con borde negro
    const RIGHT_X = IN_X + LEFT_W;
    this._cajaTexto.fillStyle(GRIS, 1);
    this._cajaTexto.fillRect(RIGHT_X + 1, IN_Y + 1, RIGHT_W - 2, IN_H - 2);
    this._cajaTexto.lineStyle(1, BORDE_NEGRO, 1);
    this._cajaTexto.strokeRect(RIGHT_X, IN_Y, RIGHT_W, IN_H);

    // Texto de mensaje (Gen III: blanco sobre teal)
    this._textoMensaje = this.add.text(6, 101, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '5px',
      fill: '#ffffff',
      wordWrap: { width: 86 },
      lineSpacing: 3,
    }).setOrigin(0).setDepth(41);

    // Menú de acciones (derecha)
    const acciones = this.add.graphics().setDepth(40); // solo para agrupar profundidad; el marco ya lo pinta _cajaTexto
    acciones.setVisible(false);

    const textoAcciones = this._textosOpcionesMenuBatalla();
    const posAcciones = [
      { x: 98, y: 102 }, { x: 124, y: 102 },
      { x: 98, y: 121 }, { x: 124, y: 121 },
    ];

    this._cursores = [];
    this._textosAcciones = posAcciones.map((pos, i) => {
      const cursor = this.add.text(pos.x - 6, pos.y, '▶', {
        fontFamily: '"Press Start 2P"', fontSize: '4px', fill: '#000000',
      }).setOrigin(0).setDepth(42).setVisible(false);
      this._cursores.push(cursor);

      return this.add.text(pos.x, pos.y, textoAcciones[i], {
        fontFamily: '"Press Start 2P"',
        fontSize: '4px',
        fill: '#000000',
        letterSpacing: -1,
      }).setOrigin(0).setDepth(42);
    });

    this._seleccionAccion = 0;
    this._menuAccionesVisible = false;
    this._contenedorAcciones = [acciones, ...this._textosAcciones, ...this._cursores];
    this._contenedorAcciones.forEach(o => o.setVisible(false));
  }

  _mostrarMenuAcciones() {
    if (this._uiReact) {
      const nombre =
        (this._pokemonJugador?.nombreApodo
          ?? this._pokemonJugador?.nombre
          ?? this._pokemonJugador?.name
          ?? 'Pokémon')
          .toString()
          .trim()
          .toUpperCase() || 'POKÉMON';
      const msg = `¿Qué hará\n${nombre}?`;
      this._uiReact({
        ...this._datosHudReact(),
        mensaje: msg,
        menuVisible: true,
        movimientosPicker: null,
        mochilaPicker: null,
        equipoPicker: null,
        opciones: this._textosOpcionesMenuBatalla(),
        seleccion: 0,
        onSeleccion: (i) => this._ejecutarAccion(i),
      });
      return;
    }
    const nombre =
      (this._pokemonJugador?.nombreApodo
        ?? this._pokemonJugador?.nombre
        ?? this._pokemonJugador?.name
        ?? 'POKÉMON')
        .toString()
        .trim()
        .toUpperCase() || 'POKÉMON';
    this._textoMensaje.setText(`¿Qué hará\n${nombre}?`);
    this._seleccionAccion = 0;
    this._menuAccionesVisible = true;
    this._contenedorAcciones.forEach(o => o.setVisible(true));
    this._actualizarCursorAccion();

    this.input.keyboard.once('keydown', this._manejarInputAccion, this);
  }

  _actualizarCursorAccion() {
    this._cursores.forEach((c, i) => c.setVisible(i === this._seleccionAccion));
  }

  _manejarInputAccion(event) {
    if (!this._menuAccionesVisible) return;

    switch (event.code) {
      case 'ArrowUp': case 'KeyW':
        if (this._seleccionAccion >= 2) this._seleccionAccion -= 2; break;
      case 'ArrowDown': case 'KeyS':
        if (this._seleccionAccion < 2) this._seleccionAccion += 2; break;
      case 'ArrowLeft': case 'KeyA':
        if (this._seleccionAccion % 2 === 1) this._seleccionAccion--; break;
      case 'ArrowRight': case 'KeyD':
        if (this._seleccionAccion % 2 === 0) this._seleccionAccion++; break;
      case 'KeyZ': case 'Enter': case 'NumpadEnter':
        this._ejecutarAccion(this._seleccionAccion);
        return;
    }
    this._actualizarCursorAccion();
    this.input.keyboard.once('keydown', this._manejarInputAccion, this);
  }

  _ejecutarAccion(indice) {
    this._menuAccionesVisible = false;
    // En modo UI React no existe el contenedor Phaser del menú.
    if (this._contenedorAcciones?.length) {
      this._contenedorAcciones.forEach(o => o.setVisible(false));
    }

    switch (indice) {
      case 0: this._accionLuchar(); break;
      case 1:
        if (this._uiReact) this._mostrarMochilaBattleReact();
        else this._mostrarTexto('Mochila no\nimplementada.', () => this._mostrarMenuAcciones());
        break;
      case 2:
        if (this._uiReact) this._mostrarEquipoBattleReact();
        else this._mostrarTexto('¡Sin más\nPokémon!', () => this._mostrarMenuAcciones());
        break;
      case 3: this._accionHuir(); break;
    }
  }

  // ── Acción: LUCHAR ────────────────────────────────────────────────────

  async _accionLuchar() {
    if (!this._pokemonJugador || this._movimientosJugador.length === 0) {
      this._mostrarTexto('¡Sin movimientos\ndisponibles!', () => this._mostrarMenuAcciones());
      return;
    }

    if (this._uiReact) {
      this._mostrarPickerMovimientosReact();
      return;
    }

    this._menuMov.mostrar(this._movimientosJugador, async (indiceSeleccionado) => {
      if (indiceSeleccionado < 0) {
        this._mostrarMenuAcciones();
        return;
      }
      await this._ejecutarTurno(indiceSeleccionado);
    });
  }

  _categoriaEsEspecial(categoria) {
    const c = String(categoria ?? '').toLowerCase();
    return c === 'especial' || c === 'special';
  }

  /**
   * Encadena textos en la caja (no pisa el mensaje anterior antes del delay).
   * @param {string[]} partes
   * @param {() => void} [onFin]
   */
  _encolarMensajesBatalla(partes, onFin) {
    const filtradas = (partes ?? []).map((p) => String(p ?? '').trim()).filter(Boolean);
    if (!filtradas.length) {
      if (onFin) onFin();
      return;
    }
    const [primero, ...resto] = filtradas;
    this._mostrarTexto(primero, () => {
      if (resto.length) this._encolarMensajesBatalla(resto, onFin);
      else if (onFin) onFin();
    });
  }

  async _refrescarMovimientosJugador() {
    const pid = this._pokemonJugador?.pokemonUsuarioId;
    if (pid == null) return;
    try {
      this._movimientosJugador = await PuenteApi.getMovimientos(pid);
      EscenaBatalla._logMovimientosCargados('jugador (tras turno)', this._movimientosJugador);
    } catch (e) {
      console.warn('[EscenaBatalla] refrescar movimientos', e);
    }
  }

  /** Misma lógica aproximada que el servidor si no hay sesión (solo salvajes). */
  _intentarHuirLocal() {
    const jug = this._pokemonJugador;
    const enemigo = this._pokemonSalvaje;
    const a = Math.max(1, Number(jug?.velocidad ?? 40));
    const b = Math.max(1, Number(enemigo?.velocidad ?? enemigo?.velocidadStat ?? 45));
    const c = Math.max(1, this._intentosHuir);
    let f = Math.floor((a * 32) / b) + 30 * c;
    if (f > 255) f = 255;
    return Math.floor(Math.random() * 256) < f;
  }

  async _ejecutarTurno(indiceMov) {
    const mov = this._movimientosJugador[indiceMov];
    const jugador = this._pokemonJugador;
    const enemigo = this._pokemonSalvaje;

    const atacanteId = jugador.pokemonUsuarioId;
    const defensorId = enemigo.pokemonUsuarioId;
    const movimientoId = mov.movimientoId ?? mov.id;
    if (atacanteId == null || defensorId == null || movimientoId == null) {
      this._mostrarTexto('Datos de combate\ninválidos.', () => this._mostrarMenuAcciones());
      return;
    }

    try {
      const resultado = await PuenteApi.ejecutarTurno({
        atacanteId,
        defensorId,
        movimientoId,
        nivelAtacante: jugador.nivel,
        potenciaMovimiento: mov.potencia ?? 0,
        tipoAtaque: mov.tipo ?? 'NORMAL',
        ataqueStat: jugador.ataque ?? 50,
        defensaStat: enemigo.defensa ?? 50,
        esEspecial: this._categoriaEsEspecial(mov.categoria),
        esMismoTipo: mov.tipo === jugador.tipo1,
      });

      const gen = (resultado.mensajeGeneral && String(resultado.mensajeGeneral).trim()) || '';
      const lineas = gen
        ? [gen]
        : [
            `${jugador.nombreApodo ?? jugador.nombre ?? jugador.name} usó ${mov.nombre}!`,
            ...(resultado.golpeCritico ? ['¡Golpe crítico!'] : []),
            ...(resultado.mensajeEfectividad ? [resultado.mensajeEfectividad] : []),
          ].filter(Boolean);

      if (typeof resultado.hpRestanteAtacante === 'number' && jugador) {
        jugador.hpActual = resultado.hpRestanteAtacante;
        usarJuegoStore.getState().setPokemonHpPorPokemonUsuarioId(
          jugador.pokemonUsuarioId,
          resultado.hpRestanteAtacante,
        );
      }
      if (resultado.estadoAtacante) jugador.estado = resultado.estadoAtacante;
      if (resultado.estadoDefensor) enemigo.estado = resultado.estadoDefensor;

      const nuevoHpEnemigo = resultado.hpRestanteDefensor ?? enemigo.hpActual ?? 0;
      enemigo.hpActual = nuevoHpEnemigo;

      const defensorMuere =
        resultado.defensorDerrotado === true || nuevoHpEnemigo <= 0;
      const jugadorDebilitado =
        typeof resultado.hpRestanteAtacante === 'number' && resultado.hpRestanteAtacante <= 0;

      if (this._uiReact) {
        this._emitirHudReact();
      }

      this._encolarMensajesBatalla(lineas, () => {
        if (!this._uiReact) {
          const hpJ = jugador.hpActual ?? 0;
          this._barraHpJugador.setValores(hpJ, jugador.hpMax ?? 100);
          this._textoHpNumerico.setText(`${hpJ}/${jugador.hpMax ?? '??'}`);
        }

        const trasAnimacion = async () => {
          if (jugadorDebilitado) {
            this._derrota();
            return;
          }
          if (defensorMuere) {
            await this._victoria();
            return;
          }
          await this._refrescarMovimientosJugador();
          this.time.delayedCall(400, () => this._turnoEnemigo());
        };

        if (this._uiReact) {
          this.time.delayedCall(500, () => {
            void trasAnimacion();
          });
        } else {
          this._barraHpEnemigo.animarHacia(nuevoHpEnemigo, async () => {
            await trasAnimacion();
          });
        }
      });
    } catch (e) {
      console.error('Error en turno de batalla:', e);
      this._mostrarTexto('Error en batalla.', () => this._mostrarMenuAcciones());
    }
  }

  // ── Turno del enemigo ─────────────────────────────────────────────────

  async _turnoEnemigo() {
    const enemigo = this._pokemonSalvaje;
    const jugador = this._pokemonJugador;

    const n = Math.max(1, this._movimientosEnemigo?.length ?? 0);
    const movEnemigoIdx = Math.floor(Math.random() * Math.min(n, 4));
    const movEnemigo = this._movimientosEnemigo?.[movEnemigoIdx] ?? {
      movimientoId: 33,
      id: 33,
      nombre: 'Placaje',
      potencia: 40,
      tipo: 'NORMAL',
      categoria: 'physical',
    };

    const atacanteId = enemigo.pokemonUsuarioId;
    const defensorId = jugador.pokemonUsuarioId;
    const movimientoId = movEnemigo.movimientoId ?? movEnemigo.id;
    if (atacanteId == null || defensorId == null || movimientoId == null) {
      this._mostrarMenuAcciones();
      return;
    }

    try {
      const resultado = await PuenteApi.ejecutarTurno({
        atacanteId,
        defensorId,
        movimientoId,
        nivelAtacante: enemigo.nivel,
        potenciaMovimiento: movEnemigo.potencia ?? 40,
        tipoAtaque: movEnemigo.tipo ?? 'NORMAL',
        ataqueStat: enemigo.ataque ?? 50,
        defensaStat: jugador.defensa ?? 50,
        esEspecial: this._categoriaEsEspecial(movEnemigo.categoria),
        esMismoTipo: false,
      });

      const nuevoHpJugador =
        typeof resultado.hpRestanteDefensor === 'number'
          ? resultado.hpRestanteDefensor
          : Math.max(
              0,
              (jugador.hpActual ?? jugador.hpMax ?? 100) - (resultado.danoInfligido ?? 0),
            );
      jugador.hpActual = nuevoHpJugador;
      usarJuegoStore.getState().setPokemonHpPorPokemonUsuarioId(
        jugador.pokemonUsuarioId,
        nuevoHpJugador,
      );

      if (typeof resultado.hpRestanteAtacante === 'number') {
        enemigo.hpActual = resultado.hpRestanteAtacante;
      }
      if (resultado.estadoDefensor) jugador.estado = resultado.estadoDefensor;
      if (resultado.estadoAtacante) enemigo.estado = resultado.estadoAtacante;

      const gen = (resultado.mensajeGeneral && String(resultado.mensajeGeneral).trim()) || '';
      const lineas = gen
        ? [gen]
        : [`¡${enemigo.nombre} usó ${movEnemigo.nombre}!`,
            ...(resultado.golpeCritico ? ['¡Golpe crítico!'] : []),
            ...(resultado.mensajeEfectividad ? [resultado.mensajeEfectividad] : [])];

      if (this._uiReact) {
        this._emitirHudReact();
      }

      this._encolarMensajesBatalla(lineas, () => {
        const finTurnoEnemigo = () => {
          if (nuevoHpJugador <= 0) {
            this._derrota();
          } else {
            void this._refrescarMovimientosJugador();
            this._mostrarMenuAcciones();
          }
        };

        if (this._uiReact) {
          this.time.delayedCall(450, () => {
            finTurnoEnemigo();
          });
        } else {
          if (typeof resultado.hpRestanteAtacante === 'number') {
            this._barraHpEnemigo.setValores(resultado.hpRestanteAtacante, enemigo.hpMax ?? 100);
          }
          this._barraHpJugador.animarHacia(nuevoHpJugador, () => {
            this._textoHpNumerico.setText(`${nuevoHpJugador}/${jugador.hpMax ?? '??'}`);
            finTurnoEnemigo();
          });
        }
      });
    } catch (e) {
      console.error('Error turno enemigo:', e);
      this._mostrarMenuAcciones();
    }
  }

  // ── Huida ──────────────────────────────────────────────────────────────

  async _accionHuir() {
    if (!this._permitirHuir) {
      this._mostrarTexto(
        '¡No puedes huir de\nun combate contra\nun entrenador!',
        () => this._mostrarMenuAcciones(),
      );
      return;
    }
    const jid = this._pokemonJugador?.pokemonUsuarioId;
    const sid = this._pokemonSalvaje?.pokemonUsuarioId;
    this._intentosHuir += 1;

    const token = usarAutenticacionStore.getState().token;
    if (token && jid != null && sid != null) {
      try {
        const r = await PuenteApi.intentarHuir({
          jugadorPokemonId: jid,
          salvajePokemonId: sid,
          intento: this._intentosHuir,
        });
        const msg = r?.mensaje ?? (r?.exito ? '¡Escapaste sin problemas!' : '¡No puedes escapar!');
        this._encolarMensajesBatalla([msg], () => {
          if (r?.exito) void this._terminarBatalla();
          else this._mostrarMenuAcciones();
        });
      } catch (e) {
        console.warn('[EscenaBatalla] huir', e);
        this._mostrarTexto('No se pudo huir.', () => this._mostrarMenuAcciones());
      }
      return;
    }

    const ok = this._intentarHuirLocal();
    this._encolarMensajesBatalla(
      [ok ? '¡Escapaste sin problemas!' : '¡No puedes escapar!'],
      () => {
        if (ok) void this._terminarBatalla();
        else this._mostrarMenuAcciones();
      },
    );
  }

  // ── Victoria / Derrota ────────────────────────────────────────────────

  async _victoria() {
    const xpGanada = Math.floor((this._pokemonSalvaje.nivel ?? 5) * 30);
    this._mostrarTexto(
      `¡${
        this._pokemonJugador?.nombreApodo
        ?? this._pokemonJugador?.nombre
        ?? this._pokemonJugador?.name
        ?? 'Pokémon'
      } ganó\n${xpGanada} Ptos. Exp.!`,
      () => void this._terminarBatalla(),
    );
  }

  _derrota() {
    this._mostrarTexto('¡Tu Pokémon no\npuede más!', () => {
      this._mostrarTexto('¡Te has quedado\nsin Pokémon!', () => {
        void this._terminarBatalla();
      });
    });
  }

  async _terminarBatalla() {
    try {
      if (usarAutenticacionStore.getState().token) {
        await PuenteApi.guardarJuegoEnServidor(
          usarJuegoStore.getState().construirPayloadGuardado(),
        );
        await PuenteApi.sincronizarEstadoDesdeServidor();
      }
    } catch (e) {
      console.warn('[EscenaBatalla] guardar al salir del combate', e);
    }
    this._musica?.stop();
    this._uiReact?.(null);
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('EscenaOverworld');
    });
  }

  // ── Texto de batalla ───────────────────────────────────────────────────

  _mostrarTexto(texto, onFin) {
    if (this._uiReact) {
      this._uiReact({
        ...this._datosHudReact(),
        mensaje: texto,
        menuVisible: false,
        movimientosPicker: null,
        mochilaPicker: null,
        equipoPicker: null,
        opciones: this._textosOpcionesMenuBatalla(),
        seleccion: 0,
        onSeleccion: (i) => this._ejecutarAccion(i),
      });
      if (onFin) {
        this.time.delayedCall(1500, () => {
          if (onFin) onFin();
        });
      }
      return;
    }
    this._textoMensaje.setText(texto);
    if (!onFin) return;

    this._contenedorAcciones.forEach(o => o.setVisible(false));
    this.time.delayedCall(1500, () => {
      if (onFin) onFin();
    });
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  shutdown() {
    this.game.registry.get('callbacks')?.onCombateActivo?.(false);
    if (this._onOpcionesAudioBatalla) {
      window.removeEventListener('bytes-opciones-audio', this._onOpcionesAudioBatalla);
    }
    this._musica?.stop();
    this._menuMov?.ocultar();
    if (this._salvajePokemonUsuarioId != null) {
      void PuenteApi.liberarSalvajePokemon(this._salvajePokemonUsuarioId).catch((err) => {
        console.warn('[batalla] liberar salvaje', err);
      });
    }
  }
}
