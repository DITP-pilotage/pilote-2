# LLM Dashboard — Plan d'itération 2

> Ce document prépare la seconde itération du POC `compose_dashboard` en se fondant sur :
> - le PRD révisé `prd/LLM_DASHBOARD.md` (commit `ffb7ea72d`, sections §5bis, §7.2, §7.3, §7.4, §7.6 et §8),
> - l'implémentation actuelle issue du commit `843404375` (« feat: prototype »),
> - le diff `dev...proto-llm-dashboard` (≈ 2 480 lignes, 12 fichiers).
>
> Objectif : cadrer précisément **ce qui change** côté tool, tRPC, widgets React et system prompt, de façon à pouvoir attaquer l'implémentation sans re-débats.

---

## 1. Synthèse des écarts PRD ↔ prototype

Trois bascules structurelles à opérer, toutes motivées par les retours §5bis du PRD.

### 1.1. Catalogue : du paramétrique au nominal (§5bis.1 + §7.2)

Le prototype expose 5 widgets dont 2 paramétrés par un enum qui change la **nature sémantique** de ce qui est affiché :

- `kpi_card` + `metric ∈ {ta_global, mediane, nb_chantiers_en_retard}` → le LLM confond les métriques.
- `liste_chantiers_alerte` + `type_alerte ∈ {retard, difficulte}` → même problème.
- `filler` est un palliatif d'un layout trop rigide.
- `texte_section` reste utilisable mais sera renommé `widget_titre_section` pour expliciter son rôle.
- `tableau_indicateurs` reste conceptuellement bon mais sera renommé `widget_tableau_indicateurs_chantier`.

La V2 remplace le catalogue par **10 widgets nominalement nommés**, aucun enum qui change la nature affichée. Les seuls enums tolérés sont les enums de **périmètre** (ex : `maille`).

### 1.2. Qui charge les données : l'inverse de §7.6 (§5bis.2)

Le prototype applique l'**Option 1** de §7.6 (le tool charge et embarque les valeurs) au lieu de l'**Option 2** recommandée. Concrètement, dans `composeDashboard.ts` :

- `createComposeDashboardTool` dépend de `prisma`, `GetChantiersEnRetardQuery`, `GetChantiersEnDifficulteQuery`, `GetChantierIndicateursQuery` et résout même `agregerAvancementsChantiersUseCase` + `récupérerStatistiquesAvancementChantiersUseCase` via `getContainer("legacy")` / `getContainer("chantiers")` au moment de l'`execute`.
- Le tool renvoie une structure `ResolvedWidget` combinant `definition + data` (types `KpiCardData`, `TableauIndicateursData`, `ListeChantiersAlerteData`).
- `DashboardRender.tsx` ne fait que de la présentation passive sur ces données déjà résolues.

**Conséquence V2** : l'`execute` devient trivial (valider + renvoyer) et tout le fetch repart côté widget React via `api.useSuspenseQueries`, suivant le pattern déjà en place dans `_commons/Widget/WidgetCartographieTA` et consorts.

### 1.3. Flux conversationnel : plus de « plan + confirmation » (§5bis.3 + §8)

Le Pattern (g) actuel du `systemPrompt.ts` impose 5 étapes : identifier paramètres manquants → question par paramètre → reformulation en 3 lignes → confirmation texte → composition. Le PRD révisé impose un **flux 2 tours** : demande utilisateur → un seul message mixant présentation des widgets disponibles et **une seule question ouverte** pour le périmètre manquant, puis composition directe.

---

## 2. Architecture cible (vue d'ensemble)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Albert.streamText                                                          │
│    └── tools.compose_dashboard (execute: valider + return input)            │
│                            │                                                │
│                            ▼                                                │
│                 ComposeDashboardOutput = titre + containers (no data)       │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ (tool-part)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  AssistantMessage → DashboardRender                                         │
│    <Suspense fallback={DashboardLoader}>                                    │
│      {containers.map(c =>                                                   │
│        <Grid12>                                                             │
│          {c.widgets.map(w =>                                                │
│            <ErrorBoundary>                                                  │
│              <WidgetRegistry type={w.type} {...w} />                        │
│            </ErrorBoundary>                                                 │
│          )}                                                                 │
│        </Grid12>                                                            │
│      )}                                                                     │
│    </Suspense>                                                              │
└───────────────────────────────────────┬─────────────────────────────────────┘
                                        │ api.useSuspenseQueries (tRPC)
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  tRPC endpoints                                                             │
│    chantier.recupererTauxAvancementTerritoire   ← NOUVEAU                   │
│    chantier.recupererChantiersEnRetard          ← NOUVEAU                   │
│    chantier.recupererChantiersEnDifficulte      ← NOUVEAU                   │
│    chantier.recupererIndicateursChantier        ← NOUVEAU                   │
│    chantier.recupererStatistiquesAvancement     ← existe déjà               │
│    chantier.recupererTauxAvancementTerritoires  ← existe déjà               │
│    chantier.recupererMeteosTerritoires          ← existe déjà               │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. Catalogue révisé — les 10 widgets

Colonnes : **widget** · **intention métier** · **paramètres (références uniquement)** · **composant client réutilisé** · **source de données (tRPC)**.

| # | Widget | Intention | Paramètres | Composant `_commons` réutilisé | Query tRPC |
|---|---|---|---|---|---|
| 1 | `widget_taux_avancement_territoire` | « Le TA agrégé d'un territoire, en gros » | `territoire_code`, `jalon` | (nouveau KPI atomique) | `chantier.recupererTauxAvancementTerritoire` (NOUVEAU) |
| 2 | `widget_mediane_avancement_territoire` | « La médiane de répartition sur un territoire » | `territoire_code`, `jalon` | (nouveau KPI atomique) | `chantier.recupererStatistiquesAvancement` (existant) |
| 3 | `widget_nombre_chantiers_en_retard` | « Combien de chantiers sont en retard » | `territoire_code`, `jalon` | (nouveau KPI atomique) | `chantier.recupererChantiersEnRetard` (NOUVEAU, on lit `.length`) |
| 4 | `widget_valeurs_remarquables_avancement` | « Distribution du TA sur les sous-territoires : min / médiane / max » | `territoire_code`, `jalon` | `ValeursRemarquables` | `chantier.recupererStatistiquesAvancement` (existant) |
| 5 | `widget_tableau_indicateurs_chantier` | « Les indicateurs VI/VA/VC/TA d'un chantier sur un territoire » | `chantier_id`, `territoire_code`, `jalon` | `ChantierIndicateursTable` (déjà utilisé dans ChatUI) | `chantier.recupererIndicateursChantier` (NOUVEAU) |
| 6 | `widget_liste_chantiers_en_retard` | « Liste compacte des chantiers en retard » | `territoire_code`, `jalon` | (nouveau, liste simple) | `chantier.recupererChantiersEnRetard` (NOUVEAU) |
| 7 | `widget_liste_chantiers_en_difficulte` | « Liste compacte des chantiers en difficulté » | `territoire_code`, `jalon` | (nouveau, liste simple) | `chantier.recupererChantiersEnDifficulte` (NOUVEAU) |
| 8 | `widget_cartographie_taux_avancement` | « Carte de France du TA par territoire pour un ensemble de chantiers » | `maille` (`regionale` \| `departementale`), `territoire_code`, `jalon`, `chantier_ids` | `WidgetCartographieTA` (mode `chantiers`) | déjà câblé dans le composant |
| 9 | `widget_cartographie_meteo` | « Carte des météos par territoire pour un chantier » | `maille`, `territoire_code`, `chantier_id`, `jalon` | `WidgetCartographieMeteo` | déjà câblé dans le composant |
| 10 | `widget_titre_section` | Titre + description courte pour structurer le dashboard (aucun chiffre) | `titre`, `description?` | (nouveau, purement présentationnel) | — |

### 3.1. Widgets supprimés par rapport au prototype

- `kpi_card` → éclaté en widgets 1, 2, 3 (un par métrique).
- `liste_chantiers_alerte` → éclaté en widgets 6 et 7.
- `filler` → supprimé. Un trou dans la grille est acceptable, et `allowed_widths` + packing implicite suffisent à éviter les mises en page bancales.
- `texte_section` → renommé `widget_titre_section` pour expliciter son rôle sémantique.

### 3.2. Tailles (grille 12 colonnes)

| Widget | `default_width` | `allowed_widths` | Justification |
|---|---|---|---|
| `widget_taux_avancement_territoire` | 3 | `[3, 4, 6]` | KPI court |
| `widget_mediane_avancement_territoire` | 3 | `[3, 4, 6]` | idem |
| `widget_nombre_chantiers_en_retard` | 3 | `[3, 4, 6]` | idem |
| `widget_valeurs_remarquables_avancement` | 6 | `[4, 6, 8]` | Trio min/médiane/max |
| `widget_tableau_indicateurs_chantier` | 12 | `[12]` | Beaucoup de colonnes |
| `widget_liste_chantiers_en_retard` | 6 | `[6, 12]` | Liste verticale |
| `widget_liste_chantiers_en_difficulte` | 6 | `[6, 12]` | idem |
| `widget_cartographie_taux_avancement` | 12 | `[6, 8, 12]` | SVG, lit mieux en grand |
| `widget_cartographie_meteo` | 12 | `[6, 8, 12]` | idem |
| `widget_titre_section` | 12 | `[6, 12]` | Séparateur sémantique |

---

## 4. Refonte du tool `compose_dashboard`

### 4.1. Signature de la factory — disparition de la DI métier

**Avant** (`src/server/albert/tools/composeDashboard.ts:299`) :

```ts
export function createComposeDashboardTool({
  prisma,
  getChantiersEnRetardQuery,
  getChantiersEnDifficulteQuery,
  getChantierIndicateursQuery,
}: { /* … */ }) {
  return ({ habilitations }: { habilitations: Habilitations }) => tool({ … });
}
```

**Après** :

```ts
export function createComposeDashboardTool() {
  return ({ habilitations }: { habilitations: Habilitations }) => tool({ … });
}
```

Plus aucune query ni use case métier injecté. La factory n'a plus rien à faire au niveau du container DI — son rôle se limite à produire, par appel, un `tool(...)` qui capture les `habilitations` de la session courante.

Côté `src/server/albert/module.ts` : la ligne `createComposeDashboardTool: asModuleFunction(createComposeDashboardTool)` reste fonctionnelle puisque la factory n'a plus de dépendances, mais on peut tout aussi bien la réécrire en `asValue(() => createComposeDashboardTool())` ou la retirer du cradle et l'importer directement dans la route. **Recommandé** : garder `asModuleFunction` pour minimiser la diff côté wiring et rester cohérent avec les autres tools.

### 4.2. Schéma Zod — discriminated union à 10 cas

Le schéma est structuré par fichiers dédiés pour limiter la longueur :

```
src/server/albert/tools/composeDashboard/
  composeDashboard.ts              ← factory du tool + execute
  composeDashboardSchema.ts        ← union Zod + types exportés
  composeDashboardLayout.ts        ← DEFAULT_WIDTHS (et plus de ROW_GROUPS)
  widgets/
    widgetTauxAvancementTerritoire.ts
    widgetMedianeAvancementTerritoire.ts
    widgetNombreChantiersEnRetard.ts
    widgetValeursRemarquablesAvancement.ts
    widgetTableauIndicateursChantier.ts
    widgetListeChantiersEnRetard.ts
    widgetListeChantiersEnDifficulte.ts
    widgetCartographieTauxAvancement.ts
    widgetCartographieMeteo.ts
    widgetTitreSection.ts
```

> Alternative acceptable : tout garder dans un seul fichier `composeDashboard.ts`, vu que chaque widget fait ~10 lignes de Zod. Décision : **commencer monofichier** (plus lisible en une lecture pour réviser le catalogue), extraire seulement si le fichier dépasse ~400 lignes.

#### 4.2.1. Références partagées

```ts
const jalonSchema = z.number().int().min(2022).max(new Date().getFullYear())
  .describe("Année du jalon (ex: 2024, 2025)");

const territoireCodeSchema = z.string()
  .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)");

const chantierIdSchema = z.string()
  .describe("Identifiant du chantier (ex: CH-001)");

const mailleSchema = z.enum(["regionale", "departementale"])
  .describe("Maille cartographique — enum de périmètre (zoom), pas de nature sémantique.");
```

#### 4.2.2. Widgets KPI atomiques

```ts
const widgetTauxAvancementTerritoire = z.object({
  type: z.literal("widget_taux_avancement_territoire"),
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z.union([z.literal(3), z.literal(4), z.literal(6)]).optional()
    .describe("default_width=3, allowed_widths=[3,4,6]"),
}).strict();

const widgetMedianeAvancementTerritoire = z.object({
  type: z.literal("widget_mediane_avancement_territoire"),
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z.union([z.literal(3), z.literal(4), z.literal(6)]).optional(),
}).strict();

const widgetNombreChantiersEnRetard = z.object({
  type: z.literal("widget_nombre_chantiers_en_retard"),
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z.union([z.literal(3), z.literal(4), z.literal(6)]).optional(),
}).strict();
```

#### 4.2.3. Widget distribution

```ts
const widgetValeursRemarquablesAvancement = z.object({
  type: z.literal("widget_valeurs_remarquables_avancement"),
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z.union([z.literal(4), z.literal(6), z.literal(8)]).optional(),
}).strict();
```

#### 4.2.4. Widgets listes et tableau

```ts
const widgetTableauIndicateursChantier = z.object({
  type: z.literal("widget_tableau_indicateurs_chantier"),
  chantier_id: chantierIdSchema,
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z.literal(12).optional(),
}).strict();

const widgetListeChantiersEnRetard = z.object({
  type: z.literal("widget_liste_chantiers_en_retard"),
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z.union([z.literal(6), z.literal(12)]).optional(),
}).strict();

const widgetListeChantiersEnDifficulte = z.object({
  type: z.literal("widget_liste_chantiers_en_difficulte"),
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  width: z.union([z.literal(6), z.literal(12)]).optional(),
}).strict();
```

#### 4.2.5. Widgets cartographie

```ts
const widgetCartographieTauxAvancement = z.object({
  type: z.literal("widget_cartographie_taux_avancement"),
  maille: mailleSchema,
  territoire_code: territoireCodeSchema,
  jalon: jalonSchema,
  chantier_ids: z.array(chantierIdSchema).min(1)
    .describe("Sous-ensemble de chantiers à agréger sur la carte."),
  width: z.union([z.literal(6), z.literal(8), z.literal(12)]).optional(),
}).strict();

const widgetCartographieMeteo = z.object({
  type: z.literal("widget_cartographie_meteo"),
  maille: mailleSchema,
  territoire_code: territoireCodeSchema,
  chantier_id: chantierIdSchema,
  jalon: jalonSchema,
  width: z.union([z.literal(6), z.literal(8), z.literal(12)]).optional(),
}).strict();
```

#### 4.2.6. Widget titre

```ts
const widgetTitreSection = z.object({
  type: z.literal("widget_titre_section"),
  titre: z.string().min(1).max(120)
    .describe("Titre de section — AUCUN chiffre (ni %, ni points)."),
  description: z.string().max(500).optional()
    .describe("Description facultative — AUCUN chiffre."),
  width: z.union([z.literal(6), z.literal(12)]).optional(),
}).strict();
```

#### 4.2.7. Union et racine

```ts
const widgetInputSchema = z.discriminatedUnion("type", [
  widgetTauxAvancementTerritoire,
  widgetMedianeAvancementTerritoire,
  widgetNombreChantiersEnRetard,
  widgetValeursRemarquablesAvancement,
  widgetTableauIndicateursChantier,
  widgetListeChantiersEnRetard,
  widgetListeChantiersEnDifficulte,
  widgetCartographieTauxAvancement,
  widgetCartographieMeteo,
  widgetTitreSection,
]);

const containerInputSchema = z.object({
  widgets: z.array(widgetInputSchema).min(1).max(12),
}).strict();

export const composeDashboardInputSchema = z.object({
  titre: z.string().min(1).max(120),
  containers: z.array(containerInputSchema).min(1).max(30),
}).strict();
```

**Ce qui disparaît par rapport au prototype** :

- Plus de `superRefine` « row_group homogène » sur le container (§5bis.1 — la règle n'a plus de sens sans enum de métrique).
- Plus de `fillerWidgetInput`, plus d'enum `ROW_GROUPS`.
- Plus d'`kpiMetricSchema`.

### 4.3. Types exportés

Le `ComposeDashboardOutput` se simplifie drastiquement :

```ts
export type WidgetDefinition = z.infer<typeof widgetInputSchema>;
export type ContainerDefinition = { widgets: WidgetDefinition[] };

export type ComposeDashboardOutput = {
  titre: string;
  containers: ContainerDefinition[];
  _output_instructions: string;
};
```

**Disparaissent complètement** :

- `ResolvedWidget` et toutes ses variantes (`kind: "kpi_card" | "tableau_indicateurs" | "liste_chantiers_alerte" | "texte_section" | "filler" | "error"`).
- `KpiCardData`, `TableauIndicateursData`, `ListeChantiersAlerteData`.
- `ResolvedContainer`.

`PiloteUIMessage.ts` n'a **aucune modification structurelle** à faire : le type `ComposeDashboardOutput` y est référencé par nom, le changement de forme se propage automatiquement dans le type `PiloteUITools.compose_dashboard.output`.

### 4.4. `execute` — trois checks, un return

```ts
execute: async (input): Promise<ComposeDashboardOutput> => {
  const territoiresAccessibles = habilitations.lecture.territoires;

  for (const container of input.containers) {
    for (const widget of container.widgets) {
      // 1. Habilitations territoriales
      if ("territoire_code" in widget
          && !territoiresAccessibles.includes(widget.territoire_code)) {
        throw new Error(
          `Accès non autorisé au territoire ${widget.territoire_code}. Choisis un territoire dans la liste des territoires accessibles.`,
        );
      }

      // 2. Linter anti-chiffres sur widget_titre_section
      if (widget.type === "widget_titre_section") {
        const forbidden = findForbiddenNumber(widget.titre)
          ?? findForbiddenNumber(widget.description);
        if (forbidden !== null) {
          throw new Error(
            `Le widget_titre_section ne doit contenir aucune valeur chiffrée ("${forbidden}"). Utilise un widget KPI atomique pour afficher un chiffre.`,
          );
        }
      }
    }
  }

  // 3. Return as-is avec instructions de format
  return {
    titre: input.titre,
    containers: input.containers,
    _output_instructions: OUTPUT_INSTRUCTIONS,
  };
},
```

**Points structurants** :

- On **throw** sur violation plutôt que de retourner un widget `kind: "error"` — le AI SDK capture l'erreur, la retransmet au LLM, et le tour suivant compose à nouveau. Plus simple qu'un mode dégradé où l'on affiche un dashboard partiellement cassé.
- On garde `FORBIDDEN_NUMBER_PATTERN` et `findForbiddenNumber` du prototype tels quels — la regex fait bien son travail et la décision produit a été validée au §9 du PRD.
- **Aucun** accès DB / query / use case dans `execute`. `prisma` n'est plus importé dans le fichier.
- La fonction `determineMaille` et `formatPourcentage` disparaissent du fichier — elles n'ont plus d'utilité côté tool (elles iront vivre dans les endpoints tRPC et/ou les adaptateurs React qui en ont besoin).

### 4.5. Description du tool — ce qui change dans la prompt interne

La `description` injectée dans `tool({...})` doit :

- Remplacer le tableau des 5 widgets par le tableau des 10 widgets (sans colonne `row_group`).
- Supprimer toute mention de « row_group homogène », de `filler`, de `kpi_card.metric`.
- Supprimer les références au Pattern (g) en 5 étapes : remplacer par une consigne courte rappelant que l'outil n'embarque **aucun** chiffre (référence seulement) et que l'édition se fait par rewrite complet.
- Conserver la section « Règles JSON strictes » (pas de commentaires, pas de virgules traînantes, …) — cf. `composeDashboard.ts:346-354`, elle a fait ses preuves.

---

## 5. Nouveaux endpoints tRPC

Cinq queries sont déjà utilisables, quatre sont à créer.

### 5.1. Déjà disponibles (rien à faire)

| Endpoint | Signature | Utilisé par |
|---|---|---|
| `api.chantier.recupererStatistiquesAvancement` | `{ chantierIds, maille, jalon } → { médiane, minimum, maximum, … }` | `widget_mediane_avancement_territoire`, `widget_valeurs_remarquables_avancement`, `widget_cartographie_taux_avancement` |
| `api.chantier.recupererTauxAvancementTerritoires` | `{ chantierIds, jalon } → TauxAvancementComparaisonTerritoireViewModel[]` | `widget_valeurs_remarquables_avancement`, `widget_cartographie_taux_avancement` |
| `api.chantier.recupererMeteosTerritoires` | `{ chantierId, jalon } → …` | `widget_cartographie_meteo` |

### 5.2. À créer — route `src/server/infrastructure/api/trpc/routes/chantier.ts`

#### 5.2.1. `recupererTauxAvancementTerritoire` (singulier)

Agrège le TA d'**un** territoire pour **un** jalon. C'est la logique qui vit aujourd'hui dans `src/server/albert/tools/getTauxAvancementTerritoire.ts` (lignes 74-166) et qui est partiellement dupliquée dans `composeDashboard.ts` (`resolveKpiCard` pour `metric === "ta_global"`).

```ts
recupererTauxAvancementTerritoire: procédureProtégée
  .input(z.object({
    territoireCode: z.string(),
    jalon: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    new Habilitation(ctx.session.habilitations)
      .vérifierLesHabilitationsEnLecture(null, input.territoireCode);
    return getContainer("chantiers")
      .resolve("recupererTauxAvancementTerritoireQuery")
      .execute(input);
  }),
```

**Implémentation côté query** : nouveau `RecupererTauxAvancementTerritoireQuery` dans `src/server/chantiers/query/` (ou infrastructure/queries/) qui encapsule :

- récupération des `chantier_ids` publiés (`chantier_identite.findMany({ where: { statut: PUBLIE } })`),
- appel à `agregerAvancementsChantiersUseCase.run(chantierIds, jalon)` (à résoudre via `legacyContainer` comme aujourd'hui),
- extraction du `territoireData.repartition.avancements.annuel.moyenne` pour le `territoire_code` demandé.

Retour : `{ territoire_code, jalon, taux_avancement: number | null }`.

**Où la déclarer dans le module** : `chantiersModule` (`src/server/chantiers/module.ts:156-205`) au même niveau que les autres queries existantes.

#### 5.2.2. `recupererChantiersEnRetard`

Rewrapper direct de `GetChantiersEnRetardQuery` (déjà présent dans `src/server/chantiers/query/GetChantiersEnRetardQuery.ts`).

```ts
recupererChantiersEnRetard: procédureProtégée
  .input(z.object({
    territoireCode: z.string(),
    jalon: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    new Habilitation(ctx.session.habilitations)
      .vérifierLesHabilitationsEnLecture(null, input.territoireCode);
    return getContainer("chantiers")
      .resolve("getChantiersEnRetardQuery")
      .execute(input);
  }),
```

**Déplacement nécessaire** : la classe `GetChantiersEnRetardQuery` est actuellement déclarée dans `albertModule` (`module.ts:61`). Elle doit **migrer** vers `chantiersModule` et être ajoutée à ses `exports`, pour qu'`albertModule` (et la route tRPC) la consomment via le mécanisme module → module. Voir §9 « Migrations module ».

#### 5.2.3. `recupererChantiersEnDifficulte`

Symétrique du précédent, sur `GetChantiersEnDifficulteQuery`. Même migration module.

```ts
recupererChantiersEnDifficulte: procédureProtégée
  .input(z.object({
    territoireCode: z.string(),
    jalon: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    new Habilitation(ctx.session.habilitations)
      .vérifierLesHabilitationsEnLecture(null, input.territoireCode);
    return getContainer("chantiers")
      .resolve("getChantiersEnDifficulteQuery")
      .execute(input);
  }),
```

#### 5.2.4. `recupererIndicateursChantier`

Wrapper sur `GetChantierIndicateursQuery` (déjà utilisé par le tool Albert `get_chantier_indicateurs`).

```ts
recupererIndicateursChantier: procédureProtégée
  .input(z.object({
    chantierId: z.string(),
    territoireCode: z.string(),
    jalon: z.number(),
  }))
  .query(async ({ input, ctx }) => {
    new Habilitation(ctx.session.habilitations)
      .vérifierLesHabilitationsEnLecture(input.chantierId, input.territoireCode);
    return getContainer("chantiers")
      .resolve("getChantierIndicateursQuery")
      .execute(input);
  }),
```

Migration module identique : `GetChantierIndicateursQuery` passe de `albertModule` à `chantiersModule`.

### 5.3. Habilitations côté tRPC

Chacun des 4 nouveaux endpoints applique les habilitations via `new Habilitation(ctx.session.habilitations).vérifierLesHabilitationsEnLecture(chantierId | null, territoireCode | null)`, cohérent avec les autres endpoints de `chantierRouter` (voir `chantier.ts:45-60`). C'est cette vérification qui fait respecter la contrainte PRD §7.5 « habilitations appliquées au rendu, pas à la composition ».

---

## 6. Côté client — le registre d'adaptateurs

### 6.1. Arborescence proposée

```
src/client/components/_commons/ChatUI/DashboardWidgets/
  index.ts                                           ← export du registre
  DashboardWidgetRegistry.tsx                        ← dispatcher par type
  DashboardWidgetTauxAvancementTerritoire.tsx
  DashboardWidgetMedianeAvancementTerritoire.tsx
  DashboardWidgetNombreChantiersEnRetard.tsx
  DashboardWidgetValeursRemarquablesAvancement.tsx
  DashboardWidgetTableauIndicateursChantier.tsx
  DashboardWidgetListeChantiersEnRetard.tsx
  DashboardWidgetListeChantiersEnDifficulte.tsx
  DashboardWidgetCartographieTauxAvancement.tsx
  DashboardWidgetCartographieMeteo.tsx
  DashboardWidgetTitreSection.tsx
  DashboardWidgetError.tsx                           ← fallback ErrorBoundary
  DashboardWidgetLoader.tsx                          ← fallback Suspense global
```

Rationale de l'arborescence :

- On reste **dans** `_commons/ChatUI/` parce que ces widgets n'ont de sens que dans le contexte du chat Albert — les vrais widgets PILOTE (`_commons/Widget/*`) restent utilisés tels quels, les adaptateurs ne font que les envelopper pour leur passer les bonnes props depuis le tool output.
- Un fichier par widget, nom en miroir du `type` Zod — facilite le grep et la revue.

### 6.2. Pattern d'un adaptateur

Modèle de référence pour un KPI atomique (le plus simple) :

```tsx
// DashboardWidgetTauxAvancementTerritoire.tsx
import api from "@/server/infrastructure/api/trpc/api";
import { WIDGET_STALE_TIME } from "@/components/_commons/Widget/constants";

export const DashboardWidgetTauxAvancementTerritoire = ({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}) => {
  const [data] = api.chantier.recupererTauxAvancementTerritoire.useSuspenseQuery(
    { territoireCode, jalon },
    { staleTime: WIDGET_STALE_TIME },
  );

  return (
    <KpiCard
      label="Taux d'avancement"
      value={formatPourcentage(data.taux_avancement)}
      footer={`${territoireCode} · jalon ${jalon}`}
    />
  );
};
```

Les deux autres KPI atomiques (`mediane`, `nombre_chantiers_en_retard`) suivent exactement le même pattern en changeant l'endpoint appelé et le formatage de la valeur.

### 6.3. Adaptateurs composites (réutilisation directe)

Cas facile — on ne fait que passer les props :

```tsx
// DashboardWidgetCartographieTauxAvancement.tsx
import { WidgetCartographieTA } from "@/components/_commons/Widget/WidgetCartographieTA/WidgetCartographieTA";

export const DashboardWidgetCartographieTauxAvancement = ({
  maille, territoireCode, jalon, chantierIds,
}: { maille: "regionale" | "departementale"; territoireCode: string; jalon: number; chantierIds: string[] }) => (
  <WidgetCartographieTA
    mode="chantiers"
    chantierIds={chantierIds}
    maille={maille}
    territoireCode={territoireCode}
    jalon={jalon}
  />
);
```

`WidgetCartographieTA` se charge **déjà** du `api.useSuspenseQueries` (cf. `WidgetCartographieTA.tsx:55-66`). L'adaptateur est pure glue — c'est précisément le gain recherché par le PRD §7.6.

Même schéma pour :

- `DashboardWidgetCartographieMeteo` → passe à `WidgetCartographieMeteo`.
- `DashboardWidgetValeursRemarquablesAvancement` → wrappe `ValeursRemarquables` (cf. `src/client/components/_commons/Widget/ValeursRemarquables.tsx`) après avoir récupéré les stats via `api.chantier.recupererStatistiquesAvancement.useSuspenseQuery`. **Note** : comme `ValeursRemarquables` attend déjà des valeurs formatées, on fait un petit format côté adaptateur. Pour le `chantierIds` nécessaire à l'endpoint, on récupère côté adaptateur la liste des chantiers publiés via une nouvelle query ou on passe par un endpoint spécifique — **à trancher en impl** : soit un endpoint helper `chantier.recupererChantiersIdsPublies`, soit faire en sorte que `recupererStatistiquesAvancement` accepte une modalité « tous les chantiers publiés » (boolean flag). La seconde option est plus propre.
- `DashboardWidgetTableauIndicateursChantier` → fait lui-même le `useSuspenseQuery` sur `recupererIndicateursChantier` et passe le résultat au `ChantierIndicateursTable` déjà utilisé par la ChatUI (`src/client/components/_commons/ChatUI/ChantierIndicateursTable.tsx`).

### 6.4. Adaptateurs « liste »

Un pattern sensiblement différent puisqu'il faut un composant visuel dédié (pas de réutilisation directe dans `_commons/Widget/*` qui serait assez proche visuellement — le prototype avait inliné ça dans `DashboardRender.tsx`). **Recommandation** : extraire le markup existant de `DashboardRender.tsx` (`ListeChantiersAlerteWidget`, `ChantierAlerteLigne`, `METEO_LABELS`) dans un composant partagé `DashboardChantiersListe` placé à côté des adaptateurs, consommé par les deux adaptateurs `EnRetard` / `EnDifficulte`.

```tsx
// DashboardWidgetListeChantiersEnRetard.tsx
import api from "@/server/infrastructure/api/trpc/api";
import { DashboardChantiersListe } from "./DashboardChantiersListe";

export const DashboardWidgetListeChantiersEnRetard = ({
  territoireCode, jalon,
}: { territoireCode: string; jalon: number }) => {
  const [data] = api.chantier.recupererChantiersEnRetard.useSuspenseQuery({
    territoireCode, jalon,
  });

  return (
    <DashboardChantiersListe
      titre="Chantiers en retard"
      territoireCode={territoireCode}
      lignes={data.chantiers_en_retard.map(c => ({
        id: c.chantier.id,
        nom: c.chantier.nom,
        ecart: c.ecart,
        meteo: c.synthese?.meteo ?? null,
      }))}
    />
  );
};
```

### 6.5. Dispatcher — `DashboardWidgetRegistry`

C'est la seule pièce qui connaît l'union complète. On évite un gros `switch` en ligne dans `DashboardRender` :

```tsx
// DashboardWidgetRegistry.tsx
import type { WidgetDefinition } from "@/server/albert/tools/composeDashboard";

export const DashboardWidgetRegistry = ({ widget }: { widget: WidgetDefinition }) => {
  switch (widget.type) {
    case "widget_taux_avancement_territoire":
      return <DashboardWidgetTauxAvancementTerritoire
        territoireCode={widget.territoire_code}
        jalon={widget.jalon} />;
    case "widget_mediane_avancement_territoire":
      return <DashboardWidgetMedianeAvancementTerritoire
        territoireCode={widget.territoire_code}
        jalon={widget.jalon} />;
    case "widget_nombre_chantiers_en_retard":
      return <DashboardWidgetNombreChantiersEnRetard
        territoireCode={widget.territoire_code}
        jalon={widget.jalon} />;
    case "widget_valeurs_remarquables_avancement":
      return <DashboardWidgetValeursRemarquablesAvancement
        territoireCode={widget.territoire_code}
        jalon={widget.jalon} />;
    case "widget_tableau_indicateurs_chantier":
      return <DashboardWidgetTableauIndicateursChantier
        chantierId={widget.chantier_id}
        territoireCode={widget.territoire_code}
        jalon={widget.jalon} />;
    case "widget_liste_chantiers_en_retard":
      return <DashboardWidgetListeChantiersEnRetard
        territoireCode={widget.territoire_code}
        jalon={widget.jalon} />;
    case "widget_liste_chantiers_en_difficulte":
      return <DashboardWidgetListeChantiersEnDifficulte
        territoireCode={widget.territoire_code}
        jalon={widget.jalon} />;
    case "widget_cartographie_taux_avancement":
      return <DashboardWidgetCartographieTauxAvancement
        maille={widget.maille}
        territoireCode={widget.territoire_code}
        jalon={widget.jalon}
        chantierIds={widget.chantier_ids} />;
    case "widget_cartographie_meteo":
      return <DashboardWidgetCartographieMeteo
        maille={widget.maille}
        territoireCode={widget.territoire_code}
        chantierId={widget.chantier_id}
        jalon={widget.jalon} />;
    case "widget_titre_section":
      return <DashboardWidgetTitreSection
        titre={widget.titre}
        description={widget.description} />;
  }
};
```

Le `switch` est exhaustif sur la discriminated union : TypeScript rejettera tout ajout futur de widget qui ne serait pas câblé ici.

### 6.6. `DashboardRender.tsx` — refonte

Le fichier actuel (412 lignes) fait trois choses :
1. Mise en page grille 12 colonnes (à garder).
2. Dispatch sur `ResolvedWidget.kind` avec lecture de `.data` (**à supprimer**).
3. `DashboardSkeleton` pour le streaming (**à simplifier**).

**Nouvelle version** :

```tsx
import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import type {
  ComposeDashboardOutput,
  WidgetDefinition,
} from "@/server/albert/tools/composeDashboard";
import { DEFAULT_WIDTHS } from "@/server/albert/tools/composeDashboardLayout";
import { DashboardWidgetRegistry } from "./DashboardWidgets/DashboardWidgetRegistry";
import { DashboardWidgetError } from "./DashboardWidgets/DashboardWidgetError";
import { DashboardLoader } from "./DashboardWidgets/DashboardLoader";

const WIDTH_TO_CLASS: Record<number, string> = {
  3: "col-span-12 md:col-span-3",
  4: "col-span-12 md:col-span-4",
  6: "col-span-12 md:col-span-6",
  8: "col-span-12 md:col-span-8",
  12: "col-span-12",
};

function resolveWidgetWidth(widget: WidgetDefinition): number {
  return ("width" in widget && widget.width !== undefined)
    ? widget.width
    : DEFAULT_WIDTHS[widget.type] ?? 12;
}

export const DashboardRender = ({ output }: { output: ComposeDashboardOutput }) => (
  <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 p-4">
    <h3 className="text-base font-semibold text-gray-900 mb-3">{output.titre}</h3>
    <Suspense fallback={<DashboardLoader containersCount={output.containers.length} />}>
      <div className="space-y-3">
        {output.containers.map((container, containerIndex) => (
          <div key={containerIndex} className="grid grid-cols-12 gap-2">
            {container.widgets.map((widget, widgetIndex) => {
              const width = resolveWidgetWidth(widget);
              const innerClassName = WIDTH_TO_CLASS[width] ?? "col-span-12";
              return (
                <div key={widgetIndex} className={innerClassName}>
                  <ErrorBoundary FallbackComponent={DashboardWidgetError}>
                    <DashboardWidgetRegistry widget={widget} />
                  </ErrorBoundary>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </Suspense>
  </div>
);
```

**À noter** :

- **Un seul** `Suspense` boundary au niveau du `DashboardRender`, avec un fallback simple (rectangle + loader centré), cf. PRD §7.6 « Application stricte ». Pas de skeleton per-widget.
- **Un** `ErrorBoundary` **par widget** — un `territoire_code` refusé ou un `chantier_id` inexistant ne casse pas tout le dashboard.
- `react-error-boundary` est déjà disponible dans le projet (à confirmer, sinon fallback sur un composant class maison — mais l'écosystème l'a déjà très probablement).
- Plus de lecture de `widget.definition` : on lit directement `widget.territoire_code` etc. depuis la `WidgetDefinition` renvoyée telle quelle par le tool.

### 6.7. Sort de `DashboardSkeleton`

Le prototype utilise `DashboardSkeleton` pour afficher une maquette en mode `input-streaming` (voir `AssistantMessage.tsx:137-141`). Le PRD §7.6 « Un Suspense boundary unique au niveau du DashboardRender, avec un fallback volontairement simple » rend ça superflu. **Décision** :

- Supprimer `DashboardSkeleton` et toute sa logique d'extraction (`extractSkeletonContainers`, `extractSkeletonTitre`, `WidgetSkeleton`, `FALLBACK_CONTAINERS`, `SkeletonWidget`, `SkeletonContainer`).
- En mode streaming, afficher simplement un `DashboardLoader` identique au fallback Suspense.

`AssistantMessage.tsx` se simplifie :

```tsx
if (part.type === "tool-compose_dashboard") {
  if (part.state === "output-error") return null;
  if (part.state === "output-available") {
    return (
      <div key={index} className="max-w-6xl mx-auto">
        <DashboardRender output={part.output} />
      </div>
    );
  }
  return (
    <div key={index} className="max-w-6xl mx-auto">
      <DashboardLoader />
    </div>
  );
}
```

### 6.8. Gestion du `chantier_ids` des chantiers publiés pour les widgets qui en ont besoin

Le `widget_valeurs_remarquables_avancement` et indirectement le KPI `widget_taux_avancement_territoire` (si implémenté en réutilisant `recupererStatistiquesAvancement`) ont besoin d'une liste de `chantierIds`. Côté tool, on ne veut **surtout pas** que le LLM fournisse cette liste (il n'est pas censé la connaître).

**Deux options** :

- (A) Côté endpoint tRPC, accepter que si `chantierIds` est omis ou remplacé par un flag `tous_chantiers_publies: true`, le serveur fasse lui-même le `findMany` sur `chantier_identite.statut = PUBLIE`. Endpoint plus permissif mais moins strict sur le paramètre.
- (B) Côté adaptateur React, appeler **deux** queries : une pour récupérer les ids publiés, l'autre pour les stats. Moins propre (N+1 et deux renders Suspense).

**Recommandation** : option (A), variante « endpoint dédié » — créer des endpoints tRPC qui encapsulent le cas « tous les chantiers publiés » pour ne pas polluer `recupererStatistiquesAvancement` (déjà utilisée ailleurs). Concrètement on ne touche pas à `recupererStatistiquesAvancement`, on crée :

- `recupererStatistiquesAvancementTousChantiersPublies({ territoireCode, jalon })` — interne : fait le findMany + appelle l'use case. Sert pour `widget_mediane_avancement_territoire` ET `widget_valeurs_remarquables_avancement`.
- `recupererTauxAvancementTerritoire({ territoireCode, jalon })` — idem, déjà listé en §5.2.1.

On garde ainsi les anciens endpoints intacts et on expose des endpoints « haute-niveau » à grain de `{ territoireCode, jalon }`.

---

## 7. Système de prompt — réécriture du Pattern (g)

Le Pattern (g) actuel (lignes 221-281 de `systemPrompt.ts`) fait ~60 lignes et décrit : containers, row_groups, catalogue avec enums, structure recommandée, heuristiques, règles JSON strictes, édition. Il doit être **remplacé en bloc**.

### 7.1. Nouveau catalogue dans le prompt

Remplacer le tableau (lignes 230-239) par :

```markdown
**Catalogue de widgets** (10 intentions métier nominalement nommées) :

| Widget | Intention | Paramètres (références uniquement) | default_width | allowed_widths |
|---|---|---|---|---|
| `widget_taux_avancement_territoire` | TA agrégé d'un territoire | territoire_code, jalon | 3 | [3,4,6] |
| `widget_mediane_avancement_territoire` | Médiane du TA sur les sous-territoires | territoire_code, jalon | 3 | [3,4,6] |
| `widget_nombre_chantiers_en_retard` | Nombre de chantiers en retard | territoire_code, jalon | 3 | [3,4,6] |
| `widget_valeurs_remarquables_avancement` | Min/médiane/max du TA sur les sous-territoires | territoire_code, jalon | 6 | [4,6,8] |
| `widget_tableau_indicateurs_chantier` | VI/VA/VC/TA d'un chantier | chantier_id, territoire_code, jalon | 12 | [12] |
| `widget_liste_chantiers_en_retard` | Liste compacte chantiers en retard (écart ≤ -10 pts) | territoire_code, jalon | 6 | [6,12] |
| `widget_liste_chantiers_en_difficulte` | Liste compacte chantiers en difficulté (météo ORAGE/NUAGE) | territoire_code, jalon | 6 | [6,12] |
| `widget_cartographie_taux_avancement` | Carte de France du TA | maille, territoire_code, jalon, chantier_ids | 12 | [6,8,12] |
| `widget_cartographie_meteo` | Carte de France des météos | maille, territoire_code, chantier_id, jalon | 12 | [6,8,12] |
| `widget_titre_section` | Titre de section (AUCUN chiffre) | titre, description? | 12 | [6,12] |
```

**Aucune colonne `row_group`**, **aucun enum de métrique**, **aucun `filler`**. Le nom **est** l'intention.

### 7.2. Nouveau Pattern (g) — flux 2 tours

Remplacer les lignes 246-281 par (extrait adapté du §8.3 du PRD) :

```markdown
**Protocole (flux en 2 tours)** :

1. **Si le périmètre minimum est connu** (territoire ET jalon, soit par le contexte agent, soit par les tours précédents) : appelle `compose_dashboard` directement avec une composition par défaut adaptée à la demande. Ne pose pas de question.

2. **Sinon** : réponds en **un seul message** qui combine (a) une phrase courte expliquant que tu vas composer un dashboard, (b) une liste nominale de 4-6 widgets disponibles pertinents au regard de la demande (pour informer, pas pour que l'utilisateur les choisisse un par un), (c) **une seule question ouverte** pour récupérer le périmètre manquant. **N'enchaîne pas plusieurs questions**, même si plusieurs paramètres manquent — regroupe-les dans une seule formulation.

3. **Ne reformule pas de plan, ne demande pas de confirmation textuelle** avant de composer. Compose directement dès que le périmètre minimum est connu — l'utilisateur corrigera après coup sur le dashboard rendu.

4. **Ne commente pas le contenu chiffré** une fois le dashboard composé. Une phrase courte d'introduction suffit ("Voici le dashboard demandé.").

5. **Édition en conversation** : rappelle `compose_dashboard` avec une nouvelle définition complète qui reprend les containers à conserver et applique les changements. Pas de patch incrémental, pas de question préalable.

**Structure recommandée d'un cockpit territoire** : un `widget_titre_section`, puis un container avec `widget_taux_avancement_territoire` + `widget_nombre_chantiers_en_retard` + `widget_valeurs_remarquables_avancement` (trois widgets compacts sur une rangée), puis un container avec `widget_cartographie_taux_avancement`, puis un container avec `widget_liste_chantiers_en_retard` et `widget_liste_chantiers_en_difficulte` côte à côte en largeur 6.

**Règle de factualité** : tu ne passes JAMAIS de valeur chiffrée dans les paramètres — uniquement des références (territoire_code, chantier_id, jalon, maille). Les chiffres sont résolus au rendu côté client.
```

### 7.3. Règles JSON strictes

Les lignes 265-271 (« Règles JSON strictes ») **restent telles quelles**. Elles adressent un problème orthogonal au catalogue et ont prouvé leur utilité dans le prototype.

### 7.4. AssistantMessageText — liste des tool names

`AssistantMessageText.tsx:9-17` contient un `TOOL_NAMES` utilisé pour `stripPseudoToolCalls`. **Rien à changer** : `compose_dashboard` y est déjà, et le changement de schéma du tool n'affecte pas son nom.

---

## 8. Shape finale du tool — résumé

```ts
// Input (ce que le LLM produit)
type ComposeDashboardInput = {
  titre: string;
  containers: Array<{
    widgets: Array<WidgetDefinition>;
  }>;
};

// WidgetDefinition = discriminated union sur `type` avec 10 cas

// Output (ce que le tool renvoie — pratiquement identique à l'input)
type ComposeDashboardOutput = {
  titre: string;
  containers: Array<{
    widgets: Array<WidgetDefinition>;
  }>;
  _output_instructions: string;
};
```

**C'est tout.** Plus de `ResolvedWidget`, plus de `data`, plus de `kind: "error"`. Le tool est une fonction de validation qui renvoie son argument.

---

## 9. Migrations module (DI)

Conséquence directe du déplacement de la logique de fetch : les trois queries métier suivantes doivent **cesser** d'être enregistrées dans `albertModule` et **passer** dans `chantiersModule` avec export.

### 9.1. `chantiersModule` — ajouter

Dans `src/server/chantiers/module.ts` :

```ts
// Imports
import { GetChantiersEnRetardQuery } from "./query/GetChantiersEnRetardQuery";
import { GetChantiersEnDifficulteQuery } from "./query/GetChantiersEnDifficulteQuery";
import { GetChantierIndicateursQuery } from "./query/GetChantierIndicateursQuery";
import { RecupererTauxAvancementTerritoireQuery } from "./query/RecupererTauxAvancementTerritoireQuery"; // NOUVEAU
import { RecupererStatistiquesAvancementTousChantiersPubliesQuery } from "./query/RecupererStatistiquesAvancementTousChantiersPubliesQuery"; // NOUVEAU

// Dans ChantierOwnCradle
getChantiersEnRetardQuery: GetChantiersEnRetardQuery;
getChantiersEnDifficulteQuery: GetChantiersEnDifficulteQuery;
getChantierIndicateursQuery: GetChantierIndicateursQuery;
recupererTauxAvancementTerritoireQuery: RecupererTauxAvancementTerritoireQuery;
recupererStatistiquesAvancementTousChantiersPubliesQuery: RecupererStatistiquesAvancementTousChantiersPubliesQuery;

// Dans exports
exports: [
  "recupererChantiersQuery",
  "mesuresIndicateurQuery",
  "getChantiersEnRetardQuery",              // pour albertModule
  "getChantiersEnDifficulteQuery",          // pour albertModule
  "getChantierIndicateursQuery",            // pour albertModule
],

// Dans register()
getChantiersEnRetardQuery: asModuleClass(GetChantiersEnRetardQuery),
getChantiersEnDifficulteQuery: asModuleClass(GetChantiersEnDifficulteQuery),
getChantierIndicateursQuery: asModuleClass(GetChantierIndicateursQuery),
recupererTauxAvancementTerritoireQuery: asModuleClass(RecupererTauxAvancementTerritoireQuery),
recupererStatistiquesAvancementTousChantiersPubliesQuery:
  asModuleClass(RecupererStatistiquesAvancementTousChantiersPubliesQuery),
```

### 9.2. `albertModule` — retirer

Dans `src/server/albert/module.ts` :

- Retirer les trois `asModuleClass(GetChantiers*Query)` / `asModuleClass(GetChantierIndicateursQuery)` du `register`.
- Retirer les trois entrées du `AlbertOwnCradle` (elles viendront désormais de `AlbertImports` via l'export du module `chantiers`).
- Ajouter `"chantiers"` aux `imports` du module (il n'y est peut-être pas encore).
- Les tools `createGetChantierIndicateursTool`, `createGetChantiersEnRetardTool`, `createGetChantiersEnDifficulteTool` continuent à recevoir ces queries depuis le cradle — tout ce qui change est le nom du module producteur.
- `createComposeDashboardTool` perd ses quatre dépendances métier et devient sans dépendance.

### 9.3. Conformité à la convention projet

La mémoire de travail du projet spécifie :

> « Use module exports for cross-module dependencies — export from source module, import in consumer module ; don't modify ports/repositories »

La migration ci-dessus respecte cette règle : `chantiersModule` expose les queries, `albertModule` les consomme via son canal `imports` — pas de modification de ports/repositories.

---

## 10. Tests

### 10.1. Ce qui disparaît

`src/server/albert/__tests__/tools/composeDashboard.unit.test.ts` (565 lignes) teste principalement la résolution de valeurs côté tool (`resolveKpiCard`, `resolveListeChantiersAlerte`, calculs de médiane, etc.). **Toute cette partie disparaît** — la résolution n'est plus une responsabilité du tool. Le fichier est soit supprimé, soit vidé des tests devenus sans objet.

### 10.2. Ce qui reste ou se réécrit

Nouveau `composeDashboard.unit.test.ts` (ou `.test.ts` tout court) qui teste uniquement :

1. **Validation Zod** — chaque widget valide avec des inputs minimaux ; chaque widget rejette les champs inconnus (`.strict()`) ; l'union rejette les `type` inconnus.
2. **Habilitations territoriales** — un `widget_*` avec un `territoire_code` absent de `habilitations.lecture.territoires` déclenche une erreur `Accès non autorisé au territoire ...`.
3. **Linter anti-chiffres** — `widget_titre_section` avec `titre: "TA 45%"` ou `description: "écart de 12 points"` déclenche l'erreur structurée.
4. **Retour identité** — un input valide est renvoyé à l'identique (`titre`, `containers`, `widgets`) + le champ `_output_instructions`.
5. **Aucun `throw` inattendu** pour tous les autres widgets valides (ex: widget cartographie avec `chantier_ids` non vide).

On reste sur du **unit test pur** : pas besoin de mocker prisma ni aucun use case, puisque le tool n'accède plus à rien.

### 10.3. Tests côté client

Pour chaque adaptateur complexe (listes, KPI, cartographie), un **test** minimal au `@testing-library/react` qui :

- mock `api.chantier.recupererXxx.useSuspenseQuery` via MSW ou mock manuel,
- vérifie que l'adaptateur passe bien les bonnes props au composant réutilisé,
- vérifie que l'ErrorBoundary capture une erreur de query et affiche `DashboardWidgetError`.

Ces tests ne sont **pas bloquants** pour shipper la V1 du POC, mais sont recommandés pour le widget `DashboardWidgetValeursRemarquablesAvancement` parce que c'est le seul qui introduit une logique de formatage spécifique (mapping des `minimum/mediane/maximum` du use case vers les strings attendues par `ValeursRemarquables`).

---

## 11. Liste exhaustive des fichiers touchés

### 11.1. Créations

- `src/server/chantiers/query/RecupererTauxAvancementTerritoireQuery.ts` — nouvelle query, encapsule `agregerAvancementsChantiersUseCase` pour un territoire unique.
- `src/server/chantiers/query/RecupererStatistiquesAvancementTousChantiersPubliesQuery.ts` — nouvelle query, wrappe `récupérerStatistiquesAvancementChantiersUseCase` en auto-résolvant les chantiers publiés.
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetRegistry.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetTauxAvancementTerritoire.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetMedianeAvancementTerritoire.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetNombreChantiersEnRetard.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetValeursRemarquablesAvancement.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetTableauIndicateursChantier.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetListeChantiersEnRetard.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetListeChantiersEnDifficulte.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetCartographieTauxAvancement.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetCartographieMeteo.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetTitreSection.tsx`
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardChantiersListe.tsx` — composant visuel partagé pour les deux listes, extrait de l'ancien `ListeChantiersAlerteWidget`.
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardWidgetError.tsx` — fallback d'ErrorBoundary.
- `src/client/components/_commons/ChatUI/DashboardWidgets/DashboardLoader.tsx` — fallback Suspense + loader streaming.
- `src/client/components/_commons/ChatUI/DashboardWidgets/index.ts` — point d'entrée / barrel.

### 11.2. Modifications majeures

- `src/server/albert/tools/composeDashboard.ts`
  - Passe d'environ 577 lignes à ~200 lignes.
  - Plus de fonction `resolveKpiCard`, `resolveListeChantiersAlerte`, `determineMaille`, `formatPourcentage`.
  - Plus d'imports `PrismaPilote`, `GetChantiers*Query`, `GetChantierIndicateursQuery`, `getContainer`, `Maille`, `MailleNonAutoriséeErreur`.
  - Nouveau schéma Zod aux 10 widgets.
  - `execute` trivial.
  - Nouveau `ComposeDashboardOutput` sans `ResolvedWidget`.

- `src/server/albert/tools/composeDashboardLayout.ts`
  - Nouveau `WidgetType` à 10 valeurs.
  - `DEFAULT_WIDTHS` mis à jour.
  - **Suppression** de `ROW_GROUPS` et du type `RowGroup`.

- `src/server/albert/systemPrompt.ts`
  - Section Pattern (g) (lignes 221-281) réécrite en bloc avec le nouveau catalogue 10 widgets, le flux 2 tours, et la disparition des row_groups / filler / enum de métrique.

- `src/server/albert/module.ts`
  - `AlbertOwnCradle` : retrait de `getChantiersEnRetardQuery`, `getChantiersEnDifficulteQuery`, `getChantierIndicateursQuery` (ils viennent maintenant des imports).
  - `register()` : retrait des trois `asModuleClass(GetChantiers*Query)` et `asModuleClass(GetChantierIndicateursQuery)`.
  - `imports` : ajouter `"chantiers"` si absent (sinon vérifier que les trois queries sont bien listées dans les exports de `chantiersModule` — cf. §9.1).
  - `createComposeDashboardTool` : signature sans dépendance dans la factory — rester en `asModuleFunction` pour ne pas perturber le wiring.

- `src/server/chantiers/module.ts`
  - Ajouter les trois queries existantes au cradle et aux exports (cf. §9.1).
  - Ajouter les deux nouvelles queries (`RecupererTauxAvancementTerritoireQuery`, `RecupererStatistiquesAvancementTousChantiersPubliesQuery`).

- `src/server/infrastructure/api/trpc/routes/chantier.ts`
  - Ajouter les 4 (ou 5, avec le helper « tous chantiers publiés ») nouveaux endpoints décrits en §5.2.

- `src/client/components/_commons/ChatUI/DashboardRender.tsx`
  - Refonte complète : plus de dispatch sur `.kind`, plus de composants internes par widget (`KpiCardWidget`, `TableauIndicateursWidget`, `ListeChantiersAlerteWidget`, `TexteSectionWidget`, `FillerWidget`, `ChantierAlerteLigne`, `METEO_LABELS`).
  - Délégation au `DashboardWidgetRegistry`.
  - Ajout d'un `Suspense` + `ErrorBoundary` par widget.
  - **Suppression** de `DashboardSkeleton`, `WidgetSkeleton`, `FALLBACK_CONTAINERS`, `SkeletonContainer`, `SkeletonWidget`, `extractSkeletonContainers`, `extractSkeletonTitre`.
  - Passe d'environ 412 lignes à ~80 lignes.

- `src/client/components/_commons/ChatUI/AssistantMessage.tsx`
  - Simplification du branch `tool-compose_dashboard` : remplacement de `<DashboardSkeleton input={part.input} />` par `<DashboardLoader />`.

- `src/server/albert/__tests__/tools/composeDashboard.unit.test.ts`
  - Réécriture complète (ou suppression + fichier neuf) selon §10.

### 11.3. Modifications mineures

- `src/server/albert/PiloteUIMessage.ts` — rien à changer structurellement, le type `ComposeDashboardOutput` se propage. Vérifier qu'aucun import mort ne subsiste.
- `src/app/api/albert/chat/route.ts` — l'appel `createComposeDashboardTool()` n'a plus de dépendances à passer depuis le container, mais la ligne actuelle `const createComposeDashboardTool = container.resolve("createComposeDashboardTool")` reste valide tant que la factory est enregistrée avec `asModuleFunction`. **Aucune modification** nécessaire côté route.

### 11.4. Fichiers non touchés

- Les widgets `_commons/Widget/*` (`WidgetCartographieTA`, `WidgetCartographieMeteo`, `ValeursRemarquables`, `ChantierIndicateursTable` de `_commons/ChatUI/`) — réutilisés tels quels via les adaptateurs.
- Les queries `GetChantiersEnRetardQuery`, `GetChantiersEnDifficulteQuery`, `GetChantierIndicateursQuery` — leur code ne change pas, seul leur lieu d'enregistrement DI.
- `getTauxAvancementTerritoire.ts`, `getChantiersEnRetard.ts`, `getChantiersEnDifficulte.ts`, `getChantierIndicateurs.ts` (autres tools Albert) — pas touchés : eux continuent à utiliser les queries par injection DI, et les queries migrent juste de module.

---

## 12. Ordre d'implémentation recommandé

Un ordre qui permet de valider chaque étape indépendamment sans casser la branche :

1. **Migration DI des queries chantier** (§9) — déplacer `GetChantiersEnRetardQuery`, `GetChantiersEnDifficulteQuery`, `GetChantierIndicateursQuery` de `albertModule` à `chantiersModule` + exports. À ce stade, les tests existants doivent passer à l'identique (les tools Albert continuent à les recevoir via le cradle).
2. **Nouveaux endpoints tRPC** (§5) — ajouter les 4-5 nouveaux endpoints sur `chantierRouter` en appelant les queries via DI. Les nouveaux endpoints peuvent être testés côté client de façon isolée (ex : via un petit `story` ou simplement via le devtools React Query) avant d'être branchés sur les adaptateurs.
3. **Nouvelle query `RecupererTauxAvancementTerritoireQuery`** et éventuellement `RecupererStatistiquesAvancementTousChantiersPubliesQuery` — écriture + test unitaire + enregistrement + exposition tRPC.
4. **Refonte du schéma tool `compose_dashboard`** (§4) — nouveau Zod aux 10 widgets, suppression de `ResolvedWidget`, `execute` trivial, suppression des imports morts. Tests unitaires du tool réécrits (§10).
5. **Adaptateurs React + registry** (§6) — un adaptateur à la fois, en commençant par le plus simple (`widget_titre_section`) puis les KPI atomiques, puis les listes, puis les cartographies, puis le tableau d'indicateurs. Chaque adaptateur s'intègre immédiatement dans le `DashboardWidgetRegistry`.
6. **Refonte de `DashboardRender`** (§6.6) — bascule sur le registry, suppression du `DashboardSkeleton`.
7. **System prompt** (§7) — nouvelle Pattern (g), nouveau catalogue. Exécuter quelques prompts sentinelles pour vérifier que le LLM ne mélange plus les métriques.
8. **Tests manuels end-to-end** avec quelques prompts représentatifs :
   - « Construis-moi un cockpit pour la Bretagne sur 2025 »
   - « Remplace la carte par un tableau des indicateurs de CH-014 »
   - « Passe en 2024 »
   - « Montre-moi les chantiers en difficulté d'Occitanie »

À la fin de l'étape 7 la V2 est fonctionnellement complète. Les étapes 1 à 4 sont uniquement serveur et ne dépendent pas des étapes 5 à 6 — elles peuvent être menées en parallèle.

---

## 13. Questions ouvertes

- **Helper « tous les chantiers publiés »** (§6.8) : endpoint tRPC dédié (`recupererStatistiquesAvancementTousChantiersPublies`) versus flag sur l'endpoint existant versus query côté adaptateur qui récupère d'abord les ids. **Recommandation** : endpoint dédié, mais à confirmer avec l'équipe au moment du démarrage de l'implémentation.
- **Habilitation refusée sur `territoire_code`** : throw (et rollback complet du dashboard avec retry LLM) ou tolérance par widget (ErrorBoundary uniquement) ? Le PRD §7.6 dit « rejeter au plus tôt » donc throw ; à confirmer que l'UX est acceptable (le retry consomme un step agent).
- **Plus d'un container côte à côte ?** La V2 conserve l'abstraction « containers empilés verticalement » du prototype (§12 du PRD : « moteur de layout en containers + grille 12 colonnes »), mais sans row_group. On garde donc la contrainte implicite : un container occupe la pleine largeur et contient ses widgets dans une sous-grille 12 colonnes. Si l'équipe préfère basculer sur une **seule grille plate** sans containers, la bascule reste simple : retirer le niveau `containers` du schéma Zod et de `DashboardRender`. **À trancher en début d'implémentation**.
- **Compatibilité avec `EvaluerChatUseCase`** : est-ce qu'il faut enrichir le harness d'évaluation pour scorer automatiquement la qualité d'une composition (PRD §11 « Évaluation continue ») ? Probablement hors scope V2, mais à garder en tête.

---

## 14. Ce que le tool renvoie — l'essentiel à retenir

**Avant** (prototype) :

```json
{
  "titre": "Cockpit Bretagne",
  "containers": [{
    "widgets": [{
      "kind": "kpi_card",
      "definition": { "type": "kpi_card", "metric": "ta_global", "territoire_code": "REG-53", "jalon": 2025 },
      "data": { "label": "Taux d'avancement", "value": "67%" }
    }]
  }],
  "_output_instructions": "..."
}
```

**Après** (V2) :

```json
{
  "titre": "Cockpit Bretagne",
  "containers": [{
    "widgets": [{
      "type": "widget_taux_avancement_territoire",
      "territoire_code": "REG-53",
      "jalon": 2025
    }]
  }],
  "_output_instructions": "..."
}
```

Le widget ne contient **aucune valeur**. Le `"67%"` vit maintenant uniquement dans la réponse de la query tRPC consommée par l'adaptateur React, qui se rafraîchit automatiquement à chaque ouverture du dashboard — exactement ce que le PRD §7.6 appelle un « dashboard vivant ».
