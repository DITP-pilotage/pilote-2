import { randomUUID } from "crypto";
import { RapportPropositionsAvancement } from "@/server/chantiers/domain/RapportPropositionsAvancement";
import { createIntegrationTest } from "@/server/infrastructure/test/createIntegrationTest";
import { fixtures } from "@/server/infrastructure/test/fixtures";
import { PrismaPilote } from "@/server/db/PrismaPilote";
import { PrismaRapportPropositionsAvancementRepository } from "@/server/chantiers/infrastructure/adapters/PrismaRapportPropositionsAvancementRepository";

describe("PrismaRapportPropositionsAvancementRepository", () => {
  let repository: PrismaRapportPropositionsAvancementRepository;
  const prismaPilote = new PrismaPilote();

  beforeEach(() => {
    repository = new PrismaRapportPropositionsAvancementRepository({
      prisma: prismaPilote,
    });
  });

  describe("#sauvegarder", () => {
    it(
      "crée un nouveau rapport en base avec statut CREE",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        const rapport: RapportPropositionsAvancement = {
          id: randomUUID(),
          utilisateur: {
            id: utilisateur.id,
            email: utilisateur.email,
          },
          contenuRapport: {
            chantiers: [
              {
                nom_chantier: "Chantier Test",
                id_chantier: "CH-001",
                nombre_propositions:
                  "3 propositions territoriales de valeur d'avancement",
                conseiller_email: "conseiller@test.com",
                afficherSectionPropositions: true,
                indicateursPropositions: [],
                afficherSectionMajIndicateur: false,
                indicateursNonMisAJour: [],
                nombreIndicateursNonMisAJour:
                  "aucun indicateur à mettre à jour",
                nombreIndicateursAParametrer: "aucun indicateur à paramétrer",
                afficherSectionParametrage: false,
                indicateursAParametrer: [],
              },
            ],
            conseillerEmail: "conseiller@test.com",
            texteIntro: "votre chantier prioritaire",
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
          .rapport_propositions_avancement.findMany();
        expect(result).toEqual([
          expect.objectContaining({
            id: rapport.id,
            utilisateur_id: utilisateur.id,
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
        const utilisateur = await fixtures.utilisateur();
        const rapportExistant = await fixtures.rapportPropositionsAvancement({
          utilisateur_id: utilisateur.id,
          statut_envoi: "CREE",
        });

        const rapportMisAJour: RapportPropositionsAvancement = {
          id: rapportExistant.id,
          utilisateur: {
            id: utilisateur.id,
            email: utilisateur.email,
          },
          contenuRapport: {
            chantiers: [],
            conseillerEmail: "",
            texteIntro: "",
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
          .rapport_propositions_avancement.findMany();
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
        const utilisateur = await fixtures.utilisateur();

        await fixtures.rapportPropositionsAvancement({
          utilisateur_id: utilisateur.id,
          statut_envoi: "CREE",
        });
        await fixtures.rapportPropositionsAvancement({
          utilisateur_id: utilisateur.id,
          statut_envoi: "ENVOYE",
        });
        await fixtures.rapportPropositionsAvancement({
          utilisateur_id: utilisateur.id,
          statut_envoi: "ECHEC",
        });

        // When
        const result = await repository.recupererRapportsParStatut("CREE");

        // Then
        expect(result).toEqual([
          expect.objectContaining({
            statutEnvoi: "CREE",
          }),
        ]);
      }),
    );

    it(
      "retourne une liste vide si aucun rapport ne correspond",
      createIntegrationTest(async () => {
        // Given
        const utilisateur = await fixtures.utilisateur();
        await fixtures.rapportPropositionsAvancement({
          utilisateur_id: utilisateur.id,
          statut_envoi: "ENVOYE",
        });

        // When
        const result = await repository.recupererRapportsParStatut("CREE");

        // Then
        expect(result).toEqual([]);
      }),
    );
  });
});
