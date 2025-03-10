import { mock, MockProxy } from 'jest-mock-extended';
import UtilisateurRepository from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository.interface';
import { UtilisateurIAMRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurIAMRepository';
import { CommentaireRepository } from '@/server/gestion-utilisateur/domain/ports/CommentaireRepository';
import { SyntheseDesResultatsRepository } from '@/server/gestion-utilisateur/domain/ports/SyntheseDesResultatsRepository';
import { DecisionStrategiqueRepository } from '@/server/gestion-utilisateur/domain/ports/DecisionStrategiqueRepository';
import { ObjectifRepository } from '@/server/gestion-utilisateur/domain/ports/ObjectifRepository';
import { RapportRepository } from '@/server/gestion-utilisateur/domain/ports/RapportRepository';
import { EMAIL_AUTEUR_REMPLACEMENT, SupprimerLesComptesDesactivesUseCase } from '@/server/gestion-utilisateur/usecases/SupprimerLesComptesDesactivesUseCase';

describe('SupprimerLesComptesDesactivesUseCase', () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let utilisateurIAMRepository: MockProxy<UtilisateurIAMRepository>;
  let commentaireRepository: MockProxy<CommentaireRepository>;
  let syntheseDesResultatsRepository: MockProxy<SyntheseDesResultatsRepository>;
  let decisionStrategiqueRepository: MockProxy<DecisionStrategiqueRepository>;
  let objectifRepository: MockProxy<ObjectifRepository>;
  let rapportRepository: MockProxy<RapportRepository>;

  let supprimerLesComptesDesactivesUseCase: SupprimerLesComptesDesactivesUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    utilisateurIAMRepository = mock<UtilisateurIAMRepository>();
    syntheseDesResultatsRepository = mock<SyntheseDesResultatsRepository>();
    commentaireRepository = mock<CommentaireRepository>();
    decisionStrategiqueRepository = mock<DecisionStrategiqueRepository>();
    objectifRepository = mock<ObjectifRepository>();
    rapportRepository = mock<RapportRepository>();
    supprimerLesComptesDesactivesUseCase = new SupprimerLesComptesDesactivesUseCase({ utilisateurRepository, utilisateurIAMRepository, syntheseDesResultatsRepository, commentaireRepository, decisionStrategiqueRepository, objectifRepository, rapportRepository });
  });
  it('Supprime les comptes qui sont désactivés depuis plus de 2 ans et anonymise les saisies', async () => {
    // Given
    const utilisateursAsupprimer = [{ id: '29f2c78e-2563-46b6-b363-033f7d77843b', email: 'utilisateur.email@test.com' }, { id: '917ff258-bc6d-47bc-93c1-63e6a3dc63e2', email: 'utilisateur2.email@test.com' }];
    const utilisateurAsupprimerId = utilisateursAsupprimer.map(utilisateur => utilisateur.id);
    utilisateurRepository.recupererComptesInactifs.mockResolvedValue(utilisateursAsupprimer);
  
    // When
    const utilisateursSupprimes = await supprimerLesComptesDesactivesUseCase.run();

    // Then
    expect(commentaireRepository.anonymiserAuteurs).toHaveBeenCalledWith(utilisateurAsupprimerId, EMAIL_AUTEUR_REMPLACEMENT);
    expect(syntheseDesResultatsRepository.anonymiserAuteurs).toHaveBeenCalledWith(utilisateurAsupprimerId, EMAIL_AUTEUR_REMPLACEMENT);
    expect(objectifRepository.anonymiserAuteurs).toHaveBeenCalledWith(utilisateurAsupprimerId, EMAIL_AUTEUR_REMPLACEMENT);
    expect(decisionStrategiqueRepository.anonymiserAuteurs).toHaveBeenCalledWith(utilisateurAsupprimerId, EMAIL_AUTEUR_REMPLACEMENT);
    expect(rapportRepository.anonymiserAuteurs).toHaveBeenCalledWith(utilisateursAsupprimer.map(utilisateur => utilisateur.email), EMAIL_AUTEUR_REMPLACEMENT);
    expect(utilisateurRepository.supprimerListeUtilisateur).toHaveBeenCalledWith(utilisateurAsupprimerId);
    expect(utilisateurIAMRepository.supprime).toHaveBeenCalledTimes(2);
    expect(utilisateurIAMRepository.supprime).toHaveBeenNthCalledWith(1, utilisateursAsupprimer[0].email);
    expect(utilisateurIAMRepository.supprime).toHaveBeenNthCalledWith(2, utilisateursAsupprimer[1].email);
    expect(utilisateursSupprimes).toStrictEqual(utilisateursAsupprimer);
  });
});
