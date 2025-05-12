import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
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
 *     responses:
 *       200:
 *         description: Lista de campos
 *       500:
 *         description: Error al obtener los campos
 */
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
  const { name, description, address, location, price_per_hour } = req.body;

  try {
    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO fields (name, description, address, location, price_per_hour) VALUES (?, ?, ?, ?, ?)',
      [name, description, address, location, price_per_hour]
    );
    connection.release();

    console.log(`Campo creado: ${name}, Ubicación: ${location}, Precio por hora: ${price_per_hour}`);
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
  const { name, description, address, location, price_per_hour } = req.body;

  (async () => {
    try {
      const connection = await pool.getConnection();
      const [result] = await connection.query<OkPacket>(
        'UPDATE fields SET name = ?, description = ?, address = ?, location = ?, price_per_hour = ? WHERE id = ?',
        [name, description, address, location, price_per_hour, id]
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
  const { name, description, address, location, price_per_hour } = req.body;

  try {
    const connection = await pool.getConnection();

    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
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

// Proteger las rutas de campos con el middleware de autenticación excepto para obtener todos los campos
router.use((req, res, next) => {
  if (req.method === 'GET' && req.path === '/') {
    return next(); // Permitir acceso sin autenticación para obtener todos los campos
  }
  authenticateToken(req, res, next); // Requiere autenticación para las demás rutas
});

export default router;