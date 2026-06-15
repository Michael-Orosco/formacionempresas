import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { signToken } from '@/lib/auth';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email({ message: 'Email inválido' }),
  password: z.string().min(6, { message: 'La contraseña debe tener al menos 6 caracteres' }),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validación de entrada
    const result = loginSchema.safeParse(body);
    if (!result.success) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: result.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { email, password } = result.data;

    // Auto-poblar (autoseed) si la base de datos está vacía
    try {
      const userCount = await prisma.usuario.count();
      if (userCount === 0) {
        const { seedDatabaseProgrammatically } = await import('@/lib/seed');
        await seedDatabaseProgrammatically();
      }
    } catch (dbError: any) {
      console.warn('[Login API] Falló el autoseed o la verificación de tablas, posiblemente la base de datos no esté inicializada:', dbError.message);
    }

    // Buscar usuario en base de datos
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Verificar contraseña
    const passwordMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: 'Credenciales incorrectas' },
        { status: 401 }
      );
    }

    // Crear token JWT
    const token = signToken({
      id: user.id,
      email: user.email,
      rol: user.rol,
      colegioId: user.colegioId,
      nombre: user.nombre,
    });

    // Construir la respuesta con la cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        rol: user.rol,
        nombre: user.nombre,
        colegioId: user.colegioId,
      },
    });

    // Configurar la cookie HttpOnly
    response.cookies.set({
      name: 'auth_token',
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 días en segundos
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[Login API] Error:', error);
    return NextResponse.json(
      { error: `Error interno del servidor: ${error.message || String(error)}` },
      { status: 500 }
    );
  }
}
