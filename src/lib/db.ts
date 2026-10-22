import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql-253dab1e-vibeswell-surf.e.aivencloud.com',
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD, // Vercel leerá la variable de entorno
  database: process.env.DB_NAME || 'defaultdb',
  port: Number(process.env.DB_PORT) || 17027,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
});

export default pool;