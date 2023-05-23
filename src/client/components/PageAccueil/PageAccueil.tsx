import { useState } from 'react';
import PageChantiers from '@/components/PageAccueil/PageChantiers/PageChantiers';
import PageProjetsStructurants from '@/components/PageAccueil/PageProjetsStructurants/PageProjetsStructurants';
import SélecteursMaillesEtTerritoires from '@/client/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import Titre from '@/client/components/_commons/Titre/Titre';
import Filtres from '@/components/PageAccueil/Filtres/Filtres';
import BarreLatérale from '@/client/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/client/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import BoutonSousLigné from '@/components/_commons/BoutonSousLigné/BoutonSousLigné';
import PageAccueilStyled from '@/components/PageAccueil/PageAccueil.styled';
import PageAccueilProps from './PageAccueil.interface';
import { TypeDeRéforme } from './SélecteurTypeDeRéforme/SélecteurTypeDeRéforme.interface';
import SélecteurTypeDeRéforme from './SélecteurTypeDeRéforme/SélecteurTypeDeRéforme';

export default function PageAccueil({ chantiers, projetsStructurants, ministères, axes, ppgs }: PageAccueilProps) {
  const [typeDeRéformeSélectionné, setTypeDeRéformeSélectionné] = useState<TypeDeRéforme>('chantier');
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  return (
    <PageAccueilStyled className='flex'>
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
          <SélecteursMaillesEtTerritoires />
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
      <div>
        <BoutonSousLigné
          classNameSupplémentaires="fr-link--icon-left fr-fi-arrow-right-line fr-sr-only-xl fr-m-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          type="button"
        >
          Filtres
        </BoutonSousLigné>
        {
          typeDeRéformeSélectionné === 'chantier' ?
            <PageChantiers chantiers={chantiers} />
            :
            process.env.NEXT_PUBLIC_FF_PROJETS_STRUCTURANTS === 'true' && <PageProjetsStructurants projetsStructurants={projetsStructurants} />
        }
      </div>
    </PageAccueilStyled>
  );
}
