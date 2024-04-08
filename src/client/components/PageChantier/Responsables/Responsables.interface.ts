import Chantier from '@/server/domain/chantier/Chantier.interface';
import { responsableLocal, référentTerritorial } from '@/server/domain/territoire/Territoire.interface';

export default interface ResponsablesPageChantierProps {
  responsables: Chantier['responsables']
  responsablesLocal: responsableLocal[],
  referentTerritorial: référentTerritorial[],
  afficheResponsablesLocaux: boolean,
}
