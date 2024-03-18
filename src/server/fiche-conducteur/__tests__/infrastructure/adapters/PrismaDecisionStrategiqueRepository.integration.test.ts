import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/infrastructure/test/integrationTestSetup';
import { PrismaDecisionStrategiqueRepository } from '@/server/fiche-conducteur/infrastructure/adapters/PrismaDecisionStrategiqueRepository';

describe('PrismaDecisionStrategiqueRepository', () => {
  let prismaDecisionStrategiqueRepository: PrismaDecisionStrategiqueRepository;

  beforeEach(() => {
    prismaDecisionStrategiqueRepository = new PrismaDecisionStrategiqueRepository(prisma);
  });

  describe('#listerObjectifParChantierId', () => {
    it('doit lister les decisions strategiques associé au chantier', async () => {
      // Given
      const chantierId = 'CH-168';
      await prisma.chantier.createMany({ data: [{
        id: 'CH-168',
        nom: 'Nom chantier OK',
        code_insee: 'FR',
        maille: 'NAT',
        territoire_code: 'NAT-FR',
      }, {
        id: 'CH-169',
        nom: 'Nom chantier OK',
        code_insee: 'FR',
        maille: 'NAT',
        territoire_code: 'NAT-FR',
      }],
      });

      await prisma.decision_strategique.createMany({
        data: [
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'suivi_des_decisions',
            contenu: 'contenu OK suivi_des_decisions',
            auteur: 'Test 1',
            date: new Date(),
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-169',
            type: 'suivi_des_decisions',
            contenu: 'contenu KO notre_ambition',
            auteur: 'Test 1',
            date: new Date(),
          },
        ],
      });
      // When
      const listeDecisionsStrategiquesResult = await prismaDecisionStrategiqueRepository.listerDecisionStrategiqueParChantierId({ chantierId });
      // Then
      expect(listeDecisionsStrategiquesResult.map(decisionStrategique => decisionStrategique.type)).toIncludeSameMembers(['suivi_des_decisions']);
      expect(listeDecisionsStrategiquesResult.map(decisionStrategique => decisionStrategique.contenu)).toIncludeSameMembers(['contenu OK suivi_des_decisions']);
    });
  });
});
