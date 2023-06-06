import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface IndicateurProjetStructurantRepository {
  récupérerParProjetStructurant(projetStructurantId: string): Promise<Indicateur[]>;
}
