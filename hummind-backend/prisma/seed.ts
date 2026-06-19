import {
  BlockType,
  CourseStatus,
  CourseVisibility,
  EntityRole,
  EntityType,
  PrismaClient,
  QuestionType,
  Role,
  SubscriptionStatus,
  SubscriptionTier,
  TutorRole,
} from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function upsertUser(params: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: Role;
  profileCompleted?: boolean;
  onboardingCompleted?: boolean;
  mustChangePassword?: boolean;
}) {
  const passwordHash = await argon2.hash(params.password, { type: argon2.argon2id });

  return prisma.user.upsert({
    where: { email: params.email },
    update: {
      passwordHash,
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role,
      profileCompleted: params.profileCompleted ?? true,
      onboardingCompleted: params.onboardingCompleted ?? true,
      mustChangePassword: params.mustChangePassword ?? false,
    },
    create: {
      email: params.email,
      passwordHash,
      firstName: params.firstName,
      lastName: params.lastName,
      role: params.role,
      profileCompleted: params.profileCompleted ?? true,
      onboardingCompleted: params.onboardingCompleted ?? true,
      mustChangePassword: params.mustChangePassword ?? false,
    },
  });
}

type DemoOrgSeed = {
  name: string;
  city: string;
  country: string;
  ownerEmail: string;
  invitationCode: string;
  courseSlug: string;
  courseTitle: string;
  courseDescription: string;
  domain: string;
  level: string;
  tier: SubscriptionTier;
  tokensLimit: number;
};

async function ensureDemoCourse(orgId: string, ownerId: string, org: DemoOrgSeed) {
  let course = await prisma.course.findFirst({
    where: { entityId: orgId, slug: org.courseSlug },
    include: {
      modules: {
        include: {
          lessons: {
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
          },
        },
      },
    },
  });

  if (!course) {
    course = await prisma.course.create({
      data: {
        entityId: orgId,
        createdById: ownerId,
        slug: org.courseSlug,
        title: org.courseTitle,
        description: org.courseDescription,
        domain: org.domain,
        level: org.level,
        objectives: [
          'Comprendre le flux de création',
          'Tester les modules et leçons',
          'Préparer la publication',
        ],
        status: CourseStatus.DRAFT,
        visibility: CourseVisibility.UNLIMITED,
        modules: {
          create: [
            {
              title: 'Prise en main',
              description: 'Structure de départ pour tester l’éditeur.',
              order: 0,
              lessons: {
                create: [
                  {
                    title: 'Bienvenue',
                    description: 'Découvrir le fonctionnement de la plateforme.',
                    order: 0,
                    estimatedMinutes: 5,
                    blocks: {
                      create: [
                        {
                          type: BlockType.CONTENT,
                          order: 0,
                          payload: {
                            kind: 'markdown',
                            text: `Bienvenue dans ${org.name}.`,
                          },
                        },
                        {
                          type: BlockType.QUIZ,
                          order: 1,
                          payload: {
                            kind: 'quiz',
                            title: 'Quiz de démarrage',
                          },
                          quiz: {
                            create: {
                              title: 'Quiz de démarrage',
                              passingScore: 70,
                              shuffle: false,
                              questions: {
                                create: [
                                  {
                                    prompt: 'Quel est le rôle de Hummind ?',
                                    type: QuestionType.SINGLE_CHOICE,
                                    order: 0,
                                    points: 1,
                                    answers: {
                                      create: [
                                        {
                                          label: 'Accompagner l’apprentissage',
                                          isCorrect: true,
                                          order: 0,
                                        },
                                        {
                                          label: 'Remplacer le formateur',
                                          isCorrect: false,
                                          order: 1,
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      include: {
        modules: {
          include: {
            lessons: {
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
            },
          },
        },
      },
    });
  }

  const lesson = course.modules[0]?.lessons[0];
  if (lesson) {
    const learner = await prisma.user.findUnique({
      where: { email: 'kefrico99@gmail.com' },
    });

    if (learner) {
      const enrollment = await prisma.enrollment.upsert({
        where: {
          userId_courseId: {
            userId: learner.id,
            courseId: course.id,
          },
        },
        update: {
          status: 'ACTIVE',
        },
        create: {
          userId: learner.id,
          courseId: course.id,
          status: 'ACTIVE',
        },
      });

      await prisma.lessonProgress.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollment.id,
            lessonId: lesson.id,
          },
        },
        update: {
          status: 'IN_PROGRESS',
        },
        create: {
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          status: 'IN_PROGRESS',
        },
      });

      const conversation = await prisma.tutorConversation.upsert({
        where: {
          enrollmentId_lessonId: {
            enrollmentId: enrollment.id,
            lessonId: lesson.id,
          },
        },
        update: {
          summary: `Conversation initiale de démonstration pour ${org.name}.`,
          covered: ['Bienvenue', 'Fonctionnement général'],
        },
        create: {
          enrollmentId: enrollment.id,
          lessonId: lesson.id,
          summary: `Conversation initiale de démonstration pour ${org.name}.`,
          covered: ['Bienvenue', 'Fonctionnement général'],
        },
      });

      const messageCount = await prisma.tutorMessage.count({
        where: { conversationId: conversation.id },
      });

      if (messageCount === 0) {
        await prisma.tutorMessage.createMany({
          data: [
            {
              conversationId: conversation.id,
              role: TutorRole.SYSTEM,
              content:
                "Tu es Hummind, un tuteur doux, poli et motivant. Aide l'apprenant à se repérer.",
              tokensUsed: 0,
            },
            {
              conversationId: conversation.id,
              role: TutorRole.ASSISTANT,
              content: 'Bonjour ! Je vais vous accompagner pas à pas dans ce premier cours.',
              tokensUsed: 24,
            },
          ],
        });
      }
    }
  }

  return course;
}

async function main(): Promise<void> {
  const root = await upsertUser({
    email: process.env.ROOT_EMAIL ?? 'root@hummind.com',
    password: process.env.ROOT_PASSWORD ?? 'Hummind!2025',
    firstName: 'Root',
    lastName: 'Admin',
    role: Role.ROOT,
  });

  const admin = await upsertUser({
    email: 'rogerfercusson@gmail.com',
    password: 'Hummind!2025',
    firstName: 'Roger',
    lastName: 'Fercusson',
    role: Role.ADMIN,
  });

  const learner = await upsertUser({
    email: 'kefrico99@gmail.com',
    password: 'Hummind!2025',
    firstName: 'Kefrico',
    lastName: 'Learner',
    role: Role.USER,
    profileCompleted: true,
    onboardingCompleted: true,
  });

  const demoOrgs: DemoOrgSeed[] = [
    {
      name: 'Hummind Academy',
      city: 'Paris',
      country: 'FR',
      ownerEmail: admin.email,
      invitationCode: 'HUMMIND-DEMO',
      courseSlug: 'premiers-pas-hummind',
      courseTitle: 'Premiers pas avec Hummind',
      courseDescription: 'Cours de démonstration pour valider le socle backend.',
      domain: 'IA',
      level: 'Débutant',
      tier: SubscriptionTier.BASIC,
      tokensLimit: 100000,
    },
    {
      name: 'Atelier Hummind',
      city: 'Lyon',
      country: 'FR',
      ownerEmail: admin.email,
      invitationCode: 'HUMMIND-ATELIER',
      courseSlug: 'atelier-pedagogie-ia',
      courseTitle: 'Atelier pédagogie IA',
      courseDescription: 'Deuxième espace de test pour créer un cours rapidement.',
      domain: 'Pédagogie',
      level: 'Intermédiaire',
      tier: SubscriptionTier.BASIC,
      tokensLimit: 100000,
    },
    {
      name: 'Hummind Lab',
      city: 'Remote',
      country: 'FR',
      ownerEmail: root.email,
      invitationCode: 'HUMMIND-LAB',
      courseSlug: 'laboratoire-ia',
      courseTitle: 'Laboratoire IA',
      courseDescription: 'Organisation technique pour tester un autre contexte de création.',
      domain: 'IA Avancée',
      level: 'Avancé',
      tier: SubscriptionTier.PREMIUM,
      tokensLimit: 250000,
    },
  ];

  const summaries: Array<{ name: string; id: string; courseId: string }> = [];

  for (const org of demoOrgs) {
    const owner = org.ownerEmail === root.email ? root : admin;

    const entity =
      (await prisma.entity.findFirst({
        where: { parentId: null, name: org.name },
      })) ??
      (await prisma.entity.create({
        data: {
          type: EntityType.ORGANISATION,
          name: org.name,
          description: `Organisation de démonstration pour ${org.name}.`,
          country: org.country,
          city: org.city,
        },
      }));

    await prisma.entity.update({
      where: { id: entity.id },
      data: {
        type: EntityType.ORGANISATION,
        description: `Organisation de démonstration pour ${org.name}.`,
        country: org.country,
        city: org.city,
      },
    });

    await prisma.entityMember.upsert({
      where: {
        entityId_email: {
          entityId: entity.id,
          email: owner.email,
        },
      },
      update: {
        userId: owner.id,
        role: EntityRole.OWNER,
        status: 'ACTIVE',
      },
      create: {
        entityId: entity.id,
        userId: owner.id,
        email: owner.email,
        role: EntityRole.OWNER,
        status: 'ACTIVE',
      },
    });

    await prisma.entityMember.upsert({
      where: {
        entityId_email: {
          entityId: entity.id,
          email: learner.email,
        },
      },
      update: {
        userId: learner.id,
        role: EntityRole.LEARNER,
        status: 'ACTIVE',
      },
      create: {
        entityId: entity.id,
        userId: learner.id,
        email: learner.email,
        role: EntityRole.LEARNER,
        status: 'ACTIVE',
      },
    });

    await prisma.entityInvitation.upsert({
      where: { entityId: entity.id },
      update: { code: org.invitationCode, active: true },
      create: {
        entityId: entity.id,
        code: org.invitationCode,
        active: true,
      },
    });

    await prisma.subscription.upsert({
      where: { entityId: entity.id },
      update: {
        tier: org.tier,
        status: SubscriptionStatus.ACTIVE,
        tokensLimit: org.tokensLimit,
      },
      create: {
        entityId: entity.id,
        tier: org.tier,
        status: SubscriptionStatus.ACTIVE,
        tokensLimit: org.tokensLimit,
      },
    });

    const course = await ensureDemoCourse(entity.id, owner.id, org);
    summaries.push({ name: entity.name, id: entity.id, courseId: course.id });
  }

  await prisma.learnerProfile.upsert({
    where: { userId: learner.id },
    update: {
      summary: 'Apprenant de démonstration. Préfère un accompagnement progressif.',
    },
    create: {
      userId: learner.id,
      summary: 'Apprenant de démonstration. Préfère un accompagnement progressif.',
    },
  });

  await prisma.gamificationProfile.upsert({
    where: { userId: learner.id },
    update: {
      xp: 120,
      level: 2,
      currentStreak: 3,
      longestStreak: 5,
      dailyXp: 20,
      badges: ['welcome', 'starter'],
    },
    create: {
      userId: learner.id,
      xp: 120,
      level: 2,
      currentStreak: 3,
      longestStreak: 5,
      dailyXp: 20,
      badges: ['welcome', 'starter'],
    },
  });

  // eslint-disable-next-line no-console
  console.log(`✅ ROOT prêt : ${root.email}`);
  // eslint-disable-next-line no-console
  console.log(`✅ ADMIN prêt : ${admin.email}`);
  // eslint-disable-next-line no-console
  console.log(`✅ APPRENANT prêt : ${learner.email}`);

  for (const item of summaries) {
    // eslint-disable-next-line no-console
    console.log(`✅ Organisation seed : ${item.name} (${item.id})`);
    // eslint-disable-next-line no-console
    console.log(`   ↳ cours de départ : ${item.courseId}`);
  }
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
