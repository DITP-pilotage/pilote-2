import { Maille } from '@prisma/client';
import { CodeInsee, TerritoireDeBDD } from '@/server/domain/territoire/Territoire.interface';
import TerritoireRepository from '@/server/domain/territoire/TerritoireRepository.interface';
import { dependencies } from '@/server/infrastructure/Dependencies';


export default class RécupérerDétailsTerritoireUseCase {
  constructor(
    private readonly territoireRepository: TerritoireRepository = dependencies.getTerritoireRepository(),
  ) {}
    
  async run(codeInsee: CodeInsee, maille: Maille): Promise<TerritoireDeBDD> {
    return this.territoireRepository.récupérer(codeInsee, maille);
  }
}
