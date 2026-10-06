import { Control, Controller } from "react-hook-form";
import { Button } from "@/components/shared/Button";
import { Infobulle } from "@/components/shared/Infobulle";
import {
  MAILLES,
  Maille,
  LIBELLÉ_MAILLE,
} from "@/server/metadata-chantier/domain/maille";
import {
  CHAMP_POIDS_PAR_MAILLE,
  usePonderationsIndicateursForm,
} from "@/components/PageAdminChantiers/usePonderationsIndicateursForm";
import { IndicateurPonderation } from "@/server/metadata-chantier/queries/RecupererIndicateursPonderationsChantierQuery";
import { Table } from "@/components/shared/Table";
import { clsxm } from "@/utils/clsxm";

const CELLULE = "text-[length:inherit] leading-[inherit]";

const LignePonderation = ({
  control,
  index,
  ponderation,
}: {
  control: Control<{
    lignes: {
      poidsPourcentDept: number | null;
      poidsPourcentReg: number | null;
      poidsPourcentNat: number | null;
    }[];
  }>;
  index: number;
  ponderation: IndicateurPonderation;
}) => (
  <Table.Row className="border-t border-dsfr-grey-1000">
    <Table.Cell
      className={clsxm(
        CELLULE,
        "px-4 py-3 md:px-4 md:py-3 text-dsfr-grey-50 truncate",
      )}
      title={`${ponderation.indicId} - ${ponderation.indicNom}`}
    >
      {ponderation.indicId} - {ponderation.indicNom}
    </Table.Cell>
    {MAILLES.map((maille) => {
      const applicable = ponderation.maillesApplicables.includes(maille);
      return (
        <Table.Cell
          className={clsxm(CELLULE, "px-4 py-2 md:px-4 md:py-2 text-right")}
          key={maille}
        >
          <Controller
            control={control}
            name={`lignes.${index}.${CHAMP_POIDS_PAR_MAILLE[maille]}`}
            render={({ field }) => (
              <input
                className={clsxm(
                  "w-full text-right border rounded !py-1 !px-2",
                  applicable
                    ? "!bg-white border-dsfr-grey-900"
                    : "!bg-dsfr-grey-1000 border-dsfr-grey-1000 text-dsfr-grey-900",
                )}
                disabled={!applicable}
                onChange={(event) =>
                  field.onChange(
                    event.target.value === ""
                      ? null
                      : Number(event.target.value),
                  )
                }
                type="number"
                value={field.value ?? ""}
              />
            )}
          />
        </Table.Cell>
      );
    })}
  </Table.Row>
);

const PiedTableauPonderations = ({
  sommesParMaille,
  erreursSommes,
}: {
  sommesParMaille: Partial<Record<Maille, number>>;
  erreursSommes: Partial<Record<Maille, string>>;
}) => (
  <Table.Footer>
    <Table.Row className="border-t-2 border-dsfr-grey-925 bg-dsfr-grey-1000">
      <Table.Cell
        className={clsxm(
          CELLULE,
          "px-4 py-3 md:px-4 md:py-3 font-semibold text-dsfr-grey-50",
        )}
      >
        Somme
      </Table.Cell>
      {MAILLES.map((maille) => {
        const somme = sommesParMaille[maille];
        const enErreur = !!erreursSommes[maille];
        return (
          <Table.Cell
            className={clsxm(CELLULE, "px-4 py-3 md:px-4 md:py-3 text-right")}
            key={maille}
          >
            <span
              className={clsxm(
                "inline-flex items-center gap-1 font-semibold",
                enErreur ? "text-error" : "text-dsfr-grey-50",
              )}
            >
              {somme === undefined ? "-" : somme}
              {erreursSommes[maille] && (
                <Infobulle
                  classNameIcone="w-4 h-4 text-error"
                  styleIconInfoBulle="warning"
                >
                  {erreursSommes[maille]}
                </Infobulle>
              )}
            </span>
          </Table.Cell>
        );
      })}
    </Table.Row>
  </Table.Footer>
);

const OngletPonderationsIndicateurs = ({
  ponderations,
}: {
  ponderations: IndicateurPonderation[];
}) => {
  const {
    reactHookForm,
    sommesParMaille,
    erreursSommes,
    enregistrer,
    estEnCoursDEnregistrement,
  } = usePonderationsIndicateursForm({ ponderations });

  if (ponderations.length === 0) {
    return (
      <p className="text-sm text-dsfr-mention-grey">
        Aucun indicateur n&apos;est rattaché à ce chantier.
      </p>
    );
  }

  return (
    <form onSubmit={enregistrer}>
      <div className="flex items-center justify-end mb-4">
        <Button
          disabled={estEnCoursDEnregistrement}
          type="submit"
          variant="primary"
        >
          Enregistrer
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm ring-1 ring-dsfr-grey-925">
        <Table.Root
          caption="Pondération des indicateurs par maille"
          captionHidden
          className="w-full table-fixed text-sm"
        >
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeaderCell
                className={clsxm(
                  CELLULE,
                  "text-left px-4 py-3 md:px-4 md:py-3",
                )}
              >
                Indicateur
              </Table.ColumnHeaderCell>
              {MAILLES.map((maille) => (
                <Table.ColumnHeaderCell
                  className={clsxm(
                    CELLULE,
                    "w-36 text-right px-4 py-3 md:px-4 md:py-3",
                  )}
                  key={maille}
                >
                  {LIBELLÉ_MAILLE[maille]} (%)
                </Table.ColumnHeaderCell>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {ponderations.map((ponderation, index) => (
              <LignePonderation
                control={reactHookForm.control}
                index={index}
                key={ponderation.indicId}
                ponderation={ponderation}
              />
            ))}
          </Table.Body>
          <PiedTableauPonderations
            erreursSommes={erreursSommes}
            sommesParMaille={sommesParMaille}
          />
        </Table.Root>
      </div>

      <div className="flex justify-end mt-6 pt-4 border-t border-dsfr-grey-925">
        <Button
          disabled={estEnCoursDEnregistrement}
          type="submit"
          variant="primary"
        >
          Enregistrer
        </Button>
      </div>
    </form>
  );
};

export default OngletPonderationsIndicateurs;
