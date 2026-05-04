import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Familia from '@/models/Familia';
import { withAuth, jsonResponse } from '@/lib/auth';

interface RouteParams { params: { id: string }; }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    const { id } = params;
    if (!Types.ObjectId.isValid(id)) {
      return jsonResponse(false, null, 'ID de familia inválido', 400);
    }

    await connectDB();
    const familia = await Familia.findById(id).populate('sector', 'name calles').lean();
    if (!familia) return jsonResponse(false, null, 'Familia no encontrada', 404);
    return jsonResponse(true, familia, 'Familia obtenida exitosamente');
  } catch (error: any) {
    console.error('Error al obtener familia:', error);
    return jsonResponse(false, null, 'Error al obtener la familia', 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    const { id } = params;
    if (!Types.ObjectId.isValid(id)) {
      return jsonResponse(false, null, 'ID de familia inválido', 400);
    }

    await connectDB();
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.jefeDeHogar) {
      updateData.jefeDeHogar = {
        nombre: body.jefeDeHogar.nombre?.trim(),
        cedula: body.jefeDeHogar.cedula?.trim(),
        telefono: body.jefeDeHogar.telefono?.trim(),
      };
    }
    if (body.integrantes) updateData.integrantes = body.integrantes;
    if (body.direccion) {
      updateData.direccion = {
        calle: body.direccion.calle?.trim(),
        nroCasa: body.direccion.nroCasa?.trim(),
        referencia: body.direccion.referencia?.trim(),
      };
    }
    if (body.sector) updateData.sector = body.sector;
    if (typeof body.esVulnerable === 'boolean') updateData.esVulnerable = body.esVulnerable;
    if (body.condicionesEspeciales !== undefined) updateData.condicionesEspeciales = body.condicionesEspeciales?.trim();

    const familia = await Familia.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('sector', 'name calles').lean();

    if (!familia) return jsonResponse(false, null, 'Familia no encontrada', 404);
    return jsonResponse(true, familia, 'Familia actualizada exitosamente');
  } catch (error: any) {
    console.error('Error al actualizar familia:', error);
    if (error.code === 11000) {
      return jsonResponse(false, null, 'Ya existe una familia con esta cédula', 409);
    }
    return jsonResponse(false, null, 'Error al actualizar la familia', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    const { id } = params;
    if (!Types.ObjectId.isValid(id)) {
      return jsonResponse(false, null, 'ID de familia inválido', 400);
    }

    await connectDB();
    const familia = await Familia.findByIdAndDelete(id).lean();
    if (!familia) return jsonResponse(false, null, 'Familia no encontrada', 404);
    return jsonResponse(true, { id }, 'Familia eliminada exitosamente');
  } catch (error: any) {
    console.error('Error al eliminar familia:', error);
    return jsonResponse(false, null, 'Error al eliminar la familia', 500);
  }
}
