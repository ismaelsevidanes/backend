import express from 'express';
import cors from 'cors';
import fieldsRoutes from '../modules/fields/routes/fields.routes';
import authRoutes from '../modules/auth/routes/auth.routes';
import usersRoutes from '../modules/users/routes/users.routes';
import reservationsRoutes from '../modules/reservations/routes/reservations.routes';
import paymentsRoutes from '../modules/payments/routes/payments.routes';

const app = express();
const PORT = 3000;

app.use(cors()); // Habilitar CORS para todas las solicitudes
app.use(express.json()); // Middleware para procesar JSON

app.get('/', (req, res) => {
  res.send('¡Servidor funcionando!');
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