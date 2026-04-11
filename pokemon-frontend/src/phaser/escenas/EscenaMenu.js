import Phaser from 'phaser';
import PuenteApi from '../puentes/PuenteApi';
import { crearMarcoDialogoRetro, estiloTextoDialogoRetro } from '../utils/marcoDialogoRetro';
import { usarJuegoStore } from '../../store/usarJuegoStore';
import { usarAutenticacionStore } from '../../store/usarAutenticacionStore';

const OPCIONES = ['POKÉMON', 'MOCHILA', 'GUARDAR', 'OPCIONES', 'SALIR'];

/**
 * EscenaMenu — menú in-game estilo GBC.
 * Se lanza sobre EscenaOverworld con scene.launch() y la pausa.
 * Al cerrar, resume EscenaOverworld.
 */
export default class EscenaMenu extends Phaser.Scene {
  constructor() {
    super({ key: 'EscenaMenu' });
  }

  create() {
    this._seleccion = 0;
    this._inputBloqueado = false; // MAGIA: Evita que el usuario mueva el menú mientras hay un mensaje

    // Limpiar tweens y eventos previos por si la escena se reinicia
    this.tweens.killAll(); 

    // Panel del menú (esquina superior derecha)
    const anchoMenu = 80;
    const altoMenu = OPCIONES.length * 14 + 8;
    const xMenu = 160 - anchoMenu - 2;
    const yMenu = 2;

    this.add.rectangle(0, 0, 160, 144, 0x000000, 0.38).setOrigin(0);
    crearMarcoDialogoRetro(this, xMenu, yMenu, anchoMenu, altoMenu);

    this._cursores = [];
    this._textos = OPCIONES.map((opcion, i) => {
      const y = yMenu + 6 + i * 14;

      const cursor = this.add.text(xMenu + 4, y, '▶', {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        fill: '#2040c0',
      }).setOrigin(0).setVisible(false);
      this._cursores.push(cursor);

      return this.add.text(xMenu + 14, y, opcion, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '6px',
        fill: '#1a222c',
      }).setOrigin(0);
    });

    this._actualizarCursor();

    // Input principal
    this.input.keyboard.on('keydown', this._manejarInput, this);
  }

  _actualizarCursor() {
    this._cursores.forEach((c, i) => {
      if (i === this._seleccion) {
        c.setVisible(true);
        // MAGIA: Animación de parpadeo retro para el cursor activo
        c.setAlpha(1);
        if (!c.tween) {
          c.tween = this.tweens.add({
            targets: c,
            alpha: 0,
            duration: 400,
            yoyo: true,
            repeat: -1
          });
        } else {
          c.tween.play();
        }
      } else {
        c.setVisible(false);
        if (c.tween) {
          c.tween.pause();
          c.setAlpha(1);
        }
      }
    });
  }

  _manejarInput(event) {
    if (this._inputBloqueado) return; // Si hay un mensaje o guardando, ignorar input

    switch (event.code) {
      case 'ArrowUp': case 'KeyW':
        if (this._seleccion > 0) this._seleccion--;
        this._actualizarCursor();
        break;
      case 'ArrowDown': case 'KeyS':
        if (this._seleccion < OPCIONES.length - 1) this._seleccion++;
        this._actualizarCursor();
        break;
      case 'KeyZ': case 'Enter': case 'NumpadEnter':
        this._seleccionarOpcion(this._seleccion);
        break;
      case 'KeyX': case 'Escape':
        this._cerrar();
        break;
    }
  }

  async _seleccionarOpcion(indice) {
    switch (OPCIONES[indice]) {
      case 'POKÉMON':
        this._mostrarEquipo();
        break;
      case 'MOCHILA':
        this._mostrarMochila();
        break;
      case 'GUARDAR':
        await this._guardar();
        break;
      case 'OPCIONES':
        this._mostrarMensaje(
          'OPCIONES\n\nSin ajustes aún\n(volumen, textos…).\n\nPróximamente.',
        );
        break;
      case 'SALIR':
        this._cerrar();
        break;
    }
  }

  async _guardar() {
    this._inputBloqueado = true;
    this._crearCajaTexto('Guardando...');

    try {
      usarJuegoStore.getState().guardarPartidaLocal();
    } catch {
      this._cajaMensaje?.destroy();
      this._textoMsg?.destroy();
      this._mostrarMensaje('No se pudo guardar\nen el navegador.');
      return;
    }

    const payload = usarJuegoStore.getState().construirPayloadGuardado();
    let servidorOk = false;
    if (usarAutenticacionStore.getState().token) {
      try {
        await PuenteApi.guardarJuegoEnServidor(payload);
        servidorOk = true;
      } catch {
        /* Error de red o 401 */
      }
    }

    this._cajaMensaje?.destroy();
    this._textoMsg?.destroy();
    const msg = servidorOk
      ? '¡Partida guardada!\n(En el ordenador\ny en el servidor.)'
      : '¡Partida guardada!\n(Solo en este ordenador.)';
    this._mostrarMensaje(msg);
  }

  _mostrarMochila() {
    const inv = usarJuegoStore.getState().inventario ?? [];
    if (!inv.length) {
      this._mostrarMensaje('La mochila está vacía.');
      return;
    }

    const conteo = new Map();
    for (const it of inv) {
      const clave = it.id || it.nombre || '?';
      const n = Number.isFinite(Number(it.cantidad)) ? Number(it.cantidad) : 1;
      conteo.set(clave, (conteo.get(clave) || 0) + n);
    }

    const lineas = [];
    conteo.forEach((cant, clave) => {
      const muestra = inv.find((x) => (x.id || x.nombre) === clave);
      const nombre = muestra?.nombre || clave;
      lineas.push(`×${cant}  ${nombre}`);
    });

    this._mostrarPantallaMochila(lineas);
  }

  _mostrarPantallaMochila(lineas) {
    this.tweens.killAll();
    this.children.removeAll();

    this.add.rectangle(0, 0, 160, 144, 0x183018).setOrigin(0);

    this.add.text(80, 8, 'MOCHILA', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#e8f8e8',
    }).setOrigin(0.5);

    this.add.text(8, 22, lineas.join('\n'), {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#ffffff',
      lineSpacing: 6,
      wordWrap: { width: 146 },
    }).setOrigin(0);

    this.add.text(80, 130, 'X · Volver al menú', {
      fontFamily: '"Press Start 2P"',
      fontSize: '4px',
      fill: '#9aba9a',
    }).setOrigin(0.5);

    this.input.keyboard.off('keydown', this._manejarInput, this);
    this._handlerMochila = (event) => {
      if (event.code === 'KeyX' || event.code === 'Escape') {
        this.input.keyboard.off('keydown', this._handlerMochila);
        this._handlerMochila = null;
        this._volverAlMenuPrincipal();
      }
    };
    this.input.keyboard.on('keydown', this._handlerMochila);
  }

  _mostrarEquipo() {
    const store = usarJuegoStore.getState();
    const equipo = store.team ?? [];
    
    if (equipo.length === 0) {
      this._mostrarMensaje('Sin Pokémon en\nel equipo.');
      return;
    }

    this._mostrarPantallaEquipo(equipo);
  }

  _mostrarPantallaEquipo(equipo) {
    // Limpiar menú actual y tweens
    this.tweens.killAll();
    this.children.removeAll();
    
    // Fondo completo
    this.add.rectangle(0, 0, 160, 144, 0x2040a0).setOrigin(0);
    
    // Título
    this.add.text(80, 8, 'POKÉMON', {
      fontFamily: '"Press Start 2P"',
      fontSize: '8px',
      fill: '#ffffff',
    }).setOrigin(0.5);

    // Lista de Pokémon
    this._equipoSeleccion = 0;
    this._equipoCursores = [];
    
    equipo.forEach((pokemon, i) => {
      const y = 24 + i * 16;
      
      const cursor = this.add.text(8, y, '▶', {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ffff00',
      }).setOrigin(0).setVisible(i === 0);
      this._equipoCursores.push(cursor);
      
      const nombre = pokemon.nombreApodo || pokemon.nombre || '???';
      this.add.text(20, y, nombre, {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ffffff',
      }).setOrigin(0);
      
      this.add.text(100, y, `Nv${pokemon.nivel || 5}`, {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#ffffff',
      }).setOrigin(0);
      
      const hpActual = pokemon.hpActual || pokemon.hpMax || 20;
      const hpMax = pokemon.hpMax || 20;
      this.add.text(130, y, `${hpActual}/${hpMax}`, {
        fontFamily: '"Press Start 2P"', fontSize: '5px',
        fill: hpActual > hpMax * 0.5 ? '#00ff00' : hpActual > hpMax * 0.2 ? '#ffff00' : '#ff0000',
      }).setOrigin(0);
    });

    this._mostrarDetallesPokemon(equipo[0]);
    this._actualizarCursorEquipo(); // Añadido para el parpadeo
    
    // Instrucciones
    this.add.text(80, 130, '↑↓ Navegar  Z Detalles  X Volver', {
      fontFamily: '"Press Start 2P"', fontSize: '4px', fill: '#cccccc',
    }).setOrigin(0.5);

    // Input para navegación del equipo
    this.input.keyboard.off('keydown', this._manejarInput, this);
    this.input.keyboard.on('keydown', this._manejarInputEquipo, this);
  }

  _mostrarDetallesPokemon(pokemon) {
    if (this._detallesPokemon) {
      this._detallesPokemon.forEach(obj => obj.destroy());
    }
    this._detallesPokemon = [];
    
    if (!pokemon) return;
    
    const x = 8; const y = 90;
    
    const fondo = this.add.rectangle(x, y, 144, 32, 0x1030c0).setOrigin(0);
    fondo.setStrokeStyle(1, 0x4060ff);
    this._detallesPokemon.push(fondo);
    
    if (pokemon.tipo1) {
      const tipoTexto = this.add.text(x + 4, y + 4, `Tipo: ${pokemon.tipo1}${pokemon.tipo2 ? '/' + pokemon.tipo2 : ''}`, {
        fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#ffffff',
      }).setOrigin(0);
      this._detallesPokemon.push(tipoTexto);
    }
    
    const stats = [
      `ATK: ${pokemon.ataque || 12}`,
      `DEF: ${pokemon.defensa || 10}`,
      `VEL: ${pokemon.velocidad || 8}`
    ];
    
    stats.forEach((stat, i) => {
      const statTexto = this.add.text(x + 4 + (i * 35), y + 14, stat, {
        fontFamily: '"Press Start 2P"', fontSize: '4px', fill: '#cccccc',
      }).setOrigin(0);
      this._detallesPokemon.push(statTexto);
    });
  }

  _manejarInputEquipo(event) {
    if (this._inputBloqueado) return; // Protección antimissclick

    const store = usarJuegoStore.getState();
    const equipo = store.team ?? [];
    
    switch (event.code) {
      case 'ArrowUp': case 'KeyW':
        if (this._equipoSeleccion > 0) {
          this._equipoSeleccion--;
          this._actualizarCursorEquipo();
          this._mostrarDetallesPokemon(equipo[this._equipoSeleccion]);
        }
        break;
      case 'ArrowDown': case 'KeyS':
        if (this._equipoSeleccion < equipo.length - 1) {
          this._equipoSeleccion++;
          this._actualizarCursorEquipo();
          this._mostrarDetallesPokemon(equipo[this._equipoSeleccion]);
        }
        break;
      case 'KeyZ': case 'Enter': case 'NumpadEnter':
        this._mostrarDetallesCompletos(equipo[this._equipoSeleccion]);
        break;
      case 'KeyX': case 'Escape':
        this._volverAlMenuPrincipal();
        break;
    }
  }

  _actualizarCursorEquipo() {
    this._equipoCursores.forEach((cursor, i) => {
      if (i === this._equipoSeleccion) {
        cursor.setVisible(true);
        cursor.setAlpha(1);
        if (!cursor.tween) {
          cursor.tween = this.tweens.add({ targets: cursor, alpha: 0, duration: 400, yoyo: true, repeat: -1 });
        } else {
          cursor.tween.play();
        }
      } else {
        cursor.setVisible(false);
        if (cursor.tween) {
          cursor.tween.pause();
          cursor.setAlpha(1);
        }
      }
    });
  }

  _mostrarDetallesCompletos(pokemon) {
    this._mostrarMensaje(`${pokemon.nombre || '???'}\nNivel ${pokemon.nivel || 5}\n\nDetalles completos\npróximamente...`);
  }

  _volverAlMenuPrincipal() {
    this.input.keyboard.off('keydown', this._manejarInputEquipo, this);
    if (this._handlerMochila) {
      this.input.keyboard.off('keydown', this._handlerMochila);
      this._handlerMochila = null;
    }
    this.children.removeAll();
    this.create(); // Reinicia el menú principal limpio
  }

  // Función interna solo para pintar la caja
  _crearCajaTexto(texto) {
    if (this._cajaMensaje) this._cajaMensaje.destroy();
    if (this._textoMsg) this._textoMsg.destroy();

    this._cajaMensaje = crearMarcoDialogoRetro(this, 1, 100, 158, 44);
    this._textoMsg = this.add.text(8, 106, texto, {
      ...estiloTextoDialogoRetro(142),
      fontSize: '5px',
      lineSpacing: 4,
    }).setOrigin(0);
  }

  _mostrarMensaje(texto) {
    this._inputBloqueado = true; // Bloquea los menús de fondo
    this._crearCajaTexto(texto);

    // Manejador único para cerrar mensajes sin fugas de eventos
    const cerrarMensaje = (event) => {
      const teclasAceptadas = ['KeyZ', 'Enter', 'NumpadEnter', 'KeyX', 'Escape'];
      if (teclasAceptadas.includes(event.code)) {
        this._cajaMensaje?.destroy();
        this._textoMsg?.destroy();
        this._inputBloqueado = false; // Desbloqueamos menús
        this.input.keyboard.off('keydown', cerrarMensaje); // Nos limpiamos a nosotros mismos
      }
    };

    // Usamos on en lugar de once para filtrar las teclas correctas
    this.input.keyboard.on('keydown', cerrarMensaje);
  }

  _cerrar() {
    this.tweens.killAll(); // Limpiar animaciones al salir
    this.input.keyboard.off('keydown', this._manejarInput, this);
    if (this._handlerMochila) {
      this.input.keyboard.off('keydown', this._handlerMochila);
      this._handlerMochila = null;
    }
    this.scene.stop();
    this.scene.resume('EscenaOverworld');
  }
}