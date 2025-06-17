# PITCH DREAMERS

#### Curso Escolar 2024-2025
#### Autor: [Ismael Sevidanes Del Moral](https://github.com/ismaelsevidanes/)
#### Tutor: [Antonio Gabriel González Casado](https://github.com/prof-antonio-gabriel)
#### Tutor del Proyecto: Mónica María Marcos Gutiérrez
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

## Cambio de modo desarrollo y modo produccion(despliegue)
1. En el fichero backend/config/swagger.ts alternar el comentario entre estas lineas
   ```bash
   url: 'http://localhost:3000', // Cambiar esto si se usa otro puerto
   //url: 'https://pitchdreamers.duckdns.org', // URL de producción 
   ```
## Despliegue
1. 

---

# Guía de instalación desde cero

Esta guía explica cómo instalar y ejecutar Pitch Dreamers en un PC nuevo, sin dependencias previas.

## 1. Instalar Node.js
- Descargar e instalar la última versión LTS desde: [https://nodejs.org/](https://nodejs.org/)
- Verificar instalación:
  ```bash
  node -v
  npm -v
  ```

## 2. Instalar MySQL
- Descargar e instalar MySQL Community Server desde: [https://dev.mysql.com/downloads/mysql/](https://dev.mysql.com/downloads/mysql/)
- Durante la instalación, anotar el usuario y contraseña de root.
- Verificar instalación:
  ```bash
  mysql --version
  ```

## 3. Clonar el repositorio y preparar el backend
- Clonar el repositorio:
  ```bash
  git clone https://github.com/ismaelsevidanes/backend.git
  cd backend
  ```
- Instalar dependencias:
  ```bash
  npm install
  ```

## 4. Configurar la base de datos
- Editar `config/database.ts` si es necesario para poner el usuario y contraseña de tu MySQL local.
- Por defecto, usuario: `root`, contraseña: `root`, base de datos: `dreamer`.

## 5. Inicializar la base de datos y las tablas
- Ejecutar el script de inicialización:
  ```bash
  npx ts-node src/initializeDatabase.ts
  ```
- (Opcional) Insertar datos de ejemplo:
  ```bash
  npx ts-node src/seedDatabase.ts
  ```

## 6. Arrancar el backend
- Iniciar el servidor en modo desarrollo:
  ```bash
  npm run dev
  ```
- El backend estará disponible en: [http://localhost:3000](http://localhost:3000)

## 7. Documentación de la API
- Acceder a la documentación Swagger en: [http://localhost:3000/v3/api-docs](http://localhost:3000/v3/api-docs)

## 8. (Opcional) Instalar Docker para despliegue
- Descargar e instalar Docker Desktop desde: [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/)
- Verificar instalación:
  ```bash
  docker --version
  ```

## 9. (Opcional) Despliegue con Docker
- Asegúrate de tener Docker Desktop abierto y funcionando.
- En la raíz del proyecto, ejecuta:
  ```bash
  docker-compose up --build -d
  ```
- Esto levantará los servicios de backend, frontend y base de datos (si tienes el `docker-compose.yml` configurado).
- El backend y frontend estarán disponibles en los puertos configurados (por defecto 3000 y 5173).

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
- Tutor del Proyecto: Mónica María Marcos Gutiérrez