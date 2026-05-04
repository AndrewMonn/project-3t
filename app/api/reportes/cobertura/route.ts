import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Familia from '@/models/Familia';
import Entrega from '@/models/Entrega';
import Jornada from '@/models/Jornada';
import { withAuth, withRole, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const jornadaId = searchParams.get('jornadaId');

    const totalFamilias = await Familia.countDocuments();
    const familiasVulnerables = await Familia.countDocuments({ esVulnerable: true });

    const entregasPorEstado = await Entrega.aggregate([
      ...(jornadaId ? [{ $match: { jornadaId: new (await import('mongoose')).Types.ObjectId(jornadaId) } }] : []),
      { $group: { _id: '$estadoPago', count: { $sum: 1 }, montoTotal: { $sum: '$montoPagado' } } },
    ]);

    const entregasConfirmadas = await Entrega.countDocuments({
      confirmacionEntrega: true,
      ...(jornadaId ? { jornadaId } : {}),
    });

    const coberturaPorSector = await Entrega.aggregate([
      ...(jornadaId ? [{ $match: { jornadaId: new (await import('mongoose')).Types.ObjectId(jornadaId) } }] : []),
      { $lookup: { from: 'familias', localField: 'familiaId', foreignField: '_id', as: 'familia' } },
      { $unwind: '$familia' },
      { $group: {
        _id: '$familia.sector',
        total: { $sum: 1 },
        pagadas: { $sum: { $cond: [{ $in: ['$estadoPago', ['pagado', 'verificado']] }, 1, 0] } },
        confirmadas: { $sum: { $cond: ['$confirmacionEntrega', 1, 0] } },
      }},
      { $lookup: { from: 'sectors', localField: '_id', foreignField: '_id', as: 'sectorInfo' } },
      { $unwind: '$sectorInfo' },
      { $project: {
        sector: '$sectorInfo.name',
        total: 1, pagadas: 1, confirmadas: 1,
        pendientes: { $subtract: ['$total', '$pagadas'] },
        porcentajePagado: { $multiply: [{ $divide: ['$pagadas', { $cond: [{ $eq: ['$total', 0] }, 1, '$total'] }] }, 100] },
      }},
    ]);

    const coberturaPorTipo = await Jornada.aggregate([
      { $lookup: { from: 'entregas', localField: '_id', foreignField: 'jornadaId', as: 'entregas' } },
      { $project: {
        tipo: 1, fechaJornada: 1, costo: 1, estado: 1,
        totalEntregas: { $size: '$entregas' },
        pagadas: { $size: { $filter: { input: '$entregas', as: 'e', cond: { $in: ['$$e.estadoPago', ['pagado', 'verificado']] } } } },
        confirmadas: { $size: { $filter: { input: '$entregas', as: 'e', cond: '$$e.confirmacionEntrega' } } },
        montoRecaudado: { $sum: '$entregas.montoPagado' },
      }},
      { $project: {
        tipo: 1, fechaJornada: 1, costo: 1, estado: 1, totalEntregas: 1, pagadas: 1, confirmadas: 1, montoRecaudado: 1,
        porcentajePagado: { $multiply: [{ $divide: ['$pagadas', { $cond: [{ $eq: ['$totalEntregas', 0] }, 1, '$totalEntregas'] }] }, 100] },
      }},
      { $sort: { fechaJornada: -1 } },
    ]);

    const pagadasCount = entregasPorEstado.filter((e: any) => e._id === 'pagado' || e._id === 'verificado').reduce((sum: number, e: any) => sum + e.count, 0);
    const pendientesCount = entregasPorEstado.find((e: any) => e._id === 'pendiente')?.count || 0;
    const totalEntregas = pagadasCount + pendientesCount;

    return jsonResponse(true, {
      resumen: {
        totalFamilias, familiasVulnerables, totalEntregas, pagadas: pagadasCount, pendientes: pendientesCount,
        entregasConfirmadas,
        porcentajePagado: totalEntregas > 0 ? Math.round((pagadasCount / totalEntregas) * 100) : 0,
        porcentajeEntregado: totalEntregas > 0 ? Math.round((entregasConfirmadas / totalEntregas) * 100) : 0,
      },
      porSector: coberturaPorSector,
      porTipoJornada: coberturaPorTipo,
      detalleEstados: entregasPorEstado,
    }, 'Reporte de cobertura generado exitosamente');
  } catch (error: any) {
    console.error('Error al generar reporte de cobertura:', error);
    return jsonResponse(false, null, 'Error al generar el reporte', 500);
  }
}
