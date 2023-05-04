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
      <p className='fr-mb-1w fr-text--xs'>
        <span className='chantier-données-propriété'>
          Axe
        </span>
        <span className='fr-ml-1w chantier-données-valeur'>
          { axe }
        </span>
      </p>
      <p className='fr-mb-0 fr-text--xs'>
        <span className='chantier-données-propriété'>
          PPG
        </span>
        <span className='fr-ml-1w chantier-données-valeur'>
          { ppg }
        </span>
      </p>
    </EnTêteChantierStyled>
  );
}
