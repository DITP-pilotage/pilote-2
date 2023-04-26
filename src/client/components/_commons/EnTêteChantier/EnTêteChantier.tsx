import Titre from '@/client/components/_commons/Titre/Titre';
import EnTêteChantierProps from './EnTêteChantier.interface';
import EnTêteChantierStyled from './EnTêteChantier.styled';

export default function EnTêteChantier({ nom, axe, ppg }: EnTêteChantierProps) {
  return (
    <EnTêteChantierStyled>
      <Titre
        baliseHtml='h1'
        className='fr-h2 fr-mb-1w'
      >
        { nom }
      </Titre>
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
    </EnTêteChantierStyled>
  );
}
