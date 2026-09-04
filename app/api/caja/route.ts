import { NextResponse } from 'next/server';
import pool from '../../../src/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tipo, descripcion, monto, metodo_pago, propina } = body;

    // 1. Obtener la caja que esté actualmente ABIERTA
    const [cajaAbierta]: any = await pool.query(
      'SELECT id FROM caja WHERE estado = "Abierta" ORDER BY id DESC LIMIT 1'
    );

    let cajaId = cajaAbierta[0]?.id;

    // Si no hay ninguna caja abierta, crear una nueva asociándole la fecha actual de MySQL
    if (!cajaId) {
      const [nuevaCaja]: any = await pool.query(
        'INSERT INTO caja (monto_inicio, fecha, estado) VALUES (250.00, CURDATE(), "Abierta")'
      );
      cajaId = nuevaCaja.insertId;
    }

    // 2. Insertar en transacciones pasando valores por defecto limpios
    await pool.query(
      `INSERT INTO transacciones (caja_id, metodo_pago, tipo, descripcion, monto, propina, fecha_hora) 
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        cajaId,
        metodo_pago || 'Efectivo',
        tipo || 'Cera',
        descripcion || 'Venta de cera',
        Number(monto) || 0.00,
        Number(propina) || 0.00
      ]
    );

    // 3. Actualizar la caja correspondiente
    if (tipo === 'Egreso') {
      await pool.query(
        'UPDATE caja SET total_egresos = total_egresos + ? WHERE id = ?',
        [Number(monto), cajaId]
      );
    } else {
      if (metodo_pago === 'Efectivo') {
        await pool.query(
          'UPDATE caja SET total_efectivo = total_efectivo + ? WHERE id = ?',
          [Number(monto), cajaId]
        );
      } else {
        await pool.query(
          'UPDATE caja SET total_tarjeta = total_tarjeta + ?, total_propinas = total_propinas + ? WHERE id = ?',
          [Number(monto), Number(propina) || 0.00, cajaId]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Guardado correctamente' });
  } catch (error: any) {
    console.error('CRITICAL API ERROR:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Error desconocido' },
      { status: 500 }
    );
  }
}
