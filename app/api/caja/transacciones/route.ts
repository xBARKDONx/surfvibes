import { NextResponse } from 'next/server';
import pool from '../../../../src/lib/db';

// GET: Historial de transacciones de la caja de hoy
export async function GET() {
  try {
    const hoy = new Date().toISOString().split('T')[0];

    const [rows]: any = await pool.query(
      `SELECT t.* 
       FROM transacciones t
       INNER JOIN caja c ON t.caja_id = c.id
       WHERE c.fecha = ?
       ORDER BY t.id DESC`,
      [hoy]
    );

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error al obtener transacciones:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Registrar nuevo ingreso o egreso manual
export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const { tipo, descripcion, monto, metodo_pago, propina } = body;

    if (!tipo || !descripcion || monto === undefined) {
      return NextResponse.json(
        { success: false, error: 'Campos requeridos faltantes (tipo, descripcion, monto)' },
        { status: 400 }
      );
    }

    const hoy = new Date().toISOString().split('T')[0];

    await connection.beginTransaction();

    // Obtener caja abierta
    const [caja]: any = await connection.query(
      'SELECT id FROM caja WHERE fecha = ? AND estado = "Abierta"',
      [hoy]
    );

    if (caja.length === 0) {
      await connection.rollback();
      return NextResponse.json(
        { success: false, error: 'Debe abrir la caja antes de registrar movimientos' },
        { status: 400 }
      );
    }

    const cajaId = caja[0].id;
    const metodo = metodo_pago || 'Efectivo';
    const montoNum = Number(monto);
    const propinaNum = Number(propina || 0);

    // Insertar transacción
    const [resTrans]: any = await connection.query(
      `INSERT INTO transacciones (caja_id, metodo_pago, tipo, descripcion, monto, propina)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cajaId, metodo, tipo, descripcion, montoNum, propinaNum]
    );

    // Actualizar totales acumulados de la caja
    if (tipo === 'Egreso') {
      await connection.query(
        'UPDATE caja SET total_egresos = total_egresos + ? WHERE id = ?',
        [montoNum, cajaId]
      );
    } else {
      if (metodo === 'Efectivo') {
        await connection.query(
          'UPDATE caja SET total_efectivo = total_efectivo + ?, total_propinas = total_propinas + ? WHERE id = ?',
          [montoNum, propinaNum, cajaId]
        );
      } else {
        await connection.query(
          'UPDATE caja SET total_tarjeta = total_tarjeta + ?, total_propinas = total_propinas + ? WHERE id = ?',
          [montoNum, propinaNum, cajaId]
        );
      }
    }

    await connection.commit();
    return NextResponse.json({
      success: true,
      message: 'Transacción registrada con éxito',
      id: resTrans.insertId
    });

  } catch (error: any) {
    await connection.rollback();
    console.error('Error al registrar transacción:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}