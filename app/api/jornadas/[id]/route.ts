import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Jornada from '@/models/Jornada';
import { withAuth, withRole, jsonResponse } from '@/lib/auth';

interface RouteParams { params: Promise<{ id: string }>; }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonResponse(false, null, 'ID de jornada inválido', 400);

    await connectDB();
    const jornada = await Jornada.findById(id).lean();
    if (!jornada) return jsonResponse(false, null, 'Jornada no encontrada', 404);
    return jsonResponse(true, jornada, 'Jornada obtenida exitosamente');
  } catch (error: any) {
    console.error('Error al obtener jornada:', error);
    return jsonResponse(false, null, 'Error al obtener la jornada', 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonResponse(false, null, 'ID de jornada inválido', 400);

    await connectDB();
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.tipo) updateData.tipo = body.tipo;
    if (body.fechaJornada) updateData.fechaJornada = new Date(body.fechaJornada);
    if (body.costo !== undefined) updateData.costo = body.costo;
    if (body.descripcion !== undefined) updateData.descripcion = body.descripcion?.trim();
    if (body.estado) {
      const validEstados = ['activo', 'cerrado'];
      if (!validEstados.includes(body.estado)) return jsonResponse(false, null, 'Estado inválido', 400);
      updateData.estado = body.estado;
    }

    const jornada = await Jornada.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true }).lean();
    if (!jornada) return jsonResponse(false, null, 'Jornada no encontrada', 404);
    return jsonResponse(true, jornada, 'Jornada actualizada exitosamente');
  } catch (error: any) {
    console.error('Error al actualizar jornada:', error);
    return jsonResponse(false, null, 'Error al actualizar la jornada', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    if (!Types.ObjectId.isValid(id)) return jsonResponse(false, null, 'ID de jornada inválido', 400);

    await connectDB();
    const jornada = await Jornada.findByIdAndDelete(id).lean();
    if (!jornada) return jsonResponse(false, null, 'Jornada no encontrada', 404);
    return jsonResponse(true, { id }, 'Jornada eliminada exitosamente');
  } catch (error: any) {
    console.error('Error al eliminar jornada:', error);
    return jsonResponse(false, null, 'Error al eliminar la jornada', 500);
  }
}
