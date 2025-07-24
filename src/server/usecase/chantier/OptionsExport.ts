import { Maille } from '@/server/domain/maille/Maille.interface';

export interface OptionsExport {
  perimetreIds: string[],
  estBarometre: boolean,
  territorialisation: Maille[],
  listeStatuts: string[],
  listeChantierId: string[],
  listeMeteos: string[],
  listeOptionsExport: string[],
  territoireCode: string | undefined,
  estEnAlerteTauxAvancementNonCalculé: boolean
  estEnAlerteÉcart: boolean
  estEnAlerteBaisse: boolean
  estEnAlerteMétéoNonRenseignée: boolean
  estEnAlerteAbscenceTauxAvancementDepartemental: boolean
  estEnAlertePossedePropositionsValeurAvancement: boolean
}
