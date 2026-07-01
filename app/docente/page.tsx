"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Plus,
  Send,
  Trash2,
  Edit3,
  BookOpen,
  MessageSquare,
  LogOut,
  AlertCircle,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Controller } from "@/lib/mvc/controller";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import { TaskUrgencyBadge } from "@/components/ui/TaskUrgencyBadge";

interface Curso {
  id: string;
  nombre: string;
  aula: string;
}

interface Tarea {
  id: string;
  titulo: string;
  descripcion: string;
  fechaEntrega: string;
  estado: string;
  curso: {
    id: string;
    nombre: string;
    gradoSeccion: {
      grado: string;
      seccion: string;
    };
  };
  alumnosPendientes: number;
}

interface Silabo {
  id: string;
  semana: number;
  tema: string;
  cursoId: string;
}

type DeleteTarget = { type: "task" | "silabo"; id: string } | null;

function getCurrentAcademicWeek(): number {
  const now = new Date();
  const year = now.getMonth() >= 2 ? now.getFullYear() : now.getFullYear() - 1;
  const start = new Date(year, 2, 1);
  const diffDays = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, Math.min(40, Math.ceil((diffDays + 1) / 7)));
}

export default function DocenteDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Curso[]>([]);
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("Docente");

  const [taskCourseId, setTaskCourseId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);

  const [anuncioCourseId, setAnuncioCourseId] = useState("");
  const [anuncioMsg, setAnuncioMsg] = useState("");
  const [anuncioLoading, setAnuncioLoading] = useState(false);

  const [silabos, setSilabos] = useState<Silabo[]>([]);
  const [silaboCourseId, setSilaboCourseId] = useState("");
  const [silaboSemana, setSilaboSemana] = useState("");
  const [silaboTema, setSilaboTema] = useState("");
  const [silaboLoading, setSilaboLoading] = useState(false);

  const [editingTask, setEditingTask] = useState<Tarea | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const currentWeek = getCurrentAcademicWeek();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(
    () => new Set([currentWeek])
  );

  const inputClass =
    "w-full bg-slate-50 border border-border-subtle rounded-xl py-2 px-3 text-sm text-text-primary focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 transition-all";

  const fetchDashboardData = () => {
    try {
      const currentUser = Controller.getCurrentUser();
      if (!currentUser) return;

      const data = Controller.getDocenteDashboardData(currentUser.id);
      setCourses(data.cursos || []);
      setTasks(data.tareas || []);
      setSilabos(data.silabos || []);
    } catch (err) {
      logger.error("Error al cargar datos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = Controller.getCurrentUser();
    if (!currentUser || currentUser.rol !== "DOCENTE") {
      logger.log("[Docente View] Usuario no autorizado. Redirigiendo a Login.");
      router.push("/");
      return;
    }
    setTeacherName(currentUser.nombre);
    fetchDashboardData();
  }, [router]);

  const silabosByWeek = useMemo(() => {
    const grouped = new Map<number, Silabo[]>();
    for (const s of silabos) {
      const list = grouped.get(s.semana) ?? [];
      list.push(s);
      grouped.set(s.semana, list);
    }
    return Array.from(grouped.entries()).sort((a, b) => a[0] - b[0]);
  }, [silabos]);

  const toggleWeek = (semana: number) => {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(semana)) {
        next.delete(semana);
      } else {
        next.add(semana);
      }
      return next;
    });
  };

  const handleLogout = () => {
    try {
      Controller.logout();
      router.push("/");
    } catch (err) {
      logger.error("Error al cerrar sesión", err);
    }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);

    try {
      Controller.createTask({
        titulo: taskTitle,
        descripcion: taskDesc,
        fechaEntrega: taskDeadline,
        cursoId: taskCourseId,
      });

      toast.success("¡Tarea creada y registrada correctamente!");
      setTaskTitle("");
      setTaskDesc("");
      setTaskDeadline("");
      setTaskCourseId("");
      fetchDashboardData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear tarea");
    } finally {
      setTaskLoading(false);
    }
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    setAnuncioLoading(true);

    try {
      const currentUser = Controller.getCurrentUser();
      if (!currentUser) throw new Error("Sesión no válida");

      Controller.sendAnnouncement({
        mensaje: anuncioMsg,
        cursoId: anuncioCourseId,
        docenteId: currentUser.id,
      });

      toast.success("¡Anuncio enviado con éxito a los alumnos matriculados!");
      setAnuncioMsg("");
      setAnuncioCourseId("");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al enviar anuncio");
    } finally {
      setAnuncioLoading(false);
    }
  };

  const handleCreateSilabo = (e: React.FormEvent) => {
    e.preventDefault();
    setSilaboLoading(true);

    try {
      Controller.createSilaboEntry({
        semana: Number(silaboSemana),
        tema: silaboTema,
        cursoId: silaboCourseId,
      });

      toast.success("Tema agregado al sílabo.");
      setSilaboTema("");
      setSilaboSemana("");
      fetchDashboardData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al agregar tema");
    } finally {
      setSilaboLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);

    try {
      if (deleteTarget.type === "task") {
        Controller.deleteTask(deleteTarget.id);
      } else {
        Controller.deleteSilaboEntry(deleteTarget.id);
      }
      setDeleteTarget(null);
      fetchDashboardData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleteLoading(false);
    }
  };

  const openEditModal = (tarea: Tarea) => {
    setEditingTask(tarea);
    setEditTitle(tarea.titulo);
    setEditDesc(tarea.descripcion);
    const d = new Date(tarea.fechaEntrega);
    const tzoffset = d.getTimezoneOffset() * 60000;
    const localISOTime = new Date(d.getTime() - tzoffset).toISOString().slice(0, 16);
    setEditDeadline(localISOTime);
  };

  const handleUpdateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setEditLoading(true);

    try {
      Controller.updateTask(editingTask.id, {
        titulo: editTitle,
        descripcion: editDesc,
        fechaEntrega: editDeadline,
      });

      toast.success("Tarea actualizada correctamente");
      setEditingTask(null);
      fetchDashboardData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al actualizar tarea");
    } finally {
      setEditLoading(false);
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
      <div className="flex-1 flex flex-col bg-background min-h-screen">
        <div className="h-[72px] bg-brand-navy border-b-4 border-brand-red" />
        <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TableSkeleton rows={4} />
            <TableSkeleton rows={4} />
          </div>
          <TableSkeleton rows={6} />
          <TableSkeleton rows={5} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-background min-h-screen text-text-primary">
      <header className="bg-brand-navy text-white sticky top-0 z-30 border-b-4 border-brand-red shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 p-2 rounded-xl text-brand-amber">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide uppercase leading-tight flex items-center gap-2">
              Cognitor
              <Badge variant="warning" className="normal-case tracking-normal text-[10px]">
                Portal Docente
              </Badge>
            </h1>
            <p className="text-[10px] text-slate-300">Plataforma Educativa Inteligente</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-slate-200 font-bold">{teacherName}</p>
            <p className="text-[9px] text-brand-amber font-semibold uppercase">Cuerpo Docente Ordinario</p>
          </div>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleLogout}
            className="p-2 bg-white/10 hover:bg-red-700/25 border border-white/20 hover:border-red-500/40 text-slate-300 hover:text-red-300 rounded-xl"
            aria-label="Cerrar sesión"
            icon={<LogOut className="h-4 w-4" />}
          />
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader
              icon={<Plus className="h-5 w-5" />}
              title="Registrar Nueva Tarea"
            />

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Asignatura / Curso
                </label>
                <select
                  required
                  value={taskCourseId}
                  onChange={(e) => setTaskCourseId(e.target.value)}
                  className={`${inputClass} cursor-pointer text-xs`}
                >
                  <option value="">-- Seleccionar Asignatura --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.aula})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Título del Trabajo Académico
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ej. Guía Práctica de Álgebra Lineal"
                  className={`${inputClass} text-xs placeholder:text-text-secondary/60`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Descripción de Entrega / Enunciado
                </label>
                <textarea
                  required
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Escribe las instrucciones detalladas de entrega y formato de la evaluación..."
                  className={`${inputClass} text-xs placeholder:text-text-secondary/60`}
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Fecha y Hora Límite de Recepción
                </label>
                <input
                  type="datetime-local"
                  required
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className={`${inputClass} text-xs`}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="sm"
                loading={taskLoading}
                icon={<Plus className="h-4 w-4" />}
              >
                Guardar Tarea
              </Button>
            </form>
          </Card>

          <Card>
            <CardHeader
              icon={<MessageSquare className="h-5 w-5" />}
              title="Difusión de Avisos (WhatsApp)"
              action={<Badge variant="warning">Simulado</Badge>}
            />

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl text-[11px] text-amber-800 leading-relaxed mb-4">
              <AlertCircle className="h-4 w-4 inline mr-1 text-amber-600 font-bold shrink-0" />
              Esta herramienta enviará un mensaje de WhatsApp directo a los teléfonos celulares de todos los alumnos matriculados en la asignatura elegida.
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Enviar al Curso
                </label>
                <select
                  required
                  value={anuncioCourseId}
                  onChange={(e) => setAnuncioCourseId(e.target.value)}
                  className={`${inputClass} cursor-pointer text-xs`}
                >
                  <option value="">-- Seleccionar Asignatura --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} ({c.aula})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                  Texto del Anuncio
                </label>
                <textarea
                  required
                  rows={4}
                  value={anuncioMsg}
                  onChange={(e) => setAnuncioMsg(e.target.value)}
                  placeholder="Estimados alumnos, se les recuerda que..."
                  className={`${inputClass} text-xs placeholder:text-text-secondary/60`}
                />
              </div>

              <Button
                type="submit"
                className="w-full"
                size="sm"
                loading={anuncioLoading}
                icon={<Send className="h-4 w-4" />}
              >
                Difundir Anuncio de Curso
              </Button>
            </form>
          </Card>
        </div>

        <Card>
          <CardHeader
            icon={<BookOpen className="h-5 w-5" />}
            title="Trabajos Programados Vigentes"
          />

          {tasks.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="Sin tareas registradas"
              description="No has registrado ninguna tarea escolar en el sistema."
            />
          ) : (
            <div className="overflow-x-auto rounded-xl border border-border-subtle">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-text-secondary font-bold border-b border-border-subtle">
                    <th className="p-3 font-bold">Asignatura / Aula</th>
                    <th className="p-3 font-bold">Título</th>
                    <th className="p-3 font-bold">Descripción</th>
                    <th className="p-3 font-bold">Límite de Entrega</th>
                    <th className="p-3 font-bold text-center">Alumnos</th>
                    <th className="p-3 font-bold">Estado</th>
                    <th className="p-3 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((tarea) => (
                    <tr key={tarea.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-text-primary">
                        {tarea.curso.nombre}
                        <span className="block text-[10px] text-text-secondary font-bold">
                          {tarea.curso.gradoSeccion.grado} - {tarea.curso.gradoSeccion.seccion}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-text-primary">{tarea.titulo}</td>
                      <td className="p-3 text-text-secondary max-w-xs truncate">{tarea.descripcion}</td>
                      <td className="p-3">
                        <div className="flex flex-col gap-1.5">
                          <span className="text-text-secondary">{formatFecha(tarea.fechaEntrega)}</span>
                          <TaskUrgencyBadge fechaEntrega={tarea.fechaEntrega} />
                        </div>
                      </td>
                      <td className="p-3 font-bold text-brand-navy text-center">{tarea.alumnosPendientes}</td>
                      <td className="p-3">
                        <Badge variant={tarea.estado === "PENDIENTE" ? "warning" : "success"}>
                          {tarea.estado}
                        </Badge>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex gap-2">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(tarea)}
                            className="p-1.5 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
                            aria-label="Editar tarea"
                            icon={<Edit3 className="h-3.5 w-3.5" />}
                          />
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => setDeleteTarget({ type: "task", id: tarea.id })}
                            className="p-1.5 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                            aria-label="Eliminar tarea"
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader
            icon={<BookOpen className="h-5 w-5" />}
            title="Sílabo del Curso"
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <form onSubmit={handleCreateSilabo} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Asignatura
                  </label>
                  <select
                    required
                    value={silaboCourseId}
                    onChange={(e) => setSilaboCourseId(e.target.value)}
                    className={`${inputClass} cursor-pointer text-xs`}
                  >
                    <option value="">-- Seleccionar Asignatura --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} ({c.aula})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Semana
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    required
                    value={silaboSemana}
                    onChange={(e) => setSilaboSemana(e.target.value)}
                    placeholder="Ej. 1"
                    className={`${inputClass} text-xs`}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-text-secondary uppercase tracking-wider mb-1.5">
                    Tema
                  </label>
                  <input
                    type="text"
                    required
                    value={silaboTema}
                    onChange={(e) => setSilaboTema(e.target.value)}
                    placeholder="Introducción a..."
                    className={`${inputClass} text-xs`}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="sm"
                  loading={silaboLoading}
                  icon={<Plus className="h-4 w-4" />}
                >
                  Agregar al Sílabo
                </Button>
              </form>
            </div>

            <div className="lg:col-span-2">
              {silabos.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Sílabo vacío"
                  description="No hay temas registrados en el sílabo."
                />
              ) : (
                <div className="space-y-2">
                  {silabosByWeek.map(([semana, items]) => {
                    const isExpanded = expandedWeeks.has(semana);
                    const isCurrent = semana === currentWeek;

                    return (
                      <div
                        key={semana}
                        className={`border rounded-xl overflow-hidden ${
                          isCurrent ? "border-brand-navy/30 bg-brand-navy/5" : "border-border-subtle"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => toggleWeek(semana)}
                          className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50/80 transition-colors cursor-pointer"
                          aria-expanded={isExpanded}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-brand-navy shrink-0" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-text-secondary shrink-0" />
                            )}
                            <span className="text-sm font-bold text-text-primary">
                              Semana {semana}
                            </span>
                            {isCurrent && (
                              <Badge variant="brand" className="normal-case tracking-normal">
                                Actual
                              </Badge>
                            )}
                            <span className="text-[10px] text-text-secondary font-semibold">
                              ({items.length} {items.length === 1 ? "tema" : "temas"})
                            </span>
                          </div>
                        </button>

                        {isExpanded && (
                          <div className="border-t border-border-subtle divide-y divide-slate-100">
                            {items.map((s) => {
                              const curso = courses.find((c) => c.id === s.cursoId);
                              return (
                                <div
                                  key={s.id}
                                  className="flex items-center justify-between gap-3 px-4 py-3 bg-white"
                                >
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold text-text-primary truncate">
                                      {curso?.nombre || "Desconocido"}
                                    </p>
                                    <p className="text-xs text-text-secondary mt-0.5">{s.tema}</p>
                                  </div>
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setDeleteTarget({ type: "silabo", id: s.id })}
                                    className="shrink-0 text-text-secondary hover:text-danger hover:bg-red-50"
                                    aria-label="Eliminar tema del sílabo"
                                    icon={<Trash2 className="h-3.5 w-3.5" />}
                                  />
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </Card>
      </main>

      <Modal
        open={!!editingTask}
        onClose={() => setEditingTask(null)}
        title="Modificar Datos de Tarea"
        icon={<Edit3 className="h-5 w-5 text-brand-navy" />}
      >
        <form onSubmit={handleUpdateTask} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1">Título</label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className={`${inputClass} text-xs`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1">
              Descripción / Instrucciones
            </label>
            <textarea
              required
              rows={3}
              value={editDesc}
              onChange={(e) => setEditDesc(e.target.value)}
              className={`${inputClass} text-xs`}
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-text-secondary mb-1">Fecha Límite</label>
            <input
              type="datetime-local"
              required
              value={editDeadline}
              onChange={(e) => setEditDeadline(e.target.value)}
              className={`${inputClass} text-xs`}
            />
          </div>

          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTask(null)}>
              Cancelar
            </Button>
            <Button type="submit" size="sm" loading={editLoading}>
              Guardar Cambios
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title={deleteTarget?.type === "task" ? "Eliminar tarea" : "Eliminar tema del sílabo"}
        description={
          deleteTarget?.type === "task"
            ? "¿Estás seguro de que deseas eliminar esta tarea?"
            : "¿Deseas eliminar este tema del sílabo?"
        }
        loading={deleteLoading}
      />
    </div>
  );
}
