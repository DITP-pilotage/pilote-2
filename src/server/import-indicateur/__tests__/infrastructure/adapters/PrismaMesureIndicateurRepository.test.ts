import { MesureIndicateurRepository } from '@/server/import-indicateur/domain/ports/MesureIndicateurRepository';
import { IndicateurData } from '@/server/import-indicateur/domain/IndicateurData';
import { IndicateurDataBuilder } from '@/server/import-indicateur/app/builder/IndicateurDataBuilder';

class PrismaMesureIndicateurRepository implements MesureIndicateurRepository {
  sauvegarder(listeIndicateursData: IndicateurData[]): Promise<void> {
    throw new Error('not implemented');
  }

  async recupererTout(): Promise<IndicateurData> {
    throw new Error('not implemented');
  }
}

describe('PrismaMesureIndicateurRepository', () => {
  let prismaMesureIndicateurRepository: PrismaMesureIndicateurRepository;

  beforeEach(() => {
    prismaMesureIndicateurRepository = new PrismaMesureIndicateurRepository();
  });

  describe('#sauvegarder', () => {
    it('doit sauvegarder les données', async () => {
      // GIVEN
      const listeIndicateursData = [
        new IndicateurDataBuilder()
          .avecId('b2450ce3-8006-4550-8132-e5aab19c0caf')
          .build(),
        new IndicateurDataBuilder()
          .avecId('f7632d30-5b49-465e-8774-063f9f67f83b')
          .build(),
      ];

      // WHEN
      await prismaMesureIndicateurRepository.sauvegarder(listeIndicateursData);
      // THEN
      const resultListeIndicateursData = await prismaMesureIndicateurRepository.recupererTout();
      expect(resultListeIndicateursData).toHaveLength(2);
    });
  });
});
