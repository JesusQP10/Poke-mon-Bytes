class UIOpcionSiNo {
  constructor(scene) {
    this._scene = scene;
    this._contenedor = null;
    this._activo = false;
    this._seleccion = 0;
    this._onRespuesta = null;
    this._handlerTeclado = null;
    this._cursores = [];
  }

  mostrar(pregunta, onRespuesta) {
    this._onRespuesta = onRespuesta;
    this._seleccion = 0;
    this._activo = true;
    this._construirUI(pregunta);
    this._actualizarCursor();
    this._registrarTeclado();
  }

  ocultar() {
    this._activo = false;
    if (this._handlerTeclado) {
      this._scene.input.keyboard.off('keydown', this._handlerTeclado);
      this._handlerTeclado = null;
    }
    if (this._contenedor) {
      this._contenedor.destroy();
      this._contenedor = null;
    }
  }

  _construirUI(pregunta) {
    this._contenedor = this._scene.add.container(0, 0).setDepth(110).setScrollFactor(0);

    const cuadroX = 20;
    const cuadroY = 50;
    const cuadroAncho = 120;
    const cuadroAlto = 50;

    const fondo = this._scene.add.rectangle(cuadroX, cuadroY, cuadroAncho, cuadroAlto, 0xf8f8f8)
      .setOrigin(0)
      .setStrokeStyle(2, 0x000000);
    this._contenedor.add(fondo);

    const textoPregunta = this._scene.add.text(cuadroX + 8, cuadroY + 8, pregunta, {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
      wordWrap: { width: cuadroAncho - 16 },
      lineSpacing: 2,
    }).setOrigin(0);
    this._contenedor.add(textoPregunta);

    const opcionesX = cuadroX + cuadroAncho - 35;
    const opcionesY = cuadroY + 20;
    const opcionesAncho = 30;
    const opcionesAlto = 24;

    const fondoOpciones = this._scene.add.rectangle(opcionesX, opcionesY, opcionesAncho, opcionesAlto, 0xf8f8f8)
      .setOrigin(0)
      .setStrokeStyle(2, 0x000000);
    this._contenedor.add(fondoOpciones);

    const opcionSi = this._scene.add.text(opcionesX + 14, opcionesY + 4, 'Sí', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
    }).setOrigin(0);
    this._contenedor.add(opcionSi);

    const opcionNo = this._scene.add.text(opcionesX + 14, opcionesY + 14, 'No', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
    }).setOrigin(0);
    this._contenedor.add(opcionNo);

    const cursorSi = this._scene.add.text(opcionesX + 4, opcionesY + 4, '▶', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
    }).setOrigin(0).setVisible(false);
    this._contenedor.add(cursorSi);
    this._cursores.push(cursorSi);

    const cursorNo = this._scene.add.text(opcionesX + 4, opcionesY + 14, '▶', {
      fontFamily: '"Press Start 2P"',
      fontSize: '6px',
      fill: '#000000',
    }).setOrigin(0).setVisible(false);
    this._contenedor.add(cursorNo);
    this._cursores.push(cursorNo);
  }

  _actualizarCursor() {
    this._cursores.forEach((c, i) => c.setVisible(i === this._seleccion));
  }

  _registrarTeclado() {
    this._handlerTeclado = (event) => {
      if (!this._activo) return;

      switch (event.code) {
        case 'ArrowUp':
        case 'KeyW':
          this._seleccion = 0;
          this._actualizarCursor();
          break;

        case 'ArrowDown':
        case 'KeyS':
          this._seleccion = 1;
          this._actualizarCursor();
          break;

        case 'KeyZ':
        case 'Enter':
        case 'NumpadEnter':
          this._confirmar();
          break;
      }
    };
    this._scene.input.keyboard.on('keydown', this._handlerTeclado);
  }

  _confirmar() {
    const respuesta = this._seleccion === 0;
    this.ocultar();
    if (this._onRespuesta) {
      this._onRespuesta(respuesta);
    }
  }
}

export default UIOpcionSiNo;
