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
 *     summary: Obtiene los usuarios asociados a una reserva (incluye cantidad de plazas)
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
 *         description: Lista de usuarios asociados a la reserva y su cantidad de plazas
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   email:
 *                     type: string
 *                   quantity:
 *                     type: integer
 *       500:
 *         description: Error al obtener los usuarios de la reserva
 */
// GET usuarios de una reserva (ahora incluye quantity)
router.get('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    try {
      const connection = await pool.getConnection();
      const [users] = await connection.query<RowDataPacket[]>(
        `SELECT u.id, u.name, u.email, ru.quantity FROM users u
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
 *     summary: Añade uno o varios usuarios a una reserva existente (soporta cantidad de plazas)
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
 *               quantities:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Cantidad de plazas por usuario (opcional, por defecto 1)
 *     responses:
 *       200:
 *         description: Usuarios añadidos a la reserva
 *       400:
 *         description: Debes proporcionar al menos un usuario
 *       500:
 *         description: Error al añadir usuarios a la reserva
 */
// POST añadir usuarios a una reserva (ahora soporta quantity)
router.post('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    const { user_ids, quantities } = req.body;
    if (!Array.isArray(user_ids) || user_ids.length === 0) {
      res.status(400).json({ message: 'Debes proporcionar al menos un usuario' });
      return;
    }
    try {
      const connection = await pool.getConnection();
      // Obtener datos de la reserva
      const [reservationRows] = await connection.query<RowDataPacket[]>(
        'SELECT field_id, date, slot FROM reservations WHERE id = ?',
        [reservationId]
      );
      if (reservationRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Reserva no encontrada' });
        return;
      }
      const { field_id, date, slot } = reservationRows[0];
      // Obtener tipo de campo
      const [fieldRows] = await connection.query<RowDataPacket[]>(
        'SELECT type FROM fields WHERE id = ?',
        [field_id]
      );
      if (fieldRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Campo no encontrado' });
        return;
      }
      const fieldType = fieldRows[0].type;
      const maxUsers = fieldType === 'futbol7' ? 14 : 22;
      // Contar usuarios ya reservados en ese campo, día y slot (todas las reservas)
      const [userCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(ru.quantity),0) as count FROM reservations r
          JOIN reservation_users ru ON ru.reservation_id = r.id
          WHERE r.field_id = ? AND r.date = ? AND r.slot = ?`,
        [field_id, date, slot]
      );
      const currentUsers = userCountRows[0]?.count || 0;
      // Contar usuarios actuales de ESTA reserva
      const [currentUsersRows] = await connection.query<RowDataPacket[]>(
        'SELECT COALESCE(SUM(quantity),0) as count FROM reservation_users WHERE reservation_id = ?',
        [reservationId]
      );
      const currentCount = currentUsersRows[0].count;
      // Si sumamos los nuevos usuarios, ¿superamos el máximo?
      if (currentUsers - currentCount + user_ids.length > maxUsers) {
        connection.release();
        res.status(400).json({ message: `El máximo de usuarios para este campo, día y slot es ${maxUsers}. Quedan disponibles: ${maxUsers - (currentUsers - currentCount)}` });
        return;
      }
      // Añadir usuarios con quantity
      for (let i = 0; i < user_ids.length; i++) {
        const userId = user_ids[i];
        const quantity = Array.isArray(quantities) && quantities[i] ? quantities[i] : 1;
        await connection.query(
          'INSERT INTO reservation_users (reservation_id, user_id, quantity) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE quantity = quantity + VALUES(quantity)',
          [reservationId, userId, quantity]
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
 *     summary: Reemplaza todos los usuarios de una reserva (soporta cantidad de plazas)
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
 *               quantities:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Cantidad de plazas por usuario (opcional, por defecto 1)
 *     responses:
 *       200:
 *         description: Usuarios de la reserva actualizados
 *       400:
 *         description: Debes proporcionar un array de usuarios
 *       500:
 *         description: Error al actualizar usuarios de la reserva
 */
// PUT reemplazar todos los usuarios de una reserva (soporta quantity)
router.put('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    const { user_ids, quantities } = req.body;
    if (!Array.isArray(user_ids)) {
      res.status(400).json({ message: 'Debes proporcionar un array de usuarios' });
      return;
    }
    try {
      const connection = await pool.getConnection();
      // Obtener datos de la reserva
      const [reservationRows] = await connection.query<RowDataPacket[]>(
        'SELECT field_id, date, slot FROM reservations WHERE id = ?',
        [reservationId]
      );
      if (reservationRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Reserva no encontrada' });
        return;
      }
      const { field_id, date, slot } = reservationRows[0];
      // Obtener tipo de campo
      const [fieldRows] = await connection.query<RowDataPacket[]>(
        'SELECT type FROM fields WHERE id = ?',
        [field_id]
      );
      if (fieldRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Campo no encontrado' });
        return;
      }
      const fieldType = fieldRows[0].type;
      const maxUsers = fieldType === 'futbol7' ? 14 : 22;
      // Contar plazas ya reservadas en ese campo, día y slot (todas las reservas)
      const [userCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(ru.quantity),0) as count FROM reservations r
          JOIN reservation_users ru ON ru.reservation_id = r.id
          WHERE r.field_id = ? AND r.date = ? AND r.slot = ?`,
        [field_id, date, slot]
      );
      const currentUsers = userCountRows[0]?.count || 0;
      // Contar plazas actuales de ESTA reserva
      const [currentUsersRows] = await connection.query<RowDataPacket[]>(
        'SELECT COALESCE(SUM(quantity),0) as count FROM reservation_users WHERE reservation_id = ?',
        [reservationId]
      );
      const currentCount = currentUsersRows[0].count;
      // Calcular plazas a añadir
      let plazasNuevas = 0;
      for (let i = 0; i < user_ids.length; i++) {
        plazasNuevas += quantities && quantities[i] ? Number(quantities[i]) : 1;
      }
      // Si sumamos las nuevas plazas, ¿superamos el máximo?
      if (currentUsers - currentCount + plazasNuevas > maxUsers) {
        connection.release();
        return res.status(400).json({ message: `El máximo de plazas para este campo, día y slot es ${maxUsers}. Quedan disponibles: ${maxUsers - (currentUsers - currentCount)}` });
      }
      await connection.query('DELETE FROM reservation_users WHERE reservation_id = ?', [reservationId]);
      for (let i = 0; i < user_ids.length; i++) {
        const userId = user_ids[i];
        const quantity = Array.isArray(quantities) && quantities[i] ? quantities[i] : 1;
        await connection.query(
          'INSERT INTO reservation_users (reservation_id, user_id, quantity) VALUES (?, ?, ?)',
          [reservationId, userId, quantity]
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
// PATCH añadir y/o eliminar usuarios parcialmente con validación de máximo por campo, día y slot
router.patch('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    const { add_user_ids, remove_user_ids } = req.body;
    try {
      const connection = await pool.getConnection();
      // Obtener datos de la reserva
      const [reservationRows] = await connection.query<RowDataPacket[]>(
        'SELECT field_id, date, slot FROM reservations WHERE id = ?',
        [reservationId]
      );
      if (reservationRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Reserva no encontrada' });
        return;
      }
      const { field_id, date, slot } = reservationRows[0];
      // Obtener tipo de campo
      const [fieldRows] = await connection.query<RowDataPacket[]>(
        'SELECT type FROM fields WHERE id = ?',
        [field_id]
      );
      if (fieldRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Campo no encontrado' });
        return;
      }
      const fieldType = fieldRows[0].type;
      const maxUsers = fieldType === 'futbol7' ? 14 : 22;
      // Contar usuarios ya reservados en ese campo, día y slot (todas las reservas)
      const [userCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COUNT(ru.user_id) as count FROM reservations r
          JOIN reservation_users ru ON ru.reservation_id = r.id
          WHERE r.field_id = ? AND r.date = ? AND r.slot = ?`,
        [field_id, date, slot]
      );
      const currentUsers = userCountRows[0]?.count || 0;
      // Contar usuarios actuales de ESTA reserva
      const [currentUsersRows] = await connection.query<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM reservation_users WHERE reservation_id = ?',
        [reservationId]
      );
      let currentCount = currentUsersRows[0].count;
      let newCount = currentCount;
      if (Array.isArray(add_user_ids)) newCount += add_user_ids.length;
      if (Array.isArray(remove_user_ids)) newCount -= remove_user_ids.length;
      if (currentUsers - currentCount + newCount > maxUsers) {
        connection.release();
        res.status(400).json({ message: `El máximo de usuarios para este campo, día y slot es ${maxUsers}. Quedan disponibles: ${maxUsers - (currentUsers - currentCount)}` });
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
