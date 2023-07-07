import '@gouvfr/dsfr/dist/component/toggle/toggle.min.css';
import { ChangeEvent } from 'react';
import InterrupteurProps from '@/components/_commons/Interrupteur/Interrupteur.interface';

export default function Interrupteur({ checked, id, libellé, auChangement }: InterrupteurProps) {
  return (
    <div className="fr-toggle">
      <input
        checked={checked}
        className="fr-toggle__input"
        id={`interrupteur-${id}`}
        onChange={(event: ChangeEvent<HTMLInputElement>) => auChangement(event.currentTarget.checked)}
        type="checkbox"
      />
      <label
        className="fr-toggle__label fr-pl-2w"
        htmlFor={`interrupteur-${id}`}
      >
        {libellé}
      </label>
    </div>
  );
}
