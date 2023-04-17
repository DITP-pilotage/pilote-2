import Titre from '@/client/components/_commons/Titre/Titre';
import EnTêteChantierProps from './EnTêteChantier.interface';
import EnTêteChantierStyled from './EnTêteChantier.styled';

export default function EnTêteChantier({ nom, axe, ppg }: EnTêteChantierProps) {
  return (
    <EnTêteChantierStyled className='fr-mt-2w'>
      <Titre baliseHtml='h1'>
        { nom }
      </Titre>
      <div className='fr-text--xs fr-mb-0'>
        <p className='fr-mb-0 fr-text--xs chantier-données-propriété'>
          Axe
        </p>
        <p className='fr-mb-1w fr-text--xs chantier-données-valeur'>
          { axe }
        </p>
        <p className='fr-mb-0 fr-text--xs chantier-données-propriété'>
          Politique Prioritaire du Gouvernement
        </p>
        <p className='fr-mb-0 fr-text--xs chantier-données-valeur'>
          { ppg }
        </p>
      </div>
    </EnTêteChantierStyled>
  );
}
