import { FunctionComponent } from "react";
import useRapportDétailléTableauChantiers from "@/components/PageRapportDétaillé/VueDEnsemble/RapportDétailléTableauChantiers/useRapportDétailléTableauChantiers";
import RapportDétailléTableauChantiersProps from "./RapportDétailléTableauChantiers.interface";

const RapportDétailléTableauChantiers: FunctionComponent<
  RapportDétailléTableauChantiersProps
> = ({ données, chantiersSontArchives }) => {
  const { table } = useRapportDétailléTableauChantiers(
    données,
    chantiersSontArchives,
  );

  return (
    <table.Root
      caption="Liste des chantiers"
      captionHidden
      containerClassName="m-0 p-0 [&_tbody_a]:no-underline [&_tbody_a]:bg-none"
      empty={{ title: "Aucun chantier à afficher." }}
    >
      <table.Header cellClassName="first:rounded-tl-lg last:rounded-tr-lg" />
      <table.Body rowClassName="even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover" />
    </table.Root>
  );
};

export default RapportDétailléTableauChantiers;
