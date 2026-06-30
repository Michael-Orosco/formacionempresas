import type {
  Anuncio,
  Colegio,
  Curso,
  GradoSeccion,
  LogNotificacion,
  Matricula,
  Silabo,
  Tarea,
  Usuario,
  VinculacionPadreAlumno,
  ActividadAlumno,
} from './model';

/** Claves usadas en localStorage. Deben coincidir con las de model.ts */
export const STORAGE_KEYS = {
  COLEGIO: 'cognitor_colegio',
  AULAS: 'cognitor_aulas',
  USUARIOS: 'cognitor_usuarios',
  CURSOS: 'cognitor_cursos',
  MATRICULAS: 'cognitor_matriculas',
  TAREAS: 'cognitor_tareas',
  SILABOS: 'cognitor_silabos',
  ANUNCIOS: 'cognitor_anuncios',
  LOGS: 'cognitor_logs',
  VINCULACIONES: 'cognitor_vinculaciones',
  ACTIVIDAD: 'cognitor_actividad',
  SESSION: 'cognitor_session',
  SEED_VERSION: 'cognitor_seed_version',
} as const;

/**
 * Versión actual del seed. Incrementar este valor fuerza un reseteo
 * automático del LocalStorage en todos los clientes al próximo acceso.
 */
export const CURRENT_SEED_VERSION = '3';

/** IDs fijos para mantener relaciones consistentes entre entidades */
export const SEED_IDS = {
  colegio: 'col-1',
  aulas: { quintoA: 'aula-1', primeroB: 'aula-2' },
  usuarios: {
    admin: 'user-admin',
    docenteMath: 'user-docente-math',
    docenteScience: 'user-docente-science',
    pedrito: 'user-alumno-pedrito',
    lucia: 'user-alumno-lucia',
    carlos: 'user-alumno-carlos',
    padre1: 'user-padre-1',
    padre2: 'user-padre-2',
  },
  cursos: {
    math5: 'curso-math-5',
    science5: 'curso-science-5',
    mathSec: 'curso-math-sec',
  },
} as const;

/** Credenciales de prueba para el login rápido */
export const SEED_CREDENTIALS = {
  admin: { email: 'admin@colegio.edu.pe', password: 'admin123' },
  docente: { email: 'juan.perez@colegio.edu.pe', password: 'docente123' },
  estudiante: { email: 'pedrito@colegio.edu.pe', password: 'alumno123' },
  padre1: { email: 'padre1@colegio.edu.pe', password: 'padre123' },
  padre2: { email: 'padre2@colegio.edu.pe', password: 'padre123' },
} as const;

/** Códigos de vinculación que el padre ingresa para asociar un hijo */
export const SEED_CODIGOS_VINCULO = {
  pedrito: 'VINC-PEDRO-5A',
  lucia: 'VINC-LUCIA-5A',
  carlos: 'VINC-CARLOS-1B',
} as const;

export interface SeedDatabase {
  colegio: Colegio;
  aulas: GradoSeccion[];
  usuarios: Usuario[];
  cursos: Curso[];
  matriculas: Matricula[];
  tareas: Tarea[];
  silabos: Silabo[];
  anuncios: Anuncio[];
  logs: LogNotificacion[];
  vinculaciones: VinculacionPadreAlumno[];
  actividad: ActividadAlumno[];
}

function buildTaskDates(baseDate = new Date()) {
  const hoy = new Date(baseDate);

  const mañana = new Date(hoy);
  mañana.setDate(hoy.getDate() + 1);
  mañana.setHours(12, 0, 0, 0);

  const enDosDias = new Date(hoy);
  enDosDias.setDate(hoy.getDate() + 2);
  enDosDias.setHours(18, 0, 0, 0);

  const enCincoDias = new Date(hoy);
  enCincoDias.setDate(hoy.getDate() + 5);
  enCincoDias.setHours(23, 59, 0, 0);

  const ayer = new Date(hoy);
  ayer.setDate(hoy.getDate() - 1);
  ayer.setHours(10, 0, 0, 0);

  return { hoy, mañana, enDosDias, enCincoDias, ayer };
}

/**
 * Construye el dataset completo de demostración.
 * Todas las entidades comparten IDs fijos para que las relaciones sean predecibles.
 */
export function buildSeedData(baseDate = new Date()): SeedDatabase {
  const { colegio: colegioId, aulas, usuarios, cursos } = SEED_IDS;
  const dates = buildTaskDates(baseDate);

  const colegio: Colegio = {
    id: colegioId,
    nombre: 'Colegio Anglo Americano',
    direccion: 'Av. Las Palmeras 123, Lima',
    licenciaActiva: true,
  };

  const aulasData: GradoSeccion[] = [
    { id: aulas.quintoA, grado: '5to de Primaria', seccion: 'A', colegioId },
    { id: aulas.primeroB, grado: '1ro de Secundaria', seccion: 'B', colegioId },
  ];

  const usuariosData: Usuario[] = [
    {
      id: usuarios.admin,
      email: SEED_CREDENTIALS.admin.email,
      passwordHash: SEED_CREDENTIALS.admin.password,
      rol: 'ADMIN',
      nombre: 'Sofía Rodríguez (Admin)',
      telefono: '+51987654321',
      colegioId,
    },
    {
      id: usuarios.docenteMath,
      email: SEED_CREDENTIALS.docente.email,
      passwordHash: SEED_CREDENTIALS.docente.password,
      rol: 'DOCENTE',
      nombre: 'Prof. Juan Pérez (Matemáticas)',
      telefono: '+51900000001',
      colegioId,
    },
    {
      id: usuarios.docenteScience,
      email: 'maria.gomez@colegio.edu.pe',
      passwordHash: SEED_CREDENTIALS.docente.password,
      rol: 'DOCENTE',
      nombre: 'Prof. María Gómez (Ciencias)',
      telefono: '+51900000002',
      colegioId,
    },
    {
      id: usuarios.pedrito,
      email: SEED_CREDENTIALS.estudiante.email,
      passwordHash: SEED_CREDENTIALS.estudiante.password,
      rol: 'ESTUDIANTE',
      nombre: 'Pedro Alcántara',
      telefono: '+51900000101',
      colegioId,
      gradoSeccionId: aulas.quintoA,
      codigoVinculo: SEED_CODIGOS_VINCULO.pedrito,
    },
    {
      id: usuarios.lucia,
      email: 'lucia@colegio.edu.pe',
      passwordHash: SEED_CREDENTIALS.estudiante.password,
      rol: 'ESTUDIANTE',
      nombre: 'Lucía Fernández',
      telefono: '+51900000102',
      colegioId,
      gradoSeccionId: aulas.quintoA,
      codigoVinculo: SEED_CODIGOS_VINCULO.lucia,
    },
    {
      id: usuarios.carlos,
      email: 'carlos@colegio.edu.pe',
      passwordHash: SEED_CREDENTIALS.estudiante.password,
      rol: 'ESTUDIANTE',
      nombre: 'Carlos Mendoza',
      telefono: '+51900000103',
      colegioId,
      gradoSeccionId: aulas.primeroB,
      codigoVinculo: SEED_CODIGOS_VINCULO.carlos,
    },
    {
      id: usuarios.padre1,
      email: SEED_CREDENTIALS.padre1.email,
      passwordHash: SEED_CREDENTIALS.padre1.password,
      rol: 'PADRE',
      nombre: 'Roberto Alcántara (Padre)',
      telefono: '+51900000201',
      colegioId,
    },
    {
      id: usuarios.padre2,
      email: SEED_CREDENTIALS.padre2.email,
      passwordHash: SEED_CREDENTIALS.padre2.password,
      rol: 'PADRE',
      nombre: 'Carmen Fernández (Madre)',
      telefono: '+51900000202',
      colegioId,
    },
  ];

  const cursosData: Curso[] = [
    {
      id: cursos.math5,
      nombre: 'Álgebra y Geometría',
      descripcion: 'Curso fundamental de matemáticas para 5to de Primaria',
      gradoSeccionId: aulas.quintoA,
      docenteId: usuarios.docenteMath,
    },
    {
      id: cursos.science5,
      nombre: 'Ciencia y Tecnología',
      descripcion: 'Estudio de la biodiversidad, química y física experimental',
      gradoSeccionId: aulas.quintoA,
      docenteId: usuarios.docenteScience,
    },
    {
      id: cursos.mathSec,
      nombre: 'Matemática Avanzada I',
      descripcion: 'Introducción al Álgebra y Trigonometría',
      gradoSeccionId: aulas.primeroB,
      docenteId: usuarios.docenteMath,
    },
  ];

  const matriculas: Matricula[] = [
    { id: 'mat-1', estudianteId: usuarios.pedrito, cursoId: cursos.math5, codigoMatricula: 'MAT-001' },
    { id: 'mat-2', estudianteId: usuarios.pedrito, cursoId: cursos.science5, codigoMatricula: 'MAT-002' },
    { id: 'mat-3', estudianteId: usuarios.lucia, cursoId: cursos.math5, codigoMatricula: 'MAT-003' },
    { id: 'mat-4', estudianteId: usuarios.lucia, cursoId: cursos.science5, codigoMatricula: 'MAT-004' },
    { id: 'mat-5', estudianteId: usuarios.carlos, cursoId: cursos.mathSec, codigoMatricula: 'MAT-005' },
  ];

  const tareas: Tarea[] = [
    {
      id: 'tarea-1',
      titulo: 'Resolución de Ecuaciones Lineales',
      descripcion: 'Resolver los ejercicios del 1 al 10 de la página 45 del libro.',
      fechaEntrega: dates.mañana.toISOString(),
      cursoId: cursos.math5,
      estado: 'PENDIENTE',
    },
    {
      id: 'tarea-2',
      titulo: 'Maqueta de la Célula Vegetal',
      descripcion: 'Elaborar una maqueta usando materiales reciclados y etiquetar sus partes.',
      fechaEntrega: dates.enDosDias.toISOString(),
      cursoId: cursos.science5,
      estado: 'PENDIENTE',
    },
    {
      id: 'tarea-3',
      titulo: 'Áreas y Volúmenes de Polígonos',
      descripcion: 'Graficar y calcular el área y volumen de las figuras geométricas mostradas en clase.',
      fechaEntrega: dates.enCincoDias.toISOString(),
      cursoId: cursos.math5,
      estado: 'PENDIENTE',
    },
    {
      id: 'tarea-4',
      titulo: 'Investigación sobre la fotosíntesis',
      descripcion: 'Monografía breve explicando la fase luminosa y oscura de la fotosíntesis.',
      fechaEntrega: dates.ayer.toISOString(),
      cursoId: cursos.science5,
      estado: 'ENTREGADA',
    },
  ];

  const silabos: Silabo[] = [
    { id: 'sil-1', semana: 1, tema: 'Introducción a los números enteros', cursoId: cursos.math5 },
    { id: 'sil-2', semana: 2, tema: 'Ecuaciones de primer grado elementales', cursoId: cursos.math5 },
    { id: 'sil-3', semana: 3, tema: 'Teoría de conjuntos y diagramas', cursoId: cursos.math5 },
    { id: 'sil-4', semana: 1, tema: 'El ecosistema y los seres vivos', cursoId: cursos.science5 },
    { id: 'sil-5', semana: 2, tema: 'La célula eucariota y procariota', cursoId: cursos.science5 },
  ];

  const anuncios: Anuncio[] = [
    {
      id: 'anuncio-1',
      mensaje: 'Recuerden que la próxima semana tendremos la evaluación bimestral de Álgebra.',
      fechaPublicacion: dates.hoy.toISOString(),
      cursoId: cursos.math5,
      docenteId: usuarios.docenteMath,
    },
  ];

  const logs: LogNotificacion[] = [
    {
      id: 'log-1',
      estudianteId: usuarios.pedrito,
      tareaId: 'tarea-1',
      fechaEnvio: dates.hoy.toISOString(),
      estado: 'EXITO',
    },
    {
      id: 'log-2',
      estudianteId: usuarios.lucia,
      tareaId: 'tarea-1',
      fechaEnvio: dates.hoy.toISOString(),
      estado: 'EXITO',
    },
    {
      id: 'log-3',
      estudianteId: usuarios.pedrito,
      tareaId: 'tarea-2',
      fechaEnvio: dates.hoy.toISOString(),
      estado: 'FALLO',
    },
  ];

  const vinculaciones: VinculacionPadreAlumno[] = [
    {
      id: 'vinc-1',
      padreId: usuarios.padre1,
      alumnoId: usuarios.pedrito,
      fechaVinculacion: dates.hoy.toISOString(),
    },
    {
      id: 'vinc-2',
      padreId: usuarios.padre2,
      alumnoId: usuarios.lucia,
      fechaVinculacion: dates.hoy.toISOString(),
    },
  ];

  const actividad: ActividadAlumno[] = [];
  for(let i = 0; i < 5; i++) {
    actividad.push({
      id: `act-log-${i}`,
      alumnoId: usuarios.pedrito,
      tipoEvento: 'LOGIN',
      fecha: new Date(dates.hoy.getTime() - i * 86400000).toISOString(),
    });
    actividad.push({
      id: `act-tv-${i}`,
      alumnoId: usuarios.pedrito,
      cursoId: cursos.math5,
      tipoEvento: 'TAREA_VISTA',
      fecha: new Date(dates.hoy.getTime() - i * 86400000).toISOString(),
    });
    actividad.push({
      id: `act-tp-${i}`,
      alumnoId: usuarios.pedrito,
      cursoId: cursos.science5,
      tipoEvento: 'TAREA_PUBLICADA',
      fecha: new Date(dates.hoy.getTime() - i * 86400000).toISOString(),
    });
  }

  return {
    colegio,
    aulas: aulasData,
    usuarios: usuariosData,
    cursos: cursosData,
    matriculas,
    tareas,
    silabos,
    anuncios,
    logs,
    vinculaciones,
    actividad,
  };
}

/** Escribe el dataset semilla en localStorage (solo en el navegador). */
export function applySeedToLocalStorage(data: SeedDatabase): void {
  if (typeof window === 'undefined') return;

  localStorage.setItem(STORAGE_KEYS.COLEGIO, JSON.stringify(data.colegio));
  localStorage.setItem(STORAGE_KEYS.AULAS, JSON.stringify(data.aulas));
  localStorage.setItem(STORAGE_KEYS.USUARIOS, JSON.stringify(data.usuarios));
  localStorage.setItem(STORAGE_KEYS.CURSOS, JSON.stringify(data.cursos));
  localStorage.setItem(STORAGE_KEYS.MATRICULAS, JSON.stringify(data.matriculas));
  localStorage.setItem(STORAGE_KEYS.TAREAS, JSON.stringify(data.tareas));
  localStorage.setItem(STORAGE_KEYS.SILABOS, JSON.stringify(data.silabos));
  localStorage.setItem(STORAGE_KEYS.ANUNCIOS, JSON.stringify(data.anuncios));
  localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(data.logs));
  localStorage.setItem(STORAGE_KEYS.VINCULACIONES, JSON.stringify(data.vinculaciones));
  localStorage.setItem(STORAGE_KEYS.ACTIVIDAD, JSON.stringify(data.actividad));
  // Marca la versión del seed para detectar migraciones futuras
  localStorage.setItem(STORAGE_KEYS.SEED_VERSION, CURRENT_SEED_VERSION);
}

/** Borra todos los datos de la app en localStorage, incluida la sesión activa. */
export function clearLocalStorageDatabase(): void {
  if (typeof window === 'undefined') return;

  Object.values(STORAGE_KEYS).forEach((key) => localStorage.removeItem(key));
}
