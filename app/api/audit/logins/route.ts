// app/api/audit/logins/route.ts
// GET /api/audit/logins — historial de intentos de sesión (solo administradores)
// Query: ?page=1&limit=50&exitoso=true|false&email=x&ip=x&nuevaIp=true
import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import LoginAudit from '@/models/LoginAudit';
import { withRole, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const authResult = await withRole(req, ['administrador']);
  if (!authResult.success) return authResult.response;

  await connectDB();
  const { searchParams } = new URL(req.url);

  const page  = Math.max(1, parseInt(searchParams.get('page')  || '1',  10));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '50', 10));
  const skip  = (page - 1) * limit;

  const query: Record<string, any> = {};
  if (searchParams.get('exitoso') !== null && searchParams.get('exitoso') !== '') {
    query.exitoso = searchParams.get('exitoso') === 'true';
  }
  if (searchParams.get('email')) {
    query.email = { $regex: searchParams.get('email'), $options: 'i' };
  }
  if (searchParams.get('ip')) {
    query.ip = searchParams.get('ip');
  }
  if (searchParams.get('nuevaIp') === 'true') {
    query.esPrimeraIpParaUsuario = true;
    query.exitoso = true;
  }

  const [registros, total] = await Promise.all([
    LoginAudit.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    LoginAudit.countDocuments(query),
  ]);

  const [totalExitosos, totalFallidos, totalNuevasIps] = await Promise.all([
    LoginAudit.countDocuments({ exitoso: true }),
    LoginAudit.countDocuments({ exitoso: false }),
    LoginAudit.countDocuments({ esPrimeraIpParaUsuario: true, exitoso: true }),
  ]);

  return jsonResponse(true, {
    registros,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    kpis: { totalExitosos, totalFallidos, totalNuevasIps },
  }, 'Registros de auditoría obtenidos');
}
