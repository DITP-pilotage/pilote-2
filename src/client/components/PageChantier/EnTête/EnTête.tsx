import '@gouvfr/dsfr/dist/dsfr.min.css';
import Link from 'next/link';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import Titre from '@/components/_commons/Titre/Titre';
import PageChantierEnTêteProps from './EnTête.interface';
import PageChantierEnTêteStyled from './EnTête.styled';

export default function PageChantierEnTête({
  chantier,
  afficheLeBoutonImpression = false,
  afficheLeBoutonMiseAJourDonnee = false,
}: PageChantierEnTêteProps) {
  return (
    <PageChantierEnTêteStyled className='fr-px-2w fr-px-md-4w fr-py-2w'>
      <Link
        aria-label="Retour à l'accueil"
        className='fr-link fr-fi-arrow-left-line fr-link--icon-left fr-mb-3w fr-mt-2w btn-retour'
        href='/'
      >
        Retour
      </Link>
      <Titre
        baliseHtml='h1'
        className='fr-h2 fr-mb-0'
      >
        {chantier.nom}
      </Titre>
      {
        !!afficheLeBoutonMiseAJourDonnee &&
          <Link
            className='fr-btn fr-btn--primary fr-mr-2w fr-mb-2w'
            href={`${chantier.id}/indicateurs`}
          >
            Mettre à jour les données
          </Link>
      }
      {
        !!afficheLeBoutonImpression && <BoutonImpression />
      }
    </PageChantierEnTêteStyled>
  );
}
