import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import {
  PrismaHistorisationModificationRepository,
} from '@/server/infrastructure/accès_données/historisationModification/PrismaHistorisationModificationRepository';
import { HistorisationModificationCreationBuilder } from '@/server/app/builders/HistorisationModificationCreationBuilder';
import { PrismaPilote } from '@/server/db/PrismaPilote';

describe('HistorisationModificationSQLRepository', () => {
  let prisma: PrismaClient;
  let historisationModificationSQLRepository: PrismaHistorisationModificationRepository;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();
    historisationModificationSQLRepository = new PrismaHistorisationModificationRepository({ prisma: prismaPilote });
  });

  test('doit sauvegarder une nouvelle création', async () => {
    // Given
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

    // When
    await historisationModificationSQLRepository.sauvegarderModificationHistorisation(historisationModification);
    await historisationModificationSQLRepository.sauvegarderModificationHistorisation(historisationModification2);
    
    // Then
    const listeHistorisationModification = await prisma.historisation_modification.findMany();

    expect(listeHistorisationModification).toHaveLength(2);
  });
});
