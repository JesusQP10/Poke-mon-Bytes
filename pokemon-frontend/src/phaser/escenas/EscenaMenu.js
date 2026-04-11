import Phaser from 'phaser';
import PuenteApi from '../puentes/PuenteApi';
import { usarJuegoStore } from '../../store/usarJuegoStore';

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

    // Fondo semitransparente sobre el overworld
    this.add.rectangle(0, 0, 160, 144, 0x000000, 0.3).setOrigin(0);

    // Panel del menú (esquina superior derecha, estilo GBC)
    const anchoMenu = 80;
    const altoMenu = OPCIONES.length * 14 + 8;
    const xMenu = 160 - anchoMenu - 2;
    const yMenu = 2;

    const fondo = this.add.rectangle(xMenu, yMenu, anchoMenu, altoMenu, 0xf8f8f8).setOrigin(0);
    fondo.setStrokeStyle(1, 0x000000);

    this._cursores = [];
    this._textos = OPCIONES.map((opcion, i) => {
      const y = yMenu + 6 + i * 14;

      const cursor = this.add.text(xMenu + 4, y, '▶', {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#000',
      }).setOrigin(0).setVisible(false);
      this._cursores.push(cursor);

      return this.add.text(xMenu + 14, y, opcion, {
        fontFamily: '"Press Start 2P"', fontSize: '6px', fill: '#000',
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
        this._mostrarMensaje('Mochila próximamente.');
        break;
      case 'GUARDAR':
        await this._guardar();
        break;
      case 'OPCIONES':
        this._mostrarMensaje('Opciones próximamente.');
        break;
      case 'SALIR':
        this._cerrar();
        break;
    }
  }

  async _guardar() {
    this._inputBloqueado = true; // Bloqueamos para que no spamee guardar
    const store = usarJuegoStore.getState();
    
    // Mostramos mensaje sin esperar tecla para cerrarlo aún
    this._crearCajaTexto('Guardando...');
    
    try {
      await PuenteApi.guardarJuego(store.posX, store.posY, store.mapaActual);
      // Reemplazamos la caja y ahora sí pedimos input para cerrar
      this._cajaMensaje?.destroy();
      this._textoMsg?.destroy();
      this._mostrarMensaje('¡Partida guardada!');
    } catch {
      this._cajaMensaje?.destroy();
      this._textoMsg?.destroy();
      this._mostrarMensaje('Error al guardar.');
    }
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
    this.children.removeAll();
    this.create(); // Reinicia el menú principal limpio
  }

  // MAGIA: Función interna solo para pintar la caja (útil para "Guardando...")
  _crearCajaTexto(texto) {
    if (this._cajaMensaje) this._cajaMensaje.destroy();
    if (this._textoMsg) this._textoMsg.destroy();

    this._cajaMensaje = this.add.rectangle(2, 100, 156, 42, 0xf8f8f8).setOrigin(0).setStrokeStyle(1, 0x000000);
    this._textoMsg = this.add.text(6, 104, texto, {
      fontFamily: '"Press Start 2P"', fontSize: '5px', fill: '#000', wordWrap: { width: 148 }, lineSpacing: 4,
    }).setOrigin(0);
  }

  _mostrarMensaje(texto) {
    this._inputBloqueado = true; // Bloquea los menús de fondo
    this._crearCajaTexto(texto);

    // MAGIA: Manejador único y limpio para cerrar mensajes sin fugas de eventos
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
    this.scene.stop();
    this.scene.resume('EscenaOverworld');
  }
}