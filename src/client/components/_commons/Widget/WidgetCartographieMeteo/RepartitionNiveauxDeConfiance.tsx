import { Fragment, useMemo } from "react";
import { getCouleurTerritoire } from "@/client/utils/couleur/paletteTerritoires";
import { listeTerritoires } from "@/client/constants/territoires";
import { libellésMétéos, Météo } from "@/server/domain/météo/Météo.interface";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";
import { Picker, PickerOptionGroup } from "@/components/shared/Picker";
import { Select } from "@/components/shared/Select";

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
  jalon,
  initialTerritoiresCodes,
}: {
  territoiresSelectionnes: MeteoTerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  onAjouterTerritoire: (territoireCode: string) => void;
  jalon: number;
  initialTerritoiresCodes: string[];
}) => {
  const groupedOptions = useMemo(() => {
    const selectedCodes = new Set(
      territoiresSelectionnes.map((territoire) => territoire.territoireCode),
    );
    const groups: PickerOptionGroup<string>[] = [];

    for (const region of listeTerritoires.régions) {
      const departements = listeTerritoires.départements.filter(
        (dept) => dept.codeParent === region.code,
      );

      const options = [
        { libelle: region.nomAffiché, valeur: region.code },
        ...departements.map((dept) => ({
          libelle: dept.nomAffiché,
          valeur: dept.code,
        })),
      ].filter((option) => !selectedCodes.has(option.valeur));

      if (options.length > 0) {
        groups.push({
          libelle: region.nomAffiché,
          valeur: region.code,
          options,
        });
      }
    }

    return groups;
  }, [territoiresSelectionnes]);

  return (
    <div>
      <div className="grid grid-cols-2 border-y text-xs">
        <div className="grid col-span-2 grid-cols-subgrid border-b border-b-black">
          <div />
          <div className="text-center text-sm py-1 text-dsfr-mention-grey">
            {jalon}
          </div>
        </div>

        {territoiresSelectionnes.map((territoire, index) => {
          const meteo = territoire.meteo as Météo;
          const dateMaj = territoire.dateDeMajQualitative
            ? new Date(territoire.dateDeMajQualitative).toLocaleDateString(
                "fr-FR",
              )
            : "—";
          const estInitial = initialTerritoiresCodes.includes(
            territoire.territoireCode,
          );
          const couleur = getCouleurTerritoire(index);

          return (
            <Fragment key={territoire.territoireCode}>
              <div className="py-2 grid grid-cols-[1fr_30px] items-center gap-2 border-b">
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
              <div className="py-2 flex flex-col items-center border-b">
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
