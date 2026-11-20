# Formations RDV-SP, PR 2 : nouvelles règles des périodes et relecture — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal :** appliquer les règles des périodes validées le 2026-11-19 (soft delete, remplacement au chevauchement, avertissement) et traiter la relecture de la PR #2708.

**Architecture :** une colonne `deleted_at` sur `formation_periode_information` ; règles pures dans `src/server/formations/domain/periodeInformation.ts`, dont un schéma zod partagé par le formulaire (React-Hook-Form + `zodResolver`) et le handler ; le handler cherche les périodes chevauchées en SQL et les supprime sous le verrou existant.

**Tech Stack :** Prisma 7, zod 4, react-hook-form 7, tRPC, luxon, Vitest.

**Spec :** [2026-11-18-formations-rdv-sp-tables-design.md](../specs/2026-11-18-formations-rdv-sp-tables-design.md), section « Règles des périodes d'information (validées le 2026-11-19) ». Plan initial de la PR : [2026-11-18-formations-rdv-sp-pr2.md](./2026-11-18-formations-rdv-sp-pr2.md).

Branche : `feat/PIL-1883-formations-profils-periodes`, dans le worktree `.claude/worktrees/pil-1883-periodes`.

## Global Constraints

- Dates de période en chaîne `AAAA-MM-JJ` (`JourISO`) hors de la base ; écriture `new Date(jour)` (date ISO sans heure lue en UTC), lecture `jourISO(date)`.
- « Aujourd'hui » : `aujourdhuiAParis(maintenant)`, côté serveur comme côté client ; il n'est plus renvoyé par la requête de liste.
- Messages d'erreur exacts :
  - « Indiquez une date de début. », « Indiquez une date de fin. », « Choisissez au moins une formation. »
  - « La date de début ne peut pas être passée. », « La date de début d'une période en cours ne se modifie plus. »
  - « La date de fin doit être égale ou postérieure à la date de début. », « La date de fin ne peut pas être passée. »
  - « Cette période n'existe plus. », « Une période passée ne se modifie plus. », « Une période supprimée ne se modifie plus. »
  - « Une période passée ne se supprime pas. », « Cette période est déjà supprimée. »
- Rafraîchissement après mutation : `utils.formation.periodesInformation.invalidate()` (données chargées par tRPC, pas par `getServerSideProps`).
- Métier en français, technique en anglais ; tests `toEqual` sur l'objet entier ; pas de commentaire hors Given/When/Then.
- Migration appliquée à la base de test par `migrate deploy` ; à la base locale de dev, seulement cette migration (`db execute` puis `migrate resolve --applied`), pour ne pas appliquer `supprime_mb_sync_execution`.
- Pas de commit sans demande explicite de Tristan.

## Review Focus

1. Période accolée (commence le lendemain de la fin d'une autre) : pas remplacée ; qui commence le jour de la fin : remplacée (Task 1 et Task 2).
2. Modification d'une période sans changer ses dates : elle ne se remplace pas elle-même (Task 2).
3. Période déjà supprimée dans la zone de chevauchement : sa `deleted_at` ne bouge pas (Task 2).
4. Période en cours remplacée par une période qui commence plus tard : l'avertissement annonce les jours sans période (Task 4, contrôle visuel).
5. Saisie entre minuit et 1 h, heure de Paris : le jour de Paris, pas le jour UTC (Task 1, test existant gardé).

---

### Task 1 : migration et règles pures

**Files :**

- Modify : `src/database/prisma/schema.prisma` (modèle `formation_periode_information`, ajout `deleted_at DateTime? @db.Timestamptz`, à la main, sans `prisma format`)
- Create : `src/database/prisma/migrations/20261119000000_formations_suppression_periode/migration.sql` (`ALTER TABLE "formation_periode_information" ADD COLUMN "deleted_at" TIMESTAMPTZ;`)
- Modify : `src/server/formations/domain/periodeInformation.ts`
- Delete : `src/server/formations/infrastructure/joursBase.ts`
- Test : `src/server/formations/__tests__/domain/periodeInformation.unit.test.ts`

**Interfaces (Produces) :**

- `type JourISO = string`, `type Bornes = { dateDebut: JourISO; dateFin: JourISO }`
- `type StatutPeriode = "A_VENIR" | "EN_COURS" | "PASSEE" | "SUPPRIMEE"`
- `aujourdhuiAParis(maintenant: Date): JourISO` (inchangé)
- `jourISO(date: Date): JourISO`
- `statutPeriode(periode: Bornes & { supprimee: boolean }, aujourdhui: JourISO): StatutPeriode`
- `periodesChevauchees<T extends Bornes>(saisie: Bornes, periodes: T[]): T[]` (bornes comprises, ordre conservé)
- `schemaPeriode({ aujourdhui, debutFige }: { aujourdhui: JourISO; debutFige: JourISO | null }): z.ZodType<SaisiePeriode>` ; `type SaisiePeriode = Bornes & { motifIds: number[] }`
- Disparaissent : `jourPrecedent`, `formaterJour` (déménage côté client, Task 4), `validerPeriode`, `ErreursPeriode`.

- [ ] **Step 1 : tests unitaires** — garder `aujourdhuiAParis` ; `statutPeriode` renvoie `SUPPRIMEE` quand `supprimee`, quelles que soient les dates ; `periodesChevauchees` garde une période qui finit le jour du début saisi, écarte une période accolée (finit la veille) ; `schemaPeriode` :
  - accepte `{ dateDebut: "2026-11-18", dateFin: "2026-11-18", motifIds: [1] }` le 2026-11-18 ;
  - champs vides et aucune formation → exactement les trois messages « Indiquez… » / « Choisissez… », sur `dateDebut`, `dateFin`, `motifIds` ;
  - fin avant début, début passé, fin passée → message sur le bon champ ;
  - `debutFige: "2026-11-03"` : début inchangé accepté ; début changé → « La date de début d'une période en cours ne se modifie plus. » ; fin = aujourd'hui acceptée.
- [ ] **Step 2 :** lancer, constater l'échec. `pnpm exec vitest run src/server/formations/__tests__/domain`
- [ ] **Step 3 :** implémenter ; erreurs croisées dans un `superRefine` qui ne compare que des dates renseignées, avec `path` sur le champ concerné.
- [ ] **Step 4 :** relancer, tout passe.

### Task 2 : handlers d'enregistrement et de suppression

**Files :**

- Modify : `src/server/formations/handlers/SavePeriodeInformationHandler.ts`, `src/server/formations/handlers/DeletePeriodeInformationHandler.ts`
- Test : `src/server/formations/__tests__/handlers/SavePeriodeInformationHandler.integration.test.ts`, `src/server/formations/__tests__/handlers/DeletePeriodeInformationHandler.integration.test.ts`

**Interfaces :**

- Consumes : Task 1.
- Produces : `savePeriodeInformationCommandSchema` avec `dateDebut`/`dateFin` en `z.iso.date()` ; `SavePeriodeInformationHandler.execute(...)` renvoie `Promise<{ id: string; periodesRemplacees: Bornes[] }>` (tri par début).

- [ ] **Step 1 : tests d'intégration** (maintenant = `2026-11-18T10:00:00Z`) :
  - création : la ligne a `deleted_at: null`, `periodesRemplacees: []` ;
  - remplace une période en cours (03/11–30/11) et une à venir (01/12–31/12) par une période 30/11–15/12 : les deux reçoivent `deleted_at = maintenant`, `periodesRemplacees` les cite ; une période accolée (16/12–31/12) reste ;
  - une période déjà supprimée dans la zone garde sa `deleted_at` ;
  - modification sans changer les dates : rien n'est remplacé, formations remplacées ;
  - refus : période passée, période supprimée, début passé à la création ;
  - suppression : période à venir et période en cours → `deleted_at = maintenant`, lignes et formations conservées ; refus d'une période passée et d'une période déjà supprimée.
- [ ] **Step 2 :** appliquer la migration à la base de test, lancer, constater l'échec. `pnpm exec dotenv run -f .env.test -- pnpm exec prisma migrate deploy` puis `pnpm exec dotenv run -f .env.test -- pnpm exec vitest run --project server-integration src/server/formations`
- [ ] **Step 3 :** implémenter. Sous `verrouillerPeriodes` : contrôles de la période modifiée, des formations, `schemaPeriode(...).safeParse` (messages joints par une espace dans un `BadRequestError`), recherche des chevauchées (`deleted_at: null`, `date_debut <= fin`, `date_fin >= debut`, hors période modifiée), `updateMany` de leur `deleted_at`, puis écriture de la période et de ses formations.
- [ ] **Step 4 :** relancer, tout passe.

### Task 3 : requête de liste, fixtures, seed

**Files :**

- Modify : `src/server/formations/queries/ListPeriodesInformationQuery.ts`, son test d'intégration, `src/database/prisma/seed-formations.ts`

**Interfaces (Produces) :** `PeriodesInformation = { periodes: PeriodeInformation[]; motifsDisponibles: MotifDisponible[] }` (plus de `aujourdhui`) ; `PeriodeInformation.statut` peut valoir `SUPPRIMEE` ; mapping dans une fonction `toApiModel`.

- [ ] **Step 1 :** ajouter au test de liste une période supprimée (statut `SUPPRIMEE`) et retirer `aujourdhui` de l'attendu ; lancer, constater l'échec.
- [ ] **Step 2 :** implémenter (`toApiModel(periode, { aujourdhui, motifsParId })`, commentaire sur `retireeDeRdvSp` supprimé) ; relancer, tout passe.
- [ ] **Step 3 :** seed : ajouter une période à venir (J+45 à J+75) et une période supprimée (J-30 à J+20, supprimée à J-7) ; vérifier que les périodes non supprimées ne se chevauchent pas.

### Task 4 : formulaire, avertissement, liste

**Files :**

- Create : `src/client/components/PagePanelAdministrateur/Formations/usePeriodeInformationForm.ts`, `src/client/components/PagePanelAdministrateur/Formations/formaterPeriodes.ts`
- Modify : `ModalePeriodeInformation.tsx`, `PeriodesInformation.tsx`, `ModaleSuppressionPeriode.tsx` (même dossier)

**Interfaces :**

- Consumes : Tasks 1 à 3.
- Produces : `formaterJour(jour: JourISO): string` ; `usePeriodeInformationForm({ periode, periodes, onClose })` → `{ reactHookForm, enregistrer, periodesRemplacees, aujourdhui }`.

- [ ] **Step 1 :** hook : `useForm` avec `zodResolver(schemaPeriode({ aujourdhui, debutFige }))`, `debutFige` = début de la période modifiée si elle est en cours ; `periodesRemplacees` = `periodesChevauchees` des dates surveillées sur les périodes ni supprimées ni modifiée ; succès → `invalidate`, toast qui cite les périodes renvoyées par le serveur, fermeture.
- [ ] **Step 2 :** modale : `FormTextField` pour les dates (« Du » en lecture seule pour une période en cours), `Controller` pour les cases des formations ; avertissement `Notice` « warning » :
  - « Cette période chevauche celle du {du} au {au} ({statut}). À l'enregistrement, elle la remplace : l'ancienne sera supprimée. » ; au pluriel « celles du … et du … », « elle les remplace : elles seront supprimées. » ;
  - si une période en cours est remplacée et que le début saisi est après aujourd'hui : « Aucune période ne sera en cours avant le {début saisi}. »
  - Toast : « Période enregistrée. » suivi de « Celle du {du} au {au} a été supprimée. » ou « Celles du … et du … ont été supprimées. »
- [ ] **Step 3 :** liste : badge « Supprimée » (variante `default`) ; Modifier et Supprimer pour À venir et En cours seulement. Modale de suppression : « Supprimer la période du {du} au {au} ? Elle restera dans la liste, sans pouvoir être modifiée. »
- [ ] **Step 4 :** contrôle dans le navigateur avec les données fictives : création qui remplace la période en cours, avertissement, toast, suppression d'une période en cours.

### Task 5 : vérification et docs

- [ ] `pnpm exec vitest run src/server/formations` (unitaires) et les tests d'intégration du module ; `pnpm lint` dans `apps/pilote-ppg` après `pnpm exec prettier --write` sur les fichiers modifiés.
- [ ] Suivi : retirer la ligne « Hors pile » de la mise à plat, noter les nouvelles règles dans la section PR 2.
