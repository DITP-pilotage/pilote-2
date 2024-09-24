import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';

import { FunctionComponent } from 'react';
import {
  actions as actionsFiltresModifierIndicateursStore, filtresModifierIndicateursActifsStore,
} from '@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import api from '@/server/infrastructure/api/trpc/api';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import MultiSelectPérimètreMinistériel from '@/client/components/_commons/MultiSelect/MultiSelectPérimètreMinistériel/MultiSelectPérimètreMinistériel';
import Interrupteur from '@/client/components/_commons/Interrupteur/Interrupteur';

interface AdminIndicateursBarreLatéraleProps {
  estOuverteBarreLatérale: boolean,
  setEstOuverteBarreLatérale: (valeur: boolean) => void
}

const AdminIndicateurBarreLatérale: FunctionComponent<AdminIndicateursBarreLatéraleProps> = ({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}) => {
  const { sauvegarderFiltres } = actionsFiltresModifierIndicateursStore();
  const filtresActifs = filtresModifierIndicateursActifsStore();

  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const chantierAAfficher = filtresActifs.perimetresMinisteriels.length > 0  
    ? chantiers?.filter(chantier => chantier.périmètreIds.some(element => filtresActifs.perimetresMinisteriels.includes(element)))
    : chantiers;

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className='fr-mb-2w'>
          <MultiSelectPérimètreMinistériel
            changementValeursSélectionnéesCallback={(perimetresMinisteriel) => {
              sauvegarderFiltres({ 'perimetresMinisteriels': perimetresMinisteriel });
            }}
            périmètresMinistérielsIdsSélectionnésParDéfaut={filtresActifs.perimetresMinisteriels}
          />
        </div>
        <div className='fr-mb-2w'>
          <MultiSelectChantier
            changementValeursSélectionnéesCallback={(chantier) => {
              sauvegarderFiltres({ 'chantiers': chantier });
            }}
            chantiers={chantierAAfficher ?? []}
            chantiersIdsSélectionnésParDéfaut={filtresActifs.chantiers}
          />
        </div>
        <Interrupteur
          auChangement={(estTerritorialise) => {
            sauvegarderFiltres({ 'estTerritorialise': estTerritorialise });
          }}
          checked={filtresActifs.estTerritorialise}
          id='estTerritorialise'
          libellé='PPG territorialisés'
        />
        <Interrupteur
          auChangement={(estBarometre) => {
            sauvegarderFiltres({ 'estBarometre': estBarometre });
          }}
          checked={filtresActifs.estBarometre}
          id='estBarometre'
          libellé='PPG du baromètre'
        />
      </BarreLatéraleEncart>
    </BarreLatérale>
  );
};

export default AdminIndicateurBarreLatérale;
