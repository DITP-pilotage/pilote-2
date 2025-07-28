import { FunctionComponent } from 'react';
import { parseAsBoolean, parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import {
  FiltresSelectionMultiple,
} from '@/components/PageAccueil/Filtres/FiltresSelectionMultiple/FiltresSelectionMultiple';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Titre from '@/components/_commons/Titre/Titre';
import { reinitialiserFiltres, sauvegarderFiltres } from '@/client/stores/useFiltresStoreNew/useFiltresStoreNew';
import { calculerNouvelleMaille } from '@/components/PageAccueil/Filtres/utils';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import { FiltresSelectionMultipleBoolean } from './FiltresSelectionMultipleBoolean/FiltresSelectionMultipleBoolean';
import { FiltresSelectionUnique } from './FiltresSelectionUnique/FiltresSelectionUnique';

interface FiltresProps {
  ministères: Ministère[],
  axes: Axe[],
  afficherToutLesFiltres: boolean
  estProfilTerritorialise: boolean
  estProfilRegionalAutoriseAVoirLaTerritorialisation: boolean
}

export const Filtres: FunctionComponent<FiltresProps> = ({
  ministères,
  axes,
  afficherToutLesFiltres,
  estProfilTerritorialise,
  estProfilRegionalAutoriseAVoirLaTerritorialisation,
}) => {
  const [, setFiltres] = useQueryStates({
    maille: parseAsString.withDefault(''),
    pageIndex: parseAsInteger.withDefault(1),
    perimetres: parseAsString.withDefault(''),
    statut: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    meteos: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    territorialisation: parseAsString.withDefault(''),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
    estEnAlertePossedePropositionsValeurAvancement: parseAsBoolean.withDefault(false),
  }, {
    shallow: false,
    clearOnDefault: true,
    history: 'push',
  });

  const désactiverTousLesFiltres = () => {
    reinitialiserFiltres();

    return setFiltres({
      perimetres: '',
      axes: '',
      meteos: '',
      statut: 'PUBLIE',
      estBarometre: false,
      territorialisation: '',
      estEnAlerteTauxAvancementNonCalculé: false,
      estEnAlerteÉcart: false,
      estEnAlerteBaisse: false,
      estEnAlerteMétéoNonRenseignée: false,
      estEnAlerteAbscenceTauxAvancementDepartemental: false,
      estEnAlertePossedePropositionsValeurAvancement: false,
    });
  };

  const filtresTerritorialisation = estProfilRegionalAutoriseAVoirLaTerritorialisation ? [
    {
      id: 'regionale',
      nom: 'Régionale',
    },
    {
      id: 'departementale',
      nom: 'Départementale',
    },
  ] : [
    {
      id: 'nationale',
      nom: 'Nationale',
    },
    {
      id: 'regionale',
      nom: 'Régionale',
    },
    {
      id: 'departementale',
      nom: 'Départementale',
    },
  ];

  return (
    <>
      <div className='flex justify-between align-center fr-mb-1w fr-px-3w fr-mt-3w'>
        <Titre
          baliseHtml='h1'
          className='fr-h4 fr-mb-0 flex align-center'
        >
          Filtres
        </Titre>
        <button
          className='fr-link fr-icon-arrow-go-forward-fill fr-link--icon-left fr-text--xs'
          onClick={désactiverTousLesFiltres}
          title='Réinitialiser les filtres'
          type='button'
        >
          Réinitialiser les filtres
        </button>
      </div>
      <section className='fr-px-3w'>
        <FiltresMinistères
          ministères={ministères}
        />
      </section>
      {
        afficherToutLesFiltres ? (
          <FiltresGroupe>
            <FiltresSelectionMultiple
              categorieDeFiltre='axes'
              filtres={axes}
              libelle='Filtrer par axes'
              onChange={nouveauFiltre => {
                sauvegarderFiltres({ axes: nouveauFiltre });
                return setFiltres({
                  axes: nouveauFiltre.join(','),
                  pageIndex: 1,
                });
              }}
            />
            {
              estProfilTerritorialise ? (
                <FiltresSelectionMultiple
                  categorieDeFiltre='territorialisation'
                  filtres={filtresTerritorialisation}
                  libelle='Filtrer par territorialisation'
                  onChange={nouveauFiltre => {
                    const nouvelleMaille = calculerNouvelleMaille(nouveauFiltre);

                    sauvegarderFiltres({ territorialisation: nouveauFiltre, maille: nouvelleMaille });
                    return setFiltres({
                      territorialisation: nouveauFiltre.join(','),
                      maille: nouvelleMaille,
                      pageIndex: 1,
                    });
                  }}
                />
              ) : null
            }
            <FiltresSelectionUnique
              categorieDeFiltre='statut'
              libelle='Filtrer par statut'
            />
            <FiltresSelectionMultipleBoolean
              libelle='Autres filtres'
              listeCategorieDeFiltre={['estBarometre']}
            />
          </FiltresGroupe>
        ) : null
      }
    </>
  );
};
