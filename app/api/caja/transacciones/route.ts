import pool from '../../../../src/lib/db'; // O la ruta relativa correspondiente según la carpeta
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, descripcion, monto, propina, metodo_pago } = body;

    // 1. Obtener la caja que está actualmente Abierta
    const [cajas]: any = await pool.query(
      "SELECT id FROM caja WHERE estado = 'Abierta' ORDER BY id DESC LIMIT 1"
    );

    if (!cajas || cajas.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No hay ninguna caja abierta' },
        { status: 400 }
      );
    }

    const cajaId = cajas[0].id;
    const montoNum = parseFloat(monto) || 0;
    const propinaNum = parseFloat(propina) || 0;

    // 2. Insertar el movimiento/transacción
    await pool.query(
      `INSERT INTO transacciones (caja_id, tipo, descripcion, monto, propina, metodo_pago)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [cajaId, tipo, descripcion, montoNum, propinaNum, metodo_pago || 'Efectivo']
    );

    // 3. Actualizar los totales acumulados en la tabla caja
    if (tipo === 'EGRESO' || tipo === 'GASTO') {
      await pool.query(
        "UPDATE caja SET total_egresos = total_egresos + ? WHERE id = ?",
        [montoNum, cajaId]
      );
    } else {
      if (metodo_pago === 'Tarjeta') {
        await pool.query(
          "UPDATE caja SET total_tarjeta = total_tarjeta + ?, total_propinas = total_propinas + ? WHERE id = ?",
          [montoNum, propinaNum, cajaId]
        );
      } else {
        await pool.query(
          "UPDATE caja SET total_efectivo = total_efectivo + ?, total_propinas = total_propinas + ? WHERE id = ?",
          [montoNum, propinaNum, cajaId]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Transacción registrada correctamente' });

  } catch (error: any) {
    console.error('Error al registrar transacción:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al guardar la transacción' },
      { status: 500 }
    );
  }
}