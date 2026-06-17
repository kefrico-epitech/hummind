import { Module } from '@nestjs/common';
import { CategoryService } from './category.service';
import {
  CategoriesController,
  EntityCategoriesController,
} from './category.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [EntityCategoriesController, CategoriesController],
  providers: [CategoryService, PrismaService],
  exports: [CategoryService],
})
export class CategoryModule {}
