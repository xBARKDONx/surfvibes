import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'mysql-253dab1e-vibeswell-surf.e.aivencloud.com',
  user: 'avnadmin',
  password: process.env.DB_PASSWORD || 'AVNS_9-HNCCE7Rn5xU7nmEgD',
  database: 'defaultdb',
  port: 17027,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;