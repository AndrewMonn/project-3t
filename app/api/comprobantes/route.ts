// app/api/comprobantes/route.ts
// MODIFICADO: la imagen ya NO se guarda en disco.
// Ahora se convierte a Base64 y se almacena directamente en MongoDB.
// Se eliminaron imports de `fs/promises` y `path`.

import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import ComprobantePago from '@/models/ComprobantePago';
import Familia from '@/models/Familia';
import Jornada from '@/models/Jornada';
import Entrega from '@/models/Entrega';
import { withRole, jsonResponse } from '@/lib/auth';
import { fileToBase64 } from '@/lib/imageUtils';

// POST /api/comprobantes
// Sube un comprobante de pago (archivo + datos) y vincula con familia y jornada.
// - La imagen se convierte a Base64 y se guarda en MongoDB (sin disco).
// - Requiere: familiaId, jornadaId, fechaPago, referencia, comprobante (File, opcional)
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const formData = await req.formData();

    // Extraer campos del form-data
    const familiaId  = formData.get('familiaId')  as string;
    const jornadaId  = formData.get('jornadaId')  as string;
    const fechaPago  = formData.get('fechaPago')  as string;
    const referencia = formData.get('referencia') as string;
    const file       = formData.get('comprobante') as File | null;

    // Validaciones básicas de campos requeridos
    if (!familiaId || !jornadaId || !fechaPago || !referencia) {
      return jsonResponse(false, null, 'Todos los campos son obligatorios excepto la imagen', 400);
    }
    if (!Types.ObjectId.isValid(familiaId) || !Types.ObjectId.isValid(jornadaId)) {
      return jsonResponse(false, null, 'ID de familia o jornada inválido', 400);
    }

    // Validar existencia de familia
    const familia = await Familia.findById(familiaId);
    if (!familia) return jsonResponse(false, null, 'Familia no encontrada', 404);

    // Validar existencia y estado de jornada
    const jornada = await Jornada.findById(jornadaId);
    if (!jornada) return jsonResponse(false, null, 'Jornada no encontrada', 404);
    if (jornada.estado === 'cerrado') {
      return jsonResponse(false, null, 'No se pueden subir comprobantes para una jornada cerrada', 400);
    }

    // Procesar imagen (si se adjuntó un archivo)
    let imagenDataUrl   = '';
    let imagenMimeType: string | undefined;
    let imagenTamanio:  number | undefined;

    if (file && file.size > 0) {
      // fileToBase64 valida tipo MIME, tamaño máximo (2MB) y convierte a Base64
      // Lanza un error descriptivo si algo falla
      const result = await fileToBase64(file);
      imagenDataUrl  = result.dataUrl;
      imagenMimeType = result.mimeType;
      imagenTamanio  = result.originalSize;
    }

    // Crear documento de comprobante en MongoDB
    const comprobante = await ComprobantePago.create({
      familiaId,
      jornadaId,
      fechaPago:  new Date(fechaPago),
      referencia: referencia.trim(),
      imagen:          imagenDataUrl,   // Data URL Base64 o string vacío
      imagenMimeType,                   // "image/png", "image/jpeg", etc.
      imagenTamanio,                    // tamaño original en bytes
      estadoVerificacion: 'pendiente',
    });

    // Actualizar o crear entrega relacionada
    await Entrega.findOneAndUpdate(
      { familiaId, jornadaId },
      { $set: { estadoPago: 'pagado', montoPagado: jornada.costo, fechaPago: new Date(fechaPago) } },
      { upsert: true, new: true }
    );

    // Responder con comprobante populado (sin devolver el Base64 para ahorrar ancho de banda)
    const comprobantePopulado = await ComprobantePago.findById(comprobante._id)
      .select('-imagen')  // excluir el campo pesado de la respuesta
      .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula')
      .populate('jornadaId', 'tipo fechaJornada')
      .lean();

    return jsonResponse(true, comprobantePopulado, 'Comprobante subido exitosamente', 201);

  } catch (error: any) {
    console.error('Error al subir comprobante:', error);

    // Errores de validación de imagen (tipo, tamaño) los retornamos al cliente
    if (error.message?.includes('Tipo de archivo') || error.message?.includes('supera el límite')) {
      return jsonResponse(false, null, error.message, 400);
    }

    return jsonResponse(false, null, 'Error al subir el comprobante', 500);
  }
}

// GET /api/comprobantes
// Lista comprobantes de pago, paginado y filtrable por estado/jornada.
// - Requiere rol administrador o vocero
// - NO devuelve el campo `imagen` (Base64) en el listado para no saturar la respuesta
export async function GET(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const estado   = searchParams.get('estado');
    const jornadaId = searchParams.get('jornadaId');
    const page  = parseInt(searchParams.get('page')  || '1',  10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Construir query dinámico
    const query: Record<string, any> = {};
    if (estado)    query.estadoVerificacion = estado;
    if (jornadaId) query.jornadaId = jornadaId;

    const skip = (page - 1) * limit;

    // Buscar comprobantes excluyendo el campo `imagen` (pesado) del listado
    const [comprobantes, total] = await Promise.all([
      ComprobantePago.find(query)
        .select('-imagen')  // no devolver Base64 en el listado
        .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula')
        .populate('jornadaId', 'tipo fechaJornada costo')
        .populate('verificadoPor', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      ComprobantePago.countDocuments(query),
    ]);

    return jsonResponse(
      true,
      { comprobantes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } },
      'Comprobantes obtenidos exitosamente'
    );
  } catch (error: any) {
    console.error('Error al obtener comprobantes:', error);
    return jsonResponse(false, null, 'Error al obtener comprobantes', 500);
  }
}
