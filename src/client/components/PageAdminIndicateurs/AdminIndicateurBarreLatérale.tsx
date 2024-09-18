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

interface AdminIndicateursBarreLatéraleProps {
  estOuverteBarreLatérale: boolean,
  setEstOuverteBarreLatérale: (valeur: boolean) => void
}

const AdminIndicateurBarreLatérale: FunctionComponent<AdminIndicateursBarreLatéraleProps> = ({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}) => {
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });

  const { sauvegarderFiltres } = actionsFiltresModifierIndicateursStore();
  const filtresActifs = filtresModifierIndicateursActifsStore();

  console.log(filtresActifs);

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className='fr-mb-2w'>
          <MultiSelectChantier
            changementValeursSélectionnéesCallback={(chantier) => {
              sauvegarderFiltres({ 'chantiers': chantier });
            }}
            chantiers={chantiers ?? []}
            chantiersIdsSélectionnésParDéfaut={filtresActifs.chantiers}
          />
        </div>
        <div className='fr-mb-2w'>
          <MultiSelectPérimètreMinistériel
            changementValeursSélectionnéesCallback={(perimetresMinisteriel) => {
              sauvegarderFiltres({ 'perimetresMinisteriels': perimetresMinisteriel });
            }}
            périmètresMinistérielsIdsSélectionnésParDéfaut={filtresActifs.perimetresMinisteriels}
          />
        </div>
      </BarreLatéraleEncart>
    </BarreLatérale>
  );
};

export default AdminIndicateurBarreLatérale;
