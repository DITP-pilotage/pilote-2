import "@gouvfr/dsfr/dist/component/stepper/stepper.min.css";
import { FunctionComponent } from "react";

interface IndicateurDEtapesProps {
  étapes: string[];
  étapeCourante: number;
  sousTitreEtape?: string;
}

const IndicateurDEtapes: FunctionComponent<IndicateurDEtapesProps> = ({
  étapes,
  étapeCourante,
  sousTitreEtape,
}) => {
  const nombreDEtapes = étapes.length;
  const indexEtape = étapeCourante - 1;

  return (
    <div className="fr-stepper fr-mb-1w">
      <h2 className="fr-stepper__title">
        <span className="fr-stepper__state">
          {`${sousTitreEtape ? `${sousTitreEtape} - ` : ""}Étape ${étapeCourante} sur ${nombreDEtapes}`}
        </span>
        {` ${étapes[indexEtape]}`}
      </h2>
      <div
        className="fr-stepper__steps"
        data-fr-current-step={étapeCourante}
        data-fr-steps={nombreDEtapes}
      />
      {étapeCourante < nombreDEtapes && (
        <p className="fr-stepper__details">
          <span className="fr-text--bold">Étape suivante :</span>{" "}
          {étapes[étapeCourante]}
        </p>
      )}
    </div>
  );
};
export default IndicateurDEtapes;
