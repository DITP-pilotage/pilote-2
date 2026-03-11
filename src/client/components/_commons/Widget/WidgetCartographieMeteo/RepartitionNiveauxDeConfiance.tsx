import { Fragment, FunctionComponent } from "react";
import { Météo, libellésMétéos } from "@/server/domain/météo/Météo.interface";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";
import {
  SelecteurNew,
  SelecteurNewOption,
} from "@/components/_commons/SelecteurNew/SelecteurNew";

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
  const options: SelecteurNewOption<string>[] = territoiresDisponibles.map(
    (territoire) => ({
      libelle: formaterNomTerritoire(territoire),
      valeur: territoire.territoireCode,
    }),
  );

  return (
    <div className="mt-4">
      <div className="grid grid-cols-2 border-y">
        <div />
        <div className="text-center font-bold py-2">{jalon}</div>

        {territoiresSelectionnes.map((territoire) => {
          const meteo = territoire.meteo as Météo;
          const dateMaj = territoire.dateDeMajQualitative
            ? new Date(territoire.dateDeMajQualitative).toLocaleDateString(
                "fr-FR",
              )
            : "—";
          const estInitial = initialTerritoiresCodes.includes(
            territoire.territoireCode,
          );

          return (
            <Fragment key={territoire.territoireCode}>
              <div className="py-2 flex items-center justify-between">
                <span>{formaterNomTerritoire(territoire)}</span>
                {!estInitial && (
                  <button
                    onClick={() =>
                      onSupprimerTerritoire(territoire.territoireCode)
                    }
                    title={`Retirer ${territoire.territoireNom}`}
                    type="button"
                  >
                    ✕
                  </button>
                )}
              </div>
              <div className="py-2">
                <div className="flex items-center gap-2">
                  <MeteoPicto meteo={meteo} />
                  <span>
                    {territoire.estApplicable === false
                      ? "Non applicable"
                      : libellésMétéos[meteo]}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{dateMaj}</p>
              </div>
            </Fragment>
          );
        })}
      </div>

      {territoiresDisponibles.length > 0 && (
        <SelecteurNew
          key={territoiresSelectionnes.length}
          htmlName="ajout-territoire-select"
          libelle="Ajouter un territoire"
          onChange={(valeur) => onAjouterTerritoire(valeur)}
          options={options}
          placeholder="+ ajouter un territoire"
        />
      )}
    </div>
  );
};
