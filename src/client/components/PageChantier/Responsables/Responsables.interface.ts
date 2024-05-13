import {
  CoordinateurTerritorialRapportDetailleContrat,
  ResponsableLocalRapportDetailleContrat,
  ResponsableRapportDetailleContrat,
} from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import { Maille } from '@/server/domain/maille/Maille.interface';

export default interface ResponsablesPageChantierProps {
  responsables: ResponsableRapportDetailleContrat
  responsablesLocal: ResponsableLocalRapportDetailleContrat[],
  coordinateurTerritorial: CoordinateurTerritorialRapportDetailleContrat[],
  afficheResponsablesLocaux: boolean,
  maille: Maille | null
}
