import { FunctionComponent } from 'react';
import AlerteProps, { typeAlerte } from './Alerte.interface';
import '@gouvfr/dsfr/dist/component/alert/alert.min.css';

const classesAlerte: Record<typeAlerte, string> = {
  'info': 'fr-alert--info',
  'succès': 'fr-alert--success',
  'warning': 'fr-alert--warning',
  'erreur': 'fr-alert--error',
};

const Alerte: FunctionComponent<AlerteProps> = ({ type, titre, message, classesSupplementaires, classesMessagePolice }) => {
  return (
    <div
      className={`${classesAlerte[type]} fr-alert ${classesSupplementaires}`}
    >
      {
        !!titre && 
          <h3 className='fr-alert__title'>
            {titre}
          </h3>
      }
      {message ?
        <p className={classesMessagePolice}>
          {message}
        </p>
        : null}
    </div>
  );
};

export default Alerte;
