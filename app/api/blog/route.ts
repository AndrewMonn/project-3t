import { NextRequest } from 'next/server';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import { withAuth, withRole, jsonResponse } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const tag = searchParams.get('tag');

    const query: Record<string, any> = {};
    if (tag) query.tags = { $in: [tag] };

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      Post.find(query).populate('autor', 'name').sort({ fechaPublicacion: -1 }).skip(skip).limit(limit).lean(),
      Post.countDocuments(query),
    ]);

    return jsonResponse(true, { posts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } }, 'Entradas obtenidas exitosamente');
  } catch (error: any) {
    console.error('Error al obtener posts:', error);
    return jsonResponse(false, null, 'Error al obtener las entradas', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    await connectDB();
    const body = await req.json();
    const { titulo, contenido, imagenPortada, tags } = body;

    if (!titulo || !contenido) {
      return jsonResponse(false, null, 'Título y contenido son obligatorios', 400);
    }

    const post = await Post.create({
      titulo: titulo.trim(), contenido, autor: authResult.user.userId,
      imagenPortada: imagenPortada?.trim() || undefined, tags: tags || [],
    });

    const postPopulado = await Post.findById(post._id).populate('autor', 'name').lean();
    return jsonResponse(true, postPopulado, 'Entrada creada exitosamente', 201);
  } catch (error: any) {
    console.error('Error al crear post:', error);
    if (error.code === 11000) {
      return jsonResponse(false, null, 'Ya existe una entrada con este slug', 409);
    }
    return jsonResponse(false, null, 'Error al crear la entrada', 500);
  }
}
