import { FunctionComponent, useId, useRef } from 'react';
import { useSession } from 'next-auth/react';
import InputGroupeProps from '@/components/_commons/InputGroupe/InputGroupe.interface';
import InputGroupeItem from '@/components/_commons/InputGroupe/InputGroupeItem';
import InputGroupeStyled from './InputGroupe.styled';
import useInputGroupe from './useInputGroupe';

const InputGroupe: FunctionComponent<InputGroupeProps> = ({
  optionsGroupées,
  valeurSelectionneeParDefaut,
  changementValeurSelectionneeCallback,
  label,
  desactive,
  libelle,
}) => {
  const id = useId();
  const ref = useRef(null);
  const { data: session } = useSession();
  const {
    recherche,
    setRecherche,
    optionsGroupéesFiltrées,
    estOuvert,
    multiSelectBoutonProps,
    uniqueId,
  } = useInputGroupe({
    optionsGroupées,
    ref,
    valeurSelectionneeParDefaut,
  });

  const possedeLeDroitSurLaMailleNat = session!.habilitations.lecture.territoires.includes('NAT-FR');

  return (
    <InputGroupeStyled>
      <label
        className='fr-label'
        htmlFor={id}
      >
        {label}
      </label>
      <button
        className='fr-select fr-ellipsis'
        disabled={desactive}
        id={id}
        title={libelle}
        type='button'
        {...multiSelectBoutonProps}
      >
        {libelle}
      </button>
      <div
        className={estOuvert ? 'visible' : ''}
        ref={ref}
        role='menu'
      >
        <div className='w-full fr-p-2w'>
          <input
            className='fr-input'
            onChange={(e) => setRecherche(e.target.value)}
            placeholder='Rechercher...'
            type='text'
            value={recherche}
          />
        </div>
        {
          possedeLeDroitSurLaMailleNat ? (
            <button
              className='territoire-item-nat w-full texte-gauche fr-py-1v fr-pl-2w'
              disabled={valeurSelectionneeParDefaut === 'NAT-FR'}
              id='NAT-FR'
              key='NAT-FR'
              name='NAT-FR'
              onClick={() => changementValeurSelectionneeCallback('NAT-FR')}
              type='button'
            >
              France
            </button>
          ) : null
        }
        {
          optionsGroupéesFiltrées.map(groupe => (
            <InputGroupeItem
              changementÉtatCallback={valeur => changementValeurSelectionneeCallback(valeur)}
              groupeOptions={groupe}
              key={`${groupe.label} ${uniqueId}`}
              valeurSelectionnee={valeurSelectionneeParDefaut}
            />
          ))
        }
      </div>
    </InputGroupeStyled>
  );
};

export default InputGroupe;
