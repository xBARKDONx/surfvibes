import mysql from 'mysql2/promise';

// Si process.env.DB_HOST no contiene "aivencloud.com", forzamos el host real
const hostReal = (process.env.DB_HOST && process.env.DB_HOST.includes('aivencloud.com'))
  ? process.env.DB_HOST
  : 'mysql-253dab1e-vibeswell-surf.e.aivencloud.com';

const pool = mysql.createPool({
  host: hostReal,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD, // Vercel leerá la contraseña desde sus Environment Variables
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