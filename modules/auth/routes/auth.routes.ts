import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../../../config/database'; // Corrigiendo la ruta de importación
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Clave secreta para JWT
const JWT_SECRET = 'your_jwt_secret_key';

/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: Endpoints relacionados con la autenticación de usuarios
 */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Registra un nuevo usuario
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Nombre del usuario
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       201:
 *         description: Usuario registrado correctamente
 *       400:
 *         description: Error en la validación o el correo ya está en uso
 *       500:
 *         description: Error al registrar el usuario
 */

// Endpoint para registrar usuarios
router.post(
  '/register',
  [
    body('name').notEmpty().withMessage('El nombre es obligatorio'),
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { name, email, password } = req.body;

    try {
      const connection = await pool.getConnection();

      // Verificar si el correo ya existe
      const [existingUser] = await connection.query<RowDataPacket[]>(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        res.status(400).json({ message: 'El correo ya está en uso' });
        connection.release();
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      // Asignar siempre el rol 'user' al registrar
      const role = 'user';

      await connection.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        [name, email, hashedPassword, role]
      );
      connection.release();

      console.log(`Usuario registrado: ${name}, Email: ${email}, Rol: ${role}`); // Log para confirmar el registro

      // Modificar la respuesta del registro para incluir el rol del usuario
      res.status(201).json({ message: 'Usuario registrado correctamente', role });
    } catch (error) {
      console.error('Error al registrar el usuario:', error);

      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';

      res.status(500).json({ message: 'Error al registrar el usuario', error: errorMessage });
    }
  }
);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Inicia sesión con un usuario existente
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: Correo electrónico del usuario
 *               password:
 *                 type: string
 *                 description: Contraseña del usuario
 *     responses:
 *       200:
 *         description: Inicio de sesión exitoso
 *       400:
 *         description: Error en la validación
 *       401:
 *         description: Credenciales inválidas
 *       500:
 *         description: Error al iniciar sesión
 */

// Endpoint para iniciar sesión
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Debe ser un email válido'),
    body('password').notEmpty().withMessage('La contraseña es obligatoria'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      const connection = await pool.getConnection();
      const [rows] = await connection.query<RowDataPacket[]>('SELECT * FROM users WHERE email = ?', [email]);
      connection.release();

      if (rows.length === 0) {
        res.status(401).json({ message: 'Credenciales inválidas' });
        return;
      }

      const user = rows[0];
      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        res.status(401).json({ message: 'Credenciales inválidas' });
        return;
      }

      // Incluir el nombre y email en el token JWT
      const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '1h' });

      console.log(`Usuario logueado: ${email}, Rol: ${user.role}`); // Log para confirmar el inicio de sesión con rol

      res.json({ token, role: user.role });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error al iniciar sesión' });
    }
  }
);

export default router;