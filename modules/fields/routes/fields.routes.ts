import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket, OkPacket } from 'mysql2';

const router = express.Router();

// Proteger las rutas de campos con el middleware de autenticación excepto para obtener todos los campos
router.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return next(); // Permitir acceso sin autenticación para obtener todos los campos
  }
  authenticateToken(req, res, next); // Requiere autenticación para las demás rutas
});

// Ruta para obtener todos los campos con paginación
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  try {
    const connection = await pool.getConnection();

    const [totalResult] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM fields');
    const totalFields = totalResult[0].total;
    const totalPages = Math.ceil(totalFields / DEFAULT_PAGE_SIZE);

    const [fields] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM fields LIMIT ? OFFSET ?',
      [DEFAULT_PAGE_SIZE, offset]
    );
    connection.release();

    res.json({
      data: fields,
      totalPages,
    });
  } catch (error) {
    console.error('Error al obtener los campos:', error);
    res.status(500).json({ message: 'Error al obtener los campos' });
  }
});

// Ruta para crear un nuevo campo
router.post('/', async (req: Request, res: Response) => {
  const { name, description, directions, location, price_per_hour } = req.body;

  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO fields (name, description, directions, location, price_per_hour) VALUES (?, ?, ?, ?, ?)',
      [name, description, directions, location, price_per_hour]
    );
    connection.release();

    console.log(`Campo creado: ${name}, Ubicación: ${location}, Precio por hora: ${price_per_hour}`);
    res.status(201).json({ message: 'Campo creado correctamente' });
  } catch (error) {
    console.error('Error al crear el campo:', error);
    res.status(500).json({ message: 'Error al crear el campo' });
  }
});

// Ruta para actualizar un campo existente
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, description, directions, location, price_per_hour } = req.body;

  (async () => {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query<OkPacket>(
        'UPDATE fields SET name = ?, description = ?, directions = ?, location = ?, price_per_hour = ? WHERE id = ?',
        [name, description, directions, location, price_per_hour, id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Campo no encontrado' });
      }

      console.log(`Campo actualizado: ID ${id}, ${name}, Ubicación: ${location}, Precio por hora: ${price_per_hour}`);
      res.json({ message: 'Campo actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar el campo:', error);
      res.status(500).json({ message: 'Error al actualizar el campo' });
    }
  })().catch(next);
});

// Ruta para eliminar un campo
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  (async () => {
    try {
      const connection = await pool.getConnection();

      const [fieldResult] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM fields WHERE id = ?',
        [id]
      );

      if (fieldResult.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Campo no encontrado' });
      }

      const field = fieldResult[0];

      const [result] = await connection.query<OkPacket>(
        'DELETE FROM fields WHERE id = ?',
        [id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Campo no encontrado' });
      }

      console.log(`Campo eliminado: ID ${field.id}, ${field.name}, Ubicación: ${field.location}, Precio por hora: ${field.price_per_hour}`);
      res.json({ message: 'Campo eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar el campo:', error);
      res.status(500).json({ message: 'Error al eliminar el campo' });
    }
  })().catch(next);
});

export default router;