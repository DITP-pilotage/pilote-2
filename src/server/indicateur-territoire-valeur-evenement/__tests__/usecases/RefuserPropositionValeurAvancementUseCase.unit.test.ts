import { MockProxy, mock } from "jest-mock-extended";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { EvenementsSurDate } from "@/server/import-indicateur/domain/EvenementsSurDate";
import { RefuserPropositionValeurAvancementUseCase } from "@/server/indicateur-territoire-valeur-evenement/usecases/RefuserPropositionValeurAvancementUseCase";
import { IndicateurTerritoireValeurEvenement } from "@/server/indicateur-territoire-valeur-evenement/domain/IndicateurTerritoireValeurEvenement";
import { Transaction } from "@/server/db/Transaction";
import { IndicateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/IndicateurRepository";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";
import { UtilisateurRepository } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/UtilisateurRepository";
import { EnvoieEmailService } from "@/server/indicateur-territoire-valeur-evenement/domain/ports/EnvoieEmailService";

describe("RefuserPropositionValeurAvancementUseCase", () => {
  let refuserPropositionValeurAvancementUseCase: RefuserPropositionValeurAvancementUseCase;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let indicateurRepository: MockProxy<IndicateurRepository>;
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let envoieEmailService: MockProxy<EnvoieEmailService>;
  let transaction: Transaction;

  beforeEach(() => {
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    indicateurRepository = mock<IndicateurRepository>();
    utilisateurRepository = mock<UtilisateurRepository>();
    envoieEmailService = mock<EnvoieEmailService>();
    transaction = new InMemoryTransaction();
    refuserPropositionValeurAvancementUseCase =
      new RefuserPropositionValeurAvancementUseCase({
        indicateurTerritoireValeurEvenementRepository,
        indicateurRepository,
        utilisateurRepository,
        transaction,
        envoieEmailService,
      });
  });

  it("Doit refuser une proposition de valeur d'avancement et envoyer les emails aux auteurs et coordinateurs de département", async () => {
    // Given
    const input = {
      indicId: "IND-006",
      territoireCode: "DEPT-13",
      dateValeurAvancement: "2024-06-08",
      idAuteurRefus: "user-ghi",
      motif: "Motif du refus",
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
          dateCreation: new Date("2024-01-01"),
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
          dateCreation: new Date("2024-01-01"),
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
            motif: "motif de la modification",
            sourceDonneeEtMethodeCalcul: "source et methode",
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
    await refuserPropositionValeurAvancementUseCase.run(input);
    await new Promise((resolve) => setImmediate(resolve));

    // Then
    expect(
      indicateurTerritoireValeurEvenementRepository.enregistrerTous,
    ).toHaveBeenCalledWith([
      expect.objectContaining({
        indicId: input.indicId,
        territoireCode: input.territoireCode,
        typeEvenement: "PROPOSITION_VALEUR_REFUSEE",
        typeValeur: "VALEUR_AVANCEMENT",
        dateValeur: new Date(input.dateValeurAvancement),
        valeur: 20,
        idAuteurModification: input.idAuteurRefus,
        ordre: 4,
        donneesComplementaires: { motif: "Motif du refus" },
      }),
    ]);
    expect(
      indicateurRepository.supprimerTauxAvancementProposition,
    ).toHaveBeenCalledWith({
      indicId: input.indicId,
      territoireCode: input.territoireCode,
    });

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
      templateId: 42,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurAvancement: "3",
        valeurProposee: "20",
        motifRefus: "Motif du refus",
      },
    });
    expect(
      envoieEmailService.envoieNotificationProposition,
    ).toHaveBeenCalledWith({
      destinataires: [{ email: "auteur2@example.com" }],
      templateId: 42,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurAvancement: "3",
        valeurProposee: "20",
        motifRefus: "Motif du refus",
      },
    });
    expect(
      envoieEmailService.envoieNotificationProposition,
    ).toHaveBeenCalledWith({
      destinataires: [{ email: "coordinateur2@example.com" }],
      templateId: 42,
      parametres: {
        chantierId: "CH-001",
        chantierNom: "Nom du chantier",
        indicateurId: input.indicId,
        indicateurNom: "Nom de l'indicateur",
        dateValeur: "06-2024",
        valeurAvancement: "3",
        valeurProposee: "20",
        motifRefus: "Motif du refus",
      },
    });
  });
});
