import { Maille } from '@/server/domain/chantier/Chantier.interface';

export default interface SélecteurDeMailleProps {
  setMaille: (state: Maille) => void,
  maille: Maille,
  libellé?: string,
}
