# 🎮🕹️ Pokémon Bytes - Proyecto DAW Curso 2024/2026![poka0012](https://github.com/user-attachments/assets/a112bfd7-8c0b-49c1-b2af-1d450fa7316a)![poka0012](https://github.com/user-attachments/assets/1b762be8-007d-4b03-a254-1519428a8862)



![Java](https://img.shields.io/badge/Java-21-orange) ![Spring Boot](https://img.shields.io/badge/Spring_Boot-3.x-green) ![MySQL](https://img.shields.io/badge/MySQL-8.0-blue) ![JWT](https://img.shields.io/badge/Security-JWT-red)

Este repositorio contiene el **Backend** para un videojuego de Pokémon en navegador (basado en las mecánicas de la **Generación II: Oro/Plata**). 

---

## 🚀 Fases Desarrollo:

El desarrollo *backend* se ha dividido en 5 Fases:

### 1. Seguridad y Autenticación (Fase I)
* **Arquitectura Stateless:** Autenticación basada en **JSON Web Tokens (JWT)**.
* **Cifrado Robusto:** Contraseñas almacenadas con *hashing* **BCrypt**.
* **Protección de Rutas:** Filtros de seguridad personalizados (`JwtAuthenticationFilter`) que protegen los *endpoints* de juego.
* **CORS Configurado:** Listo para integración con Frontend (React/Phaser).

### 2. Motor de Batalla (Fase II)
* **Fórmula de Daño Real:** Implementación matemática precisa de la fórmula de daño de Pokémon (Gen II/III), incluyendo variables de Nivel, Potencia, Stats, STAB y Aleatoriedad.
* **Matriz de Tipos:** Sistema de efectividad completo ($x4.0, x2.0, x1.0, x0.5, x0.25, x0.0$) cargado en Base de Datos.
* **Estados Alterados:** Gestión de estados persistentes (**Quemado, Congelado, Paralizado, Dormido, Envenenado**) y volátiles (**Confusión, Drenadoras**) con lógica de bloqueo de turnos y daño residual.

### 3. Economía y Transacciones (Fase III)
* **Tienda e Inventario:** Sistema de compra de objetos (Pociones, Poké Balls).
* **Transaccionalidad Atómica (`@Transactional`):** Garantía de integridad de datos; si una compra falla, el dinero no se descuenta.
* **Relaciones M:N:** Gestión eficiente de inventarios mediante tablas intermedias y claves compuestas.

### 4. Mecánica de Captura y Cierre del Ciclo (Fase IV)
* **Lógica de Captura (Generación II):** Implementación fiel de la fórmula matemática de Pokémon Oro/Plata.
* **Variables:** HP Máximo/Actual, Ratio de Captura (PokéAPI), tipo de Poké Ball y Estados Alterados (×2.0 probabilidad en Dormido/Congelado).
* **Integración Transaccional:** Gestión de inventario en tiempo real: verificación de stock y descuento atómico de ítems.
* **Integridad:** Reversión automática de la transacción ante fallos del servidor.
* **Persistencia Dinámica:** Conversión de instancias "salvajes" a propiedad del usuario autenticado mediante actualización de claves foráneas en MySQL. Esta fase conecta los módulos de Combate y Economía, cerrando el ciclo principal de juego .

### 5. Integración de datos (Fase V)
* **Consumo de API Externa:** Carga automática de datos (251 Pokémon y Movimientos) desde la **PokéAPI** al iniciar el servidor mediante `WebClient` .


## 📚 Documentación Técnica
El proyecto cuenta con una documentación exhaustiva dividida por fases de desarrollo. Puedes consultar los documentos originales y diagramas en la siguiente ruta:

👉 **[Acceder a la Carpeta de Documentación]([/Pokemon-backend/Documentación-fases])**

* **Fase I:** Seguridad y Configuración.
* **Fase II:** Lógica del Motor de Batalla.
* **Fase III:** Sistema Tienda.
* **Fase IV y V:** Captura y Carga de Datos.
---

## 🛠️ Stack Tecnológico

* **Lenguaje:** Java 21 (JDK 21)
* **Framework:** Spring Boot 3.5.x
* **Base de Datos:** MySQL 8.0
* **ORM:** Hibernate / Spring Data JPA
* **Seguridad:** Spring Security 6 + JJWT (0.12.5)
* **Herramientas:** Maven, Lombok, Postman

---

## 📂 Estructura del Proyecto

El código sigue una arquitectura en capas (MVC):

```text
com.proyecto.pokemon_backend
├── config/          # Configuración de Seguridad (CORS, CSRF, Beans)
├── component/       # Cargadores de Datos (DataSeeders, PokéAPI Loader)
├── controller/      # API REST (Endpoints HTTP)
├── dto/             # Objetos de Transferencia de Datos (Request/Response)
├── filter/          # Filtros HTTP (JWT Validation)
├── model/           # Entidades JPA (Tablas MySQL)
├── repository/      # Interfaces de Acceso a Datos (DAO)
├── security/        # Lógica de JWT (Generación y Validación)
└── service/         # Lógica de Negocio
    ├── api/         # Cliente HTTP para PokéAPI
    ├── juego/       # Lógica del Juego (Batalla, Tienda, Pokemon)
    └── logica/      # Motor Matemático (Cálculo de Daño)
````
---
### 📋 Modelo de Datos (ER)
![Esquema ER](https://github.com/JesusQP10/Poke-mon-Bytes/blob/main/pokemon-backend/Documentaci%C3%B3n-fases/FASES%20I-V.png)


---




⠈⣿⣷⣶⣤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠸⣿⣿⣿⣿⠈⠙⠲⢄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣤⣤⣶⣶⣶⡶⠀⠀⠀⠀⠀⠀
⠀⠀⠘⣿⣿⣿⡄⠀⠀⠀⠉⠲⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠔⠚⠉⠀⣿⣿⣿⣿⡟⠁⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠈⢿⣿⡧⠀⠀⠀⠀⠀⠀⠙⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡠⠞⠉⠀⠀⠀⠀⢠⣿⣿⣿⠟⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠙⣿⡖⠀⠀⠀⠀⠀⠀⠀⠙⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠴⠉⠀⠀⠀⠀⠀⠀⢠⣾⣿⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠉⠻⣄⠀⠀⠀⠀⠀⠀⠀⠀⠱⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠞⠁⠀⠀⠀⠀⠀⠀⠀⠀⢢⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⠳⣄⠀⠀⠀⠀⠀⠀⠀⠈⢧⠀⠀⢀⣠⠤⠴⠒⠒⠒⠒⠒⠒⠒⠲⠤⢤⣀⡀⢀⠜⠁⠀⠀⠀⠀⠀⠀⠀⠀⢀⡴⠋⠀⠀⠀⠀⢀⣀⣠⠤⠔⠒⠉⠉⢸
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠓⢤⡀⠀⠀⠀⠀⠀⠈⠳⠊⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠋⠀⠀⠀⠀⠀⠀⠀⣀⡤⠚⠉⠀⠀⣀⡤⠔⠚⠉⠁⠀⠀⠀⠀⠀⠀⠸
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠲⢄⣀⢀⠖⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢤⣀⣠⠴⠚⠁⢀⣠⠴⠒⠉⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣹⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣄⣤⠔⠚⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠃
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⠀⠀⣄⣀⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⡀⠀⠀⠀⢼⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀⢸⣾⣿⢉⠈⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣰⡏⠀⢹⣿⣦⡀⠀⢸⣟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⠀⠀⠸⣿⣿⣷⣾⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⣿⣶⣿⣿⡿⠀⠀⠐⡏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣠⠤⠖⠃⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡇⠀⠀⠀⠙⠛⠛⠋⠀⠀⠀⠀⠀⠀⠘⠓⠀⠀⠀⠀⠀⠈⠛⠛⠋⠁⠀⠀⠀⢻⡀⠀⠀⠀⣀⣀⣀⡤⠤⠒⠛⠉⠉⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⠿⣿⢶⣄⠀⠀⠀⠀⢀⡀⠀⠀⠀⣀⣀⠀⠀⠀⠀⡀⠀⠀⠀⠀⢀⣴⣶⣶⣾⡇⠀⠀⠘⢫⡁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢿⣯⢿⣝⣯⢿⣆⠀⠀⠀⠀⠙⠒⠒⠋⠉⠈⠙⠒⠒⠋⠀⠀⠀⠀⣰⣿⣻⢮⡷⢯⡗⠀⠀⠀⠀⠙⢦⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⡿⢮⣻⣽⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣯⢷⣯⣟⣿⠃⠀⠀⠀⠀⠀⠀⠱⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⣿⠟⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠯⢷⢾⡿⠉⠓⠦⣄⠀⠀⠀⠀⠀⠈⠳⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡏⠓⢦⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⠴⠻⡁⠀⣀⠴⠋⠁⠀⠀⠀⢀⣀⡤⠟⠃⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢠⠇⠀⠀⠈⠓⠦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⠴⠚⠁⠀⠀⣷⠋⠁⠀⠀⣀⣠⠴⠚⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⡞⠀⠀⠀⠀⠀⠀⠀⠁⠈⠲⠶⣦⡄⣀⠤⠤⠀⢐⠛⠁⠀⠀⠀⠀⠀⠀⠹⡄⢀⢦⣻⡁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠞⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢆⡀⠀⠀⠀⠀⠀⢠⡞⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⣮⣟⣽⣿⡦⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⠏⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⡇⠀⠀⠀⠀⢀⡎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⡚⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡴⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢹⠀⠀⠀⠀⣸⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⠀⠀⠱⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⡃⠀⠀⢠⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⡄⠀⠀⠀⡿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡿⠀⠀⠀⢹⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⣾⢺⠛⠢⣼⠁⠀⠀⠸⣇⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⠀⡇⠀⠀⠀⠀⠀⠀⠀⠀⠀⢺⠃⠀⠀⠀⠀⡇⢀⣠⣤⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⢿⢯⡳⡀⠈⠑⢆⠀⠀⠹⡄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⣀⣀⢸⠃⠀⠀⠀⠀⠀⠀⠀⠀⢠⠏⠀⠀⠀⢀⡴⠛⢉⣼⣽⡟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠈⠳⡽⠘⠓⢦⣀⠀⠀⠀⢳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⡇⠀⠀⣸⠂⠀⠀⠀⠀⠀⠀⠀⢠⠟⠀⠀⠀⠴⣋⡠⠔⣺⣻⠎⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢶⡀⠀⠈⠳⣄⠀⢀⠹⣄⠀⠀⠀⠀⠀⠀⠀⢰⡇⠀⠀⠹⡇⠀⠀⠀⠀⠀⠀⢠⡞⠄⠀⠀⣠⠞⠁⢀⣼⠟⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⢖⡂⡀⠈⠁⢿⠀⠙⢦⡀⠀⠀⠀⠀⠀⣼⣄⣦⣴⣥⡷⠀⠀⠀⠀⠀⣠⠋⠀⣄⠑⠘⠁⢀⣠⠿⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠶⣖⣢⡾⠾⠴⠚⢳⣦⣠⣤⡶⠶⠛⠀⠀⠀⠘⠲⡤⣄⣀⣀⡞⠳⢤⣶⡏⣀⣠⡷⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
