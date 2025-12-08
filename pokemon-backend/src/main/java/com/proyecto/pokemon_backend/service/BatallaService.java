package com.proyecto.pokemon_backend.service;

import com.proyecto.pokemon_backend.dto.CapturaRequest;
import com.proyecto.pokemon_backend.dto.TurnoRequest;
import com.proyecto.pokemon_backend.dto.TurnoResponse; // Para devolver el resultado completo
import com.proyecto.pokemon_backend.model.PokemonUsuario;
import com.proyecto.pokemon_backend.repository.InventarioUsuarioRepository;
import com.proyecto.pokemon_backend.model.Usuario;
import com.proyecto.pokemon_backend.model.enums.Estado;
import com.proyecto.pokemon_backend.model.Ataques;
import com.proyecto.pokemon_backend.model.InventarioUsuario;
import com.proyecto.pokemon_backend.model.Item;
import com.proyecto.pokemon_backend.model.PokedexMaestra; 
import com.proyecto.pokemon_backend.repository.PokemonUsuarioRepository;
import com.proyecto.pokemon_backend.repository.UserRepository;
import com.proyecto.pokemon_backend.repository.AtaquesRepository;
import com.proyecto.pokemon_backend.repository.InventarioUsuarioRepository;
import com.proyecto.pokemon_backend.repository.ItemRepository;
import com.proyecto.pokemon_backend.repository.PokedexMasterRepository;
import com.proyecto.pokemon_backend.service.logica.CalculoService; // Módulo Matemático
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional; 
import java.util.Optional;

@Service
public class BatallaService {

    private final PokemonUsuarioRepository pokemonUsuarioRepository;
    private final PokedexMasterRepository pokedexMasterRepository;
    private final CalculoService calculoService;
    private final TipoService tipoService;
    private final ItemRepository itemRepository;
    private final InventarioUsuarioRepository inventarioRepository;
    private final UserRepository userRepository;


    public BatallaService(PokemonUsuarioRepository pokemonUsuarioRepository,
                          PokedexMasterRepository pokedexMasterRepository,
                          AtaquesRepository ataquesRepository,
                          CalculoService calculoService,
                          TipoService tipoService,
                          ItemRepository itemRepository,
                          InventarioUsuarioRepository inventarioRepository,
                          UserRepository userRepository) {
        this.pokemonUsuarioRepository = pokemonUsuarioRepository;
        this.pokedexMasterRepository = pokedexMasterRepository;
        this.calculoService = calculoService;
        this.tipoService = tipoService;
        this.itemRepository = itemRepository;
        this.inventarioRepository = inventarioRepository;
        this.userRepository = userRepository;
    }

    /**
     * Ejecuta el turno de ataque, calculando el daño, el multiplicador final (x4,x2,x1,0.5,x0.25)
     * y actualizando el HP del Pokémon defensor en la Base de Datos.
     * @param request DTO que contiene todos los parámetros de entrada del Frontend.
     * @return DTO TurnoResponse con los resultados para el cliente.
     */

     @Transactional // Asegura que HP se actualice o se revierta en caso de fallo.
     public TurnoResponse ejecutarTurno (TurnoRequest request){

        // 1. Cargar entidades (Estado actual de la base de datos)
        PokemonUsuario atacante = pokemonUsuarioRepository.findById(request.getAtacanteId())
            .orElseThrow(() -> new RuntimeException("Pokémon atacante no encontrado, con ID: " + request.getAtacanteId()));
     
        PokemonUsuario defensor = pokemonUsuarioRepository.findById(request.getDefensorId())
                .orElseThrow(() -> new RuntimeException("Defensor no encontrado con ID: " + request.getDefensorId()));

        PokedexMaestra defensorMaestro = pokedexMasterRepository.findById(defensor.getPokedexId())
                .orElseThrow(() -> new RuntimeException("Pokedex Maestra del defensor no encontrada."));
        
        // -- Fase I Verificación Estado PRE-TURNO --
        // Comprobamos que el atacante pueda moverse( Parálisis, sueño, confuso o congelado)
        
        String mensajeBloqueo = verificarEstadoPreTurno(atacante);
        if (mensajeBloqueo != null){
            //Si no puede atacar, aplicamos daño residual, guardarmos y terminamos el turno
            String msgResidual = aplicarEfectosPostTurno(atacante);
            pokemonUsuarioRepository.save(atacante);

            return TurnoResponse.builder()
                .dañoInfligido(0)
                .hpRestanteDefensor(defensor.getHpActual())
                .multiplicadorFinal(1.0)
                .golpeCritico(false)
                .mensajeEfectividad("")
                .defensorDerrotado(false)
                .mensajeGeneral(mensajeBloqueo + "" + msgResidual)
                .build();
        }

        // Fase II Cálculo de Daño 
        
        // A. Obtener el Multiplicador (Lógica de la Matriz de Tipos)
        double multEfectividad = tipoService.calcularEfectividad(
            request.getTipoAtaque(), 
            defensorMaestro.getTipo_1(), 
            defensorMaestro.getTipo_2()
        );

        // B. Lógica de QUEMADURA (-50% Ataque Físico)
        int ataqueFinal = request.getAtaqueStat();
        // Si el ataque es físico y el atacante está quemado
        if (atacante.getEstado() == Estado.QUEMADO && !request.getEsEspecial()){
            ataqueFinal = (int) (ataqueFinal * 0.5);
        }
        
        // C. Calcular Daño (Fórmula Matemática Certificada)
        int danoInfligido = calculoService.calcularDaño(
            request.getNivelAtacante(), 
            ataqueFinal, 
            request.getDefensaStat(), 
            request.getPotenciaMovimiento(), 
            multEfectividad, 
            request.getEsMismoTipo(),
            null,
            false
        );

        // D. Aplicar y Persistir el Daño
        int hpAntes = defensor.getHpActual();
        int nuevoHp = Math.max(0, hpAntes - danoInfligido);
        defensor.setHpActual(nuevoHp);
        
        pokemonUsuarioRepository.save(defensor); // Persistencia de datos en MySQL

        // E. Generar Respuesta DTO para el Frontend
        boolean golpeCritico = calculoService.fueGolpeCritico();
        boolean defensorDerrotado = (nuevoHp == 0);
        String mensajeEfectividad = tipoService.obtenerMensajeEfectividad(multEfectividad);

        // -- Fase III Daño Residual y Efectos Post-Turno --
        String msgResidualDefensor = aplicarEfectosPostTurno(defensor);
        String msgResidualAtacante = aplicarEfectosPostTurno(atacante);

        pokemonUsuarioRepository.save(defensor);
        pokemonUsuarioRepository.save(atacante);

        // Respuesta
        
        return TurnoResponse.builder()
            .dañoInfligido(danoInfligido)
            .hpRestanteDefensor(nuevoHp)
            .multiplicadorFinal(multEfectividad)
            .golpeCritico(calculoService.fueGolpeCritico())
            .defensorDerrotado(nuevoHp == 0)
            .mensajeGeneral(String.format("¡%s usó %s! %s %s %s", 
                    "El Pokémon", 
                    request.getTipoAtaque(), 
                    mensajeEfectividad, 
                    msgResidualAtacante, 
                    msgResidualDefensor).trim())
            .build();
    }

    // --------------------------------------------------------------------------
    // MÉTODOS PRIVADOS DE LÓGICA DE ESTADOS
    // --------------------------------------------------------------------------

    private String verificarEstadoPreTurno(PokemonUsuario pkm){
        // 1.Congelado (10% probabilidad de descongelarse)
        if (pkm.getEstado() == Estado.CONGELADO){
            if(Math.random()< 0.1 ) {
                pkm.setEstado(Estado.SALUDABLE);
                return "¡El Pokémon se ha descongelado!";
            }
            return "¡El Pokémon está congelado!";
        }

        // 2. Dormido
        if (pkm.getEstado() == Estado.DORMIDO) {
            if (pkm.getTurnosSueno() > 0) {
                pkm.setTurnosSueno(pkm.getTurnosSueno() - 1);
                return "¡Está durmiendo!";
            } else {
                pkm.setEstado(Estado.SALUDABLE);
                return "¡Se despertó!";
            }
        }
        
        // 3. Paralizado (25% de no poder atacar)
        if (pkm.getEstado() == Estado.PARALIZADO) {
            if (Math.random() < 0.25) {
                return "¡Está paralizado y no puede moverse!";
            }
        }

        // 4. Confundido (50% de atacarse a sí mismo)
        if (pkm.getTurnosConfusion() > 0) {
            pkm.setTurnosConfusion(pkm.getTurnosConfusion() - 1);
            if (Math.random() < 0.5) {
            // Daño a sí mismo: Potencia 40, sin tipo.
            // Necesitamos pasar los argumentos correctos al calculoService
            // Para el autodaño no hay STAB, ni Tipo (1.0), y usamos los stats propios
                int autoDano = calculoService.calcularDaño(
                    pkm.getNivel(), 
                    pkm.getAtaqueStat(), 
                    pkm.getDefensaStat(), 
                    40, // Potencia confusión
                    1.0, // Multiplicador tipo neutro
                    false, // No STAB
                    null, // No estado específico
                    false // Sin golpe crítico
            );
                pkm.setHpActual(Math.max(0, pkm.getHpActual() - autoDano));
                return "¡Está tan confuso que se hirió a sí mismo!";
            }
        }
        return null; // Puede atacar normalmente
    }
    
    private String aplicarEfectosPostTurno(PokemonUsuario pkm){
        StringBuilder mensaje = new StringBuilder();

        int dano = 0;
        String msg = "";
        int hpMax = pkm.getHpMax();

        if (pkm.getEstado() == Estado.QUEMADO) {
            dano = Math.max(1, hpMax / 8);
            msg = "La quemadura resta PS.";
        } 
        else if (pkm.getEstado() == Estado.ENVENENADO) {
            dano = Math.max(1, hpMax / 8);
            msg = "El veneno resta PS.";
        } 
        else if (pkm.getEstado() == Estado.GRAVE_ENVENENADO) {
            pkm.setContadorToxico(pkm.getContadorToxico() + 1);
            dano = Math.max(1, hpMax * pkm.getContadorToxico() / 16);
            msg = "El veneno empeora.";
        }
        
        // Drenadoras
        if (pkm.getTieneDrenadoras()) {
             dano += Math.max(1, hpMax / 8);
             msg += "Las drenadoras han curado un poco de vida.";
        }

        if (dano > 0) {
            pkm.setHpActual(Math.max(0, pkm.getHpActual() - dano));
            
        }
        return msg;
    
    }

    // Método para la captura de Pokémon

    @Transactional
    public String intentarCaptura(String username, CapturaRequest request){

        // I. Carga de entidad
        Usuario usuario =  userRepository.findByUsername(username)
            .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        PokemonUsuario salvaje = pokemonUsuarioRepository.findById(request.getDefensorId())
            .orElseThrow(() -> new RuntimeException("Pokémon salvaje no encontrado"));

        PokedexMaestra datosMaestros = pokedexMasterRepository.findById(salvaje.getPokedexId())
            .orElseThrow(() -> new RuntimeException("Datos de la Pokédex no encontrados"));

        // II. Verificar el inventario ("Tiene el usuario Pokeball?")
        Item ball = itemRepository.findByNombre(request.getNombreBall())
            .orElseThrow(()-> new RuntimeException("Esa pokeball no existe"));

        InventarioUsuario inventario = inventarioRepository.findByUsuarioAndItem(usuario, ball)
            .orElseThrow(()-> new RuntimeException("No tienes " + request.getNombreBall()));

        if(inventario.getCantidad() <= 0){
            throw new RuntimeException("¡Te has quedado sin " + request.getNombreBall() + "!");
        }

        // III. Gastar la Pokéballa
        inventario.setCantidad(inventario.getCantidad() - 1);
        inventarioRepository.save(inventario);

        // IV. Determinar la bonificación de la Pokéball
        double bonoBall = 1;
        if(ball.getNombre().equalsIgnoreCase("Super Ball")) bonoBall = 1.5;
        if(ball.getNombre().equalsIgnoreCase("Ultra Ball")) bonoBall = 2.0;
        if(ball.getNombre().equalsIgnoreCase("Master Ball")) bonoBall = 255.0;

        // V. Calcular captura
        boolean atrapado = calculoService.calcularCaptura(
            salvaje.getHpMax(),
            salvaje.getHpActual(),
            datosMaestros.getRatioCaptura(),
            bonoBall,
            salvaje.getEstado()    
        );
        if(atrapado){
            // VI. Convertir el Pokémon en propiedad del usuario
            salvaje.setUsuarioId(usuario.getIdUsuario()); // Así es del usuario
            salvaje.setPosicionEquipo(2); // *** HAY QUE CALCULAR EL HUECO LIBRE ***
            pokemonUsuarioRepository.save(salvaje);
            return "¡Ya está! " + "¡ " + datosMaestros.getNombre() + " ha sido atrapado!";
        }else{
            return "!Oh no! !El Pokémon salvaje se ha escapado¡";
        }

    }

}


    

