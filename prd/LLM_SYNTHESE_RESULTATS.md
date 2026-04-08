# Synthèse des Résultats - Calcul du Taux d'Avancement et Répartition Territoriale

## 1. Comment le TA (Taux d'Avancement) est-il calculé sur un Jalon ?

Le jalon est utilisé pour filtrer les données d'avancement depuis la table `chantier_territoire_jalon`. La page d'accueil manipule en fait **deux jalons** : celui explicitement sélectionné par l'utilisateur (`jalon`) et celui calculé par défaut à partir de la date courante (`jalonParDefaut`). Les deux sont ensuite requêtés et exposés côte à côte.

### Dans `src/pages/accueil/chantier/[territoireCode]/index.tsx`

**Lignes 50-54** : Le `jalonParDefaut` est calculé en fonction de la date actuelle et de la date de bascule configurée ; le `jalon` actif est celui fourni dans l'URL, sinon retombe sur le `jalonParDefaut` :
```typescript
const jalonParDefaut = getAnneeDateDeBascule(
  new Date(),
  configuration().dateBasculeAffichageValeursAnneePrecedente,
);
const jalon = searchParams.jalon ?? jalonParDefaut;
```

**Lignes 145-158** : Les deux jalons sont transmis au use case `recupererChantiersAccessiblesEnLectureUseCaseV2` :
```typescript
const chantiers = await getContainer("chantiers")
  .resolve("recupererChantiersAccessiblesEnLectureUseCaseV2")
  .run(
    session.habilitations,
    session.profil,
    territoireCode,
    mailleChantier || "departementale",
    ministères,
    mapAxes,
    filtres,
    sorting,
    jalon,
    jalonParDefaut,
  );
```

### Dans `PrismaChantierRepository.ts` (lignes 1363-1375)

La jointure sur `chantier_territoire_jalon` filtre désormais sur **les deux jalons** (`jalon` sélectionné + `jalonParDefaut`) via un `in` :
```typescript
chantier_territoire_jalon: {
  select: {
    taux_avancement: true,
    date_taux_avancement: true,
    ecart: true,
    jalon: true,
  },
  where: {
    jalon: {
      in: jalons,
    },
  },
},
```

### Dans `ChantierAccueilContratV2.ts` (lignes 136-166)

Le présentateur retrouve les lignes `chantier_territoire_jalon` correspondant à chacun des deux jalons et expose **trois** taux d'avancement distincts par territoire :
```typescript
const chantierTerritoireJalonSelectionne =
  chantierRow?.chantier_territoire_jalon.find(
    (chantier_jalon) => chantier_jalon.jalon === jalonSelectionne,
  );
const chantierTerritoireJalonParDefaut =
  chantierRow?.chantier_territoire_jalon.find(
    (chantier_jalon) => chantier_jalon.jalon === jalonParDefaut,
  );
donnéesTerritoires[t.code] = {
  // ...
  avancement: {
    annuel: verifyValeurIsNotNullOrUndefined(
      chantierTerritoireJalonSelectionne?.taux_avancement,
    ),
    jalonParDefaut: verifyValeurIsNotNullOrUndefined(
      chantierTerritoireJalonParDefaut?.taux_avancement,
    ),
    global: verifyValeurIsNotNullOrUndefined(
      chantierRow?.taux_avancement_mandat,
    ),
  },
  // ...
};
```

Les trois valeurs exposées sont donc :
- **`annuel`** : TA du jalon explicitement sélectionné par l'utilisateur
- **`jalonParDefaut`** : TA du jalon par défaut (utilisé par les alertes écart, TA non calculé, etc.)
- **`global`** : TA global pour l'ensemble du mandat (`taux_avancement_mandat`, hors jalon)

---

## 2. Comment la répartition territoriale est-elle calculée ?

La répartition territoriale fait aujourd'hui intervenir **deux chaînes de calcul indépendantes** qui alimentent des champs distincts passés au composant `PageChantiers` :

1. `RécupérerStatistiquesAvancementChantiersUseCase` → calcule `médiane`, `minimum`, `maximum` pour la maille sélectionnée.
2. `AgregerAvancementsChantiersUseCase` + `AgregateurListeChantiersParTerritoire` → calcule la `moyenneTerritoire` et la liste `avancementsGlobauxTerritoriauxMoyens`.

Contrairement à la version précédente, la moyenne n'est **plus recalculée ni réinjectée** dans `avancementsAgrégés` : ce contrat n'expose désormais que médiane / minimum / maximum.

### Étape 1 : `RécupérerStatistiquesAvancementChantiersUseCase`

**Fichiers** :
- `src/server/chantiers/usecases/RécupérerStatistiquesAvancementChantiersUseCase.ts`
- `src/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersQuery.ts`

Le use case délègue à `GetStatistiquesAvancementChantiersQuery`, qui interroge directement la table `chantier_territoire_jalon` (et non plus `chantier_territoire` comme dans le code legacy) :

```typescript
const listeMoyenneParTerritoire =
  await prisma.chantier_territoire_jalon.groupBy({
    by: ["territoire_code"],
    _avg: {
      taux_avancement: true,
    },
    where: {
      id: {
        in: chantiersLecture,
      },
      jalon: params.jalon,
      maille: CODES_MAILLES[params.maille],
      NOT: {
        taux_avancement: {
          equals: null,
        },
      },
    },
    orderBy: {
      _avg: {
        taux_avancement: "asc",
      },
    },
  });

return {
  médiane: calculerMediane(
    listeMoyenneParTerritoire.map(
      (moyenneParTerritoire) => moyenneParTerritoire._avg.taux_avancement,
    ),
  ),
  minimum: verifyValeurIsNotNullOrUndefined(
    listeMoyenneParTerritoire.at(0)?._avg.taux_avancement,
  ),
  maximum: verifyValeurIsNotNullOrUndefined(
    listeMoyenneParTerritoire.at(-1)?._avg.taux_avancement,
  ),
};
```

Points notables :
- Le calcul est désormais **jalon-aware** : il agrège le `taux_avancement` de la table de jointure pour le `jalon` demandé, alors que le code legacy moyennait le `taux_avancement_mandat` (qui est globalement indépendant du jalon).
- La maille est déduite depuis `mailleQuery` (issu de l'URL) côté `index.tsx` (ligne 221).
- Le résultat est présenté via `presenterEnAvancementsStatistiquesAccueilContrat`, qui n'expose que `médiane | minimum | maximum` — **plus de champ `moyenne`** dans ce contrat.

### Étape 2 : `AgregerAvancementsChantiersUseCase` + `AgregateurListeChantiersParTerritoire`

**Fichiers** :
- `src/server/chantiers/usecases/AgregerAvancementsChantiersUseCase.ts`
- `src/server/infrastructure/accès_données/chantier/ChantierSQLRepository.ts` (lignes 237-282, `recupererDonneesAvancementChantiers`)
- `src/client/utils/chantier/agrégateurListeChantiers/agregateur.ts`

**Processus** :

1. Le repository `recupererDonneesAvancementChantiers` récupère, pour chaque chantier et chaque territoire, le couple (`taux_avancement_mandat` → `global`, `chantier_territoire_jalon.taux_avancement` pour le `jalon` demandé → `annuel`) ainsi que le flag `est_applicable`.
2. `AgregateurListeChantiersParTerritoire.agreger()` :
   - Répartit les données brutes par maille / territoire en ne conservant que les chantiers `estApplicable`.
   - Pour chaque territoire et chaque maille, calcule via `valeurMinimum`, `valeurMaximum`, `calculerMoyenne`, `calculerMediane` les statistiques `global` (moyenne / médiane / min / max) et la moyenne `annuel`.

```typescript
this.agregat[maille].territoires[
  territoireCode
].repartition.avancements.annuel.moyenne = calculerMoyenne(
  avancements.annuel,
);
```

### Utilisation des résultats dans `index.tsx` (lignes 227-245)

```typescript
const { agregat: donneesTerritoiresAgregees } = await getContainer("legacy")
  .resolve("agregerAvancementsChantiersUseCase")
  .run(
    chantiersAvecAlertes.map((chantier) => chantier.id),
    jalon,
  );

const moyenneTerritoire =
  donneesTerritoiresAgregees[mailleChantier].territoires[territoireCode]
    .repartition.avancements.annuel.moyenne;
const avancementsGlobauxTerritoriauxMoyens = objectEntries({
  ...donneesTerritoiresAgregees.regionale.territoires,
  ...donneesTerritoiresAgregees.departementale.territoires,
}).map(([territoireCodeDonnee, territoire]) => ({
  valeur: territoire.repartition.avancements.global.moyenne,
  valeurAnnuelle: territoire.repartition.avancements.annuel.moyenne,
  territoireCode: territoireCodeDonnee as string,
  estApplicable: true,
}));
```

Deux valeurs sont donc dérivées de l'agrégat et passées à `PageChantiers` :
- **`moyenneTerritoire`** : moyenne annuelle des avancements des chantiers applicables pour le territoire courant (utilisée pour positionner le territoire dans les répartitions).
- **`avancementsGlobauxTerritoriauxMoyens`** : liste `{ territoireCode, valeur (global), valeurAnnuelle (annuel) }` pour tous les territoires départementaux et régionaux — sert à dessiner la carte / la distribution.

### Résultat Final

- `avancementsAgrégés` (issu de l'étape 1) porte la **distribution** (`médiane`, `minimum`, `maximum`) des taux d'avancement pour le jalon sélectionné, à la maille sélectionnée.
- `moyenneTerritoire` et `avancementsGlobauxTerritoriauxMoyens` (issus de l'étape 2) portent les **moyennes par territoire** recalculées en TypeScript à partir des données brutes.

Les deux chaînes restent **indépendantes** : l'agrégateur n'écrase plus les moyennes du contrat `avancementsAgrégés` comme c'était le cas auparavant.

---

## Références des Fichiers

- `src/pages/accueil/chantier/[territoireCode]/index.tsx` — Page d'accueil, orchestration serveur des deux jalons et des deux chaînes de calcul.
- `src/server/chantiers/infrastructure/adapters/PrismaChantierRepository.ts` — Repository Prisma, jointure `chantier_territoire_jalon` filtrée sur la liste `jalons`.
- `src/server/chantiers/app/contrats/ChantierAccueilContratV2.ts` — Présentateur qui expose `avancement.annuel` / `avancement.jalonParDefaut` / `avancement.global` par territoire.
- `src/server/chantiers/app/contrats/AvancementsStatistiquesAccueilContrat.ts` — Contrat exposé pour la répartition (`médiane` / `minimum` / `maximum` uniquement).
- `src/server/chantiers/usecases/RécupérerStatistiquesAvancementChantiersUseCase.ts` — Use case de statistiques (étape 1).
- `src/server/chantiers/infrastructure/queries/GetStatistiquesAvancementChantiersQuery.ts` — Requête Prisma `groupBy` sur `chantier_territoire_jalon` filtrée par `jalon`.
- `src/server/chantiers/usecases/AgregerAvancementsChantiersUseCase.ts` — Use case d'agrégation des avancements par territoire (étape 2).
- `src/server/infrastructure/accès_données/chantier/ChantierSQLRepository.ts` — Implémentation `recupererDonneesAvancementChantiers` (chargement des données brutes alimentant l'agrégateur).
- `src/client/utils/chantier/agrégateurListeChantiers/agregateur.ts` — `AgregateurListeChantiersParTerritoire` : calcule `moyenne`, `médiane`, `minimum`, `maximum` par territoire et par maille.
