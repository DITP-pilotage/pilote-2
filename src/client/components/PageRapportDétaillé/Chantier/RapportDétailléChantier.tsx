import Link from "next/link";
import { FunctionComponent } from "react";
import Alerte from "@/components/_commons/Alerte/Alerte";
import Encart from "@/components/_commons/Encart/Encart";
import { htmlId } from "@/components/PageRapportDétaillé/PageRapportDétaillé";
import RapportDétailléChantierProps from "@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier.interface";
import Responsables from "@/components/PageChantier/ResponsablesChantier/ResponsablesChantier";
import SynthèseDesRésultats from "@/components/PageRapportDétaillé/SynthèseDesRésultats/SynthèseDesRésultats";
import IndicateursRapportDetaille from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/IndicateursRapportDetaille";
import { DecisionsStrategiquesRapportDetaille } from "@/components/PageRapportDétaillé/Chantier/DecisionsStrategiquesRapportDetaille";
import CommentairesRapportDetaille from "@/client/components/PageRapportDétaillé/Commentaires/CommentairesRapportDetaille";
import ObjectifsRapportDetaille from "@/client/components/PageRapportDétaillé/Objectifs/ObjectifsRapportDetaille";
import Titre from "@/components/_commons/Titre/Titre";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import {
  CategoriesIndicateur,
  listeRubriquesIndicateursChantier,
} from "@/client/utils/rubriques";
import Cartes from "@/client/components/PageRapportDétaillé/Cartes/Cartes";
import AvancementChantier from "@/components/PageChantier/AvancementChantier/AvancementChantier";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import { DonneesComparaisonDuTauxDAvancementType } from "@/server/domain/territoire/Territoire.interface";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLineIcon } from "@/components/_commons/Icones/ArrowLineIcon";
import RapportDétailléChantierStyled from "./RapportDétailléChantier.styled";

const RapportDétailléChantier: FunctionComponent<
  RapportDétailléChantierProps
> = ({
  mailleSelectionnee,
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
  jalon,
  listeIndicateursPrisEnCompteAvancement,
  masquerIndicateursNonApplicables,
}) => {
  const listeResponsablesLocaux =
    chantier?.responsableLocalTerritoireSélectionné ?? [];
  const listeCoordinateursTerritorials =
    chantier?.coordinateurTerritorialTerritoireSélectionné ?? [];

  const avancements = mapChantierStatistiques.get(chantier.id)!;

  const donneesComparaisonDuTauxDAvancement: DonneesComparaisonDuTauxDAvancementType =
    {
      ppgEcartMedian: chantier.ecart,
      ppgTendanceChantier: chantier.tendance,
      ppgTauxDAvancementValeurPrecedente: chantier.avancementPrecedent,
      ppgDateTauxDAvancementValeurPrecedente:
        chantier.dateTauxAvancementMandatValeurPrecedente,
    };

  const indicateursApplicables = masquerIndicateursNonApplicables
    ? indicateurs.filter(
        (indicateur) =>
          détailsIndicateurs[indicateur.id]?.[territoireCode]?.estApplicable ===
          true,
      )
    : indicateurs;

  const categoriesIndicateurRepartition: Record<
    CategoriesIndicateur,
    Indicateur[]
  > = indicateursApplicables.reduce(
    (acc, indicateur) => {
      if (
        (détailsIndicateurs[indicateur.id][territoireCode]?.ponderation ?? 0) >
        0
      ) {
        acc.participation_ta.push(indicateur);
      } else if (
        listeIndicateursPrisEnCompteAvancement.includes(indicateur.id)
      ) {
        acc.non_participation_ta.push(indicateur);
      } else {
        acc.autre.push(indicateur);
      }

      return acc;
    },
    {
      participation_ta: [] as Indicateur[],
      non_participation_ta: [] as Indicateur[],
      autre: [] as Indicateur[],
    },
  );

  return (
    <RapportDétailléChantierStyled
      className="fr-mt-4w fr-pb-4w chantier-item"
      id={htmlId.chantier(chantier.id)}
    >
      <div className="fr-mt-2w">
        <div
          className={`grid-template ${territoireSélectionné!.maille === "nationale" ? "layout--nat" : "layout--dept-reg"}`}
        >
          {avancements !== null && (
            <>
              <section className="rubrique avancement impression-section-haut-de-page">
                <Link
                  className="fr-btn gap-2 fr-btn--tertiary-no-outline fr-text--sm"
                  href={`#${htmlId.listeDesChantiers()}`}
                  title="Revenir à la liste des chantiers"
                >
                  <Icone className="w-4 h-4" icone={ArrowLineIcon} />
                  Haut de page
                </Link>
                <Encart>
                  <Titre baliseHtml="h1" className="fr-h2 fr-mb-1w">
                    {chantier.nom}
                  </Titre>
                </Encart>
                <Titre
                  baliseHtml="h2"
                  className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
                >
                  Avancement du chantier
                </Titre>
                <AvancementChantier
                  avancements={avancements}
                  donneesComparaisonDuTauxDAvancement={
                    donneesComparaisonDuTauxDAvancement
                  }
                  jalon={jalon}
                  mailleQuery={mailleSelectionnee}
                  mailleSelectionnee={mailleSelectionnee}
                  territoireCode={territoireCode}
                />
              </section>
              <section className="rubrique responsables">
                <Titre
                  baliseHtml="h2"
                  className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
                >
                  Responsables
                </Titre>
                <Responsables
                  afficheResponsablesLocaux={
                    territoireSélectionné?.maille !== "nationale"
                  }
                  libelléChantier={chantier.nom}
                  listeCoordinateursTerritorials={
                    listeCoordinateursTerritorials
                  }
                  listeDirecteursProjets={
                    chantier.responsables.directeursProjet
                  }
                  listeResponsablesLocaux={listeResponsablesLocaux}
                  maille={territoireSélectionné?.maille ?? null}
                />
              </section>
            </>
          )}
          <section className="rubrique synthèse impression-section">
            <Titre
              baliseHtml="h2"
              className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
            >
              Météo et synthèse des résultats
            </Titre>
            <SynthèseDesRésultats
              nomTerritoire={territoireSélectionné!.nomAffiché}
              synthèseDesRésultats={synthèseDesRésultats}
            />
          </section>
        </div>
        {!!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee] ||
        !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] ||
        chantier.estTerritorialisé ? (
          <div className="fr-my-2w impression-section">
            <section className="rubrique cartes">
              <Titre
                baliseHtml="h2"
                className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
              >
                Répartition géographique
              </Titre>
              <Cartes
                afficheCarteAvancement={
                  !!chantier.tauxAvancementDonnéeTerritorialisée[
                    mailleSelectionnee
                  ] || chantier.estTerritorialisé
                }
                afficheCarteMétéo={
                  !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] ||
                  chantier.estTerritorialisé
                }
                donnéesCartographieAvancement={donnéesCartographieAvancement}
                donnéesCartographieMétéo={donnéesCartographieMétéo}
                jalon={jalon}
                mailleSelectionnee={mailleSelectionnee}
                territoireCode={territoireCode}
              />
            </section>
          </div>
        ) : null}
        {objectifs !== null && objectifs.length > 0 ? (
          <div className="fr-my-2w impression-section">
            <section className="rubrique objectifs">
              <div className="rubrique__conteneur">
                <Titre
                  baliseHtml="h2"
                  className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
                >
                  Objectifs
                </Titre>
                <ObjectifsRapportDetaille objectifs={objectifs} />
              </div>
            </section>
          </div>
        ) : null}
        {indicateurs.length > 0 ? (
          <div className="fr-my-2w impression-section">
            <section className="rubrique indicateurs">
              <div className="rubrique__conteneur">
                <Titre
                  baliseHtml="h2"
                  className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
                >
                  Indicateurs
                </Titre>
                {indicateursApplicables.length > 0 ? (
                  <IndicateursRapportDetaille
                    categoriesIndicateurRepartition={
                      categoriesIndicateurRepartition
                    }
                    détailsIndicateurs={détailsIndicateurs}
                    indicateurs={indicateurs}
                    jalon={jalon}
                    listeRubriquesIndicateurs={
                      listeRubriquesIndicateursChantier
                    }
                    territoireCode={territoireCode}
                    typeDeRéforme="chantier"
                  />
                ) : (
                  <Alerte
                    titre="Aucun indicateur n'est applicable pour le territoire sélectionné"
                    type="info"
                  />
                )}
              </div>
            </section>
          </div>
        ) : null}
        {décisionStratégique !== null &&
          territoireSélectionné!.maille === "nationale" && (
            <div className="fr-my-2w impression-section">
              <section className="rubrique décisions-stratégiques">
                <div className="rubrique__conteneur">
                  <Titre
                    baliseHtml="h2"
                    className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
                  >
                    Décisions stratégiques
                  </Titre>
                  <DecisionsStrategiquesRapportDetaille
                    décisionStratégique={décisionStratégique}
                  />
                </div>
              </section>
            </div>
          )}
        {commentaires !== null && (
          <div className="fr-my-2w impression-section">
            <section className="rubrique commentaires">
              <div className="rubrique__conteneur">
                <Titre
                  baliseHtml="h2"
                  className="fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0"
                >
                  Commentaires du chantier
                </Titre>
                <CommentairesRapportDetaille
                  commentaires={commentaires}
                  nomTerritoire={territoireSélectionné!.nomAffiché}
                  typesCommentaire={
                    territoireSélectionné!.maille === "nationale"
                      ? typesCommentaireMailleNationale
                      : typesCommentaireMailleRégionaleOuDépartementale
                  }
                />
              </div>
            </section>
          </div>
        )}
      </div>
    </RapportDétailléChantierStyled>
  );
};

export default RapportDétailléChantier;
