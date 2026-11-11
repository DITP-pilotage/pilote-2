# Assistant kpilote — lot 6 (accès et administration) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Accès à l'assistant par interrupteur général + utilisateurs autorisés, administré dans kpilote-admin, et vue admin pseudonymisée des conversations et retours.

**Architecture:** API : deux tables, `checkAssistantAccess` lu en base, routes `/assistant/admin/*` gardées ADMIN. Shared : schémas admin. kpilote-admin : proxy ouvert à `assistant/admin`, page `/assistant` (onglets Accès, Conversations), fiche `/assistant/conversations/$id`.

**Tech Stack:** Hono + zod-openapi, Prisma, vitest (tests d'intégration `integrationTest`), React + TanStack Router/Query, kpilote-ui.

**Spec:** `docs/superpowers/specs/2026-11-05-assistant-kpilote-lot6-acces-design.md`

## Global Constraints

Celles des lots précédents. Conventions Prisma kpilote (modèles FR camelCase, `@map` snake_case, `@@map` singulier). `updated_at` explicite dans un INSERT brut. `prisma generate --sql` après `migrate dev`. Aucune donnée d'identité dans les réponses admin.

## Review Focus

1. Utilisateur supprimé → son autorisation disparaît (cascade), pas d'erreur à la lecture. Test : Task 1.
2. Ligne de paramètres absente (base mal migrée) → accès refusé, pas de 500. Test : Task 1.
3. Clé API CONTRIBUTOR sur les routes admin → 403 ; utilisateur connecté → 403. Test : Task 2.
4. Page au-delà du total → liste vide, total correct. Test : Task 2.
5. Conversation sans appel ou appels sans évaluation → compteurs à 0, détail sans évaluation. Test : Task 2.

---

### Task 1: Tables et règle d'accès

**Files:** Modify `apps/kpilote-api/prisma/schema.prisma` (+ migration `<ts>_assistant_acces`), `src/assistant/access.ts` (+ test), `src/assistant/routes.ts`, tests existants qui passent par le chat.

**Interfaces — Produces:**
- `AssistantParametres { id Int @id @default(1), actif Boolean @default(false), updatedAt }` → `assistant_parametres`, une ligne insérée (`actif = false`).
- `AssistantAccesUtilisateur { utilisateurId @id (FK Utilisateur, cascade), createdAt }` → `assistant_acces_utilisateur`.
- `checkAssistantAccess(principal): Promise<boolean>` = `kind === 'user'` && paramètres actifs && utilisateur autorisé.

- [ ] Tests RED → GREEN : coupé → refusé ; actif + autorisé → accepté ; actif + non autorisé → refusé ; clé API → refusée ; sans ligne de paramètres → refusé ; utilisateur supprimé → autorisation supprimée. Routes du chat / conversations : accès donné dans les tests existants. Lint ; commit `feature(PIL-1684): acces a l'assistant par interrupteur et utilisateurs autorises`.

### Task 2: Routes admin

**Files:** Create `packages/kpilote-shared/src/assistant/admin.ts` (+ export), `apps/kpilote-api/src/assistant/admin/{routes,access,conversations}.ts` (+ tests) ; Modify `src/app.ts`.

**Interfaces — Produces:**
- `GET /assistant/admin/acces` → `{ actif, utilisateurs: UtilisateurApiModel[] }` (triés par e-mail).
- `PUT /assistant/admin/acces/actif` `{ actif }` → même réponse.
- `PUT|DELETE /assistant/admin/acces/utilisateurs/{utilisateurId}` → même réponse ; utilisateur inconnu → 404.
- `GET /assistant/admin/conversations?page&recherche&positif&negatif&commentaire&categorie` → `{ items: [{ id, titre, createdAt, updatedAt, tours, positifs, negatifs, commentaires }], total, page, taillePage: 25 }`.
- `GET /assistant/admin/conversations/{id}` → `{ id, titre, createdAt, updatedAt, messages, appels: [{ id, createdAt, modele, evaluation, categories, commentaire, inputTokens, outputTokens, dureeMs }] }`, 404 sinon.
- Toutes : `ensurePrincipal(isApiKeyAdmin, …)`.

- [ ] Tests RED → GREEN (Review Focus 3–5 compris, et aucun `principalId` dans les réponses). Lint ; commit `feature(PIL-1684): routes d'administration de l'assistant`.

### Task 3: kpilote-admin

**Files:** Modify `apps/kpilote-admin/src/server/api/router.ts` (+ test s'il existe), `routes/_authed/fonctionnalites.tsx` ; Create `api/assistant.ts`, `queries/assistant.ts`, `routes/_authed/assistant/index.tsx`, `routes/_authed/assistant/conversations.$id.tsx`, `lib/assistantTurns.ts` (+ test).

**Interfaces — Produces:** `assistantTurns(messages, appels)` → `[{ question, reponse, appel | null }]` : la n-ième question et la n-ième réponse texte, appariées au n-ième appel.

- [ ] Proxy : `assistant/admin(/…)` relayé, `assistant/chat` refusé (test). Onglet Accès : interrupteur (SegmentedField « Activé / Coupé »), `UtilisateurPicker`, liste avec retrait. Onglet Conversations : filtres et pagination dans l'URL, tableau, lien vers la fiche. Fiche : fil et retours par tour. Carte « Gérer l'assistant IA » sur l'accueil. Lint ; commit `feature(PIL-1684): page assistant dans kpilote-admin`.

### Task 4: Vérification

- [ ] Lint + tests (shared, api, webapp, admin) ; revue finale ; PR empilée sur `feat/PIL-1684-assistant-confort`.
