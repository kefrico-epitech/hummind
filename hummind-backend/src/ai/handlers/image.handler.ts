import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { OpenAiClient } from '../openai.client';
import { UsageService } from '../usage/usage.service';
import { parseModelJson } from '../helpers/parseJSON';
import type {
  ImageBatchRequestDto,
  ImageGenerateRequestDto,
  ImageSearchRequestDto,
} from './image.dto';

const IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL ?? 'gpt-image-1';
const WEB_SEARCH_MODEL = process.env.OPENAI_WEB_SEARCH_MODEL ?? 'gpt-4.1-mini';
const DEFAULT_BATCH_CONCURRENCY = 2;
const SEARCH_DEFAULT_LIMIT = 6;

export interface ImageGenerateResponse {
  url: string;
  prompt: string;
  revisedPrompt: string | null;
}

export interface ImageBatchResult {
  id: string;
  url: string | null;
  error: string | null;
}

export interface ImageBatchResponse {
  results: ImageBatchResult[];
  usage: { generatedCount: number; errorCount: number };
}

export interface ImageSearchResult {
  title: string;
  imageUrl: string;
  source: string | null;
  license: string | null;
}

@Injectable()
export class ImageHandler {
  private readonly logger = new Logger(ImageHandler.name);

  constructor(
    private readonly openai: OpenAiClient,
    private readonly usage: UsageService,
  ) {}

  async generate(args: {
    userId: string;
    body: ImageGenerateRequestDto;
  }): Promise<ImageGenerateResponse> {
    const startedAt = Date.now();
    const prompt = args.body.prompt.trim();
    if (!prompt) throw new BadRequestException('Prompt requis');

    try {
      const response = await this.openai.raw.images.generate({
        model: IMAGE_MODEL,
        prompt,
        size: (args.body.size ?? '1024x1024') as never,
      });

      const item = response.data?.[0];
      const url =
        item?.url ??
        (item?.b64_json ? `data:image/png;base64,${item.b64_json}` : null);
      if (!url) throw new Error('Image generation returned no data');

      void this.usage.log({
        userId: args.userId,
        route: 'image-generate',
        model: IMAGE_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startedAt,
        status: 'ok',
      });

      return {
        url,
        prompt,
        revisedPrompt: (item as { revised_prompt?: string })?.revised_prompt ?? null,
      };
    } catch (err) {
      void this.usage.log({
        userId: args.userId,
        route: 'image-generate',
        model: IMAGE_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startedAt,
        status: 'error',
        errorMessage: (err as Error)?.message ?? 'unknown',
      });
      throw err;
    }
  }

  async batch(args: {
    userId: string;
    body: ImageBatchRequestDto;
  }): Promise<ImageBatchResponse> {
    const startedAt = Date.now();
    const items = args.body.images ?? [];
    const concurrency = Math.max(
      1,
      Math.min(args.body.concurrency ?? DEFAULT_BATCH_CONCURRENCY, items.length, 3),
    );

    const results: ImageBatchResult[] = new Array(items.length).fill(null).map(
      (_, i) => ({ id: items[i].id ?? String(i), url: null, error: null }),
    );

    let cursor = 0;
    let generatedCount = 0;
    let errorCount = 0;

    const worker = async (): Promise<void> => {
      while (cursor < items.length) {
        const index = cursor++;
        const item = items[index];
        try {
          const out = await this.generate({
            userId: args.userId,
            body: { prompt: item.prompt, size: item.size },
          });
          results[index].url = out.url;
          generatedCount += 1;
        } catch (err) {
          results[index].error = (err as Error)?.message ?? 'unknown';
          errorCount += 1;
        }
      }
    };

    await Promise.all(Array.from({ length: concurrency }, () => worker()));

    void this.usage.log({
      userId: args.userId,
      route: 'image-generate-batch',
      model: IMAGE_MODEL,
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
      durationMs: Date.now() - startedAt,
      status: errorCount === items.length ? 'error' : 'ok',
    });

    return { results, usage: { generatedCount, errorCount } };
  }

  async search(args: {
    userId: string;
    body: ImageSearchRequestDto;
  }): Promise<{ results: ImageSearchResult[] }> {
    const startedAt = Date.now();
    const query = args.body.query.trim();
    if (!query) throw new BadRequestException('Query requise');
    const limit = Math.max(1, Math.min(args.body.limit ?? SEARCH_DEFAULT_LIMIT, 12));

    try {
      const response = (await this.openai.raw.chat.completions.create({
        model: WEB_SEARCH_MODEL,
        stream: false,
        max_tokens: 800,
        response_format: { type: 'json_schema', json_schema: SEARCH_SCHEMA },
        messages: [
          {
            role: 'system',
            content: `Tu renvoies une liste d'images pertinentes (max ${limit}) pour le contexte donné. Priorité aux sources libres et éducatives. Champs : title, imageUrl (http(s) avec extension image), source (nom du site), license (si connue).`,
          },
          { role: 'user', content: query },
        ],
      })) as ChatCompletion;

      const raw = response.choices[0]?.message?.content ?? '';
      const parsed = parseModelJson<{ results: ImageSearchResult[] }>(raw);
      const filtered = (parsed.results ?? [])
        .filter((r) => isLikelyImageUrl(r.imageUrl))
        .slice(0, limit);

      void this.usage.log({
        userId: args.userId,
        route: 'image-search',
        model: WEB_SEARCH_MODEL,
        inputTokens: response.usage?.prompt_tokens ?? 0,
        outputTokens: response.usage?.completion_tokens ?? 0,
        totalTokens: response.usage?.total_tokens ?? 0,
        durationMs: Date.now() - startedAt,
        status: 'ok',
      });

      return { results: filtered };
    } catch (err) {
      void this.usage.log({
        userId: args.userId,
        route: 'image-search',
        model: WEB_SEARCH_MODEL,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        durationMs: Date.now() - startedAt,
        status: 'error',
        errorMessage: (err as Error)?.message ?? 'unknown',
      });
      throw err;
    }
  }
}

const SEARCH_SCHEMA: {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
} = {
  name: 'image_search_results',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      results: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            title: { type: 'string' },
            imageUrl: { type: 'string' },
            source: { type: ['string', 'null'] },
            license: { type: ['string', 'null'] },
          },
          required: ['title', 'imageUrl', 'source', 'license'],
        },
      },
    },
    required: ['results'],
  },
};

function isLikelyImageUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  if (!/^https?:\/\//i.test(url)) return false;
  return /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
}
