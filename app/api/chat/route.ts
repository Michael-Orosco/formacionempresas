import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";

interface ChatContext {
  nombreEstudiante: string;
  cursos: { nombre: string; docente: string }[];
  tareas: { titulo: string; descripcion: string; fechaEntrega: string; estado: string; curso: string }[];
  silabos: { semana: number; tema: string; curso: string }[];
  anuncios: { mensaje: string; fechaPublicacion: string; curso: string; docente: string }[];
}

interface ChatRequestBody {
  messages: { role: "user" | "assistant"; content: string }[];
  context: ChatContext;
}

function buildSystemPrompt(context: ChatContext): string {
  const fecha = new Date().toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const cursosTexto = context.cursos.length
    ? context.cursos.map((c) => `- ${c.nombre} (docente: ${c.docente})`).join("\n")
    : "Sin cursos matriculados.";

  const tareasTexto = context.tareas.length
    ? context.tareas
        .map(
          (t) =>
            `- [${t.estado}] "${t.titulo}" (${t.curso}) — entrega: ${new Date(t.fechaEntrega).toLocaleString("es-PE")}. ${t.descripcion}`
        )
        .join("\n")
    : "Sin tareas registradas.";

  const silabosTexto = context.silabos.length
    ? context.silabos.map((s) => `- Semana ${s.semana} (${s.curso}): ${s.tema}`).join("\n")
    : "Sin sílabo registrado.";

  const anunciosTexto = context.anuncios.length
    ? context.anuncios
        .map((a) => `- (${a.curso}, por ${a.docente}, ${new Date(a.fechaPublicacion).toLocaleDateString("es-PE")}): ${a.mensaje}`)
        .join("\n")
    : "Sin avisos recientes.";

  return `Eres el asistente virtual del colegio dentro de la plataforma EduControl, dirigido exclusivamente a ${context.nombreEstudiante}, quien es estudiante.

Hoy es ${fecha}.

Responde SOLO sobre temas relacionados al colegio: sus clases, horarios, tareas, cursos, avisos de docentes y avance del sílabo. Si preguntan algo fuera de ese ámbito, indica amablemente que solo puedes ayudar con temas escolares.

Usa exclusivamente la siguiente información real del estudiante para responder (no inventes datos que no estén aquí):

CURSOS MATRICULADOS:
${cursosTexto}

TAREAS:
${tareasTexto}

AVANCE DE SÍLABO:
${silabosTexto}

AVISOS DE DOCENTES:
${anunciosTexto}

Sé breve, claro y cercano. Responde en español.`;
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequestBody = await request.json();
    const { messages, context } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Se requiere al menos un mensaje." }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "El asistente no está configurado todavía (falta GROQ_API_KEY)." },
        { status: 503 }
      );
    }

    const client = new Groq({ apiKey });

    const response = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      max_tokens: 1024,
      messages: [
        { role: "system", content: buildSystemPrompt(context) },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });

    return NextResponse.json({
      reply: response.choices[0]?.message?.content ?? "No pude generar una respuesta. Intenta de nuevo.",
    });
  } catch (error: unknown) {
    console.error("[/api/chat] Error:", error);
    return NextResponse.json({ error: "Ocurrió un error al consultar al asistente." }, { status: 500 });
  }
}
