import '@gouvfr/dsfr/dist/component/form/form.min.css';
import '@gouvfr/dsfr/dist/utility/icons/icons-device/icons-device.min.css';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { Rubrique } from '@/components/PageChantier/Sommaire/Sommaire.interface';
import BarreLatérale from '@/components/_commons/BarreLatérale/BarreLatérale';
import SélecteursMaillesEtTerritoires from '@/components/_commons/SélecteursMaillesEtTerritoires/SélecteursMaillesEtTerritoires';
import {
  mailleAssociéeAuTerritoireSélectionnéTerritoiresStore,
  territoireSélectionnéTerritoiresStore,
} from '@/stores/useTerritoiresStore/useTerritoiresStore';
import BarreLatéraleEncart from '@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart';
import Commentaires from '@/components/PageChantier/Commentaires/Commentaires';
import Loader from '@/components/_commons/Loader/Loader';
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

export default function PageChantier({ indicateurs, habilitation }: PageChantierProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const chantierId = useRouter().query.id as string;
  const {
    détailsIndicateurs,
    commentaires,
    synthèseDesRésultats,
    objectifs,
    décisionStratégique,
    modeÉcriture,
    chantier,
    rechargerChantier,
    avancements,
  } = usePageChantier(chantierId, habilitation);
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const listeRubriques: Rubrique[] = useMemo(() => (
    mailleAssociéeAuTerritoireSélectionné === 'nationale' ? (
      [
        { nom: 'Avancement du chantier', ancre: 'avancement' },
        { nom: 'Responsables', ancre: 'responsables' },
        { nom: 'Synthèse des résultats', ancre: 'synthèse' },
        { nom: 'Répartition géographique', ancre: 'cartes' },
        { nom: 'Objectifs', ancre: 'objectifs' },
        { nom: 'Décisions stratégiques', ancre: 'décisions-stratégiques' },
        { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: listeRubriquesIndicateurs },
        { nom: 'Commentaires', ancre: 'commentaires' },
      ]
    ) : (
      [
        { nom: 'Avancement du chantier', ancre: 'avancement' },
        { nom: 'Responsables', ancre: 'responsables' },
        { nom: 'Synthèse des résultats', ancre: 'synthèse' },
        { nom: 'Répartition géographique', ancre: 'cartes' },
        { nom: 'Objectifs', ancre: 'objectifs' },
        { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: listeRubriquesIndicateurs },
        { nom: 'Commentaires', ancre: 'commentaires' },
      ]
    )
  ), [mailleAssociéeAuTerritoireSélectionné]);

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
      <main className='fr-pb-5w'>
        <div className="texte-impression fr-text--lg fr-mb-5w">
          Pilote - Chantiers prioritaires / Extraction de la page chantier générée le
          {' '}
          {new Date().toLocaleString('FR-fr')}
        </div>
        <button
          className="fr-sr-only-xl fr-btn fr-btn--secondary fr-mb-2w"
          onClick={() => setEstOuverteBarreLatérale(true)}
          title="Ouvrir le menu latéral"
          type="button"
        >
          Menu latéral
        </button>
        {
          chantier !== null ? (
            <>
              <PageChantierEnTête chantier={chantier} />
              <div className='fr-p-4w'>
                <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                  {
                    avancements !== null &&
                    <>
                      <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-6' : 'fr-col-xl-12'} fr-col-12`}>
                        <AvancementChantier avancements={avancements} />
                      </div>
                      <div className='fr-col-xl-6 fr-col-12'>
                        <Responsables chantier={chantier} />
                      </div>
                    </>
                  }
                  <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-12' : 'fr-col-xl-6'} fr-col-12`}>
                    <SynthèseDesRésultats
                      chantierId={chantier.id}
                      modeÉcriture={modeÉcriture}
                      rechargerChantier={rechargerChantier}
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
                {
                  mailleAssociéeAuTerritoireSélectionné === 'nationale' &&
                  <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                    <div className="fr-col-12">
                      <DécisionsStratégiques
                        chantierId={chantier.id}
                        décisionStratégique={décisionStratégique}
                        modeÉcriture={modeÉcriture}
                      />
                    </div>
                  </div>
                }
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
            </>
          ) : (
            <Loader />
          )
        }
      </main>
    </PageChantierStyled>
  );
}
