"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Calendar,
  BookOpen,
  Clock,
  LogOut,
  CheckCircle,
  AlertTriangle,
  Award,
  ChevronRight,
  Loader2,
  Bell,
  Rocket,
  Lock
} from "lucide-react";
import { Controller } from "@/lib/mvc/controller";

interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
  docente: {
    nombre: string;
    email: string;
  };
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  curso: {
    id: string;
    nombre: string;
  };
  estado: string;
}

interface Silabo {
  id: string;
  semana: number;
  tema: string;
  curso: {
    id: string;
    nombre: string;
  };
}

interface Anuncio {
  id: string;
  mensaje: string;
  fechaPublicacion: string;
  curso: { id: string; nombre: string };
  docente: string;
}


export default function EstudianteDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Curso[]>([]);
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [syllabus, setSyllabus] = useState<Silabo[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Estudiante");

  useEffect(() => {
    // Protección de ruta a nivel de cliente
    const currentUser = Controller.getCurrentUser();
    if (!currentUser || currentUser.rol !== "ESTUDIANTE") {
      console.log("[Estudiante View] Usuario no autorizado. Redirigiendo a Login.");
      router.push("/");
      return;
    }
    setUserName(currentUser.nombre);

    const userId = currentUser.id;

    function fetchDashboardData() {
      try {
        const data = Controller.getEstudianteDashboardData(userId);
        setCourses(data.matriculas || []);
        setTasks(data.tareas || []);
        setSyllabus(data.silabos || []);
        setAnuncios(data.anuncios || []);

        Controller.registrarActividad(userId, null, 'LOGIN');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Error de red");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router]);

  const handleViewTask = (tarea: Tarea) => {
    const user = Controller.getCurrentUser();
    if (user) {
      Controller.registrarActividad(user.id, tarea.curso.id, 'TAREA_VISTA');
    }
  };

  const handleLogout = () => {
    try {
      Controller.logout();
      router.push("/");
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  const getUrgencyBadge = (fechaEntregaStr: string) => {
    const ahora = new Date();
    const entrega = new Date(fechaEntregaStr);
    const diffMs = entrega.getTime() - ahora.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours < 0) {
      return {
        text: "Vencido",
        className: "bg-red-50 text-red-700 border border-red-200"
      };
    } else if (diffHours < 24) {
      return {
        text: "Urgente (< 24h)",
        className: "bg-red-100 text-red-800 border border-red-300 animate-pulse font-bold"
      };
    } else if (diffHours < 72) {
      return {
        text: "Próxima (< 72h)",
        className: "bg-amber-50 text-amber-800 border border-amber-300"
      };
    } else {
      return {
        text: "Vigente (> 3 días)",
        className: "bg-emerald-50 text-emerald-800 border border-emerald-300"
      };
    }
  };

  const formatFecha = (fechaStr: string) => {
    return new Date(fechaStr).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };



  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 min-h-screen">
        <div className="flex flex-col items-center gap-4 bg-white rounded-2xl p-10 shadow-sm border border-slate-200">
          <Loader2 className="h-10 w-10 text-[#0F2C59] animate-spin" />
          <p className="text-slate-600 text-sm font-semibold">Cargando portal del estudiante...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-screen text-slate-800">
      
      {/* Cabecera Principal */}
      <header className="bg-[#0F2C59] text-white sticky top-0 z-10 border-b-4 border-[#A30000] shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 p-2 rounded-xl text-amber-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-wide uppercase leading-tight flex items-center gap-2">
              Cognitor
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-normal normal-case">
                Portal Alumno
              </span>
            </span>
            <p className="text-[10px] text-slate-400">Plataforma Educativa Inteligente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-slate-200 font-bold">{userName}</p>
            <p className="text-[9px] text-amber-400 font-semibold uppercase">Matrícula Regular</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 bg-white/10 hover:bg-red-700/25 border border-white/20 hover:border-red-500/40 text-slate-300 hover:text-red-300 rounded-xl transition-all cursor-pointer"
            title="Cerrar Sesión"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Columna Izquierda / Central (Cursos y Tareas) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Tarjeta de Bienvenida */}
          <div className="bg-[#0F2C59] rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute right-16 -top-8 w-24 h-24 bg-white/5 rounded-full" />
            <h2 className="text-xl md:text-2xl font-extrabold text-white">Bienvenido, {userName.split(" ")[0]}</h2>
            <p className="text-slate-300 mt-1.5 text-xs max-w-md">
              Tienes <span className="text-amber-300 font-bold">{tasks.length} actividades programadas</span> pendientes para esta semana.
            </p>
            <div className="flex items-center gap-2 mt-4 bg-white/10 border border-white/10 w-fit px-3 py-1.5 rounded-full text-xs text-emerald-300 font-bold">
              <CheckCircle className="h-4 w-4" /> Matrícula Habilitada
            </div>
          </div>

          {/* Tareas Pendientes */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <AlertTriangle className="h-5 w-5 text-[#0F2C59]" /> Actividades Académicas Pendientes ({tasks.length})
            </h3>

            {tasks.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                <p className="text-slate-500 text-xs font-semibold">No registras trabajos ni actividades pendientes.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((tarea) => {
                  const badge = getUrgencyBadge(tarea.fechaEntrega);
                  return (
                    <div 
                      key={tarea.id} 
                      onClick={() => handleViewTask(tarea)}
                      className="bg-white border border-slate-200 rounded-2xl p-5 hover:border-slate-300 card-hover transition-all flex flex-col justify-between gap-4 shadow-sm cursor-pointer"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0F2C59] border border-blue-100">
                            {tarea.curso.nombre}
                          </span>
                          <span className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badge.className}`}>
                            {badge.text}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-800">{tarea.titulo}</h4>
                        <p className="text-xs text-slate-500 line-clamp-2">{tarea.descripcion}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 font-medium">
                        <span className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px]">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          Límite: {formatFecha(tarea.fechaEntrega)}
                        </span>
                        <ChevronRight className="h-4 w-4 text-slate-300" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Cursos Matriculados */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <BookOpen className="h-5 w-5 text-[#0F2C59]" /> Asignaturas Matriculadas Activas
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {courses.map((curso) => (
                <div 
                  key={curso.id} 
                  className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 card-hover shadow-sm"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-850">{curso.nombre}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{curso.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 text-[11px]">
                    <div className="bg-blue-50 text-[#0F2C59] p-1.5 rounded-lg border border-blue-100">
                      <GraduationCap className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-slate-400 font-bold leading-none text-[9px] uppercase">Cátedra</p>
                      <p className="text-slate-600 font-semibold mt-0.5">{curso.docente.nombre}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </div>

        {/* Columna Derecha (Horario y Sílabo) */}
        <div className="space-y-6">
          
          {/* Horario de Clases */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Calendar className="h-5 w-5 text-[#0F2C59]" /> Programación Horaria Diaria
            </h3>
            
            <div className="space-y-3">
              {syllabus.length === 0 ? (
                <p className="text-xs text-slate-500 py-2">Sin programación en el sílabo actual.</p>
              ) : (
                syllabus.map((item) => (
                  <div 
                    key={item.id}
                    className="bg-slate-50 border border-slate-200 border-l-4 border-l-[#0F2C59] p-3 rounded-lg flex justify-between items-center"
                  >
                    <div>
                      <p className="text-xs text-slate-700 font-bold">{item.curso.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">Semana {item.semana}: {item.tema}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* Sílabo Actual (Timeline) */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Award className="h-5 w-5 text-[#0F2C59]" /> Avance de Sílabo Semanal
            </h3>

            {syllabus.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No hay contenidos registrados para esta semana.</p>
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-5">
                {syllabus.map((tema, index) => (
                  <div key={tema.id} className="relative">
                    {/* Indicador de Timeline */}
                    <div className="absolute -left-[22px] top-1.5 w-2 h-2 rounded-full bg-[#0F2C59] border border-white shadow shadow-blue-500/20"></div>
                    
                    <div className="space-y-1">
                      <p className="text-[9px] text-[#0F2C59] font-bold uppercase tracking-wide">
                        {tema.curso.nombre}
                      </p>
                      <h4 className="text-xs font-semibold text-slate-700">
                        {tema.tema}
                      </h4>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Anuncios Recientes */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <Bell className="h-5 w-5 text-[#0F2C59]" /> Anuncios Recientes
            </h3>
            {anuncios.length === 0 ? (
              <p className="text-xs text-slate-500 text-center py-4">No tienes anuncios recientes.</p>
            ) : (
              <div className="space-y-3">
                {anuncios.map((anuncio) => (
                  <div key={anuncio.id} className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[10px] font-bold text-[#0F2C59] uppercase tracking-wide">{anuncio.curso.nombre}</p>
                      <p className="text-[9px] text-slate-500">{formatFecha(anuncio.fechaPublicacion)}</p>
                    </div>
                    <p className="text-xs text-slate-700 font-medium mt-1.5">{anuncio.mensaje}</p>
                    <p className="text-[9px] text-slate-400 mt-2 text-right">Por: {anuncio.docente}</p>
                  </div>
                ))}
              </div>
            )}
          </section>

        </div>

      </main>

      {/* Módulo 7 — Próximamente (FAB placeholder) */}
      <div
        className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2"
        title="Módulo 7 — Próximamente"
      >
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          <Lock className="h-3 w-3" /> Próximamente
        </div>
        <button
          disabled
          className="bg-slate-300 text-slate-500 p-4 rounded-full shadow-lg flex items-center justify-center cursor-not-allowed opacity-60"
          title="Módulo 7 — Próximamente"
        >
          <Rocket className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
