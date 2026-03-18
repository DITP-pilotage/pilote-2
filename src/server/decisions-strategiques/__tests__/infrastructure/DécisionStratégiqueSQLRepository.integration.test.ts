import { $Enums } from "@prisma/client";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import DécisionStratégiqueSQLRepository from "@/server/infrastructure/accès_données/chantier/décisionStratégique/DécisionStratégiqueSQLRepository";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import {
  creerDecisionStrategiquePubliee,
  creerDecisionStrategiqueBrouillon,
} from "@/server/domain/chantier/décisionStratégique/DécisionStratégique";

describe("DécisionStratégiqueSQLRepository", () => {
  let repository: DécisionStratégiqueSQLRepository;
  const prisma = new PrismaPilote();

  beforeEach(() => {
    repository = new DécisionStratégiqueSQLRepository({
      prisma,
    });
  });

  describe("#save", () => {
    it(
      "crée une décision publiée en base",
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur();
        const chantier = await fixtures.chantierIdentite();
        const decision = creerDecisionStrategiquePubliee({
          chantierId: chantier.id,
          type: "suiviDesDecisionsStrategiques",
          contenu: "Une décision publiée",
          auteurId: auteur.id,
          date: new Date("2025-06-01").toISOString(),
        });

        // When
        await repository.save(decision);

        // Then
        const enBase = await prisma
          .getInstance()
          .decision_strategique.findUnique({
            where: { id: decision.id },
          });
        expect(enBase).toEqual(
          expect.objectContaining({
            id: decision.id,
            contenu: "Une décision publiée",
            statut: $Enums.statut_publication.PUBLIE,
            auteur_creation_id: auteur.id,
            auteur_modification_id: auteur.id,
          }),
        );
      }),
    );

    it(
      "crée un brouillon en base",
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur();
        const chantier = await fixtures.chantierIdentite();
        const brouillon = creerDecisionStrategiqueBrouillon({
          chantierId: chantier.id,
          type: "suiviDesDecisionsStrategiques",
          contenu: "Un brouillon",
          auteurId: auteur.id,
          date: new Date("2025-06-01").toISOString(),
        });

        // When
        await repository.save(brouillon);

        // Then
        const enBase = await prisma
          .getInstance()
          .decision_strategique.findUnique({
            where: { id: brouillon.id },
          });
        expect(enBase).toEqual(
          expect.objectContaining({
            statut: $Enums.statut_publication.BROUILLON,
            contenu: "Un brouillon",
          }),
        );
      }),
    );

    it(
      "met à jour le contenu et le statut lors d'un upsert sur un id existant",
      createIntegrationTest(async () => {
        // Given
        const auteur = await fixtures.utilisateur();
        const chantier = await fixtures.chantierIdentite();
        const brouillon = creerDecisionStrategiqueBrouillon({
          chantierId: chantier.id,
          type: "suiviDesDecisionsStrategiques",
          contenu: "Brouillon initial",
          auteurId: auteur.id,
          date: new Date("2025-06-01").toISOString(),
        });
        await repository.save(brouillon);

        // When
        await repository.save({
          ...brouillon,
          contenu: "Brouillon modifié",
          statut: $Enums.statut_publication.PUBLIE,
        });

        // Then
        const enBase = await prisma
          .getInstance()
          .decision_strategique.findUnique({
            where: { id: brouillon.id },
          });
        expect(enBase).toEqual(
          expect.objectContaining({
            contenu: "Brouillon modifié",
            statut: $Enums.statut_publication.PUBLIE,
          }),
        );
      }),
    );
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
            type: "suiviDesDecisionsStrategiques",
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
