import Link from 'next/link';
import Encart from '@/components/_commons/Encart/Encart';
import { htmlId } from '@/components/PageRapportDétailléNew/PageRapportDétaillé';
import RapportDétailléChantierProps
  from '@/components/PageRapportDétailléNew/Chantier/RapportDétailléChantier.interface';
import AvancementChantier from '@/components/PageChantier/AvancementChantierNew/AvancementChantier';
import Responsables from '@/components/PageChantier/Responsables/Responsables';
import SynthèseDesRésultats from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import Indicateurs from '@/components/_commons/IndicateursNew/Indicateurs';
import DécisionsStratégiques from '@/components/PageChantier/DécisionsStratégiques/DécisionsStratégiques';
import Commentaires from '@/components/_commons/Commentaires/Commentaires';
import Titre from '@/components/_commons/Titre/Titre';
import ObjectifsPageChantier from '@/components/_commons/Objectifs/Objectifs';
import { typesObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { listeRubriquesIndicateursChantier } from '@/client/utils/rubriques';
import Cartes from '@/client/components/PageRapportDétailléNew/Cartes/Cartes';
import RapportDétailléChantierStyled from './RapportDétailléChantier.styled';

export default function RapportDétailléChantier({
  mailleSélectionnée,
  territoireSélectionné,
  territoireCode,
  chantier,
  indicateurs,
  détailsIndicateurs,
  synthèseDesRésultats,
  commentaires,
  objectifs,
  décisionStratégique,
  mapChantierStatistiques,
  donnéesCartographieAvancement,
  donnéesCartographieMétéo,
}: RapportDétailléChantierProps) {

  const responsableLocal = chantier?.responsableLocalTerritoireSélectionné ?? [];
  const coordinateurTerritorial = chantier?.coordinateurTerritorialTerritoireSélectionné ?? [];

  const avancements = mapChantierStatistiques.get(chantier.id)!;

  return (
    <RapportDétailléChantierStyled
      className='fr-mt-4w fr-pb-4w chantier-item'
      id={htmlId.chantier(chantier.id)}
    >
      <Link
        className='fr-btn fr-btn--tertiary-no-outline fr-icon-arrow-up-line fr-btn--icon-left fr-text--sm'
        href={`#${htmlId.listeDesChantiers()}`}
        title='Revenir à la liste des chantiers'
      >
        Haut de page
      </Link>
      <Encart>
        <Titre
          baliseHtml='h1'
          className='fr-h2 fr-mb-1w'
        >
          {chantier.nom}
        </Titre>
      </Encart>
      <div className='fr-mt-2w'>
        <div
          className={`grid-template ${territoireSélectionné!.maille === 'nationale' ? 'layout--nat' : 'layout--dept-reg'}`}
        >
          {
            avancements !== null &&
            <>
              <section className='rubrique avancement'>
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
              <section className='rubrique responsables'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                >
                  Responsables
                </Titre>
                <Responsables
                  afficheResponsablesLocaux={territoireSélectionné?.maille !== 'nationale'}
                  coordinateurTerritorial={coordinateurTerritorial}
                  maille={territoireSélectionné?.maille ?? null}
                  responsables={chantier.responsables}
                  responsablesLocal={responsableLocal}
                />
              </section>
            </>
          }
          <section className='rubrique synthèse'>
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
        {
          (!!chantier.tauxAvancementDonnéeTerritorialisée[mailleSélectionnée] || !!chantier.météoDonnéeTerritorialisée[mailleSélectionnée] || chantier.estTerritorialisé) ? (
            <div className='fr-my-2w'>
              <section className='rubrique cartes'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                >
                  Répartition géographique
                </Titre>
                <Cartes
                  afficheCarteAvancement={!!chantier.tauxAvancementDonnéeTerritorialisée[mailleSélectionnée] || chantier.estTerritorialisé}
                  afficheCarteMétéo={!!chantier.météoDonnéeTerritorialisée[mailleSélectionnée] || chantier.estTerritorialisé}
                  donnéesCartographieAvancement={donnéesCartographieAvancement}
                  donnéesCartographieMétéo={donnéesCartographieMétéo}
                  mailleSelectionnee={mailleSélectionnée}
                  territoireCode={territoireCode}
                />
              </section>
            </div>
          ) : null
        }
        {
          objectifs !== null && objectifs.length > 0 ? (
            <div className='fr-my-2w'>
              <section className='rubrique objectifs'>
                <div className='rubrique__conteneur'>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                  >
                    Objectifs
                  </Titre>
                  <ObjectifsPageChantier
                    estEtendu
                    estInteractif={false}
                    maille='nationale'
                    nomTerritoire='National'
                    objectifs={objectifs}
                    réformeId={chantier.id}
                    typesObjectif={typesObjectif}
                  />
                </div>
              </section>
            </div>
          ) : null
        }
        {
          indicateurs.length > 0 ? (
            <div className='fr-my-2w'>
              <section className='rubrique indicateurs'>
                <div className='rubrique__conteneur'>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                  >
                    Indicateurs
                  </Titre>
                  <Indicateurs
                    chantierEstTerritorialisé={chantier.estTerritorialisé}
                    détailsIndicateurs={détailsIndicateurs}
                    estInteractif={false}
                    indicateurs={indicateurs}
                    listeRubriquesIndicateurs={listeRubriquesIndicateursChantier}
                    territoireCode={territoireCode}
                    typeDeRéforme='chantier'
                  />
                </div>
              </section>
            </div>
          ) : null
        }
        {
          décisionStratégique !== null
          && territoireSélectionné!.maille === 'nationale' &&
          <div className='fr-my-2w'>
            <section className='rubrique décisions-stratégiques'>
              <div className='rubrique__conteneur'>
                <Titre
                  baliseHtml='h2'
                  className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                >
                  Décisions stratégiques
                </Titre>
                <DécisionsStratégiques
                  chantierId={chantier.id}
                  décisionStratégique={décisionStratégique}
                  estInteractif={false}
                />
              </div>
            </section>
          </div>
        }
        {
          commentaires !== null && (
            <div className='fr-my-2w'>
              <section className='rubrique commentaires'>
                <div className='rubrique__conteneur'>
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
                </div>
              </section>
            </div>
          )
        }
      </div>
    </RapportDétailléChantierStyled>
  );
}
