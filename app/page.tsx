"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Lock, Mail, Loader2, Sparkles, BookOpen } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Algo salió mal");
      }

      // Redirigir según el rol retornado
      const rol = data.user.rol;
      if (rol === "ADMIN") {
        router.push("/admin");
      } else if (rol === "DOCENTE") {
        router.push("/docente");
      } else if (rol === "ESTUDIANTE") {
        router.push("/estudiante");
      } else {
        throw new Error("Rol desconocido");
      }
    } catch (err: any) {
      setError(err.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  const handlePrefill = (role: string) => {
    if (role === "admin") {
      setEmail("admin@colegio.edu.pe");
      setPassword("admin123");
    } else if (role === "docente") {
      setEmail("juan.perez@colegio.edu.pe");
      setPassword("docente123");
    } else if (role === "estudiante") {
      setEmail("pedrito@colegio.edu.pe");
      setPassword("alumno123");
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 bg-slate-100 min-h-screen">
      
      {/* Contenedor principal con diseño institucional */}
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
        
        {/* Franja Superior Institucional */}
        <div className="bg-[#0F2C59] px-6 py-5 text-white flex items-center justify-between border-b-4 border-[#A30000]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg text-amber-400">
              <GraduationCap className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-wide uppercase leading-tight">
                EduControl
              </h1>
              <p className="text-[10px] text-slate-300 font-medium">
                PORTAL ACADÉMICO
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="p-8">
          <div className="text-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center justify-center gap-1.5">
              Iniciar Sesión
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Ingresa tus credenciales institucionales para acceder.
            </p>
          </div>

          {/* Alerta de Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs text-center font-medium">
              {error}
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            
            {/* Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Correo Institucional
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@colegio.edu.pe"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-300 focus:border-[#0F2C59] focus:ring-1 focus:ring-[#0F2C59] rounded-lg py-2.5 pl-9 pr-3 text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                />
              </div>
            </div>

            {/* Botón Ingresar */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F2C59] hover:bg-[#143d7c] text-white font-semibold rounded-lg py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#0F2C59] active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-slate-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Validando credenciales...
                </>
              ) : (
                "Ingresar al Sistema"
              )}
            </button>
          </form>

          {/* Acceso Rápido para Pruebas (Prefills) */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-center text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">
              Accesos de Prueba Autorizados
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => handlePrefill("admin")}
                className="bg-slate-50 border border-slate-200 hover:border-[#0F2C59] hover:bg-slate-100/50 text-[#0F2C59] rounded-lg py-2 text-xs font-semibold cursor-pointer transition-all text-center"
              >
                Administrador
              </button>
              <button
                onClick={() => handlePrefill("docente")}
                className="bg-slate-50 border border-slate-200 hover:border-amber-500 hover:bg-slate-100/50 text-amber-700 rounded-lg py-2 text-xs font-semibold cursor-pointer transition-all text-center"
              >
                Docente
              </button>
              <button
                onClick={() => handlePrefill("estudiante")}
                className="bg-slate-50 border border-slate-200 hover:border-emerald-600 hover:bg-slate-100/50 text-emerald-700 rounded-lg py-2 text-xs font-semibold cursor-pointer transition-all text-center"
              >
                Estudiante
              </button>
            </div>
          </div>

        </div>
      </div>
      
      {/* Footer de la página */}
      <div className="mt-6 text-center text-[11px] text-slate-500">
        <p>© 2026 EduControl</p>
        <p className="mt-0.5">Gestión Escolar Inteligente PWA</p>
      </div>

    </div>
  );
}
