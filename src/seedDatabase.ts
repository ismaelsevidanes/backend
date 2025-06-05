import pool from '../config/database';
import bcrypt from 'bcrypt';

async function seedDatabase() {
  const connection = await pool.getConnection();
  try {
    // Encriptar contraseñas antes de insertar
    const hashedPassword1 = await bcrypt.hash('123password', 10);
    const hashedPassword2 = await bcrypt.hash('123password', 10);

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
      (1, 'Estadio Municipal Guadiamar (Benacazón CF)', 'futbol11', 'Campo de césped artificial', 'Avenida San Sebastián, s/n, 41805', 'Benacazón, Sevilla', 40.00, JSON_ARRAY('/images/equipos/benacazon/benacazon-logo.jpg', '/images/equipos/benacazon/benacazon-campo.jpg', '/images/equipos/benacazon/benacazon-campo2.jpg', '/images/equipos/benacazon/benacazon-vestuario.jpg')),
      (2, 'Ciudad deportiva Manuel Ruiz Vargas (Umbrete CF)', 'futbol11', 'Campo de césped artificial', 'C. Fernando Rodríguez Ávila, 19M, 41806', 'Umbrete, Sevilla', 40.00, JSON_ARRAY('/images/equipos/umbrete/umbrete-logo.jpg', '/images/equipos/umbrete/umbrete-campo.jpg', '/images/equipos/umbrete/umbrete-campo2.jpg', '/images/equipos/umbrete/umbrete-vestuario.jpg')),
      (3, 'Estadio Nuevo San José (Espartinas CF)', 'futbol11', 'Campo de césped artificial', 'Calle Camino de Mejina, s/n, 41807', 'Espartinas, Sevilla', 45.00, JSON_ARRAY('/images/equipos/espartinas/espartinas-logo.jpg', '/images/equipos/espartinas/espartinas-campo.jpg', '/images/equipos/espartinas/espartinas-campo2.jpg', '/images/equipos/espartinas/espartinas-vestuario.jpg')),
      (4, 'Estadio Manuel Utrilla (Gines CF)', 'futbol11', 'Campo de césped artificial', 'Calle Manuel Canela, s/n, 41960', 'Gines, Sevilla', 45.00, JSON_ARRAY('/images/equipos/gines/gines-logo.jpg', '/images/equipos/gines/gines-campo.jpg', '/images/equipos/gines/gines-campo2.jpg', '/images/equipos/gines/gines-vestuario.jpg')),
      (5, 'Estadio Antonio Almendro (Castilleja CF)', 'futbol11', 'Campo de césped artificial', 'Calle Real, s/n, 41950', 'Castilleja de la Cuesta, Sevilla', 45.00, JSON_ARRAY('/images/equipos/castilleja/castilleja-logo.jpg', '/images/equipos/castilleja/castilleja-campo.jpg', '/images/equipos/castilleja/castilleja-campo2.jpg', '/images/equipos/castilleja/castilleja-vestuario.jpg')),
      (6, 'Estadio Rafael Beca (Bormujos CF)', 'futbol11', 'Campo de césped artificial', 'Calle Almijara, s/n, 41930', 'Bormujos, Sevilla', 40.00, JSON_ARRAY('/images/equipos/bormujos/bormujos-logo.jpg', '/images/equipos/bormujos/bormujos-campo.jpg', '/images/equipos/bormujos/bormujos-campo2.jpg', '/images/equipos/bormujos/bormujos-vestuario.jpg')),
      (7, 'Estadio Isidro Reguera (Camas CF)', 'futbol11', 'Campo de césped artificial', 'Calle Santa María de Gracia, s/n, 41900', 'Camas, Sevilla', 45.00, JSON_ARRAY('/images/equipos/camas/camas-logo.jpg', '/images/equipos/camas/camas-campo.jpg', '/images/equipos/camas/camas-campo2.jpg', '/images/equipos/camas/camas-vestuario.jpg')),
      (8, 'Estadio Guadalquivir (Coria CF)', 'futbol11', 'Campo de césped artificial', 'Calle Doctor Fleming, s/n, 41100', 'Coria del Río, Sevilla', 50.00, JSON_ARRAY('/images/equipos/coria/coria-logo.jpg', '/images/equipos/coria/coria-campo.jpg', '/images/equipos/coria/coria-campo2.jpg', '/images/equipos/coria/coria-vestuario.jpg')),
      (9, 'Estadio Virgen de los Reyes (Pilas CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41840', 'Pilas, Sevilla', 40.00, JSON_ARRAY('/images/equipos/pilas/pilas-logo.jpg', '/images/equipos/pilas/pilas-campo.jpg', '/images/equipos/pilas/pilas-campo2.jpg', '/images/equipos/pilas/pilas-vestuario.jpg')),
      (10, 'Estadio Nuestra Señora de las Nieves (Sanlúcar CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41800', 'Sanlúcar la Mayor, Sevilla', 45.00, JSON_ARRAY('/images/equipos/sanlucar/sanlucar-logo.jpg', '/images/equipos/sanlucar/sanlucar-campo.jpg', '/images/equipos/sanlucar/sanlucar-campo2.jpg', '/images/equipos/sanlucar/sanlucar-vestuario.jpg')),
      (11, 'Estadio de Fútbol Las Colonias (Olivares CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41804', 'Olivares, Sevilla', 40.00, JSON_ARRAY('/images/equipos/olivares/olivares-logo.jpg', '/images/equipos/olivares/olivares-campo.jpg', '/images/equipos/olivares/olivares-campo2.jpg', '/images/equipos/olivares/olivares-vestuario.jpg')),
      (12, 'Estadio Las Portadas (Salteras CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41909', 'Salteras, Sevilla', 40.00, JSON_ARRAY('/images/equipos/salteras/salteras-logo.jpg', '/images/equipos/salteras/salteras-campo.jpg', '/images/equipos/salteras/salteras-campo2.jpg', '/images/equipos/salteras/salteras-vestuario.jpg')),
      (13, 'Estadio Nuevo Valencina (Valencina CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41907', 'Valencina de la Concepción, Sevilla', 40.00, JSON_ARRAY('/images/equipos/valencina/valencina-logo.jpg', '/images/equipos/valencina/valencina-campo.jpg', '/images/equipos/valencina/valencina-campo2.jpg', '/images/equipos/valencina/valencina-vestuario.jpg')),
      (14, 'Estadio Municipal de Bollullos de la Mitación (Bollullos CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41110', 'Bollullos de la Mitación, Sevilla', 40.00, JSON_ARRAY('/images/equipos/bollullos/bollullos-logo.jpg', '/images/equipos/bollullos/bollullos-campo.jpg', '/images/equipos/bollullos/bollullos-campo2.jpg', '/images/equipos/bollullos/bollullos-vestuario.jpg')),
      (15, 'Estadio Municipal de Aznalcázar (Aznalcázar CF)', 'futbol11', 'Campo de césped artificial', 'Calle Estadio, s/n, 41849', 'Aznalcázar, Sevilla', 40.00, JSON_ARRAY('/images/equipos/aznalcazar/aznalcazar-logo.jpg', '/images/equipos/aznalcazar/aznalcazar-campo.jpg', '/images/equipos/aznalcazar/aznalcazar-campo2.jpg', '/images/equipos/aznalcazar/aznalcazar-vestuario.jpg')),
      (16, 'Estadio Municipal de Gelves (Gelves CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41120', 'Gelves, Sevilla', 40.00, JSON_ARRAY('/images/equipos/gelves/gelves-logo.jpg', '/images/equipos/gelves/gelves-campo.jpg', '/images/equipos/gelves/gelves-campo2.jpg', '/images/equipos/gelves/gelves-vestuario.jpg')),
      (17, 'Estadio Municipal de Palomares del Río (Palomares CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41928', 'Palomares del Río, Sevilla', 40.00, JSON_ARRAY('/images/equipos/palomares/palomares-logo.jpg', '/images/equipos/palomares/palomares-campo.jpg', '/images/equipos/palomares/palomares-campo2.jpg', '/images/equipos/palomares/palomares-vestuario.jpg')),
      (18, 'Estadio Municipal de Santiponce (Santiponce CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41970', 'Santiponce, Sevilla', 40.00, JSON_ARRAY('/images/equipos/santiponce/santiponce-logo.jpg', '/images/equipos/santiponce/santiponce-campo.jpg', '/images/equipos/santiponce/santiponce-campo2.jpg', '/images/equipos/santiponce/santiponce-vestuario.jpg')),
      (19, 'Estadio Municipal de Villanueva del Ariscal (Villanueva CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41808', 'Villanueva del Ariscal, Sevilla', 40.00, JSON_ARRAY('/images/equipos/villanueva/villanueva-logo.jpg', '/images/equipos/villanueva/villanueva-campo.jpg', '/images/equipos/villanueva/villanueva-campo2.jpg', '/images/equipos/villanueva/villanueva-vestuario.jpg')),
      (20, 'Estadio Municipal Rafael Beca (Carrión CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41820', 'Carrión de los Céspedes, Sevilla', 40.00, JSON_ARRAY('/images/equipos/carrion/carrion-logo.jpg', '/images/equipos/carrion/carrion-campo.jpg', '/images/equipos/carrion/carrion-campo2.jpg', '/images/equipos/carrion/carrion-vestuario.jpg')),
      (21, 'Estadio Municipal de Castilleja de Guzmán (Castilleja de Guzmán CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41908', 'Castilleja de Guzmán, Sevilla', 40.00, JSON_ARRAY('/images/equipos/castilleja-guzman/castilleja-guzman-logo.jpg', '/images/equipos/castilleja-guzman/castilleja-guzman-campo.jpg', '/images/equipos/castilleja-guzman/castilleja-guzman-campo2.jpg', '/images/equipos/castilleja-guzman/castilleja-guzman-vestuario.jpg')),
      (22, 'Estadio Municipal de Almensilla (Almensilla CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41111', 'Almensilla, Sevilla', 40.00, JSON_ARRAY('/images/equipos/almensilla/almensilla-logo.jpg', '/images/equipos/almensilla/almensilla-campo.jpg', '/images/equipos/almensilla/almensilla-campo2.jpg', '/images/equipos/almensilla/almensilla-vestuario.jpg')),
      (23, 'Estadio Municipal de Isla Mayor (Isla Mayor CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41140', 'Isla Mayor, Sevilla', 40.00, JSON_ARRAY('/images/equipos/islamayor/islamayor-logo.jpg', '/images/equipos/islamayor/islamayor-campo.jpg', '/images/equipos/islamayor/islamayor-campo2.jpg', '/images/equipos/islamayor/islamayor-vestuario.jpg')),
      (24, 'Estadio Municipal de Huévar (Huévar CF)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41830', 'Huévar del Aljarafe, Sevilla', 40.00, JSON_ARRAY('/images/equipos/huevar/huevar-logo.jpg', '/images/equipos/huevar/huevar-campo.jpg', '/images/equipos/huevar/huevar-campo2.jpg', '/images/equipos/huevar/huevar-vestuario.jpg')),
      (25, 'Estadio Primero de Mayo (San Juan CF)', 'futbol11', 'Campo de césped artificial', 'Calle 28 de Febrero, s/n, 41920', 'San Juan de Aznalfarache, Sevilla', 45.00, JSON_ARRAY('/images/equipos/sanjuan/sanjuan-logo.jpg', '/images/equipos/sanjuan/sanjuan-campo.jpg', '/images/equipos/sanjuan/sanjuan-campo2.jpg', '/images/equipos/sanjuan/sanjuan-vestuario.jpg')),
      (26, 'Estadio Municipal de Albaida del Aljarafe (Albaida Atlético)', 'futbol7', 'Campo de césped artificial', 'Calle Estadio, s/n, 41809', 'Albaida del Aljarafe, Sevilla', 40.00, JSON_ARRAY('/images/equipos/albaida/albaida-logo.jpg', '/images/equipos/albaida/albaida-campo.jpg', '/images/equipos/albaida/albaida-campo2.jpg', '/images/equipos/albaida/albaida-vestuario.jpg')),
      (27, 'Estadio Municipal de Gines (Gines Atlético)', 'futbol7', 'Campo de césped artificial', 'Calle Manuel Canela, s/n, 41960', 'Gines, Sevilla', 40.00, JSON_ARRAY('/images/equipos/ginesatletico/ginesatletico-logo.jpg', '/images/equipos/ginesatletico/ginesatletico-campo.jpg', '/images/equipos/ginesatletico/ginesatletico-campo2.jpg', '/images/equipos/ginesatletico/ginesatletico-vestuario.jpg'))
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