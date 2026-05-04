import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { withRole, jsonResponse } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador']);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const body = await req.json();
    const { name, email, password, role = 'vocero' } = body;

    if (!name || !email || !password) {
      return jsonResponse(false, null, 'Nombre, email y contraseña son obligatorios', 400);
    }
    if (password.length < 6) {
      return jsonResponse(false, null, 'La contraseña debe tener al menos 6 caracteres', 400);
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return jsonResponse(false, null, 'Ya existe un usuario con este email', 409);
    }

    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, role });

    return jsonResponse(true, { user: { id: user._id, name: user.name, email: user.email, role: user.role } }, 'Usuario creado exitosamente', 201);
  } catch (error: any) {
    console.error('Error en registro:', error);
    return jsonResponse(false, null, 'Error al crear el usuario', 500);
  }
}
