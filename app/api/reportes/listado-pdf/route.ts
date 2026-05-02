import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Entrega from '@/models/Entrega';
import Jornada from '@/models/Jornada';
import { withAuth, withRole, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    const { searchParams } = new URL(req.url);
    const jornadaId = searchParams.get('jornadaId');

    if (!jornadaId || !Types.ObjectId.isValid(jornadaId)) {
      return jsonResponse(false, null, 'ID de jornada inválido o no proporcionado', 400);
    }

    await connectDB();
    const jornada = await Jornada.findById(jornadaId).lean();
    if (!jornada) return jsonResponse(false, null, 'Jornada no encontrada', 404);

    const entregas = await Entrega.find({ jornadaId })
      .populate({
        path: 'familiaId',
        select: 'jefeDeHogar.nombre jefeDeHogar.cedula jefeDeHogar.telefono direccion sector esVulnerable',
        populate: { path: 'sector', select: 'name' },
      })
      .sort({ 'familiaId.jefeDeHogar.nombre': 1 })
      .lean();

    const beneficiados = entregas.map((entrega: any) => ({
      nombre: entrega.familiaId?.jefeDeHogar?.nombre || 'N/A',
      cedula: entrega.familiaId?.jefeDeHogar?.cedula || 'N/A',
      telefono: entrega.familiaId?.jefeDeHogar?.telefono || 'N/A',
      direccion: {
        calle: entrega.familiaId?.direccion?.calle || 'N/A',
        nroCasa: entrega.familiaId?.direccion?.nroCasa || 'N/A',
        referencia: entrega.familiaId?.direccion?.referencia || '',
      },
      sector: entrega.familiaId?.sector?.name || 'N/A',
      esVulnerable: entrega.familiaId?.esVulnerable || false,
      estadoPago: entrega.estadoPago,
      montoPagado: entrega.montoPagado,
      fechaPago: entrega.fechaPago,
      confirmacionEntrega: entrega.confirmacionEntrega,
      fechaConfirmacion: entrega.fechaConfirmacion,
    }));

    const resumen = {
      jornada: {
        tipo: jornada.tipo,
        fechaJornada: jornada.fechaJornada,
        costo: jornada.costo,
        estado: jornada.estado,
        descripcion: jornada.descripcion,
      },
      totalBeneficiados: beneficiados.length,
      totalPagados: beneficiados.filter((b: any) => b.estadoPago === 'pagado' || b.estadoPago === 'verificado').length,
      totalPendientes: beneficiados.filter((b: any) => b.estadoPago === 'pendiente').length,
      totalConfirmados: beneficiados.filter((b: any) => b.confirmacionEntrega).length,
      montoTotalRecaudado: beneficiados.reduce((sum: number, b: any) => sum + (b.montoPagado || 0), 0),
      fechaGeneracion: new Date().toISOString(),
    };

    return jsonResponse(true, { resumen, beneficiados }, 'Listado para PDF generado exitosamente');
  } catch (error: any) {
    console.error('Error al generar listado PDF:', error);
    return jsonResponse(false, null, 'Error al generar el listado', 500);
  }
}
