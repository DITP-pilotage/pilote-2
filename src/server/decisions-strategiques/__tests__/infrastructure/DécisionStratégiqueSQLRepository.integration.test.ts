import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";

describe("DécisionStratégiqueSQLRepository", () => {
  let repository: DécisionStratégiqueSQLRepository;

  beforeEach(() => {
    repository = new DécisionStratégiqueSQLRepository({
      prisma: new PrismaPilote(),
    });
  });

  describe("#récupérerLesPlusRécentesGroupéesParChantier", () => {
    it(
      "retourne un objet vide quand aucun chantier ne correspond",
      createIntegrationTest(async () => {
        // Given
        // no decisions exist

        // When
        const result =
          await repository.récupérerLesPlusRécentesGroupéesParChantier([
            "chantier-inexistant",
          ]);

        // Then
        expect(result).toEqual({});
      }),
    );

    it(
      "retourne la décision publiée la plus récente pour un chantier",
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur({
          nom: "Martin",
          prenom: "Alice",
        });
        const chantier = await fixtures.chantierIdentite();
        await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_creation_id: auteur.id,
          auteur_modification_id: auteur.id,
          date_modification: new Date("2025-01-01"),
          contenu: "Ancienne décision",
          statut: $Enums.statut_publication.PUBLIE,
        });
        const recente = await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_creation_id: auteur.id,
          auteur_modification_id: auteur.id,
          date_modification: new Date("2025-06-01"),
          contenu: "Décision récente",
          statut: $Enums.statut_publication.PUBLIE,
        });

        // When
        const result =
          await repository.récupérerLesPlusRécentesGroupéesParChantier([
            chantier.id,
          ]);

        // Then
        expect(result).toEqual({
          [chantier.id]: {
            id: recente.id,
            type: "suiviDesDécisionsStratégiques",
            contenu: "Décision récente",
            date: new Date("2025-06-01").toISOString(),
            auteur: "Alice Martin",
          },
        });
      }),
    );

    it(
      "exclut les brouillons",
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur();
        const chantier = await fixtures.chantierIdentite();
        await fixtures.decisionStrategique({
          chantier_id: chantier.id,
          auteur_creation_id: auteur.id,
          auteur_modification_id: auteur.id,
          date_modification: new Date("2025-06-01"),
          contenu: "Brouillon non visible",
          statut: $Enums.statut_publication.BROUILLON,
        });

        // When
        const result =
          await repository.récupérerLesPlusRécentesGroupéesParChantier([
            chantier.id,
          ]);

        // Then
        expect(result).toEqual({});
      }),
    );

    it(
      "groupe correctement les décisions de plusieurs chantiers",
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur();
        const chantier1 = await fixtures.chantierIdentite();
        const chantier2 = await fixtures.chantierIdentite();
        const decision1 = await fixtures.decisionStrategique({
          chantier_id: chantier1.id,
          auteur_creation_id: auteur.id,
          auteur_modification_id: auteur.id,
          date_modification: new Date("2025-03-01"),
          contenu: "Décision chantier 1",
          statut: $Enums.statut_publication.PUBLIE,
        });
        const decision2 = await fixtures.decisionStrategique({
          chantier_id: chantier2.id,
          auteur_creation_id: auteur.id,
          auteur_modification_id: auteur.id,
          date_modification: new Date("2025-04-01"),
          contenu: "Décision chantier 2",
          statut: $Enums.statut_publication.PUBLIE,
        });

        // When
        const result =
          await repository.récupérerLesPlusRécentesGroupéesParChantier([
            chantier1.id,
            chantier2.id,
          ]);

        // Then
        expect(result).toEqual({
          [chantier1.id]: expect.objectContaining({ id: decision1.id }),
          [chantier2.id]: expect.objectContaining({ id: decision2.id }),
        });
      }),
    );
  });
});
