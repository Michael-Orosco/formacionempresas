import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;

    // 1. Validar administrador autenticado
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de ADMIN.' },
        { status: 401 }
      );
    }

    // 2. Buscar usuario a eliminar y validar que sea del mismo colegio
    const usuarioAEliminar = await prisma.usuario.findUnique({
      where: { id },
    });

    if (!usuarioAEliminar) {
      return NextResponse.json(
        { error: 'El usuario no existe.' },
        { status: 404 }
      );
    }

    if (usuarioAEliminar.colegioId !== user.colegioId) {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar usuarios de otro colegio.' },
        { status: 403 }
      );
    }

    // Evitar que el admin se elimine a sí mismo
    if (usuarioAEliminar.id === user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta de administrador.' },
        { status: 400 }
      );
    }

    // 3. Eliminar usuario
    await prisma.usuario.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado correctamente.',
    });
  } catch (error: any) {
    console.error('[Admin Usuario DELETE API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
