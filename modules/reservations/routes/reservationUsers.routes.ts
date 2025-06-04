import express, { Request, Response } from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import { checkJwtBlacklist } from '../../../src/middlewares/jwtBlacklist';
import pool from '../../../config/database';
import { RowDataPacket, OkPacket } from 'mysql2';

const router = express.Router();

// Proteger todas las rutas con autenticación y blacklist
router.use(authenticateToken, checkJwtBlacklist);

/**
 * @swagger
 * /api/reservations/{reservationId}/users:
 *   get:
 *     summary: Obtiene los usuarios asociados a una reserva
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *     responses:
 *       200:
 *         description: Lista de usuarios asociados a la reserva
 *       500:
 *         description: Error al obtener los usuarios de la reserva
 */
// GET usuarios de una reserva
router.get('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    try {
      const connection = await pool.getConnection();
      const [users] = await connection.query<RowDataPacket[]>(
        `SELECT u.id, u.name, u.email FROM users u
         INNER JOIN reservation_users ru ON ru.user_id = u.id
         WHERE ru.reservation_id = ?`,
        [reservationId]
      );
      connection.release();
      res.json(users);
    } catch (error) {
      console.error('Error al obtener los usuarios de la reserva:', error);
      res.status(500).json({ message: 'Error al obtener los usuarios de la reserva' });
    }
  })().catch(next);
});

/**
 * @swagger
 * /api/reservations/{reservationId}/users:
 *   post:
 *     summary: Añade uno o varios usuarios a una reserva existente
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: reservationId
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
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Usuarios añadidos a la reserva
 *       400:
 *         description: Debes proporcionar al menos un usuario
 *       500:
 *         description: Error al añadir usuarios a la reserva
 */
// POST añadir usuarios a una reserva con validación de máximo según tipo de campo
router.post('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      res.status(400).json({ message: 'Debes proporcionar al menos un usuario' });
      return;
    }
    try {
      const connection = await pool.getConnection();
      // Obtener el tipo de campo de la reserva
      const [fieldRows] = await connection.query<RowDataPacket[]>(
        `SELECT f.type FROM reservations r INNER JOIN fields f ON r.field_id = f.id WHERE r.id = ?`,
        [reservationId]
      );
      if (fieldRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Reserva o campo no encontrado' });
        return;
      }
      const fieldType = fieldRows[0].type;
      const maxUsers = fieldType === 'futbol7' ? 14 : 22;
      // Contar usuarios actuales
      const [currentUsersRows] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM reservation_users WHERE reservation_id = ?',
        [reservationId]
      );
      const currentCount = currentUsersRows[0].count;
      if (currentCount + user_ids.length > maxUsers) {
        connection.release();
        res.status(400).json({ message: `El máximo de usuarios para este campo es ${maxUsers}` });
        return;
      }
      for (const userId of user_ids) {
        await connection.query(
          'INSERT IGNORE INTO reservation_users (reservation_id, user_id) VALUES (?, ?)',
          [reservationId, userId]
        );
      }
      connection.release();
      res.json({ message: 'Usuarios añadidos a la reserva' });
    } catch (error) {
      console.error('Error al añadir usuarios a la reserva:', error);
      res.status(500).json({ message: 'Error al añadir usuarios a la reserva' });
    }
  })().catch(next);
});

/**
 * @swagger
 * /api/reservations/{reservationId}/users:
 *   put:
 *     summary: Reemplaza todos los usuarios de una reserva
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: reservationId
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
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Usuarios de la reserva actualizados
 *       400:
 *         description: Debes proporcionar un array de usuarios
 *       500:
 *         description: Error al actualizar usuarios de la reserva
 */
// PUT reemplazar todos los usuarios de una reserva con validación de máximo y solapamiento de reservas
router.put('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    const { user_ids, start_time, end_time, field_id } = req.body;
    if (!Array.isArray(user_ids)) {
      res.status(400).json({ message: 'Debes proporcionar un array de usuarios' });
      return;
    }
    try {
      const connection = await pool.getConnection();
      // Validar solapamiento de reservas si se actualiza el horario o campo
      if (start_time && end_time && field_id) {
        const [overlapRows] = await connection.query<RowDataPacket[]>(
          `SELECT id FROM reservations WHERE field_id = ? AND id != ? AND (
            (start_time < ? AND end_time > ?) OR
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND end_time <= ?)
          )`,
          [field_id, reservationId, end_time, end_time, start_time, start_time, start_time, end_time]
        );
        if (overlapRows.length > 0) {
          connection.release();
          res.status(400).json({ message: 'Ya existe una reserva para este campo en ese horario' });
          return;
        }
      }
      // Obtener el tipo de campo de la reserva
      const [fieldRows] = await connection.query<RowDataPacket[]>(
        `SELECT f.type FROM reservations r INNER JOIN fields f ON r.field_id = f.id WHERE r.id = ?`,
        [reservationId]
      );
      if (fieldRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Reserva o campo no encontrado' });
        return;
      }
      const fieldType = fieldRows[0].type;
      const maxUsers = fieldType === 'futbol7' ? 14 : 22;
      if (user_ids.length > maxUsers) {
        connection.release();
        res.status(400).json({ message: `El máximo de usuarios para este campo es ${maxUsers}` });
        return;
      }
      await connection.query('DELETE FROM reservation_users WHERE reservation_id = ?', [reservationId]);
      for (const userId of user_ids) {
        await connection.query(
          'INSERT INTO reservation_users (reservation_id, user_id) VALUES (?, ?)',
          [reservationId, userId]
        );
      }
      connection.release();
      res.json({ message: 'Usuarios de la reserva actualizados (PUT)' });
    } catch (error) {
      console.error('Error al actualizar usuarios de la reserva:', error);
      res.status(500).json({ message: 'Error al actualizar usuarios de la reserva' });
    }
  })().catch(next);
});

/**
 * @swagger
 * /api/reservations/{reservationId}/users:
 *   patch:
 *     summary: Actualiza usuarios parcialmente de una reserva (Borrar en el Body los campos que no se quieren actualizar)
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: reservationId
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
 *               add_user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Usuarios de la reserva actualizados
 *       500:
 *         description: Error al actualizar usuarios de la reserva
 */
// PATCH añadir y/o eliminar usuarios parcialmente con validación de máximo y solapamiento de reservas
router.patch('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    const { add_user_ids, remove_user_ids, start_time, end_time, field_id } = req.body;
    try {
      const connection = await pool.getConnection();
      // Validar solapamiento de reservas si se actualiza el horario o campo
      if (start_time && end_time && field_id) {
        const [overlapRows] = await connection.query<RowDataPacket[]>(
          `SELECT id FROM reservations WHERE field_id = ? AND id != ? AND (
            (start_time < ? AND end_time > ?) OR
            (start_time < ? AND end_time > ?) OR
            (start_time >= ? AND end_time <= ?)
          )`,
          [field_id, reservationId, end_time, end_time, start_time, start_time, start_time, end_time]
        );
        if (overlapRows.length > 0) {
          connection.release();
          res.status(400).json({ message: 'Ya existe una reserva para este campo en ese horario' });
          return;
        }
      }
      // Obtener el tipo de campo de la reserva
      const [fieldRows] = await connection.query<RowDataPacket[]>(
        `SELECT f.type FROM reservations r INNER JOIN fields f ON r.field_id = f.id WHERE r.id = ?`,
        [reservationId]
      );
      if (fieldRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Reserva o campo no encontrado' });
        return;
      }
      const fieldType = fieldRows[0].type;
      const maxUsers = fieldType === 'futbol7' ? 14 : 22;
      // Contar usuarios actuales
      const [currentUsersRows] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM reservation_users WHERE reservation_id = ?',
        [reservationId]
      );
      let currentCount = currentUsersRows[0].count;
      let newCount = currentCount;
      if (Array.isArray(add_user_ids)) newCount += add_user_ids.length;
      if (Array.isArray(remove_user_ids)) newCount -= remove_user_ids.length;
      if (newCount > maxUsers) {
        connection.release();
        res.status(400).json({ message: `El máximo de usuarios para este campo es ${maxUsers}` });
        return;
      }
      if (Array.isArray(add_user_ids)) {
        for (const userId of add_user_ids) {
          await connection.query(
            'INSERT IGNORE INTO reservation_users (reservation_id, user_id) VALUES (?, ?)',
            [reservationId, userId]
          );
        }
      }
      if (Array.isArray(remove_user_ids)) {
        for (const userId of remove_user_ids) {
          await connection.query(
            'DELETE FROM reservation_users WHERE reservation_id = ? AND user_id = ?',
            [reservationId, userId]
          );
        }
      }
      connection.release();
      res.json({ message: 'Usuarios de la reserva actualizados (PATCH)' });
    } catch (error) {
      console.error('Error al actualizar usuarios de la reserva (PATCH):', error);
      res.status(500).json({ message: 'Error al actualizar usuarios de la reserva (PATCH)' });
    }
  })().catch(next);
});

/**
 * @swagger
 * /api/reservations/{reservationId}/users/{userId}:
 *   delete:
 *     summary: Elimina un usuario de una reserva (tabla intermedia)
 *     tags: [Reservations]
 *     parameters:
 *       - in: path
 *         name: reservationId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID de la reserva
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario a eliminar de la reserva
 *     responses:
 *       200:
 *         description: Usuario eliminado de la reserva
 *       404:
 *         description: Usuario no estaba en la reserva
 *       500:
 *         description: Error al eliminar usuario de la reserva
 */
// DELETE eliminar usuario de una reserva
router.delete('/:reservationId/users/:userId', (req, res, next) => {
  (async () => {
    const { reservationId, userId } = req.params;
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query<OkPacket>(
        'DELETE FROM reservation_users WHERE reservation_id = ? AND user_id = ?',
        [reservationId, userId]
      );
      connection.release();
      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Usuario no estaba en la reserva' });
        return;
      }
      res.json({ message: 'Usuario eliminado de la reserva' });
    } catch (error) {
      console.error('Error al eliminar usuario de la reserva:', error);
      res.status(500).json({ message: 'Error al eliminar usuario de la reserva' });
    }
  })().catch(next);
});

export default router;
