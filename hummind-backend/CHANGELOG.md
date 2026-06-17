# Changelog

All notable changes to the Hummind backend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- **Course Model**: Added `createdById` relation to link courses to their `User` creator (supporting "Créé par vous").
- **Course Model**: Changed `content` field type from `String?` to `Json?` to support rich content structures (AI, Step-by-Step).
- **Project**: Initialized `CHANGELOG.md` to track backend history.
- **Dashboard**: Added `GET /stats/dashboard/:entityId` endpoint to retrieve entity metrics (member count, courses, etc.) and recent activity.
- **Activity**: Integrated `ActivityService` to log creation, updates, and deletions for Courses and Entities, as well as membership changes.
- **Access Control**: Exposed `GET :entityId/join-requests` to list entity membership requests.
- **Global Dashboard**: Added `GET /stats/dashboard` to aggregate counts and activity across all owned entities (Organizations, Departments, Rooms).
- **Global Access Management**: Exposed `GET /entity-members/join-requests`, `POST .../approve`, and `POST .../reject` to manage membership requests globally across all managed entities.
- **Security**: Implemented recursive access checks for entity statistics (Parent Admin can view Child stats).

## [0.0.1] - 2026-02-11
### Initial
- Initial project structure with NestJS, Prisma, Fastify.
