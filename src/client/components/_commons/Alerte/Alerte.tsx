import AlerteProps from './Alerte.interface';
import '@gouvfr/dsfr/dist/component/alert/alert.min.css';

export default function Alerte({ type, titre, message }: AlerteProps) {
  return (
    <div className={`${type === 'succès' ? 'fr-alert--success' : 'fr-alert--error'} fr-alert`}>
      <h3 className='fr-alert__title'>
        {titre}
      </h3>
      {message ?
        <p>
          {message}
        </p>
        : null}
    </div>
  );
}
