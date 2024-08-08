import { FunctionComponent, MouseEventHandler } from 'react';

interface BoutonProps {
  label: string
  onClick: MouseEventHandler<HTMLButtonElement>
  className?: string
}  

const Bouton: FunctionComponent<BoutonProps> = ({ label, onClick, className }) => {
  return (
    <button
      className={`fr-btn${className ? ' ' + className : ''}`}
      onClick={onClick}
      type='button'
    >
      {label}
    </button>
  );
};

Bouton.defaultProps = {
  className: '',
};

export default Bouton;
