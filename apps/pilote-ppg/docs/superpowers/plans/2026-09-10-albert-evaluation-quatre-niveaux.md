# Évaluation d'Albert en quatre niveaux — plan d'implémentation

> **Pour les agents :** SOUS-SKILL REQUISE — utiliser `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour dérouler ce plan tâche par tâche. Les étapes utilisent la syntaxe checkbox (`- [ ]`).

**Objectif :** remplacer les trois evals du POC par une suite structurée en quatre niveaux, qui documente le comportement attendu d'Albert et permet de mesurer l'effet d'une modification de prompt.

**Architecture :** un seul harnais — monde semé dans une transaction annulée, puis `AssistantIA.generateText`. Les cas se déclarent en données ; un helper partagé construit la suite Evalite et applique le scorer. Chaque cas peut poser ses propres fixtures avant le tour d'agent.

**Stack :** TypeScript, Evalite 1.0.0-beta.16, Vitest, Prisma, `ai` v7, API Albert (Etalab).

**Spec :** `apps/pilote-ppg/docs/superpowers/specs/2026-09-10-albert-strategie-evaluation-design.md`

## Contraintes globales

- Toutes les commandes se lancent depuis `apps/pilote-ppg`.
- Les evals se lancent **uniquement** via `pnpm eval` / `pnpm eval:dev`, qui forcent `DOTENV_CONFIG_PATH=.env.test`. Un lancement direct d'`evalite` est bloqué par le garde-fou d'`evals/env.ts`.
- Prérequis d'exécution : `docker compose up -d postgres_test`, et `apps/pilote-ppg/.env.evals.local` contenant `ALBERT_API_KEY` recopiée depuis `.env`.
- Identifiants, types et noms de fichiers **en anglais** dans tout ce qui est écrit ou réécrit — demande explicite de la revue de PR. Les commentaires et le contenu des cas restent en français.
- Pas d'export par défaut : `export const` / `export function` nommés, imports nommés.
- Les helpers prennent un objet de paramètres nommés, jamais de positionnels.
- Ne jamais réintroduire de construction de tools ou de prompt système dans `evals/` : tout le câblage vit dans `AssistantIA`.
- `evalite.config.ts` n'est pas modifié par ce plan. `cache: false`, `fileParallelism: false`, `maxConcurrency: 1` et `testTimeout: 420_000` sont acquis et nécessaires.

## Cycle de travail (remplace le TDD)

Une suite d'eval n'a pas de cycle rouge/vert : l'implémentation est le comportement du modèle, on ne le « fait pas passer ». Chaque tâche qui écrit des cas suit donc :

1. Écrire les cas.
2. Lancer la suite.
3. **Consigner le score observé** en en-tête du fichier, avec la date et le modèle.
4. Commiter.

Un cas qui sort bas est un **constat**, pas un échec de la tâche. Ne jamais affaiblir un cas pour remonter un score : si un cas révèle une faiblesse réelle d'Albert, la consigner en en-tête et la remonter dans le rapport de tâche.

Les tâches qui écrivent du code non-LLM (tâches 1 à 3) suivent le cycle habituel : test, échec, implémentation, passage, commit.

---

### Tâche 1 : Arborescence et renommage du juge

Met en place la structure de dossiers, renomme le juge en anglais, et supprime les jeux de cas du POC. Aucune eval ne tourne à la fin de cette tâche — c'est voulu, les cas arrivent aux tâches suivantes.

**Fichiers :**
- Créer : `evals/1-keywords/.gitkeep`, `evals/2-tools/.gitkeep`, `evals/3-scenarios/.gitkeep`, `evals/4-edge-cases/.gitkeep`
- Renommer : `evals/jugeAlbert.ts` → `evals/judge.ts`
- Supprimer : `evals/toolCalls.eval.ts`, `evals/qualiteReponse.eval.ts`, `evals/detecteurIntention.eval.ts`
- Déplacer : `evals/calibrationJuge.eval.ts` → `evals/3-scenarios/judgeCalibration.eval.ts`
- Modifier : `package.json` (script `eval:rapide`)

**Interfaces :**
- Consomme : rien.
- Produit : `evals/judge.ts` exportant `JUDGE_MODEL: string` et `createJudgeScorer<TInput extends { question: string }>({ name, criterion }): Scorer` — noter le renommage des paramètres `nom`/`critere` en `name`/`criterion`, et de la propriété de sortie attendue `texte` en `text` pour coller à `AgentTurn`.

- [ ] **Étape 1 : Créer les quatre dossiers de niveau**

```bash
mkdir -p evals/1-keywords evals/2-tools evals/3-scenarios evals/4-edge-cases
touch evals/1-keywords/.gitkeep evals/2-tools/.gitkeep evals/3-scenarios/.gitkeep evals/4-edge-cases/.gitkeep
```

- [ ] **Étape 2 : Renommer le juge et angliciser son interface**

Renommer le fichier :

```bash
git mv evals/jugeAlbert.ts evals/judge.ts
```

Dans `evals/judge.ts`, appliquer ces renommages (le corps de `demanderVerdict` et le schéma Zod restent inchangés) :

- `MODELE_JUGE` → `JUDGE_MODEL`
- `creerScorerJuge` → `createJudgeScorer`
- paramètres `{ nom, critere }` → `{ name, criterion }`
- la contrainte de sortie `{ texte: string }` → `{ text: string }`, et `output.texte` → `output.text`

La signature cible :

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

- [ ] **Étape 3 : Déplacer la calibration du juge et l'adapter**

```bash
git mv evals/calibrationJuge.eval.ts evals/3-scenarios/judgeCalibration.eval.ts
```

Dans le fichier déplacé, corriger les imports et les noms :

```ts
import { createJudgeScorer, JUDGE_MODEL } from "../judge";
```

Renommer le type `CasCalibration` en `CalibrationCase`, et adapter la sortie de la tâche pour qu'elle produise `{ text: string }` au lieu de `{ texte: string }`. Les cas eux-mêmes (questions, réponses écrites à la main, `attendu: "haut" | "bas"`) restent inchangés — renommer seulement le champ `attendu` en `expected`.

- [ ] **Étape 4 : Supprimer les jeux de cas du POC**

```bash
git rm evals/toolCalls.eval.ts evals/qualiteReponse.eval.ts evals/detecteurIntention.eval.ts
```

- [ ] **Étape 5 : Corriger le script `eval:rapide`**

Dans `package.json`, il pointe sur un fichier supprimé. Le faire pointer sur le niveau 1, qui sera créé en tâche 4 :

```json
"eval:rapide": "DOTENV_CONFIG_PATH=.env.test evalite run evals/1-keywords"
```

- [ ] **Étape 6 : Vérifier que rien ne casse**

```bash
pnpm exec tsc --noEmit
```

Attendu : `EXIT=0`, aucune erreur. Si `tsc` remonte des références à `jugeAlbert` ou aux evals supprimées, corriger avant de commiter.

- [ ] **Étape 7 : Commit**

```bash
git add -A evals package.json
git commit -m "refactor(ppg): arborescence des evals en quatre niveaux"
```

---

### Tâche 2 : Fixtures par cas et helpers de seed

Ouvre `withEvalWorld` aux fixtures propres à un cas, et fournit les briques réutilisables dont les niveaux 2 et 3 auront besoin (chantier en retard, chantier en difficulté, taux d'avancement).

Rappel des critères métier, lus dans `src/server/chantiers/query/GetChantiersQuery.ts:96-98` :
- `est_en_retard` ⟺ `chantier_territoire_jalon.ecart <= -10`
- `est_en_difficulte` ⟺ pas en retard **et** `chantier_territoire.meteo` vaut `ORAGE` ou `NUAGE`

**Fichiers :**
- Modifier : `evals/world.ts`
- Créer : `evals/seeds.ts`
- Tester : `src/server/albert/__tests__/evalSeeds.integration.test.ts`

**Interfaces :**
- Consomme : `EvalWorld`, `withEvalWorld` de `evals/world.ts` ; `fixtures` de `@/server/infrastructure/test/fixtures`.
- Produit :
  - `withEvalWorld<T>({ seed, run }: { seed?: (world: EvalWorld) => Promise<void>; run: (world: EvalWorld) => Promise<T> }): Promise<T>` — **la signature change**, elle prend désormais un objet.
  - `seedChantierEnRetard({ chantierId, territoireCode }): Promise<void>`
  - `seedChantierEnDifficulte({ chantierId, territoireCode }): Promise<void>`
  - `seedTauxAvancement({ chantierId, territoireCode, taux }): Promise<void>`
  - `NATIONAL_TERRITORY: "NAT-FR"` exporté depuis `evals/world.ts`

- [ ] **Étape 1 : Écrire le test d'intégration qui échoue**

Créer `src/server/albert/__tests__/evalSeeds.integration.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { seedEvalWorld, NATIONAL_TERRITORY } from "../../../../evals/world";
import {
  seedChantierEnDifficulte,
  seedChantierEnRetard,
} from "../../../../evals/seeds";

describe("fixtures du monde d'eval", () => {
  it(
    "marque un chantier en retard via un écart inférieur à -10",
    createIntegrationTest(async () => {
      // Given
      await seedEvalWorld();

      // When
      await seedChantierEnRetard({
        chantierId: "CH-005",
        territoireCode: NATIONAL_TERRITORY,
      });

      // Then
      const jalon = await getPrisma().chantier_territoire_jalon.findFirst({
        where: { id: "CH-005", territoire_code: NATIONAL_TERRITORY },
      });
      expect(jalon?.ecart).toBe(-15);
    }),
    60_000,
  );

  it(
    "marque un chantier en difficulté via la météo, sans le mettre en retard",
    createIntegrationTest(async () => {
      // Given
      await seedEvalWorld();

      // When
      await seedChantierEnDifficulte({
        chantierId: "CH-006",
        territoireCode: NATIONAL_TERRITORY,
      });

      // Then
      const territoire = await getPrisma().chantier_territoire.findFirst({
        where: { id: "CH-006", territoire_code: NATIONAL_TERRITORY },
      });
      const jalon = await getPrisma().chantier_territoire_jalon.findFirst({
        where: { id: "CH-006", territoire_code: NATIONAL_TERRITORY },
      });
      expect(territoire?.meteo).toBe("ORAGE");
      expect(jalon?.ecart).toBe(0);
    }),
    60_000,
  );
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
pnpm test:server:integration src/server/albert/__tests__/evalSeeds.integration.test.ts
```

Attendu : ÉCHEC, `Cannot find module '../../../../evals/seeds'`.

- [ ] **Étape 3 : Écrire `evals/seeds.ts`**

```ts
import { fixtures } from "@/server/infrastructure/test/fixtures";

/**
 * Briques de données réutilisables par les cas d'eval.
 *
 * Les seuils viennent de `GetChantiersQuery` : un chantier est en retard si
 * l'écart à la médiane est <= -10, et en difficulté s'il n'est pas en retard
 * et que sa météo est ORAGE ou NUAGE. Les valeurs ci-dessous sont choisies
 * franchement de part et d'autre du seuil : un cas d'eval ne doit pas basculer
 * sur un arrondi.
 */

const ECART_EN_RETARD = -15;
const ECART_A_L_HEURE = 0;
const JALON_COURANT = 2025;

async function seedChantierTerritoire({
  chantierId,
  territoireCode,
  meteo,
  ecart,
}: {
  chantierId: string;
  territoireCode: string;
  meteo: string;
  ecart: number;
}) {
  await fixtures.chantierTerritoire({
    id: chantierId,
    territoire_code: territoireCode,
    code_insee: "FR",
    maille: "NAT",
    zone_id: "FRANCE",
    meteo,
  });

  await fixtures.chantierTerritoireJalon({
    id: chantierId,
    territoire_code: territoireCode,
    code_insee: "FR",
    maille: "NAT",
    zone_id: "FRANCE",
    jalon: JALON_COURANT,
    ecart,
  });
}

export async function seedChantierEnRetard({
  chantierId,
  territoireCode,
}: {
  chantierId: string;
  territoireCode: string;
}) {
  await seedChantierTerritoire({
    chantierId,
    territoireCode,
    meteo: "SOLEIL",
    ecart: ECART_EN_RETARD,
  });
}

export async function seedChantierEnDifficulte({
  chantierId,
  territoireCode,
}: {
  chantierId: string;
  territoireCode: string;
}) {
  await seedChantierTerritoire({
    chantierId,
    territoireCode,
    meteo: "ORAGE",
    ecart: ECART_A_L_HEURE,
  });
}

export async function seedTauxAvancement({
  chantierId,
  territoireCode,
  taux,
}: {
  chantierId: string;
  territoireCode: string;
  taux: number;
}) {
  await fixtures.chantierTerritoireJalon({
    id: chantierId,
    territoire_code: territoireCode,
    code_insee: "FR",
    maille: "NAT",
    zone_id: "FRANCE",
    jalon: JALON_COURANT,
    taux_avancement: taux,
  });
}
```

- [ ] **Étape 4 : Exporter `NATIONAL_TERRITORY` et ouvrir `withEvalWorld`**

Dans `evals/world.ts`, exporter la constante existante (aujourd'hui `TERRITOIRE_NATIONAL`, privée) sous son nom anglais :

```ts
export const NATIONAL_TERRITORY = "NAT-FR";
```

Remplacer toutes les occurrences internes de `TERRITOIRE_NATIONAL` par `NATIONAL_TERRITORY`.

Puis remplacer `withEvalWorld` par la version qui accepte un seed de cas :

```ts
/**
 * Joue `run` sur le monde de base, dans une transaction annulée à la sortie —
 * lignes `llm_calls` de l'assistant comprises.
 *
 * `seed` pose les fixtures propres au cas, dans la MÊME transaction, entre le
 * monde de base et le tour d'agent. C'est ce qui permet au niveau 3 d'exiger
 * taux d'avancement et météo sans faire payer ce coût aux autres niveaux.
 *
 * `createIntegrationTest` attend une fonction sans valeur de retour, alors
 * qu'une tâche d'eval doit rendre sa sortie au scorer. On la récupère donc par
 * fermeture plutôt que d'aller changer une signature partagée par 161 fichiers.
 */
export async function withEvalWorld<T>({
  seed,
  run,
}: {
  seed?: (world: EvalWorld) => Promise<void>;
  run: (world: EvalWorld) => Promise<T>;
}): Promise<T> {
  let sortie: T | undefined;

  await createIntegrationTest(
    async () => {
      const world = await seedEvalWorld();
      await seed?.(world);
      sortie = await run(world);
    },
    { timeout: TIMEOUT_TRANSACTION_MS },
  )();

  return sortie as T;
}
```

- [ ] **Étape 5 : Lancer le test pour vérifier qu'il passe**

```bash
pnpm test:server:integration src/server/albert/__tests__/evalSeeds.integration.test.ts
```

Attendu : `Tests 2 passed (2)`.

- [ ] **Étape 6 : Vérifier le typage**

```bash
pnpm exec tsc --noEmit
```

Attendu : `EXIT=0`.

- [ ] **Étape 7 : Commit**

```bash
git add evals/world.ts evals/seeds.ts src/server/albert/__tests__/evalSeeds.integration.test.ts
git commit -m "feat(ppg): fixtures par cas dans le monde d'eval"
```

---

### Tâche 3 : Helper de suite par outil

Factorise ce que les douze suites du niveau 2 et les deux du niveau 4 ont en commun : la forme d'un cas, le scorer sur les tool calls, et la construction de la suite Evalite. Sans ce helper, la logique de pondération du scorer serait recopiée quatorze fois.

**Fichiers :**
- Créer : `evals/toolCase.ts`
- Tester : `src/server/albert/__tests__/toolCaseScorer.unit.test.ts`

**Interfaces :**
- Consomme : `ObservedToolCall`, `AgentTurn`, `runAgentTurn` de `evals/agentTurn.ts` ; `withEvalWorld`, `EvalWorld` de `evals/world.ts`.
- Produit :
  - `type ToolCase = { question: string; reason: string; seed?: (world: EvalWorld) => Promise<void>; expected: ObservedToolCall[] }`
  - `scoreExpectedTools({ output, expected }): Promise<{ score: number; metadata?: string }>`
  - `defineToolEval({ name, cases }: { name: string; cases: ToolCase[] }): void` — déclare la suite Evalite.

- [ ] **Étape 1 : Écrire le test unitaire du scorer qui échoue**

Créer `src/server/albert/__tests__/toolCaseScorer.unit.test.ts` :

```ts
import { describe, expect, it } from "vitest";
import { scoreExpectedTools } from "../../../../evals/toolCase";

const turn = (toolNames: string[]) => ({
  toolCalls: toolNames.map((toolName) => ({ toolName })),
  text: "",
  stepCount: toolNames.length,
});

describe("scoreExpectedTools", () => {
  it("note 1 quand aucun outil n'est attendu et qu'aucun n'est appelé", async () => {
    const resultat = await scoreExpectedTools({
      output: turn([]),
      expected: [],
    });

    expect(resultat.score).toBe(1);
  });

  it("note 0 quand aucun outil n'est attendu mais qu'un outil est appelé", async () => {
    const resultat = await scoreExpectedTools({
      output: turn(["get_chantiers"]),
      expected: [],
    });

    expect(resultat.score).toBe(0);
  });

  it("note 1 sur le bon outil quand aucun argument n'est attendu", async () => {
    const resultat = await scoreExpectedTools({
      output: turn(["search_chantiers"]),
      expected: [{ toolName: "search_chantiers" }],
    });

    expect(resultat.score).toBe(1);
  });
});
```

- [ ] **Étape 2 : Lancer le test pour vérifier qu'il échoue**

```bash
pnpm exec vitest run --project server-unit src/server/albert/__tests__/toolCaseScorer.unit.test.ts
```

Attendu : ÉCHEC, `Cannot find module '../../../../evals/toolCase'`.

- [ ] **Étape 3 : Écrire `evals/toolCase.ts`**

```ts
import { evalite } from "evalite";
import { toolCallAccuracy } from "evalite/scorers";
import {
  runAgentTurn,
  type AgentTurn,
  type ObservedToolCall,
} from "./agentTurn";
import { withEvalWorld, type EvalWorld } from "./world";

/**
 * Forme commune aux suites qui se scorent sur les tool calls : niveau 2 (une
 * suite par outil) et niveau 4 (cas limites).
 */
export type ToolCase = {
  question: string;
  /** Ce que le cas cherche à vérifier. Sert de motif lisible dans le tableau. */
  reason: string;
  /** Fixtures propres au cas, posées dans la transaction avant le tour. */
  seed?: (world: EvalWorld) => Promise<void>;
  expected: ObservedToolCall[];
};

/**
 * Deux ajustements sur `toolCallAccuracy` :
 *
 * — Le cas « aucun outil attendu » ne lui donne rien à comparer, on le traite
 *   à part : tout appel est une erreur.
 * — Sans `input` attendu, il classe le match en "nameOnly" (poids 0,5), donc
 *   le bon outil plafonnerait à 50 %. On ne pénalise les arguments que sur les
 *   cas qui expriment une attente dessus.
 */
export async function scoreExpectedTools({
  output,
  expected,
}: {
  output: AgentTurn;
  expected: ObservedToolCall[] | undefined;
}) {
  if (!expected || expected.length === 0) {
    const appeles = output.toolCalls.map((call) => call.toolName);

    return {
      score: appeles.length === 0 ? 1 : 0,
      metadata:
        appeles.length === 0
          ? "aucun outil appelé, conforme"
          : `outils appelés à tort : ${appeles.join(", ")}`,
    };
  }

  const argumentsAttendus = expected.some((call) => call.input !== undefined);

  return toolCallAccuracy({
    actualCalls: output.toolCalls,
    expectedCalls: expected,
    mode: "flexible",
    weights: argumentsAttendus ? undefined : { nameOnly: 1 },
  });
}

/**
 * Déclare une suite Evalite à partir de cas déclaratifs. Chaque fichier de
 * niveau 2 ou 4 se réduit ainsi à ses données.
 */
export function defineToolEval({
  name,
  cases,
}: {
  name: string;
  cases: ToolCase[];
}) {
  evalite<ToolCase, AgentTurn, ObservedToolCall[]>(name, {
    data: () => cases.map((cas) => ({ input: cas, expected: cas.expected })),

    task: (input) =>
      withEvalWorld({
        seed: input.seed,
        run: (world) => runAgentTurn({ question: input.question, world }),
      }),

    // La sélection d'outils n'est pas stable d'un tour à l'autre, même à
    // température 0,2. On rejoue chaque cas pour que la moyenne soit lisible
    // plutôt que trompeuse.
    trialCount: 3,

    scorers: [
      {
        name: "Outils attendus",
        description:
          "toolCallAccuracy en mode flexible : l'ordre importe peu, la sélection oui.",
        scorer: ({ output, expected }) =>
          scoreExpectedTools({ output, expected }),
      },
    ],

    columns: ({ input, output, expected }) => [
      { label: "Cas", value: input.question.slice(0, 45) },
      { label: "Motif", value: input.reason },
      {
        label: "Outils appelés",
        value: output.toolCalls.map((call) => call.toolName).join(" → ") || "—",
      },
      {
        label: "Attendu",
        value: (expected ?? []).map((call) => call.toolName).join(", ") || "—",
      },
      { label: "Ét.", value: String(output.stepCount) },
    ],
  });
}
```

- [ ] **Étape 4 : Lancer le test pour vérifier qu'il passe**

```bash
pnpm exec vitest run --project server-unit src/server/albert/__tests__/toolCaseScorer.unit.test.ts
```

Attendu : `Tests 3 passed (3)`.

- [ ] **Étape 5 : Commit**

```bash
git add evals/toolCase.ts src/server/albert/__tests__/toolCaseScorer.unit.test.ts
git commit -m "feat(ppg): helper de suite d'eval par outil"
```

---

### Tâche 4 : Niveau 1 — détection par mots-clés

Reprend l'eval déterministe du POC dans la nouvelle arborescence, en anglais. Aucun appel réseau, aucune base : c'est la suite qui tourne en quelques millisecondes.

**Fichiers :**
- Créer : `evals/1-keywords/capacities.eval.ts`
- Supprimer : `evals/1-keywords/.gitkeep`

**Interfaces :**
- Consomme : `detecterCapacities`, `type Capacities` de `@/server/albert/detecteurIntention`.
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : Écrire la suite**

Créer `evals/1-keywords/capacities.eval.ts` :

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
 * Aucun LLM, aucune base : même entrée, même sortie. L'intérêt de le passer en
 * eval plutôt qu'en test unitaire est le score partiel — les quatre capacities
 * sont notées séparément, donc une régression qui n'en casse qu'une se lit
 * comme 0,75 et non comme un échec opaque.
 *
 * Référence observée : à compléter au premier run.
 */

type KeywordCase = {
  message: string;
  /** Ce que le cas cherche à vérifier. */
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
    const justes = cles.filter((cle) => output[cle] === expected?.[cle]);
    const manquees = cles.filter((cle) => output[cle] !== expected?.[cle]);

    return {
      score: justes.length / cles.length,
      metadata:
        manquees.length === 0
          ? "les quatre capacities sont correctes"
          : `incorrectes : ${manquees.join(", ")}`,
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

- [ ] **Étape 2 : Supprimer le `.gitkeep`**

```bash
rm evals/1-keywords/.gitkeep
```

- [ ] **Étape 3 : Lancer la suite**

```bash
pnpm eval:rapide
```

Attendu : la suite tourne en moins d'une seconde et affiche un score. Noter la valeur exacte.

- [ ] **Étape 4 : Consigner la référence observée**

Remplacer la ligne `* Référence observée : à compléter au premier run.` de l'en-tête par la mesure réelle, au format :

```
 * Référence observée le 2026-09-10 : 97 % (le cas « vue d'ensemble » sort à 75 %).
```

Si un cas sort bas, le décrire — c'est un constat sur le détecteur, pas un cas à corriger.

- [ ] **Étape 5 : Commit**

```bash
git add evals/1-keywords
git commit -m "feat(ppg): niveau 1 des evals, detection par mots-cles"
```

---

### Tâche 5 : Niveau 2 — outils de situation territoriale

Trois suites : `get_taux_avancement_territoire`, `get_chantiers`, `get_chantiers_signales`. Ce sont les outils qui répondent à « comment va mon territoire ».

**Fichiers :**
- Créer : `evals/2-tools/getTauxAvancementTerritoire.eval.ts`, `evals/2-tools/getChantiers.eval.ts`, `evals/2-tools/getChantiersSignales.eval.ts`

**Interfaces :**
- Consomme : `defineToolEval`, `type ToolCase` de `evals/toolCase.ts` ; `seedChantierEnRetard`, `seedChantierEnDifficulte` de `evals/seeds.ts` ; `NATIONAL_TERRITORY` de `evals/world.ts`.
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : Écrire la suite du taux d'avancement**

Créer `evals/2-tools/getTauxAvancementTerritoire.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `get_taux_avancement_territoire`.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
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
    reason:
      "CAS NÉGATIF : demande de détail sur un chantier, pas de taux territorial",
    expected: [{ toolName: "get_chantier_commentaires" }],
  },
];

defineToolEval({ name: "get_taux_avancement_territoire", cases: CASES });
```

- [ ] **Étape 2 : Écrire la suite des chantiers**

Créer `evals/2-tools/getChantiers.eval.ts`. Les cas s'appuient sur la table « Comprendre les demandes utilisateur » du prompt système, qui fixe le contrat entre expression et `view` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";
import {
  seedChantierEnDifficulte,
  seedChantierEnRetard,
} from "../seeds";
import { NATIONAL_TERRITORY } from "../world";

/**
 * Niveau 2 — `get_chantiers`.
 *
 * Les `view` attendues viennent de la table « Comprendre les demandes
 * utilisateur » du prompt système : « en retard » → en_retard seul, « qui ont
 * besoin d'aide » → en_difficulte seul, « où ça coince » → les deux.
 *
 * Ces cas sèment de quoi peupler les vues : sans écart ni météo, l'outil
 * renvoie vide et l'agent peut légitimement enchaîner d'autres appels.
 *
 * Référence observée : à compléter au premier run.
 */

const seedTerritoireContraste = async () => {
  await seedChantierEnRetard({
    chantierId: "CH-005",
    territoireCode: NATIONAL_TERRITORY,
  });
  await seedChantierEnDifficulte({
    chantierId: "CH-006",
    territoireCode: NATIONAL_TERRITORY,
  });
};

const CASES: ToolCase[] = [
  {
    question: "Quels chantiers sont en retard sur la France entière ?",
    reason: "« en retard » → view en_retard uniquement",
    seed: seedTerritoireContraste,
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
  {
    question:
      "Quels chantiers ont besoin d'un appui sur la France entière ?",
    reason: "« qui ont besoin d'aide » → view en_difficulte uniquement",
    seed: seedTerritoireContraste,
    expected: [{ toolName: "get_chantiers", input: { view: "en_difficulte" } }],
  },
  {
    question: "Sur la France entière, où ça coince ?",
    reason:
      "« où ça coince » → les DEUX views, contrat explicite du prompt système",
    seed: seedTerritoireContraste,
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quel est le taux d'avancement de la France entière ?",
    reason:
      "CAS NÉGATIF : question de taux global, pas de liste de chantiers",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

defineToolEval({ name: "get_chantiers", cases: CASES });
```

- [ ] **Étape 3 : Écrire la suite des chantiers signalés**

Créer `evals/2-tools/getChantiersSignales.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `get_chantiers_signales`.
 *
 * Le prompt système distingue deux régimes : sans précision de catégorie,
 * l'outil est appelé sans `categories` ; avec une ou plusieurs catégories
 * nommées, elles sont passées explicitement.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quels sont les chantiers signalés sur la France entière ?",
    reason: "sans précision de catégorie → appel sans argument categories",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question:
      "Sur la France entière, quels chantiers ont un taux non calculé ?",
    reason: "une seule catégorie nommée → passée en argument",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question:
      "Sur la France entière, montre-moi les signalements de type PVA et météo non renseignée",
    reason: "deux catégories demandées ensemble",
    expected: [{ toolName: "get_chantiers_signales" }],
  },
  {
    question: "Quels chantiers sont en retard sur la France entière ?",
    reason:
      "CAS NÉGATIF : « en retard » relève de get_chantiers, pas des signalements",
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
];

defineToolEval({ name: "get_chantiers_signales", cases: CASES });
```

- [ ] **Étape 4 : Lancer les trois suites**

```bash
pnpm eval 2-tools/getTauxAvancementTerritoire.eval.ts
pnpm eval 2-tools/getChantiers.eval.ts
pnpm eval 2-tools/getChantiersSignales.eval.ts
```

Attendu : chaque suite tourne (4 cas × 3 essais = 12 tours, ~1 min chacune) et affiche un score.

- [ ] **Étape 5 : Consigner les trois références observées**

Dans chaque fichier, remplacer `Référence observée : à compléter au premier run.` par la mesure, au format `Référence observée le AAAA-MM-JJ : XX %`. Décrire tout cas qui sort à 0 — notamment si un cas négatif déclenche quand même l'outil de la suite.

- [ ] **Étape 6 : Commit**

```bash
git add evals/2-tools
git commit -m "feat(ppg): niveau 2, outils de situation territoriale"
```

---

### Tâche 6 : Niveau 2 — outils de détail chantier

Trois suites : `get_indicateurs`, `get_chantier_commentaires`, `get_chantier_objectifs`. Ces outils prennent un identifiant de chantier ; les cas vérifient donc aussi l'argument.

**Fichiers :**
- Créer : `evals/2-tools/getIndicateurs.eval.ts`, `evals/2-tools/getChantierCommentaires.eval.ts`, `evals/2-tools/getChantierObjectifs.eval.ts`

**Interfaces :**
- Consomme : `defineToolEval`, `type ToolCase` de `evals/toolCase.ts`.
- Produit : rien que d'autres tâches consomment.

Les chantiers `CH-001`, `CH-004` et `CH-007` sont ceux que le monde de base dote d'un indicateur, d'un commentaire et d'un objectif — les cas s'appuient dessus, sans seed supplémentaire.

- [ ] **Étape 1 : Écrire la suite des indicateurs**

Créer `evals/2-tools/getIndicateurs.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `get_indicateurs`.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Donne-moi les indicateurs du chantier CH-004 pour la France entière",
    reason: "identifiant et territoire explicites : l'agent a tout",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question: "Quelles sont les valeurs des indicateurs de CH-007 ?",
    reason: "identifiant sans préfixe « chantier », toujours résoluble",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-007" } },
    ],
  },
  {
    question: "Donne-moi les objectifs du chantier CH-004",
    reason:
      "CAS NÉGATIF : objectifs et indicateurs sont deux outils distincts",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
];

defineToolEval({ name: "get_indicateurs", cases: CASES });
```

- [ ] **Étape 2 : Écrire la suite des commentaires**

Créer `evals/2-tools/getChantierCommentaires.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `get_chantier_commentaires`.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quels sont les commentaires les plus récents sur le CH-004 ?",
    reason: "accès aux commentaires par identifiant",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-004" },
      },
    ],
  },
  {
    question:
      "Quelles difficultés sont remontées dans les commentaires du CH-001 ?",
    reason: "formulation métier : « difficultés remontées » = commentaires",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-001" },
      },
    ],
  },
  {
    question: "Donne-moi les indicateurs du chantier CH-001",
    reason:
      "CAS NÉGATIF : les indicateurs relèvent de get_indicateurs",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-001" } },
    ],
  },
];

defineToolEval({ name: "get_chantier_commentaires", cases: CASES });
```

- [ ] **Étape 3 : Écrire la suite des objectifs**

Créer `evals/2-tools/getChantierObjectifs.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `get_chantier_objectifs`.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question: "Donne-moi les objectifs du chantier CH-004",
    reason: "identifiant explicite, l'argument doit être transmis",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question: "Quelle est l'ambition affichée sur le CH-007 ?",
    reason:
      "formulation métier : « notre ambition » est un type d'objectif",
    expected: [
      { toolName: "get_chantier_objectifs", input: { chantier_id: "CH-007" } },
    ],
  },
  {
    question:
      "Quels sont les commentaires les plus récents sur le CH-007 ?",
    reason: "CAS NÉGATIF : commentaires, pas objectifs",
    expected: [
      {
        toolName: "get_chantier_commentaires",
        input: { chantier_id: "CH-007" },
      },
    ],
  },
];

defineToolEval({ name: "get_chantier_objectifs", cases: CASES });
```

- [ ] **Étape 4 : Lancer les trois suites**

```bash
pnpm eval 2-tools/getIndicateurs.eval.ts
pnpm eval 2-tools/getChantierCommentaires.eval.ts
pnpm eval 2-tools/getChantierObjectifs.eval.ts
```

- [ ] **Étape 5 : Consigner les trois références observées**

Même format que la tâche 5.

- [ ] **Étape 6 : Commit**

```bash
git add evals/2-tools
git commit -m "feat(ppg): niveau 2, outils de detail chantier"
```

---

### Tâche 7 : Niveau 2 — outils de recherche

Trois suites : `search_chantiers`, `search_indicateurs`, `search_territoires`. Ces outils existent pour résoudre un libellé en identifiant ; les cas négatifs vérifient surtout qu'ils **ne** sont **pas** appelés quand l'identifiant est déjà fourni — le prompt système l'interdit explicitement.

**Fichiers :**
- Créer : `evals/2-tools/searchChantiers.eval.ts`, `evals/2-tools/searchIndicateurs.eval.ts`, `evals/2-tools/searchTerritoires.eval.ts`

**Interfaces :**
- Consomme : `defineToolEval`, `type ToolCase` de `evals/toolCase.ts`.
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : Écrire la suite de recherche de chantiers**

Créer `evals/2-tools/searchChantiers.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `search_chantiers`.
 *
 * Le monde de base sème vingt chantiers groupés par thème et volontairement
 * proches : trois sur les violences faites aux femmes, trois sur la santé,
 * trois sur le logement, deux sur le handicap. C'est ce qui rend la recherche
 * discriminante — l'outil injecte la liste entière dans le prompt de son
 * sous-agent.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quels sont les chantiers qui traitent des violences sexistes et sexuelles ?",
    reason: "thématique sans identifiant : passe par la recherche sémantique",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Y a-t-il un chantier sur l'accès aux soins ?",
    reason:
      "thématique proche de plusieurs chantiers santé du monde de base",
    expected: [{ toolName: "search_chantiers" }],
  },
  {
    question: "Donne-moi les indicateurs du chantier CH-004",
    reason:
      "CAS NÉGATIF : identifiant déjà fourni, le prompt interdit de rechercher",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-004" } },
    ],
  },
];

defineToolEval({ name: "search_chantiers", cases: CASES });
```

- [ ] **Étape 2 : Écrire la suite de recherche d'indicateurs**

Créer `evals/2-tools/searchIndicateurs.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `search_indicateurs`.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question:
      "Quel indicateur mesure la rénovation énergétique des logements ?",
    reason: "libellé d'indicateur en langage naturel, sans identifiant",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question: "Trouve-moi l'indicateur sur les déserts médicaux",
    reason: "thématique d'indicateur, pas de chantier nommé",
    expected: [{ toolName: "search_indicateurs" }],
  },
  {
    question:
      "Donne-moi les indicateurs du chantier CH-007 pour la France entière",
    reason:
      "CAS NÉGATIF : chantier identifié, on récupère ses indicateurs sans recherche",
    expected: [
      { toolName: "get_indicateurs", input: { chantier_id: "CH-007" } },
    ],
  },
];

defineToolEval({ name: "search_indicateurs", cases: CASES });
```

- [ ] **Étape 3 : Écrire la suite de recherche de territoires**

Créer `evals/2-tools/searchTerritoires.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `search_territoires`.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question: "Quel est le code du département du Finistère ?",
    reason: "nom de territoire à résoudre en code DEPT-XX",
    expected: [{ toolName: "search_territoires" }],
  },
  {
    question:
      "Quel est le taux d'avancement du territoire où se trouve Brest ?",
    reason:
      "territoire désigné indirectement : il faut le résoudre avant d'interroger",
    expected: [
      { toolName: "search_territoires" },
      { toolName: "get_taux_avancement_territoire" },
    ],
  },
  {
    question: "Quel est le taux d'avancement de la France entière ?",
    reason:
      "CAS NÉGATIF : « la France » se résout en NAT-FR sans recherche",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

defineToolEval({ name: "search_territoires", cases: CASES });
```

- [ ] **Étape 4 : Lancer les trois suites**

```bash
pnpm eval 2-tools/searchChantiers.eval.ts
pnpm eval 2-tools/searchIndicateurs.eval.ts
pnpm eval 2-tools/searchTerritoires.eval.ts
```

Ces suites sont les plus lentes du niveau 2 : chaque appel de recherche déclenche un sous-agent LLM. Compter deux à trois minutes par suite.

- [ ] **Étape 5 : Consigner les trois références observées**

Même format que la tâche 5.

- [ ] **Étape 6 : Commit**

```bash
git add evals/2-tools
git commit -m "feat(ppg): niveau 2, outils de recherche"
```

---

### Tâche 8 : Niveau 2 — interaction et livrables

Trois suites : `display_choices`, `create_dashboard`, `export_rapport`. Les deux derniers ne sont exposés que si la capacity correspondante est détectée — leurs suites vérifient donc de bout en bout ce que le niveau 1 vérifie isolément.

**Fichiers :**
- Créer : `evals/2-tools/displayChoices.eval.ts`, `evals/2-tools/createDashboard.eval.ts`, `evals/2-tools/exportRapport.eval.ts`
- Supprimer : `evals/2-tools/.gitkeep`

**Interfaces :**
- Consomme : `defineToolEval`, `type ToolCase` de `evals/toolCase.ts`.
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : Écrire la suite des choix**

Créer `evals/2-tools/displayChoices.eval.ts`. Le prompt système porte des règles **négatives** explicites sur cet outil — elles sont testées ici :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 2 — `display_choices`.
 *
 * Le prompt système interdit cet outil pour une confirmation oui/non, pour
 * proposer de refaire un dashboard, et pour toute question à laquelle
 * l'utilisateur peut répondre en une phrase libre. Ces interdits sont la
 * moitié des cas.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels chantiers sont signalés en alerte ?",
    reason:
      "sous-spécifiée : aucun territoire. L'agent doit proposer un choix, pas deviner",
    expected: [{ toolName: "display_choices" }],
  },
  {
    question: "Fais-moi la synthèse du chantier sur le logement",
    reason:
      "trois chantiers logement dans le monde de base : ambiguïté réelle",
    expected: [{ toolName: "search_chantiers" }, { toolName: "display_choices" }],
  },
  {
    question: "Bonjour, tu peux m'aider ?",
    reason:
      "CAS NÉGATIF : salutation sans intention de données, aucun outil attendu",
    expected: [],
  },
];

defineToolEval({ name: "display_choices", cases: CASES });
```

- [ ] **Étape 2 : Écrire la suite du tableau de bord**

Créer `evals/2-tools/createDashboard.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";
import { seedChantierEnRetard } from "../seeds";
import { NATIONAL_TERRITORY } from "../world";

/**
 * Niveau 2 — `create_dashboard`.
 *
 * L'outil n'est exposé que si `detecterCapacities` repère l'intention
 * dashboard : un échec ici peut venir du détecteur (niveau 1) autant que de
 * l'agent. Le cas négatif distingue les deux — s'il déclenche quand même
 * l'outil, c'est le détecteur qui sur-déclenche.
 *
 * Référence observée : à compléter au premier run.
 */

const seedTerritoire = () =>
  seedChantierEnRetard({
    chantierId: "CH-005",
    territoireCode: NATIONAL_TERRITORY,
  });

const CASES: ToolCase[] = [
  {
    question:
      "Compose un tableau de bord de la France entière avec le taux d'avancement et les chantiers en retard",
    reason: "demande de dashboard explicite, données disponibles",
    seed: seedTerritoire,
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "create_dashboard" },
    ],
  },
  {
    question: "Affiche-moi un cockpit de la France entière",
    reason: "« cockpit » est un synonyme dashboard du détecteur d'intention",
    seed: seedTerritoire,
    expected: [{ toolName: "create_dashboard" }],
  },
  {
    question: "Quel est le taux d'avancement de la France entière ?",
    reason:
      "CAS NÉGATIF : question factuelle, aucune intention de visualisation",
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

defineToolEval({ name: "create_dashboard", cases: CASES });
```

- [ ] **Étape 3 : Écrire la suite de l'export**

Créer `evals/2-tools/exportRapport.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";
import { seedChantierEnRetard } from "../seeds";
import { NATIONAL_TERRITORY } from "../world";

/**
 * Niveau 2 — `export_rapport`.
 *
 * Même dépendance au détecteur d'intention que `create_dashboard`.
 *
 * Référence observée : à compléter au premier run.
 */

const seedTerritoire = () =>
  seedChantierEnRetard({
    chantierId: "CH-005",
    territoireCode: NATIONAL_TERRITORY,
  });

const CASES: ToolCase[] = [
  {
    question:
      "Crée un rapport de synthèse de la France entière incluant le taux d'avancement et les chantiers en retard. Format Markdown",
    reason: "demande d'export explicite, reprise du scénario de l'interface",
    seed: seedTerritoire,
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "export_rapport" },
    ],
  },
  {
    question:
      "Je voudrais télécharger un PDF de la situation de la France entière",
    reason: "« télécharger » et « pdf » sont des mots-clés export",
    seed: seedTerritoire,
    expected: [{ toolName: "export_rapport" }],
  },
  {
    question: "Fais-moi la synthèse de la France entière",
    reason:
      "CAS NÉGATIF : synthèse dans le chat, pas d'export de fichier",
    seed: seedTerritoire,
    expected: [{ toolName: "get_taux_avancement_territoire" }],
  },
];

defineToolEval({ name: "export_rapport", cases: CASES });
```

- [ ] **Étape 4 : Supprimer le `.gitkeep` et lancer les trois suites**

```bash
rm evals/2-tools/.gitkeep
pnpm eval 2-tools/displayChoices.eval.ts
pnpm eval 2-tools/createDashboard.eval.ts
pnpm eval 2-tools/exportRapport.eval.ts
```

- [ ] **Étape 5 : Consigner les trois références observées**

Le POC avait mesuré `display_choices` à 1 essai sur 3. Si le chiffre se confirme, le consigner tel quel : c'est la défaillance prioritaire que la suite existe pour documenter.

- [ ] **Étape 6 : Lancer le niveau 2 complet et consigner la durée**

```bash
pnpm eval 2-tools
```

Noter la durée totale dans le rapport de tâche. L'estimation du spec est d'une dizaine de minutes ; un écart important est une information utile pour la suite.

- [ ] **Étape 7 : Commit**

```bash
git add evals/2-tools
git commit -m "feat(ppg): niveau 2, interaction et livrables"
```

---

### Tâche 9 : Niveau 3 — scénarios envoyés tels quels

Les scénarios de `src/client/components/PageAccueil/scenariosTerritoire.ts` en `mode: "send"` : messages complets, envoyés au clic. Ce sont les parcours que l'utilisateur déclenche réellement.

Ce niveau ajoute un juge sur la réponse. Il exige donc un territoire peuplé — sans taux d'avancement ni chantiers en retard, la réponse est vide et le juge note le vide.

**Fichiers :**
- Créer : `evals/3-scenarios/scenarioCase.ts`, `evals/3-scenarios/sentScenarios.eval.ts`

**Interfaces :**
- Consomme : `runAgentTurn`, `type AgentTurn` de `evals/agentTurn.ts` ; `withEvalWorld`, `EvalWorld`, `NATIONAL_TERRITORY` de `evals/world.ts` ; `createJudgeScorer` de `evals/judge.ts` ; `scoreExpectedTools` de `evals/toolCase.ts` ; les seeds de `evals/seeds.ts`.
- Produit :
  - `type ScenarioCase = { question: string; reason: string; seed?: (world: EvalWorld) => Promise<void>; expected: ObservedToolCall[] }`
  - `defineScenarioEval({ name, cases }: { name: string; cases: ScenarioCase[] }): void`
  - `seedTerritoirePeuple(): Promise<void>` — exporté depuis `scenarioCase.ts`

- [ ] **Étape 1 : Écrire le helper de scénario**

Créer `evals/3-scenarios/scenarioCase.ts` :

```ts
import { evalite } from "evalite";
import {
  runAgentTurn,
  type AgentTurn,
  type ObservedToolCall,
} from "../agentTurn";
import { withEvalWorld, type EvalWorld, NATIONAL_TERRITORY } from "../world";
import { scoreExpectedTools } from "../toolCase";
import { createJudgeScorer } from "../judge";
import {
  seedChantierEnDifficulte,
  seedChantierEnRetard,
  seedTauxAvancement,
} from "../seeds";

/**
 * Niveau 3 — les scénarios réellement proposés dans l'interface.
 *
 * Deux scorers par cas : la sélection d'outils, déterministe, et la rédaction,
 * jugée par un LLM. Le premier dit si l'agent a fait le bon travail, le second
 * s'il l'a rendu exploitable.
 */

export type ScenarioCase = {
  question: string;
  reason: string;
  seed?: (world: EvalWorld) => Promise<void>;
  expected: ObservedToolCall[];
};

/**
 * Un territoire avec de quoi produire une vraie synthèse : un taux
 * d'avancement, un chantier en retard, un chantier en difficulté. Sans ça,
 * les outils renvoient vide et le juge note l'absence de données plutôt que
 * la qualité de la rédaction.
 */
export async function seedTerritoirePeuple() {
  await seedTauxAvancement({
    chantierId: "CH-001",
    territoireCode: NATIONAL_TERRITORY,
    taux: 62,
  });
  await seedChantierEnRetard({
    chantierId: "CH-005",
    territoireCode: NATIONAL_TERRITORY,
  });
  await seedChantierEnDifficulte({
    chantierId: "CH-006",
    territoireCode: NATIONAL_TERRITORY,
  });
}

export function defineScenarioEval({
  name,
  cases,
}: {
  name: string;
  cases: ScenarioCase[];
}) {
  evalite<ScenarioCase, AgentTurn, ObservedToolCall[]>(name, {
    data: () => cases.map((cas) => ({ input: cas, expected: cas.expected })),

    task: (input) =>
      withEvalWorld({
        seed: input.seed,
        run: (world) => runAgentTurn({ question: input.question, world }),
      }),

    // Un juge LLM n'est pas stable non plus : deux passages montrent l'écart
    // sans tripler le coût d'un niveau déjà lent.
    trialCount: 2,

    scorers: [
      {
        name: "Outils attendus",
        description: "Sélection d'outils, scoring déterministe.",
        scorer: ({ output, expected }) =>
          scoreExpectedTools({ output, expected }),
      },
      createJudgeScorer<ScenarioCase>({
        name: "Ancrage factuel",
        criterion:
          "La réponse s'appuie uniquement sur des données chiffrées ou des libellés qui semblent provenir de l'outillage, sans inventer de chiffre, de date ni de nom de chantier.",
      }),
      createJudgeScorer<ScenarioCase>({
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
}
```

- [ ] **Étape 2 : Écrire la suite des scénarios envoyés**

Créer `evals/3-scenarios/sentScenarios.eval.ts`. Les questions sont recopiées de `scenariosTerritoire.ts`, avec le territoire remplacé par « la France entière » puisque c'est le territoire peuplé du monde d'eval :

```ts
import { defineScenarioEval, seedTerritoirePeuple, type ScenarioCase } from "./scenarioCase";

/**
 * Niveau 3 — scénarios `mode: "send"` de l'écran d'accueil.
 *
 * Source : src/client/components/PageAccueil/scenariosTerritoire.ts. Les
 * questions sont recopiées telles quelles, le territoire remplacé par la
 * France entière — le seul que le monde d'eval peuple.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ScenarioCase[] = [
  {
    question:
      "Analyse les chantiers en retard sur la France entière. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.",
    reason: "Chantiers en retard et leurs indicateurs (DITP et coordinateur)",
    seed: seedTerritoirePeuple,
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_indicateurs" },
    ],
  },
  {
    question:
      "Crée un rapport de synthèse du territoire France entière incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown",
    reason: "Rapport complet en Markdown (DITP admin)",
    seed: seedTerritoirePeuple,
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      { toolName: "export_rapport" },
    ],
  },
  {
    question:
      "Compose un tableau de bord pour la France entière. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement.",
    reason: "Tableau de bord du territoire (DITP admin), version abrégée",
    seed: seedTerritoirePeuple,
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
      { toolName: "create_dashboard" },
    ],
  },
];

defineScenarioEval({ name: "Scénarios envoyés", cases: CASES });
```

- [ ] **Étape 3 : Lancer la suite**

```bash
pnpm eval 3-scenarios/sentScenarios.eval.ts
```

Attendu : 3 cas × 2 essais = 6 tours, plus 2 appels de juge par tour. Compter cinq à dix minutes — ce sont les tours les plus longs de toute la suite.

- [ ] **Étape 4 : Vérifier que le juge ne note pas du vide**

Lire les justifications du juge dans la sortie (lignes `[juge:...]`). Si une justification mentionne une absence de données, le seed est insuffisant : compléter `seedTerritoirePeuple` plutôt que d'accepter la note.

- [ ] **Étape 5 : Consigner la référence observée**

Consigner les trois scores séparément — outils, ancrage factuel, utilité opérationnelle — au format `Référence observée le AAAA-MM-JJ : outils XX %, ancrage XX %, utilité XX %`.

- [ ] **Étape 6 : Commit**

```bash
git add evals/3-scenarios
git commit -m "feat(ppg): niveau 3, scenarios envoyes depuis l'interface"
```

---

### Tâche 10 : Niveau 3 — scénarios à compléter

Les scénarios en `mode: "fill"` sont des templates à trous que l'utilisateur complète avant d'envoyer. Le cas d'eval joue le rôle de l'utilisateur : il remplit le trou avec une valeur du monde semé.

**Fichiers :**
- Créer : `evals/3-scenarios/filledScenarios.eval.ts`
- Supprimer : `evals/3-scenarios/.gitkeep`

**Interfaces :**
- Consomme : `defineScenarioEval`, `seedTerritoirePeuple`, `type ScenarioCase` de `evals/3-scenarios/scenarioCase.ts`.
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : Écrire la suite**

Créer `evals/3-scenarios/filledScenarios.eval.ts` :

```ts
import { defineScenarioEval, seedTerritoirePeuple, type ScenarioCase } from "./scenarioCase";

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

const CASES: ScenarioCase[] = [
  {
    question: "Fais moi la synthèse du territoire France entière",
    reason: "Synthèse d'un territoire — trou : le territoire",
    seed: seedTerritoirePeuple,
    expected: [
      { toolName: "get_taux_avancement_territoire" },
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question:
      "Fais moi la synthèse du chantier CH-001 sur le territoire France entière\nComment se situe ce chantier par rapport aux autres territoires ?\nQuelles sont les principales difficultés remontées dans les commentaires ?",
    reason:
      "Synthèse d'un chantier sur un territoire — trous : CH-XXX et NOM_TERRITOIRE. Question en trois volets",
    seed: seedTerritoirePeuple,
    expected: [
      { toolName: "get_chantiers", input: { chantier_ids: ["CH-001"] } },
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-001" } },
    ],
  },
  {
    question:
      "Synthétise les commentaires des chantiers suivants CH-001, CH-004, notamment les principales actions identifiées",
    reason:
      "Synthèse des commentaires de plusieurs chantiers (coordinateur) — trous : les identifiants",
    seed: seedTerritoirePeuple,
    expected: [
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-001" } },
      { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-004" } },
    ],
  },
  {
    question:
      "Fais moi la synthèse des difficultés du territoire France entière",
    reason:
      "Synthèse des difficultés (coordinateur) — trou : le territoire",
    seed: seedTerritoirePeuple,
    expected: [
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
];

defineScenarioEval({ name: "Scénarios complétés", cases: CASES });
```

- [ ] **Étape 2 : Supprimer le `.gitkeep` et lancer la suite**

```bash
rm evals/3-scenarios/.gitkeep
pnpm eval 3-scenarios/filledScenarios.eval.ts
```

- [ ] **Étape 3 : Vérifier les arguments attendus sur `get_chantiers`**

Le premier cas de synthèse par chantier attend `get_chantiers` avec `chantier_ids`. Vérifier dans `src/server/albert/tools/getChantiers.ts` que le nom du paramètre est bien `chantier_ids` ; s'il diffère, corriger le cas — pas l'outil.

- [ ] **Étape 4 : Consigner la référence observée**

Même format qu'à la tâche 9, avec les trois scores.

- [ ] **Étape 5 : Commit**

```bash
git add evals/3-scenarios
git commit -m "feat(ppg): niveau 3, scenarios a completer"
```

---

### Tâche 11 : Niveau 4 — abréviations et formulations ambiguës

Première moitié des cas limites. La source est la table « Comprendre les demandes utilisateur » du prompt système : chacune de ses lignes est un contrat explicite entre une expression de terrain et un appel d'outil.

**Fichiers :**
- Créer : `evals/4-edge-cases/vocabulary.eval.ts`

**Interfaces :**
- Consomme : `defineToolEval`, `type ToolCase` de `evals/toolCase.ts` ; les seeds de `evals/seeds.ts` ; `NATIONAL_TERRITORY` de `evals/world.ts`.
- Produit : rien que d'autres tâches consomment.

- [ ] **Étape 1 : Écrire la suite**

Créer `evals/4-edge-cases/vocabulary.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";
import { seedChantierEnDifficulte, seedChantierEnRetard } from "../seeds";
import { NATIONAL_TERRITORY } from "../world";

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

const seedTerritoireContraste = async () => {
  await seedChantierEnRetard({
    chantierId: "CH-005",
    territoireCode: NATIONAL_TERRITORY,
  });
  await seedChantierEnDifficulte({
    chantierId: "CH-006",
    territoireCode: NATIONAL_TERRITORY,
  });
};

const CASES: ToolCase[] = [
  {
    question: "Sur la France entière, quels sont les points noirs ?",
    reason:
      "« les points noirs » → les DEUX views, contrat de la table du prompt",
    seed: seedTerritoireContraste,
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quels chantiers vont mal sur la France entière ?",
    reason: "« chantiers qui vont mal » → les deux views",
    seed: seedTerritoireContraste,
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Quels chantiers sont compromis sur la France entière ?",
    reason:
      "AMBIGU assumé : météo ORAGE ou chantiers à risque. Le prompt demande de couvrir les deux interprétations",
    seed: seedTerritoireContraste,
    expected: [
      { toolName: "get_chantiers", input: { view: "en_retard" } },
      { toolName: "get_chantiers", input: { view: "en_difficulte" } },
    ],
  },
  {
    question: "Combien de PPG sont en retard sur la France entière ?",
    reason: "« PPG » est un synonyme de chantier",
    seed: seedTerritoireContraste,
    expected: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  },
  {
    question: "Quel est le niveau de confiance sur la France entière ?",
    reason: "« niveau de confiance » est un synonyme de météo",
    seed: seedTerritoireContraste,
    expected: [{ toolName: "get_chantiers" }],
  },
  {
    question: "Quels sont les chantiers sur les VSS ?",
    reason:
      "acronyme métier non officiel : passe par la recherche sémantique",
    expected: [{ toolName: "search_chantiers" }],
  },
];

defineToolEval({ name: "Vocabulaire et ambiguïtés", cases: CASES });
```

- [ ] **Étape 2 : Lancer la suite**

```bash
pnpm eval 4-edge-cases/vocabulary.eval.ts
```

- [ ] **Étape 3 : Consigner la référence observée**

Détailler cas par cas : sur ce niveau, la moyenne masque l'essentiel. Un contrat de la table du prompt qui ne tient pas est une information directement actionnable sur le prompt.

- [ ] **Étape 4 : Commit**

```bash
git add evals/4-edge-cases
git commit -m "feat(ppg): niveau 4, vocabulaire et ambiguites"
```

---

### Tâche 12 : Niveau 4 — sous-spécification et hors-sujet

Seconde moitié des cas limites, et la défaillance prioritaire du spec : Albert devine au lieu de demander. Le POC l'avait mesurée à un essai sur trois.

**Fichiers :**
- Créer : `evals/4-edge-cases/underspecified.eval.ts`
- Supprimer : `evals/4-edge-cases/.gitkeep`
- Modifier : `docs/superpowers/specs/2026-09-10-albert-strategie-evaluation-design.md`

**Interfaces :**
- Consomme : `defineToolEval`, `type ToolCase` de `evals/toolCase.ts`.
- Produit : rien.

- [ ] **Étape 1 : Écrire la suite**

Créer `evals/4-edge-cases/underspecified.eval.ts` :

```ts
import { defineToolEval, type ToolCase } from "../toolCase";

/**
 * Niveau 4 — demandes sous-spécifiées et hors-sujet.
 *
 * La défaillance que cette suite documente : sur une demande incomplète,
 * Albert choisit à la place de l'utilisateur au lieu de proposer un choix.
 * Le POC l'avait mesurée à un essai sur trois.
 *
 * Le prompt système interdit par ailleurs `display_choices` quand une phrase
 * libre suffirait — les deux derniers cas testent cet interdit.
 *
 * Référence observée : à compléter au premier run.
 */

const CASES: ToolCase[] = [
  {
    question: "Quels chantiers sont en retard ?",
    reason:
      "aucun territoire : l'agent ne doit pas choisir NAT-FR à la place de l'utilisateur",
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
    reason:
      "CAS NÉGATIF : salutation sans intention de données, aucun outil attendu",
    expected: [],
  },
  {
    question: "Qui est le président de la République ?",
    reason:
      "CAS NÉGATIF : hors périmètre. Albert répond sans appeler d'outil de données",
    expected: [],
  },
  {
    question: "Merci, c'est parfait",
    reason:
      "CAS NÉGATIF : clôture de conversation, ni outil ni display_choices",
    expected: [],
  },
];

defineToolEval({ name: "Sous-spécification et hors-sujet", cases: CASES });
```

- [ ] **Étape 2 : Supprimer le `.gitkeep` et lancer la suite**

```bash
rm evals/4-edge-cases/.gitkeep
pnpm eval 4-edge-cases/underspecified.eval.ts
```

- [ ] **Étape 3 : Consigner la référence observée**

Consigner le score du premier cas séparément : c'est la mesure de la défaillance prioritaire, celle qu'on suivra dans le temps.

- [ ] **Étape 4 : Lancer la suite complète et consigner la durée totale**

```bash
pnpm eval
```

Attendu : les quatre niveaux s'enchaînent, `fileParallelism: false` les sérialise. Noter la durée totale et le score global.

- [ ] **Étape 5 : Vérifier que la base de dev est intacte**

```bash
docker exec pilote_postgres psql -U postgres -d postgres -tAc "select count(*) from chantier_identite;"
```

Attendu : le compte d'origine, inchangé. Le garde-fou d'`evals/env.ts` doit avoir empêché tout accès à cette base ; ce contrôle vérifie qu'il tient sur une suite complète.

- [ ] **Étape 6 : Compléter le spec avec les mesures**

Ajouter une section `## Mesures de référence` en fin de spec, avec la date, le modèle, la durée totale et le score par niveau. Le spec dit ce qu'on évalue ; cette section dit où on en était le jour de la mise en place.

- [ ] **Étape 7 : Commit**

```bash
git add evals/4-edge-cases docs/superpowers/specs/2026-09-10-albert-strategie-evaluation-design.md
git commit -m "feat(ppg): niveau 4, sous-specification et hors-sujet"
```

---

## Auto-revue du plan

**Couverture du spec.** Les quatre niveaux ont chacun leurs tâches : niveau 1 en tâche 4, niveau 2 en tâches 5 à 8 (douze suites, une par outil, chacune avec au moins un cas négatif), niveau 3 en tâches 9 et 10 (`send` et `fill` traités séparément, calibration du juge déplacée en tâche 1), niveau 4 en tâches 11 et 12. Le monde à deux étages est en tâche 2, le helper partagé en tâche 3. Le renommage en anglais est appliqué à tout fichier créé ou réécrit. Le hors-périmètre du spec — CI, sous-agents isolés, suite de factualité dédiée — n'a volontairement aucune tâche.

**Points laissés ouverts, à trancher à l'exécution.** Deux cas reposent sur des noms d'arguments que le plan n'a pas vérifiés dans le code : `chantier_ids` pour `get_chantiers` (tâche 10, étape 3, avec la vérification explicite) et les valeurs de `categories` pour `get_chantiers_signales` (tâche 5, où les cas se contentent volontairement du nom d'outil sans argument). C'est délibéré : mieux vaut un cas qui n'exprime pas d'attente sur les arguments qu'un cas qui en exprime une fausse.

**Cohérence des types.** `AgentTurn` expose `toolCalls`, `text`, `stepCount` — le juge consomme `text`, le scorer d'outils `toolCalls`, les colonnes `stepCount`. `withEvalWorld` change de signature en tâche 2 et n'est consommé qu'ensuite, par `toolCase.ts` (tâche 3) et `scenarioCase.ts` (tâche 9). `createJudgeScorer` est renommé en tâche 1 et consommé en tâche 9.
