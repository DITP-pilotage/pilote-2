import { randomUUID } from 'node:crypto';
import { prisma } from '@/server/db/prisma';
import {
  PrismaDecisionStrategiqueRepository,
} from '@/server/fiche-conducteur/infrastructure/adapters/PrismaDecisionStrategiqueRepository';

describe('PrismaDecisionStrategiqueRepository', () => {
  let prismaDecisionStrategiqueRepository: PrismaDecisionStrategiqueRepository;

  beforeEach(() => {
    prismaDecisionStrategiqueRepository = new PrismaDecisionStrategiqueRepository();
  });

  describe('#listerObjectifParChantierId', () => {
    it('doit lister les decisions strategiques associé au chantier', async () => {
      // Given
      const chantierId = 'CH-168';

      await prisma.chantier_identite.createMany({ data: [{
        id: 'CH-168',
        nom: 'Nom chantier OK',
      }, {
        id: 'CH-169',
        nom: 'Nom chantier OK',
      }],
      });

      await prisma.decision_strategique.createMany({
        data: [
          {
            id: randomUUID(),
            chantier_id: 'CH-168',
            type: 'suivi_des_decisions',
            contenu: 'contenu OK suivi_des_decisions',
            auteur_id: null,
            date: new Date(),
          },
          {
            id: randomUUID(),
            chantier_id: 'CH-169',
            type: 'suivi_des_decisions',
            contenu: 'contenu KO chantier_id',
            auteur_id: null,
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
