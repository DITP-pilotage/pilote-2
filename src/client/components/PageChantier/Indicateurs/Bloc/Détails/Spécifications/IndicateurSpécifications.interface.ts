import Indicateur from '@/server/domain/chantier/indicateur/Indicateur.interface';

export default interface IndicateurSpécificationsProps {
  description: Indicateur['description']
  modeDeCalcul: Indicateur['modeDeCalcul']
  source: Indicateur['source']
}
