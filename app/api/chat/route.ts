import { NextResponse } from "next/server";

/**
 * Módulo 6 (IA / Asistente Virtual) — Deshabilitado.
 * Este endpoint ha sido retirado de la versión actual de Cognitor.
 * Será reimplementado en Módulo 7.
 */
export async function POST() {
  return NextResponse.json(
    { error: "El asistente virtual no está disponible en esta versión." },
    { status: 503 }
  );
}
