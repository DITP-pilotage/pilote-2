import { MockProxy, mock } from "jest-mock-extended";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { AccuserReceptionPropositionValeurUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/AccuserReceptionPropositionValeurUseCase";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { UtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/UtilisateurRepository";
import { EnvoieEmailService } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";

describe("AccuserReceptionPropositionValeurUseCase", () => {
  let accuserReceptionPropositionValeurUseCase: AccuserReceptionPropositionValeurUseCase;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let envoieEmailService: MockProxy<EnvoieEmailService>;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    utilisateurRepository = mock<UtilisateurRepository>();
    envoieEmailService = mock<EnvoieEmailService>();
    accuserReceptionPropositionValeurUseCase =
      new AccuserReceptionPropositionValeurUseCase({
        indicateurTerritoireValeurEvenementRepository,
        indicateurRepository,
        utilisateurRepository,
        envoieEmailService,
      });
  });

  it("Doit accuser réception d'une proposition de valeur d'avancement et envoyer les emails aux auteurs et coordinateurs", async () => {
    // Given
    const input = {
      indicId: "IND-006",
      territoireCode: "COM-13001",
      dateValeurAvancement: "2024-06-08",
      idAuteurAccuseReception: "user-ghi",
      motif: "Motif de l'accusé de réception",
    };

    const evenementsExistants = [
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(input.dateValeurAvancement),
          valeur: 3,
          idAuteurModification: "user-1",
          correlationId: "corr-1",
          ordre: 1,
          dateCreation: new Date("2022-01-01"),
          donneesComplementaires: undefined,
        },
      ),
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_CREEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(input.dateValeurAvancement),
          valeur: 10,
          idAuteurModification: "user-1",
          correlationId: "corr-1",
          ordre: 2,
          dateCreation: new Date("2022-01-01"),
          donneesComplementaires: {
            motif: "Motif de la proposition",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
          },
        },
      ),
      IndicateurTerritoireValeurEvenement.createValeurIndicateurTerritoireEvenement(
        {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          typeEvenement: "PROPOSITION_VALEUR_MODIFIEE",
          typeValeur: "VALEUR_AVANCEMENT",
          dateValeur: new Date(input.dateValeurAvancement),
          valeur: 20,
          idAuteurModification: "user-2",
          correlationId: "corr-2",
          ordre: 3,
          dateCreation: new Date("2022-01-01"),
          donneesComplementaires: {
            motif: "Modification de la proposition",
            sourceDonneeEtMethodeCalcul: "La source",
          },
        },
      ),
    ];

    indicateurTerritoireValeurEvenementRepository.recupererParIndicIdTerritoireCodeTypeValeurEtDate.mockResolvedValue(
      new EvenementsSurDate({
        identifiantFlux: {
          indicId: input.indicId,
          territoireCode: input.territoireCode,
          date: input.dateValeurAvancement,
        },
        evenementsSurDate: evenementsExistants,
        tousLesEvenements: evenementsExistants,
      }),
    );

    utilisateurRepository.recupererEmailsParUtilisateurIds.mockResolvedValue([
      "auteur1@example.com",
      "auteur2@example.com",
    ]);

    utilisateurRepository.recupererUtilisateursParProfilEtTerritoire.mockResolvedValue(
      ["auteur1@example.com", "coordinateur2@example.com"],
    );

    indicateurRepository.recupererInformationIndicateur.mockResolvedValue({
      nom: "Nom de l'indicateur",
      chantierId: "CH-001",
      chantierNom: "Nom du chantier",
    });

    // When
    await accuserReceptionPropositionValeurUseCase.run(input);
    await new Promise((resolve) => setImmediate(resolve));

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenCalledWith([
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_ACCUSEE_RECEPTION",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: new Date(input.dateValeurAvancement),
        valeur: 20,
        idAuteurModification: input.idAuteurAccuseReception,
        ordre: 4,
        donneesComplementaires: { motif: "Motif de l'accusé de réception" },
      }),
    ]);

    expect(
      utilisateurRepository.recupererEmailsParUtilisateurIds,
    ).toHaveBeenCalledWith(["user-2", "user-1"]);

    expect(
      utilisateurRepository.recupererUtilisateursParProfilEtTerritoire,
    ).toHaveBeenCalledWith({
      profil: "COORDINATEUR_DEPARTEMENT",
      territoireCode: input.territoireCode,
    });

    expect(
      envoieEmailService.envoieNotificationProposition,
    ).toHaveBeenCalledTimes(3);
    expect(
      envoieEmailService.envoieNotificationProposition,
    ).toHaveBeenCalledWith({
      destinataires: [{ email: "auteur1@example.com" }],
      templateId: 43,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurProposee: "20",
        valeurAvancement: "3",
      },
    });
    expect(
      envoieEmailService.envoieNotificationProposition,
    ).toHaveBeenCalledWith({
      destinataires: [{ email: "auteur2@example.com" }],
      templateId: 43,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurProposee: "20",
        valeurAvancement: "3",
      },
    });
    expect(
      envoieEmailService.envoieNotificationProposition,
    ).toHaveBeenCalledWith({
      destinataires: [{ email: "coordinateur2@example.com" }],
      templateId: 43,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurProposee: "20",
        valeurAvancement: "3",
      },
    });
  });
});
