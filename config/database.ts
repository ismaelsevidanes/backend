import { createPool } from 'mysql2/promise';

const databaseName = 'dreamer';

const pool = createPool({
  host: 'localhost',
  user: 'root',
  password: 'root',
  database: databaseName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+02:00', // Set timezone to Madrid (UTC+2)
});

export default pool;