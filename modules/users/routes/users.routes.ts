import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken,AuthenticatedRequest } from '../../../src/middlewares/authMiddleware';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket, OkPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';
import { checkJwtBlacklist } from '../../../src/middlewares/jwtBlacklist';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints relacionados con la gestión de usuarios
 */

// Proteger las rutas de usuarios con el middleware de autenticación y blacklist
router.use(authenticateToken, checkJwtBlacklist);

/**
 * @swagger
 * /api/users:
 *   get:
 *     summary: Obtiene todos los usuarios con paginación
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *     responses:
 *       200:
 *         description: Lista de usuarios
 *       500:
 *         description: Error al obtener los usuarios
 */
// Ruta para obtener todos los usuarios con paginación
router.get('/', async (req: Request, res: Response) => {
  console.log('Solicitud recibida en /api/users'); // Log para confirmar que la ruta está siendo alcanzada
  const page = parseInt(req.query.page as string) || 1;
  const offset = (page - 1) * DEFAULT_PAGE_SIZE;

  try {
    const connection = await pool.getConnection();

    // Obtener el total de usuarios
    const [totalResult] = await connection.query<RowDataPacket[]>('SELECT COUNT(*) as total FROM users');
    const totalUsers = totalResult[0].total;
    const totalPages = Math.ceil(totalUsers / DEFAULT_PAGE_SIZE);

    // Obtener los usuarios paginados
    const [users] = await connection.query<RowDataPacket[]>(
      'SELECT * FROM users LIMIT ? OFFSET ?',
      [DEFAULT_PAGE_SIZE, offset]
    );
    connection.release();

    res.json({
      data: users,
      totalPages,
    });
  } catch (error) {
    console.error('Error al obtener los usuarios:', error);
    res.status(500).json({ message: 'Error al obtener los usuarios' });
  }
});

/**
 * @swagger
 * /api/users:
 *   post:
 *     summary: Crea un nuevo usuario
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       201:
 *         description: Usuario creado correctamente
 *       500:
 *         description: Error al crear el usuario
 */
// Ruta para crear un nuevo usuario
router.post('/', async (req: Request, res: Response) => {
  const { name, email, password, role } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10); // Encriptar la contraseña

    const connection = await pool.getConnection();
    await connection.query(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, hashedPassword, role || 'user']
    );
    connection.release();

    console.log(`Usuario creado: ${name}, Email: ${email}, Rol: ${role || 'user'}`);
    res.status(201).json({ message: 'Usuario creado correctamente' });
  } catch (error) {
    console.error('Error al crear el usuario:', error);
    res.status(500).json({ message: 'Error al crear el usuario' });
  }
});

/**
 * @swagger
 * /api/users/me:
 *   get:
 *     summary: Obtiene la información del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario autenticado
 *       401:
 *         description: No autorizado
 */
// Ruta para obtener el usuario autenticado (igual que el resto de rutas)
router.get('/me', (req, res, next) => {
  (async () => {
    try {
      // El usuario decodificado está en req.user (agregado por authenticateToken)
      const userJwt = (req as any).user;
      if (!userJwt || !userJwt.email) {
        return res.status(401).json({ message: 'No autorizado' });
      }
      const connection = await pool.getConnection();
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT id, name, email FROM users WHERE email = ?',
        [userJwt.email]
      );
      connection.release();
      if (rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      res.json(rows[0]);
    } catch (error) {
      next(error);
    }
  })();
});

/**
 * @swagger
 * /api/users/me:
 *   patch:
 *     summary: Actualiza los datos del usuario autenticado
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       400:
 *         description: No se proporcionaron campos para actualizar
 *       401:
 *         description: No autorizado
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar el usuario
 */
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

router.patch('/me', async (req, res, next) => {
  (async () => {
    try {
      const userJwt = (req as any).user;
      if (!userJwt || !userJwt.email) {
        return res.status(401).json({ message: 'No autorizado' });
      }
      const { name, email, password } = req.body;
      if (!name && !email && !password) {
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
      }
      const connection = await pool.getConnection();
      const updates: string[] = [];
      const values: any[] = [];
      if (name) {
        updates.push('name = ?');
        values.push(name);
      }
      if (email) {
        updates.push('email = ?');
        values.push(email);
      }
      if (password) {
        const bcrypt = require('bcrypt');
        const hashedPassword = await bcrypt.hash(password, 10);
        updates.push('password = ?');
        values.push(hashedPassword);
      }
      if (updates.length === 0) {
        connection.release();
        return res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
      }
      // Construir la query y los valores dinámicamente
      const sql = `UPDATE users SET ${updates.join(', ')} WHERE email = ?`;
      values.push(userJwt.email);
      const [result]: any = await connection.query(sql, values);
      // Obtener los datos actualizados del usuario
      const [rows] = await connection.query<RowDataPacket[]>(
        'SELECT id, name, email, role FROM users WHERE ' + (email ? 'email = ?' : 'email = ?'),
        [email || userJwt.email]
      );
      connection.release();
      if (!result || (typeof result.affectedRows === 'number' && result.affectedRows === 0) || rows.length === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }
      // Generar nuevo token con los datos actualizados
      const user = rows[0];
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ message: 'Usuario actualizado correctamente', token });
    } catch (error) {
      next(error);
    }
  })();
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Actualiza un usuario existente
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar el usuario
 */
// Ruta para actualizar un usuario existente
router.put(
  '/:id',
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('La contraseña debe tener al menos 6 caracteres'),
    body('role').optional().isIn(['user', 'admin']).withMessage('El rol debe ser user o admin'),
  ],
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { id } = req.params;
    const { name, email, password, role } = req.body;

    try {
      const connection = await pool.getConnection();

      // Encriptar la contraseña si se proporciona
      const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

      // Usar el rol proporcionado en el cuerpo de la solicitud o mantener el actual si no se envía
      const finalRole = role || undefined;

      const [result] = await connection.query<OkPacket>(
        `UPDATE users 
         SET name = ?, email = ?, password = COALESCE(?, password), role = COALESCE(?, role)
         WHERE id = ?`,
        [name, email, hashedPassword, finalRole, id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        res.status(404).json({ message: 'Usuario no encontrado' });
        return;
      }

      console.log(`Usuario actualizado: ID ${id}, ${name}, Email: ${email}, Rol: ${finalRole}`);
      res.json({ message: 'Usuario actualizado correctamente' });
    } catch (error) {
      console.error('Error al actualizar el usuario:', error);
      next(error); // Pasar el error al middleware de manejo de errores
    }
  }
);

/**
 * @swagger
 * /api/users/{id}:
 *   patch:
 *     summary: Actualiza campos específicos de un usuario existente (Borrar en el Body los campos que no se quieren actualizar)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *     responses:
 *       200:
 *         description: Usuario actualizado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al actualizar el usuario
 */
router.patch('/:id', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const { id } = req.params;
  const { name, email, password, role } = req.body;

  try {
    const connection = await pool.getConnection();

    // Construir dinámicamente la consulta de actualización
    const updates: string[] = [];
    const values: any[] = [];

    if (name) {
      updates.push('name = ?');
      values.push(name);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updates.push('password = ?');
      values.push(hashedPassword);
    }
    if (role) {
      updates.push('role = ?');
      values.push(role);
    }

    if (updates.length === 0) {
      res.status(400).json({ message: 'No se proporcionaron campos para actualizar' });
      return;
    }

    values.push(id);

    const [result] = await connection.query<OkPacket>(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    connection.release();

    if (result.affectedRows === 0) {
      res.status(404).json({ message: 'Usuario no encontrado' });
      return;
    }

    res.json({ message: 'Usuario actualizado correctamente' });
  } catch (error) {
    console.error('Error al actualizar el usuario:', error);
    next(error); // Pasar el error al middleware de manejo de errores
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   delete:
 *     summary: Elimina un usuario existente
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del usuario
 *     responses:
 *       200:
 *         description: Usuario eliminado correctamente
 *       404:
 *         description: Usuario no encontrado
 *       500:
 *         description: Error al eliminar el usuario
 */
// Ruta para eliminar un usuario
router.delete('/:id', (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;

  (async () => {
    try {
      const connection = await pool.getConnection();

      // Obtener los datos del usuario antes de eliminarlo
      const [userResult] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE id = ?',
        [id]
      );

      if (userResult.length === 0) {
        connection.release();
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      const user = userResult[0];

      // Eliminar el usuario
      const [result] = await connection.query<OkPacket>(
        'DELETE FROM users WHERE id = ?',
        [id]
      );
      connection.release();

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Usuario no encontrado' });
      }

      console.log(`Usuario eliminado: ID ${user.id}, ${user.name}, Email: ${user.email}, Rol: ${user.role}`);
      res.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
      console.error('Error al eliminar el usuario:', error);
      res.status(500).json({ message: 'Error al eliminar el usuario' });
    }
  })().catch(next);
});


export default router;