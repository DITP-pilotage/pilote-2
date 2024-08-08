import { FunctionComponent } from 'react';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import { typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';
import RépartitionMétéoÉlémentStyled from './RépartitionMétéoÉlément.styled';

interface RépartitionMétéoÉlémentProps {
  météo: Météo
  nombreDeChantiers: string
}

const RépartitionMétéoÉlément: FunctionComponent<RépartitionMétéoÉlémentProps> = ({ météo, nombreDeChantiers }) => {
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
};

export default RépartitionMétéoÉlément;
