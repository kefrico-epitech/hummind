import { Injectable, Logger } from '@nestjs/common';
import type { ChatCompletion } from 'openai/resources/chat/completions';
import { OpenAiClient } from '../openai.client';
import { UsageService } from '../usage/usage.service';
import { escapeUserContent } from '../helpers/escapeUserContent';
import { parseModelJson } from '../helpers/parseJSON';
import {
  isModelNotFoundError,
  resolveModelCandidates,
} from '../helpers/resolveModel';
import type { CourseGenerateRequestDto } from './course-generate-progressive.dto';

const MODEL_ENV_KEYS = ['OPENAI_COURSE_MODEL', 'OPENAI_MODEL'];
const MODEL_FALLBACKS = ['gpt-4o-mini', 'gpt-4o'];
const MAX_OUTPUT_TOKENS_PLAN = 1500;
const MAX_OUTPUT_TOKENS_MODULE = 4000;

const PLAN_SYSTEM = `
Tu es un concepteur pédagogique. Tu génères un plan de cours structuré en 5 à 8 modules.
Chaque module doit avoir un titre clair et une description courte (1 phrase) de ce qu'il couvre.

Retourne UN SEUL JSON strict du type :
{
  "modules": [
    { "id": "mod-1", "title": "...", "description": "..." },
    ...
  ]
}
`.trim();

const MODULE_SYSTEM = `
Tu es un rédacteur pédagogique. On te donne le contexte global d'un cours et le titre/description d'UN module.
Tu génères les blocs du module au format JSON strict :
{
  "blocks": [
    { "type": "title", "title": "..." },
    { "type": "content", "text": "..." },        // 800-2000 caractères, narratif
    { "type": "exercise", "prompt": "...", "solution": "..." },
    { "type": "quiz", "questions": [
        { "question": "...", "choices": ["A","B","C","D"], "correctIndexes": [0] }
    ]}
  ]
}
Règles :
- Toujours dans cet ordre : title, content, exercise, quiz.
- content : voix narrative, exemples concrets, marqueurs Objectif:, Définition:, Exemple:.
- quiz : 3 à 5 questions minimum, choix réalistes.
- exercise : énoncé clair + solution étape par étape.
`.trim();

interface ModulePlanItem {
  id: string;
  title: string;
  description: string;
}

interface PlanResponse {
  modules: ModulePlanItem[];
}

interface ModuleBlocksResponse {
  blocks: Array<{
    type: 'title' | 'content' | 'exercise' | 'quiz';
    title?: string;
    text?: string;
    prompt?: string;
    solution?: string;
    questions?: Array<{
      question: string;
      choices: string[];
      correctIndexes: number[];
    }>;
  }>;
}

export interface CourseAction {
  type: 'ADD_BLOCK';
  moduleId: string;
  toIndex: number | null;
  block: Record<string, unknown>;
}

export interface CourseGenerateResponse {
  actions: CourseAction[];
  plan: Array<{ title: string; description: string }>;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
}

@Injectable()
export class CourseGenerateProgressiveHandler {
  private readonly logger = new Logger(CourseGenerateProgressiveHandler.name);

  constructor(
    private readonly openai: OpenAiClient,
    private readonly usage: UsageService,
  ) {}

  async handle(args: {
    userId: string;
    body: CourseGenerateRequestDto;
  }): Promise<CourseGenerateResponse> {
    const { userId, body } = args;
    const startedAt = Date.now();
    const models = resolveModelCandidates(MODEL_ENV_KEYS, MODEL_FALLBACKS);

    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;
    let usedModel = models[0];

    try {
      // PASS 1 - plan
      const planContext = [
        `Titre: ${body.context.title}`,
        body.context.description && `Description: ${body.context.description}`,
        body.context.domain && `Domaine: ${body.context.domain}`,
        body.context.level && `Niveau: ${body.context.level}`,
        body.context.style && `Style: ${body.context.style}`,
        body.context.objectives?.length &&
          `Objectifs:\n${body.context.objectives.map((o) => `- ${o}`).join('\n')}`,
        body.extractedData &&
          `Document fourni (à respecter en priorité):\n${escapeUserContent(body.extractedData, 6000)}`,
      ]
        .filter(Boolean)
        .join('\n');

      const planResult = await this.callModel<PlanResponse>({
        models,
        system: PLAN_SYSTEM,
        user: planContext,
        maxTokens: MAX_OUTPUT_TOKENS_PLAN,
        schema: PLAN_SCHEMA,
      });
      usedModel = planResult.model;
      inputTokens += planResult.usage.inputTokens;
      outputTokens += planResult.usage.outputTokens;
      totalTokens += planResult.usage.totalTokens;

      const modules = planResult.data.modules ?? [];

      // PASS 2 - blocks per module (parallèle)
      const blockResults = await Promise.all(
        modules.map(async (mod) => {
          const moduleUser = [
            `CONTEXTE COURS: ${body.context.title}`,
            body.context.domain && `Domaine: ${body.context.domain}`,
            body.context.level && `Niveau: ${body.context.level}`,
            `MODULE À RÉDIGER: ${mod.title}`,
            `DESCRIPTION DU MODULE: ${mod.description}`,
          ]
            .filter(Boolean)
            .join('\n');

          const blocks = await this.callModel<ModuleBlocksResponse>({
            models,
            system: MODULE_SYSTEM,
            user: moduleUser,
            maxTokens: MAX_OUTPUT_TOKENS_MODULE,
            schema: MODULE_BLOCKS_SCHEMA,
          });

          inputTokens += blocks.usage.inputTokens;
          outputTokens += blocks.usage.outputTokens;
          totalTokens += blocks.usage.totalTokens;
          return { moduleId: mod.id, blocks: blocks.data.blocks ?? [] };
        }),
      );

      const actions: CourseAction[] = [];
      for (const { moduleId, blocks } of blockResults) {
        for (const block of blocks) {
          actions.push({
            type: 'ADD_BLOCK',
            moduleId,
            toIndex: null,
            block: block as unknown as Record<string, unknown>,
          });
        }
      }

      const durationMs = Date.now() - startedAt;

      void this.usage.log({
        userId,
        route: 'course-generate-progressive',
        model: usedModel,
        inputTokens,
        outputTokens,
        totalTokens,
        durationMs,
        status: 'ok',
      });

      return {
        actions,
        plan: modules.map((m) => ({ title: m.title, description: m.description })),
        usage: { inputTokens, outputTokens, totalTokens },
      };
    } catch (err) {
      void this.usage.log({
        userId,
        route: 'course-generate-progressive',
        model: usedModel,
        inputTokens,
        outputTokens,
        totalTokens,
        durationMs: Date.now() - startedAt,
        status: 'error',
        errorMessage: (err as Error)?.message ?? 'unknown',
      });
      throw err;
    }
  }

  private async callModel<T>(args: {
    models: string[];
    system: string;
    user: string;
    maxTokens: number;
    schema: { name: string; strict: boolean; schema: Record<string, unknown> };
  }): Promise<{
    data: T;
    model: string;
    usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  }> {
    let lastError: unknown = null;
    for (const model of args.models) {
      try {
        const response = (await this.openai.raw.chat.completions.create({
          model,
          stream: false,
          max_tokens: args.maxTokens,
          response_format: {
            type: 'json_schema',
            json_schema: args.schema,
          },
          messages: [
            { role: 'system', content: args.system },
            { role: 'user', content: args.user },
          ],
        })) as ChatCompletion;
        const raw = response.choices[0]?.message?.content ?? '';
        const data = parseModelJson<T>(raw);
        return {
          data,
          model,
          usage: {
            inputTokens: response.usage?.prompt_tokens ?? 0,
            outputTokens: response.usage?.completion_tokens ?? 0,
            totalTokens: response.usage?.total_tokens ?? 0,
          },
        };
      } catch (err) {
        lastError = err;
        if (!isModelNotFoundError(err)) throw err;
        this.logger.warn(`Model ${model} not available, trying next`);
      }
    }
    throw lastError instanceof Error ? lastError : new Error('No model available');
  }
}

const PLAN_SCHEMA: {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
} = {
  name: 'course_plan',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      modules: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
          },
          required: ['id', 'title', 'description'],
        },
      },
    },
    required: ['modules'],
  },
};

const MODULE_BLOCKS_SCHEMA: {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
} = {
  name: 'module_blocks',
  strict: true,
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      blocks: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            type: {
              type: 'string',
              enum: ['title', 'content', 'exercise', 'quiz'],
            },
          },
          required: ['type'],
        },
      },
    },
    required: ['blocks'],
  },
};
