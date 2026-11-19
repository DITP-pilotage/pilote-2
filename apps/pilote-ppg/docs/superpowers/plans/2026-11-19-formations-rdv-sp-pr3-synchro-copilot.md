# Formations RDV-SP, PR 3 : synchronisation copilot → PILOTE, plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** exposer `PUT /api/open-api/formations`, que copilot appelle chaque jour avec l'état complet des motifs et des séances Campus PILOTE, et adapter les tables et l'admin des formations.

**Architecture :** un garde vérifie le secret dédié ; un endpoint valide le corps avec un schéma zod, puis appelle `SyncFormationsHandler`, qui écrit dans une transaction (upsert des motifs, retrait des absents, séances rechargées). Une migration aligne les colonnes sur le contrat. L'admin des périodes signale et écarte les formations retirées de RDV-SP.

**Tech Stack :** routes API Next.js (pages), Prisma 7, PostgreSQL, zod 4, Vitest, système de modules Awilix.

**Spec :** [2026-11-19-formations-synchro-copilot-design.md](../specs/2026-11-19-formations-synchro-copilot-design.md)

**Où travailler :** worktree `.claude/worktrees/pil-1883-synchro-copilot`, branche `feat/PIL-1883-formations-synchro-copilot` (partie de `feat/PIL-1883-formations-profils-periodes`). Toutes les commandes se lancent depuis `apps/pilote-ppg`, et tous les chemins sont relatifs à ce dossier.

## Global Constraints

- Messages d'erreur, textes affichés, commentaires et commits en français. Nommage : métier en français, technique en anglais (`SyncFormationsHandler`, `onlyFormationsApiSecret`, `formatValidationErrors`).
- **Pas de commit sans demande explicite de Tristan.** Chaque étape « Commit » donne le message ; on ne l'exécute que si Tristan a autorisé les commits pour cette exécution. Format : `type(PIL-1883): description`.
- Prettier seulement sur les fichiers modifiés : `pnpm exec prettier --write <fichiers>`.
- `schema.prisma` s'édite à la main, jamais avec `prisma format` (il reformaterait tout le fichier).
- Base de test : `pnpm exec dotenv run -f .env.test -- pnpm exec prisma migrate deploy`, jamais de reset. Un échec est préexistant et sans lien avec cette PR : `MinistèreSQLRepository` « Accède à un ministère ».
- Base `pilote_demo` (`.env`) : ne jamais y lancer `migrate deploy`. La migration `supprime_mb_sync_execution` doit y rester non appliquée.
- Tests : `expect(resultat).toEqual(...)` sur l'objet complet ; seuls commentaires autorisés : Given/When/Then et ceux qui expliquent une donnée de test ; pas de variable d'un ou deux caractères ; pas de test client.
- Route `PUT /api/open-api/formations` ; variable d'environnement `FORMATIONS_API_SECRET`.
- Codes de retour : 405 (autre méthode), 503 (secret non configuré), 401 (header absent ou mal formé), 403 (secret faux), 400 (envoi invalide), 200 (succès).
- Réponse 200 : `{ motifs: { ecrits, retires }, seances: { ecrites } }`. Réponse 400 : `{ message, erreurs: [{ chemin, message }] }`.
- `visio_url` n'est jamais lu ni stocké.

## Review Focus

1. **Date au format brut de RDV-SP** (`"2026-12-03 09:30:00 +0100"`) : 400 qui cite le chemin, jamais un 500. Test dans la Task 3.
2. **Corps absent ou qui n'est pas un objet** : 400, sans appeler le handler. Test dans la Task 6.
3. **Identifiant envoyé en texte** (`"2101"`) : 400, sans conversion silencieuse. Test dans la Task 3.
4. **Animateur au nom vide** (agent sans prénom ni nom, `" "`) : le nom est ignoré et l'envoi passe. Test dans la Task 3.
5. **Date avec décalage horaire** (`+01:00`) : stockée au bon instant UTC. Test dans la Task 4.

---

### Task 1 : colonnes alignées sur le contrat copilot

**Files :**

- Create : `src/database/prisma/migrations/20261119120000_formations_synchro_copilot/migration.sql`
- Modify : `src/database/prisma/schema.prisma` (modèles `formation_motif`, `formation_seance`)
- Modify : `src/server/formations/queries/ListSeancesAVenirQuery.ts`, `src/server/formations/queries/ListPeriodesInformationQuery.ts`, `src/server/formations/queries/GetMatriceProfilsQuery.ts`, `src/server/formations/handlers/SetMotifProfilHandler.ts`
- Modify : `src/client/components/PagePanelAdministrateur/Formations/useTableauSeancesAVenir.tsx`
- Modify : `src/database/prisma/seed-formations.ts:263-265`
- Tests : `src/server/formations/__tests__/queries/ListSeancesAVenirQuery.integration.test.ts`, `ListPeriodesInformationQuery.integration.test.ts:24,34`, `GetMatriceProfilsQuery.integration.test.ts:22`, `src/server/formations/__tests__/handlers/SetMotifProfilHandler.integration.test.ts:58`

**Interfaces :**

- Produces :
  - Prisma `formation_motif.deleted_at: Date | null` (ex-`date_suppression`) ;
  - Prisma `formation_seance.cancelled_at: Date | null` (ex-`date_annulation`), `animateurs: string[]` (non nul, `[]` par défaut), plus de `lieu` ;
  - `SeanceAVenir` sans `lieu`, avec `animateurs: string[]`.
- Inchangé : la fonction de domaine `statutSeance({ dateAnnulation, nombreInscrits, nombrePlacesMax })`, alimentée par `cancelled_at`.

- [ ] **Step 1 : préparer le worktree**

Run : `pnpm install` à la racine du worktree (il n'a pas de `node_modules`), puis `pnpm exec prisma generate` dans `apps/pilote-ppg`.
Expected : `Generated Prisma Client`.

- [ ] **Step 2 : écrire la migration**

```sql
-- Les colonnes suivent la convention created_at, updated_at, deleted_at.
ALTER TABLE "formation_motif" RENAME COLUMN "date_suppression" TO "deleted_at";
ALTER TABLE "formation_seance" RENAME COLUMN "date_annulation" TO "cancelled_at";

-- Le lieu est laissé de côté (2026-11-19), à reprendre si le besoin apparaît.
ALTER TABLE "formation_seance" DROP COLUMN "lieu";

-- Animateurs en tableau. Les valeurs existantes ne viennent que du seed local.
ALTER TABLE "formation_seance" ALTER COLUMN "animateurs" TYPE TEXT[]
  USING CASE WHEN "animateurs" IS NULL THEN ARRAY[]::TEXT[] ELSE string_to_array("animateurs", ', ') END;
ALTER TABLE "formation_seance" ALTER COLUMN "animateurs" SET DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "formation_seance" ALTER COLUMN "animateurs" SET NOT NULL;
```

- [ ] **Step 3 : modifier `schema.prisma` à la main**

- Dans `formation_motif`, `date_suppression` devient `deleted_at DateTime? @db.Timestamptz`.
- Dans `formation_seance` : supprimer `lieu` ; `animateurs String[] @default([])` ; `date_annulation` devient `cancelled_at DateTime? @db.Timestamptz`.

- [ ] **Step 4 : appliquer la migration à la base de test et vérifier qu'il n'y a pas d'écart**

Run : `pnpm exec dotenv run -f .env.test -- pnpm exec prisma migrate deploy`, puis `pnpm exec prisma generate`, puis `pnpm exec dotenv run -f .env.test -- pnpm exec prisma migrate diff --from-config-datasource --to-schema src/database/prisma/schema.prisma --script`.
Expected : aucune instruction sur les tables `formation_*`. Seules restent les 7 dérives préexistantes sur `metadata_perimetres` et `metadata_ppgs`.

- [ ] **Step 5 : adapter les tests existants aux nouvelles colonnes**

- `ListSeancesAVenirQuery` :
  - la séance 11 reçoit `animateurs: ["Camille Martin", "Alex Durand"]` et n'a plus de `lieu` ;
  - attendu `animateurs: ["Camille Martin", "Alex Durand"]` pour la séance 11, `animateurs: []` pour les autres, et plus aucune clé `lieu` ;
  - `date_annulation` devient `cancelled_at`.
- `ListPeriodesInformationQuery`, `GetMatriceProfilsQuery`, `SetMotifProfilHandler` : `date_suppression` devient `deleted_at`, et `date_annulation` devient `cancelled_at`.

- [ ] **Step 6 : vérifier que les tests échouent**

Run : `pnpm exec vitest run --project server-integration src/server/formations`
Expected : FAIL. Le code utilise encore `date_suppression`, `date_annulation` et `lieu`.

- [ ] **Step 7 : adapter le code**

- Requêtes et `SetMotifProfilHandler` : filtrer sur `deleted_at: null` et `cancelled_at: null`.
- `ListSeancesAVenirQuery` :
  - `animateurs: seance.animateurs` et `dateAnnulation: seance.cancelled_at` ;
  - le commentaire sur la date d'import devient : « PILOTE écrit tous les motifs reçus à chaque synchronisation : le plus récent `updated_at` donne la date du dernier passage. »
- `useTableauSeancesAVenir` :
  - supprimer la colonne Lieu ;
  - la cellule « Animé par » affiche `info.getValue().join(", ")` ;
  - `champsRecherche` renvoie `[seance.formation, ...seance.animateurs]`.
- Seed : `animateurs: ["Équipe PILOTE"]`, plus de `lieu`, `cancelled_at` à la place de `date_annulation`. La garde anti-tunnel reste intacte.

- [ ] **Step 8 : vérifier que tout passe**

Run : `pnpm exec vitest run --project server-integration src/server/formations && pnpm exec vitest run --project server-unit src/server/formations && pnpm lint:tsc`
Expected : PASS, et `tsc` sans erreur.

- [ ] **Step 9 : commit** (si autorisé)

`refactor(PIL-1883): colonnes des formations alignées sur le contrat copilot`

### Task 2 : formations retirées dans l'admin des périodes

**Files :**

- Modify : `src/server/formations/queries/ListPeriodesInformationQuery.ts`, `src/server/formations/handlers/SavePeriodeInformationHandler.ts` (`verifierFormations`)
- Modify : `src/client/components/PagePanelAdministrateur/Formations/useTableauPeriodesInformation.tsx` (cellule Formations), `usePeriodeInformationForm.ts` (`defaultValues`)
- Tests : `ListPeriodesInformationQuery.integration.test.ts`, `SavePeriodeInformationHandler.integration.test.ts`

**Interfaces :**

- Produces : `PeriodeInformation.motifs: { id: number; nom: string; retiree: boolean }[]`.

- [ ] **Step 1 : écrire les tests qui échouent**

- `ListPeriodesInformationQuery` :
  - ajouter le motif 3 (`"C supprimée"`, déjà retiré) aux `motifIds` de la période `enCours` ;
  - attendu : ses motifs valent `[{ id: 1, nom: "A formation", retiree: false }, { id: 2, nom: "B formation", retiree: false }, { id: 3, nom: "C supprimée", retiree: true }]` ;
  - tous les autres motifs de période reçoivent `retiree: false` ;
  - `motifsDisponibles` ne change pas.
- `SavePeriodeInformationHandler`, nouveau test :

```ts
it(
  "refuse une formation retirée de RDV-SP, en la citant",
  createIntegrationTest(async () => {
    // Given
    await fixtures.formationMotif({ id: BigInt(1) });
    await fixtures.formationMotif({
      id: BigInt(2),
      nom: "Formation retirée",
      deleted_at: new Date("2026-11-10T00:00:00Z"),
    });

    // When
    const execution = handler.execute({
      commande: {
        id: null,
        dateDebut: "2026-12-01",
        dateFin: "2026-12-31",
        motifIds: [1, 2],
      },
      maintenant,
    });

    // Then
    await expect(execution).rejects.toThrow(
      "Formations retirées de RDV-SP : Formation retirée.",
    );
  }),
);
```

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `pnpm exec vitest run --project server-integration src/server/formations/__tests__/queries/ListPeriodesInformationQuery.integration.test.ts src/server/formations/__tests__/handlers/SavePeriodeInformationHandler.integration.test.ts`
Expected : FAIL. `retiree` est absent, et la période est enregistrée sans erreur.

- [ ] **Step 3 : implémenter**

- `ListPeriodesInformationQuery` : `retiree: motif.deleted_at !== null`.
- `verifierFormations` :
  - sélectionner `id`, `nom` et `deleted_at` ;
  - après le contrôle des introuvables, lever `BadRequestError` avec `Formations retirées de RDV-SP : ${noms.join(", ")}.`, les noms triés par ordre alphabétique.
- Tableau des périodes : la cellule Formations affiche `nom` suivi de ` (retirée de RDV-SP)` quand `retiree` est vrai. La recherche (`nomsFormations`) reste sur les noms seuls.
- `usePeriodeInformationForm` : `motifIds` par défaut vaut `periode?.motifs.filter((motif) => !motif.retiree).map((motif) => motif.id) ?? []`.

- [ ] **Step 4 : vérifier que tout passe**

Run : la commande du Step 2, puis `pnpm lint:tsc`
Expected : PASS, et `tsc` sans erreur.

- [ ] **Step 5 : commit** (si autorisé)

`fix(PIL-1883): formations retirées de RDV-SP signalées et écartées des périodes`

### Task 3 : validation de l'envoi copilot

**Files :**

- Create : `src/server/formations/handlers/SyncFormationsHandler.ts` (le schéma seulement ; la classe arrive en Task 4, comme `savePeriodeInformationCommandSchema` vit à côté de son handler)
- Create : `src/server/formations/infrastructure/open-api/formatValidationErrors.ts`
- Test : `src/server/formations/__tests__/handlers/syncFormationsCommandSchema.unit.test.ts`

**Interfaces :**

- Produces :
  - `syncFormationsCommandSchema` (zod) et `type SyncFormationsCommand = z.infer<typeof syncFormationsCommandSchema>` ;
  - `formatValidationErrors(error: z.ZodError): { chemin: string; message: string }[]`.
- Règles du schéma :
  - `motifs` : `{ id: z.int().positive(), nom: z.string().trim().min(1) }[]`, au moins un élément (message `"Au moins un motif est attendu."`) ;
  - `seances` : `{ id, motif_id: z.int().positive(), date_debut: z.iso.datetime({ offset: true }), duree_minutes: z.int().positive(), animateurs: z.array(z.string())` (noms passés par `trim()`, les vides retirés), `cancelled_at: z.iso.datetime({ offset: true }).nullable(), nombre_places_max: z.int().nonnegative().nullable(), nombre_inscrits: z.int().nonnegative(), url_inscription: z.url({ protocol: /^https$/ }) }[]` ;
  - champs inconnus retirés (comportement par défaut de `z.object`) ;
  - un `superRefine` sur l'objet entier, dans cet ordre : doublons de motifs (`Le motif ${id} apparaît plusieurs fois.`, chemin `motifs[i].id`, à partir de la deuxième occurrence), doublons de séances (`La séance ${id} apparaît plusieurs fois.`, chemin `seances[i].id`), puis motif absent (`Le motif ${motif_id} ne fait pas partie de l'envoi.`, chemin `seances[i].motif_id`).
- Chemin : `["seances", 3, "motif_id"]` donne `"seances[3].motif_id"` ; le chemin vide donne `""`.

- [ ] **Step 1 : écrire les tests qui échouent**

Un envoi valide de référence (`ENVOI`) : le motif `2101` « CAMPUS PILOTE : Introduction à l'outil » et la séance `884512` de l'exemple du design. Chaque cas d'erreur vérifie `formatValidationErrors(resultat.error)` :

| Test                                                          | Entrée                                                                | Attendu                                                                                                                                                              |
| ------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| accepte un envoi complet et ignore les champs inconnus        | `ENVOI` avec `visio_url: "https://webconf.example/abc"` sur la séance | `success: true`, `data` égal à `ENVOI` sans `visio_url`                                                                                                              |
| refuse un envoi sans motif                                    | `motifs: []`                                                          | `[{ chemin: "motifs", message: "Au moins un motif est attendu." }]`                                                                                                  |
| refuse un motif ou une séance en double                       | motif `2101` et séance `884512` envoyés deux fois                     | `[{ chemin: "motifs[1].id", message: "Le motif 2101 apparaît plusieurs fois." }, { chemin: "seances[1].id", message: "La séance 884512 apparaît plusieurs fois." }]` |
| refuse une séance dont le motif ne fait pas partie de l'envoi | `motif_id: 2107`                                                      | `[{ chemin: "seances[0].motif_id", message: "Le motif 2107 ne fait pas partie de l'envoi." }]`                                                                       |
| refuse une date au format brut de RDV-SP                      | `date_debut: "2026-12-03 09:30:00 +0100"`                             | `[{ chemin: "seances[0].date_debut", message: expect.any(String) }]`                                                                                                 |
| refuse un identifiant envoyé en texte                         | `motifs[0].id: "2101"`                                                | `[{ chemin: "motifs[0].id", message: expect.any(String) }]`                                                                                                          |
| ignore les noms d'animateurs vides                            | `animateurs: [" ", "Camille Martin "]`                                | `data.seances[0].animateurs` vaut `["Camille Martin"]`                                                                                                               |
| refuse un lien d'inscription qui n'est pas en https           | `url_inscription: "http://rdv.anct.gouv.fr/x"`                        | `[{ chemin: "seances[0].url_inscription", message: expect.any(String) }]`                                                                                            |

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `pnpm exec vitest run --project server-unit src/server/formations/__tests__/handlers/syncFormationsCommandSchema.unit.test.ts`
Expected : FAIL, modules introuvables.

- [ ] **Step 3 : implémenter le schéma et `formatValidationErrors`** selon les règles du bloc Interfaces.

- [ ] **Step 4 : vérifier que les tests passent**

Run : la commande du Step 2.
Expected : PASS (8 tests).

- [ ] **Step 5 : commit** (si autorisé)

`feat(PIL-1883): validation de l'envoi des formations par copilot`

### Task 4 : écriture de l'envoi (`SyncFormationsHandler`)

**Files :**

- Modify : `src/server/formations/handlers/SyncFormationsHandler.ts` (ajout de la classe), `src/server/formations/module.ts`
- Test : `src/server/formations/__tests__/handlers/SyncFormationsHandler.integration.test.ts`

**Interfaces :**

- Consumes : `SyncFormationsCommand` (Task 3).
- Produces :
  - `class SyncFormationsHandler`, `constructor({ prisma, transaction }: Inject<"prisma" | "transaction">)` ;
  - `execute({ commande, maintenant }: { commande: SyncFormationsCommand; maintenant: Date }): Promise<ResultatSyncFormations>` ;
  - `type ResultatSyncFormations = { motifs: { ecrits: number; retires: number }; seances: { ecrites: number } }` ;
  - clé de conteneur `syncFormationsHandler` dans le module `formations`.
- Écriture, dans `this.transaction.run`, avec `this.prisma.getInstance()` :
  1. un `upsert` par motif : création `{ id, nom }`, mise à jour `{ nom, deleted_at: null }` ;
  2. `updateMany` des motifs `{ id: { notIn: ids }, deleted_at: null }` avec `deleted_at: maintenant` ; son `count` donne `retires` ;
  3. `formation_seance.deleteMany({})`, puis `createMany` des séances reçues (`BigInt` pour les identifiants, `new Date(...)` pour les dates).

- [ ] **Step 1 : écrire les tests qui échouent**

Le handler se construit comme dans `SavePeriodeInformationHandler.integration.test.ts`, avec `maintenant = new Date("2026-11-19T05:00:00Z")`.

- **crée les motifs et les séances reçus**
  - Given : base vide.
  - When : envoi avec les motifs 1 et 2, et une séance 11 du motif 1 : `date_debut: "2026-12-03T09:30:00+01:00"`, `animateurs: ["Camille Martin"]`, `cancelled_at: null`, `nombre_places_max: 20`, `nombre_inscrits: 12`.
  - Then : résultat `{ motifs: { ecrits: 2, retires: 0 }, seances: { ecrites: 1 } }`. En base, la séance 11 a `date_debut: new Date("2026-12-03T08:30:00Z")` (Review Focus 5) et les autres valeurs envoyées. Les motifs 1 et 2 ont `deleted_at: null`.
- **met à jour un motif connu sans toucher à sa date de création, et le réactive s'il était retiré**
  - Given : motif 1 `"Ancien nom"`, `created_at: 2026-01-01T00:00:00Z`, `deleted_at: 2026-11-01T00:00:00Z`.
  - When : envoi du motif 1 `"Nouveau nom"`.
  - Then : `{ id: 1n, nom: "Nouveau nom", created_at: new Date("2026-01-01T00:00:00Z"), deleted_at: null }`.
- **retire les motifs absents de l'envoi et garde le paramétrage qui les cite**
  - Given :
    - motifs 1 et 2 ;
    - motif 3 déjà retiré le 2026-11-01 ;
    - `formation_motif_profil` `{ motif_id: 2n, profil_code: "DITP_ADMIN" }` ;
    - une période citant le motif 2 (`fixtures.formationPeriodeInformation`).
  - When : envoi du seul motif 1.
  - Then :
    - motif 2 `deleted_at: maintenant` ;
    - motif 3 garde `deleted_at: new Date("2026-11-01T00:00:00Z")` ;
    - l'association au profil et la ligne `formation_periode_information_motif` sont toujours là ;
    - résultat `motifs: { ecrits: 1, retires: 1 }`.
- **remplace toutes les séances par celles de l'envoi**
  - Given : motif 1 ; séances 11 et 12 (`nombre_inscrits: 3`).
  - When : envoi des séances 12 (`nombre_inscrits: 8`) et 13.
  - Then : `formation_seance.findMany({ select: { id: true, nombre_inscrits: true }, orderBy: { id: "asc" } })` vaut `[{ id: 12n, nombre_inscrits: 8 }, { id: 13n, nombre_inscrits: 0 }]` (séance 13 envoyée avec `nombre_inscrits: 0`).
- **donne le même état quand on rejoue le même envoi**
  - When : même envoi exécuté deux fois.
  - Then :
    - motifs (`id`, `nom`, `deleted_at`, `created_at`) et séances (toutes les colonnes sauf `created_at` et `updated_at`) identiques après chaque exécution ;
    - second résultat `motifs.retires` à `0`.

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `pnpm exec vitest run --project server-integration src/server/formations/__tests__/handlers/SyncFormationsHandler.integration.test.ts`
Expected : FAIL, `SyncFormationsHandler` n'est pas exporté.

- [ ] **Step 3 : implémenter la classe et l'enregistrer dans `module.ts`** (`syncFormationsHandler: asModuleClass(SyncFormationsHandler)`, et le type dans `FormationsOwnCradle`).

- [ ] **Step 4 : vérifier que les tests passent**

Run : la commande du Step 2.
Expected : PASS (5 tests).

- [ ] **Step 5 : commit** (si autorisé)

`feat(PIL-1883): écriture des motifs et séances envoyés par copilot`

### Task 5 : garde du secret de synchronisation

**Files :**

- Modify : `src/config.ts` (nouvelle section `formations`, à côté de `acme`), `.env.example`
- Create : `src/server/framework/guards/onlyFormationsApiSecret.ts`
- Test : `src/server/framework/guards/__tests__/onlyFormationsApiSecret.unit.test.ts`

**Interfaces :**

- Produces :
  - `configuration().formations.apiSecret: string` : `format: String`, `default: ""`, `env: "FORMATIONS_API_SECRET"`, `doc: "Secret de la synchronisation des formations par copilot (PUT /api/open-api/formations). Vide = route désactivée."` ;
  - `onlyFormationsApiSecret(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>): (req: NextApiRequest, res: NextApiResponse) => Promise<void>`.
- Comportement, dans cet ordre, sur le modèle d'`onlyAcmeApiKey` :

  | Condition                       | Réponse                                                          |
  | ------------------------------- | ---------------------------------------------------------------- |
  | méthode autre que `PUT`         | 405 `{ error: "Méthode non autorisée" }`                         |
  | secret non configuré            | 503 `{ error: "Synchronisation des formations non configurée" }` |
  | header absent ou sans `Bearer ` | 401 `{ error: "Header Authorization absent ou invalide" }`       |
  | secret faux                     | 403 `{ error: "Secret de synchronisation invalide" }`            |
  | sinon                           | `errorHandler(handler)(req, res)`                                |

- La comparaison se fait en temps constant : empreintes SHA-256 des deux secrets, comparées avec `crypto.timingSafeEqual`.
- Chaque refus 401, 403 ou 503 donne un `logger.warn` (catégorie `auth`, source `onlyFormationsApiSecret`).

- [ ] **Step 1 : écrire les tests qui échouent**

Sur le modèle de `__tests__/onlyCron.unit.test.ts` (mock de `@/config` avec `logLevel: "warn"` et `formations.apiSecret`, `setupRequest`, `setupResponse`), un test par ligne du tableau. Chacun vérifie le code, le corps JSON exact, et que le handler n'est pas appelé (ou qu'il l'est, avec `request` et `response`, pour le bon secret). Le cas 503 redéfinit le mock avec `apiSecret: ""`. Le header mal formé est `"Basic xyz"`.

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `pnpm exec vitest run --project server-unit src/server/framework/guards/__tests__/onlyFormationsApiSecret.unit.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : implémenter** le garde et la section de configuration. Ajouter à `.env.example`, après `CRON_AUTH_SECRET` :

```
FORMATIONS_API_SECRET=TBD # Secret de la synchronisation des formations par copilot (PUT /api/open-api/formations)
```

- [ ] **Step 4 : vérifier que les tests passent**

Run : la commande du Step 2.
Expected : PASS (6 tests).

- [ ] **Step 5 : commit** (si autorisé)

`feat(PIL-1883): garde du secret de synchronisation des formations`

### Task 6 : route `PUT /api/open-api/formations`

**Files :**

- Create : `src/server/formations/infrastructure/open-api/syncFormationsEndpoint.ts`
- Create : `src/pages/api/open-api/formations.ts`
- Test : `src/server/formations/__tests__/infrastructure/syncFormationsEndpoint.unit.test.ts`

**Interfaces :**

- Consumes : `syncFormationsCommandSchema`, `formatValidationErrors` (Task 3) ; `SyncFormationsHandler` (Task 4) ; `onlyFormationsApiSecret` (Task 5).
- Produces : `syncFormationsEndpoint(recupererHandler: () => Pick<SyncFormationsHandler, "execute">): (request: NextApiRequest, response: NextApiResponse) => Promise<void>`.
- Comportement :
  - `safeParse(request.body)`. En cas d'échec : 400 `{ message: "L'envoi des formations n'est pas valide.", erreurs: formatValidationErrors(error) }`, avec un `logger.warn` (catégorie `import`, source `open-api/formations`, `nombreErreurs`).
  - Sinon : `execute({ commande, maintenant: new Date() })`, puis 200 avec le résultat et un `logger.info` (catégorie `import`, source `open-api/formations`, les compteurs à plat, message `"Synchronisation des formations réussie"`).
- Route : `export default onlyFormationsApiSecret(syncFormationsEndpoint(() => getContainer("formations").resolve("syncFormationsHandler")))`. L'analyseur de corps par défaut de Next reste actif : pas d'export `config`. `/api/open-api` est déjà public dans `proxy.ts`.

- [ ] **Step 1 : écrire les tests qui échouent**

Mock de `@/config` avec `logLevel: "warn"`. La requête vaut `{ ...setupRequest({ method: "PUT" }), body } as unknown as NextApiRequest`, et le handler est `{ execute: vi.fn() }`.

- **refuse un corps absent, sans appeler le handler** : `body: undefined`. Attendu : statut 400, JSON `{ message: "L'envoi des formations n'est pas valide.", erreurs: [{ chemin: "", message: expect.any(String) }] }`, `execute` non appelé.
- **renvoie les compteurs du handler pour un envoi valide** :
  - Given : le corps est l'envoi de référence de la Task 3, avec `visio_url` en plus ; `execute` renvoie `{ motifs: { ecrits: 1, retires: 0 }, seances: { ecrites: 1 } }`.
  - Then : `execute` est appelé avec `{ commande: <envoi sans visio_url>, maintenant: expect.any(Date) }` ; statut 200 et ce JSON.

- [ ] **Step 2 : vérifier que les tests échouent**

Run : `pnpm exec vitest run --project server-unit src/server/formations/__tests__/infrastructure/syncFormationsEndpoint.unit.test.ts`
Expected : FAIL, module introuvable.

- [ ] **Step 3 : implémenter l'endpoint et la route.**

- [ ] **Step 4 : vérifier que tout passe**

Run : la commande du Step 2, puis `pnpm lint:tsc`
Expected : PASS (2 tests), et `tsc` sans erreur.

- [ ] **Step 5 : commit** (si autorisé)

`feat(PIL-1883): route de synchronisation des formations dans l'open-api`

### Task 7 : documentation dans le swagger

**Files :**

- Modify : `doc/api/pilote-api.yml`

**Contenu :**

- Tag `Formations` : « Synchronisation des formations Campus PILOTE depuis Rendez-vous Service Public. Réservée à copilot (DITP), pas aux ministères. »
- `components.securitySchemes.formationsApiSecret` : `type: http`, `scheme: bearer`, description « Secret de synchronisation des formations, transmis par la DITP à copilot. Distinct des tokens d'API des utilisateurs. »
- Chemin `/formations`, opération `put` :
  - `operationId: put-formations`, `tags: [Formations]`, `security: [{ formationsApiSecret: [] }]` ;
  - corps `#/components/schemas/SyncFormationsContrat` ;
  - réponses 200 (`SyncFormationsResultat`), 400 (`SyncFormationsErreur`), 401, 403, 405 et 503, chacune décrite en une phrase.
- Description de l'opération :
  - l'envoi est l'état complet : les motifs absents sont retirés, les séances sont remplacées ;
  - tout ou rien, rejouable.
- Schémas `SyncFormationsContrat`, `SyncFormationsResultat` et `SyncFormationsErreur` :
  - chaque champ a une description qui cite sa source dans RDV-SP (tableau « Contrat avec copilot » du design) ;
  - `url_inscription` explique comment construire le lien ;
  - le contrat porte l'exemple du design.

- [ ] **Step 1 : modifier le fichier**

- [ ] **Step 2 : vérifier que le YAML est valide et que la route y figure**

Run : `node -e "const yaml=require('yaml');const doc=yaml.parse(require('fs').readFileSync('doc/api/pilote-api.yml','utf8'));console.log(Object.keys(doc.paths['/formations']), doc.components.securitySchemes.formationsApiSecret.scheme, Object.keys(doc.components.schemas).filter((nom)=>nom.startsWith('SyncFormations')))"`
Expected : `[ 'put' ] bearer [ 'SyncFormationsContrat', 'SyncFormationsResultat', 'SyncFormationsErreur' ]`.

- [ ] **Step 3 : commit** (si autorisé)

`docs(PIL-1883): synchronisation des formations dans le swagger`

### Task 8 : documents du chantier et vérification finale

**Files :**

- Modify : `docs/superpowers/plans/2026-11-18-formations-rdv-sp-suivi-pr.md`, `docs/superpowers/specs/2026-11-18-formations-rdv-sp-tables-design.md`

- [ ] **Step 1 : mettre à jour le suivi des PR**

La PR 3 y figure déjà (statut Cadrée, depuis le cadrage). Passer son statut à En relecture une fois la PR ouverte, avec son lien.

- [ ] **Step 2 : mettre à jour le design des tables**

- Tableaux de colonnes :
  - `formation_motif.deleted_at` ;
  - `formation_seance` sans `lieu`, avec `animateurs` en `text[]` et `cancelled_at`.
- La partie « Contrat avec copilot » se réduit à un renvoi vers le design de la synchronisation. Les points propres à dlt sont supprimés.

- [ ] **Step 3 : vérification complète**

Run : `pnpm exec prettier --write <fichiers modifiés>`, puis `pnpm lint`, `pnpm test:unit` et `pnpm test:server:integration`.
Expected :

- `pnpm lint` sans erreur ;
- tests unitaires au vert ;
- un seul échec en intégration, `MinistèreSQLRepository` « Accède à un ministère » (préexistant).

- [ ] **Step 4 : `pilote_demo` et essai de bout en bout, seulement si Tristan le demande**

Run :

- `pnpm exec dotenv run -f .env -- pnpm exec prisma db execute --file src/database/prisma/migrations/20261119120000_formations_synchro_copilot/migration.sql` ;
- puis `pnpm exec dotenv run -f .env -- pnpm exec prisma migrate resolve --applied 20261119120000_formations_synchro_copilot` ;
- puis `pnpm database:seed:formations`.

Ensuite, avec `FORMATIONS_API_SECRET` dans `.env` (à demander à Tristan), lancer l'application et faire un `curl -X PUT` sur `/api/open-api/formations` avec l'envoi de référence. Expected : 200 avec les compteurs, et la nouvelle séance visible dans l'onglet Séances à venir.

- [ ] **Step 5 : commit** (si autorisé)

`docs(PIL-1883): suivi et design des tables à jour de la synchronisation copilot`
