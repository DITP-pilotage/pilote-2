import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useState } from 'react';
import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import SélecteurDeMaille from '@/components/_commons/SélecteurDeMaille/SélecteurDeMaille';
import { Maille, TerritoireIdentifiant } from '@/server/domain/chantier/Chantier.interface';
import SélecteurDeTerritoire from '@/components/_commons/SélecteurDeTerritoire/SélecteurDeTerritoire';
import { territorialiserChantier } from '@/client/utils/chantier/chantiersTerritorialisés/chantiersTerritorialisés';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs, { listeRubriquesIndicateurs } from './Indicateurs/Indicateurs';
import Commentaires from './Commentaires/Commentaires';
import PageChantierProps from './PageChantier.interface';
import Responsables from './Responsables/Responsables';
import SynthèseRésultats from './SynthèseRésultats/SynthèseRésultats';
import PageChantierEnTête from './PageChantierEnTête/PageChantierEnTête';
import Cartes from './Cartes/Cartes';
import Sommaire from './Sommaire/Sommaire';
import PageChantierStyled from './PageChantier.styled';

const listeRubriques: Rubrique[] = [
  { nom: 'Avancement du chantier', ancre: 'avancement' },
  { nom: 'Synthèse des résultats', ancre: 'synthèse' },
  { nom: 'Responsables', ancre: 'responsables' },
  { nom: 'Répartition géographique', ancre: 'cartes' },
  { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: listeRubriquesIndicateurs },
  { nom: 'Commentaires', ancre: 'commentaires' },
];

export default function PageChantier({ chantier, indicateurs, synthèseDesRésultats }: PageChantierProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const [territoire, setTerritoire] = useState<TerritoireIdentifiant>({ codeInsee: 'FR', maille: 'nationale' });
  const [maille, setMaille] = useState<Maille>('nationale');

  const chantierTerritorialisé = territorialiserChantier(chantier, territoire);

  return (
    <PageChantierStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteurDeMaille
            maille={maille}
            setMaille={setMaille}
          />
          <SélecteurDeTerritoire
            maille={maille}
            setTerritoire={setTerritoire}
            territoire={territoire}
          />
        </BarreLatéraleEncart>
        <Sommaire rubriques={listeRubriques} />
      </BarreLatérale>
      <div className='contenu-principal'>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          title="Ouvrir le menu latéral"
          type="button"
        >
          Menu latéral
        </button>
        <PageChantierEnTête chantier={chantier} />
        <div className='fr-p-4w'>
          <AvancementChantier chantier={chantierTerritorialisé} />
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-5w">
            <div className="fr-col-12 fr-col-xl-6">
              <SynthèseRésultats
                chantier={chantier}
                synthèseDesRésultats={synthèseDesRésultats}
              />
            </div>
            <div className="fr-col-12 fr-col-xl-6">
              <Responsables chantier={chantier} />
            </div>
          </div>
          <Cartes chantier={chantier} />
          <Indicateurs indicateurs={indicateurs} />
          <Commentaires />
        </div>
      </div>
    </PageChantierStyled>
  );
}
