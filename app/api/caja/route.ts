import pool from '@/lib/db';
import { NextResponse } from 'next/server';

// GET: Obtener la caja activa o la más reciente
export async function GET() {
  try {
    // Busca la última caja con estado 'Abierta' o simplemente la más reciente
    const [rows] = await pool.query("SELECT * FROM caja WHERE estado = 'Abierta' ORDER BY id DESC LIMIT 1");
    return NextResponse.json(rows[0] || null);
  } catch (error) {
    console.error('Error GET caja:', error);
    return NextResponse.json({ error: 'Error al consultar la caja' }, { status: 500 });
  }
}

// POST: Abrir caja con cualquier monto ingresado por el usuario
export async function POST(req) {
  try {
    const { monto_inicio } = await req.json();
    
    // Obtener la fecha actual en formato local YYYY-MM-DD
    const hoy = new Date().toLocaleDateString('sv-SE'); // Produce 'YYYY-MM-DD'

    const [result] = await pool.query(
      `INSERT INTO caja (fecha, monto_inicio, total_efectivo, total_tarjeta, total_propinas, total_egresos, estado)
       VALUES (?, ?, 0.00, 0.00, 0.00, 0.00, 'Abierta')`,
      [hoy, monto_inicio || 250.00]
    );

    return NextResponse.json({ 
      id: result.insertId, 
      fecha: hoy, 
      monto_inicio: monto_inicio || 250.00, 
      estado: 'Abierta' 
    });
  } catch (error) {
    console.error('Error POST caja:', error);
    return NextResponse.json({ error: 'Error al abrir caja' }, { status: 500 });
  }
}