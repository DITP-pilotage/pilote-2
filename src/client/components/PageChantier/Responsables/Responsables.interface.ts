import Chantier from '@/server/domain/chantier/Chantier.interface';
import Utilisateur from '@/server/domain/utilisateur/Utilisateur.interface';

export default interface ResponsablesPageChantierProps {
  responsables: Chantier['responsables']
  responsablesLocal: Utilisateur[],
  referentTerritorial: Utilisateur[],
  afficheResponsablesLocaux: boolean,
}
