import { NextResponse } from 'next/server';
import pool from '../../../src/lib/db';

// GET: Obtener todos los clientes
export async function GET() {
  try {
    const [rows]: any = await pool.query('SELECT * FROM clientes ORDER BY id DESC');
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error al obtener clientes:', error);
    return NextResponse.json(
      { success: false, error: 'Error al consultar clientes en MySQL', details: error.message },
      { status: 500 }
    );
  }
}

// POST: Crear un nuevo cliente
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, hostal, telefono } = body;

    if (!nombre || !hostal) {
      return NextResponse.json(
        { success: false, error: 'El nombre y el hostal son obligatorios' },
        { status: 400 }
      );
    }

    const [result]: any = await pool.query(
      'INSERT INTO clientes (nombre, hostal, telefono) VALUES (?, ?, ?)',
      [nombre, hostal, telefono || '']
    );

    return NextResponse.json({ success: true, message: 'Cliente registrado con éxito', id: result.insertId });
  } catch (error: any) {
    console.error('Error al crear cliente:', error);
    return NextResponse.json(
      { success: false, error: 'Error al guardar cliente en MySQL', details: error.message },
      { status: 500 }
    );
  }
}