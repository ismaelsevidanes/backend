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
// POST añadir usuarios
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
// PUT reemplazar todos los usuarios
router.put('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    const { user_ids } = req.body;
    if (!Array.isArray(user_ids)) {
      res.status(400).json({ message: 'Debes proporcionar un array de usuarios' });
      return;
    }
    try {
      const connection = await pool.getConnection();
      // Eliminar todos los usuarios actuales
      await connection.query('DELETE FROM reservation_users WHERE reservation_id = ?', [reservationId]);
      // Insertar los nuevos usuarios
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
// PATCH añadir y/o eliminar usuarios parcialmente
router.patch('/:reservationId/users', (req, res, next) => {
  (async () => {
    const { reservationId } = req.params;
    const { add_user_ids, remove_user_ids } = req.body;
    try {
      const connection = await pool.getConnection();
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
