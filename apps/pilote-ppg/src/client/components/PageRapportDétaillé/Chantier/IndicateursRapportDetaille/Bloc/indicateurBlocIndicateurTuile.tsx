import { FunctionComponent } from "react";
import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { formaterDate } from "@/client/utils/date/date";
import { IndicateurDétailsParTerritoire } from "@/components/PageRapportDétaillé/Chantier/IndicateursRapportDetaille/Bloc/IndicateurBloc.interface";
import { Table } from "@/components/shared/Table";

interface IndicateurDétailsParTerritoireProps {
  indicateurDétailsParTerritoire: IndicateurDétailsParTerritoire;
  typeDeRéforme: "chantier";
  unité?: string | null;
}

const IndicateurBlocIndicateurTuile: FunctionComponent<
  IndicateurDétailsParTerritoireProps
> = ({ indicateurDétailsParTerritoire, typeDeRéforme, unité }) => {
  const {
    dateValeurInitiale,
    valeurInitiale,
    valeurAvancement,
    valeurCible,
    dateValeurCible,
    dateValeurAvancement,
    avancement,
    dateValeurCibleAnnuelle,
    valeurCibleAnnuelle,
  } = indicateurDétailsParTerritoire.données;
  const unitéAffichée =
    unité?.toLocaleLowerCase() === "pourcentage" ? " %" : "";

  return (
    <div>
      <Table.Root
        caption={`Indicateur pour ${indicateurDétailsParTerritoire.territoireNom}`}
        captionHidden
        className="p-0 pb-4 table overflow-hidden bg-white"
      >
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell className="py-1 md:py-1 border-b-0 rounded-tl-lg">
              Territoire
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="py-1 md:py-1 border-b-0 rounded-tr-lg">
              {indicateurDétailsParTerritoire.territoireNom}
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body className="[&_tr]:!bg-[unset]" zebra={false}>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              Valeur initiale
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 flex gap-1 leading-5 min-h-8 align-top">
              <span>
                {valeurInitiale !== null && valeurInitiale !== undefined
                  ? valeurInitiale?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurInitiale !== null && (
                <span className="!text-dsfr-mention-grey text-[10px]">
                  ({formaterDate(dateValeurInitiale, "MM/YYYY")})
                </span>
              )}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              Valeur d'avancement
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 flex gap-1 leading-5 min-h-8 align-top">
              <span>
                {valeurAvancement !== null && valeurAvancement !== undefined
                  ? valeurAvancement?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurAvancement !== null && (
                <span className="!text-dsfr-mention-grey text-[10px]">
                  ({formaterDate(dateValeurAvancement, "MM/YYYY")})
                </span>
              )}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              {typeDeRéforme === "chantier"
                ? "Cible " + new Date().getFullYear().toString()
                : "Cible"}
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 flex gap-1 leading-5 min-h-8 align-top">
              <span>
                {valeurCibleAnnuelle !== null &&
                valeurCibleAnnuelle !== undefined
                  ? valeurCibleAnnuelle?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null && (
                <span className="!text-dsfr-mention-grey text-[10px]">
                  ({formaterDate(dateValeurCibleAnnuelle, "MM/YYYY")})
                </span>
              )}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              {typeDeRéforme === "chantier"
                ? "Avancement " + new Date().getFullYear().toString()
                : "Avancement"}
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 leading-5 min-h-8 align-top">
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="côté"
                taille="md"
                valeur={avancement.annuel}
                variante={typeDeRéforme === "chantier" ? "secondaire" : "rose"}
              />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              {typeDeRéforme === "chantier" ? "Cible 2026" : "Cible"}
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 flex gap-1 leading-5 min-h-8 align-top">
              <span>
                {Boolean(valeurCible)
                  ? valeurCible?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null && (
                <span className="!text-dsfr-mention-grey text-[10px]">
                  ({formaterDate(dateValeurCible, "MM/YYYY")})
                </span>
              )}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5 min-h-8 align-top">
              {typeDeRéforme === "chantier" ? "Avancement 2026" : "Avancement"}
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 leading-5 min-h-8 align-top">
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="côté"
                taille="md"
                valeur={avancement.global}
                variante={typeDeRéforme === "chantier" ? "primaire" : "rose"}
              />
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </div>
  );
};

export default IndicateurBlocIndicateurTuile;
