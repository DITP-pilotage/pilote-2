import { randomUUID } from "crypto";
import { RapportResponsableDonnees } from "@/server/chantiers/domain/RapportResponsableDonnees";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaRapportResponsableDonneesRepository } from "@/server/chantiers/infrastructure/adapters/PrismaRapportResponsableDonneesRepository";

describe("PrismaRapportResponsableDonneesRepository", () => {
  let repository: PrismaRapportResponsableDonneesRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    repository = new PrismaRapportResponsableDonneesRepository({
      prisma: prismaPilote,
    });
  });

  describe("#sauvegarder", () => {
    it(
      "crée un nouveau rapport en base avec statut CREE",
      createIntegrationTest(async () => {
        // Given
        const rapport: RapportResponsableDonnees = {
          id: randomUUID(),
          emailResponsable: "responsable@test.com",
          contenuRapport: {
            chantiers: [
              {
                nom_chantier: "Chantier 197",
                id_chantier: "CH-197",
                indicateursNonMisAJour: [
                  { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
                ],
                nombreIndicateursNonMisAJour: "1 indicateur à mettre à jour",
              },
            ],
          },
          statutEnvoi: "CREE",
          dateCreation: new Date("2026-02-03"),
          dateEnvoi: null,
          dateDerniereTentative: null,
          nombreTentatives: 0,
          erreurEnvoi: null,
        };

        // When
        await repository.sauvegarder(rapport);

        // Then
        const result = await prismaPilote
          .getInstance()
          .rapport_responsable_donnees.findMany();
        expect(result).toEqual([
          expect.objectContaining({
            id: rapport.id,
            email_responsable: "responsable@test.com",
            statut_envoi: "CREE",
            nombre_tentatives: 0,
            erreur_envoi: null,
          }),
        ]);
      }),
    );

    it(
      "met à jour un rapport existant (statut, erreur, tentatives)",
      createIntegrationTest(async () => {
        // Given
        const rapportExistant = await fixtures.rapportResponsableDonnees({
          email_responsable: "responsable@test.com",
          statut_envoi: "CREE",
        });

        const rapportMisAJour: RapportResponsableDonnees = {
          id: rapportExistant.id,
          emailResponsable: "responsable@test.com",
          contenuRapport: {
            chantiers: [],
          },
          statutEnvoi: "ECHEC",
          dateCreation: rapportExistant.date_creation,
          dateEnvoi: null,
          dateDerniereTentative: new Date("2026-02-03T10:00:00Z"),
          nombreTentatives: 1,
          erreurEnvoi: "Erreur SMTP",
        };

        // When
        await repository.sauvegarder(rapportMisAJour);

        // Then
        const result = await prismaPilote
          .getInstance()
          .rapport_responsable_donnees.findMany();
        expect(result).toEqual([
          expect.objectContaining({
            id: rapportExistant.id,
            statut_envoi: "ECHEC",
            nombre_tentatives: 1,
            erreur_envoi: "Erreur SMTP",
          }),
        ]);
      }),
    );
  });

  describe("#recupererRapportsParStatut", () => {
    it(
      "récupère uniquement les rapports avec le statut demandé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.rapportResponsableDonnees({
          email_responsable: "resp1@test.com",
          statut_envoi: "CREE",
        });
        await fixtures.rapportResponsableDonnees({
          email_responsable: "resp2@test.com",
          statut_envoi: "ENVOYE",
        });
        await fixtures.rapportResponsableDonnees({
          email_responsable: "resp3@test.com",
          statut_envoi: "ECHEC",
        });

        // When
        const result = await repository.recupererRapportsParStatut("CREE");

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            emailResponsable: "resp1@test.com",
            statutEnvoi: "CREE",
          }),
        ]);
      }),
    );

    it(
      "retourne une liste vide si aucun rapport ne correspond au statut demandé",
      createIntegrationTest(async () => {
        // Given
        await fixtures.rapportResponsableDonnees({
          statut_envoi: "ENVOYE",
        });

        // When
        const result = await repository.recupererRapportsParStatut("CREE");

        // Then
        expect(result).toEqual([]);
      }),
    );

    it(
      "désérialise correctement le contenu JSON du rapport",
      createIntegrationTest(async () => {
        // Given
        await fixtures.rapportResponsableDonnees({
          email_responsable: "responsable@test.com",
          statut_envoi: "CREE",
          contenu_rapport: {
            chantiers: [
              {
                nom_chantier: "Chantier 197",
                id_chantier: "CH-197",
                indicateursNonMisAJour: [
                  { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
                ],
                nombreIndicateursNonMisAJour: "1 indicateur à mettre à jour",
              },
            ],
          },
        });

        // When
        const [result] = await repository.recupererRapportsParStatut("CREE");

        // Then
        expect(result.contenuRapport.chantiers).toHaveLength(1);
        expect(result.contenuRapport.chantiers[0].id_chantier).toEqual(
          "CH-197",
        );
      }),
    );
  });
});
