'use client';
// Pagina principal del Dashboard — SPA con sidebar, tabs y paneles modulares

import { useState, useEffect, useCallback } from 'react';
import UsersPanel from './components/UsersPanel';
import BlogEditor from './components/BlogEditor';
import SolicitudesPanel from './components/SolicitudesPanel';
import AuditReports from './components/AuditReports';
// Importa los 4 paneles del dashboard

type TabId = 'usuarios' | 'blog' | 'solicitudes' | 'reportes';
// Identificadores de las pestañas del dashboard

interface UserInfo {
  userId: string;
  email: string;
  role: string;
  name?: string;
}
// Datos del usuario autenticado extraidos del JWT/token

const TABS: { id: TabId; label: string; adminOnly?: boolean }[] = [
  { id: 'usuarios', label: 'Usuarios', adminOnly: true }, // Solo visible para administradores
  { id: 'blog', label: 'Blog' },
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'reportes', label: 'Reportes' },
];

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null); // Usuario autenticado
  const [activeTab, setActiveTab] = useState<TabId>('solicitudes'); // Pestana activa
  const [sidebarOpen, setSidebarOpen] = useState(false); // Sidebar responsive (mobile)

  // Recupera datos del usuario desde el almacenamiento local
  useEffect(() => {
    const raw = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (raw) {
      try { setUser(JSON.parse(raw)); } catch { /* ignora errores de parseo */ }
    }
  }, []);

  const isAdmin = user?.role === 'administrador'; // Verifica rol administrador
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin); // Filtra tabs segun rol

  // Si el usuario no es admin y esta en la pestana de usuarios, redirige a solicitudes
  useEffect(() => {
    if (!isAdmin && activeTab === 'usuarios') setActiveTab('solicitudes');
  }, [isAdmin, activeTab]);

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case 'usuarios': return <UsersPanel />;
      case 'blog': return <BlogEditor />;
      case 'solicitudes': return <SolicitudesPanel user={user!} />;
      case 'reportes': return <AuditReports />;
    }
  }, [activeTab, user]);

  return (
    <div className="flex h-full w-full">
      {isAdmin && (
        <>
          <div
            className={`fixed inset-0 bg-black/60 z-20 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`}
            onClick={() => setSidebarOpen(false)}
          />
          <aside className={`
            fixed md:sticky top-0 left-0 z-30 h-full w-64
            bg-white/5 backdrop-blur-xl border-r border-white/10
            flex flex-col transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}>
            <div className="p-5 border-b border-white/10">
              <h1 className="text-lg font-bold text-white">Panel de Administraci&oacute;n</h1>
              <p className="text-xs text-gray-400 mt-0.5">Comunidad Reina la Cruz</p>
            </div>
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setActiveTab(t.id); setSidebarOpen(false); }}
                  className={`
                    w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${activeTab === t.id
                      ? 'bg-sky-500/15 text-sky-400 border-l-2 border-sky-400'
                      : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }
                  `}
                >
                  {t.label}
                </button>
              ))}
            </nav>
            <div className="p-4 border-t border-white/10">
              <p className="text-sm text-white truncate">{user?.email || 'Usuario'}</p>
              <p className="text-xs text-gray-400 capitalize">{user?.role || ''}</p>
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <header className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-sm md:hidden">
          {isAdmin && (
            <button onClick={() => setSidebarOpen(true)} className="text-white p-1">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-semibold text-white">
            {TABS.find((t) => t.id === activeTab)?.label || 'Panel'}
          </h2>
        </header>

        {!isAdmin && (
          <header className="p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-sm">
            <h2 className="text-lg font-semibold text-white">Panel de Gestión</h2>
            <p className="text-xs text-gray-400 mt-0.5">{user?.email}</p>
            <div className="flex gap-2 mt-3 overflow-x-auto">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                    activeTab === t.id
                      ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                      : 'text-gray-300 bg-white/5 border border-white/10 hover:bg-white/10'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </header>
        )}

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderTab()}
        </div>
      </div>
    </div>
  );
}
