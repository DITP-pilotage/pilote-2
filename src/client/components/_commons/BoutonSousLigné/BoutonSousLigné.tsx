import { ButtonHTMLAttributes, ReactNode, MouseEventHandler, FunctionComponent } from 'react';
import BoutonSousLignéStyled from '@/components/_commons/BoutonSousLigné/BoutonSousLigné.styled';

interface BoutonSousLignéProps {
  ariaControls?: string,
  children?: ReactNode,
  classNameSupplémentaires?: string,
  dataFrOpened?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>,
  type?: ButtonHTMLAttributes<never>['type'],
}

const BoutonSousLigné: FunctionComponent<BoutonSousLignéProps> = ({
  ariaControls,
  classNameSupplémentaires,
  dataFrOpened,
  onClick,
  type,
  children,
}) => {
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
};

export default BoutonSousLigné;
