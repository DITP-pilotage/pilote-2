import '@gouvfr/dsfr/dist/dsfr.min.css';
import Link from 'next/link';
import Titre from '@/components/_commons/Titre/Titre';
import BoutonImpression from '@/components/_commons/BoutonImpression/BoutonImpression';
import PageProjetStructurantEnTêteProps from './EnTête.interface';
import PageProjetStructurantEnTêteStyled from './EnTête.styled';

export default function PageProjetStructurantEnTête({ nomProjetStructurant }: PageProjetStructurantEnTêteProps) {
  return (
    <PageProjetStructurantEnTêteStyled className='fr-p-4w'>
      <Link
        aria-label="Retour à l'accueil"
        className="fr-link fr-fi-arrow-left-line fr-link--icon-left"
        href='/'
      >
        Retour
      </Link>
      <Titre
        baliseHtml='h1'
        className='fr-h2 fr-my-1w'
      >
        { nomProjetStructurant }
      </Titre>
      <BoutonImpression />
    </PageProjetStructurantEnTêteStyled>
  );
}
