import { mock, MockProxy } from "vitest-mock-extended";
import { UtilisateurIAMRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository";
import { CommentaireRepository } from "@/server/gestion-utilisateur/domain/ports/CommentaireRepository";
import { SyntheseDesResultatsRepository } from "@/server/gestion-utilisateur/domain/ports/SyntheseDesResultatsRepository";
import { DecisionStrategiqueRepository } from "@/server/gestion-utilisateur/domain/ports/DecisionStrategiqueRepository";
import { ObjectifRepository } from "@/server/gestion-utilisateur/domain/ports/ObjectifRepository";
import { RapportRepository } from "@/server/gestion-utilisateur/domain/ports/RapportRepository";
import {
  EMAIL_AUTEUR_REMPLACEMENT,
  SupprimerLesComptesDesactivesUseCase,
} from "@/server/gestion-utilisateur/usecases/SupprimerLesComptesDesactivesUseCase";
import { UtilisateurRepository } from "@/server/gestion-utilisateur/domain/ports/UtilisateurRepository";
import { IndicateurTerritoireValeurEvenementRepository } from "@/server/gestion-utilisateur/domain/ports/IndicateurTerritoireValeurEvenementRepository";
import { HistorisationModificationRepository } from "@/server/domain/historisationModification/HistorisationModificationRepository";
import { Transaction } from "@/server/db/Transaction";
import { InMemoryTransaction } from "@/server/db/InMemoryTransaction";

describe("SupprimerLesComptesDesactivesUseCase", () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let utilisateurIAMRepository: MockProxy<UtilisateurIAMRepository>;
  let commentaireRepository: MockProxy<CommentaireRepository>;
  let syntheseDesResultatsRepository: MockProxy<SyntheseDesResultatsRepository>;
  let decisionStrategiqueRepository: MockProxy<DecisionStrategiqueRepository>;
  let objectifRepository: MockProxy<ObjectifRepository>;
  let rapportRepository: MockProxy<RapportRepository>;
  let indicateurTerritoireValeurEvenementRepository: MockProxy<IndicateurTerritoireValeurEvenementRepository>;
  let historisationModification: MockProxy<HistorisationModificationRepository>;
  let transaction: Transaction;

  let supprimerLesComptesDesactivesUseCase: SupprimerLesComptesDesactivesUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    utilisateurIAMRepository = mock<UtilisateurIAMRepository>();
    syntheseDesResultatsRepository = mock<SyntheseDesResultatsRepository>();
    commentaireRepository = mock<CommentaireRepository>();
    decisionStrategiqueRepository = mock<DecisionStrategiqueRepository>();
    objectifRepository = mock<ObjectifRepository>();
    rapportRepository = mock<RapportRepository>();
    indicateurTerritoireValeurEvenementRepository =
      mock<IndicateurTerritoireValeurEvenementRepository>();
    historisationModification = mock<HistorisationModificationRepository>();
    transaction = new InMemoryTransaction();
    supprimerLesComptesDesactivesUseCase =
      new SupprimerLesComptesDesactivesUseCase({
        utilisateurRepository,
        utilisateurIAMRepository,
        syntheseDesResultatsRepository,
        commentaireRepository,
        decisionStrategiqueRepository,
        objectifRepository,
        rapportRepository,
        indicateurTerritoireValeurEvenementRepository,
        historisationModification,
        transaction,
      });
  });

  it("supprime les comptes désactivés depuis plus de 2 ans et anonymise les saisies", async () => {
    // Given
    const utilisateur1 = {
      id: "29f2c78e-2563-46b6-b363-033f7d77843b",
      email: "utilisateur.email@test.com",
    };
    const utilisateur2 = {
      id: "917ff258-bc6d-47bc-93c1-63e6a3dc63e2",
      email: "utilisateur2.email@test.com",
    };
    utilisateurRepository.recupererComptesDesactives.mockResolvedValue([
      utilisateur1,
      utilisateur2,
    ]);

    // When
    const resultat = await supprimerLesComptesDesactivesUseCase.run();

    // Then
    expect(commentaireRepository.anonymiserAuteurs).toHaveBeenCalledWith(
      [utilisateur1.id],
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    expect(commentaireRepository.anonymiserAuteurs).toHaveBeenCalledWith(
      [utilisateur2.id],
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    expect(
      syntheseDesResultatsRepository.anonymiserAuteurs,
    ).toHaveBeenCalledWith([utilisateur1.id], EMAIL_AUTEUR_REMPLACEMENT);
    expect(
      decisionStrategiqueRepository.anonymiserAuteurs,
    ).toHaveBeenCalledWith([utilisateur1.id], EMAIL_AUTEUR_REMPLACEMENT);
    expect(objectifRepository.anonymiserAuteurs).toHaveBeenCalledWith(
      [utilisateur1.id],
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    expect(
      indicateurTerritoireValeurEvenementRepository.anonymiserAuteurs,
    ).toHaveBeenCalledWith([utilisateur1.id], EMAIL_AUTEUR_REMPLACEMENT);
    expect(historisationModification.anonymiserAuteurs).toHaveBeenCalledWith(
      [utilisateur1.id],
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    expect(rapportRepository.anonymiserAuteurs).toHaveBeenCalledWith(
      [utilisateur1.email],
      EMAIL_AUTEUR_REMPLACEMENT,
    );
    expect(
      utilisateurRepository.supprimerListeUtilisateur,
    ).toHaveBeenCalledWith([utilisateur1.id]);
    expect(
      utilisateurRepository.supprimerListeUtilisateur,
    ).toHaveBeenCalledWith([utilisateur2.id]);
    expect(utilisateurIAMRepository.supprime).toHaveBeenCalledWith(
      utilisateur1.email,
    );
    expect(utilisateurIAMRepository.supprime).toHaveBeenCalledWith(
      utilisateur2.email,
    );
    expect(resultat).toEqual({
      supprimes: [utilisateur1, utilisateur2],
      erreurs: [],
    });
  });

  it("continue de traiter les autres utilisateurs si l'un d'eux échoue", async () => {
    // Given
    const utilisateurEnEchec = {
      id: "29f2c78e-2563-46b6-b363-033f7d77843b",
      email: "utilisateur.echec@test.com",
    };
    const utilisateurOk = {
      id: "917ff258-bc6d-47bc-93c1-63e6a3dc63e2",
      email: "utilisateur.ok@test.com",
    };
    utilisateurRepository.recupererComptesDesactives.mockResolvedValue([
      utilisateurEnEchec,
      utilisateurOk,
    ]);
    // L'anonymisation échoue pour le premier utilisateur (premier appel)
    commentaireRepository.anonymiserAuteurs.mockRejectedValueOnce(
      new Error("Erreur base de données"),
    );

    // When
    const resultat = await supprimerLesComptesDesactivesUseCase.run();

    // Then
    expect(resultat).toEqual({
      supprimes: [utilisateurOk],
      erreurs: [
        {
          ...utilisateurEnEchec,
          erreur: "Erreur base de données",
        },
      ],
    });
    expect(
      utilisateurRepository.supprimerListeUtilisateur,
    ).not.toHaveBeenCalledWith([utilisateurEnEchec.id]);
    expect(
      utilisateurRepository.supprimerListeUtilisateur,
    ).toHaveBeenCalledWith([utilisateurOk.id]);
  });
});
