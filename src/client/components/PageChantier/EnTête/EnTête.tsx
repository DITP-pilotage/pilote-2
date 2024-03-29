import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-document/icons-document.min.css';
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
  afficheLeBoutonFicheConducteur = false,
}: PageChantierEnTêteProps) {
  return (
    <PageChantierEnTêteStyled className='fr-px-2w fr-px-md-2w fr-py-2w'>
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
      <div className='flex align-center fr-mt-2w'>
        {
          !!afficheLeBoutonMiseAJourDonnee &&
            <Link
              className='fr-btn fr-btn--primary fr-mr-2w'
              href={`${chantier.id}/indicateurs`}
            >
              Mettre à jour les données
            </Link>
        }
        {
          !!afficheLeBoutonImpression && <BoutonImpression />
        }
        {
          afficheLeBoutonFicheConducteur ? (
            <Link
              className='fr-btn fr-btn--secondary fr-icon-article-line fr-btn--icon-left fr-px-1w fr-px-md-2w fr-ml-2w'
              href={`${chantier.id}/fiche-conducteur`}
            >
              Fiche conducteur
            </Link>
          ) : null
        }
      </div>
    </PageChantierEnTêteStyled>
  );
}
