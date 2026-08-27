# 9. Unification de la gestion des zone-groupes sur le référentiel dédié

Date : 2026-08-27

## Statut

Accepté

## Contexte

Les "zone-groupes" (regroupements de zones géographiques) sont paramétrables à
deux endroits distincts du panel administrateur, avec deux mécanismes non
synchronisés :

- `/panel-administrateur/referentiels/zonegroups` est le référentiel réel,
  adossé à la table `raw_data.metadata_zonegroup` (CRUD complet : nom,
  description, zones composant le groupe, archivage/restauration, génération
  d'ID `ZG-XXX`).
- `/panel-administrateur/parametrage-metadata-indicateur` traite le champ
  `zg_applicable` des indicateurs comme un champ générique "multi-select" du
  système de configuration de metadata. Les valeurs sélectionnables y sont
  saisies à la main (`AcceptedValuesEditor`) et stockées dans une table
  totalement distincte, `metadata_indicateur_valeur_acceptee`, sans aucun lien
  avec `metadata_zonegroup`.

Conséquence : `metadata_indicateurs.zg_applicable` est une colonne `String?`
libre, sans contrainte de clé étrangère, dont les valeurs proposées à
l'utilisateur (dans la page de configuration comme dans la fiche indicateur)
peuvent diverger du référentiel réel dès qu'un zone-groupe est créé, renommé
ou archivé via `referentiels/zonegroups` sans être répercuté manuellement dans
`parametrage-metadata-indicateur`.

À l'inverse, côté chantiers, `metadata_chantiers.zg_applicable` porte une
vraie relation Prisma vers `metadata_zonegroup.zone_group_id`, et le sélecteur
de zone-groupe de la fiche chantier (`SélecteurZonegroup`) interroge
`metadata_zonegroup` en direct via tRPC. Ce pattern est correct et ne présente
pas la divergence observée côté indicateur.

Le système générique "multi-select" (`AcceptedValuesEditor` /
`metadata_indicateur_valeur_acceptee`) reste par ailleurs légitime : il est
utilisé par une trentaine d'autres champs de configuration indicateur
(`indic_type`, `tendance`, `periodicite`, `mailles`, etc.) qui sont de
véritables énumérations libres, sans référentiel dédié. `zg_applicable` est le
seul champ aujourd'hui adossé à un vrai référentiel séparé.

Deux options ont été envisagées pour signaler ce cas particulier dans le
composant générique `MetadataFieldEditor` :

- **(A)** Un cas particulier sur le nom du champ (`name === "zg_applicable"`).
- **(B)** Un flag générique en base (`values_source: "static" | "referentiel"`
  sur `metadata_indicateur`) pour anticiper d'éventuels futurs champs
  référentiel-backed.

## Décision

Nous choisissons l'option (A) et alignons `zg_applicable` côté indicateur sur
le pattern déjà en place côté chantier.

**Modèle de données**

- Ajout d'une relation Prisma `metadata_indicateurs.zg_applicable →
  metadata_zonegroup.zone_group_id`, ainsi que sur
  `metadata_indicateurs_hidden.zg_applicable`, sur le modèle de la relation
  existante pour `metadata_chantiers`.
- Migration précédée d'une étape qui met à `NULL` toute valeur orpheline (ne
  correspondant à aucun `zone_group_id` réel) avant de poser la contrainte.
- Suppression des lignes seedées pour `metadata_indicateur_name =
  "zg_applicable"` dans `seed-metadata-indicateur.ts`, et nettoyage des lignes
  correspondantes déjà présentes en base dans
  `metadata_indicateur_valeur_acceptee`.

**Backend**

- `EnregistrerMetadataIndicateurHandler` n'écrit plus dans
  `metadata_indicateur_valeur_acceptee` pour `zg_applicable` (les 29 autres
  champs multi-select ne sont pas impactés).
- Aucun nouvel endpoint : `api.metadataZonegroup.lister` (déjà utilisé par
  `PageAdminZonegroups`) devient la source unique consommée à la fois par la
  page de configuration et par la fiche indicateur.

**Frontend — page de configuration**

- Dans `MetadataFieldEditor.tsx`, lorsque `name === "zg_applicable"`, le bloc
  `AcceptedValuesEditor` est remplacé par un nouveau composant en lecture
  seule (`ZonegroupValuesPreview`) qui affiche la liste des zone-groupes
  actifs via `api.metadataZonegroup.lister` et un lien vers
  `referentiels/zonegroups` pour les modifier. Le dropdown "Valeur par
  défaut" source également cette même liste pour ce champ. Le reste du
  formulaire (alias, description, obligatoire, visible, éditable, regex)
  reste inchangé et éditable normalement — seule la source des valeurs
  change.

**Frontend — fiche indicateur**

- Dans `SectionDétailsMetadataIndicateur.tsx`, le `listeValeur` passé au
  `MetadataChamp` de `zg_applicable` est sourcé en direct via
  `api.metadataZonegroup.lister` au lieu de `computeListeValeur` (qui lisait
  la table figée `metadata_indicateur_valeur_acceptee`). `MetadataChamp`
  lui-même n'est pas modifié.

## Conséquences

**Positives**

- Source de vérité unique pour les zone-groupes : toute création,
  modification ou archivage via `referentiels/zonegroups` se répercute
  immédiatement et sans action manuelle sur la configuration et
  l'assignation des indicateurs.
- Cohérence de modèle entre `metadata_chantiers` et `metadata_indicateurs`
  (même relation Prisma, même pattern de sélecteur live).
- Intégrité référentielle en base (FK), là où c'était auparavant une simple
  convention de nommage (`ZG-\d\d\d`) non vérifiée.
- Le mécanisme générique multi-select reste inchangé pour les 29 autres
  champs de configuration indicateur ; le changement est localisé.

**Négatives**

- Un cas particulier (`name === "zg_applicable"`) dans un composant par
  ailleurs générique (`MetadataFieldEditor`) — jugé proportionné puisqu'un
  seul champ est concerné aujourd'hui ; à réévaluer (option B) si d'autres
  champs référentiel-backed apparaissent.
- Nécessite une passe de nettoyage des données existantes (valeurs orphelines
  dans `metadata_indicateurs(_hidden).zg_applicable`, lignes obsolètes dans
  `metadata_indicateur_valeur_acceptee`) avant de poser la contrainte FK.
- Le champ `validation_regex` (`ZG-\d\d\d`) porté par `metadata_indicateur`
  pour `zg_applicable` devient redondant une fois la valeur contrainte par un
  sélecteur adossé à la FK, mais reste inoffensif s'il n'est pas retiré
  explicitement.
