import { useState } from 'react';
import PageChantiers from '@/components/PageAccueil/PageChantiers/PageChantiers';
import PageProjetsStructurants from '@/components/PageAccueil/PageProjetsStructurants/PageProjetsStructurants';
import SélecteursMaillesEtTerritoires from '@/client/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Titre from '@/client/components/_commons/Titre/Titre';
import Filtres from '@/components/PageAccueil/PageChantiers/Filtres/Filtres';
import BarreLatérale from '@/client/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/client/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PageAccueilProps from './PageAccueil.interface';
import { TypeDeRéforme } from './SélecteurTypeDeRéforme/SélecteurTypeDeRéforme.interface';
import SélecteurTypeDeRéforme from './SélecteurTypeDeRéforme/SélecteurTypeDeRéforme';

export default function PageAccueil({ chantiers, projetsStructurants, ministères, axes, ppgs, habilitations }: PageAccueilProps) {
  const habilitation = new Habilitation(habilitations);
  const [typeDeRéformeSélectionné, setTypeDeRéformeSélectionné] = useState<TypeDeRéforme>('projetStructurant');
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  return (
    <div className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          {
            process.env.NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS === 'true' &&
            <SélecteurTypeDeRéforme
              modifierTypeDeRéformeSélectionné={setTypeDeRéformeSélectionné}
              typeDeRéformeSélectionné={typeDeRéformeSélectionné}
            />
        }
          <SélecteursMaillesEtTerritoires 
            habilitation={habilitation}
          />
        </BarreLatéraleEncart>
        <section>
          <Titre
            baliseHtml="h1"
            className="fr-h4 fr-mb-1w fr-px-3w fr-mt-2w fr-col-8"
          >
            Filtres
          </Titre>
          <Filtres
            afficherToutLesFiltres={typeDeRéformeSélectionné === 'chantier' ? true : false}
            axes={axes}
            ministères={ministères}
            ppgs={ppgs}
          />
        </section>
      </BarreLatérale>
      <button
        className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
        onClick={() => setEstOuverteBarreLatérale(true)}
        title="Ouvrir les filtres"
        type="button"
      >
        Filtres
      </button>
      {
        typeDeRéformeSélectionné === 'chantier' ?
          <PageChantiers
            chantiers={chantiers}
            habilitation={habilitation}
          />
          :
          process.env.NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS === 'true' && <PageProjetsStructurants projetsStructurants={projetsStructurants} />
        }
    </div> 
  );
}
