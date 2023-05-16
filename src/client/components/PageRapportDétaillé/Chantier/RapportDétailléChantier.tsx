import Link from 'next/link';
import Encart from '@/components/PageRapportDétaillé/Encart/Encart';
import { htmlId } from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import RapportDétailléChantierProps from '@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier.interface';
import { useRapportDétailléChantier } from '@/components/PageRapportDétaillé/Chantier/useRapportDétailléChantier';
import AvancementChantier from '@/components/PageChantier/AvancementChantier/AvancementChantier';
import Responsables from '@/components/PageChantier/Responsables/Responsables';
import SynthèseDesRésultats from '@/components/PageChantier/SynthèseDesRésultats/SynthèseDesRésultats';
import Cartes from '@/components/PageChantier/Cartes/Cartes';
import Objectifs from '@/components/PageChantier/Objectifs/Objectifs';
import Indicateurs from '@/components/PageChantier/Indicateurs/Indicateurs';
import DécisionsStratégiques from '@/components/PageChantier/DécisionsStratégiques/DécisionsStratégiques';
import Commentaires from '@/components/PageChantier/Commentaires/Commentaires';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Titre from '@/components/_commons/Titre/Titre';

export default function RapportDétailléChantier({ chantier, indicateurs, détailsIndicateurs, synthèseDesRésultats, commentaires, objectifs, décisionStratégique }: RapportDétailléChantierProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const { avancements } = useRapportDétailléChantier(chantier);

  return (
    <section
      className="fr-mt-4w"
      id={htmlId.chantier(chantier.id)}
    >
      <Link
        className="fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-up-line fr-btn--icon-left fr-text--sm"
        href={`#${htmlId.listeDesChantiers()}`}
        title="Revenir à la liste des chantiers"
      >
        Haut de page
      </Link>
      <Encart>
        <Titre
          baliseHtml='h1'
          className='fr-h2 fr-mb-1w'
        >
          { chantier.nom }
        </Titre>
      </Encart>
      <div className='fr-mt-2w'>
        <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
          {
            avancements !== null &&
            <>
              <div className={`${territoireSélectionné!.maille === 'nationale' ? 'fr-col-xl-6' : 'fr-col-xl-12'} fr-col-12`}>
                <AvancementChantier
                  avancements={avancements}
                  chantierId={chantier.id}
                />
              </div>
              <div className='fr-col-xl-6 fr-col-12'>
                <Responsables chantier={chantier} />
              </div>
            </>
          }
          <div className={`${territoireSélectionné!.maille === 'nationale' ? 'fr-col-xl-12' : 'fr-col-xl-6'} fr-col-12`}>
            <SynthèseDesRésultats
              chantierId={chantier.id}
              estInteractif={false}
              rechargerChantier={() => {}}
              synthèseDesRésultatsInitiale={synthèseDesRésultats}
            />
          </div>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
          <div className="fr-col-12">
            <Cartes
              chantier={chantier}
              estInteractif={false}
            />
          </div>
        </div>
        {
          objectifs !== null &&
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <Objectifs
                chantierId={chantier.id}
                codeInsee='FR'
                estInteractif={false}
                maille='nationale'
                objectifs={objectifs}
              />
            </div>
          </div>
        }
        <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
          <div className="fr-col-12">
            <Indicateurs
              détailsIndicateurs={détailsIndicateurs}
              estInteractif={false}
              indicateurs={indicateurs}
            />
          </div>
        </div>
        {
          décisionStratégique !== null
          && territoireSélectionné!.maille === 'nationale'
          && process.env.NEXT_PUBLIC_FT_DECISIONS_STRATEGIQUES_DISABLED !== 'true' &&
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <div className="fr-col-12">
              <DécisionsStratégiques
                chantierId={chantier.id}
                décisionStratégique={décisionStratégique}
                estInteractif={false}
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
                  codeInsee={territoireSélectionné!.codeInsee}
                  commentaires={commentaires}
                  estInteractif={false}
                  maille={territoireSélectionné!.maille}
                />
              </div>
            </div>
          )
        }
      </div>
    </section>
  );
}
