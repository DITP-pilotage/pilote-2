import { MailleInterne } from '@/server/domain/maille/Maille.interface';

export default interface ProjetStructurant {
  id: string,
  code: string,
  nom: string,
  tauxAvancement: number;
  dateTauxAvancement: Date;
  territoireNom: string;
  maille: MailleInterne;
  directionAdministration: string; // le nom ? le code ?
  ministèresIds: string[];
}
