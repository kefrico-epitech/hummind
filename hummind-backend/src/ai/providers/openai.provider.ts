import { Logger } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Env } from '../../config/env.schema';
import type { ChatMessage, ChatOptions, ChatResult, LlmProvider } from '../ai.types';

const OPENAI_BASE = 'https://api.openai.com/v1';

/** Fournisseur OpenAI (REST, sans SDK). */
export class OpenAiProvider implements LlmProvider {
  readonly name = 'openai';
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly config: ConfigService<Env, true>) {}

  private get apiKey(): string {
    const key = this.config.get('OPENAI_API_KEY', { infer: true });
    if (!key) throw new Error('OPENAI_API_KEY manquant.');
    return key;
  }

  private get defaultModel(): string {
    return this.config.get('OPENAI_MODEL', { infer: true });
  }

  async chat(messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens,
        ...(opts.json ? { response_format: { type: 'json_object' } } : {}),
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);

    const data = (await res.json()) as {
      choices: { message: { content: string } }[];
      usage?: { total_tokens?: number };
    };
    const content = data.choices[0]?.message.content ?? '';
    return { content, tokensUsed: data.usage?.total_tokens ?? estimateTokens(content) };
  }

  async *stream(messages: ChatMessage[], opts: ChatOptions = {}): AsyncIterable<string> {
    const res = await fetch(`${OPENAI_BASE}/chat/completions`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: opts.model ?? this.defaultModel,
        messages,
        temperature: opts.temperature ?? 0.7,
        max_tokens: opts.maxTokens,
        stream: true,
      }),
    });
    if (!res.ok || !res.body) throw new Error(`OpenAI stream ${res.status}`);

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith('data:')) continue;
        const payload = trimmed.slice(5).trim();
        if (payload === '[DONE]') return;
        try {
          const json = JSON.parse(payload) as {
            choices: { delta?: { content?: string } }[];
          };
          const delta = json.choices[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          /* fragment partiel — ignoré */
        }
      }
    }
  }

  async embed(texts: string[], model?: string): Promise<number[][]> {
    const res = await fetch(`${OPENAI_BASE}/embeddings`, {
      method: 'POST',
      headers: this.headers(),
      body: JSON.stringify({
        model: model ?? this.config.get('OPENAI_EMBED_MODEL', { infer: true }),
        input: texts,
      }),
    });
    if (!res.ok) throw new Error(`OpenAI embed ${res.status}: ${await res.text()}`);
    const data = (await res.json()) as { data: { embedding: number[] }[] };
    return data.data.map((d) => d.embedding);
  }

  private headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${this.apiKey}`,
    };
  }
}

/** Estimation grossière du nombre de tokens (repli si l'API ne le fournit pas). */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
