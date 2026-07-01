import { Model } from '../mvc/model';
import { logger } from '../logger';

export type NivelRiesgo = 'BAJO' | 'MEDIO' | 'ALTO';

export interface PrediccionResponse {
  nota_estimada: number;
  nivel_riesgo: NivelRiesgo;
  mensaje: string;
}

/**
 * Calcula el riesgo del alumno ('BAJO', 'MEDIO', 'ALTO') 
 * basado puramente en la actividad del LocalStorage.
 */
export function calcularRiesgo(alumnoId: string, cursoId?: string): NivelRiesgo {
  const actividades = Model.getActividad();
  
  // 1. Contar logins en los últimos 7 días
  const hace7Dias = new Date();
  hace7Dias.setDate(hace7Dias.getDate() - 7);
  
  const loginsRecientes = actividades.filter(a => 
    a.alumnoId === alumnoId && 
    a.tipoEvento === 'LOGIN' && 
    new Date(a.fecha) >= hace7Dias
  ).length;

  // 2. Tareas Vistas vs Publicadas
  const tareasPublicadas = actividades.filter(a => 
    a.alumnoId === alumnoId && 
    (cursoId ? a.cursoId === cursoId : true) && 
    a.tipoEvento === 'TAREA_PUBLICADA'
  ).length;

  const tareasVistas = actividades.filter(a => 
    a.alumnoId === alumnoId && 
    (cursoId ? a.cursoId === cursoId : true) && 
    a.tipoEvento === 'TAREA_VISTA'
  ).length;

  const ratioVista = tareasPublicadas === 0 ? 1 : tareasVistas / tareasPublicadas;

  // Lógica heurística de riesgo:
  // Si no se logueó en los últimos 7 días y su interacción es bajísima: ALTO
  if (loginsRecientes === 0 && ratioVista < 0.3) return 'ALTO';
  if (loginsRecientes < 2 && ratioVista < 0.5) return 'ALTO';
  if (loginsRecientes < 4 && ratioVista < 0.8) return 'MEDIO';
  
  return 'BAJO';
}

/**
 * Recopila el resumen de actividad y hace un fetch a la API de Groq
 * para obtener la predicción estructurada.
 */
export async function predecirNota(alumnoId: string, cursoId: string): Promise<PrediccionResponse> {
  const riesgoLocal = calcularRiesgo(alumnoId, cursoId);
  const actividades = Model.getActividad();
  
  const tareasPublicadas = actividades.filter(a => 
    a.alumnoId === alumnoId && 
    a.cursoId === cursoId && 
    a.tipoEvento === 'TAREA_PUBLICADA'
  ).length;

  const tareasVistas = actividades.filter(a => 
    a.alumnoId === alumnoId && 
    a.cursoId === cursoId && 
    a.tipoEvento === 'TAREA_VISTA'
  ).length;

  // En un sistema real extraeríamos nombre del alumno y curso para contexto,
  // pero el LLM solo necesita estadísticas numéricas para estimar.
  const payload = {
    tareas_publicadas: tareasPublicadas,
    tareas_vistas: tareasVistas,
    riesgo_calculado_localmente: riesgoLocal,
    total_interacciones: actividades.filter(a => a.alumnoId === alumnoId).length
  };

  try {
    const response = await fetch('/api/ia/prediccion', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data: PrediccionResponse = await response.json();
    return data;
  } catch (error) {
    logger.error('Error al predecir la nota vía IA:', error);
    // Fallback razonable si falla la red o la API
    return {
      nota_estimada: riesgoLocal === 'ALTO' ? 10 : (riesgoLocal === 'MEDIO' ? 14 : 18),
      nivel_riesgo: riesgoLocal,
      mensaje: "No se pudo conectar con el motor de IA. Esta es una estimación basada puramente en el registro de actividad local."
    };
  }
}
