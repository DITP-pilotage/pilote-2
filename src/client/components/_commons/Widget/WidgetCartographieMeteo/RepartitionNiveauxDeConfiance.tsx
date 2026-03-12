import { Fragment, FunctionComponent } from "react";
import { getCouleurTerritoire } from "@/client/utils/couleur/paletteTerritoires";
import { Météo, libellésMétéos } from "@/server/domain/météo/Météo.interface";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";
import { Picker, PickerOption } from "@/components/shared/Picker";
import { Select } from "@/components/shared/Select";

type RepartitionNiveauxDeConfianceProps = {
  territoiresSelectionnes: MeteoTerritoireViewModel[];
  territoiresDisponibles: MeteoTerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  onAjouterTerritoire: (territoireCode: string) => void;
  jalon: number;
  initialTerritoiresCodes: string[];
};

function formaterNomTerritoire(territoire: MeteoTerritoireViewModel): string {
  if (territoire.maille === "DEPT") {
    return `${territoire.codeInsee} - ${territoire.territoireNom}`;
  }
  return territoire.territoireNom;
}

export const RepartitionNiveauxDeConfiance: FunctionComponent<
  RepartitionNiveauxDeConfianceProps
> = ({
  territoiresSelectionnes,
  territoiresDisponibles,
  onSupprimerTerritoire,
  onAjouterTerritoire,
  jalon,
  initialTerritoiresCodes,
}) => {
  const options: PickerOption<string>[] = territoiresDisponibles.map(
    (territoire) => ({
      libelle: formaterNomTerritoire(territoire),
      valeur: territoire.territoireCode,
    }),
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

      {territoiresDisponibles.length > 0 && (
        <Picker
          key={territoiresSelectionnes.length}
          onValueChange={(valeur) => onAjouterTerritoire(valeur)}
          options={options}
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
