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
import Habilitation from '@/server/domain/utilisateur/habilitation/Habilitation';
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

function convertitMailleCodeInseeEnCodeTerritoire(maille: string, codeInsee: string) {
  const lowerMaille = maille.toLowerCase();
  let codeMaille = 'DEPT';

  switch (lowerMaille) {
    case 'nationale':
    case 'nat': {
      codeMaille = 'NAT';
      break;
    }
    case 'régionale':
    case 'reg': {
      codeMaille = 'REG';
      break;
    }
  }
  return codeMaille + '-' + codeInsee;
}

export default function PageChantier({ indicateurs, habilitations }: PageChantierProps) {
  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);
  const chantierId = useRouter().query.id as string;
  const {
    détailsIndicateurs,
    commentaires,
    synthèseDesRésultats,
    objectifs,
    décisionStratégique,
    chantier,
    rechargerChantier,
    avancements,
  } = usePageChantier(chantierId);
  
  const mailleAssociéeAuTerritoireSélectionné = mailleAssociéeAuTerritoireSélectionnéTerritoiresStore();
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();

  const codeTerritoire = convertitMailleCodeInseeEnCodeTerritoire(mailleAssociéeAuTerritoireSélectionné, territoireSélectionné.codeInsee);

  const habilitation = new Habilitation(habilitations);

  console.log('pgChantier', habilitation)
  const modeÉcritureSynthese = habilitation.peutModifierLeChantier(chantierId, codeTerritoire);
  const modeÉcritureCommentaires = modeÉcritureSynthese;
  const modeÉcritureDécisionsStratégiques = modeÉcritureSynthese;
  const modeÉcritureObjectifs = habilitation.peutModifierLeChantier(chantierId, 'NAT-FR');

  const listeRubriques: Rubrique[] = useMemo(() => {
    const rubriquesIndicateursNonVides = listeRubriquesIndicateurs.filter(
      (rubriqueIndicateur) => (
        indicateurs.some(indicateur => indicateur.type === rubriqueIndicateur.typeIndicateur)
      ),
    );
    return (
      mailleAssociéeAuTerritoireSélectionné === 'nationale' ? (
        [
          { nom: 'Avancement du chantier', ancre: 'avancement' },
          { nom: 'Responsables', ancre: 'responsables' },
          { nom: 'Synthèse des résultats', ancre: 'synthèse' },
          { nom: 'Répartition géographique', ancre: 'cartes' },
          { nom: 'Objectifs', ancre: 'objectifs' },
          { nom: 'Décisions stratégiques', ancre: 'décisions-stratégiques' },
          { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: rubriquesIndicateursNonVides },
          { nom: 'Commentaires', ancre: 'commentaires' },
        ]
      ) : (
        [
          { nom: 'Avancement du chantier', ancre: 'avancement' },
          { nom: 'Responsables', ancre: 'responsables' },
          { nom: 'Synthèse des résultats', ancre: 'synthèse' },
          { nom: 'Répartition géographique', ancre: 'cartes' },
          { nom: 'Objectifs', ancre: 'objectifs' },
          { nom: 'Indicateurs', ancre: 'indicateurs', sousRubriques: rubriquesIndicateursNonVides },
          { nom: 'Commentaires', ancre: 'commentaires' },
        ]
      )
    );
  }, [indicateurs, mailleAssociéeAuTerritoireSélectionné]);

  
  

  return (
    <PageChantierStyled className="flex">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart>
          <SélecteursMaillesEtTerritoires habilitation={habilitation}/>
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
                      <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-7' : 'fr-col-xl-12'} fr-col-12`}>
                        <AvancementChantier avancements={avancements} />
                      </div>
                      <div className='fr-col-xl-5 fr-col-12'>
                        <Responsables chantier={chantier} />
                      </div>
                    </>
                  }
                  <div className={`${mailleAssociéeAuTerritoireSélectionné === 'nationale' ? 'fr-col-xl-12' : 'fr-col-xl-7'} fr-col-12`}>
                    <SynthèseDesRésultats
                      chantierId={chantier.id}
                      modeÉcriture={modeÉcritureSynthese}
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
                <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                  <div className="fr-col-12">
                    <Objectifs
                      chantierId={chantier.id}
                      codeInsee='FR'
                      maille='nationale'
                      modeÉcriture={modeÉcritureObjectifs}
                      objectifs={objectifs}
                    />
                  </div>
                </div>
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
                        modeÉcriture={modeÉcritureDécisionsStratégiques}
                      />
                    </div>
                  </div>
                }
                <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
                  <div className="fr-col-12">
                    <Commentaires
                      chantierId={chantier.id}
                      codeInsee={territoireSélectionné.codeInsee}
                      commentaires={commentaires}
                      maille={mailleAssociéeAuTerritoireSélectionné}
                      modeÉcriture={modeÉcritureCommentaires}
                    />
                  </div>
                </div>
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
