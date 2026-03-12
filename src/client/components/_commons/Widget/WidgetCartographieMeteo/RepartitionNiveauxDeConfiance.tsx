import { Fragment, useMemo } from "react";
import { getCouleurTerritoire } from "@/client/utils/couleur/paletteTerritoires";
import { territoiresGroupesPourPicker } from "@/client/constants/territoires";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";
import { Picker } from "@/components/shared/Picker";
import { Select } from "@/components/shared/Select";
import { useTuileWidget } from "@/components/_commons/Widget/TuileWidget/TuileWidgetContext";
import { clsxm } from "@/utils/clsxm";

const ordreMeteo: Record<string, number> = {
  SOLEIL: 0,
  COUVERT: 1,
  NUAGE: 2,
  ORAGE: 3,
  NON_NECESSAIRE: 4,
  NON_RENSEIGNEE: 5,
};

function formaterNomTerritoire(territoire: MeteoTerritoireViewModel): string {
  if (territoire.maille === "DEPT") {
    return `${territoire.codeInsee} - ${territoire.territoireNom}`;
  }
  return territoire.territoireNom;
}

export const RepartitionNiveauxDeConfiance = ({
  territoiresSelectionnes,
  onSupprimerTerritoire,
  onAjouterTerritoire,
  onAjouterTerritoires,
  jalon,
  territoireCode,
}: {
  territoiresSelectionnes: MeteoTerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  onAjouterTerritoire: (territoireCode: string) => void;
  onAjouterTerritoires: (territoireCodes: string[]) => void;
  jalon: number;
  territoireCode: string;
}) => {
  const { modeDisposition } = useTuileWidget();
  const groupedOptions = useMemo(() => {
    const selectedCodes = new Set(
      territoiresSelectionnes.map((territoire) => territoire.territoireCode),
    );

    return territoiresGroupesPourPicker
      .map((group) => ({
        ...group,
        options: group.options.filter((opt) => !selectedCodes.has(opt.valeur)),
      }))
      .filter((group) => group.options.length > 0);
  }, [territoiresSelectionnes]);

  const territoiresTries = useMemo(
    () =>
      [...territoiresSelectionnes].sort(
        (a, b) =>
          (ordreMeteo[a.meteo ?? ""] ?? 99) - (ordreMeteo[b.meteo ?? ""] ?? 99),
      ),
    [territoiresSelectionnes],
  );

  return (
    <div>
      <div className="grid grid-cols-2 border-y text-xs">
        <div className="grid col-span-2 grid-cols-subgrid border-b border-b-black">
          <div />
          <div className="text-center text-sm py-1 text-dsfr-mention-grey">
            {jalon}
          </div>
        </div>

        {territoiresTries.map((territoire, index) => {
          const meteo = territoire.meteo as Météo;
          const dateMaj = territoire.dateDeMajQualitative
            ? new Date(territoire.dateDeMajQualitative).toLocaleDateString(
                "fr-FR",
              )
            : "—";
          const estInitial = territoire.territoireCode === territoireCode;
          const couleur = getCouleurTerritoire(index);

          return (
            <Fragment key={territoire.territoireCode}>
              <div
                className={clsxm("border-b", {
                  "flex justify-center": modeDisposition === "G",
                })}
              >
                <div
                  className={clsxm(
                    "py-2 grid grid-cols-[1fr_30px] items-center gap-2",
                    {
                      "w-full max-w-[300px] mr-auto": modeDisposition === "G",
                    },
                  )}
                >
                  <span className="text-right" style={{ color: couleur }}>
                    {formaterNomTerritoire(territoire)}
                  </span>
                  {!estInitial && (
                    <button
                      onClick={() =>
                        onSupprimerTerritoire(territoire.territoireCode)
                      }
                      title={`Retirer ${territoire.territoireNom}`}
                      type="button"
                      className="p-2"
                      style={{ color: couleur }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
              <div
                className={clsxm("py-2 flex items-center border-b", {
                  "flex-col": modeDisposition === "P",
                  "gap-4": modeDisposition === "G",
                })}
              >
                <div className="flex items-center gap-2">
                  <MeteoPicto meteo={meteo} size="sm" />
                  <span>
                    {territoire.estApplicable === false
                      ? "Non applicable"
                      : libellésMétéos[meteo]}
                  </span>
                </div>
                <span className="text-[10px] !text-dsfr-grey-625">
                  ({dateMaj})
                </span>
              </div>
            </Fragment>
          );
        })}
      </div>

      {groupedOptions.length > 0 && (
        <Picker
          key={territoiresSelectionnes.length}
          onValueChange={(valeur) => onAjouterTerritoire(valeur)}
          onValuesChange={onAjouterTerritoires}
          options={groupedOptions}
          trigger={
            <Select.LinkButtonTrigger className="mt-2">
              + ajouter un territoire
            </Select.LinkButtonTrigger>
          }
        />
      )}
    </div>
  );
};
