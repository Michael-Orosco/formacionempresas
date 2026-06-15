import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user || user.rol !== 'DOCENTE') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de DOCENTE.' },
        { status: 401 }
      );
    }

    const cursos = await prisma.curso.findMany({
      where: {
        docenteId: user.id,
      },
      include: {
        gradoSeccion: {
          select: {
            grado: true,
            seccion: true,
          },
        },
      },
      orderBy: {
        nombre: 'asc',
      },
    });

    return NextResponse.json({
      success: true,
      cursos: cursos.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        aula: `${c.gradoSeccion.grado} - "${c.gradoSeccion.seccion}"`,
      })),
    });
  } catch (error: any) {
    console.error('[Docente Cursos GET API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
