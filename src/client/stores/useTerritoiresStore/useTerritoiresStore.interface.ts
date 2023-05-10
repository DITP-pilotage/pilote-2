import { MailleInterne, Maille } from '@/server/domain/maille/Maille.interface';
import { CodeInsee, DétailTerritoire } from '@/server/domain/territoire/Territoire.interface';

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
  territoires: DétailTerritoire[]
  territoiresAccessiblesEnLecture: DétailTerritoire[]
  territoiresAccessiblesEnSaisiePublication: DétailTerritoire[]
  territoiresAccessiblesEnSaisieIndicateur: DétailTerritoire[]
  territoiresComparés: TerritoireGéographique[]
  maillesAccessiblesEnLecture: Maille[],
  aÉtéInitialisé: boolean
  actions: {
    initialiserLesTerritoires: (territoires: DétailTerritoire[]) => void,
    initialiserLaMailleSélectionnéeParDéfaut: () => void,
    générerCodeTerritoire: (maille: Maille, codeInsee: CodeInsee) => string,
    modifierMailleSélectionnée: (maille: MailleInterne) => void,
    modifierTerritoireSélectionné: (codeInsee: CodeInsee) => void,
    récupérerDétailsSurUnTerritoire: (codeInsee: CodeInsee, maille: MailleInterne) => TerritoireGéographique | undefined
    séléctionnerTerritoireÀComparer: (territoire: TerritoireGéographique) => void
    désélectionnerUnTerritoireÀComparer: (territoire: TerritoireGéographique) => void
    modifierTerritoiresComparés: (codeInsee: CodeInsee) => void
  },
}
