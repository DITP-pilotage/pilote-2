import {
  actions as actionsFiltresUtilisateursStore,
  filtresUtilisateursActifs, réinitialiser,
} from '@/stores/useFiltresUtilisateursStore/useFiltresUtilisateursStore';
import { territoiresTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Sélecteur from '@/components/_commons/Sélecteur/Sélecteur';
import Titre from '@/components/_commons/Titre/Titre';
import AdminUtilisateursBarreLatéraleProps from '@/components/PageAdminUtilisateurs/BarreLatérale/AdminUtilisateursBarreLatérale.interface';

export default function AdminUtilisateursBarreLatérale({
  estOuverteBarreLatérale,
  setEstOuverteBarreLatérale,
}: AdminUtilisateursBarreLatéraleProps) {
  const filtresActifs = filtresUtilisateursActifs();
  const { modifierÉtatDuFiltre } = actionsFiltresUtilisateursStore();
  const réinitialiserFiltres = réinitialiser();
  const territoires = territoiresTerritoiresStore();

  return (
    <BarreLatérale
      estOuvert={estOuverteBarreLatérale}
      setEstOuvert={setEstOuverteBarreLatérale}
    >
      <BarreLatéraleEncart>
        <Sélecteur
          htmlName='territoire'
          libellé="Périmètre géographique"
          options={territoires.map(territoire => ({
            libellé: territoire.nomAffiché,
            valeur: territoire.code,
          }))}
          valeurModifiéeCallback={(territoire) => {
            modifierÉtatDuFiltre([territoire], 'territoires');
          }}
          valeurSélectionnée={filtresActifs.territoires[0]}
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
          onClick={() => modifierÉtatDuFiltre([], 'territoires')}
          type="button"
        >
          Réinitialiser les filtres
        </button>
      </div>
    </BarreLatérale>
  );
}
