"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  LogOut,
  Loader2,
  Users,
  AlertTriangle,
  BookOpen,
  Bell,
  Link2,
  Unlink,
  Clock,
  CheckCircle,
  XCircle,
  Megaphone,
  Award,
  ChevronRight,
  HeartHandshake,
  Sparkles,
} from "lucide-react";
import { Controller } from "@/lib/mvc/controller";
import { predecirNota, PrediccionResponse } from "@/lib/ia/prediccion";

interface Hijo {
  vinculacionId: string;
  id: string;
  nombre: string;
  email: string;
  aula: { grado: string; seccion: string };
  fechaVinculacion: string;
}

interface Resumen {
  totalHijos: number;
  tareasPendientes: number;
  tareasUrgentes: number;
  tareasEntregadas: number;
  notificacionesExito: number;
  notificacionesFallo: number;
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  estado: string;
  curso: { id: string; nombre: string };
  estudiante: { id: string; nombre: string };
}

interface Curso {
  id: string;
  nombre: string;
  descripcion: string;
  estudiante: { id: string; nombre: string };
  docente: { nombre: string; email: string };
}

interface Anuncio {
  id: string;
  mensaje: string;
  fechaPublicacion: string;
  curso: { id: string; nombre: string };
  docente: string;
  estudiantes: string[];
}

interface LogNotif {
  id: string;
  estudiante: { id: string; nombre: string };
  tarea?: { id: string; titulo: string };
  fechaEnvio: string;
  estado: string;
}

interface Silabo {
  id: string;
  semana: number;
  tema: string;
  curso: { id: string; nombre: string };
  estudiante: { id: string; nombre: string };
}

export default function PadreDashboard() {
  const router = useRouter();
  const [padreId, setPadreId] = useState("");
  const [userName, setUserName] = useState("Padre de Familia");
  const [loading, setLoading] = useState(true);
  const [hijos, setHijos] = useState<Hijo[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cursos, setCursos] = useState<Curso[]>([]);
  const [anuncios, setAnuncios] = useState<Anuncio[]>([]);
  const [logs, setLogs] = useState<LogNotif[]>([]);
  const [silabos, setSilabos] = useState<Silabo[]>([]);
  const [hijoSeleccionado, setHijoSeleccionado] = useState<string>("todos");

  const [codigoVinculo, setCodigoVinculo] = useState("");
  const [vinculoLoading, setVinculoLoading] = useState(false);
  const [vinculoMsg, setVinculoMsg] = useState("");
  const [vinculoError, setVinculoError] = useState("");

  const [isPremium, setIsPremium] = useState(false);
  const [iaData, setIaData] = useState<Record<string, PrediccionResponse | "loading" | null>>({});

  const handleActivarPremium = () => {
    Controller.activarPremiumPadre(padreId);
    setIsPremium(true);
  };

  const handlePredict = async (alumnoId: string, cursoId: string) => {
    const key = `${alumnoId}-${cursoId}`;
    setIaData(prev => ({ ...prev, [key]: "loading" }));
    const result = await predecirNota(alumnoId, cursoId);
    setIaData(prev => ({ ...prev, [key]: result }));
  };

  const fetchDashboard = useCallback(
    (id: string, filtro?: string) => {
      const data = Controller.getPadreDashboardData(
        id,
        filtro && filtro !== "todos" ? filtro : undefined
      );
      setHijos(data.hijos);
      setResumen(data.resumen);
      setTareas(data.tareas);
      setCursos(data.cursos);
      setAnuncios(data.anuncios);
      setLogs(data.logs);
      setSilabos(data.silabos);
    },
    []
  );

  useEffect(() => {
    const currentUser = Controller.getCurrentUser();
    if (!currentUser || currentUser.rol !== "PADRE") {
      router.push("/");
      return;
    }
    setPadreId(currentUser.id);
    setUserName(currentUser.nombre);
    setIsPremium(currentUser.esPremium || false);
    fetchDashboard(currentUser.id);
    setLoading(false);
  }, [router, fetchDashboard]);

  useEffect(() => {
    if (padreId) {
      fetchDashboard(padreId, hijoSeleccionado);
    }
  }, [padreId, hijoSeleccionado, fetchDashboard]);

  const handleLogout = () => {
    Controller.logout();
    router.push("/");
  };

  const handleVincular = async (e: React.FormEvent) => {
    e.preventDefault();
    setVinculoLoading(true);
    setVinculoMsg("");
    setVinculoError("");
    try {
      const hijo = Controller.vincularEstudiante(padreId, codigoVinculo);
      setVinculoMsg(`¡${hijo.nombre} vinculado correctamente!`);
      setCodigoVinculo("");
      fetchDashboard(padreId, hijoSeleccionado);
    } catch (err: unknown) {
      setVinculoError(err instanceof Error ? err.message : "Error al vincular");
    } finally {
      setVinculoLoading(false);
    }
  };

  const handleDesvincular = (estudianteId: string, nombre: string) => {
    if (!confirm(`¿Desvincular a ${nombre} de tu cuenta?`)) return;
    try {
      Controller.desvincularEstudiante(padreId, estudianteId);
      if (hijoSeleccionado === estudianteId) setHijoSeleccionado("todos");
      fetchDashboard(padreId, hijoSeleccionado === estudianteId ? "todos" : hijoSeleccionado);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Error al desvincular");
    }
  };

  const getUrgencyBadge = (fechaEntregaStr: string) => {
    const ahora = new Date();
    const entrega = new Date(fechaEntregaStr);
    const diffHours = (entrega.getTime() - ahora.getTime()) / (1000 * 60 * 60);

    if (diffHours < 0) {
      return { text: "Vencido", className: "bg-red-50 text-red-700 border-red-200" };
    }
    if (diffHours < 24) {
      return {
        text: "Urgente (< 24h)",
        className: "bg-red-100 text-red-800 border-red-300 animate-pulse font-bold",
      };
    }
    if (diffHours < 72) {
      return { text: "Próxima (< 72h)", className: "bg-amber-50 text-amber-800 border-amber-300" };
    }
    return { text: "Vigente (> 3 días)", className: "bg-emerald-50 text-emerald-800 border-emerald-300" };
  };

  const formatFecha = (fechaStr: string) =>
    new Date(fechaStr).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 min-h-screen">
        <div className="flex flex-col items-center gap-4 bg-white rounded-2xl p-10 shadow-sm border border-slate-200">
          <Loader2 className="h-10 w-10 text-[#0F2C59] animate-spin" />
          <p className="text-slate-600 text-sm font-semibold">Cargando portal de padres...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-screen text-slate-800">
      <header className="bg-[#0F2C59] text-white sticky top-0 z-10 border-b-4 border-[#A30000] shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 p-2 rounded-xl text-amber-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-wide uppercase leading-tight flex items-center gap-2">
              Cognitor
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-200 border border-violet-500/30 tracking-normal normal-case">
                Portal Padres
              </span>
            </span>
            <p className="text-[10px] text-slate-400">
              {hijoSeleccionado !== "todos" && hijos.find(h => h.id === hijoSeleccionado)
                ? `Viendo perfil de: ${hijos.find(h => h.id === hijoSeleccionado)?.nombre}`
                : "Seguimiento académico de tus hijos"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-slate-200 font-bold">{userName}</p>
            <p className="text-[9px] text-violet-300 font-semibold uppercase">Apoderado</p>
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

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">

        {/* KPIs */}
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm card-hover flex items-center gap-4">
              <div className="p-2.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-xl shrink-0">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Hijos</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{resumen.totalHijos}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm card-hover flex items-center gap-4">
              <div className="p-2.5 bg-blue-50 text-[#0F2C59] border border-blue-100 rounded-xl shrink-0">
                <BookOpen className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Pendientes</p>
                <p className="text-2xl font-extrabold text-slate-900 mt-0.5">{resumen.tareasPendientes}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm card-hover flex items-center gap-4">
              <div className="p-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl shrink-0">
                <AlertTriangle className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">Urgentes</p>
                <p className="text-2xl font-extrabold text-red-600 mt-0.5">{resumen.tareasUrgentes}</p>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm card-hover flex items-center gap-4">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl shrink-0">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase leading-none">WhatsApp</p>
                <p className="text-2xl font-extrabold text-emerald-700 mt-0.5">{resumen.notificacionesExito}</p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel lateral */}
          <div className="space-y-5">

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Link2 className="h-5 w-5 text-violet-600" /> Vincular hijo/a
              </h3>
              <p className="text-[11px] text-slate-500">
                Ingresa el código de vinculación que te entregó el colegio para asociar a tu hijo/a.
              </p>

              {vinculoMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 shrink-0" /> {vinculoMsg}
                </div>
              )}
              {vinculoError && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-700 rounded-lg text-xs font-medium">
                  {vinculoError}
                </div>
              )}

              <form onSubmit={handleVincular} className="space-y-3">
                <input
                  type="text"
                  required
                  value={codigoVinculo}
                  onChange={(e) => setCodigoVinculo(e.target.value.toUpperCase())}
                  placeholder="Ej. VINC-LUCIA-5A"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 rounded-lg py-2.5 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none uppercase tracking-wider"
                />
                <button
                  type="submit"
                  disabled={vinculoLoading}
                  className="w-full bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-lg py-2.5 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {vinculoLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <HeartHandshake className="h-4 w-4" /> Vincular estudiante
                    </>
                  )}
                </button>
              </form>
            </section>

            {/* Hijos vinculados */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Users className="h-5 w-5 text-[#0F2C59]" /> Mis hijos ({hijos.length})
              </h3>

              {hijos.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-4">
                  Aún no tienes hijos vinculados. Usa un código de vinculación arriba.
                </p>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => setHijoSeleccionado("todos")}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      hijoSeleccionado === "todos"
                        ? "bg-[#0F2C59] border-[#0F2C59] text-white"
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Ver todos los hijos
                  </button>
                  {hijos.map((hijo) => (
                    <div
                      key={hijo.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                        hijoSeleccionado === hijo.id
                          ? "bg-violet-50 border-violet-300"
                          : "bg-slate-50 border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      <button
                        onClick={() => setHijoSeleccionado(hijo.id)}
                        className="flex-1 text-left cursor-pointer"
                      >
                        <p className="text-xs font-bold text-slate-800">{hijo.nombre}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">
                          {hijo.aula.grado} — Sección {hijo.aula.seccion}
                        </p>
                      </button>
                      <button
                        onClick={() => handleDesvincular(hijo.id, hijo.nombre)}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                        title="Desvincular"
                      >
                        <Unlink className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Logs WhatsApp */}
            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Bell className="h-5 w-5 text-[#0F2C59]" /> Alertas WhatsApp
              </h3>
              {logs.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">Sin notificaciones registradas.</p>
              ) : (
                logs.slice(0, 5).map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0"
                  >
                    {log.estado === "EXITO" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <p className="text-[11px] font-semibold text-slate-700">{log.estudiante.nombre}</p>
                      <p className="text-[10px] text-slate-500">
                        {log.tarea ? log.tarea.titulo : "Anuncio general"} — {formatFecha(log.fechaEnvio)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </section>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tareas */}
            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <AlertTriangle className="h-5 w-5 text-[#0F2C59]" /> Actividades de tus hijos ({tareas.length})
              </h3>

              {tareas.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center shadow-sm">
                  <p className="text-slate-500 text-xs font-semibold">
                    {hijos.length === 0
                      ? "Vincula un hijo para ver sus actividades."
                      : "No hay actividades registradas para el filtro seleccionado."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tareas.map((tarea) => {
                    const badge = getUrgencyBadge(tarea.fechaEntrega);
                    return (
                      <div
                        key={`${tarea.id}-${tarea.estudiante.id}`}
                        className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-sm card-hover"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2 flex-wrap">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-100">
                              {tarea.estudiante.nombre.split(" ")[0]}
                            </span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0F2C59] border border-blue-100">
                              {tarea.curso.nombre}
                            </span>
                            <span
                              className={`text-[9px] uppercase font-bold tracking-wider px-2 py-0.5 rounded border ${badge.className}`}
                            >
                              {badge.text}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-800">{tarea.titulo}</h4>
                          <p className="text-xs text-slate-500 line-clamp-2">{tarea.descripcion}</p>
                        </div>
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1.5 text-slate-500 font-semibold text-[10px]">
                            <Clock className="h-3.5 w-3.5" />
                            Límite: {formatFecha(tarea.fechaEntrega)}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                              tarea.estado === "ENTREGADA"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-amber-50 text-amber-700"
                            }`}
                          >
                            {tarea.estado}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Anuncios */}
            <section className="space-y-3">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                <Megaphone className="h-5 w-5 text-[#0F2C59]" /> Avisos de docentes
              </h3>
              {anuncios.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-6 text-center shadow-sm">
                  <p className="text-xs text-slate-500">No hay avisos recientes.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {anuncios.map((anuncio) => (
                    <div
                      key={anuncio.id}
                      className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-50 text-[#0F2C59] border border-blue-100">
                          {anuncio.curso.nombre}
                        </span>
                        <span className="text-[10px] text-slate-400">{formatFecha(anuncio.fechaPublicacion)}</span>
                      </div>
                      <p className="text-xs text-slate-700 mt-2 font-medium">{anuncio.mensaje}</p>
                      <p className="text-[10px] text-slate-400 mt-2">Por: {anuncio.docente}</p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Cursos y sílabo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-3">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <BookOpen className="h-5 w-5 text-[#0F2C59]" /> Asignaturas
                </h3>
                <div className="space-y-3">
                  {cursos.map((curso) => (
                    <div
                      key={`${curso.id}-${curso.estudiante.id}`}
                      className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm card-hover"
                    >
                      <p className="text-[10px] font-bold text-violet-600 uppercase">
                        {curso.estudiante.nombre.split(" ")[0]}
                      </p>
                      <h4 className="text-xs font-bold text-slate-800 mt-1">{curso.nombre}</h4>
                      <p className="text-[10px] text-slate-500 mt-1">Docente: {curso.docente.nombre}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
                  <Award className="h-5 w-5 text-[#0F2C59]" /> Avance de sílabo
                </h3>
                {silabos.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-4">Sin temas registrados.</p>
                ) : (
                  <div className="relative border-l-2 border-slate-100 pl-4 ml-2 space-y-4">
                    {silabos.slice(0, 6).map((tema) => (
                      <div key={`${tema.id}-${tema.estudiante.id}`} className="relative">
                        <div className="absolute -left-[22px] top-1.5 w-2 h-2 rounded-full bg-violet-600 border border-white" />
                        <p className="text-[9px] text-violet-600 font-bold uppercase">
                          {tema.estudiante.nombre.split(" ")[0]} — {tema.curso.nombre}
                        </p>
                        <h4 className="text-xs font-semibold text-slate-700">Sem. {tema.semana}: {tema.tema}</h4>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>

            {/* Módulo 7 — Alerta IA */}
            <section className="bg-gradient-to-br from-[#0F2C59] to-slate-800 border border-[#0F2C59] rounded-xl p-6 shadow-md space-y-4 relative overflow-hidden">
              <div className="absolute -right-10 -bottom-10 w-36 h-36 bg-white/5 rounded-full" />
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2 pb-2 border-b border-white/10 relative z-10">
                <Sparkles className="h-5 w-5 text-amber-400" /> Alerta IA: Predicción de Desempeño
              </h3>
              
              {!isPremium ? (
                <div className="relative z-10 flex flex-col items-center justify-center py-8 text-center space-y-4">
                  <div className="bg-amber-400/20 p-4 rounded-full">
                    <Award className="h-8 w-8 text-amber-400" />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Disponible en el Plan Premium</h4>
                    <p className="text-sm text-slate-300 max-w-sm mx-auto mt-2">
                      Desbloquea predicciones de desempeño impulsadas por IA y alertas tempranas de riesgo académico por solo S/15 al mes.
                    </p>
                  </div>
                  <button
                    onClick={handleActivarPremium}
                    className="mt-4 px-6 py-2.5 bg-amber-400 hover:bg-amber-500 text-[#0F2C59] font-bold rounded-xl transition-all shadow-lg shadow-amber-500/20"
                  >
                    Activar Premium (S/15/mes)
                  </button>
                </div>
              ) : cursos.length === 0 ? (
                <p className="text-xs text-slate-300 py-4 relative z-10">No hay asignaturas disponibles para análisis.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                  {cursos.map((curso) => {
                    const key = `${curso.estudiante.id}-${curso.id}`;
                    const prediccion = iaData[key];

                    return (
                      <div key={key} className="bg-white/10 border border-white/20 rounded-xl p-4 flex flex-col justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-bold text-amber-300 uppercase">{curso.estudiante.nombre.split(" ")[0]}</p>
                          <h4 className="text-xs font-bold text-white mt-0.5">{curso.nombre}</h4>
                        </div>
                        
                        {!prediccion ? (
                          <button
                            onClick={() => handlePredict(curso.estudiante.id, curso.id)}
                            className="mt-2 text-[10px] font-bold bg-white text-[#0F2C59] hover:bg-slate-100 px-3 py-1.5 rounded-lg transition-all w-full flex items-center justify-center gap-1.5"
                          >
                            <Sparkles className="h-3 w-3" /> Generar Análisis IA
                          </button>
                        ) : prediccion === "loading" ? (
                          <div className="flex items-center justify-center gap-2 text-xs text-amber-200 py-1.5">
                            <Loader2 className="h-4 w-4 animate-spin" /> Analizando actividad...
                          </div>
                        ) : (
                          <div className="bg-white rounded-lg p-3 space-y-2 text-slate-800">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase text-slate-500">Nota Estimada</span>
                              <span className="text-sm font-extrabold text-[#0F2C59]">{prediccion.nota_estimada} / 20</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold uppercase text-slate-500">Nivel de Riesgo</span>
                              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                                prediccion.nivel_riesgo === 'ALTO' ? 'bg-red-100 text-red-700' :
                                prediccion.nivel_riesgo === 'MEDIO' ? 'bg-amber-100 text-amber-700' :
                                'bg-emerald-100 text-emerald-700'
                              }`}>
                                {prediccion.nivel_riesgo}
                              </span>
                            </div>
                            <p className="text-[10px] text-slate-600 font-medium leading-tight pt-1 border-t border-slate-100">
                              {prediccion.mensaje}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </div>

      </main>

    </div>
  );
}
