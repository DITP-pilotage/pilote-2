import BarreDeProgression from "@/components/_commons/BarreDeProgression/BarreDeProgression";
import { formaterDate } from "@/client/utils/date/date";
import { useBlocIndicateurContext } from "@/components/PageChantier/useBlocIndicateurContext";
import { useTerritoireSelectionne } from "@/components/PageChantier/PageChantierServerSideContext";
import { Table } from "@/components/shared/Table";

const IndicateurBlocIndicateurTuile = () => {
  const { detailIndicateurDuTerritoire } = useBlocIndicateurContext();
  const detailTerritoireSelectionne = useTerritoireSelectionne();

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
  } = detailIndicateurDuTerritoire;

  const unitéAffichée =
    unite?.toLocaleLowerCase() === "pourcentage" ? " %" : "";

  return (
    <div>
      <Table.Root
        bordered={false}
        caption={`Indicateur pour ${detailTerritoireSelectionne.nom}`}
        captionHidden
        className="p-0 pb-4 w-full table overflow-hidden bg-white"
      >
        <Table.Header className="bg-dsfr-blue-france-925 bg-none">
          <Table.Row>
            <Table.ColumnHeaderCell className="py-1 md:py-1 border-b-0 rounded-tl-lg">
              Territoire
            </Table.ColumnHeaderCell>
            <Table.ColumnHeaderCell className="py-1 md:py-1 border-b-0 rounded-tr-lg">
              {detailTerritoireSelectionne.nom}
            </Table.ColumnHeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body className="bg-none [&_tr]:!bg-[unset]" zebra={false}>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5">
              Valeur initiale
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 flex gap-1">
              <span>
                {valeurInitiale !== null && valeurInitiale !== undefined
                  ? valeurInitiale?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurInitiale !== null ? (
                <span className="texte-gris text-[10px]">
                  ({formaterDate(dateValeurInitiale, "MM/YYYY")})
                </span>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5">
              Valeur d'avancement
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 flex gap-1 leading-5">
              <span>
                {valeurAvancement !== null && valeurAvancement !== undefined
                  ? valeurAvancement?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurAvancement !== null ? (
                <span className="texte-gris text-[10px]">
                  ({formaterDate(dateValeurAvancement, "MM/YYYY")})
                </span>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5">
              {"Cible " + new Date().getFullYear().toString()}
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 flex gap-1 leading-5">
              <span>
                {valeurCibleAnnuelle !== null &&
                valeurCibleAnnuelle !== undefined
                  ? valeurCibleAnnuelle?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null ? (
                <span className="texte-gris text-[10px]">
                  ({formaterDate(dateValeurCibleAnnuelle, "MM/YYYY")})
                </span>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5">
              {"Avancement " + new Date().getFullYear().toString()}
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 leading-5">
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
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5">
              Cible 2026
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 flex gap-1 leading-5">
              <span>
                {Boolean(valeurCible)
                  ? valeurCible?.toLocaleString() + unitéAffichée
                  : ""}
              </span>
              {dateValeurCible !== null ? (
                <span className="texte-gris text-[10px]">
                  ({formaterDate(dateValeurCible, "MM/YYYY")})
                </span>
              ) : null}
            </Table.Cell>
          </Table.Row>
          <Table.Row>
            <Table.RowHeaderCell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 w-36 font-bold leading-5">
              Avancement 2026
            </Table.RowHeaderCell>
            <Table.Cell className="pt-2 pb-0 pr-0 md:pt-2 md:pb-0 md:pr-0 leading-5">
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

export default IndicateurBlocIndicateurTuile;
