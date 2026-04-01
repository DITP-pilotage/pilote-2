import "@gouvfr/dsfr/dist/component/form/form.min.css";
import { useState } from "react";
import clsx from "clsx";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import Sommaire from "@/client/components/_commons/Sommaire/Sommaire";
import Titre from "@/components/_commons/Titre/Titre";
import { Infobulle } from "@/components/_commons/Infobulle/Infobulle";
import INFOBULLE_CONTENUS from "@/client/constants/infobulles";
import TitreInfobulleConteneur from "@/components/_commons/TitreInfobulleConteneur/TitreInfobulleConteneur";
import {
  CategoriesIndicateur,
  listeRubriquesChantier,
} from "@/client/utils/rubriques";
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
import { usePageChantier } from "./usePageChantier";
import { SectionSyntheseDesResultats } from "./sections/SectionSyntheseDesResultats";
import { SectionResponsables } from "./sections/SectionResponsables";
import { SectionRepartitionGeographique } from "./sections/SectionRepartitionGeographique";
import { SectionObjectifs } from "./sections/SectionObjectifs";
import { SectionIndicateurs } from "./sections/SectionIndicateurs";
import { SectionDecisionsStrategiques } from "./sections/SectionDecisionsStrategiques";
import { SectionCommentaires } from "./sections/SectionCommentaires";

const PageChantierLegacy = () => {
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
            <SectionSyntheseDesResultats />
            <SectionResponsables />
          </div>
          <SectionRepartitionGeographique />
          <SectionObjectifs />
          <SectionIndicateurs />
          <SectionDecisionsStrategiques />
          <SectionCommentaires />
        </div>
      </main>
    </div>
  );
};

export default PageChantierLegacy;
