import { Maille, TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';

export default interface SélecteurDeTerritoireProps {
  territoire: TerritoireIdentifiant | null,
  setTerritoire: (territoire: TerritoireIdentifiant) => void,
  maille: Maille,
}
