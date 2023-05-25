import Link from 'next/link';
import Encart from '@/components/PageRapportDétaillé/Encart/Encart';
import { htmlId } from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import RapportDétailléChantierProps from '@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier.interface';
import { useRapportDétailléChantier } from '@/components/PageRapportDétaillé/Chantier/useRapportDétailléChantier';
import AvancementChantier from '@/components/PageChantier/AvancementChantier/AvancementChantier';
import ResponsablesPageProjetStructurant from '@/components/PageChantier/Responsables/Responsables';
import SynthèseDesRésultats from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import Cartes from '@/components/PageChantier/Cartes/Cartes';
import Indicateurs from '@/components/PageChantier/Indicateurs/Indicateurs';
import DécisionsStratégiques from '@/components/PageChantier/DécisionsStratégiques/DécisionsStratégiques';
import Commentaires from '@/components/_commons/Commentaires/Commentaires';
import { territoireSélectionnéTerritoiresStore } from '@/stores/useTerritoiresStore/useTerritoiresStore';
import Titre from '@/components/_commons/Titre/Titre';
import { typesObjectifChantier } from '@/server/domain/objectif/Objectif.interface';
import ObjectifsPageChantier from '@/components/_commons/Objectifs/Objectifs';
import { typesCommentaireMailleNationale, typesCommentaireMailleRégionaleOuDépartementale } from '@/server/domain/commentaire/Commentaire.interface';
import RapportDétailléChantierStyled from './RapportDétailléChantier.styled';

export default function RapportDétailléChantier({ chantier, indicateurs, détailsIndicateurs, synthèseDesRésultats, commentaires, objectifs, décisionStratégique }: RapportDétailléChantierProps) {
  const territoireSélectionné = territoireSélectionnéTerritoiresStore();
  const { avancements } = useRapportDétailléChantier(chantier);

  return (
    <RapportDétailléChantierStyled
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
              <section className={`${territoireSélectionné!.maille === 'nationale' ? 'fr-col-xl-7' : 'fr-col-xl-12'} fr-col-12 rubrique avancement`}>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                >
                  Avancement du chantier
                </Titre>
                <AvancementChantier
                  avancements={avancements}
                  chantierId={chantier.id}
                />
              </section>
              <section className='fr-col-xl-5 fr-col-12 rubrique responsables'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                >
                  Responsables
                </Titre>
                <ResponsablesPageProjetStructurant responsables={chantier.responsables} />
              </section>
            </>
          }
          <section className={`${territoireSélectionné!.maille === 'nationale' ? 'fr-col-xl-12' : 'fr-col-xl-7'} fr-col-12 rubrique synthèse`}>
            <Titre
              baliseHtml='h2'
              className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
            >
              Météo et synthèse des résultats
            </Titre>
            <SynthèseDesRésultats
              estInteractif={false}
              nomTerritoire={territoireSélectionné!.nomAffiché}
              rechargerRéforme={() => {}}
              réformeId={chantier.id}
              synthèseDesRésultatsInitiale={synthèseDesRésultats}
            />
          </section>
        </div>
        <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">

          <section className="fr-col-12 rubrique cartes">
            <Titre
              baliseHtml='h2'
              className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
            >
              Répartition géographique
            </Titre>
            <Cartes
              chantierMailles={chantier.mailles}
              estInteractif={false}
            />
          </section>
        </div>
        {
          objectifs !== null &&
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <section className="fr-col-12 rubrique objectifs">
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
              >
                Objectifs
              </Titre>
              <ObjectifsPageChantier
                estInteractif={false}
                maille='nationale'
                nomTerritoire='National'
                objectifs={objectifs}
                réformeId={chantier.id}
                typesObjectif={typesObjectifChantier}
              />
            </section>
          </div>
        }
        {
          indicateurs.length > 0 &&
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <section className="fr-col-12 rubrique indicateurs">
              <Titre
                baliseHtml='h2'
                className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
              >
                Indicateurs
              </Titre>
              <Indicateurs
                détailsIndicateurs={détailsIndicateurs}
                estInteractif={false}
                indicateurs={indicateurs}
              />
            </section>
          </div>
        }
        {
          décisionStratégique !== null
          && territoireSélectionné!.maille === 'nationale' &&
          <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
            <section className="fr-col-12 rubrique décisions-stratégiques">
              <Titre
                baliseHtml="h2"
                className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
              >
                Décisions stratégiques
              </Titre>
              <DécisionsStratégiques
                chantierId={chantier.id}
                décisionStratégique={décisionStratégique}
                estInteractif={false}
              />
            </section>
          </div>
        }
        {
          commentaires !== null && (
            <div className="fr-grid-row fr-grid-row--gutters fr-my-0 fr-pb-1w">
              <section className="fr-col-12 rubrique commentaires">
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                >
                  Commentaires du chantier
                </Titre>
                <Commentaires
                  commentaires={commentaires}
                  estInteractif={false}
                  maille={territoireSélectionné!.maille}
                  nomTerritoire={territoireSélectionné!.nomAffiché}
                  réformeId={chantier.id}
                  typesCommentaire={territoireSélectionné!.maille === 'nationale' ? typesCommentaireMailleNationale : typesCommentaireMailleRégionaleOuDépartementale}
                />
              </section>
            </div>
          )
        }
      </div>
    </RapportDétailléChantierStyled>
  );
}
