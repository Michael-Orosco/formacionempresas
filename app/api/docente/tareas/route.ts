import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { z } from 'zod';

const taskCreateSchema = z.object({
  titulo: z.string().min(3, { message: 'El título debe tener al menos 3 caracteres' }),
  descripcion: z.string().min(5, { message: 'La descripción debe tener al menos 5 caracteres' }),
  fechaEntrega: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Fecha de entrega inválida',
  }),
  cursoId: z.string().uuid({ message: 'Curso ID inválido' }),
});

// GET: Listar tareas creadas por el docente
export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user || user.rol !== 'DOCENTE') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de DOCENTE.' },
        { status: 401 }
      );
    }

    const tareas = await prisma.tarea.findMany({
      where: {
        curso: {
          docenteId: user.id,
        },
      },
      orderBy: {
        fechaEntrega: 'asc',
      },
      include: {
        curso: {
          select: {
            id: true,
            nombre: true,
            gradoSeccion: {
              select: {
                grado: true,
                seccion: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      tareas,
    });
  } catch (error: any) {
    console.error('[Docente Tareas GET API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: Crear una nueva tarea
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user || user.rol !== 'DOCENTE') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de DOCENTE.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = taskCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de tarea inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { titulo, descripcion, fechaEntrega, cursoId } = result.data;

    // Verificar que el curso pertenezca al docente autenticado
    const curso = await prisma.curso.findFirst({
      where: {
        id: cursoId,
        docenteId: user.id,
      },
    });

    if (!curso) {
      return NextResponse.json(
        { error: 'El curso especificado no existe o no está asignado a este docente.' },
        { status: 403 }
      );
    }

    // Crear la tarea
    const nuevaTarea = await prisma.tarea.create({
      data: {
        titulo,
        descripcion,
        fechaEntrega: new Date(fechaEntrega),
        cursoId,
        estado: 'PENDIENTE',
      },
      include: {
        curso: true,
      },
    });

    return NextResponse.json({
      success: true,
      tarea: nuevaTarea,
    });
  } catch (error: any) {
    console.error('[Docente Tareas POST API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
