import RemontéeAlerteStyled from '@/components/_commons/RemontéeAlerte/RemontéeAlerte.styled';
import RemontéeAlerteProps from '@/components/_commons/RemontéeAlerte/RemontéeAlerte.interface';

export default function RemontéeAlerte({ nombre, libellé, auClic, estActivée }: RemontéeAlerteProps) {
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
}
