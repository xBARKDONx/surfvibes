import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Consultar el estado actual de la caja
export async function GET() {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM caja WHERE estado = 'Abierta' ORDER BY id DESC LIMIT 1"
    );

    // Si no hay caja abierta, retorna null en lugar de romper con error
    if (!rows || rows.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(rows[0]);
  } catch (error) {
    console.error('Error GET caja:', error);
    // Devuelve el mensaje real del error para depuración
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Abrir o Cerrar caja según la 'accion' enviada por el frontend
export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accion, monto_inicio } = body;

    // Obtener la fecha actual local en formato YYYY-MM-DD
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
      await pool.query(
        "UPDATE caja SET estado = 'Cerrada' WHERE estado = 'Abierta'"
      );
      return NextResponse.json({ success: true, message: 'Caja cerrada correctamente' });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });

  } catch (error) {
    console.error('Error POST caja:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}