# Subagent Dashboard — Composition UI déléguée

**Statut** : exploration

---

## 1. Contexte

### 1.1 Problème actuel

Le system prompt d'Albert concentre aujourd'hui l'ensemble des responsabilités :
analyse métier, glossaire territorial, protocoles d'orchestration des tools,
**et** toutes les règles de composition de dashboard (12 types de widgets, grille
4 colonnes, contraintes de layout, exemples JSON).

Ce constat est documenté dans `SYSTEM_PROMPT.md` qui qualifie le prompt de
"solide mais surchargé" et recommande de le découper en couches :

> A (invariants), B (politique de dialogue), C (orchestration), D (rendu)

La couche D (rendu / dashboard) est la plus volumineuse et la plus autonome.
Elle n'a pas besoin du contexte conversationnel complet pour fonctionner :
elle reçoit une intention ("montre-moi l'avancement de la Bretagne") et produit
une structure JSON déclarative.

### 1.2 Opportunité

Le AI SDK (Vercel) propose depuis peu un pattern **subagent** (`ToolLoopAgent`) :
un agent spécialisé, invoqué comme un tool par l'agent principal, qui tourne dans
son propre contexte et retourne un résultat structuré.

cf. https://ai-sdk.dev/docs/agents/subagents

Ce pattern correspond exactement au cas de la composition dashboard :
- Tâche autonome et bien définie
- Résultat déclaratif (références, pas données)
- Instructions volumineuses et spécialisées
- Bénéfice direct à isoler du contexte principal

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
│  - PAS de règles dashboard                  │
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
               │ input: { task: "Dashboard avancement Bretagne" }
               ▼
┌─────────────────────────────────────────────┐
│  Subagent Dashboard                         │
│                                             │
│  System prompt dédié :                      │
│  - catalogue des 12 widgets                 │
│  - règles de grille (4 colonnes)            │
│  - patterns de composition                  │
│  - exemples few-shot                        │
│  - contraintes (pas de chiffres dans titres)│
│                                             │
│  Tools :                                    │
│  - compose_dashboard                        │
│  - get_taux_avancement_territoire           │
│  - get_chantiers_en_retard                  │
│  - get_chantiers_en_difficulte              │
│  - get_chantier_indicateurs                 │
│                                             │
│  Exécution autonome :                       │
│  1. Appelle les tools data si nécessaire    │
│  2. Compose le dashboard via compose_dashboard│
│  3. Retourne le JSON au parent              │
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

Le subagent utilise `generate` (pas `stream`). Le client ne voit pas les étapes
internes du subagent (appels data, composition). Il voit uniquement :

1. **Tool call démarre** (`state: input-available`) → placeholder "Composition du dashboard..."
2. **Tool call terminé** (`state: output-available`) → JSON dashboard → rendu

**Raison** : la latence additionnelle est acceptable car le client affiche déjà un
placeholder pendant les tool calls. Streamer les étapes internes ajouterait de la
complexité sans bénéfice UX perceptible.

---

## 4. Architecture technique

### 4.1 Subagent Dashboard

```typescript
// src/server/albert/subagents/dashboardSubagent.ts

import { ToolLoopAgent } from 'ai';

export type CreateDashboardSubagentDeps = {
  model: LanguageModel;
  composeDashboardTool: Tool;
  getTauxAvancementTerritoireTool: Tool;
  getChantiersEnRetardTool: Tool;
  getChantiersEnDifficulteTool: Tool;
  getChantierIndicateursTool: Tool;
};

export function createDashboardSubagent(deps: CreateDashboardSubagentDeps) {
  return new ToolLoopAgent({
    model: deps.model,
    instructions: buildDashboardSystemPrompt(),
    tools: {
      compose_dashboard: deps.composeDashboardTool,
      get_taux_avancement_territoire: deps.getTauxAvancementTerritoireTool,
      get_chantiers_en_retard: deps.getChantiersEnRetardTool,
      get_chantiers_en_difficulte: deps.getChantiersEnDifficulteTool,
      get_chantier_indicateurs: deps.getChantierIndicateursTool,
    },
  });
}
```

### 4.2 Tool `create_dashboard`

Exposé à l'agent principal, il encapsule l'appel au subagent :

```typescript
// src/server/albert/tools/createDashboard.ts

import { tool } from 'ai';
import { z } from 'zod';

export function createCreateDashboardTool(subagent: ToolLoopAgent) {
  return tool({
    description: `Délègue la composition d'un dashboard à un agent spécialisé.
Utilise ce tool quand l'utilisateur demande un dashboard, un cockpit,
ou un tableau de bord visuel.`,
    parameters: z.object({
      task: z.string().describe(
        "Description de ce que l'utilisateur veut visualiser, "
        + "incluant le(s) territoire(s), le jalon, et le type d'analyse souhaitée."
      ),
    }),
    execute: async ({ task }, { abortSignal }) => {
      const result = await subagent.generate({
        prompt: task,
        abortSignal,
      });
      return extractDashboardOutput(result);
    },
  });
}
```

### 4.3 Extraction du résultat

Le subagent produit potentiellement du texte + des tool calls. On extrait
l'output du tool `compose_dashboard` :

```typescript
function extractDashboardOutput(result: GenerateResult): DashboardOutput {
  // Chercher le dernier tool call compose_dashboard dans les steps
  const composeDashboardCall = result.steps
    .flatMap(step => step.toolCalls)
    .findLast(call => call.toolName === 'compose_dashboard');

  if (!composeDashboardCall) {
    return { error: 'Le subagent n\'a pas pu composer de dashboard.' };
  }

  return composeDashboardCall.result;
}
```

### 4.4 System prompt du subagent

Le prompt du subagent est **focalisé uniquement sur la composition dashboard**.
Il contient :

| Section | Contenu |
|---|---|
| Identité | "Tu es un spécialiste de la composition de dashboards PILOTE" |
| Catalogue widgets | Les 12 types avec description, paramètres, `default_width` |
| Règles de grille | 4 colonnes, containers empilés verticalement |
| Patterns de composition | Par type de demande (mono-territoire, comparaison, focus chantier) |
| Exemples few-shot | 2-3 dashboards complets en JSON |
| Contraintes | Pas de chiffres dans `widget_titre_section`, permissions territoire |
| Protocole | Appeler les tools data d'abord si besoin de contexte, puis `compose_dashboard` |

**Ce qui n'est PAS dans ce prompt** : glossaire métier détaillé, règles de synthèse,
protocole de dialogue, gestion d'erreurs conversationnelles. Le subagent n'interagit
pas avec l'utilisateur.

### 4.5 Injection des dépendances

Les tools data du subagent sont les **mêmes instances** que ceux de l'agent principal,
construits avec les mêmes habilitations et territoires accessibles :

```typescript
// Dans la route API /api/albert/chat

const tools = {
  get_taux_avancement_territoire: createGetTauxTool({ habilitations, ... }),
  get_chantiers_en_retard: createGetRetardTool({ habilitations, ... }),
  // ...
};

const dashboardSubagent = createDashboardSubagent({
  model,
  composeDashboardTool: tools.compose_dashboard,
  getTauxAvancementTerritoireTool: tools.get_taux_avancement_territoire,
  getChantiersEnRetardTool: tools.get_chantiers_en_retard,
  getChantiersEnDifficulteTool: tools.get_chantiers_en_difficulte,
  getChantierIndicateursTool: tools.get_chantier_indicateurs,
});

const createDashboardTool = createCreateDashboardTool(dashboardSubagent);

// L'agent principal reçoit create_dashboard au lieu de compose_dashboard
const mainTools = {
  ...tools,
  create_dashboard: createDashboardTool,
  // compose_dashboard n'est plus exposé au parent
};
```

---

## 5. Changements de prompts — Avant / Après

### 5.1 Où vivent les instructions dashboard aujourd'hui

Les instructions de composition dashboard sont réparties en **deux endroits** :

| Emplacement | Contenu | Volume |
|---|---|---|
| `systemPrompt.ts` | Références à `compose_dashboard` dans la règle pseudo-code (l.316) et le protocole d'outils | ~5 lignes |
| `composeDashboard.ts` (tool description) | Catalogue des 12 widgets, structure recommandée, règles JSON, 3 exemples complets | ~70 lignes |

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
ou un tableau de bord visuel. Décris précisément ce que l'utilisateur
veut visualiser : territoire(s), jalon, type d'analyse.
```

Un seul paramètre : `task: string`.

### 5.5 System prompt du subagent — Nouveau

Ce prompt concentre tout le savoir dashboard qui était auparavant dispersé :

```
Tu es un spécialiste de la composition de dashboards pour PILOTE,
l'outil de suivi des politiques prioritaires du gouvernement français.

# Ta mission

Tu reçois une description de ce que l'utilisateur veut visualiser.
Tu dois composer un dashboard structuré en appelant `compose_dashboard`.

Si tu as besoin de contexte pour décider quels widgets inclure
(ex: savoir quels chantiers sont en retard), appelle d'abord les outils
de données disponibles, puis compose le dashboard.

# Catalogue de widgets

| Widget | Intention | Paramètres | default_width | allowed_widths |
|---|---|---|---|---|
| widget_taux_avancement_territoire | TA agrégé d'un territoire | territoire_code, jalon | 1 | [1,2] |
| widget_mediane_avancement_territoire | Médiane du TA | territoire_code, jalon | 1 | [1,2] |
| widget_nombre_chantiers_en_retard | Nombre en retard | territoire_code, jalon | 1 | [1,2] |
| widget_nombre_chantiers_en_difficulte | Nombre en difficulté | territoire_code, jalon | 1 | [1,2] |
| widget_valeurs_remarquables_avancement | Min/médiane/max du TA | territoire_code, jalon | 2 | [2,3,4] |
| widget_tableau_indicateurs_chantier | VI/VA/VC/TA d'un chantier | chantier_id, territoire_code, jalon | 4 | [4] |
| widget_liste_chantiers_en_retard | Liste chantiers en retard | territoire_code, jalon | 2 | [2,4] |
| widget_liste_chantiers_en_difficulte | Liste chantiers en difficulté | territoire_code, jalon | 2 | [2,4] |
| widget_cartographie_taux_avancement | Carte du TA | maille, territoire_code, jalon, chantier_ids | 2 | [2,3,4] |
| widget_cartographie_meteo | Carte des météos | maille, territoire_code, chantier_id, jalon | 2 | [2,3,4] |
| widget_cartographie_propositions_valeur_avancement | Carte des PVA | maille, territoire_code, chantier_id, jalon | 2 | [2,3,4] |
| widget_titre_section | Titre + description (AUCUN chiffre) | titre, description? | 4 | [2,4] |

# Règles de composition

## Grille
- Un dashboard = liste ordonnée de containers empilés verticalement
- Chaque container a un grid interne de 4 colonnes
- Les widgets sont placés selon leur `width` (par défaut `default_width`)
- Un widget seul dans un container de 4 colonnes gâche de la place
  si sa default_width < 4. Regroupe les widgets compatibles.

## widget_titre_section
- JAMAIS de chiffres (%, points, pts) dans le titre ou la description
- Utilise un widget KPI atomique pour afficher un chiffre

## Patterns recommandés

### Cockpit synthétique (mono-territoire)
1. Container : `widget_titre_section`
2. Container : `widget_taux_avancement_territoire` (1) + `widget_nombre_chantiers_en_retard` (1) + `widget_valeurs_remarquables_avancement` (2) = 4 colonnes
3. Container : `widget_cartographie_taux_avancement` (4)
4. Container : `widget_liste_chantiers_en_retard` (2) + `widget_liste_chantiers_en_difficulte` (2)

### Ventilation par sous-territoires
Pour chaque sous-territoire, répéter :
1. Container : `widget_titre_section` avec nom du sous-territoire
2. Container : 3 KPI compacts (1+1+1=3, 4e colonne vide)

### Focus chantier
1. Container : `widget_titre_section` avec nom du chantier
2. Container : `widget_tableau_indicateurs_chantier` (4)
3. Container : cartographies thématiques (météo, TA, PVA)

# Exemples

[mêmes 3 exemples JSON que l'actuel compose_dashboard description]

# Protocole

1. Analyse la demande
2. Si tu as besoin de contexte (quels chantiers sont en retard, etc.),
   appelle les outils de données
3. Appelle `compose_dashboard` avec la structure complète
4. Ta réponse textuelle finale sera ignorée — seul le résultat
   de `compose_dashboard` est retourné au parent
```

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
                                                  │  ~80 lignes  │
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
| Subagent (uniquement si invoqué) | — | ~80 lignes |

Le subagent prompt (~80 lignes) n'est consommé que lorsque l'utilisateur demande
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

Le type `PiloteUITools` (consommé par le client) se simplifie :

```typescript
// Avant — le client doit savoir rendre chaque tool
export type PiloteUITools = {
  display_choices: { input: ...; output: ... };
  get_taux_avancement_territoire: { input: ...; output: ... };
  get_chantiers_en_retard: { input: ...; output: ... };
  get_chantiers_en_difficulte: { input: ...; output: ... };
  get_chantier_indicateurs: { input: ...; output: ... };   // ◄── rendu client
  compose_dashboard: { input: ...; output: ... };           // ◄── rendu client
  export_rapport: { input: ...; output: ... };
};

// Après — seuls les tools avec rendu visuel restent
export type PiloteUITools = {
  display_choices: { input: ...; output: ... };
  create_dashboard: { input: ...; output: CreateDashboardOutput };
  export_rapport: { input: ...; output: ... };
};
```

Les tools data (`get_taux_avancement_territoire`, `get_chantiers_en_retard`,
`get_chantiers_en_difficulte`, `get_chantier_indicateurs`) **disparaissent de
`PiloteUITools`** car le client n'a plus besoin de les rendre.

**Bénéfice** : le client n'a plus que 3 types de rendu à gérer (choices,
dashboard, export) au lieu de 7. Moins de composants, moins de cas à maintenir.

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
| Tool exposé au parent | `compose_dashboard` | `create_dashboard` (encapsule le subagent) |
| `detecteurIntention.ts` | `capacities.dashboard` active `compose_dashboard` | `capacities.dashboard` active `create_dashboard` |
| `get_chantier_indicateurs` | Paramètre `afficher`, rendu conditionnel client | Données pures, `afficher` supprimé |
| Client : nom du tool | Rend `compose_dashboard` + `get_chantier_indicateurs` | Rend `create_dashboard` uniquement |
| Client : structure output | `{ titre, containers }` | Identique : `{ titre, containers }` |

### 7.2 Ce qui ne change pas

- **Catalogue de widgets** : les 12 types restent identiques
- **`compose_dashboard` tool** : existe toujours, utilisé en interne par le subagent
- **Composants React de rendu du dashboard** : inchangés, reçoivent la même structure JSON
- **Tools data** : inchangés (sauf suppression de `afficher`), mêmes factories, mêmes habilitations
- **`_output_instructions`** : pattern conservé dans les tools data
- **Module DI** : les factories restent dans `albertModule`, on ajoute le subagent

### 7.3 Client

Le client se simplifie : seuls 3 tools ont un rendu visuel.

```typescript
// Avant — 7 tools à gérer côté client
switch (part.toolName) {
  case 'display_choices': ...
  case 'get_taux_avancement_territoire': ...
  case 'get_chantiers_en_retard': ...
  case 'get_chantiers_en_difficulte': ...
  case 'get_chantier_indicateurs': ...      // ◄── supprimé
  case 'compose_dashboard': ...              // ◄── remplacé
  case 'export_rapport': ...
}

// Après — 3 tools à gérer côté client
switch (part.toolName) {
  case 'display_choices': ...
  case 'create_dashboard': ...               // ◄── nouveau
  case 'export_rapport': ...
}
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

**Avant** :

```typescript
export type PiloteUITools = {
  display_choices: {
    input: z.input<typeof displayChoicesInputSchema>;
    output: { question: string; choices: DisplayChoice[] };
  };
  get_taux_avancement_territoire: {
    input: z.input<typeof getTauxAvancementTerritoireInputSchema>;
    output: GetTauxAvancementTerritoireOutput;
  };
  get_chantiers_en_retard: {
    input: z.input<typeof getChantiersEnRetardInputSchema>;
    output: GetChantiersEnRetardOutput;
  };
  get_chantiers_en_difficulte: {
    input: z.input<typeof getChantiersEnDifficulteInputSchema>;
    output: GetChantiersEnDifficulteOutput;
  };
  get_chantier_indicateurs: {
    input: z.input<typeof getChantierIndicateursInputSchema>;
    output: GetChantierIndicateursOutput;
  };
  compose_dashboard: {
    input: z.input<typeof composeDashboardInputSchema>;
    output: ComposeDashboardOutput;
  };
  export_rapport: {
    input: z.input<typeof exportRapportInputSchema>;
    output: ExportRapportOutput;
  };
};
```

**Après** :

```typescript
import { createDashboardInputSchema, type CreateDashboardOutput }
  from "@/server/albert/tools/createDashboard";

export type PiloteUITools = {
  display_choices: {
    input: z.input<typeof displayChoicesInputSchema>;
    output: { question: string; choices: DisplayChoice[] };
  };
  create_dashboard: {
    input: z.input<typeof createDashboardInputSchema>;
    output: CreateDashboardOutput;
  };
  export_rapport: {
    input: z.input<typeof exportRapportInputSchema>;
    output: ExportRapportOutput;
  };
};
```

Avec :

```typescript
// src/server/albert/tools/createDashboard.ts

export const createDashboardInputSchema = z.object({
  task: z.string(),
});

// L'output est le même que ComposeDashboardOutput — c'est le résultat
// extrait du tool call compose_dashboard interne au subagent
export type CreateDashboardOutput = ComposeDashboardOutput;
```

**Conséquence** : `PiloteUITools` passe de 7 entrées à 3. Le client est typé
de bout en bout — `part.output` pour `create_dashboard` est
`{ titre: string; containers: ContainerDefinition[]; _output_instructions: string }`.

**Type `input` visible dans le placeholder** : `{ task: string }` permet d'afficher
un message contextuel pendant le chargement, par exemple `part.input.task`.

---

## 8. Considérations

### 8.1 Latence

Le subagent ajoute un appel LLM supplémentaire. En pratique :

- L'agent principal fait déjà plusieurs tool calls avant de composer le dashboard
- Le subagent remplace la composition directe par le principal (pas d'appel en plus pour la composition elle-même)
- Le surcoût net est le temps de "réflexion" du subagent pour décider quels tools data appeler et comment composer

**Mitigation** : le placeholder côté client masque la latence perçue.

### 8.2 Tokens

Le subagent a son propre contexte. Le system prompt dashboard (~300 tokens estimés
avec exemples) est consommé à chaque invocation du subagent, indépendamment du
contexte principal.

**Avantage** : le contexte principal est allégé des ~100 lignes de règles dashboard
à chaque message, même quand l'utilisateur ne demande pas de dashboard.

### 8.3 `ToolLoopAgent` — disponibilité

`ToolLoopAgent` est une API récente du AI SDK. Si la version utilisée dans le projet
ne la supporte pas encore, le même pattern peut être implémenté manuellement :

```typescript
// Fallback sans ToolLoopAgent
async function runDashboardSubagent(prompt: string, tools: Tools, signal: AbortSignal) {
  const result = await generateText({
    model,
    system: buildDashboardSystemPrompt(),
    prompt,
    tools,
    maxSteps: 10,
    abortSignal: signal,
  });
  return extractDashboardOutput(result);
}
```

### 8.4 Erreurs

Si le subagent échoue (timeout, pas de `compose_dashboard` dans les steps),
le tool `create_dashboard` retourne une erreur structurée. L'agent principal
peut alors informer l'utilisateur ou retenter avec des instructions ajustées.

### 8.5 `needsApproval`

La doc AI SDK précise que les tools d'un subagent ne peuvent pas utiliser
`needsApproval`. Ce n'est pas un problème : aucun tool actuel ne l'utilise.

---

## 9. Evolutions futures

### 8.1 Subagent Export Rapport

Le même pattern peut s'appliquer à `export_rapport` : un subagent spécialisé
dans la rédaction et la mise en forme de rapports (markdown/PDF), avec son propre
prompt contenant des exemples de bons rapports et des règles de rédaction.

### 8.2 Enrichissement du prompt dashboard

Une fois le subagent en place, on peut enrichir son prompt sans impacter l'agent
principal :
- Plus d'exemples few-shot
- Patterns de layout par type de demande (comparaison, focus, vue d'ensemble)
- Règles de responsive / adaptation au nombre de territoires
- Instructions de mise en page avancées

### 8.3 Modèle dédié

Le subagent pourrait utiliser un modèle différent de l'agent principal : un modèle
plus petit et rapide suffirait pour la composition structurée, réduisant la latence
et le coût.

---

## 10. Critères d'acceptation

### Fonctionnel

- [ ] L'utilisateur peut demander un dashboard en langage naturel et obtenir le même résultat qu'aujourd'hui
- [ ] Le placeholder "Composition du dashboard..." s'affiche pendant l'exécution du subagent
- [ ] Le dashboard rendu est identique en structure et en widgets à l'implémentation actuelle
- [ ] Les permissions territoriales sont respectées par le subagent
- [ ] En cas d'erreur du subagent, l'agent principal informe l'utilisateur
- [ ] L'affichage des indicateurs d'un chantier passe par un dashboard (`widget_tableau_indicateurs_chantier`)

### Technique

- [ ] Le system prompt principal ne contient plus de règles de composition dashboard
- [ ] Le subagent a son propre system prompt focalisé
- [ ] Les tools data sont partagés (mêmes instances, mêmes habilitations)
- [ ] Le tool `create_dashboard` est conditionné par `capacities.dashboard`
- [ ] Le client rend le dashboard via le même composant, branché sur `create_dashboard`
- [ ] Le `compose_dashboard` tool n'est plus exposé à l'agent principal
- [ ] Le paramètre `afficher` de `get_chantier_indicateurs` est supprimé
- [ ] Les tools data ne déclenchent plus de rendu côté client
- [ ] `PiloteUITools` ne contient que les tools avec rendu visuel (`display_choices`, `create_dashboard`, `export_rapport`)

---

## 11. Questions ouvertes

- **Faut-il passer l'historique de conversation au subagent ?** Par défaut non (isolation).
  Mais si le contexte conversationnel est nécessaire (ex: "ajoute les indicateurs du
  chantier dont on parlait"), on pourrait injecter un résumé dans le prompt du subagent.
- **Quel `maxSteps` pour le subagent ?** Le subagent fait au maximum ~5 tool calls
  (4 data + 1 compose). Un `maxSteps: 10` semble suffisant.
- **Faut-il un fallback vers la composition directe ?** Si le subagent échoue
  systématiquement, on pourrait revenir au mode actuel (compose_dashboard exposé
  au parent). A évaluer après les premiers tests.
