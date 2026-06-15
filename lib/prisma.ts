import { PrismaClient } from '@prisma/client';
import path from 'path';

// Determinar la URL de la base de datos de manera dinámica y robusta
let databaseUrl = process.env.DATABASE_URL;

if (process.env.VERCEL === '1') {
  // En Vercel (servidor de solo lectura), usamos la carpeta temporal escribible /tmp
  databaseUrl = 'file:/tmp/dev.db';
} else {
  // Localmente, resolvemos la ruta absoluta a prisma/dev.db para evitar problemas de contexto en Next.js
  const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
  databaseUrl = `file:${dbPath}`;
}

// Sobrescribir en las variables de entorno para que Prisma lo lea correctamente
process.env.DATABASE_URL = databaseUrl;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: databaseUrl,
    },
  },
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
