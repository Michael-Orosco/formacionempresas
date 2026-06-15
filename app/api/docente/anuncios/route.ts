import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import { z } from 'zod';

const announcementSchema = z.object({
  mensaje: z.string().min(5, { message: 'El anuncio debe tener al menos 5 caracteres' }),
  cursoId: z.string().uuid({ message: 'Curso ID inválido' }),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    // 1. Validar docente autenticado
    if (!user || user.rol !== 'DOCENTE') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de DOCENTE.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = announcementSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de anuncio inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { mensaje, cursoId } = result.data;

    // 2. Verificar que el curso pertenezca al docente
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

    // 3. Crear el anuncio en la base de datos
    const nuevoAnuncio = await prisma.anuncio.create({
      data: {
        mensaje,
        cursoId,
        docenteId: user.id,
      },
    });

    // 4. Obtener estudiantes matriculados en el curso
    const matriculas = await prisma.matricula.findMany({
      where: { cursoId },
      include: {
        estudiante: {
          select: {
            id: true,
            nombre: true,
            telefono: true,
          },
        },
      },
    });

    const estudiantes = matriculas.map((m) => m.estudiante);

    if (estudiantes.length === 0) {
      return NextResponse.json({
        success: true,
        anuncio: nuevoAnuncio,
        message: 'Anuncio creado. No hay alumnos matriculados para notificar.',
        notifications: [],
      });
    }

    // 5. Construir y enviar notificaciones por WhatsApp de forma asíncrona controlada
    const sendPromises = estudiantes.map(async (estudiante) => {
      const formattedMessage = `Hola ${estudiante.nombre}, te recordamos que el Prof. ${user.nombre} publicó el siguiente anuncio en el curso ${curso.nombre}:\n\n"${mensaje}"\n\n¡Revisa tu portal escolar!`;
      
      const sendResult = await sendWhatsAppMessage(estudiante.telefono, formattedMessage);

      // Registrar el log de notificación en la base de datos
      const log = await prisma.logNotificacion.create({
        data: {
          estudianteId: estudiante.id,
          estado: sendResult.success ? 'EXITO' : 'FALLO',
          // tareaId se deja nulo porque es un anuncio
        },
      });

      return {
        estudianteId: estudiante.id,
        nombre: estudiante.nombre,
        success: sendResult.success,
        logId: log.id,
      };
    });

    const results = await Promise.allSettled(sendPromises);

    const notificationSummary = results.map((res) => {
      if (res.status === 'fulfilled') {
        return res.value;
      } else {
        return { error: 'Fallo al procesar promesa' };
      }
    });

    return NextResponse.json({
      success: true,
      anuncio: nuevoAnuncio,
      notifications: notificationSummary,
    });
  } catch (error: any) {
    console.error('[Docente Anuncios API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
