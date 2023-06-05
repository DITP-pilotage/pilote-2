import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee, Territoire } from '@/server/domain/territoire/Territoire.interface';

export default interface ProjetStructurant {
  id: string,
  nom: string,
  périmètresIds: string[];
  avancement: number | null;
  dateAvancement: string;
  météo: Météo
  territoire: {
    code: Territoire['code']
    maille: MailleInterne;
    codeInsee: CodeInsee;
    nomAffiché: string;
  }
  responsables: {
    ministèrePorteur: string,
    ministèresCoporteurs: string[],
    directionAdmininstration: string[],
    chefferieDeProjet: string[]
    coporteurs: string[],
  }
}

export interface ProjetStructurantVueDEnsemble {
  id: string;
  nom: string;
  maille: MailleInterne;
  codeInsee: CodeInsee;
  territoireNomÀAfficher: string;
  périmètresIds: string[];
  avancement: number | null;
  dateAvancement: string;
  météo: Météo
}
