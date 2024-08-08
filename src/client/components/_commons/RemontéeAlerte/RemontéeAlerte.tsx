import { FunctionComponent } from 'react';
import RemontéeAlerteStyled from '@/components/_commons/RemontéeAlerte/RemontéeAlerte.styled';

interface RemontéeAlerteProps {
  nombre: number | null;
  libellé: string;
  auClic?: () => void;
  estActivée: boolean;
}

const RemontéeAlerte: FunctionComponent<RemontéeAlerteProps> = ({ nombre, libellé, auClic, estActivée }) => {
  return (
    <RemontéeAlerteStyled
      className={`fr-p-3v fr-p-md-3w ${estActivée ? 'est-activée' : ''}`}
      disabled={!auClic || nombre === null}
      onClick={auClic}
    >
      <span className='fr-h1 fr-mb-0 nombre'>
        {nombre ?? '-'}
      </span>
      <span className='fr-mb-0 texte-gauche libellé'>
        {libellé}
      </span>
    </RemontéeAlerteStyled>
  );
};
export default RemontéeAlerte;
