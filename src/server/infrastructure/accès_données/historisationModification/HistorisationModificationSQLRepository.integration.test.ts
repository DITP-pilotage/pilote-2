import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  HistorisationModificationSQLRepository,
} from '@/server/infrastructure/accès_données/historisationModification/HistorisationModificationSQLRepository';
import { HistorisationModificationCreationBuilder } from '@/server/app/builders/HistorisationModificationCreationBuilder';

describe('HistorisationModificationSQLRepository', () => {
  let historisationModificationSQLRepository: HistorisationModificationSQLRepository;
  beforeEach(() => {
    historisationModificationSQLRepository = new HistorisationModificationSQLRepository(prisma);
  });
  test('doit sauvegarder une nouvelle création', async () => {
    // GIVEN
    const historisationModification = new HistorisationModificationCreationBuilder()
      .withId(randomUUID())
      .withTableModifieId('metadata_indicateurs')
      .withNouvelleValeur({ indic_hidden_pilote: true })
      .build();
    const historisationModification2 = new HistorisationModificationCreationBuilder()
      .withId(randomUUID())
      .withTableModifieId('metadata_indicateurs')
      .withNouvelleValeur({ indic_hidden_pilote: false })
      .build();
    // WHEN
    await historisationModificationSQLRepository.sauvegarderModificationCreation(historisationModification);
    await historisationModificationSQLRepository.sauvegarderModificationCreation(historisationModification2);
    // THEN
    const listeHistorisationModification = await prisma.historisation_modification.findMany();

    expect(listeHistorisationModification).toHaveLength(2);
  });
});
