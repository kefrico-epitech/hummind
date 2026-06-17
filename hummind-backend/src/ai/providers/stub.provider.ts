import { Logger } from '@nestjs/common';
import type { ChatMessage, ChatOptions, ChatResult, LlmProvider } from '../ai.types';
import { estimateTokens } from './openai.provider';

/**
 * Fournisseur de repli (dev/tests, ou si OPENAI_API_KEY absent).
 * Réponses factices déterministes — l'app reste fonctionnelle sans clé.
 */
export class StubProvider implements LlmProvider {
  readonly name = 'stub';
  private readonly logger = new Logger(StubProvider.name);

  constructor() {
    this.logger.warn('Fournisseur IA = STUB (aucune clé) : réponses factices.');
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const last = messages[messages.length - 1]?.content ?? '';
    const content = opts.json
      ? JSON.stringify({ stub: true, echo: last.slice(0, 120) })
      : `「stub」 Réponse simulée à : ${last.slice(0, 160)}`;
    return { content, tokensUsed: estimateTokens(content) };
  }

  async *stream(messages: ChatMessage[]): AsyncIterable<string> {
    const last = messages[messages.length - 1]?.content ?? '';
    const words = `「stub」 Réponse simulée à : ${last.slice(0, 120)}`.split(' ');
    for (const w of words) yield w + ' ';
  }

  async embed(texts: string[]): Promise<number[][]> {
    // Vecteurs nuls de dimension 1536 (compatibles text-embedding-3-small).
    return texts.map(() => new Array(1536).fill(0));
  }
}
