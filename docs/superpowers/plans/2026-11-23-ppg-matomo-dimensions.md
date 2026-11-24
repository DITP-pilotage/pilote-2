# Dimensions Matomo administrables (ppg) Implementation Plan

> **For agentic workers:** exécution inline (superpowers:executing-plans), choix permanent du user.

**Goal:** Modifier les numéros de dimensions Matomo de ppg depuis le panel administrateur, sans redéploiement.

**Architecture:** Module serveur `analytics` (table `analytics_dimension`, une requête, un handler, routeur tRPC). Le client lit la correspondance au démarrage par un client tRPC sans batch ; le tracker retient ses envois jusque-là.

**Tech Stack:** Prisma 7, tRPC, Awilix, Vitest, Playwright, react-hook-form.

**Spec:** `docs/superpowers/specs/2026-11-23-ppg-matomo-dimensions-design.md`

## Global Constraints

- Aucun package `@pilote/kpilote-*`. Identifiants techniques en anglais, textes en français, exports nommés.
- Numéros inchangés : `profil_pilote` 1, `conversation_id` 2, `llm_call_id` 3, `proposition_id` 4, `proposition_mode` 5, `type_question` 6, `nombre_choix` 7, `position_choix` 8, `environnement` 9.
- Numéro : entier de 1 à 999. Attente des envois : 3000 ms au plus.
- Ni `as never`, ni `as unknown`.

## Review Focus

1. Navigation pendant l'attente : l'événement garde l'URL de la page d'origine (tâche 2).
2. Réponse après le délai : les envois suivants portent les dimensions, rien n'est envoyé deux fois (tâche 2).
3. Page masquée puis réaffichée avant la réponse : idem (tâche 2).
4. Une clé retirée du code mais encore en base ne bloque pas son numéro (tâche 1).
5. Saisie `0`, `1.5`, `abc`, `1000` : refusée ; vide : retire la dimension (tâches 1 et 3).

---

### Task 1: Table, module serveur et routeur tRPC

**Files:**
- Create: `src/shared/analytics/dimensions.ts`, `src/database/prisma/migrations/20261123150000_analytics_dimension/migration.sql`, `src/server/analytics/{module.ts,queries/GetDimensionSlotsQuery.ts,handlers/SetDimensionSlotHandler.ts,infrastructure/trpc/analytics.ts}`
- Modify: `schema.prisma`, `moduleNames.ts`, `dependances.ts`, `appRouter.ts`, `categorieLogRouteurTRPC.ts`, `client/analytics/schema.ts`
- Test: `src/server/analytics/__tests__/{queries,handlers}/*.integration.test.ts`, `tests/gardes-panel-admin.spec.ts`

**Interfaces (Produces):**
- `ANALYTICS_DIMENSIONS`, `AnalyticsDimension`, `DimensionSlots = Partial<Record<AnalyticsDimension, number>>`, `MAX_DIMENSION_SLOT = 999`, `dimensionSlotSchema` (`z.number().int().min(1).max(999)`)
- `GetDimensionSlotsQuery.run(): Promise<DimensionSlots>` (clés connues seulement)
- `setDimensionSlotCommandSchema = { dimension: enum, slot: dimensionSlotSchema | null }`, `SetDimensionSlotHandler.execute(command): Promise<void>`
- Routeur `analytics` : `dimensionSlots` (public), `setDimensionSlot` (CSRF + `checkAdminPermission`)

- [ ] Tests d'intégration : la requête rend les clés connues et ignore `ancienne_cle` ; le handler crée, modifie, retire (sans erreur si déjà retirée), refuse par `ConflictError("Le numéro 2 est déjà utilisé par « conversation_id ».")` sans rien modifier, garde son propre numéro sans erreur, reprend le numéro d'une clé retirée du code ; le schéma refuse 0, 1.5, 1000 et une clé inconnue.
- [ ] Test : la migration donne les 9 numéros.
- [ ] Échec constaté, implémentation (P2002 → `ConflictError("Le numéro N vient d'être pris par une autre dimension.")`), succès : `pnpm -F @pilote/ppg exec vitest run --project server-integration src/server/analytics`
- [ ] E2E : `/panel-administrateur/dimensions-matomo` dans `ADMIN_ONLY_PAGES` ; `analytics.setDimensionSlot` refusée à un coordinateur, table inchangée.
- [ ] Commit

### Task 2: Attente des envois et lecture au démarrage

**Files:**
- Create: `src/client/analytics/loadDimensionSlots.ts` + test unitaire
- Modify: `client/analytics/{browser,analytics,pageViews.unit.test}.ts`, `analytics.unit.test.ts`, `browser.unit.test.ts`, `config.ts`, `.env.example`

**Interfaces (Produces):**
- `Analytics.setDimensionSlots(slots: DimensionSlots): void`
- `BrowserAnalyticsOptions.waitForDimensions?: { timeoutMs: number }`
- `DIMENSIONS_TIMEOUT_MS = 3000`
- `loadDimensionSlots(analytics: Analytics, fetchSlots?: () => Promise<DimensionSlots>): Promise<void>` ; en échec ne fait que libérer (`setDimensionSlots({})`) ; n'appelle rien si l'analytics est inactif.

- [ ] Tests `browser` (minuteurs simulés) : rien ne part avant `setDimensionSlots`, puis tout part dans l'ordre avec `dimension1` ; au bout de 3000 ms, part sans ; `pagehide` et `visibilitychange` masqué libèrent ; URL capturée à l'appel ; réponse tardive appliquée aux envois suivants, sans doublon ; sans `waitForDimensions`, envoi immédiat.
- [ ] Tests `loadDimensionSlots` : succès, échec, inactif.
- [ ] Échec constaté, implémentation, retrait de `parseDimensionSlots` et de `NEXT_PUBLIC_MATOMO_DIMENSIONS` ; `vitest run --project client src/client/analytics` vert, `git grep NEXT_PUBLIC_MATOMO_DIMENSIONS apps/` vide.
- [ ] Commit

### Task 3: Page du panel administrateur

**Files:**
- Create: `src/pages/panel-administrateur/dimensions-matomo.tsx`, `src/client/components/PagePanelAdministrateur/DimensionsMatomo/{DimensionsMatomoPanel,ModaleDimension,useDimensionForm,useTableauDimensions}`
- Modify: `MenuLateralPanelAdministrateur.tsx` (entrée après « Feature flipping »)

- [ ] Garde `getServerSideProps` identique à `formations.tsx`.
- [ ] Tableau : Dimension, N° Matomo (« Non configurée »), Modifier. Modale : champ « Numéro de la dimension dans Matomo », vide pour retirer, messages « Saisissez un nombre entier de 1 à 999. », erreurs serveur en toast.
- [ ] `pnpm -F @pilote/ppg lint` vert, e2e `gardes-panel-admin.spec.ts` vert.
- [ ] Commit
