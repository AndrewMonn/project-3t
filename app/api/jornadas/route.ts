import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Jornada from '@/models/Jornada';
import { withAuth, withRole, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

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

export async function POST(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const body = await req.json();
    const { tipo, fechaJornada, costo, descripcion } = body;

    if (!tipo || !fechaJornada || costo === undefined) {
      return jsonResponse(false, null, 'Tipo, fecha y costo son obligatorios', 400);
    }

    const validTipos = ['CLAP', 'Gas', 'Proteína', 'Medicamentos', 'Otro'];
    if (!validTipos.includes(tipo)) {
      return jsonResponse(false, null, 'Tipo de jornada inválido', 400);
    }
    if (costo < 0) {
      return jsonResponse(false, null, 'El costo no puede ser negativo', 400);
    }

    const jornada = await Jornada.create({ tipo, fechaJornada: new Date(fechaJornada), costo, descripcion: descripcion?.trim(), estado: 'activo' });
    return jsonResponse(true, jornada, 'Jornada creada exitosamente', 201);
  } catch (error: any) {
    console.error('Error al crear jornada:', error);
    return jsonResponse(false, null, 'Error al crear la jornada', 500);
  }
}
