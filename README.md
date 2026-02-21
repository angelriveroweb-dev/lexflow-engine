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
| `container` | `HTMLElement` | No | Elemento donde se renderizará el chat. Por defecto crea uno en el `body`. |
| `supabaseUrl` | `string` | No | URL de tu instancia de Supabase (si no está embebida). |
| `supabaseKey` | `string` | No | Anon Key de tu Supabase (si no está embebida). |

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
}

const LexFlowWidget = ({ botId }: LexFlowWidgetProps) => {
  useEffect(() => {
    // 1. Cargar el script asíncronamente
    const script = document.createElement('script');
    script.src = "https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.iife.js";
    script.async = true;

    script.onload = () => {
      if (window.LexFlow) {
        window.LexFlow.init({ id: botId });
      }
    };

    document.body.appendChild(script);

    return () => {
      // Limpieza (opcional)
      document.body.removeChild(script);
    };
  }, [botId]);

  return null; // El widget se inyecta por fuera del árbol normal de React
};

export default LexFlowWidget;
```

### 3. Agregar el CSS en `main.tsx` o `index.html`
Importa el estilo globalmente:
```typescript
// En tu main.tsx de React
import 'https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.css';
```

---

## 🛠️ Desarrollo Local
1. `npm install`
2. Configurar `.env.local`
3. `npm run dev` para previsualizar.
4. `npm run build` para generar la carpeta `dist/`.

## 🚀 Despliegue
Al hacer `git push origin main`, los cambios se reflejan automáticamente en el CDN de JSDelivr:
`https://cdn.jsdelivr.net/gh/angelriveroweb-dev/lexflow-engine@main/dist/lexflow.iife.js`

---
Desarrollado con ❤️ para Escobar & Asociados.
