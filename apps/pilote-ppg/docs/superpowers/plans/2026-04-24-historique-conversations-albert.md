# Historique des conversations Albert — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre à un utilisateur d'Albert de lister ses conversations passées, de revenir sur l'une d'elles (avec ses messages complets reconstruits), et de démarrer une nouvelle conversation. Rétention fixée à 14 jours.

**Architecture:** Nouvelle table Prisma `chat_conversation` qui stocke, par conversation et par utilisateur, le blob JSON complet des `PiloteUIMessage[]`. La route `/api/albert/chat` persiste après chaque tour (via `onFinish` de `toUIMessageStreamResponse`). Un routeur tRPC `albert.conversations.*` expose la liste / récupération / suppression. Côté front, un tiroir listant les conversations + bouton « Nouvelle conversation » remonte le `Chat<PiloteUIMessage>` avec un nouvel id ou avec les messages rechargés. Un script cron purge tout ce qui a plus de 14 jours.

**Tech Stack:** Prisma 6 + PostgreSQL (JSONB) + tRPC + NextAuth + Vercel AI SDK (`streamText`, `toUIMessageStreamResponse`, `useChat`) + pattern cron existant (`scripts/run_rapport_*.sh`).

**Décisions clés :**
- **Un seul blob `messages` JSONB** par conversation (option la plus simple, cf. discussion produit). Pas de table `chat_message` normalisée tant qu'il n'y a pas besoin de recherche full-text.
- `llm_calls` **reste en place** (audit LLM brut) et on ne modifie pas sa politique de rétention dans ce plan.
- Rétention **14 jours** sur `chat_conversation` (assez court pour du POC, confortable côté volume : steady state ≈ 25-45 MB).
- Titre dérivé : 80 premiers caractères du premier message user.
- Le tiroir est accessible uniquement depuis la modale de `BoutonSyntheseTerritoire` (V1) — on ne refait pas une page dédiée.

---

## File Structure

### Serveur

- **Create** `src/database/prisma/migrations/<timestamp>_add_chat_conversation/migration.sql` — migration Prisma.
- **Modify** `src/database/prisma/schema.prisma` — modèle `chat_conversation`.
- **Create** `src/server/albert/domain/ChatConversation.ts` — type domaine.
- **Create** `src/server/albert/domain/ChatConversationRepository.ts` — interface.
- **Create** `src/server/albert/infrastructure/PrismaChatConversationRepository.ts` — impl Prisma.
- **Create** `src/server/albert/usecases/ListerConversationsUseCase.ts`
- **Create** `src/server/albert/usecases/RecupererConversationUseCase.ts`
- **Create** `src/server/albert/usecases/SupprimerConversationUseCase.ts`
- **Create** `src/server/albert/usecases/EnregistrerConversationUseCase.ts` (upsert du blob après `onFinish`).
- **Create** `src/server/albert/usecases/PurgerConversationsExpireesUseCase.ts`
- **Modify** `src/server/albert/module.ts` — enregistrer les 4 use cases + repository.
- **Modify** `src/app/api/albert/chat/route.ts` — brancher `EnregistrerConversationUseCase` dans `onFinish`.
- **Modify** `src/server/infrastructure/api/trpc/routes/albert.ts` (ou nouveau `conversation.ts` colocalisé) — sous-router `conversations`.
- **Create** `scripts/purgerConversationsAlbert.ts` + `scripts/run_purge_conversations_albert.sh` — job cron.
- **Modify** `cron.json` — planifier le job.
- **Modify** `src/config.ts` — variable `NEXT_PUBLIC_FF_HISTORIQUE_ALBERT` (feature flag progressif).
- **Create** `docs/architecture/decisions/000X-stockage-blob-conversations-albert.md` — ADR FR justifiant le choix du JSONB unique.

### Client

- **Create** `src/client/components/_commons/ChatUI/ConversationHistoryDrawer.tsx` — tiroir latéral.
- **Create** `src/client/components/_commons/ChatUI/useConversationHistory.ts` — hook qui gère current conversation id + callbacks.
- **Modify** `src/client/components/_commons/ChatUI/ChatUI.tsx` — accepte `conversationId` contrôlé depuis l'extérieur, initialise le `Chat<PiloteUIMessage>` avec les messages rechargés, expose un callback `onMessagesChange`.
- **Modify** `src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx` — embarque le drawer + bouton "Nouvelle conversation" + gère le `conversationId` courant.

### Tests

- `src/server/albert/__tests__/usecases/EnregistrerConversationUseCase.test.ts` (unitaire — titre dérivé, no-op si messages vides)
- `src/server/albert/__tests__/usecases/ListerConversationsUseCase.integration.test.ts`
- `src/server/albert/__tests__/usecases/PurgerConversationsExpireesUseCase.integration.test.ts`
- `src/server/albert/__tests__/infrastructure/PrismaChatConversationRepository.integration.test.ts`

---

## Task 1: Migration Prisma `chat_conversation`

**Files:**
- Modify: `apps/pilote-ppg/src/database/prisma/schema.prisma`

- [ ] **Step 1: Ajouter le modèle Prisma**

Ajouter dans `schema.prisma` (à la fin des modèles `public`) :

```prisma
model chat_conversation {
  id                  String   @id @default(dbgenerated("gen_random_uuid()")) @db.Uuid
  utilisateur_id      String   @db.Uuid
  titre               String
  messages            Json
  territoire_code     String?
  jalon               Int?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  @@index([utilisateur_id, updated_at(sort: Desc)])
  @@index([updated_at])
  @@schema("public")
}
```

- [ ] **Step 2: Générer la migration**

Run: `cd apps/pilote-ppg && pnpm prisma migrate dev --name add_chat_conversation`
Expected: création d'un dossier de migration avec un `migration.sql` contenant `CREATE TABLE "public"."chat_conversation"`.

- [ ] **Step 3: Vérifier la migration SQL**

Run: `cat apps/pilote-ppg/src/database/prisma/migrations/*add_chat_conversation*/migration.sql`
Expected: le SQL contient `gen_random_uuid()`, `JSONB`, et les deux index.

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/src/database/prisma/schema.prisma apps/pilote-ppg/src/database/prisma/migrations
git commit -m "feat(llm): ajoute la table chat_conversation (historique)"
```

---

## Task 2: Domaine et repository

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/domain/ChatConversation.ts`
- Create: `apps/pilote-ppg/src/server/albert/domain/ChatConversationRepository.ts`

- [ ] **Step 1: Type domaine**

```typescript
// ChatConversation.ts
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";

export type ChatConversation = {
  id: string;
  utilisateurId: string;
  titre: string;
  messages: PiloteUIMessage[];
  territoireCode: string | null;
  jalon: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type ChatConversationResume = Omit<ChatConversation, "messages">;

const LONGUEUR_MAX_TITRE = 80;

export function deriverTitre(messages: PiloteUIMessage[]): string {
  const premierUser = messages.find((message) => message.role === "user");
  if (!premierUser) return "Nouvelle conversation";

  const texte = (premierUser.parts ?? [])
    .filter((part): part is { type: "text"; text: string } => part.type === "text")
    .map((part) => part.text)
    .join(" ")
    .trim();

  if (texte.length === 0) return "Nouvelle conversation";
  return texte.length > LONGUEUR_MAX_TITRE
    ? `${texte.slice(0, LONGUEUR_MAX_TITRE - 1)}…`
    : texte;
}
```

- [ ] **Step 2: Interface repository**

```typescript
// ChatConversationRepository.ts
import type { ChatConversation, ChatConversationResume } from "./ChatConversation";

export interface ChatConversationRepository {
  upsert(params: {
    id: string;
    utilisateurId: string;
    titre: string;
    messages: unknown;
    territoireCode: string | null;
    jalon: number | null;
  }): Promise<void>;

  recupererParId(params: {
    id: string;
    utilisateurId: string;
  }): Promise<ChatConversation | null>;

  listerPourUtilisateur(params: {
    utilisateurId: string;
    limite: number;
  }): Promise<ChatConversationResume[]>;

  supprimer(params: { id: string; utilisateurId: string }): Promise<void>;

  supprimerExpirees(params: { anterieurA: Date }): Promise<number>;
}
```

- [ ] **Step 3: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: OK.

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/src/server/albert/domain
git commit -m "feat(llm): ajoute le domaine ChatConversation"
```

---

## Task 3: Implémentation Prisma du repository

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/infrastructure/PrismaChatConversationRepository.ts`
- Create: `apps/pilote-ppg/src/server/albert/__tests__/infrastructure/PrismaChatConversationRepository.integration.test.ts`

- [ ] **Step 1: Test d'intégration (TDD)**

```typescript
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaChatConversationRepository } from "@/server/albert/infrastructure/PrismaChatConversationRepository";

describe("PrismaChatConversationRepository", () => {
  it(
    "upsert puis recupererParId doit retourner la conversation",
    createIntegrationTest(async (tx) => {
      const utilisateur = await fixtures.utilisateur({});
      const repository = new PrismaChatConversationRepository({ prisma: tx });
      const id = crypto.randomUUID();

      // Given
      await repository.upsert({
        id,
        utilisateurId: utilisateur.id,
        titre: "Synthèse Bretagne",
        messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "hello" }] }],
        territoireCode: "REG-53",
        jalon: 2025,
      });

      // When
      const result = await repository.recupererParId({ id, utilisateurId: utilisateur.id });

      // Then
      expect(result).toEqual({
        id,
        utilisateurId: utilisateur.id,
        titre: "Synthèse Bretagne",
        messages: [{ id: "m1", role: "user", parts: [{ type: "text", text: "hello" }] }],
        territoireCode: "REG-53",
        jalon: 2025,
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date),
      });
    }),
  );

  it(
    "listerPourUtilisateur ne renvoie que les conversations de l'utilisateur, tri par updated_at desc, sans le blob messages",
    createIntegrationTest(async (tx) => {
      // Given : 2 utilisateurs, 3 conversations
      const utilA = await fixtures.utilisateur({});
      const utilB = await fixtures.utilisateur({});
      const repository = new PrismaChatConversationRepository({ prisma: tx });

      await repository.upsert({ id: crypto.randomUUID(), utilisateurId: utilA.id, titre: "A-1", messages: [], territoireCode: null, jalon: null });
      await repository.upsert({ id: crypto.randomUUID(), utilisateurId: utilA.id, titre: "A-2", messages: [], territoireCode: null, jalon: null });
      await repository.upsert({ id: crypto.randomUUID(), utilisateurId: utilB.id, titre: "B-1", messages: [], territoireCode: null, jalon: null });

      // When
      const resultats = await repository.listerPourUtilisateur({ utilisateurId: utilA.id, limite: 10 });

      // Then
      expect(resultats).toEqual([
        expect.objectContaining({ titre: "A-2" }),
        expect.objectContaining({ titre: "A-1" }),
      ]);
      expect(resultats[0]).not.toHaveProperty("messages");
    }),
  );

  it(
    "supprimer retire la conversation mais uniquement si elle appartient à l'utilisateur",
    createIntegrationTest(async (tx) => {
      const utilA = await fixtures.utilisateur({});
      const utilB = await fixtures.utilisateur({});
      const repository = new PrismaChatConversationRepository({ prisma: tx });
      const id = crypto.randomUUID();

      await repository.upsert({ id, utilisateurId: utilA.id, titre: "X", messages: [], territoireCode: null, jalon: null });

      await repository.supprimer({ id, utilisateurId: utilB.id });
      expect(await repository.recupererParId({ id, utilisateurId: utilA.id })).not.toBeNull();

      await repository.supprimer({ id, utilisateurId: utilA.id });
      expect(await repository.recupererParId({ id, utilisateurId: utilA.id })).toBeNull();
    }),
  );

  it(
    "supprimerExpirees supprime uniquement ce qui est plus ancien que la date passée",
    createIntegrationTest(async (tx) => {
      const utilisateur = await fixtures.utilisateur({});
      const repository = new PrismaChatConversationRepository({ prisma: tx });

      const idAncien = crypto.randomUUID();
      await repository.upsert({ id: idAncien, utilisateurId: utilisateur.id, titre: "ancien", messages: [], territoireCode: null, jalon: null });
      await tx.chat_conversation.update({
        where: { id: idAncien },
        data: { updated_at: new Date("2025-01-01") },
      });

      const idRecent = crypto.randomUUID();
      await repository.upsert({ id: idRecent, utilisateurId: utilisateur.id, titre: "recent", messages: [], territoireCode: null, jalon: null });

      const nombre = await repository.supprimerExpirees({ anterieurA: new Date("2025-06-01") });

      expect(nombre).toEqual(1);
      expect(await repository.recupererParId({ id: idAncien, utilisateurId: utilisateur.id })).toBeNull();
      expect(await repository.recupererParId({ id: idRecent, utilisateurId: utilisateur.id })).not.toBeNull();
    }),
  );
});
```

- [ ] **Step 2: Run test — doit échouer**

Expected: erreurs de compilation (le repository n'existe pas encore).

- [ ] **Step 3: Implémenter le repository**

```typescript
import type { PrismaPilote } from "@/server/db/PrismaPilote";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import type {
  ChatConversation,
  ChatConversationResume,
} from "@/server/albert/domain/ChatConversation";
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";

export class PrismaChatConversationRepository
  implements ChatConversationRepository
{
  constructor(private readonly deps: { prisma: PrismaPilote }) {}

  private db() {
    return this.deps.prisma.getInstance?.() ?? this.deps.prisma;
  }

  async upsert(params: {
    id: string;
    utilisateurId: string;
    titre: string;
    messages: unknown;
    territoireCode: string | null;
    jalon: number | null;
  }): Promise<void> {
    await this.db().chat_conversation.upsert({
      where: { id: params.id },
      create: {
        id: params.id,
        utilisateur_id: params.utilisateurId,
        titre: params.titre,
        messages: params.messages as never,
        territoire_code: params.territoireCode,
        jalon: params.jalon,
      },
      update: {
        titre: params.titre,
        messages: params.messages as never,
        territoire_code: params.territoireCode,
        jalon: params.jalon,
      },
    });
  }

  async recupererParId(params: {
    id: string;
    utilisateurId: string;
  }): Promise<ChatConversation | null> {
    const row = await this.db().chat_conversation.findFirst({
      where: { id: params.id, utilisateur_id: params.utilisateurId },
    });
    if (!row) return null;
    return {
      id: row.id,
      utilisateurId: row.utilisateur_id,
      titre: row.titre,
      messages: row.messages as unknown as PiloteUIMessage[],
      territoireCode: row.territoire_code,
      jalon: row.jalon,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  async listerPourUtilisateur(params: {
    utilisateurId: string;
    limite: number;
  }): Promise<ChatConversationResume[]> {
    const rows = await this.db().chat_conversation.findMany({
      where: { utilisateur_id: params.utilisateurId },
      orderBy: { updated_at: "desc" },
      take: params.limite,
      select: {
        id: true,
        utilisateur_id: true,
        titre: true,
        territoire_code: true,
        jalon: true,
        created_at: true,
        updated_at: true,
      },
    });
    return rows.map((row) => ({
      id: row.id,
      utilisateurId: row.utilisateur_id,
      titre: row.titre,
      territoireCode: row.territoire_code,
      jalon: row.jalon,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));
  }

  async supprimer(params: { id: string; utilisateurId: string }): Promise<void> {
    await this.db().chat_conversation.deleteMany({
      where: { id: params.id, utilisateur_id: params.utilisateurId },
    });
  }

  async supprimerExpirees(params: { anterieurA: Date }): Promise<number> {
    const resultat = await this.db().chat_conversation.deleteMany({
      where: { updated_at: { lt: params.anterieurA } },
    });
    return resultat.count;
  }
}
```

- [ ] **Step 4: Run test — doit passer**

Run: `cd apps/pilote-ppg && pnpm test:server -- PrismaChatConversationRepository`
Expected: 4 tests passés.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/server/albert/infrastructure apps/pilote-ppg/src/server/albert/__tests__/infrastructure
git commit -m "feat(llm): PrismaChatConversationRepository"
```

---

## Task 4: Use cases

**Files:**
- Create: `apps/pilote-ppg/src/server/albert/usecases/EnregistrerConversationUseCase.ts`
- Create: `apps/pilote-ppg/src/server/albert/usecases/ListerConversationsUseCase.ts`
- Create: `apps/pilote-ppg/src/server/albert/usecases/RecupererConversationUseCase.ts`
- Create: `apps/pilote-ppg/src/server/albert/usecases/SupprimerConversationUseCase.ts`
- Create: `apps/pilote-ppg/src/server/albert/usecases/PurgerConversationsExpireesUseCase.ts`

- [ ] **Step 1: `EnregistrerConversationUseCase`**

```typescript
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { PiloteUIMessage } from "@/server/albert/PiloteUIMessage";
import { deriverTitre } from "@/server/albert/domain/ChatConversation";

export class EnregistrerConversationUseCase {
  constructor(
    private readonly deps: {
      chatConversationRepository: ChatConversationRepository;
    },
  ) {}

  async run(params: {
    id: string;
    utilisateurId: string;
    messages: PiloteUIMessage[];
    territoireCode: string | null;
    jalon: number | null;
  }): Promise<void> {
    if (params.messages.length === 0) return;

    await this.deps.chatConversationRepository.upsert({
      id: params.id,
      utilisateurId: params.utilisateurId,
      titre: deriverTitre(params.messages),
      messages: params.messages,
      territoireCode: params.territoireCode,
      jalon: params.jalon,
    });
  }
}
```

- [ ] **Step 2: `ListerConversationsUseCase`**

```typescript
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { ChatConversationResume } from "@/server/albert/domain/ChatConversation";

const LIMITE_PAR_DEFAUT = 50;

export class ListerConversationsUseCase {
  constructor(
    private readonly deps: {
      chatConversationRepository: ChatConversationRepository;
    },
  ) {}

  async run(params: { utilisateurId: string }): Promise<ChatConversationResume[]> {
    return this.deps.chatConversationRepository.listerPourUtilisateur({
      utilisateurId: params.utilisateurId,
      limite: LIMITE_PAR_DEFAUT,
    });
  }
}
```

- [ ] **Step 3: `RecupererConversationUseCase`**

```typescript
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";
import type { ChatConversation } from "@/server/albert/domain/ChatConversation";

export class RecupererConversationUseCase {
  constructor(
    private readonly deps: {
      chatConversationRepository: ChatConversationRepository;
    },
  ) {}

  async run(params: { id: string; utilisateurId: string }): Promise<ChatConversation | null> {
    return this.deps.chatConversationRepository.recupererParId(params);
  }
}
```

- [ ] **Step 4: `SupprimerConversationUseCase`**

```typescript
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";

export class SupprimerConversationUseCase {
  constructor(
    private readonly deps: {
      chatConversationRepository: ChatConversationRepository;
    },
  ) {}

  async run(params: { id: string; utilisateurId: string }): Promise<void> {
    await this.deps.chatConversationRepository.supprimer(params);
  }
}
```

- [ ] **Step 5: `PurgerConversationsExpireesUseCase`**

```typescript
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";

const RETENTION_JOURS = 14;

export class PurgerConversationsExpireesUseCase {
  constructor(
    private readonly deps: {
      chatConversationRepository: ChatConversationRepository;
    },
  ) {}

  async run(params: { maintenant?: Date } = {}): Promise<{ supprimees: number; anterieurA: Date }> {
    const maintenant = params.maintenant ?? new Date();
    const anterieurA = new Date(
      maintenant.getTime() - RETENTION_JOURS * 24 * 60 * 60 * 1000,
    );
    const supprimees = await this.deps.chatConversationRepository.supprimerExpirees({
      anterieurA,
    });
    return { supprimees, anterieurA };
  }
}
```

- [ ] **Step 6: Test unitaire `EnregistrerConversationUseCase`**

`apps/pilote-ppg/src/server/albert/__tests__/usecases/EnregistrerConversationUseCase.test.ts` :

```typescript
import { EnregistrerConversationUseCase } from "@/server/albert/usecases/EnregistrerConversationUseCase";
import type { ChatConversationRepository } from "@/server/albert/domain/ChatConversationRepository";

describe("EnregistrerConversationUseCase", () => {
  it("ne fait rien si la liste de messages est vide", async () => {
    // Given
    const upsert = jest.fn();
    const repository = { upsert } as unknown as ChatConversationRepository;
    const useCase = new EnregistrerConversationUseCase({
      chatConversationRepository: repository,
    });

    // When
    await useCase.run({
      id: "conv-1",
      utilisateurId: "user-1",
      messages: [],
      territoireCode: null,
      jalon: null,
    });

    // Then
    expect(upsert).not.toHaveBeenCalled();
  });

  it("upsert avec un titre dérivé du premier message user (tronqué à 80 caractères)", async () => {
    // Given
    const upsert = jest.fn();
    const repository = { upsert } as unknown as ChatConversationRepository;
    const useCase = new EnregistrerConversationUseCase({
      chatConversationRepository: repository,
    });
    const texteLong = "a".repeat(120);

    // When
    await useCase.run({
      id: "conv-1",
      utilisateurId: "user-1",
      messages: [
        { id: "m1", role: "user", parts: [{ type: "text", text: texteLong }] },
      ] as never,
      territoireCode: "REG-53",
      jalon: 2025,
    });

    // Then
    expect(upsert).toHaveBeenCalledWith({
      id: "conv-1",
      utilisateurId: "user-1",
      titre: `${"a".repeat(79)}…`,
      messages: expect.any(Array),
      territoireCode: "REG-53",
      jalon: 2025,
    });
  });
});
```

- [ ] **Step 7: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: OK.

- [ ] **Step 8: Commit**

```bash
git add apps/pilote-ppg/src/server/albert/usecases apps/pilote-ppg/src/server/albert/__tests__/usecases
git commit -m "feat(llm): use cases historique conversations"
```

---

## Task 5: Enregistrement DI + intégration route `/api/albert/chat`

**Files:**
- Modify: `apps/pilote-ppg/src/server/albert/module.ts`
- Modify: `apps/pilote-ppg/src/app/api/albert/chat/route.ts`

- [ ] **Step 1: Ajouter les dépendances au module `albert`**

Ajouter dans `AlbertOwnCradle` :

```typescript
chatConversationRepository: ChatConversationRepository;
enregistrerConversationUseCase: EnregistrerConversationUseCase;
listerConversationsUseCase: ListerConversationsUseCase;
recupererConversationUseCase: RecupererConversationUseCase;
supprimerConversationUseCase: SupprimerConversationUseCase;
purgerConversationsExpireesUseCase: PurgerConversationsExpireesUseCase;
```

Enregistrement :

```typescript
chatConversationRepository: asModuleClass(PrismaChatConversationRepository),
enregistrerConversationUseCase: asModuleClass(EnregistrerConversationUseCase),
listerConversationsUseCase: asModuleClass(ListerConversationsUseCase),
recupererConversationUseCase: asModuleClass(RecupererConversationUseCase),
supprimerConversationUseCase: asModuleClass(SupprimerConversationUseCase),
purgerConversationsExpireesUseCase: asModuleClass(PurgerConversationsExpireesUseCase),
```

Ajouter les exports correspondants dans `exports: [...]`.

- [ ] **Step 2: Capturer les messages finaux dans `onFinish`**

Le `container = getContainer("albert")` existe déjà en haut de la route (ligne 43) — réutiliser la même variable. Remplacer la fin de la route `/api/albert/chat/route.ts` :

```typescript
const result = await Albert.streamText({
  chatId: body.id,
  messages,
  systemPrompt,
  userId: session.user.id,
  model: body.model,
  tools,
});

const enregistrerConversation = container.resolve(
  "enregistrerConversationUseCase",
);

return result.toUIMessageStreamResponse({
  originalMessages: messages as PiloteUIMessage[],
  onFinish: async ({ messages: messagesFinaux }) => {
    await enregistrerConversation.run({
      id: body.id,
      utilisateurId: session.user.id,
      messages: messagesFinaux as PiloteUIMessage[],
      territoireCode:
        typeof agentContext?.territoireCode === "string"
          ? agentContext.territoireCode
          : null,
      jalon:
        typeof agentContext?.jalon === "number" ? agentContext.jalon : null,
    });
  },
});
```

> **⚠️ Vérification préalable obligatoire** avant d'écrire le code : ouvrir `package.json` pour récupérer la version de `ai`, puis vérifier la signature exacte de `toUIMessageStreamResponse` (paramètres acceptés, forme du callback `onFinish`). Si `onFinish` ne reçoit pas les `UIMessage[]` complets, reconstruire manuellement à partir de `messages` (input) + `result.response.messages` (output converti via `convertToUIMessages` si dispo).

- [ ] **Step 3: Lint + typecheck**

Run: `cd apps/pilote-ppg && pnpm lint && pnpm tsc --noEmit`
Expected: OK.

- [ ] **Step 4: Test manuel**

Run: `cd apps/pilote-ppg && pnpm dev`
Envoyer un message via le chat, puis requêter en DB :
```sql
SELECT id, titre, jsonb_array_length(messages), updated_at FROM chat_conversation ORDER BY updated_at DESC LIMIT 5;
```
Expected: une ligne par conversation, `jsonb_array_length` croît à chaque tour.

- [ ] **Step 5: Commit**

```bash
git add apps/pilote-ppg/src/server/albert/module.ts apps/pilote-ppg/src/app/api/albert/chat/route.ts
git commit -m "feat(llm): persistance des conversations via onFinish"
```

---

## Task 6: Routeur tRPC `albert.conversations`

**Files:**
- Modify: `apps/pilote-ppg/src/server/infrastructure/api/trpc/routes/albert.ts` (ou nouveau sous-fichier `albert/conversations.ts`)

- [ ] **Step 1: Ajouter 3 procédures**

```typescript
import { z } from "zod";
import { createTRPCRouter, procedureUtilisateurAuthentifie } from "...";
import { getContainer } from "@/server/dependances";

export const conversationsRouter = createTRPCRouter({
  lister: procedureUtilisateurAuthentifie.query(async ({ ctx }) => {
    const useCase = getContainer("albert").resolve("listerConversationsUseCase");
    return useCase.run({ utilisateurId: ctx.session.user.id });
  }),

  recuperer: procedureUtilisateurAuthentifie
    .input(z.object({ id: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const useCase = getContainer("albert").resolve("recupererConversationUseCase");
      const conversation = await useCase.run({
        id: input.id,
        utilisateurId: ctx.session.user.id,
      });
      if (!conversation) {
        throw new Error("Conversation introuvable");
      }
      return conversation;
    }),

  supprimer: procedureUtilisateurAuthentifie
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const useCase = getContainer("albert").resolve("supprimerConversationUseCase");
      await useCase.run({ id: input.id, utilisateurId: ctx.session.user.id });
      return { ok: true };
    }),
});
```

Puis accrocher `conversationsRouter` au routeur `albert` parent :

```typescript
export const albertRouter = createTRPCRouter({
  // ... existant (chat, evaluer)
  conversations: conversationsRouter,
});
```

- [ ] **Step 2: Typecheck côté client (le routeur est typé de bout en bout)**

Run: `cd apps/pilote-ppg && pnpm tsc --noEmit`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-ppg/src/server/infrastructure/api/trpc/routes
git commit -m "feat(llm): routeur tRPC albert.conversations"
```

---

## Task 7: Front — `ChatUI` contrôlable par conversationId

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/_commons/ChatUI/ChatUI.tsx`

- [ ] **Step 1: Accepter `conversationId` + `initialMessages` + signal de fin de tour**

```tsx
export const ChatUI = ({
  endpoint,
  placeholder = "Posez votre question...",
  className = "h-[calc(100vh-200px)]",
  scenarios,
  agentContext,
  conversationId,
  initialMessages,
  onConversationUpdated,
}: {
  endpoint: string;
  placeholder?: string;
  className?: string;
  scenarios?: ChatScenarios;
  agentContext?: Record<string, unknown>;
  conversationId?: string;
  initialMessages?: PiloteUIMessage[];
  onConversationUpdated?: () => void;
}) => {
  // ...
  const chatRef = useRef(
    new Chat<PiloteUIMessage>({
      id: conversationId,
      messages: initialMessages,
      transport: new DefaultChatTransport<PiloteUIMessage>({
        api: endpoint,
        body: bodyRef.current,
      }),
    }),
  );

  // Notifier le parent quand le serveur a fini de streamer (et donc onFinish a persisté)
  useEffect(() => {
    if (status === "ready" && messages.length > 0) {
      onConversationUpdated?.();
    }
  }, [status, messages.length, onConversationUpdated]);
```

> **⚠️ Vérification préalable obligatoire** : confirmer que la classe `Chat<PiloteUIMessage>` du SDK `ai` installé accepte bien un champ `messages` dans son constructeur pour pré-remplir l'historique. Si non, utiliser le mécanisme alternatif (`useChat({ initialMessages })` ou setter explicite).

Important : le composant doit être **remounté** (via `key={conversationId}` côté parent) quand on change de conversation, car `chatRef` est créé une fois.

- [ ] **Step 2: Lint + typecheck**

Run: `cd apps/pilote-ppg && pnpm lint && pnpm tsc --noEmit`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-ppg/src/client/components/_commons/ChatUI/ChatUI.tsx
git commit -m "feat(llm): ChatUI accepte conversationId + initialMessages"
```

---

## Task 8: Front — tiroir d'historique

**Files:**
- Create: `apps/pilote-ppg/src/client/components/_commons/ChatUI/ConversationHistoryDrawer.tsx`

- [ ] **Step 1: Composant tiroir**

```tsx
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { api } from "@/client/utils/api";
import { Icone } from "@/components/_commons/Icone";
import { TrashIcon } from "@/components/_commons/Icones/TrashIcon";

type Props = {
  conversationIdCourant: string | null;
  onSelectionner: (id: string) => void;
  onNouvelleConversation: () => void;
};

export const ConversationHistoryDrawer = ({
  conversationIdCourant,
  onSelectionner,
  onNouvelleConversation,
}: Props) => {
  const { data: conversations = [], refetch } =
    api.albert.conversations.lister.useQuery();
  const supprimer = api.albert.conversations.supprimer.useMutation({
    onSuccess: () => refetch(),
  });

  return (
    <aside className="w-64 h-full border-r border-gray-200 bg-gray-50 flex flex-col">
      <button
        type="button"
        onClick={onNouvelleConversation}
        className="m-3 px-3 py-2 text-sm font-medium bg-primary text-white rounded hover:bg-primary/90"
      >
        + Nouvelle conversation
      </button>

      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 && (
          <p className="text-xs text-gray-500 px-3">Aucune conversation.</p>
        )}
        {conversations.map((conversation) => {
          const estActive = conversation.id === conversationIdCourant;
          return (
            <div
              key={conversation.id}
              className={`group flex items-start gap-2 px-3 py-2 text-sm cursor-pointer ${
                estActive ? "bg-primary/10" : "hover:bg-gray-100"
              }`}
              onClick={() => onSelectionner(conversation.id)}
            >
              <div className="flex-1 min-w-0">
                <p className="truncate font-medium text-gray-900">
                  {conversation.titre}
                </p>
                <p className="text-xs text-gray-500">
                  {formatDistanceToNow(conversation.updatedAt, {
                    addSuffix: true,
                    locale: fr,
                  })}
                </p>
              </div>
              <button
                type="button"
                aria-label="Supprimer"
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500"
                onClick={(event) => {
                  event.stopPropagation();
                  if (!confirm("Supprimer cette conversation ?")) return;
                  supprimer.mutate({ id: conversation.id });
                }}
              >
                <Icone className="w-4 h-4" icone={TrashIcon} />
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};
```

- [ ] **Step 2: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-ppg/src/client/components/_commons/ChatUI/ConversationHistoryDrawer.tsx
git commit -m "feat(llm): tiroir historique des conversations"
```

---

## Task 9: Front — intégration dans `BoutonSyntheseTerritoire`

**Files:**
- Modify: `apps/pilote-ppg/src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx`

> **⚠️ État initial** : le fichier a déjà été modifié par PIL-1488. Il contient déjà la prop `estDITPAdmin: boolean`, les scenarios groupés (Synthèse + Comparaison), et un `agentContext` avec `jalon` + `instructions`. **Préserver tout cela** — on ajoute uniquement le drawer et la gestion du `conversationId`. Ne pas réécrire le fichier en partant de zéro.

- [ ] **Step 1: State + chargement**

Imports à ajouter en tête du fichier :

```tsx
import { useEffect, useState } from "react";
import { useEnv } from "@/client/hooks/useEnv";
import { api } from "@/client/utils/api";
import { ConversationHistoryDrawer } from "@/components/_commons/ChatUI/ConversationHistoryDrawer";
```

À l'intérieur du composant, juste après `const [isOpen, setIsOpen] = useState(false);` :

```tsx
const ffHistorique = useEnv("NEXT_PUBLIC_FF_HISTORIQUE_ALBERT");
const utilsTrpc = api.useUtils();
const [conversationId, setConversationId] = useState<string>(() => crypto.randomUUID());
const [conversationIdAVouloirCharger, setConversationIdAVouloirCharger] =
  useState<string | null>(null);

const { data: conversationChargee } = api.albert.conversations.recuperer.useQuery(
  { id: conversationIdAVouloirCharger ?? "" },
  { enabled: conversationIdAVouloirCharger !== null },
);

useEffect(() => {
  if (conversationChargee && conversationChargee.id === conversationIdAVouloirCharger) {
    setConversationId(conversationChargee.id);
    setConversationIdAVouloirCharger(null);
  }
}, [conversationChargee, conversationIdAVouloirCharger]);

const demarrerNouvelleConversation = () => {
  setConversationId(crypto.randomUUID());
  setConversationIdAVouloirCharger(null);
};

const rafraichirHistorique = () => {
  utilsTrpc.albert.conversations.lister.invalidate();
};
```

> **Note tRPC** : confirmer le nom du helper d'invalidation (`api.useUtils()` vs `api.useContext()`) selon la version installée de `@trpc/react-query`. Adapter si nécessaire.

- [ ] **Step 2: Rendu avec tiroir**

Remplacer le bloc `<ChatUI ... />` actuel par :

```tsx
<div className="flex h-full">
  {ffHistorique && (
    <ConversationHistoryDrawer
      conversationIdCourant={conversationId}
      onSelectionner={setConversationIdAVouloirCharger}
      onNouvelleConversation={demarrerNouvelleConversation}
    />
  )}
  <div className="flex-1">
    <ChatUI
      key={conversationId}
      conversationId={conversationId}
      initialMessages={
        conversationChargee?.id === conversationId
          ? conversationChargee.messages
          : undefined
      }
      onConversationUpdated={rafraichirHistorique}
      endpoint="/api/albert/chat"
      className="h-full"
      placeholder="Posez une question sur ce territoire..."
      scenarios={scenarios}
      agentContext={{
        jalon,
        territoireCode,
        instructions: `Le territoire courant de l'utilisateur est ${territoire.nomAffiché} (code : ${territoireCode}). Utilise ce territoire par défaut lorsque l'utilisateur ne précise pas de territoire dans sa question.`,
      }}
    />
  </div>
</div>
```

Note : on passe aussi `territoireCode` dans `agentContext` pour que la persistance en DB le capture, et on invalide la liste via `onConversationUpdated` à la fin de chaque tour.

- [ ] **Step 3: Lint + test manuel**

Run: `cd apps/pilote-ppg && pnpm dev`

Scénarios :
1. `NEXT_PUBLIC_FF_HISTORIQUE_ALBERT=false` : pas de tiroir, comportement actuel.
2. `true` : tiroir visible, bouton "Nouvelle conversation" remet un chat vide, clic sur une entrée → charge les messages précédents.
3. Envoi d'un message → la conversation apparaît dans le tiroir après un refetch.
4. Suppression → disparaît + si c'était la conversation courante, bascule sur une nouvelle.

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/src/client/components/PageAccueil/BoutonSyntheseTerritoire.tsx
git commit -m "feat(llm): tiroir historique dans BoutonSyntheseTerritoire"
```

---

## Task 10: Script cron de purge

**Files:**
- Create: `apps/pilote-ppg/scripts/purgerConversationsAlbert.ts`
- Create: `apps/pilote-ppg/scripts/run_purge_conversations_albert.sh`
- Modify: `apps/pilote-ppg/cron.json`

- [ ] **Step 1: Script TS**

```typescript
import "dotenv/config";
import { getContainer } from "@/server/dependances";

async function main() {
  const useCase = getContainer("albert").resolve("purgerConversationsExpireesUseCase");
  const { supprimees, anterieurA } = await useCase.run();
  // eslint-disable-next-line no-console
  console.log(
    `[purge-conversations-albert] ${supprimees} conversations supprimées (antérieures à ${anterieurA.toISOString()})`,
  );
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 2: Shell wrapper**

```bash
#!/bin/bash
# scripts/run_purge_conversations_albert.sh
set -euo pipefail

if [ "${NEXT_PUBLIC_FF_HISTORIQUE_ALBERT:-}" == "true" ] && [ "${ENVIRONMENT:-}" == "PROD" ]; then
  export NPM_CONFIG_PRODUCTION=false
  pnpm install --frozen-lockfile
  pnpm exec tsx scripts/purgerConversationsAlbert.ts
fi
```

Run: `chmod +x apps/pilote-ppg/scripts/run_purge_conversations_albert.sh`

- [ ] **Step 3: Entrée cron**

Ajouter dans `apps/pilote-ppg/cron.json` :

```json
{
  "command": "0 4 * * * /bin/bash scripts/run_purge_conversations_albert.sh"
}
```

(Tous les jours à 04:00.)

- [ ] **Step 4: Commit**

```bash
git add apps/pilote-ppg/scripts/purgerConversationsAlbert.ts apps/pilote-ppg/scripts/run_purge_conversations_albert.sh apps/pilote-ppg/cron.json
git commit -m "feat(llm): cron quotidien de purge des conversations >14j"
```

---

## Task 11: Feature flag + config

**Files:**
- Modify: `apps/pilote-ppg/src/config.ts`
- Modify: `apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts`

- [ ] **Step 1: Déclarer le FF**

Sur le modèle de `NEXT_PUBLIC_FF_ASK_AI`, ajouter `NEXT_PUBLIC_FF_HISTORIQUE_ALBERT` dans `config.ts` et dans `VariableContenuDisponible.ts` avec le label "Historique Albert".

- [ ] **Step 2: Lint**

Run: `cd apps/pilote-ppg && pnpm lint`
Expected: OK.

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-ppg/src/config.ts apps/pilote-ppg/src/server/gestion-contenu/domain/VariableContenuDisponible.ts
git commit -m "feat(llm): feature flag NEXT_PUBLIC_FF_HISTORIQUE_ALBERT"
```

---

## Task 12: ADR — choix du blob JSONB unique

**Files:**
- Create: `apps/pilote-ppg/docs/architecture/decisions/000X-stockage-blob-conversations-albert.md`

- [ ] **Step 1: Numéroter l'ADR**

Run: `ls apps/pilote-ppg/docs/architecture/decisions/`
Prendre le prochain numéro disponible (ex : `0042-`).

- [ ] **Step 2: Écrire l'ADR (en français, format Nygard)**

Sections : `# N. Stockage des conversations Albert sous forme de blob JSONB unique`, `Date`, `## Statut` (Accepté), `## Contexte` (besoin d'historique conversation côté Albert, contraintes : POC, rétention 14 j, ~20 conv/j, pas de recherche full-text), `## Décision` (une table `chat_conversation` avec `messages JSONB`, pas de table `chat_message` normalisée), `## Conséquences` (positives : simplicité, lecture/écriture en 1 query ; négatives : réécriture du blob complet à chaque tour, pas de recherche FTS, race multi-onglet assumée).

- [ ] **Step 3: Commit**

```bash
git add apps/pilote-ppg/docs/architecture/decisions
git commit -m "docs(llm): ADR stockage blob JSONB pour les conversations"
```

---

## Task 13: Vérification finale

- [ ] **Step 1: Tests serveur**

Run: `cd apps/pilote-ppg && pnpm test:server -- albert`
Expected: tous verts.

- [ ] **Step 2: Lint + typecheck global**

Run: `cd apps/pilote-ppg && pnpm lint && pnpm tsc --noEmit`
Expected: 0 erreur.

- [ ] **Step 3: Test manuel bout en bout**

- Démarrer dev.
- Activer `NEXT_PUBLIC_FF_HISTORIQUE_ALBERT=true` localement.
- Créer 2 conversations différentes sur 2 territoires.
- Fermer/rouvrir la modale → vérifier que les conversations apparaissent dans le tiroir.
- Cliquer sur une conversation → messages rechargés.
- Vérifier qu'un nouveau message dans la conversation rechargée s'ajoute et est persisté.
- Supprimer une conversation.
- Lancer manuellement le script de purge avec une date pour vérifier le compteur : `pnpm exec tsx scripts/purgerConversationsAlbert.ts`.

---

## Notes

- **Fiabilité de `onFinish`** : c'est le point de vigilance principal. Si `toUIMessageStreamResponse` n'expose pas les `UIMessage[]` finaux dans `onFinish` dans la version installée du SDK, reconstruire à la main depuis `messages` (input) + `response.messages` (output converti). Vérifier la doc Vercel AI SDK de la version présente dans `package.json` avant Task 5.
- **Volume de blob** : chaque upsert réécrit le JSON complet. Sur une conversation qui atteint 50+ tours, on écrit ~200-300 KB à chaque tour. Acceptable sur une base Postgres classique, mais à surveiller en charge.
- **Multi-onglets** : deux onglets ouverts sur la même conversation écriraient potentiellement en race. Pas de lock optimiste en V1 — c'est assumé. Si devient un vrai problème, ajouter un `version: Int @default(0)` et un `where: { version: x }` dans l'update.
- **Sécurité** : tous les use cases prennent `utilisateurId` en paramètre et le repository filtre côté SQL. Pas d'accès possible à une conversation d'un autre utilisateur, même en cas de leak d'id.
- **Rétention courte (14 j)** : confirmation produit nécessaire. Si 30 j préférable, changer `RETENTION_JOURS` dans `PurgerConversationsExpireesUseCase` — volume toujours dans des ordres raisonnables (sous 200 MB steady state à 20 conv/jour).
