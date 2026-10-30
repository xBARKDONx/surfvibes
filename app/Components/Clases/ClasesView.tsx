'use client';

import { useState, useEffect } from 'react';

interface Clase {
  id: number;
  cliente_id: number;
  cliente_nombre: string;
  cliente_hostal: string;
  nivel: 'Principiante' | 'Intermedio' | 'Variable';
  costo: number;
  descripcion_instructor: string;
  fecha_hora: string;
  estado: 'Programada' | 'Completada' | 'Cancelada' | 'Reprogramada';
}

interface Cliente {
  id: number;
  nombre: string;
  hostal: string;
}

export default function ClasesView() {
  const [clases, setClases] = useState<Clase[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Formulario para nueva clase
  const [clienteId, setClienteId] = useState<string>('');
  const [nivel, setNivel] = useState<'Principiante' | 'Intermedio' | 'Variable'>('Principiante');
  const [costo, setCosto] = useState<string>('35.00');
  const [instructor, setInstructor] = useState<string>('');
  const [fechaHora, setFechaHora] = useState<string>('');

  // Modal para completar cobro
  const [claseACobrar, setClaseACobrar] = useState<Clase | null>(null);
  const [metodoPago, setMetodoPago] = useState<'Efectivo' | 'Tarjeta'>('Efectivo');
  const [propina, setPropina] = useState<string>('0.00');

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [resClases, resClientes] = await Promise.all([
        fetch('/api/clases'),
        fetch('/api/clientes')
      ]);

      const dataClases = await resClases.json();
      const dataClientes = await resClientes.json();

      if (dataClases.success) setClases(dataClases.data);
      if (dataClientes.success) setClientes(dataClientes.data || []);
    } catch (err) {
      console.error('Error al cargar datos de clases:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const handleCrearClase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !fechaHora) {
      alert('Selecciona un cliente y la fecha/hora de la clase');
      return;
    }

    try {
      const res = await fetch('/api/clases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cliente_id: Number(clienteId),
          nivel,
          costo: Number(costo),
          descripcion_instructor: instructor,
          fecha_hora: fechaHora,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setInstructor('');
        setFechaHora('');
        cargarDatos();
      } else {
        alert(data.error || 'Error al agendar la clase');
      }
    } catch (err) {
      console.error('Error al agendar clase:', err);
    }
  };

  const handleCompletarClase = async () => {
    if (!claseACobrar) return;

    try {
      const res = await fetch('/api/clases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: claseACobrar.id,
          estado: 'Completada',
          metodo_pago: metodoPago,
          propina: Number(propina),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setClaseACobrar(null);
        cargarDatos();
      } else {
        alert(data.error || 'Error al registrar el cobro de la clase');
      }
    } catch (err) {
      console.error('Error al completar clase:', err);
    }
  };

  const handleCambiarEstado = async (id: number, nuevoEstado: string) => {
    try {
      const res = await fetch('/api/clases', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, estado: nuevoEstado }),
      });

      const data = await res.json();
      if (data.success) {
        cargarDatos();
      }
    } catch (err) {
      console.error('Error al actualizar estado:', err);
    }
  };

  if (loading) {
    return <div className="p-6 text-center text-gray-400">Cargando Clases de Surf...</div>;
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6 text-white">
      <div className="border-b border-gray-800 pb-4">
        <h1 className="text-2xl font-bold text-cyan-400">Clases de Surf</h1>
        <p className="text-sm text-gray-400">Agendamiento, asignación de instructores y cobros</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* FORMULARIO AGENDAR CLASE */}
        <div className="bg-gray-900 border border-gray-800 p-5 rounded-2xl space-y-4">
          <h2 className="text-lg font-bold text-gray-100 border-b border-gray-800 pb-2">
            📅 Agendar Nueva Clase
          </h2>
          <form onSubmit={handleCrearClase} className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Cliente</label>
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">-- Seleccionar Cliente --</option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre} ({c.hostal})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nivel</label>
                <select
                  value={nivel}
                  onChange={(e: any) => setNivel(e.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Principiante">Principiante</option>
                  <option value="Intermedio">Intermedio</option>
                  <option value="Variable">Variable</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1">Costo ($)</label>
                <input
                  type="number"
                  step="0.01"
                  value={costo}
                  onChange={(e) => setCosto(e.target.value)}
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Instructor / Notas</label>
              <input
                type="text"
                placeholder="Nombre del instructor"
                value={instructor}
                onChange={(e) => setInstructor(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-400 mb-1">Fecha y Hora</label>
              <input
                type="datetime-local"
                value={fechaHora}
                onChange={(e) => setFechaHora(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg text-sm transition mt-2"
            >
              Agendar Clase
            </button>
          </form>
        </div>

        {/* LISTADO DE CLASES PROGRAMADAS Y HISTORIAL */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 p-5 rounded-2xl">
          <h2 className="text-lg font-bold text-gray-100 border-b border-gray-800 pb-2 mb-4">
            Clases Agendadas
          </h2>

          {clases.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No hay clases registradas aún.</p>
          ) : (
            <div className="space-y-3">
              {clases.map((c) => (
                <div
                  key={c.id}
                  className="bg-gray-800/60 border border-gray-700/60 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{c.cliente_nombre}</span>
                      <span className="text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded-md font-medium">
                        {c.nivel}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Hostal: {c.cliente_hostal} | 👤 Instructor: {c.descripcion_instructor || 'Sin asignar'}
                    </p>
                    <p className="text-xs text-amber-400 mt-0.5">
                      {new Date(c.fecha_hora).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-emerald-400">${Number(c.costo).toFixed(2)}</span>

                    {c.estado === 'Programada' ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setClaseACobrar(c)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-xs px-3 py-1.5 rounded-lg font-bold transition"
                        >
                          Completar & Cobrar
                        </button>
                        <button
                          onClick={() => handleCambiarEstado(c.id, 'Cancelada')}
                          className="bg-red-600/30 text-red-400 hover:bg-red-600 hover:text-white text-xs px-2.5 py-1.5 rounded-lg font-medium transition"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <span
                        className={`text-xs px-3 py-1 rounded-lg font-semibold ${
                          c.estado === 'Completada'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                        }`}
                      >
                        {c.estado}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DE COBRO DE CLASE */}
      {claseACobrar && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 max-w-sm w-full space-y-4 text-white">
            <h3 className="text-lg font-bold text-cyan-400 border-b border-gray-800 pb-2">
              💳 Cobrar Clase de Surf
            </h3>
            <p className="text-sm text-gray-300">
              Cliente: <strong className="text-white">{claseACobrar.cliente_nombre}</strong>
            </p>
            <p className="text-xl font-bold text-emerald-400">
              Total a cobrar: ${Number(claseACobrar.costo).toFixed(2)}
            </p>

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
                  Efectivo
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
                  Tarjeta
                </button>
              </div>
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

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setClaseACobrar(null)}
                className="w-1/2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-2 rounded-lg text-xs"
              >
                Cancelar
              </button>
              <button
                onClick={handleCompletarClase}
                className="w-1/2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs"
              >
                Confirmar Cobro
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}