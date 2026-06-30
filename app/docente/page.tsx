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
import { Controller } from "@/lib/mvc/controller";

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

export default function DocenteDashboard() {
  const router = useRouter();
  const [courses, setCourses] = useState<Curso[]>([]);
  const [tasks, setTasks] = useState<Tarea[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherName, setTeacherName] = useState("Docente");

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

  // Formulario de Sílabo
  const [silabos, setSilabos] = useState<Silabo[]>([]);
  const [silaboCourseId, setSilaboCourseId] = useState("");
  const [silaboSemana, setSilaboSemana] = useState("");
  const [silaboTema, setSilaboTema] = useState("");
  const [silaboLoading, setSilaboLoading] = useState(false);
  const [silaboSuccess, setSilaboSuccess] = useState("");

  // Estado para Edición
  const [editingTask, setEditingTask] = useState<Tarea | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editDeadline, setEditDeadline] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Cargar Cursos y Tareas
  const fetchDashboardData = () => {
    try {
      const currentUser = Controller.getCurrentUser();
      if (!currentUser) return;

      const data = Controller.getDocenteDashboardData(currentUser.id);
      setCourses(data.cursos || []);
      setTasks(data.tareas || []);
      setSilabos(data.silabos || []);
    } catch (err) {
      console.error("Error al cargar datos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Protección de ruta a nivel de cliente
    const currentUser = Controller.getCurrentUser();
    if (!currentUser || currentUser.rol !== "DOCENTE") {
      console.log("[Docente View] Usuario no autorizado. Redirigiendo a Login.");
      router.push("/");
      return;
    }
    setTeacherName(currentUser.nombre);
    fetchDashboardData();
  }, [router]);

  // Cierre de sesión
  const handleLogout = () => {
    try {
      Controller.logout();
      router.push("/");
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  // Crear Tarea
  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    setTaskLoading(true);
    setTaskSuccess("");

    try {
      Controller.createTask({
        titulo: taskTitle,
        descripcion: taskDesc,
        fechaEntrega: taskDeadline,
        cursoId: taskCourseId,
      });

      setTaskSuccess("¡Tarea creada y registrada correctamente!");
      setTaskTitle("");
      setTaskDesc("");
      setTaskDeadline("");
      setTaskCourseId("");
      
      // Actualizar listado
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setTaskLoading(false);
    }
  };

  // Enviar Anuncio (WhatsApp)
  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    setAnuncioLoading(true);
    setAnuncioSuccess("");

    try {
      const currentUser = Controller.getCurrentUser();
      if (!currentUser) throw new Error("Sesión no válida");

      Controller.sendAnnouncement({
        mensaje: anuncioMsg,
        cursoId: anuncioCourseId,
        docenteId: currentUser.id,
      });

      setAnuncioSuccess(`¡Anuncio enviado con éxito a los alumnos matriculados!`);
      setAnuncioMsg("");
      setAnuncioCourseId("");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setAnuncioLoading(false);
    }
  };

  // Crear Entrada de Sílabo
  const handleCreateSilabo = (e: React.FormEvent) => {
    e.preventDefault();
    setSilaboLoading(true);
    setSilaboSuccess("");

    try {
      Controller.createSilaboEntry({
        semana: Number(silaboSemana),
        tema: silaboTema,
        cursoId: silaboCourseId,
      });

      setSilaboSuccess("Tema agregado al sílabo.");
      setSilaboTema("");
      setSilaboSemana("");
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSilaboLoading(false);
    }
  };

  const handleDeleteSilabo = (id: string) => {
    if (!confirm("¿Deseas eliminar este tema del sílabo?")) return;
    try {
      Controller.deleteSilaboEntry(id);
      fetchDashboardData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Eliminar Tarea
  const handleDeleteTask = (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar esta tarea?")) return;

    try {
      Controller.deleteTask(id);
      fetchDashboardData();
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

      setEditingTask(null);
      fetchDashboardData();
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
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 min-h-screen">
        <div className="flex flex-col items-center gap-4 bg-white rounded-2xl p-10 shadow-sm border border-slate-200">
          <Loader2 className="h-10 w-10 text-[#0F2C59] animate-spin" />
          <p className="text-slate-600 text-sm font-semibold">Cargando panel de docente...</p>
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
            <h1 className="text-lg font-bold tracking-wide uppercase leading-tight flex items-center gap-2">
              Cognitor
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-normal normal-case">
                Portal Docente
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Plataforma Educativa Inteligente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-xs text-slate-200 font-bold">{teacherName}</p>
            <p className="text-[9px] text-amber-400 font-semibold uppercase">Cuerpo Docente Ordinario</p>
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Formulario 1: Nueva Tarea */}
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
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
                    <th className="p-3 font-bold text-center">Alumnos</th>
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
                      <td className="p-3 font-bold text-[#0F2C59] text-center">{tarea.alumnosPendientes}</td>
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

        {/* Tabla: Sílabo del Curso */}
        <section className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
            <BookOpen className="h-5 w-5 text-violet-600" /> Sílabo del Curso
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Formulario de Sílabo */}
            <div className="lg:col-span-1 space-y-4">
              {silaboSuccess && (
                <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs flex items-center gap-2 font-medium">
                  <CheckCircle className="h-4 w-4 shrink-0" /> {silaboSuccess}
                </div>
              )}
              <form onSubmit={handleCreateSilabo} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Asignatura</label>
                  <select
                    required
                    value={silaboCourseId}
                    onChange={(e) => setSilaboCourseId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-violet-600 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Asignatura --</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>{c.nombre} ({c.aula})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Semana</label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    required
                    value={silaboSemana}
                    onChange={(e) => setSilaboSemana(e.target.value)}
                    placeholder="Ej. 1"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tema</label>
                  <input
                    type="text"
                    required
                    value={silaboTema}
                    onChange={(e) => setSilaboTema(e.target.value)}
                    placeholder="Introducción a..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={silaboLoading}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-lg py-2.5 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                >
                  {silaboLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Agregar al Sílabo
                </button>
              </form>
            </div>

            {/* Lista de Sílabo */}
            <div className="lg:col-span-2">
              {silabos.length === 0 ? (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-xs">
                  No hay temas registrados en el sílabo.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                        <th className="p-3 font-bold">Asignatura</th>
                        <th className="p-3 font-bold text-center">Semana</th>
                        <th className="p-3 font-bold">Tema</th>
                        <th className="p-3 font-bold text-center">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {silabos.map((s) => {
                        const curso = courses.find(c => c.id === s.cursoId);
                        return (
                          <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="p-3 font-semibold text-slate-800">{curso?.nombre || 'Desconocido'}</td>
                            <td className="p-3 text-center text-slate-600 font-bold">{s.semana}</td>
                            <td className="p-3 text-slate-600">{s.tema}</td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleDeleteSilabo(s.id)}
                                className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                title="Eliminar Tema"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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

      {/* Módulo 7 — Próximamente */}
      <div className="fixed bottom-6 right-6 z-20 flex flex-col items-end gap-2">
        <div className="bg-white border border-slate-200 rounded-xl shadow-lg px-3 py-1.5 flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" /> Módulo 7 — Próximamente
        </div>
        <button
          disabled
          id="docente-mod7-btn"
          className="bg-slate-300 text-slate-500 p-4 rounded-full shadow-lg flex items-center justify-center cursor-not-allowed opacity-60"
          title="Módulo 7 — Próximamente"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>
        </button>
      </div>

    </div>
  );
}
