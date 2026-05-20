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
            {
              id: "m1",
              role: "user",
              parts: [
                { type: "text", text: "Bonjour Albert, quel temps fait-il ?" },
              ],
            },
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
          utilisateur: expect.objectContaining({
            nom: "Martin",
            prenom: "Bob",
          }),
          aPouce: false,
          aPouceBas: false,
          aCommentaire: false,
        }),
        expect.objectContaining({
          id: idConvA,
          titre: "Conv Alice",
          extraitPremierMessageUser: expect.stringContaining("Bonjour Albert"),
          utilisateur: expect.objectContaining({
            nom: "Dupont",
            prenom: "Alice",
            profilCode: ID_PROFIL_DITP_ADMIN,
          }),
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
          {
            id: idAvec,
            utilisateur_id: utilisateur.id,
            titre: "avec",
            messages: [],
          },
          {
            id: idSans,
            utilisateur_id: utilisateur.id,
            titre: "sans",
            messages: [],
          },
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
          {
            id: randomUUID(),
            utilisateur_id: utilisateur.id,
            titre: "Synthèse Bretagne",
            messages: [],
          },
          {
            id: randomUUID(),
            utilisateur_id: utilisateur.id,
            titre: "Indicateurs PACA",
            messages: [],
          },
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
      expect(result.items).toEqual([
        expect.objectContaining({ titre: "Synthèse Bretagne" }),
      ]);
    }),
  );

  it(
    "listerConversations filtre par profilCodes",
    createIntegrationTest(async (tx) => {
      // Given
      const admin = await fixtures.utilisateur({ profilCode: "DITP_ADMIN" });
      const pilotage = await fixtures.utilisateur({
        profilCode: "DITP_PILOTAGE",
      });
      await tx.chat_conversation.createMany({
        data: [
          {
            id: randomUUID(),
            utilisateur_id: admin.id,
            titre: "admin-conv",
            messages: [],
          },
          {
            id: randomUUID(),
            utilisateur_id: pilotage.id,
            titre: "pilotage-conv",
            messages: [],
          },
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
      expect(result.items).toEqual([
        expect.objectContaining({ titre: "pilotage-conv" }),
      ]);
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
            expect.objectContaining({
              evaluation: "NEGATIVE",
              commentaire: "réponse hors-sujet",
            }),
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
