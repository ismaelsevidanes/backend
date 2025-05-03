import { createPool } from 'mysql2/promise';

const pool = createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: 'futbol_rentals',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+02:00', // Set timezone to Madrid (UTC+2)
});

export default pool;