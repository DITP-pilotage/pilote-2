import { PrismaClient } from '@prisma/client';
import { StatutProposition } from '@/server/chantiers/domain/StatutProposition';
import { PropositionValeurActuelleBuilder } from '@/server/chantiers/app/builder/PropositionValeurActuelleBuilder';
import {
  PrismaPropositionValeurActuelleRepository,
} from '@/server/chantiers/infrastructure/adapters/PrismaPropositionValeurActuelleRepository';
import { PrismaPilote } from '@/server/db/PrismaPilote';

describe('PrismaPropositionValeurActuelleRepository', () => {
  let prismaPropositionValeurActuelleRepository: PrismaPropositionValeurActuelleRepository;
  let prisma: PrismaClient;

  beforeEach(() => {
    const prismaPilote = new PrismaPilote();
    prisma = prismaPilote.getInstance();
    prismaPropositionValeurActuelleRepository = new PrismaPropositionValeurActuelleRepository({ prisma: prismaPilote });
  });

  it('doit creer la proposition de valeur actuelle', async () => {
    // Given
    const propositionValeurActuelle = new PropositionValeurActuelleBuilder()
      .avecId('c2afe41e-51df-493a-b140-b9380c625197')
      .avecIndicId('IND-002')
      .avecValeurActuelleProposee(23.2)
      .avecTerritoireCode('DEPT-87')
      .avecDateValeurActuelle(new Date('2024-03-13'))
      .avecIdAuteurModification('7d9ba603-d510-46f6-bda3-736210467521')
      .avecAuteurModification('jane.doe@test.com')
      .avecDateProposition(new Date('2024-05-13'))
      .avecMotifProposition('Un motif excellent')
      .avecSourceDonneeEtMethodeCalcul('Une source encore mieux')
      .avecStatut(StatutProposition.REFUSE)
      .build();
    // When
    await prismaPropositionValeurActuelleRepository.creerPropositionValeurActuelle(propositionValeurActuelle);
    // Then
    const propositionValeurActuelleCree = await prisma.proposition_valeur_actuelle.findFirst({
      where: {
        id: 'c2afe41e-51df-493a-b140-b9380c625197',
      },
    });

    expect(propositionValeurActuelleCree).toBeDefined();
  });
});
