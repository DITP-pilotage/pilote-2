import {
  CoordinateurTerritorialRapportDetailleContrat,
  ResponsableLocalRapportDetailleContrat,
  ResponsableRapportDetailleContrat,
} from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

export default interface ResponsablesPageChantierProps {
  responsables: ResponsableRapportDetailleContrat
  responsablesLocal: ResponsableLocalRapportDetailleContrat[],
  coordinateurTerritorial: CoordinateurTerritorialRapportDetailleContrat[],
  afficheResponsablesLocaux: boolean,
}
