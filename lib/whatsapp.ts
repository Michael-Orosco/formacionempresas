/**
 * Servicio encapsulado para el envío de mensajes de WhatsApp
 * Soporta integración con WATI y Twilio a través de variables de entorno.
 */
export async function sendWhatsAppMessage(phone: string, message: string): Promise<{ success: boolean; response?: any; error?: string }> {
  const apiKey = process.env.WHATSAPP_API_KEY;
  const provider = process.env.WHATSAPP_PROVIDER || 'WATI'; // 'WATI' o 'TWILIO'
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER; // Número emisor de Twilio

  // Limpiar número telefónico (quitar espacios, guiones y asegurar formato internacional)
  const cleanPhone = phone.replace(/[+\s-]/g, '');

  console.log(`[WhatsApp Service] Intentando enviar mensaje a ${cleanPhone} vía ${provider}...`);
  console.log(`[WhatsApp Service] Mensaje: "${message}"`);

  // Si no hay API Key configurada, operamos en modo simulación (útil para desarrollo)
  if (!apiKey && provider === 'WATI') {
    console.log('[WhatsApp Service][SIMULACIÓN] WHATSAPP_API_KEY no definida. Simulando envío exitoso.');
    return { success: true, response: { status: 'SIMULATED', messageId: 'sim_' + Math.random().toString(36).substring(7) } };
  }

  if (provider === 'TWILIO' && (!twilioSid || !apiKey || !twilioFrom)) {
    console.log('[WhatsApp Service][SIMULACIÓN] Credenciales de Twilio incompletas. Simulando envío exitoso.');
    return { success: true, response: { status: 'SIMULATED', messageId: 'sim_' + Math.random().toString(36).substring(7) } };
  }

  try {
    if (provider === 'TWILIO') {
      // Configuración de Twilio (API de mensajería SMS/WhatsApp)
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const basicAuth = Buffer.from(`${twilioSid}:${apiKey}`).toString('base64');
      
      const formData = new URLSearchParams();
      // Para WhatsApp en Twilio, el formato es 'whatsapp:+123456789'
      formData.append('To', `whatsapp:+${cleanPhone}`);
      formData.append('From', `whatsapp:${twilioFrom}`);
      formData.append('Body', message);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Error HTTP ${response.status}`);
      }

      return { success: true, response: data };
    } else {
      // Configuración por defecto: WATI API (Envío de Mensajes de Sesión o Plantilla)
      // WATI API Endpoint para mensajes personalizados (ejemplo estándar):
      // POST https://{your-wati-domain}/api/v1/sendSessionMessage/{phone}?messageText={text}
      const watiUrl = process.env.WHATSAPP_API_URL || 'https://api.wati.io/api/v1/sendSessionMessage';
      const urlWithParams = `${watiUrl}/${cleanPhone}?messageText=${encodeURIComponent(message)}`;

      const response = await fetch(urlWithParams, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'accept': '*/*',
        },
      });

      // Algunas API de WATI reciben JSON en el body en vez de URL params. Agregamos soporte para ambos
      if (!response.ok) {
        // Fallback: POST con JSON en el body
        const responseJsonFallback = await fetch(watiUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            phone: cleanPhone,
            messageText: message,
          }),
        });

        const data = await responseJsonFallback.json();
        if (!responseJsonFallback.ok) {
          throw new Error(data.message || `WATI respondió con código ${responseJsonFallback.status}`);
        }
        return { success: true, response: data };
      }

      const data = await response.json();
      return { success: true, response: data };
    }
  } catch (error: any) {
    console.error(`[WhatsApp Service][ERROR] Error al enviar mensaje a ${phone}:`, error);
    return { success: false, error: error.message || String(error) };
  }
}
