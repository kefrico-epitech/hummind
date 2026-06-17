import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface UsageRecord {
  userId: string;
  route: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  durationMs: number;
  status: 'ok' | 'error' | 'rate_limited' | 'timeout';
  errorMessage?: string;
}

// Prix indicatifs par 1M tokens (à ajuster via env si besoin) en micro-USD.
// Ces tarifs servent au reporting interne, pas à la facturation client.
const MODEL_PRICES_MICRO_USD_PER_M_TOKENS: Record<
  string,
  { input: number; output: number }
> = {
  'gpt-4o-mini':    { input:    150_000, output:    600_000 },
  'gpt-4o':         { input:  2_500_000, output: 10_000_000 },
  'gpt-4.1-mini':   { input:    400_000, output:  1_600_000 },
  'gpt-image-1':    { input:  5_000_000, output: 40_000_000 },
};

function estimateCostUsdMicros(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const price =
    MODEL_PRICES_MICRO_USD_PER_M_TOKENS[model] ??
    MODEL_PRICES_MICRO_USD_PER_M_TOKENS['gpt-4o-mini'];
  const input = (inputTokens / 1_000_000) * price.input;
  const output = (outputTokens / 1_000_000) * price.output;
  return Math.round(input + output);
}

@Injectable()
export class UsageService {
  private readonly logger = new Logger(UsageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(record: UsageRecord): Promise<void> {
    const costUsdMicros = estimateCostUsdMicros(
      record.model,
      record.inputTokens,
      record.outputTokens,
    );

    try {
      await this.prisma.aiUsageLog.create({
        data: {
          userId: record.userId,
          route: record.route,
          model: record.model,
          inputTokens: record.inputTokens,
          outputTokens: record.outputTokens,
          totalTokens: record.totalTokens,
          costUsdMicros,
          status: record.status,
          durationMs: record.durationMs,
          errorMessage: record.errorMessage,
        },
      });
    } catch (err) {
      // Le log d'usage ne doit JAMAIS faire échouer une requête utilisateur.
      this.logger.error('Failed to persist AI usage log', err as Error);
    }
  }
}
