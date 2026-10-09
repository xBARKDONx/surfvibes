import { NextResponse } from 'next/server';
import pool from '../../../src/lib/db';

// GET: Obtener todas las rentas
export async function GET() {
  try {
    const query = `
      SELECT 
        r.id,
        r.monto,
        r.tipo_tarifa,
        r.descripcion_tarifa,
        r.hora_renta,
        r.hora_entrega,
        r.estado,
        r.amonestacion,
        r.monto_amonestacion,
        r.motivo_amonestacion,
        c.nombre AS cliente_nombre,
        c.hostal AS cliente_hostal,
        t.numero_tabla,
        t.nombre_tabla,
        t.tipo AS tipo_tabla
      FROM rentas r
      INNER JOIN clientes c ON r.cliente_id = c.id
      LEFT JOIN tablas t ON r.tabla_id = t.id
      ORDER BY r.id DESC
    `;
    const [rows]: any = await pool.query(query);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error al obtener rentas:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar rentas en MySQL', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Registrar nueva renta
export async function POST(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const { cliente_id, tabla_id, tipo_tarifa, monto, descripcion_tarifa } = body;

    if (!cliente_id || !tipo_tarifa || monto === undefined || monto === '') {
      return NextResponse.json(
        { success: false, error: 'Cliente, tipo de tarifa y monto son obligatorios' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    // Como las tablas están en 'inventario', enviamos tabla_id como NULL o la referencia correspondiente
    const [result]: any = await connection.query(
      `INSERT INTO rentas 
       (cliente_id, tabla_id, tipo_tarifa, monto, descripcion_tarifa, hora_renta, estado) 
       VALUES (?, NULL, ?, ?, ?, NOW(), 'Activa')`,
      [
        Number(cliente_id),
        tipo_tarifa,
        Number(monto),
        descripcion_tarifa || ''
      ]
    );

    // Actualizamos el estado en la tabla 'inventario'
    if (tabla_id) {
      await connection.query(
        `UPDATE inventario SET estado = 'En Renta' WHERE id = ?`,
        [tabla_id]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true, message: 'Renta creada con éxito', id: result.insertId });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error de MySQL al insertar renta:', error.sqlMessage || error);
    return NextResponse.json(
      { success: false, error: 'Error de MySQL: ' + (error.sqlMessage || error.message) },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}

// PUT: Procesar devolución
export async function PUT(request: Request) {
  const connection = await pool.getConnection();
  try {
    const body = await request.json();
    const { renta_id, tabla_id } = body;

    if (!renta_id) {
      return NextResponse.json(
        { success: false, error: 'Falta el id de la renta' },
        { status: 400 }
      );
    }

    await connection.beginTransaction();

    await connection.query(
      `UPDATE rentas SET estado = 'Devuelta', hora_entrega = NOW() WHERE id = ?`,
      [renta_id]
    );

    if (tabla_id) {
      await connection.query(
        `UPDATE tablas SET estado = 'Disponible' WHERE id = ?`,
        [tabla_id]
      );
    }

    await connection.commit();
    return NextResponse.json({ success: true, message: 'Devolución registrada correctamente' });
  } catch (error: any) {
    await connection.rollback();
    console.error('Error en devolución:', error);
    return NextResponse.json(
      { success: false, error: 'Error al procesar devolución', details: error.message },
      { status: 500 }
    );
  } finally {
    connection.release();
  }
}