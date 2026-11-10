# Brief POC — l'individu devient une dimension comme une autre

Date : 2026-11-02
Destinataire : l'agent qui exécute le POC (lancé via `/goal`)
Commanditaire : Antoine

Ce document est **le contrat du POC**. Tant qu'une case de la section « Conditions de succès » n'est pas cochée avec une preuve, le POC n'est pas terminé.

---

## 1. Le problème

### Aujourd'hui

- Une observation est `(indicateur, individu, date) → valeur`.
  - C'est la clé unique de `valeur_avancement`.
  - Même chose pour `objectif_indicateur_individu` `(indicateur, individu, dateCible)` et pour les commentaires `indicateur_individu_commentaire` `(indicateur, individu)`.
- Un individu appartient à **un seul** référentiel.
- Le seul axe d'agrégation est la hiérarchie `Relation` (NAT → REG → DEPT). Elle est parcourue en largeur (BFS) par `loadSousArbre`, puis résolue par `resolveSerieIndividu` / `resolveObjectifIndividu`.
- La fonction d'agrégation (`SUM`/`AVG`/`NONE`) est portée par le couple `(indicateur, référentiel)`.
- Le mot « référentiel » mélange deux notions :
  - REF-NAT, REF-REG et REF-DEPT sont trois **niveaux** d'une même dimension « territoire » ;
  - le code les traite pourtant comme des dimensions distinctes.

### Le besoin

Les utilisateurs veulent observer la donnée selon des dimensions arbitraires et **croisées**. Exemples :

- fraude fiscale par type × territoire ;
- données par territoire découpées par opérateur.

### Le contournement actuel et ses limites

Aujourd'hui, on crée un indicateur par opérateur, puis on regroupe ces indicateurs dans une collection pour obtenir une vue par territoire.

1. Une collection n'agrège **pas les valeurs**. Elle calcule une **moyenne pondérée de taux de progression**, tronquée, en tout-ou-rien (`src/collection/resolveCollectionTauxProgression.ts`). On ne peut donc pas calculer « le total des fraudes du 84, tous opérateurs confondus ».
2. Ce contournement offre en revanche gratuitement un **cloisonnement en écriture par opérateur** : `WRITE_DATA` se donne indicateur par indicateur.

### La cible

L'individu devient une dimension comme une autre. La contrainte est que le **cas nominal reste simple** : un indicateur à une seule dimension territoire doit garder exactement la même UI, les mêmes URL et les mêmes contrats qu'aujourd'hui.

---

## 2. État des lieux (analyse d'impact déjà faite)

Les chemins sont relatifs à la racine du repo. Ce sont des **points de départ, pas une liste exhaustive** : relis le code avant de conclure.

### Base de données

- `apps/kpilote-api/prisma/schema.prisma`
  - `ValeurAvancement` (unique `valeur_avancement_unique`) ;
  - `ObjectifIndicateurIndividu` (unique `objectif_indicateur_individu_unique`) ;
  - `IndicateurIndividuCommentaire` ;
  - `IndicateurReferentiel` (PK `(indicateur, référentiel)` et `fonctionAgregation`) ;
  - `Relation` : N-N en base, mais le code impose un seul parent, et aucune contrainte n'impose « même dimension ».
- TypedSQL dans `apps/kpilote-api/prisma/sql/` :
  - `getValeursTronqueesPourIndividus.sql` et `getObjectifsTronquesPourIndividus.sql` : `DISTINCT ON (individu_id, bucket)` ;
  - `upsertValeursAvancementBatch.sql` : `ON CONFLICT (indicateur_id, individu_id, date)` ;
  - `getDernieresValeursPourIndividus.sql` : code mort.

### Cœur de calcul (API)

- `src/indicateur/queries/loadIndicateurIndividuContext.ts` : `loadSousArbre` (BFS sur `Relation`) et `loadFonctionsAgregation`.
- `src/indicateur/resolveAgregation.ts` : `getFonctionAgregationActive` et `agreger`.
- `src/valeurAvancement/resolveSerieIndividu.ts` : combineLatest **permissif**, report de la dernière valeur connue (carry-forward), `couverture`, mémoïsation indexée par `individuId`.
- `src/objectifIndicateurIndividu/resolveObjectifIndividu.ts` : dérivation **stricte**, un enfant sans valeur bloque le parent.
- `src/valeurAvancement/resolveTauxProgression.ts` et `queries/computeTauxProgressionPoints.ts` : un objectif est apparié à une valeur **du même individu**.
- `src/valeurAvancement/queries/` :
  - `listValeursRemarquablesForIndicateur` : médiane, min et max sur la population d'un référentiel ;
  - `listSyntheseIndividus` : écart à la médiane des pairs du même référentiel ;
  - `listIndividusWithValeurs` : casse en multi-dimension ;
  - `listDernieresValeursForIndividu` et `listTauxProgressionForIndividu` : routes `/individus/{id}/…`.
- `src/collection/queries/getCollectionTauxProgression.ts` et `computeCollectionContributions.ts` (logique dupliquée) : le calcul se fait pour un seul individu.

### Écriture et import

- `src/valeurAvancement/commands/*` : upsert, delete, batch. Erreurs `INDIVIDU_INCONNU` et `DUPLICATE_KEY`.
- `src/individu/permission.ts` (`resolveAuthorizedIndividu`).
- `src/valeurImport/` (Albert) :
  - le plan ne connaît qu'une `colonneIndividu` ;
  - la résolution se fait en un seul appel ;
  - `ItemNormalise {individu, date, valeur}`.
  - Conséquence : aujourd'hui, une colonne opérateur est ignorée en silence, ce qui produit des doublons.

### Commentaires et niveaux de confiance

- `src/commentaire/sujets.ts` : l'abstraction `SujetCommentaireConfig` permet d'ajouter un sujet.
- `src/indicateur/commands/creerIndicateurIndividuCommentaire.ts`.
- Routes `/indicateurs/{id}/individus/{individuId}/commentaires|brouillon|niveaux-confiance`.

### Permissions

Il n'existe que deux familles :

- `IndicateurPermission` (`READ`/`WRITE_DATA`/`WRITE_COMMENT`) ;
- `CollectionPermission`.

Il n'y a **aucune** permission par individu.

### Contrats partagés (`packages/kpilote-shared/src/`)

- `valeurAvancement.ts`, `objectifIndicateurIndividu.ts`, `tauxProgression.ts`, `collectionTauxProgression.ts` ;
- `commentaire.ts` (`individuId`), `valeurImport.ts`, `indicateur.ts` (`referentiels[]`), `individusCsv.ts` ;
- `relation.ts` : dit « au plus un parent », alors que `individu.ts` déclare `parents[]` ;
- `analytics/events.ts` : `*.individu.change`.

### Webapp (`apps/kpilote-webapp/src/`)

- Un seul état circule partout : `{individu, referentiel}`. Il apparaît dans :
  - les 4 `searchSchema` des routes `indicateurs/` et `collections/` ;
  - `DashboardSwitch`, les BackLinks, `IndicateurCard`, `CollectionCard` ;
  - `CarteFranceWidget` et la palette ⌘K.
- Il est résolu par `lib/individus/pair.ts` (`ensureIndividuReferentielPair`, `pickRoot`) et `lib/individus/hierarchy.ts`, qui ne garde que le premier parent.
- Les « batchers » et les clés React Query sont indexés par `individuId` : `queries/dernieresValeurs.ts`, `tauxProgression.ts`, `collectionTauxProgression.ts`, `niveauConfiance.ts`, `commentaires.ts`, `indicateurs.ts`.
- Fiche indicateur :
  - `IndicateurResultatsTab`, `IndicateurSynthesePanel` (comparaison sur le référentiel) ;
  - `IndicateurValeursChart` et `MonthlySeries` (une seule série) ;
  - `IndicateurWidgets` et `widgets/*` (carte = population du référentiel ; `joinKey` ignoré, `codeInsee` codé en dur).
- Import : `components/import-valeurs/*` (`COLONNES = ['individu','date','valeur']`).
- Réutilisables tels quels :
  - `IndividuSelect` (une instance par dimension) ;
  - les composants `commentaires/*`, agnostiques (seul le Provider change) ;
  - `packages/kpilote-ui`.

### Admin (`apps/kpilote-admin/src/`)

- `ReferentielForm`, la page `relations`, `AdminReferentiels` (fonction d'agrégation par référentiel).
- Allowlist `SAFE_PATH` du BFF : `src/server/api/router.ts`.

### Consommateur externe en production

`apps/pilote-ppg/src/server/mb-sync/` :

- pousse `PUT /indicateurs/{id}/valeurs:batch` avec `{individu: territoire_code, date, valeur}` ;
- configure `PUT /indicateurs/{id}` avec `referentiels: [{id: REF-NAT|REF-REG|REF-DEPT, fonctionAgregation}]`.

Ce contrat **ne doit pas casser**.

### Seed (`apps/kpilote-api/prisma/seed.ts` et `prisma/seedData/geo.ts`)

- Il est construit sur le produit cartésien individus × dates. `supprimerHorsJeu` ne fonctionne que sous cette hypothèse.
- Il n'existe aucune seconde dimension.

### Incohérences connues, à régler ou documenter au passage

- Un ou plusieurs parents dans `Relation`.
- La création d'un commentaire ne vérifie pas que l'individu est lié à l'indicateur.
- `listObjectifsForIndicateur` annonce un filtre qu'il n'applique pas.
- `loadSousArbre` est exécuté deux fois pour le taux de progression.
- Le contenu `contributions`/`couverture` est parsé côté webapp mais jamais affiché.

---

## 3. Démarche attendue

### 3.1 Hypothèses

Rédige **au moins 4 modèles réellement différents**. Pistes non limitatives :

- une entité `Cellule` (tuple canonique de coordonnées) référencée par les valeurs, les objectifs et les commentaires ;
- un hash canonique de coordonnées porté directement par `valeur_avancement` ;
- `Dimension` = famille de référentiels-niveaux, avec un membre « tous » par dimension ;
- un schéma en étoile / cube, avec agrégation calculée depuis les feuilles plutôt qu'en cascade ;
- garder `individu` comme axe principal et ajouter des « axes secondaires » ;
- toute autre idée que tu juges meilleure.

### 3.2 Questions à trancher pour chaque modèle

Chaque modèle doit répondre explicitement à ces questions :

1. **Identité d'une observation** : comment poser `UNIQUE` et `ON CONFLICT` ?
2. **Dimension, niveau, référentiel** : qu'est-ce qu'un indicateur déclare ?
3. **Coordonnée partielle / marginale** : que vaut « DEPT-84 » seul sur un indicateur territoire × opérateur ? Est-ce une saisie, une dérivée, ou c'est interdit ?
4. **Agrégation multi-axes** :
   - ordre de remontée ;
   - AVG dépendant du chemin ;
   - sémantique permissive (valeurs) contre stricte (objectifs) ;
   - fonction par dimension ou par niveau.
5. **Cube creux** : quelles cellules sont attendues ? Que vaut la couverture ?
6. **Tranches de comparaison** : sur quoi calculer la médiane, le min, le max, et sur quoi joindre la carte.
7. **Grain des objectifs et taux de progression** : objectif au grain territoire, valeurs au grain territoire × opérateur.
8. **Permissions** : comment retrouver le cloisonnement par opérateur.
9. **Rétrocompatibilité** : `individu` comme alias de la dimension principale, synchro pilote-ppg intacte.
10. **Volumétrie** et **complexité UI** du cas multi-dimension.

### 3.3 Challenge

- Fais attaquer chaque modèle par des **sous-agents adversariaux indépendants**. Donne-leur le code et le modèle, **pas tes conclusions**.
- Itère tant qu'un modèle n'a pas survécu.
- Scénarios de rupture minimum :
  - fraude fiscale type × territoire × date, avec agrégation territoriale ;
  - territoire × opérateur avec des opérateurs absents de certains territoires (cube creux) ;
  - indicateur en `AVG` sur deux dimensions ;
  - objectifs saisis au grain territoire, valeurs au grain territoire × opérateur ;
  - import Albert d'un fichier à 2 colonnes d'identité, en layout long et en layout pivot ;
  - collection mixte : indicateurs mono-dimension et multi-dimension ;
  - cloisonnement : un opérateur ne doit pouvoir écrire que ses propres valeurs ;
  - volumétrie : communes (~35k) × N membres ;
  - synchro pilote-ppg rejouée telle quelle.

### 3.4 Design doc

Écris `apps/kpilote-api/docs/architecture/dimensions-design.md` avec :

- le contexte ;
- les modèles étudiés ;
- la matrice de comparaison ;
- le journal du challenge (objections et réponses) ;
- la décision argumentée ;
- les modèles écartés et pourquoi ;
- ce qui reste hors scope ;
- les questions produit ouvertes.

### 3.5 Implémentation

Implémente le modèle retenu **de bout en bout** :

- migrations ;
- API ;
- `kpilote-shared` ;
- webapp ;
- admin si nécessaire ;
- import ;
- seed ;
- tests.

### 3.6 Conventions à respecter

Elles viennent de la mémoire projet d'Antoine :

- Exports et imports nommés uniquement, jamais de `default`.
- Les helpers prennent un objet de paramètres nommés.
- Les use cases (commands et queries) renvoient un `ResultAsync` (neverthrow), et les promesses externes sont enveloppées.
- Dans une route, schémas Zod, `createRoute` et handler vivent dans **un seul fichier**.
- La configuration liée aux entités définies par l'utilisateur (dimensions, mappings) vit **en base** : tables Prisma et seeds, jamais de registre TS codé en dur.
- L'API reste agnostique de l'UI : pas de champ du type `estParDefaut`. Les choix d'UX vivent dans la webapp.
- Pas de `db().$transaction([...])` imbriqué dans une transaction existante.
- Tests : `uuidv7`, valeurs codées en dur, fixtures `fixtures.<entity>(...)` variadiques avec upsert.
- Pour une permission non accordée dans l'UI, on cache l'élément (renvoyer `null`) plutôt que de le désactiver.
- Exports de module pour les dépendances inter-modules.
- Avant d'écrire du code framework transverse (helper générique, middleware), documente les options dans le design doc et choisis-en une de manière argumentée. Antoine n'est pas là pour valider en direct.

---

## 4. Environnement : ne rien casser du dev

- **Ne jamais toucher** aux conteneurs ni aux volumes existants :
  - `pilote_mb_postgres` (5434) et `pilote_mb_postgres_test` (5435) ;
  - `pilote_postgres` (7432), `pilote_postgres_test` (7433), `pilote_postgres_e2e` (7474) ;
  - et tous les autres.
- **Interdits** :
  - `prisma migrate reset` ;
  - `prisma migrate dev` sur une base existante ;
  - `docker compose down -v` sur un projet existant.
- Monte un **docker compose dédié**, avec le project name `kpilote-poc-dimensions`, des `container_name` et un volume propres :
  - une base POC sur le port **5444** ;
  - une base de test POC sur le port **5445**.
  - Le fichier compose vit dans le worktree.
- Fichiers `.env` :
  - copie-les depuis le checkout principal (`/Users/antoinechalifour/Projects/ditp/pilote-2/apps/kpilote-*/`) vers le worktree, en changeant `DATABASE_URL` pour 5444, et 5445 pour `.env.test` ;
  - ne commite jamais de `.env`.
- Applique les migrations avec `prisma migrate deploy`. La création de nouvelles migrations se fait contre la base POC uniquement.
- Les apps (API, webapp, admin) se lancent avec leurs scripts `dev` habituels, via portless, **sous leurs noms de dev habituels**. Elles remplacent les instances de dev. Ne spécifie pas de ports pour les apps.
- Git :
  - travaille dans le worktree courant ;
  - commits locaux autorisés ;
  - **pas de push, pas de PR, pas de modification de `dev`**.

---

## 5. Conditions de succès

Chaque case se coche **avec une preuve** dans le rapport final : sortie de commande, chemin de fichier ou capture d'écran.

### Conception

- [ ] `dimensions-design.md` existe et présente au moins 4 modèles réellement distincts.
- [ ] Chaque modèle répond explicitement aux 10 questions de §3.2.
- [ ] Une matrice de comparaison des modèles est présente.
- [ ] Le journal du challenge montre que des sous-agents indépendants ont attaqué les modèles sur **tous** les scénarios de §3.3, avec les objections et la réponse apportée à chacune.
- [ ] La décision est argumentée, les modèles écartés sont justifiés, les questions produit ouvertes sont listées.
- [ ] La sémantique d'agrégation multi-axes est définie sans ambiguïté : ordre, AVG, permissif/strict, cube creux, couverture.

### Environnement

- [ ] Le compose `kpilote-poc-dimensions` tourne avec les bases sur 5444 et 5445.
- [ ] Les conteneurs et volumes préexistants sont intacts : sortie de `docker ps -a` et `docker volume ls` avant/après.
- [ ] Toutes les migrations passent via `prisma migrate deploy` sur la base POC.
- [ ] `prisma generate`, TypedSQL compris, passe.
- [ ] Le seed est appliqué sur la base POC.

### Données de seed

- [ ] Le seed historique (mono-dimension territoire) est toujours présent et inchangé fonctionnellement.
- [ ] Un indicateur **territoire × opérateur** existe :
  - SUM ;
  - cube creux : opérateurs absents de certains territoires ;
  - objectifs au grain territoire ;
  - au moins 24 mois de valeurs.
- [ ] Un indicateur **fraude fiscale type × territoire** existe, avec au moins un cas piégeux (AVG, ou fonctions différentes selon la dimension).
- [ ] La migration de l'ancien contournement « collection d'opérateurs » vers une dimension est démontrée : un exemple seedé, et la comparaison des chiffres avant/après est expliquée.
- [ ] Les dimensions et leur configuration sont en base, pas dans le code.

### API

- [ ] Une valeur multi-dimension peut être saisie, modifiée et supprimée, à l'unité et en batch, avec des erreurs explicites :
  - coordonnée manquante ;
  - membre inconnu ;
  - dimension non déclarée ;
  - doublon.
- [ ] Les séries, dérivées comprises, sont lisibles sur une cellule complète **et** sur une marginale (ex. DEPT-84 tous opérateurs), avec contributions et couverture cohérentes.
- [ ] Les objectifs et le taux de progression fonctionnent en multi-dimension, y compris quand l'objectif est à un grain plus grossier que les valeurs.
- [ ] Médiane, min et max sont calculés sur une tranche explicite, où une dimension varie et les autres sont fixées.
- [ ] Les commentaires et niveaux de confiance fonctionnent sur la granularité choisie dans le design.
- [ ] Le taux de progression de collection fonctionne pour une collection mixte (mono et multi-dimension).
- [ ] Le cloisonnement d'écriture par membre de dimension (ex. opérateur) est implémenté, ou bien explicitement reporté avec justification dans le design doc.
- [ ] La normalisation Albert produit des items multi-coordonnées pour un fichier à 2 colonnes d'identité, en long et en pivot. Le test peut mocker Albert.
- [ ] La spec OpenAPI (`/openapi.json`) décrit les nouveaux contrats, et les descriptions de route sont à jour.

### Rétrocompatibilité

- [ ] `PUT /indicateurs/{id}/valeurs:batch` avec `{items: [{individu, date, valeur}]}` fonctionne à l'identique sur un indicateur mono-dimension. Un test rejoue le payload de `apps/pilote-ppg/src/server/mb-sync`.
- [ ] `PUT /indicateurs/{id}` avec `referentiels: [{id, fonctionAgregation}]` (format pilote-ppg) fonctionne à l'identique.
- [ ] Sur le seed historique, les routes de lecture existantes renvoient les mêmes réponses qu'avant le POC (valeurs, objectifs, taux de progression, synthèse, valeurs remarquables, dernières valeurs, collections). Preuve : un test ou un script de diff contre un snapshot pris avant les changements.
- [ ] Les URL webapp existantes (`?individu=…&referentiel=…`) fonctionnent toujours, y compris les liens profonds.

### Qualité

- [ ] La typecheck passe sur `kpilote-api`, `kpilote-webapp`, `kpilote-admin` et `kpilote-shared`.
- [ ] Le lint passe sur les mêmes paquets.
- [ ] Les tests passent :
  - `kpilote-api`, contre la base de test POC 5445 ;
  - `kpilote-webapp` ;
  - `kpilote-admin` ;
  - `kpilote-shared`.
- [ ] De nouveaux tests couvrent :
  - l'agrégation multi-axes (dont AVG et l'ordre de remontée) ;
  - les marginales et le cube creux ;
  - la couverture ;
  - les objectifs à grain grossier ;
  - le taux de progression ;
  - l'import à 2 colonnes ;
  - les erreurs de saisie ;
  - le cloisonnement.
- [ ] Une revue de code adversariale indépendante (sous-agent) a été faite sur le diff final, et ses constats sont traités ou justifiés.

### Webapp et admin (vérifiés dans le navigateur)

- [ ] L'API, la webapp et l'admin tournent via portless sous leurs noms de dev habituels, branchés sur la base POC.
- [ ] Une fiche indicateur **mono-dimension** est visuellement et fonctionnellement identique à l'existant. Capture avant/après.
- [ ] Une fiche indicateur **multi-dimension** fonctionne :
  - un sélecteur par dimension ;
  - sélection d'une marginale (« tous ») ;
  - synthèse et comparaison sur une tranche ;
  - carte sur la tranche territoire ;
  - graphique décomposable par dimension ;
  - commentaires et confiance.
  - Captures à l'appui.
- [ ] Les tableaux de bord `/indicateurs` et `/collections` restent fonctionnels avec un mélange d'indicateurs mono et multi-dimension. Captures à l'appui.
- [ ] L'import d'un fichier multi-dimension depuis la webapp va jusqu'à l'écriture des valeurs.
- [ ] L'admin permet de déclarer les dimensions d'un indicateur et de gérer les membres et la hiérarchie par dimension.
- [ ] Aucune erreur console ni réseau inattendue sur les parcours ci-dessus.

### Rapport final à Antoine

- [ ] Le modèle retenu en une page : schéma, sémantique, exemples.
- [ ] Les modèles écartés et pourquoi.
- [ ] La liste des changements par zone : tables, routes, schémas partagés, pages, admin, import.
- [ ] Les URL portless des apps, et un parcours conseillé pour regarder le POC (quels indicateurs ouvrir, quoi tester).
- [ ] Les commandes pour arrêter, relancer et supprimer l'environnement POC, et pour revenir à la base de dev.
- [ ] Les limites connues, la dette laissée, les questions produit à trancher.
- [ ] L'état git : branche, liste des commits, rien de poussé.
