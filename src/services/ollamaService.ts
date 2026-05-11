// ============================================
// NetSync Backend - Ollama AI Service
// ============================================

import { getMetrics } from './metricService';
import { contentCatalog } from '../data/content';
import { db } from '../database';

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://desktop-fufpeoh:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma4:e4b';

/**
 * Build a concise system prompt to minimize model thinking time.
 */
function buildSystemPrompt(): string {
  const ctx = buildDashboardContext();

  return `Eres SyncBot, asistente de cine de NetSync (plataforma de streaming social).
Reglas: habla en español, sé amigable, usa emojis, responde en máximo 3 párrafos.
Basa recomendaciones en estos datos reales:

${ctx}

Recomienda del catálogo según popularidad, calificaciones y reacciones.`;
}

/**
 * Build compact dashboard context.
 */
function buildDashboardContext(): string {
  const metrics = getMetrics();
  const ratings = db.getAllRatings();

  const catalog = contentCatalog.map(c =>
    `${c.title} (${c.year}, ${c.genre}, IMDb:${c.rating})`
  ).join('; ');

  const popular = metrics.mostUsedContent.length > 0
    ? metrics.mostUsedContent.map(c => `${c.title}:${c.count} salas`).join(', ')
    : 'Sin datos';

  const reactions = metrics.reactionCounts.length > 0
    ? metrics.reactionCounts.map(r => `${r.type}:${r.count}`).join(', ')
    : 'Sin reacciones';

  const comments = ratings
    .filter(r => r.comment && r.comment.trim())
    .slice(-3)
    .map(r => `${r.userName}(${r.score}⭐):"${r.comment}"`)
    .join('; ') || 'Sin comentarios';

  return `Catálogo: ${catalog}
Popular: ${popular}
Calificación promedio: ${metrics.averageRating || 'N/A'} (${metrics.totalRatings} ratings)
Reacciones: ${reactions}
Comentarios: ${comments}
Salas: ${metrics.totalRooms} total, ${metrics.activeRooms} activas, ${metrics.totalUsers} usuarios`;
}

export interface OllamaStreamCallback {
  onToken: (token: string) => void;
  onThinking: () => void;
  onDone: () => void;
  onError: (error: string) => void;
}

/**
 * Send a message to Ollama using /api/chat and stream the response.
 * gemma4:e4b emits thinking tokens first, then content tokens.
 * We notify the client when thinking starts, and stream only content tokens.
 */
export async function chatWithOllama(
  userMessage: string,
  callback: OllamaStreamCallback
): Promise<void> {
  const systemPrompt = buildSystemPrompt();

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true,
        options: {
          temperature: 0.8,
          top_p: 0.9,
          num_predict: 1024,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      callback.onError(`Error de Ollama (${response.status}): ${errorText}`);
      return;
    }

    if (!response.body) {
      callback.onError('No se recibió body en la respuesta de Ollama');
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let thinkingNotified = false;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line);

          // Notify thinking phase (only once)
          if (json.message?.thinking && !thinkingNotified) {
            thinkingNotified = true;
            callback.onThinking();
          }

          // Stream content tokens to client
          if (json.message?.content) {
            callback.onToken(json.message.content);
          }

          if (json.done) {
            callback.onDone();
            return;
          }
        } catch {
          // Skip malformed JSON
        }
      }
    }

    callback.onDone();
  } catch (err: any) {
    callback.onError(
      err.code === 'ECONNREFUSED'
        ? 'No se pudo conectar con Ollama. Verifica que el servicio esté corriendo en ' + OLLAMA_BASE_URL
        : `Error de conexión: ${err.message}`
    );
  }
}
