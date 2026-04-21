import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usarJuegoStore } from "../../store/usarJuegoStore";
import { usarAutenticacionStore } from "../../store/usarAutenticacionStore";
import PuenteApi from "../../phaser/puentes/PuenteApi";
import {
  esTeclaAceptar,
  esTeclaAtras,
  esTeclaAbajo,
  esTeclaArriba,
  esTeclaIzquierda,
  esTeclaDerecha,
} from "../../config/controlesJuego";
import {
  leerOpcionesCliente,
  escribirOpcionesCliente,
  pasoBgmPercent,
} from "../../config/opcionesCliente";
import { textosPanelOpciones } from "../../config/textosOpcionesUi";
import "./MenuIngameReact.css";
import "./DialogoRetro.css";
import iconSlotParty from "../../assets/ui/menu/icon_slot_party.png";
import iconPocion from "../../assets/ui/menu/icon_pocion.png";
import retratoEntrenadorFicha from "../../assets/game/overworld/sprites/player/pixilart_drawing.png";
import {
  fetchResumenPokemonPokeapi,
  urlGifCrystalStarter,
  etiquetaTipoEspanol,
} from "../../services/pokemonDetallePokeapi";
import { urlMiniMenuInicialPorPokedexId } from "../../assets/pokemon/starters/portraitUrls";
import { statCombateMenu } from "../../config/statsCombateMenuFallback";
import { urlIconoItemPorNombre } from "../../config/iconosItems";

/** @param {number} totalSeg */
function formatearTiempoJuegoGen3(totalSeg) {
  const s = Math.max(0, Math.floor(totalSeg));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${h} ${String(m).padStart(2, "0")}`;
}

/** @param {unknown[]} badges */
function contarMedallas(badges) {
  if (!Array.isArray(badges)) return 0;
  return badges.length;
}

/** @returns {{ clave: string, nombre: string, cantidad: number }[]} */
function agregarInventarioAgrupado(inventario) {
  const conteo = new Map();
  for (const it of inventario ?? []) {
    const clave = it.id || it.nombre || "?";
    const n = Number.isFinite(Number(it.cantidad)) ? Number(it.cantidad) : 1;
    conteo.set(clave, (conteo.get(clave) || 0) + n);
  }
  const lineas = [];
  conteo.forEach((cant, clave) => {
    const muestra = inventario.find((x) => (x.id || x.nombre) === clave);
    const nombre = muestra?.nombre || clave;
    lineas.push({ clave, nombre, cantidad: cant });
  });
  lineas.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
  return lineas;
}

function colorHp(hpActual, hpMax) {
  if (hpMax <= 0) return "menu-ingame-hp-ok";
  const r = hpActual / hpMax;
  if (r > 0.5) return "menu-ingame-hp-ok";
  if (r > 0.2) return "menu-ingame-hp-warn";
  return "menu-ingame-hp-bad";
}

function hpRatio(hpActual, hpMax) {
  if (!hpMax || hpMax <= 0) return 0;
  return Math.max(0, Math.min(1, hpActual / hpMax));
}

/**
 * @param {{ pokemonUsuarioId?: unknown, id?: unknown }} p
 * @param {{ pokemonUsuarioId?: unknown, id?: unknown, pokedexId?: unknown } | null | undefined} starter
 */
function esMismoPokemonQueStarter(p, starter) {
  if (!p || !starter) return false;
  const sid = starter.pokemonUsuarioId;
  const pid = p.pokemonUsuarioId;
  if (sid != null && pid != null) return sid === pid;
  return Number(p.id) === Number(starter.id ?? starter.pokedexId);
}

/** Últimos 4 movimientos del array (orden por nivel asc. de PokéAPI); huecos en `null`. */
function slotsCuatroMovimientos(movs) {
  const slots = [null, null, null, null];
  if (!Array.isArray(movs) || movs.length === 0) return slots;
  const last = movs.slice(-4);
  const start = 4 - last.length;
  for (let i = 0; i < last.length; i++) slots[start + i] = last[i];
  return slots;
}

/**
 * Menú in-game (tecla X) en React.
 *
 * @param {{ onClose: () => void }} props
 */
const MenuIngameReact = ({ onClose }) => {
  const [vista, setVista] = useState("principal");
  const [selPrincipal, setSelPrincipal] = useState(0);
  const [selEquipo, setSelEquipo] = useState(0);
  const [selMochila, setSelMochila] = useState(0);
  const [selOpciones, setSelOpciones] = useState(0);
  const [selAccionMochila, setSelAccionMochila] = useState(0);
  const [selPokemonMochila, setSelPokemonMochila] = useState(0);
  const [itemAccionActual, setItemAccionActual] = useState(null);
  const [cantidadTirar, setCantidadTirar] = useState(1);
  const [confirmCallback, setConfirmCallback] = useState(null);
  const [cargandoItem, setCargandoItem] = useState(false);
  const enOperacionRef = useRef(false);
  const [prefs, setPrefs] = useState(() => leerOpcionesCliente());
  const [dialogo, setDialogo] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [detalleApi, setDetalleApi] = useState({ status: "idle" });
  const [fichaMuestraMovimientos, setFichaMuestraMovimientos] = useState(false);

  const tOpc = useMemo(
    () => textosPanelOpciones(prefs.locale === "en" ? "en" : "es"),
    [prefs.locale],
  );

  const inventario = usarJuegoStore((s) => s.inventario);
  const team = usarJuegoStore((s) => s.team);
  const starter = usarJuegoStore((s) => s.starter);
  const nombreJugador = usarJuegoStore((s) => s.nombreJugador);
  const money = usarJuegoStore((s) => s.money);
  const badges = usarJuegoStore((s) => s.badges);
  const pokedexRegistrados = usarJuegoStore((s) => s.pokedexRegistrados);
  const tiempoJuegoSegundos = usarJuegoStore((s) => s.tiempoJuegoSegundos);
  const idEntrenadorPublico = usarJuegoStore((s) => s.idEntrenadorPublico);
  const mapaActual = usarJuegoStore((s) => s.mapaActual);
  const posX = usarJuegoStore((s) => s.posX);
  const posY = usarJuegoStore((s) => s.posY);
  const token = usarAutenticacionStore((s) => s.token);

  const opcionesMenuPrincipal = useMemo(() => {
    const etiquetaNombre = (nombreJugador?.trim() || "…").toUpperCase();
    return [
      { clave: "ficha", label: etiquetaNombre },
      { clave: "pokemon", label: "POKÉMON" },
      { clave: "mochila", label: "MOCHILA" },
      { clave: "guardar", label: "GUARDAR" },
      { clave: "opciones", label: "OPCIONES" },
      { clave: "salir", label: "SALIR" },
    ];
  }, [nombreJugador]);

  /** Solo si hay snapshot de GUARDAR en menú en disco: rellena equipo/mochila en RAM si venían vacíos. */
  useEffect(() => {
    usarJuegoStore.getState().rellenarEquipoYmochilaDesdeGuardadoLocal();
  }, []);

  useEffect(() => {
    if (vista !== "ficha-entrenador") return;
    usarJuegoStore.getState().asegurarIdEntrenadorPublico({
      nombreJugador,
      mapaActual,
      posX,
      posY,
    });
  }, [vista, nombreJugador, mapaActual, posX, posY]);

  const lineasMochila = useMemo(() => agregarInventarioAgrupado(inventario), [inventario]);
  const equipo = useMemo(() => (Array.isArray(team) ? team : []), [team]);

  const pokemonSeleccionado = useMemo(() => equipo[selEquipo] ?? null, [equipo, selEquipo]);

  const detallePokedexId = pokemonSeleccionado?.id;
  const nivelPokemonFicha = (() => {
    const n = Number(pokemonSeleccionado?.nivel);
    return Number.isFinite(n) && n > 0 ? Math.min(100, Math.floor(n)) : 5;
  })();

  useEffect(() => {
    if (vista !== "equipo-detalle" || detallePokedexId == null) {
      return;
    }
    const id = detallePokedexId;
    let cancelled = false;
    fetchResumenPokemonPokeapi(id, nivelPokemonFicha)
      .then((data) => {
        if (!cancelled) setDetalleApi({ status: "ok", data, pokedexId: id });
      })
      .catch(() => {
        if (!cancelled) setDetalleApi({ status: "err", pokedexId: id });
      });
    return () => {
      cancelled = true;
    };
  }, [vista, detallePokedexId, nivelPokemonFicha]);

  useEffect(() => {
    if (vista !== "equipo-detalle") setFichaMuestraMovimientos(false);
  }, [vista]);

  const detalleApiUi = useMemo(() => {
    if (vista !== "equipo-detalle" || detallePokedexId == null) {
      return { status: "idle" };
    }
    if (detalleApi.status === "ok" && detalleApi.pokedexId === detallePokedexId) {
      return detalleApi;
    }
    if (detalleApi.status === "err" && detalleApi.pokedexId === detallePokedexId) {
      return detalleApi;
    }
    return { status: "loading" };
  }, [vista, detallePokedexId, detalleApi]);

  const selMochilaSafe = useMemo(
    () =>
      lineasMochila.length ? Math.min(Math.max(0, selMochila), lineasMochila.length - 1) : 0,
    [selMochila, lineasMochila],
  );

  const cerrarTodo = useCallback(() => {
    onClose();
  }, [onClose]);

  const volverPrincipal = useCallback(() => {
    setVista("principal");
    setDialogo(null);
    setSelOpciones(0);
  }, []);

  const abrirDialogo = useCallback((texto) => {
    setDialogo(texto);
  }, []);

  const ejecutarGuardar = useCallback(async () => {
    setGuardando(true);
    setDialogo(null);
    try {
      usarJuegoStore.getState().guardarPartidaLocal({ desdeGuardadoMenu: true });
    } catch {
      setGuardando(false);
      abrirDialogo("No se pudo guardar\nen el navegador.");
      return;
    }

    const payload = usarJuegoStore.getState().construirPayloadGuardado();
    let servidorOk = false;
    if (token) {
      try {
        await PuenteApi.guardarJuegoEnServidor(payload);
        servidorOk = true;
      } catch {
        /* red o 401 */
      }
    }

    setGuardando(false);
    const msg = servidorOk
      ? "¡Partida guardada!\n(En el ordenador\ny en el servidor.)"
      : "¡Partida guardada!\n(Solo en este ordenador.)";
    abrirDialogo(msg);
  }, [abrirDialogo, token]);

  const accionPrincipal = useCallback(
    (indice) => {
      const op = opcionesMenuPrincipal[indice]?.clave;
      if (op === "ficha") {
        setVista("ficha-entrenador");
        return;
      }
      if (op === "pokemon") {
        if (!equipo.length) {
          abrirDialogo("Sin Pokémon en\nel equipo.");
          return;
        }
        setSelEquipo(0);
        setVista("equipo");
        return;
      }
      if (op === "mochila") {
        if (!lineasMochila.length) {
          abrirDialogo("La mochila está vacía.");
          return;
        }
        setSelMochila(0);
        setVista("mochila");
        return;
      }
      if (op === "guardar") {
        void ejecutarGuardar();
        return;
      }
      if (op === "opciones") {
        setSelOpciones(0);
        setPrefs(leerOpcionesCliente());
        setVista("opciones");
        return;
      }
      if (op === "salir") {
        cerrarTodo();
      }
    },
    [abrirDialogo, cerrarTodo, equipo.length, ejecutarGuardar, lineasMochila.length, opcionesMenuPrincipal],
  );

  const accionesMochila = ["USAR", "TIRAR", "CANCELAR"];

  useEffect(() => {
    const manejar = (e) => {
      if (guardando || cargandoItem || enOperacionRef.current) return;

      if (dialogo) {
        if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          if (confirmCallback) {
            const fn = confirmCallback;
            enOperacionRef.current = true;
            setConfirmCallback(null);
            setDialogo(null);
            fn();
          } else {
            setDialogo(null);
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          setConfirmCallback(null);
          setDialogo(null);
        }
        return;
      }

      if (vista === "ficha-entrenador") {
        if (esTeclaAtras(e.code)) {
          e.preventDefault();
          volverPrincipal();
        }
        return;
      }

      if (vista === "principal") {
        const nOp = opcionesMenuPrincipal.length;
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelPrincipal((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelPrincipal((i) => Math.min(nOp - 1, i + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          accionPrincipal(selPrincipal);
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          cerrarTodo();
        }
        return;
      }

      if (vista === "mochila") {
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelMochila((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelMochila((i) => Math.min(lineasMochila.length - 1, i + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          const it = lineasMochila[selMochilaSafe];
          if (it) {
            setItemAccionActual(it);
            setSelAccionMochila(0);
            setVista("mochila-accion");
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          volverPrincipal();
        }
        return;
      }

      if (vista === "mochila-accion") {
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelAccionMochila((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelAccionMochila((i) => Math.min(accionesMochila.length - 1, i + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          const accion = accionesMochila[selAccionMochila];
          if (accion === "CANCELAR") {
            setVista("mochila");
          } else if (accion === "USAR") {
            if (!equipo.length) {
              abrirDialogo("No tienes\nPokémon en\nel equipo.");
              return;
            }
            setSelPokemonMochila(0);
            setVista("mochila-pokemon");
          } else if (accion === "TIRAR") {
            setCantidadTirar(1);
            setVista("mochila-tirar-cantidad");
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          setVista("mochila");
        }
        return;
      }

      if (vista === "mochila-tirar-cantidad") {
        const maxCantidad = itemAccionActual?.cantidad ?? 1;
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setCantidadTirar((c) => Math.min(c + 1, maxCantidad));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setCantidadTirar((c) => Math.max(1, c - 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          const nombre = itemAccionActual?.nombre ?? "ítem";
          const cantidad = cantidadTirar;
          enOperacionRef.current = true;
          setCargandoItem(true);
          PuenteApi.tirarInventario({ nombreItem: nombre, cantidad })
            .then(() => {
              const invRestante = usarJuegoStore.getState().inventario;
              abrirDialogo(`¡Tiraste\n${cantidad}× ${nombre}!`);
              setVista(invRestante.length > 0 ? "mochila" : "principal");
            })
            .catch((err) => {
              const msg = err?.response?.data?.error ?? "No se pudo\ntirar el ítem.";
              abrirDialogo(msg);
              setVista("mochila-accion");
            })
            .finally(() => {
              setCargandoItem(false);
              enOperacionRef.current = false;
            });
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          setVista("mochila-accion");
        }
        return;
      }

      if (vista === "mochila-pokemon") {
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelPokemonMochila((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelPokemonMochila((i) => Math.min(equipo.length - 1, i + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          const p = equipo[selPokemonMochila];
          const nombre = itemAccionActual?.nombre ?? "ítem";
          if (!p) return;
          enOperacionRef.current = true;
          setCargandoItem(true);
          PuenteApi.usarItemInventario({
            nombreItem: nombre,
            pokemonObjetivoId: p.pokemonUsuarioId,
          })
            .then((res) => {
              abrirDialogo(res?.mensaje ?? `¡Usaste\n${nombre}!`);
              setVista("mochila");
            })
            .catch((err) => {
              const msg = err?.response?.data?.error ?? "No se pudo\nusar el ítem.";
              abrirDialogo(msg);
              setVista("mochila");
            })
            .finally(() => {
              setCargandoItem(false);
              enOperacionRef.current = false;
            });
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          setVista("mochila-accion");
        }
        return;
      }

      if (vista === "opciones") {
        const filas = 4;
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelOpciones((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelOpciones((i) => Math.min(filas - 1, i + 1));
        } else if (esTeclaIzquierda(e.code) || esTeclaDerecha(e.code)) {
          e.preventDefault();
          const dir = esTeclaDerecha(e.code) ? 1 : -1;
          if (selOpciones === 0) {
            const next = pasoBgmPercent(prefs.bgmPercent, dir);
            setPrefs(escribirOpcionesCliente({ bgmPercent: next }));
          } else if (selOpciones === 1) {
            if (dir !== 0) {
              setPrefs(escribirOpcionesCliente({ sfxOn: !prefs.sfxOn }));
            }
          } else if (selOpciones === 2) {
            if (dir !== 0) {
              setPrefs(escribirOpcionesCliente({ textoRapido: !prefs.textoRapido }));
            }
          } else if (selOpciones === 3) {
            const nextLoc = prefs.locale === "es" ? "en" : "es";
            setPrefs(escribirOpcionesCliente({ locale: nextLoc }));
          }
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          if (selOpciones === 0) {
            const next = pasoBgmPercent(prefs.bgmPercent, 1);
            setPrefs(escribirOpcionesCliente({ bgmPercent: next }));
          } else if (selOpciones === 1) {
            setPrefs(escribirOpcionesCliente({ sfxOn: !prefs.sfxOn }));
          } else if (selOpciones === 2) {
            setPrefs(escribirOpcionesCliente({ textoRapido: !prefs.textoRapido }));
          } else {
            const nextLoc = prefs.locale === "es" ? "en" : "es";
            setPrefs(escribirOpcionesCliente({ locale: nextLoc }));
          }
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          volverPrincipal();
        }
        return;
      }

      if (vista === "equipo-detalle") {
        if (esTeclaAtras(e.code)) {
          e.preventDefault();
          if (fichaMuestraMovimientos) {
            setFichaMuestraMovimientos(false);
            return;
          }
          setVista("equipo");
          return;
        }
        if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          if (fichaMuestraMovimientos) return;
          const pid = pokemonSeleccionado?.id;
          const apiParaEstaFicha =
            pid != null && detalleApi.pokedexId === pid ? detalleApi : null;
          if (!apiParaEstaFicha || apiParaEstaFicha.status === "idle") {
            abrirDialogo("Cargando datos\nde PokéAPI…");
            return;
          }
          if (apiParaEstaFicha.status === "err") {
            abrirDialogo("No se pudieron cargar\nlos movimientos\n(PokéAPI).");
            return;
          }
          const movs = apiParaEstaFicha.data?.movimientosPorNivel;
          if (!Array.isArray(movs)) {
            abrirDialogo("Sin lista de\nmovimientos.");
            return;
          }
          setFichaMuestraMovimientos(true);
        }
        return;
      }

      if (vista === "equipo") {
        if (esTeclaArriba(e.code)) {
          e.preventDefault();
          setSelEquipo((i) => Math.max(0, i - 1));
        } else if (esTeclaAbajo(e.code)) {
          e.preventDefault();
          setSelEquipo((i) => Math.min(equipo.length - 1, i + 1));
        } else if (esTeclaAceptar(e.code)) {
          e.preventDefault();
          const p = equipo[selEquipo];
          if (p) setVista("equipo-detalle");
        } else if (esTeclaAtras(e.code)) {
          e.preventDefault();
          volverPrincipal();
        }
      }
    };

    window.addEventListener("keydown", manejar);
    return () => window.removeEventListener("keydown", manejar);
  }, [
    accionPrincipal,
    cerrarTodo,
    cantidadTirar,
    cargandoItem,
    confirmCallback,
    dialogo,
    equipo,
    guardando,
    itemAccionActual,
    lineasMochila,
    prefs,
    selAccionMochila,
    selEquipo,
    selMochilaSafe,
    selOpciones,
    selPokemonMochila,
    selPrincipal,
    vista,
    volverPrincipal,
    abrirDialogo,
    opcionesMenuPrincipal.length,
    detalleApi,
    pokemonSeleccionado,
    fichaMuestraMovimientos,
  ]);

  const hint = (() => {
    if (guardando || cargandoItem) return "…";
    if (dialogo) return confirmCallback ? "Z · sí · X · cancelar" : "Z / X · continuar";
    if (vista === "principal") return "↑↓ · Z aceptar · X cerrar";
    if (vista === "ficha-entrenador") return "X · volver al menú";
    if (vista === "equipo") return "↑↓ · Z datos · X menú";
    if (vista === "equipo-detalle") {
      return fichaMuestraMovimientos ? "X · volver a la ficha" : "Z · movimientos · X · equipo";
    }
    if (vista === "mochila") return "↑↓ · Z acción · X menú";
    if (vista === "mochila-accion") return "↑↓ · Z elegir · X volver";
    if (vista === "mochila-tirar-cantidad") return "↑↓ · cantidad · Z confirmar · X cancelar";
    if (vista === "mochila-pokemon") return "↑↓ · Z usar · X cancelar";
    if (vista === "opciones") return tOpc.hintOpcionesIngame;
    return "";
  })();

  const pSel = pokemonSeleccionado;
  const mostrarFichaPokemon = vista === "equipo-detalle" && pSel;
  const imgPokemonDetalle = mostrarFichaPokemon
    ? urlGifCrystalStarter(pSel.id) ||
      (detalleApiUi.status === "ok" && detalleApiUi.data?.spriteUrl
        ? detalleApiUi.data.spriteUrl
        : null) ||
      pSel.sprite ||
      null
    : null;
  const tiposDetalle =
    mostrarFichaPokemon && detalleApiUi.status === "ok" && detalleApiUi.data?.tiposEs?.length
      ? detalleApiUi.data.tiposEs.join(" / ")
      : mostrarFichaPokemon
        ? [etiquetaTipoEspanol(pSel.tipo1), pSel.tipo2 ? etiquetaTipoEspanol(pSel.tipo2) : ""]
            .filter(Boolean)
            .join(" / ") || "—"
        : "";

  const slotsMovimientosUi = useMemo(
    () =>
      detalleApiUi.status === "ok" && Array.isArray(detalleApiUi.data?.movimientosPorNivel)
        ? slotsCuatroMovimientos(detalleApiUi.data.movimientosPorNivel)
        : slotsCuatroMovimientos([]),
    [detalleApiUi],
  );

  const etiquetaNombrePokemonFicha =
    (pSel?.nombreApodo && pSel.nombreApodo !== pSel.nombre
      ? pSel.nombreApodo
      : pSel?.nombre) || "???";

  const idFicha =
    idEntrenadorPublico && String(idEntrenadorPublico).trim() !== ""
      ? String(idEntrenadorPublico)
      : "-----";
  const nombreFicha = (nombreJugador?.trim() || "???").toUpperCase();
  const nPokedex = Array.isArray(pokedexRegistrados) ? pokedexRegistrados.length : 0;
  const nMedallas = contarMedallas(badges);
  const tiempoFicha = formatearTiempoJuegoGen3(tiempoJuegoSegundos ?? 0);

  return (
    <div className="menu-ingame-root" role="dialog" aria-modal="true">
      <div className="menu-ingame-backdrop" aria-hidden />

      {vista === "principal" && (
        <div className="menu-ingame-panel menu-ingame-panel--wide">
          <div className="menu-ingame-title">MENÚ</div>
          {opcionesMenuPrincipal.map((op, i) => (
            <div
              key={op.clave}
              className={`menu-ingame-row${i === selPrincipal ? " menu-ingame-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{i === selPrincipal ? "▶" : ""}</span>
              <span className="menu-ingame-row-label">{op.label}</span>
            </div>
          ))}
        </div>
      )}

      {vista === "ficha-entrenador" && (
        <div className="menu-ingame-full menu-ingame-full--trainer-card">
          <div className="menu-ingame-trainer-head">
            <div className="menu-ingame-trainer-title">FICHA ENTR.</div>
            <div className="menu-ingame-trainer-idbox" aria-label="Número de identificación">
              <span className="menu-ingame-trainer-id-lab">N.º ID.</span>
              <span className="menu-ingame-trainer-id-val">/ {idFicha}</span>
            </div>
          </div>
          <div className="menu-ingame-trainer-body">
            <div className="menu-ingame-trainer-datos">
              <div className="menu-ingame-trainer-line menu-ingame-trainer-line--nombre">
                <span className="menu-ingame-trainer-k">NOMBRE</span>
                <span className="menu-ingame-trainer-slash">/</span>
                <span className="menu-ingame-trainer-v">{nombreFicha}</span>
              </div>
              <div className="menu-ingame-trainer-line">
                <span className="menu-ingame-trainer-bullet" aria-hidden />
                <span className="menu-ingame-trainer-k">DINERO</span>
                <span className="menu-ingame-trainer-v">
                  {Number(money ?? 0).toLocaleString("es-ES")}
                  <span className="menu-ingame-pokedollar" title="Pokédollar">
                    <span className="menu-ingame-pokedollar-p">P</span>
                  </span>
                </span>
              </div>
              <div className="menu-ingame-trainer-line">
                <span className="menu-ingame-trainer-bullet" aria-hidden />
                <span className="menu-ingame-trainer-k">POKÉDEX</span>
                <span className="menu-ingame-trainer-v">{nPokedex}</span>
              </div>
              <div className="menu-ingame-trainer-line">
                <span className="menu-ingame-trainer-bullet" aria-hidden />
                <span className="menu-ingame-trainer-k">TIEMPO J.</span>
                <span className="menu-ingame-trainer-v">{tiempoFicha}</span>
              </div>
            </div>
            <div className="menu-ingame-trainer-portrait" aria-hidden>
              <div className="menu-ingame-trainer-portrait-deco" />
              <img
                className="menu-ingame-trainer-portrait-img"
                src={retratoEntrenadorFicha}
                alt=""
                width={36}
                height={44}
                draggable={false}
              />
            </div>
          </div>
          <div className="menu-ingame-trainer-badges-bar">MEDALLAS</div>
          <div className="menu-ingame-trainer-badges-slots">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={`badge-slot-${i}`}
                className={`menu-ingame-trainer-badge-slot${i < Math.min(nMedallas, 8) ? " menu-ingame-trainer-badge-slot--on" : ""}`}
              >
                <span className="menu-ingame-trainer-badge-num">{i + 1}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vista === "mochila" && (
        <div className="menu-ingame-full menu-ingame-full--bag">
          <div className="menu-ingame-full-title">MOCHILA</div>
          <div className="menu-ingame-scroll menu-ingame-scroll--bag">
            {lineasMochila.map((l, i) => (
              <div
                key={l.clave}
                className={`menu-ingame-mochila-row${i === selMochilaSafe ? " menu-ingame-mochila-row--active" : ""}`}
              >
                <span className="menu-ingame-cursor">{i === selMochilaSafe ? "▶" : ""}</span>
                <span className="menu-ingame-mochila-icon-wrap" aria-hidden>
                  <img
                    className="menu-ingame-mochila-icon"
                    src={urlIconoItemPorNombre(l.nombre) || iconPocion}
                    alt=""
                    width={14}
                    height={14}
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = iconPocion;
                    }}
                  />
                </span>
                <span className="menu-ingame-mochila-nombre">{l.nombre}</span>
                <span className="menu-ingame-mochila-cant">×{l.cantidad}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vista === "mochila-accion" && (
        <div className="menu-ingame-full menu-ingame-full--bag">
          <div className="menu-ingame-full-title">MOCHILA</div>
          <div className="menu-ingame-scroll menu-ingame-scroll--bag">
            {lineasMochila.map((l, i) => (
              <div
                key={l.clave}
                className={`menu-ingame-mochila-row${i === selMochilaSafe ? " menu-ingame-mochila-row--active" : ""}`}
              >
                <span className="menu-ingame-cursor">{i === selMochilaSafe ? "▶" : ""}</span>
                <span className="menu-ingame-mochila-icon-wrap" aria-hidden>
                  <img
                    className="menu-ingame-mochila-icon"
                    src={urlIconoItemPorNombre(l.nombre) || iconPocion}
                    alt=""
                    width={14}
                    height={14}
                    draggable={false}
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = iconPocion;
                    }}
                  />
                </span>
                <span className="menu-ingame-mochila-nombre">{l.nombre}</span>
                <span className="menu-ingame-mochila-cant">×{l.cantidad}</span>
              </div>
            ))}
          </div>
          <div className="menu-ingame-accion-popup">
            <div className="menu-ingame-accion-nombre">{itemAccionActual?.nombre ?? "?"}</div>
            {accionesMochila.map((ac, i) => (
              <div
                key={ac}
                className={`menu-ingame-accion-fila${i === selAccionMochila ? " menu-ingame-accion-fila--active" : ""}`}
              >
                <span className="menu-ingame-cursor">{i === selAccionMochila ? "▶" : ""}</span>
                {ac}
              </div>
            ))}
          </div>
        </div>
      )}

      {vista === "mochila-tirar-cantidad" && (() => {
        const nombre = itemAccionActual?.nombre ?? "ítem";
        const maxCantidad = itemAccionActual?.cantidad ?? 1;
        return (
          <div className="menu-ingame-full menu-ingame-full--bag">
            <div className="menu-ingame-full-title">TIRAR</div>
            <div className="menu-ingame-tirar-item-info">
              <span className="menu-ingame-mochila-icon-wrap" aria-hidden>
                <img
                  className="menu-ingame-mochila-icon"
                  src={urlIconoItemPorNombre(nombre) || iconPocion}
                  alt=""
                  width={14}
                  height={14}
                  draggable={false}
                  onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = iconPocion; }}
                />
              </span>
              <span className="menu-ingame-mochila-nombre">{nombre}</span>
              <span className="menu-ingame-tirar-stock">Tienes: ×{maxCantidad}</span>
            </div>
            <div className="menu-ingame-tirar-selector">
              <button
                className="menu-ingame-tirar-btn"
                aria-label="Aumentar cantidad"
                tabIndex={-1}
              >▲</button>
              <span className="menu-ingame-tirar-cant">×{cantidadTirar}</span>
              <button
                className="menu-ingame-tirar-btn"
                aria-label="Reducir cantidad"
                tabIndex={-1}
              >▼</button>
            </div>
            <div className="menu-ingame-tirar-aviso">
              ¿Tirar {cantidadTirar}× {nombre}?
            </div>
          </div>
        );
      })()}

      {vista === "mochila-pokemon" && (
        <div className="menu-ingame-full menu-ingame-full--bag">
          <div className="menu-ingame-full-title">¿A quién?</div>
          <div className="menu-ingame-mochila-item-sel">
            <span className="menu-ingame-mochila-icon-wrap" aria-hidden>
              <img
                className="menu-ingame-mochila-icon"
                src={urlIconoItemPorNombre(itemAccionActual?.nombre) || iconPocion}
                alt=""
                width={14}
                height={14}
                draggable={false}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = iconPocion;
                }}
              />
            </span>
            <span className="menu-ingame-mochila-nombre">{itemAccionActual?.nombre ?? "?"}</span>
          </div>
          <div className="menu-ingame-team-list">
            {equipo.map((p, i) => {
              const nombreEspecie = p.nombre || "???";
              const apodo = p.nombreApodo && p.nombreApodo !== nombreEspecie ? p.nombreApodo : null;
              const etiqueta = apodo || nombreEspecie;
              const hpA = p.hpActual ?? p.hpMax ?? 20;
              const hpM = p.hpMax ?? 20;
              return (
                <div
                  key={`mp-${i}`}
                  className={`menu-ingame-team-slot${i === selPokemonMochila ? " menu-ingame-team-slot--active" : ""}`}
                >
                  <div className="menu-ingame-team-slot-head">
                    <span className="menu-ingame-cursor">{i === selPokemonMochila ? "▶" : ""}</span>
                    <span className="menu-ingame-team-slot-num">{i + 1}</span>
                    <div className="menu-ingame-team-slot-names">
                      <div className="menu-ingame-team-etiqueta">{etiqueta}</div>
                    </div>
                    <span className="menu-ingame-team-nv">
                      {hpA}/{hpM} PS
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {vista === "equipo" && (
        <div className="menu-ingame-full menu-ingame-full--team">
          <div className="menu-ingame-full-title">POKÉMON</div>
          <div className="menu-ingame-team-list">
            {equipo.map((p, i) => {
              const nombreEspecie = p.nombre || "???";
              const apodo = p.nombreApodo && p.nombreApodo !== nombreEspecie ? p.nombreApodo : null;
              const etiqueta = apodo || nombreEspecie;
              const nv = p.nivel || 5;
              const hpA = p.hpActual ?? p.hpMax ?? 20;
              const hpM = p.hpMax ?? 20;
              const ratio = hpRatio(hpA, hpM);
              const miniStarter =
                esMismoPokemonQueStarter(p, starter) &&
                urlMiniMenuInicialPorPokedexId(p.id ?? starter?.id ?? starter?.pokedexId);
              return (
                <div
                  key={`slot-${i}`}
                  className={`menu-ingame-team-slot${i === selEquipo ? " menu-ingame-team-slot--active" : ""}`}
                >
                  <div className="menu-ingame-team-slot-head">
                    <span className="menu-ingame-cursor">{i === selEquipo ? "▶" : ""}</span>
                    {miniStarter ? (
                      <img
                        className="menu-ingame-team-slot-mini"
                        src={miniStarter}
                        alt=""
                        width={14}
                        height={14}
                        draggable={false}
                      />
                    ) : i === 0 ? (
                      <img
                        className="menu-ingame-team-slot-icon"
                        src={iconSlotParty}
                        alt=""
                        width={14}
                        height={14}
                        draggable={false}
                      />
                    ) : (
                      <span className="menu-ingame-team-slot-num">{i + 1}</span>
                    )}
                    <div className="menu-ingame-team-slot-names">
                      <div className="menu-ingame-team-etiqueta">{etiqueta}</div>
                      {apodo && (
                        <div className="menu-ingame-team-sub">{nombreEspecie}</div>
                      )}
                    </div>
                    <span className="menu-ingame-team-nv">Nv.{nv}</span>
                  </div>
                  <div className="menu-ingame-hp-row">
                    <div className="menu-ingame-hpbar">
                      <div
                        className={`menu-ingame-hpbar-fill ${colorHp(hpA, hpM)}`}
                        style={{ width: `${Math.round(ratio * 100)}%` }}
                      />
                    </div>
                    <span className={`menu-ingame-hpnums ${colorHp(hpA, hpM)}`}>
                      {hpA}/{hpM}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {mostrarFichaPokemon && (
        <div className="menu-ingame-full menu-ingame-full--poke-detalle">
          <div className="menu-ingame-full-title">POKÉMON</div>
          <div className="menu-ingame-poke-panel-stack">
            <div
              className={`menu-ingame-poke-panels-track${fichaMuestraMovimientos ? " menu-ingame-poke-panels-track--moves" : ""}`}
            >
              <div className="menu-ingame-poke-panel menu-ingame-poke-panel--stats">
                <div className="menu-ingame-poke-detalle-cuerpo">
                  <div className="menu-ingame-poke-detalle-sprite-wrap">
                    {imgPokemonDetalle ? (
                      <img
                        className="menu-ingame-poke-detalle-sprite"
                        src={imgPokemonDetalle}
                        alt=""
                        draggable={false}
                      />
                    ) : (
                      <div className="menu-ingame-poke-detalle-sprite-vacio" aria-hidden>
                        ?
                      </div>
                    )}
                  </div>
                  <div className="menu-ingame-poke-detalle-texto">
                    <div className="menu-ingame-poke-detalle-nombre">
                      {(pSel.nombreApodo && pSel.nombreApodo !== pSel.nombre
                        ? `${pSel.nombreApodo} (${pSel.nombre})`
                        : pSel.nombre) || "???"}
                    </div>
                    <div className="menu-ingame-poke-detalle-sub">
                      Nv.{pSel.nivel || 5} · HP {pSel.hpActual ?? pSel.hpMax ?? 20}/{pSel.hpMax ?? 20}
                    </div>
                    <div className="menu-ingame-poke-detalle-tipos">Tipo {tiposDetalle}</div>
                    <div className="menu-ingame-poke-detalle-seccion">En combate</div>
                    <div className="menu-ingame-poke-detalle-stats">
                      <span>ATK {statCombateMenu(pSel, "ataque") ?? "—"}</span>
                      <span>DEF {statCombateMenu(pSel, "defensa") ?? "—"}</span>
                      <span>AT.ESP. {statCombateMenu(pSel, "ataqueEspecial") ?? "—"}</span>
                      <span>DEF.ESP. {statCombateMenu(pSel, "defensaEspecial") ?? "—"}</span>
                      <span>VEL {statCombateMenu(pSel, "velocidad") ?? "—"}</span>
                    </div>
                    <div className="menu-ingame-poke-detalle-seccion">
                      Stats base (Pokédex)
                      {detalleApiUi.status === "loading" ? " …" : ""}
                    </div>
                    {detalleApiUi.status === "ok" && detalleApiUi.data?.statsBase ? (
                      <div className="menu-ingame-poke-detalle-stats menu-ingame-poke-detalle-stats--base">
                        <span>PS {detalleApiUi.data.statsBase.ps ?? "—"}</span>
                        <span>ATK {detalleApiUi.data.statsBase.ataque ?? "—"}</span>
                        <span>DEF {detalleApiUi.data.statsBase.defensa ?? "—"}</span>
                        <span>AT.ESP. {detalleApiUi.data.statsBase.ataqueEsp ?? "—"}</span>
                        <span>DEF.ESP. {detalleApiUi.data.statsBase.defensaEsp ?? "—"}</span>
                        <span>VEL {detalleApiUi.data.statsBase.velocidad ?? "—"}</span>
                      </div>
                    ) : detalleApiUi.status === "err" ? (
                      <div className="menu-ingame-poke-detalle-aviso">No se pudo cargar PokéAPI.</div>
                    ) : detalleApiUi.status === "loading" ? (
                      <div className="menu-ingame-poke-detalle-aviso">Cargando Pokédex…</div>
                    ) : null}
                  </div>
                </div>
              </div>
              <div className="menu-ingame-poke-panel menu-ingame-poke-panel--moves">
                <div className="menu-ingame-poke-moves">
                  <div className="menu-ingame-poke-moves-deco" aria-hidden />
                  <div className="menu-ingame-poke-moves-head">
                    <div className="menu-ingame-poke-moves-head-row">
                      <span className="menu-ingame-poke-moves-ball" title="Poké Ball" aria-hidden />
                      <span className="menu-ingame-poke-moves-mon-name">{etiquetaNombrePokemonFicha}</span>
                      <span className="menu-ingame-poke-moves-mon-nv">Nv.{pSel.nivel || 5}</span>
                    </div>
                  </div>
                  <div className="menu-ingame-poke-moves-main">
                    <div className="menu-ingame-poke-moves-list">
                      {slotsMovimientosUi.map((m, idx) => {
                        const tipoCls = m?.tipoCodigo
                          ? ` menu-ingame-poke-move-tipo--${String(m.tipoCodigo).toLowerCase()}`
                          : "";
                        const ppMax = m?.pp != null ? m.pp : null;
                        const ppTxt = ppMax != null ? `${ppMax}/${ppMax}` : "—";
                        return (
                          <div key={`mv-${idx}`} className="menu-ingame-poke-move-row">
                            <span className="menu-ingame-poke-move-name">
                              {m?.nombre ?? "—"}
                            </span>
                            <span className={`menu-ingame-poke-move-tipo${tipoCls}`}>
                              {m?.tipoEs ?? "—"}
                            </span>
                            <span className="menu-ingame-poke-move-pp">{ppTxt}</span>
                          </div>
                        );
                      })}
                    </div>
                    <div className="menu-ingame-poke-moves-sprite">
                      {imgPokemonDetalle ? (
                        <img
                          className="menu-ingame-poke-moves-sprite-img"
                          src={imgPokemonDetalle}
                          alt=""
                          draggable={false}
                        />
                      ) : (
                        <div className="menu-ingame-poke-moves-sprite-vacio" aria-hidden>
                          ?
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="menu-ingame-poke-moves-foot">
                    <span className="menu-ingame-poke-moves-foot-k">X</span> volver a la ficha
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {vista === "opciones" && (
        <div className="menu-ingame-full menu-ingame-full--opts">
          <div className="menu-ingame-full-title">{tOpc.titulo}</div>
          <div className="menu-ingame-opciones-list">
            <div
              className={`menu-ingame-opcion-row${selOpciones === 0 ? " menu-ingame-opcion-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{selOpciones === 0 ? "▶" : ""}</span>
              <span className="menu-ingame-opcion-label">{tOpc.musica}</span>
              <span className="menu-ingame-opcion-valor">{prefs.bgmPercent}%</span>
            </div>
            <div
              className={`menu-ingame-opcion-row${selOpciones === 1 ? " menu-ingame-opcion-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{selOpciones === 1 ? "▶" : ""}</span>
              <span className="menu-ingame-opcion-label">{tOpc.sonidos}</span>
              <span className="menu-ingame-opcion-valor">
                {prefs.sfxOn ? tOpc.sonidoSi : tOpc.sonidoNo}
              </span>
            </div>
            <div
              className={`menu-ingame-opcion-row${selOpciones === 2 ? " menu-ingame-opcion-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{selOpciones === 2 ? "▶" : ""}</span>
              <span className="menu-ingame-opcion-label">{tOpc.texto}</span>
              <span className="menu-ingame-opcion-valor">
                {prefs.textoRapido ? tOpc.textoVelRapido : tOpc.textoVelNormal}
              </span>
            </div>
            <div
              className={`menu-ingame-opcion-row${selOpciones === 3 ? " menu-ingame-opcion-row--active" : ""}`}
            >
              <span className="menu-ingame-cursor">{selOpciones === 3 ? "▶" : ""}</span>
              <span className="menu-ingame-opcion-label">{tOpc.idioma}</span>
              <span className="menu-ingame-opcion-valor">{prefs.locale === "en" ? "EN" : "ES"}</span>
            </div>
          </div>
          <p className="menu-ingame-opciones-nota">{tOpc.notaFilaOpciones}</p>
        </div>
      )}

      {guardando && (
        <div className="dialogo-retro-caja dialogo-retro-caja--flotante dialogo-retro-caja--menuOverlay menu-ingame-saving">
          Guardando…
        </div>
      )}

      {dialogo && !guardando && (
        <div className="dialogo-retro-caja dialogo-retro-caja--flotante dialogo-retro-caja--menuOverlay">
          {dialogo}
        </div>
      )}

      <div className="menu-ingame-hint">{hint}</div>
    </div>
  );
};

export default MenuIngameReact;
