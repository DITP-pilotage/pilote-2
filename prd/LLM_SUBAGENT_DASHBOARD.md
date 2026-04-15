# Subagent Dashboard — Composition UI déléguée

**Statut** : implémenté

---

## 1. Contexte

### 1.1 Problème actuel

Le system prompt d'Albert concentrait l'ensemble des responsabilités :
analyse métier, glossaire territorial, protocoles d'orchestration des tools,
**et** toutes les règles de composition de dashboard (13 types de widgets, grille
4 colonnes, contraintes de layout, exemples JSON).

Ce constat est documenté dans `SYSTEM_PROMPT.md` qui qualifie le prompt de
"solide mais surchargé" et recommande de le découper en couches :

> A (invariants), B (politique de dialogue), C (orchestration), D (rendu)

La couche D (rendu / dashboard) est la plus volumineuse et la plus autonome.
Elle n'a pas besoin du contexte conversationnel complet pour fonctionner :
elle reçoit une intention ("montre-moi l'avancement de la Bretagne") et produit
une structure JSON déclarative.

### 1.2 Opportunité

Le AI SDK (Vercel) propose un pattern **structured output** via `Output.object()` :
un appel `generateText` qui retourne directement un objet JSON validé par un schéma Zod,
sans tool loop.

Ce pattern correspond exactement au cas de la composition dashboard :
- Tâche autonome et bien définie
- Résultat déclaratif (références, pas données)
- Instructions volumineuses et spécialisées
- Bénéfice direct à isoler du contexte principal
- Un seul appel LLM suffit (pas besoin d'outils internes)

---

## 2. Objectifs

- **Alléger le system prompt principal** en extrayant toutes les instructions de
  composition dashboard vers un prompt dédié
- **Améliorer la qualité des dashboards** en donnant au subagent un prompt focalisé,
  enrichi d'exemples et de patterns de layout
- **Préserver l'UX existante** : du point de vue utilisateur, le comportement ne change
  pas (placeholder → dashboard rendu)
- **Simplifier l'évolutivité** : ajouter un widget ou modifier une règle de layout
  ne touche que le subagent, pas l'agent principal

---

## 3. Principe

### 3.1 Vue d'ensemble

```
Utilisateur : "Montre-moi un dashboard pour la Bretagne"
      │
      ▼
┌─────────────────────────────────────────────┐
│  Agent Principal (Albert)                   │
│                                             │
│  System prompt allégé :                     │
│  - identité, glossaire, règles métier       │
│  - protocole synthèse                       │
│  - PAS de règles dashboard détaillées       │
│                                             │
│  Tools :                                    │
│  - get_taux_avancement_territoire           │
│  - get_chantiers_en_retard                  │
│  - get_chantiers_en_difficulte              │
│  - get_chantier_indicateurs                 │
│  - display_choices                          │
│  - export_rapport                           │
│  - create_dashboard  ◄── NOUVEAU            │
│                                             │
└──────────────┬──────────────────────────────┘
               │ appel tool create_dashboard
               │ input: { task, territoire_codes,
               │          jalons, chantiers? }
               ▼
┌─────────────────────────────────────────────┐
│  Subagent Dashboard (1 appel LLM)           │
│                                             │
│  System prompt dédié :                      │
│  - catalogue des 13 widgets                 │
│  - règles de grille (4 colonnes)            │
│  - patterns de composition                  │
│  - exemples few-shot                        │
│  - contraintes (pas de chiffres dans titres)│
│                                             │
│  Pas de tools — structured output :         │
│  Output.object({ schema:                    │
│    composeDashboardInputSchema })           │
│                                             │
│  Reçoit un prompt avec bloc <context>       │
│  contenant territoire_codes, jalons,        │
│  chantiers (id, nom, statut, meteo,         │
│  commentaire)                               │
│                                             │
│  Post-validation :                          │
│  validateDashboardIdentifiers()             │
└──────────────┬──────────────────────────────┘
               │ output: { titre, containers, ... }
               ▼
┌─────────────────────────────────────────────┐
│  Client                                     │
│                                             │
│  1. Voit tool call "create_dashboard"       │
│     state: input-available                  │
│     → affiche placeholder                   │
│                                             │
│  2. Tool call terminé                       │
│     state: output-available                 │
│     → render le dashboard (même composants) │
└─────────────────────────────────────────────┘
```

### 3.2 Pas de streaming intermédiaire

Le subagent utilise `generateText` (pas `streamText`). Le client ne voit pas
l'exécution interne du subagent. Il voit uniquement :

1. **Tool call démarre** (`state: input-available`) → placeholder "Composition du dashboard..."
2. **Tool call terminé** (`state: output-available`) → JSON dashboard → rendu

**Raison** : la latence additionnelle est acceptable car le client affiche déjà un
placeholder pendant les tool calls. Streamer les étapes internes ajouterait de la
complexité sans bénéfice UX perceptible.

---

## 4. Architecture technique

### 4.1 Approche retenue : Structured Output (pas ToolLoopAgent)

L'exploration initiale envisageait `ToolLoopAgent` (un subagent avec ses propres tools
data). En pratique, un **seul appel LLM** avec `Output.object()` suffit : l'agent
principal collecte d'abord les données (chantiers en retard, météo, etc.) puis les
passe au subagent dans un bloc `<context>` du prompt. Le subagent n'a besoin d'aucun
outil — il compose le JSON directement.

```typescript
// src/server/albert/tools/createDashboard.ts

const result = await generateText({
  model: withOptionalDevTools(albertProvider.chat("openweight-large")),
  system: buildDashboardSystemPrompt(),
  prompt: buildSubagentPrompt(task, territoire_codes, jalons, chantiers),
  stopWhen: stepCountIs(5),
  output: Output.object({ schema: composeDashboardInputSchema }),
  abortSignal,
});
```

### 4.2 Tool `create_dashboard`

Exposé à l'agent principal, il encapsule l'appel au subagent :

```typescript
// src/server/albert/tools/createDashboard.ts

export const createDashboardInputSchema = z.object({
  task: z.string().describe("Description de ce que l'utilisateur veut visualiser."),
  territoire_codes: z.array(z.string()).min(1).describe("Codes des territoires concernés."),
  jalons: z.array(z.number().int()).min(1).describe("Années des jalons."),
  chantiers: z.array(chantierContextSchema).optional().describe(
    "Chantiers ciblés avec nom, statut, meteo, commentaire."
  ),
});
```

L'agent principal résout les identifiants (territoires, jalons, chantiers) et les
passe au subagent. Le subagent ne fait que composer le layout à partir de ces données.

### 4.3 Bloc `<context>` et prompt du subagent

Le prompt du subagent est construit par `buildSubagentPrompt()` qui injecte un bloc
`<context>` contenant les identifiants résolus :

```typescript
function buildSubagentPrompt(
  task: string,
  territoireCodes: string[],
  jalons: number[],
  chantiers: ChantierContext[] | undefined,
): string {
  const contextLines = [
    "<context>",
    `territoire_codes: ${JSON.stringify(territoireCodes)}`,
    `jalons: ${JSON.stringify(jalons)}`,
    ...(chantiers?.length ? [`chantiers: ${JSON.stringify(chantiers)}`] : []),
    "</context>",
  ];
  return `${task}\n\n${contextLines.join("\n")}`;
}
```

### 4.4 System prompt du subagent

Le prompt du subagent (`src/server/albert/subagents/dashboardSystemPrompt.ts`) est
**focalisé uniquement sur la composition dashboard**. Il contient :

| Section | Contenu |
|---|---|
| Identité | "Tu es un spécialiste de la composition de dashboards PILOTE" |
| Bloc `<context>` | Explication du format (territoire_codes, jalons, chantiers) |
| Catalogue widgets | Les 13 types avec description, paramètres, `default_width` |
| Règles de grille | 4 colonnes, containers empilés verticalement |
| `widget_titre_section` | Jamais de chiffres, format du titre chantier |
| `widget_paragraph` | Contenu string[], règle anti-newlines, météo + commentaire, variant warning |
| Patterns de composition | Cockpit mono-territoire, ventilation sous-territoires, focus chantier, indicateurs |
| Exemples few-shot | 2 dashboards complets en JSON |
| Protocole | Utiliser exclusivement les identifiants du `<context>` |

**Ce qui n'est PAS dans ce prompt** : glossaire métier détaillé, règles de synthèse,
protocole de dialogue, gestion d'erreurs conversationnelles. Le subagent n'interagit
pas avec l'utilisateur et n'a pas accès à des outils.

### 4.5 Validation post-génération

Après que le subagent a produit le JSON dashboard, `validateDashboardIdentifiers()`
vérifie que tous les identifiants utilisés dans les widgets sont bien dans le périmètre
autorisé :

```typescript
export function validateDashboardIdentifiers(
  output: ComposeDashboardInput,
  allowedTerritoires: string[],
  allowedJalons: number[],
  allowedChantiers: ChantierContext[] | undefined,
): void
```

Cette validation parcourt tous les widgets et vérifie :
- `territoire_code` ∈ `allowedTerritoires`
- `jalon` ∈ `allowedJalons`
- `chantier_id` et `chantier_ids` ∈ `allowedChantiers` (et que `allowedChantiers` est défini)

En cas de violation, une erreur est levée et le subagent échoue proprement.

### 4.6 Câblage dans la route API

Le subagent ne nécessite pas d'injection de dépendances — il crée son propre provider
et n'a pas de tools :

```typescript
// src/app/api/albert/chat/route.ts

const createDashboard = createCreateDashboardTool();

const tools = {
  get_taux_avancement_territoire: getTauxAvancementTerritoire,
  get_chantiers_en_retard: getChantiersEnRetard,
  get_chantiers_en_difficulte: getChantiersEnDifficulte,
  get_chantier_indicateurs: getChantierIndicateurs,
  display_choices: displayChoicesTool,
  ...(capacities.dashboard ? { create_dashboard: createDashboard } : {}),
  ...(capacities.exportRapport ? { export_rapport: exportRapport } : {}),
};
```

---

## 5. Changements de prompts — Avant / Après

### 5.1 Où vivent les instructions dashboard aujourd'hui

Les instructions de composition dashboard sont réparties en **deux endroits** :

| Emplacement | Contenu | Volume |
|---|---|---|
| `systemPrompt.ts` | Références à `compose_dashboard` dans la règle pseudo-code (l.316) et le protocole d'outils | ~5 lignes |
| `composeDashboard.ts` (tool description) | Catalogue des 13 widgets, structure recommandée, règles JSON, 3 exemples complets | ~70 lignes |

Le gros du savoir dashboard est dans la **description du tool**, pas dans le system prompt.
Mais cette description est injectée dans le contexte du LLM principal à chaque message
(dès que `capacities.dashboard = true`), même si l'utilisateur ne demande pas de dashboard
dans ce tour.

### 5.2 System prompt principal — Avant / Après

**AVANT** (extrait des sections impactées) :

```
# Protocole d'utilisation des outils

## Règle générale

⚠️ **RÈGLE CRITIQUE — Jamais d'appel d'outil en pseudo-code**
[...] N'écris JAMAIS de syntaxe comme `display_choices({...})`,
`compose_dashboard({...})`, `export_rapport({...})` [...]
                             ^^^^^^^^^^^^^^^^^^^
                             référence directe

## display_choices
[...]
```

**APRÈS** :

```
# Protocole d'utilisation des outils

## Règle générale

⚠️ **RÈGLE CRITIQUE — Jamais d'appel d'outil en pseudo-code**
[...] N'écris JAMAIS de syntaxe comme `display_choices({...})`,
`create_dashboard({...})`, `export_rapport({...})` [...]
                            ^^^^^^^^^^^^^^^^^^^
                            renommé

## create_dashboard
Quand l'utilisateur demande un dashboard, un cockpit ou un tableau de bord,
appelle `create_dashboard` en décrivant ce que l'utilisateur veut visualiser.
L'agent spécialisé se charge de la composition. Ne commente pas les chiffres
du dashboard dans ta réponse textuelle (les valeurs sont résolues côté client).

## display_choices
[...]
```

**Delta** : on remplace `compose_dashboard` par `create_dashboard` dans la règle pseudo-code,
et on ajoute 4 lignes d'instruction pour `create_dashboard` (au lieu des ~70 lignes
actuellement dans la description du tool `compose_dashboard`).

### 5.3 Tool `compose_dashboard` — Avant / Après

**AVANT** — description = ~70 lignes injectées dans le contexte LLM :

```
Compose un tableau de bord dynamique à partir d'une liste de containers...

## Concept de container
[...]

## Catalogue de widgets (12 intentions métier nominales)
| Widget | Intention | Paramètres | default_width | allowed_widths |
[... 12 lignes ...]

## Structure recommandée d'un cockpit territoire
[... 6 lignes ...]

## Règles JSON strictes
[... 7 lignes ...]

## Exemples de dashboards valides
### Exemple 1 — Cockpit synthétique d'un territoire
[... JSON ~5 lignes compactes ...]
### Exemple 2 — Ventilation par sous-territoires
[... JSON ~5 lignes compactes ...]
### Exemple 3 — Focus chantier sur un territoire
[... JSON ~5 lignes compactes ...]
```

**APRÈS** — la description du tool `compose_dashboard` est **simplifiée**.
Le tool existe toujours (utilisé par le subagent), mais sa description n'a plus
besoin de porter tout le contexte pédagogique — c'est le system prompt du subagent
qui s'en charge :

```
Compose un tableau de bord dynamique à partir d'une liste de containers de widgets.
Uniquement des références (territoire_code, chantier_id, jalon, maille),
jamais de valeurs chiffrées. Les valeurs sont résolues au rendu côté client.
```

Le schema Zod reste identique — c'est lui qui porte la validation structurelle.
Les `.describe()` sur chaque champ du schema restent aussi (ils documentent
les paramètres pour le LLM).

### 5.4 Nouveau tool `create_dashboard` — description

Ce tool est vu par l'**agent principal**. Sa description est courte :

```
Délègue la composition d'un dashboard à un agent spécialisé.
Utilise ce tool quand l'utilisateur demande un dashboard, un cockpit,
un tableau de bord visuel, ou d'afficher les indicateurs d'un chantier.
Fournis la description de ce que l'utilisateur veut visualiser ainsi que
les identifiants résolus (territoire_codes, jalons, chantiers).
```

Paramètres :
- `task: string` — description de ce que l'utilisateur veut visualiser
- `territoire_codes: string[]` — codes des territoires concernés (obligatoire)
- `jalons: number[]` — années des jalons (obligatoire)
- `chantiers?: ChantierContext[]` — chantiers ciblés avec `{id, nom, statut?, meteo?, commentaire?}`

### 5.5 System prompt du subagent — Nouveau

Ce prompt (`src/server/albert/subagents/dashboardSystemPrompt.ts`) concentre tout
le savoir dashboard qui était auparavant dispersé. Le subagent n'a **pas de tools** —
il reçoit un prompt avec un bloc `<context>` et produit directement la structure JSON
via structured output.

Sections clés du prompt :
- **Bloc `<context>`** : format des données (territoire_codes, jalons, chantiers avec id/nom/statut/meteo/commentaire)
- **Règle anti-hallucination** : utiliser exclusivement les identifiants du `<context>`
- **Catalogue de 13 widgets** (12 originaux + `widget_paragraph`)
- **`widget_paragraph`** : contenu string[], règle anti-newlines, météo + commentaire d'un chantier, variant warning pour incohérences
- **Patterns de composition** : cockpit, ventilation, focus chantier, indicateurs
- **Exemples few-shot** : 2 dashboards JSON complets

### 5.6 Résumé du transfert

```
                      AVANT                              APRÈS
                ┌──────────────┐                  ┌──────────────┐
                │  System      │                  │  System      │
                │  prompt      │                  │  prompt      │
                │  principal   │                  │  principal   │
                │              │                  │              │
                │  ~5 lignes   │    ─────────►    │  ~4 lignes   │
                │  dashboard   │    simplifié     │  create_     │
                │              │                  │  dashboard   │
                └──────────────┘                  └──────────────┘

                ┌──────────────┐                  ┌──────────────┐
                │  compose_    │                  │  compose_    │
                │  dashboard   │                  │  dashboard   │
                │  tool desc   │                  │  tool desc   │
                │              │                  │              │
                │  ~70 lignes  │    ─────────►    │  ~3 lignes   │
                │  catalogue   │    transféré     │  (schéma     │
                │  exemples    │                  │   suffit)    │
                │  patterns    │                  │              │
                └──────────────┘                  └──────────────┘

                                                  ┌──────────────┐
                                                  │  Subagent    │
                                     NOUVEAU      │  system      │
                                   ◄─────────     │  prompt      │
                                                  │              │
                                                  │  ~137 lignes │
                                                  │  catalogue   │
                                                  │  patterns    │
                                                  │  exemples    │
                                                  │  protocole   │
                                                  └──────────────┘
```

**Bilan tokens par message (quand dashboard activé)** :

| | Avant | Après |
|---|---|---|
| System prompt principal | ~375 lignes | ~310 lignes (-65) |
| Tool desc `compose_dashboard` | ~70 lignes | ~3 lignes (-67) |
| Tool desc `create_dashboard` | — | ~4 lignes (+4) |
| **Total injecté par message** | **~445 lignes** | **~317 lignes (-128)** |
| Subagent (uniquement si invoqué) | — | ~137 lignes |

Le subagent prompt (~137 lignes) n'est consommé que lorsque l'utilisateur demande
effectivement un dashboard — pas à chaque message de la conversation.

---

## 6. Principe — tout affichage visuel passe par le dashboard

### 6.1 Décision

Aujourd'hui, certains tools data ont un double rôle : fournir de la donnée **et**
déclencher un rendu visuel côté client. C'est le cas de `get_chantier_indicateurs`
avec son paramètre `afficher` :

- `afficher=true` (défaut) → le client rend un tableau d'indicateurs sous le tool call
- `afficher=false` → données récupérées silencieusement (pour export rapport)

**Nouveau principe** : les tools data sont des **fournisseurs de données pures**.
Tout affichage visuel à destination de l'utilisateur passe par `create_dashboard`.

Cela signifie :
- Le paramètre `afficher` de `get_chantier_indicateurs` **disparaît**
- Pour afficher les indicateurs d'un chantier, l'agent principal appelle
  `create_dashboard` qui utilisera un `widget_tableau_indicateurs_chantier`
- Les tools data ne déclenchent plus de rendu côté client — leur output
  n'est visible que par le LLM (texte) ou par le subagent (composition)

### 6.2 Avant / Après

**Avant** — l'utilisateur demande "montre-moi les indicateurs de CH-064 en Bretagne" :

```
Agent principal
  │
  ├── appelle get_chantier_indicateurs(CH-064, REG-53, 2025, afficher=true)
  │   └── output rendu comme tableau côté client  ◄── rendu direct
  │
  └── texte: "Voici les indicateurs du chantier CH-064."
```

**Après** — même demande :

```
Agent principal
  │
  ├── appelle create_dashboard({ task: "Indicateurs CH-064 en Bretagne" })
  │   │
  │   └── Subagent Dashboard
  │       ├── (optionnel) appelle get_chantier_indicateurs pour contexte
  │       └── appelle compose_dashboard({
  │             titre: "Indicateurs CH-064 – Bretagne",
  │             containers: [{
  │               widgets: [{ type: "widget_tableau_indicateurs_chantier",
  │                           chantier_id: "CH-064",
  │                           territoire_code: "REG-53",
  │                           jalon: 2025 }]
  │             }]
  │           })
  │
  └── texte: "Voici les indicateurs du chantier CH-064."
```

### 6.3 Impact sur les tools data

| Tool | Avant | Après |
|---|---|---|
| `get_chantier_indicateurs` | Paramètre `afficher` (true/false), rendu conditionnel côté client | Suppression de `afficher`, données pures uniquement, pas de rendu client |
| `get_taux_avancement_territoire` | Données pures | Inchangé |
| `get_chantiers_en_retard` | Données pures | Inchangé |
| `get_chantiers_en_difficulte` | Données pures | Inchangé |

### 6.4 Impact sur `PiloteUITools`

Le type `PiloteUITools` conserve les 7 entrées (les tools data restent déclarés
car le client affiche un `ToolCallIndicator` pour chaque appel de données) :

```typescript
export type PiloteUITools = {
  display_choices: { input: ...; output: ... };
  get_taux_avancement_territoire: { input: ...; output: ... };
  get_chantiers_en_retard: { input: ...; output: ... };
  get_chantiers_en_difficulte: { input: ...; output: ... };
  get_chantier_indicateurs: { input: ...; output: ... };
  create_dashboard: { input: ...; output: CreateDashboardOutput };  // ◄── remplace compose_dashboard
  export_rapport: { input: ...; output: ... };
};
```

Le changement principal : `compose_dashboard` est remplacé par `create_dashboard`.
Les tools data ne déclenchent plus de rendu riche (tableau, carte) mais affichent
un indicateur compact (nom de l'outil + état).

### 6.5 Impact sur le system prompt

Le system prompt principal doit orienter l'agent vers `create_dashboard` pour
tout affichage visuel :

```
## create_dashboard
Quand l'utilisateur demande de visualiser des données (dashboard, indicateurs,
cartographie, comparaison visuelle), appelle `create_dashboard`.
C'est le seul canal d'affichage visuel. Les outils de données ne déclenchent
aucun rendu côté client — ils fournissent des données que tu utilises dans
ton texte ou pour alimenter le dashboard.
```

Le workflow "rapport complet" (§c du protocole actuel) évolue aussi :
- Avant : `get_chantier_indicateurs(afficher=false)` + `export_rapport`
- Après : `get_chantier_indicateurs` (plus de `afficher`) + `export_rapport`

---

## 7. Impact sur le code existant

### 7.1 Ce qui change

| Composant | Avant | Après |
|---|---|---|
| System prompt principal | Contient les règles dashboard (~100 lignes) | Allégé, mentionne juste "utilise `create_dashboard`" |
| Tool exposé au parent | `compose_dashboard` | `create_dashboard` (structured output via subagent) |
| `detecteurIntention.ts` | `capacities.dashboard` active `compose_dashboard` | `capacities.dashboard` active `create_dashboard`, mots-clés "indicateur"/"indicateurs" ajoutés |
| `get_chantier_indicateurs` | Paramètre `afficher`, rendu conditionnel client | Données pures, `afficher` supprimé |
| Client : nom du tool | Rend `compose_dashboard` + `get_chantier_indicateurs` | Rend `create_dashboard` uniquement |
| Client : structure output | `{ titre, containers }` | Identique : `{ titre, containers }` |
| Nouveau widget | — | `widget_paragraph` (contenu string[], variant warning) |

### 7.2 Ce qui ne change pas

- **Catalogue de widgets** : les 12 types originaux restent identiques, `widget_paragraph` ajouté (13 total)
- **`compose_dashboard` tool** : existe toujours, son schéma Zod sert de contrat pour le structured output
- **Composants React de rendu du dashboard** : inchangés, reçoivent la même structure JSON
- **Tools data** : inchangés (sauf suppression de `afficher`), mêmes factories, mêmes habilitations
- **`_output_instructions`** : pattern conservé dans les tools data
- **Module DI** : les factories restent dans `albertModule`, on ajoute le subagent

### 7.3 Client

Le client se simplifie côté rendu riche : les tools data n'affichent plus qu'un
`ToolCallIndicator` (icône + état) au lieu d'un rendu complet.

```typescript
// Avant — rendu riche pour get_chantier_indicateurs et compose_dashboard
case 'get_chantier_indicateurs': // tableau d'indicateurs  ◄── supprimé
case 'compose_dashboard': // dashboard complet              ◄── remplacé

// Après — seul create_dashboard a un rendu dashboard
case 'create_dashboard': // dashboard complet               ◄── nouveau
// get_chantier_indicateurs → simple ToolCallIndicator
```

Le placeholder affiché pendant le chargement du dashboard peut exploiter
`part.input.task` pour donner du contexte :

```
"Composition du dashboard : avancement de la Bretagne..."
```

### 7.4 Type safety — `PiloteUIMessage`

Le fichier `PiloteUIMessage.ts` définit le type `PiloteUITools` qui mappe chaque
tool name vers ses types `input`/`output`. C'est ce type qui assure la type safety
côté client quand on consomme les `ToolCallPart`.

**Changement** : `compose_dashboard` est remplacé par `create_dashboard` dans `PiloteUITools`.
Les tools data restent dans le type (pour les `ToolCallIndicator`).

```typescript
// Remplacement dans PiloteUITools
- compose_dashboard: { input: composeDashboardInputSchema; output: ComposeDashboardOutput }
+ create_dashboard: { input: createDashboardInputSchema; output: CreateDashboardOutput }
```

Avec :

```typescript
// src/server/albert/tools/createDashboard.ts

export const createDashboardInputSchema = z.object({
  task: z.string(),
  territoire_codes: z.array(z.string()).min(1),
  jalons: z.array(z.number().int()).min(1),
  chantiers: z.array(chantierContextSchema).optional(),
});

// L'output est le même que ComposeDashboardOutput
export type CreateDashboardOutput = ComposeDashboardOutput;
```

**Type `input` visible dans le placeholder** : `{ task, territoire_codes, jalons, chantiers? }`
permet d'afficher un message contextuel pendant le chargement, par exemple `part.input.task`.

---

## 8. Considérations

### 8.1 Latence

Le subagent ajoute un appel LLM supplémentaire (un seul `generateText`). En pratique :

- L'agent principal fait déjà plusieurs tool calls avant de composer le dashboard
- Le subagent remplace la composition directe par le principal (pas d'appel en plus pour la composition elle-même)
- Le surcoût net est le temps du structured output (1 appel LLM sans tools)

**Mitigation** : le placeholder côté client masque la latence perçue.

### 8.2 Tokens

Le subagent a son propre contexte. Le system prompt dashboard (~300 tokens estimés
avec exemples) est consommé à chaque invocation du subagent, indépendamment du
contexte principal.

**Avantage** : le contexte principal est allégé des ~100 lignes de règles dashboard
à chaque message, même quand l'utilisateur ne demande pas de dashboard.

### 8.3 Choix de `Output.object()` plutôt que `ToolLoopAgent`

L'exploration initiale envisageait `ToolLoopAgent` (subagent avec ses propres tools data).
En pratique, `Output.object()` (structured output) a été retenu :

- Le subagent n'a pas besoin de tools — l'agent principal collecte les données en amont
- Un seul appel LLM suffit, pas de boucle d'outils
- Le schéma Zod (`composeDashboardInputSchema`) valide directement le JSON retourné
- `stepCountIs(5)` sert de garde-fou (retries internes du structured output)

### 8.4 Erreurs

Si le subagent échoue (timeout, structured output non parsable après retries),
le tool `create_dashboard` lève une erreur. L'agent principal peut alors informer
l'utilisateur. La validation post-génération (`validateDashboardIdentifiers`) peut
aussi rejeter un dashboard contenant des identifiants hallucinés.

---

## 9. Evolutions futures

### 9.1 Subagent Export Rapport

Le même pattern peut s'appliquer à `export_rapport` : un subagent spécialisé
dans la rédaction et la mise en forme de rapports (markdown/PDF), avec son propre
prompt contenant des exemples de bons rapports et des règles de rédaction.

### 9.2 Enrichissement du prompt dashboard

Une fois le subagent en place, on peut enrichir son prompt sans impacter l'agent
principal :
- Plus d'exemples few-shot
- Patterns de layout par type de demande (comparaison, focus, vue d'ensemble)
- Règles de responsive / adaptation au nombre de territoires
- Instructions de mise en page avancées

### 9.3 Modèle dédié

Le subagent pourrait utiliser un modèle différent de l'agent principal : un modèle
plus petit et rapide suffirait pour la composition structurée, réduisant la latence
et le coût.

---

## 10. Critères d'acceptation

### Fonctionnel

- [x] L'utilisateur peut demander un dashboard en langage naturel et obtenir le même résultat qu'aujourd'hui
- [x] Le placeholder "Composition du dashboard..." s'affiche pendant l'exécution du subagent
- [x] Le dashboard rendu est identique en structure et en widgets à l'implémentation actuelle
- [x] Les permissions territoriales sont respectées par le subagent (validation post-génération)
- [x] En cas d'erreur du subagent, l'agent principal informe l'utilisateur
- [x] L'affichage des indicateurs d'un chantier passe par un dashboard (`widget_tableau_indicateurs_chantier`)
- [x] Météo + commentaire de synthèse affichés sous chaque chantier via `widget_paragraph`
- [x] Incohérence météo/statut signalée via variant `warning` sur `widget_paragraph`

### Technique

- [x] Le system prompt principal ne contient plus de règles de composition dashboard
- [x] Le subagent a son propre system prompt focalisé (`dashboardSystemPrompt.ts`)
- [x] Le subagent utilise `Output.object()` (structured output) — pas de tools internes
- [x] Le tool `create_dashboard` est conditionné par `capacities.dashboard`
- [x] Le client rend le dashboard via le même composant, branché sur `create_dashboard`
- [x] Le `compose_dashboard` tool n'est plus exposé à l'agent principal
- [x] Le paramètre `afficher` de `get_chantier_indicateurs` est supprimé
- [x] Les tools data ne déclenchent plus de rendu riche côté client (simple `ToolCallIndicator`)
- [x] `validateDashboardIdentifiers` vérifie les identifiants post-génération
- [x] `widget_paragraph` ajouté au catalogue (contenu string[], variant warning)

---

## 11. Questions ouvertes

- **Faut-il passer l'historique de conversation au subagent ?** Par défaut non (isolation).
  Mais si le contexte conversationnel est nécessaire (ex: "ajoute les indicateurs du
  chantier dont on parlait"), on pourrait injecter un résumé dans le prompt du subagent.
- **Faut-il un fallback vers la composition directe ?** Si le subagent échoue
  systématiquement, on pourrait revenir au mode actuel (compose_dashboard exposé
  au parent). À évaluer après les premiers tests en conditions réelles.
