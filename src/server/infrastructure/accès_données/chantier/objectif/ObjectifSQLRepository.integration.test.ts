import { $Enums } from "@prisma/client";
import { randomUUID } from "node:crypto";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import ObjectifSQLRepository from "@/server/infrastructure/accès_données/chantier/objectif/ObjectifSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("ObjectifSQLRepository", () => {
  let repository: ObjectifSQLRepository;

  beforeEach(() => {
    repository = new ObjectifSQLRepository({
      prisma: new PrismaPilote(),
    });
  });

  describe("récupérerLesPlusRécentsGroupésParChantier", () => {
    it(
      "retourne les objectifs les plus récents groupés par chantier",
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur({
          nom: "John",
          prenom: "Doe",
        });
        const ch1 = await fixtures.chantierIdentite();
        const ch2 = await fixtures.chantierIdentite();
        const ch3 = await fixtures.chantierIdentite();

        await fixtures.objectifChantier({
          chantier_id: ch1.id,
          type: "notre_ambition",
          auteur_modification_id: auteur.id,
          date_modification: new Date("2022-04-01"),
          contenu: "Objectif notre ambition entre 2 dates",
        });
        const ch1NaRecent = await fixtures.objectifChantier({
          chantier_id: ch1.id,
          type: "notre_ambition",
          auteur_modification_id: auteur.id,
          date_modification: new Date("2023-04-01"),
          contenu: "Objectif notre ambition plus recent",
        });
        const ch1AFaire = await fixtures.objectifChantier({
          chantier_id: ch1.id,
          type: "a_faire",
          auteur_modification_id: auteur.id,
          date_modification: new Date("2023-04-01"),
          contenu: "Objectif a faire plus recent",
        });
        const ch1DejaFait = await fixtures.objectifChantier({
          chantier_id: ch1.id,
          type: "deja_fait",
          // auteur_modification_id null pour tester "Auteur Inconnu"
          auteur_modification_id: null,
          date_modification: new Date("2023-04-02"),
          contenu: "Objectif deja fait plus recent",
        });
        await fixtures.objectifChantier({
          chantier_id: ch1.id,
          type: "notre_ambition",
          auteur_modification_id: auteur.id,
          date_modification: new Date("2021-12-31"),
          contenu: "Objectif notre ambition plus ancien",
        });

        await fixtures.objectifChantier({
          chantier_id: ch2.id,
          type: "notre_ambition",
          auteur_modification_id: auteur.id,
          date_modification: new Date("2022-04-01"),
          contenu: "Objectif notre ambition entre 2 dates ch2",
        });
        const ch2NaRecent = await fixtures.objectifChantier({
          chantier_id: ch2.id,
          type: "notre_ambition",
          auteur_modification_id: auteur.id,
          date_modification: new Date("2023-04-03"),
          contenu: "Objectif notre ambition plus recent ch2",
        });

        // ch3 non demandé dans la requête
        await fixtures.objectifChantier({
          chantier_id: ch3.id,
          type: "notre_ambition",
          auteur_modification_id: auteur.id,
          date_modification: new Date("2023-04-01"),
          contenu: "Objectif ch3",
        });

        // When
        const result =
          await repository.récupérerLesPlusRécentsGroupésParChantier([
            ch1.id,
            ch2.id,
          ]);

        // Then
        expect(result[ch1.id]).toIncludeAllMembers([
          {
            id: ch1NaRecent.id,
            type: "notreAmbition",
            contenu: "Objectif notre ambition plus recent",
            date: new Date("2023-04-01").toISOString(),
            auteur: "Doe John",
          },
          {
            id: ch1AFaire.id,
            type: "aFaire",
            contenu: "Objectif a faire plus recent",
            date: new Date("2023-04-01").toISOString(),
            auteur: "Doe John",
          },
          {
            id: ch1DejaFait.id,
            type: "dejaFait",
            contenu: "Objectif deja fait plus recent",
            date: new Date("2023-04-02").toISOString(),
            auteur: "Auteur Inconnu",
          },
        ]);
        expect(result[ch2.id]).toIncludeAllMembers([
          {
            id: ch2NaRecent.id,
            type: "notreAmbition",
            contenu: "Objectif notre ambition plus recent ch2",
            date: new Date("2023-04-03").toISOString(),
            auteur: "Doe John",
          },
        ]);
        expect(result[ch3.id]).toBeUndefined();
      }),
    );
  });

  describe("save", () => {
    it(
      "crée un objectif quand il n'existe pas encore",
      createIntegrationTest(async (tx) => {
        // Given
        const auteur = await fixtures.utilisateur();
        const chantier = await fixtures.chantierIdentite();
        const objectifId = randomUUID();

        // When
        await repository.save({
          id: objectifId,
          chantierId: chantier.id,
          type: "notreAmbition",
          contenu: "Contenu initial",
          statut: $Enums.statut_publication.BROUILLON,
          auteurCreationId: auteur.id,
          dateCreation: "2024-01-01T00:00:00.000Z",
          auteurModificationId: auteur.id,
          dateModification: "2024-01-01T00:00:00.000Z",
        });

        // Then
        const stored = await tx.objectif.findUnique({
          where: { id: objectifId },
        });
        expect(stored).toEqual(
          expect.objectContaining({
            id: objectifId,
            chantier_id: chantier.id,
            type: "notre_ambition",
            contenu: "Contenu initial",
            statut: $Enums.statut_publication.BROUILLON,
            auteur_creation_id: auteur.id,
            auteur_modification_id: auteur.id,
            date_creation: new Date("2024-01-01T00:00:00.000Z"),
            date_modification: new Date("2024-01-01T00:00:00.000Z"),
          }),
        );
      }),
    );

    it(
      "met à jour contenu, statut et auteur_modification quand l'objectif existe déjà",
      createIntegrationTest(async (tx) => {
        // Given
        const auteurCreation = await fixtures.utilisateur();
        const auteurModification = await fixtures.utilisateur();
        const chantier = await fixtures.chantierIdentite();
        const existant = await fixtures.objectifChantier({
          chantier_id: chantier.id,
          type: "notre_ambition",
          auteur_creation_id: auteurCreation.id,
          auteur_modification_id: auteurCreation.id,
          date_creation: new Date("2024-01-01"),
          date_modification: new Date("2024-01-01"),
          contenu: "Contenu original",
          statut: $Enums.statut_publication.BROUILLON,
        });

        // When
        await repository.save({
          id: existant.id,
          chantierId: chantier.id,
          type: "notreAmbition",
          contenu: "Contenu modifié",
          statut: $Enums.statut_publication.PUBLIE,
          auteurCreationId: auteurCreation.id,
          dateCreation: "2024-01-01T00:00:00.000Z",
          auteurModificationId: auteurModification.id,
          dateModification: "2024-06-01T00:00:00.000Z",
        });

        // Then
        const stored = await tx.objectif.findUnique({
          where: { id: existant.id },
        });
        expect(stored).toEqual(
          expect.objectContaining({
            contenu: "Contenu modifié",
            statut: $Enums.statut_publication.PUBLIE,
            auteur_modification_id: auteurModification.id,
            date_modification: new Date("2024-06-01T00:00:00.000Z"),
            // type et auteur_creation_id ne sont pas modifiés lors d'un update
            type: "notre_ambition",
            auteur_creation_id: auteurCreation.id,
          }),
        );
      }),
    );
  });
});
