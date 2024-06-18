import { FunctionComponent } from 'react';
import AlerteProps from './Alerte.interface';
import '@gouvfr/dsfr/dist/component/alert/alert.min.css';

const Alerte: FunctionComponent<AlerteProps> = ({ type, titre, message, classesSupplementaires, classesMessagePolice }) => {
  return (
    <div
      className={`${type === 'succès' ? 'fr-alert--success' : type === 'warning' ? 'fr-alert--warning' : (type === 'erreur' ? 'fr-alert--error' : 'fr-alert--info')} fr-alert ${classesSupplementaires}`}
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
