import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Familia from '@/models/Familia';
import { jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const query: Record<string, any> = {};
    if (q) {
      query.$or = [
        { 'jefeDeHogar.cedula': { $regex: q, $options: 'i' } },
        { 'jefeDeHogar.nombre': { $regex: q, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;

    const [familias, total] = await Promise.all([
      Familia.find(query).populate('sector', 'name').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Familia.countDocuments(query),
    ]);

    return jsonResponse(true, { familias, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Familias obtenidas exitosamente');
  } catch (error: any) {
    console.error('Error al obtener familias:', error);
    return jsonResponse(false, null, 'Error al obtener familias', 500);
  }
}
