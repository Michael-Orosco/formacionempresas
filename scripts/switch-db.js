const fs = require('fs');
const path = require('path');

const schemaPath = path.join(__dirname, '../prisma/schema.prisma');

try {
  let schema = fs.readFileSync(schemaPath, 'utf8');

  // Si detectamos Vercel o una URL de PostgreSQL explícita, configuramos PostgreSQL
  if (process.env.VERCEL === '1' || process.env.DATABASE_URL?.startsWith('postgres')) {
    console.log('[Prisma Config Switcher] Entorno de producción/Vercel detectado. Configurando provider PostgreSQL...');
    
    // Cambiar datasource de SQLite a PostgreSQL
    schema = schema.replace(/provider\s*=\s*"sqlite"/g, 'provider = "postgresql"');
    schema = schema.replace(/url\s*=\s*"file:\.\/dev\.db"/g, 'url = env("DATABASE_URL")');
    
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('[Prisma Config Switcher] Archivo schema.prisma configurado con éxito para PostgreSQL (Vercel).');
  } else {
    console.log('[Prisma Config Switcher] Entorno de desarrollo local. Configurando provider SQLite...');
    
    // Cambiar datasource a SQLite
    schema = schema.replace(/provider\s*=\s*"postgresql"/g, 'provider = "sqlite"');
    schema = schema.replace(/url\s*=\s*env\("DATABASE_URL"\)/g, 'url = "file:./dev.db"');
    
    fs.writeFileSync(schemaPath, schema, 'utf8');
    console.log('[Prisma Config Switcher] Archivo schema.prisma configurado con éxito para SQLite.');
  }
} catch (error) {
  console.error('[Prisma Config Switcher] Error al cambiar la configuración de la base de datos:', error);
  process.exit(1);
}
