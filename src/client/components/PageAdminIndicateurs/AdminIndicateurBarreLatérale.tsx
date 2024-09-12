import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import { FunctionComponent } from 'react';
import {
  actions as actionsFiltresModifierIndicateursStore, filtresModifierIndicateursActifsStore,
  réinitialiser,
} from '@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';

import Tag from '@/components/_commons/Tag/Tag';
import api from '@/server/infrastructure/api/trpc/api';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import MultiSelectPérimètreMinistériel from '@/client/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel';
import Titre from '@/client/components/_commons/Titre/Titre';
import { territoiresTerritoiresStore } from '@/client/stores/useTerritoiresStore/useTerritoiresStore';

interface AdminIndicateursBarreLatéraleProps {
  estOuverteBarreLatérale: boolean,
  setEstOuverteBarreLatérale: (valeur: boolean) => void
}

const AdminIndicateurBarreLatérale: FunctionComponent<AdminIndicateursBarreLatéraleProps> = ({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}) => {
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { data: périmètresMinistériels } = api.périmètreMinistériel.récupérerTous.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { modifierÉtatDuFiltre, désactiverFiltre } = actionsFiltresModifierIndicateursStore();
  const réinitialiserFiltres = réinitialiser();
  const filtresActifs = filtresModifierIndicateursActifsStore();
  const territoires = territoiresTerritoiresStore();
  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className='fr-mb-2w'>
          <MultiSelectTerritoire
            changementValeursSélectionnéesCallback={(territoire) => {
              modifierÉtatDuFiltre(territoire, 'territoires');
            }}
            groupesÀAfficher={{
              nationale: true,
              régionale: true,
              départementale: true,
            }}
            territoiresCodesSélectionnésParDéfaut={filtresActifs.territoires}
          />
        </div>
        <div className='fr-mb-2w'>
          <MultiSelectPérimètreMinistériel
            changementValeursSélectionnéesCallback={(périmètreMinistériel) => {
              modifierÉtatDuFiltre(périmètreMinistériel, 'périmètresMinistériels', chantiers);
            }}
            périmètresMinistérielsIdsSélectionnésParDéfaut={filtresActifs.périmètresMinistériels}
          />
        </div>
        <div className='fr-mb-2w'>
          <MultiSelectChantier
            changementValeursSélectionnéesCallback={(chantier) => {
              modifierÉtatDuFiltre(chantier, 'chantiers');
            }}
            chantiers={chantiers ?? []}
            chantiersIdsSélectionnésParDéfaut={filtresActifs.chantiers}
          />
        </div>
      </BarreLatéraleEncart>
      <div className='fr-px-3w fr-py-2w'>
        <Titre
          baliseHtml='h2'
          className='fr-h4'
        >
          Filtres actifs
        </Titre>
        <button
          className='fr-btn fr-btn--secondary'
          onClick={réinitialiserFiltres}
          title='Réinitialister les filtres'
          type='button'
        >
          Réinitialiser les filtres
        </button>
        <button
          aria-controls='fr-sidemenu-item-territoires'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-mt-1w'
          type='button'
        >
          Territoires(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-territoires'
        >
          {
            filtresActifs.territoires.map(territoireCode => {
              const libellé = territoires.find(territoire => territoire.code === territoireCode)?.nomAffiché ?? null;
              return libellé === null ? null : (
                <div
                  className='fr-p-0 fr-mt-1w'
                  key={territoireCode}
                >
                  <Tag        
                    libellé={libellé}
                    suppressionCallback={() => {
                      désactiverFiltre(territoireCode, 'territoires');
                    }}
                  />
                </div>
              );
            })
          }
        </div>
        <button
          aria-controls='fr-sidemenu-item-périmètresMinistériels'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-mt-1w'
          title='Périmètre(s) ministériel(s)'
          type='button'
        >
          Périmètre(s) ministériel(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-périmètresMinistériels'
        >
          {
            filtresActifs.périmètresMinistériels.map(périmètreMinistérielId => {
              let libellé = périmètresMinistériels?.find(périmètre => périmètre.id === périmètreMinistérielId)?.nom ?? null;
              return libellé === null ? null : (
                <div
                  className='fr-p-0 fr-mt-1w'
                  key={périmètreMinistérielId}
                >
                  <Tag               
                    libellé={libellé}
                    suppressionCallback={() => {
                      désactiverFiltre(périmètreMinistérielId, 'périmètresMinistériels');
                    }}
                  />
                </div>
              );
            })
          }
        </div>
        <button
          aria-controls='fr-sidemenu-item-chantiers'
          aria-expanded='true'
          className='fr-sidemenu__btn fr-mt-1w'
          type='button'
        >
          Chantier(s)
        </button>
        <div
          className='fr-collapse'
          id='fr-sidemenu-item-chantiers'
        >
          {
            filtresActifs.chantiers.map(chantierId => {
              let libellé = chantiers?.find(chantier => chantier.id === chantierId)?.nom ?? null;
              return libellé === null ? null : (
                <div
                  className='fr-p-0 fr-mt-1w'
                  key={chantierId}
                >
                  <Tag              
                    libellé={libellé}
                    suppressionCallback={() => {
                      désactiverFiltre(chantierId, 'chantiers');
                    }}
                  />
                </div>
              );
            })
          }
        </div>
      </div>
    </BarreLatérale>
  );
};

export default AdminIndicateurBarreLatérale;
