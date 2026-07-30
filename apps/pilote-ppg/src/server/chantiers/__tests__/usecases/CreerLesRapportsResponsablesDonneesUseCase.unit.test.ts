import { mock, MockProxy } from "vitest-mock-extended";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import { RapportResponsableDonneesRepository } from "@/server/chantiers/domain/ports/RapportResponsableDonneesRepository";
import { CreerLesRapportsResponsablesDonneesUseCase } from "@/server/chantiers/usecases/CreerLesRapportsResponsablesDonneesUseCase";

const CHANTIER_INFO = {
  id: "CH-197",
  nom: "Chantier 197",
  statut: "PUBLIE" as const,
  conseillerMail: "conseiller@test.com",
};

describe("CreerLesRapportsResponsablesDonneesUseCase", () => {
  let chantierRepository: MockProxy<ChantierRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let rapportResponsableDonneesRepository: MockProxy<RapportResponsableDonneesRepository>;
  let useCase: CreerLesRapportsResponsablesDonneesUseCase;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    rapportResponsableDonneesRepository =
      mock<RapportResponsableDonneesRepository>();

    useCase = new CreerLesRapportsResponsablesDonneesUseCase({
      chantierRepository,
      indicateurRepository,
      rapportResponsableDonneesRepository,
    });
  });

  it("crée un rapport par responsable ayant des indicateurs non à jour", async () => {
    // Given
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map([
        [
          "CH-197",
          [
            {
              id: "IND-001",
              nom: "Indicateur 1",
              mailles: ["NAT"],
              responsablesDonneesMails: ["responsable@test.com"],
            },
          ],
        ],
      ]),
    );
    chantierRepository.recupererChantierInformationsParIds.mockResolvedValue([
      CHANTIER_INFO,
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledTimes(1);
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        emailResponsable: "responsable@test.com",
        statutEnvoi: "CREE",
      }),
    );
    expect(resultat).toEqual({ rapportsCrees: 1, erreursCreation: 0 });
  });

  it("crée un rapport par responsable lorsque plusieurs responsables ont des indicateurs non à jour", async () => {
    // Given
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map([
        [
          "CH-197",
          [
            {
              id: "IND-001",
              nom: "Indicateur 1",
              mailles: ["NAT"],
              responsablesDonneesMails: ["resp1@test.com", "resp2@test.com"],
            },
            {
              id: "IND-002",
              nom: "Indicateur 2",
              mailles: ["REG"],
              responsablesDonneesMails: ["resp2@test.com"],
            },
          ],
        ],
      ]),
    );
    chantierRepository.recupererChantierInformationsParIds.mockResolvedValue([
      CHANTIER_INFO,
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({ rapportsCrees: 2, erreursCreation: 0 });
  });

  it("consolide les indicateurs par responsable dans un seul rapport", async () => {
    // Given
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map([
        [
          "CH-197",
          [
            {
              id: "IND-001",
              nom: "Indicateur 1",
              mailles: ["NAT"],
              responsablesDonneesMails: ["responsable@test.com"],
            },
            {
              id: "IND-002",
              nom: "Indicateur 2",
              mailles: ["REG"],
              responsablesDonneesMails: ["responsable@test.com"],
            },
          ],
        ],
      ]),
    );
    chantierRepository.recupererChantierInformationsParIds.mockResolvedValue([
      CHANTIER_INFO,
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledTimes(1);
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        emailResponsable: "responsable@test.com",
        contenuRapport: expect.objectContaining({
          chantiers: [
            expect.objectContaining({
              indicateursNonMisAJour: [
                { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
                { id: "IND-002", nom: "Indicateur 2", mailles: ["REG"] },
              ],
            }),
          ],
        }),
      }),
    );
    expect(resultat).toEqual({ rapportsCrees: 1, erreursCreation: 0 });
  });

  it("ne crée aucun rapport si aucun indicateur n'est non à jour", async () => {
    // Given
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map(),
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).not.toHaveBeenCalled();
    expect(resultat).toEqual({ rapportsCrees: 0, erreursCreation: 0 });
  });

  it("ignore les indicateurs sans responsable de données", async () => {
    // Given
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map([
        [
          "CH-197",
          [
            {
              id: "IND-001",
              nom: "Indicateur sans responsable",
              mailles: ["NAT"],
              responsablesDonneesMails: [],
            },
            {
              id: "IND-002",
              nom: "Indicateur avec responsable",
              mailles: ["NAT"],
              responsablesDonneesMails: ["responsable@test.com"],
            },
          ],
        ],
      ]),
    );
    chantierRepository.recupererChantierInformationsParIds.mockResolvedValue([
      CHANTIER_INFO,
    ]);

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).toHaveBeenCalledTimes(1);
    expect(resultat).toEqual({ rapportsCrees: 1, erreursCreation: 0 });
  });

  it("ignore le chantier si son info est introuvable", async () => {
    // Given
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map([
        [
          "CH-197",
          [
            {
              id: "IND-001",
              nom: "Indicateur 1",
              mailles: ["NAT"],
              responsablesDonneesMails: ["responsable@test.com"],
            },
          ],
        ],
      ]),
    );
    chantierRepository.recupererChantierInformationsParIds.mockResolvedValue(
      [],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportResponsableDonneesRepository.sauvegarder,
    ).not.toHaveBeenCalled();
    expect(resultat).toEqual({ rapportsCrees: 0, erreursCreation: 0 });
  });

  it("continue et incrémente erreursCreation si une erreur survient pour un responsable", async () => {
    // Given
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map([
        [
          "CH-197",
          [
            {
              id: "IND-001",
              nom: "Indicateur 1",
              mailles: ["NAT"],
              responsablesDonneesMails: ["resp1@test.com", "resp2@test.com"],
            },
          ],
        ],
      ]),
    );
    chantierRepository.recupererChantierInformationsParIds.mockResolvedValue([
      CHANTIER_INFO,
    ]);
    rapportResponsableDonneesRepository.sauvegarder
      .mockRejectedValueOnce(new Error("Erreur BDD"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(resultat).toEqual({ rapportsCrees: 1, erreursCreation: 1 });
  });
});
