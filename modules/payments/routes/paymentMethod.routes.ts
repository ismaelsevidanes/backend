import { Router, Request, Response } from 'express';
import paymentMethodService from '../services/paymentMethod.service';

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
 * 
 * 
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
 *             properties:
 *               cardNumber:
 *                 type: string
 *                 example: '1234567890123456'
 *               expiry:
 *                 type: string
 *                 example: '08/25'
 *               cvc:
 *                 type: string
 *                 example: '123'
 *               cardName:
 *                 type: string
 *                 example: 'Nombre y Apellidos Completos'
 *     responses:
 *       200:
 *         description: Método guardado correctamente
 *       400:
 *         description: Faltan datos
 *   get:
 *     summary: Obtiene el método de pago guardado del usuario autenticado
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Método de pago encontrado
 *       404:
 *         description: No hay método guardado
 *   delete:
 *     summary: Elimina el método de pago guardado del usuario autenticado
 *     tags: [PaymentMethod]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Método de pago eliminado
 *       404:
 *         description: No hay método guardado
 */

// Guardar método de pago
router.post('/method', async (req: Request, res: Response) => {
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
});

// Obtener método de pago guardado
router.get('/method', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return; }
  try {
    const method = await paymentMethodService.getMethod(userId);
    if (!method) { res.status(404).json({ message: 'No hay método guardado' }); return; }
    res.json(method);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el método de pago', error });
  }
});

// Eliminar método de pago guardado
router.delete('/method', async (req: Request, res: Response) => {
  const userId = getUserId(req);
  if (!userId) { res.status(401).json({ message: 'No autorizado' }); return; }
  try {
    await paymentMethodService.deleteMethod(userId);
    res.json({ message: 'Método de pago eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el método de pago', error });
  }
});

export default router;
