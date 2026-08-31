# Spec : clés étrangères entre `metadata_indicateurs_hidden` et ses tables d'extension

Date : 2026-08-31

## Contexte

La PR #2356 (onglet pondérations des indicateurs) a mis en lumière une duplication de logique entre le client et le serveur : `CHAMP_POIDS_PAR_MAILLE` et le calcul des sommes par maille sont réécrits indépendamment dans `usePonderationsIndicateursForm.ts` et `EnregistrerPonderationsIndicateursHandler.ts`. Cette duplication vient en partie du fait que `RecupererIndicateursPonderationsChantierQuery` et `EnregistrerPonderationsIndicateursHandler` doivent chacun reconstruire manuellement la jointure entre trois tables `raw_data` (`metadata_indicateurs_hidden`, `metadata_indicateurs_complementaire`, `metadata_parametrage_indicateurs`) via des `findMany` séparés + des `Map` en mémoire, faute de relation Prisma déclarée entre elles.

Cette spec documente la mise en place de clés étrangères (FK) entre ces trois tables et des relations Prisma associées, pour permettre une jointure native (`include`) à la place des jointures manuelles actuelles.

## Objectif

Déclarer `metadata_indicateurs_complementaire.indic_id` et `metadata_parametrage_indicateurs.indic_id` comme clés étrangères vers `metadata_indicateurs_hidden.indic_id`, et exposer les relations Prisma correspondantes, afin de simplifier les requêtes qui joignent aujourd'hui ces tables à la main.

---

## État actuel

Les trois tables vivent dans le schéma `raw_data` et sont alimentées par deux sources :

- un pipeline externe **dlt**, non présent dans ce repo (décrit dans `apps/pilote-ppg-data-management/models/staging/import/sources.yml` comme *"Tables de métadonnées PPG chargées dans le schema raw_data (dlt + paramétrage indicateurs)"*) — comportement de chargement (transaction unique ou non, ordre garanti ou non) **inconnu depuis ce repo** ;
- le module applicatif `parametrage-indicateur` (`PrismaMetadataParametrageIndicateurRepository.creer()`), qui insère déjà dans l'ordre `hidden` → `parametrage` → `complementaire`, dans un seul `prisma.$transaction([...])`.

`metadata_indicateurs_hidden` contient tous les indicateurs (masqués et non masqués) et sert de table pilote dans le code actuel : `RecupererIndicateursPonderationsChantierQuery` et `EnregistrerPonderationsIndicateursHandler` traitent `complementaire` et `parametrage` comme des extensions optionnelles (`complémentaire?.indic_territorialise ?? false`), jamais l'inverse.

Aucune suppression de lignes `indic_id` n'est faite côté application (pas de `DELETE`/`TRUNCATE` trouvé sur ces tables dans `apps/pilote-ppg`) — seul le pipeline externe peut en supprimer.

### Précédent dans ce repo

La migration `20260827000000_fk_zg_applicable_indicateurs` a déjà posé une FK sur une table `raw_data` (`metadata_indicateurs.zg_applicable → metadata_zonegroup.zone_group_id`), précédée d'un nettoyage des valeurs orphelines :

```sql
UPDATE "raw_data"."metadata_indicateurs"
SET "zg_applicable" = NULL
WHERE "zg_applicable" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "raw_data"."metadata_zonegroup" AS zonegroup
    WHERE zonegroup."zone_group_id" = "metadata_indicateurs"."zg_applicable"
  );
```

Cette spec reprend le même pattern.

---

## Proposition

### Direction des FK

```
metadata_indicateurs_complementaire.indic_id  →  metadata_indicateurs_hidden.indic_id
metadata_parametrage_indicateurs.indic_id     →  metadata_indicateurs_hidden.indic_id
```

Les tables d'extension référencent la table hub. Une ligne `complementaire`/`parametrage` peut être absente (relation 1 → 0..1), mais si elle existe, son `indic_id` doit correspondre à une ligne `hidden`.

### Contraintes SQL

```sql
ALTER TABLE "raw_data"."metadata_indicateurs_complementaire"
ADD CONSTRAINT "fk_indicateur_complementaire_hidden" FOREIGN KEY ("indic_id")
REFERENCES "raw_data"."metadata_indicateurs_hidden" ("indic_id") DEFERRABLE INITIALLY DEFERRED;

ALTER TABLE "raw_data"."metadata_parametrage_indicateurs"
ADD CONSTRAINT "fk_indicateur_parametrage_hidden" FOREIGN KEY ("indic_id")
REFERENCES "raw_data"."metadata_indicateurs_hidden" ("indic_id") DEFERRABLE INITIALLY DEFERRED;
```

`DEFERRABLE INITIALLY DEFERRED` : la contrainte n'est vérifiée qu'au `COMMIT`, pas à chaque `INSERT`. Ça protège un chargement qui insérerait les trois tables dans le désordre **à l'intérieur d'une même transaction**. Ça ne protège pas un chargement qui ferait trois transactions séparées, une par table — voir « Point ouvert bloquant » ci-dessous.

### Relations Prisma (`schema.prisma`)

```prisma
model metadata_indicateurs_hidden {
  indic_id      String   @id
  // ... champs existants ...

  complementaire metadata_indicateurs_complementaire?
  parametrage    metadata_parametrage_indicateurs?
}

model metadata_indicateurs_complementaire {
  indic_id String @id
  // ... champs existants ...

  hidden metadata_indicateurs_hidden @relation(fields: [indic_id], references: [indic_id])
}

model metadata_parametrage_indicateurs {
  indic_id String @id
  // ... champs existants ...

  hidden metadata_indicateurs_hidden @relation(fields: [indic_id], references: [indic_id])
}
```

### Simplification des requêtes

`RecupererIndicateursPonderationsChantierQuery.run` passe de 3 requêtes + 2 `Map` à une seule requête avec `include` :

```typescript
const indicateurs = await instance.metadata_indicateurs_hidden.findMany({
  where: { indic_parent_ch: chantierId },
  orderBy: { indic_nom: "asc" },
  include: { complementaire: true, parametrage: true },
});

return indicateurs.map((indicateur) => ({
  indicId: indicateur.indic_id,
  indicNom: indicateur.indic_nom,
  maillesApplicables: calculerMaillesApplicablesIndicateur(
    indicateur.complementaire?.indic_territorialise ?? false,
    indicateur.complementaire?.mailles ?? null,
  ),
  poidsPourcentDept: indicateur.parametrage?.poids_pourcent_dept_declaree ?? null,
  poidsPourcentReg: indicateur.parametrage?.poids_pourcent_reg_declaree ?? null,
  poidsPourcentNat: indicateur.parametrage?.poids_pourcent_nat_declaree ?? null,
}));
```

Même simplification applicable à `EnregistrerPonderationsIndicateursHandler.execute` (le `findMany` sur `metadata_indicateurs_complementaire` seul peut être remplacé par un `include` si le handler charge aussi `hidden`, à évaluer selon la forme finale du handler à ce moment-là).

---

## Plan de mise en œuvre

1. **Audit préalable en base de production** — exécuter les requêtes suivantes et statuer sur les lignes orphelines trouvées (les supprimer, comme dans la migration `zg_applicable`, ou les investiguer si le volume est significatif) :
   ```sql
   SELECT c.indic_id FROM raw_data.metadata_indicateurs_complementaire c
   WHERE NOT EXISTS (SELECT 1 FROM raw_data.metadata_indicateurs_hidden h WHERE h.indic_id = c.indic_id);

   SELECT p.indic_id FROM raw_data.metadata_parametrage_indicateurs p
   WHERE NOT EXISTS (SELECT 1 FROM raw_data.metadata_indicateurs_hidden h WHERE h.indic_id = p.indic_id);
   ```
   Sur les fixtures de test (`tests/seed/raw_data/*.csv`), les trois tables sont parfaitement alignées (21/21/21, zéro orphelin) — ça ne présage pas de l'état de la prod, qui est alimentée par le pipeline externe depuis plus longtemps.

2. **Valider le comportement du chargement `dlt`** avec l'équipe qui possède ce pipeline (hors de ce repo) : chargement transactionnel ou non, ordre `hidden` avant les tables d'extension ou non. Si le chargement n'est pas transactionnel entre les tables, `DEFERRABLE` ne suffit pas et il faut d'abord rendre ce chargement atomique côté pipeline avant de poser les FK.

3. **Migration** — nettoyage des orphelins (si trouvés à l'étape 1) puis `ALTER TABLE ... ADD CONSTRAINT` comme ci-dessus, sur le modèle de `20260827000000_fk_zg_applicable_indicateurs`.

4. **Relations Prisma** — ajout dans `schema.prisma`, régénération du client Prisma.

5. **Refactor** — `RecupererIndicateursPonderationsChantierQuery` et `EnregistrerPonderationsIndicateursHandler` passent sur `include` ; suppression des `Map` de jointure manuelle devenues inutiles.

---

## Risques

| Risque | Mitigation |
|---|---|
| Lignes orphelines en prod dans `complementaire`/`parametrage` | Audit étape 1 avant migration ; suppression ou investigation au cas par cas |
| Chargement `dlt` non transactionnel entre les 3 tables | `DEFERRABLE` insuffisant dans ce cas ; nécessite un changement côté pipeline externe, hors périmètre de cette spec |
| Futur import qui réinsère `complementaire`/`parametrage` avant `hidden` dans le même run | Couvert par `DEFERRABLE INITIALLY DEFERRED` tant que le run est dans une seule transaction |

---

## Tests à écrire

- Test d'intégration sur `RecupererIndicateursPonderationsChantierQuery` : un indicateur `hidden` sans ligne `complementaire`/`parametrage` associée retourne bien des valeurs par défaut (`maillesApplicables: ["NAT"]`, poids à `null`) — comportement à préserver après le passage à `include`.
- Test de la migration (ou vérification manuelle) : une tentative d'insertion dans `complementaire`/`parametrage` avec un `indic_id` absent de `hidden` doit être rejetée par la contrainte.

---

## Fichiers à créer / modifier

| Action | Fichier |
|---|---|
| Créer | migration Prisma `xxxxx_fk_extensions_indicateurs_hidden/migration.sql` |
| Modifier | `src/database/prisma/schema.prisma` — relations `complementaire`/`parametrage` sur `metadata_indicateurs_hidden` |
| Modifier | `src/server/metadataChantier/queries/RecupererIndicateursPonderationsChantierQuery.ts` — passage à `include` |
| Modifier | `src/server/metadataChantier/handlers/EnregistrerPonderationsIndicateursHandler.ts` — passage à `include` si pertinent |

---

## Point ouvert bloquant

**Comportement du pipeline `dlt`** : sans confirmation que le chargement des 3 tables `raw_data` concernées se fait dans une transaction unique (ou du moins dans un ordre `hidden` avant extensions), la pose de ces FK risque de casser le prochain run d'ingestion. À valider avec l'équipe propriétaire du pipeline avant d'implémenter la migration.
