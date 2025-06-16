import { Router, Request, Response, NextFunction } from 'express';
import paymentMethodService from '../services/paymentMethod.service';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../../../src/middlewares/authMiddleware';

const router = Router();

function getUserId(req: Request): number | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    const token = auth.split(' ')[1];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.id;
  } catch {
    return null;
  }
}
function getUserRole(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth) return null;
  try {
    const token = auth.split(' ')[1];
    const payload = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
    return payload.role;
  } catch {
    return null;
  }
}

// Validaciones para método de pago
const paymentValidations = [
  body('cardNumber')
    .isString()
    .matches(/^[0-9]{16}$/)
    .withMessage('Número de tarjeta inválido (16 dígitos)'),
  body('expiry')
    .isString()
    .matches(/^(0[1-9]|1[0-2])\/(\d{2})$/)
    .withMessage('Fecha de expiración inválida (MM/AA)'),
  body('cvc')
    .isString()
    .matches(/^\d{3}$/)
    .withMessage('CVC inválido (3 dígitos)'),
  body('cardName')
    .isString()
    .isLength({ min: 5, max: 60 })
    .withMessage('Nombre del titular entre 5 y 60 caracteres'),
  (req: Request, res: Response, next: NextFunction) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    next();
  }
];

/**
 * @swagger
 * tags:
 *   name: PaymentMethod
 *   description: Endpoints Relacionados con el metodo de pago (asociado al usuario autenticado)
 */
/**
 * @swagger
 * /api/payments/method:
 *   post:
 *     summary: Guarda el método de pago del usuario autenticado (encriptado)
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - cardNumber
 *               - expiry
 *               - cvc
 *               - cardName
 *             properties:
 *               cardNumber:
 *                 type: string
 *                 example: '1234567890123456'
 *                 pattern: '^[0-9]{16}$'
 *               expiry:
 *                 type: string
 *                 example: '08/25'
 *                 pattern: '^(0[1-9]|1[0-2])/(\\d{2})$'
 *               cvc:
 *                 type: string
 *                 example: '123'
 *                 pattern: '^\\d{3}$'
 *               cardName:
 *                 type: string
 *                 example: 'Nombre y Apellidos Completos'
 *                 minLength: 5
 *                 maxLength: 60
 *     responses:
 *       200:
 *         description: Método guardado correctamente
 *       400:
 *         description: Faltan datos o datos inválidos
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       500:
 *         description: Error al guardar el método de pago
 *   get:
 *     summary: Obtiene el método de pago guardado del usuario autenticado
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Solo admin, consultar método de otro usuario
 *     responses:
 *       200:
 *         description: Método de pago encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: No hay método guardado
 *       500:
 *         description: Error al obtener el método de pago
 *   delete:
 *     summary: Elimina el método de pago guardado del usuario autenticado
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Solo admin, eliminar método de otro usuario
 *     responses:
 *       200:
 *         description: Método de pago eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 *       404:
 *         description: No hay método guardado
 *       500:
 *         description: Error al eliminar el método de pago
 */

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// Guardar método de pago
router.post('/', paymentValidations, async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return; }
  const { cardNumber, expiry, cvc, cardName } = req.body;
  try {
    await paymentMethodService.saveMethod(userId, { cardNumber, expiry, cvc, cardName });
    res.json({ message: 'Método de pago guardado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al guardar el método de pago', error });
  }
});

// Obtener método de pago guardado (solo el usuario dueño o admin)
router.get('/', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  const role = getUserRole(req);
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return; }
  // Si es admin puede pasar un ?userId=... para consultar otro usuario
  let targetUserId = userId;
  if (role === 'admin' && req.query.userId) {
    targetUserId = Number(req.query.userId);
  }
  if (role !== 'admin' && req.query.userId && Number(req.query.userId) !== userId) {
    res.status(403).json({ message: 'Acceso denegado' }); return;
  }
  try {
    const method = await paymentMethodService.getMethod(targetUserId);
    if (!method) { res.status(404).json({ message: 'No hay método guardado' }); return; }
    res.json(method);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el método de pago', error });
  }
});

// Eliminar método de pago (solo admin o el usuario dueño)
router.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  const userId = getUserId(req);
  const role = getUserRole(req);
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return; }
  // Si es admin puede pasar ?userId=... para borrar otro usuario
  let targetUserId = userId;
  if (role === 'admin' && req.query.userId) {
    targetUserId = Number(req.query.userId);
  }
  if (role !== 'admin' && req.query.userId && Number(req.query.userId) !== userId) {
    res.status(403).json({ message: 'Acceso denegado' }); return;
  }
  try {
    await paymentMethodService.deleteMethod(targetUserId);
    res.json({ message: 'Método de pago eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el método de pago', error });
  }
});

export default router;
