import { NextRequest } from 'next/server';
import { Types } from 'mongoose';
import connectDB from '@/lib/mongodb';
import Post from '@/models/Post';
import { withAuth, withRole, jsonResponse } from '@/lib/auth';

interface RouteParams { params: { id: string }; }

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = params;
    if (!Types.ObjectId.isValid(id)) {
      return jsonResponse(false, null, 'ID de entrada inválido', 400);
    }

    await connectDB();
    const post = await Post.findById(id).populate('autor', 'name').lean();
    if (!post) return jsonResponse(false, null, 'Entrada no encontrada', 404);
    return jsonResponse(true, post, 'Entrada obtenida exitosamente');
  } catch (error: any) {
    console.error('Error al obtener post:', error);
    return jsonResponse(false, null, 'Error al obtener la entrada', 500);
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    const { id } = params;
    if (!Types.ObjectId.isValid(id)) return jsonResponse(false, null, 'ID de entrada inválido', 400);

    await connectDB();
    const body = await req.json();
    const updateData: Record<string, any> = {};

    if (body.titulo !== undefined) updateData.titulo = body.titulo.trim();
    if (body.contenido !== undefined) updateData.contenido = body.contenido;
    if (body.imagenPortada !== undefined) updateData.imagenPortada = body.imagenPortada?.trim() || undefined;
    if (body.tags !== undefined) updateData.tags = body.tags;
    if (body.fechaPublicacion) updateData.fechaPublicacion = new Date(body.fechaPublicacion);

    const post = await Post.findByIdAndUpdate(id, { $set: updateData }, { new: true, runValidators: true })
      .populate('autor', 'name').lean();

    if (!post) return jsonResponse(false, null, 'Entrada no encontrada', 404);
    return jsonResponse(true, post, 'Entrada actualizada exitosamente');
  } catch (error: any) {
    console.error('Error al actualizar post:', error);
    if (error.code === 11000) {
      return jsonResponse(false, null, 'Ya existe una entrada con este slug', 409);
    }
    return jsonResponse(false, null, 'Error al actualizar la entrada', 500);
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withRole(req, ['administrador', 'vocero']);
    if (!authResult.success) return authResult.response;

    const { id } = params;
    if (!Types.ObjectId.isValid(id)) return jsonResponse(false, null, 'ID de entrada inválido', 400);

    await connectDB();
    const post = await Post.findByIdAndDelete(id).lean();
    if (!post) return jsonResponse(false, null, 'Entrada no encontrada', 404);
    return jsonResponse(true, { id }, 'Entrada eliminada exitosamente');
  } catch (error: any) {
    console.error('Error al eliminar post:', error);
    return jsonResponse(false, null, 'Error al eliminar la entrada', 500);
  }
}
