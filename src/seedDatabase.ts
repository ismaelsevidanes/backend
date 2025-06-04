import pool from '../config/database';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  const connection = await pool.getConnection();
  try {
    // Encriptar contraseñas antes de insertar
    const hashedPassword1 = await bcrypt.hash('password123', 10);
    const hashedPassword2 = await bcrypt.hash('password456', 10);

    // Insertar o actualizar datos en la tabla 'users'
    await connection.query(`
      INSERT INTO users (id, name, email, password) VALUES
      (1, 'John Doe', 'john@example.com', ?),
      (2, 'Jane Smith', 'jane@example.com', ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      password = VALUES(password);
    `, [hashedPassword1, hashedPassword2]);

    // Insertar o actualizar datos en la tabla 'fields'
    await connection.query(`
      INSERT INTO fields (id, name, type, description, address, location, price_per_hour) VALUES
      (1, 'Campo de Fútbol 1', 'futbol7', 'Campo con césped natural', 'Calle Fútbol, 123', 'Ciudad A', 50.00),
      (2, 'Campo de Fútbol 2', 'futbol11', 'Campo con césped artificial', 'Avenida Deportes, 456', 'Ciudad B', 40.00)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      type = VALUES(type),
      description = VALUES(description),
      address = VALUES(address),
      location = VALUES(location),
      price_per_hour = VALUES(price_per_hour);
    `);

    // Insertar o actualizar datos en la tabla 'reservations'
    await connection.query(`
      INSERT INTO reservations (id, field_id, start_time, end_time, total_price) VALUES
      (1, 1, '2025-05-03 10:00:00', '2025-05-03 12:00:00', 100.00),
      (2, 2, '2025-05-04 15:00:00', '2025-05-04 17:00:00', 80.00)
      ON DUPLICATE KEY UPDATE
      field_id = VALUES(field_id),
      start_time = VALUES(start_time),
      end_time = VALUES(end_time),
      total_price = VALUES(total_price);
    `);

    // Insertar o actualizar datos en la tabla 'payments'
    await connection.query(`
      INSERT INTO payments (id, reservation_id, amount, payment_method, paid_at) VALUES
      (1, 1, 100.00, 'Credit Card', '2025-05-03 12:30:00'),
      (2, 2, 80.00, 'PayPal', '2025-05-04 17:30:00')
      ON DUPLICATE KEY UPDATE
      reservation_id = VALUES(reservation_id),
      amount = VALUES(amount),
      payment_method = VALUES(payment_method),
      paid_at = VALUES(paid_at);
    `);

    console.log('Datos iniciales insertados o actualizados correctamente.');
  } catch (error) {
    console.error('Error al insertar o actualizar datos iniciales:', error);
  } finally {
    connection.release();
    await pool.end();
  }
}

seedDatabase();