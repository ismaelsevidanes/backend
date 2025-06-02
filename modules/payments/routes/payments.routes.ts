import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket, OkPacket } from 'mysql2';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Endpoints relacionados con la gestión de pagos
 */

// Proteger las rutas de pagos con el middleware de autenticación y blacklist
import { checkJwtBlacklist } from '../../../src/middlewares/jwtBlacklist';
router.use(authenticateToken, checkJwtBlacklist);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Obtiene todos los pagos con paginación
 *     tags: [Payments]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Lista de pagos
 *       500:
 *         description: Error al obtener los pagos
 */
// Ruta para obtener todos los pagos con paginación
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  try {
    const connection = await pool.getConnection();

    const [totalResult] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM payments');
    const totalPayments = totalResult[0].total;
    const totalPages = Math.ceil(totalPayments / DEFAULT_PAGE_SIZE);

    const [payments] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM payments LIMIT ? OFFSET ?',
      [DEFAULT_PAGE_SIZE, offset]
    );
    connection.release();

    res.json({
      data: payments,
      totalPages,
    });
  } catch (error) {
    console.error('Error al obtener los pagos:', error);
    res.status(500).json({ message: 'Error al obtener los pagos' });
  }
});

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Crea un nuevo pago
 *     tags: [Payments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservation_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *               paid_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Pago creado correctamente
 *       500:
 *         description: Error al crear el pago
 */
// Ruta para crear un nuevo pago
router.post('/', async (req: Request, res: Response) => {
  const { reservation_id, amount, payment_method, paid_at } = req.body;

  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO payments (reservation_id, amount, payment_method, paid_at) VALUES (?, ?, ?, ?)',
      [reservation_id, amount, payment_method, paid_at]
    );
    connection.release();

    console.log(`Pago creado: Reserva ID ${reservation_id}, Monto: ${amount}, Método: ${payment_method}, Fecha: ${paid_at}`);
    res.status(201).json({ message: 'Pago creado correctamente' });
  } catch (error) {
    console.error('Error al crear el pago:', error);
    res.status(500).json({ message: 'Error al crear el pago' });
  }
});

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Actualiza un pago existente
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservation_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *               paid_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Pago actualizado correctamente
 *       404:
 *         description: Pago no encontrado
 *       500:
 *         description: Error al actualizar el pago
 */
// Ruta para actualizar un pago existente
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { reservation_id, amount, payment_method, paid_at } = req.body;

  (async () => {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query<OkPacket>(
        'UPDATE payments SET reservation_id = ?, amount = ?, payment_method = ?, paid_at = ? WHERE id = ?',
        [reservation_id, amount, payment_method, paid_at, id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Pago no encontrado' });
      }

      console.log(`Pago actualizado: ID ${id}, Reserva ID ${reservation_id}, Monto: ${amount}, Método: ${payment_method}, Fecha: ${paid_at}`);
      res.json({ message: 'Pago actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar el pago:', error);
      res.status(500).json({ message: 'Error al actualizar el pago' });
    }
  })().catch(next);
});

/**
 * @swagger
 * /api/payments/{id}:
 *   patch:
 *     summary: Actualiza campos específicos de un usuario existente (Borrar en el Body los campos que no se quieren actualizar)
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reservation_id:
 *                 type: integer
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *               paid_at:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Pago actualizado correctamente
 *       404:
 *         description: Pago no encontrado
 *       500:
 *         description: Error al actualizar el pago
 */
// Ruta para actualizar campos específicos de un pago existente
router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { reservation_id, amount, payment_method, paid_at } = req.body;

  try {
    const connection = await pool.getConnection();

    const updates: string[] = [];
    const values: any[] = [];

    if (reservation_id) {
      updates.push('reservation_id = ?');
      values.push(reservation_id);
    }
    if (amount) {
      updates.push('amount = ?');
      values.push(amount);
    }
    if (payment_method) {
      updates.push('payment_method = ?');
      values.push(payment_method);
    }
    if (paid_at) {
      updates.push('paid_at = ?');
      values.push(paid_at);
    }

    if (updates.length === 0) {
      res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
      return;
    }

    values.push(id);

    const [result] = await connection.query<OkPacket>(
      `UPDATE payments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    connection.release();

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Pago no encontrado' });
      return;
    }

    res.json({ message: 'Pago actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el pago:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Elimina un pago existente
 *     tags: [Payments]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del pago
 *     responses:
 *       200:
 *         description: Pago eliminado correctamente
 *       404:
 *         description: Pago no encontrado
 *       500:
 *         description: Error al eliminar el pago
 */
// Ruta para eliminar un pago
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  (async () => {
    try {
      const connection = await pool.getConnection();

      const [paymentResult] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM payments WHERE id = ?',
        [id]
      );

      if (paymentResult.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Pago no encontrado' });
      }

      const payment = paymentResult[0];

      const [result] = await connection.query<OkPacket>(
        'DELETE FROM payments WHERE id = ?',
        [id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Pago no encontrado' });
      }

      console.log(`Pago eliminado: ID ${payment.id}, Reserva ID ${payment.reservation_id}, Monto: ${payment.amount}, Método: ${payment.payment_method}, Fecha: ${payment.paid_at}`);
      res.json({ message: 'Pago eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar el pago:', error);
      res.status(500).json({ message: 'Error al eliminar el pago' });
    }
  })().catch(next);
});

export default router;