import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import { checkJwtBlacklist } from '../../../src/middlewares/jwtBlacklist';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket, OkPacket } from 'mysql2';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Fields
 *   description: Endpoints relacionados con la gestión de campos
 */

/**
 * @swagger
 * /api/fields:
 *   get:
 *     summary: Obtiene todos los campos con paginación
 *     tags: [Fields]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: location
 *         schema:
 *           type: string
 *         description: Filtrar por ubicación exacta
 *       - in: query
 *         name: max_price
 *         schema:
 *           type: number
 *         description: Filtrar por precio máximo por hora
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [futbol7, futbol11]
 *         description: Filtrar por tipo de campo
 *       - in: query
 *         name: least_reserved
 *         schema:
 *           type: boolean
 *         description: Ordenar por campos con menos reservas (true para activar)
 *     responses:
 *       200:
 *         description: Lista de campos
 *       500:
 *         description: Error al obtener los campos
 */
// Ruta pública: obtener todos los campos
router.get('/', async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;
  const { location, max_price, type, least_reserved, search } = req.query;

  let baseQuery = 'SELECT f.*, COUNT(r.id) as reservations_count FROM fields f LEFT JOIN reservations r ON f.id = r.field_id';
  let whereClauses: string[] = [];
  let havingClauses: string[] = [];
  let params: any[] = [];

  if (search) {
    whereClauses.push('LOWER(f.name) LIKE ?');
    params.push(`%${search.toString().toLowerCase()}%`);
  }
  if (location) {
    whereClauses.push('LOWER(f.location) LIKE ?');
    params.push(`%${location.toString().toLowerCase()}%`);
  }
  if (max_price) {
    whereClauses.push('f.price_per_hour <= ?');
    params.push(Number(max_price));
  }
  if (type) {
    whereClauses.push('f.type = ?');
    params.push(type);
  }

  let where = whereClauses.length ? ' WHERE ' + whereClauses.join(' AND ') : '';
  let groupBy = ' GROUP BY f.id';
  let orderBy = '';
  if (least_reserved === 'true') {
    // Ordenar por menos plazas libres (campos más llenos primero)
    orderBy = ' ORDER BY (CASE WHEN f.type = "futbol7" THEN 14 ELSE 22 END) - COUNT(r.id) ASC';
  }
  let limit = ' LIMIT ? OFFSET ?';
  params.push(DEFAULT_PAGE_SIZE, offset);

  const finalQuery = baseQuery + where + groupBy + orderBy + limit;

  try {
    const connection = await pool.getConnection();
    const [fields] = await connection.query<RowDataPacket[]>(finalQuery, params);
    connection.release();

    // Añadir plazas máximas y disponibles a cada campo
    const fieldsWithSpots = fields.map((field: any) => {
      const max_reservations = field.type === 'futbol7' ? 14 : 22;
      let images = [];
      if (field.images) {
        try {
          images = typeof field.images === 'string' ? JSON.parse(field.images) : field.images;
        } catch {
          images = [];
        }
      }
      return {
        ...field,
        max_reservations,
        available_spots: max_reservations - (field.reservations_count || 0),
        images,
      };
    });

    // Obtener el total de campos filtrados para la paginación
    let countQuery = 'SELECT COUNT(DISTINCT f.id) as total FROM fields f';
    if (where) countQuery += where;
    const connection2 = await pool.getConnection();
    const [countResult] = await connection2.query<RowDataPacket[]>(countQuery, params.slice(0, -2));
    connection2.release();
    const total = countResult[0]?.total || 0;
    const totalPages = Math.max(1, Math.ceil(total / DEFAULT_PAGE_SIZE));

    res.json({
      data: fieldsWithSpots,
      totalPages,
    });
  } catch (error) {
    console.error('Error al obtener los campos:', error);
    res.status(500).json({ message: 'Error al obtener los campos' });
  }
});

/**
 * @swagger
 * /api/fields/{id}:
 *   get:
 *     summary: Obtiene un campo por su ID
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del campo
 *     responses:
 *       200:
 *         description: Campo encontrado
 *       404:
 *         description: Campo no encontrado
 *       500:
 *         description: Error al obtener el campo
 */
router.get('/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  pool.getConnection()
    .then(connection => {
      return connection.query<RowDataPacket[]>(
        'SELECT * FROM fields WHERE id = ?',
        [id]
      ).then(([fields]) => {
        connection.release();
        if (!fields || fields.length === 0) {
          res.status(404).json({ message: 'Campo no encontrado' });
          return;
        }
        let field = fields[0];
        let images = [];
        if (field.images) {
          try {
            images = typeof field.images === 'string' ? JSON.parse(field.images) : field.images;
          } catch {
            images = [];
          }
        }
        const max_reservations = field.type === 'futbol7' ? 14 : 22;
        res.json({
          ...field,
          max_reservations,
          available_spots: max_reservations, // Si quieres calcular reservas, ajusta aquí
          images,
        });
      });
    })
    .catch(error => {
      console.error('Error al obtener el campo:', error);
      res.status(500).json({ message: 'Error al obtener el campo' });
    });
});

// Proteger todas las rutas siguientes con autenticación y blacklist
router.use(authenticateToken, checkJwtBlacklist);

/**
 * @swagger
 * /api/fields:
 *   post:
 *     summary: Crea un nuevo campo
 *     tags: [Fields]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [futbol7, futbol11]
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               location:
 *                 type: string
 *               price_per_hour:
 *                 type: number
 *     responses:
 *       201:
 *         description: Campo creado correctamente
 *       500:
 *         description: Error al crear el campo
 */
router.post('/', async (req: Request, res: Response) => {
  const { name, type, description, address, location, price_per_hour } = req.body;

  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO fields (name, type, description, address, location, price_per_hour) VALUES (?, ?, ?, ?, ?, ?)',
      [name, type, description, address, location, price_per_hour]
    );
    connection.release();

    console.log(`Campo creado: ${name}, Tipo: ${type}, Ubicación: ${location}, Precio por hora: ${price_per_hour}`);
    res.status(201).json({ message: 'Campo creado correctamente' });
  } catch (error) {
    console.error('Error al crear el campo:', error);
    res.status(500).json({ message: 'Error al crear el campo' });
  }
});

/**
 * @swagger
 * /api/fields/{id}:
 *   put:
 *     summary: Actualiza un campo existente
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del campo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [futbol7, futbol11]
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               location:
 *                 type: string
 *               price_per_hour:
 *                 type: number
 *     responses:
 *       200:
 *         description: Campo actualizado correctamente
 *       404:
 *         description: Campo no encontrado
 *       500:
 *         description: Error al actualizar el campo
 */
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { name, type, description, address, location, price_per_hour } = req.body;

  (async () => {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query<OkPacket>(
        'UPDATE fields SET name = ?, type = ?, description = ?, address = ?, location = ?, price_per_hour = ? WHERE id = ?',
        [name, type, description, address, location, price_per_hour, id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Campo no encontrado' });
      }

      console.log(`Campo actualizado: ID ${id}, ${name}, Tipo: ${type}, Ubicación: ${location}, Precio por hora: ${price_per_hour}`);
      res.json({ message: 'Campo actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar el campo:', error);
      res.status(500).json({ message: 'Error al actualizar el campo' });
    }
  })().catch(next);
});

/**
 * @swagger
 * /api/fields/{id}:
 *   patch:
 *     summary: Actualiza campos específicos de un usuario existente (Borrar en el Body los campos que no se quieren actualizar)
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del campo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [futbol7, futbol11]
 *               description:
 *                 type: string
 *               address:
 *                 type: string
 *               location:
 *                 type: string
 *               price_per_hour:
 *                 type: number
 *     responses:
 *       200:
 *         description: Campo actualizado correctamente
 *       404:
 *         description: Campo no encontrado
 *       500:
 *         description: Error al actualizar el campo
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { name, type, description, address, location, price_per_hour } = req.body;

  try {
    const connection = await pool.getConnection();

    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (type) {
      updates.push('type = ?');
      values.push(type);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }
    if (address) {
      updates.push('address = ?');
      values.push(address);
    }
    if (location) {
      updates.push('location = ?');
      values.push(location);
    }
    if (price_per_hour) {
      updates.push('price_per_hour = ?');
      values.push(price_per_hour);
    }

    if (updates.length === 0) {
      res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
      return;
    }

    values.push(id);

    const [result] = await connection.query<OkPacket>(
      `UPDATE fields SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    connection.release();

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Campo no encontrado' });
      return;
    }

    res.json({ message: 'Campo actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el campo:', error);
    next(error);
  }
});

/**
 * @swagger
 * /api/fields/{id}:
 *   delete:
 *     summary: Elimina un campo existente
 *     tags: [Fields]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del campo
 *     responses:
 *       200:
 *         description: Campo eliminado correctamente
 *       404:
 *         description: Campo no encontrado
 *       500:
 *         description: Error al eliminar el campo
 */
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