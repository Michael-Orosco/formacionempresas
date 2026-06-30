import { NextResponse } from "next/server";
import { Groq } from "groq-sdk";

export async function POST(req: Request) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY || "dummy",
  });

  try {
    const payload = await req.json();

    const prompt = `
Eres un asistente de Inteligencia Artificial de la plataforma Cognitor.
Tu tarea es analizar el resumen de actividad de un estudiante y predecir su rendimiento.

Datos del alumno en el curso:
- Tareas publicadas en el curso: ${payload.tareas_publicadas}
- Tareas vistas por el alumno: ${payload.tareas_vistas}
- Total de interacciones en la plataforma: ${payload.total_interacciones}
- Nivel de riesgo calculado por heurística local: ${payload.riesgo_calculado_localmente}

Instrucciones:
1. Evalúa estos datos y estima una "nota_estimada" sobre 20.
2. Determina el "nivel_riesgo" ('BAJO', 'MEDIO' o 'ALTO').
3. Genera un "mensaje" breve (máximo 30 palabras) dirigido al padre de familia, explicando la situación.

DEBES responder ÚNICAMENTE con un JSON válido que tenga esta estructura exacta, sin texto adicional:
{
  "nota_estimada": number,
  "nivel_riesgo": "BAJO" | "MEDIO" | "ALTO",
  "mensaje": "string"
}
`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an API that only outputs raw valid JSON."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama3-8b-8192", // Modelo ligero y rápido de Groq
      temperature: 0.2, // Baja temperatura para mantener consistencia
      response_format: { type: "json_object" }
    });

    const aiResponse = completion.choices[0]?.message?.content;
    
    if (!aiResponse) {
      throw new Error("No response from Groq");
    }

    const parsedResponse = JSON.parse(aiResponse);
    return NextResponse.json(parsedResponse);
    
  } catch (error) {
    console.error("Error en API de predicción IA:", error);
    return NextResponse.json(
      { error: "Error interno en la predicción" },
      { status: 500 }
    );
  }
}
