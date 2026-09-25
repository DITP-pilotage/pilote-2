# Page « Mes indicateurs à mettre à jour » — design

Date : 2026-09-24
Maquette : https://claude.ai/artifact/16Ft2eyBCiRSerL5XerqWk

## Contexte

Le cron `pages/api/admin/cron/rapports-pva.ts` envoie chaque semaine aux profils `EQUIPE_DIR_PROJET` et `SECRETARIAT_GENERAL` un mail récapitulant, par chantier, les propositions de valeur en cours, les indicateurs non à jour et les indicateurs à paramétrer (`CreerLesRapportsPropositionsUseCase`). Le format mail ne donne que la liste des indicateurs et leurs mailles : l'utilisateur ne sait pas quels territoires sont en retard, ni depuis quand.

## Objectif

Offrir une page PILOTE où un directeur de projet, le secrétariat général ou un administrateur DITP voit, pour les chantiers qu'il peut lire, le détail territoire par territoire des indicateurs non à jour, ainsi que les indicateurs dont le taux d'avancement ne peut pas être calculé.

## Périmètre

Inclus :
- Onglet « Non à jour » : indicateurs groupés par chantier, détail dépliable par territoire.
- Onglet « À paramétrer » : indicateurs sans valeur initiale ou sans cible pour l'année du jalon.
- Recherche, filtre chantier, filtre maille, tri par retard.
- Version responsive (mobile) et état vide.
- Liens : « Voir le chantier », « Importer des valeurs » (`/chantier/{id}/indicateurs`), responsable des données en `mailto:`.

Exclus :
- Propositions de valeur d'avancement.
- Export CSV.
- Relance par mail du responsable des données (aucune commande côté serveur).
- Vue spécifique pour le secrétariat général (même page que la direction de projet pour l'instant).

## Accès

- Profils autorisés : `EQUIPE_DIR_PROJET`, `SECRETARIAT_GENERAL`, `DITP_ADMIN`.
- Feature flag : `NEXT_PUBLIC_FF_PAGE_INDICATEURS_NON_A_JOUR` (défaut `false`), déclaré dans `config.ts` et `VariableContenuDisponible`.
- Chantiers visibles : `habilitations.lecture.chantiers` de l'utilisateur (vérifier lors de l'implémentation que les périmètres y sont bien dépliés en chantiers), restreints aux chantiers et indicateurs `PUBLIE`.

## Règles métier

- Indicateur-territoire non à jour : `est_applicable = true` et `est_a_jour` à `false` ou `null` (même règle que `recupererIndicateursNonAJourParChantierId`).
- Retard (jours) = `-prochaine_date_maj_jours`. `prochaine_date_maj_jours` vaut `prochaine_date_maj - CURRENT_DATE` (dbt, `get_date_pro_maj_indic.sql`), il est donc négatif quand l'indicateur est en retard. Retard nul (`prochaine_date_maj_jours` null) : affiché « — », trié en dernier.
- Retard d'un indicateur = retard maximum parmi ses territoires non à jour.
- Seuils d'affichage : < 21 j (jaune), 21 à 59 j (orange), ≥ 60 j (rouge). Constantes côté client.
- Indicateur à paramétrer : `est_applicable = true` et (`valeur_initiale` null ou jalon de l'année avec `valeur_cible` null), jalon = `getAnneeDateDeBascule(new Date(), configuration().dateBasculeAffichageValeursAnneePrecedente)` (même règle que `recupererIndicateursAParametrerParChantierId`).

## Architecture serveur

Nouveau module `server/suivi-indicateurs/` suivant le pattern CQRS léger (`module.ts` + `queries/`), comme `metadataPerimetre`.

### `ListerIndicateursNonAJourQuery.run(chantierIds: string[])`

Deux `groupBy` Prisma sur `indicateur_territoire` (chantier et indicateur `PUBLIE`, `est_applicable = true`, `chantier_id IN chantierIds`) :
1. par `id` : nombre de territoires applicables ;
2. par `id` et `maille`, avec `est_a_jour` false/null : nombre de territoires en retard, `min(prochaine_date_maj_jours)`, `min(date_valeur_actuelle_mandat)`, `min(prochaine_date_maj)` ; les lignes d'un même indicateur sont ensuite fusionnées (somme des comptes, minimum des dates, liste des mailles).

Complétés par `indicateur_identite` (nom, periodicite, delai_disponibilite, responsables_donnees_mails) et `chantier_identite` (nom). L'assemblage est une fonction pure testable unitairement.

Retour :

```ts
type IndicateursAMettreAJour = {
  nonAJour: {
    chantierId: string;
    chantierNom: string;
    indicateurId: string;
    nom: string;
    periodicite: string | null;
    delaiDisponibilite: number | null;
    mailles: Maille[];
    nbTerritoiresEnRetard: number;
    nbTerritoiresApplicables: number;
    retardMaxJours: number | null;
    dateDerniereValeurPlusAncienne: string | null;
    dateMajAttenduePlusAncienne: string | null;
    responsablesDonneesMails: string[];
  }[];
  aParametrer: {
    chantierId: string;
    chantierNom: string;
    indicateurId: string;
    nom: string;
    manques: ("VALEUR_INITIALE" | "VALEUR_CIBLE")[];
    nbTerritoires: number;
  }[];
};
```

### `ListerTerritoiresNonAJourQuery.run(indicateurId: string, chantierIds: string[])`

Retourne `{ code, nom, maille, dateDerniereValeur, dateMajAttendue, retardJours }[]` pour les territoires non à jour de l'indicateur, triés par retard décroissant (retard null en dernier). Si l'indicateur n'appartient pas à un chantier de `chantierIds`, retourne `[]`.

### Router tRPC `indicateursNonAJour`

- `lister` : `procédureProtégée.query`.
- `listerTerritoires({ indicateurId: z.string() })`.

Chaque route : vérification du feature flag, `habilitationService.recupererHabilitations(session)`, `verifierAutorisationLectureIndicateursNonAJour()` (FORBIDDEN sinon), puis appel de la query avec `habilitations.lecture.chantiers`. Ajout de la catégorie de log dans `categorieLogRouteurTRPC.ts`.

### Habilitation

Dans `gestion-utilisateur/domain/habilitation/Habilitation.ts` :
- `PROFIL_AUTORISE_A_LIRE_INDICATEURS_NON_A_JOUR = new Set([EQUIPE_DIR_PROJET, SECRETARIAT_GENERAL, DITP_ADMIN])` ;
- `estAutoriseAAccederAuxIndicateursNonAJour()` et `verifierAutorisationLectureIndicateursNonAJour()`.

## Architecture client

### Page

`pages/indicateurs-a-mettre-a-jour.tsx` : `getServerSideProps` (session, habilitation, feature flag ; sinon redirection vers `/`), rend `PageIndicateursAMettreAJour`. Entrée « Mes indicateurs à mettre à jour » dans `NavigationPilote`, accessible selon habilitation et flag.

### Composants — `client/components/PageIndicateursAMettreAJour/`

- `PageIndicateursAMettreAJour.tsx` : bandeau (fil d'Ariane, titre, texte), onglets « Non à jour » / « À paramétrer » avec compteurs, pilotés par `nuqs` (`?onglet=`), `Suspense` autour de `api.indicateursNonAJour.lister.useSuspenseQuery()`.
- `useTableauIndicateursNonAJour.tsx` : instance react-table **v9** headless (`useTable` + `tableFeatures`, comme `useTableauChantiers` après la migration #2432).
  - Features : `columnFilteringFeature`, `globalFilteringFeature`, `rowSortingFeature`, `columnGroupingFeature`, `rowAggregationFeature`, `rowExpandingFeature`, avec les slots `filteredRowModel`, `groupedRowModel`, `sortedRowModel`. Pas de slot `expandedRowModel` : `getRowModel()` renvoie alors directement les lignes de groupe triées (une par chantier), leurs indicateurs dans `subRows`, et l'état `expanded` sert uniquement au dépliage du détail d'un indicateur.
  - Colonnes : `chantier` (groupée, `filterFn_equalsString`), `nom`, `mailles` (`filterFn_arrIncludes`), `retard` (`aggregationFn_max`, `sortFn_basic`, `sortUndefined: "last"`).
  - Tri par défaut `retard` décroissant ; `globalFilterFn` sur nom et id d'indicateur.
  - Rendu entièrement custom (pas `_commons/Tableau`).
- `FiltresIndicateurs.tsx` : `BarreDeRecherche`, sélecteur de chantier (`<select className="fr-select">` natif, options calculées depuis les données), `shared/SegmentedControl` pour la maille (Toutes / Nationale / Régionale / Départementale).
- `CarteChantier.tsx` : ligne de groupe — nom, id, `Badge` « n indicateurs non à jour », lien « Voir le chantier » (`/chantier/{id}/NAT-FR`).
- `LigneIndicateur.tsx` : grille desktop / carte mobile, pastilles de maille, `shared/Progress` (territoires en retard / applicables), dates, `BadgeRetard`, bouton chevron (`row.toggleExpanded()`, `aria-expanded`, `aria-label`).
- `BadgeRetard.tsx` : pastille teintée selon les seuils.
- `DetailTerritoires.tsx` : monté seulement une fois déplié ; `api.indicateursNonAJour.listerTerritoires.useQuery({ indicateurId })`, `Loader` pendant le chargement, message local en cas d'erreur ; colonne latérale avec responsables des données (`mailto:`), délai de disponibilité, lien « Importer des valeurs » (`/chantier/{id}/indicateurs`).
- `TableauAParametrer.tsx` : liste simple (sans react-table), pastilles « Valeur initiale » / « Cible {jalon} », lien vers `/chantier/{id}/indicateurs`.
- État vide : `_commons/PageVide` si adapté, sinon bloc local « Tous vos indicateurs sont à jour ».

### Responsive

Sous le breakpoint `md`, `LigneIndicateur` et `DetailTerritoires` passent en cartes empilées via classes Tailwind ; les filtres de maille deviennent des pastilles défilantes.

## Gestion des erreurs

- Utilisateur non autorisé ou flag désactivé : redirection côté page, FORBIDDEN côté router.
- Indicateur hors périmètre dans `listerTerritoires` : `[]`.
- Échec de `lister` : error boundary de la page ; échec de `listerTerritoires` : message dans la zone dépliée uniquement.

## Tests

Conventions : `expect(result).toEqual([{...}])`, commentaires limités à given / when / then. Tests unitaires et d'intégration lancés par Claude (ciblés sur les fichiers concernés) ; les E2E sont proposés à l'utilisateur en fin de fonctionnalité. Pas de tests front pour cette fonctionnalité.

- Intégration `server/suivi-indicateurs/__tests__/queries/ListerIndicateursNonAJourQuery.integration.test.ts` : agrégation (compte, retard max, dates min, mailles), exclusions (non applicable, à jour, chantier ou indicateur non publié), filtre `chantierIds`, cas « à paramétrer » (valeur initiale nulle, cible du jalon nulle).
- Intégration `ListerTerritoiresNonAJourQuery.integration.test.ts` : tri par retard, retard null en dernier, indicateur hors périmètre → `[]`.
- Unitaire de la fonction d'agrégation.
- Unitaire `Habilitation.estAutoriseAAccederAuxIndicateursNonAJour` pour chaque profil.
