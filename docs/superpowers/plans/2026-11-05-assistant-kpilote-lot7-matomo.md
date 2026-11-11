# Assistant kpilote — lot 7 (Matomo) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Tracer dans Matomo l'usage de l'assistant et ses signaux implicites, avec le socle analytics de kpilote.

**Architecture:** `analyticsEvents.assistant.*` dans kpilote-shared (contrat testé) ; logique pure dans `apps/kpilote-webapp/src/assistant/tracking.ts` (testée) ; appels `analytics.trackEvent` aux points d'action (provider, panneau, `Chat.onFinish`, actions de réponse, encarts, historique, bandeau).

**Tech Stack:** identique.

**Spec:** `docs/superpowers/specs/2026-11-05-assistant-kpilote-lot7-matomo-design.md`

## Global Constraints

Celles des lots précédents. Jamais de texte saisi ni d'identité dans un événement. Un événement par geste (pas de double envoi au re-rendu).

## Review Focus

1. Re-rendu ou remontage du panneau (changement de vue) → `prompt_proposition.view` pas renvoyé en boucle ; un par affichage de l'écran vide. Rendu non testé.
2. Réponse arrêtée → pas de `answer.complete` ni `answer.error`. Test : Task 2.
3. Question de la palette → `origine=palette`, pas `saisie`. Rendu non testé.
4. Lien cliqué hors message (en-tête, historique) → pas d'événement `response.link.*`. Rendu non testé.
5. Analytics inactif (dev, DNT) → aucun effet de bord. Couvert par le socle.

---

### Task 1: Contrat des événements

**Files:** Modify `packages/kpilote-shared/src/analytics/{schema,events,events.test}.ts`.

- [ ] Catégorie `kpilote.assistant` ; `analyticsEvents.assistant.*` pour chaque ligne de la spec ; entrées du `CONTRAT`. RED → GREEN ; lint ; commit `feature(PIL-1684): evenements matomo de l'assistant`.

### Task 2: Logique pure

**Files:** Create `apps/kpilote-webapp/src/assistant/tracking.ts` (+ test).

**Interfaces — Produces:** `questionType({ messages, fromProposition })`, `answerOutcomeEvent({ conversationId, message, isAbort, isError })`, `choicesPresentedEvent({ conversationId, message })`, `linkEvent(href)`, `pageType(pageContext)`, `llmCallIdOf(message)`.

- [ ] Tests RED → GREEN ; lint ; commit avec la tâche 3.

### Task 3: Branchement

**Files:** Modify `display/AssistantProvider.tsx`, `display/AssistantSurfaces.tsx`, `display/AssistantContent.tsx`, `display/ExperimentationBanner.tsx`, `history/HistoryMenu.tsx`, `AssistantPanel.tsx`, `emptyState/EmptyState.tsx`, `useAssistant.ts`, `ResponseActions.tsx`, `RapportEncart.tsx`, `CentreAideEncart.tsx`, `components/HeaderNav.tsx`.

- [ ] Chaque événement de la spec émis à son geste. Lint ; tests ; commit `feature(PIL-1684): suivi matomo de l'assistant`.

### Task 4: Vérification

- [ ] Lint + tests ; revue finale ; PR empilée sur `feat/PIL-1684-matomo-dimensions`.
