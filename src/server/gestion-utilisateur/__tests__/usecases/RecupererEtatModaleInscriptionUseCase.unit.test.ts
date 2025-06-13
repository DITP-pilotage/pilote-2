import { mock, MockProxy } from 'jest-mock-extended';
import { UtilisateurRepository } from '@/server/gestion-utilisateur/domain/ports/UtilisateurRepository';
import { RecupererEtatModaleInscriptionUseCase } from '@/server/gestion-utilisateur/usecases/RecupererEtatModaleInscriptionUseCase';

describe('RecupererEtatModaleInscriptionUseCase', () => {
  let utilisateurRepository: MockProxy<UtilisateurRepository>;
  let recupererEtatModaleInscriptionUseCase: RecupererEtatModaleInscriptionUseCase;

  beforeEach(() => {
    utilisateurRepository = mock<UtilisateurRepository>();
    recupererEtatModaleInscriptionUseCase = new RecupererEtatModaleInscriptionUseCase({
      utilisateurRepository,
    });
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-06-17T08:06:12.411Z'));
  });

  it("Si l'utilisateur n'a pas déjà visionné la vidéo d'accueil retourne faux", async () => {
    // Given
    utilisateurRepository.recupererEtatVisualisationVideoAccueil.mockResolvedValue(false);
    utilisateurRepository.recupererDateInscriptionInfolettre.mockResolvedValue(null);
    utilisateurRepository.recupererDateVisualisationPopupInfolettre.mockResolvedValue(null);

    // When
    const etatModale = await recupererEtatModaleInscriptionUseCase.execute('64e406e8-26b4-4556-8858-289f8d3b3c4c');

    // Then
    expect(etatModale).toBeFalse();
  });

  it("Si l'utilisateur a déjà visionné la vidéo d'accueil, n'a jamais visualisé le popup d'inscription et n'est pas inscrit, retourne vrai", async () => {
    // Given
    utilisateurRepository.recupererEtatVisualisationVideoAccueil.mockResolvedValue(true);
    utilisateurRepository.recupererDateInscriptionInfolettre.mockResolvedValue(null);
    utilisateurRepository.recupererDateVisualisationPopupInfolettre.mockResolvedValue(null);

    // When
    const etatModale = await recupererEtatModaleInscriptionUseCase.execute('64e406e8-26b4-4556-8858-289f8d3b3c4c');

    // Then
    expect(etatModale).toBeTrue();
  });

  it("Si l'utilisateur a déjà visionné la vidéo d'accueil, a visualisé le popup d'inscription il y a moins de 6 mois et est inscrit, retourne faux", async () => {
    // Given
    utilisateurRepository.recupererEtatVisualisationVideoAccueil.mockResolvedValue(true);
    utilisateurRepository.recupererDateInscriptionInfolettre.mockResolvedValue(new Date('2025-05-06'));
    utilisateurRepository.recupererDateVisualisationPopupInfolettre.mockResolvedValue(new Date('2025-05-06'));

    // When
    const etatModale = await recupererEtatModaleInscriptionUseCase.execute('64e406e8-26b4-4556-8858-289f8d3b3c4c');

    // Then
    expect(etatModale).toBeFalse();
  });

  it("Si l'utilisateur a déjà visionné la vidéo d'accueil, a visualisé le popup d'inscription il y a moins de 6 mois et n'est pas inscrit, retourne faux", async () => {
    // Given
    utilisateurRepository.recupererEtatVisualisationVideoAccueil.mockResolvedValue(true);
    utilisateurRepository.recupererDateInscriptionInfolettre.mockResolvedValue(null);
    utilisateurRepository.recupererDateVisualisationPopupInfolettre.mockResolvedValue(new Date('2025-05-06'));

    // When
    const etatModale = await recupererEtatModaleInscriptionUseCase.execute('64e406e8-26b4-4556-8858-289f8d3b3c4c');

    // Then
    expect(etatModale).toBeFalse();
  });

  it("Si l'utilisateur a déjà visionné la vidéo d'accueil, a visualisé le popup d'inscription il y a plus de 6 mois et n'est pas inscrit, retourne vrai", async () => {
    // Given
    utilisateurRepository.recupererEtatVisualisationVideoAccueil.mockResolvedValue(true);
    utilisateurRepository.recupererDateInscriptionInfolettre.mockResolvedValue(null);
    utilisateurRepository.recupererDateVisualisationPopupInfolettre.mockResolvedValue(new Date('2024-05-06'));

    // When
    const etatModale = await recupererEtatModaleInscriptionUseCase.execute('64e406e8-26b4-4556-8858-289f8d3b3c4c');

    // Then
    expect(etatModale).toBeTrue();
  });

  it("Si l'utilisateur a déjà visionné la vidéo d'accueil, a visualisé le popup d'inscription il y a plus de 6 mois et est pas inscrit, retourne faux", async () => {
    // Given
    utilisateurRepository.recupererEtatVisualisationVideoAccueil.mockResolvedValue(true);
    utilisateurRepository.recupererDateInscriptionInfolettre.mockResolvedValue(new Date('2024-05-06'));
    utilisateurRepository.recupererDateVisualisationPopupInfolettre.mockResolvedValue(new Date('2024-05-06'));

    // When
    const etatModale = await recupererEtatModaleInscriptionUseCase.execute('64e406e8-26b4-4556-8858-289f8d3b3c4c');

    // Then
    expect(etatModale).toBeFalse();
  });

});
