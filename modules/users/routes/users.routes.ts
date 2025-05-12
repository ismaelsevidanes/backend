import express, { Request, Response, NextFunction } from 'express';
import { authenticateToken } from '../../../src/middlewares/authMiddleware';
import pool from '../../../config/database';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';
import { RowDataPacket, OkPacket } from 'mysql2';
import bcrypt from 'bcrypt';
import { body, validationResult } from 'express-validator';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: Endpoints relacionados con la gestión de usuarios
 */

// Proteger las rutas de usuarios con el middleware de autenticación
router.use(authenticateToken);

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

      // Determinar el rol basado en el dominio del correo electrónico
      const roleFromEmail = email.endsWith('@dreamer.com') ? 'admin' : 'user';

      // Usar el rol proporcionado en el cuerpo de la solicitud o asignar automáticamente
      const finalRole = role || roleFromEmail;

      const [result] = await connection.query<OkPacket>(
        `UPDATE users 
         SET name = ?, email = ?, password = COALESCE(?, password), role = ? 
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