import { Météo } from '@/server/domain/météo/Météo.interface';

type TableauChantiersMétéoTaille = 'md' | 'sm';

export default interface TableauChantiersMétéoProps {
  météo: Météo;
  dateDeMàjDonnéesQualitatives?: string | null;
  taille?: TableauChantiersMétéoTaille;
}

export interface TableauRéformesMétéoStyledProps {
  taille: TableauChantiersMétéoTaille;
}
