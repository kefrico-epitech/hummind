import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { AiService } from './ai.service';
import { LLM_PROVIDER } from './ai.constants';
import type { LlmProvider } from './ai.types';
import { OpenAiProvider } from './providers/openai.provider';
import { StubProvider } from './providers/stub.provider';

/**
 * Module IA global. Le fournisseur concret est résolu à l'exécution :
 * OpenAI si AI_PROVIDER=openai ET clé présente, sinon repli sur le Stub.
 * Pour ajouter Claude/Mistral : créer un provider + une branche ici.
 */
@Global()
@Module({
  providers: [
    {
      provide: LLM_PROVIDER,
      useFactory: (config: ConfigService<Env, true>): LlmProvider => {
        const provider = config.get('AI_PROVIDER', { infer: true });
        const hasKey = Boolean(config.get('OPENAI_API_KEY', { infer: true }));
        if (provider === 'openai' && hasKey) return new OpenAiProvider(config);
        return new StubProvider();
      },
      inject: [ConfigService],
    },
    AiService,
  ],
  exports: [AiService],
})
export class AiModule {}
