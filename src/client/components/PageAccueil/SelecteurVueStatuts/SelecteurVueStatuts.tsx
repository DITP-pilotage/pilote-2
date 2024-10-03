import { parseAsStringLiteral, useQueryState } from 'nuqs';
import { FunctionComponent } from 'react';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';
import useSélecteurVueStatut from './useSelecteurVueStatut.interface';
import SelecteurVueStatutStyled from './SelecteurVueStatut.styled';

export const typesVueStatuts = ['BROUILLON_ET_PUBLIE', 'PUBLIE', 'BROUILLON', 'ARCHIVE'] as const;
export type TypeVueStatuts = typeof typesVueStatuts[number];

const SelecteurVueStatuts: FunctionComponent<{}> = () => {

  const { options } = useSélecteurVueStatut();

  const [statut, setStatut] = useQueryState('statut', parseAsStringLiteral(['BROUILLON', 'PUBLIE', 'BROUILLON_ET_PUBLIE', 'ARCHIVE']).withDefault('PUBLIE').withOptions({
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  }));

  const auChangement = (vueStatuts: TypeVueStatuts) => {
    sauvegarderFiltres({ statut: vueStatuts });

    return setStatut(vueStatuts);
  };

  return (
    <SelecteurVueStatutStyled>
      {
        options.filter(option => option.position === 'gauche' && option.estVisible).map(option => (
          <button
            className={`fr-tag fr-tag--icon-left fr-mr-1w ${statut === option.valeur ? 'fr-tag-active' : ''} ${option.icone ?? ''}`}
            id={option.valeur}
            key={option.valeur}
            onClick={() => statut !== option.valeur && auChangement(option.valeur)}
            type='button'
          >
            {option.libellé}
          </button>

        ))
      }
      <div className='separator fr-mr-1w' />
      {
        options.filter(option => option.position === 'droite' && option.estVisible).map(option => (
          <button
            className={`fr-tag fr-tag--icon-left fr-mr-1w ${statut === option.valeur ? 'fr-tag-active' : ''} ${option.icone ?? ''}`}
            id={option.valeur}
            key={option.valeur}
            onClick={() => statut !== option.valeur && auChangement(option.valeur)}
            type='button'
          >
            {option.libellé}
          </button>

        ))
      }
    </SelecteurVueStatutStyled>
  );
};

export default SelecteurVueStatuts;
