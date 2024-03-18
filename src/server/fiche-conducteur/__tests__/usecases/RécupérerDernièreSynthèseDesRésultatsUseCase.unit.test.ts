import { mock, MockProxy } from 'jest-mock-extended';
import { SynthèseDesRésultatsRepository } from '@/server/fiche-conducteur/domain/ports/SynthèseDesRésultatsRepository';
import { SyntheseDesResultatsBuilder } from '@/server/fiche-conducteur/app/builders/SyntheseDesResultatsBuilder';
import {
  RécupérerDernièreSynthèseDesRésultatsUseCase,
} from '@/server/fiche-conducteur/usecases/RécupérerDernièreSynthèseDesRésultatsUseCase';

describe('RécupérerDernièreSynthèseDesRésultatsUseCase', () => {
  let récupérerDernièreSynthèseDesRésultatsUseCase: RécupérerDernièreSynthèseDesRésultatsUseCase;
  let synthèseDesRésultatsRepository: MockProxy<SynthèseDesRésultatsRepository>;

  beforeEach(() => {
    synthèseDesRésultatsRepository = mock<SynthèseDesRésultatsRepository>();
    récupérerDernièreSynthèseDesRésultatsUseCase = new RécupérerDernièreSynthèseDesRésultatsUseCase({ synthèseDesRésultatsRepository });
  });

  it('doit remonter la dernière synthèse des résultats', async () => {
    // Given
    const chantierId = 'CH-168';
    const synthèseDesRésultats = new SyntheseDesResultatsBuilder().withMeteo('SOLEIL').withCommentaire('Un super commentaire').build();
    synthèseDesRésultatsRepository.recupererLaPlusRecenteMailleNatParChantierId.mockResolvedValue(synthèseDesRésultats);

    // When
    const synthèseDesRésultatsResult = await récupérerDernièreSynthèseDesRésultatsUseCase.run({ chantierId });

    // Then
    expect(synthèseDesRésultatsResult?.meteo).toEqual('SOLEIL');
    expect(synthèseDesRésultatsResult?.commentaire).toEqual('Un super commentaire');
  });
});
