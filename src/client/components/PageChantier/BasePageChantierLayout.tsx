import "@gouvfr/dsfr/dist/component/form/form.min.css";
import { ReactNode, useState } from "react";
import clsx from "clsx";
import BarreLatérale from "@/components/_commons/BarreLatérale/BarreLatérale";
import BarreLatéraleEncart from "@/components/_commons/BarreLatérale/BarreLatéraleEncart/BarreLatéraleEncart";
import Sommaire from "@/client/components/_commons/Sommaire/Sommaire";
import Titre from "@/components/_commons/Titre/Titre";
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
import PageChantierEnTête from "./EnTête/EnTête";
import { usePageChantier } from "./usePageChantier";

interface BasePageChantierLayoutProps {
  children: ReactNode;
}

export const BasePageChantierLayout = ({
  children,
}: BasePageChantierLayoutProps) => {
  usePrintPageStyle("margin: 12mm 0; size: 280mm 396mm");
  const {
    indicateurs,
    chantier,
    territoireCode,
    mailleQuery,
    détailsIndicateurs,
    detailsIndicateursTerritoire,
    configurationFeatureFlipping,
  } = pageChantier.useServerSidePropsContext();

  const [estOuverteBarreLatérale, setEstOuverteBarreLatérale] = useState(false);

  const territoireSélectionné = useTerritoireSelectionne();

  const {
    estAutoriseAImporterDesIndicateurs,
    estAutoriseAVoirLeBoutonFicheConducteur,
    estAutoriseAVoirLesAlertesMAJIndicateurs,
    estAutoriseAVoirLeSelecteurDeMaille,
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
          {children}
        </div>
      </main>
    </div>
  );
};
