import Phaser from 'phaser';
import BarraHp from '../ui/BarraHp';
import MenuMovimientos from '../ui/MenuMovimientos';
import PuenteApi from '../puentes/PuenteApi';
import { usarJuegoStore } from '../../store/usarJuegoStore';
import { volumenBgmParaPhaser } from '../../config/opcionesCliente';

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

  init(data) {
    this._pokemonSalvaje = data?.pokemonSalvaje ?? { id: 1, nombre: 'Bulbasaur', nivel: 5 };
    /** Si existe, se libera en BD al salir del combate. */
    this._salvajePokemonUsuarioId = null;
    /** Texto extra al inicio (sala debug) */
    this._estadoSalvajeDebug = this._pokemonSalvaje?.estadoSalvajeDebug ?? null;
    /** Estado de prueba mostrado sobre el Pokémon activo del jugador (por defecto en combates debug). */
    this._estadoJugadorDebug = this._pokemonSalvaje?.estadoJugadorDebug ?? null;
    this._esDebugCaptura = Boolean(this._pokemonSalvaje?.esDebugCaptura);
  }

  async create() {
    this._enturno = false;
    this._pokemonJugador = null;
    this._movimientosJugador = [];
    this._movimientosEnemigo = [];

    this._crearFondo();
    this._crearPlataformas();
    this._crearInfoPaneles();
    this._crearMenuAcciones();
    this._menuMov = new MenuMovimientos(this);

    const sal = this._pokemonSalvaje;
    if (sal?.pokemonUsuarioId != null) {
      this._salvajePokemonUsuarioId = sal.pokemonUsuarioId;
    } else if (sal?.id != null) {
      try {
        const prep = await PuenteApi.prepararSalvajePokemon({
          pokedexId: sal.id,
          nivel: sal.nivel ?? 5,
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

    // Cargar datos del equipo del jugador
    try {
      const equipo = await PuenteApi.getEquipo();
      if (equipo && equipo.length > 0) {
        this._pokemonJugador = equipo[0];
        const pid = this._pokemonJugador.pokemonUsuarioId;
        if (pid != null) {
          this._movimientosJugador = await PuenteApi.getMovimientos(pid);
        }
      }
    } catch (e) {
      console.warn('No se pudo cargar el equipo:', e);
    }

    if (this._pokemonSalvaje?.pokemonUsuarioId != null) {
      try {
        this._movimientosEnemigo = await PuenteApi.getMovimientos(this._pokemonSalvaje.pokemonUsuarioId);
      } catch (e) {
        console.warn('No se pudieron cargar movimientos del rival:', e);
        this._movimientosEnemigo = [];
      }
    }

    this._actualizarInfoPaneles();
    this._cargarSprites();

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

    const salPost = this._pokemonSalvaje;
    const lineaEncuentro = `¡Un ${salPost.nombre}\nsalvaje apareció!`;
    const lineaVamos = `¡Vamos, ${this._pokemonJugador?.nombreApodo ?? 'Pokémon'}!`;

    const encadenarMensajes = (mensajes, i, alTerminar) => {
      if (i >= mensajes.length) {
        alTerminar();
        return;
      }
      this._mostrarTexto(mensajes[i], () => encadenarMensajes(mensajes, i + 1, alTerminar));
    };

    const mensajesInicio = [lineaEncuentro];
    if (this._esDebugCaptura) {
      mensajesInicio.push('(Debug) Zona de prueba\nde captura.');
    }
    const lineaEstadoRival = this._mensajeLineaEstadoRivalDebug(this._estadoSalvajeDebug);
    if (lineaEstadoRival) mensajesInicio.push(lineaEstadoRival);
    mensajesInicio.push(lineaVamos);
    const nomJug = this._pokemonJugador?.nombreApodo ?? this._pokemonJugador?.nombre ?? 'Pokémon';
    const lineaEstadoJug = this._mensajeLineaEstadoJugadorDebug(nomJug, this._estadoJugadorDebug);
    if (lineaEstadoJug) mensajesInicio.push(lineaEstadoJug);

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
    graficos.fillEllipse(50, 76, 50, 12);
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

    this._textoNombreEnemigo.setText(sal.nombre?.toUpperCase() ?? '???');
    this._textoNivelEnemigo.setText(`Nv${sal.nivel ?? '?'}`);
    this._barraHpEnemigo.setValores(sal.hpActual ?? 100, sal.hpMax ?? 100);

    if (jug) {
      this._textoNombreJugador.setText((jug.nombreApodo ?? jug.nombre ?? '???').toUpperCase());
      this._textoNivelJugador.setText(`Nv${jug.nivel ?? '?'}`);
      this._barraHpJugador.setValores(jug.hpActual ?? jug.hpMax ?? 100, jug.hpMax ?? 100);
      this._textoHpNumerico.setText(`${jug.hpActual ?? '??'}/${jug.hpMax ?? '??'}`);
    }
  }

  // ── Sprites de Pokémon ────────────────────────────────────────────────

  _cargarSprites() {
    const idEnemigo = this._pokemonSalvaje.pokedexId ?? this._pokemonSalvaje.id;
    const idJugador = this._pokemonJugador?.idPokedex ?? this._pokemonJugador?.id ?? 1;

    const urlFrente = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-ii/gold/${idEnemigo}.png`;
    const urlEspalda = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/back/versions/generation-ii/gold/${idJugador}.png`;

    const keyEnemigo = `poke-frente-${idEnemigo}`;
    const keyJugador = `poke-espalda-${idJugador}`;

    const cargar = () => {
      if (this.textures.exists(keyEnemigo)) {
        this._mostrarSpriteEnemigo(keyEnemigo);
      } else {
        this.load.image(keyEnemigo, urlFrente);
        this.load.once(`filecomplete-image-${keyEnemigo}`, () => {
          this._mostrarSpriteEnemigo(keyEnemigo);
        });
        this.load.start();
      }

      if (this.textures.exists(keyJugador)) {
        this._mostrarSpriteJugador(keyJugador);
      } else {
        this.load.image(keyJugador, urlEspalda);
        this.load.once(`filecomplete-image-${keyJugador}`, () => {
          this._mostrarSpriteJugador(keyJugador);
        });
        this.load.start();
      }
    };

    cargar();
  }

  _mostrarSpriteEnemigo(key) {
    if (this._spriteEnemigo) this._spriteEnemigo.destroy();
    this._spriteEnemigo = this.add.image(108, 20, key)
      .setOrigin(0.5)
      .setScale(1.5);
  }

  _mostrarSpriteJugador(key) {
    if (this._spriteJugador) this._spriteJugador.destroy();
    this._spriteJugador = this.add.image(38, 56, key)
      .setOrigin(0.5)
      .setScale(1.5);
  }

  // ── Caja de texto ─────────────────────────────────────────────────────

  _crearMenuAcciones() {
    // Fondo caja de texto
    this._cajaTexto = this.add.graphics().setDepth(40);
    this._cajaTexto.fillStyle(0xf8f8f8, 1);
    this._cajaTexto.fillRect(0, 96, 160, 48);
    this._cajaTexto.lineStyle(1, 0x000000);
    this._cajaTexto.strokeRect(0, 96, 160, 48);

    // Texto de mensaje
    this._textoMensaje = this.add.text(6, 100, '', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
      wordWrap: { width: 86 },
      lineSpacing: 4,
    }).setOrigin(0).setDepth(41);

    // Menú de acciones (derecha de la caja)
    const acciones = this.add.graphics().setDepth(40);
    acciones.lineStyle(1, 0x000000);
    acciones.strokeRect(82, 96, 78, 48);

    const textoAcciones = ['LUCHAR', 'POKEMON', 'MOCHILA', 'HUIR'];
    const posAcciones = [
      { x: 88, y: 101 }, { x: 120, y: 101 },
      { x: 88, y: 120 }, { x: 120, y: 120 },
    ];

    this._cursores = [];
    this._textosAcciones = posAcciones.map((pos, i) => {
      const cursor = this.add.text(pos.x - 6, pos.y, '▶', {
        fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#000',
      }).setOrigin(0).setDepth(42).setVisible(false);
      this._cursores.push(cursor);

      return this.add.text(pos.x, pos.y, textoAcciones[i], {
        fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#000',
      }).setOrigin(0).setDepth(42);
    });

    this._seleccionAccion = 0;
    this._menuAccionesVisible = false;
    this._contenedorAcciones = [acciones, ...this._textosAcciones, ...this._cursores];
    this._contenedorAcciones.forEach(o => o.setVisible(false));
  }

  _mostrarMenuAcciones() {
    this._textoMensaje.setText('¿Qué hará\n' + (this._pokemonJugador?.nombreApodo ?? 'Pokémon') + '?');
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
    this._contenedorAcciones.forEach(o => o.setVisible(false));

    switch (indice) {
      case 0: this._accionLuchar(); break;
      case 1: this._mostrarTexto('¡Sin más\nPokémon!', () => this._mostrarMenuAcciones()); break;
      case 2: this._mostrarTexto('Mochila no\nimplementada.', () => this._mostrarMenuAcciones()); break;
      case 3: this._accionHuir(); break;
    }
  }

  // ── Acción: LUCHAR ────────────────────────────────────────────────────

  async _accionLuchar() {
    if (!this._pokemonJugador || this._movimientosJugador.length === 0) {
      this._mostrarTexto('¡Sin movimientos\ndisponibles!', () => this._mostrarMenuAcciones());
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

    this._mostrarTexto(`${jugador.nombreApodo ?? jugador.nombre}\nusó ${mov.nombre}!`);

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

      if (resultado.golpeCritico) {
        this._mostrarTexto('¡Golpe crítico!');
      }
      if (resultado.mensajeEfectividad) {
        this._mostrarTexto(resultado.mensajeEfectividad);
      }

      if (typeof resultado.hpRestanteAtacante === 'number' && jugador) {
        jugador.hpActual = resultado.hpRestanteAtacante;
        usarJuegoStore.getState().setPokemonHpEnEquipo(0, resultado.hpRestanteAtacante);
        this._barraHpJugador.setValores(resultado.hpRestanteAtacante, jugador.hpMax ?? 100);
        this._textoHpNumerico.setText(`${resultado.hpRestanteAtacante}/${jugador.hpMax ?? '??'}`);
      }

      const nuevoHpEnemigo = resultado.hpRestanteDefensor ?? 0;
      enemigo.hpActual = nuevoHpEnemigo;
      this._barraHpEnemigo.animarHacia(nuevoHpEnemigo, async () => {
        if (nuevoHpEnemigo <= 0) {
          await this._victoria();
          return;
        }

        this.time.delayedCall(500, () => this._turnoEnemigo());
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

    this._mostrarTexto(`¡${enemigo.nombre} usó\n${movEnemigo.nombre}!`);

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
      usarJuegoStore.getState().setPokemonHpEnEquipo(0, nuevoHpJugador);

      if (typeof resultado.hpRestanteAtacante === 'number') {
        enemigo.hpActual = resultado.hpRestanteAtacante;
        this._barraHpEnemigo.setValores(resultado.hpRestanteAtacante, enemigo.hpMax ?? 100);
      }

      this._barraHpJugador.animarHacia(nuevoHpJugador, () => {
        this._textoHpNumerico.setText(`${nuevoHpJugador}/${jugador.hpMax ?? '??'}`);

        if (nuevoHpJugador <= 0) {
          this._derrota();
        } else {
          this._mostrarMenuAcciones();
        }
      });
    } catch (e) {
      console.error('Error turno enemigo:', e);
      this._mostrarMenuAcciones();
    }
  }

  // ── Huida ──────────────────────────────────────────────────────────────

  _accionHuir() {
    this._mostrarTexto('¡Huiste con éxito!', () => {
      this._terminarBatalla();
    });
  }

  // ── Victoria / Derrota ────────────────────────────────────────────────

  async _victoria() {
    const xpGanada = Math.floor((this._pokemonSalvaje.nivel ?? 5) * 30);
    this._mostrarTexto(
      `¡${this._pokemonJugador?.nombreApodo ?? 'Pokémon'} ganó\n${xpGanada} Ptos. Exp.!`,
      () => this._terminarBatalla()
    );
  }

  _derrota() {
    this._mostrarTexto('¡Tu Pokémon no\npuede más!', () => {
      this._mostrarTexto('¡Te has quedado\nsin Pokémon!', () => {
        this._terminarBatalla();
      });
    });
  }

  _terminarBatalla() {
    this._musica?.stop();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop();
      this.scene.resume('EscenaOverworld');
    });
  }

  // ── Texto de batalla ───────────────────────────────────────────────────

  _mostrarTexto(texto, onFin) {
    this._textoMensaje.setText(texto);
    if (!onFin) return;

    this._contenedorAcciones.forEach(o => o.setVisible(false));
    this.time.delayedCall(1500, () => {
      if (onFin) onFin();
    });
  }

  // ── Cleanup ───────────────────────────────────────────────────────────

  shutdown() {
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
