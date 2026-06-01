# Taux de progression — Specs et plan d'implémentation

## Contexte

Un indicateur peut être associé à des objectifs temporels par individu (`ObjectifIndicateurIndividu`). Cette feature expose un taux de progression calculé comme :

```
tauxProgression = min(100, (valeur / valeurCible) × 100)
```

où `valeurCible` est celle de l'objectif applicable à la date de chaque valeur d'avancement.

**V1 — périmètre restreint :**
- Indicateurs de type saisie uniquement (pas d'agrégation)
- Pas de troncature de date — on travaille sur les dates brutes des saisies
- Pas d'héritage d'objectif depuis un parent hiérarchique

---

## Règle métier — Objectif applicable

À la date D d'une valeur d'avancement sur un individu I :

> L'objectif applicable est le **premier objectif de I dont `dateCible` est strictement supérieure à D**.
> Si D est supérieure ou égale à toutes les `dateCible` connues → **dernier objectif** (le plus grand `dateCible`).
> Si I n'a aucun objectif → ce point est **exclu** de la réponse.

### Exemple

| Objectif | valeurCible | dateCible  |
|----------|-------------|------------|
| 1        | 10          | 2024-01-01 |
| 2        | 50          | 2025-01-01 |
| 3        | 60          | 2025-06-01 |
| 4        | 100         | 2026-02-01 |

| Date de la valeur       | Objectif applicable | valeurCible |
|-------------------------|---------------------|-------------|
| D < 2024-01-01          | Objectif 1          | 10          |
| 2024-01-01 ≤ D < 2025-01-01 | Objectif 2     | 50          |
| 2025-01-01 ≤ D < 2025-06-01 | Objectif 3     | 60          |
| 2025-06-01 ≤ D < 2026-02-01 | Objectif 4     | 100         |
| D ≥ 2026-02-01          | Objectif 4          | 100         |

### Cas limites

| Situation | Comportement |
|-----------|-------------|
| `valeurCible = 0` | `tauxProgression = null` |
| `valeur > valeurCible` | Plafonné à `100` |
| Individu sans aucun objectif | Exclu des `items` |

---

## API

### Endpoint

```
GET /indicateurs/:id/taux-progression
```

### Query params

| Param      | Type         | Requis | Description |
|------------|--------------|--------|-------------|
| `individus` | CSV publicId | Oui   | 1..N individus (même convention que `/valeurs`) |
| `dateDebut` | `YYYY-MM-DD` | Non  | Filtre inclusif sur `date` |
| `dateFin`   | `YYYY-MM-DD` | Non  | Filtre inclusif sur `date` |

Pas de `dateTrunc` — les dates brutes des saisies sont utilisées.

### Response

**`TauxProgressionListApiModel`** :

```typescript
{
  items: Array<{
    indicateur: string       // publicId de l'indicateur
    individu: string         // publicId de l'individu
    date: string             // date brute de la saisie (YYYY-MM-DD)
    valeur: number           // valeur d'avancement
    valeurCible: number      // valeurCible de l'objectif applicable
    dateCible: string        // dateCible de l'objectif applicable
    tauxProgression: number | null  // min(100, valeur/valeurCible×100), null si valeurCible=0
  }>
}
```

`valeurCible` et `dateCible` sont exposés pour permettre au client de tracer la ligne d'objectif sur un graphique futur et de savoir quand l'objectif change.

**Tri** : par `individu` (publicId asc) puis par `date` asc.

---

## Algorithme de résolution (backend)

L'implémentation suit le pattern établi : **chargement bulk en amont, résolution pure sans I/O**.

```
1. Charger en bulk toutes les ValeurAvancement pour les individus demandés
2. Charger en bulk tous les ObjectifIndicateurIndividu pour ces mêmes individus
3. Grouper les objectifs par individu, triés par dateCible ASC
4. Pour chaque (individu, valeur) :
   a. Si l'individu n'a aucun objectif → exclure
   b. Trouver l'objectif applicable :
      - Premier objectif avec dateCible > valeur.date (strictement)
      - Si aucun (D ≥ tous les dateCible) → dernier objectif
   c. Si valeurCible = 0 → tauxProgression = null
      Sinon → tauxProgression = Math.min(100, (valeur.valeur / valeurCible) × 100)
5. Appliquer les filtres dateDebut / dateFin sur valeur.date
6. Trier par individu publicId asc, puis date asc
```

### Note d'évolution (V2)

En V2, il faudra gérer :
- Les **valeurs dérivées** : résoudre d'abord la série agrégée (`resolveSerieIndividu`), puis calculer le taux sur chaque point résultant
- Les **objectifs dérivés** : utiliser `resolveObjectifIndividu` pour obtenir la `valeurCible` applicable à chaque bucket
- La **troncature** : comparer les dates post-`dateTrunc` plutôt que les dates brutes

L'architecture bulk + résolution pure facilitera cette extension sans changer le contrat API.

---

## Plan d'implémentation

### Étape 1 — Schema partagé (`mb-shared`)

**Fichier** : `packages/mb-shared/src/tauxProgression.ts` (nouveau)

- Définir `tauxProgressionPointApiModelSchema` (un point de la série)
- Définir `tauxProgressionListApiModelSchema` (`{ items: [...] }`)
- Définir `listTauxProgressionQuerySchema` (`individus`, `dateDebut`, `dateFin`)
- Exporter les types inférés

### Étape 2 — Query de chargement (`mb-api`)

**Fichier** : `apps/mb-api/src/tauxProgression/queries/listTauxProgressionForIndicateur.ts` (nouveau)

- Charger les `ValeurAvancement` en bulk (réutiliser ou s'inspirer de `getValeursForIndicateur`)
- Charger les `ObjectifIndicateurIndividu` en bulk (réutiliser ou s'inspirer de `listObjectifsForIndicateur`)

### Étape 3 — Résolution pure (`mb-api`)

**Fichier** : `apps/mb-api/src/tauxProgression/resolveTauxProgression.ts` (nouveau)

- Fonction pure `resolveTauxProgression(valeurs, objectifsParIndividu)` → `TauxProgressionPoint[]`
- Implémenter la recherche d'objectif applicable (`findObjectifApplicable`)
- Implémenter le calcul du taux avec cap à 100 et gestion de la division par zéro
- Couvrir par des tests unitaires

### Étape 4 — Route (`mb-api`)

**Fichier** : `apps/mb-api/src/tauxProgression/routes.ts` (nouveau)

- `GET /indicateurs/{id}/taux-progression`
- Validation Zod des query params via `listTauxProgressionQuerySchema`
- Vérification des permissions sur l'indicateur (réutiliser `requireIndicateurReadPermission`)
- Appel query + résolution + retour JSON

**Fichier** : `apps/mb-api/src/app.ts` — enregistrer la nouvelle route

### Étape 5 — Frontend : query (`mb-webapp`)

**Fichier** : `apps/mb-webapp/src/api/indicateurs.ts`

- Ajouter `fetchTauxProgressionForIndicateur(indicateurId, params)`

**Fichier** : `apps/mb-webapp/src/queries/indicateurs.ts`

- Ajouter `indicateurTauxProgressionQueryOptions(indicateurId, individuId)`
- Ajouter au `prefetchIndicateurValeursForIndividu`

### Étape 6 — Frontend : affichage (`mb-webapp`)

**Fichier** : `apps/mb-webapp/src/components/indicateurs/IndicateurStatsPanel.tsx`

- Consommer `indicateurTauxProgressionQueryOptions`
- Afficher le **dernier taux de progression** dans une `StatCard`
- Format : `"87 %"` (entier arrondi, suffixe %)
- Si aucun point retourné (individu sans objectif) → ne pas afficher la StatCard

---

## Hors scope V1

- Indicateurs dérivés (agrégation)
- `dateTrunc` / buckets
- Héritage d'objectif depuis un parent hiérarchique
- Graphique historique du taux (le query sera prêt côté frontend, l'UI graphique sera ajoutée en V2)
