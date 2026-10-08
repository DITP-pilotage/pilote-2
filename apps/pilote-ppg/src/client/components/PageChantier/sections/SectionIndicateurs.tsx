import clsx from "clsx";
import Alerte from "@/client/components/_commons/Alerte/Alerte";
import IndicateursChantier from "@/components/_commons/IndicateursChantier/IndicateursChantier";
import { Indicateur } from "@/shared/indicateur/Indicateur.interface";
import { CategoriesIndicateur } from "@/client/utils/rubriques";
import {
  pageChantier,
  useTerritoireSelectionne,
} from "@/components/PageChantier/PageChantierServerSideContext";
import { usePageChantier } from "@/components/PageChantier/usePageChantier";
import { useEnv } from "@/client/hooks/useEnv";

export const SectionIndicateurs = () => {
  const {
    indicateurs,
    chantier,
    territoireCode,
    détailsIndicateurs,
    detailsIndicateursTerritoire,
    territoiresCompares,
  } = pageChantier.useServerSidePropsContext();
  const ffMasquerIndicateursNonApplicables = useEnv(
    "NEXT_PUBLIC_FF_MASQUER_INDICATEURS_NON_APPLICABLES",
  );

  const territoireSélectionné = useTerritoireSelectionne();

  const {
    estAutoriseAProposerUneValeurAvancement,
    estAutoriseAAccepterLesPropositionsDeValeurAvancement,
    estAutoriseAVoirLesAlertesMAJIndicateurs,
  } = usePageChantier();

  const estChantierArchive = chantier.statut === "ARCHIVE";

  const mailleSourceDonnees =
    chantier.mailles[territoireSélectionné.maille][territoireCode]
      .mailleSourceDonnees;

  const alerteMiseAJourIndicateur =
    estAutoriseAVoirLesAlertesMAJIndicateurs &&
    Object.values(détailsIndicateurs)
      .flatMap((values) => Object.values(values))
      .reduce((acc, val) => {
        return !val.estAJour && (val.ponderation || 0) > 0 && val.estApplicable
          ? true
          : acc;
      }, false);

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

  const territoiresCibles = [territoireCode, ...territoiresCompares];
  const indicateursApplicablesIds = ffMasquerIndicateursNonApplicables
    ? Object.keys(detailsIndicateursTerritoire).filter((indicateurId) =>
        Object.entries(detailsIndicateursTerritoire[indicateurId] ?? {}).some(
          ([key, value]) =>
            territoiresCibles.includes(key) && value.estApplicable === true,
        ),
      )
    : Object.keys(detailsIndicateursTerritoire);

  if (indicateurs.length === 0) {
    return null;
  }

  return (
    <section className="grid grid-rows-[auto_1fr] print:block" id="indicateurs">
      <h2
        className={clsx(
          "text-h4 md:text-h4-md mb-4 mt-3 md:mt-6 mx-4 md:mx-0",
          {
            "text-primary": !estChantierArchive,
            "text-dsfr-grey-50": estChantierArchive,
          },
        )}
      >
        {`Indicateurs (${indicateursApplicablesIds.length})`}
      </h2>
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
        categoriesIndicateurRepartition={categoriesIndicateurRepartition}
        estAutoriseAAccepterLesPropositionsDeValeurAvancement={
          estAutoriseAAccepterLesPropositionsDeValeurAvancement
        }
        estAutoriseAProposerUneValeurAvancement={
          estAutoriseAProposerUneValeurAvancement
        }
        indicateursApplicablesIds={indicateursApplicablesIds}
      />
    </section>
  );
};
