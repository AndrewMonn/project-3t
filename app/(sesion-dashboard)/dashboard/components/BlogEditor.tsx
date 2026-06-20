// app/(sesion-dashboard)/dashboard/components/BlogEditor.tsx
// MODIFICADO: imagenPortada ahora acepta tanto una URL externa como un archivo subido.
// Si el usuario sube un archivo, se convierte a Base64 en el cliente antes de enviarlo.
// El campo `imagenPortada` del Post puede ser un Data URL Base64 o una URL normal.

'use client';

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

/** Convierte un File a Data URL Base64 en el navegador */
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
  const [imagenPortada, setImagenPortada] = useState('');   // URL externa o Base64
  const [imagenPreview, setImagenPreview] = useState('');   // solo para previsualizar
  const [imagenFile, setImagenFile]       = useState<File | null>(null);
  const [tags, setTags]                   = useState('');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  /** Maneja la selección de un archivo de imagen */
  async function handleImageFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validación en cliente
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

    // Convertir a Base64 para previsualizar y enviar
    const dataUrl = await fileToBase64Client(file);
    setImagenPortada(dataUrl);   // se enviará como Base64 al backend
    setImagenPreview(dataUrl);   // para mostrar en la previsualización
  }

  /** Limpia la imagen seleccionada */
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
        imagenPortada: imagenPortada.trim() || undefined,  // Base64 o URL externa
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

  /** Determina si imagenPortada es Base64 o URL externa */
  const isBase64Image = imagenPortada.startsWith('data:image/');

  return (
    <div className="bg-white rounded-xl shadow p-6 space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Nuevo Post</h2>

      {error   && <p className="text-red-600 text-sm">{error}</p>}
      {success && <p className="text-green-600 text-sm">{success}</p>}

      {/* Título */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
        <input
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Título del comunicado"
        />
      </div>

      {/* Contenido */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Contenido</label>
        <textarea
          value={contenido}
          onChange={e => setContenido(e.target.value)}
          rows={6}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Escribe el contenido aquí..."
        />
      </div>

      {/* Imagen de portada */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Imagen de portada
          <span className="ml-1 text-xs text-gray-400">(opcional — JPG, PNG, WEBP, máx. 2MB)</span>
        </label>

        <div className="flex gap-2 items-center">
          {/* Subir archivo */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 text-sm border rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700"
          >
            {imagenFile ? '✓ Imagen cargada' : '📎 Subir imagen'}
          </button>

          {imagenFile && (
            <button
              type="button"
              onClick={clearImage}
              className="text-xs text-red-500 hover:underline"
            >
              Quitar
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleImageFile}
          className="hidden"
        />

        {/* O bien, ingresar URL externa */}
        {!imagenFile && (
          <input
            value={imagenPortada}
            onChange={e => { setImagenPortada(e.target.value); setImagenPreview(e.target.value); }}
            className="mt-2 w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="O pega una URL externa: https://ejemplo.com/imagen.jpg"
          />
        )}

        {/* Indicador de almacenamiento */}
        {imagenFile && (
          <p className="mt-1 text-xs text-blue-600">
            ✅ La imagen se almacenará en la base de datos (Base64)
          </p>
        )}
        {isBase64Image && imagenFile && (
          <p className="text-xs text-gray-400">
            Tamaño original: {(imagenFile.size / 1024).toFixed(1)} KB
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tags <span className="text-xs text-gray-400">(separados por coma)</span>
        </label>
        <input
          value={tags}
          onChange={e => setTags(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="info, aviso, clap"
        />
      </div>

      {/* Previsualización */}
      {(titulo || contenido || imagenPreview || tags) && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-xs text-gray-500 mb-2 font-medium">Vista previa</p>
          {imagenPreview && (
            <img
              src={imagenPreview}
              alt="Portada"
              className="w-full h-40 object-cover rounded mb-3"
            />
          )}
          {titulo    && <p className="font-bold text-gray-800">{titulo}</p>}
          {contenido && <p className="text-sm text-gray-600 mt-1 line-clamp-3">{contenido}</p>}
          {tags && (
            <div className="flex gap-1 mt-2 flex-wrap">
              {tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                <span key={tag} className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Botón enviar */}
      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-medium py-2 rounded-lg transition-colors text-sm"
      >
        {loading ? 'Publicando...' : 'Publicar post'}
      </button>
    </div>
  );
}
