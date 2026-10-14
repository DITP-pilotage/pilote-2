# Cartographie des indicateurs non à jour — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Objectif :** ajouter sur la page chantier une carte des territoires non à jour, au niveau chantier et au niveau indicateur, sur le modèle de `WidgetCartographiePVA`.

**Architecture :** la définition de « non à jour » (les `where` Prisma et le prédicat JS) est sortie dans un module serveur partagé. Ce module est utilisé par `GetIndicateursNonAJourQuery` (assistant IA) et par une nouvelle requête, `GetTerritoiresNonAJourQuery`. Celle-ci renvoie une liste plate de territoires pour la carte, via deux méthodes : `byChantier` et `byIndicateur`. Deux routes tRPC alimentent un nouveau widget, `WidgetCartographieIndicateursNonAJour`, branché dans les deux sélecteurs de carte de la page chantier.

**Stack technique :** Next.js, tRPC, Prisma, Awilix, React 18, Tailwind/DSFR, Vitest.

**Spec :** `docs/superpowers/specs/2026-10-12-cartographie-indicateurs-non-a-jour-design.md`

Tous les chemins `src/...` sont relatifs à `apps/pilote-ppg/`. Les commandes `pnpm` se lancent depuis `apps/pilote-ppg/`.

## Contraintes globales

- Branche : `feat/cartographie-indicateurs-non-a-jour`, déjà créée depuis `feat/indicateurs-non-a-jour-assistant`.
- **Ne jamais commiter sans demande explicite de l'utilisateur.** Une étape « Commit » consiste à proposer le commit, puis à attendre l'accord.
- **Nommage : le métier en français, la technique en anglais.**
  - Métier : `territoire`, `indicateur`, `chantier`, `nonAJour`, `estApplicable`, `dateDerniereValeur`.
  - Technique : verbes et notions d'implémentation (`get`, `format`, `build`, `sort`, `map`, `fill`, `tooltip`, `table`, `legend`, `by`).
  - Exception : le nom du widget public (`WidgetCartographieIndicateursNonAJour`) et son dossier suivent la convention des widgets voisins (`WidgetCartographiePVA`, `WidgetCartographieMeteo`).
- Non à jour = indicateur publié, dans un chantier publié, `est_applicable = true`, et `est_a_jour` faux ou NULL.
- Mailles affichées : `NAT`, `REG`, `DEPT`.
- Couleurs :
  - non à jour = `#B34000` (`dsfr-warning-425`) ;
  - à jour = `#bababa` ;
  - non applicable = `REMPLISSAGE_HACHURE`.
- L'infobulle chantier n'affiche que le nombre d'indicateurs non à jour, par exemple « 3 indicateurs non à jour ».
- Hors périmètre : export CSV, jalon, widget dans le dashboard de l'assistant IA.
- Libellés des sélecteurs : « Carte des indicateurs non à jour » côté chantier, « Carte de mise à jour de l'indicateur » côté indicateur.
- **Tests : intégration côté serveur uniquement.** Aucun test client : les autres cartes n'en ont pas, et il n'y a pas de logique complexe ici.
- Conventions du projet :
  - `expect(result).toEqual([{...}])` plutôt que `toHaveLength` suivi d'un accès par index ;
  - pas de variable d'un ou deux caractères ;
  - pas de commentaire superflu en dehors de given/when/then.

## Points d'attention en revue

1. **Territoire avec `est_applicable` NULL** : il est traité comme non applicable, ni compté non à jour ni compté à jour. Testé dans la tâche 2 (`byIndicateur`).
2. **Territoire où toutes les lignes du chantier sont non applicables** : il est grisé avec `nbIndicateursNonAJour = 0`, même si `est_a_jour` est faux. Testé dans la tâche 2 (`byChantier`).
3. **Indicateur ou chantier non publié** : il n'est jamais affiché ni compté. Testé dans la tâche 2 (`byChantier`).
4. **Territoire applicable sans aucune valeur** (`est_a_jour` NULL, dates NULL) : il est non à jour. L'infobulle et le tableau affichent « Aucune valeur » et « - ». Testé dans la tâche 2 côté serveur, et vérifié à la main dans la tâche 5.
5. **Divergence entre la carte et l'assistant** : pour un même jeu de données, les deux listent les mêmes territoires non à jour. Testé dans la tâche 2 (test de cohérence).

---

### Tâche 1 : module partagé de la définition « non à jour »

**Fichiers :**
- Créer : `src/server/chantiers/infrastructure/queries/indicateurNonAJour.ts`
- Modifier : `src/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery.ts`
- Test de non-régression : `src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursNonAJourQuery.integration.test.ts` (inchangé)

**Interfaces :**
- Produit :
  - `perimetreIndicateursPubliesWhere(params: { chantierIds: string[]; territoireCodes?: string[]; indicateurIds?: string[]; mailles?: $Enums.Maille[] }): Prisma.indicateur_territoireWhereInput`
  - `NON_A_JOUR_WHERE: Prisma.indicateur_territoireWhereInput`
  - `estNonAJour(row: { est_applicable: boolean | null; est_a_jour: boolean | null }): boolean`
  - `formatDate(date: Date | null): string | null` (ISO `YYYY-MM-DD`)

- [ ] **Étape 1 : créer le module**

```ts
// src/server/chantiers/infrastructure/queries/indicateurNonAJour.ts
import type { $Enums, Prisma } from "@prisma/client";
import { toISODate } from "@/server/app/domain/Dates";

export const perimetreIndicateursPubliesWhere = (params: {
  chantierIds: string[];
  territoireCodes?: string[];
  indicateurIds?: string[];
  mailles?: $Enums.Maille[];
}): Prisma.indicateur_territoireWhereInput => ({
  chantier_id: { in: params.chantierIds },
  ...(params.territoireCodes
    ? { territoire_code: { in: params.territoireCodes } }
    : {}),
  ...(params.indicateurIds ? { id: { in: params.indicateurIds } } : {}),
  ...(params.mailles ? { maille: { in: params.mailles } } : {}),
  indicateur_identite: {
    statut: "PUBLIE",
    chantier_identite: { statut: "PUBLIE" },
  },
});

export const NON_A_JOUR_WHERE: Prisma.indicateur_territoireWhereInput = {
  est_applicable: true,
  OR: [{ est_a_jour: false }, { est_a_jour: null }],
};

export const estNonAJour = (row: {
  est_applicable: boolean | null;
  est_a_jour: boolean | null;
}) => row.est_applicable === true && row.est_a_jour !== true;

export const formatDate = (date: Date | null) =>
  date ? toISODate(date) : null;
```

- [ ] **Étape 2 : refactorer `GetIndicateursNonAJourQuery` pour utiliser le module**

Dans `GetIndicateursNonAJourQuery.ts` :
- supprimer la constante locale `formatDate` et l'import de `toISODate` ;
- importer depuis `./indicateurNonAJour` ;
- dans `execute`, remplacer la construction de `scopeWhere` et de `nonAJourWhere` par le code ci-dessous.

```ts
import {
  formatDate,
  NON_A_JOUR_WHERE,
  perimetreIndicateursPubliesWhere,
} from "./indicateurNonAJour";

// dans execute :
    const perimetre = perimetreIndicateursPubliesWhere({
      chantierIds: params.chantierIds,
      territoireCodes: params.territoireCodes,
      indicateurIds: params.indicateurIds,
    });
    const scopeWhere: Prisma.indicateur_territoireWhereInput = {
      ...perimetre,
      est_applicable: true,
    };
    const nonAJourWhere: Prisma.indicateur_territoireWhereInput = {
      AND: [perimetre, NON_A_JOUR_WHERE],
    };
```

Le reste de la classe ne change pas : `applicableCounts` porte toujours sur `scopeWhere`, et `getMaillesEnRetard*` sur `nonAJourWhere`.

- [ ] **Étape 3 : vérifier la non-régression**

Commande : `pnpm vitest run --project server-integration src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursNonAJourQuery.integration.test.ts`

Résultat attendu : tous les tests existants passent, sans modification. Si la base n'est pas à jour, utiliser `migrate deploy` (voir la mémoire « Base de test locale »).

- [ ] **Étape 4 : commit (après accord de l'utilisateur)**

```bash
git add src/server/chantiers/infrastructure/queries/indicateurNonAJour.ts src/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery.ts
git commit -m "refactor(ppg): partager la définition des indicateurs non à jour"
```

---

### Tâche 2 : `GetTerritoiresNonAJourQuery`

**Fichiers :**
- Créer : `src/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery.ts`
- Créer : `src/server/chantiers/__tests__/infrastructure/queries/GetTerritoiresNonAJourQuery.integration.test.ts`
- Modifier : `src/server/chantiers/module.ts`
  - import vers la ligne 74 ;
  - type `ChantierOwnCradle` vers la ligne 155, à côté de `getIndicateurPVACountTerritoiresQuery` ;
  - `register` vers la ligne 311.

**Interfaces :**
- Consomme : `perimetreIndicateursPubliesWhere`, `estNonAJour` et `formatDate` (tâche 1).
- Produit :

```ts
export type TerritoireNonAJourChantierViewModel = {
  territoireCode: string;
  estApplicable: boolean;
  nbIndicateursNonAJour: number;
};

export type TerritoireNonAJourIndicateurViewModel = {
  territoireCode: string;
  estApplicable: boolean;
  estAJour: boolean;
  dateDerniereValeur: string | null;
  miseAJourAttendueDepuis: string | null;
};

class GetTerritoiresNonAJourQuery {
  byChantier(params: { chantierId: string }): Promise<TerritoireNonAJourChantierViewModel[]>;
  byIndicateur(params: { chantierId: string; indicateurId: string }): Promise<TerritoireNonAJourIndicateurViewModel[]>;
}
```

Container : `getContainer("chantiers").resolve("getTerritoiresNonAJourQuery")`.

- [ ] **Étape 1 : écrire les tests d'intégration (ils doivent échouer)**

```ts
// src/server/chantiers/__tests__/infrastructure/queries/GetTerritoiresNonAJourQuery.integration.test.ts
import { createIntegrationTest } from "@/test/createIntegrationTest";
import { fixtures } from "@/test/fixtures";
import { PrismaPilote } from "@/server/framework/persistence/PrismaPilote";
import { GetTerritoiresNonAJourQuery } from "@/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery";
import { GetIndicateursNonAJourQuery } from "@/server/chantiers/infrastructure/queries/GetIndicateursNonAJourQuery";

type TerritoireTest = {
  territoire_code: string;
  code_insee: string;
  maille: "NAT" | "DEPT";
  zone_id: string;
  territoire_nom: string;
};

const FRANCE: TerritoireTest = {
  territoire_code: "NAT-FR",
  code_insee: "FR",
  maille: "NAT",
  zone_id: "FRANCE",
  territoire_nom: "France",
};
const FINISTERE: TerritoireTest = {
  territoire_code: "DEPT-29",
  code_insee: "29",
  maille: "DEPT",
  zone_id: "D29",
  territoire_nom: "Finistère",
};
const ILLE_ET_VILAINE: TerritoireTest = {
  territoire_code: "DEPT-35",
  code_insee: "35",
  maille: "DEPT",
  zone_id: "D35",
  territoire_nom: "Ille-et-Vilaine",
};
const COTES_D_ARMOR: TerritoireTest = {
  territoire_code: "DEPT-22",
  code_insee: "22",
  maille: "DEPT",
  zone_id: "D22",
  territoire_nom: "Côtes-d'Armor",
};

async function seedChantier(
  chantierId: string,
  territoires: TerritoireTest[],
  statut: "PUBLIE" | "BROUILLON" = "PUBLIE",
) {
  await fixtures.chantierIdentite({ id: chantierId, statut });
  for (const territoire of territoires) {
    await fixtures.chantierTerritoire({
      id: chantierId,
      territoire_code: territoire.territoire_code,
      code_insee: territoire.code_insee,
      maille: territoire.maille,
      zone_id: territoire.zone_id,
    });
  }
}

const sortByTerritoireCode = <T extends { territoireCode: string }>(
  territoires: T[],
) =>
  territoires.toSorted((left, right) =>
    left.territoireCode.localeCompare(right.territoireCode),
  );

describe("GetTerritoiresNonAJourQuery", () => {
  const query = new GetTerritoiresNonAJourQuery({
    prisma: new PrismaPilote(),
  });

  describe("byChantier", () => {
    it(
      "compte les indicateurs non à jour par territoire",
      createIntegrationTest(async () => {
        // given
        await seedChantier("CH-001", [FRANCE, FINISTERE, ILLE_ET_VILAINE]);
        await fixtures.indicateurIdentite({ id: "IND-001", chantier_id: "CH-001" });
        await fixtures.indicateurIdentite({ id: "IND-002", chantier_id: "CH-001" });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...FINISTERE, est_applicable: true, est_a_jour: false });
        // est_a_jour NULL : aucune valeur remontée, compté non à jour
        await fixtures.indicateurTerritoire({ id: "IND-002", chantier_id: "CH-001", ...FINISTERE, est_applicable: true, est_a_jour: null });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...ILLE_ET_VILAINE, est_applicable: true, est_a_jour: true });
        await fixtures.indicateurTerritoire({ id: "IND-002", chantier_id: "CH-001", ...ILLE_ET_VILAINE, est_applicable: true, est_a_jour: false });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...FRANCE, est_applicable: true, est_a_jour: true });
        await fixtures.indicateurTerritoire({ id: "IND-002", chantier_id: "CH-001", ...FRANCE, est_applicable: true, est_a_jour: true });

        // when
        const result = await query.byChantier({ chantierId: "CH-001" });

        // then
        expect(sortByTerritoireCode(result)).toEqual([
          { territoireCode: "DEPT-29", estApplicable: true, nbIndicateursNonAJour: 2 },
          { territoireCode: "DEPT-35", estApplicable: true, nbIndicateursNonAJour: 1 },
          { territoireCode: "NAT-FR", estApplicable: true, nbIndicateursNonAJour: 0 },
        ]);
      }),
    );

    it(
      "marque non applicable un territoire sans indicateur applicable, même si est_a_jour est faux",
      createIntegrationTest(async () => {
        // given
        await seedChantier("CH-001", [FINISTERE]);
        await fixtures.indicateurIdentite({ id: "IND-001", chantier_id: "CH-001" });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...FINISTERE, est_applicable: false, est_a_jour: false });

        // when
        const result = await query.byChantier({ chantierId: "CH-001" });

        // then
        expect(result).toEqual([
          { territoireCode: "DEPT-29", estApplicable: false, nbIndicateursNonAJour: 0 },
        ]);
      }),
    );

    it(
      "ignore les indicateurs non publiés et les autres chantiers",
      createIntegrationTest(async () => {
        // given
        await seedChantier("CH-001", [FINISTERE]);
        await seedChantier("CH-002", [FINISTERE]);
        await fixtures.indicateurIdentite({ id: "IND-001", chantier_id: "CH-001" });
        await fixtures.indicateurIdentite({ id: "IND-BROUILLON", chantier_id: "CH-001", statut: "BROUILLON" });
        await fixtures.indicateurIdentite({ id: "IND-AUTRE", chantier_id: "CH-002" });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...FINISTERE, est_applicable: true, est_a_jour: true });
        await fixtures.indicateurTerritoire({ id: "IND-BROUILLON", chantier_id: "CH-001", ...FINISTERE, est_applicable: true, est_a_jour: false });
        await fixtures.indicateurTerritoire({ id: "IND-AUTRE", chantier_id: "CH-002", ...FINISTERE, est_applicable: true, est_a_jour: false });

        // when
        const result = await query.byChantier({ chantierId: "CH-001" });

        // then
        expect(result).toEqual([
          { territoireCode: "DEPT-29", estApplicable: true, nbIndicateursNonAJour: 0 },
        ]);
      }),
    );

    it(
      "ne renvoie rien pour un chantier non publié",
      createIntegrationTest(async () => {
        // given
        await seedChantier("CH-001", [FINISTERE], "BROUILLON");
        await fixtures.indicateurIdentite({ id: "IND-001", chantier_id: "CH-001" });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...FINISTERE, est_applicable: true, est_a_jour: false });

        // when
        const result = await query.byChantier({ chantierId: "CH-001" });

        // then
        expect(result).toEqual([]);
      }),
    );
  });

  describe("byIndicateur", () => {
    it(
      "renvoie l'état et les dates de chaque territoire",
      createIntegrationTest(async () => {
        // given
        await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE, COTES_D_ARMOR, FRANCE]);
        await fixtures.indicateurIdentite({ id: "IND-001", chantier_id: "CH-001" });
        await fixtures.indicateurTerritoire({
          id: "IND-001", chantier_id: "CH-001", ...FINISTERE,
          est_applicable: true, est_a_jour: false,
          date_valeur_actuelle_mandat: new Date("2026-01-01"),
          prochaine_date_maj: new Date("2026-05-31"),
        });
        await fixtures.indicateurTerritoire({
          id: "IND-001", chantier_id: "CH-001", ...ILLE_ET_VILAINE,
          est_applicable: true, est_a_jour: true,
          date_valeur_actuelle_mandat: new Date("2026-07-01"),
          prochaine_date_maj: new Date("2026-11-30"),
        });
        // aucune valeur remontée
        await fixtures.indicateurTerritoire({
          id: "IND-001", chantier_id: "CH-001", ...COTES_D_ARMOR,
          est_applicable: true, est_a_jour: null,
        });
        // applicabilité inconnue : traitée comme non applicable
        await fixtures.indicateurTerritoire({
          id: "IND-001", chantier_id: "CH-001", ...FRANCE,
          est_applicable: null, est_a_jour: false,
        });

        // when
        const result = await query.byIndicateur({ chantierId: "CH-001", indicateurId: "IND-001" });

        // then
        expect(sortByTerritoireCode(result)).toEqual([
          { territoireCode: "DEPT-22", estApplicable: true, estAJour: false, dateDerniereValeur: null, miseAJourAttendueDepuis: null },
          { territoireCode: "DEPT-29", estApplicable: true, estAJour: false, dateDerniereValeur: "2026-01-01", miseAJourAttendueDepuis: "2026-05-31" },
          { territoireCode: "DEPT-35", estApplicable: true, estAJour: true, dateDerniereValeur: "2026-07-01", miseAJourAttendueDepuis: "2026-11-30" },
          { territoireCode: "NAT-FR", estApplicable: false, estAJour: false, dateDerniereValeur: null, miseAJourAttendueDepuis: null },
        ]);
      }),
    );

    it(
      "liste les mêmes territoires non à jour que la requête de l'assistant",
      createIntegrationTest(async () => {
        // given
        await seedChantier("CH-001", [FINISTERE, ILLE_ET_VILAINE, COTES_D_ARMOR]);
        await fixtures.indicateurIdentite({ id: "IND-001", chantier_id: "CH-001" });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...FINISTERE, est_applicable: true, est_a_jour: false });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...ILLE_ET_VILAINE, est_applicable: true, est_a_jour: true });
        await fixtures.indicateurTerritoire({ id: "IND-001", chantier_id: "CH-001", ...COTES_D_ARMOR, est_applicable: true, est_a_jour: null });
        const assistantQuery = new GetIndicateursNonAJourQuery({ prisma: new PrismaPilote() });

        // when
        const mapTerritoires = await query.byIndicateur({ chantierId: "CH-001", indicateurId: "IND-001" });
        const assistantResponse = await assistantQuery.execute({
          chantierIds: ["CH-001"],
          territoireCodes: ["DEPT-29", "DEPT-35", "DEPT-22"],
          indicateurIds: ["IND-001"],
          avecDetailTerritoires: true,
        });

        // then
        const mapCodes = mapTerritoires
          .filter((territoire) => territoire.estApplicable && !territoire.estAJour)
          .map((territoire) => territoire.territoireCode)
          .toSorted();
        const assistantCodes = assistantResponse
          .flatMap((chantier) => chantier.indicateurs)
          .flatMap((indicateur) => indicateur.mailles)
          .flatMap((maille) => maille.territoiresEnRetard ?? [])
          .map((territoire) => territoire.code)
          .toSorted();
        expect(mapCodes).toEqual(["DEPT-22", "DEPT-29"]);
        expect(mapCodes).toEqual(assistantCodes);
      }),
    );
  });
});
```

Lancer ensuite `pnpm format` sur le fichier, pour que Prettier reformate les appels de fixtures écrits sur une ligne.

- [ ] **Étape 2 : lancer les tests et vérifier qu'ils échouent**

Commande : `pnpm vitest run --project server-integration src/server/chantiers/__tests__/infrastructure/queries/GetTerritoiresNonAJourQuery.integration.test.ts`

Résultat attendu : FAIL, module `GetTerritoiresNonAJourQuery` introuvable.

- [ ] **Étape 3 : implémenter la requête**

```ts
// src/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery.ts
import type { $Enums } from "@prisma/client";
import type { Inject } from "@/server/chantiers/module";
import {
  estNonAJour,
  formatDate,
  perimetreIndicateursPubliesWhere,
} from "./indicateurNonAJour";

export type TerritoireNonAJourChantierViewModel = {
  territoireCode: string;
  estApplicable: boolean;
  nbIndicateursNonAJour: number;
};

export type TerritoireNonAJourIndicateurViewModel = {
  territoireCode: string;
  estApplicable: boolean;
  estAJour: boolean;
  dateDerniereValeur: string | null;
  miseAJourAttendueDepuis: string | null;
};

const MAP_MAILLES: $Enums.Maille[] = ["NAT", "REG", "DEPT"];

export class GetTerritoiresNonAJourQuery {
  constructor(private readonly deps: Inject<"prisma">) {}

  async byChantier(params: {
    chantierId: string;
  }): Promise<TerritoireNonAJourChantierViewModel[]> {
    const rows = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: perimetreIndicateursPubliesWhere({
          chantierIds: [params.chantierId],
          mailles: MAP_MAILLES,
        }),
        select: {
          territoire_code: true,
          est_applicable: true,
          est_a_jour: true,
        },
      });

    const territoires = new Map<string, TerritoireNonAJourChantierViewModel>();
    for (const row of rows) {
      const territoire = territoires.get(row.territoire_code) ?? {
        territoireCode: row.territoire_code,
        estApplicable: false,
        nbIndicateursNonAJour: 0,
      };
      territoires.set(row.territoire_code, territoire);

      if (row.est_applicable === true) territoire.estApplicable = true;
      if (estNonAJour(row)) territoire.nbIndicateursNonAJour += 1;
    }

    return [...territoires.values()];
  }

  async byIndicateur(params: {
    chantierId: string;
    indicateurId: string;
  }): Promise<TerritoireNonAJourIndicateurViewModel[]> {
    const rows = await this.deps.prisma
      .getInstance()
      .indicateur_territoire.findMany({
        where: perimetreIndicateursPubliesWhere({
          chantierIds: [params.chantierId],
          indicateurIds: [params.indicateurId],
          mailles: MAP_MAILLES,
        }),
        select: {
          territoire_code: true,
          est_applicable: true,
          est_a_jour: true,
          date_valeur_actuelle_mandat: true,
          prochaine_date_maj: true,
        },
      });

    return rows.map((row) => ({
      territoireCode: row.territoire_code,
      estApplicable: row.est_applicable === true,
      estAJour: row.est_applicable === true && !estNonAJour(row),
      dateDerniereValeur: formatDate(row.date_valeur_actuelle_mandat),
      miseAJourAttendueDepuis: formatDate(row.prochaine_date_maj),
    }));
  }
}
```

- [ ] **Étape 4 : enregistrer la requête dans `src/server/chantiers/module.ts`**

```ts
// imports, à côté de GetIndicateursNonAJourQuery
import { GetTerritoiresNonAJourQuery } from "./infrastructure/queries/GetTerritoiresNonAJourQuery";

// type ChantierOwnCradle, après getIndicateurPVACountTerritoiresQuery
  getTerritoiresNonAJourQuery: GetTerritoiresNonAJourQuery;

// register, après getIndicateurPVACountTerritoiresQuery
      getTerritoiresNonAJourQuery: asModuleClass(GetTerritoiresNonAJourQuery),
```

- [ ] **Étape 5 : lancer les tests et vérifier qu'ils passent**

Commande : `pnpm vitest run --project server-integration src/server/chantiers/__tests__/infrastructure/queries/GetTerritoiresNonAJourQuery.integration.test.ts src/server/chantiers/__tests__/infrastructure/queries/GetIndicateursNonAJourQuery.integration.test.ts`

Résultat attendu : PASS.

- [ ] **Étape 6 : commit (après accord de l'utilisateur)**

```bash
git add src/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery.ts src/server/chantiers/__tests__/infrastructure/queries/GetTerritoiresNonAJourQuery.integration.test.ts src/server/chantiers/module.ts
git commit -m "feat(ppg): requête des territoires non à jour pour la cartographie"
```

---

### Tâche 3 : routes tRPC

**Fichiers :**
- Modifier : `src/server/chantiers/infrastructure/trpc/chantier.ts`, après `recupererPVAChantierTerritoires` (vers la ligne 53)
- Modifier : `src/server/chantiers/infrastructure/trpc/indicateur.ts`, après `recupererPVATerritoires` (vers la ligne 139)

**Interfaces :**
- Consomme : `getTerritoiresNonAJourQuery.byChantier` et `getTerritoiresNonAJourQuery.byIndicateur` (tâche 2).
- Produit :
  - `api.chantier.getTerritoiresNonAJour.useSuspenseQuery({ chantierId })` → `TerritoireNonAJourChantierViewModel[]`
  - `api.indicateur.getTerritoiresNonAJour.useSuspenseQuery({ chantierId, indicateurId })` → `TerritoireNonAJourIndicateurViewModel[]`

- [ ] **Étape 1 : ajouter la route chantier**

```ts
  getTerritoiresNonAJour: protectedProcedure
    .input(z.object({ chantierId: z.string() }))
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(input.chantierId, null);
      return getContainer("chantiers")
        .resolve("getTerritoiresNonAJourQuery")
        .byChantier(input);
    }),
```

- [ ] **Étape 2 : ajouter la route indicateur**

Ajouter `import { Habilitation } from "@/shared/utilisateur/habilitation/Habilitation";` en tête de `indicateur.ts`, puis :

```ts
  getTerritoiresNonAJour: protectedProcedure
    .input(z.object({ chantierId: z.string(), indicateurId: z.string() }))
    .query(({ input, ctx }) => {
      new Habilitation(
        ctx.session.habilitations,
      ).vérifierLesHabilitationsEnLecture(input.chantierId, null);
      return getContainer("chantiers")
        .resolve("getTerritoiresNonAJourQuery")
        .byIndicateur(input);
    }),
```

- [ ] **Étape 3 : vérifier les types**

Commande : `pnpm exec tsc --noEmit -p .`

Résultat attendu : aucune erreur.

- [ ] **Étape 4 : commit (après accord de l'utilisateur)**

```bash
git add src/server/chantiers/infrastructure/trpc/chantier.ts src/server/chantiers/infrastructure/trpc/indicateur.ts
git commit -m "feat(ppg): routes tRPC des territoires non à jour"
```

---

### Tâche 4 : widget `WidgetCartographieIndicateursNonAJour`

Pas de test client, comme pour les autres cartes. La vérification se fait par `tsc`, le lint, puis à la main dans la tâche 5.

**Fichiers :**
- Créer : `src/client/constants/légendes/legendItemsIndicateursNonAJour.ts`
- Créer : `src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/nonAJourDisplay.ts`
- Créer : `src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/useNonAJourMapData.tsx`
- Créer : `src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/TerritoiresNonAJourTable.tsx`
- Créer : `src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/WidgetCartographieIndicateursNonAJour.tsx`

**Interfaces :**
- Consomme : les routes tRPC (tâche 3) et les types de view model (tâche 2).
- Produit : `WidgetCartographieIndicateursNonAJour(props: { maille: MailleInterne; territoireCode: string } & ({ mode: "chantier"; chantierId: string } | { mode: "indicateur"; chantierId: string; indicateurId: string }))`

- [ ] **Étape 1 : éléments de légende**

```ts
// src/client/constants/légendes/legendItemsIndicateursNonAJour.ts
import { CartographieÉlémentsDeLégende } from "@/components/_commons/Cartographie/Légende/CartographieLégende.interface";
import { REMPLISSAGE_HACHURE } from "@/client/constants/légendes/hachure/hachure";

export const LEGEND_ITEMS_NON_A_JOUR_CHANTIER: CartographieÉlémentsDeLégende = {
  NON_A_JOUR: {
    libellé: "Un ou plusieurs indicateurs ne sont pas à jour",
    remplissage: "#B34000",
  },
  A_JOUR: {
    libellé: "Tous les indicateurs sont à jour",
    remplissage: "#bababa",
  },
  NON_APPLICABLE: {
    libellé: "Territoire où le chantier prioritaire ne s'applique pas",
    remplissage: REMPLISSAGE_HACHURE,
  },
};

export const LEGEND_ITEMS_NON_A_JOUR_INDICATEUR: CartographieÉlémentsDeLégende = {
  NON_A_JOUR: {
    libellé: "L'indicateur n'est pas à jour",
    remplissage: "#B34000",
  },
  A_JOUR: {
    libellé: "L'indicateur est à jour",
    remplissage: "#bababa",
  },
  NON_APPLICABLE: {
    libellé: "Territoire où l'indicateur ne s'applique pas",
    remplissage: REMPLISSAGE_HACHURE,
  },
};
```

- [ ] **Étape 2 : `nonAJourDisplay.ts` (couleurs, légende et textes)**

```ts
import {
  LEGEND_ITEMS_NON_A_JOUR_CHANTIER,
  LEGEND_ITEMS_NON_A_JOUR_INDICATEUR,
} from "@/client/constants/légendes/legendItemsIndicateursNonAJour";
import { formaterDate } from "@/client/utils/date/date";
import type {
  TerritoireNonAJourChantierViewModel,
  TerritoireNonAJourIndicateurViewModel,
} from "@/server/chantiers/infrastructure/queries/GetTerritoiresNonAJourQuery";

export type NonAJourMode = "chantier" | "indicateur";

export type TerritoireNonAJour =
  | TerritoireNonAJourChantierViewModel
  | TerritoireNonAJourIndicateurViewModel;

export const isChantierMode = (
  territoire: TerritoireNonAJour,
): territoire is TerritoireNonAJourChantierViewModel =>
  "nbIndicateursNonAJour" in territoire;

const getLegendItems = (mode: NonAJourMode) =>
  mode === "indicateur"
    ? LEGEND_ITEMS_NON_A_JOUR_INDICATEUR
    : LEGEND_ITEMS_NON_A_JOUR_CHANTIER;

export const isTerritoireNonAJour = (territoire: TerritoireNonAJour) => {
  if (!territoire.estApplicable) return false;
  return isChantierMode(territoire)
    ? territoire.nbIndicateursNonAJour > 0
    : !territoire.estAJour;
};

export const getFill = (territoire: TerritoireNonAJour, mode: NonAJourMode) => {
  const legendItems = getLegendItems(mode);
  if (!territoire.estApplicable) return legendItems.NON_APPLICABLE.remplissage;
  return isTerritoireNonAJour(territoire)
    ? legendItems.NON_A_JOUR.remplissage
    : legendItems.A_JOUR.remplissage;
};

export const buildLegend = (
  territoires: TerritoireNonAJour[],
  mode: NonAJourMode,
) => {
  const allApplicable = territoires.every(
    (territoire) => territoire.estApplicable,
  );
  return Object.entries(getLegendItems(mode))
    .filter(([key]) => !(allApplicable && key === "NON_APPLICABLE"))
    .map(([, { remplissage, libellé }]) => ({ libellé, remplissage }));
};

export const formatNbIndicateursNonAJour = (
  territoire: TerritoireNonAJourChantierViewModel,
): string => {
  if (!territoire.estApplicable) return "Non applicable";
  if (territoire.nbIndicateursNonAJour === 0) return "À jour";
  return `${territoire.nbIndicateursNonAJour} ${
    territoire.nbIndicateursNonAJour > 1 ? "indicateurs" : "indicateur"
  } non à jour`;
};

export const formatEtatIndicateur = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string => {
  if (!territoire.estApplicable) return "Non applicable";
  return territoire.estAJour ? "À jour" : "Non à jour";
};

export const formatDateDerniereValeur = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string =>
  formaterDate(territoire.dateDerniereValeur, "DD/MM/YYYY") ?? "Aucune valeur";

export const formatMiseAJourAttendueDepuis = (
  territoire: TerritoireNonAJourIndicateurViewModel,
): string =>
  formaterDate(territoire.miseAJourAttendueDepuis, "DD/MM/YYYY") ?? "-";
```

- [ ] **Étape 3 : `useNonAJourMapData.tsx`**

```tsx
import { useMemo } from "react";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { CartographieV2Donnee } from "@/components/_commons/CartographieV2/types";
import {
  formatDateDerniereValeur,
  formatEtatIndicateur,
  formatMiseAJourAttendueDepuis,
  formatNbIndicateursNonAJour,
  getFill,
  isChantierMode,
  NonAJourMode,
  TerritoireNonAJour,
} from "./nonAJourDisplay";

const TooltipContent = ({ territoire }: { territoire: TerritoireNonAJour }) => {
  if (isChantierMode(territoire)) {
    return (
      <div className="fr-text--bold">
        {formatNbIndicateursNonAJour(territoire)}
      </div>
    );
  }
  if (!territoire.estApplicable || territoire.estAJour) {
    return (
      <div className="fr-text--bold">{formatEtatIndicateur(territoire)}</div>
    );
  }
  return (
    <div>
      <div className="fr-text--bold">{formatEtatIndicateur(territoire)}</div>
      <div>Dernière valeur : {formatDateDerniereValeur(territoire)}</div>
      <div>
        Mise à jour attendue depuis : {formatMiseAJourAttendueDepuis(territoire)}
      </div>
    </div>
  );
};

export const useNonAJourMapData = (
  territoires: TerritoireNonAJour[],
  mode: NonAJourMode,
) =>
  useMemo(
    () =>
      Object.fromEntries(
        territoires.map((territoire) => [
          territoire.territoireCode,
          {
            remplissage: getFill(territoire, mode),
            libelle: getLabelTerritoire(territoire.territoireCode),
            contenuInfoBulle: <TooltipContent territoire={territoire} />,
          } satisfies CartographieV2Donnee,
        ]),
      ),
    [territoires, mode],
  );
```

- [ ] **Étape 4 : `TerritoiresNonAJourTable.tsx`**

Ce composant reprend la structure de `WidgetCartographiePVA/NombrePropositionsValeur.tsx` : une grille, un `TerritoireLabel` par ligne, et la suppression possible des territoires autres que le territoire initial. Il compte deux colonnes en mode chantier et trois en mode indicateur. Les territoires non à jour s'affichent en premier ; en mode chantier, ils sont triés par nombre d'indicateurs non à jour décroissant.

```tsx
import { Fragment, useMemo } from "react";
import { getCouleurTerritoireParCode } from "@/client/utils/couleur/paletteTerritoires";
import { getLabelTerritoire } from "@/client/constants/territoires";
import { useMesureWidget } from "@/components/_commons/Widget/TuileWidget/useMesureWidget";
import { TerritoireLabel } from "@/components/_commons/Widget/TerritoireLabel";
import { clsxm } from "@/utils/clsxm";
import {
  formatDateDerniereValeur,
  formatMiseAJourAttendueDepuis,
  formatNbIndicateursNonAJour,
  isChantierMode,
  isTerritoireNonAJour,
  NonAJourMode,
  TerritoireNonAJour,
} from "./nonAJourDisplay";

const getNbIndicateursNonAJour = (territoire: TerritoireNonAJour) =>
  isChantierMode(territoire) ? territoire.nbIndicateursNonAJour : 0;

const Cells = ({ territoire }: { territoire: TerritoireNonAJour }) => {
  if (isChantierMode(territoire)) {
    return (
      <div className="py-2 flex items-center justify-center border-b">
        {formatNbIndicateursNonAJour(territoire)}
      </div>
    );
  }
  if (!territoire.estApplicable) {
    return (
      <div className="col-span-2 py-2 flex items-center justify-center border-b">
        Non applicable
      </div>
    );
  }
  return (
    <>
      <div className="py-2 flex items-center justify-center border-b">
        {formatDateDerniereValeur(territoire)}
      </div>
      <div
        className={clsxm("py-2 flex items-center justify-center border-b", {
          "text-dsfr-warning-425 font-bold": !territoire.estAJour,
        })}
      >
        {territoire.estAJour
          ? "À jour"
          : formatMiseAJourAttendueDepuis(territoire)}
      </div>
    </>
  );
};

export const TerritoiresNonAJourTable = ({
  mode,
  territoiresSelectionnes,
  onSupprimerTerritoire,
  territoireCode,
}: {
  mode: NonAJourMode;
  territoiresSelectionnes: TerritoireNonAJour[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  territoireCode: string;
}) => {
  const { isModeP } = useMesureWidget();

  const sortedTerritoires = useMemo(
    () =>
      territoiresSelectionnes.toSorted(
        (left, right) =>
          Number(isTerritoireNonAJour(right)) -
            Number(isTerritoireNonAJour(left)) ||
          getNbIndicateursNonAJour(right) - getNbIndicateursNonAJour(left),
      ),
    [territoiresSelectionnes],
  );

  const headers =
    mode === "chantier"
      ? ["Indicateurs non à jour"]
      : ["Dernière valeur", "Mise à jour attendue depuis"];

  return (
    <div
      className={clsxm("grid border-y text-xs", {
        "grid-cols-2": mode === "chantier",
        "grid-cols-3": mode === "indicateur",
      })}
    >
      <div className="grid col-span-full grid-cols-subgrid border-b border-b-black">
        <div />
        {headers.map((header) => (
          <div
            key={header}
            className="text-center text-sm py-1 text-dsfr-mention-grey"
          >
            {header}
          </div>
        ))}
      </div>

      {sortedTerritoires.map((territoire) => {
        const isInitial = territoire.territoireCode === territoireCode;
        return (
          <Fragment key={territoire.territoireCode}>
            <div
              className={clsxm("border-b", { "flex justify-center": !isModeP })}
            >
              <div
                className={clsxm("py-2", {
                  "w-full max-w-[300px] mr-auto": !isModeP,
                })}
              >
                <TerritoireLabel
                  nom={getLabelTerritoire(territoire.territoireCode)}
                  couleur={getCouleurTerritoireParCode(
                    territoire.territoireCode,
                  )}
                  onSupprimer={
                    !isInitial
                      ? () => onSupprimerTerritoire(territoire.territoireCode)
                      : undefined
                  }
                />
              </div>
            </div>
            <Cells territoire={territoire} />
          </Fragment>
        );
      })}
    </div>
  );
};
```

- [ ] **Étape 5 : `WidgetCartographieIndicateursNonAJour.tsx`**

```tsx
import { createContext, ReactNode, useContext, useMemo } from "react";
import { MailleInterne } from "@/shared/maille/Maille.interface";
import { CartographieV2 } from "@/components/_commons/CartographieV2/CartographieV2";
import { LegendeCartographie } from "@/components/_commons/CartographieV2/LegendeCartographie";
import {
  BaseCartographieWidgetLayout,
  TitreWidget,
} from "@/components/_commons/Widget/BaseCartographieWidgetLayout";
import { api } from "@/server/framework/trpc/api";
import { AjouterTerritoirePicker } from "@/components/_commons/Widget/AjouterTerritoirePicker";
import { useSelectionTerritoires } from "@/components/_commons/Widget/WidgetCartographieMeteo/useSelectionTerritoires";
import { ComplementsCartographie } from "@/components/_commons/Widget/ComplementsCartographie";
import { WidgetCartographieTitle } from "@/components/_commons/Widget/WidgetCartographieTitle";
import {
  buildLegend,
  NonAJourMode,
  TerritoireNonAJour,
} from "./nonAJourDisplay";
import { useNonAJourMapData } from "./useNonAJourMapData";
import { TerritoiresNonAJourTable } from "./TerritoiresNonAJourTable";

// --- Context ---

const NonAJourMapContext = createContext<{
  territoires: TerritoireNonAJour[];
  mode: NonAJourMode;
} | null>(null);

const useNonAJourMapContext = () => {
  const ctx = useContext(NonAJourMapContext);
  if (!ctx) {
    throw new Error(
      "useNonAJourMapContext must be used within a WidgetCartographieIndicateursNonAJour provider",
    );
  }
  return ctx;
};

// --- Providers ---

const ChantierProvider = ({
  chantierId,
  children,
}: {
  chantierId: string;
  children: ReactNode;
}) => {
  const [territoires] = api.chantier.getTerritoiresNonAJour.useSuspenseQuery({
    chantierId,
  });

  return (
    <NonAJourMapContext.Provider value={{ territoires, mode: "chantier" }}>
      {children}
    </NonAJourMapContext.Provider>
  );
};

const IndicateurProvider = ({
  indicateurId,
  chantierId,
  children,
}: {
  indicateurId: string;
  chantierId: string;
  children: ReactNode;
}) => {
  const [territoires] = api.indicateur.getTerritoiresNonAJour.useSuspenseQuery(
    { indicateurId, chantierId },
  );

  return (
    <NonAJourMapContext.Provider value={{ territoires, mode: "indicateur" }}>
      {children}
    </NonAJourMapContext.Provider>
  );
};

// --- Content ---

const NonAJourMapContent = ({
  maille,
  territoireCode,
}: {
  maille: MailleInterne;
  territoireCode: string;
}) => {
  const { territoires, mode } = useNonAJourMapContext();

  const mapData = useNonAJourMapData(territoires, mode);
  const legend = useMemo(
    () => buildLegend(territoires, mode),
    [territoires, mode],
  );
  const {
    territoiresSelectionnes,
    onSelectTerritoire,
    ajouterTerritoire,
    ajouterTerritoires,
    supprimerTerritoire,
  } = useSelectionTerritoires({ territoires, territoireCode });

  const selectedTerritoireCodes = territoiresSelectionnes.map(
    (territoire) => territoire.territoireCode,
  );

  return (
    <BaseCartographieWidgetLayout
      titre={
        <WidgetCartographieTitle
          title={
            mode === "chantier"
              ? "Indicateurs non à jour"
              : "Mise à jour de l'indicateur"
          }
        />
      }
      cartographie={
        <CartographieV2
          onTerritoireSelect={onSelectTerritoire}
          donnees={mapData}
          maille={maille}
          territoiresSelectionnes={selectedTerritoireCodes}
        />
      }
      complementsCartographie={
        <ComplementsCartographie>
          <LegendeCartographie items={legend} />
        </ComplementsCartographie>
      }
      footer={
        <AjouterTerritoirePicker
          territoiresSelectionnesCodes={selectedTerritoireCodes}
          onAjouterTerritoire={ajouterTerritoire}
          onAjouterTerritoires={ajouterTerritoires}
        />
      }
    >
      <TitreWidget>
        {mode === "chantier"
          ? "Nombre d'indicateurs non à jour"
          : "Date de mise à jour par territoire"}
      </TitreWidget>
      <TerritoiresNonAJourTable
        mode={mode}
        territoireCode={territoireCode}
        onSupprimerTerritoire={supprimerTerritoire}
        territoiresSelectionnes={territoiresSelectionnes}
      />
    </BaseCartographieWidgetLayout>
  );
};

// --- Public API ---

type WidgetCartographieIndicateursNonAJourProps = {
  maille: MailleInterne;
  territoireCode: string;
} & (
  | { mode: "chantier"; chantierId: string }
  | { mode: "indicateur"; indicateurId: string; chantierId: string }
);

export const WidgetCartographieIndicateursNonAJour = (
  props: WidgetCartographieIndicateursNonAJourProps,
) => {
  const content = (
    <NonAJourMapContent
      maille={props.maille}
      territoireCode={props.territoireCode}
    />
  );

  if (props.mode === "indicateur") {
    return (
      <IndicateurProvider
        indicateurId={props.indicateurId}
        chantierId={props.chantierId}
      >
        {content}
      </IndicateurProvider>
    );
  }

  return (
    <ChantierProvider chantierId={props.chantierId}>{content}</ChantierProvider>
  );
};
```

- [ ] **Étape 6 : vérifier les types et le lint**

Commandes : `pnpm exec tsc --noEmit -p .`, puis `pnpm lint`.

Résultat attendu : aucune erreur. Si Prettier signale des écarts, lancer `pnpm format`.

- [ ] **Étape 7 : commit (après accord de l'utilisateur)**

```bash
git add src/client/constants/légendes/legendItemsIndicateursNonAJour.ts src/client/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/
git commit -m "feat(ppg): widget de cartographie des indicateurs non à jour"
```

---

### Tâche 5 : intégration dans la page chantier

**Fichiers :**
- Modifier : `src/client/components/PageChantier/ComparaisonTerritoires/ComparaisonTerritoires.tsx`
- Modifier : `src/client/components/_commons/IndicateursChantier/Bloc/Détails/ComparaisonTerritoires/ComparaisonTerritoiresIndicateur.tsx`

**Interfaces :**
- Consomme : `WidgetCartographieIndicateursNonAJour` (tâche 4).

- [ ] **Étape 1 : sélecteur chantier**

Dans `PageChantier/ComparaisonTerritoires/ComparaisonTerritoires.tsx` :

```tsx
import { WidgetCartographieIndicateursNonAJour } from "@/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/WidgetCartographieIndicateursNonAJour";

type TypeCarteChantier = "ta" | "meteo" | "pva" | "nonAJour";

// dans options, après "pva" :
  { value: "nonAJour", label: "Carte des indicateurs non à jour" },

// dans renderCarte, avant `return null;` :
      if (type === "nonAJour") {
        return (
          <WidgetCartographieIndicateursNonAJour
            mode="chantier"
            chantierId={chantierId}
            maille={maille}
            territoireCode={territoireCode}
          />
        );
      }
```

`renderBoutonExportCsv` ne change pas : il renvoie déjà `null` pour `"nonAJour"`.

- [ ] **Étape 2 : sélecteur indicateur**

Dans `ComparaisonTerritoiresIndicateur.tsx` :

```tsx
import { WidgetCartographieIndicateursNonAJour } from "@/components/_commons/Widget/WidgetCartographieIndicateursNonAJour/WidgetCartographieIndicateursNonAJour";

type TypeCarteIndicateur = "ta" | "va" | "pva" | "nonAJour";

// dans options, après "pva" :
  { value: "nonAJour", label: "Carte de mise à jour de l'indicateur" },

// dans renderCarte, avant `return null;` :
      if (type === "nonAJour") {
        return (
          <WidgetCartographieIndicateursNonAJour
            mode="indicateur"
            indicateurId={indicateurId}
            chantierId={chantierId}
            maille={maille}
            territoireCode={territoireCode}
          />
        );
      }
```

- [ ] **Étape 3 : vérification complète**

Commandes :
- `pnpm exec tsc --noEmit -p .`
- `pnpm lint`
- `pnpm test:unit`
- `pnpm vitest run --project server-integration src/server/chantiers/__tests__/infrastructure/queries/`

Résultat attendu : tout est vert, à l'exception de l'échec préexistant et connu de `MinistèreSQLRepository` (voir la mémoire « Base de test locale »).

- [ ] **Étape 4 : vérification manuelle dans l'application (skill `run`)**

Sur une page chantier de la démo :
1. Sélectionner « Carte des indicateurs non à jour ». Les territoires en retard s'affichent en `#B34000` et l'infobulle indique « N indicateurs non à jour ».
2. Ajouter un territoire avec le sélecteur. Il apparaît dans le tableau, et les territoires non à jour restent en tête.
3. Ouvrir un indicateur, puis « Carte de mise à jour de l'indicateur ».
   - L'infobulle d'un territoire en retard affiche les deux dates au format JJ/MM/AAAA, sans décalage d'un jour.
   - Pour un territoire sans valeur, elle affiche « Aucune valeur » et « - ».
   - La légende n'affiche « Non applicable » que si au moins un territoire n'est pas applicable.

- [ ] **Étape 5 : commit (après accord de l'utilisateur), puis proposer de lancer les E2E (`pnpm test:e2e`)**

```bash
git add src/client/components/PageChantier/ComparaisonTerritoires/ComparaisonTerritoires.tsx src/client/components/_commons/IndicateursChantier/Bloc/Détails/ComparaisonTerritoires/ComparaisonTerritoiresIndicateur.tsx
git commit -m "feat(ppg): carte des indicateurs non à jour sur la page chantier"
```
