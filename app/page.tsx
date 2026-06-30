"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, Loader2, Eye, EyeOff, ShieldCheck } from "lucide-react";
import { Controller } from "@/lib/mvc/controller";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const user = Controller.login(email, password);
      const rol = user.rol;
      if (rol === "ADMIN") router.push("/admin");
      else if (rol === "DOCENTE") router.push("/docente");
      else if (rol === "ESTUDIANTE") router.push("/estudiante");
      else if (rol === "PADRE") router.push("/padre");
      else throw new Error("Rol de usuario no reconocido");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handlePrefill = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      admin:      { email: "admin@colegio.edu.pe",       password: "admin123" },
      docente:    { email: "juan.perez@colegio.edu.pe",  password: "docente123" },
      estudiante: { email: "pedrito@colegio.edu.pe",     password: "alumno123" },
      padre:      { email: "padre1@colegio.edu.pe",      password: "padre123" },
    };
    if (creds[role]) {
      setEmail(creds[role].email);
      setPassword(creds[role].password);
    }
  };

  const quickAccess = [
    { key: "admin",      label: "Admin",      color: "hover:border-[#0F2C59] hover:bg-blue-50 text-[#0F2C59]",   dot: "bg-[#0F2C59]" },
    { key: "docente",    label: "Docente",    color: "hover:border-amber-500 hover:bg-amber-50 text-amber-700",   dot: "bg-amber-500" },
    { key: "estudiante", label: "Estudiante", color: "hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700", dot: "bg-emerald-500" },
    { key: "padre",      label: "Padre",      color: "hover:border-violet-500 hover:bg-violet-50 text-violet-700",   dot: "bg-violet-500" },
  ];

  return (
    <div className="flex-1 flex min-h-screen bg-slate-100">
      {/* Left panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0F2C59] flex-col items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-[#A30000]/20 rounded-full" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-white/5 rounded-full" />

        <div className="relative z-10 text-center max-w-sm">
          <div className="flex justify-center mb-6">
            <div className="bg-white/10 border border-white/20 p-5 rounded-2xl">
              <GraduationCap className="h-12 w-12 text-amber-400" />
            </div>
          </div>
          <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">Cognitor</h1>
          <div className="h-1 w-16 bg-[#A30000] rounded-full mx-auto mb-4" />
          <p className="text-slate-300 text-sm leading-relaxed">
            Plataforma Educativa Inteligente para Colegios Privados
          </p>

          <div className="mt-10 grid grid-cols-2 gap-3 text-left">
            {[
              { icon: "👨‍🏫", title: "Docentes", desc: "Gestiona tareas y sílabos" },
              { icon: "🎓", title: "Alumnos", desc: "Accede a tus actividades" },
              { icon: "👪", title: "Padres", desc: "Seguimiento en tiempo real" },
              { icon: "🏫", title: "Admins", desc: "Control institucional" },
            ].map((item) => (
              <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl p-3">
                <p className="text-xl mb-1">{item.icon}</p>
                <p className="text-white font-semibold text-xs">{item.title}</p>
                <p className="text-slate-400 text-[10px] mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          {/* Logo (mobile) */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="bg-[#0F2C59] p-2.5 rounded-xl">
              <GraduationCap className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#0F2C59]">Cognitor</h1>
              <p className="text-[10px] text-slate-500">Plataforma Educativa</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8 fade-in">
            <div className="mb-7">
              <h2 className="text-2xl font-extrabold text-slate-900">Iniciar Sesión</h2>
              <p className="text-sm text-slate-500 mt-1.5">Ingresa tus credenciales institucionales para continuar.</p>
            </div>

            {/* Error */}
            {error && (
              <div className="mb-5 p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-red-500 rounded-full shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F2C59] focus:ring-2 focus:ring-[#0F2C59]/10 rounded-xl py-3 pl-10 pr-4 text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">
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
                    className="w-full bg-slate-50 border border-slate-200 focus:border-[#0F2C59] focus:ring-2 focus:ring-[#0F2C59]/10 rounded-xl py-3 pl-10 pr-10 text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                id="btn-login"
                disabled={loading}
                className="w-full bg-[#0F2C59] hover:bg-[#143d7c] active:scale-[0.98] text-white font-bold rounded-xl py-3 text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#0F2C59]/20 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Validando credenciales...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Ingresar al Sistema
                  </>
                )}
              </button>
            </form>

            {/* Quick Access */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <p className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">
                Accesos de Prueba
              </p>
              <div className="grid grid-cols-4 gap-2">
                {quickAccess.map((q) => (
                  <button
                    key={q.key}
                    id={`btn-prefill-${q.key}`}
                    onClick={() => handlePrefill(q.key)}
                    className={`bg-slate-50 border border-slate-200 ${q.color} rounded-xl py-2.5 text-xs font-bold cursor-pointer transition-all text-center flex flex-col items-center gap-1`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${q.dot}`} />
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-[11px] text-slate-400 mt-5">
            © 2026 Cognitor · Plataforma Educativa Inteligente
          </p>
        </div>
      </div>
    </div>
  );
}
