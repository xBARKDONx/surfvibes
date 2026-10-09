'use client';
import { useState, useEffect } from 'react';

export default function ClientesView() {
  const [clientes, setClientes] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Formulario
  const [nombre, setNombre] = useState('');
  const [hostal, setHostal] = useState('');
  const [telefono, setTelefono] = useState('');

  const cargarClientesBD = async () => {
    try {
      const res = await fetch('/api/clientes');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setClientes(data.data);
      }
    } catch (err) {
      console.error('Error al cargar clientes:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarClientesBD();
  }, []);

  const handleAgregarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombre || !hostal) return alert('Ingresa el nombre y el hostal/hospedaje');

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, hostal, telefono })
      });

      const data = await res.json();
      if (data.success) {
        alert('Cliente registrado con éxito');
        setNombre('');
        setHostal('');
        setTelefono('');
        setShowModal(false);
        cargarClientesBD();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de red al registrar el cliente');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">👥 Registro de Clientes</h1>
          <p className="text-slate-500 text-xs">Directorio de surfistas, huéspedes y contactos</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <span>+</span> Registrar Cliente
        </button>
      </div>

      {cargando ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400">
          Cargando clientes desde MySQL...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Nombre del Cliente</th>
                <th className="p-4">Hostal / Hospedaje</th>
                <th className="p-4">Teléfono / Contacto</th>
                <th className="p-4">Fecha Registro</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-slate-400">
                    Sin clientes registrados actualmente.
                  </td>
                </tr>
              ) : (
                clientes.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-bold text-slate-600 text-[10px]">
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      {c.nombre}
                    </td>
                    <td className="p-4 font-semibold text-slate-700">
                      📍 {c.hostal || 'Sin hostal registrado'}
                    </td>
                    <td className="p-4 text-slate-600 font-mono">
                      {c.telefono || 'Sin teléfono'}
                    </td>
                    <td className="p-4 text-slate-400">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString('es-ES') : 'N/A'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Registrar Cliente */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAgregarCliente} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-4">Registrar Nuevo Cliente</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold"
                  placeholder="Ej. Maria Silva"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Hostal / Hotel / Hospedaje</label>
                <input
                  type="text"
                  required
                  value={hostal}
                  onChange={(e) => setHostal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  placeholder="Ej. Hostal La Roca"
                />
              </div>

              <div>
                <label className="text-xs text-slate-500 block mb-1">Teléfono / WhatsApp</label>
                <input
                  type="text"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900"
                  placeholder="Ej. +503 7812 9000"
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 bg-[#0f172a] text-white text-xs font-semibold py-2.5 rounded-xl"
              >
                Guardar Cliente
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}