import '@gouvfr/dsfr/dist/dsfr.min.css';
import Link from 'next/link';
import Titre from '@/components/_commons/Titre/Titre';
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
      <div className='fr-mt-2w'>
        <Titre baliseHtml='h1'>
          {chantier.nom}
        </Titre>
        <div className='fr-text--xs fr-mb-0'>
          <p className='fr-mb-0 fr-text--xs chantier-données-propriété'>
            Axe
          </p>
          <p className='fr-mb-1w fr-text--xs chantier-données-valeur'>
            Non renseigné
          </p>
          <p className='fr-mb-0 fr-text--xs chantier-données-propriété'>
            Politique Prioritaire du Gouvernement
          </p>
          <p className='fr-mb-0 fr-text--xs chantier-données-valeur'>
            Non renseigné
          </p>
        </div>
      </div>
    </PageChantierEnTêteStyled>
  );
}
