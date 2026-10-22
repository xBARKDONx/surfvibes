import pool from '../../../lib/db'; // Importación directa por ruta relativa
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rows] = await pool.query("SELECT * FROM caja WHERE estado = 'Abierta' ORDER BY id DESC LIMIT 1");
    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error('Error en GET /api/caja:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accion, monto_inicio } = body;
    const hoy = new Date().toISOString().split('T')[0];

    if (accion === 'ABRIR' || !accion) {
      const monto = parseFloat(monto_inicio) || 250.00;

      const [result] = await pool.query(
        `INSERT INTO caja (fecha, monto_inicio, total_efectivo, total_tarjeta, total_propinas, total_egresos, estado)
         VALUES (?, ?, 0.00, 0.00, 0.00, 0.00, 'Abierta')`,
        [hoy, monto]
      );

      return NextResponse.json({ 
        success: true, 
        data: { id: result.insertId, fecha: hoy, monto_inicio: monto, estado: 'Abierta' } 
      });
    }

    if (accion === 'CERRAR') {
      await pool.query("UPDATE caja SET estado = 'Cerrada' WHERE estado = 'Abierta'");
      return NextResponse.json({ success: true, message: 'Caja cerrada' });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error en POST /api/caja:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}