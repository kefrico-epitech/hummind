import { Global, Module } from '@nestjs/common';
import { MemoryService } from './memory.service';

/**
 * Module mémoire (global) : exposé au tuteur et à tout module qui doit
 * rappeler/mettre à jour le profil d'apprentissage. Dépend d'AiModule (global)
 * et PrismaModule (global).
 */
@Global()
@Module({
  providers: [MemoryService],
  exports: [MemoryService],
})
export class MemoryModule {}
