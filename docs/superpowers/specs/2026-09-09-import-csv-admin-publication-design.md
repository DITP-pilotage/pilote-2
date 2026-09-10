# Import CSV admin pour commentaires/synthèses/décisions/objectifs — design

## Contexte

Sur une page chantier de PILOTE PPG, un utilisateur peut modifier un commentaire, une
synthèse des résultats, une décision stratégique ou un objectif. Si l'entrée modifiée avait
été introduite via l'import massif dbt et que sa ligne source existe toujours dans
`raw_data.commentaires`, la modification est écrasée à la prochaine exécution des datajobs.

## État des lieux

### Cause racine

`apps/pilote-ppg-data-management/models/staging/import/stg_import_massif__commentaires.sql`
lit `raw_data.commentaires` (alimentée manuellement via
`scripts/import_commentaires/import.sh`, un `psql \copy` depuis un CSV local — pas un vrai
job automatisé). Quatre modèles d'exposition consomment cette même source et écrivent
**directement** dans les tables `public` que Prisma lit/écrit — pas de synchronisation
intermédiaire, le même schéma est partagé entre dbt et l'app :

| Modèle dbt | Table `public.*` | Clé naturelle (surrogate key) | Filtre `type` |
|---|---|---|---|
| `exposition/commentaire.sql` | `commentaire` | chantier_id, type, maille, code_insee, date | `commentaires_sur_les_donnees`, `autres_resultats_obtenus`, `autres_resultats_obtenus_non_correles_aux_indicateurs`, `freins_a_lever`, `actions_a_venir`, `actions_a_valoriser` |
| `exposition/synthese_des_resultats.sql` | `synthese_des_resultats` | chantier_id, maille, code_insee, date | `synthese_des_resultats` |
| `exposition/decision_strategique.sql` | `decision_strategique` | chantier_id, type, date | `suivi_des_decisions` |
| `exposition/objectif.sql` | `objectif` | chantier_id, type, date | `notre_ambition`, `deja_fait`, `a_faire` |

Chaque modèle est matérialisé en `incremental` avec `unique_key: ['id']`, `id` étant un hash
déterministe des colonnes ci-dessus. Tant que la ligne source existe dans
`raw_data.commentaires`, le même `id` est recalculé à l'identique à chaque run et le merge
incrémental réécrit `contenu` avec la valeur d'origine — même si l'utilisateur a modifié
cette ligne entre-temps via l'app (qui fait un `upsert` Prisma sur ce même `id`).

Aucun champ ne distingue aujourd'hui "importé massivement" de "saisi/modifié manuellement" :
c'est le fait que dbt re-matérialise silencieusement et périodiquement qui cause
l'écrasement, pas une logique métier volontaire.

### Ce qui existe déjà côté app

Les 4 domaines ont chacun un module CQRS complet (brouillon/publication) et un handler
d'import JSON symétrique, déjà appelé depuis la page chantier pour la saisie unitaire :

| Domaine | Handler | Use case | Génération d'id |
|---|---|---|---|
| `commentaires` | `ImportCommentaireAPIHandler` | `ImporterCommentairesUseCase` | `randomUUID()` |
| `syntheses-des-resultats` | `ImportSyntheseDesResultatsAPIHandler` | `ImporterSynthesesDesResultatsUseCase` | `randomUUID()` |
| `decisions-strategiques` | `ImportDecisionStrategiqueAPIHandler` | `ImporterDecisionsStrategiquesUseCase` | `randomUUID()` |
| `objectifs` | `ImportObjectifAPIHandler` | `ImporterObjectifsUseCase` | `randomUUID()` |

Les 4 `Importer*UseCase` font aujourd'hui uniquement de la création (`randomUUID()` à chaque
exécution, pas de lookup par clé naturelle). C'est ce comportement que la nouvelle route va
réutiliser tel quel.

### Pattern de référence pour l'import CSV admin

`apps/pilote-ppg/src/pages/api/admin/unitaire/import-csv-utilisateurs.ts` : route protégée
par `onlyCron`, `bodyParser: false`, parsing du fichier via `parseForm` +
`csv-parse/sync`, délégation à un parseur dédié (`UtilisateurCSVParseur`) puis à un use case
existant via le container Awilix.

## Décisions

| Sujet | Décision |
|---|---|
| Portée | Couvre les 4 domaines (`commentaires`, `syntheses-des-resultats`, `decisions-strategiques`, `objectifs`), pas seulement `commentaires` |
| Remplacement du pipeline dbt | Complet — pas de coexistence temporaire |
| Comportement de la nouvelle route | Création pure, réutilise les 4 `Importer*UseCase` **sans les modifier** — pas d'upsert par clé naturelle |
| Pourquoi ça résout le problème | L'import devient une action explicite déclenchée à la demande par un opérateur, plus un job automatique périodique qui réécrit silencieusement en tâche de fond |
| Ré-import du même CSV | Crée des doublons (pas de déduplication) — comportement assumé, à documenter dans la route |
| Ligne CSV invalide | All-or-nothing, comme le handler JSON actuel : aucune ligne n'est importée, la réponse liste les erreurs par ligne |
| `raw_data.commentaires` et `scripts/import_commentaires/` | Supprimés complètement (table, seed/source, script psql, docker-compose, README) |
| Modèles dbt concernés | `stg_import_massif__commentaires.sql` + les 4 modèles d'exposition, supprimés |

## Design détaillé

### Format d'entrée

Même format CSV que celui utilisé aujourd'hui pour `raw_data.commentaires` :
`chantier_id, type, contenu, date, auteur_email, maille, code_insee, date_meteo, meteo`
(un seul fichier couvre les 4 domaines, dispatché par `type`).

### Composants

- **Parseur CSV** (nouveau, miroir de `UtilisateurCSVParseur`) : valide et normalise chaque
  ligne, détermine le domaine cible à partir de `type` (reprend la logique des 4 `WHERE type
  IN (...)` dbt). Pour `commentaires` et `syntheses-des-resultats` (domaines territorialisés),
  construit `territoire = maille + '-' + code_insee` à partir des colonnes CSV. Pour
  `decisions-strategiques` et `objectifs` (domaines chantier uniquement, pas de notion de
  territoire), les colonnes `maille`/`code_insee` du CSV sont ignorées.
- **Résolution auteur** : `auteur_email` → `auteurId` via lookup utilisateur Prisma, avec
  fallback sur l'utilisateur système `import.csv@modernisation.gouv.fr` si l'email est
  absent ou ne correspond à aucun utilisateur — même logique que le `COALESCE` dbt actuel.
- **Route admin** (nouvelle, `apps/pilote-ppg/src/pages/api/admin/unitaire/`, protégée par
  `onlyCron`) : groupe les lignes par `chantier_id`, puis par domaine, et appelle
  `Importer*UseCase.execute()` du module cible — **sans modification** de ces use cases.

### Flux de données

CSV → parsing + validation Zod par ligne (réutilise/adapte les schémas existants,
ex. `importCommentaireSchema`) → si une ligne est invalide, rejet de tout le batch avec la
liste des erreurs (index, chantier_id, type, message) → sinon, groupement par
`chantier_id` puis par domaine → appel du `Importer*UseCase.execute()` correspondant →
réponse listant les comptes créés par domaine.

### Décommissionnement

- Suppression de `stg_import_massif__commentaires.sql` et des 4 modèles d'exposition
  (`commentaire.sql`, `synthese_des_resultats.sql`, `decision_strategique.sql`,
  `objectif.sql`).
- Suppression de `raw_data.commentaires` (table, source/seed) et de
  `scripts/import_commentaires/` (script, docker-compose, README).
- La constante utilisateur système `import.csv@modernisation.gouv.fr` est reprise côté app
  (déjà utilisée ailleurs, ex. `seed-utilisateurs-test.ts`).

## Point d'attention pour l'implémentation

Il existe des interfaces `*Repository` dupliquées pour `decision_strategique` et
`synthese_des_resultats` (une sous `fiche-conducteur`/`fiche-territoriale`, une sous
`gestion-utilisateur`). Avant de toucher à ces modules, identifier laquelle est réellement
injectée dans `Importer*UseCase` via le container Awilix — la modification ne concerne que
la route/le parseur, mais le point d'injection doit être vérifié pour appeler le bon
use case.

## Tests

- Test d'intégration sur la nouvelle route CSV (mirroring
  `ImportCommentaireAPIHandler.integration.test.ts`), couvrant : dispatch correct par `type`
  vers les 4 domaines, résolution auteur avec fallback système, rejet all-or-nothing sur
  ligne invalide.
- Pas de modification des tests unitaires existants des 4 `Importer*UseCase` (comportement
  inchangé).
- Pas de test e2e Playwright nécessaire (route admin, pas de parcours UI).

## Hors périmètre

- Pas de déduplication sur ré-import (assumé, cf. Décisions).
- Pas de flag "source"/origine sur les entités (pas nécessaire, le problème est résolu par le
  changement de déclenchement — action explicite vs job périodique — pas par un marquage de
  provenance).
