'use client';

import { useState, useEffect } from 'react';

interface Metrics {
  caja: {
    monto_inicio: number;
    total_efectivo: number;
    total_tarjeta: number;
    total_propinas: number;
    total_egresos: number;
    estado: string;
  } | null;
  tablas: {
    total: number;
    disponibles: number;
    rentadas: number;
    mantenimiento: number;
  };
  rentasActivas: number;
  clasesPendientes: number;
  ultimasTransacciones: Array<{
    id: number;
    tipo: string;
    descripcion: string;
    monto: number;
    metodo_pago: string;
    fecha_hora: string;
  }>;
}

export default function DashboardView() {
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const cargarDashboard = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/dashboard');
      if (!res.ok) {
        throw new Error(`Error en servidor: Estado ${res.status}`);
      }
      const data = await res.json();
      if (data.success) {
        setMetrics(data.data);
      } else {
        setErrorMsg(data.error || 'Error al procesar métricas');
      }
    } catch (err: any) {
      console.error('Error al cargar dashboard:', err);
      setErrorMsg('No se pudo conectar con la base de datos o el endpoint.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDashboard();
  }, []);

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Cargando métricas del Dashboard...</div>;
  }

  if (errorMsg) {
    return (
      <div className="p-6 text-center space-y-4">
        <div className="text-red-400 font-bold">{errorMsg}</div>
        <button
          onClick={cargarDashboard}
          className="bg-gray-800 hover:bg-gray-700 text-white text-xs px-4 py-2 rounded-lg"
        >
          Reintentar
        </button>
      </div>
    );
  }

  const caja = metrics?.caja;
  const totalIngresosHoy = caja
    ? Number(caja.total_efectivo) + Number(caja.total_tarjeta) + Number(caja.total_propinas) - Number(caja.total_egresos)
    : 0;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      {/* CABECERA */}
      <div className="flex justify-between items-center border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-cyan-400">VibesSurfAcademy - Resumen General</h1>
          <p className="text-sm text-gray-400">Métricas principales y rendimiento del día</p>
        </div>
        <button
          onClick={cargarDashboard}
          className="bg-gray-800 hover:bg-gray-700 border border-gray-700 text-xs px-3 py-2 rounded-lg transition text-gray-300"
        >
          Actualizar
        </button>
      </div>

      {/* TARJETAS DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs text-gray-400 font-medium">Balance Neto de Hoy</span>
          <p className="text-2xl font-bold text-emerald-400 mt-1">${totalIngresosHoy.toFixed(2)}</p>
          <span className="text-[11px] text-gray-500 mt-2 block">
            Caja: {caja?.estado === 'Abierta' ? '🟢 Abierta' : '🔴 Cerrada'}
          </span>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs text-gray-400 font-medium">Rentas Activas</span>
          <p className="text-2xl font-bold text-cyan-400 mt-1">{metrics?.rentasActivas || 0}</p>
          <span className="text-[11px] text-gray-500 mt-2 block">Tablas actualmente en el agua</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs text-gray-400 font-medium">Clases Programadas</span>
          <p className="text-2xl font-bold text-amber-400 mt-1">{metrics?.clasesPendientes || 0}</p>
          <span className="text-[11px] text-gray-500 mt-2 block">Pendientes por completar</span>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <span className="text-xs text-gray-400 font-medium">Disponibilidad de Tablas</span>
          <p className="text-2xl font-bold text-indigo-400 mt-1">
            {metrics?.tablas.disponibles || 0} / {metrics?.tablas.total || 0}
          </p>
          <span className="text-[11px] text-gray-500 mt-2 block">
            {metrics?.tablas.mantenimiento || 0} en mantenimiento
          </span>
        </div>
      </div>

      {/* SECCIÓN INFERIOR */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* DESGLOSE DE CAJA */}
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-gray-100 border-b border-gray-800 pb-2">
            Flujo de Caja del Día
          </h2>
          {caja ? (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-400 font-medium">Estado de Caja:</span>
                <span
                  className={`font-semibold ${
                    caja.estado === 'Abierta' ? 'text-emerald-400' : 'text-red-400'
                  }`}
                >
                  {caja.estado}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-400">Fondo Inicial:</span>
                <span className="font-semibold text-gray-200">${Number(caja.monto_inicio).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-400">Ventas Efectivo:</span>
                <span className="font-semibold text-emerald-400">+${Number(caja.total_efectivo).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-400">Ventas Tarjeta:</span>
                <span className="font-semibold text-blue-400">+${Number(caja.total_tarjeta).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-800">
                <span className="text-gray-400">Propinas:</span>
                <span className="font-semibold text-amber-400">+${Number(caja.total_propinas).toFixed(2)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-gray-400">Egresos / Gastos:</span>
                <span className="font-semibold text-red-400">-${Number(caja.total_egresos).toFixed(2)}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-6">No hay registros de caja creados aún.</p>
          )}
        </div>

        {/* ÚLTIMOS MOVIMIENTOS */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <h2 className="text-lg font-bold text-gray-100 border-b border-gray-800 pb-2 mb-4">
            Últimas Transacciones
          </h2>
          {!metrics?.ultimasTransacciones || metrics.ultimasTransacciones.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Sin actividad reciente registrada.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="text-xs text-gray-400 border-b border-gray-800">
                  <tr>
                    <th className="pb-2">Tipo</th>
                    <th className="pb-2">Descripción</th>
                    <th className="pb-2">Pago</th>
                    <th className="pb-2 text-right">Monto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {metrics.ultimasTransacciones.map((t) => (
                    <tr key={t.id} className="hover:bg-gray-800/50">
                      <td className="py-2.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-md ${
                            t.tipo === 'Egreso' ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'
                          }`}
                        >
                          {t.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-300">{t.descripcion}</td>
                      <td className="py-2.5 text-xs text-gray-400">{t.metodo_pago}</td>
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
  );
}