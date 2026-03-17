import { prisma } from "@/server/db/prisma";
import ObjectifRepository from "@/server/domain/chantier/objectif/ObjectifRepository.interface";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import { ProfilEnum } from "@/server/app/enum/profil.enum";

describe("ObjectifSQLRepository", function () {
  let objectifRepository: ObjectifRepository;

  beforeEach(() => {
    objectifRepository = new ObjectifSQLRepository();
  });

  describe("récupérerLesPlusRécentsGroupésParChantier", () => {
    test("retourne les objectifs les plus récent groupé par chantier", async () => {
      // Given
      const auteur_id = "ce68cbcd-e67c-48ea-bd0d-061b310e18ce";
      await prisma.utilisateur.create({
        data: {
          id: auteur_id,
          email: "john.doe@test.com",
          nom: "John",
          prenom: "Doe",
          date_creation: new Date().toISOString(),
          profil: {
            connect: {
              code: ProfilEnum.DITP_ADMIN,
            },
          },
        },
      });

      await prisma.chantier_identite.createMany({
        data: [
          {
            id: "CH-001",
            nom: "Chantier 001",
          },
          {
            id: "CH-002",
            nom: "Chantier 002",
          },
          {
            id: "CH-003",
            nom: "Chantier 003",
          },
        ],
      });
      await prisma.objectif.createMany({
        data: [
          {
            id: "2354f938-13be-4821-817f-38ff6fc75591",
            chantier_id: "CH-001",
            date: new Date("2022-04-01"),
            contenu: "Objectif notre ambition entre 2 dates",
            type: "notre_ambition",
            auteur_id,
          },
          {
            id: "7a16426d-7abb-40f3-88ac-b8873b99c8bc",
            chantier_id: "CH-001",
            date: new Date("2023-04-01"),
            contenu: "Objectif notre ambition plus recent",
            type: "notre_ambition",
            auteur_id,
          },
          {
            id: "f49556f6-6490-4c14-9ccd-24808731f41f",
            chantier_id: "CH-001",
            date: new Date("2023-04-01"),
            contenu: "Objectif notre ambition plus recent",
            type: "a_faire",
            auteur_id,
          },
          {
            id: "6d818ff8-b66c-47af-88f9-7a57702061c5",
            chantier_id: "CH-001",
            date: new Date("2023-04-02"),
            contenu: "Objectif deja fait plus recent",
            type: "deja_fait",
          },
          {
            id: "93fecdd7-f68f-4f9a-8aa5-2fe7d4d983f3",
            chantier_id: "CH-001",
            date: new Date("2021-12-31"),
            contenu: "Objectif déjà fait plus ancien",
            type: "notre_ambition",
            auteur_id,
          },
          {
            id: "57f99fce-9db0-4079-83f0-144c27ec1dca",
            chantier_id: "CH-002",
            date: new Date("2022-04-01"),
            contenu: "Objectif notre ambition entre 2 dates ch2",
            type: "notre_ambition",
            auteur_id,
          },
          {
            id: "ab310903-3d61-41d3-9adf-31cbd4ff8f68",
            chantier_id: "CH-002",
            date: new Date("2023-04-03"),
            contenu: "Objectif notre ambition plus recent ch2",
            type: "notre_ambition",
            auteur_id,
          },
          {
            id: "665da850-5446-4cc9-ab5a-c24304c12550",
            chantier_id: "CH-003",
            date: new Date("2023-04-01"),
            contenu: "Objectif notre ambition plus recent ch2",
            type: "notre_ambition",
            auteur_id,
          },
        ],
      });

      // When
      const result =
        await objectifRepository.récupérerLesPlusRécentsGroupésParChantier([
          "CH-001",
          "CH-002",
        ]);

      // Then
      expect(result["CH-001"]).toIncludeAllMembers([
        {
          id: "6d818ff8-b66c-47af-88f9-7a57702061c5",
          type: "déjàFait",
          contenu: "Objectif deja fait plus recent",
          date: new Date("2023-04-02").toISOString(),
          auteur: "Auteur Inconnu",
        },
        {
          id: "f49556f6-6490-4c14-9ccd-24808731f41f",
          type: "àFaire",
          contenu: "Objectif notre ambition plus recent",
          date: new Date("2023-04-01").toISOString(),
          auteur: "Doe John",
        },
        {
          id: "7a16426d-7abb-40f3-88ac-b8873b99c8bc",
          type: "notreAmbition",
          contenu: "Objectif notre ambition plus recent",
          date: new Date("2023-04-01").toISOString(),
          auteur: "Doe John",
        },
      ]);
      expect(result["CH-002"]).toIncludeAllMembers([
        {
          id: "ab310903-3d61-41d3-9adf-31cbd4ff8f68",
          auteur: "Doe John",
          type: "notreAmbition",
          contenu: "Objectif notre ambition plus recent ch2",
          date: new Date("2023-04-03").toISOString(),
        },
      ]);
    });
  });
});
