import { NextResponse } from 'next/server';
import pool from '../../../src/lib/db';

export async function GET() {
  try {
    // Consultamos la tabla unificada inventario
    const [rows]: any = await pool.query(
      "SELECT id, nombre_modelo AS nombre_tabla, especificaciones AS tipo, estado FROM inventario WHERE categoria = 'Surfboard' ORDER BY id DESC"
    );
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    console.error('Error al consultar tablas desde inventario:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}