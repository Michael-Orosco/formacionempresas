export interface Colegio {
  id: string;
  nombre: string;
  direccion: string;
  licenciaActiva: boolean;
}

export interface Usuario {
  id: string;
  email: string;
  passwordHash: string; // En localstorage guardamos contraseñas simples o hashes
  rol: 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE';
  nombre: string;
  telefono: string;
  colegioId: string;
  gradoSeccionId?: string; // Para estudiantes
}

export interface GradoSeccion {
  id: string;
  grado: string;
  seccion: string;
  colegioId: string;
}

export interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
  gradoSeccionId: string;
  docenteId: string;
}

export interface Matricula {
  id: string;
  estudianteId: string;
  cursoId: string;
}

export interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  cursoId: string;
  estado: 'PENDIENTE' | 'ENTREGADA';
}

export interface Silabo {
  id: string;
  semana: number;
  tema: string;
  cursoId: string;
}

export interface Anuncio {
  id: string;
  mensaje: string;
  fechaPublicacion: string;
  cursoId: string;
  docenteId: string;
}

export interface LogNotificacion {
  id: string;
  tareaId?: string;
  estudianteId: string;
  fechaEnvio: string;
  estado: 'EXITO' | 'FALLO';
}

// Claves de LocalStorage
const KEYS = {
  COLEGIO: 'educontrol_colegio',
  AULAS: 'educontrol_aulas',
  USUARIOS: 'educontrol_usuarios',
  CURSOS: 'educontrol_cursos',
  MATRICULAS: 'educontrol_matriculas',
  TAREAS: 'educontrol_tareas',
  SILABOS: 'educontrol_silabos',
  ANUNCIOS: 'educontrol_anuncios',
  LOGS: 'educontrol_logs',
  SESSION: 'educontrol_session'
};

// Función para obtener un dato parseado o nulo
function getItem<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  const data = localStorage.getItem(key);
  return data ? JSON.parse(data) : null;
}

// Función para guardar un dato
function setItem<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export const Model = {
  // Inicializar base de datos local en LocalStorage si está vacía
  initDatabase() {
    if (typeof window === 'undefined') return;

    if (!localStorage.getItem(KEYS.USUARIOS)) {
      console.log('[MVC Model] Inicializando LocalStorage con datos semilla...');

      const colegioId = 'col-1';
      const colegio: Colegio = {
        id: colegioId,
        nombre: 'Colegio Anglo Americano',
        direccion: 'Av. Las Palmeras 123, Lima',
        licenciaActiva: true
      };

      const aulas: GradoSeccion[] = [
        { id: 'aula-1', grado: '5to de Primaria', seccion: 'A', colegioId },
        { id: 'aula-2', grado: '1ro de Secundaria', seccion: 'B', colegioId }
      ];

      const usuarios: Usuario[] = [
        {
          id: 'user-admin',
          email: 'admin@colegio.edu.pe',
          passwordHash: 'admin123', // Guardamos contraseña de prueba directa
          rol: 'ADMIN',
          nombre: 'Sofía Rodríguez (Admin)',
          telefono: '+51987654321',
          colegioId
        },
        {
          id: 'user-docente-math',
          email: 'juan.perez@colegio.edu.pe',
          passwordHash: 'docente123',
          rol: 'DOCENTE',
          nombre: 'Prof. Juan Pérez (Matemáticas)',
          telefono: '+51900000001',
          colegioId
        },
        {
          id: 'user-docente-science',
          email: 'maria.gomez@colegio.edu.pe',
          passwordHash: 'docente123',
          rol: 'DOCENTE',
          nombre: 'Prof. María Gómez (Ciencias)',
          telefono: '+51900000002',
          colegioId
        },
        {
          id: 'user-alumno-pedrito',
          email: 'pedrito@colegio.edu.pe',
          passwordHash: 'alumno123',
          rol: 'ESTUDIANTE',
          nombre: 'Pedro Alcántara',
          telefono: '+51900000101',
          colegioId,
          gradoSeccionId: 'aula-1'
        },
        {
          id: 'user-alumno-lucia',
          email: 'lucia@colegio.edu.pe',
          passwordHash: 'alumno123',
          rol: 'ESTUDIANTE',
          nombre: 'Lucía Fernández',
          telefono: '+51900000102',
          colegioId,
          gradoSeccionId: 'aula-1'
        },
        {
          id: 'user-alumno-carlos',
          email: 'carlos@colegio.edu.pe',
          passwordHash: 'alumno123',
          rol: 'ESTUDIANTE',
          nombre: 'Carlos Mendoza',
          telefono: '+51900000103',
          colegioId,
          gradoSeccionId: 'aula-2'
        }
      ];

      const cursos: Curso[] = [
        {
          id: 'curso-math-5',
          nombre: 'Álgebra y Geometría',
          descripcion: 'Curso fundamental de matemáticas para 5to de Primaria',
          gradoSeccionId: 'aula-1',
          docenteId: 'user-docente-math'
        },
        {
          id: 'curso-science-5',
          nombre: 'Ciencia y Tecnología',
          descripcion: 'Estudio de la biodiversidad, química y física experimental',
          gradoSeccionId: 'aula-1',
          docenteId: 'user-docente-science'
        },
        {
          id: 'curso-math-sec',
          nombre: 'Matemática Avanzada I',
          descripcion: 'Introducción al Álgebra y Trigonometría',
          gradoSeccionId: 'aula-2',
          docenteId: 'user-docente-math'
        }
      ];

      const matriculas: Matricula[] = [
        { id: 'mat-1', estudianteId: 'user-alumno-pedrito', cursoId: 'curso-math-5' },
        { id: 'mat-2', estudianteId: 'user-alumno-pedrito', cursoId: 'curso-science-5' },
        { id: 'mat-3', estudianteId: 'user-alumno-lucia', cursoId: 'curso-math-5' },
        { id: 'mat-4', estudianteId: 'user-alumno-lucia', cursoId: 'curso-science-5' },
        { id: 'mat-5', estudianteId: 'user-alumno-carlos', cursoId: 'curso-math-sec' }
      ];

      const hoy = new Date();
      const mañana = new Date(hoy.getTime() + 24 * 60 * 60 * 1000).toISOString();
      const enDosDias = new Date(hoy.getTime() + 48 * 60 * 60 * 1000).toISOString();
      const enCincoDias = new Date(hoy.getTime() + 120 * 60 * 60 * 1000).toISOString();
      const ayer = new Date(hoy.getTime() - 24 * 60 * 60 * 1000).toISOString();

      const tareas: Tarea[] = [
        {
          id: 'tarea-1',
          titulo: 'Resolución de Ecuaciones Lineales',
          descripcion: 'Resolver los ejercicios del 1 al 10 de la página 45 del libro.',
          fechaEntrega: mañana,
          cursoId: 'curso-math-5',
          estado: 'PENDIENTE'
        },
        {
          id: 'tarea-2',
          titulo: 'Maqueta de la Célula Vegetal',
          descripcion: 'Elaborar una maqueta usando materiales reciclados y etiquetar sus partes.',
          fechaEntrega: enDosDias,
          cursoId: 'curso-science-5',
          estado: 'PENDIENTE'
        },
        {
          id: 'tarea-3',
          titulo: 'Áreas y Volúmenes de Polígonos',
          descripcion: 'Graficar y calcular el área y volumen de las figuras geométricas mostradas en clase.',
          fechaEntrega: enCincoDias,
          cursoId: 'curso-math-5',
          estado: 'PENDIENTE'
        },
        {
          id: 'tarea-4',
          titulo: 'Investigación sobre la fotosíntesis',
          descripcion: 'Monografía breve explicando la fase luminosa y oscura de la fotosíntesis.',
          fechaEntrega: ayer,
          cursoId: 'curso-science-5',
          estado: 'ENTREGADA'
        }
      ];

      const silabos: Silabo[] = [
        { id: 'sil-1', semana: 1, tema: 'Introducción a los números enteros', cursoId: 'curso-math-5' },
        { id: 'sil-2', semana: 2, tema: 'Ecuaciones de primer grado elementales', cursoId: 'curso-math-5' },
        { id: 'sil-3', semana: 3, tema: 'Teoría de conjuntos y diagramas', cursoId: 'curso-math-5' },
        { id: 'sil-4', semana: 1, tema: 'El ecosistema y los seres vivos', cursoId: 'curso-science-5' },
        { id: 'sil-5', semana: 2, tema: 'La célula eucariota y procariota', cursoId: 'curso-science-5' }
      ];

      const anuncios: Anuncio[] = [
        {
          id: 'anuncio-1',
          mensaje: 'Recuerden que la próxima semana tendremos la evaluación bimestral de Álgebra.',
          fechaPublicacion: hoy.toISOString(),
          cursoId: 'curso-math-5',
          docenteId: 'user-docente-math'
        }
      ];

      const logs: LogNotificacion[] = [
        { id: 'log-1', estudianteId: 'user-alumno-pedrito', tareaId: 'tarea-1', fechaEnvio: hoy.toISOString(), estado: 'EXITO' },
        { id: 'log-2', estudianteId: 'user-alumno-lucia', tareaId: 'tarea-1', fechaEnvio: hoy.toISOString(), estado: 'EXITO' },
        { id: 'log-3', estudianteId: 'user-alumno-pedrito', tareaId: 'tarea-2', fechaEnvio: hoy.toISOString(), estado: 'FALLO' }
      ];

      setItem(KEYS.COLEGIO, colegio);
      setItem(KEYS.AULAS, aulas);
      setItem(KEYS.USUARIOS, usuarios);
      setItem(KEYS.CURSOS, cursos);
      setItem(KEYS.MATRICULAS, matriculas);
      setItem(KEYS.TAREAS, tareas);
      setItem(KEYS.SILABOS, silabos);
      setItem(KEYS.ANUNCIOS, anuncios);
      setItem(KEYS.LOGS, logs);
    }
  },

  // Getters y Setters genéricos de LocalStorage
  getColegio(): Colegio | null {
    return getItem<Colegio>(KEYS.COLEGIO);
  },
  getAulas(): GradoSeccion[] {
    return getItem<GradoSeccion[]>(KEYS.AULAS) || [];
  },
  getUsuarios(): Usuario[] {
    return getItem<Usuario[]>(KEYS.USUARIOS) || [];
  },
  setUsuarios(usuarios: Usuario[]): void {
    setItem(KEYS.USUARIOS, usuarios);
  },
  getCursos(): Curso[] {
    return getItem<Curso[]>(KEYS.CURSOS) || [];
  },
  setCursos(cursos: Curso[]): void {
    setItem(KEYS.CURSOS, cursos);
  },
  getMatriculas(): Matricula[] {
    return getItem<Matricula[]>(KEYS.MATRICULAS) || [];
  },
  setMatriculas(matriculas: Matricula[]): void {
    setItem(KEYS.MATRICULAS, matriculas);
  },
  getTareas(): Tarea[] {
    return getItem<Tarea[]>(KEYS.TAREAS) || [];
  },
  setTareas(tareas: Tarea[]): void {
    setItem(KEYS.TAREAS, tareas);
  },
  getSilabos(): Silabo[] {
    return getItem<Silabo[]>(KEYS.SILABOS) || [];
  },
  setSilabos(silabos: Silabo[]): void {
    setItem(KEYS.SILABOS, silabos);
  },
  getAnuncios(): Anuncio[] {
    return getItem<Anuncio[]>(KEYS.ANUNCIOS) || [];
  },
  setAnuncios(anuncios: Anuncio[]): void {
    setItem(KEYS.ANUNCIOS, anuncios);
  },
  getLogs(): LogNotificacion[] {
    return getItem<LogNotificacion[]>(KEYS.LOGS) || [];
  },
  setLogs(logs: LogNotificacion[]): void {
    setItem(KEYS.LOGS, logs);
  },
  getCurrentUser(): Usuario | null {
    return getItem<Usuario>(KEYS.SESSION);
  },
  setCurrentUser(user: Usuario): void {
    setItem(KEYS.SESSION, user);
  },
  clearCurrentUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(KEYS.SESSION);
  }
};
