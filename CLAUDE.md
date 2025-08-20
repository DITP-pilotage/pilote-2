# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

PILOTE is a territorial management tool for French government priority policies. It helps share objectives assigned to each project and track results to identify obstacles and provide necessary support.

This is a Next.js application with:
- Frontend: React 18 with TypeScript, styled-components, DSFR (Design System français)
- Backend: Next.js API routes with tRPC, Prisma ORM
- Database: PostgreSQL with multi-schema support (public, raw_data)
- Authentication: NextAuth.js with Keycloak integration
- Data processing: Separate data management service with dbt

## Development Commands

### Essential Commands
```bash
# Development server with pretty logging
npm run dev

# Build for production (includes migrations and seeding)
npm run build

# Production server
npm run start

# Database initialization (development)
npm run database:init

# Database migration
npm run database:migration
```

### Testing Commands
```bash
# Run all tests
npm run test

# Client-side tests only
npm run test:client

# Server-side tests only  
npm run test:server

# E2E tests with Playwright
npm run test:e2e
```

### Code Quality Commands
```bash
# Run all linters (ESLint, TypeScript, Stylelint)
npm run lint

# Auto-fix linting issues
npm run lint:fix

# Format code with Prettier
npm run format
```

## Architecture

### Frontend Structure (`src/client/`)
- **Components**: Page-specific components and shared `_commons` components
- **Stores**: Zustand state management for filters, territories, screen width
- **Utils**: Utility functions organized by domain (colors, dates, statistics, etc.)
- **Hooks**: Custom React hooks for specific functionality

### Backend Structure (`src/server/`)
- **Domain-driven architecture** with clear separation of concerns
- **Dependency injection** using Awilix container
- **CQRS pattern** with separate commands and queries
- **Repository pattern** with Prisma adapters

Key backend modules:
- `authentification/`: User authentication and API token management
- `chantiers/`: Main business logic for government projects
- `gestion-utilisateur/`: User management and permissions
- `import-indicateur/`: Data import and validation
- `fiche-conducteur/`: Project conductor sheets
- `fiche-territoriale/`: Territory sheets

### Database Schema
- Multi-schema PostgreSQL setup (`public`, `raw_data`)
- Prisma ORM with schema at `src/database/prisma/schema.prisma`
- Main entities: `chantier`, `indicateur`, `territoire`, `utilisateur`
- Complex relationships with territorial data and metrics

## Path Aliases

The project uses TypeScript path aliases:
- `@/components/*` → `src/client/components/*`
- `@/client/*` → `src/client/*`
- `@/server/*` → `src/server/*`
- `@/validation/*` → `src/validation/*`
- `@/config` → `src/config.ts`

## Data Management

The application includes a separate data processing pipeline in `data_management/`:
- Built with dbt (data build tool) and Python
- Handles data transformations and analytics
- Separate Docker setup for data jobs

## Environment Setup

Development setup requires:
1. PostgreSQL database
2. Environment files (see `.env.example`)
3. Keycloak for authentication
4. Optional: Docker for full stack setup

## Key Technologies

- **Frontend**: Next.js 14, React 18, TypeScript, Emotion/styled-components
- **Backend**: tRPC, Prisma 6, NextAuth.js, Awilix (DI)
- **Testing**: Jest, Playwright, Testing Library
- **Database**: PostgreSQL, Prisma migrations
- **Auth**: Keycloak integration
- **Validation**: Zod schemas
- **Charts**: Chart.js, ECharts
- **Design System**: DSFR (Système de design de l'État français)

## Working with Propositions de Valeur d'Avancement (PVA)

The system has workflows for managing advancement value propositions:
- Creating, accepting, refusing, and modifying propositions
- Email notifications via Brevo/SendinBlue
- Complex business logic in `chantiers/` and `indicateur-territoire-valeur-evenement/` modules

When working on PVA functionality, focus on:
- Domain models in respective domain folders
- Use cases that orchestrate business logic
- Repository patterns for data access
- Email service integrations for notifications