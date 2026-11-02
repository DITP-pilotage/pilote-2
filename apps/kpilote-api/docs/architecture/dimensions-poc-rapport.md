# Rapport final : POC « l'individu devient une dimension comme une autre »

Date : 2026-11-02
Branche : `claude/individu-dimension-poc-f01d87` (10 commits locaux, **rien de poussé**)

Documents associés :

- contrat du POC : [`dimensions-poc-brief.md`](dimensions-poc-brief.md) ;
- conception complète (modèles, matrice, journal du challenge, décision) : [`dimensions-design.md`](dimensions-design.md).

Les preuves (sorties de commandes) sont rangées dans `.poc-evidence/`, à la racine du worktree. Ce dossier est exclu de git par `.git/info/exclude`.

---

## 1. Le modèle retenu en une page (M1‴)

**Idée.** Un fait (valeur, objectif, commentaire) n'est plus porté par un individu mais par une **cellule** : un ensemble de coordonnées, au plus une par **dimension**.

| Terme     | Définition                                                      |
| --------- | --------------------------------------------------------------- |
| Dimension | Un axe : Territoire, Opérateur, Type de fraude.                 |
| Niveau    | Un référentiel ; chaque référentiel appartient à une dimension. |
| Membre    | Un individu.                                                    |

Un indicateur déclare des niveaux, comme aujourd'hui, et ses dimensions s'en déduisent. Par dimension, il précise :

- l'ordre de remontée ;
- la fonction de la marginale « tous » (SUM, AVG ou NONE) ;
- si cette dimension porte les objectifs.

```
dimension ─┐ referentiel.dimension_id
           └ indicateur_dimension(ordre, fonction_agregation, porte_objectifs)
cellule(indicateur_id, cle = uuids triés) ── cellule_coordonnee(dimension_id, individu_id)
valeur_avancement / objectif_indicateur_individu / indicateur_individu_commentaire → cellule_id
indicateur_permission.perimetre_restreint + indicateur_permission_perimetre (cloisonnement)
```

**Sémantique (indicateurs multi-dimension).**

- **Cascade canonique.** On éclate la première coordonnée éclatable, dans l'ordre des dimensions. La dimension d'ordre 0 est l'opération la plus externe.
- **Marginale.** Une dimension absente vaut « tous ». Exemple : `DEPT-84` sur IND-101 = Σ opérateurs du 84.
- **Cube creux.** Quand d'autres coordonnées sont fixées, seuls les enfants observés au moins une fois sont attendus (le « support »). Pour une marginale pure, toute la hiérarchie est attendue.
- **Valeurs et objectifs.** Les valeurs sont permissives (carry-forward) ; les objectifs sont stricts et vivent sur le sous-cube des dimensions qui les portent.
- **Saisie.** Elle n'est possible que sur une cellule feuille ; une marginale NONE est inscriptible.
- **Verrous feuille-à-faits.** Une modification de configuration ou de hiérarchie qui masquerait des faits est refusée (409).

**Exemples (seed POC).**

- `GET /indicateurs/IND-101/valeurs?individus=DEPT-84~OP-ORANGE` : cellule complète.
- `…?individus=DEPT-84` : marginale tous opérateurs.
- `…?individus=OP-ORANGE` : Orange sur toute la France.
- `GET /indicateurs/IND-101/taux-progression?individus=DEPT-29` : 87,40 %, soit Σ opérateurs (11 340) / objectif territorial (12 974).
- `PUT /indicateurs/IND-101/valeurs {coordonnees:['DEPT-84']}` : 400 `COORDONNEE_MANQUANTE`.

**Mono-dimension : chemin historique gelé.** Un indicateur à une seule dimension emprunte exactement l'ancien chemin de calcul ; seules les clés passent par la cellule mono-coordonnée. C'est prouvé par snapshot (§4).

## 2. Modèles écartés

Le détail est en `dimensions-design.md` §2, §4 et §6.

- **M2, tableau de coordonnées et membre « TOUS ».**
  - L'ordre de remontée est implicite (uuid) et diffère selon l'environnement.
  - Le membre TOUS, global et maintenu à la main, fausse le cube creux (couverture 3/12 permanente).
  - D6 jette les objectifs saisis sur TOUS.
- **M3, étoile avec agrégation à plat.**
  - Il change le mono : AVG 15 → 17,5, couverture comptée en feuilles.
  - Les fonctions par niveau sont perdues, et la limite est de 3 dimensions.
- **M4, ventilation secondaire.**
  - Il est plafonné à 2 axes.
  - La population est pilotée par les données, donc le total ≠ les tranches.
  - Pas de cloisonnement.
- **M5, individus composites.**
  - La topologie globale casse le mono : DEPT-84 devient agrégé pour tous les indicateurs.
  - Le DAG compte plusieurs fois (350 → 700 → 1050).
  - Il faudrait 350 000 individus au grain des communes.
- **M1, puis M1′ et M1″**, rejetés successivement aux tours 1 à 3 du challenge, puis corrigés en M1‴ :
  - décision saisie/dérivée par membre ;
  - bascule « saisie jusqu'à la ventilation » (non monotone) ;
  - cloisonnement fail-open ;
  - niveaux sautés ;
  - membres techniques.

## 3. Changements par zone

**Tables / migrations** (écrites à la main, avec reprise des données, appliquées par `migrate deploy`) :

- `20261102120000_dimensions_cellules` :
  - dimensions par union-find (Relation + co-déclaration) ;
  - `indicateur_dimension` ;
  - cellules et coordonnées ;
  - bascule `individu_id` → `cellule_id` sur les trois tables de faits ;
  - périmètre.
- `20261102130000_perimetre_par_presence`, `20261102140000_perimetre_explicite`, `20261102150000_perimetre_recalcul` : cloisonnement fail-closed.
- TypedSQL : `getValeursTronqueesPourCellules`, `getObjectifsTronquesPourCellules`, `getClesCellulesSupport`, `upsertValeursAvancementBatch` (par cellule). Suppression du code mort `getDernieresValeursPourIndividus`.

**Routes API.**

- Nouvelles : `GET/PUT /dimensions`, `GET /dimensions/{id}`.
- Élargies aux cellules, avec réponses mono inchangées :
  - toutes les lectures `individus=` ;
  - `/individus/{cellule}/…` ;
  - commentaires et niveaux de confiance `/indicateurs/{id}/individus/{cellule}/…` ;
  - `collections/{id}/taux-progression?individu=` (avec `nonApplicable`).
- Écritures :
  - `valeurs`, `valeurs:batch` et `objectifs` acceptent `coordonnees` ;
  - nouvelles erreurs `COORDONNEE_MANQUANTE`, `DIMENSION_NON_DECLAREE`, `COORDONNEES_EN_DOUBLE`, `CELLULE_AGREGEE`, `HORS_PERIMETRE`.
- `PUT /indicateurs` : `dimensions[]` ; remplacement par dimension en multi ; verrous 409.
- `PUT /referentiels` : `dimension` ; changement refusé s'il ferait basculer un indicateur.
- `PUT /relations` : `DIMENSIONS_DIFFERENTES`, `FAITS_MASQUES`.
- Permissions :
  - `POST /permissions/indicateur {perimetre}` (pose atomique) ;
  - `PUT /permissions` différentiel ;
  - `/me/permissions` expose `perimetre`.
- `valeurs-remarquables?fixe=` (tranche).
- `POST …/valeurs:normaliser` : plan à plusieurs colonnes d'identité.
- La spec OpenAPI décrit ces contrats : paragraphes « Dimensions » dans `dimension/descriptionsOpenApi.ts`, et `GET /openapi.json` liste `/dimensions`.

**Schémas partagés (`kpilote-shared`).**

- Nouveaux : `cellule.ts` (`celluleIdSchema`, séparateur `~`), `dimension.ts`.
- Étendus :
  - `indicateur.ts` (`dimensions`) ;
  - `referentiel.ts` (`dimension`) ;
  - `valeurAvancement.ts` (`coordonnees`, erreurs, `fixe`) ;
  - `objectifIndicateurIndividu.ts`, `tauxProgression.ts`, `collectionTauxProgression.ts` (`nonApplicable`) ;
  - `commentaire.ts`, `valeurImport.ts`, `permission.ts`, `mePermissions.ts`, `individusCsv.ts` (cellules).

**Webapp (pages).**

- `/indicateurs/$id`, en multi :
  - un sélecteur par dimension, avec « Tous » ;
  - un paramètre `autres` (les liens historiques `individu`/`referentiel` sont conservés) ;
  - synthèse et carte sur la tranche (`fixe`) ;
  - graphique « Décomposer par » ;
  - commentaires et confiance sur la cellule.
- `/indicateurs` et `/collections` : le sélecteur est restreint aux dimensions partagées.
- `/collections/$id` : légende « non applicable ».
- L'import est caché hors périmètre ; `widget.joinKey` est désormais lu.
- En mono, le rendu et les requêtes sont inchangés.

**Admin.**

- Pages Dimensions (liste, création, édition, niveaux et liens vers les membres).
- Dimension d'un référentiel.
- Section « Dimensions » d'un indicateur multi : ordre, marginale, objectifs.
- Relations filtrées par dimension, avec les erreurs dédiées.
- Périmètre affiché en lecture.
- `dimensions` ajouté à l'allowlist du BFF.

**Import.**

- Albert : plusieurs colonnes d'identité (long et pivot) ; chaque colonne est rattachée à une dimension et résolue séparément, en évitant les collisions (« Orange » commune ≠ opérateur).
- Les lignes partielles sont écartées avec un avertissement, et la couverture des dimensions est contrôlée.
- Webapp : format standard à colonnes d'identité, réservé au multi ; prévisualisation et revue dynamiques ; traduction des nouvelles erreurs.

**Seed.**

- Historique porté sur les cellules, idempotent.
- `DIM-TERRITOIRE`, `DIM-OPERATEUR`, `DIM-FRAUDE`.
- IND-101 (Territoire × Opérateur, SUM, cube creux, objectifs au grain territoire, 30 mois).
- IND-102 (Type de fraude × Territoire, AVG territoire / SUM type, 30 mois).
- Contournement IND-111..115 et COL-010 ; collection mixte COL-011.
- Utilisateur `operateur.orange@example.com`, cloisonné sur OP-ORANGE.

## 4. Conditions de succès (brief §5), avec preuves

Légende : ✅ fait, avec sa preuve · ⏳ en attente d'une action d'Antoine.

### Conception

- ✅ **`dimensions-design.md` existe et présente 5 modèles distincts** : M1 à M5 en §2, plus les révisions M1′, M1″ et M1‴.
- ✅ **Chaque modèle répond aux 10 questions de §3.2** (Q1 à Q10 dans chaque section de §2 ; M1‴ en §5).
- ✅ **Matrice de comparaison** : §3.
- ✅ **Journal du challenge** : §4. Chaque modèle a été attaqué par un sous-agent indépendant sur les 9 scénarios (5 agents au tour 1, puis un agent par tour pour M1′, M1″ et M1‴) ; le journal liste les verdicts par scénario, les objections et la réponse apportée à chacune.
- ✅ **Décision argumentée, modèles écartés justifiés, questions produit listées** : §5, §6, §9.
- ✅ **Sémantique multi-axes définie sans ambiguïté** : §5.4 (ordre, AVG, permissif/strict, cube creux, couverture) et §5.5.

### Environnement

- ✅ **Compose `kpilote-poc-dimensions` sur 5444/5445** : `apps/kpilote-api/docker-compose.poc-dimensions.yml` ; `docker ps` affiche `kpilote_poc_dimensions_postgres 0.0.0.0:5444` et `kpilote_poc_dimensions_postgres_test 0.0.0.0:5445`.
- ✅ **Conteneurs et volumes préexistants intacts** : `.poc-evidence/docker-before.txt` et `docker-after.txt`.
  - Le diff ne montre que des ajouts : les 2 conteneurs du POC, le volume `kpilote-poc-dimensions_kpilote_poc_dimensions_db` et le volume anonyme de l'image postgres de test.
  - Le statut de `pilote_mb_postgres(_test)` et `pilote_postgres(_test|_e2e)` est inchangé.
- ✅ **Migrations via `prisma migrate deploy`** : « All migrations have been successfully applied » ; `migrate status` donne « 46 migrations… Database schema is up to date! » ; `migrate diff` donne « empty migration » (`.poc-evidence/final-migrate-diff.txt`).
- ✅ **`prisma generate --sql` passe** : 4 requêtes TypedSQL générées dans `src/generated/prisma/sql/`.
- ✅ **Seed appliqué sur la base POC**, idempotent : le second passage donne 0 écrit / 0 supprimé.

### Données de seed

- ✅ **Seed historique toujours présent et fonctionnellement inchangé** : comparateur de snapshot, 0 différence (§5.8 du design).
- ✅ **IND-101 Territoire × Opérateur.**
  - SUM.
  - Cube creux : OP-REGIONAL dans 10 départements, OP-FREE dans 96 sur 101.
  - Objectifs au grain territoire : 101 cellules territoire seul, 3 échéances.
  - 30 mois de valeurs.
- ✅ **IND-102 Fraude, Type × Territoire.** Cas piégeux : fonctions différentes selon la dimension (AVG territoire, SUM type).
- ✅ **Migration du contournement démontrée.** Exemple seedé COL-010 / IND-111..115 face à IND-101 ; script `scripts/poc-dimensions/comparerContournement.ts` ; sortie dans `.poc-evidence/comparer-contournement.txt` ; analyse dans `dimensions-design.md` §10.
- ✅ **Dimensions et configuration en base** : tables `dimension` et `indicateur_dimension` alimentées par le seed et l'API, aucun registre TypeScript.

### API

La preuve est la suite de tests : 762 tests verts, dont 101 propres au multi-dimension.

- ✅ **Saisie, modification et suppression, à l'unité et en batch, avec erreurs explicites** : `valeurAvancement/commands/ecritureMultiDimension.test.ts` et `valeurAvancement/routes.test.ts`. Couvre `COORDONNEE_MANQUANTE`, `INDIVIDU_INCONNU`, `DIMENSION_NON_DECLAREE`, `COORDONNEES_EN_DOUBLE`, `CELLULE_AGREGEE`, et `DUPLICATE_KEY` canonique (400, pas 500).
- ✅ **Séries sur cellule complète et sur marginale, contributions et couverture cohérentes** : `valeurAvancement/queries/lectureMultiDimension.test.ts` et `dimension/buildGrapheCube.test.ts`.
- ✅ **Objectifs et taux en multi, objectif à grain plus grossier** : `lectureMultiDimension.test.ts`.
- ✅ **Médiane, min, max sur une tranche explicite (`fixe`)** : `lectureMultiDimension.test.ts`.
- ✅ **Commentaires et niveaux de confiance sur cellule (complète ou marginale)** : `indicateur/commands/commentairesMultiDimension.test.ts`.
- ✅ **Taux de collection mixte** : `collection/queries/collectionMultiDimension.test.ts` (`nonApplicable`) et COL-011 seedée.
- ✅ **Cloisonnement par membre de dimension implémenté.** Fail-closed, atomique, ET entre dimensions et OU dans une dimension, descendants inclus. Tests : `permission/commands/perimetre.test.ts`, `ecritureMultiDimension.test.ts`, `me/routes.perimetre.test.ts`.
- ✅ **Normalisation Albert multi-coordonnées, en long et en pivot** (Albert mocké) : `valeurImport/commands/normaliserValeursImport.test.ts`.
- ✅ **OpenAPI à jour** : descriptions « Dimensions » sur toutes les routes concernées ; `/dimensions` est présent dans `/openapi.json`.

### Rétrocompatibilité

- ✅ **`valeurs:batch {individu,date,valeur}` à l'identique** : `valeurAvancement/routes.test.ts` rejoue le payload `apps/pilote-ppg/src/server/mb-sync` (`{3,3,0}` puis `{3,1,2}`, corps d'erreur historique exact).
- ✅ **`PUT /indicateurs` au format pilote-ppg à l'identique** : `indicateur/routes.test.ts` (replace-all exact, valeurs conservées).
- ✅ **Routes de lecture identiques sur le seed historique.**
  - `scripts/poc-dimensions/snapshotLecture.ts`, comparé à une capture prise avant tout changement de code.
  - Résultat (`.poc-evidence/snapshot-compare-final.txt`) : 785 requêtes ; 724 identiques ; 50 avec seulement des champs ajoutés ; 5 listes globales avec seulement des entités ajoutées ; 6 avec les mêmes éléments dans un autre ordre (requête historique sans `ORDER BY`) ; **0 différence**.
- ✅ **URL webapp existantes conservées** (`?individu=…&referentiel=…`, liens profonds).
  - Vérifié par les tests unitaires : `lib/individus/cellule.test.ts` et `pair.test.ts`. En mono, le paramètre `autres` est ignoré et la résolution est inchangée.
  - ⏳ **Pas encore vérifié dans le navigateur** (voir la section « Webapp et admin »).

### Qualité

- ✅ **Typecheck** : `tsc --noEmit` renvoie 0 sur les 4 paquets (`.poc-evidence/final2-resume.txt`).
- ✅ **Lint** : `pnpm lint` (oxlint type-aware, tsc, prettier) renvoie 0 sur les 4 paquets.
- ✅ **Tests** :

  | Paquet         | Tests       | Remarque                              |
  | -------------- | ----------- | ------------------------------------- |
  | kpilote-api    | **762/762** | base de test POC 5445 ; 663 au départ |
  | kpilote-webapp | **188/188** | 132 au départ                         |
  | kpilote-admin  | **34/34**   |                                       |
  | kpilote-shared | **58/58**   |                                       |

- ✅ **Nouveaux tests** sur l'agrégation multi-axes (dont AVG et l'ordre), les marginales et le cube creux, la couverture, les objectifs à grain grossier, le taux, l'import à 2 colonnes, les erreurs de saisie et le cloisonnement : voir la section API.
- ✅ **Revue adversariale indépendante du diff final** : `dimensions-design.md` §11. Aucun bloquant ; 3 majeurs et 7 mineurs, dont 8 corrigés avec tests et 2 documentés.

### Webapp et admin (vérifiés dans le navigateur)

- ✅ **Les 3 apps tournent via portless sous leurs noms habituels, branchées sur la base POC.**
  - API : https://kpilote-api.modernisation.localhost
  - Webapp : https://kpilote.modernisation.localhost
  - Admin : https://kpilote-admin.localhost

  Le `.env` du worktree pointe vers 5444.

- ✅ **L'admin permet de déclarer les dimensions d'un indicateur et de gérer membres et hiérarchie par dimension.** Vérifié dans le navigateur (captures prises pendant la session) :
  - `/fonctionnalites` affiche la carte « Gérer les dimensions » ;
  - `/dimensions` liste les 4 dimensions et leurs niveaux ;
  - `/indicateurs/IND-101` : la section Dimensions est pré-remplie (Territoire ordre 0, porte les objectifs ; Opérateur ordre 1) ;
  - y cocher « porte les objectifs » sur Opérateur renvoie bien **409** « Changement du grain des objectifs refusé : l'indicateur porte déjà des objectifs. » ;
  - `/relations?dimension=DIM-FRAUDE` : la hiérarchie famille → type est filtrée par dimension.
  - Seules erreurs console : les 403/409 provoqués volontairement par ce test.
- ⏳ **Fiche mono identique (avant/après)**, **fiche multi** (sélecteurs, « Tous », tranche, carte, décomposition, commentaires), **tableaux de bord mixtes**, **import multi depuis la webapp jusqu'à l'écriture**, **absence d'erreurs console webapp** : **non vérifiés dans le navigateur**.
  - La webapp n'accepte que ProConnect ou le Keycloak de dev, deux fournisseurs d'identité distants. Je ne suis pas autorisé à y saisir des identifiants, et aucune session n'était ouverte dans le panneau navigateur.
  - Ce qui est déjà prouvé : tests unitaires webapp (188), contrats et rétrocompatibilité côté API, lint et typecheck.
  - Il reste : une connexion d'Antoine dans le panneau navigateur, puis le parcours du §6. Pour la capture « avant » de la fiche mono, il faudra servir temporairement le code webapp du commit `eed13bc10` sous le même nom portless (`git checkout eed13bc10 -- apps/kpilote-webapp/src`, capture, puis `git checkout HEAD -- apps/kpilote-webapp/src`), puisque la redirection OIDC impose cet hôte.

## 5. Environnement POC : commandes

Toutes depuis le worktree.

```bash
# Arrêter / relancer / supprimer (POC uniquement)
docker compose -p kpilote-poc-dimensions -f apps/kpilote-api/docker-compose.poc-dimensions.yml stop
docker compose -p kpilote-poc-dimensions -f apps/kpilote-api/docker-compose.poc-dimensions.yml up -d
docker compose -p kpilote-poc-dimensions -f apps/kpilote-api/docker-compose.poc-dimensions.yml down -v
# Recréer la base POC après suppression
(cd apps/kpilote-api && pnpm prisma migrate deploy && pnpm prisma generate --sql && pnpm db:seed)
# Preuves rejouables
(cd apps/kpilote-api && pnpm tsx scripts/poc-dimensions/snapshotLecture.ts compare ../../.poc-evidence/snapshot-lecture-avant.json)
(cd apps/kpilote-api && pnpm tsx scripts/poc-dimensions/comparerContournement.ts)
```

**Revenir à la base de dev :**

- arrêter les apps du POC (panneau navigateur, ou Ctrl-C) ;
- relancer les apps depuis le checkout principal (`pnpm dev:kpilote-api`, etc.). Son `.env` pointe toujours sur 5434 : il n'a pas été modifié.

**Dans ce worktree :**

- `.env` et `.env.test` pointent vers 5444/5445 (copies, non commitées) ;
- `.env.test` est suivi par git : il est marqué `skip-worktree`, pour ne pas être commité par erreur. Pour le restaurer :

  ```bash
  git update-index --no-skip-worktree apps/kpilote-api/.env.test && git checkout apps/kpilote-api/.env.test
  ```

- une clé API ADMIN de test existe sur la base POC (« POC dimensions — admin local »). Elle est stockée dans `.poc-evidence/admin-api-key.txt` (mode 600, hors git).

Correctif d'outillage au passage : sous le module runner SSR de Vite (dev), `pino-pretty` ne se résolvait plus, ce qui donnait une erreur 500 sur l'API et le BFF webapp. La cible est désormais résolue en chemin absolu (`pino-stdout.sink.ts`, `server/logger.ts`).

## 6. Parcours conseillé

**Admin** (https://kpilote-admin.localhost, environnement Local, clé de test ci-dessus) :

1. `/dimensions`, puis `DIM-TERRITOIRE` (niveaux, liens vers les membres et vers la hiérarchie) ;
2. `/indicateurs/IND-101` (section Dimensions) ;
3. `/relations?dimension=DIM-FRAUDE` ;
4. `/referentiels` (colonne Dimension).

**Webapp** (https://kpilote.modernisation.localhost, après connexion) :

1. **Mono, non-régression** : `/indicateurs/IND-003` et `?individu=DEPT-84&referentiel=REF-DEPT&sousOnglet=evolution`. Un seul sélecteur, carte, aucun `fixe`.
2. **IND-101** :
   - `/indicateurs/IND-101` (France, Opérateur = Tous) ;
   - `?individu=DEPT-84&referentiel=REF-DEPT&autres=OP-ORANGE` (cellule ; comparaison « · Orange ») ;
   - choisir Territoire = Tous ;
   - `&sousOnglet=evolution&decomposition=DIM-OPERATEUR` (5 séries) ;
   - clic sur la carte (garde Orange).
3. **IND-102** : `&decomposition=DIM-FRAUDE` (3 familles). Vérifier la marginale AVG territoire / SUM type.
4. **Tableaux de bord** : `/indicateurs` et `/collections` (sélecteur territorial seul) ; `/collections/COL-011` (mixte, `?individu=OP-ORANGE&referentiel=REF-OPERATEUR` donne « 1 non applicable ») ; `/collections/COL-010` (contournement).
5. **Import multi** : sur IND-101, un fichier `individu,operateur,date,valeur` (ex. `DEPT-84,OP-ORANGE,2026-07-01,123`), jusqu'à l'écriture.
6. **Cloisonnement** : connecté en `operateur.orange@example.com` (si ce compte existe côté Keycloak), « Importer des valeurs » doit être caché hors OP-ORANGE.

## 7. Limites connues, dette, questions produit

Le détail est en `dimensions-design.md` §8 et §9. L'essentiel :

**Volumétrie.** Communes × N : le calcul se fait en JS, borné par le support. Il faudra pré-agréger en SQL (chemins SUM) avant d'ouvrir le grain commune.

**Support inféré, non daté :**

- opérateur « zombie » (compté via le carry-forward) ;
- couverture historique réécrite à l'arrivée d'un membre ;
- retardataire jamais vu, donc invisible.

Une table de présence déclarée et datée est l'évolution naturelle.

**AVG et fonctions mixtes** : non commutatifs. C'est assumé, et l'ordre est persisté.

**Non cloisonnés** : la lecture (secret entre opérateurs), les commentaires, les niveaux de confiance.

**Import, hors scope** : pivot sur des membres, lignes « Total », coordonnées constantes (fichier mono-opérateur).

**Hors scope POC :**

- éclatement d'un indicateur existant (ajouter une dimension sur des faits : 409, il faut une migration explicite) ;
- scission d'une dimension fusionnée par la migration ;
- déploiement expand/contract.

**Dette :**

- décomposition webapp avec niveaux non déclarés intermédiaires ;
- flux d'administration qui ignorent `dimension` ;
- `vi.mock(withTransaction)` dupliqué dans 3 tests de route (à factoriser) ;
- `dimension_id` absent des événements analytics.

**Questions produit :**

- pondérations par opérateur, et moyenne des taux face au taux de la somme (§10) ;
- vue « opérateur » des collections ;
- interdire les fonctions mixtes ?
- ordre recommandé ;
- confidentialité en lecture ;
- éclatement d'indicateurs existants ;
- convention pour « non ventilé » ;
- choix des pairs de la synthèse.

## 8. État git

Branche `claude/individu-dimension-poc-f01d87`, au-dessus de `eed13bc10` (base `dev`). 10 commits (le dernier ajoute ce rapport), environ 207 fichiers, +14,8k et −1,4k lignes. **Aucun push, aucune PR, `dev` non modifiée.**

```
(ce commit)  docs(kpilote-api): rapport final du POC dimensions
de605c906 fix(kpilote): correctifs de la revue adversariale (POC dimensions)
efda953b9 test(kpilote-api): couverture multi-dimension et correctifs (POC dimensions)
261c1fbd6 feat(kpilote-webapp): fiche indicateur multi-dimension (POC dimensions)
e6dc3f304 feat(kpilote-api): seed multi-dimension et preuve de non-régression (POC dimensions)
16f5d7231 feat(kpilote): import de valeurs multi-dimension (POC dimensions)
71d239ad2 feat(kpilote-admin): dimensions, niveaux et hiérarchie par dimension (POC dimensions)
26a908b96 feat(kpilote-api): routes dimensions, périmètre d'écriture explicite et descriptions OpenAPI
b5b0741d0 feat(kpilote-api): cellules et dimensions — cœur du modèle (POC dimensions)
23b7d80b9 chore(kpilote): environnement isolé du POC dimensions
```
