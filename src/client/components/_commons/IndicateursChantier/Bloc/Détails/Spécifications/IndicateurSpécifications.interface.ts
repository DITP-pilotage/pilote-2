import Indicateur from '@/server/domain/indicateur/Indicateur.interface';

export default interface IndicateurSpécificationsProps {
  description: Indicateur['description']
  modeDeCalcul: Indicateur['modeDeCalcul']
  source: Indicateur['source']
  periodicite: Indicateur['periodicite']
  delaiDisponibilite: Indicateur['delaiDisponibilite']
  dateValeurActuelle: string | null
  dateProchaineDateMaj: string | null
  dateProchaineDateValeurActuelle: string | null
}
