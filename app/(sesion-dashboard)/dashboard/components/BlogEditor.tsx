'use client';
// @panel Editor de Blog — dual-column, subida archivo/URL, vista previa derecha

import { useState, useRef } from 'react';

interface Post {
  _id: string;
  titulo: string;
  contenido: string;
  imagenPortada?: string;
  tags: string[];
  slug: string;
}

interface BlogEditorProps {
  token: string;
  onPostCreated?: (post: Post) => void;
}

async function fileToBase64Client(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

const MAX_SIZE_MB = 2;
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

export default function BlogEditor({ token, onPostCreated }: BlogEditorProps) {
  const [titulo, setTitulo]               = useState('');
  const [contenido, setContenido]         = useState('');
  const [imagenPortada, setImagenPortada] = useState('');
  const [imagenPreview, setImagenPreview] = useState('');
  const [imagenFile, setImagenFile]       = useState<File | null>(null);
  const [tags, setTags]                   = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError('Tipo de archivo no permitido. Use JPG, PNG o WEBP.');
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`El archivo supera el límite de ${MAX_SIZE_MB}MB.`);
      return;
    }
    setError('');
    setImagenFile(file);
    const dataUrl = await fileToBase64Client(file);
    setImagenPortada(dataUrl);
    setImagenPreview(dataUrl);
  }

  function clearImage() {
    setImagenFile(null);
    setImagenPortada('');
    setImagenPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  async function handleSubmit() {
    if (!titulo.trim() || !contenido.trim()) {
      setError('Título y contenido son obligatorios');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const body = {
        titulo:        titulo.trim(),
        contenido:     contenido.trim(),
        imagenPortada: imagenPortada.trim() || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      const res = await fetch('/api/blog', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      });

      const json = await res.json();
      if (!json.success) throw new Error(json.message || 'Error al crear el post');

      setSuccess('Post creado exitosamente');
      setTitulo('');
      setContenido('');
      setTags('');
      clearImage();
      onPostCreated?.(json.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const isBase64Image = imagenPortada.startsWith('data:image/');
  const previewTags = tags.split(',').map(t => t.trim()).filter(Boolean);

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
              placeholder="T&iacute;tulo del comunicado" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              Imagen de portada <span className="text-gray-500">(opcional — JPG, PNG, WEBP, m&aacute;x. 2MB)</span>
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleImageFile}
              className="hidden"
            />
            <div className="flex gap-2 items-center flex-wrap">
              <button type="button" onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 text-sm bg-white/10 border border-white/20 rounded-xl text-gray-300 hover:bg-white/20 transition-colors">
                {imagenFile ? 'Imagen cargada' : 'Subir imagen'}
              </button>
              {imagenFile && (
                <button type="button" onClick={clearImage}
                  className="text-xs text-rose-400 hover:text-rose-300 transition-colors">
                  Quitar
                </button>
              )}
            </div>
            {!imagenFile && (
              <input value={imagenPortada} onChange={(e) => { setImagenPortada(e.target.value); setImagenPreview(e.target.value); }}
                className="mt-2 w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500"
                placeholder="O pega URL externa: https://ejemplo.com/imagen.jpg" />
            )}
            {imagenFile && (
              <p className="mt-1 text-xs text-sky-400">La imagen se almacenar&aacute; en la base de datos (Base64)</p>
            )}
            {isBase64Image && imagenFile && (
              <p className="text-xs text-gray-500">Tama&ntilde;o original: {(imagenFile.size / 1024).toFixed(1)} KB</p>
            )}
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Tags <span className="text-gray-500">(separados por coma)</span></label>
            <input value={tags} onChange={(e) => setTags(e.target.value)}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500"
              placeholder="info, aviso, clap" />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">Contenido</label>
            <textarea value={contenido} onChange={(e) => setContenido(e.target.value)} rows={10}
              className="w-full bg-black/20 border border-white/10 rounded-xl px-3 py-2.5 text-white text-sm focus:border-sky-500 focus:outline-none transition-colors placeholder-gray-500 resize-none"
              placeholder="Escribe el contenido aqu&iacute;..." />
          </div>

          <button onClick={handleSubmit} disabled={loading}
            className="w-full py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? 'Publicando...' : 'Publicar en Blog'}
          </button>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Vista Previa</h3>
          {titulo || contenido || imagenPreview || tags ? (
            <div>
              {imagenPreview && (
                <img src={imagenPreview} alt="Portada"
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
