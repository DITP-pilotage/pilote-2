# Evals de niveau 3 — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Jouer les treize scénarios de l'écran d'accueil de bout en bout et noter chaque réponse sur une grille de critères dérivée du prompt système, mécaniques ou jugés par un LLM, avec une calibration du juge.

**Architecture:** Une factory `scenarioEval` (comme `toolSelectionEval` au niveau 2) déclare une suite par scénario. Chaque tour sème un monde territorial, lit une fiche de vérité en appelant les outils de production, joue l'agent avec le profil et le contexte de l'accueil, puis rend un tour enrichi. Les scorers sont les critères d'une grille : les mécaniques calculent, les jugés lisent un verdict unique par tour, mémorisé.

**Tech Stack:** Evalite 1.0.0-beta.16, ai v7, Vitest 5, Prisma 7, API Albert (juge `deepseek-v4-flash`).

**Spec:** `docs/superpowers/specs/2026-09-30-albert-evals-niveau-3-design.md`

## Global Constraints

- Toutes les commandes se lancent depuis `apps/pilote-ppg`.
- Exports et imports nommés uniquement, jamais de `export default`.
- Fonctions à plusieurs paramètres : un objet de paramètres nommés.
- Identifiants du framework en anglais (`scenarioEval`, `GroundTruth`, `mechanical`…), données métier et libellés en français.
- Pas de variable d'un ou deux caractères.
- Tests : `expect(result).toEqual(...)` sur la structure entière plutôt que `toHaveLength` + index ; commentaires limités à Given / When / Then.
- Données de test : identifiants lisibles et valeurs en dur, pas d'aléatoire ; l'isolation vient de la transaction annulée.
- Noms de suites : `3.0 · Calibration du juge · <famille>`, `3.1 · Synthèse · <libellé de l'interface>`, `3.2 · Comparaison · <libellé>`.
- `trialCount: 3` partout.
- Colonne « Réponse » : 500 premiers caractères.
- Juge : modèle `deepseek-v4-flash`, jamais un alias `openweight-*` ni `gpt-oss-120b`.
- Tous les appels LLM des evals (agent, sous-agents, juge) passent par le même limiteur de débit.
- On ne modifie pas la production pour faire monter un score. Seule exception prévue : l'extraction de `construireAgentContextTerritoire` (tâche 1), sans changement de comportement.
- Commits : message en français, suffixe `(PIL-1814)`, terminé par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Un tour sans l'outil de livrable** (pas de `create_dashboard`, pas d'`export_rapport`) : la matière doit le dire explicitement au juge, et les critères du livrable doivent tomber à 0, pas être notés sur le texte du chat. Testé dans la tâche 7 (`extractMatter`).
2. **Un verdict de juge incomplet** (critère absent de la réponse structurée) : le critère est non conforme avec la preuve « absent du verdict », jamais conforme par défaut. Testé dans la tâche 6 (`toVerdict`).
3. **Titres du gabarit au mauvais niveau** (`###` au lieu de `##`, ou casse et accents différents) : les critères de sections passent. Testé dans la tâche 5.
4. **Codes officiels légitimes** (`CH-005`, `REG-53`, `DEPT-2A`) : jamais signalés comme mal formés, alors que `CH-5`, `CH005`, `REG53` le sont. Testé dans la tâche 5.
5. **Données masquées reçues par l'agent** : le critère « Restriction signalée » ne s'applique que si un résultat d'outil du tour porte un territoire hors périmètre. Testé dans la tâche 7 (`maskedTerritories`).

---

## Structure des fichiers

```
src/client/components/PageAccueil/
  agentContextTerritoire.ts               (créé) contexte agent de l'accueil, partagé avec les evals
  agentContextTerritoire.unit.test.ts     (créé)
  BoutonSyntheseTerritoire.tsx            (modifié) l'utilise

evals/
  evalModel.ts                            (créé) modèle Albert bridé et tracé, partagé agent + juge
  setup.ts                                (modifié) enregistre le wrapper d'evalModel
  world.ts                                (modifié) deux profils
  seeds.ts                                (modifié) retire seedChantierWithTaux, orphelin
  judge.ts                                (supprimé) juge du spike
  3-scenarios/
    sentScenarios.eval.ts                 (supprimé)
    judgeCalibration.eval.ts              (supprimé)
    territoires.ts                        références des territoires peuplés
    seedTerritoire.ts                     sème un territoire à un jalon
    mondeTerritorial.ts                   le monde standard des scénarios
    mondeTerritorial.integration.test.ts
    dataTools.ts                          outils de données de production, appelables hors agent
    groundTruth.ts                        fiche de vérité
    groundTruth.integration.test.ts
    evidence.ts                           types Evidence, extraction de la matière et des territoires masqués
    evidence.unit.test.ts
    mechanicalChecks.ts                   fonctions de vérification des critères mécaniques
    mechanicalChecks.unit.test.ts
    grid.ts                               Criterion, Grid, mechanical(), judged(), socle transverse
    grids.ts                              une grille par famille
    judge.ts                              prompt et lecture du verdict, purs
    judge.unit.test.ts
    askJudge.ts                           l'appel au modèle juge
    scenarioEval.ts                       la factory
    3.0-calibration/
      references.ts                       références et mutants
      references.unit.test.ts             critères mécaniques sur les références
      calibration.eval.ts
    3.1-synthese/                         huit suites
    3.2-comparaison/                      cinq suites
vitest.projects/vitest.config.server-integration.ts  (modifié) inclut evals/**/*.integration.test.ts
```

---

### Task 1 : Contexte agent partagé et retrait du niveau 3 du spike

**Files:**
- Create: `src/client/components/PageAccueil/agentContextTerritoire.ts`
- Test: `src/client/components/PageAccueil/agentContextTerritoire.unit.test.ts`
- Modify: `src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx:22-33`
- Delete: `evals/judge.ts`, `evals/3-scenarios/sentScenarios.eval.ts`, `evals/3-scenarios/judgeCalibration.eval.ts`
- Modify: `evals/seeds.ts` (retire `seedChantierWithTaux`)

**Interfaces:**
- Produces: `construireAgentContextTerritoire({ territoireCode, jalon }): AlbertAgentContext` où `AlbertAgentContext = { territoireCode: string; jalon: number; instructions: string }` (type existant de `createAlbertConversation.ts`).

- [ ] **Step 1 : Écrire le test**

```ts
// src/client/components/PageAccueil/agentContextTerritoire.unit.test.ts
import { construireAgentContextTerritoire } from "@/components/PageAccueil/agentContextTerritoire";

describe("construireAgentContextTerritoire", () => {
  test("désigne le territoire courant par son nom affiché et son code", () => {
    // When
    const result = construireAgentContextTerritoire({
      territoireCode: "DEPT-35",
      jalon: 2025,
    });

    // Then
    expect(result).toEqual({
      territoireCode: "DEPT-35",
      jalon: 2025,
      instructions:
        "Le territoire courant de l'utilisateur est 35 - Ille-et-Vilaine (code : DEPT-35). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.",
    });
  });
});
```

- [ ] **Step 2 : Lancer le test, il échoue**

Run: `pnpm exec vitest run --project client agentContextTerritoire`
Expected: FAIL, module introuvable.

- [ ] **Step 3 : Implémenter**

Le module lit le JSON des territoires directement, et non `récupérerDétailsSurUnTerritoire` : `constants/territoires.ts` importe un composant React (`Picker`), que les evals n'ont pas à charger.

```ts
// src/client/components/PageAccueil/agentContextTerritoire.ts
import { territoires } from "@/client/constants/territoires.json";
import type { AlbertAgentContext } from "@/components/_commons/ChatUI/createAlbertConversation";

/**
 * Le contexte que l'écran d'accueil transmet à l'Assistant IA. Les evals de
 * niveau 3 l'importent : un écart de formulation entre l'interface et les
 * evals rendrait les scores sans rapport avec ce que vit l'utilisateur.
 */
export function construireAgentContextTerritoire({
  territoireCode,
  jalon,
}: {
  territoireCode: string;
  jalon: number;
}): AlbertAgentContext {
  const territoire = territoires.find(
    (candidat) => candidat.code === territoireCode,
  );

  if (!territoire) {
    throw new Error(`Territoire inconnu : ${territoireCode}`);
  }

  return {
    jalon,
    territoireCode,
    instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
  };
}
```

Dans `BoutonSyntheseTerritoire.tsx`, remplacer l'objet `agentContext` littéral par l'appel, et retirer l'import devenu inutile de `récupérerDétailsSurUnTerritoire` et la variable `territoire` :

```tsx
import { construireAgentContextTerritoire } from "@/components/PageAccueil/agentContextTerritoire";
// ...
      onClick={() =>
        open({
          scenarios,
          agentContext: construireAgentContextTerritoire({
            territoireCode,
            jalon,
          }),
        })
      }
```

- [ ] **Step 4 : Lancer le test, il passe**

Run: `pnpm exec vitest run --project client agentContextTerritoire`
Expected: PASS.

- [ ] **Step 5 : Retirer le niveau 3 du spike**

```bash
git rm evals/judge.ts evals/3-scenarios/sentScenarios.eval.ts evals/3-scenarios/judgeCalibration.eval.ts
grep -rn "seedChantierWithTaux\|from \"../judge\"\|from \"./judge\"" evals src
```

Expected : seule la définition de `seedChantierWithTaux` dans `evals/seeds.ts` ressort. Supprimer cette fonction (lignes `export async function seedChantierWithTaux` jusqu'à sa accolade fermante).

- [ ] **Step 6 : Vérifier le typage**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7 : Commit**

```bash
git add -A src/client/components/PageAccueil evals
git commit -m "refactor(ppg): partage le contexte agent de l'accueil et retire le niveau 3 du spike (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 2 : Modèle d'eval partagé et deux profils dans le monde

**Files:**
- Create: `evals/evalModel.ts`
- Modify: `evals/setup.ts`
- Modify: `evals/world.ts`
- Modify: `vitest.projects/vitest.config.server-integration.ts:9`
- Create: `evals/3-scenarios/territoires.ts`
- Test: `evals/world.integration.test.ts`

**Interfaces:**
- Produces:
  - `createEvalModel(modelId: string): LanguageModelV4` et `wrapEvalModel(model: LanguageModelV4): LanguageModelV4` (même limiteur que l'agent).
  - `type EvalProfile = "ditp" | "coordinateur"`, `type EvalUser = { userId: string; habilitations: Habilitations }`, `EvalWorld.users: Record<EvalProfile, EvalUser>` ; `userId` et `habilitations` restent au premier niveau (DITP) pour le niveau 2.
  - `PERIMETRE_COORDINATEUR: string[]`.
  - `TERRITOIRES` : `{ bretagne, cotesDArmor, finistere, illeEtVilaine, morbihan, paysDeLaLoire, auvergneRhoneAlpes, vaucluse }`, chacun un `TerritoireRef`.

- [ ] **Step 1 : Inclure les tests d'intégration des evals**

Dans `vitest.projects/vitest.config.server-integration.ts`, remplacer la ligne `include` :

```ts
    // Les helpers d'eval qui sèment la base sont testés à côté, comme leurs
    // tests unitaires dans le projet server-unit.
    include: [
      "src/server/**/*.integration.test.{ts,tsx}",
      "evals/**/*.integration.test.ts",
    ],
```

- [ ] **Step 2 : Écrire le test du monde**

```ts
// evals/world.integration.test.ts
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { PERIMETRE_COORDINATEUR, seedEvalWorld } from "./world";

describe("seedEvalWorld", () => {
  it(
    "restreint la lecture du coordinateur à la Bretagne et ses départements",
    createIntegrationTest(async () => {
      // When
      const world = await seedEvalWorld();

      // Then
      expect(world.users.coordinateur.habilitations.lecture.territoires).toEqual(
        PERIMETRE_COORDINATEUR,
      );
      expect(world.users.coordinateur.habilitations.lecture.chantiers).toEqual(
        world.chantiers.map((chantier) => chantier.id),
      );
    }),
  );

  it(
    "garde le périmètre complet pour le profil DITP, au premier niveau comme dans users",
    createIntegrationTest(async () => {
      // When
      const world = await seedEvalWorld();

      // Then
      expect(world.users.ditp).toEqual({
        userId: world.userId,
        habilitations: world.habilitations,
      });
      expect(world.habilitations.lecture.territoires).toContain("REG-52");
    }),
  );
});
```

- [ ] **Step 3 : Lancer le test, il échoue**

Run: `pnpm exec vitest run --project server-integration evals/world`
Expected: FAIL, `users` n'existe pas.

- [ ] **Step 4 : Implémenter les profils**

Dans `evals/world.ts`, remplacer le type `EvalWorld` et la fin de `seedEvalWorld` :

```ts
export type EvalProfile = "ditp" | "coordinateur";

export type EvalUser = {
  userId: string;
  habilitations: Habilitations;
};

export type EvalWorld = {
  /** Profil DITP, gardé au premier niveau pour les suites de niveau 2. */
  userId: string;
  habilitations: Habilitations;
  chantiers: { id: string; nom: string }[];
  users: Record<EvalProfile, EvalUser>;
};

/**
 * Le coordinateur territorial de l'écran d'accueil : lecture sur la Bretagne
 * et ses départements. Le prompt système qu'il reçoit ne liste que ces codes,
 * et les outils masquent le qualitatif des autres territoires.
 */
export const PERIMETRE_COORDINATEUR = [
  "REG-53",
  "DEPT-22",
  "DEPT-29",
  "DEPT-35",
  "DEPT-56",
];

function habilitationsSur({
  chantiers,
  territoires,
}: {
  chantiers: string[];
  territoires: string[];
}): Habilitations {
  const perimetre = { chantiers, territoires, périmètres: [] };

  return {
    lecture: perimetre,
    saisieCommentaire: perimetre,
    saisieIndicateur: perimetre,
    responsabilite: perimetre,
    gestionUtilisateur: perimetre,
  };
}
```

et, dans `seedEvalWorld`, à la place du bloc qui construit `fullPerimetre` et du `return` :

```ts
  const chantiersAccessibles = CHANTIERS.map((chantier) => chantier.id);

  // Les territoires ne sont pas semés : le référentiel est chargé dans la base
  // de test par `prisma db seed` (`pnpm test:database:init`).
  const territoires = await getPrisma().territoire.findMany();

  const ditp: EvalUser = {
    userId: user.id,
    habilitations: habilitationsSur({
      chantiers: chantiersAccessibles,
      territoires: territoires.map((territoire) => territoire.code),
    }),
  };

  const coordinateurUser = await fixtures.utilisateur({
    profilCode: "COORDINATEUR_REGION",
  });

  const coordinateur: EvalUser = {
    userId: coordinateurUser.id,
    habilitations: habilitationsSur({
      chantiers: chantiersAccessibles,
      territoires: PERIMETRE_COORDINATEUR,
    }),
  };

  return {
    userId: ditp.userId,
    habilitations: ditp.habilitations,
    chantiers: CHANTIERS,
    users: { ditp, coordinateur },
  };
```

Garder le commentaire existant sur `llm_calls.utilisateur_id` au-dessus de `seedEvalWorld`.

- [ ] **Step 5 : Lancer le test, il passe**

Run: `pnpm exec vitest run --project server-integration evals/world`
Expected: PASS (2 tests).

- [ ] **Step 6 : Partager le modèle bridé entre l'agent et le juge**

Le juge du spike appelait `Albert.createProvider()` directement : ses appels échappaient au limiteur. Deux limiteurs séparés doubleraient le débit vers l'API.

```ts
// evals/evalModel.ts
import type { LanguageModelV4 } from "@ai-sdk/provider";
import { Albert } from "@/server/albert/Albert";
import { traceModel } from "./traceModel";
import { rateLimitModel } from "./rateLimitModel";

/**
 * Débit maximal vers l'API Albert. Réglable dans `.env.evals.local` quand
 * l'API renvoie encore des « Too Many Requests », ou pour accélérer un run
 * quand elle est peu chargée.
 */
const REQUETES_PAR_MINUTE = Number(process.env.EVAL_REQUETES_PAR_MINUTE ?? 15);

const limiterLeDebit = rateLimitModel({
  requetesParMinute: REQUETES_PAR_MINUTE,
});

/**
 * Tout appel LLM d'une eval passe par ici : l'agent et ses sous-agents via
 * `Albert.registerModelWrapper`, le juge via `createEvalModel`. Un seul
 * limiteur, donc un seul budget de requêtes. Le limiteur enveloppe la trace,
 * pour que l'attente ne compte pas dans la durée affichée de l'appel.
 */
export function wrapEvalModel(model: LanguageModelV4): LanguageModelV4 {
  return limiterLeDebit(traceModel(model));
}

export function createEvalModel(modelId: string): LanguageModelV4 {
  return wrapEvalModel(Albert.createProvider().chat(modelId));
}
```

Remplacer le contenu de `evals/setup.ts` après les deux premiers imports :

```ts
// L'ordre de ces deux imports est significatif : `env` doit s'executer avant
// `integrationTestSetup`, qui importe le client Prisma — lequel lit
// `DATABASE_URL` des son import.
import "./env";
import "@/server/infrastructure/test/integrationTestSetup";
import { Albert } from "@/server/albert/Albert";
import { wrapEvalModel } from "./evalModel";

// Chaque appel LLM fait pendant une `task` remonte en trace dans l'UI : les
// etapes de l'agent, et celles des sous-agents de recherche, qui passent eux
// aussi par Albert.
Albert.registerModelWrapper(wrapEvalModel);
```

- [ ] **Step 7 : Référencer les territoires peuplés**

Les `zone_id` et `code_insee` sont relevés dans la base de test (table `territoire`).

```ts
// evals/3-scenarios/territoires.ts
import type { TerritoireRef } from "../seeds";
import { BRETAGNE } from "../world";

/**
 * Les territoires que les scénarios peuplent. Au-delà de la Bretagne :
 * ses départements pour les comparaisons région / départements, les Pays de
 * la Loire comme région de comparaison hors du périmètre du coordinateur, et
 * le couple REG-84 / DEPT-84 pour le piège du « 84 » (tout code de région est
 * aussi un numéro de département).
 */
export const TERRITOIRES = {
  bretagne: BRETAGNE,
  cotesDArmor: {
    territoire_code: "DEPT-22",
    code_insee: "22",
    maille: "DEPT",
    zone_id: "D22",
  },
  finistere: {
    territoire_code: "DEPT-29",
    code_insee: "29",
    maille: "DEPT",
    zone_id: "D29",
  },
  illeEtVilaine: {
    territoire_code: "DEPT-35",
    code_insee: "35",
    maille: "DEPT",
    zone_id: "D35",
  },
  morbihan: {
    territoire_code: "DEPT-56",
    code_insee: "56",
    maille: "DEPT",
    zone_id: "D56",
  },
  paysDeLaLoire: {
    territoire_code: "REG-52",
    code_insee: "52",
    maille: "REG",
    zone_id: "R52",
  },
  auvergneRhoneAlpes: {
    territoire_code: "REG-84",
    code_insee: "84",
    maille: "REG",
    zone_id: "R84",
  },
  vaucluse: {
    territoire_code: "DEPT-84",
    code_insee: "84",
    maille: "DEPT",
    zone_id: "D84",
  },
} satisfies Record<string, TerritoireRef>;

export const JALON_COURANT = 2025;
```

- [ ] **Step 8 : Vérifier typage et niveau 2**

Run: `pnpm exec tsc --noEmit && pnpm exec vitest run --project server-unit evals`
Expected: aucune erreur de typage ; tests unitaires des evals verts.

- [ ] **Step 9 : Commit**

```bash
git add evals vitest.projects/vitest.config.server-integration.ts
git commit -m "feat(ppg): un profil coordinateur dans le monde d'eval, et un limiteur partagé avec le juge (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 3 : Semer le monde territorial

**Files:**
- Create: `evals/3-scenarios/seedTerritoire.ts`
- Create: `evals/3-scenarios/dataTools.ts`
- Create: `evals/3-scenarios/mondeTerritorial.ts`
- Test: `evals/3-scenarios/mondeTerritorial.integration.test.ts`

**Interfaces:**
- Consumes: `TERRITOIRES`, `JALON_COURANT` (tâche 2), `fixtures`, `indicateurDuChantier` (`evals/world.ts`), `EvalUser` (tâche 2).
- Produces:
  - `seedTerritoire({ territoire, jalon, chantiers, authorId }): Promise<void>` avec `chantiers: SeededChantier[]`.
  - `seedJalon({ territoire, jalon, chantiers }): Promise<void>` pour un jalon supplémentaire sur des chantiers déjà semés.
  - `seedMondeTerritorial({ authorId }): Promise<void>`.
  - `createDataTools({ user }): DataTools` et `executeTool<TOutput>({ tool, input }): Promise<TOutput>`.

- [ ] **Step 1 : Écrire le helper d'exécution des outils**

La fiche de vérité et les tests lisent les données par les outils de production, câblés comme dans `AssistantIA.construireTools`.

```ts
// evals/3-scenarios/dataTools.ts
import type { Tool } from "ai";
import { getContainer } from "@/server/dependances";
import type { EvalUser } from "../world";

/**
 * Les outils de données de l'agent, avec les habilitations d'un profil, hors
 * de tout tour d'agent. Même câblage que `AssistantIA.construireTools` : une
 * fiche de vérité lue autrement ne vérifierait pas ce que l'agent reçoit.
 */
export function createDataTools({ user }: { user: EvalUser }) {
  const container = getContainer("albert");
  const territoiresAccessibles = user.habilitations.lecture.territoires;
  const chantiersAccessibles = user.habilitations.lecture.chantiers;

  return {
    getTauxAvancementTerritoire: container.resolve(
      "createGetTauxAvancementTerritoireTool",
    )({ habilitations: user.habilitations }),
    getChantiers: container.resolve("createGetChantiersTool")({
      territoiresAccessibles,
      chantiersAccessibles,
    }),
    getIndicateurs: container.resolve("createGetChantierIndicateursTool")(),
    getChantierCommentaires: container.resolve(
      "createGetChantierCommentairesTool",
    )({ territoiresAccessibles }),
  };
}

export type DataTools = ReturnType<typeof createDataTools>;

export async function executeTool<TOutput>({
  tool,
  input,
}: {
  tool: Tool;
  input: unknown;
}): Promise<TOutput> {
  if (!tool.execute) {
    throw new Error("Outil sans execute");
  }

  return (await tool.execute(input as never, {
    toolCallId: "fiche-de-verite",
    messages: [],
    abortSignal: undefined,
    context: {},
  })) as TOutput;
}
```

- [ ] **Step 2 : Écrire le test du monde territorial**

Le test vérifie les propriétés dont dépendent les scénarios, lues par les outils eux-mêmes : les vues de `get_chantiers`, la position de la Bretagne face à la médiane, les valeurs d'indicateur au jalon, et la visibilité des commentaires territoriaux.

```ts
// evals/3-scenarios/mondeTerritorial.integration.test.ts
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import type { GetChantiersOutput } from "@/server/albert/tools/getChantiers";
import type { GetTauxAvancementTerritoireOutput } from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantierIndicateursOutput } from "@/server/albert/tools/getChantierIndicateurs";
import type { GetChantierCommentairesOutput } from "@/server/albert/tools/getChantierCommentaires";
import { seedEvalWorld } from "../world";
import { createDataTools, executeTool } from "./dataTools";
import { seedMondeTerritorial } from "./mondeTerritorial";

const idsDesChantiers = (output: GetChantiersOutput) =>
  output.resultats.flatMap((resultat) =>
    resultat.chantiers.map((chantier) => chantier.chantier.id),
  );

describe("seedMondeTerritorial", () => {
  it(
    "peuple les vues en retard et en difficulté de la Bretagne",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const enRetard = await executeTool<GetChantiersOutput>({
        tool: tools.getChantiers,
        input: { territoire_code: "REG-53", jalon: 2025, view: "en_retard" },
      });
      const enDifficulte = await executeTool<GetChantiersOutput>({
        tool: tools.getChantiers,
        input: { territoire_code: "REG-53", jalon: 2025, view: "en_difficulte" },
      });

      // Then
      expect(idsDesChantiers(enRetard)).toEqual(["CH-005"]);
      expect(idsDesChantiers(enDifficulte)).toEqual(["CH-006"]);
    }),
  );

  it(
    "place la Bretagne en retard face à la médiane des régions",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const taux = await executeTool<GetTauxAvancementTerritoireOutput>({
        tool: tools.getTauxAvancementTerritoire,
        input: { territoire_code: "REG-53", jalon: 2025 },
      });

      // Then
      expect(taux.resultats.map((resultat) => resultat.position_mediane)).toEqual(
        ["EN_RETARD"],
      );
    }),
  );

  it(
    "rend les valeurs de l'indicateur de CH-005 au jalon courant",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const indicateurs = await executeTool<GetChantierIndicateursOutput>({
        tool: tools.getIndicateurs,
        input: { chantier_id: "CH-005", territoire_code: "REG-53", jalon: 2025 },
      });

      // Then
      expect(
        indicateurs.resultats.indicateurs.map((indicateur) => ({
          id: indicateur.indicateur_id,
          va: indicateur.valeur_actuelle,
          vc: indicateur.valeur_cible,
        })),
      ).toEqual([{ id: "IND-005", va: 250, vc: 180 }]);
    }),
  );

  it(
    "rend les commentaires territoriaux de CH-005 en Bretagne",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });
      const tools = createDataTools({ user: world.users.ditp });

      // When
      const commentaires = await executeTool<GetChantierCommentairesOutput>({
        tool: tools.getChantierCommentaires,
        input: { chantier_id: "CH-005", territoire_code: "REG-53" },
      });

      // Then
      expect(
        commentaires.resultats.flatMap((resultat) =>
          resultat.commentaires.map((commentaire) => commentaire.type),
        ),
      ).toEqual(
        expect.arrayContaining([
          "commentaires_sur_les_donnees",
          "autres_resultats_obtenus",
        ]),
      );
    }),
  );
});
```

Vérifier au passage que `GetTauxAvancementTerritoireOutput` et `GetChantierIndicateursOutput` sont bien exportés par leurs fichiers d'outil (ils le sont à la date du plan : `getTauxAvancementTerritoire.ts:47`, `getChantierIndicateurs.ts:19`).

- [ ] **Step 3 : Lancer le test, il échoue**

Run: `pnpm exec vitest run --project server-integration evals/3-scenarios/mondeTerritorial`
Expected: FAIL, module `./mondeTerritorial` introuvable.

- [ ] **Step 4 : Implémenter `seedTerritoire`**

`fixtures.syntheseDesResultats` remplace un commentaire `null` par « Synthèse de test » (`??`). La synthèse sans commentaire est donc créée directement.

```ts
// evals/3-scenarios/seedTerritoire.ts
import { randomUUID } from "node:crypto";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import type { TypeContenuChantier } from "@/server/chantiers/query/GetChantierCommentairesQuery";
import type { TerritoireRef } from "../seeds";
import { indicateurDuChantier } from "../world";

export type Meteo = "SOLEIL" | "COUVERT" | "NUAGE" | "ORAGE";

export type SeededChantier = {
  chantierId: string;
  /** Taux d'avancement du chantier sur le territoire, au jalon. */
  taux: number;
  /** Écart à la médiane, en points. En retard si <= -10. */
  ecart: number;
  /** En difficulté si NUAGE ou ORAGE et pas en retard. */
  meteo: Meteo;
  /** `null` : la synthèse existe, sans commentaire. */
  commentaireSynthese: string | null;
  indicateur: {
    valeurInitiale: number;
    valeurActuelle: number;
    valeurCible: number;
    tauxAvancement: number;
  };
  /** Commentaires typés. Sur une région ou un département, seuls les types territoriaux sont visibles. */
  commentaires?: { type: TypeContenuChantier; contenu: string }[];
};

/**
 * Sème un territoire complet à un jalon : ce que les outils de synthèse, de
 * comparaison, d'indicateurs et de commentaires lisent.
 *
 * Les valeurs d'indicateur vont dans `indicateur_territoire_jalon` : c'est la
 * table que lit `get_indicateurs`. Les seeds du niveau 2 les écrivent dans
 * `indicateur_territoire`, où l'outil ne les voit pas.
 */
export async function seedTerritoire({
  territoire,
  jalon,
  chantiers,
  authorId,
}: {
  territoire: TerritoireRef;
  jalon: number;
  chantiers: SeededChantier[];
  authorId: string;
}) {
  for (const chantier of chantiers) {
    // `est_applicable` n'a pas de valeur par défaut en base et le `where` de
    // GetChantiersQuery filtre dessus : sans ce champ, le chantier n'existe pas
    // pour l'outil, sans qu'aucune erreur ne le signale.
    await fixtures.chantierTerritoire({
      id: chantier.chantierId,
      ...territoire,
      meteo: chantier.meteo,
      ecart: chantier.ecart,
      taux_avancement_mandat: chantier.taux,
      est_applicable: true,
    });

    await fixtures.chantierTerritoireJalon({
      id: chantier.chantierId,
      ...territoire,
      jalon,
      ecart: chantier.ecart,
      taux_avancement: chantier.taux,
    });

    const now = new Date("2026-09-15T10:00:00Z");
    await getPrisma().synthese_des_resultats.create({
      data: {
        id: randomUUID(),
        chantier_id: chantier.chantierId,
        territoire_code: territoire.territoire_code,
        maille: territoire.maille,
        code_insee: territoire.code_insee,
        meteo: chantier.meteo,
        commentaire: chantier.commentaireSynthese,
        auteur_creation_id: authorId,
        date_creation: now,
        auteur_modification_id: authorId,
        date_modification: now,
      },
    });

    const indicateurId = indicateurDuChantier(chantier.chantierId);

    await fixtures.indicateurTerritoire({
      id: indicateurId,
      chantier_id: chantier.chantierId,
      ...territoire,
      est_applicable: true,
      valeur_initiale: chantier.indicateur.valeurInitiale,
    });

    await fixtures.indicateurTerritoireJalon({
      id: indicateurId,
      ...territoire,
      jalon,
      valeur_actuelle: chantier.indicateur.valeurActuelle,
      valeur_cible: chantier.indicateur.valeurCible,
      taux_avancement: chantier.indicateur.tauxAvancement,
    });

    for (const commentaire of chantier.commentaires ?? []) {
      await fixtures.commentaire({
        chantier_id: chantier.chantierId,
        territoire_code: territoire.territoire_code,
        maille: territoire.maille,
        code_insee: territoire.code_insee,
        type: commentaire.type,
        contenu: commentaire.contenu,
        auteur_creation_id: authorId,
        auteur_modification_id: authorId,
      });
    }
  }
}

/**
 * Un jalon de plus pour des chantiers déjà semés par `seedTerritoire` : seul
 * le taux au jalon change, ce que lisent les comparaisons entre jalons.
 */
export async function seedJalon({
  territoire,
  jalon,
  chantiers,
}: {
  territoire: TerritoireRef;
  jalon: number;
  chantiers: { chantierId: string; taux: number; ecart: number }[];
}) {
  for (const chantier of chantiers) {
    await fixtures.chantierTerritoireJalon({
      id: chantier.chantierId,
      ...territoire,
      jalon,
      ecart: chantier.ecart,
      taux_avancement: chantier.taux,
    });
  }
}
```

Si `fixtures.indicateurTerritoireJalon` n'accepte pas `valeur_actuelle` / `valeur_cible` / `taux_avancement` en surcharge (lire `src/server/infrastructure/test/fixtures.ts:388`), passer par `getPrisma().indicateur_territoire_jalon.create` avec les mêmes champs, `code_insee`, `maille` et `zone_id` compris.

- [ ] **Step 5 : Implémenter le monde standard**

Un seul monde pour tous les scénarios : les médianes sont identiques d'un cas à l'autre, et un tableau de résultats se lit sans se demander ce que chaque cas a semé. Les valeurs placent la Bretagne (taux moyen 51) sous la médiane des régions semées (Auvergne-Rhône-Alpes 65, Pays de la Loire 70 : médiane 65, écart -14).

Chaque territoire porte un chantier à l'heure avec commentaire, un en retard avec commentaire, un en difficulté **sans** commentaire. Les commentaires sont de types territoriaux : « actions à venir » et « actions à valoriser » sont des types nationaux, invisibles sur une région.

```ts
// evals/3-scenarios/mondeTerritorial.ts
import type { TerritoireRef } from "../seeds";
import { seedJalon, seedTerritoire, type SeededChantier } from "./seedTerritoire";
import { JALON_COURANT, TERRITOIRES } from "./territoires";

const aLHeure = ({
  chantierId,
  taux,
  commentaire,
}: {
  chantierId: string;
  taux: number;
  commentaire: string;
}): SeededChantier => ({
  chantierId,
  taux,
  ecart: 2,
  meteo: "COUVERT",
  commentaireSynthese: commentaire,
  indicateur: {
    valeurInitiale: 20,
    valeurActuelle: taux,
    valeurCible: 100,
    tauxAvancement: taux,
  },
});

const BRETAGNE_2025: SeededChantier[] = [
  {
    ...aLHeure({
      chantierId: "CH-001",
      taux: 62,
      commentaire:
        "Les référents VSS sont désignés dans tous les établissements du second degré ; la formation des enquêteurs spécialisés se poursuit jusqu'en décembre.",
    }),
    commentaires: [
      {
        type: "autres_resultats_obtenus",
        contenu:
          "<p>Ouverture de deux maisons des femmes à Rennes et Brest. Prochaine étape : une troisième structure à Lorient au premier trimestre.</p>",
      },
    ],
  },
  {
    chantierId: "CH-005",
    taux: 34,
    ecart: -15,
    meteo: "NUAGE",
    commentaireSynthese:
      "Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre, malgré la régulation téléphonique mise en place en mars.",
    indicateur: {
      valeurInitiale: 280,
      valeurActuelle: 250,
      valeurCible: 180,
      tauxAvancement: 30,
    },
    commentaires: [
      {
        type: "commentaires_sur_les_donnees",
        contenu:
          "<p>La hausse du délai au premier semestre s'explique par la fermeture estivale de deux lignes de SMUR. La donnée de juin est provisoire.</p>",
      },
      {
        type: "autres_resultats_obtenus",
        contenu:
          "<p>Mise en place d'un numéro de régulation départemental unique en mars. Action engagée : recrutement de deux urgentistes par contrat de territoire, signature prévue en novembre.</p>",
      },
    ],
  },
  {
    chantierId: "CH-006",
    taux: 58,
    ecart: 2,
    meteo: "ORAGE",
    commentaireSynthese: null,
    indicateur: {
      valeurInitiale: 45,
      valeurActuelle: 52,
      valeurCible: 75,
      tauxAvancement: 23,
    },
    commentaires: [
      {
        type: "autres_resultats_obtenus",
        contenu:
          "<p>La campagne de vaccination antigrippale a démarré avec trois semaines de retard faute de doses. Action identifiée : ouverture de centres éphémères dans les pharmacies rurales.</p>",
      },
    ],
  },
];

const PAYS_DE_LA_LOIRE_2025: SeededChantier[] = [
  aLHeure({
    chantierId: "CH-001",
    taux: 80,
    commentaire:
      "Le maillage des référents VSS est complet ; les signalements ont doublé depuis l'ouverture de la plateforme régionale.",
  }),
  aLHeure({
    chantierId: "CH-005",
    taux: 75,
    commentaire:
      "Le délai médian de passage est stabilisé à 2 h 45 grâce aux maisons médicales de garde.",
  }),
  {
    chantierId: "CH-007",
    taux: 55,
    ecart: -20,
    meteo: "NUAGE",
    commentaireSynthese:
      "Le nombre de dossiers de rénovation déposés recule depuis la baisse des aides ; les artisans labellisés manquent en Mayenne.",
    indicateur: {
      valeurInitiale: 1000,
      valeurActuelle: 3200,
      valeurCible: 5000,
      tauxAvancement: 55,
    },
  },
];

const AUVERGNE_RHONE_ALPES_2025: SeededChantier[] = [
  aLHeure({
    chantierId: "CH-001",
    taux: 70,
    commentaire:
      "Les référents VSS sont en place dans huit départements sur douze.",
  }),
  aLHeure({
    chantierId: "CH-004",
    taux: 60,
    commentaire:
      "Quatorze maisons de santé ouvertes depuis janvier, dont six en zone de montagne.",
  }),
];

const departement = ({
  tauxCh001,
  tauxCh005,
  ecartCh005,
  tauxCh006,
}: {
  tauxCh001: number;
  tauxCh005: number;
  ecartCh005: number;
  tauxCh006: number;
}): SeededChantier[] => [
  aLHeure({
    chantierId: "CH-001",
    taux: tauxCh001,
    commentaire:
      "Les référents VSS du département sont désignés ; la coordination avec les parquets est en cours.",
  }),
  {
    chantierId: "CH-005",
    taux: tauxCh005,
    ecart: ecartCh005,
    meteo: "NUAGE",
    commentaireSynthese:
      "Le délai de passage aux urgences reste au-dessus de la cible faute de médecins régulateurs.",
    indicateur: {
      valeurInitiale: 280,
      valeurActuelle: 240,
      valeurCible: 180,
      tauxAvancement: tauxCh005,
    },
  },
  {
    chantierId: "CH-006",
    taux: tauxCh006,
    ecart: 1,
    meteo: "ORAGE",
    commentaireSynthese: null,
    indicateur: {
      valeurInitiale: 45,
      valeurActuelle: 50,
      valeurCible: 75,
      tauxAvancement: tauxCh006,
    },
  },
];

const PEUPLEMENT_2025: { territoire: TerritoireRef; chantiers: SeededChantier[] }[] = [
  { territoire: TERRITOIRES.bretagne, chantiers: BRETAGNE_2025 },
  { territoire: TERRITOIRES.paysDeLaLoire, chantiers: PAYS_DE_LA_LOIRE_2025 },
  {
    territoire: TERRITOIRES.auvergneRhoneAlpes,
    chantiers: AUVERGNE_RHONE_ALPES_2025,
  },
  {
    territoire: TERRITOIRES.cotesDArmor,
    chantiers: departement({ tauxCh001: 45, tauxCh005: 38, ecartCh005: -12, tauxCh006: 55 }),
  },
  {
    territoire: TERRITOIRES.finistere,
    chantiers: departement({ tauxCh001: 70, tauxCh005: 28, ecartCh005: -22, tauxCh006: 60 }),
  },
  {
    territoire: TERRITOIRES.illeEtVilaine,
    chantiers: departement({ tauxCh001: 58, tauxCh005: 30, ecartCh005: -18, tauxCh006: 50 }),
  },
  {
    territoire: TERRITOIRES.morbihan,
    chantiers: departement({ tauxCh001: 66, tauxCh005: 52, ecartCh005: -11, tauxCh006: 57 }),
  },
  {
    territoire: TERRITOIRES.vaucluse,
    chantiers: [
      aLHeure({
        chantierId: "CH-001",
        taux: 72,
        commentaire: "Le réseau des référents VSS couvre tout le département.",
      }),
      aLHeure({
        chantierId: "CH-004",
        taux: 64,
        commentaire: "Trois maisons de santé ouvertes dans le Haut-Vaucluse.",
      }),
    ],
  },
];

/**
 * Le jalon précédent, pour « Comparer les taux d'avancement entre le jalon
 * 2025 et un autre jalon ». Aucune donnée n'est semée en 2023 : le cas qui la
 * demande vérifie qu'Albert le dit au lieu d'inventer.
 */
const PEUPLEMENT_2024 = [
  {
    territoire: TERRITOIRES.bretagne,
    chantiers: [
      { chantierId: "CH-001", taux: 50, ecart: -5 },
      { chantierId: "CH-005", taux: 30, ecart: -14 },
      { chantierId: "CH-006", taux: 49, ecart: -1 },
    ],
  },
  {
    territoire: TERRITOIRES.paysDeLaLoire,
    chantiers: [
      { chantierId: "CH-001", taux: 65, ecart: 6 },
      { chantierId: "CH-005", taux: 60, ecart: 4 },
      { chantierId: "CH-007", taux: 50, ecart: -8 },
    ],
  },
  {
    territoire: TERRITOIRES.auvergneRhoneAlpes,
    chantiers: [
      { chantierId: "CH-001", taux: 58, ecart: 1 },
      { chantierId: "CH-004", taux: 52, ecart: -3 },
    ],
  },
];

export async function seedMondeTerritorial({ authorId }: { authorId: string }) {
  for (const { territoire, chantiers } of PEUPLEMENT_2025) {
    await seedTerritoire({
      territoire,
      jalon: JALON_COURANT,
      chantiers,
      authorId,
    });
  }

  for (const { territoire, chantiers } of PEUPLEMENT_2024) {
    await seedJalon({ territoire, jalon: 2024, chantiers });
  }
}
```

- [ ] **Step 6 : Lancer le test, il passe**

Run: `pnpm exec vitest run --project server-integration evals/3-scenarios/mondeTerritorial`
Expected: PASS (4 tests). Si la position de la Bretagne sort `DANS_LA_MEDIANE`, lire la médiane rendue (`mediane_repartition`) : la requête de statistiques peut inclure des territoires hors du monde semé. Ajuster alors les taux des Pays de la Loire et d'Auvergne-Rhône-Alpes vers le haut, sans toucher à la Bretagne.

- [ ] **Step 7 : Commit**

```bash
git add evals/3-scenarios
git commit -m "feat(ppg): sème un monde territorial pour les scénarios de niveau 3 (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 4 : La fiche de vérité

**Files:**
- Create: `evals/3-scenarios/groundTruth.ts`
- Test: `evals/3-scenarios/groundTruth.integration.test.ts`

**Interfaces:**
- Consumes: `createDataTools`, `executeTool` (tâche 3), `EvalUser` (tâche 2).
- Produces:

```ts
export type TruthScope = {
  territoires: string[];
  jalons?: number[];                 // défaut [JALON_COURANT]
  includeSousTerritoires?: boolean;
  /** Chantiers dont la fiche lit les commentaires, sur territoires[0]. */
  chantiersCommentes?: string[];
  /** Lit les indicateurs des chantiers en retard et en difficulté. */
  indicateurs?: boolean;
};

export type GroundTruth = {
  territoires: { code: string; nom: string; maille: string }[];
  tauxAvancement: GetTauxAvancementTerritoireResult[];
  chantiersEnRetard: GetChantiersResult[];
  chantiersEnDifficulte: GetChantiersResult[];
  indicateurs: GetChantierIndicateursResult[];
  commentaires: GetChantierCommentairesOutput[];
};

export async function readGroundTruth({ scope, user }: { scope: TruthScope; user: EvalUser }): Promise<GroundTruth>;
export function chantiersAttendus({ truth, view }: { truth: GroundTruth; view: "en_retard" | "en_difficulte" | "tous" }): { id: string; nom: string }[];
```

- [ ] **Step 1 : Écrire le test**

```ts
// evals/3-scenarios/groundTruth.integration.test.ts
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { seedEvalWorld } from "../world";
import { seedMondeTerritorial } from "./mondeTerritorial";
import { chantiersAttendus, readGroundTruth } from "./groundTruth";

describe("readGroundTruth", () => {
  it(
    "lit les chantiers en retard et en difficulté du territoire",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });

      // When
      const truth = await readGroundTruth({
        scope: { territoires: ["REG-53"] },
        user: world.users.ditp,
      });

      // Then
      expect(chantiersAttendus({ truth, view: "tous" })).toEqual([
        { id: "CH-005", nom: "Réduire les délais de passage aux urgences" },
        { id: "CH-006", nom: "Développer la prévention en santé" },
      ]);
      expect(truth.territoires).toEqual([
        { code: "REG-53", nom: "Bretagne", maille: "reg" },
      ]);
    }),
  );

  it(
    "suit les sous-territoires quand le scénario les demande",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });

      // When
      const truth = await readGroundTruth({
        scope: { territoires: ["REG-53"], includeSousTerritoires: true },
        user: world.users.ditp,
      });

      // Then
      expect(truth.territoires.map((territoire) => territoire.code).sort()).toEqual([
        "DEPT-22",
        "DEPT-29",
        "DEPT-35",
        "DEPT-56",
        "REG-53",
      ]);
    }),
  );

  it(
    "lit les indicateurs des chantiers signalés quand le scénario les demande",
    createIntegrationTest(async () => {
      // Given
      const world = await seedEvalWorld();
      await seedMondeTerritorial({ authorId: world.userId });

      // When
      const truth = await readGroundTruth({
        scope: { territoires: ["REG-53"], indicateurs: true },
        user: world.users.ditp,
      });

      // Then
      expect(truth.indicateurs.map((resultat) => resultat.chantier_id)).toEqual([
        "CH-005",
        "CH-006",
      ]);
    }),
  );
});
```

- [ ] **Step 2 : Lancer le test, il échoue**

Run: `pnpm exec vitest run --project server-integration evals/3-scenarios/groundTruth`
Expected: FAIL, module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
// evals/3-scenarios/groundTruth.ts
import { getPrisma } from "@/server/db/PrismaTransaction";
import type {
  GetChantiersOutput,
} from "@/server/albert/tools/getChantiers";
import type {
  GetTauxAvancementTerritoireOutput,
  GetTauxAvancementTerritoireResult,
} from "@/server/albert/tools/getTauxAvancementTerritoire";
import type { GetChantierIndicateursOutput } from "@/server/albert/tools/getChantierIndicateurs";
import type { GetChantierCommentairesOutput } from "@/server/albert/tools/getChantierCommentaires";
import type { GetChantiersResult } from "@/server/chantiers/query/GetChantiersQuery";
import type { GetChantierIndicateursResult } from "@/server/chantiers/query/GetChantierIndicateursQuery";
import type { EvalUser } from "../world";
import { createDataTools, executeTool } from "./dataTools";
import { JALON_COURANT } from "./territoires";

export type TruthScope = {
  territoires: string[];
  jalons?: number[];
  includeSousTerritoires?: boolean;
  chantiersCommentes?: string[];
  indicateurs?: boolean;
};

export type GroundTruth = {
  territoires: { code: string; nom: string; maille: string }[];
  tauxAvancement: GetTauxAvancementTerritoireResult[];
  chantiersEnRetard: GetChantiersResult[];
  chantiersEnDifficulte: GetChantiersResult[];
  indicateurs: GetChantierIndicateursResult[];
  commentaires: GetChantierCommentairesOutput[];
};

/**
 * Ce que la réponse doit couvrir, lu par les outils de production avec les
 * habilitations du profil. Taux global et médiane sont des agrégats calculés
 * par du code déjà validé au niveau 2 : les recalculer ici dupliquerait la
 * formule, et un arrondi divergent ferait échouer un critère pour rien.
 */
export async function readGroundTruth({
  scope,
  user,
}: {
  scope: TruthScope;
  user: EvalUser;
}): Promise<GroundTruth> {
  const tools = createDataTools({ user });
  const jalons = scope.jalons ?? [JALON_COURANT];
  const includeSousTerritoires = scope.includeSousTerritoires ?? false;

  const tauxAvancement: GetTauxAvancementTerritoireResult[] = [];
  const chantiersEnRetard: GetChantiersResult[] = [];
  const chantiersEnDifficulte: GetChantiersResult[] = [];

  for (const territoireCode of scope.territoires) {
    for (const jalon of jalons) {
      const taux = await executeTool<GetTauxAvancementTerritoireOutput>({
        tool: tools.getTauxAvancementTerritoire,
        input: {
          territoire_code: territoireCode,
          jalon,
          include_sous_territoires: includeSousTerritoires,
        },
      });
      tauxAvancement.push(...taux.resultats);

      for (const view of ["en_retard", "en_difficulte"] as const) {
        const chantiers = await executeTool<GetChantiersOutput>({
          tool: tools.getChantiers,
          input: {
            territoire_code: territoireCode,
            jalon,
            view,
            include_sous_territoires: includeSousTerritoires,
          },
        });
        (view === "en_retard" ? chantiersEnRetard : chantiersEnDifficulte).push(
          ...chantiers.resultats,
        );
      }
    }
  }

  const territoirePrincipal = scope.territoires[0];

  const indicateurs: GetChantierIndicateursResult[] = [];
  if (scope.indicateurs) {
    const signales = chantiersAttendus({
      truth: {
        territoires: [],
        tauxAvancement,
        chantiersEnRetard,
        chantiersEnDifficulte,
        indicateurs: [],
        commentaires: [],
      },
      view: "tous",
    });
    for (const chantier of signales) {
      const resultat = await executeTool<GetChantierIndicateursOutput>({
        tool: tools.getIndicateurs,
        input: {
          chantier_id: chantier.id,
          territoire_code: territoirePrincipal,
          jalon: jalons[0],
        },
      });
      indicateurs.push(resultat.resultats);
    }
  }

  const commentaires: GetChantierCommentairesOutput[] = [];
  for (const chantierId of scope.chantiersCommentes ?? []) {
    commentaires.push(
      await executeTool<GetChantierCommentairesOutput>({
        tool: tools.getChantierCommentaires,
        input: { chantier_id: chantierId, territoire_code: territoirePrincipal },
      }),
    );
  }

  const codes = [
    ...new Set([
      ...scope.territoires,
      ...tauxAvancement.map((resultat) => resultat.territoire_code),
    ]),
  ];
  const territoires = await getPrisma().territoire.findMany({
    where: { code: { in: codes } },
    orderBy: { code: "asc" },
  });

  return {
    territoires: territoires.map((territoire) => ({
      code: territoire.code,
      nom: territoire.nom,
      maille: territoire.maille,
    })),
    tauxAvancement,
    chantiersEnRetard,
    chantiersEnDifficulte,
    indicateurs,
    commentaires,
  };
}

/** Les chantiers qu'une synthèse doit citer, sans doublon, triés par identifiant. */
export function chantiersAttendus({
  truth,
  view,
}: {
  truth: GroundTruth;
  view: "en_retard" | "en_difficulte" | "tous";
}): { id: string; nom: string }[] {
  const sources =
    view === "en_retard"
      ? truth.chantiersEnRetard
      : view === "en_difficulte"
        ? truth.chantiersEnDifficulte
        : [...truth.chantiersEnRetard, ...truth.chantiersEnDifficulte];

  const parId = new Map<string, string>();
  for (const resultat of sources) {
    for (const chantier of resultat.chantiers) {
      parId.set(chantier.chantier.id, chantier.chantier.nom);
    }
  }

  return [...parId.entries()]
    .sort(([idA], [idB]) => idA.localeCompare(idB))
    .map(([id, nom]) => ({ id, nom }));
}
```

- [ ] **Step 4 : Lancer le test, il passe**

Run: `pnpm exec vitest run --project server-integration evals/3-scenarios/groundTruth`
Expected: PASS (3 tests).

- [ ] **Step 5 : Commit**

```bash
git add evals/3-scenarios/groundTruth.ts evals/3-scenarios/groundTruth.integration.test.ts
git commit -m "feat(ppg): lit la fiche de vérité des scénarios par les outils de production (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 5 : Les vérifications mécaniques

**Files:**
- Create: `evals/3-scenarios/mechanicalChecks.ts`
- Test: `evals/3-scenarios/mechanicalChecks.unit.test.ts`

**Interfaces:**
- Produces (toutes pures, `CheckResult = { ok: boolean; detail: string }`) :
  - `checkNoToolName({ text })`, `checkNoMeteoCode({ text })`, `checkOfficialCodes({ text })`
  - `checkHeadings({ text, titles }: { text: string; titles: string[] })`
  - `checkContains({ text, fragments })`
  - `checkChantiersCited({ text, chantiers }: { text: string; chantiers: { id: string; nom: string }[] })`
  - `checkNoChantierTable({ text })`, `checkHasTable({ text })`
  - `checkTableTerritories({ text, noms }: { text: string; noms: string[] })`
  - `checkNoFigure({ text })`, `checkNoLink({ text })`, `checkExactAnswer({ text, expected })`
  - `normalize(text: string): string` (minuscules, sans diacritiques, espaces réduits)

- [ ] **Step 1 : Écrire les tests**

```ts
// evals/3-scenarios/mechanicalChecks.unit.test.ts
import {
  checkChantiersCited,
  checkExactAnswer,
  checkHasTable,
  checkHeadings,
  checkNoChantierTable,
  checkNoFigure,
  checkNoLink,
  checkNoMeteoCode,
  checkNoToolName,
  checkOfficialCodes,
  checkTableTerritories,
} from "./mechanicalChecks";

describe("checkNoToolName", () => {
  test("signale un nom d'outil cité dans la réponse", () => {
    expect(
      checkNoToolName({ text: "J'ai appelé get_chantiers pour la Bretagne." }),
    ).toEqual({ ok: false, detail: "noms d'outils cités : get_chantiers" });
  });

  test("laisse passer une réponse sans nom d'outil", () => {
    expect(checkNoToolName({ text: "Voici la synthèse." })).toEqual({
      ok: true,
      detail: "aucun nom d'outil",
    });
  });
});

describe("checkNoMeteoCode", () => {
  test("signale un code météo interne", () => {
    expect(checkNoMeteoCode({ text: "**Météo** : ORAGE" })).toEqual({
      ok: false,
      detail: "codes météo cités : ORAGE",
    });
  });

  test("laisse passer les libellés", () => {
    expect(
      checkNoMeteoCode({ text: "**Météo** : Objectifs compromis" }).ok,
    ).toBe(true);
  });
});

describe("checkOfficialCodes", () => {
  test("laisse passer les codes officiels", () => {
    expect(
      checkOfficialCodes({ text: "CH-005 sur REG-53, DEPT-35 et DEPT-2A" }).ok,
    ).toBe(true);
  });

  test("signale les codes mal formés", () => {
    expect(checkOfficialCodes({ text: "CH-5, CH005 et REG53" })).toEqual({
      ok: false,
      detail: "codes mal formés : CH-5, CH005, REG53",
    });
  });
});

describe("checkHeadings", () => {
  test("accepte un titre à un autre niveau, sans accent ni casse", () => {
    const text = "# Synthese pour Bretagne\n\n### chantiers en retard\n\n## Chantiers en difficulté";

    expect(
      checkHeadings({
        text,
        titles: ["Synthèse pour", "Chantiers en retard", "Chantiers en difficulté"],
      }).ok,
    ).toBe(true);
  });

  test("signale un titre manquant", () => {
    expect(
      checkHeadings({
        text: "# Synthèse pour Bretagne",
        titles: ["Synthèse pour", "Chantiers en retard"],
      }),
    ).toEqual({ ok: false, detail: "titres manquants : Chantiers en retard" });
  });

  test("ne prend pas une phrase pour un titre", () => {
    expect(
      checkHeadings({
        text: "Il y a des chantiers en retard.",
        titles: ["Chantiers en retard"],
      }).ok,
    ).toBe(false);
  });
});

describe("checkChantiersCited", () => {
  const chantiers = [
    { id: "CH-005", nom: "Réduire les délais de passage aux urgences" },
    { id: "CH-006", nom: "Développer la prévention en santé" },
  ];

  test("accepte le format CH-XXX — Nom, en gras ou non", () => {
    const text =
      "**CH-005 — Réduire les délais de passage aux urgences**\nCH-006 - Développer la prévention en santé";

    expect(checkChantiersCited({ text, chantiers }).ok).toBe(true);
  });

  test("signale un chantier absent ou sans son nom", () => {
    expect(checkChantiersCited({ text: "CH-005 et CH-006", chantiers })).toEqual({
      ok: false,
      detail: "chantiers absents du format CH-XXX — Nom : CH-005, CH-006",
    });
  });
});

describe("tableaux", () => {
  const tableau = "| Territoire | TA |\n|---|---|\n| Bretagne | 51% |\n| 35 - Ille-et-Vilaine | 45% |";

  test("checkHasTable repère un tableau markdown", () => {
    expect(checkHasTable({ text: tableau }).ok).toBe(true);
  });

  test("checkNoChantierTable signale un tableau qui liste des chantiers", () => {
    expect(
      checkNoChantierTable({ text: "| Chantier | Écart |\n|---|---|\n| CH-005 | -15 |" }).ok,
    ).toBe(false);
  });

  test("checkNoChantierTable laisse passer un tableau sans chantier", () => {
    expect(checkNoChantierTable({ text: tableau }).ok).toBe(true);
  });

  test("checkTableTerritories cherche les noms dans les lignes du tableau", () => {
    expect(
      checkTableTerritories({ text: tableau, noms: ["Bretagne", "Ille-et-Vilaine", "Finistère"] }),
    ).toEqual({ ok: false, detail: "territoires absents du tableau : Finistère" });
  });
});

describe("checkNoFigure", () => {
  test("signale un pourcentage ou des points", () => {
    expect(checkNoFigure({ text: "Le taux atteint 51 % en Bretagne." }).ok).toBe(false);
  });

  test("laisse passer une phrase d'introduction", () => {
    expect(checkNoFigure({ text: "Voici le tableau de bord de la Bretagne." }).ok).toBe(true);
  });
});

describe("checkNoLink et checkExactAnswer", () => {
  test("checkNoLink signale une URL", () => {
    expect(checkNoLink({ text: "Téléchargez-le ici : https://pilote.gouv.fr/r.md" }).ok).toBe(false);
  });

  test("checkExactAnswer ignore les espaces en trop", () => {
    expect(
      checkExactAnswer({
        text: "  Votre rapport est disponible au téléchargement. ",
        expected: "Votre rapport est disponible au téléchargement.",
      }).ok,
    ).toBe(true);
  });
});
```

- [ ] **Step 2 : Lancer les tests, ils échouent**

Run: `pnpm exec vitest run --project server-unit evals/3-scenarios/mechanicalChecks`
Expected: FAIL, module introuvable.

- [ ] **Step 3 : Implémenter**

```ts
// evals/3-scenarios/mechanicalChecks.ts

/**
 * Les règles de forme du prompt système, vérifiées sans LLM. Un juge y serait
 * moins fiable qu'une regex, et ses oscillations brouilleraient la lecture
 * des critères de fond.
 *
 * Chaque vérification tolère ce qui ne change rien pour l'utilisateur : un
 * titre de gabarit à un autre niveau, une casse ou un accent différent, un
 * tiret court à la place du tiret cadratin.
 */

export type CheckResult = { ok: boolean; detail: string };

export function normalize(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(text: string) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function unique(values: string[]) {
  return [...new Set(values)];
}

const TOOL_NAME = /\b(?:get|search|create|export|display|compose)_[a-z_]+\b/g;

export function checkNoToolName({ text }: { text: string }): CheckResult {
  const cites = unique(text.match(TOOL_NAME) ?? []);
  return cites.length === 0
    ? { ok: true, detail: "aucun nom d'outil" }
    : { ok: false, detail: `noms d'outils cités : ${cites.join(", ")}` };
}

const METEO_CODE = /\b(?:SOLEIL|COUVERT|NUAGE|ORAGE|NON_RENSEIGNEE|NON_NECESSAIRE)\b/g;

export function checkNoMeteoCode({ text }: { text: string }): CheckResult {
  const cites = unique(text.match(METEO_CODE) ?? []);
  return cites.length === 0
    ? { ok: true, detail: "libellés météo uniquement" }
    : { ok: false, detail: `codes météo cités : ${cites.join(", ")}` };
}

// CH-XXX exige trois chiffres et le tiret ; REG-XX et DEPT-XX le tiret.
const MALFORMED_CODE = /\bCH-\d{1,2}\b|\bCH\s?\d{2,4}\b|\bREG\s?\d{2}\b|\bDEPT\s?\d{2}\b/g;

export function checkOfficialCodes({ text }: { text: string }): CheckResult {
  const malformes = unique(text.match(MALFORMED_CODE) ?? []);
  return malformes.length === 0
    ? { ok: true, detail: "codes officiels" }
    : { ok: false, detail: `codes mal formés : ${malformes.join(", ")}` };
}

export function checkHeadings({
  text,
  titles,
}: {
  text: string;
  titles: string[];
}): CheckResult {
  const headings = [...text.matchAll(/^\s{0,3}#{1,6}\s+(.+)$/gm)].map((match) =>
    normalize(match[1].replace(/[*_]/g, "")),
  );
  const manquants = titles.filter(
    (title) => !headings.some((heading) => heading.includes(normalize(title))),
  );
  return manquants.length === 0
    ? { ok: true, detail: "titres du gabarit présents" }
    : { ok: false, detail: `titres manquants : ${manquants.join(", ")}` };
}

export function checkContains({
  text,
  fragments,
}: {
  text: string;
  fragments: string[];
}): CheckResult {
  const normalized = normalize(text);
  const manquants = fragments.filter(
    (fragment) => !normalized.includes(normalize(fragment)),
  );
  return manquants.length === 0
    ? { ok: true, detail: "mentions présentes" }
    : { ok: false, detail: `mentions absentes : ${manquants.join(", ")}` };
}

export function checkChantiersCited({
  text,
  chantiers,
}: {
  text: string;
  chantiers: { id: string; nom: string }[];
}): CheckResult {
  const plain = normalize(text.replace(/[*_]/g, ""));
  const absents = chantiers
    .filter(
      (chantier) =>
        !new RegExp(
          `${escapeRegExp(normalize(chantier.id))}\\s*[—–-]\\s*${escapeRegExp(normalize(chantier.nom))}`,
        ).test(plain),
    )
    .map((chantier) => chantier.id);
  return absents.length === 0
    ? { ok: true, detail: "chaque chantier au format CH-XXX — Nom" }
    : {
        ok: false,
        detail: `chantiers absents du format CH-XXX — Nom : ${absents.join(", ")}`,
      };
}

function tableRows(text: string) {
  return text.split("\n").filter((line) => /^\s*\|.*\|\s*$/.test(line));
}

export function checkHasTable({ text }: { text: string }): CheckResult {
  return tableRows(text).length >= 2
    ? { ok: true, detail: "tableau présent" }
    : { ok: false, detail: "aucun tableau markdown" };
}

export function checkNoChantierTable({ text }: { text: string }): CheckResult {
  const lignesChantier = tableRows(text).filter((row) => /\bCH-\d{3}\b/.test(row));
  return lignesChantier.length === 0
    ? { ok: true, detail: "pas de tableau de chantiers" }
    : { ok: false, detail: `${lignesChantier.length} ligne(s) de chantier en tableau` };
}

export function checkTableTerritories({
  text,
  noms,
}: {
  text: string;
  noms: string[];
}): CheckResult {
  const rows = tableRows(text).map(normalize);
  const absents = noms.filter(
    (nom) => !rows.some((row) => row.includes(normalize(nom))),
  );
  return absents.length === 0
    ? { ok: true, detail: "tous les territoires dans le tableau" }
    : { ok: false, detail: `territoires absents du tableau : ${absents.join(", ")}` };
}

// Même motif que la validation des titres de widget de `composeDashboard.ts`.
const FIGURE = /\d{1,10}\s{0,5}(?:%|points?\b|pts\b)/i;

export function checkNoFigure({ text }: { text: string }): CheckResult {
  const match = FIGURE.exec(text);
  return match
    ? { ok: false, detail: `valeur chiffrée : « ${match[0]} »` }
    : { ok: true, detail: "aucune valeur chiffrée" };
}

export function checkNoLink({ text }: { text: string }): CheckResult {
  const match = /https?:\/\/\S+/.exec(text);
  return match
    ? { ok: false, detail: `lien donné : ${match[0]}` }
    : { ok: true, detail: "aucun lien" };
}

export function checkExactAnswer({
  text,
  expected,
}: {
  text: string;
  expected: string;
}): CheckResult {
  return normalize(text) === normalize(expected)
    ? { ok: true, detail: "réponse attendue" }
    : { ok: false, detail: `réponse : « ${text.trim().slice(0, 120)} »` };
}
```

- [ ] **Step 4 : Lancer les tests, ils passent**

Run: `pnpm exec vitest run --project server-unit evals/3-scenarios/mechanicalChecks`
Expected: PASS.

- [ ] **Step 5 : Commit**

```bash
git add evals/3-scenarios/mechanicalChecks.ts evals/3-scenarios/mechanicalChecks.unit.test.ts
git commit -m "feat(ppg): vérifications mécaniques des règles de forme du prompt système (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 6 : Critères, grilles et juge

**Files:**
- Create: `evals/3-scenarios/evidence.ts` (types seulement dans cette tâche : `Evidence`)
- Create: `evals/3-scenarios/grid.ts`
- Create: `evals/3-scenarios/judge.ts` (fonctions pures : prompt, lecture du verdict)
- Create: `evals/3-scenarios/askJudge.ts` (l'appel au modèle, séparé pour que les tests unitaires ne chargent pas `Albert`)
- Test: `evals/3-scenarios/judge.unit.test.ts`

**Interfaces:**
- Consumes: `GroundTruth` (tâche 4), `CheckResult` (tâche 5), `ObservedToolCall` (`evals/types.ts`), `createEvalModel` (tâche 2), `ComposeDashboardOutput`.
- Produces:

```ts
// evidence.ts
export type Evidence = {
  question: string;
  profile: EvalProfile;
  currentTerritory: string;
  /** Texte de la réponse dans le chat. */
  answer: string;
  /** Ce que lit le juge : texte, rapport rendu, ou dashboard décrit + texte. */
  matter: string;
  dashboard: ComposeDashboardOutput | null;
  toolCalls: ObservedToolCall[];
  /** Résultats d'outils du tour, sans `_output_instructions` : seule source légitime de chiffres. */
  toolResults: { toolName: string; output: unknown }[];
  /** Territoires hors périmètre dont un outil a rendu des champs masqués pendant le tour. */
  maskedTerritories: string[];
  truth: GroundTruth;
  /** Codes des territoires que le tableau doit contenir, pour les comparaisons. */
  tableTerritories: string[];
};

// grid.ts
export type MatterKind = "text" | "dashboard" | "rapport";
export type MechanicalCriterion = { kind: "mechanical"; id: string; rule: string; check: (evidence: Evidence) => CheckResult; applicable?: (evidence: Evidence) => boolean };
export type JudgedCriterion = { kind: "judged"; id: string; rule: string; instruction: string; applicable?: (evidence: Evidence) => boolean };
export type Criterion = MechanicalCriterion | JudgedCriterion;
export type Grid = { family: string; matter: MatterKind; criteria: Criterion[] };
export function mechanical(criterion: Omit<MechanicalCriterion, "kind">): MechanicalCriterion;
export function judged(criterion: Omit<JudgedCriterion, "kind">): JudgedCriterion;
export function grid({ family, matter, criteria, omit }: { family: string; matter: MatterKind; criteria: Criterion[]; omit?: string[] }): Grid;
export const BASE_IDS: { noToolName: "Pas de nom d'outil"; noMeteoCode: "Libellés météo"; officialCodes: "Codes officiels"; noOpinion: "Pas d'opinion"; exactFigures: "Chiffres exacts"; restriction: "Restriction signalée" };

// judge.ts
export const JUDGE_MODEL = "deepseek-v4-flash";
export type Verdict = Record<string, { conforme: boolean; preuve: string }>;
export function buildJudgePrompt({ evidence, criteria }: { evidence: Evidence; criteria: JudgedCriterion[] }): string;
export function toVerdict({ criteria, raw }: { criteria: JudgedCriterion[]; raw: { verdicts: { critere: string; conforme: boolean; preuve: string }[] } }): Verdict;

// askJudge.ts
export async function askJudge({ evidence, criteria }: { evidence: Evidence; criteria: JudgedCriterion[] }): Promise<Verdict>;
```

- [ ] **Step 1 : Écrire les tests du juge**

```ts
// evals/3-scenarios/judge.unit.test.ts
import { buildJudgePrompt, toVerdict } from "./judge";
import { judged } from "./grid";
import type { Evidence } from "./evidence";

const CRITERES = [
  judged({
    id: "Pas d'opinion",
    rule: "Identité : aucune opinion, recommandation ni jugement",
    instruction: "La réponse décrit sans conseiller.",
  }),
  judged({
    id: "Résumés condensés",
    rule: "Commentaires : 1 à 2 phrases, jamais verbatim",
    instruction: "Chaque commentaire est résumé en 1 à 2 phrases.",
  }),
];

const EVIDENCE: Evidence = {
  question: "Fais moi la synthèse du territoire Bretagne",
  profile: "ditp",
  currentTerritory: "REG-53",
  answer: "# Synthèse pour Bretagne",
  matter: "# Synthèse pour Bretagne",
  dashboard: null,
  toolCalls: [{ toolName: "get_chantiers", input: { view: "en_retard" } }],
  toolResults: [{ toolName: "get_chantiers", output: { resultats: [] } }],
  maskedTerritories: [],
  truth: {
    territoires: [{ code: "REG-53", nom: "Bretagne", maille: "reg" }],
    tauxAvancement: [],
    chantiersEnRetard: [],
    chantiersEnDifficulte: [],
    indicateurs: [],
    commentaires: [],
  },
  tableTerritories: [],
};

describe("toVerdict", () => {
  test("un critère absent de la réponse du juge est non conforme", () => {
    // When
    const verdict = toVerdict({
      criteria: CRITERES,
      raw: {
        verdicts: [{ critere: "Pas d'opinion", conforme: true, preuve: "aucune recommandation" }],
      },
    });

    // Then
    expect(verdict).toEqual({
      "Pas d'opinion": { conforme: true, preuve: "aucune recommandation" },
      "Résumés condensés": { conforme: false, preuve: "absent du verdict" },
    });
  });

  test("ignore un critère que le juge a inventé", () => {
    // When
    const verdict = toVerdict({
      criteria: CRITERES.slice(0, 1),
      raw: {
        verdicts: [
          { critere: "Pas d'opinion", conforme: false, preuve: "« il conviendrait »" },
          { critere: "Ton", conforme: true, preuve: "neutre" },
        ],
      },
    });

    // Then
    expect(verdict).toEqual({
      "Pas d'opinion": { conforme: false, preuve: "« il conviendrait »" },
    });
  });
});

describe("buildJudgePrompt", () => {
  test("donne au juge chaque critère avec sa règle, la matière et les données reçues", () => {
    // When
    const prompt = buildJudgePrompt({ evidence: EVIDENCE, criteria: CRITERES });

    // Then
    expect(prompt).toContain("« Pas d'opinion » (règle : Identité : aucune opinion, recommandation ni jugement)");
    expect(prompt).toContain("« Résumés condensés »");
    expect(prompt).toContain("# Synthèse pour Bretagne");
    expect(prompt).toContain('"toolName": "get_chantiers"');
    expect(prompt).toContain("Territoire courant : REG-53");
  });
});
```

- [ ] **Step 2 : Lancer les tests, ils échouent**

Run: `pnpm exec vitest run --project server-unit evals/3-scenarios/judge`
Expected: FAIL, modules introuvables.

- [ ] **Step 3 : Écrire le type `Evidence`**

```ts
// evals/3-scenarios/evidence.ts
import type { ComposeDashboardOutput } from "@/server/albert/tools/composeDashboard";
import type { ObservedToolCall } from "../types";
import type { EvalProfile } from "../world";
import type { GroundTruth } from "./groundTruth";

/**
 * Tout ce qu'un critère peut regarder, qu'il soit mécanique ou jugé. Les
 * suites le construisent depuis un tour d'agent ; la calibration l'écrit à la
 * main. Un critère ne voit jamais le tour lui-même : la calibration peut donc
 * lui soumettre des réponses fabriquées.
 */
export type Evidence = {
  question: string;
  profile: EvalProfile;
  currentTerritory: string;
  answer: string;
  matter: string;
  dashboard: ComposeDashboardOutput | null;
  toolCalls: ObservedToolCall[];
  toolResults: { toolName: string; output: unknown }[];
  maskedTerritories: string[];
  truth: GroundTruth;
  tableTerritories: string[];
};
```

- [ ] **Step 4 : Écrire `grid.ts` et le socle transverse**

```ts
// evals/3-scenarios/grid.ts
import type { Evidence } from "./evidence";
import {
  checkNoMeteoCode,
  checkNoToolName,
  checkOfficialCodes,
  type CheckResult,
} from "./mechanicalChecks";

export type MatterKind = "text" | "dashboard" | "rapport";

export type MechanicalCriterion = {
  kind: "mechanical";
  id: string;
  /** La règle du prompt système vérifiée, citée dans le rapport. */
  rule: string;
  check: (evidence: Evidence) => CheckResult;
  applicable?: (evidence: Evidence) => boolean;
};

export type JudgedCriterion = {
  kind: "judged";
  id: string;
  rule: string;
  /** Ce que le juge doit constater. */
  instruction: string;
  applicable?: (evidence: Evidence) => boolean;
};

export type Criterion = MechanicalCriterion | JudgedCriterion;

export type Grid = {
  family: string;
  matter: MatterKind;
  criteria: Criterion[];
};

export function mechanical(
  criterion: Omit<MechanicalCriterion, "kind">,
): MechanicalCriterion {
  return { kind: "mechanical", ...criterion };
}

export function judged(
  criterion: Omit<JudgedCriterion, "kind">,
): JudgedCriterion {
  return { kind: "judged", ...criterion };
}

export const BASE_IDS = {
  noToolName: "Pas de nom d'outil",
  noMeteoCode: "Libellés météo",
  officialCodes: "Codes officiels",
  noOpinion: "Pas d'opinion",
  exactFigures: "Chiffres exacts",
  restriction: "Restriction signalée",
} as const;

/**
 * Le socle : les « Règles fondamentales » du prompt, valables pour toute
 * réponse. Les règles de forme portent sur la réponse du chat ; les règles de
 * fond sur la matière, qui peut être un rapport ou un dashboard.
 */
const BASE: Criterion[] = [
  mechanical({
    id: BASE_IDS.noToolName,
    rule: "Noms d'outils internes : ne cite jamais le nom technique d'un outil",
    check: (evidence) => checkNoToolName({ text: evidence.matter }),
  }),
  mechanical({
    id: BASE_IDS.noMeteoCode,
    rule: "Météo : jamais les codes SOLEIL, COUVERT, NUAGE, ORAGE, toujours les libellés",
    check: (evidence) => checkNoMeteoCode({ text: evidence.matter }),
  }),
  mechanical({
    id: BASE_IDS.officialCodes,
    rule: "Format des chantiers : codes officiels CH-XXX, REG-XX, DEPT-XX",
    check: (evidence) => checkOfficialCodes({ text: evidence.matter }),
  }),
  judged({
    id: BASE_IDS.noOpinion,
    rule: "Identité et périmètre : ne formule ni opinion, ni recommandation, ni jugement",
    instruction:
      "La réponse décrit les données sans conseiller, recommander, prioriser ni qualifier moralement. « Il conviendrait de », « il est urgent de », « la situation est préoccupante » sont non conformes. Une tendance factuelle (« les écarts se concentrent sur la santé ») est conforme.",
  }),
  judged({
    id: BASE_IDS.exactFigures,
    rule: "Factualité : n'invente jamais de données ni de chiffres absents des résultats des outils",
    instruction:
      "Chaque chiffre de la réponse (taux, médiane, écart, valeur d'indicateur, nombre de chantiers, date) figure dans les DONNÉES REÇUES PAR L'ASSISTANT, ou s'en déduit par un calcul simple et juste (une différence de taux par exemple). Un chiffre introuvable ou faux est non conforme ; cite-le dans la preuve. Un arrondi à l'unité est conforme.",
  }),
  judged({
    id: BASE_IDS.restriction,
    rule: "Territoires accessibles : les champs masqués le sont par restriction d'accès, et non absents",
    instruction:
      "Pour les territoires listés comme MASQUÉS, la réponse dit explicitement que commentaires, tendance ou synthèse ne sont pas accessibles à l'utilisateur. Dire qu'il n'y a « pas de commentaire » ou « aucune donnée » pour ces territoires est non conforme.",
    applicable: (evidence) => evidence.maskedTerritories.length > 0,
  }),
];

/**
 * Une grille : le socle, puis les critères de la famille. `omit` retire un
 * critère du socle qui n'a pas de sens pour la suite (la restriction sur une
 * comparaison qui ne demande que des taux, jamais masqués).
 */
export function grid({
  family,
  matter,
  criteria,
  omit = [],
}: {
  family: string;
  matter: MatterKind;
  criteria: Criterion[];
  omit?: string[];
}): Grid {
  const all = [...BASE.filter((criterion) => !omit.includes(criterion.id)), ...criteria];
  const ids = all.map((criterion) => criterion.id);
  const doublons = ids.filter((id, index) => ids.indexOf(id) !== index);
  if (doublons.length > 0) {
    throw new Error(`Critères en double dans la grille ${family} : ${doublons.join(", ")}`);
  }
  return { family, matter, criteria: all };
}
```

- [ ] **Step 5 : Écrire le juge**

```ts
// evals/3-scenarios/judge.ts
import { z } from "zod";
import type { Evidence } from "./evidence";
import type { JudgedCriterion } from "./grid";

/**
 * Le juge tourne sur un modèle DIFFÉRENT de celui de production. Mesure du
 * spike : les alias `openweight-*` ne sont pas listés par /v1/models mais
 * pointent vers des modèles du catalogue. À température 0 et seed fixe,
 * `openweight-large` et `openai/gpt-oss-120b` rendent des sorties identiques
 * sur 2 prompts sur 3 : prendre gpt-oss-120b reviendrait à faire s'auto-noter
 * le modèle de production. `deepseek-v4-flash` diverge sur tous les prompts
 * testés.
 */
export const JUDGE_MODEL = "deepseek-v4-flash";

export type Verdict = Record<string, { conforme: boolean; preuve: string }>;

export const rawVerdictSchema = z.object({
  verdicts: z.array(
    z.object({
      critere: z.string().describe("Identifiant exact du critère, recopié."),
      conforme: z.boolean(),
      preuve: z
        .string()
        .describe("Extrait cité de la réponse, ou ce qui manque, en une phrase."),
    }),
  ),
});

export const JUDGE_SYSTEM = `Tu vérifies la conformité des réponses d'Albert, l'assistant de PILOTE qui analyse les chantiers prioritaires du gouvernement pour des agents publics.

Tu ne notes pas la qualité en général. Tu vérifies une liste fermée de critères, chacun tiré d'une règle écrite du prompt d'Albert.

Règles :
- Juge chaque critère indépendamment des autres. Un défaut ne compte que pour le critère qu'il concerne.
- Appuie-toi sur la FICHE DE VÉRITÉ et sur les DONNÉES REÇUES PAR L'ASSISTANT, jamais sur tes propres connaissances.
- Un critère est conforme ou non conforme, sans intermédiaire.
- Pour chaque critère, cite en preuve un extrait de la matière jugée, ou nomme précisément ce qui manque.
- Rends un verdict pour chaque critère listé, et seulement pour eux, en recopiant son identifiant.`;

function sansInstructions(output: unknown): unknown {
  if (Array.isArray(output)) return output.map(sansInstructions);
  if (output && typeof output === "object") {
    return Object.fromEntries(
      Object.entries(output)
        .filter(([key]) => key !== "_output_instructions")
        .map(([key, value]) => [key, sansInstructions(value)]),
    );
  }
  return output;
}

export function buildJudgePrompt({
  evidence,
  criteria,
}: {
  evidence: Evidence;
  criteria: JudgedCriterion[];
}): string {
  return [
    `DEMANDE DE L'UTILISATEUR (profil ${evidence.profile}, Territoire courant : ${evidence.currentTerritory}) :`,
    evidence.question,
    ``,
    `OUTILS APPELÉS PAR L'ASSISTANT :`,
    JSON.stringify(evidence.toolCalls, null, 2),
    ``,
    `DONNÉES REÇUES PAR L'ASSISTANT (seule source légitime de chiffres) :`,
    JSON.stringify(
      evidence.toolResults.map((result) => ({
        toolName: result.toolName,
        output: sansInstructions(result.output),
      })),
      null,
      2,
    ),
    ``,
    `TERRITOIRES MASQUÉS (hors périmètre de l'utilisateur) : ${evidence.maskedTerritories.join(", ") || "aucun"}`,
    ``,
    `FICHE DE VÉRITÉ (ce que la réponse doit couvrir) :`,
    JSON.stringify(sansInstructions(evidence.truth), null, 2),
    ``,
    `MATIÈRE À JUGER :`,
    evidence.matter,
    ``,
    `CRITÈRES :`,
    ...criteria.map(
      (criterion) =>
        `- « ${criterion.id} » (règle : ${criterion.rule}) : ${criterion.instruction}`,
    ),
  ].join("\n");
}

export function toVerdict({
  criteria,
  raw,
}: {
  criteria: JudgedCriterion[];
  raw: z.infer<typeof rawVerdictSchema>;
}): Verdict {
  return Object.fromEntries(
    criteria.map((criterion) => {
      const found = raw.verdicts.find((verdict) => verdict.critere === criterion.id);
      return [
        criterion.id,
        found
          ? { conforme: found.conforme, preuve: found.preuve }
          : { conforme: false, preuve: "absent du verdict" },
      ];
    }),
  );
}

```

L'appel au modèle vit dans son propre fichier : `evalModel` importe `Albert`, qui lit la configuration au chargement, ce que les tests unitaires n'ont pas à fournir.

```ts
// evals/3-scenarios/askJudge.ts
import { generateText, Output } from "ai";
import { createEvalModel } from "../evalModel";
import type { Evidence } from "./evidence";
import type { JudgedCriterion } from "./grid";
import {
  buildJudgePrompt,
  JUDGE_MODEL,
  JUDGE_SYSTEM,
  rawVerdictSchema,
  toVerdict,
  type Verdict,
} from "./judge";

/** Un seul appel par tour, pour tous les critères jugés de la grille. */
export async function askJudge({
  evidence,
  criteria,
}: {
  evidence: Evidence;
  criteria: JudgedCriterion[];
}): Promise<Verdict> {
  if (criteria.length === 0) return {};

  const result = await generateText({
    model: createEvalModel(JUDGE_MODEL),
    system: JUDGE_SYSTEM,
    prompt: buildJudgePrompt({ evidence, criteria }),
    output: Output.object({ schema: rawVerdictSchema }),
    temperature: 0,
  });

  return toVerdict({ criteria, raw: result.output });
}
```

- [ ] **Step 6 : Lancer les tests, ils passent**

Run: `pnpm exec vitest run --project server-unit evals/3-scenarios/judge && pnpm exec tsc --noEmit`
Expected: PASS (3 tests), aucune erreur de typage.

- [ ] **Step 7 : Commit**

```bash
git add evals/3-scenarios/evidence.ts evals/3-scenarios/grid.ts evals/3-scenarios/judge.ts evals/3-scenarios/askJudge.ts evals/3-scenarios/judge.unit.test.ts
git commit -m "feat(ppg): grilles de critères et juge à verdict unique par tour (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 7 : La factory `scenarioEval`

**Files:**
- Modify: `evals/3-scenarios/evidence.ts` (ajoute `extractMatter`, `maskedTerritories`, `buildEvidence`)
- Test: `evals/3-scenarios/evidence.unit.test.ts`
- Create: `evals/3-scenarios/scenarioEval.ts`

**Interfaces:**
- Consumes: tout ce qui précède, `construireAgentContextTerritoire` (tâche 1), `AssistantIA.generateText`, `scoreExpectedTools`, `seedEvalWorld`, `seedMondeTerritorial`.
- Produces:

```ts
export type ScenarioCase = {
  question: string;
  reason: string;
  profile?: EvalProfile;
  currentTerritory?: string;               // code, défaut de la suite
  truthScope: TruthScope;
  expected?: ObservedToolCall[];
  forbidden?: string[];
  tableTerritories?: string[];             // codes
};

export type ScenarioTurn = AgentTurn & {
  turnId: string;
  question: string;
  profile: EvalProfile;
  currentTerritory: string;
  toolResults: { toolName: string; input: unknown; output: unknown }[];
  userTerritories: string[];
  truth: GroundTruth;
  tableTerritories: string[];
};

export function extractMatter({ kind, text, toolCalls, toolResults }): { matter: string; dashboard: ComposeDashboardOutput | null };
export function maskedTerritories({ toolResults, userTerritories }): string[];
export function buildEvidence({ turn, grid }: { turn: ScenarioTurn; grid: Grid }): Evidence;
export function scenarioEval({ suite, group, grid, cases, profile, currentTerritory }): void;
export const GROUPS = { synthese: "3.1 · Synthèse", comparaison: "3.2 · Comparaison" };
```

- [ ] **Step 1 : Écrire les tests de la matière et du masquage**

```ts
// evals/3-scenarios/evidence.unit.test.ts
import { extractMatter, maskedTerritories } from "./evidence";

describe("extractMatter", () => {
  test("texte : la réponse telle quelle", () => {
    expect(
      extractMatter({ kind: "text", text: "Voici la synthèse.", toolCalls: [], toolResults: [] }),
    ).toEqual({ matter: "Voici la synthèse.", dashboard: null });
  });

  test("rapport absent : le dit au juge au lieu de juger le chat", () => {
    const { matter } = extractMatter({
      kind: "rapport",
      text: "Voici la synthèse de la Bretagne…",
      toolCalls: [{ toolName: "get_chantiers", input: {} }],
      toolResults: [],
    });

    expect(matter).toBe(
      "AUCUN RAPPORT EXPORTÉ : l'assistant n'a pas appelé l'outil d'export.\n\nRÉPONSE DU CHAT :\nVoici la synthèse de la Bretagne…",
    );
  });

  test("rapport exporté : rend le contenu passé à l'outil, puis la réponse du chat", () => {
    const { matter } = extractMatter({
      kind: "rapport",
      text: "Votre rapport est disponible au téléchargement.",
      toolCalls: [
        {
          toolName: "export_rapport",
          input: {
            nom_fichier: "synthese-bretagne",
            titre: "Synthèse Bretagne",
            date: "30/09/2026",
            resume: "Résumé.",
            format: "markdown",
            sections: [{ titre: "Chantiers en retard", parties: [{ type: "paragraphe", contenu: "CH-005" }] }],
          },
        },
      ],
      toolResults: [],
    });

    expect(matter).toContain("Synthèse Bretagne");
    expect(matter).toContain("Chantiers en retard");
    expect(matter).toContain("RÉPONSE DU CHAT :\nVotre rapport est disponible au téléchargement.");
  });

  test("dashboard : décrit chaque section et ses widgets, puis le texte", () => {
    const dashboard = {
      titre: "Bretagne",
      containers: [
        { widgets: [{ type: "widget_taux_avancement_territoire", territoire_code: "REG-53", jalon: 2025 }] },
        { widgets: [{ type: "widget_titre_section", titre: "CH-005 — Urgences" }, { type: "widget_cartographie_meteo", chantier_id: "CH-005", maille: "departementale" }] },
      ],
      _output_instructions: "",
    };

    const result = extractMatter({
      kind: "dashboard",
      text: "Voici le tableau de bord.",
      toolCalls: [],
      toolResults: [{ toolName: "create_dashboard", input: {}, output: dashboard }],
    });

    expect(result.dashboard).toEqual(dashboard);
    expect(result.matter).toBe(
      [
        "TABLEAU DE BORD « Bretagne »",
        "Section 1 :",
        '- widget_taux_avancement_territoire {"territoire_code":"REG-53","jalon":2025}',
        "Section 2 :",
        '- widget_titre_section {"titre":"CH-005 — Urgences"}',
        '- widget_cartographie_meteo {"chantier_id":"CH-005","maille":"departementale"}',
        "",
        "TEXTE D'ACCOMPAGNEMENT :",
        "Voici le tableau de bord.",
      ].join("\n"),
    );
  });

  test("dashboard absent : le dit au juge", () => {
    expect(
      extractMatter({ kind: "dashboard", text: "Voici…", toolCalls: [], toolResults: [] }).matter,
    ).toBe("AUCUN TABLEAU DE BORD COMPOSÉ : l'assistant n'a pas appelé l'outil de dashboard.\n\nTEXTE D'ACCOMPAGNEMENT :\nVoici…");
  });
});

describe("maskedTerritories", () => {
  test("retient les territoires hors périmètre rendus par un outil de données", () => {
    expect(
      maskedTerritories({
        userTerritories: ["REG-53", "DEPT-35"],
        toolResults: [
          { toolName: "get_chantiers", input: {}, output: { resultats: [{ territoire_code: "REG-53" }, { territoire_code: "REG-52" }] } },
          { toolName: "get_chantier_commentaires", input: {}, output: { resultats: [{ territoire_code: "REG-84" }] } },
          { toolName: "get_taux_avancement_territoire", input: {}, output: { resultats: [{ territoire_code: "REG-93" }] } },
        ],
      }),
    ).toEqual(["REG-52", "REG-84"]);
  });
});
```

`get_taux_avancement_territoire` n'est pas compté : il ne masque rien, le taux est toujours visible.

- [ ] **Step 2 : Lancer les tests, ils échouent**

Run: `pnpm exec vitest run --project server-unit evals/3-scenarios/evidence`
Expected: FAIL, `extractMatter` n'existe pas.

- [ ] **Step 3 : Implémenter la matière et le masquage**

Ajouter à `evals/3-scenarios/evidence.ts` :

```ts
import { buildRapportMarkdown } from "@/server/albert/markdown/buildRapportMarkdown";
import type { Grid, MatterKind } from "./grid";

type ToolResult = { toolName: string; input: unknown; output: unknown };

function describeDashboard(dashboard: ComposeDashboardOutput): string {
  return [
    `TABLEAU DE BORD « ${dashboard.titre} »`,
    ...dashboard.containers.flatMap((container, index) => [
      `Section ${index + 1} :`,
      ...container.widgets.map((widget) => {
        const { type, ...rest } = widget;
        return `- ${type} ${JSON.stringify(rest)}`;
      }),
    ]),
  ].join("\n");
}

/**
 * Ce que le juge lit. Quand le livrable est un artefact, le texte du chat n'en
 * est qu'un accompagnement : le juger à sa place noterait une phrase
 * d'annonce, c'était le défaut du juge du spike. Quand l'artefact manque, la
 * matière le dit en tête, et les critères du livrable tombent.
 */
export function extractMatter({
  kind,
  text,
  toolCalls,
  toolResults,
}: {
  kind: MatterKind;
  text: string;
  toolCalls: ObservedToolCall[];
  toolResults: ToolResult[];
}): { matter: string; dashboard: ComposeDashboardOutput | null } {
  if (kind === "rapport") {
    const exportCall = toolCalls.find((call) => call.toolName === "export_rapport");
    const rapport = exportCall
      ? buildRapportMarkdown(exportCall.input as Parameters<typeof buildRapportMarkdown>[0])
      : "AUCUN RAPPORT EXPORTÉ : l'assistant n'a pas appelé l'outil d'export.";
    return { matter: `${rapport}\n\nRÉPONSE DU CHAT :\n${text}`, dashboard: null };
  }

  if (kind === "dashboard") {
    const result = toolResults.find((toolResult) => toolResult.toolName === "create_dashboard");
    const dashboard = (result?.output as ComposeDashboardOutput | undefined) ?? null;
    const description = dashboard
      ? describeDashboard(dashboard)
      : "AUCUN TABLEAU DE BORD COMPOSÉ : l'assistant n'a pas appelé l'outil de dashboard.";
    return { matter: `${description}\n\nTEXTE D'ACCOMPAGNEMENT :\n${text}`, dashboard };
  }

  return { matter: text, dashboard: null };
}

const OUTILS_QUI_MASQUENT = ["get_chantiers", "get_chantier_commentaires"];

export function maskedTerritories({
  toolResults,
  userTerritories,
}: {
  toolResults: ToolResult[];
  userTerritories: string[];
}): string[] {
  const codes = toolResults
    .filter((result) => OUTILS_QUI_MASQUENT.includes(result.toolName))
    .flatMap(
      (result) =>
        ((result.output as { resultats?: { territoire_code: string }[] }).resultats ?? []).map(
          (resultat) => resultat.territoire_code,
        ),
    )
    .filter((code) => !userTerritories.includes(code));
  return [...new Set(codes)].sort();
}
```

Si `buildRapportMarkdown` produit une sortie différente de ce qu'attend le troisième test (titres absents), lire `src/server/albert/markdown/buildRapportMarkdown.ts` et ajuster uniquement les `toContain` du test aux libellés réellement produits.

- [ ] **Step 4 : Lancer les tests, ils passent**

Run: `pnpm exec vitest run --project server-unit evals/3-scenarios/evidence`
Expected: PASS (6 tests).

- [ ] **Step 5 : Écrire la factory**

```ts
// evals/3-scenarios/scenarioEval.ts
import { randomUUID } from "node:crypto";
import { createScorer, evalite } from "evalite";
import { AssistantIA } from "@/server/albert/AssistantIA";
import { construireAgentContextTerritoire } from "@/components/PageAccueil/agentContextTerritoire";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { EVAL_TIMEOUT_MS, seedEvalWorld, type EvalProfile } from "../world";
import { scoreExpectedTools } from "../scoreExpectedTools";
import type { AgentTurn, ObservedToolCall } from "../types";
import { extractMatter, maskedTerritories, type Evidence } from "./evidence";
import type { Criterion, Grid, JudgedCriterion } from "./grid";
import { readGroundTruth, type GroundTruth, type TruthScope } from "./groundTruth";
import { askJudge } from "./askJudge";
import type { Verdict } from "./judge";
import { seedMondeTerritorial } from "./mondeTerritorial";
import { JALON_COURANT } from "./territoires";

/**
 * Evalite trie les suites par ordre alphabétique du nom et ne sait pas les
 * grouper : le préfixe range par niveau, puis dans l'ordre des groupes de
 * l'écran d'accueil.
 */
export const GROUPS = {
  synthese: "3.1 · Synthèse",
  comparaison: "3.2 · Comparaison",
};

export type ScenarioCase = {
  /** Le message tel qu'il part, trou complété pour un scénario à compléter. */
  question: string;
  /** Comment le trou a été complété, ou le piège visé. */
  reason: string;
  profile?: EvalProfile;
  currentTerritory?: string;
  truthScope: TruthScope;
  expected?: ObservedToolCall[];
  forbidden?: string[];
  tableTerritories?: string[];
};

/**
 * Les scorers tournent APRÈS la `task`, donc après le rollback : tout ce
 * qu'ils lisent voyage dans le tour.
 */
export type ScenarioTurn = AgentTurn & {
  turnId: string;
  question: string;
  profile: EvalProfile;
  currentTerritory: string;
  toolResults: { toolName: string; input: unknown; output: unknown }[];
  userTerritories: string[];
  truth: GroundTruth;
  tableTerritories: string[];
};

export function buildEvidence({ turn, grid }: { turn: ScenarioTurn; grid: Grid }): Evidence {
  const { matter, dashboard } = extractMatter({
    kind: grid.matter,
    text: turn.text,
    toolCalls: turn.toolCalls,
    toolResults: turn.toolResults,
  });

  return {
    question: turn.question,
    profile: turn.profile,
    currentTerritory: turn.currentTerritory,
    answer: turn.text,
    matter,
    dashboard,
    toolCalls: turn.toolCalls,
    toolResults: turn.toolResults.map(({ toolName, output }) => ({ toolName, output })),
    maskedTerritories: maskedTerritories({
      toolResults: turn.toolResults,
      userTerritories: turn.userTerritories,
    }),
    truth: turn.truth,
    tableTerritories: turn.tableTerritories,
  };
}

/**
 * Un appel de juge par tour, partagé par tous les scorers jugés. La clé est
 * l'identifiant du tour, pas l'objet : rien ne garantit qu'Evalite passe la
 * même référence à chaque scorer.
 */
const verdicts = new Map<string, Promise<Verdict>>();

function verdictFor({ turn, grid }: { turn: ScenarioTurn; grid: Grid }) {
  const cached = verdicts.get(turn.turnId);
  if (cached) return cached;

  const evidence = buildEvidence({ turn, grid });
  const criteria = grid.criteria.filter(
    (criterion): criterion is JudgedCriterion =>
      criterion.kind === "judged" && (criterion.applicable?.(evidence) ?? true),
  );
  const verdict = askJudge({ evidence, criteria });
  verdicts.set(turn.turnId, verdict);
  return verdict;
}

function criterionScorer({ criterion, grid }: { criterion: Criterion; grid: Grid }) {
  return createScorer<ScenarioCase, ScenarioTurn, unknown>({
    name: criterion.id,
    description: `${criterion.kind === "judged" ? "Jugé" : "Mécanique"} — ${criterion.rule}`,
    scorer: async ({ output }) => {
      const evidence = buildEvidence({ turn: output, grid });

      // Evalite compte un score `null` comme 0 : un critère sans objet note 1,
      // et le dit sous le score pour que le rapport l'affiche « — ».
      if (criterion.applicable && !criterion.applicable(evidence)) {
        return { score: 1, metadata: "sans objet" };
      }

      if (criterion.kind === "mechanical") {
        const result = criterion.check(evidence);
        return { score: result.ok ? 1 : 0, metadata: result.detail };
      }

      const verdict = (await verdictFor({ turn: output, grid }))[criterion.id];
      return {
        score: verdict?.conforme ? 1 : 0,
        metadata: verdict?.preuve ?? "absent du verdict",
      };
    },
  });
}

function decrireAppel({ toolName, input }: ObservedToolCall) {
  return `${toolName}(${JSON.stringify(input ?? {})})`;
}

export function scenarioEval({
  suite,
  group,
  grid,
  cases,
  profile = "ditp",
  currentTerritory = "REG-53",
}: {
  suite: string;
  group: keyof typeof GROUPS;
  grid: Grid;
  cases: ScenarioCase[];
  profile?: EvalProfile;
  currentTerritory?: string;
}) {
  evalite<ScenarioCase, ScenarioTurn, ObservedToolCall[] | undefined>(
    `${GROUPS[group]} · ${suite}`,
    {
      data: () => cases.map((testCase) => ({ input: testCase, expected: testCase.expected })),

      task: async (input) => {
        let turn: ScenarioTurn | undefined;
        const caseProfile = input.profile ?? profile;
        const caseTerritory = input.currentTerritory ?? currentTerritory;

        await createIntegrationTest(
          async () => {
            const world = await seedEvalWorld();
            await seedMondeTerritorial({ authorId: world.userId });
            const user = world.users[caseProfile];

            const truth = await readGroundTruth({ scope: input.truthScope, user });

            const result = await AssistantIA.generateText({
              chatId: randomUUID(),
              question: input.question,
              habilitations: user.habilitations,
              agentContext: construireAgentContextTerritoire({
                territoireCode: caseTerritory,
                jalon: JALON_COURANT,
              }),
              userId: user.userId,
            });

            turn = {
              turnId: randomUUID(),
              question: input.question,
              profile: caseProfile,
              currentTerritory: caseTerritory,
              toolCalls: result.steps.flatMap((step) =>
                step.toolCalls.map((call) => ({ toolName: call.toolName, input: call.input })),
              ),
              toolResults: result.steps.flatMap((step) =>
                step.toolResults.map((toolResult) => ({
                  toolName: toolResult.toolName,
                  input: toolResult.input,
                  output: toolResult.output,
                })),
              ),
              text: result.text,
              stepCount: result.steps.length,
              userTerritories: user.habilitations.lecture.territoires,
              truth,
              tableTerritories: input.tableTerritories ?? [],
            };
          },
          { timeout: EVAL_TIMEOUT_MS },
        )();

        return turn!;
      },

      trialCount: 3,

      scorers: [
        {
          name: "Outils attendus",
          description:
            "L'appel doit porter au moins les arguments attendus, et aucun outil interdit ne doit être appelé.",
          scorer: ({ input, output, expected }) =>
            scoreExpectedTools({ output, expected, forbidden: input.forbidden }),
        },
        ...grid.criteria.map((criterion) => criterionScorer({ criterion, grid })),
      ],

      columns: ({ input, output }) => [
        { label: "Scénario", value: input.reason },
        { label: "Profil", value: input.profile ?? profile },
        {
          label: "Outils appelés",
          value: output.toolCalls.map(decrireAppel).join("\n→ ") || "—",
        },
        { label: "Réponse", value: output.text.slice(0, 500) },
        ...(grid.matter === "dashboard"
          ? [
              {
                label: "Widgets",
                value:
                  extractMatter({
                    kind: "dashboard",
                    text: "",
                    toolCalls: output.toolCalls,
                    toolResults: output.toolResults,
                  }).dashboard?.containers
                    .map(
                      (container, index) =>
                        `${index + 1}. ${container.widgets.map((widget) => widget.type.replace("widget_", "")).join(", ")}`,
                    )
                    .join("\n") ?? "—",
              },
            ]
          : []),
      ],
    },
  );
}
```

- [ ] **Step 6 : Vérifier le typage**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur. Si `createScorer` n'accepte pas de `metadata` de type `string` pour ce générique, typer le retour `{ score: number; metadata: unknown }` comme dans l'ancien `judge.ts` supprimé à la tâche 1 (il utilisait la même forme).

- [ ] **Step 7 : Commit**

```bash
git add evals/3-scenarios/evidence.ts evals/3-scenarios/evidence.unit.test.ts evals/3-scenarios/scenarioEval.ts
git commit -m "feat(ppg): factory scenarioEval, un scorer par critère de la grille (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 8 : Les grilles des familles

**Files:**
- Create: `evals/3-scenarios/grids.ts`

**Interfaces:**
- Consumes: `grid`, `mechanical`, `judged`, `BASE_IDS` (tâche 6), vérifications (tâche 5), `chantiersAttendus` (tâche 4).
- Produces: `GRIDS` avec les clés `syntheseTerritoire`, `syntheseChantier`, `syntheseSousTerritoires`, `chantiersEnRetard`, `rapport`, `dashboard`, `commentaires`, `comparaisonTerritoires`, `comparaisonJalons`, `comparaisonSousTerritoires`, `comparaisonQuantitative`.

- [ ] **Step 1 : Écrire les grilles**

Chaque critère cite la règle du prompt qu'il vérifie. Les identifiants sont ce qui apparaîtra dans le tableau pour Benjamin : courts et parlants.

```ts
// evals/3-scenarios/grids.ts
import type { Evidence } from "./evidence";
import { BASE_IDS, grid, judged, mechanical } from "./grid";
import { chantiersAttendus } from "./groundTruth";
import {
  checkChantiersCited,
  checkContains,
  checkExactAnswer,
  checkHasTable,
  checkHeadings,
  checkNoChantierTable,
  checkNoFigure,
  checkNoLink,
  checkTableTerritories,
} from "./mechanicalChecks";

const nomsDuTableau = (evidence: Evidence) =>
  evidence.tableTerritories.map(
    (code) => evidence.truth.territoires.find((territoire) => territoire.code === code)?.nom ?? code,
  );

const territoirePrincipalEstUnDepartement = (evidence: Evidence) =>
  evidence.truth.territoires[0]?.maille === "dept";

const RESUMES_CONDENSES = judged({
  id: "Résumés condensés",
  rule: "Commentaires : condense en 1-2 phrases factuelles, jamais in extenso ; « Pas de commentaire disponible » sinon",
  instruction:
    "Sous chaque chantier listé, un résumé de 1 à 2 phrases du commentaire de synthèse de la fiche, reformulé et non recopié mot pour mot. Un chantier dont la synthèse n'a pas de commentaire (commentaire null dans la fiche) porte exactement « Pas de commentaire disponible ».",
});

const TABLEAU_COMPARATIF = mechanical({
  id: "Tableau comparatif",
  rule: "get_taux_avancement_territoire : plusieurs territoires → tableau comparatif ; Tableaux autorisés pour les comparaisons",
  check: (evidence) => checkHasTable({ text: evidence.matter }),
});

const TERRITOIRES_DU_TABLEAU = mechanical({
  id: "Territoires du tableau",
  rule: "Format : codes et noms officiels des territoires",
  check: (evidence) =>
    checkTableTerritories({ text: evidence.matter, noms: nomsDuTableau(evidence) }),
});

const ANALYSE_DES_ECARTS = judged({
  id: "Analyse des écarts",
  rule: "Comparaison : décris factuellement qui est en avance, qui est en retard, de combien de points",
  instruction:
    "La réponse dit quel territoire est devant, lequel est derrière, et de combien de points de taux d'avancement, avec des valeurs conformes aux données reçues.",
});

const POSITION_MEDIANE = judged({
  id: "Position face à la médiane",
  rule: "Écart à la médiane : EN RETARD <= -10, EN AVANCE >= +10, DANS LA MÉDIANE entre les deux",
  instruction:
    "Chaque territoire est situé face à la médiane de SA maille (une région face aux régions, un département face aux départements), avec la position rendue par les données (en retard, dans la médiane, en avance).",
});

export const GRIDS = {
  syntheseTerritoire: grid({
    family: "Synthèse d'un territoire",
    matter: "text",
    criteria: [
      mechanical({
        id: "Sections du gabarit",
        rule: "Gabarit mono_territoire : titre, chantiers en retard, chantiers en difficulté, sources",
        check: (evidence) => {
          const titres = checkHeadings({
            text: evidence.matter,
            titles: ["Synthèse pour", "Chantiers en retard", "Chantiers en difficulté"],
          });
          return titres.ok
            ? checkContains({ text: evidence.matter, fragments: ["Sources analysées"] })
            : titres;
        },
      }),
      mechanical({
        id: "Chantiers cités",
        rule: "Format des chantiers : chaque chantier au format CH-XXX — Nom",
        check: (evidence) =>
          checkChantiersCited({
            text: evidence.matter,
            chantiers: chantiersAttendus({ truth: evidence.truth, view: "tous" }),
          }),
      }),
      mechanical({
        id: "Synthèses de tendance",
        rule: "Gabarit mono_territoire : « Synthèse — chantiers en retard » et « Synthèse — chantiers en difficulté »",
        check: (evidence) =>
          checkContains({
            text: evidence.matter.replace(/[*_]/g, ""),
            fragments: ["Synthèse — chantiers en retard", "Synthèse — chantiers en difficulté"],
          }),
      }),
      mechanical({
        id: "Pas de tableau",
        rule: "Tableaux : pas de tableau pour les listes de chantiers",
        check: (evidence) => checkNoChantierTable({ text: evidence.matter }),
      }),
      judged({
        id: "Écart et météo",
        rule: "Gabarit mono_territoire : écart en points et météo (libellé) pour chaque chantier",
        instruction:
          "Chaque chantier listé porte son écart en points et le libellé de sa météo, conformes à la fiche.",
      }),
      RESUMES_CONDENSES,
      judged({
        id: "Maille nommée",
        rule: "Factualité : n'affirme rien de faux ; le gabarit écrit « de la région » quel que soit le territoire",
        instruction:
          "Le territoire est désigné par sa maille réelle : un département n'est jamais présenté comme « la région ».",
        applicable: territoirePrincipalEstUnDepartement,
      }),
    ],
  }),

  syntheseChantier: grid({
    family: "Synthèse d'un chantier sur un territoire",
    matter: "text",
    criteria: [
      mechanical({
        id: "Pas le gabarit territorial",
        rule: "Workflow a : le gabarit de synthèse territoriale ne vaut que pour une demande qui ne cible pas un chantier spécifique",
        check: (evidence) => {
          const gabarit = checkHeadings({
            text: evidence.matter,
            titles: ["Chantiers en retard", "Chantiers en difficulté"],
          });
          return gabarit.ok
            ? { ok: false, detail: "la réponse suit le gabarit de synthèse territoriale" }
            : { ok: true, detail: "réponse centrée sur le chantier" };
        },
      }),
      judged({
        id: "Trois volets",
        rule: "Demande : synthèse du chantier, position face aux autres territoires, difficultés des commentaires",
        instruction:
          "La réponse traite les trois volets de la demande : la synthèse du chantier sur le territoire, sa position face à d'autres territoires, les difficultés remontées dans les commentaires.",
      }),
      judged({
        id: "Situé face aux autres territoires",
        rule: "Comparer des territoires entre eux",
        instruction:
          "Le chantier est situé face à au moins un autre territoire avec des valeurs chiffrées (taux ou écart) issues des données reçues. Une position sans chiffre est non conforme.",
      }),
      judged({
        id: "Difficultés tirées des commentaires",
        rule: "Commentaires : extrais les idées clés sans interprétation",
        instruction:
          "Les difficultés citées proviennent des commentaires reçus (délais, postes vacants, fermetures de lignes…), reformulées, sans difficulté inventée.",
      }),
    ],
  }),

  syntheseSousTerritoires: grid({
    family: "Synthèse d'une région et de ses départements",
    matter: "text",
    criteria: [
      mechanical({
        id: "Sections du gabarit comparaison",
        rule: "Gabarit : plusieurs territoires dans les résultats → template comparaison",
        check: (evidence) =>
          checkHeadings({
            text: evidence.matter,
            titles: ["Comparaison", "Analyse des écarts", "Chantiers en retard", "Chantiers en difficulté"],
          }),
      }),
      TABLEAU_COMPARATIF,
      TERRITOIRES_DU_TABLEAU,
      ANALYSE_DES_ECARTS,
      judged({
        id: "Communs et spécifiques",
        rule: "Gabarit comparaison : chantiers communs à plusieurs territoires, puis spécifiques à chacun",
        instruction:
          "Les chantiers en retard ou en difficulté présents dans plusieurs territoires sont regroupés en « communs » avec la liste des territoires concernés ; les autres sont rangés sous leur territoire.",
      }),
      RESUMES_CONDENSES,
    ],
  }),

  chantiersEnRetard: grid({
    family: "Chantiers en retard et leurs indicateurs",
    matter: "text",
    criteria: [
      mechanical({
        id: "Chantiers en retard cités",
        rule: "Format des chantiers : chaque chantier au format CH-XXX — Nom",
        check: (evidence) =>
          checkChantiersCited({
            text: evidence.matter,
            chantiers: chantiersAttendus({ truth: evidence.truth, view: "en_retard" }),
          }),
      }),
      judged({
        id: "Écart par chantier",
        rule: "get_chantiers en_retard : indique l'écart par rapport à la médiane (en points) et la météo",
        instruction:
          "Chaque chantier en retard porte son écart à la médiane en points et sa météo (libellé), conformes à la fiche.",
      }),
      judged({
        id: "Valeurs des indicateurs",
        rule: "Demande : les valeurs des indicateurs de chaque chantier en retard (VI, VA, VC, TA)",
        instruction:
          "Pour chaque chantier en retard, la réponse donne les valeurs de ses indicateurs (valeur initiale, actuelle, cible, taux d'avancement) conformes à la fiche. Renvoyer vers un tableau de bord ou dire que l'affichage est impossible est non conforme.",
      }),
    ],
  }),

  rapport: grid({
    family: "Rapport complet",
    matter: "rapport",
    criteria: [
      mechanical({
        id: "Export appelé",
        rule: "Workflow c : appelle export_rapport avec les données structurées",
        check: (evidence) => {
          const call = evidence.toolCalls.find((toolCall) => toolCall.toolName === "export_rapport");
          if (!call) return { ok: false, detail: "export non appelé" };
          const format = (call.input as { format?: string }).format ?? "markdown";
          return format === "markdown"
            ? { ok: true, detail: "export markdown" }
            : { ok: false, detail: `format ${format} au lieu de markdown` };
        },
      }),
      mechanical({
        id: "Réponse du chat",
        rule: "Workflow c : réponds « Votre rapport est disponible au téléchargement. », n'invente jamais de lien",
        check: (evidence) => {
          const lien = checkNoLink({ text: evidence.answer });
          return lien.ok
            ? checkExactAnswer({
                text: evidence.answer,
                expected: "Votre rapport est disponible au téléchargement.",
              })
            : lien;
        },
      }),
      judged({
        id: "Sections demandées",
        rule: "Demande : taux d'avancement, chantiers en retard, chantiers en difficulté et leurs indicateurs",
        instruction:
          "Le rapport exporté contient le taux d'avancement du territoire, les chantiers en retard, les chantiers en difficulté, et les indicateurs de ces chantiers. Sans rapport exporté, non conforme.",
      }),
      judged({
        id: "Tableau d'indicateurs",
        rule: "Export : tu DOIS inclure les données des indicateurs sous forme de tableau dans le rapport",
        instruction:
          "Le rapport exporté présente les indicateurs de chaque chantier cité sous forme de tableau. Sans rapport exporté, non conforme.",
      }),
    ],
  }),

  dashboard: grid({
    family: "Tableau de bord du territoire",
    matter: "dashboard",
    omit: [BASE_IDS.restriction],
    criteria: [
      mechanical({
        id: "Sections dans l'ordre",
        rule: "Demande : une première section territoire, puis une section par chantier en retard ou en difficulté",
        check: (evidence) => {
          if (!evidence.dashboard) return { ok: false, detail: "aucun dashboard" };
          const chantiersParSection = evidence.dashboard.containers.map((container) => [
            ...new Set(
              container.widgets
                .filter((widget) => "chantier_id" in widget)
                .map((widget) => (widget as { chantier_id: string }).chantier_id),
            ),
          ]);
          const [premiere, ...suivantes] = chantiersParSection;
          const attendus = chantiersAttendus({ truth: evidence.truth, view: "tous" }).map(
            (chantier) => chantier.id,
          );
          const obtenus = suivantes.map((ids) => ids.join("+")).sort();
          if (premiere.length > 0) {
            return { ok: false, detail: "la première section porte sur un chantier" };
          }
          return JSON.stringify(obtenus) === JSON.stringify(attendus)
            ? { ok: true, detail: `une section par chantier : ${attendus.join(", ")}` }
            : { ok: false, detail: `sections chantier : ${obtenus.join(", ") || "aucune"}, attendu ${attendus.join(", ")}` };
        },
      }),
      mechanical({
        id: "Pas de chiffre dans le texte",
        rule: "create_dashboard : ne reproduis JAMAIS de valeurs chiffrées dans ta réponse textuelle",
        check: (evidence) => checkNoFigure({ text: evidence.answer }),
      }),
      judged({
        id: "Widgets conformes à la demande",
        rule: "create_dashboard : task décrit ce que l'utilisateur veut voir",
        instruction:
          "Types de widgets disponibles : taux_avancement_territoire (TA d'un territoire), mediane_avancement_territoire, nombre_chantiers_en_retard, nombre_chantiers_en_difficulte, valeurs_remarquables_avancement, tableau_indicateurs_chantier (indicateurs d'un chantier), liste_chantiers_en_retard, liste_chantiers_en_difficulte, cartographie_taux_avancement, cartographie_meteo (météo d'un chantier par territoire), cartographie_propositions_valeur_avancement, evolution_taux_avancement, evolution_valeur_avancement, titre_section, paragraph. Chaque élément que la demande énumère pour une section est présent avec le widget qui lui correspond (un paragraphe pour la météo et le commentaire de synthèse), et aucun widget étranger à la demande n'est ajouté.",
      }),
    ],
  }),

  commentaires: grid({
    family: "Synthèse des commentaires",
    matter: "text",
    criteria: [
      judged({
        id: "Une synthèse par chantier",
        rule: "Demande : synthétise les commentaires de chaque chantier cité",
        instruction:
          "Chaque chantier de la demande a sa propre synthèse, au format CH-XXX — Nom. Un chantier sans commentaire dans les données reçues est signalé comme tel, sans contenu inventé.",
      }),
      judged({
        id: "Actions identifiées",
        rule: "Demande : notamment les principales actions identifiées",
        instruction:
          "Les actions citées (recrutements, ouvertures, campagnes…) proviennent des commentaires reçus. Si les données reçues signalent des types non accessibles, la réponse dit que ces informations relèvent de la vue nationale, et non qu'il n'y en a pas.",
      }),
      judged({
        id: "Pas de recopie",
        rule: "Commentaires : condense et reformule, ne reproduis jamais un commentaire in extenso",
        instruction:
          "Aucun commentaire n'est recopié mot pour mot sur plus d'une phrase : l'utilisateur a demandé une synthèse.",
      }),
    ],
  }),

  comparaisonTerritoires: grid({
    family: "Comparer avec un autre territoire",
    matter: "text",
    criteria: [TABLEAU_COMPARATIF, TERRITOIRES_DU_TABLEAU, ANALYSE_DES_ECARTS, POSITION_MEDIANE],
  }),

  comparaisonJalons: grid({
    family: "Comparer les taux entre deux jalons",
    matter: "text",
    omit: [BASE_IDS.restriction],
    criteria: [
      judged({
        id: "Évolution entre jalons",
        rule: "Workflow b : compare les résultats et présente l'évolution",
        instruction:
          "Si des données existent aux deux jalons, la réponse donne le taux à chaque jalon et l'évolution en points avec son sens (hausse ou baisse), conformes aux données reçues.",
      }),
      judged({
        id: "Données indisponibles dites",
        rule: "Gestion des erreurs : si aucun résultat n'est disponible pour un jalon, indique que les données ne sont pas disponibles",
        instruction:
          "Si les données reçues pour un jalon sont vides ou sans taux, la réponse le dit explicitement au lieu d'afficher une valeur ; sinon ce critère est conforme.",
      }),
    ],
  }),

  comparaisonSousTerritoires: grid({
    family: "Comparer une région avec ses départements",
    matter: "text",
    omit: [BASE_IDS.restriction],
    criteria: [TABLEAU_COMPARATIF, TERRITOIRES_DU_TABLEAU, ANALYSE_DES_ECARTS, POSITION_MEDIANE],
  }),

  comparaisonQuantitative: grid({
    family: "Comparaison quantitative des territoires",
    matter: "text",
    omit: [BASE_IDS.restriction],
    criteria: [TABLEAU_COMPARATIF, TERRITOIRES_DU_TABLEAU, ANALYSE_DES_ECARTS, POSITION_MEDIANE],
  }),
};
```

- [ ] **Step 2 : Vérifier le typage et l'unicité des identifiants**

La fonction `grid` lève une erreur au chargement si deux critères d'une grille partagent un identifiant.

Run: `pnpm exec tsc --noEmit && node --import tsx -e "import('./evals/3-scenarios/grids.ts').then(() => console.log('grilles OK'))"`
Expected: `grilles OK`. Si `tsx` n'est pas disponible, sauter la seconde commande : la tâche 9 charge les grilles dans un test unitaire.

- [ ] **Step 3 : Commit**

```bash
git add evals/3-scenarios/grids.ts
git commit -m "feat(ppg): grilles de critères des scénarios, dérivées du prompt système (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 9 : La calibration du juge

**Files:**
- Create: `evals/3-scenarios/3.0-calibration/references.ts`
- Test: `evals/3-scenarios/3.0-calibration/references.unit.test.ts`
- Create: `evals/3-scenarios/3.0-calibration/calibration.eval.ts`

**Interfaces:**
- Consumes: `GRIDS` (tâche 8), `Evidence`, `askJudge`, `Verdict`.
- Produces: `CALIBRATION_CASES: CalibrationCase[]` avec `CalibrationCase = { family: keyof typeof GRIDS; label: string; broken: string | null; evidence: Evidence }`.

Une référence est conforme à tous les critères jugés de sa grille. Un mutant casse **un** critère, nommé dans `broken`. Le verdict attendu s'en déduit : non conforme pour `broken`, conforme pour tous les autres.

- [ ] **Step 1 : Écrire les références et les mutants**

```ts
// evals/3-scenarios/3.0-calibration/references.ts
import type { Evidence } from "../evidence";
import type { GRIDS } from "../grids";
import type { GroundTruth } from "../groundTruth";

export type CalibrationCase = {
  family: keyof typeof GRIDS;
  label: string;
  /** Identifiant du critère cassé ; `null` pour la référence. */
  broken: string | null;
  evidence: Evidence;
};

const CH_005 = { id: "CH-005", nom: "Réduire les délais de passage aux urgences" };
const CH_006 = { id: "CH-006", nom: "Développer la prévention en santé" };

const chantier = ({
  id,
  nom,
  ecart,
  meteo,
  commentaire,
}: {
  id: string;
  nom: string;
  ecart: number;
  meteo: string;
  commentaire: string | null;
}) => ({
  chantier: { id, nom, axe: "non renseigné", ppg: "non renseignée", ministeres: [], mailles_applicables: ["NAT", "REG", "DEPT"] },
  meteo,
  tendance: null,
  ecart,
  taux_avancement: null,
  est_en_retard: ecart <= -10,
  est_en_difficulte: ecart > -10,
  synthese: { meteo, commentaire, date_meteo: null, date_commentaire: null },
  commentaires: { donnees: null, autresResultats: null },
});

/** Une fiche figée, recopiée d'un run du monde territorial, pour la Bretagne. */
const FICHE_BRETAGNE: GroundTruth = {
  territoires: [{ code: "REG-53", nom: "Bretagne", maille: "reg" }],
  tauxAvancement: [
    { territoire_code: "REG-53", jalon: 2025, taux_avancement_global: "51%", mediane_repartition: "65%", position_mediane: "EN_RETARD" },
  ],
  chantiersEnRetard: [
    {
      territoire_code: "REG-53",
      territoire_nom: "Bretagne",
      jalon: 2025,
      chantiers: [
        chantier({
          ...CH_005,
          ecart: -15,
          meteo: "NUAGE",
          commentaire:
            "Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre, malgré la régulation téléphonique mise en place en mars.",
        }),
      ],
    },
  ],
  chantiersEnDifficulte: [
    {
      territoire_code: "REG-53",
      territoire_nom: "Bretagne",
      jalon: 2025,
      chantiers: [chantier({ ...CH_006, ecart: 2, meteo: "ORAGE", commentaire: null })],
    },
  ],
  indicateurs: [
    {
      territoire_code: "REG-53",
      chantier_id: "CH-005",
      indicateurs: [
        { indicateur_id: "IND-005", nom: "Délai médian de passage aux urgences", unite_mesure: null, valeur_initiale: 280, date_valeur_initiale: null, valeur_actuelle: 250, date_valeur_actuelle: null, valeur_cible: 180, date_valeur_cible: null, taux_avancement: 30 },
      ],
    },
  ],
  commentaires: [],
};

const TOOL_RESULTS_BRETAGNE = [
  { toolName: "get_taux_avancement_territoire", output: { resultats: FICHE_BRETAGNE.tauxAvancement } },
  { toolName: "get_chantiers", output: { resultats: FICHE_BRETAGNE.chantiersEnRetard } },
  { toolName: "get_chantiers", output: { resultats: FICHE_BRETAGNE.chantiersEnDifficulte } },
  { toolName: "get_indicateurs", output: { resultats: FICHE_BRETAGNE.indicateurs[0] } },
];

const evidence = ({
  question,
  matter,
  profile = "ditp",
  answer = matter,
  toolCalls = [],
  toolResults = TOOL_RESULTS_BRETAGNE,
  dashboard = null,
  maskedTerritories = [],
  truth = FICHE_BRETAGNE,
  tableTerritories = [],
}: Partial<Evidence> & { question: string; matter: string }): Evidence => ({
  question,
  profile,
  currentTerritory: "REG-53",
  answer,
  matter,
  dashboard,
  toolCalls,
  toolResults,
  maskedTerritories,
  truth,
  tableTerritories,
});

const SYNTHESE_REFERENCE = `# Synthèse pour Bretagne

Dans Pilote, le TA 2025 de la région s'établit à 51%, pour une médiane des régions à 65%.

---

## Chantiers en retard

1 chantier est en retard de plus de 10 points par rapport à la médiane nationale :

**CH-005 — Réduire les délais de passage aux urgences**\\
**Écart** : -15 points\\
**Météo** : Appuis nécessaires

> Deux postes d'urgentistes sont vacants à Brest et Quimper, et le délai médian de passage a remonté au premier semestre.

&nbsp;

**Synthèse — chantiers en retard** : le retard porte sur un chantier de santé, avec un écart de 15 points.

---

## Chantiers en difficulté

1 chantier est compromis ou nécessite un appui :

**CH-006 — Développer la prévention en santé**\\
**Écart** : 2 points\\
**Météo** : Objectifs compromis

> Pas de commentaire disponible

&nbsp;

**Synthèse — chantiers en difficulté** : un chantier de santé présente des objectifs compromis.

---

Sources analysées : données quantitatives et qualitatives des chantiers publiés sur PILOTE.`;

const mute = ({ from, to }: { from: string; to: string }) => {
  if (!SYNTHESE_REFERENCE.includes(from)) {
    throw new Error(`Mutation sans effet : « ${from} » absent de la référence`);
  }
  return SYNTHESE_REFERENCE.replace(from, to);
};

const QUESTION_SYNTHESE = "Fais moi la synthèse du territoire Bretagne";

const SYNTHESE: CalibrationCase[] = [
  { family: "syntheseTerritoire", label: "Référence", broken: null, evidence: evidence({ question: QUESTION_SYNTHESE, matter: SYNTHESE_REFERENCE }) },
  {
    family: "syntheseTerritoire",
    label: "Médiane inventée",
    broken: "Chiffres exacts",
    evidence: evidence({ question: QUESTION_SYNTHESE, matter: mute({ from: "médiane des régions à 65%", to: "médiane des régions à 58%" }) }),
  },
  {
    family: "syntheseTerritoire",
    label: "Commentaire recopié",
    broken: "Résumés condensés",
    evidence: evidence({
      question: QUESTION_SYNTHESE,
      matter: mute({
        from: "> Deux postes d'urgentistes sont vacants à Brest et Quimper, et le délai médian de passage a remonté au premier semestre.",
        to: "> Deux postes d'urgentistes restent vacants à Brest et Quimper. Le délai médian de passage remonte à 4 h 10 au premier semestre, malgré la régulation téléphonique mise en place en mars.",
      }),
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Commentaire manquant non signalé",
    broken: "Résumés condensés",
    evidence: evidence({ question: QUESTION_SYNTHESE, matter: mute({ from: "> Pas de commentaire disponible\n\n", to: "" }) }),
  },
  {
    family: "syntheseTerritoire",
    label: "Recommandation",
    broken: "Pas d'opinion",
    evidence: evidence({
      question: QUESTION_SYNTHESE,
      matter: mute({
        from: "avec un écart de 15 points.",
        to: "avec un écart de 15 points. Il conviendrait de renforcer en priorité les recrutements d'urgentistes.",
      }),
    }),
  },
  {
    family: "syntheseTerritoire",
    label: "Écart omis",
    broken: "Écart et météo",
    evidence: evidence({ question: QUESTION_SYNTHESE, matter: mute({ from: "**Écart** : -15 points\\\n", to: "" }) }),
  },
];

const RETARD_QUESTION =
  "Analyse les chantiers en retard sur Bretagne. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.";

const RETARD_REFERENCE = `**CH-005 — Réduire les délais de passage aux urgences**
- Écart à la médiane : -15 points
- Météo : Appuis nécessaires

Indicateur IND-005 — Délai médian de passage aux urgences : valeur initiale 280, valeur actuelle 250, valeur cible 180, taux d'avancement 30 %.`;

const RETARD: CalibrationCase[] = [
  { family: "chantiersEnRetard", label: "Référence", broken: null, evidence: evidence({ question: RETARD_QUESTION, matter: RETARD_REFERENCE }) },
  {
    family: "chantiersEnRetard",
    label: "Renvoi vers un tableau de bord",
    broken: "Valeurs des indicateurs",
    evidence: evidence({
      question: RETARD_QUESTION,
      matter: RETARD_REFERENCE.replace(
        /Indicateur IND-005[^\n]+/,
        "Les valeurs de ses indicateurs peuvent être affichées dans un tableau de bord.",
      ),
    }),
  },
  {
    family: "chantiersEnRetard",
    label: "Valeur actuelle fausse",
    broken: "Chiffres exacts",
    evidence: evidence({ question: RETARD_QUESTION, matter: RETARD_REFERENCE.replace("valeur actuelle 250", "valeur actuelle 210") }),
  },
];

const FICHE_COMPARAISON: GroundTruth = {
  ...FICHE_BRETAGNE,
  territoires: [
    { code: "REG-52", nom: "Pays de la Loire", maille: "reg" },
    { code: "REG-53", nom: "Bretagne", maille: "reg" },
  ],
  tauxAvancement: [
    ...FICHE_BRETAGNE.tauxAvancement,
    { territoire_code: "REG-52", jalon: 2025, taux_avancement_global: "70%", mediane_repartition: "65%", position_mediane: "DANS_LA_MEDIANE" },
  ],
};

const COMPARAISON_QUESTION = "Compare Bretagne avec Pays de la Loire";

const COMPARAISON_REFERENCE = `| Territoire | TA 2025 | Médiane des régions | Position |
|---|---|---|---|
| Bretagne | 51% | 65% | En retard |
| Pays de la Loire | 70% | 65% | Dans la médiane |

Les Pays de la Loire devancent la Bretagne de 19 points de taux d'avancement. La Bretagne se situe 14 points sous la médiane des régions, les Pays de la Loire 5 points au-dessus.`;

const COMPARAISON_EVIDENCE = (matter: string) =>
  evidence({
    question: COMPARAISON_QUESTION,
    matter,
    truth: FICHE_COMPARAISON,
    toolResults: [{ toolName: "get_taux_avancement_territoire", output: { resultats: FICHE_COMPARAISON.tauxAvancement } }],
    tableTerritories: ["REG-53", "REG-52"],
  });

const COMPARAISON: CalibrationCase[] = [
  { family: "comparaisonTerritoires", label: "Référence", broken: null, evidence: COMPARAISON_EVIDENCE(COMPARAISON_REFERENCE) },
  {
    family: "comparaisonTerritoires",
    label: "Sens de l'écart inversé",
    broken: "Analyse des écarts",
    evidence: COMPARAISON_EVIDENCE(
      COMPARAISON_REFERENCE.replace(
        "Les Pays de la Loire devancent la Bretagne de 19 points",
        "La Bretagne devance les Pays de la Loire",
      ),
    ),
  },
  {
    family: "comparaisonTerritoires",
    label: "Position face à la médiane fausse",
    broken: "Position face à la médiane",
    evidence: COMPARAISON_EVIDENCE(
      COMPARAISON_REFERENCE.replace("| Bretagne | 51% | 65% | En retard |", "| Bretagne | 51% | 65% | Dans la médiane |").replace(
        "La Bretagne se situe 14 points sous la médiane des régions, les Pays de la Loire 5 points au-dessus.",
        "Les deux régions se situent dans la médiane.",
      ),
    ),
  },
];

const FICHE_COMMENTAIRES: GroundTruth = { ...FICHE_BRETAGNE, commentaires: [] };

const COMMENTAIRES_RESULTS = [
  {
    toolName: "get_chantier_commentaires",
    output: {
      resultats: [
        {
          territoire_code: "REG-53",
          territoire_nom: "Bretagne",
          chantier_id: "CH-005",
          commentaires: [
            { id: "c1", date_publication: "2026-09-15", type: "autres_resultats_obtenus", contenu: "<p>Mise en place d'un numéro de régulation départemental unique en mars. Action engagée : recrutement de deux urgentistes par contrat de territoire, signature prévue en novembre.</p>" },
          ],
        },
      ],
      types_non_accessibles: ["actions_a_venir", "actions_a_valoriser"],
    },
  },
  {
    toolName: "get_chantier_commentaires",
    output: { resultats: [{ territoire_code: "REG-53", territoire_nom: "Bretagne", chantier_id: "CH-012", commentaires: [] }], types_non_accessibles: ["actions_a_venir", "actions_a_valoriser"] },
  },
];

const COMMENTAIRES_QUESTION =
  "Synthétise les commentaires des chantiers suivants CH-005, CH-012, notamment les principales actions identifiées";

const COMMENTAIRES_REFERENCE = `**CH-005 — Réduire les délais de passage aux urgences**
Un numéro de régulation départemental unique fonctionne depuis mars. Action engagée : le recrutement de deux urgentistes par contrat de territoire, dont la signature est attendue en novembre.

**CH-012 — Développer l'apprentissage**
Aucun commentaire n'est publié pour ce chantier en Bretagne.

Les actions à venir et à valoriser relèvent de la vue nationale, à laquelle vous n'avez pas accès.`;

const COMMENTAIRES_EVIDENCE = (matter: string) =>
  evidence({ question: COMMENTAIRES_QUESTION, matter, truth: FICHE_COMMENTAIRES, toolResults: COMMENTAIRES_RESULTS, profile: "coordinateur" });

const COMMENTAIRES: CalibrationCase[] = [
  { family: "commentaires", label: "Référence", broken: null, evidence: COMMENTAIRES_EVIDENCE(COMMENTAIRES_REFERENCE) },
  {
    family: "commentaires",
    label: "Commentaire inventé pour CH-012",
    broken: "Une synthèse par chantier",
    evidence: COMMENTAIRES_EVIDENCE(
      COMMENTAIRES_REFERENCE.replace(
        "Aucun commentaire n'est publié pour ce chantier en Bretagne.",
        "Les entrées en apprentissage progressent grâce aux salons de l'orientation.",
      ),
    ),
  },
  {
    family: "commentaires",
    label: "Types nationaux présentés comme absents",
    broken: "Actions identifiées",
    evidence: COMMENTAIRES_EVIDENCE(
      COMMENTAIRES_REFERENCE.replace(
        "Les actions à venir et à valoriser relèvent de la vue nationale, à laquelle vous n'avez pas accès.",
        "Aucune action à venir ni à valoriser n'a été identifiée.",
      ),
    ),
  },
  {
    family: "commentaires",
    label: "Commentaire recopié",
    broken: "Pas de recopie",
    evidence: COMMENTAIRES_EVIDENCE(
      COMMENTAIRES_REFERENCE.replace(
        "Un numéro de régulation départemental unique fonctionne depuis mars. Action engagée : le recrutement de deux urgentistes par contrat de territoire, dont la signature est attendue en novembre.",
        "Mise en place d'un numéro de régulation départemental unique en mars. Action engagée : recrutement de deux urgentistes par contrat de territoire, signature prévue en novembre.",
      ),
    ),
  },
];

const DASHBOARD_QUESTION =
  "Compose un tableau de bord pour Bretagne. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement. Ensuite, récupère la liste des chantiers en difficulté et en retard sur ce territoire, et pour chacun, ajoute une section dédiée avec un titre reprenant le nom du chantier, la météo et le commentaire de synthèse, la cartographie météo en pleine largeur et le tableau de ses indicateurs.";

const sectionChantier = (id: string, nom: string) => ({
  widgets: [
    { type: "widget_titre_section" as const, titre: `${id} — ${nom}` },
    { type: "widget_paragraph" as const, contenu: ["Météo : Appuis nécessaires", "Deux postes d'urgentistes sont vacants."] },
    { type: "widget_cartographie_meteo" as const, chantier_id: id, maille: "departementale" as const, width: 4 as const },
    { type: "widget_tableau_indicateurs_chantier" as const, chantier_id: id, territoire_code: "REG-53", jalon: 2025 },
  ],
});

const DASHBOARD_REFERENCE = {
  titre: "Tableau de bord Bretagne",
  containers: [
    {
      widgets: [
        { type: "widget_taux_avancement_territoire" as const, territoire_code: "REG-53", jalon: 2025 },
        { type: "widget_nombre_chantiers_en_retard" as const, territoire_code: "REG-53", jalon: 2025 },
        { type: "widget_nombre_chantiers_en_difficulte" as const, territoire_code: "REG-53", jalon: 2025 },
        { type: "widget_cartographie_taux_avancement" as const, maille: "departementale" as const, jalon: 2025 },
      ],
    },
    sectionChantier(CH_005.id, CH_005.nom),
    sectionChantier(CH_006.id, CH_006.nom),
  ],
  _output_instructions: "",
};

const describeForCalibration = (dashboard: typeof DASHBOARD_REFERENCE) =>
  [
    `TABLEAU DE BORD « ${dashboard.titre} »`,
    ...dashboard.containers.flatMap((container, index) => [
      `Section ${index + 1} :`,
      ...container.widgets.map(({ type, ...rest }) => `- ${type} ${JSON.stringify(rest)}`),
    ]),
    "",
    "TEXTE D'ACCOMPAGNEMENT :",
    "Voici le tableau de bord de la Bretagne.",
  ].join("\n");

const DASHBOARD_EVIDENCE = (dashboard: typeof DASHBOARD_REFERENCE) =>
  evidence({
    question: DASHBOARD_QUESTION,
    matter: describeForCalibration(dashboard),
    answer: "Voici le tableau de bord de la Bretagne.",
    dashboard: dashboard as unknown as Evidence["dashboard"],
  });

const DASHBOARD: CalibrationCase[] = [
  { family: "dashboard", label: "Référence", broken: null, evidence: DASHBOARD_EVIDENCE(DASHBOARD_REFERENCE) },
  {
    family: "dashboard",
    label: "Cartographie du taux absente",
    broken: "Widgets conformes à la demande",
    evidence: DASHBOARD_EVIDENCE({
      ...DASHBOARD_REFERENCE,
      containers: [
        { widgets: DASHBOARD_REFERENCE.containers[0].widgets.slice(0, 3) },
        ...DASHBOARD_REFERENCE.containers.slice(1),
      ],
    }),
  },
  {
    family: "dashboard",
    label: "Widget étranger à la demande",
    broken: "Widgets conformes à la demande",
    evidence: DASHBOARD_EVIDENCE({
      ...DASHBOARD_REFERENCE,
      containers: [
        {
          widgets: [
            ...DASHBOARD_REFERENCE.containers[0].widgets,
            { type: "widget_cartographie_propositions_valeur_avancement" as never, maille: "departementale" as const, jalon: 2025 },
          ],
        },
        ...DASHBOARD_REFERENCE.containers.slice(1),
      ],
    }),
  },
];

const RAPPORT_QUESTION =
  "Crée un rapport de synthèse du territoire Bretagne incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown";

const RAPPORT_REFERENCE = `# Synthèse Bretagne

## Taux d'avancement
Le TA 2025 de la Bretagne est de 51%, pour une médiane des régions à 65%.

## Chantiers en retard
CH-005 — Réduire les délais de passage aux urgences : écart de -15 points, météo Appuis nécessaires.

| Indicateur | VI | VA | VC | TA |
|---|---|---|---|---|
| IND-005 — Délai médian de passage aux urgences | 280 | 250 | 180 | 30 % |

## Chantiers en difficulté
CH-006 — Développer la prévention en santé : météo Objectifs compromis.

RÉPONSE DU CHAT :
Votre rapport est disponible au téléchargement.`;

const RAPPORT_EVIDENCE = (matter: string) =>
  evidence({
    question: RAPPORT_QUESTION,
    matter,
    answer: "Votre rapport est disponible au téléchargement.",
    toolCalls: [{ toolName: "export_rapport", input: { format: "markdown" } }],
  });

const RAPPORT: CalibrationCase[] = [
  { family: "rapport", label: "Référence", broken: null, evidence: RAPPORT_EVIDENCE(RAPPORT_REFERENCE) },
  {
    family: "rapport",
    label: "Indicateurs en texte, sans tableau",
    broken: "Tableau d'indicateurs",
    evidence: RAPPORT_EVIDENCE(
      RAPPORT_REFERENCE.replace(
        /\| Indicateur[\s\S]+?30 % \|/,
        "Indicateur IND-005 : 280 au départ, 250 aujourd'hui, 180 visés.",
      ),
    ),
  },
  {
    family: "rapport",
    label: "Chantiers en difficulté absents",
    broken: "Sections demandées",
    evidence: RAPPORT_EVIDENCE(RAPPORT_REFERENCE.replace(/## Chantiers en difficulté\n[^\n]+\n/, "")),
  },
];

export const CALIBRATION_CASES: CalibrationCase[] = [
  ...SYNTHESE,
  ...RETARD,
  ...COMPARAISON,
  ...COMMENTAIRES,
  ...DASHBOARD,
  ...RAPPORT,
];
```

- [ ] **Step 2 : Écrire le test des critères mécaniques sur les références**

Les références doivent passer tous les critères mécaniques de leur grille. Sans ça, un mutant ne casserait pas « un seul critère ».

```ts
// evals/3-scenarios/3.0-calibration/references.unit.test.ts
import type { Criterion, MechanicalCriterion } from "../grid";
import { GRIDS } from "../grids";
import { CALIBRATION_CASES } from "./references";

const estMecanique = (criterion: Criterion): criterion is MechanicalCriterion =>
  criterion.kind === "mechanical";

describe("références de calibration", () => {
  const references = CALIBRATION_CASES.filter((testCase) => testCase.broken === null);

  test.each(references.map((reference) => [reference.family, reference] as const))(
    "la référence %s passe tous ses critères mécaniques",
    (_family, reference) => {
      // When
      const echecs = GRIDS[reference.family].criteria
        .filter(estMecanique)
        .filter((criterion) => criterion.applicable?.(reference.evidence) ?? true)
        .map((criterion) => ({ id: criterion.id, result: criterion.check(reference.evidence) }))
        .filter(({ result }) => !result.ok);

      // Then
      expect(echecs).toEqual([]);
    },
  );

  test("chaque mutant casse un critère jugé de sa grille", () => {
    // When
    const orphelins = CALIBRATION_CASES.filter((testCase) => testCase.broken !== null)
      .filter(
        (testCase) =>
          !GRIDS[testCase.family].criteria.some(
            (criterion) => criterion.kind === "judged" && criterion.id === testCase.broken,
          ),
      )
      .map((testCase) => `${testCase.family} · ${testCase.label}`);

    // Then
    expect(orphelins).toEqual([]);
  });
});
```

- [ ] **Step 3 : Lancer le test, le faire passer**

Run: `pnpm exec vitest run --project server-unit evals/3-scenarios/3.0-calibration`
Expected: PASS. Si une référence échoue un critère mécanique, corriger la **référence**, pas la vérification : la référence doit être conforme au prompt.

- [ ] **Step 4 : Écrire la suite de calibration**

```ts
// evals/3-scenarios/3.0-calibration/calibration.eval.ts
import { evalite } from "evalite";
import { GRIDS } from "../grids";
import type { JudgedCriterion } from "../grid";
import { askJudge } from "../askJudge";
import { JUDGE_MODEL, type Verdict } from "../judge";
import { CALIBRATION_CASES, type CalibrationCase } from "./references";

/**
 * Calibration du juge — le méta-eval du niveau 3.
 *
 * Chaque famille a une réponse de référence, conforme, et un mutant par
 * critère jugé, qui casse ce critère et lui seul. On mesure l'accord du juge
 * avec nous : il doit détecter le défaut du mutant, et ne rien signaler
 * d'autre. Pas d'agent, pas de base : un appel de juge par cas et par essai.
 *
 * Un critère jugé est FIABLE s'il détecte son mutant et laisse passer la
 * référence sur les trois essais. Un critère non fiable reste dans les
 * suites, mais son score y est marqué : on ne conclut rien sur Albert d'un
 * critère que le juge ne sait pas vérifier.
 */

const judgedCriteria = (family: CalibrationCase["family"]) =>
  GRIDS[family].criteria.filter(
    (criterion): criterion is JudgedCriterion => criterion.kind === "judged",
  );

for (const family of [...new Set(CALIBRATION_CASES.map((testCase) => testCase.family))]) {
  evalite<CalibrationCase, Verdict>(`3.0 · Calibration du juge · ${GRIDS[family].family}`, {
    data: () =>
      CALIBRATION_CASES.filter((testCase) => testCase.family === family).map((testCase) => ({
        input: testCase,
      })),

    task: (input) =>
      askJudge({
        evidence: input.evidence,
        criteria: judgedCriteria(input.family).filter(
          (criterion) => criterion.applicable?.(input.evidence) ?? true,
        ),
      }),

    trialCount: 3,

    scorers: [
      {
        name: "Détecte le défaut",
        description: `Juge ${JUDGE_MODEL} : le critère cassé est jugé non conforme. Sans objet pour la référence.`,
        scorer: ({ input, output }) => {
          if (input.broken === null) return { score: 1, metadata: "sans objet" };
          const verdict = output[input.broken];
          return {
            score: verdict && !verdict.conforme ? 1 : 0,
            metadata: verdict?.preuve ?? "absent du verdict",
          };
        },
      },
      {
        name: "Laisse passer le reste",
        description: "Tous les critères intacts sont jugés conformes.",
        scorer: ({ input, output }) => {
          const faux = Object.entries(output)
            .filter(([id, verdict]) => id !== input.broken && !verdict.conforme)
            .map(([id, verdict]) => `${id} : ${verdict.preuve}`);
          return {
            score: faux.length === 0 ? 1 : 0,
            metadata: faux.length === 0 ? "aucun faux signalement" : faux,
          };
        },
      },
    ],

    columns: ({ input, output }) => [
      { label: "Cas", value: input.label },
      { label: "Critère cassé", value: input.broken ?? "—" },
      {
        label: "Verdicts",
        value: Object.entries(output)
          .map(([id, verdict]) => `${verdict.conforme ? "✓" : "✗"} ${id}`)
          .join("\n"),
      },
    ],
  });
}
```

- [ ] **Step 5 : Vérifier le typage**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6 : Commit**

```bash
git add evals/3-scenarios/3.0-calibration
git commit -m "feat(ppg): calibration du juge par références et mutants (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 10 : Les suites du groupe Synthèse

**Files:**
- Create: `evals/3-scenarios/3.1-synthese/syntheseTerritoire.eval.ts`
- Create: `evals/3-scenarios/3.1-synthese/syntheseChantier.eval.ts`
- Create: `evals/3-scenarios/3.1-synthese/syntheseDepartements.eval.ts`
- Create: `evals/3-scenarios/3.1-synthese/chantiersEnRetard.eval.ts`
- Create: `evals/3-scenarios/3.1-synthese/rapportComplet.eval.ts`
- Create: `evals/3-scenarios/3.1-synthese/tableauDeBord.eval.ts`
- Create: `evals/3-scenarios/3.1-synthese/syntheseDifficultes.eval.ts`
- Create: `evals/3-scenarios/3.1-synthese/syntheseCommentaires.eval.ts`

**Interfaces:**
- Consumes: `scenarioEval` (tâche 7), `GRIDS` (tâche 8).

Chaque fichier porte un en-tête qui cite le scénario source, les choix faits en revue, et une ligne « Référence observée : à compléter au premier run. » que la tâche 12 remplit. Les messages sont recopiés de `scenariosTerritoire.ts` avec le `nomAffiché` du territoire courant.

- [ ] **Step 1 : Synthèse d'un territoire**

```ts
// evals/3-scenarios/3.1-synthese/syntheseTerritoire.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Synthèse d'un territoire » (DITP, à compléter) :
 * « Fais moi la synthèse du territoire ». Le trou est complété par le
 * territoire courant, un département par son nom, un département par son
 * numéro.
 *
 * Le gabarit écrit « le TA de la région » quel que soit le territoire : le
 * critère « Maille nommée » le mesure sur les deux départements.
 *
 * Référence observée : à compléter au premier run.
 */

const workflowSynthese = (territoire_code: string) => [
  { toolName: "get_taux_avancement_territoire", input: { territoire_code } },
  { toolName: "get_chantiers", input: { territoire_code, view: "en_retard" } },
  { toolName: "get_chantiers", input: { territoire_code, view: "en_difficulte" } },
];

scenarioEval({
  suite: "Synthèse d'un territoire",
  group: "synthese",
  grid: GRIDS.syntheseTerritoire,
  cases: [
    {
      question: "Fais moi la synthèse du territoire Bretagne",
      reason: "Trou complété par le territoire courant",
      truthScope: { territoires: ["REG-53"] },
      expected: workflowSynthese("REG-53"),
    },
    {
      question: "Fais moi la synthèse du territoire Finistère",
      reason: "Trou complété par un département, par son nom",
      truthScope: { territoires: ["DEPT-29"] },
      expected: workflowSynthese("DEPT-29"),
    },
    {
      question: "Fais moi la synthèse du territoire 35",
      reason: "Trou complété par un numéro de département seul : DEPT-35, pas le territoire courant",
      truthScope: { territoires: ["DEPT-35"] },
      expected: workflowSynthese("DEPT-35"),
    },
  ],
});
```

- [ ] **Step 2 : Synthèse d'un chantier sur un territoire**

```ts
// evals/3-scenarios/3.1-synthese/syntheseChantier.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Synthèse d'un chantier sur un territoire » (DITP et
 * coordinateur, à compléter). Trois volets : la synthèse du chantier, sa
 * position face aux autres territoires, les difficultés des commentaires.
 *
 * Le mot « synthèse » charge le gabarit de synthèse territoriale, alors que
 * le workflow ne vaut que pour une demande qui ne cible pas un chantier :
 * « Pas le gabarit territorial » le mesure. Aucun workflow ne dit comment
 * situer un chantier face aux autres territoires : le chemin n'est pas
 * imposé, le juge vérifie le résultat. Côté coordinateur, les autres régions
 * sont hors périmètre : « Restriction signalée » s'applique si l'agent les
 * interroge.
 *
 * Référence observée : à compléter au premier run.
 */

const MESSAGE = (territoire: string) =>
  `Fais moi la synthèse du chantier CH-005 sur ${territoire}
Comment se situe ce chantier par rapport aux autres territoires ?
Quelles sont les principales difficultés remontées dans les commentaires ?`;

const OUTILS = [
  { toolName: "get_chantiers", input: { territoire_code: "REG-53", chantier_ids: ["CH-005"] } },
  { toolName: "get_chantier_commentaires", input: { chantier_id: "CH-005", territoire_code: "REG-53" } },
];

scenarioEval({
  suite: "Synthèse d'un chantier sur un territoire",
  group: "synthese",
  grid: GRIDS.syntheseChantier,
  cases: [
    {
      question: MESSAGE("le territoire Bretagne"),
      reason: "DITP : CH-XXX et NOM_TERRITOIRE complétés",
      profile: "ditp",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-005"] },
      expected: OUTILS,
    },
    {
      question: MESSAGE("Bretagne"),
      reason: "Coordinateur : CH-XXX complété, territoire pré-rempli",
      profile: "coordinateur",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-005"] },
      expected: OUTILS,
    },
  ],
});
```

Le message DITP de l'interface est « … sur le territoire NOM_TERRITOIRE », celui du coordinateur « … sur ${territoire.nomAffiché} » : d'où « le territoire Bretagne » d'un côté, « Bretagne » de l'autre.

- [ ] **Step 3 : Synthèse de Bretagne et ses départements**

```ts
// evals/3-scenarios/3.1-synthese/syntheseDepartements.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Synthèse de Bretagne et ses départements » (DITP, envoyé,
 * territoire courant régional).
 *
 * Avec cinq territoires dans les résultats, le prompt impose le gabarit
 * COMPARAISON : la grille le suit. Que ce soit le bon rendu pour une
 * « synthèse de X et ses départements » est une question pour le produit.
 *
 * Référence observée : à compléter au premier run.
 */

const avecSousTerritoires = { territoire_code: "REG-53", include_sous_territoires: true };

scenarioEval({
  suite: "Synthèse de Bretagne et ses départements",
  group: "synthese",
  grid: GRIDS.syntheseSousTerritoires,
  cases: [
    {
      question: "Fais moi la synthèse de Bretagne et ses départements",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], includeSousTerritoires: true },
      expected: [
        { toolName: "get_taux_avancement_territoire", input: avecSousTerritoires },
        { toolName: "get_chantiers", input: { ...avecSousTerritoires, view: "en_retard" } },
        { toolName: "get_chantiers", input: { ...avecSousTerritoires, view: "en_difficulte" } },
      ],
      tableTerritories: ["REG-53", "DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
```

- [ ] **Step 4 : Chantiers en retard et leurs indicateurs**

```ts
// evals/3-scenarios/3.1-synthese/chantiersEnRetard.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Chantiers en retard et leurs indicateurs » (DITP et
 * coordinateur, envoyé, même message).
 *
 * Les instructions de `get_indicateurs` disent « pour afficher les
 * indicateurs, utilise create_dashboard », outil non chargé faute de mot-clé
 * (PIL-1833, point 7). « Valeurs des indicateurs » mesure si l'agent donne
 * quand même les valeurs.
 *
 * Référence observée : à compléter au premier run.
 */

const MESSAGE =
  "Analyse les chantiers en retard sur Bretagne. Pour chaque chantier en retard, récupère également les valeurs de ses indicateurs.";

const OUTILS = [
  { toolName: "get_chantiers", input: { territoire_code: "REG-53", view: "en_retard" } },
  { toolName: "get_indicateurs", input: { chantier_id: "CH-005", territoire_code: "REG-53" } },
];

const SCOPE = { territoires: ["REG-53"], indicateurs: true };

scenarioEval({
  suite: "Chantiers en retard et leurs indicateurs",
  group: "synthese",
  grid: GRIDS.chantiersEnRetard,
  cases: [
    { question: MESSAGE, reason: "DITP", profile: "ditp", truthScope: SCOPE, expected: OUTILS },
    { question: MESSAGE, reason: "Coordinateur", profile: "coordinateur", truthScope: SCOPE, expected: OUTILS },
  ],
});
```

- [ ] **Step 5 : Rapport complet**

```ts
// evals/3-scenarios/3.1-synthese/rapportComplet.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Rapport complet (Markdown) » (DITP administrateur, envoyé).
 *
 * La matière jugée est le contenu passé à `export_rapport`. Résultat connu du
 * niveau 2 : 0/3, le workflow de synthèse écrase l'export (PIL-1833, point
 * 14). Sans export, tous les critères du rapport tombent : c'est acté.
 *
 * Référence observée : à compléter au premier run.
 */

const territoire = { territoire_code: "REG-53" };

scenarioEval({
  suite: "Rapport complet (Markdown)",
  group: "synthese",
  grid: GRIDS.rapport,
  cases: [
    {
      question:
        "Crée un rapport de synthèse du territoire Bretagne incluant le taux d'avancement, les chantiers en retard, les chantiers en difficulté et leurs indicateurs. Format Markdown",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], indicateurs: true },
      expected: [
        { toolName: "get_taux_avancement_territoire", input: territoire },
        { toolName: "get_chantiers", input: { ...territoire, view: "en_retard" } },
        { toolName: "get_chantiers", input: { ...territoire, view: "en_difficulte" } },
        { toolName: "get_indicateurs", input: { chantier_id: "CH-005" } },
        { toolName: "get_indicateurs", input: { chantier_id: "CH-006" } },
        { toolName: "export_rapport", input: { format: "markdown" } },
      ],
    },
  ],
});
```

- [ ] **Step 6 : Tableau de bord du territoire**

```ts
// evals/3-scenarios/3.1-synthese/tableauDeBord.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Tableau de bord du territoire » (DITP administrateur, envoyé),
 * avec le message COMPLET de l'interface, pas la version abrégée du spike.
 *
 * La matière est la structure rendue par `create_dashboard`. Les données des
 * widgets sont résolues au rendu : pas d'hallucination de chiffre possible,
 * seul le choix des widgets est jugé. La « pleine largeur » relève du code de
 * mise en page, elle n'est pas notée.
 *
 * Référence observée : à compléter au premier run.
 */

scenarioEval({
  suite: "Tableau de bord du territoire",
  group: "synthese",
  grid: GRIDS.dashboard,
  cases: [
    {
      question:
        "Compose un tableau de bord pour Bretagne. Commence par une première section contenant le taux d'avancement du territoire, le nombre de chantiers en retard, le nombre de chantiers en difficulté et la cartographie du taux d'avancement. Ensuite, récupère la liste des chantiers en difficulté et en retard sur ce territoire, et pour chacun, ajoute une section dédiée avec un titre reprenant le nom du chantier, la météo et le commentaire de synthèse, la cartographie météo en pleine largeur et le tableau de ses indicateurs.",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"] },
      expected: [
        { toolName: "get_chantiers", input: { territoire_code: "REG-53", view: "en_retard" } },
        { toolName: "get_chantiers", input: { territoire_code: "REG-53", view: "en_difficulte" } },
        { toolName: "create_dashboard", input: { territoire_codes: ["REG-53"] } },
      ],
    },
  ],
});
```

- [ ] **Step 7 : Synthèse des difficultés d'un territoire**

```ts
// evals/3-scenarios/3.1-synthese/syntheseDifficultes.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Synthèse des difficultés d'un territoire » (coordinateur, à
 * compléter) : « Fais moi la synthèse des difficultés du territoire ».
 *
 * Choix arbitraire, à valider côté produit : « les difficultés » suit le
 * workflow de synthèse que déclenche le mot « synthèse », donc les deux vues
 * (en retard et en difficulté), et la grille de synthèse territoriale.
 *
 * Les Pays de la Loire sont hors du périmètre du coordinateur : leurs
 * commentaires et tendances sont masqués, « Restriction signalée »
 * s'applique.
 *
 * Référence observée : à compléter au premier run.
 */

const workflowSynthese = (territoire_code: string) => [
  { toolName: "get_taux_avancement_territoire", input: { territoire_code } },
  { toolName: "get_chantiers", input: { territoire_code, view: "en_retard" } },
  { toolName: "get_chantiers", input: { territoire_code, view: "en_difficulte" } },
];

scenarioEval({
  suite: "Synthèse des difficultés d'un territoire",
  group: "synthese",
  grid: GRIDS.syntheseTerritoire,
  profile: "coordinateur",
  cases: [
    {
      question: "Fais moi la synthèse des difficultés du territoire Bretagne",
      reason: "Trou complété par le territoire courant",
      truthScope: { territoires: ["REG-53"] },
      expected: workflowSynthese("REG-53"),
    },
    {
      question: "Fais moi la synthèse des difficultés du territoire Finistère",
      reason: "Un département du périmètre",
      truthScope: { territoires: ["DEPT-29"] },
      expected: workflowSynthese("DEPT-29"),
    },
    {
      question: "Fais moi la synthèse des difficultés du territoire Pays de la Loire",
      reason: "Hors périmètre : commentaires masqués, restriction à signaler",
      truthScope: { territoires: ["REG-52"] },
      expected: workflowSynthese("REG-52"),
    },
  ],
});
```

- [ ] **Step 8 : Synthèse des commentaires**

```ts
// evals/3-scenarios/3.1-synthese/syntheseCommentaires.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Synthèse des commentaires d'un/de plusieurs chantiers »
 * (coordinateur, à compléter) : « Synthétise les commentaires des chantiers
 * suivants CH-XXX, CH-YYY, notamment les principales actions identifiées ».
 *
 * Le message ne nomme pas de territoire : l'agent doit prendre le territoire
 * courant du contexte. Sur une région, seuls les commentaires territoriaux
 * sont visibles ; « actions à venir » et « actions à valoriser » sont des
 * types nationaux, signalés non accessibles. Le scénario demande donc des
 * actions que le coordinateur ne peut pas lire par ces types : la grille
 * exige que l'agent le dise, et qu'il tire les actions des commentaires
 * territoriaux.
 *
 * « Synthétise » est une demande explicite de reformulation : « Pas de
 * recopie » s'applique ici, alors que l'outil restitue sinon en verbatim.
 *
 * Référence observée : à compléter au premier run.
 */

const commentairesDe = (chantier_id: string) => ({
  toolName: "get_chantier_commentaires",
  input: { chantier_id, territoire_code: "REG-53" },
});

scenarioEval({
  suite: "Synthèse des commentaires d'un/de plusieurs chantiers",
  group: "synthese",
  grid: GRIDS.commentaires,
  profile: "coordinateur",
  cases: [
    {
      question:
        "Synthétise les commentaires des chantiers suivants CH-005, CH-006, notamment les principales actions identifiées",
      reason: "Deux chantiers commentés",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-005", "CH-006"] },
      expected: [commentairesDe("CH-005"), commentairesDe("CH-006")],
    },
    {
      question:
        "Synthétise les commentaires des chantiers suivants CH-001, notamment les principales actions identifiées",
      reason: "Un seul chantier",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-001"] },
      expected: [commentairesDe("CH-001")],
    },
    {
      question:
        "Synthétise les commentaires des chantiers suivants CH-005, CH-012, notamment les principales actions identifiées",
      reason: "CH-012 n'a aucun commentaire en Bretagne : à dire, sans inventer",
      truthScope: { territoires: ["REG-53"], chantiersCommentes: ["CH-005", "CH-012"] },
      expected: [commentairesDe("CH-005"), commentairesDe("CH-012")],
    },
  ],
});
```

- [ ] **Step 9 : Vérifier le typage, puis un tour réel**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur.

Puis un premier tour réel sur la suite la plus simple, pour valider le câblage de bout en bout avant d'écrire la suite suivante :

Run: `pnpm eval evals/3-scenarios/3.1-synthese/chantiersEnRetard.eval.ts`
Expected: la suite tourne sans erreur (2 cas × 3 essais) ; chaque critère sort un score ; les lignes de juge n'affichent pas « absent du verdict ». Si le juge échoue à produire la sortie structurée, lire l'erreur : `deepseek-v4-flash` peut exiger `mode: "json"` ; l'ancien juge du spike fonctionnait avec `Output.object` et température 0.

- [ ] **Step 10 : Commit**

```bash
git add evals/3-scenarios/3.1-synthese
git commit -m "feat(ppg): suites de niveau 3 du groupe Synthèse (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 11 : Les suites du groupe Comparaison

**Files:**
- Create: `evals/3-scenarios/3.2-comparaison/comparerTerritoires.eval.ts`
- Create: `evals/3-scenarios/3.2-comparaison/comparerJalons.eval.ts`
- Create: `evals/3-scenarios/3.2-comparaison/comparerDepartements.eval.ts`
- Create: `evals/3-scenarios/3.2-comparaison/comparerAutresDepartements.eval.ts`
- Create: `evals/3-scenarios/3.2-comparaison/comparaisonQuantitative.eval.ts`

**Interfaces:**
- Consumes: `scenarioEval`, `GRIDS`.

Le gabarit comparaison n'est chargé sur aucun de ces messages (aucun mot-clé de synthèse). Les grilles jugent ce qu'Albert reçoit : tableau, écarts, position, noms. Chaque en-tête le rappelle.

- [ ] **Step 1 : Comparer avec un autre territoire**

```ts
// evals/3-scenarios/3.2-comparaison/comparerTerritoires.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Comparer avec un autre territoire » (DITP, à compléter) :
 * « Compare Bretagne avec ».
 *
 * Le gabarit comparaison n'est pas chargé (aucun mot-clé de synthèse) : la
 * grille juge ce qu'Albert reçoit. Le périmètre d'une « comparaison » n'étant
 * défini nulle part, seuls les taux sont exigés ; les chantiers en plus ne
 * sont pas pénalisés.
 *
 * « la région 84 » est la moitié DITP du piège du 84 : REG-84 est
 * Auvergne-Rhône-Alpes (au niveau 2, « le 84 » était présenté comme le Grand
 * Est).
 *
 * Référence observée : à compléter au premier run.
 */

const tauxDe = (territoire_code: string) => ({
  toolName: "get_taux_avancement_territoire",
  input: { territoire_code },
});

scenarioEval({
  suite: "Comparer avec un autre territoire",
  group: "comparaison",
  grid: GRIDS.comparaisonTerritoires,
  cases: [
    {
      question: "Compare Bretagne avec Pays de la Loire",
      reason: "Deux régions",
      truthScope: { territoires: ["REG-53", "REG-52"] },
      expected: [tauxDe("REG-53"), tauxDe("REG-52")],
      tableTerritories: ["REG-53", "REG-52"],
    },
    {
      question: "Compare Bretagne avec la région 84",
      reason: "Piège du 84 : REG-84, Auvergne-Rhône-Alpes",
      truthScope: { territoires: ["REG-53", "REG-84"] },
      expected: [tauxDe("REG-53"), tauxDe("REG-84")],
      tableTerritories: ["REG-53", "REG-84"],
    },
    {
      question: "Compare Bretagne avec 35 - Ille-et-Vilaine",
      reason: "Une région face à son département : deux médianes de mailles différentes",
      truthScope: { territoires: ["REG-53", "DEPT-35"] },
      expected: [tauxDe("REG-53"), tauxDe("DEPT-35")],
      tableTerritories: ["REG-53", "DEPT-35"],
    },
  ],
});
```

- [ ] **Step 2 : Comparer entre deux jalons**

```ts
// evals/3-scenarios/3.2-comparaison/comparerJalons.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Comparer les taux d'avancement entre le jalon 2025 et un autre
 * jalon » (DITP, à compléter) : « Compare les taux d'avancement de Bretagne
 * entre le jalon 2025 et ».
 *
 * 2024 est semé ; 2023 ne l'est pas : Albert doit dire que les données ne
 * sont pas disponibles, sans inventer. « l'année précédente » vérifie la
 * résolution d'un jalon relatif au jalon courant.
 *
 * Référence observée : à compléter au premier run.
 */

const tauxBretagne = (jalon: number) => ({
  toolName: "get_taux_avancement_territoire",
  input: { territoire_code: "REG-53", jalon },
});

const MESSAGE = (autre: string) =>
  `Compare les taux d'avancement de Bretagne entre le jalon 2025 et ${autre}`;

scenarioEval({
  suite: "Comparer les taux d'avancement entre le jalon 2025 et un autre jalon",
  group: "comparaison",
  grid: GRIDS.comparaisonJalons,
  cases: [
    {
      question: MESSAGE("2024"),
      reason: "Jalon semé",
      truthScope: { territoires: ["REG-53"], jalons: [2025, 2024] },
      expected: [tauxBretagne(2025), tauxBretagne(2024)],
    },
    {
      question: MESSAGE("l'année précédente"),
      reason: "Jalon relatif : 2024",
      truthScope: { territoires: ["REG-53"], jalons: [2025, 2024] },
      expected: [tauxBretagne(2025), tauxBretagne(2024)],
    },
    {
      question: MESSAGE("2023"),
      reason: "Aucune donnée en 2023 : à dire, sans inventer",
      truthScope: { territoires: ["REG-53"], jalons: [2025, 2023] },
      expected: [tauxBretagne(2025), tauxBretagne(2023)],
    },
  ],
});
```

- [ ] **Step 3 : Comparer Bretagne avec ses départements**

```ts
// evals/3-scenarios/3.2-comparaison/comparerDepartements.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Comparer Bretagne avec ses départements » (DITP, envoyé,
 * territoire courant régional).
 *
 * Attente stricte, décidée en revue : UN SEUL appel sur REG-53 avec
 * `include_sous_territoires`. Le prompt interdit d'énumérer les
 * sous-territoires ; une énumération échoue « Outils attendus ».
 *
 * « avec ses départements » ne déclenche pas le mot-clé du détecteur, qui
 * attend « et ses départements » : la consigne impérative sur les
 * sous-territoires n'est pas injectée (PIL-1833, point 12).
 *
 * Référence observée : à compléter au premier run.
 */

scenarioEval({
  suite: "Comparer Bretagne avec ses départements",
  group: "comparaison",
  grid: GRIDS.comparaisonSousTerritoires,
  cases: [
    {
      question: "Compare Bretagne avec ses départements",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], includeSousTerritoires: true },
      expected: [
        {
          toolName: "get_taux_avancement_territoire",
          input: { territoire_code: "REG-53", include_sous_territoires: true },
        },
      ],
      tableTerritories: ["REG-53", "DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
```

- [ ] **Step 4 : Comparer avec les autres départements de la région**

```ts
// evals/3-scenarios/3.2-comparaison/comparerAutresDepartements.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Comparer avec les autres départements de Bretagne » (DITP,
 * envoyé depuis l'Ille-et-Vilaine, seul scénario à territoire courant
 * départemental). Le message porte le libellé affiché : « 35 -
 * Ille-et-Vilaine ».
 *
 * Deux chemins légitimes : un appel sur REG-53 avec les sous-territoires, ou
 * quatre appels départementaux. Le scorer d'outils ne sait pas exprimer
 * « l'un ou l'autre » : il n'exige que l'outil, et « Territoires du tableau »
 * vérifie le résultat. La ligne de la région n'est pas pénalisée.
 *
 * Référence observée : à compléter au premier run.
 */

scenarioEval({
  suite: "Comparer avec les autres départements de Bretagne",
  group: "comparaison",
  grid: GRIDS.comparaisonSousTerritoires,
  currentTerritory: "DEPT-35",
  cases: [
    {
      question: "Compare 35 - Ille-et-Vilaine avec les autres départements de Bretagne",
      reason: "Message envoyé tel quel",
      truthScope: { territoires: ["REG-53"], includeSousTerritoires: true },
      expected: [{ toolName: "get_taux_avancement_territoire" }],
      tableTerritories: ["DEPT-22", "DEPT-29", "DEPT-35", "DEPT-56"],
    },
  ],
});
```

- [ ] **Step 5 : Comparaison quantitative des territoires**

```ts
// evals/3-scenarios/3.2-comparaison/comparaisonQuantitative.eval.ts
import { GRIDS } from "../grids";
import { scenarioEval } from "../scenarioEval";

/**
 * Scénario « Comparaison quantitative des territoires » (coordinateur, à
 * compléter) : « Compare les taux d'avancement de Bretagne avec ».
 *
 * « Restriction signalée » est retiré de la grille : seul le taux est
 * demandé, et il n'est jamais masqué.
 *
 * « le département 84 » est la moitié coordinateur du piège du 84 : DEPT-84
 * est le Vaucluse.
 *
 * Référence observée : à compléter au premier run.
 */

const tauxDe = (territoire_code: string) => ({
  toolName: "get_taux_avancement_territoire",
  input: { territoire_code },
});

const MESSAGE = (autre: string) => `Compare les taux d'avancement de Bretagne avec ${autre}`;

scenarioEval({
  suite: "Comparaison quantitative des territoires",
  group: "comparaison",
  grid: GRIDS.comparaisonQuantitative,
  profile: "coordinateur",
  cases: [
    {
      question: MESSAGE("Pays de la Loire"),
      reason: "Région hors périmètre : le taux reste visible",
      truthScope: { territoires: ["REG-53", "REG-52"] },
      expected: [tauxDe("REG-53"), tauxDe("REG-52")],
      tableTerritories: ["REG-53", "REG-52"],
    },
    {
      question: MESSAGE("le département 84"),
      reason: "Piège du 84 : DEPT-84, Vaucluse",
      truthScope: { territoires: ["REG-53", "DEPT-84"] },
      expected: [tauxDe("REG-53"), tauxDe("DEPT-84")],
      tableTerritories: ["REG-53", "DEPT-84"],
    },
    {
      question: MESSAGE("Finistère"),
      reason: "Département du périmètre",
      truthScope: { territoires: ["REG-53", "DEPT-29"] },
      expected: [tauxDe("REG-53"), tauxDe("DEPT-29")],
      tableTerritories: ["REG-53", "DEPT-29"],
    },
  ],
});
```

- [ ] **Step 6 : Vérifier typage, lint et tests**

Run: `pnpm exec tsc --noEmit && pnpm exec vitest run --project server-unit evals && pnpm lint`
Expected: aucune erreur. `pnpm lint` inclut `prettier --check` : lancer `pnpm exec prettier --write evals src/client/components/PageAccueil` si le formatage échoue, puis relancer.

- [ ] **Step 7 : Commit**

```bash
git add evals/3-scenarios/3.2-comparaison
git commit -m "feat(ppg): suites de niveau 3 du groupe Comparaison (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

### Task 12 : Runs, consignation et livrable

**Files:**
- Modify: l'en-tête de chaque `*.eval.ts` de `evals/3-scenarios` (ligne « Référence observée »)
- Modify: `evals/3-scenarios/3.0-calibration/references.ts` (désaccords réels, le cas échéant)
- Create (scratchpad, non versionné) : brouillons du commentaire PIL-1814 et des points PIL-1833

- [ ] **Step 1 : Lancer la calibration**

Run: `pnpm eval evals/3-scenarios/3.0-calibration`
Expected: les six suites de calibration tournent. Relever, pour chaque critère jugé : détecte son mutant (x/3), la référence de sa famille passe (x/3). Un critère est **fiable** à 3/3 sur les deux.

Si un critère n'est pas fiable, relire les preuves du juge. Reformuler l'`instruction` du critère dans `grids.ts` si elle est ambiguë, puis relancer la calibration seule. Deux reformulations au plus par critère : au-delà, le critère reste marqué non fiable dans le rapport.

- [ ] **Step 2 : Lancer les treize suites**

Run: `pnpm eval evals/3-scenarios/3.1-synthese evals/3-scenarios/3.2-comparaison`
Expected: 26 cas × 3 essais, sans erreur d'API. Compter une à deux heures au débit de 15 requêtes par minute.

- [ ] **Step 3 : Relire les désaccords du juge**

Dans l'UI (`pnpm eval:dev 3-scenarios`, http://localhost:3006), lire les preuves des critères jugés à 0 et des critères jugés à 1 sur les réponses visiblement fautives. Chaque réponse réelle sur laquelle le juge se trompe entre dans `references.ts` comme cas de calibration, avec `broken` fixé au critère concerné (ou `null` si la réponse est conforme et que le juge l'a rejetée). Relancer la calibration si des cas ont été ajoutés.

- [ ] **Step 4 : Consigner les références observées**

Dans chaque fichier de suite, remplacer « Référence observée : à compléter au premier run. » par la date, le score « Outils attendus », la moyenne des critères mécaniques (Forme) et des critères jugés (Fond), et une phrase sur l'échec dominant. Format :

```ts
 * Référence observée le 2026-10-XX : outils 83 %, forme 92 %, fond 58 %.
 * « Résumés condensés » 0/3 sur le Finistère : le commentaire est recopié.
```

- [ ] **Step 5 : Rédiger le commentaire de rapport PIL-1814**

Brouillon dans le scratchpad, au format du rapport de PIL-1833 :

1. **Tableau par scénario** : Groupe | Scénario | Profil | Outils | Forme | Fond | Échecs | Point. Un critère non fiable porte la marque « (juge non fiable) » à côté de son score dans la colonne Échecs.
2. **Grille par famille** : Critère | Règle du prompt | Mode (mécanique ou jugé). Recopiée de `grids.ts` et du socle de `grid.ts`.
3. **Fiabilité du juge** : Critère | Détecte son mutant | Laisse passer la référence | Fiable.
4. **Analyse** : ce qui pèse vraiment, ce qui marche bien, comment lire les écarts entre deux runs.
5. **Bloc « À trancher avec Benjamin »** : la grille à valider, et les choix faits en revue (synthèse région + départements jugée contre le gabarit comparaison ; « les difficultés » rattaché aux deux vues ; comparaisons jugées sans gabarit ; périmètre d'une comparaison limité aux taux ; attente stricte d'un seul appel pour « avec ses départements »).

- [ ] **Step 6 : Rédiger les nouveaux points de PIL-1833**

Brouillon, numérotés à la suite du dernier point de PIL-1833 (16 à la date du plan), chacun avec le cas qui le révèle et son score :

- le gabarit de synthèse écrit « de la région » quel que soit le territoire ;
- le gabarit comparaison n'est chargé sur aucun scénario de comparaison ;
- le périmètre d'une « comparaison » n'est défini nulle part ;
- « avec ses départements » ne déclenche pas la consigne sur les sous-territoires (compléter le point 12) ;
- le scénario coordinateur « actions identifiées » vise des types de commentaires nationaux, invisibles sur une région ;
- les seeds du niveau 2 écrivent les valeurs d'indicateur là où `get_indicateurs` ne les lit pas (outillage, sans impact sur les scores du niveau 2) ;
- puis chaque défaut d'Albert révélé par le run.

- [ ] **Step 7 : Soumettre les deux textes à Antoine**

Montrer les deux brouillons dans la conversation. **Ne rien publier sur Jira sans son accord explicite.**

- [ ] **Step 8 : Commit**

```bash
git add evals/3-scenarios
git commit -m "docs(ppg): consigne les références observées du niveau 3 (PIL-1814)

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
```

---

## Auto-revue

**Couverture de la spec.**
- Jeté : tâche 1. Juge `deepseek-v4-flash` : tâche 6.
- Deux profils, contexte agent partagé : tâches 1 et 2. Territoires peuplés, indicateurs au jalon, chantier sans commentaire : tâche 3. Fiche de vérité par les outils : tâche 4.
- Factory, cas, tour, scorers, colonnes à 500 caractères, `trialCount: 3` : tâche 7.
- Matière par famille, prompt fermé, verdict binaire, sans objet, socle transverse : tâches 6 et 7. Grilles par famille : tâche 8.
- Calibration par références et mutants, fiabilité, tests unitaires des mécaniques sur les références, enrichissement par les désaccords : tâches 9 et 12.
- Treize scénarios de l'inventaire : tâches 10 (huit) et 11 (cinq).
- Livrable et retours : tâche 12.

**Écart assumé avec la spec.** La spec prévoyait un `seed` par cas. Le plan sème un monde territorial unique dans chaque tour : les médianes sont identiques d'un cas à l'autre, et aucun cas n'a besoin de données propres. Un cas qui en aurait besoin ajoutera le champ à ce moment-là.

**Précision par rapport à la spec.** « Chiffres exacts » se juge contre les résultats d'outils du tour (ce qu'Albert a reçu), et non contre la seule fiche de vérité : un agent qui interroge légitimement un territoire hors de la fiche (situer CH-005 face aux autres régions) serait sinon accusé d'inventer. La fiche reste la référence de complétude (chantiers attendus, territoires du tableau).

**Cohérence des types.** `Evidence` (tâche 6) est construite par `buildEvidence` (tâche 7) et à la main par `references.ts` (tâche 9) ; `ScenarioCase.currentTerritory` est un code partout ; `GRIDS` porte les onze clés utilisées par les tâches 9 à 11.
