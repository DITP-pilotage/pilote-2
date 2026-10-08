import Link from "next/link";
import { Button } from "@/components/shared/Button";
import { FunctionComponent } from "react";
import Alerte from "@/components/_commons/Alerte/Alerte";
import { TitleBand } from "@/components/shared/TitleBand";
import { htmlId } from "@/components/PageRapportDétaillé/PageRapportDétaillé";
import RapportDétailléChantierProps from "@/components/PageRapportDétaillé/Chantier/RapportDétailléChantier.interface";
import Responsables from "@/components/PageChantier/ResponsablesChantier/ResponsablesChantier";
import SynthèseDesRésultats from "@/components/PageRapportDétaillé/SynthèseDesRésultats/SynthèseDesRésultats";
import IndicateursRapportDetaille from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/IndicateursRapportDetaille";
import { DecisionsStrategiquesRapportDetaille } from "@/components/PageRapportDétaillé/Chantier/DecisionsStrategiquesRapportDetaille";
import CommentairesRapportDetaille from "@/client/components/PageRapportDétaillé/Commentaires/CommentairesRapportDetaille";
import { ObjectifsRapportDetaille } from "@/client/components/PageRapportDétaillé/Objectifs/ObjectifsRapportDetaille";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/shared/chantier/commentaire/Commentaire.interface";
import {
  CategoriesIndicateur,
  listeRubriquesIndicateursChantier,
} from "@/client/utils/rubriques";
import Cartes from "@/client/components/PageRapportDétaillé/Cartes/Cartes";
import AvancementChantier from "@/components/PageChantier/AvancementChantier/AvancementChantier";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { DonneesComparaisonDuTauxDAvancementType } from "@/shared/territoire/Territoire.interface";
import { Icone } from "@/components/_commons/Icone";
import { ArrowLineIcon } from "@/components/_commons/Icones/ArrowLineIcon";
import { useEnv } from "@/client/hooks/useEnv";

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
}) => {
  const ffMasquerIndicateursNonApplicables = useEnv(
    "NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES",
  );
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

  const indicateursApplicables = ffMasquerIndicateursNonApplicables
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
    <section
      className="fr-mt-4w fr-pb-4w [content-visibility:auto] break-before-page"
      id={htmlId.chantier(chantier.id)}
    >
      <div className="fr-mt-2w">
        <div
          className={`grid gap-6 ${territoireSélectionné!.maille === "nationale" ? "grid-cols-[auto_minmax(22.5rem,1fr)] [grid-template-areas:'avancement_avancement'_'responsables_responsables'_'synthèse_synthèse']" : "[grid-template-areas:'avancement'_'responsables'_'synthèse']"}`}
        >
          {avancements !== null && (
            <>
              <section className="break-inside-avoid [grid-area:avancement] print:break-inside-avoid print:break-before-page">
                <Button
                  asChild
                  variant="tertiary-no-outline"
                  className="gap-2 text-sm"
                >
                  <Link
                    href={`#${htmlId.listeDesChantiers()}`}
                    title="Revenir à la liste des chantiers"
                  >
                    <Icone className="w-4 h-4" icone={ArrowLineIcon} />
                    Haut de page
                  </Link>
                </Button>
                <TitleBand>
                  <h1 className="text-h2 md:text-h2-md mb-2">{chantier.nom}</h1>
                </TitleBand>
                <h2 className="text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0">
                  Avancement du chantier
                </h2>
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
              <section className="break-inside-avoid [grid-area:responsables]">
                <h2 className="text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0">
                  Responsables
                </h2>
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
          <section className="break-inside-avoid [grid-area:synthèse] print:break-inside-avoid">
            <h2 className="text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0">
              Météo et synthèse des résultats
            </h2>
            <SynthèseDesRésultats
              nomTerritoire={territoireSélectionné!.nomAffiché}
              synthèseDesRésultats={synthèseDesRésultats}
            />
          </section>
        </div>
        {!!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee] ||
        !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] ||
        chantier.estTerritorialisé ? (
          <div className="fr-my-2w print:break-inside-avoid">
            <section className="break-inside-avoid">
              <h2 className="text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0">
                Répartition géographique
              </h2>
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
          <div className="fr-my-2w print:break-inside-avoid">
            <section className="break-inside-avoid">
              <div className="rubrique__conteneur [&>div]:h-auto">
                <h2 className="text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0">
                  Objectifs
                </h2>
                <ObjectifsRapportDetaille objectifs={objectifs} />
              </div>
            </section>
          </div>
        ) : null}
        {indicateurs.length > 0 ? (
          <div className="fr-my-2w print:break-inside-avoid">
            <section className="break-inside-avoid">
              <div className="rubrique__conteneur [&>div]:h-auto">
                <h2 className="text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0">
                  Indicateurs
                </h2>
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
            <div className="fr-my-2w print:break-inside-avoid">
              <section className="break-inside-avoid">
                <div className="rubrique__conteneur [&>div]:h-auto">
                  <h2 className="text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0">
                    Décisions stratégiques
                  </h2>
                  <DecisionsStrategiquesRapportDetaille
                    décisionStratégique={décisionStratégique}
                  />
                </div>
              </section>
            </div>
          )}
        {commentaires !== null && (
          <div className="fr-my-2w print:break-inside-avoid">
            <section className="break-inside-avoid">
              <div className="rubrique__conteneur [&>div]:h-auto">
                <h2 className="text-h4 md:text-h4-md mb-4 mt-3 md:mt-0 mx-4 md:mx-0">
                  Commentaires du chantier
                </h2>
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
    </section>
  );
};

export default RapportDétailléChantier;
