import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const userCreateSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
  nombre: z.string().min(3, { message: 'El nombre debe tener al menos 3 caracteres' }),
  telefono: z.string().min(9, { message: 'El teléfono debe tener al menos 9 dígitos' }),
  rol: z.enum(['DOCENTE', 'ESTUDIANTE'], { message: 'Rol inválido' }),
  gradoSeccionId: z.string().uuid().optional().nullable(),
});

// GET: Listar usuarios del colegio del administrador
export async function GET() {
  try {
    const user = await getAuthUser();

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de ADMIN.' },
        { status: 401 }
      );
    }

    const usuarios = await prisma.usuario.findMany({
      where: {
        colegioId: user.colegioId,
        rol: { in: ['DOCENTE', 'ESTUDIANTE'] },
      },
      select: {
        id: true,
        email: true,
        nombre: true,
        telefono: true,
        rol: true,
        fechaCreacion: true,
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    // Obtener aulas para poblar dropdowns
    const aulas = await prisma.gradoSeccion.findMany({
      where: { colegioId: user.colegioId },
    });

    return NextResponse.json({
      success: true,
      usuarios,
      aulas,
    });
  } catch (error: any) {
    console.error('[Admin Usuarios GET API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// POST: Registrar un nuevo usuario (Docente o Estudiante)
export async function POST(request: Request) {
  try {
    const user = await getAuthUser();

    if (!user || user.rol !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere rol de ADMIN.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const result = userCreateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos de registro inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password, nombre, telefono, rol, gradoSeccionId } = result.data;

    // Verificar si el email ya existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { email },
    });

    if (usuarioExistente) {
      return NextResponse.json(
        { error: 'El correo electrónico ya está registrado.' },
        { status: 400 }
      );
    }

    // Hash de la contraseña
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync(password, salt);

    // Crear el usuario
    const nuevoUsuario = await prisma.usuario.create({
      data: {
        email,
        passwordHash,
        nombre,
        telefono,
        rol,
        colegioId: user.colegioId,
      },
    });

    // Si es ESTUDIANTE y se seleccionó un Aula (GradoSeccion), matricularlo automáticamente en todos sus cursos
    let matriculasCreadasCount = 0;
    if (rol === 'ESTUDIANTE' && gradoSeccionId) {
      const cursosEnAula = await prisma.curso.findMany({
        where: { gradoSeccionId },
      });

      if (cursosEnAula.length > 0) {
        const matriculasData = cursosEnAula.map((curso) => ({
          estudianteId: nuevoUsuario.id,
          cursoId: curso.id,
        }));

        await prisma.matricula.createMany({
          data: matriculasData,
        });
        
        matriculasCreadasCount = cursosEnAula.length;
      }
    }

    return NextResponse.json({
      success: true,
      usuario: {
        id: nuevoUsuario.id,
        email: nuevoUsuario.email,
        nombre: nuevoUsuario.nombre,
        rol: nuevoUsuario.rol,
      },
      matriculasCreadas: matriculasCreadasCount,
    });
  } catch (error: any) {
    console.error('[Admin Usuarios POST API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
