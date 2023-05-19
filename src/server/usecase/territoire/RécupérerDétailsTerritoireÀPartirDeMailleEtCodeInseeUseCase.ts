import { TerritoireDeBDD } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';


export default class RécupérerDétailsTerritoireÀPartirDeMailleEtCodeInseeUseCase {
  constructor(
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}
    
  async run(codeInsee: TerritoireDeBDD['codeInsee'], maille: TerritoireDeBDD['maille']): Promise<TerritoireDeBDD> {
    return this.territoireRepository.récupérerÀPartirDeMailleEtCodeInsee(codeInsee, maille);
  }
}
