import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-guardian-colegio';

export interface UserPayload {
  id: string;
  email: string;
  rol: string;
  colegioId: string;
  nombre: string;
}

/**
 * Firma un token JWT con la información del usuario
 */
export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verifica un token JWT y retorna la información decodificada
 */
export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Obtiene el usuario autenticado desde las cookies HTTP-only de la petición.
 * Funciona en Server Components y Route Handlers.
 */
export async function getAuthUser(): Promise<UserPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    return verifyToken(token);
  } catch (error) {
    console.error('[Auth Helper] Error al obtener usuario autenticado:', error);
    return null;
  }
}
