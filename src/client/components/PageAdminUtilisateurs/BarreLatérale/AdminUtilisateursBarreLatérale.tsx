import {
  actions as actionsFiltresUtilisateursStore,
  réinitialiser,
} from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Titre from '@/components/_commons/Titre/Titre';
import AdminUtilisateursBarreLatéraleProps from '@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale.interface';
import MultiSelectTerritoire from '@/components/_commons/MultiSelect/MultiSelectTerritoire/MultiSelectTerritoire';

export default function AdminUtilisateursBarreLatérale({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}: AdminUtilisateursBarreLatéraleProps) {
  const { modifierÉtatDuFiltre } = actionsFiltresUtilisateursStore();
  const réinitialiserFiltres = réinitialiser();

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <MultiSelectTerritoire
          changementValeursSélectionnéesCallback={(territoire) => {
            modifierÉtatDuFiltre(territoire, 'territoires');
          }}
          groupesÀAfficher={{
            nationale: true,
            régionale: true,
            départementale: true,
          }}
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
      </div>
    </BarreLatérale>
  );
}
