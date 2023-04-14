import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useState } from 'react';
import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import { mailleAssociéeAuTerritoireSélectionnéTerritoiresStore, territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Commentaires from '@/components/PageChantier/Commentaires/Commentaires';
import { SCOPE_SAISIE_INDICATEURS, checkAuthorizationChantierScope } from '@/server/domain/identité/Habilitation';
import AvancementChantier from './AvancementChantier/AvancementChantier';
import Indicateurs, { listeRubriquesIndicateurs } from './Indicateurs/Indicateurs';
import PageChantierProps from './PageChantier.interface';
import Responsables from './Responsables/Responsables';
import SynthèseDesRésultats from './SynthèseDesRésultats/SynthèseDesRésultats';
import PageChantierEnTête from './PageChantierEnTête/PageChantierEnTête';
import Cartes from './Cartes/Cartes';
import Sommaire from './Sommaire/Sommaire';
import PageChantierStyled from './PageChantier.styled';
import usePageChantier from './usePageChantier';
import Objectifs from './Objectifs/Objectifs';
import DécisionsStratégiques from './DécisionsStratégiques/DécisionsStratégiques';

const listeRubriques: Rubrique[] = [
  { nom: 'Avancement du chantier', ancre: 'avancement' },
  { nom: 'Responsables', ancre: 'responsables' },
  { nom: 'Synthèse des résultats', ancre: 'synthèse' },
  { nom: 'Répartition géographique', ancre: 'cartes' },
  { nom: 'Objectifs', ancre: 'objectifs' },
  { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: listeRubriquesIndicateurs },
  { nom: 'Commentaires', ancre: 'commentaires' },
];

export default function PageChantier({ chantier, indicateurs, habilitation }: PageChantierProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const { avancements, détailsIndicateurs, commentaires, synthèseDesRésultats, objectifs, décisionStratégique } = usePageChantier(chantier);
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  
  const modeÉcriture = checkAuthorizationChantierScope(habilitation, chantier.id, SCOPE_SAISIE_INDICATEURS);

  return (
    <PageChantierStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires />
        </BarreLatéraleEncart>
        <Sommaire rubriques={listeRubriques} />
      </BarreLatérale>
      <div className='contenu-principal fr-pb-5w'>
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
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-6' : 'fr-col-xl-12'} fr-col-12`}>
              <AvancementChantier avancements={avancements} />
            </div>
            <div className='fr-col-xl-6 fr-col-12'>
              <Responsables chantier={chantier} />
            </div>
            <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-12' : 'fr-col-xl-6'} fr-col-12`}>
              <SynthèseDesRésultats
                modeÉcriture={modeÉcriture}
                synthèseDesRésultatsInitiale={synthèseDesRésultats}
              />
            </div>
          </div>
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <Cartes chantier={chantier} />
            </div>
          </div>
          {
            objectifs !== null && 
            <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
              <div className="fr-col-12">
                <Objectifs
                  chantierId={chantier.id} 
                  codeInsee='FR'
                  maille='nationale'
                  modeÉcriture={modeÉcriture}
                  objectifs={objectifs}
                />
              </div>
            </div>
          }
          {
            détailsIndicateurs !== null && (
              <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                <div className="fr-col-12">
                  <Indicateurs
                    détailsIndicateurs={détailsIndicateurs}
                    indicateurs={indicateurs}
                  />
                </div>
              </div>
            )
          }
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <DécisionsStratégiques
                chantierId={chantier.id}
                décisionStratégique={[{ type: 'suivi_des_decisions', publication: décisionStratégique }]}
                modeÉcriture={modeÉcriture}
              />
            </div>
          </div>
          {
            commentaires !== null && (
              <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                <div className="fr-col-12">
                  <Commentaires
                    chantierId={chantier.id} 
                    codeInsee={territoireSélectionné.codeInsee}
                    commentaires={commentaires}
                    maille={mailleAssociéeAuTerritoireSélectionné}
                    modeÉcriture={modeÉcriture}
                  />
                </div>
              </div>
            )
          }
        </div>
      </div>
    </PageChantierStyled>
  );
}
