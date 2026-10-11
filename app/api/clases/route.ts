import { NextResponse } from 'next/server';
import pool from '../../../src/lib/db';

// GET: Obtener todas las clases registradas con el nombre del cliente
export async function GET() {
  try {
    const [rows]: any = await pool.query(`
      SELECT 
        c.id,
        c.cliente_id,
        cl.nombre AS cliente_nombre,
        cl.hostal AS cliente_hostal,
        c.nivel,
        c.costo,
        c.descripcion_instructor,
        c.fecha_hora,
        c.estado
      FROM clases c
      INNER JOIN clientes cl ON c.cliente_id = cl.id
      ORDER BY c.fecha_hora DESC
    `);

    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error al obtener clases:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Programar una nueva clase
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente_id, nivel, costo, descripcion_instructor, fecha_hora } = body;

    if (!cliente_id || !nivel || costo === undefined || !fecha_hora) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO clases (cliente_id, nivel, costo, descripcion_instructor, fecha_hora, estado)
       VALUES (?, ?, ?, ?, ?, 'Programada')`,
      [cliente_id, nivel, Number(costo), descripcion_instructor || '', fecha_hora]
    );

    return NextResponse.json({
      success: true,
      message: 'Clase programada con éxito',
      id: result.insertId
    });
  } catch (error: any) {
    console.error('Error al crear clase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT: Actualizar estado de la clase y registrar cobro en Caja si se completa
export async function PUT(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const { id, estado, metodo_pago, propina } = body;

    if (!id || !estado) {
      return NextResponse.json({ success: false, error: 'ID y estado son requeridos' }, { status: 400 });
    }

    await connection.beginTransaction();

    // Obtener la clase
    const [claseRows]: any = await connection.query('SELECT * FROM clases WHERE id = ?', [id]);
    if (claseRows.length === 0) {
      await connection.rollback();
      return NextResponse.json({ success: false, error: 'Clase no encontrada' }, { status: 404 });
    }

    const clase = claseRows[0];

    // Actualizar estado de la clase
    await connection.query('UPDATE clases SET estado = ? WHERE id = ?', [estado, id]);

    // Si la clase pasa a "Completada", cobrar automáticamente en Caja
    if (estado === 'Completada') {
      const hoy = new Date().toISOString().split('T')[0];
      const [cajaRows]: any = await connection.query(
        'SELECT id FROM caja WHERE fecha = ? AND estado = "Abierta"',
        [hoy]
      );

      if (cajaRows.length > 0) {
        const cajaId = cajaRows[0].id;
        const metodo = metodo_pago || 'Efectivo';
        const montoNum = Number(clase.costo);
        const propinaNum = Number(propina || 0);

        // Insertar transacción de la clase
        await connection.query(
          `INSERT INTO transacciones (caja_id, metodo_pago, tipo, descripcion, monto, propina)
           VALUES (?, ?, 'Clase', ?, ?, ?)`,
          [cajaId, metodo, `Cobro Clase # ${id}`, montoNum, propinaNum]
        );

        // Sumar a la caja del día
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
    }

    await connection.commit();
    return NextResponse.json({ success: true, message: 'Estado de la clase actualizado' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error al actualizar clase:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  } finally {
    connection.release();
  }
}