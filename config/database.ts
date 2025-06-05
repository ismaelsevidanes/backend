import { createPool } from 'mysql2/promise';

const databaseName = 'dreamer';

// Usa 'db' si DB_HOST es 'db' o no está definida y NO estamos en local, si no, usa 'localhost'
function getDbHost() {
  // Si estamos en Docker Compose, DB_HOST será 'db'. Si estamos en local, será 'localhost' o undefined.
  // Si DB_HOST está definida, úsala. Si no, prueba 'localhost' primero, y si falla, usa 'db'.
  if (process.env.DB_HOST) return process.env.DB_HOST;
  // Si no está definida, intentamos conectar a localhost primero (caso local)
  return 'localhost';
}

const pool = createPool({
  host: getDbHost(),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'root',
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+02:00', // Set timezone to Madrid (UTC+2)
});

export default pool;