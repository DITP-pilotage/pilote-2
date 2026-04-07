# PRD : Rapatriement des métadonnées PPG en local

Date : 2026-04-07

## Contexte

Aujourd'hui, les métadonnées PPG sont importées depuis un repo GitHub privé (`DITP-pilotage/PPG_metadata`) via un script Python (`data_management/scripts/2_seed_ppg_metadata.sh` + `load_static_files/load.py`). Ce script télécharge des fichiers CSV et les charge dans des tables du schema `raw_data`.

### Tables actuellement importées depuis GitHub

| Table raw_data | CSV source | Lignes | Déjà rapatriée ? |
|---|---|---|---|
| `metadata_indicateurs_hidden` | Gérée via panel admin | ~300 | **OUI** |
| `metadata_parametrage_indicateurs` | Gérée via panel admin | ~300 | **OUI** |
| `metadata_indicateurs_complementaire` | Gérée via panel admin | ~300 | **OUI** |
| `metadata_chantiers` | `views/chantier/view_meta_chantier.csv` | 168 | NON - **PRIORITE** |
| `metadata_ppgs` | `views/ppg/view_meta_ppg.csv` | 60 | NON |
| `metadata_porteurs` | `views/porteur/view_meta_porteur.csv` | 90 | NON |
| `metadata_perimetres` | `views/perimetre/view_meta_perimetre.csv` | 31 | NON |
| `metadata_zones` | `views/zone/view_meta_zone.csv` | 183 | NON |
| `metadata_zonegroup` | `models/zone/ref_zone_group.csv` | 34 | NON |
| `metadata_chantier_meteos` | `models/chantier/ref_chantier_meteo.csv` | 4 | NON |
| `metadata_engagement` | `models/chantier/ref_chantier_engagement.csv` | 5 | NON |
| `metadata_indicateur_types` | `models/indicateur/ref_indic_type.csv` | 5 | NON |
| `metadata_axes` | `views/axe/view_meta_axe.csv` | 4 | NON |

### Ce qui a déjà été fait pour les indicateurs

Mécanisme en 2 couches :

1. **Table de configuration des champs** (`public.metadata_indicateur` + `public.metadata_indicateur_valeur_acceptee`) : décrit la structure des formulaires (types de champs, validation, valeurs acceptées, visibilité, etc.). Alimentée par le seed SQL (`tests/seed/seed-metadata-indicateur.sql`) et gérable via le panel admin `/parametrage-metadata-indicateur`.

2. **Tables de données** (`raw_data.metadata_indicateurs_hidden`, etc.) : contiennent les valeurs réelles des indicateurs, éditables via le panel admin `/indicateurs/[id]`.

Le fichier `sources.yml` a servi de pont : les métadonnées YML de chaque colonne ont permis de générer la table `public.metadata_indicateur` et ses valeurs acceptées.

### Pipeline dbt impactée

Les tables `raw_data` alimentent une chaîne dbt complète :
- **Staging** : `stg_ppg_metadata__*` (renommage, nettoyage)
- **Intermediate** : jointures croisées (chantiers x territoires, indicateurs x zones, pondérations)
- **Exposition** : modèles finaux (`chantier_identite`, `indicateur_identite`, etc.)
- **Barometre** et **DF3** : vues dashboard et agrégation

## Decisions prises

- **Scope** : toutes les tables
- **Interface** : seed SQL initial + CRUD complet pour chaque table/colonne
- **Impact dbt** : transparent, les tables `raw_data` gardent la même structure
- **Migration** : dump CSV -> migration SQL, puis seed pour les paramétrages
- **Priorité** : `metadata_chantiers` en premier
- **Types de champs** : on déduit au mieux depuis les données, le client tranchera

## Approche

### Etape 0 : Markdown de définition des types de champs (ce document)

Avant de coder, on produit un markdown par table définissant pour chaque champ :
- Le type de contrôle UI (text, textarea, boolean, select, multi-select, number)
- Les valeurs acceptées le cas échéant
- Si le champ est éditable, obligatoire, visible
- La regex de validation éventuelle

**Ce markdown sert de contrat avec le client avant implémentation.**

Voir la section [Définition des champs par table](#définition-des-champs-par-table) ci-dessous.

### Etape 1 : `metadata_chantiers` (priorité)

1. Ajouter le modèle Prisma dans `raw_data` (s'il n'existe pas déjà)
2. Créer la migration SQL pour seed initial (dump des 168 lignes actuelles)
3. Créer les tables de configuration des champs (`public.metadata_chantier` + `public.metadata_chantier_valeur_acceptee`) via seed SQL
4. Créer le module serveur (domain, use cases, repository, handlers) sur le pattern `parametrage-indicateur`
5. Créer les pages panel admin : liste + formulaire d'édition
6. Créer la page de paramétrage des métadonnées chantier

### Etape 2 : Tables de référence (ppgs, porteurs, perimetres)

Même pattern que l'étape 1 pour chaque table.

### Etape 3 : Tables géographiques (zones, zonegroup)

Même pattern. Attention : `metadata_zonegroup.zg_zones` contient des listes pipe-séparées de zones.

### Etape 4 : Tables statiques (meteos, engagement, indicateur_types, axes)

Même pattern mais formulaires plus simples (peu de champs).

### Etape transverse : Nettoyage

- Supprimer le script Python `load.py` et `2_seed_ppg_metadata.sh`
- Supprimer les références au token GitHub `PPG_METADATA_GITHUB_TOKEN`
- Supprimer la dépendance `GithubRepo` dans le data_management

## Contraintes techniques

- Les tables `raw_data` doivent garder exactement la même structure pour ne pas casser le pipeline dbt
- Le schema Prisma a déjà les modèles indicateurs dans `raw_data` - il faudra ajouter les autres tables
- Le mécanisme d'historisation existe pour les indicateurs - à reproduire

---

## Définition des champs par table

> **Convention** : les types de contrôle possibles sont `text`, `textarea`, `number`, `boolean`, `select` (choix unique), `multi-select` (choix multiples). Les valeurs FK (foreign key) sont des `select` liés à une autre table.

---

### `metadata_chantiers` (168 lignes, 24 colonnes) - PRIORITE

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `chantier_id` | text | text | non | oui | `^CH-\d{3}$` | Clé primaire, format CH-XXX |
| `ch_code` | double precision | number | oui | non | | Code numérique, souvent vide |
| `ch_descr` | text | textarea | oui | non | | Description libre |
| `ch_nom` | text | text | oui | oui | | Nom complet du chantier |
| `ch_dp` | text | text | oui | non | | Directeur de projet (nom) |
| `ch_ppg` | text | select | oui | oui | FK -> `metadata_ppgs.ppg_id` (58 valeurs : PPG-1, PPG-2, ..., PPG-VET) | Lien vers la PPG |
| `ch_perseverant` | text | select | oui | non | `""`, `ACV`, `AEF`, `ANA`, `APP`, `BIO`, `DAN`, `DEI`, `DMS`, `DPC`, `DPH`, `DVO`, `EAC`, `ENP`, `GEP`, `IDA`, `IPA`, `JVQ`, `LAH`, `LAS`, `LDA`, `LVF`, `MAA`, `NIA`, `NTS`, `OFS`, `PAF`, `PED`, `PEN`, `PPN`, `PSP`, `PUU`, `PVL`, `REA`, `REL`, `REP`, `RFS`, `RLS`, `RSQ`, `RUP`, `SAJ`, `SPA`, `SUP`, `THD`, `TIG`, `UQP`, `VPA`, `ZFE` | Code reforme perseverante (47 valeurs) |
| `porteur_shorts_noDAC` | text | text | oui | non | | Liste pipe-separated (ex: `MASA \| MTECT`) |
| `porteur_ids_noDAC` | text | text | oui | non | | IDs pipe-separated (ex: `130 \| 190`), FK -> `metadata_porteurs.porteur_id` |
| `porteur_shorts_DAC` | text | text | oui | non | | Idem pour DAC |
| `porteur_ids_DAC` | text | text | oui | non | | IDs DAC pipe-separated |
| `ch_per` | text | select | oui | oui | FK -> `metadata_perimetres.perimetre_id` (28 valeurs : PER-001 a PER-031) | Perimetre ministeriel |
| `ch_dp_mail` | text | text | oui | non | format email | Email directeur de projet |
| `ch_territo` | boolean | boolean | oui | non | | Chantier territorialisé ? |
| `engagement_short` | text | select | oui | oui | `TODO`, `EMPLOI`, `PROGRES`, `TE`, `ENGAG` | FK -> `metadata_engagement.engagement_short` |
| `ch_hidden_pilote` | double precision | boolean | oui | non | `0` / `1` (actuellement tout vide) | Masqué dans Pilote |
| `ch_saisie_ate` | text | select | oui | non | `""`, `ATE`, `HORS_ATE_CENTRALISE`, `HORS_ATE_DECONCENTRE` | Mode de saisie ATE |
| `ch_state` | text | select | oui | oui | `BROUILLON`, `PUBLIE`, `ARCHIVE`, `SUPPRIME` | Etat du chantier |
| `zg_applicable` | text | select | oui | non | `""` + valeurs de `metadata_zonegroup.zone_group_id` (ZG-006, ZG-007, ..., ZG-032) | Restriction géographique |
| `maille_applicable` | text | text | oui | non | Liste pipe-separated (ex: `REG \| NAT`) | Mailles applicables |
| `ch_cible_attendue` | boolean | boolean | oui | non | | Avec cible ? |
| `replicate_val_reg_to` | text | text | oui | non | | Actuellement toujours vide |
| `replicate_val_nat_to` | text | text | oui | non | | Actuellement toujours vide |
| `conseiller_mail` | text | text | oui | non | format email | Email du conseiller |

**Points d'attention :**
- `porteur_shorts_noDAC`, `porteur_ids_noDAC`, `porteur_shorts_DAC`, `porteur_ids_DAC` : actuellement des strings pipe-separated. A terme, on pourrait vouloir un `multi-select` avec FK vers `metadata_porteurs`, mais pour l'instant on garde en `text` pour ne pas casser le format attendu par dbt.
- `maille_applicable` : idem, pipe-separated. Pourrait devenir un `multi-select` avec valeurs `DEPT`, `REG`, `NAT`.
- `ch_hidden_pilote` : type `double precision` en DB mais sémantiquement un boolean (0/1).
- `ch_perseverant` : 47 valeurs distinctes, ce sont des codes de réformes. A clarifier si c'est un select fixe ou un text libre.

---

### `metadata_ppgs` (60 lignes, 7 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `ppg_id` | text | text | non | oui | `^PPG-\w+$` | Clé primaire |
| `ppg_axe` | text | select | oui | oui | `EMPLOI`, `ENGAG`, `PROGRES`, `TE` | FK -> `metadata_axes.axe_id` |
| `ppg_code` | text | text | oui | non | | Actuellement toujours vide |
| `ppg_desc` | text | textarea | oui | non | | Description |
| `ppg_nom` | text | text | oui | oui | | Nom de la PPG |
| `porteur_shorts` | text | text | oui | non | | Pipe-separated, souvent vide |
| `porteur_ids` | text | text | oui | non | | Pipe-separated, souvent vide |

---

### `metadata_porteurs` (90 lignes, 10 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `porteur_id` | bigint | number | non | oui | | Clé primaire |
| `porteur_short` | text | text | oui | oui | | Acronyme (MASA, MTECT, DGPE...) |
| `porteur_name` | text | text | oui | oui | | Nom complet |
| `porteur_desc` | text | textarea | oui | non | | Description |
| `porteur_type_id` | bigint | select | oui | oui | `1` (Ministere), `4` (Delegation interministerielle), `5` (Autre), `7` (DAC/Delegation) | Type de porteur |
| `porteur_type_short` | text | select | oui | oui | `MIN`, `DI`, `DAC`, `AUTRE` | Redondant avec type_id |
| `porteur_type_name` | text | text | oui | oui | | Redondant avec type_id |
| `porteur_directeur` | text | text | oui | non | | Nom du directeur |
| `porteur_name_short` | text | text | oui | non | | Nom court |
| `porteur_picto` | text | text | oui | non | | Icone (format `lib::name::variant`) |

**Point d'attention :** Les champs `porteur_type_id/short/name` sont redondants. Ils representent une même notion de "type de porteur". A terme, `porteur_type_id` serait la FK et les autres seraient calculés. Pour l'instant on garde les 3 champs.

---

### `metadata_perimetres` (31 lignes, 7 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `perimetre_id` | text | text | non | oui | `^PER-\d{3}$` | Clé primaire |
| `per_nom` | text | text | oui | oui | | Nom du perimetre |
| `per_short` | text | text | oui | non | | Acronyme |
| `per_picto` | double precision | text | oui | non | | Actuellement toujours vide/null |
| `per_porteur_id` | double precision | select | oui | oui | FK -> `metadata_porteurs.porteur_id` | Porteur associé |
| `per_porteur_name_short` | text | text | non | non | | Déduit du porteur, toujours "-" |
| `per_top_dfakto` | text | text | oui | non | | Nom pour Dfakto |

---

### `metadata_zones` (183 lignes, 5 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `zone_id` | text | text | non | oui | | Clé primaire (D01, R11, FRANCE, A01, FM01...) |
| `nom` | text | text | oui | oui | | Nom de la zone |
| `zone_code` | text | text | oui | non | | Code (01, 11, ...) |
| `zone_type` | text | select | oui | oui | `DEPT`, `REG`, `NAT`, `ACAD`, `FM`, `PORT`, `ZFE` | Type de zone |
| `zone_parent` | text | select | oui | non | FK -> `metadata_zones.zone_id` | Zone parent (auto-reference) |

---

### `metadata_zonegroup` (34 lignes, 4 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `zone_group_id` | text | text | non | oui | `^ZG-\w+$` | Clé primaire |
| `zg_name` | text | text | oui | oui | | Nom du groupement |
| `zg_desc` | text | textarea | oui | non | | Description |
| `zg_zones` | text | textarea | oui | oui | | Liste pipe-separated de zone_ids. Ex: `D01 \| D02 \| R11`. A terme pourrait etre un multi-select FK -> metadata_zones |

---

### `metadata_chantier_meteos` (4 lignes, 4 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `ch_meteo_id` | text | text | non | oui | | Clé primaire (SOLEIL, COUVERT, NUAGE, ORAGE) |
| `ch_meteo_name` | text | text | oui | oui | | Nom affiché |
| `ch_meteo_descr` | text | textarea | oui | non | | Description |
| `ch_meteo_name_dfakto` | text | text | oui | non | | Nom Dfakto |

---

### `metadata_engagement` (5 lignes, 4 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `engagement_id` | bigint | number | non | oui | | Clé primaire |
| `engagement_short` | text | text | oui | oui | | Code court (EMPLOI, PROGRES, TE, ENGAG, TODO) |
| `engagement_name` | text | text | oui | oui | | Nom complet |
| `engagement_desc` | text | textarea | oui | non | | Description |

---

### `metadata_indicateur_types` (5 lignes, 4 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `indic_type_id` | text | text | non | oui | | Clé primaire (IMPACT, DEPL, Q_SERV, REBOND, CONTEXTE) |
| `indic_type_name` | text | text | oui | oui | | Nom complet |
| `indic_type_descr` | text | textarea | oui | non | | Description |
| `indic_type_rank` | text | select | oui | oui | `PRINCIPAL`, `COMPLEMENTAIRE` | Rang |

---

### `metadata_axes` (4 lignes, 4 colonnes)

| Champ | Type DB | Type UI proposé | Editable | Obligatoire | Valeurs acceptées / Validation | Notes |
|---|---|---|---|---|---|---|
| `axe_id` | text | text | non | oui | | Clé primaire (EMPLOI, TE, PROGRES, ENGAG) |
| `axe_short` | text | text | oui | oui | | Nom court |
| `axe_name` | text | text | oui | oui | | Nom complet |
| `axe_desc` | text | textarea | oui | non | | Description |
