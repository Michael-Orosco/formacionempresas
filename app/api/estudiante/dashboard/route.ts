import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();
    
    // Validar autenticación y rol
    if (!user || user.rol !== 'ESTUDIANTE') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de ESTUDIANTE.' },
        { status: 401 }
      );
    }

    // 1. Obtener matrículas del estudiante con información del curso y docente
    const matriculas = await prisma.matricula.findMany({
      where: { estudianteId: user.id },
      include: {
        curso: {
          include: {
            docente: {
              select: {
                id: true,
                nombre: true,
                email: true,
              },
            },
          },
        },
      },
    });

    const cursoIds = matriculas.map((m) => m.cursoId);

    // 2. Obtener tareas pendientes ordenadas por fechaEntrega
    const tareasPendientes = await prisma.tarea.findMany({
      where: {
        cursoId: { in: cursoIds },
        estado: 'PENDIENTE',
      },
      orderBy: {
        fechaEntrega: 'asc',
      },
      include: {
        curso: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // 3. Obtener sílabos para los cursos matriculados
    // Se asume la "semana actual" como la semana 2 para fines demostrativos en el seed,
    // pero retornamos todos los de la semana 2 y permitimos obtener el resto.
    const silabosSemanaActual = await prisma.silabo.findMany({
      where: {
        cursoId: { in: cursoIds },
        semana: 2, // Semana actual fija para demostración de la entrega del dashboard
      },
      include: {
        curso: {
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      matriculas: matriculas.map((m) => m.curso),
      tareas: tareasPendientes,
      silabos: silabosSemanaActual,
    });
  } catch (error: any) {
    console.error('[Student Dashboard API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
