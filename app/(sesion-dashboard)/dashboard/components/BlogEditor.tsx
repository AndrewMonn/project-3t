'use client';
// @panel Editor de Blog — dual-column, vista previa en vivo, POST /api/blog

import { useState } from 'react';

export default function BlogEditor() {
  const [titulo, setTitulo] = useState('');
  const [tags, setTags] = useState('');
  const [contenido, setContenido] = useState('');
  const [imagenPortada, setImagenPortada] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handlePublish() {
    setError(null);
    setSuccess(null);
    if (!titulo.trim() || !contenido.trim()) {
      setError('Título y contenido son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const res = await fetch('/api/blog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          titulo: titulo.trim(),
          contenido,
          imagenPortada: imagenPortada.trim() || undefined,
          tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.message);
      setSuccess('Entrada publicada exitosamente');
      setTitulo('');
      setTags('');
      setContenido('');
      setImagenPortada('');
    } catch (e: any) {
      setError(e.message || 'Error al publicar');
    } finally {
      setLoading(false);
    }
  }

  const previewTags = tags.split(',').map((t) => t.trim()).filter(Boolean);

  return (
    <div>
      <h2 className="text-xl font-bold text-white mb-6">Editor de Blog</h2>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 px-4 py-3 rounded-xl mb-4">{error}</div>
      )}
      {success && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-4 py-3 rounded-xl mb-4">{success}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">T&iacute;tulo</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500"
              placeholder="Título de la entrada" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Tags / Categor&iacute;as</label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500"
              placeholder="Salud, Educación, Seguridad" />
            <p className="text-xs text-gray-500 mt-1">Separados por coma</p>
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Imagen de portada (URL)</label>
            <input value={imagenPortada} onChange={(e) => setImagenPortada(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500"
              placeholder="https://ejemplo.com/imagen.jpg" />
          </div>
          <div>
            <label className="block text-sm text-gray-300 mb-1">Contenido</label>
            <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={12}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500 resize-none"
              placeholder="Escribe el contenido aqu&iacute;..." />
          </div>
          <button onClick={handlePublish} disabled={loading}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Publicando...' : 'Publicar en Blog'}
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Vista Previa</h3>
          {titulo || contenido || imagenPortada || tags ? (
            <div>
              {imagenPortada && (
                <img src={imagenPortada} alt="Portada"
                  className="w-full h-48 object-cover rounded-xl mb-4"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
              )}
              {titulo && <h2 className="text-white text-2xl font-bold mb-3">{titulo}</h2>}
              {previewTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4">
                  {previewTags.map((t, i) => (
                    <span key={i} className="px-2.5 py-0.5 bg-sky-500/10 text-sky-400 rounded-full text-xs">{t}</span>
                  ))}
                </div>
              )}
              {contenido ? (
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">{contenido}</div>
              ) : (
                <p className="text-gray-500 italic">El contenido se mostrar&aacute; aqu&iacute;...</p>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p className="text-sm">Escribe en el formulario para ver la vista previa</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
