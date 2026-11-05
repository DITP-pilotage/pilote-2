# Assistant kpilote — lot 5b (confort du chat) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Écran vide avec propositions selon la page, bandeau d'expérimentation, dictée vocale, « Suivre la réponse ».

**Architecture:** Logique pure testée (`propositions`, `followResponse`, `transcript`) ; composants `EmptyState`, `ExperimentationBanner`, `useSpeechRecognition`, branchés dans `AssistantPanel` et `AssistantContent`. Rien côté API : le prompt système désigne déjà les entités affichées par « cet indicateur ».

**Tech Stack:** identique au lot 5a ; `lucide-react` pour les icônes.

**Spec:** `docs/superpowers/specs/2026-11-04-assistant-kpilote-lot5-vues-design.md`

## Global Constraints

Celles des lots précédents. Comportements PPG copiés (`ChatEmptyState`, `ChatExperimentationBanner`, `useSpeechRecognition`, « Suivre la réponse » de `ChatUI`). Bandeau sans liens. Stockage sous try/catch. Pas de tests front au-delà de la logique pure.

## Review Focus

1. Navigateur sans `SpeechRecognition` (Firefox) → bouton absent, pas d'erreur. Rendu non testé.
2. Micro refusé ou coupé (`onerror`, `onend`) → bouton revient à l'état inactif. Rendu non testé.
3. Envoi pendant la dictée → écoute coupée, la transcription tardive ne réécrit pas le champ vidé. Rendu non testé.
4. Question de la palette en attente → pas d'écran vide affiché le temps de l'envoi. Rendu non testé.
5. Fil remonté puis nouvelle question → le suivi reprend. Test : Task 1 (`isNearBottom`) ; rendu non testé.

---

### Task 1: Logique pure

**Files:** Create `apps/kpilote-webapp/src/assistant/emptyState/propositions.ts`, `assistant/followResponse.ts`, `assistant/transcript.ts` (+ tests)

**Interfaces — Produces:**
- `Proposition = { id: string; label: string; message: string; mode: 'send' | 'fill' }` ; `propositionsFor(page: PageContext | undefined): Proposition[]` — 4 propositions : indicateur (synthèse, tableau de bord, comparaison, calcul), collection (synthèse, écarts, tableau de bord, comparaison), autre (trouver, synthèse, comparaison, aide). Un individu sélectionné est repris dans les messages (« sur l'individu sélectionné »).
- `FOLLOW_THRESHOLD_PX = 50` ; `isNearBottom({ scrollTop, scrollHeight, clientHeight })`.
- `appendTranscript(current, transcript)` : ajoute après une espace, sans espaces doublées.

- [ ] Tests RED → GREEN ; lint ; commit `feature(PIL-1684): propositions et suivi du fil de l'assistant`.

### Task 2: Écran vide, bandeau, dictée, suivi

**Files:** Create `assistant/emptyState/EmptyState.tsx`, `assistant/display/ExperimentationBanner.tsx`, `assistant/useSpeechRecognition.ts` ; Modify `AssistantPanel.tsx`, `display/AssistantContent.tsx`.

- [ ] Écran vide (« Bonjour, je suis l'assistant kpilote. » + ce qu'il sait faire + propositions) tant qu'aucun message ni question en attente ; `send` envoie, `fill` remplit le champ et y place le curseur. Bandeau sous le fil, repliable, mémorisé pour l'onglet (`sessionStorage`, `kpilote-assistant:bandeau`), compact en panneau et fenêtre. Micro masqué si non supporté, coupé à l'envoi. « Suivre la réponse » quand on a remonté de plus de 50 px pendant une réponse. Lint ; commit `feature(PIL-1684): ecran d'accueil, bandeau, dictee et suivi de la reponse`.

### Task 3: Vérification

- [ ] Lint + tests ; revue finale ; PR empilée sur `feat/PIL-1684-assistant-vues`.
