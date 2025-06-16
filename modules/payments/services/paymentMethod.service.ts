import pool from '../../../config/database';
import crypto from 'crypto';
import type { PaymentMethod } from '../../../shared/models/PaymentMethod';

class PaymentMethodService {
  private secret = process.env.PAYMENT_SECRET || 'supersecret';

  async saveMethod(userId: number, method: { cardNumber: string; expiry: string; cvc: string; cardName: string }) {
    const key = crypto.createHash('sha256').update(this.secret).digest();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv('aes-256-ctr', key, iv);
    const dataToEncrypt = JSON.stringify({
      cardNumber: method.cardNumber,
      expiry: method.expiry,
      cvc: method.cvc,
      cardName: method.cardName
    });
    let encrypted = cipher.update(dataToEncrypt, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const last4 = method.cardNumber.slice(-4);
    // Elimina método anterior si existe
    await pool.query('DELETE FROM payment_methods WHERE user_id = ?', [userId]);
    // Inserta el nuevo método
    await pool.query(
      'INSERT INTO payment_methods (user_id, type, encrypted_data, iv, last4) VALUES (?, ?, ?, ?, ?)', 
      [userId, 'card', encrypted, iv.toString('hex'), last4]
    );
  }

  async getMethod(userId: number): Promise<PaymentMethod | null> {
    const [rows]: any = await pool.query('SELECT * FROM payment_methods WHERE user_id = ?', [userId]);
    if (!rows || rows.length === 0) return null;
    const row = rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      type: row.type,
      encryptedData: row.encrypted_data,
      iv: row.iv,
      last4: row.last4,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async getAllMethods(page = 1, limit = 10): Promise<{ data: PaymentMethod[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows]: any = await pool.query('SELECT * FROM payment_methods LIMIT ? OFFSET ?', [limit, offset]);
    const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM payment_methods');
    const total = countRows[0]?.count || 0;
    return {
      data: rows.map((row: any) => ({
        id: row.id,
        userId: row.user_id,
        type: row.type,
        encryptedData: row.encrypted_data,
        iv: row.iv,
        last4: row.last4,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      total,
    };
  }

  async getAllMethodsWithUser(page = 1, limit = 10): Promise<{ data: any[]; total: number }> {
    const offset = (page - 1) * limit;
    const [rows]: any = await pool.query(
      `SELECT pm.*, u.name as user_name, u.email as user_email
       FROM payment_methods pm
       LEFT JOIN users u ON pm.user_id = u.id
       LIMIT ? OFFSET ?`,
      [limit, offset]
    );
    const [countRows]: any = await pool.query('SELECT COUNT(*) as count FROM payment_methods');
    const total = countRows[0]?.count || 0;
    return {
      data: rows.map((row: any) => ({
        id: row.id,
        user_id: row.user_id,
        user_name: row.user_name,
        user_email: row.user_email,
        type: row.type,
        encrypted_data: row.encrypted_data,
        iv: row.iv,
        last4: row.last4
      })),
      total,
    };
  }

  async deleteMethod(userId: number): Promise<void> {
    await pool.query('DELETE FROM payment_methods WHERE user_id = ?', [userId]);
  }
}

export default new PaymentMethodService();
