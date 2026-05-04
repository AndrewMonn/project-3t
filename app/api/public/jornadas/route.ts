import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jornada from '@/models/Jornada';
import { jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const tipo = searchParams.get('tipo');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const query: Record<string, any> = {};
    if (estado) query.estado = estado;
    if (tipo) query.tipo = tipo;

    const skip = (page - 1) * limit;

    const [jornadas, total] = await Promise.all([
      Jornada.find(query).sort({ fechaJornada: -1 }).skip(skip).limit(limit).lean(),
      Jornada.countDocuments(query),
    ]);

    return jsonResponse(true, { jornadas, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Jornadas obtenidas exitosamente');
  } catch (error: any) {
    console.error('Error al obtener jornadas:', error);
    return jsonResponse(false, null, 'Error al obtener jornadas', 500);
  }
}
