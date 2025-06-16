import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import paymentMethodService from '../services/paymentMethod.service';
import { requireAdmin } from '../../../src/middlewares/authMiddleware';

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
 *                 pattern: "^\\d{4} \\d{4} \\d{4} \\d{4}$"
 *                 example: '1234 5678 9012 3456'
 *               expiry:
 *                 type: string
 *                 pattern: "^(0[1-9]|1[0-2])\\/\\d{2}$"
 *                 example: '08/25'
 *               cvc:
 *                 type: string
 *                 pattern: "^\\d{3}$"
 *                 example: '123'
 *               cardName:
 *                 type: string
 *                 example: 'Nombre y Apellidos Completos'
 *     responses:
 *       200:
 *         description: Método guardado correctamente
 *       400:
 *         description: Faltan datos o validación incorrecta
 *   get:
 *     summary: Obtiene el método de pago guardado del usuario autenticado o de cualquier usuario (admin)
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: "Solo admin: ver método de pago de otro usuario"
 *     responses:
 *       200:
 *         description: Método de pago encontrado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: No hay método guardado
 *   delete:
 *     summary: Elimina el método de pago guardado del usuario autenticado o de cualquier usuario (admin)
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *         description: "Solo admin: eliminar método de pago de otro usuario"
 *     responses:
 *       200:
 *         description: Método de pago eliminado
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Prohibido
 *       404:
 *         description: No hay método guardado
 */
// Guardar método de pago
router.post('/',
  [
    body('cardNumber')
      .matches(/^\d{4} \d{4} \d{4} \d{4}$/)
      .withMessage('El número de tarjeta debe tener el formato 1234 5678 9012 3456'),
    body('expiry').matches(/^(0[1-9]|1[0-2])\/\d{2}$/).withMessage('Fecha de expiración inválida (MM/YY)'),
    body('cvc').isLength({ min: 3, max: 3 }).withMessage('El CVC debe tener exactamente 3 dígitos').matches(/^\d{3}$/).withMessage('El CVC debe ser numérico de 3 dígitos'),
    body('cardName').notEmpty().withMessage('El nombre de la tarjeta es obligatorio'),
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
      return;
    }
    const userId = getUserId(req);
    if (!userId) { res.status(401).json({ message: 'No autorizado' }); return; }
    const { cardNumber, expiry, cvc, cardName } = req.body;
    if (!cardNumber || !expiry || !cvc || !cardName) {
      res.status(400).json({ message: 'Faltan datos' }); return;
    }
    try {
      await paymentMethodService.saveMethod(userId, { cardNumber, expiry, cvc, cardName });
      res.json({ message: 'Método de pago guardado correctamente' });
    } catch (error) {
      res.status(500).json({ message: 'Error al guardar el método de pago', error });
    }
  }
);
// Obtener método de pago guardado (admin puede ver de cualquier usuario)
router.get('/', async (req: Request, res: Response) => {
  const userJwt = (req as any).user;
  let userId = getUserId(req);
  if (userJwt && userJwt.role === 'admin' && req.query.userId) {
    userId = parseInt(req.query.userId as string, 10);
  }
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return; }
  if (userJwt.role !== 'admin' && req.query.userId) {
    res.status(403).json({ message: 'Prohibido' }); return;
  }
  try {
    const method = await paymentMethodService.getMethod(userId);
    if (!method) { res.status(404).json({ message: 'No hay método guardado' }); return; }
    res.json(method);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el método de pago', error });
  }
});
// Eliminar método de pago guardado (admin puede eliminar de cualquier usuario)
router.delete('/', async (req: Request, res: Response) => {
  const userJwt = (req as any).user;
  let userId = getUserId(req);
  if (userJwt && userJwt.role === 'admin' && req.query.userId) {
    userId = parseInt(req.query.userId as string, 10);
  }
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return; }
  if (userJwt.role !== 'admin' && req.query.userId) {
    res.status(403).json({ message: 'Prohibido' }); return;
  }
  try {
    await paymentMethodService.deleteMethod(userId);
    res.json({ message: 'Método de pago eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el método de pago', error });
  }
});

export default router;
