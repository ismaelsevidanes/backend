import express from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Proteger las rutas de reservas con el middleware de autenticación
router.use(authenticateToken);

// Ruta para obtener todas las reservas con paginación
router.get('/', async (req, res) => {
  console.log('Solicitud recibida en /api/reservations'); // Log para confirmar que la ruta está siendo alcanzada
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  try {
    const connection = await pool.getConnection();

    // Obtener el total de reservas
    const [totalResult] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM reservations');
    const totalReservations = totalResult[0].total;
    const totalPages = Math.ceil(totalReservations / DEFAULT_PAGE_SIZE);

    // Obtener las reservas paginadas
    const [reservations] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM reservations LIMIT ? OFFSET ?',
      [DEFAULT_PAGE_SIZE, offset]
    );
    connection.release();

    res.json({
      data: reservations,
      totalPages,
    });
  } catch (error) {
    console.error('Error al obtener las reservas:', error);
    res.status(500).json({ message: 'Error al obtener las reservas' });
  }
});

export default router;