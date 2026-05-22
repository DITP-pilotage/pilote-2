# Synthèse individus — extension aux valeurs dérivées

Date : 2026-05-22
Statut : accepté

## Contexte

`GET /indicateurs/:id/synthese-individus` calcule `variation` et `ecartMediane` par individu en
lisant uniquement les saisies directes (`ValeurAvancement`). Les individus agrégés (régions,
France…) n'ont pas de saisies directes exploitables : leurs valeurs sont calculées par dérivation
hiérarchique (`resolveSerieDerivee`, cf. `indicateur-derives.md`). Ce design étend la synthèse pour
supporter ces individus.

## Décisions

### D1. Mode par individu : saisie vs dérivée

Pour chaque individu demandé, on vérifie `IndicateurReferentiel(indicateurId, referentielId)
.fonctionAgregation` :

- `fonctionAgregation != NONE` → mode **dérivé** : série calculée via `resolveSerieIndividu`
- `fonctionAgregation = NONE` ou absence de lien → mode **saisie** : comportement actuel inchangé

Cohérent avec D6 de `indicateur-derives.md` (saisie ignorée sur indicateur agrégé).

### D2. Variation pour un individu agrégé

On appelle `resolveSerieIndividu(individuId, ctx, cache)` → série ASC complète avec
`dateTrunc='month'`. On prend les **2 derniers points** (les plus récents), on les passe en ordre
DESC à `computeVariation` (convention existante : `[recente, precedente]`).

Pas de filtre sur la couverture : un point à `1/18` contribue comme un point à `18/18`.

### D3. Médiane pour un référentiel agrégé

Pour chaque référentiel distinct parmi les individus demandés :

- `fonctionAgregation != NONE` → médiane calculée sur la **dernière valeur dérivée** de chaque
  individu de ce référentiel (tous, pas seulement les cibles)
- `fonctionAgregation = NONE` → médiane sur les dernières saisies (comportement actuel)

Individus sans aucune valeur dérivée (série vide) sont exclus de la médiane — même comportement
que le filtre existant `valeurs: { some: { indicateurId } }`.

### D4. Memoïsation partagée

Un unique `Map<individuId, PointInterne[]>` est instancié au niveau du use case et partagé entre :
- Le calcul des séries des individus demandés (D2)
- Le calcul des séries de tous les individus des référentiels agrégés (D3)

Si un individu intermédiaire est à la fois cible et membre du groupe de médiane, sa série n'est
calculée qu'une fois.

### D5. Chargement DB

Un seul appel `getValeursTronqueesPourIndividus` (`dateTrunc='month'`) pour toutes les saisies
feuilles nécessaires — descendants des cibles agrégées + descendants de tous les individus des
référentiels agrégés. Dédoublonnage des `individuIds` avant la requête.

### D6. Extraction des helpers partagés

`loadSousArbre`, `loadFonctionsAgregation` et `loadSaisiesTronquees` sont extraits de
`listValeursForIndicateur.ts` dans un module partagé `loadSerieContext.ts`. Les deux use cases
importent depuis ce module.

### D7. Output inchangé

Le schéma `SyntheseIndividusListApiModel` ne change pas. `variation` et `ecartMediane` restent
`number | null`. La source (saisie vs dérivée) n'est pas exposée dans la synthèse.

## Tests

### Nouveaux cas d'intégration

- Individu agrégé sans saisies directes → variation et ecartMediane calculées sur série dérivée
- Individu agrégé avec une seule valeur → variation = valeur, ecartMediane calculée
- Individu agrégé seul dans son référentiel → ecartMediane = 0
- Référentiel avec `fonctionAgregation != NONE` → médiane calculée sur valeurs dérivées de tous
  ses membres
- Référentiel avec `fonctionAgregation = NONE` → médiane sur saisies (comportement actuel conservé)
- Mix `individus=[FRANCE, DEPT-13]` — FRANCE en mode dérivé, DEPT-13 en mode saisie dans le même appel
- Individu agrégé sans aucune descendance avec saisie → variation null, ecartMediane null
