import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Entrega from '@/models/Entrega';
import Jornada from '@/models/Jornada';
import Familia from '@/models/Familia';
import { withAuth, withRole, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const jornadaId = searchParams.get('jornadaId');
    const familiaId = searchParams.get('familiaId');
    const estadoPago = searchParams.get('estadoPago');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const query: Record<string, any> = {};
    if (jornadaId) query.jornadaId = jornadaId;
    if (familiaId) query.familiaId = familiaId;
    if (estadoPago) query.estadoPago = estadoPago;

    const skip = (page - 1) * limit;

    const [entregas, total] = await Promise.all([
      Entrega.find(query)
        .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula direccion')
        .populate('jornadaId', 'tipo fechaJornada costo estado')
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Entrega.countDocuments(query),
    ]);

    return jsonResponse(true, { entregas, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Entregas obtenidas exitosamente');
  } catch (error: any) {
    console.error('Error al obtener entregas:', error);
    return jsonResponse(false, null, 'Error al obtener entregas', 500);
  }
}

// @docs: Added tipoSolicitud + asunto support, removed 11000 catch (no unique index)
export async function POST(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const body = await req.json();
    const { familiaId, jornadaId, tipoSolicitud, asunto, estadoPago, montoPagado, fechaPago, observaciones } = body;

    if (!familiaId) {
      return jsonResponse(false, null, 'Familia es obligatoria', 400);
    }

    const validEstados = ['pendiente', 'pagado', 'verificado'];
    if (estadoPago && !validEstados.includes(estadoPago)) {
      return jsonResponse(false, null, 'Estado de pago inválido', 400);
    }

    if (tipoSolicitud === 'otra') {
      if (!asunto?.trim()) {
        return jsonResponse(false, null, 'Debe ingresar un asunto para la solicitud', 400);
      }
    } else {
      if (!jornadaId) {
        return jsonResponse(false, null, 'Jornada es obligatoria para solicitudes de beneficio', 400);
      }
      const jornada = await Jornada.findById(jornadaId);
      if (!jornada) return jsonResponse(false, null, 'Jornada no encontrada', 404);
      if (jornada.estado === 'cerrado') {
        return jsonResponse(false, null, 'No se pueden registrar entregas en una jornada cerrada', 400);
      }
    }

    const familia = await Familia.findById(familiaId);
    if (!familia) return jsonResponse(false, null, 'Familia no encontrada', 404);

    const entregaData: Record<string, any> = {
      familiaId,
      tipoSolicitud: tipoSolicitud || 'beneficio',
      estadoPago: estadoPago || 'pendiente'
    };
    if (jornadaId) entregaData.jornadaId = jornadaId;
    if (asunto) entregaData.asunto = asunto.trim();
    if (montoPagado !== undefined) entregaData.montoPagado = montoPagado;
    if (fechaPago) entregaData.fechaPago = new Date(fechaPago);
    if (observaciones) entregaData.observaciones = observaciones.trim();

    const entrega = await Entrega.create(entregaData);

    const entregaPopulada = await Entrega.findById(entrega._id)
      .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula')
      .populate('jornadaId', 'tipo fechaJornada')
      .lean();

    return jsonResponse(true, entregaPopulada, 'Entrega registrada exitosamente', 201);
  } catch (error: any) {
    console.error('Error al registrar entrega:', error);
    return jsonResponse(false, null, 'Error al registrar la entrega', 500);
  }
}
