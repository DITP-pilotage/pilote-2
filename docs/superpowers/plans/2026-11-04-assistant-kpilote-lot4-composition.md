# Assistant kpilote — lot 4 (composition visuelle) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter `create_dashboard` (sous-agent de mise en page sur un contexte résolu, validation des identifiants) et le rendu des dashboards dans le chat, avec « Copier l'image ».

**Architecture:** Contrat du dashboard dans `kpilote-shared` (schéma des widgets partagé serveur / front). Serveur : contexte résolu et filtré par les règles de lecture, `generateStructured` tracé, validation a posteriori. Front : widgets qui lisent leurs données avec les `queryOptions` existantes, grille 4 colonnes, `html-to-image` pour la copie.

**Tech Stack:** identique au lot 1 ; ECharts déjà présent ; ajout de `html-to-image` à la webapp.

**Spec:** `docs/superpowers/specs/2026-11-04-assistant-kpilote-lot4-composition-design.md`

## Global Constraints

Celles des lots précédents. Aucun chiffre écrit par le modèle dans un dashboard ; discriminants en `z.enum` ; artefacts DSFR clairs.

## Review Focus

1. Identifiant de widget absent du contexte (inventé, ou d'une entité illisible) → erreur corrigeable, jamais de rendu. Test : Task 2.
2. Entité demandée illisible → erreur avant tout sous-agent. Test : Task 2.
3. Carte sur un référentiel sans widget carte, valeurs remarquables sur un référentiel étranger à l'indicateur → refus. Test : Task 2.
4. Chiffre (« 12 % », « 3 points ») dans un titre de section ou un paragraphe → refus. Test : Task 2.
5. Widget dont la requête échoue (droits, 404) → erreur isolée au widget, le reste du dashboard s'affiche. Test : Task 4 (rendu non testé).

---

### Task 1: Contrat du dashboard

**Files:** Create `packages/kpilote-shared/src/assistant/dashboard.ts` (+ test) ; Modify `packages/kpilote-shared/src/assistant/tools.ts` (+ test)

**Interfaces — Produces:**
- `WIDGET_TYPES` (9 : `kpi_indicateur`, `kpi_collection`, `evolution_indicateur`, `tableau_individus`, `contributions_collection`, `valeurs_remarquables`, `carte_indicateur`, `titre_section`, `paragraph`) ; `widgetSchema` = `discriminatedUnion('type', …)` d'objets `.strict()` avec `type: z.enum([…])` et `width?: int 1..4` ; `WIDGET_WIDTHS: Record<WidgetType, { default: number; allowed: number[] }>` ; `widgetWidth(widget)` (largeur permise, sinon défaut).
- `dashboardSchema = { titre: 1..120, containers: 1..10 de { widgets: 1..8 } }` ; types `Dashboard`, `DashboardWidget`.
- `createDashboardInput = { task: 1..1000, indicateurIds?: ≤10, collectionIds?: ≤5, individuIds?: ≤20, referentielIds?: ≤5 }`.
- `ToolKind` gagne `'dashboard'` ; `TOOLS.create_dashboard` (« Tableau de bord ») ; `ToolOutputs.create_dashboard = Dashboard`.

- [ ] Tests : chaque type accepté ; type inconnu, champ en trop, container vide refusés ; JSON Schema sans `const` ; `widgetWidth` rabat une largeur non permise. RED → GREEN ; lint ; commit `feature(PIL-1684): contrat des dashboards de l'assistant`.

### Task 2: Outil `create_dashboard`

**Files:** Create `apps/kpilote-api/src/assistant/tools/dashboard/{context,validate,prompt,createDashboard}.ts` (+ tests) ; Modify `tools/registry.ts`

**Interfaces — Produces:**
- `resolveDashboardContext(input): Promise<DashboardContext>` — indicateurs (`findReadableIndicateur` : id, nom, référentiels), collections (`findReadableCollection`), individus (`findIndividu`), référentiels donnés ∪ référentiels des indicateurs, chacun avec `carte: boolean` (a un widget de type `carte-france-*`). Illisible → `ValidationError` qui liste les identifiants.
- `validateDashboard(dashboard, context): void` — `ValidationError` si un id n'est pas dans le contexte, si `valeurs_remarquables` / `carte_indicateur` vise un référentiel hors de ceux de l'indicateur, si `carte_indicateur` vise un référentiel sans carte, si un titre ou paragraphe contient un chiffre suivi de `%`, `point(s)` ou `pts` (`NUMBER_PATTERN`, borné).
- `buildDashboardSystemPrompt()` — PPG adapté : règle absolue du contexte, catalogue, grille, patterns (cockpit, évolution, comparaison, collection), exemples.
- `createDashboard: QueryToolDefinition<'create_dashboard'>` — contexte → `generateStructured({ name: 'create_dashboard.layout', schema: dashboardSchema })` → validation → sortie.

- [ ] Tests : contexte (illisible refusé, référentiels des indicateurs ajoutés, `carte`) ; validation (chaque refus de la Review Focus) ; outil (succès tracé ; id inventé → `{ error }` ; entité illisible → `{ error }` sans appel modèle). RED → GREEN ; lint ; commit `feature(PIL-1684): outil create_dashboard`.

### Task 3: Prompt principal

- [ ] Règles PPG : « courbe », « graphique », « carte », « tableau de bord », « visualise » → `create_dashboard` ; « comment évolue » → données ; hors catalogue → `clarify_with_choices` ; après un dashboard, une phrase sans chiffre. Test : le prompt cite `create_dashboard` et la règle. Commit `feature(PIL-1684): le prompt oriente vers les dashboards`.

### Task 4: Rendu et « Copier l'image »

**Files:** Create `apps/kpilote-webapp/src/assistant/dashboard/{DashboardRender,DashboardWidget,widgets}.tsx`, `copyImage.ts` ; Modify `AssistantMessage.tsx`, `ResponseActions.tsx`, `deriveAssistantState.ts` (+ tests), `package.json`

**Interfaces — Produces:** `DashboardRender({ dashboard })` (titre, containers en `grid-cols-4`, `Suspense` « Composition du tableau de bord… », `ErrorBoundary` par widget) ; un composant par type de widget, lisant ses données par les `queryOptions` existantes ; état `composing-dashboard` (« compose le tableau de bord ») ; `copyDashboardImage(element)` (`html-to-image` `toBlob`, `pixelRatio` 2, fond blanc, `ClipboardItem` construit pendant le clic) ; bouton « Copier l'image » si la réponse a un dashboard rendu.

- [ ] Tests : état `composing-dashboard` ; `hasDashboard(message)`. RED → GREEN ; lint ; commit `feature(PIL-1684): dashboards dans le chat et copie en image`.

### Task 5: Vérification

- [ ] Lint + tests des trois paquets ; revue finale.
