"use client";

import { useEffect, useState, useMemo } from "react";
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
  TrendingUp,
  Building,
  Landmark,
  Coins,
  LayoutDashboard,
  Settings,
  AlertTriangle,
  Menu,
  X,
  Search,
  TrendingDown,
} from "lucide-react";
import { Controller } from "@/lib/mvc/controller";
import { calcularRiesgo } from "@/lib/ia/prediccion";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge, riesgoBadgeVariant } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiSkeletonGrid, TableSkeleton } from "@/components/ui/Skeleton";
import { Avatar } from "@/components/ui/Avatar";

type NavSection = "dashboard" | "usuarios" | "ingresos" | "academias" | "riesgo" | "config";

interface UserRecord {
  id: string;
  email: string;
  nombre: string;
  telefono: string;
  rol: string;
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
  tier: string;
  precioTier: number;
  padresPremium: number;
  ingresoAcademias: number;
  ingresosEstimados: number;
  academias: { id: string; nombre: string; montoMensual: number; activa: boolean }[];
}

const NAV_ITEMS: { id: NavSection; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "usuarios", label: "Usuarios", icon: Users },
  { id: "ingresos", label: "Ingresos", icon: Coins },
  { id: "academias", label: "Academias", icon: GraduationCap },
  { id: "riesgo", label: "Alumnos en Riesgo", icon: AlertTriangle },
  { id: "config", label: "Configuración", icon: Settings },
];

const USERS_PER_PAGE = 8;

export default function AdminDashboard() {
  const router = useRouter();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState<NavSection>("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userSearch, setUserSearch] = useState("");
  const [userPage, setUserPage] = useState(0);

  const [showUserModal, setShowUserModal] = useState(false);
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regNombre, setRegNombre] = useState("");
  const [regTelefono, setRegTelefono] = useState("");
  const [regRol, setRegRol] = useState<"DOCENTE" | "ESTUDIANTE" | "PADRE">("ESTUDIANTE");
  const [regAulaId, setRegAulaId] = useState("");
  const [regAlumnoEmail, setRegAlumnoEmail] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nombre: string } | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchData = () => {
    try {
      const data = Controller.getAdminDashboardData();
      if (data.success) {
        setKpis(data.kpis as KPIs);
        setUsers(data.usuarios || []);
        setAulas(data.aulas || []);
      }
    } catch (err) {
      logger.error("Error al cargar datos del administrador", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const currentUser = Controller.getCurrentUser();
    if (!currentUser || currentUser.rol !== "ADMIN") {
      logger.log("[Admin View] Usuario no autorizado. Redirigiendo a Login.");
      router.push("/");
      return;
    }
    fetchData();
  }, [router]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.nombre.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.rol.toLowerCase().includes(q)
    );
  }, [users, userSearch]);

  const paginatedUsers = filteredUsers.slice(
    userPage * USERS_PER_PAGE,
    (userPage + 1) * USERS_PER_PAGE
  );
  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);

  const alumnosRiesgoAlto = users.filter(
    (u) => u.rol === "ESTUDIANTE" && calcularRiesgo(u.id) === "ALTO"
  );

  const handleLogout = () => {
    Controller.logout();
    router.push("/");
  };

  const navigate = (section: NavSection) => {
    setActiveSection(section);
    setSidebarOpen(false);
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!regNombre.trim()) errors.nombre = "El nombre es obligatorio";
    if (!regEmail.trim()) errors.email = "El correo es obligatorio";
    if (regPassword.length < 6) errors.password = "Mínimo 6 caracteres";
    if (!regTelefono.trim()) errors.telefono = "El teléfono es obligatorio";
    if (regRol === "ESTUDIANTE" && !regAulaId) errors.aula = "Selecciona un aula";
    if (regRol === "PADRE" && !regAlumnoEmail.trim()) errors.alumnoEmail = "Email del alumno requerido";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setRegLoading(true);

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

      toast.success(`Usuario ${newUser.nombre} creado con éxito`);
      setShowUserModal(false);
      setRegEmail("");
      setRegPassword("");
      setRegNombre("");
      setRegTelefono("");
      setRegAulaId("");
      setRegAlumnoEmail("");
      setFormErrors({});
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear usuario");
    } finally {
      setRegLoading(false);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      Controller.deleteUser(deleteTarget.id);
      toast.success("Usuario eliminado correctamente");
      setDeleteTarget(null);
      fetchData();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al eliminar");
    } finally {
      setDeleteLoading(false);
    }
  };

  const inputClass = (field: string) =>
    `w-full bg-slate-50 border rounded-xl py-2.5 px-3 text-sm text-text-primary focus:outline-none transition-all ${
      formErrors[field]
        ? "border-danger focus:ring-2 focus:ring-danger/20"
        : "border-border-subtle focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10"
    }`;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <div className="flex-1 p-6 space-y-6">
          <KpiSkeletonGrid count={6} />
          <TableSkeleton rows={6} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-text-primary">
      {/* Sidebar overlay (mobile) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-brand-navy text-white flex flex-col transition-transform lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-brand-amber" />
            <span className="font-extrabold text-sm">Cognitor</span>
          </div>
          <button
            type="button"
            className="lg:hidden p-1 text-slate-300 hover:text-white"
            onClick={() => setSidebarOpen(false)}
            aria-label="Cerrar menú"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer relative ${
                  active ? "bg-white/10 text-white" : "text-slate-200 hover:bg-white/5"
                }`}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-6 bg-brand-amber rounded-r" />
                )}
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-200 hover:bg-white/10 transition-all cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-brand-navy text-white sticky top-0 z-30 border-b-4 border-brand-red shadow-lg px-4 md:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="lg:hidden p-2 bg-white/10 rounded-xl"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-lg font-extrabold">Administración</h1>
              <p className="text-[10px] text-slate-300">Control institucional</p>
            </div>
          </div>
          <Badge variant="warning" className="normal-case tracking-normal text-[10px]">
            {kpis?.tier ?? "—"}
          </Badge>
        </header>

        <main className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto">
          {/* Dashboard */}
          {(activeSection === "dashboard" || activeSection === "ingresos") && kpis && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {[
                  { icon: Users, label: "Alumnos", value: kpis.totalEstudiantes, sub: "Matriculados", trend: "+2" },
                  { icon: BookOpen, label: "Cursos", value: kpis.totalCursos, sub: "Aperturados", trend: "0" },
                  { icon: FileText, label: "Tareas", value: kpis.tareasCreadasEstaSemana, sub: "Publicadas", trend: "+3" },
                  { icon: CheckSquare, label: "Entrega", value: `${kpis.porcentajeEntrega}%`, sub: `${kpis.tareasEntregadas}/${kpis.totalTareas}`, trend: kpis.porcentajeEntrega >= 50 ? "+5%" : "-2%" },
                  { icon: Users, label: "Padres", value: kpis.totalPadres, sub: "Con acceso", trend: "+1" },
                  { icon: Building, label: "Plan", value: kpis.tier, sub: `S/${kpis.precioTier}/mes`, trend: "" },
                ].map((kpi) => (
                  <Card key={kpi.label} padding="sm">
                    <div className="flex justify-between items-start">
                      <div className="p-2.5 bg-brand-navy/5 text-brand-navy rounded-xl">
                        <kpi.icon className="h-5 w-5" />
                      </div>
                      {kpi.trend && (
                        <span className={`text-[10px] font-semibold flex items-center gap-0.5 ${kpi.trend.startsWith("+") ? "text-success" : kpi.trend.startsWith("-") ? "text-danger" : "text-text-secondary"}`}>
                          {kpi.trend.startsWith("+") ? <TrendingUp className="h-3 w-3" /> : kpi.trend.startsWith("-") ? <TrendingDown className="h-3 w-3" /> : null}
                          {kpi.trend}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-text-secondary uppercase tracking-wider mt-3">{kpi.label}</p>
                    <p className="text-3xl font-extrabold text-text-primary mt-0.5">{kpi.value}</p>
                    <p className="text-[10px] text-text-secondary mt-0.5">{kpi.sub}</p>
                  </Card>
                ))}
              </div>

              {activeSection === "dashboard" && (
                <Card>
                  <CardHeader
                    icon={<Smartphone className="h-5 w-5" />}
                    title="Monitor de Notificaciones SMS / WhatsApp"
                  />
                  <p className="text-xs text-text-secondary mb-4">
                    Control de envío automático de recordatorios académicos.
                  </p>
                  <div className="flex gap-3">
                    <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-xl text-center flex-1">
                      <span className="text-[9px] text-success font-semibold block uppercase">Exitosos</span>
                      <span className="text-xl font-extrabold text-emerald-700">{kpis.notificacionesExito}</span>
                    </div>
                    <div className="bg-red-50 border border-red-100 px-4 py-2.5 rounded-xl text-center flex-1">
                      <span className="text-[9px] text-danger font-semibold block uppercase">Fallidos</span>
                      <span className="text-xl font-extrabold text-red-600">{kpis.notificacionesFallo}</span>
                    </div>
                  </div>
                </Card>
              )}

              {activeSection === "dashboard" && (
                <Card className="bg-brand-gradient border-brand-navy text-white !shadow-lg">
                  <CardHeader
                    icon={<Landmark className="h-6 w-6 text-brand-amber" />}
                    title="Ingresos Estimados"
                  />
                  <p className="text-xs text-slate-200 mb-4">Proyección mensual · SIMULADO</p>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-200">Licencia ({kpis.tier})</span>
                      <span className="font-semibold">S/ {kpis.precioTier}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-200">Padres Premium</span>
                      <span className="font-semibold text-emerald-300">+ S/ {kpis.padresPremium * 15}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-200">Academias</span>
                      <span className="font-semibold text-emerald-300">+ S/ {kpis.ingresoAcademias}</span>
                    </div>
                    <div className="pt-3 border-t border-white/20 flex justify-between items-center">
                      <span className="text-xs font-semibold uppercase tracking-wider">Total</span>
                      <span className="text-4xl font-extrabold text-brand-amber">S/ {kpis.ingresosEstimados}</span>
                    </div>
                  </div>
                </Card>
              )}
            </>
          )}

          {/* Ingresos */}
          {(activeSection === "ingresos" || activeSection === "dashboard") && kpis && activeSection === "ingresos" && (
            <Card className="bg-brand-gradient border-brand-navy text-white !shadow-lg">
              <CardHeader
                icon={<Landmark className="h-6 w-6 text-brand-amber" />}
                title="Ingresos Estimados"
              />
              <p className="text-xs text-slate-200 mb-4">Proyección mensual · SIMULADO</p>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-200">Licencia Colegio ({kpis.tier})</span>
                  <span className="font-semibold">S/ {kpis.precioTier}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-200">Padres Premium ({kpis.padresPremium} × S/15)</span>
                  <span className="font-semibold text-emerald-300">+ S/ {kpis.padresPremium * 15}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-200">Convenios Academias ({kpis.academias.length})</span>
                  <span className="font-semibold text-emerald-300">+ S/ {kpis.ingresoAcademias}</span>
                </div>
                <div className="h-2 rounded-full bg-white/20 overflow-hidden flex mt-2">
                  <div className="bg-brand-amber" style={{ width: `${(kpis.precioTier / kpis.ingresosEstimados) * 100}%` }} />
                  <div className="bg-emerald-400" style={{ width: `${((kpis.padresPremium * 15) / kpis.ingresosEstimados) * 100}%` }} />
                  <div className="bg-emerald-600" style={{ width: `${(kpis.ingresoAcademias / kpis.ingresosEstimados) * 100}%` }} />
                </div>
                <div className="pt-3 border-t border-white/20 flex justify-between items-center">
                  <span className="text-xs font-semibold uppercase tracking-wider">Total Proyectado</span>
                  <span className="text-4xl font-extrabold text-brand-amber">S/ {kpis.ingresosEstimados}</span>
                </div>
              </div>
            </Card>
          )}

          {/* Academias */}
          {activeSection === "academias" && kpis && (
            <Card>
              <CardHeader icon={<GraduationCap className="h-5 w-5" />} title="Academias Integradas (B2B)" />
              {kpis.academias.length === 0 ? (
                <EmptyState icon={GraduationCap} title="No hay academias registradas" />
              ) : (
                <div className="space-y-3">
                  {kpis.academias.map((acad) => (
                    <div key={acad.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl border border-border-subtle">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-success" />
                        <span className="text-sm font-semibold">{acad.nombre}</span>
                      </div>
                      <Badge variant="success">S/ {acad.montoMensual}/mes</Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Usuarios */}
          {activeSection === "usuarios" && (
            <Card>
              <CardHeader
                icon={<Users className="h-5 w-5" />}
                title="Directorio de Usuarios"
                action={
                  <Button
                    size="sm"
                    icon={<UserPlus className="h-4 w-4" />}
                    onClick={() => setShowUserModal(true)}
                  >
                    Nuevo Usuario
                  </Button>
                }
              />

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="search"
                  placeholder="Buscar por nombre, correo o rol..."
                  value={userSearch}
                  onChange={(e) => { setUserSearch(e.target.value); setUserPage(0); }}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-border-subtle rounded-xl text-sm focus:outline-none focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10"
                />
              </div>

              {filteredUsers.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="No hay usuarios registrados"
                  description="Crea el primer usuario del colegio"
                  actionLabel="Crear usuario"
                  onAction={() => setShowUserModal(true)}
                />
              ) : (
                <>
                  {/* Desktop table */}
                  <div className="hidden md:block overflow-x-auto rounded-xl border border-border-subtle">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="bg-slate-50 text-text-secondary border-b border-border-subtle">
                          <th className="p-3 font-semibold">Usuario</th>
                          <th className="p-3 font-semibold">Correo</th>
                          <th className="p-3 font-semibold">Teléfono</th>
                          <th className="p-3 font-semibold">Rol</th>
                          <th className="p-3 font-semibold text-center">Acciones</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {paginatedUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/70">
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <Avatar nombre={u.nombre} rol={u.rol} />
                                <span className="font-medium">{u.nombre}</span>
                              </div>
                            </td>
                            <td className="p-3 text-text-secondary">{u.email}</td>
                            <td className="p-3 text-text-secondary">{u.telefono}</td>
                            <td className="p-3">
                              <Badge variant={u.rol === "DOCENTE" ? "warning" : u.rol === "PADRE" ? "neutral" : "success"}>
                                {u.rol}
                              </Badge>
                            </td>
                            <td className="p-3 text-center">
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ id: u.id, nombre: u.nombre })}
                                className="p-2 rounded-lg text-text-secondary hover:text-danger hover:bg-red-50 transition-all cursor-pointer"
                                aria-label={`Eliminar ${u.nombre}`}
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile cards */}
                  <div className="md:hidden space-y-3">
                    {paginatedUsers.map((u) => (
                      <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-border-subtle">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar nombre={u.nombre} rol={u.rol} />
                          <div className="min-w-0">
                            <p className="text-sm font-semibold truncate">{u.nombre}</p>
                            <p className="text-xs text-text-secondary truncate">{u.email}</p>
                            <Badge variant={u.rol === "DOCENTE" ? "warning" : u.rol === "PADRE" ? "neutral" : "success"} className="mt-1">
                              {u.rol}
                            </Badge>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ id: u.id, nombre: u.nombre })}
                          className="p-2 text-text-secondary hover:text-danger"
                          aria-label={`Eliminar ${u.nombre}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {totalPages > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      <Button variant="secondary" size="sm" disabled={userPage === 0} onClick={() => setUserPage((p) => p - 1)}>
                        Anterior
                      </Button>
                      <span className="text-xs text-text-secondary self-center px-2">
                        {userPage + 1} / {totalPages}
                      </span>
                      <Button variant="secondary" size="sm" disabled={userPage >= totalPages - 1} onClick={() => setUserPage((p) => p + 1)}>
                        Siguiente
                      </Button>
                    </div>
                  )}
                </>
              )}
            </Card>
          )}

          {/* Riesgo */}
          {activeSection === "riesgo" && (
            <Card>
              <CardHeader icon={<TrendingUp className="h-5 w-5 text-danger" />} title="Alumnos en Seguimiento (Riesgo Alto)" />
              {alumnosRiesgoAlto.length === 0 ? (
                <EmptyState
                  icon={CheckSquare}
                  title="Sin alumnos en riesgo alto"
                  description="No se detectaron patrones de riesgo académico actualmente."
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {alumnosRiesgoAlto.map((alumno) => (
                    <div key={alumno.id} className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                      <Badge variant={riesgoBadgeVariant("ALTO")}>Riesgo Alto</Badge>
                      <h4 className="text-sm font-semibold">{alumno.nombre}</h4>
                      <p className="text-xs text-text-secondary">{alumno.email}</p>
                      <p className="text-[10px] text-text-secondary border-t border-red-100 pt-2">
                        Falta de interacción detectada por IA.
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* Config */}
          {activeSection === "config" && (
            <Card>
              <CardHeader icon={<Settings className="h-5 w-5" />} title="Configuración" />
              <p className="text-sm text-text-secondary">
                Panel de configuración institucional. Los ajustes avanzados estarán disponibles en la versión con base de datos centralizada.
              </p>
              <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-border-subtle text-xs text-text-secondary">
                <p><strong>Colegio:</strong> Colegio Anglo Americano</p>
                <p className="mt-1"><strong>Licencia:</strong> Activa</p>
                <p className="mt-1"><strong>Persistencia:</strong> LocalStorage (modo demo)</p>
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* Modal crear usuario */}
      <Modal
        open={showUserModal}
        onClose={() => setShowUserModal(false)}
        title="Registrar Nuevo Usuario"
        icon={<UserPlus className="h-5 w-5 text-brand-navy" />}
        size="lg"
      >
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Rol</label>
            <div className="grid grid-cols-3 gap-2">
              {(["ESTUDIANTE", "DOCENTE", "PADRE"] as const).map((rol) => (
                <button
                  key={rol}
                  type="button"
                  onClick={() => { setRegRol(rol); setRegAulaId(""); setRegAlumnoEmail(""); }}
                  className={`py-2 text-xs font-semibold rounded-lg border cursor-pointer ${
                    regRol === rol ? "bg-brand-navy border-brand-navy text-white" : "bg-slate-50 border-border-subtle"
                  }`}
                >
                  {rol === "PADRE" ? "Padre/Tutor" : rol.charAt(0) + rol.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="reg-nombre" className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Nombre</label>
            <input id="reg-nombre" type="text" required value={regNombre} onChange={(e) => setRegNombre(e.target.value)} className={inputClass("nombre")} />
            {formErrors.nombre && <p className="text-xs text-danger mt-1">{formErrors.nombre}</p>}
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Correo</label>
            <input id="reg-email" type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputClass("email")} />
            {formErrors.email && <p className="text-xs text-danger mt-1">{formErrors.email}</p>}
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Contraseña</label>
            <input id="reg-password" type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputClass("password")} />
            {formErrors.password && <p className="text-xs text-danger mt-1">{formErrors.password}</p>}
          </div>

          <div>
            <label htmlFor="reg-telefono" className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Teléfono WhatsApp</label>
            <input id="reg-telefono" type="text" required value={regTelefono} onChange={(e) => setRegTelefono(e.target.value)} placeholder="+51987654321" className={inputClass("telefono")} />
            {formErrors.telefono && <p className="text-xs text-danger mt-1">{formErrors.telefono}</p>}
          </div>

          {regRol === "ESTUDIANTE" && (
            <div>
              <label htmlFor="reg-aula" className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Aula</label>
              <select id="reg-aula" value={regAulaId} onChange={(e) => setRegAulaId(e.target.value)} className={inputClass("aula")}>
                <option value="">— Seleccionar —</option>
                {aulas.map((a) => (
                  <option key={a.id} value={a.id}>{a.grado} - {a.seccion}</option>
                ))}
              </select>
              {formErrors.aula && <p className="text-xs text-danger mt-1">{formErrors.aula}</p>}
            </div>
          )}

          {regRol === "PADRE" && (
            <div>
              <label htmlFor="reg-alumno" className="block text-xs font-semibold text-text-secondary uppercase mb-1.5">Email del alumno</label>
              <input id="reg-alumno" type="email" required value={regAlumnoEmail} onChange={(e) => setRegAlumnoEmail(e.target.value)} className={inputClass("alumnoEmail")} />
              {formErrors.alumnoEmail && <p className="text-xs text-danger mt-1">{formErrors.alumnoEmail}</p>}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowUserModal(false)}>Cancelar</Button>
            <Button type="submit" size="sm" loading={regLoading} icon={<UserPlus className="h-4 w-4" />}>Guardar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar usuario"
        description={`¿Estás seguro de eliminar a ${deleteTarget?.nombre}? Esta acción no se puede deshacer.`}
        loading={deleteLoading}
      />
    </div>
  );
}
