import { Territoire } from './Territoire.interface';

export default interface TerritoireRepository {
  récupérerTous(): Promise<Territoire[]>
  récupérer(code: Territoire['code']): Promise<Territoire>
  récupérerÀPartirDeMailleEtCodeInsee(codeInsee: Territoire['codeInsee'], maille: Territoire['maille']): Promise<Territoire>
}
