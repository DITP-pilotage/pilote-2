import { decision_strategique as DecisionStrategiqueModel } from '@prisma/client';
import { DecisionStrategique } from '@/server/fiche-conducteur/domain/DecisionStrategique';
import { DecisionStrategiqueRepository } from '@/server/fiche-conducteur/domain/ports/DecisionStrategiqueRepository';
import { prisma } from '@/server/db/prisma';

const convertifEnDecisionStrategique = (decisionStrategiqueModel: DecisionStrategiqueModel): DecisionStrategique => (DecisionStrategique.creerDecisionStrategique({
  type: decisionStrategiqueModel.type,
  contenu: decisionStrategiqueModel.contenu,
  date: decisionStrategiqueModel.date.toISOString(),
})
);

export class PrismaDecisionStrategiqueRepository implements DecisionStrategiqueRepository {
  async listerDecisionStrategiqueParChantierId({ chantierId }: { chantierId: string }): Promise<DecisionStrategique[]> {
    const decisionStrategiqueResult = await prisma.decision_strategique.findMany({
      where: {
        chantier_id: chantierId,
      },
    });

    return decisionStrategiqueResult.map(convertifEnDecisionStrategique);
  }
}
