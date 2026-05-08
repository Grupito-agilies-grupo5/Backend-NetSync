# Documentación Completa del Proyecto NetSync

**NetSync** es un prototipo académico de una plataforma web interactiva y social para el consumo sincronizado de contenido multimedia. Permite a los usuarios crear "salas virtuales" para ver películas y series simultáneamente con amigos, interactuando en tiempo real a través de chat y reacciones en vivo.

---

## 1. Stack Tecnológico

El proyecto está estructurado como una arquitectura cliente-servidor moderna:

**Frontend (Cliente):**
- **Framework:** React con TypeScript, construido con Vite.
- **Estilos:** Tailwind CSS con un diseño oscuro (Dark Mode), uso intensivo de "Glassmorphism" (interfaces de cristal) y micro-animaciones dinámicas.
- **Enrutamiento:** React Router DOM.
- **Tiempo Real:** `socket.io-client` para la comunicación bidireccional con el servidor.
- **Iconografía:** Lucide React.

**Backend (Servidor):**
- **Entorno:** Node.js con Express.
- **Lenguaje:** TypeScript.
- **Tiempo Real:** Socket.IO para manejar la sincronización de video y el chat en vivo.
- **Base de Datos:** Base de datos en memoria (`database.ts`) estructurada con mapas (Maps) para gestionar salas, usuarios conectados, métricas y calificaciones.

---

## 2. Flujo Principal del Usuario

1. **Creación de Sala (`/create`):** El usuario anfitrión (Host) selecciona un contenido de un catálogo predeterminado o utiliza la integración con **FM-DB (IMDb/TMDB)** para buscar una película real. El sistema le genera un código único de 6 caracteres.
2. **Unirse a una Sala (`/join`):** Los invitados introducen el código de la sala y su nombre para entrar.
3. **Experiencia en la Sala (`/room/:id`):** Los usuarios interactúan en la interfaz principal que incluye el reproductor de video, el chat lateral y el panel de usuarios conectados.
4. **Finalización y Feedback:** Al salir, los usuarios pueden dejar una calificación (1-5 estrellas) y un comentario sobre su experiencia técnica o la película.

---

## 3. Funcionalidades Implementadas

### A. Reproducción de Video Dual (Nativo vs. VidSrc)
NetSync incluye un sistema híbrido de reproducción de video manejado en `VideoPlayer.tsx`:

- **Modo Nativo (Sincronizado):** Utiliza la etiqueta `<video>` de HTML5 para reproducir videos de respaldo (cortos de dominio público como *Big Buck Bunny* o *Sintel*). En este modo, el **Host tiene control total**. Si el Host pausa, reproduce o adelanta el video, un evento de Socket.IO sincroniza automáticamente el tiempo de todos los invitados en la sala.
- **Modo VidSrc (Películas Reales):** Cuando una película tiene un identificador real (`imdbId`), el reproductor cambia a un `<iframe>` consumiendo la API de `vidsrc.me`. Esto permite ver películas reales completas. Debido a restricciones de seguridad del navegador (CORS/Cross-Origin), la sincronización controlada por el Host se deshabilita para este modo, y cada usuario controla su propia reproducción. Se configuró para que cargue subtítulos en español por defecto (`ds_lang=es`).

### B. Interacción Social en Tiempo Real
- **Chat en Vivo:** Un sistema de mensajería integrado donde los usuarios de la sala pueden enviarse textos al instante. En dispositivos móviles, el chat es un panel superpuesto dinámico.
- **Reacciones Flotantes:** Los usuarios pueden enviar reacciones (emojis de corazones, risas, fuego, asombro). Al presionar un botón, el emoji flota hacia arriba en la pantalla de todos los participantes de la sala, generando un ambiente altamente interactivo.
- **Lista de Participantes:** Se muestra qué usuarios están conectados y quién posee el rol de "Host".

### C. Dashboard Analítico (`/dashboard`)
Un panel administrativo que recopila las estadísticas de la base de datos en memoria del servidor.
- **Métricas Generales:** Total de salas, usuarios activos, tiempo promedio por sesión, etc.
- **Satisfacción del Usuario:** Promedio de estrellas otorgadas al final de la sesión y lista de comentarios recibidos.

---

## 4. Arquitectura del Backend

El backend está construido bajo un patrón de diseño orientado a servicios:

- **`database.ts`**: Simula una base de datos. Exporta métodos para crear salas (`createRoom`), agregar usuarios (`addUser`), guardar métricas y obtener estadísticas del dashboard.
- **`services/roomService.ts`**: Contiene la lógica de negocio para generar códigos únicos, buscar películas en el catálogo y estructurar el objeto "Sala".
- **`sockets/roomHandlers.ts` (y `socketService.ts`)**: Los manejadores de Socket.IO. Se encargan de:
  - `join-room`: Conecta el socket a un "room" específico de Socket.IO.
  - `chat:message`: Retransmite mensajes.
  - `player:play / pause / seek`: Eventos emitidos por el Host para sincronizar reproductores nativos.
  - `room:reaction`: Retransmite la animación de los emojis flotantes.
  - `disconnect`: Maneja el cierre inesperado de pestañas, eliminando al usuario de la sala.

---

## 5. Decisiones de Diseño (UI/UX)

- **Prevención de Errores:** Si un video de respaldo falla, el sistema intenta cargar el siguiente en un array de "fallbacks" antes de mostrar un error crítico.
- **Feedback Visual:** Uso de estados de carga (`Loader2` animado), notificaciones tipo "toast" (ej. al copiar el código de sala), y alertas condicionales (como la advertencia de "Sincronización deshabilitada" en el reproductor de VidSrc).
- **Responsive Design:** La vista de la sala divide la pantalla en Escritorio (Reproductor a la izquierda, Chat a la derecha), pero en dispositivos móviles el chat se oculta bajo un botón accesible para maximizar el tamaño del video.

---

**Resumen del Estado Actual:** El proyecto es completamente funcional en su alcance de prototipo académico, logrando demostrar arquitecturas en tiempo real con WebSockets, integración de APIs de terceros y diseño avanzado de interfaces de usuario en React.
