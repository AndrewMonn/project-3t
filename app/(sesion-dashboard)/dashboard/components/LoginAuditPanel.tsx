// app/(sesion-dashboard)/dashboard/components/LoginAuditPanel.tsx
// Panel de auditoría de inicios de sesión para administradores.
// Muestra KPIs, tabla de registros y permite filtrar por resultado, email e IP.
'use client';

import { useState, useEffect, useCallback } from 'react';

interface AuditUser { _id: string; name: string; email: string; role: string; }
interface LoginRecord {
  _id:       string;
  userId:    AuditUser | null;
  email:     string;
  ip:        string;
  userAgent: string;
  exitoso:   boolean;
  motivoFallo?: string;
  esPrimeraIpParaUsuario: boolean;
  createdAt: string;
}
interface Kpis { totalExitosos: number; totalFallidos: number; totalNuevasIps: number; }
interface Pagination { page: number; totalPages: number; total: number; }

export default function LoginAuditPanel() {
  const [registros, setRegistros]   = useState<LoginRecord[]>([]);
  const [kpis, setKpis]             = useState<Kpis | null>(null);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, totalPages: 1, total: 0 });
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  // Filtros
  const [filtroEmail, setFiltroEmail]   = useState('');
  const [filtroIp, setFiltroIp]         = useState('');
  const [filtroExitoso, setFiltroExitoso] = useState('');
  const [soloNuevasIps, setSoloNuevasIps] = useState(false);
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filtroEmail)        params.set('email',    filtroEmail);
      if (filtroIp)           params.set('ip',       filtroIp);
      if (filtroExitoso !== '') params.set('exitoso', filtroExitoso);
      if (soloNuevasIps)      params.set('nuevaIp',  'true');

      const res  = await fetch(`/api/audit/logins?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setRegistros(json.data.registros);
      setKpis(json.data.kpis);
      setPagination(json.data.pagination);
    } catch (e: any) {
      setError(e.message || 'Error al cargar auditoría');
    } finally {
      setLoading(false);
    }
  }, [page, filtroEmail, filtroIp, filtroExitoso, soloNuevasIps]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function handleFiltrar() { setPage(1); fetchData(); }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString('es-VE', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Auditoría de Accesos</h2>
        <button
          onClick={fetchData}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* KPIs */}
      {kpis && (
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Logins exitosos',  value: kpis.totalExitosos,  color: 'text-emerald-400' },
            { label: 'Intentos fallidos', value: kpis.totalFallidos, color: 'text-rose-400' },
            { label: 'IPs nuevas',        value: kpis.totalNuevasIps, color: 'text-amber-400' },
          ].map(k => (
            <div key={k.label} className="bg-white/5 border border-white/10 rounded-xl p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{k.label}</p>
              <p className={`text-2xl font-bold ${k.color}`}>{k.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <p className="text-xs text-gray-400 mb-1">Email</p>
          <input
            value={filtroEmail}
            onChange={e => setFiltroEmail(e.target.value)}
            placeholder="usuario@..."
            className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg outline-none w-44"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">IP</p>
          <input
            value={filtroIp}
            onChange={e => setFiltroIp(e.target.value)}
            placeholder="192.168.x.x"
            className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg outline-none w-36"
          />
        </div>
        <div>
          <p className="text-xs text-gray-400 mb-1">Resultado</p>
          <select
            value={filtroExitoso}
            onChange={e => setFiltroExitoso(e.target.value)}
            className="bg-white/10 text-white text-sm px-3 py-1.5 rounded-lg outline-none"
          >
            <option value="">Todos</option>
            <option value="true">Exitosos</option>
            <option value="false">Fallidos</option>
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
          <input
            type="checkbox"
            checked={soloNuevasIps}
            onChange={e => setSoloNuevasIps(e.target.checked)}
            className="rounded"
          />
          Solo IPs nuevas
        </label>
        <button
          onClick={handleFiltrar}
          className="px-4 py-1.5 bg-sky-500 hover:bg-sky-600 text-white text-sm rounded-lg transition-colors"
        >
          Filtrar
        </button>
        <button
          onClick={() => { setFiltroEmail(''); setFiltroIp(''); setFiltroExitoso(''); setSoloNuevasIps(false); setPage(1); }}
          className="px-4 py-1.5 bg-white/10 hover:bg-white/20 text-gray-300 text-sm rounded-lg transition-colors"
        >
          Limpiar
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      {/* Tabla */}
      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-300">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-3" />
          Cargando registros...
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-gray-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Fecha</th>
                  <th className="text-left px-4 py-3">Usuario</th>
                  <th className="text-left px-4 py-3">IP</th>
                  <th className="text-left px-4 py-3">Resultado</th>
                  <th className="text-left px-4 py-3">Detalle</th>
                </tr>
              </thead>
              <tbody>
                {registros.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-gray-500 py-10">
                      No hay registros con los filtros aplicados.
                    </td>
                  </tr>
                )}
                {registros.map(r => (
                  <tr key={r._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                      {formatDate(r.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-white text-xs">{r.userId?.name || '—'}</p>
                      <p className="text-gray-500 text-xs">{r.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-200 bg-white/5 px-2 py-0.5 rounded-lg">{r.ip.replace(/^::ffff:/, '')}</span>
                      {r.esPrimeraIpParaUsuario && (
                        <span className="ml-2 text-xs bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full">
                          Nueva
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        r.exitoso
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-rose-500/15 text-rose-400'
                      }`}>
                        {r.exitoso ? 'Exitoso' : 'Fallido'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {r.motivoFallo
                        ? { credenciales: 'Contraseña incorrecta', captcha: 'Captcha inválido', cuenta_bloqueada: 'Cuenta bloqueada' }[r.motivoFallo] || r.motivoFallo
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/10">
              <p className="text-xs text-gray-500">
                {pagination.total} registros — página {pagination.page} de {pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                  disabled={page === pagination.totalPages}
                  className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
