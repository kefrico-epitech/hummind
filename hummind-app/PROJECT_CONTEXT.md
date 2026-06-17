# Hummind — Project Context (v2.0)

Document de référence technique pour travailler rapidement sur le projet sans relire tout le code. Aucun secret ici.

> Mise à jour majeure : 2026-05-14. Suit la livraison de la branche `v4-staging` (Flow v2.0 complet — 9 phases + Sprint A/C).

## 1. Vue d'ensemble

Hummind est un produit B2B + B2C d'apprentissage assisté par IA. Architecture en deux applications :

| App | Stack | Rôle |
|---|---|---|
| `hummind-app/` | Next.js 16 App Router + React 19 + TS + Tailwind v4 + Redux Toolkit + next-intl (fr/en) + PostHog | Frontend (pages publiques, espace organisation, espace apprenant, console admin) |
| `hummind-backend/` | NestJS 11 sur Fastify 5 + Prisma 5 + PostgreSQL + Redis (BullMQ) + JWT + argon2 | API REST (auth, entités, cours, IA, contact, admin, GDPR…) |

L'IA tuteur s'appelle **Hummind**. Persona fixe (ton doux, tutoiement, célèbre les progrès) — voir [hummind-backend/src/ai/prompts/persona.ts](../hummind-backend/src/ai/prompts/persona.ts).

## 2. Scripts

### Frontend (`hummind-app/`)
- `pnpm dev` (Next dev, Turbopack)
- `pnpm build`
- `pnpm start`
- `pnpm lint`

### Backend (`hummind-backend/`)
- `pnpm start:dev` (nest start --watch)
- `pnpm build` (nest build)
- `pnpm prisma migrate deploy` (applique les migrations)
- `pnpm prisma db seed` (recrée le user ROOT `admin@hummind.com` / `admin123`)

## 3. Infra requise (docker-compose.dev.yml côté backend)

| Service | Port | Rôle |
|---|---|---|
| PostgreSQL 16 | 5433 | BDD applicative |
| Redis 7 | 6380 | BullMQ (emails async + futurs jobs) |

## 4. Modèle de rôles (Flow v2.0)

Deux axes :

| Niveau | Valeurs | Stocké dans |
|---|---|---|
| **Plateforme** (`PlatformRole`) | `ROOT` (équipe Hummind), `MEMBER` (défaut) | `User.platformRole` |
| **Entité contextuelle** (`EntityRole`) | `OWNER`, `ADMIN`, `INSTRUCTOR`, `LEARNER`, `VIEWER` | `EntityMember.role` |

L'API publique expose le platform role sous `user.role` (rétro-compat frontend).

## 5. Statuts utilisateur (`UserStatus`)

`INVITED` (compte créé par admin, mdp temp non finalisé) → `ACTIVE` → `DISABLED` ou `BANNED`. Soft-delete via `User.deletedAt` (anonymise email/firstname/lastname, conserve les FK pour préserver l'historique pédagogique).

## 6. Portes d'entrée pour créer un compte (pas d'inscription publique)

| Voie | Qui déclenche | Statut initial | mustChangePassword |
|---|---|---|---|
| `/demo` → ROOT accepte | ROOT | INVITED | true |
| Owner ajoute un membre (email inconnu) | OWNER/ADMIN d'une entité | INVITED | true |
| `/join/[code]` (lien public salle) | L'apprenant lui-même | INVITED → ACTIVE après OTP | false |

## 7. Pages clés (`hummind-app/`)

### Publiques
- `/` — Landing Hummind v2 (Hero, sections, FAQ, footer)
- `/product` — Page produit longue
- `/demo` — Form 3 sections (Vous / Organisation / Projet) + modal de succès
- `/join/[code]` — Inscription apprenant via lien public + OTP email
- Widget chat support flottant (kind=support → `/admin/contacts`)
- `/login`, `/first-login`, `/forgot-password`, `/recovery-password`, `/activate`

### Espace utilisateur
- `/organisation` — Liste des organisations (wizard 3-steps si aucune)
- `/organisation/[id]` — Détail, membres, départements, salles
- `/salle/[id]` — Détail + section **Lien public d'inscription** (toggle/copie/stats)
- `/learner/*` — Espace apprenant (cours + session live IA — branchement Hummind en cours)

### Console ROOT (`/admin/*`)
- `/admin/contacts` — Pipeline 3 actions (Accepter & créer compte / Contacter / Refuser) + Archive
- `/admin/users` — Liste, filtres, actions (Réactiver / Désactiver / Bannir)
- `/admin/audit-log` — Timeline des actions sensibles

## 8. Endpoints backend importants (préfixe `/api/v1`)

### Auth (rate-limit 5/min/IP)
- `POST /auth/signin` — retourne soit `{ token, user }`, soit `{ requiresPasswordChange, tempToken }`, soit `{ requiresTotp: true }`
- `POST /auth/finalize` — finalise un compte avec mdp temp
- `POST /auth/totp/setup` | `/auth/totp/enable` | `/auth/totp/disable` — 2FA TOTP user-managed
- `POST /auth/google` | `POST /auth/reset-password` | `POST /auth/recovery-password`

### Contact (rate-limit 3/min/IP)
- `POST /contact` — public, capture leads `/demo` et widget chat

### Admin (ROOT uniquement, sous `JwtAuthGuard + RolesGuard`)
- `GET/POST /admin/contacts` + `/:id/accept` | `/:id/contact` | `/:id/reject` | `DELETE /admin/users/:id`
- `GET /admin/users` + `PATCH /admin/users/:id/status`
- `GET /admin/audit-log`

### Public Join Link (Flow v2 §7)
- `POST /public-join-links` (OWNER/ADMIN d'une salle) | `GET ?entityId=` | `PATCH /:id` | `DELETE /:id`
- `GET /public/join-info/:code` (public)
- `POST /public/join/:code/signup` (rate-limit 5/min) → crée User INVITED + OTP 2h
- `POST /public/verify-email` (rate-limit 10/min)
- `POST /join/:code/accept` (auth, user existant rejoint la salle)

### IA Hummind (NestJS, sous JwtAuthGuard)
- `POST /ai/live-session` + `POST /ai/live-session/stream` (SSE)
- `POST /ai/live-tutor`
- `POST /ai/course-generate-progressive`
- `POST /ai/image-generate` | `/image-generate-batch` | `/image-search`

### GDPR
- `GET /users/me/export` — dump JSON complet
- `DELETE /users/me/account` — self soft-delete

## 9. Module AI Hummind (`hummind-backend/src/ai/`)

| Composant | Rôle |
|---|---|
| `prompts/persona.ts` | Persona Hummind v1.0.0 (identité, voix, interdits, gestion émotionnelle, sécurité) |
| `prompts/learner-profile.ts` | Bloc profil apprenant injecté par tour (cache OpenAI ephemeral 5 min) |
| `memory/memory.service.ts` | LearnerMemory + ConceptMastery (EMA bayésienne 0-1) |
| `memory/affective.service.ts` | AffectiveState log (mood + streaks) |
| `memory/mood-detector.service.ts` | gpt-4o-mini parallèle pour inférer le mood depuis les derniers messages apprenant |
| `memory/summarizer.service.ts` | Tous les 10 turns, rafraîchit `LearnerMemory.summary` (< 2 000 chars) |
| `usage/usage.service.ts` | AiUsageLog (tokens + coût µUSD) |
| `handlers/*` | live-session, live-session-stream, live-tutor, course-generate-progressive, image |

## 10. BullMQ + Redis (`src/queue/`)

Queue `mail` consommée par `MailProcessor` (concurrency 5). Jobs émis :
- email-confirmation, password-reset, entity-invitation, welcome
- account-created-by-root, account-created-by-admin, contact-rejected
- email-verification-otp, plain-text

Defaults : 3 attempts, backoff exponential 5 s, keep-completed 1 h, keep-failed 24 h.

## 11. Cron (`src/maintenance/`)

| Tâche | Cadence | Effet |
|---|---|---|
| dailyCleanup | tous les jours 03:00 | Purge OTP / VerificationToken / PasswordResetToken / RefreshToken expirés depuis +24 h. AiUsageLog > 90 j. |
| hourlyJoinLinkCleanup | toutes les heures | Purge PublicJoinLink désactivés et expirés depuis +7 j |

## 12. Rate-limit (Fastify, `src/main.ts`)

300/min/IP par défaut + per-route :
- `/auth/(signin|finalize|google)`, `/auth/(reset|recovery)-password` : 5/min/IP
- `/contact` : 3/min/IP
- `/public/join/:code/signup` : 5/min/IP
- `/public/verify-email` : 10/min/IP

Bucket par IP + pattern → un endpoint compromis ne dégrade pas les autres.

## 13. Audit log

Table `AdminAuditLog`. Actions tracées : `CONTACT_ACCEPTED`, `CONTACT_REJECTED`, `USER_CREATED_BY_ROOT`, `USER_BANNED`, `USER_DISABLED`, `USER_REACTIVATED`, `PUBLIC_JOIN_LINK_TOGGLED`. Service `AuditLogService.record(...)` fire-and-forget.

## 14. Variables d'environnement (noms uniquement, à mettre dans `.env`)

### Backend
- `DATABASE_URL`, `REDIS_HOST`, `REDIS_PORT`
- `JWT_SECRET`, `JWT_EXPIRES_IN`
- `GOOGLE_CLIENT_ID`, `COOKIE_SECRET`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM`
- `FRONTEND_URL`
- `OPENAI_API_KEY` (+ `OPENAI_*_MODEL` optionnels)
- `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD` (overridable)

### Frontend
- `NEXT_PUBLIC_NEST_API_URL`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`
- `NEXT_PUBLIC_CLOUDINARY_*`
- `OPENAI_API_KEY` (legacy — sera retiré quand toutes les routes Next IA seront supprimées)

## 15. Reste à faire (TODO non-bloquant)

### B — Brancher l'expérience apprenant sur Hummind AI
- Reécrire le composant live session learner pour consommer `AiService.streamLiveSession` (SSE)
- Afficher message tour-par-tour avec délai natural
- Suivi instructeur : page analytics par salle (progression moyenne, élèves en difficulté)

### D — Dette technique restante
- Finir le découpe `app/api/ai/live-session/route.ts` (1287 L) en `normalize.ts`, `evaluation.ts`, `policy.ts` (étape 1/types extraite) — OU le supprimer une fois le frontend bascule sur le backend Hummind AI
- Migrer `courseGeneration.ts` (1554 L) vers backend NestJS pour pouvoir supprimer `/api/ai/course-actions` et `/api/ai/hybrid-generate`
- Undo/redo en patches Immer dans `courseSlice` (snapshots complets actuellement)
- Unifier `components/course/*`, `components/user/course/*`, `components/courseV2/*` → un seul domaine

### E — DevX
- Push `v4-staging` vers GitHub (SSH bloqué localement, HTTPS recommandé)
- PR + revue
- Tests jest e2e

## 16. Dernière mise à jour

2026-05-14 — après livraison Flow v2.0 (Phases 1-9 + Sprint A + Sprint C).
