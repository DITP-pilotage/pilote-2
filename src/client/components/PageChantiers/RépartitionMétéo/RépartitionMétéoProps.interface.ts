import Météo from '@/server/domain/chantier/Météo.interface';

export default interface RépartitionMétéoProps {
  météos: Record<Météo, number>;
}
