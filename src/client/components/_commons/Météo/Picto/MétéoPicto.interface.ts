import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface MétéoPictoProps {
  météo: Météo,
  estVisibleParLecteurDÉcran?: boolean,
}
