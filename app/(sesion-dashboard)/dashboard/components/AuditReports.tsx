'use client';
// @panel Auditor\u00eda y Reportes — KPIs, tabla hist\u00f3rica por sector, generaci\u00f3n PDF con @libpdf/core

import { useState, useEffect, useMemo } from 'react';

interface Entrega {
  _id: string;
  familiaId: {
    _id: string;
    jefeDeHogar: { nombre: string; cedula: string };
    sector?: { _id: string; name: string };
  } | null;
  jornadaId?: { _id: string; tipo: string; fechaJornada: string; estado: string } | null;
  tipoSolicitud: 'beneficio' | 'otra';
  asunto?: string;
  estadoPago: 'pendiente' | 'pagado' | 'verificado';
  montoPagado: number;
  confirmacionEntrega: boolean;
  createdAt: string;
}

interface UserInfo {
  userId: string;
  email: string;
  role: string;
  name?: string;
}

export default function AuditReports({ user }: { user: UserInfo }) {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [ip, setIp] = useState('');
  const [loadedAt, setLoadedAt] = useState<string>('');

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const [res, ipRes] = await Promise.all([
        fetch('/api/entregas?limit=500', {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch('https://api.ipify.org?format=json').catch(() => null),
      ]);
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setEntregas(json.data.entregas);
      setLoadedAt(new Date().toLocaleString('es-ES', {
        day: '2-digit', month: 'long', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      }));
      if (ipRes) {
        try {
          const ipJson = await ipRes.json();
          if (ipJson?.ip) setIp(ipJson.ip);
        } catch { /* ignora error de parseo IP */ }
      }
    } catch (e: any) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const kpis = useMemo(() => {
    const total = entregas.length;
    const resueltas = entregas.filter((e) => e.estadoPago === 'verificado' || (e.estadoPago === 'pagado' && e.confirmacionEntrega)).length;
    const pagadas = entregas.filter((e) => e.estadoPago === 'pagado' || e.estadoPago === 'verificado').length;
    const pendientes = entregas.filter((e) => e.estadoPago === 'pendiente').length;
    const totalMonto = entregas.reduce((s, e) => s + (e.montoPagado || 0), 0);
    return { total, resueltas, pagadas, pendientes, totalMonto, tasaResolucion: total > 0 ? Math.round((resueltas / total) * 100) : 0 };
  }, [entregas]);

  const grouped = useMemo(() => {
    const groups: Record<string, Entrega[]> = {};
    for (const e of entregas) {
      const sector = e.familiaId?.sector?.name || 'Sin Sector';
      if (!groups[sector]) groups[sector] = [];
      groups[sector].push(e);
    }
    const sorted = Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
    for (const [, items] of sorted) {
      items.sort((a, b) => (a.familiaId?.jefeDeHogar?.nombre || '').localeCompare(b.familiaId?.jefeDeHogar?.nombre || ''));
    }
    return sorted;
  }, [entregas]);

  async function handleGeneratePdf() {
    setGeneratingPdf(true);
    try {
      const { PDF, rgb } = await import('@libpdf/core');
      const pdf = PDF.create();
      const pageWidth = 595.28;
      const pageHeight = 841.89;
      const margin = 50;
      const usableWidth = pageWidth - margin * 2;

      let y = pageHeight - margin;
      let page = pdf.addPage({ size: 'a4' });

      function addPageIfNeeded(needed: number) {
        if (y - needed < margin) {
          page = pdf.addPage({ size: 'a4' });
          y = pageHeight - margin;
        }
      }

      page.drawText('Comuna Una Sola Fuerza - Consejo Comunal Reina La Cruz', {
        x: margin, y, size: 14, color: rgb(0, 0.4, 0.8),
      });
      y -= 22;

      page.drawRectangle({
        x: margin, y: y - 2, width: usableWidth, height: 1,
        color: rgb(0, 0.4, 0.8),
      });
      y -= 20;

      page.drawText('REPORTE DE AUDITORIA - SOLICITUDES', {
        x: margin, y, size: 18, color: rgb(0.1, 0.1, 0.1),
      });
      y -= 26;

      page.drawRectangle({
        x: margin, y: y - 4, width: usableWidth, height: 50,
        color: rgb(0.97, 0.97, 0.97), borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5,
      });
      const metaData = [
        { label: 'Generado por', value: user.name || user.email },
        { label: 'Rol', value: user.role },
        { label: 'Fecha', value: new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) },
        { label: 'Hora', value: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) },
        { label: 'IP', value: ip || 'No disponible' },
      ];
      let metaX = margin + 8;
      const metaColWidth = (usableWidth - 16) / metaData.length;
      for (const m of metaData) {
        page.drawText(`${m.label}:`, {
          x: metaX, y: y + 30, size: 7, color: rgb(0.4, 0.4, 0.4),
        });
        page.drawText(m.value, {
          x: metaX, y: y + 18, size: 9, color: rgb(0.1, 0.1, 0.1),
        });
        metaX += metaColWidth;
      }
      y -= 70;

      page.drawRectangle({
        x: margin, y: y - 2, width: usableWidth, height: 55,
        color: rgb(0.95, 0.95, 0.95), borderColor: rgb(0.8, 0.8, 0.8), borderWidth: 0.5,
      });
      const kpiData = [
        { label: 'Total Solicitudes', value: kpis.total },
        { label: 'Pagadas/Verificadas', value: kpis.pagadas },
        { label: 'Pendientes', value: kpis.pendientes },
        { label: 'Tasa de Resolucion', value: `${kpis.tasaResolucion}%` },
        { label: 'Monto Total', value: `$${kpis.totalMonto.toLocaleString()}` },
      ];
      let kpiX = margin + 10;
      for (const k of kpiData) {
        page.drawText(k.label, {
          x: kpiX, y: y + 35, size: 7, color: rgb(0.4, 0.4, 0.4),
        });
        page.drawText(`${k.value}`, {
          x: kpiX, y: y + 18, size: 14, color: rgb(0.1, 0.1, 0.1),
        });
        kpiX += usableWidth / kpiData.length;
      }
      y -= 80;

      for (const [sector, items] of grouped) {
        addPageIfNeeded(50 + items.length * 22);

        page.drawRectangle({
          x: margin, y: y - 2, width: usableWidth, height: 24,
          color: rgb(0.15, 0.15, 0.15), borderColor: rgb(0, 0, 0), borderWidth: 0.5,
        });
        page.drawText(`SECTOR: ${sector}`, {
          x: margin + 8, y: y + 6, size: 11, color: rgb(1, 1, 1),
        });
        page.drawText(`Total: ${items.length}`, {
          x: margin + usableWidth - 70, y: y + 6, size: 10, color: rgb(1, 1, 1),
        });
        y -= 26;

        const colWidths = [155, 75, 100, 75, usableWidth - 405];
        const headers = ['Solicitante', 'Cedula', 'Tipo', 'Estado', 'Monto'];
        const headerX = [margin];
        for (let i = 1; i < headers.length; i++) {
          headerX.push(headerX[i - 1] + colWidths[i - 1]);
        }

        page.drawRectangle({
          x: margin, y: y - 2, width: usableWidth, height: 20,
          color: rgb(0.85, 0.85, 0.85), borderColor: rgb(0.6, 0.6, 0.6), borderWidth: 0.5,
        });
        for (let i = 0; i < headers.length; i++) {
          page.drawText(headers[i], {
            x: headerX[i] + 5, y: y + 4, size: 8, color: rgb(0, 0, 0),
          });
        }
        y -= 22;

        for (const item of items) {
          addPageIfNeeded(22);
          const row = [
            item.familiaId?.jefeDeHogar?.nombre || 'N/A',
            item.familiaId?.jefeDeHogar?.cedula || 'N/A',
            item.tipoSolicitud === 'beneficio' ? item.jornadaId?.tipo || 'Beneficio' : item.asunto || 'Otra',
            item.estadoPago,
            `$${(item.montoPagado || 0).toLocaleString()}`,
          ];

          page.drawRectangle({
            x: margin, y: y - 2, width: usableWidth, height: 20,
            color: rgb(1, 1, 1), borderColor: rgb(0.9, 0.9, 0.9), borderWidth: 0.3,
          });
          for (let i = 0; i < row.length; i++) {
            page.drawText(row[i], {
              x: headerX[i] + 5, y: y + 4, size: 8, color: rgb(0.2, 0.2, 0.2),
            });
          }
          y -= 22;
        }

        y -= 8;
      }

      if (y < margin + 50) {
        page = pdf.addPage({ size: 'a4' });
        y = pageHeight - margin;
      }
      y -= 30;

      page.drawRectangle({
        x: margin, y: y - 2, width: usableWidth, height: 1,
        color: rgb(0.8, 0.8, 0.8),
      });
      y -= 14;

      page.drawText(`Fin del reporte - ${new Date().toLocaleString('es-ES')}`, {
        x: margin, y, size: 9, color: rgb(0.5, 0.5, 0.5),
      });

      const bytes = await pdf.save();
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-auditoria-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Error al generar PDF:', e);
      setError('Error al generar PDF: ' + (e.message || 'desconocido'));
    } finally {
      setGeneratingPdf(false);
    }
  }

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
        <h2 className="text-xl font-bold text-white">Auditor&iacute;a y Reportes</h2>
        <button
          onClick={handleGeneratePdf}
          disabled={generatingPdf || loading || entregas.length === 0}
          className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {generatingPdf ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Generando PDF...
            </>
          ) : (
            'Generar Reporte PDF de Auditoria'
          )}
        </button>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-300">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-3" />
          Cargando datos...
        </div>
      )}

      {!loading && !error && (
        <>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 mb-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-400 block text-xs uppercase tracking-wider">Generado por</span>
              <span className="text-white font-medium">{user.name || user.email}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs uppercase tracking-wider">Rol</span>
              <span className="text-white capitalize">{user.role}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs uppercase tracking-wider">Fecha y Hora</span>
              <span className="text-white">{loadedAt || 'Cargando...'}</span>
            </div>
            <div>
              <span className="text-gray-400 block text-xs uppercase tracking-wider">Direcci&oacute;n IP</span>
              <span className="text-white font-mono">{ip || 'No disponible'}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Total Solicitudes', value: kpis.total, color: 'text-white' },
              { label: 'Pagadas / Verificadas', value: kpis.pagadas, color: 'text-sky-400' },
              { label: 'Pendientes', value: kpis.pendientes, color: 'text-amber-400' },
              { label: 'Tasa de Resolución', value: `${kpis.tasaResolucion}%`, color: 'text-emerald-400' },
              { label: 'Monto Total', value: `$${kpis.totalMonto.toLocaleString()}`, color: 'text-emerald-400' },
            ].map((kpi) => (
              <div key={kpi.label} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{kpi.label}</p>
                <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            ))}
          </div>

          {grouped.length === 0 ? (
            <div className="text-center py-16 text-gray-400">No hay datos para mostrar</div>
          ) : (
            <div className="space-y-6">
              {grouped.map(([sector, items]) => (
                <div key={sector} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
                  <div className="px-4 py-3 border-b border-white/10 bg-rose-500/5">
                    <h3 className="text-sm font-semibold text-rose-400 uppercase tracking-wider">{sector}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">{items.length} registro(s)</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                          <th className="text-left px-4 py-2.5 font-medium">Solicitante</th>
                          <th className="text-left px-4 py-2.5 font-medium">C&eacute;dula</th>
                          <th className="text-left px-4 py-2.5 font-medium">Tipo</th>
                          <th className="text-left px-4 py-2.5 font-medium">Estado</th>
                          <th className="text-left px-4 py-2.5 font-medium">Monto</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((e) => (
                          <tr key={e._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                            <td className="px-4 py-2.5 text-white">{e.familiaId?.jefeDeHogar?.nombre || 'N/A'}</td>
                            <td className="px-4 py-2.5 text-gray-300">{e.familiaId?.jefeDeHogar?.cedula || 'N/A'}</td>
                            <td className="px-4 py-2.5 text-gray-300">
                              {e.tipoSolicitud === 'beneficio' ? e.jornadaId?.tipo || 'Beneficio' : e.asunto || 'Otra'}
                            </td>
                            <td className="px-4 py-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColor(e.estadoPago)}`}>
                                {e.estadoPago.charAt(0).toUpperCase() + e.estadoPago.slice(1)}
                              </span>
                            </td>
                            <td className="px-4 py-2.5 text-gray-300">${(e.montoPagado || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
