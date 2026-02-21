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
| `id` | `string` | Sí | EL ID único del bot (ej: `demo` o ID de Supabase). |
| `metadata` | `object` | No | Objeto con datos extra (UTMs, usuario logueado, etc) que se envían al webhook. |
| `sessionId` | `string` | No | Fuerza un ID de sesión externo. Si no se provee, se genera uno persistente. |
| `container` | `HTMLElement` | No | Elemento donde se renderizará el chat. Por defecto crea uno en el `body`. |

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
  metadata?: Record<string, any>;
  sessionId?: string;
  container?: HTMLElement;
  supabaseUrl?: string;
  supabaseKey?: string;
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
  metadata?: Record<string, any>;
  sessionId?: string;
}

const LexFlowWidget = ({ botId, metadata, sessionId }: LexFlowWidgetProps) => {
  useEffect(() => {
    // 1. Cargar el script asíncronamente
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.iife.js";
    script.async = true;

    script.onload = () => {
      if (window.LexFlow) {
        window.LexFlow.init({ 
          id: botId,
          metadata,
          sessionId 
        });
      }
    };

    document.body.appendChild(script);

    return () => {
      // Limpieza (opcional)
      document.body.removeChild(script);
    };
  }, [botId, metadata, sessionId]);

  return null; // El widget se inyecta por fuera del árbol normal de React
};

export default LexFlowWidget;
```

---

## 🚀 ¿Qué recibe el Webhook?

Cuando el usuario interactúa, tu webhook recibirá los metadatos inyectados dentro del campo `metadata`. Esto es ideal para rastrear el origen de los leads:

```json
{
  "text": "mensaje del usuario",
  "sessionId": "...",
  "clientId": "...",
  "metadata": {
    "source": "facebook_ads",
    "campaign": "invierno_2024",
    "url": "https://tusitio.com/?utm_source=...",
    "timestamp": "2024-02-21T..."
  }
}
```

### 3. Agregar el CSS en `main.tsx` o `index.html`
Importa el estilo globalmente:
```typescript
// En tu main.tsx de React
import 'https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.css';
```

---

## � Troubleshooting & Tips

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

## 🔐 Seguridad y RLS (Row Level Security)

Es totalmente seguro usar este repositorio como **Público** y exponer la `anon_key` de Supabase, ya que hemos implementado políticas de **RLS** estrictas:

*   **Configuraciones (`lexflow_configs`)**: Solo permite acceso de lectura (`SELECT`) a través del rol público. Nadie puede editar o borrar configuraciones desde el cliente.
*   **Leads y Mensajes**: Están protegidos. Aunque alguien tenga tu URL de Supabase, no podrá leer los mensajes de otros usuarios ni extraer la lista de leads, ya que estas tablas requieren autenticación de administrador o están bloqueadas para lectura pública.
*   **Insertar Datos**: Solo se permite la inserción de eventos de analítica y feedback de forma anónima para que el motor funcione, pero nunca la lectura masiva de estos datos.

---

