# Valeurs dérivées par agrégation hiérarchique — design

Date : 2026-05-19
Statut : accepté

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

### D5. Modélisation de la hiérarchie (option A3)

On garde `Relation` tel quel (graphe individu ↔ individu) et on ajoute
l'**invariant métier** : *tous les enfants directs d'un même parent
appartiennent au même référentiel*. Cet invariant est vérifié à l'upsert
d'une `Relation` (pas via une contrainte schéma).

Rationale : pas de duplication avec `Referentiel`, hiérarchie reste portée
par les individus, mais on s'interdit les configurations incohérentes
(ex. un département parent d'une commune et d'un autre département).

### D6. Calcul à la volée (option B1)

Pas de stockage des valeurs dérivées. Chaque appel à l'endpoint déclenche le
calcul à partir des valeurs saisies et des valeurs dérivées des enfants
directs (récursion en mémoire). Pas de table de cache, pas de matérialisation
Prisma.

Rationale : cohérence garantie sans logique d'invalidation. Volumétrie
réévaluable plus tard via B2 ou B3 si nécessaire.

### D7. Agrégateur SUM hardcodé pour le MVP

Pas de configuration d'agrégateur dans le schéma : **SUM est l'agrégateur
unique du MVP**. Une stratégie configurable (champ sur `Indicateur`, ou
autre) sera introduite plus tard quand le besoin produit sera explicite.

### D8. Couverture partielle exposée

Si un parent a `n` enfants directs et que `k < n` d'entre eux ont une valeur
(saisie ou dérivable), on **calcule quand même** et on expose la couverture
(`k / n`) dans la réponse. Le consommateur (UI) décide quoi en faire (alerte,
masquer, etc.). Aucune imputation automatique (pas de 0 par défaut).

### D9. Saisie autorisée sur un individu non-feuille

Saisir une valeur sur un individu qui a des enfants reste **autorisé**. La
valeur saisie et la valeur dérivée coexistent (cf. D1) — c'est au
consommateur d'arbitrer l'affichage.

### D10. Pas de détection de cycles dans `Relation`

On fait confiance aux données. La création de cycles dans `Relation` n'est
pas empêchée par le code, et la traversée récursive ne détecte pas les
cycles. Si un cycle existe en BD, le comportement est non défini (boucle ou
crash).

Rationale : le risque est jugé faible (peu de mutations sur `Relation`, pas
d'API publique d'édition aujourd'hui). À reconsidérer si une API d'édition de
`Relation` est ajoutée.

## Conséquences

- **Pas de migration de schéma requise** : `Relation` existe déjà, pas de
  nouveau champ
- L'upsert de `Relation` (quand il sera exposé) devra valider l'invariant D5
- Une nouvelle famille de queries doit être introduite pour traverser la
  hiérarchie (enfants directs d'un individu) et résoudre les valeurs par
  niveau
- Le functional core gagne un opérateur d'agrégation `sum` (les autres
  agrégateurs viendront plus tard)
- La traversée récursive n'a pas de garde anti-cycle ; si on observe un
  problème en prod, on ajoutera la détection à ce moment-là

## Prochaines étapes

1. Spécifier précisément le schéma de réponse de
   `GET /indicateurs/:id/individus/:individuId/valeur-derivee`
2. Implémenter la traversée hiérarchique (query Prisma + functional core)
3. Implémenter l'agrégateur SUM en functional core
4. Ajouter la route + tests
