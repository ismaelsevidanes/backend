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
      (1, 'hola', 'hola@dreamer.com', ?),
      (2, 'hola', 'hola@prueba.com', ?)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      password = VALUES(password);
    `, [hashedPassword1, hashedPassword2]);

    // Insertar o actualizar datos en la tabla 'fields'
    await connection.query(`
      INSERT INTO fields (id, name, type, description, address, location, price_per_hour, images) VALUES
      (1, 'Estadio Guadiamar (Benacazón CF)', 'futbol11', 'Campo de césped artificial', 'Avenida San Sebastián, s/n, 41805', 'Benacazón, Sevilla', 40.00, JSON_ARRAY('/images/benacazon-entrada.jpg', '/images/benacazon-aerea.jpg', '/images/benacazon-3.jpg', '/images/benacazon-4.jpg')),
      (2, 'Estadio Municipal de Umbrete (Umbrete CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41806', 'Umbrete, Sevilla', 40.00, NULL),
      (3, 'Estadio Nuevo San José (Espartinas CF)', 'futbol11', 'Campo de césped artificial', 'Calle Camino de Mejina, s/n, 41807', 'Espartinas, Sevilla', 45.00, NULL),
      (4, 'Estadio Manuel Utrilla (Gines CF)', 'futbol11', 'Campo de césped artificial', 'Calle Manuel Canela, s/n, 41960', 'Gines, Sevilla', 45.00, NULL),
      (5, 'Estadio Antonio Almendro (Castilleja CF)', 'futbol11', 'Campo de césped artificial', 'Calle Real, s/n, 41950', 'Castilleja de la Cuesta, Sevilla', 45.00, NULL),
      (6, 'Estadio Rafael Beca (Bormujos CF)', 'futbol11', 'Campo de césped artificial', 'Calle Almijara, s/n, 41930', 'Bormujos, Sevilla', 40.00, NULL),
      (7, 'Estadio Isidro Reguera (Camas CF)', 'futbol11', 'Campo de césped artificial', 'Calle Santa María de Gracia, s/n, 41900', 'Camas, Sevilla', 45.00, NULL),
      (8, 'Estadio Guadalquivir (Coria CF)', 'futbol11', 'Campo de césped artificial', 'Calle Doctor Fleming, s/n, 41100', 'Coria del Río, Sevilla', 50.00, NULL),
      (9, 'Estadio Virgen de los Reyes (Pilas CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41840', 'Pilas, Sevilla', 40.00, NULL),
      (10, 'Estadio Nuestra Señora de las Nieves (Sanlúcar CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41800', 'Sanlúcar la Mayor, Sevilla', 45.00, NULL),
      (11, 'Estadio de Fútbol Las Colonias (Olivares CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41804', 'Olivares, Sevilla', 40.00, NULL),
      (12, 'Estadio Las Portadas (Salteras CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41909', 'Salteras, Sevilla', 40.00, NULL),
      (13, 'Estadio Nuevo Valencina (Valencina CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41907', 'Valencina de la Concepción, Sevilla', 40.00, NULL),
      (14, 'Estadio Municipal de Bollullos de la Mitación (Bollullos CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41110', 'Bollullos de la Mitación, Sevilla', 40.00, NULL),
      (15, 'Estadio Municipal de Aznalcázar (Aznalcázar CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41849', 'Aznalcázar, Sevilla', 40.00, NULL),
      (16, 'Estadio Municipal de Gelves (Gelves CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41120', 'Gelves, Sevilla', 40.00, NULL),
      (17, 'Estadio Municipal de Palomares del Río (Palomares CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41928', 'Palomares del Río, Sevilla', 40.00, NULL),
      (18, 'Estadio Municipal de Santiponce (Santiponce CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41970', 'Santiponce, Sevilla', 40.00, NULL),
      (19, 'Estadio Municipal de Villanueva del Ariscal (Villanueva CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41808', 'Villanueva del Ariscal, Sevilla', 40.00, NULL),
      (20, 'Estadio Municipal Rafael Beca (Carrión CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41820', 'Carrión de los Céspedes, Sevilla', 40.00, NULL),
      (21, 'Estadio Municipal de Castilleja de Guzmán (Castilleja de Guzmán CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41908', 'Castilleja de Guzmán, Sevilla', 40.00, NULL),
      (22, 'Estadio Municipal de Almensilla (Almensilla CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41111', 'Almensilla, Sevilla', 40.00, JSON_ARRAY('/images/benacazon-entrada.jpg', '/images/benacazon-aerea.jpg', '/images/benacazon-3.jpg', '/images/benacazon-4.jpg')),
      (23, 'Estadio Municipal de Isla Mayor (Isla Mayor CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41140', 'Isla Mayor, Sevilla', 40.00, NULL),
      (24, 'Estadio Municipal de Huévar (Huévar CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41830', 'Huévar del Aljarafe, Sevilla', 40.00, NULL),
      (25, 'Estadio Primero de Mayo (San Juan CF)', 'futbol11', 'Campo de césped artificial', 'Calle 28 de Febrero, s/n, 41920', 'San Juan de Aznalfarache, Sevilla', 45.00, NULL),
      (26, 'Estadio Municipal de Albaida del Aljarafe (Albaida Atlético)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41809', 'Albaida del Aljarafe, Sevilla', 40.00, NULL),
      (27, 'Estadio Municipal de Gines (Gines Atlético)', 'futbol7', 'Campo de césped artificial', 'Calle Manuel Canela, s/n, 41960', 'Gines, Sevilla', 40.00, NULL)
      ON DUPLICATE KEY UPDATE
      name = VALUES(name),
      type = VALUES(type),
      description = VALUES(description),
      address = VALUES(address),
      location = VALUES(location),
      price_per_hour = VALUES(price_per_hour),
      images = VALUES(images);
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

    // Insertar usuarios asociados a reservas (tabla intermedia)
    await connection.query(`
      INSERT INTO reservation_users (reservation_id, user_id) VALUES
      (1, 1),
      (1, 2),
      (2, 2)
      ON DUPLICATE KEY UPDATE user_id = VALUES(user_id);
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