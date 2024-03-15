import { ObjectifRepository } from '@/server/fiche-conducteur/domain/ports/ObjectifRepository';
import { ObjectifType } from '@/server/fiche-conducteur/domain/ObjectifType';
import { DecisionStrategiqueRepository } from '@/server/fiche-conducteur/domain/ports/DecisionStrategiqueRepository';
import { DecisionStrategiqueType } from '@/server/fiche-conducteur/domain/DecisionStrategiqueType';

interface Dependencies {
  objectifRepository: ObjectifRepository
  decisionStrategiqueRepository: DecisionStrategiqueRepository
}

export class RécupérerPublicationsUseCase {
  private objectifRepository: ObjectifRepository;

  private decisionStrategiqueRepository: DecisionStrategiqueRepository;

  constructor({ objectifRepository, decisionStrategiqueRepository }: Dependencies) {
    this.objectifRepository = objectifRepository;
    this.decisionStrategiqueRepository = decisionStrategiqueRepository;
  }

  async run({ chantierId }: { chantierId: string }): Promise<Map<ObjectifType | DecisionStrategiqueType, string>> {
    const listeObjectifs = await this.objectifRepository.listerObjectifParChantierId({ chantierId })
      .then(listeObjectifsResult => listeObjectifsResult.sort((objectif1, objectif2) => objectif1.date.localeCompare(objectif2.date)));
    const listeDecisionsStrategique = await this.decisionStrategiqueRepository.listerDecisionStrategiqueParChantierId({ chantierId })
      .then((listeDecisionsStrategiqueResult => listeDecisionsStrategiqueResult.sort((decisionStrategique1, decisionStrategique2) => decisionStrategique1.date.localeCompare(decisionStrategique2.date))));

    return [...listeObjectifs, ...listeDecisionsStrategique].reduce((acc, val) => {
      acc.set(val.type, val.contenu);
      return acc;
    }, new Map<ObjectifType | DecisionStrategiqueType, string>());
  }
}
