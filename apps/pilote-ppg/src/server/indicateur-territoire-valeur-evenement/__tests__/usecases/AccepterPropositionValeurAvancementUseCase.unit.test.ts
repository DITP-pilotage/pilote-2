import { MockProxy, mock } from "vitest-mock-extended";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { AccepterPropositionValeurAvancementUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/AccepterPropositionValeurAvancementUseCase";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { Transaction } from "@/server/db/Transaction";
import { MesureIndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/MesureIndicateurRepository";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { UtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/UtilisateurRepository";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { EnvoieEmailService } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";

describe("AccepterPropositionValeurAvancementUseCase", () => {
  let accepterPropositionValeurAvancementUseCase: AccepterPropositionValeurAvancementUseCase;

  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let mesureIndicateurRepository: MockProxy<MesureIndicateurRepository>;
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let envoieEmailService: MockProxy<EnvoieEmailService>;
  let transaction: Transaction;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    mesureIndicateurRepository = mock<MesureIndicateurRepository>();
    utilisateurRepository = mock<UtilisateurRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    envoieEmailService = mock<EnvoieEmailService>();
    transaction = new InMemoryTransaction();
    accepterPropositionValeurAvancementUseCase =
      new AccepterPropositionValeurAvancementUseCase({
        indicateurTerritoireValeurEvenementRepository,
        mesureIndicateurRepository,
        utilisateurRepository,
        indicateurRepository,
        envoieEmailService,
        transaction,
      });
  });

  it("Doit accepter une proposition de valeur d'avancement et envoyer les emails aux auteurs et coordinateurs", async () => {
    // Given
    const input = {
      indicId: "IND-006",
      territoireCode: "DEPT-13",
      dateValeurAvancement: "2024-06-08",
      idAuteurAcceptation: "user-ghi",
      motif: "Motif de la proposition",
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
          dateCreation: new Date(input.dateValeurAvancement),
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
          dateCreation: new Date("2024-02-01"),
          donneesComplementaires: {
            motif: "Motif de la modification",
            sourceDonneeEtMethodeCalcul:
              "Source de la donnée et méthode de calcul",
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
    await accepterPropositionValeurAvancementUseCase.run(input);
    await new Promise((resolve) => setImmediate(resolve));

    // Then
    expect(mesureIndicateurRepository.enregistrer).toHaveBeenCalledWith({
      auteurId: input.idAuteurAcceptation,
      dateValeur: new Date("2024-06-08T00:00:00.000Z"),
      indicId: input.indicId,
      territoireCode: input.territoireCode,
      valeur: "20",
    });
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenCalledWith([
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_ACCEPTEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: new Date(input.dateValeurAvancement),
        valeur: 20,
        idAuteurModification: input.idAuteurAcceptation,
        ordre: 4,
        donneesComplementaires: { motif: "Motif de la proposition" },
      }),
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "VALEUR_MODIFIEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: new Date(input.dateValeurAvancement),
        valeur: 20,
        idAuteurModification: input.idAuteurAcceptation,
        ordre: 5,
        donneesComplementaires: undefined,
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
      templateId: 40,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurAvancement: "3",
        valeurProposee: "20",
      },
    });
    expect(
      envoieEmailService.envoieNotificationProposition,
    ).toHaveBeenCalledWith({
      destinataires: [{ email: "auteur2@example.com" }],
      templateId: 40,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurAvancement: "3",
        valeurProposee: "20",
      },
    });
    expect(
      envoieEmailService.envoieNotificationProposition,
    ).toHaveBeenCalledWith({
      destinataires: [{ email: "coordinateur2@example.com" }],
      templateId: 40,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurAvancement: "3",
        valeurProposee: "20",
      },
    });
  });
});
