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
  Bell,
  Sparkles,
  ClipboardList,
  Megaphone,
} from "lucide-react";
import { Controller } from "@/lib/mvc/controller";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { TaskUrgencyBadge } from "@/components/ui/TaskUrgencyBadge";

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
  const [esSenior, setEsSenior] = useState(false);
  const [academias, setAcademias] = useState<{ id: string; nombre: string }[]>([]);

  const [selectedTask, setSelectedTask] = useState<Tarea | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userName, setUserName] = useState("Estudiante");

  useEffect(() => {
    const currentUser = Controller.getCurrentUser();
    if (!currentUser || currentUser.rol !== "ESTUDIANTE") {
      logger.log("[Estudiante View] Usuario no autorizado. Redirigiendo a Login.");
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
        setEsSenior(data.esSenior || false);
        setAcademias(data.academias || []);

        Controller.registrarActividad(userId, null, "LOGIN");
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
      Controller.registrarActividad(user.id, tarea.curso.id, "TAREA_VISTA");
    }
  };

  const handleLogout = () => {
    try {
      Controller.logout();
      router.push("/");
    } catch (err) {
      logger.error("Error al cerrar sesión", err);
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

  const alDia = tasks.length === 0;
  const firstName = userName.split(" ")[0];

  if (loading) {
    return (
      <div className="flex-1 flex flex-col bg-background min-h-screen">
        <header className="bg-brand-navy text-white sticky top-0 z-10 border-b-4 border-brand-red shadow-lg px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="bg-white/10 border border-white/20 p-2 rounded-xl text-brand-amber">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-lg font-extrabold tracking-wide uppercase">Cognitor</span>
          </div>
        </header>
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
          <div className="bg-brand-gradient rounded-2xl p-6 h-32 animate-pulse opacity-60" />
          <TableSkeleton rows={6} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen text-text-primary">
      {/* Cabecera Principal */}
      <header className="bg-brand-navy text-white sticky top-0 z-10 border-b-4 border-brand-red shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 p-2 rounded-xl text-brand-amber">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-wide uppercase leading-tight flex items-center gap-2">
              Cognitor
              <Badge variant="warning" className="text-[10px] tracking-normal normal-case border-brand-amber/30 bg-brand-amber/20 text-amber-200">
                Portal Alumno
              </Badge>
            </span>
            <p className="text-[10px] text-slate-400">Plataforma Educativa Inteligente</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-slate-200 font-bold">{userName}</p>
            <p className="text-[9px] text-brand-amber font-semibold uppercase">Matrícula Regular</p>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="p-2 bg-white/10 hover:bg-red-700/25 border border-white/20 hover:border-red-500/40 text-slate-300 hover:text-red-300 rounded-xl"
            title="Cerrar Sesión"
            icon={<LogOut className="h-4 w-4" />}
          />
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6 fade-in">
        {/* Columna Izquierda / Central (Cursos y Tareas) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tarjeta de Bienvenida Motivacional */}
          <div className="bg-brand-gradient rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/5 rounded-full" />
            <div className="absolute right-16 -top-8 w-24 h-24 bg-white/5 rounded-full" />
            <h2 className="text-xl md:text-2xl font-extrabold text-white">
              Bienvenido, {firstName}
            </h2>
            {alDia ? (
              <div className="mt-3 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-emerald-300" />
                <p className="text-emerald-200 font-bold text-sm">¡Vas al día!</p>
              </div>
            ) : (
              <p className="text-slate-300 mt-1.5 text-xs max-w-md">
                Tienes{" "}
                <span className="text-brand-amber font-bold">
                  {tasks.length} actividades programadas
                </span>{" "}
                pendientes para esta semana.
              </p>
            )}
            <div
              className={`flex items-center gap-2 mt-4 w-fit px-3 py-1.5 rounded-full text-xs font-bold border ${
                alDia
                  ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-200"
                  : "bg-brand-amber/20 border-brand-amber/30 text-amber-200"
              }`}
            >
              <CheckCircle className="h-4 w-4" />
              {alDia ? "Sin pendientes esta semana" : "Matrícula Habilitada"}
            </div>
          </div>

          {error && (
            <Card className="border-danger/30 bg-red-50">
              <p className="text-sm text-danger font-medium">{error}</p>
            </Card>
          )}

          {/* Tareas Pendientes */}
          <Card>
            <CardHeader
              icon={<AlertTriangle className="h-5 w-5" />}
              title={`Actividades Académicas Pendientes (${tasks.length})`}
            />

            {tasks.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="No registras trabajos ni actividades pendientes"
                description="¡Buen trabajo! Mantén el ritmo con tus clases."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tasks.map((tarea) => (
                  <div
                    key={tarea.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => handleViewTask(tarea)}
                    onKeyDown={(e) => e.key === "Enter" && handleViewTask(tarea)}
                    className="cursor-pointer"
                  >
                  <Card
                    padding="sm"
                    className="h-full flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Badge variant="neutral" className="bg-brand-navy/5 text-brand-navy border-brand-navy/10 normal-case tracking-normal">
                          {tarea.curso.nombre}
                        </Badge>
                        <TaskUrgencyBadge fechaEntrega={tarea.fechaEntrega} />
                      </div>
                      <h4 className="text-xs font-bold text-text-primary">{tarea.titulo}</h4>
                      <p className="text-xs text-text-secondary line-clamp-2">{tarea.descripcion}</p>
                    </div>

                    <div className="pt-3 border-t border-border-subtle flex items-center justify-between text-xs text-text-secondary font-medium">
                      <span className="flex items-center gap-1.5 font-semibold text-[10px]">
                        <Clock className="h-3.5 w-3.5" />
                        Límite: {formatFecha(tarea.fechaEntrega)}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-300" />
                    </div>
                  </Card>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Cursos Matriculados */}
          <Card>
            <CardHeader
              icon={<BookOpen className="h-5 w-5" />}
              title="Asignaturas Matriculadas Activas"
            />

            {courses.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No tienes asignaturas matriculadas"
                description="Contacta a tu coordinador académico para más información."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {courses.map((curso) => (
                  <Card key={curso.id} padding="sm" className="flex flex-col justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-text-primary">{curso.nombre}</h4>
                      <p className="text-xs text-text-secondary line-clamp-2">{curso.descripcion}</p>
                    </div>
                    <div className="flex items-center gap-2.5 pt-3 border-t border-border-subtle text-[11px]">
                      <div className="bg-brand-navy/5 text-brand-navy p-1.5 rounded-lg border border-brand-navy/10">
                        <GraduationCap className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <p className="text-text-secondary font-bold leading-none text-[9px] uppercase">Cátedra</p>
                        <p className="text-text-primary font-semibold mt-0.5">{curso.docente.nombre}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Columna Derecha (Horario y Sílabo) */}
        <div className="space-y-6">
          {/* Horario de Clases — Timeline vertical */}
          <Card>
            <CardHeader
              icon={<Calendar className="h-5 w-5" />}
              title="Programación Horaria Diaria"
            />

            {syllabus.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="Sin programación en el sílabo actual"
                description="Tu docente aún no ha publicado la programación semanal."
              />
            ) : (
              <div className="relative pl-6 space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-subtle" />
                {syllabus.map((item, index) => {
                  const isCurrent = index === 0;
                  return (
                    <div key={item.id} className="relative pb-5 last:pb-0">
                      <div
                        className={`absolute -left-6 top-1 w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center ${
                          isCurrent
                            ? "bg-brand-navy border-brand-amber shadow-md shadow-brand-navy/30"
                            : "bg-white border-border-subtle"
                        }`}
                      >
                        {isCurrent && (
                          <span className="w-2 h-2 rounded-full bg-brand-amber animate-pulse" />
                        )}
                      </div>
                      <div
                        className={`ml-2 p-3 rounded-xl border transition-all ${
                          isCurrent
                            ? "bg-brand-navy/5 border-brand-navy/20 shadow-sm"
                            : "bg-slate-50 border-border-subtle"
                        }`}
                      >
                        {isCurrent && (
                          <Badge variant="warning" className="mb-1.5 normal-case tracking-normal text-[9px]">
                            En curso
                          </Badge>
                        )}
                        <p className={`text-xs font-bold ${isCurrent ? "text-brand-navy" : "text-text-primary"}`}>
                          {item.curso.nombre}
                        </p>
                        <p className="text-[10px] text-text-secondary font-semibold mt-0.5">
                          Semana {item.semana}: {item.tema}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Sílabo Actual — Timeline vertical */}
          <Card>
            <CardHeader
              icon={<Award className="h-5 w-5" />}
              title="Avance de Sílabo Semanal"
            />

            {syllabus.length === 0 ? (
              <EmptyState
                icon={Award}
                title="No hay contenidos registrados"
                description="El avance del sílabo aparecerá aquí cuando esté disponible."
              />
            ) : (
              <div className="relative pl-6 space-y-0">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-border-subtle" />
                {syllabus.map((tema, index) => {
                  const isCurrent = index === 0;
                  return (
                    <div key={tema.id} className="relative pb-5 last:pb-0">
                      <div
                        className={`absolute -left-6 top-1.5 w-3 h-3 rounded-full border-2 ${
                          isCurrent
                            ? "bg-brand-amber border-brand-navy shadow shadow-brand-navy/20"
                            : "bg-brand-navy/30 border-white"
                        }`}
                      />
                      <div className={`ml-2 space-y-1 ${isCurrent ? "opacity-100" : "opacity-70"}`}>
                        <p
                          className={`text-[9px] font-bold uppercase tracking-wide ${
                            isCurrent ? "text-brand-amber" : "text-brand-navy/60"
                          }`}
                        >
                          {tema.curso.nombre}
                          {isCurrent && " · Actual"}
                        </p>
                        <h4
                          className={`text-xs font-semibold ${
                            isCurrent ? "text-brand-navy" : "text-text-secondary"
                          }`}
                        >
                          {tema.tema}
                        </h4>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Anuncios Recientes */}
          <Card>
            <CardHeader
              icon={<Bell className="h-5 w-5" />}
              title="Anuncios Recientes"
            />

            {anuncios.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                title="No tienes anuncios recientes"
                description="Los avisos de tus docentes aparecerán aquí."
              />
            ) : (
              <div className="space-y-3">
                {anuncios.map((anuncio) => (
                  <div
                    key={anuncio.id}
                    className="bg-brand-navy/5 border border-brand-navy/10 rounded-xl p-3"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <p className="text-[10px] font-bold text-brand-navy uppercase tracking-wide">
                        {anuncio.curso.nombre}
                      </p>
                      <p className="text-[9px] text-text-secondary shrink-0">
                        {formatFecha(anuncio.fechaPublicacion)}
                      </p>
                    </div>
                    <p className="text-xs text-text-primary font-medium mt-1.5">{anuncio.mensaje}</p>
                    <p className="text-[9px] text-text-secondary mt-2 text-right">
                      Por: {anuncio.docente}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Módulo 8: Monetización - Pre-Universidad */}
          {esSenior && academias.length > 0 && (
            <Card className="border-2 border-dashed border-brand-amber/40 bg-gradient-to-br from-amber-50/80 to-indigo-50/50 relative">
              <span className="absolute -top-2.5 right-4 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-brand-amber text-white rounded-full shadow-sm">
                Recomendado
              </span>
              <CardHeader
                icon={<GraduationCap className="h-5 w-5 text-brand-navy" />}
                title="Pre-Universidad"
              />
              <p className="text-xs text-text-secondary mb-4">
                ¡Estás a un paso de la universidad! Prepárate con nuestros convenios exclusivos:
              </p>
              <div className="grid gap-3">
                {academias.map((acad) => (
                  <div
                    key={acad.id}
                    className="bg-white border border-border-subtle rounded-xl p-3 flex justify-between items-center shadow-sm"
                  >
                    <span className="text-xs font-bold text-text-primary">{acad.nombre}</span>
                    {/* SIMULADO: acción de academia sin backend real */}
                    <Button size="sm" variant="primary">
                      Ver Información
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
