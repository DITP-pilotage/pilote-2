import '@gouvfr/dsfr/dist/dsfr.min.css';
import Link from 'next/link';
import EnTêteChantier from '@/components/_commons/EnTêteChantier/EnTêteChantier';
import PageChantierEnTêteProps from './PageChantierEnTête.interface';
import PageChantierEnTêteStyled from './PageChantierEnTête.styled';

export default function PageChantierEnTête({ chantier }: PageChantierEnTêteProps) {
  return (
    <PageChantierEnTêteStyled className='fr-p-4w'>
      <Link
        aria-label="Retour à l'accueil"
        className="fr-link fr-fi-arrow-left-line fr-link--icon-left"
        href='/'
      >
        Retour
      </Link>
      <div className="fr-mt-2w">
        <EnTêteChantier
          axe={chantier.axe}
          nom={chantier.nom}
          ppg={chantier.ppg}
        />
      </div>
      <button
        className='fr-btn fr-btn--secondary fr-mt-3w bouton-impression'
        onClick={() => window.print()}
        type='button'
      >
        <span
          aria-hidden="true"
          className="fr-icon-download-line"
        />
        {' '}
        Exporter
      </button>
    </PageChantierEnTêteStyled>
  );
}
