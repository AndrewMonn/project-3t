'use client';
// @panel Sistema de Solicitudes — agrupaci\u00f3n por sector, filtro, drawer detalle con l\u00ednea de tiempo + PATCH /api/entregas/[id]

import { useState, useEffect, useMemo } from 'react';

interface UserInfo {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

interface HistorialEntry {
  _id: string;
  fecha: string;
  usuario: string;
  accion: 'comentario' | 'cambio_estado';
  contenido: string;
}

interface Entrega {
  _id: string;
  familiaId: {
    _id: string;
    jefeDeHogar: { nombre: string; cedula: string };
    direccion?: { calle: string; nroCasa: string };
    sector?: { _id: string; name: string };
  } | null;
  jornadaId?: { _id: string; tipo: string; fechaJornada: string; estado: string } | null;
  tipoSolicitud: 'beneficio' | 'otra';
  asunto?: string;
  estadoPago: 'pendiente' | 'pagado' | 'verificado';
  montoPagado: number;
  confirmacionEntrega: boolean;
  createdAt: string;
  historial?: HistorialEntry[];
}

export default function SolicitudesPanel({ user }: { user: UserInfo }) {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState('');
  const [selected, setSelected] = useState<Entrega | null>(null);

  async function fetchEntregas() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/entregas?limit=200', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setEntregas(json.data.entregas);
    } catch (e: any) {
      setError(e.message || 'Error al cargar solicitudes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchEntregas(); }, []);

  const grouped = useMemo(() => {
    const filtered = sectorFilter
      ? entregas.filter((e) => e.familiaId?.sector?.name === sectorFilter)
      : entregas;

    const groups: Record<string, Entrega[]> = {};
    for (const e of filtered) {
      const sector = e.familiaId?.sector?.name || 'Sin Sector';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(e);
    }

    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    for (const [, items] of sorted) {
      items.sort((a, b) => {
        const na = a.familiaId?.jefeDeHogar?.nombre || '';
        const nb = b.familiaId?.jefeDeHogar?.nombre || '';
        return na.localeCompare(nb);
      });
    }
    return sorted;
  }, [entregas, sectorFilter]);

  const sectors = useMemo(() => {
    const s = new Set(entregas.map((e) => e.familiaId?.sector?.name).filter(Boolean));
    return Array.from(s).sort((a, b) => (a || '').localeCompare(b || ''));
  }, [entregas]);

  const statusColor = (s: string) => {
    switch (s) {
      case 'pendiente': return 'bg-amber-500/15 text-amber-400';
      case 'pagado': return 'bg-sky-500/15 text-sky-400';
      case 'verificado': return 'bg-emerald-500/15 text-emerald-400';
      default: return 'bg-white/10 text-gray-300';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Solicitudes</h2>
        <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}
          className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors">
          <option value="" className="bg-gray-800">Todos los sectores</option>
          {sectors.map((s) => (
            <option key={s} value={s} className="bg-gray-800">{s}</option>
          ))}
        </select>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-300">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-3" />
          Cargando solicitudes...
        </div>
      )}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl">{error}</div>
      )}
      {!loading && !error && grouped.length === 0 && (
        <div className="text-center py-16 text-gray-400">No hay solicitudes registradas</div>
      )}

      {!loading && !error && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([sector, items]) => (
            <div key={sector} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-sky-500/5">
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">{sector}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{items.length} solicitud(es)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-2.5 font-medium">Solicitante</th>
                      <th className="text-left px-4 py-2.5 font-medium">C&eacute;dula</th>
                      <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                      <th className="text-left px-4 py-2.5 font-medium">Estado</th>
                      <th className="text-left px-4 py-2.5 font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((e) => (
                      <tr key={e._id} onClick={() => setSelected(e)}
                        className="border-b border-white/5 hover:bg-sky-500/5 cursor-pointer transition-colors">
                        <td className="px-4 py-2.5 text-white font-medium">{e.familiaId?.jefeDeHogar?.nombre || 'N/A'}</td>
                        <td className="px-4 py-2.5 text-gray-300">{e.familiaId?.jefeDeHogar?.cedula || 'N/A'}</td>
                        <td className="px-4 py-2.5">
                          <span className="text-gray-300">{e.tipoSolicitud === 'beneficio' ? e.jornadaId?.tipo || 'Beneficio' : e.asunto || 'Otra'}</span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(e.estadoPago)}`}>
                            {e.estadoPago.charAt(0).toUpperCase() + e.estadoPago.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-400">
                          {new Date(e.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <SolicitudDetail
          entrega={selected}
          user={user}
          onClose={() => setSelected(null)}
          onUpdated={(updated) => {
            setEntregas((prev) => prev.map((e) => (e._id === updated._id ? updated : e)));
            setSelected(updated);
          }}
        />
      )}
    </div>
  );
}

function SolicitudDetail({
  entrega,
  user,
  onClose,
  onUpdated,
}: {
  entrega: Entrega;
  user: UserInfo;
  onClose: () => void;
  onUpdated: (e: Entrega) => void;
}) {
  const [estadoPago, setEstadoPago] = useState(entrega.estadoPago);
  const [comentario, setComentario] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  async function handleUpdate() {
    if (!comentario.trim() && estadoPago === entrega.estadoPago) return;
    setUpdating(true);
    setUpdateError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const body: Record<string, string> = {};
      if (estadoPago !== entrega.estadoPago) body.estadoPago = estadoPago;
      if (comentario.trim()) body.comentario = comentario.trim();

      const res = await fetch(`/api/entregas/${entrega._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onUpdated(json.data);
      setComentario('');
    } catch (e: any) {
      setUpdateError(e.message || 'Error al actualizar');
    } finally {
      setUpdating(false);
    }
  }

  const historial: HistorialEntry[] = entrega.historial || [];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div
        className="w-full max-w-lg bg-gray-900 border-l border-white/10 h-full overflow-y-auto animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-gray-900/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
          <h3 className="text-lg font-semibold text-white">Detalle de Solicitud</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-2">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Informaci&oacute;n</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-400">Solicitante:</span>
              <span className="text-white">{entrega.familiaId?.jefeDeHogar?.nombre || 'N/A'}</span>
              <span className="text-gray-400">C&eacute;dula:</span>
              <span className="text-white">{entrega.familiaId?.jefeDeHogar?.cedula || 'N/A'}</span>
              <span className="text-gray-400">Sector:</span>
              <span className="text-white">{entrega.familiaId?.sector?.name || 'N/A'}</span>
              <span className="text-gray-400">Tipo:</span>
              <span className="text-white">{entrega.tipoSolicitud === 'beneficio' ? entrega.jornadaId?.tipo || 'Beneficio' : entrega.asunto || 'Otra'}</span>
              <span className="text-gray-400">Monto:</span>
              <span className="text-white">${(entrega.montoPagado || 0).toLocaleString()}</span>
            </div>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 space-y-3">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Acci&oacute;n</h4>
            {updateError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-2 rounded-lg text-sm">{updateError}</div>
            )}
            <div>
              <label className="block text-xs text-gray-400 mb-1">Estado</label>
              <select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value as 'pendiente' | 'pagado' | 'verificado')}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors">
                <option value="pendiente" className="bg-gray-800">Pendiente</option>
                <option value="pagado" className="bg-gray-800">Pagado</option>
                <option value="verificado" className="bg-gray-800">Verificado</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Comentario</label>
              <textarea value={comentario} onChange={(e) => setComentario(e.target.value)} rows={3}
                className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500 resize-none"
                placeholder="A&ntilde;adir comentario..." />
            </div>
            <button onClick={handleUpdate} disabled={updating || (!comentario.trim() && estadoPago === entrega.estadoPago)}
              className="w-full py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {updating ? 'Actualizando...' : 'Actualizar Solicitud'}
            </button>
          </div>

          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">L&iacute;nea de Tiempo</h4>
            {historial.length === 0 ? (
              <p className="text-gray-500 text-sm italic">Sin historial registrado</p>
            ) : (
              <div className="space-y-0">
                {[...historial].reverse().map((h, i) => (
                  <div key={h._id || i} className="flex gap-3 pb-4 relative">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ring-2 ring-gray-800 ${
                        h.accion === 'cambio_estado' ? 'bg-sky-400' : 'bg-gray-500'
                      }`} />
                      {i < historial.length - 1 && (
                        <div className="w-px flex-1 bg-white/10" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-medium text-white">{h.usuario}</span>
                        <span className="text-[10px] text-gray-500">
                          {new Date(h.fecha).toLocaleString('es-ES', {
                            day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-300 mt-0.5">{h.contenido}</p>
                      <span className={`text-[10px] uppercase tracking-wider mt-0.5 inline-block ${
                        h.accion === 'cambio_estado' ? 'text-sky-400' : 'text-gray-500'
                      }`}>
                        {h.accion === 'cambio_estado' ? 'Cambio de estado' : 'Comentario'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
