import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Entrega from '@/models/Entrega';
import { withAuth, jsonResponse } from '@/lib/auth';
// @patch Actualiza estado + comentario, registra autom\u00e1ticamente en historial

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const body = await req.json();
    const { estadoPago, comentario } = body;

    const entrega = await Entrega.findById(id);
    if (!entrega) return jsonResponse(false, null, 'Entrega no encontrada', 404);

    const entry: { fecha: Date; usuario: string; usuarioId: string; accion: 'comentario' | 'cambio_estado'; contenido: string } = {
      fecha: new Date(),
      usuario: authResult.user.email,
      usuarioId: authResult.user.userId,
      accion: 'comentario',
      contenido: '',
    };

    if (estadoPago && estadoPago !== entrega.estadoPago) {
      const oldStatus = entrega.estadoPago;
      entrega.estadoPago = estadoPago;
      if (estadoPago === 'pagado') entrega.fechaPago = new Date();
      entry.accion = 'cambio_estado';
      entry.contenido = `Estado: "${oldStatus}" → "${estadoPago}"`;
      if (comentario?.trim()) entry.contenido += `. Comentario: ${comentario.trim()}`;
    } else if (comentario?.trim()) {
      entry.accion = 'comentario';
      entry.contenido = comentario.trim();
    } else {
      return jsonResponse(false, null, 'Debe proporcionar estadoPago o comentario', 400);
    }

    entrega.historial.push(entry as any);
    await entrega.save();

    const updated = await Entrega.findById(id)
      .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula')
      .populate('jornadaId', 'tipo fechaJornada')
      .lean();

    return jsonResponse(true, updated, 'Entrega actualizada exitosamente');
  } catch (error: any) {
    console.error('Error al actualizar entrega:', error);
    return jsonResponse(false, null, 'Error al actualizar la entrega', 500);
  }
}
