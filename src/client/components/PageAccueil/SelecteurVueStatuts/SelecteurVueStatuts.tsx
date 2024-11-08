import { parseAsBoolean, parseAsInteger, parseAsStringLiteral, useQueryState, useQueryStates } from 'nuqs';
import { Fragment, FunctionComponent } from 'react';
import { sauvegarderFiltres } from '@/stores/useFiltresStoreNew/useFiltresStoreNew';

import Infobulle from '@/components/_commons/Infobulle/Infobulle';
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

  const [, setPagination] = useQueryState('pageIndex', parseAsInteger.withDefault(1).withOptions({
    shallow: false,
  }));

  const [, setFiltresAlertes] = useQueryStates({
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
  }, {
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  });

  const auChangement = (vueStatuts: TypeVueStatuts) => {
    sauvegarderFiltres({ statut: vueStatuts });

    if (vueStatuts === 'ARCHIVE') {
      setFiltresAlertes({
        estEnAlerteAbscenceTauxAvancementDepartemental: false,
        estEnAlerteBaisse: false,
        estEnAlerteTauxAvancementNonCalculé: false,
        estEnAlerteÉcart: false,
        estEnAlerteMétéoNonRenseignée: false,
      });
    }

    setPagination(1);
    return setStatut(vueStatuts);
  };

  const optionsGauche = options.filter(option => option.position === 'gauche' && option.estVisible);
  const optionsDroite = options.filter(option => option.position === 'droite' && option.estVisible);

  return (
    <SelecteurVueStatutStyled>
      <div className='fr-my-2w conteneur-tags'>
        {
          optionsGauche.map(option => (
            <button
              className={`fr-tag fr-tag--icon-left fr-mr-1w ${statut === option.valeur ? 'fr-tag-active' : ''} ${option.icone ?? ''}`}
              id={`left-${option.valeur}`}
              key={`left-${option.valeur}`}
              onClick={() => statut !== option.valeur && auChangement(option.valeur)}
              type='button'
            >
              {option.libellé}
            </button>

          ))
        }
        {
          optionsDroite.length > 0 && <div className='separator fr-mr-1w' />
        }
        {
          optionsDroite.map(option => (
            <Fragment key={`right-${option.valeur}`}>
              <button
                className={`fr-tag fr-tag--icon-left fr-mr-1w ${statut === option.valeur ? 'fr-tag-active' : ''} ${option.icone ?? ''}`}
                id={`right-${option.valeur}`}
                onClick={() => statut !== option.valeur && auChangement(option.valeur)}
                type='button'
              >
                {option.libellé}
              </button>
              {
                option.valeur === 'ARCHIVE' &&
                <Infobulle
                  className='fr-pl-0 fr-pb-2w'
                  idHtml='infobulle-chantiers'
                >
                  Ces PPG ne sont dorénavant plus suivies dans PILOTE et leurs données ne sont plus mises à jour. Elles
                  restent cependant accessibles avec les données correspondant à leur dernière mise à jour.
                </Infobulle>
              }
            </Fragment>

          ))
        }
      </div>
    </SelecteurVueStatutStyled>
  );
};

export default SelecteurVueStatuts;
