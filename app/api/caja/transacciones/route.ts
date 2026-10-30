import pool from '../../../../src/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, descripcion, monto, metodo_pago } = body;

    // 1. Obtener la caja activa
    const [cajas]: any = await pool.query(
      "SELECT id FROM caja WHERE estado = 'Abierta' ORDER BY id DESC LIMIT 1"
    );

    if (!cajas || cajas.length === 0) {
      return NextResponse.json({ success: false, error: 'No hay ninguna caja abierta' }, { status: 400 });
    }

    const cajaId = cajas[0].id;
    const montoNum = parseFloat(monto) || 0;

    // 2. Cálculo estricto de propina: Solo si es tarjeta (3% automático), si es efectivo es 0
    const propinaNum = metodo_pago === 'Tarjeta' ? parseFloat((montoNum * 0.03).toFixed(2)) : 0;

    // 3. Guardar transacción (sin incluir columna propina en la tabla si no existe, o usando propina calculada)
    await pool.query(
      `INSERT INTO transacciones (caja_id, tipo, descripcion, monto, metodo_pago)
       VALUES (?, ?, ?, ?, ?)`,
      [cajaId, tipo, descripcion, montoNum, metodo_pago || 'Efectivo']
    );

    // 4. Actualizar acumulados de la caja
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
          "UPDATE caja SET total_efectivo = total_efectivo + ? WHERE id = ?",
          [montoNum, cajaId]
        );
      }
    }

    return NextResponse.json({ success: true, message: 'Registro exitoso', propina_aplicada: propinaNum });

  } catch (error: any) {
    console.error('Error en transacción:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Error en servidor' }, { status: 500 });
  }
}