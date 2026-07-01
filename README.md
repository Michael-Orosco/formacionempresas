# Cognitor

Plataforma SaaS educativa para colegios privados en Perú. Construida con **Next.js 16**, **React 19**, **TypeScript** y **Tailwind CSS v4**.

## Inicio rápido

```bash
npm install
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000).

### Variables de entorno

Copia `.env.example` a `.env.local`:

| Variable | Descripción |
|----------|-------------|
| `GROQ_API_KEY` | API key de Groq (solo servidor, en `app/api/ia/prediccion/route.ts`) |
| `NEXT_PUBLIC_DEMO_MODE` | `true` muestra accesos de prueba en login; `false` para producción |

## Arquitectura

```
lib/mvc/
  model.ts      → Persistencia (LocalStorage en demo)
  controller.ts → Lógica de negocio
  seedData.ts   → Datos semilla y migraciones
app/            → Vistas por rol (/admin, /docente, /estudiante, /padre)
components/ui/  → Sistema de diseño reutilizable
```

### Persistencia en LocalStorage

> **Importante:** La persistencia en `localStorage` es válida **solo para demo, sustentación académica y prototipos comerciales**. No almacena datos reales de colegios en producción.

El `Model` centraliza todas las lecturas/escrituras. Para migrar a Postgres/Supabase:

1. Reemplazar los métodos `get*` / `set*` en `lib/mvc/model.ts` por llamadas HTTP o un ORM.
2. **No modificar** `controller.ts` ni las páginas — el patrón MVC ya desacopla la UI de la persistencia.

### Seguridad de contraseñas

Las contraseñas se almacenan con **bcrypt** (`lib/password.ts`). Nunca se comparan en texto plano.

## Roles y rutas

| Rol | Ruta | Credenciales demo (si `NEXT_PUBLIC_DEMO_MODE=true`) |
|-----|------|-----------------------------------------------------|
| Admin | `/admin` | admin@colegio.edu.pe / admin123 |
| Docente | `/docente` | juan.perez@colegio.edu.pe / docente123 |
| Estudiante | `/estudiante` | pedrito@colegio.edu.pe / alumno123 |
| Padre | `/padre` | padre1@colegio.edu.pe / padre123 |

## Módulo IA

Predicción de notas vía Groq (`llama-3.1-8b-instant`). La API key **nunca** se expone al cliente.

## Pagos simulados

Los botones de activar plan premium y convenios con academias son **simulaciones** — no hay pasarela de pago real. Busca el comentario `SIMULADO` en el código.

## Scripts

```bash
npm run dev    # Desarrollo
npm run build  # Build de producción
npm run start  # Servidor de producción
```
