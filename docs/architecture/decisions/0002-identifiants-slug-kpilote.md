# 2. Identifiants publics slug pour KPilote

Date : 2026-09-10

## Statut

Accepté. Remplace la numérotation `IND-<n>` introduite par la première itération de la PR #2243.

## Contexte

Le ticket **PIL-1688 « Mise en place des foreign_ids »** demande que chaque entité de KPilote porte
un identifiant externe lisible, proposable par le client à la création, et dérivé du titre quand il
ne l'est pas. La spécification du ticket tient en trois gestes : slugifier la valeur proposée,
vérifier son unicité, suffixer d'un numéro incrémental en cas de collision — « Bilan de prévention »
existant déjà, l'identifiant généré devient `bilan-de-prevention-2`.

Cinq expressions régulières distinctes cohabitaient jusqu'ici dans `kpilote-shared/publicIds.ts` :
`/^IND-\d+$/` pour l'indicateur, `/^COL-\d+$/` pour la collection, `/^REF-[A-Z0-9-]{1,16}$/` pour le
référentiel, `/^[A-Z][A-Z0-9-]{0,19}$/` pour l'individu, `/^WID-[A-Z0-9-]{1,16}$/` pour le widget.
Elles servent à trois endroits : validation des paramètres de route de `kpilote-api`, validation des
paramètres d'URL de `kpilote-webapp`, validation des réponses côté clients.

Deux contraintes ont pesé sur l'arbitrage :

1. **La colonne `public_id` est déjà l'identifiant externe.** `id` est un uuid v7 interne, `public_id`
   une colonne `text` unique. Rien dans le schéma ne suppose un préfixe ni une numérotation : ce qui
   change, c'est ce qu'on y écrit, pas la structure.
2. **`pilote-ppg` pousse ses propres identifiants.** Le cron `sync-mb-valeurs` synchronise ses
   indicateurs vers `kpilote-api` par `PUT /indicateurs/{id}` avec les identifiants de PPG, en
   comptant sur la création à la volée. La première itération de la PR #2243 avait rendu ce `PUT`
   update-only : toute première synchronisation d'un indicateur absent serait partie en 404.

## Décision

### 1. Un seul schéma de validation, `slugSchema`

Les cinq expressions régulières deviennent une, définie dans `kpilote-shared/src/slug.ts` : lettres,
chiffres et tirets simples, ni en tête ni en queue, 100 caractères au plus. Les schémas nommés par
entité subsistent dans `publicIds.ts` — ils gardent aux paramètres de route un type et une
description propres — mais ils ne sont plus que des alias documentés du même `slugSchema`.

La **casse reste libre**. C'est ce qui rend le backfill inutile : `IND-005`, `REF-DEPT`, `DEPT-84`,
`WID-CARTE-DEPT` sont des slugs parfaitement valides sous la nouvelle règle. Aucun identifiant
existant ne devient invalide, aucune URL ne casse, aucune table d'alias n'est nécessaire.

### 2. Deux façons d'obtenir un identifiant, selon qui le décide

C'est la seule règle à retenir, et elle explique tout le reste.

| Chemin                   | Qui décide                        | Comportement                                    |
| ------------------------ | --------------------------------- | ----------------------------------------------- |
| `POST /indicateurs`      | le serveur, sauf si `slug` fourni | `slugify(nom)` puis premier suffixe libre       |
| `PUT /indicateurs/{id}`  | le client, toujours               | upsert : correspondance exacte, création sinon  |
| `POST /collections`      | le serveur                        | `slugify(nom)` puis premier suffixe libre       |
| `PUT /collections/{id}`  | le client, toujours               | upsert — inchangé                               |
| `PUT /referentiels/{id}` | le client, toujours               | upsert — inchangé, seule la validation se relâche |

Le `PUT /indicateurs/{id}` **redevient un upsert**. C'est la conséquence directe de la contrainte
`pilote-ppg` : sans lui, la synchronisation exigerait une route admin de création sous identifiant
imposé et un mapping persisté côté PPG, pour un besoin que l'upsert couvre déjà. Aucun fichier de
`pilote-ppg` n'est modifié.

Le doute soulevé en revue sur la séparation `POST` / `PUT` se dissout : ce n'est pas un compromis
inventé pour l'occasion, Collection pratique déjà les deux — un `POST` dont le serveur résout
l'identifiant, un `PUT` qui accepte celui du client.

### 3. La résolution des collisions est sérialisée, pas retentée

`resolveSlug` (`kpilote-api/src/framework/persistence/resolveSlug.ts`) prend un verrou consultatif
porté par la transaction (`pg_advisory_xact_lock`), par entité, avant de lire les slugs voisins. Deux
créations concurrentes retiendraient sinon le même suffixe ; un retry sur violation d'unicité ne
suffirait pas, puisque sous Postgres l'erreur avorte la transaction courante.

La comparaison est insensible à la casse — `REF-DEPT` et `ref-dept` ne cohabitent jamais. Le premier
arrivé garde le slug nu, les suivants sont suffixés à partir de `-2`. On repart du plus grand suffixe
pris, sans combler les trous : réattribuer l'identifiant d'une entité supprimée ferait revivre les
liens partagés qui le portent.

Le slug proposé par le client est respecté tel quel, casse comprise ; seule la collision le suffixe.
Un nom dont aucun caractère ne peut composer un slug (« ??? !!! ») part en `400 VALIDATION_ERROR`
plutôt que de produire un identifiant vide.

### 4. Trois lots indépendants

- **Socle** — `slugSchema`, `slugify()`, `resolveSlug()` et leurs tests. Aucun comportement
  d'écriture ne change : livrable autonome et sans risque.
- **Indicateur** — `POST` avec `slug` optionnel, retour du `PUT` upsert, champ « Identifiant »
  optionnel côté administration.
- **Collection, Référentiel, Individu** — bascule de `nextPublicId()` vers `resolveSlug()`,
  disparition du `TODO PIL-1688` laissé dans `createCollection`.

## Périmètre retenu

Ce que cette bascule ne fait **pas**, et pourquoi :

- **Aucun renommage `publicId` → `slug`.** Un diff mécanique de plus de deux mille occurrences, sans
  effet sur le comportement, masquerait le vrai changement en revue.
- **Aucun backfill.** Les identifiants existants restent tels quels et redeviennent des slugs
  valides. Un backfill reste possible plus tard, sans changement de schéma.
- **Aucune table d'alias, aucune redirection.** Conséquence de l'immuabilité du slug : un identifiant
  attribué ne change plus jamais.
- **Aucune résolution polymorphe** du type « si ça ressemble à `IND-\d+`, chercher par `publicId`,
  sinon par slug ». Elle n'a d'intérêt que si les deux colonnes coexistent, ce que cette décision
  écarte.
- **Aucun `slug` optionnel sur `POST /collections`.** La collection dispose déjà d'un `PUT` upsert
  pour imposer un identifiant ; ajouter un second chemin dupliquerait la règle sans besoin exprimé.

## Conséquences

**Ce qui s'améliore.** Les identifiants deviennent lisibles dans les URL, dans la palette de commande
et dans les échanges avec les intégrateurs. Une seule règle de validation remplace cinq, et le
générateur d'identifiants est mutualisé entre indicateur et collection au lieu d'être dupliqué.

**Ce qu'on accepte en contrepartie.** La validation ne distingue plus un identifiant d'indicateur
d'un identifiant de référentiel. Une inversion d'argument entre deux appels ne sera plus rattrapée
par le schéma, mais par un `404`. Les paramètres de route restent typés par entité, et les tests
d'intégration couvrent déjà ces cas.

**Ce qui ne bouge pas, alors qu'on pourrait le croire.** La palette de commande filtre sur le nom et
sur l'identifiant, quelle que soit sa forme — un slug parlant la rend simplement plus utile. Le
stockage `kpilote:recently-visited` mémorise la chaîne d'identifiant telle quelle : les entrées déjà
enregistrées restent résolvables. Les favoris et les liens partagés survivent, conséquence directe de
l'immuabilité du slug.

**Côté contrat d'API.** Les descriptions OpenAPI annonçaient « identifiant public (format
`IND-XXX`) ». Elles sont publiées dans le contrat et ont suivi : sans cela, la documentation mentirait
aux intégrateurs dès la première création par slug.

## Références

- [PIL-1688 — Mise en place des foreign_ids](https://data-ditp.atlassian.net/browse/PIL-1688)
- PR #2243 — `feat(mb)` : génération serveur du publicId indicateur, recadrée par cette décision
