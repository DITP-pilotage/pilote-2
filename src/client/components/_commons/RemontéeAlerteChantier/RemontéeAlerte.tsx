import { parseAsBoolean, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import RemontéeAlerteStyled from '@/components/_commons/RemontéeAlerte/RemontéeAlerte.styled';

interface RemontéeAlerteProps {
  nombre: number | null;
  libellé: string;
  nomCritère: string;
  estActivée: boolean;
}


const RemontéeAlerte: FunctionComponent<RemontéeAlerteProps> = ({ nombre, libellé, nomCritère, estActivée }) => {
  const [filtreAlerte, setFiltreAlerte] = useQueryState(nomCritère, parseAsBoolean.withDefault(false).withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  return (
    <RemontéeAlerteStyled
      className={`fr-p-3v fr-p-md-3w ${estActivée ? 'est-activée' : ''}`}
      disabled={nombre === null}
      onClick={() => setFiltreAlerte(!filtreAlerte)}
    >
      <span className='fr-h1 fr-mb-0 nombre'>
        {nombre ?? '-'}
        {' '}
        {filtreAlerte}
      </span>
      <span className='fr-mb-0 texte-gauche libellé'>
        {libellé}
      </span>
    </RemontéeAlerteStyled>
  );
};

export default RemontéeAlerte;
