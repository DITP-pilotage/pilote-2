# Objectifs dérivés par indicateur

Date : 2026-05-27
Statut : à implémenter

## Contexte métier

Les valeurs d'avancement des indicateurs peuvent être agrégées depuis des individus enfants vers des individus parents (cf. [séries de valeurs dérivées](indicateur-derives.md)). Les **objectifs** (`ObjectifIndicateurIndividu`) suivent la même logique : un responsable régional ne saisit pas forcément un objectif global — il est **dérivé** des objectifs que ses enfants (départements, etc.) ont chacun déclaré.

## Comportement attendu

### Statut feuille / agrégé

Identique aux valeurs d'avancement. C'est la `fonctionAgregation` portée par le lien `IndicateurReferentiel` du référentiel de l'individu qui détermine son statut :

- `NONE` → **feuille** : l'individu lit ses objectifs saisis directement.
- `SUM` / `AVG` → **agrégé** : l'objectif est calculé à partir des enfants directs (récursivement). Les objectifs saisis directement sur un individu agrégé sont ignorés.

### Bucketisation

Les objectifs sont regroupés par **bucket temporel** selon un paramètre `dateTrunc` (défaut : `'year'`). Si plusieurs objectifs d'un même individu tombent dans le même bucket, on retient la `dateCible` **la plus récente** du bucket.

### Règle d'agrégation — strict avec carry-forward

Pour chaque bucket présent chez au moins un enfant :

1. Pour chaque enfant, porter son dernier objectif connu ≤ bucket courant (**carry-forward**).
2. Si **tous** les enfants ont une valeur portée → `agreger()` → émettre un objectif dérivé.
3. Si **un seul** enfant n'a encore aucune valeur portée → bucket ignoré (pas d'objectif pour ce parent sur ce bucket).

La règle est **stricte** : un enfant sans historique d'objectif bloque tous les buckets du parent tant qu'il n'en a pas saisi au moins un.

### Fonction d'agrégation

La même fonction `agreger()` que pour les valeurs (`SUM` ou `AVG` selon `IndicateurReferentiel`). Mémoïsation par individu identique.

## Modèle de données

Aucun changement de schéma. On réutilise la table `objectif_indicateur_individu` existante. Les objectifs dérivés sont **recalculés à la lecture**, pas stockés.

## Contrat API

### Paramètre `dateTrunc` ajouté à la query

```
GET /indicateurs/{id}/objectifs?individus=...&dateTrunc=year
```

`dateTrunc` : `'day' | 'week' | 'month' | 'quarter' | 'year'` — optionnel, défaut `'year'`.

### Champ `type` ajouté au modèle de réponse

```ts
type ObjectifIndicateurIndividuApiModel = {
  indicateur: string
  individu:   string
  dateCible:  string     // valeur du bucket (date tronquée)
  valeurCible: number
  type: 'saisie' | 'derivee'
}
```

Pas de `contributions[]` ni de `couverture` exposés (contrairement aux valeurs dérivées).

## Cas limites

| Cas | Comportement |
|-----|-------------|
| `fonctionAgregation = NONE` | Individu traité comme feuille, lit ses objectifs directs |
| Parent avec saisie directe + enfants agrégés | Saisie directe ignorée, objectif toujours dérivé |
| Enfant sans aucun objectif | Bloque tous les buckets du parent (strict) |
| Premier objectif d'un enfant postérieur à celui d'un autre | Parent sans objectif dérivé avant le premier bucket du retardataire |
| Deux objectifs enfant dans le même bucket | On retient la `dateCible` la plus récente |
| Individu demandé sans enfants en base | Traité comme feuille |

## Hors scope (v1)

- Interdire l'écriture directe sur un parent agrégé (endpoints PUT/DELETE inchangés).
- Filtres `dateDebut` / `dateFin` sur les objectifs retournés.
- Exposer `contributions[]` et `couverture` sur les objectifs dérivés.

## Architecture interne

### Parallèle avec `resolveSerieIndividu`

L'implémentation suit exactement le même patron que les valeurs dérivées :

```
loadCibles()
  → loadSousArbre()           ← réutilisé tel quel
  → loadFonctionsAgregation() ← réutilisé tel quel
  → loadObjectifsBucketises() ← nouveau
  → resolveObjectifIndividu() ← nouveau (mémoïsé, carry-forward strict)
```

### `ResolveObjectifContext`

```ts
type ResolveObjectifContext = {
  enfantsParParent:                ReadonlyMap<string, ReadonlyArray<IndividuRef>>
  fonctionAgregationParReferentiel: ReadonlyMap<string, FonctionAgregation>
  objectifBucketParIndividu:       ReadonlyMap<string, ReadonlyMap<string, Decimal>>
  referentielParIndividu:          ReadonlyMap<string, string>
}
```

`objectifBucketParIndividu` : `individuId → (bucket → valeurCible)` — une seule valeur par bucket après déduplication.

### `resolveObjectifIndividu(individuId, ctx, cache)`

- **Feuille / NONE** → retourne `ctx.objectifBucketParIndividu.get(individuId)` (type `'saisie'`).
- **Agrégé** :
  - Résoudre récursivement chaque enfant (mémoïsé).
  - Union des buckets présents chez au moins un enfant, triés ASC.
  - Pour chaque bucket :
    - Carry-forward : pour chaque enfant, prendre sa valeur la plus récente ≤ bucket.
    - Si tous les enfants ont une valeur → `agreger()` → émettre (type `'derivee'`).
    - Sinon → ignorer ce bucket.
