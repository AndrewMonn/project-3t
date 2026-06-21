import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Sector from '@/models/Sector';
import { withAuth, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const authResult = await withAuth(req);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const sectores = await Sector.find({}).sort({ name: 1 }).lean();
    return jsonResponse(true, sectores, 'Sectores obtenidos exitosamente');
  } catch (error: any) {
    console.error('Error al obtener sectores:', error);
    return jsonResponse(false, null, 'Error al obtener sectores', 500);
  }
}
