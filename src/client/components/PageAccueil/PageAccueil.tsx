import { useState } from 'react';
import PageChantiers from '@/client/components/PageChantiers/PageChantiers';
import PageProjetsStructurants from '@/client/components/PageProjetsStructurants/PageProjetsStructurants';
import SélecteursMaillesEtTerritoires from '@/client/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Titre from '@/client/components/_commons/Titre/Titre';
import Filtres from '@/client/components/PageChantiers/Filtres/Filtres';
import BarreLatérale from '@/client/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/client/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
import PageAccueilProps from './PageAccueil.interface';
import { Entité } from './SélecteurEntité/SélecteurEntité.interface';
import SélecteurEntité from './SélecteurEntité/SélecteurEntité';

export default function PageAccueil({ chantiers, ministères, axes, ppg, habilitations }: PageAccueilProps) {
  const habilitation = new Habilitation(habilitations);
  const [entitéSélectionnée, setEntitéSélectionnée] = useState<Entité>('chantier');
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  return (
    <div className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteurEntité
            entitéSélectionnée={entitéSélectionnée} 
            modifierEntitéSélectionnée={setEntitéSélectionnée}
          />
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
            afficherToutLesFiltres={entitéSélectionnée === 'chantier' ? true : false}
            axes={axes}
            ministères={ministères}
            ppg={ppg}
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
        entitéSélectionnée === 'chantier' ? 
          <PageChantiers
            chantiers={chantiers}
            habilitation={habilitation}
          />
          : 
          <PageProjetsStructurants />
        }
    </div> 
  );
}
