# Pitch Dreamers

Este proyecto está dividido en dos partes principales: **frontend** y **backend**, ambos desarrollados con TypeScript. A continuación, se describen los pasos de instalación, la estructura del proyecto y las funcionalidades implementadas hasta ahora.

---

## Instalación

### Requisitos previos
- Node.js (versión más reciente recomendada)
- MySQL (para la base de datos)

### Pasos de instalación
1. Clona este repositorio.
2. Navega a la carpeta `frontend` e instala las dependencias:
   ```bash
   cd frontend
   npm install
   ```
3. Navega a la carpeta `backend` e instala las dependencias:
   ```bash
   cd backend
   npm install
   ```
4. Configura la base de datos MySQL en el archivo `backend/config/database.ts`.
5. Ejecuta el script para inicializar la base de datos y crear las tablas:
   ```bash
   npx ts-node src/initializeDatabase.ts
   ```
6. (Opcional) Ejecuta el script para insertar datos iniciales:
   ```bash
   npx ts-node src/seedDatabase.ts
   ```

---

## Estructura del Proyecto

### Frontend
- **`src/features`**: Contiene las funcionalidades principales del proyecto.
- **`src/shared`**: Componentes y utilidades reutilizables.
- **`src/pages`**: Páginas principales de la aplicación.

### Backend
- **`shared/models`**: Define los modelos de datos en TypeScript.
- **`src`**: Contiene los scripts principales como la inicialización de la base de datos y la inserción de datos iniciales.
- **`config`**: Configuración de la base de datos y otras configuraciones globales.
- **`modules`**: Contiene las rutas y lógica de negocio para cada entidad (auth, fields, payments, reservations, users).

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

### Frontend
1. **Estructura inicial:**
   - Configuración de Vite con React y TypeScript.
   - Estructura basada en Screaming Architecture.

---

Este archivo se actualizará a medida que avancemos en el desarrollo del proyecto.