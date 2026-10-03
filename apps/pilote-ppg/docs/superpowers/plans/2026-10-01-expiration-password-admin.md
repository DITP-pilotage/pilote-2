# Expiration des mots de passe DITP_ADMIN — plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Forcer les comptes `DITP_ADMIN` à renouveler leur mot de passe Keycloak tous les 6 mois, avec relances email à J-30, J-7 et J0, par un cron quotidien piloté depuis la base PILOTE.

**Architecture:** Deux nouvelles tables (`suivi_password_admin`, `action_password`) dans le module `gestion-utilisateur`, un domaine pur (calcul d'expiration, détermination de l'action), trois use cases (synchronisation Keycloak, création d'actions, exécution) enchaînés par un endpoint cron `onlyCron`, sur le modèle exact de la désactivation des comptes inactifs. Keycloak reste la source du mot de passe ; PILOTE n'en lit que la date de création du credential et pose l'action requise `UPDATE_PASSWORD` à l'expiration.

**Tech Stack:** Next.js 14 (pages API), Prisma 6, Awilix (`defineModule`), luxon, Vitest + vitest-mock-extended, `@keycloak/keycloak-admin-client` 26.7.3, Brevo (`ContactInfoLettresService`).

**Spec:** `docs/superpowers/specs/2026-10-01-expiration-mots-de-passe-ditp-admin-design.md`

## Global Constraints

- Tout le travail se fait dans `apps/pilote-ppg` (chemins relatifs à ce dossier). Les commandes `pnpm` se lancent depuis ce dossier.
- Nommage : métier en français, technique en anglais. `password` est technique : tables, enums, types, fonctions et fichiers disent `password` ; les textes utilisateurs disent « mot de passe ».
- Règles du CLAUDE.md : `expect(result).toEqual([...])` plutôt que `toHaveLength` + index ; pas de variable à 1 ou 2 caractères ; commentaires de test limités à `// Given` / `// When` / `// Then` ; utiliser `$Enums` de `@prisma/client` pour les valeurs d'enum.
- Pas de commit sans demande explicite de l'utilisateur (règle projet). Les étapes « Point de commit » donnent le message à utiliser si l'utilisateur a demandé des commits ; sinon on les saute.
- Tests : unitaires avec `pnpm test:server:unit <chemin>`, intégration avec `pnpm test:server:integration <chemin>` (nécessite la base de test : `pnpm test:database:init` après toute migration).
- Durées : 6 mois de validité, borne de transition 30 jours, première relance à J-30, deuxième relance à J-7, expiration à J0.
- Le cron ne s'exécute qu'en `PROD` et si le feature flip `expirationPasswordAdmin` (`NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN`) est actif.
- Aucune lecture des événements Keycloak, aucun journal d'audit (reportés à une PR ultérieure).

## Review Focus

1. **Mot de passe changé entre J-7 et J0** : la date Keycloak change, le cycle doit repartir à +6 mois et l'action `EXPIRATION` en attente doit être annulée, jamais exécutée. Test dans la tâche 7 (« annule les actions en attente »).
2. **Première relance jamais envoyée quand on arrive directement à J-7** : si l'action `PREMIERE_RELANCE` a échoué jusqu'à J-7, on ne doit pas envoyer un email « 30 jours » à J-6. Test dans la tâche 2 (« ne renvoie pas PREMIERE_RELANCE une fois le seuil J-7 franchi »).
3. **Action `EXPIRATION` en échec puis rejouée** : `forcerChangementPassword` doit pouvoir être appelé deux fois sans erreur (action requise déjà présente). Couvert par la construction avec `Set` dans la tâche 6 et vérifié en recette.
4. **Compte désactivé entre la création et l'exécution d'une action** : la phase 3 ne doit ni envoyer d'email ni toucher Keycloak. Test dans la tâche 9 (« marque en échec une action dont le compte est désactivé »).
5. **DITP_ADMIN connecté uniquement par ProConnect** : pas de credential `password` dans Keycloak, aucune ligne de suivi ne doit être créée, aucune erreur comptée. Test dans la tâche 7 (« ignore un compte sans mot de passe Keycloak »).

---

### Task 1: Schéma Prisma et migration

**Files:**
- Modify: `src/database/prisma/schema.prisma` (modèle `utilisateur` ligne ~789, enums et modèles après `action_compte_inactif` ligne ~1327)
- Create: `src/database/prisma/migrations/20261001000000_creation_tables_password_admin/migration.sql`

**Interfaces:**
- Produces: enums Prisma `$Enums.type_action_password` (`PREMIERE_RELANCE | DEUXIEME_RELANCE | EXPIRATION`), `$Enums.statut_action_password` (`CREEE | SUCCES | ECHEC`), modèles `suivi_password_admin` et `action_password`.

- [ ] **Step 1: Ajouter les enums et modèles dans `schema.prisma`**

Après le modèle `action_compte_inactif` (juste avant `model metadata_indicateur`), ajouter :

```prisma
enum type_action_password {
  PREMIERE_RELANCE
  DEUXIEME_RELANCE
  EXPIRATION

  @@schema("public")
}

enum statut_action_password {
  CREEE
  SUCCES
  ECHEC

  @@schema("public")
}

model suivi_password_admin {
  utilisateur_id          String      @id @db.Uuid
  utilisateur             utilisateur @relation(fields: [utilisateur_id], references: [id], onDelete: Cascade)
  date_dernier_changement DateTime
  date_expiration         DateTime
  date_premiere_relance   DateTime?
  date_deuxieme_relance   DateTime?
  date_expiration_forcee  DateTime?

  @@schema("public")
}

model action_password {
  id                      String                 @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  utilisateur_id          String                 @db.Uuid
  type_action             type_action_password
  date_creation           DateTime               @default(now())
  statut                  statut_action_password @default(CREEE)
  date_succes             DateTime?
  date_derniere_tentative DateTime?
  nombre_tentatives       Int                    @default(0)
  erreur                  String?

  @@index([utilisateur_id, statut])
  @@schema("public")
}
```

Dans le modèle `utilisateur`, après la ligne `llm_calls                              llm_calls[]`, ajouter :

```prisma
  suivi_password_admin                   suivi_password_admin?
```

- [ ] **Step 2: Écrire la migration SQL**

Créer `src/database/prisma/migrations/20261001000000_creation_tables_password_admin/migration.sql` :

```sql
-- Cycle de renouvellement des mots de passe des comptes DITP_ADMIN (6 mois).
-- PILOTE ne stocke jamais de mot de passe : seules les dates du cycle sont suivies.

-- CreateEnum
CREATE TYPE "public"."type_action_password" AS ENUM ('PREMIERE_RELANCE', 'DEUXIEME_RELANCE', 'EXPIRATION');

-- CreateEnum
CREATE TYPE "public"."statut_action_password" AS ENUM ('CREEE', 'SUCCES', 'ECHEC');

-- CreateTable
CREATE TABLE "public"."suivi_password_admin" (
    "utilisateur_id" UUID NOT NULL,
    "date_dernier_changement" TIMESTAMP(3) NOT NULL,
    "date_expiration" TIMESTAMP(3) NOT NULL,
    "date_premiere_relance" TIMESTAMP(3),
    "date_deuxieme_relance" TIMESTAMP(3),
    "date_expiration_forcee" TIMESTAMP(3),

    CONSTRAINT "suivi_password_admin_pkey" PRIMARY KEY ("utilisateur_id")
);

-- CreateTable
CREATE TABLE "public"."action_password" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "utilisateur_id" UUID NOT NULL,
    "type_action" "public"."type_action_password" NOT NULL,
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "statut" "public"."statut_action_password" NOT NULL DEFAULT 'CREEE',
    "date_succes" TIMESTAMP(3),
    "date_derniere_tentative" TIMESTAMP(3),
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur" TEXT,

    CONSTRAINT "action_password_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "action_password_utilisateur_id_statut_idx" ON "public"."action_password"("utilisateur_id", "statut");

-- AddForeignKey
ALTER TABLE "public"."suivi_password_admin" ADD CONSTRAINT "suivi_password_admin_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 3: Régénérer le client Prisma et appliquer sur la base de test**

Run: `pnpm exec prisma generate && pnpm test:database:init`
Expected: génération sans erreur, migrations appliquées, seed terminé.

- [ ] **Step 4: Vérifier que le schéma et la migration sont cohérents**

Run: `pnpm exec dotenv --no-expand -e .env.test -- sh -c 'pnpm exec prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel src/database/prisma/schema.prisma --exit-code'` (le `sh -c` est nécessaire pour que `$DATABASE_URL` soit lu après le chargement de `.env.test`)
Expected: code de sortie 0 et `No difference detected.` (la base de test vient d'être migrée par l'étape 3 ; ce diff est en lecture seule). Si une différence apparaît, corriger la migration SQL (pas le schéma) et refaire l'étape 3.

- [ ] **Step 5: Vérifier le typage**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Point de commit**

```bash
git add src/database/prisma/schema.prisma src/database/prisma/migrations/20261001000000_creation_tables_password_admin/migration.sql
git commit -m "feat(ppg): tables suivi_password_admin et action_password pour l'expiration des mots de passe DITP_ADMIN"
```

---

### Task 2: Domaine `SuiviPasswordAdmin`

**Files:**
- Create: `src/server/gestion-utilisateur/domain/SuiviPasswordAdmin.ts`
- Test: `src/server/gestion-utilisateur/__tests__/domain/SuiviPasswordAdmin.unit.test.ts`

**Interfaces:**
- Consumes: `$Enums.type_action_password` (tâche 1).
- Produces:
  - `interface SuiviPasswordAdmin { utilisateurId: string; dateDernierChangement: Date; dateExpiration: Date; datePremiereRelance: Date | null; dateDeuxiemeRelance: Date | null; dateExpirationForcee: Date | null }`
  - `calculerDateExpiration({ dateDernierChangement, aujourdHui }): Date`
  - `initSuivi({ utilisateurId, dateDernierChangement, aujourdHui }): SuiviPasswordAdmin`
  - `saveNewPassword({ suivi, dateDernierChangement, aujourdHui }): SuiviPasswordAdmin`
  - `determinerTypeAction({ suivi, aujourdHui }): $Enums.type_action_password | null`
  - constantes `DELAI_PREMIERE_RELANCE`, `DELAI_DEUXIEME_RELANCE` (luxon `DurationLike`).

- [ ] **Step 1: Écrire les tests du domaine**

Créer `src/server/gestion-utilisateur/__tests__/domain/SuiviPasswordAdmin.unit.test.ts` :

```ts
import {
  calculerDateExpiration,
  determinerTypeAction,
  initSuivi,
  saveNewPassword,
  SuiviPasswordAdmin,
} from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";

describe("SuiviPasswordAdmin", () => {
  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> = {},
  ): SuiviPasswordAdmin => ({
    utilisateurId: "utilisateur-id",
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  describe("calculerDateExpiration", () => {
    it("ajoute 6 mois à la date du dernier changement", () => {
      // When
      const resultat = calculerDateExpiration({
        dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
        aujourdHui: new Date("2026-04-02T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual(new Date("2026-10-01T10:00:00Z"));
    });

    it("repousse l'expiration à 30 jours quand le mot de passe est déjà trop ancien", () => {
      // When
      const resultat = calculerDateExpiration({
        dateDernierChangement: new Date("2024-01-01T10:00:00Z"),
        aujourdHui: new Date("2026-10-01T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual(new Date("2026-10-31T10:00:00Z"));
    });

    it("repousse l'expiration à 30 jours quand elle tombe dans moins de 30 jours", () => {
      // When
      const resultat = calculerDateExpiration({
        dateDernierChangement: new Date("2026-04-10T10:00:00Z"),
        aujourdHui: new Date("2026-10-01T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual(new Date("2026-10-31T10:00:00Z"));
    });

    it("conserve l'expiration quand elle tombe exactement dans 30 jours", () => {
      // When
      const resultat = calculerDateExpiration({
        dateDernierChangement: new Date("2026-04-30T10:00:00Z"),
        aujourdHui: new Date("2026-09-30T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual(new Date("2026-10-30T10:00:00Z"));
    });
  });

  describe("initSuivi", () => {
    it("crée un suivi sans relance ni expiration forcée", () => {
      // When
      const resultat = initSuivi({
        utilisateurId: "utilisateur-id",
        dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
        aujourdHui: new Date("2026-04-02T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual({
        utilisateurId: "utilisateur-id",
        dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
        dateExpiration: new Date("2026-10-01T10:00:00Z"),
        datePremiereRelance: null,
        dateDeuxiemeRelance: null,
        dateExpirationForcee: null,
      });
    });
  });

  describe("saveNewPassword", () => {
    it("repart sur un nouveau cycle et efface les relances et l'expiration forcée", () => {
      // Given
      const suivi = creerSuivi({
        datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
        dateDeuxiemeRelance: new Date("2026-09-24T10:00:00Z"),
        dateExpirationForcee: new Date("2026-10-01T10:00:00Z"),
      });

      // When
      const resultat = saveNewPassword({
        suivi,
        dateDernierChangement: new Date("2026-10-02T10:00:00Z"),
        aujourdHui: new Date("2026-10-03T10:00:00Z"),
      });

      // Then
      expect(resultat).toEqual({
        utilisateurId: "utilisateur-id",
        dateDernierChangement: new Date("2026-10-02T10:00:00Z"),
        dateExpiration: new Date("2027-04-02T10:00:00Z"),
        datePremiereRelance: null,
        dateDeuxiemeRelance: null,
        dateExpirationForcee: null,
      });
    });
  });

  describe("determinerTypeAction", () => {
    it("ne retourne rien à plus de 30 jours de l'expiration", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi(),
        aujourdHui: new Date("2026-08-31T10:00:00Z"),
      });

      // Then
      expect(resultat).toBeNull();
    });

    it("retourne PREMIERE_RELANCE à J-30", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi(),
        aujourdHui: new Date("2026-09-01T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("PREMIERE_RELANCE");
    });

    it("ne retourne rien entre J-30 et J-7 quand la première relance est envoyée", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-09-15T10:00:00Z"),
      });

      // Then
      expect(resultat).toBeNull();
    });

    it("retourne DEUXIEME_RELANCE à J-7", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-09-24T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("DEUXIEME_RELANCE");
    });

    it("préfère DEUXIEME_RELANCE à PREMIERE_RELANCE quand les deux sont dues", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi(),
        aujourdHui: new Date("2026-09-25T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("DEUXIEME_RELANCE");
    });

    it("ne renvoie pas PREMIERE_RELANCE une fois le seuil J-7 franchi", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          dateDeuxiemeRelance: new Date("2026-09-24T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-09-25T10:00:00Z"),
      });

      // Then
      expect(resultat).toBeNull();
    });

    it("retourne EXPIRATION le jour de l'expiration", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
          dateDeuxiemeRelance: new Date("2026-09-24T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-10-01T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("EXPIRATION");
    });

    it("préfère EXPIRATION aux relances quand tout est dû", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi(),
        aujourdHui: new Date("2026-10-05T10:00:00Z"),
      });

      // Then
      expect(resultat).toBe("EXPIRATION");
    });

    it("ne retourne rien après l'expiration forcée", () => {
      // When
      const resultat = determinerTypeAction({
        suivi: creerSuivi({
          dateExpirationForcee: new Date("2026-10-01T10:00:00Z"),
        }),
        aujourdHui: new Date("2026-10-15T10:00:00Z"),
      });

      // Then
      expect(resultat).toBeNull();
    });
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm test:server:unit src/server/gestion-utilisateur/__tests__/domain/SuiviPasswordAdmin.unit.test.ts`
Expected: FAIL, module `SuiviPasswordAdmin` introuvable.

- [ ] **Step 3: Écrire le domaine**

Créer `src/server/gestion-utilisateur/domain/SuiviPasswordAdmin.ts` :

```ts
import { $Enums } from "@prisma/client";
import { DateTime, DurationLike } from "luxon";

// Les calculs de calendrier se font en UTC : le fuseau du serveur ne fixe
// aucune règle métier et les tests ne fixent pas de fuseau.
export const DUREE_VALIDITE_PASSWORD: DurationLike = { months: 6 };
export const DELAI_TRANSITION: DurationLike = { days: 30 };
export const DELAI_PREMIERE_RELANCE: DurationLike = { days: 30 };
export const DELAI_DEUXIEME_RELANCE: DurationLike = { days: 7 };

export interface SuiviPasswordAdmin {
  utilisateurId: string;
  dateDernierChangement: Date;
  dateExpiration: Date;
  datePremiereRelance: Date | null;
  dateDeuxiemeRelance: Date | null;
  dateExpirationForcee: Date | null;
}

/**
 * Expiration à 6 mois du dernier changement, mais jamais à moins de 30 jours
 * d'aujourd'hui : au déploiement, les mots de passe existants sont tous
 * anciens et personne ne doit être forcé sans préavis.
 */
export function calculerDateExpiration(params: {
  dateDernierChangement: Date;
  aujourdHui: Date;
}): Date {
  const expiration = DateTime.fromJSDate(params.dateDernierChangement, {
    zone: "utc",
  }).plus(DUREE_VALIDITE_PASSWORD);
  const borneTransition = DateTime.fromJSDate(params.aujourdHui, {
    zone: "utc",
  }).plus(DELAI_TRANSITION);

  return (expiration < borneTransition ? borneTransition : expiration).toJSDate();
}

export function initSuivi(params: {
  utilisateurId: string;
  dateDernierChangement: Date;
  aujourdHui: Date;
}): SuiviPasswordAdmin {
  return {
    utilisateurId: params.utilisateurId,
    dateDernierChangement: params.dateDernierChangement,
    dateExpiration: calculerDateExpiration(params),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
  };
}

export function saveNewPassword(params: {
  suivi: SuiviPasswordAdmin;
  dateDernierChangement: Date;
  aujourdHui: Date;
}): SuiviPasswordAdmin {
  return {
    ...params.suivi,
    dateDernierChangement: params.dateDernierChangement,
    dateExpiration: calculerDateExpiration(params),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
  };
}

export function determinerTypeAction(params: {
  suivi: SuiviPasswordAdmin;
  aujourdHui: Date;
}): $Enums.type_action_password | null {
  const { suivi } = params;

  if (suivi.dateExpirationForcee !== null) {
    return null;
  }

  const aujourdHui = DateTime.fromJSDate(params.aujourdHui, { zone: "utc" });
  const expiration = DateTime.fromJSDate(suivi.dateExpiration, {
    zone: "utc",
  });
  const seuilDeuxiemeRelance = expiration.minus(DELAI_DEUXIEME_RELANCE);
  const seuilPremiereRelance = expiration.minus(DELAI_PREMIERE_RELANCE);

  if (aujourdHui >= expiration) {
    return "EXPIRATION";
  }

  if (aujourdHui >= seuilDeuxiemeRelance && suivi.dateDeuxiemeRelance === null) {
    return "DEUXIEME_RELANCE";
  }

  if (
    aujourdHui >= seuilPremiereRelance &&
    aujourdHui < seuilDeuxiemeRelance &&
    suivi.datePremiereRelance === null
  ) {
    return "PREMIERE_RELANCE";
  }

  return null;
}
```

- [ ] **Step 4: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:server:unit src/server/gestion-utilisateur/__tests__/domain/SuiviPasswordAdmin.unit.test.ts`
Expected: PASS, 15 tests.

- [ ] **Step 5: Point de commit**

```bash
git add src/server/gestion-utilisateur/domain/SuiviPasswordAdmin.ts src/server/gestion-utilisateur/__tests__/domain/SuiviPasswordAdmin.unit.test.ts
git commit -m "feat(ppg): domaine du suivi des mots de passe DITP_ADMIN (expiration, relances)"
```

---

### Task 3: Domaine `ActionPassword` et repository Prisma des actions

**Files:**
- Create: `src/server/gestion-utilisateur/domain/ActionPassword.ts`
- Create: `src/server/gestion-utilisateur/domain/ports/ActionPasswordRepository.ts`
- Create: `src/server/gestion-utilisateur/infrastructure/adapters/PrismaActionPasswordRepository.ts`
- Test: `src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaActionPasswordRepository.integration.test.ts`

**Interfaces:**
- Consumes: enums de la tâche 1.
- Produces:
  - `interface ActionPassword { id; utilisateurId; typeAction: $Enums.type_action_password; dateCreation; statut: $Enums.statut_action_password; dateSucces; dateDerniereTentative; nombreTentatives; erreur }`
  - `creerActionPassword({ utilisateurId, dateCreation, typeAction })`, `marquerCommeSucces({ action, dateSucces })`, `marquerCommeEchec({ action, dateTentative, erreur })`
  - `interface ActionPasswordRepository { sauvegarder(action); recupererActionsParTypeEtStatut({ typesAction, statut }); annulerActionsEnAttente(utilisateurId) }`
  - `class PrismaActionPasswordRepository` (constructeur `{ prisma: PrismaPilote }`).

- [ ] **Step 1: Écrire le domaine `ActionPassword`**

Créer `src/server/gestion-utilisateur/domain/ActionPassword.ts` :

```ts
import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";

export interface ActionPassword {
  id: string;
  utilisateurId: string;
  typeAction: $Enums.type_action_password;
  dateCreation: Date;
  statut: $Enums.statut_action_password;
  dateSucces: Date | null;
  dateDerniereTentative: Date | null;
  nombreTentatives: number;
  erreur: string | null;
}

export function creerActionPassword(params: {
  utilisateurId: string;
  dateCreation: Date;
  typeAction: $Enums.type_action_password;
}): ActionPassword {
  return {
    id: randomUUID(),
    ...params,
    statut: "CREEE",
    dateSucces: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreur: null,
  };
}

export function marquerCommeSucces(params: {
  action: ActionPassword;
  dateSucces: Date;
}): ActionPassword {
  return {
    ...params.action,
    dateSucces: params.dateSucces,
    statut: "SUCCES",
  };
}

export function marquerCommeEchec(params: {
  action: ActionPassword;
  dateTentative: Date;
  erreur: string;
}): ActionPassword {
  return {
    ...params.action,
    statut: "ECHEC",
    nombreTentatives: params.action.nombreTentatives + 1,
    dateDerniereTentative: params.dateTentative,
    erreur: params.erreur,
  };
}
```

- [ ] **Step 2: Écrire le port**

Créer `src/server/gestion-utilisateur/domain/ports/ActionPasswordRepository.ts` :

```ts
import { $Enums } from "@prisma/client";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";

export interface ActionPasswordRepository {
  sauvegarder(action: ActionPassword): Promise<void>;
  recupererActionsParTypeEtStatut(params: {
    typesAction: $Enums.type_action_password[];
    statut: $Enums.statut_action_password;
  }): Promise<ActionPassword[]>;
  annulerActionsEnAttente(utilisateurId: string): Promise<void>;
}
```

- [ ] **Step 3: Écrire le test d'intégration**

Créer `src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaActionPasswordRepository.integration.test.ts` :

```ts
import { randomUUID } from "crypto";
import { PrismaActionPasswordRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaActionPasswordRepository";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaActionPasswordRepository", () => {
  let repository: PrismaActionPasswordRepository;
  const prismaPilote = new PrismaPilote();

  const creerAction = (overrides: Partial<ActionPassword> = {}): ActionPassword => ({
    id: randomUUID(),
    utilisateurId: randomUUID(),
    typeAction: "PREMIERE_RELANCE",
    dateCreation: new Date("2026-10-01"),
    statut: "CREEE",
    dateSucces: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreur: null,
    ...overrides,
  });

  beforeEach(() => {
    repository = new PrismaActionPasswordRepository({ prisma: prismaPilote });
  });

  describe("#sauvegarder", () => {
    it(
      "crée une nouvelle action en base",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const action = creerAction({ utilisateurId: utilisateur.id });

        // When
        await repository.sauvegarder(action);

        // Then
        const result = await prismaPilote.getInstance().action_password.findMany();
        expect(result).toEqual([
          expect.objectContaining({
            id: action.id,
            utilisateur_id: utilisateur.id,
            type_action: "PREMIERE_RELANCE",
            statut: "CREEE",
            nombre_tentatives: 0,
            erreur: null,
          }),
        ]);
      }),
    );

    it(
      "met à jour le statut d'une action existante",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const action = creerAction({ utilisateurId: utilisateur.id });
        await repository.sauvegarder(action);

        // When
        await repository.sauvegarder({
          ...action,
          statut: "ECHEC",
          nombreTentatives: 1,
          dateDerniereTentative: new Date("2026-10-02"),
          erreur: "Brevo indisponible",
        });

        // Then
        const result = await prismaPilote.getInstance().action_password.findMany();
        expect(result).toEqual([
          expect.objectContaining({
            id: action.id,
            statut: "ECHEC",
            nombre_tentatives: 1,
            date_derniere_tentative: new Date("2026-10-02"),
            erreur: "Brevo indisponible",
          }),
        ]);
      }),
    );
  });

  describe("#recupererActionsParTypeEtStatut", () => {
    it(
      "retourne les actions des types demandés au statut demandé",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const relance = creerAction({ utilisateurId: utilisateur.id });
        const expiration = creerAction({
          utilisateurId: utilisateur.id,
          typeAction: "EXPIRATION",
        });
        const relanceEnSucces = creerAction({
          utilisateurId: utilisateur.id,
          statut: "SUCCES",
        });
        await repository.sauvegarder(relance);
        await repository.sauvegarder(expiration);
        await repository.sauvegarder(relanceEnSucces);

        // When
        const result = await repository.recupererActionsParTypeEtStatut({
          typesAction: ["PREMIERE_RELANCE"],
          statut: "CREEE",
        });

        // Then
        expect(result).toEqual([relance]);
      }),
    );
  });

  describe("#annulerActionsEnAttente", () => {
    it(
      "passe en échec les actions CREEE de l'utilisateur et laisse les autres",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const autreUtilisateur = await fixtures.utilisateur();
        const actionEnAttente = creerAction({ utilisateurId: utilisateur.id });
        const actionEnSucces = creerAction({
          utilisateurId: utilisateur.id,
          statut: "SUCCES",
        });
        const actionAutreUtilisateur = creerAction({
          utilisateurId: autreUtilisateur.id,
        });
        await repository.sauvegarder(actionEnAttente);
        await repository.sauvegarder(actionEnSucces);
        await repository.sauvegarder(actionAutreUtilisateur);

        // When
        await repository.annulerActionsEnAttente(utilisateur.id);

        // Then
        const result = await prismaPilote
          .getInstance()
          .action_password.findMany({ orderBy: { date_creation: "asc" } });
        expect(result).toEqual(
          expect.arrayContaining([
            expect.objectContaining({
              id: actionEnAttente.id,
              statut: "ECHEC",
              erreur: "Annulée : mot de passe changé",
            }),
            expect.objectContaining({ id: actionEnSucces.id, statut: "SUCCES" }),
            expect.objectContaining({
              id: actionAutreUtilisateur.id,
              statut: "CREEE",
            }),
          ]),
        );
      }),
    );
  });
});
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm test:server:integration src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaActionPasswordRepository.integration.test.ts`
Expected: FAIL, module `PrismaActionPasswordRepository` introuvable.

- [ ] **Step 5: Écrire le repository Prisma**

Créer `src/server/gestion-utilisateur/infrastructure/adapters/PrismaActionPasswordRepository.ts` :

```ts
import { $Enums } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";

const ERREUR_ANNULATION = "Annulée : mot de passe changé";

export class PrismaActionPasswordRepository implements ActionPasswordRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async sauvegarder(action: ActionPassword): Promise<void> {
    await this.dependencies.prisma.getInstance().action_password.upsert({
      where: { id: action.id },
      create: {
        id: action.id,
        utilisateur_id: action.utilisateurId,
        type_action: action.typeAction,
        date_creation: action.dateCreation,
        statut: action.statut,
      },
      update: {
        statut: action.statut,
        date_succes: action.dateSucces,
        date_derniere_tentative: action.dateDerniereTentative,
        nombre_tentatives: action.nombreTentatives,
        erreur: action.erreur,
      },
    });
  }

  async recupererActionsParTypeEtStatut(params: {
    typesAction: $Enums.type_action_password[];
    statut: $Enums.statut_action_password;
  }): Promise<ActionPassword[]> {
    const actions = await this.dependencies.prisma
      .getInstance()
      .action_password.findMany({
        where: {
          type_action: { in: params.typesAction },
          statut: params.statut,
        },
      });

    return actions.map((action) => ({
      id: action.id,
      utilisateurId: action.utilisateur_id,
      typeAction: action.type_action,
      dateCreation: action.date_creation,
      statut: action.statut,
      dateSucces: action.date_succes,
      dateDerniereTentative: action.date_derniere_tentative,
      nombreTentatives: action.nombre_tentatives,
      erreur: action.erreur,
    }));
  }

  async annulerActionsEnAttente(utilisateurId: string): Promise<void> {
    await this.dependencies.prisma.getInstance().action_password.updateMany({
      where: { utilisateur_id: utilisateurId, statut: "CREEE" },
      data: {
        statut: "ECHEC",
        erreur: ERREUR_ANNULATION,
        date_derniere_tentative: new Date(),
      },
    });
  }
}
```

- [ ] **Step 6: Lancer le test pour vérifier qu'il passe**

Run: `pnpm test:server:integration src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaActionPasswordRepository.integration.test.ts`
Expected: PASS, 4 tests.

- [ ] **Step 7: Point de commit**

```bash
git add src/server/gestion-utilisateur/domain/ActionPassword.ts src/server/gestion-utilisateur/domain/ports/ActionPasswordRepository.ts src/server/gestion-utilisateur/infrastructure/adapters/PrismaActionPasswordRepository.ts src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaActionPasswordRepository.integration.test.ts
git commit -m "feat(ppg): actions du cycle de mot de passe DITP_ADMIN et repository Prisma"
```

---

### Task 4: Repository Prisma du suivi

**Files:**
- Create: `src/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository.ts`
- Create: `src/server/gestion-utilisateur/infrastructure/adapters/PrismaSuiviPasswordAdminRepository.ts`
- Test: `src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaSuiviPasswordAdminRepository.integration.test.ts`

**Interfaces:**
- Consumes: `SuiviPasswordAdmin` (tâche 2).
- Produces: `interface SuiviPasswordAdminRepository { recupererParUtilisateur(utilisateurId): Promise<SuiviPasswordAdmin | null>; sauvegarder(suivi): Promise<void>; recupererTous(): Promise<SuiviPasswordAdmin[]> }`, `class PrismaSuiviPasswordAdminRepository` (constructeur `{ prisma: PrismaPilote }`).

- [ ] **Step 1: Écrire le port**

Créer `src/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository.ts` :

```ts
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";

export interface SuiviPasswordAdminRepository {
  recupererParUtilisateur(
    utilisateurId: string,
  ): Promise<SuiviPasswordAdmin | null>;
  sauvegarder(suivi: SuiviPasswordAdmin): Promise<void>;
  recupererTous(): Promise<SuiviPasswordAdmin[]>;
}
```

- [ ] **Step 2: Écrire le test d'intégration**

Créer `src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaSuiviPasswordAdminRepository.integration.test.ts` :

```ts
import { PrismaSuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/infrastructure/adapters/PrismaSuiviPasswordAdminRepository";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("PrismaSuiviPasswordAdminRepository", () => {
  let repository: PrismaSuiviPasswordAdminRepository;
  const prismaPilote = new PrismaPilote();

  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> & { utilisateurId: string },
  ): SuiviPasswordAdmin => ({
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  beforeEach(() => {
    repository = new PrismaSuiviPasswordAdminRepository({ prisma: prismaPilote });
  });

  it(
    "retourne null quand l'utilisateur n'a pas de suivi",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur();

      // When
      const result = await repository.recupererParUtilisateur(utilisateur.id);

      // Then
      expect(result).toBeNull();
    }),
  );

  it(
    "crée puis relit un suivi",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const suivi = creerSuivi({ utilisateurId: utilisateur.id });

      // When
      await repository.sauvegarder(suivi);
      const result = await repository.recupererParUtilisateur(utilisateur.id);

      // Then
      expect(result).toEqual(suivi);
    }),
  );

  it(
    "met à jour un suivi existant",
    createIntegrationTest(async () => {
      // Given
      const utilisateur = await fixtures.utilisateur();
      const suivi = creerSuivi({ utilisateurId: utilisateur.id });
      await repository.sauvegarder(suivi);

      // When
      await repository.sauvegarder({
        ...suivi,
        datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
      });
      const result = await repository.recupererTous();

      // Then
      expect(result).toEqual([
        {
          ...suivi,
          datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
        },
      ]);
    }),
  );
});
```

- [ ] **Step 3: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm test:server:integration src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaSuiviPasswordAdminRepository.integration.test.ts`
Expected: FAIL, module `PrismaSuiviPasswordAdminRepository` introuvable.

- [ ] **Step 4: Écrire le repository Prisma**

Créer `src/server/gestion-utilisateur/infrastructure/adapters/PrismaSuiviPasswordAdminRepository.ts` :

```ts
import { suivi_password_admin } from "@prisma/client";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";

function convertirEnSuivi(row: suivi_password_admin): SuiviPasswordAdmin {
  return {
    utilisateurId: row.utilisateur_id,
    dateDernierChangement: row.date_dernier_changement,
    dateExpiration: row.date_expiration,
    datePremiereRelance: row.date_premiere_relance,
    dateDeuxiemeRelance: row.date_deuxieme_relance,
    dateExpirationForcee: row.date_expiration_forcee,
  };
}

export class PrismaSuiviPasswordAdminRepository implements SuiviPasswordAdminRepository {
  constructor(private readonly dependencies: { prisma: PrismaPilote }) {}

  async recupererParUtilisateur(
    utilisateurId: string,
  ): Promise<SuiviPasswordAdmin | null> {
    const row = await this.dependencies.prisma
      .getInstance()
      .suivi_password_admin.findUnique({
        where: { utilisateur_id: utilisateurId },
      });

    return row ? convertirEnSuivi(row) : null;
  }

  async sauvegarder(suivi: SuiviPasswordAdmin): Promise<void> {
    const donnees = {
      date_dernier_changement: suivi.dateDernierChangement,
      date_expiration: suivi.dateExpiration,
      date_premiere_relance: suivi.datePremiereRelance,
      date_deuxieme_relance: suivi.dateDeuxiemeRelance,
      date_expiration_forcee: suivi.dateExpirationForcee,
    };

    await this.dependencies.prisma.getInstance().suivi_password_admin.upsert({
      where: { utilisateur_id: suivi.utilisateurId },
      create: { utilisateur_id: suivi.utilisateurId, ...donnees },
      update: donnees,
    });
  }

  async recupererTous(): Promise<SuiviPasswordAdmin[]> {
    const rows = await this.dependencies.prisma
      .getInstance()
      .suivi_password_admin.findMany();

    return rows.map(convertirEnSuivi);
  }
}
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `pnpm test:server:integration src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaSuiviPasswordAdminRepository.integration.test.ts`
Expected: PASS, 3 tests.

- [ ] **Step 6: Point de commit**

```bash
git add src/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository.ts src/server/gestion-utilisateur/infrastructure/adapters/PrismaSuiviPasswordAdminRepository.ts src/server/gestion-utilisateur/__tests__/infrastructure/adapters/PrismaSuiviPasswordAdminRepository.integration.test.ts
git commit -m "feat(ppg): repository Prisma du suivi des mots de passe DITP_ADMIN"
```

---

### Task 5: `UtilisateurRepository` : comptes actifs par profil et `estActif`

**Files:**
- Modify: `src/server/gestion-utilisateur/domain/ports/UtilisateurRepository.ts` (fin de l'interface)
- Modify: `src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts` (après `recupererUtilisateurId`, ligne ~935)
- Test: `src/server/gestion-utilisateur/__tests__/infrastructure/adapters/UtilisateurSQLRepository.integration.test.ts` (ajouter deux `describe` à la fin du `describe` principal)

**Interfaces:**
- Produces: `recupererComptesActifsParProfil(profilCode: ProfilCode): Promise<{ id: string; email: string }[]>` et `estActif(utilisateurId: string): Promise<boolean>`.

- [ ] **Step 1: Ajouter les tests d'intégration**

Dans `UtilisateurSQLRepository.integration.test.ts`, avant la dernière `});` du `describe("PrismaUtilisateurRepository")`, ajouter :

```ts
  describe("recupererComptesActifsParProfil", () => {
    it(
      "retourne les comptes actifs du profil, sans les désactivés ni les autres profils",
      createIntegrationTest(async () => {
        // Given
        const adminActif = await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_ADMIN,
        });
        const adminDesactive = await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_ADMIN,
          date_desactivation: new Date("2026-01-01"),
        });
        const pilotage = await fixtures.utilisateur({
          profilCode: ProfilEnum.DITP_PILOTAGE,
        });
        // La base de test est seedée avec d'autres DITP_ADMIN : on ne regarde que les comptes créés ici
        const emailsCrees = [adminActif.email, adminDesactive.email, pilotage.email];

        // When
        const result = await repository.recupererComptesActifsParProfil(
          ProfilEnum.DITP_ADMIN,
        );

        // Then
        expect(
          result.filter((compte) => emailsCrees.includes(compte.email)),
        ).toEqual([{ id: adminActif.id, email: adminActif.email }]);
      }),
    );
  });

  describe("estActif", () => {
    it(
      "retourne true pour un compte actif",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();

        // When
        const result = await repository.estActif(utilisateur.id);

        // Then
        expect(result).toBe(true);
      }),
    );

    it(
      "retourne false pour un compte désactivé ou inconnu",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur({
          date_desactivation: new Date("2026-01-01"),
        });

        // When
        const resultDesactive = await repository.estActif(utilisateur.id);
        const resultInconnu = await repository.estActif(
          "00000000-0000-0000-0000-000000000000",
        );

        // Then
        expect(resultDesactive).toBe(false);
        expect(resultInconnu).toBe(false);
      }),
    );
  });
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm test:server:integration src/server/gestion-utilisateur/__tests__/infrastructure/adapters/UtilisateurSQLRepository.integration.test.ts -t "recupererComptesActifsParProfil|estActif"`
Expected: FAIL, `repository.recupererComptesActifsParProfil is not a function`.

- [ ] **Step 3: Ajouter les méthodes au port**

Dans `UtilisateurRepository.ts`, importer `ProfilCode` depuis `@/server/gestion-utilisateur/domain/Profil` et ajouter avant la `}` finale de l'interface :

```ts
  recupererComptesActifsParProfil(
    profilCode: ProfilCode,
  ): Promise<{ id: string; email: string }[]>;
  estActif(utilisateurId: string): Promise<boolean>;
```

- [ ] **Step 4: Implémenter dans `PrismaUtilisateurRepository`**

Après la méthode `recupererUtilisateurId`, ajouter (importer `ProfilCode` depuis `@/server/gestion-utilisateur/domain/Profil` si ce n'est pas déjà fait) :

```ts
  async recupererComptesActifsParProfil(
    profilCode: ProfilCode,
  ): Promise<{ id: string; email: string }[]> {
    return this.prisma.utilisateur.findMany({
      where: { profilCode, date_desactivation: null },
      select: { id: true, email: true },
      orderBy: { email: "asc" },
    });
  }

  async estActif(utilisateurId: string): Promise<boolean> {
    const utilisateur = await this.prisma.utilisateur.findUnique({
      where: { id: utilisateurId },
      select: { date_desactivation: true },
    });

    return utilisateur !== null && utilisateur.date_desactivation === null;
  }
```

`this.prisma` est le getter existant du fichier (ligne ~248), qui renvoie `this.deps.prisma.getInstance()`.

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:server:integration src/server/gestion-utilisateur/__tests__/infrastructure/adapters/UtilisateurSQLRepository.integration.test.ts -t "recupererComptesActifsParProfil|estActif"`
Expected: PASS, 3 tests.

- [ ] **Step 6: Vérifier le typage (les mocks existants du port doivent toujours compiler)**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 7: Point de commit**

```bash
git add src/server/gestion-utilisateur/domain/ports/UtilisateurRepository.ts src/server/gestion-utilisateur/infrastructure/adapters/PrismaUtilisateurRepository.ts src/server/gestion-utilisateur/__tests__/infrastructure/adapters/UtilisateurSQLRepository.integration.test.ts
git commit -m "feat(ppg): comptes actifs par profil et estActif sur UtilisateurRepository"
```

---

### Task 6: Port Keycloak : date du credential et forçage du changement

**Files:**
- Modify: `src/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository.ts`
- Modify: `src/server/gestion-utilisateur/infrastructure/adapters/UtilisateurIAMKeycloakRepository.ts` (après `reactive`, avant `ajouteUtilisateurs`)

**Interfaces:**
- Produces: `recupererDateDernierChangementPassword(email: string): Promise<Date | null>` et `forcerChangementPassword(email: string): Promise<void>`.

Pas de test automatisé : l'adaptateur Keycloak n'en a aucun dans le projet (pas d'instance Keycloak en CI). Vérification manuelle en recette (voir tâche 10, step 9).

- [ ] **Step 1: Ajouter les méthodes au port**

`UtilisateurIAMRepository.ts` devient :

```ts
import UtilisateurIAM from "@/server/gestion-utilisateur/domain/UtilisateurIAM.interface";

export interface UtilisateurIAMRepository {
  ajouteUtilisateurs(utilisateurs: UtilisateurIAM[]): Promise<void>;
  supprime(email: string): Promise<void>;
  desactive(email: string): Promise<void>;
  reactive(email: string): Promise<void>;
  recupererDateDernierChangementPassword(email: string): Promise<Date | null>;
  forcerChangementPassword(email: string): Promise<void>;
}
```

- [ ] **Step 2: Implémenter dans l'adaptateur Keycloak**

Dans `UtilisateurIAMKeycloakRepository.ts`, après la méthode `reactive`, ajouter :

```ts
  async recupererDateDernierChangementPassword(
    email: string,
  ): Promise<Date | null> {
    const kcAdminClient = await this.loginKcAdminClient();
    const [utilisateur] = await kcAdminClient.users.find({
      realm: KEYCLOAK_REALM,
      email,
      exact: true,
    });

    if (!utilisateur?.id) {
      return null;
    }

    const credentials = await kcAdminClient.users.getCredentials({
      realm: KEYCLOAK_REALM,
      id: utilisateur.id,
    });
    const credentialPassword = credentials.find(
      (credential) => credential.type === "password",
    );

    return credentialPassword?.createdDate
      ? new Date(credentialPassword.createdDate)
      : null;
  }

  async forcerChangementPassword(email: string): Promise<void> {
    const kcAdminClient = await this.loginKcAdminClient();
    const [utilisateur] = await kcAdminClient.users.find({
      realm: KEYCLOAK_REALM,
      email,
      exact: true,
    });

    if (!utilisateur?.id) {
      throw new Error(`Utilisateur ${email} introuvable dans Keycloak`);
    }

    // Idempotent : l'action requise n'est ajoutée qu'une fois, le rejeu d'une
    // action EXPIRATION en échec ne doit pas écraser les autres actions requises.
    const requiredActions = Array.from(
      new Set([...(utilisateur.requiredActions ?? []), "UPDATE_PASSWORD"]),
    );
    await kcAdminClient.users.update(
      { realm: KEYCLOAK_REALM, id: utilisateur.id },
      { requiredActions },
    );
    await kcAdminClient.users.logout({
      realm: KEYCLOAK_REALM,
      id: utilisateur.id,
    });
    logger.info(
      {
        categorie: "utilisateur",
        source: "UtilisateurIAMKeycloakRepository",
        email,
      },
      "Changement de mot de passe forcé dans Keycloak, sessions révoquées",
    );
  }
```

- [ ] **Step 3: Vérifier le typage et le lint**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/server/gestion-utilisateur/infrastructure/adapters/UtilisateurIAMKeycloakRepository.ts src/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository.ts`
Expected: aucune erreur. Si `tsc` signale des mocks de `UtilisateurIAMRepository` incomplets dans des tests existants, c'est que `mock<>()` de vitest-mock-extended n'est pas utilisé là : compléter ces doubles avec `recupererDateDernierChangementPassword: vi.fn()` et `forcerChangementPassword: vi.fn()`.

- [ ] **Step 4: Point de commit**

```bash
git add src/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository.ts src/server/gestion-utilisateur/infrastructure/adapters/UtilisateurIAMKeycloakRepository.ts
git commit -m "feat(ppg): lecture de la date du credential et forçage du changement de mot de passe dans Keycloak"
```

---

### Task 7: Use case phase 1 : `SynchroniserLesSuivisPasswordAdminUseCase`

**Files:**
- Create: `src/server/gestion-utilisateur/usecases/SynchroniserLesSuivisPasswordAdminUseCase.ts`
- Modify: `src/server/gestion-utilisateur/module.ts` (cradle + register)
- Test: `src/server/gestion-utilisateur/__tests__/usecases/SynchroniserLesSuivisPasswordAdminUseCase.unit.test.ts`

**Interfaces:**
- Consumes: `initSuivi`, `saveNewPassword` (tâche 2), `ActionPasswordRepository` (tâche 3), `SuiviPasswordAdminRepository` (tâche 4), `UtilisateurRepository.recupererComptesActifsParProfil` (tâche 5), `UtilisateurIAMRepository.recupererDateDernierChangementPassword` (tâche 6).
- Produces: `class SynchroniserLesSuivisPasswordAdminUseCase { run(): Promise<SynchroniserLesSuivisPasswordAdminResultat> }` avec `interface SynchroniserLesSuivisPasswordAdminResultat { suivisInitialises: number; changementsDetectes: number; comptesNonSoumis: number; erreurs: number }`. Clés de module : `suiviPasswordAdminRepository`, `actionPasswordRepository`, `synchroniserLesSuivisPasswordAdminUseCase`.

- [ ] **Step 1: Enregistrer les repositories dans le module**

Dans `module.ts` :

Imports à ajouter :

```ts
import { SuiviPasswordAdminRepository } from "./domain/ports/SuiviPasswordAdminRepository";
import { PrismaSuiviPasswordAdminRepository } from "./infrastructure/adapters/PrismaSuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "./domain/ports/ActionPasswordRepository";
import { PrismaActionPasswordRepository } from "./infrastructure/adapters/PrismaActionPasswordRepository";
import { SynchroniserLesSuivisPasswordAdminUseCase } from "./usecases/SynchroniserLesSuivisPasswordAdminUseCase";
```

Dans `GestionUtilisateurCradle`, après `mettreAJourLaDerniereConnexionUseCase: MettreAJourLaDerniereConnexionUseCase;` :

```ts
  suiviPasswordAdminRepository: SuiviPasswordAdminRepository;
  actionPasswordRepository: ActionPasswordRepository;
  synchroniserLesSuivisPasswordAdminUseCase: SynchroniserLesSuivisPasswordAdminUseCase;
```

Dans `container.register({...})`, après `mettreAJourLaDerniereConnexionUseCase: asModuleClass(...)` :

```ts
      suiviPasswordAdminRepository: asModuleClass(
        PrismaSuiviPasswordAdminRepository,
      ),
      actionPasswordRepository: asModuleClass(PrismaActionPasswordRepository),
      synchroniserLesSuivisPasswordAdminUseCase: asModuleClass(
        SynchroniserLesSuivisPasswordAdminUseCase,
      ),
```

- [ ] **Step 2: Écrire les tests unitaires**

Créer `src/server/gestion-utilisateur/__tests__/usecases/SynchroniserLesSuivisPasswordAdminUseCase.unit.test.ts` :

```ts
import { mock, MockProxy } from "vitest-mock-extended";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { SynchroniserLesSuivisPasswordAdminUseCase } from "@/server/gestion-utilisateur/usecases/SynchroniserLesSuivisPasswordAdminUseCase";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("SynchroniserLesSuivisPasswordAdminUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let utilisateurIAMRepository: MockProxy<UtilisateurIAMRepository>;
  let suiviPasswordAdminRepository: MockProxy<SuiviPasswordAdminRepository>;
  let actionPasswordRepository: MockProxy<ActionPasswordRepository>;
  let useCase: SynchroniserLesSuivisPasswordAdminUseCase;

  const AUJOURD_HUI = new Date("2026-10-01T12:00:00Z");
  const ADMIN = { id: "admin-id", email: "admin@test.gouv.fr" };

  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> = {},
  ): SuiviPasswordAdmin => ({
    utilisateurId: ADMIN.id,
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AUJOURD_HUI);

    utilisateurRepository = mock<UtilisateurRepository>();
    utilisateurIAMRepository = mock<UtilisateurIAMRepository>();
    suiviPasswordAdminRepository = mock<SuiviPasswordAdminRepository>();
    actionPasswordRepository = mock<ActionPasswordRepository>();

    useCase = new SynchroniserLesSuivisPasswordAdminUseCase({
      utilisateurRepository,
      utilisateurIAMRepository,
      suiviPasswordAdminRepository,
      actionPasswordRepository,
    });

    utilisateurRepository.recupererComptesActifsParProfil.mockResolvedValue([
      ADMIN,
    ]);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ne synchronise que les comptes actifs de profil DITP_ADMIN", async () => {
    // Given
    utilisateurRepository.recupererComptesActifsParProfil.mockResolvedValue([]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      utilisateurRepository.recupererComptesActifsParProfil,
    ).toHaveBeenCalledWith("DITP_ADMIN");
    expect(resultat).toEqual({
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    });
  });

  it("initialise le suivi d'un compte qui n'en a pas encore", async () => {
    // Given
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(null);
    utilisateurIAMRepository.recupererDateDernierChangementPassword.mockResolvedValue(
      new Date("2026-04-01T10:00:00Z"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith({
      utilisateurId: ADMIN.id,
      dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
      dateExpiration: new Date("2026-10-31T12:00:00Z"),
      datePremiereRelance: null,
      dateDeuxiemeRelance: null,
      dateExpirationForcee: null,
    });
    expect(actionPasswordRepository.annulerActionsEnAttente).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      suivisInitialises: 1,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    });
  });

  it("ignore un compte sans mot de passe Keycloak", async () => {
    // Given
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(null);
    utilisateurIAMRepository.recupererDateDernierChangementPassword.mockResolvedValue(
      null,
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 1,
      erreurs: 0,
    });
  });

  it("ne modifie rien quand la date Keycloak est inchangée", async () => {
    // Given
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      creerSuivi(),
    );
    utilisateurIAMRepository.recupererDateDernierChangementPassword.mockResolvedValue(
      new Date("2026-04-01T10:00:00Z"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).not.toHaveBeenCalled();
    expect(actionPasswordRepository.annulerActionsEnAttente).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    });
  });

  it("repart sur un nouveau cycle et annule les actions en attente quand le mot de passe a changé", async () => {
    // Given
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      creerSuivi(),
    );
    utilisateurIAMRepository.recupererDateDernierChangementPassword.mockResolvedValue(
      new Date("2026-09-28T10:00:00Z"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith({
      utilisateurId: ADMIN.id,
      dateDernierChangement: new Date("2026-09-28T10:00:00Z"),
      dateExpiration: new Date("2027-03-28T10:00:00Z"),
      datePremiereRelance: null,
      dateDeuxiemeRelance: null,
      dateExpirationForcee: null,
    });
    expect(actionPasswordRepository.annulerActionsEnAttente).toHaveBeenCalledWith(
      ADMIN.id,
    );
    expect(resultat).toEqual({
      suivisInitialises: 0,
      changementsDetectes: 1,
      comptesNonSoumis: 0,
      erreurs: 0,
    });
  });

  it("compte une erreur et continue quand Keycloak échoue pour un compte", async () => {
    // Given
    const autreAdmin = { id: "autre-id", email: "autre@test.gouv.fr" };
    utilisateurRepository.recupererComptesActifsParProfil.mockResolvedValue([
      ADMIN,
      autreAdmin,
    ]);
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(null);
    utilisateurIAMRepository.recupererDateDernierChangementPassword
      .mockRejectedValueOnce(new Error("Keycloak indisponible"))
      .mockResolvedValueOnce(new Date("2026-09-01T10:00:00Z"));

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledTimes(1);
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({ utilisateurId: autreAdmin.id }),
    );
    expect(resultat).toEqual({
      suivisInitialises: 1,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 1,
    });
  });
});
```

- [ ] **Step 3: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm test:server:unit src/server/gestion-utilisateur/__tests__/usecases/SynchroniserLesSuivisPasswordAdminUseCase.unit.test.ts`
Expected: FAIL, module `SynchroniserLesSuivisPasswordAdminUseCase` introuvable.

- [ ] **Step 4: Écrire le use case**

Créer `src/server/gestion-utilisateur/usecases/SynchroniserLesSuivisPasswordAdminUseCase.ts` :

```ts
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import {
  initSuivi,
  saveNewPassword,
} from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/gestion-utilisateur/module";

export interface SynchroniserLesSuivisPasswordAdminResultat {
  suivisInitialises: number;
  changementsDetectes: number;
  comptesNonSoumis: number;
  erreurs: number;
}

const PROFIL_SOUMIS = ProfilEnum.DITP_ADMIN;
const SOURCE = "SynchroniserLesSuivisPasswordAdminUseCase";

export class SynchroniserLesSuivisPasswordAdminUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private suiviPasswordAdminRepository: SuiviPasswordAdminRepository;

  private actionPasswordRepository: ActionPasswordRepository;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    suiviPasswordAdminRepository,
    actionPasswordRepository,
  }: Inject<
    | "utilisateurRepository"
    | "utilisateurIAMRepository"
    | "suiviPasswordAdminRepository"
    | "actionPasswordRepository"
  >) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.suiviPasswordAdminRepository = suiviPasswordAdminRepository;
    this.actionPasswordRepository = actionPasswordRepository;
  }

  async run(): Promise<SynchroniserLesSuivisPasswordAdminResultat> {
    const aujourdHui = new Date();
    const comptes =
      await this.utilisateurRepository.recupererComptesActifsParProfil(
        PROFIL_SOUMIS,
      );

    const resultat: SynchroniserLesSuivisPasswordAdminResultat = {
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    };

    for (const compte of comptes) {
      try {
        const suivi =
          await this.suiviPasswordAdminRepository.recupererParUtilisateur(
            compte.id,
          );
        const dateDernierChangement =
          await this.utilisateurIAMRepository.recupererDateDernierChangementPassword(
            compte.email,
          );

        if (!dateDernierChangement) {
          if (suivi) {
            logger.warn(
              { categorie: "utilisateur", source: SOURCE, email: compte.email },
              "Compte suivi sans credential mot de passe dans Keycloak, suivi conservé",
            );
          }
          resultat.comptesNonSoumis++;
          continue;
        }

        if (!suivi) {
          await this.suiviPasswordAdminRepository.sauvegarder(
            initSuivi({
              utilisateurId: compte.id,
              dateDernierChangement,
              aujourdHui,
            }),
          );
          resultat.suivisInitialises++;
          continue;
        }

        if (
          suivi.dateDernierChangement.getTime() !==
          dateDernierChangement.getTime()
        ) {
          await this.suiviPasswordAdminRepository.sauvegarder(
            saveNewPassword({ suivi, dateDernierChangement, aujourdHui }),
          );
          await this.actionPasswordRepository.annulerActionsEnAttente(
            compte.id,
          );
          resultat.changementsDetectes++;
        }
      } catch (error) {
        logger.error(
          { categorie: "utilisateur", source: SOURCE, email: compte.email },
          `Erreur de synchronisation du suivi de mot de passe : ${error instanceof Error ? error.message : String(error)}`,
        );
        resultat.erreurs++;
      }
    }

    return resultat;
  }
}
```

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:server:unit src/server/gestion-utilisateur/__tests__/usecases/SynchroniserLesSuivisPasswordAdminUseCase.unit.test.ts`
Expected: PASS, 6 tests.

- [ ] **Step 6: Vérifier le typage du module**

Run: `pnpm exec tsc --noEmit`
Expected: aucune erreur (le `satisfies VerifyCradle` du module doit accepter les trois nouvelles clés).

- [ ] **Step 7: Point de commit**

```bash
git add src/server/gestion-utilisateur/usecases/SynchroniserLesSuivisPasswordAdminUseCase.ts src/server/gestion-utilisateur/__tests__/usecases/SynchroniserLesSuivisPasswordAdminUseCase.unit.test.ts src/server/gestion-utilisateur/module.ts
git commit -m "feat(ppg): synchronisation quotidienne des suivis de mot de passe DITP_ADMIN depuis Keycloak"
```

---

### Task 8: Use case phase 2 : `CreerLesActionsPasswordUseCase`

**Files:**
- Create: `src/server/gestion-utilisateur/usecases/CreerLesActionsPasswordUseCase.ts`
- Modify: `src/server/gestion-utilisateur/module.ts`
- Test: `src/server/gestion-utilisateur/__tests__/usecases/CreerLesActionsPasswordUseCase.unit.test.ts`

**Interfaces:**
- Consumes: `determinerTypeAction` (tâche 2), `creerActionPassword` et `ActionPasswordRepository` (tâche 3), `SuiviPasswordAdminRepository.recupererTous` (tâche 4).
- Produces: `class CreerLesActionsPasswordUseCase { run(): Promise<CreerLesActionsPasswordResultat> }` avec `interface CreerLesActionsPasswordResultat { actionsPremiereRelance: number; actionsDeuxiemeRelance: number; actionsExpiration: number }`. Clé de module : `creerLesActionsPasswordUseCase`.

- [ ] **Step 1: Écrire les tests unitaires**

Créer `src/server/gestion-utilisateur/__tests__/usecases/CreerLesActionsPasswordUseCase.unit.test.ts` :

```ts
import { mock, MockProxy } from "vitest-mock-extended";
import { randomUUID } from "crypto";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { CreerLesActionsPasswordUseCase } from "@/server/gestion-utilisateur/usecases/CreerLesActionsPasswordUseCase";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("CreerLesActionsPasswordUseCase", () => {
  let suiviPasswordAdminRepository: MockProxy<SuiviPasswordAdminRepository>;
  let actionPasswordRepository: MockProxy<ActionPasswordRepository>;
  let useCase: CreerLesActionsPasswordUseCase;

  const AUJOURD_HUI = new Date("2026-09-01T12:00:00Z");

  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> = {},
  ): SuiviPasswordAdmin => ({
    utilisateurId: "admin-id",
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  const creerAction = (overrides: Partial<ActionPassword> = {}): ActionPassword => ({
    id: randomUUID(),
    utilisateurId: "admin-id",
    typeAction: "PREMIERE_RELANCE",
    dateCreation: new Date("2026-08-31"),
    statut: "CREEE",
    dateSucces: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreur: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AUJOURD_HUI);

    suiviPasswordAdminRepository = mock<SuiviPasswordAdminRepository>();
    actionPasswordRepository = mock<ActionPasswordRepository>();
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([]);

    useCase = new CreerLesActionsPasswordUseCase({
      suiviPasswordAdminRepository,
      actionPasswordRepository,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("ne crée rien quand aucun suivi n'est dû", async () => {
    // Given
    suiviPasswordAdminRepository.recupererTous.mockResolvedValue([
      creerSuivi({ dateExpiration: new Date("2027-01-01T10:00:00Z") }),
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    });
  });

  it("crée une action PREMIERE_RELANCE à J-30", async () => {
    // Given
    suiviPasswordAdminRepository.recupererTous.mockResolvedValue([creerSuivi()]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        utilisateurId: "admin-id",
        typeAction: "PREMIERE_RELANCE",
        statut: "CREEE",
        dateCreation: AUJOURD_HUI,
      }),
    );
    expect(resultat).toEqual({
      actionsPremiereRelance: 1,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    });
  });

  it("crée une action DEUXIEME_RELANCE à J-7 et EXPIRATION à J0", async () => {
    // Given
    vi.setSystemTime(new Date("2026-10-01T12:00:00Z"));
    suiviPasswordAdminRepository.recupererTous.mockResolvedValue([
      creerSuivi({
        utilisateurId: "admin-a-j7",
        dateExpiration: new Date("2026-10-08T10:00:00Z"),
        datePremiereRelance: new Date("2026-09-08T10:00:00Z"),
      }),
      creerSuivi({
        utilisateurId: "admin-a-j0",
        datePremiereRelance: new Date("2026-09-01T10:00:00Z"),
        dateDeuxiemeRelance: new Date("2026-09-24T10:00:00Z"),
      }),
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        utilisateurId: "admin-a-j7",
        typeAction: "DEUXIEME_RELANCE",
      }),
    );
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        utilisateurId: "admin-a-j0",
        typeAction: "EXPIRATION",
      }),
    );
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 1,
      actionsExpiration: 1,
    });
  });

  it("ne recrée pas une action du même type déjà en attente", async () => {
    // Given
    suiviPasswordAdminRepository.recupererTous.mockResolvedValue([creerSuivi()]);
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction(),
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    });
  });

  it("continue avec les autres suivis quand la sauvegarde d'une action échoue", async () => {
    // Given
    suiviPasswordAdminRepository.recupererTous.mockResolvedValue([
      creerSuivi({ utilisateurId: "admin-en-erreur" }),
      creerSuivi({ utilisateurId: "admin-ok" }),
    ]);
    actionPasswordRepository.sauvegarder
      .mockRejectedValueOnce(new Error("Base indisponible"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      actionsPremiereRelance: 1,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    });
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm test:server:unit src/server/gestion-utilisateur/__tests__/usecases/CreerLesActionsPasswordUseCase.unit.test.ts`
Expected: FAIL, module `CreerLesActionsPasswordUseCase` introuvable.

- [ ] **Step 3: Écrire le use case**

Créer `src/server/gestion-utilisateur/usecases/CreerLesActionsPasswordUseCase.ts` :

```ts
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { determinerTypeAction } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { creerActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/gestion-utilisateur/module";

export interface CreerLesActionsPasswordResultat {
  actionsPremiereRelance: number;
  actionsDeuxiemeRelance: number;
  actionsExpiration: number;
}

const SOURCE = "CreerLesActionsPasswordUseCase";

export class CreerLesActionsPasswordUseCase {
  private suiviPasswordAdminRepository: SuiviPasswordAdminRepository;

  private actionPasswordRepository: ActionPasswordRepository;

  constructor({
    suiviPasswordAdminRepository,
    actionPasswordRepository,
  }: Inject<"suiviPasswordAdminRepository" | "actionPasswordRepository">) {
    this.suiviPasswordAdminRepository = suiviPasswordAdminRepository;
    this.actionPasswordRepository = actionPasswordRepository;
  }

  async run(): Promise<CreerLesActionsPasswordResultat> {
    const aujourdHui = new Date();
    const suivis = await this.suiviPasswordAdminRepository.recupererTous();
    const actionsEnAttente =
      await this.actionPasswordRepository.recupererActionsParTypeEtStatut({
        typesAction: ["PREMIERE_RELANCE", "DEUXIEME_RELANCE", "EXPIRATION"],
        statut: "CREEE",
      });

    const resultat: CreerLesActionsPasswordResultat = {
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    };

    for (const suivi of suivis) {
      const typeAction = determinerTypeAction({ suivi, aujourdHui });

      if (!typeAction) {
        continue;
      }

      const dejaEnAttente = actionsEnAttente.some(
        (action) =>
          action.utilisateurId === suivi.utilisateurId &&
          action.typeAction === typeAction,
      );
      if (dejaEnAttente) {
        continue;
      }

      try {
        await this.actionPasswordRepository.sauvegarder(
          creerActionPassword({
            utilisateurId: suivi.utilisateurId,
            dateCreation: aujourdHui,
            typeAction,
          }),
        );

        if (typeAction === "PREMIERE_RELANCE") resultat.actionsPremiereRelance++;
        if (typeAction === "DEUXIEME_RELANCE") resultat.actionsDeuxiemeRelance++;
        if (typeAction === "EXPIRATION") resultat.actionsExpiration++;
      } catch (error) {
        logger.error(
          {
            categorie: "utilisateur",
            source: SOURCE,
            utilisateurId: suivi.utilisateurId,
            typeAction,
          },
          `Erreur création action : ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    return resultat;
  }
}
```

- [ ] **Step 4: Enregistrer dans le module**

Dans `module.ts` : import `CreerLesActionsPasswordUseCase` depuis `./usecases/CreerLesActionsPasswordUseCase`, clé `creerLesActionsPasswordUseCase: CreerLesActionsPasswordUseCase;` dans le cradle et `creerLesActionsPasswordUseCase: asModuleClass(CreerLesActionsPasswordUseCase),` dans `register`, à la suite de `synchroniserLesSuivisPasswordAdminUseCase`.

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:server:unit src/server/gestion-utilisateur/__tests__/usecases/CreerLesActionsPasswordUseCase.unit.test.ts && pnpm exec tsc --noEmit`
Expected: PASS, 5 tests ; typage sans erreur.

- [ ] **Step 6: Point de commit**

```bash
git add src/server/gestion-utilisateur/usecases/CreerLesActionsPasswordUseCase.ts src/server/gestion-utilisateur/__tests__/usecases/CreerLesActionsPasswordUseCase.unit.test.ts src/server/gestion-utilisateur/module.ts
git commit -m "feat(ppg): création des actions de relance et d'expiration des mots de passe DITP_ADMIN"
```

---

### Task 9: Use case phase 3 : `ExecuterLesActionsPasswordUseCase`

**Files:**
- Create: `src/server/gestion-utilisateur/usecases/ExecuterLesActionsPasswordUseCase.ts`
- Modify: `src/server/gestion-utilisateur/module.ts`
- Test: `src/server/gestion-utilisateur/__tests__/usecases/ExecuterLesActionsPasswordUseCase.unit.test.ts`

**Interfaces:**
- Consumes: `marquerCommeSucces`, `marquerCommeEchec`, `ActionPasswordRepository` (tâche 3), `SuiviPasswordAdminRepository` (tâche 4), `UtilisateurRepository.estActif` et `recupererUtilisateurEmail` (tâche 5 et existant), `UtilisateurIAMRepository.forcerChangementPassword` (tâche 6), `ContactInfoLettresService.envoieUnEmail` (existant).
- Produces: `class ExecuterLesActionsPasswordUseCase { run(): Promise<ExecuterLesActionsPasswordResultat> }` avec `interface ExecuterLesActionsPasswordResultat { premieresRelancesEnvoyees: number; deuxiemesRelancesEnvoyees: number; expirationsForcees: number; erreurs: number }`. Clé de module : `executerLesActionsPasswordUseCase`. Constante exportée `TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID`.

- [ ] **Step 1: Écrire les tests unitaires**

Créer `src/server/gestion-utilisateur/__tests__/usecases/ExecuterLesActionsPasswordUseCase.unit.test.ts` :

```ts
import { mock, MockProxy } from "vitest-mock-extended";
import { randomUUID } from "crypto";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import {
  ExecuterLesActionsPasswordUseCase,
  TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID,
} from "@/server/gestion-utilisateur/usecases/ExecuterLesActionsPasswordUseCase";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import { ActionPassword } from "@/server/gestion-utilisateur/domain/ActionPassword";

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe("ExecuterLesActionsPasswordUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let utilisateurIAMRepository: MockProxy<UtilisateurIAMRepository>;
  let suiviPasswordAdminRepository: MockProxy<SuiviPasswordAdminRepository>;
  let actionPasswordRepository: MockProxy<ActionPasswordRepository>;
  let contactInfoLettresService: MockProxy<ContactInfoLettresService>;
  let useCase: ExecuterLesActionsPasswordUseCase;

  const AUJOURD_HUI = new Date("2026-09-01T12:00:00Z");
  const ADMIN_ID = "admin-id";
  const ADMIN_EMAIL = "admin@test.gouv.fr";

  const creerSuivi = (
    overrides: Partial<SuiviPasswordAdmin> = {},
  ): SuiviPasswordAdmin => ({
    utilisateurId: ADMIN_ID,
    dateDernierChangement: new Date("2026-04-01T10:00:00Z"),
    dateExpiration: new Date("2026-10-01T10:00:00Z"),
    datePremiereRelance: null,
    dateDeuxiemeRelance: null,
    dateExpirationForcee: null,
    ...overrides,
  });

  const creerAction = (overrides: Partial<ActionPassword> = {}): ActionPassword => ({
    id: randomUUID(),
    utilisateurId: ADMIN_ID,
    typeAction: "PREMIERE_RELANCE",
    dateCreation: new Date("2026-09-01"),
    statut: "CREEE",
    dateSucces: null,
    dateDerniereTentative: null,
    nombreTentatives: 0,
    erreur: null,
    ...overrides,
  });

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(AUJOURD_HUI);

    utilisateurRepository = mock<UtilisateurRepository>();
    utilisateurIAMRepository = mock<UtilisateurIAMRepository>();
    suiviPasswordAdminRepository = mock<SuiviPasswordAdminRepository>();
    actionPasswordRepository = mock<ActionPasswordRepository>();
    contactInfoLettresService = mock<ContactInfoLettresService>();

    useCase = new ExecuterLesActionsPasswordUseCase({
      utilisateurRepository,
      utilisateurIAMRepository,
      suiviPasswordAdminRepository,
      actionPasswordRepository,
      contactInfoLettresService,
    });

    utilisateurRepository.estActif.mockResolvedValue(true);
    utilisateurRepository.recupererUtilisateurEmail.mockResolvedValue(ADMIN_EMAIL);
    suiviPasswordAdminRepository.recupererParUtilisateur.mockResolvedValue(
      creerSuivi(),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("envoie la première relance et pose la date sur le suivi", async () => {
    // Given
    const action = creerAction();
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      action,
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: ADMIN_EMAIL }],
      TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID,
      { joursAvantExpiration: 30, dateExpiration: "01/10/2026" },
    );
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith(
      creerSuivi({ datePremiereRelance: AUJOURD_HUI }),
    );
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith({
      ...action,
      statut: "SUCCES",
      dateSucces: AUJOURD_HUI,
    });
    expect(utilisateurIAMRepository.forcerChangementPassword).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 1,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 0,
    });
  });

  it("envoie la deuxième relance avec 7 jours", async () => {
    // Given
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction({ typeAction: "DEUXIEME_RELANCE" }),
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: ADMIN_EMAIL }],
      TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID,
      { joursAvantExpiration: 7, dateExpiration: "01/10/2026" },
    );
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith(
      creerSuivi({ dateDeuxiemeRelance: AUJOURD_HUI }),
    );
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 1,
      expirationsForcees: 0,
      erreurs: 0,
    });
  });

  it("force le changement dans Keycloak, envoie l'email J0 et pose la date d'expiration forcée", async () => {
    // Given
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction({ typeAction: "EXPIRATION" }),
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(utilisateurIAMRepository.forcerChangementPassword).toHaveBeenCalledWith(
      ADMIN_EMAIL,
    );
    expect(contactInfoLettresService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: ADMIN_EMAIL }],
      TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID,
      { joursAvantExpiration: 0, dateExpiration: "01/10/2026" },
    );
    expect(suiviPasswordAdminRepository.sauvegarder).toHaveBeenCalledWith(
      creerSuivi({ dateExpirationForcee: AUJOURD_HUI }),
    );
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 1,
      erreurs: 0,
    });
  });

  it("marque l'action en échec et ne pose aucune date quand l'envoi échoue", async () => {
    // Given
    const action = creerAction();
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      action,
    ]);
    contactInfoLettresService.envoieUnEmail.mockRejectedValue(
      new Error("Brevo indisponible"),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(suiviPasswordAdminRepository.sauvegarder).not.toHaveBeenCalled();
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith({
      ...action,
      statut: "ECHEC",
      nombreTentatives: 1,
      dateDerniereTentative: AUJOURD_HUI,
      erreur: "Brevo indisponible",
    });
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 1,
    });
  });

  it("marque en échec une action dont le compte est désactivé, sans email ni appel Keycloak", async () => {
    // Given
    const action = creerAction({ typeAction: "EXPIRATION" });
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      action,
    ]);
    utilisateurRepository.estActif.mockResolvedValue(false);

    // When
    const resultat = await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail).not.toHaveBeenCalled();
    expect(utilisateurIAMRepository.forcerChangementPassword).not.toHaveBeenCalled();
    expect(actionPasswordRepository.sauvegarder).toHaveBeenCalledWith(
      expect.objectContaining({
        id: action.id,
        statut: "ECHEC",
        erreur: "Compte désactivé",
      }),
    );
    expect(resultat).toEqual({
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 1,
    });
  });

  it("traite les expirations avant les relances", async () => {
    // Given
    actionPasswordRepository.recupererActionsParTypeEtStatut.mockResolvedValue([
      creerAction({ utilisateurId: "relance-id", typeAction: "PREMIERE_RELANCE" }),
      creerAction({ utilisateurId: "expiration-id", typeAction: "EXPIRATION" }),
    ]);
    utilisateurRepository.recupererUtilisateurEmail.mockImplementation(
      async (utilisateurId) => `${utilisateurId}@test.gouv.fr`,
    );
    suiviPasswordAdminRepository.recupererParUtilisateur.mockImplementation(
      async (utilisateurId) => creerSuivi({ utilisateurId }),
    );

    // When
    await useCase.run();

    // Then
    expect(contactInfoLettresService.envoieUnEmail.mock.calls).toEqual([
      [
        [{ email: "expiration-id@test.gouv.fr" }],
        TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID,
        { joursAvantExpiration: 0, dateExpiration: "01/10/2026" },
      ],
      [
        [{ email: "relance-id@test.gouv.fr" }],
        TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID,
        { joursAvantExpiration: 30, dateExpiration: "01/10/2026" },
      ],
    ]);
  });
});
```

- [ ] **Step 2: Lancer les tests pour vérifier qu'ils échouent**

Run: `pnpm test:server:unit src/server/gestion-utilisateur/__tests__/usecases/ExecuterLesActionsPasswordUseCase.unit.test.ts`
Expected: FAIL, module `ExecuterLesActionsPasswordUseCase` introuvable.

- [ ] **Step 3: Écrire le use case**

Créer `src/server/gestion-utilisateur/usecases/ExecuterLesActionsPasswordUseCase.ts` :

```ts
import { $Enums } from "@prisma/client";
import { DateTime } from "luxon";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { SuiviPasswordAdminRepository } from "@/server/gestion-utilisateur/domain/ports/SuiviPasswordAdminRepository";
import { ActionPasswordRepository } from "@/server/gestion-utilisateur/domain/ports/ActionPasswordRepository";
import { ContactInfoLettresService } from "@/server/gestion-utilisateur/domain/ports/ContactInfoLettresService";
import {
  ActionPassword,
  marquerCommeEchec,
  marquerCommeSucces,
} from "@/server/gestion-utilisateur/domain/ActionPassword";
import { SuiviPasswordAdmin } from "@/server/gestion-utilisateur/domain/SuiviPasswordAdmin";
import logger from "@/server/infrastructure/Logger";
import type { Inject } from "@/server/gestion-utilisateur/module";

export interface ExecuterLesActionsPasswordResultat {
  premieresRelancesEnvoyees: number;
  deuxiemesRelancesEnvoyees: number;
  expirationsForcees: number;
  erreurs: number;
}

// Identifiant du template Brevo « expiration du mot de passe » : à créer dans
// Brevo et à reporter ici avant l'activation du feature flip.
export const TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID = 0;

const JOURS_AVANT_EXPIRATION: Record<$Enums.type_action_password, number> = {
  PREMIERE_RELANCE: 30,
  DEUXIEME_RELANCE: 7,
  EXPIRATION: 0,
};

const ORDRE_EXECUTION: $Enums.type_action_password[] = [
  "EXPIRATION",
  "DEUXIEME_RELANCE",
  "PREMIERE_RELANCE",
];

const SOURCE = "ExecuterLesActionsPasswordUseCase";

export class ExecuterLesActionsPasswordUseCase {
  private utilisateurRepository: UtilisateurRepository;

  private utilisateurIAMRepository: UtilisateurIAMRepository;

  private suiviPasswordAdminRepository: SuiviPasswordAdminRepository;

  private actionPasswordRepository: ActionPasswordRepository;

  private contactInfoLettresService: ContactInfoLettresService;

  constructor({
    utilisateurRepository,
    utilisateurIAMRepository,
    suiviPasswordAdminRepository,
    actionPasswordRepository,
    contactInfoLettresService,
  }: Inject<
    | "utilisateurRepository"
    | "utilisateurIAMRepository"
    | "suiviPasswordAdminRepository"
    | "actionPasswordRepository"
    | "contactInfoLettresService"
  >) {
    this.utilisateurRepository = utilisateurRepository;
    this.utilisateurIAMRepository = utilisateurIAMRepository;
    this.suiviPasswordAdminRepository = suiviPasswordAdminRepository;
    this.actionPasswordRepository = actionPasswordRepository;
    this.contactInfoLettresService = contactInfoLettresService;
  }

  async run(): Promise<ExecuterLesActionsPasswordResultat> {
    const actions =
      await this.actionPasswordRepository.recupererActionsParTypeEtStatut({
        typesAction: ORDRE_EXECUTION,
        statut: "CREEE",
      });
    const actionsOrdonnees = [...actions].sort(
      (premiere, seconde) =>
        ORDRE_EXECUTION.indexOf(premiere.typeAction) -
        ORDRE_EXECUTION.indexOf(seconde.typeAction),
    );

    const resultat: ExecuterLesActionsPasswordResultat = {
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 0,
    };

    for (const action of actionsOrdonnees) {
      try {
        await this.executerAction(action);
        await this.actionPasswordRepository.sauvegarder(
          marquerCommeSucces({ action, dateSucces: new Date() }),
        );

        if (action.typeAction === "PREMIERE_RELANCE")
          resultat.premieresRelancesEnvoyees++;
        if (action.typeAction === "DEUXIEME_RELANCE")
          resultat.deuxiemesRelancesEnvoyees++;
        if (action.typeAction === "EXPIRATION") resultat.expirationsForcees++;
      } catch (error) {
        const messageErreur =
          error instanceof Error ? error.message : String(error);
        logger.error(
          {
            categorie: "utilisateur",
            source: SOURCE,
            utilisateurId: action.utilisateurId,
            typeAction: action.typeAction,
          },
          `Erreur exécution action mot de passe : ${messageErreur}`,
        );
        await this.actionPasswordRepository.sauvegarder(
          marquerCommeEchec({
            action,
            dateTentative: new Date(),
            erreur: messageErreur,
          }),
        );
        resultat.erreurs++;
      }
    }

    return resultat;
  }

  private async executerAction(action: ActionPassword): Promise<void> {
    const maintenant = new Date();

    const estActif = await this.utilisateurRepository.estActif(
      action.utilisateurId,
    );
    if (!estActif) {
      throw new Error("Compte désactivé");
    }

    const email = await this.utilisateurRepository.recupererUtilisateurEmail(
      action.utilisateurId,
    );
    if (!email) {
      throw new Error("Utilisateur introuvable");
    }

    const suivi =
      await this.suiviPasswordAdminRepository.recupererParUtilisateur(
        action.utilisateurId,
      );
    if (!suivi) {
      throw new Error("Suivi de mot de passe introuvable");
    }

    if (action.typeAction === "EXPIRATION") {
      await this.utilisateurIAMRepository.forcerChangementPassword(email);
    }

    await this.contactInfoLettresService.envoieUnEmail(
      [{ email }],
      TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID,
      {
        joursAvantExpiration: JOURS_AVANT_EXPIRATION[action.typeAction],
        dateExpiration: DateTime.fromJSDate(suivi.dateExpiration)
          .setZone("Europe/Paris")
          .toFormat("dd/MM/yyyy"),
      },
    );

    await this.suiviPasswordAdminRepository.sauvegarder(
      this.poserDate(suivi, action.typeAction, maintenant),
    );
  }

  private poserDate(
    suivi: SuiviPasswordAdmin,
    typeAction: $Enums.type_action_password,
    date: Date,
  ): SuiviPasswordAdmin {
    switch (typeAction) {
      case "PREMIERE_RELANCE":
        return { ...suivi, datePremiereRelance: date };
      case "DEUXIEME_RELANCE":
        return { ...suivi, dateDeuxiemeRelance: date };
      case "EXPIRATION":
        return { ...suivi, dateExpirationForcee: date };
    }
  }
}
```

Note sur le fuseau : la date affichée dans l'email est formatée en `Europe/Paris`, le fuseau des destinataires, indépendamment du fuseau du serveur.

- [ ] **Step 4: Enregistrer dans le module**

Dans `module.ts` : import `ExecuterLesActionsPasswordUseCase` depuis `./usecases/ExecuterLesActionsPasswordUseCase`, clé `executerLesActionsPasswordUseCase: ExecuterLesActionsPasswordUseCase;` dans le cradle et `executerLesActionsPasswordUseCase: asModuleClass(ExecuterLesActionsPasswordUseCase),` dans `register`, à la suite de `creerLesActionsPasswordUseCase`.

- [ ] **Step 5: Lancer les tests pour vérifier qu'ils passent**

Run: `pnpm test:server:unit src/server/gestion-utilisateur/__tests__/usecases/ExecuterLesActionsPasswordUseCase.unit.test.ts && pnpm exec tsc --noEmit`
Expected: PASS, 6 tests ; typage sans erreur.

- [ ] **Step 6: Point de commit**

```bash
git add src/server/gestion-utilisateur/usecases/ExecuterLesActionsPasswordUseCase.ts src/server/gestion-utilisateur/__tests__/usecases/ExecuterLesActionsPasswordUseCase.unit.test.ts src/server/gestion-utilisateur/module.ts
git commit -m "feat(ppg): envoi des relances et forçage du changement de mot de passe DITP_ADMIN"
```

---

### Task 10: Endpoint cron, feature flip et `cron.json`

**Files:**
- Modify: `src/config.ts` (bloc `featureFlip`, après `comparaisonTerritoires`)
- Create: `src/pages/api/admin/cron/expiration-password-admin.ts`
- Modify: `cron.json`
- Test: `src/server/infrastructure/api/cron/__tests__/expiration-password-admin.unit.test.ts` (le projet vitest `server-unit` n'inclut que `src/server/**`, pas `src/pages/**`)

**Interfaces:**
- Consumes: les trois use cases (tâches 7, 8, 9) via `getContainer("gestionUtilisateur")`.
- Produces: endpoint `POST /api/admin/cron/expiration-password-admin`, feature flip `configuration().featureFlip.expirationPasswordAdmin`.

- [ ] **Step 1: Ajouter le feature flip**

Dans `src/config.ts`, dans `featureFlip`, après le bloc `comparaisonTerritoires` :

```ts
    expirationPasswordAdmin: {
      format: Boolean,
      default: false,
      env: "NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN",
    },
```

- [ ] **Step 2: Écrire le test unitaire de l'endpoint**

Créer `src/server/infrastructure/api/cron/__tests__/expiration-password-admin.unit.test.ts` :

```ts
import handler from "@/pages/api/admin/cron/expiration-password-admin";
import {
  setupRequest,
  setupResponse,
} from "@/server/infrastructure/test/apiTestHelpers";
import { configuration } from "@/config";
import { getContainer } from "@/server/dependances";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";

vi.mock("@/config", () => ({
  configuration: vi.fn(),
}));

vi.mock("@/server/dependances", () => ({
  getContainer: vi.fn(),
}));

vi.mock("@/server/utils/notification-tchap", () => ({
  envoieMessageTchap: vi.fn(),
}));

vi.mock("@/server/infrastructure/Logger", () => ({
  __esModule: true,
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const mockConfiguration = vi.mocked(configuration);
const mockGetContainer = vi.mocked(getContainer);
const mockEnvoieMessageTchap = vi.mocked(envoieMessageTchap);

function configurer(overrides: {
  scalingoEnvironment?: string;
  expirationPasswordAdmin?: boolean;
} = {}) {
  mockConfiguration.mockReturnValue({
    logLevel: "warn",
    scalingoEnvironment: overrides.scalingoEnvironment ?? "PROD",
    featureFlip: {
      expirationPasswordAdmin: overrides.expirationPasswordAdmin ?? true,
    },
    cron: { authSecret: "secret-cron" },
    tchap: {
      baseUrl: "https://tchap.test",
      roomIdDesactivationComptes: "!salon:tchap.test",
      accessToken: "token",
    },
  } as unknown as ReturnType<typeof configuration>);
}

function brancherLesUseCases(resultats: {
  synchronisation?: object;
  creation?: object;
  execution?: object;
}) {
  const synchroniser = vi.fn().mockResolvedValue(
    resultats.synchronisation ?? {
      suivisInitialises: 0,
      changementsDetectes: 0,
      comptesNonSoumis: 0,
      erreurs: 0,
    },
  );
  const creer = vi.fn().mockResolvedValue(
    resultats.creation ?? {
      actionsPremiereRelance: 0,
      actionsDeuxiemeRelance: 0,
      actionsExpiration: 0,
    },
  );
  const executer = vi.fn().mockResolvedValue(
    resultats.execution ?? {
      premieresRelancesEnvoyees: 0,
      deuxiemesRelancesEnvoyees: 0,
      expirationsForcees: 0,
      erreurs: 0,
    },
  );
  const useCases: Record<string, { run: ReturnType<typeof vi.fn> }> = {
    synchroniserLesSuivisPasswordAdminUseCase: { run: synchroniser },
    creerLesActionsPasswordUseCase: { run: creer },
    executerLesActionsPasswordUseCase: { run: executer },
  };
  mockGetContainer.mockReturnValue({
    resolve: (nom: string) => useCases[nom],
  } as unknown as ReturnType<typeof getContainer>);

  return { synchroniser, creer, executer };
}

const requeteCron = () =>
  setupRequest({
    method: "POST",
    headers: { authorization: "Bearer secret-cron" },
  });

describe("cron/expiration-password-admin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    configurer();
  });

  it("répond skipped hors PROD", async () => {
    // Given
    configurer({ scalingoEnvironment: "STAGING" });
    const { synchroniser } = brancherLesUseCases({});
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.status().json).toHaveBeenCalledWith({
      skipped: true,
      reason: "Environment is not PROD",
    });
    expect(synchroniser).not.toHaveBeenCalled();
  });

  it("répond skipped quand le feature flip est désactivé", async () => {
    // Given
    configurer({ expirationPasswordAdmin: false });
    const { synchroniser } = brancherLesUseCases({});
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(response.status().json).toHaveBeenCalledWith({
      skipped: true,
      reason: "Feature flip expirationPasswordAdmin is disabled",
    });
    expect(synchroniser).not.toHaveBeenCalled();
  });

  it("enchaîne les trois phases et renvoie leurs résultats sans message Tchap", async () => {
    // Given
    const { synchroniser, creer, executer } = brancherLesUseCases({
      execution: {
        premieresRelancesEnvoyees: 2,
        deuxiemesRelancesEnvoyees: 1,
        expirationsForcees: 0,
        erreurs: 0,
      },
    });
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(synchroniser).toHaveBeenCalledTimes(1);
    expect(creer).toHaveBeenCalledTimes(1);
    expect(executer).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.status().json).toHaveBeenCalledWith({
      resultatSynchronisation: {
        suivisInitialises: 0,
        changementsDetectes: 0,
        comptesNonSoumis: 0,
        erreurs: 0,
      },
      resultatCreation: {
        actionsPremiereRelance: 0,
        actionsDeuxiemeRelance: 0,
        actionsExpiration: 0,
      },
      resultatExecution: {
        premieresRelancesEnvoyees: 2,
        deuxiemesRelancesEnvoyees: 1,
        expirationsForcees: 0,
        erreurs: 0,
      },
    });
    expect(mockEnvoieMessageTchap).not.toHaveBeenCalled();
  });

  it("envoie un message Tchap quand des erreurs sont remontées", async () => {
    // Given
    brancherLesUseCases({
      synchronisation: {
        suivisInitialises: 0,
        changementsDetectes: 0,
        comptesNonSoumis: 0,
        erreurs: 1,
      },
      execution: {
        premieresRelancesEnvoyees: 0,
        deuxiemesRelancesEnvoyees: 0,
        expirationsForcees: 0,
        erreurs: 2,
      },
    });
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(response.status).toHaveBeenCalledWith(200);
    expect(mockEnvoieMessageTchap).toHaveBeenCalledWith(
      expect.stringContaining("3 erreur(s)"),
      "https://tchap.test",
      "!salon:tchap.test",
      "token",
    );
  });

  it("répond 500 et prévient sur Tchap quand une phase lève une exception", async () => {
    // Given
    const { synchroniser } = brancherLesUseCases({});
    synchroniser.mockRejectedValue(new Error("Keycloak injoignable"));
    const response = setupResponse();

    // When
    await handler(requeteCron(), response);

    // Then
    expect(response.status).toHaveBeenCalledWith(500);
    expect(mockEnvoieMessageTchap).toHaveBeenCalledWith(
      expect.stringContaining("Erreur lors de l'expiration des mots de passe"),
      "https://tchap.test",
      "!salon:tchap.test",
      "token",
    );
  });
});
```

- [ ] **Step 3: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm test:server:unit src/server/infrastructure/api/cron/__tests__/expiration-password-admin.unit.test.ts`
Expected: FAIL, module `@/pages/api/admin/cron/expiration-password-admin` introuvable.

- [ ] **Step 4: Écrire l'endpoint**

Créer `src/pages/api/admin/cron/expiration-password-admin.ts` :

```ts
import type { NextApiRequest, NextApiResponse } from "next";
import { onlyCron } from "@/server/infrastructure/api/cron/onlyCron";
import { getContainer } from "@/server/dependances";
import logger from "@/server/infrastructure/Logger";
import { envoieMessageTchap } from "@/server/utils/notification-tchap";
import { configuration } from "@/config";

const SOURCE = "cron/expiration-password-admin";

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const config = configuration();
  const baseUrl = config.tchap.baseUrl;
  const roomId = config.tchap.roomIdDesactivationComptes;
  const accessToken = config.tchap.accessToken;

  if (config.scalingoEnvironment !== "PROD") {
    return res.status(200).json({
      skipped: true,
      reason: "Environment is not PROD",
    });
  }

  if (!config.featureFlip.expirationPasswordAdmin) {
    return res.status(200).json({
      skipped: true,
      reason: "Feature flip expirationPasswordAdmin is disabled",
    });
  }

  try {
    const container = getContainer("gestionUtilisateur");

    logger.info(
      { categorie: "utilisateur", source: SOURCE },
      "Phase 1 : Synchronisation des suivis de mot de passe depuis Keycloak",
    );
    const resultatSynchronisation = await container
      .resolve("synchroniserLesSuivisPasswordAdminUseCase")
      .run();
    logger.info(
      { categorie: "utilisateur", source: SOURCE, ...resultatSynchronisation },
      "Phase 1 terminée",
    );

    logger.info(
      { categorie: "utilisateur", source: SOURCE },
      "Phase 2 : Création des actions de relance et d'expiration",
    );
    const resultatCreation = await container
      .resolve("creerLesActionsPasswordUseCase")
      .run();
    logger.info(
      { categorie: "utilisateur", source: SOURCE, ...resultatCreation },
      "Phase 2 terminée",
    );

    logger.info(
      { categorie: "utilisateur", source: SOURCE },
      "Phase 3 : Exécution des actions",
    );
    const resultatExecution = await container
      .resolve("executerLesActionsPasswordUseCase")
      .run();
    logger.info(
      { categorie: "utilisateur", source: SOURCE, ...resultatExecution },
      "Phase 3 terminée",
    );

    const totalErreurs =
      resultatSynchronisation.erreurs + resultatExecution.erreurs;

    if (totalErreurs > 0) {
      const message = [
        "## ⚠️ Expiration des mots de passe DITP_ADMIN",
        "",
        `**${totalErreurs} erreur(s) :** ${resultatSynchronisation.erreurs} synchronisation(s), ${resultatExecution.erreurs} action(s)`,
        "Veuillez regarder les logs pour en savoir plus.",
      ].join("\n");
      envoieMessageTchap(message, baseUrl, roomId, accessToken);
    }

    const result = {
      resultatSynchronisation,
      resultatCreation,
      resultatExecution,
    };
    logger.info(
      { categorie: "utilisateur", source: SOURCE, ...result },
      "Script d'expiration des mots de passe terminé avec succès",
    );

    return res.status(200).json(result);
  } catch (error) {
    logger.error(
      { categorie: "utilisateur", source: SOURCE },
      `Erreur lors de l'exécution du cron d'expiration des mots de passe : ${(error as Error).message}`,
    );

    const messageErreur = [
      "## ⚠️ Erreur lors de l'expiration des mots de passe DITP_ADMIN",
      "Veuillez regarder les logs pour en savoir plus.",
    ].join("\n");
    envoieMessageTchap(messageErreur, baseUrl, roomId, accessToken);

    return res.status(500).json({ error: "Internal server error" });
  }
}

export default onlyCron(handler);
```

- [ ] **Step 5: Lancer le test pour vérifier qu'il passe**

Run: `pnpm test:server:unit src/server/infrastructure/api/cron/__tests__/expiration-password-admin.unit.test.ts`
Expected: PASS, 5 tests.

- [ ] **Step 6: Ajouter l'entrée dans `cron.json`**

Après l'entrée `desactivation-comptes` (15h45), ajouter :

```json
    {
      "command": "15 16 * * * curl -X POST -H \"Authorization: Bearer $CRON_AUTH_SECRET\" \"$APP_URL/api/admin/cron/expiration-password-admin\""
    },
```

- [ ] **Step 7: Vérifier lint et typage**

Run: `pnpm exec tsc --noEmit && pnpm exec eslint src/pages/api/admin/cron/expiration-password-admin.ts src/config.ts && node -e "JSON.parse(require('fs').readFileSync('cron.json','utf8'))"`
Expected: aucune erreur, `cron.json` valide.

- [ ] **Step 8: Point de commit**

```bash
git add src/config.ts src/pages/api/admin/cron/expiration-password-admin.ts src/server/infrastructure/api/cron/__tests__/expiration-password-admin.unit.test.ts cron.json
git commit -m "feat(ppg): cron quotidien d'expiration des mots de passe DITP_ADMIN derrière un feature flip"
```

- [ ] **Step 9: Vérification manuelle en recette (à faire par l'utilisateur, hors CI)**

À noter dans la PR comme checklist de recette, pas à exécuter ici :

1. Dans Keycloak (realm `DITP`) : politique « Not Recently Used » à 3 ; client `IMPORT_CLIENT_ID` avec les rôles `view-users` et `manage-users`.
2. Créer le template Brevo et reporter son identifiant dans `TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID`.
3. Activer `NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN=true` sur un environnement de recette avec `ENVIRONMENT=PROD` (ou appeler l'endpoint à la main).
4. Appeler `POST /api/admin/cron/expiration-password-admin` avec le header `Authorization: Bearer $CRON_AUTH_SECRET` ; vérifier qu'une ligne `suivi_password_admin` apparaît pour chaque DITP_ADMIN avec `date_expiration` à J+30.
5. Forcer `date_expiration` à hier en base pour un compte de test, relancer l'endpoint : vérifier l'email J0, l'action requise `UPDATE_PASSWORD` sur l'utilisateur Keycloak, et qu'à la connexion suivante le changement est imposé et que l'ancien mot de passe est refusé.
6. Relancer l'endpoint une fois le mot de passe changé : `date_dernier_changement` et `date_expiration` sont mises à jour, les trois dates de relance sont à `null`.

---

### Task 11: ADR et `.env.example`

**Files:**
- Create: `docs/architecture/decisions/0010-expiration-des-mots-de-passe-ditp-admin.md`
- Modify: `.env.example` (section « Feature flipping »)

- [ ] **Step 1: Écrire l'ADR**

Créer `docs/architecture/decisions/0010-expiration-des-mots-de-passe-ditp-admin.md` :

```markdown
# 10. Expiration des mots de passe des comptes DITP_ADMIN

Date : 2026-10-01

## Statut

Accepté

## Contexte

Les recommandations de l'ANSSI et de la CNIL sur les accès sensibles demandent
un renouvellement périodique des mots de passe des comptes à privilèges. Les
comptes de profil `DITP_ADMIN` doivent donc changer de mot de passe tous les
6 mois, être prévenus 30 jours, 7 jours et le jour de l'expiration, et ne pas
pouvoir réutiliser leur ancien mot de passe.

PILOTE ne stocke aucun mot de passe : ils vivent dans Keycloak (realm `DITP`),
et une partie des utilisateurs se connecte par ProConnect sans mot de passe
PILOTE. Les politiques de mot de passe de Keycloak (« Expire Password »,
« Not Recently Used ») s'appliquent à tout le realm et ne peuvent pas être
restreintes à un profil PILOTE.

Un mécanisme équivalent existe déjà pour la désactivation des comptes inactifs
(ADR 0006, table `action_compte_inactif`, cron `desactivation-comptes`).

## Décision

- **Keycloak reste la seule source du mot de passe.** Il porte l'interdiction
  de réutilisation (politique « Not Recently Used » à 3, configurée à la main
  dans le realm) et la vérification du mot de passe.
- **Le cycle de 6 mois est piloté par PILOTE**, pour les seuls `DITP_ADMIN`,
  à partir de la table `suivi_password_admin`. La date du dernier changement y
  est copiée une fois par jour depuis la date de création du credential
  `password` lue par l'admin API Keycloak. Il n'y a pas de synchronisation à
  la connexion.
- **La date d'expiration est stockée**, pas recalculée : à l'initialisation
  d'un suivi, elle n'est jamais à moins de 30 jours, ce qui évite de forcer
  sans préavis les mots de passe anciens au moment du déploiement.
- **Le cron quotidien `expiration-password-admin`** enchaîne trois phases
  (synchronisation, création d'actions idempotentes `action_password`,
  exécution) sur le modèle de la désactivation des comptes inactifs. Les
  actions en échec sont rejouées le lendemain.
- **À l'expiration, le compte n'est pas bloqué** : PILOTE ajoute l'action
  requise `UPDATE_PASSWORD` dans Keycloak et révoque les sessions. Le
  changement est imposé à la connexion suivante.
- Le cron est réservé à `PROD` et activé par le feature flip
  `NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN`.

## Conséquences

- Configuration manuelle du realm Keycloak à réaliser avant activation :
  politique « Not Recently Used », rôles `view-users` et `manage-users` pour le
  client d'import.
- Un template Brevo dédié doit exister ; son identifiant est reporté dans la
  constante `TEMPLATE_MAIL_EXPIRATION_PASSWORD_ID`.
- Un `DITP_ADMIN` sans credential `password` (connexion ProConnect
  uniquement) n'est pas soumis au cycle.
- Le journal d'audit des changements de mot de passe et le rapport des comptes
  expirés sont reportés à une décision ultérieure. Les tables sont conçues pour
  les accueillir sans migration des données existantes.
- Un changement de mot de passe fait dans Keycloak n'est pris en compte qu'au
  prochain passage du cron, soit au plus 24 heures après.
```

- [ ] **Step 2: Documenter le feature flip dans `.env.example`**

Dans la section « Feature flipping », après la ligne `# Voir les NEXT_PUBLIC_FF_* dans le config.ts`, ajouter :

```
# Expiration des mots de passe des comptes DITP_ADMIN (cron quotidien, PROD uniquement)
NEXT_PUBLIC_FF_EXPIRATION_PASSWORD_ADMIN=false
```

- [ ] **Step 3: Lancer toute la suite serveur et le lint**

Run: `pnpm test:server && pnpm lint`
Expected: tout passe.

- [ ] **Step 4: Point de commit**

```bash
git add docs/architecture/decisions/0010-expiration-des-mots-de-passe-ditp-admin.md .env.example
git commit -m "docs(ppg): ADR 0010 expiration des mots de passe DITP_ADMIN"
```

- [ ] **Step 5: Proposer les tests e2e à l'utilisateur**

Conformément au CLAUDE.md, demander à l'utilisateur s'il souhaite lancer `pnpm test:e2e` après cette feature (pas de nouveau test e2e écrit : le cron n'a pas d'interface).
