import { FunctionComponent } from "react";
import BarreDeRecherche from "@/components/_commons/BarreDeRecherche/BarreDeRecherche";
import { useTableauChantiers } from "@/components/PageAccueil/PageChantiers/TableauChantiers/useTableauChantiers";
import { TableauChantiersActionsDeTri } from "@/components/PageAccueil/PageChantiers/TableauChantiers/TableauChantiersActionsDeTri";
import { clsxm } from "@/utils/clsxm";
import { SelecteurGroupementTableauChantier } from "./SelecteurGroupementTableauChantier";
import TableauChantiersProps from "./TableauChantiers.interface";

const TableauChantiers: FunctionComponent<TableauChantiersProps> = ({
  nombreTotalChantiersAvecAlertes,
  données,
  ministèresDisponibles,
  territoireCode,
  jalon,
  chantiersSontArchives,
}) => {
  const { table, changementDeLaRechercheCallback, valeurDeLaRecherche } =
    useTableauChantiers(
      données,
      ministèresDisponibles,
      nombreTotalChantiersAvecAlertes,
      chantiersSontArchives,
      jalon,
      territoireCode,
    );

  const lignesFeuille = chantiersSontArchives
    ? "even:bg-dsfr-contrast-grey odd:bg-dsfr-grey-1000 even:hover:bg-dsfr-grey-950-hover odd:hover:bg-dsfr-grey-975-hover"
    : "even:bg-dsfr-blue-france-950 odd:bg-dsfr-alt-blue-france even:hover:bg-dsfr-blue-france-950-hover odd:hover:bg-dsfr-blue-france-975-hover";
  const ligneGroupe =
    "relative not-first:border-t-primary not-first:border-t-2 font-bold bg-white bg-[image:linear-gradient(0deg,theme(colors.dsfr-grey-900),theme(colors.dsfr-grey-900))] bg-no-repeat bg-bottom bg-[size:100%_1px] [@media(hover:hover)]:hover:bg-dsfr-grey-1000";

  return (
    <section className="m-0 p-0 text-dsfr-grey-50">
      <div className="flex flex-col justify-between 2xl:flex-row gap-4 2xl:items-end w-full mb-4">
        <div className="flex flex-col 2xl:flex-row gap-4">
          <div className="w-80">
            <BarreDeRecherche
              changementDeLaRechercheCallback={changementDeLaRechercheCallback}
              valeur={valeurDeLaRecherche}
            />
          </div>
        </div>
        <div className="flex 2xl:flex-row gap-4 items-end">
          <SelecteurGroupementTableauChantier />
          <TableauChantiersActionsDeTri table={table} />
        </div>
      </div>
      <table.Root
        caption="Liste des chantiers"
        captionHidden
        empty={{
          title: "Aucun chantier ne correspond à votre recherche !",
          description:
            "Vous pouvez modifier vos filtres pour élargir votre recherche.",
        }}
        tileClassName={(row) =>
          clsxm("px-4 py-2", row.getIsGrouped() ? ligneGroupe : lignesFeuille)
        }
      >
        <table.Header cellClassName="px-4 md:px-4 first:rounded-tl-lg last:rounded-tr-lg max-[78rem]:!text-xs" />
        <table.Body
          cellClassName="px-4 py-2 md:px-4 md:py-2"
          rowClassName={(row) =>
            clsxm(
              "h-[4.5rem]",
              row.getIsGrouped()
                ? clsxm("cursor-pointer", ligneGroupe)
                : lignesFeuille,
            )
          }
          zebra={false}
        />
      </table.Root>
      <table.Pagination />
    </section>
  );
};

export default TableauChantiers;
