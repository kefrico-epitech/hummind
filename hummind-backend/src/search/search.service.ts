import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  async globalSearch(query: string, userId: string) {
    const searchString = query.trim();

    const [entities, courses] = await Promise.all([
      // Recherche dans les entités (Ecoles, Départements, Salles, etc.)
      this.prisma.entity.findMany({
        where: {
          AND: [
            {
              OR: [
                { name: { contains: searchString, mode: 'insensitive' } },
                {
                  description: { contains: searchString, mode: 'insensitive' },
                },
              ],
            },
            {
              OR: [{ createdById: userId }, { members: { some: { userId } } }],
            },
          ],
        },
        select: {
          id: true,
          name: true,
          type: true,
        },
        take: 20, // Limite pour la performance globale
      }),
      // Recherche dans les cours
      this.prisma.course.findMany({
        where: {
          AND: [
            {
              OR: [
                { title: { contains: searchString, mode: 'insensitive' } },
                {
                  description: { contains: searchString, mode: 'insensitive' },
                },
              ],
            },
            {
              OR: [
                { createdById: userId },
                { visibility: 'PUBLIC' },
                { entity: { members: { some: { userId } } } },
              ],
            },
          ],
        },
        select: {
          id: true,
          title: true,
        },
        take: 20,
      }),
    ]);

    // Formatage unifié
    const formattedEntities = entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
    }));

    const formattedCourses = courses.map((c) => ({
      id: c.id,
      name: c.title, // Mapping title -> name
      type: 'COURSE', // Type statique injecté
    }));

    // Concaténer et retourner (potentiellement triable plus tard)
    return [...formattedEntities, ...formattedCourses];
  }
}
