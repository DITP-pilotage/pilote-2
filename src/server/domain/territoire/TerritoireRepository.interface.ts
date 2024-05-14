import { Territoire } from './Territoire.interface';

export default interface TerritoireRepository {
  récupérerTous(): Promise<Territoire[]>
  récupérerTousNew(maille: string): Promise<Territoire[]>
  récupérer(code: Territoire['code']): Promise<Territoire>
  récupérerÀPartirDeMailleEtCodeInsee(codeInsee: Territoire['codeInsee'], maille: Territoire['maille']): Promise<Territoire>
  récupérerListe(codes: Territoire['code'][]): Promise<Territoire[]>
}
