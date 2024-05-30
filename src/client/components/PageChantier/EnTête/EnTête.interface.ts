import Chantier from '@/server/domain/chantier/Chantier.interface';

export default interface PageChantierEnTêteProps {
  chantier: Chantier
  hrefBoutonRetour: string
  afficheLeBoutonImpression?: boolean
  afficheLeBoutonMiseAJourDonnee?: boolean
  afficheLeBoutonFicheConducteur?: boolean
}
