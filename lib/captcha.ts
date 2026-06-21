// lib/captcha.ts
// Verificación de Google reCAPTCHA v2 en el servidor.
// Requiere: RECAPTCHA_SECRET_KEY en .env.local
// El cliente necesita: NEXT_PUBLIC_RECAPTCHA_SITE_KEY en .env.local

/**
 * Verifica el token recaptcha enviado desde el cliente contra la API de Google.
 * Devuelve true si el token es válido, false en cualquier otro caso.
 *
 * @param token  El valor de `g-recaptcha-response` que llegó en el body del POST
 * @param ip     IP del cliente (opcional, mejora la precisión de Google)
 */
export async function verifyCaptcha(token: string, ip?: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;

  if (!secret) {
    // En desarrollo sin clave configurada, dejar pasar con una advertencia
    console.warn('[captcha] RECAPTCHA_SECRET_KEY no configurada — omitiendo verificación.');
    return true;
  }

  if (!token || token.trim() === '') return false;

  try {
    const params = new URLSearchParams({
      secret,
      response: token,
      ...(ip ? { remoteip: ip } : {}),
    });

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!res.ok) return false;

    const data: { success: boolean; score?: number; 'error-codes'?: string[] } = await res.json();
    return data.success === true;
  } catch (err) {
    console.error('[captcha] Error al verificar reCAPTCHA:', err);
    return false;
  }
}

/**
 * Extrae la IP real del cliente desde los headers de Next.js.
 * Soporta: Vercel, Nginx, Cloudflare, Akamai, AWS, Fastly, y el socket TCP directo.
 */
export function getClientIp(req: Request): string {
  const headers = (req as any).headers;
  const get = (name: string): string =>
    (typeof headers.get === 'function' ? headers.get(name) : headers[name]) || '';

  const raw =
    get('x-real-ip') ||
    get('cf-connecting-ip') ||                     // Cloudflare
    (get('x-forwarded-for').split(',')[0] || '').trim() ||  // Proxy/CDN general
    get('x-vercel-forwarded-for') ||               // Vercel
    get('true-client-ip') ||                       // Akamai
    get('x-client-ip') ||                          // Varios
    get('x-forwarded') ||
    get('forwarded-for') ||                        // RFC 7239
    get('x-cluster-client-ip') ||                  // AWS
    get('fastly-client-ip') ||                     // Fastly
    (req as any)?.socket?.remoteAddress ||
    (req as any)?.connection?.remoteAddress ||
    (req as any)?.info?.remoteAddress ||
    '0.0.0.0';

  return raw.replace(/^::ffff:/, '');
}
