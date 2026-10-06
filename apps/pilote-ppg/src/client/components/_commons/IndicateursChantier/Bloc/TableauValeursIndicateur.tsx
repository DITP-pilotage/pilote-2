import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { formaterDate } from "@/client/utils/date/date";
import { DétailsIndicateur } from "@/shared/indicateur/DetailsIndicateur.interface";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";

const CELLULE = "pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0";

export const TableauValeursIndicateur = ({
  données,
  territoireNom,
  modeImpression = false,
}: {
  données: DétailsIndicateur;
  territoireNom: string;
  modeImpression?: boolean;
}) => {
  const alignementImpression = modeImpression && "min-h-8 align-top";
  const classeEnTeteLigne = clsxm(
    CELLULE,
    "w-36 font-bold leading-5",
    alignementImpression,
  );
  const classeCellule = clsxm(CELLULE, "leading-5", alignementImpression);
  const classeCelluleValeur = clsxm(classeCellule, "flex gap-1");
  const classeDate = clsxm(
    "text-[10px]",
    modeImpression ? "!text-dsfr-mention-grey" : "texte-gris",
  );

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
    unite,
  } = données;

  const unitéAffichée =
    unite?.toLocaleLowerCase() === "pourcentage" ? " %" : "";

  return (
    <div>
      <Table.Root
        caption={`Indicateur pour ${territoireNom}`}
        captionHidden
        className={clsxm(
          "p-0 pb-4 table overflow-hidden bg-white",
          !modeImpression && "w-full",
        )}
      >
        <Table.Header>
          <Table.Row>
            <Table.ColumnHeaderCell className="py-1 md:py-1 border-b-0">
              Territoire
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="py-1 md:py-1 border-b-0">
              {territoireNom}
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          <Table.Row>
            <Table.RowHeaderCell className={classeEnTeteLigne}>
              Valeur initiale
            </Table.RowHeaderCell>
            <Table.Cell
              className={clsxm(
                CELLULE,
                "flex gap-1",
                modeImpression && "leading-5 min-h-8 align-top",
              )}
            >
              <span>
                {valeurInitiale !== null && valeurInitiale !== undefined
                  ? valeurInitiale?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurInitiale !== null ? (
                <span className={classeDate}>
                  ({formaterDate(dateValeurInitiale, "MM/YYYY")})
                </span>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className={classeEnTeteLigne}>
              Valeur d'avancement
            </Table.RowHeaderCell>
            <Table.Cell className={classeCelluleValeur}>
              <span>
                {valeurAvancement !== null && valeurAvancement !== undefined
                  ? valeurAvancement?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurAvancement !== null ? (
                <span className={classeDate}>
                  ({formaterDate(dateValeurAvancement, "MM/YYYY")})
                </span>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className={classeEnTeteLigne}>
              {"Cible " + new Date().getFullYear().toString()}
            </Table.RowHeaderCell>
            <Table.Cell className={classeCelluleValeur}>
              <span>
                {valeurCibleAnnuelle !== null &&
                valeurCibleAnnuelle !== undefined
                  ? valeurCibleAnnuelle?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null ? (
                <span className={classeDate}>
                  ({formaterDate(dateValeurCibleAnnuelle, "MM/YYYY")})
                </span>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className={classeEnTeteLigne}>
              {"Avancement " + new Date().getFullYear().toString()}
            </Table.RowHeaderCell>
            <Table.Cell className={classeCellule}>
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="côté"
                taille="md"
                valeur={avancement.annuel}
                variante="secondaire"
              />
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className={classeEnTeteLigne}>
              Cible 2026
            </Table.RowHeaderCell>
            <Table.Cell className={classeCelluleValeur}>
              <span>
                {Boolean(valeurCible)
                  ? valeurCible?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null ? (
                <span className={classeDate}>
                  ({formaterDate(dateValeurCible, "MM/YYYY")})
                </span>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className={classeEnTeteLigne}>
              Avancement 2026
            </Table.RowHeaderCell>
            <Table.Cell className={classeCellule}>
              <BarreDeProgression
                afficherTexte
                fond="gris-clair"
                positionTexte="côté"
                taille="md"
                valeur={avancement.global}
                variante="primaire"
              />
            </Table.Cell>
          </Table.Row>
        </Table.Body>
      </Table.Root>
    </div>
  );
};
