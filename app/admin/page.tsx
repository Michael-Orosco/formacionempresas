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
  AlertCircle,
  TrendingUp,
  Award,
  ShieldAlert
} from "lucide-react";

interface UserRecord {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: string;
  fechaCreacion: string;
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
  const [regRol, setRegRol] = useState<"DOCENTE" | "ESTUDIANTE">("ESTUDIANTE");
  const [regAulaId, setRegAulaId] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regSuccess, setRegSuccess] = useState("");

  const fetchData = async () => {
    try {
      const [resReport, resUsers] = await Promise.all([
        fetch("/api/admin/reportes"),
        fetch("/api/admin/usuarios")
      ]);

      if (resReport.status === 401 || resUsers.status === 401) {
        router.push("/");
        return;
      }

      const reportData = await resReport.json();
      const usersData = await resUsers.json();

      if (reportData.success) setKpis(reportData.kpis);
      if (usersData.success) {
        setUsers(usersData.usuarios || []);
        setAulas(usersData.aulas || []);
      }
    } catch (err) {
      console.error("Error al cargar datos del administrador", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
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
      const res = await fetch("/api/admin/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: regEmail,
          password: regPassword,
          nombre: regNombre,
          telefono: regTelefono,
          rol: regRol,
          gradoSeccionId: regRol === "ESTUDIANTE" ? regAulaId : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Fallo al guardar usuario");

      setRegSuccess(`¡Usuario ${data.usuario.nombre} creado con éxito!`);
      setRegEmail("");
      setRegPassword("");
      setRegNombre("");
      setRegTelefono("");
      setRegAulaId("");
      
      await fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setRegLoading(false);
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Estás seguro de que deseas eliminar este usuario del sistema?")) return;

    try {
      const res = await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Fallo al eliminar usuario");

      await fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 min-h-screen">
        <Loader2 className="h-10 w-10 text-[#0F2C59] animate-spin mb-4" />
        <p className="text-slate-600 text-sm font-semibold">Cargando módulo de administración institucional...</p>
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
                Módulo de Administración
              </span>
            </span>
            <p className="text-[10px] text-slate-300">Universidad Nacional Mayor de San Marcos</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col text-right">
            <p className="text-xs font-bold text-slate-200 uppercase">Director de Matrícula</p>
            <p className="text-[10px] text-amber-400 font-semibold">Oficina Central de Procesos Académicos</p>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center p-2 bg-white/10 hover:bg-red-700/25 border border-white/20 hover:border-red-500/40 text-slate-300 hover:text-red-300 rounded-lg transition-all cursor-pointer"
            title="Cerrar Sesión del Portal"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Contenido de Trabajo */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        
        {/* Fichas Informativas - KPIs */}
        {kpis && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Alumnos Matriculados</p>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{kpis.totalEstudiantes}</h4>
                <p className="text-[10px] text-slate-500 mt-1">Registrados en ciclo vigente</p>
              </div>
              <div className="p-3 bg-blue-50 text-[#0F2C59] border border-blue-100 rounded-lg">
                <Users className="h-5 w-5" />
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cursos Aperturados</p>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{kpis.totalCursos}</h4>
                <p className="text-[10px] text-slate-500 mt-1">Secciones programadas</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg">
                <BookOpen className="h-5 w-5" />
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tareas Publicadas</p>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{kpis.tareasCreadasEstaSemana}</h4>
                <p className="text-[10px] text-emerald-600 flex items-center gap-1 font-bold mt-1">
                  <TrendingUp className="h-3 w-3" /> Reportadas por docentes
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg">
                <FileText className="h-5 w-5" />
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-semibold">Tasa de Entregas</p>
                <h4 className="text-2xl font-extrabold text-slate-800 mt-1">{kpis.porcentajeEntrega}%</h4>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className="bg-[#0F2C59] h-full rounded-full"
                    style={{ width: `${kpis.porcentajeEntrega}%` }}
                  ></div>
                </div>
              </div>
              <div className="p-3 bg-slate-50 text-slate-700 border border-slate-200 rounded-lg">
                <CheckSquare className="h-5 w-5" />
              </div>
            </div>

          </div>
        )}

        {/* Registro y Envío de Notificaciones de WhatsApp */}
        {kpis && (
          <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="bg-blue-50 border border-blue-100 p-3 rounded-xl text-[#0F2C59]">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">Monitor de Notificaciones SMS / WhatsApp</h4>
                <p className="text-[11px] text-slate-500 mt-0.5">Control de envío automático de recordatorios académicos a teléfonos móviles.</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-center shadow-inner">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Envíos Exitosos</span>
                <span className="text-lg font-extrabold text-emerald-600">{kpis.notificacionesExito}</span>
              </div>
              <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-lg text-center shadow-inner">
                <span className="text-[9px] text-slate-400 font-bold block uppercase">Envíos Fallidos</span>
                <span className="text-lg font-extrabold text-red-600">{kpis.notificacionesFallo}</span>
              </div>
            </div>
          </div>
        )}

        {/* Panel de Trabajo Dual: Formulario e Historial */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Formulario de Alta de Usuario */}
          <div className="lg:col-span-1 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
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
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => { setRegRol("ESTUDIANTE"); setRegAulaId(""); }}
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
                    onClick={() => setRegRol("DOCENTE")}
                    className={`py-2 px-3 text-xs font-bold rounded-lg border transition-all cursor-pointer text-center ${
                      regRol === "DOCENTE" 
                        ? "bg-[#0F2C59] border-[#0F2C59] text-white shadow-sm" 
                        : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    Docente
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
                  placeholder="correo@unmsm.edu.pe"
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

          {/* Listado de Usuarios Registrados */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-4">
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

        </div>

      </main>
    </div>
  );
}
