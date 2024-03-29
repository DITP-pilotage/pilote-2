import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos } from '@/server/domain/météo/Météo.interface';
import { typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';
import RépartitionMétéoÉlémentProps from './RépartitionMétéoÉlément.interface';
import RépartitionMétéoÉlémentStyled from './RépartitionMétéoÉlément.styled';

export default function RépartitionMétéoÉlément({ météo, nombreDeChantiers }: RépartitionMétéoÉlémentProps) {
  const typeDeRéforme = typeDeRéformeSélectionnéeStore();
  return (
    <RépartitionMétéoÉlémentStyled typeDeRéforme={typeDeRéforme}>
      <div className='fr-grid-row'>
        <MétéoPicto
          météo={météo}
        />
      </div>
      <p className='nombre-de-chantiers fr-grid-row fr-h1 fr-mb-0'>
        {nombreDeChantiers}
      </p>
      <p className='label fr-grid-row fr-mb-0 fr-text--sm break-keep'>
        {libellésMétéos[météo]}
      </p>
    </RépartitionMétéoÉlémentStyled>
  );
}
