# Synthèse des Résultats - Calcul du Taux d'Avancement et Répartition Territoriale

## 1. Comment le TA (Taux d'Avancement) est-il calculé sur un Jalon ?

Le jalon est utilisé pour filtrer les données d'avancement depuis la table `chantier_territoire_jalon`. Voici le flux complet :

### Dans `/pages/accueil/chantier/[territoireCode]/index.tsx`

**Lignes 54-59** : Le `jalon` est déterminé soit depuis les paramètres de requête, soit calculé en fonction de la date actuelle :
```typescript
const jalon =
  searchParams.jalon ??
  getAnneeDateDeBascule(
    new Date(),
    configuration().dateBasculeAffichageValeursAnneePrecedente,
  );
```

**Ligne 228** : Ce jalon est passé au use case `recupererChantiersAccessiblesEnLectureUseCaseV2`

### Dans `PrismaChantierRepository.ts` (lignes 1305-1313)

Le jalon filtre les données depuis la table de jointure :
```typescript
chantier_territoire_jalon: {
  select: {
    taux_avancement: true,
    date_taux_avancement: true,
  },
  where: {
    jalon,  // Filtre par l'année spécifique
  },
},
```

### Dans `ChantierAccueilContratV2.ts` (lignes 215-222)

Le présentateur extrait deux valeurs d'avancement :
- **`annuel`** : `chantier_territoire_jalon.at(0)?.taux_avancement` - le TA pour le jalon/année spécifique
- **`global`** : `taux_avancement_mandat` - le TA global pour l'ensemble du mandat

---

## 2. Comment la répartition territoriale est-elle calculée ?

La répartition territoriale (Maximum, Médiane, Minimum) est calculée en deux étapes distinctes.

### Étape 1 : `RécupérerStatistiquesAvancementChantiersUseCase`

**Fichier** : `ChantierSQLRepository.ts` (lignes 120-180)

**Processus** :
1. Regroupe les chantiers par `territoire_code` avec Prisma `groupBy`
2. Calcule la moyenne du `taux_avancement_mandat` par territoire
3. Calcule les statistiques globales à travers tous les territoires :
   - **minimum** : Premier élément (moyenne la plus basse)
   - **maximum** : Dernier élément (moyenne la plus haute)
   - **médiane** : Médiane des moyennes territoriales
   - **moyenne** : Moyenne des moyennes territoriales

```typescript
const listeMoyenneParTerritoire = await prisma.chantier_territoire.groupBy({
  by: ["territoire_code"],
  _avg: {
    taux_avancement_mandat: true,
  },
  where: {
    id: { in: chantiersLecture || [] },
    maille: CODES_MAILLES[maille],
    NOT: {
      taux_avancement_mandat: { equals: null },
    },
  },
  orderBy: {
    _avg: { taux_avancement_mandat: "asc" },
  },
});
```

### Étape 2 : `AgrégateurListeChantiersParTerritoire`

**Fichier** : `agrégateur.ts`

**Processus** :
1. Collecte les données brutes d'avancement de tous les chantiers pour chaque territoire
2. Recalcule les statistiques en utilisant les fonctions utilitaires :
   - `valeurMinimum()` pour le minimum
   - `valeurMaximum()` pour le maximum
   - `calculerMédiane()` pour la médiane
   - `calculerMoyenne()` pour la moyenne

3. **Important** : La moyenne calculée par cet agrégateur **remplace** celle de l'Étape 1

**Dans `index.tsx` (lignes 234-243)** :
```typescript
if (avancementsAgrégés) {
  avancementsAgrégés.global.moyenne =
    donnéesTerritoiresAgrégées[mailleChantier].territoires[
      territoireCode
    ].répartition.avancements.global.moyenne;
  avancementsAgrégés.annuel.moyenne =
    donnéesTerritoiresAgrégées[mailleChantier].territoires[
      territoireCode
    ].répartition.avancements.annuel.moyenne;
}
```

### Résultat Final

Les statistiques finales (Maximum, Médiane, Minimum) représentent **la distribution des taux d'avancement à travers tous les territoires applicables** pour la maille sélectionnée, montrant comment les territoires se comparent entre eux.

---

## Références des Fichiers

- `/src/pages/accueil/chantier/[territoireCode]/index.tsx` - Page d'accueil avec logique serveur
- `/src/server/chantiers/infrastructure/adapters/PrismaChantierRepository.ts` - Repository Prisma
- `/src/server/chantiers/app/contrats/ChantierAccueilContratV2.ts` - Présentateur de contrat
- `/src/server/usecase/chantier/RécupérerStatistiquesAvancementChantiersUseCase.ts` - Use case de statistiques
- `/src/client/utils/chantier/agrégateurListeChantiers/agrégateur.ts` - Agrégateur de données territoriales
- `/src/server/infrastructure/accès_données/chantier/ChantierSQLRepository.ts` - Repository SQL legacy
