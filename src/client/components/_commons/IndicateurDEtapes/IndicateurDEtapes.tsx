import '@gouvfr/dsfr/dist/component/stepper/stepper.min.css';
import { FunctionComponent } from 'react';

interface IndicateurDEtapesProps {
  étapes: string[],
  étapeCourante: number
}

const IndicateurDEtapes: FunctionComponent<IndicateurDEtapesProps> = ({ étapes, étapeCourante }) => {
  const nombreDEtapes = étapes.length;
  const indexEtape = étapeCourante - 1;

  return (
    <div className='fr-stepper'>
      <h2 className='fr-stepper__title'>
        <span className='fr-stepper__state'>
          {`Étape ${étapeCourante} sur ${nombreDEtapes}`}
        </span>
        {` ${étapes[indexEtape]}`}
      </h2>
      <div
        className='fr-stepper__steps'
        data-fr-current-step={étapeCourante}
        data-fr-steps={nombreDEtapes}
      />
      {
        étapeCourante < nombreDEtapes &&
        <p className='fr-stepper__details'>
          <span className='fr-text--bold'>
            Étape suivante :
          </span>
          {' '}
          {étapes[étapeCourante]}
        </p>
      }
    </div>
  );
};
export default IndicateurDEtapes;
