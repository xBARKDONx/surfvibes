import { NextResponse } from 'next/server';
import pool from '../../../src/lib/db';

export async function GET() {
  try {
    // 1. Obtener la última caja registrada (independientemente de la hora exacta de la zona horaria)
    let cajaHoy = null;
    try {
      const [cajaRows]: any = await pool.query(
        'SELECT * FROM caja ORDER BY fecha DESC, id DESC LIMIT 1'
      );
      if (cajaRows && cajaRows.length > 0) {
        cajaHoy = cajaRows[0];
      }
    } catch (e) {
      console.error('Error al consultar caja en dashboard:', e);
    }

    // 2. Estado de Tablas
    let tablasStats = { total: 0, disponibles: 0, rentadas: 0, mantenimiento: 0 };
    try {
      const [rows]: any = await pool.query(`
        SELECT 
          COUNT(*) as total,
          SUM(CASE WHEN estado = 'Disponible' THEN 1 ELSE 0 END) as disponibles,
          SUM(CASE WHEN estado = 'Rentada' THEN 1 ELSE 0 END) as rentadas,
          SUM(CASE WHEN estado = 'Mantenimiento' THEN 1 ELSE 0 END) as mantenimiento
        FROM tablas
      `);
      if (rows && rows[0]) {
        tablasStats = {
          total: Number(rows[0].total || 0),
          disponibles: Number(rows[0].disponibles || 0),
          rentadas: Number(rows[0].rentadas || 0),
          mantenimiento: Number(rows[0].mantenimiento || 0),
        };
      }
    } catch (e) {
      console.error('Error al consultar tablas en dashboard:', e);
    }

    // 3. Rentas Activas
    let rentasActivasCount = 0;
    try {
      const [rows]: any = await pool.query(
        "SELECT COUNT(*) as activas FROM rentas WHERE estado = 'Activa'"
      );
      if (rows && rows[0]) {
        rentasActivasCount = Number(rows[0].activas || 0);
      }
    } catch (e) {
      console.error('Error al consultar rentas en dashboard:', e);
    }

    // 4. Clases Programadas
    let clasesPendientesCount = 0;
    try {
      const [rows]: any = await pool.query(
        "SELECT COUNT(*) as pendientes FROM clases WHERE estado = 'Programada'"
      );
      if (rows && rows[0]) {
        clasesPendientesCount = Number(rows[0].pendientes || 0);
      }
    } catch (e) {
      console.error('Error al consultar clases en dashboard:', e);
    }

    // 5. Últimas 5 transacciones (usando LEFT JOIN para evitar fallos si no hay caja asociada)
    let ultimasTransacciones: any[] = [];
    try {
      const [rows]: any = await pool.query(`
        SELECT t.*, c.fecha 
        FROM transacciones t
        LEFT JOIN caja c ON t.caja_id = c.id
        ORDER BY t.id DESC 
        LIMIT 5
      `);
      if (rows) {
        ultimasTransacciones = rows;
      }
    } catch (e) {
      console.error('Error al consultar transacciones en dashboard:', e);
    }

    return NextResponse.json({
      success: true,
      data: {
        caja: cajaHoy,
        tablas: tablasStats,
        rentasActivas: rentasActivasCount,
        clasesPendientes: clasesPendientesCount,
        ultimasTransacciones,
      },
    });
  } catch (error: any) {
    console.error('Error critico en Dashboard API:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error en el servidor' },
      { status: 500 }
    );
  }
}