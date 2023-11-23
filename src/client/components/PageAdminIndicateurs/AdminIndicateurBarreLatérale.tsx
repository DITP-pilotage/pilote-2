import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';

import {
  actions as actionsFiltresModifierIndicateursStore, filtresModifierIndicateursActifsStore,
} from '@/stores/useFiltresModifierIndicateursStore/useFiltresModifierIndicateursStore';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import api from '@/server/infrastructure/api/trpc/api';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';

interface AdminIndicateursBarreLatéraleProps {
  estOuverteBarreLatérale: boolean,
  setEstOuverteBarreLatérale: (valeur: boolean) => void
}

export function AdminIndicateurBarreLatérale({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}: AdminIndicateursBarreLatéraleProps) {
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });

  const { modifierÉtatDuFiltre } = actionsFiltresModifierIndicateursStore();
  const filtresActifs = filtresModifierIndicateursActifsStore();


  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
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
    </BarreLatérale>
  );
}
