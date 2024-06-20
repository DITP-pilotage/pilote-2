import { ResponsableRapportDetailleContrat } from '@/server/chantiers/app/contrats/ChantierRapportDetailleContrat';
import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface PageChantierEnTêteProps {
  chantier: Chantier
  hrefBoutonRetour: string
  responsables?: ResponsableRapportDetailleContrat
  afficheLeBoutonImpression?: boolean
  afficheLeBoutonMiseAJourDonnee?: boolean
  afficheLeBoutonFicheConducteur?: boolean
}
