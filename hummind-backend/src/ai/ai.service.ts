import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { LLM_PROVIDER } from './ai.constants';
import type { ChatMessage, ChatOptions, ChatResult, LlmProvider } from './ai.types';

export interface JsonResult<T> {
  data: T;
  tokensUsed: number;
}

/**
 * Point d'entrée UNIQUE de l'IA pour toute l'application.
 * Les modules (tutor, courses, learner…) n'utilisent QUE ce service —
 * jamais un fournisseur directement. Changer de fournisseur = config, pas code.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    @Inject(LLM_PROVIDER) private readonly provider: LlmProvider,
    private readonly config: ConfigService<Env, true>,
  ) {
    this.logger.log(`Fournisseur IA actif : ${provider.name}`);
  }

  get providerName(): string {
    return this.provider.name;
  }

  /** Modèle dédié au tuteur (qualité d'accompagnement). */
  get tutorModel(): string {
    return this.config.get('TUTOR_MODEL', { infer: true });
  }

  chat(messages: ChatMessage[], opts?: ChatOptions): Promise<ChatResult> {
    return this.provider.chat(messages, opts);
  }

  stream(messages: ChatMessage[], opts?: ChatOptions): AsyncIterable<string> {
    return this.provider.stream(messages, opts);
  }

  embed(texts: string[]): Promise<number[][]> {
    return this.provider.embed(texts);
  }

  /** Génère une réponse JSON typée (force le mode JSON + parse robuste). */
  async generateJson<T>(messages: ChatMessage[], opts: ChatOptions = {}): Promise<JsonResult<T>> {
    const { content, tokensUsed } = await this.provider.chat(messages, { ...opts, json: true });
    try {
      return { data: JSON.parse(content) as T, tokensUsed };
    } catch {
      // Repli : extrait le premier bloc JSON plausible.
      const match = content.match(/\{[\s\S]*\}/);
      if (match) return { data: JSON.parse(match[0]) as T, tokensUsed };
      throw new Error('Réponse IA non parsable en JSON.');
    }
  }
}
