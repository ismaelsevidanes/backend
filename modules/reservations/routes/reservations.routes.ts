import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import { checkJwtBlacklist } from '../../../src/middlewares/jwtBlacklist';
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

// Proteger las rutas de reservas con el middleware de autenticación y blacklist
router.use(authenticateToken, checkJwtBlacklist);

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

    // Ahora seleccionamos también date y slot
    const [reservations] = await connection.query<RowDataPacket[]>(
      'SELECT *, DATE(start_time) as date, slot FROM reservations LIMIT ? OFFSET ?',
      [DEFAULT_PAGE_SIZE, offset]
    );
    connection.release();

    // Añadimos slot calculado si no existe (por compatibilidad)
    const reservationsWithSlot = reservations.map((r: any) => {
      let slot = r.slot;
      if (!slot && r.start_time) {
        const time = r.start_time.toTimeString().slice(0,5);
        const found = SLOTS.find(s => s.start === time);
        slot = found ? found.id : null;
      }
      return {
        ...r,
        date: r.date || (r.start_time ? r.start_time.toISOString().slice(0,10) : undefined),
        slot
      };
    });

    res.json({
      data: reservationsWithSlot,
      totalPages,
    });
  } catch (error) {
    console.error('Error al obtener las reservas:', error);
    res.status(500).json({ message: 'Error al obtener las reservas' });
  }
});

// Definición de slots fijos para sábados y domingos
const SLOTS = [
  { id: 1, start: "09:00", end: "10:30" },
  { id: 2, start: "10:30", end: "12:00" },
  { id: 3, start: "12:00", end: "13:30" },
  { id: 4, start: "13:30", end: "15:00" },
];

function isWeekend(dateStr: string) {
  const date = new Date(dateStr);
  const day = date.getDay();
  return day === 0 || day === 6; // 0: domingo, 6: sábado
}

/**
 * @swagger
 * /api/reservations:
 *   post:
 *     summary: Crea una nueva reserva con usuarios asociados (soporta cantidad de plazas)
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
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la reserva (solo sábado o domingo)
 *               slot:
 *                 type: integer
 *                 description: Slot horario (1-4)
 *               total_price:
 *                 type: number
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
 *       201:
 *         description: Reserva creada correctamente
 *       400:
 *         description: Debes proporcionar al menos un usuario para la reserva
 *       500:
 *         description: Error al crear la reserva
 */

// Nueva ruta para crear una reserva con slots y validación de usuarios máximos
router.post('/', async (req: Request, res: Response) => {
  const { field_id, date, slot, user_ids, quantities } = req.body;

  if (!Array.isArray(user_ids) || user_ids.length === 0) {
    res.status(400).json({ message: 'Debes proporcionar al menos un usuario para la reserva' });
    return;
  }
  if (!date || !slot) {
    res.status(400).json({ message: 'Debes proporcionar fecha y slot' });
    return;
  }
  if (!isWeekend(date)) {
    res.status(400).json({ message: 'Solo se pueden reservar sábados o domingos' });
    return;
  }
  const slotObj = SLOTS.find(s => s.id === Number(slot));
  if (!slotObj) {
    res.status(400).json({ message: 'Slot no válido' });
    return;
  }
  // Calcular start_time y end_time
  const start_time = `${date} ${slotObj.start}:00`;
  const end_time = `${date} ${slotObj.end}:00`;

  try {
    const connection = await pool.getConnection();
    // 1. Obtener el tipo de campo y el precio
    const [fieldRows] = await connection.query<RowDataPacket[]>(
      'SELECT type, price_per_hour FROM fields WHERE id = ?',
      [field_id]
    );
    if (fieldRows.length === 0) {
      connection.release();
      res.status(404).json({ message: 'Campo no encontrado' });
      return;
    }
    const fieldType = fieldRows[0].type;
    const pricePerHour = Number(fieldRows[0].price_per_hour);
    const maxUsers = fieldType === 'futbol7' ? 14 : 22;
    // 2. Contar plazas ya reservadas para ese campo, fecha y slot (de todas las reservas en ese slot)
    const [userCountRows] = await connection.query<RowDataPacket[]>(
      `SELECT COALESCE(SUM(ru.quantity),0) as count FROM reservations r
        JOIN reservation_users ru ON ru.reservation_id = r.id
        WHERE r.field_id = ? AND DATE(r.start_time) = ? AND r.slot = ?`,
      [field_id, date, slot]
    );
    const currentUsers = Number(userCountRows[0]?.count) || 0;
    // 3. Calcular plazas a reservar (usando quantities correctamente)
    let plazasNuevas = 0;
    const userCountMap: Record<number, number> = {};
    for (let i = 0; i < user_ids.length; i++) {
      const userId = user_ids[i];
      let quantity = 1;
      if (Array.isArray(quantities) && quantities[i] !== undefined && quantities[i] !== null) {
        quantity = Number(quantities[i]);
      }
      userCountMap[userId] = (userCountMap[userId] || 0) + quantity;
      plazasNuevas += quantity;
    }
    // Calcular el precio total según plazas reservadas y precio del campo
    const total_price = plazasNuevas * pricePerHour;
    // DEBUG: log para comprobar cantidades
    //console.log('currentUsers:', currentUsers, 'plazasNuevas:', plazasNuevas, 'maxUsers:', maxUsers);
    if (currentUsers + plazasNuevas > maxUsers) {
      connection.release();
      res.status(400).json({
        message: `El máximo de plazas para este campo, día y slot es ${maxUsers}. Quedan disponibles: ${Math.max(0, maxUsers - currentUsers)}. Intentas reservar: ${plazasNuevas}. Ya reservadas: ${currentUsers}.`,
        maxUsers,
        plazasDisponibles: Math.max(0, maxUsers - currentUsers),
        plazasSolicitadas: plazasNuevas,
        plazasReservadas: currentUsers
      });
      return;
    }
    // 4. Crear la reserva (agrupada: una reserva con N plazas para ese usuario)
    const [result] = await connection.query<OkPacket>(
      'INSERT INTO reservations (field_id, start_time, end_time, date, slot, total_price) VALUES (?, ?, ?, ?, ?, ?)',
      [field_id, start_time, end_time, date, slot, total_price]
    );
    const reservationId = result.insertId;
    // 5. Insertar usuarios asociados en la tabla intermedia (con cantidad de plazas)
    // Debe haber solo una fila por usuario por reserva, con la cantidad total
    const userQuantityMap: Record<number, number> = {};
    for (let i = 0; i < user_ids.length; i++) {
      const userId = user_ids[i];
      let quantity = 1;
      if (Array.isArray(quantities) && quantities[i] !== undefined && quantities[i] !== null) {
        quantity = Number(quantities[i]);
      }
      userQuantityMap[userId] = (userQuantityMap[userId] || 0) + quantity;
    }
    for (const userIdStr of Object.keys(userQuantityMap)) {
      const userId = Number(userIdStr);
      await connection.query(
        'INSERT INTO reservation_users (reservation_id, user_id, quantity) VALUES (?, ?, ?)',
        [reservationId, userId, userQuantityMap[userId]]
      );
    }
    connection.release();
    res.status(201).json({
      message: 'Reserva creada correctamente',
      reservationId,
      plazasDisponibles: maxUsers - (currentUsers + plazasNuevas),
      maxUsers,
      plazasReservadas: currentUsers + plazasNuevas
    });
  } catch (error) {
    console.error('Error al crear la reserva:', error);
    res.status(500).json({ message: 'Error al crear la reserva' });
  }
});

/**
 * @swagger
 * /api/reservations/{id}:
 *   put:
 *     summary: Actualiza una reserva existente (soporta cantidad de plazas)
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
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la reserva (solo sábado o domingo)
 *               slot:
 *                 type: integer
 *                 description: Slot horario (1-4)
 *               total_price:
 *                 type: number
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
 *         description: Reserva actualizada correctamente
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error al actualizar la reserva
 */

// Ruta para actualizar una reserva existente (solo datos de la reserva, no usuarios)
router.put('/:id', function (req: Request, res: Response, next: NextFunction) {
  (async () => {
    const { id } = req.params;
    const { field_id, date, slot, total_price, user_ids, quantities } = req.body;

    if (!date || !slot) {
      res.status(400).json({ message: 'Debes proporcionar fecha y slot' });
      return;
    }
    if (!isWeekend(date)) {
      res.status(400).json({ message: 'Solo se pueden reservar sábados o domingos' });
      return;
    }
    const slotObj = SLOTS.find(s => s.id === Number(slot));
    if (!slotObj) {
      res.status(400).json({ message: 'Slot no válido' });
      return;
    }
    const start_time = `${date} ${slotObj.start}:00`;
    const end_time = `${date} ${slotObj.end}:00`;

    try {
      const connection = await pool.getConnection();
      // Validar campo
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
      // Validar usuarios si se pasan
      let currentUsers = 0;
      if (Array.isArray(user_ids)) {
        const [userCountRows] = await connection.query<RowDataPacket[]>(
          `SELECT COALESCE(SUM(ru.quantity),0) as count FROM reservations r
            JOIN reservation_users ru ON ru.reservation_id = r.id
            WHERE r.field_id = ? AND DATE(r.start_time) = ? AND r.start_time = ? AND r.id != ?`,
          [field_id, date, start_time, id]
        );
        currentUsers = userCountRows[0]?.count || 0;
        // Calcular plazas a reservar
        let plazasNuevas = 0;
        const userCountMap: Record<number, number> = {};
        for (let i = 0; i < user_ids.length; i++) {
          const userId = user_ids[i];
          // Usar quantities del body, si existe, si no por defecto 1
          let quantity = 1;
          if (Array.isArray(quantities) && quantities[i] !== undefined && quantities[i] !== null) {
            quantity = Number(quantities[i]);
          }
          userCountMap[userId] = (userCountMap[userId] || 0) + quantity;
          plazasNuevas += quantity;
        }
        if (currentUsers + plazasNuevas > maxUsers) {
          connection.release();
          res.status(400).json({ message: `El máximo de usuarios para este campo, día y slot es ${maxUsers}. Quedan disponibles: ${maxUsers - currentUsers}` });
          return;
        }
      }
      // Actualizar reserva
      const [result] = await connection.query<OkPacket>(
        'UPDATE reservations SET field_id = ?, start_time = ?, end_time = ?, date = ?, slot = ?, total_price = ? WHERE id = ?',
        [field_id, start_time, end_time, date, slot, total_price, id]
      );
      // Si se pasan usuarios, actualizar tabla intermedia
      if (Array.isArray(user_ids)) {
        await connection.query('DELETE FROM reservation_users WHERE reservation_id = ?', [id]);
        for (const userId of user_ids) {
          await connection.query(
            'INSERT INTO reservation_users (reservation_id, user_id) VALUES (?, ?)',
            [id, userId]
          );
        }
      }
      connection.release();
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Reserva no encontrada' });
      }
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
 *   patch:
 *     summary: Actualiza campos específicos de una reserva existente (parcial)
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
 *               date:
 *                 type: string
 *                 format: date
 *                 description: Fecha de la reserva (solo sábado o domingo)
 *               slot:
 *                 type: integer
 *                 description: Slot horario (1-4)
 *               total_price:
 *                 type: number
 *               user_ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Reserva actualizada correctamente
 *       404:
 *         description: Reserva no encontrada
 *       500:
 *         description: Error al actualizar la reserva
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { field_id, date, slot, total_price, user_ids } = req.body;

  if ((date && !slot) || (!date && slot)) {
    res.status(400).json({ message: 'Si actualizas la fecha o el slot, debes proporcionar ambos' });
    return;
  }
  let start_time, end_time;
  if (date && slot) {
    if (!isWeekend(date)) {
      res.status(400).json({ message: 'Solo se pueden reservar sábados o domingos' });
      return;
    }
    const slotObj = SLOTS.find(s => s.id === Number(slot));
    if (!slotObj) {
      res.status(400).json({ message: 'Slot no válido' });
      return;
    }
    start_time = `${date} ${slotObj.start}:00`;
    end_time = `${date} ${slotObj.end}:00`;
  }

  try {
    const connection = await pool.getConnection();
    // Validar campo si se pasa
    let fieldType, maxUsers;
    if (field_id) {
      const [fieldRows] = await connection.query<RowDataPacket[]>(
        'SELECT type FROM fields WHERE id = ?',
        [field_id]
      );
      if (fieldRows.length === 0) {
        connection.release();
        res.status(404).json({ message: 'Campo no encontrado' });
        return;
      }
      fieldType = fieldRows[0].type;
      maxUsers = fieldType === 'futbol7' ? 14 : 22;
    }
    // Validar usuarios si se pasan y se actualiza fecha/slot/campo
    if (Array.isArray(user_ids) && (date && slot && field_id)) {
      const [userCountRows] = await connection.query<RowDataPacket[]>(
        `SELECT COALESCE(SUM(ru.quantity),0) as count FROM reservations r
          JOIN reservation_users ru ON ru.reservation_id = r.id
          WHERE r.field_id = ? AND DATE(r.start_time) = ? AND r.start_time = ? AND r.id != ?`,
        [field_id, date, start_time, id]
      );
      const currentUsers = userCountRows[0]?.count || 0;
      if (typeof maxUsers !== 'number') {
        connection.release();
        res.status(500).json({ message: 'No se pudo determinar el máximo de usuarios para este campo.' });
        return;
      }
      if (currentUsers + user_ids.length > maxUsers) {
        connection.release();
        res.status(400).json({ message: `El máximo de usuarios para este campo, día y slot es ${maxUsers}. Quedan disponibles: ${maxUsers - currentUsers}` });
        return;
      }
    }
    // Construir updates
    const updates: string[] = [];
    const values: any[] = [];
    if (field_id) {
      updates.push('field_id = ?');
      values.push(field_id);
    }
    if (date && slot) {
      updates.push('start_time = ?');
      values.push(start_time);
      updates.push('end_time = ?');
      values.push(end_time);
      updates.push('date = ?');
      values.push(date);
      updates.push('slot = ?');
      values.push(slot);
    }
    if (total_price) {
      updates.push('total_price = ?');
      values.push(total_price);
    }
    if (updates.length === 0) {
      res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
      connection.release();
      return;
    }
    values.push(id);
    const [result] = await connection.query<OkPacket>(
      `UPDATE reservations SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    // Si se pasan usuarios, actualizar tabla intermedia
    if (Array.isArray(user_ids)) {
      await connection.query('DELETE FROM reservation_users WHERE reservation_id = ?', [id]);
      for (const userId of user_ids) {
        await connection.query(
          'INSERT INTO reservation_users (reservation_id, user_id) VALUES (?, ?)',
          [id, userId]
        );
      }
    }
    connection.release();
    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Reserva no encontrada' });
      return;
    }
    res.json({ message: 'Reserva actualizada correctamente' });
  } catch (error) {
    console.error('Error al actualizar la reserva:', error);
    next(error);
  }
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