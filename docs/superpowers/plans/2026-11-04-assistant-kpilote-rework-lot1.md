# Assistant kpilote — lot 1 (moteur et chat de base) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer le moteur de la PR #2359 par un agent à la PPG (plomberie / configuration, outils écrits pour le modèle, registre unique, clarification par choix) et un chat qui se comporte comme celui de PPG.

**Architecture:** `framework/llm/albert.ts` porte la plomberie LLM pour tout kpilote-api. `assistant/agent.ts` (`buildAgent`) assemble prompt + outils + arrêt, consommé par la route (et demain par Evalite). Le contrat des outils (`TOOLS`) vit dans `kpilote-shared` ; chaque outil est un fichier de `assistant/tools/`, enregistré dans un `Record<ToolName, ToolFactory>` exhaustif. Le front rend les parts d'outil selon leur `kind`.

**Tech Stack:** Hono + `@hono/zod-openapi`, `ai` v7 / `@ai-sdk/openai` / `@ai-sdk/react` v4, zod 4, Prisma 7 (Postgres), neverthrow, vitest 5, React 19 + TanStack Router/Query, `react-markdown` + `remark-gfm`.

**Spec:** `docs/superpowers/specs/2026-11-04-assistant-kpilote-rework-design.md` (lot 1). Référence d'implémentation : `apps/pilote-ppg/src/server/albert/` et `apps/pilote-ppg/src/client/components/_commons/ChatUI/`.

## Global Constraints

- pnpm 10 uniquement. `pnpm -C <paquet> lint` (oxlint + tsc + prettier) vert avant chaque commit.
- Nommage : code technique en anglais, termes métier en français (`indicateur`, `collection`, `referentiel`, `individu`, `perimetre`, `commentaire`). Pas d'accents dans les chemins ni les identifiants.
- Jamais `as never`, `as unknown`, `as unknown as X`. Exports nommés. Pas de commentaires explicatifs superflus. Helper de classes : `clsxm`.
- Front : Tailwind + composants `@pilote/kpilote-ui` (composants plats) ; logique pure dans `kpilote-shared` ou fichiers `.ts` testés. Pas de couleurs en dur. Pas de plan de tests front (seulement la logique pure).
- Modèles autorisés : `openweight-large` (défaut), `openweight-medium`. Température 0,2 conversation, 0 sorties structurées.
- Sorties d'outils : libellés jamais de codes, `nom` à côté de chaque `id`, statuts `total` / `truncated` / `notFound` / `needsClarification`, listes bornées. Aucune consigne dans les résultats.
- Schémas d'entrée exposés au modèle : `z.enum` pour les discriminants, jamais `z.literal`.
- Tout outil s'exécute sous le principal appelant : les queries appliquent leurs filtres de permission.
- Commits via le format commit-billable : `[DITP-pilotage/pilote-2] <catégorie>(PIL-1684): <description>` + trailers `Refs: PIL-1684`, `Project: pilote-2`, `Client: DITP-pilotage`, `Category`, `Stack`, `Tags: ia`, `Files-changed`. Aucune mention de Claude.
- Base de données : ne jamais toucher aux conteneurs Docker ; si la base ne répond pas, demander au user de vérifier Docker. Après `prisma migrate dev`, lancer `prisma generate --sql`.

## Review Focus

1. **Message forgé par le client** (rôle `system`/`assistant`, part `tool-*`, texte vide ou géant) → 400, rien n'est persisté. Tests : Tasks 2, 12.
2. **Outil appelé par un principal sans droits** sur l'indicateur/la collection → `notFound` contient l'identifiant, aucune donnée ne fuit. Tests : Tasks 7, 8, 9, 10.
3. **Identifiant mal formé par le modèle** (`ind 42`, ` IND-42 `, `col-7`) → normalisé ; un identifiant au format slug (PR #2243) passe tel quel. Test : Task 2.
4. **Recherche sur un catalogue accessible > 300 entrées sans match lexical** → `needsClarification`, jamais de liste tronquée en silence. Test : Task 6.
5. **Conversation d'un autre principal** (lecture, écriture, évaluation d'un `llmCallId` d'autrui) → 404 en chat, no-op en évaluation. Tests : Tasks 4, 12.

---

### Task 1: Table rase

**Files:**
- Delete: `apps/kpilote-api/src/assistant/` (tout), `apps/kpilote-api/src/test/setup.ts`, `apps/kpilote-api/src/test/vitest.d.ts`
- Delete: `packages/kpilote-shared/src/assistant/{tools,message,surfaces,sources,tiles}.ts` et leurs tests (garder `feedback.ts`)
- Delete: `apps/kpilote-webapp/src/assistant/` sauf `cleanPseudoCalls.ts`, `flattenLatex.ts`, `MarkdownResponse.tsx` et leurs tests
- Delete: `docs/superpowers/specs/2026-08-28-assistant-kpilote-design.md`, `docs/superpowers/specs/2026-08-31-assistant-composition-visuelle-design.md`, `docs/superpowers/plans/2026-08-28-assistant-kpilote-moteur.md`, `docs/superpowers/plans/2026-08-31-assistant-composition-visuelle.md`
- Modify: `apps/kpilote-api/src/app.ts` (retirer `assistantRoutes`), `apps/kpilote-api/vitest.config.ts` (retirer `setupFiles`, garder `clearMocks: false`), `apps/kpilote-api/package.json` (retirer `jest-extended`), `packages/kpilote-shared/package.json` (exports `./assistant/*` sauf `feedback`), `apps/kpilote-webapp/src/components/HeaderNav.tsx` + `components/command-palette/CommandPalette.tsx` (retirer temporairement l'entrée « Demander à l'IA » et la modale)
- Modify: `apps/kpilote-api/src/{indicateur,collection,referentiel,valeurAvancement}/routes.ts` : rétablir les `createRoute` non exportés (exports ajoutés pour `whitelist.ts`)

**Interfaces:**
- Produces: un dépôt où kpilote-api, kpilote-webapp et kpilote-shared compilent et passent leurs tests sans assistant. On garde : la migration d'août (remplacée en Task 4), les filtres `ids` ajoutés à collections/individus/référentiels, `Modale size`, `cleanPseudoCalls`, `flattenLatex`, `MarkdownResponse`.

- [ ] **Step 1: Supprimer les fichiers listés et retirer les références** (imports, exports de package, enregistrement de route, entrée de palette).
- [ ] **Step 2: Vérifier**

Run: `pnpm install && pnpm -C packages/kpilote-shared lint && pnpm -C apps/kpilote-api lint && pnpm -C apps/kpilote-webapp lint && pnpm -C apps/kpilote-api test && pnpm -C apps/kpilote-webapp test`
Expected: tout vert ; `git grep -n "jest-extended\|deriveTool\|surfaces'" -- apps packages` vide.

- [ ] **Step 3: Commit** — `refactor(PIL-1684): table rase de l'assistant avant la refonte`

---

### Task 2: Contrat partagé

**Files:**
- Create: `packages/kpilote-shared/src/assistant/{tools,chat,message,ids}.ts`
- Test: `packages/kpilote-shared/src/assistant/{tools,chat,ids}.test.ts`
- Modify: `packages/kpilote-shared/package.json` (exports `./assistant/tools`, `./assistant/chat`, `./assistant/message`, `./assistant/ids`, `./assistant/feedback`)

**Interfaces:**
- Produces (`ids.ts`):
  - `normalizePublicId(prefix: 'IND' | 'COL', raw: string): string` — trim ; si la valeur correspond à `^\s*<prefix>[\s_-]*(\d+)\s*$` (insensible à la casse) → `<PREFIX>-<digits>` (zéros conservés) ; sinon renvoie la valeur trimée (slugs à venir, PR #2243)
  - `indicateurIdInput`, `collectionIdInput`, `individuIdInput` : `z.string().min(1).transform(...)` avec `.describe` (individu : trim + uppercase seulement)
- Produces (`chat.ts`):
  - `MODELS`, `type Model`
  - `userMessageSchema` : `{ id: string, role: z.literal('user'), parts: [{ type: z.literal('text'), text: string 1..4000 }] (1..10) }` strict
  - `pageContextSchema` : `{ indicateurId?, collectionId?, individuId? }` strict (identifiants bruts)
  - `chatRequestSchema` : `{ id: z.uuid(), message: userMessageSchema, model: z.enum(MODELS).optional(), context: pageContextSchema.optional() }`
  - `type PageContext`, `type ChatRequest`
- Produces (`tools.ts`):
  - `type ToolKind = 'source' | 'interface'`
  - `TOOLS` (`as const satisfies Record<string, { label: string; kind: ToolKind; input: z.ZodType }>`) avec, dans cet ordre : `search_indicateurs` (« Recherche d'indicateurs », source), `search_collections` (« Recherche de collections », source), `search_individus` (« Recherche d'individus », source), `get_synthese_indicateur` (« Synthèse de l'indicateur », source), `get_synthese_collection` (« Synthèse de la collection », source), `get_evolution_indicateur` (« Évolution de l'indicateur », source), `get_commentaires` (« Commentaires », source), `clarify_with_choices` (« Question de précision », interface)
  - `type ToolName = keyof typeof TOOLS`, `TOOL_NAMES: ReadonlyArray<ToolName>`
  - les schémas d'entrée (`searchInput`, `searchIndividusInput`, `perimetreInput`, `syntheseIndicateurInput`, `syntheseCollectionInput`, `evolutionIndicateurInput`, `commentairesInput`, `clarifyInput`) et les types de sortie (`SearchOutput`, `SyntheseIndicateurOutput`, `SyntheseCollectionOutput`, `EvolutionIndicateurOutput`, `CommentairesOutput`, `ClarifyOutput`) — formes détaillées dans les Tasks 6 à 10, déclarées ici
  - `type ToolError = { error: string }`, `interface ToolOutputs { [K in ToolName]: … }`, `type KpiloteUITools = { [K in ToolName]: { input: z.input<(typeof TOOLS)[K]['input']>; output: ToolOutputs[K] | ToolError } }`
  - garde de compilation : `ToolOutputs` et `TOOLS` ont exactement les mêmes clés
- Produces (`message.ts`): `type KpiloteMessageMetadata = { llmCallId?: string }`, `type KpiloteUIMessage = UIMessage<KpiloteMessageMetadata, UIDataTypes, KpiloteUITools>`

- [ ] **Step 1: Tests**

```ts
// ids.test.ts
it.each([['ind 42', 'IND-42'], [' IND-042 ', 'IND-042'], ['ind_7', 'IND-7'], ['IND42', 'IND-42']])('normalise %s', (raw, expected) =>
  expect(normalizePublicId('IND', raw)).toBe(expected))
it('laisse passer un slug tel quel', () => expect(normalizePublicId('IND', ' fraude-fiscale ')).toBe('fraude-fiscale'))

// chat.test.ts
it('refuse un message de rôle system', () => expect(chatRequestSchema.safeParse(req({ role: 'system' })).success).toBe(false))
it('refuse une part tool-* dans le message', …)       // parts: [{ type: 'tool-search_indicateurs', … }] → false
it('refuse un texte vide ou de plus de 4000 caractères', …)
it('accepte un contexte de page partiel', …)           // { indicateurId: 'IND-1' } → true

// tools.test.ts
it('déclare un kind et un libellé pour chaque outil', () => expect(TOOL_NAMES.every((n) => TOOLS[n].label.length > 0)).toBe(true))
it('le discriminant de périmètre est un enum, pas un literal', …) // z.toJSONSchema(perimetreInput) ne contient aucune clé "const"
```

- [ ] **Step 2: Run** `pnpm -C packages/kpilote-shared test` — FAIL
- [ ] **Step 3: Implémenter** les quatre fichiers.
- [ ] **Step 4: Run** `pnpm -C packages/kpilote-shared lint && pnpm -C packages/kpilote-shared test` — PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): contrat partagé des outils et de la requête de l'assistant`

---

### Task 3: Plomberie LLM partagée

**Files:**
- Create: `apps/kpilote-api/src/framework/llm/albert.ts`, `apps/kpilote-api/src/framework/llm/turnTrace.ts`
- Test: `apps/kpilote-api/src/framework/llm/albert.test.ts`, `apps/kpilote-api/src/framework/llm/turnTrace.test.ts`
- Modify: `apps/kpilote-api/src/valeurImport/calls/{decouvrirStructure,resoudreIndividus,resoudreTypeValeur}.ts` (utiliser la nouvelle fabrique) ; Delete: `apps/kpilote-api/src/valeurImport/helpers/albert.ts`

**Interfaces:**
- Produces:
  - `MODELS = ['openweight-large', 'openweight-medium'] as const`, `type Model`, `DEFAULT_MODEL: Model = 'openweight-large'`, `CONVERSATION_TEMPERATURE = 0.2`, `STRUCTURED_TEMPERATURE = 0` (`MODELS`/`Model` viennent de `@pilote/kpilote-shared/assistant/chat`, Task 2)
  - `createAlbertModel(model?: Model): LanguageModel` — lève si `ALBERT_API_KEY` manque ; applique le wrapper enregistré
  - `registerModelWrapper(wrap: ((model: LanguageModel) => LanguageModel) | null): void`
  - `generateStructured<T>({ name, model, system, prompt, schema, trace, abortSignal? }: { name: string; model: Model; system: string; prompt: string; schema: z.ZodType<T>; trace: TurnTrace | null; abortSignal?: AbortSignal }): Promise<T>` — `generateText` + `Output.object`, `STRUCTURED_TEMPERATURE`, `stepCountIs(3)`, enregistre une entrée de trace
  - `type SubCallTrace = { name: string; model: Model; inputTokens: number; outputTokens: number; durationMs: number }`
  - `class TurnTrace { record(entry: SubCallTrace): void; entries(): ReadonlyArray<SubCallTrace> }`

- [ ] **Step 1: Tests** (`albert.test.ts`)

```ts
it('applique le wrapper enregistré à tout modèle créé, sous-agents compris', () => {
  const wrapped: LanguageModel[] = []
  registerModelWrapper((model) => { wrapped.push(model); return model })
  createAlbertModel('openweight-medium')
  registerModelWrapper(null)
  expect(wrapped).toHaveLength(1)
})

it('generateStructured trace le sous-appel avec ses tokens', async () => {
  // MockLanguageModelV3 via registerModelWrapper(() => mock) renvoyant {"ids":["IND-1"]}
  const trace = new TurnTrace()
  const output = await generateStructured({ name: 'search_indicateurs.ranking', model: 'openweight-large', system: 's', prompt: 'p', schema: z.object({ ids: z.array(z.string()) }), trace })
  expect(output).toEqual({ ids: ['IND-1'] })
  expect(trace.entries()).toEqual([expect.objectContaining({ name: 'search_indicateurs.ranking', model: 'openweight-large', inputTokens: 10, outputTokens: 5 })])
})
```

- [ ] **Step 2: Run** `pnpm -C apps/kpilote-api exec vitest run src/framework/llm` — FAIL (module absent)
- [ ] **Step 3: Implémenter** `albert.ts` et `turnTrace.ts` ; migrer les 3 appels de `valeurImport` (`createAlbertModel()` + `STRUCTURED_TEMPERATURE`, qui vaut 0 comme `ALBERT_TEMPERATURE`). Usage lu sur la dernière étape (`steps.at(-1).usage`) : `ai` v7 cumule `usage`.
- [ ] **Step 4: Run** `pnpm -C apps/kpilote-api exec vitest run src/framework/llm src/valeurImport` — PASS
- [ ] **Step 5: Commit** — `refactor(PIL-1684): plomberie Albert partagée et trace des sous-appels`

---

### Task 4: Persistance (migration unique)

**Files:**
- Modify: `apps/kpilote-api/prisma/schema.prisma` ; Replace: `apps/kpilote-api/prisma/migrations/20260831141207_ajoute_assistant_conversation_et_appel/` par `apps/kpilote-api/prisma/migrations/<horodatage du jour>_assistant/migration.sql`
- Create: `apps/kpilote-api/src/assistant/persistence/{getConversationMessages,recordTurn,rateCall}.ts`
- Test: `apps/kpilote-api/src/assistant/persistence/persistence.test.ts`

Schéma (noms SQL snake_case, modèles Prisma `AssistantConversation`, `AssistantAppel`, `AssistantSousAppel`) :
- `assistant_conversation` : `id uuid PK` (fourni par le client), `principal_id text`, `titre text`, `contexte jsonb null`, `messages jsonb`, `created_at`, `updated_at` ; index `(principal_id, updated_at desc)`.
- `assistant_appel` : `id uuid PK` (= `llmCallId`), `conversation_id` FK `ON DELETE CASCADE`, `principal_id`, `modele`, `transcript jsonb`, `outils text[]`, `input_tokens int`, `output_tokens int`, `duree_ms int`, `evaluation` enum `POSITIVE|NEGATIVE` null, `categories_probleme` enum[] , `commentaire text null`, `created_at` ; index `(conversation_id, created_at)`.
- `assistant_sous_appel` : `id uuid PK`, `appel_id` FK `ON DELETE CASCADE`, `nom text`, `modele`, `input_tokens`, `output_tokens`, `duree_ms`, `created_at`.
- Commentaire Prisma de la FK : « supprimer une conversation supprime ses appels ; les conversations ne sont jamais purgées automatiquement ».

**Interfaces:**
- Consumes: `SubCallTrace` (Task 3)
- Produces:
  - `getConversationMessages({ id, principalId }): Promise<unknown[]>` — `[]` si inconnue, `NotFoundError` si autre principal
  - `recordTurn({ conversationId, principalId, contexte, messages, call }: { …; contexte: PageContext | null; messages: ReadonlyArray<unknown>; call: { id: string; model: Model; transcript: unknown; tools: string[]; inputTokens: number; outputTokens: number; durationMs: number; subCalls: ReadonlyArray<SubCallTrace> } }): Promise<void>` — upsert cloisonné de la conversation (logique de `recordConversation` de #2359, titre = 1er message utilisateur tronqué à 80), puis l'appel, puis ses sous-appels, dans une transaction ; aller-retour JSON avant Prisma
  - `rateCall({ callId, body }: { callId: string; body: RateBody }): Promise<void>` — met à jour l'appel **si** `principal_id` = principal courant, sinon ne fait rien

- [ ] **Step 1: Tests** (`integrationTest`, `runAsUser`)

```ts
it('écrit conversation, appel et sous-appels du tour')                // relit les 3 tables
it('refuse d’écraser la conversation d’un autre principal')            // recordTurn sous B sur l'id de A → NotFoundError, messages de A intacts
it('getConversationMessages rend [] pour un id inconnu et 404 pour un autre principal')
it('rateCall note l’appel désigné par son id, pas le dernier de la conversation') // 2 appels, note le 1er → seul le 1er a evaluation
it('rateCall ignore un appel appartenant à un autre principal')        // evaluation reste null
```

- [ ] **Step 2:** `pnpm -C apps/kpilote-api exec prisma migrate dev --name assistant` puis `prisma generate --sql` ; Run tests — FAIL
- [ ] **Step 3: Implémenter** les trois fichiers.
- [ ] **Step 4: Run** `pnpm -C apps/kpilote-api exec vitest run src/assistant/persistence` — PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): persistance des conversations, appels et sous-appels de l'assistant`

---

### Task 5: Registre, enveloppe commune, clarification, accès

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/registry.ts`, `apps/kpilote-api/src/assistant/tools/clarifyWithChoices.ts`, `apps/kpilote-api/src/assistant/access.ts`, `apps/kpilote-api/src/framework/context/captureContext.ts`
- Test: `apps/kpilote-api/src/assistant/tools/registry.test.ts`, `apps/kpilote-api/src/assistant/access.test.ts`

**Interfaces:**
- Consumes: `TOOLS`, `ToolName`, `ToolOutputs`, `ToolError` (Task 2), `TurnTrace`, `Model` (Task 3)
- Produces:
  - `captureContext(): <T>(fn: () => Promise<T>) => Promise<T>` — capture `db()` et le principal courants et les rétablit (`runWithDb` + `runWithPrincipal`) ; en test, c'est donc le client transactionnel qui est capturé
  - `type ToolContext = { model: Model; trace: TurnTrace; runInContext: <T>(fn: () => Promise<T>) => Promise<T> }`
  - `type ToolDefinition<N extends ToolName> = { description: string; execute: (input: z.output<(typeof TOOLS)[N]['input']>, options: { abortSignal?: AbortSignal; context: ToolContext }) => Promise<ToolOutputs[N]>; toModelOutput?: (output: ToolOutputs[N]) => unknown }`
  - `TOOL_DEFINITIONS: { [N in ToolName]: ToolDefinition<N> }` (exhaustif ; chaque fichier d'outil exporte sa définition)
  - `buildTools(context: ToolContext): ToolSet` — pour chaque nom : `tool({ description, inputSchema: TOOLS[n].input, execute, toModelOutput })` où `execute` passe par `context.runInContext`, mémorise les entrées en échec (JSON de l'entrée) et renvoie `REPEATED_FAILURE` au rejeu identique, et convertit toute exception en `{ error: "L'appel a échoué : <message>" }`
  - `clarifyWithChoices: ToolDefinition<'clarify_with_choices'>` — description reprise de PPG (`apps/pilote-ppg/src/server/albert/tools/clarifyWithChoices.ts`), `execute` renvoie l'entrée
  - `checkAssistantAccess(principal: Principal): boolean` — `principal.kind === 'user'`
- Tant que les Tasks 7–10 ne sont pas faites, leurs entrées de `TOOL_DEFINITIONS` sont des définitions qui lèvent `Error('non implémenté')` : la garde de compilation reste active.

- [ ] **Step 1: Tests**

```ts
it('expose exactement les outils déclarés dans TOOLS', () =>
  expect(Object.keys(buildTools(context))).toEqual([...TOOL_NAMES]))
it('exécute un outil sous le contexte capturé', …)            // définition de test lisant requireCurrentPrincipalId() → l'id capturé
it('refuse de rejouer à l’identique un appel en échec', …)    // 2e appel → expect(output).toEqual(REPEATED_FAILURE), execute appelé 1 fois
it('convertit une exception en erreur lisible', …)            // → { error: expect.stringContaining('boom') }
it('clarify_with_choices renvoie la question et les choix', …)
it('refuse l’assistant aux clés API', () => expect(checkAssistantAccess(apiKeyPrincipal)).toBe(false))
```

- [ ] **Step 2: Run** `pnpm -C apps/kpilote-api exec vitest run src/assistant/tools/registry.test.ts src/assistant/access.test.ts` — FAIL
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Run** — PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): registre d'outils, enveloppe commune et clarification par choix`

---

### Task 6: Socle de recherche

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/search/{prefilter,searchEntities,nameQueries}.ts`
- Test: `apps/kpilote-api/src/assistant/tools/search/{prefilter,searchEntities,nameQueries}.test.ts`

**Interfaces:**
- Consumes: `generateStructured` (Task 3), `ToolContext` (Task 5)
- Produces:
  - `prefilter.ts` : `normalize`, `splitIntoTerms`, `rankByMatchedTerms`, `filterHallucinations` repris de #2359 (`git show 5b5f4babd:apps/kpilote-api/src/assistant/tools/business/prefilter.ts`), adaptés à `type NamedEntity = { id: string; nom: string; referentiel?: { id: string; nom: string } }`
  - `MAX_RESULTS = 10`, `MAX_RANKING_CANDIDATES = 60`, `MAX_FALLBACK_CATALOG = 300`
  - `searchEntities({ query, filterByTerm, loadCatalog, rank }: { query: string; filterByTerm: (term: string) => Promise<NamedEntity[]>; loadCatalog: (limit: number) => Promise<{ items: NamedEntity[]; total: number }>; rank: Ranker }): Promise<SearchOutput>` — même algorithme que #2359 ; le repli appelle `loadCatalog(MAX_FALLBACK_CATALOG)` et renvoie `needsClarification` si `total > MAX_FALLBACK_CATALOG`
  - `type Ranker = (query: string, candidates: ReadonlyArray<NamedEntity>) => Promise<ReadonlyArray<string>>`, `createRanker({ name, context, abortSignal }): Ranker` — via `generateStructured` sur `context.model` (le modèle du tour)
  - `SearchOutput = { results: NamedEntity[]; needsClarification?: string }`
  - `nameQueries.ts` (requêtes légères `select { publicId, nom }`, sous `withIndicateurReadPermission` / `withCollectionReadPermission` avec `requireCurrentPrincipalId()` et le rôle admin) : `findIndicateurNames({ term?, limit })`, `findCollectionNames({ term?, limit })`, `findIndividuNames({ term?, referentielId?, limit })` → `Promise<{ items: NamedEntity[]; total: number }>` ; `term` = `contains` insensible à la casse

- [ ] **Step 1: Tests**

```ts
// searchEntities.test.ts (fakes)
it('n’appelle pas le modèle quand un seul candidat ressort', …)
it('demande une précision quand le catalogue dépasse 300 entrées sans match lexical', async () => {
  const output = await searchEntities({ query: 'zzz', filterByTerm: async () => [], loadCatalog: async () => ({ items: catalog(300), total: 301 }), rank })
  expect(output).toEqual({ results: [], needsClarification: expect.stringContaining('301') })
})
it('écarte un identifiant inventé par le classement', …)
// nameQueries.test.ts (integrationTest)
it('ne renvoie que les indicateurs lisibles par le principal', …)   // 1 PUBLIC + 1 PRIVE sans droit → seul le PUBLIC
it('compte le total au-delà de la limite', …)                       // 3 indicateurs, limit 2 → items 2, total 3
```

- [ ] **Step 2: Run** `pnpm -C apps/kpilote-api exec vitest run src/assistant/tools/search` — FAIL
- [ ] **Step 3: Implémenter.**
- [ ] **Step 4: Run** — PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): socle de recherche borné et requêtes légères de noms`

---

### Task 7: Outils de recherche

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/{searchIndicateurs,searchCollections,searchIndividus}.ts`
- Modify: `apps/kpilote-api/src/assistant/tools/registry.ts`
- Test: `apps/kpilote-api/src/assistant/tools/search.test.ts`

**Interfaces:**
- Consumes: Task 6
- Produces: les trois `ToolDefinition`. Entrées : `searchInput = { query }` ; `searchIndividusInput = { query, referentielId?: string }`. Sortie : `SearchOutput` (`referentiel` renseigné pour les individus). Descriptions au gabarit PPG (« Renvoie… / Utilise-le pour : … / Ne l'utilise pas pour : <cas> → <outil> »). `search_individus` parle d'« individus d'un référentiel » (territoire, académie, bassin versant…), sans rien supposer de géographique.

- [ ] **Step 1: Tests** (`integrationTest`, ranker factice injecté via `registerModelWrapper` + `MockLanguageModelV3`)

```ts
it('search_indicateurs trouve un indicateur lisible et ignore un indicateur privé', …)
it('search_individus filtre par référentiel', …)          // 2 individus « Nord » dans 2 référentiels → 1 avec referentielId
it('chaque résultat porte nom et identifiant', …)          // results: [{ id: 'IND-…', nom: '…' }]
```

- [ ] **Step 2–4:** FAIL → implémenter → `pnpm -C apps/kpilote-api exec vitest run src/assistant/tools/search.test.ts` PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): recherche d'indicateurs, de collections et d'individus`

---

### Task 8: Périmètre et synthèse d'indicateur

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/perimetre.ts`, `apps/kpilote-api/src/assistant/tools/getSyntheseIndicateur.ts`
- Modify: `apps/kpilote-api/src/assistant/tools/registry.ts`
- Test: `apps/kpilote-api/src/assistant/tools/perimetre.test.ts`, `apps/kpilote-api/src/assistant/tools/getSyntheseIndicateur.test.ts`

**Interfaces:**
- Produces:
  - `perimetreInput` (shared) : union discriminée sur `type: z.enum([...])` — `SELECTION { individuIds: string[1..20] }`, `ENFANTS_DE { individuId }`, `TOUT_LE_REFERENTIEL { referentielId }` ; variantes sans `.describe`, sens donné une fois par `PERIMETRE_DESCRIPTION` (repris de `descriptionPerimetre` PPG)
  - `MAX_INDIVIDUS = 20`
  - `resolvePerimetre(perimetre: Perimetre): Promise<{ individus: Array<{ id: string; nom: string }>; notFound: string[]; total: number; truncated: boolean }>` — `ENFANTS_DE` via `listRelations`, `TOUT_LE_REFERENTIEL` via `listIndividusForReferentiel`
  - `syntheseIndicateurInput = { indicateurId, individuId?, perimetre? }`
  - `SyntheseIndicateurOutput = { indicateur: { id, nom, unite: string | null, description: string | null, referentiels: Array<{ id; nom }> } | null; individus: Array<{ individu: { id; nom }; derniereValeur: { valeur: number; date: string } | null; objectif: { valeur: number; date: string } | null; tauxProgression: number | null; variation: string | null }>; valeursRemarquables: …libellées…; notFound: string[]; total?: number; truncated?: boolean; needsClarification?: string }` — `unite` en libellé (« Pourcentage », pas `POURCENTAGE`)
  - `getSyntheseIndicateur: ToolDefinition<'get_synthese_indicateur'>` — compose `getIndicateurByPublicId`, `listTauxProgressionForIndicateur`, `listObjectifsForIndicateur`, `listSyntheseIndividus`, `listValeursRemarquablesForIndicateur` ; indicateur illisible → `indicateur: null, notFound: [id]` ; ni `individuId` ni `perimetre` → `needsClarification` (« Pour quel individu ? Appelle search_individus… » est interdit : dire seulement quelle donnée manque)

- [ ] **Step 1: Tests**

```ts
it('résout les enfants d’un individu par ses relations', …)
it('borne un périmètre à 20 individus et le signale', …)        // 25 enfants → individus.length 20, total 25, truncated true
it('rend notFound pour un indicateur que le principal ne peut pas lire', …) // { indicateur: null, notFound: ['IND-…'] }
it('demande une précision sans individu ni périmètre', …)
it('rend des libellés, jamais des codes d’unité', …)             // JSON.stringify(output) ne contient pas 'POURCENTAGE'
```

- [ ] **Step 2–4:** FAIL → implémenter → `vitest run src/assistant/tools/perimetre.test.ts src/assistant/tools/getSyntheseIndicateur.test.ts` PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): périmètre d'individus et synthèse d'indicateur`

---

### Task 9: Synthèse de collection et évolution d'indicateur

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/{getSyntheseCollection,getEvolutionIndicateur}.ts`
- Modify: `apps/kpilote-api/src/assistant/tools/registry.ts`
- Test: `apps/kpilote-api/src/assistant/tools/{getSyntheseCollection,getEvolutionIndicateur}.test.ts`

**Interfaces:**
- Produces:
  - `syntheseCollectionInput = { collectionId, individuId }` → `SyntheseCollectionOutput = { collection: { id; nom; description } | null; individu: { id; nom } | null; tauxProgression: number | null; contributions: Array<{ indicateur: { id; nom }; ponderation: number; tauxProgression: number | null }>; notFound: string[] }` (via `getCollectionByPublicId`, `getCollectionTauxProgression`)
  - `evolutionIndicateurInput = { indicateurId, individuId }` → `EvolutionIndicateurOutput = { indicateur: { id; nom; unite } | null; individu: { id; nom } | null; points: Array<{ date: string; valeur: number }>; total: number; truncated: boolean; notFound: string[] }` — `MAX_POINTS = 60`, les plus récents, ordre chronologique (via `listValeursForIndicateur`)

- [ ] **Step 1: Tests**

```ts
it('synthèse de collection : taux et contributions pondérées pour l’individu', …)
it('synthèse de collection illisible → notFound', …)
it('évolution : garde les 60 points les plus récents en ordre chronologique', …) // 70 points → 60, truncated, points[0] = 11e plus ancien
```

- [ ] **Step 2–4:** FAIL → implémenter → PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): synthèse de collection et évolution d'indicateur`

---

### Task 10: Commentaires

**Files:**
- Create: `apps/kpilote-api/src/assistant/tools/getCommentaires.ts`, `apps/kpilote-api/src/assistant/tools/textFromHtml.ts`
- Modify: `apps/kpilote-api/src/assistant/tools/registry.ts`
- Test: `apps/kpilote-api/src/assistant/tools/{getCommentaires,textFromHtml}.test.ts`

**Interfaces:**
- Produces:
  - `textFromHtml(html: string): string` — port de `apps/pilote-ppg/src/server/albert/tools/texteDepuisHtml.ts`
  - `commentairesInput` : union sur `cible: z.enum(['INDICATEUR', 'COLLECTION'])` — `INDICATEUR { indicateurId, individuId }`, `COLLECTION { collectionId }`
  - `CommentairesOutput = { groupes: Array<{ type: string /* libellé */; versions: Array<{ date: string; auteur: string | null; texte: string }> }>; notFound: string[] }` — regroupement par type et dédoublonnage sur texte normalisé, du plus récent au plus ancien (comme `get_chantier_commentaires` PPG, commit 2bcf07c0c) ; `MAX_VERSIONS_PAR_TYPE = 10` avec `truncated` par groupe

- [ ] **Step 1: Tests**

```ts
it('convertit le HTML saisi en texte', () => expect(textFromHtml('<p>Un</p><p>Deux<br>Trois</p>')).toBe('Un\n\nDeux\nTrois'))
it('regroupe par type et retire les versions identiques', …)
it('commentaires d’un indicateur illisible → notFound', …)
```

- [ ] **Step 2–4:** FAIL → implémenter → PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): commentaires groupés pour l'assistant`

---

### Task 11: Prompt système, contexte de page et `buildAgent`

**Files:**
- Create: `apps/kpilote-api/src/assistant/prompt/systemPrompt.ts`, `apps/kpilote-api/src/assistant/context/resolvePageContext.ts`, `apps/kpilote-api/src/assistant/agent.ts`
- Test: `apps/kpilote-api/src/assistant/prompt/systemPrompt.test.ts`, `apps/kpilote-api/src/assistant/context/resolvePageContext.test.ts`, `apps/kpilote-api/src/assistant/agent.test.ts`

**Interfaces:**
- Consumes: `PageContext` (Task 2), `buildTools`, `ToolContext` (Task 5)
- Produces:
  - `type ResolvedPageContext = { indicateur?: { id; nom }; collection?: { id; nom }; individu?: { id; nom; referentiel: string } }`
  - `resolvePageContext(context: PageContext | undefined): Promise<ResolvedPageContext | null>` — entité illisible ou inconnue ignorée
  - `buildSystemPrompt({ now, pageContext }: { now: Date; pageContext: ResolvedPageContext | null }): string` — sections dans l'ordre : `Reasoning: high`, Rôle et périmètre, Règles numérotées + hiérarchie (règles > demande explicite > formats par défaut), Métier (glossaire kpilote : indicateur, collection, référentiel, individu, valeur d'avancement, objectif, taux de progression, niveau de confiance), Méthode (résolution des références, quand clarifier / ne pas clarifier, ~10 exemples « demande → appels » en prose), Rédiger (formats par défaut, `Libellé (IND-42)`, pas de LaTeX, pas de nom d'outil ni de lien), Contexte (date, page courante construite par le serveur). Base de rédaction : `apps/pilote-ppg/src/server/albert/systemPrompt.ts` + `BASE_PROMPT` de #2359 (`git show 5b5f4babd:apps/kpilote-api/src/assistant/prompts/base.ts`). Jamais le mot « territoire » en dur.
  - `MAX_STEPS = 15`
  - `buildAgent({ context, pageContext, model, trace, runInContext }): Promise<{ system: string; tools: ToolSet; stopWhen: StopCondition<ToolSet>[]; temperature: number }>` — `stopWhen: [stepCountIs(MAX_STEPS), hasToolCall('clarify_with_choices')]`, `temperature: CONVERSATION_TEMPERATURE`

- [ ] **Step 1: Tests**

```ts
it('ne cite que des outils déclarés dans TOOLS', () => {
  const cited = buildSystemPrompt({ now, pageContext: null }).match(/\b[a-z]+(?:_[a-z]+)+\b/g) ?? []
  expect(cited.filter((name) => !(TOOL_NAMES as string[]).includes(name))).toEqual([])
})
it('écrit le contexte de page à partir des libellés résolus', …)   // contient 'Taux de chômage (IND-12)'
it('ne parle jamais de territoire en dur', …)                       // not.toMatch(/territoire/i)
it('ignore une entité de contexte que le principal ne peut pas lire', …)
it('buildAgent s’arrête après clarify_with_choices', …)              // stopWhen contient hasToolCall : MockLanguageModelV3 appelant clarify puis un autre outil → 1 seul appel d'outil exécuté
```

- [ ] **Step 2–4:** FAIL → implémenter → PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): prompt système, contexte de page et buildAgent`

---

### Task 12: Routes de l'assistant

**Files:**
- Create: `apps/kpilote-api/src/assistant/routes.ts`
- Modify: `apps/kpilote-api/src/app.ts`
- Test: `apps/kpilote-api/src/assistant/routes.test.ts`

**Interfaces:**
- Consumes: tout ce qui précède
- Produces:
  - `POST /assistant/chat` (body `chatRequestSchema`) : 403 si `!checkAssistantAccess` ; historique relu (`getConversationMessages`) + message → `validateUIMessages({ messages, tools })` ; `llmCallId = crypto.randomUUID()` ; `runInContext = captureContext()` ; `buildAgent` ; `streamText({ model: createAlbertModel(model), messages: await convertToModelMessages(messages, { tools }), ...agent, abortSignal })` ; `result.toUIMessageStreamResponse({ originalMessages, messageMetadata: ({ part }) => part.type === 'start' ? { llmCallId } : undefined, onFinish: recordTurn(...) via runInContext, onError })` — `onError` journalise et renvoie « L'assistant a rencontré une erreur. Réessayez dans un instant. » (aucune regex sur le message du SDK)
  - `GET /assistant/acces` → `{ allowed: boolean }`
  - `POST /assistant/appels/{id}/evaluation` (body `rateBodySchema`) → 204, via `rateCall`
  - Journal `assistant.tour.done` : `{ conversationId, llmCallId, model, durationMs, inputTokens, outputTokens, tools }`

- [ ] **Step 1: Tests** (`buildTestApp`, `MockLanguageModelV3` via `registerModelWrapper`)

```ts
it('401 sans authentification')
it('403 pour une clé API')
it('400 pour un message de rôle system, sans rien persister')
it('404 sur la conversation d’un autre principal')
it('streame un tour avec appel d’outil et persiste conversation, appel et outils appelés', …) // mock : search_indicateurs puis texte ; assistant_appel.outils = ['search_indicateurs']
it('envoie llmCallId dans les métadonnées du message', …)   // flux SSE contient '"llmCallId":"<id de l'appel persisté>"'
it('s’arrête après clarify_with_choices', …)
it('GET /assistant/acces : true pour un utilisateur, false pour une clé API')
it('évaluation : 204 et note l’appel désigné')
```

- [ ] **Step 2–4:** FAIL → implémenter → `pnpm -C apps/kpilote-api lint && pnpm -C apps/kpilote-api test` PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): routes de l'assistant sur buildAgent`

---

### Task 13: Chat de base façon PPG (logique pure + rendu)

**Files:**
- Create: `apps/kpilote-webapp/src/assistant/{useAssistant,deriveAssistantState,remarkLineBreaks,remarkEntityLinks}.ts`, `apps/kpilote-webapp/src/assistant/{AssistantPanel,AssistantMessage,AssistantSignature,ConsultedSources,ChoicesInline}.tsx`
- Modify: `apps/kpilote-webapp/src/assistant/{MarkdownResponse.tsx,cleanPseudoCalls.ts}`
- Test: `apps/kpilote-webapp/src/assistant/{deriveAssistantState,remarkEntityLinks,cleanPseudoCalls}.test.ts`

**Interfaces:**
- Consumes: `TOOLS`, `TOOL_NAMES`, `KpiloteUIMessage` (Task 2)
- Produces:
  - `useAssistant({ conversationId, pageContext }: { conversationId: string; pageContext: PageContext | undefined })` → retour de `useChat<KpiloteUIMessage>` ; transport : `prepareSendMessagesRequest` envoie `{ id: conversationId, message: messages.at(-1), context: pageContext }`, jeton relu à chaque envoi, `experimental_throttle: 250`
  - `type AssistantState = 'thinking' | 'consulting-sources' | 'writing'`, `ASSISTANT_STATE_LABELS: Record<AssistantState, string>` = `réfléchit` / `consulte les sources` / `rédige` ; `deriveAssistantState({ message, status }): AssistantState | null` — port de `deriverEtatAssistant` PPG piloté par `TOOLS[name].kind`
  - `isSourcePart(part): part is SourceToolPart` (outils `kind: 'source'`) ; `ConsultedSources` = port **à l'identique** de `SourcesConsultees.tsx` PPG (compteur une fois toutes terminées, pastilles état chargement/✓/erreur, une ouverte à la fois, détail = paramètres `clé : valeur` + « Voir la réponse brute » JSON), libellés depuis `TOOLS`
  - `ChoicesInline` = port de PPG (clic → `sendMessage({ text: choice.label })`, « Autre chose ? Écrire ma demande » → focus du champ), affiché sur le dernier message quand `status === 'ready'`
  - `AssistantSignature` : pictogramme + « Assistant kpilote » + `· <état>` et les trois carrés animés pendant la génération
  - `remarkEntityLinks` : `IND-\d+` → `/indicateurs/<id>`, `COL-\d+` → `/collections/<id>` (tous tirets Unicode tolérés, URL reconstruite depuis l'id canonique) ; `remarkLineBreaks` = port de `remarkSautsDeLigne`
  - `cleanPseudoCalls` lit `TOOL_NAMES`
  - `AssistantPanel` : erreur de tour affichée avec « Réessayer » (`regenerate`) et bouton « Arrêter » (`stop`) pendant la génération, comme PPG

- [ ] **Step 1: Tests**

```ts
it('« réfléchit » quand le statut est submitted', …)
it('« consulte les sources » pendant un appel d’outil source', …)  // dernière part tool-search_indicateurs en input-available
it('« rédige » dès que du texte arrive', …)
it('null une fois le statut ready', …)
it('relie IND-42 et COL-7, y compris avec un tiret insécable', …)  // 'IND‑42' (U+2011) → lien /indicateurs/IND-42
it('retire un pseudo-appel de chaque outil déclaré', …)             // TOOL_NAMES.map(n => `${n}({"a":1})`) → ''
```

- [ ] **Step 2–4:** FAIL → implémenter → `pnpm -C apps/kpilote-webapp lint && pnpm -C apps/kpilote-webapp test` PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): chat de l'assistant calqué sur PPG`

---

### Task 14: Feedback, copie, palette et contexte de page

**Files:**
- Create: `apps/kpilote-webapp/src/assistant/{ResponseActions,NegativeFeedbackModal,usePageContext}.tsx`, `apps/kpilote-webapp/src/assistant/{copyResponse,assistantApi}.ts`
- Modify: `apps/kpilote-webapp/src/components/HeaderNav.tsx`, `apps/kpilote-webapp/src/components/command-palette/CommandPalette.tsx`
- Test: `apps/kpilote-webapp/src/assistant/copyResponse.test.ts`

**Interfaces:**
- Produces:
  - `assistantApi.ts` : `assistantAccessQueryOptions()` (`GET /assistant/acces`), `rateCall({ llmCallId, body }): Promise<void>`
  - `ResponseActions` (dernier message, `ready`) : « Copier le texte », pouce haut / pouce bas ; pouce bas ouvre `NegativeFeedbackModal` (port de `FeedbackNegatifModale` PPG sur `Modale` + `MultiToggle`, catégories `CATEGORY_LABELS`) ; envoi sur `message.metadata.llmCallId` ; échec → `Toast` d'erreur et boutons réactivés
  - `copyResponse(message: KpiloteUIMessage): string` — texte des parts `text`, nettoyé (`cleanPseudoCalls`, `flattenLatex`)
  - `usePageContext(): PageContext | undefined` — depuis la route courante (`/indicateurs/$id` → `indicateurId`, `/collections/$id` → `collectionId`, individu sélectionné dans les search params de ces pages s'il existe)
  - HeaderNav : l'entrée « Demander à l'IA » n'apparaît que si `allowed` ; `conversationId` conservé tant que l'utilisateur ne démarre pas une nouvelle conversation (retour palette ↔ assistant sans perte) ; la question saisie dans la palette est **envoyée** à l'ouverture (une seule fois, garde par ref)

- [ ] **Step 1: Test**

```ts
it('copie le texte de la réponse sans pseudo-appels ni LaTeX', …)
```

- [ ] **Step 2–4:** FAIL → implémenter → `pnpm -C apps/kpilote-webapp lint && pnpm -C apps/kpilote-webapp test` PASS
- [ ] **Step 5: Commit** — `feature(PIL-1684): feedback, copie et entrée de palette de l'assistant`

---

### Task 15: Vérification d'ensemble

- [ ] **Step 1:** `pnpm -C packages/kpilote-shared lint && pnpm -C packages/kpilote-shared test && pnpm -C apps/kpilote-api lint && pnpm -C apps/kpilote-api test && pnpm -C apps/kpilote-webapp lint && pnpm -C apps/kpilote-webapp test` — tout vert.
- [ ] **Step 2:** `git grep -n "surface\|deriveTool\|data-sources\|jest-extended" -- apps/kpilote-* packages/kpilote-*` ne renvoie que des occurrences sans rapport avec l'assistant.
- [ ] **Step 3:** Mettre à jour la description de la PR #2359 (ce que fait le lot 1, ce qui a été détruit et pourquoi, lien vers la spec) — sans pousser tant que le user ne l'a pas demandé.
