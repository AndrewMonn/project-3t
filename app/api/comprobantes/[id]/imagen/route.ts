// app/api/comprobantes/[id]/imagen/route.ts
// Endpoint dedicado para obtener la imagen Base64 de un comprobante específico.
// Se separa del GET principal para no saturar el listado con strings pesados.
//
// GET /api/comprobantes/:id/imagen
// - Requiere rol administrador o vocero
// - Devuelve solo el campo `imagen` (Data URL Base64) y sus metadatos

import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import ComprobantePago from '@/models/ComprobantePago';
import { withRole, jsonResponse } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    const { id } = params;
    if (!Types.ObjectId.isValid(id)) {
      return jsonResponse(false, null, 'ID de comprobante inválido', 400);
    }

    await connectDB();

    // Solo seleccionamos los campos de imagen para no cargar todo el documento
    const comprobante = await ComprobantePago.findById(id)
      .select('imagen imagenMimeType imagenTamanio')
      .lean();

    if (!comprobante) {
      return jsonResponse(false, null, 'Comprobante no encontrado', 404);
    }

    if (!comprobante.imagen) {
      return jsonResponse(false, null, 'Este comprobante no tiene imagen adjunta', 404);
    }

    return jsonResponse(true, {
      imagen:         comprobante.imagen,          // Data URL Base64 completo
      imagenMimeType: comprobante.imagenMimeType,  // "image/png", etc.
      imagenTamanio:  comprobante.imagenTamanio,   // tamaño original en bytes
    }, 'Imagen obtenida exitosamente');

  } catch (error: any) {
    console.error('Error al obtener imagen del comprobante:', error);
    return jsonResponse(false, null, 'Error al obtener la imagen', 500);
  }
}
