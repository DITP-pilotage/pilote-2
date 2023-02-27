import Indicateur, { IndicateurMétriques } from '@/server/domain/indicateur/Indicateur.interface';

export default interface IndicateurBlocProps {
  indicateur: Indicateur
  indicateurMétriques: IndicateurMétriques
}
