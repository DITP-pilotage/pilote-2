import { Territoire } from './Territoire.interface';

export interface TerritoireRepository {
  récupérerTous(): Promise<Territoire[]>
  récupérerTousNew(): Promise<Territoire[]>
  récupérer(code: Territoire['code']): Promise<Territoire>
  récupérerListe(codes: Territoire['code'][]): Promise<Territoire[]>
}
