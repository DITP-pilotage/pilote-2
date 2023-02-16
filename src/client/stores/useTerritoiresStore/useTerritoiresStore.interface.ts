import { Maille, MailleInterne } from '@/server/domain/chantier/Chantier.interface';

type Territoire = {
  tracéSVG: string
  nom: string
  codeInsee: string
  codeInseeParent?: string
};

export default interface TerritoiresStore {
  départements: Territoire[] 
  régions: Territoire[] 
  mailleSélectionnée: MailleInterne,
  mailleAssociéeAuTerritoireSélectionné: Maille,
  territoireSélectionné: Territoire & {
    territoireParent?: Territoire
  },  
  actions: {
    modifierMailleSélectionnée: (maille: MailleInterne) => void,
    modifierTerritoireSélectionné: (codeInsee: string) => void,
    récupérerDétailsSurUnTerritoire: (codeInsee: string, maille: MailleInterne) => Territoire | undefined
  },
}
