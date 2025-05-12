# PITCH DREAMERS

#### Curso Escolar 2024-2025
#### Autor: [Ismael Sevidanes Del Moral](https://github.com/ismaelsevidanes/)
#### Tutor: [Antonio Gabriel González Casado](https://github.com/prof-antonio-gabriel)
#### Tutor del Proyecto: [Mónica María Marcos Gutiérrez]
#### Fecha de Inicio: 01-03-2025
#### Fecha de Finalización: xx-x-2025

## Breve descripción del proyecto

Este proyecto trata de una aplicación web sobre el funcionamiento de poder reservar y alquilar campos de fútbol de la localidad de Sevilla principalmente, ya sea campos de fútbol 7 como fútbol 11, en campos memorables y de césped artificial como natural, de equipos de pueblos o incluso campos de categorías mayores, donde sus prestaciones son mayores.

## Objetivo de la aplicación
- **¿Qué va a hacer la aplicación?**  
    Pitch Dreamers es una aplicación web que permite reservar y alquilar campos de fútbol de forma sencilla y online.
    
- **¿Cuál es su atractivo principal?**  
    Las principales características atractivas son: operar de forma online, la facilidad de uso, intuitivo para todos los usuarios y clara navegación. Poder conocer a personas y jugar con ellos.
 
- **¿Qué problema concreto va a resolver?**  
    El problema que resuelve la aplicación es la dificultad de reservar campos de fútbol de diversas ciudades o pueblos, teniendo que tener contacto con algún gerente de allí o reservar de forma presencial a cierta hora.
      
- **¿Qué necesidad va a cubrir?**  
    Las necesidades que cubre son poder usar la aplicación de forma sencilla y de forma online para poder jugar al fútbol con tus amigos o con personas que también reserven en el mismo campo y hora que tu reserva.

---

## Objetivo del Backend
El objetivo del backend es proporcionar una API robusta, segura y eficiente para gestionar la lógica de negocio, autenticación, reservas, pagos y administración de usuarios y campos de fútbol. El backend se encarga de la persistencia de datos, la validación, la seguridad y la integración con la base de datos MySQL, sirviendo como núcleo de la aplicación y punto de integración con el frontend.

---

# Pitch Dreamers (Backend)

Este proyecto corresponde al backend de Pitch Dreamers, desarrollado con TypeScript, Express y MySQL. Aquí se detallan los pasos de instalación, estructura y funcionalidades implementadas.

## Requisitos
- Node.js (versión más reciente recomendada)
- MySQL (para la base de datos)

## Instalación
1. Clona este repositorio y navega a la carpeta backend:
   ```bash
   git clone https://github.com/ismaelsevidanes/backend.git
   cd backend
   npm install
   ```
2. Configura la base de datos MySQL en el archivo `config/database.ts`.
3. Ejecuta el script para inicializar la base de datos y crear las tablas:
   ```bash
   npx ts-node src/initializeDatabase.ts
   ```
4. (Opcional) Ejecuta el script para insertar datos iniciales:
   ```bash
   npx ts-node src/seedDatabase.ts
   ```
5. Inicia el servidor:
   ```bash
   npm run dev
   ```

## Despliegue
1. Compila el proyecto:
   ```bash
   npm run build
   ```
2. Inicia el servidor en producción:
   ```bash
   npm start
   ```
3. Sirve los archivos estáticos generados en la carpeta `dist` con un servidor como `serve` o `nginx`.

---

## Documentación de la API

El backend incluye documentación automática generada con Swagger. Para acceder a ella:
1. Inicia el servidor del backend.
2. Abre un navegador y navega a:
   ```
   http://localhost:3000/v3/api-docs
   ```

## Estructura del Proyecto
- **`shared/models`**: Define los modelos de datos en TypeScript.
- **`src`**: Scripts principales como la inicialización de la base de datos y la inserción de datos iniciales.
- **`config`**: Configuración de la base de datos y otras configuraciones globales.
- **`modules`**: Rutas y lógica de negocio para cada entidad (auth, fields, payments, reservations, users).

## Funcionalidades Implementadas
1. **Estructura inicial:**
   - Configuración de Express.
   - Rutas básicas para `fields`,`users`, `reservations` y `payments`.
2. **Base de datos:**
   - Script para inicializar la base de datos y crear las tablas.
   - Script para insertar datos iniciales en las tablas.
3. **Autenticación:**
   - Middleware para proteger rutas específicas (`fields`,`users`, `reservations`, `payments,`).
   - Ruta pública de obtener todos los `fields`.
4. **Paginación:**
   - Implementada en todas las rutas para manejar grandes volúmenes de datos (50 elementos por página).
5. **Centralización de parámetros:**
   - Uso de constantes globales para la URL base, prefijo de la API y tamaño de página predeterminado.
6. **Documentación automática:**
   - Swagger configurado para documentar todas las rutas de la API.

---

## Autor y Créditos
- Autor: [Ismael Sevidanes Del Moral](https://github.com/ismaelsevidanes/)
- Tutor: [Antonio Gabriel González Casado](https://github.com/prof-antonio-gabriel)