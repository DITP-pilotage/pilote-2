import { TerritoireDeBDD } from './Territoire.interface';

export default interface TerritoireRepository {
  récupérerTous(): Promise<TerritoireDeBDD[]>
}
