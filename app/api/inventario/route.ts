import { NextResponse } from 'next/server';
import pool from '../../../src/lib/db';

// GET: Obtener todos los productos del inventario o filtrados por categoría
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoria = searchParams.get('categoria');

    let query = 'SELECT * FROM inventario ORDER BY id DESC';
    let params: any[] = [];

    if (categoria) {
      query = 'SELECT * FROM inventario WHERE categoria = ? ORDER BY id DESC';
      params.push(categoria);
    }

    const [rows]: any = await pool.query(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error al obtener inventario:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar MySQL', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Agregar un nuevo ítem al inventario
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { categoria, nombre_modelo, marca, especificaciones, precio_venta, precio_renta_dia, stock, estado } = body;

    if (!categoria || !nombre_modelo || !marca) {
      return NextResponse.json(
        { success: false, error: 'Faltan campos obligatorios' },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      `INSERT INTO inventario 
       (categoria, nombre_modelo, marca, especificaciones, precio_venta, precio_renta_dia, stock, estado) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        categoria,
        nombre_modelo,
        marca,
        especificaciones || '',
        Number(precio_venta) || 0.00,
        Number(precio_renta_dia) || 0.00,
        Number(stock) || 1,
        estado || 'Disponible'
      ]
    );

    return NextResponse.json({ success: true, message: 'Ítem registrado con éxito', id: result.insertId });
  } catch (error: any) {
    console.error('Error al insertar ítem:', error);
    return NextResponse.json(
      { success: false, error: 'Error al insertar en MySQL', details: error.message },
      { status: 500 }
    );
  }
}