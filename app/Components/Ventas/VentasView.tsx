'use client';

import { useState } from 'react';

export default function VentasView() {
  const [tipoOp, setTipoOp] = useState('Venta');
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [cargando, setCargando] = useState(false);

  // Cálculo automático del 3% de propina solo si el pago es con tarjeta
  const montoNum = parseFloat(monto) || 0;
  const propinaCalculada = metodoPago === 'Tarjeta' ? (montoNum * 0.03).toFixed(2) : '0.00';

  const registrarTransaccion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!montoNum || montoNum <= 0) return alert('Ingresa un monto válido');

    setCargando(true);
    try {
      const res = await fetch('/api/caja/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoOp,
          descripcion: descripcion || tipoOp,
          monto: montoNum,
          propina: parseFloat(propinaCalculada),
          metodo_pago: tipoOp === 'INGRESO' || tipoOp === 'EGRESO' ? 'Efectivo' : metodoPago,
        }),
      });

      const data = await res.json();
      if (data.success) {
        alert('Movimiento registrado correctamente');
        setDescripcion('');
        setMonto('');
        window.location.reload();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err: any) {
      alert('Error de conexión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 text-white">
      {/* SECCIÓN 1: REGISTRO DE VENTAS */}
      <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-teal-400">🛒 Registrar Venta / Producto</h3>
        <form onSubmit={registrarTransaccion} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-1">Descripción del Producto / Servicio</label>
            <input
              type="text"
              placeholder="Ej. Cera Sticky, Renta de Killas, Class Surf"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Monto ($)</label>
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-teal-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Propina 3% (Auto)</label>
              <input
                type="text"
                readOnly
                value={`$${propinaCalculada}`}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-400 cursor-not-allowed font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Método de Pago</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setMetodoPago('Efectivo')}
                className={`py-3 rounded-lg font-semibold border transition ${
                  metodoPago === 'Efectivo'
                    ? 'bg-teal-600 border-teal-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Efectivo
              </button>
              <button
                type="button"
                onClick={() => setMetodoPago('Tarjeta')}
                className={`py-3 rounded-lg font-semibold border transition ${
                  metodoPago === 'Tarjeta'
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                Tarjeta (+3%)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            onClick={() => setTipoOp('VENTA')}
            className="w-full bg-teal-500 hover:bg-teal-600 font-bold py-3 rounded-lg text-slate-950 transition"
          >
            {cargando ? 'Guardando...' : 'Confirmar Venta'}
          </button>
        </form>
      </div>

      {/* SECCIÓN 2: CAJÓN SEPARADO PARA INGRESOS Y EGRESOS DIRECTOS (EFECTIVO) */}
      <div className="bg-slate-900/80 p-6 rounded-xl border border-slate-800 shadow-lg">
        <h3 className="text-xl font-bold mb-4 text-amber-400">Movimientos Directos de Caja (Efectivo)</h3>
        <form onSubmit={registrarTransaccion} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Tipo de Movimiento</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTipoOp('INGRESO')}
                className={`py-2 rounded-lg font-bold border transition ${
                  tipoOp === 'INGRESO'
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                ▲ Ingreso Extra
              </button>
              <button
                type="button"
                onClick={() => setTipoOp('EGRESO')}
                className={`py-2 rounded-lg font-bold border transition ${
                  tipoOp === 'EGRESO'
                    ? 'bg-rose-600 border-rose-500 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-400'
                }`}
              >
                ▼ Egreso / Gasto
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Descripción del Movimiento</label>
            <input
              type="text"
              placeholder={tipoOp === 'EGRESO' ? 'Ej. Pago de hielo, compra de cera' : 'Ej. Aporte inicial extra'}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-1">Monto ($)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.00"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>

          <button
            type="submit"
            disabled={cargando}
            className={`w-full font-bold py-3 rounded-lg text-slate-950 transition ${
              tipoOp === 'EGRESO' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
            }`}
          >
            {cargando ? 'Registrando...' : `Confirmar ${tipoOp === 'EGRESO' ? 'Egreso' : 'Ingreso'}`}
          </button>
        </form>
      </div>
    </div>
  );
}