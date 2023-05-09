import { MailleInterne, Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';
import { TerritoiresFiltre } from '@/server/domain/utilisateur/habilitation/Habilitation.interface';

export type TerritoireGéographique = {
  tracéSVG: string
  nom: string
  codeInsee: CodeInsee
  codeInseeParent?: CodeInsee
};

export default interface TerritoiresStore {
  départements: TerritoireGéographique[] 
  régions: TerritoireGéographique[] 
  mailleSélectionnée: MailleInterne,
  mailleAssociéeAuTerritoireSélectionné: Maille,
  territoireSélectionné: TerritoireGéographique & {
    territoireParent?: TerritoireGéographique
  },
  territoiresComparés: TerritoireGéographique[]
  aÉtéInitialisé: boolean
  actions: {
    initialiserValeursParDéfaut: (territoiresAccessiblesEnLecture: TerritoiresFiltre) => void,
    modifierMailleSélectionnée: (maille: MailleInterne) => void,
    modifierTerritoireSélectionné: (codeInsee: CodeInsee) => void,
    récupérerDétailsSurUnTerritoire: (codeInsee: CodeInsee, maille: MailleInterne) => TerritoireGéographique | undefined
    séléctionnerTerritoireÀComparer: (territoire: TerritoireGéographique) => void
    désélectionnerUnTerritoireÀComparer: (territoire: TerritoireGéographique) => void
    modifierTerritoiresComparés: (codeInsee: CodeInsee) => void
  },
}
