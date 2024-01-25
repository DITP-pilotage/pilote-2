import '@gouvfr/dsfr/dist/component/toggle/toggle.min.css';
import { ChangeEvent } from 'react';
import InterrupteurProps from '@/components/_commons/Interrupteur/Interrupteur.interface';

export default function Interrupteur({ checked, id, libellé, auChangement, register, messageSecondaire }: InterrupteurProps) {
  return (
    <div className='fr-toggle'>
      <input
        checked={checked}
        className='fr-toggle__input'
        id={`interrupteur-${id}`}
        onChange={(event: ChangeEvent<HTMLInputElement>) => auChangement && auChangement(event.currentTarget.checked)}
        type='checkbox'
        {...register}
      />
      <label
        className='fr-toggle__label no-wrap'
        htmlFor={`interrupteur-${id}`}
      >
        {libellé}
      </label>
      {
        messageSecondaire ? (
          <p
            className='fr-hint-text'
            id='toggle-698-hint-text'
          >
            {messageSecondaire}
          </p>
        ) : null
      }
    </div>
  );
}
