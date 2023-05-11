import { MailleInterne } from '@/server/domain/maille/Maille.interface';
import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface ProjetStructurant {
  id: string,
  nom: string,
  tauxAvancement: number;
  dateTauxAvancement: string;
  territoireNom: string;
  maille: MailleInterne;
  ministèresIds: string[];
  météo: Météo
}
