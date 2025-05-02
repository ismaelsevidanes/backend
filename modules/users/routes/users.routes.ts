import express from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Proteger las rutas de usuarios con el middleware de autenticación
router.use(authenticateToken);

// Ruta para obtener todos los usuarios con paginación
router.get('/', async (req, res) => {
  console.log('Solicitud recibida en /api/users'); // Log para confirmar que la ruta está siendo alcanzada
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  try {
    const connection = await pool.getConnection();

    // Obtener el total de usuarios
    const [totalResult] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    const totalUsers = totalResult[0].total;
    const totalPages = Math.ceil(totalUsers / DEFAULT_PAGE_SIZE);

    // Obtener los usuarios paginados
    const [users] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM users LIMIT ? OFFSET ?',
      [DEFAULT_PAGE_SIZE, offset]
    );
    connection.release();

    res.json({
      data: users,
      totalPages,
    });
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});

export default router;