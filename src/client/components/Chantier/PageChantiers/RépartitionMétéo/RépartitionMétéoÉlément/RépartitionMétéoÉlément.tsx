import Image from 'next/image';
import RépartitionMétéoÉlémentProps from './RépartitionMétéoÉlément.interface';
import RépartitionMétéoÉlémentStyled from './RépartitionMétéoÉlément.styled';

export default function RépartitionMétéoÉlément({ météo, nombreDeChantiers }: RépartitionMétéoÉlémentProps) {
  return (
    <RépartitionMétéoÉlémentStyled>
      <Image
        alt=''
        className="fr-grid-row"
        src={météo.picto}
      />
      <p className='nombre-de-chantiers fr-grid-row fr-h1 fr-mb-0'>
        {nombreDeChantiers}
      </p>
      <p className='label fr-grid-row fr-mb-0 fr-text--sm'>
        {météo.nom}
      </p>
    </RépartitionMétéoÉlémentStyled>
  );
}
