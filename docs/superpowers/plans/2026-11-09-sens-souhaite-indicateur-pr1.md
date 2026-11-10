# Sens souhaité d'un indicateur (PR1) — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** chaque indicateur kpilote porte un sens souhaité (`HAUSSE` ou `BAISSE`). Il est stocké en base, exposé et écrit par l'API, saisi dans kpilote-admin et affiché dans la fiche indicateur de la webapp.

**Architecture:** une colonne enum `NOT NULL DEFAULT 'HAUSSE'` sur `indicateur`. Les schémas Zod partagés (`@pilote/kpilote-shared/indicateur`) portent le type, les libellés et les aides. L'API sérialise et écrit le champ, obligatoire dans le PUT. L'admin et la webapp consomment les constantes partagées. Aucune interprétation des valeurs ne change dans cette PR.

**Tech Stack:** Prisma 7 + PostgreSQL 17, Hono + `@hono/zod-openapi`, Zod 4, Vitest (intégration sur vraie base), React + react-hook-form, TanStack Router.

**Spec:** `docs/superpowers/specs/2026-11-09-sens-souhaite-indicateur-pr1-design.md`

## Global Constraints

- Branche `feat/PIL-1776-sens-souhaite`, ouverte depuis `dev` à jour.
- Nommage : vocabulaire métier en français, technique en anglais. Champ `sensSouhaite`, valeurs `HAUSSE` / `BAISSE`, colonne `sens_souhaite`, enum Postgres `sens_souhaite_enum`, enum Prisma `SensSouhaite`.
- Textes exacts : « Sens souhaité », « À la hausse », « À la baisse », « Une valeur plus élevée est favorable », « Une valeur plus faible est favorable », « Changer le sens ne modifie ni les valeurs d'avancement ni les cibles. »
- `sensSouhaite` est **obligatoire** dans le body du `PUT /indicateurs/{id}` (ni `optional` ni `nullable`). Il est toujours présent dans les réponses.
- `schema.prisma` s'édite à la main. Ne pas lancer `prisma format` : il reformate tout le fichier.
- Pas de `prisma migrate reset` (refusé pour un agent) : on applique les migrations avec `prisma migrate deploy`.
- Tests : uniquement des tests d'intégration côté API. Aucun test côté admin ni côté webapp.
- **Ne pas commiter sans demande explicite de Triko.** Les étapes « Commit » donnent le message à utiliser une fois le feu vert reçu. Ne pas ouvrir de PR sans demande.
- Messages de commit : `feat(kpilote): <description en français> (PIL-1776)`, terminés par `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Modifier un indicateur à la baisse dans l'admin sans toucher au sens** (par exemple le renommer) : le sens doit rester `BAISSE`. Le formulaire doit partir de la valeur actuelle, jamais de `HAUSSE`. → Vérification manuelle, tâche 3, étape 4.
2. **Créer un indicateur dans l'admin** : « À la hausse » est sélectionné d'office, et le PUT l'envoie bien. → Vérification manuelle, tâche 3, étape 4.
3. **Indicateurs déjà en base avant la migration** : ils doivent ressortir `HAUSSE` dans l'API. → Test `getIndicateurByPublicId` (fixture créée sans le champ), tâche 1.
4. **Re-seed d'une base où le sens a été changé à la main** : le seed remet le sens d'origine (branche `update` de l'upsert). → Vérification, tâche 2, étape 4.
5. **Affichage de la fiche pour les deux sens** : minuscule initiale de l'aide, tiret cadratin. → Vérification manuelle, tâche 4, étape 3.

---

### Task 1 : API — stocker, exposer et écrire le sens

**Files:**
- Modify: `apps/kpilote-api/prisma/schema.prisma` (enum `SensSouhaite` après `UniteDuree` ; champ dans `model Indicateur`, juste après `unite`)
- Create: `apps/kpilote-api/prisma/migrations/20261109120000_add_indicateur_sens_souhaite/migration.sql`
- Modify: `packages/kpilote-shared/src/indicateur.ts`
- Modify: `apps/kpilote-api/src/indicateur/utils.ts` (`toIndicateurApiModel`)
- Modify: `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.ts` (`updateIndicateurExistant`, `createIndicateurAvecGrants`)
- Modify: `apps/kpilote-api/src/indicateur/routes.ts:100-102` (`summary` et `description` de `upsertIndicateurRoute`)
- Test: `apps/kpilote-api/src/indicateur/queries/getIndicateurByPublicId.test.ts`
- Test: `apps/kpilote-api/src/indicateur/commands/upsertIndicateur.test.ts`

**Interfaces:**
- Produces (dans `@pilote/kpilote-shared/indicateur`) :
  - `SENS_SOUHAITES: readonly ['HAUSSE', 'BAISSE']`
  - `type SensSouhaite = 'HAUSSE' | 'BAISSE'`
  - `SENS_SOUHAITE_LABELS: Record<SensSouhaite, string>`
  - `SENS_SOUHAITE_HINTS: Record<SensSouhaite, string>`
  - `sensSouhaiteSchema` (z.enum)
  - `IndicateurApiModel['sensSouhaite']: SensSouhaite`
  - `UpsertIndicateurBody['sensSouhaite']: SensSouhaite`
- Produces (Prisma) : enum `SensSouhaite` et champ `Indicateur.sensSouhaite`, défaut `HAUSSE`.

- [ ] **Step 1 : préparer la branche et les bases**

```bash
git switch dev && git pull && git switch -c feat/PIL-1776-sens-souhaite
cd apps/kpilote-api && docker compose up -d postgres postgres_test
```

Attendu : les conteneurs `pilote_mb_postgres` (5434) et `pilote_mb_postgres_test` (5435) tournent.

- [ ] **Step 2 : écrire les tests qui doivent échouer**

Dans `getIndicateurByPublicId.test.ts`, premier test (« retourne l'indicateur avec ses référentiels liés triés par publicId »), ajouter `sensSouhaite: 'HAUSSE',` à l'objet attendu, juste après `unite: null,`. La fixture crée l'indicateur sans le champ : on vérifie ainsi le défaut de la base et la sérialisation.

Dans `upsertIndicateur.test.ts` :
- ajouter `sensSouhaite: 'HAUSSE' as const` à `BODY_BASE` ;
- ajouter `sensSouhaite: 'HAUSSE'` à chaque body écrit en dur qui n'étale pas `BODY_BASE` (par exemple les trois appels du test sur l'unité) ;
- ajouter ce test, juste après celui sur l'unité :

```ts
it(
  'persiste le sens souhaité fourni à la création et le met à jour',
  integrationTest(async () => {
    const indId = testIndicateurId()
    const apiKey = await fixtures.apiKey()

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, sensSouhaite: 'BAISSE' }),
    )
    const apresCreation = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
    expect(apresCreation.sensSouhaite).toBe('BAISSE')

    await runAsAdmin(apiKey.id, () =>
      upsertIndicateur(indId, { ...BODY_BASE, sensSouhaite: 'HAUSSE' }),
    )
    const apresMaj = await db().indicateur.findUniqueOrThrow({ where: { publicId: indId } })
    expect(apresMaj.sensSouhaite).toBe('HAUSSE')
  }),
)
```

- [ ] **Step 3 : vérifier que les tests échouent**

Run: `pnpm -F @pilote/kpilote-api test src/indicateur`
Attendu : FAIL sur les deux tests ci-dessus (`sensSouhaite` vaut `undefined` / clé absente de l'objet). Les autres tests passent.

- [ ] **Step 4 : ajouter l'enum, la colonne et la migration**

`schema.prisma`, à la main :
- `enum SensSouhaite { HAUSSE BAISSE @@map("sens_souhaite_enum") }`, placé après `enum UniteDuree` ;
- dans `model Indicateur`, après `unite` : `sensSouhaite SensSouhaite @default(HAUSSE) @map("sens_souhaite")`.

`migration.sql`, contenu exact :

```sql
-- CreateEnum
CREATE TYPE "sens_souhaite_enum" AS ENUM ('HAUSSE', 'BAISSE');

-- AlterTable
ALTER TABLE "indicateur" ADD COLUMN "sens_souhaite" "sens_souhaite_enum" NOT NULL DEFAULT 'HAUSSE';
```

- [ ] **Step 5 : appliquer la migration en local et régénérer le client**

Run (dans `apps/kpilote-api`) : `pnpm exec prisma migrate deploy && pnpm prisma:generate`
Attendu : `20261109120000_add_indicateur_sens_souhaite` appliquée, puis client Prisma et TypedSQL générés sans erreur.

Contrôle de cohérence entre le schéma et les migrations : `pnpm exec prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma`
Attendu : aucune ligne qui mentionne `sens_souhaite`. Une dérive préexistante sans rapport se signale, sans la corriger.

- [ ] **Step 6 : ajouter les schémas partagés**

Dans `packages/kpilote-shared/src/indicateur.ts` :
- ajouter le bloc `SENS_SOUHAITES` / `SensSouhaite` / `SENS_SOUHAITE_LABELS` / `SENS_SOUHAITE_HINTS` / `sensSouhaiteSchema` tel quel depuis la spec (section « Schémas partagés »), après le bloc des unités ;
- ajouter `sensSouhaite: sensSouhaiteSchema` à `indicateurApiModelSchema`, après `unite` ;
- ajouter `sensSouhaite: sensSouhaiteSchema` à `upsertIndicateurBodySchema`, après `unite`.

Ne pas l'ajouter à `indicateurMetadonneesSchema`.

- [ ] **Step 7 : lire et écrire le champ dans l'API**

- `utils.ts`, `toIndicateurApiModel` : `sensSouhaite: indicateur.sensSouhaite`, après `unite`.
- `upsertIndicateur.ts` : `sensSouhaite: body.sensSouhaite` dans le `data` de `db().indicateur.update` (`updateIndicateurExistant`) et de `db().indicateur.create` (`createIndicateurAvecGrants`), après `unite`.
- `routes.ts`, `upsertIndicateurRoute` :
  - `summary` : « Créer ou remplacer un indicateur » ;
  - `description` réécrite : elle liste les champs remplacés à chaque PUT (`nom`, `visibilite`, `unite`, `sensSouhaite`, `referentiels` en replace-all), les métadonnées optionnelles (absentes = inchangées, `null` = effacées), `responsables` (absent = inchangé), et conserve les règles d'autorisation et d'erreur `unknownReferentielIds`. Elle ne mentionne plus `referentielIds`.

- [ ] **Step 8 : vérifier que les tests passent**

Run: `pnpm -F @pilote/kpilote-api test src/indicateur`
Attendu : PASS.

Run: `pnpm -F @pilote/kpilote-api test`
Attendu : PASS (toute la suite API).

- [ ] **Step 9 : lint et types**

Run: `pnpm -F @pilote/kpilote-shared lint && pnpm -F @pilote/kpilote-api lint`
Attendu : PASS.

`pnpm -F @pilote/kpilote-admin lint` échoue à ce stade (`toUpsertBody` ne fournit pas encore `sensSouhaite`) : c'est attendu, la tâche 3 le corrige.

- [ ] **Step 10 : commit (sur feu vert)**

```bash
git add apps/kpilote-api/prisma packages/kpilote-shared/src/indicateur.ts apps/kpilote-api/src/indicateur
git commit -m "feat(kpilote): l'indicateur porte un sens souhaité, à la hausse ou à la baisse, exposé et écrit par l'API (PIL-1776)"
```

---

### Task 2 : seed — quatre indicateurs à la baisse

**Files:**
- Modify: `apps/kpilote-api/prisma/seed.ts` (import, type des entrées de `indicateursSeed`, entrées IND-001 / IND-004 / IND-023 / IND-033, boucle `upsert` dans `main`)

**Interfaces:**
- Consumes: `type SensSouhaite` (tâche 1), colonne `sens_souhaite`.

- [ ] **Step 1 : déclarer le sens dans les données du seed**

- Importer `type SensSouhaite` depuis `@pilote/kpilote-shared/indicateur`.
- Ajouter `sensSouhaite?: SensSouhaite` au type des entrées de `indicateursSeed`.
- Ajouter `sensSouhaite: 'BAISSE'` aux entrées IND-001 (Taux de chômage), IND-004 (Délai de traitement préfectures), IND-023 (Délai de traitement CAF) et IND-033 (Délai de jugement pénal).
- Dans la boucle de `main` : `const sensSouhaite = item.sensSouhaite ?? 'HAUSSE'`, écrit dans `update` **et** dans `create`.

- [ ] **Step 2 : lancer le seed**

Run (dans `apps/kpilote-api`) : `pnpm db:seed`
Attendu : le seed se termine sans erreur.

- [ ] **Step 3 : vérifier les sens en base**

Run: `docker exec pilote_mb_postgres psql -U postgres -c "SELECT public_id, sens_souhaite FROM indicateur WHERE sens_souhaite = 'BAISSE' ORDER BY public_id;"`
Attendu : exactement 4 lignes, IND-001, IND-004, IND-023 et IND-033.

- [ ] **Step 4 : vérifier qu'un re-seed remet le sens d'origine (Review Focus 4)**

```bash
docker exec pilote_mb_postgres psql -U postgres -c "UPDATE indicateur SET sens_souhaite = 'HAUSSE' WHERE public_id = 'IND-023';"
pnpm db:seed
docker exec pilote_mb_postgres psql -U postgres -c "SELECT sens_souhaite FROM indicateur WHERE public_id = 'IND-023';"
```

Attendu : `BAISSE`.

- [ ] **Step 5 : commit (sur feu vert)**

```bash
git add apps/kpilote-api/prisma/seed.ts
git commit -m "feat(kpilote): le seed compte quatre indicateurs à la baisse (PIL-1776)"
```

---

### Task 3 : admin — saisir le sens dans le formulaire

**Files:**
- Modify: `apps/kpilote-admin/src/components/indicateurs/indicateurFormSchema.ts` (`buildIndicateurFormSchema`, `buildInitialValues`, `toUpsertBody`)
- Modify: `apps/kpilote-admin/src/components/indicateurs/IndicateurForm.tsx` (nouvelle ligne entre la ligne Visibilité / Unité et la section « Métadonnées »)

**Interfaces:**
- Consumes: `sensSouhaiteSchema`, `SENS_SOUHAITES`, `SENS_SOUHAITE_LABELS`, `SENS_SOUHAITE_HINTS`, `IndicateurApiModel['sensSouhaite']`, `UpsertIndicateurBody['sensSouhaite']` (tâche 1) ; `SegmentedField` (`@pilote/kpilote-ui/SegmentedField`), `Text` (`@pilote/kpilote-ui/Typography`).

- [ ] **Step 1 : schéma et valeurs du formulaire**

Dans `indicateurFormSchema.ts` :
- `buildIndicateurFormSchema` : `sensSouhaite: sensSouhaiteSchema` ;
- `buildInitialValues` : `sensSouhaite: indicateur?.sensSouhaite ?? 'HAUSSE'` ;
- `toUpsertBody` : `sensSouhaite: values.sensSouhaite`.

- [ ] **Step 2 : la ligne « Sens souhaité »**

Dans `IndicateurForm.tsx`, ajouter un bloc `mb-6` après le `div` Visibilité / Unité, avant « Métadonnées » :
- un `Controller` sur `sensSouhaite` qui rend un `SegmentedField` :
  - `label="Sens souhaité"` ;
  - `value` / `onValueChange` / `error` branchés comme pour Visibilité ;
  - `options` construites depuis `SENS_SOUHAITES` et `SENS_SOUHAITE_LABELS` (constante de module, comme `VISIBILITE_OPTIONS`) ;
- sous le champ, un `<Text variant="caption" className="mt-1.5">` qui affiche `` `${SENS_SOUHAITE_HINTS[field.value]}. Changer le sens ne modifie ni les valeurs d'avancement ni les cibles.` ``.

Ne pas utiliser la prop `hint` de `SegmentedField` : `Field` l'affiche à côté du libellé.

- [ ] **Step 3 : lint et types**

Run: `pnpm -F @pilote/kpilote-admin lint`
Attendu : PASS.

- [ ] **Step 4 : vérification manuelle (Review Focus 1 et 2)**

Lancer l'API (`pnpm dev:kpilote-api`) et l'admin (`pnpm -F @pilote/kpilote-admin dev`), environnement `local`.
- **Création :** ouvrir « Nouvel indicateur ». « À la hausse » est sélectionné et l'aide dit « Une valeur plus élevée est favorable. Changer le sens… ». Passer à « À la baisse » : l'aide devient « Une valeur plus faible est favorable. … ». Enregistrer.
- **Modification sans toucher au sens :** rouvrir IND-001 (à la baisse grâce au seed). « À la baisse » est sélectionné. Modifier seulement le nom, enregistrer, rouvrir : toujours « À la baisse ». Remettre le nom d'origine.
- **Changement de sens :** passer IND-001 à « À la hausse », enregistrer, rouvrir : « À la hausse ». Remettre « À la baisse ».

- [ ] **Step 5 : commit (sur feu vert)**

```bash
git add apps/kpilote-admin/src/components/indicateurs
git commit -m "feat(kpilote): l'admin permet de choisir le sens souhaité d'un indicateur (PIL-1776)"
```

---

### Task 4 : webapp — afficher le sens dans la fiche indicateur

**Files:**
- Modify: `apps/kpilote-webapp/src/components/indicateurs/IndicateurMetadonnees.tsx` (type des props, nouvel item après « Unité », petite fonction de formatage à côté de `formatDelai`)

**Interfaces:**
- Consumes: `type SensSouhaite`, `SENS_SOUHAITE_LABELS`, `SENS_SOUHAITE_HINTS`, `IndicateurApiModel['sensSouhaite']` (tâche 1). La route `indicateurs/$id.tsx` passe déjà l'objet indicateur complet (`<IndicateurMetadonnees indicateur={indicateur} />`), elle ne change pas.

- [ ] **Step 1 : l'item « Sens souhaité »**

- Ajouter `sensSouhaite: SensSouhaite` au type `IndicateurMetadonneesProps['indicateur']`, après `unite`.
- Ajouter `formatSensSouhaite(sens: SensSouhaite): string`. Elle renvoie le libellé, un tiret cadratin, puis l'aide avec une minuscule initiale. Résultats exacts :
  - `HAUSSE` → « À la hausse — une valeur plus élevée est favorable »
  - `BAISSE` → « À la baisse — une valeur plus faible est favorable »
- Ajouter `<DescriptionList.Item label="Sens souhaité">` juste après l'item « Unité ».

- [ ] **Step 2 : lint et types**

Run: `pnpm -F @pilote/kpilote-webapp lint`
Attendu : PASS.

- [ ] **Step 3 : vérification manuelle (Review Focus 5)**

API lancée, puis webapp (`pnpm dev:kpilote-webapp`). Ouvrir l'onglet « Informations sur l'indicateur » :
- d'IND-001 : la ligne « Sens souhaité » est juste sous « Unité » et affiche « À la baisse — une valeur plus faible est favorable » ;
- d'IND-003 : elle affiche « À la hausse — une valeur plus élevée est favorable ».

- [ ] **Step 4 : commit (sur feu vert)**

```bash
git add apps/kpilote-webapp/src/components/indicateurs/IndicateurMetadonnees.tsx
git commit -m "feat(kpilote): la fiche indicateur affiche le sens souhaité (PIL-1776, PIL-1778)"
```

---

### Task 5 : vérification d'ensemble

- [ ] **Step 1 : lint des quatre paquets**

Run: `pnpm -F @pilote/kpilote-shared lint && pnpm -F @pilote/kpilote-api lint && pnpm -F @pilote/kpilote-admin lint && pnpm -F @pilote/kpilote-webapp lint`
Attendu : PASS.

- [ ] **Step 2 : suites de tests**

Run: `pnpm -F @pilote/kpilote-api test && pnpm -F @pilote/kpilote-admin test && pnpm -F @pilote/kpilote-webapp test && pnpm -F @pilote/kpilote-shared test`
Attendu : PASS. Signaler tout échec préexistant sur `dev` sans le corriger dans cette PR.

- [ ] **Step 3 : relecture du diff contre la spec**

`git diff dev...HEAD`, puis vérifier chaque ligne du tableau « Critères d'acceptation de PIL-1776 » de la spec, ainsi que la règle 1 de PIL-1778.
