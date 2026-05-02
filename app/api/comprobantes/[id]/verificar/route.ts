import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import ComprobantePago from '@/models/ComprobantePago';
import Entrega from '@/models/Entrega';
import { withRole, jsonResponse } from '@/lib/auth';

interface RouteParams { params: { id: string }; }

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    const { id } = params;
    if (!Types.ObjectId.isValid(id)) return jsonResponse(false, null, 'ID de comprobante inválido', 400);

    await connectDB();
    const body = await req.json();
    const { estadoVerificacion, comentarioAdmin } = body;

    const validEstados = ['aprobado', 'rechazado'];
    if (!estadoVerificacion || !validEstados.includes(estadoVerificacion)) {
      return jsonResponse(false, null, 'Estado de verificación inválido. Use: aprobado o rechazado', 400);
    }

    const comprobante = await ComprobantePago.findById(id);
    if (!comprobante) return jsonResponse(false, null, 'Comprobante no encontrado', 404);
    if (comprobante.estadoVerificacion !== 'pendiente') {
      return jsonResponse(false, null, `Este comprobante ya fue ${comprobante.estadoVerificacion}`, 400);
    }

    comprobante.estadoVerificacion = estadoVerificacion;
    comprobante.comentarioAdmin = comentarioAdmin?.trim() || '';
    comprobante.verificadoPor = new Types.ObjectId(authResult.user.userId);
    comprobante.fechaVerificacion = new Date();
    await comprobante.save();

    if (estadoVerificacion === 'aprobado') {
      await Entrega.findOneAndUpdate(
        { familiaId: comprobante.familiaId, jornadaId: comprobante.jornadaId },
        { $set: { estadoPago: 'verificado' } }
      );
    } else {
      await Entrega.findOneAndUpdate(
        { familiaId: comprobante.familiaId, jornadaId: comprobante.jornadaId },
        { $set: { estadoPago: 'pendiente', montoPagado: 0 } }
      );
    }

    const comprobantePopulado = await ComprobantePago.findById(comprobante._id)
      .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula')
      .populate('jornadaId', 'tipo fechaJornada')
      .populate('verificadoPor', 'name')
      .lean();

    const mensaje = estadoVerificacion === 'aprobado' ? 'Comprobante aprobado exitosamente' : 'Comprobante rechazado';
    return jsonResponse(true, comprobantePopulado, mensaje);
  } catch (error: any) {
    console.error('Error al verificar comprobante:', error);
    return jsonResponse(false, null, 'Error al verificar el comprobante', 500);
  }
}
