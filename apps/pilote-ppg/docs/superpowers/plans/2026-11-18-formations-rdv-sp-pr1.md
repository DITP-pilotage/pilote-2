# Formations RDV-SP, PR 1 : tables, données fictives, onglet Séances à venir — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** créer les six tables des formations, un script local de données fictives, et une page « Formations » du panel administrateur dont l'onglet Séances à venir montre ce que copilot a ramené de RDV-SP.

**Architecture :** tables déclarées dans `schema.prisma` (schéma `public`) avec une migration ; nouveau module serveur `formations` (règle de statut dans `domain/`, une requête CQRS, un routeur tRPC) sur le modèle de `albert-access` et `referentiels` ; page admin à onglets sur le modèle d'`AlbertPanel`, tableau sur `TableauAdmin` / `tableauAdmin.useDataTable` comme les référentiels.

**Tech Stack :** Prisma 7, PostgreSQL, tRPC, Awilix (module-system), Next.js pages router, TanStack Table via `shared/DataTable`, Vitest.

**Spec :** [2026-11-18-formations-rdv-sp-tables-design.md](../specs/2026-11-18-formations-rdv-sp-tables-design.md) — suivi : [2026-11-18-formations-rdv-sp-suivi-pr.md](./2026-11-18-formations-rdv-sp-suivi-pr.md)

Branche : `feat/PIL-1883-formations-tables-seances`, depuis `dev`.

## Global Constraints

- Tout dans le schéma `public`, noms de tables et de colonnes exactement ceux du design (contrat avec copilot).
- Aucune clé étrangère du paramétrage (`formation_motif_profil`, `formation_periode_information_motif`) vers `formation_motif`.
- Éditer `schema.prisma` à la main : `prisma format` reformate tout le fichier.
- Les données fictives ne passent jamais par `seed.ts` ni par le build.
- Métier en français, technique en anglais (noms de classes `…Query`, `…Router`, fichiers `__tests__`, etc.).
- Tests : `expect(result).toEqual(...)` sur l'objet complet ; pas de variable d'un ou deux caractères ; pas de commentaire hors Given/When/Then.
- Lancer `pnpm format` avant `pnpm lint` (qui vérifie le formatage Prettier).
- Ne pas commiter sans demande explicite de Tristan : les étapes « Commit » donnent le message, à passer quand il le demande.
- Base de test : appliquer une migration avec `pnpm exec dotenv run -f .env.test -- pnpm exec prisma migrate deploy` (jamais `migrate reset`). L'échec préexistant de `MinistèreSQLRepository.integration.test.ts` et les 7 dérives de clés étrangères sur `metadata_perimetres` / `metadata_ppgs` ne sont pas à corriger ici.

## Review Focus

1. Séance sans limite de places (`nombre_places_max` nul) : elle est Ouverte et s'affiche « N / – » (test : Task 2).
2. Séance annulée et pleine à la fois : le statut est Annulée, pas Complète (test : Task 2).
3. Copilot n'a encore rien écrit : pas de date d'import, liste vide, message explicite au lieu d'une date vide (test : Task 3).
4. Séance commencée il y a une minute : elle n'est plus « à venir » et disparaît (test : Task 3).
5. Script de données fictives lancé avec une `DATABASE_URL` distante : il s'arrête avant toute requête (vérification : Task 4).

---

### Task 1 : tables et migration

**Files :**
- Modify : `src/database/prisma/schema.prisma` (nouveaux modèles en fin de fichier ; relations inverses dans `model profil` et `model utilisateur`)
- Create : `src/database/prisma/migrations/20261118000000_formations_rdv_sp/migration.sql`

**Interfaces :**
- Produces : modèles Prisma `formation_motif`, `formation_seance` (relation `motif`), `formation_motif_profil`, `formation_periode_information`, `formation_periode_information_motif`, `formation_periode_information_utilisateur`.

- [ ] **Step 1 : ajouter les modèles à `schema.prisma`**

```prisma
model formation_motif {
  id               BigInt             @id
  nom              String
  date_suppression DateTime?          @db.Timestamptz
  date_import      DateTime           @default(now()) @db.Timestamptz
  seances          formation_seance[]

  @@schema("public")
}

model formation_seance {
  id                BigInt          @id
  motif_id          BigInt
  date_debut        DateTime        @db.Timestamptz
  duree_minutes     Int
  lieu              String?
  animateurs        String?
  statut            String
  date_annulation   DateTime?       @db.Timestamptz
  nombre_places_max Int?
  nombre_inscrits   Int
  url_inscription   String
  date_import       DateTime        @default(now()) @db.Timestamptz
  motif             formation_motif @relation(fields: [motif_id], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@index([date_debut])
  @@schema("public")
}

model formation_motif_profil {
  motif_id    BigInt
  profil_code String
  profil      profil @relation(fields: [profil_code], references: [code], onDelete: Cascade, onUpdate: Cascade)

  @@id([motif_id, profil_code])
  @@schema("public")
}

model formation_periode_information {
  id           String                                      @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  date_debut   DateTime                                    @db.Date
  date_fin     DateTime                                    @db.Date
  motifs       formation_periode_information_motif[]
  utilisateurs formation_periode_information_utilisateur[]

  @@schema("public")
}

model formation_periode_information_motif {
  periode_id String                        @db.Uuid
  motif_id   BigInt
  periode    formation_periode_information @relation(fields: [periode_id], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@id([periode_id, motif_id])
  @@schema("public")
}

model formation_periode_information_utilisateur {
  utilisateur_id    String                        @db.Uuid
  periode_id        String                        @db.Uuid
  date_presentation DateTime                      @db.Timestamptz
  date_report       DateTime?                     @db.Timestamptz
  date_fermeture    DateTime?                     @db.Timestamptz
  utilisateur       utilisateur                   @relation(fields: [utilisateur_id], references: [id], onDelete: Cascade, onUpdate: Cascade)
  periode           formation_periode_information @relation(fields: [periode_id], references: [id], onDelete: Cascade, onUpdate: Cascade)

  @@id([utilisateur_id, periode_id])
  @@schema("public")
}
```

Relations inverses : `formation_motifs_profils formation_motif_profil[]` dans `model profil`, `formation_periodes_information formation_periode_information_utilisateur[]` dans `model utilisateur`.

- [ ] **Step 2 : générer le SQL depuis la base de test à jour**

Run : `pnpm exec dotenv run -f .env.test -- pnpm exec prisma migrate diff --from-config-datasource --to-schema src/database/prisma/schema.prisma --script`
Expected : les `CREATE TABLE`, `CREATE INDEX` et `ALTER TABLE … ADD CONSTRAINT` des six tables `formation_*`, mêlés aux 7 dérives préexistantes sur `metadata_perimetres` / `metadata_ppgs`.

- [ ] **Step 3 : écrire `migration.sql`** avec uniquement les instructions `formation_*` du Step 2, chaque table précédée d'un commentaire d'une ligne en français (style de `20261015000000_albert_access`). Les deux tables remplies par copilot portent en commentaire : « Remplie par copilot depuis RDV-SP (vidée puis rechargée à chaque import). »

- [ ] **Step 4 : appliquer et vérifier l'absence d'écart**

Run : `pnpm exec dotenv run -f .env.test -- pnpm exec prisma migrate deploy`, puis de nouveau la commande du Step 2.
Expected : la migration s'applique ; le diff ne contient plus aucune ligne `formation_*` (seules les 7 dérives préexistantes restent).

- [ ] **Step 5 : vérifier le client et les types**

Run : `pnpm exec prisma generate && pnpm lint:tsc`
Expected : succès.

- [ ] **Step 6 : Commit** — `feat(PIL-1883): tables des formations RDV-SP`

---

### Task 2 : statut d'une séance

**Files :**
- Create : `src/server/formations/domain/statutSeance.ts`
- Test : `src/server/formations/__tests__/domain/statutSeance.unit.test.ts`

**Interfaces :**
- Produces :
  - `type StatutSeance = "OUVERTE" | "COMPLETE" | "ANNULEE"`
  - `statutSeance(seance: { dateAnnulation: Date | null; nombreInscrits: number; nombrePlacesMax: number | null }): StatutSeance`
  - Règle : annulée si `dateAnnulation` non nulle ; sinon complète si `nombrePlacesMax` non nul et `nombreInscrits >= nombrePlacesMax` ; sinon ouverte. La PR 3 (slide-in) réutilise cette fonction pour ne garder que les séances `OUVERTE`.

- [ ] **Step 1 : écrire les tests**

```ts
describe("statutSeance", () => {
  it("est annulée dès qu'une date d'annulation existe, même pleine", () => {
    expect(
      statutSeance({ dateAnnulation: new Date("2026-11-10T09:00:00Z"), nombreInscrits: 20, nombrePlacesMax: 20 }),
    ).toEqual("ANNULEE");
  });

  it("est complète quand les inscrits atteignent ou dépassent la limite", () => {
    expect(statutSeance({ dateAnnulation: null, nombreInscrits: 20, nombrePlacesMax: 20 })).toEqual("COMPLETE");
    expect(statutSeance({ dateAnnulation: null, nombreInscrits: 21, nombrePlacesMax: 20 })).toEqual("COMPLETE");
  });

  it("est ouverte sous la limite", () => {
    expect(statutSeance({ dateAnnulation: null, nombreInscrits: 12, nombrePlacesMax: 20 })).toEqual("OUVERTE");
  });

  it("est ouverte quand RDV-SP ne fixe pas de limite de places", () => {
    expect(statutSeance({ dateAnnulation: null, nombreInscrits: 50, nombrePlacesMax: null })).toEqual("OUVERTE");
  });
});
```

- [ ] **Step 2 : vérifier l'échec** — Run : `pnpm test:server:unit src/server/formations` — Expected : FAIL, module introuvable.

- [ ] **Step 3 : implémenter `statutSeance`** dans `src/server/formations/domain/statutSeance.ts`.

- [ ] **Step 4 : vérifier le succès** — même commande — Expected : 4 tests PASS.

- [ ] **Step 5 : Commit** — `feat(PIL-1883): statut d'une séance de formation`

---

### Task 3 : requête des séances à venir, module et routeur

**Files :**
- Create : `src/server/formations/queries/ListSeancesAVenirQuery.ts`
- Create : `src/server/formations/module.ts`
- Create : `src/server/formations/infrastructure/trpc/formation.ts`
- Modify : `src/server/module-system/moduleNames.ts` (ajouter `"formations"`)
- Modify : `src/server/dependances.ts` (`formationsModule` dans `allModules` et `formations: getContainer("formations")` dans `registerContainer`)
- Modify : `src/server/app/trpc/appRouter.ts` (`formation: formationRouter`)
- Modify : `src/utils/categoriesLog.ts` (`formation: "Formations"`)
- Modify : `src/server/framework/trpc/categorieLogRouteurTRPC.ts` (`formation: "formation"`)
- Modify : `src/test/fixtures.ts` (fixtures `formationMotif`, `formationSeance`)
- Test : `src/server/formations/__tests__/queries/ListSeancesAVenirQuery.integration.test.ts`

**Interfaces :**
- Consumes : `statutSeance`, `StatutSeance` (Task 2) ; modèles Prisma (Task 1).
- Produces :
  - `interface SeanceAVenir { id: number; formation: string; dateDebut: string; dureeMinutes: number; lieu: string | null; animateurs: string | null; nombreInscrits: number; nombrePlacesMax: number | null; urlInscription: string; statut: StatutSeance }` (`dateDebut` en ISO ; `id` et `formation` viennent de la séance et du nom du motif)
  - `interface SeancesAVenir { dateImport: string | null; seances: SeanceAVenir[] }`
  - `class ListSeancesAVenirQuery { constructor({ prisma }: Inject<"prisma">); run({ maintenant }: { maintenant: Date }): Promise<SeancesAVenir> }`
  - Module `formations` (imports `["framework"]`, aucun export), cradle `{ listSeancesAVenirQuery }`, et `export type Inject<K>` comme `albert-access/module.ts`.
  - Routeur `formationRouter` : `listSeancesAVenir: protectedProcedure.query(...)`, qui appelle `checkAdminPermission(ctx.session)` puis `run({ maintenant: new Date() })`. Côté client : `api.formation.listSeancesAVenir.useQuery()`.
  - Fixtures : `fixtures.formationMotif(overrides?: Partial<Prisma.formation_motifUncheckedCreateInput>)` (id `BigInt` aléatoire, `nom` « Motif test {id} ») et `fixtures.formationSeance(overrides?: Partial<Prisma.formation_seanceUncheckedCreateInput>)` (crée un motif si `motif_id` absent ; défauts : `date_debut` dans 7 jours, `duree_minutes` 45, `statut` « unknown », `nombre_inscrits` 0, `url_inscription` « https://rdv.anct.gouv.fr/prendre_rdv?public_link_organisation_id=1453 »).

Choix de la requête : séances avec `date_debut` strictement après `maintenant`, motif inclus, triées par `date_debut` puis `id` croissants ; `dateImport` = maximum de `formation_motif.date_import` (copilot réécrit tous les motifs à chaque import, même sans séance à venir).

- [ ] **Step 1 : ajouter les deux fixtures** dans `src/test/fixtures.ts`, à côté de `metadataPorteur`.

- [ ] **Step 2 : écrire les tests d'intégration**

```ts
describe("ListSeancesAVenirQuery", () => {
  const maintenant = new Date("2026-11-18T10:00:00Z");

  it(
    "retourne les séances qui n'ont pas commencé, triées par date, avec leur statut",
    createIntegrationTest(async () => {
      // Given
      await fixtures.formationMotif({ id: 1n, nom: "CAMPUS PILOTE : Introduction à l'outil", date_import: new Date("2026-11-18T05:02:00Z") });
      await fixtures.formationSeance({ id: 11n, motif_id: 1n, date_debut: new Date("2026-11-20T13:00:00Z"), nombre_inscrits: 12, nombre_places_max: 20, lieu: "Visioconférence", animateurs: "Équipe PILOTE" });
      await fixtures.formationSeance({ id: 12n, motif_id: 1n, date_debut: new Date("2026-11-19T13:00:00Z"), nombre_inscrits: 20, nombre_places_max: 20 });
      await fixtures.formationSeance({ id: 13n, motif_id: 1n, date_debut: new Date("2026-11-25T13:00:00Z"), date_annulation: new Date("2026-11-15T08:00:00Z"), statut: "revoked" });
      // Séance commencée une minute avant `maintenant` : elle n'est plus à venir
      await fixtures.formationSeance({ id: 14n, motif_id: 1n, date_debut: new Date("2026-11-18T09:59:00Z") });

      // When
      const resultat = await new ListSeancesAVenirQuery({ prisma: new PrismaPilote() }).run({ maintenant });

      // Then
      expect(resultat).toEqual({
        dateImport: "2026-11-18T05:02:00.000Z",
        seances: [
          { id: 12, formation: "CAMPUS PILOTE : Introduction à l'outil", dateDebut: "2026-11-19T13:00:00.000Z", dureeMinutes: 45, lieu: null, animateurs: null, nombreInscrits: 20, nombrePlacesMax: 20, urlInscription: "https://rdv.anct.gouv.fr/prendre_rdv?public_link_organisation_id=1453", statut: "COMPLETE" },
          { id: 11, formation: "CAMPUS PILOTE : Introduction à l'outil", dateDebut: "2026-11-20T13:00:00.000Z", dureeMinutes: 45, lieu: "Visioconférence", animateurs: "Équipe PILOTE", nombreInscrits: 12, nombrePlacesMax: 20, urlInscription: "https://rdv.anct.gouv.fr/prendre_rdv?public_link_organisation_id=1453", statut: "OUVERTE" },
          { id: 13, formation: "CAMPUS PILOTE : Introduction à l'outil", dateDebut: "2026-11-25T13:00:00.000Z", dureeMinutes: 45, lieu: null, animateurs: null, nombreInscrits: 0, nombrePlacesMax: null, urlInscription: "https://rdv.anct.gouv.fr/prendre_rdv?public_link_organisation_id=1453", statut: "ANNULEE" },
        ],
      });
    }),
  );

  it(
    "renvoie une date d'import nulle et aucune séance tant que copilot n'a rien écrit",
    createIntegrationTest(async () => {
      // When
      const resultat = await new ListSeancesAVenirQuery({ prisma: new PrismaPilote() }).run({ maintenant });

      // Then
      expect(resultat).toEqual({ dateImport: null, seances: [] });
    }),
  );
});
```

- [ ] **Step 3 : vérifier l'échec** — Run : `pnpm test:server:integration src/server/formations` — Expected : FAIL, `ListSeancesAVenirQuery` introuvable.

- [ ] **Step 4 : implémenter la requête, le module, le routeur et les branchements** listés dans Files (ids `BigInt` convertis avec `Number`, dates en `toISOString()`).

- [ ] **Step 5 : vérifier** — Run : `pnpm test:server:integration src/server/formations && pnpm lint:tsc` — Expected : 2 tests PASS, aucune erreur de type (le contrôle d'exhaustivité de `dependances.ts` et le `Record` de `categorieLogRouteurTRPC.ts` échouent si un branchement manque).

- [ ] **Step 6 : Commit** — `feat(PIL-1883): requête des séances de formation à venir`

---

### Task 4 : script de données fictives

**Files :**
- Create : `src/database/prisma/seed-formations.ts`
- Modify : `package.json` (script `"database:seed:formations": "dotenv run -f .env -- tsx src/database/prisma/seed-formations.ts"`)

**Interfaces :**
- Consumes : modèles Prisma (Task 1), `prisma` de `@/server/framework/persistence/prisma`.

Comportement :
- Avant toute requête, refuse (`console.error` + `process.exit(1)`) si `process.env.DATABASE_URL` ne correspond pas à `/@(localhost|127\.0\.0\.1)(:[0-9]+)?\//` (même garde que `tests/seed/seed.sh`).
- Dans une transaction : vide les six tables `formation_*`, puis insère le jeu ci-dessous. Rejouable à volonté.
- Dates calculées par rapport au lancement (`J` = aujourd'hui, heure de séance 14:00 locale).

Jeu de données (identifiants fictifs) :

| id motif | nom |
| --- | --- |
| 900001 | CAMPUS PILOTE : Introduction à l'outil |
| 900002 | CAMPUS PILOTE : Saisir des commentaires dans l'outil |
| 900003 | CAMPUS PILOTE : Le rôle de chaque acteur (Qui saisit quoi dans l'outil) |
| 900004 | CAMPUS PILOTE : Importer des données pour les indicateurs |
| 900005 | CAMPUS PILOTE : Maîtriser l'Assistant IA |
| 900006 | CAP sur PILOTE : Devenir un coordinateur efficace |

Profils (matrice validée dans PIL-1883) :
- 900001, 900002, 900003, 900005 : `COORDINATEUR_REGION`, `COORDINATEUR_DEPARTEMENT`, `DIR_ADMIN_CENTRALE`, `PREFET_DEPARTEMENT`, `PREFET_REGION`, `SERVICES_DECONCENTRES_DEPARTEMENT`, `SERVICES_DECONCENTRES_REGION`, `SECRETARIAT_GENERAL`, `EQUIPE_DIR_PROJET`, `DITP_ADMIN`, `DITP_PILOTAGE`
- 900004 : `DIR_ADMIN_CENTRALE`, `SECRETARIAT_GENERAL`, `EQUIPE_DIR_PROJET`, `DITP_ADMIN`, `DITP_PILOTAGE`
- 900006 : `COORDINATEUR_REGION`, `COORDINATEUR_DEPARTEMENT`, `DITP_ADMIN`, `DITP_PILOTAGE`

Séances (toutes : 45 min, lieu « Visioconférence », animateurs « Équipe PILOTE », `url_inscription` « https://rdv.anct.gouv.fr/prendre_rdv?departement=&public_link_organisation_id=1453 », statut « unknown » sauf annulée « revoked ») :

| id | motif | début | inscrits / places | particularité |
| --- | --- | --- | --- | --- |
| 910001 | 900001 | J+2 | 8 / 30 | ouverte |
| 910002 | 900001 | J+16 | 0 / 30 | ouverte |
| 910003 | 900002 | J+3 | 30 / 30 | complète |
| 910004 | 900002 | J+10 | 5 / 30 | ouverte |
| 910005 | 900003 | J+9 | 2 / – | ouverte, sans limite |
| 910006 | 900004 | J−5 | 18 / 30 | passée : aucune séance à venir pour ce motif |
| 910007 | 900005 | J+4 | 12 / 30 | annulée (`date_annulation` = J−1) |
| 910008 | 900005 | J+11 | 3 / 30 | ouverte |
| 910009 | 900006 | J+7 | 10 / 20 | ouverte |

Périodes : `11111111-1111-4111-8111-111111111111` du J−7 au J+30 avec 900001, 900002, 900005, 900006 ; `22222222-2222-4222-8222-222222222222` du J−90 au J−60 avec 900001. Aucune ligne dans `formation_periode_information_utilisateur`.

- [ ] **Step 1 : écrire `seed-formations.ts`** et le script `package.json`.

- [ ] **Step 2 : vérifier la garde** — Run : `DATABASE_URL=postgresql://u:p@exemple.gouv.fr:5432/pilote pnpm exec tsx src/database/prisma/seed-formations.ts` — Expected : message d'erreur, code de sortie 1, aucune connexion.

- [ ] **Step 3 : appliquer la migration à la base locale de dev, puis lancer le script deux fois**

Run : `pnpm exec dotenv run -f .env -- pnpm exec prisma migrate deploy && pnpm database:seed:formations && pnpm database:seed:formations`
Expected : succès les deux fois.

- [ ] **Step 4 : vérifier le contenu** — Run : `pnpm exec dotenv run -f .env -- sh -c 'psql "$DATABASE_URL" -c "select (select count(*) from formation_motif) motifs, (select count(*) from formation_seance) seances, (select count(*) from formation_motif_profil) profils, (select count(*) from formation_periode_information) periodes, (select count(*) from formation_periode_information_motif) periode_motifs"'` — Expected : `6 | 9 | 53 | 2 | 5`.

- [ ] **Step 5 : Commit** — `feat(PIL-1883): données fictives locales des formations`

---

### Task 5 : page Formations et onglet Séances à venir

**Files :**
- Create : `src/pages/panel-administrateur/formations.tsx`
- Create : `src/client/components/PagePanelAdministrateur/Formations/FormationsPanel.tsx`
- Create : `src/client/components/PagePanelAdministrateur/Formations/SeancesAVenir.tsx`
- Create : `src/client/components/PagePanelAdministrateur/Formations/useTableauSeancesAVenir.tsx`
- Modify : `src/client/components/PagePanelAdministrateur/MenuLateralPanelAdministrateur/MenuLateralPanelAdministrateur.tsx` (entrée « Formations », `href` `/panel-administrateur/formations`, `pageKey` `formations`, placée après « Centre d'aide »)
- Modify : `docs/superpowers/plans/2026-11-18-formations-rdv-sp-suivi-pr.md` (PR 1 : branche, statut)

**Interfaces :**
- Consumes : `api.formation.listSeancesAVenir.useQuery()` et les types `SeanceAVenir`, `SeancesAVenir`, `StatutSeance` (Tasks 2 et 3).
- Produces : `FormationsPanel` à onglets dans l'URL (`?onglet=`), structuré comme `AlbertPanel` (`ITEMS`, `CONTENU`) avec pour l'instant un seul onglet `{ value: "seances-a-venir", label: "Séances à venir" }`. La PR 2 y ajoute « Profils » et « Périodes d'information » devant.

Détails :
- Page : garde `getServerSideProps` identique à `pages/panel-administrateur/referentiels/porteurs/index.tsx` (`estAutoriseAAccederALaPageAdmin`, soit DITP Admin), titre « Panel Administrateur - Formations - PILOTE », `NextPanelAdministrateurLayout pageActive="formations"`.
- En tête de l'onglet : « Données RDV-SP importées le {formaterDate(dateImport, "DD/MM/YYYY [à] H[h]mm")} », ou « Aucune donnée RDV-SP importée pour l'instant. » si `dateImport` est nul.
- Tableau : `TableauAdmin` (caption « Séances de formation à venir », libellés `aucun` « Aucune séance à venir », `aucunResultat` « Aucune séance ne correspond à ») sur `tableauAdmin.useDataTable`, sans `getRowHref`, `rowHeader: "formation"`, recherche sur formation, lieu et animateurs.
- Colonnes, dans l'ordre :

| id | En-tête | Contenu | Tri | Filtre |
| --- | --- | --- | --- | --- |
| `dateDebut` | Date | `formaterDate(dateDebut, "DD/MM/YYYY HH[:]mm")` | oui | |
| `formation` | Formation | nom du motif | oui | cases à cocher, options = formations présentes dans les données |
| `dureeMinutes` | Durée | « 45 min » | | |
| `lieu` | Lieu | texte ou vide | | |
| `animateurs` | Animé par | texte ou vide | | |
| `nombreInscrits` | Inscrits | « 12 / 20 », « 2 / – » sans limite | oui | |
| `statut` | Statut | `Badge` : Ouverte `success`, Complète `warning`, Annulée `error` | oui | cases à cocher Ouverte, Complète, Annulée (`filterFnOneOf`) |
| `urlInscription` | Inscription | lien externe « Lien », `target="_blank" rel="noopener noreferrer"`, `aria-label` « Inscription à {formation} du {date} (nouvelle fenêtre) » | | |

- `urlState` propre (pas `urlStateAdmin`, dont le tri par défaut porte sur `updatedAt`) : tri par défaut `[{ id: "dateDebut", desc: false }]`, `pagination: { pageSize: 20 }`, `globalFilter: true`, filtres `{ param: "statut", columnId: "statut" }` et `{ param: "formation", columnId: "formation" }`, `shallow: true`, `history: "replace"`.

- [ ] **Step 1 : écrire la page, le panneau, l'onglet, le hook du tableau et l'entrée de menu.**

- [ ] **Step 2 : vérifier le code** — Run : `pnpm lint` — Expected : succès.

- [ ] **Step 3 : vérifier dans le navigateur** avec les données fictives de la Task 4 et un compte DITP Admin, sur `/panel-administrateur/formations` : 8 séances à venir triées par date (la 910006, passée, absente) ; 910003 Complète, 910007 Annulée, 910005 « 2 / – » Ouverte ; le filtre Statut = Annulée ne laisse que 910007 ; la recherche « Assistant » ne laisse que 910007 et 910008 ; l'en-tête affiche la date d'import du lancement du script. Si la connexion locale n'est pas possible pour l'agent, demander à Tristan de faire ce contrôle.

- [ ] **Step 4 : mettre à jour le suivi des PR** (PR 1 : branche `feat/PIL-1883-formations-tables-seances`, statut « En cours », lien du plan).

- [ ] **Step 5 : Commit** — `feat(PIL-1883): onglet Séances à venir du panel administrateur`
