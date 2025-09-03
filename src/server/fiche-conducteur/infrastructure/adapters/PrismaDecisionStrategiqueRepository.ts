import { decision_strategique as DecisionStrategiqueModel } from "@prisma/client";
import { DecisionStrategique } from "@/server/fiche-conducteur/domain/DecisionStrategique";
import { DecisionStrategiqueRepository } from "@/server/fiche-conducteur/domain/ports/DecisionStrategiqueRepository";

import { PrismaPilote } from "@/server/db/PrismaPilote";

import { PilotePrismaClient } from "@/server/db/PrismaTransaction";

const convertifEnDecisionStrategique = (
  decisionStrategiqueModel: DecisionStrategiqueModel,
): DecisionStrategique =>
  DecisionStrategique.creerDecisionStrategique({
    type: decisionStrategiqueModel.type,
    contenu: decisionStrategiqueModel.contenu,
    date: decisionStrategiqueModel.date.toISOString(),
  });

interface Dependencies {
  prisma: PrismaPilote;
}
export class PrismaDecisionStrategiqueRepository
  implements DecisionStrategiqueRepository
{
  private prisma: PilotePrismaClient;

  constructor({ prisma }: Dependencies) {
    this.prisma = prisma.getInstance();
  }

  async listerDecisionStrategiqueParChantierId({
    chantierId,
  }: {
    chantierId: string;
  }): Promise<DecisionStrategique[]> {
    const decisionStrategiqueResult =
      await this.prisma.decision_strategique.findMany({
        where: {
          chantier_id: chantierId,
        },
      });

    return decisionStrategiqueResult.map(convertifEnDecisionStrategique);
  }
}
