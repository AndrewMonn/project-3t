import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { withRole, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador']);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find().select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(),
    ]);

    return jsonResponse(true, { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Usuarios obtenidos exitosamente');
  } catch (error: any) {
    console.error('Error al obtener usuarios:', error);
    return jsonResponse(false, null, 'Error al obtener usuarios', 500);
  }
}
