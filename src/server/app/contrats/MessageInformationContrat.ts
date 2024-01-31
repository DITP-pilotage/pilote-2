import { MessageInformation } from '@/server/gestion-contenu/domain/MessageInformation';


export interface MessageInformationContrat {
  bandeauTexte: string
  isBandeauActif: boolean
  bandeauType: string
}
export const presenterEnMessageInformationContrat = (messageInformation: MessageInformation): MessageInformationContrat => ({
  bandeauTexte: messageInformation.bandeauTexte || 'Des opérations de maintenance sont en cours et peuvent perturber le fonctionnement normal de PILOTE. En cas de difficultés : support.ditp@modernisation.gouv.fr',
  bandeauType: messageInformation.bandeauType || 'WARNING',
  isBandeauActif: messageInformation.isBandeauActif || false,
});
