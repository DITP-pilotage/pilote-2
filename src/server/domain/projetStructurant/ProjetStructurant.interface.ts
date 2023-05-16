import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';
import { CodeInsee } from '@/server/domain/territoire/Territoire.interface';

export default interface ProjetStructurant {
  id: string,
  nom: string,
  tauxAvancement: number;
  dateTauxAvancement: string;
  territoireNomÀAfficher: string;
  codeInsee: CodeInsee;
  maille: MailleInterne;
  ministèresIds: string[];
  météo: Météo
}
