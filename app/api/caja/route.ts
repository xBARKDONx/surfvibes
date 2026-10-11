import { NextResponse } from 'next/server';
import pool from '../../../src/lib/db';

// GET: Obtener el estado actual de la caja (o crear una para hoy si no existe)
export async function GET() {
  try {
    const hoy = new Date().toISOString().split('T')[0];
    
    // Buscar caja de hoy
    const [rows]: any = await pool.query(
      'SELECT * FROM caja WHERE fecha = ? ORDER BY id DESC LIMIT 1',
      [hoy]
    );

    if (rows.length === 0) {
      return NextResponse.json({
        success: true,
        caja: null,
        message: 'No hay caja abierta para la fecha de hoy'
      });
    }

    return NextResponse.json({ success: true, caja: rows[0] });
  } catch (error: any) {
    console.error('Error al obtener estado de caja:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Abrir o Cerrar la caja
export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const { accion, monto_inicio } = body; // accion: 'ABRIR' | 'CERRAR'
    const hoy = new Date().toISOString().split('T')[0];

    await connection.beginTransaction();

    if (accion === 'ABRIR') {
      // Verificar si ya existe caja hoy
      const [existente]: any = await connection.query(
        'SELECT id FROM caja WHERE fecha = ?',
        [hoy]
      );

      if (existente.length > 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: 'Ya existe un registro de caja para hoy' },
          { status: 400 }
        );
      }

      const montoInicial = monto_inicio !== undefined ? Number(monto_inicio) : 250.00;

      const [result]: any = await connection.query(
        `INSERT INTO caja (monto_inicio, total_efectivo, total_tarjeta, total_propinas, total_egresos, fecha, estado) 
         VALUES (?, 0.00, 0.00, 0.00, 0.00, ?, 'Abierta')`,
        [montoInicial, hoy]
      );

      await connection.commit();
      return NextResponse.json({
        success: true,
        message: 'Caja abierta con éxito',
        caja_id: result.insertId
      });
    } 
    
    if (accion === 'CERRAR') {
      const [cajaActual]: any = await connection.query(
        'SELECT id FROM caja WHERE fecha = ? AND estado = "Abierta"',
        [hoy]
      );

      if (cajaActual.length === 0) {
        await connection.rollback();
        return NextResponse.json(
          { success: false, error: 'No hay ninguna caja abierta para cerrar hoy' },
          { status: 400 }
        );
      }

      await connection.query(
        'UPDATE caja SET estado = "Cerrada" WHERE id = ?',
        [cajaActual[0].id]
      );

      await connection.commit();
      return NextResponse.json({ success: true, message: 'Caja cerrada con éxito' });
    }

    await connection.rollback();
    return NextResponse.json({ success: false, error: 'Acción no válida' }, { status: 400 });

  } catch (error: any) {
    await connection.rollback();
    console.error('Error en operación de caja:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}