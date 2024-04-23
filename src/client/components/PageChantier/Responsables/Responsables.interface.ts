import {
  ReferentTerritorialRapportDetailleContrat,
  ResponsableLocalRapportDetailleContrat,
  ResponsableRapportDetailleContrat,
} from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';

export default interface ResponsablesPageChantierProps {
  responsables: ResponsableRapportDetailleContrat
  responsablesLocal: ResponsableLocalRapportDetailleContrat[],
  referentTerritorial: ReferentTerritorialRapportDetailleContrat[],
  afficheResponsablesLocaux: boolean,
}
