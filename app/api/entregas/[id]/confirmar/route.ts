import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Entrega from '@/models/Entrega';
import { withRole, jsonResponse } from '@/lib/auth';

interface RouteParams { params: { id: string }; }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    const { id } = params;
    if (!Types.ObjectId.isValid(id)) return jsonResponse(false, null, 'ID de entrega inválido', 400);

    await connectDB();
    const entrega = await Entrega.findById(id);
    if (!entrega) return jsonResponse(false, null, 'Entrega no encontrada', 404);

    if (entrega.estadoPago === 'pendiente') {
      return jsonResponse(false, null, 'No se puede confirmar la entrega física sin un pago registrado', 400);
    }
    if (entrega.confirmacionEntrega) {
      return jsonResponse(false, null, 'La entrega ya fue confirmada previamente', 400);
    }

    entrega.confirmacionEntrega = true;
    entrega.fechaConfirmacion = new Date();
    await entrega.save();

    const entregaPopulada = await Entrega.findById(entrega._id)
      .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula')
      .populate('jornadaId', 'tipo fechaJornada')
      .lean();

    return jsonResponse(true, entregaPopulada, 'Entrega física confirmada exitosamente');
  } catch (error: any) {
    console.error('Error al confirmar entrega:', error);
    return jsonResponse(false, null, 'Error al confirmar la entrega', 500);
  }
}
