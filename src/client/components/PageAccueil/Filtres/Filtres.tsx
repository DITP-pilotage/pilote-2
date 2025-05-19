import { FunctionComponent } from 'react';
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs';
import { useSession } from 'next-auth/react';
import { FiltresSelectionMultiple }
  from '@/components/PageAccueil/Filtres/FiltresSelectionMultiple/FiltresSelectionMultiple';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import Titre from '@/components/_commons/Titre/Titre';
import { reinitialiserFiltres } from '@/client/stores/useFiltresStoreNew/useFiltresStoreNew';
import api from '@/server/infrastructure/api/trpc/api';
import FiltresGroupe from './FiltresGroupe/FiltresGroupe';
import FiltresMinistères from './FiltresMinistères/FiltresMinistères';
import { FiltresSelectionMultipleBoolean } from './FiltresSelectionMultipleBoolean/FiltresSelectionMultipleBoolean';
import { FiltresSelectionUnique } from './FiltresSelectionUnique/FiltresSelectionUnique';

interface FiltresProps {
  ministères: Ministère[],
  axes: Axe[],
  afficherToutLesFiltres: boolean
  estProfilTerritorialise: boolean
}

export const Filtres: FunctionComponent<FiltresProps> = ({
  ministères,
  axes,
  afficherToutLesFiltres,
  estProfilTerritorialise,
}) => {
  const { data: session } = useSession();

  const [, setFiltres] = useQueryStates({
    perimetres: parseAsString.withDefault(''),
    axes: parseAsString.withDefault(''),
    meteos: parseAsString.withDefault(''),
    estBarometre: parseAsBoolean.withDefault(false),
    territorialisation: parseAsString.withDefault(''),
    estEnAlerteTauxAvancementNonCalculé: parseAsBoolean.withDefault(false),
    estEnAlerteÉcart: parseAsBoolean.withDefault(false),
    estEnAlerteBaisse: parseAsBoolean.withDefault(false),
    estEnAlerteMétéoNonRenseignée: parseAsBoolean.withDefault(false),
    estEnAlerteAbscenceTauxAvancementDepartemental: parseAsBoolean.withDefault(false),
    estEnAlertePossedePropositionsValeurActuelle: parseAsBoolean.withDefault(false),
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
      estBarometre: false,
      territorialisation: '',
      estEnAlerteTauxAvancementNonCalculé: false,
      estEnAlerteÉcart: false,
      estEnAlerteBaisse: false,
      estEnAlerteMétéoNonRenseignée: false,
      estEnAlerteAbscenceTauxAvancementDepartemental: false,
      estEnAlertePossedePropositionsValeurActuelle: false,
    });
  };

  const { data: variableContenuFFPpgArchive } = api.gestionContenu.récupérerVariableContenu.useQuery({ nomVariableContenu: 'NEXT_PUBLIC_FF_PPG_ARCHIVE' });
  const profilPeutAccederAuxBrouillons = !!session?.profilAAccèsAuxChantiersBrouillons;

  const filtresTerritorialisation = [
    {
      id: 'nationale',
      nom: 'nationale',
    },
    {
      id: 'regionale',
      nom: 'régionale',
    },
    {
      id: 'departementale',
      nom: 'départementale',
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
              catégorieDeFiltre='axes'
              filtres={axes}
              libelle='Filtrer par axes'
            />
            {
              estProfilTerritorialise ? (
                <FiltresSelectionMultiple
                  catégorieDeFiltre='territorialisation'
                  filtres={filtresTerritorialisation}
                  libelle='Filtrer par territorialisation'
                />
              ) : null
            }
            {
              variableContenuFFPpgArchive && profilPeutAccederAuxBrouillons ? (
                <FiltresSelectionUnique
                  categorieDeFiltre='statut'
                  libelle='Filtrer par statut'
                />
              ) : null
            }
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
