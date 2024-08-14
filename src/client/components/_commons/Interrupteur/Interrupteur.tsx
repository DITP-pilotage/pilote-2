import '@gouvfr/dsfr/dist/component/toggle/toggle.min.css';
import { ChangeEvent, FunctionComponent } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';

interface InterrupteurProps {
  checked: boolean;
  id: string;
  auChangement?: (estCochée: boolean) => void;
  libellé: string;
  register?: UseFormRegisterReturn;
  messageSecondaire?: string;
}

const Interrupteur: FunctionComponent<InterrupteurProps> = ({ checked, id, libellé, auChangement, register, messageSecondaire }) => {
  return (
    <div className='fr-toggle w-full'>
      <input
        checked={checked}
        className='fr-toggle__input'
        id={`interrupteur-${id}`}
        onChange={(event: ChangeEvent<HTMLInputElement>) => auChangement && auChangement(event.currentTarget.checked)}
        type='checkbox'
        {...register}
      />
      <label
        className='fr-toggle__label'
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
};

export default Interrupteur;
