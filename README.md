# Pitch Dreamers

Este proyecto está dividido en dos partes principales: **frontend** y **backend**, el frontend mediante React y el backend con TypeScript. A continuación, se describen los pasos de instalación, la estructura del proyecto y las funcionalidades implementadas hasta ahora.

---

## Requisitos

### Backend
- Node.js (versión más reciente recomendada)
- MySQL (para la base de datos)

### Frontend
- Node.js (versión más reciente recomendada)

---

## Instalación

### Pasos generales
1. Clona este repositorio:
   ```bash
   git clone
   ```
2. Navega a la carpeta del proyecto:
   ```bash
   cd backend
   ```

### Backend
1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Configura la base de datos MySQL en el archivo `backend/config/database.ts`.
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

### Frontend
1. Instala las dependencias:
   ```bash
   cd frontend
   npm install
   ```
2. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

---

## Despliegue

### Backend
1. Compila el proyecto:
   ```bash
   npm run build
   ```
2. Inicia el servidor en producción:
   ```bash
   npm start
   ```

### Frontend
1. Compila el proyecto para producción:
   ```bash
   npm run build
   ```
2. Sirve los archivos estáticos generados en la carpeta `dist` con un servidor como `serve` o `nginx`.

---

## Documentación de la API

El backend incluye documentación automática generada con Swagger. Para acceder a ella:
1. Inicia el servidor del backend.
2. Abre un navegador y navega a:
   ```
   http://localhost:3000/api-docs
   ```

---

## Estructura del Proyecto

### Backend
- **`shared/models`**: Define los modelos de datos en TypeScript.
- **`src`**: Contiene los scripts principales como la inicialización de la base de datos y la inserción de datos iniciales.
- **`config`**: Configuración de la base de datos y otras configuraciones globales.
- **`modules`**: Contiene las rutas y lógica de negocio para cada entidad (auth, fields, payments, reservations, users).

### Frontend
- **`src/features`**: Contiene las funcionalidades principales del proyecto.
- **`src/shared`**: Componentes y utilidades reutilizables.
- **`src/pages`**: Páginas principales de la aplicación.

---

## Funcionalidades Implementadas

### Backend
1. **Estructura inicial:**
   - Configuración de Express.
   - Rutas básicas para `fields`, `reservations`, `users`, y `payments`.
2. **Base de datos:**
   - Script para inicializar la base de datos y crear las tablas.
   - Script para insertar datos iniciales en las tablas.
3. **Autenticación:**
   - Middleware para proteger rutas específicas (`users`, `reservations`, `payments`).
   - Rutas públicas para `fields`.
4. **Paginación:**
   - Implementada en todas las rutas para manejar grandes volúmenes de datos (50 elementos por página).
5. **Centralización de parámetros:**
   - Uso de constantes globales para la URL base, prefijo de la API y tamaño de página predeterminado.
6. **Documentación automática:**
   - Swagger configurado para documentar todas las rutas de la API.

### Frontend
1. **Estructura inicial:**
   - Configuración de React y TypeScript.
   - Estructura basada en Screaming Architecture.