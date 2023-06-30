import { MouseEventHandler } from 'react';

interface BoutonProps {
  label: string
  onClick: MouseEventHandler<HTMLButtonElement>
  className?: string
}  

export default function Bouton({ label, onClick, className }: BoutonProps) {
  return (
    <button
      className={`fr-btn${className ? ' ' + className : ''}`}
      onClick={onClick}
      type='button'
    >
      {label}
    </button>
  );
}

Bouton.defaultProps = {
  className: '',
};
