import express from 'express';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Ruta básica para obtener todos los campos con paginación
router.get('/', async (req, res) => {
  console.log('Solicitud recibida en /api/fields'); // Log para confirmar que la ruta está siendo alcanzada
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  try {
    const connection = await pool.getConnection();
    const [fields] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM fields LIMIT ? OFFSET ?',
      [DEFAULT_PAGE_SIZE, offset]
    );
    connection.release();

    res.json(fields);
  } catch (error) {
    console.error('Error al obtener los campos:', error);
    res.status(500).json({ message: 'Error al obtener los campos' });
  }
});

export default router;