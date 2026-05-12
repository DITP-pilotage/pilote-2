# Comparaisons hiérarchiques d'un indicateur

Design d'API pour comparer la variation d'un individu (ex. un département) aux moyennes/médianes de ses ascendants (région, national, etc.).

## Contexte

Sur la page d'un indicateur, on affiche aujourd'hui la variation de l'individu sélectionné (ex. Aveyron : +2.9%). On veut afficher en plus la comparaison avec les moyennes et médianes des **référentiels parents** :

- **Aveyron** (département) : individu sélectionné
- **Occitanie** (région) : ascendant de profondeur 1 → moyenne/médiane sur le référentiel "Régions"
- **France** (national) : ascendant de profondeur 2 → moyenne/médiane sur le référentiel "Pays"

Le modèle Prisma (`Individu`, `Relation`, `Referentiel`, `ReferentielIndividu`) permet une hiérarchie générique (DAG) : un individu peut avoir plusieurs parents, et appartenir à plusieurs référentiels.

## Options explorées

### A. Endpoint dédié, hiérarchie implicite côté serveur, nommage "parent/grandParent"

```
GET /indicateurs/:id/comparaisons?territoireId=aveyron
→ { parent: {...}, grandParent: {...} }
```

❌ Rejeté : sémantique "parent/grandParent" rigide, ne passe pas à l'échelle si on ajoute un niveau intermédiaire (EPCI) ou un autre type de comparaison.

### B. Endpoint générique, le client liste les territoires à comparer

```
GET /indicateurs/:id/aggregats?territoireIds=occitanie,france&stats=moyenne,mediane
```

❌ Rejeté : le serveur connaît déjà la hiérarchie via le modèle, c'est lui qui doit la résoudre. Forcer le client à pré-calculer les ascendants déplace de la complexité métier au mauvais endroit.

### C. Hybride : ascendants par défaut + territoires custom optionnels

❌ Pas retenu pour l'instant (over-engineering pour le besoin actuel).

## Option retenue : ascendants à plat indexés par profondeur

```
GET /indicateurs/:id/comparaisons?individuId=aveyron&date=...
→ {
    individu: { id, nom: "Aveyron", valeur, variation: 2.9 },
    ascendants: [
      {
        individu: { id, nom: "Occitanie" },
        profondeur: 1,
        referentiel: { id, nom: "Régions" },
        moyenneVariation: 3.2,
        medianeVariation: 3.1,
        ecartMoyenne: -0.3,
        ecartMediane: -0.2
      },
      {
        individu: { id, nom: "France" },
        profondeur: 2,
        referentiel: { id, nom: "Pays" },
        moyenneVariation: 2.5,
        medianeVariation: 2.4,
        ecartMoyenne: 0.4,
        ecartMediane: 0.5
      }
    ]
  }
```

### Algorithme côté serveur

Pour chaque ascendant trouvé en remontant les `Relation` (childId → parentId) depuis `individuId` :

1. Récupérer son `referentielId` via `ReferentielIndividu`
2. Lister tous les `individuId` de ce référentiel (incluant l'ascendant lui-même)
3. Pour chacun, calculer sa variation à la `date` demandée (`(valeur_n - valeur_n-1) / valeur_n-1`)
4. Agréger : moyenne et médiane de ces variations
5. Calculer l'écart entre la variation de l'individu initial et ces agrégats

### Sémantique validée

- ✅ **Un individu peut avoir plusieurs ascendants à la même profondeur** (DAG / multi-référentiels) → `ascendants` est un array plat, `profondeur` peut être dupliquée
- ✅ **L'ascendant lui-même fait partie du pool d'agrégation** (Occitanie est incluse dans le calcul de la "moyenne régionale")
- ✅ **Pas de plafond de profondeur hardcodé** → contrat stable si on ajoute un niveau (ex. EPCI entre département et région)
- ✅ **Pas de nommage "parent/grandParent"** → le front étiquette via `referentiel.nom` ou `profondeur`

## Question ouverte à trancher avec le PO

**Moyenne/médiane des variations individuelles, ou variation des valeurs agrégées ?**

Deux interprétations possibles pour "moyenne régionale = +3.2%" :

1. **Moyenne des variations** : calculer la variation de chaque région individuellement, puis en faire la moyenne.
   → `avg((valeur_n(région_i) - valeur_n-1(région_i)) / valeur_n-1(région_i))`

2. **Variation des moyennes** : sommer/moyenner les valeurs des régions à n et n-1, puis calculer la variation de ces moyennes.
   → `(avg(valeurs_n) - avg(valeurs_n-1)) / avg(valeurs_n-1)`

Les deux donnent des résultats différents (notamment si les régions ont des poids/tailles différents). Hypothèse de travail : **option 1 (moyenne des variations)**, mais à confirmer.

## Prochaines étapes (après validation PO)

- Schéma Zod de la response
- Use case + ports nécessaires :
  - `IndividuRepository.findAscendants(individuId)` — remontée récursive via `Relation`
  - `ValeurAvancementRepository.findByReferentielAndDates(referentielId, date, datePrecedente)` (nom à affiner)
- Tests d'intégration sur cas DAG (multiple ascendants même profondeur)
