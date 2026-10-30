'use client';
import { useState, useEffect } from 'react';
import DashboardView from './Components/Dashboard/DashboardView';
import SurfboardsView from './Components/Surfboards/SurfboardsView';
import KillasView from './Components/Killas/KillasView';
import CerasView from './Components/Ceras/CerasView';
import ClientesView from './Components/Clientes/ClientesView';
import RentasView from './Components/Rentas/RentasView';
import ClasesView from './Components/Clases/ClasesView';
import VentasView from './Components/Ventas/VentasView';

export default function Home() {
  const [tabActiva, setTabActiva] = useState<string>('Ventas');
  const [fechaActual, setFechaActual] = useState<string>('');

  useEffect(() => {
    const hoy = new Date();
    const opciones: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    setFechaActual(hoy.toLocaleDateString('es-ES', opciones));
  }, []);

  const tabs = [
    { name: 'Dashboard' },
    { name: 'Surfboards' },
    { name: 'Killas' },
    { name: 'Ceras' },
    { name: 'Clientes' },
    { name: 'Rentas' },
    { name: 'Clases'  },
    { name: 'Ventas' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 font-sans">
      {/* Navbar Superior */}
      <header className="bg-[#0f172a] text-white">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-cyan-400 font-bold text-lg">VibesSurfAcademy</span>
            <span className="text-slate-400 text-xs tracking-widest font-semibold uppercase"></span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-300">
            <span className="capitalize">{fechaActual || 'Cargando fecha...'}</span>
            
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
                
                <span>{tab.name}</span>
              </button>
            );
          })}
        </div>
      </header>-

      {/* Contenido Dinámico por Módulo */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {tabActiva === 'Dashboard' && <DashboardView />}
        {tabActiva === 'Surfboards' && <SurfboardsView />}
        {tabActiva === 'Killas' && <KillasView />}
        {tabActiva === 'Ceras' && <CerasView />}
        {tabActiva === 'Clientes' && <ClientesView />}
        {tabActiva === 'Rentas' && <RentasView />}
        {tabActiva === 'Clases' && <ClasesView />}
        {tabActiva === 'Ventas' && <VentasView />}
      </main>
    </div>
  );
}