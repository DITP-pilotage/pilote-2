import { testDouble } from '@/server/utils/testUtils';
import ChantierRepository from '@/server/domain/chantier/ChantierRepository.interface';

describe('testDouble', () => {
  it('n\'implémente aucune fonction par défaut', async () => {
    const td = testDouble<ChantierRepository>();
    const when = async () => {
      await td.récupérerTous();
    };
    expect(when).rejects.toThrow(/récupérerTous is not a function/);
  });

  it('accepte un objet pour stubber des fonctions spécifiques', async () => {
    const td = testDouble<ChantierRepository>({
      récupérerTous: jest.fn().mockReturnValue([]),
    });
    const result =  await td.récupérerTous();
    expect(result).toStrictEqual([]);
  });
});
