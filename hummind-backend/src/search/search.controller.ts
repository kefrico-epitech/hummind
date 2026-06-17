import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../auth/current-user.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { SearchService } from './search.service';

@ApiTags('search')
@ApiBearerAuth('access-token')
@UseGuards(AuthGuard('jwt'))
@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @ApiOperation({ summary: 'Recherche globale (Entités & Cours)' })
  @ApiQuery({ name: 'q', required: true, description: 'Mot clé à rechercher' })
  @Get()
  search(@Query('q') query: string, @CurrentUserId() userId: string) {
    if (!query || query.trim().length === 0) {
      return [];
    }
    return this.searchService.globalSearch(query, userId);
  }
}
