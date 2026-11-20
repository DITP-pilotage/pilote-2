# Formations RDV-SP, PR 2 : onglets Profils et Périodes d'information — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** permettre à DITP Admin d'associer chaque formation RDV-SP à des profils PILOTE (matrice) et de gérer les périodes d'information, avec les règles validées le 2026-11-18.

**Architecture :** règles de période pures dans `src/server/formations/domain/` (partagées par le serveur et le formulaire) ; deux requêtes et trois handlers dans le module `formations` (patron CQRS des `referentiels`), exposés sur le routeur tRPC `formation` avec CSRF ; deux nouveaux onglets dans `FormationsPanel`.

**Tech Stack :** Prisma 7, tRPC, Awilix, luxon, Next.js pages router, composants `shared` (Table, Checkbox, CheckboxField, TextField, Modale, Badge, Tabs), sonner, Vitest.

**Spec :** [2026-11-18-formations-rdv-sp-tables-design.md](../specs/2026-11-18-formations-rdv-sp-tables-design.md) — suivi : [2026-11-18-formations-rdv-sp-suivi-pr.md](./2026-11-18-formations-rdv-sp-suivi-pr.md)

Branche : `feat/PIL-1883-formations-profils-periodes`, empilée sur `feat/PIL-1883-formations-tables-seances` (PR #2707).

## Règles validées par Tristan (2026-11-18)

- Statut d'une période calculé sur la date du jour, heure de Paris : À venir, En cours (du premier au dernier jour inclus), Passée.
- À l'enregistrement : fin ≥ début, au moins une formation, aucun chevauchement avec une autre période, bornes comprises (une période qui finit le 30 et une autre qui commence le 30 se chevauchent).
- Création, ou période À venir : la fin ne peut pas être passée (≥ aujourd'hui) ; tout se modifie ; suppression possible.
- En cours : la fin et les formations se modifient, le début est figé, pas de suppression ; pour l'arrêter on avance la fin à hier (≥ hier).
- Passée : lecture seule.
- Formulaire en modale ; erreurs sous les champs au clic sur Enregistrer ; boutons jamais désactivés.
- Matrice : 16 profils en lignes (tri par nom, comme Albert), motifs non supprimés en colonnes, case enregistrée au clic avec un toast.

## Global Constraints

- Dates de période transportées partout en chaîne `AAAA-MM-JJ` (`JourISO`), jamais en `Date` côté client : les colonnes `@db.Date` reviennent de Prisma à minuit UTC.
- « Aujourd'hui » est calculé côté serveur (`aujourdhuiAParis`) et renvoyé au client avec les périodes, pour que formulaire et serveur appliquent les mêmes règles.
- Mutations : entrée `schema.and(zodValidateurCSRF)`, puis `checkCsrf(ctx.csrfDuCookie, input.csrf)` et `checkAdminPermission(ctx.session)`, comme `referentielPorteur`. Côté client, `csrf: récupérerUnCookie("csrf") ?? ""`.
- Erreur métier côté serveur : `throw new BadRequestError(message)` (`@/shared/errors/bad-request-error`) ; son message arrive tel quel au client (`errorFormatter` de `trpc.ts`).
- Écritures multiples dans `this.transaction.run(...)` (dépendance `transaction` du module `framework`).
- Métier en français, technique en anglais ; tests `expect(...).toEqual(...)` sur l'objet entier ; pas de variable d'une ou deux lettres ; pas de commentaire hors Given/When/Then.
- Pas de test client (aucun précédent sur les pages admin).
- `pnpm format` avant `pnpm lint`. L'erreur TS préexistante de `.next/dev/types/validator.ts` et l'échec préexistant de `MinistèreSQLRepository` ne sont pas à corriger ici.
- Ne pas commiter sans demande explicite de Tristan.

## Review Focus

1. Une saisie faite entre minuit et 1 h ou 2 h, heure de Paris : « aujourd'hui » est le jour de Paris, pas le jour UTC (test : Task 1).
2. Une période accolée, qui commence le lendemain de la fin d'une autre, est acceptée ; une qui commence le jour même est refusée (test : Task 1).
3. Modifier une période en gardant ses dates : elle ne se compare pas à elle-même (test : Task 3).
4. Une période dont une formation a disparu de RDV-SP s'affiche « Formation inconnue » au lieu de casser la liste (test : Task 3).
5. Double clic sur une case de la matrice : cocher deux fois ne crée pas de doublon, décocher une case déjà vide ne lève pas d'erreur (test : Task 2).

---

### Task 1 : règles d'une période d'information

**Files :**
- Create : `src/server/formations/domain/periodeInformation.ts`
- Test : `src/server/formations/__tests__/domain/periodeInformation.unit.test.ts`

**Interfaces :**
- Produces :
  - `type JourISO = string` (`"AAAA-MM-JJ"`)
  - `type StatutPeriode = "A_VENIR" | "EN_COURS" | "PASSEE"`
  - `aujourdhuiAParis(maintenant: Date): JourISO` (luxon : `DateTime.fromJSDate(maintenant).setZone("Europe/Paris").toISODate()`)
  - `jourPrecedent(jour: JourISO): JourISO`
  - `formaterJour(jour: JourISO): string` (`"2026-11-03"` → `"03/11/2026"`)
  - `statutPeriode(periode: { dateDebut: JourISO; dateFin: JourISO }, aujourdhui: JourISO): StatutPeriode`
  - `type SaisiePeriode = { dateDebut: JourISO; dateFin: JourISO; motifIds: number[] }`
  - `type ErreursPeriode = Partial<Record<"periode" | "dateDebut" | "dateFin" | "motifIds", string>>`
  - `validerPeriode({ saisie, periodeModifiee, autresPeriodes, aujourdhui }: { saisie: SaisiePeriode; periodeModifiee: { dateDebut: JourISO; dateFin: JourISO } | null; autresPeriodes: { dateDebut: JourISO; dateFin: JourISO }[]; aujourdhui: JourISO }): ErreursPeriode`

Règles de `validerPeriode` (comparaison de chaînes `AAAA-MM-JJ`) :
- `periodeModifiee` passée → uniquement `{ periode: "Une période passée ne se modifie plus." }`.
- `dateDebut` vide → `"Indiquez une date de début."` ; sinon, si `periodeModifiee` est en cours et que `saisie.dateDebut !== periodeModifiee.dateDebut` → `"La date de début d'une période en cours ne se modifie plus."` ; sinon chevauchement (ci-dessous).
- `dateFin`, premier message applicable : vide → `"Indiquez une date de fin."` ; `dateFin < dateDebut` → `"La date de fin doit être égale ou postérieure à la date de début."` ; en cours et `dateFin < jourPrecedent(aujourdhui)` → `"La date de fin ne peut pas être antérieure à hier."` ; création ou à venir et `dateFin < aujourdhui` → `"La date de fin ne peut pas être passée."`.
- `motifIds` vide → `"Choisissez au moins une formation."`.
- Chevauchement, seulement si les deux dates sont renseignées et `dateFin >= dateDebut` : première autre période (triée par `dateDebut`) telle que `saisie.dateDebut <= autre.dateFin && autre.dateDebut <= saisie.dateFin` → sur `dateDebut` : `` `Cette période chevauche celle du ${formaterJour(autre.dateDebut)} au ${formaterJour(autre.dateFin)}.` ``

- [ ] **Step 1 : écrire les tests** (aujourd'hui = `"2026-11-18"` sauf mention)

```ts
const AUJOURDHUI = "2026-11-18";
const valide = { dateDebut: "2026-12-01", dateFin: "2026-12-31", motifIds: [900001] };

describe("aujourdhuiAParis", () => {
  it("donne le jour à Paris, pas le jour UTC", () => {
    expect(aujourdhuiAParis(new Date("2026-11-18T23:30:00Z"))).toEqual("2026-11-19");
    expect(aujourdhuiAParis(new Date("2026-07-01T21:59:00Z"))).toEqual("2026-07-01");
    expect(aujourdhuiAParis(new Date("2026-07-01T22:00:00Z"))).toEqual("2026-07-02");
  });
});

describe("jourPrecedent", () => {
  it("recule d'un jour en changeant de mois", () => {
    expect(jourPrecedent("2026-03-01")).toEqual("2026-02-28");
  });
});

describe("statutPeriode", () => {
  it("est à venir avant le premier jour, en cours du premier au dernier jour inclus, passée ensuite", () => {
    const periode = { dateDebut: "2026-11-18", dateFin: "2026-11-30" };
    expect(statutPeriode(periode, "2026-11-17")).toEqual("A_VENIR");
    expect(statutPeriode(periode, "2026-11-18")).toEqual("EN_COURS");
    expect(statutPeriode(periode, "2026-11-30")).toEqual("EN_COURS");
    expect(statutPeriode(periode, "2026-12-01")).toEqual("PASSEE");
  });
});

describe("validerPeriode", () => {
  it("accepte une nouvelle période valide", () => {
    expect(validerPeriode({ saisie: valide, periodeModifiee: null, autresPeriodes: [], aujourdhui: AUJOURDHUI })).toEqual({});
  });

  it("demande les deux dates et au moins une formation", () => {
    expect(
      validerPeriode({ saisie: { dateDebut: "", dateFin: "", motifIds: [] }, periodeModifiee: null, autresPeriodes: [], aujourdhui: AUJOURDHUI }),
    ).toEqual({
      dateDebut: "Indiquez une date de début.",
      dateFin: "Indiquez une date de fin.",
      motifIds: "Choisissez au moins une formation.",
    });
  });

  it("refuse une fin avant le début", () => {
    expect(
      validerPeriode({ saisie: { ...valide, dateFin: "2026-11-30" }, periodeModifiee: null, autresPeriodes: [], aujourdhui: AUJOURDHUI }),
    ).toEqual({ dateFin: "La date de fin doit être égale ou postérieure à la date de début." });
  });

  it("refuse une nouvelle période qui finit avant aujourd'hui", () => {
    expect(
      validerPeriode({ saisie: { ...valide, dateDebut: "2026-11-01", dateFin: "2026-11-17" }, periodeModifiee: null, autresPeriodes: [], aujourdhui: AUJOURDHUI }),
    ).toEqual({ dateFin: "La date de fin ne peut pas être passée." });
  });

  it("refuse un chevauchement d'un seul jour, bornes comprises", () => {
    expect(
      validerPeriode({
        saisie: { ...valide, dateDebut: "2026-11-30" },
        periodeModifiee: null,
        autresPeriodes: [{ dateDebut: "2026-11-03", dateFin: "2026-11-30" }],
        aujourdhui: AUJOURDHUI,
      }),
    ).toEqual({ dateDebut: "Cette période chevauche celle du 03/11/2026 au 30/11/2026." });
  });

  it("accepte une période qui commence le lendemain de la fin d'une autre", () => {
    expect(
      validerPeriode({ saisie: valide, periodeModifiee: null, autresPeriodes: [{ dateDebut: "2026-11-03", dateFin: "2026-11-30" }], aujourdhui: AUJOURDHUI }),
    ).toEqual({});
  });

  it("refuse toute modification d'une période passée", () => {
    expect(
      validerPeriode({ saisie: valide, periodeModifiee: { dateDebut: "2026-10-01", dateFin: "2026-10-31" }, autresPeriodes: [], aujourdhui: AUJOURDHUI }),
    ).toEqual({ periode: "Une période passée ne se modifie plus." });
  });

  it("fige le début d'une période en cours et accepte de l'arrêter hier, pas avant", () => {
    const enCours = { dateDebut: "2026-11-10", dateFin: "2026-11-30" };
    expect(
      validerPeriode({ saisie: { ...valide, dateDebut: "2026-11-12", dateFin: "2026-11-30" }, periodeModifiee: enCours, autresPeriodes: [], aujourdhui: AUJOURDHUI }),
    ).toEqual({ dateDebut: "La date de début d'une période en cours ne se modifie plus." });
    expect(
      validerPeriode({ saisie: { ...valide, dateDebut: "2026-11-10", dateFin: "2026-11-17" }, periodeModifiee: enCours, autresPeriodes: [], aujourdhui: AUJOURDHUI }),
    ).toEqual({});
    expect(
      validerPeriode({ saisie: { ...valide, dateDebut: "2026-11-10", dateFin: "2026-11-16" }, periodeModifiee: enCours, autresPeriodes: [], aujourdhui: AUJOURDHUI }),
    ).toEqual({ dateFin: "La date de fin ne peut pas être antérieure à hier." });
  });
});
```

- [ ] **Step 2 : vérifier l'échec** — Run : `pnpm test:server:unit src/server/formations` — Expected : FAIL, module `periodeInformation` introuvable.
- [ ] **Step 3 : implémenter** `periodeInformation.ts`.
- [ ] **Step 4 : vérifier** — même commande — Expected : tous les tests PASS (dont les 4 de `statutSeance`).
- [ ] **Step 5 : Commit** — `feat(PIL-1883): règles des périodes d'information`

---

### Task 2 : matrice motif ↔ profils côté serveur

**Files :**
- Create : `src/server/formations/queries/GetMatriceProfilsQuery.ts`
- Create : `src/server/formations/handlers/SetMotifProfilHandler.ts`
- Modify : `src/server/formations/module.ts` (cradle : `getMatriceProfilsQuery`, `setMotifProfilHandler`)
- Modify : `src/server/formations/infrastructure/trpc/formation.ts`
- Test : `src/server/formations/__tests__/queries/GetMatriceProfilsQuery.integration.test.ts`, `src/server/formations/__tests__/handlers/SetMotifProfilHandler.integration.test.ts`

**Interfaces :**
- Consumes : fixture `fixtures.formationMotif` (PR 1).
- Produces :
  - `interface MatriceProfils { profils: { code: string; nom: string }[]; motifs: { id: number; nom: string }[]; associations: { motifId: number; profilCode: string }[] }`
  - `GetMatriceProfilsQuery.run(): Promise<MatriceProfils>` : profils triés par `nom` ; motifs sans `date_suppression`, triés par `nom` ; associations limitées à ces motifs, triées par `motifId` puis `profilCode`.
  - `setMotifProfilCommandSchema = z.object({ motifId: z.number().int(), profilCode: z.string().min(1), propose: z.boolean() })`, `type SetMotifProfilCommand`
  - `SetMotifProfilHandler.execute(commande: SetMotifProfilCommand): Promise<void>` (dépendance `prisma`) : `propose` vrai → `createMany({ data: [...], skipDuplicates: true })` ; faux → `deleteMany`. Motif absent ou supprimé → `BadRequestError("Cette formation n'existe pas ou a été supprimée dans RDV-SP.")` ; profil absent → `BadRequestError("Ce profil n'existe pas.")`.
  - tRPC : `formation.matriceProfils` (query), `formation.setMotifProfil` (mutation, entrée `setMotifProfilCommandSchema.and(zodValidateurCSRF)`).

- [ ] **Step 1 : écrire les tests d'intégration**

```ts
// GetMatriceProfilsQuery
it("retourne les profils, les motifs non supprimés triés par nom et leurs associations", createIntegrationTest(async () => {
  // Given
  await fixtures.formationMotif({ id: BigInt(1), nom: "B formation" });
  await fixtures.formationMotif({ id: BigInt(2), nom: "A formation" });
  await fixtures.formationMotif({ id: BigInt(3), nom: "C supprimée", date_suppression: new Date("2026-11-01T00:00:00Z") });
  await prisma.formation_motif_profil.createMany({ data: [
    { motif_id: BigInt(2), profil_code: "DITP_ADMIN" },
    { motif_id: BigInt(3), profil_code: "DITP_ADMIN" },
  ] });

  // When
  const resultat = await query.run();

  // Then
  expect(resultat.motifs).toEqual([{ id: 2, nom: "A formation" }, { id: 1, nom: "B formation" }]);
  expect(resultat.associations).toEqual([{ motifId: 2, profilCode: "DITP_ADMIN" }]);
  expect(resultat.profils).toContainEqual({ code: "DITP_ADMIN", nom: "DITP - Admin" });
}));

// SetMotifProfilHandler
it("propose une formation à un profil, sans doublon si on coche deux fois", …
  // Given motif 1 ; When execute({ motifId: 1, profilCode: "DITP_ADMIN", propose: true }) deux fois
  // Then formation_motif_profil.findMany() toEqual [{ motif_id: BigInt(1), profil_code: "DITP_ADMIN" }]
it("retire une formation d'un profil, sans erreur si elle n'était pas proposée", …
  // Given motif 1 associé à DITP_ADMIN ; When propose: false deux fois ; Then findMany() toEqual []
it("refuse une formation supprimée dans RDV-SP", …
  // Given motif 1 avec date_suppression ; Then rejects.toThrow("Cette formation n'existe pas ou a été supprimée dans RDV-SP.")
```

- [ ] **Step 2 : vérifier l'échec** — Run : `pnpm test:server:integration src/server/formations` — Expected : FAIL, modules introuvables.
- [ ] **Step 3 : implémenter** requête, handler, enregistrement dans le module et procédures tRPC.
- [ ] **Step 4 : vérifier** — même commande puis `pnpm exec tsc` — Expected : tests PASS ; seule l'erreur TS préexistante.
- [ ] **Step 5 : Commit** — `feat(PIL-1883): matrice des formations par profil`

---

### Task 3 : périodes d'information côté serveur

**Files :**
- Create : `src/server/formations/queries/ListPeriodesInformationQuery.ts`
- Create : `src/server/formations/handlers/SavePeriodeInformationHandler.ts`
- Create : `src/server/formations/handlers/DeletePeriodeInformationHandler.ts`
- Modify : `src/server/formations/module.ts`, `src/server/formations/infrastructure/trpc/formation.ts`
- Modify : `src/test/fixtures.ts` (fixture `formationPeriodeInformation`)
- Test : `src/server/formations/__tests__/queries/ListPeriodesInformationQuery.integration.test.ts`, `src/server/formations/__tests__/handlers/SavePeriodeInformationHandler.integration.test.ts`, `src/server/formations/__tests__/handlers/DeletePeriodeInformationHandler.integration.test.ts`

**Interfaces :**
- Consumes : tout le domaine de la Task 1.
- Produces :
  - `interface PeriodeInformation { id: string; dateDebut: JourISO; dateFin: JourISO; statut: StatutPeriode; motifs: { id: number; nom: string | null }[] }` (`nom` nul si le motif n'existe plus dans `formation_motif` ; motifs triés par nom, inconnus en dernier)
  - `interface MotifDisponible { id: number; nom: string; aDesSeancesAVenir: boolean }` (motif non supprimé ; vrai s'il a une séance avec `date_debut > maintenant` et sans `date_annulation`)
  - `interface PeriodesInformation { aujourdhui: JourISO; periodes: PeriodeInformation[]; motifsDisponibles: MotifDisponible[] }` (périodes de la plus récente à la plus ancienne par `dateDebut` ; motifs disponibles triés par nom)
  - `ListPeriodesInformationQuery.run({ maintenant }: { maintenant: Date }): Promise<PeriodesInformation>`
  - `savePeriodeInformationCommandSchema = z.object({ id: z.string().uuid().nullable(), dateDebut: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), dateFin: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), motifIds: z.array(z.number().int()) })`, `type SavePeriodeInformationCommand`
  - `SavePeriodeInformationHandler.execute({ commande, maintenant }: { commande: SavePeriodeInformationCommand; maintenant: Date }): Promise<{ id: string }>` (dépendances `prisma`, `transaction`). Dans la transaction : période inconnue → `BadRequestError("Cette période n'existe plus.")` ; un motif absent ou supprimé → `BadRequestError("Une des formations choisies n'existe plus dans RDV-SP.")` ; `validerPeriode` (autres périodes = toutes sauf celle modifiée) → si erreurs, `BadRequestError` avec les messages joints par une espace ; puis création ou mise à jour des dates et remplacement des motifs.
  - `DeletePeriodeInformationHandler.execute({ id, maintenant }: { id: string; maintenant: Date }): Promise<void>` : seule une période `A_VENIR` → sinon `BadRequestError("Seule une période à venir peut être supprimée.")` ; inconnue → `BadRequestError("Cette période n'existe plus.")`.
  - tRPC : `formation.periodesInformation` (query, `maintenant: new Date()`), `formation.savePeriodeInformation` et `formation.deletePeriodeInformation` (mutations, entrées `….and(zodValidateurCSRF)` ; `deletePeriodeInformation` prend `z.object({ id: z.string().uuid() })`).
  - Fixture : `fixtures.formationPeriodeInformation(overrides?: Partial<Prisma.formation_periode_informationUncheckedCreateInput> & { motifIds?: bigint[] })` (défauts : `date_debut` 2026-12-01, `date_fin` 2026-12-31, aucun motif).

Les tests utilisent `maintenant = new Date("2026-11-18T10:00:00Z")` et des dates `@db.Date` construites en `new Date("2026-11-03T00:00:00Z")`.

- [ ] **Step 1 : écrire les tests d'intégration**

```ts
// ListPeriodesInformationQuery
it("retourne les périodes de la plus récente à la plus ancienne, avec statut et formations, et les formations disponibles", …
  // Given motifs 1 « A formation » (séance à venir le 2026-11-20) et 2 « B formation » (séance annulée à venir) ;
  //   période P1 du 2026-11-03 au 2026-11-30 avec motifs 1 et 99 (99 n'existe pas) ; période P2 du 2026-12-01 au 2026-12-31 avec motif 2
  // Then toEqual {
  //   aujourdhui: "2026-11-18",
  //   periodes: [
  //     { id: P2, dateDebut: "2026-12-01", dateFin: "2026-12-31", statut: "A_VENIR", motifs: [{ id: 2, nom: "B formation" }] },
  //     { id: P1, dateDebut: "2026-11-03", dateFin: "2026-11-30", statut: "EN_COURS", motifs: [{ id: 1, nom: "A formation" }, { id: 99, nom: null }] },
  //   ],
  //   motifsDisponibles: [{ id: 1, nom: "A formation", aDesSeancesAVenir: true }, { id: 2, nom: "B formation", aDesSeancesAVenir: false }],
  // }

// SavePeriodeInformationHandler — chaque test crée d'abord les motifs 1 et 2 (sinon « Une des formations choisies n'existe plus » part avant les règles)
it("crée une période avec ses formations", …
  // When commande { id: null, dateDebut: "2026-12-01", dateFin: "2026-12-31", motifIds: [1] } ; Then la période et son motif existent (findMany sur les deux tables, toEqual)
it("modifie une période en gardant ses dates et remplace ses formations", …
  // Given P à venir 2026-12-01 → 2026-12-31 avec motif 1 ; When mêmes dates, motifIds [2] ; Then motifs de P toEqual [2] (ne se chevauche pas elle-même)
it("refuse une période qui en chevauche une autre", …
  // Given P1 2026-11-03 → 2026-11-30 ; When création 2026-11-30 → 2026-12-15 ; Then rejects.toThrow("Cette période chevauche celle du 03/11/2026 au 30/11/2026.")
it("refuse de modifier une période passée", …
  // Given P 2026-10-01 → 2026-10-31 ; Then rejects.toThrow("Une période passée ne se modifie plus.")

// DeletePeriodeInformationHandler
it("supprime une période à venir et ses formations", …
it("refuse de supprimer une période en cours", … rejects.toThrow("Seule une période à venir peut être supprimée.")
```

- [ ] **Step 2 : vérifier l'échec** — Run : `pnpm test:server:integration src/server/formations` — Expected : FAIL, modules introuvables.
- [ ] **Step 3 : implémenter** requête, handlers, fixture, module et procédures tRPC.
- [ ] **Step 4 : vérifier** — même commande puis `pnpm exec tsc` — Expected : tests PASS ; seule l'erreur TS préexistante.
- [ ] **Step 5 : Commit** — `feat(PIL-1883): périodes d'information côté serveur`

---

### Task 4 : onglet Profils

**Files :**
- Create : `src/client/components/PagePanelAdministrateur/Formations/ProfilsMatrice.tsx`
- Modify : `src/client/components/PagePanelAdministrateur/Formations/FormationsPanel.tsx`

**Interfaces :**
- Consumes : `api.formation.matriceProfils`, `api.formation.setMotifProfil`, `MatriceProfils` (Task 2).
- Produces : onglets dans l'ordre `profils` (par défaut), `periodes-information`, `seances-a-venir`, libellés « Profils », « Périodes d'information », « Séances à venir ».

Détails :
- `Table` partagé (comme `AlbertProfilPermissions`) dans un conteneur `overflow-x-auto` ; caption masquée « Formations proposées par profil » ; première colonne « Profil » (nom du profil, en en-tête de ligne) ; une colonne par motif, en-tête = nom du motif.
- Case : `Checkbox` avec `aria-label` `` `Proposer « ${motif.nom} » au profil ${profil.nom}` ``, cochée si l'association existe ; au changement, `setMotifProfil.mutate({ motifId, profilCode, propose, csrf })`.
- Succès : `toast.success("Formation proposée au profil {profil}")` ou `"Formation retirée du profil {profil}"`, puis invalidation de `matriceProfils`. Erreur : `toast.error(error.message)`. Options de toast : celles d'`AlbertProfilPermissions`.
- Aucun motif : `Notice` info « Aucune formation importée depuis RDV-SP pour l'instant. »

- [ ] **Step 1 : écrire `ProfilsMatrice.tsx` et les onglets.**
- [ ] **Step 2 : vérifier** — Run : `pnpm format && pnpm lint:oxlint && pnpm exec tsc && pnpm format:check` — Expected : oxlint et Prettier sans remarque ; seule l'erreur TS préexistante.
- [ ] **Step 3 : Commit** — `feat(PIL-1883): onglet Profils des formations`

---

### Task 5 : onglet Périodes d'information

**Files :**
- Create : `src/client/components/PagePanelAdministrateur/Formations/PeriodesInformation.tsx`
- Create : `src/client/components/PagePanelAdministrateur/Formations/ModalePeriodeInformation.tsx`
- Create : `src/client/components/PagePanelAdministrateur/Formations/ModaleSuppressionPeriode.tsx`
- Modify : `src/client/components/PagePanelAdministrateur/Formations/FormationsPanel.tsx` (contenu de l'onglet)
- Modify : `docs/superpowers/plans/2026-11-18-formations-rdv-sp-suivi-pr.md`

**Interfaces :**
- Consumes : `api.formation.periodesInformation`, `savePeriodeInformation`, `deletePeriodeInformation`, `PeriodesInformation`, `PeriodeInformation` (Task 3) ; `validerPeriode`, `formaterJour`, `StatutPeriode` (Task 1).

Détails :
- Liste : bouton « + Ajouter une période » au-dessus d'un `Table` partagé (caption masquée « Périodes d'information ») ; colonnes Du, Au (`formaterJour`), Formations (noms séparés par des virgules, « Formation inconnue » pour un nom nul), Statut (`Badge` : À venir `info`, En cours `success`, Passée `default`), Actions : « Modifier » si à venir ou en cours, « Supprimer » si à venir. Aucune période : texte « Aucune période d'information pour l'instant. »
- `ModalePeriodeInformation` (`periode: PeriodeInformation | null`, `donnees: PeriodesInformation`, `onClose: () => void`) : titre « Nouvelle période d'information » ou « Modifier la période d'information » ; `TextField type="date"` « Du » (`readOnly` si en cours) et « Au » ; un `CheckboxField` par motif disponible, libellé = nom, complété de « aucune séance à venir » si `aDesSeancesAVenir` est faux. Un motif déjà rattaché mais absent des motifs disponibles n'est pas affiché et sera retiré à l'enregistrement.
- Au clic sur « Enregistrer » : `validerPeriode({ saisie, periodeModifiee, autresPeriodes: donnees.periodes sans la période modifiée, aujourdhui: donnees.aujourdhui })` ; erreurs `dateDebut` et `dateFin` dans `errorMessage` des champs, `motifIds` sous le groupe de cases, `periode` dans une `Notice` d'erreur en tête ; sinon mutation. Succès : `toast.success("Période enregistrée.")`, invalidation, fermeture. Erreur serveur : `toast.error(error.message)`. Boutons « Annuler » et « Enregistrer » jamais désactivés.
- `ModaleSuppressionPeriode` : « Supprimer la période du {Du} au {Au} ? », boutons « Annuler » et « Supprimer » ; succès `toast.success("Période supprimée.")`.

- [ ] **Step 1 : écrire les trois composants et brancher l'onglet.**
- [ ] **Step 2 : vérifier** — Run : `pnpm format && pnpm lint:oxlint && pnpm exec tsc && pnpm format:check`, puis `pnpm test:server:unit src/server/formations && pnpm test:server:integration src/server/formations` — Expected : comme Task 4 ; tous les tests PASS.
- [ ] **Step 3 : vérifier dans le navigateur** (serveur `pilote-ppg` de `.claude/launch.json`, données de `pnpm database:seed:formations`, compte DITP Admin) :
  - Profils : 16 lignes, 6 colonnes ; cocher puis décocher « Importer des données » pour « Cabinet MTFP » affiche les deux toasts et persiste au rechargement.
  - Périodes : deux périodes (en cours et passée) ; la passée n'a ni Modifier ni Supprimer ; créer une période qui commence le dernier jour de celle en cours affiche l'erreur de chevauchement sous « Du » ; en créer une qui commence le lendemain réussit ; la supprimer ; arrêter la période en cours en mettant sa fin à hier la fait passer en « Passée ».
  - Si le panneau n'est pas connecté, demander à Tristan de se connecter ou de faire ce contrôle.
  - Après le contrôle, relancer `pnpm database:seed:formations` pour remettre le jeu fictif.
- [ ] **Step 4 : mettre à jour le suivi** : PR 2 en cours avec le lien de ce plan ; corriger la description de la PR 1 (« requête des séances à venir, avec leur statut ; la slide-in ne gardera que les séances ouvertes »).
- [ ] **Step 5 : Commit** — `feat(PIL-1883): onglet Périodes d'information`
