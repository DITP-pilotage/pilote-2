import { FunctionComponent, MouseEventHandler } from 'react';
import Bouton from '@/components/_commons/Bouton/Bouton';

interface BoutonToutSélectionnerProps {
  onClickToutSélectionner: MouseEventHandler<HTMLButtonElement>
  onClickToutDésélectionner: MouseEventHandler<HTMLButtonElement>
  className?: string
}  

const BoutonToutSélectionner: FunctionComponent<BoutonToutSélectionnerProps> = ({ onClickToutSélectionner, onClickToutDésélectionner, className }) => {
  return (
    <ul className={`fr-btns-group fr-btns-group--inline fr-btns-group--sm${className ? ' ' + className : ''}`}>
      <li>
        <Bouton
          className='fr-btn--secondary'
          label='Tout sélectionner'
          onClick={onClickToutSélectionner}
        />
      </li>
      <li>
        <Bouton
          className='fr-btn--secondary'
          label='Tout déselectionner'
          onClick={onClickToutDésélectionner}
        />
      </li>
    </ul>
  );
};

BoutonToutSélectionner.defaultProps = {
  className: '',
};

export default BoutonToutSélectionner;
