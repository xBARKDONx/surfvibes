'use client';

import { useState, useEffect } from 'react';

interface CajaState {
  id: number;
  monto_inicio: number;
  total_efectivo: number;
  total_tarjeta: number;
  total_propinas: number;
  total_egresos: number;
  fecha: string;
  estado: 'Abierta' | 'Cerrada';
}

interface Transaccion {
  id: number;
  metodo_pago: 'Efectivo' | 'Tarjeta';
  tipo: string;
  descripcion: string;
  monto: number;
  propina: number;
  fecha_hora: string;
}

export default function VentasView() {
  const [caja, setCaja] = useState<CajaState | null>(null);
  const [transacciones, setTransacciones] = useState<Transaccion[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [montoInicio, setMontoInicio] = useState<string>('250.00');

  // Formulario para registrar venta rápida o egreso
  const [tipoMov, setTipoMov] = useState<'Cera' | 'Quillas' | 'Egreso' | 'Ingreso_Externo'>('Cera');
  const [descripcion, setDescripcion] = useState<string>('');
  const [monto, setMonto] = useState<string>('');
  const [propina, setPropina] = useState<string>('0.00');
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');

  // Cargar estado de caja y transacciones
  const cargarDatosCaja = async () => {
    setLoading(true);
    try {
      const resCaja = await fetch('/api/caja');
      const dataCaja = await resCaja.json();

      if (dataCaja.success && dataCaja.caja) {
        setCaja(dataCaja.caja);
        // Si hay caja cargamos transacciones
        const resTrans = await fetch('/api/caja/transacciones');
        const dataTrans = await resTrans.json();
        if (dataTrans.success) {
          setTransacciones(dataTrans.data);
        }
      } else {
        setCaja(null);
        setTransacciones([]);
      }
    } catch (err) {
      console.error('Error al obtener datos de caja:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatosCaja();
  }, []);

  // Manejar Apertura/Cierre de Caja
  const handleAccionCaja = async (accion: 'ABRIR' | 'CERRAR') => {
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion,
          monto_inicio: accion === 'ABRIR' ? Number(montoInicio) : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        cargarDatosCaja();
      } else {
        alert(data.error || 'Error al procesar la caja');
      }
    } catch (err) {
      console.error('Error al cambiar estado de caja:', err);
    }
  };

  // Registrar un movimiento o venta directa
  const handleRegistrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!monto || Number(monto) <= 0) {
      alert('Ingresa un monto válido');
      return;
    }

    try {
      const res = await fetch('/api/caja/transacciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: tipoMov,
          descripcion: descripcion || `Venta de ${tipoMov}`,
          monto: Number(monto),
          propina: Number(propina),
          metodo_pago: metodoPago,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setDescripcion('');
        setMonto('');
        setPropina('0.00');
        cargarDatosCaja();
      } else {
        alert(data.error || 'Error al registrar la transacción');
      }
    } catch (err) {
      console.error('Error al registrar transacción:', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Cargando módulo de Ventas y Caja...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* HEADER PRINCIPAL */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-800 pb-4 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">Punto de Venta & Caja Chica</h1>
          <p className="text-sm text-gray-400">Gestión de ingresos, productos y cierre diario</p>
        </div>

        {/* ESTADO DE CAJA & BOTÓN ABRIR/CERRAR */}
        {caja && caja.estado === 'Abierta' ? (
          <div className="flex items-center gap-3 bg-gray-900 border border-green-500/30 px-4 py-2 rounded-xl">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="text-sm font-semibold text-green-400">Caja Abierta</span>
            <button
              onClick={() => handleAccionCaja('CERRAR')}
              className="ml-2 bg-red-600 hover:bg-red-700 text-xs px-3 py-1.5 rounded-lg font-medium transition"
            >
              Cerrar Caja
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-gray-900 border border-amber-500/30 p-2 rounded-xl">
            <input
              type="number"
              value={montoInicio}
              onChange={(e) => setMontoInicio(e.target.value)}
              className="bg-gray-800 text-white text-sm px-3 py-1.5 rounded-lg border border-gray-700 w-28 text-center"
              placeholder="Monto Inicio"
            />
            <button
              onClick={() => handleAccionCaja('ABRIR')}
              className="bg-emerald-600 hover:bg-emerald-700 text-xs px-4 py-2 rounded-lg font-medium transition"
            >
              Abrir Caja
            </button>
          </div>
        )}
      </div>

      {/* METRICAS DE CAJA SI ESTÁ ABIERTA */}
      {caja && caja.estado === 'Abierta' ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 font-medium">Monto Inicial</p>
              <p className="text-xl font-bold text-gray-200 mt-1">${Number(caja.monto_inicio).toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 font-medium">Efectivo</p>
              <p className="text-xl font-bold text-emerald-400 mt-1">${Number(caja.total_efectivo).toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 font-medium">Tarjeta</p>
              <p className="text-xl font-bold text-blue-400 mt-1">${Number(caja.total_tarjeta).toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 font-medium">Propinas</p>
              <p className="text-xl font-bold text-amber-400 mt-1">${Number(caja.total_propinas).toFixed(2)}</p>
            </div>
            <div className="bg-gray-900 border border-gray-800 p-4 rounded-xl">
              <p className="text-xs text-gray-400 font-medium">Egresos</p>
              <p className="text-xl font-bold text-red-400 mt-1">-${Number(caja.total_egresos).toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* FORMULARIO DE NUEVA VENTA / EGRESO */}
            <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
              <h2 className="text-lg font-bold text-gray-100 border-b border-gray-800 pb-2">
                ➕ Registrar Venta / Movimiento
              </h2>
              <form onSubmit={handleRegistrarMovimiento} className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Tipo de Operación</label>
                  <select
                    value={tipoMov}
                    onChange={(e: any) => setTipoMov(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Cera">Venta de Cera</option>
                    <option value="Quillas">Venta / Alquiler Quillas</option>
                    <option value="Ingreso_Externo">Ingreso Varios</option>
                    <option value="Egreso">Egreso / Gasto Local</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Descripción</label>
                  <input
                    type="text"
                    placeholder="Ej. Cera Sticky Bumps o Pago de Hielo"
                    value={descripcion}
                    onChange={(e) => setDescripcion(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Monto ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={monto}
                      onChange={(e) => setMonto(e.target.value)}
                      required
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Propina ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={propina}
                      onChange={(e) => setPropina(e.target.value)}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-400 mb-1">Método de Pago</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setMetodoPago('Efectivo')}
                      className={`py-2 rounded-lg text-xs font-semibold border ${
                        metodoPago === 'Efectivo'
                          ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                    >
                      💵 Efectivo
                    </button>
                    <button
                      type="button"
                      onClick={() => setMetodoPago('Tarjeta')}
                      className={`py-2 rounded-lg text-xs font-semibold border ${
                        metodoPago === 'Tarjeta'
                          ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                          : 'bg-gray-800 border-gray-700 text-gray-400'
                      }`}
                    >
                      💳 Tarjeta
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-sm transition mt-2"
                >
                  Confirmar Registro
                </button>
              </form>
            </div>

            {/* TABLA DE HISTORIAL DE TRANSACCIONES */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-5 rounded-2xl flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-gray-100 border-b border-gray-800 pb-2 mb-4">
                  📋 Movimientos del Día
                </h2>

                {transacciones.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Aún no se han registrado transacciones en esta caja.
                  </p>
                ) : (
                  <div className="overflow-x-auto max-h-[340px]">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs text-gray-400 border-b border-gray-800">
                        <tr>
                          <th className="pb-2">Tipo</th>
                          <th className="pb-2">Descripción</th>
                          <th className="pb-2">Método</th>
                          <th className="pb-2 text-right">Monto</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-800">
                        {transacciones.map((t) => (
                          <tr key={t.id} className="hover:bg-gray-800/50">
                            <td className="py-2.5 font-medium">
                              <span
                                className={`text-xs px-2 py-0.5 rounded-md ${
                                  t.tipo === 'Egreso'
                                    ? 'bg-red-500/20 text-red-400'
                                    : 'bg-emerald-500/20 text-emerald-400'
                                }`}
                              >
                                {t.tipo}
                              </span>
                            </td>
                            <td className="py-2.5 text-gray-300">{t.descripcion}</td>
                            <td className="py-2.5 text-gray-400 text-xs">{t.metodo_pago}</td>
                            <td
                              className={`py-2.5 text-right font-bold ${
                                t.tipo === 'Egreso' ? 'text-red-400' : 'text-emerald-400'
                              }`}
                            >
                              {t.tipo === 'Egreso' ? '-' : '+'}${Number(t.monto).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : (
        /* VISTA CUANDO LA CAJA ESTÁ CERRADA */
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-12 text-center max-w-md mx-auto my-12 space-y-4">
          <div className="text-4xl">🔒</div>
          <h2 className="text-xl font-bold text-gray-200">La caja está cerrada</h2>
          <p className="text-sm text-gray-400">
            Debes ingresar el monto inicial y abrir la caja del día para poder realizar cobros, registrar gastos o ingresar transacciones.
          </p>
        </div>
      )}
    </div>
  );
}