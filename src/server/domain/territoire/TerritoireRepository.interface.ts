import { Maille } from '@prisma/client';
import { CodeInsee, TerritoireDeBDD } from './Territoire.interface';

export default interface TerritoireRepository {
  récupérerTous(): Promise<TerritoireDeBDD[]>
  récupérer(codeInsee: CodeInsee, maille: Maille): Promise<TerritoireDeBDD>
}
