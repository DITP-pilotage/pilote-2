import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface PageChantierEnTêteProps {
  chantier: Chantier
  afficheLeBoutonImpression?: boolean
  afficheLeBoutonMiseAJourDonnee?: boolean
  afficheLeBoutonFicheConducteur?: boolean
}
