import express from 'express';
import cors from 'cors';
import fieldsRoutes from '../modules/fields/routes/fields.routes';
import authRoutes from '../modules/auth/routes/auth.routes';
import usersRoutes from '../modules/users/routes/users.routes';
import reservationsRoutes from '../modules/reservations/routes/reservations.routes';
import paymentsRoutes from '../modules/payments/routes/payments.routes';
import { setupSwagger } from '../config/swagger';

const app = express();
const PORT = 3000;

app.use(cors()); // Habilitar CORS para todas las solicitudes
app.use(express.json()); // Middleware para procesar JSON

setupSwagger(app); // Configurar Swagger después de inicializar la app

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Inicio</title>
    </head>
    <body>
      <h1>¡Servidor funcionando!</h1>
      <a href="/v3/api-docs" style="display: inline-block; margin-top: 20px; padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">Ir a la Documentación</a>
    </body>
    </html>
  `);
});

// Registrar las rutas de campos bajo el prefijo '/api/fields'
app.use('/api/fields', fieldsRoutes);
app.use('/auth', authRoutes);

// Registrar las rutas de usuarios, reservas y pagos
app.use('/api/users', usersRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/payments', paymentsRoutes);

app.listen(PORT, () => {
  console.log('Registrando rutas de campos...');
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});