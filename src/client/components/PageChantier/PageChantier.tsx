import { useState } from 'react';
import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import FiltresSélecteurs from '@/components/PageChantiers/Filtres/FiltresSélecteurs/FiltresSélecteurs';
import SélecteurDePérimètreGéographique
  from '@/components/PageChantiers/Filtres/FiltresSélecteurs/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique';
import {
  PérimètreGéographiqueIdentifiant,
} from '@/components/PageChantiers/Filtres/FiltresSélecteurs/SélecteurDePérimètreGéographique/SélecteurDePérimètreGéographique.interface';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
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
  const [périmètreGéographique, setPérimètreGéographique] = useState<PérimètreGéographiqueIdentifiant>({
    codeInsee: 'FR',
    maille: 'nationale',
  });

  return (
    <PageChantierStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteurDePérimètreGéographique
            niveauDeMaille="départementale"
            périmètreGéographique={périmètreGéographique}
            setPérimètreGéographique={setPérimètreGéographique}
          />
        </BarreLatéraleEncart>
        <Sommaire rubriques={listeRubriques} />
      </BarreLatérale>
      <div className='contenu-principal'>
        <PageChantierEnTête chantier={chantier} />
        <div className='fr-p-4w'>
          <AvancementChantier chantier={chantier} />
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
          <Indicateurs
            indicateurs={indicateurs}
          />
          <Commentaires />
        </div>
      </div>
    </PageChantierStyled>
  );
}
