import Indicateur, { IndicateurMétriques } from '@/server/domain/indicateur/Indicateur.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface IndicateurBlocProps {
  indicateur: Indicateur
  indicateurMétriques: Record<CodeInsee, IndicateurMétriques>
}
