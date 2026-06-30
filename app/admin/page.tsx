"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { 
  GraduationCap, 
  Users, 
  BookOpen, 
  FileText, 
  CheckSquare, 
  Smartphone,
  LogOut, 
  UserPlus,
  Trash2,
  Loader2,
  TrendingUp,
  Award,
  BarChart3,
  Bell,
  CheckCircle
} from "lucide-react";
import { Controller } from "@/lib/mvc/controller";
import { calcularRiesgo } from "@/lib/ia/prediccion";
interface UserRecord {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: string;
  fechaCreacion?: string;
}

interface Aula {
  id: string;
  grado: string;
  seccion: string;
}

interface KPIs {
  totalEstudiantes: number;
  totalDocentes: number;
  totalCursos: number;
  tareasCreadasEstaSemana: number;
  porcentajeEntrega: number;
  totalTareas: number;
  tareasEntregadas: number;
  notificacionesExito: number;
  notificacionesFallo: number;
  totalPadres: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);

  // Formulario de Registro
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regRol, setRegRol] = useState<"DOCENTE" | "ESTUDIANTE" | "PADRE">("ESTUDIANTE");
  const [regAulaId, setRegAulaId] = useState("");
  const [regAlumnoEmail, setRegAlumnoEmail] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState("");

  const fetchData = () => {
    try {
      const data = Controller.getAdminDashboardData();
      if (data.success) {
        setKpis(data.kpis);
        setUsers(data.usuarios || []);
        setAulas(data.aulas || []);
      }
    } catch (err) {
      console.error("Error al cargar datos del administrador", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Protección de ruta a nivel de cliente
    const currentUser = Controller.getCurrentUser();
    if (!currentUser || currentUser.rol !== "ADMIN") {
      console.log("[Admin View] Usuario no autorizado o sesión expirada. Redirigiendo a Login.");
      router.push("/");
      return;
    }
    fetchData();
  }, [router]);

  const handleLogout = () => {
    try {
      Controller.logout();
      router.push("/");
    } catch (err) {
      console.error("Error al cerrar sesión", err);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegLoading(true);
    setRegSuccess("");

    try {
      const newUser = Controller.createUser({
        email: regEmail,
        passwordHash: regPassword,
        nombre: regNombre,
        telefono: regTelefono,
        rol: regRol,
        gradoSeccionId: regRol === "ESTUDIANTE" ? regAulaId : undefined,
        alumnoEmail: regRol === "PADRE" ? regAlumnoEmail : undefined,
      });

      setRegSuccess(`¡Usuario ${newUser.nombre} creado con éxito!`);
      setRegEmail("");
      setRegPassword("");
      setRegNombre("");
      setRegTelefono("");
      setRegAulaId("");
      setRegAlumnoEmail("");
      
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleDeleteUser = (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario del sistema?")) return;

    try {
      Controller.deleteUser(id);
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-100 min-h-screen">
        <div className="flex flex-col items-center gap-4 bg-white rounded-2xl p-10 shadow-sm border border-slate-200">
          <Loader2 className="h-10 w-10 text-[#0F2C59] animate-spin" />
          <p className="text-slate-600 text-sm font-semibold">Cargando módulo de administración...</p>
        </div>
      </div>
    );
  }

  const alumnosRiesgoAlto = users.filter(u => u.rol === 'ESTUDIANTE' && calcularRiesgo(u.id) === 'ALTO');

  return (
    <div className="flex-1 flex flex-col bg-slate-100 min-h-screen text-slate-800">
      
      {/* Cabecera */}
      <header className="bg-[#0F2C59] text-white sticky top-0 z-10 border-b-4 border-[#A30000] shadow-lg px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 border border-white/20 p-2 rounded-xl text-amber-400">
            <GraduationCap className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-wide uppercase leading-tight flex items-center gap-2">
              Cognitor
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 tracking-normal normal-case">
                Administración
              </span>
            </h1>
            <p className="text-[10px] text-slate-400">Plataforma Educativa Inteligente</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right bg-white/5 border border-white/10 px-3 py-1.5 rounded-lg">
            <p className="text-xs font-bold text-slate-200 uppercase">Administrador</p>
            <p className="text-[10px] text-amber-400 font-semibold">Control Total</p>
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

      {/* Contenido */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* KPIs */}
        {kpis && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            
            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm card-hover">
              <div className="p-3 bg-blue-50 text-[#0F2C59] border border-blue-100 rounded-xl shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Alumnos</p>
                <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.totalEstudiantes}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Matriculados</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm card-hover">
              <div className="p-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-xl shrink-0">
                <BookOpen className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Cursos</p>
                <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.totalCursos}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Aperturados</p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm card-hover">
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Tareas</p>
                <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.tareasCreadasEstaSemana}</h4>
                <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                  <TrendingUp className="h-3 w-3" /> Publicadas
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm card-hover">
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-xl shrink-0">
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Entrega</p>
                  <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.porcentajeEntrega}%</h4>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-[#0F2C59] h-full rounded-full transition-all duration-700"
                  style={{ width: `${kpis.porcentajeEntrega}%` }}
                />
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 flex items-center gap-4 shadow-sm card-hover">
              <div className="p-3 bg-violet-50 text-violet-700 border border-violet-100 rounded-xl shrink-0">
                <Users className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-none">Padres</p>
                <h4 className="text-2xl font-extrabold text-slate-900 mt-1">{kpis.totalPadres}</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Con acceso</p>
              </div>
            </div>

          </div>
        )}

        {/* Monitor de Notificaciones */}
        {kpis && (
          <div className="bg-white border border-slate-200 rounded-2xl p-5 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="bg-[#0F2C59] text-white p-3 rounded-xl shrink-0">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Monitor de Notificaciones SMS / WhatsApp</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Control de envío automático de recordatorios académicos.</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl text-center">
                <span className="text-[9px] text-emerald-600 font-bold block uppercase tracking-wide">Exitosos</span>
                <span className="text-xl font-extrabold text-emerald-700">{kpis.notificacionesExito}</span>
              </div>
              <div className="bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl text-center">
                <span className="text-[9px] text-red-500 font-bold block uppercase tracking-wide">Fallidos</span>
                <span className="text-xl font-extrabold text-red-600">{kpis.notificacionesFallo}</span>
              </div>
            </div>
          </div>
        )}

        {/* Panel de Trabajo Dual */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario de Alta */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <UserPlus className="h-5 w-5 text-[#0F2C59]" /> Registrar Nuevo Usuario
            </h3>

            {regSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-lg text-xs flex items-center gap-2 font-medium">
                <Award className="h-4 w-4 shrink-0" /> {regSuccess}
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Rol Institucional</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => { setRegRol("ESTUDIANTE"); setRegAulaId(""); setRegAlumnoEmail(""); }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      regRol === "ESTUDIANTE" 
                        ? "bg-[#0F2C59] border-[#0F2C59] text-white shadow-sm" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Estudiante
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegRol("DOCENTE"); setRegAulaId(""); setRegAlumnoEmail(""); }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      regRol === "DOCENTE" 
                        ? "bg-[#0F2C59] border-[#0F2C59] text-white shadow-sm" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Docente
                  </button>
                  <button
                    type="button"
                    onClick={() => { setRegRol("PADRE"); setRegAulaId(""); }}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      regRol === "PADRE" 
                        ? "bg-[#0F2C59] border-[#0F2C59] text-white shadow-sm" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Padre/Tutor
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Nombre Completo</label>
                <input
                  type="text"
                  required
                  value={regNombre}
                  onChange={(e) => setRegNombre(e.target.value)}
                  placeholder="Apellidos y Nombres"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Correo Electrónico</label>
                <input
                  type="email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="correo@colegio.edu.pe"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Contraseña</label>
                <input
                  type="password"
                  required
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Teléfono móvil (WhatsApp)</label>
                <input
                  type="text"
                  required
                  value={regTelefono}
                  onChange={(e) => setRegTelefono(e.target.value)}
                  placeholder="Ej. +51987654321"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
                />
              </div>

              {regRol === "ESTUDIANTE" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    Grado / Sección Asignada
                  </label>
                  <select
                    required={regRol === "ESTUDIANTE"}
                    value={regAulaId}
                    onChange={(e) => setRegAulaId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 text-xs focus:outline-none transition-all cursor-pointer"
                  >
                    <option value="">-- Seleccionar Aula --</option>
                    {aulas.map((aula) => (
                      <option key={aula.id} value={aula.id}>
                        {aula.grado} - "{aula.seccion}"
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {regRol === "PADRE" && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email del alumno a vincular</label>
                  <input
                    type="email"
                    required
                    value={regAlumnoEmail}
                    onChange={(e) => setRegAlumnoEmail(e.target.value)}
                    placeholder="correo.hijo@colegio.edu.pe"
                    className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2 px-3 text-slate-800 placeholder-slate-400 text-xs focus:outline-none transition-all"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={regLoading}
                className="w-full bg-[#0F2C59] hover:bg-[#143d7c] text-white font-bold rounded-lg py-2.5 text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {regLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> Guardar Usuario
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Directorio de Usuarios */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <Users className="h-5 w-5 text-[#0F2C59]" /> Directorio de Usuarios Activos
            </h3>

            {users.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No hay alumnos ni docentes registrados en el sistema.</p>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200 shadow-sm">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <th className="p-3 font-bold">Nombres y Apellidos</th>
                      <th className="p-3 font-bold">Correo Institucional</th>
                      <th className="p-3 font-bold">Teléfono Celular</th>
                      <th className="p-3 font-bold">Rol</th>
                      <th className="p-3 font-bold text-center">Operaciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3 font-semibold text-slate-800">{u.nombre}</td>
                        <td className="p-3 text-slate-600">{u.email}</td>
                        <td className="p-3 text-slate-600">{u.telefono}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${
                            u.rol === 'DOCENTE' 
                              ? 'bg-amber-50 text-amber-700 border-amber-200' 
                              : u.rol === 'PADRE'
                                ? 'bg-violet-50 text-violet-700 border-violet-200'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {u.rol}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 bg-slate-50 border border-slate-200 hover:border-red-200 hover:bg-red-50 text-slate-500 hover:text-red-700 rounded-lg cursor-pointer transition-all"
                            title="Eliminar Usuario"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ─── Módulo 7 — Alumnos en Seguimiento ─── */}
          <div className="lg:col-span-3 bg-white border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 pb-3 border-b border-slate-100">
              <TrendingUp className="h-5 w-5 text-red-600" /> Alumnos en Seguimiento (Riesgo Alto)
            </h3>

            {alumnosRiesgoAlto.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No hay alumnos en riesgo académico detectados actualmente.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {alumnosRiesgoAlto.map((alumno) => (
                  <div key={alumno.id} className="bg-red-50 border border-red-100 rounded-xl p-4 flex flex-col justify-between gap-3 shadow-sm">
                    <div>
                      <span className="inline-flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-widest text-red-600 bg-red-100 px-2 py-0.5 rounded mb-2">
                        <AlertTriangle className="h-3 w-3" /> Riesgo Alto
                      </span>
                      <h4 className="text-sm font-bold text-slate-800">{alumno.nombre}</h4>
                      <p className="text-xs text-slate-600 mt-0.5">{alumno.email}</p>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold border-t border-red-200/50 pt-2">
                      Falta de interacción y visualización de tareas reciente detectada por IA.
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
}
