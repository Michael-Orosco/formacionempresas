import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getAuthUser();

    // 1. Validar administrador autenticado
    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de ADMIN.' },
        { status: 401 }
      );
    }

    const colegioId = user.colegioId;

    // 2. Obtener total de alumnos en el colegio
    const totalEstudiantes = await prisma.usuario.count({
      where: {
        colegioId,
        rol: 'ESTUDIANTE',
      },
    });

    // 3. Obtener total de docentes en el colegio
    const totalDocentes = await prisma.usuario.count({
      where: {
        colegioId,
        rol: 'DOCENTE',
      },
    });

    // 4. Obtener total de cursos activos en el colegio
    const totalCursos = await prisma.curso.count({
      where: {
        gradoSeccion: {
          colegioId,
        },
      },
    });

    // 5. Tareas creadas esta semana (últimos 7 días)
    const haceSieteDias = new Date();
    haceSieteDias.setDate(haceSieteDias.getDate() - 7);

    const tareasCreadasEstaSemana = await prisma.tarea.count({
      where: {
        curso: {
          gradoSeccion: {
            colegioId,
          },
        },
        fechaCreacion: {
          gte: haceSieteDias,
        },
      },
    });

    // 6. Porcentaje de entrega de tareas en el colegio
    const totalTareas = await prisma.tarea.count({
      where: {
        curso: {
          gradoSeccion: {
            colegioId,
          },
        },
      },
    });

    const tareasEntregadas = await prisma.tarea.count({
      where: {
        curso: {
          gradoSeccion: {
            colegioId,
          },
        },
        estado: 'ENTREGADA',
      },
    });

    const porcentajeEntrega = totalTareas > 0 
      ? Math.round((tareasEntregadas / totalTareas) * 100) 
      : 0;

    // 7. Desglose de tareas por curso para gráfico o listado
    const cursosConTareas = await prisma.curso.findMany({
      where: {
        gradoSeccion: {
          colegioId,
        },
      },
      select: {
        id: true,
        nombre: true,
        gradoSeccion: {
          select: {
            grado: true,
            seccion: true,
          },
        },
        _count: {
          select: {
            tareas: true,
          },
        },
      },
    });

    // 8. Estadísticas de Notificaciones
    const totalNotificacionesExitosas = await prisma.logNotificacion.count({
      where: {
        estudiante: {
          colegioId,
        },
        estado: 'EXITO',
      },
    });

    const totalNotificacionesFallidas = await prisma.logNotificacion.count({
      where: {
        estudiante: {
          colegioId,
        },
        estado: 'FALLO',
      },
    });

    return NextResponse.json({
      success: true,
      colegioId,
      kpis: {
        totalEstudiantes,
        totalDocentes,
        totalCursos,
        tareasCreadasEstaSemana,
        porcentajeEntrega,
        totalTareas,
        tareasEntregadas,
        notificacionesExito: totalNotificacionesExitosas,
        notificacionesFallo: totalNotificacionesFallidas,
      },
      reporteCursos: cursosConTareas.map((c) => ({
        id: c.id,
        nombre: c.nombre,
        aula: `${c.gradoSeccion.grado} - "${c.gradoSeccion.seccion}"`,
        tareasCount: c._count.tareas,
      })),
    });
  } catch (error: any) {
    console.error('[Admin Reportes API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
