import { Météo } from '@/server/domain/météo/Météo.interface';

export type RépartitionMétéos = Record<Météo, number>;

export default interface RépartitionMétéoProps {
  météos: RépartitionMétéos;
}
