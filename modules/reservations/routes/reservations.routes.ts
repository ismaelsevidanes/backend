import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket, OkPacket } from 'mysql2';

/**
 * @swagger
 * tags:
 *   name: Reservations
 *   description: Endpoints relacionados con la gestión de reservas
 */

const router = express.Router();

// Proteger las rutas de reservas con el middleware de autenticación
router.use(authenticateToken);

/**
 * @swagger
 * /api/reservations:
 *   get:
 *     summary: Obtiene todas las reservas con paginación
 *     tags: [Reservations]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Lista de reservas
 *       500:
 *         description: Error al obtener las reservas
 */

// Ruta para obtener todas las reservas con paginación
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  try {
    const connection = await pool.getConnection();

    const [totalResult] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM reservations');
    const totalReservations = totalResult[0].total;
    const totalPages = Math.ceil(totalReservations / DEFAULT_PAGE_SIZE);

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

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Crea una nueva reserva
 *     tags: [Reservations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               total_price:
 *                 type: number
 *     responses:
 *       201:
 *         description: Reserva creada correctamente
 *       500:
 *         description: Error al crear la reserva
 */

// Ruta para crear una nueva reserva
router.post('/', async (req: Request, res: Response) => {
  const { field_id, start_time, end_time, total_price } = req.body;

  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO reservations (field_id, start_time, end_time, total_price) VALUES (?, ?, ?, ?)',
      [field_id, start_time, end_time, total_price]
    );
    connection.release();

    console.log(`Reserva creada: Campo ID ${field_id}, Inicio: ${start_time}, Fin: ${end_time}, Precio total: ${total_price}`);
    res.status(201).json({ message: 'Reserva creada correctamente' });
  } catch (error) {
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error al crear la reserva' });
  }
});

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Actualiza una reserva existente
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               field_id:
 *                 type: integer
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               total_price:
 *                 type: number
 *     responses:
 *       200:
 *         description: Reserva actualizada correctamente
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error al actualizar la reserva
 */

// Ruta para actualizar una reserva existente
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { field_id, start_time, end_time, total_price } = req.body;

  (async () => {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query<OkPacket>(
        'UPDATE reservations SET field_id = ?, start_time = ?, end_time = ?, total_price = ? WHERE id = ?',
        [field_id, start_time, end_time, total_price, id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }

      console.log(`Reserva actualizada: ID ${id}, Campo ID ${field_id}, Inicio: ${start_time}, Fin: ${end_time}, Precio total: ${total_price}`);
      res.json({ message: 'Reserva actualizada correctamente' });
    } catch (error) {
      console.error('Error al actualizar la reserva:', error);
      res.status(500).json({ message: 'Error al actualizar la reserva' });
    }
  })().catch(next);
});

/**
 * @swagger
 * /api/reservations/{id}:
 *   delete:
 *     summary: Elimina una reserva existente
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Reserva eliminada correctamente
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error al eliminar la reserva
 */

// Ruta para eliminar una reserva
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  (async () => {
    try {
      const connection = await pool.getConnection();

      const [reservationResult] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM reservations WHERE id = ?',
        [id]
      );

      if (reservationResult.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }

      const reservation = reservationResult[0];

      const [result] = await connection.query<OkPacket>(
        'DELETE FROM reservations WHERE id = ?',
        [id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }

      console.log(`Reserva eliminada: ID ${reservation.id}, Campo ID ${reservation.field_id}, Inicio: ${reservation.start_time}, Fin: ${reservation.end_time}, Precio total: ${reservation.total_price}`);
      res.json({ message: 'Reserva eliminada correctamente' });
    } catch (error) {
      console.error('Error al eliminar la reserva:', error);
      res.status(500).json({ message: 'Error al eliminar la reserva' });
    }
  })().catch(next);
});

export default router;