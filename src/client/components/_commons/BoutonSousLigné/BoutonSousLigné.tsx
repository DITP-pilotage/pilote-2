import BoutonSousLignéInterface from '@/components/_commons/BoutonSousLigné/BoutonSousLigné.interface';
import BoutonSousLignéStyled from '@/components/_commons/BoutonSousLigné/BoutonSousLigné.styled';

export default function BoutonSousLigné({
  ariaControls,
  classNameSupplémentaires,
  dataFrOpened,
  onClick,
  type,
  children,
}: BoutonSousLignéInterface) {
  return (
    <BoutonSousLignéStyled
      aria-controls={ariaControls}
      className={`fr-link override ${classNameSupplémentaires ?? ''}`}
      data-fr-opened={dataFrOpened}
      onClick={onClick}
      type={type}
    >
      { children }
    </BoutonSousLignéStyled>
  );
}
