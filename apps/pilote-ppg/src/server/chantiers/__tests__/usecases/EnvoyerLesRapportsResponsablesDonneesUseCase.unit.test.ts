import { mock, MockProxy } from "vitest-mock-extended";
import { RapportResponsableDonneesRepository } from "@/server/chantiers/domain/ports/RapportResponsableDonneesRepository";
import { EnvoieEmailService } from "@/server/chantiers/domain/ports/EnvoieEmailService";
import { RapportResponsableDonnees } from "@/server/chantiers/domain/RapportResponsableDonnees";
import { EnvoyerLesRapportsResponsablesDonneesUseCase } from "@/server/chantiers/usecases/EnvoyerLesRapportsResponsablesDonneesUseCase";

function creerRapportTest(params: {
  id: string;
  emailResponsable: string;
  nombreTentatives?: number;
}): RapportResponsableDonnees {
  return {
    id: params.id,
    emailResponsable: params.emailResponsable,
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
    nombreTentatives: params.nombreTentatives ?? 0,
    erreurEnvoi: null,
  };
}

describe("EnvoyerLesRapportsResponsablesDonneesUseCase", () => {
  let rapportResponsableDonneesRepository: MockProxy<RapportResponsableDonneesRepository>;
  let envoieEmailService: MockProxy<EnvoieEmailService>;
  let useCase: EnvoyerLesRapportsResponsablesDonneesUseCase;

  beforeEach(() => {
    rapportResponsableDonneesRepository =
      mock<RapportResponsableDonneesRepository>();
    envoieEmailService = mock<EnvoieEmailService>();

    useCase = new EnvoyerLesRapportsResponsablesDonneesUseCase({
      rapportResponsableDonneesRepository,
      envoieEmailService,
    });
  });

  it("récupère les rapports avec statut CREE", async () => {
    // Given
    rapportResponsableDonneesRepository.recupererRapportsParStatut.mockResolvedValue(
      [],
    );

    // When
    await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.recupererRapportsParStatut,
    ).toHaveBeenCalledWith("CREE");
  });

  it("envoie un email pour chaque rapport", async () => {
    // Given
    const rapport = creerRapportTest({
      id: "rapport-1",
      emailResponsable: "responsable@test.com",
    });
    rapportResponsableDonneesRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );

    // When
    await useCase.run();

    // Then
    expect(envoieEmailService.envoieUnEmail).toHaveBeenCalledWith(
      [{ email: "responsable@test.com" }],
      expect.any(Number),
      expect.any(Object),
    );
  });

  it("marque le rapport comme ENVOYE après un envoi réussi", async () => {
    // Given
    const rapport = creerRapportTest({
      id: "rapport-1",
      emailResponsable: "responsable@test.com",
    });
    rapportResponsableDonneesRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );

    // When
    await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "rapport-1",
        statutEnvoi: "ENVOYE",
        dateEnvoi: expect.any(Date),
      }),
    );
  });

  it("marque le rapport comme ECHEC et capture l'erreur si l'envoi échoue", async () => {
    // Given
    const rapport = creerRapportTest({
      id: "rapport-1",
      emailResponsable: "responsable@test.com",
    });
    rapportResponsableDonneesRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );
    envoieEmailService.envoieUnEmail.mockRejectedValue(
      new Error("Erreur SMTP"),
    );

    // When
    await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
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
      emailResponsable: "responsable@test.com",
      nombreTentatives: 2,
    });
    rapportResponsableDonneesRepository.recupererRapportsParStatut.mockResolvedValue(
      [rapport],
    );

    // When
    await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        nombreTentatives: 3,
      }),
    );
  });

  it("continue avec les autres rapports après une erreur d'envoi", async () => {
    // Given
    const rapport1 = creerRapportTest({
      id: "rapport-1",
      emailResponsable: "resp1@test.com",
    });
    const rapport2 = creerRapportTest({
      id: "rapport-2",
      emailResponsable: "resp2@test.com",
    });
    rapportResponsableDonneesRepository.recupererRapportsParStatut.mockResolvedValue(
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
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      rapportsEnvoyes: 1,
      rapportsEnEchec: 1,
      emailsEnEchec: ["resp1@test.com"],
    });
  });

  it("retourne le décompte des envois réussis et échoués", async () => {
    // Given
    const rapport1 = creerRapportTest({
      id: "rapport-1",
      emailResponsable: "resp1@test.com",
    });
    const rapport2 = creerRapportTest({
      id: "rapport-2",
      emailResponsable: "resp2@test.com",
    });
    const rapport3 = creerRapportTest({
      id: "rapport-3",
      emailResponsable: "resp3@test.com",
    });
    rapportResponsableDonneesRepository.recupererRapportsParStatut.mockResolvedValue(
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
      emailsEnEchec: ["resp2@test.com"],
    });
  });
});
