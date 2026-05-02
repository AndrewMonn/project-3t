// --- RUTA API: /api/comprobantes ---
// Maneja la subida y consulta de comprobantes de pago (con archivo adjunto y metadatos).
// POST: Sube comprobante (requiere autenticación, archivo form-data, vincula familia y jornada).
// GET: Lista comprobantes (requiere rol, paginado y filtrable por estado/jornada).

import { NextRequest } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import ComprobantePago from '@/models/ComprobantePago';
import Familia from '@/models/Familia';
import Jornada from '@/models/Jornada';
import Entrega from '@/models/Entrega';
import { withAuth, withRole, jsonResponse } from '@/lib/auth';

// POST /api/comprobantes
// Sube un comprobante de pago (archivo + datos) y vincula con familia y jornada.
// - Requiere autenticación (token JWT)
// - Valida tipos de archivo, tamaño y existencia de familia/jornada
// - Si la jornada está cerrada, rechaza la subida
// - Guarda el archivo en public/uploads/comprobantes
// - Crea o actualiza la Entrega relacionada
export async function POST(req: NextRequest) {
  try {
    // Validar autenticación
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const formData = await req.formData();

    // Extraer campos del form-data
    const familiaId = formData.get('familiaId') as string;
    const jornadaId = formData.get('jornadaId') as string;
    const fechaPago = formData.get('fechaPago') as string;
    const referencia = formData.get('referencia') as string;
    const file = formData.get('comprobante') as File | null;

    // Validaciones básicas
    if (!familiaId || !jornadaId || !fechaPago || !referencia) {
      return jsonResponse(false, null, 'Todos los campos son obligatorios excepto la imagen', 400);
    }
    if (!Types.ObjectId.isValid(familiaId) || !Types.ObjectId.isValid(jornadaId)) {
      return jsonResponse(false, null, 'ID de familia o jornada inválido', 400);
    }

    // Validar existencia de familia y jornada
    const familia = await Familia.findById(familiaId);
    if (!familia) return jsonResponse(false, null, 'Familia no encontrada', 404);

    const jornada = await Jornada.findById(jornadaId);
    if (!jornada) return jsonResponse(false, null, 'Jornada no encontrada', 404);
    if (jornada.estado === 'cerrado') {
      return jsonResponse(false, null, 'No se pueden subir comprobantes para una jornada cerrada', 400);
    }

    // Procesar archivo (si existe)
    let imagenUrl = '';
    if (file && file.size > 0) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        return jsonResponse(false, null, 'Tipo de archivo no válido. Use JPG, PNG o WEBP', 400);
      }
      const maxSize = 5 * 1024 * 1024;
      if (file.size > maxSize) {
        return jsonResponse(false, null, 'El archivo excede el límite de 5MB', 413);
      }

      // Guardar archivo en disco
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const ext = path.extname(file.name) || '.jpg';
      const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}${ext}`;
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'comprobantes');
      await mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueName);
      await writeFile(filePath, buffer);
      imagenUrl = `/uploads/comprobantes/${uniqueName}`;
    }

    // Crear comprobante
    const comprobante = await ComprobantePago.create({
      familiaId, jornadaId, fechaPago: new Date(fechaPago), referencia: referencia.trim(),
      imagen: imagenUrl, estadoVerificacion: 'pendiente',
    });

    // Actualizar o crear entrega relacionada
    await Entrega.findOneAndUpdate(
      { familiaId, jornadaId },
      { $set: { estadoPago: 'pagado', montoPagado: jornada.costo, fechaPago: new Date(fechaPago) } },
      { upsert: true, new: true }
    );

    // Responder con comprobante populado
    const comprobantePopulado = await ComprobantePago.findById(comprobante._id)
      .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula')
      .populate('jornadaId', 'tipo fechaJornada')
      .lean();

    return jsonResponse(true, comprobantePopulado, 'Comprobante subido exitosamente', 201);
  } catch (error: any) {
    console.error('Error al subir comprobante:', error);
    return jsonResponse(false, null, 'Error al subir el comprobante', 500);
  }
}

// GET /api/comprobantes
// Lista comprobantes de pago, paginado y filtrable por estado/jornada.
// - Requiere rol administrador o vocero
// - Devuelve comprobantes populados con familia y jornada
export async function GET(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const estado = searchParams.get('estado');
    const jornadaId = searchParams.get('jornadaId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    // Construir query dinámico
    const query: Record<string, any> = {};
    if (estado) query.estadoVerificacion = estado;
    if (jornadaId) query.jornadaId = jornadaId;

    const skip = (page - 1) * limit;

    // Buscar comprobantes y total
    const [comprobantes, total] = await Promise.all([
      ComprobantePago.find(query)
        .populate('familiaId', 'jefeDeHogar.nombre jefeDeHogar.cedula')
        .populate('jornadaId', 'tipo fechaJornada costo')
        .populate('verificadoPor', 'name')
        .sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      ComprobantePago.countDocuments(query),
    ]);

    return jsonResponse(true, { comprobantes, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Comprobantes obtenidos exitosamente');
  } catch (error: any) {
    console.error('Error al obtener comprobantes:', error);
    return jsonResponse(false, null, 'Error al obtener comprobantes', 500);
  }
}
