'use client';
import { useState, useEffect } from 'react';

export default function KillasView() {
  const [killas, setKillas] = useState<any[]>([]);
  const [cargando, setCargando] = useState<boolean>(true);
  const [showModal, setShowModal] = useState<boolean>(false);

  // Formulario
  const [modelo, setModelo] = useState('');
  const [marca, setMarca] = useState('');
  const [especificaciones, setEspecificaciones] = useState('');
  const [precioVenta, setPrecioVenta] = useState('');
  const [precioRenta, setPrecioRenta] = useState('');
  const [stock, setStock] = useState('1');

  const cargarKillasBD = async () => {
    try {
      const res = await fetch('/api/inventario?categoria=Killa');
      const data = await res.json();
      if (data.success) {
        setKillas(data.data);
      }
    } catch (err) {
      console.error('Error al cargar killas:', err);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarKillasBD();
  }, []);

  const handleAgregarKilla = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modelo || !marca) return alert('Por favor llena modelo y marca');

    try {
      const res = await fetch('/api/inventario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoria: 'Killa',
          nombre_modelo: modelo,
          marca,
          especificaciones,
          precio_venta: precioVenta,
          precio_renta_dia: precioRenta,
          stock
        })
      });

      const data = await res.json();
      if (data.success) {
        alert('Killa agregada al inventario');
        setModelo('');
        setMarca('');
        setEspecificaciones('');
        setPrecioVenta('');
        setPrecioRenta('');
        setShowModal(false);
        cargarKillasBD();
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      alert('Error de red al registrar la killa');
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">⚓ Inventario de Killas</h1>
          <p className="text-slate-500 text-xs">Sistemas FCS, FCS2, Future y quillas simples</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
        >
          <span>+</span> Agregar Killa
        </button>
      </div>

      {cargando ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-xs text-slate-400">
          Cargando killas desde MySQL...
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Modelo / Marca</th>
                <th className="p-4">Sistema / Configuración</th>
                <th className="p-4">Renta/Día</th>
                <th className="p-4">Precio Venta</th>
                <th className="p-4">Stock</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {killas.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No hay killas registradas en el inventario.
                  </td>
                </tr>
              ) : (
                killas.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4 font-bold text-slate-900">
                      {k.nombre_modelo} <span className="font-normal text-slate-400">({k.marca})</span>
                    </td>
                    <td className="p-4 text-slate-500">{k.especificaciones || 'N/A'}</td>
                    <td className="p-4 font-semibold text-cyan-600">${Number(k.precio_renta_dia).toFixed(2)}</td>
                    <td className="p-4 font-semibold text-slate-800">${Number(k.precio_venta).toFixed(2)}</td>
                    <td className="p-4 font-bold">{k.stock} u.</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        k.estado === 'Disponible' ? 'bg-emerald-100 text-emerald-800' :
                        k.estado === 'En Renta' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {k.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Agregar Killa */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAgregarKilla} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-4">Agregar Nueva Killa</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Modelo</label>
                <input type="text" required value={modelo} onChange={(e) => setModelo(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" placeholder="Ej. Performer Neo Glass" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Marca</label>
                <input type="text" required value={marca} onChange={(e) => setMarca(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" placeholder="Ej. FCS2" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Sistema / Specs</label>
                <input type="text" value={especificaciones} onChange={(e) => setEspecificaciones(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" placeholder="Ej. Tri-fin Medium" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Renta/Día ($)</label>
                  <input type="number" step="0.01" value={precioRenta} onChange={(e) => setPrecioRenta(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" placeholder="5.00" />
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">Venta ($)</label>
                  <input type="number" step="0.01" value={precioVenta} onChange={(e) => setPrecioVenta(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" placeholder="75.00" />
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Stock Inicial</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="flex-1 bg-[#0f172a] text-white text-xs font-semibold py-2.5 rounded-xl">
                Guardar Killa
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}