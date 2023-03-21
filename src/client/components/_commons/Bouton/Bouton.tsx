import { MouseEventHandler } from 'react';

interface BoutonProps {
  label: string
  onClick: MouseEventHandler<HTMLButtonElement>
}  

export default function Bouton({ label, onClick }: BoutonProps) {
  return (
    <button
      className="fr-btn"
      onClick={onClick}
      type='button'
    >
      {label}
    </button>
  );
}
