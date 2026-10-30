import pool from '../../../src/lib/db';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const tipo = searchParams.get('tipo');

    let query = 'SELECT * FROM inventario';
    const params: any[] = [];

    if (tipo) {
      query += ' WHERE tipo = ?';
      params.push(tipo);
    }

    const [rows]: any = await pool.query(query, params);
    return NextResponse.json({ success: true, data: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tipo, modelo, marca, sistema, medidas, precio_renta, precio_venta, stock } = body;

    // Normalizar valores para evitar fallos de NULL en la base de datos
    const tipoVal = tipo || 'killa'; // 'killa', 'cera', 'surfboard', 'renta'
    const modeloVal = modelo || marca || 'Modelo Standard';
    const marcaVal = marca || 'Generico';
    const sistemaVal = sistema || medidas || 'N/A';
    const rentaNum = parseFloat(precio_renta) || 0.0;
    const ventaNum = parseFloat(precio_venta) || 0.0;
    const stockNum = parseInt(stock) || 1;

    // Inserción flexible que soporta cualquier item de inventario
    const [result]: any = await pool.query(
      `INSERT INTO inventario (tipo, modelo, marca, sistema, precio_renta, precio_venta, stock, estado)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'Disponible')`,
      [tipoVal, modeloVal, marcaVal, sistemaVal, rentaNum, ventaNum, stockNum]
    );

    return NextResponse.json({
      success: true,
      message: 'Item agregado correctamente al inventario',
      id: result.insertId,
    });
  } catch (error: any) {
    console.error('Error en API Inventario:', error);
    return NextResponse.json(
      { success: false, error: error?.message || 'Error al guardar en base de datos' },
      { status: 500 }
    );
  }
}