// app/api/auth/login/route.ts
// MODIFICADO: se añadieron verificación de reCAPTCHA v2 y registro de auditoría de IP.
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LoginAudit from '@/models/LoginAudit';
import { generateToken, jsonResponse } from '@/lib/auth';
import { verifyCaptcha, getClientIp } from '@/lib/captcha';

export async function POST(req: NextRequest) {
  await connectDB();

  const ip        = getClientIp(req);
  const userAgent = req.headers.get('user-agent') || '';

  let email = '', password = '', captchaToken = '';

  try {
    const body   = await req.json();
    email        = (body.email    || '').toLowerCase().trim();
    password     = body.password  || '';
    captchaToken = body.captchaToken || '';
  } catch {
    return jsonResponse(false, null, 'Cuerpo de solicitud inválido', 400);
  }

  // 1. Campos requeridos
  if (!email || !password) {
    return jsonResponse(false, null, 'Email y contraseña son obligatorios', 400);
  }

  // 2. Verificación reCAPTCHA
  const captchaValido = await verifyCaptcha(captchaToken, ip);
  if (!captchaValido) {
    await LoginAudit.create({
      userId: null, email, ip, userAgent,
      exitoso: false, motivoFallo: 'captcha',
      esPrimeraIpParaUsuario: false,
    }).catch(() => {});
    return jsonResponse(false, null, 'Verificación de seguridad fallida. Intente nuevamente.', 400);
  }

  // 3. Verificación de credenciales
  try {
    const user = await User.findOne({ email }).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      await LoginAudit.create({
        userId: user?._id ?? null, email, ip, userAgent,
        exitoso: false, motivoFallo: 'credenciales',
        esPrimeraIpParaUsuario: false,
      }).catch(() => {});
      return jsonResponse(false, null, 'Credenciales inválidas', 401);
    }

    // 4. ¿Primera vez que este usuario inicia desde esta IP?
    const yaExisteIp = await LoginAudit.exists({ userId: user._id, ip, exitoso: true });
    const esPrimeraIpParaUsuario = !yaExisteIp;

    // 5. Guardar registro exitoso
    await LoginAudit.create({
      userId: user._id, email, ip, userAgent,
      exitoso: true, esPrimeraIpParaUsuario,
    }).catch(() => {});

    // 6. Responder con token
    const token = generateToken({
      userId: user._id.toString(),
      email:  user.email,
      role:   user.role,
    });

    return jsonResponse(true, {
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      nuevaIp: esPrimeraIpParaUsuario,
    }, 'Inicio de sesión exitoso');

  } catch (error: any) {
    console.error('Error en login:', error);
    return jsonResponse(false, null, 'Error al iniciar sesión', 500);
  }
}
