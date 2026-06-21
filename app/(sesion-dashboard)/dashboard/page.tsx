'use client';
// Pagina principal del Dashboard — SPA con sidebar, tabs y paneles modulares

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from "next/navigation";
import UsersPanel from './components/UsersPanel';
import BlogEditor from './components/BlogEditor';
import SolicitudesPanel from './components/SolicitudesPanel';
import AuditReports from './components/AuditReports';
import LoginAuditPanel from "./components/LoginAuditPanel";
import CensoPanel from './components/CensoPanel';

type TabId = 'usuarios' | 'blog' | 'solicitudes' | 'reportes' | 'auditoria' | 'censo';
// Identificadores de las pestañas del dashboard

interface UserInfo {
  userId: string;
  email: string;
  role: string;
  name?: string;
}
// Datos del usuario autenticado extraidos del JWT/token

const TABS: { id: TabId; label: string; adminOnly?: boolean }[] = [
  { id: 'usuarios', label: 'Usuarios', adminOnly: true },
  { id: 'censo', label: 'Censo' },
  { id: 'blog', label: 'Blog' },
  { id: 'solicitudes', label: 'Solicitudes' },
  { id: 'reportes', label: 'Reportes', adminOnly: true },
  { id: 'auditoria', label: 'Auditoría de Accesos', adminOnly: true },
];

export default function DashboardPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [token, setToken] = useState<string>("");
  const [activeTab, setActiveTab] = useState<TabId>("solicitudes");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const router = useRouter();

  function handleLogout() {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");
      router.push("/login");
  }

  // Recupera datos del usuario y el token desde el almacenamiento local
  useEffect(() => {
    const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (rawUser) {
      try { setUser(JSON.parse(rawUser)); } catch { /* ignora errores de parseo */ }
    }
    const rawToken = localStorage.getItem('token') || sessionStorage.getItem('token');
    if (rawToken) setToken(rawToken);
  }, []);

  const isAdmin = user?.role === 'administrador'; // Verifica rol administrador
  const visibleTabs = TABS.filter((t) => !t.adminOnly || isAdmin); // Filtra tabs segun rol

  // Si el usuario no es admin y esta en una pestana de admin, redirige a solicitudes
  useEffect(() => {
    const tabActual = TABS.find((t) => t.id === activeTab);
    if (!isAdmin && tabActual?.adminOnly) setActiveTab('solicitudes');
  }, [isAdmin, activeTab]);

  const renderTab = useCallback(() => {
    switch (activeTab) {
      case 'usuarios': return <UsersPanel />;
      case 'blog': return <BlogEditor token={token} />;
      case 'solicitudes': return <SolicitudesPanel user={user!} />;
      case 'reportes': return <AuditReports user={user!} />;
      case 'auditoria': return <LoginAuditPanel />;
      case 'censo': return <CensoPanel />;
    }
  }, [activeTab, user, token]);

  return (
      <div className="flex h-full w-full overflow-hidden">
          <div
              className={`fixed inset-0 bg-black/60 z-20 md:hidden ${sidebarOpen ? "block" : "hidden"}`}
              onClick={() => setSidebarOpen(false)}
          />
          <aside
              className={`
            fixed top-0 md:top-[85px] left-0 z-30 w-64
            h-dvh md:h-[calc(100dvh-85px)]
            bg-white/5 backdrop-blur-xl border-r border-white/10
            flex flex-col transition-transform duration-300
            ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
          `}
          >
              <div className="p-5 border-b border-white/10 shrink-0">
                  <h1 className="text-lg font-bold text-white">
                      {isAdmin ? 'Panel de Administración' : 'Panel de Gestión'}
                  </h1>
                  <p className="text-xs text-gray-400 mt-0.5">
                      Comunidad Reina la Cruz
                  </p>
              </div>
              <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                  {visibleTabs.map((t) => (
                      <button
                          key={t.id}
                          onClick={() => {
                              setActiveTab(t.id);
                              setSidebarOpen(false);
                          }}
                          className={`
                    w-full text-left px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                    ${
                        activeTab === t.id
                            ? "bg-sky-500/15 text-sky-400 border-l-2 border-sky-400"
                            : "text-gray-300 hover:bg-white/5 hover:text-white"
                    }
                  `}
                      >
                          {t.label}
                      </button>
                  ))}
              </nav>
              <div className="p-4 border-t border-white/10 shrink-0 space-y-2">
                  <div>
                      <p className="text-sm text-white truncate">
                          {user?.email || "Usuario"}
                      </p>
                      <p className="text-xs text-gray-400 capitalize">
                          {user?.role || ""}
                      </p>
                  </div>
                  <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 rounded-xl transition-colors"
                  >
                      <svg
                          className="w-4 h-4 shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                      >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                          />
                      </svg>
                      Cerrar Sesi&oacute;n
                  </button>
              </div>
          </aside>

          <div className="flex-1 flex flex-col min-w-0 h-full md:ml-64">
              <header className="flex items-center gap-3 p-4 border-b border-white/10 bg-white/[0.02] backdrop-blur-sm md:hidden">
                  <button
                      onClick={() => setSidebarOpen(true)}
                      className="text-white p-1"
                  >
                      <svg
                          className="w-6 h-6"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                      >
                          <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 6h16M4 12h16M4 18h16"
                          />
                      </svg>
                  </button>
                  <h2 className="text-lg font-semibold text-white">
                      {TABS.find((t) => t.id === activeTab)?.label || "Panel"}
                  </h2>
              </header>

              <div className="flex-1 overflow-y-auto p-4 md:p-6">
                  {renderTab()}
              </div>
          </div>
      </div>
  );
}
