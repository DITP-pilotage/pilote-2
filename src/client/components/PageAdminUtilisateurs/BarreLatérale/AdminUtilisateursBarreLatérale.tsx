import '@gouvfr/dsfr/dist/component/sidemenu/sidemenu.min.css';
import {
  actions as actionsFiltresUtilisateursStore,
  filtresUtilisateursActifsStore,
  réinitialiser,
} from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Titre from '@/components/_commons/Titre/Titre';
import AdminUtilisateursBarreLatéraleProps from '@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale.interface';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';
import MultiSelectChantier from '@/components/_commons/MultiSelect/MultiSelectChantier/MultiSelectChantier';
import Tag from '@/components/_commons/Tag/Tag';
import { territoiresTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import api from '@/server/infrastructure/api/trpc/api';

export default function AdminUtilisateursBarreLatérale({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}: AdminUtilisateursBarreLatéraleProps) {
  const { data: chantiers } = api.chantier.récupérerTousSynthétisésAccessiblesEnLecture.useQuery(undefined, { staleTime: Number.POSITIVE_INFINITY });
  const { modifierÉtatDuFiltre } = actionsFiltresUtilisateursStore();
  const territoires = territoiresTerritoiresStore();
  const filtresActifs = filtresUtilisateursActifsStore();
  const réinitialiserFiltres = réinitialiser();

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <div className="fr-mb-2w">
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
        <MultiSelectChantier
          changementValeursSélectionnéesCallback={(chantier) => {
            modifierÉtatDuFiltre(chantier, 'chantiers');
          }}
          chantiers={chantiers}
          chantiersIdsSélectionnésParDéfaut={filtresActifs.chantiers}
        />
      </BarreLatéraleEncart>
      <div className="fr-px-3w fr-py-2w">
        <Titre
          baliseHtml='h2'
          className='fr-h4'
        >
          Filtres actifs
        </Titre>
        <button
          className='fr-btn fr-btn--secondary'
          onClick={réinitialiserFiltres}
          type="button"
        >
          Réinitialiser les filtres
        </button>
        <button
          aria-controls="fr-sidemenu-item-territoires"
          aria-expanded="true"
          className="fr-sidemenu__btn fr-m-0"
          type='button'
        >
          Périmètre(s) géographique(s)
        </button>
        <div
          className="fr-collapse"
          id="fr-sidemenu-item-territoires"
        >
          {
            filtresActifs.territoires.map(territoireCode => {
              const libellé = territoires.find(t => t.code === territoireCode)?.nomAffiché ?? null;
              return libellé === null ? null : (
                <Tag
                  key={territoireCode}
                  libellé={libellé}
                  suppressionCallback={() => {}}
                />
              );
            })
          }
        </div>
        <button
          aria-controls="fr-sidemenu-item-périmètresMinistériels"
          aria-expanded="true"
          className="fr-sidemenu__btn fr-m-0"
          type='button'
        >
          Périmètre(s) ministériel(s)
        </button>
        <div
          className="fr-collapse"
          id="fr-sidemenu-item-périmètresMinistériels"
        >
          {
            filtresActifs.périmètresMinistériels.map(périmètreMinistérielId => (
              <Tag
                key={périmètreMinistérielId}
                libellé={périmètreMinistérielId}
                suppressionCallback={() => {}}
              />
            ))
          }
        </div>
        <button
          aria-controls="fr-sidemenu-item-chantiers"
          aria-expanded="true"
          className="fr-sidemenu__btn fr-m-0"
          type='button'
        >
          Chantier(s)
        </button>
        <div
          className="fr-collapse"
          id="fr-sidemenu-item-chantiers"
        >
          {
            filtresActifs.chantiers.map(chantierId => {
              let libellé = chantiers?.find(c => c.id === chantierId)?.nom ?? null;
              return libellé === null ? null : (
                <Tag
                  key={chantierId}
                  libellé={libellé}
                  suppressionCallback={() => {}}
                />
              );
            })
          }
        </div>
      </div>
    </BarreLatérale>
  );
}
