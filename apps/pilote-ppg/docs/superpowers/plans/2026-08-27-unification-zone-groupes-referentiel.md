# Unification zone-groupes indicateur / référentiel — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire de `metadata_zonegroup` (référentiel `referentiels/zonegroups`) l'unique source de vérité pour les zone-groupes des indicateurs, en remplaçant le mécanisme de saisie libre actuellement utilisé sur `parametrage-metadata-indicateur` pour le champ `zg_applicable`.

**Architecture:** `zg_applicable` sort du système générique "multi-select à valeurs libres" (`AcceptedValuesEditor` / `metadata_indicateur_valeur_acceptee`) et devient adossé, comme côté chantier, à une vraie contrainte de clé étrangère Prisma vers `metadata_zonegroup`. La page de configuration affiche une liste en lecture seule sourcée en direct sur `metadata_zonegroup`, et la fiche indicateur lit ses valeurs sélectionnables depuis la même source via `RécupérerInformationMetadataIndicateurUseCase`.

**Tech Stack:** Next.js 14, tRPC, Prisma 6, PostgreSQL (schéma `raw_data`), Zustand/react-hook-form côté client, Vitest (`server-unit`/`server-integration`/`client`), Playwright (e2e).

**Spec:** `apps/pilote-ppg/docs/architecture/decisions/0009-unification-zone-groupes-referentiel.md`

## Global Constraints

- Le mécanisme générique multi-select (`AcceptedValuesEditor` / `metadata_indicateur_valeur_acceptee`) doit rester inchangé pour tous les champs autres que `zg_applicable` (~29 autres champs de configuration indicateur).
- Le cas particulier `zg_applicable` est signalé par un test sur le nom du champ (`name === "zg_applicable"`), pas par un flag générique en base (YAGNI — un seul champ concerné aujourd'hui).
- Toute valeur orpheline de `zg_applicable` (y compris chaîne vide `""`, héritée de l'ancienne option "Toutes zones") doit être normalisée à `NULL` avant la pose de la contrainte FK, car Postgres ne laisse passer que `NULL`, pas `''`, à travers une FK.
- `metadata_indicateurs` (non-hidden) n'est jamais écrit par le code de ce repo (aucun `.create`/`.update`/`.upsert` trouvé hors tests) — il est alimenté par un processus externe à `pilote-ppg`. La contrainte FK y est ajoutée quand même (cohérence de modèle voulue par l'ADR), mais toute écriture externe future avec une valeur `zg_applicable` invalide échouera désormais au niveau de la contrainte : à signaler au propriétaire de ce processus externe.
- `metadata_indicateurs_hidden` est écrit par ce repo (formulaire admin + import CSV de masse) ; les deux chemins d'écriture (`server/infrastructure/api/trpc/routes/metadataIndicateur.ts:119` et `server/parametrage-indicateur/usecases/ImportMasseMetadataIndicateurUseCase.ts:48`) normalisent déjà `"" -> null` avant d'atteindre le repository — aucune modification de code applicatif n'est nécessaire pour ce chemin.
- Ne jamais lancer les tests soi-même : indiquer les commandes à l'utilisateur, qui les exécute lui-même (convention du projet).

---

### Task 1: Contrainte FK `zg_applicable → metadata_zonegroup` sur `metadata_indicateurs`/`metadata_indicateurs_hidden`

**Files:**
- Modify: `apps/pilote-ppg/src/database/prisma/schema.prisma:366-412` (modèles `metadata_indicateurs` et `metadata_indicateurs_hidden`)
- Modify: `apps/pilote-ppg/src/database/prisma/schema.prisma:608-619` (modèle `metadata_zonegroup`, relations inverses)
- Create: `apps/pilote-ppg/src/database/prisma/migrations/20260827000000_fk_zg_applicable_indicateurs/migration.sql`
- Test: `apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/infrastructure/metadata-indicateurs-zonegroup-fk.integration.test.ts`

**Interfaces:**
- Produces: relation Prisma `metadata_indicateurs.zonegroup` / `metadata_indicateurs_hidden.zonegroup` (type `metadata_zonegroup | null`), consommable par tout code futur mais non utilisée directement par les tâches suivantes.

- [ ] **Step 1: Écrire le test qui doit échouer**

Créer `apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/infrastructure/metadata-indicateurs-zonegroup-fk.integration.test.ts` :

```ts
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db/prisma";

describe("Contrainte FK metadata_indicateurs(_hidden).zg_applicable -> metadata_zonegroup", () => {
  beforeEach(async () => {
    await prisma.metadata_zonegroup.create({
      data: {
        zone_group_id: "ZG-TEST-FK",
        zg_name: "Zone de test FK",
      },
    });
  });

  it("accepte un indicateur dont zg_applicable référence un zone-groupe existant", async () => {
    const indicateur = await prisma.metadata_indicateurs.create({
      data: {
        indic_id: "IND-TEST-FK-1",
        indic_parent_ch: "CH-TEST",
        indic_nom: "Indicateur de test",
        zg_applicable: "ZG-TEST-FK",
      },
    });

    expect(indicateur.zg_applicable).toBe("ZG-TEST-FK");
  });

  it("accepte un indicateur sans zone-groupe (zg_applicable null)", async () => {
    const indicateur = await prisma.metadata_indicateurs.create({
      data: {
        indic_id: "IND-TEST-FK-2",
        indic_parent_ch: "CH-TEST",
        indic_nom: "Indicateur de test",
        zg_applicable: null,
      },
    });

    expect(indicateur.zg_applicable).toBeNull();
  });

  it("rejette un indicateur dont zg_applicable référence un zone-groupe inexistant", async () => {
    await expect(
      prisma.metadata_indicateurs.create({
        data: {
          indic_id: "IND-TEST-FK-3",
          indic_parent_ch: "CH-TEST",
          indic_nom: "Indicateur de test",
          zg_applicable: "ZG-INEXISTANT",
        },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });

  it("rejette un indicateur caché dont zg_applicable référence un zone-groupe inexistant", async () => {
    await expect(
      prisma.metadata_indicateurs_hidden.create({
        data: {
          indic_id: "IND-TEST-FK-HIDDEN-1",
          indic_parent_ch: "CH-TEST",
          indic_nom: "Indicateur caché de test",
          zg_applicable: "ZG-INEXISTANT",
        },
      }),
    ).rejects.toThrow(Prisma.PrismaClientKnownRequestError);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Demander à l'utilisateur de lancer :
`pnpm --filter pilote-ppg exec vitest run --project server-integration metadata-indicateurs-zonegroup-fk`

Résultat attendu : les deux premiers tests passent déjà (aucune contrainte n'existe encore, donc rien ne bloque une valeur valide), mais les deux tests `rejette...` ÉCHOUENT car l'insertion réussit alors qu'on attend qu'elle lève une erreur — la contrainte FK n'existe pas encore.

- [ ] **Step 3: Ajouter la relation Prisma sur `metadata_indicateurs` et `metadata_indicateurs_hidden`**

Dans `apps/pilote-ppg/src/database/prisma/schema.prisma`, remplacer :

```prisma
model metadata_indicateurs {
  indic_id             String   @id
  indic_parent_indic   String?
  indic_parent_ch      String
  indic_nom            String
  indic_nom_baro       String?
  indic_descr          String?
  indic_descr_baro     String?
  indic_is_perseverant Boolean?
  indic_is_phare       Boolean?
  indic_is_baro        Boolean?
  indic_type           String?
  indic_source         String?
  indic_source_url     String?
  indic_methode_calcul String?
  indic_unite          String?
  indic_hidden_pilote  Boolean?
  indic_schema         String?
  zg_applicable        String?
  indic_territorialise Boolean?
  mailles              String?

  @@schema("raw_data")
}

model metadata_indicateurs_hidden {
  indic_id             String   @id
  indic_parent_indic   String?
  indic_parent_ch      String
  indic_nom            String
  indic_nom_baro       String?
  indic_descr          String?
  indic_descr_baro     String?
  indic_is_perseverant Boolean?
  indic_is_phare       Boolean?
  indic_is_baro        Boolean?
  indic_type           String?
  indic_source         String?
  indic_source_url     String?
  indic_methode_calcul String?
  indic_unite          String?
  indic_hidden_pilote  Boolean?
  indic_schema         String?
  zg_applicable        String?

  @@schema("raw_data")
}
```

par :

```prisma
model metadata_indicateurs {
  indic_id             String   @id
  indic_parent_indic   String?
  indic_parent_ch      String
  indic_nom            String
  indic_nom_baro       String?
  indic_descr          String?
  indic_descr_baro     String?
  indic_is_perseverant Boolean?
  indic_is_phare       Boolean?
  indic_is_baro        Boolean?
  indic_type           String?
  indic_source         String?
  indic_source_url     String?
  indic_methode_calcul String?
  indic_unite          String?
  indic_hidden_pilote  Boolean?
  indic_schema         String?
  zg_applicable        String?
  indic_territorialise Boolean?
  mailles              String?

  zonegroup metadata_zonegroup? @relation(fields: [zg_applicable], references: [zone_group_id])

  @@schema("raw_data")
}

model metadata_indicateurs_hidden {
  indic_id             String   @id
  indic_parent_indic   String?
  indic_parent_ch      String
  indic_nom            String
  indic_nom_baro       String?
  indic_descr          String?
  indic_descr_baro     String?
  indic_is_perseverant Boolean?
  indic_is_phare       Boolean?
  indic_is_baro        Boolean?
  indic_type           String?
  indic_source         String?
  indic_source_url     String?
  indic_methode_calcul String?
  indic_unite          String?
  indic_hidden_pilote  Boolean?
  indic_schema         String?
  zg_applicable        String?

  zonegroup metadata_zonegroup? @relation(fields: [zg_applicable], references: [zone_group_id])

  @@schema("raw_data")
}
```

- [ ] **Step 4: Ajouter les relations inverses sur `metadata_zonegroup`**

Remplacer :

```prisma
model metadata_zonegroup {
  zone_group_id String    @id
  zg_name       String
  zg_desc       String?
  zg_zones      String[]
  created_at    DateTime  @default(now()) @db.Timestamptz
  updated_at    DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at    DateTime? @db.Timestamptz
  chantiers     metadata_chantiers[]

  @@schema("raw_data")
}
```

par :

```prisma
model metadata_zonegroup {
  zone_group_id     String    @id
  zg_name           String
  zg_desc           String?
  zg_zones          String[]
  created_at        DateTime  @default(now()) @db.Timestamptz
  updated_at        DateTime  @default(now()) @updatedAt @db.Timestamptz
  deleted_at        DateTime? @db.Timestamptz
  chantiers         metadata_chantiers[]
  indicateurs       metadata_indicateurs[]
  indicateursHidden metadata_indicateurs_hidden[]

  @@schema("raw_data")
}
```

- [ ] **Step 5: Écrire la migration SQL (nettoyage des orphelins + contrainte)**

Créer le dossier `apps/pilote-ppg/src/database/prisma/migrations/20260827000000_fk_zg_applicable_indicateurs/` avec un fichier `migration.sql` :

```sql
-- Nettoyage préalable : toute valeur de zg_applicable qui ne correspond à
-- aucun zone-groupe réel (ancien mécanisme de saisie libre, y compris la
-- chaîne vide historique de l'option "Toutes zones") est mise à NULL avant
-- la pose de la contrainte de clé étrangère.
UPDATE "raw_data"."metadata_indicateurs"
SET "zg_applicable" = NULL
WHERE "zg_applicable" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "raw_data"."metadata_zonegroup" AS zonegroup
    WHERE zonegroup."zone_group_id" = "metadata_indicateurs"."zg_applicable"
  );

UPDATE "raw_data"."metadata_indicateurs_hidden"
SET "zg_applicable" = NULL
WHERE "zg_applicable" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM "raw_data"."metadata_zonegroup" AS zonegroup
    WHERE zonegroup."zone_group_id" = "metadata_indicateurs_hidden"."zg_applicable"
  );

-- Contraintes de clé étrangère, sur le modèle de fk_chantier_zonegroup
-- (migration 20260806100000_metadata_chantiers_array_fields)
ALTER TABLE "raw_data"."metadata_indicateurs"
ADD CONSTRAINT "fk_indicateur_zonegroup" FOREIGN KEY ("zg_applicable") REFERENCES "raw_data"."metadata_zonegroup" ("zone_group_id");

ALTER TABLE "raw_data"."metadata_indicateurs_hidden"
ADD CONSTRAINT "fk_indicateur_hidden_zonegroup" FOREIGN KEY ("zg_applicable") REFERENCES "raw_data"."metadata_zonegroup" ("zone_group_id");
```

- [ ] **Step 6: Appliquer la migration**

Demander à l'utilisateur de lancer, depuis `apps/pilote-ppg` :
`pnpm database:migration`

Prisma doit détecter que le schéma et la migration écrite à la main sont cohérents et l'appliquer sans proposer d'en générer une nouvelle. Si un écart est signalé, revérifier que les deux blocs de schéma (Step 3/4) correspondent exactement au SQL (Step 5).

- [ ] **Step 7: Relancer le test pour vérifier qu'il passe**

Demander à l'utilisateur de relancer :
`pnpm --filter pilote-ppg exec vitest run --project server-integration metadata-indicateurs-zonegroup-fk`

Résultat attendu : les 4 tests passent.

- [ ] **Step 8: Commit**

```bash
git add apps/pilote-ppg/src/database/prisma/schema.prisma
git add apps/pilote-ppg/src/database/prisma/migrations/20260827000000_fk_zg_applicable_indicateurs
git add apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/infrastructure/metadata-indicateurs-zonegroup-fk.integration.test.ts
git commit -m "feat(ppg-metadata): ajoute la contrainte FK zg_applicable -> metadata_zonegroup"
```

---

### Task 2: `EnregistrerMetadataIndicateurHandler` n'écrit plus les valeurs acceptées pour `zg_applicable`, et nettoyage du seed

**Files:**
- Modify: `apps/pilote-ppg/src/server/parametrage-indicateur/handlers/EnregistrerMetadataIndicateurHandler.ts:76-141`
- Modify: `apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/handlers/EnregistrerMetadataIndicateurHandler.integration.test.ts`
- Modify: `apps/pilote-ppg/src/database/prisma/seed-metadata-indicateur.ts:1290-1487` (suppression du bloc `zg_applicable`)
- Modify: `apps/pilote-ppg/tests/seed/seed-metadata-indicateur.sql:116-149` (idem, seed e2e)

**Interfaces:**
- Consumes: rien de nouveau (le handler garde sa signature `execute(command: EnregistrerMetadataIndicateurCommand): Promise<void>` inchangée).
- Produces: pour `metadata.name === "zg_applicable"`, `metadata_indicateur_valeur_acceptee` n'est plus ni vidée ni réécrite par ce handler ; pour tous les autres champs, comportement strictement identique.

- [ ] **Step 1: Écrire le test qui doit échouer**

Ajouter dans `apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/handlers/EnregistrerMetadataIndicateurHandler.integration.test.ts`, à l'intérieur du `describe("execute", ...)`, après le test `"doit remplacer les valeurs acceptées lors d'une mise à jour"` :

```ts
    it("ne touche pas aux valeurs acceptées existantes de zg_applicable (source = référentiel zonegroup)", async () => {
      // Given - zg_applicable existe avec des valeurs acceptées héritées de l'ancien mécanisme
      await prisma.metadata_indicateur.create({
        data: {
          name: "zg_applicable",
          data_type: "text",
          description: "Zone-group applicable",
          est_visible: true,
          alias: "Restriction géographique",
          est_editable: true,
          validation_regex: "",
          validation_regex_error_message: null,
          edit_box_type: "multi-select",
          default_value: null,
          est_obligatoire: false,
          doit_afficher_la_description: false,
          groupe: "METADATA_INDICATEURS",
          bloc_id: null,
          valeurs_acceptees: {
            create: [
              {
                ordre: 1,
                valeur: "ZG-001",
                nom: "Groupement 1",
                description: "Ancienne valeur héritée",
              },
            ],
          },
        },
      });

      const command = {
        metadataList: [
          {
            name: "zg_applicable",
            dataType: "text" as const,
            description: "Zone-group applicable (modifiée)",
            estVisible: true,
            alias: "Restriction géographique",
            estEditable: true,
            validationRegex: "",
            validationRegexErrorMessage: null,
            editBoxType: "multi-select" as const,
            defaultValue: null,
            estObligatoire: false,
            doitAfficherLaDescription: false,
            listeValeursAcceptes: [],
            groupe: "METADATA_INDICATEURS" as const,
            blocId: null,
          },
        ],
      };

      // When
      await handler.execute(command);

      // Then - les propriétés génériques sont mises à jour...
      const metadata = await prisma.metadata_indicateur.findUnique({
        where: { name: "zg_applicable" },
        include: { valeurs_acceptees: true },
      });
      expect(metadata?.description).toBe("Zone-group applicable (modifiée)");

      // ...mais les valeurs acceptées héritées ne sont pas supprimées
      expect(metadata?.valeurs_acceptees).toHaveLength(1);
      expect(metadata?.valeurs_acceptees[0]).toMatchObject({
        valeur: "ZG-001",
        nom: "Groupement 1",
      });
    });
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Demander à l'utilisateur de lancer :
`pnpm --filter pilote-ppg exec vitest run --project server-integration EnregistrerMetadataIndicateurHandler`

Résultat attendu : le nouveau test échoue sur `expect(metadata?.valeurs_acceptees).toHaveLength(1)` — le handler actuel supprime et ne recrée aucune ligne (puisque `listeValeursAcceptes` est vide), donc la longueur observée est `0`.

- [ ] **Step 3: Modifier le handler pour ignorer `zg_applicable`**

Dans `apps/pilote-ppg/src/server/parametrage-indicateur/handlers/EnregistrerMetadataIndicateurHandler.ts`, remplacer :

```ts
      // Upsert chaque métadonnée
      for (const metadata of command.metadataList) {
        // D'abord, supprimer les valeurs acceptées existantes pour cette métadonnée
        await prisma.metadata_indicateur_valeur_acceptee.deleteMany({
          where: {
            metadata_indicateur_name: metadata.name,
          },
        });
```

par :

```ts
      // Upsert chaque métadonnée
      for (const metadata of command.metadataList) {
        // zg_applicable est adossé au référentiel metadata_zonegroup (voir
        // referentiels/zonegroups) : ses valeurs sélectionnables ne passent
        // plus par ce mécanisme générique de saisie libre.
        const gèreSesValeursViaLeRéférentielZonegroup =
          metadata.name === "zg_applicable";

        if (!gèreSesValeursViaLeRéférentielZonegroup) {
          // D'abord, supprimer les valeurs acceptées existantes pour cette métadonnée
          await prisma.metadata_indicateur_valeur_acceptee.deleteMany({
            where: {
              metadata_indicateur_name: metadata.name,
            },
          });
        }
```

et remplacer :

```ts
        // Créer les nouvelles valeurs acceptées
        if (metadata.listeValeursAcceptes.length > 0) {
          await prisma.metadata_indicateur_valeur_acceptee.createMany({
            data: metadata.listeValeursAcceptes.map((valeur) => ({
              metadata_indicateur_name: metadata.name,
              ordre: valeur.ordre,
              valeur: valeur.valeur,
              nom: valeur.nom,
              description: valeur.description,
            })),
          });
        }
```

par :

```ts
        // Créer les nouvelles valeurs acceptées
        if (
          !gèreSesValeursViaLeRéférentielZonegroup &&
          metadata.listeValeursAcceptes.length > 0
        ) {
          await prisma.metadata_indicateur_valeur_acceptee.createMany({
            data: metadata.listeValeursAcceptes.map((valeur) => ({
              metadata_indicateur_name: metadata.name,
              ordre: valeur.ordre,
              valeur: valeur.valeur,
              nom: valeur.nom,
              description: valeur.description,
            })),
          });
        }
```

- [ ] **Step 4: Relancer le test pour vérifier qu'il passe**

Demander à l'utilisateur de relancer :
`pnpm --filter pilote-ppg exec vitest run --project server-integration EnregistrerMetadataIndicateurHandler`

Résultat attendu : tous les tests du fichier passent, y compris le nouveau.

- [ ] **Step 5: Nettoyer le seed de configuration (`seed-metadata-indicateur.ts`)**

Dans `apps/pilote-ppg/src/database/prisma/seed-metadata-indicateur.ts`, supprimer le bloc de 27 valeurs acceptées codées en dur pour `zg_applicable` (lignes ~1290-1487), en conservant la définition générique du champ (lignes ~294-311, INCHANGÉE). Supprimer précisément ce bloc (avec sa ligne blanche de fin, pour ne garder qu'une seule ligne blanche de séparation) :

```ts
  // zg_applicable - Restrictions géographiques (liste complète)
  {
    metadata_indicateur_name: "zg_applicable",
    ordre: 1,
    valeur: "",
    nom: "Toutes zones",
    description: "Toutes zones",
  },
```
... (et les 26 objets suivants jusqu'à `ordre: 27` / `"ZG-027"`) ...
```ts
  {
    metadata_indicateur_name: "zg_applicable",
    ordre: 27,
    valeur: "ZG-027",
    nom: "Toutes zones sauf Corse",
    description: "Tous départements et régions sauf Corse",
  },

```

Le fichier doit passer directement de la fin du bloc `indic_schema` (`ordre: 4`, `"restrict-0-100.json"`) au début du bloc `// vi_dept_from, va_dept_from, vc_dept_from`, séparés par une seule ligne blanche.

- [ ] **Step 6: Nettoyer le seed e2e (`tests/seed/seed-metadata-indicateur.sql`)**

Dans `apps/pilote-ppg/tests/seed/seed-metadata-indicateur.sql`, supprimer le bloc équivalent (lignes 116-149, commentaire `-- zg_applicable - Restrictions géographiques` + l'unique `INSERT ... VALUES (...), (...), ... ;` de 32 lignes), en gardant une seule ligne blanche entre la fin du bloc `indic_schema` et le début du bloc `-- vi_dept_from, va_dept_from, vc_dept_from`.

- [ ] **Step 7: Commit**

```bash
git add apps/pilote-ppg/src/server/parametrage-indicateur/handlers/EnregistrerMetadataIndicateurHandler.ts
git add apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/handlers/EnregistrerMetadataIndicateurHandler.integration.test.ts
git add apps/pilote-ppg/src/database/prisma/seed-metadata-indicateur.ts
git add apps/pilote-ppg/tests/seed/seed-metadata-indicateur.sql
git commit -m "feat(ppg-metadata): zg_applicable ne passe plus par le mécanisme générique de valeurs acceptées"
```

---

### Task 3: `RécupérerInformationMetadataIndicateurUseCase` source les valeurs de `zg_applicable` depuis `metadata_zonegroup`

**Files:**
- Modify: `apps/pilote-ppg/src/server/parametrage-indicateur/usecases/RécupérerInformationMetadataIndicateurUseCase.ts`
- Test: `apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/usecases/RécupérerInformationMetadataIndicateurUseCase.integration.test.ts` (nouveau fichier)

**Interfaces:**
- Consumes: rien de nouveau côté appelants — `run(): Promise<InformationMetadataIndicateur[]>` garde exactement la même signature.
- Produces: pour l'élément `name === "zg_applicable"` de la liste retournée, `acceptedValues` contient désormais un `AcceptedValue` par zone-groupe actif (`deleted_at IS NULL`) de `metadata_zonegroup`, avec `value = zone_group_id`, `name = zg_name`, `desc = zg_desc ?? ""`, `orderId` = position (1-indexé) dans la liste triée par `zone_group_id` — au lieu des lignes de `metadata_indicateur_valeur_acceptee`. Tous les autres éléments de la liste ne sont pas affectés. Ceci est consommé sans changement par `SectionDétailsMetadataIndicateur.tsx` (`computeListeValeur`/`computeValeurAffichee`, via `mapInfo.zg_applicable.acceptedValues`) et par `ImportMasseMetadataIndicateurUseCase` (validation de l'import CSV) — aucune modification de ces deux consommateurs n'est nécessaire.

- [ ] **Step 1: Écrire le test qui doit échouer**

Créer `apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/usecases/RécupérerInformationMetadataIndicateurUseCase.integration.test.ts` :

```ts
import { getContainer } from "@/server/dependances";
import RécupérerInformationMetadataIndicateurUseCase from "@/server/parametrage-indicateur/usecases/RécupérerInformationMetadataIndicateurUseCase";
import { prisma } from "@/server/db/prisma";

describe("RécupérerInformationMetadataIndicateurUseCase", () => {
  let useCase: RécupérerInformationMetadataIndicateurUseCase;

  beforeEach(() => {
    useCase = getContainer("parametrageIndicateur").resolve(
      "récupérerInformationMetadataIndicateurUseCase",
    );
  });

  it("source les valeurs acceptées de zg_applicable depuis metadata_zonegroup, pas depuis metadata_indicateur_valeur_acceptee", async () => {
    // Given
    await prisma.metadata_indicateur.create({
      data: {
        name: "zg_applicable",
        data_type: "text",
        description: "Zone-group applicable",
        est_visible: true,
        alias: "Restriction géographique",
        est_editable: true,
        validation_regex: "",
        validation_regex_error_message: null,
        edit_box_type: "multi-select",
        default_value: null,
        est_obligatoire: false,
        doit_afficher_la_description: false,
        groupe: "METADATA_INDICATEURS",
        bloc_id: null,
        valeurs_acceptees: {
          create: [
            {
              ordre: 1,
              valeur: "ANCIENNE-VALEUR",
              nom: "Ne doit pas apparaître",
              description: "Table figée, ne doit plus être lue",
            },
          ],
        },
      },
    });

    await prisma.metadata_zonegroup.create({
      data: {
        zone_group_id: "ZG-ACTIF-TEST",
        zg_name: "Zone active de test",
        zg_desc: "Description de la zone active",
      },
    });
    await prisma.metadata_zonegroup.create({
      data: {
        zone_group_id: "ZG-ARCHIVE-TEST",
        zg_name: "Zone archivée de test",
        deleted_at: new Date(),
      },
    });

    // When
    const résultat = await useCase.run();

    // Then
    const infoZgApplicable = résultat.find(
      (info) => info.name === "zg_applicable",
    );
    expect(infoZgApplicable).toBeDefined();
    expect(
      infoZgApplicable?.acceptedValues.map((valeur) => valeur.value),
    ).toEqual(["ZG-ACTIF-TEST"]);
    expect(infoZgApplicable?.acceptedValues[0]).toMatchObject({
      value: "ZG-ACTIF-TEST",
      name: "Zone active de test",
      desc: "Description de la zone active",
    });
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Demander à l'utilisateur de lancer :
`pnpm --filter pilote-ppg exec vitest run --project server-integration RécupérerInformationMetadataIndicateurUseCase`

Résultat attendu : échec sur `toEqual(["ZG-ACTIF-TEST"])` — le use case actuel retourne `["ANCIENNE-VALEUR"]` (lu depuis `metadata_indicateur_valeur_acceptee`), pas la zone active.

- [ ] **Step 3: Modifier le use case**

Remplacer le contenu de `apps/pilote-ppg/src/server/parametrage-indicateur/usecases/RécupérerInformationMetadataIndicateurUseCase.ts` par :

```ts
import { InformationMetadataIndicateur } from "@/server/parametrage-indicateur/domain/InformationMetadataIndicateur";
import { AcceptedValue } from "@/server/parametrage-indicateur/domain/AcceptedValue";
import type { Inject } from "@/server/parametrage-indicateur/module";

const NOM_CHAMP_ZONE_GROUPE = "zg_applicable";

type ZonegroupActif = {
  zone_group_id: string;
  zg_name: string;
  zg_desc: string | null;
};

export default class RécupérerInformationMetadataIndicateurUseCase {
  constructor(private readonly dependencies: Inject<"prisma">) {}

  async run(): Promise<InformationMetadataIndicateur[]> {
    return this.récupérerDepuisBDD();
  }

  private async récupérerDepuisBDD(): Promise<InformationMetadataIndicateur[]> {
    const prisma = this.dependencies.prisma.getInstance();
    const [metadataFromDB, zonegroupsActifs] = await Promise.all([
      prisma.metadata_indicateur.findMany({
        include: {
          valeurs_acceptees: {
            orderBy: {
              ordre: "asc",
            },
          },
        },
      }),
      prisma.metadata_zonegroup.findMany({
        where: { deleted_at: null },
        orderBy: { zone_group_id: "asc" },
        select: { zone_group_id: true, zg_name: true, zg_desc: true },
      }),
    ]);

    return metadataFromDB.map((metadata) =>
      this.mapperDepuisBDD(metadata, zonegroupsActifs),
    );
  }

  private mapperDepuisBDD(
    metadata: {
      name: string;
      data_type: string;
      description: string;
      est_visible: boolean;
      alias: string;
      est_editable: boolean;
      validation_regex: string;
      validation_regex_error_message: string | null;
      edit_box_type: string | null;
      default_value: string | null;
      est_obligatoire: boolean;
      doit_afficher_la_description: boolean;
      valeurs_acceptees: {
        ordre: number;
        valeur: string;
        nom: string;
        description: string;
      }[];
    },
    zonegroupsActifs: ZonegroupActif[],
  ): InformationMetadataIndicateur {
    const defaultValue = this.convertirDefaultValue(
      metadata.default_value,
      metadata.data_type,
    );

    const acceptedValues =
      metadata.name === NOM_CHAMP_ZONE_GROUPE
        ? this.construireAcceptedValuesDepuisZonegroups(zonegroupsActifs)
        : metadata.valeurs_acceptees.map((valeur) =>
            AcceptedValue.créerAcceptedValue({
              orderId: valeur.ordre,
              value: valeur.valeur,
              name: valeur.nom,
              desc: valeur.description,
            }),
          );

    return InformationMetadataIndicateur.creerInformationMetadataIndicateur({
      name: metadata.name,
      dataType: metadata.data_type as "text" | "boolean",
      description: metadata.description,
      metaPiloteShow: metadata.est_visible,
      metaPiloteAlias: metadata.alias,
      metaPiloteEditIsEditable: metadata.est_editable,
      metaPiloteEditRegex: metadata.validation_regex,
      metaPiloteEditRegexViolationMessage:
        metadata.validation_regex_error_message,
      metaPiloteEditBoxType: (metadata.edit_box_type || "text") as
        | "text"
        | "textarea"
        | "boolean"
        | "multi-select",
      metaPiloteDefaultValue: defaultValue,
      metaPiloteMandatory: metadata.est_obligatoire,
      metaPiloteDispDispDesc: metadata.doit_afficher_la_description,
      acceptedValues,
    });
  }

  private construireAcceptedValuesDepuisZonegroups(
    zonegroupsActifs: ZonegroupActif[],
  ): AcceptedValue[] {
    return zonegroupsActifs.map((zonegroup, index) =>
      AcceptedValue.créerAcceptedValue({
        orderId: index + 1,
        value: zonegroup.zone_group_id,
        name: zonegroup.zg_name,
        desc: zonegroup.zg_desc ?? "",
      }),
    );
  }

  private convertirDefaultValue(
    value: string | null,
    dataType: string,
  ): string | number | boolean | null {
    if (value === null) {
      return null;
    }

    if (dataType === "boolean") {
      return value === "true";
    }

    if (dataType === "number") {
      return Number(value);
    }

    return value;
  }
}
```

- [ ] **Step 4: Relancer le test pour vérifier qu'il passe**

Demander à l'utilisateur de relancer :
`pnpm --filter pilote-ppg exec vitest run --project server-integration RécupérerInformationMetadataIndicateurUseCase`

Résultat attendu : le test passe.

- [ ] **Step 5: Vérifier l'absence de régression sur les tests existants du module**

Demander à l'utilisateur de lancer :
`pnpm --filter pilote-ppg exec vitest run --project server-integration parametrage-indicateur`

Résultat attendu : tous les tests du module (y compris `PrismaMetadataParametrageIndicateurQuery.integration.test.ts` et ceux des Tasks 1/2) passent toujours.

- [ ] **Step 6: Commit**

```bash
git add apps/pilote-ppg/src/server/parametrage-indicateur/usecases/RécupérerInformationMetadataIndicateurUseCase.ts
git add apps/pilote-ppg/src/server/parametrage-indicateur/__tests__/usecases/RécupérerInformationMetadataIndicateurUseCase.integration.test.ts
git commit -m "feat(ppg-metadata): zg_applicable source ses valeurs depuis le référentiel metadata_zonegroup"
```

---

### Task 4: Page `parametrage-metadata-indicateur` — aperçu en lecture seule des zone-groupes

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/ZonegroupValuesPreview.tsx`
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/ZonegroupValuesPreview.integration.test.tsx`
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/MetadataFieldEditor.tsx`

**Interfaces:**
- Consumes: `ZonegroupAdminListItem` (type déjà exporté par `@/server/metadataZonegroup/queries/ListerZonegroupsAdminQuery`, forme `{ zoneGroupId: string; zgName: string; nbZones: number; updatedAt: string; deletedAt: string | null }`), et `api.metadataZonegroup.lister.useQuery()` (déjà exposé par `metadataZonegroupRouter`, aucune modification backend requise).
- Produces: composant `ZonegroupValuesPreview({ zonegroups: ZonegroupAdminListItem[] })`, rendu sans état ni fetch interne — le fetch reste dans `MetadataFieldEditor`.

- [ ] **Step 1: Écrire le test qui doit échouer**

Créer `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/ZonegroupValuesPreview.integration.test.tsx` :

```tsx
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { ZonegroupValuesPreview } from "./ZonegroupValuesPreview";
import type { ZonegroupAdminListItem } from "@/server/metadataZonegroup/queries/ListerZonegroupsAdminQuery";

const zonegroupActif: ZonegroupAdminListItem = {
  zoneGroupId: "ZG-001",
  zgName: "Groupement 1",
  nbZones: 2,
  updatedAt: new Date().toISOString(),
  deletedAt: null,
};

const zonegroupArchivé: ZonegroupAdminListItem = {
  zoneGroupId: "ZG-002",
  zgName: "Groupement archivé",
  nbZones: 1,
  updatedAt: new Date().toISOString(),
  deletedAt: new Date().toISOString(),
};

describe("ZonegroupValuesPreview", () => {
  test("affiche les zone-groupes actifs", () => {
    render(<ZonegroupValuesPreview zonegroups={[zonegroupActif]} />);
    expect(screen.getByText("Groupement 1")).toBeInTheDocument();
  });

  test("n'affiche pas les zone-groupes archivés", () => {
    render(<ZonegroupValuesPreview zonegroups={[zonegroupArchivé]} />);
    expect(screen.queryByText("Groupement archivé")).not.toBeInTheDocument();
  });

  test("affiche un message quand aucun zone-groupe actif n'existe", () => {
    render(<ZonegroupValuesPreview zonegroups={[]} />);
    expect(
      screen.getByText("Aucun zone-groupe actif pour le moment."),
    ).toBeInTheDocument();
  });

  test("affiche un lien vers le référentiel des zone-groupes", () => {
    render(<ZonegroupValuesPreview zonegroups={[zonegroupActif]} />);
    const lien = screen.getByRole("link", {
      name: "Gérer les zone-groupes →",
    });
    expect(lien).toHaveAttribute(
      "href",
      "/panel-administrateur/referentiels/zonegroups",
    );
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Demander à l'utilisateur de lancer :
`pnpm --filter pilote-ppg exec vitest run --project client ZonegroupValuesPreview`

Résultat attendu : échec — le fichier `ZonegroupValuesPreview.tsx` n'existe pas encore.

- [ ] **Step 3: Créer le composant**

Créer `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/ZonegroupValuesPreview.tsx` :

```tsx
import { Lien } from "@/components/_commons/Lien/Lien";
import type { ZonegroupAdminListItem } from "@/server/metadataZonegroup/queries/ListerZonegroupsAdminQuery";

export const ZonegroupValuesPreview = ({
  zonegroups,
}: {
  zonegroups: ZonegroupAdminListItem[];
}) => {
  const zonegroupsActifs = zonegroups.filter(
    (zonegroup) => zonegroup.deletedAt === null,
  );

  return (
    <div className="fr-mt-2w">
      <p className="text-sm text-gray-600 mb-3">
        Les valeurs sélectionnables pour ce champ proviennent directement du
        référentiel des zone-groupes. Pour créer, modifier ou archiver un
        zone-groupe, rendez-vous sur le référentiel dédié.
      </p>
      {zonegroupsActifs.length === 0 ? (
        <p className="text-sm text-gray-400 italic mb-3">
          Aucun zone-groupe actif pour le moment.
        </p>
      ) : (
        <ul className="fr-mb-3w list-disc pl-5">
          {zonegroupsActifs.map((zonegroup) => (
            <li className="text-sm" key={zonegroup.zoneGroupId}>
              <span className="font-mono text-xs text-gray-400 mr-2">
                {zonegroup.zoneGroupId}
              </span>
              {zonegroup.zgName}
            </li>
          ))}
        </ul>
      )}
      <Lien
        href="/panel-administrateur/referentiels/zonegroups"
        label="Gérer les zone-groupes →"
        variant="button-secondary"
      />
    </div>
  );
};
```

- [ ] **Step 4: Relancer le test pour vérifier qu'il passe**

Demander à l'utilisateur de relancer :
`pnpm --filter pilote-ppg exec vitest run --project client ZonegroupValuesPreview`

Résultat attendu : les 4 tests passent.

- [ ] **Step 5: Intégrer le composant dans `MetadataFieldEditor`**

Dans `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/MetadataFieldEditor.tsx`, remplacer l'en-tête du fichier :

```tsx
import { Lien } from "@/components/_commons/Lien/Lien";
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import { useFormParametrageSource } from "./form";
import { SelectMetadata } from "./SelectMetadata";
import { CheckboxMetadata } from "./CheckboxMetadata";
import { AcceptedValuesEditor } from "./AcceptedValuesEditor";

export const MetadataFieldEditor = ({ fieldIndex }: { fieldIndex: number }) => {
  const form = useFormParametrageSource();
  const editBoxType = form.watch(`metadataList.${fieldIndex}.editBoxType`);
  const listeValeursAcceptes = form.watch(
    `metadataList.${fieldIndex}.listeValeursAcceptes`,
  );
```

par :

```tsx
import { Lien } from "@/components/_commons/Lien/Lien";
import { Input } from "@/components/_commons/Input";
import { Textarea } from "@/components/_commons/Textarea";
import { useFormParametrageSource } from "./form";
import { SelectMetadata } from "./SelectMetadata";
import { CheckboxMetadata } from "./CheckboxMetadata";
import { AcceptedValuesEditor } from "./AcceptedValuesEditor";
import { ZonegroupValuesPreview } from "./ZonegroupValuesPreview";
import api from "@/server/infrastructure/api/trpc/api";

const NOM_CHAMP_ZONE_GROUPE = "zg_applicable";

export const MetadataFieldEditor = ({ fieldIndex }: { fieldIndex: number }) => {
  const form = useFormParametrageSource();
  const name = form.watch(`metadataList.${fieldIndex}.name`);
  const editBoxType = form.watch(`metadataList.${fieldIndex}.editBoxType`);
  const listeValeursAcceptes = form.watch(
    `metadataList.${fieldIndex}.listeValeursAcceptes`,
  );
  const estChampZoneGroupe = name === NOM_CHAMP_ZONE_GROUPE;
  const { data: zonegroups = [] } = api.metadataZonegroup.lister.useQuery(
    undefined,
    { enabled: estChampZoneGroupe },
  );
  const optionsValeurParDefaut = estChampZoneGroupe
    ? zonegroups
        .filter((zonegroup) => zonegroup.deletedAt === null)
        .map((zonegroup) => ({
          valeur: zonegroup.zoneGroupId,
          nom: zonegroup.zgName,
        }))
    : listeValeursAcceptes;
```

Puis remplacer :

```tsx
            {/* Valeurs acceptées si multi-select */}
            {editBoxType === "multi-select" && (
              <div className="pt-4">
                <h3 className="text-lg font-bold text-dsfr-blue-france-sun-113 mb-4 flex items-center gap-2 !mb-2">
                  Valeurs acceptées
                </h3>
                <AcceptedValuesEditor fieldIndex={fieldIndex} />
              </div>
            )}

            {editBoxType === "multi-select" && (
              <SelectMetadata
                label="Valeur par défaut"
                name={`metadataList.${fieldIndex}.defaultValue`}
              >
                <option value="">Aucune valeur par défaut</option>
                {listeValeursAcceptes?.map((valeur) => (
                  <option key={valeur.valeur} value={valeur.valeur}>
                    {valeur.nom || valeur.valeur}
                  </option>
                ))}
              </SelectMetadata>
            )}
```

par :

```tsx
            {/* Valeurs acceptées si multi-select */}
            {editBoxType === "multi-select" && (
              <div className="pt-4">
                <h3 className="text-lg font-bold text-dsfr-blue-france-sun-113 mb-4 flex items-center gap-2 !mb-2">
                  Valeurs acceptées
                </h3>
                {estChampZoneGroupe ? (
                  <ZonegroupValuesPreview zonegroups={zonegroups} />
                ) : (
                  <AcceptedValuesEditor fieldIndex={fieldIndex} />
                )}
              </div>
            )}

            {editBoxType === "multi-select" && (
              <SelectMetadata
                label="Valeur par défaut"
                name={`metadataList.${fieldIndex}.defaultValue`}
              >
                <option value="">Aucune valeur par défaut</option>
                {optionsValeurParDefaut?.map((valeur) => (
                  <option key={valeur.valeur} value={valeur.valeur}>
                    {valeur.nom || valeur.valeur}
                  </option>
                ))}
              </SelectMetadata>
            )}
```

- [ ] **Step 6: Vérifier manuellement dans le navigateur**

Demander à l'utilisateur de démarrer l'app (`pnpm dev`), se connecter en admin, ouvrir `/panel-administrateur/parametrage-metadata-indicateur`, sélectionner le champ `zg_applicable` et vérifier que la section "Valeurs acceptées" affiche la liste réelle des zone-groupes actifs (au lieu du formulaire d'ajout de valeurs libres) avec un lien "Gérer les zone-groupes →", et que les 29 autres champs multi-select (ex : `tendance`, `mailles`) affichent toujours `AcceptedValuesEditor` normalement.

- [ ] **Step 7: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/ZonegroupValuesPreview.tsx
git add apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/ZonegroupValuesPreview.integration.test.tsx
git add apps/pilote-ppg/src/client/components/PagePanelAdministrateur/ParametrageSourceIndicateur/MetadataFieldEditor.tsx
git commit -m "feat(ppg-metadata): affiche un aperçu en lecture seule du référentiel zonegroup dans la config indicateur"
```

---

### Task 5: Test e2e — un zone-groupe du référentiel apparaît dans la fiche indicateur

**Files:**
- Modify: `apps/pilote-ppg/tests/pages/admin/page-admin-indicateur-form.ts`
- Modify: `apps/pilote-ppg/tests/admin-indicateurs-formulaire.spec.ts`

**Interfaces:**
- Consumes: seed e2e existant (`tests/seed/raw_data/metadata_zonegroup.csv`, qui contient déjà `ZG-001,Groupement 1,...`, absent de l'ancienne liste figée de valeurs acceptées — ordre 2 à 27 seulement), et `IND-021` / `ditp.admin@example.com` déjà utilisés par `admin-indicateurs-formulaire.spec.ts`.
- Produces: méthode `PageAdminIndicateurForm.expectOptionZoneGroupeVisible(nom: string): Promise<void>`.

- [ ] **Step 1: Ajouter le locator et la méthode d'assertion sur la page object**

Dans `apps/pilote-ppg/tests/pages/admin/page-admin-indicateur-form.ts`, ajouter un getter privé après `accordionAutresInformations` :

```ts
  private get selecteurZoneGroupe() {
    return this.page.locator('select[name="zgApplicable"]');
  }
```

Puis ajouter une méthode publique après `expectModeModification` :

```ts
  async expectOptionZoneGroupeVisible(nom: string): Promise<void> {
    await expect(
      this.selecteurZoneGroupe.locator("option", { hasText: nom }),
    ).toHaveCount(1);
  }
```

- [ ] **Step 2: Écrire le test e2e**

Ajouter à la fin de `apps/pilote-ppg/tests/admin-indicateurs-formulaire.spec.ts` (en dehors du `test.describe` existant, ou dans un nouveau `test.describe`) :

```ts
test.describe("Formulaire indicateur — Restriction géographique", () => {
  test("doit proposer les zone-groupes du référentiel comme valeurs sélectionnables", async ({
    page,
    e2eContext,
    step,
  }) => {
    const appActions = new AppActions(page, e2eContext);
    const pageForm = new PageAdminIndicateurForm(page, e2eContext);

    await step("Connexion et passage en mode modification", async () => {
      await appActions.loginAs(DITP_ADMIN);
      await pageForm.goto("IND-021");
      await pageForm.clickModifier();
      await pageForm.expectModeModification();
    });

    await step(
      "Le sélecteur de zone-groupe propose ZG-001 (Groupement 1), issu du référentiel",
      async () => {
        await pageForm.expectOptionZoneGroupeVisible("Groupement 1");
      },
    );
  });
});
```

- [ ] **Step 3: Lancer le test e2e**

Demander à l'utilisateur de lancer (après avoir démarré le serveur e2e comme d'habitude pour ce projet, voir `pnpm test:e2e:server` / `pnpm test:e2e:database:init` si nécessaire) :
`pnpm test:e2e -- admin-indicateurs-formulaire`

Résultat attendu : le nouveau test passe — l'option "Groupement 1" (ZG-001) est bien présente dans le sélecteur, alors qu'elle n'existait pas dans l'ancienne liste figée de valeurs acceptées (qui allait de ZG-002 à ZG-032).

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/tests/pages/admin/page-admin-indicateur-form.ts
git add apps/pilote-ppg/tests/admin-indicateurs-formulaire.spec.ts
git commit -m "test(e2e): vérifie que le sélecteur de zone-groupe de la fiche indicateur lit le référentiel réel"
```
