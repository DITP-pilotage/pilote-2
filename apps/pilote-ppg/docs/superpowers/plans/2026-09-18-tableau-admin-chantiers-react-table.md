# Tableau Admin Chantiers avec react-table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer le tableau de `PageAdminChantiers` vers `@tanstack/react-table` en ajoutant pagination, tri sur les colonnes, filtres (statut, périmètre) et recherche texte pilotée par react-table, avec l'état (filtres/tri/pagination/recherche) synchronisé dans l'URL via `nuqs`.

**Architecture:** Un hook `useTableauAdminChantiers` colocalisé (calqué sur `useTableauEvaluation.tsx` et `useTableauChantiers.tsx`) construit les colonnes react-table et branche chaque morceau d'état (`sorting`, `pagination`, `columnFilters`, `globalFilter`) sur des `useQueryState(s)` nuqs. `PageAdminChantiers.tsx` ne fait plus que rendre ce que `table` expose (`flexRender`), sans logique de filtrage manuelle. Un nouveau composant `FiltresAdminChantiers` affiche les contrôles de filtre (statut en cases à cocher, périmètre en multi-sélection). Côté backend, `ListerChantiersQuery` est étendu pour exposer le périmètre du chantier (`ch_per` → `metadata_perimetres.per_nom`), qui n'était pas exposé jusqu'ici.

**Tech Stack:** Next.js 14, React 18, TypeScript, `@tanstack/react-table` v8 (déjà en dépendance), `nuqs` v2 (déjà en dépendance), Prisma 6, tRPC.

**Spec:** Pas de document de spec séparé — tâche classée « bounded » lors du brainstorming (modification d'un composant existant + extension mineure d'une query). Design validé en conversation, résumé ci-dessous.

### Résumé du design validé

- Colonnes : `chantierId`, `chNom`, `chState` (statut), `perimetreNom` (nouveau), `updatedAt`.
- Filtres de colonnes : statut (cases à cocher, 4 valeurs fixes de `$Enums.type_statut`) et périmètre (multi-sélection, valeurs dérivées des données chargées via `getFacetedUniqueValues`).
- Recherche texte : toujours sur `chantierId` + `chNom`, mais pilotée par le `globalFilter` de react-table au lieu d'un `useState` local.
- Pagination et tri : entièrement côté client (les données sont déjà chargées en une fois par `api.metadataChantier.lister`), pas de `manualPagination`.
- Tout l'état (recherche, filtres, tri, pagination) est synchronisé dans l'URL via `nuqs`, avec `shallow: true` (pas de rechargement serveur nécessaire, tout est déjà en mémoire côté client).
- Pas de tests automatisés ajoutés côté frontend (aucun test n'existe aujourd'hui sur `PageAdminChantiers`, et il n'y a pas de précédent dans le repo pour tester des hooks utilisant `nuqs`) : vérification manuelle en navigateur à chaque tâche. Le backend, lui, a déjà des tests d'intégration établis (`ListerChantiersQuery.integration.test.ts`) : on les étend en TDD classique.

## Global Constraints

- **Ne jamais lancer les commandes de test soi-même** (`pnpm test`, `pnpm test:client`, `pnpm test:server`, `pnpm test:e2e`) — c'est TOUJOURS l'utilisateur qui les exécute (règle du `CLAUDE.md` du projet). À chaque étape qui nécessite de faire tourner des tests, demander à l'utilisateur de lancer la commande indiquée et de partager le résultat, plutôt que de l'exécuter directement. `pnpm lint` n'est pas concerné par cette règle et peut être lancé directement.
- **Objectif pédagogique explicite de l'utilisateur** : à chaque étape de l'implémentation, expliquer en détail ce qui est fait, en particulier le fonctionnement de react-table (row models, `columnHelper`, état contrôlé via `state`/`onXChange`, `meta`, `filterFn`, `globalFilterFn`, `flexRender`, `getFacetedUniqueValues`, etc.). Chaque tâche ci-dessous contient un encart « 🎓 À expliquer » qui liste les concepts à couvrir — ne pas se contenter d'appliquer le code, prendre le temps de le commenter à l'utilisateur.
- Respecter le style visuel DSFR/Tailwind existant : les classes CSS actuelles doivent être préservées à l'identique sur les colonnes déjà existantes (voir le mapping de classes par colonne au Task 2).
- Pas de nom de variable à 1-2 caractères (convention du projet).
- Utiliser `$Enums` de `@prisma/client` pour toute valeur/type d'énumération (déjà fait dans le fichier existant, à conserver).

---

## Task 1: Exposer le périmètre dans `ListerChantiersQuery` (backend)

**Files:**
- Modify: `apps/pilote-ppg/src/server/metadataChantier/queries/ListerChantiersQuery.ts`
- Modify: `apps/pilote-ppg/src/server/metadataChantier/__tests__/queries/ListerChantiersQuery.integration.test.ts`

**Interfaces:**
- Produces: `ChantierListItem` gagne deux champs : `perimetreId: string` et `perimetreNom: string`. Ce type est consommé indirectement par le frontend via `inferRouterOutputs<typeof appRouter>["metadataChantier"]["lister"]` (Task 2).

**Contexte :** `ChantierListItem` ne contient aujourd'hui que `chantierId`, `chNom`, `chState`, `updatedAt`. La table `metadata_chantiers` a un champ `ch_per` (non-nullable) qui référence `metadata_perimetres.perimetre_id`, avec une relation Prisma nommée `perimetre` exposant `per_nom`. On doit joindre cette relation pour afficher/filtrer par périmètre côté admin.

- [ ] **Step 1: Écrire le test qui échoue**

Modifier le test `"présente les champs du contrat correctement"` dans `ListerChantiersQuery.integration.test.ts` pour attendre les nouveaux champs, en créant explicitement un périmètre nommé :

```ts
it(
  "présente les champs du contrat correctement",
  createIntegrationTest(async () => {
    // Given
    const updatedAt = new Date("2026-06-15T10:00:00.000Z");
    const perimetre = await fixtures.metadataPerimetre({
      perimetre_id: "PER-042",
      per_nom: "Périmètre Fonction publique",
    });
    await fixtures.metadataChantier({
      chantier_id: "CH-042",
      ch_nom: "Mon chantier",
      ch_state: "PUBLIE",
      ch_per: perimetre.perimetre_id,
      updated_at: updatedAt,
    });

    // When
    const resultat = await query.run();

    // Then
    expect(resultat).toEqual([
      {
        chantierId: "CH-042",
        chNom: "Mon chantier",
        chState: "PUBLIE",
        perimetreId: "PER-042",
        perimetreNom: "Périmètre Fonction publique",
        updatedAt,
      },
    ]);
  }),
);
```

(Le reste du fichier — `describe`, `beforeEach`, les deux autres `it` — ne change pas. `fixtures` est déjà importé en haut du fichier.)

- [ ] **Step 2: Faire vérifier par l'utilisateur que le test échoue**

Demander à l'utilisateur de lancer :
```bash
pnpm --filter pilote-ppg test:server -- ListerChantiersQuery
```
Résultat attendu : ÉCHEC sur ce test précis, l'objet reçu n'ayant pas `perimetreId`/`perimetreNom` (Jest/Vitest affichera un diff `toEqual`).

- [ ] **Step 3: Implémenter le minimum pour faire passer le test**

Remplacer tout le contenu de `apps/pilote-ppg/src/server/metadataChantier/queries/ListerChantiersQuery.ts` par :

```ts
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import type { Inject } from "@/server/metadataChantier/module";

export interface ChantierListItem {
  chantierId: string;
  chNom: string;
  chState: $Enums.type_statut;
  perimetreId: string;
  perimetreNom: string;
  updatedAt: Date;
}

export class ListerChantiersQuery {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: Inject<"prisma">) {
    this.prisma = prisma;
  }

  async run(): Promise<ChantierListItem[]> {
    const chantiers = await this.prisma
      .getInstance()
      .metadata_chantiers.findMany({
        select: {
          chantier_id: true,
          ch_nom: true,
          ch_state: true,
          ch_per: true,
          updated_at: true,
          perimetre: {
            select: { per_nom: true },
          },
        },
        orderBy: { updated_at: "desc" },
      });
    return chantiers.map((chantier) => ({
      chantierId: chantier.chantier_id,
      chNom: chantier.ch_nom,
      chState: chantier.ch_state,
      perimetreId: chantier.ch_per,
      perimetreNom: chantier.perimetre.per_nom,
      updatedAt: chantier.updated_at,
    }));
  }
}
```

**🎓 À expliquer à l'utilisateur (côté backend, pas react-table) :** pourquoi on joint la relation Prisma `perimetre` plutôt que de faire une deuxième requête, et pourquoi `ch_per`/`perimetre` sont non-nullables ici (donc pas besoin de gérer un cas `null`).

- [ ] **Step 4: Faire vérifier par l'utilisateur que les tests passent**

Demander à l'utilisateur de relancer :
```bash
pnpm --filter pilote-ppg test:server -- ListerChantiersQuery
```
Résultat attendu : les 3 tests du fichier passent (le test "retourne un tableau vide" et "triés par date" ne vérifient pas le périmètre donc ne sont pas impactés).

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/server/metadataChantier/queries/ListerChantiersQuery.ts apps/pilote-ppg/src/server/metadataChantier/__tests__/queries/ListerChantiersQuery.integration.test.ts
git commit -m "feat(ppg): expose le périmètre dans la liste des chantiers admin"
```

---

## Task 2: Créer le hook `useTableauAdminChantiers` et brancher le rendu react-table (sans tri/filtre/pagination interactifs)

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PageAdminChantiers/useTableauAdminChantiers.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/PageAdminChantiers.tsx`

**Interfaces:**
- Consumes: `ChantierListItem` du Task 1 (via le type inféré du router tRPC).
- Produces: `useTableauAdminChantiers(chantiers: ChantierAdminRow[]): { table: Table<ChantierAdminRow> }`, et exporte `ChantierAdminRow` et `STATUT_BADGE` pour que le Task 5 (`FiltresAdminChantiers`) puisse les réutiliser.

**Contexte :** Ce Task fait la conversion « brute » du tableau HTML statique vers react-table, colonne par colonne, sans encore ajouter de comportement interactif (le tri/filtre/pagination arrivent aux tâches suivantes). Le but est d'avoir un rendu visuellement identique à l'existant, mais piloté par `table.getRowModel()` et `flexRender` plutôt que par un `.map()` direct sur le tableau de données.

- [ ] **Step 1: Créer le hook avec les colonnes**

Créer `apps/pilote-ppg/src/client/components/PageAdminChantiers/useTableauAdminChantiers.tsx` :

```tsx
import {
  createColumnHelper,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { useMemo } from "react";
import type { inferRouterOutputs } from "@trpc/server";
import { $Enums } from "@prisma/client";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";

export type ChantierAdminRow =
  inferRouterOutputs<typeof appRouter>["metadataChantier"]["lister"][number];

export const STATUT_BADGE: Record<
  $Enums.type_statut,
  { label: string; className: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  },
  PUBLIE: {
    label: "Publié",
    className: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  ARCHIVE: {
    label: "Archivé",
    className: "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200",
  },
  SUPPRIME: {
    label: "Supprimé",
    className: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
  },
};

const columnHelper = createColumnHelper<ChantierAdminRow>();

const formatDate = (date: Date) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

const useTableColumns = () =>
  useMemo(
    () => [
      columnHelper.accessor("chantierId", {
        id: "chantierId",
        header: "ID",
      }),
      columnHelper.accessor("chNom", {
        id: "chNom",
        header: "Nom",
      }),
      columnHelper.accessor("chState", {
        id: "chState",
        header: "Statut",
        cell: (info) => {
          const badge = STATUT_BADGE[info.getValue()];
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
            >
              {badge.label}
            </span>
          );
        },
      }),
      columnHelper.accessor("perimetreId", {
        id: "perimetreId",
        header: "Périmètre",
        cell: (info) => info.row.original.perimetreNom,
      }),
      columnHelper.accessor("updatedAt", {
        id: "updatedAt",
        header: "Mise à jour",
        cell: (info) => formatDate(info.getValue()),
      }),
    ],
    [],
  );

export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();

  const table = useReactTable({
    data: chantiers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return { table };
};
```

**🎓 À expliquer à l'utilisateur :**
- `createColumnHelper<T>()` : une fabrique typée qui garantit que `accessor("chantierId", ...)` connaît le type de `row.chantierId` et refuse une clé qui n'existe pas sur `ChantierAdminRow`.
- La différence entre l'`id` d'une colonne (utilisé pour le tri/filtre/URL) et son `header` (le libellé affiché) — ici ils diffèrent volontairement pour `perimetreId` (id technique) vs `"Périmètre"` (libellé).
- Pourquoi on filtre sur `perimetreId` (l'identifiant) plutôt que sur `perimetreNom` (le libellé) dans la colonne, tout en affichant le nom dans `cell` : deux périmètres pourraient théoriquement porter des libellés proches, l'identifiant est la valeur fiable pour filtrer/comparer.
- `useReactTable({ data, columns, getCoreRowModel: getCoreRowModel() })` : `getCoreRowModel` est le row model minimal — il transforme juste `data` en `Row[]` sans aucun tri/filtre/pagination. Les prochaines tâches vont ajouter des row models supplémentaires (`getSortedRowModel`, `getFilteredRowModel`, `getPaginationRowModel`) qui se branchent les uns après les autres dans un pipeline.
- `inferRouterOutputs<typeof appRouter>[...]` : comment on récupère le type exact retourné par une procédure tRPC sans le redéfinir à la main (single source of truth = le serveur).

- [ ] **Step 2: Brancher le hook dans `PageAdminChantiers.tsx`**

Dans `apps/pilote-ppg/src/client/components/PageAdminChantiers/PageAdminChantiers.tsx`, remplacer les imports en haut du fichier :

Avant :
```tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { $Enums } from "@prisma/client";
import api from "@/server/infrastructure/api/trpc/api";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Loader from "@/components/_commons/Loader/Loader";

const STATUT_BADGE: Record<
  $Enums.type_statut,
  { label: string; className: string }
> = {
  BROUILLON: {
    label: "Brouillon",
    className: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  },
  PUBLIE: {
    label: "Publié",
    className: "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
  },
  ARCHIVE: {
    label: "Archivé",
    className: "bg-gray-100 text-gray-500 ring-1 ring-inset ring-gray-200",
  },
  SUPPRIME: {
    label: "Supprimé",
    className: "bg-red-50 text-red-600 ring-1 ring-inset ring-red-200",
  },
};
```

Après :
```tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { flexRender } from "@tanstack/react-table";
import api from "@/server/infrastructure/api/trpc/api";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Loader from "@/components/_commons/Loader/Loader";
import { clsxm } from "@/utils/clsxm";
import { useTableauAdminChantiers } from "./useTableauAdminChantiers";
```

Puis, dans le corps du composant, remplacer :

Avant :
```tsx
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const chantiersFiltres = chantiers?.filter((chantier) => {
    const q = recherche.toLowerCase().trim();
    if (!q) return true;
    return (
      chantier.chantierId.toLowerCase().includes(q) ||
      chantier.chNom.toLowerCase().includes(q)
    );
  });
```

Après :
```tsx
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const chantiersFiltres = chantiers?.filter((chantier) => {
    const q = recherche.toLowerCase().trim();
    if (!q) return true;
    return (
      chantier.chantierId.toLowerCase().includes(q) ||
      chantier.chNom.toLowerCase().includes(q)
    );
  });

  const { table } = useTableauAdminChantiers(chantiersFiltres ?? []);
  const rows = table.getRowModel().rows;
```

Puis remplacer le bloc `<table>` complet :

Avant :
```tsx
          ) : chantiersFiltres?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun chantier"}
              </p>
              {recherche ? (
                <p className="text-sm mt-1">
                  Aucun chantier ne correspond à «&nbsp;{recherche}&nbsp;».
                </p>
              ) : (
                <p className="text-sm mt-1">
                  Créez votre premier chantier pour commencer.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nom
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Mise à jour
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {chantiersFiltres?.map((chantier) => {
                  const badge = STATUT_BADGE[chantier.chState] ?? {
                    label: chantier.chState,
                    className: "bg-gray-100 text-gray-600",
                  };
                  return (
                    <tr
                      className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
                      key={chantier.chantierId}
                      onClick={() =>
                        router.push(
                          `/panel-administrateur/chantiers/${chantier.chantierId}`,
                        )
                      }
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-400">
                        {chantier.chantierId}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">
                        {chantier.chNom}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${badge.className}`}
                        >
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500 whitespace-nowrap">
                        {new Date(chantier.updatedAt).toLocaleDateString(
                          "fr-FR",
                          {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          },
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
```

Après :
```tsx
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-gray-400">
              <p className="text-4xl mb-3">📋</p>
              <p className="font-medium text-gray-500">
                {recherche ? "Aucun résultat" : "Aucun chantier"}
              </p>
              {recherche ? (
                <p className="text-sm mt-1">
                  Aucun chantier ne correspond à «&nbsp;{recherche}&nbsp;».
                </p>
              ) : (
                <p className="text-sm mt-1">
                  Créez votre premier chantier pour commencer.
                </p>
              )}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                {table.getHeaderGroups().map((headerGroup) => (
                  <tr
                    className="border-b border-gray-200 bg-gray-50"
                    key={headerGroup.id}
                  >
                    {headerGroup.headers.map((header) => (
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        key={header.id}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => (
                  <tr
                    className="hover:bg-dsfr-alt-blue-france transition-colors cursor-pointer"
                    key={row.id}
                    onClick={() =>
                      router.push(
                        `/panel-administrateur/chantiers/${row.original.chantierId}`,
                      )
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        className={clsxm("px-6 py-4", {
                          "font-mono text-xs text-gray-400":
                            cell.column.id === "chantierId",
                          "font-medium text-gray-900":
                            cell.column.id === "chNom",
                          "text-xs text-gray-500 whitespace-nowrap":
                            cell.column.id === "updatedAt",
                        })}
                        key={cell.id}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
```

**🎓 À expliquer à l'utilisateur :**
- `table.getHeaderGroups()` / `table.getRowModel().rows` : ce sont les deux points d'entrée principaux pour rendre un tableau react-table. `getHeaderGroups()` gère le cas (pas utilisé ici) de colonnes groupées sur plusieurs lignes d'en-tête ; `getRowModel().rows` retourne les lignes après passage dans tout le pipeline de row models configurés (pour l'instant juste `getCoreRowModel`).
- `flexRender(columnDef.header, context)` : pourquoi on ne peut pas juste écrire `{header.column.columnDef.header}` — `header`/`cell` peuvent être une chaîne, une fonction, ou un composant React, et `flexRender` sait gérer les trois cas uniformément.
- `cell.getContext()` / `header.getContext()` : l'objet qui donne accès à `row`, `column`, `table` à l'intérieur d'une fonction `cell`/`header` (utilisé par exemple dans la colonne `perimetreId` pour lire `info.row.original.perimetreNom`).
- Le fait que `chantiersFiltres` (recherche texte) est encore un `useState` local à ce stade — ça changera au Task 6, une fois que le tri/filtre/pagination seront en place, pour que `globalFilter` s'intègre au même pipeline react-table.

- [ ] **Step 3: Vérification manuelle**

Lancer le serveur de dev (`pnpm dev`) et ouvrir `/panel-administrateur/chantiers`. Vérifier :
- Le tableau affiche les mêmes colonnes qu'avant (ID, Nom, Statut, Mise à jour) plus une nouvelle colonne Périmètre, avec les mêmes styles (police mono grise pour l'ID, gras pour le nom, badge coloré pour le statut).
- La recherche texte fonctionne toujours comme avant.
- Cliquer sur une ligne navigue toujours vers `/panel-administrateur/chantiers/{chantierId}`.
- L'état vide (recherche sans résultat, ou aucun chantier) s'affiche correctement.

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAdminChantiers
git commit -m "refactor(ppg): migre le tableau admin chantiers vers react-table"
```

---

## Task 3: Ajouter le tri sur les colonnes, synchronisé dans l'URL

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/useTableauAdminChantiers.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/PageAdminChantiers.tsx`

**Interfaces:**
- Produces: `useTableauAdminChantiers` gère désormais en interne l'état `sorting`, exposé via `table.getState().sorting` / `table.getHeaderGroups()[*].headers[*].column`. Pas de changement de signature du hook.

- [ ] **Step 1: Ajouter l'état de tri synchronisé nuqs dans le hook**

Dans `useTableauAdminChantiers.tsx`, ajouter les imports :

```tsx
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
import { useMemo } from "react";
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
import type { inferRouterOutputs } from "@trpc/server";
import { $Enums } from "@prisma/client";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
```

(remplace l'import `{ useMemo } from "react"` existant et ajoute les nouveaux imports de `@tanstack/react-table` et `nuqs`.)

Ajouter, avant `useTableColumns`, un nouveau hook `useTri` :

```tsx
const DIRECTIONS_DE_TRI = ["asc", "desc"] as const;

const useTri = () => {
  const [tri, setTri] = useQueryStates(
    {
      sortBy: parseAsString.withDefault("updatedAt"),
      sortDir: parseAsStringLiteral(DIRECTIONS_DE_TRI).withDefault("desc"),
    },
    { shallow: true, history: "replace" },
  );

  const sorting: SortingState = useMemo(
    () => [{ id: tri.sortBy, desc: tri.sortDir === "desc" }],
    [tri],
  );

  const onSortingChange: OnChangeFn<SortingState> = (updater) => {
    const nouveauTri =
      typeof updater === "function" ? updater(sorting) : updater;
    const [premierTri] = nouveauTri;
    void setTri(
      premierTri
        ? { sortBy: premierTri.id, sortDir: premierTri.desc ? "desc" : "asc" }
        : { sortBy: "updatedAt", sortDir: "desc" },
    );
  };

  return [sorting, onSortingChange] as const;
};
```

Ajouter un `sortingFn` personnalisé sur la colonne `perimetreId` (pour trier par le nom affiché plutôt que par l'identifiant technique) :

Avant :
```tsx
      columnHelper.accessor("perimetreId", {
        id: "perimetreId",
        header: "Périmètre",
        cell: (info) => info.row.original.perimetreNom,
      }),
```

Après :
```tsx
      columnHelper.accessor("perimetreId", {
        id: "perimetreId",
        header: "Périmètre",
        cell: (info) => info.row.original.perimetreNom,
        sortingFn: (rowA, rowB) =>
          rowA.original.perimetreNom.localeCompare(rowB.original.perimetreNom),
      }),
```

Enfin, brancher `sorting`/`onSortingChange` dans `useTableauAdminChantiers` :

Avant :
```tsx
export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();

  const table = useReactTable({
    data: chantiers,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return { table };
};
```

Après :
```tsx
export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const [sorting, onSortingChange] = useTri();

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return { table };
};
```

**🎓 À expliquer à l'utilisateur :**
- Le concept d'**état contrôlé** dans react-table : `table` ne gère jamais l'état de tri tout seul par défaut dans ce genre de setup — on lui donne `state: { sorting }` (la valeur actuelle, qui vient de l'URL via nuqs) et `onSortingChange` (le callback appelé quand l'utilisateur clique sur un en-tête). C'est le même principe qu'un `<input value={x} onChange={...} />` contrôlé en React, mais appliqué à toute la table.
- Pourquoi `onSortingChange` reçoit un `updater` qui peut être une fonction OU une valeur directe (`typeof updater === "function" ? updater(sorting) : updater`) : react-table utilise ce pattern (identique à `setState` de React) pour permettre des mises à jour basées sur l'état précédent.
- `getSortedRowModel()` : un nouveau maillon dans le pipeline de row models. Sans lui, changer `state.sorting` n'aurait aucun effet sur `table.getRowModel().rows` — c'est ce row model qui applique concrètement le tri.
- `sortingFn` personnalisé sur `perimetreId` : par défaut react-table trierait sur `row.getValue("perimetreId")` (l'identifiant technique), on le surcharge pour trier sur le nom affiché à l'utilisateur — montre que le tri peut porter sur une donnée différente de celle affichée dans la cellule si besoin.
- `sortBy`/`sortDir` avec un seul élément dans `SortingState` (pas de tri multi-colonnes) : react-table supporte le tri sur plusieurs colonnes nativement (`SortingState` est un tableau), on choisit ici de n'en garder qu'un seul (`[premierTri]`) pour rester simple et avoir une URL lisible.

- [ ] **Step 2: Rendre les en-têtes cliquables avec indicateur de tri**

Dans `PageAdminChantiers.tsx`, remplacer le rendu du `<th>` :

Avant :
```tsx
                    {headerGroup.headers.map((header) => (
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        key={header.id}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </th>
                    ))}
```

Après :
```tsx
                    {headerGroup.headers.map((header) => (
                      <th
                        className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        key={header.id}
                      >
                        {header.column.getCanSort() ? (
                          <button
                            className="flex items-center gap-1 !p-0 !font-semibold !text-gray-500 hover:!text-gray-700"
                            onClick={header.column.getToggleSortingHandler()}
                            type="button"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                            {{ asc: " ↑", desc: " ↓" }[
                              header.column.getIsSorted() as string
                            ] ?? ""}
                          </button>
                        ) : (
                          flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )
                        )}
                      </th>
                    ))}
```

**🎓 À expliquer à l'utilisateur :**
- `column.getCanSort()` : toutes les colonnes sont triables par défaut dès que `getSortedRowModel` est fourni à la table — ce garde-fou existe pour le jour où on désactivera le tri sur une colonne précise (`enableSorting: false`), le bouton ne serait alors plus affiché.
- `column.getToggleSortingHandler()` : une fonction fournie clé en main par react-table qui gère elle-même le cycle non-trié → ascendant → descendant → non-trié (ou juste asc/desc selon la config) — pas besoin de coder la logique de bascule soi-même.
- `column.getIsSorted()` : retourne `false`, `"asc"` ou `"desc"`, utilisé ici pour afficher la flèche.

- [ ] **Step 3: Vérification manuelle**

Sur `/panel-administrateur/chantiers` :
- Cliquer sur chaque en-tête de colonne et vérifier que l'ordre des lignes change, avec une flèche ↑/↓ qui apparaît sur la colonne triée.
- Vérifier que l'URL contient `?sortBy=...&sortDir=...` après un clic.
- Recharger la page avec cette URL et vérifier que le tri est conservé.
- Vérifier spécifiquement le tri sur la colonne Périmètre : il doit trier par le **nom** du périmètre, pas par son identifiant technique.

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAdminChantiers
git commit -m "feat(ppg): ajoute le tri sur les colonnes du tableau admin chantiers"
```

---

## Task 4: Ajouter la pagination, synchronisée dans l'URL

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/useTableauAdminChantiers.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/PageAdminChantiers.tsx`

- [ ] **Step 1: Ajouter l'état de pagination synchronisé nuqs dans le hook**

Dans `useTableauAdminChantiers.tsx`, mettre à jour l'import `@tanstack/react-table` :

Avant :
```tsx
import {
  createColumnHelper,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type OnChangeFn,
  type SortingState,
} from "@tanstack/react-table";
```

Après :
```tsx
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
```

Et l'import `nuqs` :

Avant :
```tsx
import { parseAsString, parseAsStringLiteral, useQueryStates } from "nuqs";
```

Après :
```tsx
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
```

Ajouter, après `useTri`, un nouveau hook `usePagination` :

```tsx
const usePagination = () => {
  const [pagination, setPagination] = useQueryStates(
    {
      pageIndex: parseAsInteger.withDefault(0),
      pageSize: parseAsInteger.withDefault(20),
    },
    { shallow: true, history: "replace" },
  );

  const paginationState: PaginationState = useMemo(
    () => pagination,
    [pagination],
  );

  return [paginationState, setPagination] as const;
};
```

Brancher dans `useTableauAdminChantiers` :

Avant :
```tsx
export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const [sorting, onSortingChange] = useTri();

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return { table };
};
```

Après :
```tsx
export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const [sorting, onSortingChange] = useTri();
  const [pagination, setPagination] = usePagination();

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting, pagination },
    onSortingChange,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return { table };
};
```

**🎓 À expliquer à l'utilisateur :**
- `PaginationState` est un objet `{ pageIndex, pageSize }`, pas juste un numéro de page — `pageIndex` est **0-based** (la première page est `0`, pas `1`), contrairement à ce qu'on affichera à l'utilisateur (`pageIndex + 1`) dans l'UI.
- `getPaginationRowModel()` est le **dernier** maillon du pipeline : il s'applique après le tri et (aux tâches suivantes) après les filtres — l'ordre d'enregistrement des `getXRowModel` dans `useReactTable` ne compte pas, react-table applique toujours filtrage → tri → pagination dans cet ordre précis en interne.
- Comme pour le tri, `onPaginationChange: setPagination` marche directement ici car la signature de `useQueryStates` (`Values | (old: Values) => Values`) est compatible avec le type `OnChangeFn<PaginationState>` attendu par react-table — pas besoin d'écrire un adaptateur comme pour le tri.

- [ ] **Step 2: Ajouter les contrôles de pagination dans `PageAdminChantiers.tsx`**

Juste après la fermeture de `</table>` (et avant la fermeture du `<div className="bg-white rounded-lg ...">`), ajouter :

```tsx
              {rows.length > 0 && (
                <div className="flex items-center justify-between px-6 py-3 border-t border-gray-200 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <span>Lignes par page :</span>
                    <select
                      className="border border-gray-200 rounded-sm px-2 py-1 bg-white"
                      onChange={(event) =>
                        table.setPageSize(Number(event.target.value))
                      }
                      value={table.getState().pagination.pageSize}
                    >
                      {[10, 20, 50].map((taille) => (
                        <option key={taille} value={taille}>
                          {taille}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>
                      Page {table.getState().pagination.pageIndex + 1} sur{" "}
                      {table.getPageCount()}
                    </span>
                    <button
                      className="px-3 py-1 border border-gray-200 rounded-sm disabled:opacity-50"
                      disabled={!table.getCanPreviousPage()}
                      onClick={() => table.previousPage()}
                      type="button"
                    >
                      Précédent
                    </button>
                    <button
                      className="px-3 py-1 border border-gray-200 rounded-sm disabled:opacity-50"
                      disabled={!table.getCanNextPage()}
                      onClick={() => table.nextPage()}
                      type="button"
                    >
                      Suivant
                    </button>
                  </div>
                </div>
              )}
```

**🎓 À expliquer à l'utilisateur :**
- `table.getPageCount()`, `table.getCanPreviousPage()`, `table.getCanNextPage()`, `table.previousPage()`, `table.nextPage()`, `table.setPageSize()` : ce sont des méthodes « pratiques » (helpers) fournies par react-table qui font juste des lectures/mutations de `state.pagination` en coulisses — on pourrait tout à fait faire `table.setPageIndex(table.getState().pagination.pageIndex - 1)` à la main, mais ces helpers évitent les erreurs de bornes (ex: aller en dessous de 0).
- Pourquoi `rows.length > 0` conditionne l'affichage : `rows` ici est déjà la page courante (`table.getRowModel().rows` après pagination), donc ce test protège juste contre le cas où la page actuelle serait vide (ex: on est sur la page 3 après avoir tapé une recherche qui ne laisse qu'une page de résultats) plutôt que de vérifier s'il y a des données au total.

- [ ] **Step 3: Vérification manuelle**

Sur `/panel-administrateur/chantiers` (avec suffisamment de chantiers pour dépasser 20 lignes — sinon, changer temporairement la taille de page à 10 pour tester) :
- Vérifier l'affichage "Page X sur Y".
- Cliquer sur "Suivant"/"Précédent", vérifier que les lignes changent et que les boutons se désactivent en bord de pagination.
- Changer la taille de page via le `<select>`, vérifier que le nombre de lignes affichées change.
- Vérifier que l'URL contient `?pageIndex=...&pageSize=...` et que recharger la page conserve la position.

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAdminChantiers
git commit -m "feat(ppg): ajoute la pagination au tableau admin chantiers"
```

---

## Task 5: Ajouter les filtres de colonnes (statut, périmètre), synchronisés dans l'URL

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/useTableauAdminChantiers.tsx`
- Create: `apps/pilote-ppg/src/client/components/PageAdminChantiers/FiltresAdminChantiers.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/PageAdminChantiers.tsx`

**Interfaces:**
- Produces: `FiltresAdminChantiers({ table, chantiers }: { table: Table<ChantierAdminRow>; chantiers: ChantierAdminRow[] })`, un composant qui lit/écrit les filtres via les méthodes `column.getFilterValue()` / `column.setFilterValue()` de react-table.

- [ ] **Step 1: Ajouter l'état des filtres de colonnes synchronisé nuqs dans le hook**

Dans `useTableauAdminChantiers.tsx`, mettre à jour l'import `@tanstack/react-table` :

Avant :
```tsx
import {
  createColumnHelper,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
```

Après :
```tsx
import {
  createColumnHelper,
  getCoreRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type OnChangeFn,
  type PaginationState,
  type SortingState,
} from "@tanstack/react-table";
```

Et l'import `nuqs` :

Avant :
```tsx
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
```

Après :
```tsx
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
```

Ajouter `enableColumnFilter: true` et `filterFn: "arrIncludesSome"` sur les colonnes `chState` et `perimetreId` :

Avant :
```tsx
      columnHelper.accessor("chState", {
        id: "chState",
        header: "Statut",
        cell: (info) => {
```

Après :
```tsx
      columnHelper.accessor("chState", {
        id: "chState",
        header: "Statut",
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
        cell: (info) => {
```

Avant :
```tsx
      columnHelper.accessor("perimetreId", {
        id: "perimetreId",
        header: "Périmètre",
        cell: (info) => info.row.original.perimetreNom,
        sortingFn: (rowA, rowB) =>
```

Après :
```tsx
      columnHelper.accessor("perimetreId", {
        id: "perimetreId",
        header: "Périmètre",
        enableColumnFilter: true,
        filterFn: "arrIncludesSome",
        cell: (info) => info.row.original.perimetreNom,
        sortingFn: (rowA, rowB) =>
```

Ajouter, après `usePagination`, une fonction utilitaire et un hook `useFiltresColonnes` :

```tsx
const toStringArray = (value: unknown): string[] =>
  Array.isArray(value) && value.every((valeur) => typeof valeur === "string")
    ? (value as string[])
    : [];

const useFiltresColonnes = () => {
  const [filtres, setFiltres] = useQueryStates(
    {
      statut: parseAsArrayOf(parseAsString).withDefault([]),
      perimetre: parseAsArrayOf(parseAsString).withDefault([]),
    },
    { shallow: true, clearOnDefault: true, history: "replace" },
  );

  const columnFilters: ColumnFiltersState = useMemo(() => {
    const filtresColonnes: ColumnFiltersState = [];
    if (filtres.statut.length > 0) {
      filtresColonnes.push({ id: "chState", value: filtres.statut });
    }
    if (filtres.perimetre.length > 0) {
      filtresColonnes.push({ id: "perimetreId", value: filtres.perimetre });
    }
    return filtresColonnes;
  }, [filtres]);

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    const nouveauxFiltres =
      typeof updater === "function" ? updater(columnFilters) : updater;

    void setFiltres({
      statut: toStringArray(
        nouveauxFiltres.find((filtre) => filtre.id === "chState")?.value,
      ),
      perimetre: toStringArray(
        nouveauxFiltres.find((filtre) => filtre.id === "perimetreId")?.value,
      ),
    });
  };

  return [columnFilters, onColumnFiltersChange] as const;
};
```

Brancher dans `useTableauAdminChantiers`, en réinitialisant la pagination à chaque changement de filtre (pour ne pas rester bloqué sur une page qui n'existe plus) :

Avant :
```tsx
export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const [sorting, onSortingChange] = useTri();
  const [pagination, setPagination] = usePagination();

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting, pagination },
    onSortingChange,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  return { table };
};
```

Après :
```tsx
export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const [sorting, onSortingChange] = useTri();
  const [pagination, setPagination] = usePagination();
  const [columnFilters, setColumnFilters] = useFiltresColonnes();

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFilters(updater);
    void setPagination({ pageIndex: 0 });
  };

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting, pagination, columnFilters },
    onSortingChange,
    onPaginationChange: setPagination,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return { table };
};
```

**🎓 À expliquer à l'utilisateur :**
- `ColumnFiltersState` est un tableau de `{ id, value }` — un par colonne filtrée — pas un objet clé/valeur. `filtres.statut`/`filtres.perimetre` (les query params nuqs, plus lisibles) sont donc **traduits** vers/depuis ce format dans `useFiltresColonnes`, exactement comme le fait `useColumnFilters` dans `useTableauEvaluation.tsx` pour les filtres de territoire/critère.
- `filterFn: "arrIncludesSome"` est un filtre **intégré** à react-table (pas besoin de l'écrire) : il vérifie que la valeur de la cellule est incluse dans le tableau `filterValue`. C'est le même filtre déjà utilisé par `RATTACHEMENT_CODE`/`CRITERE_ID` dans `useTableauEvaluation.tsx` — on reste cohérent avec l'existant plutôt que de réinventer une fonction de filtre custom comme le fait `useTableColumns` dans le même fichier pour d'autres colonnes.
- `getFilteredRowModel()` est le maillon qui applique concrètement `columnFilters` (et, au Task 6, `globalFilter`) — sans lui, changer `state.columnFilters` n'aurait aucun effet visible.
- `getFacetedUniqueValues()` : calcule, pour chaque colonne, la liste des valeurs distinctes présentes dans les lignes **après filtrage par les autres colonnes mais avant filtrage par la colonne elle-même** — c'est ce qui permet d'afficher, dans le filtre périmètre, uniquement les périmètres qui ont au moins un chantier correspondant aux autres filtres actifs (ex: le filtre statut).
- Pourquoi on réinitialise `pageIndex` à `0` dans `onColumnFiltersChange` : sans ça, si l'utilisateur est en page 5 et applique un filtre qui ne laisse que 2 pages de résultats, il se retrouverait sur une page vide.

- [ ] **Step 2: Créer le composant `FiltresAdminChantiers`**

Créer `apps/pilote-ppg/src/client/components/PageAdminChantiers/FiltresAdminChantiers.tsx` :

```tsx
import { Table } from "@tanstack/react-table";
import { useId, useMemo } from "react";
import { $Enums } from "@prisma/client";
import { Checkbox } from "@/components/shared/Checkbox";
import { MultiSelectFiltre } from "@/components/_commons/MultiSelectFiltre/MultiSelectFiltre";
import { Bouton } from "@/components/_commons/Bouton/Bouton";
import { ChantierAdminRow, STATUT_BADGE } from "./useTableauAdminChantiers";

const STATUTS = Object.values($Enums.type_statut);

export const FiltresAdminChantiers = ({
  table,
  chantiers,
}: {
  table: Table<ChantierAdminRow>;
  chantiers: ChantierAdminRow[];
}) => {
  const id = useId();
  const colonneStatut = table.getColumn("chState");
  const colonnePerimetre = table.getColumn("perimetreId");

  const valeursStatut = (colonneStatut?.getFilterValue() as string[]) ?? [];
  const valeursPerimetre =
    (colonnePerimetre?.getFilterValue() as string[]) ?? [];

  const nomsPerimetres = useMemo(() => {
    const noms = new Map<string, string>();
    chantiers.forEach((chantier) => {
      noms.set(chantier.perimetreId, chantier.perimetreNom);
    });
    return noms;
  }, [chantiers]);

  const idsPerimetresDisponibles = colonnePerimetre
    ? [...colonnePerimetre.getFacetedUniqueValues().keys()]
    : [];

  const aDesFiltresActifs =
    valeursStatut.length > 0 || valeursPerimetre.length > 0;

  return (
    <section className="flex flex-wrap items-center gap-4 px-6 py-3 border-b border-gray-200 bg-gray-50">
      <div className="flex items-center gap-2 text-sm">
        <span className="font-semibold whitespace-nowrap">Statut :</span>
        <div className="flex flex-wrap items-center gap-2">
          {STATUTS.map((statut) => {
            const optionId = `${id}-${statut}`;
            const estCoché = valeursStatut.includes(statut);
            return (
              <label
                className="flex items-center gap-2 cursor-pointer"
                htmlFor={optionId}
                key={statut}
              >
                <Checkbox
                  checked={estCoché}
                  id={optionId}
                  onCheckedChange={() =>
                    colonneStatut?.setFilterValue(
                      estCoché
                        ? valeursStatut.filter((valeur) => valeur !== statut)
                        : [...valeursStatut, statut],
                    )
                  }
                />
                {STATUT_BADGE[statut].label}
              </label>
            );
          })}
        </div>
      </div>

      <MultiSelectFiltre
        getOptionLabel={(value) => nomsPerimetres.get(value) ?? value}
        label="Périmètre"
        onChange={(nouvellesValeurs) =>
          colonnePerimetre?.setFilterValue(nouvellesValeurs)
        }
        optionGroups={[
          { label: "Périmètres", options: idsPerimetresDisponibles },
        ]}
        values={valeursPerimetre}
      />

      {aDesFiltresActifs && (
        <Bouton
          label="Réinitialiser les filtres"
          onClick={() => table.resetColumnFilters()}
          size="sm"
          variant="link"
        />
      )}
    </section>
  );
};
```

**🎓 À expliquer à l'utilisateur :**
- `table.getColumn(id)` : comment récupérer l'objet `Column` d'une colonne précise par son `id` (celui défini dans `columnHelper.accessor(..., { id: ... })`) pour lire/écrire son filtre indépendamment du rendu du tableau lui-même — ce composant n'a jamais besoin de connaître `columnFilters` ou l'état nuqs sous-jacent, il passe entièrement par l'API `Column`.
- `column.getFilterValue()` / `column.setFilterValue(value)` : la paire lecture/écriture pour le filtre d'**une seule colonne**. Appeler `setFilterValue` déclenche `onColumnFiltersChange` configuré dans le hook, qui lui-même met à jour l'URL via nuqs — le composant de filtre n'a donc pas besoin de connaître nuqs du tout, c'est une séparation propre entre "l'UI du filtre" et "où l'état est stocké".
- `column.getFacetedUniqueValues()` retourne une `Map<valeur, nombre d'occurrences>` — on n'utilise ici que `.keys()` pour lister les périmètres disponibles, mais le nombre d'occurrences est disponible si on voulait afficher un compteur à côté de chaque option (comme le fait parfois une UI de filtre à facettes).
- Ce composant est complètement **découplé** du hook — il reçoit `table` en prop, ce qui montre l'intérêt de séparer "construction de la table" (le hook) de "présentation des filtres" (ce composant) : on pourrait réutiliser `FiltresAdminChantiers` avec n'importe quelle instance de `Table<ChantierAdminRow>`, y compris dans un test avec des données bouchonnées.

- [ ] **Step 3: Intégrer `FiltresAdminChantiers` dans `PageAdminChantiers.tsx`**

Ajouter l'import :

```tsx
import { FiltresAdminChantiers } from "./FiltresAdminChantiers";
```

Puis, juste avant le `{isLoading ? (` du rendu conditionnel du tableau (à l'intérieur du `<div className="bg-white rounded-lg shadow-sm ring-1 ring-gray-200 overflow-hidden">`), ajouter :

```tsx
          {!isLoading && rows.length >= 0 && (
            <FiltresAdminChantiers chantiers={chantiersFiltres ?? []} table={table} />
          )}
```

**🎓 À expliquer à l'utilisateur :** pourquoi on passe `chantiersFiltres` (la liste après recherche texte, à ce stade du plan) plutôt que `chantiers` (la liste brute) : les options de périmètre affichées doivent rester cohérentes avec les résultats de la recherche texte en cours — ce comportement transitoire disparaîtra au Task 6 quand la recherche passera, elle aussi, par react-table.

- [ ] **Step 4: Vérification manuelle**

Sur `/panel-administrateur/chantiers` :
- Cocher un ou plusieurs statuts, vérifier que seules les lignes correspondantes s'affichent, et que l'URL contient `?statut=PUBLIE` (ou plusieurs valeurs séparées par une virgule selon le format nuqs).
- Sélectionner un ou plusieurs périmètres via le multi-select, vérifier le filtrage et l'URL (`?perimetre=...`).
- Combiner les deux filtres, vérifier que c'est un ET logique (chantiers qui matchent le statut ET le périmètre).
- Vérifier que la pagination revient en page 1 après un changement de filtre.
- Cliquer sur "Réinitialiser les filtres", vérifier que les deux filtres et les paramètres d'URL correspondants disparaissent.
- Recharger la page avec une URL contenant des filtres, vérifier qu'ils sont bien restaurés.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAdminChantiers
git commit -m "feat(ppg): ajoute les filtres statut et périmètre au tableau admin chantiers"
```

---

## Task 6: Faire passer la recherche texte par le `globalFilter` de react-table

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/useTableauAdminChantiers.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PageAdminChantiers/PageAdminChantiers.tsx`

- [ ] **Step 1: Ajouter le `globalFilter` synchronisé nuqs dans le hook**

Dans `useTableauAdminChantiers.tsx`, ajouter l'import `useQueryState` (en plus de `useQueryStates`) :

Avant :
```tsx
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs";
```

Après :
```tsx
import {
  parseAsArrayOf,
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
  useQueryStates,
} from "nuqs";
```

Ajouter, après `useFiltresColonnes`, un hook `useRecherche` et la fonction de filtre global :

```tsx
const useRecherche = () =>
  useQueryState(
    "q",
    parseAsString.withDefault("").withOptions({
      shallow: true,
      clearOnDefault: true,
      history: "replace",
    }),
  );

const filtreGlobal = (row: { original: ChantierAdminRow }, recherche: string) => {
  const texte = recherche.toLowerCase().trim();
  if (!texte) return true;
  return (
    row.original.chantierId.toLowerCase().includes(texte) ||
    row.original.chNom.toLowerCase().includes(texte)
  );
};
```

Brancher dans `useTableauAdminChantiers`, en réinitialisant aussi la pagination quand la recherche change :

Avant :
```tsx
export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const [sorting, onSortingChange] = useTri();
  const [pagination, setPagination] = usePagination();
  const [columnFilters, setColumnFilters] = useFiltresColonnes();

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFilters(updater);
    void setPagination({ pageIndex: 0 });
  };

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting, pagination, columnFilters },
    onSortingChange,
    onPaginationChange: setPagination,
    onColumnFiltersChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return { table };
};
```

Après :
```tsx
export const useTableauAdminChantiers = (chantiers: ChantierAdminRow[]) => {
  const columns = useTableColumns();
  const [sorting, onSortingChange] = useTri();
  const [pagination, setPagination] = usePagination();
  const [columnFilters, setColumnFilters] = useFiltresColonnes();
  const [globalFilter, setRecherche] = useRecherche();

  const onColumnFiltersChange: OnChangeFn<ColumnFiltersState> = (updater) => {
    setColumnFilters(updater);
    void setPagination({ pageIndex: 0 });
  };

  const onGlobalFilterChange: OnChangeFn<string> = (updater) => {
    const nouvelleRecherche =
      typeof updater === "function" ? updater(globalFilter) : updater;
    void setRecherche(nouvelleRecherche);
    void setPagination({ pageIndex: 0 });
  };

  const table = useReactTable({
    data: chantiers,
    columns,
    state: { sorting, pagination, columnFilters, globalFilter },
    onSortingChange,
    onPaginationChange: setPagination,
    onColumnFiltersChange,
    onGlobalFilterChange,
    globalFilterFn: (row, _columnId, filterValue: string) =>
      filtreGlobal(row, filterValue),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return { table };
};
```

**🎓 À expliquer à l'utilisateur :**
- La différence entre `filterFn` (par colonne, comme `arrIncludesSome` sur `chState`) et `globalFilterFn` (une seule fonction pour toute la table, indépendante des colonnes) : ici on veut chercher dans `chantierId` **et** `chNom` en même temps, ce qui n'a pas de sens comme filtre d'une colonne unique — le `globalFilter` est fait pour ce cas d'usage de "barre de recherche transversale".
- `globalFilter` est une simple `string` dans `state` (pas un tableau comme `columnFilters`) — un seul champ de recherche pour toute la table.
- Le filtre global et les filtres de colonnes se combinent automatiquement en ET logique via `getFilteredRowModel()` — pas besoin d'écrire de logique de composition, react-table applique déjà `columnFilters` puis `globalFilter` (ou l'inverse, l'ordre exact n'a pas d'importance ici car ce sont des ET) dans le même row model.

- [ ] **Step 2: Simplifier `PageAdminChantiers.tsx` — supprimer le filtrage manuel**

Remplacer :

Avant :
```tsx
import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { flexRender } from "@tanstack/react-table";
import api from "@/server/infrastructure/api/trpc/api";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Loader from "@/components/_commons/Loader/Loader";
import { clsxm } from "@/utils/clsxm";
import { useTableauAdminChantiers } from "./useTableauAdminChantiers";
import { FiltresAdminChantiers } from "./FiltresAdminChantiers";
```

Après (suppression de l'import `useState`, plus utilisé) :
```tsx
import { useRouter } from "next/router";
import Link from "next/link";
import { flexRender } from "@tanstack/react-table";
import api from "@/server/infrastructure/api/trpc/api";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import Loader from "@/components/_commons/Loader/Loader";
import { clsxm } from "@/utils/clsxm";
import { useTableauAdminChantiers } from "./useTableauAdminChantiers";
import { FiltresAdminChantiers } from "./FiltresAdminChantiers";
```

Puis remplacer :

Avant :
```tsx
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();
  const [recherche, setRecherche] = useState("");

  const chantiersFiltres = chantiers?.filter((chantier) => {
    const q = recherche.toLowerCase().trim();
    if (!q) return true;
    return (
      chantier.chantierId.toLowerCase().includes(q) ||
      chantier.chNom.toLowerCase().includes(q)
    );
  });

  const { table } = useTableauAdminChantiers(chantiersFiltres ?? []);
  const rows = table.getRowModel().rows;
```

Après :
```tsx
  const { data: chantiers, isLoading } = api.metadataChantier.lister.useQuery();

  const { table } = useTableauAdminChantiers(chantiers ?? []);
  const rows = table.getRowModel().rows;
  const recherche = (table.getState().globalFilter as string | undefined) ?? "";
```

Puis mettre à jour la barre de recherche :

Avant :
```tsx
        <div className="mb-4 max-w-sm">
          <BarreDeRecherche
            changementDeLaRechercheCallback={(event) =>
              setRecherche(event.target.value)
            }
            valeur={recherche}
          />
        </div>
```

Après :
```tsx
        <div className="mb-4 max-w-sm">
          <BarreDeRecherche
            changementDeLaRechercheCallback={(event) =>
              table.setGlobalFilter(event.target.value)
            }
            valeur={recherche}
          />
        </div>
```

Et mettre à jour la prop `chantiers` de `FiltresAdminChantiers` (qui utilisait `chantiersFiltres`, maintenant supprimé) :

Avant :
```tsx
          {!isLoading && rows.length >= 0 && (
            <FiltresAdminChantiers chantiers={chantiersFiltres ?? []} table={table} />
          )}
```

Après :
```tsx
          {!isLoading && (
            <FiltresAdminChantiers chantiers={chantiers ?? []} table={table} />
          )}
```

**🎓 À expliquer à l'utilisateur :** en centralisant `recherche` dans `table.getState().globalFilter`, `BarreDeRecherche` et le message "Aucun résultat" lisent maintenant la même source de vérité que le filtrage réel des lignes — avant ce changement, rien ne garantissait que le `useState` local et le filtrage restaient synchronisés si le code évoluait (c'était le cas ici car les deux étaient dérivés ensemble, mais ça devient structurellement impossible de les désynchroniser une fois que tout passe par `table`).

- [ ] **Step 3: Vérification manuelle complète**

Sur `/panel-administrateur/chantiers` :
- Taper une recherche, vérifier que seules les lignes correspondantes s'affichent et que l'URL contient `?q=...`.
- Vérifier que la recherche se combine correctement avec les filtres statut/périmètre (ET logique) et avec le tri.
- Vérifier que taper une recherche ramène à la page 1.
- Vider la recherche, vérifier que toutes les lignes (compatibles avec les filtres actifs) réapparaissent.
- Recharger une URL contenant `q`, des filtres, un tri et une pagination en même temps : vérifier que l'état affiché correspond exactement à l'URL.
- Vérifier que le compteur "X chantiers" en haut de page continue d'afficher le nombre total de chantiers (pas le nombre filtré) — comportement inchangé par rapport à l'existant.

- [ ] **Step 4: Lancer le lint**

```bash
pnpm --filter pilote-ppg lint
```
Corriger toute erreur signalée (imports inutilisés, etc.) avant de continuer.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAdminChantiers
git commit -m "feat(ppg): branche la recherche texte sur le globalFilter react-table"
```

---

## Self-Review

- **Couverture** : colonnes ✅ (Task 2), tri ✅ (Task 3), pagination ✅ (Task 4), filtres statut/périmètre ✅ (Task 5), recherche via react-table ✅ (Task 6), état dans l'URL via nuqs ✅ (chaque tâche synchronise son propre morceau d'état), extension backend pour exposer le périmètre ✅ (Task 1).
- **Cohérence des types** : `ChantierAdminRow` (Task 2) est utilisé à l'identique dans `useTableauAdminChantiers.tsx` et `FiltresAdminChantiers.tsx` ; les `id` de colonnes (`chantierId`, `chNom`, `chState`, `perimetreId`, `updatedAt`) sont réutilisés tels quels dans `useFiltresColonnes` (Task 5) et dans `table.getColumn(...)` (Task 5).
- **Pas de placeholder** : chaque étape contient le code réel à écrire, pas de "TODO" ni de renvoi à une autre tâche pour le contenu.
