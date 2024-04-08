import { FunctionComponent, useState } from 'react';
import PageChantiers from '@/components/PageAccueil/PageChantiers/PageChantiers';
import PageProjetsStructurants from '@/components/PageAccueil/PageProjetsStructurants/PageProjetsStructurants';
import SélecteursMaillesEtTerritoires
  from '@/client/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Titre from '@/client/components/_commons/Titre/Titre';
import Filtres from '@/components/PageAccueil/Filtres/Filtres';
import BarreLatérale from '@/client/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/client/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import PageAccueilStyled from '@/components/PageAccueil/PageAccueil.styled';
import {
  actionsTypeDeRéformeStore,
  typeDeRéformeSélectionnéeStore,
} from '@/client/stores/useTypeDeRéformeStore/useTypeDeRéformeStore';
import { ProjetStructurantVueDEnsemble } from '@/server/domain/projetStructurant/ProjetStructurant.interface';
import Ministère from '@/server/domain/ministère/Ministère.interface';
import Axe from '@/server/domain/axe/Axe.interface';
import { ChantierAccueilContrat } from '@/server/chantiers/app/contrats/ChantierAccueilContrat';
import SélecteurTypeDeRéforme from './SélecteurTypeDeRéforme/SélecteurTypeDeRéforme';

const PageAccueil: FunctionComponent<{
  chantiers: ChantierAccueilContrat[]
  projetsStructurants: ProjetStructurantVueDEnsemble[]
  ministères: Ministère[]
  axes: Axe[],
  estProjetStructurantDisponible: boolean,
}> = ({ chantiers, projetsStructurants, ministères, axes, estProjetStructurantDisponible }) => {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const typeDeRéformeSélectionné = typeDeRéformeSélectionnéeStore();
  const { modifierTypeDeRéformeSélectionné } = actionsTypeDeRéformeStore();

  return (
    <PageAccueilStyled className='flex'>
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          {
            estProjetStructurantDisponible ? (
              <SélecteurTypeDeRéforme
                modifierTypeDeRéformeSélectionné={modifierTypeDeRéformeSélectionné}
                typeDeRéformeSélectionné={typeDeRéformeSélectionné}
              />
            ) : null
        }
          <SélecteursMaillesEtTerritoires />
        </BarreLatéraleEncart>
        <section>
          <Titre
            baliseHtml='h1'
            className='fr-h4 fr-mb-1w fr-px-3w fr-mt-2w fr-col-8'
          >
            Filtres
          </Titre>
          <Filtres
            afficherToutLesFiltres={typeDeRéformeSélectionné === 'chantier' ? true : false}
            axes={axes}
            ministères={ministères}
          />
        </section>
      </BarreLatérale>
      <div className='contenu-principal'>
        <BoutonSousLigné
          classNameSupplémentaires='fr-link--icon-left fr-fi-arrow-right-line fr-hidden-lg fr-m-2w'
          onClick={() => setEstOuverteBarreLatérale(true)}
          type='button'
        >
          Filtres
        </BoutonSousLigné>
        {
          typeDeRéformeSélectionné === 'chantier' ?
            <PageChantiers 
              chantiers={chantiers} 
              ministères={ministères}
            />
            :
            estProjetStructurantDisponible ? (
              <PageProjetsStructurants
                ministères={ministères}
                projetsStructurants={projetsStructurants}
              />
            ) : null
        }
      </div>
    </PageAccueilStyled>
  );
};

export default PageAccueil;
