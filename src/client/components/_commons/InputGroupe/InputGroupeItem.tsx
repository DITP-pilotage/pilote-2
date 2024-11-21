import '@gouvfr/dsfr/dist/component/checkbox/checkbox.min.css';
import { Fragment, FunctionComponent, useId } from 'react';
import { MultiSelectOptionGroupée } from '@/components/_commons/MultiSelect/MultiSelect.interface';

interface MultiSelectGroupeProps {
  groupeOptions: MultiSelectOptionGroupée
  changementÉtatCallback: (valeur: string) => void
  valeurSelectionnee: string
}

const InputGroupeItem: FunctionComponent<MultiSelectGroupeProps> = ({
  groupeOptions,
  changementÉtatCallback,
  valeurSelectionnee,
}) => {
  const id = useId();

  if (groupeOptions.options.length === 0)
    return null;

  return (
    <>
      <p className='list-territoire-titre fr-mb-1w fr-pt-1w fr-pl-2w'>
        {groupeOptions.label.toUpperCase()}
      </p>
      <ul
        className='list-territoire fr-m-'
      >
        {
          groupeOptions.options.map(option => (
            <li
              className='list-territoire-item fr-py-1w  fr-pl-2w'
              key={`${option.value} ${id}`}
            >
              <button
                className='w-full texte-gauche fr-p-0'
                disabled={valeurSelectionnee === option.value || option.disabled}
                id={`${option.value} ${id}`}
                name={option.value}
                onClick={() => changementÉtatCallback(option.value)}
                type='button'
              >
                {option.label}
              </button>
            </li>
          ))
        }
      </ul>
    </>
  );
};

export default InputGroupeItem;
