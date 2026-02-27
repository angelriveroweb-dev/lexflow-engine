# LexFlow Engine 🚀

El motor core de LexFlow diseñado para ser integrado en cualquier sitio web mediante un CDN.

## 📦 Uso vía CDN (JSDelivr)

### 1. Agregar Estilos
Añade el CSS en el `<head>` de tu sitio:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.css">
```

### 2. Inicializar el Widget
Carga el JS y llama al método `init`:

```html
<script src="https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.iife.js"></script>
<script>
  window.addEventListener('load', () => {
    if (window.LexFlow) {
      window.LexFlow.init({ id: 'TU_BOT_ID' });
    }
  });
</script>
```

---

## ⚙️ Parámetros de Inicialización (`LexFlow.init`)

| Parámetro | Tipo | Requerido | Descripción |
| :--- | :--- | :---: | :--- |
| `id` | `string` | Sí | EL ID único del bot (ej: `demo`). |
| `metadata` | `object` | Sí | Objeto con datos extra. **Importante:** Incluye `clientId` y `visitorId` aquí si quieres que coincidan con tu sistema externo. |
| `webhookUrl` | `string` | Sí | URL del webhook de n8n. |
| `sessionId` | `string` | Sí | ID de sesión externo. Si no se provee, se genera uno persistente. |
| `container` | `HTMLElement` | No | Elemento para renderizar el chat. |

---

## 🏗️ Estructura de Configuración (Supabase)

Si usas una base de datos propia, la tabla `lexflow_configs` debe tener estos campos para personalizar el UI sin tocar código:

| Campo (DB) | Descripción |
| :--- | :--- |
| `id` | ID único del bot coincidente con el del `init`. |
| `bot_name` | Nombre interno del bot. |
| `ui_title` | Título que aparece en la cabecera del chat. |
| `ui_subtitle` | Subtítulo (ej: "Online"). |
| `ui_avatar_url` | Imagen de perfil del asistente. |
| `ui_primary_color` | Color principal para botones y launcher (ej: `#0f3460`). |
| `ui_gradient` | Clase CSS de Tailwind para el fondo (ej: `from-[#0f3460] to-[#1a1a2e]`). |
| `ui_launcher_label` | Texto del botón flotante. |
| `launcher_messages` | Array de mensajes rotativos para el "hook" flotante. |
| `footer_text` | Texto legal o informativo al pie del chat. |
| `msg_welcome` | Mensaje inicial del bot. |
| `msg_suggestions` | Array de botones de respuesta rápida. |
| `feat_voice` | Boolean para activar mensajes de voz. |
| `feat_files` | Boolean para permitir carga de archivos. |
| `feat_calendar` | Boolean para habilitar reserva de citas. |

---

## ⚛️ Integración en Vite + React + TypeScript

Para usar LexFlow en proyectos modernos de React con TypeScript, sigue este patrón:

### 1. Definir Tipos (Opcional pero recomendado)
Crea o añade a tu archivo de tipos (ej: `types.d.ts` o `globals.d.ts`):

```typescript
interface LexFlowOptions {
  id: string;
  metadata: Record<string, any> & {
    clientId?: string;
    visitorId?: string;
  };
  webhookUrl: string;
  sessionId?: string;
  container?: HTMLElement;
}

interface Window {
  LexFlow: {
    init: (options: LexFlowOptions) => Promise<void>;
  };
}
```

### 2. Crear el Componente Wrapper
Crea un archivo `LexFlowWidget.tsx`:

```tsx
import { useEffect } from 'react';

interface LexFlowWidgetProps {
  botId: string;
  metadata: Record<string, any>;
  webhookUrl: string;
  sessionId?: string;
}

const LexFlowWidget = ({ botId, metadata, sessionId, webhookUrl }: LexFlowWidgetProps) => {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.iife.js";
    script.async = true;

    script.onload = () => {
      if (window.LexFlow) {
        window.LexFlow.init({ 
          id: botId,
          metadata, // Pasa aquí el clientId y visitorId de tu landing
          sessionId,
          webhookUrl 
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [botId, metadata, sessionId]);

  return null;
};

export default LexFlowWidget;
```

---

## 🚀 ¿Qué recibe el Webhook?

El motor envía un `POST` con formato `multipart/form-data`. La estructura del body es la siguiente:

```json
{
  "sessionId": "c0f76658-6f4c-4f34",
  "text": "Consultar Precio",
  "clientId": "30727c70-d179-4f1d",
  "visitorId": "1b66d202-5396-45c1",
  "action": "user_message", // O 'user_abandoned_page', 'file_upload'
  "metadata": "{\"clientId\":\"...\", \"visitorId\":\"...\", \"url\":\"...\", \"timestamp\":\"...\"}"
}
```

> **Nota:** El campo `metadata` se envía como un **String JSON** para asegurar la compatibilidad con flujos de n8n que esperan ese formato específico. Los campos `clientId` y `visitorId` dentro de `metadata` se sincronizan automáticamente con lo que pases en el `init`.


### 3. Agregar el CSS en `main.tsx` o `index.html`
Importa el estilo globalmente:
```typescript
// En tu main.tsx de React
import 'https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.css';
```

---

## 🛠️ Desarrollo y Despliegue

### 1. Actualización del CDN
Para que los cambios se reflejen instantáneamente en todos los sitios de los clientes (evitando la caché de 24hs de jsDelivr), sigue este flujo:

1. Realiza tus cambios y haz el build: `npm run build`
2. Haz push a la rama `main`: `git push origin main`
3. **Limpia la caché del CDN**:
   ```bash
   npm run clear-cache
   ```

Este comando utiliza la Purge API de jsDelivr para invalidar los archivos en la rama `@main` de forma inmediata.

---

## 🛠️ Troubleshooting & Tips

### 1. El widget no aparece
*   **Caché de JSDelivr:** Si acabas de hacer un push, JSDelivr puede tardar en actualizar. Prueba forzar la actualización usando un parámetro: `...lexflow.iife.js?v=refresh`.
*   **Z-Index:** El widget usa `z-[9999]` para el launcher y `z-[10000]` para la ventana. Verifica que tus componentes no lo estén tapando.
*   **Init manual:** Asegúrate de que el botId coincida exactamente con el de Supabase o usa `'demo'` para pruebas.

### 2. Cursor Customizado (Importante) 🖱️
Si tu proyecto tiene un cursor personalizado que sigue al mouse:
*   El chat tiene un `z-index` de hasta `10000`. Asegúrate de que tu cursor tenga un `z-index` de **10001** o superior para que no desaparezca al pasar sobre el chat.
*   Agrega `pointer-events: none` a tu componente de cursor para que el usuario pueda cliquear los elementos del chat sin interferencias.

### 3. Integración en Vite
Al usar el CDN en un proyecto Vite, a veces los imports de CSS vía URL pueden fallar dependiendo de la configuración. Se recomienda agregarlo directamente en el `index.html`:
```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.css">
```

---
