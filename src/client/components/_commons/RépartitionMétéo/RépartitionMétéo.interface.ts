import { MétéoSaisissable } from '@/server/domain/météo/Météo.interface';

export type RépartitionMétéos = Record<MétéoSaisissable, number>;

export default interface RépartitionMétéoProps {
  météos: RépartitionMétéos;
}
