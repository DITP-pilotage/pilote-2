# Évaluation d'Albert en quatre niveaux — plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUISE — utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour dérouler ce plan tâche par tâche. Les étapes utilisent la syntaxe checkbox (`- [ ]`).

**Goal:** remplacer les trois evals du POC par une suite structurée en quatre niveaux, qui documente le comportement attendu d'Albert et permet de mesurer l'effet d'une modification de prompt.

**Architecture:** chaque fichier `.eval.ts` est autonome et se lit de haut en bas — ses cas, sa `task`, ses scorers. La `task` est **inline** : elle ouvre la transaction, sème, appelle l'assistant et rend sa sortie. Rien n'enveloppe la `task`. Ce qui est partagé, ce sont des briques appelées depuis la `task` : le monde de base, les fixtures, le scorer, le juge.

**Tech Stack:** TypeScript, Evalite 1.0.0-beta.16, Vitest, Prisma, `ai` v7, API Albert (Etalab).

**Spec:** `apps/pilote-ppg/docs/superpowers/specs/2026-09-10-albert-strategie-evaluation-design.md`

## Contraintes globales

- Toutes les commandes se lancent depuis `apps/pilote-ppg`.
- Les evals se lancent **uniquement** via `pnpm eval` / `pnpm eval:dev`, qui forcent `DOTENV_CONFIG_PATH=.env.test`. Un lancement direct d'`evalite` est bloqué par le garde-fou d'`evals/env.ts`.
- Prérequis : `docker compose up -d postgres_test`, et `apps/pilote-ppg/.env.evals.local` contenant `ALBERT_API_KEY` recopiée depuis `.env`.
- Identifiants, types et noms de fichiers **en anglais**. Commentaires et contenu des cas en français.
- Pas d'export par défaut. Helpers à paramètres nommés.
- **Pas d'enveloppe autour de la `task`** : pas de `jouerScenario`, pas de `defineToolEval`, pas de `withEvalWorld`. La transaction, le seed et l'appel assistant sont écrits dans la `task` de chaque fichier.
- Ne jamais construire de tools ni de prompt système dans `evals/` : ce câblage vit dans `AssistantIA`.
- `evalite.config.ts` n'est pas modifié. `cache: false`, `fileParallelism: false`, `maxConcurrency: 1`, `testTimeout: 420_000` sont acquis et nécessaires.

## Trois pièges relevés en construisant un cas réel

Ils sont déjà intégrés au code de ce plan ; ne pas les « simplifier ».

1. **`est_applicable` est `Boolean?` sans défaut.** `GetChantiersQuery.buildWhere` filtre sur `est_applicable: true` ; une fixture qui ne le pose pas laisse `NULL`, la ligne est écartée, `get_chantiers` renvoie vide et l'agent conclut « aucun chantier ». Le scorer d'outil reste vert : c'est un vert qui ment. Toute fixture `chantierTerritoire` doit poser `est_applicable: true`.
2. **`en_retard` n'existe pas au national.** `get_chantiers(NAT-FR, en_retard)` renvoie `non_applicable` — l'écart à la médiane suppose des territoires comparables. Les cas `en_retard` / `en_difficulte` se posent sur une région.
3. **`toolCallAccuracy` compare les arguments par `deepEqual` sur l'objet entier.** Une attente partielle (`{ view: "en_retard" }`) ne matche jamais l'appel réel, qui porte aussi `territoire_code`, `jalon`, `include_sous_territoires` : elle plafonne à 0,5 à vie. D'où le scorer maison en tâche 3.

## Cycle de travail (remplace le TDD)

Une suite d'eval n'a pas de rouge/vert : l'implémentation est le comportement du modèle. Chaque tâche qui écrit des cas suit donc :

1. Écrire les cas.
2. Lancer la suite.
3. **Consigner le score observé** en en-tête du fichier, avec la date.
4. Commiter.

Un cas qui sort bas est un **constat**, pas un échec de la tâche. Ne jamais affaiblir un cas pour remonter un score.

Les tâches 1 à 3 écrivent du code non-LLM et suivent le cycle habituel : test, échec, implémentation, passage, commit.

---

### Tâche 1 : Arborescence, juge, et nettoyage du POC

**Fichiers :**
- Créer : `evals/1-keywords/.gitkeep`, `evals/2-tools/.gitkeep`, `evals/3-scenarios/.gitkeep`, `evals/4-edge-cases/.gitkeep`
- Renommer : `evals/jugeAlbert.ts` → `evals/judge.ts`
- Déplacer : `evals/calibrationJuge.eval.ts` → `evals/3-scenarios/judgeCalibration.eval.ts`
- Supprimer : `evals/toolCalls.eval.ts`, `evals/qualiteReponse.eval.ts`, `evals/detecteurIntention.eval.ts`, `evals/agentTurn.ts`, `evals/_demo.eval.ts`
- Modifier : `package.json`

**Interfaces :**
- Consomme : rien.
- Produit : `evals/judge.ts` exportant `JUDGE_MODEL: string` et `createJudgeScorer<TInput extends { question: string }>({ name, criterion })`, dont la sortie attendue est `{ text: string }`.

`evals/agentTurn.ts` disparaît : son `runAgentTurn` est une enveloppe autour de la `task`. Ses types migrent en tâche 3.

- [ ] **Étape 1 : Créer les dossiers**

```bash
mkdir -p evals/1-keywords evals/2-tools evals/3-scenarios evals/4-edge-cases
touch evals/1-keywords/.gitkeep evals/2-tools/.gitkeep evals/3-scenarios/.gitkeep evals/4-edge-cases/.gitkeep
```

- [ ] **Étape 2 : Renommer le juge et angliciser son interface**

```bash
git mv evals/jugeAlbert.ts evals/judge.ts
```

Dans `evals/judge.ts` : `MODELE_JUGE` → `JUDGE_MODEL`, `creerScorerJuge` → `createJudgeScorer`, paramètres `{ nom, critere }` → `{ name, criterion }`, contrainte de sortie `{ texte: string }` → `{ text: string }`. Le corps de `demanderVerdict` et le schéma Zod ne changent pas.

```ts
export const JUDGE_MODEL = "deepseek-v4-flash";

export function createJudgeScorer<TInput extends { question: string }>({
  name,
  criterion,
}: {
  name: string;
  criterion: string;
}) {
  return createScorer<TInput, { text: string }, unknown>({
    name,
    description: `Juge LLM (${JUDGE_MODEL}) — ${criterion}`,
    scorer: async ({ input, output }) => {
      const verdict = await demanderVerdict({
        critere: criterion,
        question: input.question,
        reponse: output.text,
      });

      // Le tableau du terminal n'affiche que le score, pas les metadata. Sans
      // ce log, impossible de calibrer le juge en ligne de commande.
      // eslint-disable-next-line no-console
      console.error(`    [juge:${name}] ${verdict.note} — ${verdict.justification}`);

      return { score: verdict.note, metadata: verdict.justification };
    },
  });
}
```

- [ ] **Étape 3 : Déplacer la calibration du juge**

```bash
git mv evals/calibrationJuge.eval.ts evals/3-scenarios/judgeCalibration.eval.ts
```

Dans le fichier déplacé : `import { createJudgeScorer, JUDGE_MODEL } from "../judge";`, type `CasCalibration` → `CalibrationCase`, champ `attendu` → `expected`, et la tâche produit `{ text: string }` au lieu de `{ texte: string }`. Les cas eux-mêmes ne changent pas.

- [ ] **Étape 4 : Supprimer le POC**

```bash
git rm evals/toolCalls.eval.ts evals/qualiteReponse.eval.ts evals/detecteurIntention.eval.ts evals/agentTurn.ts
rm -f evals/_demo.eval.ts
```

- [ ] **Étape 5 : Corriger `eval:rapide`**

Dans `package.json`, il pointe sur un fichier supprimé :

```json
"eval:rapide": "DOTENV_CONFIG_PATH=.env.test evalite run evals/1-keywords"
```

- [ ] **Étape 6 : Vérifier**

```bash
pnpm exec tsc --noEmit
```

Attendu : `EXIT=0`. `evals/world.ts` référence encore `agentTurn` ? Non — vérifier, et corriger si `tsc` le signale.

- [ ] **Étape 7 : Commit**

```bash
git add -A evals package.json
git commit -m "refactor(ppg): arborescence des evals en quatre niveaux"
```

---

### Tâche 2 : Monde de base et fixtures

Le monde de base perd `withEvalWorld` (enveloppe) et gagne ce qui manquait : `est_applicable`, et une région peuplable.

**Fichiers :**
- Modifier : `evals/world.ts`
- Créer : `evals/seeds.ts`

**Interfaces :**
- Consomme : `fixtures` de `@/server/infrastructure/test/fixtures`, `getPrisma` de `@/server/db/PrismaTransaction`.
- Produit, depuis `evals/world.ts` :
  - `type EvalWorld = { userId: string; habilitations: Habilitations; chantiers: { id: string; nom: string }[] }`
  - `seedEvalWorld(): Promise<EvalWorld>`
  - `NATIONAL_TERRITORY = "NAT-FR"`, `BRETAGNE = { territoire_code: "REG-53", code_insee: "53", maille: "REG", zone_id: "R53" }`
  - `EVAL_TIMEOUT_MS = 400_000`
- Produit, depuis `evals/seeds.ts` :
  - `seedChantierEnRetard({ chantierId, territoire }): Promise<void>`
  - `seedChantierEnDifficulte({ chantierId, territoire }): Promise<void>`
  - `seedChantierAvecTaux({ chantierId, territoire, taux }): Promise<void>`
  - `type Rattachement = { territoire_code: string; code_insee: string; maille: "NAT" | "REG" | "DEPT"; zone_id: string }`

- [ ] **Étape 1 : Retirer `withEvalWorld` et ajouter les constantes**

Dans `evals/world.ts` : supprimer `withEvalWorld` et `TIMEOUT_TRANSACTION_MS`. Renommer `TERRITOIRE_NATIONAL` en `NATIONAL_TERRITORY` et l'exporter. Ajouter :

```ts
/**
 * Rattachement régional réel, relevé sur la base de dev. Les cas qui portent
 * sur `en_retard` ou `en_difficulte` doivent viser une région : au national,
 * `get_chantiers` renvoie `non_applicable`, l'écart à la médiane supposant
 * des territoires comparables.
 */
export const BRETAGNE = {
  territoire_code: "REG-53",
  code_insee: "53",
  maille: "REG" as const,
  zone_id: "R53",
};

/**
 * Durée de vie de la transaction d'un cas. Un tour d'agent attend le réseau
 * pendant qu'elle est ouverte ; les cas qui passent par `search_chantiers`,
 * lui-même un sous-agent LLM, dépassent 180 s. Reste sous le `testTimeout`
 * d'Evalite, pour que ce soit le runner qui arbitre en dernier ressort.
 */
export const EVAL_TIMEOUT_MS = 400_000;
```

- [ ] **Étape 2 : Corriger le seed du monde de base**

Dans `seedChantierDetaille` de `evals/world.ts`, ajouter `est_applicable: true` à l'appel `fixtures.chantierTerritoire` :

```ts
  await fixtures.chantierTerritoire({
    id: chantierId,
    territoire_code: NATIONAL_TERRITORY,
    code_insee: "FR",
    maille: "NAT",
    zone_id: "FRANCE",
    est_applicable: true,
  });
```

Sans ce champ, `GetChantiersQuery.buildWhere` écarte la ligne — `est_applicable` est `Boolean?` sans défaut, donc `NULL`, et le filtre est `est_applicable: true`.

- [ ] **Étape 3 : Écrire `evals/seeds.ts`**

```ts
import { fixtures } from "@/server/infrastructure/test/fixtures";

/**
 * Briques de données réutilisables, appelées depuis la `task` d'un cas.
 *
 * Les seuils viennent de `GetChantiersQuery` : en retard si l'écart à la
 * médiane est <= -10 ; en difficulté si le chantier n'est pas en retard et que
 * sa météo est ORAGE ou NUAGE. Les valeurs sont franchement de part et d'autre
 * du seuil — un cas d'eval ne doit pas basculer sur un arrondi.
 */

export type Rattachement = {
  territoire_code: string;
  code_insee: string;
  maille: "NAT" | "REG" | "DEPT";
  zone_id: string;
};

const ECART_EN_RETARD = -15;
const ECART_A_L_HEURE = 2;
const JALON_COURANT = 2025;

async function seedRattachement({
  chantierId,
  territoire,
  meteo,
  ecart,
  taux,
}: {
  chantierId: string;
  territoire: Rattachement;
  meteo: string;
  ecart: number;
  taux: number;
}) {
  // `est_applicable` n'a pas de valeur par défaut en base et le `where` de
  // GetChantiersQuery filtre dessus : sans ce champ, le chantier n'existe pas
  // pour l'outil, sans qu'aucune erreur ne le signale.
  await fixtures.chantierTerritoire({
    id: chantierId,
    ...territoire,
    meteo,
    est_applicable: true,
  });

  await fixtures.chantierTerritoireJalon({
    id: chantierId,
    ...territoire,
    jalon: JALON_COURANT,
    ecart,
    taux_avancement: taux,
  });
}

export async function seedChantierEnRetard({
  chantierId,
  territoire,
}: {
  chantierId: string;
  territoire: Rattachement;
}) {
  await seedRattachement({
    chantierId,
    territoire,
    meteo: "SOLEIL",
    ecart: ECART_EN_RETARD,
    taux: 34,
  });
}

export async function seedChantierEnDifficulte({
  chantierId,
  territoire,
}: {
  chantierId: string;
  territoire: Rattachement;
}) {
  await seedRattachement({
    chantierId,
    territoire,
    meteo: "ORAGE",
    ecart: ECART_A_L_HEURE,
    taux: 58,
  });
}

export async function seedChantierAvecTaux({
  chantierId,
  territoire,
  taux,
}: {
  chantierId: string;
  territoire: Rattachement;
  taux: number;
}) {
  await seedRattachement({
    chantierId,
    territoire,
    meteo: "SOLEIL",
    ecart: ECART_A_L_HEURE,
    taux,
  });
}
```

- [ ] **Étape 4 : Vérifier**

```bash
pnpm exec tsc --noEmit
```

Attendu : `EXIT=0`.

- [ ] **Étape 5 : Commit**

```bash
git add evals/world.ts evals/seeds.ts
git commit -m "feat(ppg): monde d'eval corrige et fixtures reutilisables"
```

---

### Tâche 3 : Types et scorer partagés

Deux briques pures, appelées depuis les `task` et les `scorers`. Aucune ne prend de callback ni n'enveloppe quoi que ce soit.

**Fichiers :**
- Créer : `evals/types.ts`, `evals/scoreExpectedTools.ts`, `evals/scoreExpectedTools.unit.test.ts`
- Modifier : `vitest.projects/vitest.config.server-unit.ts`

**Interfaces :**
- Produit, depuis `evals/types.ts` :
  - `type ObservedToolCall = { toolName: string; input?: unknown }`
  - `type AgentTurn = { toolCalls: ObservedToolCall[]; text: string; stepCount: number }`
  - `type ToolCase = { question: string; reason: string; expected: ObservedToolCall[] }`
- Produit, depuis `evals/scoreExpectedTools.ts` :
  - `scoreExpectedTools({ output, expected }: { output: AgentTurn; expected: ObservedToolCall[] | undefined }): { score: number; metadata: string }`

- [ ] **Étape 1 : Écrire les types**

Créer `evals/types.ts` :

```ts
/**
 * Ce qu'une `task` d'eval rend aux scorers.
 *
 * Les scorers tournent APRÈS la `task`, donc après le rollback : ils ne voient
 * plus la base. Tout ce qu'on veut scorer doit donc figurer ici.
 */

export type ObservedToolCall = { toolName: string; input?: unknown };

export type AgentTurn = {
  toolCalls: ObservedToolCall[];
  text: string;
  stepCount: number;
};

/** Forme commune aux cas des niveaux 2 et 4, scorés sur les tool calls. */
export type ToolCase = {
  question: string;
  /** Ce que le cas cherche à vérifier. Affiché en colonne. */
  reason: string;
  expected: ObservedToolCall[];
};
```

- [ ] **Étape 2 : Écrire le test du scorer, qui échoue**

Créer `evals/scoreExpectedTools.unit.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { scoreExpectedTools } from "./scoreExpectedTools";
import type { AgentTurn } from "./types";

const tour = (toolCalls: AgentTurn["toolCalls"]): AgentTurn => ({
  toolCalls,
  text: "",
  stepCount: toolCalls.length,
});

describe("scoreExpectedTools", () => {
  it("note 1 quand aucun outil n'est attendu et qu'aucun n'est appelé", () => {
    const resultat = scoreExpectedTools({ output: tour([]), expected: [] });

    expect(resultat.score).toBe(1);
  });

  it("note 0 quand aucun outil n'est attendu mais qu'un outil est appelé", () => {
    const resultat = scoreExpectedTools({
      output: tour([{ toolName: "get_chantiers" }]),
      expected: [],
    });

    expect(resultat.score).toBe(0);
  });

  it("matche les arguments en sous-ensemble : les arguments en trop sont libres", () => {
    const resultat = scoreExpectedTools({
      output: tour([
        {
          toolName: "get_chantiers",
          input: {
            view: "en_retard",
            territoire_code: "REG-53",
            jalon: 2025,
          },
        },
      ]),
      expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
    });

    expect(resultat.score).toBe(1);
  });

  it("note 0 quand un argument attendu diffère", () => {
    const resultat = scoreExpectedTools({
      output: tour([
        { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      ]),
      expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
    });

    expect(resultat.score).toBe(0);
  });

  it("note la proportion d'appels attendus retrouvés", () => {
    const resultat = scoreExpectedTools({
      output: tour([
        { toolName: "get_chantiers", input: { view: "en_retard" } },
      ]),
      expected: [
        { toolName: "get_chantiers", input: { view: "en_retard" } },
        { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      ],
    });

    expect(resultat.score).toBe(0.5);
  });
});
```

- [ ] **Étape 3 : Ouvrir le projet `server-unit` aux tests d'`evals/`**

Dans `vitest.projects/vitest.config.server-unit.ts`, ajouter le glob des evals à `include`, à côté de celui de `src` :

```ts
    include: ["src/server/**/*.unit.test.{ts,tsx}", "evals/**/*.unit.test.ts"],
```

Reprendre le motif exact déjà présent pour `src` et n'ajouter que la seconde entrée. Le test vit à côté du code qu'il teste plutôt que sous `src/` avec un chemin relatif à quatre niveaux.

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il échoue**

```bash
pnpm exec vitest run --project server-unit evals/scoreExpectedTools.unit.test.ts
```

Attendu : ÉCHEC, `Cannot find module './scoreExpectedTools'`.

- [ ] **Étape 5 : Écrire le scorer**

Créer `evals/scoreExpectedTools.ts` :

```ts
import type { AgentTurn, ObservedToolCall } from "./types";

/**
 * Scorer de sélection d'outils.
 *
 * Écrit à la main plutôt qu'en réutilisant `toolCallAccuracy` d'Evalite :
 * celui-ci compare les arguments par `deepEqual` sur l'objet ENTIER. Une
 * attente partielle comme `{ view: "en_retard" }` ne matcherait jamais l'appel
 * réel, qui porte aussi `territoire_code`, `jalon` et
 * `include_sous_territoires` — elle plafonnerait à 0,5 à vie, ce qui se lirait
 * comme une régression alors que c'est l'attente qui est mal écrite.
 *
 * Ici, un appel correspond s'il porte AU MOINS les arguments attendus.
 */
export function scoreExpectedTools({
  output,
  expected,
}: {
  output: AgentTurn;
  expected: ObservedToolCall[] | undefined;
}) {
  const attendus = expected ?? [];

  if (attendus.length === 0) {
    const appeles = output.toolCalls.map((call) => call.toolName);

    return {
      score: appeles.length === 0 ? 1 : 0,
      metadata:
        appeles.length === 0
          ? "aucun outil appelé, conforme"
          : `outils appelés à tort : ${appeles.join(", ")}`,
    };
  }

  const manquants = attendus.filter(
    (attendu) => !output.toolCalls.some((appel) => correspond(appel, attendu)),
  );

  return {
    score: (attendus.length - manquants.length) / attendus.length,
    metadata:
      manquants.length === 0
        ? "tous les appels attendus sont présents"
        : `manquants : ${manquants.map(decrire).join(", ")}`,
  };
}

function correspond(appel: ObservedToolCall, attendu: ObservedToolCall) {
  if (appel.toolName !== attendu.toolName) return false;
  if (attendu.input === undefined) return true;

  const reel = (appel.input ?? {}) as Record<string, unknown>;

  return Object.entries(attendu.input as Record<string, unknown>).every(
    ([cle, valeur]) => reel[cle] === valeur,
  );
}

function decrire(call: ObservedToolCall) {
  return call.input === undefined
    ? call.toolName
    : `${call.toolName}(${JSON.stringify(call.input)})`;
}
```

- [ ] **Étape 6 : Lancer le test pour vérifier qu'il passe**

```bash
pnpm exec vitest run --project server-unit evals/scoreExpectedTools.unit.test.ts
```

Attendu : `Tests 5 passed (5)`.

- [ ] **Étape 7 : Commit**

```bash
git add evals/types.ts evals/scoreExpectedTools.ts evals/scoreExpectedTools.unit.test.ts vitest.projects/vitest.config.server-unit.ts
git commit -m "feat(ppg): scorer de selection d'outils en sous-ensemble"
```

---

### Tâche 4 : Niveau 1 — détection par mots-clés

Aucun appel réseau, aucune base : la suite tourne en quelques millisecondes.

**Fichiers :**
- Créer : `evals/1-keywords/capacities.eval.ts`
- Supprimer : `evals/1-keywords/.gitkeep`

**Interfaces :**
- Consomme : `detecterCapacities`, `type Capacities` de `@/server/albert/detecteurIntention`.

- [ ] **Étape 1 : Écrire la suite**

```ts
import { createScorer, evalite } from "evalite";
import {
  type Capacities,
  detecterCapacities,
} from "@/server/albert/detecteurIntention";

/**
 * Niveau 1 — détection d'intention par mots-clés.
 *
 * `detecterCapacities` conditionne l'exposition de `create_dashboard` et
 * `export_rapport` : une capacity non détectée retire l'outil du ToolSet, donc
 * l'agent ne PEUT pas l'appeler. Un faux négatif ici plafonne le niveau 2.
 *
 * Aucun LLM, aucune base. L'intérêt de le passer en eval plutôt qu'en test
 * unitaire est le score partiel : les quatre capacities sont notées séparément,
 * donc une régression qui n'en casse qu'une se lit comme 0,75 et non comme un
 * échec opaque.
 *
 * Référence observée : à compléter au premier run.
 */

type KeywordCase = {
  message: string;
  reason: string;
};

const CASES: { input: KeywordCase; expected: Capacities }[] = [
  {
    input: {
      message: "Fais-moi une synthèse de l'avancement du chantier CH-004",
      reason: "synthèse explicite, rien d'autre",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Affiche un tableau de bord des indicateurs de la Bretagne",
      reason: "dashboard explicite",
    },
    expected: {
      synthese: false,
      dashboard: true,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Exporte-moi un rapport Markdown sur la Bretagne",
      reason: "export explicite",
    },
    expected: {
      synthese: false,
      dashboard: false,
      exportRapport: true,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Fais la synthèse de la Bretagne et ses departements",
      reason: "synthèse + sous-territoires",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: true,
    },
  },
  {
    input: {
      message: "Quel est le taux d'avancement de la Bretagne ?",
      reason: "question factuelle : aucune capacity ne doit s'activer",
    },
    expected: {
      synthese: false,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
  {
    input: {
      message: "Donne-moi une vue d'ensemble de la situation",
      reason:
        "PIÈGE : « vue d'ensemble » est une synthèse, mais « vue » est aussi un mot-clé dashboard",
    },
    expected: {
      synthese: true,
      dashboard: false,
      exportRapport: false,
      inclureSousTerritoires: false,
    },
  },
];

const capacityScorer = createScorer<KeywordCase, Capacities, Capacities>({
  name: "Capacities",
  description: "Une note par capacity, moyenne sur les quatre.",
  scorer: ({ output, expected }) => {
    const cles = Object.keys(output) as (keyof Capacities)[];
    const fausses = cles.filter((cle) => output[cle] !== expected?.[cle]);

    return {
      score: (cles.length - fausses.length) / cles.length,
      metadata:
        fausses.length === 0
          ? "les quatre capacities sont correctes"
          : `incorrectes : ${fausses.join(", ")}`,
    };
  },
});

const listerActives = (capacities: Capacities | undefined) =>
  Object.entries(capacities ?? {})
    .filter(([, actif]) => actif)
    .map(([nom]) => nom)
    .join(", ") || "—";

evalite<KeywordCase, Capacities, Capacities>("Détection par mots-clés", {
  data: () => CASES,
  task: (input) => Promise.resolve(detecterCapacities(input.message)),
  scorers: [capacityScorer],
  columns: ({ input, output, expected }) => [
    { label: "Motif", value: input.reason },
    { label: "Détecté", value: listerActives(output) },
    { label: "Attendu", value: listerActives(expected) },
  ],
});
```

- [ ] **Étape 2 : Lancer**

```bash
rm evals/1-keywords/.gitkeep
pnpm eval:rapide
```

Attendu : moins d'une seconde, un score affiché.

- [ ] **Étape 3 : Consigner la référence observée**

Remplacer `Référence observée : à compléter au premier run.` par la mesure réelle, par exemple :

```
 * Référence observée le 2026-09-10 : 97 % (le cas « vue d'ensemble » sort à 75 %).
```

- [ ] **Étape 4 : Commit**

```bash
git add evals/1-keywords
git commit -m "feat(ppg): niveau 1 des evals, detection par mots-cles"
```

---

### Tâche 5 : Niveau 2 — le premier fichier, et la forme de référence

`get_chantiers` en premier : c'est le fichier que les onze suivants recopient. Sa `task` est le patron.

**Fichiers :**
- Créer : `evals/2-tools/getChantiers.eval.ts`

**Interfaces :**
- Consomme : `seedEvalWorld`, `BRETAGNE`, `EVAL_TIMEOUT_MS` de `evals/world.ts` ; `seedChantierEnRetard`, `seedChantierEnDifficulte` de `evals/seeds.ts` ; `scoreExpectedTools` de `evals/scoreExpectedTools.ts` ; `type AgentTurn`, `type ObservedToolCall` de `evals/types.ts` ; `AssistantIA`, `createIntegrationTest`.
- Produit : la forme de `task` que les tâches 6 à 8 et 11 à 12 recopient à l'identique.

- [ ] **Étape 1 : Écrire la suite**

```ts
import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { BRETAGNE, EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import { seedChantierEnDifficulte, seedChantierEnRetard } from "../seeds";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 2 — `get_chantiers`.
 *
 * Les `view` attendues viennent de la table « Comprendre les demandes
 * utilisateur » du prompt système : « en retard » → en_retard seul, « qui ont
 * besoin d'aide » → en_difficulte seul, « où ça coince » → les deux.
 *
 * Les cas visent la BRETAGNE et non le national : `get_chantiers(NAT-FR,
 * en_retard)` renvoie `non_applicable`, l'écart à la médiane supposant des
 * territoires comparables.
 *
 * Référence observée : à compléter au premier run.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason: "« en retard » → view en_retard uniquement",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
  {
    question: "Quels chantiers ont besoin d'un appui en Bretagne ?",
    reason: "« qui ont besoin d'aide » → view en_difficulte uniquement",
    expected: [{ toolName: "get_chantiers", input: { view: "en_difficulte" } }],
  },
  {
    question: "En Bretagne, où ça coince ?",
    reason: "« où ça coince » → les DEUX views, contrat explicite du prompt",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason: "CAS NÉGATIF : taux global, pas de liste de chantiers",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("get_chantiers", {
  data: () => CASES.map((cas) => ({ input: cas, expected: cas.expected })),

  task: async (input) => {
    let sortie: AgentTurn | undefined;

    await createIntegrationTest(
      async () => {
        const world = await seedEvalWorld();

        // Fixtures du cas : sans écart ni météo, les vues sont vides et
        // l'agent peut légitimement enchaîner d'autres appels.
        await seedChantierEnRetard({
          chantierId: "CH-005",
          territoire: BRETAGNE,
        });
        await seedChantierEnDifficulte({
          chantierId: "CH-006",
          territoire: BRETAGNE,
        });

        const resultat = await AssistantIA.generateText({
          chatId: randomUUID(),
          question: input.question,
          habilitations: world.habilitations,
          agentContext: undefined,
          userId: world.userId,
        });

        sortie = {
          toolCalls: resultat.steps.flatMap((step) =>
            step.toolCalls.map((call) => ({
              toolName: call.toolName,
              input: call.input,
            })),
          ),
          text: resultat.text,
          stepCount: resultat.steps.length,
        };
      },
      { timeout: EVAL_TIMEOUT_MS },
    )();

    return sortie!;
  },

  // La sélection d'outils n'est pas stable d'un tour à l'autre, même à
  // température 0,2. On rejoue chaque cas pour que la moyenne soit lisible.
  trialCount: 3,

  scorers: [
    {
      name: "Outils attendus",
      description: "L'appel doit porter au moins les arguments attendus.",
      scorer: ({ output, expected }) =>
        scoreExpectedTools({ output, expected }),
    },
  ],

  columns: ({ input, output }) => [
    { label: "Motif", value: input.reason },
    {
      label: "Outils appelés",
      value: output.toolCalls.map((call) => call.toolName).join(" → ") || "—",
    },
    { label: "Ét.", value: String(output.stepCount) },
  ],
});
```

- [ ] **Étape 2 : Vérifier que `BRETAGNE` est bien habilitée**

`seedEvalWorld` lit tous les territoires du référentiel — épargnés du TRUNCATE — et les met dans `habilitations`. Vérifier que `REG-53` en fait partie :

```bash
docker exec pilote_postgres_test psql -U postgres -d postgres -tAc "select code from territoire where code = 'REG-53';"
```

Attendu : `REG-53`. Si vide, la base de test n'a pas son référentiel : lancer `DATABASE_URL="postgres://postgres:postgres@localhost:7433/postgres" pnpm exec prisma migrate deploy` puis reseeder le référentiel.

- [ ] **Étape 3 : Lancer**

```bash
pnpm eval 2-tools/getChantiers.eval.ts
```

Attendu : 4 cas × 3 essais = 12 tours.

- [ ] **Étape 4 : Vérifier que les outils renvoient de la donnée**

Lire la colonne « Outils appelés » et, si un cas sort à 0, relire la réponse de l'agent. Une réponse du type « aucun chantier en retard » alors que le seed en pose un signale une fixture incomplète — `est_applicable`, la maille, ou le jalon — et non une faiblesse d'Albert.

- [ ] **Étape 5 : Consigner la référence observée**

- [ ] **Étape 6 : Commit**

```bash
git add evals/2-tools
git commit -m "feat(ppg): niveau 2, get_chantiers"
```

---

### Tâche 6 : Niveau 2 — situation territoriale et détail chantier

Cinq suites qui recopient la `task` de la tâche 5 à l'identique, en changeant les fixtures du cas et les `CASES`.

**Fichiers :**
- Créer : `evals/2-tools/getTauxAvancementTerritoire.eval.ts`, `evals/2-tools/getChantiersSignales.eval.ts`, `evals/2-tools/getIndicateurs.eval.ts`, `evals/2-tools/getChantierCommentaires.eval.ts`, `evals/2-tools/getChantierObjectifs.eval.ts`

**Interfaces :**
- Consomme : identique à la tâche 5.

`CH-001`, `CH-004` et `CH-007` sont les chantiers que `seedEvalWorld` dote d'un indicateur, d'un commentaire et d'un objectif : les trois suites de détail n'ont pas besoin de fixtures supplémentaires et leur `task` omet donc les appels `seedChantierEnRetard` / `seedChantierEnDifficulte`.

- [ ] **Étape 1 : `getTauxAvancementTerritoire.eval.ts`**

Recopier la `task` de la tâche 5 **sans** les deux appels de seed du cas, et avec ces `CASES` :

```ts
const CASES: Case[] = [
  {
    question: "Quel est le taux d'avancement de la région Bretagne ?",
    reason: "question territoriale directe, territoire nommé",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Où en est la France sur l'ensemble des chantiers ?",
    reason: "« la France » doit se résoudre en NAT-FR sans clarification",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Compare les taux d'avancement de la Bretagne et de la Normandie",
    reason: "comparaison entre deux territoires, toujours le même outil",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
  {
    question: "Donne-moi les commentaires du chantier CH-004",
    reason: "CAS NÉGATIF : détail d'un chantier, pas de taux territorial",
    expected: [
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-004" } },
    ],
  },
];
```

Nom de la suite : `evalite<...>("get_taux_avancement_territoire", { ... })`.

- [ ] **Étape 2 : `getChantiersSignales.eval.ts`**

Même `task` que l'étape 1. `CASES` :

```ts
const CASES: Case[] = [
  {
    question: "Quels sont les chantiers signalés en Bretagne ?",
    reason: "sans précision de catégorie → appel sans argument categories",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "En Bretagne, quels chantiers ont un taux non calculé ?",
    reason: "une seule catégorie nommée",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question:
      "En Bretagne, montre-moi les signalements de type PVA et météo non renseignée",
    reason: "deux catégories demandées ensemble",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "Quels chantiers sont en retard en Bretagne ?",
    reason:
      "CAS NÉGATIF : « en retard » relève de get_chantiers, pas des signalements",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
];
```

Ces cas n'expriment volontairement pas d'attente sur `categories` : les valeurs exactes de l'énumération n'ont pas été relevées dans le code, et un cas qui n'exprime rien vaut mieux qu'un cas qui exprime une valeur fausse. À enrichir si un développeur relève les valeurs dans `getChantiersSignales.ts`.

- [ ] **Étape 3 : `getIndicateurs.eval.ts`**

Même `task`, sans fixtures de cas. `CASES` :

```ts
const CASES: Case[] = [
  {
    question: "Donne-moi les indicateurs du chantier CH-004 pour la France entière",
    reason: "identifiant et territoire explicites",
    expected: [{ toolName: "get_indicateurs", input: { chantier_id: "CH-004" } }],
  },
  {
    question: "Quelles sont les valeurs des indicateurs de CH-007 ?",
    reason: "identifiant sans le mot « chantier », toujours résoluble",
    expected: [{ toolName: "get_indicateurs", input: { chantier_id: "CH-007" } }],
  },
  {
    question: "Donne-moi les objectifs du chantier CH-004",
    reason: "CAS NÉGATIF : objectifs et indicateurs sont deux outils distincts",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
];
```

- [ ] **Étape 4 : `getChantierCommentaires.eval.ts`**

Même `task`, sans fixtures de cas. `CASES` :

```ts
const CASES: Case[] = [
  {
    question: "Quels sont les commentaires les plus récents sur le CH-004 ?",
    reason: "accès aux commentaires par identifiant",
    expected: [
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question: "Quelles difficultés sont remontées dans les commentaires du CH-001 ?",
    reason: "formulation métier : « difficultés remontées » = commentaires",
    expected: [
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-001" } },
    ],
  },
  {
    question: "Donne-moi les indicateurs du chantier CH-001",
    reason: "CAS NÉGATIF : les indicateurs relèvent de get_indicateurs",
    expected: [{ toolName: "get_indicateurs", input: { chantier_id: "CH-001" } }],
  },
];
```

- [ ] **Étape 5 : `getChantierObjectifs.eval.ts`**

Même `task`, sans fixtures de cas. `CASES` :

```ts
const CASES: Case[] = [
  {
    question: "Donne-moi les objectifs du chantier CH-004",
    reason: "identifiant explicite, l'argument doit être transmis",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question: "Quelle est l'ambition affichée sur le CH-007 ?",
    reason: "formulation métier : « notre ambition » est un type d'objectif",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-007" } },
    ],
  },
  {
    question: "Quels sont les commentaires les plus récents sur le CH-007 ?",
    reason: "CAS NÉGATIF : commentaires, pas objectifs",
    expected: [
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-007" } },
    ],
  },
];
```

- [ ] **Étape 6 : Lancer les cinq suites**

```bash
pnpm eval 2-tools
```

- [ ] **Étape 7 : Consigner les cinq références observées**

- [ ] **Étape 8 : Commit**

```bash
git add evals/2-tools
git commit -m "feat(ppg): niveau 2, situation territoriale et detail chantier"
```

---

### Tâche 7 : Niveau 2 — outils de recherche

Trois suites. Les cas négatifs vérifient surtout que ces outils **ne** sont **pas** appelés quand l'identifiant est déjà fourni — le prompt système l'interdit.

**Fichiers :**
- Créer : `evals/2-tools/searchChantiers.eval.ts`, `evals/2-tools/searchIndicateurs.eval.ts`, `evals/2-tools/searchTerritoires.eval.ts`

- [ ] **Étape 1 : `searchChantiers.eval.ts`**

Même `task` qu'à la tâche 6, sans fixtures de cas. En-tête et `CASES` :

```ts
/**
 * Niveau 2 — `search_chantiers`.
 *
 * `seedEvalWorld` sème vingt chantiers groupés par thème et volontairement
 * proches : trois sur les violences faites aux femmes, trois sur la santé,
 * trois sur le logement, deux sur le handicap. C'est ce qui rend la recherche
 * discriminante — l'outil injecte la liste entière dans le prompt de son
 * sous-agent.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: Case[] = [
  {
    question:
      "Quels sont les chantiers qui traitent des violences sexistes et sexuelles ?",
    reason: "thématique sans identifiant : passe par la recherche sémantique",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Y a-t-il un chantier sur l'accès aux soins ?",
    reason: "thématique proche de plusieurs chantiers santé du monde de base",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Donne-moi les indicateurs du chantier CH-004",
    reason:
      "CAS NÉGATIF : identifiant déjà fourni, le prompt interdit de rechercher",
    expected: [{ toolName: "get_indicateurs", input: { chantier_id: "CH-004" } }],
  },
];
```

- [ ] **Étape 2 : `searchIndicateurs.eval.ts`**

```ts
const CASES: Case[] = [
  {
    question: "Quel indicateur mesure la rénovation énergétique des logements ?",
    reason: "libellé d'indicateur en langage naturel, sans identifiant",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question: "Trouve-moi l'indicateur sur les déserts médicaux",
    reason: "thématique d'indicateur, pas de chantier nommé",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question: "Donne-moi les indicateurs du chantier CH-007 pour la France entière",
    reason:
      "CAS NÉGATIF : chantier identifié, on récupère ses indicateurs sans recherche",
    expected: [{ toolName: "get_indicateurs", input: { chantier_id: "CH-007" } }],
  },
];
```

- [ ] **Étape 3 : `searchTerritoires.eval.ts`**

```ts
const CASES: Case[] = [
  {
    question: "Quel est le code du département du Finistère ?",
    reason: "nom de territoire à résoudre en code DEPT-XX",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question: "Quel est le taux d'avancement du territoire où se trouve Brest ?",
    reason: "territoire désigné indirectement : à résoudre avant d'interroger",
    expected: [
      { toolName: "search_territoires" },
      { toolName: "get_taux_avancement_territoire" },
    ],
  },
  {
    question: "Quel est le taux d'avancement de la France entière ?",
    reason: "CAS NÉGATIF : « la France » se résout en NAT-FR sans recherche",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];
```

- [ ] **Étape 4 : Lancer les trois suites**

```bash
pnpm eval 2-tools/searchChantiers.eval.ts
pnpm eval 2-tools/searchIndicateurs.eval.ts
pnpm eval 2-tools/searchTerritoires.eval.ts
```

Les plus lentes du niveau 2 : chaque recherche déclenche un sous-agent LLM. Deux à trois minutes par suite.

- [ ] **Étape 5 : Consigner les trois références observées**

- [ ] **Étape 6 : Commit**

```bash
git add evals/2-tools
git commit -m "feat(ppg): niveau 2, outils de recherche"
```

---

### Tâche 8 : Niveau 2 — interaction et livrables

`display_choices`, `create_dashboard`, `export_rapport`. Les deux derniers ne sont exposés que si la capacity est détectée : leurs suites vérifient de bout en bout ce que le niveau 1 vérifie isolément.

**Fichiers :**
- Créer : `evals/2-tools/displayChoices.eval.ts`, `evals/2-tools/createDashboard.eval.ts`, `evals/2-tools/exportRapport.eval.ts`
- Supprimer : `evals/2-tools/.gitkeep`

- [ ] **Étape 1 : `displayChoices.eval.ts`**

Même `task`, sans fixtures de cas. Le prompt système porte des interdits explicites sur cet outil — ils sont la moitié des cas :

```ts
const CASES: Case[] = [
  {
    question: "Quels chantiers sont signalés en alerte ?",
    reason:
      "sous-spécifiée : aucun territoire. L'agent doit proposer un choix, pas deviner",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question: "Fais-moi la synthèse du chantier sur le logement",
    reason: "trois chantiers logement dans le monde de base : ambiguïté réelle",
    expected: [{ toolName: "search_chantiers" }, { toolName: "display_choices" }],
  },
  {
    question: "Bonjour, tu peux m'aider ?",
    reason: "CAS NÉGATIF : salutation sans intention de données, aucun outil",
    expected: [],
  },
];
```

- [ ] **Étape 2 : `createDashboard.eval.ts`**

Même `task` **avec** les deux appels de seed du cas (`seedChantierEnRetard` sur `CH-005`, `seedChantierEnDifficulte` sur `CH-006`, tous deux sur `BRETAGNE`) :

```ts
const CASES: Case[] = [
  {
    question:
      "Compose un tableau de bord de la Bretagne avec le taux d'avancement et les chantiers en retard",
    reason: "demande de dashboard explicite, données disponibles",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "create_dashboard" },
    ],
  },
  {
    question: "Affiche-moi un cockpit de la Bretagne",
    reason: "« cockpit » est un synonyme dashboard du détecteur d'intention",
    expected: [{ toolName: "create_dashboard" }],
  },
  {
    question: "Quel est le taux d'avancement de la Bretagne ?",
    reason: "CAS NÉGATIF : question factuelle, aucune intention de visualisation",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];
```

- [ ] **Étape 3 : `exportRapport.eval.ts`**

Même `task` avec les mêmes fixtures de cas qu'à l'étape 2 :

```ts
const CASES: Case[] = [
  {
    question:
      "Crée un rapport de synthèse de la Bretagne incluant le taux d'avancement et les chantiers en retard. Format Markdown",
    reason: "demande d'export explicite, reprise du scénario de l'interface",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "export_rapport" },
    ],
  },
  {
    question: "Je voudrais télécharger un PDF de la situation de la Bretagne",
    reason: "« télécharger » et « pdf » sont des mots-clés export",
    expected: [{ toolName: "export_rapport" }],
  },
  {
    question: "Fais-moi la synthèse de la Bretagne",
    reason: "CAS NÉGATIF : synthèse dans le chat, pas d'export de fichier",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];
```

- [ ] **Étape 4 : Lancer et mesurer le niveau 2 complet**

```bash
rm evals/2-tools/.gitkeep
pnpm eval 2-tools
```

Noter la durée totale dans le rapport de tâche. L'estimation du spec est d'une dizaine de minutes.

- [ ] **Étape 5 : Consigner les références observées**

Le POC avait mesuré `display_choices` à un essai sur trois. Si le chiffre se confirme, le consigner tel quel : c'est la défaillance prioritaire que la suite existe pour documenter.

- [ ] **Étape 6 : Commit**

```bash
git add evals/2-tools
git commit -m "feat(ppg): niveau 2, interaction et livrables"
```

---

### Tâche 9 : Niveau 3 — scénarios envoyés tels quels

Les scénarios de `src/client/components/PageAccueil/scenariosTerritoire.ts` en `mode: "send"`. Ce niveau ajoute deux scorers de juge, et exige donc un territoire peuplé — sans données, la réponse est vide et le juge note le vide.

**Fichiers :**
- Créer : `evals/3-scenarios/sentScenarios.eval.ts`

**Interfaces :**
- Consomme : les mêmes briques que la tâche 5, plus `createJudgeScorer` de `evals/judge.ts`.

- [ ] **Étape 1 : Écrire la suite**

```ts
import { randomUUID } from "node:crypto";
import { evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { BRETAGNE, EVAL_TIMEOUT_MS, seedEvalWorld } from "../world";
import {
  seedChantierAvecTaux,
  seedChantierEnDifficulte,
  seedChantierEnRetard,
} from "../seeds";
import { scoreExpectedTools } from "../scoreExpectedTools";
import { createJudgeScorer } from "../judge";
import type { AgentTurn, ObservedToolCall } from "../types";

/**
 * Niveau 3 — scénarios `mode: "send"` de l'écran d'accueil.
 *
 * Source : src/client/components/PageAccueil/scenariosTerritoire.ts. Les
 * questions sont recopiées telles quelles, le territoire remplacé par la
 * Bretagne — le seul que ces cas peuplent.
 *
 * Deux scorers de juge en plus de la sélection d'outils : le premier dit si
 * l'agent a fait le bon travail, les seconds s'il l'a rendu exploitable.
 *
 * Référence observée : à compléter au premier run.
 */

type Case = {
  question: string;
  reason: string;
  expected: ObservedToolCall[];
};

const CASES: Case[] = [
  {
    question:
      "Analyse les chantiers en retard sur la Bretagne. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.",
    reason: "Chantiers en retard et leurs indicateurs (DITP et coordinateur)",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_indicateurs" },
    ],
  },
  {
    question:
      "Crée un rapport de synthèse du territoire Bretagne incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown",
    reason: "Rapport complet en Markdown (DITP admin)",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      { toolName: "export_rapport" },
    ],
  },
  {
    question:
      "Compose un tableau de bord pour la Bretagne. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement.",
    reason: "Tableau de bord du territoire (DITP admin), version abrégée",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      { toolName: "create_dashboard" },
    ],
  },
];

evalite<Case, AgentTurn, ObservedToolCall[]>("Scénarios envoyés", {
  data: () => CASES.map((cas) => ({ input: cas, expected: cas.expected })),

  task: async (input) => {
    let sortie: AgentTurn | undefined;

    await createIntegrationTest(
      async () => {
        const world = await seedEvalWorld();

        // Un territoire avec de quoi produire une vraie synthèse. Sans ça, les
        // outils renvoient vide et le juge note l'absence de données plutôt
        // que la qualité de la rédaction.
        await seedChantierAvecTaux({
          chantierId: "CH-001",
          territoire: BRETAGNE,
          taux: 62,
        });
        await seedChantierEnRetard({
          chantierId: "CH-005",
          territoire: BRETAGNE,
        });
        await seedChantierEnDifficulte({
          chantierId: "CH-006",
          territoire: BRETAGNE,
        });

        const resultat = await AssistantIA.generateText({
          chatId: randomUUID(),
          question: input.question,
          habilitations: world.habilitations,
          agentContext: undefined,
          userId: world.userId,
        });

        sortie = {
          toolCalls: resultat.steps.flatMap((step) =>
            step.toolCalls.map((call) => ({
              toolName: call.toolName,
              input: call.input,
            })),
          ),
          text: resultat.text,
          stepCount: resultat.steps.length,
        };
      },
      { timeout: EVAL_TIMEOUT_MS },
    )();

    return sortie!;
  },

  // Un juge LLM n'est pas stable non plus : deux passages montrent l'écart
  // sans tripler le coût d'un niveau déjà lent.
  trialCount: 2,

  scorers: [
    {
      name: "Outils attendus",
      description: "L'appel doit porter au moins les arguments attendus.",
      scorer: ({ output, expected }) =>
        scoreExpectedTools({ output, expected }),
    },
    createJudgeScorer<Case>({
      name: "Ancrage factuel",
      criterion:
        "La réponse s'appuie uniquement sur des données chiffrées ou des libellés qui semblent provenir de l'outillage, sans inventer de chiffre, de date ni de nom de chantier.",
    }),
    createJudgeScorer<Case>({
      name: "Utilité opérationnelle",
      criterion:
        "Un agent public qui pilote ces chantiers peut agir directement à partir de la réponse : elle est structurée, va à l'essentiel et n'enfouit pas l'information sous du remplissage.",
    }),
  ],

  columns: ({ input, output }) => [
    { label: "Scénario", value: input.reason },
    {
      label: "Outils appelés",
      value: output.toolCalls.map((call) => call.toolName).join(" → ") || "—",
    },
    { label: "Ét.", value: String(output.stepCount) },
  ],
});
```

- [ ] **Étape 2 : Lancer**

```bash
pnpm eval 3-scenarios/sentScenarios.eval.ts
```

3 cas × 2 essais = 6 tours, plus 2 appels de juge par tour. Cinq à dix minutes.

- [ ] **Étape 3 : Vérifier que le juge ne note pas du vide**

Lire les justifications (lignes `[juge:...]`). Si l'une mentionne une absence de données, compléter les fixtures du cas plutôt que d'accepter la note.

- [ ] **Étape 4 : Consigner la référence observée**

Trois scores séparés : outils, ancrage factuel, utilité opérationnelle.

- [ ] **Étape 5 : Commit**

```bash
git add evals/3-scenarios
git commit -m "feat(ppg): niveau 3, scenarios envoyes depuis l'interface"
```

---

### Tâche 10 : Niveau 3 — scénarios à compléter

Les scénarios `mode: "fill"` sont des templates à trous que l'utilisateur complète. Le cas joue son rôle : il remplit le trou avec une valeur du monde semé.

**Fichiers :**
- Créer : `evals/3-scenarios/filledScenarios.eval.ts`
- Supprimer : `evals/3-scenarios/.gitkeep`

- [ ] **Étape 1 : Écrire la suite**

Recopier intégralement la `task`, les `scorers` et les `columns` de la tâche 9. En-tête et `CASES` :

```ts
/**
 * Niveau 3 — scénarios `mode: "fill"` de l'écran d'accueil.
 *
 * Ces templates arrivent à l'utilisateur avec un trou : un territoire à
 * nommer, un `CH-XXX` à remplacer. Le cas joue le rôle de l'utilisateur qui
 * complète, avec des valeurs du monde semé.
 *
 * Source : src/client/components/PageAccueil/scenariosTerritoire.ts.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: Case[] = [
  {
    question: "Fais moi la synthèse du territoire Bretagne",
    reason: "Synthèse d'un territoire — trou : le territoire",
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question:
      "Fais moi la synthèse du chantier CH-001 sur le territoire Bretagne\nComment se situe ce chantier par rapport aux autres territoires ?\nQuelles sont les principales difficultés remontées dans les commentaires ?",
    reason:
      "Synthèse d'un chantier sur un territoire — trous : CH-XXX et NOM_TERRITOIRE. Question en trois volets",
    expected: [
      { toolName: "get_chantiers" },
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-001" } },
    ],
  },
  {
    question:
      "Synthétise les commentaires des chantiers suivants CH-001, CH-004, notamment les principales actions identifiées",
    reason:
      "Synthèse des commentaires de plusieurs chantiers (coordinateur) — trous : les identifiants",
    expected: [
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-001" } },
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question: "Fais moi la synthèse des difficultés du territoire Bretagne",
    reason: "Synthèse des difficultés (coordinateur) — trou : le territoire",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
];
```

Le deuxième cas n'exprime pas d'attente sur les arguments de `get_chantiers` : le nom du paramètre qui porte une liste d'identifiants n'a pas été relevé dans `getChantiers.ts`. À enrichir une fois vérifié.

- [ ] **Étape 2 : Lancer**

```bash
rm evals/3-scenarios/.gitkeep
pnpm eval 3-scenarios/filledScenarios.eval.ts
```

- [ ] **Étape 3 : Consigner la référence observée**

- [ ] **Étape 4 : Commit**

```bash
git add evals/3-scenarios
git commit -m "feat(ppg): niveau 3, scenarios a completer"
```

---

### Tâche 11 : Niveau 4 — vocabulaire et ambiguïtés

Source : la table « Comprendre les demandes utilisateur » du prompt système. Chacune de ses lignes est un contrat entre une expression de terrain et un appel d'outil.

**Fichiers :**
- Créer : `evals/4-edge-cases/vocabulary.eval.ts`

- [ ] **Étape 1 : Écrire la suite**

Recopier la `task` de la tâche 5, fixtures de cas comprises (`seedChantierEnRetard` sur `CH-005` et `seedChantierEnDifficulte` sur `CH-006`, sur `BRETAGNE`). En-tête et `CASES` :

```ts
/**
 * Niveau 4 — abréviations et formulations ambiguës.
 *
 * Les utilisateurs — préfets, coordinateurs territoriaux, référents
 * ministériels — n'emploient pas le vocabulaire officiel. Le prompt système
 * porte une table de traduction ; chacune de ses lignes est un contrat, donc
 * un cas.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: Case[] = [
  {
    question: "En Bretagne, quels sont les points noirs ?",
    reason: "« les points noirs » → les DEUX views, contrat de la table",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quels chantiers vont mal en Bretagne ?",
    reason: "« chantiers qui vont mal » → les deux views",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quels chantiers sont compromis en Bretagne ?",
    reason:
      "AMBIGU assumé : météo ORAGE ou chantiers à risque. Le prompt demande de couvrir les deux interprétations",
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Combien de PPG sont en retard en Bretagne ?",
    reason: "« PPG » est un synonyme de chantier",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
  {
    question: "Quel est le niveau de confiance en Bretagne ?",
    reason: "« niveau de confiance » est un synonyme de météo",
    expected: [{ toolName: "get_chantiers" }],
  },
  {
    question: "Quels sont les chantiers sur les VSS ?",
    reason: "acronyme métier non officiel : passe par la recherche sémantique",
    expected: [{ toolName: "search_chantiers" }],
  },
];
```

- [ ] **Étape 2 : Lancer**

```bash
pnpm eval 4-edge-cases/vocabulary.eval.ts
```

- [ ] **Étape 3 : Consigner la référence observée, cas par cas**

Sur ce niveau la moyenne masque l'essentiel : un contrat de la table du prompt qui ne tient pas est une information directement actionnable sur le prompt.

- [ ] **Étape 4 : Commit**

```bash
git add evals/4-edge-cases
git commit -m "feat(ppg): niveau 4, vocabulaire et ambiguites"
```

---

### Tâche 12 : Niveau 4 — sous-spécification et hors-sujet

La défaillance prioritaire du spec : Albert devine au lieu de demander.

**Fichiers :**
- Créer : `evals/4-edge-cases/underspecified.eval.ts`
- Supprimer : `evals/4-edge-cases/.gitkeep`
- Modifier : `docs/superpowers/specs/2026-09-10-albert-strategie-evaluation-design.md`

- [ ] **Étape 1 : Écrire la suite**

Recopier la `task` de la tâche 5, **sans** fixtures de cas. En-tête et `CASES` :

```ts
/**
 * Niveau 4 — demandes sous-spécifiées et hors-sujet.
 *
 * La défaillance que cette suite documente : sur une demande incomplète,
 * Albert choisit à la place de l'utilisateur au lieu de proposer un choix.
 * Le POC l'avait mesurée à un essai sur trois.
 *
 * Le prompt système interdit par ailleurs `display_choices` quand une phrase
 * libre suffirait — les trois derniers cas testent cet interdit.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: Case[] = [
  {
    question: "Quels chantiers sont en retard ?",
    reason:
      "aucun territoire : l'agent ne doit pas choisir à la place de l'utilisateur",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question: "Fais-moi une synthèse",
    reason: "ni territoire ni chantier : demande trop vague pour être servie",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question: "Donne-moi les indicateurs",
    reason: "outil identifiable mais aucun chantier désigné",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question: "Bonjour, tu peux m'aider ?",
    reason: "CAS NÉGATIF : salutation sans intention de données",
    expected: [],
  },
  {
    question: "Qui est le président de la République ?",
    reason: "CAS NÉGATIF : hors périmètre, aucun outil de données",
    expected: [],
  },
  {
    question: "Merci, c'est parfait",
    reason: "CAS NÉGATIF : clôture de conversation, ni outil ni display_choices",
    expected: [],
  },
];
```

- [ ] **Étape 2 : Lancer**

```bash
rm evals/4-edge-cases/.gitkeep
pnpm eval 4-edge-cases/underspecified.eval.ts
```

- [ ] **Étape 3 : Consigner la référence observée**

Consigner le score du premier cas séparément : c'est la mesure de la défaillance prioritaire, celle qu'on suivra dans le temps.

- [ ] **Étape 4 : Lancer la suite complète**

```bash
pnpm eval
```

Noter la durée totale et le score par niveau.

- [ ] **Étape 5 : Vérifier que la base de dev est intacte**

```bash
docker exec pilote_postgres psql -U postgres -d postgres -tAc "select count(*) from chantier_identite;"
```

Attendu : le compte d'origine, inchangé. Le garde-fou d'`evals/env.ts` doit avoir empêché tout accès à cette base ; ce contrôle vérifie qu'il tient sur une suite complète.

- [ ] **Étape 6 : Compléter le spec**

Ajouter une section `## Mesures de référence` en fin de spec : date, modèle, durée totale, score par niveau. Le spec dit ce qu'on évalue ; cette section dit où on en était le jour de la mise en place.

- [ ] **Étape 7 : Commit**

```bash
git add evals/4-edge-cases docs/superpowers/specs/2026-09-10-albert-strategie-evaluation-design.md
git commit -m "feat(ppg): niveau 4, sous-specification et hors-sujet"
```

---

## Auto-revue du plan

**Couverture du spec.** Niveau 1 en tâche 4 ; niveau 2 en tâches 5 à 8, douze suites, une par outil, chacune avec au moins un cas négatif ; niveau 3 en tâches 9 et 10, calibration du juge déplacée en tâche 1 ; niveau 4 en tâches 11 et 12. Le monde à deux étages est en tâches 2 et 5 — la base dans `seedEvalWorld`, les fixtures du cas écrites dans la `task`. Le hors-périmètre du spec — CI, sous-agents isolés, suite de factualité dédiée — n'a volontairement aucune tâche.

**Duplication assumée.** La `task` est recopiée dans les treize fichiers d'eval. C'est un choix : chaque fichier se lit de haut en bas sans aller voir ailleurs ce qui enveloppe sa `task`. Ce qui est partagé — `seedEvalWorld`, les fixtures, le scorer, le juge — est appelé depuis la `task`, jamais autour.

**Points laissés ouverts, à trancher à l'exécution.** Deux cas n'expriment pas d'attente sur des arguments dont le nom n'a pas été relevé dans le code : la liste d'identifiants de `get_chantiers` (tâche 10) et les valeurs de `categories` de `get_chantiers_signales` (tâche 6). Délibéré : un cas qui n'exprime pas d'attente vaut mieux qu'un cas qui en exprime une fausse.

**Cohérence des types.** `AgentTurn` expose `toolCalls`, `text`, `stepCount` — le juge consomme `text`, `scoreExpectedTools` consomme `toolCalls` et `expected`, les colonnes consomment `stepCount`. `createJudgeScorer` est renommé en tâche 1 et consommé aux tâches 9 et 10. `EVAL_TIMEOUT_MS` et `BRETAGNE` sont créés en tâche 2 et consommés à partir de la tâche 5.
