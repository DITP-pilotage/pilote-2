# Dashboard feedback Albert (PIL-1518) — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux administrateurs DITP de lister et consulter toutes les conversations Albert avec leurs feedbacks (👍/👎/commentaires) depuis un nouveau sous-onglet "Dashboard" du panel admin.

**Architecture:** Sur le backend, étendre le module `albert` avec un nouveau `AdminAlbertRepository` Prisma (raw SQL pour agrégats `EXISTS`), deux use cases lecture (lister + détail), exposés via un sous-router tRPC `admin` qui garde `DITP_ADMIN`. Sur le frontend, transformer la page `albert.tsx` en orchestrateur de deux sous-onglets via `NavigationTertiaire` (Radix Tabs), avec guard `getServerSideProps` sur le profil. Le nouveau composant `AlbertDashboard` rend la barre de filtres, le tableau paginé et la modale détail.

**Tech Stack:** Next.js 14 (Pages Router), tRPC, Prisma 6, PostgreSQL, Radix Tabs, Tailwind (config DSFR), Awilix (DI), Jest (intégration backend uniquement).

**Spec:** [`docs/superpowers/specs/2026-05-19-albert-dashboard-feedback-design.md`](../specs/2026-05-19-albert-dashboard-feedback-design.md)

**Branche:** `PIL-1518-liste-des-conversations`

---

## Conventions du plan

- Tous les chemins sont relatifs à `apps/pilote-ppg/` sauf mention contraire (la racine `pilote-2/` ne sera utilisée qu'occasionnellement).
- **Pas de tests frontend** (memory utilisateur). Tests d'intégration uniquement côté backend, avec `createIntegrationTest` + `fixtures`.
- Commits : on utilise la skill `commit-billable` à chaque commit (PIL-1518 sera détecté depuis le nom de branche). Le format final est `[DITP-pilotage/pilote-2] {catégorie}(PIL-1518): {description}`.
- Lint à passer avant chaque commit : `pnpm lint` depuis `apps/pilote-ppg/`.

## File Structure

### Backend (créés)

```
apps/pilote-ppg/src/server/albert/
├── domain/
│   ├── AdminAlbertRepository.ts                       # NEW — interface + types ConversationAdminResume/Detail
├── infrastructure/
│   ├── PrismaAdminAlbertRepository.ts                 # NEW — impl Prisma (raw SQL pour agrégats)
├── usecases/
│   ├── ListerConversationsAdminUseCase.ts             # NEW
│   ├── RecupererConversationAdminUseCase.ts           # NEW
├── __tests__/
│   ├── infrastructure/
│   │   └── PrismaAdminAlbertRepository.integration.test.ts  # NEW
│   └── usecases/
│       ├── ListerConversationsAdminUseCase.integration.test.ts  # NEW
│       └── RecupererConversationAdminUseCase.integration.test.ts  # NEW
```

### Backend (modifiés)

```
apps/pilote-ppg/src/server/albert/module.ts                              # ajouter 3 entrées DI
apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/albert.ts      # ajouter sous-router `admin`
```

### Frontend (créés)

```
apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/
├── AlbertPanel.tsx                              # NEW — orchestrateur tabs Discussion/Dashboard
├── AlbertDashboard.tsx                          # NEW — racine dashboard (filtres + tableau + modale)
├── AlbertDashboardFilters.tsx                   # NEW — barre filtres
├── AlbertDashboardTable.tsx                     # NEW — tableau + pagination
├── ConversationDetailModale.tsx                 # NEW — modale détail
├── ConversationTranscript.tsx                   # NEW — rendu transcript read-only
```

### Frontend (modifiés)

```
apps/pilote-ppg/src/pages/panel-administrateur/albert.tsx     # guard profil DITP_ADMIN + AlbertPanel
```

---

## Task 1: Domain — `AdminAlbertRepository` interface + types

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/domain/AdminAlbertRepository.ts`

- [ ] **Step 1.1: Créer le fichier d'interface domaine**

Contenu de `apps/pilote-ppg/src/server/albert/domain/AdminAlbertRepository.ts` :

```typescript
import type { $Enums } from "@prisma/client";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type ConversationAdminResume = {
  id: string;
  titre: string;
  extraitPremierMessageUser: string;
  utilisateur: {
    id: string;
    prenom: string;
    nom: string;
    email: string;
    profilCode: string;
    profilNom: string;
  };
  createdAt: Date;
  updatedAt: Date;
  aPouce: boolean;
  aPouceBas: boolean;
  aCommentaire: boolean;
};

export type ConversationAdminDetail = ConversationAdminResume & {
  messages: PiloteUIMessage[];
  contexte: Record<string, unknown> | null;
  llmCalls: Array<{
    id: string;
    evaluation: $Enums.llm_call_evaluation | null;
    commentaire: string | null;
    createdAt: Date;
  }>;
};

export type TriListeConversations = {
  champ: "createdAt" | "updatedAt";
  direction: "asc" | "desc";
};

export type FiltresListeConversations = {
  recherche?: string;
  avecPouce?: boolean;
  avecPouceBas?: boolean;
  avecCommentaire?: boolean;
  profilCodes?: string[];
};

export type ListerConversationsParams = FiltresListeConversations & {
  tri: TriListeConversations;
  page: number;
  taillePage: number;
};

export type ListerConversationsResult = {
  total: number;
  items: ConversationAdminResume[];
};

export interface AdminAlbertRepository {
  listerConversations(
    params: ListerConversationsParams,
  ): Promise<ListerConversationsResult>;

  recupererConversation(params: {
    id: string;
  }): Promise<ConversationAdminDetail | null>;
}
```

- [ ] **Step 1.2: Vérifier que le fichier compile**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit`
Expected: 0 erreur lié au nouveau fichier.

- [ ] **Step 1.3: Commit**

```bash
git add apps/pilote-ppg/src/server/albert/domain/AdminAlbertRepository.ts
```

Puis invoquer la skill `commit-billable` avec description : `domaine AdminAlbertRepository`. Catégorie : `feature`. Tags : `backend`.

---

## Task 2: Infrastructure — `PrismaAdminAlbertRepository` (TDD)

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/infrastructure/PrismaAdminAlbertRepository.ts`
- Create: `apps/pilote-ppg/src/server/albert/__tests__/infrastructure/PrismaAdminAlbertRepository.integration.test.ts`

**Stratégie SQL** : raw SQL via `prisma.$queryRaw` car les agrégats `EXISTS` par `chat_id` + extraction `messages->0` sont plus simples en SQL qu'en chaîne Prisma. Le repo utilise une vue paginée avec un `COUNT(*) OVER ()` pour récupérer le total en une requête.

- [ ] **Step 2.1: Écrire le test d'intégration en premier (TDD)**

Contenu de `apps/pilote-ppg/src/server/albert/__tests__/infrastructure/PrismaAdminAlbertRepository.integration.test.ts` :

```typescript
import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaAdminAlbertRepository } from "@/server/albert/infrastructure/PrismaAdminAlbertRepository";

describe("PrismaAdminAlbertRepository", () => {
  const prismaPilote = new PrismaPilote();
  const buildRepository = () =>
    new PrismaAdminAlbertRepository({ prisma: prismaPilote });

  const ID_PROFIL_DITP_ADMIN = "DITP_ADMIN";

  it(
    "listerConversations renvoie toutes les conversations triées par updatedAt desc par défaut, avec total",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateurA = await fixtures.utilisateur({
        nom: "Dupont",
        prenom: "Alice",
        email: "alice@example.com",
      });
      const utilisateurB = await fixtures.utilisateur({
        nom: "Martin",
        prenom: "Bob",
        email: "bob@example.com",
      });

      const idConvA = randomUUID();
      const idConvB = randomUUID();
      await tx.chat_conversation.create({
        data: {
          id: idConvA,
          utilisateur_id: utilisateurA.id,
          titre: "Conv Alice",
          messages: [
            { id: "m1", role: "user", parts: [{ type: "text", text: "Bonjour Albert, quel temps fait-il ?" }] },
          ],
        },
      });
      await tx.chat_conversation.create({
        data: {
          id: idConvB,
          utilisateur_id: utilisateurB.id,
          titre: "Conv Bob",
          messages: [],
        },
      });
      // Conv B est plus récente (créée après) → doit sortir en premier en desc
      await tx.chat_conversation.update({
        where: { id: idConvA },
        data: { updated_at: new Date("2026-01-01") },
      });
      await tx.chat_conversation.update({
        where: { id: idConvB },
        data: { updated_at: new Date("2026-02-01") },
      });

      const repo = buildRepository();

      // When
      const result = await repo.listerConversations({
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 25,
      });

      // Then
      expect(result.total).toEqual(2);
      expect(result.items).toEqual([
        expect.objectContaining({
          id: idConvB,
          titre: "Conv Bob",
          utilisateur: expect.objectContaining({ nom: "Martin", prenom: "Bob" }),
          aPouce: false,
          aPouceBas: false,
          aCommentaire: false,
        }),
        expect.objectContaining({
          id: idConvA,
          titre: "Conv Alice",
          extraitPremierMessageUser: expect.stringContaining("Bonjour Albert"),
          utilisateur: expect.objectContaining({ nom: "Dupont", prenom: "Alice", profilCode: ID_PROFIL_DITP_ADMIN }),
        }),
      ]);
    }),
  );

  it(
    "listerConversations calcule aPouce / aPouceBas / aCommentaire depuis llm_calls",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const idConv = randomUUID();
      await tx.chat_conversation.create({
        data: {
          id: idConv,
          utilisateur_id: utilisateur.id,
          titre: "Conv mixte",
          messages: [],
        },
      });
      await tx.llm_calls.createMany({
        data: [
          {
            chat_id: idConv,
            utilisateur_id: utilisateur.id,
            transcript: {},
            model: "openweight-large",
            evaluation: "POSITIVE",
          },
          {
            chat_id: idConv,
            utilisateur_id: utilisateur.id,
            transcript: {},
            model: "openweight-large",
            evaluation: "NEGATIVE",
            commentaire: "pas top",
          },
        ],
      });

      const repo = buildRepository();

      // When
      const result = await repo.listerConversations({
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 25,
      });

      // Then
      expect(result.items).toEqual([
        expect.objectContaining({
          id: idConv,
          aPouce: true,
          aPouceBas: true,
          aCommentaire: true,
        }),
      ]);
    }),
  );

  it(
    "listerConversations filtre avecPouce uniquement les conversations qui ont au moins un POSITIVE",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const idAvec = randomUUID();
      const idSans = randomUUID();
      await tx.chat_conversation.createMany({
        data: [
          { id: idAvec, utilisateur_id: utilisateur.id, titre: "avec", messages: [] },
          { id: idSans, utilisateur_id: utilisateur.id, titre: "sans", messages: [] },
        ],
      });
      await tx.llm_calls.create({
        data: {
          chat_id: idAvec,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "openweight-large",
          evaluation: "POSITIVE",
        },
      });

      const repo = buildRepository();

      // When
      const result = await repo.listerConversations({
        avecPouce: true,
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 25,
      });

      // Then
      expect(result.total).toEqual(1);
      expect(result.items).toEqual([expect.objectContaining({ id: idAvec })]);
    }),
  );

  it(
    "listerConversations filtre par recherche sur titre (ILIKE)",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      await tx.chat_conversation.createMany({
        data: [
          { id: randomUUID(), utilisateur_id: utilisateur.id, titre: "Synthèse Bretagne", messages: [] },
          { id: randomUUID(), utilisateur_id: utilisateur.id, titre: "Indicateurs PACA", messages: [] },
        ],
      });

      const repo = buildRepository();

      // When
      const result = await repo.listerConversations({
        recherche: "bretagne",
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 25,
      });

      // Then
      expect(result.total).toEqual(1);
      expect(result.items).toEqual([expect.objectContaining({ titre: "Synthèse Bretagne" })]);
    }),
  );

  it(
    "listerConversations filtre par profilCodes",
    createIntegrationTest(async (tx) => {
      // Given
      const admin = await fixtures.utilisateur({ profilCode: "DITP_ADMIN" });
      const pilotage = await fixtures.utilisateur({ profilCode: "DITP_PILOTAGE" });
      await tx.chat_conversation.createMany({
        data: [
          { id: randomUUID(), utilisateur_id: admin.id, titre: "admin-conv", messages: [] },
          { id: randomUUID(), utilisateur_id: pilotage.id, titre: "pilotage-conv", messages: [] },
        ],
      });

      const repo = buildRepository();

      // When
      const result = await repo.listerConversations({
        profilCodes: ["DITP_PILOTAGE"],
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 25,
      });

      // Then
      expect(result.items).toEqual([expect.objectContaining({ titre: "pilotage-conv" })]);
    }),
  );

  it(
    "listerConversations pagine via page / taillePage",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      for (let index = 0; index < 5; index += 1) {
        await tx.chat_conversation.create({
          data: {
            id: randomUUID(),
            utilisateur_id: utilisateur.id,
            titre: `conv-${index}`,
            messages: [],
          },
        });
      }

      const repo = buildRepository();

      // When
      const page1 = await repo.listerConversations({
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 2,
      });
      const page3 = await repo.listerConversations({
        tri: { champ: "updatedAt", direction: "desc" },
        page: 3,
        taillePage: 2,
      });

      // Then
      expect(page1.total).toEqual(5);
      expect(page1.items).toHaveLength(2);
      expect(page3.items).toHaveLength(1);
    }),
  );

  it(
    "recupererConversation renvoie conversation + llm_calls triés par created_at asc",
    createIntegrationTest(async (tx) => {
      // Given
      const utilisateur = await fixtures.utilisateur({});
      const idConv = randomUUID();
      await tx.chat_conversation.create({
        data: {
          id: idConv,
          utilisateur_id: utilisateur.id,
          titre: "Conv détail",
          messages: [
            { id: "m1", role: "user", parts: [{ type: "text", text: "ping" }] },
          ],
          contexte: { jalon: 2025 },
        },
      });
      await tx.llm_calls.create({
        data: {
          chat_id: idConv,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "m",
          evaluation: "NEGATIVE",
          commentaire: "réponse hors-sujet",
          created_at: new Date("2026-01-01T10:00:00Z"),
        },
      });
      await tx.llm_calls.create({
        data: {
          chat_id: idConv,
          utilisateur_id: utilisateur.id,
          transcript: {},
          model: "m",
          created_at: new Date("2026-01-01T11:00:00Z"),
        },
      });

      const repo = buildRepository();

      // When
      const result = await repo.recupererConversation({ id: idConv });

      // Then
      expect(result).toEqual(
        expect.objectContaining({
          id: idConv,
          titre: "Conv détail",
          contexte: { jalon: 2025 },
          llmCalls: [
            expect.objectContaining({ evaluation: "NEGATIVE", commentaire: "réponse hors-sujet" }),
            expect.objectContaining({ evaluation: null, commentaire: null }),
          ],
        }),
      );
    }),
  );

  it(
    "recupererConversation renvoie null si l'id n'existe pas",
    createIntegrationTest(async () => {
      const repo = buildRepository();
      const result = await repo.recupererConversation({ id: randomUUID() });
      expect(result).toBeNull();
    }),
  );
});
```

- [ ] **Step 2.2: Vérifier que le test échoue (compile/red)**

Run (depuis racine repo) :
```bash
cd apps/pilote-ppg && pnpm tsc --noEmit
```
Expected: erreur "Cannot find module … PrismaAdminAlbertRepository" — c'est attendu.

**Note** : NE PAS lancer les tests par toi-même (memory utilisateur). On va demander au user à la fin.

- [ ] **Step 2.3: Implémenter `PrismaAdminAlbertRepository`**

Contenu de `apps/pilote-ppg/src/server/albert/infrastructure/PrismaAdminAlbertRepository.ts` :

```typescript
import { Prisma } from "@prisma/client";
import type { PrismaPilote } from "@/server/db/PrismaPilote";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type {
  AdminAlbertRepository,
  ConversationAdminDetail,
  ConversationAdminResume,
  ListerConversationsParams,
  ListerConversationsResult,
} from "@/server/albert/domain/AdminAlbertRepository";

type LigneListe = {
  id: string;
  titre: string;
  extrait_premier_message_user: string | null;
  utilisateur_id: string;
  utilisateur_prenom: string;
  utilisateur_nom: string;
  utilisateur_email: string;
  profil_code: string;
  profil_nom: string;
  created_at: Date;
  updated_at: Date;
  a_pouce: boolean;
  a_pouce_bas: boolean;
  a_commentaire: boolean;
  total: bigint;
};

type LigneDetail = LigneListe & {
  messages: unknown;
  contexte: unknown;
};

type LigneLlmCall = {
  id: string;
  evaluation: "POSITIVE" | "NEGATIVE" | null;
  commentaire: string | null;
  created_at: Date;
};

export class PrismaAdminAlbertRepository implements AdminAlbertRepository {
  private readonly prisma: PrismaPilote;

  constructor({ prisma }: { prisma: PrismaPilote }) {
    this.prisma = prisma;
  }

  async listerConversations(
    params: ListerConversationsParams,
  ): Promise<ListerConversationsResult> {
    const db = this.prisma.getInstance();

    const offset = (params.page - 1) * params.taillePage;
    const recherchePattern = params.recherche
      ? `%${params.recherche.toLowerCase()}%`
      : null;

    const profilCodesArray =
      params.profilCodes && params.profilCodes.length > 0
        ? params.profilCodes
        : null;

    const orderBy = ((): Prisma.Sql => {
      const direction = params.tri.direction === "asc" ? Prisma.sql`ASC` : Prisma.sql`DESC`;
      if (params.tri.champ === "createdAt") {
        return Prisma.sql`c.created_at ${direction}, c.id ${direction}`;
      }
      return Prisma.sql`c.updated_at ${direction}, c.id ${direction}`;
    })();

    const lignes = await db.$queryRaw<LigneListe[]>(Prisma.sql`
      WITH base AS (
        SELECT
          c.id,
          c.titre,
          COALESCE(
            SUBSTRING((c.messages->0->'parts'->0->>'text'), 1, 160),
            ''
          ) AS extrait_premier_message_user,
          u.id AS utilisateur_id,
          u.prenom AS utilisateur_prenom,
          u.nom AS utilisateur_nom,
          u.email AS utilisateur_email,
          p.code AS profil_code,
          p.nom AS profil_nom,
          c.created_at,
          c.updated_at,
          EXISTS (
            SELECT 1 FROM llm_calls lc
            WHERE lc.chat_id = c.id::text AND lc.evaluation = 'POSITIVE'
          ) AS a_pouce,
          EXISTS (
            SELECT 1 FROM llm_calls lc
            WHERE lc.chat_id = c.id::text AND lc.evaluation = 'NEGATIVE'
          ) AS a_pouce_bas,
          EXISTS (
            SELECT 1 FROM llm_calls lc
            WHERE lc.chat_id = c.id::text AND lc.commentaire IS NOT NULL
          ) AS a_commentaire
        FROM chat_conversation c
        INNER JOIN utilisateur u ON u.id = c.utilisateur_id
        INNER JOIN profil p ON p.code = u.profil_code
      )
      SELECT
        b.*,
        COUNT(*) OVER () AS total
      FROM base b
      WHERE
        (${recherchePattern}::text IS NULL
          OR LOWER(b.titre) LIKE ${recherchePattern}
          OR LOWER(b.extrait_premier_message_user) LIKE ${recherchePattern})
        AND (${params.avecPouce ?? false}::boolean = false OR b.a_pouce = true)
        AND (${params.avecPouceBas ?? false}::boolean = false OR b.a_pouce_bas = true)
        AND (${params.avecCommentaire ?? false}::boolean = false OR b.a_commentaire = true)
        AND (${profilCodesArray}::text[] IS NULL OR b.profil_code = ANY(${profilCodesArray}::text[]))
      ORDER BY ${orderBy}
      LIMIT ${params.taillePage}
      OFFSET ${offset}
    `);

    const total = lignes.length > 0 ? Number(lignes[0].total) : 0;
    const items: ConversationAdminResume[] = lignes.map((ligne) => ({
      id: ligne.id,
      titre: ligne.titre,
      extraitPremierMessageUser: ligne.extrait_premier_message_user ?? "",
      utilisateur: {
        id: ligne.utilisateur_id,
        prenom: ligne.utilisateur_prenom,
        nom: ligne.utilisateur_nom,
        email: ligne.utilisateur_email,
        profilCode: ligne.profil_code,
        profilNom: ligne.profil_nom,
      },
      createdAt: ligne.created_at,
      updatedAt: ligne.updated_at,
      aPouce: ligne.a_pouce,
      aPouceBas: ligne.a_pouce_bas,
      aCommentaire: ligne.a_commentaire,
    }));

    return { total, items };
  }

  async recupererConversation(params: {
    id: string;
  }): Promise<ConversationAdminDetail | null> {
    const db = this.prisma.getInstance();

    const lignes = await db.$queryRaw<LigneDetail[]>(Prisma.sql`
      SELECT
        c.id,
        c.titre,
        c.messages,
        c.contexte,
        COALESCE(
          SUBSTRING((c.messages->0->'parts'->0->>'text'), 1, 160),
          ''
        ) AS extrait_premier_message_user,
        u.id AS utilisateur_id,
        u.prenom AS utilisateur_prenom,
        u.nom AS utilisateur_nom,
        u.email AS utilisateur_email,
        p.code AS profil_code,
        p.nom AS profil_nom,
        c.created_at,
        c.updated_at,
        EXISTS (SELECT 1 FROM llm_calls lc WHERE lc.chat_id = c.id::text AND lc.evaluation = 'POSITIVE') AS a_pouce,
        EXISTS (SELECT 1 FROM llm_calls lc WHERE lc.chat_id = c.id::text AND lc.evaluation = 'NEGATIVE') AS a_pouce_bas,
        EXISTS (SELECT 1 FROM llm_calls lc WHERE lc.chat_id = c.id::text AND lc.commentaire IS NOT NULL) AS a_commentaire,
        0::bigint AS total
      FROM chat_conversation c
      INNER JOIN utilisateur u ON u.id = c.utilisateur_id
      INNER JOIN profil p ON p.code = u.profil_code
      WHERE c.id = ${params.id}::uuid
      LIMIT 1
    `);

    if (lignes.length === 0) return null;
    const ligne = lignes[0];

    const llmCallsLignes = await db.$queryRaw<LigneLlmCall[]>(Prisma.sql`
      SELECT id, evaluation, commentaire, created_at
      FROM llm_calls
      WHERE chat_id = ${params.id}::text
      ORDER BY created_at ASC
    `);

    return {
      id: ligne.id,
      titre: ligne.titre,
      extraitPremierMessageUser: ligne.extrait_premier_message_user ?? "",
      utilisateur: {
        id: ligne.utilisateur_id,
        prenom: ligne.utilisateur_prenom,
        nom: ligne.utilisateur_nom,
        email: ligne.utilisateur_email,
        profilCode: ligne.profil_code,
        profilNom: ligne.profil_nom,
      },
      createdAt: ligne.created_at,
      updatedAt: ligne.updated_at,
      aPouce: ligne.a_pouce,
      aPouceBas: ligne.a_pouce_bas,
      aCommentaire: ligne.a_commentaire,
      messages: ligne.messages as unknown as PiloteUIMessage[],
      contexte: ligne.contexte as Record<string, unknown> | null,
      llmCalls: llmCallsLignes.map((row) => ({
        id: row.id,
        evaluation: row.evaluation,
        commentaire: row.commentaire,
        createdAt: row.created_at,
      })),
    };
  }
}
```

- [ ] **Step 2.4: Vérifier que ça compile**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 2.5: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: 0 erreur.

- [ ] **Step 2.6: Demander au user de lancer les tests d'intégration**

Demander : *"Peux-tu lancer `cd apps/pilote-ppg && pnpm test:server src/server/albert/__tests__/infrastructure/PrismaAdminAlbertRepository.integration.test.ts` ? Je m'attends à 8 tests verts."*

Si tests rouges, debug le repo / le SQL.

- [ ] **Step 2.7: Commit**

```bash
git add apps/pilote-ppg/src/server/albert/infrastructure/PrismaAdminAlbertRepository.ts \
        apps/pilote-ppg/src/server/albert/__tests__/infrastructure/PrismaAdminAlbertRepository.integration.test.ts
```

Invoquer `commit-billable` avec description : `PrismaAdminAlbertRepository avec agrégats feedback`. Catégorie : `feature`. Tags : `backend`, `database`, `tests`.

---

## Task 3: Use cases + DI module

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/usecases/ListerConversationsAdminUseCase.ts`
- Create: `apps/pilote-ppg/src/server/albert/usecases/RecupererConversationAdminUseCase.ts`
- Modify: `apps/pilote-ppg/src/server/albert/module.ts`

Les use cases sont des passe-plats (rien à valider de spécial : la garde profil est faite côté tRPC). Pas de tests dédiés — déjà couverts par les tests d'intégration du repo.

- [ ] **Step 3.1: Créer `ListerConversationsAdminUseCase`**

Contenu de `apps/pilote-ppg/src/server/albert/usecases/ListerConversationsAdminUseCase.ts` :

```typescript
import type { AdminAlbertRepository, ListerConversationsParams, ListerConversationsResult } from "@/server/albert/domain/AdminAlbertRepository";

export class ListerConversationsAdminUseCase {
  private readonly adminAlbertRepository: AdminAlbertRepository;

  constructor({ adminAlbertRepository }: { adminAlbertRepository: AdminAlbertRepository }) {
    this.adminAlbertRepository = adminAlbertRepository;
  }

  async execute(params: ListerConversationsParams): Promise<ListerConversationsResult> {
    return this.adminAlbertRepository.listerConversations(params);
  }
}
```

- [ ] **Step 3.2: Créer `RecupererConversationAdminUseCase`**

Contenu de `apps/pilote-ppg/src/server/albert/usecases/RecupererConversationAdminUseCase.ts` :

```typescript
import type { AdminAlbertRepository, ConversationAdminDetail } from "@/server/albert/domain/AdminAlbertRepository";

export class RecupererConversationAdminUseCase {
  private readonly adminAlbertRepository: AdminAlbertRepository;

  constructor({ adminAlbertRepository }: { adminAlbertRepository: AdminAlbertRepository }) {
    this.adminAlbertRepository = adminAlbertRepository;
  }

  async execute(params: { id: string }): Promise<ConversationAdminDetail | null> {
    return this.adminAlbertRepository.recupererConversation(params);
  }
}
```

- [ ] **Step 3.3: Câbler dans le module Albert**

Modifier `apps/pilote-ppg/src/server/albert/module.ts` :

1. Ajouter les imports en haut :

```typescript
import { ListerConversationsAdminUseCase } from "@/server/albert/usecases/ListerConversationsAdminUseCase";
import { RecupererConversationAdminUseCase } from "@/server/albert/usecases/RecupererConversationAdminUseCase";
import { PrismaAdminAlbertRepository } from "@/server/albert/infrastructure/PrismaAdminAlbertRepository";
import type { AdminAlbertRepository } from "@/server/albert/domain/AdminAlbertRepository";
```

2. Étendre `AlbertOwnCradle` :

```typescript
  adminAlbertRepository: AdminAlbertRepository;
  listerConversationsAdminUseCase: ListerConversationsAdminUseCase;
  recupererConversationAdminUseCase: RecupererConversationAdminUseCase;
```

3. Étendre `register` :

```typescript
      adminAlbertRepository: asModuleClass(PrismaAdminAlbertRepository),
      listerConversationsAdminUseCase: asModuleClass(ListerConversationsAdminUseCase),
      recupererConversationAdminUseCase: asModuleClass(RecupererConversationAdminUseCase),
```

- [ ] **Step 3.4: Vérifier que ça compile**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 3.5: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: 0 erreur.

- [ ] **Step 3.6: Commit**

```bash
git add apps/pilote-ppg/src/server/albert/usecases/ListerConversationsAdminUseCase.ts \
        apps/pilote-ppg/src/server/albert/usecases/RecupererConversationAdminUseCase.ts \
        apps/pilote-ppg/src/server/albert/module.ts
```

`commit-billable` : description `use cases admin Albert + DI`. Catégorie `feature`. Tags `backend`.

---

## Task 4: Sous-router tRPC `admin`

**Files:**
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/albert.ts`

- [ ] **Step 4.1: Ajouter le sous-router admin**

Modifier `apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/albert.ts`. Ajouter en haut les imports manquants :

```typescript
import { ProfilEnum } from "@/server/app/enum/profil.enum";
import { UnauthorizedError } from "@/server/app/error-boundary/unauthorized-error";
```

Avant la déclaration de `export const albertRouter`, ajouter :

```typescript
const adminRouter = créerRouteurTRPC({
  listerConversations: procédureProtégée
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        taillePage: z.number().int().min(1).max(100).default(25),
        recherche: z.string().trim().min(1).optional(),
        avecPouce: z.boolean().optional(),
        avecPouceBas: z.boolean().optional(),
        avecCommentaire: z.boolean().optional(),
        profilCodes: z.array(z.string()).optional(),
        triChamp: z.enum(["createdAt", "updatedAt"]).default("updatedAt"),
        triDirection: z.enum(["asc", "desc"]).default("desc"),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }
      const useCase = getContainer("albert").resolve(
        "listerConversationsAdminUseCase",
      );
      return useCase.execute({
        page: input.page,
        taillePage: input.taillePage,
        recherche: input.recherche,
        avecPouce: input.avecPouce,
        avecPouceBas: input.avecPouceBas,
        avecCommentaire: input.avecCommentaire,
        profilCodes: input.profilCodes,
        tri: { champ: input.triChamp, direction: input.triDirection },
      });
    }),

  recupererConversation: procédureProtégée
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      if (ctx.session.profil !== ProfilEnum.DITP_ADMIN) {
        throw new UnauthorizedError("Accès réservé aux administrateurs");
      }
      const useCase = getContainer("albert").resolve(
        "recupererConversationAdminUseCase",
      );
      return useCase.execute({ id: input.id });
    }),
});
```

Et ajouter à `albertRouter` :

```typescript
export const albertRouter = créerRouteurTRPC({
  evaluer: ...,
  conversations: conversationsRouter,
  admin: adminRouter,
});
```

- [ ] **Step 4.2: Vérifier compilation + lint**

Run:
```bash
cd apps/pilote-ppg && pnpm tsc --noEmit && pnpm lint
```
Expected: 0 erreur.

- [ ] **Step 4.3: Commit**

```bash
git add apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/albert.ts
```

`commit-billable` : description `route tRPC admin Albert avec garde DITP_ADMIN`. Catégorie `feature`. Tags `backend`, `api`.

---

## Task 5: Page `albert.tsx` — guard profil + tabs

**Files:**
- Modify: `apps/pilote-ppg/src/pages/panel-administrateur/albert.tsx`
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertPanel.tsx`

- [ ] **Step 5.1: Modifier `pages/panel-administrateur/albert.tsx`**

Remplacer intégralement le contenu par :

```tsx
import Head from "next/head";
import { GetServerSideProps } from "next";
import { auth } from "@/server/infrastructure/api/auth/[...nextauth]";
import { NextPanelAdministrateurLayout } from "@/components/PagePanelAdministrateur/PanelAdministrateurLayout/layout";
import { AlbertPanel } from "@/components/PagePanelAdministrateur/Albert/AlbertPanel";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await auth(context);
  const redirigerVersPageAccueil = {
    redirect: {
      destination: "/",
      permanent: false,
    },
  };

  if (!session) {
    return redirigerVersPageAccueil;
  }
  if (session.profil !== ProfilEnum.DITP_ADMIN) {
    return redirigerVersPageAccueil;
  }

  return { props: {} };
};

const NextPagePanelAdministrateurAlbert = () => {
  return (
    <>
      <Head>
        <title>Panel Administrateur - Albert - PILOTE</title>
      </Head>
      <NextPanelAdministrateurLayout pageActive="albert">
        <AlbertPanel />
      </NextPanelAdministrateurLayout>
    </>
  );
};

export default NextPagePanelAdministrateurAlbert;
```

- [ ] **Step 5.2: Créer `AlbertPanel.tsx`**

Contenu de `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertPanel.tsx` :

```tsx
import { useRouter } from "next/router";
import { useMemo } from "react";
import { NavigationTertiaire } from "@/components/_commons/NavigationTertiaire/NavigationTertiaire";
import { AlbertChat } from "@/components/PagePanelAdministrateur/Albert/AlbertChat";
import { AlbertDashboard } from "@/components/PagePanelAdministrateur/Albert/AlbertDashboard";

type Onglet = "discussion" | "dashboard";

const ITEMS = [
  { value: "discussion", label: "Discussion" },
  { value: "dashboard", label: "Dashboard" },
];

const isOnglet = (value: string): value is Onglet =>
  value === "discussion" || value === "dashboard";

export const AlbertPanel = () => {
  const router = useRouter();

  const ongletActif: Onglet = useMemo(() => {
    const queryParam = router.query.onglet;
    const valeur = Array.isArray(queryParam) ? queryParam[0] : queryParam;
    return valeur && isOnglet(valeur) ? valeur : "discussion";
  }, [router.query.onglet]);

  const changerOnglet = (valeur: string) => {
    if (!isOnglet(valeur)) return;
    router.replace(
      { pathname: router.pathname, query: { onglet: valeur } },
      undefined,
      { shallow: true },
    );
  };

  return (
    <div>
      <NavigationTertiaire
        items={ITEMS}
        onValueChange={changerOnglet}
        value={ongletActif}
      />
      <div className="!mt-6">
        {ongletActif === "discussion" ? <AlbertChat /> : <AlbertDashboard />}
      </div>
    </div>
  );
};
```

- [ ] **Step 5.3: Créer un placeholder temporaire pour AlbertDashboard**

Pour faire compiler immédiatement (sera remplacé en Task 8). Contenu de `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboard.tsx` :

```tsx
export const AlbertDashboard = () => {
  return <div>Dashboard en cours de construction…</div>;
};
```

- [ ] **Step 5.4: Vérifier compilation + lint**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit && pnpm lint`
Expected: 0 erreur.

- [ ] **Step 5.5: Commit**

```bash
git add apps/pilote-ppg/src/pages/panel-administrateur/albert.tsx \
        apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertPanel.tsx \
        apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboard.tsx
```

`commit-billable` : description `page Albert avec garde DITP_ADMIN + tabs Discussion/Dashboard`. Catégorie `feature`. Tags `frontend`.

---

## Task 6: Composant `AlbertDashboardFilters`

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboardFilters.tsx`

- [ ] **Step 6.1: Créer le composant**

Contenu :

```tsx
import { FormEvent, useState } from "react";
import { clsxm } from "@/utils/clsxm";
import { trpc } from "@/client/configuration/trpc/trpc";

export type FiltresDashboard = {
  recherche: string;
  avecPouce: boolean;
  avecPouceBas: boolean;
  avecCommentaire: boolean;
  profilCodes: string[];
};

export const FILTRES_VIDES: FiltresDashboard = {
  recherche: "",
  avecPouce: false,
  avecPouceBas: false,
  avecCommentaire: false,
  profilCodes: [],
};

type AlbertDashboardFiltersProps = {
  filtres: FiltresDashboard;
  onChange: (filtres: FiltresDashboard) => void;
};

export const AlbertDashboardFilters = ({
  filtres,
  onChange,
}: AlbertDashboardFiltersProps) => {
  const [rechercheLocale, setRechercheLocale] = useState(filtres.recherche);
  const { data: profils } = trpc.profil.lister.useQuery(undefined);

  const validerRecherche = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onChange({ ...filtres, recherche: rechercheLocale.trim() });
  };

  const toggleBooleen = (champ: "avecPouce" | "avecPouceBas" | "avecCommentaire") => {
    onChange({ ...filtres, [champ]: !filtres[champ] });
  };

  const reinitialiser = () => {
    setRechercheLocale("");
    onChange(FILTRES_VIDES);
  };

  const toggleProfil = (code: string) => {
    const actuel = filtres.profilCodes;
    const suivant = actuel.includes(code)
      ? actuel.filter((c) => c !== code)
      : [...actuel, code];
    onChange({ ...filtres, profilCodes: suivant });
  };

  return (
    <div className="!mb-4 flex flex-wrap items-center gap-3">
      <form className="flex items-center gap-2" onSubmit={validerRecherche}>
        <input
          className="!border !border-gray-300 !rounded-md !px-3 !py-2 !text-sm !w-72"
          onChange={(event) => setRechercheLocale(event.target.value)}
          placeholder="Rechercher dans le titre ou le 1er message"
          type="search"
          value={rechercheLocale}
        />
        <button
          className="!px-3 !py-2 !text-sm !rounded-md !bg-dsfr-blue-france-sun-113 !text-white"
          type="submit"
        >
          Rechercher
        </button>
      </form>

      {(
        [
          { champ: "avecPouce" as const, label: "👍" },
          { champ: "avecPouceBas" as const, label: "👎" },
          { champ: "avecCommentaire" as const, label: "💬" },
        ]
      ).map(({ champ, label }) => (
        <button
          aria-pressed={filtres[champ]}
          className={clsxm(
            "!px-3 !py-2 !text-sm !rounded-md !border",
            filtres[champ]
              ? "!bg-dsfr-blue-france-sun-113 !text-white !border-dsfr-blue-france-sun-113"
              : "!bg-white !text-gray-700 !border-gray-300",
          )}
          key={champ}
          onClick={() => toggleBooleen(champ)}
          type="button"
        >
          {label}
        </button>
      ))}

      {profils && profils.length > 0 && (
        <details className="!relative">
          <summary className="!cursor-pointer !px-3 !py-2 !text-sm !rounded-md !border !border-gray-300 !list-none">
            Profils {filtres.profilCodes.length > 0 && `(${filtres.profilCodes.length})`}
          </summary>
          <div className="!absolute !z-10 !mt-1 !p-3 !bg-white !border !border-gray-200 !rounded-md !shadow-md !max-h-72 !overflow-y-auto !w-64">
            {profils.map((profil) => (
              <label className="!flex !items-center !gap-2 !text-sm !py-1" key={profil.code}>
                <input
                  checked={filtres.profilCodes.includes(profil.code)}
                  onChange={() => toggleProfil(profil.code)}
                  type="checkbox"
                />
                {profil.nom}
              </label>
            ))}
          </div>
        </details>
      )}

      <button
        className="!px-3 !py-2 !text-sm !rounded-md !text-gray-700 !underline"
        onClick={reinitialiser}
        type="button"
      >
        Réinitialiser
      </button>
    </div>
  );
};
```

**Note** : si la procédure `trpc.profil.lister` n'existe pas avec cette signature, vérifier dans `src/server/infrastructure/api/trpc/routes/profil.ts` la procédure exacte et adapter l'appel (`lister` ou `listerTousLesProfils` ou équivalent). Si elle n'expose pas `code`/`nom`, mapper en conséquence.

- [ ] **Step 6.2: Vérifier compilation + lint**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit && pnpm lint`
Expected: 0 erreur. Si l'appel `trpc.profil.lister` n'existe pas, lire le fichier `profil.ts` du router et corriger.

- [ ] **Step 6.3: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboardFilters.tsx
```

`commit-billable` : description `barre filtres dashboard Albert`. Catégorie `feature`. Tags `frontend`.

---

## Task 7: Composant `AlbertDashboardTable`

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboardTable.tsx`

- [ ] **Step 7.1: Créer le composant**

Contenu :

```tsx
import { clsxm } from "@/utils/clsxm";
import type { inferRouterOutputs } from "@trpc/server";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";

type ListerOutput =
  inferRouterOutputs<typeof appRouter>["albert"]["admin"]["listerConversations"];
type LigneConversation = ListerOutput["items"][number];

export type TriDashboard = {
  champ: "createdAt" | "updatedAt";
  direction: "asc" | "desc";
};

type AlbertDashboardTableProps = {
  conversations: LigneConversation[];
  total: number;
  page: number;
  taillePage: number;
  tri: TriDashboard;
  enChargement: boolean;
  onPageChange: (page: number) => void;
  onTriChange: (tri: TriDashboard) => void;
  onLigneClick: (id: string) => void;
};

const formatterDateCourte = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", { dateStyle: "short" }).format(date);

const ColonneTri = ({
  champ,
  tri,
  label,
  onTriChange,
}: {
  champ: "createdAt" | "updatedAt";
  tri: TriDashboard;
  label: string;
  onTriChange: (tri: TriDashboard) => void;
}) => {
  const estActif = tri.champ === champ;
  return (
    <button
      className="!flex !items-center !gap-1 !text-left !font-semibold"
      onClick={() =>
        onTriChange({
          champ,
          direction:
            estActif && tri.direction === "desc" ? "asc" : "desc",
        })
      }
      type="button"
    >
      {label}
      {estActif && (tri.direction === "desc" ? " ↓" : " ↑")}
    </button>
  );
};

const Pastille = ({ actif }: { actif: boolean }) =>
  actif ? <span className="!text-green-600">✓</span> : <span className="!text-gray-300">—</span>;

export const AlbertDashboardTable = ({
  conversations,
  total,
  page,
  taillePage,
  tri,
  enChargement,
  onPageChange,
  onTriChange,
  onLigneClick,
}: AlbertDashboardTableProps) => {
  const debut = total === 0 ? 0 : (page - 1) * taillePage + 1;
  const fin = Math.min(page * taillePage, total);
  const nbPages = Math.max(1, Math.ceil(total / taillePage));

  if (!enChargement && conversations.length === 0) {
    return (
      <div className="!p-10 !text-center !text-gray-500 !border !border-gray-200 !rounded-md">
        Aucune conversation pour ces filtres
      </div>
    );
  }

  return (
    <div>
      <div className="!overflow-x-auto !border !border-gray-200 !rounded-md">
        <table className="!w-full !text-sm">
          <thead className="!bg-gray-50">
            <tr>
              <th className="!text-left !px-4 !py-2">Conversation</th>
              <th className="!text-left !px-4 !py-2">Utilisateur</th>
              <th className="!text-left !px-4 !py-2">Profil</th>
              <th className="!text-left !px-4 !py-2">
                <ColonneTri champ="createdAt" label="Créé le" onTriChange={onTriChange} tri={tri} />
              </th>
              <th className="!text-left !px-4 !py-2">
                <ColonneTri champ="updatedAt" label="MAJ" onTriChange={onTriChange} tri={tri} />
              </th>
              <th className="!text-center !px-4 !py-2">👍</th>
              <th className="!text-center !px-4 !py-2">👎</th>
              <th className="!text-center !px-4 !py-2">💬</th>
            </tr>
          </thead>
          <tbody>
            {conversations.map((conversation) => (
              <tr
                className={clsxm(
                  "!border-t !border-gray-200 !cursor-pointer hover:!bg-gray-50",
                  enChargement && "!opacity-60",
                )}
                key={conversation.id}
                onClick={() => onLigneClick(conversation.id)}
              >
                <td className="!px-4 !py-3">
                  <div className="!font-medium !text-gray-900">
                    {conversation.titre || "Sans titre"}
                  </div>
                  {conversation.extraitPremierMessageUser && (
                    <div className="!text-xs !text-gray-500 !mt-1 !line-clamp-1">
                      {conversation.extraitPremierMessageUser}
                    </div>
                  )}
                </td>
                <td className="!px-4 !py-3">
                  <div>
                    {conversation.utilisateur.prenom} {conversation.utilisateur.nom}
                  </div>
                  <div className="!text-xs !text-gray-500">
                    {conversation.utilisateur.email}
                  </div>
                </td>
                <td className="!px-4 !py-3">
                  <span className="!inline-block !px-2 !py-1 !text-xs !bg-gray-100 !rounded">
                    {conversation.utilisateur.profilNom}
                  </span>
                </td>
                <td className="!px-4 !py-3 !whitespace-nowrap">
                  {formatterDateCourte(conversation.createdAt)}
                </td>
                <td className="!px-4 !py-3 !whitespace-nowrap">
                  {formatterDateCourte(conversation.updatedAt)}
                </td>
                <td className="!px-4 !py-3 !text-center">
                  <Pastille actif={conversation.aPouce} />
                </td>
                <td className="!px-4 !py-3 !text-center">
                  <Pastille actif={conversation.aPouceBas} />
                </td>
                <td className="!px-4 !py-3 !text-center">
                  <Pastille actif={conversation.aCommentaire} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="!flex !items-center !justify-between !mt-4 !text-sm !text-gray-600">
        <span>
          {debut} – {fin} sur {total}
        </span>
        <div className="!flex !gap-2">
          <button
            className="!px-3 !py-1 !border !border-gray-300 !rounded-md disabled:!opacity-50"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            Précédent
          </button>
          <span>
            Page {page} / {nbPages}
          </span>
          <button
            className="!px-3 !py-1 !border !border-gray-300 !rounded-md disabled:!opacity-50"
            disabled={page >= nbPages}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            Suivant
          </button>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 7.2: Vérifier compilation + lint**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit && pnpm lint`
Expected: 0 erreur.

- [ ] **Step 7.3: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboardTable.tsx
```

`commit-billable` : description `tableau dashboard Albert + pagination + tri`. Catégorie `feature`. Tags `frontend`.

---

## Task 8: Composant `AlbertDashboard` (orchestrateur)

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboard.tsx` (remplace le placeholder)

- [ ] **Step 8.1: Remplacer le placeholder**

Contenu :

```tsx
import { useState } from "react";
import { trpc } from "@/client/configuration/trpc/trpc";
import {
  AlbertDashboardFilters,
  FILTRES_VIDES,
  type FiltresDashboard,
} from "@/components/PagePanelAdministrateur/Albert/AlbertDashboardFilters";
import {
  AlbertDashboardTable,
  type TriDashboard,
} from "@/components/PagePanelAdministrateur/Albert/AlbertDashboardTable";
import { ConversationDetailModale } from "@/components/PagePanelAdministrateur/Albert/ConversationDetailModale";

const TAILLE_PAGE = 25;

export const AlbertDashboard = () => {
  const [filtres, setFiltres] = useState<FiltresDashboard>(FILTRES_VIDES);
  const [page, setPage] = useState(1);
  const [tri, setTri] = useState<TriDashboard>({
    champ: "updatedAt",
    direction: "desc",
  });
  const [conversationOuverteId, setConversationOuverteId] = useState<string | null>(null);

  const { data, isLoading } = trpc.albert.admin.listerConversations.useQuery({
    page,
    taillePage: TAILLE_PAGE,
    recherche: filtres.recherche || undefined,
    avecPouce: filtres.avecPouce || undefined,
    avecPouceBas: filtres.avecPouceBas || undefined,
    avecCommentaire: filtres.avecCommentaire || undefined,
    profilCodes: filtres.profilCodes.length > 0 ? filtres.profilCodes : undefined,
    triChamp: tri.champ,
    triDirection: tri.direction,
  });

  const changerFiltres = (nouveauxFiltres: FiltresDashboard) => {
    setFiltres(nouveauxFiltres);
    setPage(1);
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-1">Dashboard Albert</h2>
      <p className="text-sm text-gray-500 mb-4">
        Liste de toutes les conversations Albert et leurs feedbacks.
      </p>

      <AlbertDashboardFilters filtres={filtres} onChange={changerFiltres} />

      <AlbertDashboardTable
        conversations={data?.items ?? []}
        enChargement={isLoading}
        onLigneClick={setConversationOuverteId}
        onPageChange={setPage}
        onTriChange={(nouveauTri) => {
          setTri(nouveauTri);
          setPage(1);
        }}
        page={page}
        taillePage={TAILLE_PAGE}
        total={data?.total ?? 0}
        tri={tri}
      />

      {conversationOuverteId && (
        <ConversationDetailModale
          id={conversationOuverteId}
          onClose={() => setConversationOuverteId(null)}
        />
      )}
    </div>
  );
};
```

- [ ] **Step 8.2: Vérifier compilation**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit`
Expected: erreur "Cannot find module … ConversationDetailModale" — c'est attendu (créé en Task 9). Ne pas commit avant Task 9.

---

## Task 9: Modale + transcript

**Files:**
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/ConversationDetailModale.tsx`
- Create: `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/ConversationTranscript.tsx`

- [ ] **Step 9.1: Créer `ConversationTranscript`**

Contenu de `apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/ConversationTranscript.tsx` :

```tsx
import type { inferRouterOutputs } from "@trpc/server";
import type { appRouter } from "@/server/infrastructure/api/trpc/routes/routes";
import { AssistantMessageText } from "@/components/_commons/ChatUI/AssistantMessageText";
import { clsxm } from "@/utils/clsxm";

type DetailConversation = NonNullable<
  inferRouterOutputs<typeof appRouter>["albert"]["admin"]["recupererConversation"]
>;
type LlmCall = DetailConversation["llmCalls"][number];

type MessagePart = { type: string; text?: string };
type UIMessageMinimal = { id?: string; role: "user" | "assistant" | "system"; parts: MessagePart[] };

const extraireTexte = (message: UIMessageMinimal): string =>
  message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text ?? "")
    .join("\n");

const BadgeEvaluation = ({ llmCall }: { llmCall: LlmCall }) => {
  if (!llmCall.evaluation) return null;
  return (
    <span
      className={clsxm(
        "!inline-block !px-2 !py-0.5 !rounded !text-xs !font-medium",
        llmCall.evaluation === "POSITIVE"
          ? "!bg-green-100 !text-green-800"
          : "!bg-red-100 !text-red-800",
      )}
    >
      {llmCall.evaluation === "POSITIVE" ? "👍 Positif" : "👎 Négatif"}
    </span>
  );
};

type ConversationTranscriptProps = {
  messages: DetailConversation["messages"];
  llmCalls: LlmCall[];
};

export const ConversationTranscript = ({
  messages,
  llmCalls,
}: ConversationTranscriptProps) => {
  let indexAssistant = 0;
  const messagesNormalises = messages as unknown as UIMessageMinimal[];

  return (
    <div className="!space-y-4">
      {messagesNormalises.map((message, index) => {
        if (message.role === "user") {
          return (
            <div className="!flex !justify-end" key={message.id ?? index}>
              <div className="!max-w-[80%] !bg-dsfr-blue-france-sun-113 !text-white !rounded-lg !px-4 !py-2 !text-sm">
                {extraireTexte(message)}
              </div>
            </div>
          );
        }
        if (message.role === "assistant") {
          const llmCall = llmCalls[indexAssistant];
          indexAssistant += 1;
          const texte = extraireTexte(message);
          return (
            <div className="!flex !flex-col !gap-2" key={message.id ?? index}>
              <div className="!flex !items-start !gap-2">
                <div className="!flex-1 !bg-gray-50 !rounded-lg !px-4 !py-3 !text-sm">
                  <AssistantMessageText content={texte} />
                </div>
                {llmCall && <BadgeEvaluation llmCall={llmCall} />}
              </div>
              {llmCall?.commentaire && (
                <blockquote className="!ml-4 !border-l-4 !border-gray-300 !pl-3 !text-sm !text-gray-700 !italic">
                  <div className="!text-xs !font-semibold !text-gray-500 !mb-1 !not-italic">
                    Commentaire de l'utilisateur
                  </div>
                  {llmCall.commentaire}
                </blockquote>
              )}
            </div>
          );
        }
        return null;
      })}
    </div>
  );
};
```

**Note** : la signature de `AssistantMessageText` doit être vérifiée. Si elle attend une autre prop (`text` au lieu de `content`, ou un objet message complet), adapter l'appel en lisant `apps/pilote-ppg/src/client/components/_commons/ChatUI/AssistantMessageText.tsx`.

- [ ] **Step 9.2: Créer `ConversationDetailModale`**

Contenu :

```tsx
import { useEffect } from "react";
import { trpc } from "@/client/configuration/trpc/trpc";
import { ConversationTranscript } from "@/components/PagePanelAdministrateur/Albert/ConversationTranscript";

type ConversationDetailModaleProps = {
  id: string;
  onClose: () => void;
};

const formatterDateLongue = (date: Date) =>
  new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "long",
    timeStyle: "short",
  }).format(date);

export const ConversationDetailModale = ({
  id,
  onClose,
}: ConversationDetailModaleProps) => {
  const { data, isLoading } = trpc.albert.admin.recupererConversation.useQuery({ id });

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const nbPouce = data?.llmCalls.filter((call) => call.evaluation === "POSITIVE").length ?? 0;
  const nbPouceBas = data?.llmCalls.filter((call) => call.evaluation === "NEGATIVE").length ?? 0;

  return (
    <div
      aria-modal="true"
      className="!fixed !inset-0 !z-50 !flex !items-center !justify-center !bg-black/40 !p-4"
      onClick={onClose}
      role="dialog"
    >
      <div
        className="!bg-white !rounded-lg !shadow-xl !w-full !max-w-3xl !max-h-[90vh] !flex !flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="!flex !items-start !justify-between !border-b !border-gray-200 !px-6 !py-4">
          <div className="!min-w-0">
            <h3 className="!text-lg !font-bold !text-gray-900 !truncate">
              {data?.titre || "Sans titre"}
            </h3>
            {data && (
              <>
                <div className="!text-sm !text-gray-600 !mt-1">
                  {data.utilisateur.prenom} {data.utilisateur.nom} ·{" "}
                  <span className="!text-gray-500">{data.utilisateur.email}</span> ·{" "}
                  <span className="!inline-block !px-2 !py-0.5 !text-xs !bg-gray-100 !rounded">
                    {data.utilisateur.profilNom}
                  </span>
                </div>
                <div className="!text-xs !text-gray-500 !mt-2">
                  Créé le {formatterDateLongue(data.createdAt)} · Mis à jour le{" "}
                  {formatterDateLongue(data.updatedAt)} · {data.llmCalls.length} tour(s) ·{" "}
                  {nbPouce} 👍 · {nbPouceBas} 👎
                </div>
              </>
            )}
          </div>
          <button
            aria-label="Fermer"
            className="!ml-4 !text-gray-500 hover:!text-gray-700 !text-2xl !leading-none"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>

        <div className="!overflow-y-auto !p-6 !flex-1">
          {isLoading && <div className="!text-gray-500">Chargement…</div>}
          {!isLoading && !data && (
            <div className="!text-gray-500">Conversation introuvable.</div>
          )}
          {!isLoading && data && (
            <ConversationTranscript
              llmCalls={data.llmCalls}
              messages={data.messages}
            />
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 9.3: Vérifier compilation + lint**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit && pnpm lint`
Expected: 0 erreur.

- [ ] **Step 9.4: Commit (groupé avec Task 8)**

```bash
git add apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/AlbertDashboard.tsx \
        apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/ConversationDetailModale.tsx \
        apps/pilote-ppg/src/client/components/PagePanelAdministrateur/Albert/ConversationTranscript.tsx
```

`commit-billable` : description `dashboard Albert + modale conversation avec feedbacks`. Catégorie `feature`. Tags `frontend`.

---

## Task 10: Vérification finale

- [ ] **Step 10.1: Lint global**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: 0 erreur.

- [ ] **Step 10.2: Type-check global**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 10.3: Demander au user de lancer les tests serveur**

Demander : *"Peux-tu lancer `cd apps/pilote-ppg && pnpm test:server src/server/albert/__tests__/infrastructure/PrismaAdminAlbertRepository.integration.test.ts` ? J'attends 8 tests verts."*

- [ ] **Step 10.4: Demander au user de tester en navigateur**

Demander : *"Peux-tu lancer `pnpm dev` et naviguer vers `/panel-administrateur/albert` ? À tester :
- Onglet Discussion fonctionne comme avant
- Bascule vers onglet Dashboard : URL devient `?onglet=dashboard`
- Liste affiche les conversations
- Filtre 👍 / 👎 / 💬 réduit la liste
- Recherche texte filtre
- Filtre profil multi-select fonctionne
- Tri Créé le / MAJ inverse l'ordre
- Pagination Précédent/Suivant
- Clic ligne ouvre modale avec transcript + badges + commentaires
- Échap ferme la modale
- Un compte non DITP_ADMIN est redirigé vers /"*

- [ ] **Step 10.5: Push de la branche pour ouvrir la PR**

Une fois user OK :
```bash
git push -u origin PIL-1518-liste-des-conversations
```

Ne pas créer la PR automatiquement — laisser le user décider du moment.

---

## Self-review checklist (à effectuer après écriture du plan)

- [x] Couverture spec : nav tabs ✓ (Task 5), liste tableau ✓ (Tasks 7-8), filtres ✓ (Task 6), modale détail ✓ (Task 9), use cases admin ✓ (Tasks 1-3), garde DITP_ADMIN front + back ✓ (Tasks 4-5), tri + pagination ✓ (Tasks 4-7-8).
- [x] Pas de placeholder type "TBD/à compléter".
- [x] Tous les chemins de fichiers sont absolus relatifs au repo.
- [x] Types cohérents entre tasks : `ConversationAdminResume`/`Detail`, `ListerConversationsParams`, `TriDashboard`, `FiltresDashboard` — chaque type est défini une fois et réutilisé.
- [x] Pas de tests front (conforme memory).
- [x] Commits via skill `commit-billable` à chaque étape (conforme memory).
- [x] Cas non-couverts du spec :
  - Restriction du menu latéral pour cacher Albert aux non-admins : non traité, considéré hors scope (garde côté page suffit, et c'est un pattern adjacent au panel admin global). À mentionner dans la PR.
  - Match `llm_calls` ↔ messages assistant par ordre : implémenté dans `ConversationTranscript` (compteur `indexAssistant`).
