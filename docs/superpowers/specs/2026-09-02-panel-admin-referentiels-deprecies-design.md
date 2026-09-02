# Panel-admin — CRUD pour les référentiels dépréciés (PPG, Axes, Engagements)

Date : 2026-09-02

## Contexte

Le panel-admin de `pilote-ppg` dispose déjà d'un CRUD pour trois référentiels du schéma `raw_data` : **Porteurs**, **Périmètres** et **Zones groupes** (menu "Référentiels"). Trois autres tables du même schéma suivent exactement le même pattern de colonnes (`*_id`, nom, description, `created_at`, `updated_at`) mais n'ont aujourd'hui aucune interface d'administration :

- `metadata_ppgs` — référentiel des PPG (Politiques Prioritaires du Gouvernement), avec une vraie relation Prisma vers `metadata_chantiers.ch_ppg`, utilisé aujourd'hui en lecture seule (dropdown) dans le formulaire Chantier.
- `metadata_axes` — référentiel des axes stratégiques, isolé (aucune FK Prisma), lié à `metadata_ppgs.ppg_axe` uniquement par convention de valeur.
- `metadata_engagement` — référentiel des engagements du baromètre, marqué dans le schema comme _"utilisé uniquement par les modèles baromètre côté datajobs — à supprimer lors du décommissionnement du baromètre"_, lié à `metadata_chantiers.engagement_short` uniquement par convention de valeur.

Sans être totalement mortes, elles sont traitées comme des référentiels **dépréciés** : l'objectif de ce projet est de leur donner un CRUD admin symétrique à l'existant, regroupé dans une nouvelle section "Référentiels dépréciés" du menu, sans réintroduire de dette ni de risque sur les données existantes.

## Objectif

Étendre le panel-admin avec un CRUD complet (créer / modifier / archiver / restaurer) pour `metadata_ppgs`, `metadata_axes` et `metadata_engagement`, en dupliquant fidèlement le pattern déjà en place pour Porteurs/Périmètres/Zones groupes, et en fiabilisant au passage les liens aujourd'hui non contraints entre ces tables.

## Hors scope

- Toute modification du système `public.ppg` / `public.axe` (référentiel "moderne" parallèle) — non touché par ce projet.
- Toute modification du pipeline dbt (`apps/pilote-ppg-data-management`) — confirmé en lecture seule sur ces 3 tables, aucun changement nécessaire côté data pipeline.
- Ajout d'un rôle de permission plus fin que `DITP_ADMIN` — on réutilise la protection existante à l'identique.
- Bandeau d'avertissement UI spécifique — la séparation dans le menu est jugée suffisante.
- Tests e2e (Playwright) — aucun n'existe pour les 3 CRUDs de référence, on ne déroge pas au pattern actuel (tests d'intégration serveur uniquement).

## Décisions de conception

### 1. Les trois tables sont traitées comme un lot homogène

Bien que `metadata_ppgs` ne soit pas encore totalement mort (relation active vers les chantiers), il est traité de façon identique à `metadata_axes` et `metadata_engagement` : CRUD complet, même regroupement menu, mêmes règles d'archivage. Pas de traitement différencié entre les trois tables.

### 2. Pas de conflit avec le pipeline data

Vérifié dans `apps/pilote-ppg-data-management` : les trois tables sont déclarées en `source` (lecture seule) dans `models/staging/import/sources.yml`, consommées uniquement via `stg_ppg_metadata__{ppgs,axes,engagement}.sql` et `chantier_identite.sql`/`baro_meta_*.sql`. Aucun modèle dbt n'écrit dedans. La seule écriture existante est le script de seed de test (`tests/seed/seed.sh`, `\COPY` initial pour dev/test). Traitement strictement identique à Porteurs/Périmètres/Zones groupes, qui subissent déjà ce même régime sans problème. Aucune mesure de coordination avec le pipeline n'est nécessaire.

### 3. Périmètre fonctionnel : CRUD complet symétrique à l'existant

Créer / modifier / archiver / restaurer pour les trois tables, sans restriction particulière liée au statut "déprécié" — le regroupement dans le menu suffit à signaler qu'il s'agit de référentiels legacy, sans brider les capacités d'administration.

### 4. Ajout de `deleted_at` par migration Prisma

Les trois tables reçoivent une colonne `deleted_at DateTime? @db.Timestamptz`, exactement comme `metadata_porteurs`/`metadata_perimetres`/`metadata_zonegroup`. C'est le pattern de soft delete requis pour Archiver/Restaurer.

### 5. Fiabilisation des liens faibles par de vraies FK Prisma

Aujourd'hui, `metadata_ppgs.ppg_axe` et `metadata_chantiers.engagement_short` sont des champs texte non contraints. La donnée de seed confirme que la contrainte est respectée (`ppg_axe` correspond toujours à un `axe_id` existant ; `engagement_short` est unique dans le jeu de données actuel). Décision : transformer ces deux liens en vraies relations Prisma/FK Postgres.

- `metadata_ppgs.ppg_axe` → `metadata_axes.axe_id` (FK simple, `ppg_axe` reste nullable).
- `metadata_engagement.engagement_short` devient `@unique`, et `metadata_chantiers.engagement_short` devient une FK vers ce champ (nullable, comme aujourd'hui).

Ces deux FK remplacent la vérification "scan best-effort" initialement envisagée pour l'archivage : `VerifierUtilisation` devient une simple requête sur la relation, comme c'est déjà le cas pour `metadata_ppgs` → `metadata_chantiers` (`ch_ppg`).

**Point de vigilance conservé** : l'ajout d'une contrainte `UNIQUE` sur `engagement_short` peut échouer au déploiement si la production contient des doublons non visibles dans le seed de test. La migration doit être accompagnée d'une requête de vérification préalable (voir section Risques).

### 6. `engagement_short` verrouillé après création

Une fois la FK posée sur un champ qui n'est pas la clé primaire, autoriser sa modification casserait silencieusement les références existantes (ou nécessiterait un `ON UPDATE CASCADE`, jugé trop risqué/invisible). Décision : dans le formulaire d'édition d'un engagement, `engagement_short` est affiché mais non modifiable après création — seuls `engagement_name` (et une éventuelle description) restent éditables. C'est cohérent avec le traitement des identifiants métier ailleurs dans l'admin (`porteur_id`, `ppg_id`, `axe_id` : jamais modifiables après création, car ce sont des clés primaires).

### 7. Génération des identifiants à la création

Le pattern existant (`RecupererIdSuivantPorteurQuery`) génère l'id suivant par `max(id numérique) + 1`, ce qui suppose un identifiant purement numérique. C'est vrai pour `engagement_id` (`0`–`4` dans le seed) mais pas pour `axe_id` (codes métier : `EMPLOI`, `TE`, `PROGRES`, `ENGAG`) ni pour `ppg_id` (`PPG-1`, `PPG-AJE`, `PPG-SNU`…).

Décision :

- **`metadata_engagement`** : réutilise le pattern `RecupererIdSuivantEngagementQuery` (max numérique + 1), comme Porteur.
- **`metadata_axes`** et **`metadata_ppgs`** : pas de génération automatique. Le formulaire de création laisse l'admin saisir le code lui-même, avec validation d'unicité (rejet si l'id existe déjà, y compris archivé) côté handler `Enregistrer*Handler`.

### 8. Sélecteur d'Axe dans le formulaire PPG

Conséquence directe de la FK ajoutée (décision 5) : le champ `ppg_axe` dans le formulaire d'édition/création PPG devient un `<select>` alimenté par `metadata_axes` (actifs, `deleted_at: null`), sur le modèle du composant `SelecteurPpg` déjà utilisé dans le formulaire Chantier — plutôt qu'un champ texte libre source d'erreurs de saisie.

### 9. Placement dans le menu : nouvelle section séparée

Dans `MenuLateralPanelAdministrateur.tsx`, un second groupe **"Référentiels dépréciés"** est ajouté juste après le groupe "Référentiels" existant, avec trois entrées : PPG, Axes, Engagements. Séparation visuelle nette signalant qu'il s'agit d'un usage legacy, sans mélanger avec les référentiels actifs.

### 10. Pas de bandeau d'avertissement supplémentaire

La séparation dans le menu est jugée suffisante comme signal ; pas d'`Alerte` additionnelle sur les pages elles-mêmes.

## Modèle de données

### Migration Prisma

```prisma
model metadata_ppgs {
  ppg_id     String    @id
  ppg_nom    String
  ppg_desc   String?
  ppg_axe    String?
  created_at DateTime  @default(now()) @db.Timestamptz
  updated_at DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz          // + nouveau

  axe        metadata_axes?       @relation(fields: [ppg_axe], references: [axe_id])  // + nouveau
  chantiers  metadata_chantiers[]

  @@schema("raw_data")
}

model metadata_axes {
  axe_id     String    @id
  axe_name   String
  axe_desc   String?
  created_at DateTime  @default(now()) @db.Timestamptz
  updated_at DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at DateTime? @db.Timestamptz          // + nouveau
  ppgs       metadata_ppgs[]                    // + nouveau (back-relation)

  @@schema("raw_data")
}

model metadata_engagement {
  engagement_id    String    @id
  engagement_short String    @unique             // + nouveau
  engagement_name  String
  created_at       DateTime  @default(now()) @db.Timestamptz
  updated_at       DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at       DateTime? @db.Timestamptz     // + nouveau
  chantiers        metadata_chantiers[]          // + nouveau (back-relation)

  @@schema("raw_data")
}

model metadata_chantiers {
  // ... champs inchangés ...
  engagement metadata_engagement? @relation(fields: [engagement_short], references: [engagement_short])  // + nouveau
}
```

### Vérification pré-migration recommandée

Avant d'appliquer la migration en production, exécuter :

```sql
-- doit renvoyer 0 lignes
SELECT engagement_short, count(*) FROM raw_data.metadata_engagement
GROUP BY engagement_short HAVING count(*) > 1;

-- doit renvoyer 0 lignes (valeurs orphelines qui bloqueraient la FK ppg_axe)
SELECT DISTINCT ppg_axe FROM raw_data.metadata_ppgs
WHERE ppg_axe IS NOT NULL
  AND ppg_axe NOT IN (SELECT axe_id FROM raw_data.metadata_axes);

-- doit renvoyer 0 lignes (valeurs orphelines qui bloqueraient la FK engagement_short)
SELECT DISTINCT engagement_short FROM raw_data.metadata_chantiers
WHERE engagement_short IS NOT NULL
  AND engagement_short NOT IN (SELECT engagement_short FROM raw_data.metadata_engagement);
```

## Architecture applicative

Pour chacune des trois entités, duplication exacte du pattern `metadataPorteur` (CQRS léger, pas de repository, DI Awilix) :

```
src/server/metadata{Ppg,Axe,Engagement}/
├── module.ts
├── handlers/
│   ├── Enregistrer{Entite}Handler.ts     # upsert Prisma direct + schéma Zod exporté
│   ├── Archiver{Entite}Handler.ts        # vérifie usage puis deleted_at = now()
│   └── Restorer{Entite}Handler.ts        # deleted_at = null
└── queries/
    ├── Lister{Entite}sAdminQuery.ts
    ├── Recuperer{Entite}Query.ts
    ├── RecupererIdSuivantEngagementQuery.ts   # uniquement pour Engagement (voir décision 7)
    └── VerifierUtilisation{Entite}Query.ts    # requête directe sur la FK, plus de scan manuel
```

- `VerifierUtilisationPpgQuery` : `count(metadata_chantiers where ch_ppg = ppgId)` — inchangé par rapport à l'existant, la FK était déjà là.
- `VerifierUtilisationAxeQuery` : `count(metadata_ppgs where ppg_axe = axeId)`.
- `VerifierUtilisationEngagementQuery` : `count(metadata_chantiers where engagement_short = engagementShort)`.

**Enregistrement DI** : ajouter les trois modules dans `src/server/dependances.ts` (imports + `MODULES` + résolution du cradle), sur le modèle de `metadataPorteurModule`.

**Routes tRPC** : `src/server/infrastructure/api/trpc/routes/metadata{Ppg,Axe,Engagement}.ts`, chacune avec `lister`, `récupérer`, `enregistrer` (+ `récupérerIdSuivant` pour Engagement uniquement), `archiver`, `restorer`, chaque procédure protégée par `vérifierPermissionAdmin` et les mutations validées par `zodValidateurCSRF`. Enregistrement dans `src/server/infrastructure/api/trpc/routes/routes.ts`.

**Schémas Zod** : définis à côté de chaque `Enregistrer*Handler`, réimportés côté client par les hooks `use{Entite}Form.ts`. Pour Engagement, `engagement_short` est présent dans le schéma mais le champ front est disabled en mode édition (decision 6).

## Interface / UX

**Menu** (`MenuLateralPanelAdministrateur.tsx`) : nouvelle section "Référentiels dépréciés" après "Référentiels", avec les items PPG / Axes / Engagements.

**Routes** :

```
pages/panel-administrateur/referentiels-deprecies/
├── ppgs/{index.tsx, [id]/index.tsx}
├── axes/{index.tsx, [id]/index.tsx}
└── engagements/{index.tsx, [id]/index.tsx}
```

**Composants** : `PageAdmin{Ppgs,Axes,Engagements}/` sur le modèle exact de `PageAdminPorteurs/` — table Tailwind, recherche client-side, bouton "+ Créer", page d'édition avec `react-hook-form` + `zodResolver`, boutons Archiver/Restaurer désactivés si `estUtilisé` (via `verifierUtilisation`), `BadgeStatutReferentiel` pour l'état.

**Formulaire PPG** : le champ Axe devient un `<select>` (composant `Sélecteur`) alimenté par `metadataAxe.lister` (axes actifs uniquement), au lieu d'un champ texte.

**Formulaire Engagement** : `engagement_short` affiché en lecture seule (grisé) en mode édition, éditable uniquement à la création.

## Conséquences sur le code existant

- **`ListerPpgsQuery`** (`src/server/metadataChantier/queries/ListerPpgsQuery.ts`), utilisée par `SelecteurPpg` dans le formulaire Chantier, doit ajouter `where: { deleted_at: null }` pour exclure les PPG archivés de la liste des options sélectionnables — comme le font déjà `ListerPorteursQuery`, `ListerPerimetresQuery` et `ListerZonegroupsQuery`. C'est un changement de comportement : aujourd'hui tous les PPG apparaissent dans ce dropdown, demain les PPG archivés en seront exclus.
- Le commentaire actuel sur `metadata_engagement` dans `schema.prisma` ("à supprimer lors du décommissionnement du baromètre") reste valable et n'est pas modifié — l'ajout d'un CRUD ne change pas la trajectoire de dépréciation à long terme de cette table, il permet juste de gérer proprement son cycle de vie en attendant.

## Tests

Pattern identique à `metadataPorteur/__tests__/` : un fichier `*.integration.test.ts` par handler/query, dans `src/server/metadata{Ppg,Axe,Engagement}/__tests__/{handlers,queries}/`, via `createIntegrationTest` (transaction rollback). Points à couvrir spécifiquement :

- `Enregistrer{Entite}Handler` : création avec id saisi manuellement (Axe/PPG) rejette un id déjà existant (y compris archivé) ; création Engagement génère bien l'id suivant.
- `Archiver{Entite}Handler` : lève `ConflictError` et ne modifie pas `deleted_at` si la FK est référencée (Axe utilisé par un PPG, PPG utilisé par un Chantier, Engagement utilisé par un Chantier).
- Ajouter des fixtures `fixtures.metadataAxe(...)` et `fixtures.metadataEngagement(...)` dans `src/server/infrastructure/test/fixtures.ts` (la fixture `fixtures.metadataPpg(...)` existe déjà) pour couvrir la chaîne PPG→Axe et Chantier→Engagement dans les tests des handlers concernés (Porteur, Chantier, etc. si besoin).

Aucun test e2e n'est ajouté, cohérent avec l'absence de couverture Playwright sur les trois CRUDs de référence.

## Risques et points de vigilance

1. **Contrainte `UNIQUE` sur `engagement_short`** : jugée sans risque par le porteur du projet, mais reste une opération de migration qui peut échouer si la production diverge du seed. La requête de vérification pré-migration (section Modèle de données) doit être exécutée avant le déploiement de la migration en production.
2. **Changement de comportement du dropdown PPG dans le formulaire Chantier** : dès qu'un PPG est archivé, il disparaît des options sélectionnables pour un nouveau chantier — mais reste affiché normalement sur les chantiers existants qui le référencent déjà (le `ppg_id` en base ne change pas). À vérifier lors de la recette que ce comportement ne surprend pas les utilisateurs métier.
3. **`metadata_engagement` est vouée à disparaître avec le baromètre** : ce CRUD lui donne un cycle de vie propre en attendant, mais ne doit pas être interprété comme un signal de pérennisation de la table.
