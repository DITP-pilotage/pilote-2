import { MessageInformation } from '@/server/gestion-contenu/domain/MessageInformation';


export interface MessageInformationContrat {
  bandeauTexte: string
  isBandeauActif: boolean
  bandeauType: string
}
export const presenterEnMessageInformationContrat = (messageInformation: MessageInformation): MessageInformationContrat => ({
  bandeauTexte: messageInformation.bandeauTexte,
  isBandeauActif: messageInformation.isBandeauActif,
  bandeauType: messageInformation.bandeauType,
});
