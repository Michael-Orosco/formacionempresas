import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;
  const { pathname } = request.nextUrl;

  // Rutas que requieren protección
  if (
    pathname.startsWith('/admin') || 
    pathname.startsWith('/docente') || 
    pathname.startsWith('/estudiante')
  ) {
    if (!token) {
      console.log(`[Middleware] Acceso denegado a ${pathname} (sin token). Redirigiendo a Login.`);
      return NextResponse.redirect(new URL('/', request.url));
    }

    try {
      // Decodificar el payload del JWT (segundo segmento en base64) para verificar el rol en el Edge.
      // La verificación criptográfica del token se realiza en la capa API de consulta de datos.
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Formato de JWT inválido');
      }
      
      // Decodificación segura en Edge usando base64url decode o decodificador atob
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
      const decodedPayload = JSON.parse(atob(payloadBase64));

      const { rol } = decodedPayload;

      // Validar correspondencia de rol y ruta protegida
      if (pathname.startsWith('/admin') && rol !== 'ADMIN') {
        console.warn(`[Middleware] Intento de acceso de ${rol} a /admin. Redirigiendo.`);
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (pathname.startsWith('/docente') && rol !== 'DOCENTE') {
        console.warn(`[Middleware] Intento de acceso de ${rol} a /docente. Redirigiendo.`);
        return NextResponse.redirect(new URL('/', request.url));
      }
      if (pathname.startsWith('/estudiante') && rol !== 'ESTUDIANTE') {
        console.warn(`[Middleware] Intento de acceso de ${rol} a /estudiante. Redirigiendo.`);
        return NextResponse.redirect(new URL('/', request.url));
      }

    } catch (error) {
      console.error('[Middleware] Error al procesar token:', error);
      // Token corrupto o inválido, limpiar y redirigir
      const response = NextResponse.redirect(new URL('/', request.url));
      response.cookies.delete('auth_token');
      return response;
    }
  }

  return NextResponse.next();
}

// Configurar los matcher de protección
export const config = {
  matcher: [
    '/admin/:path*',
    '/docente/:path*',
    '/estudiante/:path*'
  ],
};
