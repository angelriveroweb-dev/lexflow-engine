# N8N Chatbot Integration Guide

## 🚀 Overview

El chatbot "Recepcionista AI v1.3 [DEV]" está disponible via **Netlify CDN** y se integra con n8n para orquestar:
- **Consultas generales** (con IA + Knowledge Base RAG)
- **Agendar citas** (Google Calendar)
- **Consultas sobre cobro** (MercadoPago link)

---

## 📋 Parámetros de Landing Pages

### URL de Integración (Netlify)

```
https://lexflow-engine.netlify.app/lexflow.iife.js
```

### Parámetros por Query String

Las landing pages pueden pasar parámetros al chatbot mediante query strings o como datos POST. El chatbot capturará:

| Parámetro | Tipo | Requerido | Descripción | Ejemplo |
|-----------|------|-----------|-------------|---------|
| `client_id` | UUID | ✅ | ID del cliente/negocio en Supabase | `550e8400-e29b-41d4-a716-446655440000` |
| `visitor_id` | UUID | ❌ | ID único del visitante (si no existe, se genera) | `f47ac10b-58cc-4372-a567-0e02b2c3d479` |
| `service` | string | ❌ | Tipo de consulta predefinida | `consulta`, `agendar`, `cobro` |
| `session_id` | string | ❌ | ID de sesión para historial | `sess_123456` |
| `calendar_id` | string | ❌ | ID del calendario de Google Calendar | `c_xxxxx@group.calendar.google.com` |

---

## 🔧 Configuración en SaaS Settings

Para que el chatbot funcione correctamente, el cliente debe configurar en su panel:

### saas_settings (Supabase)

| Campo | Tipo | Descripción | Ejemplo |
|-------|------|-------------|---------|
| `client_id` | UUID | Identifica al cliente | Automático |
| `payment_link` | text | Link de pago en MercadoPago | `https://payment.mp/consulta-abogado` |
| `consultation_price` | numeric | Precio de la consulta en $AR | `500.00` |
| `notification_email` | email | Email del dueño para notificaciones | `owner@escobar.com.ar` |
| `whatsapp_number` | text | Teléfono WhatsApp del dueño | `+541234567890` |
| `phone_number` | text | Teléfono adicional | `+541234567890` |
| `bot_active` | boolean | Activa/desactiva el chatbot | `true` |

---

## 🎯 Flujo de Intenciones

### 1️⃣ Consulta General (default)

**Cuando**: El usuario pregunta sobre servicios, leyes o requisitos
**Qué sucede**:
- El Agente IA responde usando knowledge_base (RAG)
- Se actualiza `ai_consultations` con la interacción
- Historial se guarda en `n8n_chat_histories`

**Respuesta esperada**:
```json
{
  "text": "Para casos de divorcio, el procedimiento es...",
  "suggestions": ["Consultar Precio", "Agendar Cita", "Más info"],
  "action": "general_inquiry",
  "confidence": 0.92
}
```

---

### 2️⃣ Agendar Cita

**Cuando**: Usuario dice "agendar", "cita", "disponibilidad", etc.
**Parámetros necesarios**:
- `date`: Fecha elegida (YYYY-MM-DD)
- `time`: Hora (HH:MM)
- `userName`: Nombre del cliente
- `userEmail`: Email del cliente

**Qué sucede**:
1. Valida disponibilidad en Google Calendar
2. Crea evento en calendario del cliente
3. Actualiza `leads.status = 'scheduled'`
4. Notifica al dueño (WhatsApp/Email)
5. Retorna confirmación

**Endpoint n8n**: `/webhook/schedule-consultation`

**Payload**:
```json
{
  "body": {
    "action": "user_message",
    "clientId": "550e8400-e29b-41d4-a716-446655440000",
    "visitorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "date": "2026-02-28",
    "time": "10:00",
    "userName": "Juan García",
    "userEmail": "juan@example.com"
  }
}
```

---

### 3️⃣ Consulta sobre Cobro/Precio

**Cuando**: Usuario pregunta "precio", "costo", "cuánto cuesta", etc.
**Qué sucede**:
1. Lee `consultation_price` y `payment_link` de saas_settings
2. Envía link de pago al cliente
3. Actualiza `leads.status = 'payment_pending'`
4. Notifica al dueño con detalles del lead

**Endpoint n8n**: `/webhook/payment-inquiry`

**Payload**:
```json
{
  "body": {
    "action": "user_message",
    "clientId": "550e8400-e29b-41d4-a716-446655440000",
    "visitorId": "f47ac10b-58cc-4372-a567-0e02b2c3d479",
    "leadName": "María López",
    "leadEmail": "maria@example.com"
  }
}
```

---

## 📲 Ejemplos de Landing Pages

### Ejemplo 1: Landing Simple sin Parámetros
```html
<html>
  <body>
    <h1>Consulta Jurídica Online</h1>
    <div id="chatbot-container"></div>

    <script>
      window.chatbotConfig = {
        clientId: '550e8400-e29b-41d4-a716-446655440000',
        webhookUrl: 'https://n8n-instance.com/webhook/chat'
      };
    </script>
    <script src="https://lexflow-engine.netlify.app/lexflow.iife.js"></script>
  </body>
</html>
```

### Ejemplo 2: Landing con Parámetros (desde URL)
```
https://landing.escobar.com.ar/consulta?client_id=550e8400-e29b-41d4-a716-446655440000&visitor_id=f47ac10b-58cc-4372-a567-0e02b2c3d479&service=consulta
```

El chatbot capturará estos parámetros automáticamente.

### Ejemplo 3: Landing con Precarga de Intención
```html
<script>
  window.chatbotConfig = {
    clientId: '550e8400-e29b-41d4-a716-446655440000',
    initialMessage: '¿Necesitas agendar una consulta?',
    service: 'agendar', // Precarga el flujo de agendamiento
    prefilledName: 'Cliente Anónimo'
  };
</script>
```

---

## 🔐 Seguridad

### CORS
El webhook está configurado con `allowedOrigins: "*"` pero recomendamos restringir a dominios específicos.

### RLS (Row Level Security)
- Todas las tablas tienen RLS habilitado
- Los datos se filtran por `client_id`
- No hay acceso cross-client

### Validaciones
- El `client_id` se valida en cada request
- El `visitor_id` debe ser UUID válido (si no, se reemplaza con null UUID)
- Los datos sensibles (payment_link, whatsapp_number) solo se leen en n8n

---

## 📊 Monitoreo

### Tablas clave para analytics
- `leads`: Estado y resumen de cada lead
- `ai_consultations`: Detalles de cada interacción IA
- `n8n_chat_histories`: Historial de mensajes por sesión
- `analytics_events`: Evento de página + visitor_id

---

## 🚨 Estados Posibles de Lead

```
'new' → Estado inicial
'contacted' → El agente contactó al lead
'closed' → Consulta finalizada
'paid' → El lead pagó
'scheduled' → Cita agendada (NUEVO)
'payment_pending' → Pendiente de pago (NUEVO)
```

---

## 🔄 Flujo Completo (Ejemplo)

1. **Usuario llega a landing**: `https://landing.com/?client_id=xxx&visitor_id=yyy`
2. **Abre chatbot**: Se carga desde jsDelivr
3. **Usuario pregunta**: "Hola, quiero agendar una cita para divorcio"
4. **Agente detecta**: `intention: "schedule_appointment"`
5. **Sistema ejecuta**: Subworkflow "Agendar Consulta [DEV]"
6. **Resultado**:
   - Evento creado en Google Calendar
   - Lead actualizado con `status: 'scheduled'`
   - Dueño notificado por WhatsApp
   - Usuario recibe confirmación en chat

---

## 📞 Soporte

Para dudas sobre integración:
1. Revisa la documentación de [n8n workflows](./WORKFLOWS.md)
2. Consulta la [estructura de Supabase](./DB_SCHEMA.md)
3. Contacta al equipo de desarrollo

---

**Última actualización**: 28/02/2026
**Versión**: 1.3.2
**Estado**: ✅ Production Ready (Netlify CDN)
