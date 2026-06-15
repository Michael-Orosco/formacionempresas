import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { sendWhatsAppMessage } from '@/lib/whatsapp';

export async function GET(request: Request) {
  return handleCron(request);
}

export async function POST(request: Request) {
  return handleCron(request);
}

async function handleCron(request: Request) {
  try {
    // 1. Validar Bearer Token (CRON_SECRET)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // Si hay un CRON_SECRET configurado, exigir que coincida el Bearer token
    if (cronSecret) {
      if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
        console.warn('[Cron Job] Intento de ejecución no autorizado.');
        return NextResponse.json(
          { error: 'No autorizado. Token de seguridad inválido o no provisto.' },
          { status: 401 }
        );
      }
    } else {
      console.warn('[Cron Job] CRON_SECRET no configurado en variables de entorno. Ejecutando sin validación (Desarrollo).');
    }

    // 2. Definir rangos de fecha para "mañana" y "en 48 horas"
    const ahora = new Date();
    
    // Inicio de mañana: mañana a las 00:00:00
    const inicioMañana = new Date(ahora);
    inicioMañana.setDate(ahora.getDate() + 1);
    inicioMañana.setHours(0, 0, 0, 0);

    // Fin de pasado mañana: pasado mañana a las 23:59:59 (cubre ventana de 48 horas completo)
    const finPasadoMañana = new Date(ahora);
    finPasadoMañana.setDate(ahora.getDate() + 2);
    finPasadoMañana.setHours(23, 59, 59, 999);

    console.log(`[Cron Job] Buscando tareas venciendo entre ${inicioMañana.toISOString()} y ${finPasadoMañana.toISOString()}`);

    // 3. Buscar tareas pendientes en ese rango de entrega
    const tareasPendientes = await prisma.tarea.findMany({
      where: {
        estado: 'PENDIENTE',
        fechaEntrega: {
          gte: inicioMañana,
          lte: finPasadoMañana,
        },
      },
      include: {
        curso: {
          include: {
            matriculas: {
              include: {
                estudiante: true,
              },
            },
          },
        },
      },
    });

    console.log(`[Cron Job] Se encontraron ${tareasPendientes.length} tareas pendientes en el rango.`);

    if (tareasPendientes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No hay tareas pendientes por vencer en las próximas 24h o 48h. No se enviaron recordatorios.',
        remindersSent: 0,
      });
    }

    const reminderPromises: Promise<any>[] = [];

    // 4. Iterar sobre las tareas y sus estudiantes matriculados
    for (const tarea of tareasPendientes) {
      const matriculas = tarea.curso.matriculas;
      const cursoNombre = tarea.curso.nombre;

      for (const matricula of matriculas) {
        const estudiante = matricula.estudiante;

        // Omitir si no hay teléfono registrado
        if (!estudiante.telefono) continue;

        // Formatear fecha de entrega para que sea amigable
        const fechaFormateada = new Date(tarea.fechaEntrega).toLocaleDateString('es-PE', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        });

        // Construir mensaje
        const mensaje = `Hola ${estudiante.nombre}, te recordamos que tienes la tarea '${tarea.titulo}' del curso ${cursoNombre} para entregar el ${fechaFormateada}. ¡No lo olvides!`;

        // Añadir envío a la lista de promesas a ejecutar
        const sendAndLogPromise = (async () => {
          const sendResult = await sendWhatsAppMessage(estudiante.telefono, mensaje);

          // Registrar resultado en LogNotificacion
          const log = await prisma.logNotificacion.create({
            data: {
              tareaId: tarea.id,
              estudianteId: estudiante.id,
              estado: sendResult.success ? 'EXITO' : 'FALLO',
            },
          });

          return {
            tareaId: tarea.id,
            tareaTitulo: tarea.titulo,
            estudianteNombre: estudiante.nombre,
            estudianteTelefono: estudiante.telefono,
            success: sendResult.success,
            logId: log.id,
          };
        })();

        reminderPromises.push(sendAndLogPromise);
      }
    }

    // 5. Ejecución controlada con Promise.allSettled
    console.log(`[Cron Job] Despachando ${reminderPromises.length} peticiones de WhatsApp...`);
    const results = await Promise.allSettled(reminderPromises);

    const successfulSends = results.filter(
      (r) => r.status === 'fulfilled' && r.value.success
    ).length;

    const failedSends = reminderPromises.length - successfulSends;

    const details = results.map((r) => {
      if (r.status === 'fulfilled') {
        return r.value;
      } else {
        return { error: 'Excepción al ejecutar envío de WhatsApp', reason: r.reason };
      }
    });

    console.log(`[Cron Job] Envíos completados. Éxitos: ${successfulSends}, Fallidos: ${failedSends}`);

    return NextResponse.json({
      success: true,
      summary: {
        totalTasksChecked: tareasPendientes.length,
        totalRemindersAttempted: reminderPromises.length,
        successfulSends,
        failedSends,
      },
      details,
    });
  } catch (error: any) {
    console.error('[Cron Job Error]:', error);
    return NextResponse.json(
      { error: 'Fallo al ejecutar el cron de recordatorios', details: error.message || String(error) },
      { status: 500 }
    );
  }
}
