// lib/imageUtils.ts
// Utilidades para convertir imágenes a Base64 y almacenarlas en MongoDB.
// Evita escribir archivos en disco (útil en entornos serverless como Vercel).

/** Tipos MIME permitidos para imágenes */
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'] as const;
export type AllowedImageType = typeof ALLOWED_IMAGE_TYPES[number];

/** Tamaño máximo recomendado antes de convertir a Base64.
 *  MongoDB limita documentos a 16MB; Base64 incrementa ~33% el tamaño.
 *  2MB de imagen original → ~2.7MB en Base64, margen seguro.
 */
export const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2 MB

export interface ImageBase64Result {
  /** String listo para guardar en MongoDB: "data:image/png;base64,iVBOR..." */
  dataUrl: string;
  /** MIME type del archivo original */
  mimeType: string;
  /** Tamaño original en bytes */
  originalSize: number;
  /** Tamaño del string Base64 en bytes (aprox. 33% mayor) */
  base64Size: number;
}

/**
 * Convierte un objeto `File` (del FormData de Next.js) a un Data URL Base64.
 * Lanza un error descriptivo si el archivo no cumple las validaciones.
 *
 * @example
 * const file = formData.get('comprobante') as File;
 * const { dataUrl } = await fileToBase64(file);
 * // Guardar `dataUrl` directamente en MongoDB
 */
export async function fileToBase64(file: File): Promise<ImageBase64Result> {
  // 1. Validar tipo MIME
  if (!ALLOWED_IMAGE_TYPES.includes(file.type as AllowedImageType)) {
    throw new Error(`Tipo de archivo no permitido: ${file.type}. Use JPG, PNG o WEBP.`);
  }

  // 2. Validar tamaño
  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(2);
    throw new Error(`El archivo (${mb} MB) supera el límite de 2MB para almacenamiento en base de datos.`);
  }

  // 3. Leer bytes y convertir
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64String = buffer.toString('base64');
  const dataUrl = `data:${file.type};base64,${base64String}`;

  return {
    dataUrl,
    mimeType: file.type,
    originalSize: file.size,
    base64Size: Buffer.byteLength(dataUrl, 'utf8'),
  };
}

/**
 * Valida si un string es un Data URL Base64 válido de imagen.
 * Útil para verificar datos antes de devolverlos al cliente.
 */
export function isValidImageDataUrl(value: string): boolean {
  return /^data:(image\/jpeg|image\/png|image\/webp|image\/jpg);base64,[A-Za-z0-9+/=]+$/.test(value);
}

/**
 * Extrae el MIME type de un Data URL Base64.
 * Devuelve null si el formato no es reconocido.
 */
export function getMimeTypeFromDataUrl(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:(image\/\w+);base64,/);
  return match ? match[1] : null;
}
