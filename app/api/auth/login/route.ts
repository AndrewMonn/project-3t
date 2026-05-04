import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { generateToken, jsonResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return jsonResponse(false, null, 'Email y contraseña son obligatorios', 400);
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!user) {
      return jsonResponse(false, null, 'Credenciales inválidas', 401);
    }

    const isValidPassword = await user.comparePassword(password);
    if (!isValidPassword) {
      return jsonResponse(false, null, 'Credenciales inválidas', 401);
    }

    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role });

    return jsonResponse(true, { token, user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Inicio de sesión exitoso');
  } catch (error: any) {
    console.error('Error en login:', error);
    return jsonResponse(false, null, 'Error al iniciar sesión', 500);
  }
}
