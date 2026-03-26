import "@gouvfr/dsfr/dist/component/form/form.min.css";
import { useState } from "react";
import clsx from "clsx";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import { Commentaires } from "@/components/PageChantier/Commentaires/Commentaires";
import SyntheseDesResultats from "@/components/PageChantier/SynthèseDesRésultatsChantier/SyntheseDesResultats";
import Sommaire from "@/client/components/_commons/Sommaire/Sommaire";
import Titre from "@/components/_commons/Titre/Titre";
import { ObjectifsChantier } from "@/components/PageChantier/ObjectifsChantier";
import {
  typesCommentaireMailleNationale,
  typesCommentaireMailleRégionaleOuDépartementale,
} from "@/server/domain/chantier/commentaire/Commentaire.interface";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import IndicateursChantier from "@/components/_commons/IndicateursChantier/IndicateursChantier";
import {
  CategoriesIndicateur,
  listeRubriquesChantier,
} from "@/client/utils/rubriques";
import Alerte from "@/client/components/_commons/Alerte/Alerte";
import ResponsablesPageChantier from "@/components/PageChantier/ResponsablesChantier/ResponsablesChantier";
import Indicateur from "@/server/domain/indicateur/Indicateur.interface";
import BandeauInformation from "@/client/components/_commons/BandeauInformation/BandeauInformation";
import { PanelMenuNavigation } from "@/components/_commons/PanelMenuNavigation/PanelMenuNavigation";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { BandeauEntetePageChantier } from "@/components/PageChantier/BandeauEntetePageChantier";
import { usePrintPageStyle } from "@/client/hooks/usePrintPageStyle";
import AvancementChantier from "./AvancementChantier/AvancementChantier";
import PageChantierEnTête from "./EnTête/EnTête";
import Cartes from "./Cartes/Cartes";
import { usePageChantier } from "./usePageChantier";
import { DécisionsStratégiques } from "./DécisionsStratégiques/DécisionsStratégiques";

const PageChantier = () => {
  usePrintPageStyle("margin: 12mm 0; size: 280mm 396mm");
  const {
    indicateurs,
    chantier,
    territoireCode,
    mailleSelectionnee,
    mailleQuery,
    détailsIndicateurs,
    detailsIndicateursTerritoire,
    avancements,
    indicateurPondérations,
    listeResponsablesLocaux,
    listeCoordinateursTerritorials,
    jalon,
    donneesComparaisonDuTauxDAvancement,
    configurationFeatureFlipping,
    territoiresCompares,
  } = pageChantier.useServerSidePropsContext();

  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  const territoireSélectionné = useTerritoireSelectionne();

  const {
    estAutoriseAImporterDesIndicateurs,
    estAutoriseAVoirLeBoutonFicheConducteur,
    estAutoriseAProposerUneValeurAvancement,
    estAutoriseAModifierLesPublications,
    estAutoriseAModifierLesObjectifs,
    estAutoriseAVoirLesAlertesMAJIndicateurs,
    estAutoriseAVoirLeSelecteurDeMaille,
    estAutoriseAAccepterLesPropositionsDeValeurAvancement,
  } = usePageChantier();

  const alerteMiseAJourIndicateur =
    estAutoriseAVoirLesAlertesMAJIndicateurs &&
    !!configurationFeatureFlipping.alerteMAJIndicateur &&
    Object.values(détailsIndicateurs)
      .flatMap((values) => Object.values(values))
      .reduce((acc, val) => {
        return !val.estAJour && (val.ponderation || 0) > 0 && val.estApplicable
          ? true
          : acc;
      }, false);

  const mailleSourceDonnees =
    chantier.mailles[territoireSélectionné.maille][territoireCode]
      .mailleSourceDonnees;

  const categoriesIndicateurRepartition: Record<
    CategoriesIndicateur,
    Indicateur[]
  > = indicateurs.reduce(
    (acc, indicateur) => {
      if (
        (détailsIndicateurs[indicateur.id][territoireCode]?.ponderation ?? 0) >
        0
      ) {
        acc.participation_ta.push(indicateur);
      } else if (
        Object.values(detailsIndicateursTerritoire[indicateur.id]).some(
          (detail) => detail.ponderation !== null && detail.ponderation > 0,
        )
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

  const categoriesAvecElements = Object.keys(
    categoriesIndicateurRepartition,
  ).filter(
    (key) =>
      categoriesIndicateurRepartition[
        key as keyof typeof categoriesIndicateurRepartition
      ].length > 0,
  ) as CategoriesIndicateur[];

  const listeRubriques = listeRubriquesChantier(
    categoriesAvecElements,
    territoireSélectionné.maille,
  );

  const pathname = "/chantier/[id]/[territoireCode]";

  const estChantierArchive = chantier.statut === "ARCHIVE";

  const territoiresCibles = [territoireCode, ...territoiresCompares];
  const indicateursApplicablesIds =
    configurationFeatureFlipping.masquerIndicateursNonApplicables
      ? Object.keys(detailsIndicateursTerritoire).filter((indicateurId) =>
          Object.entries(detailsIndicateursTerritoire[indicateurId] ?? {}).some(
            ([key, value]) =>
              territoiresCibles.includes(key) && value.estApplicable === true,
          ),
        )
      : Object.keys(detailsIndicateursTerritoire);

  return (
    <div className="flex bg-dsfr-contrast-grey print:bg-white">
      <BarreLatérale
        estOuvert={estOuverteBarreLatérale}
        setEstOuvert={setEstOuverteBarreLatérale}
      >
        <BarreLatéraleEncart
          className={
            chantier.statut !== "ARCHIVE"
              ? "bg-dsfr-blue-france-925"
              : "bg-dsfr-grey-925 !text-dsfr-grey-200"
          }
        >
          <PageChantierEnTête
            afficheLeBoutonFicheConducteur={
              estAutoriseAVoirLeBoutonFicheConducteur
            }
            afficheLeBoutonImpression
            afficheLeBoutonMiseAJourDonnee={estAutoriseAImporterDesIndicateurs}
            responsables={chantier.responsables}
          />
        </BarreLatéraleEncart>
        <Sommaire
          auClic={() => setEstOuverteBarreLatérale(false)}
          rubriques={listeRubriques}
        />
      </BarreLatérale>
      <main
        className={clsx("fr-pb-5w w-full print:mx-[12mm]", {
          "!bg-dsfr-grey-1000": estChantierArchive,
        })}
      >
        <div className="sticky top-0 z-[1] w-full shadow-[0_6px_18px_var(--shadow-color)] bg-dsfr-blue-france-850 fr-grid-row fr-pt-2w print:hidden">
          <PanelMenuNavigation
            estAutoriseAVoirLeSelecteurDeMaille={
              estAutoriseAVoirLeSelecteurDeMaille
            }
            libelleMenuNavigation="Informations du chantier"
            mailleQuery={mailleQuery}
            pathname={pathname}
            setEstOuverteBarreLatérale={setEstOuverteBarreLatérale}
            territoireCode={territoireCode}
            territoiresApplicables={chantier.territoiresApplicables}
          />
          <BandeauEntetePageChantier
            alerteMiseAJourIndicateur={alerteMiseAJourIndicateur}
          />
        </div>
        <div className="fr-container--fluid fr-py-2w fr-px-md-2w hidden print:block print:mb-4 print:[page-break-after:avoid]">
          <Titre
            baliseHtml="h1"
            className="fr-h2 fr-mb-0 fr-text--center !text-[1.875rem] !leading-9"
          >
            {chantier.nom}
          </Titre>
        </div>
        {mailleSourceDonnees === "regionale" ? (
          <BandeauInformation bandeauType="INFO" fermable={false}>
            En l'absence de données départementales, les valeurs des indicateurs
            régionaux sont reportées pour le département.
          </BandeauInformation>
        ) : null}
        <div className="fr-container--fluid fr-py-2w fr-px-md-2w">
          <div
            className={clsx(
              "grid [grid-template-areas:'avancement'_'synthèse'_'responsables'] gap-[0.7rem]",
              territoireSélectionné.maille === "nationale"
                ? "md:grid-cols-1 print:[grid-template-areas:'avancement_synthèse'_'responsables_responsables'] print:grid-cols-[auto_minmax(22.5rem,1fr)]"
                : "",
            )}
          >
            <section
              className="grid grid-rows-[auto_1fr] print:block print:break-inside-avoid [grid-area:avancement]"
              id="avancement"
            >
              <TitreInfobulleConteneur className="fr-mb-1w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0">
                <Titre
                  baliseHtml="h2"
                  className={clsx("fr-h4 fr-mb-0 fr-py-1v", {
                    "text-primary": !estChantierArchive,
                    "!text-dsfr-grey-50": estChantierArchive,
                  })}
                  estInline
                >
                  Avancement du chantier
                </Titre>
                {configurationFeatureFlipping.infobullePonderation ? (
                  indicateurPondérations.length === 0 ? (
                    <Infobulle>
                      {INFOBULLE_CONTENUS.chantier.avancement.aucunIndicateur(
                        territoireSélectionné.maille,
                      )}
                    </Infobulle>
                  ) : indicateurPondérations.length === 1 ? (
                    <Infobulle>
                      {INFOBULLE_CONTENUS.chantier.avancement.unSeulIndicateur(
                        territoireSélectionné.maille,
                        indicateurPondérations[0],
                      )}
                    </Infobulle>
                  ) : (
                    <Infobulle>
                      {INFOBULLE_CONTENUS.chantier.avancement.plusieursIndicateurs(
                        territoireSélectionné.maille,
                        indicateurPondérations,
                      )}
                    </Infobulle>
                  )
                ) : null}
              </TitreInfobulleConteneur>
              <AvancementChantier
                avancements={avancements}
                donneesComparaisonDuTauxDAvancement={
                  donneesComparaisonDuTauxDAvancement
                }
                estChantierArchive={estChantierArchive}
                jalon={jalon}
                mailleQuery={mailleQuery}
                mailleSelectionnee={mailleSelectionnee}
                territoireCode={territoireCode}
              />
            </section>
            <section
              className="grid grid-rows-[auto_1fr] print:block [grid-area:synthèse]"
              id="synthèse"
            >
              <TitreInfobulleConteneur className="fr-mb-1w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0">
                <Titre
                  baliseHtml="h2"
                  className={clsx("fr-h4 fr-mb-0 fr-py-1v", {
                    "text-primary": !estChantierArchive,
                    "!text-dsfr-grey-50": estChantierArchive,
                  })}
                  estInline
                >
                  Météo et synthèse des résultats
                </Titre>
                <Infobulle>
                  {INFOBULLE_CONTENUS.chantier.météoEtSynthèseDesRésultats}
                </Infobulle>
              </TitreInfobulleConteneur>
              <SyntheseDesResultats
                modeEcriture={estAutoriseAModifierLesPublications}
                nomTerritoire={territoireSélectionné.nomAffiché}
              />
            </section>
            <section
              className="grid grid-rows-[auto_1fr] print:block print:break-inside-avoid [grid-area:responsables]"
              id="responsables"
            >
              <Titre
                baliseHtml="h2"
                className={clsx(
                  "fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0",
                  {
                    "text-primary": !estChantierArchive,
                    "!text-dsfr-grey-50": estChantierArchive,
                  },
                )}
              >
                Responsables
              </Titre>
              <ResponsablesPageChantier
                afficheResponsablesLocaux={
                  territoireSélectionné.maille !== "nationale"
                }
                estChantierArchive={estChantierArchive}
                libelléChantier={chantier.nom}
                listeCoordinateursTerritorials={listeCoordinateursTerritorials}
                listeDirecteursProjets={chantier.responsables.directeursProjet}
                listeResponsablesLocaux={listeResponsablesLocaux}
                maille={territoireSélectionné.maille}
              />
            </section>
          </div>
          {!!chantier.tauxAvancementDonnéeTerritorialisée[mailleSelectionnee] ||
          !!chantier.météoDonnéeTerritorialisée[mailleSelectionnee] ||
          chantier.estTerritorialisé ? (
            <div className="fr-my-2w">
              <section
                className="grid grid-rows-[auto_1fr] print:block print:break-inside-avoid"
                id="cartes"
              >
                <Titre
                  baliseHtml="h2"
                  className={clsx(
                    "fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0",
                    {
                      "text-primary": !estChantierArchive,
                      "!text-dsfr-grey-50": estChantierArchive,
                    },
                  )}
                >
                  Répartition géographique
                </Titre>
                <Cartes mailleSourceDonnees={mailleSourceDonnees} />
              </section>
            </div>
          ) : null}
          <div className="fr-my-2w">
            <section
              className="grid grid-rows-[auto_1fr] print:block"
              id="objectifs"
            >
              <TitreInfobulleConteneur className="fr-mb-2w fr-mt-3v fr-mt-md-0 fr-mx-2w fr-mx-md-0">
                <Titre
                  baliseHtml="h2"
                  className={clsx("fr-h4 fr-mb-0 fr-py-1v", {
                    "text-primary": !estChantierArchive,
                    "!text-dsfr-grey-50": estChantierArchive,
                  })}
                  estInline
                >
                  Objectifs
                </Titre>
                <Infobulle>{INFOBULLE_CONTENUS.chantier.objectifs}</Infobulle>
              </TitreInfobulleConteneur>
              <ObjectifsChantier
                modeÉcriture={estAutoriseAModifierLesObjectifs}
              />
            </section>
          </div>
          {indicateurs.length > 0 ? (
            <div className="fr-my-2w">
              <section
                className="grid grid-rows-[auto_1fr] print:block"
                id="indicateurs"
              >
                <Titre
                  baliseHtml="h2"
                  className={clsx(
                    "fr-h4 fr-mb-2w fr-mt-3v fr-mt-md-3w fr-mx-2w fr-mx-md-0",
                    {
                      "text-primary": !estChantierArchive,
                      "!text-dsfr-grey-50": estChantierArchive,
                    },
                  )}
                >
                  {`Indicateurs (${indicateursApplicablesIds.length})`}
                </Titre>
                {mailleSourceDonnees === "regionale" && (
                  <Alerte
                    classesSupplementaires="fr-mb-2w"
                    message="En l'absence de données départementales, les valeurs des indicateurs régionaux sont reportées pour le département."
                    titre="Données régionales"
                    type="info"
                  />
                )}
                <IndicateursChantier
                  alerteMiseAJourIndicateur={alerteMiseAJourIndicateur}
                  categoriesIndicateurRepartition={
                    categoriesIndicateurRepartition
                  }
                  estAutoriseAAccepterLesPropositionsDeValeurAvancement={
                    estAutoriseAAccepterLesPropositionsDeValeurAvancement
                  }
                  estAutoriseAProposerUneValeurAvancement={
                    estAutoriseAProposerUneValeurAvancement
                  }
                  indicateursApplicablesIds={indicateursApplicablesIds}
                />
              </section>
            </div>
          ) : null}
          {territoireSélectionné.maille === "nationale" ? (
            <div className="fr-my-2w">
              <section
                className="grid grid-rows-[auto_1fr] print:block"
                id="décisions-stratégiques"
              >
                <TitreInfobulleConteneur className="!mb-4 !mt-3 !md:mt-0 !mx-4 !md:mx-0 flex align-center">
                  <Titre baliseHtml="h2" className="fr-h4 !m-0" estInline>
                    Décisions stratégiques
                  </Titre>
                  <Infobulle>
                    {INFOBULLE_CONTENUS.chantier.décisionsStratégiques}
                  </Infobulle>
                </TitreInfobulleConteneur>
                <DécisionsStratégiques
                  estChantierArchive={estChantierArchive}
                  modeEcriture={estAutoriseAModifierLesPublications}
                />
              </section>
            </div>
          ) : null}
          <div className="fr-my-2w">
            <section
              className="grid grid-rows-[auto_1fr] print:block"
              id="commentaires"
            >
              <TitreInfobulleConteneur className="fr-mb-2w fr-mt-3v fr-mt-md-3w fr-mx-2w fr-mx-md-0">
                <Titre
                  baliseHtml="h2"
                  className={clsx("fr-h4 fr-mb-0 fr-py-1v", {
                    "text-primary": !estChantierArchive,
                    "!text-dsfr-grey-50": estChantierArchive,
                  })}
                  estInline
                >
                  Commentaires du chantier
                </Titre>
                <Infobulle>
                  {territoireSélectionné.maille === "nationale"
                    ? INFOBULLE_CONTENUS.chantier.commentaires
                        .territoireNational
                    : INFOBULLE_CONTENUS.chantier.commentaires
                        .territoireNonNational}
                </Infobulle>
              </TitreInfobulleConteneur>
              <Commentaires
                estChantierArchive={estChantierArchive}
                modeÉcriture={estAutoriseAModifierLesPublications}
                typesCommentaire={
                  territoireSélectionné.maille === "nationale"
                    ? typesCommentaireMailleNationale
                    : typesCommentaireMailleRégionaleOuDépartementale
                }
              />
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PageChantier;
