import { useId, useRef } from 'react';
import MultiSelectProps from '@/components/_commons/MultiSelect/MultiSelect.interface';
import MultiSelectGroupe from '@/components/_commons/MultiSelect/MultiSelectGroupe';
import BoutonToutSélectionner from '@/components/_commons/BoutonsToutSélectionner/BoutonsToutSélectionner';
import MultiSelectStyled from './MultiSelect.styled';
import useMultiSelect from './useMultiSelect';


export default function MultiSelect({ suffixeLibellé, optionsGroupées, valeursSélectionnéesParDéfaut, changementValeursSélectionnéesCallback, label, afficherBoutonsSélection }: MultiSelectProps) {
  const id = useId();
  const ref = useRef(null);
  const {
    mettreÀJourLesValeursSélectionnées,
    recherche,
    setRecherche,
    optionsGroupéesFiltrées,
    estOuvert,
    multiSelectBoutonProps,
    valeursSélectionnées,
    uniqueId,
    libellé,
  } = useMultiSelect(optionsGroupées, suffixeLibellé, changementValeursSélectionnéesCallback, ref, valeursSélectionnéesParDéfaut);

  return (
    <MultiSelectStyled>
      <label
        className='fr-label'
        htmlFor={id}
      >
        {label}
      </label> 
      {
        !!afficherBoutonsSélection && (
          <BoutonToutSélectionner
            className='fr-mt-2w'
            onClickToutDésélectionner={() => changementValeursSélectionnéesCallback([])}
            onClickToutSélectionner={() => changementValeursSélectionnéesCallback(optionsGroupéesFiltrées.flatMap(groupe => groupe.options.map(option => option.value)))}
          />
        )
      }
      <button
        className='fr-select fr-ellipsis'
        id={id}
        title={libellé}
        type='button'
        {...multiSelectBoutonProps}
      >
        {libellé}
      </button>
      <div
        className={estOuvert ? 'visible' : ''}
        ref={ref}
        role='menu'
      >
        <input
          className='fr-input'
          onChange={(e) => setRecherche(e.target.value)}
          placeholder='Rechercher...'
          type='text'
          value={recherche}
        />
        {
          optionsGroupéesFiltrées.map(groupe =>(
            <MultiSelectGroupe
              changementÉtatCallback={valeur => mettreÀJourLesValeursSélectionnées(valeur)}
              groupeOptions={groupe}
              key={`${groupe.label} ${uniqueId}`}
              valeursSélectionnées={valeursSélectionnées}
            />
          ))
        }
      </div>
    </MultiSelectStyled>
  );
}
