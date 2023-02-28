import { Météo } from '@/server/domain/météo/Météo.interface';

export default interface RépartitionMétéoProps {
  météos: Record<Météo, number>;
}
