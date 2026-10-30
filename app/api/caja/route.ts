import pool from '../../lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const [rows]: any = await pool.query(
      "SELECT * FROM caja WHERE estado = 'Abierta' ORDER BY id DESC LIMIT 1"
    );

    const cajaActiva = rows && rows.length > 0 ? rows[0] : null;

    return NextResponse.json({
      success: true,
      caja: cajaActiva,
      data: cajaActiva
    });
  } catch (error: any) {
    console.error('Error GET caja:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accion, monto_inicio } = body;
    const hoy = new Date().toISOString().split('T')[0];

    if (accion === 'ABRIR' || !accion) {
      const monto = parseFloat(monto_inicio) || 250.00;

      const [result]: any = await pool.query(
        `INSERT INTO caja (fecha, monto_inicio, total_efectivo, total_tarjeta, total_propinas, total_egresos, estado)
         VALUES (?, ?, 0.00, 0.00, 0.00, 0.00, 'Abierta')`,
        [hoy, monto]
      );

      const nuevaCaja = { id: result.insertId, fecha: hoy, monto_inicio: monto, estado: 'Abierta' };

      return NextResponse.json({ 
        success: true, 
        caja: nuevaCaja,
        data: nuevaCaja 
      });
    }

    if (accion === 'CERRAR') {
      await pool.query("UPDATE caja SET estado = 'Cerrada' WHERE estado = 'Abierta'");
      return NextResponse.json({ success: true, message: 'Caja cerrada' });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    console.error('Error POST caja:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Error' }, { status: 500 });
  }
}