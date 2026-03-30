import { mock, MockProxy } from "vitest-mock-extended";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";
import {
  IndicateurTerritoireValeurEvenementRepository,
  PropositionValeurAvancementRapport,
} from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { RapportPropositionsAvancementRepository } from "@/server/chantiers/domain/ports/RapportPropositionsAvancementRepository";
import { CreerLesRapportsPropositionsUseCase } from "@/server/chantiers/usecases/CreerLesRapportsPropositionsUseCase";
import { Utilisateur } from "@/server/chantiers/domain/Utilisateur";

function creerPropositionsParChantier(
  items: {
    chantierId: string;
    indicateurId: string;
    proposition: PropositionValeurAvancementRapport;
  }[],
): Map<string, Map<string, PropositionValeurAvancementRapport[]>> {
  const result = new Map<
    string,
    Map<string, PropositionValeurAvancementRapport[]>
  >();
  for (const item of items) {
    if (!result.has(item.chantierId)) {
      result.set(item.chantierId, new Map());
    }
    const chantierMap = result.get(item.chantierId)!;
    if (!chantierMap.has(item.indicateurId)) {
      chantierMap.set(item.indicateurId, []);
    }
    chantierMap.get(item.indicateurId)!.push(item.proposition);
  }
  return result;
}

describe("CreerLesRapportsPropositionsUseCase", () => {
  let chantierRepository: MockProxy<ChantierRepository>;
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let rapportPropositionsAvancementRepository: MockProxy<RapportPropositionsAvancementRepository>;
  let useCase: CreerLesRapportsPropositionsUseCase;

  beforeEach(() => {
    chantierRepository = mock<ChantierRepository>();
    utilisateurRepository = mock<UtilisateurRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    rapportPropositionsAvancementRepository =
      mock<RapportPropositionsAvancementRepository>();

    indicateurRepository.recupererIndicateursAParametrerParChantierId.mockResolvedValue(
      new Map(),
    );

    useCase = new CreerLesRapportsPropositionsUseCase({
      chantierRepository,
      utilisateurRepository,
      indicateurRepository,
      indicateurTerritoireValeurEvenementRepository,
      rapportPropositionsAvancementRepository,
    });
  });

  it("crée un rapport pour chaque directeur de projet avec des propositions sur ses chantiers", async () => {
    // Given
    const propositionsParChantier = creerPropositionsParChantier([
      {
        chantierId: "CH-001",
        indicateurId: "IND-001",
        proposition: {
          indicateurId: "IND-001",
          territoireCode: "DEPT-01",
          dateValeurAvancement: "2026-02-01",
          valeurAvancementProposee: "75",
          valeurAvancementReference: "70",
          nomIndicateur: "Indicateur 1",
          uniteIndicateur: "%",
          nomTerritoire: "Ain",
        },
      },
    ]);

    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(
      propositionsParChantier,
    );
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map(),
    );
    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(
      [
        Utilisateur.creerUtilisateur({
          id: "user-1",
          email: "directeur@test.com",
          nom: "Dupont",
          prenom: "Jean",
          listeChantiers: ["CH-001"],
        }),
      ],
    );
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(
      [
        {
          id: "CH-001",
          nom: "Chantier 1",
          statut: "PUBLIE",
          conseillerMail: "conseiller@test.com",
        },
      ],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        utilisateur: {
          id: "user-1",
          email: "directeur@test.com",
        },
        statutEnvoi: "CREE",
        contenuRapport: expect.objectContaining({
          chantiers: [
            expect.objectContaining({
              id_chantier: "CH-001",
              nom_chantier: "Chantier 1",
              afficherSectionPropositions: true,
            }),
          ],
          conseillerEmail: "conseiller@test.com",
          texteIntro: "votre chantier prioritaire",
        }),
      }),
    );
    expect(resultat).toEqual({
      rapportsCrees: 1,
      erreursCreation: 0,
    });
  });

  it("crée un rapport pour un directeur avec des indicateurs non à jour", async () => {
    // Given
    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(
      new Map(),
    );
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map([
        [
          "CH-001",
          [
            { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
            { id: "IND-002", nom: "Indicateur 2", mailles: ["REG"] },
          ],
        ],
      ]),
    );
    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(
      [
        Utilisateur.creerUtilisateur({
          id: "user-1",
          email: "directeur@test.com",
          nom: "Dupont",
          prenom: "Jean",
          listeChantiers: ["CH-001"],
        }),
      ],
    );
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(
      [
        {
          id: "CH-001",
          nom: "Chantier 1",
          statut: "PUBLIE",
          conseillerMail: "conseiller@test.com",
        },
      ],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        contenuRapport: expect.objectContaining({
          chantiers: [
            expect.objectContaining({
              id_chantier: "CH-001",
              afficherSectionMajIndicateur: true,
              indicateursNonMisAJour: [
                { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
                { id: "IND-002", nom: "Indicateur 2", mailles: ["REG"] },
              ],
            }),
          ],
        }),
      }),
    );
    expect(resultat).toEqual({
      rapportsCrees: 1,
      erreursCreation: 0,
    });
  });

  it("ne crée pas de rapport si le directeur n'a aucune proposition ni indicateur non à jour sur ses chantiers", async () => {
    // Given - propositions et indicateurs non à jour sur CH-002, mais directeur n'a que CH-001
    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(
      new Map([["CH-002", new Map()]]),
    );
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map([
        ["CH-002", [{ id: "IND-001", nom: "Indicateur", mailles: [] }]],
      ]),
    );
    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(
      [
        Utilisateur.creerUtilisateur({
          id: "user-1",
          email: "directeur@test.com",
          nom: "Dupont",
          prenom: "Jean",
          listeChantiers: ["CH-001"],
        }),
      ],
    );
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(
      [
        {
          id: "CH-001",
          nom: "Chantier 1",
          statut: "PUBLIE",
          conseillerMail: "conseiller@test.com",
        },
      ],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      rapportsCrees: 0,
      erreursCreation: 0,
    });
  });

  it("ne crée aucun rapport quand il n'y a aucun directeur de projet", async () => {
    // Given
    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(
      new Map(),
    );
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map(),
    );
    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(
      [],
    );
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(
      [],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).not.toHaveBeenCalled();
    expect(resultat).toEqual({
      rapportsCrees: 0,
      erreursCreation: 0,
    });
  });

  it("continue la création si une erreur survient pour un directeur et incrémente erreursCreation", async () => {
    // Given
    const propositionsParChantier = creerPropositionsParChantier([
      {
        chantierId: "CH-001",
        indicateurId: "IND-001",
        proposition: {
          indicateurId: "IND-001",
        } as PropositionValeurAvancementRapport,
      },
      {
        chantierId: "CH-002",
        indicateurId: "IND-002",
        proposition: {
          indicateurId: "IND-002",
        } as PropositionValeurAvancementRapport,
      },
    ]);

    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(
      propositionsParChantier,
    );
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map(),
    );
    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(
      [
        Utilisateur.creerUtilisateur({
          id: "user-1",
          email: "directeur1@test.com",
          nom: "Dupont",
          prenom: "Jean",
          listeChantiers: ["CH-001"],
        }),
        Utilisateur.creerUtilisateur({
          id: "user-2",
          email: "directeur2@test.com",
          nom: "Martin",
          prenom: "Pierre",
          listeChantiers: ["CH-002"],
        }),
      ],
    );
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(
      [
        {
          id: "CH-001",
          nom: "Chantier 1",
          statut: "PUBLIE",
          conseillerMail: "",
        },
        {
          id: "CH-002",
          nom: "Chantier 2",
          statut: "PUBLIE",
          conseillerMail: "",
        },
      ],
    );

    rapportPropositionsAvancementRepository.sauvegarder
      .mockRejectedValueOnce(new Error("Erreur BDD"))
      .mockResolvedValueOnce(undefined);

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      rapportsCrees: 1,
      erreursCreation: 1,
    });
  });

  it("crée un rapport pour un directeur avec des indicateurs à paramétrer", async () => {
    // Given
    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(
      new Map(),
    );
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map(),
    );
    indicateurRepository.recupererIndicateursAParametrerParChantierId.mockResolvedValue(
      new Map([
        [
          "CH-001",
          [
            { id: "IND-001", nom: "Indicateur 1" },
            { id: "IND-002", nom: "Indicateur 2" },
          ],
        ],
      ]),
    );
    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(
      [
        Utilisateur.creerUtilisateur({
          id: "user-1",
          email: "directeur@test.com",
          nom: "Dupont",
          prenom: "Jean",
          listeChantiers: ["CH-001"],
        }),
      ],
    );
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(
      [
        {
          id: "CH-001",
          nom: "Chantier 1",
          statut: "PUBLIE",
          conseillerMail: "conseiller@test.com",
        },
      ],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledWith(
      expect.objectContaining({
        contenuRapport: expect.objectContaining({
          chantiers: [
            expect.objectContaining({
              id_chantier: "CH-001",
              afficherSectionParametrage: true,
              indicateursAParametrer: [
                { id: "IND-001", nom: "Indicateur 1" },
                { id: "IND-002", nom: "Indicateur 2" },
              ],
            }),
          ],
        }),
      }),
    );
    expect(resultat).toEqual({
      rapportsCrees: 1,
      erreursCreation: 0,
    });
  });

  it("crée des rapports pour des utilisateurs de profils EQUIPE_DIR_PROJET et SECRETARIAT_GENERAL", async () => {
    // Given
    const propositionsParChantier = creerPropositionsParChantier([
      {
        chantierId: "CH-001",
        indicateurId: "IND-001",
        proposition: {
          indicateurId: "IND-001",
          territoireCode: "DEPT-01",
          dateValeurAvancement: "2026-02-01",
          valeurAvancementProposee: "75",
          valeurAvancementReference: "70",
          nomIndicateur: "Indicateur 1",
          uniteIndicateur: "%",
          nomTerritoire: "Ain",
        },
      },
    ]);

    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(
      propositionsParChantier,
    );
    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      new Map(),
    );
    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(
      [
        Utilisateur.creerUtilisateur({
          id: "user-dir",
          email: "directeur@test.com",
          nom: "Dupont",
          prenom: "Jean",
          listeChantiers: ["CH-001"],
        }),
        Utilisateur.creerUtilisateur({
          id: "user-sec",
          email: "secgeneral@test.com",
          nom: "Martin",
          prenom: "Claire",
          listeChantiers: ["CH-001"],
        }),
      ],
    );
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(
      [
        {
          id: "CH-001",
          nom: "Chantier 1",
          statut: "PUBLIE",
          conseillerMail: "conseiller@test.com",
        },
      ],
    );

    // When
    const resultat = await useCase.run();

    // Then
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).toHaveBeenCalledTimes(2);
    expect(resultat).toEqual({
      rapportsCrees: 2,
      erreursCreation: 0,
    });
  });

  it("stoppe le script si une erreur survient avant la boucle de création", async () => {
    // Given
    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockRejectedValue(
      new Error("Erreur BDD critique"),
    );

    // When / Then
    await expect(useCase.run()).rejects.toThrow("Erreur BDD critique");
    expect(
      rapportPropositionsAvancementRepository.sauvegarder,
    ).not.toHaveBeenCalled();
  });
});
