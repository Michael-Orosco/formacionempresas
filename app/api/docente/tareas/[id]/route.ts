import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const taskUpdateSchema = z.object({
  titulo: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres' }).optional(),
  descripcion: z.string().min(5, { message: 'La descripción debe tener al menos 5 caracteres' }).optional(),
  fechaEntrega: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de entrega inválida',
  }).optional(),
  estado: z.enum(['PENDIENTE', 'ENTREGADA']).optional(),
});

// DELETE: Eliminar una tarea
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;

    if (!user || user.rol !== 'DOCENTE') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de DOCENTE.' },
        { status: 401 }
      );
    }

    // Buscar la tarea y verificar que pertenezca a un curso del docente
    const tarea = await prisma.tarea.findUnique({
      where: { id },
      include: {
        curso: true,
      },
    });

    if (!tarea) {
      return NextResponse.json(
        { error: 'La tarea no existe.' },
        { status: 404 }
      );
    }

    if (tarea.curso.docenteId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para eliminar esta tarea.' },
        { status: 403 }
      );
    }

    // Eliminar la tarea
    await prisma.tarea.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Tarea eliminada correctamente.',
    });
  } catch (error: any) {
    console.error('[Docente Tarea DELETE API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT: Editar una tarea
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    const { id } = await params;

    if (!user || user.rol !== 'DOCENTE') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de DOCENTE.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = taskUpdateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de edición inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Buscar tarea y validar permisos
    const tareaExistente = await prisma.tarea.findUnique({
      where: { id },
      include: {
        curso: true,
      },
    });

    if (!tareaExistente) {
      return NextResponse.json(
        { error: 'La tarea no existe.' },
        { status: 404 }
      );
    }

    if (tareaExistente.curso.docenteId !== user.id) {
      return NextResponse.json(
        { error: 'No tienes permiso para editar esta tarea.' },
        { status: 403 }
      );
    }

    const { titulo, descripcion, fechaEntrega, estado } = result.data;

    // Actualizar tarea
    const tareaActualizada = await prisma.tarea.update({
      where: { id },
      data: {
        ...(titulo && { titulo }),
        ...(descripcion && { descripcion }),
        ...(fechaEntrega && { fechaEntrega: new Date(fechaEntrega) }),
        ...(estado && { estado }),
      },
    });

    return NextResponse.json({
      success: true,
      tarea: tareaActualizada,
    });
  } catch (error: any) {
    console.error('[Docente Tarea PUT API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
