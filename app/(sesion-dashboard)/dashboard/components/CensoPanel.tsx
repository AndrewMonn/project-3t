'use client';
// @panel Censo — visualiza familias agrupadas por sector, agrega y edita

import { useState, useEffect, useMemo } from 'react';

interface SectorData {
  _id: string;
  name: string;
  calles: string[];
}

interface Integrante {
  nombre: string;
  edad: number;
  parentesco: string;
}

interface FamiliaData {
  _id: string;
  jefeDeHogar: { nombre: string; cedula: string; telefono: string };
  integrantes: Integrante[];
  direccion: { calle: string; nroCasa: string; referencia?: string };
  sector: SectorData;
  esVulnerable: boolean;
  condicionesEspeciales?: string;
  createdAt: string;
}

interface FamiliaForm {
  jefeDeHogar: { nombre: string; cedula: string; telefono: string };
  integrantes: Integrante[];
  direccion: { calle: string; nroCasa: string; referencia: string };
  sector: string;
  esVulnerable: boolean;
  condicionesEspeciales: string;
}

const emptyForm: FamiliaForm = {
  jefeDeHogar: { nombre: '', cedula: '', telefono: '' },
  integrantes: [],
  direccion: { calle: '', nroCasa: '', referencia: '' },
  sector: '',
  esVulnerable: false,
  condicionesEspeciales: '',
};

export default function CensoPanel() {
  const [familias, setFamilias] = useState<FamiliaData[]>([]);
  const [sectores, setSectores] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sectorFilter, setSectorFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FamiliaData | null>(null);
  const [detalle, setDetalle] = useState<FamiliaData | null>(null);

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token') || sessionStorage.getItem('token')
    : null;

  async function fetchData() {
    setLoading(true);
    setError(null);
    try {
      const [resF, resS] = await Promise.all([
        fetch('/api/familias?limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/sectores', { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      const jsonF = await resF.json();
      const jsonS = await resS.json();
      if (!jsonF.success) throw new Error(jsonF.message);
      if (!jsonS.success) throw new Error(jsonS.message);
      setFamilias(jsonF.data.familias);
      setSectores(jsonS.data);
    } catch (e: any) {
      setError(e.message || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchData(); }, []);

  const grouped = useMemo(() => {
    const filtered = sectorFilter
      ? familias.filter((f) => f.sector?._id === sectorFilter)
      : familias;
    const groups: Record<string, FamiliaData[]> = {};
    for (const f of filtered) {
      const key = f.sector?.name || 'Sin Sector';
      if (!groups[key]) groups[key] = [];
      groups[key].push(f);
    }
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [familias, sectorFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-white">Censo Familiar</h2>
        <div className="flex gap-3">
          <select value={sectorFilter} onChange={(e) => setSectorFilter(e.target.value)}
            className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors">
            <option value="" className="bg-gray-800">Todos los sectores</option>
            {sectores.map((s) => (
              <option key={s._id} value={s._id} className="bg-gray-800">{s.name}</option>
            ))}
          </select>
          <button onClick={() => { setEditing(null); setShowModal(true); }}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors">
            + Nueva Familia
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-4">{error}</div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16 text-gray-300">
          <div className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mr-3" />
          Cargando censo...
        </div>
      )}

      {!loading && !error && grouped.length === 0 && (
        <div className="text-center py-16 text-gray-400">No hay familias registradas</div>
      )}

      {!loading && !error && grouped.length > 0 && (
        <div className="space-y-6">
          {grouped.map(([sector, items]) => (
            <div key={sector} className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden">
              <div className="px-4 py-3 border-b border-white/10 bg-sky-500/5">
                <h3 className="text-sm font-semibold text-sky-400 uppercase tracking-wider">{sector}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{items.length} familia(s)</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider">
                      <th className="text-left px-4 py-2.5 font-medium">Jefe de Hogar</th>
                      <th className="text-left px-4 py-2.5 font-medium">C&eacute;dula</th>
                      <th className="text-left px-4 py-2.5 font-medium">Tel&eacute;fono</th>
                      <th className="text-left px-4 py-2.5 font-medium">Direcci&oacute;n</th>
                      <th className="text-left px-4 py-2.5 font-medium">Integrantes</th>
                      <th className="text-left px-4 py-2.5 font-medium">Vulnerable</th>
                      <th className="text-left px-4 py-2.5 font-medium">Condiciones</th>
                      <th className="text-center px-4 py-2.5 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((f) => {
                      const integrantesStr = f.integrantes?.length
                        ? f.integrantes.map((i) => `${i.nombre} (${i.edad}, ${i.parentesco})`).join('; ')
                        : '—';
                      const direccionStr = [f.direccion?.calle, f.direccion?.nroCasa, f.direccion?.referencia]
                        .filter(Boolean).join(', ');
                      return (
                        <tr key={f._id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                          <td className="px-4 py-2.5">
                            <button onClick={() => setDetalle(f)} className="flex items-center gap-2 hover:bg-white/5 rounded-lg px-2 -ml-2 py-1 transition-colors text-left">
                              <span className="text-white font-medium">{f.jefeDeHogar?.nombre || 'N/A'}</span>
                              <span className="text-[10px] bg-sky-500/15 text-sky-400 px-1.5 py-0.5 rounded-full font-medium">Jefe</span>
                            </button>
                          </td>
                          <td className="px-4 py-2.5 text-gray-300">{f.jefeDeHogar?.cedula || 'N/A'}</td>
                          <td className="px-4 py-2.5 text-gray-300">{f.jefeDeHogar?.telefono || 'N/A'}</td>
                          <td className="px-4 py-2.5 text-gray-300 max-w-[200px] truncate" title={direccionStr}>{direccionStr || 'N/A'}</td>
                          <td className="px-4 py-2.5 text-gray-300 max-w-[250px] truncate" title={integrantesStr}>{integrantesStr}</td>
                          <td className="px-4 py-2.5">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${f.esVulnerable ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                              {f.esVulnerable ? 'Sí' : 'No'}
                            </span>
                          </td>
                          <td className="px-4 py-2.5 text-gray-300 max-w-[150px] truncate" title={f.condicionesEspeciales || ''}>
                            {f.condicionesEspeciales || '—'}
                          </td>
                          <td className="px-4 py-2.5 text-center">
                            <button onClick={() => { setEditing(f); setShowModal(true); }}
                              className="px-3 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg transition-colors">
                              Editar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <FamiliaModal
          editing={editing}
          sectores={sectores}
          onClose={() => { setShowModal(false); setEditing(null); }}
          onSuccess={() => { setShowModal(false); setEditing(null); fetchData(); }}
        />
      )}

      {detalle && (
        <FamiliaDetalleModal
          familia={detalle}
          onClose={() => setDetalle(null)}
        />
      )}
    </div>
  );
}

function FamiliaModal({
  editing,
  sectores,
  onClose,
  onSuccess,
}: {
  editing: FamiliaData | null;
  sectores: SectorData[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [form, setForm] = useState<FamiliaForm>(() => {
    if (editing) {
      return {
        jefeDeHogar: { ...editing.jefeDeHogar },
        integrantes: [...(editing.integrantes || [])],
        direccion: { ...editing.direccion, referencia: editing.direccion?.referencia || '' },
        sector: editing.sector?._id || '',
        esVulnerable: editing.esVulnerable,
        condicionesEspeciales: editing.condicionesEspeciales || '',
      };
    }
    return { ...emptyForm };
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = typeof window !== 'undefined'
    ? localStorage.getItem('token') || sessionStorage.getItem('token')
    : null;

  function updateField(path: string, value: any) {
    setForm((prev) => {
      const copy = { ...prev };
      const keys = path.split('.');
      let obj: any = copy;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return copy;
    });
  }

  function addIntegrante() {
    setForm((prev) => ({ ...prev, integrantes: [...prev.integrantes, { nombre: '', edad: 0, parentesco: '' }] }));
  }

  function removeIntegrante(i: number) {
    setForm((prev) => ({ ...prev, integrantes: prev.integrantes.filter((_, idx) => idx !== i) }));
  }

  function updateIntegrante(i: number, field: string, value: string | number) {
    setForm((prev) => {
      const copy = [...prev.integrantes];
      copy[i] = { ...copy[i], [field]: value };
      return { ...prev, integrantes: copy };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.jefeDeHogar.nombre.trim() || !form.jefeDeHogar.cedula.trim() || !form.jefeDeHogar.telefono.trim()) {
      setError('Nombre, cédula y teléfono del jefe de hogar son obligatorios');
      return;
    }
    if (!form.direccion.calle.trim() || !form.direccion.nroCasa.trim()) {
      setError('Calle y número de casa son obligatorios');
      return;
    }
    if (!form.sector) {
      setError('Debe seleccionar un sector');
      return;
    }

    setLoading(true);
    try {
      const url = editing ? `/api/familias/${editing._id}` : '/api/familias';
      const method = editing ? 'PUT' : 'POST';
      const body = {
        jefeDeHogar: {
          nombre: form.jefeDeHogar.nombre.trim(),
          cedula: form.jefeDeHogar.cedula.trim(),
          telefono: form.jefeDeHogar.telefono.trim(),
        },
        integrantes: form.integrantes.filter((i) => i.nombre.trim()),
        direccion: {
          calle: form.direccion.calle.trim(),
          nroCasa: form.direccion.nroCasa.trim(),
          referencia: form.direccion.referencia.trim() || undefined,
        },
        sector: form.sector,
        esVulnerable: form.esVulnerable,
        condicionesEspeciales: form.condicionesEspeciales.trim() || undefined,
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      onSuccess();
    } catch (e: any) {
      setError(e.message || 'Error al guardar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl backdrop-blur-lg">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold text-white">{editing ? 'Editar Familia' : 'Registrar Nueva Familia'}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {error && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-3 py-2 rounded-lg text-sm">{error}</div>
          )}

          <fieldset className="border border-white/10 rounded-xl p-4 space-y-3">
            <legend className="text-sm font-semibold text-sky-400 px-1">Jefe de Hogar</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nombre completo</label>
                <input value={form.jefeDeHogar.nombre} onChange={(e) => updateField('jefeDeHogar.nombre', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500" placeholder="Nombre" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">C&eacute;dula</label>
                <input value={form.jefeDeHogar.cedula} onChange={(e) => updateField('jefeDeHogar.cedula', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500" placeholder="V-12345678" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Tel&eacute;fono</label>
                <input value={form.jefeDeHogar.telefono} onChange={(e) => updateField('jefeDeHogar.telefono', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500" placeholder="0412-1234567" />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-white/10 rounded-xl p-4 space-y-3">
            <legend className="text-sm font-semibold text-sky-400 px-1">Direcci&oacute;n</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Calle</label>
                <input value={form.direccion.calle} onChange={(e) => updateField('direccion.calle', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500" placeholder="Calle principal" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Nro. Casa</label>
                <input value={form.direccion.nroCasa} onChange={(e) => updateField('direccion.nroCasa', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500" placeholder="Casa #" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Referencia</label>
                <input value={form.direccion.referencia} onChange={(e) => updateField('direccion.referencia', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500" placeholder="Opcional" />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-white/10 rounded-xl p-4 space-y-3">
            <legend className="text-sm font-semibold text-sky-400 px-1">Sector y Condiciones</legend>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Sector</label>
                <select value={form.sector} onChange={(e) => updateField('sector', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors">
                  <option value="" className="bg-gray-800">Seleccionar...</option>
                  {sectores.map((s) => (
                    <option key={s._id} value={s._id} className="bg-gray-800">{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                  <input type="checkbox" checked={form.esVulnerable} onChange={(e) => updateField('esVulnerable', e.target.checked)}
                    className="w-4 h-4 accent-sky-500" />
                  Es vulnerable
                </label>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Condiciones especiales</label>
                <input value={form.condicionesEspeciales} onChange={(e) => updateField('condicionesEspeciales', e.target.value)}
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500" placeholder="Opcional" />
              </div>
            </div>
          </fieldset>

          <fieldset className="border border-white/10 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <legend className="text-sm font-semibold text-sky-400 px-1">Integrantes</legend>
              <button type="button" onClick={addIntegrante}
                className="text-xs px-3 py-1 bg-sky-500/15 text-sky-400 rounded-lg hover:bg-sky-500/25 transition-colors">
                + Agregar
              </button>
            </div>
            {form.integrantes.length === 0 && (
              <p className="text-gray-500 text-sm italic">Sin integrantes adicionales</p>
            )}
            {form.integrantes.map((int, i) => (
              <div key={i} className="flex gap-2 items-start bg-white/[0.02] rounded-lg p-3">
                <div className="flex-1 grid grid-cols-3 gap-2">
                  <input value={int.nombre} onChange={(e) => updateIntegrante(i, 'nombre', e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none placeholder-gray-500" placeholder="Nombre" />
                  <input type="number" value={int.edad || ''} onChange={(e) => updateIntegrante(i, 'edad', parseInt(e.target.value) || 0)}
                    className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none placeholder-gray-500" placeholder="Edad" />
                  <input value={int.parentesco} onChange={(e) => updateIntegrante(i, 'parentesco', e.target.value)}
                    className="bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-white text-sm focus:border-sky-500 focus:outline-none placeholder-gray-500" placeholder="Parentesco" />
                </div>
                <button type="button" onClick={() => removeIntegrante(i)}
                  className="text-rose-400 hover:text-rose-300 p-1 mt-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </fieldset>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-gray-300 rounded-xl text-sm hover:bg-white/20 transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 px-4 py-2.5 bg-sky-500 text-white rounded-xl text-sm font-medium hover:bg-sky-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Guardando...' : editing ? 'Actualizar' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function FamiliaDetalleModal({
  familia,
  onClose,
}: {
  familia: FamiliaData;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-gray-900 border border-white/10 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-xl backdrop-blur-lg">
        <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between shrink-0">
          <h3 className="text-lg font-semibold text-white">Grupo Familiar</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 space-y-4 overflow-y-auto flex-1">
          <fieldset className="border border-white/10 rounded-xl p-4 space-y-2">
            <legend className="text-sm font-semibold text-sky-400 px-1">Jefe de Hogar</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-gray-400">Nombre:</span>
              <span className="text-white">{familia.jefeDeHogar.nombre}</span>
              <span className="text-gray-400">Cédula:</span>
              <span className="text-white">{familia.jefeDeHogar.cedula}</span>
              <span className="text-gray-400">Teléfono:</span>
              <span className="text-white">{familia.jefeDeHogar.telefono}</span>
            </div>
          </fieldset>

          <fieldset className="border border-white/10 rounded-xl p-4 space-y-2">
            <legend className="text-sm font-semibold text-sky-400 px-1">Dirección</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-gray-400">Calle:</span>
              <span className="text-white">{familia.direccion.calle}</span>
              <span className="text-gray-400">Nro. Casa:</span>
              <span className="text-white">{familia.direccion.nroCasa}</span>
              {familia.direccion.referencia && (
                <>
                  <span className="text-gray-400">Referencia:</span>
                  <span className="text-white">{familia.direccion.referencia}</span>
                </>
              )}
              <span className="text-gray-400">Sector:</span>
              <span className="text-white">{familia.sector?.name || 'N/A'}</span>
            </div>
          </fieldset>

          <fieldset className="border border-white/10 rounded-xl p-4 space-y-2">
            <legend className="text-sm font-semibold text-sky-400 px-1">Condiciones</legend>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
              <span className="text-gray-400">Vulnerable:</span>
              <span className={`font-medium ${familia.esVulnerable ? 'text-amber-400' : 'text-emerald-400'}`}>
                {familia.esVulnerable ? 'Sí' : 'No'}
              </span>
              <span className="text-gray-400">Registrado:</span>
              <span className="text-white">{new Date(familia.createdAt).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            {familia.condicionesEspeciales && (
              <div className="text-sm mt-2">
                <span className="text-gray-400 block mb-0.5">Condiciones especiales:</span>
                <span className="text-white bg-white/5 rounded-lg px-3 py-1.5 block">{familia.condicionesEspeciales}</span>
              </div>
            )}
          </fieldset>

          <fieldset className="border border-white/10 rounded-xl p-4 space-y-2">
            <legend className="text-sm font-semibold text-sky-400 px-1">
              Integrantes ({familia.integrantes?.length || 0})
            </legend>
            {(!familia.integrantes || familia.integrantes.length === 0) ? (
              <p className="text-gray-500 text-sm italic">Sin integrantes adicionales</p>
            ) : (
              <div className="space-y-2">
                {familia.integrantes.map((int, i) => (
                  <div key={i} className="bg-white/5 rounded-lg p-3 flex items-center gap-4 text-sm">
                    <div className="w-8 h-8 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold shrink-0">
                      {int.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-gray-500 text-xs block">Nombre</span>
                        <span className="text-white">{int.nombre}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Edad</span>
                        <span className="text-white">{int.edad} años</span>
                      </div>
                      <div>
                        <span className="text-gray-500 text-xs block">Parentesco</span>
                        <span className="text-white">{int.parentesco}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </fieldset>
        </div>
      </div>
    </div>
  );
}
