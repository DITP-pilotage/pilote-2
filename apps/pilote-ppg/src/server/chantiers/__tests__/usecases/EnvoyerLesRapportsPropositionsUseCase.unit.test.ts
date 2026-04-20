import { mock, MockProxy } from "vitest-mock-extended";
import { RapportPropositionsAvancementRepository } from "@/server/chantiers/domain/ports/RapportPropositionsAvancementRepository";
import { EnvoieEmailService } from "@/server/chantiers/domain/ports/EnvoieEmailService";
import { RapportPropositionsAvancement } from "@/server/chantiers/domain/RapportPropositionsAvancement";
import { EnvoyerLesRapportsPropositionsUseCase } from "@/server/chantiers/usecases/EnvoyerLesRapportsPropositionsUseCase";

function creerRapportTest(params: {
  id: string;
  utilisateurId: string;
  utilisateurEmail: string;
  nombreTentatives?: number;
}): RapportPropositionsAvancement {
  return {
    id: params.id,
    utilisateur: { id: params.utilisateurId, email: params.utilisateurEmail },
    contenuRapport: {
      chantiers: [
        {
          nom_chantier: "Chantier 1",
          id_chantier: "CH-001",
          nombre_propositions:
            "2 propositions territoriales de valeur d'avancement",
          conseiller_email: "conseiller@test.com",
          afficherSectionPropositions: true,
          indicateursPropositions: [
            {
              id: "IND-001",
              nom: "Indicateur 1",
              unite: "(en %)",
              territoires: [
                {
                  code: "75",
                  nom: "Paris",
                  valeur_avancement: "50 %",
                  date_valeur: "01/01/2026",
                  proposition: "60 %",
                },
              ],
            },
          ],
          afficherSectionMajIndicateur: false,
          indicateursNonMisAJour: [],
          nombreIndicateursNonMisAJour: "aucun indicateur à mettre à jour",
          nombreIndicateursAParametrer:
            "aucun indicateur dont le taux d'avancement ne peut être calculé",
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
    nombreTentatives: params.nombreTentatives ?? 0,
    erreurEnvoi: null,
  };
}

describe("EnvoyerLesRapportsPropositionsUseCase", () => {
  let rapportPropositionsAvancementRepository: MockProxy<RapportPropositionsAvancementRepository>;
  let envoieEmailService: MockProxy<EnvoieEmailService>;
  let useCase: EnvoyerLesRapportsPropositionsUseCase;

  beforeEach(() => {
    rapportPropositionsAvancementRepository =
      mock<RapportPropositionsAvancementRepository>();
    envoieEmailService = mock<EnvoieEmailService>();

    useCase = new EnvoyerLesRapportsPropositionsUseCase({
      rapportPropositionsAvancementRepository,
      envoieEmailService,
    });
  });

  it("récupère les rapports avec statut CREE", async () => {
    // Given
    rapportPropositionsAvancementRepository.recupererRapportsParStatut.mockResolvedValue(
      [],
    );

    // When
    await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.recupererRapportsParStatut,
    ).toHaveBeenCalledWith("CREE");
  });

  it("envoie un email pour chaque rapport", async () => {
    // Given
    const rapport = creerRapportTest({
      id: "rapport-1",
      utilisateurId: "user-1",
      utilisateurEmail: "user1@example.com",
    });
    rapportPropositionsAvancementRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );
    // When
    await useCase.run();

    // Then
    expect(envoieEmailService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: "user1@example.com" }],
      expect.any(Number),
      expect.any(Object),
    );
  });

  it("marque le rapport comme ENVOYE après un envoi réussi", async () => {
    // Given
    const rapport = creerRapportTest({
      id: "rapport-1",
      utilisateurId: "user-1",
      utilisateurEmail: "user1@example.com",
    });
    rapportPropositionsAvancementRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );
    // When
    await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "rapport-1",
        statutEnvoi: "ENVOYE",
      }),
    );
  });

  it("marque le rapport comme ECHEC et capture l'erreur si l'envoi échoue", async () => {
    // Given
    const rapport = creerRapportTest({
      id: "rapport-1",
      utilisateurId: "user-1",
      utilisateurEmail: "user1@example.com",
    });
    rapportPropositionsAvancementRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );
    envoieEmailService.envoieUnEmail.mockRejectedValue(
      new Error("Erreur SMTP"),
    );

    // When
    await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "rapport-1",
        statutEnvoi: "ECHEC",
        erreurEnvoi: "Erreur SMTP",
      }),
    );
  });

  it("incrémente nombreTentatives à chaque tentative", async () => {
    // Given
    const rapport = creerRapportTest({
      id: "rapport-1",
      utilisateurId: "user-1",
      utilisateurEmail: "user1@example.com",
      nombreTentatives: 2,
    });
    rapportPropositionsAvancementRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );

    // When
    await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        nombreTentatives: 3,
      }),
    );
  });

  it("met à jour dateDerniereTentative à chaque tentative", async () => {
    // Given
    const rapport = creerRapportTest({
      id: "rapport-1",
      utilisateurId: "user-1",
      utilisateurEmail: "user1@example.com",
    });
    rapportPropositionsAvancementRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );

    // When
    await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        dateDerniereTentative: expect.any(Date),
      }),
    );
  });

  it("continue avec les autres rapports après une erreur d'envoi", async () => {
    // Given
    const rapport1 = creerRapportTest({
      id: "rapport-1",
      utilisateurId: "user-1",
      utilisateurEmail: "user1@example.com",
    });
    const rapport2 = creerRapportTest({
      id: "rapport-2",
      utilisateurId: "user-2",
      utilisateurEmail: "user1@example.com",
    });
    rapportPropositionsAvancementRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport1, rapport2],
    );

    envoieEmailService.envoieUnEmail
      .mockRejectedValueOnce(new Error("Erreur SMTP"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(envoieEmailService.envoieUnEmail).toHaveBeenCalledTimes(2);
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      rapportsEnvoyes: 1,
      rapportsEnEchec: 1,
      emailsEnEchec: ["user1@example.com"],
    });
  });

  it("retourne le décompte des envois réussis et échoués", async () => {
    // Given
    const rapport1 = creerRapportTest({
      id: "rapport-1",
      utilisateurId: "user-1",
      utilisateurEmail: "user1@example.com",
    });
    const rapport2 = creerRapportTest({
      id: "rapport-2",
      utilisateurId: "user-2",
      utilisateurEmail: "user2@example.com",
    });
    const rapport3 = creerRapportTest({
      id: "rapport-3",
      utilisateurId: "user-3",
      utilisateurEmail: "user3@example.com",
    });
    rapportPropositionsAvancementRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport1, rapport2, rapport3],
    );

    envoieEmailService.envoieUnEmail
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error("Erreur"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(resultat).toEqual({
      rapportsEnvoyes: 2,
      rapportsEnEchec: 1,
      emailsEnEchec: ["user2@example.com"],
    });
  });
});
