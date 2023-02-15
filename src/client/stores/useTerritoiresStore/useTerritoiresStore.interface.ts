import { MailleInterne } from '@/server/domain/chantier/Chantier.interface';

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
  territoireSélectionné: Territoire & {
    territoireParent?: Territoire
  },  
  actions: {
    modifierMailleSélectionnée: (maille: MailleInterne) => void,
    modifierTerritoireSélectionné: (territoire: string) => void,
    récupérerDétailsSurUnTerritoire: (codeInsee: string, maille: MailleInterne) => Territoire | undefined
  },
}
