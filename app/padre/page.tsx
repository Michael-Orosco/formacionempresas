"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  LogOut,
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
  HeartHandshake,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Controller } from "@/lib/mvc/controller";
import { predecirNota, PrediccionResponse } from "@/lib/ia/prediccion";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, riesgoBadgeVariant } from "@/components/ui/Badge";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiSkeletonGrid, TableSkeleton } from "@/components/ui/Skeleton";
import { TaskUrgencyBadge } from "@/components/ui/TaskUrgencyBadge";
import { Avatar } from "@/components/ui/Avatar";

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
  const { toast } = useToast();
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

  const [desvincularTarget, setDesvincularTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [desvincularLoading, setDesvincularLoading] = useState(false);

  const handleActivarPremium = () => {
    // SIMULADO
    Controller.activarPremiumPadre(padreId);
    setIsPremium(true);
    toast.success("Plan Premium activado correctamente");
  };

  const handlePredict = async (alumnoId: string, cursoId: string) => {
    const key = `${alumnoId}-${cursoId}`;
    setIaData((prev) => ({ ...prev, [key]: "loading" }));
    try {
      const result = await predecirNota(alumnoId, cursoId);
      setIaData((prev) => ({ ...prev, [key]: result }));
    } catch (err) {
      logger.error("Error al generar predicción IA", err);
      toast.error("No se pudo generar el análisis IA");
      setIaData((prev) => ({ ...prev, [key]: null }));
    }
  };

  const fetchDashboard = useCallback((id: string, filtro?: string) => {
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
  }, []);

  useEffect(() => {
    const currentUser = Controller.getCurrentUser();
    if (!currentUser || currentUser.rol !== "PADRE") {
      logger.log("[Padre View] Usuario no autorizado. Redirigiendo a Login.");
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
      const message = err instanceof Error ? err.message : "Error al vincular";
      setVinculoError(message);
      logger.error("Error al vincular estudiante", err);
    } finally {
      setVinculoLoading(false);
    }
  };

  const handleConfirmDesvincular = () => {
    if (!desvincularTarget) return;
    setDesvincularLoading(true);
    try {
      Controller.desvincularEstudiante(padreId, desvincularTarget.id);
      if (hijoSeleccionado === desvincularTarget.id) setHijoSeleccionado("todos");
      fetchDashboard(
        padreId,
        hijoSeleccionado === desvincularTarget.id ? "todos" : hijoSeleccionado
      );
      setDesvincularTarget(null);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al desvincular");
      logger.error("Error al desvincular estudiante", err);
    } finally {
      setDesvincularLoading(false);
    }
  };

  const formatFecha = (fechaStr: string) =>
    new Date(fechaStr).toLocaleDateString("es-PE", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const hijoActivo = hijos.find((h) => h.id === hijoSeleccionado);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
          <KpiSkeletonGrid count={4} />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <TableSkeleton rows={4} />
            <div className="lg:col-span-2">
              <TableSkeleton rows={6} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen text-text-primary">
      <header className="bg-brand-navy text-white sticky top-0 z-10 border-b-4 border-brand-red shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 p-2 rounded-xl text-brand-amber">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-wide uppercase leading-tight flex items-center gap-2">
              Cognitor
              <Badge variant="neutral" className="normal-case tracking-normal text-[10px] bg-violet-500/20 text-violet-200 border-violet-500/30">
                Portal Padres
              </Badge>
            </span>
            <p className="text-[10px] text-slate-300">
              {hijoActivo
                ? `Viendo perfil de: ${hijoActivo.nombre}`
                : "Seguimiento académico de tus hijos"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <Avatar nombre={userName} rol="PADRE" size="sm" />
            <div className="text-right">
              <p className="text-xs text-slate-200 font-bold">{userName}</p>
              <p className="text-[9px] text-violet-300 font-semibold uppercase">Apoderado</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="bg-white/10 hover:bg-danger/25 border border-white/20 hover:border-danger/40 text-slate-300 hover:text-red-300 rounded-xl p-2"
            title="Cerrar Sesión"
            icon={<LogOut className="h-4 w-4" />}
          />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {resumen && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Users, label: "Hijos", value: resumen.totalHijos, accent: "text-brand-navy" },
              { icon: BookOpen, label: "Pendientes", value: resumen.tareasPendientes, accent: "text-brand-navy" },
              { icon: AlertTriangle, label: "Urgentes", value: resumen.tareasUrgentes, accent: "text-danger" },
              { icon: Bell, label: "WhatsApp", value: resumen.notificacionesExito, accent: "text-success" },
            ].map((kpi) => (
              <Card key={kpi.label} padding="sm">
                <div className="flex items-center gap-4">
                  <div className="p-2.5 bg-brand-navy/5 text-brand-navy border border-border-subtle rounded-xl shrink-0">
                    <kpi.icon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-text-secondary uppercase leading-none">{kpi.label}</p>
                    <p className={`text-2xl font-extrabold mt-0.5 ${kpi.accent}`}>{kpi.value}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {hijos.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" role="tablist" aria-label="Seleccionar hijo">
            <button
              type="button"
              role="tab"
              aria-selected={hijoSeleccionado === "todos"}
              onClick={() => setHijoSeleccionado("todos")}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold shrink-0 transition-all cursor-pointer ${
                hijoSeleccionado === "todos"
                  ? "bg-brand-navy border-brand-navy text-white shadow-md"
                  : "bg-white border-border-subtle text-text-secondary hover:border-slate-300"
              }`}
            >
              <Users className="h-4 w-4 shrink-0" />
              Todos
            </button>
            {hijos.map((hijo) => (
              <button
                key={hijo.id}
                type="button"
                role="tab"
                aria-selected={hijoSeleccionado === hijo.id}
                onClick={() => setHijoSeleccionado(hijo.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-semibold shrink-0 transition-all cursor-pointer ${
                  hijoSeleccionado === hijo.id
                    ? "bg-brand-navy border-brand-navy text-white shadow-md"
                    : "bg-white border-border-subtle text-text-secondary hover:border-slate-300"
                }`}
              >
                <Avatar nombre={hijo.nombre} rol="ESTUDIANTE" size="sm" />
                <span className="truncate max-w-[120px]">{hijo.nombre.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-5">
            <Card>
              <CardHeader
                icon={<Link2 className="h-5 w-5" />}
                title="Vincular hijo/a"
              />
              <p className="text-[11px] text-text-secondary mb-4">
                Ingresa el código de vinculación que te entregó el colegio para asociar a tu hijo/a.
              </p>

              {vinculoMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-success rounded-lg text-xs font-medium flex items-center gap-2 mb-3">
                  <CheckCircle className="h-4 w-4 shrink-0" /> {vinculoMsg}
                </div>
              )}
              {vinculoError && (
                <div className="p-3 bg-red-50 border border-red-100 text-danger rounded-lg text-xs font-medium mb-3">
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
                  className="w-full bg-slate-50 border border-border-subtle focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 rounded-lg py-2.5 px-3 text-text-primary placeholder-text-secondary text-xs focus:outline-none uppercase tracking-wider"
                />
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  loading={vinculoLoading}
                  icon={<HeartHandshake className="h-4 w-4" />}
                >
                  Vincular estudiante
                </Button>
              </form>
            </Card>

            <Card>
              <CardHeader
                icon={<Users className="h-5 w-5" />}
                title={`Mis hijos (${hijos.length})`}
              />
              {hijos.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Sin hijos vinculados"
                  description="Usa un código de vinculación arriba para asociar a tu hijo/a."
                />
              ) : (
                <div className="space-y-2">
                  {hijos.map((hijo) => (
                    <div
                      key={hijo.id}
                      className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border transition-all ${
                        hijoSeleccionado === hijo.id
                          ? "bg-brand-navy/5 border-brand-navy/30"
                          : "bg-slate-50 border-border-subtle"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <Avatar nombre={hijo.nombre} rol="ESTUDIANTE" size="sm" />
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-text-primary truncate">{hijo.nombre}</p>
                          <p className="text-[10px] text-text-secondary mt-0.5">
                            {hijo.aula.grado} — Sección {hijo.aula.seccion}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDesvincularTarget({ id: hijo.id, nombre: hijo.nombre })}
                        className="p-1.5 text-text-secondary hover:text-danger hover:bg-red-50 rounded-lg"
                        title="Desvincular"
                        icon={<Unlink className="h-3.5 w-3.5" />}
                      />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card>
              <CardHeader
                icon={<Bell className="h-5 w-5" />}
                title="Alertas WhatsApp"
              />
              {logs.length === 0 ? (
                <EmptyState
                  icon={Bell}
                  title="Sin notificaciones"
                  description="No hay alertas registradas por el momento."
                />
              ) : (
                <div className="space-y-1">
                  {logs.slice(0, 5).map((log) => (
                    <div
                      key={log.id}
                      className="flex items-start gap-2.5 py-2 border-b border-slate-50 last:border-0"
                    >
                      {log.estado === "EXITO" ? (
                        <CheckCircle className="h-4 w-4 text-success shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="h-4 w-4 text-danger shrink-0 mt-0.5" />
                      )}
                      <div>
                        <p className="text-[11px] font-semibold text-text-primary">{log.estudiante.nombre}</p>
                        <p className="text-[10px] text-text-secondary">
                          {log.tarea ? log.tarea.titulo : "Anuncio general"} — {formatFecha(log.fechaEnvio)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div className="lg:col-span-2 space-y-6">
            <section className="space-y-3">
              <CardHeader
                icon={<AlertTriangle className="h-5 w-5" />}
                title={`Actividades de tus hijos (${tareas.length})`}
                className="mb-0 pb-2"
              />

              {tareas.length === 0 ? (
                <Card hover={false}>
                  <EmptyState
                    icon={BookOpen}
                    title={hijos.length === 0 ? "Vincula un hijo primero" : "Sin actividades"}
                    description={
                      hijos.length === 0
                        ? "Vincula un hijo para ver sus actividades."
                        : "No hay actividades registradas para el filtro seleccionado."
                    }
                  />
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tareas.map((tarea) => (
                    <Card key={`${tarea.id}-${tarea.estudiante.id}`} padding="sm">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2 flex-wrap">
                          <Badge variant="neutral">{tarea.estudiante.nombre.split(" ")[0]}</Badge>
                          <Badge variant="brand">{tarea.curso.nombre}</Badge>
                          <TaskUrgencyBadge fechaEntrega={tarea.fechaEntrega} />
                        </div>
                        <h4 className="text-xs font-bold text-text-primary">{tarea.titulo}</h4>
                        <p className="text-xs text-text-secondary line-clamp-2">{tarea.descripcion}</p>
                      </div>
                      <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5 text-text-secondary font-semibold text-[10px]">
                          <Clock className="h-3.5 w-3.5" />
                          Límite: {formatFecha(tarea.fechaEntrega)}
                        </span>
                        <Badge variant={tarea.estado === "ENTREGADA" ? "success" : "warning"}>
                          {tarea.estado}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-3">
              <CardHeader
                icon={<Megaphone className="h-5 w-5" />}
                title="Avisos de docentes"
                className="mb-0 pb-2"
              />
              {anuncios.length === 0 ? (
                <Card hover={false}>
                  <EmptyState
                    icon={Megaphone}
                    title="Sin avisos recientes"
                    description="Los docentes aún no han publicado avisos."
                  />
                </Card>
              ) : (
                <div className="space-y-3">
                  {anuncios.map((anuncio) => (
                    <Card key={anuncio.id} padding="sm">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="brand">{anuncio.curso.nombre}</Badge>
                        <span className="text-[10px] text-text-secondary">{formatFecha(anuncio.fechaPublicacion)}</span>
                      </div>
                      <p className="text-xs text-text-primary mt-2 font-medium">{anuncio.mensaje}</p>
                      <p className="text-[10px] text-text-secondary mt-2">Por: {anuncio.docente}</p>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <section className="space-y-3">
                <CardHeader
                  icon={<BookOpen className="h-5 w-5" />}
                  title="Asignaturas"
                  className="mb-0 pb-2"
                />
                {cursos.length === 0 ? (
                  <Card hover={false}>
                    <EmptyState
                      icon={BookOpen}
                      title="Sin asignaturas"
                      description="No hay cursos registrados para el filtro seleccionado."
                    />
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {cursos.map((curso) => (
                      <Card key={`${curso.id}-${curso.estudiante.id}`} padding="sm">
                        <p className="text-[10px] font-bold text-brand-navy uppercase">
                          {curso.estudiante.nombre.split(" ")[0]}
                        </p>
                        <h4 className="text-xs font-bold text-text-primary mt-1">{curso.nombre}</h4>
                        <p className="text-[10px] text-text-secondary mt-1">Docente: {curso.docente.nombre}</p>
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              <Card>
                <CardHeader
                  icon={<Award className="h-5 w-5" />}
                  title="Avance de sílabo"
                />
                {silabos.length === 0 ? (
                  <EmptyState
                    icon={Award}
                    title="Sin temas registrados"
                    description="El avance del sílabo aparecerá aquí."
                  />
                ) : (
                  <div className="relative border-l-2 border-border-subtle pl-4 ml-2 space-y-4">
                    {silabos.slice(0, 6).map((tema) => (
                      <div key={`${tema.id}-${tema.estudiante.id}`} className="relative">
                        <div className="absolute -left-[22px] top-1.5 w-2 h-2 rounded-full bg-brand-navy border border-white" />
                        <p className="text-[9px] text-brand-navy font-bold uppercase">
                          {tema.estudiante.nombre.split(" ")[0]} — {tema.curso.nombre}
                        </p>
                        <h4 className="text-xs font-semibold text-text-primary">
                          Sem. {tema.semana}: {tema.tema}
                        </h4>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            <Card className="border-brand-amber bg-brand-gradient relative overflow-hidden">
              <CardHeader
                icon={<Sparkles className="h-5 w-5 text-brand-amber" />}
                title="Alerta IA: Predicción de Desempeño"
                className="border-white/10 mb-0 pb-3 [&_h3]:text-white"
              />

              <div className="relative min-h-[200px]">
                {cursos.length === 0 ? (
                  <p className="text-xs text-slate-300 py-4">No hay asignaturas disponibles para análisis.</p>
                ) : (
                  <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${!isPremium ? "blur-sm pointer-events-none select-none" : ""}`}>
                    {cursos.map((curso) => {
                      const key = `${curso.estudiante.id}-${curso.id}`;
                      const prediccion = iaData[key];

                      return (
                        <div
                          key={key}
                          className="bg-white/10 border border-white/20 rounded-xl p-4 flex flex-col justify-between gap-3"
                        >
                          <div>
                            <p className="text-[10px] font-bold text-brand-amber uppercase">
                              {curso.estudiante.nombre.split(" ")[0]}
                            </p>
                            <h4 className="text-xs font-bold text-white mt-0.5">{curso.nombre}</h4>
                          </div>

                          {!prediccion ? (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handlePredict(curso.estudiante.id, curso.id)}
                              className="mt-2 w-full"
                              icon={<Sparkles className="h-3 w-3" />}
                            >
                              Generar Análisis IA
                            </Button>
                          ) : prediccion === "loading" ? (
                            <div className="flex items-center justify-center gap-2 text-xs text-brand-amber py-1.5">
                              <Loader2 className="h-4 w-4 animate-spin" /> Analizando actividad...
                            </div>
                          ) : (
                            <div className="bg-white rounded-lg p-3 space-y-2 text-text-primary">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-text-secondary">Nota Estimada</span>
                                <span className="text-sm font-extrabold text-brand-navy">
                                  {prediccion.nota_estimada} / 20
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase text-text-secondary">Nivel de Riesgo</span>
                                <Badge variant={riesgoBadgeVariant(prediccion.nivel_riesgo)}>
                                  {prediccion.nivel_riesgo}
                                </Badge>
                              </div>
                              <p className="text-[10px] text-text-secondary font-medium leading-tight pt-1 border-t border-slate-100">
                                {prediccion.mensaje}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {!isPremium && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6 z-10">
                    <div className="bg-brand-amber/20 p-4 rounded-full mb-4">
                      <Sparkles className="h-8 w-8 text-brand-amber" />
                    </div>
                    <h4 className="text-lg font-bold text-white">Disponible en el Plan Premium</h4>
                    <p className="text-sm text-slate-300 max-w-sm mx-auto mt-2">
                      Desbloquea predicciones de desempeño impulsadas por IA y alertas tempranas de riesgo académico.
                    </p>
                    <Button
                      onClick={handleActivarPremium}
                      className="mt-4 bg-brand-amber hover:bg-amber-500 text-brand-navy font-bold shadow-lg shadow-brand-amber/20"
                    >
                      Activar Plan Premium — S/15/mes
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </main>

      <ConfirmDialog
        open={!!desvincularTarget}
        onClose={() => setDesvincularTarget(null)}
        onConfirm={handleConfirmDesvincular}
        title="Desvincular estudiante"
        description={`¿Desvincular a ${desvincularTarget?.nombre} de tu cuenta? Perderás acceso a su información académica.`}
        confirmLabel="Desvincular"
        loading={desvincularLoading}
      />
    </div>
  );
}
