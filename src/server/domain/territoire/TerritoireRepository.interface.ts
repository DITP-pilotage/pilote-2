import { TerritoireDeBDD } from './Territoire.interface';

export default interface TerritoireRepository {
  récupérerTous(): Promise<TerritoireDeBDD[]>
  récupérer(code: TerritoireDeBDD['code']): Promise<TerritoireDeBDD>
  récupérerÀPartirDeMailleEtCodeInsee(codeInsee: TerritoireDeBDD['codeInsee'], maille: TerritoireDeBDD['maille']): Promise<TerritoireDeBDD>
}
