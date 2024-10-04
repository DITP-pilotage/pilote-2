import Link from 'next/link';
import { FunctionComponent } from 'react';
import Encart from '@/components/_commons/Encart/Encart';
import { consignesDÉcritureObjectif, libellésTypesObjectif, TypeObjectif } from '@/client/constants/libellésObjectif';

import { htmlId } from '@/components/PageRapportDétaillé/PageRapportDétaillé';
import RapportDétailléChantierProps from '@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier.interface';
import Responsables from '@/components/PageChantier/ResponsablesChantier/ResponsablesChantier';
import SynthèseDesRésultats from '@/components/_commons/SynthèseDesRésultats/SynthèseDesRésultats';
import IndicateursRapportDetaille from '@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/IndicateursRapportDetaille';
import DécisionsStratégiques from '@/components/PageChantier/DécisionsStratégiques/DécisionsStratégiques';
import Commentaires from '@/components/_commons/CommentairesNew/Commentaires';
import Titre from '@/components/_commons/Titre/Titre';
import Publication from '@/components/_commons/PublicationNew/Publication';
import { typesObjectif } from '@/server/domain/chantier/objectif/Objectif.interface';
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from '@/server/domain/chantier/commentaire/Commentaire.interface';
import { listeRubriquesIndicateursChantier } from '@/client/utils/rubriques';
import Cartes from '@/client/components/PageRapportDétaillé/Cartes/Cartes';
import Bloc from '@/components/_commons/Bloc/Bloc';
import AvancementChantier from '@/components/PageChantier/AvancementChantier/AvancementChantier';
import RapportDétailléChantierStyled from './RapportDétailléChantier.styled';

const RapportDétailléChantier: FunctionComponent<RapportDétailléChantierProps> = ({
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
}) => {

  const listeResponsablesLocaux = chantier?.responsableLocalTerritoireSélectionné ?? [];
  const listeCoordinateursTerritorials = chantier?.coordinateurTerritorialTerritoireSélectionné ?? [];

  const avancements = mapChantierStatistiques.get(chantier.id)!;

  return (
    <RapportDétailléChantierStyled
      className='fr-mt-4w fr-pb-4w chantier-item'
      id={htmlId.chantier(chantier.id)}
    >
      <div className='fr-mt-2w'>
        <div
          className={`grid-template ${territoireSélectionné!.maille === 'nationale' ? 'layout--nat' : 'layout--dept-reg'}`}
        >
          {
            avancements !== null ? (
              <>
                <section className='rubrique avancement impression-section'>
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
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                  >
                    Avancement du chantier
                  </Titre>
                  <AvancementChantier
                    avancements={avancements}
                    mailleSelectionnee={mailleSélectionnée}
                    territoireCode={territoireCode}
                  />
                </section>
                <section className='rubrique responsables impression-section'>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                  >
                    Responsables
                  </Titre>
                  <Responsables
                    afficheResponsablesLocaux={territoireSélectionné?.maille !== 'nationale'}
                    libelléChantier={chantier.nom}
                    listeCoordinateursTerritorials={listeCoordinateursTerritorials}
                    listeDirecteursProjets={chantier.responsables.directeursProjet}
                    listeResponsablesLocaux={listeResponsablesLocaux}
                    maille={territoireSélectionné?.maille ?? null}
                  />
                </section>
              </>) : null
          }
          <section className='rubrique synthèse impression-section'>
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
            <div className='fr-my-2w impression-section'>
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
            <div className='fr-my-2w impression-section'>
              <section className='rubrique objectifs'>
                <div>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                  >
                    Objectifs

                  </Titre>
                  <Bloc>
                    {
                      typesObjectif.map((type) => (
                        <Publication
                          caractéristiques={{
                            type: type,
                            entité: 'objectifs',
                            libelléType: libellésTypesObjectif[type as TypeObjectif],
                            consigneDÉcriture: consignesDÉcritureObjectif[type as TypeObjectif],
                          }}
                          estInteractif={false}
                          key={type}
                          maille='nationale'
                          modeÉcriture={false}
                          publicationInitiale={objectifs?.find(objectif => objectif?.type === type) || null}
                          réformeId={chantier.id}
                          territoireCode={territoireCode}
                        />
                      ))
                    }
                  </Bloc>

                </div>
              </section>
            </div>
          ) : null
        }
        {
          indicateurs.length > 0 ? (
            <div className='fr-my-2w impression-section'>
              <section className='rubrique indicateurs'>
                <div>
                  <Titre
                    baliseHtml='h2'
                    className='fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0'
                  >
                    Indicateurs
                  </Titre>
                  <IndicateursRapportDetaille
                    détailsIndicateurs={détailsIndicateurs}
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
          <div className='fr-my-2w impression-section'>
            <section className='rubrique décisions-stratégiques'>
              <div>
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
                  territoireCode={territoireCode}
                />
              </div>
            </section>
          </div>
        }
        {
          commentaires !== null && (
            <div className='fr-my-2w'>
              <section className='commentaires'>
                <div>
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
                    territoireCode={territoireCode}
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
};

export default RapportDétailléChantier;
