import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BlockType, CourseStatus, EntityRole, Prisma, Role } from '@prisma/client';
import { AiService } from '../ai/ai.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBlockDto, CreateCourseDto, CreateDocumentDto, CreateLessonDto, CreateModuleDto, GenerateCourseDto, GenerateLessonDto, GenerateOutlineDto, ReorderDto, UpdateBlockDto, UpdateCourseDto, UpdateLessonDto, UpdateModuleDto } from './dto/courses.dto';

type CourseTree = Prisma.CourseGetPayload<{
  include: {
    entity: true;
    createdBy: true;
    documents: {
      include: {
        chunks: true;
      };
    };
    modules: {
      include: {
        lessons: {
          include: {
            blocks: {
              include: {
                quiz: {
                  include: {
                    questions: {
                      include: {
                        answers: true;
                      };
                    };
                  };
                };
              };
            };
          };
        };
      };
    };
  };
}>;

interface OutlineModule {
  title: string;
  description?: string;
  lessons: {
    title: string;
    description?: string;
    estimatedMinutes?: number;
  }[];
}

interface LessonDraft {
  title: string;
  description?: string;
  estimatedMinutes?: number;
  blocks?: {
    type: BlockType;
    order?: number;
    payload?: Record<string, unknown>;
    quiz?: {
      title?: string;
      description?: string;
      passingScore?: number;
      shuffle?: boolean;
      questions?: {
        prompt: string;
        type?: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
        explanation?: string;
        points?: number;
        answers?: { label: string; isCorrect?: boolean; order?: number }[];
      }[];
    };
  }[];
}

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async create(userId: string, role: Role, dto: CreateCourseDto) {
    await this.assertCanManageEntity(userId, role, dto.entityId);

    return this.prisma.course.create({
      data: {
        entityId: dto.entityId,
        createdById: userId,
        slug: dto.slug?.toLowerCase() ?? this.slugify(dto.title),
        title: dto.title,
        description: dto.description,
        domain: dto.domain,
        level: dto.level,
        objectives: dto.objectives ?? [],
        coverImage: dto.coverImage,
        picture: dto.picture,
        status: CourseStatus.DRAFT,
      },
      include: this.courseInclude(),
    });
  }

  async list(entityId?: string) {
    return this.prisma.course.findMany({
      where: entityId ? { entityId } : undefined,
      include: this.courseInclude(),
      orderBy: { updatedAt: 'desc' },
    });
  }

  async findOne(courseId: string): Promise<CourseTree> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: this.courseInclude(),
    });
    if (!course) throw new NotFoundException('Cours introuvable.');
    return course;
  }

  async update(userId: string, role: Role, courseId: string, dto: UpdateCourseDto) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        ...(dto.entityId ? { entityId: dto.entityId } : {}),
        ...(dto.slug ? { slug: dto.slug.toLowerCase() } : {}),
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.domain !== undefined ? { domain: dto.domain } : {}),
        ...(dto.level !== undefined ? { level: dto.level } : {}),
        ...(dto.objectives ? { objectives: dto.objectives } : {}),
        ...(dto.coverImage !== undefined ? { coverImage: dto.coverImage } : {}),
        ...(dto.picture !== undefined ? { picture: dto.picture } : {}),
      },
      include: this.courseInclude(),
    });
  }

  async archive(userId: string, role: Role, courseId: string) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.ARCHIVED,
        archivedAt: new Date(),
      },
      include: this.courseInclude(),
    });
  }

  async remove(userId: string, role: Role, courseId: string) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.ARCHIVED,
        archivedAt: new Date(),
      },
    });
  }

  async publish(userId: string, role: Role, courseId: string) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);
    this.assertPublishable(course);

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.PUBLISHED,
        publishedAt: new Date(),
      },
      include: this.courseInclude(),
    });
  }

  async unpublish(userId: string, role: Role, courseId: string) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    return this.prisma.course.update({
      where: { id: courseId },
      data: {
        status: CourseStatus.DRAFT,
        publishedAt: null,
      },
      include: this.courseInclude(),
    });
  }

  async createModule(userId: string, role: Role, courseId: string, dto: CreateModuleDto) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    return this.prisma.module.create({
      data: {
        courseId,
        title: dto.title,
        description: dto.description,
        order: dto.order ?? course.modules.length,
      },
    });
  }

  async updateModule(userId: string, role: Role, moduleId: string, dto: UpdateModuleDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true },
    });
    if (!module) throw new NotFoundException('Module introuvable.');
    await this.assertCanManageEntity(userId, role, module.course.entityId);

    return this.prisma.module.update({
      where: { id: moduleId },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
      },
    });
  }

  async deleteModule(userId: string, role: Role, moduleId: string) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true, _count: { select: { lessons: true } } },
    });
    if (!module) throw new NotFoundException('Module introuvable.');
    await this.assertCanManageEntity(userId, role, module.course.entityId);

    if (module._count.lessons > 0) {
      throw new BadRequestException({
        code: 'MODULE_NOT_EMPTY',
        message: 'Le module contient encore des leçons.',
      });
    }

    await this.prisma.module.delete({ where: { id: moduleId } });
    return { ok: true };
  }

  async reorderModules(userId: string, role: Role, courseId: string, dto: ReorderDto) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    await this.reorderItems(
      course.modules.map((module) => module.id),
      dto,
      (id, order) => this.prisma.module.update({ where: { id }, data: { order } }),
    );
    return { ok: true };
  }

  async createLesson(userId: string, role: Role, moduleId: string, dto: CreateLessonDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true, lessons: true },
    });
    if (!module) throw new NotFoundException('Module introuvable.');
    await this.assertCanManageEntity(userId, role, module.course.entityId);

    return this.prisma.lesson.create({
      data: {
        moduleId,
        title: dto.title,
        description: dto.description,
        order: dto.order ?? module.lessons.length,
        estimatedMinutes: dto.estimatedMinutes,
      },
    });
  }

  async updateLesson(userId: string, role: Role, lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } } },
    });
    if (!lesson) throw new NotFoundException('Leçon introuvable.');
    await this.assertCanManageEntity(userId, role, lesson.module.course.entityId);

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: {
        ...(dto.title ? { title: dto.title } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.estimatedMinutes !== undefined
          ? { estimatedMinutes: dto.estimatedMinutes }
          : {}),
      },
    });
  }

  async deleteLesson(userId: string, role: Role, lessonId: string) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } }, _count: { select: { blocks: true } } },
    });
    if (!lesson) throw new NotFoundException('Leçon introuvable.');
    await this.assertCanManageEntity(userId, role, lesson.module.course.entityId);

    if (lesson._count.blocks > 0) {
      throw new BadRequestException({
        code: 'LESSON_NOT_EMPTY',
        message: 'La leçon contient encore des blocs.',
      });
    }

    await this.prisma.lesson.delete({ where: { id: lessonId } });
    return { ok: true };
  }

  async reorderLessons(userId: string, role: Role, moduleId: string, dto: ReorderDto) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true, lessons: true },
    });
    if (!module) throw new NotFoundException('Module introuvable.');
    await this.assertCanManageEntity(userId, role, module.course.entityId);

    await this.reorderItems(
      module.lessons.map((lesson) => lesson.id),
      dto,
      (id, order) => this.prisma.lesson.update({ where: { id }, data: { order } }),
    );
    return { ok: true };
  }

  async generateLesson(
    userId: string,
    role: Role,
    moduleId: string,
    dto: GenerateLessonDto,
  ) {
    const module = await this.prisma.module.findUnique({
      where: { id: moduleId },
      include: { course: true, lessons: true },
    });
    if (!module) throw new NotFoundException('Module introuvable.');
    await this.assertCanManageEntity(userId, role, module.course.entityId);

    const draft = await this.ai.generateJson<LessonDraft>([
      {
        role: 'system',
        content:
          "Tu es un assistant pédagogique. Génère une leçon claire, courte, structurée et adaptée à un éditeur de cours.",
      },
      {
        role: 'user',
        content: JSON.stringify({
          course: {
            title: module.course.title,
            domain: module.course.domain,
            level: module.course.level,
            objectives: module.course.objectives,
          },
          module: {
            title: module.title,
            description: module.description,
          },
          lesson: dto,
        }),
      },
    ]);

    return this.prisma.$transaction(async (tx) => {
      const lesson = await tx.lesson.create({
        data: {
          moduleId,
          title: dto.title,
          description: draft.data.description ?? dto.context ?? dto.objective,
          order: dto.order ?? module.lessons.length,
          estimatedMinutes: draft.data.estimatedMinutes ?? 10,
        },
      });

      const blocks = draft.data.blocks?.length
        ? draft.data.blocks
        : [
            {
              type: BlockType.CONTENT,
              order: 0,
              payload: {
                kind: 'markdown',
                text:
                  draft.data.description ??
                  dto.context ??
                  'Contenu généré automatiquement pour cette leçon.',
              },
            },
          ];

      for (const block of blocks) {
        const created = await tx.block.create({
          data: {
            lessonId: lesson.id,
            type: block.type,
            order: block.order ?? 0,
            payload: (block.payload ?? {}) as Prisma.InputJsonValue,
          },
        });

        if (block.type === BlockType.QUIZ || block.quiz) {
          const quizDraft = block.quiz ?? { title: `${lesson.title} - Quiz` };
          const quiz = await tx.quiz.create({
            data: {
              blockId: created.id,
              title: quizDraft.title,
              description: quizDraft.description,
              passingScore: quizDraft.passingScore ?? 70,
              shuffle: quizDraft.shuffle ?? false,
              questions: {
                create:
                  quizDraft.questions?.map((question, index) => ({
                    prompt: question.prompt,
                    explanation: question.explanation,
                    type: question.type ?? 'SINGLE_CHOICE',
                    points: question.points ?? 1,
                    order: index,
                    answers: question.answers
                      ? {
                          create: question.answers.map((answer, answerIndex) => ({
                            label: answer.label,
                            isCorrect: answer.isCorrect ?? false,
                            order: answer.order ?? answerIndex,
                          })),
                        }
                      : undefined,
                  })) ?? [],
              },
            },
          });

          await tx.block.update({
            where: { id: created.id },
            data: {
              payload: {
                ...(typeof created.payload === 'object' && created.payload !== null
                  ? (created.payload as Record<string, unknown>)
                  : {}),
                quizId: quiz.id,
              } as Prisma.InputJsonValue,
            },
          });
        }
      }

      return tx.lesson.findUnique({
        where: { id: lesson.id },
        include: {
          blocks: {
            include: {
              quiz: {
                include: {
                  questions: {
                    include: { answers: true },
                  },
                },
              },
            },
          },
        },
      });
    });
  }

  async createBlock(userId: string, role: Role, lessonId: string, dto: CreateBlockDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } }, blocks: true },
    });
    if (!lesson) throw new NotFoundException('Leçon introuvable.');
    await this.assertCanManageEntity(userId, role, lesson.module.course.entityId);

    const block = await this.prisma.block.create({
      data: {
        lessonId,
        type: dto.type,
        order: dto.order ?? lesson.blocks.length,
        payload: (dto.payload ?? {}) as Prisma.InputJsonValue,
      },
    });

    if (dto.createQuiz || dto.type === BlockType.QUIZ) {
      await this.prisma.quiz.create({
        data: {
          blockId: block.id,
          title: 'Quiz',
          passingScore: 70,
        },
      });
    }

    return block;
  }

  async updateBlock(userId: string, role: Role, blockId: string, dto: UpdateBlockDto) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
    if (!block) throw new NotFoundException('Bloc introuvable.');
    await this.assertCanManageEntity(userId, role, block.lesson.module.course.entityId);

    return this.prisma.block.update({
      where: { id: blockId },
      data: {
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.order !== undefined ? { order: dto.order } : {}),
        ...(dto.payload !== undefined
          ? { payload: dto.payload as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async deleteBlock(userId: string, role: Role, blockId: string) {
    const block = await this.prisma.block.findUnique({
      where: { id: blockId },
      include: { lesson: { include: { module: { include: { course: true } } } } },
    });
    if (!block) throw new NotFoundException('Bloc introuvable.');
    await this.assertCanManageEntity(userId, role, block.lesson.module.course.entityId);

    await this.prisma.block.delete({ where: { id: blockId } });
    return { ok: true };
  }

  async reorderBlocks(userId: string, role: Role, lessonId: string, dto: ReorderDto) {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: { module: { include: { course: true } }, blocks: true },
    });
    if (!lesson) throw new NotFoundException('Leçon introuvable.');
    await this.assertCanManageEntity(userId, role, lesson.module.course.entityId);

    await this.reorderItems(
      lesson.blocks.map((block) => block.id),
      dto,
      (id, order) => this.prisma.block.update({ where: { id }, data: { order } }),
    );
    return { ok: true };
  }

  async createDocument(userId: string, role: Role, courseId: string, dto: CreateDocumentDto) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    const document = await this.prisma.courseDocument.create({
      data: {
        courseId,
        filename: dto.filename,
        mimeType: dto.mimeType,
        text: dto.text,
        charCount: dto.text.length,
      },
    });

    const chunks = this.chunkText(dto.text);
    if (chunks.length > 0) {
      const embeddings = await this.ai.embed(chunks);
      await this.prisma.courseDocumentChunk.createMany({
        data: chunks.map((content, index) => ({
          documentId: document.id,
          order: index,
          content,
          embedding: embeddings[index] ?? [],
        })),
      });
    }

    return this.prisma.courseDocument.findUnique({
      where: { id: document.id },
      include: { chunks: true },
    });
  }

  async deleteDocument(userId: string, role: Role, documentId: string) {
    const document = await this.prisma.courseDocument.findUnique({
      where: { id: documentId },
      include: { course: true },
    });
    if (!document) throw new NotFoundException('Document introuvable.');
    await this.assertCanManageEntity(userId, role, document.course.entityId);

    await this.prisma.courseDocument.delete({ where: { id: documentId } });
    return { ok: true };
  }

  async generateOutline(userId: string, role: Role, courseId: string, dto: GenerateOutlineDto) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    const outline = await this.ai.generateJson<{
      modules: OutlineModule[];
    }>([
      {
        role: 'system',
        content:
          'Tu es un assistant pédagogique. Génère un plan de cours structuré, progressif et exploitable dans un éditeur.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          title: course.title,
          description: course.description,
          domain: course.domain,
          level: course.level,
          objectives: course.objectives,
          context: dto.context,
        }),
      },
    ]);

    return outline.data;
  }

  async generateCourse(userId: string, role: Role, courseId: string, dto: GenerateCourseDto) {
    const course = await this.findOne(courseId);
    await this.assertCanManageEntity(userId, role, course.entityId);

    const outline = await this.generateOutline(userId, role, courseId, dto);
    if (!dto.persist) {
      return outline;
    }

    if (course.modules.length > 0 && !dto.replace) {
      throw new BadRequestException({
        code: 'COURSE_NOT_EMPTY',
        message: 'Le cours contient déjà du contenu. Utilise replace=true pour le remplacer.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.replace) {
        await tx.course.update({
          where: { id: courseId },
          data: {
            modules: {
              deleteMany: {},
            },
          },
        });
      }

      for (let moduleIndex = 0; moduleIndex < outline.modules.length; moduleIndex += 1) {
        const moduleDraft = outline.modules[moduleIndex];
        const module = await tx.module.create({
          data: {
            courseId,
            title: moduleDraft.title,
            description: moduleDraft.description,
            order: moduleIndex,
          },
        });

        for (let lessonIndex = 0; lessonIndex < moduleDraft.lessons.length; lessonIndex += 1) {
          const lessonDraft = moduleDraft.lessons[lessonIndex];
          await tx.lesson.create({
            data: {
              moduleId: module.id,
              title: lessonDraft.title,
              description: lessonDraft.description,
              order: lessonIndex,
              estimatedMinutes: lessonDraft.estimatedMinutes,
            },
          });
        }
      }

      return this.findOne(courseId);
    });
  }

  private courseInclude() {
    return {
      entity: true,
      createdBy: true,
      documents: {
        include: { chunks: true },
        orderBy: { createdAt: 'desc' as const },
      },
      modules: {
        orderBy: { order: 'asc' as const },
        include: {
          lessons: {
            orderBy: { order: 'asc' as const },
            include: {
              blocks: {
                orderBy: { order: 'asc' as const },
                include: {
                  quiz: {
                    include: {
                      questions: {
                        orderBy: { order: 'asc' as const },
                        include: {
                          answers: {
                            orderBy: { order: 'asc' as const },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    } satisfies Prisma.CourseInclude;
  }

  private async reorderItems(
    existingIds: string[],
    dto: ReorderDto,
    update: (id: string, order: number) => Prisma.PrismaPromise<unknown>,
  ) {
    const wanted = dto.items.map((item) => item.id);
    for (const id of wanted) {
      if (!existingIds.includes(id)) {
        throw new BadRequestException({ code: 'REORDER_INVALID', message: `ID inconnu: ${id}` });
      }
    }

    await this.prisma.$transaction(
      dto.items.map((item) => update(item.id, item.order)),
    );
  }

  private async assertCanManageEntity(userId: string, role: Role, entityId: string) {
    if (role === Role.ROOT) return;
    if (role !== Role.ADMIN) {
      throw new ForbiddenException('Accès refusé.');
    }

    const membership = await this.prisma.entityMember.findFirst({
      where: {
        userId,
        entityId,
        role: { in: [EntityRole.OWNER, EntityRole.ADMIN, EntityRole.INSTRUCTOR] },
      },
    });

    if (!membership) {
      throw new ForbiddenException('Vous ne gérez pas cette organisation.');
    }
  }

  private assertPublishable(course: CourseTree) {
    if (course.modules.length === 0) {
      throw new BadRequestException({
        code: 'COURSE_EMPTY',
        message: 'Le cours doit contenir au moins un module avant publication.',
      });
    }

    const lessons = course.modules.flatMap((module) => module.lessons);
    if (lessons.length === 0) {
      throw new BadRequestException({
        code: 'COURSE_EMPTY',
        message: 'Le cours doit contenir au moins une leçon avant publication.',
      });
    }

    const hasContent = lessons.some((lesson) => lesson.blocks.length > 0);
    if (!hasContent) {
      throw new BadRequestException({
        code: 'COURSE_EMPTY',
        message: 'Le cours doit contenir au moins un bloc avant publication.',
      });
    }
  }

  private chunkText(text: string, size = 1200): string[] {
    const chunks: string[] = [];
    for (let i = 0; i < text.length; i += size) {
      chunks.push(text.slice(i, i + size));
    }
    return chunks;
  }

  private slugify(value: string): string {
    return value
      .toLowerCase()
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}
