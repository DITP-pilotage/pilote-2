import { Territoire } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';


export default class RécupérerDétailsTerritoireÀPartirDeMailleEtCodeInseeUseCase {
  constructor(
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}
    
  async run(codeInsee: Territoire['codeInsee'], maille: Territoire['maille']): Promise<Territoire> {
    return this.territoireRepository.récupérerÀPartirDeMailleEtCodeInsee(codeInsee, maille);
  }
}
