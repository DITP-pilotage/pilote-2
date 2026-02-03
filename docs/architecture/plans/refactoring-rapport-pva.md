# Plan de Refactoring - Rapports Propositions Valeur Avancement

Date : 2026-02-03

## Objectif

Refactorer le script `rapportPropositionValeurAvancement.ts` pour améliorer la gestion des erreurs et le debug en séparant la création des rapports de leur envoi.

## Architecture Cible

```
Script rapportPropositionValeurAvancement.ts
├── Phase 1: CreerLesRapportsPropositionsUseCase
│   └── Création et enregistrement en base
└── Phase 2: EnvoyerLesRapportsPropositionsUseCase
    └── Envoi des emails avec gestion des tentatives
```

---

## Étape 1 : Migration Prisma

**Fichier à créer :** `src/database/prisma/migrations/YYYYMMDDHHMMSS_creation_table_rapport_propositions_avancement/migration.sql`

```sql
-- CreateEnum
CREATE TYPE "public"."statut_envoi_rapport" AS ENUM ('CREE', 'ENVOYE', 'ECHEC');

-- CreateTable
CREATE TABLE "public"."rapport_propositions_avancement" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "utilisateur_id" TEXT NOT NULL,
    "contenu_rapport" JSONB NOT NULL,
    "statut_envoi" "public"."statut_envoi_rapport" NOT NULL DEFAULT 'CREE',
    "date_creation" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_envoi" TIMESTAMP(3),
    "date_derniere_tentative" TIMESTAMP(3),
    "nombre_tentatives" INTEGER NOT NULL DEFAULT 0,
    "erreur_envoi" TEXT,

    CONSTRAINT "rapport_propositions_avancement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "rapport_propositions_avancement_statut_envoi_idx" ON "public"."rapport_propositions_avancement"("statut_envoi");

-- CreateIndex
CREATE INDEX "rapport_propositions_avancement_utilisateur_id_idx" ON "public"."rapport_propositions_avancement"("utilisateur_id");

-- AddForeignKey
ALTER TABLE "public"."rapport_propositions_avancement" ADD CONSTRAINT "rapport_propositions_avancement_utilisateur_id_fkey" FOREIGN KEY ("utilisateur_id") REFERENCES "public"."utilisateur"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

**Mise à jour du schema.prisma :**

```prisma
enum statut_envoi_rapport {
  CREE
  ENVOYE
  ECHEC

  @@schema("public")
}

model rapport_propositions_avancement {
  id                      String              @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  utilisateur_id          String
  contenu_rapport         Json
  statut_envoi            statut_envoi_rapport @default(CREE)
  date_creation           DateTime            @default(now())
  date_envoi              DateTime?
  date_derniere_tentative DateTime?
  nombre_tentatives       Int                 @default(0)
  erreur_envoi            String?

  utilisateur utilisateur @relation(fields: [utilisateur_id], references: [id], onDelete: Cascade)

  @@index([statut_envoi])
  @@index([utilisateur_id])
  @@schema("public")
}
```

---

## Étape 2 : Domaine (Interfaces uniquement pour TDD)

### 2.1 Entité RapportPropositionsAvancement

**Fichier :** `src/server/chantiers/domain/RapportPropositionsAvancement.ts`

```typescript
import { $Enums } from "@prisma/client";

export interface ContenuRapport {
  chantiersAvecPropositions: {
    chantierId: string;
    chantierNom: string;
    nombrePropositions: number;
  }[];
  chantiersAvecIndicateursNonAJour: {
    chantierId viseur: string;
    chantierNom: string;
    indicateurs: { id: string; nom: string }[];
  }[];
}

export interface RapportPropositionsAvancement {
  id: string;
  utilisateurId: string;
  contenuRapport: ContenuRapport;
  statutEnvoi: $Enums.statut_envoi_rapport;
  dateCreation: Date;
  dateEnvoi: Date | null;
  dateDerniereTentative: Date | null;
  nombreTentatives: number;
  erreurEnvoi: string | null;
}
```

### 2.2 Port RapportPropositionsAvancementRepository

**Fichier :** `src/server/chantiers/domain/ports/RapportPropositionsAvancementRepository.ts`

```typescript
import { $Enums } from "@prisma/client";
import { RapportPropositionsAvancement } from "../RapportPropositionsAvancement";

export interface RapportPropositionsAvancementRepository {
  sauvegarder(rapport: RapportPropositionsAvancement): Promise<void>;
  recupererRapportsParStatut(
    statut: $Enums.statut_envoi_rapport,
  ): Promise<RapportPropositionsAvancement[]>;
}
```

---

## Étape 3 : TDD - Tests d'Intégration Repository

**Fichier :** `src/server/chantiers/__tests__/infrastructure/adapters/PrismaRapportPropositionsAvancementRepository.integration.test.ts`

### Cas de test à écrire EN PREMIER :

```typescript
describe("PrismaRapportPropositionsAvancementRepository", () => {
  describe("sauvegarder", () => {
    it("crée un nouveau rapport en base avec statut CREE");
    it("met à jour un rapport existant (statut, erreur, tentatives)");
  });

  describe("recupererRapportsParStatut", () => {
    it("récupère uniquement les rapports avec le statut demandé");
    it("retourne une liste vide si aucun rapport ne correspond");
  });
});
```

### Implémentation après les tests :

**Fichier :** `src/server/chantiers/infrastructure/adapters/PrismaRapportPropositionsAvancementRepository.ts`

---

## Étape 4 : TDD - Tests Unitaires Domaine

**Fichier :** `src/server/chantiers/__tests__/domain/RapportPropositionsAvancement.unit.test.ts`

### Cas de test à écrire EN PREMIER :

```typescript
describe("RapportPropositionsAvancement", () => {
  describe("creerRapportPropositionsAvancement", () => {
    it("crée un rapport avec statut CREE et compteurs à zéro");
  });

  describe("marquerRapportCommeEnvoye", () => {
    it("passe le statut à ENVOYE et met à jour les dates");
    it("incrémente nombreTentatives");
    it("efface erreurEnvoi");
  });

  describe("marquerRapportCommeEchec", () => {
    it("passe le statut à ECHEC et capture l'erreur");
    it("incrémente nombreTentatives");
    it("met à jour dateDerniereTentative");
  });
});
```

### Implémentation après les tests :

Ajouter les factory functions dans `RapportPropositionsAvancement.ts`

---

## Étape 5 : TDD - Tests Unitaires CreerLesRapportsPropositionsUseCase

**Fichier :** `src/server/chantiers/__tests__/usecases/CreerLesRapportsPropositionsUseCase.unit.test.ts`

### Cas de test à écrire EN PREMIER :

```typescript
describe("CreerLesRapportsPropositionsUseCase", () => {
  describe("run", () => {
    // Given / When / Then
    it("crée un rapport pour chaque directeur de projet avec des propositions sur ses chantiers");

    it("ne crée pas de rapport si le directeur n'a aucune proposition ni indicateur non à jour");

    it("inclut les indicateurs non à jour dans le contenu du rapport");

    it("sauvegarde chaque rapport en base avec statut CREE");

    it("continue la création si une erreur survient pour un directeur et incrémente erreursCreation");

    it("stoppe le script (throw) si une erreur survient avant la boucle de création");

    it("retourne le nombre de rapports créés et d'erreurs");
  });
});
```

### Implémentation après les tests :

**Fichier :** `src/server/chantiers/usecases/CreerLesRapportsPropositionsUseCase.ts`

**Gestion des erreurs Phase 1 :**
- Erreur avant la boucle → **throw** (stopper le script)
- Erreur pendant la création d'un rapport → logger et continuer

**Interface de retour :**
```typescript
export interface CreerLesRapportsPropositionsResultat {
  rapportsCrees: number;
  erreursCreation: number;
}
```

**Dépendances :**
```typescript
type Dependencies = {
  chantierRepository: ChantierRepository;
  utilisateurRepository: UtilisateurRepository;
  indicateurTerritoireValeurEvenementRepository: IndicateurTerritoireValeurEvenementRepository;
  indicateurRepository: IndicateurRepository;
  rapportPropositionsAvancementRepository: RapportPropositionsAvancementRepository;
};
```

---

## Étape 6 : TDD - Tests Unitaires EnvoyerLesRapportsPropositionsUseCase

**Fichier :** `src/server/chantiers/__tests__/usecases/EnvoyerLesRapportsPropositionsUseCase.unit.test.ts`

### Cas de test à écrire EN PREMIER :

```typescript
describe("EnvoyerLesRapportsPropositionsUseCase", () => {
  describe("run", () => {
    // Given / When / Then
    it("récupère les rapports avec statut CREE");

    it("envoie un email pour chaque rapport");

    it("marque le rapport comme ENVOYE après un envoi réussi");

    it("marque le rapport comme ECHEC et capture l'erreur si l'envoi échoue");

    it("incrémente nombreTentatives à chaque tentative (succès ou échec)");

    it("met à jour dateDerniereTentative à chaque tentative");

    it("continue avec les autres rapports après une erreur d'envoi");

    it("retourne le décompte des envois réussis et échoués avec les emails en échec");
  });
});
```

### Implémentation après les tests :

**Fichier :** `src/server/chantiers/usecases/EnvoyerLesRapportsPropositionsUseCase.ts`

**Gestion des erreurs Phase 2 (par rapport) :**
1. Capturer l'erreur dans `erreurEnvoi`
2. Incrémenter `nombreTentatives`
3. Mettre à jour `dateDerniereTentative`
4. Passer le statut à `ECHEC`
5. Sauvegarder via le repository
6. **Continuer** avec les autres rapports

**Interface de retour :**
```typescript
export interface EnvoyerLesRapportsPropositionsResultat {
  rapportsEnvoyes: number;
  rapportsEnEchec: number;
  emailsEnEchec: string[];
}
```

**Dépendances :**
```typescript
type Dependencies = {
  rapportPropositionsAvancementRepository: RapportPropositionsAvancementRepository;
  utilisateurRepository: UtilisateurRepository;
  envoieEmailService: EnvoieEmailService;
};
```

---

## Étape 7 : Mise à jour du Container

**Fichier :** `src/server/chantiers/container.ts`

Ajouter les nouvelles dépendances et use cases.

---

## Étape 8 : Mise à jour du Script

**Fichier :** `scripts/rapportPropositionValeurAvancement.ts`

```typescript
async function main() {
  const initialContainer = getInitialContainerWithTransversalDependencies();
  const container = getChantiersContainer(initialContainer);

  logger.info("Phase 1 : Création des rapports");
  const resultatCreation = await container
    .resolve("creerLesRapportsPropositionsUseCase")
    .run();
  logger.info("Phase 1 terminée", resultatCreation);

  logger.info("Phase 2 : Envoi des rapports");
  const resultatEnvoi = await container
    .resolve("envoyerLesRapportsPropositionsUseCase")
    .run();
  logger.info("Phase 2 terminée", resultatEnvoi);

  return { resultatCreation, resultatEnvoi };
}
```

---

## Étape 9 : Nettoyage

- Supprimer `EnvoyerLesRapportsPropositionValeurAvancementUseCase.ts`
- Supprimer le test associé
- Retirer du container

---

## Ordre d'Implémentation TDD

| # | Étape | Type |
|---|-------|------|
| 1 | Migration Prisma + schema.prisma | Infra |
| 2 | Interfaces domaine (entité + port) | Domaine |
| 3 | **TEST** : PrismaRapportPropositionsAvancementRepository | Test Intégration |
| 4 | Implémentation : PrismaRapportPropositionsAvancementRepository | Infra |
| 5 | **TEST** : Factory functions domaine | Test Unitaire |
| 6 | Implémentation : Factory functions domaine | Domaine |
| 7 | **TEST** : CreerLesRapportsPropositionsUseCase | Test Unitaire |
| 8 | Implémentation : CreerLesRapportsPropositionsUseCase | Use Case |
| 9 | **TEST** : EnvoyerLesRapportsPropositionsUseCase | Test Unitaire |
| 10 | Implémentation : EnvoyerLesRapportsPropositionsUseCase | Use Case |
| 11 | Mise à jour du container | Infra |
| 12 | Mise à jour du script | Script |
| 13 | Suppression ancien use case | Nettoyage |

---

## Diagramme de Séquence

```
┌──────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌──────────┐
│  Script  │     │ CreerRapports   │     │ EnvoyerRapports │     │   BDD    │
└────┬─────┘     └───────┬─────────┘     └───────┬─────────┘     └────┬─────┘
     │                   │                       │                    │
     │ Phase 1: run()    │                       │                    │
     │──────────────────>│                       │                    │
     │                   │ Récupère propositions │                    │
     │                   │──────────────────────────────────────────>│
     │                   │                       │                    │
     │                   │ Crée rapport (statut=CREE)                 │
     │                   │──────────────────────────────────────────>│
     │                   │                       │                    │
     │<──────────────────│                       │                    │
     │ {rapportsCrees}   │                       │                    │
     │                   │                       │                    │
     │ Phase 2: run()    │                       │                    │
     │──────────────────────────────────────────>│                    │
     │                   │                       │ Récupère CREE      │
     │                   │                       │───────────────────>│
     │                   │                       │                    │
     │                   │                       │ Envoie email       │
     │                   │                       │────────┐           │
     │                   │                       │<───────┘           │
     │                   │                       │                    │
     │                   │                       │ Update statut      │
     │                   │                       │───────────────────>│
     │                   │                       │                    │
     │<─────────────────────────────────────────│                    │
     │ {rapportsEnvoyes, emailsEnEchec}         │                    │
```
