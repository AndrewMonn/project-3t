import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Familia from '@/models/Familia';
import Sector from '@/models/Sector';
import { withAuth, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const { searchParams } = new URL(req.url);
    const q = searchParams.get('q')?.trim();
    const sectorId = searchParams.get('sector');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const query: Record<string, any> = {};
    if (q) {
      query.$or = [
        { 'jefeDeHogar.cedula': { $regex: q, $options: 'i' } },
        { 'jefeDeHogar.nombre': { $regex: q, $options: 'i' } },
      ];
    }
    if (sectorId) query.sector = sectorId;

    const skip = (page - 1) * limit;

    const [familias, total] = await Promise.all([
      Familia.find(query).populate('sector', 'name calles').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Familia.countDocuments(query),
    ]);

    return jsonResponse(true, { familias, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Familias obtenidas exitosamente');
  } catch (error: any) {
    console.error('Error al obtener familias:', error);
    return jsonResponse(false, null, 'Error al obtener familias', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const body = await req.json();
    const { jefeDeHogar, integrantes, direccion, sector, esVulnerable, condicionesEspeciales } = body;

    if (!jefeDeHogar?.nombre || !jefeDeHogar?.cedula || !jefeDeHogar?.telefono) {
      return jsonResponse(false, null, 'Los datos del jefe de hogar son obligatorios', 400);
    }
    if (!direccion?.calle || !direccion?.nroCasa) {
      return jsonResponse(false, null, 'La dirección completa es obligatoria', 400);
    }
    if (!sector) {
      return jsonResponse(false, null, 'El sector es obligatorio', 400);
    }

    const existing = await Familia.findOne({ 'jefeDeHogar.cedula': jefeDeHogar.cedula.trim() });
    if (existing) {
      return jsonResponse(false, null, 'Ya existe una familia registrada con esta cédula', 409);
    }

    const familia = await Familia.create({
      jefeDeHogar: { nombre: jefeDeHogar.nombre.trim(), cedula: jefeDeHogar.cedula.trim(), telefono: jefeDeHogar.telefono.trim() },
      integrantes: integrantes || [],
      direccion: { calle: direccion.calle.trim(), nroCasa: direccion.nroCasa.trim(), referencia: direccion.referencia?.trim() },
      sector,
      esVulnerable: esVulnerable || false,
      condicionesEspeciales: condicionesEspeciales?.trim(),
    });

    const familiaPopulada = await Familia.findById(familia._id).populate('sector', 'name calles').lean();
    return jsonResponse(true, familiaPopulada, 'Familia creada exitosamente', 201);
  } catch (error: any) {
    console.error('Error al crear familia:', error);
    if (error.code === 11000) {
      return jsonResponse(false, null, 'Ya existe una familia con esta cédula', 409);
    }
    return jsonResponse(false, null, 'Error al crear la familia', 500);
  }
}
