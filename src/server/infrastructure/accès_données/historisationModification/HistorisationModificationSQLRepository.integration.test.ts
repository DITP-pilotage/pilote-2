import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import {
  PrismaHistorisationModificationRepository,
} from '@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository';
import { HistorisationModificationCreationBuilder } from '@/server/app/builders/HistorisationModificationCreationBuilder';

describe('HistorisationModificationSQLRepository', () => {
  let historisationModificationSQLRepository: PrismaHistorisationModificationRepository;
  beforeEach(() => {
    historisationModificationSQLRepository = new PrismaHistorisationModificationRepository(prisma);
  });
  test('doit sauvegarder une nouvelle création', async () => {
    // GIVEN
    const historisationModification = new HistorisationModificationCreationBuilder()
      .withId(randomUUID())
      .withTableModifieId('metadata_indicateurs')
      .withNouvelleValeur({ indicId: 'unId', indicHiddenPilote: true })
      .build();
    const historisationModification2 = new HistorisationModificationCreationBuilder()
      .withId(randomUUID())
      .withTableModifieId('metadata_indicateurs')
      .withNouvelleValeur({ indicId: 'unId2', indicHiddenPilote: false })
      .build();
    // WHEN
    await historisationModificationSQLRepository.sauvegarderModificationHistorisation(historisationModification);
    await historisationModificationSQLRepository.sauvegarderModificationHistorisation(historisationModification2);
    // THEN
    const listeHistorisationModification = await prisma.historisation_modification.findMany();

    expect(listeHistorisationModification).toHaveLength(2);
  });
});
