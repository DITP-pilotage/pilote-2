# kpilote — dimensions Matomo administrables Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Correspondance clé de contexte → dimension Matomo en base, administrée dans kpilote-admin, appliquée par le tracker de la webapp.

**Architecture:** API : table + `src/analytics/` (routes, persistance). Shared : schémas `analytics/dimensions.ts` ; tracker (`analytics/browser.ts`) avec attente des dimensions. Webapp : chargement au démarrage. kpilote-admin : proxy, page, carte.

**Tech Stack:** identique.

**Spec:** `docs/superpowers/specs/2026-11-05-kpilote-matomo-dimensions-design.md`

## Global Constraints

Celles des lots précédents. Ajouter `@/analytics/*` aux paths du tsconfig de kpilote-api. L'analytics ne casse jamais l'application (échec de lecture → envoi sans dimensions).

## Review Focus

1. API injoignable au démarrage → les événements partent quand même, sans dimensions, au bout de 3 s. Test : Task 2.
2. Deux clés vers le même numéro → refusé (409), pas d'écrasement silencieux. Test : Task 1.
3. Analytics inactif (dev, DNT) → aucune requête vers l'API de dimensions inutile ne bloque le démarrage. Rendu non testé.
4. Clé renommée = suppression + ajout (la clé est l'identifiant). Rendu non testé.
5. Événements émis pendant l'attente → envoyés dans l'ordre, avec leur page d'origine. Test : Task 2.

---

### Task 1: Table et routes

**Files:** Modify `apps/kpilote-api/prisma/schema.prisma` (+ migration `<ts>_analytics_dimension`), `tsconfig.json`, `src/app.ts` ; Create `packages/kpilote-shared/src/analytics/dimensions.ts` (+ export), `apps/kpilote-api/src/analytics/{routes,dimensions}.ts` (+ test).

**Interfaces — Produces:** `analyticsDimensionSchema = { cle, slot, nom }`, `analyticsDimensionListSchema = AnalyticsDimension[]`, `upsertAnalyticsDimensionBodySchema = { slot, nom }`, `toDimensionSlots(dimensions): Record<string, number>`.

- [ ] Tests RED → GREEN (Review Focus 2 compris). Lint ; commit `feature(PIL-1684): dimensions matomo en base`.

### Task 2: Tracker et webapp

**Files:** Modify `packages/kpilote-shared/src/analytics/browser.ts` (+ test), `apps/kpilote-webapp/src/analytics/tracker.ts`, `src/main.tsx` ; Create `apps/kpilote-webapp/src/analytics/dimensions.ts`.

**Interfaces — Produces:** `BrowserAnalyticsOptions.waitForDimensions?: boolean` ; `Analytics.setDimensionSlots(slots)` (libère l'attente) ; `loadDimensionSlots(): Promise<void>` (webapp, délai 3 s).

- [ ] Tests RED → GREEN (Review Focus 1 et 5). Lint ; commit `feature(PIL-1684): le tracker applique les dimensions matomo`.

### Task 3: kpilote-admin

**Files:** Modify `src/server/api/router.ts` (+ test), `routes/_authed/fonctionnalites.tsx` ; Create `api/analyticsDimensions.ts`, `queries/analyticsDimensions.ts`, `routes/_authed/dimensions-matomo.tsx`.

- [ ] Proxy `analytics/dimensions(/…)` ; page liste + formulaire + suppression, verrou PROD. Lint ; commit `feature(PIL-1684): page des dimensions matomo dans kpilote-admin`.

### Task 4: Vérification

- [ ] Lint + tests ; revue finale ; PR empilée sur `feat/PIL-1684-assistant-acces`.
