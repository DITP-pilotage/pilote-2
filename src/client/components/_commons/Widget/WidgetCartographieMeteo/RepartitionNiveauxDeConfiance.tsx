import { FunctionComponent } from "react";
import { Météo, libellésMétéos } from "@/server/domain/météo/Météo.interface";
import { MeteoPicto } from "@/components/_commons/Meteo/Picto/MeteoPicto";
import { MeteoTerritoireViewModel } from "@/server/chantiers/infrastructure/queries/GetChantierMeteosTerritoiresQuery";

type RepartitionNiveauxDeConfianceProps = {
  territoiresSelectionnes: MeteoTerritoireViewModel[];
  territoiresDisponibles: MeteoTerritoireViewModel[];
  onSupprimerTerritoire: (territoireCode: string) => void;
  onAjouterTerritoire: (territoireCode: string) => void;
};

export const RepartitionNiveauxDeConfiance: FunctionComponent<
  RepartitionNiveauxDeConfianceProps
> = ({
  territoiresSelectionnes,
  territoiresDisponibles,
  onSupprimerTerritoire,
  onAjouterTerritoire,
}) => {
  return (
    <div className="fr-mt-2w">
      <table className="fr-table fr-table--no-caption fr-mb-0">
        <thead>
          <tr>
            <th scope="col">Territoire</th>
            <th scope="col">Météo</th>
            <th scope="col">Date de MAJ</th>
            <th scope="col" />
          </tr>
        </thead>
        <tbody>
          {territoiresSelectionnes.map((territoire) => {
            const meteo = territoire.meteo as Météo;
            const dateMaj = territoire.dateDeMajQualitative
              ? new Date(territoire.dateDeMajQualitative).toLocaleDateString(
                  "fr-FR",
                )
              : "—";

            return (
              <tr key={territoire.territoireCode}>
                <td>{territoire.territoireNom}</td>
                <td>
                  <span className="fr-flex fr-flex--row fr-flex--middle">
                    <MeteoPicto meteo={meteo} />
                    <span className="fr-ml-1w">
                      {territoire.estApplicable === false
                        ? "Non applicable"
                        : libellésMétéos[meteo]}
                    </span>
                  </span>
                </td>
                <td>{dateMaj}</td>
                <td>
                  <button
                    className="fr-btn fr-btn--tertiary-no-outline fr-btn--sm"
                    onClick={() =>
                      onSupprimerTerritoire(territoire.territoireCode)
                    }
                    title={`Retirer ${territoire.territoireNom}`}
                    type="button"
                  >
                    ✕
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {territoiresDisponibles.length > 0 && (
        <div className="fr-mt-1w">
          <label
            className="fr-label fr-mb-1v"
            htmlFor="ajout-territoire-select"
          >
            Ajouter un territoire
          </label>
          <select
            className="fr-select"
            id="ajout-territoire-select"
            onChange={(event) => {
              if (event.target.value) {
                onAjouterTerritoire(event.target.value);
                event.target.value = "";
              }
            }}
          >
            <option value="">+ ajouter un territoire</option>
            {territoiresDisponibles.map((territoire) => (
              <option
                key={territoire.territoireCode}
                value={territoire.territoireCode}
              >
                {territoire.territoireNom}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};
