import { FunctionComponent } from 'react';
import MétéoPicto from '@/components/_commons/Météo/Picto/MétéoPicto';
import { libellésMétéos, Météo } from '@/server/domain/météo/Météo.interface';
import { typeDeRéformeSélectionnéeStore } from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';
import RépartitionMétéoÉlémentStyled from './RépartitionMétéoÉlément.styled';

interface RépartitionMétéoÉlémentProps {
  météo: Météo
  nombreDeChantiers: string
  estArchive?: boolean
}

const RépartitionMétéoÉlément: FunctionComponent<RépartitionMétéoÉlémentProps> = ({ météo, nombreDeChantiers, estArchive }) => {
  const typeDeRéforme = typeDeRéformeSélectionnéeStore();
  return (
    <RépartitionMétéoÉlémentStyled 
      estArchive={estArchive}
      typeDeRéforme={typeDeRéforme}
    >
      <MétéoPicto
        météo={météo}
      />
      <p className='nombre-de-chantiers fr-h1 fr-mb-0'>
        {nombreDeChantiers}
      </p>
      <p className='label fr-mb-0 break-keep'>
        {libellésMétéos[météo]}
      </p>
    </RépartitionMétéoÉlémentStyled>
  );
};

export default RépartitionMétéoÉlément;
