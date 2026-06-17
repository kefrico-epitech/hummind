import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // <- rend le service accessible partout sans réimporter
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
