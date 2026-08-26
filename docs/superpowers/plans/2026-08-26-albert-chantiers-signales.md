# Albert `get_chantiers_signales` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give Albert a dedicated tool, `get_chantiers_signales`, that returns the chantiers matching PILOTE's "Chantiers signalés" rubric — with the correct maille-dependent categories, grouped per chantier, and filterable by a single category.

**Architecture:** A new pure domain module (`CalculCategoriesSignalement`) centralizes the 6 signalement rules and the two territorial roll-ups (PVA, absence de taux départemental), reused by the existing counters query (`GetChantiersSignalesQuery`, refactored to delegate its roll-ups without behavior change) and by a new per-chantier list query (`GetChantiersSignalesListQuery`). A new Albert tool (`getChantiersSignales.ts`) wraps that query with the existing permission/sous-territoire pattern already used by `get_chantiers`.

**Tech Stack:** TypeScript, Prisma 6, Vitest (`server-unit`/`server-integration` projects), Zod, Vercel AI SDK `tool()`, Awilix DI (via this repo's `defineModule`/`asModuleClass`/`asModuleFunction`).

**Spec:** `docs/superpowers/specs/2026-08-26-albert-chantiers-signales-design.md`

## Global Constraints

- Reproduce `GetChantiersSignalesQuery`'s exact rules verbatim (parity with PILOTE compteurs is a hard acceptance criterion) — in particular the **strict** `ecart < -10` threshold (not `<= -10`) and the meteo-only proxy for "météo et synthèse non renseignées".
- Base chantier filter for the new query is `est_applicable: true` + `chantier_identite: { NOT: { ministeres: { isEmpty: true } } }` (matches `GetChantiersSignalesQuery`) — **not** `chantier_identite.statut: "PUBLIE"` (that's `GetChantiersQuery`'s filter, for a different rubric).
- `get_chantiers` and `GetChantiersQuery`/`GetChantiersParams` (including `view: "en_retard"`) are **out of scope** — do not modify `apps/pilote-ppg/src/server/albert/tools/getChantiers.ts` or `apps/pilote-ppg/src/server/albert/systemPrompt.ts`. The conceptual overlap between `en_retard` and `retard_mediane` is an accepted, deliberate compromise (see spec).
- `GetChantiersSignalesQuery`'s existing integration test suite (`apps/pilote-ppg/src/server/chantiers/__tests__/infrastructure/queries/GetChantiersSignalesQuery.integration.test.ts`) must keep passing **unmodified** — it is the regression guard for the refactor in Task 3.
- Never run tests yourself in this session — the plan's "Run tests" steps are instructions for whoever executes the plan (subagent or user), per this repo's `CLAUDE.md`.
- No 1–2 character variable names. Use `$Enums` from `@prisma/client` where relevant. Write `expect(x).toEqual([...])` rather than length + index access.

---

### Task 1: Shared user-facing labels + widget refactor

**Files:**
- Create: `apps/pilote-ppg/src/server/chantiers/app/contrats/LibellesAlerteChantier.ts`
- Modify: `apps/pilote-ppg/src/client/components/_commons/Widget/WidgetChantiersSignales/WidgetChantiersSignales.tsx`

**Interfaces:**
- Produces: `LIBELLE_TAUX_NON_CALCULE: string`, `LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL: string`, `LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES: string`, `LIBELLE_PROPOSITION_VALEUR_AVANCEMENT: string`, `LIBELLE_TENDANCE_BAISSE: string`, `libelleRetardMediane(mailleAdjectif: string): string` — all consumed by Task 2's `libelleCategorieSignalement` and by Task 5's masking logic.

There is no existing test file for this widget and this is a pure string-extraction refactor (zero behavior change), so this task has no new test — verification is the existing client test suite plus a visual no-op check of the constants against the current inline strings.

- [ ] **Step 1: Create the shared labels file**

```ts
// apps/pilote-ppg/src/server/chantiers/app/contrats/LibellesAlerteChantier.ts
export const LIBELLE_TAUX_NON_CALCULE =
  "Taux d'avancement non calculé(s) en raison d'indicateurs non renseignés";

export const LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL =
  "Chantier(s) sans taux d'avancement au niveau départemental";

export const LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES =
  "Chantier(s) avec météo et synthèse des résultats non renseignés";

export const LIBELLE_PROPOSITION_VALEUR_AVANCEMENT =
  "Chantier(s) avec proposition(s) de valeur d'avancement";

export const LIBELLE_TENDANCE_BAISSE = "Chantier(s) avec tendance en baisse";

export const libelleRetardMediane = (mailleAdjectif: string): string =>
  `Chantier(s) avec un retard de 10 points par rapport à leur médiane ${mailleAdjectif}`;
```

- [ ] **Step 2: Update the widget to consume the shared labels**

In `WidgetChantiersSignales.tsx`, replace the inline string literals in `alertesNationales` and `alertesTerritoriales` with the constants above. The rendered text must stay byte-for-byte identical.

```ts
import { TypeAlerteChantier } from "@/server/chantiers/app/contrats/TypeAlerteChantier";
import { ChantiersSignalesContrat } from "@/server/chantiers/app/contrats/ChantiersSignalesContrat";
import {
  LIBELLE_TAUX_NON_CALCULE,
  LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL,
  LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES,
  LIBELLE_PROPOSITION_VALEUR_AVANCEMENT,
  LIBELLE_TENDANCE_BAISSE,
  libelleRetardMediane,
} from "@/server/chantiers/app/contrats/LibellesAlerteChantier";
// ...keep the other existing imports unchanged...

type AlerteDefinition = {
  nomCritère: TypeAlerteChantier;
  libellé: string;
};

const alertesNationales: AlerteDefinition[] = [
  {
    nomCritère: "estEnAlerteTauxAvancementNonCalculé",
    libellé: LIBELLE_TAUX_NON_CALCULE,
  },
  {
    nomCritère: "estEnAlerteAbscenceTauxAvancementDepartemental",
    libellé: LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL,
  },
  {
    nomCritère: "estEnAlerteMétéoNonRenseignée",
    libellé: LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES,
  },
  {
    nomCritère: "estEnAlertePossedePropositionsValeurAvancement",
    libellé: LIBELLE_PROPOSITION_VALEUR_AVANCEMENT,
  },
];

const alertesTerritoriales = (mailleChantier: string): AlerteDefinition[] => [
  {
    nomCritère: "estEnAlerteÉcart",
    libellé: libelleRetardMediane(mailleChantier),
  },
  {
    nomCritère: "estEnAlerteBaisse",
    libellé: LIBELLE_TENDANCE_BAISSE,
  },
  {
    nomCritère: "estEnAlerteMétéoNonRenseignée",
    libellé: LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES,
  },
  {
    nomCritère: "estEnAlertePossedePropositionsValeurAvancement",
    libellé: LIBELLE_PROPOSITION_VALEUR_AVANCEMENT,
  },
];
```

Leave the rest of the file (`WidgetChantiersSignales`, `ChantiersSignalesContenu`, `TuilesAlertes`, `TuileAlerte`) untouched.

- [ ] **Step 3: Run the client test suite to confirm no regression**

Run: `pnpm test:client`
Expected: PASS, same results as before this change (this file has no dedicated test, so this only confirms nothing else broke).

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/src/server/chantiers/app/contrats/LibellesAlerteChantier.ts apps/pilote-ppg/src/client/components/_commons/Widget/WidgetChantiersSignales/WidgetChantiersSignales.tsx
git commit -m "refactor(chantiers): extraire les libellés de la rubrique chantiers signalés"
```

---

### Task 2: Pure categorization module — `CalculCategoriesSignalement`

**Files:**
- Create: `apps/pilote-ppg/src/server/chantiers/domain/CalculCategoriesSignalement.ts`
- Test: `apps/pilote-ppg/src/server/chantiers/__tests__/domain/CalculCategoriesSignalement.unit.test.ts`

**Interfaces:**
- Consumes: `LIBELLE_TAUX_NON_CALCULE`, `LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL`, `LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES`, `LIBELLE_PROPOSITION_VALEUR_AVANCEMENT`, `LIBELLE_TENDANCE_BAISSE`, `libelleRetardMediane` from Task 1.
- Produces (consumed by Task 3, Task 4, Task 5):
  - `export const CATEGORIES_SIGNALEMENT: readonly ["taux_avancement_non_calcule", "absence_taux_avancement_departemental", "meteo_synthese_non_renseignees", "proposition_valeur_avancement", "retard_mediane", "tendance_baisse"]`
  - `export type CategorieSignalement = typeof CATEGORIES_SIGNALEMENT[number]`
  - `export function nomCategorie(categorie: CategorieSignalement): string`
  - `export function categoriesApplicables(maille: string): CategorieSignalement[]`
  - `export function libelleCategorieSignalement(categorie: CategorieSignalement, maille: string): string`
  - `export type ChantierTerritoireAvecJalon = { id: string; meteo: string | null; tendance: string | null; nombre_propositions_valeur_actuelle: number; chantier_identite: { cible_attendue: boolean }; chantier_territoire_jalon: { ecart: number | null; taux_avancement: number | null }[] }`
  - `export function categoriesDuChantier(ct: ChantierTerritoireAvecJalon, maille: string, pvaChantierIds: ReadonlySet<string>, sansTauxDepartementalIds: ReadonlySet<string>): CategorieSignalement[]`

- [ ] **Step 1: Write the failing tests**

```ts
// apps/pilote-ppg/src/server/chantiers/__tests__/domain/CalculCategoriesSignalement.unit.test.ts
import { describe, expect, test } from "vitest";
import {
  categoriesApplicables,
  categoriesDuChantier,
  libelleCategorieSignalement,
  nomCategorie,
  type ChantierTerritoireAvecJalon,
} from "@/server/chantiers/domain/CalculCategoriesSignalement";

const chantierBase: ChantierTerritoireAvecJalon = {
  id: "CH-001",
  meteo: "SOLEIL",
  tendance: "HAUSSE",
  nombre_propositions_valeur_actuelle: 0,
  chantier_identite: { cible_attendue: false },
  chantier_territoire_jalon: [{ ecart: 0, taux_avancement: 50 }],
};

describe("categoriesApplicables", () => {
  test("retourne les catégories nationales pour la maille NAT", () => {
    expect(categoriesApplicables("NAT")).toEqual([
      "taux_avancement_non_calcule",
      "absence_taux_avancement_departemental",
      "meteo_synthese_non_renseignees",
      "proposition_valeur_avancement",
    ]);
  });

  test("retourne les catégories territoriales pour la maille REG", () => {
    expect(categoriesApplicables("REG")).toEqual([
      "retard_mediane",
      "tendance_baisse",
      "meteo_synthese_non_renseignees",
      "proposition_valeur_avancement",
    ]);
  });

  test("retourne les catégories territoriales pour la maille DEPT", () => {
    expect(categoriesApplicables("DEPT")).toEqual([
      "retard_mediane",
      "tendance_baisse",
      "meteo_synthese_non_renseignees",
      "proposition_valeur_avancement",
    ]);
  });
});

describe("nomCategorie", () => {
  test("retourne le nom générique de chaque catégorie", () => {
    expect(nomCategorie("retard_mediane")).toBe(
      "Retard par rapport à la médiane",
    );
    expect(nomCategorie("proposition_valeur_avancement")).toBe(
      "Proposition de valeur d'avancement",
    );
  });
});

describe("libelleCategorieSignalement", () => {
  test("insère l'adjectif régional pour retard_mediane en maille REG", () => {
    expect(libelleCategorieSignalement("retard_mediane", "REG")).toBe(
      "Chantier(s) avec un retard de 10 points par rapport à leur médiane régionale",
    );
  });

  test("insère l'adjectif départemental pour retard_mediane en maille DEPT", () => {
    expect(libelleCategorieSignalement("retard_mediane", "DEPT")).toBe(
      "Chantier(s) avec un retard de 10 points par rapport à leur médiane départementale",
    );
  });

  test("retourne le libellé fixe pour tendance_baisse quelle que soit la maille", () => {
    expect(libelleCategorieSignalement("tendance_baisse", "REG")).toBe(
      "Chantier(s) avec tendance en baisse",
    );
  });
});

describe("categoriesDuChantier", () => {
  test("aucune catégorie pour un chantier sans anomalie", () => {
    const categories = categoriesDuChantier(
      chantierBase,
      "DEPT",
      new Set(),
      new Set(),
    );
    expect(categories).toEqual([]);
  });

  test("retard_mediane quand ecart < -10 strictement, en maille DEPT", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      chantier_territoire_jalon: [{ ecart: -11, taux_avancement: 50 }],
    };
    expect(categoriesDuChantier(chantier, "DEPT", new Set(), new Set())).toEqual([
      "retard_mediane",
    ]);
  });

  test("pas de retard_mediane quand ecart vaut exactement -10 (seuil strict)", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      chantier_territoire_jalon: [{ ecart: -10, taux_avancement: 50 }],
    };
    expect(categoriesDuChantier(chantier, "DEPT", new Set(), new Set())).toEqual([]);
  });

  test("retard_mediane et tendance_baisse ne s'appliquent jamais en maille NAT", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      tendance: "BAISSE",
      chantier_territoire_jalon: [{ ecart: -20, taux_avancement: 50 }],
    };
    expect(categoriesDuChantier(chantier, "NAT", new Set(), new Set())).toEqual([]);
  });

  test("taux_avancement_non_calcule et absence_taux_avancement_departemental ne s'appliquent qu'au NAT", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      chantier_identite: { cible_attendue: true },
      chantier_territoire_jalon: [{ ecart: 0, taux_avancement: null }],
    };
    expect(
      categoriesDuChantier(chantier, "DEPT", new Set(), new Set(["CH-001"])),
    ).toEqual([]);
    expect(
      categoriesDuChantier(chantier, "NAT", new Set(), new Set(["CH-001"])),
    ).toEqual([
      "taux_avancement_non_calcule",
      "absence_taux_avancement_departemental",
    ]);
  });

  test("meteo_synthese_non_renseignees pour meteo null ou NON_RENSEIGNEE, à toute maille", () => {
    const chantierNull: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      meteo: null,
    };
    const chantierNonRenseignee: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      meteo: "NON_RENSEIGNEE",
    };
    expect(categoriesDuChantier(chantierNull, "DEPT", new Set(), new Set())).toEqual([
      "meteo_synthese_non_renseignees",
    ]);
    expect(
      categoriesDuChantier(chantierNonRenseignee, "NAT", new Set(), new Set()),
    ).toEqual(["meteo_synthese_non_renseignees"]);
  });

  test("proposition_valeur_avancement en DEPT utilise le compteur direct du chantier", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      nombre_propositions_valeur_actuelle: 2,
    };
    expect(categoriesDuChantier(chantier, "DEPT", new Set(), new Set())).toEqual([
      "proposition_valeur_avancement",
    ]);
  });

  test("proposition_valeur_avancement en NAT/REG utilise le set de roll-up, pas le compteur direct", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      nombre_propositions_valeur_actuelle: 0,
    };
    expect(
      categoriesDuChantier(chantier, "NAT", new Set(["CH-001"]), new Set()),
    ).toEqual(["proposition_valeur_avancement"]);
    expect(categoriesDuChantier(chantier, "NAT", new Set(), new Set())).toEqual([]);
  });

  test("regroupe plusieurs catégories pour un même chantier", () => {
    const chantier: ChantierTerritoireAvecJalon = {
      ...chantierBase,
      tendance: "BAISSE",
      meteo: null,
      chantier_territoire_jalon: [{ ecart: -15, taux_avancement: 50 }],
    };
    expect(categoriesDuChantier(chantier, "REG", new Set(), new Set())).toEqual([
      "meteo_synthese_non_renseignees",
      "retard_mediane",
      "tendance_baisse",
    ]);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:server:unit -- CalculCategoriesSignalement`
Expected: FAIL with "Cannot find module '@/server/chantiers/domain/CalculCategoriesSignalement'"

- [ ] **Step 3: Implement the module**

```ts
// apps/pilote-ppg/src/server/chantiers/domain/CalculCategoriesSignalement.ts
import {
  LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL,
  LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES,
  LIBELLE_PROPOSITION_VALEUR_AVANCEMENT,
  LIBELLE_TAUX_NON_CALCULE,
  LIBELLE_TENDANCE_BAISSE,
  libelleRetardMediane,
} from "@/server/chantiers/app/contrats/LibellesAlerteChantier";

export const CATEGORIES_SIGNALEMENT = [
  "taux_avancement_non_calcule",
  "absence_taux_avancement_departemental",
  "meteo_synthese_non_renseignees",
  "proposition_valeur_avancement",
  "retard_mediane",
  "tendance_baisse",
] as const;

export type CategorieSignalement = (typeof CATEGORIES_SIGNALEMENT)[number];

const CATEGORIES_NATIONALES: CategorieSignalement[] = [
  "taux_avancement_non_calcule",
  "absence_taux_avancement_departemental",
  "meteo_synthese_non_renseignees",
  "proposition_valeur_avancement",
];

const CATEGORIES_TERRITORIALES: CategorieSignalement[] = [
  "retard_mediane",
  "tendance_baisse",
  "meteo_synthese_non_renseignees",
  "proposition_valeur_avancement",
];

export function categoriesApplicables(maille: string): CategorieSignalement[] {
  return maille === "NAT" ? CATEGORIES_NATIONALES : CATEGORIES_TERRITORIALES;
}

export function nomCategorie(categorie: CategorieSignalement): string {
  const noms: Record<CategorieSignalement, string> = {
    taux_avancement_non_calcule: "Taux d'avancement non calculé",
    absence_taux_avancement_departemental:
      "Absence de taux d'avancement départemental",
    meteo_synthese_non_renseignees: "Météo et synthèse non renseignées",
    proposition_valeur_avancement: "Proposition de valeur d'avancement",
    retard_mediane: "Retard par rapport à la médiane",
    tendance_baisse: "Tendance en baisse",
  };
  return noms[categorie];
}

export function libelleCategorieSignalement(
  categorie: CategorieSignalement,
  maille: string,
): string {
  switch (categorie) {
    case "taux_avancement_non_calcule":
      return LIBELLE_TAUX_NON_CALCULE;
    case "absence_taux_avancement_departemental":
      return LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL;
    case "meteo_synthese_non_renseignees":
      return LIBELLE_METEO_SYNTHESE_NON_RENSEIGNEES;
    case "proposition_valeur_avancement":
      return LIBELLE_PROPOSITION_VALEUR_AVANCEMENT;
    case "retard_mediane":
      return libelleRetardMediane(
        maille === "REG" ? "régionale" : "départementale",
      );
    case "tendance_baisse":
      return LIBELLE_TENDANCE_BAISSE;
  }
}

export type ChantierTerritoireAvecJalon = {
  id: string;
  meteo: string | null;
  tendance: string | null;
  nombre_propositions_valeur_actuelle: number;
  chantier_identite: { cible_attendue: boolean };
  chantier_territoire_jalon: {
    ecart: number | null;
    taux_avancement: number | null;
  }[];
};

export function categoriesDuChantier(
  ct: ChantierTerritoireAvecJalon,
  maille: string,
  pvaChantierIds: ReadonlySet<string>,
  sansTauxDepartementalIds: ReadonlySet<string>,
): CategorieSignalement[] {
  const applicables = categoriesApplicables(maille);
  const jalonData = ct.chantier_territoire_jalon[0];
  const categories: CategorieSignalement[] = [];

  if (
    applicables.includes("taux_avancement_non_calcule") &&
    ct.chantier_identite.cible_attendue &&
    (jalonData?.taux_avancement === null ||
      jalonData?.taux_avancement === undefined)
  ) {
    categories.push("taux_avancement_non_calcule");
  }

  if (
    applicables.includes("absence_taux_avancement_departemental") &&
    sansTauxDepartementalIds.has(ct.id)
  ) {
    categories.push("absence_taux_avancement_departemental");
  }

  if (
    applicables.includes("meteo_synthese_non_renseignees") &&
    (ct.meteo === "NON_RENSEIGNEE" || ct.meteo === null)
  ) {
    categories.push("meteo_synthese_non_renseignees");
  }

  if (applicables.includes("proposition_valeur_avancement")) {
    const possedeUnePva =
      maille === "DEPT"
        ? ct.nombre_propositions_valeur_actuelle > 0
        : pvaChantierIds.has(ct.id);
    if (possedeUnePva) categories.push("proposition_valeur_avancement");
  }

  if (
    applicables.includes("retard_mediane") &&
    jalonData?.ecart !== null &&
    jalonData?.ecart !== undefined &&
    jalonData.ecart < -10
  ) {
    categories.push("retard_mediane");
  }

  if (applicables.includes("tendance_baisse") && ct.tendance === "BAISSE") {
    categories.push("tendance_baisse");
  }

  return categories;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:server:unit -- CalculCategoriesSignalement`
Expected: PASS, all cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/server/chantiers/domain/CalculCategoriesSignalement.ts apps/pilote-ppg/src/server/chantiers/__tests__/domain/CalculCategoriesSignalement.unit.test.ts
git commit -m "feat(chantiers): module de calcul pur des catégories de signalement"
```

---

### Task 3: Extract territorial roll-ups; refactor `GetChantiersSignalesQuery` without behavior change

**Files:**
- Modify: `apps/pilote-ppg/src/server/chantiers/domain/CalculCategoriesSignalement.ts`
- Modify: `apps/pilote-ppg/src/server/chantiers/infrastructure/queries/GetChantiersSignalesQuery.ts`
- No new test file — regression guard is the existing, unmodified `apps/pilote-ppg/src/server/chantiers/__tests__/infrastructure/queries/GetChantiersSignalesQuery.integration.test.ts`.

**Interfaces:**
- Produces (consumed by Task 4): `export async function compterPva(prisma: PilotePrismaClient, maille: string, chantierIdsApplicables: string[], params: { territoireCode: string }): Promise<Set<string>>`, `export async function chantiersSansTauxDepartemental(prisma: PilotePrismaClient, maille: string, chantierTerritoires: ChantierTerritoireAvecJalon[], jalonParDefaut: number): Promise<Set<string>>`.

This is a pure refactor (move code, adapt one return type from `number` to `Set<string>`, adjust the one call site that consumes it) with **zero intended behavior change** — the existing 13 integration test cases are the safety net.

- [ ] **Step 1: Run the existing integration tests to confirm the green baseline**

Run: `pnpm test:server:integration -- GetChantiersSignalesQuery`
Expected: PASS (13 passing tests) — this is the baseline the refactor must not break.

- [ ] **Step 2: Add the roll-up functions to the shared module**

Append to `apps/pilote-ppg/src/server/chantiers/domain/CalculCategoriesSignalement.ts` (add the `PilotePrismaClient` import at the top):

```ts
import { PilotePrismaClient } from "@/server/db/PrismaTransaction";
```

```ts
export async function compterPva(
  prisma: PilotePrismaClient,
  maille: string,
  chantierIdsApplicables: string[],
  params: { territoireCode: string },
): Promise<Set<string>> {
  if (maille === "NAT") {
    const enfants = await prisma.chantier_territoire.findMany({
      where: {
        id: { in: chantierIdsApplicables },
        maille: { in: ["REG", "DEPT"] },
        est_applicable: true,
        nombre_propositions_valeur_actuelle: { gt: 0 },
      },
      select: { id: true },
    });
    return new Set(enfants.map((e) => e.id));
  }

  if (maille === "REG") {
    const territoiresEnfants = await prisma.territoire.findMany({
      where: { code_parent: params.territoireCode },
      select: { code: true },
    });
    const codesEnfants = territoiresEnfants.map((t) => t.code);
    const enfants = await prisma.chantier_territoire.findMany({
      where: {
        id: { in: chantierIdsApplicables },
        territoire_code: { in: [params.territoireCode, ...codesEnfants] },
        est_applicable: true,
        nombre_propositions_valeur_actuelle: { gt: 0 },
      },
      select: { id: true },
    });
    return new Set(enfants.map((e) => e.id));
  }

  return new Set();
}

export async function chantiersSansTauxDepartemental(
  prisma: PilotePrismaClient,
  maille: string,
  chantierTerritoires: ChantierTerritoireAvecJalon[],
  jalonParDefaut: number,
): Promise<Set<string>> {
  if (maille !== "NAT") return new Set();

  const chantierIdsCibleAttendue = chantierTerritoires
    .filter((ct) => ct.chantier_identite.cible_attendue)
    .map((ct) => ct.id);

  if (chantierIdsCibleAttendue.length === 0) return new Set();

  const deptApplicables = await prisma.chantier_territoire.findMany({
    where: {
      id: { in: chantierIdsCibleAttendue },
      maille: "DEPT",
      est_applicable: true,
    },
    select: {
      id: true,
      chantier_territoire_jalon: {
        where: { jalon: jalonParDefaut },
        select: { taux_avancement: true },
      },
    },
  });

  const chantiersAvecTaux = new Set(
    deptApplicables
      .filter((dept) =>
        dept.chantier_territoire_jalon.some(
          (jalon) => jalon.taux_avancement !== null,
        ),
      )
      .map((dept) => dept.id),
  );

  const chantiersAvecDept = new Set(deptApplicables.map((dept) => dept.id));

  const result = new Set<string>();
  for (const chantierId of chantierIdsCibleAttendue) {
    if (!chantiersAvecDept.has(chantierId)) continue;
    if (!chantiersAvecTaux.has(chantierId)) result.add(chantierId);
  }
  return result;
}
```

- [ ] **Step 3: Refactor `GetChantiersSignalesQuery` to delegate to the shared module**

Replace the file's private `compterPva` and `compterAbsenceTauxDepartemental` methods and the local `ChantierTerritoireAvecJalon` type with imports, and adapt `agregerCompteurs` to take a `Set<string>` and use its `.size`:

```ts
// apps/pilote-ppg/src/server/chantiers/infrastructure/queries/GetChantiersSignalesQuery.ts
import { Inject } from "@/server/chantiers/module";
import { ChantiersSignalesContrat } from "@/server/chantiers/app/contrats/ChantiersSignalesContrat";
import { PilotePrismaClient } from "@/server/db/PrismaTransaction";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import {
  ChantierTerritoireAvecJalon,
  chantiersSansTauxDepartemental,
  compterPva,
} from "@/server/chantiers/domain/CalculCategoriesSignalement";

export class GetChantiersSignalesQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async execute(params: {
    chantierIds: string[];
    territoireCode: string;
    jalonParDefaut: number;
  }): Promise<ChantiersSignalesContrat> {
    const prisma = this.deps.prisma.getInstance();

    const chantierTerritoires = await this.recupererChantierTerritoires(
      prisma,
      params,
    );

    const { maille } = territoireCodeVersMailleCodeInsee(params.territoireCode);
    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);

    const pvaChantierIds = await compterPva(
      prisma,
      maille,
      chantierIdsApplicables,
      params,
    );

    const absenceTauxDeptIds = await chantiersSansTauxDepartemental(
      prisma,
      maille,
      chantierTerritoires,
      params.jalonParDefaut,
    );

    return this.agregerCompteurs(
      chantierTerritoires,
      maille,
      pvaChantierIds,
      absenceTauxDeptIds,
    );
  }

  private async recupererChantierTerritoires(
    prisma: PilotePrismaClient,
    params: {
      chantierIds: string[];
      territoireCode: string;
      jalonParDefaut: number;
    },
  ) {
    return prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: {
          NOT: { ministeres: { isEmpty: true } },
        },
        id: { in: params.chantierIds },
      },
      select: {
        id: true,
        meteo: true,
        tendance: true,
        nombre_propositions_valeur_actuelle: true,
        maille: true,
        chantier_identite: {
          select: { cible_attendue: true },
        },
        chantier_territoire_jalon: {
          where: { jalon: params.jalonParDefaut },
          select: { ecart: true, taux_avancement: true },
        },
      },
    });
  }

  private agregerCompteurs(
    chantierTerritoires: ChantierTerritoireAvecJalon[],
    maille: string,
    pvaChantierIds: Set<string>,
    absenceTauxDeptIds: Set<string>,
  ): ChantiersSignalesContrat {
    let ecart = 0;
    let baisse = 0;
    let tauxNonCalcule = 0;
    let meteoNonRenseignee = 0;
    let pva = 0;

    for (const ct of chantierTerritoires) {
      const jalonData = ct.chantier_territoire_jalon[0];

      if (jalonData?.ecart !== null && jalonData?.ecart !== undefined) {
        if (jalonData.ecart < -10) ecart++;
      }

      if (ct.tendance === "BAISSE") baisse++;

      if (
        ct.chantier_identite.cible_attendue &&
        (jalonData?.taux_avancement === null ||
          jalonData?.taux_avancement === undefined)
      ) {
        tauxNonCalcule++;
      }

      if (ct.meteo === "NON_RENSEIGNEE" || ct.meteo === null)
        meteoNonRenseignee++;

      if (maille === "DEPT") {
        if (ct.nombre_propositions_valeur_actuelle > 0) pva++;
      } else {
        if (pvaChantierIds.has(ct.id)) pva++;
      }
    }

    return {
      estEnAlerteÉcart: ecart,
      estEnAlerteBaisse: baisse,
      estEnAlerteTauxAvancementNonCalculé: tauxNonCalcule,
      estEnAlerteAbscenceTauxAvancementDepartemental: absenceTauxDeptIds.size,
      estEnAlerteMétéoNonRenseignée: meteoNonRenseignee,
      estEnAlertePossedePropositionsValeurAvancement: pva,
    };
  }
}
```

- [ ] **Step 4: Run the same integration tests to confirm no regression**

Run: `pnpm test:server:integration -- GetChantiersSignalesQuery`
Expected: PASS, same 13 tests, unmodified assertions.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/server/chantiers/domain/CalculCategoriesSignalement.ts apps/pilote-ppg/src/server/chantiers/infrastructure/queries/GetChantiersSignalesQuery.ts
git commit -m "refactor(chantiers): factoriser les roll-up PVA et taux départemental"
```

---

### Task 4: New query — `GetChantiersSignalesListQuery`

**Files:**
- Create: `apps/pilote-ppg/src/server/chantiers/query/GetChantiersSignalesListQuery.ts`
- Test: `apps/pilote-ppg/src/server/chantiers/__tests__/query/GetChantiersSignalesListQuery.integration.test.ts`

**Interfaces:**
- Consumes: `categoriesApplicables`, `categoriesDuChantier`, `libelleCategorieSignalement`, `compterPva`, `chantiersSansTauxDepartemental`, `CategorieSignalement` from Task 2/3's `CalculCategoriesSignalement`.
- Produces (consumed by Task 5): `export type GetChantiersSignalesListParams = { territoireCode: string; jalon: number; chantierIds?: string[]; categorieSignalement?: CategorieSignalement }`, `export type ChantierSignaleResult = { chantier: { id: string; nom: string; axe: string; ppg: string; ministeres: string[] }; categories_signalement: string[]; meteo: string | null; tendance: string | null; ecart: number | null; taux_avancement: number | null }`, `export type GetChantiersSignalesListResult = { territoire_code: string; territoire_nom: string; jalon: number; maille: string; chantiers: ChantierSignaleResult[] }`, `export class GetChantiersSignalesListQuery { constructor(deps: { prisma: PrismaPilote }); execute(params: GetChantiersSignalesListParams): Promise<GetChantiersSignalesListResult> }`.

- [ ] **Step 1: Write the failing integration tests**

```ts
// apps/pilote-ppg/src/server/chantiers/__tests__/query/GetChantiersSignalesListQuery.integration.test.ts
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { getPrisma } from "@/server/db/PrismaTransaction";
import { GetChantiersSignalesListQuery } from "@/server/chantiers/query/GetChantiersSignalesListQuery";
import { LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL } from "@/server/chantiers/app/contrats/LibellesAlerteChantier";

describe("GetChantiersSignalesListQuery", () => {
  let query: GetChantiersSignalesListQuery;

  beforeEach(() => {
    query = new GetChantiersSignalesListQuery({ prisma: new PrismaPilote() });
  });

  it(
    "regroupe plusieurs catégories pour un même chantier sans le dupliquer",
    createIntegrationTest(async () => {
      // Given — un chantier départemental avec météo non renseignée ET tendance en baisse
      await fixtures.chantierIdentite({
        id: "CH-001",
        nom: "Chantier multi-signalé",
        axe: "Axe 1",
        ppg: "PPG 1",
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "NON_RENSEIGNEE",
        tendance: "BAISSE",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: 0,
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([
        {
          chantier: {
            id: "CH-001",
            nom: "Chantier multi-signalé",
            axe: "Axe 1",
            ppg: "PPG 1",
            ministeres: ["MIN-01"],
          },
          categories_signalement: [
            "Chantier(s) avec météo et synthèse des résultats non renseignés",
            "Chantier(s) avec tendance en baisse",
          ],
          meteo: "NON_RENSEIGNEE",
          tendance: "BAISSE",
          ecart: 0,
          taux_avancement: null,
        },
      ]);
    }),
  );

  it(
    "n'inclut pas un chantier sans aucune catégorie applicable",
    createIntegrationTest(async () => {
      // Given — chantier sans anomalie
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
        tendance: "HAUSSE",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: 0,
        taux_avancement: 50,
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([]);
    }),
  );

  it(
    "n'inclut pas un chantier en difficulté (météo dégradée) au seul motif de sa météo",
    createIntegrationTest(async () => {
      // Given — météo ORAGE (donc "en difficulté"), mais aucune catégorie de signalement
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "ORAGE",
        tendance: "HAUSSE",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: 0,
        taux_avancement: 50,
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then — la météo ORAGE seule ne suffit pas à signaler ce chantier
      expect(result.chantiers).toEqual([]);
    }),
  );

  it(
    "filtre sur une catégorie précise avec categorieSignalement",
    createIntegrationTest(async () => {
      // Given — CH-001 en retard, CH-002 avec PVA
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: -15,
      });
      await fixtures.chantierIdentite({
        id: "CH-002",
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-002",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
        nombre_propositions_valeur_actuelle: 1,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-002",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
        ecart: 0,
      });

      // When — on ne demande que la PVA
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
        categorieSignalement: "proposition_valeur_avancement",
      });

      // Then — seul CH-002 est retourné, avec uniquement cette catégorie
      expect(result.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-002" }),
          categories_signalement: [
            "Chantier(s) avec proposition(s) de valeur d'avancement",
          ],
        }),
      ]);
    }),
  );

  it(
    "propage la PVA depuis les territoires enfants au national",
    createIntegrationTest(async () => {
      // Given — PVA = 0 au NAT, mais > 0 sur un DEPT enfant
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
        nombre_propositions_valeur_actuelle: 0,
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        est_applicable: true,
        meteo: "SOLEIL",
        nombre_propositions_valeur_actuelle: 3,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-001" }),
          categories_signalement: [
            "Chantier(s) avec proposition(s) de valeur d'avancement",
          ],
        }),
      ]);
    }),
  );

  it(
    "détecte l'absence de taux d'avancement départemental au national",
    createIntegrationTest(async () => {
      // Given — cible_attendue, DEPT applicable mais taux_avancement null
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
        cible_attendue: true,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        est_applicable: true,
        meteo: "SOLEIL",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "NAT-FR",
        code_insee: "FR",
        maille: "NAT",
        zone_id: "zone-1",
        jalon: 2025,
        taux_avancement: 50,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        est_applicable: true,
        meteo: "SOLEIL",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-2",
        jalon: 2025,
        taux_avancement: null,
      });

      // When
      const result = await query.execute({
        territoireCode: "NAT-FR",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([
        expect.objectContaining({
          chantier: expect.objectContaining({ id: "CH-001" }),
          categories_signalement: [LIBELLE_ABSENCE_TAUX_DEPARTEMENTAL],
        }),
      ]);
    }),
  );

  it(
    "exclut les chantiers d'un autre territoire",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({
        id: "CH-001",
        ministeres_acronymes: ["MIN-01"],
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        tendance: "BAISSE",
      });
      await fixtures.chantierTerritoireJalon({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        jalon: 2025,
      });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-76",
        code_insee: "76",
        maille: "DEPT",
        zone_id: "zone-2",
        est_applicable: true,
        tendance: "HAUSSE",
      });

      // When — on interroge DEPT-76 uniquement
      const result = await query.execute({
        territoireCode: "DEPT-76",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([]);
    }),
  );

  it(
    "exclut les chantiers sans ministère, même applicables",
    createIntegrationTest(async () => {
      // Given
      await fixtures.chantierIdentite({ id: "CH-001", ministeres_acronymes: [] });
      await fixtures.chantierTerritoire({
        id: "CH-001",
        territoire_code: "DEPT-75",
        code_insee: "75",
        maille: "DEPT",
        zone_id: "zone-1",
        est_applicable: true,
        tendance: "BAISSE",
      });

      // When
      const result = await query.execute({
        territoireCode: "DEPT-75",
        jalon: 2025,
      });

      // Then
      expect(result.chantiers).toEqual([]);
    }),
  );
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:server:integration -- GetChantiersSignalesListQuery`
Expected: FAIL with "Cannot find module '@/server/chantiers/query/GetChantiersSignalesListQuery'"

- [ ] **Step 3: Implement the query**

```ts
// apps/pilote-ppg/src/server/chantiers/query/GetChantiersSignalesListQuery.ts
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PilotePrismaClient } from "@/server/db/PrismaTransaction";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";
import {
  categoriesApplicables,
  categoriesDuChantier,
  chantiersSansTauxDepartemental,
  compterPva,
  libelleCategorieSignalement,
  type CategorieSignalement,
} from "@/server/chantiers/domain/CalculCategoriesSignalement";

type ChantierTerritoireRow = {
  id: string;
  meteo: string | null;
  tendance: string | null;
  nombre_propositions_valeur_actuelle: number;
  chantier_identite: {
    id: string;
    nom: string;
    axe: string;
    ppg: string;
    ministeres_acronymes: string[];
    cible_attendue: boolean;
  };
  chantier_territoire_jalon: {
    ecart: number | null;
    taux_avancement: number | null;
  }[];
};

export type GetChantiersSignalesListParams = {
  territoireCode: string;
  jalon: number;
  chantierIds?: string[];
  categorieSignalement?: CategorieSignalement;
};

export type ChantierSignaleResult = {
  chantier: {
    id: string;
    nom: string;
    axe: string;
    ppg: string;
    ministeres: string[];
  };
  categories_signalement: string[];
  meteo: string | null;
  tendance: string | null;
  ecart: number | null;
  taux_avancement: number | null;
};

export type GetChantiersSignalesListResult = {
  territoire_code: string;
  territoire_nom: string;
  jalon: number;
  maille: string;
  chantiers: ChantierSignaleResult[];
};

export class GetChantiersSignalesListQuery {
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  async execute(
    params: GetChantiersSignalesListParams,
  ): Promise<GetChantiersSignalesListResult> {
    const prisma = this.deps.prisma.getInstance();

    const territoire = await prisma.territoire.findUniqueOrThrow({
      where: { code: params.territoireCode },
    });

    const { maille } = territoireCodeVersMailleCodeInsee(params.territoireCode);

    const chantierTerritoires = await this.recupererChantierTerritoires(
      prisma,
      params,
    );

    const chantierIdsApplicables = chantierTerritoires.map((ct) => ct.id);

    const categoriesRecherchees = params.categorieSignalement
      ? [params.categorieSignalement]
      : categoriesApplicables(maille);

    const pvaChantierIds = categoriesRecherchees.includes(
      "proposition_valeur_avancement",
    )
      ? await compterPva(prisma, maille, chantierIdsApplicables, params)
      : new Set<string>();

    const sansTauxDeptIds = categoriesRecherchees.includes(
      "absence_taux_avancement_departemental",
    )
      ? await chantiersSansTauxDepartemental(
          prisma,
          maille,
          chantierTerritoires,
          params.jalon,
        )
      : new Set<string>();

    const chantiers: ChantierSignaleResult[] = [];

    for (const ct of chantierTerritoires) {
      const categories = categoriesDuChantier(
        ct,
        maille,
        pvaChantierIds,
        sansTauxDeptIds,
      ).filter((categorie) => categoriesRecherchees.includes(categorie));

      if (categories.length === 0) continue;

      const jalonData = ct.chantier_territoire_jalon[0];

      chantiers.push({
        chantier: {
          id: ct.chantier_identite.id,
          nom: ct.chantier_identite.nom,
          axe: ct.chantier_identite.axe,
          ppg: ct.chantier_identite.ppg,
          ministeres: ct.chantier_identite.ministeres_acronymes,
        },
        categories_signalement: categories.map((categorie) =>
          libelleCategorieSignalement(categorie, maille),
        ),
        meteo: ct.meteo,
        tendance: ct.tendance,
        ecart: jalonData?.ecart ?? null,
        taux_avancement: jalonData?.taux_avancement ?? null,
      });
    }

    chantiers.sort((a, b) => a.chantier.id.localeCompare(b.chantier.id));

    return {
      territoire_code: params.territoireCode,
      territoire_nom: territoire.nom,
      jalon: params.jalon,
      maille,
      chantiers,
    };
  }

  private async recupererChantierTerritoires(
    prisma: PilotePrismaClient,
    params: GetChantiersSignalesListParams,
  ): Promise<ChantierTerritoireRow[]> {
    return prisma.chantier_territoire.findMany({
      where: {
        territoire_code: params.territoireCode,
        est_applicable: true,
        chantier_identite: {
          NOT: { ministeres: { isEmpty: true } },
        },
        ...(params.chantierIds && params.chantierIds.length > 0
          ? { id: { in: params.chantierIds } }
          : {}),
      },
      select: {
        id: true,
        meteo: true,
        tendance: true,
        nombre_propositions_valeur_actuelle: true,
        chantier_identite: {
          select: {
            id: true,
            nom: true,
            axe: true,
            ppg: true,
            ministeres_acronymes: true,
            cible_attendue: true,
          },
        },
        chantier_territoire_jalon: {
          where: { jalon: params.jalon },
          select: { ecart: true, taux_avancement: true },
        },
      },
    });
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:server:integration -- GetChantiersSignalesListQuery`
Expected: PASS, all cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/server/chantiers/query/GetChantiersSignalesListQuery.ts apps/pilote-ppg/src/server/chantiers/__tests__/query/GetChantiersSignalesListQuery.integration.test.ts
git commit -m "feat(chantiers): query GetChantiersSignalesListQuery au grain chantier"
```

---

### Task 5: Albert tool — `get_chantiers_signales`

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/tools/getChantiersSignales.ts`
- Test: `apps/pilote-ppg/src/server/albert/__tests__/tools/getChantiersSignales.unit.test.ts`

**Interfaces:**
- Consumes: `GetChantiersSignalesListQuery` (Task 4), `TerritoireResolver` (`resoudre(territoireCode: string, includeSousTerritoires: boolean): Promise<string[]>`, existing), `categoriesApplicables`, `nomCategorie`, `CATEGORIES_SIGNALEMENT`, `CategorieSignalement` (Task 2), `LIBELLE_TENDANCE_BAISSE` (Task 1), `territoireCodeVersMailleCodeInsee` (existing, `@/server/utils/territoires`).
- Produces (consumed by Task 6): `export const getChantiersSignalesInputSchema`, `export type GetChantiersSignalesOutput`, `export function createGetChantiersSignalesTool(deps: { getChantiersSignalesListQuery: GetChantiersSignalesListQuery; territoireResolver: TerritoireResolver }): (scope: { territoiresAccessibles: string[]; chantiersAccessibles: string[] }) => Tool`.

- [ ] **Step 1: Write the failing unit tests**

```ts
// apps/pilote-ppg/src/server/albert/__tests__/tools/getChantiersSignales.unit.test.ts
import { describe, expect, test } from "vitest";
import { mock } from "vitest-mock-extended";
import {
  createGetChantiersSignalesTool,
  type GetChantiersSignalesOutput,
} from "@/server/albert/tools/getChantiersSignales";
import type { GetChantiersSignalesListQuery } from "@/server/chantiers/query/GetChantiersSignalesListQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";

const buildTool = ({
  queryResults,
  territoiresAccessibles = ["DEPT-75", "REG-11", "NAT-FR"],
  chantiersAccessibles = ["CH-001", "CH-002"],
  resoudre,
}: {
  queryResults: Record<
    string,
    Awaited<ReturnType<GetChantiersSignalesListQuery["execute"]>>
  >;
  territoiresAccessibles?: string[];
  chantiersAccessibles?: string[];
  resoudre?: string[];
}) => {
  const query = mock<GetChantiersSignalesListQuery>({
    execute: async (params) => queryResults[params.territoireCode],
  });
  const territoireResolver = mock<TerritoireResolver>({
    resoudre: async () => resoudre ?? Object.keys(queryResults),
  });
  return createGetChantiersSignalesTool({
    getChantiersSignalesListQuery: query,
    territoireResolver,
  })({ territoiresAccessibles, chantiersAccessibles });
};

const executeTool = async (
  tool: ReturnType<ReturnType<typeof createGetChantiersSignalesTool>>,
  input: Record<string, unknown>,
): Promise<GetChantiersSignalesOutput> =>
  tool.execute!(
    input,
    { toolCallId: "test", messages: [], abortSignal: undefined },
  ) as Promise<GetChantiersSignalesOutput>;

const resultatDept: Awaited<ReturnType<GetChantiersSignalesListQuery["execute"]>> = {
  territoire_code: "DEPT-75",
  territoire_nom: "Paris",
  jalon: 2025,
  maille: "DEPT",
  chantiers: [
    {
      chantier: {
        id: "CH-001",
        nom: "Chantier test",
        axe: "Axe 1",
        ppg: "PPG 1",
        ministeres: ["MIN-01"],
      },
      categories_signalement: [
        "Chantier(s) avec tendance en baisse",
      ],
      meteo: "SOLEIL",
      tendance: "BAISSE",
      ecart: 0,
      taux_avancement: 50,
    },
  ],
};

describe("createGetChantiersSignalesTool execute", () => {
  test("retourne les chantiers signalés du territoire demandé", async () => {
    // Given
    const tool = buildTool({
      queryResults: { "DEPT-75": resultatDept },
      resoudre: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "DEPT-75",
      jalon: 2025,
    });

    // Then
    expect(result.resultats).toEqual([resultatDept]);
  });

  test("renvoie non_applicable quand la catégorie demandée ne s'applique pas à la maille", async () => {
    // Given — retard_mediane demandé sur un territoire national
    const tool = buildTool({
      queryResults: {},
      resoudre: ["NAT-FR"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "NAT-FR",
      jalon: 2025,
      categorie_signalement: "retard_mediane",
    });

    // Then
    expect(result.resultats).toEqual([
      {
        territoire_code: "NAT-FR",
        chantiers: [],
        non_applicable: { raison: expect.any(String) },
      },
    ]);
  });

  test("masque la catégorie tendance_baisse pour un territoire hors périmètre accessible", async () => {
    // Given — REG-99 résolu via sous-territoires mais absent de territoiresAccessibles
    const resultatMulti: Awaited<
      ReturnType<GetChantiersSignalesListQuery["execute"]>
    > = {
      territoire_code: "REG-99",
      territoire_nom: "Région test",
      jalon: 2025,
      maille: "REG",
      chantiers: [
        {
          chantier: {
            id: "CH-001",
            nom: "Chantier",
            axe: "Axe 1",
            ppg: "PPG 1",
            ministeres: ["MIN-01"],
          },
          categories_signalement: [
            "Chantier(s) avec météo et synthèse des résultats non renseignés",
            "Chantier(s) avec tendance en baisse",
          ],
          meteo: "NON_RENSEIGNEE",
          tendance: "BAISSE",
          ecart: 0,
          taux_avancement: 50,
        },
      ],
    };
    const tool = buildTool({
      queryResults: { "REG-99": resultatMulti },
      territoiresAccessibles: ["REG-11"],
      resoudre: ["REG-99"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "REG-99",
      jalon: 2025,
    });

    // Then — tendance_baisse retirée, meteo_synthese conservée
    expect(result.resultats).toEqual([
      expect.objectContaining({
        chantiers: [
          expect.objectContaining({
            tendance: null,
            categories_signalement: [
              "Chantier(s) avec météo et synthèse des résultats non renseignés",
            ],
          }),
        ],
      }),
    ]);
  });

  test("retourne un message dédié quand aucun des chantiers demandés n'est accessible", async () => {
    // Given
    const tool = buildTool({
      queryResults: {},
      chantiersAccessibles: ["CH-999"],
      resoudre: ["DEPT-75"],
    });

    // When
    const result = await executeTool(tool, {
      territoire_code: "DEPT-75",
      jalon: 2025,
      chantier_ids: ["CH-001"],
    });

    // Then
    expect(result.resultats).toEqual([]);
    expect(result._output_instructions).toContain("Aucun des chantiers demandés");
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `pnpm test:server:unit -- getChantiersSignales`
Expected: FAIL with "Cannot find module '@/server/albert/tools/getChantiersSignales'"

- [ ] **Step 3: Implement the tool**

```ts
// apps/pilote-ppg/src/server/albert/tools/getChantiersSignales.ts
import { tool } from "ai";
import { z } from "zod";
import { GetChantiersSignalesListQuery } from "@/server/chantiers/query/GetChantiersSignalesListQuery";
import type { GetChantiersSignalesListResult } from "@/server/chantiers/query/GetChantiersSignalesListQuery";
import type { TerritoireResolver } from "@/server/albert/domain/TerritoireResolver";
import {
  CATEGORIES_SIGNALEMENT,
  categoriesApplicables,
  nomCategorie,
  type CategorieSignalement,
} from "@/server/chantiers/domain/CalculCategoriesSignalement";
import { LIBELLE_TENDANCE_BAISSE } from "@/server/chantiers/app/contrats/LibellesAlerteChantier";
import { territoireCodeVersMailleCodeInsee } from "@/server/utils/territoires";

export const getChantiersSignalesInputSchema = z.object({
  territoire_code: z
    .string()
    .describe("Code du territoire (ex: NAT-FR, REG-11, DEPT-75)"),
  jalon: z
    .number()
    .int()
    .min(2022)
    .max(new Date().getFullYear())
    .describe("Année du jalon (ex: 2024, 2025)"),
  include_sous_territoires: z
    .boolean()
    .optional()
    .default(false)
    .describe(
      "Mets `true` quand la demande couvre un territoire ET ses sous-territoires. " +
        "Dans ce cas, fais UN SEUL appel sur le territoire parent avec ce flag à true, " +
        "plutôt que d'énumérer chaque sous-territoire avec des appels séparés.",
    ),
  chantier_ids: z
    .array(z.string())
    .optional()
    .describe(
      "Identifiants de chantiers (ex: ['CH-001', 'CH-042']). Si fourni, restreint la recherche à ces chantiers.",
    ),
  categorie_signalement: z
    .enum(CATEGORIES_SIGNALEMENT)
    .optional()
    .describe(
      "Restreint aux chantiers ayant cette catégorie de signalement précise : " +
        CATEGORIES_SIGNALEMENT.map(
          (categorie) => `${categorie} (${nomCategorie(categorie)})`,
        ).join(", ") +
        ". Omis : retourne tous les chantiers signalés, toutes catégories applicables à la maille confondues, avec leurs catégories regroupées.",
    ),
});

type GetChantiersSignalesInput = z.infer<typeof getChantiersSignalesInputSchema>;

type ResultatTerritoire =
  | GetChantiersSignalesListResult
  | {
      territoire_code: string;
      chantiers: [];
      non_applicable: { raison: string };
    };

export type GetChantiersSignalesOutput = {
  resultats: ResultatTerritoire[];
  _output_instructions: string;
};

const OUTPUT_INSTRUCTIONS = `Restitue les catégories de signalement telles quelles (elles sont déjà rédigées en langage utilisateur, ne les reformule pas). Un chantier peut cumuler plusieurs catégories : présente-les regroupées pour ce chantier, sans le dupliquer. "Signalé" est une notion distincte de "en retard" et "en difficulté" (qui existent dans l'outil get_chantiers) : ne les confonds pas. Les règles de signalement diffèrent entre le niveau national et les niveaux régional/départemental.`;

function raisonNonApplicable(
  categorie: CategorieSignalement,
  maille: string,
): string {
  const nom = nomCategorie(categorie);
  if (maille === "NAT") {
    return `La catégorie "${nom}" ne s'applique qu'aux mailles régionale et départementale, pas au niveau national.`;
  }
  return `La catégorie "${nom}" ne s'applique qu'au niveau national, pas à la maille régionale ou départementale.`;
}

function masquerCategoriesNonAccessibles(
  resultat: GetChantiersSignalesListResult,
  territoiresAccessibles: string[],
): GetChantiersSignalesListResult {
  if (territoiresAccessibles.includes(resultat.territoire_code)) {
    return resultat;
  }
  return {
    ...resultat,
    chantiers: resultat.chantiers
      .map((chantier) => ({
        ...chantier,
        tendance: null,
        categories_signalement: chantier.categories_signalement.filter(
          (libelle) => libelle !== LIBELLE_TENDANCE_BAISSE,
        ),
      }))
      .filter((chantier) => chantier.categories_signalement.length > 0),
  };
}

export function createGetChantiersSignalesTool({
  getChantiersSignalesListQuery,
  territoireResolver,
}: {
  getChantiersSignalesListQuery: GetChantiersSignalesListQuery;
  territoireResolver: TerritoireResolver;
}) {
  return ({
    territoiresAccessibles,
    chantiersAccessibles,
  }: {
    territoiresAccessibles: string[];
    chantiersAccessibles: string[];
  }) => {
    return tool({
      description: `Récupère les chantiers signalés (rubrique "Chantiers signalés" de PILOTE) pour un territoire et un jalon.

Un chantier est signalé s'il répond à au moins une catégorie de signalement. Les catégories diffèrent selon la maille :
- Au national : taux_avancement_non_calcule, absence_taux_avancement_departemental, meteo_synthese_non_renseignees, proposition_valeur_avancement
- Au régional/départemental : retard_mediane, tendance_baisse, meteo_synthese_non_renseignees, proposition_valeur_avancement

Utilise categorie_signalement pour restreindre à une seule catégorie précise (ex: "quels chantiers ont une PVA ?" -> categorie_signalement=proposition_valeur_avancement). Sans ce filtre, tous les chantiers signalés sont retournés avec leurs catégories regroupées.

⚠️ "Signalé" ne veut pas dire "en retard" ni "en difficulté" : les chantiers en difficulté (météo dégradée) ne sont jamais inclus au seul motif de leur météo. Pour les chantiers en difficulté ou en retard, utilise get_chantiers(view=en_difficulte / en_retard).`,
      inputSchema: getChantiersSignalesInputSchema,
      execute: async (
        input: GetChantiersSignalesInput,
      ): Promise<GetChantiersSignalesOutput> => {
        const filteredChantierIds = input.chantier_ids?.filter((id) =>
          chantiersAccessibles.includes(id),
        );

        if (
          filteredChantierIds &&
          filteredChantierIds.length === 0 &&
          input.chantier_ids &&
          input.chantier_ids.length > 0
        ) {
          return {
            resultats: [],
            _output_instructions:
              "Aucun des chantiers demandés n'est accessible pour cet utilisateur.",
          };
        }

        const codes = await territoireResolver.resoudre(
          input.territoire_code,
          input.include_sous_territoires,
        );

        const resultats = await Promise.all(
          codes.map(async (code): Promise<ResultatTerritoire> => {
            const { maille } = territoireCodeVersMailleCodeInsee(code);

            if (
              input.categorie_signalement &&
              !categoriesApplicables(maille).includes(
                input.categorie_signalement,
              )
            ) {
              return {
                territoire_code: code,
                chantiers: [],
                non_applicable: {
                  raison: raisonNonApplicable(
                    input.categorie_signalement,
                    maille,
                  ),
                },
              };
            }

            const resultat = await getChantiersSignalesListQuery.execute({
              territoireCode: code,
              jalon: input.jalon,
              chantierIds: filteredChantierIds,
              categorieSignalement: input.categorie_signalement,
            });

            return masquerCategoriesNonAccessibles(
              resultat,
              territoiresAccessibles,
            );
          }),
        );

        return {
          resultats,
          _output_instructions: OUTPUT_INSTRUCTIONS,
        };
      },
    });
  };
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `pnpm test:server:unit -- getChantiersSignales`
Expected: PASS, all cases green.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/server/albert/tools/getChantiersSignales.ts apps/pilote-ppg/src/server/albert/__tests__/tools/getChantiersSignales.unit.test.ts
git commit -m "feat(albert): tool get_chantiers_signales"
```

---

### Task 6: Wire the DI container and register the tool for Albert

**Files:**
- Modify: `apps/pilote-ppg/src/server/chantiers/module.ts`
- Modify: `apps/pilote-ppg/src/server/albert/module.ts`
- Modify: `apps/pilote-ppg/src/app/api/albert/chat/route.ts`

**Interfaces:**
- Consumes: `GetChantiersSignalesListQuery` (Task 4), `createGetChantiersSignalesTool` (Task 5).

No new test: this is DI wiring validated by TypeScript's structural check (`satisfies VerifyCradle<...>` in both modules already fails to compile if a registration is missing or mistyped) and by the tool actually being invocable — covered indirectly by the unit test in Task 5, which exercises the tool's `execute` the same way `route.ts` will call it.

- [ ] **Step 1: Register the query in the chantiers module**

In `apps/pilote-ppg/src/server/chantiers/module.ts`:

Add the import near the other query imports:

```ts
import { GetChantiersSignalesListQuery } from "./query/GetChantiersSignalesListQuery";
```

Add to `ChantierExports` and to the `exports` array:

```ts
type ChantierExports = {
  // ...existing entries...
  getChantiersSignalesListQuery: GetChantiersSignalesListQuery;
};
```

```ts
  exports: [
    // ...existing entries...
    "getChantiersSignalesListQuery",
  ],
```

Add to the `register` call, inside `container.register({ ... })`:

```ts
      getChantiersSignalesListQuery: asModuleClass(GetChantiersSignalesListQuery),
```

- [ ] **Step 2: Register the tool factory in the albert module**

In `apps/pilote-ppg/src/server/albert/module.ts`:

Add the import near the other tool imports:

```ts
import { createGetChantiersSignalesTool } from "@/server/albert/tools/getChantiersSignales";
```

Add to `AlbertOwnCradle`:

```ts
  createGetChantiersSignalesTool: ReturnType<
    typeof createGetChantiersSignalesTool
  >;
```

Add to the `register` call:

```ts
      createGetChantiersSignalesTool: asModuleFunction(
        createGetChantiersSignalesTool,
      ),
```

- [ ] **Step 3: Instantiate and register the tool in the chat route**

In `apps/pilote-ppg/src/app/api/albert/chat/route.ts`, alongside the other `container.resolve(...)` calls:

```ts
    const createGetChantiersSignalesTool = container.resolve(
      "createGetChantiersSignalesTool",
    );
```

Alongside the other `createXxxTool({...})` instantiations:

```ts
    const getChantiersSignales = createGetChantiersSignalesTool({
      territoiresAccessibles,
      chantiersAccessibles: session.habilitations.lecture.chantiers,
    });
```

In the `tools` object, add the entry exposed to the LLM:

```ts
    const tools = {
      get_taux_avancement_territoire: getTauxAvancementTerritoire,
      get_chantiers: getChantiers,
      get_chantiers_signales: getChantiersSignales,
      get_indicateurs: getChantierIndicateurs,
      get_chantier_commentaires: getChantierCommentaires,
      get_chantier_objectifs: getChantierObjectifs,
      search_chantiers: searchChantiers,
      search_indicateurs: searchIndicateurs,
      search_territoires: searchTerritoires,
      display_choices: displayChoicesTool,
      ...(capacities.dashboard ? { create_dashboard: createDashboard } : {}),
      ...(capacities.exportRapport ? { export_rapport: exportRapport } : {}),
    };
```

- [ ] **Step 4: Type-check and run the full server test suite**

Run: `pnpm lint` then `pnpm test:server`
Expected: PASS — no TypeScript errors from the `VerifyCradle` checks, and every existing and new server test still green.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/server/chantiers/module.ts apps/pilote-ppg/src/server/albert/module.ts apps/pilote-ppg/src/app/api/albert/chat/route.ts
git commit -m "feat(albert): brancher get_chantiers_signales dans le conteneur DI et le chat"
```

---

## Self-Review Notes

- **Spec coverage:** all 6 categories + maille gating (Task 2/4), multi-category grouping without duplication (Task 4 test 1), single-category filtering (Task 4 test 4, Task 5 test), non-applicable messaging (Task 5 test), permission masking of `tendance_baisse` (Task 5 test), parity refactor of `GetChantiersSignalesQuery` guarded by its existing suite (Task 3), DI wiring (Task 6). `en_retard`/`get_chantiers` are explicitly out of scope per the Global Constraints, matching the spec's final decision.
- **Placeholder scan:** none found — every code block is copy-pasteable as written.
- **Type consistency:** `ChantierTerritoireAvecJalon` (Task 2) matches the minimal shape both `GetChantiersSignalesQuery` (Task 3) and `GetChantiersSignalesListQuery` (Task 4, via its wider `ChantierTerritoireRow`) satisfy structurally. `CategorieSignalement`, `categoriesApplicables`, `categoriesDuChantier`, `libelleCategorieSignalement`, `nomCategorie`, `compterPva`, `chantiersSansTauxDepartemental` are defined once in Task 2/3 and imported verbatim by every later task — no renamed duplicates.
