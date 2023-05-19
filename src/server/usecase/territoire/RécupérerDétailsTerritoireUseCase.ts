import { TerritoireDeBDD } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';


export default class RécupérerDétailsTerritoireUseCase {
  constructor(
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}
    
  async run(code: TerritoireDeBDD['code']): Promise<TerritoireDeBDD> {
    return this.territoireRepository.récupérer(code);
  }
}
