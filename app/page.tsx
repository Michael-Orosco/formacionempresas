"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Lock,
  Mail,
  Eye,
  EyeOff,
  ShieldCheck,
  Users,
  Heart,
  Building2,
  ChevronDown,
} from "lucide-react";
import { Controller } from "@/lib/mvc/controller";
import { Button } from "@/components/ui/Button";

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

const roles = [
  { icon: Users, title: "Docentes", desc: "Gestiona tareas y sílabos" },
  { icon: GraduationCap, title: "Alumnos", desc: "Accede a tus actividades" },
  { icon: Heart, title: "Padres", desc: "Seguimiento en tiempo real" },
  { icon: Building2, title: "Admins", desc: "Control institucional" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorType, setErrorType] = useState<"auth" | "network" | "">("");
  const [rolesOpen, setRolesOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setErrorType("");

    try {
      const user = Controller.login(email, password);
      const rol = user.rol;
      if (rol === "ADMIN") router.push("/admin");
      else if (rol === "DOCENTE") router.push("/docente");
      else if (rol === "ESTUDIANTE") router.push("/estudiante");
      else if (rol === "PADRE") router.push("/padre");
      else throw new Error("Rol de usuario no reconocido");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.startsWith("AUTH_INVALID")) {
        setErrorType("auth");
        setError("Correo o contraseña incorrectos. Verifica tus credenciales institucionales.");
      } else if (err instanceof TypeError || msg.toLowerCase().includes("network")) {
        setErrorType("network");
        setError("No se pudo conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
      } else {
        setErrorType("auth");
        setError(msg || "Credenciales incorrectas");
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePrefill = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      admin: { email: "admin@colegio.edu.pe", password: "admin123" },
      docente: { email: "juan.perez@colegio.edu.pe", password: "docente123" },
      estudiante: { email: "pedrito@colegio.edu.pe", password: "alumno123" },
      padre: { email: "padre1@colegio.edu.pe", password: "padre123" },
    };
    if (creds[role]) {
      setEmail(creds[role].email);
      setPassword(creds[role].password);
    }
  };

  const quickAccess = [
    { key: "admin", label: "Admin", dot: "bg-brand-navy", hover: "hover:border-brand-navy hover:bg-blue-50 text-brand-navy" },
    { key: "docente", label: "Docente", dot: "bg-brand-amber", hover: "hover:border-brand-amber hover:bg-amber-50 text-amber-700" },
    { key: "estudiante", label: "Estudiante", dot: "bg-success", hover: "hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700" },
    { key: "padre", label: "Padre", dot: "bg-violet-500", hover: "hover:border-violet-500 hover:bg-violet-50 text-violet-700" },
  ];

  return (
    <div className="flex-1 flex min-h-screen bg-background">
      {/* Left panel - Branding (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-brand-navy flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-brand-red/20 rounded-full" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-white/5 rounded-full" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 border border-white/20 p-5 rounded-2xl">
              <GraduationCap className="h-12 w-12 text-brand-amber" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Cognitor</h1>
          <div className="h-1 w-16 bg-brand-red rounded-full mx-auto mb-4" />
          <p className="text-slate-200 text-sm leading-relaxed">
            Plataforma Educativa Inteligente para Colegios Privados
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {roles.map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <div className="bg-white/10 w-8 h-8 rounded-full flex items-center justify-center mb-2">
                  <item.icon className="h-4 w-4 text-brand-amber" />
                </div>
                <p className="text-white font-semibold text-xs">{item.title}</p>
                <p className="text-slate-300 text-[10px] mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="bg-brand-navy p-2.5 rounded-xl">
              <GraduationCap className="h-6 w-6 text-brand-amber" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-brand-navy">Cognitor</h1>
              <p className="text-[10px] text-text-secondary">Plataforma Educativa</p>
            </div>
          </div>

          {/* Mobile roles accordion */}
          <div className="lg:hidden mb-6">
            <button
              type="button"
              onClick={() => setRolesOpen(!rolesOpen)}
              className="w-full flex items-center justify-between bg-brand-navy/5 border border-brand-navy/10 rounded-xl px-4 py-3 text-sm font-semibold text-brand-navy"
            >
              <span>4 roles en una plataforma</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${rolesOpen ? "rotate-180" : ""}`} />
            </button>
            {rolesOpen && (
              <div className="mt-2 grid grid-cols-2 gap-2 fade-in">
                {roles.map((item) => (
                  <div key={item.title} className="bg-white border border-border-subtle rounded-xl p-3">
                    <div className="bg-brand-navy/10 w-7 h-7 rounded-full flex items-center justify-center mb-1.5">
                      <item.icon className="h-3.5 w-3.5 text-brand-navy" />
                    </div>
                    <p className="text-xs font-semibold text-text-primary">{item.title}</p>
                    <p className="text-[10px] text-text-secondary">{item.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-surface rounded-2xl shadow-lg border border-border-subtle p-6 md:p-8 fade-in">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-text-primary">Iniciar Sesión</h2>
              <p className="text-sm text-text-secondary mt-1.5">
                Ingresa tus credenciales institucionales para continuar.
              </p>
            </div>

            {error && (
              <div
                className={`mb-5 p-3.5 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  errorType === "network"
                    ? "bg-amber-50 border border-amber-200 text-amber-800"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
                role="alert"
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    errorType === "network" ? "bg-warning" : "bg-danger"
                  }`}
                />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Correo Institucional
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    type="email"
                    required
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@colegio.edu.pe"
                    className="w-full bg-slate-50 border border-border-subtle focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 rounded-xl py-3 pl-10 pr-4 text-text-primary placeholder-slate-400 focus:outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-xs font-semibold text-text-secondary uppercase tracking-wider mb-1.5">
                  Contraseña
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-3 flex items-center text-slate-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-50 border border-border-subtle focus:border-brand-navy focus:ring-2 focus:ring-brand-navy/10 rounded-xl py-3 pl-10 pr-10 text-text-primary placeholder-slate-400 focus:outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                    aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                id="btn-login"
                loading={loading}
                className="w-full mt-2"
                icon={<ShieldCheck className="h-4 w-4" />}
              >
                {loading ? "Validando credenciales..." : "Ingresar al Sistema"}
              </Button>
            </form>

            {DEMO_MODE && (
              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-center text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-3">
                  Accesos de Prueba
                </p>
                <div className="grid grid-cols-4 gap-2">
                  {quickAccess.map((q) => (
                    <button
                      key={q.key}
                      id={`btn-prefill-${q.key}`}
                      onClick={() => handlePrefill(q.key)}
                      className={`bg-slate-50 border border-border-subtle ${q.hover} rounded-xl py-2.5 text-xs font-semibold cursor-pointer transition-all text-center flex flex-col items-center gap-1`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${q.dot}`} />
                      {q.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-5">
            © 2026 Cognitor · Plataforma Educativa Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}
