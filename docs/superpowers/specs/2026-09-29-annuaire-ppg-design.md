# Annuaire des coordinateurs et responsables locaux — pilote-ppg

Date : 2026-09-29
Maquette : https://claude.ai/artifact/PpJBVRXBdEKkNTF8aUf5fk
Dépend de : la couche `DataTable` de la branche `refactor/ppg-PIL-1822-refonte-tableaux` (spec `2026-09-28-refonte-tableaux-ppg-design.md`)

## Contexte

Les utilisateurs de PILOTE n'ont aucun moyen de trouver qui coordonne un territoire ni qui est responsable d'un chantier sur un territoire, sauf à ouvrir chaque page chantier (rubrique « Responsables »).

Les données existent déjà :

- **Coordinateurs** : utilisateurs actifs de profil `COORDINATEUR_REGION` / `COORDINATEUR_DEPARTEMENT`, rattachés aux territoires de leur habilitation `lecture` au niveau correspondant à leur profil (`int_coordinateurs_territoriaux.sql`). Le résultat ne dépend pas du chantier.
- **Responsables locaux** : utilisateurs actifs des profils services déconcentrés, préfet ou coordinateur (région ou département) qui ont une habilitation `responsabilite`, regroupés par couple chantier × territoire au niveau correspondant à leur profil (`int_responsables_locaux.sql`). Un coordinateur peut donc aussi être responsable local.
- dbt écrit ces résultats dans `chantier_territoire.coordinateurs_territoriaux_ids` et `chantier_territoire.responsables_locaux_ids` (tableaux d'identifiants utilisateur, triés par e-mail). La page chantier et l'export CSV les lisent déjà.

Les relations sont multiples dans les deux sens : un territoire peut avoir plusieurs coordinateurs et un coordinateur plusieurs territoires ; un couple chantier × territoire peut avoir plusieurs responsables et un responsable plusieurs couples.

## Objectifs

1. Une page **Annuaire** avec deux onglets : **Coordinateurs PILOTE** et **Responsables locaux**.
2. Chaque onglet propose deux **regroupements**, une ligne par groupe, sans accordéon :
   - Coordinateurs : par **territoire** (défaut) ou par **coordinateur**.
   - Responsables : par **chantier et territoire** (défaut) ou par **responsable**.
3. Filtres : **recherche**, **Territoire** (régions et départements), et **Chantier** pour l'onglet Responsables.
4. Chaque adresse e-mail est un lien `mailto:`, suivi immédiatement de son propre bouton de copie. La copie écrit uniquement l'adresse dans le presse-papiers et affiche « Adresse e-mail copiée ». Le bouton a pour libellé accessible « Copier l'adresse e-mail de Prénom Nom ».
5. Onglet, regroupement, filtres, tri et page sont enregistrés dans l'URL.

### Non-objectifs

- Tests unitaires client et tests e2e pour cette fonctionnalité (seuls les tests d'intégration serveur sont écrits).
- Compteurs dans les onglets.
- Filtre « Niveau » (régional / départemental) : le filtre Territoire le rend inutile.
- Recalcul en direct des coordinateurs et responsables à partir des habilitations : on lit le résultat de dbt.
- Faire migrer l'accueil (`groupeParMinistere`) ou PILOTE Éval vers la nouvelle option `grouping` de `urlState` : c'est possible plus tard, mais hors périmètre.

## Décisions

| Sujet | Décision |
|---|---|
| Accès | Tout utilisateur connecté voit l'annuaire complet, sans restriction à son périmètre de lecture. |
| Source des données | `chantier_territoire` calculé par dbt. Une habilitation modifiée n'apparaît qu'après le prochain passage de dbt. |
| Couples responsables affichés | Couples qui ont au moins un responsable, pour un chantier au statut `PUBLIE`. Pas de filtre sur `est_applicable` : une personne désignée sur un couple non applicable apparaît. |
| Responsables affichés | Seulement leurs affectations sur des chantiers `PUBLIE`. Une personne responsable sur un chantier publié et un chantier non publié n'apparaît qu'avec le chantier publié. Une personne qui n'est responsable que sur des chantiers non publiés n'apparaît pas. |
| Territoires coordinateurs affichés | Territoires de niveau REG ou DEPT qui ont au moins un coordinateur. |
| Emplacement | Page `/annuaire`, entrée « Annuaire » dans `NavigationPilote`, derrière le feature flag `NEXT_PUBLIC_FF_ANNUAIRE`. |
| Filtres | Un seul filtre **Territoire**, avec deux groupes d'options (Régions, Départements). Les territoires choisis s'additionnent (OU). Le filtre **Chantier** se cumule avec eux (ET). |
| Filtre et regroupement | Les filtres s'appliquent à chaque affectation, **avant** le regroupement. Une personne regroupée qui couvre le Nord et le Pas-de-Calais, filtrée sur le Nord, n'affiche que le Nord. |
| Changement d'onglet | Remet à zéro filtres, recherche, tri, page et regroupement. |
| Onglets | Composant existant `_commons/NavigationTertiaire`, enrichi d'une prop `children` facultative. |

## Architecture

### Vue d'ensemble

```
chantier_territoire (dbt) ─┐
utilisateur ───────────────┼─> ListerCoordinateursAnnuaireQuery ─┐
territoire ────────────────┘   ListerResponsablesAnnuaireQuery ──┤
                                                                 │ tRPC annuaire.coordinateurs / annuaire.responsables
                                                                 v
                         { personnes, affectations }  ──>  lignesAnnuaire (une ligne par affectation)
                                                                 │
                                                                 v
                         DataTable + columnGroupingFeature (sans dépliage)
                         state.grouping ← URL (?groupement=)
                         une ligne de groupe par territoire / personne / couple, row.subRows = ses affectations
```

### Serveur : module `annuaire` (CQRS léger, lecture seule)

```
src/server/annuaire/
  module.ts                                   defineModule<NoExports, AnnuaireCradle>, imports ["shared"]
  queries/ListerCoordinateursAnnuaireQuery.ts
  queries/ListerResponsablesAnnuaireQuery.ts
  queries/personnesAnnuaire.ts                lecture commune utilisateur et territoire
  __tests__/queries/ListerCoordinateursAnnuaireQuery.integration.test.ts
  __tests__/queries/ListerResponsablesAnnuaireQuery.integration.test.ts
```

- Ajouter `"annuaire"` à `moduleNames` (`src/server/module-system/moduleNames.ts`) et au tableau `allModules` de `src/server/dependances.ts`.
- Les Query suivent `ListerPorteursAdminQuery` : `constructor({ prisma }: Inject<"prisma">)` puis `run()`. Le module lit Prisma directement et ne dépend pas du `UtilisateurRepository` du module `chantiers`.

**Contrat**

```ts
type PersonneAnnuaire = {
  id: string;
  prenom: string;
  nom: string;
  email: string;
  fonction: string | null;
  service: string | null; // getServiceLibelle(perimetre_ministeriel, service, service_autre)
};

type TerritoireAnnuaire = {
  code: string;
  nom: string; // territoire.nom_affiche, par exemple « 69 - Rhône »
  maille: "REG" | "DEPT";
  regionCode: string; // le territoire lui-même pour une région
  regionNom: string;
};

type AnnuaireCoordinateurs = {
  personnes: PersonneAnnuaire[];
  affectations: { personneId: string; territoire: TerritoireAnnuaire }[];
};

type AnnuaireResponsables = {
  personnes: PersonneAnnuaire[];
  affectations: {
    personneId: string;
    chantier: { id: string; nom: string };
    territoire: TerritoireAnnuaire;
  }[];
};
```

Une personne n'apparaît qu'une fois dans `personnes`, même si elle a plusieurs affectations. `personnes` est construite **à partir des affectations retenues** : une personne sans affectation retenue (par exemple responsable uniquement sur des chantiers non publiés) n'y figure pas.

**Requêtes**

- `ListerCoordinateursAnnuaireQuery` : lignes `chantier_territoire` dont `coordinateurs_territoriaux_ids` n'est pas vide et dont la maille est REG ou DEPT, avec `distinct: ["territoire_code"]` (la liste est la même pour tous les chantiers d'un territoire).
- `ListerResponsablesAnnuaireQuery` : lignes `chantier_territoire` dont `responsables_locaux_ids` n'est pas vide et dont `chantier_identite.statut = PUBLIE`, avec le nom du chantier.
- Ensuite, pour les deux : lire les utilisateurs par leurs identifiants (`findMany({ where: { id: { in } } })`), puis les territoires par leur code avec leur parent. Un identifiant qui ne correspond à aucun utilisateur est ignoré, comme dans `resolveResponsables`. Pas de requête N+1.

**Routeur tRPC** (`src/server/infrastructure/api/trpc/routes/annuaire.ts`, branché dans `routes.ts`)

```ts
export const annuaireRouter = créerRouteurTRPC({
  coordinateurs: procédureProtégée.query(() =>
    getContainer("annuaire").resolve("listerCoordinateursAnnuaireQuery").run(),
  ),
  responsables: procédureProtégée.query(() =>
    getContainer("annuaire").resolve("listerResponsablesAnnuaireQuery").run(),
  ),
});
```

On ajoute la catégorie de log du routeur dans `categorieLogRouteurTRPC.ts`. `procédureProtégée` suffit : tout utilisateur connecté a accès.

### Client : page, navigation et flag

- `src/pages/annuaire.tsx` : dans `getServerSideProps`, lire les feature flags avec `recupererFeatureFlipsUseCase` (comme `fiche-territoriale.tsx`) et rediriger vers `/404` si `NEXT_PUBLIC_FF_ANNUAIRE` est coupé. Sans session, rediriger vers `/`.
- Déclarer `NEXT_PUBLIC_FF_ANNUAIRE` dans `src/config.ts` et `src/server/gestion-contenu/domain/VariableContenuDisponible.ts`, sur le modèle de `NEXT_PUBLIC_FF_RAPPORT_COORDINATEURS`.
- `NavigationPilote` : entrée « Annuaire », lien `/annuaire`, `accessible: useEnv("NEXT_PUBLIC_FF_ANNUAIRE")`.

### Client : composants (`src/client/components/PageAnnuaire/`)

```
PageAnnuaire.tsx               titre, NavigationTertiaire branchée sur ?onglet=, un tableau par panneau
TableauCoordinateurs.tsx       api.annuaire.coordinateurs.useQuery + TableauAdmin
useTableauCoordinateurs.tsx    colonnes, regroupement, urlState
TableauResponsables.tsx
useTableauResponsables.tsx
featuresAnnuaire.ts            featuresTableauAdmin + columnGroupingFeature + groupedRowModel (sans rowExpandingFeature)
lignesAnnuaire.ts              fonctions pures : { personnes, affectations } → une ligne par affectation
SelecteurGroupement.tsx        « Grouper par », boutons ButtonTag, repris de GroupesTableauEvaluation ; reçoit la liste des regroupements en paramètre
cellules/BlocPersonne.tsx      « Prénom Nom · fonction », puis lien mailto et BoutonCopierEmail
cellules/BoutonCopierEmail.tsx navigator.clipboard.writeText(email), puis toast("Adresse e-mail copiée")
cellules/CelluleTerritoire.tsx nom du territoire, région en dessous pour un département, badge de niveau
```

**Onglet** : paramètre `onglet` (`coordinateurs` | `responsables`, défaut `coordinateurs`), lu avec `useQueryState` et un analyseur limité à ces deux valeurs. Changer d'onglet efface les autres paramètres du tableau.

**Une ligne par affectation**

- Coordinateurs : `{ personne, territoire }`.
- Responsables : `{ personne, chantier, territoire }`.

**Colonnes et regroupement** (react-table v9)

- Colonnes de regroupement, dont la valeur (accessor) sert à la fois de clé de regroupement et de clé de tri :
  - coordinateurs : `territoire` (code du territoire), `coordinateur` (id de la personne) ;
  - responsables : `couple` (`chantierId|territoireCode`), `responsable` (id de la personne).
- Les colonnes de liste ont une `aggregatedCell` qui parcourt `row.subRows` :
  - « Coordinateurs et adresses e-mail », « Responsables et adresses e-mail » → `BlocPersonne` pour chaque personne ;
  - « Territoires » → `CelluleTerritoire` pour chaque territoire ;
  - « Chantiers et territoires » → nom du chantier, puis territoire et badge de niveau.
- `columnVisibility` est calculée à partir du regroupement actif, pour n'afficher que ses colonnes :

| Regroupement | Colonnes |
|---|---|
| Coordinateurs · territoire | Territoire · Niveau · Coordinateurs et adresses e-mail |
| Coordinateurs · coordinateur | Coordinateur et adresse e-mail · Territoires |
| Responsables · chantier et territoire | Chantier · Territoire · Niveau · Responsables et adresses e-mail |
| Responsables · responsable | Responsable et adresse e-mail · Chantiers et territoires |

- Sans `rowExpandingFeature`, `getRowModel().rows` ne contient que les lignes de groupe : chaque groupe s'affiche sur une seule ligne, sans accordéon. La pagination compte les groupes.
- `rowHeader` : la colonne de regroupement active.
- Tri : seule la colonne de regroupement se trie. Territoires : régions d'abord, puis départements, chacun par nom. Chantiers et personnes par nom. Le tri par défaut est la colonne de regroupement active, par ordre croissant : `sorting.default` est calculé à partir du regroupement.

**Filtres** (`urlState.columnFilters`, `filterFnOneOf`, appliqués à chaque affectation)

- `territoire` (paramètre `territoire`) : `multiselect` à deux groupes d'options, Régions et Départements. Une affectation passe si son code de territoire fait partie de la sélection.
- `chantier` (paramètre `chantier`, onglet Responsables uniquement) : `multiselect`. Une affectation passe si son chantier fait partie de la sélection.
- Recherche globale (`search`) : nom du chantier, nom du territoire, prénom et nom, e-mail, fonction.
- DataTable cumule les filtres de colonnes (ET) : on obtient chantier ET (territoires en OU).

**État d'URL** :

```ts
urlState: {
  grouping: { param: "groupement", default: "territoire", values: ["territoire", "coordinateur"] },
  sorting: { default: [{ id: regroupementActif, desc: false }] },
  pagination: { pageSize: 20 },
  globalFilter: true,
  columnFilters: [{ param: "territoire", columnId: "territoire" }],
  shallow: true,
  history: "replace",
}
```

Pour l'onglet Responsables : `grouping.default = "couple"`, `grouping.values = ["couple", "responsable"]`, et en plus `{ param: "chantier", columnId: "chantier" }`.

**États d'affichage**

- On réutilise `TableauAdmin` (Loader, Filters, Root avec les messages vide et « Aucun résultat », Header, Body, Pagination).
- Erreur réseau : même comportement que les pages admin (données absentes, message « Aucun coordinateur » / « Aucun responsable »).
- Mobile : option `tile` de DataTable, une carte par groupe qui reprend les blocs de la ligne, sous le point de rupture `lg`.

### Évolutions des composants partagés

1. **`shared/DataTable/urlState.ts`** : nouvelle option `grouping?: { param: string; default: string; values: string[] }`. `useUrlTableState` lit le paramètre avec un analyseur nuqs limité à `values` et ayant `default` pour valeur par défaut (`clearOnDefault`). Il renvoie `state.grouping = [valeur]` et `handlers.onGroupingChange`, qui écrit l'URL, remet la page à 1 et efface le tri (qui reprend alors sa valeur par défaut, celle du nouveau regroupement). `createDataTableHook` transmet ces valeurs comme les autres.
2. **`shared/DataTable/Body.tsx`** : dans `renderCellContent`, ne transformer la cellule groupée en bouton de dépliage que si `hasFeature(table, "rowExpandingFeature")`. Sinon, afficher `aggregatedCell ?? cell` comme les autres cellules. L'accueil, qui active le dépliage, ne change pas.
3. **`shared/DataTable/types.ts` et `Filters.tsx`** : `FilterDescriptor` de type `multiselect` accepte `groups?: { label: string; values: string[] }[]`. `ColumnFilter` les transmet en `optionGroups` à `MultiSelectFiltre` (par défaut, un seul groupe sans titre, comme aujourd'hui).
4. **`_commons/TableauAdmin/TableauAdmin.tsx`** : élargir le type de `table` de `TableAdmin<TRow>` à toute instance DataTable qui fournit `Filters` et `Pagination`. Aucun changement de comportement pour les 7 pages de référentiels.
5. **`_commons/NavigationTertiaire`** : prop `children` facultative. Si elle est fournie, le contenu est affiché dans un `Tabs.Content` pour l'onglet actif, ce qui relie l'onglet à son panneau (`role="tabpanel"`, `aria-controls`). Sans `children`, le rendu actuel ne change pas (`PageAdminChantierEdition`, `AlbertPanel`).

## Accessibilité

- Lien `mailto:` puis bouton de copie, chaque adresse avec son propre bouton. `aria-label` : « Copier l'adresse e-mail de {prénom} {nom} », focus visible.
- Le message « Adresse e-mail copiée » passe par `toast()` de sonner (`<Toaster />` est monté dans `_app.tsx`), qui l'annonce aux lecteurs d'écran.
- Onglets radix reliés à leurs panneaux grâce à `NavigationTertiaire` avec `children`.
- `rowHeader` sur la colonne de regroupement. `LiveRegion` de DataTable annonce le nombre de résultats et le tri.

## Tests

Tests d'intégration serveur uniquement (`pnpm test:server:integration`), avec les fixtures `chantierIdentite`, `chantierTerritoire` et `utilisateur`.

`ListerCoordinateursAnnuaireQuery` :
- renvoie un territoire avec plusieurs coordinateurs, et une personne avec plusieurs territoires ;
- exclut un territoire sans coordinateur ;
- ne renvoie qu'une fois un territoire présent sur plusieurs chantiers ;
- ignore un identifiant qui ne correspond à aucun utilisateur ;
- renvoie la région parente d'un département.

`ListerResponsablesAnnuaireQuery` :
- renvoie un couple avec plusieurs responsables, et une personne sur plusieurs couples ;
- exclut un couple sans responsable ;
- exclut un chantier qui n'est pas au statut `PUBLIE` ;
- pour une personne responsable sur un chantier publié et un chantier non publié, ne renvoie que l'affectation sur le chantier publié ;
- n'inclut pas dans `personnes` une personne responsable uniquement sur des chantiers non publiés ;
- inclut un couple non applicable (`est_applicable = false`) qui a un responsable ;
- ignore un identifiant qui ne correspond à aucun utilisateur ;
- calcule le libellé du service avec `getServiceLibelle`.

## Suites possibles (hors périmètre)

- Faire utiliser la nouvelle option `urlState.grouping` à l'accueil (`groupeParMinistere`) et au regroupement de PILOTE Éval.
