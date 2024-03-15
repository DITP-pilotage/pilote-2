import { PrismaClient, decision_strategique as DecisionStrategiqueModel } from '@prisma/client';
import { DecisionStrategique } from '@/server/fiche-conducteur/domain/DecisionStrategique';
import { DecisionStrategiqueRepository } from '@/server/fiche-conducteur/domain/ports/DecisionStrategiqueRepository';

const convertifEnDecisionStrategique = (decisionStrategiqueModel: DecisionStrategiqueModel): DecisionStrategique => (DecisionStrategique.creerDecisionStrategique({
  type: decisionStrategiqueModel.type,
  contenu: decisionStrategiqueModel.contenu,
  date: decisionStrategiqueModel.date.toISOString(),
})
);

export class PrismaDecisionStrategiqueRepository implements DecisionStrategiqueRepository {

  constructor(private prismaClient: PrismaClient) {}

  async listerDecisionStrategiqueParChantierId({ chantierId }: { chantierId: string }): Promise<DecisionStrategique[]> {
    const decisionStrategiqueResult = await this.prismaClient.decision_strategique.findMany({
      where: {
        chantier_id: chantierId,
      },
    });

    return decisionStrategiqueResult.map(convertifEnDecisionStrategique);
  }
}
