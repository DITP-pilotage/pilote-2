# Valeurs dérivées par agrégation hiérarchique — design

Date : 2026-05-19
Statut : en cours de spécification

## Contexte

Actuellement, le modèle `ValeurAvancement` permet de saisir une valeur sur un
couple `(indicateur, individu, date)` où `individu` appartient à un
`Referentiel`. Les individus possèdent déjà une hiérarchie via le modèle
`Relation` (parent ↔ enfant), mais celle-ci n'est pas exploitée côté métier.

Le besoin produit est de pouvoir **calculer la valeur d'un individu parent**
comme agrégation des valeurs de ses enfants pour un même indicateur à une date
donnée. Exemples :

- Valeur d'une région = somme des valeurs de ses départements
- Valeur de la France = somme des valeurs de ses régions
- Cas non-somme : moyenne de France = moyenne des moyennes des régions
  (≠ moyenne des départements directement)

## État de l'existant

- **Hiérarchie individu/individu** matérialisée via `Relation`, non exploitée
  côté métier aujourd'hui
- **Pas de hiérarchie entre référentiels** (référentiels plats)
- **Calculs purs déjà extraits** dans `valeurAvancement/` (`computeMediane`,
  `computeMin/Max`, `computeVariation`, `computeEcartMediane`)
- **Synthèse par individu** (PIL-1456, `listSyntheseIndividus`) : voisin
  fonctionnel le plus proche, sert de template
- Routes en place : `GET/PUT/DELETE /indicateurs/:id/valeurs`,
  `.../individus`, `.../valeurs-remarquables`, `.../synthese-individus`

## Décisions

### D1. Coexistence saisie ↔ dérivée (option D3)

Une valeur saisie et une valeur dérivée **peuvent coexister** sur le même
individu pour le même `(indicateur, date)`. Elles sont exposées distinctement
par l'API. Aucun override automatique :

- La valeur saisie reste celle de référence pour le système (source de vérité
  humaine, ex. chiffre officiel INSEE)
- La valeur dérivée est calculée à partir des enfants directs et exposée
  comme valeur calculée distincte

Cela laisse le consommateur (UI, audit) décider de l'affichage selon le
contexte.

### D2. Agrégation niveau par niveau (option E révisée)

La valeur dérivée d'un parent est calculée en appliquant l'agrégateur sur les
**valeurs de ses enfants directs uniquement** (saisies ou dérivées), pas sur
l'ensemble des descendants à plat.

Rationale : la propriété "somme à plat = somme par niveau" n'est vraie que
pour les agrégateurs associatifs et exhaustifs (SUM, MIN, MAX). Pour la
moyenne ou la médiane, descendre à plat donne un résultat sémantiquement
différent. Pour garantir la cohérence multi-agrégateurs et préparer les
besoins futurs (ex. moyenne nationale = moyenne des moyennes régionales),
on traite chaque niveau indépendamment :

```
valeur_dérivée(parent) = agrégateur( valeur(enfant_i) pour enfant_i ∈ enfants_directs(parent) )
```

où `valeur(enfant_i)` est :
- la valeur saisie si elle existe
- sinon la valeur dérivée calculée récursivement
- sinon absente (et l'enfant est ignoré ou produit un résultat partiel —
  voir Questions ouvertes)

### D3. Exposition des niveaux

L'API doit permettre de consulter la valeur dérivée **à n'importe quel niveau
de la hiérarchie** et exposer la décomposition (les enfants directs ayant
contribué). Ceci permet :

- Drill-down dans l'UI (région → départements contributeurs)
- Audit / traçabilité du calcul
- Détection de couvertures partielles (n enfants sur m ont une valeur)

### D4. Endpoint API dédié (option F1)

On introduit un **nouvel endpoint dédié** pour les valeurs dérivées, sans
modifier les endpoints existants :

```
GET /indicateurs/:id/individus/:individuId/valeur-derivee?date=...
```

Forme provisoire de la réponse (à affiner) :

```json
{
  "indicateurPublicId": "...",
  "individuPublicId": "...",
  "date": "2025-12",
  "agregateur": "SUM",
  "valeurDerivee": "1234.56",
  "contributions": [
    { "individuPublicId": "...", "valeur": "100.00", "source": "saisie" },
    { "individuPublicId": "...", "valeur": "234.56", "source": "derivee" }
  ],
  "couverture": { "nEnfantsAvecValeur": 12, "nEnfantsTotal": 13 }
}
```

Ce choix permet d'itérer sans toucher aux endpoints existants. Une intégration
plus transparente (calcul auto si pas de valeur saisie sur l'endpoint GET
classique) pourra être envisagée plus tard.

## Conséquences

- **Pas de migration de schéma requise** pour le MVP : `Relation` existe déjà
- Une nouvelle famille de queries doit être introduite pour traverser la
  hiérarchie (enfants directs d'un individu) et résoudre les valeurs par
  niveau
- Le functional core gagne un opérateur d'agrégation paramétrable (au moins
  SUM dans un premier temps)
- La résolution récursive doit être bornée (profondeur max, ou détection de
  cycles) car `Relation` est un graphe sans contrainte d'acyclicité

## Questions ouvertes

### Q1. Modélisation de la hiérarchie

`Relation` est un graphe libre : aucun invariant n'empêche un cycle, ni un
parent d'avoir des enfants dans plusieurs référentiels. Trois options :

- **A1.** Statu quo (graphe libre) — flexible mais aucune garantie structurelle
- **A2.** Ajouter `parentReferentielId` sur `Referentiel` — duplique l'info
  avec `Relation`, hiérarchie stricte
- **A3.** Garder `Relation` + invariant métier "tous les enfants d'un parent
  appartiennent au même référentiel" — vérifié à l'upsert

Penchant initial : **A3**, à confirmer.

### Q2. Stockage des valeurs dérivées

- **B1.** Calcul à la volée — cohérent, simple, coût lecture
- **B2.** Stockage dans `valeur_avancement` avec champ `source` — lecture
  uniforme mais invalidation en cascade complexe
- **B3.** Table dédiée `valeur_derivee` — cache séparé

Penchant initial : **B1** pour le MVP, réévaluation si volumétrie devient un
problème.

### Q3. Configuration de l'agrégateur

Où attacher la stratégie d'agrégation ?

- Sur `Indicateur` (un agrégateur par indicateur)
- Sur la combinaison `Indicateur × Referentiel` (différent par niveau, rare)
- Paramètre de query (le client choisit) — flexible mais peu sémantique
- Hardcodé SUM pour le MVP, à étendre

Penchant initial : SUM hardcodé pour MVP, champ sur `Indicateur` ensuite.

### Q4. Couverture partielle

Si un parent a 13 enfants mais que seuls 12 ont une valeur (saisie ou
dérivée) à la date demandée, que fait-on ?

- Calculer quand même et exposer la couverture (12/13) — recommandé
- Refuser de calculer (404 / 422)
- Calculer en imputant 0 aux manquants

Penchant initial : calculer + exposer couverture, le consommateur décide.

### Q5. Saisie sur un individu non-feuille

D3 dit que saisie et dérivée coexistent. Mais doit-on permettre la saisie sur
un individu qui a des enfants ? Probablement oui (cas INSEE : valeur officielle
nationale ≠ somme régionale). À confirmer.

### Q6. Détection de cycles dans `Relation`

Le modèle actuel n'empêche pas un cycle (A parent de B, B parent de A). Le
calcul récursif doit soit :

- Faire confiance aux données (et boucler/exploser si cycle)
- Détecter les cycles à la lecture
- Empêcher la création de cycles à l'écriture sur `Relation`

À trancher.

## Prochaines étapes

1. Trancher Q1 à Q6
2. Spécifier précisément le schéma de réponse de
   `GET /indicateurs/:id/individus/:individuId/valeur-derivee`
3. Implémenter la traversée hiérarchique (query Prisma + functional core)
4. Implémenter l'agrégateur SUM en functional core
5. Ajouter la route + tests
