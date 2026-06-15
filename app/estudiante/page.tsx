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
  User, 
  Award,
  ChevronRight,
  Loader2,
  Bell
} from "lucide-react";

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

export default function EstudianteDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Curso[]>([]);
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [syllabus, setSyllabus] = useState<Silabo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        const res = await fetch("/api/estudiante/dashboard");
        if (res.status === 401) {
          router.push("/");
          return;
        }
        
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al cargar dashboard");

        setCourses(data.matriculas || []);
        setTasks(data.tareas || []);
        setSyllabus(data.silabos || []);

        setUserName("Pedro Alcántara"); // En producción se obtiene del JWT
      } catch (err: any) {
        setError(err.message || "Error de red");
      } finally {
        setLoading(false);
      }
    }

    fetchDashboardData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
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

  // Horario estático de prueba para la sección de accesos rápidos
  const horarioHoy = [
    { hora: "08:00 - 09:30", curso: "Álgebra y Geometría", aula: "Aula 101-A", color: "border-l-[#0F2C59]" },
    { hora: "09:45 - 11:15", curso: "Ciencia y Tecnología", aula: "Laboratorio B", color: "border-l-emerald-600" },
    { hora: "11:30 - 13:00", curso: "Educación Física", aula: "Gimnasio", color: "border-l-[#A30000]" },
  ];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <Loader2 className="h-10 w-10 text-[#0F2C59] animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-semibold">Cargando portal del estudiante...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen text-slate-800">
      
      {/* Cabecera Principal - Estilo San Marcos */}
      <header className="bg-[#0F2C59] text-white sticky top-0 z-10 border-b-4 border-[#A30000] shadow-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-lg text-amber-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-wide uppercase flex items-center gap-2">
              UNMSM - SUM
              <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-normal normal-case">
                Portal Alumno
              </span>
            </span>
            <p className="text-[10px] text-slate-300">Universidad Nacional Mayor de San Marcos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-slate-200 font-bold">{userName}</p>
            <p className="text-[9px] text-amber-400 font-semibold uppercase">Matrícula Regular</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 bg-white/10 hover:bg-red-700/25 border border-white/20 hover:border-red-500/40 text-slate-300 hover:text-red-300 rounded-lg transition-all cursor-pointer"
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
          <div className="bg-white border border-slate-200 rounded-xl p-6 relative overflow-hidden shadow-sm">
            <div className="absolute right-0 bottom-0 translate-x-10 translate-y-10 w-48 h-48 bg-blue-50 blur-3xl rounded-full"></div>
            <h2 className="text-xl md:text-2xl font-extrabold text-slate-800">Bienvenido de nuevo, {userName.split(" ")[0]}</h2>
            <p className="text-slate-500 mt-1.5 text-xs max-w-md">
              Actualmente cuentas con <span className="text-[#0F2C59] font-bold">{tasks.length} actividades programadas</span> pendientes para esta semana académica.
            </p>
            <div className="flex items-center gap-2 mt-4 bg-emerald-50 border border-emerald-100 w-fit px-3 py-1.5 rounded-lg text-xs text-emerald-700 font-bold">
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
                      className="bg-white border border-slate-200 rounded-xl p-5 hover:border-slate-300 hover:shadow-sm transition-all flex flex-col justify-between gap-4 shadow-sm"
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
                  className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between gap-4 hover:shadow-sm transition-all shadow-sm"
                >
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-slate-850">{curso.nombre}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{curso.descripcion}</p>
                  </div>
                  <div className="flex items-center gap-2.5 pt-3 border-t border-slate-100 text-[11px]">
                    <div className="bg-blue-50 text-[#0F2C59] p-1.5 rounded-lg border border-blue-100">
                      <User className="h-3.5 w-3.5" />
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
              {horarioHoy.map((item, index) => (
                <div 
                  key={index}
                  className={`bg-slate-50 border border-slate-200 border-l-4 ${item.color} p-3 rounded-lg flex justify-between items-center`}
                >
                  <div>
                    <p className="text-xs text-slate-700 font-bold">{item.curso}</p>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.aula}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center gap-1 text-[9px] text-[#0F2C59] font-bold bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-md">
                      <Clock className="h-3 w-3" /> {item.hora}
                    </span>
                  </div>
                </div>
              ))}
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

          {/* Notificaciones Recientes */}
          <div className="bg-white border border-slate-200 p-5 rounded-xl flex items-center gap-3.5 shadow-sm">
            <div className="bg-blue-50 text-[#0F2C59] border border-blue-100 p-2.5 rounded-xl">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">Alertas de Envío WhatsApp</h4>
              <p className="text-[10px] text-slate-500 mt-0.5">Recibirás alertas automatizadas de vencimiento a tu número registrado.</p>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
}
