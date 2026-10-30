'use client';
import { useState, useEffect } from 'react';

export default function RentasView() {
  const [rentas, setRentas] = useState<any[]>([]);
  const [clientes, setClientes] = useState<any[]>([]);
  const [tablas, setTablas] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Formulario de Nueva Renta
  const [clienteId, setClienteId] = useState('');
  const [tablaId, setTablaId] = useState('');
  const [tipoTarifa, setTipoTarifa] = useState('Daypass');
  const [monto, setMonto] = useState('25.00');
  const [descripcionTarifa, setDescripcionTarifa] = useState('');

  const cargarDatosBD = async () => {
    try {
      // 1. Rentas
      const resRentas = await fetch('/api/rentas');
      if (resRentas.ok) {
        const text = await resRentas.text();
        if (text) {
          const dataRentas = JSON.parse(text);
          if (dataRentas.success) setRentas(dataRentas.data);
        }
      }

      // 2. Clientes
      const resClientes = await fetch('/api/clientes');
      if (resClientes.ok) {
        const text = await resClientes.text();
        if (text) {
          const dataClientes = JSON.parse(text);
          if (dataClientes.success) setClientes(dataClientes.data);
        }
      }

      // 3. Tablas desde /api/tablas
      const resTablas = await fetch('/api/tablas');
      if (resTablas.ok) {
        const text = await resTablas.text();
        if (text) {
          const dataTablas = JSON.parse(text);
          console.log('DATOS RECIBIDOS DE /api/tablas:', dataTablas);
          if (dataTablas.success && Array.isArray(dataTablas.data)) {
            // Guardamos directamente todas las tablas activas/disponibles
            setTablas(dataTablas.data);
          }
        }
      }
    } catch (err) {
      console.error('Error al cargar datos de rentas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarDatosBD();
  }, []);

  const handleCrearRenta = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !monto) return alert('Selecciona un cliente y un monto válido');

    try {
      const res = await fetch('/api/rentas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: clienteId,
          tabla_id: tablaId || null,
          tipo_tarifa: tipoTarifa,
          monto,
          descripcion_tarifa: descripcionTarifa
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Renta guardada correctamente');
        setClienteId('');
        setTablaId('');
        setDescripcionTarifa('');
        setShowModal(false);
        cargarDatosBD();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de red al registrar la renta');
    }
  };

  const handleDevolucion = async (rentaId: number, tablaId: number) => {
    if (!confirm('¿Confirmas la devolución de la tabla?')) return;

    try {
      const res = await fetch('/api/rentas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          renta_id: rentaId,
          tabla_id: tablaId
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Renta marcada como Devuelta y tabla disponible');
        cargarDatosBD();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de red al procesar devolución');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Control de Rentas</h1>
          <p className="text-slate-500 text-xs">Gestión de alquileres, tarifas y devoluciones</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <span>+</span> Nueva Renta
        </button>
      </div>

      {cargando ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400">
          Cargando rentas desde MySQL...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Cliente</th>
                <th className="p-4">Tabla Asignada</th>
                <th className="p-4">Tarifa</th>
                <th className="p-4">Monto ($)</th>
                <th className="p-4">Hora Renta</th>
                <th className="p-4">Estado</th>
                <th className="p-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rentas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400">
                    Sin rentas registradas.
                  </td>
                </tr>
              ) : (
                rentas.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {r.cliente_nombre}
                      <span className="block text-[10px] font-normal text-slate-400">{r.cliente_hostal}</span>
                    </td>
                    <td className="p-4 font-semibold text-slate-800">
                      {r.nombre_tabla ? `#${r.numero_tabla} ${r.nombre_tabla}` : 'Sin tabla asociada'}
                    </td>
                    <td className="p-4 font-semibold text-slate-600">{r.tipo_tarifa}</td>
                    <td className="p-4 font-bold text-emerald-600">${Number(r.monto).toFixed(2)}</td>
                    <td className="p-4 text-slate-400">
                      {r.hora_renta ? new Date(r.hora_renta).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'N/A'}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        r.estado === 'Activa' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {r.estado}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {r.estado === 'Activa' && (
                        <button
                          onClick={() => handleDevolucion(r.id, r.tabla_id)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold px-3 py-1.5 rounded-lg transition-all"
                        >
                          Devolver
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Nueva Renta */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCrearRenta} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-4">Nueva Renta</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Cliente</label>
                <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900">
                  <option value="">-- Selecciona Cliente --</option>
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.hostal})</option>
                  ))}
                </select>
              </div>

              <div>
  <label className="text-xs text-slate-500 block mb-1">Tabla (Opcional)</label>
  <select 
    value={tablaId} 
    onChange={(e) => setTablaId(e.target.value)} 
    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
  >
    <option value="">-- Sin asignar / General --</option>
    {tablas.map((t) => (
      <option key={t.id} value={t.id}>
        #{t.numero_tabla || t.id} - {t.nombre_tabla} ({t.tipo})
      </option>
    ))}
  </select>
</div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Tipo de Tarifa</label>
                <select value={tipoTarifa} onChange={(e) => setTipoTarifa(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900">
                  <option value="Daypass">Daypass</option>
                  <option value="Mas_5_dias">Más de 5 días</option>
                  <option value="Variable">Variable</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Monto ($)</label>
                <input type="number" step="0.01" required value={monto} onChange={(e) => setMonto(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-bold" />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Notas / Descripción Tarifa</label>
                <input type="text" value={descripcionTarifa} onChange={(e) => setDescripcionTarifa(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" placeholder="Ej. Incluye quillas extra" />
              </div>
            </div>

            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="flex-1 bg-[#0f172a] text-white text-xs font-semibold py-2.5 rounded-xl">
                Guardar Renta
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}