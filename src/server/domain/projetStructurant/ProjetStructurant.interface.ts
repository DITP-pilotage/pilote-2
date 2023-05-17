import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface ProjetStructurant {
  id: string,
  nom: string,
  maille: MailleInterne;
  codeInsee: CodeInsee;
  territoireNomÀAfficher: string;
  périmètresIds: string[];
  avancement: number | null;
  dateAvancement: string;
  météo: Météo
  responsables: {
    ministèrePorteur: string,
    ministèresCoporteurs: string[],
    directionAdmininstration: string[],
    chefferieDeProjet: string[]
    coporteurs: string[],
  }
}
