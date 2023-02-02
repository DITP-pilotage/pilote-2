import { getLibelléMétéo, PictoMétéo } from '@/components/_commons/PictoMétéo/PictoMétéo';
import RépartitionMétéoÉlémentProps from './RépartitionMétéoÉlément.interface';
import RépartitionMétéoÉlémentStyled from './RépartitionMétéoÉlément.styled';

export default function RépartitionMétéoÉlément({ météo, nombreDeChantiers }: RépartitionMétéoÉlémentProps) {
  return (
    <RépartitionMétéoÉlémentStyled>
      <div className="fr-grid-row">
        <PictoMétéo
          valeur={météo}
        />
      </div>
      <p className='nombre-de-chantiers fr-grid-row fr-h1 fr-mb-0'>
        {nombreDeChantiers}
      </p>
      <p className='label fr-grid-row fr-mb-0 fr-text--sm'>
        {getLibelléMétéo(météo)}
      </p>
    </RépartitionMétéoÉlémentStyled>
  );
}
