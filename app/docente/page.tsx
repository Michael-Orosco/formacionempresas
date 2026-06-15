"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, 
  Plus, 
  Send, 
  Trash2, 
  Edit3, 
  BookOpen, 
  Calendar, 
  MessageSquare,
  LogOut, 
  Loader2,
  CheckCircle,
  X,
  AlertCircle
} from "lucide-react";

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
}

export default function DocenteDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Curso[]>([]);
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("Prof. Juan Pérez");

  // Formulario de Tareas
  const [taskCourseId, setTaskCourseId] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDesc, setTaskDesc] = useState("");
  const [taskDeadline, setTaskDeadline] = useState("");
  const [taskLoading, setTaskLoading] = useState(false);
  const [taskSuccess, setTaskSuccess] = useState("");

  // Formulario de Anuncios (WhatsApp)
  const [anuncioCourseId, setAnuncioCourseId] = useState("");
  const [anuncioMsg, setAnuncioMsg] = useState("");
  const [anuncioLoading, setAnuncioLoading] = useState(false);
  const [anuncioSuccess, setAnuncioSuccess] = useState("");

  // Estado para Edición
  const [editingTask, setEditingTask] = useState<Tarea | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Cargar Cursos y Tareas
  const fetchDashboardData = async () => {
    try {
      const [resCursos, resTareas] = await Promise.all([
        fetch("/api/docente/cursos"),
        fetch("/api/docente/tareas")
      ]);

      if (resCursos.status === 401 || resTareas.status === 401) {
        router.push("/");
        return;
      }

      const dataCursos = await resCursos.json();
      const dataTareas = await resTareas.json();

      setCourses(dataCursos.cursos || []);
      setTasks(dataTareas.tareas || []);
    } catch (err) {
      console.error("Error al cargar datos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [router]);

  // Cierre de sesión
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  // Crear Tarea
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);
    setTaskSuccess("");

    try {
      const res = await fetch("/api/docente/tareas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: taskTitle,
          descripcion: taskDesc,
          fechaEntrega: taskDeadline,
          cursoId: taskCourseId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fallo al crear tarea");

      setTaskSuccess("¡Tarea creada y registrada correctamente!");
      setTaskTitle("");
      setTaskDesc("");
      setTaskDeadline("");
      setTaskCourseId("");
      
      // Actualizar listado
      await fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTaskLoading(false);
    }
  };

  // Enviar Anuncio (WhatsApp)
  const handleSendAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnuncioLoading(true);
    setAnuncioSuccess("");

    try {
      const res = await fetch("/api/docente/anuncios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensaje: anuncioMsg,
          cursoId: anuncioCourseId,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fallo al enviar anuncio");

      setAnuncioSuccess(`¡Anuncio enviado con éxito a los alumnos matriculados!`);
      setAnuncioMsg("");
      setAnuncioCourseId("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAnuncioLoading(false);
    }
  };

  // Eliminar Tarea
  const handleDeleteTask = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;

    try {
      const res = await fetch(`/api/docente/tareas/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Fallo al eliminar tarea");

      await fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Abrir Modal de Edición
  const openEditModal = (tarea: Tarea) => {
    setEditingTask(tarea);
    setEditTitle(tarea.titulo);
    setEditDesc(tarea.descripcion);
    // Formatear la fecha para input local (YYYY-MM-DDThh:mm)
    const d = new Date(tarea.fechaEntrega);
    const tzoffset = d.getTimezoneOffset() * 60000; // offset in milliseconds
    const localISOTime = (new Date(d.getTime() - tzoffset)).toISOString().slice(0, 16);
    setEditDeadline(localISOTime);
  };

  // Guardar Edición
  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTask) return;
    setEditLoading(true);

    try {
      const res = await fetch(`/api/docente/tareas/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo: editTitle,
          descripcion: editDesc,
          fechaEntrega: editDeadline,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fallo al actualizar tarea");

      setEditingTask(null);
      await fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <Loader2 className="h-10 w-10 text-[#0F2C59] animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-semibold">Cargando panel de docente institucional...</p>
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
                Portal Docente
              </span>
            </span>
            <p className="text-[10px] text-slate-300">Universidad Nacional Mayor de San Marcos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-slate-200 font-bold">{teacherName}</p>
            <p className="text-[9px] text-amber-400 font-semibold uppercase">Cuerpo Docente Ordinario</p>
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Formulario 1: Nueva Tarea */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Plus className="h-5 w-5 text-[#0F2C59]" /> Registrar Nueva Tarea
            </h3>

            {taskSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" /> {taskSuccess}
              </div>
            )}

            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asignatura / Curso</label>
                <select
                  required
                  value={taskCourseId}
                  onChange={(e) => setTaskCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Seleccionar Asignatura --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.aula})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Título del Trabajo Académico</label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ej. Guía Práctica de Álgebra Lineal"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Descripción de Entrega / Enunciado</label>
                <textarea
                  required
                  rows={3}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Escribe las instrucciones detalladas de entrega y formato de la evaluación..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Fecha y Hora Límite de Recepción</label>
                <input
                  type="datetime-local"
                  required
                  value={taskDeadline}
                  onChange={(e) => setTaskDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={taskLoading}
                className="w-full bg-[#0F2C59] hover:bg-[#143d7c] text-white font-bold rounded-lg py-2.5 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {taskLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando Tarea...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" /> Guardar Tarea
                  </>
                )}
              </button>
            </form>
          </section>

          {/* Formulario 2: Avisos Masivos por WhatsApp */}
          <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <MessageSquare className="h-5 w-5 text-[#0F2C59]" /> Difusión de Avisos (WhatsApp)
            </h3>

            {anuncioSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs flex items-center gap-2 font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" /> {anuncioSuccess}
              </div>
            )}

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-lg text-[11px] text-amber-800 leading-relaxed shadow-sm">
              <AlertCircle className="h-4 w-4 inline mr-1 text-amber-600 font-bold shrink-0" />
              Esta herramienta enviará un mensaje de WhatsApp directo a los teléfonos celulares de todos los alumnos matriculados en la asignatura elegida.
            </div>

            <form onSubmit={handleSendAnnouncement} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Enviar al Curso</label>
                <select
                  required
                  value={anuncioCourseId}
                  onChange={(e) => setAnuncioCourseId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none transition-all cursor-pointer"
                >
                  <option value="">-- Seleccionar Asignatura --</option>
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>{c.nombre} ({c.aula})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Texto del Anuncio</label>
                <textarea
                  required
                  rows={4}
                  value={anuncioMsg}
                  onChange={(e) => setAnuncioMsg(e.target.value)}
                  placeholder="Estimados alumnos, se les recuerda que..."
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={anuncioLoading}
                className="w-full bg-[#0F2C59] hover:bg-[#143d7c] text-white font-bold rounded-lg py-2.5 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {anuncioLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Difundiendo mensaje...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Difundir Anuncio de Curso
                  </>
                )}
              </button>
            </form>
          </section>

        </div>

        {/* Tabla: Listado de Tareas */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
            <BookOpen className="h-5 w-5 text-[#0F2C59]" /> Trabajos Programados Vigentes
          </h3>

          {tasks.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">No has registrado ninguna tarea escolar en el sistema.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                    <th className="p-3 font-bold">Asignatura / Aula</th>
                    <th className="p-3 font-bold">Título</th>
                    <th className="p-3 font-bold">Descripción</th>
                    <th className="p-3 font-bold">Límite de Entrega</th>
                    <th className="p-3 font-bold">Estado</th>
                    <th className="p-3 font-bold text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tasks.map((tarea) => (
                    <tr key={tarea.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="p-3 font-semibold text-slate-800">
                        {tarea.curso.nombre}
                        <span className="block text-[10px] text-slate-400 font-bold">
                          {tarea.curso.gradoSeccion.grado} - {tarea.curso.gradoSeccion.seccion}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-700">{tarea.titulo}</td>
                      <td className="p-3 text-slate-600 max-w-xs truncate">{tarea.descripcion}</td>
                      <td className="p-3 text-slate-600">{formatFecha(tarea.fechaEntrega)}</td>
                      <td className="p-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                          tarea.estado === 'PENDIENTE' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {tarea.estado}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <div className="inline-flex gap-2">
                          <button
                            onClick={() => openEditModal(tarea)}
                            className="p-1.5 bg-slate-50 border border-slate-200 hover:border-amber-200 hover:bg-amber-50 text-slate-500 hover:text-amber-700 rounded-lg cursor-pointer transition-all"
                            title="Editar Tarea"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteTask(tarea.id)}
                            className="p-1.5 bg-slate-50 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded-lg cursor-pointer transition-all"
                            title="Eliminar Tarea"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

      </main>

      {/* Modal de Edición de Tarea - Rediseño Light */}
      {editingTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 w-full max-w-md p-6 rounded-xl shadow-2xl relative">
            <button
              onClick={() => setEditingTask(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            
            <h4 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Edit3 className="h-5 w-5 text-[#0F2C59]" /> Modificar Datos de Tarea
            </h4>

            <form onSubmit={handleUpdateTask} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Título</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none focus:border-[#0F2C59]"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Descripción / Instrucciones</label>
                <textarea
                  required
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none focus:border-[#0F2C59]"
                ></textarea>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 mb-1">Fecha Límite</label>
                <input
                  type="datetime-local"
                  required
                  value={editDeadline}
                  onChange={(e) => setEditDeadline(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none focus:border-[#0F2C59]"
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={() => setEditingTask(null)}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 bg-[#0F2C59] hover:bg-[#143d7c] text-white font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
                >
                  {editLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Guardar Cambios"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
