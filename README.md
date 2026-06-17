# Hummind — Plateforme d'apprentissage augmentée par l'IA

> **README global — architecture cible « v1 ».**
> Ce document décrit l'architecture v1 de Hummind (backend NestJS + frontend Next.js).
> ⚠️ **État actuel du disque** : la v1 a été accidentellement écrasée par l'ancienne version (`_archive`, dite « v0 », routes `/fr`, modules `entity`/`module`/`queue`…). Ce README est le **plan de reconstruction** de la v1 et reflète la cible, pas le code présent dans `hummind-app/` et `hummind-backend/` aujourd'hui.

---

## 1. Vision produit

Hummind permet à des **organisations** (écoles, centres de formation) de créer des **cours** et de les diffuser à des **apprenants** via un **tuteur IA conversationnel**. Le tuteur — nommé **Hummind**, ton doux, poli et motivant — diffuse les leçons au fil d'un chat streamé, s'adapte au profil de l'apprenant, et l'expérience est gamifiée (XP, niveaux, séries, badges, défis).

Trois espaces, strictement séparés par rôle :
- **Apprenant** (`USER`) → `/learner/*`
- **Admin d'organisation** (`ADMIN`) → `/espace/*`
- **Super-admin** (`ROOT`) → `/admin/*`

---

## 2. Structure du monorepo

```
hummind-v1/
├── hummind-backend/     # API NestJS + Fastify + Prisma (port 5500)
├── hummind-app/         # Frontend Next.js 16 (port 4000)
├── figma/               # Maquettes de référence (PNG)
└── _archive/            # Ancienne version v0 (NE PAS utiliser comme base v1)
```

> La racine `hummind-v1/` n'est **pas** un dépôt git. `_archive/hummind-app` a son propre `.git` (v0). **Recommandation forte : initialiser un dépôt git à la racine dès la reconstruction** pour éviter toute nouvelle perte.

---

## 3. Backend — `hummind-backend/` (port 5500)

### Stack
NestJS 11 · Fastify 5 · Prisma 5 (PostgreSQL) · @nestjs/jwt + argon2 · OpenAI (REST, sans SDK) · class-validator/zod · nodemailer · pino · @nestjs/swagger · @nestjs/schedule · pdf-parse + mammoth (extraction de documents).

API préfixée **`/api/v1`**. Scripts : `start:dev` (watch), `build`, `start:prod`, `seed`, `test`, `prisma:migrate`, `prisma:generate`.

### Authentification
JWT par **cookies httpOnly** : `hm_session` (access, ~15 min) + `hm_refresh` (refresh, ~30 j, **rotation** + stockage haché en base pour révocation). Hachage des mots de passe en **argon2**. Gardes : `JwtAuthGuard`, `RolesGuard` + `@Roles(...)`. Rôles : `ROOT` / `ADMIN` / `USER`.

### Modules `src/`
| Module | Responsabilité | Routes clés |
|---|---|---|
| **auth** | Connexion, refresh, profil, mot de passe | `POST /auth/signin`, `/refresh`, `/signout`, `GET /auth/me`, `PATCH /auth/profile`, `POST /auth/change-password` |
| **users** | CRUD utilisateurs (ROOT) | `POST/GET/PATCH/DELETE /users` |
| **contact** | Demandes de démo publiques | `POST /contact` |
| **join** | Liens d'invitation publics | `GET /join/:code`, `POST /join/:code/signup`, `/request` |
| **admin** | Dashboard ROOT (stats, contacts) | `GET /admin/stats`, `/admin/contacts…`, `POST …/accept` `/reject` |
| **org** | Hiérarchie Entity (ORG→DÉPT→SALLE), membres, invitations, demandes d'accès, cours | `GET /org/mine`, `/org/stats`, `POST /org/:id/children` `/courses`, `…/members…`, `…/access-requests…` |
| **courses** | Builder de cours (modules→leçons→blocs→quiz), publication, génération IA, documents RAG | `GET/PATCH/DELETE /courses/:id`, `POST …/publish` `/unpublish`, `…/modules` `…/lessons` `…/blocks` (+ `/reorder`), `POST …/ai/generate-outline` `/generate-course` `/generate-lesson`, `…/documents` |
| **ai** | Façade OpenAI (gpt-4o-mini) + provider stub | génération leçon/plan/contenu, évaluation apprenant, synthèse mémoire, embeddings (text-embedding-3-small) |
| **tutor** | Tuteur conversationnel **streamé** | `GET /learner/tutor/:courseId/:lessonId`, `POST …/message` (stream) |
| **learner** | Espace apprenant : progression, onboarding, quiz, certificats | `GET /learner/courses…` `/gamification` `/leaderboard` `/challenges` `/onboarding` `/certificates`, `POST /learner/lessons/:id/start` `/complete`, `/quizzes/:id/attempts` |
| **gamification** | XP, niveaux, séries, badges, défis hebdo | exposé via `learner` (LESSON_COMPLETED=50, QUIZ_PASSED=30) |
| **notifications** | Cloche in-app + rappels de série planifiés | `GET /notifications`, `/unread-count`, `POST /read-all`, `/:id/read` |
| **support** | Chatbot public (FAQ) + desk admin | `GET /support/faqs`, `POST /support/start` `/messages`, `…/admin/support/…` |
| **subscription** | Abonnement org + quota de tokens IA | `GET /org/subscription` `/plans` `/history`, `POST …/upgrade` (tiers DEMO/BASIC/PREMIUM/VIP) |
| **mail** | Envoi SMTP (nodemailer) | templates HTML |
| **health** | Liveness/readiness | `GET /health` |
| **prisma / config / common** | PrismaService · validation env (zod) · filtres/erreurs | — |

### Modèle de données (Prisma — principaux modèles)
- **Identité & org** : `User`, `RefreshToken`, `ContactRequest`, `Entity` (arbre ORGANISATION/DEPARTEMENT/SALLE/INDEPENDANT), `EntityMember` (OWNER/ADMIN/INSTRUCTOR/LEARNER/VIEWER), `EntityInvitation`, `AccessRequest`, `Subscription`, `SubscriptionEvent`.
- **Contenu** : `Course` (DRAFT/PUBLISHED/ARCHIVED ; visibility UNLIMITED/LIMITED/PUBLIC), `Module`, `Lesson`, `Block` (TITLE/CONTENT/IMAGE/CODE/MATH/TABLE/CHART/DRAWING/QUIZ/EXERCISE), `Quiz`, `Question`, `Answer`.
- **Progression** : `Enrollment`, `LessonProgress`, `QuizAttempt`, `Certificate`.
- **Tutorat & perso** : `TutorConversation`, `TutorMessage`, `LearnerProfile`, `GamificationProfile`, `WeeklyChallenge`.
- **RAG** : `CourseDocument`, `CourseDocumentChunk` (embeddings 1536d).
- **Support & notifs** : `SupportConversation`, `SupportMessage`, `SupportFaq`, `Notification`.

> Note : le champ `Course.mode` (STEP_BY_STEP/HYBRID/AI_ONLY) existe en base et sert au **gating « pas à pas » côté apprenant**, mais n'est **plus exposé à l'enseignant** (décision produit : retiré de l'authoring).

### IA
- Provider sélectionné par `AI_PROVIDER` (défaut `openai`) ; repli automatique sur un **stub** si `OPENAI_API_KEY` absent.
- **Génération de cours** : plan (outline) → l'enseignant ajuste → rédaction complète des leçons + quiz. Peut s'appuyer sur des **documents source** (PDF/Word/texte → extraction → chunks → embeddings).
- **Tuteur** : prompt système = objectifs du cours + contenu de la leçon + profil apprenant ; réponse **streamée** ; synthèse périodique de la mémoire apprenant ; débit de tokens sur le quota de l'organisation.

### Scripts utiles (`hummind-backend/scripts/`)
`seed-root`, `make-test-admin`, `add-learner`, `seed-faq`, `seed-test-dashboard`, `ai-generate-course`, `nuke-db` / `nuke-db-keep-root`, `verify-smtp`.

---

## 4. Frontend — `hummind-app/` (port 4000)

### Stack
Next.js 16 (App Router, **React 19**) · Tailwind CSS v4 · Zustand · TanStack React Query 5 · React Hook Form + Zod · Radix UI · Framer Motion · Lucide. Dev : `next dev -p 4000`. Tests : Vitest + Playwright.

### Organisation
```
src/
├── design-system/      # tokens (couleurs, motion), primitives (Button, Input…),
│                       # composants layout/content/animated, theme.config.ts
├── features/           # une feature par domaine métier (voir ci-dessous)
└── shared/
    ├── api/http.ts     # client fetch typé (credentials: include + refresh auto sur 401)
    ├── auth/session.ts # getSession / requireSession / requireRole (Server Components)
    ├── config/env.ts   # vars NEXT_PUBLIC_* validées par zod
    └── providers/      # React Query provider
app/                    # App Router (voir routes)
```

### Routes (App Router)
- **Public** : `/`, `/produit`, `/demo`, `/apercu/cours/[id]`, `/rejoindre/[code]`, `/conditions`, `/confidentialite`, `/onboarding`, `/login`, `/change-password`, `/complete-profile`.
- **Apprenant** (`/learner/*`, garde `role=USER`) : dashboard, `cours/[courseId]` (+ `/chat` tuteur streamé, `/live` lecteur), `hummind` (chat), `recompenses` (gamification), `certificats/[id]`, `onboarding`, `notifications`, `parametres`.
- **Admin org** (`/espace/*`, garde `role=ADMIN`) : dashboard, `cours` (+ `cours/[id]/edit` éditeur), `organisation/[id]`, `membres`, `acces`, `notifications`, `parametres`.
- **Super-admin** (`/admin/*`, garde `role=ROOT`) : dashboard, `requests/[id]`, `support`.

### Features (`src/features/`)
`auth`, `admin` (inbox contacts), `cours` (éditeur + génération IA), `org` (organisation, salles, membres, demandes d'accès), `learner` (cœur : **TutorChat** streamé, **RewardsView** gamification, CoursePlayer, InlineQuiz, certificats, onboarding), `join`, `demo`, `support`, `subscription`, `legal`.

### Communication front ↔ back
`http<T>()` (`src/shared/api/http.ts`) : `credentials: 'include'` (cookies httpOnly) ; sur **401**, tente `POST /auth/refresh` une fois puis rejoue la requête, sinon redirige vers `/login`. Base URL : `${NEXT_PUBLIC_API_URL}/api/v1`.

### Tuteur & gamification
- **Tuteur** (`features/learner` : `TutorChat.tsx`, `tutor.ts`) : `streamTutorMessage()` lit un `ReadableStream` token par token (`onDelta`), affiche les bulles, intègre quiz inline et progression des leçons.
- **Gamification** (`RewardsView.tsx`) : niveau/XP, séries (🔥), objectif quotidien (anneau), badges, défis hebdo, classement de salle, profil d'apprentissage inféré par l'IA.

---

## 5. Création de cours (parcours cible retenu)

Décision UX validée : **pas de wizard**. On garde l'enseignant dans son flux.

```
[+ Créer un cours]
      │
      ▼
 Modal de création  ──►  Éditeur complet  ──►  Publier quand prêt
 (titre, domaine,        (modules→leçons→        (confirmation +
  niveau, description,     blocs, IA, import        rappel visibilité/
  objectifs ; salle        docs) ; ⚙️ Paramètres     dates)
  selon contexte)          éditables à tout moment
```

- **Modal de création** (`CreateCourseModal.tsx`) : informations essentielles (mêmes champs qu'avant), salle déduite du contexte (depuis une salle) ou sélecteur. → crée le cours en DRAFT puis ouvre directement l'éditeur.
- **Éditeur** (`CourseEditor.tsx`) : arbre modules/leçons/blocs, génération IA (plan + leçon unique), import de documents.
- **Panneau « Paramètres du cours »** (`CourseSettingsPanel.tsx`, slide-over) : description, domaine, niveau, objectifs, **visibilité**, **période d'accès** — éditables à tout moment.
- **Publication à la demande** : bouton Publier + confirmation faisant remonter visibilité/dates (filet de sécurité ; le backend refuse un cours vide via `COURSE_EMPTY`).

### Édition fluide (à réimplémenter)
Architecture conçue pour l'éditeur (perdue dans l'écrasement, à reconstruire) :
- **Modèle local** comme source de vérité (arbre avec `localId` stables + `serverId`), mutations instantanées.
- **Moteur de sync** : diff modèle ↔ état serveur → POST/PATCH/DELETE/reorder en file débouncée (l'UI n'attend jamais le réseau).
- **Undo/Redo complet** (texte + structure) via historique de snapshots ; raccourcis Ctrl/⌘+Z et Ctrl/⌘+Maj+Z ; regroupement de la frappe.
- **Sauvegarde locale (filet)** dans `localStorage` (`hm:course-draft:<id>`) + bandeau « Restaurer le brouillon local » à la réouverture + indicateur « Enregistré / Enregistrement… / Hors ligne ».

---

## 6. Démarrer en local

```bash
# Backend
cd hummind-backend
pnpm install
pnpm prisma migrate dev      # applique le schéma
pnpm seed                    # ROOT + données de test
pnpm start:dev               # http://localhost:5500 (API /api/v1, Swagger)

# Frontend (dans un autre terminal)
cd hummind-app
pnpm install
pnpm dev                     # http://localhost:4000
```

Prérequis : PostgreSQL en local (voir `DATABASE_URL`), et un Mailhog/SMTP pour les emails en dev.

---

## 7. Variables d'environnement (noms uniquement)

**Backend** : `NODE_ENV`, `PORT` (5500), `CORS_ORIGIN`, `APP_URL`, `DATABASE_URL`, `REDIS_URL`, `LOG_LEVEL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL`, `COOKIE_DOMAIN`, `COOKIE_SECURE`, `SMTP_HOST/PORT/USER/PASS/SECURE`, `MAIL_FROM`, `AI_PROVIDER`, `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_EMBED_MODEL`, `TUTOR_MODEL`.

**Frontend** : `NEXT_PUBLIC_API_URL` (défaut `http://localhost:5500`), `NEXT_PUBLIC_APP_NAME` (`Hummind`).

---

## 8. Comptes de test

- **Admin** : `rogerfercusson@gmail.com`
- **Apprenant** : `kefrico99@gmail.com`

(Recréés via les scripts seed du backend.)

---

## 9. Conventions

- Modèles IA par défaut : **gpt-4o-mini** (génération + tuteur), **text-embedding-3-small** (RAG).
- Persona du tuteur : **Hummind**, ton doux/poli/motivant.
- Le tuteur et la génération exploitent **titre, domaine, niveau, objectifs** du cours → renseigner ces champs améliore directement la qualité IA.
- Séparation stricte des espaces par rôle (gardes serveur + redirections layout).

---

*Document maintenu comme référence de reconstruction de la v1. À faire évoluer au fur et à mesure que le code est rebâti — et à versionner sous git dès le départ.*
