// ============================================
// NetSync Backend - AI Service (Groq cloud API)
// ============================================

import { getMetrics } from './metricService';
import { contentCatalog } from '../data/content';
import { db } from '../database';

const GROQ_BASE_URL = 'https://api.groq.com/openai/v1/chat/completions';

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
 * Send a message to Groq's OpenAI-compatible /chat/completions endpoint
 * and stream the response as Server-Sent Events.
 */
export async function chatWithOllama(
  userMessage: string,
  callback: OllamaStreamCallback
): Promise<void> {
  const groqApiKey = process.env.GROQ_API_KEY || '';
  const groqModel = process.env.GROQ_MODEL || 'llama-3.3-70b-versatile';

  if (!groqApiKey) {
    callback.onError('Falta configurar GROQ_API_KEY en las variables de entorno del servidor.');
    return;
  }

  const systemPrompt = buildSystemPrompt();

  try {
    const response = await fetch(GROQ_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: groqModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        stream: true,
        temperature: 0.8,
        top_p: 0.9,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      callback.onError(`Error de Groq (${response.status}): ${errorText}`);
      return;
    }

    if (!response.body) {
      callback.onError('No se recibió body en la respuesta de Groq');
      return;
    }

    callback.onThinking();

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;

        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') {
          callback.onDone();
          return;
        }

        try {
          const json = JSON.parse(payload);
          const token = json.choices?.[0]?.delta?.content;
          if (token) callback.onToken(token);
        } catch {
          // Skip malformed JSON
        }
      }
    }

    callback.onDone();
  } catch (err: any) {
    callback.onError(`Error de conexión con Groq: ${err.message}`);
  }
}
