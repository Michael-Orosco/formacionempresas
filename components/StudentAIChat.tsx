"use client";

import { useEffect, useRef, useState } from "react";
import { Bot, Send, Sparkles, X, Loader2, MessageCircle } from "lucide-react";
import { Controller } from "@/lib/mvc/controller";
import { logger } from "@/lib/logger";
import { Button } from "@/components/ui/Button";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export function StudentAIChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const handleOpen = () => {
    setOpen(true);
    if (messages.length === 0) {
      const user = Controller.getCurrentUser();
      const firstName = user?.nombre.split(" ")[0] || "";
      setMessages([
        {
          role: "assistant",
          content: `¡Hola${firstName ? " " + firstName : ""}! Soy tu asistente académico de Cognitor. Pregúntame sobre tus tareas, cursos, horario o anuncios recientes.`,
        },
      ]);
    }
  };

  const handleSend = async () => {
    const texto = input.trim();
    if (!texto || loading) return;

    const user = Controller.getCurrentUser();
    if (!user) return;

    const nuevosMensajes: ChatMessage[] = [...messages, { role: "user", content: texto }];
    setMessages(nuevosMensajes);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const data = Controller.getEstudianteDashboardData(user.id);
      const contexto = {
        nombre: user.nombre,
        cursos: data.matriculas.map((c) => ({ nombre: c.nombre, docente: c.docente.nombre })),
        tareas: data.tareas.map((t) => ({
          titulo: t.titulo,
          curso: t.curso.nombre,
          fechaEntrega: t.fechaEntrega,
          estado: t.estado,
        })),
        silabos: data.silabos.map((s) => ({ curso: s.curso.nombre, semana: s.semana, tema: s.tema })),
        anuncios: data.anuncios.map((a) => ({
          curso: a.curso.nombre,
          mensaje: a.mensaje,
          fechaPublicacion: a.fechaPublicacion,
          docente: a.docente,
        })),
      };

      Controller.registrarActividad(user.id, null, "CHAT_IA_PREGUNTA");

      const res = await fetch("/api/ia/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nuevosMensajes, contexto }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error al consultar al asistente.");

      setMessages((prev) => [...prev, { role: "assistant", content: json.respuesta }]);
    } catch (err) {
      logger.error("Error en chat IA del estudiante", err);
      setError(err instanceof Error ? err.message : "No se pudo contactar al asistente.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div
      style={{ position: "fixed", bottom: "1.25rem", right: "1.25rem", left: "auto", top: "auto" }}
      className="z-40"
    >
      {!open ? (
        <button
          type="button"
          onClick={handleOpen}
          className="bg-brand-navy hover:bg-brand-navy-light text-white p-4 rounded-full shadow-lg shadow-brand-navy/30 flex items-center justify-center transition-all active:scale-95"
          aria-label="Abrir asistente académico"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      ) : (
        <div
          style={{
            width: "min(92vw, 380px)",
            height: "min(75vh, 520px)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: "1rem",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.35)",
          }}
          className="bg-white border border-border-subtle fade-in"
        >
          <div className="bg-brand-navy text-white px-4 py-3 flex items-center justify-between border-b-4 border-brand-red shrink-0">
            <div className="flex items-center gap-2">
              <div className="bg-white/10 border border-white/20 p-1.5 rounded-lg text-brand-amber">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-bold leading-none">Asistente Académico</p>
                <p className="text-[10px] text-slate-300 mt-0.5 flex items-center gap-1">
                  <Sparkles className="h-2.5 w-2.5 text-brand-amber" /> Cognitor IA
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-slate-300 hover:text-white transition-colors"
              aria-label="Cerrar asistente"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div
            ref={scrollRef}
            style={{ flex: "1 1 auto", minHeight: 0, overflowY: "auto" }}
            className="px-4 py-3 space-y-3 bg-slate-50"
          >
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-brand-navy text-white rounded-br-sm"
                      : "bg-white border border-border-subtle text-text-primary rounded-bl-sm"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-white border border-border-subtle text-text-secondary px-3 py-2 rounded-xl rounded-bl-sm flex items-center gap-1.5 text-xs">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Pensando…
                </div>
              </div>
            )}
            {error && (
              <p className="text-[11px] text-danger font-medium text-center">{error}</p>
            )}
          </div>

          <div className="p-3 border-t border-border-subtle bg-white shrink-0 flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pregunta sobre tus tareas, cursos, horario…"
              disabled={loading}
              className="flex-1 min-w-0 text-xs px-3 py-2.5 rounded-xl border border-border-subtle focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy/40 disabled:opacity-60"
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={loading || !input.trim()}
              icon={<Send className="h-3.5 w-3.5" />}
              className="shrink-0 p-2.5"
            />
          </div>
        </div>
      )}
    </div>
  );
}
