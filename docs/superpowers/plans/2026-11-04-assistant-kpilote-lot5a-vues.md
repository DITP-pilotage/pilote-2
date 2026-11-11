# Assistant kpilote — lot 5a (vues, pastille, historique) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Trois vues (plein écran, panneau latéral, fenêtre flottante), masquer / reprendre avec la pastille, historique des conversations (liste, reprise, suppression) et ses routes.

**Architecture:** API : trois routes limitées au principal. Webapp : logique pure testée (`views`, `preferencesStorage`, `minimizedStorage`, `historyGroups`), un `AssistantProvider` au niveau de la racine qui porte l'état (vue, conversation, masquage) ; surfaces `AssistantFullscreen`, `AssistantSidePanel` (dans le flux de la page), `AssistantFloating`, `AssistantPastille` ; en-tête commun (`MenuHistorique`, « Nouvelle conversation », `MenuVue`, « Masquer »). La palette appelle `open(question)`.

**Tech Stack:** identique ; Radix (`radix-ui`) pour Dialog, DropdownMenu, Popover.

**Spec:** `docs/superpowers/specs/2026-11-04-assistant-kpilote-lot5-vues-design.md`

## Global Constraints

Celles des lots précédents. Comportements PPG copiés (PR #2521), pas « améliorés ». `localStorage` / `sessionStorage` toujours sous try/catch. Pas de plan de tests front au-delà de la logique pure (préférence du user).

## Review Focus

1. Conversation d'un autre principal : liste, lecture, suppression → jamais visible (404). Test : Task 1.
2. Stockage corrompu ou indisponible (navigation privée) → valeurs par défaut, pas de plantage. Test : Task 2.
3. Conversation masquée supprimée ou introuvable au rechargement → entrée effacée, pastille « Demander à l'assistant ». Test : Task 2 (stockage) ; rendu non testé.
4. Écran qui rétrécit → vue repliée sans oubli de la préférence. Test : Task 2.
5. Reprise d'une conversation pendant une réponse en cours → la réponse est arrêtée avant de charger l'autre. Rendu non testé.

---

### Task 1: Routes des conversations

**Files:** Create `apps/kpilote-api/src/assistant/persistence/{listConversations,getConversation,deleteConversation}.ts` ; Modify `assistant/routes.ts` (+ `routes.test.ts`) ; `packages/kpilote-shared/src/assistant/conversation.ts` (schémas) + export package.

**Interfaces — Produces:**
- Shared : `conversationSummarySchema = { id: uuid, titre, createdAt, updatedAt }`, `conversationListSchema = { items: ConversationSummary[] }`, `conversationSchema = ConversationSummary & { messages: unknown[] }` ; `MAX_CONVERSATIONS = 50`.
- `GET /assistant/conversations` → 50 plus récentes du principal (`updatedAt desc`) ; `GET /assistant/conversations/{id}` → 404 si absente ou d'un autre ; `DELETE /assistant/conversations/{id}` → 204, 404 si absente ou d'un autre. Accès comme `/assistant/chat` (clé API refusée).

- [ ] Tests : liste du seul principal, triée et bornée ; lecture d'une conversation d'autrui → 404 ; suppression puis lecture → 404 ; suppression d'autrui → 404 et conversation intacte ; clé API → 403. RED → GREEN ; lint ; commit `feature(PIL-1684): routes des conversations de l'assistant`.

### Task 2: Logique pure des vues, du stockage et de l'historique

**Files:** Create `apps/kpilote-webapp/src/assistant/display/{views,preferencesStorage,minimizedStorage}.ts`, `assistant/history/historyGroups.ts` (+ tests)

**Interfaces — Produces:**
- `views.ts` : `ASSISTANT_VIEWS = ['fullscreen','sidePanel','floating']`, `ScreenSize = 'narrow'|'medium'|'wide'`, `viewsFor(size)`, `effectiveView(view, size)` (sidePanel → floating → fullscreen), `PANEL_WIDTH = { min: 400, max: 720, default: 520 }`, `MIN_PAGE_WIDTH = 900`, `boundPanelWidth(width, viewport)`, `WINDOW_SIZE = { width: { min: 360, max: 720, default: 440 }, height: { min: 400, default: 896 } }`, `WINDOW_MARGIN = 16`, `boundWindowSize(size, viewport)`.
- `preferencesStorage.ts` : `readViewPreference / writeViewPreference`, `readPanelWidth / writePanelWidth`, `readWindowSize / writeWindowSize` — clés `kpilote-assistant:vue|largeurPanneau|tailleFenetre`, validées par zod, `null` si absent, invalide ou stockage indisponible.
- `minimizedStorage.ts` : `readMinimized(): { id: string } | null`, `writeMinimized(id)`, `clearMinimized()` — `sessionStorage`, clé `kpilote-assistant:conversation`, entrée invalide effacée.
- `historyGroups.ts` : `groupByPeriod(items, now)` → `[{ label, items }]` (Aujourd'hui, Cette semaine, Ce mois-ci, puis « mois [année] ») ; `matchesSearch(titre, query)` sans accents ni casse.

- [ ] Tests de chaque fonction, cas de la Review Focus 2–4 compris. RED → GREEN ; lint ; commit `feature(PIL-1684): vues et memoire de l'assistant`.

### Task 3: Provider, surfaces, pastille, en-tête

**Files:** Create `assistant/display/{AssistantProvider,AssistantFullscreen,AssistantSidePanel,AssistantFloating,AssistantPastille,AssistantHeader,MenuVue,ViewPictogram,useScreenSize,useResizable}.tsx|ts`, `assistant/AssistantContent.tsx` ; Modify `routes/__root.tsx`, `components/HeaderNav.tsx`, `assistant/AssistantPanel.tsx`, `assistant/useAssistant.ts` ; Delete `assistant/useAssistantLauncher.tsx`.

**Interfaces — Produces:** `useAssistantDisplay()` → `{ allowed, display: View | 'minimized' | 'closed', view, conversationId, status, open(question?), minimize(), restore(), changeView(view), toWindow(), newConversation(), selectConversation(id) }` ; `useAssistant({ conversationId, pageContext, initialMessages? })`.

- [ ] Comportements PPG : première ouverture en plein écran, vue préférée ensuite ; Échap en plein écran masque ; lien interne cliqué en plein écran → fenêtre (ou masque) ; panneau dans le flux à droite de la page (racine en `flex`) ; poignées souris + clavier (20 px) ; pastille fixe en bas à droite (3 états) ; au montage, conversation masquée relue (`GET /assistant/conversations/{id}`), effacée si introuvable ; Maj+Tab ramène à la palette. Lint ; commit `feature(PIL-1684): l'assistant en plein ecran, panneau ou fenetre, masquable`.

### Task 4: Historique

**Files:** Create `assistant/history/MenuHistorique.tsx` ; Modify `assistant/assistantApi.ts`, `AssistantHeader.tsx`

- [ ] Le titre (premier message, ou « Nouvelle conversation ») ouvre un popover : recherche, groupes, entrée active marquée, reprise (`chat.stop()` puis chargement), suppression après confirmation (la conversation active supprimée → nouvelle conversation) ; liste rechargée après chaque réponse. Lint ; commit `feature(PIL-1684): historique des conversations de l'assistant`.

### Task 5: Vérification

- [ ] Lint + tests des trois paquets ; revue finale.
