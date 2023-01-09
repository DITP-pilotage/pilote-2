import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface IndicateurRepository {
  getByChantierId(chantierId: string): Promise<Indicateur[]>;
}
