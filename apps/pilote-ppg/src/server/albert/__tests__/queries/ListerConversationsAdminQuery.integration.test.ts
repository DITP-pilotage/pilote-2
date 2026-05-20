import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { ListerConversationsAdminQuery } from "@/server/albert/queries/ListerConversationsAdminQuery";

describe("ListerConversationsAdminQuery", () => {
  const prismaPilote = new PrismaPilote();
  const buildQuery = () =>
    new ListerConversationsAdminQuery({ prisma: prismaPilote });

  const ID_PROFIL_DITP_ADMIN = "DITP_ADMIN";

  it(
    "renvoie toutes les conversations triées par updatedAt desc par défaut, avec total",
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
      await tx.chat_conversation.update({
        where: { id: idConvA },
        data: { updated_at: new Date("2026-01-01") },
      });
      await tx.chat_conversation.update({
        where: { id: idConvB },
        data: { updated_at: new Date("2026-02-01") },
      });

      // When
      const result = await buildQuery().run({
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
    "calcule aPouce / aPouceBas / aCommentaire depuis llm_calls",
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

      // When
      const result = await buildQuery().run({
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
    "filtre avecPouce uniquement les conversations qui ont au moins un POSITIVE",
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

      // When
      const result = await buildQuery().run({
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
    "filtre par recherche sur titre (ILIKE)",
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

      // When
      const result = await buildQuery().run({
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
    "filtre par recherche sur le 1er message au-delà des 160 premiers caractères",
    createIntegrationTest(async (tx) => {
      // Given : un mot-clé "marmotte" placé après 160 caractères de remplissage
      const utilisateur = await fixtures.utilisateur({});
      const remplissage = "a".repeat(200);
      await tx.chat_conversation.create({
        data: {
          id: randomUUID(),
          utilisateur_id: utilisateur.id,
          titre: "Sans rapport",
          messages: [
            {
              id: "m1",
              role: "user",
              parts: [{ type: "text", text: `${remplissage} marmotte` }],
            },
          ],
        },
      });

      // When
      const result = await buildQuery().run({
        recherche: "marmotte",
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 25,
      });

      // Then
      expect(result.total).toEqual(1);
      expect(result.items).toEqual([
        expect.objectContaining({ titre: "Sans rapport" }),
      ]);
    }),
  );

  it(
    "filtre par profilCodes",
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

      // When
      const result = await buildQuery().run({
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
    "pagine via page / taillePage",
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

      // When
      const page1 = await buildQuery().run({
        tri: { champ: "updatedAt", direction: "desc" },
        page: 1,
        taillePage: 2,
      });
      const page3 = await buildQuery().run({
        tri: { champ: "updatedAt", direction: "desc" },
        page: 3,
        taillePage: 2,
      });

      // Then
      expect(page1.total).toEqual(5);
      expect(page1.items).toEqual([
        expect.objectContaining({ id: expect.any(String) }),
        expect.objectContaining({ id: expect.any(String) }),
      ]);
      expect(page3.items).toEqual([
        expect.objectContaining({ id: expect.any(String) }),
      ]);
    }),
  );
});
