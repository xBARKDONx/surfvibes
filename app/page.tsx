'use client';
import { useState, useEffect } from 'react';

export default function Home() {
  // Estado para prevenir parpadeo al recargar
  const [cargandoStorage, setCargandoStorage] = useState<boolean>(true);

  // Pestaña activa
  const [tabActiva, setTabActiva] = useState<string>('Ventas');

  // Estado de Caja
  const [cajaAbierta, setCajaAbierta] = useState<boolean>(false);
  const [montoInicio, setMontoInicio] = useState<number>(0.00);
  const [showModalAbrirCaja, setShowModalAbrirCaja] = useState<boolean>(false);
  const [inputMontoInicio, setInputMontoInicio] = useState<string>('250.00');

  // Estado Modal Cierre de Caja
  const [showModalCerrarCaja, setShowModalCerrarCaja] = useState<boolean>(false);
  const [efectivoContado, setEfectivoContado] = useState<string>('');

  // Estados Financieros
  const [totalEgresos, setTotalEgresos] = useState<number>(0.00);
  const [efectivoEsperado, setEfectivoEsperado] = useState<number>(0.00);

  // Modales de Operaciones
  const [showModalVenderCera, setShowModalVenderCera] = useState<boolean>(false);
  const [showModalVentaVariable, setShowModalVentaVariable] = useState<boolean>(false);
  const [showModalEgreso, setShowModalEgreso] = useState<boolean>(false);

  // Modal para Propina Tarjeta
  const [showModalPropina, setShowModalPropina] = useState<boolean>(false);
  const [porcentajePropinaInput, setPorcentajePropinaInput] = useState<string>('3');
  const [operacionPendiente, setOperacionPendiente] = useState<any>(null);

  // Formulario Vender Cera
  const [marcaCera, setMarcaCera] = useState<string>('Sticky Bumps');
  const [precioCera, setPrecioCera] = useState<number>(10.00);

  // Formulario Venta Variable
  const [montoVariable, setMontoVariable] = useState<string>('');
  const [conceptoVariable, setConceptoVariable] = useState<string>('');
  const [metodoPagoVariable, setMetodoPagoVariable] = useState<string>('Efectivo');

  // Formulario Egreso
  const [montoEgreso, setMontoEgreso] = useState<string>('');
  const [motivoEgreso, setMotivoEgreso] = useState<string>('');

  // Historiales
  const [transacciones, setTransacciones] = useState<any[]>([]);
  const [egresos, setEgresos] = useState<any[]>([]);

  // 1. Cargar Estado de localStorage INMEDIATAMENTE al montar
  useEffect(() => {
    const estadoGuardado = localStorage.getItem('vibeswell_caja_state');
    if (estadoGuardado) {
      try {
        const parsed = JSON.parse(estadoGuardado);
        if (parsed.cajaAbierta !== undefined) setCajaAbierta(parsed.cajaAbierta);
        if (parsed.montoInicio !== undefined) setMontoInicio(parsed.montoInicio);
        if (parsed.efectivoEsperado !== undefined) setEfectivoEsperado(parsed.efectivoEsperado);
        if (parsed.totalEgresos !== undefined) setTotalEgresos(parsed.totalEgresos);
        if (parsed.transacciones) setTransacciones(parsed.transacciones);
        if (parsed.egresos) setEgresos(parsed.egresos);
      } catch (e) {
        console.error('Error al leer localStorage:', e);
      }
    }
    setCargandoStorage(false);
  }, []);

  // 2. Guardar Estado cuando Cambia Algo (solo si ya terminó de cargar)
  useEffect(() => {
    if (cargandoStorage) return;

    const estadoGuardar = {
      cajaAbierta,
      montoInicio,
      efectivoEsperado,
      totalEgresos,
      transacciones,
      egresos
    };
    localStorage.setItem('vibeswell_caja_state', JSON.stringify(estadoGuardar));
  }, [cajaAbierta, montoInicio, efectivoEsperado, totalEgresos, transacciones, egresos, cargandoStorage]);

  // Helper para guardar en MySQL mediante API
  const guardarTransaccionBD = async (datos: {
    tipo: string;
    descripcion: string;
    monto: number;
    metodo_pago: string;
    propina?: number;
  }) => {
    try {
      const response = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos)
      });

      if (!response.ok) {
        const textError = await response.text();
        console.error('Error HTTP del servidor:', response.status, textError);
        alert(`Error en el servidor (${response.status}). Revisa app/api/caja/route.ts`);
        return;
      }

      const resData = await response.json();
      if (!resData.success) {
        alert('Error en MySQL: ' + (resData.details || resData.error));
      }
    } catch (err) {
      console.error('Error al conectar con la API de BD:', err);
      alert('Error de red al conectar con el servidor.');
    }
  };

  // Abrir Caja
  const handleAbrirCaja = () => {
    const inicio = Number(inputMontoInicio) || 250.00;
    setMontoInicio(inicio);
    setEfectivoEsperado(inicio);
    setCajaAbierta(true);
    setShowModalAbrirCaja(false);
  };

  // Abrir Modal Cierre
  const handleOpenCerrarCaja = () => {
    setEfectivoContado(efectivoEsperado.toFixed(2));
    setShowModalCerrarCaja(true);
  };

  // Confirmar Cierre de Caja
  const handleConfirmarCierre = () => {
    setCajaAbierta(false);
    setEfectivoEsperado(0.00);
    setTotalEgresos(0.00);
    setTransacciones([]);
    setEgresos([]);
    localStorage.removeItem('vibeswell_caja_state');
    setShowModalCerrarCaja(false);
    alert('Caja cerrada correctamente');
  };

  // Iniciar Venta de Cera
  const handleConfirmarVentaCera = (metodoPago: 'Efectivo' | 'Tarjeta') => {
    if (!cajaAbierta) return alert('Debes abrir la caja primero');
    const precio = Number(precioCera);
    if (isNaN(precio) || precio <= 0) return alert('Precio inválido');

    if (metodoPago === 'Tarjeta') {
      setOperacionPendiente({
        tipo: 'Cera',
        descripcion: `Venta Cera ${marcaCera}`,
        monto: precio,
        metodoPago: 'Tarjeta'
      });
      setPorcentajePropinaInput('3');
      setShowModalVenderCera(false);
      setShowModalPropina(true);
    } else {
      procesarTransaccionFinal('Cera', `Venta Cera ${marcaCera}`, precio, 'Efectivo', 0);
      setShowModalVenderCera(false);
    }
  };

  // Procesar Transacción Final
  const procesarTransaccionFinal = async (
    tipo: string,
    descripcion: string,
    monto: number,
    metodoPago: string,
    propinaMonto: number
  ) => {
    if (metodoPago === 'Efectivo') {
      setEfectivoEsperado(prev => prev + monto);
    }

    const nuevaTransaccion = {
      id: Date.now(),
      tipo,
      descripcion,
      monto,
      propina: propinaMonto,
      metodo_pago: metodoPago,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setTransacciones(prev => [nuevaTransaccion, ...prev]);

    await guardarTransaccionBD({
      tipo,
      descripcion,
      monto,
      metodo_pago: metodoPago,
      propina: propinaMonto
    });
  };

  // Confirmar Propina desde Modal
  const handleConfirmarPropina = () => {
    const pct = Number(porcentajePropinaInput);
    if (isNaN(pct) || pct < 0) return alert('Ingresa un número válido para el porcentaje');

    const propinaCalculada = Number(((operacionPendiente.monto * pct) / 100).toFixed(2));

    procesarTransaccionFinal(
      operacionPendiente.tipo,
      operacionPendiente.descripcion,
      operacionPendiente.monto,
      'Tarjeta',
      propinaCalculada
    );

    setShowModalPropina(false);
    setOperacionPendiente(null);
  };

  // Confirmar Venta Variable
  const handleConfirmarVentaVariable = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaAbierta) return alert('Debes abrir la caja primero');
    const monto = Number(montoVariable);
    if (isNaN(monto) || monto <= 0) return alert('Monto inválido');

    if (metodoPagoVariable === 'Tarjeta') {
      setOperacionPendiente({
        tipo: 'Ingreso_Externo',
        descripcion: conceptoVariable || 'Venta Variable',
        monto,
        metodoPago: 'Tarjeta'
      });
      setPorcentajePropinaInput('3');
      setShowModalVentaVariable(false);
      setShowModalPropina(true);
    } else {
      procesarTransaccionFinal('Ingreso_Externo', conceptoVariable || 'Venta Variable', monto, 'Efectivo', 0);
      setMontoVariable('');
      setConceptoVariable('');
      setShowModalVentaVariable(false);
    }
  };

  // Confirmar Egreso
  const handleConfirmarEgreso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cajaAbierta) return alert('Debes abrir la caja primero');
    const monto = Number(montoEgreso);
    if (isNaN(monto) || monto <= 0) return alert('Monto inválido');

    setTotalEgresos(prev => prev + monto);
    setEfectivoEsperado(prev => prev - monto);

    const nuevoEgreso = {
      id: Date.now(),
      motivo: motivoEgreso || 'Egreso general',
      monto,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setEgresos(prev => [nuevoEgreso, ...prev]);
    setMontoEgreso('');
    setMotivoEgreso('');
    setShowModalEgreso(false);

    await guardarTransaccionBD({
      tipo: 'Egreso',
      descripcion: motivoEgreso || 'Egreso general',
      monto,
      metodo_pago: 'Efectivo',
      propina: 0.00
    });
  };

  // Cálculo para diferencia de Arqueo
  const valContado = Number(efectivoContado) || 0;
  const diferencia = valContado - efectivoEsperado;
  const cuadraExacto = Math.abs(diferencia) < 0.01;

  const tabs = [
    { name: 'Dashboard', icon: '⚽' },
    { name: 'Surfboards', icon: '🏄' },
    { name: 'Kias', icon: '⚓' },
    { name: 'Ceras', icon: '🧼' },
    { name: 'Clientes', icon: '👥' },
    { name: 'Rentas', icon: '📋' },
    { name: 'Clases', icon: '🎓' },
    { name: 'Ventas', icon: '🛒' },
  ];

  if (cargandoStorage) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center text-slate-400 text-xs font-semibold">
        Cargando estado de la caja...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      
      {/* Navbar Superior */}
      <header className="bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-lg">≈ Vibeswell</span>
            <span className="text-slate-400 text-xs tracking-widest font-semibold uppercase">SURF</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span>jueves, 3 de septiembre</span>
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-white">
              V
            </div>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1 overflow-x-auto py-1">
          {tabs.map((tab) => {
            const isActive = tabActiva === tab.name;
            return (
              <button
                key={tab.name}
                onClick={() => setTabActiva(tab.name)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md transition-all ${
                  isActive 
                    ? 'bg-slate-800/80 text-white border border-slate-700 shadow-sm' 
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/40'
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tabActiva === 'Ventas' ? (
          <div>
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-slate-900">Ventas</h1>
              <p className="text-slate-500 text-xs">Control de caja y registro de ventas</p>
            </div>

            {/* Banner Estado de Caja */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 mb-6 flex justify-between items-center shadow-sm">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 text-lg">
                  {cajaAbierta ? '🔓' : '🔒'}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {cajaAbierta ? 'Caja abierta' : 'Caja cerrada'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {cajaAbierta ? `Caja iniciada con $${montoInicio.toFixed(2)}` : 'Inicia la caja para llevar el control del día'}
                  </p>
                </div>
              </div>

              {!cajaAbierta ? (
                <button
                  onClick={() => setShowModalAbrirCaja(true)}
                  className="bg-[#0f172a] hover:bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <span>🔓</span> Abrir caja
                </button>
              ) : (
                <button
                  onClick={handleOpenCerrarCaja}
                  className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
                >
                  <span>🔒</span> Cerrar caja
                </button>
              )}
            </div>

            {/* Métricas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-rose-500 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 flex items-center justify-center text-xs font-bold">
                    📉
                  </div>
                  <span className="text-xs font-bold text-slate-500">Total egresos</span>
                </div>
                <p className="text-3xl font-extrabold text-slate-900">${totalEgresos.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">{egresos.length} egresos</p>
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center gap-2 text-slate-700 mb-2">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-xs font-bold">
                    🛒
                  </div>
                  <span className="text-xs font-bold text-slate-500">Efectivo esperado</span>
                </div>
                <p className="text-3xl font-extrabold text-slate-900">${efectivoEsperado.toFixed(2)}</p>
                <p className="text-xs text-slate-400 mt-1">
                  {cajaAbierta ? 'Monto calculated según operaciones' : 'Abre la caja para llevar el control'}
                </p>
              </div>
            </div>

            {/* Botones de Acción */}
            <div className="flex flex-wrap gap-3 mb-6">
              <button
                onClick={() => setShowModalVenderCera(true)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <span>🧼</span> Vender cera
              </button>

              <button
                onClick={() => setShowModalVentaVariable(true)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <span>🏷️</span> Venta variable
              </button>

              <button
                onClick={() => setShowModalEgreso(true)}
                className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2"
              >
                <span>💸</span> Registrar egreso
              </button>
            </div>

            {/* Tablas de Transacciones e Historial */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Transacciones</h3>
                  <span className="text-xs text-slate-400">{transacciones.length} ventas</span>
                </div>

                {transacciones.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-8">
                    <span className="text-3xl mb-2">🛒</span>
                    <p className="text-xs text-slate-400 font-medium">Sin ventas registradas</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-60">
                    {transacciones.map((t) => (
                      <div key={t.id} className="flex justify-between items-center text-xs p-2 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-bold text-slate-800">{t.descripcion}</p>
                          <span className="text-[10px] text-slate-400">
                            {t.hora} • {t.metodo_pago} {t.propina > 0 ? `(Propina: $${t.propina.toFixed(2)})` : ''}
                          </span>
                        </div>
                        <span className="font-bold text-emerald-600">+${t.monto.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[220px]">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm">Historial de egresos</h3>
                </div>

                {egresos.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 py-8">
                    <p className="text-xs text-slate-400 font-medium">Sin egresos registrados</p>
                  </div>
                ) : (
                  <div className="space-y-2 overflow-y-auto max-h-60">
                    {egresos.map((e) => (
                      <div key={e.id} className="flex justify-between items-center text-xs p-2 bg-rose-50/50 rounded-lg">
                        <div>
                          <p className="font-bold text-slate-800">{e.motivo}</p>
                          <span className="text-[10px] text-slate-400">{e.hora}</span>
                        </div>
                        <span className="font-bold text-rose-600">-${e.monto.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
            <h2 className="text-xl font-bold text-slate-800 mb-2">Módulo de {tabActiva}</h2>
            <p className="text-xs text-slate-400">Resumen general de Vibeswell Surf</p>
          </div>
        )}
      </main>

      {/* MODAL: Propina Porcentaje Tarjeta */}
      {showModalPropina && operacionPendiente && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-1">💳 Venta con Tarjeta</h3>
            <p className="text-xs text-slate-500 mb-4">
              Ingresa el % de propina para la venta de <span className="font-bold text-slate-800">${operacionPendiente.monto.toFixed(2)}</span>.
            </p>

            <div className="mb-4">
              <label className="text-xs text-slate-500 block mb-1">Porcentaje de Propina (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={porcentajePropinaInput}
                onChange={(e) => setPorcentajePropinaInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900"
                placeholder="Ej. 3"
              />
            </div>

            <div className="bg-cyan-50 border border-cyan-200 p-3 rounded-xl mb-5 text-xs text-cyan-800">
              Propina calculada: <span className="font-extrabold">${((operacionPendiente.monto * (Number(porcentajePropinaInput) || 0)) / 100).toFixed(2)}</span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowModalPropina(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">
                Cancelar
              </button>
              <button onClick={handleConfirmarPropina} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold py-2.5 rounded-xl font-bold">
                Confirmar Venta
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Abrir Caja */}
      {showModalAbrirCaja && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-1">Abrir Caja del Día</h3>
            <p className="text-xs text-slate-500 mb-4">Ingresa el dinero inicial disponible en caja ($250 por defecto).</p>
            <input
              type="number"
              value={inputMontoInicio}
              onChange={(e) => setInputMontoInicio(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-semibold mb-4 text-slate-900"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowModalAbrirCaja(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">
                Cancelar
              </button>
              <button onClick={handleAbrirCaja} className="flex-1 bg-[#0f172a] text-white text-xs font-semibold py-2.5 rounded-xl">
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Cerrar Caja */}
      {showModalCerrarCaja && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-1">Cierre y Arqueo de Caja</h3>
            <p className="text-xs text-slate-500 mb-4">Ingresa el efectivo total físico en caja para validar.</p>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-4">
              <p className="text-[11px] text-slate-400 font-semibold uppercase">Efectivo Esperado</p>
              <p className="text-xl font-extrabold text-slate-800">${efectivoEsperado.toFixed(2)}</p>
            </div>

            <div className="mb-4">
              <label className="text-xs text-slate-500 block mb-1">Efectivo Físico Contado ($)</label>
              <input
                type="number"
                step="0.01"
                value={efectivoContado}
                onChange={(e) => setEfectivoContado(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold text-slate-900"
              />
            </div>

            <div className={`p-3 rounded-xl text-xs font-semibold mb-5 flex justify-between items-center ${
              cuadraExacto 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border border-rose-200'
            }`}>
              <span>{cuadraExacto ? '✓ La caja cuadra perfectamente' : '⚠ La caja no cuadra'}</span>
              <span className="font-bold">
                {cuadraExacto ? '$0.00' : `${diferencia > 0 ? '+' : ''}$${diferencia.toFixed(2)}`}
              </span>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setShowModalCerrarCaja(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">
                Cancelar
              </button>
              <button onClick={handleConfirmarCierre} className="flex-1 bg-rose-600 text-white text-xs font-semibold py-2.5 rounded-xl">
                Confirmar cierre
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Vender Cera */}
      {showModalVenderCera && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-4">Vender Cera</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Marca</label>
                <select value={marcaCera} onChange={(e) => setMarcaCera(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900">
                  <option value="Sticky Bumps">Sticky Bumps</option>
                  <option value="Sex Wax">Sex Wax</option>
                  <option value="Fu Wax">Fu Wax</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Precio ($)</label>
                <input type="number" value={precioCera} onChange={(e) => setPrecioCera(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleConfirmarVentaCera('Efectivo')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all">
                $ Efectivo
              </button>
              <button onClick={() => handleConfirmarVentaCera('Tarjeta')} className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-semibold py-2.5 rounded-xl transition-all">
                💳 Tarjeta
              </button>
            </div>
            <button onClick={() => setShowModalVenderCera(false)} className="w-full mt-2 text-xs text-slate-400 py-1">Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL: Venta Variable */}
      {showModalVentaVariable && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleConfirmarVentaVariable} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-4">Venta Variable</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Monto ($)</label>
                <input type="number" step="0.01" value={montoVariable} onChange={(e) => setMontoVariable(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Concepto</label>
                <input type="text" value={conceptoVariable} onChange={(e) => setConceptoVariable(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" placeholder="Ej. Pago parcial" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Método</label>
                <select value={metodoPagoVariable} onChange={(e) => setMetodoPagoVariable(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900">
                  <option value="Efectivo">Efectivo</option>
                  <option value="Tarjeta">Tarjeta</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModalVentaVariable(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="flex-1 bg-[#0f172a] text-white text-xs font-semibold py-2.5 rounded-xl">
                Guardar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Registrar Egreso */}
      {showModalEgreso && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleConfirmarEgreso} className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-slate-900 text-base mb-4 text-rose-600">Registrar Egreso</h3>
            <div className="space-y-3 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">Monto ($)</label>
                <input type="number" step="0.01" value={montoEgreso} onChange={(e) => setMontoEgreso(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 font-semibold" placeholder="0.00" />
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">Motivo</label>
                <input type="text" value={motivoEgreso} onChange={(e) => setMotivoEgreso(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900" placeholder="Ej. Agua mineral" />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowModalEgreso(false)} className="flex-1 bg-slate-100 text-slate-600 text-xs font-semibold py-2.5 rounded-xl">
                Cancelar
              </button>
              <button type="submit" className="flex-1 bg-rose-600 text-white text-xs font-semibold py-2.5 rounded-xl">
                Registrar Egreso
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}