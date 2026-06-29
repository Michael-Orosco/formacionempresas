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
  rol: 'ADMIN' | 'DOCENTE' | 'ESTUDIANTE' | 'PADRE';
  nombre: string;
  telefono: string;
  colegioId: string;
  gradoSeccionId?: string; // Para estudiantes
  codigoVinculo?: string; // Código único para que padres vinculen al estudiante
}

export interface VinculacionPadre {
  id: string;
  padreId: string;
  estudianteId: string;
  fechaVinculacion: string;
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

import {
  applySeedToLocalStorage,
  buildSeedData,
  clearLocalStorageDatabase,
  CURRENT_SEED_VERSION,
  STORAGE_KEYS,
} from './seedData';

const KEYS = STORAGE_KEYS;

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
  // Inicializar base de datos local en LocalStorage si está vacía o si el seed está desactualizado
  initDatabase() {
    if (typeof window === 'undefined') return;

    const savedVersion = localStorage.getItem(STORAGE_KEYS.SEED_VERSION);
    const needsReset =
      !localStorage.getItem(STORAGE_KEYS.USUARIOS) ||
      savedVersion !== CURRENT_SEED_VERSION;

    if (needsReset) {
      console.log(
        `[MVC Model] Seed desactualizado (v${savedVersion ?? 'ninguna'} → v${CURRENT_SEED_VERSION}). Reinicializando LocalStorage...`
      );
      clearLocalStorageDatabase();
      applySeedToLocalStorage(buildSeedData());
    }
  },

  // Restablecer la base de datos local con datos semilla frescos
  resetDatabase() {
    if (typeof window === 'undefined') return;
    clearLocalStorageDatabase();
    applySeedToLocalStorage(buildSeedData());
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
  getVinculaciones(): VinculacionPadre[] {
    return getItem<VinculacionPadre[]>(KEYS.VINCULACIONES) || [];
  },
  setVinculaciones(vinculaciones: VinculacionPadre[]): void {
    setItem(KEYS.VINCULACIONES, vinculaciones);
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
