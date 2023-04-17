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
      <EnTêteChantier
        axe={chantier.axe}
        nom={chantier.nom}
        ppg={chantier.ppg}
      />
    </PageChantierEnTêteStyled>
  );
}
