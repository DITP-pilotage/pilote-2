import { mock, MockProxy } from "vitest-mock-extended";
import { PropositionValeurAvancementRapport } from "@/server/chantiers/domain/ports/PropositionValeurAvancementRepository";
import { ChantierRepository } from "@/server/chantiers/domain/ports/ChantierRepository";
import { EnvoieEmailService } from "@/server/chantiers/domain/ports/EnvoieEmailService";
import { EnvoyerLesRapportsPropositionValeurAvancementUseCase } from "@/server/chantiers/usecases/EnvoyerLesRapportsPropositionValeurAvancementUseCase";
import { UtilisateurRepository } from "@/server/chantiers/domain/ports/UtilisateurRepository";
import { Utilisateur } from "@/server/chantiers/domain/Utilisateur";
import { RapportDirecteurProjetChantierInformation } from "@/server/chantiers/domain/PropositionValeurAvancementChantierInformation";
import { genererParametresEnvoieRapportProposition } from "@/server/chantiers/app/contrats/ParametresEnvoieEmailRapportProposition";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { IndicateurRepository } from "@/server/chantiers/domain/ports/IndicateurRepository";

describe("EnvoyerLesRapportsPropositionValeurAvancementUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let chantierRepository: MockProxy<ChantierRepository>;
  let envoieEmailService: MockProxy<EnvoieEmailService>;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;

  let envoyerLesRapportsPropositionValeurAvancementUseCase: EnvoyerLesRapportsPropositionValeurAvancementUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    chantierRepository = mock<ChantierRepository>();
    envoieEmailService = mock<EnvoieEmailService>();
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    indicateurRepository = mock<IndicateurRepository>();

    envoyerLesRapportsPropositionValeurAvancementUseCase =
      new EnvoyerLesRapportsPropositionValeurAvancementUseCase({
        chantierRepository,
        utilisateurRepository,
        envoieEmailService,
        indicateurTerritoireValeurEvenementRepository,
        indicateurRepository,
      });
  });
  it("Envoie les rapports de propositions d'avancement aux directeurs de projet", async () => {
    // Given
    const listeDirecteursDeProjet: Utilisateur[] = [
      Utilisateur.creerUtilisateur({
        email: "directeur.test1@exemple.com",
        nom: "test1",
        prenom: "directeur",
        listeChantiers: ["CH-001"],
      }),
      Utilisateur.creerUtilisateur({
        email: "directeur.test2@exemple.com",
        nom: "test2",
        prenom: "directeur",
        listeChantiers: ["CH-002"],
      }),
      Utilisateur.creerUtilisateur({
        email: "directeur.test3@exemple.com",
        nom: "test3",
        prenom: "directeur",
        listeChantiers: ["CH-001", "CH-003"],
      }),
      Utilisateur.creerUtilisateur({
        email: "directeur.test4@exemple.com",
        nom: "test4",
        prenom: "directeur",
        listeChantiers: ["CH-004"],
      }),
    ];
    const listeChantiers: RapportDirecteurProjetChantierInformation[] = [
      {
        id: "CH-001",
        nom: "Chantier 1",
        statut: "PUBLIE",
        conseillerMail: "conseiller.ch1@exemple.com",
      },
      {
        id: "CH-002",
        nom: "Chantier 2",
        statut: "PUBLIE",
        conseillerMail: "conseiller.ch2@exemple.com",
      },
      {
        id: "CH-003",
        nom: "Chantier 3",
        statut: "PUBLIE",
        conseillerMail: "conseiller.ch3@exemple.com",
      },
      {
        id: "CH-004",
        nom: "Chantier 4",
        statut: "PUBLIE",
        conseillerMail: "conseiller.ch4@exemple.com",
      },
    ];
    const mapChantiersPropositionInformation = new Map(
      listeChantiers.map((chantier) => [chantier.id, chantier]),
    );

    const propositionsParChantier: Map<
      string,
      Map<string, PropositionValeurAvancementRapport[]>
    > = new Map([
      [
        "CH-001",
        new Map([
          [
            "IND-001",
            [
              {
                indicateurId: "IND-001",
                territoireCode: "DEPT-01",
                dateValeurAvancement: "2025-05-15",
                valeurAvancementProposee: "75",
                valeurAvancementReference: "70",
                nomIndicateur: "Indicateur 1",
                uniteIndicateur: "%",
                nomTerritoire: "Ain",
              },
              {
                indicateurId: "IND-001",
                territoireCode: "DEPT-02",
                dateValeurAvancement: "2025-05-15",
                valeurAvancementProposee: "60",
                valeurAvancementReference: "55",
                nomIndicateur: "Indicateur 1",
                uniteIndicateur: "%",
                nomTerritoire: "Aisne",
              },
            ],
          ],
          [
            "IND-002",
            [
              {
                indicateurId: "IND-002",
                territoireCode: "DEPT-01",
                dateValeurAvancement: "2025-05-15",
                valeurAvancementProposee: "150",
                valeurAvancementReference: "145",
                nomIndicateur: "Indicateur 2",
                uniteIndicateur: "",
                nomTerritoire: "Ain",
              },
            ],
          ],
        ]),
      ],
      [
        "CH-002",
        new Map([
          [
            "IND-003",
            [
              {
                indicateurId: "IND-003",
                territoireCode: "DEPT-75",
                dateValeurAvancement: "2025-05-10",
                valeurAvancementProposee: "90",
                valeurAvancementReference: "85",
                nomIndicateur: "Indicateur 3",
                uniteIndicateur: "",
                nomTerritoire: "Paris",
              },
            ],
          ],
        ]),
      ],
      [
        "CH-003",
        new Map([
          [
            "IND-004",
            [
              {
                indicateurId: "IND-004",
                territoireCode: "DEPT-75",
                dateValeurAvancement: "2025-05-10",
                valeurAvancementProposee: "90",
                valeurAvancementReference: "85",
                nomIndicateur: "Indicateur 4",
                uniteIndicateur: "",
                nomTerritoire: "Paris",
              },
            ],
          ],
        ]),
      ],
    ]);

    const indicateursNonAJourParChantier = new Map([
      [
        "CH-001",
        [
          { id: "IND-001", nom: "Indicateur 1", mailles: ["NAT"] },
          { id: "IND-002", nom: "Indicateur 2", mailles: ["NAT", "REG"] },
        ],
      ],
      ["CH-004", [{ id: "IND-003", nom: "Indicateur 3", mailles: ["DEPT"] }]],
    ]);

    const paramsDirecteur1 = genererParametresEnvoieRapportProposition(
      listeDirecteursDeProjet[0].listeChantiers,
      mapChantiersPropositionInformation,
      propositionsParChantier,
      indicateursNonAJourParChantier,
    );
    const paramsDirecteur2 = genererParametresEnvoieRapportProposition(
      listeDirecteursDeProjet[1].listeChantiers,
      mapChantiersPropositionInformation,
      propositionsParChantier,
      indicateursNonAJourParChantier,
    );
    const paramsDirecteur3 = genererParametresEnvoieRapportProposition(
      listeDirecteursDeProjet[2].listeChantiers,
      mapChantiersPropositionInformation,
      propositionsParChantier,
      indicateursNonAJourParChantier,
    );
    const paramsDirecteur4 = genererParametresEnvoieRapportProposition(
      listeDirecteursDeProjet[3].listeChantiers,
      mapChantiersPropositionInformation,
      propositionsParChantier,
      indicateursNonAJourParChantier,
    );

    indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds.mockResolvedValue(
      propositionsParChantier,
    );

    indicateurRepository.recupererIndicateursNonAJourParChantierId.mockResolvedValue(
      indicateursNonAJourParChantier,
    );

    utilisateurRepository.recupererUtilisateursParProfilEtChantierIds.mockResolvedValue(
      listeDirecteursDeProjet,
    );
    chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds.mockResolvedValue(
      listeChantiers,
    );

    // When
    await envoyerLesRapportsPropositionValeurAvancementUseCase.run();

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.recupererLesPropositionsEnCoursParChantierIds,
    ).toHaveBeenCalledTimes(1);
    expect(
      indicateurRepository.recupererIndicateursNonAJourParChantierId,
    ).toHaveBeenCalledTimes(1);
    expect(
      utilisateurRepository.recupererUtilisateursParProfilEtChantierIds,
    ).toHaveBeenCalledTimes(1);
    expect(
      utilisateurRepository.recupererUtilisateursParProfilEtChantierIds,
    ).toHaveBeenCalledWith("EQUIPE_DIR_PROJET", [
      "CH-001",
      "CH-002",
      "CH-003",
      "CH-004",
    ]);
    expect(
      chantierRepository.recupererListePropositionValeurAvancementChantierInformationParChantiersIds,
    ).toHaveBeenCalledTimes(1);
    expect(envoieEmailService.envoieUnEmail).toHaveBeenCalledTimes(4);
    expect(envoieEmailService.envoieUnEmail).toHaveBeenNthCalledWith(
      1,
      [{ email: listeDirecteursDeProjet[0].email }],
      4,
      {
        chantiers: paramsDirecteur1.chantiers,
        conseiller_email: paramsDirecteur1.conseillerEmail,
        texteIntro: "votre chantier prioritaire",
      },
    );
    expect(envoieEmailService.envoieUnEmail).toHaveBeenNthCalledWith(
      2,
      [{ email: listeDirecteursDeProjet[1].email }],
      4,
      {
        chantiers: paramsDirecteur2.chantiers,
        conseiller_email: paramsDirecteur2.conseillerEmail,
        texteIntro: "votre chantier prioritaire",
      },
    );
    expect(envoieEmailService.envoieUnEmail).toHaveBeenNthCalledWith(
      3,
      [{ email: listeDirecteursDeProjet[2].email }],
      4,
      {
        chantiers: paramsDirecteur3.chantiers,
        conseiller_email: paramsDirecteur3.conseillerEmail,
        texteIntro: "vos chantiers prioritaires",
      },
    );
    expect(envoieEmailService.envoieUnEmail).toHaveBeenNthCalledWith(
      4,
      [{ email: listeDirecteursDeProjet[3].email }],
      4,
      {
        chantiers: paramsDirecteur4.chantiers,
        conseiller_email: paramsDirecteur4.conseillerEmail,
        texteIntro: "votre chantier prioritaire",
      },
    );
  });
});
