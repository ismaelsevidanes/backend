import mysql from 'mysql2/promise';
import pool from '../config/database';

async function initializeDatabase() {
  try {
    // Crear la base de datos si no existe
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: 'root',
    });
    await connection.query('CREATE DATABASE IF NOT EXISTS dreamer');
    console.log('Base de datos creada o ya existente.');
    await connection.end();

    // Crear tablas
    const dbConnection = await pool.getConnection();
    try {
      // Crear tabla 'users' con la columna 'role' incluida después de 'password'
      await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      // Crear tabla 'fields'
      await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS fields (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type ENUM('futbol7', 'futbol11') NOT NULL,
          description TEXT,
          address VARCHAR(255),
          location VARCHAR(255),
          price_per_hour DECIMAL(8, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        );
      `);

      // Crear tabla 'reservations'
      await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS reservations (
          id INT AUTO_INCREMENT PRIMARY KEY,
          field_id INT NOT NULL,
          start_time TIMESTAMP NOT NULL,
          end_time TIMESTAMP NOT NULL,
          total_price DECIMAL(8, 2) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (field_id) REFERENCES fields(id) ON DELETE CASCADE
        );
      `);

      // Crear tabla 'payments'
      await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          reservation_id INT NOT NULL,
          amount DECIMAL(8, 2) NOT NULL,
          payment_method VARCHAR(255) NOT NULL,
          paid_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE
        );
      `);

      // Crear tabla 'reservation_users' (relación muchos a muchos)
      await dbConnection.query(`
        CREATE TABLE IF NOT EXISTS reservation_users (
          reservation_id INT NOT NULL,
          user_id INT NOT NULL,
          PRIMARY KEY (reservation_id, user_id),
          FOREIGN KEY (reservation_id) REFERENCES reservations(id) ON DELETE CASCADE,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      console.log('Tablas creadas correctamente.');
    } catch (error) {
      console.error('Error al crear las tablas:', error);
    } finally {
      dbConnection.release();
    }

    // Cerrar el pool de conexiones
    await pool.end();
    console.log('Conexión cerrada.');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
  }
}

initializeDatabase();